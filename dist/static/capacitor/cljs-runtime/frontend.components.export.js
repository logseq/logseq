goog.provide('frontend.components.export$');
frontend.components.export$.auto_backup = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_backup_folder = new cljs.core.Keyword("frontend.components.export","folder","frontend.components.export/folder",-544848552).cljs$core$IFn$_invoke$arity$1(state);
var backup_folder = rum.core.react(_STAR_backup_folder);
var repo = frontend.state.get_current_repo();
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-4"},[daiquiri.core.create_element("div",{'className':"font-medium opacity-50"},["Schedule backup"]),(cljs.core.truth_(module$frontend$utils.nfsSupported())?(function (){var attrs74562 = (cljs.core.truth_(backup_folder)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1.text-sm","div.flex.flex-row.items-center.gap-1.text-sm",1556443449),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50","div.opacity-50",-874367312),"Backup folder:"], null),backup_folder,(function (){var G__74575 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1 !py-1",new cljs.core.Keyword(null,"title","title",636505583),"Change backup folder",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532)], null)], null))),(function (___40947__auto__){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_backup_folder,null));
}));
}));
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__74576 = frontend.ui.icon("edit");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__74575,G__74576) : logseq.shui.ui.button.call(null,G__74575,G__74576));
})()], null):(function (){var G__74577 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.choose_backup_folder(repo)),(function (p__74592){
var vec__74595 = p__74592;
var folder_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74595,(0),null);
var _handle = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74595,(1),null);
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_backup_folder,folder_name));
}));
}));
})], null);
var G__74578 = "Set backup folder first";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__74577,G__74578) : logseq.shui.ui.button.call(null,G__74577,G__74578));
})());
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs74562))?daiquiri.interpreter.element_attributes(attrs74562):null),((cljs.core.map_QMARK_(attrs74562))?[daiquiri.core.create_element("div",{'className':"opacity-50 text-sm"},["Backup will be created every hour."]),(cljs.core.truth_(backup_folder)?daiquiri.interpreter.interpret((function (){var G__74606 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.backup_db_graph(repo,new cljs.core.Keyword(null,"set-folder","set-folder",545286712))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__74610 = result;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,G__74610)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Backup successful!",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-not-changed","graph-not-changed",1463753852),G__74610)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Graph has not been updated since last export.",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;

}
}
})()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.export$.auto_db_backup_BANG_(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backup-now?","backup-now?",-918244579),false], null)));
}));
}));
})),(function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Failed to backup."], 0));

return console.error(error);
}));
})], null);
var G__74607 = "Backup now";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__74606,G__74607) : logseq.shui.ui.button.call(null,G__74606,G__74607));
})()):null)]:[daiquiri.interpreter.interpret(attrs74562),daiquiri.core.create_element("div",{'className':"opacity-50 text-sm"},["Backup will be created every hour."]),(cljs.core.truth_(backup_folder)?daiquiri.interpreter.interpret((function (){var G__74635 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.backup_db_graph(repo,new cljs.core.Keyword(null,"set-folder","set-folder",545286712))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__74637 = result;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,G__74637)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Backup successful!",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-not-changed","graph-not-changed",1463753852),G__74637)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Graph has not been updated since last export.",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;

}
}
})()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.export$.auto_db_backup_BANG_(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backup-now?","backup-now?",-918244579),false], null)));
}));
}));
})),(function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Failed to backup."], 0));

return console.error(error);
}));
})], null);
var G__74636 = "Backup now";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__74635,G__74636) : logseq.shui.ui.button.call(null,G__74635,G__74636));
})()):null)]));
})():daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",null,["Your browser doesn't support "]),daiquiri.core.create_element("a",{'href':"https://developer.chrome.com/docs/capabilities/web-apis/file-system-access",'target':"_blank"},["The File System Access API"]),daiquiri.core.create_element("span",null,[", please switch to a Chromium-based browser."])]))]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.export","folder","frontend.components.export/folder",-544848552),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(logseq.db.get_key_value((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532))));
})], null)], null),"frontend.components.export/auto-backup");
frontend.components.export$.export$ = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var current_repo = temp__5804__auto__;
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.export","div.export",-41470672),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.title.mb-8","h1.title.mb-8",-124034777),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export","export",214356590)], 0))], null),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-4.ml-1","div.flex.flex-col.gap-4.ml-1",859131354),((db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_edn_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-edn","export-edn",-319969369)], 0))], null)], null)),((db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_json_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-json","export-json",-629812380)], 0))], null)], null)),((db_based_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_sqlite_db_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-sqlite-db","export-sqlite-db",598980500)], 0))], null)], null):null),((db_based_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_zip_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-zip","export-zip",1141726392)], 0))], null)], null):null),((db_based_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.export$.export_repo_as_db_edn_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-db-edn","export-db-edn",-2010291621)], 0))], null)], null):null),(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.text.export_repo_as_markdown_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-markdown","export-markdown",2045533540)], 0))], null)], null)),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.download_repo_as_html_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-public-pages","export-public-pages",-2122765445)], 0))], null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return db_based_QMARK_;
}
})())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.opml.export_repo_as_opml_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-opml","export-opml",-636284218)], 0))], null)], null)),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return db_based_QMARK_;
}
})())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_roam_json_BANG_(current_repo);
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-roam-json","export-roam-json",631486448)], 0))], null)], null)),((db_based_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.font-medium","a.font-medium",-910158116),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_debug_transit_BANG_(current_repo);
})], null),"Export debug transit file"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.opacity-70.mb-0","p.text-sm.opacity-70.mb-0",-1327348047),"Any sensitive data will be removed in the exported transit file, you can send it to us for debugging."], null)], null):null),((((db_based_QMARK_) && (frontend.util.web_platform_QMARK_)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null),frontend.components.export$.auto_backup()], null):null)], null)], null);
} else {
return null;
}
})());
}),null,"frontend.components.export/export");
frontend.components.export$._STAR_export_block_type = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"text","text",-1790561697));
frontend.components.export$.text_indent_style_options = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"dashes",new cljs.core.Keyword(null,"selected","selected",574897764),false], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"spaces",new cljs.core.Keyword(null,"selected","selected",574897764),false], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"no-indent",new cljs.core.Keyword(null,"selected","selected",574897764),false], null)], null);
frontend.components.export$.export_helper = (function frontend$components$export$export_helper(top_level_ids){
var current_repo = frontend.state.get_current_repo();
var text_indent_style = frontend.state.get_export_block_text_indent_style();
var text_remove_options = cljs.core.set(frontend.state.get_export_block_text_remove_options());
var text_other_options = frontend.state.get_export_block_text_other_options();
var tp = cljs.core.deref(frontend.components.export$._STAR_export_block_type);
var G__74679 = tp;
var G__74679__$1 = (((G__74679 instanceof cljs.core.Keyword))?G__74679.fqn:null);
switch (G__74679__$1) {
case "text":
return frontend.handler.export$.text.export_blocks_as_markdown(current_repo,top_level_ids,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),text_indent_style,new cljs.core.Keyword(null,"remove-options","remove-options",768737839),text_remove_options,new cljs.core.Keyword(null,"other-options","other-options",170412142),text_other_options], null));

