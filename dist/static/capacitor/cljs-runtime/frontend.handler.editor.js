goog.provide('frontend.handler.editor');
goog.scope(function(){
  frontend.handler.editor.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.editor !== 'undefined') && (typeof frontend.handler.editor._STAR_asset_uploading_QMARK_ !== 'undefined')){
} else {
frontend.handler.editor._STAR_asset_uploading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.editor !== 'undefined') && (typeof frontend.handler.editor._STAR_asset_uploading_process !== 'undefined')){
} else {
frontend.handler.editor._STAR_asset_uploading_process = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
frontend.handler.editor.clear_selection_BANG_ = frontend.state.clear_selection_BANG_;
frontend.handler.editor.edit_block_BANG_ = frontend.handler.block.edit_block_BANG_;
frontend.handler.editor.outliner_save_block_BANG_ = (function frontend$handler$editor$outliner_save_block_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___65957 = arguments.length;
var i__5727__auto___65958 = (0);
while(true){
if((i__5727__auto___65958 < len__5726__auto___65957)){
args__5732__auto__.push((arguments[i__5727__auto___65958]));

var G__65959 = (i__5727__auto___65958 + (1));
i__5727__auto___65958 = G__65959;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,p__64835){
var map__64836 = p__64835;
var map__64836__$1 = cljs.core.__destructure_map(map__64836);
var opts = map__64836__$1;
return frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}));

(frontend.handler.editor.outliner_save_block_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.outliner_save_block_BANG_.cljs$lang$applyTo = (function (seq64833){
var G__64834 = cljs.core.first(seq64833);
var seq64833__$1 = cljs.core.next(seq64833);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64834,seq64833__$1);
}));

frontend.handler.editor.get_block_own_order_list_type = (function frontend$handler$editor$get_block_own_order_list_type(block){
return frontend.handler.property.util.lookup(block,new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111));
});
frontend.handler.editor.set_block_own_order_list_type_BANG_ = (function frontend$handler$editor$set_block_own_order_list_type_BANG_(block,type){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var uuid = temp__5804__auto__;
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),uuid,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111)),cljs.core.name(type));
} else {
return null;
}
});
frontend.handler.editor.remove_block_own_order_list_type_BANG_ = (function frontend$handler$editor$remove_block_own_order_list_type_BANG_(block){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var uuid = temp__5804__auto__;
return frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),uuid,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111)));
} else {
return null;
}
});
frontend.handler.editor.own_order_number_list_QMARK_ = (function frontend$handler$editor$own_order_number_list_QMARK_(block){
var temp__5804__auto__ = (function (){var G__64837 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64837) : frontend.db.entity.call(null,G__64837));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block__$1 = temp__5804__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.get_block_own_order_list_type(block__$1),"number");
} else {
return null;
}
});
frontend.handler.editor.make_block_as_own_order_list_BANG_ = (function frontend$handler$editor$make_block_as_own_order_list_BANG_(block){
var G__64838 = block;
if((G__64838 == null)){
return null;
} else {
return frontend.handler.editor.set_block_own_order_list_type_BANG_(G__64838,"number");
}
});
frontend.handler.editor.toggle_blocks_as_own_order_list_BANG_ = (function frontend$handler$editor$toggle_blocks_as_own_order_list_BANG_(blocks){
if(cljs.core.seq(blocks)){
var has_ordered_QMARK_ = cljs.core.some(frontend.handler.editor.own_order_number_list_QMARK_,blocks);
var blocks_uuids = (function (){var G__64842 = blocks;
var G__64842__$1 = (((G__64842 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),G__64842));
if((G__64842__$1 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__64842__$1);
}
})();
var order_list_prop = frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111));
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_(has_ordered_QMARK_)){
return frontend.handler.property.batch_remove_block_property_BANG_(repo,blocks_uuids,order_list_prop);
} else {
return frontend.handler.property.batch_set_block_property_BANG_(repo,blocks_uuids,order_list_prop,"number");
}
} else {
return null;
}
});
frontend.handler.editor.get_selection_and_format = (function frontend$handler$editor$get_selection_and_format(){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))){
var temp__5804__auto____$1 = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto____$1)){
var edit_id = temp__5804__auto____$1;
var temp__5804__auto____$2 = goog.dom.getElement(edit_id);
if(cljs.core.truth_(temp__5804__auto____$2)){
var input = temp__5804__auto____$2;
var selection_start = frontend.util.get_selection_start(input);
var selection_end = frontend.util.get_selection_end(input);
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var selection = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selection_start,selection_end))?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,selection_start,selection_end):null);
var selection_start__$1 = (selection_start + cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__64843_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",p1__64843_SHARP_);
}),selection)));
var selection_end__$1 = (selection_end - cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__64844_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",p1__64844_SHARP_);
}),cljs.core.reverse(selection))));
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"selection-start","selection-start",-888859581),selection_start__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835),selection_end__$1,new cljs.core.Keyword(null,"selection","selection",975998651),(function (){var G__64845 = selection;
if((G__64845 == null)){
return null;
} else {
return clojure.string.trim(G__64845);
}
})(),new cljs.core.Keyword(null,"format","format",-1306924766),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"edit-id","edit-id",-639876554),edit_id,new cljs.core.Keyword(null,"input","input",556931961),input], null);
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
frontend.handler.editor.format_text_BANG_ = (function frontend$handler$editor$format_text_BANG_(pattern_fn){
var temp__5804__auto__ = frontend.handler.editor.get_selection_and_format();
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
var map__64854 = m;
var map__64854__$1 = cljs.core.__destructure_map(map__64854);
var selection_start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"selection-start","selection-start",-888859581));
var selection_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"value","value",305978217));
var edit_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"edit-id","edit-id",-639876554));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64854__$1,new cljs.core.Keyword(null,"input","input",556931961));
var pattern = (pattern_fn.cljs$core$IFn$_invoke$arity$1 ? pattern_fn.cljs$core$IFn$_invoke$arity$1(format) : pattern_fn.call(null,format));
var pattern_count = cljs.core.count(pattern);
var pattern_prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (selection_start - pattern_count);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),selection_start);
var pattern_suffix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,selection_end,(function (){var x__5090__auto__ = cljs.core.count(value);
var y__5091__auto__ = (selection_end + pattern_count);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
var already_wrapped_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(pattern,pattern_prefix,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pattern_suffix], 0));
var prefix = ((already_wrapped_QMARK_)?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),(selection_start - pattern_count)):cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),selection_start));
var postfix = ((already_wrapped_QMARK_)?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,(selection_end + pattern_count)):cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,selection_end));
var inner_value = (function (){var G__64855 = selection;
if((!(already_wrapped_QMARK_))){
return (function (p1__64849_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern),cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__64849_SHARP_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern)].join('');
})(G__64855);
} else {
return G__64855;
}
})();
var new_value = [prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(inner_value),postfix].join('');
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_id,new_value);

if(already_wrapped_QMARK_){
return frontend.util.cursor.set_selection_to(input,(selection_start - pattern_count),(selection_end - pattern_count));
} else {
if(cljs.core.truth_(selection)){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(selection_end + pattern_count));
} else {
return frontend.util.cursor.set_selection_to(input,(selection_start + pattern_count),(selection_end + pattern_count));

}
}
} else {
return null;
}
});
frontend.handler.editor.bold_format_BANG_ = (function frontend$handler$editor$bold_format_BANG_(){
return frontend.handler.editor.format_text_BANG_(frontend.config.get_bold);
});
frontend.handler.editor.italics_format_BANG_ = (function frontend$handler$editor$italics_format_BANG_(){
return frontend.handler.editor.format_text_BANG_(frontend.config.get_italic);
});
frontend.handler.editor.highlight_format_BANG_ = (function frontend$handler$editor$highlight_format_BANG_(){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.editor.format_text_BANG_((function (){
return frontend.config.get_highlight(format);
}));
} else {
return null;
}
});
frontend.handler.editor.strike_through_format_BANG_ = (function frontend$handler$editor$strike_through_format_BANG_(){
return frontend.handler.editor.format_text_BANG_(frontend.config.get_strike_through);
});
frontend.handler.editor.html_link_format_BANG_ = (function frontend$handler$editor$html_link_format_BANG_(var_args){
var G__64865 = arguments.length;
switch (G__64865) {
case 0:
return frontend.handler.editor.html_link_format_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.editor.html_link_format_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.html_link_format_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.editor.html_link_format_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(frontend.handler.editor.html_link_format_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (text){
var temp__5804__auto__ = frontend.handler.editor.get_selection_and_format();
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
var map__64866 = m;
var map__64866__$1 = cljs.core.__destructure_map(map__64866);
var selection_start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"selection-start","selection-start",-888859581));
var selection_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"value","value",305978217));
var edit_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"edit-id","edit-id",-639876554));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64866__$1,new cljs.core.Keyword(null,"input","input",556931961));
var empty_selection_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selection_start,selection_end);
var selection_link_QMARK_ = (function (){var and__5000__auto__ = selection;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.graph_parser.mldoc.mldoc_link_QMARK_(format,selection);
} else {
return and__5000__auto__;
}
})();
var vec__64867 = ((empty_selection_QMARK_)?frontend.config.get_empty_link_and_forward_pos(format):(cljs.core.truth_((function (){var and__5000__auto__ = text;
if(cljs.core.truth_(and__5000__auto__)){
return selection_link_QMARK_;
} else {
return and__5000__auto__;
}
})())?frontend.config.with_label_link(format,text,selection):(cljs.core.truth_(text)?frontend.config.with_label_link(format,selection,text):(cljs.core.truth_(selection_link_QMARK_)?frontend.config.with_default_link(format,selection):frontend.config.with_default_label(format,selection)
))));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64867,(0),null);
var forward_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64867,(1),null);
var new_value = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),selection_start),cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,selection_end)].join('');
var cur_pos = (function (){var or__5002__auto__ = selection_start;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.cursor.pos(input);
}
})();
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_id,new_value);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(cur_pos + forward_pos));
} else {
return null;
}
}));

(frontend.handler.editor.html_link_format_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.editor.open_block_in_sidebar_BANG_ = (function frontend$handler$editor$open_block_in_sidebar_BANG_(block_id){
if(cljs.core.truth_(block_id)){
var temp__5804__auto__ = (function (){var G__64877 = ((typeof block_id === 'number')?block_id:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null));
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64877) : frontend.db.entity.call(null,G__64877));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var page_QMARK_ = (new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block) == null);
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),((page_QMARK_)?new cljs.core.Keyword(null,"page","page",849072397):new cljs.core.Keyword(null,"block","block",664686210)));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.reset_cursor_range_BANG_ = (function frontend$handler$editor$reset_cursor_range_BANG_(node){
if(cljs.core.truth_(node)){
return frontend.state.set_cursor_range_BANG_(frontend.util.caret_range(node));
} else {
return null;
}
});
frontend.handler.editor.restore_cursor_pos_BANG_ = (function frontend$handler$editor$restore_cursor_pos_BANG_(id,markup){
var temp__5804__auto__ = goog.dom.getElement(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
var cursor_range = frontend.state.get_cursor_range();
var pos = (function (){var or__5002__auto__ = frontend.state.get_editor_last_pos();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cursor_range;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.diff.find_position(markup,cursor_range);
} else {
return and__5000__auto__;
}
}
})();
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(node,pos);
} else {
return null;
}
});
frontend.handler.editor.highlight_block_BANG_ = (function frontend$handler$editor$highlight_block_BANG_(block_uuid){
var blocks = frontend.util.get_blocks_by_id(block_uuid);
var seq__64886 = cljs.core.seq(blocks);
var chunk__64887 = null;
var count__64888 = (0);
var i__64889 = (0);
while(true){
if((i__64889 < count__64888)){
var block = chunk__64887.cljs$core$IIndexed$_nth$arity$2(null,i__64889);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(block,"block-highlight");


var G__65961 = seq__64886;
var G__65962 = chunk__64887;
var G__65963 = count__64888;
var G__65964 = (i__64889 + (1));
seq__64886 = G__65961;
chunk__64887 = G__65962;
count__64888 = G__65963;
i__64889 = G__65964;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__64886);
if(temp__5804__auto__){
var seq__64886__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__64886__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__64886__$1);
var G__65965 = cljs.core.chunk_rest(seq__64886__$1);
var G__65966 = c__5525__auto__;
var G__65967 = cljs.core.count(c__5525__auto__);
var G__65968 = (0);
seq__64886 = G__65965;
chunk__64887 = G__65966;
count__64888 = G__65967;
i__64889 = G__65968;
continue;
} else {
var block = cljs.core.first(seq__64886__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(block,"block-highlight");


var G__65969 = cljs.core.next(seq__64886__$1);
var G__65970 = null;
var G__65971 = (0);
var G__65972 = (0);
seq__64886 = G__65969;
chunk__64887 = G__65970;
count__64888 = G__65971;
i__64889 = G__65972;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.handler.editor.unhighlight_blocks_BANG_ = (function frontend$handler$editor$unhighlight_blocks_BANG_(){
var blocks = (function (){var G__64893 = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.getElementsByClassName("block-highlight"));
var G__64893__$1 = (((G__64893 == null))?null:cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((2),G__64893));
if((G__64893__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,G__64893__$1);
}
})();
var seq__64894 = cljs.core.seq(blocks);
var chunk__64895 = null;
var count__64896 = (0);
var i__64897 = (0);
while(true){
if((i__64897 < count__64896)){
var block = chunk__64895.cljs$core$IIndexed$_nth$arity$2(null,i__64897);
goog.dom.classes.remove(block,"block-highlight");


var G__65973 = seq__64894;
var G__65974 = chunk__64895;
var G__65975 = count__64896;
var G__65976 = (i__64897 + (1));
seq__64894 = G__65973;
chunk__64895 = G__65974;
count__64896 = G__65975;
i__64897 = G__65976;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__64894);
if(temp__5804__auto__){
var seq__64894__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__64894__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__64894__$1);
var G__66018 = cljs.core.chunk_rest(seq__64894__$1);
var G__66019 = c__5525__auto__;
var G__66020 = cljs.core.count(c__5525__auto__);
var G__66021 = (0);
seq__64894 = G__66018;
chunk__64895 = G__66019;
count__64896 = G__66020;
i__64897 = G__66021;
continue;
} else {
var block = cljs.core.first(seq__64894__$1);
goog.dom.classes.remove(block,"block-highlight");


var G__66022 = cljs.core.next(seq__64894__$1);
var G__66023 = null;
var G__66024 = (0);
var G__66025 = (0);
seq__64894 = G__66022;
chunk__64895 = G__66023;
count__64896 = G__66024;
i__64897 = G__66025;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.handler.editor.wrap_parse_block = (function frontend$handler$editor$wrap_parse_block(block){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.handler.db_based.editor.wrap_parse_block(block);
} else {
return frontend.handler.file_based.editor.wrap_parse_block(block);
}
});
frontend.handler.editor.save_block_inner_BANG_ = (function frontend$handler$editor$save_block_inner_BANG_(block,value,opts){
var block__$1 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","title","block/title",710445684),value], null);
var block_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.editor.wrap_parse_block(block__$1),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));
var opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560));
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.handler.editor.outliner_save_block_BANG_(block_SINGLEQUOTE_);
} else {
var _STAR_outliner_ops_STAR__orig_val__64902 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__64903 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__64903);

try{frontend.handler.editor.outliner_save_block_BANG_(block_SINGLEQUOTE_);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),opts_SINGLEQUOTE_);
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts_SINGLEQUOTE_,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__64902);
}}
});
frontend.handler.editor.another_block_with_same_id_exists_QMARK_ = (function frontend$handler$editor$another_block_with_same_id_exists_QMARK_(current_id,block_id){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof block_id === 'string';
if(and__5000__auto__){
return cljs.core.parse_uuid(block_id);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_id,id);
if(and__5000__auto__){
var G__64907 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64907) : frontend.db.entity.call(null,G__64907));
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
frontend.handler.editor.save_block_if_changed_BANG_ = (function frontend$handler$editor$save_block_if_changed_BANG_(var_args){
var G__64909 = arguments.length;
switch (G__64909) {
case 2:
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block,value){
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3(block,value,null);
}));

(frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (block,value,p__64910){
var map__64911 = p__64910;
var map__64911__$1 = cljs.core.__destructure_map(map__64911);
var opts = map__64911__$1;
var force_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64911__$1,new cljs.core.Keyword(null,"force?","force?",1839038675));
var map__64912 = block;
var map__64912__$1 = cljs.core.__destructure_map(map__64912);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64912__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64912__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64912__$1,new cljs.core.Keyword("block","repo","block/repo",2119209932));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64912__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
var format__$2 = (function (){var or__5002__auto__ = format__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
var block_id = (function (){var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
if((((!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo__$1)))) && (cljs.core.map_QMARK_(properties)))){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.Keyword(null,"id","id",-1388402092));
} else {
return null;
}
})();
var content = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo__$1))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__64916 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64916) : frontend.db.entity.call(null,G__64916));
})()):frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_built_in_properties_when_file_based(repo__$1,format__$2,title)));
if(cljs.core.truth_(frontend.handler.editor.another_block_with_same_id_exists_QMARK_(uuid,block_id))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.content","p.content",-1435376888),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Block with the id %s already exists!",block_id) : frontend.util.format.call(null,"Block with the id %s already exists!",block_id))], null),new cljs.core.Keyword(null,"error","error",-978969032));
} else {
if(cljs.core.truth_(force_QMARK_)){
return frontend.handler.editor.save_block_inner_BANG_(block,value,opts);
} else {
if(cljs.core.truth_(content)){
var content_changed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(content),clojure.string.trim(value));
if(content_changed_QMARK_){
return frontend.handler.editor.save_block_inner_BANG_(block,value,opts);
} else {
return null;
}
} else {
return null;
}

}
}
}));

(frontend.handler.editor.save_block_if_changed_BANG_.cljs$lang$maxFixedArity = 3);

frontend.handler.editor.compute_fst_snd_block_text = (function frontend$handler$editor$compute_fst_snd_block_text(value,selection_start,selection_end){
if(typeof value === 'string'){
var fst_block_text = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),selection_start);
var snd_block_text = clojure.string.triml(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,selection_end));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fst_block_text,snd_block_text], null);
} else {
return null;
}
});
frontend.handler.editor.outliner_insert_block_BANG_ = (function frontend$handler$editor$outliner_insert_block_BANG_(config,current_block,new_block,p__64917){
var map__64918 = p__64917;
var map__64918__$1 = cljs.core.__destructure_map(map__64918);
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64918__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64918__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var ordered_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64918__$1,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64918__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var ref_query_top_block_QMARK_ = (function (){var and__5000__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"ref-query-child?","ref-query-child?",317345933).cljs$core$IFn$_invoke$arity$1(config));
} else {
return and__5000__auto__;
}
})();
var has_children_QMARK_ = (function (){var G__64919 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__64919) : frontend.db.has_children_QMARK_.call(null,G__64919));
})();
var sibling_QMARK___$1 = (cljs.core.truth_(ref_query_top_block_QMARK_)?false:((cljs.core.boolean_QMARK_(sibling_QMARK_))?sibling_QMARK_:(cljs.core.truth_(frontend.util.collapsed_QMARK_(current_block))?true:cljs.core.not(has_children_QMARK_)
)));
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var G__64920_66029 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block], null);
(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(G__64920_66029) : frontend.handler.editor.save_current_block_BANG_.call(null,G__64920_66029));

return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),current_block,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));
} else {
var _STAR_outliner_ops_STAR__orig_val__64921 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__64922 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__64922);

try{var G__64923_66030 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block], null);
(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(G__64923_66030) : frontend.handler.editor.save_current_block_BANG_.call(null,G__64923_66030));

frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),current_block,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__64921);
}}
});
frontend.handler.editor.block_self_alone_when_insert_QMARK_ = (function frontend$handler$editor$block_self_alone_when_insert_QMARK_(config,uuid){
var current_page = frontend.state.get_current_page();
var block_id = (function (){var or__5002__auto__ = (function (){var G__64924 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if((G__64924 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__64924);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__64925 = current_page;
if((G__64925 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__64925);
}
}
})();
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(uuid,block_id);
});
frontend.handler.editor.insert_new_block_before_block_aux_BANG_ = (function frontend$handler$editor$insert_new_block_before_block_aux_BANG_(config,block,value){
var edit_input_id = frontend.state.get_edit_input_id();
var input = goog.dom.getElement(edit_input_id);
var input_text_selected_QMARK_ = frontend.util.input_text_selected_QMARK_(input);
var new_m = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null)),new cljs.core.Keyword("block","title","block/title",710445684),""], null);
var prev_block = frontend.handler.editor.wrap_parse_block(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","page","block/page",822314108)], null)),new_m], 0)));
var block_SINGLEQUOTE_ = (function (){var G__64926 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64926) : frontend.db.entity.call(null,G__64926));
})();
var left_or_parent = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(block_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
}
})();
if(input_text_selected_QMARK_){
var selection_start_66031 = frontend.util.get_selection_start(input);
var selection_end_66032 = frontend.util.get_selection_end(input);
var vec__64927_66033 = frontend.handler.editor.compute_fst_snd_block_text(value,selection_start_66031,selection_end_66032);
var __66034 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64927_66033,(0),null);
var new_content_66035 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64927_66033,(1),null);
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_input_id,new_content_66035);
} else {
}

var sibling_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left_or_parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)));
var result = frontend.handler.editor.outliner_insert_block_BANG_(config,left_or_parent,prev_block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [result,sibling_QMARK_,prev_block], null);
});
frontend.handler.editor.insert_new_block_aux_BANG_ = (function frontend$handler$editor$insert_new_block_aux_BANG_(config,p__64930,value){
var map__64931 = p__64930;
var map__64931__$1 = cljs.core.__destructure_map(map__64931);
var block = map__64931__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64931__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var block_self_QMARK_ = frontend.handler.editor.block_self_alone_when_insert_QMARK_(config,uuid);
var input = goog.dom.getElement(frontend.state.get_edit_input_id());
var selection_start = frontend.util.get_selection_start(input);
var selection_end = frontend.util.get_selection_end(input);
var vec__64932 = frontend.handler.editor.compute_fst_snd_block_text(value,selection_start,selection_end);
var fst_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64932,(0),null);
var snd_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64932,(1),null);
var current_block = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),fst_block_text);
var current_block__$1 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,current_block,logseq.db.file_based.schema.retract_attributes);
var new_m = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null)),new cljs.core.Keyword("block","title","block/title",710445684),snd_block_text], null);
var next_block = frontend.handler.editor.wrap_parse_block(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","page","block/page",822314108)], null)),new_m], 0)));
var sibling_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(block_self_QMARK_){
return false;
} else {
return null;
}
}
})();
var result = frontend.handler.editor.outliner_insert_block_BANG_(config,current_block__$1,next_block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [result,sibling_QMARK_,next_block], null);
});
frontend.handler.editor.clear_when_saved_BANG_ = (function frontend$handler$editor$clear_when_saved_BANG_(){
return frontend.commands.restore_state();
});
frontend.handler.editor.get_state = (function frontend$handler$editor$get_state(){
var vec__64935 = frontend.state.get_editor_args();
var map__64938 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64935,(0),null);
var map__64938__$1 = cljs.core.__destructure_map(map__64938);
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var block_parent_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64938__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64935,(1),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64935,(2),null);
var node = goog.dom.getElement(id);
if(cljs.core.truth_(node)){
var value = frontend.handler.editor.goog$module$goog$object.get(node,"value");
var pos = frontend.util.get_selection_start(node);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"pos","pos",-864607220),new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"block-container","block-container",-15068235),new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550)],[format,(function (){var or__5002__auto__ = (function (){var G__64941 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64941) : frontend.db.entity.call(null,G__64941));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})(),config,sidebar_QMARK_,value,pos,on_hide,node,block_id,id,frontend.util.rec_get_node(node,"ls-block"),block_parent_id]);
} else {
return null;
}
});
frontend.handler.editor.get_node_container_id = (function frontend$handler$editor$get_node_container_id(node){
var G__64942 = dommy.core.attr(node,"containerid");
if((G__64942 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__64942);
}
});
frontend.handler.editor.get_node_parent = (function frontend$handler$editor$get_node_parent(node){
var G__64943 = frontend.handler.editor.goog$module$goog$object.get(node,"parentNode");
if((G__64943 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__64943,"ls-block");
}
});
frontend.handler.editor.get_new_container_id = (function frontend$handler$editor$get_new_container_id(op,data){
var map__64944 = frontend.handler.editor.get_state();
var map__64944__$1 = cljs.core.__destructure_map(map__64944);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64944__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64944__$1,new cljs.core.Keyword(null,"block-container","block-container",-15068235));
if(cljs.core.truth_(block)){
var node = block_container;
var linked_QMARK_ = (!((dommy.core.attr(node,"originalblockid") == null)));
var G__64945 = op;
var G__64945__$1 = (((G__64945 instanceof cljs.core.Keyword))?G__64945.fqn:null);
switch (G__64945__$1) {
case "insert":
if(((linked_QMARK_) && ((!(new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060).cljs$core$IFn$_invoke$arity$1(data) === false))))){
var G__64946 = frontend.util.rec_get_node(node,"blocks-container");
if((G__64946 == null)){
return null;
} else {
return frontend.handler.editor.get_node_container_id(G__64946);
}
} else {
return null;
}

break;
case "indent":
var temp__5804__auto__ = node.previousSibling;
if(cljs.core.truth_(temp__5804__auto__)){
var prev = temp__5804__auto__;
if(cljs.core.truth_(dommy.core.attr(prev,"originalblockid"))){
return frontend.handler.editor.get_node_container_id(prev);
} else {
return null;
}
} else {
return null;
}

break;
case "move-up":
var parent = frontend.handler.editor.get_node_parent(node);
var prev = (cljs.core.truth_(parent)?parent.previousSibling:null);
if(cljs.core.truth_((function (){var and__5000__auto__ = prev;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.attr(prev,"originalblockid");
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.get_node_container_id(prev);
} else {
return null;
}

break;
case "move-down":
var parent = frontend.handler.editor.get_node_parent(node);
var next = (cljs.core.truth_(parent)?parent.nextSibling:null);
if(cljs.core.truth_((function (){var and__5000__auto__ = next;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.attr(next,"originalblockid");
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.get_node_container_id(next);
} else {
return null;
}

break;
case "outdent":
var temp__5804__auto__ = (function (){var G__64947 = frontend.handler.editor.goog$module$goog$object.get(node,"parentNode");
if((G__64947 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__64947,"ls-block");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
if(cljs.core.truth_(dommy.core.attr(parent,"originalblockid"))){
var G__64948 = frontend.util.rec_get_node(parent,"blocks-container");
if((G__64948 == null)){
return null;
} else {
return frontend.handler.editor.get_node_container_id(G__64948);
}
} else {
return null;
}
} else {
return null;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64945__$1)].join('')));

}
} else {
return null;
}
});
/**
 * Won't save previous block content - remember to save!
 */
frontend.handler.editor.insert_new_block_BANG_ = (function frontend$handler$editor$insert_new_block_BANG_(var_args){
var G__64950 = arguments.length;
switch (G__64950) {
case 1:
return frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (state){
return frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$2(state,null);
}));

(frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (_state,block_value){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2((((!(frontend.config.publishing_QMARK_)))?(function (){var temp__5804__auto__ = frontend.handler.editor.get_state();
if(cljs.core.truth_(temp__5804__auto__)){
var state = temp__5804__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395),"");

var map__64951 = state;
var map__64951__$1 = cljs.core.__destructure_map(map__64951);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64951__$1,new cljs.core.Keyword(null,"block","block",664686210));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64951__$1,new cljs.core.Keyword(null,"value","value",305978217));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64951__$1,new cljs.core.Keyword(null,"config","config",994861415));
var value__$1 = ((typeof block_value === 'string')?block_value:value);
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var block_self_QMARK_ = frontend.handler.editor.block_self_alone_when_insert_QMARK_(config,block_id);
var input_id = frontend.state.get_edit_input_id();
var input = goog.dom.getElement(input_id);
var selection_start = frontend.util.get_selection_start(input);
var selection_end = frontend.util.get_selection_end(input);
var vec__64952 = frontend.handler.editor.compute_fst_snd_block_text(value__$1,selection_start,selection_end);
var fst_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64952,(0),null);
var snd_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64952,(1),null);
var insert_above_QMARK_ = ((clojure.string.blank_QMARK_(fst_block_text)) && ((!(clojure.string.blank_QMARK_(snd_block_text)))));
var block_SINGLEQUOTE_ = (function (){var or__5002__auto__ = (function (){var G__64958 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64958) : frontend.db.entity.call(null,G__64958));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var original_block = new cljs.core.Keyword(null,"original-block","original-block",1808045862).cljs$core$IFn$_invoke$arity$1(config);
var block_SINGLEQUOTE__SINGLEQUOTE_ = (function (){var or__5002__auto__ = (cljs.core.truth_(original_block)?(function (){var e = (function (){var G__64959 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64959) : frontend.db.entity.call(null,G__64959));
})();
if((((!((cljs.core.first(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(e)) == null)))) && (cljs.core.not(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(e))))){
return block_SINGLEQUOTE_;
} else {
return original_block;
}
})():null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block_SINGLEQUOTE_;
}
})();
var insert_fn = ((block_self_QMARK_)?frontend.handler.editor.insert_new_block_aux_BANG_:((insert_above_QMARK_)?frontend.handler.editor.insert_new_block_before_block_aux_BANG_:frontend.handler.editor.insert_new_block_aux_BANG_
));
var vec__64955 = (insert_fn.cljs$core$IFn$_invoke$arity$3 ? insert_fn.cljs$core$IFn$_invoke$arity$3(config,block_SINGLEQUOTE__SINGLEQUOTE_,value__$1) : insert_fn.call(null,config,block_SINGLEQUOTE__SINGLEQUOTE_,value__$1));
var result_promise = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64955,(0),null);
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64955,(1),null);
var next_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64955,(2),null);
var edit_block_f = (function (){
var next_block_SINGLEQUOTE_ = (function (){var G__64960 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(next_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64960) : frontend.db.entity.call(null,G__64960));
})();
var pos = (0);
var unsaved_chars = cljs.core.deref(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var container_id = frontend.handler.editor.get_new_container_id(new cljs.core.Keyword(null,"insert","insert",1286475395),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_], null));
var G__64961 = next_block_SINGLEQUOTE_;
var G__64962 = (pos + cljs.core.count(unsaved_chars));
var G__64963 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(unsaved_chars),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(next_block_SINGLEQUOTE_))].join('')], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__64961,G__64962,G__64963) : frontend.handler.editor.edit_block_BANG_.call(null,G__64961,G__64962,G__64963));
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),edit_block_f)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(result_promise),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.handler.editor.clear_when_saved_BANG_());
}));
}));
}));
} else {
return null;
}
})():null),(function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395),null);
}));
}));

