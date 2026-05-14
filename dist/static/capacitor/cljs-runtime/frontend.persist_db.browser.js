goog.provide('frontend.persist_db.browser');
var module$node_modules$comlink$dist$umd$comlink=shadow.js.require("module$node_modules$comlink$dist$umd$comlink", {});
frontend.persist_db.browser.ask_persist_permission_BANG_ = (function frontend$persist_db$browser$ask_persist_permission_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.storage.persist()),(function (persistent_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(persistent_QMARK_)?console.log("Storage will not be cleared unless from explicit user action"):console.warn("OPFS storage may be cleared by the browser under storage pressure.")));
}));
}));
});
frontend.persist_db.browser.sync_app_state_BANG_ = (function frontend$persist_db$browser$sync_app_state_BANG_(){
var state_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__64996_SHARP_){
return cljs.core.select_keys(p1__64996_SHARP_,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("git","current-repo","git/current-repo",107438825),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946),new cljs.core.Keyword("auth","access-token","auth/access-token",-657486615),new cljs.core.Keyword("auth","refresh-token","auth/refresh-token",-1024820760)], null));
})),cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.watch(frontend.state.state)], 0));
var _LT_init_sync_done_QMARK_ = promesa.core.deferred();
var task = missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr64998_block_0 = (function frontend$persist_db$browser$sync_app_state_BANG__$_cr64998_block_0(cr64998_state){
try{var cr64998_place_0 = (1);
var cr64998_place_1 = missionary.core.relieve;
var cr64998_place_2 = state_flow;
var cr64998_place_3 = (function (){var G__65031 = cr64998_place_2;
var fexpr__65030 = cr64998_place_1;
return (fexpr__65030.cljs$core$IFn$_invoke$arity$1 ? fexpr__65030.cljs$core$IFn$_invoke$arity$1(G__65031) : fexpr__65030.call(null,G__65031));
})();
(cr64998_state[(0)] = cr64998_block_1);

return missionary.core.fork(cr64998_place_0,cr64998_place_3);
}catch (e65029){var cr64998_exception = e65029;
(cr64998_state[(0)] = null);

throw cr64998_exception;
}});
var cr64998_block_1 = (function frontend$persist_db$browser$sync_app_state_BANG__$_cr64998_block_1(cr64998_state){
try{var cr64998_place_4 = missionary.core.unpark();
var cr64998_place_5 = frontend.common.missionary._LT__BANG_;
var cr64998_place_6 = frontend.state._LT_invoke_db_worker;
var cr64998_place_7 = new cljs.core.Keyword("thread-api","sync-app-state","thread-api/sync-app-state",1507174044);
var cr64998_place_8 = cr64998_place_4;
var cr64998_place_9 = (function (){var G__65035 = cr64998_place_7;
var G__65036 = cr64998_place_8;
var fexpr__65034 = cr64998_place_6;
return (fexpr__65034.cljs$core$IFn$_invoke$arity$2 ? fexpr__65034.cljs$core$IFn$_invoke$arity$2(G__65035,G__65036) : fexpr__65034.call(null,G__65035,G__65036));
})();
var cr64998_place_10 = (function (){var G__65038 = cr64998_place_9;
var fexpr__65037 = cr64998_place_5;
return (fexpr__65037.cljs$core$IFn$_invoke$arity$1 ? fexpr__65037.cljs$core$IFn$_invoke$arity$1(G__65038) : fexpr__65037.call(null,G__65038));
})();
(cr64998_state[(0)] = cr64998_block_2);

return missionary.core.park(cr64998_place_10);
}catch (e65032){var cr64998_exception = e65032;
(cr64998_state[(0)] = null);

throw cr64998_exception;
}});
var cr64998_block_2 = (function frontend$persist_db$browser$sync_app_state_BANG__$_cr64998_block_2(cr64998_state){
try{var cr64998_place_11 = missionary.core.unpark();
var cr64998_place_12 = promesa.core.resolve_BANG_;
var cr64998_place_13 = _LT_init_sync_done_QMARK_;
var cr64998_place_14 = (function (){var G__65049 = cr64998_place_13;
var fexpr__65048 = cr64998_place_12;
return (fexpr__65048.cljs$core$IFn$_invoke$arity$1 ? fexpr__65048.cljs$core$IFn$_invoke$arity$1(G__65049) : fexpr__65048.call(null,G__65049));
})();
(cr64998_state[(0)] = null);

return cr64998_place_14;
}catch (e65045){var cr64998_exception = e65045;
(cr64998_state[(0)] = null);

throw cr64998_exception;
}});
return cloroutine.impl.coroutine((function (){var G__65053 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__65053[(0)] = cr64998_block_0);

return G__65053;
})());
})(),missionary.core.ap_run));
frontend.common.missionary.run_task_STAR_(task);

