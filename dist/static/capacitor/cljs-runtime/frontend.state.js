goog.provide('frontend.state');
goog.scope(function(){
  frontend.state.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.state !== 'undefined') && (typeof frontend.state._STAR_profile_state !== 'undefined')){
} else {
frontend.state._STAR_profile_state = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.state !== 'undefined') && (typeof frontend.state._STAR_db_worker !== 'undefined')){
} else {
frontend.state._STAR_db_worker = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.state !== 'undefined') && (typeof frontend.state._STAR_editor_info !== 'undefined')){
} else {
frontend.state._STAR_editor_info = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * `<invoke-db-worker` throws err if `*db-worker` not ready yet.
 *   Use this flow to wait till db-worker ready.
 */
frontend.state.db_worker_ready_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.some_QMARK_),missionary.core.watch(frontend.state._STAR_db_worker));
frontend.state._LT_invoke_db_worker_STAR_ = (function frontend$state$_LT_invoke_db_worker_STAR_(qkw,direct_pass_args_QMARK_,args_list){
var worker = cljs.core.deref(frontend.state._STAR_db_worker);
if((worker == null)){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"<invoke-db-worker-error","<invoke-db-worker-error",1539171917),qkw], 0));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("db-worker has not been initialized",cljs.core.PersistentArrayMap.EMPTY);
} else {
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(worker,qkw,direct_pass_args_QMARK_,args_list);
});
/**
 * invoke db-worker thread api
 */
frontend.state._LT_invoke_db_worker = (function frontend$state$_LT_invoke_db_worker(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59105 = arguments.length;
var i__5727__auto___59106 = (0);
while(true){
if((i__5727__auto___59106 < len__5726__auto___59105)){
args__5732__auto__.push((arguments[i__5727__auto___59106]));

var G__59108 = (i__5727__auto___59106 + (1));
i__5727__auto___59106 = G__59108;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic = (function (qkw,args){
return frontend.state._LT_invoke_db_worker_STAR_(qkw,false,args);
}));

(frontend.state._LT_invoke_db_worker.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.state._LT_invoke_db_worker.cljs$lang$applyTo = (function (seq57938){
var G__57939 = cljs.core.first(seq57938);
var seq57938__$1 = cljs.core.next(seq57938);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__57939,seq57938__$1);
}));

/**
 * invoke db-worker thread api.
 *   But directly pass args to db-worker(won't do transit-write on them).
 */
frontend.state._LT_invoke_db_worker_direct_pass_args = (function frontend$state$_LT_invoke_db_worker_direct_pass_args(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59109 = arguments.length;
var i__5727__auto___59111 = (0);
while(true){
if((i__5727__auto___59111 < len__5726__auto___59109)){
args__5732__auto__.push((arguments[i__5727__auto___59111]));

var G__59112 = (i__5727__auto___59111 + (1));
i__5727__auto___59111 = G__59112;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$core$IFn$_invoke$arity$variadic = (function (qkw,args){
return frontend.state._LT_invoke_db_worker_STAR_(qkw,true,args);
}));

(frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.state._LT_invoke_db_worker_direct_pass_args.cljs$lang$applyTo = (function (seq57940){
var G__57941 = cljs.core.first(seq57940);
var seq57940__$1 = cljs.core.next(seq57940);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__57941,seq57940__$1);
}));

if((typeof frontend !== 'undefined') && (typeof frontend.state !== 'undefined') && (typeof frontend.state.state !== 'undefined')){
} else {
frontend.state.state = (function (){var document_mode_QMARK_ = (function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("document","mode?","document/mode?",-994203479));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})();
var current_graph = (function (){var url_graph = new cljs.core.Keyword(null,"graph","graph",1558099509).cljs$core$IFn$_invoke$arity$1(frontend.util.parse_params());
var graph = (function (){var or__5002__auto__ = url_graph;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.storage.get(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
}
})();
if(cljs.core.truth_(graph)){
electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["setCurrentGraph",graph], 0));
} else {
}

return graph;
})();
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("ui","container-id","ui/container-id",1274679328),new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248),new cljs.core.Keyword("ui","select-query-cache","ui/select-query-cache",-103472992),new cljs.core.Keyword("ui","navigation-item-collapsed?","ui/navigation-item-collapsed?",-1247120960),new cljs.core.Keyword("editor","set-timestamp-block","editor/set-timestamp-block",1136443872),new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984),new cljs.core.Keyword("ui","fullscreen?","ui/fullscreen?",-1171714336),new cljs.core.Keyword("feature","enable-sync-diff-merge?","feature/enable-sync-diff-merge?",-2042896608),new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608),new cljs.core.Keyword("ui","root-component","ui/root-component",-1807033247),new cljs.core.Keyword("user","info","user/info",-345834271),new cljs.core.Keyword("feature","enable-sync?","feature/enable-sync?",-817494751),new cljs.core.Keyword("ui","collapsed-blocks","ui/collapsed-blocks",-968043167),new cljs.core.Keyword("reactive","query-dbs","reactive/query-dbs",1169865121),new cljs.core.Keyword("assets","alias-enabled?","assets/alias-enabled?",-40753727),new cljs.core.Keyword("whiteboard","pending-tx-data","whiteboard/pending-tx-data",66525729),new cljs.core.Keyword("editor","op","editor/op",-441449246),new cljs.core.Keyword("pdf","block-highlight-colored?","pdf/block-highlight-colored?",1763046626),new cljs.core.Keyword("plugin","marketplace-stats","plugin/marketplace-stats",1801405730),new cljs.core.Keyword("graph","syncing?","graph/syncing?",-560055838),new cljs.core.Keyword("instrument","disabled?","instrument/disabled?",165654178),new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058),new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),new cljs.core.Keyword("selection","blocks","selection/blocks",638970019),new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581),new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347),new cljs.core.Keyword("editor","virtualized-scroll-fn","editor/virtualized-scroll-fn",-343790237),new cljs.core.Keyword("search","mode","search/mode",1628111395),new cljs.core.Keyword("ui","main-container-scroll-top","ui/main-container-scroll-top",1193942851),new cljs.core.Keyword("ui","cached-key->container-id","ui/cached-key->container-id",-989519868),new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996),new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868),new cljs.core.Keyword("editor","action","editor/action",449993861),new cljs.core.Keyword("editor","block-op-type","editor/block-op-type",1578820069),new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("system","info","system/info",-1203399931),new cljs.core.Keyword("ui","paths-scroll-positions","ui/paths-scroll-positions",1953998950),new cljs.core.Keyword("electron","server","electron/server",1484164422),new cljs.core.Keyword("electron","auto-updater-downloaded","electron/auto-updater-downloaded",760067750),new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822),new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946),new cljs.core.Keyword("custom-context-menu","show?","custom-context-menu/show?",2074408902),new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),new cljs.core.Keyword("ui","viewport","ui/viewport",443348007),new cljs.core.Keyword("editor","document-mode?","editor/document-mode?",-2096420601),new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233),new cljs.core.Keyword("file","rename-event-chan","file/rename-event-chan",-901857721),new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343),new cljs.core.Keyword("modal","id","modal/id",-1274892409),new cljs.core.Keyword("editor","raw-mode-block","editor/raw-mode-block",-1788505944),new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152),new cljs.core.Keyword("auth","refresh-token","auth/refresh-token",-1024820760),new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),new cljs.core.Keyword("document","mode?","document/mode?",-994203479),new cljs.core.Keyword("auth","access-token","auth/access-token",-657486615),new cljs.core.Keyword("ui","scrolling?","ui/scrolling?",-365025943),new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193),new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),new cljs.core.Keyword("electron","window-maximized?","electron/window-maximized?",-1905378935),new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),new cljs.core.Keyword("editor","editing?","editor/editing?",807325417),new cljs.core.Keyword("git","current-repo","git/current-repo",107438825),new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746),new cljs.core.Keyword("pdf","system-win?","pdf/system-win?",-2028066550),new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878),new cljs.core.Keyword("file-sync","set-remote-graph-password-result","file-sync/set-remote-graph-password-result",-1161271382),new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),new cljs.core.Keyword("electron","updater","electron/updater",454456683),new cljs.core.Keyword("rtc","uploading?","rtc/uploading?",316154315),new cljs.core.Keyword("history","paused?","history/paused?",-21834005),new cljs.core.Keyword(null,"today","today",945271563),new cljs.core.Keyword("search","result","search/result",443756363),new cljs.core.Keyword("plugin","active-readme","plugin/active-readme",-677043988),new cljs.core.Keyword("youtube","players","youtube/players",1844913740),new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020),new cljs.core.Keyword("mobile","container-urls","mobile/container-urls",149073836),new cljs.core.Keyword("plugin","selected-theme","plugin/selected-theme",-172679220),new cljs.core.Keyword("plugin","updates-auto-checking?","plugin/updates-auto-checking?",1617323181),new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267),new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291),new cljs.core.Keyword("view","components","view/components",-1071666675),new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword("plugin","installed-resources","plugin/installed-resources",-1742961043),new cljs.core.Keyword("editor","last-replace-ref-content-tx","editor/last-replace-ref-content-tx",831177325),new cljs.core.Keyword("editor","args","editor/args",208005741),new cljs.core.Keyword("editor","last-saved-cursor","editor/last-saved-cursor",-284040435),new cljs.core.Keyword("whiteboard","onboarding-tour?","whiteboard/onboarding-tour?",2082551629),new cljs.core.Keyword("encryption","graph-parsing?","encryption/graph-parsing?",1059330925),new cljs.core.Keyword("editor","block-dom-id","editor/block-dom-id",208740398),new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086),new cljs.core.Keyword("plugin","marketplace-pkgs","plugin/marketplace-pkgs",637462798),new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034),new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247),new cljs.core.Keyword("plugin","selected-unpacked-pkg","plugin/selected-unpacked-pkg",-286319185),new cljs.core.Keyword(null,"route-match","route-match",-1450985937),new cljs.core.Keyword("selection","selected-all?","selection/selected-all?",208605839),new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537),new cljs.core.Keyword("plugin","enabled","plugin/enabled",-2065640529),new cljs.core.Keyword("custom-context-menu","position","custom-context-menu/position",666089423),new cljs.core.Keyword("plugin","indicator-text","plugin/indicator-text",-221282032),new cljs.core.Keyword("plugin","navs-settings?","plugin/navs-settings?",-615901808),new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),new cljs.core.Keyword("ui","highlight-recent-days","ui/highlight-recent-days",388728304),new cljs.core.Keyword("rtc","state","rtc/state",-1988572624),new cljs.core.Keyword("srs","mode?","srs/mode?",-258295984),new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728),new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),new cljs.core.Keyword("selection","direction","selection/direction",1172907345),new cljs.core.Keyword("editor","next-edit-block","editor/next-edit-block",800596433),new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),new cljs.core.Keyword("copy","export-block-text-other-options","copy/export-block-text-other-options",1053932178),new cljs.core.Keyword("db","latest-transacted-entity-uuids","db/latest-transacted-entity-uuids",-64055438),new cljs.core.Keyword("editor","latest-shortcut","editor/latest-shortcut",-2095243213),new cljs.core.Keyword(null,"draw?","draw?",1765298547),new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061),new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581),new cljs.core.Keyword("copy","export-block-text-remove-options","copy/export-block-text-remove-options",-1213505869),new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557),new cljs.core.Keyword("notification","content","notification/content",-436270189),new cljs.core.Keyword("ui","sidebar-width","ui/sidebar-width",929889300),new cljs.core.Keyword("copy","export-block-text-indent-style","copy/export-block-text-indent-style",1531384180),new cljs.core.Keyword("nfs","refreshing?","nfs/refreshing?",-1285076588),new cljs.core.Keyword("ui","toggle-highlight-recent-blocks?","ui/toggle-highlight-recent-blocks?",261743188),new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612),new cljs.core.Keyword("editor","hidden-editors","editor/hidden-editors",254075860),new cljs.core.Keyword("ui","theme","ui/theme",-1247877132),new cljs.core.Keyword("reactive","custom-queries","reactive/custom-queries",-213333931),new cljs.core.Keyword("editor","last-input-time","editor/last-input-time",-2008067915),new cljs.core.Keyword("electron","updater-pending?","electron/updater-pending?",-1675811595),new cljs.core.Keyword("editor","block","editor/block",1699377461),new cljs.core.Keyword("editor","draw-mode?","editor/draw-mode?",-1033068203),new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267),new cljs.core.Keyword("editor","content","editor/content",-756190443),new cljs.core.Keyword("network","online?","network/online?",1306822774),new cljs.core.Keyword("db","async-queries","db/async-queries",1853808854),new cljs.core.Keyword("notification","contents","notification/contents",-1760740618),new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833),new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017),new cljs.core.Keyword("plugin","updates-unchecked","plugin/updates-unchecked",723985111),new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127),new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696),new cljs.core.Keyword("whiteboard","last-persisted-at","whiteboard/last-persisted-at",-669908968),new cljs.core.Keyword("block","component-editing-mode?","block/component-editing-mode?",-1744931560),new cljs.core.Keyword("search","args","search/args",-462145864),new cljs.core.Keyword("editor","action-data","editor/action-data",969703128),new cljs.core.Keyword("search","q","search/q",-553992135),new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855),new cljs.core.Keyword("ui","global-last-key-code","ui/global-last-key-code",-1972103495),new cljs.core.Keyword("search","engines","search/engines",-1270836455),new cljs.core.Keyword("indexeddb","support?","indexeddb/support?",114020185),new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881),new cljs.core.Keyword("electron","window-fullscreen?","electron/window-fullscreen?",-499490630),new cljs.core.Keyword("handbook","route-chan","handbook/route-chan",1649058330),new cljs.core.Keyword("repo","loading-files?","repo/loading-files?",196666138),new cljs.core.Keyword("rtc","log","rtc/log",-1596481285),new cljs.core.Keyword("editor","on-paste?","editor/on-paste?",1852983579),new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword("custom-context-menu","links","custom-context-menu/links",-1197608677),new cljs.core.Keyword("graph","loading?","graph/loading?",1937181019),new cljs.core.Keyword("pdf","auto-open-ctx-menu?","pdf/auto-open-ctx-menu?",-1579137381),new cljs.core.Keyword("favorites","updated?","favorites/updated?",-1904365701),new cljs.core.Keyword("system","events","system/events",-1178951588),new cljs.core.Keyword("ui","show-empty-and-hidden-properties?","ui/show-empty-and-hidden-properties?",1338368380),new cljs.core.Keyword("notification","show?","notification/show?",2024447580),new cljs.core.Keyword("selection","start-block","selection/start-block",-832131492),new cljs.core.Keyword("ui","file-component","ui/file-component",-1447074212),new cljs.core.Keyword("editor","last-key-code","editor/last-key-code",607982236),new cljs.core.Keyword("plugin","preferences","plugin/preferences",668527388),new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395),new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027),new cljs.core.Keyword("plugin","installed-slash-commands","plugin/installed-slash-commands",-58447235),new cljs.core.Keyword("plugin","installed-themes","plugin/installed-themes",1969555197),new cljs.core.Keyword("editor","code-block-context","editor/code-block-context",-1384305346),new cljs.core.Keyword("editor","in-composition?","editor/in-composition?",-259037730),new cljs.core.Keyword("rtc","online-info","rtc/online-info",-1915777921),new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword("command-palette","commands","command-palette/commands",-168367617),new cljs.core.Keyword("feature","enable-rtc?","feature/enable-rtc?",-2018465217),new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337),new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775)],[cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"ls-onboarding-whiteboard?","ls-onboarding-whiteboard?",-1365895638));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})(),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),frontend.storage.get(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984)),false,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,true)(frontend.storage.get(new cljs.core.Keyword(null,"logseq-sync-diff-merge-enabled","logseq-sync-diff-merge-enabled",-846633784))),false,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"UserGroups","UserGroups",1693861388),frontend.storage.get(new cljs.core.Keyword(null,"user-groups","user-groups",-1264926454))], null),frontend.storage.get(new cljs.core.Keyword(null,"logseq-sync-enabled","logseq-sync-enabled",-1886165044)),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("assets","alias-enabled?","assets/alias-enabled?",-40753727));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})(),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),(function (){var or__5002__auto__ = frontend.storage.get("ls-pdf-hl-block-is-colored");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return true;
}
})(),null,false,frontend.storage.get("instrument-disabled"),false,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),null,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"light","light",1918998747),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),"light"], null),new cljs.core.Keyword(null,"dark","dark",1818973999),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),"dark"], null)], null);
}
})(),null,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.PersistentArrayMap.EMPTY,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),null,false,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,(function (){var or__5002__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.win32_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return false;
}
}
})())(frontend.storage.get(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822))),null,false,null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,document_mode_QMARK_,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.PersistentArrayMap.EMPTY,null,cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((100)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"loading","loading",-737050189),false,new cljs.core.Keyword(null,"graphs","graphs",-1584479112),null], null),false,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.PersistentVector.EMPTY,frontend.storage.get("refresh-token"),cljs.core.PersistentArrayMap.EMPTY,document_mode_QMARK_,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),null,false,false,cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),current_graph,null,null,false,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.storage.get("developer-mode"),"true")) || (false)),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),null,null,null,cljs.core.PersistentArrayMap.EMPTY,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})(),null,null,false,null,null,cljs.core.PersistentArrayMap.EMPTY,null,cljs.core.PersistentArrayMap.EMPTY,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"whiteboard-onboarding-tour?","whiteboard-onboarding-tour?",1650413719));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})(),false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),((frontend.storage.get(new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086)) === false)?false:true),null,cljs.core.PersistentArrayMap.EMPTY,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),null,null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),(function (){var and__5000__auto__ = frontend.util.plugin_platform_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,true)(frontend.storage.get(new cljs.core.Keyword("frontend.spec.storage","lsp-core-enabled","frontend.spec.storage/lsp-core-enabled",-1474488934)));
} else {
return and__5000__auto__;
}
})(),null,null,true,false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("ui","highlight-recent-days","ui/highlight-recent-days",388728304));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (3);
}
})()),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),false,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-graph-uuid","current-graph-uuid",359245938),null], null),cljs.core.boolean$(frontend.storage.get(new cljs.core.Keyword(null,"ls-left-sidebar-open?","ls-left-sidebar-open?",-1185405802))),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("copy","export-block-text-other-options","copy/export-block-text-other-options",1053932178));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),false,frontend.storage.get(new cljs.core.Keyword("ui","wide-mode","ui/wide-mode",2105536944)),cljs.core.List.EMPTY,null,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("copy","export-block-text-remove-options","copy/export-block-text-remove-options",-1213505869));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentHashSet.EMPTY;
}
})(),"NONE",null,"40%",(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("copy","export-block-text-indent-style","copy/export-block-text-indent-style",1531384180));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "dashes";
}
})(),null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),false,cljs.core.PersistentHashSet.EMPTY,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "light";
}
})(),cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1000)),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),false,cljs.core.PersistentVector.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),true,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.PersistentArrayMap.EMPTY,(function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"welcome","welcome",-578152123),false], null);
}
})(),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),null,frontend.storage.get(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017)),cljs.core.PersistentHashSet.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,false,null,null,"",cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.PersistentArrayMap.EMPTY,true,cljs.core.PersistentArrayMap.EMPTY,false,cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.async.sliding_buffer((1))),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),null,null,null,cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(false,frontend.storage.get("ls-pdf-auto-open-ctx-menu")),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1000)),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"global","global",93595047),new cljs.core.Keyword(null,"show?","show?",1543842127),false], null)),false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),null,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentVector.EMPTY,null,false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.PersistentArrayMap.EMPTY,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),frontend.storage.get(new cljs.core.Keyword(null,"logseq-rtc-enabled","logseq-rtc-enabled",280055811)),cljs.core.PersistentHashSet.EMPTY,frontend.storage.get(new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775))]));
})();
}
/**
 * Common default config for a user's repo config
 */
