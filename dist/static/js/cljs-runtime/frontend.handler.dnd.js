goog.provide('frontend.handler.dnd');
frontend.handler.dnd.move_blocks = (function frontend$handler$dnd$move_blocks(event,blocks,target_block,original_block,move_to){
var target_block__$1 = (function (){var G__121158 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__121158) : frontend.db.entity.call(null,G__121158));
})();
var blocks_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__121147_SHARP_){
var G__121159 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__121147_SHARP_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__121159) : frontend.db.entity.call(null,G__121159));
}),blocks);
var first_block = cljs.core.first(blocks_SINGLEQUOTE_);
var top_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(move_to,new cljs.core.Keyword(null,"top","top",-1856271961));
var nested_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(move_to,new cljs.core.Keyword(null,"nested","nested",18943849));
var alt_key_QMARK_ = (function (){var and__5000__auto__ = event;
if(cljs.core.truth_(and__5000__auto__)){
return event.altKey;
} else {
return and__5000__auto__;
}
})();
var current_format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var target_format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(target_block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var target_block__$2 = ((nested_QMARK_)?target_block__$1:(function (){var or__5002__auto__ = original_block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return target_block__$1;
}
})());
if(cljs.core.truth_((function (){var and__5000__auto__ = alt_key_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(blocks),(1));
} else {
return and__5000__auto__;
}
})())){
frontend.handler.property.file_persist_block_id_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(first_block));

return frontend.handler.editor.api_insert_new_block_BANG_(frontend.util.ref.__GT_block_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(first_block)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block__$2),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),(!(nested_QMARK_)),new cljs.core.Keyword(null,"before?","before?",765621039),top_QMARK_], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = current_format;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = target_format;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_format,target_format);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Those two pages have different formats."], null),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.Keyword(null,"clear?","clear?",1363344639),true], null)], null));
} else {
if(cljs.core.every_QMARK_(cljs.core.map_QMARK_,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(blocks_SINGLEQUOTE_,target_block__$2))){
var blocks_SINGLEQUOTE___$1 = frontend.handler.block.get_top_level_blocks(blocks_SINGLEQUOTE_);
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

if(top_QMARK_){
var first_child_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(logseq.db.get_left_sibling(target_block__$2)));
if(first_child_QMARK_){
var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
return frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,parent,false);
} else {
return null;
}
} else {
var temp__5802__auto__ = logseq.db.get_left_sibling(target_block__$2);
if(cljs.core.truth_(temp__5802__auto__)){
var before_node = temp__5802__auto__;
return frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,before_node,true);
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
return frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,parent,false);
} else {
return null;
}
}
}
} else {
return frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,target_block__$2,(!(nested_QMARK_)));
}
} else {
var _STAR_outliner_ops_STAR__orig_val__121185 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__121186 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__121186);

try{frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

if(top_QMARK_){
var first_child_QMARK__121231 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(logseq.db.get_left_sibling(target_block__$2)));
if(first_child_QMARK__121231){
var temp__5804__auto___121234 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2);
if(cljs.core.truth_(temp__5804__auto___121234)){
var parent_121235 = temp__5804__auto___121234;
frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,parent_121235,false);
} else {
}
} else {
var temp__5802__auto___121237 = logseq.db.get_left_sibling(target_block__$2);
if(cljs.core.truth_(temp__5802__auto___121237)){
var before_node_121238 = temp__5802__auto___121237;
frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,before_node_121238,true);
} else {
var temp__5804__auto___121239 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$2);
if(cljs.core.truth_(temp__5804__auto___121239)){
var parent_121240 = temp__5804__auto___121239;
frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,parent_121240,false);
} else {
}
}
}
} else {
frontend.modules.outliner.op.move_blocks_BANG_(blocks_SINGLEQUOTE___$1,target_block__$2,(!(nested_QMARK_)));
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__121185);
}}
} else {
return null;

}
}
}
});

//# sourceMappingURL=frontend.handler.dnd.js.map