break;
case "opml":
return frontend.handler.export$.opml.export_blocks_as_opml(current_repo,top_level_ids,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-options","remove-options",768737839),text_remove_options,new cljs.core.Keyword(null,"other-options","other-options",170412142),text_other_options], null));

break;
case "html":
return frontend.handler.export$.html.export_blocks_as_html(current_repo,top_level_ids,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-options","remove-options",768737839),text_remove_options,new cljs.core.Keyword(null,"other-options","other-options",170412142),text_other_options], null));

break;
default:
return "";

}
});
frontend.components.export$._LT_export_edn_helper = (function frontend$components$export$_LT_export_edn_helper(root_block_uuids_or_page_uuid,export_type){
var export_args = (function (){var G__74684 = export_type;
var G__74684__$1 = (((G__74684 instanceof cljs.core.Keyword))?G__74684.fqn:null);
switch (G__74684__$1) {
case "page":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null)], null);

break;
case "block":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null)], null);

break;
case "selected-nodes":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node-ids","node-ids",2015830052),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__74683_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__74683_SHARP_],null));
}),root_block_uuids_or_page_uuid)], null);

break;
default:
return cljs.core.PersistentArrayMap.EMPTY;

}
})();
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),export_type], null),export_args], 0))], 0));
});
frontend.components.export$.get_zoom_level = (function frontend$components$export$get_zoom_level(page_uuid){
var uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid) : frontend.db.get_page.call(null,page_uuid)));
var whiteboard_camera = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(JSON.parse(sessionStorage.getItem(["logseq.tldraw.camera:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''))));
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(whiteboard_camera,"zoom");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
});
frontend.components.export$.get_image_blob = (function frontend$components$export$get_image_blob(block_uuids_or_page_name,p__74686,callback){
var map__74687 = p__74686;
var map__74687__$1 = cljs.core.__destructure_map(map__74687);
var transparent_bg_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"transparent-bg?","transparent-bg?",1544645013));
var x = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"x","x",2099068185));
var y = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"y","y",-1757859776));
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var height = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"height","height",1025178622));
var zoom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74687__$1,new cljs.core.Keyword(null,"zoom","zoom",-1827487038));
var top_block_id = ((cljs.core.coll_QMARK_(block_uuids_or_page_name))?cljs.core.first(block_uuids_or_page_name):block_uuids_or_page_name);
var style = window.getComputedStyle(document.body);
var background = (cljs.core.truth_(transparent_bg_QMARK_)?null:style.getPropertyValue("--ls-primary-background-color"));
var page_QMARK_ = (function (){var and__5000__auto__ = cljs.core.uuid_QMARK_(top_block_id);
if(and__5000__auto__){
var G__74688 = (function (){var G__74689 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),top_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74689) : frontend.db.entity.call(null,G__74689));
})();
return (frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__74688) : frontend.db.page_QMARK_.call(null,G__74688));
} else {
return and__5000__auto__;
}
})();
var selector = (cljs.core.truth_(page_QMARK_)?"#main-content-container":["[blockid='",cljs.core.str.cljs$core$IFn$_invoke$arity$1(top_block_id),"']"].join(''));
var container = document.querySelector(selector);
var scale = (cljs.core.truth_(page_QMARK_)?((1) / (function (){var or__5002__auto__ = zoom;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.components.export$.get_zoom_level(top_block_id);
}
})()):(1));
var options = ({"y": (function (){var or__5002__auto__ = (y / scale);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})(), "useCORS": true, "scrollX": (0), "scrollY": (0), "scale": scale, "width": (cljs.core.truth_(width)?(width / scale):null), "windowHeight": (cljs.core.truth_(page_QMARK_)?container.scrollHeight:null), "allowTaint": true, "x": (function (){var or__5002__auto__ = (x / scale);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})(), "backgroundColor": (function (){var or__5002__auto__ = background;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "transparent";
}
})(), "height": (cljs.core.truth_(height)?(height / scale):null)});
return html2canvas(container,options).then((function (canvas){
return canvas.toBlob((function (blob){
if(cljs.core.truth_(blob)){
var img = document.getElementById("export-preview");
var img_url = frontend.image.create_object_url(blob);
(img.src = img_url);

return (callback.cljs$core$IFn$_invoke$arity$1 ? callback.cljs$core$IFn$_invoke$arity$1(blob) : callback.call(null,blob));
} else {
return null;
}
}),"image/png");
}));
});
frontend.components.export$.get_top_level_uuids = (function frontend$components$export$get_top_level_uuids(selection_ids){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.handler.block.get_top_level_blocks(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__74693_SHARP_){
var G__74695 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__74693_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74695) : frontend.db.entity.call(null,G__74695));
}),selection_ids)));
});
frontend.components.export$.export_blocks = rum.core.lazy_build(rum.core.build_defcs,(function (state,_selection_ids,p__74711){
var map__74712 = p__74711;
var map__74712__$1 = cljs.core.__destructure_map(map__74712);
var options = map__74712__$1;
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74712__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
var export_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74712__$1,new cljs.core.Keyword(null,"export-type","export-type",-2087639167));
var top_level_uuids = new cljs.core.Keyword("frontend.components.export","top-level-uuids","frontend.components.export/top-level-uuids",-515625013).cljs$core$IFn$_invoke$arity$1(state);
var tp = cljs.core.deref(frontend.components.export$._STAR_export_block_type);
var _STAR_text_other_options = new cljs.core.Keyword("frontend.components.export","text-other-options","frontend.components.export/text-other-options",-180643399).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_text_remove_options = new cljs.core.Keyword("frontend.components.export","text-remove-options","frontend.components.export/text-remove-options",2122633606).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_text_indent_style = new cljs.core.Keyword("frontend.components.export","text-indent-style","frontend.components.export/text-indent-style",-1413931363).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_copied_QMARK_ = new cljs.core.Keyword("frontend.components.export","copied?","frontend.components.export/copied?",2118939016).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_content = new cljs.core.Keyword("frontend.components.export","content","frontend.components.export/content",-1876994088).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",{'className':"export resize -m-5"},[(function (){var attrs74764 = (cljs.core.truth_(whiteboard_QMARK_)?null:new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.pb-3","div.flex.pb-3",164469529),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Text",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4 w-20",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,new cljs.core.Keyword(null,"text","text",-1790561697));

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], 0)),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("OPML",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4 w-20",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,new cljs.core.Keyword(null,"opml","opml",2114938640));

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], 0)),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("HTML",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4 w-20",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,new cljs.core.Keyword(null,"html","html",-998796897));

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], 0)),((cljs.core.seq_QMARK_(top_level_uuids))?null:frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("PNG",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4 w-20",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,new cljs.core.Keyword(null,"png","png",551930691));

cljs.core.reset_BANG_(_STAR_content,null);

return frontend.components.export$.get_image_blob(top_level_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transparent-bg?","transparent-bg?",1544645013),false], null)], 0)),(function (blob){
return cljs.core.reset_BANG_(_STAR_content,blob);
}));
})], 0))),(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("EDN",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"w-20",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,new cljs.core.Keyword(null,"edn","edn",1317840885));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.export$._LT_export_edn_helper(top_level_uuids,export_type)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__74772_75324 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__74773_75325 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__74774_75326 = true;
var _STAR_print_fn_STAR__temp_val__74775_75327 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__74774_75326);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__74775_75327);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__74773_75325);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__74772_75324);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:cljs.core.reset_BANG_(_STAR_content,pull_data)));
}));
}));
}));
})], 0)):null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74764))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-6"], null)], null),attrs74764], 0))):{'className':"p-6"}),((cljs.core.map_QMARK_(attrs74764))?[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"png","png",551930691),tp))?(function (){var attrs74786 = ((cljs.core.not(cljs.core.deref(_STAR_content)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute","div.absolute",1404644568),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74786))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","justify-center","relative"], null)], null),attrs74786], 0))):{'className':"flex items-center justify-center relative"}),((cljs.core.map_QMARK_(attrs74786))?[daiquiri.core.create_element("img",{'alt':"export preview",'id':"export-preview",'style':{'visibility':((cljs.core.not(cljs.core.deref(_STAR_content)))?"hidden":null)},'className':"my-4"},[])]:[daiquiri.interpreter.interpret(attrs74786),daiquiri.core.create_element("img",{'alt':"export preview",'id':"export-preview",'style':{'visibility':((cljs.core.not(cljs.core.deref(_STAR_content)))?"hidden":null)},'className':"my-4"},[])]));
})():daiquiri.core.create_element("textarea",{'value':cljs.core.deref(_STAR_content),'readOnly':true,'className':"overflow-y-auto h-96"},[])),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"png","png",551930691),tp))?daiquiri.core.create_element("div",{'className':"flex items-center"},[(function (){var attrs74791 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-transparent-background","export-transparent-background",-1052843380)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74791))?daiquiri.interpreter.element_attributes(attrs74791):null),((cljs.core.map_QMARK_(attrs74791))?null:[daiquiri.interpreter.interpret(attrs74791)]));
})(),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
cljs.core.reset_BANG_(_STAR_content,null);

return frontend.components.export$.get_image_blob(top_level_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transparent-bg?","transparent-bg?",1544645013),e.currentTarget.checked], null)], 0)),(function (blob){
return cljs.core.reset_BANG_(_STAR_content,blob);
}));
})], null)))]):(function (){var options__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (opt){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_text_indent_style),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(opt))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opt,new cljs.core.Keyword(null,"selected","selected",574897764),true);
} else {
return opt;
}
}),frontend.components.export$.text_indent_style_options);
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"flex items-center"},[daiquiri.core.create_element("label",{'style':{'visibility':((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),tp))?"visible":"hidden")},'className':"mr-4"},["Indentation style:"]),daiquiri.core.create_element("select",{'style':{'visibility':((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),tp))?"visible":"hidden")},'onChange':rum.core.mark_sync_update((function (e){
var value = frontend.util.evalue(e);
frontend.state.set_export_block_text_indent_style_BANG_(value);

cljs.core.reset_BANG_(_STAR_text_indent_style,value);

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})),'className':"block my-2 text-lg rounded border py-0 px-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$export$iter__74819(s__74820){
return (new cljs.core.LazySeq(null,(function (){
var s__74820__$1 = s__74820;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74820__$1);
if(temp__5804__auto__){
var s__74820__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74820__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74820__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74822 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74821 = (0);
while(true){
if((i__74821 < size__5479__auto__)){
var map__74825 = cljs.core._nth(c__5478__auto__,i__74821);
var map__74825__$1 = cljs.core.__destructure_map(map__74825);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74825__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74825__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74825__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__74822,(function (){var attrs74818 = (function (){var G__74826 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74826,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__74826;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs74818))?daiquiri.interpreter.element_attributes(attrs74818):null),((cljs.core.map_QMARK_(attrs74818))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs74818),daiquiri.interpreter.interpret(label)]));
})());

var G__75341 = (i__74821 + (1));
i__74821 = G__75341;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74822),frontend$components$export$iter__74819(cljs.core.chunk_rest(s__74820__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74822),null);
}
} else {
var map__74834 = cljs.core.first(s__74820__$2);
var map__74834__$1 = cljs.core.__destructure_map(map__74834);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74834__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74834__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74834__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons((function (){var attrs74818 = (function (){var G__74835 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74835,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__74835;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs74818))?daiquiri.interpreter.element_attributes(attrs74818):null),((cljs.core.map_QMARK_(attrs74818))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs74818),daiquiri.interpreter.interpret(label)]));
})(),frontend$components$export$iter__74819(cljs.core.rest(s__74820__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options__$1);
})())])]),(function (){var attrs74805 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74842 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74842.cljs$core$IFn$_invoke$arity$1 ? fexpr__74842.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74842.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74805))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs74805], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs74805))?[daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74846 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74846.cljs$core$IFn$_invoke$arity$1 ? fexpr__74846.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74846.call(null,tp));
})())?"visible":"hidden")}},["[[text]] -> text"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74864 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74864.cljs$core$IFn$_invoke$arity$1 ? fexpr__74864.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74864.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"emphasis","emphasis",293543451));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74879 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74879.cljs$core$IFn$_invoke$arity$1 ? fexpr__74879.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74879.call(null,tp));
})())?"visible":"hidden")}},["remove emphasis"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74912 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74912.cljs$core$IFn$_invoke$arity$1 ? fexpr__74912.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74912.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"tag","tag",-1290361223));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74925 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74925.cljs$core$IFn$_invoke$arity$1 ? fexpr__74925.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74925.call(null,tp));
})())?"visible":"hidden")}},["remove #tags"])]:[daiquiri.interpreter.interpret(attrs74805),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74933 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74933.cljs$core$IFn$_invoke$arity$1 ? fexpr__74933.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74933.call(null,tp));
})())?"visible":"hidden")}},["[[text]] -> text"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74968 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74968.cljs$core$IFn$_invoke$arity$1 ? fexpr__74968.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74968.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"emphasis","emphasis",293543451));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74971 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74971.cljs$core$IFn$_invoke$arity$1 ? fexpr__74971.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74971.call(null,tp));
})())?"visible":"hidden")}},["remove emphasis"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74973 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74973.cljs$core$IFn$_invoke$arity$1 ? fexpr__74973.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74973.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"tag","tag",-1290361223));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74977 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74977.cljs$core$IFn$_invoke$arity$1 ? fexpr__74977.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74977.call(null,tp));
})())?"visible":"hidden")}},["remove #tags"])]));
})(),(function (){var attrs74814 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74980 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74980.cljs$core$IFn$_invoke$arity$1 ? fexpr__74980.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74980.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.boolean$(new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_text_other_options))),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_other_options_BANG_(new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),cljs.core.boolean$(frontend.util.echecked_QMARK_(e)));

