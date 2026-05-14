goog.provide('frontend.handler.events.ui');
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","search","go/search",1564957958),(function (_){
var G__93047 = frontend.components.cmdk.core.cmdk_modal;
var G__93048 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-dialog-cmdk"], null),new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93047,G__93048) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93047,G__93048));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("command","run","command/run",1545408256),(function (_){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.shell.shell) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.shell.shell));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("notification","show","notification/show",1864741804),(function (p__93049){
var vec__93050 = p__93049;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93050,(0),null);
var map__93053 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93050,(1),null);
var map__93053__$1 = cljs.core.__destructure_map(map__93053);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93053__$1,new cljs.core.Keyword(null,"content","content",15833224));
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93053__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var clear_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93053__$1,new cljs.core.Keyword(null,"clear?","clear?",1363344639));
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(content,status,clear_QMARK_);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("command","run","command/run",1545408256),(function (_){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.shell.shell) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.shell.shell));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins","go/plugins",1900072925),(function (_){
return frontend.components.plugins.open_plugins_modal_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins-waiting-lists","go/plugins-waiting-lists",-660383344),(function (_){
return frontend.components.plugins.open_waiting_updates_modal_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins-from-file","go/plugins-from-file",-231716743),(function (p__93056){
var vec__93057 = p__93056;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93057,(0),null);
var plugins = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93057,(1),null);
return frontend.components.plugins.open_plugins_from_file_modal_BANG_(plugins);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","install-plugin-from-github","go/install-plugin-from-github",1433230947),(function (p__93062){
var vec__93063 = p__93062;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93063,(0),null);
var G__93066 = frontend.components.plugins.install_from_github_release_container();
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93066) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93066));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),(function (p__93071){
var vec__93072 = p__93071;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93072,(0),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93072,(1),null);
var nav_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93072,(2),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93072,(3),null);
if(cljs.core.truth_(pid)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),pid);

frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","navs-settings?","plugin/navs-settings?",-615901808),(!(nav_QMARK_ === false)));

