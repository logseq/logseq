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
var len__5726__auto___104718 = arguments.length;
var i__5727__auto___104719 = (0);
while(true){
if((i__5727__auto___104719 < len__5726__auto___104718)){
args__5732__auto__.push((arguments[i__5727__auto___104719]));

var G__104720 = (i__5727__auto___104719 + (1));
i__5727__auto___104719 = G__104720;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,p__103998){
var map__103999 = p__103998;
var map__103999__$1 = cljs.core.__destructure_map(map__103999);
var opts = map__103999__$1;
return frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}));

(frontend.handler.editor.outliner_save_block_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.outliner_save_block_BANG_.cljs$lang$applyTo = (function (seq103996){
var G__103997 = cljs.core.first(seq103996);
var seq103996__$1 = cljs.core.next(seq103996);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__103997,seq103996__$1);
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
var temp__5804__auto__ = (function (){var G__104001 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104001) : frontend.db.entity.call(null,G__104001));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block__$1 = temp__5804__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.get_block_own_order_list_type(block__$1),"number");
} else {
return null;
}
});
frontend.handler.editor.make_block_as_own_order_list_BANG_ = (function frontend$handler$editor$make_block_as_own_order_list_BANG_(block){
var G__104002 = block;
if((G__104002 == null)){
return null;
} else {
return frontend.handler.editor.set_block_own_order_list_type_BANG_(G__104002,"number");
}
});
frontend.handler.editor.toggle_blocks_as_own_order_list_BANG_ = (function frontend$handler$editor$toggle_blocks_as_own_order_list_BANG_(blocks){
if(cljs.core.seq(blocks)){
var has_ordered_QMARK_ = cljs.core.some(frontend.handler.editor.own_order_number_list_QMARK_,blocks);
var blocks_uuids = (function (){var G__104003 = blocks;
var G__104003__$1 = (((G__104003 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),G__104003));
if((G__104003__$1 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__104003__$1);
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
var selection_start__$1 = (selection_start + cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__104004_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",p1__104004_SHARP_);
}),selection)));
var selection_end__$1 = (selection_end - cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__104005_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",p1__104005_SHARP_);
}),cljs.core.reverse(selection))));
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"selection-start","selection-start",-888859581),selection_start__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835),selection_end__$1,new cljs.core.Keyword(null,"selection","selection",975998651),(function (){var G__104006 = selection;
if((G__104006 == null)){
return null;
} else {
return clojure.string.trim(G__104006);
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
var map__104014 = m;
var map__104014__$1 = cljs.core.__destructure_map(map__104014);
var selection_start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"selection-start","selection-start",-888859581));
var selection_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"value","value",305978217));
var edit_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"edit-id","edit-id",-639876554));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104014__$1,new cljs.core.Keyword(null,"input","input",556931961));
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
var inner_value = (function (){var G__104015 = selection;
if((!(already_wrapped_QMARK_))){
return (function (p1__104011_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern),cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__104011_SHARP_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern)].join('');
})(G__104015);
} else {
return G__104015;
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
var G__104018 = arguments.length;
switch (G__104018) {
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
var map__104019 = m;
var map__104019__$1 = cljs.core.__destructure_map(map__104019);
var selection_start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"selection-start","selection-start",-888859581));
var selection_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"value","value",305978217));
var edit_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"edit-id","edit-id",-639876554));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104019__$1,new cljs.core.Keyword(null,"input","input",556931961));
var empty_selection_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selection_start,selection_end);
var selection_link_QMARK_ = (function (){var and__5000__auto__ = selection;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.graph_parser.mldoc.mldoc_link_QMARK_(format,selection);
} else {
return and__5000__auto__;
}
})();
var vec__104020 = ((empty_selection_QMARK_)?frontend.config.get_empty_link_and_forward_pos(format):(cljs.core.truth_((function (){var and__5000__auto__ = text;
if(cljs.core.truth_(and__5000__auto__)){
return selection_link_QMARK_;
} else {
return and__5000__auto__;
}
})())?frontend.config.with_label_link(format,text,selection):(cljs.core.truth_(text)?frontend.config.with_label_link(format,selection,text):(cljs.core.truth_(selection_link_QMARK_)?frontend.config.with_default_link(format,selection):frontend.config.with_default_label(format,selection)
))));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104020,(0),null);
var forward_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104020,(1),null);
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
var temp__5804__auto__ = (function (){var G__104023 = ((typeof block_id === 'number')?block_id:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null));
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104023) : frontend.db.entity.call(null,G__104023));
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
var seq__104024 = cljs.core.seq(blocks);
var chunk__104025 = null;
var count__104026 = (0);
var i__104027 = (0);
while(true){
if((i__104027 < count__104026)){
var block = chunk__104025.cljs$core$IIndexed$_nth$arity$2(null,i__104027);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(block,"block-highlight");


var G__104730 = seq__104024;
var G__104731 = chunk__104025;
var G__104732 = count__104026;
var G__104733 = (i__104027 + (1));
seq__104024 = G__104730;
chunk__104025 = G__104731;
count__104026 = G__104732;
i__104027 = G__104733;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104024);
if(temp__5804__auto__){
var seq__104024__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104024__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104024__$1);
var G__104734 = cljs.core.chunk_rest(seq__104024__$1);
var G__104735 = c__5525__auto__;
var G__104736 = cljs.core.count(c__5525__auto__);
var G__104737 = (0);
seq__104024 = G__104734;
chunk__104025 = G__104735;
count__104026 = G__104736;
i__104027 = G__104737;
continue;
} else {
var block = cljs.core.first(seq__104024__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(block,"block-highlight");


var G__104738 = cljs.core.next(seq__104024__$1);
var G__104739 = null;
var G__104740 = (0);
var G__104741 = (0);
seq__104024 = G__104738;
chunk__104025 = G__104739;
count__104026 = G__104740;
i__104027 = G__104741;
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
var blocks = (function (){var G__104028 = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.getElementsByClassName("block-highlight"));
var G__104028__$1 = (((G__104028 == null))?null:cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((2),G__104028));
if((G__104028__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,G__104028__$1);
}
})();
var seq__104029 = cljs.core.seq(blocks);
var chunk__104030 = null;
var count__104031 = (0);
var i__104032 = (0);
while(true){
if((i__104032 < count__104031)){
var block = chunk__104030.cljs$core$IIndexed$_nth$arity$2(null,i__104032);
goog.dom.classes.remove(block,"block-highlight");


var G__104743 = seq__104029;
var G__104744 = chunk__104030;
var G__104745 = count__104031;
var G__104746 = (i__104032 + (1));
seq__104029 = G__104743;
chunk__104030 = G__104744;
count__104031 = G__104745;
i__104032 = G__104746;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104029);
if(temp__5804__auto__){
var seq__104029__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104029__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104029__$1);
var G__104747 = cljs.core.chunk_rest(seq__104029__$1);
var G__104748 = c__5525__auto__;
var G__104749 = cljs.core.count(c__5525__auto__);
var G__104750 = (0);
seq__104029 = G__104747;
chunk__104030 = G__104748;
count__104031 = G__104749;
i__104032 = G__104750;
continue;
} else {
var block = cljs.core.first(seq__104029__$1);
goog.dom.classes.remove(block,"block-highlight");


var G__104751 = cljs.core.next(seq__104029__$1);
var G__104752 = null;
var G__104753 = (0);
var G__104754 = (0);
seq__104029 = G__104751;
chunk__104030 = G__104752;
count__104031 = G__104753;
i__104032 = G__104754;
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
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.handler.editor.outliner_save_block_BANG_(block_SINGLEQUOTE_);
} else {
var _STAR_outliner_ops_STAR__orig_val__104038 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104039 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104039);

try{frontend.handler.editor.outliner_save_block_BANG_(block_SINGLEQUOTE_);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),opts_SINGLEQUOTE_);
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts_SINGLEQUOTE_,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104038);
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
var G__104046 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104046) : frontend.db.entity.call(null,G__104046));
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
frontend.handler.editor.save_block_if_changed_BANG_ = (function frontend$handler$editor$save_block_if_changed_BANG_(var_args){
var G__104048 = arguments.length;
switch (G__104048) {
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

(frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (block,value,p__104049){
var map__104050 = p__104049;
var map__104050__$1 = cljs.core.__destructure_map(map__104050);
var opts = map__104050__$1;
var force_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104050__$1,new cljs.core.Keyword(null,"force?","force?",1839038675));
var map__104051 = block;
var map__104051__$1 = cljs.core.__destructure_map(map__104051);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104051__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104051__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104051__$1,new cljs.core.Keyword("block","repo","block/repo",2119209932));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104051__$1,new cljs.core.Keyword("block","title","block/title",710445684));
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
var content = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo__$1))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__104052 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104052) : frontend.db.entity.call(null,G__104052));
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
frontend.handler.editor.outliner_insert_block_BANG_ = (function frontend$handler$editor$outliner_insert_block_BANG_(config,current_block,new_block,p__104053){
var map__104054 = p__104053;
var map__104054__$1 = cljs.core.__destructure_map(map__104054);
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104054__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104054__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var ordered_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104054__$1,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104054__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
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
var has_children_QMARK_ = (function (){var G__104055 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__104055) : frontend.db.has_children_QMARK_.call(null,G__104055));
})();
var sibling_QMARK___$1 = (cljs.core.truth_(ref_query_top_block_QMARK_)?false:((cljs.core.boolean_QMARK_(sibling_QMARK_))?sibling_QMARK_:(cljs.core.truth_(frontend.util.collapsed_QMARK_(current_block))?true:cljs.core.not(has_children_QMARK_)
)));
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var G__104056_104760 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block], null);
(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(G__104056_104760) : frontend.handler.editor.save_current_block_BANG_.call(null,G__104056_104760));

return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),current_block,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));
} else {
var _STAR_outliner_ops_STAR__orig_val__104057 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104058 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104058);

try{var G__104059_104761 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block], null);
(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1(G__104059_104761) : frontend.handler.editor.save_current_block_BANG_.call(null,G__104059_104761));

frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),current_block,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104057);
}}
});
frontend.handler.editor.block_self_alone_when_insert_QMARK_ = (function frontend$handler$editor$block_self_alone_when_insert_QMARK_(config,uuid){
var current_page = frontend.state.get_current_page();
var block_id = (function (){var or__5002__auto__ = (function (){var G__104060 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if((G__104060 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__104060);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__104061 = current_page;
if((G__104061 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__104061);
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
var block_SINGLEQUOTE_ = (function (){var G__104063 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104063) : frontend.db.entity.call(null,G__104063));
})();
var left_or_parent = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(block_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
}
})();
if(input_text_selected_QMARK_){
var selection_start_104764 = frontend.util.get_selection_start(input);
var selection_end_104765 = frontend.util.get_selection_end(input);
var vec__104065_104766 = frontend.handler.editor.compute_fst_snd_block_text(value,selection_start_104764,selection_end_104765);
var __104767 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104065_104766,(0),null);
var new_content_104768 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104065_104766,(1),null);
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(edit_input_id,new_content_104768);
} else {
}

var sibling_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left_or_parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)));
var result = frontend.handler.editor.outliner_insert_block_BANG_(config,left_or_parent,prev_block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [result,sibling_QMARK_,prev_block], null);
});
frontend.handler.editor.insert_new_block_aux_BANG_ = (function frontend$handler$editor$insert_new_block_aux_BANG_(config,p__104068,value){
var map__104069 = p__104068;
var map__104069__$1 = cljs.core.__destructure_map(map__104069);
var block = map__104069__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104069__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var block_self_QMARK_ = frontend.handler.editor.block_self_alone_when_insert_QMARK_(config,uuid);
var input = goog.dom.getElement(frontend.state.get_edit_input_id());
var selection_start = frontend.util.get_selection_start(input);
var selection_end = frontend.util.get_selection_end(input);
var vec__104070 = frontend.handler.editor.compute_fst_snd_block_text(value,selection_start,selection_end);
var fst_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104070,(0),null);
var snd_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104070,(1),null);
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
var vec__104073 = frontend.state.get_editor_args();
var map__104076 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104073,(0),null);
var map__104076__$1 = cljs.core.__destructure_map(map__104076);
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var block_parent_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104076__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104073,(1),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104073,(2),null);
var node = goog.dom.getElement(id);
if(cljs.core.truth_(node)){
var value = frontend.handler.editor.goog$module$goog$object.get(node,"value");
var pos = frontend.util.get_selection_start(node);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"pos","pos",-864607220),new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"block-container","block-container",-15068235),new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550)],[format,(function (){var or__5002__auto__ = (function (){var G__104077 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104077) : frontend.db.entity.call(null,G__104077));
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
var G__104078 = dommy.core.attr(node,"containerid");
if((G__104078 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__104078);
}
});
frontend.handler.editor.get_node_parent = (function frontend$handler$editor$get_node_parent(node){
var G__104079 = frontend.handler.editor.goog$module$goog$object.get(node,"parentNode");
if((G__104079 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__104079,"ls-block");
}
});
frontend.handler.editor.get_new_container_id = (function frontend$handler$editor$get_new_container_id(op,data){
var map__104080 = frontend.handler.editor.get_state();
var map__104080__$1 = cljs.core.__destructure_map(map__104080);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104080__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104080__$1,new cljs.core.Keyword(null,"block-container","block-container",-15068235));
if(cljs.core.truth_(block)){
var node = block_container;
var linked_QMARK_ = (!((dommy.core.attr(node,"originalblockid") == null)));
var G__104081 = op;
var G__104081__$1 = (((G__104081 instanceof cljs.core.Keyword))?G__104081.fqn:null);
switch (G__104081__$1) {
case "insert":
if(((linked_QMARK_) && ((!(new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060).cljs$core$IFn$_invoke$arity$1(data) === false))))){
var G__104082 = frontend.util.rec_get_node(node,"blocks-container");
if((G__104082 == null)){
return null;
} else {
return frontend.handler.editor.get_node_container_id(G__104082);
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
var temp__5804__auto__ = (function (){var G__104083 = frontend.handler.editor.goog$module$goog$object.get(node,"parentNode");
if((G__104083 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__104083,"ls-block");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
if(cljs.core.truth_(dommy.core.attr(parent,"originalblockid"))){
var G__104084 = frontend.util.rec_get_node(parent,"blocks-container");
if((G__104084 == null)){
return null;
} else {
return frontend.handler.editor.get_node_container_id(G__104084);
}
} else {
return null;
}
} else {
return null;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104081__$1)].join('')));

}
} else {
return null;
}
});
/**
 * Won't save previous block content - remember to save!
 */
frontend.handler.editor.insert_new_block_BANG_ = (function frontend$handler$editor$insert_new_block_BANG_(var_args){
var G__104086 = arguments.length;
switch (G__104086) {
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

var map__104087 = state;
var map__104087__$1 = cljs.core.__destructure_map(map__104087);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104087__$1,new cljs.core.Keyword(null,"block","block",664686210));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104087__$1,new cljs.core.Keyword(null,"value","value",305978217));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104087__$1,new cljs.core.Keyword(null,"config","config",994861415));
var value__$1 = ((typeof block_value === 'string')?block_value:value);
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var block_self_QMARK_ = frontend.handler.editor.block_self_alone_when_insert_QMARK_(config,block_id);
var input_id = frontend.state.get_edit_input_id();
var input = goog.dom.getElement(input_id);
var selection_start = frontend.util.get_selection_start(input);
var selection_end = frontend.util.get_selection_end(input);
var vec__104088 = frontend.handler.editor.compute_fst_snd_block_text(value__$1,selection_start,selection_end);
var fst_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104088,(0),null);
var snd_block_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104088,(1),null);
var insert_above_QMARK_ = ((clojure.string.blank_QMARK_(fst_block_text)) && ((!(clojure.string.blank_QMARK_(snd_block_text)))));
var block_SINGLEQUOTE_ = (function (){var or__5002__auto__ = (function (){var G__104094 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104094) : frontend.db.entity.call(null,G__104094));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var original_block = new cljs.core.Keyword(null,"original-block","original-block",1808045862).cljs$core$IFn$_invoke$arity$1(config);
var block_SINGLEQUOTE__SINGLEQUOTE_ = (function (){var or__5002__auto__ = (cljs.core.truth_(original_block)?(function (){var e = (function (){var G__104095 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104095) : frontend.db.entity.call(null,G__104095));
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
var vec__104091 = (insert_fn.cljs$core$IFn$_invoke$arity$3 ? insert_fn.cljs$core$IFn$_invoke$arity$3(config,block_SINGLEQUOTE__SINGLEQUOTE_,value__$1) : insert_fn.call(null,config,block_SINGLEQUOTE__SINGLEQUOTE_,value__$1));
var result_promise = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104091,(0),null);
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104091,(1),null);
var next_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104091,(2),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(result_promise),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.clear_when_saved_BANG_()),(function (___41611__auto____$1){
return promesa.protocols._promise((function (){var next_block_SINGLEQUOTE_ = (function (){var G__104096 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(next_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104096) : frontend.db.entity.call(null,G__104096));
})();
var pos = (0);
var unsaved_chars = cljs.core.deref(new cljs.core.Keyword("editor","async-unsaved-chars","editor/async-unsaved-chars",-1944055395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var container_id = frontend.handler.editor.get_new_container_id(new cljs.core.Keyword(null,"insert","insert",1286475395),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_], null));
var G__104097 = next_block_SINGLEQUOTE_;
var G__104098 = (pos + cljs.core.count(unsaved_chars));
var G__104099 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(unsaved_chars),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(next_block_SINGLEQUOTE_))].join('')], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__104097,G__104098,G__104099) : frontend.handler.editor.edit_block_BANG_.call(null,G__104097,G__104098,G__104099));
})());
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