frontend.state.common_default_config = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("feature","enable-search-remove-accents?","feature/enable-search-remove-accents?",1106083837),true,new cljs.core.Keyword("ui","auto-expand-block-refs?","ui/auto-expand-block-refs?",-1188664588),true,new cljs.core.Keyword("file","name-format","file/name-format",1975432459),new cljs.core.Keyword(null,"legacy","legacy",1434943289)], null);
/**
 * Default repo config for file graphs
 */
frontend.state.file_default_config = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.common_default_config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-queries","default-queries",1508774260),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"journals","journals",-1915761091),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"title","title",636505583),"\uD83D\uDD28 NOW",new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null),new cljs.core.Symbol(null,"?today","?today",-1774948230,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"task","task",163923534,null),new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NOW","null","DOING","null"], null), null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?today","?today",-1774948230,null))], null)], null),new cljs.core.Keyword(null,"inputs","inputs",865803858),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"14d","14d",922220438),new cljs.core.Keyword(null,"today","today",945271563)], null),new cljs.core.Keyword(null,"result-transform","result-transform",1904908186),cljs.core.list(new cljs.core.Symbol(null,"fn","fn",465265323,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"result","result",-1239343558,null)], null),cljs.core.list(new cljs.core.Symbol(null,"sort-by","sort-by",1317932224,null),cljs.core.list(new cljs.core.Symbol(null,"fn","fn",465265323,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"h","h",-1544777029,null)], null),cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"h","h",-1544777029,null),new cljs.core.Keyword("block","priority","block/priority",1491369544),"Z")),new cljs.core.Symbol(null,"result","result",-1239343558,null))),new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),false,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),false], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),"\uD83D\uDCC5 NEXT",new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null),new cljs.core.Symbol(null,"?next","?next",-211781622,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"task","task",163923534,null),new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["TODO","null","NOW","null","LATER","null"], null), null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?h","?h",701169648,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">",">",1085014381,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<","<",993667236,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?next","?next",-211781622,null))], null)], null),new cljs.core.Keyword(null,"inputs","inputs",865803858),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"today","today",945271563),new cljs.core.Keyword(null,"7d-after","7d-after",-1361075404)], null),new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),false,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),false], null)], null)], null)], null)], 0));
/**
 * Default repo config for DB graphs
 */
frontend.state.db_default_config = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.common_default_config,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-queries","default-queries",1508774260),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"journals","journals",-1915761091),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),logseq.shui.ui.tabler_icon("InProgress50",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"align-middle pr-1"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.align-middle","span.align-middle",1523859446),"DOING"], null)], null),new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null),new cljs.core.Symbol(null,"?today","?today",-1774948230,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"task","task",163923534,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Doing","null"], null), null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?today","?today",-1774948230,null))], null)], null),new cljs.core.Keyword(null,"inputs","inputs",865803858),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"14d","14d",922220438),new cljs.core.Keyword(null,"today","today",945271563)], null),new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),false], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),logseq.shui.ui.tabler_icon("Todo",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"align-middle pr-1"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.align-middle","span.align-middle",1523859446),"TODO"], null)], null),new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null),new cljs.core.Symbol(null,"?next","?next",-211781622,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"task","task",163923534,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Todo","null"], null), null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">",">",1085014381,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?start","?start",-1182059288,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<","<",993667236,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?next","?next",-211781622,null))], null)], null),new cljs.core.Keyword(null,"inputs","inputs",865803858),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"today","today",945271563),new cljs.core.Keyword(null,"7d-after","7d-after",-1361075404)], null),new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),false,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),false], null)], null)], null),new cljs.core.Keyword("ui","hide-empty-properties?","ui/hide-empty-properties?",-2048102776),false], null)], 0));


/**
 * Merges user configs in given orders. All values are overridden except for maps
 *   which are merged.
 */
frontend.state.merge_configs = (function frontend$state$merge_configs(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59187 = arguments.length;
var i__5727__auto___59188 = (0);
while(true){
if((i__5727__auto___59188 < len__5726__auto___59187)){
args__5732__auto__.push((arguments[i__5727__auto___59188]));

var G__59189 = (i__5727__auto___59188 + (1));
i__5727__auto___59188 = G__59189;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.state.merge_configs.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.state.merge_configs.cljs$core$IFn$_invoke$arity$variadic = (function (configs){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.merge_with,(function frontend$state$merge_config(current,new$){
if(((cljs.core.map_QMARK_(current)) && (cljs.core.map_QMARK_(new$)))){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([current,new$], 0));
} else {
return new$;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.map_QMARK_,configs));
}));

(frontend.state.merge_configs.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.state.merge_configs.cljs$lang$applyTo = (function (seq57992){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq57992));
}));

frontend.state.get_global_config = (function frontend$state$get_global_config(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword("frontend.state","global-config","frontend.state/global-config",1533356)], null));
});
frontend.state.get_global_config_str_content = (function frontend$state$get_global_config_str_content(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword("frontend.state","global-config-str-content","frontend.state/global-config-str-content",-1141146708)], null));
});
frontend.state.get_graph_config = (function frontend$state$get_graph_config(var_args){
var G__58005 = arguments.length;
switch (G__58005) {
case 0:
return frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$1 = (function (repo_url){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),repo_url], null));
}));

(frontend.state.get_graph_config.cljs$lang$maxFixedArity = 1);

/**
 * User config for the given repo or current repo if none given. All config fetching
 * should be done through this fn in order to get global config and config defaults
 */
frontend.state.get_config = (function frontend$state$get_config(var_args){
var G__58008 = arguments.length;
switch (G__58008) {
case 0:
return frontend.state.get_config.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.get_config.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.get_config.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1 = (function (repo_url){
return frontend.state.merge_configs.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo_url))?frontend.state.db_default_config:frontend.state.file_default_config),frontend.state.get_global_config(),frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$1(repo_url)], 0));
}));

(frontend.state.get_config.cljs$lang$maxFixedArity = 1);

frontend.state.publishing_enable_editing_QMARK_ = (function frontend$state$publishing_enable_editing_QMARK_(){
var and__5000__auto__ = logseq.common.config.PUBLISHING;
if(and__5000__auto__){
return new cljs.core.Keyword("publishing","enable-editing?","publishing/enable-editing?",-39045505).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
} else {
return and__5000__auto__;
}
});
frontend.state.enable_editing_QMARK_ = (function frontend$state$enable_editing_QMARK_(){
var or__5002__auto__ = (!(logseq.common.config.PUBLISHING));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("publishing","enable-editing?","publishing/enable-editing?",-39045505).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.state !== 'undefined') && (typeof frontend.state.built_in_macros !== 'undefined')){
} else {
frontend.state.built_in_macros = new cljs.core.PersistentArrayMap(null, 1, ["img","[:img.$4 {:src \"$1\" :style {:width $2 :height $3}}]"], null);
}
frontend.state.get_macros = (function frontend$state$get_macros(){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.built_in_macros,new cljs.core.Keyword(null,"macros","macros",811339431).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0())], 0));
});
frontend.state.set_assets_alias_enabled_BANG_ = (function frontend$state$set_assets_alias_enabled_BANG_(v){
var G__58022_59224 = new cljs.core.Keyword("assets","alias-enabled?","assets/alias-enabled?",-40753727);
var G__58023_59225 = cljs.core.boolean$(v);
(frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$2(G__58022_59224,G__58023_59225) : frontend.state.set_state_BANG_.call(null,G__58022_59224,G__58023_59225));

return frontend.storage.set(new cljs.core.Keyword("assets","alias-enabled?","assets/alias-enabled?",-40753727),cljs.core.boolean$(v));
});
frontend.state.set_assets_alias_dirs_BANG_ = (function frontend$state$set_assets_alias_dirs_BANG_(dirs){
if(cljs.core.truth_(dirs)){
(frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020),dirs) : frontend.state.set_state_BANG_.call(null,new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020),dirs));

return frontend.storage.set(new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020),dirs);
} else {
return null;
}
});
frontend.state.get_custom_css_link = (function frontend$state$get_custom_css_link(){
return new cljs.core.Keyword(null,"custom-css-url","custom-css-url",442165452).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.get_custom_js_link = (function frontend$state$get_custom_js_link(){
return new cljs.core.Keyword(null,"custom-js-url","custom-js-url",1268122982).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.get_default_journal_template = (function frontend$state$get_default_journal_template(){
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default-templates","default-templates",1374700421),new cljs.core.Keyword(null,"journals","journals",-1915761091)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var template = temp__5804__auto__;
if(clojure.string.blank_QMARK_(template)){
return null;
} else {
return clojure.string.trim(template);
}
} else {
return null;
}
});
frontend.state.all_pages_public_QMARK_ = (function frontend$state$all_pages_public_QMARK_(){
var value = new cljs.core.Keyword("publishing","all-pages-public?","publishing/all-pages-public?",-386830034).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
var value__$1 = (((!((value == null))))?value:new cljs.core.Keyword(null,"all-pages-public?","all-pages-public?",-1773298253).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0()));
return value__$1 === true;
});
frontend.state.get_default_home = (function frontend$state$get_default_home(){
return new cljs.core.Keyword(null,"default-home","default-home",171104159).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.custom_home_page_QMARK_ = (function frontend$state$custom_home_page_QMARK_(){
return (!((new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(frontend.state.get_default_home()) == null)));
});
frontend.state.get_preferred_format = (function frontend$state$get_preferred_format(var_args){
var G__58042 = arguments.length;
switch (G__58042) {
case 0:
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$1 = (function (repo_url){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = logseq.common.config.get_preferred_format(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo_url));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"preferred_format","preferred_format",-751060128)], null),"markdown");
}
})());
}));

(frontend.state.get_preferred_format.cljs$lang$maxFixedArity = 1);

frontend.state.markdown_QMARK_ = (function frontend$state$markdown_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0()),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
});
frontend.state.get_pages_directory = (function frontend$state$get_pages_directory(){
var or__5002__auto__ = (function (){var temp__5804__auto__ = (frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return new cljs.core.Keyword(null,"pages-directory","pages-directory",-1705912407).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "pages";
}
});
frontend.state.get_journals_directory = (function frontend$state$get_journals_directory(){
var or__5002__auto__ = (function (){var temp__5804__auto__ = (frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return new cljs.core.Keyword(null,"journals-directory","journals-directory",1373812460).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "journals";
}
});
frontend.state.get_whiteboards_directory = (function frontend$state$get_whiteboards_directory(){
var or__5002__auto__ = (function (){var temp__5804__auto__ = (frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return new cljs.core.Keyword(null,"whiteboards-directory","whiteboards-directory",1994949079).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "whiteboards";
}
});
frontend.state.org_mode_file_link_QMARK_ = (function frontend$state$org_mode_file_link_QMARK_(repo){
return new cljs.core.Keyword("org-mode","insert-file-link?","org-mode/insert-file-link?",-1472433842).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo));
});
frontend.state.get_journal_file_name_format = (function frontend$state$get_journal_file_name_format(){
var temp__5804__auto__ = (frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return new cljs.core.Keyword("journal","file-name-format","journal/file-name-format",-18110349).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo));
} else {
return null;
}
});
frontend.state.get_preferred_workflow = (function frontend$state$get_preferred_workflow(){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"preferred-workflow","preferred-workflow",-1794663444).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(temp__5804__auto__)){
var workflow = temp__5804__auto__;
var workflow__$1 = cljs.core.name(workflow);
if(cljs.core.truth_((function (){var G__58066 = /now|NOW/;
var G__58067 = workflow__$1;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__58066,G__58067) : frontend.util.safe_re_find.call(null,G__58066,G__58067));
})())){
return new cljs.core.Keyword(null,"now","now",-1650525531);
} else {
return new cljs.core.Keyword(null,"todo","todo",-1046442570);
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"preferred_workflow","preferred_workflow",145480799)], null),new cljs.core.Keyword(null,"now","now",-1650525531));
}
})());
});
frontend.state.get_preferred_todo = (function frontend$state$get_preferred_todo(){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_preferred_workflow(),new cljs.core.Keyword(null,"now","now",-1650525531))){
return "LATER";
} else {
return "TODO";
}
});
frontend.state.get_date_formatter = (function frontend$state$get_date_formatter(){
var repo = (frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null));
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
var temp__5804__auto__ = frontend.db.conn_state.get_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(logseq.db.common.entity_plus.entity_memoized(cljs.core.deref(conn),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)),new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954),"MMM do, yyyy");
} else {
return null;
}
} else {
return logseq.common.config.get_date_formatter(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
}
});
frontend.state.custom_shortcuts = (function frontend$state$custom_shortcuts(){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.storage.get(new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504)),new cljs.core.Keyword(null,"shortcuts","shortcuts",1717107810).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0())], 0));
});
frontend.state.get_commands = (function frontend$state$get_commands(){
return new cljs.core.Keyword(null,"commands","commands",161008658).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.get_scheduled_future_days = (function frontend$state$get_scheduled_future_days(){
var days = new cljs.core.Keyword("scheduled","future-days","scheduled/future-days",-104348029).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
var or__5002__auto__ = ((cljs.core.int_QMARK_(days))?days:null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (7);
}
});
frontend.state.get_start_of_week = (function frontend$state$get_start_of_week(){
var or__5002__auto__ = new cljs.core.Keyword(null,"start-of-week","start-of-week",-1590603824).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"start-of-week","start-of-week",-1590603824)], null));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (6);
}
}
});
frontend.state.get_ref_open_blocks_level = (function frontend$state$get_ref_open_blocks_level(){
var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword("ref","default-open-blocks-level","ref/default-open-blocks-level",-51352945).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(temp__5804__auto__)){
var value = temp__5804__auto__;
if(cljs.core.pos_int_QMARK_(value)){
var x__5090__auto__ = value;
var y__5091__auto__ = (9);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (2);
}
});
frontend.state.get_export_bullet_indentation = (function frontend$state$get_export_bullet_indentation(){
var G__58075 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword("export","bullet-indentation","export/bullet-indentation",-647274253),new cljs.core.Keyword(null,"tab","tab",-559583621));
var G__58075__$1 = (((G__58075 instanceof cljs.core.Keyword))?G__58075.fqn:null);
switch (G__58075__$1) {
case "eight-spaces":
return "        ";

break;
case "four-spaces":
return "    ";

break;
case "two-spaces":
return "  ";

break;
case "tab":
return "\t";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__58075__$1)].join('')));

}
});
frontend.state.enable_search_remove_accents_QMARK_ = (function frontend$state$enable_search_remove_accents_QMARK_(){
return new cljs.core.Keyword("feature","enable-search-remove-accents?","feature/enable-search-remove-accents?",1106083837).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
});
/**
 * Creates a rum cursor, https://github.com/tonsky/rum#cursors, for use in rum components.
 * Similar to re-frame subscriptions
 */
frontend.state.sub = (function frontend$state$sub(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59251 = arguments.length;
var i__5727__auto___59252 = (0);
while(true){
if((i__5727__auto___59252 < len__5726__auto___59251)){
args__5732__auto__.push((arguments[i__5727__auto___59252]));

var G__59254 = (i__5727__auto___59252 + (1));
i__5727__auto___59252 = G__59254;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.state.sub.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.state.sub.cljs$core$IFn$_invoke$arity$variadic = (function (ks,p__58103){
var map__58104 = p__58103;
var map__58104__$1 = cljs.core.__destructure_map(map__58104);
var path_in_sub_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58104__$1,new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603));
var ks_coll_QMARK_ = cljs.core.coll_QMARK_(ks);
var get_fn = ((ks_coll_QMARK_)?cljs.core.get_in:cljs.core.get);
var s = (function (){var G__58106 = cljs.core.deref(frontend.state.state);
var G__58107 = ks;
return (get_fn.cljs$core$IFn$_invoke$arity$2 ? get_fn.cljs$core$IFn$_invoke$arity$2(G__58106,G__58107) : get_fn.call(null,G__58106,G__58107));
})();
var s_atom_QMARK_ = frontend.util.atom_QMARK_(s);
var path_coll_QMARK__in_sub_atom = cljs.core.coll_QMARK_(path_in_sub_atom);
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = path_in_sub_atom;
if(cljs.core.truth_(and__5000__auto____$1)){
return path_coll_QMARK__in_sub_atom;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.util.react(rum.core.cursor_in(s,path_in_sub_atom));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK_;
if(and__5000__auto__){
return path_in_sub_atom;
} else {
return and__5000__auto__;
}
})())){
return frontend.util.react(rum.core.cursor(s,path_in_sub_atom));
} else {
if(s_atom_QMARK_){
return frontend.util.react(s);
} else {
if(ks_coll_QMARK_){
return frontend.util.react(rum.core.cursor_in(frontend.state.state,ks));
} else {
return frontend.util.react(rum.core.cursor(frontend.state.state,ks));

}
}
}
}
}));

(frontend.state.sub.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.state.sub.cljs$lang$applyTo = (function (seq58094){
var G__58095 = cljs.core.first(seq58094);
var seq58094__$1 = cljs.core.next(seq58094);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58095,seq58094__$1);
}));