cljs.core.reset_BANG_(_STAR_text_other_options,frontend.state.get_export_block_text_other_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74814))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs74814], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs74814))?[daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74984 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74984.cljs$core$IFn$_invoke$arity$1 ? fexpr__74984.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74984.call(null,tp));
})())?"visible":"hidden")}},["newline after block"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__74989 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74989.cljs$core$IFn$_invoke$arity$1 ? fexpr__74989.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74989.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"property","property",-1114278232)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"property","property",-1114278232));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74993 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74993.cljs$core$IFn$_invoke$arity$1 ? fexpr__74993.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74993.call(null,tp));
})())?"visible":"hidden")}},["remove properties"])]:[daiquiri.interpreter.interpret(attrs74814),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__74995 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__74995.cljs$core$IFn$_invoke$arity$1 ? fexpr__74995.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__74995.call(null,tp));
})())?"visible":"hidden")}},["newline after block"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75000 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75000.cljs$core$IFn$_invoke$arity$1 ? fexpr__75000.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75000.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"property","property",-1114278232)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"property","property",-1114278232));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75002 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75002.cljs$core$IFn$_invoke$arity$1 ? fexpr__75002.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75002.call(null,tp));
})())?"visible":"hidden")}},["remove properties"])]));
})(),daiquiri.core.create_element("div",{'className':"flex items-center"},[daiquiri.core.create_element("label",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75005 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75005.cljs$core$IFn$_invoke$arity$1 ? fexpr__75005.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75005.call(null,tp));
})())?"visible":"hidden")},'className':"mr-2"},["level <="]),daiquiri.core.create_element("select",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75006 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75006.cljs$core$IFn$_invoke$arity$1 ? fexpr__75006.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75006.call(null,tp));
})())?"visible":"hidden")},'value':(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_text_other_options));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"all","all",892129742);
}
})(),'onChange':rum.core.mark_sync_update((function (e){
var value = frontend.util.evalue(e);
var level = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("all",value))?new cljs.core.Keyword(null,"all","all",892129742):frontend.util.safe_parse_int(value));
frontend.state.update_export_block_text_other_options_BANG_(new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),level);