(frontend.handler.editor.insert_new_block_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.api_insert_new_block_BANG_ = (function frontend$handler$editor$api_insert_new_block_BANG_(content,p__64964){
var map__64965 = p__64964;
var map__64965__$1 = cljs.core.__destructure_map(map__64965);
var custom_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430));
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64965__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var other_attrs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"other-attrs","other-attrs",-951608726));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"page","page",849072397));
var before_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64965__$1,new cljs.core.Keyword(null,"before?","before?",765621039),false);
var edit_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64965__$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true);
var ordered_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64965__$1,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082));
if(cljs.core.truth_((function (){var or__5002__auto__ = page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block_uuid;
}
})())){
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var before_QMARK___$1 = (cljs.core.truth_(page)?false:before_QMARK_);
var sibling_QMARK___$1 = cljs.core.boolean$(sibling_QMARK_);
var sibling_QMARK___$2 = (cljs.core.truth_(before_QMARK___$1)?true:(cljs.core.truth_(page)?false:sibling_QMARK___$1));
var block = (cljs.core.truth_(page)?(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page)):(function (){var G__64966 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64966) : frontend.db.entity.call(null,G__64966));
})());
if(cljs.core.truth_(block)){
var last_block = (((!(sibling_QMARK___$2)))?(function (){var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block);
var blocks = (frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1(children) : frontend.db.sort_by_order.call(null,children));
var last_block_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.last(blocks));
if(cljs.core.truth_(last_block_id)){
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(last_block_id) : frontend.db.entity.call(null,last_block_id));
} else {
return null;
}
})():null);
var format = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var G__64970 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__64970) : frontend.db.get_page_format.call(null,G__64970));
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
}
})();
var content__$1 = (((((!(db_based_QMARK_))) && (cljs.core.seq(properties))))?frontend.handler.property.file.insert_properties_when_file_based(repo,format,content,properties):content);
var new_block = (function (){var G__64971 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108)], null)),new cljs.core.Keyword("block","title","block/title",710445684),content__$1);
if((!(db_based_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64971,new cljs.core.Keyword("block","format","block/format",-1212045901),format);
} else {
return G__64971;
}
})();
var new_block__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new_block,new cljs.core.Keyword("block","page","block/page",822314108),(cljs.core.truth_(page)?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block):new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(new_block))));
var new_block__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.editor.wrap_parse_block(new_block__$1),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var or__5002__auto__ = custom_uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null));
}
})());
var new_block__$3 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_block__$2,other_attrs], 0));
var vec__64967 = (cljs.core.truth_(before_QMARK___$1)?(function (){var left_or_parent = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
}
})();
var sibling_QMARK___$3 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left_or_parent)))?false:sibling_QMARK___$2);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [left_or_parent,sibling_QMARK___$3], null);
})():((sibling_QMARK___$2)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__64972 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64972) : frontend.db.entity.call(null,G__64972));
})(),sibling_QMARK___$2], null):(cljs.core.truth_(last_block)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [last_block,true], null):(cljs.core.truth_(block)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__64973 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64973) : frontend.db.entity.call(null,G__64973));
})(),sibling_QMARK___$2], null):null
))));
var block_m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64967,(0),null);
var sibling_QMARK___$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64967,(1),null);
if(cljs.core.truth_(block_m)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
frontend.handler.editor.outliner_insert_block_BANG_(cljs.core.PersistentArrayMap.EMPTY,block_m,new_block__$3,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$3,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

if(((db_based_QMARK_) && (cljs.core.seq(properties)))){
return frontend.handler.property.set_block_properties_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3),properties);
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__64974 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__64975 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__64975);

try{frontend.handler.editor.outliner_insert_block_BANG_(cljs.core.PersistentArrayMap.EMPTY,block_m,new_block__$3,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$3,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

if(((db_based_QMARK_) && (cljs.core.seq(properties)))){
frontend.handler.property.set_block_properties_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3),properties);
} else {
}

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__64974);
}}
})()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(edit_block_QMARK_)?(cljs.core.truth_((function (){var and__5000__auto__ = replace_empty_target_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(last_block));
} else {
return and__5000__auto__;
}
})())?(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(last_block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,last_block,new cljs.core.Keyword(null,"max","max",61366548))):(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(new_block__$3,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,new_block__$3,new cljs.core.Keyword(null,"max","max",61366548)))):null)),(function (___40947__auto____$1){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__64976 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64976) : frontend.db.entity.call(null,G__64976));
} else {
return null;
}
})());
}));
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
});
frontend.handler.editor.insert_first_page_block_if_not_exists_BANG_ = (function frontend$handler$editor$insert_first_page_block_if_not_exists_BANG_(page_uuid_or_title){
var page_title = cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid_or_title);
if(clojure.string.blank_QMARK_(page_title)){
return null;
} else {
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_title) : frontend.db.get_page.call(null,page_title));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var class_or_property_QMARK_ = (function (){var or__5002__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page));
}
})();
if(cljs.core.truth_((function (){var or__5002__auto__ = class_or_property_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__64977 = frontend.state.get_current_repo();
var G__64978 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2(G__64977,G__64978) : frontend.db.page_empty_QMARK_.call(null,G__64977,G__64978));
}
})())){
var new_block = (function (){var G__64979 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),""], null);
if((!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64979,new cljs.core.Keyword("block","format","block/format",-1212045901),cljs.core.get.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
} else {
return G__64979;
}
})();
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));
} else {
var _STAR_outliner_ops_STAR__orig_val__64980 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__64981 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__64981);

try{frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__64980);
}}
} else {
return null;
}
} else {
return null;
}
}
});
frontend.handler.editor.check = (function frontend$handler$editor$check(p__64982){
var map__64983 = p__64982;
var map__64983__$1 = cljs.core.__destructure_map(map__64983);
var block = map__64983__$1;
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64983__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64983__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var repeated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64983__$1,new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64983__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var new_content = clojure.string.replace_first(title,marker,"DONE");
var new_content__$1 = (cljs.core.truth_(repeated_QMARK_)?frontend.handler.file_based.editor.update_timestamps_content_BANG_(block,title):new_content);
var input_id = frontend.state.get_edit_input_id();
if(cljs.core.truth_((function (){var and__5000__auto__ = input_id;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.ends_with_QMARK_(input_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_content__$1);
} else {
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content__$1);
}
});
frontend.handler.editor.uncheck = (function frontend$handler$editor$uncheck(p__64984){
var map__64985 = p__64984;
var map__64985__$1 = cljs.core.__destructure_map(map__64985);
var block = map__64985__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64985__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64985__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var marker = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"now","now",-1650525531),frontend.state.get_preferred_workflow()))?"LATER":"TODO");
var new_content = clojure.string.replace_first(title,"DONE",marker);
var input_id = frontend.state.get_edit_input_id();
if(cljs.core.truth_((function (){var and__5000__auto__ = input_id;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.ends_with_QMARK_(input_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_content);
} else {
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
}
});
frontend.handler.editor.get_selected_blocks = (function frontend$handler$editor$get_selected_blocks(){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(frontend.state.get_selection_blocks()));
});
/**
 * The set-marker will set a new marker on the selected block.
 *   if the `new-marker` is nil, it will generate it automatically.
 */
frontend.handler.editor.set_marker = (function frontend$handler$editor$set_marker(var_args){
var G__64987 = arguments.length;
switch (G__64987) {
case 1:
return frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$1 = (function (block){
return frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$2(block,null);
}));

(frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$2 = (function (p__64988,new_marker){
var map__64989 = p__64988;
var map__64989__$1 = cljs.core.__destructure_map(map__64989);
var block = map__64989__$1;
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64989__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64989__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64989__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var vec__64990 = frontend.handler.file_based.status.cycle_marker(title,marker,new_marker,format,frontend.state.get_preferred_workflow());
var new_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64990,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64990,(1),null);
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
}));

(frontend.handler.editor.set_marker.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.file_based_cycle_todo_BANG_ = (function frontend$handler$editor$file_based_cycle_todo_BANG_(block){
if(cljs.core.truth_(cljs.core.not_empty(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block)))){
return frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$1(block);
} else {
return null;
}
});
frontend.handler.editor.db_based_cycle_todo_BANG_ = (function frontend$handler$editor$db_based_cycle_todo_BANG_(block){
var status_value = (cljs.core.truth_((function (){var G__64993 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)));
var G__64994 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__64993,G__64994) : logseq.db.class_instance_QMARK_.call(null,G__64993,G__64994));
})())?new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853).cljs$core$IFn$_invoke$arity$1(block):cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),cljs.core.PersistentArrayMap.EMPTY));
var next_status = (function (){var G__64995 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(status_value);
var G__64995__$1 = (((G__64995 instanceof cljs.core.Keyword))?G__64995.fqn:null);
switch (G__64995__$1) {
case "logseq.property/status.todo":
return new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908);

break;
case "logseq.property/status.doing":
return new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082);

break;
case "logseq.property/status.done":
return null;

break;
default:
return new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377);

}
})();
var repo = frontend.state.get_current_repo();
return frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(next_status) : frontend.db.entity.call(null,next_status))));
});
frontend.handler.editor.cycle_todos_BANG_ = (function frontend$handler$editor$cycle_todos_BANG_(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64997_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__64997_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return cljs.core.uuid(id);
} else {
return null;
}
}),blocks)));
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__64999 = cljs.core.seq(ids);
var chunk__65000 = null;
var count__65001 = (0);
var i__65002 = (0);
while(true){
if((i__65002 < count__65001)){
var id = chunk__65000.cljs$core$IIndexed$_nth$arity$2(null,i__65002);
var temp__5804__auto___66048__$1 = (function (){var G__65008 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65008) : frontend.db.entity.call(null,G__65008));
})();
if(cljs.core.truth_(temp__5804__auto___66048__$1)){
var block_66049 = temp__5804__auto___66048__$1;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_66049);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_66049);
}
} else {
}


var G__66050 = seq__64999;
var G__66051 = chunk__65000;
var G__66052 = count__65001;
var G__66053 = (i__65002 + (1));
seq__64999 = G__66050;
chunk__65000 = G__66051;
count__65001 = G__66052;
i__65002 = G__66053;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__64999);
if(temp__5804__auto____$1){
var seq__64999__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__64999__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__64999__$1);
var G__66056 = cljs.core.chunk_rest(seq__64999__$1);
var G__66057 = c__5525__auto__;
var G__66058 = cljs.core.count(c__5525__auto__);
var G__66059 = (0);
seq__64999 = G__66056;
chunk__65000 = G__66057;
count__65001 = G__66058;
i__65002 = G__66059;
continue;
} else {
var id = cljs.core.first(seq__64999__$1);
var temp__5804__auto___66060__$2 = (function (){var G__65009 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65009) : frontend.db.entity.call(null,G__65009));
})();
if(cljs.core.truth_(temp__5804__auto___66060__$2)){
var block_66061 = temp__5804__auto___66060__$2;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_66061);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_66061);
}
} else {
}


var G__66062 = cljs.core.next(seq__64999__$1);
var G__66063 = null;
var G__66064 = (0);
var G__66065 = (0);
seq__64999 = G__66062;
chunk__65000 = G__66063;
count__65001 = G__66064;
i__65002 = G__66065;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__65010 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65011 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65011);

try{var seq__65012_66066 = cljs.core.seq(ids);
var chunk__65013_66067 = null;
var count__65014_66068 = (0);
var i__65015_66069 = (0);
while(true){
if((i__65015_66069 < count__65014_66068)){
var id_66070 = chunk__65013_66067.cljs$core$IIndexed$_nth$arity$2(null,i__65015_66069);
var temp__5804__auto___66071__$1 = (function (){var G__65019 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_66070], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65019) : frontend.db.entity.call(null,G__65019));
})();
if(cljs.core.truth_(temp__5804__auto___66071__$1)){
var block_66072 = temp__5804__auto___66071__$1;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_66072);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_66072);
}
} else {
}


var G__66073 = seq__65012_66066;
var G__66074 = chunk__65013_66067;
var G__66075 = count__65014_66068;
var G__66076 = (i__65015_66069 + (1));
seq__65012_66066 = G__66073;
chunk__65013_66067 = G__66074;
count__65014_66068 = G__66075;
i__65015_66069 = G__66076;
continue;
} else {
var temp__5804__auto___66077__$1 = cljs.core.seq(seq__65012_66066);
if(temp__5804__auto___66077__$1){
var seq__65012_66078__$1 = temp__5804__auto___66077__$1;
if(cljs.core.chunked_seq_QMARK_(seq__65012_66078__$1)){
var c__5525__auto___66079 = cljs.core.chunk_first(seq__65012_66078__$1);
var G__66080 = cljs.core.chunk_rest(seq__65012_66078__$1);
var G__66081 = c__5525__auto___66079;
var G__66082 = cljs.core.count(c__5525__auto___66079);
var G__66083 = (0);
seq__65012_66066 = G__66080;
chunk__65013_66067 = G__66081;
count__65014_66068 = G__66082;
i__65015_66069 = G__66083;
continue;
} else {
var id_66084 = cljs.core.first(seq__65012_66078__$1);
var temp__5804__auto___66085__$2 = (function (){var G__65023 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_66084], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65023) : frontend.db.entity.call(null,G__65023));
})();
if(cljs.core.truth_(temp__5804__auto___66085__$2)){
var block_66086 = temp__5804__auto___66085__$2;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_66086);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_66086);
}
} else {
}


var G__66087 = cljs.core.next(seq__65012_66078__$1);
var G__66088 = null;
var G__66089 = (0);
var G__66090 = (0);
seq__65012_66066 = G__66087;
chunk__65013_66067 = G__66088;
count__65014_66068 = G__66089;
i__65015_66069 = G__66090;
continue;
}
} else {
}
}
break;
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65010);
}}
} else {
return null;
}
});
frontend.handler.editor.cycle_todo_BANG_ = (function frontend$handler$editor$cycle_todo_BANG_(){
if(cljs.core.truth_(frontend.state.get_editor_action())){
return null;
} else {
var temp__5802__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5802__auto__){
var blocks = temp__5802__auto__;
return frontend.handler.editor.cycle_todos_BANG_();
} else {
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var edit_block = temp__5804__auto__;
var edit_input_id = frontend.state.get_edit_input_id();
var current_input = goog.dom.getElement(edit_input_id);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
var temp__5804__auto____$1 = (function (){var G__65033 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(edit_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65033) : frontend.db.entity.call(null,G__65033));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var block = temp__5804__auto____$1;
var pos = frontend.state.get_edit_pos();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.handler.editor.db_based_cycle_todo_BANG_(block);
} else {
var _STAR_outliner_ops_STAR__orig_val__65039 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65040 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65040);

try{frontend.handler.editor.db_based_cycle_todo_BANG_(block);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65039);
}}
})());
}));
} else {
return null;
}
} else {
var content = frontend.state.get_edit_content();
var format = (function (){var or__5002__auto__ = (function (){var G__65044 = frontend.state.get_current_page();
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__65044) : frontend.db.get_page_format.call(null,G__65044));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
var vec__65041 = frontend.handler.file_based.status.cycle_marker(content,null,null,format,frontend.state.get_preferred_workflow());
var new_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65041,(0),null);
var marker = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65041,(1),null);
var new_pos = frontend.commands.compute_pos_delta_when_change_marker(content,marker,frontend.util.cursor.pos(current_input));
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_input_id,new_content);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(current_input,new_pos);
}
} else {
return null;
}
}
}
});
frontend.handler.editor.set_priority = (function frontend$handler$editor$set_priority(p__65046,new_priority){
var map__65047 = p__65046;
var map__65047__$1 = cljs.core.__destructure_map(map__65047);
var block = map__65047__$1;
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65047__$1,new cljs.core.Keyword("block","priority","block/priority",1491369544));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65047__$1,new cljs.core.Keyword("block","title","block/title",710445684));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return null;
} else {
var new_content = clojure.string.replace_first(title,(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[#%s]",priority) : frontend.util.format.call(null,"[#%s]",priority)),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[#%s]",new_priority) : frontend.util.format.call(null,"[#%s]",new_priority)));
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
}
});
frontend.handler.editor.delete_block_aux_BANG_ = (function frontend$handler$editor$delete_block_aux_BANG_(p__65050){
var map__65051 = p__65050;
var map__65051__$1 = cljs.core.__destructure_map(map__65051);
var _block = map__65051__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65051__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var block = (function (){var G__65052 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65052) : frontend.db.entity.call(null,G__65052));
})();
if(cljs.core.truth_(block)){
var blocks = frontend.handler.block.get_top_level_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null));
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.delete_blocks_BANG_(blocks,cljs.core.PersistentArrayMap.EMPTY);
} else {
var _STAR_outliner_ops_STAR__orig_val__65054 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65055 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65055);

try{frontend.modules.outliner.op.delete_blocks_BANG_(blocks,cljs.core.PersistentArrayMap.EMPTY);

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65054);
}}
} else {
return null;
}
});
frontend.handler.editor.move_to_prev_block = (function frontend$handler$editor$move_to_prev_block(repo,sibling_block,format,value){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return sibling_block;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = dommy.core.attr(sibling_block,"blockid");
if(cljs.core.truth_(temp__5804__auto__)){
var sibling_block_id = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__65056 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(sibling_block_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65056) : frontend.db.entity.call(null,G__65056));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var sibling_entity = temp__5804__auto____$1;
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(sibling_entity))){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"prev-block","prev-block",116851678),sibling_entity,new cljs.core.Keyword(null,"new-value","new-value",1087038368),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(sibling_entity),new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990),(function (){
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(sibling_entity,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,sibling_entity,new cljs.core.Keyword(null,"max","max",61366548)));
})], null);
} else {
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var original_content = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(sibling_entity),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block())))?frontend.state.get_edit_content():new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(sibling_entity));
var value_SINGLEQUOTE_ = ((db_QMARK_)?original_content:frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_built_in_properties_when_file_based(repo,format,original_content)));
var value__$1 = ((db_QMARK_)?value:frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_properties_when_file_based(repo,format,value)));
var new_value = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1)].join('');
var tail_len = cljs.core.count(value__$1);
var pos = (function (){var x__5087__auto__ = (cljs.core.truth_(original_content)?frontend.handler.editor.goog$module$goog$object.get(logseq.graph_parser.utf8.encode(original_content),"length"):(0));
var y__5088__auto__ = (0);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var vec__65057 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__65060 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(sibling_entity);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65060) : frontend.db.entity.call(null,G__65060));
})(),(function (){var G__65061 = dommy.core.attr(sibling_block,"containerid");
if((G__65061 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__65061);
}
})()], null);
var edit_target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65057,(0),null);
var container_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65057,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"prev-block","prev-block",116851678),sibling_entity,new cljs.core.Keyword(null,"new-content","new-content",525291180),new_value,new cljs.core.Keyword(null,"pos","pos",-864607220),pos,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990),(function (){
var G__65062 = edit_target;
var G__65063 = pos;
var G__65064 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),new_value,new cljs.core.Keyword(null,"tail-len","tail-len",699304522),tail_len,new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__65062,G__65063,G__65064) : frontend.handler.editor.edit_block_BANG_.call(null,G__65062,G__65063,G__65064));
})], null);
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
frontend.handler.editor.delete_block_inner_BANG_ = (function frontend$handler$editor$delete_block_inner_BANG_(repo,p__65065){
var map__65066 = p__65065;
var map__65066__$1 = cljs.core.__destructure_map(map__65066);
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65066__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65066__$1,new cljs.core.Keyword(null,"value","value",305978217));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65066__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65066__$1,new cljs.core.Keyword(null,"config","config",994861415));
if(cljs.core.truth_(block_id)){
var temp__5804__auto__ = (function (){var G__65067 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65067) : frontend.db.entity.call(null,G__65067));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_e = temp__5804__auto__;
var prev_block = frontend.db.model.get_prev((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_e));
var block_parent_id = ["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('');
if((((prev_block == null)) && ((new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block_e) == null)))){
return null;
} else {
var has_children_QMARK_ = cljs.core.seq(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block_e));
var block = (function (){var G__65068 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_e);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65068) : frontend.db.entity.call(null,G__65068));
})();
var left = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
}
})();
var left_has_children_QMARK_ = (function (){var and__5000__auto__ = left;
if(cljs.core.truth_(and__5000__auto__)){
var temp__5804__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(left);
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_id__$1 = temp__5804__auto____$1;
var block__$1 = (function (){var G__65069 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65069) : frontend.db.entity.call(null,G__65069));
})();
return cljs.core.seq(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block__$1));
} else {
return null;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = has_children_QMARK_;
if(and__5000__auto__){
return left_has_children_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if(cljs.core.truth_(block_parent_id)){
var block_parent = goog.dom.getElement(block_parent_id);
var sibling_or_parent_block = (cljs.core.truth_(new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config))?frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$2(block_parent,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container","container",-1736937707),frontend.util.rec_get_blocks_container(block_parent)], null)):frontend.util.get_prev_block_non_collapsed_non_embed(block_parent));
var map__65070 = frontend.handler.editor.move_to_prev_block(repo,sibling_or_parent_block,format,value);
var map__65070__$1 = cljs.core.__destructure_map(map__65070);
var prev_block__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65070__$1,new cljs.core.Keyword(null,"prev-block","prev-block",116851678));
var new_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65070__$1,new cljs.core.Keyword(null,"new-content","new-content",525291180));
var edit_block_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65070__$1,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990));
var concat_prev_block_QMARK_ = cljs.core.boolean$((function (){var and__5000__auto__ = prev_block__$1;
if(cljs.core.truth_(and__5000__auto__)){
return new_content;
} else {
return and__5000__auto__;
}
})());
var transact_opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_block__$1;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(prev_block__$1);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(prev_block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)));
if(and__5000__auto____$2){
var G__65071 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.model.hidden_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.model.hidden_page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__65071) : frontend.db.model.hidden_page_QMARK_.call(null,G__65071));
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
return null;
} else {
if(concat_prev_block_QMARK_){
var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((function (){var G__65072 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65072) : frontend.db.entity.call(null,G__65072));
})());
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var prev_block_is_not_parent_QMARK_ = cljs.core.empty_QMARK_(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(prev_block__$1));
var delete_prev_block_QMARK_ = ((db_based_QMARK_) && (((prev_block_is_not_parent_QMARK_) && (((cljs.core.empty_QMARK_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.not(new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.empty_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(prev_block__$1))) && (cljs.core.not(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block))))))))))))));
if(delete_prev_block_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),(function (){
var G__65073 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),new_content);
var G__65074 = cljs.core.count(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(prev_block__$1));
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(G__65073,G__65074) : frontend.handler.editor.edit_block_BANG_.call(null,G__65073,G__65074));
}))),(function (___40947__auto__){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
frontend.handler.editor.delete_block_aux_BANG_(prev_block__$1);

var G__65075 = repo;
var G__65076 = block;
var G__65077 = new_content;
var G__65078 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__65075,G__65076,G__65077,G__65078) : frontend.handler.editor.save_block_BANG_.call(null,G__65075,G__65076,G__65077,G__65078));
} else {
var _STAR_outliner_ops_STAR__orig_val__65079 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65080 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65080);

try{frontend.handler.editor.delete_block_aux_BANG_(prev_block__$1);

var G__65081_66100 = repo;
var G__65082_66101 = block;
var G__65083_66102 = new_content;
var G__65084_66103 = cljs.core.PersistentArrayMap.EMPTY;
(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__65081_66100,G__65082_66101,G__65083_66102,G__65084_66103) : frontend.handler.editor.save_block_BANG_.call(null,G__65081_66100,G__65082_66101,G__65083_66102,G__65084_66103));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),transact_opts);
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(transact_opts,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65079);
}}
})());
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),edit_block_f)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(cljs.core.seq(children)){
frontend.modules.outliner.op.move_blocks_BANG_(children,prev_block__$1,false);
} else {
}

frontend.handler.editor.delete_block_aux_BANG_(block);

var G__65085 = repo;
var G__65086 = prev_block__$1;
var G__65087 = new_content;
var G__65088 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__65085,G__65086,G__65087,G__65088) : frontend.handler.editor.save_block_BANG_.call(null,G__65085,G__65086,G__65087,G__65088));
} else {
var _STAR_outliner_ops_STAR__orig_val__65089 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65090 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65090);

try{if(cljs.core.seq(children)){
frontend.modules.outliner.op.move_blocks_BANG_(children,prev_block__$1,false);
} else {
}

frontend.handler.editor.delete_block_aux_BANG_(block);

var G__65091_66104 = repo;
var G__65092_66105 = prev_block__$1;
var G__65093_66106 = new_content;
var G__65094_66107 = cljs.core.PersistentArrayMap.EMPTY;
(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__65091_66104,G__65092_66105,G__65093_66106,G__65094_66107) : frontend.handler.editor.save_block_BANG_.call(null,G__65091_66104,G__65092_66105,G__65093_66106,G__65094_66107));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),transact_opts);
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(transact_opts,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65089);
}}
})());
}));
}));
}
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),edit_block_f)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(block));
}));
}));

}
}
} else {
return null;
}
}

}
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.delete_block_BANG_ = (function frontend$handler$editor$delete_block_BANG_(repo){
return frontend.handler.editor.delete_block_inner_BANG_(repo,frontend.handler.editor.get_state());
});
frontend.handler.editor.delete_blocks_BANG_ = (function frontend$handler$editor$delete_blocks_BANG_(repo,block_uuids,blocks,dom_blocks,mobile_action_bar_QMARK_){
if(cljs.core.seq(block_uuids)){
var uuid__GT_dom_block = cljs.core.zipmap(block_uuids,dom_blocks);
var block = cljs.core.first(blocks);
var block_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuid__GT_dom_block,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
var sibling_block = (cljs.core.truth_(block_parent)?frontend.util.get_prev_block_non_collapsed_non_embed(block_parent):null);
var blocks_SINGLEQUOTE_ = frontend.handler.block.get_top_level_blocks(blocks);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = sibling_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.util.capacitor_new_QMARK_());
} else {
return and__5000__auto__;
}
})())?(function (){var map__65095 = frontend.handler.editor.move_to_prev_block(repo,sibling_block,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),"");
var map__65095__$1 = cljs.core.__destructure_map(map__65095);
var edit_block_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65095__$1,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990));
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","edit-block-fn","editor/edit-block-fn",-42933801),edit_block_f);
})():null)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.delete_blocks_BANG_(blocks_SINGLEQUOTE_,null);
} else {
var _STAR_outliner_ops_STAR__orig_val__65096 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65097 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65097);

try{frontend.modules.outliner.op.delete_blocks_BANG_(blocks_SINGLEQUOTE_,null);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"mobile-action-bar?","mobile-action-bar?",921992889),mobile_action_bar_QMARK_], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"mobile-action-bar?","mobile-action-bar?",921992889),mobile_action_bar_QMARK_], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65096);
}}
})());
}));
}));
} else {
return null;
}
});
frontend.handler.editor.set_block_timestamp_BANG_ = (function frontend$handler$editor$set_block_timestamp_BANG_(block_id,key,value){
var key__$1 = clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(key));
var block_id__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var value__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
var temp__5804__auto__ = (function (){var G__65098 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65098) : frontend.db.entity.call(null,G__65098));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var map__65099 = block;
var map__65099__$1 = cljs.core.__destructure_map(map__65099);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65099__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var content = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_edit_content();
}
})();
var new_content = frontend.util.text.add_timestamp(frontend.util.text.remove_timestamp(content,key__$1),key__$1,value__$1);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(content,new_content)){
var input_id = frontend.state.get_edit_input_id();
if(cljs.core.truth_((function (){var and__5000__auto__ = input_id;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.ends_with_QMARK_(input_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id__$1));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_content);
} else {
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Almost the same as set-block-timestamp! except for:
 * - it doesn't save the block
 * - it extracts current content from current input
 */
frontend.handler.editor.set_editing_block_timestamp_BANG_ = (function frontend$handler$editor$set_editing_block_timestamp_BANG_(key,value){
var key__$1 = clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(key));
var value__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
var content = frontend.state.get_edit_content();
var new_content = frontend.util.text.add_timestamp(frontend.util.text.remove_timestamp(content,key__$1),key__$1,value__$1);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(content,new_content)){
var input_id = frontend.state.get_edit_input_id();
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_content);
} else {
return null;
}
});
/**
 * Persist block uuid to file if the uuid is valid, and it's not persisted in file.
 * Accepts a list of uuids.
 */
frontend.handler.editor.set_blocks_id_BANG_ = (function frontend$handler$editor$set_blocks_id_BANG_(block_ids){
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return null;
} else {
return frontend.handler.file_based.editor.set_blocks_id_BANG_(block_ids);
}
});
frontend.handler.editor.copy_block_ref_BANG_ = (function frontend$handler$editor$copy_block_ref_BANG_(var_args){
var G__65107 = arguments.length;
switch (G__65107) {
case 1:
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__65105_SHARP_){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__65105_SHARP_);
}));
}));

(frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,tap_clipboard){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.set_blocks_id_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null))),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.util.copy_to_clipboard_BANG_((tap_clipboard.cljs$core$IFn$_invoke$arity$1 ? tap_clipboard.cljs$core$IFn$_invoke$arity$1(block_id) : tap_clipboard.call(null,block_id))));
}));
}));
}));
}));

(frontend.handler.editor.copy_block_ref_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.select_block_BANG_ = (function frontend$handler$editor$select_block_BANG_(block_uuid){
return frontend.handler.block.select_block_BANG_(block_uuid);
});
frontend.handler.editor.compose_copied_blocks_contents = (function frontend$handler$editor$compose_copied_blocks_contents(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66110 = arguments.length;
var i__5727__auto___66111 = (0);
while(true){
if((i__5727__auto___66111 < len__5726__auto___66110)){
args__5732__auto__.push((arguments[i__5727__auto___66111]));

var G__66113 = (i__5727__auto___66111 + (1));
i__5727__auto___66111 = G__66113;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic = (function (repo,block_ids,p__65112){
var map__65113 = p__65112;
var map__65113__$1 = cljs.core.__destructure_map(map__65113);
var opts = map__65113__$1;
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var G__65114 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65114) : frontend.db.entity.call(null,G__65114));
}),block_ids);
var top_level_block_uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.handler.block.get_top_level_blocks(blocks));
var content = frontend.handler.export$.text.export_blocks_as_markdown(repo,top_level_block_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),frontend.state.get_export_block_text_indent_style(),new cljs.core.Keyword(null,"remove-options","remove-options",768737839),cljs.core.set(frontend.state.get_export_block_text_remove_options())], null)], 0)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [top_level_block_uuids,content], null);
}));

(frontend.handler.editor.compose_copied_blocks_contents.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.editor.compose_copied_blocks_contents.cljs$lang$applyTo = (function (seq65108){
var G__65110 = cljs.core.first(seq65108);
var seq65108__$1 = cljs.core.next(seq65108);
var G__65111 = cljs.core.first(seq65108__$1);
var seq65108__$2 = cljs.core.next(seq65108__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65110,G__65111,seq65108__$2);
}));

frontend.handler.editor.get_all_blocks_by_ids = (function frontend$handler$editor$get_all_blocks_by_ids(repo,ids){
var ids__$1 = ids;
var result = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.seq(ids__$1)){
var db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__65124 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ids__$1)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65124) : frontend.db.entity.call(null,G__65124));
})());
var blocks = frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic(repo,db_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null)], 0));
var result__$1 = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result,blocks));
var G__66114 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),result__$1)),cljs.core.rest(ids__$1));
var G__66115 = result__$1;
ids__$1 = G__66114;
result = G__66115;
continue;
} else {
return result;
}
break;
}
});
frontend.handler.editor.copy_selection_blocks = (function frontend$handler$editor$copy_selection_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66116 = arguments.length;
var i__5727__auto___66117 = (0);
while(true){
if((i__5727__auto___66117 < len__5726__auto___66116)){
args__5732__auto__.push((arguments[i__5727__auto___66117]));

var G__66119 = (i__5727__auto___66117 + (1));
i__5727__auto___66117 = G__66119;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.copy_selection_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.copy_selection_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (html_QMARK_,p__65138){
var map__65139 = p__65138;
var map__65139__$1 = cljs.core.__destructure_map(map__65139);
var opts = map__65139__$1;
var selected_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65139__$1,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948));
var repo = frontend.state.get_current_repo();
var selected_ids = frontend.state.get_selection_block_ids();
var ids = (function (){var or__5002__auto__ = cljs.core.seq(selected_ids);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),selected_blocks);
}
})();
var vec__65140 = frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic(repo,ids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
var top_level_block_uuids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65140,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65140,(1),null);
var block = (function (){var G__65143 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ids)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65143) : frontend.db.entity.call(null,G__65143));
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(block)){
var html_66120 = frontend.handler.export$.html.export_blocks_as_html(repo,top_level_block_uuids,null);
var copied_blocks_66121 = (function (){var G__65144 = frontend.handler.editor.get_all_blocks_by_ids(repo,top_level_block_uuids);
if(db_based_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
var b = (function (){var G__65145 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65145) : frontend.db.entity.call(null,G__65145));
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__65146){
var vec__65147 = p__65146;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65147,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65147,(1),null);
var v_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(v);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__65150 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65150) : frontend.db.entity.call(null,G__65150));
})())], null):((((cljs.core.coll_QMARK_(v)) && (cljs.core.every_QMARK_((function (p1__65131_SHARP_){
var and__5000__auto____$1 = cljs.core.map_QMARK_(p1__65131_SHARP_);
if(and__5000__auto____$1){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__65131_SHARP_);
} else {
return and__5000__auto____$1;
}
}),v))))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (i){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__65151 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(i);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65151) : frontend.db.entity.call(null,G__65151));
})())], null);
}),v)):v
));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v_SINGLEQUOTE_], null);
}),b)),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
}),G__65144);
} else {
return G__65144;
}
})();
frontend.handler.common.copy_to_clipboard_without_id_property_BANG_(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content,(cljs.core.truth_(html_QMARK_)?html_66120:null),copied_blocks_66121);