frontend.handler.editor.api_insert_new_block_BANG_ = (function frontend$handler$editor$api_insert_new_block_BANG_(content,p__104100){
var map__104101 = p__104100;
var map__104101__$1 = cljs.core.__destructure_map(map__104101);
var custom_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430));
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104101__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var other_attrs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"other-attrs","other-attrs",-951608726));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"page","page",849072397));
var before_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104101__$1,new cljs.core.Keyword(null,"before?","before?",765621039),false);
var edit_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104101__$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true);
var ordered_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104101__$1,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082));
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
var block = (cljs.core.truth_(page)?(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page)):(function (){var G__104114 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104114) : frontend.db.entity.call(null,G__104114));
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
var or__5002__auto____$1 = (function (){var G__104118 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__104118) : frontend.db.get_page_format.call(null,G__104118));
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
}
})();
var content__$1 = (((((!(db_based_QMARK_))) && (cljs.core.seq(properties))))?frontend.handler.property.file.insert_properties_when_file_based(repo,format,content,properties):content);
var new_block = (function (){var G__104119 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108)], null)),new cljs.core.Keyword("block","title","block/title",710445684),content__$1);
if((!(db_based_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__104119,new cljs.core.Keyword("block","format","block/format",-1212045901),format);
} else {
return G__104119;
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
var vec__104115 = (cljs.core.truth_(before_QMARK___$1)?(function (){var left_or_parent = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
}
})();
var sibling_QMARK___$3 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left_or_parent)))?false:sibling_QMARK___$2);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [left_or_parent,sibling_QMARK___$3], null);
})():((sibling_QMARK___$2)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__104120 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104120) : frontend.db.entity.call(null,G__104120));
})(),sibling_QMARK___$2], null):(cljs.core.truth_(last_block)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [last_block,true], null):(cljs.core.truth_(block)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__104121 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104121) : frontend.db.entity.call(null,G__104121));
})(),sibling_QMARK___$2], null):null
))));
var block_m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104115,(0),null);
var sibling_QMARK___$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104115,(1),null);
if(cljs.core.truth_(block_m)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
frontend.handler.editor.outliner_insert_block_BANG_(cljs.core.PersistentArrayMap.EMPTY,block_m,new_block__$3,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$3,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

if(((db_based_QMARK_) && (cljs.core.seq(properties)))){
return frontend.handler.property.set_block_properties_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3),properties);
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__104122 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104123 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104123);

try{frontend.handler.editor.outliner_insert_block_BANG_(cljs.core.PersistentArrayMap.EMPTY,block_m,new_block__$3,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$3,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),ordered_list_QMARK_,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_], null));

if(((db_based_QMARK_) && (cljs.core.seq(properties)))){
frontend.handler.property.set_block_properties_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3),properties);
} else {
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104122);
}}
})()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(edit_block_QMARK_)?(cljs.core.truth_((function (){var and__5000__auto__ = replace_empty_target_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(last_block));
} else {
return and__5000__auto__;
}
})())?(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(last_block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,last_block,new cljs.core.Keyword(null,"max","max",61366548))):(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(new_block__$3,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,new_block__$3,new cljs.core.Keyword(null,"max","max",61366548)))):null)),(function (___41611__auto____$1){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_block__$3);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__104124 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104124) : frontend.db.entity.call(null,G__104124));
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
var G__104125 = frontend.state.get_current_repo();
var G__104126 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2(G__104125,G__104126) : frontend.db.page_empty_QMARK_.call(null,G__104125,G__104126));
}
})())){
var new_block = (function (){var G__104127 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),""], null);
if((!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__104127,new cljs.core.Keyword("block","format","block/format",-1212045901),cljs.core.get.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
} else {
return G__104127;
}
})();
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));
} else {
var _STAR_outliner_ops_STAR__orig_val__104128 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104129 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104129);

try{frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104128);
}}
} else {
return null;
}
} else {
return null;
}
}
});
frontend.handler.editor.check = (function frontend$handler$editor$check(p__104130){
var map__104131 = p__104130;
var map__104131__$1 = cljs.core.__destructure_map(map__104131);
var block = map__104131__$1;
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104131__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104131__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var repeated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104131__$1,new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104131__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
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
frontend.handler.editor.uncheck = (function frontend$handler$editor$uncheck(p__104132){
var map__104133 = p__104132;
var map__104133__$1 = cljs.core.__destructure_map(map__104133);
var block = map__104133__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104133__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104133__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
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
var G__104135 = arguments.length;
switch (G__104135) {
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

(frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$2 = (function (p__104136,new_marker){
var map__104137 = p__104136;
var map__104137__$1 = cljs.core.__destructure_map(map__104137);
var block = map__104137__$1;
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104137__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104137__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104137__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var vec__104138 = frontend.handler.file_based.status.cycle_marker(title,marker,new_marker,format,frontend.state.get_preferred_workflow());
var new_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104138,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104138,(1),null);
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
var status_value = (cljs.core.truth_((function (){var G__104141 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)));
var G__104142 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__104141,G__104142) : logseq.db.class_instance_QMARK_.call(null,G__104141,G__104142));
})())?new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853).cljs$core$IFn$_invoke$arity$1(block):cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),cljs.core.PersistentArrayMap.EMPTY));
var next_status = (function (){var G__104143 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(status_value);
var G__104143__$1 = (((G__104143 instanceof cljs.core.Keyword))?G__104143.fqn:null);
switch (G__104143__$1) {
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
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104144_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__104144_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return cljs.core.uuid(id);
} else {
return null;
}
}),blocks)));
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__104145 = cljs.core.seq(ids);
var chunk__104146 = null;
var count__104147 = (0);
var i__104148 = (0);
while(true){
if((i__104148 < count__104147)){
var id = chunk__104146.cljs$core$IIndexed$_nth$arity$2(null,i__104148);
var temp__5804__auto___104790__$1 = (function (){var G__104151 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104151) : frontend.db.entity.call(null,G__104151));
})();
if(cljs.core.truth_(temp__5804__auto___104790__$1)){
var block_104791 = temp__5804__auto___104790__$1;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_104791);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_104791);
}
} else {
}


var G__104792 = seq__104145;
var G__104793 = chunk__104146;
var G__104794 = count__104147;
var G__104795 = (i__104148 + (1));
seq__104145 = G__104792;
chunk__104146 = G__104793;
count__104147 = G__104794;
i__104148 = G__104795;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__104145);
if(temp__5804__auto____$1){
var seq__104145__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__104145__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104145__$1);
var G__104796 = cljs.core.chunk_rest(seq__104145__$1);
var G__104797 = c__5525__auto__;
var G__104798 = cljs.core.count(c__5525__auto__);
var G__104799 = (0);
seq__104145 = G__104796;
chunk__104146 = G__104797;
count__104147 = G__104798;
i__104148 = G__104799;
continue;
} else {
var id = cljs.core.first(seq__104145__$1);
var temp__5804__auto___104807__$2 = (function (){var G__104152 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104152) : frontend.db.entity.call(null,G__104152));
})();
if(cljs.core.truth_(temp__5804__auto___104807__$2)){
var block_104808 = temp__5804__auto___104807__$2;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_104808);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_104808);
}
} else {
}


var G__104809 = cljs.core.next(seq__104145__$1);
var G__104810 = null;
var G__104811 = (0);
var G__104812 = (0);
seq__104145 = G__104809;
chunk__104146 = G__104810;
count__104147 = G__104811;
i__104148 = G__104812;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__104153 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104154 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104154);

try{var seq__104155_104813 = cljs.core.seq(ids);
var chunk__104156_104814 = null;
var count__104157_104815 = (0);
var i__104158_104816 = (0);
while(true){
if((i__104158_104816 < count__104157_104815)){
var id_104817 = chunk__104156_104814.cljs$core$IIndexed$_nth$arity$2(null,i__104158_104816);
var temp__5804__auto___104818__$1 = (function (){var G__104161 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_104817], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104161) : frontend.db.entity.call(null,G__104161));
})();
if(cljs.core.truth_(temp__5804__auto___104818__$1)){
var block_104827 = temp__5804__auto___104818__$1;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_104827);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_104827);
}
} else {
}


var G__104828 = seq__104155_104813;
var G__104829 = chunk__104156_104814;
var G__104830 = count__104157_104815;
var G__104831 = (i__104158_104816 + (1));
seq__104155_104813 = G__104828;
chunk__104156_104814 = G__104829;
count__104157_104815 = G__104830;
i__104158_104816 = G__104831;
continue;
} else {
var temp__5804__auto___104836__$1 = cljs.core.seq(seq__104155_104813);
if(temp__5804__auto___104836__$1){
var seq__104155_104865__$1 = temp__5804__auto___104836__$1;
if(cljs.core.chunked_seq_QMARK_(seq__104155_104865__$1)){
var c__5525__auto___104875 = cljs.core.chunk_first(seq__104155_104865__$1);
var G__104876 = cljs.core.chunk_rest(seq__104155_104865__$1);
var G__104877 = c__5525__auto___104875;
var G__104878 = cljs.core.count(c__5525__auto___104875);
var G__104879 = (0);
seq__104155_104813 = G__104876;
chunk__104156_104814 = G__104877;
count__104157_104815 = G__104878;
i__104158_104816 = G__104879;
continue;
} else {
var id_104880 = cljs.core.first(seq__104155_104865__$1);
var temp__5804__auto___104881__$2 = (function (){var G__104162 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_104880], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104162) : frontend.db.entity.call(null,G__104162));
})();
if(cljs.core.truth_(temp__5804__auto___104881__$2)){
var block_104882 = temp__5804__auto___104881__$2;
if(db_based_QMARK_){
frontend.handler.editor.db_based_cycle_todo_BANG_(block_104882);
} else {
frontend.handler.editor.file_based_cycle_todo_BANG_(block_104882);
}
} else {
}


var G__104883 = cljs.core.next(seq__104155_104865__$1);
var G__104884 = null;
var G__104885 = (0);
var G__104886 = (0);
seq__104155_104813 = G__104883;
chunk__104156_104814 = G__104884;
count__104157_104815 = G__104885;
i__104158_104816 = G__104886;
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
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104153);
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
var temp__5804__auto____$1 = (function (){var G__104163 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(edit_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104163) : frontend.db.entity.call(null,G__104163));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var block = temp__5804__auto____$1;
var pos = frontend.state.get_edit_pos();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.handler.editor.db_based_cycle_todo_BANG_(block);
} else {
var _STAR_outliner_ops_STAR__orig_val__104164 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104165 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104165);

try{frontend.handler.editor.db_based_cycle_todo_BANG_(block);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"cycle-todos","cycle-todos",-1473215654)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104164);
}}
})());
}));
} else {
return null;
}
} else {
var content = frontend.state.get_edit_content();
var format = (function (){var or__5002__auto__ = (function (){var G__104169 = frontend.state.get_current_page();
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__104169) : frontend.db.get_page_format.call(null,G__104169));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
var vec__104166 = frontend.handler.file_based.status.cycle_marker(content,null,null,format,frontend.state.get_preferred_workflow());
var new_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104166,(0),null);
var marker = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104166,(1),null);
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
frontend.handler.editor.set_priority = (function frontend$handler$editor$set_priority(p__104170,new_priority){
var map__104171 = p__104170;
var map__104171__$1 = cljs.core.__destructure_map(map__104171);
var block = map__104171__$1;
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104171__$1,new cljs.core.Keyword("block","priority","block/priority",1491369544));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104171__$1,new cljs.core.Keyword("block","title","block/title",710445684));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return null;
} else {
var new_content = clojure.string.replace_first(title,(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[#%s]",priority) : frontend.util.format.call(null,"[#%s]",priority)),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[#%s]",new_priority) : frontend.util.format.call(null,"[#%s]",new_priority)));
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,new_content);
}
});
frontend.handler.editor.delete_block_aux_BANG_ = (function frontend$handler$editor$delete_block_aux_BANG_(p__104172){
var map__104173 = p__104172;
var map__104173__$1 = cljs.core.__destructure_map(map__104173);
var _block = map__104173__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104173__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var block = (function (){var G__104174 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104174) : frontend.db.entity.call(null,G__104174));
})();
if(cljs.core.truth_(block)){
var blocks = frontend.handler.block.get_top_level_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null));
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.delete_blocks_BANG_(blocks,cljs.core.PersistentArrayMap.EMPTY);
} else {
var _STAR_outliner_ops_STAR__orig_val__104175 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104176 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104176);

try{frontend.modules.outliner.op.delete_blocks_BANG_(blocks,cljs.core.PersistentArrayMap.EMPTY);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104175);
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
var temp__5804__auto____$1 = (function (){var G__104177 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(sibling_block_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104177) : frontend.db.entity.call(null,G__104177));
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
var vec__104178 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__104181 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(sibling_entity);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104181) : frontend.db.entity.call(null,G__104181));
})(),(function (){var G__104182 = dommy.core.attr(sibling_block,"containerid");
if((G__104182 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__104182);
}
})()], null);
var edit_target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104178,(0),null);
var container_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104178,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"prev-block","prev-block",116851678),sibling_entity,new cljs.core.Keyword(null,"new-content","new-content",525291180),new_value,new cljs.core.Keyword(null,"pos","pos",-864607220),pos,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990),(function (){
var G__104183 = edit_target;
var G__104184 = pos;
var G__104185 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),new_value,new cljs.core.Keyword(null,"tail-len","tail-len",699304522),tail_len,new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__104183,G__104184,G__104185) : frontend.handler.editor.edit_block_BANG_.call(null,G__104183,G__104184,G__104185));
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
frontend.handler.editor.delete_block_inner_BANG_ = (function frontend$handler$editor$delete_block_inner_BANG_(repo,p__104186){
var map__104187 = p__104186;
var map__104187__$1 = cljs.core.__destructure_map(map__104187);
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104187__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104187__$1,new cljs.core.Keyword(null,"value","value",305978217));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104187__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104187__$1,new cljs.core.Keyword(null,"config","config",994861415));
if(cljs.core.truth_(block_id)){
var temp__5804__auto__ = (function (){var G__104188 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104188) : frontend.db.entity.call(null,G__104188));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_e = temp__5804__auto__;
var prev_block = frontend.db.model.get_prev((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_e));
var block_parent_id = ["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('');
if((((prev_block == null)) && ((new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block_e) == null)))){
return null;
} else {
var has_children_QMARK_ = cljs.core.seq(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block_e));
var block = (function (){var G__104189 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_e);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104189) : frontend.db.entity.call(null,G__104189));
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
var block__$1 = (function (){var G__104190 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104190) : frontend.db.entity.call(null,G__104190));
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
var map__104191 = frontend.handler.editor.move_to_prev_block(repo,sibling_or_parent_block,format,value);
var map__104191__$1 = cljs.core.__destructure_map(map__104191);
var prev_block__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104191__$1,new cljs.core.Keyword(null,"prev-block","prev-block",116851678));
var new_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104191__$1,new cljs.core.Keyword(null,"new-content","new-content",525291180));
var edit_block_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104191__$1,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990));
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
var G__104192 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.model.hidden_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.model.hidden_page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__104192) : frontend.db.model.hidden_page_QMARK_.call(null,G__104192));
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
var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((function (){var G__104193 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104193) : frontend.db.entity.call(null,G__104193));
})());
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var prev_block_is_not_parent_QMARK_ = cljs.core.empty_QMARK_(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(prev_block__$1));
var delete_prev_block_QMARK_ = ((db_based_QMARK_) && (((prev_block_is_not_parent_QMARK_) && (((cljs.core.empty_QMARK_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.not(new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block))) && (((cljs.core.empty_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(prev_block__$1))) && (cljs.core.not(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block))))))))))))));
if(delete_prev_block_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
frontend.handler.editor.delete_block_aux_BANG_(prev_block__$1);

var G__104194 = repo;
var G__104195 = block;
var G__104196 = new_content;
var G__104197 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__104194,G__104195,G__104196,G__104197) : frontend.handler.editor.save_block_BANG_.call(null,G__104194,G__104195,G__104196,G__104197));
} else {
var _STAR_outliner_ops_STAR__orig_val__104198 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104199 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104199);

try{frontend.handler.editor.delete_block_aux_BANG_(prev_block__$1);

var G__104200_104894 = repo;
var G__104201_104895 = block;
var G__104202_104896 = new_content;
var G__104203_104897 = cljs.core.PersistentArrayMap.EMPTY;
(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__104200_104894,G__104201_104895,G__104202_104896,G__104203_104897) : frontend.handler.editor.save_block_BANG_.call(null,G__104200_104894,G__104201_104895,G__104202_104896,G__104203_104897));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),transact_opts);
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(transact_opts,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104198);
}}
})()),(function (___41611__auto__){
return promesa.protocols._promise((function (){var G__104204 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),new_content);
var G__104205 = cljs.core.count(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(prev_block__$1));
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(G__104204,G__104205) : frontend.handler.editor.edit_block_BANG_.call(null,G__104204,G__104205));
})());
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
if(cljs.core.seq(children)){
frontend.modules.outliner.op.move_blocks_BANG_(children,prev_block__$1,false);
} else {
}

frontend.handler.editor.delete_block_aux_BANG_(block);

var G__104206 = repo;
var G__104207 = prev_block__$1;
var G__104208 = new_content;
var G__104209 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__104206,G__104207,G__104208,G__104209) : frontend.handler.editor.save_block_BANG_.call(null,G__104206,G__104207,G__104208,G__104209));
} else {
var _STAR_outliner_ops_STAR__orig_val__104210 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104211 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104211);

