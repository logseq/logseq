goog.provide('frontend.components.content');
goog.scope(function(){
  frontend.components.content.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.content.custom_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (){
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.ui.menu_background_color((function (p1__125155_SHARP_){
return frontend.handler.property.batch_set_block_property_BANG_(repo,frontend.state.get_selection_block_ids(),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)),p1__125155_SHARP_);
}),(function (){
return frontend.handler.property.batch_remove_block_property_BANG_(repo,frontend.state.get_selection_block_ids(),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)));
})),frontend.ui.menu_heading((function (p1__125156_SHARP_){
return frontend.handler.editor.batch_set_heading_BANG_(frontend.state.get_selection_block_ids(),p1__125156_SHARP_);
}),(function (){
return frontend.handler.editor.batch_set_heading_BANG_(frontend.state.get_selection_block_ids(),true);
}),(function (){
return frontend.handler.editor.batch_remove_heading_BANG_(frontend.state.get_selection_block_ids());
})),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),daiquiri.interpreter.interpret((function (){var G__125162 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"cut",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.cut_selection_blocks(true);
})], null);
var G__125163 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cut","editor/cut",803621444)], 0));
var G__125164 = (function (){var G__125165 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cut","editor/cut",803621444));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125165) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125165));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125162,G__125163,G__125164) : logseq.shui.ui.dropdown_menu_item.call(null,G__125162,G__125163,G__125164));
})()),daiquiri.interpreter.interpret((function (){var G__125172 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__125157_SHARP_){
frontend.handler.editor.delete_selection(p1__125157_SHARP_);

frontend.state.hide_custom_context_menu_BANG_();

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__125173 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","delete-selection","editor/delete-selection",-1313454836)], 0));
var G__125174 = (function (){var G__125176 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","delete","editor/delete",1285565589));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125176) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125176));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125172,G__125173,G__125174) : logseq.shui.ui.dropdown_menu_item.call(null,G__125172,G__125173,G__125174));
})()),daiquiri.interpreter.interpret((function (){var G__125181 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_selection_blocks(true);
})], null);
var G__125182 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","copy","editor/copy",-1849165166)], 0));
var G__125183 = (function (){var G__125184 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","copy","editor/copy",-1849165166));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125184) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125184));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125181,G__125182,G__125183) : logseq.shui.ui.dropdown_menu_item.call(null,G__125181,G__125182,G__125183));
})()),daiquiri.interpreter.interpret((function (){var G__125188 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy as",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop_propagation(e);

var block_uuids = frontend.state.get_selection_block_ids();
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var G__125190 = (function (){
return frontend.components.export$.export_blocks(block_uuids,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),false,new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"selected-nodes","selected-nodes",-1281525478)], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__125190) : logseq.shui.ui.dialog_open_BANG_.call(null,G__125190));
})], null);
var G__125189 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-export-as","content/copy-export-as",-1135224218)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125188,G__125189) : logseq.shui.ui.dropdown_menu_item.call(null,G__125188,G__125189));
})()),daiquiri.interpreter.interpret((function (){var G__125193 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy block refs",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.copy_block_refs], null);
var G__125194 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-ref","content/copy-block-ref",2024909906)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125193,G__125194) : logseq.shui.ui.dropdown_menu_item.call(null,G__125193,G__125194));
})()),((db_based_QMARK_)?null:daiquiri.interpreter.interpret((function (){var G__125197 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy block embeds",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.copy_block_embeds], null);
var G__125198 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-emebed","content/copy-block-emebed",-126286151)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125197,G__125198) : logseq.shui.ui.dropdown_menu_item.call(null,G__125197,G__125198));
})())),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),(cljs.core.truth_(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0())?daiquiri.interpreter.interpret((function (){var G__125201 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();
}
})], null);
var G__125202 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-flashcard","context-menu/make-a-flashcard",942504552)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125201,G__125202) : logseq.shui.ui.dropdown_menu_item.call(null,G__125201,G__125202));
})()):null),daiquiri.interpreter.interpret((function (){var G__125205 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Toggle number list",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),frontend.state.get_selection_block_ids()], null));
})], null);
var G__125206 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","toggle-number-list","context-menu/toggle-number-list",-1283735842)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125205,G__125206) : logseq.shui.ui.dropdown_menu_item.call(null,G__125205,G__125206));
})()),daiquiri.interpreter.interpret((function (){var G__125211 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"cycle todos",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.cycle_todos_BANG_], null);
var G__125212 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cycle-todo","editor/cycle-todo",1017593231)], 0));
var G__125213 = (function (){var G__125214 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cycle-todo","editor/cycle-todo",1017593231));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125214) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125214));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125211,G__125212,G__125213) : logseq.shui.ui.dropdown_menu_item.call(null,G__125211,G__125212,G__125213));
})()),daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))),daiquiri.interpreter.interpret((function (){var G__125219 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Expand all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.expand_all_selection_BANG_], null);
var G__125220 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354)], 0));
var G__125221 = (function (){var G__125223 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125223) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125223));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125219,G__125220,G__125221) : logseq.shui.ui.dropdown_menu_item.call(null,G__125219,G__125220,G__125221));
})()),daiquiri.interpreter.interpret((function (){var G__125231 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Collapse all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.editor.collapse_all_selection_BANG_], null);
var G__125232 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392)], 0));
var G__125233 = (function (){var G__125234 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125234) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125234));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125231,G__125232,G__125233) : logseq.shui.ui.dropdown_menu_item.call(null,G__125231,G__125232,G__125233));
})())]);
}),null,"frontend.components.content/custom-context-menu-content");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.content !== 'undefined') && (typeof frontend.components.content._STAR_template_including_parent_QMARK_ !== 'undefined')){
} else {
frontend.components.content._STAR_template_including_parent_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.content.template_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (template_including_parent_QMARK_){
return daiquiri.core.create_element("div",{'className':"flex flex-row w-auto items-center"},[(function (){var attrs125235 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","template-include-parent-block","context-menu/template-include-parent-block",-1605127051)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs125235))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-medium","mr-2"], null)], null),attrs125235], 0))):{'className':"text-medium mr-2"}),((cljs.core.map_QMARK_(attrs125235))?null:[daiquiri.interpreter.interpret(attrs125235)]));
})(),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$2(template_including_parent_QMARK_,(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.content._STAR_template_including_parent_QMARK_,cljs.core.not);
})))]);
}),null,"frontend.components.content/template-checkbox");
frontend.components.content.block_template = rum.core.lazy_build(rum.core.build_defcs,(function (state,block_id){
var edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.content","edit?","frontend.components.content/edit?",117022613));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.content","input","frontend.components.content/input",-328843080));
var template_including_parent_QMARK_ = rum.core.react(frontend.components.content._STAR_template_including_parent_QMARK_);
var block_id__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var block = (function (){var G__125236 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__125236) : frontend.db.entity.call(null,G__125236));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.page._LT_template_exists_QMARK_(title)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","template-exists-warning","context-menu/template-exists-warning",-2038001652)], 0))], null),new cljs.core.Keyword(null,"error","error",-978969032)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,block_id__$1,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","template","logseq.property/template",-1826514780)),title)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((template_including_parent_QMARK_ === false)?frontend.handler.property.set_block_property_BANG_(repo,block_id__$1,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","template-including-parent","logseq.property/template-including-parent",-1720952359)),false):null)),(function (___41611__auto____$1){
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
}),'className':"px-4 py-2 text-sm"},[(function (){var attrs125241 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","input-template-name","context-menu/input-template-name",-16334388)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs125241))?daiquiri.interpreter.element_attributes(attrs125241):null),((cljs.core.map_QMARK_(attrs125241))?null:[daiquiri.interpreter.interpret(attrs125241)]));
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
return daiquiri.interpreter.interpret((function (){var G__125244 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Template",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(edit_QMARK_,true);
})], null);
var G__125245 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-template","context-menu/make-a-template",531196665)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125244,G__125245) : logseq.shui.ui.dropdown_menu_item.call(null,G__125244,G__125245));
})());
}
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.modules.shortcut.core.disable_all_shortcuts,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.content","edit?","frontend.components.content/edit?",117022613)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.content","input","frontend.components.content/input",-328843080)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.components.content._STAR_template_including_parent_QMARK_,null);