frontend.state.set_block_op_type_BANG_(new cljs.core.Keyword(null,"copy","copy",-1077617309));

if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
return null;
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));
}
} else {
return null;
}
}));

(frontend.handler.editor.copy_selection_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.copy_selection_blocks.cljs$lang$applyTo = (function (seq65132){
var G__65133 = cljs.core.first(seq65132);
var seq65132__$1 = cljs.core.next(seq65132);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65133,seq65132__$1);
}));

frontend.handler.editor.copy_block_refs = (function frontend$handler$editor$copy_block_refs(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5804__auto__){
var selected_blocks = temp__5804__auto__;
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65152_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__65152_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
var level = dommy.core.attr(p1__65152_SHARP_,"level");
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.uuid(id),new cljs.core.Keyword(null,"level","level",1290497552),(level | (0))], null);
} else {
return null;
}
}),selected_blocks)));
var first_block = cljs.core.first(blocks);
var first_root_level_index = cljs.core.ffirst(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__65156){
var vec__65157 = p__65156;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65157,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65157,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(block),(1));
}),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,blocks)));
var root_level = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(first_block));
var adjusted_blocks = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (index,p__65160){
var map__65161 = p__65160;
var map__65161__$1 = cljs.core.__destructure_map(map__65161);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65161__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65161__$1,new cljs.core.Keyword(null,"level","level",1290497552));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"level","level",1290497552),(((index < first_root_level_index))?(((level < cljs.core.deref(root_level)))?(function (){
cljs.core.reset_BANG_(root_level,level);

return (1);
})()
:((level - cljs.core.deref(root_level)) + (1))):level)], null);
}),blocks);
var block = (function (){var G__65162 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(first_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65162) : frontend.db.entity.call(null,G__65162));
})();
var copy_str = (function (){var G__65163 = adjusted_blocks;
var G__65163__$1 = (((G__65163 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__65164){
var map__65165 = p__65164;
var map__65165__$1 = cljs.core.__destructure_map(map__65165);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65165__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65165__$1,new cljs.core.Keyword(null,"level","level",1290497552));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t")),"- ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(id) : frontend.util.ref.__GT_page_ref.call(null,id)))].join('');
} else {
var pred__65166 = cljs.core._EQ_;
var expr__65167 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_((pred__65166.cljs$core$IFn$_invoke$arity$2 ? pred__65166.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),expr__65167) : pred__65166.call(null,new cljs.core.Keyword(null,"org","org",1495985),expr__65167)))){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(level,"*"))," ",frontend.util.ref.__GT_block_ref(id)].join('');
} else {
if(cljs.core.truth_((pred__65166.cljs$core$IFn$_invoke$arity$2 ? pred__65166.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),expr__65167) : pred__65166.call(null,new cljs.core.Keyword(null,"markdown","markdown",1227225089),expr__65167)))){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t")),"- ",frontend.util.ref.__GT_block_ref(id)].join('');
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expr__65167)].join('')));
}
}
}
}),G__65163));
if((G__65163__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__65163__$1);
}
})();
frontend.handler.editor.set_blocks_id_BANG_(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),blocks));

return frontend.util.copy_to_clipboard_BANG_(copy_str);
} else {
return null;
}
});
frontend.handler.editor.copy_block_embeds = (function frontend$handler$editor$copy_block_embeds(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65170_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__65170_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return cljs.core.uuid(id);
} else {
return null;
}
}),blocks)));
var ids_str = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?(function (){var G__65171 = ids;
var G__65171__$1 = (((G__65171 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return frontend.util.ref.__GT_block_ref(id);
}),G__65171));
if((G__65171__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__65171__$1);
}
})():(function (){var G__65172 = ids;
var G__65172__$1 = (((G__65172 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed ((%s))}}",id) : frontend.util.format.call(null,"{{embed ((%s))}}",id));
}),G__65172));
if((G__65172__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__65172__$1);
}
})());
frontend.handler.editor.set_blocks_id_BANG_(ids);

return frontend.util.copy_to_clipboard_BANG_(ids_str);
} else {
return null;
}
});
frontend.handler.editor.get_selected_toplevel_block_uuids = (function frontend$handler$editor$get_selected_toplevel_block_uuids(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var repo = frontend.state.get_current_repo();
var block_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65173_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__65173_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return cljs.core.uuid(id);
} else {
return null;
}
}),blocks)));
var blocks__$1 = frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_ids));
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks__$1)));
var blocks_STAR_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
var G__65174 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
if((G__65174 == null)){
return null;
} else {
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(G__65174,page_id);
}
}),blocks__$1);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.handler.block.get_top_level_blocks(blocks_STAR_));
} else {
return null;
}
});
frontend.handler.editor.cut_selection_blocks = (function frontend$handler$editor$cut_selection_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66126 = arguments.length;
var i__5727__auto___66127 = (0);
while(true){
if((i__5727__auto___66127 < len__5726__auto___66126)){
args__5732__auto__.push((arguments[i__5727__auto___66127]));

var G__66128 = (i__5727__auto___66127 + (1));
i__5727__auto___66127 = G__66128;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.cut_selection_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.cut_selection_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (copy_QMARK_,p__65179){
var map__65180 = p__65179;
var map__65180__$1 = cljs.core.__destructure_map(map__65180);
var mobile_action_bar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65180__$1,new cljs.core.Keyword(null,"mobile-action-bar?","mobile-action-bar?",921992889));
if(cljs.core.truth_(copy_QMARK_)){
frontend.handler.editor.copy_selection_blocks(true);
} else {
}

frontend.state.set_block_op_type_BANG_(new cljs.core.Keyword(null,"cut","cut",-1042666209));

var temp__5804__auto__ = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-query"))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-transclude"))));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__65175_SHARP_){
return dommy.core.has_class_QMARK_(p1__65175_SHARP_,"property-value-container");
}),frontend.handler.editor.get_selected_blocks())));
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var dom_blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-query"));
}),blocks);
if(cljs.core.seq(dom_blocks)){
var repo = frontend.state.get_current_repo();
var block_uuids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65176_SHARP_){
return cljs.core.uuid(dommy.core.attr(p1__65176_SHARP_,"blockid"));
}),dom_blocks));
var lookup_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_uuids);
var blocks__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,lookup_refs));
var top_level_blocks = ((cljs.core.seq(blocks__$1))?frontend.handler.block.get_top_level_blocks(blocks__$1):null);
var sorted_blocks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
return frontend.modules.outliner.tree.get_sorted_block_and_children(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([top_level_blocks], 0));
if(cljs.core.seq(sorted_blocks)){
return frontend.handler.editor.delete_blocks_BANG_(repo,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),sorted_blocks),sorted_blocks,dom_blocks,mobile_action_bar_QMARK_);
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

(frontend.handler.editor.cut_selection_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.cut_selection_blocks.cljs$lang$applyTo = (function (seq65177){
var G__65178 = cljs.core.first(seq65177);
var seq65177__$1 = cljs.core.next(seq65177);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65178,seq65177__$1);
}));

/**
 * Didn't use link/plain-link as it is incorrectly detects words as urls.
 */
frontend.handler.editor.url_regex = /[^\s\(\[]+:\/\/[^\s\)\]]+/;
frontend.handler.editor.extract_nearest_link_from_text = (function frontend$handler$editor$extract_nearest_link_from_text(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66130 = arguments.length;
var i__5727__auto___66131 = (0);
while(true){
if((i__5727__auto___66131 < len__5726__auto___66130)){
args__5732__auto__.push((arguments[i__5727__auto___66131]));

var G__66132 = (i__5727__auto___66131 + (1));
i__5727__auto___66131 = G__66132;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.editor.extract_nearest_link_from_text.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.editor.extract_nearest_link_from_text.cljs$core$IFn$_invoke$arity$variadic = (function (text,pos,additional_patterns){
var page_pattern = /\[\[([^\]]+)]]/;
var tag_pattern = /#\S+/;
var page_matches = frontend.util.re_pos(page_pattern,text);
var block_matches = frontend.util.re_pos(logseq.common.util.block_ref.block_ref_re,text);
var tag_matches = frontend.util.re_pos(tag_pattern,text);
var additional_matches = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__65181_SHARP_){
return frontend.util.re_pos(p1__65181_SHARP_,text);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([additional_patterns], 0));
var matches = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(page_matches,block_matches,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tag_matches,additional_matches], 0)));
var vec__65186 = cljs.core.first(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (p__65189){
var vec__65190 = p__65189;
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65190,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65190,(1),null);
var end_pos = (start_pos + cljs.core.count(content));
if((pos < start_pos)){
return (pos - start_pos);
} else {
if((pos > end_pos)){
return (end_pos - pos);
} else {
return (0);

}
}
}),cljs.core._GT_,matches));
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65186,(0),null);
var match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65186,(1),null);
if(cljs.core.truth_(match)){
if(cljs.core.truth_(cljs.core.some((function (p1__65182_SHARP_){
return cljs.core.re_find(p1__65182_SHARP_,match);
}),additional_patterns))){
return match;
} else {
if(clojure.string.starts_with_QMARK_(match,"#")){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(match,(1),cljs.core.count(match));
} else {
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(match,(2),(cljs.core.count(match) - (2)));

}
}
} else {
return null;
}
}));

(frontend.handler.editor.extract_nearest_link_from_text.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.editor.extract_nearest_link_from_text.cljs$lang$applyTo = (function (seq65183){
var G__65184 = cljs.core.first(seq65183);
var seq65183__$1 = cljs.core.next(seq65183);
var G__65185 = cljs.core.first(seq65183__$1);
var seq65183__$2 = cljs.core.next(seq65183__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65184,G__65185,seq65183__$2);
}));

/**
 * Return the nearest page-name (not dereferenced, may be an alias), block, tag or url
 */
frontend.handler.editor.get_nearest_page_or_url = (function frontend$handler$editor$get_nearest_page_or_url(){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))){
var temp__5804__auto____$1 = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto____$1)){
var edit_id = temp__5804__auto____$1;
var temp__5804__auto____$2 = goog.dom.getElement(edit_id);
if(cljs.core.truth_(temp__5804__auto____$2)){
var input = temp__5804__auto____$2;
var temp__5804__auto____$3 = frontend.util.cursor.pos(input);
if(cljs.core.truth_(temp__5804__auto____$3)){
var pos = temp__5804__auto____$3;
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
return frontend.handler.editor.extract_nearest_link_from_text.cljs$core$IFn$_invoke$arity$variadic(value,pos,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.editor.url_regex], 0));
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
} else {
return null;
}
});
/**
 * Return the nearest page-name (not dereferenced, may be an alias), block or tag
 */
frontend.handler.editor.get_nearest_page = (function frontend$handler$editor$get_nearest_page(){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))){
var temp__5804__auto____$1 = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto____$1)){
var edit_id = temp__5804__auto____$1;
var temp__5804__auto____$2 = goog.dom.getElement(edit_id);
if(cljs.core.truth_(temp__5804__auto____$2)){
var input = temp__5804__auto____$2;
var temp__5804__auto____$3 = frontend.util.cursor.pos(input);
if(cljs.core.truth_(temp__5804__auto____$3)){
var pos = temp__5804__auto____$3;
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
return frontend.handler.editor.extract_nearest_link_from_text(value,pos);
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
} else {
return null;
}
});
frontend.handler.editor.follow_link_under_cursor_BANG_ = (function frontend$handler$editor$follow_link_under_cursor_BANG_(){
var temp__5804__auto__ = frontend.handler.editor.get_nearest_page_or_url();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
if(clojure.string.blank_QMARK_(page)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_editor_action_BANG_()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(cljs.core.re_find(frontend.handler.editor.url_regex,page))?window.open(page):(function (){var page_name = frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1(page);
frontend.state.clear_edit_BANG_();

return frontend.handler.editor.insert_first_page_block_if_not_exists_BANG_(page_name);
})()));
}));
}));
}));
}
} else {
return null;
}
});
frontend.handler.editor.open_link_in_sidebar_BANG_ = (function frontend$handler$editor$open_link_in_sidebar_BANG_(){
var temp__5804__auto__ = frontend.handler.editor.get_nearest_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var page_name = clojure.string.lower_case(page);
var block_QMARK_ = (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.uuid_string_QMARK_.call(null,page_name));
var temp__5804__auto____$1 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
if(cljs.core.truth_(temp__5804__auto____$1)){
var page__$1 = temp__5804__auto____$1;
if(cljs.core.truth_(block_QMARK_)){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword(null,"block","block",664686210));
} else {
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword(null,"page","page",849072397));
}
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.zoom_in_BANG_ = (function frontend$handler$editor$zoom_in_BANG_(){
if(frontend.state.editing_QMARK_()){
var temp__5804__auto__ = (function (){var G__65193 = frontend.state.get_edit_block();
var G__65193__$1 = (((G__65193 == null))?null:new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__65193));
var G__65193__$2 = (((G__65193__$1 == null))?null:(function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
})(G__65193__$1));
var G__65193__$3 = (((G__65193__$2 == null))?null:(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65193__$2) : frontend.db.entity.call(null,G__65193__$2)));
if((G__65193__$3 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__65193__$3);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
frontend.state.clear_editor_action_BANG_();

frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473),id], null));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(id));
}));
}));
} else {
return null;
}
} else {
return window.history.forward();
}
});
frontend.handler.editor.zoom_out_BANG_ = (function frontend$handler$editor$zoom_out_BANG_(){
if(frontend.state.editing_QMARK_()){
var page = frontend.state.get_current_page();
var block_id = (function (){var and__5000__auto__ = typeof page === 'string';
if(and__5000__auto__){
return cljs.core.parse_uuid(page);
} else {
return and__5000__auto__;
}
})();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_editor_action_BANG_()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(block_id)?(function (){
frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block())], null));

var block_parent = (frontend.db.get_block_parent.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_block_parent.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.db.get_block_parent.call(null,block_id));
var temp__5802__auto__ = (function (){var and__5000__auto__ = (new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block_parent) == null);
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_parent);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(id);
} else {
var page_id = (function (){var G__65196 = (function (){var G__65197 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65197) : frontend.db.entity.call(null,G__65197));
})();
var G__65196__$1 = (((G__65196 == null))?null:new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(G__65196));
if((G__65196__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__65196__$1);
}
})();
var temp__5804__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(page_id) : frontend.db.entity.call(null,page_id));
if(cljs.core.truth_(temp__5804__auto__)){
var page__$1 = temp__5804__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page__$1));
} else {
return null;
}
}
})()
:null));
}));
}));
}));
} else {
return window.history.back();
}
});
frontend.handler.editor.cut_block_BANG_ = (function frontend$handler$editor$cut_block_BANG_(block_id){
var temp__5804__auto__ = (function (){var G__65201 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65201) : frontend.db.entity.call(null,G__65201));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var repo = frontend.state.get_current_repo();
var vec__65203 = frontend.handler.editor.compose_copied_blocks_contents(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
var _top_level_block_uuids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65203,(0),null);
var md_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65203,(1),null);
var html = frontend.handler.export$.html.export_blocks_as_html(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),null);
var sorted_blocks = frontend.modules.outliner.tree.get_sorted_block_and_children(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
frontend.handler.common.copy_to_clipboard_without_id_property_BANG_(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),md_content,html,sorted_blocks);

frontend.state.set_block_op_type_BANG_(new cljs.core.Keyword(null,"cut","cut",-1042666209));

return frontend.handler.editor.delete_block_aux_BANG_(block);
} else {
return null;
}
});
frontend.handler.editor.highlight_selection_area_BANG_ = (function frontend$handler$editor$highlight_selection_area_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66137 = arguments.length;
var i__5727__auto___66138 = (0);
while(true){
if((i__5727__auto___66138 < len__5726__auto___66137)){
args__5732__auto__.push((arguments[i__5727__auto___66138]));

var G__66139 = (i__5727__auto___66138 + (1));
i__5727__auto___66138 = G__66139;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (end_block_id,p__65211){
var map__65212 = p__65211;
var map__65212__$1 = cljs.core.__destructure_map(map__65212);
var append_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65212__$1,new cljs.core.Keyword(null,"append?","append?",123923917));
var temp__5804__auto__ = frontend.state.get_selection_start_block_or_first();
if(cljs.core.truth_(temp__5804__auto__)){
var start_block = temp__5804__auto__;
var end_block_node = goog.dom.getElement(end_block_id);
var start_node = goog.dom.getElement(start_block);
var select_direction = frontend.state.get_selection_direction();
var selected_blocks = frontend.state.get_unsorted_selection_blocks();
var last_node = (function (){var temp__5804__auto____$1 = cljs.core.last(selected_blocks);
if(cljs.core.truth_(temp__5804__auto____$1)){
var node = temp__5804__auto____$1;
return goog.dom.getElement(node.id);
} else {
return null;
}
})();
var latest_visible_block = (function (){var or__5002__auto__ = last_node;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return start_node;
}
})();
var latest_block_id = (cljs.core.truth_(latest_visible_block)?latest_visible_block.id:null);
if(cljs.core.truth_((function (){var and__5000__auto__ = start_node;
if(cljs.core.truth_(and__5000__auto__)){
return end_block_node;
} else {
return and__5000__auto__;
}
})())){
var blocks = frontend.util.get_nodes_between_two_nodes(start_block,end_block_id,"ls-block");
var direction = frontend.util.get_direction_between_two_nodes(start_block,end_block_id,"ls-block");
var blocks__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"up","up",-269712113)))?cljs.core.reverse(blocks):blocks);
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks__$1,direction);
} else {
if(cljs.core.truth_(latest_visible_block)){
var blocks = frontend.util.get_nodes_between_two_nodes(latest_block_id,end_block_id,"ls-block");
var direction = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(latest_block_id,end_block_id))?select_direction:frontend.util.get_direction_between_two_nodes(latest_block_id,end_block_id,"ls-block"));
var blocks__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"up","up",-269712113)))?cljs.core.reverse(frontend.util.sort_by_height(blocks)):frontend.util.sort_by_height(blocks));
if(cljs.core.truth_(append_QMARK_)){
frontend.state.clear_edit_BANG_();

if(cljs.core.truth_((function (){var and__5000__auto__ = select_direction;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(direction,select_direction);
} else {
return and__5000__auto__;
}
})())){
return frontend.state.drop_selection_blocks_starts_with_BANG_(end_block_node);
} else {
return frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(blocks__$1,direction);
}
} else {
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$2(blocks__$1,direction);
}
} else {
return null;
}
}
} else {
return null;
}
}));

(frontend.handler.editor.highlight_selection_area_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.highlight_selection_area_BANG_.cljs$lang$applyTo = (function (seq65209){
var G__65210 = cljs.core.first(seq65209);
var seq65209__$1 = cljs.core.next(seq65209);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65210,seq65209__$1);
}));

if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.editor !== 'undefined') && (typeof frontend.handler.editor._STAR_action_bar_timeout !== 'undefined')){
} else {
frontend.handler.editor._STAR_action_bar_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.handler.editor.popup_exists_QMARK_ = (function frontend$handler$editor$popup_exists_QMARK_(id){
var G__65214 = logseq.shui.popup.core.get_popups();
if((G__65214 == null)){
return null;
} else {
return cljs.core.some((function (p1__65213_SHARP_){
var G__65215 = p1__65213_SHARP_;
var G__65215__$1 = (((G__65215 == null))?null:new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__65215));
var G__65215__$2 = (((G__65215__$1 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65215__$1));
if((G__65215__$2 == null)){
return null;
} else {
return clojure.string.includes_QMARK_(G__65215__$2,cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
}
}),G__65214);
}
});
frontend.handler.editor.show_action_bar_BANG_ = (function frontend$handler$editor$show_action_bar_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66140 = arguments.length;
var i__5727__auto___66141 = (0);
while(true){
if((i__5727__auto___66141 < len__5726__auto___66140)){
args__5732__auto__.push((arguments[i__5727__auto___66141]));

var G__66142 = (i__5727__auto___66141 + (1));
i__5727__auto___66141 = G__66142;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.editor.show_action_bar_BANG_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.editor.show_action_bar_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__65217){
var map__65218 = p__65217;
var map__65218__$1 = cljs.core.__destructure_map(map__65218);
var delay = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65218__$1,new cljs.core.Keyword(null,"delay","delay",-574225219),(200));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.handler.editor.popup_exists_QMARK_(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___66143 = cljs.core.deref(frontend.handler.editor._STAR_action_bar_timeout);
if(cljs.core.truth_(temp__5804__auto___66143)){
var timeout_66144 = temp__5804__auto___66143;
clearTimeout(timeout_66144);
} else {
}

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));

if(cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return dommy.core.has_class_QMARK_(b,"ls-table-cell");
}),frontend.state.get_selection_blocks()))){
var timeout = setTimeout((function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-action-bar","editor/show-action-bar",-1302945332)], null));
}),delay);
return cljs.core.reset_BANG_(frontend.handler.editor._STAR_action_bar_timeout,timeout);
} else {
return null;
}
} else {
return null;
}
}));

(frontend.handler.editor.show_action_bar_BANG_.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.handler.editor.show_action_bar_BANG_.cljs$lang$applyTo = (function (seq65216){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq65216));
}));

frontend.handler.editor.select_block_up_down = (function frontend$handler$editor$select_block_up_down(direction){
if(frontend.state.editing_QMARK_()){
var element_66145 = goog.dom.getElement(frontend.state.get_editing_block_dom_id());
if(cljs.core.truth_(element_66145)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_66145)),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [element_66145], null)));
}));
}));
}));
} else {
}
} else {
if(((frontend.state.selection_QMARK_()) && (((1) === cljs.core.count(frontend.state.get_selection_blocks()))))){
var f_66146 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed_skip);
var element_66147 = (function (){var G__65219 = cljs.core.first(frontend.state.get_selection_blocks());
var G__65220 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_66146.cljs$core$IFn$_invoke$arity$2 ? f_66146.cljs$core$IFn$_invoke$arity$2(G__65219,G__65220) : f_66146.call(null,G__65219,G__65220));
})();
if(cljs.core.truth_(element_66147)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_66147);

frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(element_66147,direction);
} else {
}
} else {
if(((frontend.state.selection_QMARK_()) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,frontend.state.get_selection_direction())))){
var f_66148 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed_skip);
var first_last_66149 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?cljs.core.first:cljs.core.last);
var element_66150 = (function (){var G__65221 = (function (){var G__65223 = frontend.state.get_selection_blocks();
return (first_last_66149.cljs$core$IFn$_invoke$arity$1 ? first_last_66149.cljs$core$IFn$_invoke$arity$1(G__65223) : first_last_66149.call(null,G__65223));
})();
var G__65222 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_66148.cljs$core$IFn$_invoke$arity$2 ? f_66148.cljs$core$IFn$_invoke$arity$2(G__65221,G__65222) : f_66148.call(null,G__65221,G__65222));
})();
if(cljs.core.truth_(element_66150)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_66150);

frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(element_66150,direction);
} else {
}
} else {
if(frontend.state.selection_QMARK_()){
var f_66151 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed);
var last_first_66152 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?cljs.core.last:cljs.core.first);
var element_66153 = (function (){var G__65224 = (function (){var G__65226 = frontend.state.get_selection_blocks();
return (last_first_66152.cljs$core$IFn$_invoke$arity$1 ? last_first_66152.cljs$core$IFn$_invoke$arity$1(G__65226) : last_first_66152.call(null,G__65226));
})();
var G__65225 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_66151.cljs$core$IFn$_invoke$arity$2 ? f_66151.cljs$core$IFn$_invoke$arity$2(G__65224,G__65225) : f_66151.call(null,G__65224,G__65225));
})();
if(cljs.core.truth_(element_66153)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_66153);

frontend.state.drop_last_selection_block_BANG_();
} else {
}
} else {
}
}
}
}

frontend.handler.editor.show_action_bar_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delay","delay",-574225219),(500)], null)], 0));

return null;
});
frontend.handler.editor.on_select_block = (function frontend$handler$editor$on_select_block(direction){
return (function (_event){
return frontend.handler.editor.select_block_up_down(direction);
});
});
frontend.handler.editor.save_block_aux_BANG_ = (function frontend$handler$editor$save_block_aux_BANG_(block,value,opts){
var entity = (function (){var G__65227 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65227) : frontend.db.entity.call(null,G__65227));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.built_in_QMARK_.call(null,entity)));
} else {
return and__5000__auto__;
}
})())){
var value__$1 = clojure.string.trim(value);
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3(block,value__$1,opts);
} else {
return null;
}
});
frontend.handler.editor.save_block_BANG_ = (function frontend$handler$editor$save_block_BANG_(var_args){
var G__65229 = arguments.length;
switch (G__65229) {
case 3:
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 2:
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo,block_or_uuid,content){
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(repo,block_or_uuid,content,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (repo,block_or_uuid,content,p__65230){
var map__65231 = p__65230;
var map__65231__$1 = cljs.core.__destructure_map(map__65231);
var opts = map__65231__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65231__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var block = ((((cljs.core.uuid_QMARK_(block_or_uuid)) || (typeof block_or_uuid === 'string')))?frontend.db.model.query_block_by_uuid(block_or_uuid):block_or_uuid);
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"opts","opts",155075701),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"properties","properties",685819552))], null),((cljs.core.seq(properties))?frontend.handler.property.file.insert_properties_when_file_based(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content,properties):content));
}));

(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (p__65232,value){
var map__65233 = p__65232;
var map__65233__$1 = cljs.core.__destructure_map(map__65233);
var _state = map__65233__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65233__$1,new cljs.core.Keyword(null,"block","block",664686210));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65233__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65233__$1,new cljs.core.Keyword(null,"opts","opts",155075701));
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
if(cljs.core.truth_((function (){var G__65234 = repo__$1;
var G__65235 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__65234,G__65235) : frontend.db.entity.call(null,G__65234,G__65235));
})())){
return frontend.handler.editor.save_block_aux_BANG_(block,value,opts);
} else {
return null;
}
}));

(frontend.handler.editor.save_block_BANG_.cljs$lang$maxFixedArity = 4);

frontend.handler.editor.save_blocks_BANG_ = (function frontend$handler$editor$save_blocks_BANG_(blocks){
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__65236 = cljs.core.seq(blocks);
var chunk__65237 = null;
var count__65238 = (0);
var i__65239 = (0);
while(true){
if((i__65239 < count__65238)){
var vec__65246 = chunk__65237.cljs$core$IIndexed$_nth$arity$2(null,i__65239);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65246,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65246,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,value);


var G__66155 = seq__65236;
var G__66156 = chunk__65237;
var G__66157 = count__65238;
var G__66158 = (i__65239 + (1));
seq__65236 = G__66155;
chunk__65237 = G__66156;
count__65238 = G__66157;
i__65239 = G__66158;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__65236);
if(temp__5804__auto__){
var seq__65236__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__65236__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__65236__$1);
var G__66159 = cljs.core.chunk_rest(seq__65236__$1);
var G__66160 = c__5525__auto__;
var G__66161 = cljs.core.count(c__5525__auto__);
var G__66162 = (0);
seq__65236 = G__66159;
chunk__65237 = G__66160;
count__65238 = G__66161;
i__65239 = G__66162;
continue;
} else {
var vec__65249 = cljs.core.first(seq__65236__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65249,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65249,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,value);


var G__66163 = cljs.core.next(seq__65236__$1);
var G__66164 = null;
var G__66165 = (0);
var G__66166 = (0);
seq__65236 = G__66163;
chunk__65237 = G__66164;
count__65238 = G__66165;
i__65239 = G__66166;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__65252 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65253 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65253);

try{var seq__65254_66167 = cljs.core.seq(blocks);
var chunk__65255_66168 = null;
var count__65256_66169 = (0);
var i__65257_66170 = (0);
while(true){
if((i__65257_66170 < count__65256_66169)){
var vec__65264_66171 = chunk__65255_66168.cljs$core$IIndexed$_nth$arity$2(null,i__65257_66170);
var block_66172 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65264_66171,(0),null);
var value_66173 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65264_66171,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block_66172,value_66173);


var G__66174 = seq__65254_66167;
var G__66175 = chunk__65255_66168;
var G__66176 = count__65256_66169;
var G__66177 = (i__65257_66170 + (1));
seq__65254_66167 = G__66174;
chunk__65255_66168 = G__66175;
count__65256_66169 = G__66176;
i__65257_66170 = G__66177;
continue;
} else {
var temp__5804__auto___66178 = cljs.core.seq(seq__65254_66167);
if(temp__5804__auto___66178){
var seq__65254_66179__$1 = temp__5804__auto___66178;
if(cljs.core.chunked_seq_QMARK_(seq__65254_66179__$1)){
var c__5525__auto___66180 = cljs.core.chunk_first(seq__65254_66179__$1);
var G__66181 = cljs.core.chunk_rest(seq__65254_66179__$1);
var G__66182 = c__5525__auto___66180;
var G__66183 = cljs.core.count(c__5525__auto___66180);
var G__66184 = (0);
seq__65254_66167 = G__66181;
chunk__65255_66168 = G__66182;
count__65256_66169 = G__66183;
i__65257_66170 = G__66184;
continue;
} else {
var vec__65267_66185 = cljs.core.first(seq__65254_66179__$1);
var block_66186 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65267_66185,(0),null);
var value_66187 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65267_66185,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block_66186,value_66187);


var G__66188 = cljs.core.next(seq__65254_66179__$1);
var G__66189 = null;
var G__66190 = (0);
var G__66191 = (0);
seq__65254_66167 = G__66188;
chunk__65255_66168 = G__66189;
count__65256_66169 = G__66190;
i__65257_66170 = G__66191;
continue;
}
} else {
}
}
break;
}

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65252);
}}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.editor !== 'undefined') && (typeof frontend.handler.editor._STAR_auto_save_timeout !== 'undefined')){
} else {
frontend.handler.editor._STAR_auto_save_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.handler.editor.clear_block_auto_save_timeout_BANG_ = (function frontend$handler$editor$clear_block_auto_save_timeout_BANG_(){
if(cljs.core.truth_(cljs.core.deref(frontend.handler.editor._STAR_auto_save_timeout))){
return clearTimeout(cljs.core.deref(frontend.handler.editor._STAR_auto_save_timeout));
} else {
return null;
}
});
/**
 * skip-properties? if set true, when editing block is likely be properties, skip saving
 */
frontend.handler.editor.save_current_block_BANG_ = (function frontend$handler$editor$save_current_block_BANG_(var_args){
var G__65271 = arguments.length;
switch (G__65271) {
case 0:
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (p__65272){
var map__65273 = p__65272;
var map__65273__$1 = cljs.core.__destructure_map(map__65273);
var opts = map__65273__$1;
var force_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65273__$1,new cljs.core.Keyword(null,"force?","force?",1839038675));
var skip_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65273__$1,new cljs.core.Keyword(null,"skip-properties?","skip-properties?",329398686));
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65273__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
frontend.handler.editor.clear_block_auto_save_timeout_BANG_();

if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.state.editor_in_composition_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_editor_action();
}
})())){
return null;
} else {
if(cljs.core.truth_(frontend.state.get_current_repo())){
try{var input_id = frontend.state.get_edit_input_id();
var block = frontend.state.get_edit_block();
var db_block = (function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
var G__65275 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65275) : frontend.db.entity.call(null,G__65275));
} else {
return null;
}
})();
var elem = (function (){var and__5000__auto__ = input_id;
if(cljs.core.truth_(and__5000__auto__)){
return goog.dom.getElement(input_id);
} else {
return and__5000__auto__;
}
})();
var db_content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(db_block);
var db_content_without_heading = (function (){var and__5000__auto__ = db_content;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(db_content,new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(db_block));
} else {
return and__5000__auto__;
}
})();
var value = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(current_block):(function (){var and__5000__auto__ = elem;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.editor.goog$module$goog$object.get(elem,"value");
} else {
return and__5000__auto__;
}
})());
if(cljs.core.truth_(value)){
if(cljs.core.truth_(force_QMARK_)){
return frontend.handler.editor.save_block_aux_BANG_(db_block,value,opts);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = skip_properties_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.db.model.top_block_QMARK_(block);
if(and__5000__auto____$1){
if(cljs.core.truth_(elem)){
return frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([elem], 0));
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = value;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = db_content_without_heading;
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(db_content_without_heading),clojure.string.trim(value));
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
return frontend.handler.editor.save_block_aux_BANG_(db_block,value,opts);
} else {
return null;
}
}
}
} else {
return null;
}
}catch (e65274){var error = e65274;
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.editor",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"save-block-failed","save-block-failed",610684026),error,new cljs.core.Keyword(null,"line","line",212345235),1394], null)),null);
}} else {
return null;
}
}
}));

