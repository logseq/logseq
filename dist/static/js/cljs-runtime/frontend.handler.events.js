goog.provide('frontend.handler.events');
var module$node_modules$$sentry$react$dist$index=shadow.js.require("module$node_modules$$sentry$react$dist$index", {});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.events !== 'undefined') && (typeof frontend.handler.events.handle !== 'undefined')){
} else {
frontend.handler.events.handle = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__125842 = cljs.core.get_global_hierarchy;
return (fexpr__125842.cljs$core$IFn$_invoke$arity$0 ? fexpr__125842.cljs$core$IFn$_invoke$arity$0() : fexpr__125842.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.handler.events","handle"),cljs.core.first,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.handler.events.file_sync_restart_BANG_ = (function frontend$handler$events$file_sync_restart_BANG_(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_125860){
var state_val_125861 = (state_125860[(1)]);
if((state_val_125861 === (1))){
var inst_125843 = frontend.util.persist_var.load_vars();
var inst_125844 = cljs.core.async.interop.p__GT_c(inst_125843);
var state_125860__$1 = state_125860;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_125860__$1,(2),inst_125844);
} else {
if((state_val_125861 === (2))){
var inst_125846 = (state_125860[(2)]);
var inst_125847 = frontend.fs.sync._LT_sync_stop();
var state_125860__$1 = (function (){var statearr_125862 = state_125860;
(statearr_125862[(7)] = inst_125846);

return statearr_125862;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_125860__$1,(3),inst_125847);
} else {
if((state_val_125861 === (3))){
var inst_125851 = (state_125860[(8)]);
var inst_125849 = (state_125860[(2)]);
var inst_125851__$1 = frontend.fs.sync._LT_sync_start();
var inst_125852 = (inst_125851__$1 == null);
var state_125860__$1 = (function (){var statearr_125863 = state_125860;
(statearr_125863[(9)] = inst_125849);

(statearr_125863[(8)] = inst_125851__$1);

return statearr_125863;
})();
if(cljs.core.truth_(inst_125852)){
var statearr_125864_126117 = state_125860__$1;
(statearr_125864_126117[(1)] = (4));

} else {
var statearr_125865_126118 = state_125860__$1;
(statearr_125865_126118[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_125861 === (4))){
var state_125860__$1 = state_125860;
var statearr_125866_126119 = state_125860__$1;
(statearr_125866_126119[(2)] = null);

(statearr_125866_126119[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_125861 === (5))){
var inst_125851 = (state_125860[(8)]);
var state_125860__$1 = state_125860;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_125860__$1,(7),inst_125851);
} else {
if((state_val_125861 === (6))){
var inst_125858 = (state_125860[(2)]);
var state_125860__$1 = state_125860;
return cljs.core.async.impl.ioc_helpers.return_chan(state_125860__$1,inst_125858);
} else {
if((state_val_125861 === (7))){
var inst_125856 = (state_125860[(2)]);
var state_125860__$1 = state_125860;
var statearr_125867_126120 = state_125860__$1;
(statearr_125867_126120[(2)] = inst_125856);

(statearr_125867_126120[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});
return (function() {
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_125868 = [null,null,null,null,null,null,null,null,null,null];
(statearr_125868[(0)] = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__);

(statearr_125868[(1)] = (1));

return statearr_125868;
});
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____1 = (function (state_125860){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_125860);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e125869){var ex__32007__auto__ = e125869;
var statearr_125870_126121 = state_125860;
(statearr_125870_126121[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_125860[(4)]))){
var statearr_125871_126122 = state_125860;
(statearr_125871_126122[(1)] = cljs.core.first((state_125860[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__126123 = state_125860;
state_125860 = G__126123;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__ = function(state_125860){
switch(arguments.length){
case 0:
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____1.call(this,state_125860);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____0;
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto____1;
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_125872 = f__32196__auto__();
(statearr_125872[(6)] = c__32195__auto__);

return statearr_125872;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.events.file_sync_stop_BANG_ = (function frontend$handler$events$file_sync_stop_BANG_(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_125881){
var state_val_125882 = (state_125881[(1)]);
if((state_val_125882 === (1))){
var inst_125873 = frontend.util.persist_var.load_vars();
var inst_125874 = cljs.core.async.interop.p__GT_c(inst_125873);
var state_125881__$1 = state_125881;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_125881__$1,(2),inst_125874);
} else {
if((state_val_125882 === (2))){
var inst_125876 = (state_125881[(2)]);
var inst_125877 = frontend.fs.sync._LT_sync_stop();
var state_125881__$1 = (function (){var statearr_125883 = state_125881;
(statearr_125883[(7)] = inst_125876);

return statearr_125883;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_125881__$1,(3),inst_125877);
} else {
if((state_val_125882 === (3))){
var inst_125879 = (state_125881[(2)]);
var state_125881__$1 = state_125881;
return cljs.core.async.impl.ioc_helpers.return_chan(state_125881__$1,inst_125879);
} else {
return null;
}
}
}
});
return (function() {
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_125884 = [null,null,null,null,null,null,null,null];
(statearr_125884[(0)] = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__);

(statearr_125884[(1)] = (1));

return statearr_125884;
});
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____1 = (function (state_125881){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_125881);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e125885){var ex__32007__auto__ = e125885;
var statearr_125886_126124 = state_125881;
(statearr_125886_126124[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_125881[(4)]))){
var statearr_125887_126125 = state_125881;
(statearr_125887_126125[(1)] = cljs.core.first((state_125881[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__126126 = state_125881;
state_125881 = G__126126;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__ = function(state_125881){
switch(arguments.length){
case 0:
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____1.call(this,state_125881);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____0;
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto____1;
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_125888 = f__32196__auto__();
(statearr_125888[(6)] = c__32195__auto__);

return statearr_125888;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","added","graph/added",2021754774),(function (p__125889){
var vec__125890 = p__125889;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125890,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125890,(1),null);
var map__125893 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125890,(2),null);
var map__125893__$1 = cljs.core.__destructure_map(map__125893);
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125893__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();

frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-after-indexed","graph-after-indexed",1633483403),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_], null));

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

var temp__5804__auto___126127 = (function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
return frontend.config.get_repo_dir(repo);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___126127)){
var dir_name_126128 = temp__5804__auto___126127;
frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir_name_126128);
} else {
}

return frontend.handler.events.file_sync_restart_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("init","commands","init/commands",315507426),(function (_){
return frontend.handler.page.init_commands_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","unlinked","graph/unlinked",-2077575387),(function (repo,current_repo){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo),current_repo)){
return frontend.handler.events.file_sync_restart_BANG_();
} else {
return null;
}
}));
frontend.handler.events.graph_switch = (function frontend$handler$events$graph_switch(graph){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph);
frontend.state.set_current_repo_BANG_(graph);

frontend.handler.page.init_commands_BANG_();

frontend.handler.repo_config.restore_repo_config_BANG_.cljs$core$IFn$_invoke$arity$1(graph);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"draw","draw",1358331674),frontend.state.get_current_route())){
} else {
frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();
}

if(db_based_QMARK_){
} else {
frontend.handler.events.file_sync_restart_BANG_();
}

var temp__5804__auto___126129 = (function (){var and__5000__auto__ = (!(db_based_QMARK_));
if(and__5000__auto__){
return frontend.config.get_repo_dir(graph);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___126129)){
var dir_name_126130 = temp__5804__auto___126129;
frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir_name_126130);
} else {
}

return frontend.handler.graph.settle_metadata_to_local_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667),Date.now()], null));
});
/**
 * graph: the target graph to switch to
 */
frontend.handler.events.graph_switch_on_persisted = (function frontend$handler$events$graph_switch_on_persisted(graph,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_(graph)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.events.graph_switch(graph)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("sync-graph","init?","sync-graph/init?",608792103),false)),(function (___41611__auto____$2){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword(null,"rtc-download?","rtc-download?",453352962).cljs$core$IFn$_invoke$arity$1(opts))?(function (){
var and__5000__auto___126131 = frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto___126131)){
} else {
}

return frontend.handler.repo.refresh_repos_BANG_();
})()
:null));
}));
}));
}));
}));
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","switch","graph/switch",178853840),(function (p__125894){
var vec__125895 = p__125894;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125895,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125895,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125895,(2),null);
frontend.handler.export$.cancel_db_backup_BANG_();

