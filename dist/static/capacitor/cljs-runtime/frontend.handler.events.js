goog.provide('frontend.handler.events');
var module$node_modules$$sentry$react$dist$index=shadow.js.require("module$node_modules$$sentry$react$dist$index", {});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.events !== 'undefined') && (typeof frontend.handler.events.handle !== 'undefined')){
} else {
frontend.handler.events.handle = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__91469 = cljs.core.get_global_hierarchy;
return (fexpr__91469.cljs$core$IFn$_invoke$arity$0 ? fexpr__91469.cljs$core$IFn$_invoke$arity$0() : fexpr__91469.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.handler.events","handle"),cljs.core.first,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.handler.events.file_sync_restart_BANG_ = (function frontend$handler$events$file_sync_restart_BANG_(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_91487){
var state_val_91488 = (state_91487[(1)]);
if((state_val_91488 === (1))){
var inst_91470 = frontend.util.persist_var.load_vars();
var inst_91471 = cljs.core.async.interop.p__GT_c(inst_91470);
var state_91487__$1 = state_91487;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91487__$1,(2),inst_91471);
} else {
if((state_val_91488 === (2))){
var inst_91473 = (state_91487[(2)]);
var inst_91474 = frontend.fs.sync._LT_sync_stop();
var state_91487__$1 = (function (){var statearr_91489 = state_91487;
(statearr_91489[(7)] = inst_91473);

return statearr_91489;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91487__$1,(3),inst_91474);
} else {
if((state_val_91488 === (3))){
var inst_91478 = (state_91487[(8)]);
var inst_91476 = (state_91487[(2)]);
var inst_91478__$1 = frontend.fs.sync._LT_sync_start();
var inst_91479 = (inst_91478__$1 == null);
var state_91487__$1 = (function (){var statearr_91490 = state_91487;
(statearr_91490[(9)] = inst_91476);

(statearr_91490[(8)] = inst_91478__$1);

return statearr_91490;
})();
if(cljs.core.truth_(inst_91479)){
var statearr_91491_91744 = state_91487__$1;
(statearr_91491_91744[(1)] = (4));

} else {
var statearr_91492_91745 = state_91487__$1;
(statearr_91492_91745[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91488 === (4))){
var state_91487__$1 = state_91487;
var statearr_91493_91746 = state_91487__$1;
(statearr_91493_91746[(2)] = null);

(statearr_91493_91746[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91488 === (5))){
var inst_91478 = (state_91487[(8)]);
var state_91487__$1 = state_91487;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91487__$1,(7),inst_91478);
} else {
if((state_val_91488 === (6))){
var inst_91485 = (state_91487[(2)]);
var state_91487__$1 = state_91487;
return cljs.core.async.impl.ioc_helpers.return_chan(state_91487__$1,inst_91485);
} else {
if((state_val_91488 === (7))){
var inst_91483 = (state_91487[(2)]);
var state_91487__$1 = state_91487;
var statearr_91494_91747 = state_91487__$1;
(statearr_91494_91747[(2)] = inst_91483);

(statearr_91494_91747[(1)] = (6));


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
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__ = null;
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_91495 = [null,null,null,null,null,null,null,null,null,null];
(statearr_91495[(0)] = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__);

(statearr_91495[(1)] = (1));

return statearr_91495;
});
var frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____1 = (function (state_91487){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_91487);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e91496){var ex__32054__auto__ = e91496;
var statearr_91497_91748 = state_91487;
(statearr_91497_91748[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_91487[(4)]))){
var statearr_91498_91749 = state_91487;
(statearr_91498_91749[(1)] = cljs.core.first((state_91487[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__91750 = state_91487;
state_91487 = G__91750;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__ = function(state_91487){
switch(arguments.length){
case 0:
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____1.call(this,state_91487);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____0;
frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto____1;
return frontend$handler$events$file_sync_restart_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_91499 = f__32125__auto__();
(statearr_91499[(6)] = c__32124__auto__);

return statearr_91499;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.events.file_sync_stop_BANG_ = (function frontend$handler$events$file_sync_stop_BANG_(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_91508){
var state_val_91509 = (state_91508[(1)]);
if((state_val_91509 === (1))){
var inst_91500 = frontend.util.persist_var.load_vars();
var inst_91501 = cljs.core.async.interop.p__GT_c(inst_91500);
var state_91508__$1 = state_91508;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91508__$1,(2),inst_91501);
} else {
if((state_val_91509 === (2))){
var inst_91503 = (state_91508[(2)]);
var inst_91504 = frontend.fs.sync._LT_sync_stop();
var state_91508__$1 = (function (){var statearr_91510 = state_91508;
(statearr_91510[(7)] = inst_91503);

return statearr_91510;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91508__$1,(3),inst_91504);
} else {
if((state_val_91509 === (3))){
var inst_91506 = (state_91508[(2)]);
var state_91508__$1 = state_91508;
return cljs.core.async.impl.ioc_helpers.return_chan(state_91508__$1,inst_91506);
} else {
return null;
}
}
}
});
return (function() {
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__ = null;
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_91511 = [null,null,null,null,null,null,null,null];
(statearr_91511[(0)] = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__);

(statearr_91511[(1)] = (1));

return statearr_91511;
});
var frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____1 = (function (state_91508){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_91508);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e91512){var ex__32054__auto__ = e91512;
var statearr_91513_91751 = state_91508;
(statearr_91513_91751[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_91508[(4)]))){
var statearr_91514_91752 = state_91508;
(statearr_91514_91752[(1)] = cljs.core.first((state_91508[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__91753 = state_91508;
state_91508 = G__91753;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__ = function(state_91508){
switch(arguments.length){
case 0:
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____1.call(this,state_91508);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____0;
frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto____1;
return frontend$handler$events$file_sync_stop_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_91515 = f__32125__auto__();
(statearr_91515[(6)] = c__32124__auto__);

return statearr_91515;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","added","graph/added",2021754774),(function (p__91516){
var vec__91517 = p__91516;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91517,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91517,(1),null);
var map__91520 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91517,(2),null);
var map__91520__$1 = cljs.core.__destructure_map(map__91520);
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91520__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();

frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-after-indexed","graph-after-indexed",1633483403),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_], null));

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

var temp__5804__auto___91754 = (function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
return frontend.config.get_repo_dir(repo);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___91754)){
var dir_name_91755 = temp__5804__auto___91754;
frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir_name_91755);
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

var temp__5804__auto___91756 = (function (){var and__5000__auto__ = (!(db_based_QMARK_));
if(and__5000__auto__){
return frontend.config.get_repo_dir(graph);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___91756)){
var dir_name_91757 = temp__5804__auto___91756;
frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir_name_91757);
} else {
}

return frontend.handler.graph.settle_metadata_to_local_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667),Date.now()], null));
});
/**
 * graph: the target graph to switch to
 */
frontend.handler.events.graph_switch_on_persisted = (function frontend$handler$events$graph_switch_on_persisted(graph,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_(graph)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.events.graph_switch(graph)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("sync-graph","init?","sync-graph/init?",608792103),false)),(function (___40947__auto____$2){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword(null,"rtc-download?","rtc-download?",453352962).cljs$core$IFn$_invoke$arity$1(opts))?(function (){
var and__5000__auto___91758 = frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto___91758)){
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","switch","graph/switch",178853840),(function (p__91521){
var vec__91522 = p__91521;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91522,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91522,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91522,(2),null);
frontend.handler.export$.cancel_db_backup_BANG_();

frontend.persist_db.export_current_graph_BANG_();

frontend.state.set_state_BANG_(new cljs.core.Keyword("db","async-queries","db/async-queries",1853808854),cljs.core.PersistentArrayMap.EMPTY);

frontend.modules.shortcut.core.refresh_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","file-writes-finished?","thread-api/file-writes-finished?",-655932106),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0))),(function (writes_finished_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact.request_finished_QMARK_()),(function (request_finished_QMARK_){
return promesa.protocols._promise(((cljs.core.not(writes_finished_QMARK_))?(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.events",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),(function (){var G__91525 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"request-finished?","request-finished?",-1512674755),request_finished_QMARK_,new cljs.core.Keyword(null,"file-writes-finished?","file-writes-finished?",305290591),writes_finished_QMARK_], null);
if(request_finished_QMARK_ === false){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__91525,new cljs.core.Keyword(null,"unfinished-requests?","unfinished-requests?",-1326416795),cljs.core.deref(frontend.db.transact._STAR_unfinished_request_ids));
} else {
return G__91525;
}
})(),new cljs.core.Keyword(null,"line","line",212345235),123], null)),null);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please wait seconds until all changes are saved for the current graph.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
})()
:frontend.handler.events.graph_switch_on_persisted(graph,opts)));
}));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","open-new-window","graph/open-new-window",-397266781),(function (p__91526){
var vec__91527 = p__91526;
var _ev = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91527,(0),null);
var target_repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91527,(1),null);
return frontend.handler.ui.open_new_window_or_tab_BANG_(target_repo);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","migrated","graph/migrated",1907299703),(function (p__91530){
var vec__91531 = p__91530;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91531,(0),null);
var _repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91531,(1),null);
return alert("Graph migrated.");
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","create","page/create",-1304816391),(function (p__91534){
var vec__91535 = p__91534;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91535,(0),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91535,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91535,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_name,frontend.date.today())){
return frontend.handler.page.create_today_journal_BANG_();
} else {
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(page_name,opts) : frontend.handler.page._LT_create_BANG_.call(null,page_name,opts));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","deleted","page/deleted",-523428622),(function (p__91538){
var vec__91539 = p__91538;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91539,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91539,(1),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91539,(2),null);
var file_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91539,(3),null);
var tx_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91539,(4),null);
return frontend.handler.common.page.after_page_deleted_BANG_(repo,page_name,file_path,tx_meta);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","renamed","page/renamed",-1655115736),(function (p__91542){
var vec__91543 = p__91542;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91543,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91543,(1),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91543,(2),null);
return frontend.handler.common.page.after_page_renamed_BANG_(repo,data);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","create-today-journal","page/create-today-journal",-248526088),(function (p__91546){
var vec__91547 = p__91546;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91547,(0),null);
var _repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91547,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","ready","graph/ready",1121782733),(function (p__91550){
var vec__91551 = p__91550;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91551,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91551,(1),null);
if(frontend.config.local_file_based_graph_QMARK_(repo)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo)),(function (dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.dir_exists_QMARK_(dir)),(function (dir_exists_QMARK_){
return promesa.protocols._promise(((((cljs.core.not(dir_exists_QMARK_)) && ((!(frontend.util.nfs_QMARK_)))))?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","dir-gone","graph/dir-gone",-796087345),dir], null)):null));
}));
}));
}));
} else {
}