frontend.state.set_editing_block_id_BANG_ = (function frontend$state$set_editing_block_id_BANG_(container_block){
return cljs.core.reset_BANG_(new cljs.core.Keyword("editor","editing?","editor/editing?",807325417).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.PersistentArrayMap.createAsIfByAssoc([container_block,true]));
});
frontend.state.sub_flow_state = (function frontend$state$sub_flow_state(flow,watch_ref,sub_value_f,deps){
var checkf = logseq.shui.hooks.use_callback(sub_value_f,deps);
var init_value = (function (){var G__58117 = cljs.core.deref(watch_ref);
return (checkf.cljs$core$IFn$_invoke$arity$1 ? checkf.cljs$core$IFn$_invoke$arity$1(G__58117) : checkf.call(null,G__58117));
})();
var flow__$1 = logseq.shui.hooks.use_memo((function (){
return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1(checkf),cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.drop_while.cljs$core$IFn$_invoke$arity$1((function (x){
return (x === init_value);
})),flow], 0));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [init_value], null));
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$2(init_value,flow__$1);
});
frontend.state.editing_flow = missionary.core.watch(new cljs.core.Keyword("editor","editing?","editor/editing?",807325417).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
frontend.state.sub_editing_QMARK_ = (function frontend$state$sub_editing_QMARK_(container_block){
return frontend.state.sub_flow_state(frontend.state.editing_flow,new cljs.core.Keyword("editor","editing?","editor/editing?",807325417).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),(function (s){
return cljs.core.boolean$(cljs.core.get.cljs$core$IFn$_invoke$arity$2(s,container_block));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_block], null));
});
/**
 * Sub equivalent to get-config which should handle all sub user-config access
 */
frontend.state.sub_config = (function frontend$state$sub_config(var_args){
var G__58132 = arguments.length;
switch (G__58132) {
case 0:
return frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1 = (function (repo){
var config = frontend.state.sub(new cljs.core.Keyword(null,"config","config",994861415));
return frontend.state.merge_configs.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_((function (){var and__5000__auto__ = typeof repo === 'string';
if(and__5000__auto__){
return logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
} else {
return and__5000__auto__;
}
})())?frontend.state.db_default_config:frontend.state.file_default_config),cljs.core.get.cljs$core$IFn$_invoke$arity$2(config,new cljs.core.Keyword("frontend.state","global-config","frontend.state/global-config",1533356)),cljs.core.get.cljs$core$IFn$_invoke$arity$2(config,repo)], 0));
}));

(frontend.state.sub_config.cljs$lang$maxFixedArity = 1);

frontend.state.enable_grammarly_QMARK_ = (function frontend$state$enable_grammarly_QMARK_(){
return new cljs.core.Keyword("feature","enable-grammarly?","feature/enable-grammarly?",816531392).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0()) === true;
});
frontend.state.scheduled_deadlines_disabled_QMARK_ = (function frontend$state$scheduled_deadlines_disabled_QMARK_(){
return new cljs.core.Keyword("feature","disable-scheduled-and-deadline-query?","feature/disable-scheduled-and-deadline-query?",-1605937327).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0()) === true;
});
frontend.state.enable_timetracking_QMARK_ = (function frontend$state$enable_timetracking_QMARK_(){
return (!(new cljs.core.Keyword("feature","enable-timetracking?","feature/enable-timetracking?",1612021873).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0()) === false));
});
frontend.state.enable_fold_button_right_QMARK_ = (function frontend$state$enable_fold_button_right_QMARK_(){
var _ = frontend.state.sub(new cljs.core.Keyword("ui","viewport","ui/viewport",443348007));
var and__5000__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.sm_breakpoint_QMARK_();
} else {
return and__5000__auto__;
}
});
frontend.state.enable_journals_QMARK_ = (function frontend$state$enable_journals_QMARK_(var_args){
var G__58144 = arguments.length;
switch (G__58144) {
case 0:
return frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return (!(new cljs.core.Keyword("feature","enable-journals?","feature/enable-journals?",1609498182).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo)) === false));
}));

(frontend.state.enable_journals_QMARK_.cljs$lang$maxFixedArity = 1);

frontend.state.enable_flashcards_QMARK_ = (function frontend$state$enable_flashcards_QMARK_(var_args){
var G__58148 = arguments.length;
switch (G__58148) {
case 0:
return frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return (!(new cljs.core.Keyword("feature","enable-flashcards?","feature/enable-flashcards?",1572039243).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo)) === false));
}));

(frontend.state.enable_flashcards_QMARK_.cljs$lang$maxFixedArity = 1);

frontend.state.enable_sync_QMARK_ = (function frontend$state$enable_sync_QMARK_(){
return frontend.state.sub(new cljs.core.Keyword("feature","enable-sync?","feature/enable-sync?",-817494751));
});
frontend.state.enable_sync_diff_merge_QMARK_ = (function frontend$state$enable_sync_diff_merge_QMARK_(){
return frontend.state.sub(new cljs.core.Keyword("feature","enable-sync-diff-merge?","feature/enable-sync-diff-merge?",-2042896608));
});
frontend.state.enable_whiteboards_QMARK_ = (function frontend$state$enable_whiteboards_QMARK_(var_args){
var G__58154 = arguments.length;
switch (G__58154) {
case 0:
return frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$1((frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_current_repo.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_current_repo.call(null)));
}));

(frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return (!(new cljs.core.Keyword("feature","enable-whiteboards?","feature/enable-whiteboards?",-52089888).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo)) === false));
}));

(frontend.state.enable_whiteboards_QMARK_.cljs$lang$maxFixedArity = 1);

frontend.state.enable_rtc_QMARK_ = (function frontend$state$enable_rtc_QMARK_(){
return frontend.state.sub(new cljs.core.Keyword("feature","enable-rtc?","feature/enable-rtc?",-2018465217));
});
frontend.state.enable_git_auto_push_QMARK_ = (function frontend$state$enable_git_auto_push_QMARK_(repo){
return (!(new cljs.core.Keyword(null,"git-auto-push","git-auto-push",2144454612).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo)) === false));
});
frontend.state.graph_settings = (function frontend$state$graph_settings(){
return new cljs.core.Keyword("graph","settings","graph/settings",1067459097).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.graph_forcesettings = (function frontend$state$graph_forcesettings(){
return new cljs.core.Keyword("graph","forcesettings","graph/forcesettings",-17461404).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.show_brackets_QMARK_ = (function frontend$state$show_brackets_QMARK_(){
return (!(new cljs.core.Keyword("ui","show-brackets?","ui/show-brackets?",659790606).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0()) === false));
});
frontend.state.sub_default_home_page = (function frontend$state$sub_default_home_page(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default-home","default-home",171104159),new cljs.core.Keyword(null,"page","page",849072397)], null),"");
});
frontend.state.get_selected_block_ids = (function frontend$state$get_selected_block_ids(blocks){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__58163_SHARP_){
var temp__5804__auto__ = dommy.core.attr(p1__58163_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return cljs.core.uuid(id);
} else {
return null;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks)));
});
frontend.state.block_content_max_length = (function frontend$state$block_content_max_length(repo){
var or__5002__auto__ = new cljs.core.Keyword("block","title-max-length","block/title-max-length",-2027904267).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","content-max-length","block/content-max-length",1087086620).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (10000);
}
}
});
frontend.state.mobile_QMARK_ = (function frontend$state$mobile_QMARK_(){
var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
});
frontend.state.enable_tooltip_QMARK_ = (function frontend$state$enable_tooltip_QMARK_(){
if(cljs.core.truth_(frontend.state.mobile_QMARK_())){
return false;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword("ui","enable-tooltip?","ui/enable-tooltip?",1082007831),true);
}
});
frontend.state.show_command_doc_QMARK_ = (function frontend$state$show_command_doc_QMARK_(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword("ui","show-command-doc?","ui/show-command-doc?",-23052835),true);
});
frontend.state.logical_outdenting_QMARK_ = (function frontend$state$logical_outdenting_QMARK_(){
return new cljs.core.Keyword("editor","logical-outdenting?","editor/logical-outdenting?",-234289706).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.show_full_blocks_QMARK_ = (function frontend$state$show_full_blocks_QMARK_(){
return new cljs.core.Keyword("ui","show-full-blocks?","ui/show-full-blocks?",-87079885).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.preferred_pasting_file_QMARK_ = (function frontend$state$preferred_pasting_file_QMARK_(){
return new cljs.core.Keyword("editor","preferred-pasting-file?","editor/preferred-pasting-file?",-1242172921).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.auto_expand_block_refs_QMARK_ = (function frontend$state$auto_expand_block_refs_QMARK_(){
return new cljs.core.Keyword("ui","auto-expand-block-refs?","ui/auto-expand-block-refs?",-1188664588).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.state.doc_mode_enter_for_new_line_QMARK_ = (function frontend$state$doc_mode_enter_for_new_line_QMARK_(){
var and__5000__auto__ = (frontend.state.document_mode_QMARK_.cljs$core$IFn$_invoke$arity$0 ? frontend.state.document_mode_QMARK_.cljs$core$IFn$_invoke$arity$0() : frontend.state.document_mode_QMARK_.call(null));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword("shortcut","doc-mode-enter-for-new-block?","shortcut/doc-mode-enter-for-new-block?",936132327).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0()));
} else {
return and__5000__auto__;
}
});
frontend.state.user_groups = (function frontend$state$user_groups(){
return cljs.core.set(frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","info","user/info",-345834271),new cljs.core.Keyword(null,"UserGroups","UserGroups",1693861388)], null)));
});
frontend.state.set_state_BANG_ = (function frontend$state$set_state_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59297 = arguments.length;
var i__5727__auto___59298 = (0);
while(true){
if((i__5727__auto___59298 < len__5726__auto___59297)){
args__5732__auto__.push((arguments[i__5727__auto___59298]));

var G__59299 = (i__5727__auto___59298 + (1));
i__5727__auto___59298 = G__59299;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (path,value,p__58185){
var map__58186 = p__58185;
var map__58186__$1 = cljs.core.__destructure_map(map__58186);
var path_in_sub_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58186__$1,new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603));
frontend.state._STAR_profile_state.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update.cljs$core$IFn$_invoke$arity$3(frontend.state._STAR_profile_state.cljs$core$IDeref$_deref$arity$1(null),path,cljs.core.inc));

var path_coll_QMARK__59303 = cljs.core.coll_QMARK_(path);
var get_fn_59304 = ((path_coll_QMARK__59303)?cljs.core.get_in:cljs.core.get);
var s_59305 = (function (){var G__58189 = cljs.core.deref(frontend.state.state);
var G__58190 = path;
return (get_fn_59304.cljs$core$IFn$_invoke$arity$2 ? get_fn_59304.cljs$core$IFn$_invoke$arity$2(G__58189,G__58190) : get_fn_59304.call(null,G__58189,G__58190));
})();
var s_atom_QMARK__59306 = frontend.util.atom_QMARK_(s_59305);
var path_coll_QMARK__in_sub_atom_59307 = cljs.core.coll_QMARK_(path_in_sub_atom);
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK__59306;
if(and__5000__auto__){
var and__5000__auto____$1 = path_in_sub_atom;
if(cljs.core.truth_(and__5000__auto____$1)){
return path_coll_QMARK__in_sub_atom_59307;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var old_v_59309 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(s_59305),path_in_sub_atom);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_v_59309,value)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(s_59305,cljs.core.assoc_in,path_in_sub_atom,value);
} else {
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK__59306;
if(and__5000__auto__){
return path_in_sub_atom;
} else {
return and__5000__auto__;
}
})())){
var old_v_59310 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(s_59305),path_in_sub_atom);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_v_59310,value)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(s_59305,cljs.core.assoc,path_in_sub_atom,value);
} else {
}
} else {
if(s_atom_QMARK__59306){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(s_59305),value)){
cljs.core.reset_BANG_(s_59305,value);
} else {
}
} else {
if(path_coll_QMARK__59303){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(s_59305,value)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc_in,path,value);
} else {
}
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(s_59305,value)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,path,value);
} else {
}

}
}
}
}

return null;
}));

(frontend.state.set_state_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.state.set_state_BANG_.cljs$lang$applyTo = (function (seq58180){
var G__58181 = cljs.core.first(seq58180);
var seq58180__$1 = cljs.core.next(seq58180);
var G__58182 = cljs.core.first(seq58180__$1);
var seq58180__$2 = cljs.core.next(seq58180__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58181,G__58182,seq58180__$2);
}));

frontend.state.update_state_BANG_ = (function frontend$state$update_state_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59315 = arguments.length;
var i__5727__auto___59316 = (0);
while(true){
if((i__5727__auto___59316 < len__5726__auto___59315)){
args__5732__auto__.push((arguments[i__5727__auto___59316]));

var G__59322 = (i__5727__auto___59316 + (1));
i__5727__auto___59316 = G__59322;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.state.update_state_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.state.update_state_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (path,f,p__58216){
var map__58217 = p__58216;
var map__58217__$1 = cljs.core.__destructure_map(map__58217);
var path_in_sub_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58217__$1,new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603));
frontend.state._STAR_profile_state.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update.cljs$core$IFn$_invoke$arity$3(frontend.state._STAR_profile_state.cljs$core$IDeref$_deref$arity$1(null),path,cljs.core.inc));

var path_coll_QMARK__59325 = cljs.core.coll_QMARK_(path);
var get_fn_59326 = ((path_coll_QMARK__59325)?cljs.core.get_in:cljs.core.get);
var s_59327 = (function (){var G__58218 = cljs.core.deref(frontend.state.state);
var G__58219 = path;
return (get_fn_59326.cljs$core$IFn$_invoke$arity$2 ? get_fn_59326.cljs$core$IFn$_invoke$arity$2(G__58218,G__58219) : get_fn_59326.call(null,G__58218,G__58219));
})();
var s_atom_QMARK__59328 = frontend.util.atom_QMARK_(s_59327);
var path_coll_QMARK__in_sub_atom_59329 = cljs.core.coll_QMARK_(path_in_sub_atom);
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK__59328;
if(and__5000__auto__){
var and__5000__auto____$1 = path_in_sub_atom;
if(cljs.core.truth_(and__5000__auto____$1)){
return path_coll_QMARK__in_sub_atom_59329;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(s_59327,cljs.core.update_in,path_in_sub_atom,f);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = s_atom_QMARK__59328;
if(and__5000__auto__){
return path_in_sub_atom;
} else {
return and__5000__auto__;
}
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(s_59327,cljs.core.update,path_in_sub_atom,f);
} else {
if(s_atom_QMARK__59328){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(s_59327,f);
} else {
if(path_coll_QMARK__59325){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update_in,path,f);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update,path,f);

}
}
}
}

return null;
}));

(frontend.state.update_state_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.state.update_state_BANG_.cljs$lang$applyTo = (function (seq58207){
var G__58208 = cljs.core.first(seq58207);
var seq58207__$1 = cljs.core.next(seq58207);
var G__58209 = cljs.core.first(seq58207__$1);
var seq58207__$2 = cljs.core.next(seq58207__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58208,G__58209,seq58207__$2);
}));

frontend.state.get_route_match = (function frontend$state$get_route_match(){
return new cljs.core.Keyword(null,"route-match","route-match",-1450985937).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_current_route = (function frontend$state$get_current_route(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
});
frontend.state.home_QMARK_ = (function frontend$state$home_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"home","home",-74557309),frontend.state.get_current_route());
});
frontend.state.whiteboard_dashboard_QMARK_ = (function frontend$state$whiteboard_dashboard_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),frontend.state.get_current_route());
});
frontend.state.get_current_page = (function frontend$state$get_current_page(){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),frontend.state.get_current_route())){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null));
} else {
return null;
}
});
frontend.state.route_has_p_QMARK_ = (function frontend$state$route_has_p_QMARK_(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"query-params","query-params",900640534),new cljs.core.Keyword(null,"p","p",151049309)], null));
});
/**
 * Returns the current repo URL, or else open demo graph
 */
