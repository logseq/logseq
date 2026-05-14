goog.provide('frontend.handler.worker');
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.worker !== 'undefined') && (typeof frontend.handler.worker.handle !== 'undefined')){
} else {
frontend.handler.worker.handle = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__64802 = cljs.core.get_global_hierarchy;
return (fexpr__64802.cljs$core$IFn$_invoke$arity$0 ? fexpr__64802.cljs$core$IFn$_invoke$arity$0() : fexpr__64802.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.handler.worker","handle"),cljs.core.identity,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"write-files","write-files",1810322942),(function (_,_worker,data){
var map__64805 = data;
var map__64805__$1 = cljs.core.__destructure_map(map__64805);
var request_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64805__$1,new cljs.core.Keyword(null,"request-id","request-id",-985684093));
var page_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64805__$1,new cljs.core.Keyword(null,"page-id","page-id",-872941168));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64805__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64805__$1,new cljs.core.Keyword(null,"files","files",-472457450));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_files(repo,files,cljs.core.PersistentArrayMap.EMPTY)),(function (___$1){
return promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","page-file-saved","thread-api/page-file-saved",-441358548),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([request_id,page_id], 0)));
}));
})),(function (error){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Write file failed, please copy the changes to other editors in case of losing data."], null),"Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.stack)], null),new cljs.core.Keyword(null,"error","error",-978969032));

return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","page-file-saved","thread-api/page-file-saved",-441358548),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([request_id,page_id], 0));
}));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"notification","notification",-222338233),(function (_,_worker,data){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.handler.notification.show_BANG_,data);
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"log","log",-1595516004),(function (_,_worker,p__64808){
var vec__64809 = p__64808;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64809,(0),null);
var level = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64809,(1),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64809,(2),null);
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$3(name,level,data);
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"add-repo","add-repo",1885345931),(function (_,_worker,data){
frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(data)], null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(data),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"rtc-download?","rtc-download?",453352962),true], null)], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"rtc-sync-state","rtc-sync-state",-661353236),(function (_,_worker,data){
var state = data;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("rtc","sync-state","rtc/sync-state",-1325028836),state], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"sync-db-changes","sync-db-changes",-1236993461),(function (_,_worker,data){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","sync-changes","db/sync-changes",584814072),data], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"rtc-log","rtc-log",1926627661),(function (_,_worker,log){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),log], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"export-current-db","export-current-db",-728527384),(function (_){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","export-sqlite","db/export-sqlite",703008892)], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"capture-error","capture-error",583122432),(function (_,_worker,data){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),data], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"backup-file","backup-file",-560755353),(function (_,_worker,data){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","backup-file","graph/backup-file",-457945391),data], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"notify-existing-file","notify-existing-file",1395099748),(function (_,_worker,data){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","notify-existing-file","graph/notify-existing-file",1565444534),data], null));
}));
frontend.handler.worker.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (_,_worker,data){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"Worker data not handled: ",data], 0));
}));
frontend.handler.worker.handle_message_BANG_ = (function frontend$handler$worker$handle_message_BANG_(worker,wrapped_worker){
if(cljs.core.truth_(worker)){
} else {
throw (new Error(["Assert failed: ","worker doesn't exists","\n","worker"].join('')));
}

return (worker.onmessage = (function (event){
var data = event.data;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(data,"keepAliveResponse")){
return worker.postMessage("keepAliveRequest");
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["RELEASE",null,"RAW",null,"APPLY",null], null), null),data.type)){
return null;
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("HANDLER",data.type)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("throw",data.name)))){
if(cljs.core.truth_(data.value.isError)){
console.error("Unexpected webworker error:",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs_bean.core.__GT_clj(data),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217)], null)));

return console.log(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs_bean.core.__GT_clj(data),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"stack","stack",-793405930)], null)));
} else {
return console.error("Unexpected webworker error :",data);
}
} else {
if(typeof data === 'string'){
var vec__64815 = logseq.db.read_transit_str(data);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64815,(0),null);
var payload = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64815,(1),null);
return frontend.handler.worker.handle.cljs$core$IFn$_invoke$arity$3(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(e),wrapped_worker,payload);
} else {
return console.error("Worker received invalid data from worker: ",data);
}
}
}
}
}));
});

//# sourceMappingURL=frontend.handler.worker.js.map