var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","sync-context","graph/sync-context",1484639785)], null))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?setTimeout((function (){
return frontend.mobile.core.mobile_postinit();
}),(1000)):null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.graph_ready_BANG_(repo)),(function (___40947__auto____$2){
return promesa.protocols._promise(((db_based_QMARK_)?frontend.handler.export$.auto_db_backup_BANG_(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backup-now?","backup-now?",-918244579),true], null)):frontend.fs.watcher_handler.load_graph_files_BANG_(repo)));
}));
}));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"instrument","instrument",-960698844),(function (p__91554){
var vec__91555 = p__91554;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91555,(0),null);
var map__91558 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91555,(1),null);
var map__91558__$1 = cljs.core.__destructure_map(map__91558);
var opts = map__91558__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91558__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91558__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
if(cljs.core.empty_QMARK_(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"payload","payload",-383036092)], 0)))){
} else {
console.error("instrument data-map should only contains [:type :payload]");
}

return frontend.modules.instrumentation.posthog.capture(type,payload);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"capture-error","capture-error",583122432),(function (p__91559){
var vec__91560 = p__91559;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91560,(0),null);
var map__91563 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91560,(1),null);
var map__91563__$1 = cljs.core.__destructure_map(map__91563);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91563__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91563__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var vec__91564 = cljs.core.deref(frontend.fs.sync.graphs_txid);
var user_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91564,(0),null);
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91564,(1),null);
var tx_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91564,(2),null);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"exec-plugin-cmd","exec-plugin-cmd",1049730302),(function (p__91567){
var vec__91568 = p__91567;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91568,(0),null);
var map__91571 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91568,(1),null);
var map__91571__$1 = cljs.core.__destructure_map(map__91571);
var pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91571__$1,new cljs.core.Keyword(null,"pid","pid",1018387698));
var cmd = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91571__$1,new cljs.core.Keyword(null,"cmd","cmd",-302931143));
var action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91571__$1,new cljs.core.Keyword(null,"action","action",-811238024));
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cmd,action);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"shortcut-handler-refreshed","shortcut-handler-refreshed",1293579011),(function (p__91572){
var vec__91573 = p__91572;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91573,(0),null);
if(cljs.core.truth_(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_))){
return null;
} else {
cljs.core.reset_BANG_(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_,true);

return frontend.modules.shortcut.core.consume_pending_shortcuts_BANG_();
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("mobile","keyboard-will-show","mobile/keyboard-will-show",2010922836),(function (p__91576){
var vec__91577 = p__91576;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91577,(0),null);
var keyboard_height = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91577,(1),null);
var main_node = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557)),"RECORDING")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),true);
} else {
}

