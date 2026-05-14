goog.provide('frontend.components.page_menu');
frontend.components.page_menu.delete_page_BANG_ = (function frontend$components$page_menu$delete_page_BANG_(page){
var G__87552 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
var G__87553 = (function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Page ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page))," was deleted successfully!"].join(''),new cljs.core.Keyword(null,"success","success",1890645906));
});
var G__87554 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p__87555){
var map__87556 = p__87555;
var map__87556__$1 = cljs.core.__destructure_map(map__87556);
var msg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87556__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.Keyword(null,"warning","warning",-1685650671));
})], null);
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3(G__87552,G__87553,G__87554) : frontend.handler.page._LT_delete_BANG_.call(null,G__87552,G__87553,G__87554));
});
frontend.components.page_menu.delete_page_confirm_BANG_ = (function frontend$components$page_menu$delete_page_confirm_BANG_(page){
if(cljs.core.truth_(page)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__87557 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.leading-6.font-medium.flex.gap-2.items-center","h3.text-lg.leading-6.font-medium.flex.gap-2.items-center",-105214406),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.top-1.relative","span.top-1.relative",-1531544130),logseq.shui.ui.tabler_icon("alert-triangle")], null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","db-delete-confirmation","page/db-delete-confirmation",696925748)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","delete-confirmation","page/delete-confirmation",-1967752819)], 0)))], null),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.opacity-60","p.opacity-60",441728988),["- ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page))].join('')], null),new cljs.core.Keyword(null,"outside-cancel?","outside-cancel?",-1972964985),true], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__87557) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__87557));
})(),(function (){
return frontend.components.page_menu.delete_page_BANG_(page);
})),(function (){
return cljs.core.List.EMPTY;
}));
} else {
return null;
}
});
frontend.components.page_menu.page_menu = (function frontend$components$page_menu$page_menu(page){
var temp__5804__auto__ = (function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var page_title = ((db_based_QMARK_)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)):new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page));
var whiteboard_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.whiteboard_QMARK_.call(null,page));
var block_QMARK_ = (function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.uuid_string_QMARK_.call(null,page_name));
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(whiteboard_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var contents_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_name,"contents");
var public_QMARK_ = ((db_based_QMARK_)?new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939).cljs$core$IFn$_invoke$arity$1(page):cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(page,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"public","public",1566243851)], null)));
var _favorites_updated_QMARK_ = frontend.state.sub(new cljs.core.Keyword("favorites","updated?","favorites/updated?",-1904365701));
var favorited_QMARK_ = frontend.handler.page.favorited_QMARK_(page_title);
var developer_mode_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null));
var file_rpath = (cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$1(page_name):null);
var _ = frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946));
var file_sync_graph_uuid = (function (){var and__5000__auto__ = frontend.handler.user.logged_in_QMARK_();
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.handler.file_sync.enable_sync_QMARK_();
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = frontend.handler.file_sync.current_graph_sync_on_QMARK_();
if(cljs.core.truth_(and__5000__auto____$2)){
return frontend.handler.file_sync.get_current_graph_uuid();
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
if(cljs.core.not(block_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.flatten(new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [((frontend.config.publishing_QMARK_)?null:new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),((favorited_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","unfavorite","page/unfavorite",578994300)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","add-to-favorites","page/add-to-favorites",-641181093)], 0))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(favorited_QMARK_){
return frontend.handler.page._LT_unfavorite_page_BANG_(page_title);
} else {
return frontend.handler.page._LT_favorite_page_BANG_(page_title);
}
})], null)], null)),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return file_sync_graph_uuid;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","version-history","page/version-history",-664927562)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(file_sync_graph_uuid)){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","pick-page-histories","graph/pick-page-histories",2080848727),file_sync_graph_uuid,page_name], null));
} else {
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.handler.shell.get_file_latest_git_log(page,(100));
} else {
return null;

}
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),"cp__btn_history_version"], null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","copy-page-url","page/copy-page-url",-1474029803)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$1(((db_based_QMARK_)?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page):page_title));
})], null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = contents_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.config.publishing_QMARK_;
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto__;
}
}
}
})())?null:new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","delete","page/delete",-1774686917)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.page_menu.delete_page_confirm_BANG_(page);
})], null)], null)),(cljs.core.truth_(file_rpath)?(function (){var repo_dir = frontend.config.get_repo_dir(repo);
var file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","open-in-finder","page/open-in-finder",-891703594)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openFileInFolder",file_fpath], 0));
})], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","open-with-default-app","page/open-with-default-app",2097221682)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.apis.openPath(file_fpath);
})], null)], null)], null);
})():null),(cljs.core.truth_(page)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-page","export-page",-2087621584)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__87558 = (function (){
return frontend.components.export$.export_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK_,new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"page","page",849072397)], null));
});
var G__87559 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-auto md:max-w-4xl max-h-[80vh] overflow-y-auto"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__87558,G__87559) : logseq.shui.ui.dialog_open_BANG_.call(null,G__87558,G__87559));
})], null)], null):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(public_QMARK_)?new cljs.core.Keyword("page","make-private","page/make-private",1298627280):new cljs.core.Keyword("page","make-public","page/make-public",1736118164))], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.page.update_public_attribute_BANG_(repo,page,(cljs.core.truth_(public_QMARK_)?false:true));
})], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = file_rpath;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(frontend.handler.file_sync.synced_file_graph_QMARK_(repo));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","open-backup-directory","page/open-backup-directory",-197993503)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openFileBackupDir",frontend.config.get_local_dir(repo),file_rpath], 0));
})], null)], null):null),(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)?(function (){var iter__5480__auto__ = (function frontend$components$page_menu$page_menu_$_iter__87560(s__87561){
return (new cljs.core.LazySeq(null,(function (){
var s__87561__$1 = s__87561;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__87561__$1);
if(temp__5804__auto____$1){
var s__87561__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__87561__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__87561__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__87563 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__87562 = (0);
while(true){
if((i__87562 < size__5479__auto__)){
var vec__87571 = cljs.core._nth(c__5478__auto__,i__87562);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87571,(0),null);
var map__87574 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87571,(1),null);
var map__87574__$1 = cljs.core.__destructure_map(map__87574);
var cmd = map__87574__$1;
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87574__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87571,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87571,(3),null);
cljs.core.chunk_append(b__87563,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__87562,vec__87571,___$1,map__87574,map__87574__$1,cmd,label,action,pid,c__5478__auto__,size__5479__auto__,b__87563,s__87561__$2,temp__5804__auto____$1,repo,db_based_QMARK_,page_title,whiteboard_QMARK_,block_QMARK_,contents_QMARK_,public_QMARK_,_favorites_updated_QMARK_,favorited_QMARK_,developer_mode_QMARK_,file_rpath,_,file_sync_graph_uuid,page_name,temp__5804__auto__){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"page","page",849072397),page_name),action);
});})(i__87562,vec__87571,___$1,map__87574,map__87574__$1,cmd,label,action,pid,c__5478__auto__,size__5479__auto__,b__87563,s__87561__$2,temp__5804__auto____$1,repo,db_based_QMARK_,page_title,whiteboard_QMARK_,block_QMARK_,contents_QMARK_,public_QMARK_,_favorites_updated_QMARK_,favorited_QMARK_,developer_mode_QMARK_,file_rpath,_,file_sync_graph_uuid,page_name,temp__5804__auto__))
], null)], null));

