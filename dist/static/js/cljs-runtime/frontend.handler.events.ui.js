goog.provide('frontend.handler.events.ui');
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","search","go/search",1564957958),(function (_){
var G__127730 = frontend.components.cmdk.core.cmdk_modal;
var G__127731 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-dialog-cmdk"], null),new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127730,G__127731) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127730,G__127731));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("command","run","command/run",1545408256),(function (_){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.shell.shell) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.shell.shell));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("notification","show","notification/show",1864741804),(function (p__127732){
var vec__127733 = p__127732;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127733,(0),null);
var map__127736 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127733,(1),null);
var map__127736__$1 = cljs.core.__destructure_map(map__127736);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127736__$1,new cljs.core.Keyword(null,"content","content",15833224));
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127736__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var clear_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127736__$1,new cljs.core.Keyword(null,"clear?","clear?",1363344639));
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins-from-file","go/plugins-from-file",-231716743),(function (p__127738){
var vec__127739 = p__127738;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127739,(0),null);
var plugins = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127739,(1),null);
return frontend.components.plugins.open_plugins_from_file_modal_BANG_(plugins);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","install-plugin-from-github","go/install-plugin-from-github",1433230947),(function (p__127742){
var vec__127743 = p__127742;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127743,(0),null);
var G__127746 = frontend.components.plugins.install_from_github_release_container();
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__127746) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127746));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),(function (p__127747){
var vec__127748 = p__127747;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127748,(0),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127748,(1),null);
var nav_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127748,(2),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127748,(3),null);
if(cljs.core.truth_(pid)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),pid);

frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","navs-settings?","plugin/navs-settings?",-615901808),(!(nav_QMARK_ === false)));