frontend.state.get_current_repo = (function frontend$state$get_current_repo(){
return new cljs.core.Keyword("git","current-repo","git/current-repo",107438825).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_remote_file_graphs = (function frontend$state$get_remote_file_graphs(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null));
});
frontend.state.get_rtc_graphs = (function frontend$state$get_rtc_graphs(){
return new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_remote_graph_info_by_uuid = (function frontend$state$get_remote_graph_info_by_uuid(uuid){
var temp__5804__auto__ = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null)));
if(temp__5804__auto__){
var graphs = temp__5804__auto__;
return cljs.core.some((function (p1__58232_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58232_SHARP_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid))){
return p1__58232_SHARP_;
} else {
return null;
}
}),graphs);
} else {
return null;
}
});
frontend.state.get_remote_graph_usage = (function frontend$state$get_remote_graph_usage(){
var temp__5804__auto__ = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null)));
if(temp__5804__auto__){
var graphs = temp__5804__auto__;
return cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58242_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__58242_SHARP_,new cljs.core.Keyword(null,"free-gbs","free-gbs",712147194),(new cljs.core.Keyword(null,"limit-gbs","limit-gbs",-997314467).cljs$core$IFn$_invoke$arity$1(p1__58242_SHARP_) - new cljs.core.Keyword(null,"used-gbs","used-gbs",271660092).cljs$core$IFn$_invoke$arity$1(p1__58242_SHARP_)));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58240_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"used-gbs","used-gbs",271660092),new cljs.core.Keyword(null,"limit-gbs","limit-gbs",-997314467),new cljs.core.Keyword(null,"used-percent","used-percent",-1822070047)],[new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_),new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_),(((new cljs.core.Keyword(null,"GraphStorageUsage","GraphStorageUsage",-947283204).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_) / (1024)) / (1024)) / (1024)),(((new cljs.core.Keyword(null,"GraphStorageLimit","GraphStorageLimit",-862725344).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_) / (1024)) / (1024)) / (1024)),((new cljs.core.Keyword(null,"GraphStorageUsage","GraphStorageUsage",-947283204).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_) / new cljs.core.Keyword(null,"GraphStorageLimit","GraphStorageLimit",-862725344).cljs$core$IFn$_invoke$arity$1(p1__58240_SHARP_)) / 0.01)]);
}),graphs)));
} else {
return null;
}
});
frontend.state.delete_remote_graph_BANG_ = (function frontend$state$delete_remote_graph_BANG_(repo){
var remove_repo_BANG_ = (function (repos){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58244_SHARP_){
var and__5000__auto__ = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58244_SHARP_);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(repo),new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58244_SHARP_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),repos);
});
if(cljs.core.truth_(new cljs.core.Keyword(null,"rtc-graph?","rtc-graph?",-203036448).cljs$core$IFn$_invoke$arity$1(repo))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update,new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267),remove_repo_BANG_);
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null),remove_repo_BANG_);
}
});
frontend.state.add_remote_graph_BANG_ = (function frontend$state$add_remote_graph_BANG_(repo){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null),(function (repos){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(repos,repo));
}));
});
frontend.state.get_repos = (function frontend$state$get_repos(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null));
});
frontend.state.set_repos_BANG_ = (function frontend$state$set_repos_BANG_(repos){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(repos));
});
frontend.state.add_repo_BANG_ = (function frontend$state$add_repo_BANG_(repo){
if((!(clojure.string.blank_QMARK_(repo)))){
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null),(function (repos){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(repos,repo));
}));
} else {
return null;
}
});
frontend.state.set_current_repo_BANG_ = (function frontend$state$set_current_repo_BANG_(repo){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("git","current-repo","git/current-repo",107438825),repo);

cljs.core.reset_BANG_(frontend.flows._STAR_current_repo,repo);

if(cljs.core.truth_(repo)){
frontend.storage.set(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825),repo);
} else {
frontend.storage.remove(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
}

return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["setCurrentGraph",repo], 0));
});
frontend.state.set_preferred_format_BANG_ = (function frontend$state$set_preferred_format_BANG_(format){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"preferred_format","preferred_format",-751060128)], null),cljs.core.name(format));
});
frontend.state.set_preferred_workflow_BANG_ = (function frontend$state$set_preferred_workflow_BANG_(workflow){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"preferred_workflow","preferred_workflow",145480799)], null),cljs.core.name(workflow));
});
frontend.state.set_preferred_language_BANG_ = (function frontend$state$set_preferred_language_BANG_(language){
frontend.state.set_state_BANG_(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017),cljs.core.name(language));

return frontend.storage.set(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017),cljs.core.name(language));
});
frontend.state.delete_repo_BANG_ = (function frontend$state$delete_repo_BANG_(repo){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null),(function (repos){
var G__58263 = new cljs.core.Keyword(null,"url","url",276297046);
var G__58264 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58261_SHARP_){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo),new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__58261_SHARP_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58261_SHARP_);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(repo),new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58261_SHARP_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
}),repos);
return (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(G__58263,G__58264) : frontend.util.distinct_by.call(null,G__58263,G__58264));
}));
});
frontend.state.set_timestamp_block_BANG_ = (function frontend$state$set_timestamp_block_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","set-timestamp-block","editor/set-timestamp-block",1136443872),value);
});
frontend.state.get_timestamp_block = (function frontend$state$get_timestamp_block(){
return cljs.core.deref(new cljs.core.Keyword("editor","set-timestamp-block","editor/set-timestamp-block",1136443872).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_edit_block = (function frontend$state$get_edit_block(){
return cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("editor","block","editor/block",1699377461)));
});
frontend.state.editing_QMARK_ = (function frontend$state$editing_QMARK_(){
return cljs.core.seq(cljs.core.deref(new cljs.core.Keyword("editor","editing?","editor/editing?",807325417).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
});
frontend.state.get_edit_input_id = (function frontend$state$get_edit_input_id(){
if((typeof process !== 'undefined')){
return null;
} else {
if(frontend.state.editing_QMARK_()){
try{var temp__5804__auto__ = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return goog.dom.getElement(["edit-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return document.activeElement;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
if(cljs.core.truth_(frontend.util.input_QMARK_(elem))){
var id = frontend.state.goog$module$goog$object.get(elem,"id");
if(clojure.string.starts_with_QMARK_(id,"edit-block-")){
return id;
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}catch (e58271){var _e = e58271;
return null;
}} else {
return null;
}
}
});
frontend.state.set_edit_content_BANG_ = (function frontend$state$set_edit_content_BANG_(var_args){
var G__58279 = arguments.length;
switch (G__58279) {
case 1:
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (value){
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),value);
}));

(frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (input_id,value){
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$3(input_id,value,true);
}));

(frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (input_id,value,set_input_value_QMARK_){
if(cljs.core.truth_(input_id)){
if(cljs.core.truth_(set_input_value_QMARK_)){
var temp__5804__auto___59362 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto___59362)){
var input_59363 = temp__5804__auto___59362;
frontend.util.set_change_value(input_59363,value);
} else {
}
} else {
}

return frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("editor","content","editor/content",-756190443),value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return input_id;
}
})()], 0));
} else {
return null;
}
}));

(frontend.state.set_edit_content_BANG_.cljs$lang$maxFixedArity = 3);

frontend.state.get_input = (function frontend$state$get_input(){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return goog.dom.getElement(id);
} else {
return null;
}
});
frontend.state.get_edit_content = (function frontend$state$get_edit_content(){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword("editor","content","editor/content",-756190443).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))),id);
} else {
return null;
}
});
frontend.state.sub_edit_content = (function frontend$state$sub_edit_content(var_args){
var G__58297 = arguments.length;
switch (G__58297) {
case 0:
return frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
}));

(frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
if(cljs.core.truth_(block_id)){
return frontend.state.sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("editor","content","editor/content",-756190443),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),block_id], null)], 0));
} else {
return null;
}
}));

(frontend.state.sub_edit_content.cljs$lang$maxFixedArity = 1);

frontend.state.set_selection_start_block_BANG_ = (function frontend$state$set_selection_start_block_BANG_(start_block){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","start-block","selection/start-block",-832131492),start_block);
});
frontend.state.get_selection_start_block = (function frontend$state$get_selection_start_block(){
var or__5002__auto__ = cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("selection","start-block","selection/start-block",-832131492)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var edit_block = temp__5804__auto__;
var id = ["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block))].join('');
frontend.state.set_selection_start_block_BANG_(id);

return id;
} else {
return null;
}
}
});
frontend.state.get_cursor_range = (function frontend$state$get_cursor_range(){
return cljs.core.deref(new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_cursor_range_BANG_ = (function frontend$state$set_cursor_range_BANG_(range){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127),range);
});
frontend.state.set_search_mode_BANG_ = (function frontend$state$set_search_mode_BANG_(var_args){
var G__58306 = arguments.length;
switch (G__58306) {
case 1:
return frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (value){
return frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$2(value,null);
}));

(frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (value,args){
frontend.state.set_state_BANG_(new cljs.core.Keyword("search","mode","search/mode",1628111395),value);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("search","args","search/args",-462145864),args);
}));

(frontend.state.set_search_mode_BANG_.cljs$lang$maxFixedArity = 2);

frontend.state.set_editor_action_BANG_ = (function frontend$state$set_editor_action_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","action","editor/action",449993861),value);
});
frontend.state.set_editor_action_data_BANG_ = (function frontend$state$set_editor_action_data_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","action-data","editor/action-data",969703128),value);
});
frontend.state.get_editor_action = (function frontend$state$get_editor_action(){
return cljs.core.deref(new cljs.core.Keyword("editor","action","editor/action",449993861).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_editor_action_data = (function frontend$state$get_editor_action_data(){
return new cljs.core.Keyword("editor","action-data","editor/action-data",969703128).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_editor_show_page_search_QMARK_ = (function frontend$state$get_editor_show_page_search_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_editor_action(),new cljs.core.Keyword(null,"page-search","page-search",1842925280));
});
frontend.state.get_editor_show_page_search_hashtag_QMARK_ = (function frontend$state$get_editor_show_page_search_hashtag_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_editor_action(),new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
});
frontend.state.get_editor_show_block_search_QMARK_ = (function frontend$state$get_editor_show_block_search_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_editor_action(),new cljs.core.Keyword(null,"block-search","block-search",-897517253));
});
frontend.state.set_editor_show_input_BANG_ = (function frontend$state$set_editor_show_input_BANG_(value){
if(cljs.core.truth_(value)){
frontend.state.set_editor_action_data_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.state.get_editor_action_data(),new cljs.core.Keyword(null,"options","options",99638489),value));

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"input","input",556931961));
} else {
frontend.state.set_editor_action_BANG_(null);

return frontend.state.set_editor_action_data_BANG_(null);
}
});
frontend.state.get_editor_show_input = (function frontend$state$get_editor_show_input(){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_editor_action(),new cljs.core.Keyword(null,"input","input",556931961))){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("editor","action-data","editor/action-data",969703128));
} else {
return null;
}
});
frontend.state.set_editor_show_commands_BANG_ = (function frontend$state$set_editor_show_commands_BANG_(){
if(cljs.core.truth_(frontend.state.get_editor_action())){
return null;
} else {
return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"commands","commands",161008658));
}
});
frontend.state.clear_editor_action_BANG_ = (function frontend$state$clear_editor_action_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","action","editor/action",449993861),null);
});
frontend.state.get_edit_pos = (function frontend$state$get_edit_pos(){
var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return frontend.util.get_selection_start(input);
} else {
return null;
}
});
frontend.state.get_selection_direction = (function frontend$state$get_selection_direction(){
return cljs.core.deref(new cljs.core.Keyword("selection","direction","selection/direction",1172907345).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_unsorted_selection_blocks = (function frontend$state$get_unsorted_selection_blocks(){
return cljs.core.deref(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_selection_blocks = (function frontend$state$get_selection_blocks(){
var result = frontend.state.get_unsorted_selection_blocks();
var direction = frontend.state.get_selection_direction();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"up","up",-269712113))){
return cljs.core.vec(cljs.core.reverse(result));
} else {
return result;
}
});
frontend.state.get_selection_block_ids = (function frontend$state$get_selection_block_ids(){
return frontend.state.get_selected_block_ids(frontend.state.get_selection_blocks());
});
frontend.state.block_selected_flow = missionary.core.watch(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
frontend.state.sub_block_selected_QMARK_ = (function frontend$state$sub_block_selected_QMARK_(block_id){
if(cljs.core.uuid_QMARK_(block_id)){
} else {
throw (new Error("Assert failed: (uuid? block-id)"));
}

return frontend.state.sub_flow_state(frontend.state.block_selected_flow,new cljs.core.Keyword("selection","blocks","selection/blocks",638970019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),(function (blocks){
return cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([block_id]),frontend.state.get_selected_block_ids(blocks));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
});
frontend.state.dom_clear_selection_BANG_ = (function frontend$state$dom_clear_selection_BANG_(){
var seq__58347 = cljs.core.seq(dommy.utils.__GT_Array(document.getElementsByClassName("selected")));
var chunk__58349 = null;
var count__58350 = (0);
var i__58351 = (0);
while(true){
if((i__58351 < count__58350)){
var node = chunk__58349.cljs$core$IIndexed$_nth$arity$2(null,i__58351);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"selected");


var G__59372 = seq__58347;
var G__59373 = chunk__58349;
var G__59374 = count__58350;
var G__59375 = (i__58351 + (1));
seq__58347 = G__59372;
chunk__58349 = G__59373;
count__58350 = G__59374;
i__58351 = G__59375;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58347);
if(temp__5804__auto__){
var seq__58347__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58347__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58347__$1);
var G__59376 = cljs.core.chunk_rest(seq__58347__$1);
var G__59377 = c__5525__auto__;
var G__59378 = cljs.core.count(c__5525__auto__);
var G__59379 = (0);
seq__58347 = G__59376;
chunk__58349 = G__59377;
count__58350 = G__59378;
i__58351 = G__59379;
continue;
} else {
var node = cljs.core.first(seq__58347__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"selected");


var G__59380 = cljs.core.next(seq__58347__$1);
var G__59381 = null;
var G__59382 = (0);
var G__59383 = (0);
seq__58347 = G__59380;
chunk__58349 = G__59381;
count__58350 = G__59382;
i__58351 = G__59383;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.state.mark_dom_blocks_as_selected = (function frontend$state$mark_dom_blocks_as_selected(nodes){
var seq__58372 = cljs.core.seq(nodes);
var chunk__58373 = null;
var count__58374 = (0);
var i__58375 = (0);
while(true){
if((i__58375 < count__58374)){
var node = chunk__58373.cljs$core$IIndexed$_nth$arity$2(null,i__58375);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"selected");

if(dommy.core.has_class_QMARK_(node,"ls-table-row")){
node.focus();
} else {
}


var G__59385 = seq__58372;
var G__59386 = chunk__58373;
var G__59387 = count__58374;
var G__59388 = (i__58375 + (1));
seq__58372 = G__59385;
chunk__58373 = G__59386;
count__58374 = G__59387;
i__58375 = G__59388;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58372);
if(temp__5804__auto__){
var seq__58372__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58372__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58372__$1);
var G__59389 = cljs.core.chunk_rest(seq__58372__$1);
var G__59390 = c__5525__auto__;
var G__59391 = cljs.core.count(c__5525__auto__);
var G__59392 = (0);
seq__58372 = G__59389;
chunk__58373 = G__59390;
count__58374 = G__59391;
i__58375 = G__59392;
continue;
} else {
var node = cljs.core.first(seq__58372__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"selected");

if(dommy.core.has_class_QMARK_(node,"ls-table-row")){
node.focus();
} else {
}


var G__59394 = cljs.core.next(seq__58372__$1);
var G__59395 = null;
var G__59396 = (0);
var G__59397 = (0);
seq__58372 = G__59394;
chunk__58373 = G__59395;
count__58374 = G__59396;
i__58375 = G__59397;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.state.get_events_chan = (function frontend$state$get_events_chan(){
return new cljs.core.Keyword("system","events","system/events",-1178951588).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.pub_event_BANG_ = (function frontend$state$pub_event_BANG_(payload){
var d = promesa.core.deferred();
var chan = frontend.state.get_events_chan();
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(chan,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [payload,d], null));

return d;
});
frontend.state.set_selection_blocks_aux_BANG_ = (function frontend$state$set_selection_blocks_aux_BANG_(blocks){
frontend.state.set_state_BANG_(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027),null);

var selected_ids = cljs.core.set(frontend.state.get_selected_block_ids(cljs.core.deref(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))));
var _ = frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019),blocks);
var new_ids = cljs.core.set(frontend.state.get_selection_block_ids());
var removed = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(selected_ids,new_ids);
frontend.state.mark_dom_blocks_as_selected(blocks);

var seq__58406 = cljs.core.seq(removed);
var chunk__58408 = null;
var count__58409 = (0);
var i__58410 = (0);
while(true){
if((i__58410 < count__58409)){
var id = chunk__58408.cljs$core$IIndexed$_nth$arity$2(null,i__58410);
var seq__58457_59398 = cljs.core.seq(dommy.utils.__GT_Array(document.querySelectorAll(dommy.core.selector((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[blockid='%s']",id) : frontend.util.format.call(null,"[blockid='%s']",id))))));
var chunk__58458_59399 = null;
var count__58459_59400 = (0);
var i__58460_59401 = (0);
while(true){
if((i__58460_59401 < count__58459_59400)){
var node_59402 = chunk__58458_59399.cljs$core$IIndexed$_nth$arity$2(null,i__58460_59401);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_59402,"selected");

if(dommy.core.has_class_QMARK_(node_59402,"ls-table-row")){
node_59402.blur();
} else {
}


var G__59403 = seq__58457_59398;
var G__59404 = chunk__58458_59399;
var G__59405 = count__58459_59400;
var G__59406 = (i__58460_59401 + (1));
seq__58457_59398 = G__59403;
chunk__58458_59399 = G__59404;
count__58459_59400 = G__59405;
i__58460_59401 = G__59406;
continue;
} else {
var temp__5804__auto___59407 = cljs.core.seq(seq__58457_59398);
if(temp__5804__auto___59407){
var seq__58457_59409__$1 = temp__5804__auto___59407;
if(cljs.core.chunked_seq_QMARK_(seq__58457_59409__$1)){
var c__5525__auto___59410 = cljs.core.chunk_first(seq__58457_59409__$1);
var G__59411 = cljs.core.chunk_rest(seq__58457_59409__$1);
var G__59412 = c__5525__auto___59410;
var G__59413 = cljs.core.count(c__5525__auto___59410);
var G__59414 = (0);
seq__58457_59398 = G__59411;
chunk__58458_59399 = G__59412;
count__58459_59400 = G__59413;
i__58460_59401 = G__59414;
continue;
} else {
var node_59415 = cljs.core.first(seq__58457_59409__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_59415,"selected");

if(dommy.core.has_class_QMARK_(node_59415,"ls-table-row")){
node_59415.blur();
} else {
}


var G__59416 = cljs.core.next(seq__58457_59409__$1);
var G__59417 = null;
var G__59418 = (0);
var G__59419 = (0);
seq__58457_59398 = G__59416;
chunk__58458_59399 = G__59417;
count__58459_59400 = G__59418;
i__58460_59401 = G__59419;
continue;
}
} else {
}
}
break;
}


var G__59421 = seq__58406;
var G__59422 = chunk__58408;
var G__59423 = count__58409;
var G__59424 = (i__58410 + (1));
seq__58406 = G__59421;
chunk__58408 = G__59422;
count__58409 = G__59423;
i__58410 = G__59424;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58406);
if(temp__5804__auto__){
var seq__58406__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58406__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58406__$1);
var G__59425 = cljs.core.chunk_rest(seq__58406__$1);
var G__59426 = c__5525__auto__;
var G__59427 = cljs.core.count(c__5525__auto__);
var G__59428 = (0);
seq__58406 = G__59425;
chunk__58408 = G__59426;
count__58409 = G__59427;
i__58410 = G__59428;
continue;
} else {
var id = cljs.core.first(seq__58406__$1);
var seq__58476_59429 = cljs.core.seq(dommy.utils.__GT_Array(document.querySelectorAll(dommy.core.selector((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[blockid='%s']",id) : frontend.util.format.call(null,"[blockid='%s']",id))))));
var chunk__58477_59430 = null;
var count__58478_59431 = (0);
var i__58479_59432 = (0);
while(true){
if((i__58479_59432 < count__58478_59431)){
var node_59433 = chunk__58477_59430.cljs$core$IIndexed$_nth$arity$2(null,i__58479_59432);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_59433,"selected");

if(dommy.core.has_class_QMARK_(node_59433,"ls-table-row")){
node_59433.blur();
} else {
}


var G__59434 = seq__58476_59429;
var G__59435 = chunk__58477_59430;
var G__59436 = count__58478_59431;
var G__59437 = (i__58479_59432 + (1));
seq__58476_59429 = G__59434;
chunk__58477_59430 = G__59435;
count__58478_59431 = G__59436;
i__58479_59432 = G__59437;
continue;
} else {
var temp__5804__auto___59438__$1 = cljs.core.seq(seq__58476_59429);
if(temp__5804__auto___59438__$1){
var seq__58476_59439__$1 = temp__5804__auto___59438__$1;
if(cljs.core.chunked_seq_QMARK_(seq__58476_59439__$1)){
var c__5525__auto___59440 = cljs.core.chunk_first(seq__58476_59439__$1);
var G__59441 = cljs.core.chunk_rest(seq__58476_59439__$1);
var G__59442 = c__5525__auto___59440;
var G__59443 = cljs.core.count(c__5525__auto___59440);
var G__59444 = (0);
seq__58476_59429 = G__59441;
chunk__58477_59430 = G__59442;
count__58478_59431 = G__59443;
i__58479_59432 = G__59444;
continue;
} else {
var node_59445 = cljs.core.first(seq__58476_59439__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_59445,"selected");

if(dommy.core.has_class_QMARK_(node_59445,"ls-table-row")){
node_59445.blur();
} else {
}


var G__59446 = cljs.core.next(seq__58476_59439__$1);
var G__59447 = null;
var G__59448 = (0);
var G__59449 = (0);
seq__58476_59429 = G__59446;
chunk__58477_59430 = G__59447;
count__58478_59431 = G__59448;
i__58479_59432 = G__59449;
continue;
}
} else {
}
}
break;
}


var G__59450 = cljs.core.next(seq__58406__$1);
var G__59451 = null;
var G__59452 = (0);
var G__59453 = (0);
seq__58406 = G__59450;
chunk__58408 = G__59451;
count__58409 = G__59452;
i__58410 = G__59453;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.state.set_selection_blocks_BANG_ = (function frontend$state$set_selection_blocks_BANG_(var_args){
var G__58497 = arguments.length;
switch (G__58497) {
case 1:
return frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (blocks){
return frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks,null);
}));

(frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (blocks,direction){
if(cljs.core.seq(blocks)){
var blocks__$1 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks));
frontend.state.set_selection_blocks_aux_BANG_(blocks__$1);

if(cljs.core.truth_(direction)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","direction","selection/direction",1172907345),direction);
} else {
}

var ids = frontend.state.get_selection_block_ids();
if(cljs.core.seq(ids)){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","load-blocks","editor/load-blocks",428173962),ids], null));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.state.set_selection_blocks_BANG_.cljs$lang$maxFixedArity = 2);

frontend.state.state_clear_selection_BANG_ = (function frontend$state$state_clear_selection_BANG_(){
frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","direction","selection/direction",1172907345),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","start-block","selection/start-block",-832131492),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","selected-all?","selection/selected-all?",208605839),false);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
});
frontend.state.clear_selection_BANG_ = (function frontend$state$clear_selection_BANG_(){
frontend.state.dom_clear_selection_BANG_();

return frontend.state.state_clear_selection_BANG_();
});
frontend.state.get_selection_start_block_or_first = (function frontend$state$get_selection_start_block_or_first(){
var or__5002__auto__ = frontend.state.get_selection_start_block();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__58515 = cljs.core.first(frontend.state.get_selection_blocks());
if((G__58515 == null)){
return null;
} else {
return frontend.state.goog$module$goog$object.get(G__58515,"id");
}
}
});
/**
 * True sense of selection mode with valid selected block
 */
frontend.state.selection_QMARK_ = (function frontend$state$selection_QMARK_(){
return cljs.core.seq(frontend.state.get_selection_blocks());
});
frontend.state.conj_selection_block_BANG_ = (function frontend$state$conj_selection_block_BANG_(var_args){
var G__58518 = arguments.length;
switch (G__58518) {
case 1:
return frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (block_or_blocks){
return frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(block_or_blocks,frontend.state.get_selection_direction());
}));

(frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block_or_blocks,direction){
var selection_blocks = frontend.state.get_unsorted_selection_blocks();
var block_or_blocks__$1 = ((cljs.core.sequential_QMARK_(block_or_blocks))?block_or_blocks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_or_blocks], null));
var blocks = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(selection_blocks,block_or_blocks__$1));
return frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks,direction);
}));

(frontend.state.conj_selection_block_BANG_.cljs$lang$maxFixedArity = 2);

frontend.state.drop_selection_block_BANG_ = (function frontend$state$drop_selection_block_BANG_(block){
return frontend.state.set_selection_blocks_aux_BANG_(cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58535_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block.id,p1__58535_SHARP_.id);
}),frontend.state.get_unsorted_selection_blocks())));
});
frontend.state.drop_selection_blocks_starts_with_BANG_ = (function frontend$state$drop_selection_blocks_starts_with_BANG_(block){
var blocks = frontend.state.get_unsorted_selection_blocks();
var blocks_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(b.id,block.id);
}),blocks)),block);
return frontend.state.set_selection_blocks_aux_BANG_(blocks_SINGLEQUOTE_);
});
frontend.state.drop_last_selection_block_BANG_ = (function frontend$state$drop_last_selection_block_BANG_(){
var blocks = cljs.core.deref(new cljs.core.Keyword("selection","blocks","selection/blocks",638970019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var blocks_SINGLEQUOTE_ = cljs.core.vec(cljs.core.butlast(blocks));
frontend.state.set_selection_blocks_aux_BANG_(blocks_SINGLEQUOTE_);

return cljs.core.last(blocks);
});
frontend.state.hide_custom_context_menu_BANG_ = (function frontend$state$hide_custom_context_menu_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("custom-context-menu","show?","custom-context-menu/show?",2074408902),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("custom-context-menu","links","custom-context-menu/links",-1197608677),null,new cljs.core.Keyword("custom-context-menu","position","custom-context-menu/position",666089423),null], 0));
});
frontend.state.toggle_navigation_item_collapsed_BANG_ = (function frontend$state$toggle_navigation_item_collapsed_BANG_(item){
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","navigation-item-collapsed?","ui/navigation-item-collapsed?",-1247120960),item], null),cljs.core.not);
});
frontend.state.toggle_sidebar_open_QMARK__BANG_ = (function frontend$state$toggle_sidebar_open_QMARK__BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update,new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),cljs.core.not);
});
frontend.state.open_right_sidebar_BANG_ = (function frontend$state$open_right_sidebar_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),true);
});
frontend.state.hide_right_sidebar_BANG_ = (function frontend$state$hide_right_sidebar_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),false);
});
frontend.state.sidebar_move_block_BANG_ = (function frontend$state$sidebar_move_block_BANG_(from,to){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (blocks){
var to__$1 = (((from > to))?(to + (1)):to);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(to__$1,from)){
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,from);
var blocks__$1 = cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (p1__58555_SHARP_,p2__58556_SHARP_){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p1__58555_SHARP_,from)){
return p2__58556_SHARP_;
} else {
return null;
}
}),blocks);
var vec__58557 = cljs.core.split_at(to__$1,blocks__$1);
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58557,(0),null);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58557,(1),null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(l,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [item], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([r], 0));
} else {
return blocks;
}
}));
});
frontend.state.sidebar_remove_block_BANG_ = (function frontend$state$sidebar_remove_block_BANG_(idx){
frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (blocks){
if(typeof idx === 'string'){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58561_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(p1__58561_SHARP_),idx);
}),blocks);
} else {
return frontend.util.drop_nth(idx,blocks);
}
}));