cljs.core.reset_BANG_(_STAR_text_other_options,frontend.state.get_export_block_text_other_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})),'className':"block my-2 text-lg rounded border px-2 py-0"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$export$iter__75010(s__75011){
return (new cljs.core.LazySeq(null,(function (){
var s__75011__$1 = s__75011;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__75011__$1);
if(temp__5804__auto__){
var s__75011__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__75011__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__75011__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__75013 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__75012 = (0);
while(true){
if((i__75012 < size__5479__auto__)){
var n = cljs.core._nth(c__5478__auto__,i__75012);
cljs.core.chunk_append(b__75013,daiquiri.core.create_element("option",{'key':n,'value':n},[daiquiri.interpreter.interpret(n)]));

var G__75395 = (i__75012 + (1));
i__75012 = G__75395;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__75013),frontend$components$export$iter__75010(cljs.core.chunk_rest(s__75011__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__75013),null);
}
} else {
var n = cljs.core.first(s__75011__$2);
return cljs.core.cons(daiquiri.core.create_element("option",{'key':n,'value':n},[daiquiri.interpreter.interpret(n)]),frontend$components$export$iter__75010(cljs.core.rest(s__75011__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.cons("all",cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(10))));
})())])])]);
})()),(cljs.core.truth_(cljs.core.deref(_STAR_content))?(function (){var attrs74770 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(cljs.core.deref(_STAR_copied_QMARK_))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-copied-to-clipboard","export-copied-to-clipboard",1088136181)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-copy-to-clipboard","export-copy-to-clipboard",-872022684)], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"png","png",551930691))){
navigator.clipboard.write(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new ClipboardItem(({"image/png": cljs.core.deref(_STAR_content)})))], null));
} else {
frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(_STAR_content),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html","html",-998796897),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"html","html",-998796897)))?cljs.core.deref(_STAR_content):null)], 0));
}

