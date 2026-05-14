goog.provide('frontend.mobile.graph_picker');
frontend.mobile.graph_picker.validate_graph_dirname = (function frontend$mobile$graph_picker$validate_graph_dirname(root,dirname){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(root,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([dirname], 0));
});
frontend.mobile.graph_picker.toggle_item = rum.core.lazy_build(rum.core.build_defc,(function (p__93454){
var map__93455 = p__93454;
var map__93455__$1 = cljs.core.__destructure_map(map__93455);
var on_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93455__$1,new cljs.core.Keyword(null,"on?","on?",-74017086));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93455__$1,new cljs.core.Keyword(null,"title","title",636505583));
var on_toggle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93455__$1,new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.justify-between.w-full.py-1","span.flex.items-center.justify-between.w-full.py-1",-303126278),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),title], null),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(on_QMARK_,(function (){
return null;
}),true)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),["toggle-item ",(cljs.core.truth_(on_QMARK_)?"is-on":null)].join(''),new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (p1__93453_SHARP_){
return frontend.util.stop(p1__93453_SHARP_);
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.fn_QMARK_(on_toggle)){
var G__93457 = cljs.core.not(on_QMARK_);
return (on_toggle.cljs$core$IFn$_invoke$arity$1 ? on_toggle.cljs$core$IFn$_invoke$arity$1(G__93457) : on_toggle.call(null,G__93457));
} else {
return null;
}
})], 0)));
}),null,"frontend.mobile.graph-picker/toggle-item");
frontend.mobile.graph_picker.graph_picker_cp = rum.core.lazy_build(rum.core.build_defc,(function (p__93460){
var map__93461 = p__93460;
var map__93461__$1 = cljs.core.__destructure_map(map__93461);
var opts = map__93461__$1;
var onboarding_and_home_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93461__$1,new cljs.core.Keyword(null,"onboarding-and-home?","onboarding-and-home?",2124338635));
var logged_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93461__$1,new cljs.core.Keyword(null,"logged?","logged?",-814149905));
var native_icloud_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93461__$1,new cljs.core.Keyword(null,"native-icloud?","native-icloud?",-1892335688));
var can_logseq_sync_QMARK_ = (function (){var and__5000__auto__ = logged_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.enable_sync_QMARK_();
} else {
return and__5000__auto__;
}
})();
var vec__93462 = rum.core.use_state(new cljs.core.Keyword(null,"init","init",-1875481434));
var step = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93462,(0),null);
var set_step_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93462,(1),null);
var vec__93465 = rum.core.use_state((cljs.core.truth_(can_logseq_sync_QMARK_)?new cljs.core.Keyword(null,"logseq-sync","logseq-sync",-1666232809):(cljs.core.truth_(native_icloud_QMARK_)?new cljs.core.Keyword(null,"icloud-sync","icloud-sync",-1926574907):null)));
var sync_mode = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93465,(0),null);
var set_sync_mode_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93465,(1),null);
var icloud_sync_on_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sync_mode,new cljs.core.Keyword(null,"icloud-sync","icloud-sync",-1926574907));
var logseq_sync_on_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sync_mode,new cljs.core.Keyword(null,"logseq-sync","logseq-sync",-1666232809));
var _STAR_input_ref = rum.core.create_ref();
var native_ios_QMARK_ = frontend.mobile.util.native_ios_QMARK_();
var open_picker = (function (){
return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.refresh_BANG_,opts);
});
var on_create = (function (input_val){
var graph_name = frontend.util.safe_sanitize_file_name(input_val);
if(clojure.string.blank_QMARK_(graph_name)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1("Illegal graph folder name.");
} else {
var temp__5804__auto__ = ((icloud_sync_on_QMARK_)?frontend.state.get_icloud_container_root_url():frontend.state.get_local_container_root_url());
if(cljs.core.truth_(temp__5804__auto__)){
var root = temp__5804__auto__;
var graph_path = frontend.mobile.graph_picker.validate_graph_dirname(root,graph_name);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.fs.mkdir_if_not_exists(graph_path),(function (){
if(icloud_sync_on_QMARK_){
return (new Promise((function (resolve,_reject){
return setTimeout((function (){
return (resolve.cljs$core$IFn$_invoke$arity$0 ? resolve.cljs$core$IFn$_invoke$arity$0() : resolve.call(null));
}),(1000));
})));
} else {
return promesa.core.resolved(null);
}
})),(function (){
frontend.handler.file_based.native_fs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2(graph_path,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089),(function (){
if(logseq_sync_on_QMARK_){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("sync","create-remote-graph","sync/create-remote-graph",-1953229831),frontend.state.get_current_repo()], null));
} else {
return null;
}
})], null),opts], 0)));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Create graph: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name)].join(''),new cljs.core.Keyword(null,"success","success",1890645906));
})),(function (e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"error","error",-978969032));