frontend.persist_db.export_current_graph_BANG_();

frontend.state.set_state_BANG_(new cljs.core.Keyword("db","async-queries","db/async-queries",1853808854),cljs.core.PersistentArrayMap.EMPTY);

frontend.modules.shortcut.core.refresh_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","file-writes-finished?","thread-api/file-writes-finished?",-655932106),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0))),(function (writes_finished_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact.request_finished_QMARK_()),(function (request_finished_QMARK_){
return promesa.protocols._promise(((cljs.core.not(writes_finished_QMARK_))?(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.events",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),(function (){var G__125898 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"request-finished?","request-finished?",-1512674755),request_finished_QMARK_,new cljs.core.Keyword(null,"file-writes-finished?","file-writes-finished?",305290591),writes_finished_QMARK_], null);
if(request_finished_QMARK_ === false){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__125898,new cljs.core.Keyword(null,"unfinished-requests?","unfinished-requests?",-1326416795),cljs.core.deref(frontend.db.transact._STAR_unfinished_request_ids));
} else {
return G__125898;
}
})(),new cljs.core.Keyword(null,"line","line",212345235),123], null)),null);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please wait seconds until all changes are saved for the current graph.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
})()
:frontend.handler.events.graph_switch_on_persisted(graph,opts)));
}));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","open-new-window","graph/open-new-window",-397266781),(function (p__125899){
var vec__125900 = p__125899;
var _ev = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125900,(0),null);
var target_repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125900,(1),null);
return frontend.handler.ui.open_new_window_or_tab_BANG_(target_repo);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","migrated","graph/migrated",1907299703),(function (p__125903){
var vec__125904 = p__125903;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125904,(0),null);
var _repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125904,(1),null);
return alert("Graph migrated.");
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","create","page/create",-1304816391),(function (p__125907){
var vec__125908 = p__125907;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125908,(0),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125908,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125908,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_name,frontend.date.today())){
return frontend.handler.page.create_today_journal_BANG_();
} else {
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(page_name,opts) : frontend.handler.page._LT_create_BANG_.call(null,page_name,opts));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","deleted","page/deleted",-523428622),(function (p__125911){
var vec__125912 = p__125911;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125912,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125912,(1),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125912,(2),null);
var file_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125912,(3),null);
var tx_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125912,(4),null);
return frontend.handler.common.page.after_page_deleted_BANG_(repo,page_name,file_path,tx_meta);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","renamed","page/renamed",-1655115736),(function (p__125915){
var vec__125916 = p__125915;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125916,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125916,(1),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125916,(2),null);
return frontend.handler.common.page.after_page_renamed_BANG_(repo,data);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","create-today-journal","page/create-today-journal",-248526088),(function (p__125919){
var vec__125920 = p__125919;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125920,(0),null);
var _repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125920,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.page.create_today_journal_BANG_()),(function (___$1){
return promesa.protocols._promise(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0());
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","sync-context","graph/sync-context",1484639785),(function (){
var context = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"dev?","dev?",-613971064),new cljs.core.Keyword(null,"pages-directory","pages-directory",-1705912407),new cljs.core.Keyword(null,"journals-directory","journals-directory",1373812460),new cljs.core.Keyword(null,"importing?","importing?",-656840367),new cljs.core.Keyword(null,"node-test?","node-test?",-171079151),new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),new cljs.core.Keyword(null,"whiteboards-directory","whiteboards-directory",1994949079),new cljs.core.Keyword(null,"validate-db-options","validate-db-options",89965176),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),new cljs.core.Keyword(null,"preferred-format","preferred-format",-1784393121),new cljs.core.Keyword(null,"journal-file-name-format","journal-file-name-format",-323969121)],[frontend.config.dev_QMARK_,frontend.config.get_pages_directory(),frontend.config.get_journals_directory(),new cljs.core.Keyword("graph","importing","graph/importing",1647644617).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),frontend.util.node_test_QMARK_,frontend.state.get_export_bullet_indentation(),frontend.config.get_whiteboards_directory(),new cljs.core.Keyword("dev","validate-db-options","dev/validate-db-options",89933411).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0()),frontend.state.get_date_formatter(),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0(),(function (){var or__5002__auto__ = frontend.state.get_journal_file_name_format();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.date.default_journal_filename_formatter;
}
})()]);
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","set-context","thread-api/set-context",241806017),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([context], 0));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","ready","graph/ready",1121782733),(function (p__125923){
var vec__125924 = p__125923;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125924,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125924,(1),null);
if(frontend.config.local_file_based_graph_QMARK_(repo)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo)),(function (dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.dir_exists_QMARK_(dir)),(function (dir_exists_QMARK_){
return promesa.protocols._promise(((((cljs.core.not(dir_exists_QMARK_)) && ((!(frontend.util.nfs_QMARK_)))))?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","dir-gone","graph/dir-gone",-796087345),dir], null)):null));
}));
}));
}));
} else {
}

