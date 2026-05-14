goog.provide('frontend.extensions.tldraw');
goog.scope(function(){
  frontend.extensions.tldraw.goog$module$goog$object = goog.module.get('goog.object');
});
var module$frontend$tldraw_logseq=shadow.js.require("module$frontend$tldraw_logseq", {});
frontend.extensions.tldraw.tldraw = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(frontend.extensions.tldraw.goog$module$goog$object.get(module$frontend$tldraw_logseq,"App"));
frontend.extensions.tldraw.generate_preview = frontend.extensions.tldraw.goog$module$goog$object.get(module$frontend$tldraw_logseq,"generateJSXFromModel");
frontend.extensions.tldraw.page_cp = rum.core.lazy_build(rum.core.build_defc,(function (props){
return frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-name","page-name",974981762),frontend.extensions.tldraw.goog$module$goog$object.get(props,"pageName"),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),true], null));
}),null,"frontend.extensions.tldraw/page-cp");
frontend.extensions.tldraw.block_cp = rum.core.lazy_build(rum.core.build_defc,(function (props){
var block_id = cljs.core.uuid(frontend.extensions.tldraw.goog$module$goog$object.get(props,"blockId"));
return daiquiri.interpreter.interpret((function (){var G__134484 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),true], null);
var G__134485 = block_id;
var fexpr__134483 = frontend.state.get_component(new cljs.core.Keyword("block","single-block","block/single-block",-1166935635));
return (fexpr__134483.cljs$core$IFn$_invoke$arity$2 ? fexpr__134483.cljs$core$IFn$_invoke$arity$2(G__134484,G__134485) : fexpr__134483.call(null,G__134484,G__134485));
})());
}),null,"frontend.extensions.tldraw/block-cp");
frontend.extensions.tldraw.breadcrumb = rum.core.lazy_build(rum.core.build_defc,(function (props){
return frontend.components.block.breadcrumb(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"preview?","preview?",590561578),true], null),frontend.state.get_current_repo(),cljs.core.uuid(frontend.extensions.tldraw.goog$module$goog$object.get(props,"blockId")),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"end-separator?","end-separator?",424414922),frontend.extensions.tldraw.goog$module$goog$object.get(props,"endSeparator"),new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),frontend.extensions.tldraw.goog$module$goog$object.get(props,"levelLimit",(3))], null));
}),null,"frontend.extensions.tldraw/breadcrumb");
frontend.extensions.tldraw.tweet = rum.core.lazy_build(rum.core.build_defc,(function (props){
return frontend.ui.tweet_embed(frontend.extensions.tldraw.goog$module$goog$object.get(props,"tweetId"));
}),null,"frontend.extensions.tldraw/tweet");
frontend.extensions.tldraw.block_reference = rum.core.lazy_build(rum.core.build_defc,(function (props){
return frontend.components.block.block_reference(cljs.core.PersistentArrayMap.EMPTY,frontend.extensions.tldraw.goog$module$goog$object.get(props,"blockId"),null);
}),null,"frontend.extensions.tldraw/block-reference");
frontend.extensions.tldraw.page_name_link = rum.core.lazy_build(rum.core.build_defc,(function (props){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.extensions.tldraw.goog$module$goog$object.get(props,"pageName");
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var temp__5804__auto____$1 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
return frontend.components.block.page_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"preview?","preview?",590561578),true], null),page);
} else {
return null;
}
} else {
return null;
}
})());
}),null,"frontend.extensions.tldraw/page-name-link");
frontend.extensions.tldraw.search_handler = (function frontend$extensions$tldraw$search_handler(q,filters){
var map__134487 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(filters,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], null)], 0));
var map__134487__$1 = cljs.core.__destructure_map(map__134487);
var blocks_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134487__$1,new cljs.core.Keyword(null,"blocks?","blocks?",58578620));
var repo = frontend.state.get_current_repo();
var limit = (100);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(blocks_QMARK_)?frontend.search.block_search(repo,q,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"limit","limit",-1355822363),limit], null)):null)),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.str),new cljs.core.Keyword("block","title","block/title",710445684),(function (p1__134486_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,frontend.util.text.cut_by(p1__134486_SHARP_,"$pfts_2lqh>$","$<pfts_2lqh$"));
}));
}),blocks)),(function (blocks__$1){
return promesa.protocols._promise(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks__$1], null)));
}));
}));
}));
});
frontend.extensions.tldraw.save_asset_handler = (function frontend$extensions$tldraw$save_asset_handler(file){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(file)], null)),(function (res){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(res);
if(and__5000__auto__){
return cljs.core.first(res);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var vec__134488 = temp__5804__auto__;
var asset_file_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134488,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134488,(1),null);
var full_file_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134488,(2),null);
return frontend.handler.file_based.editor.resolve_relative_path((function (){var or__5002__auto__ = full_file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return asset_file_name;
}
})());
} else {
return null;
}
}));
});
frontend.extensions.tldraw.references_count = (function frontend$extensions$tldraw$references_count(props){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.components.whiteboard.references_count,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (k){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(frontend.extensions.tldraw.goog$module$goog$object.get(props,k),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], null)], 0));
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["id","className","options"], null)));
});
frontend.extensions.tldraw.keyboard_shortcut = rum.core.lazy_build(rum.core.build_defc,(function (props){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs_bean.core.__GT_clj(props);
if(cljs.core.truth_(temp__5804__auto__)){
var props__$1 = temp__5804__auto__;
var map__134494 = props__$1;
var map__134494__$1 = cljs.core.__destructure_map(map__134494);
var action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134494__$1,new cljs.core.Keyword(null,"action","action",-811238024));
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134494__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
var opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134494__$1,new cljs.core.Keyword(null,"opts","opts",155075701));
var shortcut__$1 = ((typeof action === 'string')?frontend.ui.keyboard_shortcut_from_config(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(action)):shortcut);
var opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),false], null),opts], 0));
if(typeof shortcut__$1 === 'string'){
return frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts__$1], 0));
} else {
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__134492_SHARP_){
return frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(p1__134492_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts__$1], 0));
}),shortcut__$1));

}
} else {
return null;
}
})());
}),null,"frontend.extensions.tldraw/keyboard-shortcut");
frontend.extensions.tldraw.tldraw_renderers = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"Page","Page",-1267059506),frontend.extensions.tldraw.page_cp,new cljs.core.Keyword(null,"Block","Block",-1959785792),frontend.extensions.tldraw.block_cp,new cljs.core.Keyword(null,"Breadcrumb","Breadcrumb",-1351298906),frontend.extensions.tldraw.breadcrumb,new cljs.core.Keyword(null,"Tweet","Tweet",-452258680),frontend.extensions.tldraw.tweet,new cljs.core.Keyword(null,"PageName","PageName",-164991013),frontend.extensions.tldraw.page_name_link,new cljs.core.Keyword(null,"BacklinksCount","BacklinksCount",364670631),frontend.extensions.tldraw.references_count,new cljs.core.Keyword(null,"BlockReference","BlockReference",-120254741),frontend.extensions.tldraw.block_reference,new cljs.core.Keyword(null,"KeyboardShortcut","KeyboardShortcut",1250004264),frontend.extensions.tldraw.keyboard_shortcut], null);
frontend.extensions.tldraw.undo = (function frontend$extensions$tldraw$undo(){
return (frontend.handler.history.undo_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.history.undo_BANG_.cljs$core$IFn$_invoke$arity$1(null) : frontend.handler.history.undo_BANG_.call(null,null));
});
frontend.extensions.tldraw.redo = (function frontend$extensions$tldraw$redo(){
return (frontend.handler.history.redo_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.history.redo_BANG_.cljs$core$IFn$_invoke$arity$1(null) : frontend.handler.history.redo_BANG_.call(null,null));
});
frontend.extensions.tldraw.get_tldraw_handlers = (function frontend$extensions$tldraw$get_tldraw_handlers(current_whiteboard_uuid){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"getBlockPageName","getBlockPageName",-1656908032),new cljs.core.Keyword(null,"inflateAsset","inflateAsset",-1449040639),new cljs.core.Keyword(null,"getRedirectPageName","getRedirectPageName",-1858136925),new cljs.core.Keyword(null,"addNewPage","addNewPage",1998524678),new cljs.core.Keyword(null,"setCurrentPdf","setCurrentPdf",-63289336),new cljs.core.Keyword(null,"addNewWhiteboard","addNewWhiteboard",554297706),new cljs.core.Keyword(null,"isMobile","isMobile",-2043133877),new cljs.core.Keyword(null,"insertFirstPageBlock","insertFirstPageBlock",-1676658548),new cljs.core.Keyword(null,"isWhiteboardPage","isWhiteboardPage",-134150579),new cljs.core.Keyword(null,"search","search",1564939822),new cljs.core.Keyword(null,"saveAsset","saveAsset",-668047853),new cljs.core.Keyword(null,"makeAssetUrl","makeAssetUrl",217779988),new cljs.core.Keyword(null,"copyToClipboard","copyToClipboard",1092115063),new cljs.core.Keyword(null,"addNewBlock","addNewBlock",1426762680),new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"exportToImage","exportToImage",-154356643),new cljs.core.Keyword(null,"sidebarAddBlock","sidebarAddBlock",-1204903203),new cljs.core.Keyword(null,"redirectToPage","redirectToPage",87147838),new cljs.core.Keyword(null,"queryBlockByUUID","queryBlockByUUID",2091812895)],[(function (p1__134495_SHARP_){
var block_id_str = p1__134495_SHARP_;
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(block_id_str) : frontend.util.uuid_string_QMARK_.call(null,block_id_str)))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_block_page(frontend.state.get_current_repo(),cljs.core.parse_uuid(block_id_str))));
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(block_id_str) : frontend.db.get_page.call(null,block_id_str))));
}
}),(function (src){
return cljs.core.clj__GT_js(frontend.extensions.pdf.assets.inflate_asset(src));
}),(function (page_name_or_uuid){
return frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1(page_name_or_uuid);
}),(function (page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__134497 = page_name;
var G__134498 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__134497,G__134498) : frontend.handler.page._LT_create_BANG_.call(null,G__134497,G__134498));
})()),(function (result){
return promesa.protocols._promise(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)));
}));
}));
}),(function (src){
return frontend.state.set_current_pdf_BANG_((cljs.core.truth_(src)?frontend.extensions.pdf.assets.inflate_asset(src):null));
}),(function (page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$1(page_name)),(function (result){
return promesa.protocols._promise(cljs.core.str.cljs$core$IFn$_invoke$arity$1(result));
}));
}));
}),frontend.util.mobile_QMARK_,(function (page_name){
return frontend.handler.editor.insert_first_page_block_if_not_exists_BANG_(page_name);
}),(function (page_name){
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
return frontend.db.model.whiteboard_page_QMARK_(entity);
} else {
return null;
}
}),frontend.extensions.tldraw.search_handler,frontend.extensions.tldraw.save_asset_handler,frontend.handler.assets._LT_make_asset_url,(function (text,html){
return frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(text,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html","html",-998796897),html], 0));
}),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.whiteboard._LT_add_new_block_BANG_(current_whiteboard_uuid,content)),(function (new_block_id){
return promesa.protocols._promise(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_block_id));
}));
}));
}),(function (key){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key)], 0));
}),(function (page_uuid_str,options){
if(logseq.common.util.uuid_string_QMARK_(page_uuid_str)){
} else {
throw (new Error("Assert failed: (common-util/uuid-string? page-uuid-str)"));
}

var G__134501 = (function (){
return frontend.components.export$.export_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.uuid(page_uuid_str)], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),true], null)], 0)));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__134501) : logseq.shui.ui.dialog_open_BANG_.call(null,G__134501));
}),(function (uuid,type){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_page(uuid)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type));
}),(function (page_uuid_str){
if(cljs.core.truth_(page_uuid_str)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.parse_uuid(page_uuid_str)),(function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(block_id)?frontend.db.async._LT_get_block(frontend.state.get_current_repo(),block_id):null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = (cljs.core.truth_(block_id)?frontend.db.model.get_block_page(frontend.state.get_current_repo(),block_id):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid_str) : frontend.db.get_page.call(null,page_uuid_str));
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.model.whiteboard_page_QMARK_(page)),(function (whiteboard_QMARK_){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((((page == null))?(function (){var G__134507 = page_uuid_str;
var G__134508 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__134507,G__134508) : frontend.handler.page._LT_create_BANG_.call(null,G__134507,G__134508));
})():null)),(function (new_page){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = new_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page;
}
})()),(function (page_SINGLEQUOTE_){
return promesa.protocols._promise(frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_):frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_))),(cljs.core.truth_((function (){var and__5000__auto__ = block_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null):null)));
}));
}));
})));
}));
}));
}));
}));
}));
} else {
return null;
}
}),(function (block_uuid){
return cljs.core.clj__GT_js(frontend.db.model.query_block_by_uuid(block_uuid));
})]);
});
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.tldraw !== 'undefined') && (typeof frontend.extensions.tldraw._STAR_transact_result !== 'undefined')){
} else {
frontend.extensions.tldraw._STAR_transact_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.extensions.tldraw.on_persist = (function frontend$extensions$tldraw$on_persist(page_name,app,info){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(frontend.extensions.tldraw._STAR_transact_result)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("whiteboard","last-persisted-at","whiteboard/last-persisted-at",-669908968),frontend.state.get_current_repo()], null),(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.whiteboard._LT_transact_tldr_delta_BANG_(page_name,app,info));
}));
}))),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.extensions.tldraw._STAR_transact_result,result));
}));
}));
})),(function (error){
console.error(error);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["Save whiteboard failed, error:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.cause)].join('')], null));
}));
});
frontend.extensions.tldraw.tldraw_inner = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid,data,populate_onboarding_QMARK_,loaded_app,on_mount){
return daiquiri.core.create_element("div",{'style':{'overscrollBehavior':"none"},'onBlur':(function (e){
if(cljs.core.truth_((function (){var G__134533 = frontend.extensions.tldraw.goog$module$goog$object.get(e,"target").tagName;
var fexpr__134532 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["INPUT",null,"TEXTAREA",null], null), null);
return (fexpr__134532.cljs$core$IFn$_invoke$arity$1 ? fexpr__134532.cljs$core$IFn$_invoke$arity$1(G__134533) : fexpr__134532.call(null,G__134533));
})())){
return frontend.state.clear_edit_BANG_();
} else {
return null;
}
}),'onWheel':frontend.util.stop_propagation,'className':"draw tldraw whiteboard relative w-full h-full"},[(cljs.core.truth_((function (){var and__5000__auto__ = populate_onboarding_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(loaded_app);
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'style':{'zIndex':(200)},'className':"absolute inset-0 flex items-center justify-center"},[daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Loading onboarding whiteboard ..."))]):null),daiquiri.interpreter.interpret((function (){var G__134543 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"renderers","renderers",-1460292282),frontend.extensions.tldraw.tldraw_renderers,new cljs.core.Keyword(null,"handlers","handlers",79528781),frontend.extensions.tldraw.get_tldraw_handlers(page_uuid),new cljs.core.Keyword(null,"onMount","onMount",-876858467),on_mount,new cljs.core.Keyword(null,"readOnly","readOnly",-1749118317),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"onPersist","onPersist",-1848738852),(function (p1__134528_SHARP_,p2__134529_SHARP_){
return frontend.extensions.tldraw.on_persist(page_uuid,p1__134528_SHARP_,p2__134529_SHARP_);
}),new cljs.core.Keyword(null,"model","model",331153215),data], null);
return (frontend.extensions.tldraw.tldraw.cljs$core$IFn$_invoke$arity$1 ? frontend.extensions.tldraw.tldraw.cljs$core$IFn$_invoke$arity$1(G__134543) : frontend.extensions.tldraw.tldraw.call(null,G__134543));
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-remount","will-remount",-141604325),(function (old_state,new_state){
var page_uuid_134629 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state));
var old_data_134630 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state),(1));
var new_data_134631 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state),(1));
var old_shapes_134632 = (function (){var shapes = (function (){var G__134548 = frontend.extensions.tldraw.goog$module$goog$object.get(old_data_134630,"pages");
var G__134548__$1 = (((G__134548 == null))?null:cljs.core.first(G__134548));
if((G__134548__$1 == null)){
return null;
} else {
return frontend.extensions.tldraw.goog$module$goog$object.get(G__134548__$1,"shapes");
}
})();
return cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__134523_SHARP_){
return frontend.extensions.tldraw.goog$module$goog$object.get(p1__134523_SHARP_,"id");
}),shapes),shapes);
})();
var new_shapes_134633 = (function (){var G__134549 = frontend.extensions.tldraw.goog$module$goog$object.get(new_data_134631,"pages");
var G__134549__$1 = (((G__134549 == null))?null:cljs.core.first(G__134549));
if((G__134549__$1 == null)){
return null;
} else {
return frontend.extensions.tldraw.goog$module$goog$object.get(G__134549__$1,"shapes");
}
})();
var updated_shapes_134634 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (shape){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_shapes_134632,frontend.extensions.tldraw.goog$module$goog$object.get(shape,"id"));
if(cljs.core.truth_(temp__5804__auto__)){
var old = temp__5804__auto__;
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.extensions.tldraw.goog$module$goog$object.get(shape,"type"),frontend.extensions.tldraw.goog$module$goog$object.get(old,"type"));
} else {
return null;
}
}),new_shapes_134633);
if(cljs.core.seq(updated_shapes_134634)){
frontend.handler.whiteboard.update_shapes_BANG_(updated_shapes_134634);
} else {
}

