goog.provide('frontend.handler.block');
goog.scope(function(){
  frontend.handler.block.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.block.walk_block = (function frontend$handler$block$walk_block(block,check_QMARK_,transform){
var result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
clojure.walk.postwalk((function (x){
if(cljs.core.truth_((check_QMARK_.cljs$core$IFn$_invoke$arity$1 ? check_QMARK_.cljs$core$IFn$_invoke$arity$1(x) : check_QMARK_.call(null,x)))){
return cljs.core.reset_BANG_(result,(transform.cljs$core$IFn$_invoke$arity$1 ? transform.cljs$core$IFn$_invoke$arity$1(x) : transform.call(null,x)));
} else {
return x;
}
}),new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(block));

return cljs.core.deref(result);
});
frontend.handler.block.get_timestamp = (function frontend$handler$block$get_timestamp(block,typ){
return frontend.handler.block.walk_block(block,(function (x){
return ((logseq.graph_parser.block.timestamp_block_QMARK_(x)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(typ,cljs.core.first(cljs.core.second(x)))));
}),(function (p1__61924_SHARP_){
return cljs.core.second(cljs.core.second(p1__61924_SHARP_));
}));
});
frontend.handler.block.get_scheduled_ast = (function frontend$handler$block$get_scheduled_ast(block){
return frontend.handler.block.get_timestamp(block,"Scheduled");
});
frontend.handler.block.get_deadline_ast = (function frontend$handler$block$get_deadline_ast(block){
return frontend.handler.block.get_timestamp(block,"Deadline");
});
frontend.handler.block.indentable_QMARK_ = (function frontend$handler$block$indentable_QMARK_(p__61929){
var map__61930 = p__61929;
var map__61930__$1 = cljs.core.__destructure_map(map__61930);
var block = map__61930__$1;
var parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61930__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064));
if(cljs.core.truth_(parent)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_first_child((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
} else {
return null;
}
});
frontend.handler.block.outdentable_QMARK_ = (function frontend$handler$block$outdentable_QMARK_(p__61931){
var map__61932 = p__61931;
var map__61932__$1 = cljs.core.__destructure_map(map__61932);
var _block = map__61932__$1;
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61932__$1,new cljs.core.Keyword("block","level","block/level",1182509971));
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(level,(1));
});
frontend.handler.block.select_block_BANG_ = (function frontend$handler$block$select_block_BANG_(block_uuid){
var blocks = frontend.util.get_blocks_by_id(block_uuid);
if(cljs.core.seq(blocks)){
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(blocks);
} else {
return null;
}
});
frontend.handler.block.get_idx_of_order_list_block = (function frontend$handler$block$get_idx_of_order_list_block(block,order_list_type){
var order_block_fn_QMARK_ = (function (block__$1){
var type = frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,order_list_type);
});
var prev_block_fn = (function (p1__61933_SHARP_){
var G__61934 = (function (){var G__61936 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__61933_SHARP_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61936) : frontend.db.entity.call(null,G__61936));
})();
if((G__61934 == null)){
return null;
} else {
return logseq.db.get_left_sibling(G__61934);
}
});
var prev_block = prev_block_fn(block);
var page_fn_QMARK_ = (function frontend$handler$block$get_idx_of_order_list_block_$_page_fn_QMARK_(b){
var G__61941 = b;
var G__61941__$1 = (((G__61941 == null))?null:new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(G__61941));
if((G__61941__$1 == null)){
return null;
} else {
return (!((G__61941__$1 == null)));
}
});
var order_sibling_list = (function frontend$handler$block$get_idx_of_order_list_block_$_order_sibling_list(b){
return (new cljs.core.LazySeq(null,(function (){
if(((cljs.core.not(page_fn_QMARK_(b))) && (order_block_fn_QMARK_(b)))){
return cljs.core.cons(b,frontend$handler$block$get_idx_of_order_list_block_$_order_sibling_list(prev_block_fn(b)));
} else {
return null;
}
}),null,null));
});
var order_parent_list = (function frontend$handler$block$get_idx_of_order_list_block_$_order_parent_list(b){
return (new cljs.core.LazySeq(null,(function (){
if(((cljs.core.not(page_fn_QMARK_(b))) && (order_block_fn_QMARK_(b)))){
return cljs.core.cons(b,frontend$handler$block$get_idx_of_order_list_block_$_order_parent_list(frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))));
} else {
return null;
}
}),null,null));
});
var idx = (cljs.core.truth_(prev_block)?cljs.core.count(order_sibling_list(block)):(1));
var order_parents_count = (cljs.core.count(order_parent_list(block)) - (1));
var delta = (((order_parents_count < (0)))?(0):cljs.core.mod(order_parents_count,(3)));
if((delta === (0))){
return idx;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(delta,(1))){
var G__61942 = (frontend.util.convert_to_letters.cljs$core$IFn$_invoke$arity$1 ? frontend.util.convert_to_letters.cljs$core$IFn$_invoke$arity$1(idx) : frontend.util.convert_to_letters.call(null,idx));
if((G__61942 == null)){
return null;
} else {
return frontend.util.safe_lower_case(G__61942);
}
} else {
return (frontend.util.convert_to_roman.cljs$core$IFn$_invoke$arity$1 ? frontend.util.convert_to_roman.cljs$core$IFn$_invoke$arity$1(idx) : frontend.util.convert_to_roman.call(null,idx));

}
}
});
frontend.handler.block.attach_order_list_state = (function frontend$handler$block$attach_order_list_state(config,block){
var type = frontend.handler.property.util.lookup(block,new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111));
var own_order_list_type = (function (){var G__61943 = type;
var G__61943__$1 = (((G__61943 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__61943));
if((G__61943__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__61943__$1);
}
})();
var own_order_list_index = (function (){var G__61944 = own_order_list_type;
if((G__61944 == null)){
return null;
} else {
return frontend.handler.block.get_idx_of_order_list_block(block,G__61944);
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"own-order-list-type","own-order-list-type",507157714),own_order_list_type,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"own-order-list-index","own-order-list-index",2051635079),own_order_list_index,new cljs.core.Keyword(null,"own-order-number-list?","own-order-number-list?",2048042976),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(own_order_list_type,"number")], 0));
});
frontend.handler.block.text_range_by_lst_fst_line = (function frontend$handler$block$text_range_by_lst_fst_line(content,p__61947){
var vec__61948 = p__61947;
var direction = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61948,(0),null);
var pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61948,(1),null);
var G__61951 = direction;
var G__61951__$1 = (((G__61951 instanceof cljs.core.Keyword))?G__61951.fqn:null);
switch (G__61951__$1) {
case "up":
var last_new_line = (function (){var or__5002__auto__ = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(content,"\n");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (-1);
}
})();
var end = ((last_new_line + pos) + (1));
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),end);