if(cljs.core.empty_QMARK_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return frontend.state.hide_right_sidebar_BANG_();
} else {
return null;
}
});
frontend.state.sidebar_remove_deleted_block_BANG_ = (function frontend$state$sidebar_remove_deleted_block_BANG_(ids){
var ids_set = cljs.core.set(ids);
frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (items){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__58581){
var vec__58582 = p__58581;
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58582,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58582,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58582,(2),null);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,frontend.state.get_current_repo())) && (cljs.core.contains_QMARK_(ids_set,id)));
}),items);
}));

if(cljs.core.empty_QMARK_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return frontend.state.hide_right_sidebar_BANG_();
} else {
return null;
}
});
frontend.state.sidebar_remove_rest_BANG_ = (function frontend$state$sidebar_remove_rest_BANG_(db_id){
frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (blocks){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58588_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(p1__58588_SHARP_),db_id);
}),blocks);
}));

return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),db_id], null),false);
});
frontend.state.sidebar_replace_block_BANG_ = (function frontend$state$sidebar_replace_block_BANG_(old_sidebar_key,new_sidebar_key){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (blocks){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58589_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__58589_SHARP_,old_sidebar_key)){
return new_sidebar_key;
} else {
return p1__58589_SHARP_;
}
}),blocks);
}));
});
frontend.state.sidebar_block_exists_QMARK_ = (function frontend$state$sidebar_block_exists_QMARK_(idx){
return cljs.core.some((function (p1__58590_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(p1__58590_SHARP_),idx);
}),new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.clear_sidebar_blocks_BANG_ = (function frontend$state$clear_sidebar_blocks_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),cljs.core.List.EMPTY);
});
frontend.state.sidebar_block_toggle_collapse_BANG_ = (function frontend$state$sidebar_block_toggle_collapse_BANG_(db_id){
if(cljs.core.truth_(db_id)){
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),db_id], null),cljs.core.not);
} else {
return null;
}
});
frontend.state.sidebar_block_collapse_rest_BANG_ = (function frontend$state$sidebar_block_collapse_rest_BANG_(db_id){
var items = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))),db_id);
var seq__58595 = cljs.core.seq(items);
var chunk__58596 = null;
var count__58597 = (0);
var i__58598 = (0);
while(true){
if((i__58598 < count__58597)){
var item = chunk__58596.cljs$core$IIndexed$_nth$arity$2(null,i__58598);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),item], null),true);


var G__59461 = seq__58595;
var G__59462 = chunk__58596;
var G__59463 = count__58597;
var G__59464 = (i__58598 + (1));
seq__58595 = G__59461;
chunk__58596 = G__59462;
count__58597 = G__59463;
i__58598 = G__59464;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58595);
if(temp__5804__auto__){
var seq__58595__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58595__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58595__$1);
var G__59466 = cljs.core.chunk_rest(seq__58595__$1);
var G__59467 = c__5525__auto__;
var G__59468 = cljs.core.count(c__5525__auto__);
var G__59469 = (0);
seq__58595 = G__59466;
chunk__58596 = G__59467;
count__58597 = G__59468;
i__58598 = G__59469;
continue;
} else {
var item = cljs.core.first(seq__58595__$1);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),item], null),true);


var G__59470 = cljs.core.next(seq__58595__$1);
var G__59471 = null;
var G__59472 = (0);
var G__59473 = (0);
seq__58595 = G__59470;
chunk__58596 = G__59471;
count__58597 = G__59472;
i__58598 = G__59473;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.state.sidebar_block_set_collapsed_all_BANG_ = (function frontend$state$sidebar_block_set_collapsed_all_BANG_(collapsed_QMARK_){
var items = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var seq__58612 = cljs.core.seq(items);
var chunk__58613 = null;
var count__58614 = (0);
var i__58615 = (0);
while(true){
if((i__58615 < count__58614)){
var item = chunk__58613.cljs$core$IIndexed$_nth$arity$2(null,i__58615);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),item], null),collapsed_QMARK_);


var G__59476 = seq__58612;
var G__59477 = chunk__58613;
var G__59478 = count__58614;
var G__59479 = (i__58615 + (1));
seq__58612 = G__59476;
chunk__58613 = G__59477;
count__58614 = G__59478;
i__58615 = G__59479;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58612);
if(temp__5804__auto__){
var seq__58612__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58612__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58612__$1);
var G__59480 = cljs.core.chunk_rest(seq__58612__$1);
var G__59481 = c__5525__auto__;
var G__59482 = cljs.core.count(c__5525__auto__);
var G__59483 = (0);
seq__58612 = G__59480;
chunk__58613 = G__59481;
count__58614 = G__59482;
i__58615 = G__59483;
continue;
} else {
var item = cljs.core.first(seq__58612__$1);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),item], null),collapsed_QMARK_);


var G__59485 = cljs.core.next(seq__58612__$1);
var G__59486 = null;
var G__59487 = (0);
var G__59488 = (0);
seq__58612 = G__59485;
chunk__58613 = G__59486;
count__58614 = G__59487;
i__58615 = G__59488;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.state.clear_editor_last_pos_BANG_ = (function frontend$state$clear_editor_last_pos_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","last-saved-cursor","editor/last-saved-cursor",-284040435),cljs.core.PersistentArrayMap.EMPTY);
});
frontend.state.clear_cursor_range_BANG_ = (function frontend$state$clear_cursor_range_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127),null);
});
frontend.state.clear_edit_BANG_ = (function frontend$state$clear_edit_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59489 = arguments.length;
var i__5727__auto___59490 = (0);
while(true){
if((i__5727__auto___59490 < len__5726__auto___59489)){
args__5732__auto__.push((arguments[i__5727__auto___59490]));

var G__59491 = (i__5727__auto___59490 + (1));
i__5727__auto___59490 = G__59491;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.state.clear_edit_BANG_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.state.clear_edit_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__58627){
var map__58629 = p__58627;
var map__58629__$1 = cljs.core.__destructure_map(map__58629);
var clear_editing_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__58629__$1,new cljs.core.Keyword(null,"clear-editing-block?","clear-editing-block?",901540541),true);
frontend.state.clear_editor_action_BANG_();

if(cljs.core.truth_(clear_editing_block_QMARK_)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","editing?","editor/editing?",807325417),cljs.core.PersistentArrayMap.EMPTY);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block","editor/block",1699377461),null);
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537),null);

frontend.state.clear_editor_last_pos_BANG_();

frontend.state.clear_cursor_range_BANG_();

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","content","editor/content",-756190443),cljs.core.PersistentArrayMap.EMPTY);

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","select-query-cache","ui/select-query-cache",-103472992),cljs.core.PersistentArrayMap.EMPTY);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855),cljs.core.PersistentHashSet.EMPTY);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","action-data","editor/action-data",969703128),null);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027),null);
}));

(frontend.state.clear_edit_BANG_.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.state.clear_edit_BANG_.cljs$lang$applyTo = (function (seq58620){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq58620));
}));

frontend.state.into_code_editor_mode_BANG_ = (function frontend$state$into_code_editor_mode_BANG_(){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127),null);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("editor","code-mode?","editor/code-mode?",1404453234),true);
});
frontend.state.set_editor_last_pos_BANG_ = (function frontend$state$set_editor_last_pos_BANG_(new_pos){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","last-saved-cursor","editor/last-saved-cursor",-284040435),(function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()),new_pos);
}));
});
frontend.state.get_editor_last_pos = (function frontend$state$get_editor_last_pos(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword("editor","last-saved-cursor","editor/last-saved-cursor",-284040435).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
});
frontend.state.set_block_content_and_last_pos_BANG_ = (function frontend$state$set_block_content_and_last_pos_BANG_(edit_input_id,content,new_pos){
if(cljs.core.truth_(edit_input_id)){
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_input_id,content);

return frontend.state.set_editor_last_pos_BANG_(new_pos);
} else {
return null;
}
});
frontend.state.set_theme_mode_BANG_ = (function frontend$state$set_theme_mode_BANG_(mode){
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,"light")){
frontend.util.set_theme_light();
} else {
frontend.util.set_theme_dark();
}
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132),mode);

return frontend.storage.set(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132),mode);
});
frontend.state.sync_system_theme_BANG_ = (function frontend$state$sync_system_theme_BANG_(){
var system_dark_QMARK_ = window.matchMedia("(prefers-color-scheme: dark)").matches;
frontend.state.set_theme_mode_BANG_((cljs.core.truth_(system_dark_QMARK_)?"dark":"light"));

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822),true);

return frontend.storage.set(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822),true);
});
frontend.state.use_theme_mode_BANG_ = (function frontend$state$use_theme_mode_BANG_(theme_mode){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme_mode,"system")){
return frontend.state.sync_system_theme_BANG_();
} else {
frontend.state.set_theme_mode_BANG_(theme_mode);

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822),false);

return frontend.storage.set(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822),false);
}
});
frontend.state.toggle_theme = (function frontend$state$toggle_theme(theme){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme,"dark")){
return "light";
} else {
return "dark";
}
});
frontend.state.toggle_theme_BANG_ = (function frontend$state$toggle_theme_BANG_(){
return frontend.state.use_theme_mode_BANG_(frontend.state.toggle_theme(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
});
frontend.state.set_custom_theme_BANG_ = (function frontend$state$set_custom_theme_BANG_(var_args){
var G__58676 = arguments.length;
switch (G__58676) {
case 1:
return frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (custom_theme){
return frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$2(null,custom_theme);
}));

(frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (mode,theme){
frontend.state.set_state_BANG_((cljs.core.truth_(mode)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(mode)], null):new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347)),theme);

return frontend.storage.set(new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347),new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
}));

(frontend.state.set_custom_theme_BANG_.cljs$lang$maxFixedArity = 2);

/**
 * Restore mobile theme setting from local storage
 */
frontend.state.restore_mobile_theme_BANG_ = (function frontend$state$restore_mobile_theme_BANG_(){
var mode = (function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "light";
}
})();
var system_theme_QMARK_ = frontend.storage.get(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(system_theme_QMARK_);
if(and__5000__auto__){
return frontend.mobile.util.native_platform_QMARK_();
} else {
return and__5000__auto__;
}
})())){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,"light")){
return frontend.util.set_theme_light();
} else {
return frontend.util.set_theme_dark();
}
} else {
return null;
}
});
frontend.state.set_editing_block_dom_id_BANG_ = (function frontend$state$set_editing_block_dom_id_BANG_(block_dom_id){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block-dom-id","editor/block-dom-id",208740398),block_dom_id);
});
frontend.state.get_editing_block_dom_id = (function frontend$state$get_editing_block_dom_id(){
return cljs.core.deref(new cljs.core.Keyword("editor","block-dom-id","editor/block-dom-id",208740398).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_root_component_BANG_ = (function frontend$state$set_root_component_BANG_(component){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","root-component","ui/root-component",-1807033247),component);
});
frontend.state.get_root_component = (function frontend$state$get_root_component(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("ui","root-component","ui/root-component",-1807033247));
});
frontend.state.load_app_user_cfgs = (function frontend$state$load_app_user_cfgs(var_args){
var G__58713 = arguments.length;
switch (G__58713) {
case 0:
return frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$1(false);
}));

(frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$1 = (function (refresh_QMARK_){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = refresh_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)) == null);
}
})())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350)], 0)):new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))),(function (cfgs){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.object_QMARK_(cfgs))?cljs_bean.core.__GT_clj(cfgs):cfgs)),(function (cfgs__$1){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),cfgs__$1));
}));
}));
}));
} else {
return null;
}
}));

