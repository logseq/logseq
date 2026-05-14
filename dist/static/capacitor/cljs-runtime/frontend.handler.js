goog.provide('frontend.handler');
goog.scope(function(){
  frontend.handler.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.set_global_error_notification_BANG_ = (function frontend$handler$set_global_error_notification_BANG_(){
if(cljs.core.truth_(frontend.config.dev_QMARK_)){
return null;
} else {
return (window.onerror = (function (message,_source,_lineno,_colno,error){
if(frontend.error.ignored_QMARK_(message)){
return null;
} else {
console.error(message);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),52], null)),error);
}
}));
}
});
frontend.handler.watch_for_date_BANG_ = (function frontend$handler$watch_for_date_BANG_(){
var f = (function (){
var repo = frontend.state.get_current_repo();
if(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) || (((cljs.core.not(frontend.state.nfs_refreshing_QMARK_())) && ((!(cljs.core.contains_QMARK_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),frontend.config.get_repo_dir(repo))))))))){
return frontend.handler.page.create_today_journal_BANG_();
} else {
return null;
}
});
f();

return setInterval(f,(5000));
});
frontend.handler.restore_and_setup_BANG_ = (function frontend$handler$restore_and_setup_BANG_(repo){
if(cljs.core.truth_(repo)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.restore.restore_graph_BANG_(repo)),(function (_){
return promesa.protocols._promise(frontend.handler.repo_config.start(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null)));
}));
})),(function (){
frontend.handler.ui.add_style_if_exists_BANG_();

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?frontend.handler.global_config.start(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null)):null)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(frontend.config.plugin_config_enabled_QMARK_())?frontend.handler.plugin_config.start():null));
}));
})),(function (){
frontend.modules.shortcut.core.refresh_BANG_();

return frontend.state.set_db_restoring_BANG_(false);
}));
})),(function (){
console.log("db restored, setting up repo hooks");

frontend.handler.page.init_commands_BANG_();

frontend.handler.watch_for_date_BANG_();

if(cljs.core.truth_((function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
return frontend.util.electron_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.file_based.file.watch_for_current_graph_dir_BANG_();
} else {
return null;
}
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),100], null)),error);
}));
} else {
return null;
}
});
frontend.handler.handle_connection_change = (function frontend$handler$handle_connection_change(e){
var online_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.goog$module$goog$object.get(e,"type"),"online");
return frontend.state.set_online_BANG_(online_QMARK_);
});
frontend.handler.set_network_watcher_BANG_ = (function frontend$handler$set_network_watcher_BANG_(){
window.addEventListener("online",frontend.handler.handle_connection_change);

return window.addEventListener("offline",frontend.handler.handle_connection_change);
});
frontend.handler.register_components_fns_BANG_ = (function frontend$handler$register_components_fns_BANG_(){
frontend.state.set_page_blocks_cp_BANG_(frontend.components.page.page_cp);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","->hiccup","block/->hiccup",1095099532),frontend.components.block.__GT_hiccup);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","linked-references","block/linked-references",-2022711478),frontend.components.reference.references);

frontend.state.set_component_BANG_(new cljs.core.Keyword("whiteboard","tldraw-preview","whiteboard/tldraw-preview",663400157),frontend.components.whiteboard.tldraw_preview);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","single-block","block/single-block",-1166935635),frontend.components.block.single_block_cp);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","container","block/container",510671002),frontend.components.block.block_container);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","inline-title","block/inline-title",984777401),frontend.components.block.inline_title);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","breadcrumb","block/breadcrumb",1725167425),frontend.components.block.breadcrumb);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","reference","block/reference",1588749254),frontend.components.block.block_reference);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","blocks-container","block/blocks-container",409697112),frontend.components.block.blocks_container);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","properties-cp","block/properties-cp",-1663328285),frontend.components.block.db_properties_cp);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","embed","block/embed",148991792),frontend.components.block.block_embed);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274),frontend.components.block.page_cp);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","inline-text","block/inline-text",607091413),frontend.components.block.inline_text);

frontend.state.set_component_BANG_(new cljs.core.Keyword("block","asset-cp","block/asset-cp",1438941908),frontend.components.block.asset_cp);

frontend.state.set_component_BANG_(new cljs.core.Keyword("editor","box","editor/box",-1921770435),frontend.components.editor.box);

frontend.state.set_component_BANG_(new cljs.core.Keyword("selection","context-menu","selection/context-menu",1845974273),frontend.components.content.custom_context_menu_content);

return frontend.handler.command_palette.register_global_shortcut_commands();
});
frontend.handler.get_system_info = (function frontend$handler$get_system_info(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("system","info","system/info",-1203399931)], 0))),(function (info){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("system","info","system/info",-1203399931),cljs_bean.core.__GT_clj(info)));
}));
}));
} else {
return null;
}
});
frontend.handler.start_BANG_ = (function frontend$handler$start_BANG_(render){
frontend.idb.start();

frontend.handler.test.setup_test_BANG_();

frontend.handler.get_system_info();

frontend.handler.set_global_error_notification_BANG_();

frontend.handler.register_components_fns_BANG_();

frontend.handler.user.restore_tokens_from_localstorage();

frontend.state.set_db_restoring_BANG_(true);

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
electron.listener.listen_BANG_();
} else {
}

(render.cljs$core$IFn$_invoke$arity$0 ? render.cljs$core$IFn$_invoke$arity$0() : render.call(null));

frontend.context.i18n.start();

frontend.modules.instrumentation.core.init();

frontend.state.set_online_BANG_(navigator.onLine);

promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.util.indexeddb_check_QMARK_(),(function (_e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode).",new cljs.core.Keyword(null,"error","error",-978969032),false);

return frontend.state.set_indexedb_support_BANG_(false);
}));

frontend.db.react.run_custom_queries_when_idle_BANG_();

frontend.handler.events.run_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.browser.start_db_worker_BANG_()),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.get_repos()),(function (repos){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_repos_BANG_(repos)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.mobile.util.hide_splash()),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.first(repos));
}
})()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.empty_QMARK_(repos))?frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.config.demo_repo):frontend.handler.restore_and_setup_BANG_(repo))),(function (___$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.set_network_watcher_BANG_()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.persist_db.run_export_periodically_BANG_():null)),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?frontend.state.restore_mobile_theme_BANG_():null));
}));
}));
}));
}));
}));
}));
}));
}));
})),(function (e){
return console.error("Error while restoring repos: ",e);
})),(function (){
return frontend.state.set_db_restoring_BANG_(false);
}))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util._LT_app_wake_up_from_sleep_loop(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false))),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.util.persist_var.load_vars());
}));
}));
}));
});
frontend.handler.stop_BANG_ = (function frontend$handler$stop_BANG_(){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["stop!"], 0));
});
frontend.handler.quit_and_install_new_version_BANG_ = (function frontend$handler$quit_and_install_new_version_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.invoke.cljs$core$IFn$_invoke$arity$variadic("set-quit-dirty-state",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([false], 0))),(function (_){
return promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"quitAndInstall","quitAndInstall",-856751624)], 0)));
}));
}));
});

//# sourceMappingURL=frontend.handler.js.map