var G__87633 = (i__87562 + (1));
i__87562 = G__87633;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__87563),frontend$components$page_menu$page_menu_$_iter__87560(cljs.core.chunk_rest(s__87561__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__87563),null);
}
} else {
var vec__87575 = cljs.core.first(s__87561__$2);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87575,(0),null);
var map__87578 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87575,(1),null);
var map__87578__$1 = cljs.core.__destructure_map(map__87578);
var cmd = map__87578__$1;
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87578__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87575,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87575,(3),null);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__87575,___$1,map__87578,map__87578__$1,cmd,label,action,pid,s__87561__$2,temp__5804__auto____$1,repo,db_based_QMARK_,page_title,whiteboard_QMARK_,block_QMARK_,contents_QMARK_,public_QMARK_,_favorites_updated_QMARK_,favorited_QMARK_,developer_mode_QMARK_,file_rpath,_,file_sync_graph_uuid,page_name,temp__5804__auto__){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"page","page",849072397),page_name),action);
});})(vec__87575,___$1,map__87578,map__87578__$1,cmd,label,action,pid,s__87561__$2,temp__5804__auto____$1,repo,db_based_QMARK_,page_title,whiteboard_QMARK_,block_QMARK_,contents_QMARK_,public_QMARK_,_favorites_updated_QMARK_,favorited_QMARK_,developer_mode_QMARK_,file_rpath,_,file_sync_graph_uuid,page_name,temp__5804__auto__))
], null)], null),frontend$components$page_menu$page_menu_$_iter__87560(cljs.core.rest(s__87561__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.state.get_plugins_commands_with_type(new cljs.core.Keyword(null,"page-menu-item","page-menu-item",1913872913)));
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.internal_page_QMARK_.call(null,page));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","convert-to-tag","page/convert-to-tag",204854632)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.page.convert_to_tag_BANG_(page);
})], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","convert-tag-to-page","page/convert-tag-to-page",-1816977130)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.page.convert_tag_to_page_BANG_(page);
})], null)], null):null),(cljs.core.truth_(developer_mode_QMARK_)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-page-data","dev/show-page-data",727860802)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.common.developer.show_entity_data(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page));
})], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = developer_mode_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(db_based_QMARK_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-page-ast","dev/show-page-ast",1834625593)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var page__$1 = (function (){var G__87583 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","content","file/content",12680964)], null)], null)], null);
var G__87584 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$2(G__87583,G__87584) : frontend.db.pull.call(null,G__87583,G__87584));
})();
return frontend.handler.common.developer.show_content_ast(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(page__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Keyword("file","content","file/content",12680964)], null)),cljs.core.get.cljs$core$IFn$_invoke$arity$3(page__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
})], null)], null):null)], null)));
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.components.page_menu.js.map