var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","sync-context","graph/sync-context",1484639785)], null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?setTimeout((function (){
return frontend.mobile.core.mobile_postinit();
}),(1000)):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.graph_ready_BANG_(repo)),(function (___41611__auto____$2){
return promesa.protocols._promise(((db_based_QMARK_)?frontend.handler.export$.auto_db_backup_BANG_(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backup-now?","backup-now?",-918244579),true], null)):frontend.fs.watcher_handler.load_graph_files_BANG_(repo)));
}));
}));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"instrument","instrument",-960698844),(function (p__125927){
var vec__125928 = p__125927;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125928,(0),null);
var map__125931 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125928,(1),null);
var map__125931__$1 = cljs.core.__destructure_map(map__125931);
var opts = map__125931__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125931__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125931__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
if(cljs.core.empty_QMARK_(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"payload","payload",-383036092)], 0)))){
} else {
console.error("instrument data-map should only contains [:type :payload]");
}

return frontend.modules.instrumentation.posthog.capture(type,payload);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"capture-error","capture-error",583122432),(function (p__125932){
var vec__125933 = p__125932;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125933,(0),null);
var map__125936 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125933,(1),null);
var map__125936__$1 = cljs.core.__destructure_map(map__125936);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125936__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125936__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var vec__125937 = cljs.core.deref(frontend.fs.sync.graphs_txid);
var user_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125937,(0),null);
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125937,(1),null);
var tx_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125937,(2),null);
var payload__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.version),new cljs.core.Keyword(null,"db-schema-version","db-schema-version",-1168427088),(function (){var temp__5804__auto__ = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676)) : frontend.db.entity.call(null,db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676)))));
} else {
return null;
}
})(),new cljs.core.Keyword(null,"user-id","user-id",-206822291),user_uuid,new cljs.core.Keyword(null,"graph-id","graph-id",-205404489),graph_uuid,new cljs.core.Keyword(null,"tx-id","tx-id",638275288),tx_id,new cljs.core.Keyword(null,"db-based","db-based",-738284547),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())], null),payload], 0));
return module$node_modules$$sentry$react$dist$index.captureException(error,cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tags","tags",1771418977),payload__$1], null)));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"exec-plugin-cmd","exec-plugin-cmd",1049730302),(function (p__125940){
var vec__125941 = p__125940;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125941,(0),null);
var map__125944 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125941,(1),null);
var map__125944__$1 = cljs.core.__destructure_map(map__125944);
var pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125944__$1,new cljs.core.Keyword(null,"pid","pid",1018387698));
var cmd = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125944__$1,new cljs.core.Keyword(null,"cmd","cmd",-302931143));
var action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125944__$1,new cljs.core.Keyword(null,"action","action",-811238024));
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cmd,action);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"shortcut-handler-refreshed","shortcut-handler-refreshed",1293579011),(function (p__125945){
var vec__125946 = p__125945;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125946,(0),null);
if(cljs.core.truth_(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_))){
return null;
} else {
cljs.core.reset_BANG_(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_,true);

return frontend.modules.shortcut.core.consume_pending_shortcuts_BANG_();
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("mobile","keyboard-will-show","mobile/keyboard-will-show",2010922836),(function (p__125949){
var vec__125950 = p__125949;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125950,(0),null);
var keyboard_height = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125950,(1),null);
var main_node = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-tabbar?","mobile/show-tabbar?",925227298),false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-toolbar?","mobile/show-toolbar?",-1615839821),true);

frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557)),"RECORDING")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),true);
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
cljs.core.reset_BANG_(frontend.util.keyboard_height,keyboard_height);

(main_node.style.marginBottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));

var temp__5804__auto___126132 = document.querySelector(":root");
if(cljs.core.truth_(temp__5804__auto___126132)){
var html_126133 = temp__5804__auto___126132;
html_126133.style.setProperty("--ls-native-kb-height",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));

html_126133.classList.add("has-mobile-keyboard");
} else {
}

var temp__5804__auto___126134 = goog.dom.getElement("left-sidebar");
if(cljs.core.truth_(temp__5804__auto___126134)){
var left_sidebar_node_126135 = temp__5804__auto___126134;
(left_sidebar_node_126135.style.bottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));
} else {
}

var temp__5804__auto___126136 = goog.dom.getElementByClass("sidebar-item-list");
if(cljs.core.truth_(temp__5804__auto___126136)){
var right_sidebar_node_126137 = temp__5804__auto___126136;
(right_sidebar_node_126137.style.paddingBottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((150) + keyboard_height)),"px"].join(''));
} else {
}

var temp__5804__auto___126138 = document.querySelector(".cards-review");
if(cljs.core.truth_(temp__5804__auto___126138)){
var card_preview_el_126139 = temp__5804__auto___126138;
(card_preview_el_126139.style.marginBottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));
} else {
}

var temp__5804__auto___126140 = document.querySelector(".encryption-password");
if(cljs.core.truth_(temp__5804__auto___126140)){
var card_preview_el_126141 = temp__5804__auto___126140;
(card_preview_el_126141.style.marginBottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));
} else {
}

return setTimeout((function (){
var temp__5804__auto__ = main_node.querySelector("#mobile-editor-toolbar");
if(cljs.core.truth_(temp__5804__auto__)){
var toolbar = temp__5804__auto__;
return (toolbar.style.bottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));
} else {
return null;
}
}),(100));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("mobile","keyboard-will-hide","mobile/keyboard-will-hide",-1974048806),(function (p__125953){
var vec__125954 = p__125953;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125954,(0),null);
var main_node = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-toolbar?","mobile/show-toolbar?",-1615839821),false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-tabbar?","mobile/show-tabbar?",925227298),true);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557)),"RECORDING")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),false);
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
var temp__5804__auto___126142 = document.querySelector(":root");
if(cljs.core.truth_(temp__5804__auto___126142)){
var html_126143 = temp__5804__auto___126142;
html_126143.style.removeProperty("--ls-native-kb-height");

html_126143.classList.remove("has-mobile-keyboard");
} else {
}