break;
case "down":
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3((function (){var or__5002__auto__ = cljs.core.first(clojure.string.split_lines(content));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),(0),pos);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__61951__$1)].join('')));

}
});
frontend.handler.block.mark_last_input_time_BANG_ = (function frontend$handler$block$mark_last_input_time_BANG_(repo){
if(cljs.core.truth_(repo)){
return frontend.state.set_editor_last_input_time_BANG_(repo,(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)));
} else {
return null;
}
});
frontend.handler.block.edit_block_aux = (function frontend$handler$block$edit_block_aux(repo,block,content,text_range,p__61952){
var map__61953 = p__61952;
var map__61953__$1 = cljs.core.__destructure_map(map__61953);
var container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61953__$1,new cljs.core.Keyword(null,"container-id","container-id",1274665684));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61953__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var event = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61953__$1,new cljs.core.Keyword(null,"event","event",301435442));
var pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61953__$1,new cljs.core.Keyword(null,"pos","pos",-864607220));
if(cljs.core.truth_(block)){
var container_id_62030__$1 = (function (){var or__5002__auto__ = container_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.state.get_current_editor_container_id();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473);
}
}
})();
frontend.state.set_editing_BANG_.cljs$core$IFn$_invoke$arity$variadic(["edit-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''),content,block,text_range,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"db","db",993250759),(frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id_62030__$1,new cljs.core.Keyword(null,"direction","direction",-633359395),direction,new cljs.core.Keyword(null,"event","event",301435442),event,new cljs.core.Keyword(null,"pos","pos",-864607220),pos], null)], 0));

return frontend.handler.block.mark_last_input_time_BANG_(repo);
} else {
return null;
}
});
frontend.handler.block.sanity_block_content = (function frontend$handler$block$sanity_block_content(repo,format,content){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
return content;
} else {
return frontend.util.file_based.drawer.remove_logbook(frontend.handler.file_based.property.util.remove_built_in_properties(format,content));
}
});
/**
 * Multiple pages/objects may have the same `:block/title`.
 * Notice: this doesn't prevent for pages/objects that have the same tag or created by different clients.
 */
