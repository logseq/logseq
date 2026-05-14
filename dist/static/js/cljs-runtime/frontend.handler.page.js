goog.provide('frontend.handler.page');
goog.scope(function(){
  frontend.handler.page.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.page._LT_create_BANG_ = frontend.handler.common.page._LT_create_BANG_;
frontend.handler.page._LT_delete_BANG_ = frontend.handler.common.page._LT_delete_BANG_;
frontend.handler.page._LT_unfavorite_page_BANG_ = (function frontend$handler$page$_LT_unfavorite_page_BANG_(page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
if(cljs.core.truth_(temp__5804__auto__)){
var page_block_uuid = temp__5804__auto__;
return frontend.handler.common.page._LT_db_unfavorite_page_BANG_(page_block_uuid);
} else {
return null;
}
} else {
return frontend.handler.common.page.file_unfavorite_page_BANG_(page_name);
}
})()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.update_favorites_updated_BANG_());
}));
}));
});
frontend.handler.page._LT_favorite_page_BANG_ = (function frontend$handler$page$_LT_favorite_page_BANG_(page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
if(cljs.core.truth_(temp__5804__auto__)){
var page_block_uuid = temp__5804__auto__;
return frontend.handler.common.page._LT_db_favorite_page_BANG_(page_block_uuid);
} else {
return null;
}
} else {
return frontend.handler.common.page.file_favorite_page_BANG_(page_name);
}
})()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.update_favorites_updated_BANG_());
}));
}));
});
frontend.handler.page.favorited_QMARK_ = (function frontend$handler$page$favorited_QMARK_(page_name){
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return cljs.core.boolean$((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
if(cljs.core.truth_(temp__5804__auto__)){
var page_block_uuid = temp__5804__auto__;
return frontend.handler.common.page.db_favorited_QMARK_(page_block_uuid);
} else {
return null;
}
})());
} else {
return frontend.handler.common.page.file_favorited_QMARK_(page_name);
}
});
/**
 * return page-block entities
 */
frontend.handler.page.get_favorites = (function frontend$handler$page$get_favorites(){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var temp__5804__auto____$1 = logseq.db.get_page(db,logseq.common.config.favorites_page_name);
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
var blocks = logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(page));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block){
var temp__5804__auto____$2 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(temp__5804__auto____$2)){
var block_db_id = temp__5804__auto____$2;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,block_db_id) : datascript.core.entity.call(null,db,block_db_id));
} else {
return null;
}
}),blocks);
} else {
return null;
}
} else {
var page_names = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.util.safe_page_name_sanity_lc,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0())))));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (page_name){
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
}),page_names);
}
} else {
return null;
}
});
frontend.handler.page.toggle_favorite_BANG_ = (function frontend$handler$page$toggle_favorite_BANG_(){
var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
if(frontend.handler.page.favorited_QMARK_(page_name)){
return frontend.handler.page._LT_unfavorite_page_BANG_(page_name);
} else {
return frontend.handler.page._LT_favorite_page_BANG_(page_name);
}
} else {
return null;
}
});
frontend.handler.page.rename_BANG_ = (function frontend$handler$page$rename_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105568 = arguments.length;
var i__5727__auto___105569 = (0);
while(true){
if((i__5727__auto___105569 < len__5726__auto___105568)){
args__5732__auto__.push((arguments[i__5727__auto___105569]));

var G__105570 = (i__5727__auto___105569 + (1));
i__5727__auto___105569 = G__105570;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.page.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.page.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (page_uuid_or_old_name,new_name,p__105500){
var map__105501 = p__105500;
var map__105501__$1 = cljs.core.__destructure_map(map__105501);
var _opts = map__105501__$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.uuid_QMARK_(page_uuid_or_old_name))?page_uuid_or_old_name:((logseq.common.util.uuid_string_QMARK_(page_uuid_or_old_name))?page_uuid_or_old_name:new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid_or_old_name) : frontend.db.get_page.call(null,page_uuid_or_old_name)))
))),(function (page_uuid){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.rename_page_BANG_(page_uuid,new_name);
} else {
var _STAR_outliner_ops_STAR__orig_val__105502 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__105503 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__105503);

try{frontend.modules.outliner.op.rename_page_BANG_(page_uuid,new_name);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__105502);
}}
})()),(function (result){
return promesa.protocols._promise((function (){var G__105504 = ((typeof result === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(result):result);
var G__105504__$1 = (((G__105504 instanceof cljs.core.Keyword))?G__105504.fqn:null);
switch (G__105504__$1) {
case "invalid-empty-name":
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please use a valid name, empty name is not allowed!",new cljs.core.Keyword(null,"warning","warning",-1685650671));

break;
case "rename-page-exists":
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Another page with the new name exists already",new cljs.core.Keyword(null,"warning","warning",-1685650671));

break;
default:
return null;

}
})());
}));
}));
}));
}));

