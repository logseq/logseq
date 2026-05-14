goog.provide('frontend.handler.db_based.editor');
frontend.handler.db_based.editor.remove_non_existed_refs_BANG_ = (function frontend$handler$db_based$editor$remove_non_existed_refs_BANG_(refs){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (x){
var or__5002__auto__ = ((cljs.core.vector_QMARK_(x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(x))) && (((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(x) : frontend.db.entity.call(null,x)) == null)))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(x);
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var G__102616 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x);
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__102616) : frontend.util.uuid_string_QMARK_.call(null,G__102616));
})();
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(and__5000__auto____$2)){
return ((function (){var G__102617 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102617) : frontend.db.entity.call(null,G__102617));
})() == null);
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
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (x == null);
}
}
}),refs);
});
frontend.handler.db_based.editor.use_cached_refs_BANG_ = (function frontend$handler$db_based$editor$use_cached_refs_BANG_(refs,block){
var refs__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__102618_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__102618_SHARP_));
}),refs);
var cached_refs = (function (){var G__102619 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var G__102620 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
return cljs.core.select_keys(ref,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684)], null));
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1((function (){var G__102621 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102621) : frontend.db.entity.call(null,G__102621));
})())),cljs.core.deref(new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
return (frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2(G__102619,G__102620) : frontend.util.distinct_by_last_wins.call(null,G__102619,G__102620));
})();
var title__GT_ref = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),cached_refs),cached_refs);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(x);
if(and__5000__auto__){
var G__102622 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x);
return (title__GT_ref.cljs$core$IFn$_invoke$arity$1 ? title__GT_ref.cljs$core$IFn$_invoke$arity$1(G__102622) : title__GT_ref.call(null,G__102622));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var ref = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ref,new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508),new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508).cljs$core$IFn$_invoke$arity$1(x));
} else {
return x;
}
}),refs__$1);
});
frontend.handler.db_based.editor.wrap_parse_block = (function frontend$handler$db_based$editor$wrap_parse_block(p__102623){
var map__102624 = p__102623;
var map__102624__$1 = cljs.core.__destructure_map(map__102624);
var block = map__102624__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102624__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102624__$1,new cljs.core.Keyword("block","level","block/level",1182509971));
var block__$1 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
var G__102625 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102625) : frontend.db.entity.call(null,G__102625));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var block__$2 = (((title == null))?block__$1:(function (){var ast = frontend.format.mldoc.__GT_edn(clojure.string.trim(title),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var first_elem_type = cljs.core.first(cljs.core.ffirst(ast));
var block_with_title_QMARK_ = (frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1(first_elem_type) : frontend.format.mldoc.block_with_title_QMARK_.call(null,first_elem_type));
var content_SINGLEQUOTE_ = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_block_pattern(new cljs.core.Keyword(null,"markdown","markdown",1227225089))),(cljs.core.truth_(block_with_title_QMARK_)?" ":"\n"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)].join('');
var parsed_block = frontend.format.block.parse_block(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_SINGLEQUOTE_));
var block_SINGLEQUOTE_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,parsed_block,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),title], null)], 0)),new cljs.core.Keyword("block","format","block/format",-1212045901));
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(block_SINGLEQUOTE_,new cljs.core.Keyword("block","refs","block/refs",-1214495349),(function (refs){
return frontend.handler.db_based.editor.use_cached_refs_BANG_(frontend.handler.db_based.editor.remove_non_existed_refs_BANG_(refs),block__$1);
}));
})());
var result = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$2,(cljs.core.truth_(level)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","level","block/level",1182509971),level], null):cljs.core.PersistentArrayMap.EMPTY)], 0)),new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.frontend.content.title_ref__GT_id_ref(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block__$2)));
return result;
});
/**
 * This fn is the db version of file-handler/alter-file
 */
frontend.handler.db_based.editor.save_file_BANG_ = (function frontend$handler$db_based$editor$save_file_BANG_(path,content){
var file_valid_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/config.edn"))?(function (){
frontend.handler.common.config_edn.detect_deprecations(path,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),true], null));

return frontend.handler.common.config_edn.validate_config_edn(path,content,frontend.schema.handler.repo_config.Config_edn);
})()
:true);
if(file_valid_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),content,new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(new Date()),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null)], null))),(function (___41611__auto__){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/config.edn"))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo_config.restore_repo_config_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),content)),(function (_){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577)], null)));
}));
})):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/custom.css"))?frontend.handler.ui.add_style_if_exists_BANG_():null)));
}));
}));
} else {
return null;
}
});
frontend.handler.db_based.editor.batch_set_heading_BANG_ = (function frontend$handler$db_based$editor$batch_set_heading_BANG_(repo,block_ids,heading){
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__102626_102652 = cljs.core.seq(block_ids);
var chunk__102627_102653 = null;
var count__102628_102654 = (0);
var i__102629_102655 = (0);
while(true){
if((i__102629_102655 < count__102628_102654)){
var id_102656 = chunk__102627_102653.cljs$core$IIndexed$_nth$arity$2(null,i__102629_102655);
var e_102657 = (function (){var G__102634 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_102656], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102634) : frontend.db.entity.call(null,G__102634));
})();
var title_102658 = (function (){var G__102635 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_102657);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__102635) : frontend.commands.clear_markdown_heading.call(null,G__102635));
})();
var block_102659 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_102657),new cljs.core.Keyword("block","title","block/title",710445684),title_102658], null);
frontend.modules.outliner.op.save_block_BANG_(block_102659);