frontend.handler.block.block_unique_title = (function frontend$handler$block$block_unique_title(block){
var block_e = ((datascript.impl.entity.entity_QMARK_(block))?block:((cljs.core.uuid_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)))?(function (){var G__61958 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61958) : frontend.db.entity.call(null,G__61958));
})():block
));
var tags = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (t){
var or__5002__auto__ = (function (){var G__61959 = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block_e);
if((G__61959 == null)){
return null;
} else {
return (logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2(G__61959,t) : logseq.db.inline_tag_QMARK_.call(null,G__61959,t));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__61963 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(t);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__61963) : logseq.db.private_tags.call(null,G__61963));
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
if(typeof tag === 'number'){
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(tag) : frontend.db.entity.call(null,tag));
} else {
return tag;
}
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)));
if(cljs.core.seq(tags)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))," ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (tag){
var temp__5804__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag);
if(cljs.core.truth_(temp__5804__auto__)){
var title = temp__5804__auto__;
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)].join('');
} else {
return null;
}
}),tags))].join('');
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}
});
frontend.handler.block.edit_block_BANG_ = (function frontend$handler$block$edit_block_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62032 = arguments.length;
var i__5727__auto___62033 = (0);
while(true){
if((i__5727__auto___62033 < len__5726__auto___62032)){
args__5732__auto__.push((arguments[i__5727__auto___62033]));

var G__62034 = (i__5727__auto___62033 + (1));
i__5727__auto___62033 = G__62034;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.block.edit_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.block.edit_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,pos,p__61972){
var map__61973 = p__61972;
var map__61973__$1 = cljs.core.__destructure_map(map__61973);
var opts = map__61973__$1;
var _container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61973__$1,new cljs.core.Keyword(null,"_container-id","_container-id",942697967));
var custom_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61973__$1,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001));
var tail_len = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__61973__$1,new cljs.core.Keyword(null,"tail-len","tail-len",699304522),(0));
var save_code_editor_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__61973__$1,new cljs.core.Keyword(null,"save-code-editor?","save-code-editor?",-419078411),true);
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(frontend.config.publishing_QMARK_));
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
} else {
return and__5000__auto__;
}
})())){
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((function (){var G__61975 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61975) : frontend.db.entity.call(null,G__61975));
})()))?null:frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(save_code_editor_QMARK_)?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","save-code-editor","editor/save-code-editor",-1356475475)], null)):null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block())))?frontend.state.clear_edit_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"clear-editing-block?","clear-editing-block?",901540541),false], null)], 0)):null)),(function (___40947__auto____$2){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__61978 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61978) : frontend.db.entity.call(null,G__61978));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var content = (function (){var or__5002__auto__ = custom_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
}
})();
var content_length = cljs.core.count(content);
var text_range = ((cljs.core.vector_QMARK_(pos))?frontend.handler.block.text_range_by_lst_fst_line(content,pos):(((((tail_len > (0))) && ((cljs.core.count(content) >= tail_len))))?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),(cljs.core.count(content) - tail_len)):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"max","max",61366548),pos)) || ((content_length <= pos))))?content:cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),pos)
)));
var content__$1 = frontend.handler.block.sanity_block_content(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content);
frontend.state.clear_selection_BANG_();

return frontend.handler.block.edit_block_aux(repo,block__$1,content__$1,text_range,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"pos","pos",-864607220),pos));
} else {
return null;
}
})());
}));
}));
}));
}));
} else {
return null;
}
}));

(frontend.handler.block.edit_block_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.block.edit_block_BANG_.cljs$lang$applyTo = (function (seq61967){
var G__61968 = cljs.core.first(seq61967);
var seq61967__$1 = cljs.core.next(seq61967);
var G__61969 = cljs.core.first(seq61967__$1);
var seq61967__$2 = cljs.core.next(seq61967__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61968,G__61969,seq61967__$2);
}));