(frontend.handler.editor.save_current_block_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.editor.clean_content_BANG_ = (function frontend$handler$editor$clean_content_BANG_(repo,format,content){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
var G__65276 = logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3(content,format,frontend.config.get_block_pattern(format));
var G__65276__$1 = (((G__65276 == null))?null:frontend.util.file_based.drawer.remove_logbook(G__65276));
var G__65276__$2 = (((G__65276__$1 == null))?null:frontend.handler.property.file.remove_properties_when_file_based(repo,format,G__65276__$1));
if((G__65276__$2 == null)){
return null;
} else {
return clojure.string.trim(G__65276__$2);
}
}
});
frontend.handler.editor.delete_asset_of_block_BANG_ = (function frontend$handler$editor$delete_asset_of_block_BANG_(p__65277){
var map__65278 = p__65277;
var map__65278__$1 = cljs.core.__destructure_map(map__65278);
var _opts = map__65278__$1;
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var asset_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"asset-block","asset-block",1420117445));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"full-text","full-text",1432444182));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var local_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"local?","local?",-1422786101));
var delete_local_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65278__$1,new cljs.core.Keyword(null,"delete-local?","delete-local?",1716577572));
var block = frontend.db.model.query_block_by_uuid(block_id);
var _ = (function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)," not exists"].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null));
}
})();
var text = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var content = (cljs.core.truth_(asset_block)?clojure.string.replace(text,(function (){var G__65279 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_block);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__65279) : frontend.util.ref.__GT_page_ref.call(null,G__65279));
})(),""):clojure.string.replace(text,full_text,""));
frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,block,content);

if(cljs.core.truth_((function (){var and__5000__auto__ = local_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return delete_local_QMARK_;
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(asset_block)){
return frontend.handler.editor.delete_block_aux_BANG_(asset_block);
} else {
var temp__5804__auto__ = (cljs.core.truth_(frontend.util.electron_QMARK_())?href:cljs.core.second(cljs.core.re_find(/\((.+)\)$/,full_text)));
if(cljs.core.truth_(temp__5804__auto__)){
var href__$1 = temp__5804__auto__;
var block_file_rpath = frontend.db.file_based.model.get_block_file_path(block);
var asset_fpath = ((clojure.string.starts_with_QMARK_(href__$1,"assets://"))?logseq.common.path.url_to_path(href__$1):frontend.config.get_repo_fpath(repo,logseq.common.path.resolve_relative_path(block_file_rpath,href__$1)));
return frontend.fs.unlink_BANG_(repo,asset_fpath,null);
} else {
return null;
}
}
} else {
return null;
}
});
frontend.handler.editor.db_based_save_asset_BANG_ = (function frontend$handler$editor$db_based_save_asset_BANG_(repo,dir,file,file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),(function (buffer){
return promesa.protocols._promise((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["writeFile",repo,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0)),buffer], 0)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),(function (buffer__$1){
return promesa.protocols._mcat(promesa.protocols._promise((new Uint8Array(buffer__$1))),(function (content){
return promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,dir,file_rpath,content,null));
}));
}));
}))));
}));
}));
});
/**
 * Save incoming(pasted) assets to assets directory.
 * 
 * Returns: asset entity
 */
frontend.handler.editor.db_based_save_assets_BANG_ = (function frontend$handler$editor$db_based_save_assets_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66195 = arguments.length;
var i__5727__auto___66196 = (0);
while(true){
if((i__5727__auto___66196 < len__5726__auto___66195)){
args__5732__auto__.push((arguments[i__5727__auto___66196]));

var G__66197 = (i__5727__auto___66196 + (1));
i__5727__auto___66196 = G__66197;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.editor.db_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.editor.db_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,files,p__65283){
var map__65284 = p__65283;
var map__65284__$1 = cljs.core.__destructure_map(map__65284);
var pdf_area_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65284__$1,new cljs.core.Keyword(null,"pdf-area?","pdf-area?",770305490));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.ensure_assets_dir_BANG_(repo)),(function (p__65285){
var vec__65286 = p__65285;
var repo_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65286,(0),null);
var asset_dir_rpath = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65286,(1),null);
return promesa.protocols._promise(promesa.core.all((function (){var iter__5480__auto__ = (function frontend$handler$editor$iter__65289(s__65290){
return (new cljs.core.LazySeq(null,(function (){
var s__65290__$1 = s__65290;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__65290__$1);
if(temp__5804__auto__){
var s__65290__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__65290__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__65290__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__65292 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__65291 = (0);
while(true){
if((i__65291 < size__5479__auto__)){
var vec__65293 = cljs.core._nth(c__5478__auto__,i__65291);
var _index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65293,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65293,(1),null);
cljs.core.chunk_append(b__65292,promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65296 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__65296) : frontend.util.node_path.basename.call(null,G__65296));
})()),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.parse.call(null,file_name)).name),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (file_name_without_ext){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_file_checksum(file)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (checksum){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_asset_with_checksum(repo,checksum)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (existing_asset){
return promesa.protocols._promise((cljs.core.truth_(existing_asset)?existing_asset:promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (___40979__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.new_block_id()),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_name)?clojure.string.lower_case((frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.extname.call(null,file_name)).substr((1))):null)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (ext){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.blank_QMARK_(ext))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("File doesn't have a valid ext.",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file-name","file-name",-1654217259),file_name], null))})():null)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (_){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join('')),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (file_path){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_dir_rpath),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_path)].join('')),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(repo_dir),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (dir){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)))),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (asset){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),ext,new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219),file.size,new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),checksum,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(asset)], null)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),block_id,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (insert_opts){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.db_based_save_asset_BANG_(repo,dir,file,file_rpath)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (edit_block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block);
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.blank_QMARK_(frontend.state.get_edit_content())) && (cljs.core.not(pdf_area_QMARK_)));
} else {
return and__5000__auto__;
}
})()),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (insert_to_current_block_page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(insert_opts,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(insert_opts,new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset)))),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (insert_opts_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(file_name_without_ext,insert_opts_SINGLEQUOTE_)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65297 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65297) : frontend.db.entity.call(null,G__65297));
})()),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (new_entity){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?frontend.state.clear_edit_BANG_():null)),((function (i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (___40947__auto__){
return promesa.protocols._promise((function (){var or__5002__auto__ = new_entity;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't save asset",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"files","files",-472457450),files], null));
}
})());
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
)));
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
);
});})(i__65291,vec__65293,_index,file,c__5478__auto__,size__5479__auto__,b__65292,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
));

var G__66198 = (i__65291 + (1));
i__65291 = G__66198;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__65292),frontend$handler$editor$iter__65289(cljs.core.chunk_rest(s__65290__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__65292),null);
}
} else {
var vec__65298 = cljs.core.first(s__65290__$2);
var _index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65298,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65298,(1),null);
return cljs.core.cons(promesa.protocols._mcat(promesa.protocols._promise(null),((function (vec__65298,_index,file,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_){
return (function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65301 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__65301) : frontend.util.node_path.basename.call(null,G__65301));
})()),(function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.parse.call(null,file_name)).name),(function (file_name_without_ext){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_file_checksum(file)),(function (checksum){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_asset_with_checksum(repo,checksum)),(function (existing_asset){
return promesa.protocols._promise((cljs.core.truth_(existing_asset)?existing_asset:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.new_block_id()),(function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_name)?clojure.string.lower_case((frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.extname.call(null,file_name)).substr((1))):null)),(function (ext){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.blank_QMARK_(ext))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("File doesn't have a valid ext.",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file-name","file-name",-1654217259),file_name], null))})():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join('')),(function (file_path){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_dir_rpath),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_path)].join('')),(function (file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(repo_dir),(function (dir){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)))),(function (asset){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),ext,new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219),file.size,new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),checksum,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(asset)], null)),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),block_id,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null)),(function (insert_opts){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.db_based_save_asset_BANG_(repo,dir,file,file_rpath)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),(function (edit_block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block);
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.blank_QMARK_(frontend.state.get_edit_content())) && (cljs.core.not(pdf_area_QMARK_)));
} else {
return and__5000__auto__;
}
})()),(function (insert_to_current_block_page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(insert_opts,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(insert_opts,new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset)))),(function (insert_opts_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(file_name_without_ext,insert_opts_SINGLEQUOTE_)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65302 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65302) : frontend.db.entity.call(null,G__65302));
})()),(function (new_entity){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?frontend.state.clear_edit_BANG_():null)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var or__5002__auto__ = new_entity;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't save asset",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"files","files",-472457450),files], null));
}
})());
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}))));
}));
}));
}));
}));
});})(vec__65298,_index,file,s__65290__$2,temp__5804__auto__,vec__65286,repo_dir,asset_dir_rpath,map__65284,map__65284__$1,pdf_area_QMARK_))
),frontend$handler$editor$iter__65289(cljs.core.rest(s__65290__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,files));
})()));
}));
}));
}));

(frontend.handler.editor.db_based_save_assets_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.editor.db_based_save_assets_BANG_.cljs$lang$applyTo = (function (seq65280){
var G__65281 = cljs.core.first(seq65280);
var seq65280__$1 = cljs.core.next(seq65280);
var G__65282 = cljs.core.first(seq65280__$1);
var seq65280__$2 = cljs.core.next(seq65280__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65281,G__65282,seq65280__$2);
}));

frontend.handler.editor.insert_command_BANG_ = frontend.handler.common.editor.insert_command_BANG_;
/**
 * Paste asset for db graph and insert link to current editing block
 */
frontend.handler.editor.db_upload_assets_BANG_ = (function frontend$handler$editor$db_upload_assets_BANG_(repo,id,files,format,uploading_QMARK_,drop_or_paste_QMARK_){
if(((frontend.config.local_file_based_graph_QMARK_(repo)) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)))){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.db_based_save_assets_BANG_(repo,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(files)),(function (entities){
var entity = cljs.core.first(entities);
var G__65303_66199 = id;
var G__65304_66200 = (function (){var G__65307 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__65307) : frontend.util.ref.__GT_page_ref.call(null,G__65307));
})();
var G__65305_66201 = format;
var G__65306_66202 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),(cljs.core.truth_(drop_or_paste_QMARK_)?"":frontend.commands.command_trigger),new cljs.core.Keyword(null,"restore?","restore?",1172240305),true,new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"insert-asset","insert-asset",1232083817)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__65303_66199,G__65304_66200,G__65305_66201,G__65306_66202) : frontend.handler.editor.insert_command_BANG_.call(null,G__65303_66199,G__65304_66200,G__65305_66201,G__65306_66202));

return entities;
})),(function (e){
return console.error(e);
})),(function (){
cljs.core.reset_BANG_(uploading_QMARK_,false);

cljs.core.reset_BANG_(frontend.handler.editor._STAR_asset_uploading_QMARK_,false);

return cljs.core.reset_BANG_(frontend.handler.editor._STAR_asset_uploading_process,(0));
}));
} else {
return null;
}
});
/**
 * Paste asset and insert link to current editing block
 */
frontend.handler.editor.upload_asset_BANG_ = (function frontend$handler$editor$upload_asset_BANG_(id,files,format,uploading_QMARK_,drop_or_paste_QMARK_){
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.editor.db_upload_assets_BANG_(repo,id,files,format,uploading_QMARK_,drop_or_paste_QMARK_);
} else {
return frontend.handler.file_based.editor.file_upload_assets_BANG_(repo,id,files,format,uploading_QMARK_,frontend.handler.editor._STAR_asset_uploading_QMARK_,frontend.handler.editor._STAR_asset_uploading_process,drop_or_paste_QMARK_);
}
});
frontend.handler.editor.autopair_map = cljs.core.PersistentHashMap.fromArrays(["=","`","*","~","/","(","_","{","[","^","+"],["=","`","*","~","/",")","_","}","]","^","+"]);
frontend.handler.editor.reversed_autopair_map = cljs.core.zipmap(cljs.core.vals(frontend.handler.editor.autopair_map),cljs.core.keys(frontend.handler.editor.autopair_map));
frontend.handler.editor.autopair_when_selected = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, ["=",null,"*",null,"/",null,"_",null,"^",null,"+",null], null), null);
frontend.handler.editor.delete_map = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.editor.autopair_map,"$","$",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([":",":"], 0));
frontend.handler.editor.autopair = (function frontend$handler$editor$autopair(input_id,prefix,_format,_option){
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.autopair_map,prefix);
var selected = frontend.util.get_selected_text();
var postfix = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(selected),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('');
var value__$1 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),postfix].join('');
var input = goog.dom.getElement(input_id);
if(cljs.core.truth_(value__$1)){
var vec__65313 = frontend.commands.simple_replace_BANG_(input_id,value__$1,selected,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),((postfix).length),new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015),(function (new_value,prefix_pos){
if((prefix_pos >= (0))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(new_value,prefix_pos,(prefix_pos + (2))),(prefix_pos + (2))], null);
} else {
return null;
}
})], null));
var prefix__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65313,(0),null);
var _pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65313,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prefix__$1,logseq.common.util.page_ref.left_brackets)){
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input),new cljs.core.Keyword(null,"selected","selected",574897764),selected], null));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prefix__$1,logseq.common.util.block_ref.left_parens)) && (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("To reference a node, please use `[[]]`.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prefix__$1,logseq.common.util.block_ref.left_parens)){
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),new cljs.core.Keyword(null,"reference","reference",-1711695023)], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input),new cljs.core.Keyword(null,"selected","selected",574897764),selected], null));
} else {
return null;
}
}
}
} else {
return null;
}
});
frontend.handler.editor.surround_by_QMARK_ = (function frontend$handler$editor$surround_by_QMARK_(input,before,end){
if(cljs.core.truth_(input)){
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var pos = frontend.util.cursor.pos(input);
return frontend.util.text.surround_by_QMARK_(value,pos,before,end);
} else {
return null;
}
});
frontend.handler.editor.autopair_left_paren_QMARK_ = (function frontend$handler$editor$autopair_left_paren_QMARK_(input,key){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"(");
if(and__5000__auto__){
var or__5002__auto__ = frontend.handler.editor.surround_by_QMARK_(input,new cljs.core.Keyword(null,"start","start",-355208981),"");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.handler.editor.surround_by_QMARK_(input,"\n","");
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.handler.editor.surround_by_QMARK_(input," ","");
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = frontend.handler.editor.surround_by_QMARK_(input,"]","");
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return frontend.handler.editor.surround_by_QMARK_(input,"(","");
}
}
}
}
} else {
return and__5000__auto__;
}
});
frontend.handler.editor.wrapped_by_QMARK_ = (function frontend$handler$editor$wrapped_by_QMARK_(input,before,end){
if(cljs.core.truth_(input)){
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var pos = frontend.util.cursor.pos(input);
if((pos >= (0))){
return frontend.util.text.wrapped_by_QMARK_(value,pos,before,end);
} else {
return null;
}
} else {
return null;
}
});
/**
 * Return matched classes except the root tag
 */
frontend.handler.editor.get_matched_classes = (function frontend$handler$editor$get_matched_classes(q){
var classes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684)], null));
}),logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (class$){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(class$),class$);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true], null)], 0))], 0))));
var G__65321 = classes;
var G__65322 = q;
var G__65323 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__65321,G__65322,G__65323) : frontend.search.fuzzy_search.call(null,G__65321,G__65322,G__65323));
});
/**
 * Return matched blocks that are not built-in
 */
frontend.handler.editor._LT_get_matched_blocks = (function frontend$handler$editor$_LT_get_matched_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66203 = arguments.length;
var i__5727__auto___66204 = (0);
while(true){
if((i__5727__auto___66204 < len__5726__auto___66203)){
args__5732__auto__.push((arguments[i__5727__auto___66204]));

var G__66205 = (i__5727__auto___66204 + (1));
i__5727__auto___66204 = G__66205;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor._LT_get_matched_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor._LT_get_matched_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (q,p__65328){
var vec__65329 = p__65328;
var map__65332 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65329,(0),null);
var map__65332__$1 = cljs.core.__destructure_map(map__65332);
var nlp_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65332__$1,new cljs.core.Keyword(null,"nlp-pages?","nlp-pages?",-1155813873));
var page_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65332__$1,new cljs.core.Keyword(null,"page-only?","page-only?",654695800));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(frontend.state.get_current_repo(),q,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),false,new cljs.core.Keyword(null,"enable-snippet?","enable-snippet?",-692858749),false,new cljs.core.Keyword(null,"page-only?","page-only?",654695800),page_only_QMARK_], null))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
}),result)),(function (matched){
return promesa.protocols._promise((function (){var G__65333 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(matched,(cljs.core.truth_(nlp_pages_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (title){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),title,new cljs.core.Keyword(null,"nlp-date?","nlp-date?",1961584384),true], null);
}),frontend.date.nlp_pages):null));
var G__65334 = q;
var G__65335 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"limit","limit",-1355822363),(50)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__65333,G__65334,G__65335) : frontend.search.fuzzy_search.call(null,G__65333,G__65334,G__65335));
})());
}));
}));
}));
}));
}));

(frontend.handler.editor._LT_get_matched_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor._LT_get_matched_blocks.cljs$lang$applyTo = (function (seq65324){
var G__65325 = cljs.core.first(seq65324);
var seq65324__$1 = cljs.core.next(seq65324);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65325,seq65324__$1);
}));

frontend.handler.editor._LT_get_matched_templates = (function frontend$handler$editor$_LT_get_matched_templates(q){
return frontend.search.template_search.cljs$core$IFn$_invoke$arity$1(q);
});
frontend.handler.editor._LT_get_matched_properties = (function frontend$handler$editor$_LT_get_matched_properties(q){
return frontend.search.property_search.cljs$core$IFn$_invoke$arity$1(q);
});
frontend.handler.editor.get_matched_property_values = (function frontend$handler$editor$get_matched_property_values(property,q){
return frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$2(property,q);
});
frontend.handler.editor.get_last_command = (function frontend$handler$editor$get_last_command(input){
try{var edit_content = (function (){var or__5002__auto__ = frontend.handler.editor.goog$module$goog$object.get(input,"value");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var pos = frontend.util.cursor.pos(input);
var last_slash_caret_pos = new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data()));
var last_command = (function (){var and__5000__auto__ = last_slash_caret_pos;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,last_slash_caret_pos,pos);
} else {
return and__5000__auto__;
}
})();
if((pos > (0))){
return last_command;
} else {
return null;
}
}catch (e65336){var e = e65336;
console.error(e);

return null;
}});
frontend.handler.editor.get_matched_commands = (function frontend$handler$editor$get_matched_commands(command){
var pred__65337 = cljs.core._EQ_;
var expr__65338 = command;
if(cljs.core.truth_((pred__65337.cljs$core$IFn$_invoke$arity$2 ? pred__65337.cljs$core$IFn$_invoke$arity$2(null,expr__65338) : pred__65337.call(null,null,expr__65338)))){
return null;
} else {
if(cljs.core.truth_((pred__65337.cljs$core$IFn$_invoke$arity$2 ? pred__65337.cljs$core$IFn$_invoke$arity$2("",expr__65338) : pred__65337.call(null,"",expr__65338)))){
return cljs.core.deref(frontend.commands._STAR_initial_commands);
} else {
return frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$1(command);
}
}
});
frontend.handler.editor.auto_complete_QMARK_ = (function frontend$handler$editor$auto_complete_QMARK_(){
var or__5002__auto__ = cljs.core.deref(frontend.handler.editor._STAR_asset_uploading_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_editor_action();
}
});
frontend.handler.editor.in_shui_popup_QMARK_ = (function frontend$handler$editor$in_shui_popup_QMARK_(){
var or__5002__auto__ = (function (){var G__65340 = document.activeElement;
var G__65340__$1 = (((G__65340 == null))?null:G__65340.closest("[data-radix-menu-content]"));
var G__65340__$2 = (((G__65340__$1 == null))?null:(G__65340__$1 == null));
if((G__65340__$2 == null)){
return null;
} else {
return cljs.core.not(G__65340__$2);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return document.body.querySelector("div[data-radix-popper-content-wrapper]");
}
});
frontend.handler.editor.get_current_input_char = (function frontend$handler$editor$get_current_input_char(input){
var temp__5804__auto__ = frontend.util.cursor.pos(input);
if(cljs.core.truth_(temp__5804__auto__)){
var pos = temp__5804__auto__;
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
if((((cljs.core.count(value) >= (pos + (1)))) && ((pos >= (1))))){
return frontend.util.nth_safe(value,pos);
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.move_up_down = (function frontend$handler$editor$move_up_down(up_QMARK_){
return (function (event){
frontend.util.stop(event);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));

var edit_block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
var move_nodes = (function (blocks){
var blocks_SINGLEQUOTE_ = frontend.handler.block.get_top_level_blocks(blocks);
var result = (function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.move_blocks_up_down_BANG_(blocks_SINGLEQUOTE_,up_QMARK_);
} else {
var _STAR_outliner_ops_STAR__orig_val__65341 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65342 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65342);

try{frontend.modules.outliner.op.move_blocks_up_down_BANG_(blocks_SINGLEQUOTE_,up_QMARK_);

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65341);
}}
})();
var temp__5804__auto___66209 = frontend.util.get_first_block_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)));
if(cljs.core.truth_(temp__5804__auto___66209)){
var block_node_66210 = temp__5804__auto___66209;
block_node_66210.scrollIntoView(({"behavior": "smooth", "block": "nearest"}));
} else {
}

return result;
});
if(cljs.core.truth_(edit_block_id)){
var temp__5804__auto__ = (function (){var G__65343 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),edit_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65343) : frontend.db.entity.call(null,G__65343));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var blocks = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),frontend.state.get_edit_content())], null);
var container_id = frontend.handler.editor.get_new_container_id((cljs.core.truth_(up_QMARK_)?new cljs.core.Keyword(null,"move-up","move-up",-1153137133):new cljs.core.Keyword(null,"move-down","move-down",-1149356017)),cljs.core.PersistentArrayMap.EMPTY);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(move_nodes(blocks)),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(container_id)?frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,edit_block_id], null)):(function (){var temp__5804__auto____$1 = (function (){var G__65344 = frontend.state.get_edit_input_id();
if((G__65344 == null)){
return null;
} else {
return goog.dom.getElement(G__65344);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
input.focus();

return frontend.util.scroll_editor_cursor(input);
} else {
return null;
}
})()));
}));
}));
}));
} else {
return null;
}
} else {
var ids = frontend.state.get_selection_block_ids();
if(cljs.core.seq(ids)){
var lookup_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),ids);
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,lookup_refs);
return move_nodes(blocks);
} else {
return null;
}
}
});
});
frontend.handler.editor.get_selected_ordered_blocks = (function frontend$handler$editor$get_selected_ordered_blocks(){
var repo = frontend.state.get_current_repo();
var ids = frontend.state.get_selection_block_ids();
var lookup_refs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),ids));
var G__65345 = repo;
var G__65346 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__65347 = lookup_refs;
return (frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3 ? frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3(G__65345,G__65346,G__65347) : frontend.db.pull_many.call(null,G__65345,G__65346,G__65347));
});
/**
 * `direction` = :left | :right.
 */
frontend.handler.editor.on_tab = (function frontend$handler$editor$on_tab(direction){
var blocks = frontend.handler.editor.get_selected_ordered_blocks();
return frontend.handler.block.indent_outdent_blocks_BANG_(blocks,cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"right","right",-452581833)),null);
});
frontend.handler.editor.get_link = (function frontend$handler$editor$get_link(format,link,label){
var link__$1 = (function (){var or__5002__auto__ = link;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var label__$1 = (function (){var or__5002__auto__ = label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var G__65349 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__65349__$1 = (((G__65349 instanceof cljs.core.Keyword))?G__65349.fqn:null);
switch (G__65349__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[%s](%s)",label__$1,link__$1) : frontend.util.format.call(null,"[%s](%s)",label__$1,link__$1));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[[%s][%s]]",link__$1,label__$1) : frontend.util.format.call(null,"[[%s][%s]]",link__$1,label__$1));

break;
default:
return null;

}
});
frontend.handler.editor.get_image_link = (function frontend$handler$editor$get_image_link(format,link,label){
var link__$1 = (function (){var or__5002__auto__ = link;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var label__$1 = (function (){var or__5002__auto__ = label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var G__65350 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__65350__$1 = (((G__65350 instanceof cljs.core.Keyword))?G__65350.fqn:null);
switch (G__65350__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("![%s](%s)",label__$1,link__$1) : frontend.util.format.call(null,"![%s](%s)",label__$1,link__$1));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$1 ? frontend.util.format.cljs$core$IFn$_invoke$arity$1("[[%s]]") : frontend.util.format.call(null,"[[%s]]"));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65350__$1)].join('')));

}
});
frontend.handler.editor.handle_command_input_close = (function frontend$handler$editor$handle_command_input_close(id){
frontend.state.set_editor_show_input_BANG_(null);

var temp__5804__auto__ = frontend.state.get_editor_last_pos();
if(cljs.core.truth_(temp__5804__auto__)){
var saved_cursor = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$3(input,saved_cursor,true);
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.handle_command_input = (function frontend$handler$editor$handle_command_input(command,id,format,m){
var G__65358_66215 = command;
var G__65358_66216__$1 = (((G__65358_66215 instanceof cljs.core.Keyword))?G__65358_66215.fqn:null);
switch (G__65358_66216__$1) {
case "link":
var map__65359_66218 = m;
var map__65359_66219__$1 = cljs.core.__destructure_map(map__65359_66218);
var link_66220 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65359_66219__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var label_66221 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65359_66219__$1,new cljs.core.Keyword(null,"label","label",1718410804));
if(((clojure.string.blank_QMARK_(link_66220)) || (clojure.string.blank_QMARK_(label_66221)))){
} else {
var G__65362_66222 = id;
var G__65363_66223 = frontend.handler.editor.get_link(format,link_66220,label_66221);
var G__65364_66224 = format;
var G__65365_66225 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[frontend.commands.command_trigger,"link"].join(''),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"link","link",-1769163468)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__65362_66222,G__65363_66223,G__65364_66224,G__65365_66225) : frontend.handler.editor.insert_command_BANG_.call(null,G__65362_66222,G__65363_66223,G__65364_66224,G__65365_66225));
}

break;
case "image-link":
var map__65366_66226 = m;
var map__65366_66227__$1 = cljs.core.__destructure_map(map__65366_66226);
var link_66228 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65366_66227__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var label_66229 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65366_66227__$1,new cljs.core.Keyword(null,"label","label",1718410804));
if((!(clojure.string.blank_QMARK_(link_66228)))){
var G__65367_66230 = id;
var G__65368_66231 = frontend.handler.editor.get_image_link(format,link_66228,label_66229);
var G__65369_66232 = format;
var G__65370_66233 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[frontend.commands.command_trigger,"link"].join(''),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"image-link","image-link",1877271958)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__65367_66230,G__65368_66231,G__65369_66232,G__65370_66233) : frontend.handler.editor.insert_command_BANG_.call(null,G__65367_66230,G__65368_66231,G__65369_66232,G__65370_66233));
} else {
}

break;
default:

}

return frontend.handler.editor.handle_command_input_close(id);
});
frontend.handler.editor.restore_last_saved_cursor_BANG_ = (function frontend$handler$editor$restore_last_saved_cursor_BANG_(var_args){
var G__65377 = arguments.length;
switch (G__65377) {
case 0:
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_input());
}));

(frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (input){
var temp__5804__auto__ = (function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_editor_last_pos();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var saved_cursor = temp__5804__auto__;
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$3(input,saved_cursor,true);
} else {
return null;
}
}));

(frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.editor.close_autocomplete_if_outside = (function frontend$handler$editor$close_autocomplete_if_outside(input){
if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-search","page-search",1842925280),null,new cljs.core.Keyword(null,"block-search","block-search",-897517253),null,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573),null], null), null),frontend.state.get_editor_action())) && (((cljs.core.not(frontend.handler.editor.wrapped_by_QMARK_(input,logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets))) && (((cljs.core.not(frontend.handler.editor.wrapped_by_QMARK_(input,logseq.common.util.block_ref.left_parens,logseq.common.util.block_ref.right_parens))) && ((((!(frontend.util.text.wrapped_by_QMARK_(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(input.value,(0),frontend.util.cursor.pos(input)),frontend.util.cursor.pos(input),frontend.commands.hashtag,"")))) && ((!(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-search","block-search",-897517253),frontend.state.get_editor_action())))))))))))));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.clear_editor_action_BANG_();
} else {
return null;
}
});
frontend.handler.editor.resize_image_BANG_ = (function frontend$handler$editor$resize_image_BANG_(config,block_id,metadata,full_text,size){
var asset = new cljs.core.Keyword(null,"asset-block","asset-block",1420117445).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),(cljs.core.truth_(asset)?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(asset):block_id),new cljs.core.Keyword("logseq.property.asset","resize-metadata","logseq.property.asset/resize-metadata",-1297523055),size);
} else {
var new_meta = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([metadata,size], 0));
var image_part = cljs.core.first(clojure.string.split.cljs$core$IFn$_invoke$arity$2(full_text,/\{/));
var md_link_QMARK_ = clojure.string.starts_with_QMARK_(image_part,"![");
var new_full_text = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((md_link_QMARK_)?image_part:["![image](",cljs.core.str.cljs$core$IFn$_invoke$arity$1(image_part),")"].join(''))),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_meta], 0))].join('');
var block = (function (){var G__65385 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65385) : frontend.db.entity.call(null,G__65385));
})();
var value = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var new_value = clojure.string.replace(value,full_text,new_full_text);
return frontend.handler.editor.save_block_aux_BANG_(block,new_value,cljs.core.PersistentArrayMap.EMPTY);
}
});
frontend.handler.editor.edit_box_on_change_BANG_ = (function frontend$handler$editor$edit_box_on_change_BANG_(e,block,id){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()))){
var value = frontend.util.evalue(e);
var repo = frontend.state.get_current_repo();
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$3(id,value,false);

frontend.handler.editor.clear_block_auto_save_timeout_BANG_();

frontend.handler.block.mark_last_input_time_BANG_(repo);

return cljs.core.reset_BANG_(frontend.handler.editor._STAR_auto_save_timeout,setTimeout((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.input_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"diff","diff",2135942783),(450)], 0));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(and__5000__auto____$1){
return cljs.core.re_find(/#\S+/,value);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-properties?","skip-properties?",329398686),true], null));
} else {
return null;
}
}),(450)));
} else {
return null;
}
});
frontend.handler.editor.start_of_new_word_QMARK_ = (function frontend$handler$editor$start_of_new_word_QMARK_(input,pos){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["\t",null," ",null], null), null),cljs.core.get.cljs$core$IFn$_invoke$arity$2(input.value,(pos - (2))));
});
frontend.handler.editor.handle_last_input = (function frontend$handler$editor$handle_last_input(){
var input = frontend.state.get_input();
var input_id = frontend.state.get_edit_input_id();
var edit_block = frontend.state.get_edit_block();
var pos = frontend.util.cursor.pos(input);
var content = input.value;
var last_input_char = frontend.util.nth_safe(content,(pos - (1)));
var last_prev_input_char = frontend.util.nth_safe(content,((pos - (1)) - (1)));
var prev_prev_input_char = frontend.util.nth_safe(content,(pos - (3)));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(content,"1. ");
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_input_char," ");
if(and__5000__auto____$1){
var and__5000__auto____$2 = input_id;
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = edit_block;
if(cljs.core.truth_(and__5000__auto____$3)){
return cljs.core.not(frontend.handler.editor.own_order_number_list_QMARK_(edit_block));
} else {
return and__5000__auto____$3;
}
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),edit_block], null))),(function (_){
return promesa.protocols._promise(frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,""));
}));
}));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_input_char,frontend.commands.command_trigger);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.re_find(/^\//m,cljs.core.str.cljs$core$IFn$_invoke$arity$1(input.value));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.editor.start_of_new_word_QMARK_(input,pos);
}
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));

