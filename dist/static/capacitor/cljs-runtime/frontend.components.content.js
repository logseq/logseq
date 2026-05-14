goog.provide('frontend.components.content');
goog.scope(function(){
  frontend.components.content.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.content.custom_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (){
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.ui.menu_background_color((function (p1__90405_SHARP_){
return frontend.handler.property.batch_set_block_property_BANG_(repo,frontend.state.get_selection_block_ids(),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)),p1__90405_SHARP_);
}),(function (){
return frontend.handler.property.batch_remove_block_property_BANG_(repo,frontend.state.get_selection_block_ids(),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)));
})),frontend.ui.menu_heading((function (p1__90406_SHARP_){
return frontend.handler.editor.batch_set_heading_BANG_(frontend.state.get_selection_block_ids(),p1__90406_SHARP_);
}),(function (){
return frontend.handler.editor.batch_set_heading_BANG_(frontend.state.get_selection_block_ids(),true);
}),(function (){
return frontend.handler.editor.batch_remove_heading_BANG_(frontend.state.get_selection_block_ids());
})),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),daiquiri.interpreter.interpret((function (){var G__90412 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"cut",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.cut_selection_blocks(true);
})], null);
var G__90413 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cut","editor/cut",803621444)], 0));
var G__90414 = (function (){var G__90415 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cut","editor/cut",803621444));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90415) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90415));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90412,G__90413,G__90414) : logseq.shui.ui.dropdown_menu_item.call(null,G__90412,G__90413,G__90414));
})()),daiquiri.interpreter.interpret((function (){var G__90420 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90407_SHARP_){
frontend.handler.editor.delete_selection(p1__90407_SHARP_);

frontend.state.hide_custom_context_menu_BANG_();

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__90421 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","delete-selection","editor/delete-selection",-1313454836)], 0));
var G__90422 = (function (){var G__90423 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","delete","editor/delete",1285565589));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90423) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90423));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90420,G__90421,G__90422) : logseq.shui.ui.dropdown_menu_item.call(null,G__90420,G__90421,G__90422));
})()),daiquiri.interpreter.interpret((function (){var G__90428 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_selection_blocks(true);
})], null);
var G__90429 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","copy","editor/copy",-1849165166)], 0));
var G__90430 = (function (){var G__90431 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","copy","editor/copy",-1849165166));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90431) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90431));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90428,G__90429,G__90430) : logseq.shui.ui.dropdown_menu_item.call(null,G__90428,G__90429,G__90430));
})()),daiquiri.interpreter.interpret((function (){var G__90435 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy as",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop_propagation(e);

var block_uuids = frontend.state.get_selection_block_ids();
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var G__90437 = (function (){
return frontend.components.export$.export_blocks(block_uuids,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),false,new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"selected-nodes","selected-nodes",-1281525478)], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__90437) : logseq.shui.ui.dialog_open_BANG_.call(null,G__90437));
})], null);
var G__90436 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-export-as","content/copy-export-as",-1135224218)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90435,G__90436) : logseq.shui.ui.dropdown_menu_item.call(null,G__90435,G__90436));
})()),daiquiri.interpreter.interpret((function (){var G__90440 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy block refs",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.copy_block_refs], null);
var G__90441 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-ref","content/copy-block-ref",2024909906)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90440,G__90441) : logseq.shui.ui.dropdown_menu_item.call(null,G__90440,G__90441));
})()),((db_based_QMARK_)?null:daiquiri.interpreter.interpret((function (){var G__90444 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy block embeds",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.copy_block_embeds], null);
var G__90445 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-emebed","content/copy-block-emebed",-126286151)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90444,G__90445) : logseq.shui.ui.dropdown_menu_item.call(null,G__90444,G__90445));
})())),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),(cljs.core.truth_(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0())?daiquiri.interpreter.interpret((function (){var G__90448 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();
}
})], null);
var G__90449 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-flashcard","context-menu/make-a-flashcard",942504552)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90448,G__90449) : logseq.shui.ui.dropdown_menu_item.call(null,G__90448,G__90449));
})()):null),daiquiri.interpreter.interpret((function (){var G__90452 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Toggle number list",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),frontend.state.get_selection_block_ids()], null));
})], null);
var G__90453 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","toggle-number-list","context-menu/toggle-number-list",-1283735842)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90452,G__90453) : logseq.shui.ui.dropdown_menu_item.call(null,G__90452,G__90453));
})()),daiquiri.interpreter.interpret((function (){var G__90458 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"cycle todos",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.cycle_todos_BANG_], null);
var G__90459 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cycle-todo","editor/cycle-todo",1017593231)], 0));
var G__90460 = (function (){var G__90461 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cycle-todo","editor/cycle-todo",1017593231));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90461) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90461));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90458,G__90459,G__90460) : logseq.shui.ui.dropdown_menu_item.call(null,G__90458,G__90459,G__90460));
})()),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),daiquiri.interpreter.interpret((function (){var G__90466 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Expand all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.expand_all_selection_BANG_], null);
var G__90467 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354)], 0));
var G__90468 = (function (){var G__90469 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90469) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90469));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90466,G__90467,G__90468) : logseq.shui.ui.dropdown_menu_item.call(null,G__90466,G__90467,G__90468));
})()),daiquiri.interpreter.interpret((function (){var G__90474 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Collapse all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.collapse_all_selection_BANG_], null);
var G__90475 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392)], 0));
var G__90476 = (function (){var G__90477 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90477) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90477));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90474,G__90475,G__90476) : logseq.shui.ui.dropdown_menu_item.call(null,G__90474,G__90475,G__90476));
})())]);
}),null,"frontend.components.content/custom-context-menu-content");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.content !== 'undefined') && (typeof frontend.components.content._STAR_template_including_parent_QMARK_ !== 'undefined')){
} else {
frontend.components.content._STAR_template_including_parent_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.content.template_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (template_including_parent_QMARK_){
return daiquiri.core.create_element("div",{'className':"flex flex-row w-auto items-center"},[(function (){var attrs90478 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","template-include-parent-block","context-menu/template-include-parent-block",-1605127051)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs90478))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-medium","mr-2"], null)], null),attrs90478], 0))):{'className':"text-medium mr-2"}),((cljs.core.map_QMARK_(attrs90478))?null:[daiquiri.interpreter.interpret(attrs90478)]));
})(),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$2(template_including_parent_QMARK_,(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.content._STAR_template_including_parent_QMARK_,cljs.core.not);
})))]);
}),null,"frontend.components.content/template-checkbox");
frontend.components.content.block_template = rum.core.lazy_build(rum.core.build_defcs,(function (state,block_id){
var edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.content","edit?","frontend.components.content/edit?",117022613));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.content","input","frontend.components.content/input",-328843080));
var template_including_parent_QMARK_ = rum.core.react(frontend.components.content._STAR_template_including_parent_QMARK_);
var block_id__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var block = (function (){var G__90479 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90479) : frontend.db.entity.call(null,G__90479));
})();
var has_children_QMARK_ = cljs.core.seq(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block));
var repo = frontend.state.get_current_repo();
if((((template_including_parent_QMARK_ == null)) && (has_children_QMARK_))){
cljs.core.reset_BANG_(frontend.components.content._STAR_template_including_parent_QMARK_,true);
} else {
}