var temp__5804__auto___91759 = document.querySelector(":root");
if(cljs.core.truth_(temp__5804__auto___91759)){
var html_91760 = temp__5804__auto___91759;
html_91760.style.setProperty("--ls-native-kb-height",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));

html_91760.classList.add("has-mobile-keyboard");

html_91760.style.setProperty("--ls-native-toolbar-opacity",(1));
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
cljs.core.reset_BANG_(frontend.util.keyboard_height,keyboard_height);

return (main_node.style.marginBottom = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(keyboard_height),"px"].join(''));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("mobile","keyboard-will-hide","mobile/keyboard-will-hide",-1974048806),(function (p__91580){
var vec__91581 = p__91580;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91581,(0),null);
var main_node = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557)),"RECORDING")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),false);
} else {
}

var temp__5804__auto___91761 = document.querySelector(":root");
if(cljs.core.truth_(temp__5804__auto___91761)){
var html_91762 = temp__5804__auto___91761;
html_91762.style.removeProperty("--ls-native-kb-height");

html_91762.style.setProperty("--ls-native-toolbar-opacity",(0));

html_91762.classList.remove("has-mobile-keyboard");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
var temp__5804__auto___91763 = document.querySelector(".cards-review");
if(cljs.core.truth_(temp__5804__auto___91763)){
var card_preview_el_91764 = temp__5804__auto___91763;
(card_preview_el_91764.style.marginBottom = "0px");
} else {
}

(main_node.style.marginBottom = "0px");

var temp__5804__auto___91765 = goog.dom.getElement("left-sidebar");
if(cljs.core.truth_(temp__5804__auto___91765)){
var left_sidebar_node_91766 = temp__5804__auto___91765;
(left_sidebar_node_91766.style.bottom = "0px");
} else {
}

var temp__5804__auto__ = goog.dom.getElementByClass("sidebar-item-list");
if(cljs.core.truth_(temp__5804__auto__)){
var right_sidebar_node = temp__5804__auto__;
return (right_sidebar_node.style.paddingBottom = "150px");
} else {
return null;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","hook-db-tx","plugin/hook-db-tx",1065547419),(function (p__91585){
var vec__91586 = p__91585;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91586,(0),null);
var map__91589 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91586,(1),null);
var map__91589__$1 = cljs.core.__destructure_map(map__91589);
var payload = map__91589__$1;
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91589__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91589__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(blocks);
if(and__5000__auto__){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([payload,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__91584_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,p1__91584_SHARP_);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"rebuild-slash-commands-list","rebuild-slash-commands-list",-639662306),(function (p__91590){
var vec__91591 = p__91590;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91591,(0),null);
return (frontend.handler.page.rebuild_slash_commands_list_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.page.rebuild_slash_commands_list_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.page.rebuild_slash_commands_list_BANG_.call(null));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577),(function (p__91594){
var vec__91595 = p__91594;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91595,(0),null);
return frontend.modules.shortcut.core.refresh_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),(function (p__91598){
var vec__91599 = p__91598;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91599,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91599,(1),null);
var heading = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91599,(2),null);
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return frontend.handler.editor.set_heading_BANG_(id,heading);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","restored","graph/restored",1296384092),(function (p__91602){
var vec__91603 = p__91602;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91603,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91603,(1),null);
if(cljs.core.truth_(graph)){
frontend.handler.assets.ensure_assets_dir_BANG_(graph);
} else {
}