return cljs.core.reset_BANG_(_STAR_copied_QMARK_,true);
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74770))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-4","flex","flex-row","gap-2"], null)], null),attrs74770], 0))):{'className':"mt-4 flex flex-row gap-2"}),((cljs.core.map_QMARK_(attrs74770))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-save-to-file","export-save-to-file",1951446638)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var file_name = ((cljs.core.uuid_QMARK_(top_level_uuids))?(function (){var G__75029 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(top_level_uuids) : frontend.db.get_page.call(null,top_level_uuids));
return (frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1 ? frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1(G__75029) : frontend.util.get_page_title.call(null,G__75029));
})():cljs_time.core.now());
return module$frontend$utils.saveToFile((new Blob(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(_STAR_content)], null))),["logseq_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_name)].join(''),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"text","text",-1790561697)))?"txt":cljs.core.name(tp)));
})], 0)))]:[daiquiri.interpreter.interpret(attrs74770),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-save-to-file","export-save-to-file",1951446638)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var file_name = ((cljs.core.uuid_QMARK_(top_level_uuids))?(function (){var G__75032 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(top_level_uuids) : frontend.db.get_page.call(null,top_level_uuids));
return (frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1 ? frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1(G__75032) : frontend.util.get_page_title.call(null,G__75032));
})():cljs_time.core.now());
return module$frontend$utils.saveToFile((new Blob(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(_STAR_content)], null))),["logseq_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_name)].join(''),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"text","text",-1790561697)))?"txt":cljs.core.name(tp)));
})], 0)))]));
})():null)]:[daiquiri.interpreter.interpret(attrs74764),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"png","png",551930691),tp))?(function (){var attrs75035 = ((cljs.core.not(cljs.core.deref(_STAR_content)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute","div.absolute",1404644568),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75035))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","justify-center","relative"], null)], null),attrs75035], 0))):{'className':"flex items-center justify-center relative"}),((cljs.core.map_QMARK_(attrs75035))?[daiquiri.core.create_element("img",{'alt':"export preview",'id':"export-preview",'style':{'visibility':((cljs.core.not(cljs.core.deref(_STAR_content)))?"hidden":null)},'className':"my-4"},[])]:[daiquiri.interpreter.interpret(attrs75035),daiquiri.core.create_element("img",{'alt':"export preview",'id':"export-preview",'style':{'visibility':((cljs.core.not(cljs.core.deref(_STAR_content)))?"hidden":null)},'className':"my-4"},[])]));
})():daiquiri.core.create_element("textarea",{'value':cljs.core.deref(_STAR_content),'readOnly':true,'className':"overflow-y-auto h-96"},[])),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"png","png",551930691),tp))?daiquiri.core.create_element("div",{'className':"flex items-center"},[(function (){var attrs75042 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-transparent-background","export-transparent-background",-1052843380)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75042))?daiquiri.interpreter.element_attributes(attrs75042):null),((cljs.core.map_QMARK_(attrs75042))?null:[daiquiri.interpreter.interpret(attrs75042)]));
})(),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
cljs.core.reset_BANG_(_STAR_content,null);

return frontend.components.export$.get_image_blob(top_level_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transparent-bg?","transparent-bg?",1544645013),e.currentTarget.checked], null)], 0)),(function (blob){
return cljs.core.reset_BANG_(_STAR_content,blob);
}));
})], null)))]):(function (){var options__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (opt){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_text_indent_style),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(opt))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opt,new cljs.core.Keyword(null,"selected","selected",574897764),true);
} else {
return opt;
}
}),frontend.components.export$.text_indent_style_options);
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"flex items-center"},[daiquiri.core.create_element("label",{'style':{'visibility':((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),tp))?"visible":"hidden")},'className':"mr-4"},["Indentation style:"]),daiquiri.core.create_element("select",{'style':{'visibility':((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),tp))?"visible":"hidden")},'onChange':rum.core.mark_sync_update((function (e){
var value = frontend.util.evalue(e);
frontend.state.set_export_block_text_indent_style_BANG_(value);

cljs.core.reset_BANG_(_STAR_text_indent_style,value);

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})),'className':"block my-2 text-lg rounded border py-0 px-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$export$iter__75084(s__75085){
return (new cljs.core.LazySeq(null,(function (){
var s__75085__$1 = s__75085;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__75085__$1);
if(temp__5804__auto__){
var s__75085__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__75085__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__75085__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__75087 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__75086 = (0);
while(true){
if((i__75086 < size__5479__auto__)){
var map__75090 = cljs.core._nth(c__5478__auto__,i__75086);
var map__75090__$1 = cljs.core.__destructure_map(map__75090);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75090__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75090__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75090__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__75087,(function (){var attrs75083 = (function (){var G__75092 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__75092,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__75092;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs75083))?daiquiri.interpreter.element_attributes(attrs75083):null),((cljs.core.map_QMARK_(attrs75083))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs75083),daiquiri.interpreter.interpret(label)]));
})());

var G__75411 = (i__75086 + (1));
i__75086 = G__75411;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__75087),frontend$components$export$iter__75084(cljs.core.chunk_rest(s__75085__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__75087),null);
}
} else {
var map__75096 = cljs.core.first(s__75085__$2);
var map__75096__$1 = cljs.core.__destructure_map(map__75096);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75096__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75096__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__75096__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons((function (){var attrs75083 = (function (){var G__75098 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__75098,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__75098;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs75083))?daiquiri.interpreter.element_attributes(attrs75083):null),((cljs.core.map_QMARK_(attrs75083))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs75083),daiquiri.interpreter.interpret(label)]));
})(),frontend$components$export$iter__75084(cljs.core.rest(s__75085__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options__$1);
})())])]),(function (){var attrs75051 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75103 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75103.cljs$core$IFn$_invoke$arity$1 ? fexpr__75103.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75103.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75051))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs75051], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs75051))?[daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75106 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75106.cljs$core$IFn$_invoke$arity$1 ? fexpr__75106.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75106.call(null,tp));
})())?"visible":"hidden")}},["[[text]] -> text"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75112 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75112.cljs$core$IFn$_invoke$arity$1 ? fexpr__75112.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75112.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"emphasis","emphasis",293543451));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75113 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75113.cljs$core$IFn$_invoke$arity$1 ? fexpr__75113.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75113.call(null,tp));
})())?"visible":"hidden")}},["remove emphasis"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75116 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75116.cljs$core$IFn$_invoke$arity$1 ? fexpr__75116.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75116.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"tag","tag",-1290361223));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75117 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75117.cljs$core$IFn$_invoke$arity$1 ? fexpr__75117.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75117.call(null,tp));
})())?"visible":"hidden")}},["remove #tags"])]:[daiquiri.interpreter.interpret(attrs75051),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75124 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75124.cljs$core$IFn$_invoke$arity$1 ? fexpr__75124.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75124.call(null,tp));
})())?"visible":"hidden")}},["[[text]] -> text"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75132 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75132.cljs$core$IFn$_invoke$arity$1 ? fexpr__75132.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75132.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"emphasis","emphasis",293543451));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75135 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75135.cljs$core$IFn$_invoke$arity$1 ? fexpr__75135.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75135.call(null,tp));
})())?"visible":"hidden")}},["remove emphasis"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75140 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75140.cljs$core$IFn$_invoke$arity$1 ? fexpr__75140.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75140.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"tag","tag",-1290361223));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75142 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75142.cljs$core$IFn$_invoke$arity$1 ? fexpr__75142.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75142.call(null,tp));
})())?"visible":"hidden")}},["remove #tags"])]));
})(),(function (){var attrs75054 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75145 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75145.cljs$core$IFn$_invoke$arity$1 ? fexpr__75145.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75145.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.boolean$(new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_text_other_options))),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_other_options_BANG_(new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),cljs.core.boolean$(frontend.util.echecked_QMARK_(e)));