return frontend.components.plugins.open_focused_settings_modal_BANG_(title);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),(function (p__93075){
var vec__93076 = p__93075;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93076,(0),null);
var agent_opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93076,(1),null);
var G__93079 = frontend.components.plugins.user_proxy_settings_container(agent_opts);
var G__93080 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"https-proxy-panel","https-proxy-panel",-1589308406),new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"class","class",-2030961996),"lg:max-w-2xl"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93079,G__93080) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93079,G__93080));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"redirect-to-home","redirect-to-home",236144576),(function (_){
return frontend.handler.page.create_today_journal_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","show-delete-dialog","page/show-delete-dialog",1559514803),(function (p__93081){
var vec__93082 = p__93081;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93082,(0),null);
var selected_rows = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93082,(1),null);
var ok_handler = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93082,(2),null);
var G__93085 = frontend.components.page.batch_delete_dialog(selected_rows,ok_handler);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93085) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93085));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906),(function (p__93086){
var vec__93087 = p__93086;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93087,(0),null);
var cards_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93087,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var G__93090 = ((db_based_QMARK_)?(function (){
return frontend.extensions.fsrs.cards_view(cards_id);
}):frontend.extensions.srs.global_cards);
var G__93091 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"srs","srs",1327991978),new cljs.core.Keyword(null,"label","label",1718410804),"flashcards__cp"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93090,G__93091) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93090,G__93091));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","show-themes-modal","modal/show-themes-modal",238725999),(function (p__93092){
var vec__93093 = p__93092;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93093,(0),null);
var classic_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93093,(1),null);
if(cljs.core.truth_(classic_QMARK_)){
return frontend.components.plugins.open_select_theme_BANG_();
} else {
return frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"themes","themes",-702786642));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("ui","toggle-appearance","ui/toggle-appearance",1527686942),(function (_){
var popup_id = "appearance_settings";
if(cljs.core.truth_(goog.dom.getElement(popup_id))){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(popup_id) : logseq.shui.ui.popup_hide_BANG_.call(null,popup_id));
} else {
var G__93098 = document.querySelector(".toolbar-dots-btn");
var G__93099 = (function (){
return frontend.components.settings.appearance();
});
var G__93100 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),popup_id,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__93098,G__93099,G__93100) : logseq.shui.ui.popup_show_BANG_.call(null,G__93098,G__93099,G__93100));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","consume-updates","plugin/consume-updates",-331798674),(function (p__93101){
var vec__93102 = p__93101;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93102,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93102,(1),null);
var prev_pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93102,(2),null);
var updated_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93102,(3),null);
var downloading_QMARK_ = new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var auto_checking_QMARK_ = frontend.handler.plugin.get_auto_checking_QMARK_();
var temp__5804__auto___93363 = (function (){var and__5000__auto__ = cljs.core.not(downloading_QMARK_);
if(and__5000__auto__){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),id], null));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___93363)){
var coming_93364 = temp__5804__auto___93363;
var error_code_93365 = new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(coming_93364);
var error_code_93366__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(error_code_93365,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"no-new-version","no-new-version",-944956961))))?null:error_code_93365);
var title_93367 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(coming_93364);
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_pending_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(auto_checking_QMARK_);
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.not(error_code_93366__$1)){
frontend.components.plugins.set_updates_sub_content_BANG_([cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_93367),"..."].join(''),(0));
} else {
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["[Checked]<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_93367),"> ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error_code_93366__$1)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
}
} else {
}
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = updated_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return downloading_QMARK_;
} else {
return and__5000__auto__;
}
})())){
var temp__5802__auto__ = frontend.state.get_next_selected_coming_update();
if(cljs.core.truth_(temp__5802__auto__)){
var next_coming = temp__5802__auto__;
return frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(next_coming,new cljs.core.Keyword(null,"only-check","only-check",-1961506795),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error-code","error-code",180497232),null], 0)),(function (e){
return console.error("[Download Err]",next_coming,e);
}));
} else {
return frontend.handler.plugin.close_updates_downloading();
}
} else {
var temp__5802__auto__ = cljs.core.second(cljs.core.first(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
if(cljs.core.truth_(temp__5802__auto__)){
var next_pending = temp__5802__auto__;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Updates: take next pending - ",new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(next_pending)], 0));

return setTimeout((function (){
return frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(next_pending,new cljs.core.Keyword(null,"only-check","only-check",-1961506795),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"auto-check","auto-check",-393148337),auto_checking_QMARK_,new cljs.core.Keyword(null,"error-code","error-code",180497232),null], 0)),(function (e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e.toString(),new cljs.core.Keyword(null,"error","error",-978969032));

return console.error("[Check Err]",next_pending,e);
}));
}),(500));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_pending_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(auto_checking_QMARK_)) && (cljs.core.seq(frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0())));
} else {
return and__5000__auto__;
}
})())){
frontend.components.plugins.open_waiting_updates_modal_BANG_();
} else {
}