frontend.commands.reinit_matched_commands_BANG_();

return frontend.state.set_editor_show_commands_BANG_();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(last_input_char,last_prev_input_char,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.commands.colon], 0))) && ((((((prev_prev_input_char == null)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prev_prev_input_char,"\n")))) && ((!(db_based_QMARK_))))))){
frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(input,(2));

frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-search","property-search",1730602043));
} else {
if((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"property-search","property-search",1730602043),frontend.state.get_editor_action());
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var map__65390 = frontend.util.text.get_current_line_by_pos(input.value,(pos - (1)));
var map__65390__$1 = cljs.core.__destructure_map(map__65390);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65390__$1,new cljs.core.Keyword(null,"line","line",212345235));
var start_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65390__$1,new cljs.core.Keyword(null,"start-pos","start-pos",668789086));
return frontend.util.text.wrapped_by_QMARK_(line,(pos - start_pos),"",logseq.graph_parser.property.colons);
})();
if(and__5000__auto____$1){
return (!(db_based_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})()){
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-search","property-search",1730602043));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_input_char,frontend.commands.colon)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"property-search","property-search",1730602043),frontend.state.get_editor_action())) && ((!(db_based_QMARK_))))))){
return frontend.state.clear_editor_action_BANG_();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(last_input_char,last_prev_input_char,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.commands.hashtag], 0))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_prev_input_char,frontend.commands.hashtag)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_input_char," ")))))){
return frontend.state.clear_editor_action_BANG_();
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_input_char,frontend.commands.hashtag);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.re_find(/^#/m,cljs.core.str.cljs$core$IFn$_invoke$arity$1(input.value));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((frontend.handler.editor.start_of_new_word_QMARK_(input,pos)) || (((db_based_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.right_brackets,logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(cljs.core.str.cljs$core$IFn$_invoke$arity$1(input.value),(pos - (3)),(pos - (1))))))));
}
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));

frontend.state.set_editor_last_pos_BANG_(pos);

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
} else {
return null;

}
}
}
}
}
}
}
});
frontend.handler.editor.get_selected_text = (function frontend$handler$editor$get_selected_text(){
var text = new cljs.core.Keyword(null,"selected","selected",574897764).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data());
if(clojure.string.blank_QMARK_(text)){
return null;
} else {
return text;
}
});
frontend.handler.editor.block_on_chosen_handler = (function frontend$handler$editor$block_on_chosen_handler(id,q,format,selected_text){
return (function (chosen,_click_QMARK_){
frontend.state.clear_editor_action_BANG_();

var uuid_string = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen));
var G__65391_66235 = id;
var G__65392_66236 = frontend.util.ref.__GT_block_ref(uuid_string);
var G__65393_66237 = format;
var G__65394_66238 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[logseq.common.util.block_ref.left_parens,cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(selected_text)?"":q))].join(''),new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),logseq.common.util.block_ref.right_parens,new cljs.core.Keyword(null,"postfix-fn","postfix-fn",-1393704144),(function (s){
return frontend.util.replace_first(logseq.common.util.block_ref.right_parens,s,"");
}),new cljs.core.Keyword(null,"forward-pos","forward-pos",-1445897715),(3),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"block-ref","block-ref",362929756)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__65391_66235,G__65392_66236,G__65393_66237,G__65394_66238) : frontend.handler.editor.insert_command_BANG_.call(null,G__65391_66235,G__65392_66236,G__65393_66237,G__65394_66238));

frontend.handler.property.file_persist_block_id_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen));

var temp__5804__auto__ = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return input.focus();
} else {
return null;
}
});
});
frontend.handler.editor.block_non_exist_handler = (function frontend$handler$editor$block_non_exist_handler(input){
return (function (){
frontend.state.clear_editor_action_BANG_();

return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2(input,(2));
});
});
frontend.handler.editor.paste_block_cleanup = (function frontend$handler$editor$paste_block_cleanup(repo,block,page,exclude_properties,format,content_update_fn,keep_uuid_QMARK_){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var new_content = (cljs.core.truth_(content_update_fn)?(function (){var G__65397 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
return (content_update_fn.cljs$core$IFn$_invoke$arity$1 ? content_update_fn.cljs$core$IFn$_invoke$arity$1(G__65397) : content_update_fn.call(null,G__65397));
})():new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
var new_content__$1 = (function (){var G__65398 = new_content;
var G__65398__$1 = ((cljs.core.not(keep_uuid_QMARK_))?frontend.handler.property.file.remove_property_when_file_based(repo,format,"id",G__65398):G__65398);
return frontend.handler.property.file.remove_property_when_file_based(repo,format,"custom_id",G__65398__$1);

})();
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,block,cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(((cljs.core.not(keep_uuid_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","_refs","block/_refs",830218531)], null):cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","meta","block/meta",1064819153)], 0))),(function (){var G__65399 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.Keyword("block","title","block/title",710445684),new_content__$1], null);
var G__65399__$1 = (((!(db_based_QMARK_)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__65399,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(keep_uuid_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"custom_id","custom_id",834948303),new cljs.core.Keyword(null,"custom-id","custom-id",-615733336)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([exclude_properties], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","format","block/format",-1212045901),format], 0)):G__65399);
if((!(db_based_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__65399__$1,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block),cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(keep_uuid_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092)], null)),exclude_properties)));
} else {
return G__65399__$1;
}
})()], 0));
});
frontend.handler.editor.edit_last_block_after_inserted_BANG_ = (function frontend$handler$editor$edit_last_block_after_inserted_BANG_(result){
var G__65400 = (function (){
var temp__5804__auto__ = cljs.core.last(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(result));
if(cljs.core.truth_(temp__5804__auto__)){
var last_block = temp__5804__auto__;
frontend.handler.editor.clear_when_saved_BANG_();

var last_block_SINGLEQUOTE_ = (function (){var G__65401 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(last_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65401) : frontend.db.entity.call(null,G__65401));
})();
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(last_block_SINGLEQUOTE_,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,last_block_SINGLEQUOTE_,new cljs.core.Keyword(null,"max","max",61366548)));
} else {
return null;
}
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__65400) : frontend.util.schedule.call(null,G__65400));
});
frontend.handler.editor.nested_blocks = (function frontend$handler$editor$nested_blocks(blocks){
var ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks));
return (!((cljs.core.some((function (p1__65403_SHARP_){
var G__65404 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(p1__65403_SHARP_));
return (ids.cljs$core$IFn$_invoke$arity$1 ? ids.cljs$core$IFn$_invoke$arity$1(G__65404) : ids.call(null,G__65404));
}),blocks) == null)));
});
/**
 * Given a vec of blocks, insert them into the target page.
 * keep-uuid?: if true, keep the uuid provided in the block structure.
 */
frontend.handler.editor.paste_blocks = (function frontend$handler$editor$paste_blocks(blocks,p__65405){
var map__65406 = p__65405;
var map__65406__$1 = cljs.core.__destructure_map(map__65406);
var content_update_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"content-update-fn","content-update-fn",132456615));
var exclude_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65406__$1,new cljs.core.Keyword(null,"exclude-properties","exclude-properties",1449787201),cljs.core.PersistentVector.EMPTY);
var target_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"target-block","target-block",348392017));
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var revert_cut_txs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"revert-cut-txs","revert-cut-txs",1919904845));
var skip_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"skip-empty-target?","skip-empty-target?",-1452855908));
var ops_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65406__$1,new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419));
var editing_block = (function (){var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var editing_block = temp__5804__auto__;
var G__65407 = (function (){var G__65408 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65408) : frontend.db.entity.call(null,G__65408));
})();
if((G__65407 == null)){
return null;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__65407,new cljs.core.Keyword("block","title","block/title",710445684),frontend.state.get_edit_content());
}
} else {
return null;
}
})();
var has_unsaved_edits = (function (){var and__5000__auto__ = editing_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__65409 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(editing_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65409) : frontend.db.entity.call(null,G__65409));
})()),frontend.state.get_edit_content());
} else {
return and__5000__auto__;
}
})();
var target_block__$1 = (function (){var or__5002__auto__ = target_block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return editing_block;
}
})();
var block = (function (){var G__65410 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65410) : frontend.db.entity.call(null,G__65410));
})();
var page = (cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block))?block:(cljs.core.truth_(target_block__$1)?new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__65411 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65411) : frontend.db.entity.call(null,G__65411));
})()):null));
var empty_target_QMARK_ = ((skip_empty_target_QMARK_ === true)?false:clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1)));
var paste_nested_blocks_QMARK_ = frontend.handler.editor.nested_blocks(blocks);
var target_block_has_children_QMARK_ = (function (){var G__65414 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__65414) : frontend.db.has_children_QMARK_.call(null,G__65414));
})();
var replace_empty_target_QMARK_ = (function (){var and__5000__auto__ = empty_target_QMARK_;
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not(target_block_has_children_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = target_block_has_children_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(blocks),(1));
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})();
var target_block_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = empty_target_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = target_block_has_children_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return paste_nested_blocks_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var or__5002__auto__ = logseq.db.get_left_sibling(target_block__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__65415 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65415) : frontend.db.entity.call(null,G__65415));
})());
}
})():target_block__$1);
var sibling_QMARK___$1 = ((((paste_nested_blocks_QMARK_) && (empty_target_QMARK_)))?cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block_SINGLEQUOTE_),new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$1)):(((!((sibling_QMARK_ == null))))?sibling_QMARK_:(cljs.core.truth_(target_block_has_children_QMARK_)?false:true
)));
var transact_blocks_BANG_ = (function (){
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(cljs.core.truth_(target_block_SINGLEQUOTE_)){
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(target_block_SINGLEQUOTE_,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var repo = frontend.state.get_current_repo();
var blocks_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
return frontend.handler.editor.paste_block_cleanup(repo,block__$1,page,exclude_properties,format,content_update_fn,keep_uuid_QMARK_);
}),blocks);
return frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE_,target_block_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste","paste",1975741548),new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_], null));
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__65419 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65420 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65420);

try{if(cljs.core.truth_(target_block_SINGLEQUOTE_)){
var format_66239 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(target_block_SINGLEQUOTE_,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var repo_66240 = frontend.state.get_current_repo();
var blocks_SINGLEQUOTE__66241 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
return frontend.handler.editor.paste_block_cleanup(repo_66240,block__$1,page,exclude_properties,format_66239,content_update_fn,keep_uuid_QMARK_);
}),blocks);
frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE__66241,target_block_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste","paste",1975741548),new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_], null));
} else {
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),revert_cut_txs], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),revert_cut_txs], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65419);
}}
});
if(cljs.core.truth_(ops_only_QMARK_)){
return transact_blocks_BANG_();
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(has_unsaved_edits)?(function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.handler.editor.outliner_save_block_BANG_(editing_block);
} else {
var _STAR_outliner_ops_STAR__orig_val__65431 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65432 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65432);

try{frontend.handler.editor.outliner_save_block_BANG_(editing_block);

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65431);
}}
})():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(transact_blocks_BANG_()),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_block_op_type_BANG_(null)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(result)?(function (){
frontend.handler.editor.edit_last_block_after_inserted_BANG_(result);

return result;
})()
:null));
}));
}));
}));
}));
}
});
/**
 * keep-uuid? - maintain the existing :uuid in tree vec
 */
frontend.handler.editor.block_tree__GT_blocks = (function frontend$handler$editor$block_tree__GT_blocks(repo,tree_vec,format,keep_uuid_QMARK_,page_name){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(block);
var props = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(block));
var content_STAR_ = [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),format))?"- ":"* "),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.property.file.insert_properties_when_file_based(repo,format,content,props))].join('');
var ast = frontend.format.mldoc.__GT_edn(content_STAR_,format);
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.wrap_parse_block,frontend.format.block.extract_blocks(ast,content_STAR_,format,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name], null)));
var fst_block = cljs.core.first(blocks);
var fst_block__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = keep_uuid_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.uuid_QMARK_(new cljs.core.Keyword(null,"uuid","uuid",-2145095719).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(fst_block,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719).cljs$core$IFn$_invoke$arity$1(block)):fst_block);
if(cljs.core.truth_(fst_block__$1)){
} else {
throw (new Error(["Assert failed: ","fst-block shouldn't be nil","\n","fst-block"].join('')));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(fst_block__$1,new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(block));
}),logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$1(tree_vec));
});
/**
 * `tree-vec`: a vector of blocks.
 * A block element: {:content :properties :children [block-1, block-2, ...]}
 */
frontend.handler.editor.insert_block_tree = (function frontend$handler$editor$insert_block_tree(tree_vec,format,p__65439){
var map__65440 = p__65439;
var map__65440__$1 = cljs.core.__destructure_map(map__65440);
var opts = map__65440__$1;
var target_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65440__$1,new cljs.core.Keyword(null,"target-block","target-block",348392017));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65440__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var repo = frontend.state.get_current_repo();
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(target_block));
var page_name = (function (){var G__65445 = page_id;
var G__65445__$1 = (((G__65445 == null))?null:(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65445) : frontend.db.entity.call(null,G__65445)));
if((G__65445__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(G__65445__$1);
}
})();
var blocks = frontend.handler.editor.block_tree__GT_blocks(repo,tree_vec,format,keep_uuid_QMARK_,page_name);
var blocks__$1 = logseq.graph_parser.block.with_parent_and_order(page_id,blocks);
var block_refs = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (ref){
return ((cljs.core.vector_QMARK_(ref)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))));
}),cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks__$1], 0))));
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(cljs.core.seq(block_refs)){
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__65449){
var vec__65450 = p__65449;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65450,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65450,(1),null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_refs));
} else {
}

return frontend.handler.editor.paste_blocks(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419),true], null)], 0)));
} else {
var _STAR_outliner_ops_STAR__orig_val__65453 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65454 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65454);

try{if(cljs.core.seq(block_refs)){
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__65455){
var vec__65456 = p__65455;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65456,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65456,(1),null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_refs));
} else {
}

frontend.handler.editor.paste_blocks(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419),true], null)], 0)));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste-blocks","paste-blocks",538514211)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste-blocks","paste-blocks",538514211)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65453);
}}
});
/**
 * `tree-vec`: a vector of blocks.
 * A block element: {:content :properties :children [block-1, block-2, ...]}
 */
frontend.handler.editor.insert_block_tree_after_target = (function frontend$handler$editor$insert_block_tree_after_target(target_block_id,sibling_QMARK_,tree_vec,format,keep_uuid_QMARK_){
return frontend.handler.editor.insert_block_tree(tree_vec,format,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"target-block","target-block",348392017),(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(target_block_id) : frontend.db.entity.call(null,target_block_id)),new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"skip-empty-target?","skip-empty-target?",-1452855908),true,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_], null));
});
frontend.handler.editor.insert_template_BANG_ = (function frontend$handler$editor$insert_template_BANG_(var_args){
var G__65478 = arguments.length;
switch (G__65478) {
case 2:
return frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (element_id,db_id){
return frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3(element_id,db_id,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (element_id,db_id,p__65486){
var map__65487 = p__65486;
var map__65487__$1 = cljs.core.__destructure_map(map__65487);
var opts = map__65487__$1;
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65487__$1,new cljs.core.Keyword(null,"target","target",253001721));
var repo = frontend.state.get_current_repo();
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.integer_QMARK_(db_id))?(frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2(repo,db_id) : frontend.db.async._LT_pull.call(null,repo,db_id)):frontend.db.async._LT_get_template_by_name(cljs.core.name(db_id)))),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),true,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711),true], null)], 0)):null)),(function (block__$1){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1))?(function (){var journal_QMARK_ = (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(target) : logseq.db.journal_QMARK_.call(null,target));
var target__$1 = (function (){var or__5002__auto__ = target;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_edit_block();
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1);
var template_including_parent_QMARK_ = (!(new cljs.core.Keyword(null,"template-including-parent","template-including-parent",1449989665).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$1)) === false));
var blocks = (function (){var G__65488 = repo;
var G__65489 = block_uuid;
var G__65490 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null);
return (frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$3 ? frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$3(G__65488,G__65489,G__65490) : frontend.db.get_block_and_children.call(null,G__65488,G__65489,G__65490));
})();
var sorted_blocks = ((db_QMARK_)?(function (){var blocks_SINGLEQUOTE_ = cljs.core.rest(blocks);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(blocks_SINGLEQUOTE_),new cljs.core.Keyword("logseq.property","used-template","logseq.property/used-template",-980369906),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)),cljs.core.rest(blocks_SINGLEQUOTE_));
})():cljs.core.cons(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.first(blocks),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),cljs.core.dissoc,new cljs.core.Keyword(null,"template","template",-702405684)),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),(function (keys){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"template","template",-702405684),null], null), null),keys));
})),cljs.core.rest(blocks)));
var blocks__$1 = ((db_QMARK_)?sorted_blocks:((template_including_parent_QMARK_)?sorted_blocks:cljs.core.drop.cljs$core$IFn$_invoke$arity$2((1),sorted_blocks)
));
if(cljs.core.truth_(element_id)){
var G__65491_66243 = element_id;
var G__65492_66244 = "";
var G__65493_66245 = format;
var G__65494_66246 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),frontend.commands.command_trigger], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__65491_66243,G__65492_66244,G__65493_66245,G__65494_66246) : frontend.handler.editor.insert_command_BANG_.call(null,G__65491_66243,G__65492_66244,G__65493_66245,G__65494_66246));
} else {
}

var exclude_properties = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"template","template",-702405684),new cljs.core.Keyword(null,"template-including-parent","template-including-parent",1449989665)], null);
var content_update_fn = (function (content){
return frontend.template.resolve_dynamic_template_BANG_(frontend.handler.property.file.remove_property_when_file_based(repo,format,"template-including-parent",frontend.handler.property.file.remove_property_when_file_based(repo,format,"template",content)));
});
var page = (cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block__$1))?block__$1:(cljs.core.truth_(target__$1)?new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__65495 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65495) : frontend.db.entity.call(null,G__65495));
})()):null));
var blocks_SINGLEQUOTE_ = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?blocks__$1:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$2){
return frontend.handler.editor.paste_block_cleanup(repo,block__$2,page,exclude_properties,format,content_update_fn,false);
}),blocks__$1));
var sibling_QMARK_ = new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060).cljs$core$IFn$_invoke$arity$1(opts);
var sibling_QMARK__SINGLEQUOTE_ = (((!((sibling_QMARK_ == null))))?sibling_QMARK_:(cljs.core.truth_((function (){var G__65496 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target__$1);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__65496) : frontend.db.has_children_QMARK_.call(null,G__65496));
})())?false:true
));
if(cljs.core.seq(blocks_SINGLEQUOTE_)){
try{return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(clojure.string.blank_QMARK_(frontend.state.get_edit_content())){
} else {
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}

return frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE_,target__$1,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597),true], 0)));
} else {
var _STAR_outliner_ops_STAR__orig_val__65500 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65501 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65501);

try{if(clojure.string.blank_QMARK_(frontend.state.get_edit_content())){
} else {
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}

frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE_,target__$1,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597),true], 0)));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"created-from-journal-template?","created-from-journal-template?",-2127356314),journal_QMARK_], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"created-from-journal-template?","created-from-journal-template?",-2127356314),journal_QMARK_], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65500);
}}
})()),(function (result){
return promesa.protocols._promise((cljs.core.truth_(result)?frontend.handler.editor.edit_last_block_after_inserted_BANG_(result):null));
}));
}));
}catch (e65497){var e = e65497;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.content","p.content",-1435376888),(function (){var G__65498 = "Template insert error: %s";
var G__65499 = e.message;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__65498,G__65499) : frontend.util.format.call(null,G__65498,G__65499));
})()], null),new cljs.core.Keyword(null,"error","error",-978969032));
}} else {
return null;
}
})():null));
}));
}));
}));
}));

(frontend.handler.editor.insert_template_BANG_.cljs$lang$maxFixedArity = 3);

frontend.handler.editor.template_on_chosen_handler = (function frontend$handler$editor$template_on_chosen_handler(element_id){
return (function (template_block){
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(template_block);
if(cljs.core.truth_(temp__5804__auto__)){
var db_id = temp__5804__auto__;
return frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3(element_id,db_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null));
} else {
return null;
}
});
});
frontend.handler.editor.get_searching_property = (function frontend$handler$editor$get_searching_property(input){
var value = input.value;
var pos = frontend.util.get_selection_start(input);
var postfix = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,pos);
var end_index = (function (){var temp__5804__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(postfix,logseq.graph_parser.property.colons);
if(cljs.core.truth_(temp__5804__auto__)){
var idx = temp__5804__auto__;
return ((function (){var x__5087__auto__ = (0);
var y__5088__auto__ = ((cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),pos)).length);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})() + idx);
} else {
return null;
}
})();
var start_index = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),pos),"\n");
if(cljs.core.truth_(temp__5804__auto__)){
var p = temp__5804__auto__;
return (p + (1));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"end-index","end-index",1056180246),end_index,new cljs.core.Keyword(null,"searching-property","searching-property",495243376),(cljs.core.truth_((function (){var and__5000__auto__ = start_index;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = end_index;
if(cljs.core.truth_(and__5000__auto____$1)){
return (end_index >= start_index);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,start_index,end_index):null)], null);
});
frontend.handler.editor.property_on_chosen_handler = (function frontend$handler$editor$property_on_chosen_handler(element_id,q){
return (function (property){
var temp__5804__auto__ = goog.dom.getElement(element_id);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
var map__65502 = frontend.handler.editor.get_searching_property(input);
var map__65502__$1 = cljs.core.__destructure_map(map__65502);
var end_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65502__$1,new cljs.core.Keyword(null,"end-index","end-index",1056180246));
var searching_property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65502__$1,new cljs.core.Keyword(null,"searching-property","searching-property",495243376));
frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(end_index + (2)));

frontend.commands.insert_BANG_(element_id,[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = property;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return q;
}
})()),logseq.graph_parser.property.colons," "].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(searching_property),logseq.graph_parser.property.colons].join('')], null));

frontend.state.clear_editor_action_BANG_();

return setTimeout((function (){
var pos = (function (){var input__$1 = goog.dom.getElement(element_id);
return frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input__$1);
})();
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),(function (){var or__5002__auto__ = property;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return q;
}
})(),new cljs.core.Keyword(null,"pos","pos",-864607220),pos], null));

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-value-search","property-value-search",1985137335));
}),(50));
} else {
return null;
}
});
});
frontend.handler.editor.property_value_on_chosen_handler = (function frontend$handler$editor$property_value_on_chosen_handler(element_id,q){
return (function (property_value){
frontend.commands.insert_BANG_(element_id,[logseq.graph_parser.property.colons," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = property_value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return q;
}
})())].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[logseq.graph_parser.property.colons," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q)].join('')], null));

return frontend.state.clear_editor_action_BANG_();
});
});
frontend.handler.editor.last_top_level_child_QMARK_ = (function frontend$handler$editor$last_top_level_child_QMARK_(p__65511,block){
var map__65512 = p__65511;
var map__65512__$1 = cljs.core.__destructure_map(map__65512);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65512__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_(id)){
var temp__5804__auto__ = (function (){var temp__5802__auto__ = cljs.core.parse_uuid(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
if(cljs.core.truth_(temp__5802__auto__)){
var id_SINGLEQUOTE_ = temp__5802__auto__;
var G__65513 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_SINGLEQUOTE_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65513) : frontend.db.entity.call(null,G__65513));
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.get_page.call(null,id));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.insert = (function frontend$handler$editor$insert(var_args){
var G__65515 = arguments.length;
switch (G__65515) {
case 1:
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1 = (function (insertion){
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$2(insertion,false);
}));

(frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$2 = (function (insertion,auto_complete_enabled_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = auto_complete_enabled_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(frontend.handler.editor.auto_complete_QMARK_());
}
})())){
var input = frontend.state.get_input();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
var value = input.value;
var s1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),selected_start);
var s2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,selected_end);
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),[s1,cljs.core.str.cljs$core$IFn$_invoke$arity$1(insertion)].join(''));

var scroll_container = frontend.util.nearest_scrollable_container(input);
var scroll_pos = scroll_container.scrollTop;
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),[s1,cljs.core.str.cljs$core$IFn$_invoke$arity$1(insertion),s2].join(''));

frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(selected_start + cljs.core.count(insertion)));

return (scroll_container.scrollTop = scroll_pos);
} else {
return null;
}
}));

(frontend.handler.editor.insert.cljs$lang$maxFixedArity = 2);

/**
 * Insert newline to current cursor position
 */
frontend.handler.editor.keydown_new_line = (function frontend$handler$editor$keydown_new_line(){
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1("\n");
});
frontend.handler.editor.dwim_in_properties = (function frontend$handler$editor$dwim_in_properties(state){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
var map__65516 = frontend.handler.editor.get_state();
var map__65516__$1 = cljs.core.__destructure_map(map__65516);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65516__$1,new cljs.core.Keyword(null,"block","block",664686210));
if(cljs.core.truth_(block)){
var input = frontend.state.get_input();
var content = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(frontend.handler.editor.get_state()),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var property_key = new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(frontend.util.thingatpt.property_key_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)));
var org_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
var move_to_pos = ((org_QMARK_)?(2):(3));
if(org_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = property_key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_key,"");
} else {
return and__5000__auto__;
}
})())){
var G__65517 = property_key;
switch (G__65517) {
case "PROPERTIES":
frontend.util.cursor.move_cursor_to_line_end(input);

frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1("\n:: ");

return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(input,move_to_pos);

break;
case "END":
frontend.util.cursor.move_cursor_to_end(input);

frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

return frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$1(state);

break;
default:
if(cljs.core.truth_((frontend.handler.property.file.property_key_exist_QMARK__when_file_based.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.property.file.property_key_exist_QMARK__when_file_based.cljs$core$IFn$_invoke$arity$3(format,content,property_key) : frontend.handler.property.file.property_key_exist_QMARK__when_file_based.call(null,format,content,property_key)))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.content","p.content",-1435376888),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Property key \"%s\" already exists!",property_key) : frontend.util.format.call(null,"Property key \"%s\" already exists!",property_key))], null),new cljs.core.Keyword(null,"error","error",-978969032));
} else {
return frontend.util.cursor.move_cursor_to_line_end(input);
}

}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = property_key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_key,"");
} else {
return and__5000__auto__;
}
})())){
var G__65518_66251 = input;
var G__65519_66252 = frontend.util.cursor.line_beginning_pos(input);
var G__65520_66253 = (frontend.util.cursor.line_end_pos(input) + (1));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(G__65518_66251,G__65519_66252,G__65520_66253) : frontend.handler.editor.delete_and_update.call(null,G__65518_66251,G__65519_66252,G__65520_66253));

(frontend.handler.property.file.goto_properties_end_when_file_based.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.property.file.goto_properties_end_when_file_based.cljs$core$IFn$_invoke$arity$2(format,input) : frontend.handler.property.file.goto_properties_end_when_file_based.call(null,format,input));

return frontend.util.cursor.move_cursor_to_line_end(input);
} else {
frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1("\n:: ");

return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(input,move_to_pos);

}
}
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1("\n");
}
} else {
return null;
}
}
});
frontend.handler.editor.toggle_list_checkbox = (function frontend$handler$editor$toggle_list_checkbox(p__65521,item_content){
var map__65522 = p__65521;
var map__65522__$1 = cljs.core.__destructure_map(map__65522);
var block = map__65522__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65522__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var toggle_fn = (function (m,x_mark){
var G__65527 = clojure.string.lower_case(x_mark);
switch (G__65527) {
case "[ ]":
return ["[x] ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(item_content)].join('');

break;
case "[x]":
return ["[ ] ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(item_content)].join('');

break;
default:
return m;

}
});
var pattern = cljs.core.re_pattern(["(\\[[xX ]\\])\\s+?",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.string.regExpEscape(item_content))].join(''));
var new_content = clojure.string.replace_first(title,pattern,toggle_fn);
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
});
frontend.handler.editor.dwim_in_list = (function frontend$handler$editor$dwim_in_list(){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
var map__65528 = frontend.handler.editor.get_state();
var map__65528__$1 = cljs.core.__destructure_map(map__65528);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65528__$1,new cljs.core.Keyword(null,"block","block",664686210));
if(cljs.core.truth_(block)){
var input = frontend.state.get_input();
var temp__5804__auto__ = frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var map__65529 = item;
var map__65529__$1 = cljs.core.__destructure_map(map__65529);
var full_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"full-content","full-content",-817477443));
var indent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"indent","indent",-148200125));
var bullet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"bullet","bullet",726988937));
var checkbox = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
var ordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"ordered","ordered",1187041426));
var _ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65529__$1,new cljs.core.Keyword(null,"_","_",1453416199));
var next_bullet = (cljs.core.truth_(ordered)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1((bullet + (1))),"."].join(''):bullet);
var checkbox__$1 = (cljs.core.truth_(checkbox)?"[ ] ":null);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(full_content),((cljs.core.truth_(ordered)?(((cljs.core.str.cljs$core$IFn$_invoke$arity$1(bullet)).length) + (2)):(2)) + (cljs.core.truth_(checkbox__$1)?((checkbox__$1).length):null)))) && (clojure.string.includes_QMARK_(input.value,"\n")))){
var G__65530 = input;
var G__65531 = frontend.util.cursor.line_beginning_pos(input);
var G__65532 = frontend.util.cursor.line_end_pos(input);
return (frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(G__65530,G__65531,G__65532) : frontend.handler.editor.delete_and_update.call(null,G__65530,G__65531,G__65532));
} else {
var start_pos = frontend.util.get_selection_start(input);
var value = input.value;
var before = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),start_pos);
var after = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,start_pos);
var cursor_in_item_content_QMARK_ = (function (){var and__5000__auto__ = cljs.core.re_find(/^(\d+){1}\./,cljs.core.last(clojure.string.split_lines(before)));
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(cljs.core.first(clojure.string.split_lines(after)))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(cursor_in_item_content_QMARK_)){
} else {
frontend.util.cursor.move_cursor_to_line_end(input);

frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(["\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(indent),cljs.core.str.cljs$core$IFn$_invoke$arity$1(next_bullet)," ",checkbox__$1].join(''));
}

if(cljs.core.truth_(ordered)){
var value__$1 = input.value;
var start_pos__$1 = frontend.util.get_selection_start(input);
var after_lists_str = clojure.string.trim(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value__$1,start_pos__$1));
var after_lists_str__$1 = (cljs.core.truth_(cursor_in_item_content_QMARK_)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(indent),cljs.core.str.cljs$core$IFn$_invoke$arity$1(next_bullet)," ",after_lists_str].join(''):after_lists_str);
var lines = clojure.string.split_lines(after_lists_str__$1);
var after_lists_str_SINGLEQUOTE_ = frontend.util.list.re_order_items(lines,(cljs.core.truth_(cursor_in_item_content_QMARK_)?bullet:(bullet + (1))));
var value_SINGLEQUOTE_ = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value__$1,(0),start_pos__$1),"\n",after_lists_str_SINGLEQUOTE_].join('');
var cursor_SINGLEQUOTE_ = (cljs.core.truth_(cursor_in_item_content_QMARK_)?((([cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value__$1,(0),start_pos__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(indent),cljs.core.str.cljs$core$IFn$_invoke$arity$1(next_bullet)," "].join('')).length) + (1)):((new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(item) + cljs.core.count(next_bullet)) + (2)));
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),value_SINGLEQUOTE_);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,cursor_SINGLEQUOTE_);
} else {
return null;
}
}
} else {
return null;
}
} else {
return null;
}
}
});
frontend.handler.editor.keydown_new_block = (function frontend$handler$editor$keydown_new_block(state){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
var map__65561 = frontend.handler.editor.get_state();
var map__65561__$1 = cljs.core.__destructure_map(map__65561);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65561__$1,new cljs.core.Keyword(null,"block","block",664686210));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65561__$1,new cljs.core.Keyword(null,"config","config",994861415));
if(cljs.core.truth_(block)){
var block__$1 = (function (){var G__65562 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65562) : frontend.db.entity.call(null,G__65562));
})();
var input = frontend.state.get_input();
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"keydown-new-block","keydown-new-block",-676183329),true);
var content = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var pos = frontend.util.cursor.pos(input);
var has_right_QMARK_ = logseq.db.get_right_sibling(block__$1);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var thing_at_point = (function (){var or__5002__auto__ = (cljs.core.truth_(frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"admonition&src?","admonition&src?",1506556328)))?frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (cljs.core.truth_(frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"markup?","markup?",-1222732996)))?frontend.util.thingatpt.markup_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (cljs.core.truth_(frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853)))?frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)):null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (cljs.core.truth_(frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"page-ref?","page-ref?",677685143)))?frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)):null);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (cljs.core.truth_((function (){var and__5000__auto__ = (!(db_based_QMARK_));
if(and__5000__auto__){
return frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"properties?","properties?",3428414));
} else {
return and__5000__auto__;
}
})())?frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)):null);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
if(cljs.core.truth_(frontend.util.thingatpt.get_setting(new cljs.core.Keyword(null,"list?","list?",-1642026156)))){
var and__5000__auto__ = cljs.core.not(frontend.util.cursor.beginning_of_line_QMARK_(input));
if(and__5000__auto__){
return frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
} else {
return and__5000__auto__;
}
} else {
return null;
}
}
}
}
}
}
})();
if(cljs.core.truth_(thing_at_point)){
var G__65563 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(thing_at_point);
switch (G__65563) {
case "markup":
var right_bound = new cljs.core.Keyword(null,"bounds","bounds",1691609455).cljs$core$IFn$_invoke$arity$1(thing_at_point);
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,right_bound,pos) + cljs.core.count(right_bound)));