try{if(cljs.core.seq(children)){
frontend.modules.outliner.op.move_blocks_BANG_(children,prev_block__$1,false);
} else {
}

frontend.handler.editor.delete_block_aux_BANG_(block);

var G__104212_104898 = repo;
var G__104213_104899 = prev_block__$1;
var G__104214_104900 = new_content;
var G__104215_104901 = cljs.core.PersistentArrayMap.EMPTY;
(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(G__104212_104898,G__104213_104899,G__104214_104900,G__104215_104901) : frontend.handler.editor.save_block_BANG_.call(null,G__104212_104898,G__104213_104899,G__104214_104900,G__104215_104901));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),transact_opts);
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(transact_opts,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104210);
}}
})()),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(edit_block_f)?(edit_block_f.cljs$core$IFn$_invoke$arity$0 ? edit_block_f.cljs$core$IFn$_invoke$arity$0() : edit_block_f.call(null)):null));
}));
}));
}
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(block)),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(edit_block_f)?(edit_block_f.cljs$core$IFn$_invoke$arity$0 ? edit_block_f.cljs$core$IFn$_invoke$arity$0() : edit_block_f.call(null)):null));
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
frontend.handler.editor.delete_blocks_BANG_ = (function frontend$handler$editor$delete_blocks_BANG_(repo,block_uuids,blocks,dom_blocks){
if(cljs.core.seq(block_uuids)){
var uuid__GT_dom_block = cljs.core.zipmap(block_uuids,dom_blocks);
var block = cljs.core.first(blocks);
var block_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuid__GT_dom_block,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
var sibling_block = (cljs.core.truth_(block_parent)?frontend.util.get_prev_block_non_collapsed_non_embed(block_parent):null);
var blocks_SINGLEQUOTE_ = frontend.handler.block.get_top_level_blocks(blocks);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.delete_blocks_BANG_(blocks_SINGLEQUOTE_,null);
} else {
var _STAR_outliner_ops_STAR__orig_val__104216 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104217 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104217);

try{frontend.modules.outliner.op.delete_blocks_BANG_(blocks_SINGLEQUOTE_,null);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104216);
}}
})()),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(sibling_block)?(function (){var map__104218 = frontend.handler.editor.move_to_prev_block(repo,sibling_block,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),"");
var map__104218__$1 = cljs.core.__destructure_map(map__104218);
var edit_block_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104218__$1,new cljs.core.Keyword(null,"edit-block-f","edit-block-f",1407202990));
if(cljs.core.truth_(edit_block_f)){
return (edit_block_f.cljs$core$IFn$_invoke$arity$0 ? edit_block_f.cljs$core$IFn$_invoke$arity$0() : edit_block_f.call(null));
} else {
return null;
}
})():null));
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
var temp__5804__auto__ = (function (){var G__104219 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104219) : frontend.db.entity.call(null,G__104219));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var map__104220 = block;
var map__104220__$1 = cljs.core.__destructure_map(map__104220);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104220__$1,new cljs.core.Keyword("block","title","block/title",710445684));
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
var G__104223 = arguments.length;
switch (G__104223) {
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
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__104221_SHARP_){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__104221_SHARP_);
}));
}));

(frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,tap_clipboard){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.set_blocks_id_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null))),(function (___41611__auto____$1){
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
var len__5726__auto___104903 = arguments.length;
var i__5727__auto___104904 = (0);
while(true){
if((i__5727__auto___104904 < len__5726__auto___104903)){
args__5732__auto__.push((arguments[i__5727__auto___104904]));

var G__104905 = (i__5727__auto___104904 + (1));
i__5727__auto___104904 = G__104905;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic = (function (repo,block_ids,p__104227){
var map__104228 = p__104227;
var map__104228__$1 = cljs.core.__destructure_map(map__104228);
var opts = map__104228__$1;
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var G__104229 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104229) : frontend.db.entity.call(null,G__104229));
}),block_ids);
var top_level_block_uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.handler.block.get_top_level_blocks(blocks));
var content = frontend.handler.export$.text.export_blocks_as_markdown(repo,top_level_block_uuids,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),frontend.state.get_export_block_text_indent_style(),new cljs.core.Keyword(null,"remove-options","remove-options",768737839),cljs.core.set(frontend.state.get_export_block_text_remove_options())], null)], 0)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [top_level_block_uuids,content], null);
}));

(frontend.handler.editor.compose_copied_blocks_contents.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.editor.compose_copied_blocks_contents.cljs$lang$applyTo = (function (seq104224){
var G__104225 = cljs.core.first(seq104224);
var seq104224__$1 = cljs.core.next(seq104224);
var G__104226 = cljs.core.first(seq104224__$1);
var seq104224__$2 = cljs.core.next(seq104224__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104225,G__104226,seq104224__$2);
}));

frontend.handler.editor.get_all_blocks_by_ids = (function frontend$handler$editor$get_all_blocks_by_ids(repo,ids){
var ids__$1 = ids;
var result = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.seq(ids__$1)){
var db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__104231 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ids__$1)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104231) : frontend.db.entity.call(null,G__104231));
})());
var blocks = frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic(repo,db_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null)], 0));
var result__$1 = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result,blocks));
var G__104906 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),result__$1)),cljs.core.rest(ids__$1));
var G__104907 = result__$1;
ids__$1 = G__104906;
result = G__104907;
continue;
} else {
return result;
}
break;
}
});
frontend.handler.editor.copy_selection_blocks = (function frontend$handler$editor$copy_selection_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___104908 = arguments.length;
var i__5727__auto___104909 = (0);
while(true){
if((i__5727__auto___104909 < len__5726__auto___104908)){
args__5732__auto__.push((arguments[i__5727__auto___104909]));

var G__104910 = (i__5727__auto___104909 + (1));
i__5727__auto___104909 = G__104910;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.copy_selection_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.copy_selection_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (html_QMARK_,p__104235){
var map__104236 = p__104235;
var map__104236__$1 = cljs.core.__destructure_map(map__104236);
var opts = map__104236__$1;
var selected_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104236__$1,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948));
var repo = frontend.state.get_current_repo();
var selected_ids = frontend.state.get_selection_block_ids();
var ids = (function (){var or__5002__auto__ = cljs.core.seq(selected_ids);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),selected_blocks);
}
})();
var vec__104237 = frontend.handler.editor.compose_copied_blocks_contents.cljs$core$IFn$_invoke$arity$variadic(repo,ids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
var top_level_block_uuids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104237,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104237,(1),null);
var block = (function (){var G__104240 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ids)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104240) : frontend.db.entity.call(null,G__104240));
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(block)){
var html_104911 = frontend.handler.export$.html.export_blocks_as_html(repo,top_level_block_uuids,null);
var copied_blocks_104912 = (function (){var G__104241 = frontend.handler.editor.get_all_blocks_by_ids(repo,top_level_block_uuids);
if(db_based_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
var b = (function (){var G__104242 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104242) : frontend.db.entity.call(null,G__104242));
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__104243){
var vec__104244 = p__104243;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104244,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104244,(1),null);
var v_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(v);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__104247 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104247) : frontend.db.entity.call(null,G__104247));
})())], null):((((cljs.core.coll_QMARK_(v)) && (cljs.core.every_QMARK_((function (p1__104232_SHARP_){
var and__5000__auto____$1 = cljs.core.map_QMARK_(p1__104232_SHARP_);
if(and__5000__auto____$1){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__104232_SHARP_);
} else {
return and__5000__auto____$1;
}
}),v))))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (i){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__104248 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(i);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104248) : frontend.db.entity.call(null,G__104248));
})())], null);
}),v)):v
));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v_SINGLEQUOTE_], null);
}),b)),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
}),G__104241);
} else {
return G__104241;
}
})();
frontend.handler.common.copy_to_clipboard_without_id_property_BANG_(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content,(cljs.core.truth_(html_QMARK_)?html_104911:null),copied_blocks_104912);

frontend.state.set_block_op_type_BANG_(new cljs.core.Keyword(null,"copy","copy",-1077617309));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;
}
}));

(frontend.handler.editor.copy_selection_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.copy_selection_blocks.cljs$lang$applyTo = (function (seq104233){
var G__104234 = cljs.core.first(seq104233);
var seq104233__$1 = cljs.core.next(seq104233);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104234,seq104233__$1);
}));

frontend.handler.editor.copy_block_refs = (function frontend$handler$editor$copy_block_refs(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.editor.get_selected_blocks());
if(temp__5804__auto__){
var selected_blocks = temp__5804__auto__;
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104249_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__104249_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
var level = dommy.core.attr(p1__104249_SHARP_,"level");
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.uuid(id),new cljs.core.Keyword(null,"level","level",1290497552),(level | (0))], null);
} else {
return null;
}
}),selected_blocks)));
var first_block = cljs.core.first(blocks);
var first_root_level_index = cljs.core.ffirst(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__104250){
var vec__104251 = p__104250;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104251,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104251,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(block),(1));
}),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,blocks)));
var root_level = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(first_block));
var adjusted_blocks = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (index,p__104254){
var map__104255 = p__104254;
var map__104255__$1 = cljs.core.__destructure_map(map__104255);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104255__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104255__$1,new cljs.core.Keyword(null,"level","level",1290497552));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"level","level",1290497552),(((index < first_root_level_index))?(((level < cljs.core.deref(root_level)))?(function (){
cljs.core.reset_BANG_(root_level,level);

return (1);
})()
:((level - cljs.core.deref(root_level)) + (1))):level)], null);
}),blocks);
var block = (function (){var G__104256 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(first_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104256) : frontend.db.entity.call(null,G__104256));
})();
var copy_str = (function (){var G__104257 = adjusted_blocks;
var G__104257__$1 = (((G__104257 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__104258){
var map__104259 = p__104258;
var map__104259__$1 = cljs.core.__destructure_map(map__104259);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104259__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104259__$1,new cljs.core.Keyword(null,"level","level",1290497552));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t")),"- ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(id) : frontend.util.ref.__GT_page_ref.call(null,id)))].join('');
} else {
var pred__104260 = cljs.core._EQ_;
var expr__104261 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_((pred__104260.cljs$core$IFn$_invoke$arity$2 ? pred__104260.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),expr__104261) : pred__104260.call(null,new cljs.core.Keyword(null,"org","org",1495985),expr__104261)))){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(level,"*"))," ",frontend.util.ref.__GT_block_ref(id)].join('');
} else {
if(cljs.core.truth_((pred__104260.cljs$core$IFn$_invoke$arity$2 ? pred__104260.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),expr__104261) : pred__104260.call(null,new cljs.core.Keyword(null,"markdown","markdown",1227225089),expr__104261)))){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t")),"- ",frontend.util.ref.__GT_block_ref(id)].join('');
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expr__104261)].join('')));
}
}
}
}),G__104257));
if((G__104257__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__104257__$1);
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
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104263_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__104263_SHARP_,"blockid");
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return cljs.core.uuid(id);
} else {
return null;
}
}),blocks)));
var ids_str = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?(function (){var G__104264 = ids;
var G__104264__$1 = (((G__104264 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return frontend.util.ref.__GT_block_ref(id);
}),G__104264));
if((G__104264__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__104264__$1);
}
})():(function (){var G__104265 = ids;
var G__104265__$1 = (((G__104265 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed ((%s))}}",id) : frontend.util.format.call(null,"{{embed ((%s))}}",id));
}),G__104265));
if((G__104265__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n\n",G__104265__$1);
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
var block_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104266_SHARP_){
var temp__5804__auto____$1 = dommy.core.attr(p1__104266_SHARP_,"blockid");
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
var G__104267 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
if((G__104267 == null)){
return null;
} else {
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(G__104267,page_id);
}
}),blocks__$1);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.handler.block.get_top_level_blocks(blocks_STAR_));
} else {
return null;
}
});
frontend.handler.editor.cut_selection_blocks = (function frontend$handler$editor$cut_selection_blocks(copy_QMARK_){
if(cljs.core.truth_(copy_QMARK_)){
frontend.handler.editor.copy_selection_blocks(true);
} else {
}

frontend.state.set_block_op_type_BANG_(new cljs.core.Keyword(null,"cut","cut",-1042666209));

var temp__5804__auto__ = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-query"))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-transclude"))));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__104268_SHARP_){
return dommy.core.has_class_QMARK_(p1__104268_SHARP_,"property-value-container");
}),frontend.handler.editor.get_selected_blocks())));
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var dom_blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block,"data-query"));
}),blocks);
if(cljs.core.seq(dom_blocks)){
var repo = frontend.state.get_current_repo();
var block_uuids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104269_SHARP_){
return cljs.core.uuid(dommy.core.attr(p1__104269_SHARP_,"blockid"));
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
return frontend.handler.editor.delete_blocks_BANG_(repo,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),sorted_blocks),sorted_blocks,dom_blocks);
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
 * Didn't use link/plain-link as it is incorrectly detects words as urls.
 */
frontend.handler.editor.url_regex = /[^\s\(\[]+:\/\/[^\s\)\]]+/;
frontend.handler.editor.extract_nearest_link_from_text = (function frontend$handler$editor$extract_nearest_link_from_text(var_args){
var args__5732__auto__ = [];
var len__5726__auto___104913 = arguments.length;
var i__5727__auto___104914 = (0);
while(true){
if((i__5727__auto___104914 < len__5726__auto___104913)){
args__5732__auto__.push((arguments[i__5727__auto___104914]));

var G__104915 = (i__5727__auto___104914 + (1));
i__5727__auto___104914 = G__104915;
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
var additional_matches = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__104270_SHARP_){
return frontend.util.re_pos(p1__104270_SHARP_,text);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([additional_patterns], 0));
var matches = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(page_matches,block_matches,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tag_matches,additional_matches], 0)));
var vec__104275 = cljs.core.first(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (p__104278){
var vec__104279 = p__104278;
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104279,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104279,(1),null);
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
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104275,(0),null);
var match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104275,(1),null);
if(cljs.core.truth_(match)){
if(cljs.core.truth_(cljs.core.some((function (p1__104271_SHARP_){
return cljs.core.re_find(p1__104271_SHARP_,match);
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
(frontend.handler.editor.extract_nearest_link_from_text.cljs$lang$applyTo = (function (seq104272){
var G__104273 = cljs.core.first(seq104272);
var seq104272__$1 = cljs.core.next(seq104272);
var G__104274 = cljs.core.first(seq104272__$1);
var seq104272__$2 = cljs.core.next(seq104272__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104273,G__104274,seq104272__$2);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_editor_action_BANG_()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___41611__auto____$1){
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
var temp__5804__auto__ = (function (){var G__104282 = frontend.state.get_edit_block();
var G__104282__$1 = (((G__104282 == null))?null:new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__104282));
var G__104282__$2 = (((G__104282__$1 == null))?null:(function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
})(G__104282__$1));
var G__104282__$3 = (((G__104282__$2 == null))?null:(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104282__$2) : frontend.db.entity.call(null,G__104282__$2)));
if((G__104282__$3 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__104282__$3);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
frontend.state.clear_editor_action_BANG_();

frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473),id], null));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___41611__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_editor_action_BANG_()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___41611__auto____$1){
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
var page_id = (function (){var G__104283 = (function (){var G__104284 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104284) : frontend.db.entity.call(null,G__104284));
})();
var G__104283__$1 = (((G__104283 == null))?null:new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(G__104283));
if((G__104283__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__104283__$1);
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
var temp__5804__auto__ = (function (){var G__104285 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104285) : frontend.db.entity.call(null,G__104285));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var repo = frontend.state.get_current_repo();
var vec__104286 = frontend.handler.editor.compose_copied_blocks_contents(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
var _top_level_block_uuids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104286,(0),null);
var md_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104286,(1),null);
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
var len__5726__auto___104916 = arguments.length;
var i__5727__auto___104917 = (0);
while(true){
if((i__5727__auto___104917 < len__5726__auto___104916)){
args__5732__auto__.push((arguments[i__5727__auto___104917]));

var G__104918 = (i__5727__auto___104917 + (1));
i__5727__auto___104917 = G__104918;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (end_block_id,p__104291){
var map__104292 = p__104291;
var map__104292__$1 = cljs.core.__destructure_map(map__104292);
var append_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104292__$1,new cljs.core.Keyword(null,"append?","append?",123923917));
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
return frontend.state.conj_selection_block_BANG_(blocks__$1,direction);
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
(frontend.handler.editor.highlight_selection_area_BANG_.cljs$lang$applyTo = (function (seq104289){
var G__104290 = cljs.core.first(seq104289);
var seq104289__$1 = cljs.core.next(seq104289);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104290,seq104289__$1);
}));

if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.editor !== 'undefined') && (typeof frontend.handler.editor._STAR_action_bar_timeout !== 'undefined')){
} else {
frontend.handler.editor._STAR_action_bar_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.handler.editor.popup_exists_QMARK_ = (function frontend$handler$editor$popup_exists_QMARK_(id){
var G__104294 = logseq.shui.popup.core.get_popups();
if((G__104294 == null)){
return null;
} else {
return cljs.core.some((function (p1__104293_SHARP_){
var G__104295 = p1__104293_SHARP_;
var G__104295__$1 = (((G__104295 == null))?null:new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__104295));
var G__104295__$2 = (((G__104295__$1 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104295__$1));
if((G__104295__$2 == null)){
return null;
} else {
return clojure.string.includes_QMARK_(G__104295__$2,cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
}
}),G__104294);
}
});
frontend.handler.editor.show_action_bar_BANG_ = (function frontend$handler$editor$show_action_bar_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___104919 = arguments.length;
var i__5727__auto___104920 = (0);
while(true){
if((i__5727__auto___104920 < len__5726__auto___104919)){
args__5732__auto__.push((arguments[i__5727__auto___104920]));

var G__104921 = (i__5727__auto___104920 + (1));
i__5727__auto___104920 = G__104921;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.editor.show_action_bar_BANG_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.editor.show_action_bar_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__104297){
var map__104298 = p__104297;
var map__104298__$1 = cljs.core.__destructure_map(map__104298);
var delay = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104298__$1,new cljs.core.Keyword(null,"delay","delay",-574225219),(200));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.handler.editor.popup_exists_QMARK_(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555)));
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___104922 = cljs.core.deref(frontend.handler.editor._STAR_action_bar_timeout);
if(cljs.core.truth_(temp__5804__auto___104922)){
var timeout_104923 = temp__5804__auto___104922;
clearTimeout(timeout_104923);
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
(frontend.handler.editor.show_action_bar_BANG_.cljs$lang$applyTo = (function (seq104296){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq104296));
}));

frontend.handler.editor.select_block_up_down = (function frontend$handler$editor$select_block_up_down(direction){
if(frontend.state.editing_QMARK_()){
var element_104927 = goog.dom.getElement(frontend.state.get_editing_block_dom_id());
if(cljs.core.truth_(element_104927)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.save_current_block_BANG_.call(null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_104927)),(function (___41611__auto____$1){
return promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [element_104927], null)));
}));
}));
}));
} else {
}
} else {
if(((frontend.state.selection_QMARK_()) && (((1) === cljs.core.count(frontend.state.get_selection_blocks()))))){
var f_104928 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed_skip);
var element_104929 = (function (){var G__104299 = cljs.core.first(frontend.state.get_selection_blocks());
var G__104300 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_104928.cljs$core$IFn$_invoke$arity$2 ? f_104928.cljs$core$IFn$_invoke$arity$2(G__104299,G__104300) : f_104928.call(null,G__104299,G__104300));
})();
if(cljs.core.truth_(element_104929)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_104929);