var G__102660 = seq__102626_102652;
var G__102661 = chunk__102627_102653;
var G__102662 = count__102628_102654;
var G__102663 = (i__102629_102655 + (1));
seq__102626_102652 = G__102660;
chunk__102627_102653 = G__102661;
count__102628_102654 = G__102662;
i__102629_102655 = G__102663;
continue;
} else {
var temp__5804__auto___102664 = cljs.core.seq(seq__102626_102652);
if(temp__5804__auto___102664){
var seq__102626_102665__$1 = temp__5804__auto___102664;
if(cljs.core.chunked_seq_QMARK_(seq__102626_102665__$1)){
var c__5525__auto___102666 = cljs.core.chunk_first(seq__102626_102665__$1);
var G__102667 = cljs.core.chunk_rest(seq__102626_102665__$1);
var G__102668 = c__5525__auto___102666;
var G__102669 = cljs.core.count(c__5525__auto___102666);
var G__102670 = (0);
seq__102626_102652 = G__102667;
chunk__102627_102653 = G__102668;
count__102628_102654 = G__102669;
i__102629_102655 = G__102670;
continue;
} else {
var id_102671 = cljs.core.first(seq__102626_102665__$1);
var e_102672 = (function (){var G__102636 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_102671], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102636) : frontend.db.entity.call(null,G__102636));
})();
var title_102673 = (function (){var G__102637 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_102672);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__102637) : frontend.commands.clear_markdown_heading.call(null,G__102637));
})();
var block_102674 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_102672),new cljs.core.Keyword("block","title","block/title",710445684),title_102673], null);
frontend.modules.outliner.op.save_block_BANG_(block_102674);


var G__102675 = cljs.core.next(seq__102626_102665__$1);
var G__102676 = null;
var G__102677 = (0);
var G__102678 = (0);
seq__102626_102652 = G__102675;
chunk__102627_102653 = G__102676;
count__102628_102654 = G__102677;
i__102629_102655 = G__102678;
continue;
}
} else {
}
}
break;
}

return frontend.handler.property.batch_set_block_property_BANG_(repo,block_ids,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415),heading);
} else {
var _STAR_outliner_ops_STAR__orig_val__102638 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__102639 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__102639);

try{var seq__102640_102679 = cljs.core.seq(block_ids);
var chunk__102641_102680 = null;
var count__102642_102681 = (0);
var i__102643_102682 = (0);
while(true){
if((i__102643_102682 < count__102642_102681)){
var id_102683 = chunk__102641_102680.cljs$core$IIndexed$_nth$arity$2(null,i__102643_102682);
var e_102684 = (function (){var G__102648 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_102683], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102648) : frontend.db.entity.call(null,G__102648));
})();
var title_102685 = (function (){var G__102649 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_102684);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__102649) : frontend.commands.clear_markdown_heading.call(null,G__102649));
})();
var block_102686 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_102684),new cljs.core.Keyword("block","title","block/title",710445684),title_102685], null);
frontend.modules.outliner.op.save_block_BANG_(block_102686);


var G__102687 = seq__102640_102679;
var G__102688 = chunk__102641_102680;
var G__102689 = count__102642_102681;
var G__102690 = (i__102643_102682 + (1));
seq__102640_102679 = G__102687;
chunk__102641_102680 = G__102688;
count__102642_102681 = G__102689;
i__102643_102682 = G__102690;
continue;
} else {
var temp__5804__auto___102691 = cljs.core.seq(seq__102640_102679);
if(temp__5804__auto___102691){
var seq__102640_102692__$1 = temp__5804__auto___102691;
if(cljs.core.chunked_seq_QMARK_(seq__102640_102692__$1)){
var c__5525__auto___102693 = cljs.core.chunk_first(seq__102640_102692__$1);
var G__102694 = cljs.core.chunk_rest(seq__102640_102692__$1);
var G__102695 = c__5525__auto___102693;
var G__102696 = cljs.core.count(c__5525__auto___102693);
var G__102697 = (0);
seq__102640_102679 = G__102694;
chunk__102641_102680 = G__102695;
count__102642_102681 = G__102696;
i__102643_102682 = G__102697;
continue;
} else {
var id_102698 = cljs.core.first(seq__102640_102692__$1);
var e_102699 = (function (){var G__102650 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_102698], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102650) : frontend.db.entity.call(null,G__102650));
})();
var title_102700 = (function (){var G__102651 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_102699);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__102651) : frontend.commands.clear_markdown_heading.call(null,G__102651));
})();
var block_102701 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_102699),new cljs.core.Keyword("block","title","block/title",710445684),title_102700], null);
frontend.modules.outliner.op.save_block_BANG_(block_102701);


var G__102702 = cljs.core.next(seq__102640_102692__$1);
var G__102703 = null;
var G__102704 = (0);
var G__102705 = (0);
seq__102640_102679 = G__102702;
chunk__102641_102680 = G__102703;
count__102642_102681 = G__102704;
i__102643_102682 = G__102705;
continue;
}
} else {
}
}
break;
}

frontend.handler.property.batch_set_block_property_BANG_(repo,block_ids,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415),heading);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__102638);
}}
});

//# sourceMappingURL=frontend.handler.db_based.editor.js.map