break;
case "admonition-block":
return frontend.handler.editor.keydown_new_line();

break;
case "source-block":
frontend.handler.editor.keydown_new_line();

var G__65564 = new cljs.core.Keyword(null,"action","action",-811238024).cljs$core$IFn$_invoke$arity$1(thing_at_point);
var G__65564__$1 = (((G__65564 instanceof cljs.core.Keyword))?G__65564.fqn:null);
switch (G__65564__$1) {
case "into-code-editor":
return frontend.state.into_code_editor_mode_BANG_();

break;
default:
return null;

}

break;
case "block-ref":
return frontend.handler.editor.open_block_in_sidebar_BANG_(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(thing_at_point));

break;
case "page-ref":
if(clojure.string.blank_QMARK_(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(thing_at_point))){
return null;
} else {
var page = new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(thing_at_point);
var page_name = frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1(page);
return frontend.handler.editor.insert_first_page_block_if_not_exists_BANG_(page_name);
}

break;
case "list-item":
return frontend.handler.editor.dwim_in_list();

break;
case "properties-drawer":
return frontend.handler.editor.dwim_in_properties(state);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65563)].join('')));

}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = clojure.string.blank_QMARK_(content);
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.handler.editor.own_order_number_list_QMARK_(block__$1);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not((function (){var G__65565 = frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));
if((G__65565 == null)){
return null;
} else {
return frontend.handler.editor.own_order_number_list_QMARK_(G__65565);
}
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.remove_block_own_order_list_type_BANG_(block__$1);
} else {
if(((clojure.string.blank_QMARK_(content)) && (((cljs.core.not(has_right_QMARK_)) && (cljs.core.not(frontend.handler.editor.last_top_level_child_QMARK_(config__$1,block__$1))))))){
return (frontend.handler.editor.indent_outdent.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.indent_outdent.cljs$core$IFn$_invoke$arity$1(false) : frontend.handler.editor.indent_outdent.call(null,false));
} else {
return frontend.handler.editor.insert_new_block_BANG_.cljs$core$IFn$_invoke$arity$1(state);

}
}
}
} else {
return null;
}
}
});
/**
 * When we are in a single block wrapper, we should always insert a new line instead of new block
 */
frontend.handler.editor.inside_of_single_block = (function frontend$handler$editor$inside_of_single_block(el){
return (!((dommy.core.closest.cljs$core$IFn$_invoke$arity$2(el,".single-block") == null)));
});
frontend.handler.editor.inside_of_editor_block = (function frontend$handler$editor$inside_of_editor_block(el){
return (!((dommy.core.closest.cljs$core$IFn$_invoke$arity$2(el,".block-editor") == null)));
});
frontend.handler.editor.keydown_new_block_handler = (function frontend$handler$editor$keydown_new_block_handler(e){
var state = frontend.handler.editor.get_state();
if((((e.target == null)) || (frontend.handler.editor.inside_of_editor_block(e.target)))){
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.state.doc_mode_enter_for_new_line_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.editor.inside_of_single_block(rum.core.dom_node(state));
}
})())){
return frontend.handler.editor.keydown_new_line();
} else {
e.preventDefault();

return frontend.handler.editor.keydown_new_block(state);
}
} else {
return null;
}
});
frontend.handler.editor.keydown_new_line_handler = (function frontend$handler$editor$keydown_new_line_handler(e){
var state = frontend.handler.editor.get_state();
if((((e.target == null)) || (frontend.handler.editor.inside_of_editor_block(e.target)))){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.doc_mode_enter_for_new_line_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.handler.editor.inside_of_single_block(rum.core.dom_node(state))));
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.keydown_new_block(state);
} else {
e.preventDefault();

return frontend.handler.editor.keydown_new_line();
}
} else {
return null;
}
});
/**
 * Select first or last block in viewport
 */
frontend.handler.editor.select_first_last = (function frontend$handler$editor$select_first_last(direction){
var f = (function (){var G__65634 = direction;
var G__65634__$1 = (((G__65634 instanceof cljs.core.Keyword))?G__65634.fqn:null);
switch (G__65634__$1) {
case "up":
return cljs.core.last;

break;
case "down":
return cljs.core.first;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65634__$1)].join('')));

}
})();
var container = (cljs.core.truth_((function (){var G__65635 = document.activeElement;
if((G__65635 == null)){
return null;
} else {
return G__65635.querySelector(".blocks-container");
}
})())?document.activeElement:document.body);
var block = (function (){var G__65636 = frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$1(container);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__65636) : f.call(null,G__65636));
})();
if(cljs.core.truth_(block)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(block);

return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null));
} else {
return null;
}
});
frontend.handler.editor.select_up_down = (function frontend$handler$editor$select_up_down(direction){
var selected_blocks = frontend.state.get_selection_blocks();
var selected = (function (){var G__65637 = direction;
var G__65637__$1 = (((G__65637 instanceof cljs.core.Keyword))?G__65637.fqn:null);
switch (G__65637__$1) {
case "up":
return cljs.core.first(selected_blocks);

break;
case "down":
return cljs.core.last(selected_blocks);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65637__$1)].join('')));

}
})();
var f = (function (){var G__65638 = direction;
var G__65638__$1 = (((G__65638 instanceof cljs.core.Keyword))?G__65638.fqn:null);
switch (G__65638__$1) {
case "up":
return frontend.util.get_prev_block_non_collapsed;

break;
case "down":
return frontend.util.get_next_block_non_collapsed;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65638__$1)].join('')));

}
})();
var sibling_block = (function (){var G__65639 = selected;
var G__65640 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__65639,G__65640) : f.call(null,G__65639,G__65640));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = sibling_block;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.attr(sibling_block,"blockid");
} else {
return and__5000__auto__;
}
})())){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(sibling_block);

return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [sibling_block], null));
} else {
return null;
}
});
frontend.handler.editor.active_jtrigger_QMARK_ = (function frontend$handler$editor$active_jtrigger_QMARK_(){
var G__65641 = document.activeElement;
if((G__65641 == null)){
return null;
} else {
return dommy.core.has_class_QMARK_(G__65641,"jtrigger");
}
});
frontend.handler.editor.property_value_node_QMARK_ = (function frontend$handler$editor$property_value_node_QMARK_(node){
var G__65642 = node;
if((G__65642 == null)){
return null;
} else {
return dommy.core.has_class_QMARK_(G__65642,"property-value-container");
}
});
frontend.handler.editor.focus_trigger = (function frontend$handler$editor$focus_trigger(_current_block,sibling_block){
var temp__5804__auto__ = cljs.core.first(dommy.utils.__GT_Array(sibling_block.getElementsByClassName("jtrigger")));
if(cljs.core.truth_(temp__5804__auto__)){
var trigger = temp__5804__auto__;
frontend.state.clear_edit_BANG_();

if(((dommy.core.has_class_QMARK_(trigger,"ls-number")) || (dommy.core.has_class_QMARK_(trigger,"ls-empty-text-property")))){
return trigger.click();
} else {
return trigger.focus();
}
} else {
return null;
}
});
frontend.handler.editor.move_cross_boundary_up_down = (function frontend$handler$editor$move_cross_boundary_up_down(direction,move_opts){
var input = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"input","input",556931961).cljs$core$IFn$_invoke$arity$1(move_opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_input();
}
})();
var active_element = document.activeElement;
var input_or_active_element = (function (){var or__5002__auto__ = input;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return active_element;
}
})();
if(cljs.core.truth_(input_or_active_element)){
var repo = frontend.state.get_current_repo();
var f = (function (){var G__65644 = direction;
var G__65644__$1 = (((G__65644 instanceof cljs.core.Keyword))?G__65644.fqn:null);
switch (G__65644__$1) {
case "up":
return frontend.util.get_prev_block_non_collapsed;

break;
case "down":
return frontend.util.get_next_block_non_collapsed;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65644__$1)].join('')));

}
})();
var current_block = frontend.util.rec_get_node(input_or_active_element,"ls-block");
var sibling_block = (function (){var G__65645 = current_block;
var G__65646 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true], null);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__65645,G__65646) : f.call(null,G__65645,G__65646));
})();
var map__65643 = frontend.state.get_edit_block();
var map__65643__$1 = cljs.core.__destructure_map(map__65643);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65643__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65643__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65643__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var sibling_block__$1 = (function (){var or__5002__auto__ = (cljs.core.truth_(frontend.handler.editor.property_value_node_QMARK_(sibling_block))?cljs.core.first(dommy.utils.__GT_Array(sibling_block.getElementsByClassName("ls-block"))):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sibling_block;
}
})();
var property_value_container_QMARK_ = frontend.handler.editor.property_value_node_QMARK_(sibling_block__$1);
if(cljs.core.truth_(sibling_block__$1)){
var sibling_block_id = dommy.core.attr(sibling_block__$1,"blockid");
var container_id = (function (){var G__65648 = dommy.core.attr(sibling_block__$1,"containerid");
if((G__65648 == null)){
return null;
} else {
return parseInt(G__65648);
}
})();
var value = frontend.state.get_edit_content();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = uuid;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(frontend.state.block_component_editing_QMARK_())) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.clean_content_BANG_(repo,format__$1,title),clojure.string.trim(value))));
} else {
return and__5000__auto__;
}
})())?frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,uuid,value):null)),(function (___40947__auto__){
return promesa.protocols._promise(((dommy.core.has_class_QMARK_(sibling_block__$1,"block-add-button"))?sibling_block__$1.click():(cljs.core.truth_(property_value_container_QMARK_)?frontend.handler.editor.focus_trigger(current_block,sibling_block__$1):(function (){var new_uuid = cljs.core.uuid(sibling_block_id);
var block = (function (){var G__65650 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65650) : frontend.db.entity.call(null,G__65650));
})();
var G__65651 = block;
var G__65652 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(move_opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (cljs.core.truth_(input)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [direction,frontend.util.get_line_pos(input.value,frontend.util.get_selection_start(input))], null):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (0);
}
}
})();
var G__65653 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"direction","direction",-633359395),direction], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__65651,G__65652,G__65653) : frontend.handler.editor.edit_block_BANG_.call(null,G__65651,G__65652,G__65653));
})()
)));
}));
}));
} else {
var G__65654 = direction;
var G__65654__$1 = (((G__65654 instanceof cljs.core.Keyword))?G__65654.fqn:null);
switch (G__65654__$1) {
case "up":
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(0));

break;
case "down":
return frontend.util.cursor.move_cursor_to_end(input);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65654__$1)].join('')));

}
}
} else {
return null;
}
});
frontend.handler.editor.keydown_up_down_handler = (function frontend$handler$editor$keydown_up_down_handler(direction,p__65656){
var map__65657 = p__65656;
var map__65657__$1 = cljs.core.__destructure_map(map__65657);
var move_opts = map__65657__$1;
var _pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65657__$1,new cljs.core.Keyword(null,"_pos","_pos",-761936726));
var input = frontend.state.get_input();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
var up_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"up","up",-269712113));
var down_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"down","down",1565245570));
if(cljs.core.truth_(frontend.handler.editor.active_jtrigger_QMARK_())){
return frontend.handler.editor.move_cross_boundary_up_down(direction,move_opts);
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selected_start,selected_end)){
if(up_QMARK_){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,selected_start);
} else {
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,selected_end);
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return ((((up_QMARK_) && (frontend.util.cursor.textarea_cursor_first_row_QMARK_(input)))) || (((down_QMARK_) && (frontend.util.cursor.textarea_cursor_last_row_QMARK_(input)))));
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.move_cross_boundary_up_down(direction,move_opts);
} else {
if(cljs.core.truth_(input)){
if(up_QMARK_){
return frontend.util.cursor.move_cursor_up(input);
} else {
return frontend.util.cursor.move_cursor_down(input);
}
} else {
return null;
}

}
}
}
});
frontend.handler.editor.move_to_block_when_cross_boundary = (function frontend$handler$editor$move_to_block_when_cross_boundary(direction,p__65662){
var map__65663 = p__65662;
var map__65663__$1 = cljs.core.__destructure_map(map__65663);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65663__$1,new cljs.core.Keyword(null,"block","block",664686210));
var up_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"left","left",-399115937),direction);
var pos = ((up_QMARK_)?new cljs.core.Keyword(null,"max","max",61366548):(0));
var map__65664 = (function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_edit_block();
}
})();
var map__65664__$1 = cljs.core.__destructure_map(map__65664);
var block__$1 = map__65664__$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65664__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65664__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var repo = frontend.state.get_current_repo();
var editing_block = goog.dom.getElement(frontend.state.get_editing_block_dom_id());
var f = ((up_QMARK_)?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed);
var sibling_block = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(editing_block) : f.call(null,editing_block));
var sibling_block__$1 = (function (){var or__5002__auto__ = (cljs.core.truth_((function (){var and__5000__auto__ = sibling_block;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.editor.property_value_node_QMARK_(sibling_block);
} else {
return and__5000__auto__;
}
})())?(cljs.core.truth_((function (){var and__5000__auto__ = up_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = editing_block;
if(cljs.core.truth_(and__5000__auto____$1)){
return goog.dom.contains(sibling_block,editing_block);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(sibling_block) : f.call(null,sibling_block)):cljs.core.first(dommy.utils.__GT_Array(sibling_block.getElementsByClassName("ls-block")))):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sibling_block;
}
})();
if(cljs.core.truth_(sibling_block__$1)){
var content_66284 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
var value_66285 = frontend.state.get_edit_content();
if(cljs.core.truth_((function (){var and__5000__auto__ = value_66285;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.clean_content_BANG_(repo,format__$1,content_66284),clojure.string.trim(value_66285));
} else {
return and__5000__auto__;
}
})())){
frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,uuid,value_66285);
} else {
}

var sibling_block_id = dommy.core.attr(sibling_block__$1,"blockid");
if(cljs.core.truth_(sibling_block_id)){
var container_id = (function (){var G__65680 = dommy.core.attr(sibling_block__$1,"containerid");
if((G__65680 == null)){
return null;
} else {
return parseInt(G__65680);
}
})();
var block__$2 = (function (){var G__65681 = repo;
var G__65682 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(sibling_block_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__65681,G__65682) : frontend.db.entity.call(null,G__65681,G__65682));
})();
var G__65683 = block__$2;
var G__65684 = pos;
var G__65685 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__65683,G__65684,G__65685) : frontend.handler.editor.edit_block_BANG_.call(null,G__65683,G__65684,G__65685));
} else {
if(cljs.core.truth_(frontend.handler.editor.property_value_node_QMARK_(sibling_block__$1))){
return frontend.handler.editor.focus_trigger(editing_block,sibling_block__$1);
} else {
if(dommy.core.has_class_QMARK_(sibling_block__$1,"block-add-button")){
return sibling_block__$1.click();
} else {
return null;

}
}
}
} else {
return null;
}
});
frontend.handler.editor.keydown_arrow_handler = (function frontend$handler$editor$keydown_arrow_handler(direction){
var input = frontend.state.get_input();
var element = document.activeElement;
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
var left_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"left","left",-399115937));
var right_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"right","right",-452581833));
var block = (function (){var G__65690 = frontend.state.get_edit_block();
var G__65690__$1 = (((G__65690 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__65690));
if((G__65690__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65690__$1) : frontend.db.entity.call(null,G__65690__$1));
}
})();
var property_QMARK_ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.property_QMARK_.call(null,block));
if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(input,element);
} else {
return and__5000__auto__;
}
})())){
return input.focus();
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input,element)){
if(cljs.core.truth_((function (){var and__5000__auto__ = property_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((right_QMARK_) && (cljs.core.not(frontend.util.cursor.end_QMARK_(input))));
} else {
return and__5000__auto__;
}
})())){
return frontend.util.cursor.move_cursor_to_end(input);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = property_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((left_QMARK_) && (cljs.core.not(frontend.util.cursor.start_QMARK_(input))));
} else {
return and__5000__auto__;
}
})())){
return frontend.util.cursor.move_cursor_to_start(input);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = property_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = right_QMARK_;
if(and__5000__auto____$1){
var and__5000__auto____$2 = frontend.util.cursor.end_QMARK_(input);
if(cljs.core.truth_(and__5000__auto____$2)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"default","default",-1987822328))) || (cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(block))));
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
var pair = frontend.util.rec_get_node(input,"property-pair");
var jtrigger = (cljs.core.truth_(pair)?pair.querySelector(".property-value-container .jtrigger"):null);
if(cljs.core.truth_(jtrigger)){
return jtrigger.focus();
} else {
return null;
}
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selected_start,selected_end)){
if(left_QMARK_){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,selected_start);
} else {
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,selected_end);

}
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = left_QMARK_;
if(and__5000__auto__){
return frontend.util.cursor.start_QMARK_(input);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = right_QMARK_;
if(and__5000__auto__){
return frontend.util.cursor.end_QMARK_(input);
} else {
return and__5000__auto__;
}
}
})())){
return frontend.handler.editor.move_to_block_when_cross_boundary(direction,cljs.core.PersistentArrayMap.EMPTY);
} else {
if(left_QMARK_){
return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$1(input);
} else {
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$1(input);
}

}
}
}
}
}
} else {
return null;

}
}
});
frontend.handler.editor.delete_and_update = (function frontend$handler$editor$delete_and_update(input,start,end){
frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4(input,"",start,end);

return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),input.value);
});
frontend.handler.editor.delete_concat = (function frontend$handler$editor$delete_concat(current_block){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.collapsed_QMARK_(current_block)),(function (collapsed_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(collapsed_QMARK_)?null:(function (){var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
var temp__5804__auto__ = (function (){var or__5002__auto__ = logseq.db.get_first_child(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.db.model.get_next(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_block));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
var G__65702 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65702) : frontend.db.entity.call(null,G__65702));
} else {
return null;
}
})())),(function (next_block){
return promesa.protocols._promise((cljs.core.truth_(collapsed_QMARK_)?null:(((next_block == null))?null:(function (){var repo__$1 = frontend.state.get_current_repo();
var editor_state = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.editor.get_state(),new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(next_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(next_block)], 0));
return frontend.handler.editor.delete_block_inner_BANG_(repo__$1,editor_state);
})()
)));
}));
}));
}));
}));
});
frontend.handler.editor.keydown_delete_handler = (function frontend$handler$editor$keydown_delete_handler(_e){
var input = frontend.state.get_input();
var current_pos = frontend.util.cursor.pos(input);
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var end_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_pos,cljs.core.count(value));
var current_block = frontend.state.get_edit_block();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
if(cljs.core.truth_(current_block)){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selected_start,selected_end)){
return frontend.handler.editor.delete_and_update(input,selected_start,selected_end);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = end_QMARK_;
if(and__5000__auto__){
return current_block;
} else {
return and__5000__auto__;
}
})())){
var editor_state = frontend.handler.editor.get_state();
var custom_query_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(editor_state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951)], null));
if(cljs.core.truth_(custom_query_QMARK_)){
return null;
} else {
return frontend.handler.editor.delete_concat(current_block);
}
} else {
return frontend.handler.editor.delete_and_update(input,current_pos,frontend.util.safe_inc_current_pos_from_start(input.value,current_pos));

}
}
} else {
return null;
}
});
frontend.handler.editor.keydown_backspace_handler = (function frontend$handler$editor$keydown_backspace_handler(cut_QMARK_,e){
var input = frontend.state.get_input();
var element = document.activeElement;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input,element)){
var id = frontend.state.get_edit_input_id();
var current_pos = frontend.util.cursor.pos(input);
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var deleted = (function (){var and__5000__auto__ = (current_pos > (0));
if(and__5000__auto__){
return frontend.util.nth_safe(value,(current_pos - (1)));
} else {
return and__5000__auto__;
}
})();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
var block = frontend.state.get_edit_block();
var block__$1 = (function (){var G__65742 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65742) : frontend.db.entity.call(null,G__65742));
})();
var repo = frontend.state.get_current_repo();
var top_block_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = logseq.db.get_left_sibling(block__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block__$1);
}
})()),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block__$1)));
var single_block_QMARK_ = frontend.handler.editor.inside_of_single_block(e.target);
var root_block_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block.temp","container","block.temp/container",-493626206).cljs$core$IFn$_invoke$arity$1(block__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1)));
frontend.handler.block.mark_last_input_time_BANG_(repo);

if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(selected_start,selected_end)){
frontend.util.stop(e);

if(cljs.core.truth_(cut_QMARK_)){
document.execCommand("copy");
} else {
}

return frontend.handler.editor.delete_and_update(input,selected_start,selected_end);
} else {
if((current_pos === (0))){
var editor_state = frontend.handler.editor.get_state();
var custom_query_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(editor_state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951)], null));
frontend.util.stop(e);

if((((!(((top_block_QMARK_) && ((!(clojure.string.blank_QMARK_(value)))))))) && ((((!(root_block_QMARK_))) && ((((!(single_block_QMARK_))) && (cljs.core.not(custom_query_QMARK_)))))))){
if(cljs.core.truth_(frontend.handler.editor.own_order_number_list_QMARK_(block__$1))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.editor.remove_block_own_order_list_type_BANG_(block__$1));
}));
}));
} else {
return frontend.handler.editor.delete_block_BANG_(repo);
}
} else {
return null;
}
} else {
if((((current_pos > (0))) && (cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.createAsIfByAssoc([frontend.commands.command_ask,frontend.commands.command_trigger]),frontend.util.nth_safe(value,(current_pos - (1))))))){
frontend.util.stop(e);

frontend.commands.restore_state();

return frontend.handler.editor.delete_and_update(input,(current_pos - (1)),current_pos);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = deleted;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.contains_QMARK_(cljs.core.set(cljs.core.keys(frontend.handler.editor.delete_map)),deleted)) && ((((cljs.core.count(value) >= (current_pos + (1)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.nth_safe(value,current_pos),cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.delete_map,deleted))))));
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

frontend.commands.delete_pair_BANG_(id);

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(deleted,"[")) && (frontend.state.get_editor_show_page_search_QMARK_()))){
return frontend.state.clear_editor_action_BANG_();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(deleted,"(")) && (frontend.state.get_editor_show_block_search_QMARK_()))){
return frontend.state.clear_editor_action_BANG_();
} else {
return null;

}
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(deleted,"#")) && (frontend.state.get_editor_show_page_search_hashtag_QMARK_()))){
frontend.state.clear_editor_action_BANG_();

return frontend.handler.editor.delete_and_update(input,(current_pos - (1)),current_pos);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.mobile.util.native_ios_QMARK_());
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

return frontend.handler.editor.delete_and_update(input,frontend.util.safe_dec_current_pos_from_end(input.value,current_pos),current_pos);
} else {
return null;
}

}
}
}
}
}
} else {
return false;
}
});
frontend.handler.editor.indent_outdent = (function frontend$handler$editor$indent_outdent(indent_QMARK_){
var map__65748 = frontend.handler.editor.get_state();
var map__65748__$1 = cljs.core.__destructure_map(map__65748);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65748__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65748__$1,new cljs.core.Keyword(null,"block-container","block-container",-15068235));
if(cljs.core.truth_(block)){
var node = block_container;
var prev_container_id = frontend.handler.editor.get_node_container_id(node);
var container_id = frontend.handler.editor.get_new_container_id((cljs.core.truth_(indent_QMARK_)?new cljs.core.Keyword(null,"indent","indent",-148200125):new cljs.core.Keyword(null,"outdent","outdent",467209411)),cljs.core.PersistentArrayMap.EMPTY);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.block.indent_outdent_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),indent_QMARK_,frontend.handler.editor.save_current_block_BANG_)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(prev_container_id,container_id);
if(and__5000__auto__){
return container_id;
} else {
return and__5000__auto__;
}
})())?frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null)):null));
}));
}));
} else {
return null;
}
});
frontend.handler.editor.keydown_tab_handler = (function frontend$handler$editor$keydown_tab_handler(direction){
return (function (e){
if(frontend.state.editing_QMARK_()){
if(cljs.core.truth_(frontend.state.get_editor_action())){
} else {
frontend.util.stop(e);

frontend.handler.editor.indent_outdent((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"left","left",-399115937),direction))));
}
} else {
if(frontend.state.selection_QMARK_()){
frontend.util.stop(e);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));

frontend.handler.editor.on_tab(direction);
} else {
}
}

return null;
});
});
frontend.handler.editor.double_chars_typed_QMARK_ = (function frontend$handler$editor$double_chars_typed_QMARK_(value,pos,key,sym){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,sym);
if(and__5000__auto__){
var and__5000__auto____$1 = (cljs.core.count(value) >= (1));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (pos > (0));
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(value,(pos - (1))),sym);
if(and__5000__auto____$3){
if((cljs.core.count(value) > pos)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(value,pos),sym);
} else {
return true;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
/**
 * NOTE: Keydown cannot be used on Android platform
 */
frontend.handler.editor.keydown_not_matched_handler = (function frontend$handler$editor$keydown_not_matched_handler(format){
return (function (e,_key_code){
var input_id = frontend.state.get_edit_input_id();
var input = frontend.state.get_input();
var key = frontend.handler.editor.goog$module$goog$object.get(e,"key");
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var ctrlKey = frontend.handler.editor.goog$module$goog$object.get(e,"ctrlKey");
var metaKey = frontend.handler.editor.goog$module$goog$object.get(e,"metaKey");
var pos = frontend.util.cursor.pos(input);
var hashtag_QMARK_ = (function (){var or__5002__auto__ = frontend.handler.editor.surround_by_QMARK_(input,"#"," ");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.handler.editor.surround_by_QMARK_(input,"#",new cljs.core.Keyword(null,"end","end",-268185958));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"#");
}
}
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(cljs.core.deref(new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(key,"Arrow");
} else {
return and__5000__auto__;
}
}
})())){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","start-pos","editor/start-pos",-40843537),pos);
} else {
}

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page-search","page-search",1842925280),frontend.state.get_editor_action())) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,frontend.commands.hashtag)))){
frontend.util.stop(e);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Page name can't include \"#\".",new cljs.core.Keyword(null,"warning","warning",-1685650671));
} else {
if((!((cljs.core.deref(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))) == null)))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),((cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)).length))){
frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395),(function (s){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('');
}));
} else {
}

return frontend.util.stop(e);
} else {
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["ArrowRight",null,"ArrowLeft",null], null), null),key)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property-value-search","property-value-search",1985137335),null,new cljs.core.Keyword(null,"property-search","property-search",1730602043),null], null), null),frontend.state.get_editor_action())))){
return frontend.state.clear_editor_action_BANG_();
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$2(e,true);
if(cljs.core.truth_(and__5000__auto__)){
return (((!(hashtag_QMARK_))) && ((!(frontend.state.get_editor_show_page_search_hashtag_QMARK_()))));
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = ctrlKey;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return metaKey;
}
})())){
return null;
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"#")) && ((((pos > (0))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",frontend.util.nth_safe(value,(pos - (1))))))))){
return frontend.state.clear_editor_action_BANG_();
} else {
if(((cljs.core.contains_QMARK_(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(frontend.handler.editor.reversed_autopair_map)),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["`",null], null), null)),key)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.get_current_input_char(input),key)))){
frontend.util.stop(e);

return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$1(input);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (frontend.handler.editor.autopair_when_selected.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.autopair_when_selected.cljs$core$IFn$_invoke$arity$1(key) : frontend.handler.editor.autopair_when_selected.call(null,key));
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(frontend.util.get_selected_text());
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if((!((cljs.core.deref(new cljs.core.Keyword("editor","action","editor/action",449993861).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))) == null)))){
return null;
} else {
if((((!(clojure.string.blank_QMARK_(frontend.util.get_selected_text())))) && (cljs.core.contains_QMARK_(frontend.util.keycode.left_square_brackets_keys,key)))){
frontend.handler.editor.autopair(input_id,"[",format,null);

return frontend.util.stop(e);
} else {
if((((!(clojure.string.blank_QMARK_(frontend.util.get_selected_text())))) && (cljs.core.contains_QMARK_(frontend.util.keycode.left_paren_keys,key)))){
frontend.util.stop(e);

return frontend.handler.editor.autopair(input_id,"(",format,null);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(frontend.handler.editor.autopair_map)),"("),key);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return frontend.handler.editor.autopair_left_paren_QMARK_(input,key);
}
})())){
var curr = frontend.handler.editor.get_current_input_char(input);
var prev = frontend.util.nth_safe(value,(pos - (1)));
frontend.util.stop(e);

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"`")) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("`",curr)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("`",prev)))))){
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$1(input);
} else {
return frontend.handler.editor.autopair(input_id,key,format,null);
}
} else {
if((function (){var sym = ";";
return ((db_based_QMARK_) && (frontend.handler.editor.double_chars_typed_QMARK_(value,pos,key,sym)));
})()){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491)], null));
} else {
if((function (){var sym = "$";
return frontend.handler.editor.double_chars_typed_QMARK_(value,pos,key,sym);
})()){
return frontend.commands.simple_insert_BANG_(input_id,"$$",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null));
} else {
if((function (){var sym = "^";
return frontend.handler.editor.double_chars_typed_QMARK_(value,pos,key,sym);
})()){
return frontend.commands.simple_insert_BANG_(input_id,"^^",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null));
} else {
return null;

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
});
frontend.handler.editor.input_page_ref_QMARK_ = (function frontend$handler$editor$input_page_ref_QMARK_(k,current_pos,blank_selected_QMARK_,last_key_code){
var and__5000__auto__ = blank_selected_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.contains_QMARK_(frontend.util.keycode.left_square_brackets_keys,k)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(last_key_code),k)) && ((current_pos > (0))))));
} else {
return and__5000__auto__;
}
});
frontend.handler.editor.default_case_for_keyup_handler = (function frontend$handler$editor$default_case_for_keyup_handler(input,current_pos,k,code,is_processed_QMARK_){
var last_key_code = frontend.state.get_last_key_code();
var blank_selected_QMARK_ = clojure.string.blank_QMARK_(frontend.util.get_selected_text());
var non_enter_processed_QMARK_ = (function (){var and__5000__auto__ = is_processed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(code,frontend.util.keycode.enter_code);
} else {
return and__5000__auto__;
}
})();
var editor_action = frontend.state.get_editor_action();
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(editor_action,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
if(and__5000__auto__){
return frontend.handler.editor.input_page_ref_QMARK_(k,current_pos,blank_selected_QMARK_,last_key_code);
} else {
return and__5000__auto__;
}
})())){
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),logseq.common.util.page_ref.right_brackets,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),new cljs.core.Keyword(null,"skip-check","skip-check",-1698571130),new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null));

frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));
} else {
if(((cljs.core.not(editor_action)) && (cljs.core.not(non_enter_processed_QMARK_)))){
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, ["ArrowUp",null,"ArrowDown",null,"ArrowRight",null,"ArrowLeft",null,"Escape",null], null), null),k)));
if(and__5000__auto__){
return frontend.handler.editor.wrapped_by_QMARK_(input,logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets);
} else {
return and__5000__auto__;
}
})())){
var orig_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var square_pos = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(orig_pos)),logseq.common.util.page_ref.left_brackets);
var pos = (square_pos + (2));
var _ = frontend.state.set_editor_last_pos_BANG_(pos);
var pos__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(orig_pos,new cljs.core.Keyword(null,"pos","pos",-864607220),pos);
var command_step = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",frontend.util.nth_safe(value,(square_pos - (1)))))?new cljs.core.Keyword("editor","search-page-hashtag","editor/search-page-hashtag",2082188401):new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812));
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [command_step], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),pos__$1], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.handler.editor.input_page_ref_QMARK_(k,current_pos,blank_selected_QMARK_,last_key_code);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.handler.editor.wrapped_by_QMARK_(input,logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets));
} else {
return and__5000__auto__;
}
})())){
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),logseq.common.util.page_ref.left_and_right_brackets,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-truncate-number","backward-truncate-number",-2044126744),(2),new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null));

frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));
} else {
if(((blank_selected_QMARK_) && (((cljs.core.contains_QMARK_(frontend.util.keycode.left_paren_keys,k)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(last_key_code),k)) && ((((current_pos > (0))) && (cljs.core.not(frontend.handler.editor.wrapped_by_QMARK_(input,logseq.common.util.block_ref.left_parens,logseq.common.util.block_ref.right_parens))))))))))){
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),logseq.common.util.block_ref.left_and_right_parens,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-truncate-number","backward-truncate-number",-2044126744),(2),new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null));

frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),new cljs.core.Keyword(null,"reference","reference",-1711695023)], null));

return frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));
} else {
return null;

}
}
}
} else {
return null;
}
}
});
frontend.handler.editor.keyup_handler = (function frontend$handler$editor$keyup_handler(_state,input){
return (function (e,key_code){
if(cljs.core.truth_(frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$1(e))){
return null;
} else {
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var current_pos = frontend.util.cursor.pos(input);
var value = frontend.handler.editor.goog$module$goog$object.get(input,"value");
var c = frontend.util.nth_safe(value,(current_pos - (1)));
var vec__65800 = (cljs.core.truth_((function (){var and__5000__auto__ = c;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.mobile.util.native_android_QMARK_();
if(cljs.core.truth_(and__5000__auto____$1)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key_code,(229))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key_code,(0))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [value.charCodeAt((current_pos - (1))),c,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c," "))?"Space":(cljs.core.truth_(cljs.core.parse_long(c))?["Digit",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c)].join(''):["Key",clojure.string.upper_case(c)].join('')
)),false], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [key_code,frontend.handler.editor.goog$module$goog$object.get(e,"key"),(cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())?frontend.handler.editor.goog$module$goog$object.get(e,"key"):frontend.handler.editor.goog$module$goog$object.getValueByKeys(e,"event_","code")),frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$2(e,true)], null));
var key_code__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65800,(0),null);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65800,(1),null);
var code = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65800,(2),null);
var is_processed_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65800,(3),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"``````");
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input.id,"");

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.state.get_edit_block(),new cljs.core.Keyword("block","title","block/title",710445684),""),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword(null,"update-current-block?","update-current-block?",-507726186),true], null)], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,">");
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input.id,"");

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.state.get_edit_block(),new cljs.core.Keyword("block","title","block/title",710445684),""),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"quote","quote",-262615245),new cljs.core.Keyword(null,"update-current-block?","update-current-block?",-507726186),true], null)], null));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"commands","commands",161008658),frontend.state.get_editor_action())) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(k,frontend.commands.command_trigger)))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.commands.command_trigger,cljs.core.second(cljs.core.re_find(/(\S+)\s+$/,value)))){
frontend.state.clear_editor_action_BANG_();
} else {
var command_66288 = frontend.handler.editor.get_last_command(input);
var matched_commands_66289 = frontend.handler.editor.get_matched_commands(command_66288);
if(cljs.core.seq(matched_commands_66289)){
frontend.commands.set_matched_commands_BANG_(command_66288,matched_commands_66289);
} else {
if(((cljs.core.count(command_66288) - cljs.core.count(cljs.core.deref(frontend.commands._STAR_latest_matched_command))) > (2))){
frontend.state.clear_editor_action_BANG_();
} else {
cljs.core.reset_BANG_(frontend.commands._STAR_matched_commands,null);
}
}
}
} else {
frontend.handler.editor.default_case_for_keyup_handler(input,current_pos,k,code,is_processed_QMARK_);

}
}
}

frontend.handler.editor.close_autocomplete_if_outside(input);

if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"Shift");
if(or__5002__auto__){
return or__5002__auto__;
} else {
return is_processed_QMARK_;
}
})())){
} else {
frontend.state.set_last_key_code_BANG_(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key-code","key-code",-1732114304),key_code__$1,new cljs.core.Keyword(null,"code","code",1586293142),code,new cljs.core.Keyword(null,"key","key",-1516042587),k,new cljs.core.Keyword(null,"shift?","shift?",-1034734696),e.shiftKey], null));
}

if(cljs.core.truth_(frontend.state.get_editor_action())){
return null;
} else {
return frontend.state.set_editor_last_pos_BANG_(current_pos);
}
}
});
});
frontend.handler.editor.editor_on_click_BANG_ = (function frontend$handler$editor$editor_on_click_BANG_(id){
return (function (_e){
var input = goog.dom.getElement(id);
frontend.util.scroll_editor_cursor(input);

return frontend.handler.editor.close_autocomplete_if_outside(input);
});
});
frontend.handler.editor.editor_on_change_BANG_ = (function frontend$handler$editor$editor_on_change_BANG_(block,id,search_timeout){
return (function (e){
var editor_action = frontend.state.get_editor_action();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-search","block-search",-897517253),editor_action)){
var timeout = (50);
if(cljs.core.truth_(cljs.core.deref(search_timeout))){
clearTimeout(cljs.core.deref(search_timeout));
} else {
}

return cljs.core.reset_BANG_(search_timeout,setTimeout((function (){
return frontend.handler.editor.edit_box_on_change_BANG_(e,block,id);
}),timeout));
} else {
var input = goog.dom.getElement(id);
frontend.handler.editor.edit_box_on_change_BANG_(e,block,id);

if(cljs.core.truth_(editor_action)){
return null;
} else {
return frontend.util.scroll_editor_cursor(input);
}
}
});
});
frontend.handler.editor.cut_blocks_and_clear_selections_BANG_ = (function frontend$handler$editor$cut_blocks_and_clear_selections_BANG_(copy_QMARK_){
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"active?","active?",459499776)], null)))){
return null;
} else {
frontend.handler.editor.cut_selection_blocks(copy_QMARK_);

return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
}
});
frontend.handler.editor.shortcut_copy_selection = (function frontend$handler$editor$shortcut_copy_selection(_e){
return frontend.handler.editor.copy_selection_blocks(true);
});
frontend.handler.editor.shortcut_cut_selection = (function frontend$handler$editor$shortcut_cut_selection(e){
if(cljs.core.truth_(frontend.util.input_QMARK_(e.target))){
return null;
} else {
frontend.util.stop(e);

return frontend.handler.editor.cut_blocks_and_clear_selections_BANG_(true);
}
});
frontend.handler.editor.shortcut_delete_selection = (function frontend$handler$editor$shortcut_delete_selection(e){
if(cljs.core.truth_(frontend.util.input_QMARK_(e.target))){
return null;
} else {
frontend.util.stop(e);

return frontend.handler.editor.cut_blocks_and_clear_selections_BANG_(false);
}
});
frontend.handler.editor.copy_current_block_ref = (function frontend$handler$editor$copy_current_block_ref(format){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var current_block = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_id = temp__5804__auto____$1;
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,"embed")){
if(db_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.util.ref.__GT_page_ref.call(null,block_id)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"graph","graph",1558099509),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"blocks","blocks",-610462153),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block)], null)], null),new cljs.core.Keyword(null,"embed-block?","embed-block?",402074593),true], null)], 0)));
}));
}));
} else {
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__65823_SHARP_){
return ["{{embed ((",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__65823_SHARP_),"))}}"].join('');
}));
}
} else {
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,((db_QMARK_)?frontend.util.ref.__GT_page_ref:frontend.util.ref.__GT_block_ref));
}
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.editor.copy_current_block_embed = (function frontend$handler$editor$copy_current_block_embed(){
return frontend.handler.editor.copy_current_block_ref("embed");
});
/**
 * shortcut copy action:
 *   * when in selection mode, copy selected blocks
 *   * when in edit mode but no text selected, copy current block ref
 *   * when in edit mode with text selected, copy selected text as normal
 *   * when text is selected on a PDF, copy the highlighted text
 */
frontend.handler.editor.shortcut_copy = (function frontend$handler$editor$shortcut_copy(e){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
if(frontend.state.selection_QMARK_()){
return frontend.handler.editor.shortcut_copy_selection(e);
} else {
if(((frontend.state.editing_QMARK_()) && ((new cljs.core.Keyword("editor","code-block-context","editor/code-block-context",-1384305346).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)) == null)))){
var input = frontend.state.get_input();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_start,selected_end)){
return frontend.handler.editor.copy_current_block_ref("ref");
} else {
return null;
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.get_current_pdf();
if(cljs.core.truth_(and__5000__auto__)){
return window.getSelection().baseNode.parentElement.closest(".pdfViewer");
} else {
return and__5000__auto__;
}
})())){
return frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.extensions.pdf.utils.fix_selection_text_breakline(window.getSelection().toString()),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([null], 0));
} else {
return null;
}
}
}
}
});
/**
 * shortcut copy action:
 *   * when in selection mode, copy selected blocks
 *   * when in edit mode with text selected, copy selected text as normal
 */
frontend.handler.editor.shortcut_copy_text = (function frontend$handler$editor$shortcut_copy_text(_e){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
if(frontend.state.selection_QMARK_()){
return frontend.handler.editor.copy_selection_blocks(false);
} else {
return document.execCommand("copy");

}
}
});
frontend.handler.editor.whiteboard_QMARK_ = (function frontend$handler$editor$whiteboard_QMARK_(){
var and__5000__auto__ = frontend.db.model.whiteboard_page_QMARK_(frontend.state.get_current_page());
if(cljs.core.truth_(and__5000__auto__)){
return document.activeElement.closest(".logseq-tldraw");
} else {
return and__5000__auto__;
}
});
/**
 * shortcut cut action:
 *   * when in selection mode, cut selected blocks
 *   * when in edit mode with text selected, cut selected text
 *   * otherwise nothing need to be handled.
 */
frontend.handler.editor.shortcut_cut = (function frontend$handler$editor$shortcut_cut(e){
if(frontend.state.selection_QMARK_()){
return frontend.handler.editor.shortcut_cut_selection(e);
} else {
if(((frontend.state.editing_QMARK_()) && (frontend.util.input_text_selected_QMARK_(goog.dom.getElement(frontend.state.get_edit_input_id()))))){
return frontend.handler.editor.keydown_backspace_handler(true,e);
} else {
if(cljs.core.truth_(frontend.handler.editor.whiteboard_QMARK_())){
return frontend.state.active_tldraw_app().cut();
} else {
return null;

}
}
}
});
frontend.handler.editor.delete_selection = (function frontend$handler$editor$delete_selection(e){
if(frontend.state.selection_QMARK_()){
return frontend.handler.editor.shortcut_delete_selection(e);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.handler.editor.whiteboard_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.state.editing_QMARK_());
} else {
return and__5000__auto__;
}
})())){
return frontend.state.active_tldraw_app().api.deleteShapes();
} else {
return null;

}
}
});
frontend.handler.editor.editor_delete = (function frontend$handler$editor$editor_delete(e){
if(frontend.state.editing_QMARK_()){
frontend.util.stop(e);

return frontend.handler.editor.keydown_delete_handler(e);
} else {
return null;
}
});
frontend.handler.editor.editor_backspace = (function frontend$handler$editor$editor_backspace(e){
if(frontend.state.editing_QMARK_()){
return frontend.handler.editor.keydown_backspace_handler(false,e);
} else {
return null;
}
});
frontend.handler.editor.in_page_preview_QMARK_ = (function frontend$handler$editor$in_page_preview_QMARK_(){
var G__65828 = document.activeElement;
var G__65828__$1 = (((G__65828 == null))?null:G__65828.closest(".ls-preview-popup"));
var G__65828__$2 = (((G__65828__$1 == null))?null:(G__65828__$1 == null));
if((G__65828__$2 == null)){
return null;
} else {
return cljs.core.not(G__65828__$2);
}
});
frontend.handler.editor.shortcut_up_down = (function frontend$handler$editor$shortcut_up_down(direction){
return (function (e){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));

if((function (){var and__5000__auto__ = cljs.core.not(frontend.handler.editor.auto_complete_QMARK_());
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = frontend.handler.editor.in_page_preview_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(frontend.handler.editor.in_shui_popup_QMARK_());
}
})();
if(and__5000__auto____$1){
return cljs.core.not(frontend.state.get_timestamp_block());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})()){
frontend.util.stop(e);

if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.state.editing_QMARK_();
if(or__5002__auto__){
return or__5002__auto__;
} else {
return frontend.handler.editor.active_jtrigger_QMARK_();
}
})())){
frontend.handler.editor.keydown_up_down_handler(direction,cljs.core.PersistentArrayMap.EMPTY);
} else {
if(frontend.state.selection_QMARK_()){
frontend.handler.editor.select_up_down(direction);
} else {
if(cljs.core.not(frontend.state.get_edit_input_id())){
frontend.handler.editor.select_first_last(direction);
} else {
}
}
}
} else {
}

return null;
});
});
frontend.handler.editor.shortcut_select_up_down = (function frontend$handler$editor$shortcut_select_up_down(direction){
return (function (e){
frontend.util.stop(e);

if(frontend.state.editing_QMARK_()){
var input = frontend.state.get_input();
var selected_start = frontend.util.get_selection_start(input);
var selected_end = frontend.util.get_selection_end(input);
var vec__65829 = (function (){var G__65832 = frontend.util.get_selection_direction(input);
switch (G__65832) {
case "backward":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_end,selected_start], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_start,selected_end], null);

}
})();
var anchor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65829,(0),null);
var cursor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65829,(1),null);
var cursor_rect = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$2(input,cursor);
if(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"up","up",-269712113))) && (frontend.util.cursor.textarea_cursor_rect_first_row_QMARK_(cursor_rect)))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"down","down",1565245570))) && (frontend.util.cursor.textarea_cursor_rect_last_row_QMARK_(cursor_rect)))))){
return frontend.handler.editor.select_block_up_down(direction);
} else {
return frontend.util.cursor.select_up_down(input,direction,anchor,cursor_rect);
}
} else {
return frontend.handler.editor.select_block_up_down(direction);
}
});
});
frontend.handler.editor.editor_commands_popup_exists_QMARK_ = (function frontend$handler$editor$editor_commands_popup_exists_QMARK_(){
return frontend.handler.editor.popup_exists_QMARK_("editor.commands");
});
frontend.handler.editor.open_selected_blocks_in_sidebar_BANG_ = (function frontend$handler$editor$open_selected_blocks_in_sidebar_BANG_(){
var seq__65833 = cljs.core.seq(frontend.state.get_selection_block_ids());
var chunk__65834 = null;
var count__65835 = (0);
var i__65836 = (0);
while(true){
if((i__65836 < count__65835)){
var id = chunk__65834.cljs$core$IIndexed$_nth$arity$2(null,i__65836);
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),id,new cljs.core.Keyword(null,"block","block",664686210));


var G__66291 = seq__65833;
var G__66292 = chunk__65834;
var G__66293 = count__65835;
var G__66294 = (i__65836 + (1));
seq__65833 = G__66291;
chunk__65834 = G__66292;
count__65835 = G__66293;
i__65836 = G__66294;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__65833);
if(temp__5804__auto__){
var seq__65833__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__65833__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__65833__$1);
var G__66295 = cljs.core.chunk_rest(seq__65833__$1);
var G__66296 = c__5525__auto__;
var G__66297 = cljs.core.count(c__5525__auto__);
var G__66298 = (0);
seq__65833 = G__66295;
chunk__65834 = G__66296;
count__65835 = G__66297;
i__65836 = G__66298;
continue;
} else {
var id = cljs.core.first(seq__65833__$1);
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),id,new cljs.core.Keyword(null,"block","block",664686210));


var G__66299 = cljs.core.next(seq__65833__$1);
var G__66300 = null;
var G__66301 = (0);
var G__66302 = (0);
seq__65833 = G__66299;
chunk__65834 = G__66300;
count__65835 = G__66301;
i__65836 = G__66302;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.handler.editor.open_selected_block_BANG_ = (function frontend$handler$editor$open_selected_block_BANG_(direction,e){
var selected_blocks = frontend.state.get_selection_blocks();
var f = (function (){var G__65837 = direction;
var G__65837__$1 = (((G__65837 instanceof cljs.core.Keyword))?G__65837.fqn:null);
switch (G__65837__$1) {
case "left":
return cljs.core.first;

break;
case "right":
return cljs.core.last;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__65837__$1)].join('')));

}
})();
var node = (function (){var G__65838 = selected_blocks;
if((G__65838 == null)){
return null;
} else {
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__65838) : f.call(null,G__65838));
}
})();
var temp__5804__auto__ = (function (){var G__65839 = node;
var G__65839__$1 = (((G__65839 == null))?null:dommy.core.attr(G__65839,"blockid"));
if((G__65839__$1 == null)){
return null;
} else {
return cljs.core.uuid(G__65839__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
frontend.util.stop(e);

var block = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
var left_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"left","left",-399115937));
var opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),(function (){var G__65840 = node;
var G__65840__$1 = (((G__65840 == null))?null:dommy.core.attr(G__65840,"containerid"));
if((G__65840__$1 == null)){
return null;
} else {
return cljs.core.parse_long(G__65840__$1);
}
})(),new cljs.core.Keyword(null,"event","event",301435442),e], null);
var G__65841 = block;
var G__65842 = ((left_QMARK_)?(0):new cljs.core.Keyword(null,"max","max",61366548));
var G__65843 = opts;
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__65841,G__65842,G__65843) : frontend.handler.editor.edit_block_BANG_.call(null,G__65841,G__65842,G__65843));
} else {
return null;
}
});
frontend.handler.editor.shortcut_left_right = (function frontend$handler$editor$shortcut_left_right(direction){
return (function (e){
if(((cljs.core.not(frontend.handler.editor.auto_complete_QMARK_())) && (cljs.core.not(frontend.state.get_timestamp_block())))){
if(frontend.state.editing_QMARK_()){
frontend.util.stop(e);

return frontend.handler.editor.keydown_arrow_handler(direction);
} else {
if(frontend.state.selection_QMARK_()){
frontend.util.stop(e);

return frontend.handler.editor.open_selected_block_BANG_(direction,e);
} else {
return null;

}
}
} else {
return null;
}
});
});
frontend.handler.editor.clear_block_content_BANG_ = (function frontend$handler$editor$clear_block_content_BANG_(){
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));

return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),"");
});
frontend.handler.editor.kill_line_before_BANG_ = (function frontend$handler$editor$kill_line_before_BANG_(){
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));

return frontend.util.kill_line_before_BANG_(frontend.state.get_input());
});
frontend.handler.editor.kill_line_after_BANG_ = (function frontend$handler$editor$kill_line_after_BANG_(){
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));

return frontend.util.kill_line_after_BANG_(frontend.state.get_input());
});
frontend.handler.editor.beginning_of_block = (function frontend$handler$editor$beginning_of_block(){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(frontend.state.get_input(),(0));
});
frontend.handler.editor.end_of_block = (function frontend$handler$editor$end_of_block(){
return frontend.util.cursor.move_cursor_to_end(frontend.state.get_input());
});
frontend.handler.editor.cursor_forward_word = (function frontend$handler$editor$cursor_forward_word(){
return frontend.util.cursor.move_cursor_forward_by_word(frontend.state.get_input());
});
frontend.handler.editor.cursor_backward_word = (function frontend$handler$editor$cursor_backward_word(){
return frontend.util.cursor.move_cursor_backward_by_word(frontend.state.get_input());
});
frontend.handler.editor.backward_kill_word = (function frontend$handler$editor$backward_kill_word(){
var input = frontend.state.get_input();
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));

frontend.util.backward_kill_word(input);

return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),input.value);
});
frontend.handler.editor.forward_kill_word = (function frontend$handler$editor$forward_kill_word(){
var input = frontend.state.get_input();
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));

frontend.util.forward_kill_word(input);

return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),input.value);
});
frontend.handler.editor.block_with_title_QMARK_ = (function frontend$handler$editor$block_with_title_QMARK_(format,content,semantic_QMARK_){
var and__5000__auto__ = clojure.string.includes_QMARK_(content,"\n");
if(and__5000__auto__){
if(cljs.core.truth_(semantic_QMARK_)){
var ast = frontend.format.mldoc.__GT_edn(content,format);
var first_elem_type = cljs.core.first(cljs.core.ffirst(ast));
return (frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1(first_elem_type) : frontend.format.mldoc.block_with_title_QMARK_.call(null,first_elem_type));
} else {
return true;
}
} else {
return and__5000__auto__;
}
});
frontend.handler.editor.db_collapsable_QMARK_ = (function frontend$handler$editor$db_collapsable_QMARK_(block){
var class_properties = new cljs.core.Keyword(null,"classes-properties","classes-properties",1920679577).cljs$core$IFn$_invoke$arity$1(logseq.outliner.property.get_block_classes_properties((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)));
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
var attributes = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","alias","block/alias",-2112644699),null], null), null),logseq.db.frontend.property.db_attribute_properties));
var properties = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(e);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.outliner.property.property_with_other_position_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
var G__65844 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e);
return (attributes.cljs$core$IFn$_invoke$arity$1 ? attributes.cljs$core$IFn$_invoke$arity$1(G__65844) : attributes.call(null,G__65844));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(class_properties,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.db.common.entity_plus.entity_memoized,db),new cljs.core.Keyword("block.temp","property-keys","block.temp/property-keys",2093695024).cljs$core$IFn$_invoke$arity$1(block)))))));
var or__5002__auto__ = cljs.core.seq(properties);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var G__65845 = logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__65846 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__65845,G__65846) : logseq.db.class_instance_QMARK_.call(null,G__65845,G__65846));
}
});
frontend.handler.editor.collapsable_QMARK_ = (function frontend$handler$editor$collapsable_QMARK_(var_args){
var G__65848 = arguments.length;
switch (G__65848) {
case 1:
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$2(block_id,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,p__65849){
var map__65850 = p__65849;
var map__65850__$1 = cljs.core.__destructure_map(map__65850);
var semantic_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65850__$1,new cljs.core.Keyword(null,"semantic?","semantic?",-1258468577),false);
var ignore_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65850__$1,new cljs.core.Keyword(null,"ignore-children?","ignore-children?",1993539421),false);
if(cljs.core.truth_(block_id)){
var repo = frontend.state.get_current_repo();
var temp__5802__auto__ = (function (){var G__65851 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65851) : frontend.db.entity.call(null,G__65851));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block = temp__5802__auto__;
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var or__5002__auto__ = (cljs.core.truth_(ignore_children_QMARK_)?false:frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(block_id));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return frontend.handler.editor.db_collapsable_QMARK_(block);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var and__5000__auto__ = (!(db_based_QMARK_));
if(and__5000__auto__){
var or__5002__auto____$2 = frontend.handler.file_based.editor.valid_dsl_query_block_QMARK_(block);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return frontend.handler.file_based.editor.valid_custom_query_block_QMARK_(block);
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = new cljs.core.Keyword("outliner","block-title-collapse-enabled?","outliner/block-title-collapse-enabled?",1547538161).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.editor.block_with_title_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),semantic_QMARK_);
} else {
return and__5000__auto__;
}
}
}
}
} else {
return false;
}
} else {
return null;
}
}));

(frontend.handler.editor.collapsable_QMARK_.cljs$lang$maxFixedArity = 2);

/**
 * Return all blocks associated with correct level
 * if :root-block is not nil, only return root block with its children
 * if :expanded? true, return expanded children
 * if :collapse? true, return without any collapsed children
 * if :incremental? true, collapse/expand will be step by step
 * for example:
 * - a
 *  - b (collapsed)
 *   - c
 *   - d
 *  - e
 * return:
 *  blocks
 *  [{:block a :level 1}
 *   {:block b :level 2}
 *   {:block e :level 2}]
 */
frontend.handler.editor._LT_all_blocks_with_level = (function frontend$handler$editor$_LT_all_blocks_with_level(p__65852){
var map__65853 = p__65852;
var map__65853__$1 = cljs.core.__destructure_map(map__65853);
var collapse_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65853__$1,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),false);
var expanded_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65853__$1,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),false);
var incremental_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65853__$1,new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),true);
var root_block = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65853__$1,new cljs.core.Keyword(null,"root-block","root-block",-645043721),null);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65853__$1,new cljs.core.Keyword(null,"page","page",849072397));
var temp__5804__auto__ = (function (){var or__5002__auto__ = page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.date.today();
}
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page__$1 = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = root_block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.parse_uuid(page__$1);
}
})()),(function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(block_id)?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page__$1) : frontend.db.get_page.call(null,page__$1))))),(function (page_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,(function (){var or__5002__auto__ = block_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_id;
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855),true,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711),true], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page_id)?result:cljs.core.cons((function (){var G__65854 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65854) : frontend.db.entity.call(null,G__65854));
})(),result))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = block_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return root_block;
}
})()),(function (root_block__$1){
return promesa.protocols._promise((cljs.core.truth_(incremental_QMARK_)?(function (){var blocks__$1 = frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2(blocks,(function (){var or__5002__auto__ = block_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_id;
}
})());
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var G__65855 = blocks__$1;
var G__65855__$1 = (cljs.core.truth_(root_block__$1)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function frontend$handler$editor$_LT_all_blocks_with_level_$_find(root){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(root_block__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(root))){
return root;
} else {
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend$handler$editor$_LT_all_blocks_with_level_$_find,new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$2(root,cljs.core.PersistentVector.EMPTY)));
}
}),G__65855):G__65855);
var G__65855__$2 = (cljs.core.truth_(collapse_QMARK_)?clojure.walk.postwalk((function (b){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(b);
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.util.collapsed_QMARK_(b);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(root_block__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","children","block/children",-1040716209),cljs.core.PersistentVector.EMPTY);
} else {
return b;
}
}),G__65855__$1):G__65855__$1);
var G__65855__$3 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (x){
return cljs.core.tree_seq(cljs.core.map_QMARK_,new cljs.core.Keyword("block","children","block/children",-1040716209),x);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__65855__$2], 0))
;
var G__65855__$4 = (cljs.core.truth_(expanded_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),G__65855__$3):G__65855__$3);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(x,new cljs.core.Keyword("block","children","block/children",-1040716209));
}),G__65855__$4);

})());
})():(function (){var G__65856 = blocks;
var G__65856__$1 = (cljs.core.truth_(collapse_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.util.collapsed_QMARK_,G__65856):G__65856);
var G__65856__$2 = (cljs.core.truth_(expanded_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),G__65856__$1):G__65856__$1);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__65856__$2);

})()));
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
});
frontend.handler.editor.skip_collapsing_in_db_QMARK_ = (function frontend$handler$editor$skip_collapsing_in_db_QMARK_(){
var config = cljs.core.last(frontend.state.get_editor_args());
return new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
});
frontend.handler.editor.set_blocks_collapsed_BANG_ = (function frontend$handler$editor$set_blocks_collapsed_BANG_(block_ids,value){
var block_ids__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_id){
if(typeof block_id === 'string'){
return cljs.core.uuid(block_id);
} else {
return block_id;
}
}),block_ids);
var repo = frontend.state.get_current_repo();
var value__$1 = cljs.core.boolean$(value);
if(cljs.core.truth_(repo)){
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

var test_QMARK___60293__auto___66305 = frontend.util.node_test_QMARK_;
var ops__60294__auto___66306 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto___66307 = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto___66307);

if(cljs.core.truth_(ops__60294__auto___66306)){
var seq__65857_66308 = cljs.core.seq(block_ids__$1);
var chunk__65858_66309 = null;
var count__65859_66310 = (0);
var i__65860_66311 = (0);
while(true){
if((i__65860_66311 < count__65859_66310)){
var block_id_66312 = chunk__65858_66309.cljs$core$IIndexed$_nth$arity$2(null,i__65860_66311);
var temp__5804__auto___66313 = (function (){var G__65863 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66312], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65863) : frontend.db.entity.call(null,G__65863));
})();
if(cljs.core.truth_(temp__5804__auto___66313)){
var block_66314 = temp__5804__auto___66313;
var current_value_66315 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_66314));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_66315,value__$1)){
} else {
var block_66316__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66312,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_66316__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__66320 = seq__65857_66308;
var G__66321 = chunk__65858_66309;
var G__66322 = count__65859_66310;
var G__66323 = (i__65860_66311 + (1));
seq__65857_66308 = G__66320;
chunk__65858_66309 = G__66321;
count__65859_66310 = G__66322;
i__65860_66311 = G__66323;
continue;
} else {
var temp__5804__auto___66324 = cljs.core.seq(seq__65857_66308);
if(temp__5804__auto___66324){
var seq__65857_66325__$1 = temp__5804__auto___66324;
if(cljs.core.chunked_seq_QMARK_(seq__65857_66325__$1)){
var c__5525__auto___66326 = cljs.core.chunk_first(seq__65857_66325__$1);
var G__66327 = cljs.core.chunk_rest(seq__65857_66325__$1);
var G__66328 = c__5525__auto___66326;
var G__66329 = cljs.core.count(c__5525__auto___66326);
var G__66330 = (0);
seq__65857_66308 = G__66327;
chunk__65858_66309 = G__66328;
count__65859_66310 = G__66329;
i__65860_66311 = G__66330;
continue;
} else {
var block_id_66331 = cljs.core.first(seq__65857_66325__$1);
var temp__5804__auto___66332__$1 = (function (){var G__65864 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66331], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65864) : frontend.db.entity.call(null,G__65864));
})();
if(cljs.core.truth_(temp__5804__auto___66332__$1)){
var block_66333 = temp__5804__auto___66332__$1;
var current_value_66334 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_66333));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_66334,value__$1)){
} else {
var block_66335__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66331,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_66335__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__66337 = cljs.core.next(seq__65857_66325__$1);
var G__66338 = null;
var G__66339 = (0);
var G__66340 = (0);
seq__65857_66308 = G__66337;
chunk__65858_66309 = G__66338;
count__65859_66310 = G__66339;
i__65860_66311 = G__66340;
continue;
}
} else {
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__65865_66341 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65866_66342 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65866_66342);