(frontend.state.load_app_user_cfgs.cljs$lang$maxFixedArity = 1);

frontend.state.setup_electron_updater_BANG_ = (function frontend$state$setup_electron_updater_BANG_(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return window.apis.setUpdatesCallback((function (_,args){
var data = cljs_bean.core.__GT_clj(args);
var pending_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(data),"completed");
frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","updater-pending?","electron/updater-pending?",-1675811595),pending_QMARK_);

if(pending_QMARK_){
frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","updater","electron/updater",454456683),data);
} else {
}

return null;
}));
} else {
return null;
}
});
frontend.state.set_file_component_BANG_ = (function frontend$state$set_file_component_BANG_(component){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","file-component","ui/file-component",-1447074212),component);
});
frontend.state.clear_file_component_BANG_ = (function frontend$state$clear_file_component_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","file-component","ui/file-component",-1447074212),null);
});
frontend.state.save_scroll_position_BANG_ = (function frontend$state$save_scroll_position_BANG_(var_args){
var G__58744 = arguments.length;
switch (G__58744) {
case 1:
return frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (value){
return frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$2(value,window.location.hash);
}));

(frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (value,path){
return frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("ui","paths-scroll-positions","ui/paths-scroll-positions",1953998950),value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),path], 0));
}));

(frontend.state.save_scroll_position_BANG_.cljs$lang$maxFixedArity = 2);

frontend.state.save_main_container_position_BANG_ = (function frontend$state$save_main_container_position_BANG_(value){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(value,cljs.core.deref(new cljs.core.Keyword("ui","main-container-scroll-top","ui/main-container-scroll-top",1193942851).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","main-container-scroll-top","ui/main-container-scroll-top",1193942851),value);
} else {
return null;
}
});
frontend.state.get_saved_scroll_position = (function frontend$state$get_saved_scroll_position(var_args){
var G__58761 = arguments.length;
switch (G__58761) {
case 0:
return frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$1(window.location.hash);
}));

(frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$1 = (function (path){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("ui","paths-scroll-positions","ui/paths-scroll-positions",1953998950))),path,(0));
}));

(frontend.state.get_saved_scroll_position.cljs$lang$maxFixedArity = 1);

frontend.state.set_today_BANG_ = (function frontend$state$set_today_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword(null,"today","today",945271563),value);
});
frontend.state.get_me = (function frontend$state$get_me(){
return new cljs.core.Keyword(null,"me","me",-139006693).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_db_restoring_BANG_ = (function frontend$state$set_db_restoring_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233),value);
});
frontend.state.set_indexedb_support_BANG_ = (function frontend$state$set_indexedb_support_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("indexeddb","support?","indexeddb/support?",114020185),value);
});
frontend.state.modal_opened_QMARK_ = (function frontend$state$modal_opened_QMARK_(){
return logseq.shui.dialog.core.has_modal_QMARK_();
});
frontend.state.close_modal_BANG_ = (function frontend$state$close_modal_BANG_(){
return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
});
frontend.state.get_reactive_custom_queries_chan = (function frontend$state$get_reactive_custom_queries_chan(){
return new cljs.core.Keyword("reactive","custom-queries","reactive/custom-queries",-213333931).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_left_sidebar_open_QMARK_ = (function frontend$state$get_left_sidebar_open_QMARK_(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728)], null));
});
frontend.state.set_left_sidebar_open_BANG_ = (function frontend$state$set_left_sidebar_open_BANG_(value){
frontend.storage.set("ls-left-sidebar-open?",cljs.core.boolean$(value));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728),value);
});
frontend.state.toggle_left_sidebar_BANG_ = (function frontend$state$toggle_left_sidebar_BANG_(){
return frontend.state.set_left_sidebar_open_BANG_(cljs.core.not(frontend.state.get_left_sidebar_open_QMARK_()));
});
frontend.state.set_developer_mode_BANG_ = (function frontend$state$set_developer_mode_BANG_(value){
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878),value);

return frontend.storage.set("developer-mode",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
});
frontend.state.developer_mode_QMARK_ = (function frontend$state$developer_mode_QMARK_(){
return new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_notification_contents = (function frontend$state$get_notification_contents(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("notification","contents","notification/contents",-1760740618));
});
frontend.state.document_mode_QMARK_ = (function frontend$state$document_mode_QMARK_(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("document","mode?","document/mode?",-994203479));
});
frontend.state.toggle_document_mode_BANG_ = (function frontend$state$toggle_document_mode_BANG_(){
var mode = frontend.state.document_mode_QMARK_();
frontend.state.set_state_BANG_(new cljs.core.Keyword("document","mode?","document/mode?",-994203479),cljs.core.not(mode));

return frontend.storage.set(new cljs.core.Keyword("document","mode?","document/mode?",-994203479),cljs.core.not(mode));
});
frontend.state.toggle_highlight_recent_blocks_BANG_ = (function frontend$state$toggle_highlight_recent_blocks_BANG_(){
var value = cljs.core.deref(new cljs.core.Keyword("ui","toggle-highlight-recent-blocks?","ui/toggle-highlight-recent-blocks?",261743188).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","toggle-highlight-recent-blocks?","ui/toggle-highlight-recent-blocks?",261743188),cljs.core.not(value));
});
frontend.state.shortcut_tooltip_enabled_QMARK_ = (function frontend$state$shortcut_tooltip_enabled_QMARK_(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086));
});
frontend.state.toggle_shortcut_tooltip_BANG_ = (function frontend$state$toggle_shortcut_tooltip_BANG_(){
var mode = frontend.state.shortcut_tooltip_enabled_QMARK_();
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086),cljs.core.not(mode));

return frontend.storage.set(new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086),cljs.core.not(mode));
});
frontend.state.set_config_BANG_ = (function frontend$state$set_config_BANG_(repo_url,value){
if(cljs.core.truth_(value)){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),repo_url], null),value);
} else {
return null;
}
});
frontend.state.set_global_config_BANG_ = (function frontend$state$set_global_config_BANG_(value,str_content){
if(cljs.core.truth_(value)){
frontend.state.set_config_BANG_(new cljs.core.Keyword("frontend.state","global-config","frontend.state/global-config",1533356),value);

return frontend.state.set_config_BANG_(new cljs.core.Keyword("frontend.state","global-config-str-content","frontend.state/global-config-str-content",-1141146708),str_content);
} else {
return null;
}
});
frontend.state.get_wide_mode_QMARK_ = (function frontend$state$get_wide_mode_QMARK_(){
return new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.toggle_wide_mode_BANG_ = (function frontend$state$toggle_wide_mode_BANG_(){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061),cljs.core.not);
});
frontend.state.set_online_BANG_ = (function frontend$state$set_online_BANG_(value){
frontend.state.set_state_BANG_(new cljs.core.Keyword("network","online?","network/online?",1306822774),value);

return cljs.core.reset_BANG_(frontend.flows._STAR_network_online_QMARK_,value);
});
frontend.state.get_plugins_slash_commands = (function frontend$state$get_plugins_slash_commands(){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.flatten(cljs.core.vals(new cljs.core.Keyword("plugin","installed-slash-commands","plugin/installed-slash-commands",-58447235).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))], 0));
});
frontend.state.get_plugins_commands_with_type = (function frontend$state$get_plugins_commands_with_type(type){
return cljs.core.filterv((function (p1__58817_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(p1__58817_SHARP_)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type));
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.vals(new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))));
});
frontend.state.get_plugins_ui_items_with_type = (function frontend$state$get_plugins_ui_items_with_type(type){
return cljs.core.filterv((function (p1__58818_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(p1__58818_SHARP_)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type));
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.vals(new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))));
});
frontend.state.get_plugin_resources_with_type = (function frontend$state$get_plugin_resources_with_type(pid,type){
var temp__5804__auto__ = (function (){var and__5000__auto__ = type;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-resources","plugin/installed-resources",-1742961043),pid__$1,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type)], null));
} else {
return null;
}
});
frontend.state.get_plugin_resource = (function frontend$state$get_plugin_resource(pid,type,key){
var temp__5804__auto__ = frontend.state.get_plugin_resources_with_type(pid,type);
if(cljs.core.truth_(temp__5804__auto__)){
var resources = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(resources,key);
} else {
return null;
}
});
frontend.state.upt_plugin_resource = (function frontend$state$upt_plugin_resource(pid,type,key,attr,val){
var temp__5804__auto__ = frontend.state.get_plugin_resource(pid,type,key);
if(cljs.core.truth_(temp__5804__auto__)){
var resource = temp__5804__auto__;
var resource__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(resource,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(attr),val);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-resources","plugin/installed-resources",-1742961043),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),key], null),resource__$1);

return resource__$1;
} else {
return null;
}
});
frontend.state.get_plugin_services = (function frontend$state$get_plugin_services(pid,type){
var temp__5804__auto__ = (function (){var and__5000__auto__ = pid;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var installed = temp__5804__auto__;
var G__58843 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$2(installed,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid)));
if((G__58843 == null)){
return null;
} else {
return cljs.core.filterv((function (p1__58842_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__58842_SHARP_));
}),G__58843);
}
} else {
return null;
}
});
frontend.state.install_plugin_service = (function frontend$state$install_plugin_service(var_args){
var G__58847 = arguments.length;
switch (G__58847) {
case 3:
return frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$3 = (function (pid,type,name){
return frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$4(pid,type,name,null);
}));

(frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$4 = (function (pid,type,name,opts){
var temp__5804__auto__ = (function (){var and__5000__auto__ = pid;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = type;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = name;
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
var exists = frontend.state.get_plugin_services(pid__$1,type);
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = ((cljs.core.not(exists)) || (cljs.core.not(cljs.core.some((function (p1__58844_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__58844_SHARP_));
}),exists))));
if(and__5000__auto__){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"pid","pid",1018387698),pid__$1,new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"opts","opts",155075701),opts], null);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var service = temp__5804__auto____$1;
frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696),pid__$1], null),(function (p1__58845_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(p1__58845_SHARP_),service);
}));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"search","search",1564939822))){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("search","engines","search/engines",-1270836455),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('')], null),service);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.state.install_plugin_service.cljs$lang$maxFixedArity = 4);

frontend.state.uninstall_plugin_service = (function frontend$state$uninstall_plugin_service(pid,type_or_all){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),pid__$1);
if(cljs.core.truth_(temp__5804__auto____$1)){
var installed = temp__5804__auto____$1;
var remove_all_QMARK_ = ((type_or_all === true) || ((type_or_all == null)));
var remains = ((remove_all_QMARK_)?null:cljs.core.filterv((function (p1__58863_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(type_or_all,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__58863_SHARP_));
}),installed));
var removed = ((remove_all_QMARK_)?installed:cljs.core.filterv((function (p1__58864_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type_or_all,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__58864_SHARP_));
}),installed));
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696),pid__$1], null),remains);

var temp__5804__auto____$2 = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__58865_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"search","search",1564939822),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__58865_SHARP_));
}),removed));
if(temp__5804__auto____$2){
var removed_SINGLEQUOTE_ = temp__5804__auto____$2;
return frontend.state.update_state_BANG_(new cljs.core.Keyword("search","engines","search/engines",-1270836455),(function (p1__58866_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,p1__58866_SHARP_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__58871){
var map__58872 = p__58871;
var map__58872__$1 = cljs.core.__destructure_map(map__58872);
var pid__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58872__$1,new cljs.core.Keyword(null,"pid","pid",1018387698));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58872__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid__$2),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
}),removed_SINGLEQUOTE_));
}));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.state.get_all_plugin_services_with_type = (function frontend$state$get_all_plugin_services_with_type(type){
var temp__5804__auto__ = cljs.core.vals(new cljs.core.Keyword("plugin","installed-services","plugin/installed-services",-1672478696).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
if(cljs.core.truth_(temp__5804__auto__)){
var installed = temp__5804__auto__;
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (s){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__58873_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__58873_SHARP_));
}),s);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([installed], 0));
} else {
return null;
}
});
frontend.state.get_all_plugin_search_engines = (function frontend$state$get_all_plugin_search_engines(){
return new cljs.core.Keyword("search","engines","search/engines",-1270836455).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.update_plugin_search_engine = (function frontend$state$update_plugin_search_engine(pid,name,f){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
return frontend.state.set_state_BANG_(new cljs.core.Keyword("search","engines","search/engines",-1270836455),cljs.core.update_vals(frontend.state.get_all_plugin_search_engines(),(function (p1__58874_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(pid__$1,new cljs.core.Keyword(null,"pid","pid",1018387698).cljs$core$IFn$_invoke$arity$1(p1__58874_SHARP_))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__58874_SHARP_))))){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__58874_SHARP_) : f.call(null,p1__58874_SHARP_));
} else {
return p1__58874_SHARP_;
}
})));
} else {
return null;
}
});
frontend.state.reset_plugin_search_engines = (function frontend$state$reset_plugin_search_engines(){
var temp__5804__auto__ = frontend.state.get_all_plugin_search_engines();
if(cljs.core.truth_(temp__5804__auto__)){
var engines = temp__5804__auto__;
return frontend.state.set_state_BANG_(new cljs.core.Keyword("search","engines","search/engines",-1270836455),cljs.core.update_vals(engines,(function (p1__58878_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__58878_SHARP_,new cljs.core.Keyword(null,"result","result",1415092211),null);
})));
} else {
return null;
}
});
frontend.state.install_plugin_hook = (function frontend$state$install_plugin_hook(var_args){
var G__58884 = arguments.length;
switch (G__58884) {
case 2:
return frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$2 = (function (pid,hook){
return frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$3(pid,hook,true);
}));

(frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$3 = (function (pid,hook,opts){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),hook], null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.PersistentArrayMap.EMPTY)(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),hook], null))),pid__$1,opts));

return true;
} else {
return null;
}
}));

(frontend.state.install_plugin_hook.cljs$lang$maxFixedArity = 3);

frontend.state.uninstall_plugin_hook = (function frontend$state$uninstall_plugin_hook(pid,hook_or_all){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
if((hook_or_all == null)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.update,new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),(function (p1__58889_SHARP_){
return cljs.core.update_vals(p1__58889_SHARP_,(function (ids){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(ids,pid__$1);
}));
}));
} else {
var temp__5804__auto___59539__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),hook_or_all], null));
if(cljs.core.truth_(temp__5804__auto___59539__$1)){
var coll_59541 = temp__5804__auto___59539__$1;
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271),hook_or_all], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(coll_59541,pid__$1));
} else {
}
}

return true;
} else {
return null;
}
});
frontend.state.slot_hook_exist_QMARK_ = (function frontend$state$slot_hook_exist_QMARK_(uuid){
var temp__5804__auto__ = (function (){var and__5000__auto__ = uuid;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),"-","_");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var type = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.state.sub(new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271));
if(cljs.core.truth_(temp__5804__auto____$1)){
var hooks = temp__5804__auto____$1;
return cljs.core.contains_QMARK_(hooks,["hook:editor:slot_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(type)].join(''));
} else {
return null;
}
} else {
return null;
}
});
frontend.state.active_tldraw_app = (function frontend$state$active_tldraw_app(){
var temp__5804__auto__ = document.body.querySelector(".logseq-tldraw[data-tlapp]");
if(cljs.core.truth_(temp__5804__auto__)){
var tldraw_el = temp__5804__auto__;
return frontend.state.goog$module$goog$object.get(window.tlapps,tldraw_el.dataset.tlapp);
} else {
return null;
}
});
frontend.state.tldraw_editing_logseq_block_QMARK_ = (function frontend$state$tldraw_editing_logseq_block_QMARK_(){
var temp__5804__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(temp__5804__auto__)){
var app = temp__5804__auto__;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),app.selectedShapesArray.length)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(app.editingShape,app.selectedShapesArray.at((0)))));
} else {
return null;
}
});
frontend.state.set_graph_syncing_QMARK_ = (function frontend$state$set_graph_syncing_QMARK_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","syncing?","graph/syncing?",-560055838),value);
});
frontend.state.set_editor_in_composition_BANG_ = (function frontend$state$set_editor_in_composition_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","in-composition?","editor/in-composition?",-259037730),value);
});
frontend.state.editor_in_composition_QMARK_ = (function frontend$state$editor_in_composition_QMARK_(){
return new cljs.core.Keyword("editor","in-composition?","editor/in-composition?",-259037730).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_loading_files_BANG_ = (function frontend$state$set_loading_files_BANG_(repo,value){
if(cljs.core.truth_(repo)){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("repo","loading-files?","repo/loading-files?",196666138),repo], null),value);
} else {
return null;
}
});
frontend.state.loading_files_QMARK_ = (function frontend$state$loading_files_QMARK_(repo){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("repo","loading-files?","repo/loading-files?",196666138),repo], null));
});
frontend.state.set_editor_last_input_time_BANG_ = (function frontend$state$set_editor_last_input_time_BANG_(repo,time){
return frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("editor","last-input-time","editor/last-input-time",-2008067915),time,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),repo], 0));
});
frontend.state.input_idle_QMARK_ = (function frontend$state$input_idle_QMARK_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59544 = arguments.length;
var i__5727__auto___59545 = (0);
while(true){
if((i__5727__auto___59545 < len__5726__auto___59544)){
args__5732__auto__.push((arguments[i__5727__auto___59545]));

var G__59546 = (i__5727__auto___59545 + (1));
i__5727__auto___59545 = G__59546;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.state.input_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.state.input_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__58903){
var map__58904 = p__58903;
var map__58904__$1 = cljs.core.__destructure_map(map__58904);
var diff = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__58904__$1,new cljs.core.Keyword(null,"diff","diff",2135942783),(1000));
if(cljs.core.truth_(repo)){
var last_input_time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("editor","last-input-time","editor/last-input-time",-2008067915))),repo);
var or__5002__auto__ = (last_input_time == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var now = (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
return ((now - last_input_time) >= diff);
})();
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return cljs.core.not(frontend.state.get_edit_input_id());
}
}
} else {
return null;
}
}));