var temp__5804__auto___126144 = document.querySelector(".cards-review");
if(cljs.core.truth_(temp__5804__auto___126144)){
var card_preview_el_126145 = temp__5804__auto___126144;
(card_preview_el_126145.style.marginBottom = "0px");
} else {
}

var temp__5804__auto___126146 = document.querySelector(".encryption-password");
if(cljs.core.truth_(temp__5804__auto___126146)){
var card_preview_el_126147 = temp__5804__auto___126146;
(card_preview_el_126147.style.marginBottom = "0px");
} else {
}

(main_node.style.marginBottom = "0px");

var temp__5804__auto___126148 = goog.dom.getElement("left-sidebar");
if(cljs.core.truth_(temp__5804__auto___126148)){
var left_sidebar_node_126149 = temp__5804__auto___126148;
(left_sidebar_node_126149.style.bottom = "0px");
} else {
}

var temp__5804__auto___126150 = goog.dom.getElementByClass("sidebar-item-list");
if(cljs.core.truth_(temp__5804__auto___126150)){
var right_sidebar_node_126151 = temp__5804__auto___126150;
(right_sidebar_node_126151.style.paddingBottom = "150px");
} else {
}

var temp__5804__auto__ = main_node.querySelector("#mobile-editor-toolbar");
if(cljs.core.truth_(temp__5804__auto__)){
var toolbar = temp__5804__auto__;
return (toolbar.style.bottom = (0));
} else {
return null;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","hook-db-tx","plugin/hook-db-tx",1065547419),(function (p__125958){
var vec__125959 = p__125958;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125959,(0),null);
var map__125962 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125959,(1),null);
var map__125962__$1 = cljs.core.__destructure_map(map__125962);
var payload = map__125962__$1;
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125962__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125962__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(blocks);
if(and__5000__auto__){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([payload,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__125957_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,p1__125957_SHARP_);
}),tx_data)], null)], 0));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var payload__$1 = temp__5804__auto__;
frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"changed","changed",570724917),payload__$1);

return frontend.handler.plugin.hook_plugin_block_changes(payload__$1);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"rebuild-slash-commands-list","rebuild-slash-commands-list",-639662306),(function (p__125963){
var vec__125964 = p__125963;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125964,(0),null);
return (frontend.handler.page.rebuild_slash_commands_list_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.page.rebuild_slash_commands_list_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.page.rebuild_slash_commands_list_BANG_.call(null));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577),(function (p__125967){
var vec__125968 = p__125967;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125968,(0),null);
return frontend.modules.shortcut.core.refresh_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),(function (p__125971){
var vec__125972 = p__125971;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125972,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125972,(1),null);
var heading = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125972,(2),null);
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return frontend.handler.editor.set_heading_BANG_(id,heading);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","restored","graph/restored",1296384092),(function (p__125975){
var vec__125976 = p__125975;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125976,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125976,(1),null);
if(cljs.core.truth_(graph)){
frontend.handler.assets.ensure_assets_dir_BANG_(graph);
} else {
}

frontend.mobile.core.init_BANG_();

frontend.handler.db_based.rtc_flows.trigger_rtc_start(graph);

