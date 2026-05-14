goog.provide('frontend.handler.common.page');
/**
 * Tags might have multiple words
 */
frontend.handler.common.page.wrap_tags = (function frontend$handler$common$page$wrap_tags(title){
var parts = clojure.string.split.cljs$core$IFn$_invoke$arity$2(title,/ #/);
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(" #",cljs.core.cons(cljs.core.first(parts),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (s){
if(((clojure.string.includes_QMARK_(s," ")) && ((!(logseq.common.util.page_ref.page_ref_QMARK_(s)))))){
return logseq.common.util.page_ref.__GT_page_ref(s);
} else {
return s;
}
}),cljs.core.rest(parts))));
});
frontend.handler.common.page._LT_create_BANG_ = (function frontend$handler$common$page$_LT_create_BANG_(var_args){
var G__65353 = arguments.length;
switch (G__65353) {
case 1:
return frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (title){
return frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(title,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (title,p__65354){
var map__65355 = p__65354;
var map__65355__$1 = cljs.core.__destructure_map(map__65355);
var options = map__65355__$1;
var redirect_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65355__$1,new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),true);
var today_journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65355__$1,new cljs.core.Keyword(null,"today-journal?","today-journal?",-388258460));
if(typeof title === 'string'){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)),(function (db_based_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(title," #");
} else {
return and__5000__auto__;
}
})())?frontend.handler.common.page.wrap_tags(title):title)),(function (title__$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.db_based.editor.wrap_parse_block(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),title__$1], null)):null)),(function (parsed_result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(parsed_result));
} else {
return and__5000__auto__;
}
})()),(function (has_tags_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(has_tags_QMARK_)?(function (){var G__65356 = cljs.core.first(logseq.common.util.split_first(["#",logseq.common.util.page_ref.left_brackets].join(''),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(parsed_result)));
if((G__65356 == null)){
return null;
} else {
return clojure.string.trim(G__65356);
}
})():title__$1)),(function (title_SINGLEQUOTE_){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = has_tags_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (title_SINGLEQUOTE_ == null);
} else {
return and__5000__auto__;
}
})())?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Page name can't include \"#\".",new cljs.core.Keyword(null,"warning","warning",-1685650671)):((clojure.string.blank_QMARK_(title_SINGLEQUOTE_))?null:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?(function (){var G__65357 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(options,new cljs.core.Keyword(null,"tags","tags",1771418977),cljs.core.concat,new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(parsed_result));
if((new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161).cljs$core$IFn$_invoke$arity$1(options) == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__65357,new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161),true);
} else {
return G__65357;
}
})():options)),(function (options_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.create_page_BANG_(title_SINGLEQUOTE_,options_SINGLEQUOTE_);
} else {
var _STAR_outliner_ops_STAR__orig_val__65360 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65361 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65361);

try{frontend.modules.outliner.op.create_page_BANG_(title_SINGLEQUOTE_,options_SINGLEQUOTE_);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65360);
}}
})()),(function (p__65371){
var vec__65372 = p__65371;
var _page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65372,(0),null);
var page_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65372,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65376 = (function (){var or__5002__auto__ = page_uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title_SINGLEQUOTE_;
}
})();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__65376) : frontend.db.get_page.call(null,G__65376));
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(redirect_QMARK_)?(function (){
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(page_uuid);

if(cljs.core.truth_(today_journal_QMARK_)){
return null;
} else {
return setTimeout((function (){
var temp__5804__auto__ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__65351_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)),dommy.core.attr(p1__65351_SHARP_,"data-blockId"));
}),dommy.utils.__GT_Array(document.getElementsByClassName("block-add-button"))));
if(cljs.core.truth_(temp__5804__auto__)){
var block_add_button = temp__5804__auto__;
return block_add_button.click();
} else {
return null;
}
}),(200));
}
})()
:null)),(function (___40947__auto__){
return promesa.protocols._promise(page);
}));
}));
}));
}));
})))));
}));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
}));