(frontend.state.input_idle_QMARK_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.state.input_idle_QMARK_.cljs$lang$applyTo = (function (seq58900){
var G__58901 = cljs.core.first(seq58900);
var seq58900__$1 = cljs.core.next(seq58900);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58901,seq58900__$1);
}));

frontend.state.set_nfs_refreshing_BANG_ = (function frontend$state$set_nfs_refreshing_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("nfs","refreshing?","nfs/refreshing?",-1285076588),value);
});
frontend.state.nfs_refreshing_QMARK_ = (function frontend$state$nfs_refreshing_QMARK_(){
return new cljs.core.Keyword("nfs","refreshing?","nfs/refreshing?",-1285076588).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_search_result_BANG_ = (function frontend$state$set_search_result_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("search","result","search/result",443756363),value);
});
frontend.state.clear_search_result_BANG_ = (function frontend$state$clear_search_result_BANG_(){
return frontend.state.set_search_result_BANG_(null);
});
frontend.state.add_graph_search_filter_BANG_ = (function frontend$state$add_graph_search_filter_BANG_(q){
if(clojure.string.blank_QMARK_(q)){
return null;
} else {
return frontend.state.update_state_BANG_(new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152),(function (value){
return cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(value,q)));
}));
}
});
frontend.state.remove_search_filter_BANG_ = (function frontend$state$remove_search_filter_BANG_(q){
if(clojure.string.blank_QMARK_(q)){
return null;
} else {
return frontend.state.update_state_BANG_(new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152),(function (value){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([q]),value);
}));
}
});
frontend.state.clear_search_filters_BANG_ = (function frontend$state$clear_search_filters_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152),cljs.core.PersistentVector.EMPTY);
});
frontend.state.get_search_mode = (function frontend$state$get_search_mode(){
return new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.toggle_BANG_ = (function frontend$state$toggle_BANG_(path){
return frontend.state.update_state_BANG_(path,cljs.core.not);
});
frontend.state.toggle_settings_BANG_ = (function frontend$state$toggle_settings_BANG_(){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343));
});
frontend.state.settings_open_QMARK_ = (function frontend$state$settings_open_QMARK_(){
return new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.close_settings_BANG_ = (function frontend$state$close_settings_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343),false);
});
frontend.state.open_settings_BANG_ = (function frontend$state$open_settings_BANG_(var_args){
var G__58911 = arguments.length;
switch (G__58911) {
case 0:
return frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}));

(frontend.state.open_settings_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (active_tab){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343),active_tab);
}));

(frontend.state.open_settings_BANG_.cljs$lang$maxFixedArity = 1);

frontend.state.sidebar_add_block_BANG_ = (function frontend$state$sidebar_add_block_BANG_(repo,db_id,block_type){
if((!(frontend.util.sm_breakpoint_QMARK_()))){
var page = (function (){var and__5000__auto__ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),block_type);
if(and__5000__auto____$1){
var G__58915 = frontend.db.conn_state.get_conn(repo);
var G__58915__$1 = (((G__58915 == null))?null:cljs.core.deref(G__58915));
if((G__58915__$1 == null)){
return null;
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__58915__$1,db_id) : datascript.core.entity.call(null,G__58915__$1,db_id));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not(goog.DEBUG);
if(and__5000__auto____$1){
var or__5002__auto__ = (function (){var and__5000__auto____$2 = (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.hidden_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)));
} else {
return and__5000__auto____$2;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto____$2 = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.built_in_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$2)){
return (logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.private_built_in_page_QMARK_.call(null,page));
} else {
return and__5000__auto____$2;
}
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),"Cannot open an internal page.",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
if(cljs.core.truth_(db_id)){
frontend.state.update_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),(function (blocks){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,db_id,block_type], null),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__58913_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(p1__58913_SHARP_),db_id);
}),blocks)));
}));

frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),db_id], null),false);

frontend.state.open_right_sidebar_BANG_();

var temp__5804__auto__ = goog.dom.getElementByClass("sidebar-item-list");
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$2(elem,(0));
} else {
return null;
}
} else {
return null;
}
}
} else {
return null;
}
});
frontend.state.get_export_block_text_indent_style = (function frontend$state$get_export_block_text_indent_style(){
return new cljs.core.Keyword("copy","export-block-text-indent-style","copy/export-block-text-indent-style",1531384180).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_export_block_text_indent_style_BANG_ = (function frontend$state$set_export_block_text_indent_style_BANG_(v){
frontend.state.set_state_BANG_(new cljs.core.Keyword("copy","export-block-text-indent-style","copy/export-block-text-indent-style",1531384180),v);

return frontend.storage.set(new cljs.core.Keyword("copy","export-block-text-indent-style","copy/export-block-text-indent-style",1531384180),v);
});
frontend.state.get_recent_pages = (function frontend$state$get_recent_pages(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247),frontend.state.get_current_repo()], null));
});
frontend.state.set_recent_pages_BANG_ = (function frontend$state$set_recent_pages_BANG_(v){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247),frontend.state.get_current_repo()], null),v);

return frontend.storage.set(new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247),new cljs.core.Keyword("ui","recent-pages","ui/recent-pages",1527475247).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_export_block_text_remove_options = (function frontend$state$get_export_block_text_remove_options(){
return new cljs.core.Keyword("copy","export-block-text-remove-options","copy/export-block-text-remove-options",-1213505869).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.update_export_block_text_remove_options_BANG_ = (function frontend$state$update_export_block_text_remove_options_BANG_(e,k){
var f = (cljs.core.truth_(frontend.util.echecked_QMARK_(e))?cljs.core.conj:cljs.core.disj);
frontend.state.update_state_BANG_(new cljs.core.Keyword("copy","export-block-text-remove-options","copy/export-block-text-remove-options",-1213505869),(function (p1__58919_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(p1__58919_SHARP_,k) : f.call(null,p1__58919_SHARP_,k));
}));

return frontend.storage.set(new cljs.core.Keyword("copy","export-block-text-remove-options","copy/export-block-text-remove-options",-1213505869),frontend.state.get_export_block_text_remove_options());
});
frontend.state.get_export_block_text_other_options = (function frontend$state$get_export_block_text_other_options(){
return new cljs.core.Keyword("copy","export-block-text-other-options","copy/export-block-text-other-options",1053932178).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.update_export_block_text_other_options_BANG_ = (function frontend$state$update_export_block_text_other_options_BANG_(k,v){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("copy","export-block-text-other-options","copy/export-block-text-other-options",1053932178),(function (p1__58921_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__58921_SHARP_,k,v);
}));
});
frontend.state.set_editor_args_BANG_ = (function frontend$state$set_editor_args_BANG_(args){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","args","editor/args",208005741),args);
});
frontend.state.editing_whiteboard_portal_QMARK_ = (function frontend$state$editing_whiteboard_portal_QMARK_(){
var and__5000__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.tldraw_editing_logseq_block_QMARK_();
} else {
return and__5000__auto__;
}
});
frontend.state.block_component_editing_QMARK_ = (function frontend$state$block_component_editing_QMARK_(){
var and__5000__auto__ = new cljs.core.Keyword("block","component-editing-mode?","block/component-editing-mode?",-1744931560).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.state.editing_whiteboard_portal_QMARK_());
} else {
return and__5000__auto__;
}
});
frontend.state.set_block_component_editing_mode_BANG_ = (function frontend$state$set_block_component_editing_mode_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("block","component-editing-mode?","block/component-editing-mode?",-1744931560),value);
});
frontend.state.get_editor_args = (function frontend$state$get_editor_args(){
return cljs.core.deref(new cljs.core.Keyword("editor","args","editor/args",208005741).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_page_blocks_cp_BANG_ = (function frontend$state$set_page_blocks_cp_BANG_(value){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("view","components","view/components",-1071666675),new cljs.core.Keyword(null,"page-blocks","page-blocks",1869088690)], null),value);
});
frontend.state.get_page_blocks_cp = (function frontend$state$get_page_blocks_cp(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("view","components","view/components",-1071666675),new cljs.core.Keyword(null,"page-blocks","page-blocks",1869088690)], null));
});
frontend.state.set_component_BANG_ = (function frontend$state$set_component_BANG_(k,value){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("view","components","view/components",-1071666675),k], null),value);
});
frontend.state.get_component = (function frontend$state$get_component(k){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("view","components","view/components",-1071666675),k], null));
});
frontend.state.exit_editing_and_set_selected_blocks_BANG_ = (function frontend$state$exit_editing_and_set_selected_blocks_BANG_(var_args){
var G__58925 = arguments.length;
switch (G__58925) {
case 1:
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (blocks){
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks,null);
}));

(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (blocks,direction){
frontend.state.clear_edit_BANG_();

return frontend.state.set_selection_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks,direction);
}));

(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$lang$maxFixedArity = 2);

frontend.state.set_editing_BANG_ = (function frontend$state$set_editing_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___59557 = arguments.length;
var i__5727__auto___59558 = (0);
while(true){
if((i__5727__auto___59558 < len__5726__auto___59557)){
args__5732__auto__.push((arguments[i__5727__auto___59558]));

var G__59559 = (i__5727__auto___59558 + (1));
i__5727__auto___59558 = G__59559;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.state.set_editing_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.state.set_editing_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (edit_input_id,content,block,cursor_range,p__58933){
var map__58934 = p__58933;
var map__58934__$1 = cljs.core.__destructure_map(map__58934);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"db","db",993250759));
var move_cursor_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__58934__$1,new cljs.core.Keyword(null,"move-cursor?","move-cursor?",-229137728),true);
var container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"container-id","container-id",1274665684));
var property_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"property-block","property-block",2113998707));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var event = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"event","event",301435442));
var pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58934__$1,new cljs.core.Keyword(null,"pos","pos",-864607220));
if((typeof process !== 'undefined')){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = edit_input_id;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = block;
if(cljs.core.truth_(and__5000__auto____$1)){
var or__5002__auto__ = frontend.state.publishing_enable_editing_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(logseq.common.config.PUBLISHING));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var block_element = goog.dom.getElement(clojure.string.replace(edit_input_id,"edit-block","ls-block"));
var container = frontend.util.get_block_container(block_element);
var block__$1 = (cljs.core.truth_(container)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block.temp","container","block.temp/container",-493626206),frontend.state.goog$module$goog$object.get(container,"id")):block);
var block__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block__$1,new cljs.core.Keyword("block.editing","direction","block.editing/direction",-1821464148),direction,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block.editing","event","block.editing/event",-649798439),event,new cljs.core.Keyword("block.editing","pos","block.editing/pos",-1255653791),pos], 0));
var content__$1 = clojure.string.trim((function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
if(cljs.core.truth_((function (){var and__5000__auto__ = container_id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2);
} else {
return and__5000__auto__;
}
})())){
} else {
throw (new Error(["Assert failed: ","container-id or block uuid is missing","\n","(and container-id (:block/uuid block))"].join('')));
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855),cljs.core.PersistentHashSet.EMPTY);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block","editor/block",1699377461),block__$2);

if(cljs.core.truth_(property_block)){
frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property_block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2)], null));
} else {
frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2)], null));
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583),container_id);

frontend.state.set_state_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("editor","content","editor/content",-756190443),content__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2)], 0));

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","last-key-code","editor/last-key-code",607982236),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","set-timestamp-block","editor/set-timestamp-block",1136443872),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","cursor-range","editor/cursor-range",1691491127),cursor_range);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1((function (){var G__58935 = db;
var G__58936 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$2);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__58935,G__58936) : datascript.core.entity.call(null,G__58935,G__58936));
})()))){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","focus-code-editor","editor/focus-code-editor",-682196012),block__$2,block_element], null));
} else {
}

var temp__5804__auto__ = goog.dom.getElement(edit_input_id);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
var pos__$1 = cljs.core.count(cursor_range);
if(cljs.core.truth_(content__$1)){
frontend.util.set_change_value(input,content__$1);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = move_cursor_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.state.block_component_editing_QMARK_());
} else {
return and__5000__auto__;
}
})())){
frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,pos__$1);
} else {
}

if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}
}));

(frontend.state.set_editing_BANG_.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.state.set_editing_BANG_.cljs$lang$applyTo = (function (seq58927){
var G__58928 = cljs.core.first(seq58927);
var seq58927__$1 = cljs.core.next(seq58927);
var G__58929 = cljs.core.first(seq58927__$1);
var seq58927__$2 = cljs.core.next(seq58927__$1);
var G__58930 = cljs.core.first(seq58927__$2);
var seq58927__$3 = cljs.core.next(seq58927__$2);
var G__58931 = cljs.core.first(seq58927__$3);
var seq58927__$4 = cljs.core.next(seq58927__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58928,G__58929,G__58930,G__58931,seq58927__$4);
}));

frontend.state.action_bar_open_QMARK_ = (function frontend$state$action_bar_open_QMARK_(){
return new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_git_auto_commit_enabled_QMARK_ = (function frontend$state$get_git_auto_commit_enabled_QMARK_(){
return frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","disable-auto-commit?","git/disable-auto-commit?",1374476539)], null)) === false;
});
frontend.state.get_git_commit_on_close_enabled_QMARK_ = (function frontend$state$get_git_commit_on_close_enabled_QMARK_(){
return frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","commit-on-close?","git/commit-on-close?",398720116)], null));
});
frontend.state.set_last_key_code_BANG_ = (function frontend$state$set_last_key_code_BANG_(key_code){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","last-key-code","editor/last-key-code",607982236),key_code);
});
frontend.state.get_last_key_code = (function frontend$state$get_last_key_code(){
return cljs.core.deref(new cljs.core.Keyword("editor","last-key-code","editor/last-key-code",607982236).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_ui_last_key_code_BANG_ = (function frontend$state$set_ui_last_key_code_BANG_(key_code){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","global-last-key-code","ui/global-last-key-code",-1972103495),key_code);
});
frontend.state.get_ui_last_key_code = (function frontend$state$get_ui_last_key_code(){
return cljs.core.deref(new cljs.core.Keyword("ui","global-last-key-code","ui/global-last-key-code",-1972103495).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_block_op_type_BANG_ = (function frontend$state$set_block_op_type_BANG_(op_type){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","block-op-type","editor/block-op-type",1578820069),op_type);
});
frontend.state.get_block_op_type = (function frontend$state$get_block_op_type(){
return new cljs.core.Keyword("editor","block-op-type","editor/block-op-type",1578820069).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.feature_http_server_enabled_QMARK_ = (function frontend$state$feature_http_server_enabled_QMARK_(){
return cljs.core.boolean$(frontend.storage.get(new cljs.core.Keyword("frontend.spec.storage","http-server-enabled","frontend.spec.storage/http-server-enabled",-1753032348)));
});
frontend.state.get_plugin_by_id = (function frontend$state$get_plugin_by_id(id){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id__$1 = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034),id__$1], null));
} else {
return null;
}
});
frontend.state.get_enabled_QMARK__installed_plugins = (function frontend$state$get_enabled_QMARK__installed_plugins(var_args){
var G__58942 = arguments.length;
switch (G__58942) {
case 1:
return frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 4:
return frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$1 = (function (theme_QMARK_){
return frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$4(theme_QMARK_,true,false,false);
}));

(frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$4 = (function (theme_QMARK_,enabled_QMARK_,include_unpacked_QMARK_,include_all_QMARK_){
return cljs.core.filterv((function (p1__58940_SHARP_){
var and__5000__auto__ = (cljs.core.truth_(include_unpacked_QMARK_)?true:(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"webMode","webMode",-1168030481).cljs$core$IFn$_invoke$arity$1(p1__58940_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"iir","iir",-231680811).cljs$core$IFn$_invoke$arity$1(p1__58940_SHARP_);
}
})());
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (((!(cljs.core.boolean_QMARK_(enabled_QMARK_))))?true:cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.not(enabled_QMARK_),cljs.core.boolean$(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__58940_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null)))));
if(and__5000__auto____$1){
var or__5002__auto__ = include_all_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.boolean_QMARK_(theme_QMARK_)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(theme_QMARK_),new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__58940_SHARP_));
} else {
return true;
}
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),cljs.core.vals(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
}));

(frontend.state.get_enabled_QMARK__installed_plugins.cljs$lang$maxFixedArity = 4);

frontend.state.lsp_enabled_QMARK__or_theme = (function frontend$state$lsp_enabled_QMARK__or_theme(){
return new cljs.core.Keyword("plugin","enabled","plugin/enabled",-2065640529).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.lsp_enabled_QMARK_ = frontend.state.lsp_enabled_QMARK__or_theme();
frontend.state.consume_updates_from_coming_plugin_BANG_ = (function frontend$state$consume_updates_from_coming_plugin_BANG_(payload,updated_QMARK_){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(payload));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var prev_pending_QMARK_ = cljs.core.boolean$(cljs.core.seq(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Updates: consumed pending - ",id], 0));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update,new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));

if(cljs.core.truth_(updated_QMARK_)){
var temp__5802__auto___59565 = new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(payload);
if(cljs.core.truth_(temp__5802__auto___59565)){
var error_59566 = temp__5802__auto___59565;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),id], null),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error-code","error-code",180497232),error_59566], 0));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update,new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));
}
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update,new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id,payload], 0));
}

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","consume-updates","plugin/consume-updates",-331798674),id,prev_pending_QMARK_,updated_QMARK_], null));
} else {
return null;
}
});
frontend.state.coming_update_new_version_QMARK_ = (function frontend$state$coming_update_new_version_QMARK_(pkg){
var and__5000__auto__ = pkg;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(pkg);
} else {
return and__5000__auto__;
}
});
frontend.state.plugin_update_available_QMARK_ = (function frontend$state$plugin_update_available_QMARK_(id){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pkg = temp__5804__auto__;
return frontend.state.coming_update_new_version_QMARK_(pkg);
} else {
return null;
}
});
frontend.state.all_available_coming_updates = (function frontend$state$all_available_coming_updates(var_args){
var G__58947 = arguments.length;
switch (G__58947) {
case 0:
return frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
}));

(frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$1 = (function (updates){
var temp__5804__auto__ = cljs.core.vals(updates);
if(cljs.core.truth_(temp__5804__auto__)){
var updates__$1 = temp__5804__auto__;
return cljs.core.filterv((function (p1__58945_SHARP_){
return frontend.state.coming_update_new_version_QMARK_(p1__58945_SHARP_);
}),updates__$1);
} else {
return null;
}
}));