frontend.state.conj_selection_block_BANG_(element_104929,direction);
} else {
}
} else {
if(((frontend.state.selection_QMARK_()) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,frontend.state.get_selection_direction())))){
var f_104935 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed_skip);
var first_last_104936 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?cljs.core.first:cljs.core.last);
var element_104937 = (function (){var G__104301 = (function (){var G__104303 = frontend.state.get_selection_blocks();
return (first_last_104936.cljs$core$IFn$_invoke$arity$1 ? first_last_104936.cljs$core$IFn$_invoke$arity$1(G__104303) : first_last_104936.call(null,G__104303));
})();
var G__104302 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_104935.cljs$core$IFn$_invoke$arity$2 ? f_104935.cljs$core$IFn$_invoke$arity$2(G__104301,G__104302) : f_104935.call(null,G__104301,G__104302));
})();
if(cljs.core.truth_(element_104937)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_104937);

frontend.state.conj_selection_block_BANG_(element_104937,direction);
} else {
}
} else {
if(frontend.state.selection_QMARK_()){
var f_104947 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?frontend.util.get_prev_block_non_collapsed:frontend.util.get_next_block_non_collapsed);
var last_first_104948 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?cljs.core.last:cljs.core.first);
var element_104949 = (function (){var G__104304 = (function (){var G__104306 = frontend.state.get_selection_blocks();
return (last_first_104948.cljs$core$IFn$_invoke$arity$1 ? last_first_104948.cljs$core$IFn$_invoke$arity$1(G__104306) : last_first_104948.call(null,G__104306));
})();
var G__104305 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f_104947.cljs$core$IFn$_invoke$arity$2 ? f_104947.cljs$core$IFn$_invoke$arity$2(G__104304,G__104305) : f_104947.call(null,G__104304,G__104305));
})();
if(cljs.core.truth_(element_104949)){
frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1(element_104949);

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
var entity = (function (){var G__104307 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104307) : frontend.db.entity.call(null,G__104307));
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
var G__104309 = arguments.length;
switch (G__104309) {
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

(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (repo,block_or_uuid,content,p__104310){
var map__104311 = p__104310;
var map__104311__$1 = cljs.core.__destructure_map(map__104311);
var opts = map__104311__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104311__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var block = ((((cljs.core.uuid_QMARK_(block_or_uuid)) || (typeof block_or_uuid === 'string')))?frontend.db.model.query_block_by_uuid(block_or_uuid):block_or_uuid);
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"opts","opts",155075701),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"properties","properties",685819552))], null),((cljs.core.seq(properties))?frontend.handler.property.file.insert_properties_when_file_based(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content,properties):content));
}));

(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (p__104312,value){
var map__104313 = p__104312;
var map__104313__$1 = cljs.core.__destructure_map(map__104313);
var _state = map__104313__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104313__$1,new cljs.core.Keyword(null,"block","block",664686210));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104313__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104313__$1,new cljs.core.Keyword(null,"opts","opts",155075701));
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
if(cljs.core.truth_((function (){var G__104314 = repo__$1;
var G__104315 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__104314,G__104315) : frontend.db.entity.call(null,G__104314,G__104315));
})())){
return frontend.handler.editor.save_block_aux_BANG_(block,value,opts);
} else {
return null;
}
}));

(frontend.handler.editor.save_block_BANG_.cljs$lang$maxFixedArity = 4);

frontend.handler.editor.save_blocks_BANG_ = (function frontend$handler$editor$save_blocks_BANG_(blocks){
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__104316 = cljs.core.seq(blocks);
var chunk__104317 = null;
var count__104318 = (0);
var i__104319 = (0);
while(true){
if((i__104319 < count__104318)){
var vec__104326 = chunk__104317.cljs$core$IIndexed$_nth$arity$2(null,i__104319);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104326,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104326,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,value);


var G__104988 = seq__104316;
var G__104989 = chunk__104317;
var G__104990 = count__104318;
var G__104991 = (i__104319 + (1));
seq__104316 = G__104988;
chunk__104317 = G__104989;
count__104318 = G__104990;
i__104319 = G__104991;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104316);
if(temp__5804__auto__){
var seq__104316__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104316__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104316__$1);
var G__104992 = cljs.core.chunk_rest(seq__104316__$1);
var G__104993 = c__5525__auto__;
var G__104994 = cljs.core.count(c__5525__auto__);
var G__104995 = (0);
seq__104316 = G__104992;
chunk__104317 = G__104993;
count__104318 = G__104994;
i__104319 = G__104995;
continue;
} else {
var vec__104329 = cljs.core.first(seq__104316__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104329,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104329,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block,value);


var G__104996 = cljs.core.next(seq__104316__$1);
var G__104997 = null;
var G__104998 = (0);
var G__104999 = (0);
seq__104316 = G__104996;
chunk__104317 = G__104997;
count__104318 = G__104998;
i__104319 = G__104999;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__104332 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104333 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104333);

try{var seq__104334_105000 = cljs.core.seq(blocks);
var chunk__104335_105001 = null;
var count__104336_105002 = (0);
var i__104337_105003 = (0);
while(true){
if((i__104337_105003 < count__104336_105002)){
var vec__104344_105004 = chunk__104335_105001.cljs$core$IIndexed$_nth$arity$2(null,i__104337_105003);
var block_105005 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104344_105004,(0),null);
var value_105006 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104344_105004,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block_105005,value_105006);


var G__105007 = seq__104334_105000;
var G__105008 = chunk__104335_105001;
var G__105009 = count__104336_105002;
var G__105010 = (i__104337_105003 + (1));
seq__104334_105000 = G__105007;
chunk__104335_105001 = G__105008;
count__104336_105002 = G__105009;
i__104337_105003 = G__105010;
continue;
} else {
var temp__5804__auto___105011 = cljs.core.seq(seq__104334_105000);
if(temp__5804__auto___105011){
var seq__104334_105012__$1 = temp__5804__auto___105011;
if(cljs.core.chunked_seq_QMARK_(seq__104334_105012__$1)){
var c__5525__auto___105013 = cljs.core.chunk_first(seq__104334_105012__$1);
var G__105014 = cljs.core.chunk_rest(seq__104334_105012__$1);
var G__105015 = c__5525__auto___105013;
var G__105016 = cljs.core.count(c__5525__auto___105013);
var G__105017 = (0);
seq__104334_105000 = G__105014;
chunk__104335_105001 = G__105015;
count__104336_105002 = G__105016;
i__104337_105003 = G__105017;
continue;
} else {
var vec__104347_105018 = cljs.core.first(seq__104334_105012__$1);
var block_105019 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104347_105018,(0),null);
var value_105020 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104347_105018,(1),null);
frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$2(block_105019,value_105020);


var G__105021 = cljs.core.next(seq__104334_105012__$1);
var G__105022 = null;
var G__105023 = (0);
var G__105024 = (0);
seq__104334_105000 = G__105021;
chunk__104335_105001 = G__105022;
count__104336_105002 = G__105023;
i__104337_105003 = G__105024;
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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104332);
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
var G__104351 = arguments.length;
switch (G__104351) {
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

(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (p__104352){
var map__104353 = p__104352;
var map__104353__$1 = cljs.core.__destructure_map(map__104353);
var opts = map__104353__$1;
var force_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104353__$1,new cljs.core.Keyword(null,"force?","force?",1839038675));
var skip_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104353__$1,new cljs.core.Keyword(null,"skip-properties?","skip-properties?",329398686));
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104353__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
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
var G__104355 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104355) : frontend.db.entity.call(null,G__104355));
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
}catch (e104354){var error = e104354;
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.editor",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"save-block-failed","save-block-failed",610684026),error,new cljs.core.Keyword(null,"line","line",212345235),1389], null)),null);
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
var G__104356 = logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3(content,format,frontend.config.get_block_pattern(format));
var G__104356__$1 = (((G__104356 == null))?null:frontend.util.file_based.drawer.remove_logbook(G__104356));
var G__104356__$2 = (((G__104356__$1 == null))?null:frontend.handler.property.file.remove_properties_when_file_based(repo,format,G__104356__$1));
if((G__104356__$2 == null)){
return null;
} else {
return clojure.string.trim(G__104356__$2);
}
}
});
frontend.handler.editor.delete_asset_of_block_BANG_ = (function frontend$handler$editor$delete_asset_of_block_BANG_(p__104357){
var map__104358 = p__104357;
var map__104358__$1 = cljs.core.__destructure_map(map__104358);
var _opts = map__104358__$1;
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var asset_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"asset-block","asset-block",1420117445));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"full-text","full-text",1432444182));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var local_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"local?","local?",-1422786101));
var delete_local_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104358__$1,new cljs.core.Keyword(null,"delete-local?","delete-local?",1716577572));
var block = frontend.db.model.query_block_by_uuid(block_id);
var _ = (function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)," not exists"].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null));
}
})();
var text = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var content = (cljs.core.truth_(asset_block)?clojure.string.replace(text,(function (){var G__104359 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_block);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__104359) : frontend.util.ref.__GT_page_ref.call(null,G__104359));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),(function (buffer){
return promesa.protocols._promise((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["writeFile",repo,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath], 0)),buffer], 0)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
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
var len__5726__auto___105036 = arguments.length;
var i__5727__auto___105037 = (0);
while(true){
if((i__5727__auto___105037 < len__5726__auto___105036)){
args__5732__auto__.push((arguments[i__5727__auto___105037]));

var G__105038 = (i__5727__auto___105037 + (1));
i__5727__auto___105037 = G__105038;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.editor.db_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.editor.db_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,files,p__104363){
var map__104364 = p__104363;
var map__104364__$1 = cljs.core.__destructure_map(map__104364);
var pdf_area_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104364__$1,new cljs.core.Keyword(null,"pdf-area?","pdf-area?",770305490));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.ensure_assets_dir_BANG_(repo)),(function (p__104365){
var vec__104366 = p__104365;
var repo_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104366,(0),null);
var asset_dir_rpath = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104366,(1),null);
return promesa.protocols._promise(promesa.core.all((function (){var iter__5480__auto__ = (function frontend$handler$editor$iter__104369(s__104370){
return (new cljs.core.LazySeq(null,(function (){
var s__104370__$1 = s__104370;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__104370__$1);
if(temp__5804__auto__){
var s__104370__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__104370__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__104370__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__104372 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__104371 = (0);
while(true){
if((i__104371 < size__5479__auto__)){
var vec__104373 = cljs.core._nth(c__5478__auto__,i__104371);
var _index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104373,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104373,(1),null);
cljs.core.chunk_append(b__104372,promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__104376 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__104376) : frontend.util.node_path.basename.call(null,G__104376));
})()),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.parse.call(null,file_name)).name),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (file_name_without_ext){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_file_checksum(file)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (checksum){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_asset_with_checksum(repo,checksum)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (existing_asset){
return promesa.protocols._promise((cljs.core.truth_(existing_asset)?existing_asset:promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (___41643__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.new_block_id()),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_name)?clojure.string.lower_case((frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.extname.call(null,file_name)).substr((1))):null)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (ext){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.blank_QMARK_(ext))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("File doesn't have a valid ext.",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file-name","file-name",-1654217259),file_name], null))})():null)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (_){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join('')),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (file_path){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_dir_rpath),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_path)].join('')),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(repo_dir),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (dir){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)))),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (asset){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),ext,new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219),file.size,new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),checksum,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(asset)], null)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),block_id,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (insert_opts){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.db_based_save_asset_BANG_(repo,dir,file,file_rpath)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (edit_block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block);
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.blank_QMARK_(frontend.state.get_edit_content())) && (cljs.core.not(pdf_area_QMARK_)));
} else {
return and__5000__auto__;
}
})()),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (insert_to_current_block_page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(insert_opts,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(insert_opts,new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset)))),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (insert_opts_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(file_name_without_ext,insert_opts_SINGLEQUOTE_)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__104377 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104377) : frontend.db.entity.call(null,G__104377));
})()),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (new_entity){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?frontend.state.clear_edit_BANG_():null)),((function (i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (___41611__auto__){
return promesa.protocols._promise((function (){var or__5002__auto__ = new_entity;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't save asset",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"files","files",-472457450),files], null));
}
})());
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
)));
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
);
});})(i__104371,vec__104373,_index,file,c__5478__auto__,size__5479__auto__,b__104372,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
));

var G__105061 = (i__104371 + (1));
i__104371 = G__105061;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__104372),frontend$handler$editor$iter__104369(cljs.core.chunk_rest(s__104370__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__104372),null);
}
} else {
var vec__104378 = cljs.core.first(s__104370__$2);
var _index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104378,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104378,(1),null);
return cljs.core.cons(promesa.protocols._mcat(promesa.protocols._promise(null),((function (vec__104378,_index,file,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_){
return (function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__104381 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__104381) : frontend.util.node_path.basename.call(null,G__104381));
})()),(function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.parse.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.parse.call(null,file_name)).name),(function (file_name_without_ext){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_file_checksum(file)),(function (checksum){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_asset_with_checksum(repo,checksum)),(function (existing_asset){
return promesa.protocols._promise((cljs.core.truth_(existing_asset)?existing_asset:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$2){
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
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__104382 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104382) : frontend.db.entity.call(null,G__104382));
})()),(function (new_entity){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_to_current_block_page_QMARK_)?frontend.state.clear_edit_BANG_():null)),(function (___41611__auto__){
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
});})(vec__104378,_index,file,s__104370__$2,temp__5804__auto__,vec__104366,repo_dir,asset_dir_rpath,map__104364,map__104364__$1,pdf_area_QMARK_))
),frontend$handler$editor$iter__104369(cljs.core.rest(s__104370__$2)));
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
(frontend.handler.editor.db_based_save_assets_BANG_.cljs$lang$applyTo = (function (seq104360){
var G__104361 = cljs.core.first(seq104360);
var seq104360__$1 = cljs.core.next(seq104360);
var G__104362 = cljs.core.first(seq104360__$1);
var seq104360__$2 = cljs.core.next(seq104360__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104361,G__104362,seq104360__$2);
}));

frontend.handler.editor.insert_command_BANG_ = frontend.handler.common.editor.insert_command_BANG_;
/**
 * Paste asset for db graph and insert link to current editing block
 */
frontend.handler.editor.db_upload_assets_BANG_ = (function frontend$handler$editor$db_upload_assets_BANG_(repo,id,files,format,uploading_QMARK_,drop_or_paste_QMARK_){
if(((frontend.config.local_file_based_graph_QMARK_(repo)) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)))){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.db_based_save_assets_BANG_(repo,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(files)),(function (entities){
var entity = cljs.core.first(entities);
var G__104383_105068 = id;
var G__104384_105069 = (function (){var G__104387 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__104387) : frontend.util.ref.__GT_page_ref.call(null,G__104387));
})();
var G__104385_105070 = format;
var G__104386_105071 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),(cljs.core.truth_(drop_or_paste_QMARK_)?"":frontend.commands.command_trigger),new cljs.core.Keyword(null,"restore?","restore?",1172240305),true,new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"insert-asset","insert-asset",1232083817)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__104383_105068,G__104384_105069,G__104385_105070,G__104386_105071) : frontend.handler.editor.insert_command_BANG_.call(null,G__104383_105068,G__104384_105069,G__104385_105070,G__104386_105071));

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
var vec__104388 = frontend.commands.simple_replace_BANG_(input_id,value__$1,selected,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),((postfix).length),new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015),(function (new_value,prefix_pos){
if((prefix_pos >= (0))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(new_value,prefix_pos,(prefix_pos + (2))),(prefix_pos + (2))], null);
} else {
return null;
}
})], null));
var prefix__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104388,(0),null);
var _pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104388,(1),null);
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
var G__104391 = classes;
var G__104392 = q;
var G__104393 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__104391,G__104392,G__104393) : frontend.search.fuzzy_search.call(null,G__104391,G__104392,G__104393));
});
/**
 * Return matched blocks that are not built-in
 */