return frontend.handler.plugin.set_auto_checking_BANG_(false);
}
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","loader-perf-tip","plugin/loader-perf-tip",1893085954),(function (p__93107){
var vec__93108 = p__93107;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93108,(0),null);
var map__93111 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93108,(1),null);
var map__93111__$1 = cljs.core.__destructure_map(map__93111);
var o = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93111__$1,new cljs.core.Keyword(null,"o","o",-1350007228));
var _s = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93111__$1,new cljs.core.Keyword(null,"_s","_s",1698028404));
var _e = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93111__$1,new cljs.core.Keyword(null,"_e","_e",1598460374));
var temp__5804__auto__ = o.options;
if(cljs.core.truth_(temp__5804__auto__)){
var opts = temp__5804__auto__;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.plugins.perf_tip_content(o.id,opts.name,opts.url),new cljs.core.Keyword(null,"warning","warning",-1685650671),false,o.id);
} else {
return null;
}
}));
frontend.handler.events.ui.refresh_cb = (function frontend$handler$events$ui$refresh_cb(){
frontend.handler.page.create_today_journal_BANG_();

return frontend.handler.events.file_sync_restart_BANG_();
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","ask-for-re-fresh","graph/ask-for-re-fresh",-32382338),(function (_){
var G__93112 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(700)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sync-from-local-changes-detected","sync-from-local-changes-detected",-1820421680)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-end","div.flex.justify-end",-2056434577),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"yes","yes",182838819)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"autoFocus","autoFocus",-552622425),"on",new cljs.core.Keyword(null,"class","class",-2030961996),"ui__modal-enter",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.handler.file_based.native_fs.refresh_BANG_(frontend.state.get_current_repo(),frontend.handler.events.ui.refresh_cb);
})], 0))], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93112) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93112));
}));
frontend.handler.events.ui.editor_new_property = (function frontend$handler$events$ui$editor_new_property(block,target,p__93122){
var map__93125 = p__93122;
var map__93125__$1 = cljs.core.__destructure_map(map__93125);
var opts = map__93125__$1;
var selected_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93125__$1,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948));
var editing_block = frontend.state.get_edit_block();
var pos = frontend.state.get_edit_pos();
var edit_block_or_selected = (cljs.core.truth_(editing_block)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [editing_block], null):((cljs.core.seq(selected_blocks))?selected_blocks:cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__93114_SHARP_){
var G__93132 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__93114_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__93132) : frontend.db.entity.call(null,G__93132));
}),frontend.state.get_selection_block_ids()))
));
var current_block = (function (){var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(s) : frontend.util.uuid_string_QMARK_.call(null,s)))){
var G__93137 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(s)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__93137) : frontend.db.entity.call(null,G__93137));
} else {
return null;
}
} else {
return null;
}
})();
var blocks = (function (){var or__5002__auto__ = (cljs.core.truth_(block)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = edit_block_or_selected;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
if(cljs.core.truth_(current_block)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_block], null);
} else {
return null;
}
}
}
})();
var opts_SINGLEQUOTE_ = (function (){var G__93144 = opts;
if(cljs.core.truth_(editing_block)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__93144,new cljs.core.Keyword(null,"original-block","original-block",1808045862),editing_block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"edit-original-block","edit-original-block",179766995),(function (p__93146){
var map__93147 = p__93146;
var map__93147__$1 = cljs.core.__destructure_map(map__93147);
var editing_default_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93147__$1,new cljs.core.Keyword(null,"editing-default-property?","editing-default-property?",1361962686));
if(cljs.core.truth_(editing_block)){
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__93151 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(editing_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__93151) : frontend.db.entity.call(null,G__93151));
})());
var esc_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Escape",frontend.state.get_ui_last_key_code());
var vec__93148 = ((esc_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,pos], null):(((((cljs.core.count(content) >= pos)) && ((((pos >= (2))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(frontend.util.nth_safe(content,(pos - (1))),frontend.util.nth_safe(content,(pos - (2))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([";"], 0)))))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(content,(0),(pos - (2))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(content,pos))].join(''),(pos - (2))], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,pos], null)
));
var content_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93148,(0),null);
var pos__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93148,(1),null);
if(cljs.core.truth_(content_SINGLEQUOTE_)){
if(cljs.core.truth_(editing_default_property_QMARK_)){
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block),content_SINGLEQUOTE_);
} else {
var G__93155 = editing_block;
var G__93156 = (function (){var or__5002__auto__ = pos__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"max","max",61366548);
}
})();
var G__93157 = (function (){var G__93160 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(content_SINGLEQUOTE_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__93160,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),content_SINGLEQUOTE_);
} else {
return G__93160;
}
})();
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__93155,G__93156,G__93157) : frontend.handler.editor.edit_block_BANG_.call(null,G__93155,G__93156,G__93157));
}
} else {
return null;
}
} else {
return null;
}
})], 0));
} else {
return G__93144;
}
})();
if(cljs.core.seq(blocks)){
var target_SINGLEQUOTE_ = (function (){var or__5002__auto__ = target;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var G__93163 = frontend.state.get_edit_input_id();
if((G__93163 == null)){
return null;
} else {
return goog.dom.getElement(G__93163);
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.first(frontend.state.get_selection_blocks());
}
}
})();
if(cljs.core.truth_(target_SINGLEQUOTE_)){
var G__93166 = target_SINGLEQUOTE_;
var G__93167 = (function (){
return frontend.components.property.dialog.dialog(blocks,opts_SINGLEQUOTE_);
});
var G__93168 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__93166,G__93167,G__93168) : logseq.shui.ui.popup_show_BANG_.call(null,G__93166,G__93167,G__93168));
} else {
var G__93170 = (function (){
return frontend.components.property.dialog.dialog(blocks,opts_SINGLEQUOTE_);
});
var G__93171 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"property-dialog","property-dialog",1885514281),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93170,G__93171) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93170,G__93171));
}
} else {
return null;
}
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),(function (p__93174){
var vec__93175 = p__93174;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93175,(0),null);
var map__93178 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93175,(1),null);
var map__93178__$1 = cljs.core.__destructure_map(map__93178);
var opts = map__93178__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93178__$1,new cljs.core.Keyword(null,"block","block",664686210));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93178__$1,new cljs.core.Keyword(null,"target","target",253001721));
if(frontend.config.publishing_QMARK_){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.events.ui.editor_new_property(block,target,opts));
}));
}));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","new-db-graph","graph/new-db-graph",-1877792394),(function (p__93184){
var vec__93186 = p__93184;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93186,(0),null);
var _opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93186,(1),null);
var G__93189 = frontend.components.repo.new_db_graph;
var G__93190 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"new-db-graph","new-db-graph",-1707976156),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"Create a new graph"], null),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"500px"], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93189,G__93190) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93189,G__93190));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("dialog-select","graph-open","dialog-select/graph-open",-404346606),(function (){
return frontend.components.select.dialog_select_BANG_(new cljs.core.Keyword(null,"graph-open","graph-open",-328022081));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("dialog-select","graph-remove","dialog-select/graph-remove",-555470642),(function (){
return frontend.components.select.dialog_select_BANG_(new cljs.core.Keyword(null,"graph-remove","graph-remove",-143683669));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("dialog-select","db-graph-replace","dialog-select/db-graph-replace",1491312407),(function (){
return frontend.components.select.dialog_select_BANG_(new cljs.core.Keyword(null,"db-graph-replace","db-graph-replace",542096376));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","show-action-bar","editor/show-action-bar",-1302945332),(function (){
var selection = frontend.state.get_selection_blocks();
var first_visible_block = cljs.core.some((function (p1__93192_SHARP_){
if(cljs.core.truth_((frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$2(p1__93192_SHARP_,true) : frontend.util.el_visible_in_viewport_QMARK_.call(null,p1__93192_SHARP_,true)))){
return p1__93192_SHARP_;
} else {
return null;
}
}),selection);
if(cljs.core.truth_(first_visible_block)){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)) : logseq.shui.ui.popup_hide_BANG_.call(null,new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));

var G__93193 = first_visible_block;
var G__93194 = (function (){
return frontend.components.selection.action_bar();
});
var G__93195 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modal","modal",-1031880850),false], null),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"side","side",389652279),"top",new cljs.core.Keyword(null,"class","class",-2030961996),"!py-0 !px-0 !border-none",new cljs.core.Keyword(null,"modal?","modal?",2146094679),false], null),new cljs.core.Keyword(null,"auto-side?","auto-side?",-577583716),false,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__93193,G__93194,G__93195) : logseq.shui.ui.popup_show_BANG_.call(null,G__93193,G__93194,G__93195));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)) : logseq.shui.ui.popup_hide_BANG_.call(null,new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","logout","user/logout",1413770948),(function (p__93196){
var vec__93197 = p__93196;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93197,(0),null);
frontend.handler.file_sync.reset_session_graphs();

frontend.fs.sync.remove_all_pwd_BANG_();

frontend.handler.file_sync.reset_user_state_BANG_();

return frontend.components.user.login.sign_out_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","login","user/login",51503538),(function (p__93200){
var vec__93201 = p__93200;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93201,(0),null);
var host_ui_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93201,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = host_ui_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(frontend.util.electron_QMARK_);
}
})())){
return window.open(frontend.config.LOGIN_URL);
} else {
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"user-login","user-login",1532000569)], null));
} else {
return frontend.components.user.login.open_login_modal_BANG_();
}
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("whiteboard","onboarding","whiteboard/onboarding",-1343828989),(function (p__93206){
var vec__93207 = p__93206;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93207,(0),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93207,(1),null);
var G__93210 = (function (p__93212){
var map__93213 = p__93212;
var map__93213__$1 = cljs.core.__destructure_map(map__93213);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93213__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.components.whiteboard.onboarding_welcome(close);
});
var G__93211 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-backdrop?","close-backdrop?",2081649802),false], null),opts], 0));
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93210,G__93211) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93210,G__93211));
}));
frontend.handler.events.ui.enable_beta_features_BANG_ = (function frontend$handler$events$ui$enable_beta_features_BANG_(){
if(frontend.state.enable_sync_QMARK_() === false){
return null;
} else {
return frontend.handler.file_sync.set_sync_enabled_BANG_(true);
}
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720),(function (p__93217){
var vec__93219 = p__93217;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93219,(0),null);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword(null,"login","login",55217519)], null),false);