(frontend.handler.common.page._LT_create_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.common.page.file_favorited_QMARK_ = (function frontend$handler$common$page$file_favorited_QMARK_(page_name){
var favorites = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0()))));
return cljs.core.contains_QMARK_(favorites,clojure.string.lower_case(page_name));
});
frontend.handler.common.page.file_favorite_page_BANG_ = (function frontend$handler$common$page$file_favorite_page_BANG_(page_name){
if(clojure.string.blank_QMARK_(page_name)){
return null;
} else {
var favorites = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(page_name,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})())));
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"favorites","favorites",1740773480),favorites);
}
});
frontend.handler.common.page.file_unfavorite_page_BANG_ = (function frontend$handler$common$page$file_unfavorite_page_BANG_(page_name){
if(clojure.string.blank_QMARK_(page_name)){
return null;
} else {
var old_favorites = new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
var new_favorites = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__65384_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(p1__65384_SHARP_),clojure.string.lower_case(page_name));
}),old_favorites));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_favorites,new_favorites)){
return null;
} else {
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"favorites","favorites",1740773480),new_favorites);
}
}
});
frontend.handler.common.page.find_block_in_favorites_page = (function frontend$handler$common$page$find_block_in_favorites_page(page_block_uuid){
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.favorites_page_name) : frontend.db.get_page.call(null,logseq.common.config.favorites_page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var blocks = logseq.db.get_page_blocks(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page));
var temp__5804__auto____$1 = (function (){var G__65386 = db;
var G__65387 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65386,G__65387) : datascript.core.entity.call(null,G__65386,G__65387));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_block_entity = temp__5804__auto____$1;
return cljs.core.some((function (block){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block_entity))){
return block;
} else {
return null;
}
}),blocks);
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.common.page.db_favorited_QMARK_ = (function frontend$handler$common$page$db_favorited_QMARK_(page_block_uuid){
if(cljs.core.uuid_QMARK_(page_block_uuid)){
} else {
throw (new Error("Assert failed: (uuid? page-block-uuid)"));
}

return (!((frontend.handler.common.page.find_block_in_favorites_page(page_block_uuid) == null)));
});
frontend.handler.common.page._LT_db_favorite_page_BANG_ = (function frontend$handler$common$page$_LT_db_favorite_page_BANG_(page_block_uuid){
if(cljs.core.uuid_QMARK_(page_block_uuid)){
} else {
throw (new Error("Assert failed: (uuid? page-block-uuid)"));
}

if(cljs.core.truth_((function (){var G__65388 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
var G__65389 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65388,G__65389) : datascript.core.entity.call(null,G__65388,G__65389));
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1 ? logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1(page_block_uuid) : logseq.db.build_favorite_tx.call(null,page_block_uuid))], null),(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.favorites_page_name) : frontend.db.get_page.call(null,logseq.common.config.favorites_page_name)),cljs.core.PersistentArrayMap.EMPTY);
} else {
var _STAR_outliner_ops_STAR__orig_val__65395 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65396 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65396);

try{frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1 ? logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1(page_block_uuid) : logseq.db.build_favorite_tx.call(null,page_block_uuid))], null),(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.favorites_page_name) : frontend.db.get_page.call(null,logseq.common.config.favorites_page_name)),cljs.core.PersistentArrayMap.EMPTY);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65395);
}}
})());
}));
} else {
return null;
}
});
frontend.handler.common.page._LT_db_unfavorite_page_BANG_ = (function frontend$handler$common$page$_LT_db_unfavorite_page_BANG_(page_block_uuid){
if(cljs.core.uuid_QMARK_(page_block_uuid)){
} else {
throw (new Error("Assert failed: (uuid? page-block-uuid)"));
}

var temp__5804__auto__ = frontend.handler.common.page.find_block_in_favorites_page(page_block_uuid);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.delete_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
var _STAR_outliner_ops_STAR__orig_val__65412 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65413 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65413);

try{frontend.modules.outliner.op.delete_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),cljs.core.PersistentArrayMap.EMPTY);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65412);
}}
} else {
return null;
}
});
/**
 * Deletes a page. If delete is successful calls ok-handler. Otherwise calls error-handler
 * if given. Note that error-handler is being called in addition to error messages that worker
 * already provides
 */