frontend.handler.editor._LT_get_matched_blocks = (function frontend$handler$editor$_LT_get_matched_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105079 = arguments.length;
var i__5727__auto___105080 = (0);
while(true){
if((i__5727__auto___105080 < len__5726__auto___105079)){
args__5732__auto__.push((arguments[i__5727__auto___105080]));

var G__105081 = (i__5727__auto___105080 + (1));
i__5727__auto___105080 = G__105081;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor._LT_get_matched_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor._LT_get_matched_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (q,p__104396){
var vec__104397 = p__104396;
var map__104400 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104397,(0),null);
var map__104400__$1 = cljs.core.__destructure_map(map__104400);
var nlp_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104400__$1,new cljs.core.Keyword(null,"nlp-pages?","nlp-pages?",-1155813873));
var page_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104400__$1,new cljs.core.Keyword(null,"page-only?","page-only?",654695800));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(frontend.state.get_current_repo(),q,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),false,new cljs.core.Keyword(null,"enable-snippet?","enable-snippet?",-692858749),false,new cljs.core.Keyword(null,"page-only?","page-only?",654695800),page_only_QMARK_], null))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
}),result)),(function (matched){
return promesa.protocols._promise((function (){var G__104401 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(matched,(cljs.core.truth_(nlp_pages_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (title){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),title,new cljs.core.Keyword(null,"nlp-date?","nlp-date?",1961584384),true], null);
}),frontend.date.nlp_pages):null));
var G__104402 = q;
var G__104403 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"limit","limit",-1355822363),(50)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__104401,G__104402,G__104403) : frontend.search.fuzzy_search.call(null,G__104401,G__104402,G__104403));
})());
}));
}));
}));
}));
}));

(frontend.handler.editor._LT_get_matched_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor._LT_get_matched_blocks.cljs$lang$applyTo = (function (seq104394){
var G__104395 = cljs.core.first(seq104394);
var seq104394__$1 = cljs.core.next(seq104394);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104395,seq104394__$1);
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
}catch (e104404){var e = e104404;
console.error(e);

return null;
}});
frontend.handler.editor.get_matched_commands = (function frontend$handler$editor$get_matched_commands(command){
var pred__104405 = cljs.core._EQ_;
var expr__104406 = command;
if(cljs.core.truth_((pred__104405.cljs$core$IFn$_invoke$arity$2 ? pred__104405.cljs$core$IFn$_invoke$arity$2(null,expr__104406) : pred__104405.call(null,null,expr__104406)))){
return null;
} else {
if(cljs.core.truth_((pred__104405.cljs$core$IFn$_invoke$arity$2 ? pred__104405.cljs$core$IFn$_invoke$arity$2("",expr__104406) : pred__104405.call(null,"",expr__104406)))){
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
var or__5002__auto__ = (function (){var G__104413 = document.activeElement;
var G__104413__$1 = (((G__104413 == null))?null:G__104413.closest("[data-radix-menu-content]"));
var G__104413__$2 = (((G__104413__$1 == null))?null:(G__104413__$1 == null));
if((G__104413__$2 == null)){
return null;
} else {
return cljs.core.not(G__104413__$2);
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
var result = (function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.move_blocks_up_down_BANG_(blocks_SINGLEQUOTE_,up_QMARK_);
} else {
var _STAR_outliner_ops_STAR__orig_val__104415 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104416 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104416);

try{frontend.modules.outliner.op.move_blocks_up_down_BANG_(blocks_SINGLEQUOTE_,up_QMARK_);

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104415);
}}
})();
var temp__5804__auto___105101 = frontend.util.get_first_block_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)));
if(cljs.core.truth_(temp__5804__auto___105101)){
var block_node_105102 = temp__5804__auto___105101;
block_node_105102.scrollIntoView(({"behavior": "smooth", "block": "nearest"}));
} else {
}

return result;
});
if(cljs.core.truth_(edit_block_id)){
var temp__5804__auto__ = (function (){var G__104417 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),edit_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104417) : frontend.db.entity.call(null,G__104417));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var blocks = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),frontend.state.get_edit_content())], null);
var container_id = frontend.handler.editor.get_new_container_id((cljs.core.truth_(up_QMARK_)?new cljs.core.Keyword(null,"move-up","move-up",-1153137133):new cljs.core.Keyword(null,"move-down","move-down",-1149356017)),cljs.core.PersistentArrayMap.EMPTY);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(move_nodes(blocks)),(function (___41611__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(container_id)?frontend.state.set_editing_block_id_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,edit_block_id], null)):(function (){var temp__5804__auto____$1 = (function (){var G__104419 = frontend.state.get_edit_input_id();
if((G__104419 == null)){
return null;
} else {
return goog.dom.getElement(G__104419);
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
var G__104420 = repo;
var G__104421 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__104422 = lookup_refs;
return (frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3 ? frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3(G__104420,G__104421,G__104422) : frontend.db.pull_many.call(null,G__104420,G__104421,G__104422));
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
var G__104423 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__104423__$1 = (((G__104423 instanceof cljs.core.Keyword))?G__104423.fqn:null);
switch (G__104423__$1) {
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
var G__104424 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__104424__$1 = (((G__104424 instanceof cljs.core.Keyword))?G__104424.fqn:null);
switch (G__104424__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("![%s](%s)",label__$1,link__$1) : frontend.util.format.call(null,"![%s](%s)",label__$1,link__$1));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$1 ? frontend.util.format.cljs$core$IFn$_invoke$arity$1("[[%s]]") : frontend.util.format.call(null,"[[%s]]"));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104424__$1)].join('')));

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
var G__104427_105110 = command;
var G__104427_105111__$1 = (((G__104427_105110 instanceof cljs.core.Keyword))?G__104427_105110.fqn:null);
switch (G__104427_105111__$1) {
case "link":
var map__104428_105113 = m;
var map__104428_105114__$1 = cljs.core.__destructure_map(map__104428_105113);
var link_105115 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104428_105114__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var label_105116 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104428_105114__$1,new cljs.core.Keyword(null,"label","label",1718410804));
if(((clojure.string.blank_QMARK_(link_105115)) || (clojure.string.blank_QMARK_(label_105116)))){
} else {
var G__104430_105117 = id;
var G__104431_105118 = frontend.handler.editor.get_link(format,link_105115,label_105116);
var G__104432_105119 = format;
var G__104433_105120 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[frontend.commands.command_trigger,"link"].join(''),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"link","link",-1769163468)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__104430_105117,G__104431_105118,G__104432_105119,G__104433_105120) : frontend.handler.editor.insert_command_BANG_.call(null,G__104430_105117,G__104431_105118,G__104432_105119,G__104433_105120));
}

break;
case "image-link":
var map__104438_105123 = m;
var map__104438_105124__$1 = cljs.core.__destructure_map(map__104438_105123);
var link_105125 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104438_105124__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var label_105126 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104438_105124__$1,new cljs.core.Keyword(null,"label","label",1718410804));
if((!(clojure.string.blank_QMARK_(link_105125)))){
var G__104439_105127 = id;
var G__104440_105128 = frontend.handler.editor.get_image_link(format,link_105125,label_105126);
var G__104441_105129 = format;
var G__104442_105130 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[frontend.commands.command_trigger,"link"].join(''),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"image-link","image-link",1877271958)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__104439_105127,G__104440_105128,G__104441_105129,G__104442_105130) : frontend.handler.editor.insert_command_BANG_.call(null,G__104439_105127,G__104440_105128,G__104441_105129,G__104442_105130));
} else {
}

break;
default:

}

return frontend.handler.editor.handle_command_input_close(id);
});
frontend.handler.editor.restore_last_saved_cursor_BANG_ = (function frontend$handler$editor$restore_last_saved_cursor_BANG_(var_args){
var G__104444 = arguments.length;
switch (G__104444) {
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
var block = (function (){var G__104452 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104452) : frontend.db.entity.call(null,G__104452));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var and__5000__auto____$1 = (function (){var map__104455 = frontend.util.text.get_current_line_by_pos(input.value,(pos - (1)));
var map__104455__$1 = cljs.core.__destructure_map(map__104455);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104455__$1,new cljs.core.Keyword(null,"line","line",212345235));
var start_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104455__$1,new cljs.core.Keyword(null,"start-pos","start-pos",668789086));
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
var G__104459_105141 = id;
var G__104460_105142 = frontend.util.ref.__GT_block_ref(uuid_string);
var G__104461_105143 = format;
var G__104462_105144 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),[logseq.common.util.block_ref.left_parens,cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(selected_text)?"":q))].join(''),new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),logseq.common.util.block_ref.right_parens,new cljs.core.Keyword(null,"postfix-fn","postfix-fn",-1393704144),(function (s){
return frontend.util.replace_first(logseq.common.util.block_ref.right_parens,s,"");
}),new cljs.core.Keyword(null,"forward-pos","forward-pos",-1445897715),(3),new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"block-ref","block-ref",362929756)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__104459_105141,G__104460_105142,G__104461_105143,G__104462_105144) : frontend.handler.editor.insert_command_BANG_.call(null,G__104459_105141,G__104460_105142,G__104461_105143,G__104462_105144));

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
var new_content = (cljs.core.truth_(content_update_fn)?(function (){var G__104463 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
return (content_update_fn.cljs$core$IFn$_invoke$arity$1 ? content_update_fn.cljs$core$IFn$_invoke$arity$1(G__104463) : content_update_fn.call(null,G__104463));
})():new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
var new_content__$1 = (function (){var G__104465 = new_content;
var G__104465__$1 = ((cljs.core.not(keep_uuid_QMARK_))?frontend.handler.property.file.remove_property_when_file_based(repo,format,"id",G__104465):G__104465);
return frontend.handler.property.file.remove_property_when_file_based(repo,format,"custom_id",G__104465__$1);

})();
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,block,cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(((cljs.core.not(keep_uuid_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","_refs","block/_refs",830218531)], null):cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","meta","block/meta",1064819153)], 0))),(function (){var G__104467 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.Keyword("block","title","block/title",710445684),new_content__$1], null);
var G__104467__$1 = (((!(db_based_QMARK_)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__104467,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(keep_uuid_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"custom_id","custom_id",834948303),new cljs.core.Keyword(null,"custom-id","custom-id",-615733336)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([exclude_properties], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","format","block/format",-1212045901),format], 0)):G__104467);
if((!(db_based_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__104467__$1,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block),cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(keep_uuid_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092)], null)),exclude_properties)));
} else {
return G__104467__$1;
}
})()], 0));
});
frontend.handler.editor.edit_last_block_after_inserted_BANG_ = (function frontend$handler$editor$edit_last_block_after_inserted_BANG_(result){
var G__104468 = (function (){
var temp__5804__auto__ = cljs.core.last(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(result));
if(cljs.core.truth_(temp__5804__auto__)){
var last_block = temp__5804__auto__;
frontend.handler.editor.clear_when_saved_BANG_();

var last_block_SINGLEQUOTE_ = (function (){var G__104469 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(last_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104469) : frontend.db.entity.call(null,G__104469));
})();
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(last_block_SINGLEQUOTE_,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,last_block_SINGLEQUOTE_,new cljs.core.Keyword(null,"max","max",61366548)));
} else {
return null;
}
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__104468) : frontend.util.schedule.call(null,G__104468));
});
frontend.handler.editor.nested_blocks = (function frontend$handler$editor$nested_blocks(blocks){
var ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks));
return (!((cljs.core.some((function (p1__104470_SHARP_){
var G__104472 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(p1__104470_SHARP_));
return (ids.cljs$core$IFn$_invoke$arity$1 ? ids.cljs$core$IFn$_invoke$arity$1(G__104472) : ids.call(null,G__104472));
}),blocks) == null)));
});
/**
 * Given a vec of blocks, insert them into the target page.
 * keep-uuid?: if true, keep the uuid provided in the block structure.
 */
frontend.handler.editor.paste_blocks = (function frontend$handler$editor$paste_blocks(blocks,p__104473){
var map__104474 = p__104473;
var map__104474__$1 = cljs.core.__destructure_map(map__104474);
var content_update_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"content-update-fn","content-update-fn",132456615));
var exclude_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104474__$1,new cljs.core.Keyword(null,"exclude-properties","exclude-properties",1449787201),cljs.core.PersistentVector.EMPTY);
var target_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"target-block","target-block",348392017));
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var revert_cut_txs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"revert-cut-txs","revert-cut-txs",1919904845));
var skip_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"skip-empty-target?","skip-empty-target?",-1452855908));
var ops_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104474__$1,new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419));
var editing_block = (function (){var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var editing_block = temp__5804__auto__;
var G__104475 = (function (){var G__104476 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104476) : frontend.db.entity.call(null,G__104476));
})();
if((G__104475 == null)){
return null;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__104475,new cljs.core.Keyword("block","title","block/title",710445684),frontend.state.get_edit_content());
}
} else {
return null;
}
})();
var has_unsaved_edits = (function (){var and__5000__auto__ = editing_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__104477 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(editing_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104477) : frontend.db.entity.call(null,G__104477));
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
var block = (function (){var G__104478 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104478) : frontend.db.entity.call(null,G__104478));
})();
var page = (cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block))?block:(cljs.core.truth_(target_block__$1)?new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__104479 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104479) : frontend.db.entity.call(null,G__104479));
})()):null));
var empty_target_QMARK_ = ((skip_empty_target_QMARK_ === true)?false:clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1)));
var paste_nested_blocks_QMARK_ = frontend.handler.editor.nested_blocks(blocks);
var target_block_has_children_QMARK_ = (function (){var G__104480 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__104480) : frontend.db.has_children_QMARK_.call(null,G__104480));
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
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__104481 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104481) : frontend.db.entity.call(null,G__104481));
})());
}
})():target_block__$1);
var sibling_QMARK___$1 = ((((paste_nested_blocks_QMARK_) && (empty_target_QMARK_)))?cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block_SINGLEQUOTE_),new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$1)):(((!((sibling_QMARK_ == null))))?sibling_QMARK_:(cljs.core.truth_(target_block_has_children_QMARK_)?false:true
)));
var transact_blocks_BANG_ = (function (){
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
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
var _STAR_outliner_ops_STAR__orig_val__104482 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104483 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104483);

try{if(cljs.core.truth_(target_block_SINGLEQUOTE_)){
var format_105146 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(target_block_SINGLEQUOTE_,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var repo_105147 = frontend.state.get_current_repo();
var blocks_SINGLEQUOTE__105148 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
return frontend.handler.editor.paste_block_cleanup(repo_105147,block__$1,page,exclude_properties,format_105146,content_update_fn,keep_uuid_QMARK_);
}),blocks);
frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE__105148,target_block_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste","paste",1975741548),new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK_,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_], null));
} else {
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),revert_cut_txs], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),revert_cut_txs], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104482);
}}
});
if(cljs.core.truth_(ops_only_QMARK_)){
return transact_blocks_BANG_();
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(has_unsaved_edits)?(function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.handler.editor.outliner_save_block_BANG_(editing_block);
} else {
var _STAR_outliner_ops_STAR__orig_val__104486 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104487 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104487);

try{frontend.handler.editor.outliner_save_block_BANG_(editing_block);

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104486);
}}
})():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(transact_blocks_BANG_()),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_block_op_type_BANG_(null)),(function (___41611__auto__){
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
frontend.handler.editor.insert_block_tree = (function frontend$handler$editor$insert_block_tree(tree_vec,format,p__104488){
var map__104489 = p__104488;
var map__104489__$1 = cljs.core.__destructure_map(map__104489);
var opts = map__104489__$1;
var target_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104489__$1,new cljs.core.Keyword(null,"target-block","target-block",348392017));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104489__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var repo = frontend.state.get_current_repo();
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(target_block));
var page_name = (function (){var G__104490 = page_id;
var G__104490__$1 = (((G__104490 == null))?null:(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104490) : frontend.db.entity.call(null,G__104490)));
if((G__104490__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(G__104490__$1);
}
})();
var blocks = frontend.handler.editor.block_tree__GT_blocks(repo,tree_vec,format,keep_uuid_QMARK_,page_name);
var blocks__$1 = logseq.graph_parser.block.with_parent_and_order(page_id,blocks);
var block_refs = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (ref){
return ((cljs.core.vector_QMARK_(ref)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))));
}),cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks__$1], 0))));
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
if(cljs.core.seq(block_refs)){
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__104491){
var vec__104492 = p__104491;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104492,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104492,(1),null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_refs));
} else {
}

return frontend.handler.editor.paste_blocks(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419),true], null)], 0)));
} else {
var _STAR_outliner_ops_STAR__orig_val__104495 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104496 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104496);

try{if(cljs.core.seq(block_refs)){
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__104497){
var vec__104498 = p__104497;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104498,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104498,(1),null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_refs));
} else {
}

frontend.handler.editor.paste_blocks(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops-only?","ops-only?",389405419),true], null)], 0)));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste-blocks","paste-blocks",538514211)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"paste-blocks","paste-blocks",538514211)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104495);
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
var G__104502 = arguments.length;
switch (G__104502) {
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

(frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (element_id,db_id,p__104503){
var map__104504 = p__104503;
var map__104504__$1 = cljs.core.__destructure_map(map__104504);
var opts = map__104504__$1;
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104504__$1,new cljs.core.Keyword(null,"target","target",253001721));
var repo = frontend.state.get_current_repo();
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var blocks = (function (){var G__104505 = repo;
var G__104506 = block_uuid;
var G__104507 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null);
return (frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$3 ? frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$3(G__104505,G__104506,G__104507) : frontend.db.get_block_and_children.call(null,G__104505,G__104506,G__104507));
})();
var sorted_blocks = ((db_QMARK_)?(function (){var blocks_SINGLEQUOTE_ = cljs.core.rest(blocks);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(blocks_SINGLEQUOTE_),new cljs.core.Keyword("logseq.property","used-template","logseq.property/used-template",-980369906),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)),cljs.core.rest(blocks_SINGLEQUOTE_));
})():cljs.core.cons(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.first(blocks),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),cljs.core.dissoc,new cljs.core.Keyword(null,"template","template",-702405684)),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),(function (keys){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"template","template",-702405684),null], null), null),keys));
})),cljs.core.rest(blocks)));
var blocks__$1 = ((db_QMARK_)?sorted_blocks:((template_including_parent_QMARK_)?sorted_blocks:cljs.core.drop.cljs$core$IFn$_invoke$arity$2((1),sorted_blocks)
));
if(cljs.core.truth_(element_id)){
var G__104508_105202 = element_id;
var G__104509_105203 = "";
var G__104510_105204 = format;
var G__104511_105205 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078),frontend.commands.command_trigger], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__104508_105202,G__104509_105203,G__104510_105204,G__104511_105205) : frontend.handler.editor.insert_command_BANG_.call(null,G__104508_105202,G__104509_105203,G__104510_105204,G__104511_105205));
} else {
}