if(cljs.core.truth_(cljs.core.deref(edit_QMARK_))){
var submit_BANG_ = (function (){
var title = clojure.string.trim(cljs.core.deref(input));
if((!(clojure.string.blank_QMARK_(title)))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.page._LT_template_exists_QMARK_(title)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","template-exists-warning","context-menu/template-exists-warning",-2038001652)], 0))], null),new cljs.core.Keyword(null,"error","error",-978969032)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,block_id__$1,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","template","logseq.property/template",-1826514780)),title)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((template_including_parent_QMARK_ === false)?frontend.handler.property.set_block_property_BANG_(repo,block_id__$1,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","template-including-parent","logseq.property/template-including-parent",-1720952359)),false):null)),(function (___40947__auto____$1){
return promesa.protocols._promise((logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)));
}));
}));
}))));
}));
}));
} else {
return null;
}
});
frontend.state.clear_edit_BANG_();

return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'onClick':(function (e){
return frontend.util.stop(e);
}),'className':"px-4 py-2 text-sm"},[(function (){var attrs90480 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","input-template-name","context-menu/input-template-name",-16334388)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs90480))?daiquiri.interpreter.element_attributes(attrs90480):null),((cljs.core.map_QMARK_(attrs90480))?null:[daiquiri.interpreter.interpret(attrs90480)]));
})(),daiquiri.core.create_element("input",{'id':"new-template",'autoFocus':true,'onKeyDown':(function (e){
frontend.util.stop_propagation(e);

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))) && ((!(clojure.string.blank_QMARK_(frontend.util.trim_safe(cljs.core.deref(input)))))))){
return submit_BANG_();
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(input,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),((has_children_QMARK_)?frontend.components.content.template_checkbox(template_including_parent_QMARK_):null),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"submit","submit",-49315317)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),submit_BANG_], 0)))]),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)))]);
} else {
return daiquiri.interpreter.interpret((function (){var G__90483 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Template",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(edit_QMARK_,true);
})], null);
var G__90484 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-template","context-menu/make-a-template",531196665)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90483,G__90484) : logseq.shui.ui.dropdown_menu_item.call(null,G__90483,G__90484));
})());
}
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.modules.shortcut.core.disable_all_shortcuts,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.content","edit?","frontend.components.content/edit?",117022613)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.content","input","frontend.components.content/input",-328843080)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.components.content._STAR_template_including_parent_QMARK_,null);