frontend.handler.block.get_original_block_by_dom = (function frontend$handler$block$get_original_block_by_dom(node){
var temp__5804__auto__ = (function (){var G__61981 = node;
var G__61981__$1 = (((G__61981 == null))?null:frontend.handler.block.goog$module$goog$object.get(G__61981,"parentNode"));
var G__61981__$2 = (((G__61981__$1 == null))?null:frontend.util.rec_get_node(G__61981__$1,"ls-block"));
var G__61981__$3 = (((G__61981__$2 == null))?null:dommy.core.attr(G__61981__$2,"originalblockid"));
if((G__61981__$3 == null)){
return null;
} else {
return cljs.core.uuid(G__61981__$3);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__61982 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61982) : frontend.db.entity.call(null,G__61982));
} else {
return null;
}
});
/**
 * Get the original block from the current editing block or selected blocks
 */
frontend.handler.block.get_original_block = (function frontend$handler$block$get_original_block(linked_block){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(linked_block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
if(and__5000__auto__){
return frontend.state.get_input();
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.block.get_original_block_by_dom(frontend.state.get_input());
} else {
if(cljs.core.seq(frontend.state.get_selection_blocks())){
return cljs.core.first(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__61984_SHARP_){
var temp__5804__auto__ = dommy.core.attr(p1__61984_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.uuid(id),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(linked_block))){
var temp__5804__auto____$1 = (function (){var G__61986 = dommy.core.attr(p1__61984_SHARP_,"originalblockid");
if((G__61986 == null)){
return null;
} else {
return cljs.core.uuid(G__61986);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var original_id = temp__5804__auto____$1;
var G__61987 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),original_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61987) : frontend.db.entity.call(null,G__61987));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,frontend.state.get_selection_blocks())));
} else {
return null;
}
}
});
/**
 * Get only the top level blocks and their original blocks.
 */
frontend.handler.block.get_top_level_blocks = (function frontend$handler$block$get_top_level_blocks(blocks){
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

var level_blocks = logseq.outliner.core.blocks_with_level(blocks);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var original = frontend.handler.block.get_original_block(b);
var or__5002__auto__ = (function (){var and__5000__auto__ = original;
if(cljs.core.truth_(and__5000__auto__)){
var G__61988 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(original);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61988) : frontend.db.entity.call(null,G__61988));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(b));
}),level_blocks));
});
frontend.handler.block.get_current_editing_original_block = (function frontend$handler$block$get_current_editing_original_block(){
var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return frontend.handler.block.get_original_block_by_dom(frontend.util.rec_get_node(input,"ls-block"));
} else {
return null;
}
});
frontend.handler.block.get_first_block_original = (function frontend$handler$block$get_first_block_original(){
var or__5002__auto__ = frontend.handler.block.get_current_editing_original_block();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = (function (){var G__61989 = cljs.core.first(frontend.state.get_selection_blocks());
return G__61989;
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return frontend.handler.block.get_original_block_by_dom(node);
} else {
return null;
}
}
});
frontend.handler.block.indent_outdent_blocks_BANG_ = (function frontend$handler$block$indent_outdent_blocks_BANG_(blocks,indent_QMARK_,save_current_block){
if(cljs.core.seq(blocks)){
var blocks__$1 = frontend.handler.block.get_top_level_blocks(blocks);
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(cljs.core.truth_(save_current_block)){
(save_current_block.cljs$core$IFn$_invoke$arity$0 ? save_current_block.cljs$core$IFn$_invoke$arity$0() : save_current_block.call(null));
} else {
}

return frontend.modules.outliner.op.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.block.get_top_level_blocks(blocks__$1),indent_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parent-original","parent-original",1770143972),frontend.handler.block.get_first_block_original(),new cljs.core.Keyword(null,"logical-outdenting?","logical-outdenting?",538240839),frontend.state.logical_outdenting_QMARK_()], null)], 0));
} else {
var _STAR_outliner_ops_STAR__orig_val__61990 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__61991 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__61991);

try{if(cljs.core.truth_(save_current_block)){
(save_current_block.cljs$core$IFn$_invoke$arity$0 ? save_current_block.cljs$core$IFn$_invoke$arity$0() : save_current_block.call(null));
} else {
}

frontend.modules.outliner.op.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.block.get_top_level_blocks(blocks__$1),indent_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parent-original","parent-original",1770143972),frontend.handler.block.get_first_block_original(),new cljs.core.Keyword(null,"logical-outdenting?","logical-outdenting?",538240839),frontend.state.logical_outdenting_QMARK_()], null)], 0));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"real-outliner-op","real-outliner-op",1979985933),new cljs.core.Keyword(null,"indent-outdent","indent-outdent",874329747)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"real-outliner-op","real-outliner-op",1979985933),new cljs.core.Keyword(null,"indent-outdent","indent-outdent",874329747)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__61990);
}}
} else {
return null;
}
});
frontend.handler.block._STAR_swipe = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.handler.block._STAR_swiped_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
frontend.handler.block._STAR_touch_start = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.handler.block.on_touch_start = (function frontend$handler$block$on_touch_start(event,uuid){
frontend.util.stop_propagation(event);

var input = frontend.state.get_input();
var input_id = frontend.state.get_edit_input_id();
var selection_type = document.getSelection().type;
cljs.core.reset_BANG_(frontend.handler.block._STAR_touch_start,Date.now());

if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.ends_with_QMARK_(input_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid));
} else {
return and__5000__auto__;
}
})())){
} else {
frontend.state.clear_edit_BANG_();
}