return console.error(e);
}));
} else {
return null;
}
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = onboarding_and_home_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return rum.core.deref(_STAR_input_ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
var handle = (function (){
return setTimeout((function (){
return input.scrollIntoView(({"behavior": "smooth", "block": "center", "inline": "nearest"}));
}),(100));
});
input.addEventListener("focus",handle);

return handle();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [step], null));

return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__graph-picker","w-full",(cljs.core.truth_(onboarding_and_home_QMARK_)?frontend.util.hiccup__GT_class("px-10.py-10"):null)], null))},[(cljs.core.truth_(onboarding_and_home_QMARK_)?null:daiquiri.core.create_element("h1",{'className':"flex items-center"},[(function (){var attrs93469 = frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93469))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["scale-75"], null)], null),attrs93469], 0))):{'className':"scale-75"}),((cljs.core.map_QMARK_(attrs93469))?null:[daiquiri.interpreter.interpret(attrs93469)]));
})(),daiquiri.core.create_element("span",{'className':"pl-1"},["Set up a graph"])])),(function (){var G__93472 = step;
var G__93472__$1 = (((G__93472 instanceof cljs.core.Keyword))?G__93472.fqn:null);
switch (G__93472__$1) {
case "init":
var attrs93468 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.justify-between.w-full.py-1","span.flex.items-center.justify-between.w-full.py-1",-303126278),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Create a new graph"], null),frontend.ui.icon("chevron-right")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = native_ios_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.some((function (s){
return (!(clojure.string.blank_QMARK_(s)));
}),cljs.core.vals(new cljs.core.Keyword("mobile","container-urls","mobile/container-urls",149073836).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
} else {
return and__5000__auto__;
}
})())){
return (set_step_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_step_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"new-graph","new-graph",1985980678)) : set_step_BANG_.call(null,new cljs.core.Keyword(null,"new-graph","new-graph",1985980678)));
} else {
return open_picker();
}
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93468))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","w-full","space-y-6"], null)], null),attrs93468], 0))):{'className':"flex flex-col w-full space-y-6"}),((cljs.core.map_QMARK_(attrs93468))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.justify-between.w-full.py-1","span.flex.items-center.justify-between.w-full.py-1",-303126278),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Select an existing graph"], null),frontend.ui.icon("folder-plus")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.refresh_BANG_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dir","dir",1734754661),(cljs.core.truth_(native_ios_QMARK_)?(function (){var or__5002__auto__ = frontend.state.get_icloud_container_root_url();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_local_container_root_url();
}
})():null)], null));
})], 0)))]:[daiquiri.interpreter.interpret(attrs93468),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.justify-between.w-full.py-1","span.flex.items-center.justify-between.w-full.py-1",-303126278),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Select an existing graph"], null),frontend.ui.icon("folder-plus")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.refresh_BANG_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dir","dir",1734754661),(cljs.core.truth_(native_ios_QMARK_)?(function (){var or__5002__auto__ = frontend.state.get_icloud_container_root_url();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_local_container_root_url();
}
})():null)], null));
})], 0)))]));