return state;
})], null)], null),"frontend.components.content/block-template");
frontend.components.content.block_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (_target,block_id,property_default_value_QMARK_){
var repo = frontend.state.get_current_repo();
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__90574 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90574) : frontend.db.entity.call(null,G__90574));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var heading = (function (){var or__5002__auto__ = frontend.handler.property.util.lookup(block,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})();
return new cljs.core.PersistentVector(null, 21, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.menu_background_color((function (p1__90485_SHARP_){
return frontend.handler.property.set_block_property_BANG_(repo,block_id,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)),p1__90485_SHARP_);
}),(function (){
return frontend.handler.property.remove_block_property_BANG_(repo,block_id,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)));
})),frontend.ui.menu_heading(heading,(function (p1__90486_SHARP_){
return frontend.handler.editor.set_heading_BANG_(block_id,p1__90486_SHARP_);
}),(function (){
return frontend.handler.editor.set_heading_BANG_(block_id,true);
}),(function (){
return frontend.handler.editor.remove_heading_BANG_(block_id);
})),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__90575 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Open in sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.open_block_in_sidebar_BANG_(block_id);
})], null);
var G__90576 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","open-in-sidebar","content/open-in-sidebar",731683416)], 0));
var G__90577 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u21E7+click") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u21E7+click"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90575,G__90576,G__90577) : logseq.shui.ui.dropdown_menu_item.call(null,G__90575,G__90576,G__90577));
})(),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__90578 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block ref",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,frontend.util.ref.__GT_block_ref);
})], null);
var G__90579 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-ref","content/copy-block-ref",2024909906)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90578,G__90579) : logseq.shui.ui.dropdown_menu_item.call(null,G__90578,G__90579));
})(),((db_QMARK_)?null:(function (){var G__90580 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__90487_SHARP_){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed ((%s))}}",p1__90487_SHARP_) : frontend.util.format.call(null,"{{embed ((%s))}}",p1__90487_SHARP_));
}));
})], null);
var G__90581 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-emebed","content/copy-block-emebed",-126286151)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90580,G__90581) : logseq.shui.ui.dropdown_menu_item.call(null,G__90580,G__90581));
})()),(cljs.core.truth_(frontend.util.electron_QMARK_())?(function (){var G__90582 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block URL",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
var current_repo = frontend.state.get_current_repo();
var tap_f = (function (block_id__$1){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3(null,current_repo,block_id__$1);
});
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,tap_f);
})], null);
var G__90583 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-url","content/copy-block-url",1258898377)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90582,G__90583) : logseq.shui.ui.dropdown_menu_item.call(null,G__90582,G__90583));
})():null),(function (){var G__90584 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy as",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var G__90586 = (function (){
return frontend.components.export$.export_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),false,new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"block","block",664686210)], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__90586) : logseq.shui.ui.dialog_open_BANG_.call(null,G__90586));
})], null);
var G__90585 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-export-as","content/copy-export-as",-1135224218)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90584,G__90585) : logseq.shui.ui.dropdown_menu_item.call(null,G__90584,G__90585));
})(),(cljs.core.truth_(property_default_value_QMARK_)?null:(function (){var G__90587 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Cut",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.cut_block_BANG_(block_id);
})], null);
var G__90588 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cut","editor/cut",803621444)], 0));
var G__90589 = (function (){var G__90590 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cut","editor/cut",803621444));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90590) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90590));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90587,G__90588,G__90589) : logseq.shui.ui.dropdown_menu_item.call(null,G__90587,G__90588,G__90589));
})()),(cljs.core.truth_(property_default_value_QMARK_)?null:(function (){var G__90591 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_block_aux_BANG_(block);
})], null);
var G__90592 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","delete-selection","editor/delete-selection",-1313454836)], 0));
var G__90593 = (function (){var G__90594 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","delete","editor/delete",1285565589));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90594) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90594));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90591,G__90592,G__90593) : logseq.shui.ui.dropdown_menu_item.call(null,G__90591,G__90592,G__90593));
})()),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),((db_QMARK_)?null:frontend.components.content.block_template(block_id)),((frontend.extensions.srs.card_block_QMARK_(block))?(function (){var G__90595 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Preview Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.preview(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
})], null);
var G__90596 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","preview-flashcard","context-menu/preview-flashcard",31934109)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90595,G__90596) : logseq.shui.ui.dropdown_menu_item.call(null,G__90595,G__90596));
})():(cljs.core.truth_(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var G__90597 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
} else {
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
}
})], null);
var G__90598 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-flashcard","context-menu/make-a-flashcard",942504552)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90597,G__90598) : logseq.shui.ui.dropdown_menu_item.call(null,G__90597,G__90598));
})():null
)),(function (){var G__90599 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Toggle number list",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),frontend.state.get_selection_block_ids()], null));
})], null);
var G__90600 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","toggle-number-list","context-menu/toggle-number-list",-1283735842)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90599,G__90600) : logseq.shui.ui.dropdown_menu_item.call(null,G__90599,G__90600));
})(),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__90601 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Expand all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1(block_id);
})], null);
var G__90602 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354)], 0));
var G__90603 = (function (){var G__90604 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90604) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90604));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90601,G__90602,G__90603) : logseq.shui.ui.dropdown_menu_item.call(null,G__90601,G__90602,G__90603));
})(),(function (){var G__90605 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Collapse all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,cljs.core.PersistentArrayMap.EMPTY);
})], null);
var G__90606 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392)], 0));
var G__90607 = (function (){var G__90608 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90608) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90608));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90605,G__90606,G__90607) : logseq.shui.ui.dropdown_menu_item.call(null,G__90605,G__90606,G__90607));
})(),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996)], null)))?(function (){var temp__5804__auto____$1 = frontend.state.get_plugins_commands_with_type(new cljs.core.Keyword(null,"block-context-menu-item","block-context-menu-item",-1128965744));
if(cljs.core.truth_(temp__5804__auto____$1)){
var cmds = temp__5804__auto____$1;
var iter__5480__auto__ = (function frontend$components$content$iter__90609(s__90610){
return (new cljs.core.LazySeq(null,(function (){
var s__90610__$1 = s__90610;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__90610__$1);
if(temp__5804__auto____$2){
var s__90610__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__90610__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90610__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90612 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90611 = (0);
while(true){
if((i__90611 < size__5479__auto__)){
var vec__90613 = cljs.core._nth(c__5478__auto__,i__90611);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90613,(0),null);
var map__90616 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90613,(1),null);
var map__90616__$1 = cljs.core.__destructure_map(map__90616);
var cmd = map__90616__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90616__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90616__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90613,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90613,(3),null);
cljs.core.chunk_append(b__90612,(function (){var G__90617 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__90611,vec__90613,_,map__90616,map__90616__$1,cmd,key,label,action,pid,c__5478__auto__,size__5479__auto__,b__90612,s__90610__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),block_id),action);
});})(i__90611,vec__90613,_,map__90616,map__90616__$1,cmd,key,label,action,pid,c__5478__auto__,size__5479__auto__,b__90612,s__90610__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_))
], null);
var G__90618 = label;
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90617,G__90618) : logseq.shui.ui.dropdown_menu_item.call(null,G__90617,G__90618));
})());

