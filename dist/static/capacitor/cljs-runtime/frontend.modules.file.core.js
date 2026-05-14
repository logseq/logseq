goog.provide('frontend.modules.file.core');
frontend.modules.file.core.tree__GT_file_content = (function frontend$modules$file$core$tree__GT_file_content(tree,opts){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
var context = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),frontend.state.get_export_bullet_indentation()], null);
return frontend.common.file.core.tree__GT_file_content(repo,db,tree,opts,context);
} else {
return null;
}
});

//# sourceMappingURL=frontend.modules.file.core.js.map