var exclude_properties = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"template","template",-702405684),new cljs.core.Keyword(null,"template-including-parent","template-including-parent",1449989665)], null);
var content_update_fn = (function (content){
return frontend.template.resolve_dynamic_template_BANG_(frontend.handler.property.file.remove_property_when_file_based(repo,format,"template-including-parent",frontend.handler.property.file.remove_property_when_file_based(repo,format,"template",content)));
});
var page = (cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block__$1))?block__$1:(cljs.core.truth_(target__$1)?new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__104512 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104512) : frontend.db.entity.call(null,G__104512));
})()):null));
var blocks_SINGLEQUOTE_ = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?blocks__$1:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$2){
return frontend.handler.editor.paste_block_cleanup(repo,block__$2,page,exclude_properties,format,content_update_fn,false);
}),blocks__$1));
var sibling_QMARK_ = new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060).cljs$core$IFn$_invoke$arity$1(opts);
var sibling_QMARK__SINGLEQUOTE_ = (((!((sibling_QMARK_ == null))))?sibling_QMARK_:(cljs.core.truth_((function (){var G__104513 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target__$1);
return (frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1(G__104513) : frontend.db.has_children_QMARK_.call(null,G__104513));
})())?false:true
));
if(cljs.core.seq(blocks_SINGLEQUOTE_)){
try{return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
if(clojure.string.blank_QMARK_(frontend.state.get_edit_content())){
} else {
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}

return frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE_,target__$1,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597),true], 0)));
} else {
var _STAR_outliner_ops_STAR__orig_val__104517 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104518 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104518);

try{if(clojure.string.blank_QMARK_(frontend.state.get_edit_content())){
} else {
frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}

frontend.modules.outliner.op.insert_blocks_BANG_(blocks_SINGLEQUOTE_,target__$1,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597),true], 0)));

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"created-from-journal-template?","created-from-journal-template?",-2127356314),journal_QMARK_], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"created-from-journal-template?","created-from-journal-template?",-2127356314),journal_QMARK_], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104517);
}}
})()),(function (result){
return promesa.protocols._promise((cljs.core.truth_(result)?frontend.handler.editor.edit_last_block_after_inserted_BANG_(result):null));
}));
}));
}catch (e104514){var e = e104514;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.content","p.content",-1435376888),(function (){var G__104515 = "Template insert error: %s";
var G__104516 = e.message;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__104515,G__104516) : frontend.util.format.call(null,G__104515,G__104516));
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
var map__104519 = frontend.handler.editor.get_searching_property(input);
var map__104519__$1 = cljs.core.__destructure_map(map__104519);
var end_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104519__$1,new cljs.core.Keyword(null,"end-index","end-index",1056180246));
var searching_property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104519__$1,new cljs.core.Keyword(null,"searching-property","searching-property",495243376));
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
frontend.handler.editor.last_top_level_child_QMARK_ = (function frontend$handler$editor$last_top_level_child_QMARK_(p__104521,block){
var map__104522 = p__104521;
var map__104522__$1 = cljs.core.__destructure_map(map__104522);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104522__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_(id)){
var temp__5804__auto__ = (function (){var temp__5802__auto__ = cljs.core.parse_uuid(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
if(cljs.core.truth_(temp__5802__auto__)){
var id_SINGLEQUOTE_ = temp__5802__auto__;
var G__104523 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_SINGLEQUOTE_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104523) : frontend.db.entity.call(null,G__104523));
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
var G__104525 = arguments.length;
switch (G__104525) {
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
var map__104526 = frontend.handler.editor.get_state();
var map__104526__$1 = cljs.core.__destructure_map(map__104526);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104526__$1,new cljs.core.Keyword(null,"block","block",664686210));
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
var G__104527 = property_key;
switch (G__104527) {
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
var G__104528_105229 = input;
var G__104529_105230 = frontend.util.cursor.line_beginning_pos(input);
var G__104530_105231 = (frontend.util.cursor.line_end_pos(input) + (1));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(G__104528_105229,G__104529_105230,G__104530_105231) : frontend.handler.editor.delete_and_update.call(null,G__104528_105229,G__104529_105230,G__104530_105231));

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
frontend.handler.editor.toggle_list_checkbox = (function frontend$handler$editor$toggle_list_checkbox(p__104534,item_content){
var map__104535 = p__104534;
var map__104535__$1 = cljs.core.__destructure_map(map__104535);
var block = map__104535__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104535__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var toggle_fn = (function (m,x_mark){
var G__104536 = clojure.string.lower_case(x_mark);
switch (G__104536) {
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
var map__104538 = frontend.handler.editor.get_state();
var map__104538__$1 = cljs.core.__destructure_map(map__104538);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104538__$1,new cljs.core.Keyword(null,"block","block",664686210));
if(cljs.core.truth_(block)){
var input = frontend.state.get_input();
var temp__5804__auto__ = frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var map__104539 = item;
var map__104539__$1 = cljs.core.__destructure_map(map__104539);
var full_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"full-content","full-content",-817477443));
var indent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"indent","indent",-148200125));
var bullet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"bullet","bullet",726988937));
var checkbox = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
var ordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"ordered","ordered",1187041426));
var _ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104539__$1,new cljs.core.Keyword(null,"_","_",1453416199));
var next_bullet = (cljs.core.truth_(ordered)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1((bullet + (1))),"."].join(''):bullet);
var checkbox__$1 = (cljs.core.truth_(checkbox)?"[ ] ":null);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(full_content),((cljs.core.truth_(ordered)?(((cljs.core.str.cljs$core$IFn$_invoke$arity$1(bullet)).length) + (2)):(2)) + (cljs.core.truth_(checkbox__$1)?((checkbox__$1).length):null)))) && (clojure.string.includes_QMARK_(input.value,"\n")))){
var G__104540 = input;
var G__104541 = frontend.util.cursor.line_beginning_pos(input);
var G__104542 = frontend.util.cursor.line_end_pos(input);
return (frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(G__104540,G__104541,G__104542) : frontend.handler.editor.delete_and_update.call(null,G__104540,G__104541,G__104542));
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
frontend.handler.editor.toggle_page_reference_embed = (function frontend$handler$editor$toggle_page_reference_embed(parent_id){
var map__104546 = frontend.handler.editor.get_state();
var map__104546__$1 = cljs.core.__destructure_map(map__104546);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104546__$1,new cljs.core.Keyword(null,"block","block",664686210));
if(cljs.core.truth_(block)){
var input = frontend.state.get_input();
var new_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var page_ref_fn = (function (bounds,backward_pos){
return frontend.commands.simple_insert_BANG_(parent_id,bounds,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),backward_pos,new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015),(function (_,___$1,___$2){
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),new_pos], null));

return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null));
})], null));
});
frontend.state.clear_editor_action_BANG_();

var selection = frontend.handler.editor.get_selection_and_format();
var map__104547 = selection;
var map__104547__$1 = cljs.core.__destructure_map(map__104547);
var selection_start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104547__$1,new cljs.core.Keyword(null,"selection-start","selection-start",-888859581));
var selection_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104547__$1,new cljs.core.Keyword(null,"selection-end","selection-end",696987835));
var selection__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104547__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
if(cljs.core.truth_(selection__$1)){
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(input,selection_start,selection_end) : frontend.handler.editor.delete_and_update.call(null,input,selection_start,selection_end));

return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(selection__$1) : frontend.util.ref.__GT_page_ref.call(null,selection__$1)));
} else {
var temp__5802__auto__ = frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5802__auto__)){
var embed_ref = temp__5802__auto__;
var map__104548 = embed_ref;
var map__104548__$1 = cljs.core.__destructure_map(map__104548);
var raw_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104548__$1,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159));
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104548__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104548__$1,new cljs.core.Keyword(null,"end","end",-268185958));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(input,start,end) : frontend.handler.editor.delete_and_update.call(null,input,start,end));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((5),cljs.core.count(raw_content))){
return page_ref_fn(logseq.common.util.page_ref.left_and_right_brackets,(2));
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(raw_content);
}
} else {
var temp__5802__auto____$1 = frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5802__auto____$1)){
var page_ref = temp__5802__auto____$1;
var map__104549 = page_ref;
var map__104549__$1 = cljs.core.__destructure_map(map__104549);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104549__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104549__$1,new cljs.core.Keyword(null,"end","end",-268185958));
var full_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104549__$1,new cljs.core.Keyword(null,"full-content","full-content",-817477443));
var raw_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104549__$1,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(input,start,end) : frontend.handler.editor.delete_and_update.call(null,input,start,end));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(raw_content,"")){
return page_ref_fn("{{embed [[]]}}",(4));
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed %s}}",full_content) : frontend.util.format.call(null,"{{embed %s}}",full_content)));
}
} else {
return page_ref_fn(logseq.common.util.page_ref.left_and_right_brackets,(2));
}
}
}
} else {
return null;
}
});
frontend.handler.editor.toggle_block_reference_embed = (function frontend$handler$editor$toggle_block_reference_embed(parent_id){
var map__104552 = frontend.handler.editor.get_state();
var map__104552__$1 = cljs.core.__destructure_map(map__104552);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104552__$1,new cljs.core.Keyword(null,"block","block",664686210));
if(cljs.core.truth_(block)){
var input = frontend.state.get_input();
var new_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var block_ref_fn = (function (bounds,backward_pos){
return frontend.commands.simple_insert_BANG_(parent_id,bounds,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),backward_pos,new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015),(function (_,___$1,___$2){
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),new_pos], null));

return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652)], null));
})], null));
});
frontend.state.clear_editor_action_BANG_();

var temp__5802__auto__ = frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5802__auto__)){
var embed_ref = temp__5802__auto__;
var map__104553 = embed_ref;
var map__104553__$1 = cljs.core.__destructure_map(map__104553);
var raw_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104553__$1,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159));
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104553__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104553__$1,new cljs.core.Keyword(null,"end","end",-268185958));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(input,start,end) : frontend.handler.editor.delete_and_update.call(null,input,start,end));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((5),cljs.core.count(raw_content))){
return block_ref_fn(logseq.common.util.block_ref.left_and_right_parens,(2));
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(raw_content);
}
} else {
var temp__5802__auto____$1 = frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5802__auto____$1)){
var page_ref = temp__5802__auto____$1;
var map__104555 = page_ref;
var map__104555__$1 = cljs.core.__destructure_map(map__104555);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104555__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104555__$1,new cljs.core.Keyword(null,"end","end",-268185958));
var full_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104555__$1,new cljs.core.Keyword(null,"full-content","full-content",-817477443));
var raw_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104555__$1,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159));
(frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.delete_and_update.cljs$core$IFn$_invoke$arity$3(input,start,end) : frontend.handler.editor.delete_and_update.call(null,input,start,end));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(raw_content,"")){
return block_ref_fn("{{embed (())}}",(4));
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed %s}}",full_content) : frontend.util.format.call(null,"{{embed %s}}",full_content)));
}
} else {
return block_ref_fn(logseq.common.util.block_ref.left_and_right_parens,(2));
}
}
} else {
return null;
}
});
frontend.handler.editor.keydown_new_block = (function frontend$handler$editor$keydown_new_block(state){
if(cljs.core.truth_(frontend.handler.editor.auto_complete_QMARK_())){
return null;
} else {
var map__104556 = frontend.handler.editor.get_state();
var map__104556__$1 = cljs.core.__destructure_map(map__104556);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104556__$1,new cljs.core.Keyword(null,"block","block",664686210));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104556__$1,new cljs.core.Keyword(null,"config","config",994861415));
if(cljs.core.truth_(block)){
var block__$1 = (function (){var G__104557 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104557) : frontend.db.entity.call(null,G__104557));
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
var G__104558 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(thing_at_point);
switch (G__104558) {
case "markup":
var right_bound = new cljs.core.Keyword(null,"bounds","bounds",1691609455).cljs$core$IFn$_invoke$arity$1(thing_at_point);
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,right_bound,pos) + cljs.core.count(right_bound)));

break;
case "admonition-block":
return frontend.handler.editor.keydown_new_line();

break;
case "source-block":
frontend.handler.editor.keydown_new_line();

var G__104559 = new cljs.core.Keyword(null,"action","action",-811238024).cljs$core$IFn$_invoke$arity$1(thing_at_point);
var G__104559__$1 = (((G__104559 instanceof cljs.core.Keyword))?G__104559.fqn:null);
switch (G__104559__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104558)].join('')));

}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = clojure.string.blank_QMARK_(content);
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.handler.editor.own_order_number_list_QMARK_(block__$1);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not((function (){var G__104560 = frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));
if((G__104560 == null)){
return null;
} else {
return frontend.handler.editor.own_order_number_list_QMARK_(G__104560);
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
var f = (function (){var G__104561 = direction;
var G__104561__$1 = (((G__104561 instanceof cljs.core.Keyword))?G__104561.fqn:null);
switch (G__104561__$1) {
case "up":
return cljs.core.last;

break;
case "down":
return cljs.core.first;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104561__$1)].join('')));

}
})();
var container = (cljs.core.truth_((function (){var G__104562 = document.activeElement;
if((G__104562 == null)){
return null;
} else {
return G__104562.querySelector(".blocks-container");
}
})())?document.activeElement:document.body);
var block = (function (){var G__104563 = frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$1(container);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__104563) : f.call(null,G__104563));
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
var selected = (function (){var G__104564 = direction;
var G__104564__$1 = (((G__104564 instanceof cljs.core.Keyword))?G__104564.fqn:null);
switch (G__104564__$1) {
case "up":
return cljs.core.first(selected_blocks);

break;
case "down":
return cljs.core.last(selected_blocks);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104564__$1)].join('')));

}
})();
var f = (function (){var G__104565 = direction;
var G__104565__$1 = (((G__104565 instanceof cljs.core.Keyword))?G__104565.fqn:null);
switch (G__104565__$1) {
case "up":
return frontend.util.get_prev_block_non_collapsed;

break;
case "down":
return frontend.util.get_next_block_non_collapsed;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104565__$1)].join('')));

}
})();
var sibling_block = (function (){var G__104566 = selected;
var G__104567 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390),true], null);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__104566,G__104567) : f.call(null,G__104566,G__104567));
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
var G__104568 = document.activeElement;
if((G__104568 == null)){
return null;
} else {
return dommy.core.has_class_QMARK_(G__104568,"jtrigger");
}
});
frontend.handler.editor.property_value_node_QMARK_ = (function frontend$handler$editor$property_value_node_QMARK_(node){
var G__104569 = node;
if((G__104569 == null)){
return null;
} else {
return dommy.core.has_class_QMARK_(G__104569,"property-value-container");
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
var f = (function (){var G__104571 = direction;
var G__104571__$1 = (((G__104571 instanceof cljs.core.Keyword))?G__104571.fqn:null);
switch (G__104571__$1) {
case "up":
return frontend.util.get_prev_block_non_collapsed;

break;
case "down":
return frontend.util.get_next_block_non_collapsed;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104571__$1)].join('')));

}
})();
var current_block = frontend.util.rec_get_node(input_or_active_element,"ls-block");
var sibling_block = (function (){var G__104572 = current_block;
var G__104573 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true], null);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__104572,G__104573) : f.call(null,G__104572,G__104573));
})();
var map__104570 = frontend.state.get_edit_block();
var map__104570__$1 = cljs.core.__destructure_map(map__104570);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104570__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104570__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104570__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
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
var container_id = (function (){var G__104574 = dommy.core.attr(sibling_block__$1,"containerid");
if((G__104574 == null)){
return null;
} else {
return parseInt(G__104574);
}
})();
var value = frontend.state.get_edit_content();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = uuid;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(frontend.state.block_component_editing_QMARK_())) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.clean_content_BANG_(repo,format__$1,title),clojure.string.trim(value))));
} else {
return and__5000__auto__;
}
})())?frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,uuid,value):null)),(function (___41611__auto__){
return promesa.protocols._promise(((dommy.core.has_class_QMARK_(sibling_block__$1,"block-add-button"))?sibling_block__$1.click():(cljs.core.truth_(property_value_container_QMARK_)?frontend.handler.editor.focus_trigger(current_block,sibling_block__$1):(function (){var new_uuid = cljs.core.uuid(sibling_block_id);
var block = (function (){var G__104575 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104575) : frontend.db.entity.call(null,G__104575));
})();
var G__104576 = block;
var G__104577 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(move_opts);
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
var G__104578 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"direction","direction",-633359395),direction], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__104576,G__104577,G__104578) : frontend.handler.editor.edit_block_BANG_.call(null,G__104576,G__104577,G__104578));
})()
)));
}));
}));
} else {
var G__104579 = direction;
var G__104579__$1 = (((G__104579 instanceof cljs.core.Keyword))?G__104579.fqn:null);
switch (G__104579__$1) {
case "up":
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(0));

break;
case "down":
return frontend.util.cursor.move_cursor_to_end(input);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104579__$1)].join('')));

}
}
} else {
return null;
}
});
frontend.handler.editor.keydown_up_down_handler = (function frontend$handler$editor$keydown_up_down_handler(direction,p__104580){
var map__104581 = p__104580;
var map__104581__$1 = cljs.core.__destructure_map(map__104581);
var move_opts = map__104581__$1;
var _pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104581__$1,new cljs.core.Keyword(null,"_pos","_pos",-761936726));
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
frontend.handler.editor.move_to_block_when_cross_boundary = (function frontend$handler$editor$move_to_block_when_cross_boundary(direction,p__104582){
var map__104583 = p__104582;
var map__104583__$1 = cljs.core.__destructure_map(map__104583);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104583__$1,new cljs.core.Keyword(null,"block","block",664686210));
var up_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"left","left",-399115937),direction);
var pos = ((up_QMARK_)?new cljs.core.Keyword(null,"max","max",61366548):(0));
var map__104584 = (function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_edit_block();
}
})();
var map__104584__$1 = cljs.core.__destructure_map(map__104584);
var block__$1 = map__104584__$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104584__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104584__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
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
var content_105240 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
var value_105241 = frontend.state.get_edit_content();
if(cljs.core.truth_((function (){var and__5000__auto__ = value_105241;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.clean_content_BANG_(repo,format__$1,content_105240),clojure.string.trim(value_105241));
} else {
return and__5000__auto__;
}
})())){
frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,uuid,value_105241);
} else {
}