return state;
})], null)], null),"frontend.components.content/block-template");
frontend.components.content.block_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (_target,block_id,property_default_value_QMARK_){
var repo = frontend.state.get_current_repo();
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__125331 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__125331) : frontend.db.entity.call(null,G__125331));
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
return new cljs.core.PersistentVector(null, 21, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.menu_background_color((function (p1__125246_SHARP_){
return frontend.handler.property.set_block_property_BANG_(repo,block_id,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)),p1__125246_SHARP_);
}),(function (){
return frontend.handler.property.remove_block_property_BANG_(repo,block_id,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606)));
})),frontend.ui.menu_heading(heading,(function (p1__125247_SHARP_){
return frontend.handler.editor.set_heading_BANG_(block_id,p1__125247_SHARP_);
}),(function (){
return frontend.handler.editor.set_heading_BANG_(block_id,true);
}),(function (){
return frontend.handler.editor.remove_heading_BANG_(block_id);
})),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__125332 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Open in sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.open_block_in_sidebar_BANG_(block_id);
})], null);
var G__125333 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","open-in-sidebar","content/open-in-sidebar",731683416)], 0));
var G__125334 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u21E7+click") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u21E7+click"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125332,G__125333,G__125334) : logseq.shui.ui.dropdown_menu_item.call(null,G__125332,G__125333,G__125334));
})(),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__125335 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block ref",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,frontend.util.ref.__GT_block_ref);
})], null);
var G__125336 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-ref","content/copy-block-ref",2024909906)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125335,G__125336) : logseq.shui.ui.dropdown_menu_item.call(null,G__125335,G__125336));
})(),((db_QMARK_)?null:(function (){var G__125337 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,(function (p1__125248_SHARP_){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{embed ((%s))}}",p1__125248_SHARP_) : frontend.util.format.call(null,"{{embed ((%s))}}",p1__125248_SHARP_));
}));
})], null);
var G__125338 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-emebed","content/copy-block-emebed",-126286151)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125337,G__125338) : logseq.shui.ui.dropdown_menu_item.call(null,G__125337,G__125338));
})()),(cljs.core.truth_(frontend.util.electron_QMARK_())?(function (){var G__125339 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy block URL",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
var current_repo = frontend.state.get_current_repo();
var tap_f = (function (block_id__$1){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3(null,current_repo,block_id__$1);
});
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,tap_f);
})], null);
var G__125340 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-block-url","content/copy-block-url",1258898377)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125339,G__125340) : logseq.shui.ui.dropdown_menu_item.call(null,G__125339,G__125340));
})():null),(function (){var G__125341 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Copy as",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var G__125343 = (function (){
return frontend.components.export$.export_blocks(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),false,new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"block","block",664686210)], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__125343) : logseq.shui.ui.dialog_open_BANG_.call(null,G__125343));
})], null);
var G__125342 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-export-as","content/copy-export-as",-1135224218)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125341,G__125342) : logseq.shui.ui.dropdown_menu_item.call(null,G__125341,G__125342));
})(),(cljs.core.truth_(property_default_value_QMARK_)?null:(function (){var G__125344 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Cut",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.cut_block_BANG_(block_id);
})], null);
var G__125345 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","cut","editor/cut",803621444)], 0));
var G__125346 = (function (){var G__125347 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","cut","editor/cut",803621444));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125347) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125347));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125344,G__125345,G__125346) : logseq.shui.ui.dropdown_menu_item.call(null,G__125344,G__125345,G__125346));
})()),(cljs.core.truth_(property_default_value_QMARK_)?null:(function (){var G__125348 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_block_aux_BANG_(block);
})], null);
var G__125349 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","delete-selection","editor/delete-selection",-1313454836)], 0));
var G__125350 = (function (){var G__125351 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","delete","editor/delete",1285565589));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125351) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125351));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125348,G__125349,G__125350) : logseq.shui.ui.dropdown_menu_item.call(null,G__125348,G__125349,G__125350));
})()),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),((db_QMARK_)?null:frontend.components.content.block_template(block_id)),((frontend.extensions.srs.card_block_QMARK_(block))?(function (){var G__125352 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Preview Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.preview(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
})], null);
var G__125353 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","preview-flashcard","context-menu/preview-flashcard",31934109)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125352,G__125353) : logseq.shui.ui.dropdown_menu_item.call(null,G__125352,G__125353));
})():(cljs.core.truth_(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var G__125354 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Make a Card",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
} else {
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id], null));
}
})], null);
var G__125355 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","make-a-flashcard","context-menu/make-a-flashcard",942504552)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125354,G__125355) : logseq.shui.ui.dropdown_menu_item.call(null,G__125354,G__125355));
})():null
)),(function (){var G__125356 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Toggle number list",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),frontend.state.get_selection_block_ids()], null));
})], null);
var G__125357 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("context-menu","toggle-number-list","context-menu/toggle-number-list",-1283735842)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125356,G__125357) : logseq.shui.ui.dropdown_menu_item.call(null,G__125356,G__125357));
})(),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__125358 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Expand all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$1(block_id);
})], null);
var G__125359 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354)], 0));
var G__125360 = (function (){var G__125361 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","expand-block-children","editor/expand-block-children",2088308354));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125361) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125361));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125358,G__125359,G__125360) : logseq.shui.ui.dropdown_menu_item.call(null,G__125358,G__125359,G__125360));
})(),(function (){var G__125362 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Collapse all",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$2(block_id,cljs.core.PersistentArrayMap.EMPTY);
})], null);
var G__125363 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392)], 0));
var G__125364 = (function (){var G__125365 = frontend.ui.keyboard_shortcut_from_config(new cljs.core.Keyword("editor","collapse-block-children","editor/collapse-block-children",1709191392));
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125365) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125365));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125362,G__125363,G__125364) : logseq.shui.ui.dropdown_menu_item.call(null,G__125362,G__125363,G__125364));
})(),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996)], null)))?(function (){var temp__5804__auto____$1 = frontend.state.get_plugins_commands_with_type(new cljs.core.Keyword(null,"block-context-menu-item","block-context-menu-item",-1128965744));
if(cljs.core.truth_(temp__5804__auto____$1)){
var cmds = temp__5804__auto____$1;
var iter__5480__auto__ = (function frontend$components$content$iter__125366(s__125367){
return (new cljs.core.LazySeq(null,(function (){
var s__125367__$1 = s__125367;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__125367__$1);
if(temp__5804__auto____$2){
var s__125367__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__125367__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__125367__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__125369 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__125368 = (0);
while(true){
if((i__125368 < size__5479__auto__)){
var vec__125370 = cljs.core._nth(c__5478__auto__,i__125368);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125370,(0),null);
var map__125373 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125370,(1),null);
var map__125373__$1 = cljs.core.__destructure_map(map__125373);
var cmd = map__125373__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125373__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125373__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125370,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125370,(3),null);
cljs.core.chunk_append(b__125369,(function (){var G__125374 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__125368,vec__125370,_,map__125373,map__125373__$1,cmd,key,label,action,pid,c__5478__auto__,size__5479__auto__,b__125369,s__125367__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),block_id),action);
});})(i__125368,vec__125370,_,map__125373,map__125373__$1,cmd,key,label,action,pid,c__5478__auto__,size__5479__auto__,b__125369,s__125367__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_))
], null);
var G__125375 = label;
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125374,G__125375) : logseq.shui.ui.dropdown_menu_item.call(null,G__125374,G__125375));
})());