frontend.handler.whiteboard.update_shapes_index_BANG_(page_uuid_134629);

return new_state;
})], null)], null),"frontend.extensions.tldraw/tldraw-inner");
frontend.extensions.tldraw.tldraw_app_react = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid,populate_onboarding_QMARK_,loaded_app,on_mount){
var data = frontend.handler.whiteboard.get_page_tldr(page_uuid);
if(cljs.core.truth_(data)){
return frontend.extensions.tldraw.tldraw_inner(page_uuid,data,populate_onboarding_QMARK_,loaded_app,on_mount);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.extensions.tldraw/tldraw-app-react");
frontend.extensions.tldraw.tldraw_app = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid,block_id){
var vec__134566 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(true) : logseq.shui.hooks.use_state.call(null,true));
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134566,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134566,(1),null);
var vec__134569 = rum.core.use_state(null);
var loaded_app = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134569,(0),null);
var set_loaded_app = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134569,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),page_uuid)),(function (___41611__auto__){
return promesa.protocols._promise((set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = loaded_app;
if(cljs.core.truth_(and__5000__auto__)){
return block_id;
} else {
return and__5000__auto__;
}
})())){
frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$2(loaded_app,block_id);
} else {
}

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id,loaded_app], null));

if(cljs.core.truth_(loading_QMARK_)){
return null;
} else {
var populate_onboarding_QMARK_ = frontend.handler.whiteboard.should_populate_onboarding_whiteboard_QMARK_(page_uuid);
var on_mount = (function (tln){
if(cljs.core.truth_(tln)){
(tln.appUndo = frontend.extensions.tldraw.undo);

(tln.appRedo = frontend.extensions.tldraw.redo);

var temp__5804__auto__ = frontend.extensions.tldraw.goog$module$goog$object.get(tln,"api");
if(cljs.core.truth_(temp__5804__auto__)){
var api = temp__5804__auto__;
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(((populate_onboarding_QMARK_)?frontend.handler.whiteboard.populate_onboarding_whiteboard(api):null),(function (){
frontend.handler.whiteboard.cleanup_BANG_(tln.currentPage);

frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$2(tln,block_id);

return (set_loaded_app.cljs$core$IFn$_invoke$arity$1 ? set_loaded_app.cljs$core$IFn$_invoke$arity$1(tln) : set_loaded_app.call(null,tln));
}));
} else {
return null;
}
} else {
return null;
}
});
return frontend.extensions.tldraw.tldraw_app_react(page_uuid,populate_onboarding_QMARK_,loaded_app,on_mount);
}
}),null,"frontend.extensions.tldraw/tldraw-app");

//# sourceMappingURL=frontend.extensions.tldraw.js.map