var sibling_block_id = dommy.core.attr(sibling_block__$1,"blockid");
if(cljs.core.truth_(sibling_block_id)){
var container_id = (function (){var G__104585 = dommy.core.attr(sibling_block__$1,"containerid");
if((G__104585 == null)){
return null;
} else {
return parseInt(G__104585);
}
})();
var block__$2 = (function (){var G__104586 = repo;
var G__104587 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(sibling_block_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__104586,G__104587) : frontend.db.entity.call(null,G__104586,G__104587));
})();
var G__104588 = block__$2;
var G__104589 = pos;
var G__104590 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__104588,G__104589,G__104590) : frontend.handler.editor.edit_block_BANG_.call(null,G__104588,G__104589,G__104590));
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
var block = (function (){var G__104591 = frontend.state.get_edit_block();
var G__104591__$1 = (((G__104591 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__104591));
if((G__104591__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104591__$1) : frontend.db.entity.call(null,G__104591__$1));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var G__104592 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104592) : frontend.db.entity.call(null,G__104592));
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
var block__$1 = (function (){var G__104593 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104593) : frontend.db.entity.call(null,G__104593));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
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
var map__104594 = frontend.handler.editor.get_state();
var map__104594__$1 = cljs.core.__destructure_map(map__104594);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104594__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104594__$1,new cljs.core.Keyword(null,"block-container","block-container",-15068235));
if(cljs.core.truth_(block)){
var node = block_container;
var prev_container_id = frontend.handler.editor.get_node_container_id(node);
var container_id = frontend.handler.editor.get_new_container_id((cljs.core.truth_(indent_QMARK_)?new cljs.core.Keyword(null,"indent","indent",-148200125):new cljs.core.Keyword(null,"outdent","outdent",467209411)),cljs.core.PersistentArrayMap.EMPTY);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.block.indent_outdent_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),indent_QMARK_,frontend.handler.editor.save_current_block_BANG_)),(function (___41611__auto__){
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
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"Backspace")) && ((((pos === (0))) && (clojure.string.blank_QMARK_(window.getSelection().toString())))));
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.editor.keydown_backspace_handler(false,e);
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
var vec__104595 = (cljs.core.truth_((function (){var and__5000__auto__ = c;
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
var key_code__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104595,(0),null);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104595,(1),null);
var code = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104595,(2),null);
var is_processed_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104595,(3),null);
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
var command_105242 = frontend.handler.editor.get_last_command(input);
var matched_commands_105243 = frontend.handler.editor.get_matched_commands(command_105242);
if(cljs.core.seq(matched_commands_105243)){
frontend.commands.set_matched_commands_BANG_(command_105242,matched_commands_105243);
} else {
if(((cljs.core.count(command_105242) - cljs.core.count(cljs.core.deref(frontend.commands._STAR_latest_matched_command))) > (2))){
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
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-search","block-search",-897517253),frontend.state.sub(new cljs.core.Keyword("editor","action","editor/action",449993861)))){
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

return frontend.util.scroll_editor_cursor(input);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.util.ref.__GT_page_ref.call(null,block_id)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"graph","graph",1558099509),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"blocks","blocks",-610462153),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block)], null)], null),new cljs.core.Keyword(null,"embed-block?","embed-block?",402074593),true], null)], 0)));
}));
}));
} else {
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__104598_SHARP_){
return ["{{embed ((",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__104598_SHARP_),"))}}"].join('');
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
var G__104599 = document.activeElement;
var G__104599__$1 = (((G__104599 == null))?null:G__104599.closest(".ls-preview-popup"));
var G__104599__$2 = (((G__104599__$1 == null))?null:(G__104599__$1 == null));
if((G__104599__$2 == null)){
return null;
} else {
return cljs.core.not(G__104599__$2);
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
var vec__104600 = (function (){var G__104603 = frontend.util.get_selection_direction(input);
switch (G__104603) {
case "backward":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_end,selected_start], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_start,selected_end], null);

}
})();
var anchor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104600,(0),null);
var cursor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104600,(1),null);
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
var seq__104604 = cljs.core.seq(frontend.state.get_selection_block_ids());
var chunk__104605 = null;
var count__104606 = (0);
var i__104607 = (0);
while(true){
if((i__104607 < count__104606)){
var id = chunk__104605.cljs$core$IIndexed$_nth$arity$2(null,i__104607);
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),id,new cljs.core.Keyword(null,"block","block",664686210));


var G__105251 = seq__104604;
var G__105252 = chunk__104605;
var G__105253 = count__104606;
var G__105254 = (i__104607 + (1));
seq__104604 = G__105251;
chunk__104605 = G__105252;
count__104606 = G__105253;
i__104607 = G__105254;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104604);
if(temp__5804__auto__){
var seq__104604__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104604__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104604__$1);
var G__105255 = cljs.core.chunk_rest(seq__104604__$1);
var G__105256 = c__5525__auto__;
var G__105257 = cljs.core.count(c__5525__auto__);
var G__105258 = (0);
seq__104604 = G__105255;
chunk__104605 = G__105256;
count__104606 = G__105257;
i__104607 = G__105258;
continue;
} else {
var id = cljs.core.first(seq__104604__$1);
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),id,new cljs.core.Keyword(null,"block","block",664686210));


var G__105259 = cljs.core.next(seq__104604__$1);
var G__105260 = null;
var G__105261 = (0);
var G__105262 = (0);
seq__104604 = G__105259;
chunk__104605 = G__105260;
count__104606 = G__105261;
i__104607 = G__105262;
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
var f = (function (){var G__104608 = direction;
var G__104608__$1 = (((G__104608 instanceof cljs.core.Keyword))?G__104608.fqn:null);
switch (G__104608__$1) {
case "left":
return cljs.core.first;

break;
case "right":
return cljs.core.last;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104608__$1)].join('')));

}
})();
var node = (function (){var G__104609 = selected_blocks;
if((G__104609 == null)){
return null;
} else {
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__104609) : f.call(null,G__104609));
}
})();
var temp__5804__auto__ = (function (){var G__104610 = node;
var G__104610__$1 = (((G__104610 == null))?null:dommy.core.attr(G__104610,"blockid"));
if((G__104610__$1 == null)){
return null;
} else {
return cljs.core.uuid(G__104610__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
frontend.util.stop(e);

var block = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
var left_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"left","left",-399115937));
var opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),(function (){var G__104611 = node;
var G__104611__$1 = (((G__104611 == null))?null:dommy.core.attr(G__104611,"containerid"));
if((G__104611__$1 == null)){
return null;
} else {
return cljs.core.parse_long(G__104611__$1);
}
})(),new cljs.core.Keyword(null,"event","event",301435442),e], null);
var G__104612 = block;
var G__104613 = ((left_QMARK_)?(0):new cljs.core.Keyword(null,"max","max",61366548));
var G__104614 = opts;
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__104612,G__104613,G__104614) : frontend.handler.editor.edit_block_BANG_.call(null,G__104612,G__104613,G__104614));
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
var G__104615 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e);
return (attributes.cljs$core$IFn$_invoke$arity$1 ? attributes.cljs$core$IFn$_invoke$arity$1(G__104615) : attributes.call(null,G__104615));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(class_properties,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.db.common.entity_plus.entity_memoized,db),new cljs.core.Keyword("block.temp","property-keys","block.temp/property-keys",2093695024).cljs$core$IFn$_invoke$arity$1(block)))))));
var or__5002__auto__ = cljs.core.seq(properties);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var G__104616 = logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__104617 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__104616,G__104617) : logseq.db.class_instance_QMARK_.call(null,G__104616,G__104617));
}
});
frontend.handler.editor.collapsable_QMARK_ = (function frontend$handler$editor$collapsable_QMARK_(var_args){
var G__104619 = arguments.length;
switch (G__104619) {
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

(frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,p__104620){
var map__104621 = p__104620;
var map__104621__$1 = cljs.core.__destructure_map(map__104621);
var semantic_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104621__$1,new cljs.core.Keyword(null,"semantic?","semantic?",-1258468577),false);
var ignore_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104621__$1,new cljs.core.Keyword(null,"ignore-children?","ignore-children?",1993539421),false);
if(cljs.core.truth_(block_id)){
var repo = frontend.state.get_current_repo();
var temp__5802__auto__ = (function (){var G__104622 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104622) : frontend.db.entity.call(null,G__104622));
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
frontend.handler.editor._LT_all_blocks_with_level = (function frontend$handler$editor$_LT_all_blocks_with_level(p__104623){
var map__104624 = p__104623;
var map__104624__$1 = cljs.core.__destructure_map(map__104624);
var collapse_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104624__$1,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),false);
var expanded_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104624__$1,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),false);
var incremental_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104624__$1,new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),true);
var root_block = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104624__$1,new cljs.core.Keyword(null,"root-block","root-block",-645043721),null);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104624__$1,new cljs.core.Keyword(null,"page","page",849072397));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page_id)?result:cljs.core.cons((function (){var G__104625 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104625) : frontend.db.entity.call(null,G__104625));
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
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var G__104626 = blocks__$1;
var G__104626__$1 = (cljs.core.truth_(root_block__$1)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function frontend$handler$editor$_LT_all_blocks_with_level_$_find(root){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(root_block__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(root))){
return root;
} else {
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend$handler$editor$_LT_all_blocks_with_level_$_find,new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$2(root,cljs.core.PersistentVector.EMPTY)));
}
}),G__104626):G__104626);
var G__104626__$2 = (cljs.core.truth_(collapse_QMARK_)?clojure.walk.postwalk((function (b){
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
}),G__104626__$1):G__104626__$1);
var G__104626__$3 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (x){
return cljs.core.tree_seq(cljs.core.map_QMARK_,new cljs.core.Keyword("block","children","block/children",-1040716209),x);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__104626__$2], 0))
;
var G__104626__$4 = (cljs.core.truth_(expanded_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),G__104626__$3):G__104626__$3);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(x,new cljs.core.Keyword("block","children","block/children",-1040716209));
}),G__104626__$4);

})());
})():(function (){var G__104627 = blocks;
var G__104627__$1 = (cljs.core.truth_(collapse_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.util.collapsed_QMARK_,G__104627):G__104627);
var G__104627__$2 = (cljs.core.truth_(expanded_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),G__104627__$1):G__104627__$1);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__104627__$2);

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

var test_QMARK___49426__auto___105273 = frontend.util.node_test_QMARK_;
var ops__49427__auto___105274 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto___105275 = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto___105275);

if(cljs.core.truth_(ops__49427__auto___105274)){
var seq__104628_105276 = cljs.core.seq(block_ids__$1);
var chunk__104629_105277 = null;
var count__104630_105278 = (0);
var i__104631_105279 = (0);
while(true){
if((i__104631_105279 < count__104630_105278)){
var block_id_105280 = chunk__104629_105277.cljs$core$IIndexed$_nth$arity$2(null,i__104631_105279);
var temp__5804__auto___105281 = (function (){var G__104634 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105280], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104634) : frontend.db.entity.call(null,G__104634));
})();
if(cljs.core.truth_(temp__5804__auto___105281)){
var block_105282 = temp__5804__auto___105281;
var current_value_105283 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_105282));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_105283,value__$1)){
} else {
var block_105284__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105280,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_105284__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__105286 = seq__104628_105276;
var G__105287 = chunk__104629_105277;
var G__105288 = count__104630_105278;
var G__105289 = (i__104631_105279 + (1));
seq__104628_105276 = G__105286;
chunk__104629_105277 = G__105287;
count__104630_105278 = G__105288;
i__104631_105279 = G__105289;
continue;
} else {
var temp__5804__auto___105290 = cljs.core.seq(seq__104628_105276);
if(temp__5804__auto___105290){
var seq__104628_105291__$1 = temp__5804__auto___105290;
if(cljs.core.chunked_seq_QMARK_(seq__104628_105291__$1)){
var c__5525__auto___105292 = cljs.core.chunk_first(seq__104628_105291__$1);
var G__105293 = cljs.core.chunk_rest(seq__104628_105291__$1);
var G__105294 = c__5525__auto___105292;
var G__105295 = cljs.core.count(c__5525__auto___105292);
var G__105296 = (0);
seq__104628_105276 = G__105293;
chunk__104629_105277 = G__105294;
count__104630_105278 = G__105295;
i__104631_105279 = G__105296;
continue;
} else {
var block_id_105297 = cljs.core.first(seq__104628_105291__$1);
var temp__5804__auto___105298__$1 = (function (){var G__104635 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105297], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104635) : frontend.db.entity.call(null,G__104635));
})();
if(cljs.core.truth_(temp__5804__auto___105298__$1)){
var block_105300 = temp__5804__auto___105298__$1;
var current_value_105302 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_105300));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_105302,value__$1)){
} else {
var block_105303__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105297,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_105303__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__105305 = cljs.core.next(seq__104628_105291__$1);
var G__105306 = null;
var G__105307 = (0);
var G__105308 = (0);
seq__104628_105276 = G__105305;
chunk__104629_105277 = G__105306;
count__104630_105278 = G__105307;
i__104631_105279 = G__105308;
continue;
}
} else {
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__104636_105309 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104637_105310 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104637_105310);

try{var seq__104638_105311 = cljs.core.seq(block_ids__$1);
var chunk__104639_105312 = null;
var count__104640_105313 = (0);
var i__104641_105314 = (0);
while(true){
if((i__104641_105314 < count__104640_105313)){
var block_id_105315 = chunk__104639_105312.cljs$core$IIndexed$_nth$arity$2(null,i__104641_105314);
var temp__5804__auto___105317 = (function (){var G__104644 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105315], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104644) : frontend.db.entity.call(null,G__104644));
})();
if(cljs.core.truth_(temp__5804__auto___105317)){
var block_105318 = temp__5804__auto___105317;
var current_value_105319 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_105318));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_105319,value__$1)){
} else {
var block_105320__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105315,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_105320__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__105321 = seq__104638_105311;
var G__105322 = chunk__104639_105312;
var G__105323 = count__104640_105313;
var G__105324 = (i__104641_105314 + (1));
seq__104638_105311 = G__105321;
chunk__104639_105312 = G__105322;
count__104640_105313 = G__105323;
i__104641_105314 = G__105324;
continue;
} else {
var temp__5804__auto___105326 = cljs.core.seq(seq__104638_105311);
if(temp__5804__auto___105326){
var seq__104638_105327__$1 = temp__5804__auto___105326;
if(cljs.core.chunked_seq_QMARK_(seq__104638_105327__$1)){
var c__5525__auto___105331 = cljs.core.chunk_first(seq__104638_105327__$1);
var G__105332 = cljs.core.chunk_rest(seq__104638_105327__$1);
var G__105333 = c__5525__auto___105331;
var G__105334 = cljs.core.count(c__5525__auto___105331);
var G__105335 = (0);
seq__104638_105311 = G__105332;
chunk__104639_105312 = G__105333;
count__104640_105313 = G__105334;
i__104641_105314 = G__105335;
continue;
} else {
var block_id_105336 = cljs.core.first(seq__104638_105327__$1);
var temp__5804__auto___105337__$1 = (function (){var G__104645 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105336], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104645) : frontend.db.entity.call(null,G__104645));
})();
if(cljs.core.truth_(temp__5804__auto___105337__$1)){
var block_105338 = temp__5804__auto___105337__$1;
var current_value_105339 = cljs.core.boolean$(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block_105338));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_value_105339,value__$1)){
} else {
var block_105340__$1 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_105336,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),value__$1], null);
frontend.handler.editor.outliner_save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_105340__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null)], 0));
}
} else {
}


var G__105341 = cljs.core.next(seq__104638_105327__$1);
var G__105342 = null;
var G__105343 = (0);
var G__105344 = (0);
seq__104638_105311 = G__105341;
chunk__104639_105312 = G__105342;
count__104640_105313 = G__105343;
i__104641_105314 = G__105344;
continue;
}
} else {
}
}
break;
}

var r__49429__auto___105345 = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto___105273){
if(cljs.core.seq(r__49429__auto___105345)){
logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto___105345,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null));
} else {
}
} else {
if(cljs.core.seq(r__49429__auto___105345)){
var request_id__49430__auto___105346 = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto___105347 = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto___105345,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto___105346,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto___105348 = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto___105346,request__49431__auto___105347) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto___105346,request__49431__auto___105347));
} else {
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104636_105309);
}}