return frontend.components.plugins.open_focused_settings_modal_BANG_(title);
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),(function (p__127752){
var vec__127753 = p__127752;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127753,(0),null);
var agent_opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127753,(1),null);
var G__127756 = frontend.components.plugins.user_proxy_settings_container(agent_opts);
var G__127757 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"https-proxy-panel","https-proxy-panel",-1589308406),new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"class","class",-2030961996),"lg:max-w-2xl"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127756,G__127757) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127756,G__127757));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"redirect-to-home","redirect-to-home",236144576),(function (_){
return frontend.handler.page.create_today_journal_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("page","show-delete-dialog","page/show-delete-dialog",1559514803),(function (p__127758){
var vec__127759 = p__127758;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127759,(0),null);
var selected_rows = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127759,(1),null);
var ok_handler = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127759,(2),null);
var G__127762 = frontend.components.page.batch_delete_dialog(selected_rows,ok_handler);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__127762) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127762));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906),(function (p__127763){
var vec__127764 = p__127763;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127764,(0),null);
var cards_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127764,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var G__127767 = ((db_based_QMARK_)?(function (){
return frontend.extensions.fsrs.cards_view(cards_id);
}):frontend.extensions.srs.global_cards);
var G__127768 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"srs","srs",1327991978),new cljs.core.Keyword(null,"label","label",1718410804),"flashcards__cp"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127767,G__127768) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127767,G__127768));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","show-themes-modal","modal/show-themes-modal",238725999),(function (p__127769){
var vec__127770 = p__127769;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127770,(0),null);
var classic_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127770,(1),null);
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
var G__127773 = document.querySelector(".toolbar-dots-btn");
var G__127774 = (function (){
return frontend.components.settings.appearance();
});
var G__127775 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),popup_id,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__127773,G__127774,G__127775) : logseq.shui.ui.popup_show_BANG_.call(null,G__127773,G__127774,G__127775));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","consume-updates","plugin/consume-updates",-331798674),(function (p__127777){
var vec__127778 = p__127777;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127778,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127778,(1),null);
var prev_pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127778,(2),null);
var updated_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127778,(3),null);
var downloading_QMARK_ = new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var auto_checking_QMARK_ = frontend.handler.plugin.get_auto_checking_QMARK_();
var temp__5804__auto___127945 = (function (){var and__5000__auto__ = cljs.core.not(downloading_QMARK_);
if(and__5000__auto__){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),id], null));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___127945)){
var coming_127946 = temp__5804__auto___127945;
var error_code_127947 = new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(coming_127946);
var error_code_127948__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(error_code_127947,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"no-new-version","no-new-version",-944956961))))?null:error_code_127947);
var title_127949 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(coming_127946);
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_pending_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(auto_checking_QMARK_);
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.not(error_code_127948__$1)){
frontend.components.plugins.set_updates_sub_content_BANG_([cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_127949),"..."].join(''),(0));
} else {
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["[Checked]<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_127949),"> ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error_code_127948__$1)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("plugin","loader-perf-tip","plugin/loader-perf-tip",1893085954),(function (p__127781){
var vec__127782 = p__127781;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127782,(0),null);
var map__127785 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127782,(1),null);
var map__127785__$1 = cljs.core.__destructure_map(map__127785);
var o = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127785__$1,new cljs.core.Keyword(null,"o","o",-1350007228));
var _s = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127785__$1,new cljs.core.Keyword(null,"_s","_s",1698028404));
var _e = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127785__$1,new cljs.core.Keyword(null,"_e","_e",1598460374));
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
var G__127786 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(700)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sync-from-local-changes-detected","sync-from-local-changes-detected",-1820421680)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-end","div.flex.justify-end",-2056434577),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"yes","yes",182838819)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"autoFocus","autoFocus",-552622425),"on",new cljs.core.Keyword(null,"class","class",-2030961996),"ui__modal-enter",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.handler.file_based.native_fs.refresh_BANG_(frontend.state.get_current_repo(),frontend.handler.events.ui.refresh_cb);
})], 0))], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__127786) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127786));
}));
frontend.handler.events.ui.editor_new_property = (function frontend$handler$events$ui$editor_new_property(block,target,p__127788){
var map__127789 = p__127788;
var map__127789__$1 = cljs.core.__destructure_map(map__127789);
var opts = map__127789__$1;
var selected_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127789__$1,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948));
var editing_block = frontend.state.get_edit_block();
var pos = frontend.state.get_edit_pos();
var edit_block_or_selected = (cljs.core.truth_(editing_block)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [editing_block], null):((cljs.core.seq(selected_blocks))?selected_blocks:cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__127787_SHARP_){
var G__127790 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__127787_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__127790) : frontend.db.entity.call(null,G__127790));
}),frontend.state.get_selection_block_ids()))
));
var current_block = (function (){var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(s) : frontend.util.uuid_string_QMARK_.call(null,s)))){
var G__127791 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(s)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__127791) : frontend.db.entity.call(null,G__127791));
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
var opts_SINGLEQUOTE_ = (function (){var G__127792 = opts;
if(cljs.core.truth_(editing_block)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__127792,new cljs.core.Keyword(null,"original-block","original-block",1808045862),editing_block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"edit-original-block","edit-original-block",179766995),(function (p__127793){
var map__127794 = p__127793;
var map__127794__$1 = cljs.core.__destructure_map(map__127794);
var editing_default_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127794__$1,new cljs.core.Keyword(null,"editing-default-property?","editing-default-property?",1361962686));
if(cljs.core.truth_(editing_block)){
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__127798 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(editing_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__127798) : frontend.db.entity.call(null,G__127798));
})());
var esc_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Escape",frontend.state.get_ui_last_key_code());
var vec__127795 = ((esc_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,pos], null):(((((cljs.core.count(content) >= pos)) && ((((pos >= (2))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(frontend.util.nth_safe(content,(pos - (1))),frontend.util.nth_safe(content,(pos - (2))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([";"], 0)))))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(content,(0),(pos - (2))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(content,pos))].join(''),(pos - (2))], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,pos], null)
));
var content_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127795,(0),null);
var pos__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127795,(1),null);
if(cljs.core.truth_(content_SINGLEQUOTE_)){
if(cljs.core.truth_(editing_default_property_QMARK_)){
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block),content_SINGLEQUOTE_);
} else {
var G__127800 = editing_block;
var G__127801 = (function (){var or__5002__auto__ = pos__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"max","max",61366548);
}
})();
var G__127802 = (function (){var G__127804 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(content_SINGLEQUOTE_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__127804,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),content_SINGLEQUOTE_);
} else {
return G__127804;
}
})();
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__127800,G__127801,G__127802) : frontend.handler.editor.edit_block_BANG_.call(null,G__127800,G__127801,G__127802));
}
} else {
return null;
}
} else {
return null;
}
})], 0));
} else {
return G__127792;
}
})();
if(cljs.core.seq(blocks)){
var target_SINGLEQUOTE_ = (function (){var or__5002__auto__ = target;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var G__127805 = frontend.state.get_edit_input_id();
if((G__127805 == null)){
return null;
} else {
return goog.dom.getElement(G__127805);
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
var G__127806 = target_SINGLEQUOTE_;
var G__127807 = (function (){
return frontend.components.property.dialog.dialog(blocks,opts_SINGLEQUOTE_);
});
var G__127808 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__127806,G__127807,G__127808) : logseq.shui.ui.popup_show_BANG_.call(null,G__127806,G__127807,G__127808));
} else {
var G__127809 = (function (){
return frontend.components.property.dialog.dialog(blocks,opts_SINGLEQUOTE_);
});
var G__127810 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"property-dialog","property-dialog",1885514281),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127809,G__127810) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127809,G__127810));
}
} else {
return null;
}
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),(function (p__127811){
var vec__127812 = p__127811;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127812,(0),null);
var map__127815 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127812,(1),null);
var map__127815__$1 = cljs.core.__destructure_map(map__127815);
var opts = map__127815__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127815__$1,new cljs.core.Keyword(null,"block","block",664686210));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127815__$1,new cljs.core.Keyword(null,"target","target",253001721));
if(frontend.config.publishing_QMARK_){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.events.ui.editor_new_property(block,target,opts));
}));
}));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","new-db-graph","graph/new-db-graph",-1877792394),(function (p__127819){
var vec__127820 = p__127819;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127820,(0),null);
var _opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127820,(1),null);
var G__127823 = frontend.components.repo.new_db_graph;
var G__127824 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"new-db-graph","new-db-graph",-1707976156),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"Create a new graph"], null),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"500px"], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127823,G__127824) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127823,G__127824));
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
var first_visible_block = cljs.core.some((function (p1__127825_SHARP_){
if(cljs.core.truth_((frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$2(p1__127825_SHARP_,true) : frontend.util.el_visible_in_viewport_QMARK_.call(null,p1__127825_SHARP_,true)))){
return p1__127825_SHARP_;
} else {
return null;
}
}),selection);
if(cljs.core.truth_(first_visible_block)){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)) : logseq.shui.ui.popup_hide_BANG_.call(null,new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));