(frontend.state.all_available_coming_updates.cljs$lang$maxFixedArity = 1);

frontend.state.get_next_selected_coming_update = (function frontend$state$get_next_selected_coming_update(){
var temp__5804__auto__ = frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5804__auto__)){
var updates = temp__5804__auto__;
var unchecked = new cljs.core.Keyword("plugin","updates-unchecked","plugin/updates-unchecked",723985111).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__58948_SHARP_){
return (((!(((cljs.core.seq(unchecked)) && (cljs.core.contains_QMARK_(unchecked,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__58948_SHARP_))))))) && (cljs.core.not(new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(p1__58948_SHARP_))));
}),updates));
} else {
return null;
}
});
frontend.state.set_unchecked_update = (function frontend$state$set_unchecked_update(id,unchecked_QMARK_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update,new cljs.core.Keyword("plugin","updates-unchecked","plugin/updates-unchecked",723985111),(cljs.core.truth_(unchecked_QMARK_)?cljs.core.conj:cljs.core.disj),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));
});
frontend.state.reset_unchecked_update = (function frontend$state$reset_unchecked_update(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("plugin","updates-unchecked","plugin/updates-unchecked",723985111),cljs.core.PersistentHashSet.EMPTY);
});
frontend.state.reset_all_updates_state = (function frontend$state$reset_all_updates_state(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("plugin","updates-auto-checking?","plugin/updates-auto-checking?",1617323181),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608),false], 0));
});
frontend.state.sub_right_sidebar_blocks = (function frontend$state$sub_right_sidebar_blocks(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var current_repo = temp__5804__auto__;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__58955_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(p1__58955_SHARP_),current_repo);
}),frontend.state.sub(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475)));
} else {
return null;
}
});
frontend.state.toggle_collapsed_block_BANG_ = (function frontend$state$toggle_collapsed_block_BANG_(block_id){
var current_repo = frontend.state.get_current_repo();
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","collapsed-blocks","ui/collapsed-blocks",-968043167),current_repo,block_id], null),cljs.core.not);
});
frontend.state.set_collapsed_block_BANG_ = (function frontend$state$set_collapsed_block_BANG_(block_id,value){
var current_repo = frontend.state.get_current_repo();
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","collapsed-blocks","ui/collapsed-blocks",-968043167),current_repo,block_id], null),value);
});
frontend.state.sub_block_collapsed = (function frontend$state$sub_block_collapsed(block_id){
return frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","collapsed-blocks","ui/collapsed-blocks",-968043167),frontend.state.get_current_repo(),block_id], null));
});
frontend.state.get_block_collapsed = (function frontend$state$get_block_collapsed(block_id){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","collapsed-blocks","ui/collapsed-blocks",-968043167),frontend.state.get_current_repo(),block_id], null));
});
frontend.state.get_modal_id = (function frontend$state$get_modal_id(){
return logseq.shui.dialog.core.get_last_modal_id();
});
frontend.state.set_auth_id_token = (function frontend$state$set_auth_id_token(id_token){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946),id_token);
});
frontend.state.set_auth_refresh_token = (function frontend$state$set_auth_refresh_token(refresh_token){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("auth","refresh-token","auth/refresh-token",-1024820760),refresh_token);
});
frontend.state.set_auth_access_token = (function frontend$state$set_auth_access_token(access_token){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("auth","access-token","auth/access-token",-657486615),access_token);
});
frontend.state.get_auth_id_token = (function frontend$state$get_auth_id_token(){
return frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946));
});
frontend.state.get_auth_refresh_token = (function frontend$state$get_auth_refresh_token(){
return new cljs.core.Keyword("auth","refresh-token","auth/refresh-token",-1024820760).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_file_sync_manager = (function frontend$state$set_file_sync_manager(graph_uuid,v){
if(cljs.core.truth_((function (){var and__5000__auto__ = graph_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return v;
} else {
return and__5000__auto__;
}
})())){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","sync-manager","file-sync/sync-manager",49683808)], null),v);
} else {
return null;
}
});
frontend.state.get_file_sync_manager = (function frontend$state$get_file_sync_manager(graph_uuid){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","sync-manager","file-sync/sync-manager",49683808)], null));
});
frontend.state.clear_file_sync_state_BANG_ = (function frontend$state$clear_file_sync_state_BANG_(graph_uuid){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid], null),null);
});
frontend.state.clear_file_sync_progress_BANG_ = (function frontend$state$clear_file_sync_progress_BANG_(graph_uuid){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","progress","file-sync/progress",-1051866953)], null),null);
});
frontend.state.set_file_sync_state = (function frontend$state$set_file_sync_state(graph_uuid,v){
if(cljs.core.truth_(v)){
if(cljs.core.truth_(cljs.spec.alpha._STAR_compile_asserts_STAR_)){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Var(function(){return cljs.spec.alpha._STAR_runtime_asserts_STAR_;},new cljs.core.Symbol("cljs.spec.alpha","*runtime-asserts*","cljs.spec.alpha/*runtime-asserts*",-1060443587,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"dynamic","dynamic",704819571),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,new cljs.core.Symbol(null,"cljs.spec.alpha","cljs.spec.alpha",505122844,null),new cljs.core.Symbol(null,"*runtime-asserts*","*runtime-asserts*",1632801956,null),"cljs/spec/alpha.cljs",(20),(1),true,(1480),(1482),cljs.core.List.EMPTY,null,(cljs.core.truth_(cljs.spec.alpha._STAR_runtime_asserts_STAR_)?cljs.spec.alpha._STAR_runtime_asserts_STAR_.cljs$lang$test:null)]))))){
cljs.spec.alpha.assert_STAR_(new cljs.core.Keyword("frontend.fs.sync","sync-state","frontend.fs.sync/sync-state",-1582588613),v);
} else {
}
} else {
}
} else {
}

return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","sync-state","file-sync/sync-state",-474069969)], null),v);
});
frontend.state.get_current_file_sync_graph_uuid = (function frontend$state$get_current_file_sync_graph_uuid(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),new cljs.core.Keyword(null,"current-graph-uuid","current-graph-uuid",359245938)], null));
});
frontend.state.sub_current_file_sync_graph_uuid = (function frontend$state$sub_current_file_sync_graph_uuid(){
return frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),new cljs.core.Keyword(null,"current-graph-uuid","current-graph-uuid",359245938)], null));
});
frontend.state.get_file_sync_state = (function frontend$state$get_file_sync_state(var_args){
var G__58986 = arguments.length;
switch (G__58986) {
case 0:
return frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_file_sync_graph_uuid());
}));

(frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$1 = (function (graph_uuid){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","sync-state","file-sync/sync-state",-474069969)], null));
}));

(frontend.state.get_file_sync_state.cljs$lang$maxFixedArity = 1);

frontend.state.sub_file_sync_state = (function frontend$state$sub_file_sync_state(graph_uuid){
return frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),graph_uuid,new cljs.core.Keyword("file-sync","sync-state","file-sync/sync-state",-474069969)], null));
});
frontend.state.reset_parsing_state_BANG_ = (function frontend$state$reset_parsing_state_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),frontend.state.get_current_repo()], null),cljs.core.PersistentArrayMap.EMPTY);
});
frontend.state.set_parsing_state_BANG_ = (function frontend$state$set_parsing_state_BANG_(m){
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),frontend.state.get_current_repo()], null),((cljs.core.fn_QMARK_(m))?m:(function (old_value){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_value,m], 0));
})));
});
frontend.state.http_proxy_enabled_or_val_QMARK_ = (function frontend$state$http_proxy_enabled_or_val_QMARK_(){
var temp__5804__auto__ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("settings","agent","settings/agent",2144439922)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var map__58987 = temp__5804__auto__;
var map__58987__$1 = cljs.core.__destructure_map(map__58987);
var agent_opts = map__58987__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58987__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var protocol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58987__$1,new cljs.core.Keyword(null,"protocol","protocol",652470118));
var host = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58987__$1,new cljs.core.Keyword(null,"host","host",-1558485167));
var port = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58987__$1,new cljs.core.Keyword(null,"port","port",1534937262));
if((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["system",null], null), null),type)))) && (cljs.core.every_QMARK_(cljs.core.not_empty,cljs.core.vals(agent_opts))))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol),"://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(host),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(port)].join('');
} else {
return null;
}
} else {
return null;
}
});
frontend.state.get_sync_graph_by_id = (function frontend$state$get_sync_graph_by_id(graph_uuid){
if(cljs.core.truth_(graph_uuid)){
var graph = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__58989_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_uuid,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(p1__58989_SHARP_));
}),frontend.state.get_repos()));
if(cljs.core.truth_(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(graph))){
return graph;
} else {
return null;
}
} else {
return null;
}
});
frontend.state.unlinked_dir_QMARK_ = (function frontend$state$unlinked_dir_QMARK_(dir){
return cljs.core.contains_QMARK_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),dir);
});
frontend.state.get_file_rename_event_chan = (function frontend$state$get_file_rename_event_chan(){
return new cljs.core.Keyword("file","rename-event-chan","file/rename-event-chan",-901857721).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.offer_file_rename_event_chan_BANG_ = (function frontend$state$offer_file_rename_event_chan_BANG_(v){
if(cljs.core.map_QMARK_(v)){
} else {
throw (new Error("Assert failed: (map? v)"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-path","new-path",1732999939),null,new cljs.core.Keyword(null,"old-path","old-path",-2069757806),null,new cljs.core.Keyword(null,"repo","repo",-1999060679),null], null), null),cljs.core.set(cljs.core.keys(v)))){
} else {
throw (new Error("Assert failed: (= #{:new-path :old-path :repo} (set (keys v)))"));
}

return cljs.core.async.offer_BANG_(frontend.state.get_file_rename_event_chan(),v);
});
frontend.state.set_onboarding_whiteboard_BANG_ = (function frontend$state$set_onboarding_whiteboard_BANG_(v){
frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248),v);

return frontend.storage.set(new cljs.core.Keyword(null,"ls-onboarding-whiteboard?","ls-onboarding-whiteboard?",-1365895638),v);
});
frontend.state.get_onboarding_whiteboard_QMARK_ = (function frontend$state$get_onboarding_whiteboard_QMARK_(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248)], null));
});
frontend.state.get_local_container_root_url = (function frontend$state$get_local_container_root_url(){
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","container-urls","mobile/container-urls",149073836),new cljs.core.Keyword(null,"localContainerUrl","localContainerUrl",-1438071718)], null));
} else {
return null;
}
});
frontend.state.get_icloud_container_root_url = (function frontend$state$get_icloud_container_root_url(){
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","container-urls","mobile/container-urls",149073836),new cljs.core.Keyword(null,"iCloudContainerUrl","iCloudContainerUrl",-812046927)], null));
} else {
return null;
}
});
frontend.state.get_current_pdf = (function frontend$state$get_current_pdf(){
return new cljs.core.Keyword("pdf","current","pdf/current",-1087936477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.set_current_pdf_BANG_ = (function frontend$state$set_current_pdf_BANG_(inflated_file){
var settle_file_BANG_ = (function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),inflated_file);
});
if(cljs.core.not(frontend.state.get_current_pdf())){
return settle_file_BANG_();
} else {
if(cljs.core.truth_(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.not_EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"identity","identity",1647396035),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inflated_file,frontend.state.get_current_pdf()], null))))){
frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);

return setTimeout((function (){
return settle_file_BANG_();
}),(16));
} else {
return null;
}
}
});
frontend.state.focus_whiteboard_shape = (function frontend$state$focus_whiteboard_shape(var_args){
var G__59019 = arguments.length;
switch (G__59019) {
case 1:
return frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$1 = (function (shape_id){
return frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$2(frontend.state.active_tldraw_app(),shape_id);
}));

(frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$2 = (function (tln,shape_id){
var temp__5804__auto__ = frontend.state.goog$module$goog$object.get(tln,"api");
if(cljs.core.truth_(temp__5804__auto__)){
var api = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = shape_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.parse_uuid(shape_id);
} else {
return and__5000__auto__;
}
})())){
api.selectShapes(shape_id);

return api.zoomToSelection();
} else {
return null;
}
} else {
return null;
}
}));

(frontend.state.focus_whiteboard_shape.cljs$lang$maxFixedArity = 2);

frontend.state.set_user_info_BANG_ = (function frontend$state$set_user_info_BANG_(info){
if(cljs.core.truth_(info)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("user","info","user/info",-345834271),info);

var groups = new cljs.core.Keyword(null,"UserGroups","UserGroups",1693861388).cljs$core$IFn$_invoke$arity$1(info);
if(cljs.core.seq(groups)){
return frontend.storage.set(new cljs.core.Keyword(null,"user-groups","user-groups",-1264926454),groups);
} else {
return null;
}
} else {
return null;
}
});
frontend.state.get_user_info = (function frontend$state$get_user_info(){
return frontend.state.sub(new cljs.core.Keyword("user","info","user/info",-345834271));
});
frontend.state.clear_user_info_BANG_ = (function frontend$state$clear_user_info_BANG_(){
return frontend.storage.remove(new cljs.core.Keyword(null,"user-groups","user-groups",-1264926454));
});
frontend.state.set_color_accent_BANG_ = (function frontend$state$set_color_accent_BANG_(color){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984),color);

return frontend.storage.set(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984),color);
});
frontend.state.set_editor_font_BANG_ = (function frontend$state$set_editor_font_BANG_(font){
var font__$1 = (((font instanceof cljs.core.Keyword))?cljs.core.name(font):cljs.core.str.cljs$core$IFn$_invoke$arity$1(font));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775),font__$1);

return frontend.storage.set(new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775),font__$1);
});
frontend.state.handbook_open_QMARK_ = (function frontend$state$handbook_open_QMARK_(){
return new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.get_handbook_route_chan = (function frontend$state$get_handbook_route_chan(){
return new cljs.core.Keyword("handbook","route-chan","handbook/route-chan",1649058330).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.state.open_handbook_pane_BANG_ = (function frontend$state$open_handbook_pane_BANG_(k){
if(cljs.core.truth_(frontend.state.handbook_open_QMARK_())){
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058),true);
}

return setTimeout((function (){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_59042){
var state_val_59043 = (state_59042[(1)]);
if((state_val_59043 === (1))){
var inst_59038 = frontend.state.get_handbook_route_chan();
var state_59042__$1 = state_59042;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_59042__$1,(2),inst_59038,k);
} else {
if((state_val_59043 === (2))){
var inst_59040 = (state_59042[(2)]);
var state_59042__$1 = state_59042;
return cljs.core.async.impl.ioc_helpers.return_chan(state_59042__$1,inst_59040);
} else {
return null;
}
}
});
return (function() {
var frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__ = null;
var frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_59053 = [null,null,null,null,null,null,null];
(statearr_59053[(0)] = frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__);

(statearr_59053[(1)] = (1));

return statearr_59053;
});
var frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____1 = (function (state_59042){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_59042);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e59057){var ex__32054__auto__ = e59057;
var statearr_59058_59595 = state_59042;
(statearr_59058_59595[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_59042[(4)]))){
var statearr_59059_59596 = state_59042;
(statearr_59059_59596[(1)] = cljs.core.first((state_59042[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__59597 = state_59042;
state_59042 = G__59597;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__ = function(state_59042){
switch(arguments.length){
case 0:
return frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____1.call(this,state_59042);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____0;
frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto____1;
return frontend$state$open_handbook_pane_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_59063 = f__32125__auto__();
(statearr_59063[(6)] = c__32124__auto__);

return statearr_59063;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));
});
frontend.state.update_favorites_updated_BANG_ = (function frontend$state$update_favorites_updated_BANG_(){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("favorites","updated?","favorites/updated?",-1904365701),cljs.core.inc);
});
frontend.state.get_worker_next_request_id = frontend.db.transact.get_next_request_id;
frontend.state.add_worker_request_BANG_ = frontend.db.transact.add_request_BANG_;
frontend.state.get_next_container_id = (function frontend$state$get_next_container_id(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("ui","container-id","ui/container-id",1274679328).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.inc);
});
/**
 * Either cached container-id or a new id
 */
frontend.state.get_container_id = (function frontend$state$get_container_id(key){
if(cljs.core.seq(key)){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword("ui","cached-key->container-id","ui/cached-key->container-id",-989519868).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))),key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var id = frontend.state.get_next_container_id();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("ui","cached-key->container-id","ui/cached-key->container-id",-989519868).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.assoc,key,id);

return id;
}
} else {
return frontend.state.get_next_container_id();
}
});
frontend.state.get_current_editor_container_id = (function frontend$state$get_current_editor_container_id(){
return cljs.core.deref(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.get_editor_info = (function frontend$state$get_editor_info(){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var edit_block = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block),new cljs.core.Keyword(null,"container-id","container-id",1274665684),(function (){var or__5002__auto__ = cljs.core.deref(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473);
}
})(),new cljs.core.Keyword(null,"start-pos","start-pos",668789086),cljs.core.deref(new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))),new cljs.core.Keyword(null,"end-pos","end-pos",-1643883926),frontend.state.get_edit_pos()], null);
} else {
return null;
}
});
frontend.state.conj_block_ref_BANG_ = (function frontend$state$conj_block_ref_BANG_(ref_entity){
var refs_BANG_ = new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(refs_BANG_,cljs.core.conj,ref_entity);
});
frontend.state.get_highlight_recent_days = (function frontend$state$get_highlight_recent_days(){
return cljs.core.deref(new cljs.core.Keyword("ui","highlight-recent-days","ui/highlight-recent-days",388728304).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.state.set_highlight_recent_days_BANG_ = (function frontend$state$set_highlight_recent_days_BANG_(days){
cljs.core.reset_BANG_(new cljs.core.Keyword("ui","highlight-recent-days","ui/highlight-recent-days",388728304).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),days);

return frontend.storage.set(new cljs.core.Keyword("ui","highlight-recent-days","ui/highlight-recent-days",388728304),days);
});
frontend.state.set_rtc_enabled_BANG_ = (function frontend$state$set_rtc_enabled_BANG_(value){
frontend.storage.set(new cljs.core.Keyword(null,"logseq-rtc-enabled","logseq-rtc-enabled",280055811),value);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("feature","enable-rtc?","feature/enable-rtc?",-2018465217),value);
});

//# sourceMappingURL=frontend.state.js.map