var seq__104646 = cljs.core.seq(block_ids__$1);
var chunk__104647 = null;
var count__104648 = (0);
var i__104649 = (0);
while(true){
if((i__104649 < count__104648)){
var block_id = chunk__104647.cljs$core$IIndexed$_nth$arity$2(null,i__104649);
frontend.state.set_collapsed_block_BANG_(block_id,value__$1);


var G__105350 = seq__104646;
var G__105351 = chunk__104647;
var G__105352 = count__104648;
var G__105353 = (i__104649 + (1));
seq__104646 = G__105350;
chunk__104647 = G__105351;
count__104648 = G__105352;
i__104649 = G__105353;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104646);
if(temp__5804__auto__){
var seq__104646__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104646__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104646__$1);
var G__105354 = cljs.core.chunk_rest(seq__104646__$1);
var G__105355 = c__5525__auto__;
var G__105356 = cljs.core.count(c__5525__auto__);
var G__105357 = (0);
seq__104646 = G__105354;
chunk__104647 = G__105355;
count__104648 = G__105356;
i__104649 = G__105357;
continue;
} else {
var block_id = cljs.core.first(seq__104646__$1);
frontend.state.set_collapsed_block_BANG_(block_id,value__$1);


var G__105358 = cljs.core.next(seq__104646__$1);
var G__105359 = null;
var G__105360 = (0);
var G__105361 = (0);
seq__104646 = G__105358;
chunk__104647 = G__105359;
count__104648 = G__105360;
i__104649 = G__105361;
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
var len__5726__auto___105362 = arguments.length;
var i__5727__auto___105363 = (0);
while(true){
if((i__5727__auto___105363 < len__5726__auto___105362)){
args__5732__auto__.push((arguments[i__5727__auto___105363]));

var G__105364 = (i__5727__auto___105363 + (1));
i__5727__auto___105363 = G__105364;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.editor.expand_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.editor.expand_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block_id,p__104652){
var map__104653 = p__104652;
var map__104653__$1 = cljs.core.__destructure_map(map__104653);
var skip_db_collpsing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104653__$1,new cljs.core.Keyword(null,"skip-db-collpsing?","skip-db-collpsing?",106617442));
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855),true], null)], 0))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = skip_db_collpsing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.editor.skip_collapsing_in_db_QMARK_();
}
})())?null:frontend.handler.editor.set_blocks_collapsed_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),false))),(function (___41611__auto____$1){
return promesa.protocols._promise(frontend.state.set_collapsed_block_BANG_(block_id,false));
}));
}));
}));
}));

(frontend.handler.editor.expand_block_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.editor.expand_block_BANG_.cljs$lang$applyTo = (function (seq104650){
var G__104651 = cljs.core.first(seq104650);
var seq104650__$1 = cljs.core.next(seq104650);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__104651,seq104650__$1);
}));

frontend.handler.editor.expand_BANG_ = (function frontend$handler$editor$expand_BANG_(var_args){
var G__104655 = arguments.length;
switch (G__104655) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var G__105368 = (level + (1));
level = G__105368;
continue;
} else {
var seq__104656 = cljs.core.seq(blocks_to_expand);
var chunk__104657 = null;
var count__104658 = (0);
var i__104659 = (0);
while(true){
if((i__104659 < count__104658)){
var map__104662 = chunk__104657.cljs$core$IIndexed$_nth$arity$2(null,i__104659);
var map__104662__$1 = cljs.core.__destructure_map(map__104662);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104662__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.expand_block_BANG_(uuid);


var G__105369 = seq__104656;
var G__105370 = chunk__104657;
var G__105371 = count__104658;
var G__105372 = (i__104659 + (1));
seq__104656 = G__105369;
chunk__104657 = G__105370;
count__104658 = G__105371;
i__104659 = G__105372;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104656);
if(temp__5804__auto__){
var seq__104656__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104656__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104656__$1);
var G__105375 = cljs.core.chunk_rest(seq__104656__$1);
var G__105376 = c__5525__auto__;
var G__105377 = cljs.core.count(c__5525__auto__);
var G__105378 = (0);
seq__104656 = G__105375;
chunk__104657 = G__105376;
count__104658 = G__105377;
i__104659 = G__105378;
continue;
} else {
var map__104663 = cljs.core.first(seq__104656__$1);
var map__104663__$1 = cljs.core.__destructure_map(map__104663);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104663__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.expand_block_BANG_(uuid);


var G__105379 = cljs.core.next(seq__104656__$1);
var G__105380 = null;
var G__105381 = (0);
var G__105382 = (0);
seq__104656 = G__105379;
chunk__104657 = G__105380;
count__104658 = G__105381;
i__104659 = G__105382;
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
var G__104665 = arguments.length;
switch (G__104665) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var G__105385 = (level - (1));
level = G__105385;
continue;
} else {
var seq__104666 = cljs.core.seq(blocks_to_collapse);
var chunk__104667 = null;
var count__104668 = (0);
var i__104669 = (0);
while(true){
if((i__104669 < count__104668)){
var map__104672 = chunk__104667.cljs$core$IIndexed$_nth$arity$2(null,i__104669);
var map__104672__$1 = cljs.core.__destructure_map(map__104672);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104672__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.collapse_block_BANG_(uuid);


var G__105386 = seq__104666;
var G__105387 = chunk__104667;
var G__105388 = count__104668;
var G__105389 = (i__104669 + (1));
seq__104666 = G__105386;
chunk__104667 = G__105387;
count__104668 = G__105388;
i__104669 = G__105389;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104666);
if(temp__5804__auto__){
var seq__104666__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104666__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104666__$1);
var G__105390 = cljs.core.chunk_rest(seq__104666__$1);
var G__105391 = c__5525__auto__;
var G__105392 = cljs.core.count(c__5525__auto__);
var G__105393 = (0);
seq__104666 = G__105390;
chunk__104667 = G__105391;
count__104668 = G__105392;
i__104669 = G__105393;
continue;
} else {
var map__104673 = cljs.core.first(seq__104666__$1);
var map__104673__$1 = cljs.core.__destructure_map(map__104673);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104673__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
frontend.handler.editor.collapse_block_BANG_(uuid);


var G__105394 = cljs.core.next(seq__104666__$1);
var G__105395 = null;
var G__105396 = (0);
var G__105397 = (0);
seq__104666 = G__105394;
chunk__104667 = G__105395;
count__104668 = G__105396;
i__104669 = G__105397;
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
var G__104676 = arguments.length;
switch (G__104676) {
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
var block__$1 = (function (){var G__104677 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104677) : frontend.db.entity.call(null,G__104677));
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
var block_ids_105399 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104674_SHARP_){
return cljs.core.uuid(dommy.core.attr(p1__104674_SHARP_,"blockid"));
}),frontend.handler.editor.get_selected_blocks());
var first_block_id_105400 = cljs.core.first(block_ids_105399);
if(cljs.core.truth_(first_block_id_105400)){
var first_block_105401 = (function (){var G__104678 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_block_id_105400], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104678) : frontend.db.entity.call(null,G__104678));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(first_block_105401))){
var seq__104679_105402 = cljs.core.seq(block_ids_105399);
var chunk__104680_105403 = null;
var count__104681_105404 = (0);
var i__104682_105405 = (0);
while(true){
if((i__104682_105405 < count__104681_105404)){
var block_id_105407 = chunk__104680_105403.cljs$core$IIndexed$_nth$arity$2(null,i__104682_105405);
frontend.handler.editor.expand_block_BANG_(block_id_105407);


var G__105408 = seq__104679_105402;
var G__105409 = chunk__104680_105403;
var G__105410 = count__104681_105404;
var G__105411 = (i__104682_105405 + (1));
seq__104679_105402 = G__105408;
chunk__104680_105403 = G__105409;
count__104681_105404 = G__105410;
i__104682_105405 = G__105411;
continue;
} else {
var temp__5804__auto___105412 = cljs.core.seq(seq__104679_105402);
if(temp__5804__auto___105412){
var seq__104679_105413__$1 = temp__5804__auto___105412;
if(cljs.core.chunked_seq_QMARK_(seq__104679_105413__$1)){
var c__5525__auto___105415 = cljs.core.chunk_first(seq__104679_105413__$1);
var G__105416 = cljs.core.chunk_rest(seq__104679_105413__$1);
var G__105417 = c__5525__auto___105415;
var G__105418 = cljs.core.count(c__5525__auto___105415);
var G__105419 = (0);
seq__104679_105402 = G__105416;
chunk__104680_105403 = G__105417;
count__104681_105404 = G__105418;
i__104682_105405 = G__105419;
continue;
} else {
var block_id_105420 = cljs.core.first(seq__104679_105413__$1);
frontend.handler.editor.expand_block_BANG_(block_id_105420);


var G__105421 = cljs.core.next(seq__104679_105413__$1);
var G__105422 = null;
var G__105423 = (0);
var G__105424 = (0);
seq__104679_105402 = G__105421;
chunk__104680_105403 = G__105422;
count__104681_105404 = G__105423;
i__104682_105405 = G__105424;
continue;
}
} else {
}
}
break;
}
} else {
var seq__104683_105425 = cljs.core.seq(block_ids_105399);
var chunk__104684_105426 = null;
var count__104685_105427 = (0);
var i__104686_105428 = (0);
while(true){
if((i__104686_105428 < count__104685_105427)){
var block_id_105429 = chunk__104684_105426.cljs$core$IIndexed$_nth$arity$2(null,i__104686_105428);
frontend.handler.editor.collapse_block_BANG_(block_id_105429);


var G__105430 = seq__104683_105425;
var G__105431 = chunk__104684_105426;
var G__105432 = count__104685_105427;
var G__105433 = (i__104686_105428 + (1));
seq__104683_105425 = G__105430;
chunk__104684_105426 = G__105431;
count__104685_105427 = G__105432;
i__104686_105428 = G__105433;
continue;
} else {
var temp__5804__auto___105434 = cljs.core.seq(seq__104683_105425);
if(temp__5804__auto___105434){
var seq__104683_105435__$1 = temp__5804__auto___105434;
if(cljs.core.chunked_seq_QMARK_(seq__104683_105435__$1)){
var c__5525__auto___105436 = cljs.core.chunk_first(seq__104683_105435__$1);
var G__105437 = cljs.core.chunk_rest(seq__104683_105435__$1);
var G__105438 = c__5525__auto___105436;
var G__105439 = cljs.core.count(c__5525__auto___105436);
var G__105440 = (0);
seq__104683_105425 = G__105437;
chunk__104684_105426 = G__105438;
count__104685_105427 = G__105439;
i__104686_105428 = G__105440;
continue;
} else {
var block_id_105441 = cljs.core.first(seq__104683_105435__$1);
frontend.handler.editor.collapse_block_BANG_(block_id_105441);


var G__105442 = cljs.core.next(seq__104683_105435__$1);
var G__105443 = null;
var G__105444 = (0);
var G__105445 = (0);
seq__104683_105425 = G__105442;
chunk__104684_105426 = G__105443;
count__104685_105427 = G__105444;
i__104686_105428 = G__105445;
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
var G__104688 = arguments.length;
switch (G__104688) {
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

(frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (block_id,p__104689){
var map__104690 = p__104689;
var map__104690__$1 = cljs.core.__destructure_map(map__104690);
var collapse_self_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104690__$1,new cljs.core.Keyword(null,"collapse-self?","collapse-self?",1736127396),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),block_id], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__104691 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
if(cljs.core.not(collapse_self_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([block_id]),G__104691);
} else {
return G__104691;
}
})()),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,true));
}));
}));
}));
}));

(frontend.handler.editor.collapse_all_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.editor.expand_all_BANG_ = (function frontend$handler$editor$expand_all_BANG_(var_args){
var G__104693 = arguments.length;
switch (G__104693) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),block_id], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks)),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,false));
}));
}));
}));
}));

(frontend.handler.editor.expand_all_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.editor.collapse_all_selection_BANG_ = (function frontend$handler$editor$collapse_all_selection_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104694_SHARP_){
return frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),p1__104694_SHARP_], null));
}),frontend.handler.editor.get_selected_toplevel_block_uuids()))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks))),(function (block_ids){
return promesa.protocols._promise(frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,true));
}));
}));
}));
});
frontend.handler.editor.expand_all_selection_BANG_ = (function frontend$handler$editor$expand_all_selection_BANG_(){
var blocks = promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104695_SHARP_){
return frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"expanded?","expanded?",2055832296),true,new cljs.core.Keyword(null,"root-block","root-block",-645043721),p1__104695_SHARP_], null));
}),frontend.handler.editor.get_selected_toplevel_block_uuids()));
var block_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks));
return frontend.handler.editor.set_blocks_collapsed_BANG_(block_ids,false);
});
frontend.handler.editor.toggle_open_BANG_ = (function frontend$handler$editor$toggle_open_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.empty_QMARK_(blocks)),(function (all_expanded_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(all_expanded_QMARK_)?frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$0():frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$0()));
}));
}));
}));
});
frontend.handler.editor.toggle_open_block_children_BANG_ = (function frontend$handler$editor$toggle_open_block_children_BANG_(block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"incremental?","incremental?",2074605941),false,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.empty_QMARK_(blocks)),(function (all_expanded_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(all_expanded_QMARK_)?frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapse-self?","collapse-self?",1736127396),false], null)):frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1(block_id)));
}));
}));
}));
});
frontend.handler.editor.select_all_blocks_BANG_ = (function frontend$handler$editor$select_all_blocks_BANG_(p__104696){
var map__104697 = p__104696;
var map__104697__$1 = cljs.core.__destructure_map(map__104697);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104697__$1,new cljs.core.Keyword(null,"page","page",849072397));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5802__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5802__auto__)){
var current_input_id = temp__5802__auto__;
var input = goog.dom.getElement(current_input_id);
var blocks_container = frontend.util.rec_get_blocks_container(input);
var blocks = dommy.utils.__GT_Array(blocks_container.getElementsByClassName("ls-block"));
return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(blocks);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (b){
return frontend.util.get_blocks_by_id(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var or__5002__auto__ = (function (){var G__104698 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(b));
if((G__104698 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104698) : frontend.db.entity.call(null,G__104698));
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
})()),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("selection","selected-all?","selection/selected-all?",208605839),true));
}));
}));
});
frontend.handler.editor.select_parent = (function frontend$handler$editor$select_parent(e){
var edit_input = (function (){var G__104699 = frontend.state.get_edit_input_id();
if((G__104699 == null)){
return null;
} else {
return goog.dom.getElement(G__104699);
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
var temp__5802__auto__ = (function (){var G__104700 = cljs.core.first(frontend.state.get_selection_blocks());
var G__104700__$1 = (((G__104700 == null))?null:dommy.core.attr(G__104700,"blockid"));
if((G__104700__$1 == null)){
return null;
} else {
return cljs.core.uuid(G__104700__$1);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block_id = temp__5802__auto__;
var temp__5804__auto__ = (function (){var G__104701 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104701) : frontend.db.entity.call(null,G__104701));
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
var len__5726__auto___105451 = arguments.length;
var i__5727__auto___105452 = (0);
while(true){
if((i__5727__auto___105452 < len__5726__auto___105451)){
args__5732__auto__.push((arguments[i__5727__auto___105452]));

var G__105453 = (i__5727__auto___105452 + (1));
i__5727__auto___105452 = G__105453;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic = (function (p__104703){
var map__104704 = p__104703;
var map__104704__$1 = cljs.core.__destructure_map(map__104704);
var select_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104704__$1,new cljs.core.Keyword(null,"select?","select?",-1012224063));
var save_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104704__$1,new cljs.core.Keyword(null,"save-block?","save-block?",-809783538),true);
var edit_block = frontend.state.get_edit_block();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(save_block_QMARK_)?frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0():null)),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(select_QMARK_)?(function (){var temp__5804__auto__ = (function (){var G__104705 = frontend.state.get_input();
if((G__104705 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__104705,"ls-block");
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
(frontend.handler.editor.escape_editing.cljs$lang$applyTo = (function (seq104702){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq104702));
}));

frontend.handler.editor.replace_block_reference_with_content_at_point = (function frontend$handler$editor$replace_block_reference_with_content_at_point(){
var repo = frontend.state.get_current_repo();
var temp__5804__auto__ = frontend.util.thingatpt.block_ref_at_point();
if(cljs.core.truth_(temp__5804__auto__)){
var map__104706 = temp__5804__auto__;
var map__104706__$1 = cljs.core.__destructure_map(map__104706);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104706__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104706__$1,new cljs.core.Keyword(null,"end","end",-268185958));
var link = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104706__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var temp__5804__auto____$1 = (function (){var G__104707 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),link], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104707) : frontend.db.entity.call(null,G__104707));
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
var ref_block = (function (){var G__104708 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),ref_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104708) : frontend.db.entity.call(null,G__104708));
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
var content = clojure.string.replace_first(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),match,(function (){var G__104709 = "{{embed ((%s))}}";
var G__104710 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(ref_id);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__104709,G__104710) : frontend.util.format.call(null,G__104709,G__104710));
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
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__104711 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104711) : frontend.db.entity.call(null,G__104711));
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
var temp__5804__auto__ = (function (){var G__104712 = frontend.state.get_edit_block();
var G__104712__$1 = (((G__104712 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__104712));
if((G__104712__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104712__$1) : frontend.db.entity.call(null,G__104712__$1));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_edit_BANG_()),(function (___41611__auto____$1){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),"")),(function (___41611__auto____$2){
return promesa.protocols._promise(new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1((function (){var G__104713 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104713) : frontend.db.entity.call(null,G__104713));
})()));
}));
}));
}
})()),(function (query_block){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__104714 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__104714) : frontend.db.entity.call(null,G__104714));
})())),(function (current_query){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));

frontend.handler.editor.save_block_inner_BANG_(block,"",cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(query_block)){
return frontend.handler.editor.save_block_inner_BANG_(query_block,current_query,cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__104715 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__104716 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__104716);

try{frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));

frontend.handler.editor.save_block_inner_BANG_(block,"",cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(query_block)){
frontend.handler.editor.save_block_inner_BANG_(query_block,current_query,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

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
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__104715);
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