return _LT_init_sync_done_QMARK_;
});
frontend.persist_db.browser.get_route_data = (function frontend$persist_db$browser$get_route_data(route_match){
if(cljs.core.seq(route_match)){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"to","to",192099007),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null)),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"path-params","path-params",-48130597).cljs$core$IFn$_invoke$arity$1(route_match),new cljs.core.Keyword(null,"query-params","query-params",900640534),new cljs.core.Keyword(null,"query-params","query-params",900640534).cljs$core$IFn$_invoke$arity$1(route_match)], null);
} else {
return null;
}
});
frontend.persist_db.browser.sync_ui_state_BANG_ = (function frontend$persist_db$browser$sync_ui_state_BANG_(){
return cljs.core.add_watch(frontend.state.state,new cljs.core.Keyword(null,"sync-ui-state","sync-ui-state",-23416176),(function (_,___$1,prev,current){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("history","paused?","history/paused?",-21834005).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
return null;
} else {
var f = (function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.select_keys(state,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475)], null)),new cljs.core.Keyword(null,"route-data","route-data",626955263),frontend.persist_db.browser.get_route_data(new cljs.core.Keyword(null,"route-match","route-match",-1450985937).cljs$core$IFn$_invoke$arity$1(state)));
});
var old_state = f(prev);
var new_state = f(current);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new_state,old_state)){
return frontend.undo_redo.record_ui_state_BANG_(frontend.state.get_current_repo(),logseq.db.write_transit_str(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-state","old-state",1039580704),old_state,new cljs.core.Keyword(null,"new-state","new-state",-490349212),new_state], null)));
} else {
return null;
}
}
}));
});
frontend.persist_db.browser.transact_BANG_ = (function frontend$persist_db$browser$transact_BANG_(repo,tx_data,tx_meta){
var context = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"dev?","dev?",-613971064),new cljs.core.Keyword(null,"pages-directory","pages-directory",-1705912407),new cljs.core.Keyword(null,"journals-directory","journals-directory",1373812460),new cljs.core.Keyword(null,"importing?","importing?",-656840367),new cljs.core.Keyword(null,"node-test?","node-test?",-171079151),new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),new cljs.core.Keyword(null,"whiteboards-directory","whiteboards-directory",1994949079),new cljs.core.Keyword(null,"validate-db-options","validate-db-options",89965176),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),new cljs.core.Keyword(null,"preferred-format","preferred-format",-1784393121),new cljs.core.Keyword(null,"journal-file-name-format","journal-file-name-format",-323969121)],[frontend.config.dev_QMARK_,frontend.config.get_pages_directory(),frontend.config.get_journals_directory(),new cljs.core.Keyword("graph","importing","graph/importing",1647644617).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),frontend.util.node_test_QMARK_,frontend.state.get_export_bullet_indentation(),frontend.config.get_whiteboards_directory(),new cljs.core.Keyword("dev","validate-db-options","dev/validate-db-options",89933411).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0()),frontend.state.get_date_formatter(),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0(),(function (){var or__5002__auto__ = frontend.state.get_journal_file_name_format();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.date.default_journal_filename_formatter;
}
})()]);
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,tx_data,tx_meta,context], 0));
});
frontend.persist_db.browser.start_db_worker_BANG_ = (function frontend$persist_db$browser$start_db_worker_BANG_(){
if(frontend.util.node_test_QMARK_){
return null;
} else {
var worker_url = (cljs.core.truth_(frontend.util.electron_QMARK_())?"js/db-worker.js":(cljs.core.truth_(window.Capacitor)?"db-worker.js":"static/js/db-worker.js"));
var worker = (new Worker([worker_url,"?electron=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.electron_QMARK_()),"&publishing=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.publishing_QMARK_)].join('')));
var wrapped_worker_STAR_ = module$node_modules$comlink$dist$umd$comlink.wrap(worker);
var wrapped_worker = (function() { 
var G__65153__delegate = function (qkw,direct_pass_args_QMARK_,args){
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(wrapped_worker_STAR_.remoteInvoke([cljs.core.namespace(qkw),"/",cljs.core.name(qkw)].join(''),direct_pass_args_QMARK_,(cljs.core.truth_(direct_pass_args_QMARK_)?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args):logseq.db.write_transit_str(args))),logseq.db.read_transit_str);
};
var G__65153 = function (qkw,direct_pass_args_QMARK_,var_args){
var args = null;
if (arguments.length > 2) {
var G__65154__i = 0, G__65154__a = new Array(arguments.length -  2);
while (G__65154__i < G__65154__a.length) {G__65154__a[G__65154__i] = arguments[G__65154__i + 2]; ++G__65154__i;}
  args = new cljs.core.IndexedSeq(G__65154__a,0,null);
} 
return G__65153__delegate.call(this,qkw,direct_pass_args_QMARK_,args);};
G__65153.cljs$lang$maxFixedArity = 2;
G__65153.cljs$lang$applyTo = (function (arglist__65155){
var qkw = cljs.core.first(arglist__65155);
arglist__65155 = cljs.core.next(arglist__65155);
var direct_pass_args_QMARK_ = cljs.core.first(arglist__65155);
var args = cljs.core.rest(arglist__65155);
return G__65153__delegate(qkw,direct_pass_args_QMARK_,args);
});
G__65153.cljs$core$IFn$_invoke$arity$variadic = G__65153__delegate;
return G__65153;
})()
;
var t1 = (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
module$node_modules$comlink$dist$umd$comlink.expose(({"remoteInvoke": frontend.common.thread_api.remote_function}),worker);

frontend.handler.worker.handle_message_BANG_(worker,wrapped_worker);

cljs.core.reset_BANG_(frontend.state._STAR_db_worker,wrapped_worker);

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.browser.sync_app_state_BANG_()),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","init","thread-api/init",-589216819),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.RTC_WS_URL], 0))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(console.debug(["debug: init worker spent: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)) - t1)),"ms"].join(''))),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.browser.sync_ui_state_BANG_()),(function (___$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.browser.ask_persist_permission_BANG_()),(function (___$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","sync-context","graph/sync-context",1484639785)], null))),(function (___$5){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.register_transact_fn_BANG_((function frontend$persist_db$browser$start_db_worker_BANG__$_worker_transact_BANG_(repo,tx_data,tx_meta){
return frontend.db.transact.transact(frontend.persist_db.browser.transact_BANG_,((typeof repo === 'string')?repo:frontend.state.get_current_repo()),tx_data,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(tx_meta,new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
}))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.db.transact.listen_for_requests());
}));
}));
}));
}));
}));
}));
}));
})),(function (error){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"Can't init SQLite wasm"], 0));