var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_93276){
var state_val_93277 = (state_93276[(1)]);
if((state_val_93277 === (7))){
var state_93276__$1 = state_93276;
var statearr_93278_93378 = state_93276__$1;
(statearr_93278_93378[(2)] = null);

(statearr_93278_93378[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (20))){
var inst_93247 = (state_93276[(7)]);
var inst_93268 = (state_93276[(2)]);
var inst_93269 = frontend.components.file_sync.maybe_onboarding_show(inst_93247);
var state_93276__$1 = (function (){var statearr_93279 = state_93276;
(statearr_93279[(8)] = inst_93268);

return statearr_93279;
})();
var statearr_93280_93379 = state_93276__$1;
(statearr_93280_93379[(2)] = inst_93269);

(statearr_93280_93379[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (1))){
var inst_93225 = frontend.fs.sync._LT_user_info(frontend.fs.sync.remoteapi);
var state_93276__$1 = state_93276;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93276__$1,(2),inst_93225);
} else {
if((state_val_93277 === (4))){
var inst_93230 = (state_93276[(9)]);
var inst_93234 = cljs.core.map_QMARK_(inst_93230);
var state_93276__$1 = state_93276;
if(inst_93234){
var statearr_93281_93380 = state_93276__$1;
(statearr_93281_93380[(1)] = (6));

} else {
var statearr_93283_93381 = state_93276__$1;
(statearr_93283_93381[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (15))){
var inst_93250 = frontend.handler.user.logged_in_QMARK_();
var state_93276__$1 = state_93276;
var statearr_93285_93382 = state_93276__$1;
(statearr_93285_93382[(2)] = inst_93250);

(statearr_93285_93382[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (21))){
var inst_93259 = (state_93276[(2)]);
var inst_93260 = frontend.handler.file_sync.load_session_graphs();
var state_93276__$1 = (function (){var statearr_93286 = state_93276;
(statearr_93286[(10)] = inst_93259);

return statearr_93286;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93276__$1,(22),inst_93260);
} else {
if((state_val_93277 === (13))){
var state_93276__$1 = state_93276;
var statearr_93287_93383 = state_93276__$1;
(statearr_93287_93383[(2)] = new cljs.core.Keyword(null,"unavailable","unavailable",1529915531));

(statearr_93287_93383[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (22))){
var inst_93230 = (state_93276[(9)]);
var inst_93247 = (state_93276[(7)]);
var inst_93262 = (state_93276[(2)]);
var inst_93263 = promesa.protocols._promise(null);
var inst_93264 = (function (){var result = inst_93230;
var status = inst_93247;
return (function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.refresh_repos_BANG_()),(function (repos){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.some((function (p1__93214_SHARP_){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__93214_SHARP_),repo);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.vector_QMARK_(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__93214_SHARP_));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var G__93288 = cljs.core.first(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__93214_SHARP_));
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__93288) : frontend.util.uuid_string_QMARK_.call(null,G__93288));
})();
if(cljs.core.truth_(and__5000__auto____$2)){
var G__93289 = cljs.core.second(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__93214_SHARP_));
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__93289) : frontend.util.uuid_string_QMARK_.call(null,G__93289));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),repos))){
return frontend.fs.sync._LT_sync_start();
} else {
return null;
}
} else {
return null;
}
})());
}));
});
})();
var inst_93265 = promesa.protocols._mcat(inst_93263,inst_93264);
var state_93276__$1 = (function (){var statearr_93291 = state_93276;
(statearr_93291[(11)] = inst_93262);

return statearr_93291;
})();
var statearr_93292_93384 = state_93276__$1;
(statearr_93292_93384[(2)] = inst_93265);