var G__125471 = (i__125368 + (1));
i__125368 = G__125471;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__125369),frontend$components$content$iter__125366(cljs.core.chunk_rest(s__125367__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__125369),null);
}
} else {
var vec__125376 = cljs.core.first(s__125367__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125376,(0),null);
var map__125379 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125376,(1),null);
var map__125379__$1 = cljs.core.__destructure_map(map__125379);
var cmd = map__125379__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125379__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125379__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125376,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125376,(3),null);
return cljs.core.cons((function (){var G__125380 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__125376,_,map__125379,map__125379__$1,cmd,key,label,action,pid,s__125367__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (){
return frontend.commands.exec_plugin_simple_command_BANG_(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),block_id),action);
});})(vec__125376,_,map__125379,map__125379__$1,cmd,key,label,action,pid,s__125367__$2,temp__5804__auto____$2,cmds,temp__5804__auto____$1,heading,block,temp__5804__auto__,repo,db_QMARK_))
], null);
var G__125381 = label;
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125380,G__125381) : logseq.shui.ui.dropdown_menu_item.call(null,G__125380,G__125381));
})(),frontend$components$content$iter__125366(cljs.core.rest(s__125367__$2)));
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
})():null),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),(function (){var G__125382 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Developer tools") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Developer tools"));
var G__125383 = (function (){var G__125384 = (function (){var G__125387 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block data",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.common.developer.show_entity_data(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null));
})], null);
var G__125388 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-block-data","dev/show-block-data",299125726)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125387,G__125388) : logseq.shui.ui.dropdown_menu_item.call(null,G__125387,G__125388));
})();
var G__125385 = (function (){var G__125389 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block AST",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var block__$1 = (function (){var G__125391 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__125391) : frontend.db.entity.call(null,G__125391));
})();
return frontend.handler.common.developer.show_content_ast(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
})], null);
var G__125390 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("dev","show-block-ast","dev/show-block-ast",-227225549)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125389,G__125390) : logseq.shui.ui.dropdown_menu_item.call(null,G__125389,G__125390));
})();
var G__125386 = (function (){var G__125392 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"(Dev) Show block content history",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var token = frontend.state.get_auth_id_token();
var graph_uuid = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-block-content-versions","thread-api/rtc-get-block-content-versions",1910613531),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,block_id], 0))),(function (blocks_versions){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"Dev-show-block-content-history","Dev-show-block-content-history",-1924159924)], 0))),(function (___41611__auto__){
return promesa.protocols._promise((function (){var seq__125394 = cljs.core.seq(blocks_versions);
var chunk__125395 = null;
var count__125396 = (0);
var i__125397 = (0);
while(true){
if((i__125397 < count__125396)){
var vec__125404 = chunk__125395.cljs$core$IIndexed$_nth$arity$2(null,i__125397);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125404,(0),null);
var versions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125404,(1),null);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], 0));

cljs.pprint.print_table.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"created-at","created-at",-89248644)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__125394,chunk__125395,count__125396,i__125397,vec__125404,block_uuid,versions,token,graph_uuid,G__125384,G__125385,G__125382,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (version){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),cljs_time.coerce.from_long((new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(version) * (1000))),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(version)], null);
});})(seq__125394,chunk__125395,count__125396,i__125397,vec__125404,block_uuid,versions,token,graph_uuid,G__125384,G__125385,G__125382,heading,block,temp__5804__auto__,repo,db_QMARK_))
,versions));