var G__90715 = (i__90611 + (1));
i__90611 = G__90715;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90612),frontend$components$content$iter__90609(cljs.core.chunk_rest(s__90610__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90612),null);
}
} else {
var vec__90619 = cljs.core.first(s__90610__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90619,(0),null);
var map__90622 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90619,(1),null);
var map__90622__$1 = cljs.core.__destructure_map(map__90622);
var cmd = map__90622__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90622__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90622__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90619,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90619,(3),null);
return cljs.core.cons((function (){var G__90623 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__90619,_,map__90622,map__90622__$1,cmd,key,label,action,pid,s__90610__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),block_id),action);
});})(vec__90619,_,map__90622,map__90622__$1,cmd,key,label,action,pid,s__90610__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_))
], null);
var G__90624 = label;
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90623,G__90624) : logseq.shui.ui.dropdown_menu_item.call(null,G__90623,G__90624));
})(),frontend$components$content$iter__90609(cljs.core.rest(s__90610__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cmds);
} else {
return null;
}
})():null),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__90625 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Developer tools") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Developer tools"));
var G__90626 = (function (){var G__90627 = (function (){var G__90630 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block data",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.common.developer.show_entity_data(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null));
})], null);
var G__90631 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-block-data","dev/show-block-data",299125726)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90630,G__90631) : logseq.shui.ui.dropdown_menu_item.call(null,G__90630,G__90631));
})();
var G__90628 = (function (){var G__90632 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block AST",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var block__$1 = (function (){var G__90634 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90634) : frontend.db.entity.call(null,G__90634));
})();
return frontend.handler.common.developer.show_content_ast(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
})], null);
var G__90633 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-block-ast","dev/show-block-ast",-227225549)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90632,G__90633) : logseq.shui.ui.dropdown_menu_item.call(null,G__90632,G__90633));
})();
var G__90629 = (function (){var G__90635 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block content history",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var token = frontend.state.get_auth_id_token();
var graph_uuid = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-block-content-versions","thread-api/rtc-get-block-content-versions",1910613531),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,block_id], 0))),(function (blocks_versions){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"Dev-show-block-content-history","Dev-show-block-content-history",-1924159924)], 0))),(function (___40947__auto__){
return promesa.protocols._promise((function (){var seq__90637 = cljs.core.seq(blocks_versions);
var chunk__90638 = null;
var count__90639 = (0);
var i__90640 = (0);
while(true){
if((i__90640 < count__90639)){
var vec__90647 = chunk__90638.cljs$core$IIndexed$_nth$arity$2(null,i__90640);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90647,(0),null);
var versions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90647,(1),null);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], 0));

cljs.pprint.print_table.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"created-at","created-at",-89248644)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__90637,chunk__90638,count__90639,i__90640,vec__90647,block_uuid,versions,token,graph_uuid,G__90627,G__90628,G__90625,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (version){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),cljs_time.coerce.from_long((new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(version) * (1000))),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(version)], null);
});})(seq__90637,chunk__90638,count__90639,i__90640,vec__90647,block_uuid,versions,token,graph_uuid,G__90627,G__90628,G__90625,heading,block,temp__5804__auto__,repo,db_QMARK_))
,versions));