if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selection_type,"Range")){
var temp__5804__auto__ = event.targetTouches;
if(cljs.core.truth_(temp__5804__auto__)){
var touches = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(touches.length,(1))){
var touch = (touches[(0)]);
var x = touch.clientX;
var y = touch.clientY;
return cljs.core.reset_BANG_(frontend.handler.block._STAR_swipe,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"x0","x0",410843387),x,new cljs.core.Keyword(null,"y0","y0",111454807),y,new cljs.core.Keyword(null,"xi","xi",-163483319),x,new cljs.core.Keyword(null,"yi","yi",-1352135633),y,new cljs.core.Keyword(null,"tx","tx",466630418),x,new cljs.core.Keyword(null,"ty","ty",158290825),y,new cljs.core.Keyword(null,"direction","direction",-633359395),null], null));
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
frontend.handler.block.on_touch_move = (function frontend$handler$block$on_touch_move(goog_event){
var event = goog_event.event_;
var temp__5804__auto__ = event.targetTouches;
if(cljs.core.truth_(temp__5804__auto__)){
var touches = temp__5804__auto__;
var selection_type = document.getSelection().type;
var target = event.target;
var block_container = frontend.util.rec_get_node(target,"ls-block");
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selection_type,"Range")){
return null;
} else {
if(((cljs.core.not(frontend.state.editing_QMARK_())) || (((Date.now() - cljs.core.deref(frontend.handler.block._STAR_touch_start)) < (600))))){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(touches.length,(1));
if(and__5000__auto__){
return cljs.core.deref(frontend.handler.block._STAR_swipe);
} else {
return and__5000__auto__;
}
})())){
var map__62002 = cljs.core.deref(frontend.handler.block._STAR_swipe);
var map__62002__$1 = cljs.core.__destructure_map(map__62002);
var x0 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62002__$1,new cljs.core.Keyword(null,"x0","x0",410843387));
var xi = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62002__$1,new cljs.core.Keyword(null,"xi","xi",-163483319));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62002__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var touch = (touches[(0)]);
var tx = touch.clientX;
var ty = touch.clientY;
var direction__$1 = (((direction == null))?(((tx > x0))?new cljs.core.Keyword(null,"right","right",-452581833):new cljs.core.Keyword(null,"left","left",-399115937)):direction);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.block._STAR_swipe,(function (p1__61999_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__61999_SHARP_,new cljs.core.Keyword(null,"tx","tx",466630418),tx),new cljs.core.Keyword(null,"ty","ty",158290825),ty),new cljs.core.Keyword(null,"xi","xi",-163483319),tx),new cljs.core.Keyword(null,"yi","yi",-1352135633),ty),new cljs.core.Keyword(null,"direction","direction",-633359395),direction__$1);
}));

if((((xi - x0) * (tx - xi)) < (0))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.block._STAR_swipe,(function (p1__62000_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__62000_SHARP_,new cljs.core.Keyword(null,"x0","x0",410843387),tx),new cljs.core.Keyword(null,"y0","y0",111454807),ty);
}));
} else {
}