return console.error(error);
}));
}
});
frontend.persist_db.browser._LT_export_db_BANG_ = (function frontend$persist_db$browser$_LT_export_db_BANG_(repo,data){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-export","db-export",-1136086824),repo,data], 0));
} else {
return null;
}
});
frontend.persist_db.browser.sqlite_error_handler = (function frontend$persist_db$browser$sqlite_error_handler(error){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["SQLiteDB error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join('')], null),new cljs.core.Keyword(null,"error","error",-978969032));
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {frontend.persist_db.protocol.PersistentDB}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
frontend.persist_db.browser.InBrowser = (function (__meta,__extmap,__hash){
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_new$arity$3 = (function (_this,repo,opts){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,opts], 0));
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_list_db$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","list-db","thread-api/list-db",-1703253943)),frontend.persist_db.browser.sqlite_error_handler);
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$arity$2 = (function (_this,repo){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","unsafe-unlink-db","thread-api/unsafe-unlink-db",1765912451),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0));
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_release_access_handles$arity$2 = (function (_this,repo){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","release-access-handles","thread-api/release-access-handles",892503250),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0));
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$arity$3 = (function (_this,repo,opts){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","db-exists","thread-api/db-exists",-788109529),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0))),(function (db_exists_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_exists_QMARK_)?null:electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-get","db-get",247583391),repo], 0)))),(function (disk_db_data){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(disk_db_data)?frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","import-db","thread-api/import-db",-966513630),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,disk_db_data], 0)):null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,opts], 0))),(function (___$1){
return promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-initial-data","thread-api/get-initial-data",-1216390318),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0)));
}));
}));
}));
}));
})),frontend.persist_db.browser.sqlite_error_handler);
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_export_db$arity$3 = (function (_this,repo,opts){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0))),(function (data){
return promesa.protocols._promise((cljs.core.truth_(data)?(cljs.core.truth_(new cljs.core.Keyword(null,"return-data?","return-data?",-956653504).cljs$core$IFn$_invoke$arity$1(opts))?data:frontend.persist_db.browser._LT_export_db_BANG_(repo,data)):null));
}));
})),(function (error){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"save-db-error","save-db-error",1835106996),repo], 0));