frontend.handler.db_based.rtc_flows.trigger_rtc_start(graph);

frontend.extensions.fsrs.update_due_cards_count();

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return null;
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","ready","graph/ready",1121782733),graph], null));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"whiteboard-link","whiteboard-link",467575349),(function (p__91606){
var vec__91607 = p__91606;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91607,(0),null);
var shapes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91607,(1),null);
frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("whiteboard","link","whiteboard/link",-2040799017));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","linked-shapes","whiteboard/linked-shapes",-1743561352),shapes);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"whiteboard-go-to-link","whiteboard-go-to-link",855027368),(function (p__91610){
var vec__91611 = p__91610;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91611,(0),null);
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91611,(1),null);
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),link], null)], null));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","save-db-to-disk","graph/save-db-to-disk",-1288279162),(function (p__91614){
var vec__91615 = p__91614;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91615,(0),null);
var _opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91615,(1),null);
return frontend.persist_db.export_current_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"succ-notification?","succ-notification?",-1467312225),true,new cljs.core.Keyword(null,"force-save?","force-save?",-1690725991),true], null)], 0));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("ui","re-render-root","ui/re-render-root",-1358783476),(function (p__91618){
var vec__91619 = p__91618;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91619,(0),null);
return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("run","cli-command","run/cli-command",503686384),(function (p__91622){
var vec__91623 = p__91622;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91623,(0),null);
var command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91623,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91623,(2),null);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","quick-capture","editor/quick-capture",799865811),(function (p__91626){
var vec__91627 = p__91626;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91627,(0),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91627,(1),null);
return frontend.quick_capture.quick_capture(args);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","keymap","modal/keymap",-57371819),(function (p__91630){
var vec__91631 = p__91630;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91631,(0),null);
return frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"keymap","keymap",-499605268));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),(function (p__91635){
var vec__91636 = p__91635;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91636,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91636,(1),null);
var batch_QMARK_ = cljs.core.sequential_QMARK_(blocks);
var blocks__$1 = (function (){var G__91639 = blocks;
if(batch_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__91634_SHARP_){
var G__91640 = p1__91634_SHARP_;
if(((cljs.core.uuid_QMARK_(p1__91634_SHARP_)) || (typeof p1__91634_SHARP_ === 'string'))){
return frontend.db.model.get_block_by_uuid(G__91640);
} else {
return G__91640;
}
}),G__91639);
} else {
return G__91639;
}
})();
if(((batch_QMARK_) && ((cljs.core.count(blocks__$1) > (1))))){
return frontend.handler.editor.toggle_blocks_as_own_order_list_BANG_(blocks__$1);
} else {
var temp__5804__auto__ = (function (){var G__91641 = blocks__$1;
if(batch_QMARK_){
return cljs.core.first(G__91641);
} else {
return G__91641;
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","remove-own-number-list","editor/remove-own-number-list",-492965226),(function (p__91642){
var vec__91643 = p__91642;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91643,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91643,(1),null);
if(cljs.core.truth_((function (){var G__91646 = block;
if((G__91646 == null)){
return null;
} else {
return frontend.handler.editor.own_order_number_list_QMARK_(G__91646);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","focus-code-editor","editor/focus-code-editor",-682196012),(function (p__91647){
var vec__91648 = p__91647;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91648,(0),null);
var editing_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91648,(1),null);
var container = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91648,(2),null);
var temp__5804__auto__ = frontend.util.get_cm_instance(container);
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
if(cljs.core.truth_(cm.hasFocus())){
return null;
} else {
var cursor_pos = (function (){var G__91651 = new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var G__91651__$1 = (((G__91651 == null))?null:cljs.core.deref(G__91651));
if((G__91651__$1 == null)){
return null;
} else {
return cljs.core.count(G__91651__$1);
}
})();
var direction = new cljs.core.Keyword("block.editing","direction","block.editing/direction",-1821464148).cljs$core$IFn$_invoke$arity$1(editing_block);
var pos = new cljs.core.Keyword("block.editing","pos","block.editing/pos",-1255653791).cljs$core$IFn$_invoke$arity$1(editing_block);
var to_line = (function (){var G__91652 = direction;
var G__91652__$1 = (((G__91652 instanceof cljs.core.Keyword))?G__91652.fqn:null);
switch (G__91652__$1) {
case "up":
return cm.lastLine();

break;
default:
var G__91653 = pos;
var G__91653__$1 = (((G__91653 instanceof cljs.core.Keyword))?G__91653.fqn:null);
switch (G__91653__$1) {
case "max":
return cm.lastLine();

break;
default:
return (0);

}

}
})();
var G__91654 = cm;
G__91654.focus();

G__91654.setCursor(to_line,(function (){var or__5002__auto__ = cursor_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());

return G__91654;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-children-number-list","editor/toggle-children-number-list",-1804483433),(function (p__91655){
var vec__91656 = p__91655;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91656,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91656,(1),null);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),(function (p__91660){
var vec__91661 = p__91660;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91661,(0),null);
var map__91664 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91661,(1),null);
var map__91664__$1 = cljs.core.__destructure_map(map__91664);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91664__$1,new cljs.core.Keyword(null,"block","block",664686210));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91664__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var lang = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91664__$1,new cljs.core.Keyword(null,"lang","lang",-1819677104));
var update_current_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91664__$1,new cljs.core.Keyword(null,"update-current-block?","update-current-block?",-507726186));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(update_current_block_QMARK_)?null:frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0())),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(update_current_block_QMARK_)?null:promesa.core.delay.cljs$core$IFn$_invoke$arity$1((16)))),(function (___40947__auto____$1){
return promesa.protocols._promise((function (){var block__$1 = (function (){var G__91665 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__91665) : frontend.db.entity.call(null,G__91665));
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
var turn_type_BANG_ = (function (p1__91659_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.Keyword(null,"code","code",1586293142));
if(and__5000__auto__){
return latest_code_lang;
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.db_based.property.set_block_properties_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__91659_SHARP_),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),latest_code_lang], null));
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__91659_SHARP_),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type));
}
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((((((!((block_type == null)))) || (((cljs.core.not(update_current_block_QMARK_)) && ((!(clojure.string.blank_QMARK_(block_title))))))))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var vec__91666 = frontend.handler.editor.insert_new_block_aux_BANG_(cljs.core.PersistentArrayMap.EMPTY,block__$1,"");
var _p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91666,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91666,(1),null);
var block_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91666,(2),null);
return turn_type_BANG_(block_SINGLEQUOTE_);
} else {
var _STAR_outliner_ops_STAR__orig_val__91669 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__91670 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__91670);