(frontend.handler.page.rename_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.page.rename_BANG_.cljs$lang$applyTo = (function (seq105497){
var G__105498 = cljs.core.first(seq105497);
var seq105497__$1 = cljs.core.next(seq105497);
var G__105499 = cljs.core.first(seq105497__$1);
var seq105497__$2 = cljs.core.next(seq105497__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__105498,G__105499,seq105497__$2);
}));

frontend.handler.page._LT_reorder_favorites_BANG_ = (function frontend$handler$page$_LT_reorder_favorites_BANG_(favorites){
var conn = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false);
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.favorites_page_name) : frontend.db.get_page.call(null,logseq.common.config.favorites_page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var favorites_page = temp__5804__auto__;
var favorite_page_block_db_id_coll = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (page_uuid){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid) : frontend.db.get_page.call(null,page_uuid)));
}),favorites);
var current_blocks = logseq.db.sort_by_order(logseq.db.get_page_blocks(cljs.core.deref(conn),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(favorites_page)));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__105505 = cljs.core.seq(cljs.core.zipmap(favorite_page_block_db_id_coll,current_blocks));
var chunk__105506 = null;
var count__105507 = (0);
var i__105508 = (0);
while(true){
if((i__105508 < count__105507)){
var vec__105515 = chunk__105506.cljs$core$IIndexed$_nth$arity$2(null,i__105508);
var page_block_db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105515,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105515,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page_block_db_id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block)))){
frontend.modules.outliner.op.save_block_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","link","block/link",-1872399993),page_block_db_id));
} else {
}


var G__105572 = seq__105505;
var G__105573 = chunk__105506;
var G__105574 = count__105507;
var G__105575 = (i__105508 + (1));
seq__105505 = G__105572;
chunk__105506 = G__105573;
count__105507 = G__105574;
i__105508 = G__105575;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__105505);
if(temp__5804__auto____$1){
var seq__105505__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__105505__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__105505__$1);
var G__105576 = cljs.core.chunk_rest(seq__105505__$1);
var G__105577 = c__5525__auto__;
var G__105578 = cljs.core.count(c__5525__auto__);
var G__105579 = (0);
seq__105505 = G__105576;
chunk__105506 = G__105577;
count__105507 = G__105578;
i__105508 = G__105579;
continue;
} else {
var vec__105518 = cljs.core.first(seq__105505__$1);
var page_block_db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105518,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105518,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page_block_db_id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block)))){
frontend.modules.outliner.op.save_block_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","link","block/link",-1872399993),page_block_db_id));
} else {
}


var G__105580 = cljs.core.next(seq__105505__$1);
var G__105581 = null;
var G__105582 = (0);
var G__105583 = (0);
seq__105505 = G__105580;
chunk__105506 = G__105581;
count__105507 = G__105582;
i__105508 = G__105583;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__105521 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__105522 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__105522);