console.error(error);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["SQLiteDB save error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join('')], null),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.PersistentArrayMap.EMPTY;
}));
}));

(frontend.persist_db.browser.InBrowser.prototype.frontend$persist_db$protocol$PersistentDB$_LT_import_db$arity$3 = (function (_this,repo,data){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","import-db","thread-api/import-db",-966513630),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,data], 0)),(function (error){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"import-db-error","import-db-error",-1453566776),repo], 0));

console.error(error);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["SQLiteDB import error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join('')], null),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.PersistentArrayMap.EMPTY;
}));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65101,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65119 = k65101;
switch (G__65119) {
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65101,else__5303__auto__);

}
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65120){
var vec__65121 = p__65120;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65121,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65121,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#frontend.persist-db.browser.InBrowser{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65100){
var self__ = this;
var G__65100__$1 = this;
return (new cljs.core.RecordIter((0),G__65100__$1,0,cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new frontend.persist_db.browser.InBrowser(self__.__meta,self__.__extmap,self__.__hash));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (0 + cljs.core.count(self__.__extmap));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1039463082 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65102,other65103){
var self__ = this;
var this65102__$1 = this;
return (((!((other65103 == null)))) && ((((this65102__$1.constructor === other65103.constructor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65102__$1.__extmap,other65103.__extmap)))));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.EMPTY,k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new frontend.persist_db.browser.InBrowser(self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65101){
var self__ = this;
var this__5307__auto____$1 = this;
return cljs.core.contains_QMARK_(self__.__extmap,k65101);
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65100){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65134 = cljs.core.keyword_identical_QMARK_;
var expr__65135 = k__5309__auto__;
return (new frontend.persist_db.browser.InBrowser(self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65100),null));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65100){
var self__ = this;
var this__5299__auto____$1 = this;
return (new frontend.persist_db.browser.InBrowser(G__65100,self__.__extmap,self__.__hash));
}));

(frontend.persist_db.browser.InBrowser.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(frontend.persist_db.browser.InBrowser.getBasis = (function (){
return cljs.core.PersistentVector.EMPTY;
}));

(frontend.persist_db.browser.InBrowser.cljs$lang$type = true);

(frontend.persist_db.browser.InBrowser.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"frontend.persist-db.browser/InBrowser",null,(1),null));
}));

(frontend.persist_db.browser.InBrowser.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"frontend.persist-db.browser/InBrowser");
}));

/**
 * Positional factory function for frontend.persist-db.browser/InBrowser.
 */
frontend.persist_db.browser.__GT_InBrowser = (function frontend$persist_db$browser$__GT_InBrowser(){
return (new frontend.persist_db.browser.InBrowser(null,null,null));
});

/**
 * Factory function for frontend.persist-db.browser/InBrowser, taking a map of keywords to field values.
 */
frontend.persist_db.browser.map__GT_InBrowser = (function frontend$persist_db$browser$map__GT_InBrowser(G__65104){
var extmap__5342__auto__ = (function (){var G__65137 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$1(G__65104);
if(cljs.core.record_QMARK_(G__65104)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65137);
} else {
return G__65137;
}
})();
return (new frontend.persist_db.browser.InBrowser(null,cljs.core.not_empty(extmap__5342__auto__),null));
});


//# sourceMappingURL=frontend.persist_db.browser.js.map
