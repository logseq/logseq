goog.provide('frontend.page');
frontend.page.setup_fns_BANG_ = (function frontend$page$setup_fns_BANG_(){
try{return cljs.core.comp.cljs$core$IFn$_invoke$arity$2(frontend.ui.setup_active_keystroke_BANG_(),frontend.ui.setup_viewport_listeners_BANG_());
}catch (e131018){var _e = e131018;
return null;
}});
/**
 * This screen is displayed when the UI has crashed hard. It provides the user
 *   with basic troubleshooting steps to get them back to a working state. This
 *   component is purposefully stupid simple as it needs to render under any number
 *   of broken conditions
 */
frontend.page.helpful_default_error_screen = rum.core.lazy_build(rum.core.build_defc,(function (){
var current_repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
return daiquiri.core.create_element("div",{'id':"main-container",'className':"cp__sidebar-main-layout flex-1 flex"},[daiquiri.core.create_element("div",{'id':"app-container"},[daiquiri.core.create_element("div",{'id':"left-container"},[daiquiri.core.create_element("div",{'id':"main-container",'className':"cp__sidebar-main-layout flex-1 flex"},[daiquiri.core.create_element("div",{'id':"main-content-container",'className':"scrollbar-spacing w-full flex justify-center"},[daiquiri.core.create_element("div",{'className':"cp__sidebar-main-content"},[daiquiri.core.create_element("div",{'className':"ls-center"},[(function (){var attrs131021 = frontend.ui.icon("bug",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),frontend.ui.icon_size], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131021))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-box","p-1","rounded","mb-3"], null)], null),attrs131021], 0))):{'className':"icon-box p-1 rounded mb-3"}),((cljs.core.map_QMARK_(attrs131021))?null:[daiquiri.interpreter.interpret(attrs131021)]));
})(),(function (){var attrs131022 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","something-went-wrong","page/something-went-wrong",1299552111)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131022))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xl","font-bold"], null)], null),attrs131022], 0))):{'className':"text-xl font-bold"}),((cljs.core.map_QMARK_(attrs131022))?null:[daiquiri.interpreter.interpret(attrs131022)]));
})(),(function (){var attrs131023 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","logseq-is-having-a-problem","page/logseq-is-having-a-problem",1811118491)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131023))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-2","mb-2"], null)], null),attrs131023], 0))):{'className':"mt-2 mb-2"}),((cljs.core.map_QMARK_(attrs131023))?null:[daiquiri.interpreter.interpret(attrs131023)]));
})(),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between align-items mb-2 items-center py-4"},[daiquiri.core.create_element("div",{'className':"flex flex-col items-start"},[(function (){var attrs131032 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","step","page/step",1292828841),"1"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131032))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xs","font-bold","uppercase","toned-down"], null)], null),attrs131032], 0))):{'className':"text-2xs font-bold uppercase toned-down"}),((cljs.core.map_QMARK_(attrs131032))?null:[daiquiri.interpreter.interpret(attrs131032)]));
})(),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"highlighted font-bold"},["Rebuild"]),daiquiri.core.create_element("span",{'className':"toned-down"},[" search index"])])]),(function (){var attrs131031 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","try","page/try",1385175055)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1(true);
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131031))?daiquiri.interpreter.element_attributes(attrs131031):null),((cljs.core.map_QMARK_(attrs131031))?null:[daiquiri.interpreter.interpret(attrs131031)]));
})()]),daiquiri.core.create_element("div",{'className':"flex flex-row justify-between align-items mb-2 items-center separator-top py-4"},[daiquiri.core.create_element("div",{'className':"flex flex-col items-start"},[(function (){var attrs131036 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","step","page/step",1292828841),"2"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131036))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xs","font-bold","uppercase","toned-down"], null)], null),attrs131036], 0))):{'className':"text-2xs font-bold uppercase toned-down"}),((cljs.core.map_QMARK_(attrs131036))?null:[daiquiri.interpreter.interpret(attrs131036)]));
})(),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"highlighted font-bold"},["Relaunch"]),daiquiri.core.create_element("span",{'className':"toned-down"},[" the app"])]),daiquiri.core.create_element("div",{'className':"text-xs toned-down"},["Quit the app and then reopen it."])]),(function (){var attrs131035 = frontend.ui.icon("command",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"rounded-md p-1 mr-2 bg-quaternary"], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131035))?daiquiri.interpreter.element_attributes(attrs131035):null),((cljs.core.map_QMARK_(attrs131035))?[daiquiri.interpreter.interpret(frontend.ui.icon((cljs.core.truth_(frontend.util.electron_QMARK_())?"letter-q":"letter-r"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"rounded-md p-1 bg-quaternary"], null)))]:[daiquiri.interpreter.interpret(attrs131035),daiquiri.interpreter.interpret(frontend.ui.icon((cljs.core.truth_(frontend.util.electron_QMARK_())?"letter-q":"letter-r"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"rounded-md p-1 bg-quaternary"], null)))]));
})()]),((db_based_QMARK_)?daiquiri.core.create_element("div",{'className':"flex flex-row justify-between align-items mb-4 items-center separator-top py-4"},[daiquiri.core.create_element("div",{'className':"flex flex-col items-start mr-2"},[(function (){var attrs131042 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","step","page/step",1292828841),"3"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131042))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xs","font-bold","uppercase","toned-down"], null)], null),attrs131042], 0))):{'className':"text-2xs font-bold uppercase toned-down"}),((cljs.core.map_QMARK_(attrs131042))?null:[daiquiri.interpreter.interpret(attrs131042)]));
})(),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"highlighted font-bold"},["Export "]),daiquiri.core.create_element("span",{'className':"toned-down"},[" current graph as SQLite db"])]),daiquiri.core.create_element("div",{'className':"text-xs toned-down"},["You can send it to help@logseq.com for debugging."]),daiquiri.core.create_element("a",{'id':"download-as-sqlite-db",'className':"hidden"},null)]),(function (){var attrs131041 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Export graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.export$.export_repo_as_sqlite_db_BANG_(current_repo);
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131041))?daiquiri.interpreter.element_attributes(attrs131041):null),((cljs.core.map_QMARK_(attrs131041))?null:[daiquiri.interpreter.interpret(attrs131041)]));
})()]):null),daiquiri.core.create_element("div",{'className':"flex flex-row justify-between align-items mb-4 items-center separator-top py-4"},[daiquiri.core.create_element("div",{'className':"flex flex-col items-start"},[(function (){var attrs131050 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","step","page/step",1292828841),((db_based_QMARK_)?"4":"3")], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131050))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xs","font-bold","uppercase","toned-down"], null)], null),attrs131050], 0))):{'className':"text-2xs font-bold uppercase toned-down"}),((cljs.core.map_QMARK_(attrs131050))?null:[daiquiri.interpreter.interpret(attrs131050)]));
})(),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"highlighted font-bold"},["Clear"]),daiquiri.core.create_element("span",{'className':"toned-down"},[" local storage"])]),daiquiri.core.create_element("div",{'className':"text-xs toned-down"},["This does delete minor preferences like dark/light theme preference."])]),(function (){var attrs131049 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","try","page/try",1385175055)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
localStorage.clear();

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Cleared!",new cljs.core.Keyword(null,"success","success",1890645906));
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131049))?daiquiri.interpreter.element_attributes(attrs131049):null),((cljs.core.map_QMARK_(attrs131049))?null:[daiquiri.interpreter.interpret(attrs131049)]));
})()])]),(function (){var attrs131026 = ((db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"If you think you have experienced data loss, check for backup files under\n          the folder logseq/bak/."], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131026))?daiquiri.interpreter.element_attributes(attrs131026):null),((cljs.core.map_QMARK_(attrs131026))?[((db_based_QMARK_)?daiquiri.core.create_element("p",null,["You can also go to ",daiquiri.core.create_element("a",{'title':"All graphs",'onClick':(function (){
(window.location.href = reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graphs","graphs",-1584479112)));

return window.location.reload();
})},["All graphs"])," to switch to another graph."]):null),daiquiri.core.create_element("p",null,["If these troubleshooting steps have not solved your problem, please ",daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'className':"underline"},["open an issue."])])]:[daiquiri.interpreter.interpret(attrs131026),((db_based_QMARK_)?daiquiri.core.create_element("p",null,["You can also go to ",daiquiri.core.create_element("a",{'title':"All graphs",'onClick':(function (){
(window.location.href = reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graphs","graphs",-1584479112)));

return window.location.reload();
})},["All graphs"])," to switch to another graph."]):null),daiquiri.core.create_element("p",null,["If these troubleshooting steps have not solved your problem, please ",daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'className':"underline"},["open an issue."])])]));
})()])])])])])]),frontend.ui.notification()]);
}),null,"frontend.page/helpful-default-error-screen");
frontend.page.not_found = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"flex flex-col items-center justify-center min-h-screen bg-background"},[daiquiri.core.create_element("h1",{'className':"text-6xl font-bold text-gray-12 mb-4"},["404"]),daiquiri.core.create_element("h2",{'className':"text-2xl font-semibold text-gray-10 mb-6"},["Page Not Found"]),daiquiri.core.create_element("p",{'className':"text-gray-500 mb-8"},["Oops! The page you're looking for doesn't exist."]),daiquiri.interpreter.interpret((function (){var G__131064 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"home","home",-74557309));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__131065 = logseq.shui.ui.tabler_icon("home");
var G__131066 = "Go back home";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__131064,G__131065,G__131066) : logseq.shui.ui.button.call(null,G__131064,G__131065,G__131066));
})())]);
}),null,"frontend.page/not-found");
frontend.page.current_page = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret((function (){var temp__5802__auto__ = frontend.state.sub(new cljs.core.Keyword(null,"route-match","route-match",-1450985937));
if(cljs.core.truth_(temp__5802__auto__)){
var route_match = temp__5802__auto__;
var route_name = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var temp__5804__auto__ = new cljs.core.Keyword(null,"view","view",1247994814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(route_match));
if(cljs.core.truth_(temp__5804__auto__)){
var view = temp__5804__auto__;
return frontend.ui.catch_error_and_notify(frontend.page.helpful_default_error_screen(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"draw","draw",1358331674),route_name))?(view.cljs$core$IFn$_invoke$arity$1 ? view.cljs$core$IFn$_invoke$arity$1(route_match) : view.call(null,route_match)):frontend.components.container.root_container(route_match,(view.cljs$core$IFn$_invoke$arity$1 ? view.cljs$core$IFn$_invoke$arity$1(route_match) : view.call(null,route_match)))),(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)?frontend.components.plugins.hook_daemon_renderers():null)], null));
} else {
return null;
}
} else {
return frontend.page.not_found();
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.state.set_root_component_BANG_(new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state));

frontend.state.setup_electron_updater_BANG_();

frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$0();

frontend.ui.inject_document_devices_envs_BANG_();

frontend.ui.inject_dynamic_style_node_BANG_();

frontend.components.onboarding.quick_tour.init();

frontend.handler.plugin.host_mounted_BANG_();

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.page","teardown","frontend.page/teardown",1151382542),frontend.page.setup_fns_BANG_());
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto__ = new cljs.core.Keyword("frontend.page","teardown","frontend.page/teardown",1151382542).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto__)){
var teardown = temp__5804__auto__;
return (teardown.cljs$core$IFn$_invoke$arity$0 ? teardown.cljs$core$IFn$_invoke$arity$0() : teardown.call(null));
} else {
return null;
}
})], null)], null),"frontend.page/current-page");

//# sourceMappingURL=frontend.page.js.map