try{var seq__105523_105584 = cljs.core.seq(cljs.core.zipmap(favorite_page_block_db_id_coll,current_blocks));
var chunk__105524_105585 = null;
var count__105525_105586 = (0);
var i__105526_105587 = (0);
while(true){
if((i__105526_105587 < count__105525_105586)){
var vec__105533_105588 = chunk__105524_105585.cljs$core$IIndexed$_nth$arity$2(null,i__105526_105587);
var page_block_db_id_105589 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105533_105588,(0),null);
var block_105590 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105533_105588,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page_block_db_id_105589,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block_105590)))){
frontend.modules.outliner.op.save_block_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block_105590,new cljs.core.Keyword("block","link","block/link",-1872399993),page_block_db_id_105589));
} else {
}


var G__105591 = seq__105523_105584;
var G__105592 = chunk__105524_105585;
var G__105593 = count__105525_105586;
var G__105594 = (i__105526_105587 + (1));
seq__105523_105584 = G__105591;
chunk__105524_105585 = G__105592;
count__105525_105586 = G__105593;
i__105526_105587 = G__105594;
continue;
} else {
var temp__5804__auto___105595__$1 = cljs.core.seq(seq__105523_105584);
if(temp__5804__auto___105595__$1){
var seq__105523_105596__$1 = temp__5804__auto___105595__$1;
if(cljs.core.chunked_seq_QMARK_(seq__105523_105596__$1)){
var c__5525__auto___105597 = cljs.core.chunk_first(seq__105523_105596__$1);
var G__105598 = cljs.core.chunk_rest(seq__105523_105596__$1);
var G__105599 = c__5525__auto___105597;
var G__105600 = cljs.core.count(c__5525__auto___105597);
var G__105601 = (0);
seq__105523_105584 = G__105598;
chunk__105524_105585 = G__105599;
count__105525_105586 = G__105600;
i__105526_105587 = G__105601;
continue;
} else {
var vec__105536_105602 = cljs.core.first(seq__105523_105596__$1);
var page_block_db_id_105603 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105536_105602,(0),null);
var block_105604 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105536_105602,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page_block_db_id_105603,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block_105604)))){
frontend.modules.outliner.op.save_block_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block_105604,new cljs.core.Keyword("block","link","block/link",-1872399993),page_block_db_id_105603));
} else {
}


var G__105605 = cljs.core.next(seq__105523_105596__$1);
var G__105606 = null;
var G__105607 = (0);
var G__105608 = (0);
seq__105523_105584 = G__105605;
chunk__105524_105585 = G__105606;
count__105525_105586 = G__105607;
i__105526_105587 = G__105608;
continue;
}
} else {
}
}
break;
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"reorder-favorites","reorder-favorites",2116551193)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"reorder-favorites","reorder-favorites",2116551193)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__105521);
}}
})()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.update_favorites_updated_BANG_());
}));
}));
} else {
return null;
}
});
frontend.handler.page.update_public_attribute_BANG_ = (function frontend$handler$page$update_public_attribute_BANG_(repo,page,value){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939),value);
} else {
return frontend.handler.file_based.page_property.add_property_BANG_(page,new cljs.core.Keyword(null,"public","public",1566243851),value);
}
});
frontend.handler.page.get_page_ref_text = (function frontend$handler$page$get_page_ref_text(page){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(page) : frontend.util.ref.__GT_page_ref.call(null,page));
} else {
return frontend.handler.file_based.page.get_page_ref_text(page);
}
});
frontend.handler.page.init_commands_BANG_ = (function frontend$handler$page$init_commands_BANG_(){
return frontend.commands.init_commands_BANG_(frontend.handler.page.get_page_ref_text);
});
frontend.handler.page.rebuild_slash_commands_list_BANG_ = goog.functions.debounce(frontend.handler.page.init_commands_BANG_,(1500));
frontend.handler.page._LT_template_exists_QMARK_ = (function frontend$handler$page$_LT_template_exists_QMARK_(title){
if(cljs.core.truth_(title)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_templates(frontend.state.get_current_repo())),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.keys(result)),(function (templates){
return promesa.protocols._promise(((cljs.core.seq(templates))?(function (){var templates__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,templates);
return cljs.core.contains_QMARK_(cljs.core.set(templates__$1),clojure.string.lower_case(title));
})():null));
}));
}));
}));
} else {
return null;
}
});
frontend.handler.page.ls_dir_files_BANG_ = (function frontend$handler$page$ls_dir_files_BANG_(var_args){
var G__105540 = arguments.length;
switch (G__105540) {
case 1:
return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (ok_handler){
return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2(ok_handler,null);
}));

(frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (ok_handler,opts){
return frontend.handler.file_based.native_fs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$2((function (e){
frontend.handler.page.init_commands_BANG_();

if(cljs.core.truth_(ok_handler)){
(ok_handler.cljs$core$IFn$_invoke$arity$1 ? ok_handler.cljs$core$IFn$_invoke$arity$1(e) : ok_handler.call(null,e));
} else {
}

return frontend.handler.graph.settle_metadata_to_local_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),Date.now()], null));
}),opts);
}));

