goog.provide('frontend.modules.outliner.pipeline');
frontend.modules.outliner.pipeline.update_editing_block_title_if_changed_BANG_ = (function frontend$modules$outliner$pipeline$update_editing_block_title_if_changed_BANG_(tx_data){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var editing_block = temp__5804__auto__;
var editing_title = frontend.state.get_edit_content();
var temp__5804__auto____$1 = cljs.core.some((function (d){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(editing_block));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(editing_title),clojure.string.trim(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)));
if(and__5000__auto____$2){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return d;
} else {
return null;
}
}),tx_data);
if(cljs.core.truth_(temp__5804__auto____$1)){
var d = temp__5804__auto____$1;
var temp__5804__auto____$2 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__125804 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__125804) : frontend.db.entity.call(null,G__125804));
})());
if(cljs.core.truth_(temp__5804__auto____$2)){
var new_title = temp__5804__auto____$2;
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$1(new_title);
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
frontend.modules.outliner.pipeline.invoke_hooks = (function frontend$modules$outliner$pipeline$invoke_hooks(p__125805){
var map__125806 = p__125805;
var map__125806__$1 = cljs.core.__destructure_map(map__125806);
var _request_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"_request-id","_request-id",1710398801));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var deleted_block_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"deleted-block-uuids","deleted-block-uuids",-1589082500));
var deleted_assets = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"deleted-assets","deleted-assets",888060039));
var affected_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"affected-keys","affected-keys",-2138165094));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125806__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var map__125807 = tx_meta;
var map__125807__$1 = cljs.core.__destructure_map(map__125807);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125807__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125807__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var initial_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125807__$1,new cljs.core.Keyword(null,"initial-pages?","initial-pages?",1229670725));
var end_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125807__$1,new cljs.core.Keyword(null,"end?","end?",-1423391609));
var tx_report = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,frontend.state.get_current_repo())){
if(cljs.core.seq(deleted_block_uuids)){
var ids_125816 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__125808 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__125808) : frontend.db.entity.call(null,G__125808));
})());
}),deleted_block_uuids);
frontend.state.sidebar_remove_deleted_block_BANG_(ids_125816);
} else {
}

var conn_125817 = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(repo,false) : frontend.db.get_db.call(null,repo,false));
if(cljs.core.truth_(initial_pages_QMARK_)){
if(cljs.core.truth_(goog.DEBUG)){
var k__99485__auto___125818 = "transact initial-pages";
console.time(k__99485__auto___125818);

var res__99486__auto___125819 = (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn_125817,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn_125817,tx_data,tx_meta));
console.timeEnd(k__99485__auto___125818);

} else {
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn_125817,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn_125817,tx_data,tx_meta));
}

if(cljs.core.truth_(end_QMARK_)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("init","commands","init/commands",315507426)], null));

frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
}
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = from_disk_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new_graph_QMARK_;
}
})())){
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn_125817,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn_125817,tx_data,tx_meta));

frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("db","latest-transacted-entity-uuids","db/latest-transacted-entity-uuids",-64055438),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"updated-ids","updated-ids",554327170),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks)),new cljs.core.Keyword(null,"deleted-ids","deleted-ids",1049955241),cljs.core.set(deleted_block_uuids)], null));

var tx_data_SINGLEQUOTE__125820 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null)], null);
}),deleted_block_uuids),((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),null,new cljs.core.Keyword(null,"create-property-text-block","create-property-text-block",1772697260),null], null), null),new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta)))?(function (){var update_blocks_fully_loaded = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datom){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),true], null);
} else {
return null;
}
}),tx_data);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(update_blocks_fully_loaded,tx_data);
})():tx_data));
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn_125817,tx_data_SINGLEQUOTE__125820,tx_meta) : datascript.core.transact_BANG_.call(null,conn_125817,tx_data_SINGLEQUOTE__125820,tx_meta));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
} else {
frontend.modules.outliner.pipeline.update_editing_block_title_if_changed_BANG_(tx_data);
}

if(cljs.core.seq(deleted_assets)){
var seq__125810_125821 = cljs.core.seq(deleted_assets);
var chunk__125811_125822 = null;
var count__125812_125823 = (0);
var i__125813_125824 = (0);
while(true){
if((i__125813_125824 < count__125812_125823)){
var asset_125825 = chunk__125811_125822.cljs$core$IIndexed$_nth$arity$2(null,i__125813_125824);
frontend.fs.unlink_BANG_(repo,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_current_repo_assets_root(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_125825)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ext","ext",-996964541).cljs$core$IFn$_invoke$arity$1(asset_125825))].join('')], 0)),cljs.core.PersistentArrayMap.EMPTY);


var G__125826 = seq__125810_125821;
var G__125827 = chunk__125811_125822;
var G__125828 = count__125812_125823;
var G__125829 = (i__125813_125824 + (1));
seq__125810_125821 = G__125826;
chunk__125811_125822 = G__125827;
count__125812_125823 = G__125828;
i__125813_125824 = G__125829;
continue;
} else {
var temp__5804__auto___125830 = cljs.core.seq(seq__125810_125821);
if(temp__5804__auto___125830){
var seq__125810_125831__$1 = temp__5804__auto___125830;
if(cljs.core.chunked_seq_QMARK_(seq__125810_125831__$1)){
var c__5525__auto___125832 = cljs.core.chunk_first(seq__125810_125831__$1);
var G__125833 = cljs.core.chunk_rest(seq__125810_125831__$1);
var G__125834 = c__5525__auto___125832;
var G__125835 = cljs.core.count(c__5525__auto___125832);
var G__125836 = (0);
seq__125810_125821 = G__125833;
chunk__125811_125822 = G__125834;
count__125812_125823 = G__125835;
i__125813_125824 = G__125836;
continue;
} else {
var asset_125837 = cljs.core.first(seq__125810_125831__$1);
frontend.fs.unlink_BANG_(repo,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_current_repo_assets_root(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_125837)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ext","ext",-996964541).cljs$core$IFn$_invoke$arity$1(asset_125837))].join('')], 0)),cljs.core.PersistentArrayMap.EMPTY);


var G__125838 = cljs.core.next(seq__125810_125831__$1);
var G__125839 = null;
var G__125840 = (0);
var G__125841 = (0);
seq__125810_125821 = G__125838;
chunk__125811_125822 = G__125839;
count__125812_125823 = G__125840;
i__125813_125824 = G__125841;
continue;
}
} else {
}
}
break;
}
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537),null);

if(cljs.core.truth_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
} else {
frontend.db.react.refresh_BANG_(repo,affected_keys);

if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.seq(blocks)) && ((cljs.core.count(blocks) <= (1000))));
} else {
return and__5000__auto__;
}
})())){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","hook-db-tx","plugin/hook-db-tx",1065547419),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks,new cljs.core.Keyword(null,"deleted-assets","deleted-assets",888060039),deleted_assets,new cljs.core.Keyword(null,"deleted-block-uuids","deleted-block-uuids",-1589082500),deleted_block_uuids,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(tx_report)], null)], null));
} else {
}
}

}
}
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770))){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","deleted","page/deleted",-523428622),repo,new cljs.core.Keyword(null,"deleted-page","deleted-page",-665410015).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"file-path","file-path",-2005501162).cljs$core$IFn$_invoke$arity$1(tx_meta),tx_meta], null));
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","renamed","page/renamed",-1655115736),repo,new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(tx_meta)], null));
} else {
return null;
}
});

//# sourceMappingURL=frontend.modules.outliner.pipeline.js.map