break;
case "new-graph":
return daiquiri.core.create_element("div",{'className':"flex flex-col w-full space-y-3 faster fade-in"},[daiquiri.core.create_element("input",{'autoFocus':true,'ref':_STAR_input_ref,'placeholder':"What's the graph name?",'className':"form-input block"},[]),(function (){var attrs93475 = (cljs.core.truth_(can_logseq_sync_QMARK_)?frontend.mobile.graph_picker.toggle_item(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Logseq sync",new cljs.core.Keyword(null,"on?","on?",-74017086),logseq_sync_on_QMARK_,new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774),(function (p1__93458_SHARP_){
var G__93477 = (cljs.core.truth_(p1__93458_SHARP_)?new cljs.core.Keyword(null,"logseq-sync","logseq-sync",-1666232809):(cljs.core.truth_(native_icloud_QMARK_)?new cljs.core.Keyword(null,"icloud-sync","icloud-sync",-1926574907):null));
return (set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1(G__93477) : set_sync_mode_BANG_.call(null,G__93477));
})], null)):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93475))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col"], null)], null),attrs93475], 0))):{'className':"flex flex-col"}),((cljs.core.map_QMARK_(attrs93475))?[(cljs.core.truth_((function (){var and__5000__auto__ = native_icloud_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(logseq_sync_on_QMARK_));
} else {
return and__5000__auto__;
}
})())?frontend.mobile.graph_picker.toggle_item(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"iCloud sync",new cljs.core.Keyword(null,"on?","on?",-74017086),icloud_sync_on_QMARK_,new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774),(function (p1__93459_SHARP_){
var G__93479 = (cljs.core.truth_(p1__93459_SHARP_)?new cljs.core.Keyword(null,"icloud-sync","icloud-sync",-1926574907):null);
return (set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1(G__93479) : set_sync_mode_BANG_.call(null,G__93479));
})], null)):null)]:[daiquiri.interpreter.interpret(attrs93475),(cljs.core.truth_((function (){var and__5000__auto__ = native_icloud_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(logseq_sync_on_QMARK_));
} else {
return and__5000__auto__;
}
})())?frontend.mobile.graph_picker.toggle_item(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"iCloud sync",new cljs.core.Keyword(null,"on?","on?",-74017086),icloud_sync_on_QMARK_,new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774),(function (p1__93459_SHARP_){
var G__93481 = (cljs.core.truth_(p1__93459_SHARP_)?new cljs.core.Keyword(null,"icloud-sync","icloud-sync",-1926574907):null);
return (set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sync_mode_BANG_.cljs$core$IFn$_invoke$arity$1(G__93481) : set_sync_mode_BANG_.call(null,G__93481));
})], null)):null)]));
})(),(function (){var attrs93476 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("chevron-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)),"Back"], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_step_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_step_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"init","init",-1875481434)) : set_step_BANG_.call(null,new cljs.core.Keyword(null,"init","init",-1875481434)));
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93476))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-between","items-center","pt-2"], null)], null),attrs93476], 0))):{'className':"flex justify-between items-center pt-2"}),((cljs.core.map_QMARK_(attrs93476))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var val = frontend.util.trim_safe(rum.core.deref(_STAR_input_ref).value);
if(clojure.string.blank_QMARK_(val)){
return rum.core.deref(_STAR_input_ref).focus();
} else {
return on_create(val);
}
})], 0)))]:[daiquiri.interpreter.interpret(attrs93476),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var val = frontend.util.trim_safe(rum.core.deref(_STAR_input_ref).value);
if(clojure.string.blank_QMARK_(val)){
return rum.core.deref(_STAR_input_ref).focus();
} else {
return on_create(val);
}
})], 0)))]));
})()]);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__93472__$1)].join('')));

}
})()]);
}),null,"frontend.mobile.graph-picker/graph-picker-cp");

//# sourceMappingURL=frontend.mobile.graph_picker.js.map