var G__127826 = first_visible_block;
var G__127827 = (function (){
return frontend.components.selection.action_bar();
});
var G__127828 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modal","modal",-1031880850),false], null),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"side","side",389652279),"top",new cljs.core.Keyword(null,"class","class",-2030961996),"!py-0 !px-0 !border-none",new cljs.core.Keyword(null,"modal?","modal?",2146094679),false], null),new cljs.core.Keyword(null,"auto-side?","auto-side?",-577583716),false,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__127826,G__127827,G__127828) : logseq.shui.ui.popup_show_BANG_.call(null,G__127826,G__127827,G__127828));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)) : logseq.shui.ui.popup_hide_BANG_.call(null,new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","logout","user/logout",1413770948),(function (p__127829){
var vec__127830 = p__127829;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127830,(0),null);
frontend.handler.file_sync.reset_session_graphs();

frontend.fs.sync.remove_all_pwd_BANG_();

frontend.handler.file_sync.reset_user_state_BANG_();

return frontend.components.user.login.sign_out_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","login","user/login",51503538),(function (p__127833){
var vec__127834 = p__127833;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127834,(0),null);
var host_ui_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127834,(1),null);
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
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("whiteboard","onboarding","whiteboard/onboarding",-1343828989),(function (p__127837){
var vec__127838 = p__127837;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127838,(0),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127838,(1),null);
var G__127841 = (function (p__127843){
var map__127844 = p__127843;
var map__127844__$1 = cljs.core.__destructure_map(map__127844);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127844__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.components.whiteboard.onboarding_welcome(close);
});
var G__127842 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-backdrop?","close-backdrop?",2081649802),false], null),opts], 0));
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127841,G__127842) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127841,G__127842));
}));
frontend.handler.events.ui.enable_beta_features_BANG_ = (function frontend$handler$events$ui$enable_beta_features_BANG_(){
if(frontend.state.enable_sync_QMARK_() === false){
return null;
} else {
return frontend.handler.file_sync.set_sync_enabled_BANG_(true);
}
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720),(function (p__127846){
var vec__127847 = p__127846;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127847,(0),null);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword(null,"login","login",55217519)], null),false);

