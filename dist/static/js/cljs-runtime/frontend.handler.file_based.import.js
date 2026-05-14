goog.provide('frontend.handler.file_based.import$');
/**
 * Create file structure, then parse into DB (client only)
 */
frontend.handler.file_based.import$.index_files_BANG_ = (function frontend$handler$file_based$import$index_files_BANG_(repo,files,finish_handler){
var titles = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"title","title",636505583),files));
var files__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (file){
var title = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(file);
var journal_QMARK_ = frontend.date.valid_journal_title_QMARK_(title);
var temp__5804__auto__ = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(file);
if(cljs.core.truth_(temp__5804__auto__)){
var text = temp__5804__auto__;
var title__$1 = (function (){var or__5002__auto__ = ((journal_QMARK_)?frontend.date.journal_title__GT_default(title):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.replace(title,"/","-");
}
})();
var title__$2 = clojure.string.replace(logseq.common.util.page_name_sanity(title__$1),"\n"," ");
var path = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((journal_QMARK_)?frontend.config.get_journals_directory():frontend.config.get_pages_directory())),"/",title__$2,".md"].join('');
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),text], null);
} else {
return null;
}
}),files);
var files__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,files__$1);
frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_(repo,files__$2,null);

var files_131138__$3 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131136){
var map__131137 = p__131136;
var map__131137__$1 = cljs.core.__destructure_map(map__131137);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131137__$1,new cljs.core.Keyword("file","path","file/path",-191335748));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131137__$1,new cljs.core.Keyword("file","content","file/content",12680964));
if(cljs.core.truth_(path)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path,content], null);
} else {
return null;
}
}),files__$2));
frontend.handler.file_based.file.alter_files(repo,files_131138__$3,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"add-history?","add-history?",1354241628),false,new cljs.core.Keyword(null,"update-db?","update-db?",-1641846808),false,new cljs.core.Keyword(null,"update-status?","update-status?",-1878751221),false,new cljs.core.Keyword(null,"finish-handler","finish-handler",770511735),finish_handler], null));

var journal_pages_tx = (function (){var titles__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.date.normalize_journal_title,titles);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (title){
var day = frontend.date.journal_title__GT_int(title);
var journal_title = logseq.common.util.date_time.int__GT_journal_title(day,frontend.state.get_date_formatter());
if(cljs.core.truth_(journal_title)){
var page_name = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(journal_title) : frontend.util.page_name_sanity_lc.call(null,journal_title));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("block","name","block/name",1619760316),page_name,new cljs.core.Keyword("block","type","block/type",1537584409),"journal",new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),day], null);
} else {
return null;
}
}),titles__$1);
})();
if(cljs.core.seq(journal_pages_tx)){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo,journal_pages_tx);
} else {
return null;
}
});
frontend.handler.file_based.import$.import_from_roam_json_BANG_ = (function frontend$handler$file_based$import$import_from_roam_json_BANG_(data,finished_ok_handler){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var files = frontend.external.to_markdown_files(new cljs.core.Keyword(null,"roam","roam",-1785859900),data,cljs.core.PersistentArrayMap.EMPTY);
return frontend.handler.file_based.import$.index_files_BANG_(repo,files,(function (){
return (finished_ok_handler.cljs$core$IFn$_invoke$arity$0 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$0() : finished_ok_handler.call(null));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.file_based.import.js.map