frontend.handler.common.page._LT_delete_BANG_ = (function frontend$handler$common$page$_LT_delete_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___65471 = arguments.length;
var i__5727__auto___65472 = (0);
while(true){
if((i__5727__auto___65472 < len__5726__auto___65471)){
args__5732__auto__.push((arguments[i__5727__auto___65472]));

var G__65473 = (i__5727__auto___65472 + (1));
i__5727__auto___65472 = G__65473;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.common.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.common.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (page_uuid_or_name,ok_handler,p__65421){
var map__65422 = p__65421;
var map__65422__$1 = cljs.core.__destructure_map(map__65422);
var error_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65422__$1,new cljs.core.Keyword(null,"error-handler","error-handler",-484945776));
if(cljs.core.truth_(page_uuid_or_name)){
if(((cljs.core.uuid_QMARK_(page_uuid_or_name)) || (typeof page_uuid_or_name === 'string'))){
} else {
throw (new Error("Assert failed: (or (uuid? page-uuid-or-name) (string? page-uuid-or-name))"));
}

var temp__5804__auto__ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.uuid_QMARK_(page_uuid_or_name);
if(and__5000__auto__){
return page_uuid_or_name;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid_or_name) : frontend.db.get_page.call(null,page_uuid_or_name)));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page_uuid = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.deref(frontend.state._STAR_db_worker))){
var page = (function (){var G__65424 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65424) : frontend.db.entity.call(null,G__65424));
})();
var default_home = frontend.state.get_default_home();
var home_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(default_home));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((home_page_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"default-home","default-home",171104159),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(default_home,new cljs.core.Keyword(null,"page","page",849072397)))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-journals?","feature/enable-journals?",1609498182),true)),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Journals enabled",new cljs.core.Keyword(null,"success","success",1890645906)));
}));
}));
})):null)),(function (___40947__auto__){
return promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.delete_page_BANG_(page_uuid);
} else {
var _STAR_outliner_ops_STAR__orig_val__65425 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65426 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65426);

try{frontend.modules.outliner.op.delete_page_BANG_(page_uuid);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65425);
}}
})()),(function (res){
return promesa.protocols._promise((cljs.core.truth_(res)?(cljs.core.truth_(ok_handler)?(ok_handler.cljs$core$IFn$_invoke$arity$0 ? ok_handler.cljs$core$IFn$_invoke$arity$0() : ok_handler.call(null)):null):(cljs.core.truth_(error_handler)?(error_handler.cljs$core$IFn$_invoke$arity$0 ? error_handler.cljs$core$IFn$_invoke$arity$0() : error_handler.call(null)):null)));
}));
})),(function (error){
return console.error(error);
})));
}));
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
}));

(frontend.handler.common.page._LT_delete_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.common.page._LT_delete_BANG_.cljs$lang$applyTo = (function (seq65416){
var G__65417 = cljs.core.first(seq65416);
var seq65416__$1 = cljs.core.next(seq65416);
var G__65418 = cljs.core.first(seq65416__$1);
var seq65416__$2 = cljs.core.next(seq65416__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65417,G__65418,seq65416__$2);
}));

frontend.handler.common.page.after_page_deleted_BANG_ = (function frontend$handler$common$page$after_page_deleted_BANG_(repo,page_name,file_path,tx_meta){
var repo_dir = frontend.config.get_repo_dir(repo);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var temp__5804__auto___65474 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
if(cljs.core.truth_(temp__5804__auto___65474)){
var page_block_uuid_65475 = temp__5804__auto___65474;
frontend.handler.common.page._LT_db_unfavorite_page_BANG_(page_block_uuid_65475);
} else {
}
} else {
frontend.handler.common.page.file_unfavorite_page_BANG_(page_name);
}

if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),new cljs.core.Keyword(null,"real-outliner-op","real-outliner-op",1979985933).cljs$core$IFn$_invoke$arity$1(tx_meta))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__65441 = frontend.state.get_current_page();
if((G__65441 == null)){
return null;
} else {
return logseq.common.util.page_name_sanity_lc(G__65441);
}
})(),logseq.common.util.page_name_sanity_lc(page_name))))){
frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
}

frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();

if(cljs.core.truth_(file_path)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,file_path)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?frontend.fs.unlink_BANG_(repo,frontend.config.get_repo_fpath(repo,file_path),null):null));
}));
})),(function (error){
return console.error(error);
}));
} else {
return null;
}
});
/**
 * emit file-rename events to :file/rename-event-chan
 * force-fs? - when true, rename file event the db transact is failed.
 */
frontend.handler.common.page.rename_file_BANG_ = (function frontend$handler$common$page$rename_file_BANG_(old_path,new_path){
var repo = frontend.state.get_current_repo();
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.offer_file_rename_event_chan_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"old-path","old-path",-2069757806),old_path,new cljs.core.Keyword(null,"new-path","new-path",1732999939),new_path], null))),(function (_){
return promesa.protocols._promise(frontend.fs.rename_BANG_(repo,old_path,new_path));
}));
})),(function (error){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["file rename failed: ",error], 0));
}));
});
frontend.handler.common.page.after_page_renamed_BANG_ = (function frontend$handler$common$page$after_page_renamed_BANG_(repo,p__65444){
var map__65446 = p__65444;
var map__65446__$1 = cljs.core.__destructure_map(map__65446);
var page_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65446__$1,new cljs.core.Keyword(null,"page-id","page-id",-872941168));
var old_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65446__$1,new cljs.core.Keyword(null,"old-name","old-name",1289683869));
var new_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65446__$1,new cljs.core.Keyword(null,"new-name","new-name",1288355058));
var old_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65446__$1,new cljs.core.Keyword(null,"old-path","old-path",-2069757806));
var new_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65446__$1,new cljs.core.Keyword(null,"new-path","new-path",1732999939));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var old_page_name = logseq.common.util.page_name_sanity_lc(old_name);
var new_page_name = logseq.common.util.page_name_sanity_lc(new_name);
var redirect_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__65447 = frontend.state.get_current_page();
if((G__65447 == null)){
return null;
} else {
return logseq.common.util.page_name_sanity_lc(G__65447);
}
})(),logseq.common.util.page_name_sanity_lc(old_page_name));
var page = (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,page_id) : frontend.db.entity.call(null,repo,page_id));
if(((redirect_QMARK_) && (cljs.core.not((frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.whiteboard_page_QMARK_.call(null,page)))))){
frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"push","push",799791267),false,new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page))], null)], null));
} else {
}

if(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) && (frontend.handler.common.page.file_favorited_QMARK_(old_page_name)))){
frontend.handler.common.page.file_unfavorite_page_BANG_(old_page_name);

frontend.handler.common.page.file_favorite_page_BANG_(new_page_name);
} else {
}

var home_65476 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"default-home","default-home",171104159),cljs.core.PersistentArrayMap.EMPTY);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_page_name,logseq.common.util.page_name_sanity_lc(cljs.core.get.cljs$core$IFn$_invoke$arity$3(home_65476,new cljs.core.Keyword(null,"page","page",849072397),"")))){
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"default-home","default-home",171104159),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(home_65476,new cljs.core.Keyword(null,"page","page",849072397),new_name));
} else {
}

if(db_based_QMARK_){
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = old_path;
if(cljs.core.truth_(and__5000__auto__)){
return new_path;
} else {
return and__5000__auto__;
}
})())){
frontend.handler.common.page.rename_file_BANG_(old_path,new_path);
} else {
}
}

return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
});

//# sourceMappingURL=frontend.handler.common.page.js.map