var map__62003 = cljs.core.deref(frontend.handler.block._STAR_swipe);
var map__62003__$1 = cljs.core.__destructure_map(map__62003);
var x0__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62003__$1,new cljs.core.Keyword(null,"x0","x0",410843387));
var y0 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62003__$1,new cljs.core.Keyword(null,"y0","y0",111454807));
var dx = (tx - x0__$1);
var dy = (ty - y0);
if(cljs.core.truth_((function (){var and__5000__auto__ = (Math.abs(dy) < (30));
if(and__5000__auto__){
var and__5000__auto____$1 = (Math.abs(dx) > (10));
if(and__5000__auto____$1){
return direction__$1;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
goog_event.preventDefault();

var left = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction__$1,new cljs.core.Keyword(null,"right","right",-452581833)))?(((dx >= (0)))?(function (){var x__5090__auto__ = dx;
var y__5091__auto__ = (48);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():(function (){var x__5087__auto__ = dx;
var y__5088__auto__ = (0);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()):(((dx <= (0)))?(- (function (){var x__5090__auto__ = Math.abs(dx);
var y__5091__auto__ = (48);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()):(function (){var x__5090__auto__ = dx;
var y__5091__auto__ = (48);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()));
cljs.core.reset_BANG_(frontend.handler.block._STAR_swiped_QMARK_,true);

return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_container,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transform","transform",1381301764),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("translateX(%dpx)",left) : frontend.util.format.call(null,"translateX(%dpx)",left))], 0));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}
} else {
return null;
}
});
frontend.handler.block.on_touch_end = (function frontend$handler$block$on_touch_end(event){
frontend.util.stop_propagation(event);

if(cljs.core.truth_(cljs.core.deref(frontend.handler.block._STAR_swipe))){
var target = event.target;
var swiped_QMARK_ = cljs.core.deref(frontend.handler.block._STAR_swiped_QMARK_);
var map__62011 = cljs.core.deref(frontend.handler.block._STAR_swipe);
var map__62011__$1 = cljs.core.__destructure_map(map__62011);
var x0 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62011__$1,new cljs.core.Keyword(null,"x0","x0",410843387));
var y0 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62011__$1,new cljs.core.Keyword(null,"y0","y0",111454807));
var tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62011__$1,new cljs.core.Keyword(null,"tx","tx",466630418));
var ty = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62011__$1,new cljs.core.Keyword(null,"ty","ty",158290825));
var dy = (ty - y0);
var dx = (tx - x0);
var block_container = frontend.util.rec_get_node(target,"ls-block");
var select_QMARK_ = (((Math.abs(dx) > Math.abs(dy))) && ((Math.abs(dx) > (10))));
try{if(cljs.core.truth_((function (){var or__5002__auto__ = select_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return swiped_QMARK_;
}
})())){
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_container,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transform","transform",1381301764),"translateX(0)"], 0));

if(select_QMARK_){
if(cljs.core.contains_QMARK_(cljs.core.set(frontend.state.get_selection_block_ids()),(function (){var G__62016 = block_container.getAttribute("blockid");
if((G__62016 == null)){
return null;
} else {
return cljs.core.uuid(G__62016);
}
})())){
frontend.state.drop_selection_block_BANG_(block_container);
} else {
frontend.state.clear_edit_BANG_();

frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(block_container,null);
}

if(cljs.core.seq(frontend.state.get_selection_blocks())){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),true);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
} else {
}
}

frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();
} else {
}
} else {
}

return cljs.core.reset_BANG_(frontend.handler.block._STAR_swiped_QMARK_,false);
}catch (e62015){var e = e62015;
return console.error(e);
}finally {cljs.core.reset_BANG_(frontend.handler.block._STAR_swipe,null);

cljs.core.reset_BANG_(frontend.handler.block._STAR_touch_start,null);
}} else {
return null;
}
});
frontend.handler.block.on_touch_cancel = (function frontend$handler$block$on_touch_cancel(e){
cljs.core.reset_BANG_(frontend.handler.block._STAR_swipe,null);

cljs.core.reset_BANG_(frontend.handler.block._STAR_swiped_QMARK_,null);

cljs.core.reset_BANG_(frontend.handler.block._STAR_touch_start,null);

var target = e.target;
var block_container = frontend.util.rec_get_node(target,"ls-block");
return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_container,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transform","transform",1381301764),"translateX(0)"], 0));
});

//# sourceMappingURL=frontend.handler.block.js.map
