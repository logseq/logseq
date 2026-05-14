goog.provide('frontend.db.rtc.debug_ui');
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.rtc !== 'undefined') && (typeof frontend.db.rtc.debug_ui !== 'undefined') && (typeof frontend.db.rtc.debug_ui.debug_state !== 'undefined')){
} else {
frontend.db.rtc.debug_ui.debug_state = new cljs.core.Keyword("rtc","state","rtc/state",-1988572624).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
}
frontend.db.rtc.debug_ui.stop = (function frontend$db$rtc$debug_ui$stop(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","rtc-stop","thread-api/rtc-stop",-126094172))),(function (___41611__auto__){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.db.rtc.debug_ui.debug_state,null));
}));
}));
});
frontend.db.rtc.debug_ui.rtc_debug_ui = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var debug_state_STAR_ = rum.core.react(frontend.db.rtc.debug_ui.debug_state);
var rtc_logs = cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","logs","frontend.db.rtc.debug-ui/logs",-432801449)));
var rtc_state = new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
var rtc_lock = new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
return daiquiri.core.create_element("div",{'onClick':(function (e){
var temp__5804__auto__ = e.target.closest(".ui__button");
if(cljs.core.truth_(temp__5804__auto__)){
var btn = temp__5804__auto__;
btn.setAttribute("disabled","true");

return setTimeout((function (){
return btn.removeAttribute("disabled");
}),(2000));
} else {
return null;
}
})},[(function (){var attrs129154 = (function (){var G__129290 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","rtc-get-debug-state","thread-api/rtc-get-debug-state",245309807))),(function (new_state){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.db.rtc.debug_ui.debug_state,(function (old){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old,new_state], 0));
})));
}));
}));
})], null);
var G__129291 = logseq.shui.ui.tabler_icon("refresh");
var G__129292 = "state";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129290,G__129291,G__129292) : logseq.shui.ui.button.call(null,G__129290,G__129291,G__129292));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129154))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","gap-2","flex-wrap","items-center","pb-3"], null)], null),attrs129154], 0))):{'className':"flex gap-2 flex-wrap items-center pb-3"}),((cljs.core.map_QMARK_(attrs129154))?[daiquiri.interpreter.interpret((function (){var G__129296 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var token = frontend.state.get_auth_id_token();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-graphs","thread-api/rtc-get-graphs",-1020791869),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token], 0))),(function (graph_list){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__129146_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.select_keys(p1__129146_SHARP_,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),new cljs.core.Keyword(null,"graph-name","graph-name",416773857),new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057),new cljs.core.Keyword(null,"graph<->user-user-type","graph<->user-user-type",1524958981),new cljs.core.Keyword(null,"graph<->user-grant-by-user","graph<->user-grant-by-user",642397936)], null))));
}),graph_list)));
}));
}));
})], null);
var G__129297 = logseq.shui.ui.tabler_icon("download");
var G__129298 = "graph-list";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129296,G__129297,G__129298) : logseq.shui.ui.button.call(null,G__129296,G__129297,G__129298));
})()),daiquiri.interpreter.interpret((function (){var G__129302 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.common.missionary.run_task(new cljs.core.Keyword(null,"upload-test-avatar","upload-test-avatar",1436517974),frontend.handler.user.new_task__upload_user_avatar("TEST_AVATAR"));
})], null);
var G__129303 = logseq.shui.ui.tabler_icon("upload");
var G__129304 = "upload-test-avatar";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129302,G__129303,G__129304) : logseq.shui.ui.button.call(null,G__129302,G__129303,G__129304));
})())]:[daiquiri.interpreter.interpret(attrs129154),daiquiri.interpreter.interpret((function (){var G__129308 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var token = frontend.state.get_auth_id_token();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-graphs","thread-api/rtc-get-graphs",-1020791869),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token], 0))),(function (graph_list){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__129146_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.select_keys(p1__129146_SHARP_,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),new cljs.core.Keyword(null,"graph-name","graph-name",416773857),new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057),new cljs.core.Keyword(null,"graph<->user-user-type","graph<->user-user-type",1524958981),new cljs.core.Keyword(null,"graph<->user-grant-by-user","graph<->user-grant-by-user",642397936)], null))));
}),graph_list)));
}));
}));
})], null);
var G__129309 = logseq.shui.ui.tabler_icon("download");
var G__129310 = "graph-list";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129308,G__129309,G__129310) : logseq.shui.ui.button.call(null,G__129308,G__129309,G__129310));
})()),daiquiri.interpreter.interpret((function (){var G__129314 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.common.missionary.run_task(new cljs.core.Keyword(null,"upload-test-avatar","upload-test-avatar",1436517974),frontend.handler.user.new_task__upload_user_avatar("TEST_AVATAR"));
})], null);
var G__129315 = logseq.shui.ui.tabler_icon("upload");
var G__129316 = "upload-test-avatar";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129314,G__129315,G__129316) : logseq.shui.ui.button.call(null,G__129314,G__129315,G__129316));
})())]));
})(),daiquiri.core.create_element("div",{'className':"pb-4"},[daiquiri.core.create_element("pre",{'className':"select-text"},[(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__129329_129572 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__129330_129573 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__129331_129574 = true;
var _STAR_print_fn_STAR__temp_val__129332_129575 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__129331_129574);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__129332_129575);

try{fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048),new cljs.core.Keyword(null,"blocks-count","blocks-count",1937660069),new cljs.core.Keyword(null,"rtc-logs","rtc-logs",-1442626393),new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),new cljs.core.Keyword(null,"remote-profile?","remote-profile?",-1314795473),new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960),new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259),new cljs.core.Keyword(null,"graph","graph",1558099509),new cljs.core.Keyword(null,"pending-block-update-count","pending-block-update-count",-1976854184),new cljs.core.Keyword(null,"current-page","current-page",-101294180),new cljs.core.Keyword(null,"online-users","online-users",-747563810)],[frontend.handler.user.user_uuid(),(function (){var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return cljs.core.count(new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page))));
} else {
return null;
}
})(),rtc_logs,rtc_state,new cljs.core.Keyword(null,"local-tx","local-tx",1729212201).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"app","app",-560961707),logseq.db.frontend.schema.schema_version__GT_string(logseq.db.frontend.schema.version),new cljs.core.Keyword(null,"local-graph","local-graph",1197953641),new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.Keyword(null,"remote-graph","remote-graph",-2082736629),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_))], null),new cljs.core.Keyword(null,"remote-profile?","remote-profile?",-1314795473).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),new cljs.core.Keyword(null,"unpushed-block-update-count","unpushed-block-update-count",-387210371).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_),frontend.state.get_current_page(),new cljs.core.Keyword(null,"online-users","online-users",-747563810).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_)]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(20)], null));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__129330_129573);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__129329_129572);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()])]),(((rtc_lock == null))?daiquiri.interpreter.interpret((function (){var G__129336 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"text-green-rx-09 border-green-rx-10 hover:text-green-rx-10",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-start","thread-api/rtc-start",-890838787),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([false], 0));
})], null);
var G__129337 = logseq.shui.ui.tabler_icon("player-play");
var G__129338 = "start";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129336,G__129337,G__129338) : logseq.shui.ui.button.call(null,G__129336,G__129337,G__129338));
})()):daiquiri.core.create_element("div",{'className':"my-2 flex"},[(function (){var attrs129339 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(["Toggle auto push updates(",(cljs.core.truth_(new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_))?"ON":"OFF"),")"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","rtc-toggle-auto-push","thread-api/rtc-toggle-auto-push",1679639771));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129339))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-2"], null)], null),attrs129339], 0))):{'className':"mr-2"}),((cljs.core.map_QMARK_(attrs129339))?null:[daiquiri.interpreter.interpret(attrs129339)]));
})(),(function (){var attrs129340 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(["Toggle remote profile(",(cljs.core.truth_(new cljs.core.Keyword(null,"remote-profile?","remote-profile?",-1314795473).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_))?"ON":"OFF"),")"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","rtc-toggle-remote-profile","thread-api/rtc-toggle-remote-profile",1006885794));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129340))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-2"], null)], null),attrs129340], 0))):{'className':"mr-2"}),((cljs.core.map_QMARK_(attrs129340))?null:[daiquiri.interpreter.interpret(attrs129340)]));
})(),(function (){var attrs129347 = (function (){var G__129348 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"text-red-rx-09 border-red-rx-08 hover:text-red-rx-10",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.db.rtc.debug_ui.stop();
})], null);
var G__129349 = logseq.shui.ui.tabler_icon("player-stop");
var G__129350 = "stop";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129348,G__129349,G__129350) : logseq.shui.ui.button.call(null,G__129348,G__129349,G__129350));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129347))?daiquiri.interpreter.element_attributes(attrs129347):null),((cljs.core.map_QMARK_(attrs129347))?null:[daiquiri.interpreter.interpret(attrs129347)]));
})()])),(((!((debug_state_STAR_ == null))))?(function (){
daiquiri.core.create_element("hr",null,null);

var attrs129163 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("grant graph access to",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),"award",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var token = frontend.state.get_auth_id_token();
var user_uuid = (function (){var G__129351 = new cljs.core.Keyword(null,"grant-access-to-user","grant-access-to-user",523137953).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if((G__129351 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__129351);
}
})();
var user_email = (cljs.core.truth_(user_uuid)?null:new cljs.core.Keyword(null,"grant-access-to-user","grant-access-to-user",523137953).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_));
var temp__5804__auto__ = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if(cljs.core.truth_(temp__5804__auto__)){
var graph_uuid = temp__5804__auto__;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-grant-graph-access","thread-api/rtc-grant-graph-access",1735035900),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,(function (){var G__129352 = user_uuid;
if((G__129352 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[G__129352],null));
}
})(),(function (){var G__129353 = user_email;
if((G__129353 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[G__129353],null));
}
})()], 0));
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129163))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129163], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129163))?[daiquiri.core.create_element("b",null,["\u27A1\uFE0F"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"grant-access-to-user","grant-access-to-user",523137953),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"input email or user-uuid here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"input email or user-uuid here",'className':"form-input my-2 py-1"},[])]:[daiquiri.interpreter.interpret(attrs129163),daiquiri.core.create_element("b",null,["\u27A1\uFE0F"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"grant-access-to-user","grant-access-to-user",523137953),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"input email or user-uuid here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"input email or user-uuid here",'className':"form-input my-2 py-1"},[])]));
})()
:null),daiquiri.core.create_element("hr",{'className':"my-2"},null),(function (){var attrs129176 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("download graph to",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"icon","icon",1679606541),"download",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"download-graph-to-repo","download-graph-to-repo",-1529948287).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if(cljs.core.truth_(temp__5804__auto__)){
var graph_name = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword(null,"graph-uuid-to-download","graph-uuid-to-download",-349671237).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if(cljs.core.truth_(temp__5804__auto____$1)){
var map__129354 = temp__5804__auto____$1;
var map__129354__$1 = cljs.core.__destructure_map(map__129354);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129354__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129354__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"download-graph","download-graph",980765015),graph_uuid,graph_schema_version,new cljs.core.Keyword(null,"to","to",192099007),graph_name], 0));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_auth_id_token()),(function (token){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-request-download-graph","thread-api/rtc-request-download-graph",1844528552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,graph_schema_version], 0))),(function (download_info_uuid){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-wait-download-graph-info-ready","thread-api/rtc-wait-download-graph-info-ready",1767428638),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,download_info_uuid,graph_uuid,graph_schema_version,(60000)], 0))),(function (p__129355){
var map__129356 = p__129355;
var map__129356__$1 = cljs.core.__destructure_map(map__129356);
var result = map__129356__$1;
var _download_info_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129356__$1,new cljs.core.Keyword(null,"_download-info-uuid","_download-info-uuid",-493542016));
var download_info_s3_url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129356__$1,new cljs.core.Keyword(null,"download-info-s3-url","download-info-s3-url",937853327));
var _download_info_tx_instant = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129356__$1,new cljs.core.Keyword(null,"_download-info-tx-instant","_download-info-tx-instant",-115220489));
var _download_info_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129356__$1,new cljs.core.Keyword(null,"_download-info-t","_download-info-t",-1601616779));
var _download_info_created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129356__$1,new cljs.core.Keyword(null,"_download-info-created-at","_download-info-created-at",-306158633));
return promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.Keyword(null,"timeout","timeout",-318625318)))?(function (){
if((!((download_info_s3_url == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(result),"\n","(some? download-info-s3-url)"].join('')));
}

return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-download-graph-from-s3","thread-api/rtc-download-graph-from-s3",-50303377),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph_uuid,graph_name,download_info_s3_url], 0));
})()
:null));
}));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129176))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129176], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129176))?[daiquiri.core.create_element("b",null,["\u27A1"]),(function (){var attrs129223 = (function (){var G__129357 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (p__129360){
var vec__129361 = p__129360;
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129361,(0),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129361,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.parse_uuid(graph_uuid);
if(cljs.core.truth_(and__5000__auto__)){
return graph_schema_version;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"graph-uuid-to-download","graph-uuid-to-download",-349671237),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),graph_schema_version], null));
} else {
return null;
}
})], null);
var G__129358 = (function (){var G__129364 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8 border-gray-04"], null);
var G__129365 = (function (){var G__129366 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a graph-uuid"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__129366) : logseq.shui.ui.select_value.call(null,G__129366));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__129364,G__129365) : logseq.shui.ui.select_trigger.call(null,G__129364,G__129365));
})();
var G__129359 = (function (){var G__129367 = (function (){var G__129368 = (function (){var iter__5480__auto__ = (function frontend$db$rtc$debug_ui$iter__129369(s__129370){
return (new cljs.core.LazySeq(null,(function (){
var s__129370__$1 = s__129370;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129370__$1);
if(temp__5804__auto__){
var s__129370__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129370__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129370__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129372 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129371 = (0);
while(true){
if((i__129371 < size__5479__auto__)){
var map__129373 = cljs.core._nth(c__5478__auto__,i__129371);
var map__129373__$1 = cljs.core.__destructure_map(map__129373);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129373__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129373__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129373__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
cljs.core.chunk_append(b__129372,(function (){var G__129374 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129375 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129374,G__129375) : logseq.shui.ui.select_item.call(null,G__129374,G__129375));
})());

var G__129598 = (i__129371 + (1));
i__129371 = G__129598;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129372),frontend$db$rtc$debug_ui$iter__129369(cljs.core.chunk_rest(s__129370__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129372),null);
}
} else {
var map__129376 = cljs.core.first(s__129370__$2);
var map__129376__$1 = cljs.core.__destructure_map(map__129376);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129376__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129376__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129376__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
return cljs.core.cons((function (){var G__129377 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129378 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129377,G__129378) : logseq.shui.ui.select_item.call(null,G__129377,G__129378));
})(),frontend$db$rtc$debug_ui$iter__129369(cljs.core.rest(s__129370__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_)));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__129368) : logseq.shui.ui.select_group.call(null,G__129368));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__129367) : logseq.shui.ui.select_content.call(null,G__129367));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__129357,G__129358,G__129359) : logseq.shui.ui.select.call(null,G__129357,G__129358,G__129359));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129223))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129223], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129223))?[daiquiri.core.create_element("b",null,["\uFF0B"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"download-graph-to-repo","download-graph-to-repo",-1529948287),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"repo name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"repo name here",'className':"form-input my-2 py-1"},[])]:[daiquiri.interpreter.interpret(attrs129223),daiquiri.core.create_element("b",null,["\uFF0B"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"download-graph-to-repo","download-graph-to-repo",-1529948287),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"repo name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"repo name here",'className':"form-input my-2 py-1"},[])]));
})()]:[daiquiri.interpreter.interpret(attrs129176),daiquiri.core.create_element("b",null,["\u27A1"]),(function (){var attrs129274 = (function (){var G__129379 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (p__129382){
var vec__129383 = p__129382;
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129383,(0),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129383,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.parse_uuid(graph_uuid);
if(cljs.core.truth_(and__5000__auto__)){
return graph_schema_version;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"graph-uuid-to-download","graph-uuid-to-download",-349671237),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),graph_schema_version], null));
} else {
return null;
}
})], null);
var G__129380 = (function (){var G__129386 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8 border-gray-04"], null);
var G__129387 = (function (){var G__129388 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a graph-uuid"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__129388) : logseq.shui.ui.select_value.call(null,G__129388));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__129386,G__129387) : logseq.shui.ui.select_trigger.call(null,G__129386,G__129387));
})();
var G__129381 = (function (){var G__129389 = (function (){var G__129390 = (function (){var iter__5480__auto__ = (function frontend$db$rtc$debug_ui$iter__129391(s__129392){
return (new cljs.core.LazySeq(null,(function (){
var s__129392__$1 = s__129392;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129392__$1);
if(temp__5804__auto__){
var s__129392__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129392__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129392__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129394 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129393 = (0);
while(true){
if((i__129393 < size__5479__auto__)){
var map__129395 = cljs.core._nth(c__5478__auto__,i__129393);
var map__129395__$1 = cljs.core.__destructure_map(map__129395);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129395__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129395__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129395__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
cljs.core.chunk_append(b__129394,(function (){var G__129396 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129397 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129396,G__129397) : logseq.shui.ui.select_item.call(null,G__129396,G__129397));
})());

var G__129605 = (i__129393 + (1));
i__129393 = G__129605;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129394),frontend$db$rtc$debug_ui$iter__129391(cljs.core.chunk_rest(s__129392__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129394),null);
}
} else {
var map__129398 = cljs.core.first(s__129392__$2);
var map__129398__$1 = cljs.core.__destructure_map(map__129398);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129398__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129398__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129398__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
return cljs.core.cons((function (){var G__129399 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129400 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129399,G__129400) : logseq.shui.ui.select_item.call(null,G__129399,G__129400));
})(),frontend$db$rtc$debug_ui$iter__129391(cljs.core.rest(s__129392__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_)));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__129390) : logseq.shui.ui.select_group.call(null,G__129390));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__129389) : logseq.shui.ui.select_content.call(null,G__129389));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__129379,G__129380,G__129381) : logseq.shui.ui.select.call(null,G__129379,G__129380,G__129381));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129274))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129274], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129274))?[daiquiri.core.create_element("b",null,["\uFF0B"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"download-graph-to-repo","download-graph-to-repo",-1529948287),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"repo name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"repo name here",'className':"form-input my-2 py-1"},[])]:[daiquiri.interpreter.interpret(attrs129274),daiquiri.core.create_element("b",null,["\uFF0B"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"download-graph-to-repo","download-graph-to-repo",-1529948287),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"repo name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"repo name here",'className':"form-input my-2 py-1"},[])]));
})()]));
})(),(function (){var attrs129279 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("upload current repo",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),"upload",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var repo = frontend.state.get_current_repo();
var token = frontend.state.get_auth_id_token();
var remote_graph_name = new cljs.core.Keyword(null,"upload-as-graph-name","upload-as-graph-name",-42991841).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-async-upload-graph","thread-api/rtc-async-upload-graph",-100015545),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,token,remote_graph_name], 0));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129279))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","my-2","items-center","gap-2"], null)], null),attrs129279], 0))):{'className':"flex my-2 items-center gap-2"}),((cljs.core.map_QMARK_(attrs129279))?[daiquiri.core.create_element("b",null,["\u27A1\uFE0F"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"upload-as-graph-name","upload-as-graph-name",-42991841),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"remote graph name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"remote graph name here",'className':"form-input my-2 py-1 w-32"},[])]:[daiquiri.interpreter.interpret(attrs129279),daiquiri.core.create_element("b",null,["\u27A1\uFE0F"]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"upload-as-graph-name","upload-as-graph-name",-42991841),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"remote graph name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"remote graph name here",'className':"form-input my-2 py-1 w-32"},[])]));
})(),(function (){var attrs129286 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("delete graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),"trash",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"graph-uuid-to-delete","graph-uuid-to-delete",390659100).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if(cljs.core.truth_(temp__5804__auto__)){
var map__129401 = temp__5804__auto__;
var map__129401__$1 = cljs.core.__destructure_map(map__129401);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129401__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129401__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var token = frontend.state.get_auth_id_token();
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.db.rtc.debug-ui","delete-graph","frontend.db.rtc.debug-ui/delete-graph",145193906),graph_uuid,graph_schema_version], 0));

return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-delete-graph","thread-api/rtc-delete-graph",-699151858),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,graph_schema_version], 0));
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129286))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pb-2","flex","flex-row","items-center","gap-2"], null)], null),attrs129286], 0))):{'className':"pb-2 flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129286))?[daiquiri.interpreter.interpret((function (){var G__129424 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (p__129427){
var vec__129428 = p__129427;
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129428,(0),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129428,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.parse_uuid(graph_uuid);
if(cljs.core.truth_(and__5000__auto__)){
return graph_schema_version;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"graph-uuid-to-delete","graph-uuid-to-delete",390659100),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),graph_schema_version], null));
} else {
return null;
}
})], null);
var G__129425 = (function (){var G__129431 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8"], null);
var G__129432 = (function (){var G__129433 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a graph-uuid"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__129433) : logseq.shui.ui.select_value.call(null,G__129433));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__129431,G__129432) : logseq.shui.ui.select_trigger.call(null,G__129431,G__129432));
})();
var G__129426 = (function (){var G__129434 = (function (){var G__129435 = (function (){var iter__5480__auto__ = (function frontend$db$rtc$debug_ui$iter__129436(s__129437){
return (new cljs.core.LazySeq(null,(function (){
var s__129437__$1 = s__129437;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129437__$1);
if(temp__5804__auto__){
var s__129437__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129437__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129437__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129439 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129438 = (0);
while(true){
if((i__129438 < size__5479__auto__)){
var map__129440 = cljs.core._nth(c__5478__auto__,i__129438);
var map__129440__$1 = cljs.core.__destructure_map(map__129440);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129440__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129440__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129440__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
cljs.core.chunk_append(b__129439,(function (){var G__129441 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129442 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129441,G__129442) : logseq.shui.ui.select_item.call(null,G__129441,G__129442));
})());

var G__129612 = (i__129438 + (1));
i__129438 = G__129612;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129439),frontend$db$rtc$debug_ui$iter__129436(cljs.core.chunk_rest(s__129437__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129439),null);
}
} else {
var map__129443 = cljs.core.first(s__129437__$2);
var map__129443__$1 = cljs.core.__destructure_map(map__129443);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129443__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129443__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129443__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
return cljs.core.cons((function (){var G__129444 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129445 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129444,G__129445) : logseq.shui.ui.select_item.call(null,G__129444,G__129445));
})(),frontend$db$rtc$debug_ui$iter__129436(cljs.core.rest(s__129437__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__129435) : logseq.shui.ui.select_group.call(null,G__129435));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__129434) : logseq.shui.ui.select_content.call(null,G__129434));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__129424,G__129425,G__129426) : logseq.shui.ui.select.call(null,G__129424,G__129425,G__129426));
})())]:[daiquiri.interpreter.interpret(attrs129286),daiquiri.interpreter.interpret((function (){var G__129468 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (p__129471){
var vec__129472 = p__129471;
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129472,(0),null);
var graph_schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129472,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.parse_uuid(graph_uuid);
if(cljs.core.truth_(and__5000__auto__)){
return graph_schema_version;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"graph-uuid-to-delete","graph-uuid-to-delete",390659100),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540),graph_schema_version], null));
} else {
return null;
}
})], null);
var G__129469 = (function (){var G__129475 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8"], null);
var G__129476 = (function (){var G__129477 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a graph-uuid"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__129477) : logseq.shui.ui.select_value.call(null,G__129477));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__129475,G__129476) : logseq.shui.ui.select_trigger.call(null,G__129475,G__129476));
})();
var G__129470 = (function (){var G__129478 = (function (){var G__129479 = (function (){var iter__5480__auto__ = (function frontend$db$rtc$debug_ui$iter__129480(s__129481){
return (new cljs.core.LazySeq(null,(function (){
var s__129481__$1 = s__129481;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129481__$1);
if(temp__5804__auto__){
var s__129481__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129481__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129481__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129483 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129482 = (0);
while(true){
if((i__129482 < size__5479__auto__)){
var map__129484 = cljs.core._nth(c__5478__auto__,i__129482);
var map__129484__$1 = cljs.core.__destructure_map(map__129484);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129484__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129484__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129484__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
cljs.core.chunk_append(b__129483,(function (){var G__129485 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129486 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129485,G__129486) : logseq.shui.ui.select_item.call(null,G__129485,G__129486));
})());

var G__129619 = (i__129482 + (1));
i__129482 = G__129619;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129483),frontend$db$rtc$debug_ui$iter__129480(cljs.core.chunk_rest(s__129481__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129483),null);
}
} else {
var map__129487 = cljs.core.first(s__129481__$2);
var map__129487__$1 = cljs.core.__destructure_map(map__129487);
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129487__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var graph_schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129487__$1,new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540));
var graph_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129487__$1,new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057));
return cljs.core.cons((function (){var G__129488 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph_uuid,graph_schema_version], null),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!((graph_status == null)))], null);
var G__129489 = graph_uuid;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__129488,G__129489) : logseq.shui.ui.select_item.call(null,G__129488,G__129489));
})(),frontend$db$rtc$debug_ui$iter__129480(cljs.core.rest(s__129481__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"remote-graphs","remote-graphs",2118658259).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__129479) : logseq.shui.ui.select_group.call(null,G__129479));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__129478) : logseq.shui.ui.select_content.call(null,G__129478));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__129468,G__129469,G__129470) : logseq.shui.ui.select.call(null,G__129468,G__129469,G__129470));
})())]));
})(),(function (){var attrs129287 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Run server-migrations",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var repo = frontend.state.get_current_repo();
var temp__5804__auto__ = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123).cljs$core$IFn$_invoke$arity$1(debug_state_STAR_);
if(cljs.core.truth_(temp__5804__auto__)){
var server_schema_version = temp__5804__auto__;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-add-migration-client-ops","thread-api/rtc-add-migration-client-ops",-864937499),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,server_schema_version], 0));
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129287))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pb-2","flex","flex-row","items-center","gap-2"], null)], null),attrs129287], 0))):{'className':"pb-2 flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129287))?[daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"server migration start version here(e.g. \"64.2\")")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"server migration start version here(e.g. \"64.2\")",'className':"form-input my-2 py-1 w-32"},[])]:[daiquiri.interpreter.interpret(attrs129287),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.rtc.debug_ui.debug_state,cljs.core.assoc,new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"server migration start version here(e.g. \"64.2\")")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"server migration start version here(e.g. \"64.2\")",'className':"form-input my-2 py-1 w-32"},[])]));
})(),daiquiri.core.create_element("hr",{'className':"my-2"},null),(function (){var _STAR_keys_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","keys-state","frontend.db.rtc.debug-ui/keys-state",554583712));
var keys_state = cljs.core.deref(_STAR_keys_state);
return daiquiri.core.create_element("div",null,[(function (){var attrs129498 = (function (){var G__129499 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-graph-keys","thread-api/rtc-get-graph-keys",1361272123),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0))),(function (graph_keys){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__129502 = frontend.state.get_auth_id_token();
if((G__129502 == null)){
return null;
} else {
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","list-devices","thread-api/list-devices",1647864307),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__129502], 0));
}
})()),(function (devices){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","keys-state","frontend.db.rtc.debug-ui/keys-state",554583712)),(function (p1__129147_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__129147_SHARP_,graph_keys,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"devices","devices",1929380599),devices], null)], 0));
})));
}));
}));
}));
})], null);
var G__129500 = logseq.shui.ui.tabler_icon("refresh");
var G__129501 = "keys-state";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129499,G__129500,G__129501) : logseq.shui.ui.button.call(null,G__129499,G__129500,G__129501));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129498))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pb-2","flex","flex-row","items-center","gap-2"], null)], null),attrs129498], 0))):{'className':"pb-2 flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129498))?null:[daiquiri.interpreter.interpret(attrs129498)]));
})(),daiquiri.core.create_element("div",{'className':"pb-4"},[daiquiri.core.create_element("pre",{'className':"select-text"},[(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__129515_129620 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__129516_129621 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__129517_129622 = true;
var _STAR_print_fn_STAR__temp_val__129518_129623 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__129517_129622);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__129518_129623);

try{fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"devices","devices",1929380599),new cljs.core.Keyword(null,"devices","devices",1929380599).cljs$core$IFn$_invoke$arity$1(keys_state),new cljs.core.Keyword(null,"graph-aes-key-jwk","graph-aes-key-jwk",-1181199177),new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902).cljs$core$IFn$_invoke$arity$1(keys_state)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(20)], null));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__129516_129621);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__129515_129620);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()])]),daiquiri.interpreter.interpret((function (){var G__129521 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var temp__5804__auto__ = cljs.core.not_empty(new cljs.core.Keyword(null,"remove-device-device-uuid","remove-device-device-uuid",1843422699).cljs$core$IFn$_invoke$arity$1(keys_state));
if(cljs.core.truth_(temp__5804__auto__)){
var device_uuid = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.state.get_auth_id_token();
if(cljs.core.truth_(temp__5804__auto____$1)){
var token = temp__5804__auto____$1;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","remove-device","thread-api/remove-device",1978032005),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,device_uuid], 0));
} else {
return null;
}
} else {
return null;
}
})], null);
var G__129522 = "Remove device:";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__129521,G__129522) : logseq.shui.ui.button.call(null,G__129521,G__129522));
})()),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_keys_state,cljs.core.assoc,new cljs.core.Keyword(null,"remove-device-device-uuid","remove-device-device-uuid",1843422699),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"device-uuid here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"device-uuid here",'className':"form-input my-2 py-1 w-32"},[]),daiquiri.interpreter.interpret((function (){var G__129526 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var temp__5804__auto__ = cljs.core.not_empty(new cljs.core.Keyword(null,"remove-public-key-device-uuid","remove-public-key-device-uuid",348864812).cljs$core$IFn$_invoke$arity$1(keys_state));
if(cljs.core.truth_(temp__5804__auto__)){
var device_uuid = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.not_empty(new cljs.core.Keyword(null,"remove-public-key-key-name","remove-public-key-key-name",-349589296).cljs$core$IFn$_invoke$arity$1(keys_state));
if(cljs.core.truth_(temp__5804__auto____$1)){
var key_name = temp__5804__auto____$1;
var temp__5804__auto____$2 = frontend.state.get_auth_id_token();
if(cljs.core.truth_(temp__5804__auto____$2)){
var token = temp__5804__auto____$2;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","remove-device-public-key","thread-api/remove-device-public-key",1918950121),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,device_uuid,key_name], 0));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
})], null);
var G__129527 = "Remove public-key:";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__129526,G__129527) : logseq.shui.ui.button.call(null,G__129526,G__129527));
})()),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_keys_state,cljs.core.assoc,new cljs.core.Keyword(null,"remove-public-key-device-uuid","remove-public-key-device-uuid",348864812),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"device-uuid here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"device-uuid here",'className':"form-input my-2 py-1 w-32"},[]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_keys_state,cljs.core.assoc,new cljs.core.Keyword(null,"remove-public-key-key-name","remove-public-key-key-name",-349589296),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"key-name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"key-name here",'className':"form-input my-2 py-1 w-32"},[]),daiquiri.interpreter.interpret((function (){var G__129536 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var temp__5804__auto__ = frontend.state.get_auth_id_token();
if(cljs.core.truth_(temp__5804__auto__)){
var token = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.not_empty(new cljs.core.Keyword(null,"sync-private-key-device-uuid","sync-private-key-device-uuid",1540578655).cljs$core$IFn$_invoke$arity$1(keys_state));
if(cljs.core.truth_(temp__5804__auto____$1)){
var device_uuid = temp__5804__auto____$1;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-sync-current-graph-encrypted-aes-key","thread-api/rtc-sync-current-graph-encrypted-aes-key",1875134159),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.parse_uuid(device_uuid)], null)], 0));
} else {
return null;
}
} else {
return null;
}
})], null);
var G__129537 = "Sync CurrentGraph EncryptedAesKey";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__129536,G__129537) : logseq.shui.ui.button.call(null,G__129536,G__129537));
})()),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_keys_state,cljs.core.assoc,new cljs.core.Keyword(null,"sync-private-key-device-uuid","sync-private-key-device-uuid",1540578655),frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"device-uuid here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"device-uuid here",'className':"form-input my-2 py-1 w-32"},[])]);
})()]);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.db.rtc.debug-ui","logs","frontend.db.rtc.debug-ui/logs",-432801449)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.db.rtc.debug-ui","sub-log-canceler","frontend.db.rtc.debug-ui/sub-log-canceler",-508646603)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.db.rtc.debug-ui","keys-state","frontend.db.rtc.debug-ui/keys-state",554583712)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var canceler = frontend.common.missionary.run_task(new cljs.core.Keyword("frontend.db.rtc.debug-ui","sub-logs","frontend.db.rtc.debug-ui/sub-logs",715639481),missionary.core.reduce.cljs$core$IFn$_invoke$arity$3((function (logs,log){
var logs_STAR_ = (cljs.core.truth_(log)?cljs.core.take.cljs$core$IFn$_invoke$arity$2((10),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logs,log)):logs);
cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","logs","frontend.db.rtc.debug-ui/logs",-432801449)),logs_STAR_);

return logs_STAR_;
}),null,frontend.handler.db_based.rtc_flows.rtc_log_flow));
cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","sub-log-canceler","frontend.db.rtc.debug-ui/sub-log-canceler",-508646603)),canceler);

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___129629 = (function (){var G__129540 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.db.rtc.debug-ui","sub-log-canceler","frontend.db.rtc.debug-ui/sub-log-canceler",-508646603));
if((G__129540 == null)){
return null;
} else {
return cljs.core.deref(G__129540);
}
})();
if(cljs.core.truth_(temp__5804__auto___129629)){
var canceler_129630 = temp__5804__auto___129629;
(canceler_129630.cljs$core$IFn$_invoke$arity$0 ? canceler_129630.cljs$core$IFn$_invoke$arity$0() : canceler_129630.call(null));
} else {
}

return state;
})], null)], null),"frontend.db.rtc.debug-ui/rtc-debug-ui");

//# sourceMappingURL=frontend.db.rtc.debug_ui.js.map