cljs.core.reset_BANG_(_STAR_text_other_options,frontend.state.get_export_block_text_other_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75054))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs75054], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs75054))?[daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75148 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75148.cljs$core$IFn$_invoke$arity$1 ? fexpr__75148.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75148.call(null,tp));
})())?"visible":"hidden")}},["newline after block"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75150 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75150.cljs$core$IFn$_invoke$arity$1 ? fexpr__75150.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75150.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"property","property",-1114278232)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"property","property",-1114278232));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75151 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75151.cljs$core$IFn$_invoke$arity$1 ? fexpr__75151.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75151.call(null,tp));
})())?"visible":"hidden")}},["remove properties"])]:[daiquiri.interpreter.interpret(attrs75054),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75153 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75153.cljs$core$IFn$_invoke$arity$1 ? fexpr__75153.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75153.call(null,tp));
})())?"visible":"hidden")}},["newline after block"]),daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2 ml-4",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visibility","visibility",1338380893),(cljs.core.truth_((function (){var fexpr__75162 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75162.cljs$core$IFn$_invoke$arity$1 ? fexpr__75162.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75162.call(null,tp));
})())?"visible":"hidden")], null),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.contains_QMARK_(cljs.core.deref(_STAR_text_remove_options),new cljs.core.Keyword(null,"property","property",-1114278232)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
frontend.state.update_export_block_text_remove_options_BANG_(e,new cljs.core.Keyword(null,"property","property",-1114278232));

cljs.core.reset_BANG_(_STAR_text_remove_options,frontend.state.get_export_block_text_remove_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})], null))),daiquiri.core.create_element("div",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75166 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75166.cljs$core$IFn$_invoke$arity$1 ? fexpr__75166.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75166.call(null,tp));
})())?"visible":"hidden")}},["remove properties"])]));
})(),daiquiri.core.create_element("div",{'className':"flex items-center"},[daiquiri.core.create_element("label",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75167 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75167.cljs$core$IFn$_invoke$arity$1 ? fexpr__75167.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75167.call(null,tp));
})())?"visible":"hidden")},'className':"mr-2"},["level <="]),daiquiri.core.create_element("select",{'style':{'visibility':(cljs.core.truth_((function (){var fexpr__75171 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"opml","opml",2114938640),null,new cljs.core.Keyword(null,"html","html",-998796897),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null);
return (fexpr__75171.cljs$core$IFn$_invoke$arity$1 ? fexpr__75171.cljs$core$IFn$_invoke$arity$1(tp) : fexpr__75171.call(null,tp));
})())?"visible":"hidden")},'value':(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_text_other_options));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"all","all",892129742);
}
})(),'onChange':rum.core.mark_sync_update((function (e){
var value = frontend.util.evalue(e);
var level = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("all",value))?new cljs.core.Keyword(null,"all","all",892129742):frontend.util.safe_parse_int(value));
frontend.state.update_export_block_text_other_options_BANG_(new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),level);