var G__125472 = seq__125394;
var G__125473 = chunk__125395;
var G__125474 = count__125396;
var G__125475 = (i__125397 + (1));
seq__125394 = G__125472;
chunk__125395 = G__125473;
count__125396 = G__125474;
i__125397 = G__125475;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__125394);
if(temp__5804__auto____$1){
var seq__125394__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__125394__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__125394__$1);
var G__125476 = cljs.core.chunk_rest(seq__125394__$1);
var G__125477 = c__5525__auto__;
var G__125478 = cljs.core.count(c__5525__auto__);
var G__125479 = (0);
seq__125394 = G__125476;
chunk__125395 = G__125477;
count__125396 = G__125478;
i__125397 = G__125479;
continue;
} else {
var vec__125407 = cljs.core.first(seq__125394__$1);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125407,(0),null);
var versions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125407,(1),null);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], 0));

cljs.pprint.print_table.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"created-at","created-at",-89248644)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__125394,chunk__125395,count__125396,i__125397,vec__125407,block_uuid,versions,seq__125394__$1,temp__5804__auto____$1,token,graph_uuid,G__125384,G__125385,G__125382,heading,block,temp__5804__auto__,repo,db_QMARK_){
return (function (version){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),cljs_time.coerce.from_long((new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(version) * (1000))),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(version)], null);
});})(seq__125394,chunk__125395,count__125396,i__125397,vec__125407,block_uuid,versions,seq__125394__$1,temp__5804__auto____$1,token,graph_uuid,G__125384,G__125385,G__125382,heading,block,temp__5804__auto__,repo,db_QMARK_))
,versions));