frontend.extensions.fsrs.update_due_cards_count();

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return null;
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","ready","graph/ready",1121782733),graph], null));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"whiteboard-link","whiteboard-link",467575349),(function (p__125979){
var vec__125980 = p__125979;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125980,(0),null);
var shapes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125980,(1),null);
frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("whiteboard","link","whiteboard/link",-2040799017));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","linked-shapes","whiteboard/linked-shapes",-1743561352),shapes);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"whiteboard-go-to-link","whiteboard-go-to-link",855027368),(function (p__125983){
var vec__125984 = p__125983;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125984,(0),null);
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125984,(1),null);
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),link], null)], null));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","save-db-to-disk","graph/save-db-to-disk",-1288279162),(function (p__125987){
var vec__125988 = p__125987;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125988,(0),null);
var _opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125988,(1),null);
return frontend.persist_db.export_current_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"succ-notification?","succ-notification?",-1467312225),true,new cljs.core.Keyword(null,"force-save?","force-save?",-1690725991),true], null)], 0));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("ui","re-render-root","ui/re-render-root",-1358783476),(function (p__125991){
var vec__125992 = p__125991;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125992,(0),null);
return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("run","cli-command","run/cli-command",503686384),(function (p__125995){
var vec__125996 = p__125995;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125996,(0),null);
var command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125996,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125996,(2),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = command;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(content)));
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.shell.run_cli_command_wrapper_BANG_(command,content);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","quick-capture","editor/quick-capture",799865811),(function (p__125999){
var vec__126000 = p__125999;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126000,(0),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126000,(1),null);
return frontend.quick_capture.quick_capture(args);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","keymap","modal/keymap",-57371819),(function (p__126003){
var vec__126004 = p__126003;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126004,(0),null);
return frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"keymap","keymap",-499605268));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),(function (p__126008){
var vec__126009 = p__126008;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126009,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126009,(1),null);
var batch_QMARK_ = cljs.core.sequential_QMARK_(blocks);
var blocks__$1 = (function (){var G__126012 = blocks;
if(batch_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__126007_SHARP_){
var G__126013 = p1__126007_SHARP_;
if(((cljs.core.uuid_QMARK_(p1__126007_SHARP_)) || (typeof p1__126007_SHARP_ === 'string'))){
return frontend.db.model.get_block_by_uuid(G__126013);
} else {
return G__126013;
}
}),G__126012);
} else {
return G__126012;
}
})();
if(((batch_QMARK_) && ((cljs.core.count(blocks__$1) > (1))))){
return frontend.handler.editor.toggle_blocks_as_own_order_list_BANG_(blocks__$1);
} else {
var temp__5804__auto__ = (function (){var G__126014 = blocks__$1;
if(batch_QMARK_){
return cljs.core.first(G__126014);
} else {
return G__126014;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_(frontend.handler.editor.own_order_number_list_QMARK_(block))){
return frontend.handler.editor.remove_block_own_order_list_type_BANG_(block);
} else {
return frontend.handler.editor.make_block_as_own_order_list_BANG_(block);
}
} else {
return null;
}
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","remove-own-number-list","editor/remove-own-number-list",-492965226),(function (p__126015){
var vec__126016 = p__126015;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126016,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126016,(1),null);
if(cljs.core.truth_((function (){var G__126019 = block;
if((G__126019 == null)){
return null;
} else {
return frontend.handler.editor.own_order_number_list_QMARK_(G__126019);
}
})())){
return frontend.handler.editor.remove_block_own_order_list_type_BANG_(block);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","save-current-block","editor/save-current-block",1864275336),(function (_){
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","save-code-editor","editor/save-code-editor",-1356475475),(function (_){
return frontend.handler.code.save_code_editor_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","focus-code-editor","editor/focus-code-editor",-682196012),(function (p__126020){
var vec__126021 = p__126020;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126021,(0),null);
var editing_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126021,(1),null);
var container = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126021,(2),null);
var temp__5804__auto__ = frontend.util.get_cm_instance(container);
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
if(cljs.core.truth_(cm.hasFocus())){
return null;
} else {
var cursor_pos = (function (){var G__126024 = new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var G__126024__$1 = (((G__126024 == null))?null:cljs.core.deref(G__126024));
if((G__126024__$1 == null)){
return null;
} else {
return cljs.core.count(G__126024__$1);
}
})();
var direction = new cljs.core.Keyword("block.editing","direction","block.editing/direction",-1821464148).cljs$core$IFn$_invoke$arity$1(editing_block);
var pos = new cljs.core.Keyword("block.editing","pos","block.editing/pos",-1255653791).cljs$core$IFn$_invoke$arity$1(editing_block);
var to_line = (function (){var G__126025 = direction;
var G__126025__$1 = (((G__126025 instanceof cljs.core.Keyword))?G__126025.fqn:null);
switch (G__126025__$1) {
case "up":
return cm.lastLine();

break;
default:
var G__126026 = pos;
var G__126026__$1 = (((G__126026 instanceof cljs.core.Keyword))?G__126026.fqn:null);
switch (G__126026__$1) {
case "max":
return cm.lastLine();

break;
default:
return (0);

}

}
})();
var G__126027 = cm;
G__126027.focus();

G__126027.setCursor(to_line,(function (){var or__5002__auto__ = cursor_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());

return G__126027;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-children-number-list","editor/toggle-children-number-list",-1804483433),(function (p__126028){
var vec__126029 = p__126028;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126029,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126029,(1),null);
var temp__5804__auto__ = (function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.get_block_immediate_children(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var blocks = temp__5804__auto__;
return frontend.handler.editor.toggle_blocks_as_own_order_list_BANG_(blocks);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),(function (p__126033){
var vec__126034 = p__126033;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126034,(0),null);
var map__126037 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126034,(1),null);
var map__126037__$1 = cljs.core.__destructure_map(map__126037);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126037__$1,new cljs.core.Keyword(null,"block","block",664686210));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126037__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var lang = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126037__$1,new cljs.core.Keyword(null,"lang","lang",-1819677104));
var update_current_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126037__$1,new cljs.core.Keyword(null,"update-current-block?","update-current-block?",-507726186));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(update_current_block_QMARK_)?null:frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0())),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(update_current_block_QMARK_)?null:promesa.core.delay.cljs$core$IFn$_invoke$arity$1((16)))),(function (___41611__auto____$1){
return promesa.protocols._promise((function (){var block__$1 = (function (){var G__126038 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__126038) : frontend.db.entity.call(null,G__126038));
})();
var block_type = new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block__$1);
var block_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
var latest_code_lang = (function (){var or__5002__auto__ = lang;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328))));
}
})();
var turn_type_BANG_ = (function (p1__126032_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.Keyword(null,"code","code",1586293142));
if(and__5000__auto__){
return latest_code_lang;
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.db_based.property.set_block_properties_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__126032_SHARP_),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),latest_code_lang], null));
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__126032_SHARP_),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type));
}
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((((((!((block_type == null)))) || (((cljs.core.not(update_current_block_QMARK_)) && ((!(clojure.string.blank_QMARK_(block_title))))))))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var vec__126039 = frontend.handler.editor.insert_new_block_aux_BANG_(cljs.core.PersistentArrayMap.EMPTY,block__$1,"");
var _p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126039,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126039,(1),null);
var block_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126039,(2),null);
return turn_type_BANG_(block_SINGLEQUOTE_);
} else {
var _STAR_outliner_ops_STAR__orig_val__126042 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__126043 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__126043);