var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_127898){
var state_val_127899 = (state_127898[(1)]);
if((state_val_127899 === (7))){
var state_127898__$1 = state_127898;
var statearr_127900_127965 = state_127898__$1;
(statearr_127900_127965[(2)] = null);

(statearr_127900_127965[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (20))){
var inst_127869 = (state_127898[(7)]);
var inst_127890 = (state_127898[(2)]);
var inst_127891 = frontend.components.file_sync.maybe_onboarding_show(inst_127869);
var state_127898__$1 = (function (){var statearr_127901 = state_127898;
(statearr_127901[(8)] = inst_127890);

return statearr_127901;
})();
var statearr_127902_127966 = state_127898__$1;
(statearr_127902_127966[(2)] = inst_127891);

(statearr_127902_127966[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (1))){
var inst_127850 = frontend.fs.sync._LT_user_info(frontend.fs.sync.remoteapi);
var state_127898__$1 = state_127898;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_127898__$1,(2),inst_127850);
} else {
if((state_val_127899 === (4))){
var inst_127852 = (state_127898[(9)]);
var inst_127856 = cljs.core.map_QMARK_(inst_127852);
var state_127898__$1 = state_127898;
if(inst_127856){
var statearr_127903_127967 = state_127898__$1;
(statearr_127903_127967[(1)] = (6));

} else {
var statearr_127904_127972 = state_127898__$1;
(statearr_127904_127972[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (15))){
var inst_127872 = frontend.handler.user.logged_in_QMARK_();
var state_127898__$1 = state_127898;
var statearr_127905_127973 = state_127898__$1;
(statearr_127905_127973[(2)] = inst_127872);

(statearr_127905_127973[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (21))){
var inst_127881 = (state_127898[(2)]);
var inst_127882 = frontend.handler.file_sync.load_session_graphs();
var state_127898__$1 = (function (){var statearr_127906 = state_127898;
(statearr_127906[(10)] = inst_127881);

return statearr_127906;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_127898__$1,(22),inst_127882);
} else {
if((state_val_127899 === (13))){
var state_127898__$1 = state_127898;
var statearr_127907_127974 = state_127898__$1;
(statearr_127907_127974[(2)] = new cljs.core.Keyword(null,"unavailable","unavailable",1529915531));

(statearr_127907_127974[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (22))){
var inst_127852 = (state_127898[(9)]);
var inst_127869 = (state_127898[(7)]);
var inst_127884 = (state_127898[(2)]);
var inst_127885 = promesa.protocols._promise(null);
var inst_127886 = (function (){var result = inst_127852;
var status = inst_127869;
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.refresh_repos_BANG_()),(function (repos){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.some((function (p1__127845_SHARP_){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__127845_SHARP_),repo);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.vector_QMARK_(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__127845_SHARP_));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var G__127908 = cljs.core.first(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__127845_SHARP_));
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__127908) : frontend.util.uuid_string_QMARK_.call(null,G__127908));
})();
if(cljs.core.truth_(and__5000__auto____$2)){
var G__127909 = cljs.core.second(new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022).cljs$core$IFn$_invoke$arity$1(p1__127845_SHARP_));
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__127909) : frontend.util.uuid_string_QMARK_.call(null,G__127909));
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
var inst_127887 = promesa.protocols._mcat(inst_127885,inst_127886);
var state_127898__$1 = (function (){var statearr_127910 = state_127898;
(statearr_127910[(11)] = inst_127884);

return statearr_127910;
})();
var statearr_127911_127975 = state_127898__$1;
(statearr_127911_127975[(2)] = inst_127887);

(statearr_127911_127975[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (6))){
var inst_127852 = (state_127898[(9)]);
var inst_127859 = (state_127898[(12)]);
var inst_127858 = frontend.state.set_user_info_BANG_(inst_127852);
var inst_127859__$1 = frontend.handler.user.user_uuid();
var state_127898__$1 = (function (){var statearr_127912 = state_127898;
(statearr_127912[(13)] = inst_127858);

(statearr_127912[(12)] = inst_127859__$1);

return statearr_127912;
})();
if(cljs.core.truth_(inst_127859__$1)){
var statearr_127913_127976 = state_127898__$1;
(statearr_127913_127976[(1)] = (9));

} else {
var statearr_127914_127977 = state_127898__$1;
(statearr_127914_127977[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (17))){
var inst_127875 = (state_127898[(2)]);
var state_127898__$1 = state_127898;
if(cljs.core.truth_(inst_127875)){
var statearr_127915_127978 = state_127898__$1;
(statearr_127915_127978[(1)] = (18));

} else {
var statearr_127916_127979 = state_127898__$1;
(statearr_127916_127979[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (3))){
var state_127898__$1 = state_127898;
var statearr_127917_127980 = state_127898__$1;
(statearr_127917_127980[(2)] = null);

(statearr_127917_127980[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (12))){
var state_127898__$1 = state_127898;
var statearr_127918_127981 = state_127898__$1;
(statearr_127918_127981[(2)] = new cljs.core.Keyword(null,"welcome","welcome",-578152123));

(statearr_127918_127981[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (2))){
var inst_127852 = (state_127898[(9)]);
var inst_127852__$1 = (state_127898[(2)]);
var inst_127853 = (inst_127852__$1 instanceof cljs.core.ExceptionInfo);
var state_127898__$1 = (function (){var statearr_127919 = state_127898;
(statearr_127919[(9)] = inst_127852__$1);

return statearr_127919;
})();
if(cljs.core.truth_(inst_127853)){
var statearr_127920_127982 = state_127898__$1;
(statearr_127920_127982[(1)] = (3));

} else {
var statearr_127921_127983 = state_127898__$1;
(statearr_127921_127983[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (19))){
var state_127898__$1 = state_127898;
var statearr_127922_127984 = state_127898__$1;
(statearr_127922_127984[(2)] = null);

(statearr_127922_127984[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (11))){
var inst_127864 = (state_127898[(2)]);
var inst_127865 = frontend.handler.user.alpha_or_beta_user_QMARK_();
var state_127898__$1 = (function (){var statearr_127923 = state_127898;
(statearr_127923[(14)] = inst_127864);

return statearr_127923;
})();
if(cljs.core.truth_(inst_127865)){
var statearr_127924_127985 = state_127898__$1;
(statearr_127924_127985[(1)] = (12));

} else {
var statearr_127925_127986 = state_127898__$1;
(statearr_127925_127986[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (9))){
var inst_127859 = (state_127898[(12)]);
var inst_127861 = frontend.modules.instrumentation.sentry.set_user_BANG_(inst_127859);
var state_127898__$1 = state_127898;
var statearr_127926_127987 = state_127898__$1;
(statearr_127926_127987[(2)] = inst_127861);

(statearr_127926_127987[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (5))){
var inst_127896 = (state_127898[(2)]);
var state_127898__$1 = state_127898;
return cljs.core.async.impl.ioc_helpers.return_chan(state_127898__$1,inst_127896);
} else {
if((state_val_127899 === (14))){
var inst_127869 = (state_127898[(7)]);
var inst_127870 = (state_127898[(15)]);
var inst_127869__$1 = (state_127898[(2)]);
var inst_127870__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_127869__$1,new cljs.core.Keyword(null,"welcome","welcome",-578152123));
var state_127898__$1 = (function (){var statearr_127927 = state_127898;
(statearr_127927[(7)] = inst_127869__$1);

(statearr_127927[(15)] = inst_127870__$1);

return statearr_127927;
})();
if(inst_127870__$1){
var statearr_127928_127988 = state_127898__$1;
(statearr_127928_127988[(1)] = (15));

} else {
var statearr_127929_127989 = state_127898__$1;
(statearr_127929_127989[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (16))){
var inst_127870 = (state_127898[(15)]);
var state_127898__$1 = state_127898;
var statearr_127930_127990 = state_127898__$1;
(statearr_127930_127990[(2)] = inst_127870);

(statearr_127930_127990[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (10))){
var state_127898__$1 = state_127898;
var statearr_127931_127991 = state_127898__$1;
(statearr_127931_127991[(2)] = null);

(statearr_127931_127991[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_127899 === (18))){
var inst_127877 = frontend.handler.events.ui.enable_beta_features_BANG_();
var inst_127878 = frontend.handler.db_based.rtc._LT_get_remote_graphs();
var inst_127879 = cljs.core.async.interop.p__GT_c(inst_127878);
var state_127898__$1 = (function (){var statearr_127932 = state_127898;
(statearr_127932[(16)] = inst_127877);

return statearr_127932;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_127898__$1,(21),inst_127879);
} else {
if((state_val_127899 === (8))){
var inst_127894 = (state_127898[(2)]);
var state_127898__$1 = state_127898;
var statearr_127933_127992 = state_127898__$1;
(statearr_127933_127992[(2)] = inst_127894);

(statearr_127933_127992[(1)] = (5));


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
var frontend$handler$events$ui$state_machine__32004__auto__ = null;
var frontend$handler$events$ui$state_machine__32004__auto____0 = (function (){
var statearr_127934 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_127934[(0)] = frontend$handler$events$ui$state_machine__32004__auto__);

(statearr_127934[(1)] = (1));

return statearr_127934;
});
var frontend$handler$events$ui$state_machine__32004__auto____1 = (function (state_127898){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_127898);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e127935){var ex__32007__auto__ = e127935;
var statearr_127936_127993 = state_127898;
(statearr_127936_127993[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_127898[(4)]))){
var statearr_127937_127994 = state_127898;
(statearr_127937_127994[(1)] = cljs.core.first((state_127898[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__127995 = state_127898;
state_127898 = G__127995;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$events$ui$state_machine__32004__auto__ = function(state_127898){
switch(arguments.length){
case 0:
return frontend$handler$events$ui$state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$events$ui$state_machine__32004__auto____1.call(this,state_127898);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$events$ui$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$events$ui$state_machine__32004__auto____0;
frontend$handler$events$ui$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$events$ui$state_machine__32004__auto____1;
return frontend$handler$events$ui$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_127938 = f__32196__auto__();
(statearr_127938[(6)] = c__32195__auto__);

return statearr_127938;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync","onboarding-tip","file-sync/onboarding-tip",-1267073709),(function (p__127939){
var vec__127940 = p__127939;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127940,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127940,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127940,(2),null);
var type__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return null;
} else {
var G__127943 = frontend.components.file_sync.make_onboarding_panel(type__$1);
var G__127944 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-backdrop?","close-backdrop?",2081649802),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,new cljs.core.Keyword(null,"welcome","welcome",-578152123))], null),opts], 0));
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__127943,G__127944) : logseq.shui.ui.dialog_open_BANG_.call(null,G__127943,G__127944));
}
}));

//# sourceMappingURL=frontend.handler.events.ui.js.map
