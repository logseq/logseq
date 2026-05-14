goog.provide('frontend.mobile.mobile_bar');
/**
 * Call blur on the textarea if it is in composition mode, let the IME commit the composing text
 */
frontend.mobile.mobile_bar.blur_if_compositing = (function frontend$mobile$mobile_bar$blur_if_compositing(){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.state.editor_in_composition_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_edit_input_id();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var edit_input_id = temp__5804__auto__;
var textarea_el = goog.dom.getElement(edit_input_id);
return textarea_el.blur();
} else {
return null;
}
});
frontend.mobile.mobile_bar.indent_outdent = rum.core.lazy_build(rum.core.build_defc,(function (indent_QMARK_,icon){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("button",{'onPointerDown':(function (e){
frontend.util.stop(e);

frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();

frontend.mobile.mobile_bar.blur_if_compositing();

return frontend.handler.editor.indent_outdent(indent_QMARK_);
}),'className':"bottom-action"},[daiquiri.interpreter.interpret(frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null)))])]);
}),null,"frontend.mobile.mobile-bar/indent-outdent");
frontend.mobile.mobile_bar.command = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__89185__delegate = function (command_handler,p__89152,p__89153){
var map__89154 = p__89152;
var map__89154__$1 = cljs.core.__destructure_map(map__89154);
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89154__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89154__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var vec__89155 = p__89153;
var event_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89155,(0),null);
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("button",{'onPointerDown':(function (e){
frontend.util.stop(e);

frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();

if(cljs.core.truth_(event_QMARK_)){
return (command_handler.cljs$core$IFn$_invoke$arity$1 ? command_handler.cljs$core$IFn$_invoke$arity$1(e) : command_handler.call(null,e));
} else {
return (command_handler.cljs$core$IFn$_invoke$arity$0 ? command_handler.cljs$core$IFn$_invoke$arity$0() : command_handler.call(null));
}
}),'className':"bottom-action"},[daiquiri.interpreter.interpret(frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size,new cljs.core.Keyword(null,"class","class",-2030961996),class$], null)))])]);
};
var G__89185 = function (command_handler,p__89152,var_args){
var p__89153 = null;
if (arguments.length > 2) {
var G__89186__i = 0, G__89186__a = new Array(arguments.length -  2);
while (G__89186__i < G__89186__a.length) {G__89186__a[G__89186__i] = arguments[G__89186__i + 2]; ++G__89186__i;}
  p__89153 = new cljs.core.IndexedSeq(G__89186__a,0,null);
} 
return G__89185__delegate.call(this,command_handler,p__89152,p__89153);};
G__89185.cljs$lang$maxFixedArity = 2;
G__89185.cljs$lang$applyTo = (function (arglist__89187){
var command_handler = cljs.core.first(arglist__89187);
arglist__89187 = cljs.core.next(arglist__89187);
var p__89152 = cljs.core.first(arglist__89187);
var p__89153 = cljs.core.rest(arglist__89187);
return G__89185__delegate(command_handler,p__89152,p__89153);
});
G__89185.cljs$core$IFn$_invoke$arity$variadic = G__89185__delegate;
return G__89185;
})()
,null,"frontend.mobile.mobile-bar/command");
frontend.mobile.mobile_bar.timestamp_submenu = rum.core.lazy_build(rum.core.build_defc,(function (parent_id){
var callback = (function (event){
frontend.util.stop(event);

var target = goog.dom.getElement("mobile-toolbar-timestamp-submenu");
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(target,"show-submenu");
});
var command_cp = (function (action,description){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
(action.cljs$core$IFn$_invoke$arity$0 ? action.cljs$core$IFn$_invoke$arity$0() : action.call(null));

return callback(e);
})], null),description], null);
});
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'id':"mobile-toolbar-timestamp-submenu",'style':{'bottom':cljs.core.deref(frontend.util.keyboard_height)},'className':"submenu"},[daiquiri.interpreter.interpret(command_cp((function (){
var today = frontend.handler.page.get_page_ref_text(frontend.date.today());
return frontend.commands.simple_insert_BANG_(parent_id,today,cljs.core.PersistentArrayMap.EMPTY);
}),"Today")),daiquiri.interpreter.interpret(command_cp((function (){
var tomorrow = frontend.handler.page.get_page_ref_text(frontend.date.tomorrow());
return frontend.commands.simple_insert_BANG_(parent_id,tomorrow,cljs.core.PersistentArrayMap.EMPTY);
}),"Tomorrow")),daiquiri.interpreter.interpret(command_cp((function (){
var yesterday = frontend.handler.page.get_page_ref_text(frontend.date.yesterday());
return frontend.commands.simple_insert_BANG_(parent_id,yesterday,cljs.core.PersistentArrayMap.EMPTY);
}),"Yesterday")),daiquiri.interpreter.interpret(command_cp((function (){
var timestamp = frontend.date.get_current_time();
return frontend.commands.simple_insert_BANG_(parent_id,timestamp,cljs.core.PersistentArrayMap.EMPTY);
}),"Time"))])]);
}),null,"frontend.mobile.mobile-bar/timestamp-submenu");
frontend.mobile.mobile_bar.insert_text = (function frontend$mobile$mobile_bar$insert_text(text,opts){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var parent_id = temp__5804__auto__;
var input = goog.dom.getElement(parent_id);
var pos = frontend.util.cursor.pos(input);
var c = (((pos > (0)))?cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(input.value,(pos - (1)))):null);
var text_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = c;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c," ");
} else {
return and__5000__auto__;
}
})())?[" ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(text)].join(''):text);
return frontend.commands.simple_insert_BANG_(parent_id,text_SINGLEQUOTE_,opts);
} else {
return null;
}
});
frontend.mobile.mobile_bar.commands = (function frontend$mobile$mobile_bar$commands(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.mobile.mobile_bar.command((function (){
return frontend.mobile.mobile_bar.insert_text("#",cljs.core.PersistentArrayMap.EMPTY);
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"hash"], null),true),frontend.mobile.mobile_bar.command((function (){
return frontend.mobile.mobile_bar.insert_text(logseq.common.util.page_ref.left_and_right_brackets,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2),new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015),(function (_,___$1,___$2){
var input = frontend.state.get_input();
var new_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),new_pos], null));

return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null));
})], null));
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"brackets"], null),true),frontend.mobile.mobile_bar.command((function (){
return frontend.mobile.mobile_bar.insert_text("/",cljs.core.PersistentArrayMap.EMPTY);
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"command"], null),true)], null);
});
frontend.mobile.mobile_bar.mobile_bar = rum.core.lazy_build(rum.core.build_defc,(function (){
if(cljs.core.truth_(frontend.util.mobile_QMARK_())){
var commands_SINGLEQUOTE_ = frontend.mobile.mobile_bar.commands();
return daiquiri.core.create_element("div",{'id':"mobile-editor-toolbar"},[daiquiri.core.create_element("div",{'className':"toolbar-commands"},[frontend.mobile.mobile_bar.command((function (){
frontend.mobile.mobile_bar.blur_if_compositing();

return frontend.handler.editor.cycle_todo_BANG_();
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"checkbox"], null),true),frontend.mobile.mobile_bar.indent_outdent(false,"arrow-left-to-arc"),frontend.mobile.mobile_bar.indent_outdent(true,"arrow-right-to-arc"),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$mobile$mobile_bar$iter__89171(s__89172){
return (new cljs.core.LazySeq(null,(function (){
var s__89172__$1 = s__89172;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89172__$1);
if(temp__5804__auto__){
var s__89172__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89172__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89172__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89174 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89173 = (0);
while(true){
if((i__89173 < size__5479__auto__)){
var command_SINGLEQUOTE_ = cljs.core._nth(c__5478__auto__,i__89173);
cljs.core.chunk_append(b__89174,daiquiri.interpreter.interpret(command_SINGLEQUOTE_));

var G__89192 = (i__89173 + (1));
i__89173 = G__89192;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89174),frontend$mobile$mobile_bar$iter__89171(cljs.core.chunk_rest(s__89172__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89174),null);
}
} else {
var command_SINGLEQUOTE_ = cljs.core.first(s__89172__$2);
return cljs.core.cons(daiquiri.interpreter.interpret(command_SINGLEQUOTE_),frontend$mobile$mobile_bar$iter__89171(cljs.core.rest(s__89172__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(commands_SINGLEQUOTE_);
})()),frontend.mobile.mobile_bar.command((function (){
var parent_id = frontend.state.get_edit_input_id();
return frontend.mobile.camera.embed_photo(parent_id);
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"camera"], null),true)]),daiquiri.core.create_element("div",{'className':"toolbar-hide-keyboard"},[frontend.mobile.mobile_bar.command((function (){
frontend.state.clear_edit_BANG_();

return frontend.mobile.core.keyboard_hide();
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),"keyboard-show"], null))])]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.mobile.mobile-bar/mobile-bar");

//# sourceMappingURL=frontend.mobile.mobile_bar.js.map