(statearr_93292_93384[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (6))){
var inst_93230 = (state_93276[(9)]);
var inst_93237 = (state_93276[(12)]);
var inst_93236 = frontend.state.set_user_info_BANG_(inst_93230);
var inst_93237__$1 = frontend.handler.user.user_uuid();
var state_93276__$1 = (function (){var statearr_93293 = state_93276;
(statearr_93293[(13)] = inst_93236);

(statearr_93293[(12)] = inst_93237__$1);

return statearr_93293;
})();
if(cljs.core.truth_(inst_93237__$1)){
var statearr_93294_93385 = state_93276__$1;
(statearr_93294_93385[(1)] = (9));

} else {
var statearr_93295_93386 = state_93276__$1;
(statearr_93295_93386[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (17))){
var inst_93253 = (state_93276[(2)]);
var state_93276__$1 = state_93276;
if(cljs.core.truth_(inst_93253)){
var statearr_93298_93387 = state_93276__$1;
(statearr_93298_93387[(1)] = (18));

} else {
var statearr_93299_93388 = state_93276__$1;
(statearr_93299_93388[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (3))){
var state_93276__$1 = state_93276;
var statearr_93300_93389 = state_93276__$1;
(statearr_93300_93389[(2)] = null);

(statearr_93300_93389[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (12))){
var state_93276__$1 = state_93276;
var statearr_93303_93390 = state_93276__$1;
(statearr_93303_93390[(2)] = new cljs.core.Keyword(null,"welcome","welcome",-578152123));

(statearr_93303_93390[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (2))){
var inst_93230 = (state_93276[(9)]);
var inst_93230__$1 = (state_93276[(2)]);
var inst_93231 = (inst_93230__$1 instanceof cljs.core.ExceptionInfo);
var state_93276__$1 = (function (){var statearr_93304 = state_93276;
(statearr_93304[(9)] = inst_93230__$1);

return statearr_93304;
})();
if(cljs.core.truth_(inst_93231)){
var statearr_93305_93391 = state_93276__$1;
(statearr_93305_93391[(1)] = (3));

} else {
var statearr_93306_93392 = state_93276__$1;
(statearr_93306_93392[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (19))){
var state_93276__$1 = state_93276;
var statearr_93309_93394 = state_93276__$1;
(statearr_93309_93394[(2)] = null);

(statearr_93309_93394[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (11))){
var inst_93242 = (state_93276[(2)]);
var inst_93243 = frontend.handler.user.alpha_or_beta_user_QMARK_();
var state_93276__$1 = (function (){var statearr_93310 = state_93276;
(statearr_93310[(14)] = inst_93242);

return statearr_93310;
})();
if(cljs.core.truth_(inst_93243)){
var statearr_93311_93395 = state_93276__$1;
(statearr_93311_93395[(1)] = (12));

} else {
var statearr_93314_93397 = state_93276__$1;
(statearr_93314_93397[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (9))){
var inst_93237 = (state_93276[(12)]);
var inst_93239 = frontend.modules.instrumentation.sentry.set_user_BANG_(inst_93237);
var state_93276__$1 = state_93276;
var statearr_93315_93398 = state_93276__$1;
(statearr_93315_93398[(2)] = inst_93239);

(statearr_93315_93398[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (5))){
var inst_93274 = (state_93276[(2)]);
var state_93276__$1 = state_93276;
return cljs.core.async.impl.ioc_helpers.return_chan(state_93276__$1,inst_93274);
} else {
if((state_val_93277 === (14))){
var inst_93247 = (state_93276[(7)]);
var inst_93248 = (state_93276[(15)]);
var inst_93247__$1 = (state_93276[(2)]);
var inst_93248__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_93247__$1,new cljs.core.Keyword(null,"welcome","welcome",-578152123));
var state_93276__$1 = (function (){var statearr_93318 = state_93276;
(statearr_93318[(7)] = inst_93247__$1);

(statearr_93318[(15)] = inst_93248__$1);

return statearr_93318;
})();
if(inst_93248__$1){
var statearr_93319_93403 = state_93276__$1;
(statearr_93319_93403[(1)] = (15));

} else {
var statearr_93320_93404 = state_93276__$1;
(statearr_93320_93404[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (16))){
var inst_93248 = (state_93276[(15)]);
var state_93276__$1 = state_93276;
var statearr_93323_93406 = state_93276__$1;
(statearr_93323_93406[(2)] = inst_93248);

(statearr_93323_93406[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (10))){
var state_93276__$1 = state_93276;
var statearr_93324_93407 = state_93276__$1;
(statearr_93324_93407[(2)] = null);

(statearr_93324_93407[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93277 === (18))){
var inst_93255 = frontend.handler.events.ui.enable_beta_features_BANG_();
var inst_93256 = frontend.handler.db_based.rtc._LT_get_remote_graphs();
var inst_93257 = cljs.core.async.interop.p__GT_c(inst_93256);
var state_93276__$1 = (function (){var statearr_93327 = state_93276;
(statearr_93327[(16)] = inst_93255);

return statearr_93327;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93276__$1,(21),inst_93257);
} else {
if((state_val_93277 === (8))){
var inst_93272 = (state_93276[(2)]);
var state_93276__$1 = state_93276;
var statearr_93328_93411 = state_93276__$1;
(statearr_93328_93411[(2)] = inst_93272);

(statearr_93328_93411[(1)] = (5));


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
}
}
}
}
}
}
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
var frontend$handler$events$ui$state_machine__32051__auto__ = null;
var frontend$handler$events$ui$state_machine__32051__auto____0 = (function (){
var statearr_93331 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_93331[(0)] = frontend$handler$events$ui$state_machine__32051__auto__);

(statearr_93331[(1)] = (1));

return statearr_93331;
});
var frontend$handler$events$ui$state_machine__32051__auto____1 = (function (state_93276){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_93276);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e93334){var ex__32054__auto__ = e93334;
var statearr_93335_93414 = state_93276;
(statearr_93335_93414[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_93276[(4)]))){
var statearr_93336_93416 = state_93276;
(statearr_93336_93416[(1)] = cljs.core.first((state_93276[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__93417 = state_93276;
state_93276 = G__93417;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$events$ui$state_machine__32051__auto__ = function(state_93276){
switch(arguments.length){
case 0:
return frontend$handler$events$ui$state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$events$ui$state_machine__32051__auto____1.call(this,state_93276);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$ui$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$ui$state_machine__32051__auto____0;
frontend$handler$events$ui$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$ui$state_machine__32051__auto____1;
return frontend$handler$events$ui$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_93339 = f__32125__auto__();
(statearr_93339[(6)] = c__32124__auto__);

return statearr_93339;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync","onboarding-tip","file-sync/onboarding-tip",-1267073709),(function (p__93344){
var vec__93345 = p__93344;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93345,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93345,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93345,(2),null);
var type__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return null;
} else {
var G__93348 = frontend.components.file_sync.make_onboarding_panel(type__$1);
var G__93349 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-backdrop?","close-backdrop?",2081649802),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,new cljs.core.Keyword(null,"welcome","welcome",-578152123))], null),opts], 0));
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93348,G__93349) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93348,G__93349));
}
}));

//# sourceMappingURL=frontend.handler.events.ui.js.map