(frontend.handler.page.ls_dir_files_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.page.file_based_save_filter_BANG_ = (function frontend$handler$page$file_based_save_filter_BANG_(page,filter_state){
return frontend.handler.property.add_page_property_BANG_(page,new cljs.core.Keyword(null,"filters","filters",974726919),filter_state);
});
frontend.handler.page.db_based_save_filter_BANG_ = (function frontend$handler$page$db_based_save_filter_BANG_(page,filter_page_id,p__105541){
var map__105542 = p__105541;
var map__105542__$1 = cljs.core.__destructure_map(map__105542);
var include_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105542__$1,new cljs.core.Keyword(null,"include?","include?",859165569));
var add_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105542__$1,new cljs.core.Keyword(null,"add?","add?",1263018409));
var repo = frontend.state.get_current_repo();
var property_id = (cljs.core.truth_(include_QMARK_)?new cljs.core.Keyword("logseq.property.linked-references","includes","logseq.property.linked-references/includes",1680577703):new cljs.core.Keyword("logseq.property.linked-references","excludes","logseq.property.linked-references/excludes",242675889));
if(cljs.core.truth_(add_QMARK_)){
return frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),property_id,filter_page_id);
} else {
return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),property_id,filter_page_id);
}
});
frontend.handler.page.page_not_exists_handler = (function frontend$handler$page$page_not_exists_handler(input,id,q,current_pos){
frontend.state.clear_editor_action_BANG_();

if(cljs.core.truth_(frontend.state.org_mode_file_link_QMARK_(frontend.state.get_current_repo()))){
var page_ref_text = frontend.handler.page.get_page_ref_text(q);
var value = frontend.handler.page.goog$module$goog$object.get(input,"value");
var old_page_ref = (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(q) : frontend.util.ref.__GT_page_ref.call(null,q));
var new_value = clojure.string.replace(value,old_page_ref,page_ref_text);
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(id,new_value);

var new_pos = ((current_pos + (cljs.core.count(page_ref_text) - cljs.core.count(old_page_ref))) + (2));
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);
} else {
var current_selected = frontend.util.get_selected_text();
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2(input,((2) + cljs.core.count(current_selected)));
}
});
frontend.handler.page.tag_on_chosen_handler = (function frontend$handler$page$tag_on_chosen_handler(input,id,pos,format,current_pos,edit_content,q,db_based_QMARK_){
return (function (chosen_result,e){
frontend.util.stop(e);

frontend.state.clear_editor_action_BANG_();

var chosen_result__$1 = (cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_result))?(function (){var G__105543 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__105543) : frontend.db.entity.call(null,G__105543));
})():chosen_result);
var target = cljs.core.first(new cljs.core.Keyword("block","_alias","block/_alias",444442061).cljs$core$IFn$_invoke$arity$1(chosen_result__$1));
var chosen_result__$2 = (cljs.core.truth_((function (){var and__5000__auto__ = target;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(chosen_result__$1) : logseq.db.class_QMARK_.call(null,chosen_result__$1)));
if(and__5000__auto____$1){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(target) : logseq.db.class_QMARK_.call(null,target));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?target:chosen_result__$1);
var chosen = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(chosen_result__$2);
var class_QMARK_ = (function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = clojure.string.includes_QMARK_(chosen,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-tag","new-tag",2029496964)], 0)))," "].join(''));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(chosen_result__$2) : logseq.db.class_QMARK_.call(null,chosen_result__$2));
}
} else {
return and__5000__auto__;
}
})();
var inline_tag_QMARK_ = (function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.identifier,"auto-complete/meta-complete");
} else {
return and__5000__auto__;
}
})();
var chosen__$1 = clojure.string.replace_first(clojure.string.replace_first(chosen,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-tag","new-tag",2029496964)], 0)))," "].join(''),""),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-page","new-page",1691458376)], 0)))," "].join(''),"");
var wrapped_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.left_brackets,logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,(pos - (2)),pos));
var chosen_last_part = (cljs.core.truth_((logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(chosen__$1) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,chosen__$1)))?(logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1(chosen__$1) : logseq.graph_parser.text.get_namespace_last_part.call(null,chosen__$1)):chosen__$1);
var wrapped_tag = (cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__105544 = /\s+/;
var G__105545 = chosen_last_part;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__105544,G__105545) : frontend.util.safe_re_find.call(null,G__105544,G__105545));
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(wrapped_QMARK_));
} else {
return and__5000__auto__;
}
})())?(frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(chosen_last_part) : frontend.util.ref.__GT_page_ref.call(null,chosen_last_part)):chosen_last_part);
var q__$1 = (cljs.core.truth_(frontend.handler.editor.get_selected_text())?"":q);
var last_pattern = ((wrapped_QMARK_)?q__$1:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",cljs.core.first(q__$1)))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(q__$1,(1)):q__$1));
var last_pattern__$1 = ["#",((wrapped_QMARK_)?logseq.common.util.page_ref.left_brackets:null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(last_pattern)].join('');
var tag_in_page_auto_complete_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.right_brackets,logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,current_pos,(current_pos + (2))));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__105546 = id;
var G__105547 = (cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(inline_tag_QMARK_);
} else {
return and__5000__auto__;
}
})())?"":["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapped_tag)].join(''));
var G__105548 = format;
var G__105549 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),last_pattern__$1,new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),((wrapped_QMARK_)?logseq.common.util.page_ref.right_brackets:null),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)], null);
return (frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__105546,G__105547,G__105548,G__105549) : frontend.handler.editor.insert_command_BANG_.call(null,G__105546,G__105547,G__105548,G__105549));
})()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(tag_in_page_auto_complete_QMARK_));
} else {
return and__5000__auto__;
}
})())?frontend.handler.db_based.page.tag_on_chosen_handler(chosen__$1,chosen_result__$2,class_QMARK_,edit_content,current_pos,last_pattern__$1):null)),(function (___41611__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(input)?input.focus():null));
}));
}));
}));
});
});
frontend.handler.page.page_on_chosen_handler = (function frontend$handler$page$page_on_chosen_handler(id,format,q,db_based_QMARK_){
return (function (chosen_result,e){
frontend.util.stop(e);

frontend.state.clear_editor_action_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_result))?(function (){var G__105550 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__105550) : frontend.db.entity.call(null,G__105550));
})():chosen_result)),(function (chosen_result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(chosen_result__$1)),(function (chosen){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.replace_first(chosen,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-page","new-page",1691458376)], 0)))," "].join(''),"")),(function (chosen_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"nlp-date?","nlp-date?",1961584384).cljs$core$IFn$_invoke$arity$1(chosen_result__$1);
if(cljs.core.truth_(and__5000__auto__)){
return (!(datascript.impl.entity.entity_QMARK_(chosen_result__$1)));
} else {
return and__5000__auto__;
}
})())?(function (){var temp__5804__auto__ = frontend.date.nld_parse(chosen_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto__)){
var result = temp__5804__auto__;
var d = (function (){var G__105551 = (new goog.date.DateTime());
G__105551.setTime(result.getTime());

return G__105551;
})();
var gd = (new goog.date.Date(d.getFullYear(),d.getMonth(),d.getDate()));
var page = frontend.date.js_date__GT_journal_title(gd);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page))], null);
} else {
return null;
}
})():null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [chosen_SINGLEQUOTE_,chosen_result__$1], null);
}
})()),(function (p__105552){
var vec__105553 = p__105552;
var chosen_SINGLEQUOTE___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105553,(0),null);
var chosen_result__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105553,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(((((datascript.impl.entity.entity_QMARK_(chosen_result__$2)) && (cljs.core.not((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(chosen_result__$2) : logseq.db.page_QMARK_.call(null,chosen_result__$2))))))?(function (){var G__105556 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_result__$2);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__105556) : frontend.util.ref.__GT_page_ref.call(null,G__105556));
})():frontend.handler.page.get_page_ref_text(chosen_SINGLEQUOTE___$1))),(function (ref_text){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?((datascript.impl.entity.entity_QMARK_(chosen_result__$2))?null:(function (){var G__105557 = chosen_SINGLEQUOTE___$1;
var G__105558 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161),true], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__105557,G__105558) : frontend.handler.page._LT_create_BANG_.call(null,G__105557,G__105558));
})()):null)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(result)?(function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(result);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(title) : frontend.util.ref.__GT_page_ref.call(null,title));
})():ref_text)),(function (ref_text_SINGLEQUOTE_){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__105559 = id;
var G__105560 = ref_text_SINGLEQUOTE_;
var G__105561 = format;
var G__105562 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[logseq.common.util.page_ref.left_brackets,cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(frontend.handler.editor.get_selected_text())?"":q))].join(''),new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),logseq.common.util.page_ref.right_brackets,new cljs.core.Keyword(null,"postfix-fn","postfix-fn",-1393704144),(function (s){
return frontend.util.replace_first(logseq.common.util.page_ref.right_brackets,s,"");
}),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)], null);
return (frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__105559,G__105560,G__105561,G__105562) : frontend.handler.editor.insert_command_BANG_.call(null,G__105559,G__105560,G__105561,G__105562));
})()),(function (___41611__auto__){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = result;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return chosen_result__$2;
}
})()),(function (chosen_result__$3){
return promesa.protocols._promise(((datascript.impl.entity.entity_QMARK_(chosen_result__$3))?frontend.state.conj_block_ref_BANG_(chosen_result__$3):null));
}));
})));
}));
})));
}));
}));
}));
}));
}));
}));
}));
}));
});
});
frontend.handler.page.on_chosen_handler = (function frontend$handler$page$on_chosen_handler(input,id,pos,format){
var current_pos = frontend.util.cursor.pos(input);
var edit_content = frontend.state.get_edit_content();
var action = frontend.state.get_editor_action();
var hashtag_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(action,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
var q = (function (){var or__5002__auto__ = frontend.handler.editor.get_selected_text();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((hashtag_QMARK_)?logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
if((cljs.core.count(edit_content) > current_pos)){
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos);
} else {
return null;
}
}
}
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(hashtag_QMARK_){
return frontend.handler.page.tag_on_chosen_handler(input,id,pos,format,current_pos,edit_content,q,db_based_QMARK_);
} else {
return frontend.handler.page.page_on_chosen_handler(id,format,q,db_based_QMARK_);
}
});
frontend.handler.page.create_today_journal_BANG_ = (function frontend$handler$page$create_today_journal_BANG_(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(((frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) && (((cljs.core.not(new cljs.core.Keyword("graph","loading?","graph/loading?",1937181019).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))) && (((cljs.core.not(new cljs.core.Keyword("graph","importing","graph/importing",1647644617).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))) && (((cljs.core.not(frontend.state.loading_files_QMARK_(repo))) && ((!(frontend.config.publishing_QMARK_))))))))))){
frontend.state.set_today_BANG_(frontend.date.today());

if(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) || (((frontend.config.local_file_based_graph_QMARK_(repo)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.config.demo_repo,repo)) && (cljs.core.not(frontend.mobile.util.native_platform_QMARK_())))))))){
var title = frontend.date.today();
var today_page = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(title) : frontend.util.page_name_sanity_lc.call(null,title));
var format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$1(repo);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var create_f = (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__105563 = title;
var G__105564 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161),false,new cljs.core.Keyword(null,"today-journal?","today-journal?",-388258460),true], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__105563,G__105564) : frontend.handler.page._LT_create_BANG_.call(null,G__105563,G__105564));
})()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((db_based_QMARK_)?null:frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("journal","insert-template","journal/insert-template",-1273735332),today_page], null)))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto____$2){
return promesa.protocols._promise(frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"today-journal-created","today-journal-created",-908154954),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),today_page], null)));
}));
}));
}));
}));
});
if(cljs.core.truth_((frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2(repo,today_page) : frontend.db.page_empty_QMARK_.call(null,repo,today_page)))){
if(db_based_QMARK_){
if(cljs.core.truth_(frontend.db.model.get_journal_page(title))){
return null;
} else {
return create_f();
}
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.date.journal_title__GT_default(title)),(function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_journals_directory()),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_name),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_file_extension(format))].join('')),(function (file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,file_rpath)),(function (file_exists_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_exists_QMARK_)?frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,file_rpath):null)),(function (file_content){
return promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(file_exists_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = file_exists_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(file_content);
} else {
return and__5000__auto__;
}
}
})())?create_f():null));
}));
}));
}));
}));
}));
}));
}
} else {
return null;
}
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
frontend.handler.page.open_today_in_sidebar = (function frontend$handler$page$open_today_in_sidebar(){
var temp__5804__auto__ = (function (){var G__105565 = frontend.date.today();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__105565) : frontend.db.get_page.call(null,G__105565));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"page","page",849072397));
} else {
return null;
}
});
frontend.handler.page.open_file_in_default_app = (function frontend$handler$page$open_file_in_default_app(){
var temp__5802__auto__ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$0();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var file_rpath = temp__5802__auto__;
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0));
return window.apis.openPath(file_fpath);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No file found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
/**
 * FIXME: clarify usage, copy file or copy file path
 */
frontend.handler.page.copy_current_file = (function frontend$handler$page$copy_current_file(){
var temp__5802__auto__ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$0();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var file_rpath = temp__5802__auto__;
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0));
return frontend.util.copy_to_clipboard_BANG_(file_fpath);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No file found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
frontend.handler.page.open_file_in_directory = (function frontend$handler$page$open_file_in_directory(){
var temp__5802__auto__ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$0();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var file_rpath = temp__5802__auto__;
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0));
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openFileInFolder",file_fpath], 0));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No file found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
frontend.handler.page.copy_page_url = (function frontend$handler$page$copy_page_url(var_args){
var G__105567 = arguments.length;
switch (G__105567) {
case 0:
return frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$0 = (function (){
var id = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?frontend.util.page.get_current_page_uuid():frontend.util.page.get_current_page_name());
return frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$1(id);
}));

(frontend.handler.page.copy_page_url.cljs$core$IFn$_invoke$arity$1 = (function (page_uuid){
if(cljs.core.truth_(page_uuid)){
return frontend.util.copy_to_clipboard_BANG_(frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$3(null,frontend.state.get_current_repo(),cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid)));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No page found to copy",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
}));

(frontend.handler.page.copy_page_url.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=frontend.handler.page.js.map