var G__125480 = cljs.core.next(seq__125394__$1);
var G__125481 = null;
var G__125482 = (0);
var G__125483 = (0);
seq__125394 = G__125480;
chunk__125395 = G__125481;
count__125396 = G__125482;
i__125397 = G__125483;
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
var G__125393 = "(Dev) Show block content history";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125392,G__125393) : logseq.shui.ui.dropdown_menu_item.call(null,G__125392,G__125393));
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3(G__125384,G__125385,G__125386) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__125384,G__125385,G__125386));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__125382,G__125383) : logseq.shui.ui.dropdown_menu_sub.call(null,G__125382,G__125383));
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
var attrs125418 = (function (){var G__125419 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open-in-sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),block_ref_id,new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
})], null);
var G__125420 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","open-in-sidebar","content/open-in-sidebar",731683416)], 0));
var G__125421 = (function (){var G__125422 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["\u21E7+click"], null);
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__125422) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__125422));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__125419,G__125420,G__125421) : logseq.shui.ui.dropdown_menu_item.call(null,G__125419,G__125420,G__125421));
})();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs125418))?daiquiri.interpreter.element_attributes(attrs125418):null),((cljs.core.map_QMARK_(attrs125418))?[daiquiri.interpreter.interpret((function (){var G__125425 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_current_ref(block_ref_id);
})], null);
var G__125426 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-ref","content/copy-ref",-2112625163)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125425,G__125426) : logseq.shui.ui.dropdown_menu_item.call(null,G__125425,G__125426));
})()),daiquiri.interpreter.interpret((function (){var G__125429 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_current_ref_BANG_(block,block_ref_id);
})], null);
var G__125430 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","delete-ref","content/delete-ref",1711148336)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125429,G__125430) : logseq.shui.ui.dropdown_menu_item.call(null,G__125429,G__125430));
})()),daiquiri.interpreter.interpret((function (){var G__125433 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-text",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_text_BANG_(block,block_ref_id);
})], null);
var G__125434 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-text","content/replace-with-text",1336545931)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125433,G__125434) : logseq.shui.ui.dropdown_menu_item.call(null,G__125433,G__125434));
})()),daiquiri.interpreter.interpret((function (){var G__125437 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_embed_BANG_(block,block_ref_id);
})], null);
var G__125438 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-embed","content/replace-with-embed",-1134258828)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125437,G__125438) : logseq.shui.ui.dropdown_menu_item.call(null,G__125437,G__125438));
})())]:[daiquiri.interpreter.interpret(attrs125418),daiquiri.interpreter.interpret((function (){var G__125441 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"copy",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.copy_current_ref(block_ref_id);
})], null);
var G__125442 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","copy-ref","content/copy-ref",-2112625163)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125441,G__125442) : logseq.shui.ui.dropdown_menu_item.call(null,G__125441,G__125442));
})()),daiquiri.interpreter.interpret((function (){var G__125445 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.delete_current_ref_BANG_(block,block_ref_id);
})], null);
var G__125446 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","delete-ref","content/delete-ref",1711148336)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125445,G__125446) : logseq.shui.ui.dropdown_menu_item.call(null,G__125445,G__125446));
})()),daiquiri.interpreter.interpret((function (){var G__125449 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-text",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_text_BANG_(block,block_ref_id);
})], null);
var G__125450 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-text","content/replace-with-text",1336545931)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125449,G__125450) : logseq.shui.ui.dropdown_menu_item.call(null,G__125449,G__125450));
})()),daiquiri.interpreter.interpret((function (){var G__125453 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"replace-with-embed",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.editor.replace_ref_with_embed_BANG_(block,block_ref_id);
})], null);
var G__125454 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","replace-with-embed","content/replace-with-embed",-1134258828)], 0));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__125453,G__125454) : logseq.shui.ui.dropdown_menu_item.call(null,G__125453,G__125454));
})())]));
} else {
return null;
}
}),null,"frontend.components.content/block-ref-custom-context-menu-content");
frontend.components.content.page_title_custom_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (page){
if(cljs.core.truth_(page)){
var page_menu_options = frontend.components.page_menu.page_menu(page);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$content$iter__125455(s__125456){
return (new cljs.core.LazySeq(null,(function (){
var s__125456__$1 = s__125456;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__125456__$1);
if(temp__5804__auto__){
var s__125456__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__125456__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__125456__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__125458 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__125457 = (0);
while(true){
if((i__125457 < size__5479__auto__)){
var map__125459 = cljs.core._nth(c__5478__auto__,i__125457);
var map__125459__$1 = cljs.core.__destructure_map(map__125459);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125459__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125459__$1,new cljs.core.Keyword(null,"options","options",99638489));
cljs.core.chunk_append(b__125458,daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(options,title) : logseq.shui.ui.dropdown_menu_item.call(null,options,title))));

var G__125484 = (i__125457 + (1));
i__125457 = G__125484;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__125458),frontend$components$content$iter__125455(cljs.core.chunk_rest(s__125456__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__125458),null);
}
} else {
var map__125460 = cljs.core.first(s__125456__$2);
var map__125460__$1 = cljs.core.__destructure_map(map__125460);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125460__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125460__$1,new cljs.core.Keyword(null,"options","options",99638489));
return cljs.core.cons(daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(options,title) : logseq.shui.ui.dropdown_menu_item.call(null,options,title))),frontend$components$content$iter__125455(cljs.core.rest(s__125456__$2)));
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
frontend.components.content.hiccup_content = rum.core.lazy_build(rum.core.build_defc,(function (id,p__125461){
var map__125462 = p__125461;
var map__125462__$1 = cljs.core.__destructure_map(map__125462);
var hiccup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125462__$1,new cljs.core.Keyword(null,"hiccup","hiccup",1218876238));
return daiquiri.core.create_element("div",{'id':id},[(cljs.core.truth_(hiccup)?daiquiri.interpreter.interpret(hiccup):(function (){var attrs125463 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","click-to-edit","content/click-to-edit",-166350355)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs125463))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cursor"], null)], null),attrs125463], 0))):{'className':"cursor"}),((cljs.core.map_QMARK_(attrs125463))?null:[daiquiri.interpreter.interpret(attrs125463)]));
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
return daiquiri.core.create_element("pre",{'id':id,'onClick':on_click__$1,'className':"cursor content pre-white-space"},[((clojure.string.blank_QMARK_(content))?(function (){var attrs125464 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","click-to-edit","content/click-to-edit",-166350355)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs125464))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cursor"], null)], null),attrs125464], 0))):{'className':"cursor"}),((cljs.core.map_QMARK_(attrs125464))?null:[daiquiri.interpreter.interpret(attrs125464)]));
})():daiquiri.interpreter.interpret(content))]);
}
}),null,"frontend.components.content/non-hiccup-content");
frontend.components.content.set_draw_iframe_style_BANG_ = (function frontend$components$content$set_draw_iframe_style_BANG_(){
var width = frontend.components.content.goog$module$goog$object.get(window,"innerWidth");
if((width >= (1024))){
var draws = dommy.utils.__GT_Array(document.getElementsByClassName("draw-iframe"));
var width__$1 = (width - (200));
var seq__125465 = cljs.core.seq(draws);
var chunk__125466 = null;
var count__125467 = (0);
var i__125468 = (0);
while(true){
if((i__125468 < count__125467)){
var draw = chunk__125466.cljs$core$IIndexed$_nth$arity$2(null,i__125468);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"width","width",-384071477),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(width__$1),"px"].join('')], 0));

