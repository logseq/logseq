goog.provide('frontend.util.page');
/**
 * Fetch the current page's original name with same approach as get-current-page-id
 */
frontend.util.page.get_current_page_name = (function frontend$util$page$get_current_page_name(){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__105476 = frontend.state.get_current_page();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__105476) : frontend.db.get_page.call(null,G__105476));
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.first(frontend.state.get_editor_args()),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","title","block/title",710445684)], null));
}
});
/**
 * Fetch the current page's uuid with same approach as get-current-page-id
 */
frontend.util.page.get_current_page_uuid = (function frontend$util$page$get_current_page_uuid(){
var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__105477 = frontend.state.get_current_page();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__105477) : frontend.db.get_page.call(null,G__105477));
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.first(frontend.state.get_editor_args()),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}
});
/**
 * Fetches the current page id. Looks up page based on latest route and if
 *   nothing is found, gets page of last edited block
 */
frontend.util.page.get_current_page_id = (function frontend$util$page$get_current_page_id(){
var page_name = frontend.state.get_current_page();
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
});
/**
 * Gets the file path of a page. If no page is given, detects the current page.
 * Returns nil if no file path is found or no page is detected or given
 */
frontend.util.page.get_page_file_rpath = (function frontend$util$page$get_page_file_rpath(var_args){
var G__105479 = arguments.length;
switch (G__105479) {
case 0:
return frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$0 = (function (){
var temp__5804__auto__ = frontend.util.page.get_current_page_id();
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(page_id) : frontend.db.entity.call(null,page_id)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Keyword("file","path","file/path",-191335748)], null));
} else {
return null;
}
}));

(frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$1 = (function (page_name){
var temp__5804__auto__ = (function (){var G__105480 = page_name;
if((G__105480 == null)){
return null;
} else {
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__105480) : frontend.util.page_name_sanity_lc.call(null,G__105480));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page_name_SINGLEQUOTE_ = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name_SINGLEQUOTE_) : frontend.db.get_page.call(null,page_name_SINGLEQUOTE_)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Keyword("file","path","file/path",-191335748)], null));
} else {
return null;
}
}));

(frontend.util.page.get_page_file_rpath.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=frontend.util.page.js.map