try{var seq__65867_66343 = cljs.core.seq(block_ids__$1);
var chunk__65868_66344 = null;
var count__65869_66345 = (0);
var i__65870_66346 = (0);
while(true){
if((i__65870_66346 < count__65869_66345)){
var block_id_66347 = chunk__65868_66344.cljs$core$IIndexed$_nth$arity$2(null,i__65870_66346);
var temp__5804__auto___66349 = (function (){var G__65873 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66347], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65873) : frontend.db.entity.call(null,G__65873));
})();
if(cljs.core.truth_(temp__5804__auto___66349)){
var block_66350 = temp__5804__auto___66349;
var current_value_66351 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_66350));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_66351,value__$1)){
} else {
var block_66352__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66347,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_66352__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__66353 = seq__65867_66343;
var G__66354 = chunk__65868_66344;
var G__66355 = count__65869_66345;
var G__66356 = (i__65870_66346 + (1));
seq__65867_66343 = G__66353;
chunk__65868_66344 = G__66354;
count__65869_66345 = G__66355;
i__65870_66346 = G__66356;
continue;
} else {
var temp__5804__auto___66357 = cljs.core.seq(seq__65867_66343);
if(temp__5804__auto___66357){
var seq__65867_66358__$1 = temp__5804__auto___66357;
if(cljs.core.chunked_seq_QMARK_(seq__65867_66358__$1)){
var c__5525__auto___66359 = cljs.core.chunk_first(seq__65867_66358__$1);
var G__66360 = cljs.core.chunk_rest(seq__65867_66358__$1);
var G__66361 = c__5525__auto___66359;
var G__66362 = cljs.core.count(c__5525__auto___66359);
var G__66363 = (0);
seq__65867_66343 = G__66360;
chunk__65868_66344 = G__66361;
count__65869_66345 = G__66362;
i__65870_66346 = G__66363;
continue;
} else {
var block_id_66364 = cljs.core.first(seq__65867_66358__$1);
var temp__5804__auto___66365__$1 = (function (){var G__65874 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66364], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65874) : frontend.db.entity.call(null,G__65874));
})();
if(cljs.core.truth_(temp__5804__auto___66365__$1)){
var block_66366 = temp__5804__auto___66365__$1;
var current_value_66367 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_66366));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_66367,value__$1)){
} else {
var block_66368__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_66364,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_66368__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__66369 = cljs.core.next(seq__65867_66358__$1);
var G__66370 = null;
var G__66371 = (0);
var G__66372 = (0);
seq__65867_66343 = G__66369;
chunk__65868_66344 = G__66370;
count__65869_66345 = G__66371;
i__65870_66346 = G__66372;
continue;
}
} else {
}
}
break;
}

var r__60296__auto___66373 = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto___66305){
if(cljs.core.seq(r__60296__auto___66373)){
logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto___66373,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null));
} else {
}
} else {
if(cljs.core.seq(r__60296__auto___66373)){
var request_id__60297__auto___66375 = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto___66376 = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto___66373,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto___66375,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto___66377 = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto___66375,request__60298__auto___66376) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto___66375,request__60298__auto___66376));
} else {
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65865_66341);
}}

var seq__65875 = cljs.core.seq(block_ids__$1);
var chunk__65876 = null;
var count__65877 = (0);
var i__65878 = (0);
while(true){
if((i__65878 < count__65877)){
var block_id = chunk__65876.cljs$core$IIndexed$_nth$arity$2(null,i__65878);
frontend.state.set_collapsed_block_BANG_(block_id,value__$1);


var G__66378 = seq__65875;
var G__66379 = chunk__65876;
var G__66380 = count__65877;
var G__66381 = (i__65878 + (1));
seq__65875 = G__66378;
chunk__65876 = G__66379;
count__65877 = G__66380;
i__65878 = G__66381;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__65875);
if(temp__5804__auto__){
var seq__65875__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__65875__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__65875__$1);
var G__66382 = cljs.core.chunk_rest(seq__65875__$1);
var G__66383 = c__5525__auto__;
var G__66384 = cljs.core.count(c__5525__auto__);
var G__66385 = (0);
seq__65875 = G__66382;
chunk__65876 = G__66383;
count__65877 = G__66384;
i__65878 = G__66385;
continue;
} else {
var block_id = cljs.core.first(seq__65875__$1);
frontend.state.set_collapsed_block_BANG_(block_id,value__$1);


var G__66386 = cljs.core.next(seq__65875__$1);
var G__66387 = null;
var G__66388 = (0);
var G__66389 = (0);
seq__65875 = G__66386;
chunk__65876 = G__66387;
count__65877 = G__66388;
i__65878 = G__66389;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
frontend.handler.editor.collapse_block_BANG_ = (function frontend$handler$editor$collapse_block_BANG_(block_id){
if(cljs.core.truth_(frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(block_id))){
if(cljs.core.truth_(frontend.handler.editor.skip_collapsing_in_db_QMARK_())){
} else {
frontend.handler.editor.set_blocks_collapsed_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),true);
}

return frontend.state.set_collapsed_block_BANG_(block_id,true);
} else {
return null;
}
});
frontend.handler.editor.expand_block_BANG_ = (function frontend$handler$editor$expand_block_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66390 = arguments.length;
var i__5727__auto___66391 = (0);
while(true){
if((i__5727__auto___66391 < len__5726__auto___66390)){
args__5732__auto__.push((arguments[i__5727__auto___66391]));

var G__66392 = (i__5727__auto___66391 + (1));
i__5727__auto___66391 = G__66392;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.expand_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.expand_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block_id,p__65881){
var map__65882 = p__65881;
var map__65882__$1 = cljs.core.__destructure_map(map__65882);
var skip_db_collpsing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65882__$1,new cljs.core.Keyword(null,"skip-db-collpsing?","skip-db-collpsing?",106617442));
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855),true], null)], 0))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = skip_db_collpsing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.editor.skip_collapsing_in_db_QMARK_();
}
})())?null:frontend.handler.editor.set_blocks_collapsed_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),false))),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.state.set_collapsed_block_BANG_(block_id,false));
}));
}));
}));
}));

(frontend.handler.editor.expand_block_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.expand_block_BANG_.cljs$lang$applyTo = (function (seq65879){
var G__65880 = cljs.core.first(seq65879);
var seq65879__$1 = cljs.core.next(seq65879);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65880,seq65879__$1);
}));

frontend.handler.editor.expand_BANG_ = (function frontend$handler$editor$expand_BANG_(var_args){
var G__65884 = arguments.length;
switch (G__65884) {
case 1:
return frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (e){
return frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$2(e,false);
}));

(frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (e,clear_selection_QMARK_){
frontend.util.stop(e);

if(frontend.state.editing_QMARK_()){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
return frontend.handler.editor.expand_block_BANG_(block_id);
} else {
return null;
}
} else {
if(frontend.state.selection_QMARK_()){
cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (dom){
return frontend.handler.editor.expand_block_BANG_(cljs.core.uuid(dommy.core.attr(dom,"blockid")));
}),frontend.handler.editor.get_selected_blocks()));

var and__5000__auto__ = clear_selection_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
} else {
return and__5000__auto__;
}
} else {
if(cljs.core.truth_(frontend.handler.editor.whiteboard_QMARK_())){
return frontend.state.active_tldraw_app().api.setCollapsed(false);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(cljs.core.PersistentArrayMap.EMPTY)),(function (blocks_with_level){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level","block/level",1182509971),blocks_with_level));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (99);
}
})()),(function (max_level){
return promesa.protocols._promise((function (){var level = (1);
while(true){
if((level > max_level)){
return null;
} else {
var blocks_to_expand = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.util.collapsed_QMARK_,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(((function (level){
return (function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(b),level);
});})(level))
,blocks_with_level));
if(cljs.core.empty_QMARK_(blocks_to_expand)){
var G__66394 = (level + (1));
level = G__66394;
continue;
} else {
var seq__65885 = cljs.core.seq(blocks_to_expand);
var chunk__65886 = null;
var count__65887 = (0);
var i__65888 = (0);
while(true){
if((i__65888 < count__65887)){
var map__65891 = chunk__65886.cljs$core$IIndexed$_nth$arity$2(null,i__65888);
var map__65891__$1 = cljs.core.__destructure_map(map__65891);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65891__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.expand_block_BANG_(uuid);


var G__66395 = seq__65885;
var G__66396 = chunk__65886;
var G__66397 = count__65887;
var G__66398 = (i__65888 + (1));
seq__65885 = G__66395;
chunk__65886 = G__66396;
count__65887 = G__66397;
i__65888 = G__66398;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__65885);
if(temp__5804__auto__){
var seq__65885__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__65885__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__65885__$1);
var G__66399 = cljs.core.chunk_rest(seq__65885__$1);
var G__66400 = c__5525__auto__;
var G__66401 = cljs.core.count(c__5525__auto__);
var G__66402 = (0);
seq__65885 = G__66399;
chunk__65886 = G__66400;
count__65887 = G__66401;
i__65888 = G__66402;
continue;
} else {
var map__65892 = cljs.core.first(seq__65885__$1);
var map__65892__$1 = cljs.core.__destructure_map(map__65892);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65892__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.expand_block_BANG_(uuid);


var G__66403 = cljs.core.next(seq__65885__$1);
var G__66404 = null;
var G__66405 = (0);
var G__66406 = (0);
seq__65885 = G__66403;
chunk__65886 = G__66404;
count__65887 = G__66405;
i__65888 = G__66406;
continue;
}
} else {
return null;
}
}
break;
}
}
}
break;
}
})());
}));
}));
}));

}
}
}
}));

(frontend.handler.editor.expand_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.collapse_BANG_ = (function frontend$handler$editor$collapse_BANG_(var_args){
var G__65894 = arguments.length;
switch (G__65894) {
case 1:
return frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (e){
return frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$2(e,false);
}));

(frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (e,clear_selection_QMARK_){
if(cljs.core.truth_(e)){
frontend.util.stop(e);
} else {
}

if(frontend.state.editing_QMARK_()){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
return frontend.handler.editor.collapse_block_BANG_(block_id);
} else {
return null;
}
} else {
if(frontend.state.selection_QMARK_()){
cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (dom){
return frontend.handler.editor.collapse_block_BANG_(cljs.core.uuid(dommy.core.attr(dom,"blockid")));
}),frontend.handler.editor.get_selected_blocks()));

var and__5000__auto__ = clear_selection_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
} else {
return and__5000__auto__;
}
} else {
if(cljs.core.truth_(frontend.handler.editor.whiteboard_QMARK_())){
return frontend.state.active_tldraw_app().api.setCollapsed(true);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks_with_level){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level","block/level",1182509971),blocks_with_level));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (99);
}
})()),(function (max_level){
return promesa.protocols._promise((function (){var level = max_level;
while(true){
if((level === (0))){
return null;
} else {
var blocks_to_collapse = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(((function (level){
return (function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
});})(level))
,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(((function (level){
return (function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(b),level);
});})(level))
,blocks_with_level));
if(cljs.core.empty_QMARK_(blocks_to_collapse)){
var G__66408 = (level - (1));
level = G__66408;
continue;
} else {
var seq__65895 = cljs.core.seq(blocks_to_collapse);
var chunk__65896 = null;
var count__65897 = (0);
var i__65898 = (0);
while(true){
if((i__65898 < count__65897)){
var map__65905 = chunk__65896.cljs$core$IIndexed$_nth$arity$2(null,i__65898);
var map__65905__$1 = cljs.core.__destructure_map(map__65905);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65905__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.collapse_block_BANG_(uuid);


var G__66409 = seq__65895;
var G__66410 = chunk__65896;
var G__66411 = count__65897;
var G__66412 = (i__65898 + (1));
seq__65895 = G__66409;
chunk__65896 = G__66410;
count__65897 = G__66411;
i__65898 = G__66412;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__65895);
if(temp__5804__auto__){
var seq__65895__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__65895__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__65895__$1);
var G__66413 = cljs.core.chunk_rest(seq__65895__$1);
var G__66414 = c__5525__auto__;
var G__66415 = cljs.core.count(c__5525__auto__);
var G__66416 = (0);
seq__65895 = G__66413;
chunk__65896 = G__66414;
count__65897 = G__66415;
i__65898 = G__66416;
continue;
} else {
var map__65906 = cljs.core.first(seq__65895__$1);
var map__65906__$1 = cljs.core.__destructure_map(map__65906);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65906__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.collapse_block_BANG_(uuid);


var G__66417 = cljs.core.next(seq__65895__$1);
var G__66418 = null;
var G__66419 = (0);
var G__66420 = (0);
seq__65895 = G__66417;
chunk__65896 = G__66418;
count__65897 = G__66419;
i__65898 = G__66420;
continue;
}
} else {
return null;
}
}
break;
}
}
}
break;
}
})());
}));
}));
}));

}
}
}
}));

(frontend.handler.editor.collapse_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.toggle_collapse_BANG_ = (function frontend$handler$editor$toggle_collapse_BANG_(var_args){
var G__65909 = arguments.length;
switch (G__65909) {
case 1:
return frontend.handler.editor.toggle_collapse_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.editor.toggle_collapse_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.toggle_collapse_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (e){
return frontend.handler.editor.toggle_collapse_BANG_.cljs$core$IFn$_invoke$arity$2(e,false);
}));

(frontend.handler.editor.toggle_collapse_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (e,clear_selection_QMARK_){
if(cljs.core.truth_(e)){
frontend.util.stop(e);
} else {
}

if(frontend.state.editing_QMARK_()){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var block__$1 = (function (){var G__65910 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65910) : frontend.db.entity.call(null,G__65910));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block__$1))){
return frontend.handler.editor.expand_BANG_.cljs$core$IFn$_invoke$arity$2(e,clear_selection_QMARK_);
} else {
return frontend.handler.editor.collapse_BANG_.cljs$core$IFn$_invoke$arity$2(e,clear_selection_QMARK_);
}
} else {
return null;
}
} else {
if(frontend.state.selection_QMARK_()){
var block_ids_66422 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65907_SHARP_){
return cljs.core.uuid(dommy.core.attr(p1__65907_SHARP_,"blockid"));
}),frontend.handler.editor.get_selected_blocks());
var first_block_id_66423 = cljs.core.first(block_ids_66422);
if(cljs.core.truth_(first_block_id_66423)){
var first_block_66424 = (function (){var G__65911 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_block_id_66423], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65911) : frontend.db.entity.call(null,G__65911));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(first_block_66424))){
var seq__65912_66425 = cljs.core.seq(block_ids_66422);
var chunk__65913_66426 = null;
var count__65914_66427 = (0);
var i__65915_66428 = (0);
while(true){
if((i__65915_66428 < count__65914_66427)){
var block_id_66429 = chunk__65913_66426.cljs$core$IIndexed$_nth$arity$2(null,i__65915_66428);
frontend.handler.editor.expand_block_BANG_(block_id_66429);


var G__66430 = seq__65912_66425;
var G__66431 = chunk__65913_66426;
var G__66432 = count__65914_66427;
var G__66433 = (i__65915_66428 + (1));
seq__65912_66425 = G__66430;
chunk__65913_66426 = G__66431;
count__65914_66427 = G__66432;
i__65915_66428 = G__66433;
continue;
} else {
var temp__5804__auto___66434 = cljs.core.seq(seq__65912_66425);
if(temp__5804__auto___66434){
var seq__65912_66435__$1 = temp__5804__auto___66434;
if(cljs.core.chunked_seq_QMARK_(seq__65912_66435__$1)){
var c__5525__auto___66436 = cljs.core.chunk_first(seq__65912_66435__$1);
var G__66437 = cljs.core.chunk_rest(seq__65912_66435__$1);
var G__66438 = c__5525__auto___66436;
var G__66439 = cljs.core.count(c__5525__auto___66436);
var G__66440 = (0);
seq__65912_66425 = G__66437;
chunk__65913_66426 = G__66438;
count__65914_66427 = G__66439;
i__65915_66428 = G__66440;
continue;
} else {
var block_id_66441 = cljs.core.first(seq__65912_66435__$1);
frontend.handler.editor.expand_block_BANG_(block_id_66441);


var G__66442 = cljs.core.next(seq__65912_66435__$1);
var G__66443 = null;
var G__66444 = (0);
var G__66445 = (0);
seq__65912_66425 = G__66442;
chunk__65913_66426 = G__66443;
count__65914_66427 = G__66444;
i__65915_66428 = G__66445;
continue;
}
} else {
}
}
break;
}
} else {
var seq__65921_66446 = cljs.core.seq(block_ids_66422);
var chunk__65922_66447 = null;
var count__65923_66448 = (0);
var i__65924_66449 = (0);
while(true){
if((i__65924_66449 < count__65923_66448)){
var block_id_66450 = chunk__65922_66447.cljs$core$IIndexed$_nth$arity$2(null,i__65924_66449);
frontend.handler.editor.collapse_block_BANG_(block_id_66450);


var G__66451 = seq__65921_66446;
var G__66452 = chunk__65922_66447;
var G__66453 = count__65923_66448;
var G__66454 = (i__65924_66449 + (1));
seq__65921_66446 = G__66451;
chunk__65922_66447 = G__66452;
count__65923_66448 = G__66453;
i__65924_66449 = G__66454;
continue;
} else {
var temp__5804__auto___66455 = cljs.core.seq(seq__65921_66446);
if(temp__5804__auto___66455){
var seq__65921_66456__$1 = temp__5804__auto___66455;
if(cljs.core.chunked_seq_QMARK_(seq__65921_66456__$1)){
var c__5525__auto___66457 = cljs.core.chunk_first(seq__65921_66456__$1);
var G__66458 = cljs.core.chunk_rest(seq__65921_66456__$1);
var G__66459 = c__5525__auto___66457;
var G__66460 = cljs.core.count(c__5525__auto___66457);
var G__66461 = (0);
seq__65921_66446 = G__66458;
chunk__65922_66447 = G__66459;
count__65923_66448 = G__66460;
i__65924_66449 = G__66461;
continue;
} else {
var block_id_66462 = cljs.core.first(seq__65921_66456__$1);
frontend.handler.editor.collapse_block_BANG_(block_id_66462);


var G__66463 = cljs.core.next(seq__65921_66456__$1);
var G__66464 = null;
var G__66465 = (0);
var G__66466 = (0);
seq__65921_66446 = G__66463;
chunk__65922_66447 = G__66464;
count__65923_66448 = G__66465;
i__65924_66449 = G__66466;
continue;
}
} else {
}
}
break;
}
}
} else {
}

var and__5000__auto__ = clear_selection_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
} else {
return and__5000__auto__;
}
} else {
if(cljs.core.truth_(frontend.handler.editor.whiteboard_QMARK_())){
return null;
} else {
return null;

}
}
}
}));

(frontend.handler.editor.toggle_collapse_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.collapse_all_BANG_ = (function frontend$handler$editor$collapse_all_BANG_(var_args){
var G__65927 = arguments.length;
switch (G__65927) {
case 0:
return frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 2:
return frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2(null,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,p__65928){
var map__65929 = p__65928;
var map__65929__$1 = cljs.core.__destructure_map(map__65929);
var collapse_self_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65929__$1,new cljs.core.Keyword(null,"collapse-self?","collapse-self?",1736127396),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),block_id], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65930 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
if(cljs.core.not(collapse_self_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([block_id]),G__65930);
} else {
return G__65930;
}
})()),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,true));
}));
}));
}));
}));

(frontend.handler.editor.collapse_all_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.expand_all_BANG_ = (function frontend$handler$editor$expand_all_BANG_(var_args){
var G__65932 = arguments.length;
switch (G__65932) {
case 0:
return frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),block_id], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks)),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,false));
}));
}));
}));
}));

(frontend.handler.editor.expand_all_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.editor.collapse_all_selection_BANG_ = (function frontend$handler$editor$collapse_all_selection_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65933_SHARP_){
return frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),p1__65933_SHARP_], null));
}),frontend.handler.editor.get_selected_toplevel_block_uuids()))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks))),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,true));
}));
}));
}));
});
frontend.handler.editor.expand_all_selection_BANG_ = (function frontend$handler$editor$expand_all_selection_BANG_(){
var blocks = promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65934_SHARP_){
return frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),p1__65934_SHARP_], null));
}),frontend.handler.editor.get_selected_toplevel_block_uuids()));
var block_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks));
return frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,false);
});
frontend.handler.editor.toggle_open_BANG_ = (function frontend$handler$editor$toggle_open_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.empty_QMARK_(blocks)),(function (all_expanded_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(all_expanded_QMARK_)?frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$0():frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$0()));
}));
}));
}));
});
frontend.handler.editor.toggle_open_block_children_BANG_ = (function frontend$handler$editor$toggle_open_block_children_BANG_(block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.empty_QMARK_(blocks)),(function (all_expanded_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(all_expanded_QMARK_)?frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapse-self?","collapse-self?",1736127396),false], null)):frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1(block_id)));
}));
}));
}));
});
frontend.handler.editor.select_all_blocks_BANG_ = (function frontend$handler$editor$select_all_blocks_BANG_(p__65935){
var map__65936 = p__65935;
var map__65936__$1 = cljs.core.__destructure_map(map__65936);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65936__$1,new cljs.core.Keyword(null,"page","page",849072397));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5802__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5802__auto__)){
var current_input_id = temp__5802__auto__;
var input = goog.dom.getElement(current_input_id);
var blocks_container = frontend.util.rec_get_blocks_container(input);
var blocks = dommy.utils.__GT_Array(blocks_container.getElementsByClassName("ls-block"));
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(blocks);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (b){
return frontend.util.get_blocks_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var or__5002__auto__ = (function (){var G__65938 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(b));
if((G__65938 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65938) : frontend.db.entity.call(null,G__65938));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
}),blocks)], 0))));
}));
}));
}
})()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","selected-all?","selection/selected-all?",208605839),true));
}));
}));
});
frontend.handler.editor.select_parent = (function frontend$handler$editor$select_parent(e){
var edit_input = (function (){var G__65939 = frontend.state.get_edit_input_id();
if((G__65939 == null)){
return null;
} else {
return goog.dom.getElement(G__65939);
}
})();
var edit_block = frontend.state.get_edit_block();
var target_element = e.target.nodeName;
if(cljs.core.truth_((function (){var and__5000__auto__ = edit_block;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = edit_input;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.get_selected_text(),edit_input.value);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.get_first_block_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block))], null));
} else {
if(cljs.core.truth_(edit_block)){
return null;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["INPUT",null,"TEXTAREA",null], null), null),target_element)){
return null;
} else {
if(cljs.core.truth_(frontend.handler.editor.whiteboard_QMARK_())){
frontend.util.stop(e);

return frontend.state.active_tldraw_app().api.selectAll();
} else {
frontend.util.stop(e);

if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("selection","selected-all?","selection/selected-all?",208605839).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
return null;
} else {
var temp__5802__auto__ = (function (){var G__65940 = cljs.core.first(frontend.state.get_selection_blocks());
var G__65940__$1 = (((G__65940 == null))?null:dommy.core.attr(G__65940,"blockid"));
if((G__65940__$1 == null)){
return null;
} else {
return cljs.core.uuid(G__65940__$1);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block_id = temp__5802__auto__;
var temp__5804__auto__ = (function (){var G__65941 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65941) : frontend.db.entity.call(null,G__65941));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_page(),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)))){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = parent;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(parent);
} else {
return and__5000__auto__;
}
})())){
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.get_first_block_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(parent))], null));
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(parent))){
return frontend.handler.editor.select_all_blocks_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(parent)], null));
} else {
return null;
}
}
}
} else {
return null;
}
} else {
return frontend.handler.editor.select_all_blocks_BANG_(cljs.core.PersistentArrayMap.EMPTY);
}
}

}
}
}
}
});
frontend.handler.editor.escape_editing = (function frontend$handler$editor$escape_editing(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66471 = arguments.length;
var i__5727__auto___66472 = (0);
while(true){
if((i__5727__auto___66472 < len__5726__auto___66471)){
args__5732__auto__.push((arguments[i__5727__auto___66472]));

var G__66474 = (i__5727__auto___66472 + (1));
i__5727__auto___66472 = G__66474;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic = (function (p__65943){
var map__65944 = p__65943;
var map__65944__$1 = cljs.core.__destructure_map(map__65944);
var select_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65944__$1,new cljs.core.Keyword(null,"select?","select?",-1012224063));
var save_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65944__$1,new cljs.core.Keyword(null,"save-block?","save-block?",-809783538),true);
var edit_block = frontend.state.get_edit_block();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(save_block_QMARK_)?frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0():null)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(select_QMARK_)?(function (){var temp__5804__auto__ = (function (){var G__65945 = frontend.state.get_input();
if((G__65945 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__65945,"ls-block");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [node], null));
} else {
return null;
}
})():((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(edit_block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block())))?frontend.state.clear_edit_BANG_():null)));
}));
}));
}));

(frontend.handler.editor.escape_editing.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.handler.editor.escape_editing.cljs$lang$applyTo = (function (seq65942){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq65942));
}));

frontend.handler.editor.replace_block_reference_with_content_at_point = (function frontend$handler$editor$replace_block_reference_with_content_at_point(){
var repo = frontend.state.get_current_repo();
var temp__5804__auto__ = frontend.util.thingatpt.block_ref_at_point();
if(cljs.core.truth_(temp__5804__auto__)){
var map__65946 = temp__5804__auto__;
var map__65946__$1 = cljs.core.__destructure_map(map__65946);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65946__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65946__$1,new cljs.core.Keyword(null,"end","end",-268185958));
var link = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65946__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var temp__5804__auto____$1 = (function (){var G__65947 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),link], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65947) : frontend.db.entity.call(null,G__65947));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var block = temp__5804__auto____$1;
var block_content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var block_content_without_prop = frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_properties_when_file_based(repo,format,block_content));
var temp__5804__auto____$2 = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto____$2)){
var input = temp__5804__auto____$2;
var temp__5804__auto____$3 = frontend.handler.editor.goog$module$goog$object.get(input,"value");
if(cljs.core.truth_(temp__5804__auto____$3)){
var current_block_content = temp__5804__auto____$3;
var block_content_STAR_ = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(current_block_content,(0),start),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_content_without_prop),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(current_block_content,end)].join('');
return frontend.state.set_block_content_and_last_pos_BANG_(input,block_content_STAR_,(1));
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
frontend.handler.editor.copy_current_ref = (function frontend$handler$editor$copy_current_ref(block_id){
if(cljs.core.truth_(block_id)){
return frontend.util.copy_to_clipboard_BANG_(frontend.util.ref.__GT_block_ref(block_id));
} else {
return null;
}
});
frontend.handler.editor.delete_current_ref_BANG_ = (function frontend$handler$editor$delete_current_ref_BANG_(block,ref_id){
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ref_id;
} else {
return and__5000__auto__;
}
})())){
var content = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?clojure.string.replace(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),(frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(ref_id) : frontend.util.ref.__GT_page_ref.call(null,ref_id)),""):(function (){var match = cljs.core.re_pattern(["\\s?",clojure.string.replace(frontend.util.ref.__GT_block_ref(ref_id),/([\(\)])/,"\\$1")].join(''));
return clojure.string.replace(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),match,"");
})());
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),content);
} else {
return null;
}
});
frontend.handler.editor.replace_ref_with_text_BANG_ = (function frontend$handler$editor$replace_ref_with_text_BANG_(block,ref_id){
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ref_id;
} else {
return and__5000__auto__;
}
})())){
var repo = frontend.state.get_current_repo();
var match = frontend.util.ref.__GT_block_ref(ref_id);
var ref_block = (function (){var G__65948 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),ref_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65948) : frontend.db.entity.call(null,G__65948));
})();
var block_ref_content = frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_built_in_properties_when_file_based(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(ref_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref_block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()));
var content = clojure.string.replace_first(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),match,block_ref_content);
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),content);
} else {
return null;
}
});
frontend.handler.editor.replace_ref_with_embed_BANG_ = (function frontend$handler$editor$replace_ref_with_embed_BANG_(block,ref_id){
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ref_id;
} else {
return and__5000__auto__;
}
})())){
var match = frontend.util.ref.__GT_block_ref(ref_id);
var content = clojure.string.replace_first(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),match,(function (){var G__65949 = "{{embed ((%s))}}";
var G__65950 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(ref_id);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__65949,G__65950) : frontend.util.format.call(null,G__65949,G__65950));
})());
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),content);
} else {
return null;
}
});
/**
 * Whether a block should be collapsed by default.
 *   Currently, this handles all the kinds of views.
 */
frontend.handler.editor.block_default_collapsed_QMARK_ = (function frontend$handler$editor$block_default_collapsed_QMARK_(block,config){
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__65951 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65951) : frontend.db.entity.call(null,G__65951));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var or__5002__auto__ = frontend.util.collapsed_QMARK_(block__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = (function (){var or__5002__auto____$1 = new cljs.core.Keyword(null,"list-view?","list-view?",499477951).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (function (){var or__5002__auto____$1 = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725).cljs$core$IFn$_invoke$arity$1(block__$1);
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
return ((cljs.core.integer_QMARK_(new cljs.core.Keyword(null,"block-level","block-level",390971879).cljs$core$IFn$_invoke$arity$1(config))) && ((new cljs.core.Keyword(null,"block-level","block-level",390971879).cljs$core$IFn$_invoke$arity$1(config) >= frontend.state.get_ref_open_blocks_level())));
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
var and__5000__auto__ = (function (){var or__5002__auto____$2 = new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"popup?","popup?",-266197002).cljs$core$IFn$_invoke$arity$1(config);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto____$2 = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.page_QMARK_.call(null,block__$1));
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config);
}
} else {
return and__5000__auto__;
}
}
}
});
frontend.handler.editor.batch_set_heading_BANG_ = (function frontend$handler$editor$batch_set_heading_BANG_(block_ids,heading){
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.db_based.editor.batch_set_heading_BANG_(repo,block_ids,heading);
} else {
return frontend.handler.file_based.editor.batch_set_heading_BANG_(block_ids,heading);
}
});
frontend.handler.editor.set_heading_BANG_ = (function frontend$handler$editor$set_heading_BANG_(block_id,heading){
return frontend.handler.editor.batch_set_heading_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),heading);
});
frontend.handler.editor.remove_heading_BANG_ = (function frontend$handler$editor$remove_heading_BANG_(block_id){
return frontend.handler.editor.set_heading_BANG_(block_id,null);
});
frontend.handler.editor.batch_remove_heading_BANG_ = (function frontend$handler$editor$batch_remove_heading_BANG_(block_ids){
return frontend.handler.editor.batch_set_heading_BANG_(block_ids,null);
});
/**
 * Set block or page name to the given event's dataTransfer. Used in dnd.
 */
frontend.handler.editor.block__GT_data_transfer_BANG_ = (function frontend$handler$editor$block__GT_data_transfer_BANG_(block_or_page_name,event,page_QMARK_){
return frontend.handler.editor.goog$module$goog$object.get(event,"dataTransfer").setData((cljs.core.truth_(page_QMARK_)?"page-name":"block-uuid"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_or_page_name));
});
frontend.handler.editor.run_query_command_BANG_ = (function frontend$handler$editor$run_query_command_BANG_(){
var repo = frontend.state.get_current_repo();
var temp__5804__auto__ = (function (){var G__65952 = frontend.state.get_edit_block();
var G__65952__$1 = (((G__65952 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__65952));
if((G__65952__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65952__$1) : frontend.db.entity.call(null,G__65952__$1));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_edit_BANG_()),(function (___40947__auto____$1){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),"")),(function (___40947__auto____$2){
return promesa.protocols._promise(new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1((function (){var G__65953 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65953) : frontend.db.entity.call(null,G__65953));
})()));
}));
}));
}
})()),(function (query_block){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__65954 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__65954) : frontend.db.entity.call(null,G__65954));
})())),(function (current_query){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));

frontend.handler.editor.save_block_inner_BANG_(block,"",cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(query_block)){
return frontend.handler.editor.save_block_inner_BANG_(query_block,current_query,cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__65955 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__65956 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__65956);

try{frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));

frontend.handler.editor.save_block_inner_BANG_(block,"",cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(query_block)){
frontend.handler.editor.save_block_inner_BANG_(query_block,current_query,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__65955);
}}
})());
})));
}));
}));
})));
}));
}));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.editor.js.map
