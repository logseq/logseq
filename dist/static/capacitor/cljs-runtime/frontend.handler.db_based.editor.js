goog.provide('frontend.handler.db_based.editor');
frontend.handler.db_based.editor.remove_non_existed_refs_BANG_ = (function frontend$handler$db_based$editor$remove_non_existed_refs_BANG_(refs){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (x){
var or__5002__auto__ = ((cljs.core.vector_QMARK_(x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(x))) && (((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(x) : frontend.db.entity.call(null,x)) == null)))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(x);
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var G__63418 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x);
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__63418) : frontend.util.uuid_string_QMARK_.call(null,G__63418));
})();
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(and__5000__auto____$2)){
return ((function (){var G__63419 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63419) : frontend.db.entity.call(null,G__63419));
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
var refs__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__63420_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__63420_SHARP_));
}),refs);
var cached_refs = (function (){var G__63421 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var G__63422 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
return cljs.core.select_keys(ref,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684)], null));
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1((function (){var G__63423 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63423) : frontend.db.entity.call(null,G__63423));
})())),cljs.core.deref(new cljs.core.Keyword("editor","block-refs","editor/block-refs",-2016894855).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
return (frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2(G__63421,G__63422) : frontend.util.distinct_by_last_wins.call(null,G__63421,G__63422));
})();
var title__GT_ref = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),cached_refs),cached_refs);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(x);
if(and__5000__auto__){
var G__63424 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x);
return (title__GT_ref.cljs$core$IFn$_invoke$arity$1 ? title__GT_ref.cljs$core$IFn$_invoke$arity$1(G__63424) : title__GT_ref.call(null,G__63424));
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
frontend.handler.db_based.editor.wrap_parse_block = (function frontend$handler$db_based$editor$wrap_parse_block(p__63425){
var map__63426 = p__63425;
var map__63426__$1 = cljs.core.__destructure_map(map__63426);
var block = map__63426__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63426__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63426__$1,new cljs.core.Keyword("block","level","block/level",1182509971));
var block__$1 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
var G__63427 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63427) : frontend.db.entity.call(null,G__63427));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),content,new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(new Date()),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null)], null))),(function (___40947__auto__){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/config.edn"))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__63428_63462 = cljs.core.seq(block_ids);
var chunk__63429_63463 = null;
var count__63430_63464 = (0);
var i__63431_63465 = (0);
while(true){
if((i__63431_63465 < count__63430_63464)){
var id_63466 = chunk__63429_63463.cljs$core$IIndexed$_nth$arity$2(null,i__63431_63465);
var e_63467 = (function (){var G__63436 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_63466], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63436) : frontend.db.entity.call(null,G__63436));
})();
var title_63468 = (function (){var G__63437 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_63467);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__63437) : frontend.commands.clear_markdown_heading.call(null,G__63437));
})();
var block_63469 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_63467),new cljs.core.Keyword("block","title","block/title",710445684),title_63468], null);
frontend.modules.outliner.op.save_block_BANG_(block_63469);


var G__63470 = seq__63428_63462;
var G__63471 = chunk__63429_63463;
var G__63472 = count__63430_63464;
var G__63473 = (i__63431_63465 + (1));
seq__63428_63462 = G__63470;
chunk__63429_63463 = G__63471;
count__63430_63464 = G__63472;
i__63431_63465 = G__63473;
continue;
} else {
var temp__5804__auto___63477 = cljs.core.seq(seq__63428_63462);
if(temp__5804__auto___63477){
var seq__63428_63478__$1 = temp__5804__auto___63477;
if(cljs.core.chunked_seq_QMARK_(seq__63428_63478__$1)){
var c__5525__auto___63479 = cljs.core.chunk_first(seq__63428_63478__$1);
var G__63480 = cljs.core.chunk_rest(seq__63428_63478__$1);
var G__63481 = c__5525__auto___63479;
var G__63482 = cljs.core.count(c__5525__auto___63479);
var G__63483 = (0);
seq__63428_63462 = G__63480;
chunk__63429_63463 = G__63481;
count__63430_63464 = G__63482;
i__63431_63465 = G__63483;
continue;
} else {
var id_63484 = cljs.core.first(seq__63428_63478__$1);
var e_63485 = (function (){var G__63438 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_63484], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63438) : frontend.db.entity.call(null,G__63438));
})();
var title_63486 = (function (){var G__63439 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_63485);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__63439) : frontend.commands.clear_markdown_heading.call(null,G__63439));
})();
var block_63487 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_63485),new cljs.core.Keyword("block","title","block/title",710445684),title_63486], null);
frontend.modules.outliner.op.save_block_BANG_(block_63487);


