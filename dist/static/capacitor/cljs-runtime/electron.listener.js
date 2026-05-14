goog.provide('electron.listener');
/**
 * Force the callback result to be nil, otherwise, ipc calls could lead to
 *   window crash.
 */
electron.listener.safe_api_call = (function electron$listener$safe_api_call(k,f){
return window.apis.on(k,(function (data){
(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(data) : f.call(null,data));

return null;
}));
});
electron.listener.listen_to_electron_BANG_ = (function electron$listener$listen_to_electron_BANG_(){
electron.listener.safe_api_call("file-watcher",(function (data){
var map__91187 = cljs_bean.core.__GT_clj(data);
var map__91187__$1 = cljs.core.__destructure_map(map__91187);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91187__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91187__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var path = logseq.common.util.path_normalize(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(payload));
var dir = new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(payload);
var payload__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(payload,new cljs.core.Keyword(null,"path","path",-188191168),logseq.common.path.relative_path(dir,path));
frontend.fs.watcher_handler.handle_changed_BANG_(type,payload__$1);

if(cljs.core.truth_(frontend.handler.file_sync.enable_sync_QMARK_())){
return frontend.fs.sync.file_watch_handler(type,payload__$1);
} else {
return null;
}
}));

electron.listener.safe_api_call("file-sync-progress",(function (data){
var payload = cljs_bean.core.__GT_clj(data);
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),new cljs.core.Keyword(null,"graphUUID","graphUUID",673814859).cljs$core$IFn$_invoke$arity$1(payload),new cljs.core.Keyword("file-sync","progress","file-sync/progress",-1051866953),new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(payload)], null),payload);
}));

electron.listener.safe_api_call("notification",(function (data){
var map__91188 = cljs_bean.core.__GT_clj(data);
var map__91188__$1 = cljs.core.__destructure_map(map__91188);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91188__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91188__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var type__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type);
var comp = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),cljs.core.str.cljs$core$IFn$_invoke$arity$1(payload)], null);
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(comp,type__$1,false);
}));

electron.listener.safe_api_call("rebuildSearchIndice",(function (_data){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Rebuild search indices"], 0));

return frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();
}));

electron.listener.safe_api_call("setGitUsernameAndEmail",(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","set-git-username-and-email","modal/set-git-username-and-email",-1189789991)], null));
}));

electron.listener.safe_api_call("setCurrentGraph",(function (){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var graph = temp__5804__auto__;
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"setCurrentGraph","setCurrentGraph",391110974),graph], 0));
} else {
return null;
}
}));

electron.listener.safe_api_call("redirect",(function (data){
var map__91189 = cljs_bean.core.__GT_clj(data);
var map__91189__$1 = cljs.core.__destructure_map(map__91189);
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91189__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var payload__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(payload,new cljs.core.Keyword(null,"to","to",192099007),cljs.core.keyword);
return frontend.handler.route.redirect_BANG_(payload__$1);
}));

electron.listener.safe_api_call("redirectWhenExists",(function (data){
var map__91190 = cljs_bean.core.__GT_clj(data);
var map__91190__$1 = cljs.core.__destructure_map(map__91190);
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91190__$1,new cljs.core.Keyword(null,"page-name","page-name",974981762));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91190__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91190__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
if(cljs.core.truth_(page_name)){
if(cljs.core.truth_((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)))){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(page_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null));
} else {
return null;
}
} else {
if(cljs.core.truth_(block_id)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0))),(function (block){
return promesa.protocols._promise((cljs.core.truth_(block)?((frontend.handler.property.util.shape_block_QMARK_(block))?frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null)):frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(block_id)):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Open link failed. Block-id `",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),"` doesn't exist in the graph."].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false)));
}));
}));
} else {
if(cljs.core.truth_(file)){
var temp__5802__auto__ = frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$2(file,false);
if(cljs.core.truth_(temp__5802__auto__)){
var db_page_name = temp__5802__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(db_page_name);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Open link failed. File `",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file),"` doesn't exist in the graph."].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false);
}
} else {
return null;
}
}
}
}));

electron.listener.safe_api_call("foundInPage",(function (data){
var data_SINGLEQUOTE_ = cljs_bean.core.__GT_clj(data);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"matches","matches",635497998)], null),data_SINGLEQUOTE_);

dommy.core.remove_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(document.getElementById("search-in-page-input"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"visibility","visibility",1338380893)], 0));

dommy.core.set_text_BANG_(document.getElementById("search-in-page-placeholder"),"");

return frontend.ui.focus_element("search-in-page-input");
}));

electron.listener.safe_api_call("loginCallback",(function (code){
return frontend.handler.user.login_callback(code);
}));

electron.listener.safe_api_call("quickCapture",(function (args){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","quick-capture","editor/quick-capture",799865811),args], null));
}));

electron.listener.safe_api_call("openNewWindowOfGraph",(function (repo){
return frontend.handler.ui.open_new_window_or_tab_BANG_(repo);
}));

electron.listener.safe_api_call("invokeLogseqAPI",(function (data){
var sync_id = data.syncId;
var method = data.method;
var ns_method = (function (){var G__91191 = method;
if((G__91191 == null)){
return null;
} else {
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__91191,"@");
}
})();
var ns_SINGLEQUOTE_ = cljs.core.first(ns_method);
var method_SINGLEQUOTE_ = cljs.core.last(ns_method);
var args = data.args;
var ret_fn_BANG_ = (function (p1__91184_SHARP_){
return electron.ipc.invoke.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("electron.server","sync!","electron.server/sync!",749164490)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sync_id)].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__91184_SHARP_], 0));
});
var app_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["app",null,"editor",null], null), null),ns_SINGLEQUOTE_);
var sdk1 = (window.logseq["api"]);
var sdk2 = (window.logseq["sdk"]);
try{cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["invokeLogseqAPI:",method], 0));

var methodTarget = ((app_QMARK_)?sdk1:(sdk2[ns_SINGLEQUOTE_]));
if(cljs.core.truth_(methodTarget)){
} else {
throw (new Error(["MethodNotExist: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(method)].join('')));
}

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.promise.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.js_invoke,methodTarget,method_SINGLEQUOTE_,args)),(function (p1__91185_SHARP_){
return ret_fn_BANG_(p1__91185_SHARP_);
})),(function (p1__91186_SHARP_){
return ret_fn_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),p1__91186_SHARP_], null));
}));
}catch (e91192){if((e91192 instanceof Error)){
var e = e91192;
return ret_fn_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e.message], null));
} else {
throw e91192;

}
}}));

electron.listener.safe_api_call("syncAPIServerState",(function (data){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","server","electron/server",1484164422),cljs_bean.core.__GT_clj(data));
}));

return electron.listener.safe_api_call("handbook",(function (data){
var temp__5804__auto__ = (function (){var and__5000__auto__ = data;
if(cljs.core.truth_(and__5000__auto__)){
return data.key;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var k = temp__5804__auto__;
return frontend.state.open_handbook_pane_BANG_(k);
} else {
return null;
}
}));
});
electron.listener.listen_BANG_ = (function electron$listener$listen_BANG_(){
return electron.listener.listen_to_electron_BANG_();
});

//# sourceMappingURL=electron.listener.js.map