try{var vec__91671_91769 = frontend.handler.editor.insert_new_block_aux_BANG_(cljs.core.PersistentArrayMap.EMPTY,block__$1,"");
var _p_91770 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91671_91769,(0),null);
var __91771__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91671_91769,(1),null);
var block_SINGLEQUOTE__91772 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91671_91769,(2),null);
turn_type_BANG_(block_SINGLEQUOTE__91772);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__91669);
}}
})()),(function (result){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(result)));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__91674 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__91674) : frontend.db.entity.call(null,G__91674));
} else {
return null;
}
})());
}));
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(turn_type_BANG_(block__$1)),(function (___40947__auto____$2){
return promesa.protocols._promise((function (){var G__91675 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__91675) : frontend.db.entity.call(null,G__91675));
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","sync-state","rtc/sync-state",-1325028836),(function (p__91676){
var vec__91677 = p__91676;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91677,(0),null);
var state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91677,(1),null);
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","state","rtc/state",-1988572624),(function (old){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old,state], 0));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),(function (p__91680){
var vec__91681 = p__91680;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91681,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91681,(1),null);
return frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),data);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("rtc","download-remote-graph","rtc/download-remote-graph",508601916),(function (p__91684){
var vec__91685 = p__91684;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91685,(0),null);
var graph_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91685,(1),null);
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91685,(2),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91685,(3),null);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._promise(frontend.handler.db_based.rtc._LT_rtc_download_graph_BANG_(graph_name,graph_uuid,graph_schema_version,(60000)));
})),(function (e){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["RTC download graph failed, error:"], 0));