var G__90723 = seq__90637;
var G__90724 = chunk__90638;
var G__90725 = count__90639;
var G__90726 = (i__90640 + (1));
seq__90637 = G__90723;
chunk__90638 = G__90724;
count__90639 = G__90725;
i__90640 = G__90726;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__90637);
if(temp__5804__auto____$1){
var seq__90637__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__90637__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__90637__$1);
var G__90728 = cljs.core.chunk_rest(seq__90637__$1);
var G__90729 = c__5525__auto__;
var G__90730 = cljs.core.count(c__5525__auto__);
var G__90731 = (0);
seq__90637 = G__90728;
chunk__90638 = G__90729;
count__90639 = G__90730;
i__90640 = G__90731;
continue;
} else {
var vec__90650 = cljs.core.first(seq__90637__$1);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90650,(0),null);
var versions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90650,(1),null);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], 0));

cljs.pprint.print_table.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"created-at","created-at",-89248644)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__90637,chunk__90638,count__90639,i__90640,vec__90650,block_uuid,versions,seq__90637__$1,temp__5804__auto____$1,token,graph_uuid,G__90627,G__90628,G__90625,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (version){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),cljs_time.coerce.from_long((new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(version) * (1000))),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(version)], null);
});})(seq__90637,chunk__90638,count__90639,i__90640,vec__90650,block_uuid,versions,seq__90637__$1,temp__5804__auto____$1,token,graph_uuid,G__90627,G__90628,G__90625,heading,block,temp__5804__auto__,repo,db_QMARK_))
,versions));