var height_125485 = (function (){var x__5087__auto__ = (700);
var y__5088__auto__ = (width__$1 / (2));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"height","height",1025178622),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(height_125485),"px"].join('')], 0));

dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((- ((width__$1 - (570)) / (2)))),"px"].join('')], 0));


var G__125486 = seq__125465;
var G__125487 = chunk__125466;
var G__125488 = count__125467;
var G__125489 = (i__125468 + (1));
seq__125465 = G__125486;
chunk__125466 = G__125487;
count__125467 = G__125488;
i__125468 = G__125489;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__125465);
if(temp__5804__auto__){
var seq__125465__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__125465__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__125465__$1);
var G__125490 = cljs.core.chunk_rest(seq__125465__$1);
var G__125491 = c__5525__auto__;
var G__125492 = cljs.core.count(c__5525__auto__);
var G__125493 = (0);
seq__125465 = G__125490;
chunk__125466 = G__125491;
count__125467 = G__125492;
i__125468 = G__125493;
continue;
} else {
var draw = cljs.core.first(seq__125465__$1);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"width","width",-384071477),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(width__$1),"px"].join('')], 0));

var height_125494 = (function (){var x__5087__auto__ = (700);
var y__5088__auto__ = (width__$1 / (2));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"height","height",1025178622),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(height_125494),"px"].join('')], 0));

dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(draw,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((- ((width__$1 - (570)) / (2)))),"px"].join('')], 0));


var G__125495 = cljs.core.next(seq__125465__$1);
var G__125496 = null;
var G__125497 = (0);
var G__125498 = (0);
seq__125465 = G__125495;
chunk__125466 = G__125496;
count__125467 = G__125497;
i__125468 = G__125498;
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
frontend.components.content.content = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,p__125469){
var map__125470 = p__125469;
var map__125470__$1 = cljs.core.__destructure_map(map__125470);
var option = map__125470__$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125470__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125470__$1,new cljs.core.Keyword(null,"config","config",994861415));
var hiccup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125470__$1,new cljs.core.Keyword(null,"hiccup","hiccup",1218876238));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125470__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125470__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
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