try{var vec__126044_126154 = frontend.handler.editor.insert_new_block_aux_BANG_(cljs.core.PersistentArrayMap.EMPTY,block__$1,"");
var _p_126155 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126044_126154,(0),null);
var __126156__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126044_126154,(1),null);
var block_SINGLEQUOTE__126157 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126044_126154,(2),null);
turn_type_BANG_(block_SINGLEQUOTE__126157);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__126042);
}}
})()),(function (result){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(result)));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__126047 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__126047) : frontend.db.entity.call(null,G__126047));
} else {
return null;
}
})());
}));
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(turn_type_BANG_(block__$1)),(function (___41611__auto____$2){
return promesa.protocols._promise((function (){var G__126048 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__126048) : frontend.db.entity.call(null,G__126048));
})());
}));
})))),(function (block__$2){
return promesa.protocols._promise(setTimeout((function (){
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block__$2,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block__$2,new cljs.core.Keyword(null,"max","max",61366548)));
}),(100)));
}));
}));
})());
}));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","sync-state","rtc/sync-state",-1325028836),(function (p__126049){
var vec__126050 = p__126049;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126050,(0),null);
var state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126050,(1),null);
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","state","rtc/state",-1988572624),(function (old){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old,state], 0));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),(function (p__126053){
var vec__126054 = p__126053;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126054,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126054,(1),null);
return frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),data);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","download-remote-graph","rtc/download-remote-graph",508601916),(function (p__126057){
var vec__126058 = p__126057;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126058,(0),null);
var graph_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126058,(1),null);
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126058,(2),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126058,(3),null);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._promise(frontend.handler.db_based.rtc._LT_rtc_download_graph_BANG_(graph_name,graph_uuid,graph_schema_version,(60000)));
})),(function (e){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["RTC download graph failed, error:"], 0));

return console.error(e);
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("db","sync-changes","db/sync-changes",584814072),(function (p__126061){
var vec__126062 = p__126061;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126062,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126062,(1),null);
var retract_datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d))) && (new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d) === false));
}),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(data));
var retracted_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d)], null);
}),retract_datoms);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(data),retracted_tx_data);
frontend.modules.outliner.pipeline.invoke_hooks(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data));