cljs.core.reset_BANG_(_STAR_text_other_options,frontend.state.get_export_block_text_other_options());

return cljs.core.reset_BANG_(_STAR_content,frontend.components.export$.export_helper(top_level_uuids));
})),'className':"block my-2 text-lg rounded border px-2 py-0"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$export$iter__75172(s__75173){
return (new cljs.core.LazySeq(null,(function (){
var s__75173__$1 = s__75173;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__75173__$1);
if(temp__5804__auto__){
var s__75173__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__75173__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__75173__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__75175 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__75174 = (0);
while(true){
if((i__75174 < size__5479__auto__)){
var n = cljs.core._nth(c__5478__auto__,i__75174);
cljs.core.chunk_append(b__75175,daiquiri.core.create_element("option",{'key':n,'value':n},[daiquiri.interpreter.interpret(n)]));

var G__75454 = (i__75174 + (1));
i__75174 = G__75454;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__75175),frontend$components$export$iter__75172(cljs.core.chunk_rest(s__75173__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__75175),null);
}
} else {
var n = cljs.core.first(s__75173__$2);
return cljs.core.cons(daiquiri.core.create_element("option",{'key':n,'value':n},[daiquiri.interpreter.interpret(n)]),frontend$components$export$iter__75172(cljs.core.rest(s__75173__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.cons("all",cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(10))));
})())])])]);
})()),(cljs.core.truth_(cljs.core.deref(_STAR_content))?(function (){var attrs74771 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(cljs.core.deref(_STAR_copied_QMARK_))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-copied-to-clipboard","export-copied-to-clipboard",1088136181)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-copy-to-clipboard","export-copy-to-clipboard",-872022684)], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"mr-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"png","png",551930691))){
navigator.clipboard.write(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new ClipboardItem(({"image/png": cljs.core.deref(_STAR_content)})))], null));
} else {
frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(_STAR_content),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html","html",-998796897),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"html","html",-998796897)))?cljs.core.deref(_STAR_content):null)], 0));
}