return console.error(e);
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("db","sync-changes","db/sync-changes",584814072),(function (p__91688){
var vec__91689 = p__91688;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91689,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91689,(1),null);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","load-blocks","editor/load-blocks",428173962),(function (p__91692){
var vec__91693 = p__91692;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91693,(0),null);
var ids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91693,(1),null);
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
var c__32124__auto___91773 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_91724){
var state_val_91725 = (state_91724[(1)]);
if((state_val_91725 === (1))){
var state_91724__$1 = state_91724;
var statearr_91726_91774 = state_91724__$1;
(statearr_91726_91774[(2)] = null);

(statearr_91726_91774[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91725 === (2))){
var state_91724__$1 = state_91724;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91724__$1,(4),chan);
} else {
if((state_val_91725 === (3))){
var inst_91722 = (state_91724[(2)]);
var state_91724__$1 = state_91724;
return cljs.core.async.impl.ioc_helpers.return_chan(state_91724__$1,inst_91722);
} else {
if((state_val_91725 === (4))){
var inst_91701 = (state_91724[(7)]);
var inst_91701__$1 = (state_91724[(2)]);
var inst_91702 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_91701__$1,(0),null);
var inst_91703 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_91701__$1,(1),null);
var state_91724__$1 = (function (){var statearr_91727 = state_91724;
(statearr_91727[(7)] = inst_91701__$1);

(statearr_91727[(8)] = inst_91702);

(statearr_91727[(9)] = inst_91703);

return statearr_91727;
})();
var statearr_91728_91775 = state_91724__$1;
(statearr_91728_91775[(2)] = null);

(statearr_91728_91775[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91725 === (5))){
var inst_91702 = (state_91724[(8)]);
var _ = (function (){var statearr_91729 = state_91724;
(statearr_91729[(4)] = cljs.core.cons((8),(state_91724[(4)])));

return statearr_91729;
})();
var inst_91711 = frontend.handler.events.handle.cljs$core$IFn$_invoke$arity$1(inst_91702);
var inst_91712 = promesa.core.resolved(inst_91711);
var ___$1 = (function (){var statearr_91730 = state_91724;
(statearr_91730[(4)] = cljs.core.rest((state_91724[(4)])));

return statearr_91730;
})();
var state_91724__$1 = state_91724;
var statearr_91731_91776 = state_91724__$1;
(statearr_91731_91776[(2)] = inst_91712);

(statearr_91731_91776[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91725 === (6))){
var inst_91701 = (state_91724[(7)]);
var inst_91702 = (state_91724[(8)]);
var inst_91703 = (state_91724[(9)]);
var inst_91715 = (state_91724[(2)]);
var inst_91716 = (function (){var vec__91697 = inst_91701;
var payload = inst_91702;
var d = inst_91703;
return (function (result){
return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,result);
});
})();
var inst_91717 = promesa.core.then.cljs$core$IFn$_invoke$arity$2(inst_91715,inst_91716);
var inst_91718 = (function (){var vec__91697 = inst_91701;
var payload = inst_91702;
var d = inst_91703;
return (function (error){
var type = new cljs.core.Keyword("handle-system-events","failed","handle-system-events/failed",-2079184624);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null)], null)], null));

return promesa.core.reject_BANG_(d,error);
});
})();
var inst_91719 = promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(inst_91717,inst_91718);
var state_91724__$1 = (function (){var statearr_91733 = state_91724;
(statearr_91733[(10)] = inst_91719);

return statearr_91733;
})();
var statearr_91734_91777 = state_91724__$1;
(statearr_91734_91777[(2)] = null);