var G__90734 = cljs.core.next(seq__90637__$1);
var G__90735 = null;
var G__90736 = (0);
var G__90737 = (0);
seq__90637 = G__90734;
chunk__90638 = G__90735;
count__90639 = G__90736;
i__90640 = G__90737;
continue;
}
} else {
return null;
}
}
break;
}
})());
}));
}));
}));
})], null);
var G__90636 = "(Dev) Show block content history";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90635,G__90636) : logseq.shui.ui.dropdown_menu_item.call(null,G__90635,G__90636));
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3(G__90627,G__90628,G__90629) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__90627,G__90628,G__90629));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__90625,G__90626) : logseq.shui.ui.dropdown_menu_sub.call(null,G__90625,G__90626));
})()], null):null)], null);
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.disable_all_shortcuts], null),"frontend.components.content/block-context-menu-content");
frontend.components.content.block_ref_custom_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (block,block_ref_id){
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return block_ref_id;
} else {
return and__5000__auto__;
}
})())){
var attrs90661 = (function (){var G__90662 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open-in-sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),block_ref_id,new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
})], null);
var G__90663 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","open-in-sidebar","content/open-in-sidebar",731683416)], 0));
var G__90664 = (function (){var G__90665 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["\u21E7+click"], null);
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__90665) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__90665));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__90662,G__90663,G__90664) : logseq.shui.ui.dropdown_menu_item.call(null,G__90662,G__90663,G__90664));
})();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90661))?daiquiri.interpreter.element_attributes(attrs90661):null),((cljs.core.map_QMARK_(attrs90661))?[daiquiri.interpreter.interpret((function (){var G__90668 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_current_ref(block_ref_id);
})], null);
var G__90669 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-ref","content/copy-ref",-2112625163)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90668,G__90669) : logseq.shui.ui.dropdown_menu_item.call(null,G__90668,G__90669));
})()),daiquiri.interpreter.interpret((function (){var G__90672 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_current_ref_BANG_(block,block_ref_id);
})], null);
var G__90673 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","delete-ref","content/delete-ref",1711148336)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90672,G__90673) : logseq.shui.ui.dropdown_menu_item.call(null,G__90672,G__90673));
})()),daiquiri.interpreter.interpret((function (){var G__90676 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-text",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_text_BANG_(block,block_ref_id);
})], null);
var G__90677 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-text","content/replace-with-text",1336545931)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90676,G__90677) : logseq.shui.ui.dropdown_menu_item.call(null,G__90676,G__90677));
})()),daiquiri.interpreter.interpret((function (){var G__90680 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_embed_BANG_(block,block_ref_id);
})], null);
var G__90681 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-embed","content/replace-with-embed",-1134258828)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90680,G__90681) : logseq.shui.ui.dropdown_menu_item.call(null,G__90680,G__90681));
})())]:[daiquiri.interpreter.interpret(attrs90661),daiquiri.interpreter.interpret((function (){var G__90684 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_current_ref(block_ref_id);
})], null);
var G__90685 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-ref","content/copy-ref",-2112625163)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90684,G__90685) : logseq.shui.ui.dropdown_menu_item.call(null,G__90684,G__90685));
})()),daiquiri.interpreter.interpret((function (){var G__90688 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_current_ref_BANG_(block,block_ref_id);
})], null);
var G__90689 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","delete-ref","content/delete-ref",1711148336)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90688,G__90689) : logseq.shui.ui.dropdown_menu_item.call(null,G__90688,G__90689));
})()),daiquiri.interpreter.interpret((function (){var G__90692 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-text",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_text_BANG_(block,block_ref_id);
})], null);
var G__90693 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-text","content/replace-with-text",1336545931)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90692,G__90693) : logseq.shui.ui.dropdown_menu_item.call(null,G__90692,G__90693));
})()),daiquiri.interpreter.interpret((function (){var G__90696 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_embed_BANG_(block,block_ref_id);
})], null);
var G__90697 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-embed","content/replace-with-embed",-1134258828)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90696,G__90697) : logseq.shui.ui.dropdown_menu_item.call(null,G__90696,G__90697));
})())]));
} else {
return null;
}
}),null,"frontend.components.content/block-ref-custom-context-menu-content");
frontend.components.content.page_title_custom_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (page){
if(cljs.core.truth_(page)){
var page_menu_options = frontend.components.page_menu.page_menu(page);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$content$iter__90698(s__90699){
return (new cljs.core.LazySeq(null,(function (){
var s__90699__$1 = s__90699;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90699__$1);
if(temp__5804__auto__){
var s__90699__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90699__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90699__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90701 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90700 = (0);
while(true){
if((i__90700 < size__5479__auto__)){
var map__90702 = cljs.core._nth(c__5478__auto__,i__90700);
var map__90702__$1 = cljs.core.__destructure_map(map__90702);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90702__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90702__$1,new cljs.core.Keyword(null,"options","options",99638489));
cljs.core.chunk_append(b__90701,daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(options,title) : logseq.shui.ui.dropdown_menu_item.call(null,options,title))));

var G__90752 = (i__90700 + (1));
i__90700 = G__90752;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90701),frontend$components$content$iter__90698(cljs.core.chunk_rest(s__90699__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90701),null);
}
} else {
var map__90703 = cljs.core.first(s__90699__$2);
var map__90703__$1 = cljs.core.__destructure_map(map__90703);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90703__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90703__$1,new cljs.core.Keyword(null,"options","options",99638489));
return cljs.core.cons(daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(options,title) : logseq.shui.ui.dropdown_menu_item.call(null,options,title))),frontend$components$content$iter__90698(cljs.core.rest(s__90699__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(page_menu_options);
})())]);
} else {
return null;
}
}),null,"frontend.components.content/page-title-custom-context-menu-content");
frontend.components.content.hiccup_content = rum.core.lazy_build(rum.core.build_defc,(function (id,p__90704){
var map__90705 = p__90704;
var map__90705__$1 = cljs.core.__destructure_map(map__90705);
var hiccup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90705__$1,new cljs.core.Keyword(null,"hiccup","hiccup",1218876238));
return daiquiri.core.create_element("div",{'id':id},[(cljs.core.truth_(hiccup)?daiquiri.interpreter.interpret(hiccup):(function (){var attrs90706 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","click-to-edit","content/click-to-edit",-166350355)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90706))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cursor"], null)], null),attrs90706], 0))):{'className':"cursor"}),((cljs.core.map_QMARK_(attrs90706))?null:[daiquiri.interpreter.interpret(attrs90706)]));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.content/hiccup-content");
frontend.components.content.non_hiccup_content = rum.core.lazy_build(rum.core.build_defc,(function (id,content,on_click,on_hide,config,format){
var edit_QMARK_ = frontend.state.sub_editing_QMARK_(id);
if(cljs.core.truth_(edit_QMARK_)){
return frontend.components.editor.box(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),on_hide,new cljs.core.Keyword(null,"format","format",-1306924766),format], null),id,config);
} else {
var on_click__$1 = (function (e){
if(frontend.util.link_QMARK_(frontend.components.content.goog$module$goog$object.get(e,"target"))){
return null;
} else {
frontend.util.stop(e);

frontend.handler.editor.reset_cursor_range_BANG_(goog.dom.getElement(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)));

frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(id,content);

if(cljs.core.truth_(on_click)){
return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(e) : on_click.call(null,e));
} else {
return null;
}
}
});
return daiquiri.core.create_element("pre",{'id':id,'onClick':on_click__$1,'className':"cursor content pre-white-space"},[((clojure.string.blank_QMARK_(content))?(function (){var attrs90707 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","click-to-edit","content/click-to-edit",-166350355)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90707))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cursor"], null)], null),attrs90707], 0))):{'className':"cursor"}),((cljs.core.map_QMARK_(attrs90707))?null:[daiquiri.interpreter.interpret(attrs90707)]));
})():daiquiri.interpreter.interpret(content))]);
}
}),null,"frontend.components.content/non-hiccup-content");
frontend.components.content.set_draw_iframe_style_BANG_ = (function frontend$components$content$set_draw_iframe_style_BANG_(){
var width = frontend.components.content.goog$module$goog$object.get(window,"innerWidth");
if((width >= (1024))){
var draws = dommy.utils.__GT_Array(document.getElementsByClassName("draw-iframe"));
var width__$1 = (width - (200));
var seq__90708 = cljs.core.seq(draws);
var chunk__90709 = null;
var count__90710 = (0);
var i__90711 = (0);
while(true){
if((i__90711 < count__90710)){
var draw = chunk__90709.cljs$core$IIndexed$_nth$arity$2(null,i__90711);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"width","width",-384071477),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(width__$1),"px"].join('')], 0));