return null;
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("db","export-sqlite","db/export-sqlite",703008892),(function (_){
frontend.handler.export$.export_repo_as_sqlite_db_BANG_(frontend.state.get_current_repo());

return null;
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","run-query-command","editor/run-query-command",1913684864),(function (_){
return frontend.handler.editor.run_query_command_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","load-blocks","editor/load-blocks",428173962),(function (p__126065){
var vec__126066 = p__126065;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126066,(0),null);
var ids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126066,(1),null);
if(cljs.core.seq(ids)){
return promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711),true,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),false], null)], 0));
}),ids));
} else {
return null;
}
}));
frontend.handler.events.run_BANG_ = (function frontend$handler$events$run_BANG_(){
var chan = frontend.state.get_events_chan();
var c__32195__auto___126158 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_126097){
var state_val_126098 = (state_126097[(1)]);
if((state_val_126098 === (1))){
var state_126097__$1 = state_126097;
var statearr_126099_126159 = state_126097__$1;
(statearr_126099_126159[(2)] = null);

(statearr_126099_126159[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126098 === (2))){
var state_126097__$1 = state_126097;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126097__$1,(4),chan);
} else {
if((state_val_126098 === (3))){
var inst_126095 = (state_126097[(2)]);
var state_126097__$1 = state_126097;
return cljs.core.async.impl.ioc_helpers.return_chan(state_126097__$1,inst_126095);
} else {
if((state_val_126098 === (4))){
var inst_126074 = (state_126097[(7)]);
var inst_126074__$1 = (state_126097[(2)]);
var inst_126075 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_126074__$1,(0),null);
var inst_126076 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_126074__$1,(1),null);
var state_126097__$1 = (function (){var statearr_126100 = state_126097;
(statearr_126100[(7)] = inst_126074__$1);

(statearr_126100[(8)] = inst_126075);

(statearr_126100[(9)] = inst_126076);

return statearr_126100;
})();
var statearr_126101_126160 = state_126097__$1;
(statearr_126101_126160[(2)] = null);

(statearr_126101_126160[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126098 === (5))){
var inst_126075 = (state_126097[(8)]);
var _ = (function (){var statearr_126102 = state_126097;
(statearr_126102[(4)] = cljs.core.cons((8),(state_126097[(4)])));

return statearr_126102;
})();
var inst_126084 = frontend.handler.events.handle.cljs$core$IFn$_invoke$arity$1(inst_126075);
var inst_126085 = promesa.core.resolved(inst_126084);
var ___$1 = (function (){var statearr_126103 = state_126097;
(statearr_126103[(4)] = cljs.core.rest((state_126097[(4)])));

return statearr_126103;
})();
var state_126097__$1 = state_126097;
var statearr_126104_126161 = state_126097__$1;
(statearr_126104_126161[(2)] = inst_126085);

(statearr_126104_126161[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126098 === (6))){
var inst_126074 = (state_126097[(7)]);
var inst_126075 = (state_126097[(8)]);
var inst_126076 = (state_126097[(9)]);
var inst_126088 = (state_126097[(2)]);
var inst_126089 = (function (){var vec__126070 = inst_126074;
var payload = inst_126075;
var d = inst_126076;
return (function (result){
return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,result);
});
})();
var inst_126090 = promesa.core.then.cljs$core$IFn$_invoke$arity$2(inst_126088,inst_126089);
var inst_126091 = (function (){var vec__126070 = inst_126074;
var payload = inst_126075;
var d = inst_126076;
return (function (error){
var type = new cljs.core.Keyword("handle-system-events","failed","handle-system-events/failed",-2079184624);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null)], null)], null));

return promesa.core.reject_BANG_(d,error);
});
})();
var inst_126092 = promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(inst_126090,inst_126091);
var state_126097__$1 = (function (){var statearr_126106 = state_126097;
(statearr_126106[(10)] = inst_126092);

return statearr_126106;
})();
var statearr_126107_126162 = state_126097__$1;
(statearr_126107_126162[(2)] = null);

(statearr_126107_126162[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126098 === (7))){
var inst_126077 = (state_126097[(2)]);
var inst_126078 = promesa.core.rejected(inst_126077);
var state_126097__$1 = state_126097;
var statearr_126108_126163 = state_126097__$1;
(statearr_126108_126163[(2)] = inst_126078);

(statearr_126108_126163[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126098 === (8))){
var _ = (function (){var statearr_126109 = state_126097;
(statearr_126109[(4)] = cljs.core.rest((state_126097[(4)])));

return statearr_126109;
})();
var state_126097__$1 = state_126097;
var ex126105 = (state_126097__$1[(2)]);
var statearr_126110_126164 = state_126097__$1;
(statearr_126110_126164[(5)] = ex126105);


var statearr_126111_126165 = state_126097__$1;
(statearr_126111_126165[(1)] = (7));

(statearr_126111_126165[(5)] = null);



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$handler$events$run_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$events$run_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_126112 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_126112[(0)] = frontend$handler$events$run_BANG__$_state_machine__32004__auto__);

(statearr_126112[(1)] = (1));

return statearr_126112;
});
var frontend$handler$events$run_BANG__$_state_machine__32004__auto____1 = (function (state_126097){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_126097);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e126113){var ex__32007__auto__ = e126113;
var statearr_126114_126166 = state_126097;
(statearr_126114_126166[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_126097[(4)]))){
var statearr_126115_126167 = state_126097;
(statearr_126115_126167[(1)] = cljs.core.first((state_126097[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__126168 = state_126097;
state_126097 = G__126168;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$events$run_BANG__$_state_machine__32004__auto__ = function(state_126097){
switch(arguments.length){
case 0:
return frontend$handler$events$run_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$events$run_BANG__$_state_machine__32004__auto____1.call(this,state_126097);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$run_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$run_BANG__$_state_machine__32004__auto____0;
frontend$handler$events$run_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$run_BANG__$_state_machine__32004__auto____1;
return frontend$handler$events$run_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_126116 = f__32196__auto__();
(statearr_126116[(6)] = c__32195__auto___126158);

return statearr_126116;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return chan;
});

//# sourceMappingURL=frontend.handler.events.js.map
