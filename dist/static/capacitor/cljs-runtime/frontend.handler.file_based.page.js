goog.provide('frontend.handler.file_based.page');
frontend.handler.file_based.page.get_directory = (function frontend$handler$file_based$page$get_directory(journal_QMARK_){
if(cljs.core.truth_(journal_QMARK_)){
return frontend.config.get_journals_directory();
} else {
return frontend.config.get_pages_directory();
}
});
frontend.handler.file_based.page.get_file_name = (function frontend$handler$file_based$page$get_file_name(journal_QMARK_,title){
var temp__5804__auto__ = (cljs.core.truth_(journal_QMARK_)?frontend.date.journal_title__GT_default(title):logseq.common.util.page_name_sanity(clojure.string.lower_case(title)));
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(s,(0),(200));
} else {
return null;
}
});
frontend.handler.file_based.page.get_page_ref_text = (function frontend$handler$file_based$page$get_page_ref_text(page){
var edit_block_file_path = frontend.db.file_based.model.get_block_file_path(frontend.state.get_edit_block());
var page_name = clojure.string.lower_case(page);
if(cljs.core.truth_((function (){var and__5000__auto__ = edit_block_file_path;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.org_mode_file_link_QMARK_(frontend.state.get_current_repo());
} else {
return and__5000__auto__;
}
})())){
var temp__5802__auto__ = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$1(page_name));
if(cljs.core.truth_(temp__5802__auto__)){
var ref_file_path = temp__5802__auto__;
var G__66040 = "[[file:%s][%s]]";
var G__66041 = frontend.util.get_relative_path(edit_block_file_path,ref_file_path);
var G__66042 = page;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__66040,G__66041,G__66042) : frontend.util.format.call(null,G__66040,G__66041,G__66042));
} else {
var journal_QMARK_ = frontend.date.valid_journal_title_QMARK_(page);
var ref_file_path = [(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?[clojure.string.replace(decodeURI(frontend.config.get_repo_dir(frontend.state.get_current_repo())),/\/+$/,""),"/"].join(''):""),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.file_based.page.get_directory(journal_QMARK_)),"/",frontend.handler.file_based.page.get_file_name(journal_QMARK_,page),".org"].join('');
frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null));

var G__66045 = "[[file:%s][%s]]";
var G__66046 = frontend.util.get_relative_path(edit_block_file_path,ref_file_path);
var G__66047 = page;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__66045,G__66046,G__66047) : frontend.util.format.call(null,G__66045,G__66046,G__66047));
}
} else {
return logseq.common.util.page_ref.__GT_page_ref(page);
}
});

//# sourceMappingURL=frontend.handler.file_based.page.js.map