return cljs.core.reset_BANG_(_STAR_copied_QMARK_,true);
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74771))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-4","flex","flex-row","gap-2"], null)], null),attrs74771], 0))):{'className':"mt-4 flex flex-row gap-2"}),((cljs.core.map_QMARK_(attrs74771))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-save-to-file","export-save-to-file",1951446638)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var file_name = ((cljs.core.uuid_QMARK_(top_level_uuids))?(function (){var G__75188 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(top_level_uuids) : frontend.db.get_page.call(null,top_level_uuids));
return (frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1 ? frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1(G__75188) : frontend.util.get_page_title.call(null,G__75188));
})():cljs_time.core.now());
return module$frontend$utils.saveToFile((new Blob(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(_STAR_content)], null))),["logseq_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_name)].join(''),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"text","text",-1790561697)))?"txt":cljs.core.name(tp)));
})], 0)))]:[daiquiri.interpreter.interpret(attrs74771),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-save-to-file","export-save-to-file",1951446638)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var file_name = ((cljs.core.uuid_QMARK_(top_level_uuids))?(function (){var G__75194 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(top_level_uuids) : frontend.db.get_page.call(null,top_level_uuids));
return (frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1 ? frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1(G__75194) : frontend.util.get_page_title.call(null,G__75194));
})():cljs_time.core.now());
return module$frontend$utils.saveToFile((new Blob(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(_STAR_content)], null))),["logseq_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_name)].join(''),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,new cljs.core.Keyword(null,"text","text",-1790561697)))?"txt":cljs.core.name(tp)));
})], 0)))]));
})():null)]));
})()]);
}),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.export","copied?","frontend.components.export/copied?",2118939016)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.export","text-remove-options","frontend.components.export/text-remove-options",2122633606)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.export","text-indent-style","frontend.components.export/text-indent-style",-1413931363)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.export","text-other-options","frontend.components.export/text-other-options",-180643399)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.export","content","frontend.components.export/content",-1876994088)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var top_level_uuids = frontend.components.export$.get_top_level_uuids(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
cljs.core.reset_BANG_(frontend.components.export$._STAR_export_block_type,(cljs.core.truth_(new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))?new cljs.core.Keyword(null,"png","png",551930691):new cljs.core.Keyword(null,"text","text",-1790561697)));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.export$._STAR_export_block_type),new cljs.core.Keyword(null,"png","png",551930691))){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","content","frontend.components.export/content",-1876994088).cljs$core$IFn$_invoke$arity$1(state),null);

frontend.components.export$.get_image_blob(top_level_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.second(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transparent-bg?","transparent-bg?",1544645013),false], null)], 0)),(function (blob){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","content","frontend.components.export/content",-1876994088).cljs$core$IFn$_invoke$arity$1(state),blob);
}));
} else {
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","content","frontend.components.export/content",-1876994088).cljs$core$IFn$_invoke$arity$1(state),frontend.components.export$.export_helper(top_level_uuids));
}

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","text-remove-options","frontend.components.export/text-remove-options",2122633606).cljs$core$IFn$_invoke$arity$1(state),cljs.core.set(frontend.state.get_export_block_text_remove_options()));

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","text-indent-style","frontend.components.export/text-indent-style",-1413931363).cljs$core$IFn$_invoke$arity$1(state),frontend.state.get_export_block_text_indent_style());

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.export","text-other-options","frontend.components.export/text-other-options",-180643399).cljs$core$IFn$_invoke$arity$1(state),frontend.state.get_export_block_text_other_options());

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.export","top-level-uuids","frontend.components.export/top-level-uuids",-515625013),top_level_uuids);
})], null)], null),"frontend.components.export/export-blocks");

//# sourceMappingURL=frontend.components.export.js.map