var height_90762 = (function (){var x__5087__auto__ = (700);
var y__5088__auto__ = (width__$1 / (2));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"height","height",1025178622),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(height_90762),"px"].join('')], 0));

dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((- ((width__$1 - (570)) / (2)))),"px"].join('')], 0));


var G__90765 = seq__90708;
var G__90766 = chunk__90709;
var G__90767 = count__90710;
var G__90768 = (i__90711 + (1));
seq__90708 = G__90765;
chunk__90709 = G__90766;
count__90710 = G__90767;
i__90711 = G__90768;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__90708);
if(temp__5804__auto__){
var seq__90708__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__90708__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__90708__$1);
var G__90773 = cljs.core.chunk_rest(seq__90708__$1);
var G__90774 = c__5525__auto__;
var G__90775 = cljs.core.count(c__5525__auto__);
var G__90776 = (0);
seq__90708 = G__90773;
chunk__90709 = G__90774;
count__90710 = G__90775;
i__90711 = G__90776;
continue;
} else {
var draw = cljs.core.first(seq__90708__$1);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"width","width",-384071477),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(width__$1),"px"].join('')], 0));

var height_90777 = (function (){var x__5087__auto__ = (700);
var y__5088__auto__ = (width__$1 / (2));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"height","height",1025178622),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(height_90777),"px"].join('')], 0));

dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((- ((width__$1 - (570)) / (2)))),"px"].join('')], 0));


var G__90778 = cljs.core.next(seq__90708__$1);
var G__90779 = null;
var G__90780 = (0);
var G__90781 = (0);
seq__90708 = G__90778;
chunk__90709 = G__90779;
count__90710 = G__90780;
i__90711 = G__90781;
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
frontend.components.content.content = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,p__90712){
var map__90713 = p__90712;
var map__90713__$1 = cljs.core.__destructure_map(map__90713);
var option = map__90713__$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90713__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90713__$1,new cljs.core.Keyword(null,"config","config",994861415));
var hiccup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90713__$1,new cljs.core.Keyword(null,"hiccup","hiccup",1218876238));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90713__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90713__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
if(cljs.core.truth_(hiccup)){
return daiquiri.core.create_element("div",null,[frontend.components.content.hiccup_content(id,option)]);
} else {
var format__$1 = logseq.common.util.normalize_format(format);
return frontend.components.content.non_hiccup_content(id,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(option),on_click,on_hide,config,format__$1);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.components.content.set_draw_iframe_style_BANG_();

return state;
}),new cljs.core.Keyword(null,"did-update","did-update",-2143702256),(function (state){
frontend.components.content.set_draw_iframe_style_BANG_();

return state;
})], null)], null),"frontend.components.content/content");

//# sourceMappingURL=frontend.components.content.js.map