var G__63488 = cljs.core.next(seq__63428_63478__$1);
var G__63489 = null;
var G__63490 = (0);
var G__63491 = (0);
seq__63428_63462 = G__63488;
chunk__63429_63463 = G__63489;
count__63430_63464 = G__63490;
i__63431_63465 = G__63491;
continue;
}
} else {
}
}
break;
}

return frontend.handler.property.batch_set_block_property_BANG_(repo,block_ids,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415),heading);
} else {
var _STAR_outliner_ops_STAR__orig_val__63440 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__63441 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__63441);

try{var seq__63442_63492 = cljs.core.seq(block_ids);
var chunk__63443_63493 = null;
var count__63444_63494 = (0);
var i__63445_63495 = (0);
while(true){
if((i__63445_63495 < count__63444_63494)){
var id_63496 = chunk__63443_63493.cljs$core$IIndexed$_nth$arity$2(null,i__63445_63495);
var e_63497 = (function (){var G__63450 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_63496], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63450) : frontend.db.entity.call(null,G__63450));
})();
var title_63498 = (function (){var G__63451 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_63497);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__63451) : frontend.commands.clear_markdown_heading.call(null,G__63451));
})();
var block_63499 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_63497),new cljs.core.Keyword("block","title","block/title",710445684),title_63498], null);
frontend.modules.outliner.op.save_block_BANG_(block_63499);


var G__63502 = seq__63442_63492;
var G__63503 = chunk__63443_63493;
var G__63504 = count__63444_63494;
var G__63505 = (i__63445_63495 + (1));
seq__63442_63492 = G__63502;
chunk__63443_63493 = G__63503;
count__63444_63494 = G__63504;
i__63445_63495 = G__63505;
continue;
} else {
var temp__5804__auto___63506 = cljs.core.seq(seq__63442_63492);
if(temp__5804__auto___63506){
var seq__63442_63507__$1 = temp__5804__auto___63506;
if(cljs.core.chunked_seq_QMARK_(seq__63442_63507__$1)){
var c__5525__auto___63508 = cljs.core.chunk_first(seq__63442_63507__$1);
var G__63509 = cljs.core.chunk_rest(seq__63442_63507__$1);
var G__63510 = c__5525__auto___63508;
var G__63511 = cljs.core.count(c__5525__auto___63508);
var G__63512 = (0);
seq__63442_63492 = G__63509;
chunk__63443_63493 = G__63510;
count__63444_63494 = G__63511;
i__63445_63495 = G__63512;
continue;
} else {
var id_63513 = cljs.core.first(seq__63442_63507__$1);
var e_63514 = (function (){var G__63452 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_63513], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63452) : frontend.db.entity.call(null,G__63452));
})();
var title_63515 = (function (){var G__63453 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e_63514);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__63453) : frontend.commands.clear_markdown_heading.call(null,G__63453));
})();
var block_63516 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_63514),new cljs.core.Keyword("block","title","block/title",710445684),title_63515], null);
frontend.modules.outliner.op.save_block_BANG_(block_63516);


var G__63517 = cljs.core.next(seq__63442_63507__$1);
var G__63518 = null;
var G__63519 = (0);
var G__63520 = (0);
seq__63442_63492 = G__63517;
chunk__63443_63493 = G__63518;
count__63444_63494 = G__63519;
i__63445_63495 = G__63520;
continue;
}
} else {
}
}
break;
}

frontend.handler.property.batch_set_block_property_BANG_(repo,block_ids,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415),heading);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__63440);
}}
});

//# sourceMappingURL=frontend.handler.db_based.editor.js.map