(statearr_91734_91777[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91725 === (7))){
var inst_91704 = (state_91724[(2)]);
var inst_91705 = promesa.core.rejected(inst_91704);
var state_91724__$1 = state_91724;
var statearr_91735_91778 = state_91724__$1;
(statearr_91735_91778[(2)] = inst_91705);

(statearr_91735_91778[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91725 === (8))){
var _ = (function (){var statearr_91736 = state_91724;
(statearr_91736[(4)] = cljs.core.rest((state_91724[(4)])));

return statearr_91736;
})();
var state_91724__$1 = state_91724;
var ex91732 = (state_91724__$1[(2)]);
var statearr_91737_91779 = state_91724__$1;
(statearr_91737_91779[(5)] = ex91732);


var statearr_91738_91780 = state_91724__$1;
(statearr_91738_91780[(1)] = (7));

(statearr_91738_91780[(5)] = null);



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
var frontend$handler$events$run_BANG__$_state_machine__32051__auto__ = null;
var frontend$handler$events$run_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_91739 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_91739[(0)] = frontend$handler$events$run_BANG__$_state_machine__32051__auto__);

(statearr_91739[(1)] = (1));

return statearr_91739;
});
var frontend$handler$events$run_BANG__$_state_machine__32051__auto____1 = (function (state_91724){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_91724);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e91740){var ex__32054__auto__ = e91740;
var statearr_91741_91781 = state_91724;
(statearr_91741_91781[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_91724[(4)]))){
var statearr_91742_91782 = state_91724;
(statearr_91742_91782[(1)] = cljs.core.first((state_91724[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__91783 = state_91724;
state_91724 = G__91783;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$events$run_BANG__$_state_machine__32051__auto__ = function(state_91724){
switch(arguments.length){
case 0:
return frontend$handler$events$run_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$events$run_BANG__$_state_machine__32051__auto____1.call(this,state_91724);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$run_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$run_BANG__$_state_machine__32051__auto____0;
frontend$handler$events$run_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$run_BANG__$_state_machine__32051__auto____1;
return frontend$handler$events$run_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_91743 = f__32125__auto__();
(statearr_91743[(6)] = c__32124__auto___91773);

return statearr_91743;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


return chan;
});

//# sourceMappingURL=frontend.handler.events.js.map
