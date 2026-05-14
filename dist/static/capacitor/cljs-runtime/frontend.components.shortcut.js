goog.provide('frontend.components.shortcut');
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.shortcut !== 'undefined') && (typeof frontend.components.shortcut.categories !== 'undefined')){
} else {
frontend.components.shortcut.categories = (new cljs.core.PersistentVector(null,10,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("shortcut.category","basics","shortcut.category/basics",-1775874746),new cljs.core.Keyword("shortcut.category","navigating","shortcut.category/navigating",-2030317791),new cljs.core.Keyword("shortcut.category","block-editing","shortcut.category/block-editing",-1150211354),new cljs.core.Keyword("shortcut.category","block-command-editing","shortcut.category/block-command-editing",1958480544),new cljs.core.Keyword("shortcut.category","block-selection","shortcut.category/block-selection",1439375136),new cljs.core.Keyword("shortcut.category","formatting","shortcut.category/formatting",-723875074),new cljs.core.Keyword("shortcut.category","toggle","shortcut.category/toggle",677164372),new cljs.core.Keyword("shortcut.category","whiteboard","shortcut.category/whiteboard",855366858),new cljs.core.Keyword("shortcut.category","plugins","shortcut.category/plugins",-1801186145),new cljs.core.Keyword("shortcut.category","others","shortcut.category/others",1492019197)],null));
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.shortcut !== 'undefined') && (typeof frontend.components.shortcut._STAR_refresh_sentry !== 'undefined')){
} else {
frontend.components.shortcut._STAR_refresh_sentry = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
frontend.components.shortcut.refresh_shortcuts_list_BANG_ = (function frontend$components$shortcut$refresh_shortcuts_list_BANG_(){
return cljs.core.reset_BANG_(frontend.components.shortcut._STAR_refresh_sentry,(cljs.core.deref(frontend.components.shortcut._STAR_refresh_sentry) + (1)));
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.shortcut !== 'undefined') && (typeof frontend.components.shortcut._STAR_global_listener_setup_QMARK_ !== 'undefined')){
} else {
frontend.components.shortcut._STAR_global_listener_setup_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.shortcut !== 'undefined') && (typeof frontend.components.shortcut._STAR_customize_modal_life_sentry !== 'undefined')){
} else {
frontend.components.shortcut._STAR_customize_modal_life_sentry = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
frontend.components.shortcut.to_vector = (function frontend$components$shortcut$to_vector(v){
if((v == null)){
return null;
} else {
if(cljs.core.sequential_QMARK_(v)){
return cljs.core.vec(v);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
}
}
});
frontend.components.shortcut.keyboard_filter_record_inner = rum.core.lazy_build(rum.core.build_defc,(function (keystroke,set_keystroke_BANG_,close_fn){
var keypressed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("",keystroke);
logseq.shui.hooks.use_effect_BANG_((function (){
var key_handler = (new goog.events.KeyHandler(document));
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto___92735 = "[shortcuts] unlisten*";
console.time(k__50701__auto___92735);

var res__50702__auto___92736 = frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(true);
console.timeEnd(k__50701__auto___92735);

} else {
frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}

goog.events.listen(key_handler,"key",(function (e){
e.preventDefault();

var G__92373 = (function (p1__92372_SHARP_){
return frontend.util.trim_safe([cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__92372_SHARP_),frontend.modules.shortcut.core.keyname(e)].join(''));
});
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1(G__92373) : set_keystroke_BANG_.call(null,G__92373));
}));

return (function (){
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto___92737 = "[shortcuts] listen*";
console.time(k__50701__auto___92737);

var res__50702__auto___92738 = frontend.modules.shortcut.core.listen_all_BANG_();
console.timeEnd(k__50701__auto___92737);

} else {
frontend.modules.shortcut.core.listen_all_BANG_();
}

return key_handler.dispose();
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"keyboard-filter-record"},[daiquiri.core.create_element("h2",null,[(function (){var attrs92375 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-filter","keymap/keystroke-filter",-601559587)], 0));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs92375))?daiquiri.interpreter.element_attributes(attrs92375):null),((cljs.core.map_QMARK_(attrs92375))?null:[daiquiri.interpreter.interpret(attrs92375)]));
})(),(function (){var attrs92376 = ((keypressed_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
})], null),frontend.ui.icon("zoom-reset",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null))], null):null);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92376))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","space-x-2"], null)], null),attrs92376], 0))):{'className':"flex space-x-2"}),((cljs.core.map_QMARK_(attrs92376))?[daiquiri.core.create_element("a",{'onClick':(function (){
(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]:[daiquiri.interpreter.interpret(attrs92376),daiquiri.core.create_element("a",{'onClick':(function (){
(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]));
})()]),(function (){var attrs92374 = (((!(keypressed_QMARK_)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-record-desc","keymap/keystroke-record-desc",1257024427)], 0))], null):((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.render_keyboard_shortcut(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [keystroke], null))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92374))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["wrap","p-2"], null)], null),attrs92374], 0))):{'className':"wrap p-2"}),((cljs.core.map_QMARK_(attrs92374))?null:[daiquiri.interpreter.interpret(attrs92374)]));
})()]);
}),null,"frontend.components.shortcut/keyboard-filter-record-inner");
frontend.components.shortcut.pane_controls = rum.core.lazy_build(rum.core.build_defc,(function (q,set_q_BANG_,filters,set_filters_BANG_,keystroke,set_keystroke_BANG_,toggle_categories_fn){
var _STAR_search_ref = rum.core.use_ref(null);
return daiquiri.core.create_element("div",{'className':"cp__shortcut-page-x-pane-controls"},[daiquiri.core.create_element("a",{'onClick':toggle_categories_fn,'title':"Toggle categories pane",'className':"flex items-center icon-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("fold"))]),daiquiri.core.create_element("a",{'onClick':frontend.components.shortcut.refresh_shortcuts_list_BANG_,'title':"Refresh all",'className':"flex items-center icon-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("refresh"))]),daiquiri.core.create_element("span",{'className':"search-input-wrap"},[daiquiri.core.create_element("input",{'placeholder':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","search","keymap/search",-18378929)], 0)),'ref':_STAR_search_ref,'value':(function (){var or__5002__auto__ = q;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),'autoFocus':true,'onKeyDown':(function (p1__92377_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((27),p1__92377_SHARP_.keyCode)){
frontend.util.stop(p1__92377_SHARP_);

if(clojure.string.blank_QMARK_(q)){
var G__92379 = rum.core.deref(_STAR_search_ref);
if((G__92379 == null)){
return null;
} else {
return G__92379.blur();
}
} else {
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_q_BANG_.call(null,""));
}
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (p1__92378_SHARP_){
var v = frontend.util.evalue(p1__92378_SHARP_);
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1(v) : set_q_BANG_.call(null,v));
})),'className':"form-input is-small"},[]),((clojure.string.blank_QMARK_(q))?null:daiquiri.core.create_element("a",{'onClick':(function (){
(set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_q_BANG_.call(null,""));

return setTimeout((function (){
var G__92380 = rum.core.deref(_STAR_search_ref);
if((G__92380 == null)){
return null;
} else {
return G__92380.focus();
}
}),(50));
}),'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]),frontend.ui.dropdown((function (p__92385){
var map__92386 = p__92385;
var map__92386__$1 = cljs.core.__destructure_map(map__92386);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92386__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.icon-link","a.flex.items-center.icon-link",2144652115),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn], null),frontend.ui.icon("keyboard"),((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.point("bg-red-600.absolute",(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"right","right",-452581833),(-2),new cljs.core.Keyword(null,"top","top",-1856271961),(-2)], null)], null)))], null);
}),(function (p__92387){
var map__92388 = p__92387;
var map__92388__$1 = cljs.core.__destructure_map(map__92388);
var close_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92388__$1,new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512));
return frontend.components.shortcut.keyboard_filter_record_inner(keystroke,set_keystroke_BANG_,close_fn);
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outside?","outside?",-1930213908),true,new cljs.core.Keyword(null,"trigger-class","trigger-class",1251717016),"keyboard-filter"], null)),frontend.ui.dropdown_with_links((function (p__92397){
var map__92398 = p__92397;
var map__92398__$1 = cljs.core.__destructure_map(map__92398);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92398__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.icon-link.relative","a.flex.items-center.icon-link.relative",1980117728),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn], null),frontend.ui.icon("filter"),((cljs.core.seq(filters))?frontend.ui.point("bg-red-600.absolute",(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"right","right",-452581833),(-2),new cljs.core.Keyword(null,"top","top",-1856271961),(-2)], null)], null)):null)], null);
}),(function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92399(s__92400){
return (new cljs.core.LazySeq(null,(function (){
var s__92400__$1 = s__92400;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92400__$1);
if(temp__5804__auto__){
var s__92400__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92400__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92400__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92402 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92401 = (0);
while(true){
if((i__92401 < size__5479__auto__)){
var k = cljs.core._nth(c__5478__auto__,i__92401);
var all_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"All","All",-2078402587));
var checked_QMARK_ = ((cljs.core.contains_QMARK_(filters,k)) || (((all_QMARK_) && ((cljs.core.seq(filters) == null)))));
cljs.core.chunk_append(b__92402,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),((all_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","all","keymap/all",160385963)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"keymap","keymap",-499605268),clojure.string.lower_case(cljs.core.name(k)))], 0))),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(((checked_QMARK_)?"checkbox":"square")),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92401,all_QMARK_,checked_QMARK_,k,c__5478__auto__,size__5479__auto__,b__92402,s__92400__$2,temp__5804__auto__,_STAR_search_ref){
return (function (){
var G__92403 = ((all_QMARK_)?cljs.core.PersistentHashSet.EMPTY:(function (){var f = ((checked_QMARK_)?cljs.core.disj:cljs.core.conj);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(filters,k) : f.call(null,filters,k));
})());
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__92403) : set_filters_BANG_.call(null,G__92403));
});})(i__92401,all_QMARK_,checked_QMARK_,k,c__5478__auto__,size__5479__auto__,b__92402,s__92400__$2,temp__5804__auto__,_STAR_search_ref))
], null)], null));

var G__92739 = (i__92401 + (1));
i__92401 = G__92739;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92402),frontend$components$shortcut$iter__92399(cljs.core.chunk_rest(s__92400__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92402),null);
}
} else {
var k = cljs.core.first(s__92400__$2);
var all_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"All","All",-2078402587));
var checked_QMARK_ = ((cljs.core.contains_QMARK_(filters,k)) || (((all_QMARK_) && ((cljs.core.seq(filters) == null)))));
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),((all_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","all","keymap/all",160385963)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"keymap","keymap",-499605268),clojure.string.lower_case(cljs.core.name(k)))], 0))),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(((checked_QMARK_)?"checkbox":"square")),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (all_QMARK_,checked_QMARK_,k,s__92400__$2,temp__5804__auto__,_STAR_search_ref){
return (function (){
var G__92404 = ((all_QMARK_)?cljs.core.PersistentHashSet.EMPTY:(function (){var f = ((checked_QMARK_)?cljs.core.disj:cljs.core.conj);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(filters,k) : f.call(null,filters,k));
})());
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__92404) : set_filters_BANG_.call(null,G__92404));
});})(all_QMARK_,checked_QMARK_,k,s__92400__$2,temp__5804__auto__,_STAR_search_ref))
], null)], null),frontend$components$shortcut$iter__92399(cljs.core.rest(s__92400__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"All","All",-2078402587),new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627),new cljs.core.Keyword(null,"Unset","Unset",91993016),new cljs.core.Keyword(null,"Custom","Custom",-1084118283)], null));
})(),null)]);
}),null,"frontend.components.shortcut/pane-controls");
frontend.components.shortcut.shortcut_desc_label = rum.core.lazy_build(rum.core.build_defc,(function (id,binding_map){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = binding_map;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(id);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id_SINGLEQUOTE_ = temp__5804__auto__;
var plugin_QMARK_ = clojure.string.starts_with_QMARK_(id_SINGLEQUOTE_,":plugin.");
var id_SINGLEQUOTE___$1 = ((plugin_QMARK_)?(function (){var G__92408 = id_SINGLEQUOTE_;
if((G__92408 == null)){
return null;
} else {
return clojure.string.replace(G__92408,"plugin.","");
}
})():id_SINGLEQUOTE_);
var plugin_id = ((plugin_QMARK_)?cljs.core.namespace(id):null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE___$1),"#",(function (){var G__92410 = new cljs.core.Keyword(null,"handler-id","handler-id",1160395333).cljs$core$IFn$_invoke$arity$1(binding_map);
if((G__92410 == null)){
return null;
} else {
return cljs.core.name(G__92410);
}
})()].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-1","span.px-1",-2108616757),frontend.modules.shortcut.data_helper.get_shortcut_desc(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(binding_map,new cljs.core.Keyword(null,"id","id",-1388402092),id))], null),((plugin_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),plugin_id], null):null)], null);
} else {
return null;
}
})());
}),null,"frontend.components.shortcut/shortcut-desc-label");
frontend.components.shortcut.open_customize_shortcut_dialog_BANG_ = (function frontend$components$shortcut$open_customize_shortcut_dialog_BANG_(id){
var temp__5804__auto__ = frontend.modules.shortcut.data_helper.shortcut_item(id);
if(cljs.core.truth_(temp__5804__auto__)){
var map__92411 = temp__5804__auto__;
var map__92411__$1 = cljs.core.__destructure_map(map__92411);
var m = map__92411__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92411__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92411__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var modal_id = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"customize-shortcut","customize-shortcut",1500084014)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var args = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,label,binding__$1,user_binding__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"saved-cb","saved-cb",-1362182471),(function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((500)),frontend.components.shortcut.refresh_shortcuts_list_BANG_);
}),new cljs.core.Keyword(null,"modal-id","modal-id",-1810873919),modal_id], null)], null);
var G__92412 = (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.components.shortcut.customize_shortcut_dialog_inner,args);
});
var G__92413 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),modal_id,new cljs.core.Keyword(null,"class","class",-2030961996),"w-auto md:max-w-2xl",new cljs.core.Keyword(null,"payload","payload",-383036092),args], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__92412,G__92413) : logseq.shui.ui.dialog_open_BANG_.call(null,G__92412,G__92413));
} else {
return null;
}
});
frontend.components.shortcut.shortcut_conflicts_display = rum.core.lazy_build(rum.core.build_defc,(function (_k,conflicts_map){
return daiquiri.core.create_element("div",{'className':"cp__shortcut-conflicts-list-wrap"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92414(s__92415){
return (new cljs.core.LazySeq(null,(function (){
var s__92415__$1 = s__92415;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92415__$1);
if(temp__5804__auto__){
var s__92415__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92415__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92415__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92417 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92416 = (0);
while(true){
if((i__92416 < size__5479__auto__)){
var vec__92418 = cljs.core._nth(c__5478__auto__,i__92416);
var g = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92418,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92418,(1),null);
cljs.core.chunk_append(b__92417,daiquiri.core.create_element("section",{'className':"relative"},[(function (){var attrs92421 = frontend.ui.icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs92421))?daiquiri.interpreter.element_attributes(attrs92421):null),((cljs.core.map_QMARK_(attrs92421))?[(function (){var attrs92422 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92422))?daiquiri.interpreter.element_attributes(attrs92422):null),((cljs.core.map_QMARK_(attrs92422))?null:[daiquiri.interpreter.interpret(attrs92422)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]:[daiquiri.interpreter.interpret(attrs92421),(function (){var attrs92423 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92423))?daiquiri.interpreter.element_attributes(attrs92423):null),((cljs.core.map_QMARK_(attrs92423))?null:[daiquiri.interpreter.interpret(attrs92423)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]));
})(),daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92416,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92424(s__92425){
return (new cljs.core.LazySeq(null,((function (i__92416,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
var s__92425__$1 = s__92425;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92425__$1);
if(temp__5804__auto____$1){
var s__92425__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92425__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92425__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92427 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92426 = (0);
while(true){
if((i__92426 < size__5479__auto____$1)){
var v = cljs.core._nth(c__5478__auto____$1,i__92426);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
cljs.core.chunk_append(b__92427,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92426,i__92416,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92428(s__92429){
return (new cljs.core.LazySeq(null,((function (i__92426,i__92416,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
var s__92429__$1 = s__92429;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__92429__$1);
if(temp__5804__auto____$2){
var s__92429__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__92429__$2)){
var c__5478__auto____$2 = cljs.core.chunk_first(s__92429__$2);
var size__5479__auto____$2 = cljs.core.count(c__5478__auto____$2);
var b__92431 = cljs.core.chunk_buffer(size__5479__auto____$2);
if((function (){var i__92430 = (0);
while(true){
if((i__92430 < size__5479__auto____$2)){
var vec__92432 = cljs.core._nth(c__5478__auto____$2,i__92430);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92432,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92432,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__92431,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__92430,s__92429__$1,i__92426,i__92416,m,vec__92432,id_SINGLEQUOTE_,handler_id,c__5478__auto____$2,size__5479__auto____$2,b__92431,s__92429__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__92430,s__92429__$1,i__92426,i__92416,m,vec__92432,id_SINGLEQUOTE_,handler_id,c__5478__auto____$2,size__5479__auto____$2,b__92431,s__92429__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__92740 = (i__92430 + (1));
i__92430 = G__92740;
continue;
} else {
var G__92741 = (i__92430 + (1));
i__92430 = G__92741;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92431),frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92428(cljs.core.chunk_rest(s__92429__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92431),null);
}
} else {
var vec__92436 = cljs.core.first(s__92429__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92436,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92436,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__92429__$1,i__92426,i__92416,m,vec__92436,id_SINGLEQUOTE_,handler_id,s__92429__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__92429__$1,i__92426,i__92416,m,vec__92436,id_SINGLEQUOTE_,handler_id,s__92429__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92428(cljs.core.rest(s__92429__$2)));
} else {
var G__92742 = cljs.core.rest(s__92429__$2);
s__92429__$1 = G__92742;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__92426,i__92416,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,null,null));
});})(i__92426,i__92416,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__92427,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()));

var G__92743 = (i__92426 + (1));
i__92426 = G__92743;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92427),frontend$components$shortcut$iter__92414_$_iter__92424(cljs.core.chunk_rest(s__92425__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92427),null);
}
} else {
var v = cljs.core.first(s__92425__$2);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
return cljs.core.cons(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92416,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92439(s__92440){
return (new cljs.core.LazySeq(null,((function (i__92416,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
var s__92440__$1 = s__92440;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__92440__$1);
if(temp__5804__auto____$2){
var s__92440__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__92440__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92440__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92442 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92441 = (0);
while(true){
if((i__92441 < size__5479__auto____$1)){
var vec__92443 = cljs.core._nth(c__5478__auto____$1,i__92441);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92443,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92443,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__92442,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__92441,s__92440__$1,i__92416,m,vec__92443,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__92442,s__92440__$2,temp__5804__auto____$2,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__92441,s__92440__$1,i__92416,m,vec__92443,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__92442,s__92440__$2,temp__5804__auto____$2,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__92744 = (i__92441 + (1));
i__92441 = G__92744;
continue;
} else {
var G__92745 = (i__92441 + (1));
i__92441 = G__92745;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92442),frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92439(cljs.core.chunk_rest(s__92440__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92442),null);
}
} else {
var vec__92446 = cljs.core.first(s__92440__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92446,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92446,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__92440__$1,i__92416,m,vec__92446,id_SINGLEQUOTE_,handler_id,s__92440__$2,temp__5804__auto____$2,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__92440__$1,i__92416,m,vec__92446,id_SINGLEQUOTE_,handler_id,s__92440__$2,temp__5804__auto____$2,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__92414_$_iter__92424_$_iter__92439(cljs.core.rest(s__92440__$2)));
} else {
var G__92746 = cljs.core.rest(s__92440__$2);
s__92440__$1 = G__92746;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__92416,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,null,null));
});})(i__92416,k,vs,v,s__92425__$2,temp__5804__auto____$1,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()),frontend$components$shortcut$iter__92414_$_iter__92424(cljs.core.rest(s__92425__$2)));
}
} else {
return null;
}
break;
}
});})(i__92416,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
,null,null));
});})(i__92416,vec__92418,g,ks,c__5478__auto__,size__5479__auto__,b__92417,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.vals(ks));
})())])]));

var G__92747 = (i__92416 + (1));
i__92416 = G__92747;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92417),frontend$components$shortcut$iter__92414(cljs.core.chunk_rest(s__92415__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92417),null);
}
} else {
var vec__92449 = cljs.core.first(s__92415__$2);
var g = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92449,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92449,(1),null);
return cljs.core.cons(daiquiri.core.create_element("section",{'className':"relative"},[(function (){var attrs92421 = frontend.ui.icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs92421))?daiquiri.interpreter.element_attributes(attrs92421):null),((cljs.core.map_QMARK_(attrs92421))?[(function (){var attrs92422 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92422))?daiquiri.interpreter.element_attributes(attrs92422):null),((cljs.core.map_QMARK_(attrs92422))?null:[daiquiri.interpreter.interpret(attrs92422)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]:[daiquiri.interpreter.interpret(attrs92421),(function (){var attrs92423 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92423))?daiquiri.interpreter.element_attributes(attrs92423):null),((cljs.core.map_QMARK_(attrs92423))?null:[daiquiri.interpreter.interpret(attrs92423)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]));
})(),daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92452(s__92453){
return (new cljs.core.LazySeq(null,(function (){
var s__92453__$1 = s__92453;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92453__$1);
if(temp__5804__auto____$1){
var s__92453__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92453__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92453__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92455 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92454 = (0);
while(true){
if((i__92454 < size__5479__auto__)){
var v = cljs.core._nth(c__5478__auto__,i__92454);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
cljs.core.chunk_append(b__92455,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92454,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92456(s__92457){
return (new cljs.core.LazySeq(null,((function (i__92454,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function (){
var s__92457__$1 = s__92457;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__92457__$1);
if(temp__5804__auto____$2){
var s__92457__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__92457__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92457__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92459 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92458 = (0);
while(true){
if((i__92458 < size__5479__auto____$1)){
var vec__92460 = cljs.core._nth(c__5478__auto____$1,i__92458);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92460,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92460,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__92459,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__92458,s__92457__$1,i__92454,m,vec__92460,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__92459,s__92457__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__92458,s__92457__$1,i__92454,m,vec__92460,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__92459,s__92457__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__92748 = (i__92458 + (1));
i__92458 = G__92748;
continue;
} else {
var G__92749 = (i__92458 + (1));
i__92458 = G__92749;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92459),frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92456(cljs.core.chunk_rest(s__92457__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92459),null);
}
} else {
var vec__92463 = cljs.core.first(s__92457__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92463,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92463,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__92457__$1,i__92454,m,vec__92463,id_SINGLEQUOTE_,handler_id,s__92457__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__92457__$1,i__92454,m,vec__92463,id_SINGLEQUOTE_,handler_id,s__92457__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92456(cljs.core.rest(s__92457__$2)));
} else {
var G__92750 = cljs.core.rest(s__92457__$2);
s__92457__$1 = G__92750;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__92454,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
,null,null));
});})(i__92454,k,vs,v,c__5478__auto__,size__5479__auto__,b__92455,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()));

var G__92751 = (i__92454 + (1));
i__92454 = G__92751;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92455),frontend$components$shortcut$iter__92414_$_iter__92452(cljs.core.chunk_rest(s__92453__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92455),null);
}
} else {
var v = cljs.core.first(s__92453__$2);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
return cljs.core.cons(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92466(s__92467){
return (new cljs.core.LazySeq(null,(function (){
var s__92467__$1 = s__92467;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__92467__$1);
if(temp__5804__auto____$2){
var s__92467__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__92467__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92467__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92469 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92468 = (0);
while(true){
if((i__92468 < size__5479__auto__)){
var vec__92470 = cljs.core._nth(c__5478__auto__,i__92468);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92470,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92470,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__92469,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__92468,s__92467__$1,m,vec__92470,id_SINGLEQUOTE_,handler_id,c__5478__auto__,size__5479__auto__,b__92469,s__92467__$2,temp__5804__auto____$2,k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__92468,s__92467__$1,m,vec__92470,id_SINGLEQUOTE_,handler_id,c__5478__auto__,size__5479__auto__,b__92469,s__92467__$2,temp__5804__auto____$2,k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__92752 = (i__92468 + (1));
i__92468 = G__92752;
continue;
} else {
var G__92753 = (i__92468 + (1));
i__92468 = G__92753;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92469),frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92466(cljs.core.chunk_rest(s__92467__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92469),null);
}
} else {
var vec__92473 = cljs.core.first(s__92467__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92473,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92473,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__92467__$1,m,vec__92473,id_SINGLEQUOTE_,handler_id,s__92467__$2,temp__5804__auto____$2,k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__92467__$1,m,vec__92473,id_SINGLEQUOTE_,handler_id,s__92467__$2,temp__5804__auto____$2,k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs92435 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92435))?daiquiri.interpreter.element_attributes(attrs92435):null),((cljs.core.map_QMARK_(attrs92435))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs92435),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__92414_$_iter__92452_$_iter__92466(cljs.core.rest(s__92467__$2)));
} else {
var G__92754 = cljs.core.rest(s__92467__$2);
s__92467__$1 = G__92754;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});})(k,vs,v,s__92453__$2,temp__5804__auto____$1,vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()),frontend$components$shortcut$iter__92414_$_iter__92452(cljs.core.rest(s__92453__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__92449,g,ks,s__92415__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.vals(ks));
})())])]),frontend$components$shortcut$iter__92414(cljs.core.rest(s__92415__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(conflicts_map);
})())]);
}),null,"frontend.components.shortcut/shortcut-conflicts-display");
/**
 * user-binding: empty vector is for the unset state, nil is for the default binding
 */
frontend.components.shortcut.customize_shortcut_dialog_inner = rum.core.lazy_build(rum.core.build_defc,(function (k,action_name,binding,user_binding,p__92480){
var map__92481 = p__92480;
var map__92481__$1 = cljs.core.__destructure_map(map__92481);
var saved_cb = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92481__$1,new cljs.core.Keyword(null,"saved-cb","saved-cb",-1362182471));
var modal_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92481__$1,new cljs.core.Keyword(null,"modal-id","modal-id",-1810873919));
var _STAR_ref_el = rum.core.use_ref(null);
var vec__92482 = frontend.rum.use_atom(frontend.components.shortcut._STAR_customize_modal_life_sentry);
var modal_life = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92482,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92482,(1),null);
var vec__92485 = rum.core.use_state("");
var keystroke = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92485,(0),null);
var set_keystroke_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92485,(1),null);
var vec__92488 = rum.core.use_state((function (){var or__5002__auto__ = user_binding;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return binding;
}
})());
var current_binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92488,(0),null);
var set_current_binding_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92488,(1),null);
var vec__92491 = rum.core.use_state(null);
var key_conflicts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92491,(0),null);
var set_key_conflicts_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92491,(1),null);
var handler_id = logseq.shui.hooks.use_memo((function (){
return frontend.modules.shortcut.data_helper.get_group(k);
}),cljs.core.PersistentVector.EMPTY);
var dirty_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = user_binding;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return binding;
}
})(),current_binding);
var keypressed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("",keystroke);
var save_keystroke_fn_BANG_ = (function (){
var temp__5802__auto__ = cljs.core.seq(frontend.modules.shortcut.data_helper.parse_conflicts_from_binding(current_binding,keystroke));
if(temp__5802__auto__){
var current_conflicts = temp__5802__auto__;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$5(["Shortcut conflicts from existing binding: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__92495 = current_conflicts;
if((G__92495 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92476_SHARP_){
return frontend.modules.shortcut.utils.decorate_binding(p1__92476_SHARP_);
}),G__92495);
}
})()], 0))].join(''),new cljs.core.Keyword(null,"error","error",-978969032),true,new cljs.core.Keyword("shortcut-conflicts","warning","shortcut-conflicts/warning",1445082331),(5000));
} else {
var conflicts_map = frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$2(keystroke,handler_id);
if(cljs.core.not(cljs.core.seq(conflicts_map))){
var G__92496_92755 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_binding,keystroke);
(set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__92496_92755) : set_current_binding_BANG_.call(null,G__92496_92755));

(set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));

return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_key_conflicts_BANG_.call(null,null));
} else {
return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(conflicts_map) : set_key_conflicts_BANG_.call(null,conflicts_map));
}
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
var mid = logseq.shui.dialog.core.get_first_modal_id();
var mid_SINGLEQUOTE_ = logseq.shui.dialog.core.get_last_modal_id();
var el = rum.core.deref(_STAR_ref_el);
if(((((cljs.core.not(mid_SINGLEQUOTE_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mid,modal_id)))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mid_SINGLEQUOTE_,modal_id)))){
var G__92497_92756 = el;
if((G__92497_92756 == null)){
} else {
G__92497_92756.focus();
}

return setTimeout((function (){
var G__92498 = el.querySelector(".shortcut-record-control a.submit");
if((G__92498 == null)){
return null;
} else {
return G__92498.click();
}
}),(200));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [modal_life], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var el = rum.core.deref(_STAR_ref_el);
var key_handler = (new goog.events.KeyHandler(el));
var teardown_global_BANG_ = (cljs.core.truth_(cljs.core.deref(frontend.components.shortcut._STAR_global_listener_setup_QMARK_))?null:(function (){
frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(true);

cljs.core.reset_BANG_(frontend.components.shortcut._STAR_global_listener_setup_QMARK_,true);

return (function (){
frontend.modules.shortcut.core.listen_all_BANG_();

return cljs.core.reset_BANG_(frontend.components.shortcut._STAR_global_listener_setup_QMARK_,false);
});
})()
);
goog.events.listen(key_handler,"key",(function (e){
e.preventDefault();

(set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_key_conflicts_BANG_.call(null,null));

var G__92499 = (function (p1__92477_SHARP_){
return frontend.util.trim_safe([cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__92477_SHARP_),frontend.modules.shortcut.core.keyname(e)].join(''));
});
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1(G__92499) : set_keystroke_BANG_.call(null,G__92499));
}));

setTimeout((function (){
return el.focus();
}),(128));

return (function (){
var G__92500_92760 = teardown_global_BANG_;
if((G__92500_92760 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__92500_92760,null);
}

key_handler.dispose();

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.shortcut._STAR_customize_modal_life_sentry,cljs.core.inc);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'tabIndex':(-1),'ref':_STAR_ref_el,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__shortcut-page-x-record-dialog-inner",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"keypressed","keypressed",-1097101815),keypressed_QMARK_,new cljs.core.Keyword(null,"dirty","dirty",729553281),dirty_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"sm:w-lsm"},[(function (){var attrs92516 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","customize-for-label","keymap/customize-for-label",1860516586)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs92516))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xl","pb-2"], null)], null),attrs92516], 0))):{'className':"text-2xl pb-2"}),((cljs.core.map_QMARK_(attrs92516))?null:[daiquiri.interpreter.interpret(attrs92516)]));
})(),daiquiri.core.create_element("p",{'className':"mb-4 text-md"},[(function (){var attrs92517 = action_name;
return daiquiri.core.create_element("b",((cljs.core.map_QMARK_(attrs92517))?daiquiri.interpreter.element_attributes(attrs92517):null),((cljs.core.map_QMARK_(attrs92517))?null:[daiquiri.interpreter.interpret(attrs92517)]));
})()]),daiquiri.core.create_element("div",{'className':"shortcuts-keys-wrap"},[daiquiri.core.create_element("span",{'className':"keyboard-shortcut flex flex-wrap mr-2 space-x-2"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92519(s__92520){
return (new cljs.core.LazySeq(null,(function (){
var s__92520__$1 = s__92520;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92520__$1);
if(temp__5804__auto__){
var s__92520__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92520__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92520__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92522 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92521 = (0);
while(true){
if((i__92521 < size__5479__auto__)){
var x = cljs.core._nth(c__5478__auto__,i__92521);
if(typeof x === 'string'){
cljs.core.chunk_append(b__92522,daiquiri.core.create_element("code",{'className':"tracking-wider"},[frontend.modules.shortcut.utils.decorate_binding(clojure.string.lower_case(clojure.string.trim(x))),daiquiri.core.create_element("a",{'onClick':((function (i__92521,s__92520__$1,x,c__5478__auto__,size__5479__auto__,b__92522,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id){
return (function (){
var G__92523 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (i__92521,s__92520__$1,x,c__5478__auto__,size__5479__auto__,b__92522,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id){
return (function (p1__92478_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,p1__92478_SHARP_);
});})(i__92521,s__92520__$1,x,c__5478__auto__,size__5479__auto__,b__92522,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id))
,current_binding));
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__92523) : set_current_binding_BANG_.call(null,G__92523));
});})(i__92521,s__92520__$1,x,c__5478__auto__,size__5479__auto__,b__92522,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id))
,'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]));

var G__92766 = (i__92521 + (1));
i__92521 = G__92766;
continue;
} else {
var G__92767 = (i__92521 + (1));
i__92521 = G__92767;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92522),frontend$components$shortcut$iter__92519(cljs.core.chunk_rest(s__92520__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92522),null);
}
} else {
var x = cljs.core.first(s__92520__$2);
if(typeof x === 'string'){
return cljs.core.cons(daiquiri.core.create_element("code",{'className':"tracking-wider"},[frontend.modules.shortcut.utils.decorate_binding(clojure.string.lower_case(clojure.string.trim(x))),daiquiri.core.create_element("a",{'onClick':((function (s__92520__$1,x,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id){
return (function (){
var G__92524 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (s__92520__$1,x,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id){
return (function (p1__92478_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,p1__92478_SHARP_);
});})(s__92520__$1,x,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id))
,current_binding));
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__92524) : set_current_binding_BANG_.call(null,G__92524));
});})(s__92520__$1,x,s__92520__$2,temp__5804__auto__,_STAR_ref_el,vec__92482,modal_life,_,vec__92485,keystroke,set_keystroke_BANG_,vec__92488,current_binding,set_current_binding_BANG_,vec__92491,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__92481,map__92481__$1,saved_cb,modal_id))
,'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]),frontend$components$shortcut$iter__92519(cljs.core.rest(s__92520__$2)));
} else {
var G__92768 = cljs.core.rest(s__92520__$2);
s__92520__$1 = G__92768;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(current_binding);
})())]),(function (){var attrs92518 = ((keypressed_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.render_keyboard_shortcut(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [keystroke], null))),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.active:opacity-90.submit","a.flex.items-center.active:opacity-90.submit",-1059179250),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),save_keystroke_fn_BANG_], null),frontend.ui.icon("check",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90.cancel","a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90.cancel",389890030),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));

return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_key_conflicts_BANG_.call(null,null));
})], null),frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.flex.items-center","code.flex.items-center",450036941),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.pr-1","small.pr-1",794910716),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-record-setup-label","keymap/keystroke-record-setup-label",-1426705636)], 0))], null),frontend.ui.icon("keyboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92518))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["shortcut-record-control"], null)], null),attrs92518], 0))):{'className':"shortcut-record-control"}),((cljs.core.map_QMARK_(attrs92518))?null:[daiquiri.interpreter.interpret(attrs92518)]));
})()])]),((cljs.core.seq(key_conflicts))?frontend.components.shortcut.shortcut_conflicts_display(k,key_conflicts):null),(function (){var attrs92513 = ((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_binding,binding)) && (cljs.core.seq(binding))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.space-x-1.text-sm.fade-link","a.flex.items-center.space-x-1.text-sm.fade-link",-1501146342),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(binding) : set_current_binding_BANG_.call(null,binding));
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","restore-to-default","keymap/restore-to-default",805883024)], 0)),(function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92525(s__92526){
return (new cljs.core.LazySeq(null,(function (){
var s__92526__$1 = s__92526;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92526__$1);
if(temp__5804__auto__){
var s__92526__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92526__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92526__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92528 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92527 = (0);
while(true){
if((i__92527 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__92527);
cljs.core.chunk_append(b__92528,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut.ml-1","span.keyboard-shortcut.ml-1",-656404157),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),it], null)], null));

var G__92775 = (i__92527 + (1));
i__92527 = G__92775;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92528),frontend$components$shortcut$iter__92525(cljs.core.chunk_rest(s__92526__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92528),null);
}
} else {
var it = cljs.core.first(s__92526__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut.ml-1","span.keyboard-shortcut.ml-1",-656404157),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),it], null)], null),frontend$components$shortcut$iter__92525(cljs.core.rest(s__92526__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__((function (){var G__92529 = binding;
if((G__92529 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92479_SHARP_){
var G__92530 = p1__92479_SHARP_;
var G__92530__$1 = (((G__92530 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92530));
if((G__92530__$1 == null)){
return null;
} else {
return frontend.modules.shortcut.utils.decorate_binding(G__92530__$1);
}
}),G__92529);
}
})());
})()], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92513))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-btns","text-right","mt-6","flex","justify-between","items-center"], null)], null),attrs92513], 0))):{'className':"action-btns text-right mt-6 flex justify-between items-center"}),((cljs.core.map_QMARK_(attrs92513))?[(function (){var attrs92514 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"save","save",1850079149)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(dirty_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var binding_SINGLEQUOTE_ = (((current_binding == null))?cljs.core.PersistentVector.EMPTY:current_binding);
var conflicts = frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3(binding_SINGLEQUOTE_,handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exclude-ids","exclude-ids",7408318),cljs.core.PersistentHashSet.createAsIfByAssoc([k])], null));
if(cljs.core.seq(conflicts)){
return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(conflicts) : set_key_conflicts_BANG_.call(null,conflicts));
} else {
var binding_SINGLEQUOTE___$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding,binding_SINGLEQUOTE_))?null:binding_SINGLEQUOTE_);
frontend.modules.shortcut.core.persist_user_shortcut_BANG_(k,binding_SINGLEQUOTE___$1);

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return (saved_cb.cljs$core$IFn$_invoke$arity$0 ? saved_cb.cljs$core$IFn$_invoke$arity$0() : saved_cb.call(null));
}
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92514))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs92514], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs92514))?null:[daiquiri.interpreter.interpret(attrs92514)]));
})()]:[daiquiri.interpreter.interpret(attrs92513),(function (){var attrs92515 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"save","save",1850079149)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(dirty_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var binding_SINGLEQUOTE_ = (((current_binding == null))?cljs.core.PersistentVector.EMPTY:current_binding);
var conflicts = frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3(binding_SINGLEQUOTE_,handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exclude-ids","exclude-ids",7408318),cljs.core.PersistentHashSet.createAsIfByAssoc([k])], null));
if(cljs.core.seq(conflicts)){
return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(conflicts) : set_key_conflicts_BANG_.call(null,conflicts));
} else {
var binding_SINGLEQUOTE___$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding,binding_SINGLEQUOTE_))?null:binding_SINGLEQUOTE_);
frontend.modules.shortcut.core.persist_user_shortcut_BANG_(k,binding_SINGLEQUOTE___$1);

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return (saved_cb.cljs$core$IFn$_invoke$arity$0 ? saved_cb.cljs$core$IFn$_invoke$arity$0() : saved_cb.call(null));
}
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92515))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs92515], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs92515))?null:[daiquiri.interpreter.interpret(attrs92515)]));
})()]));
})()]);
}),null,"frontend.components.shortcut/customize-shortcut-dialog-inner");
frontend.components.shortcut.build_categories_map = (function frontend$components$shortcut$build_categories_map(){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92531_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__92531_SHARP_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.sorted_map(),frontend.modules.shortcut.data_helper.binding_by_category(p1__92531_SHARP_))],null));
}),frontend.components.shortcut.categories);
});
frontend.components.shortcut.shortcut_keymap_x = rum.core.lazy_build(rum.core.build_defc,(function (){
var _ = frontend.rum.use_atom(frontend.modules.shortcut.config._STAR_category);
var ___$1 = frontend.rum.use_atom(frontend.components.shortcut._STAR_refresh_sentry);
var vec__92537 = rum.core.use_state(false);
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92537,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92537,(1),null);
var vec__92540 = rum.core.use_state(cljs.core.PersistentHashSet.EMPTY);
var filters = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92540,(0),null);
var set_filters_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92540,(1),null);
var vec__92543 = rum.core.use_state("");
var keystroke = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92543,(0),null);
var set_keystroke_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92543,(1),null);
var vec__92546 = rum.core.use_state(null);
var q = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92546,(0),null);
var set_q_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92546,(1),null);
var categories_list_map = frontend.components.shortcut.build_categories_map();
var all_categories = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,categories_list_map));
var in_filters_QMARK_ = cljs.core.boolean$(cljs.core.seq(filters));
var in_query_QMARK_ = (!(clojure.string.blank_QMARK_(frontend.util.trim_safe(q))));
var in_keystroke_QMARK_ = (!(clojure.string.blank_QMARK_(keystroke)));
var vec__92549 = rum.core.use_state(cljs.core.PersistentHashSet.EMPTY);
var folded_categories = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92549,(0),null);
var set_folded_categories_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92549,(1),null);
var matched_list_map = ((((in_query_QMARK_) && ((!(in_keystroke_QMARK_)))))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__92552){
var vec__92553 = p__92552;
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92553,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92553,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [c,(function (){var G__92556 = binding_map;
var G__92557 = q;
var G__92558 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__92559 = (function (p1__92532_SHARP_){
var vec__92560 = p1__92532_SHARP_;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92560,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92560,(1),null);
return [cljs.core.name(id)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.modules.shortcut.data_helper.get_shortcut_desc(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"id","id",-1388402092),id)))].join('');
});
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4(G__92556,G__92557,G__92558,G__92559) : frontend.search.fuzzy_search.call(null,G__92556,G__92557,G__92558,G__92559));
})()], null);
}),categories_list_map):null);
var result_list_map = (function (){var or__5002__auto__ = matched_list_map;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return categories_list_map;
}
})();
var toggle_categories_BANG_ = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(folded_categories,all_categories)){
var G__92563 = cljs.core.PersistentHashSet.EMPTY;
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__92563) : set_folded_categories_BANG_.call(null,G__92563));
} else {
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(all_categories) : set_folded_categories_BANG_.call(null,all_categories));
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
}),(100));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"cp__shortcut-page-x"},[daiquiri.core.create_element("header",{'className':"relative"},[daiquiri.core.create_element("h2",{'className':"text-xs opacity-70"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","total","keymap/total",-1306092209)], 0)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(ready_QMARK_)?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92533_SHARP_){
return cljs.core.count(cljs.core.second(p1__92533_SHARP_));
}),result_list_map)):" ..."))].join('')]),frontend.components.shortcut.pane_controls(q,set_q_BANG_,filters,set_filters_BANG_,keystroke,set_keystroke_BANG_,toggle_categories_BANG_)]),(function (){var attrs92564 = (cljs.core.truth_(ready_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.py-8.flex.justify-center","p.py-8.flex.justify-center",-1082958729),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null));
return daiquiri.core.create_element("article",((cljs.core.map_QMARK_(attrs92564))?daiquiri.interpreter.element_attributes(attrs92564):null),((cljs.core.map_QMARK_(attrs92564))?[(cljs.core.truth_(ready_QMARK_)?daiquiri.core.create_element("ul",{'className':"list-none m-0 py-3"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92568(s__92569){
return (new cljs.core.LazySeq(null,(function (){
var s__92569__$1 = s__92569;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92569__$1);
if(temp__5804__auto__){
var s__92569__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92569__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92569__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92571 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92570 = (0);
while(true){
if((i__92570 < size__5479__auto__)){
var vec__92572 = cljs.core._nth(c__5478__auto__,i__92570);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92572,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92572,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
cljs.core.chunk_append(b__92571,(function (){var attrs92567 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92570,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__92575 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__92575) : set_folded_categories_BANG_.call(null,G__92575));
});})(i__92570,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs92567))?daiquiri.interpreter.element_attributes(attrs92567):null),((cljs.core.map_QMARK_(attrs92567))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92568_$_iter__92576(s__92577){
return (new cljs.core.LazySeq(null,((function (i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__92577__$1 = s__92577;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92577__$1);
if(temp__5804__auto____$1){
var s__92577__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92577__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92577__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92579 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92578 = (0);
while(true){
if((i__92578 < size__5479__auto____$1)){
var vec__92580 = cljs.core._nth(c__5478__auto____$1,i__92578);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92580,(0),null);
var map__92583 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92580,(1),null);
var map__92583__$1 = cljs.core.__destructure_map(map__92583);
var m = map__92583__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92583__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92583__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92579,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92584 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92584 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92584);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92578,i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92585 = p1__92534_SHARP_;
var G__92585__$1 = (((G__92585 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92585));
var G__92585__$2 = (((G__92585__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92585__$1));
if((G__92585__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92585__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92578,i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92586 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92586))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92586], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92586))?null:[daiquiri.interpreter.interpret(attrs92586)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92587 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92587))?daiquiri.interpreter.element_attributes(attrs92587):null),((cljs.core.map_QMARK_(attrs92587))?null:[daiquiri.interpreter.interpret(attrs92587)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92588 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92578,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92580,id,map__92583,map__92583__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92579,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92588))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92588], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92588))?null:[daiquiri.interpreter.interpret(attrs92588)]));
})():null))])]):null):null));

var G__92776 = (i__92578 + (1));
i__92578 = G__92776;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92579),frontend$components$shortcut$iter__92568_$_iter__92576(cljs.core.chunk_rest(s__92577__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92579),null);
}
} else {
var vec__92589 = cljs.core.first(s__92577__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92589,(0),null);
var map__92592 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92589,(1),null);
var map__92592__$1 = cljs.core.__destructure_map(map__92592);
var m = map__92592__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92592__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92592__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92593 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92593 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92593);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92594 = p1__92534_SHARP_;
var G__92594__$1 = (((G__92594 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92594));
var G__92594__$2 = (((G__92594__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92594__$1));
if((G__92594__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92594__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92586 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92586))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92586], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92586))?null:[daiquiri.interpreter.interpret(attrs92586)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92587 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92587))?daiquiri.interpreter.element_attributes(attrs92587):null),((cljs.core.map_QMARK_(attrs92587))?null:[daiquiri.interpreter.interpret(attrs92587)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92588 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92589,id,map__92592,map__92592__$1,m,binding,user_binding,s__92577__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92588))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92588], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92588))?null:[daiquiri.interpreter.interpret(attrs92588)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92568_$_iter__92576(cljs.core.rest(s__92577__$2)));
}
} else {
return null;
}
break;
}
});})(i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs92567),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92568_$_iter__92595(s__92596){
return (new cljs.core.LazySeq(null,((function (i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__92596__$1 = s__92596;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92596__$1);
if(temp__5804__auto____$1){
var s__92596__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92596__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92596__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92598 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92597 = (0);
while(true){
if((i__92597 < size__5479__auto____$1)){
var vec__92599 = cljs.core._nth(c__5478__auto____$1,i__92597);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92599,(0),null);
var map__92602 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92599,(1),null);
var map__92602__$1 = cljs.core.__destructure_map(map__92602);
var m = map__92602__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92602__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92602__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92598,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92603 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92603 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92603);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92597,i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92604 = p1__92534_SHARP_;
var G__92604__$1 = (((G__92604 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92604));
var G__92604__$2 = (((G__92604__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92604__$1));
if((G__92604__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92604__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92597,i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92605 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92605))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92605], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92605))?null:[daiquiri.interpreter.interpret(attrs92605)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92606 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92606))?daiquiri.interpreter.element_attributes(attrs92606):null),((cljs.core.map_QMARK_(attrs92606))?null:[daiquiri.interpreter.interpret(attrs92606)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92607 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92597,i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92599,id,map__92602,map__92602__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92598,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92607))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92607], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92607))?null:[daiquiri.interpreter.interpret(attrs92607)]));
})():null))])]):null):null));

var G__92777 = (i__92597 + (1));
i__92597 = G__92777;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92598),frontend$components$shortcut$iter__92568_$_iter__92595(cljs.core.chunk_rest(s__92596__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92598),null);
}
} else {
var vec__92608 = cljs.core.first(s__92596__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92608,(0),null);
var map__92611 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92608,(1),null);
var map__92611__$1 = cljs.core.__destructure_map(map__92611);
var m = map__92611__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92611__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92611__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92612 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92612 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92612);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92613 = p1__92534_SHARP_;
var G__92613__$1 = (((G__92613 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92613));
var G__92613__$2 = (((G__92613__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92613__$1));
if((G__92613__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92613__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92570,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92605 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92605))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92605], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92605))?null:[daiquiri.interpreter.interpret(attrs92605)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92606 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92606))?daiquiri.interpreter.element_attributes(attrs92606):null),((cljs.core.map_QMARK_(attrs92606))?null:[daiquiri.interpreter.interpret(attrs92606)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92607 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92570,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92608,id,map__92611,map__92611__$1,m,binding,user_binding,s__92596__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92607))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92607], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92607))?null:[daiquiri.interpreter.interpret(attrs92607)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92568_$_iter__92595(cljs.core.rest(s__92596__$2)));
}
} else {
return null;
}
break;
}
});})(i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__92570,attrs92567,folded_QMARK_,vec__92572,c,binding_map,c__5478__auto__,size__5479__auto__,b__92571,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})());

var G__92778 = (i__92570 + (1));
i__92570 = G__92778;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92571),frontend$components$shortcut$iter__92568(cljs.core.chunk_rest(s__92569__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92571),null);
}
} else {
var vec__92614 = cljs.core.first(s__92569__$2);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92614,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92614,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
return cljs.core.cons((function (){var attrs92567 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__92617 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__92617) : set_folded_categories_BANG_.call(null,G__92617));
});})(folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs92567))?daiquiri.interpreter.element_attributes(attrs92567):null),((cljs.core.map_QMARK_(attrs92567))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92568_$_iter__92618(s__92619){
return (new cljs.core.LazySeq(null,(function (){
var s__92619__$1 = s__92619;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92619__$1);
if(temp__5804__auto____$1){
var s__92619__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92619__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92619__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92621 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92620 = (0);
while(true){
if((i__92620 < size__5479__auto__)){
var vec__92622 = cljs.core._nth(c__5478__auto__,i__92620);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92622,(0),null);
var map__92625 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92622,(1),null);
var map__92625__$1 = cljs.core.__destructure_map(map__92625);
var m = map__92625__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92625__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92625__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92621,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92626 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92626 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92626);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92620,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92627 = p1__92534_SHARP_;
var G__92627__$1 = (((G__92627 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92627));
var G__92627__$2 = (((G__92627__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92627__$1));
if((G__92627__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92627__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92620,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92586 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92586))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92586], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92586))?null:[daiquiri.interpreter.interpret(attrs92586)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92587 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92587))?daiquiri.interpreter.element_attributes(attrs92587):null),((cljs.core.map_QMARK_(attrs92587))?null:[daiquiri.interpreter.interpret(attrs92587)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92588 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92620,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92622,id,map__92625,map__92625__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92621,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92588))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92588], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92588))?null:[daiquiri.interpreter.interpret(attrs92588)]));
})():null))])]):null):null));

var G__92779 = (i__92620 + (1));
i__92620 = G__92779;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92621),frontend$components$shortcut$iter__92568_$_iter__92618(cljs.core.chunk_rest(s__92619__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92621),null);
}
} else {
var vec__92628 = cljs.core.first(s__92619__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92628,(0),null);
var map__92631 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92628,(1),null);
var map__92631__$1 = cljs.core.__destructure_map(map__92631);
var m = map__92631__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92631__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92631__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92632 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92632 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92632);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92633 = p1__92534_SHARP_;
var G__92633__$1 = (((G__92633 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92633));
var G__92633__$2 = (((G__92633__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92633__$1));
if((G__92633__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92633__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92586 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92586))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92586], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92586))?null:[daiquiri.interpreter.interpret(attrs92586)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92587 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92587))?daiquiri.interpreter.element_attributes(attrs92587):null),((cljs.core.map_QMARK_(attrs92587))?null:[daiquiri.interpreter.interpret(attrs92587)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92588 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92628,id,map__92631,map__92631__$1,m,binding,user_binding,s__92619__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92588))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92588], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92588))?null:[daiquiri.interpreter.interpret(attrs92588)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92568_$_iter__92618(cljs.core.rest(s__92619__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs92567),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92568_$_iter__92634(s__92635){
return (new cljs.core.LazySeq(null,(function (){
var s__92635__$1 = s__92635;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92635__$1);
if(temp__5804__auto____$1){
var s__92635__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92635__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92635__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92637 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92636 = (0);
while(true){
if((i__92636 < size__5479__auto__)){
var vec__92638 = cljs.core._nth(c__5478__auto__,i__92636);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92638,(0),null);
var map__92641 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92638,(1),null);
var map__92641__$1 = cljs.core.__destructure_map(map__92641);
var m = map__92641__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92641__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92641__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92637,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92642 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92642 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92642);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92636,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92643 = p1__92534_SHARP_;
var G__92643__$1 = (((G__92643 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92643));
var G__92643__$2 = (((G__92643__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92643__$1));
if((G__92643__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92643__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92636,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92605 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92605))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92605], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92605))?null:[daiquiri.interpreter.interpret(attrs92605)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92606 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92606))?daiquiri.interpreter.element_attributes(attrs92606):null),((cljs.core.map_QMARK_(attrs92606))?null:[daiquiri.interpreter.interpret(attrs92606)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92607 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92636,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92638,id,map__92641,map__92641__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92637,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92607))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92607], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92607))?null:[daiquiri.interpreter.interpret(attrs92607)]));
})():null))])]):null):null));

var G__92780 = (i__92636 + (1));
i__92636 = G__92780;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92637),frontend$components$shortcut$iter__92568_$_iter__92634(cljs.core.chunk_rest(s__92635__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92637),null);
}
} else {
var vec__92644 = cljs.core.first(s__92635__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92644,(0),null);
var map__92647 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92644,(1),null);
var map__92647__$1 = cljs.core.__destructure_map(map__92647);
var m = map__92647__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92647__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92647__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92648 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92648 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92648);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92649 = p1__92534_SHARP_;
var G__92649__$1 = (((G__92649 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92649));
var G__92649__$2 = (((G__92649__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92649__$1));
if((G__92649__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92649__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92605 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92605))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92605], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92605))?null:[daiquiri.interpreter.interpret(attrs92605)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92606 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92606))?daiquiri.interpreter.element_attributes(attrs92606):null),((cljs.core.map_QMARK_(attrs92606))?null:[daiquiri.interpreter.interpret(attrs92606)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92607 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92644,id,map__92647,map__92647__$1,m,binding,user_binding,s__92635__$2,temp__5804__auto____$1,attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92607))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92607], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92607))?null:[daiquiri.interpreter.interpret(attrs92607)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92568_$_iter__92634(cljs.core.rest(s__92635__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs92567,folded_QMARK_,vec__92614,c,binding_map,s__92569__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})(),frontend$components$shortcut$iter__92568(cljs.core.rest(s__92569__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result_list_map);
})())]):null)]:[daiquiri.interpreter.interpret(attrs92564),(cljs.core.truth_(ready_QMARK_)?daiquiri.core.create_element("ul",{'className':"list-none m-0 py-3"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__92653(s__92654){
return (new cljs.core.LazySeq(null,(function (){
var s__92654__$1 = s__92654;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92654__$1);
if(temp__5804__auto__){
var s__92654__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92654__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92654__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92656 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92655 = (0);
while(true){
if((i__92655 < size__5479__auto__)){
var vec__92657 = cljs.core._nth(c__5478__auto__,i__92655);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92657,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92657,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
cljs.core.chunk_append(b__92656,(function (){var attrs92652 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92655,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__92660 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__92660) : set_folded_categories_BANG_.call(null,G__92660));
});})(i__92655,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs92652))?daiquiri.interpreter.element_attributes(attrs92652):null),((cljs.core.map_QMARK_(attrs92652))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92653_$_iter__92661(s__92662){
return (new cljs.core.LazySeq(null,((function (i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__92662__$1 = s__92662;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92662__$1);
if(temp__5804__auto____$1){
var s__92662__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92662__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92662__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92664 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92663 = (0);
while(true){
if((i__92663 < size__5479__auto____$1)){
var vec__92665 = cljs.core._nth(c__5478__auto____$1,i__92663);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92665,(0),null);
var map__92668 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92665,(1),null);
var map__92668__$1 = cljs.core.__destructure_map(map__92668);
var m = map__92668__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92668__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92668__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92664,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92669 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92669 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92669);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92663,i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92670 = p1__92534_SHARP_;
var G__92670__$1 = (((G__92670 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92670));
var G__92670__$2 = (((G__92670__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92670__$1));
if((G__92670__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92670__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92663,i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92671 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92671))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92671], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92671))?null:[daiquiri.interpreter.interpret(attrs92671)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92672 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92672))?daiquiri.interpreter.element_attributes(attrs92672):null),((cljs.core.map_QMARK_(attrs92672))?null:[daiquiri.interpreter.interpret(attrs92672)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92673 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92663,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92665,id,map__92668,map__92668__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92664,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92673))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92673], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92673))?null:[daiquiri.interpreter.interpret(attrs92673)]));
})():null))])]):null):null));

var G__92781 = (i__92663 + (1));
i__92663 = G__92781;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92664),frontend$components$shortcut$iter__92653_$_iter__92661(cljs.core.chunk_rest(s__92662__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92664),null);
}
} else {
var vec__92674 = cljs.core.first(s__92662__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92674,(0),null);
var map__92677 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92674,(1),null);
var map__92677__$1 = cljs.core.__destructure_map(map__92677);
var m = map__92677__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92677__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92677__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92678 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92678 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92678);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92679 = p1__92534_SHARP_;
var G__92679__$1 = (((G__92679 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92679));
var G__92679__$2 = (((G__92679__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92679__$1));
if((G__92679__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92679__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92671 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92671))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92671], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92671))?null:[daiquiri.interpreter.interpret(attrs92671)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92672 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92672))?daiquiri.interpreter.element_attributes(attrs92672):null),((cljs.core.map_QMARK_(attrs92672))?null:[daiquiri.interpreter.interpret(attrs92672)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92673 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92674,id,map__92677,map__92677__$1,m,binding,user_binding,s__92662__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92673))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92673], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92673))?null:[daiquiri.interpreter.interpret(attrs92673)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92653_$_iter__92661(cljs.core.rest(s__92662__$2)));
}
} else {
return null;
}
break;
}
});})(i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs92652),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92653_$_iter__92680(s__92681){
return (new cljs.core.LazySeq(null,((function (i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__92681__$1 = s__92681;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92681__$1);
if(temp__5804__auto____$1){
var s__92681__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92681__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__92681__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__92683 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__92682 = (0);
while(true){
if((i__92682 < size__5479__auto____$1)){
var vec__92684 = cljs.core._nth(c__5478__auto____$1,i__92682);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92684,(0),null);
var map__92687 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92684,(1),null);
var map__92687__$1 = cljs.core.__destructure_map(map__92687);
var m = map__92687__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92687__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92687__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92683,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92688 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92688 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92688);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92682,i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92689 = p1__92534_SHARP_;
var G__92689__$1 = (((G__92689 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92689));
var G__92689__$2 = (((G__92689__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92689__$1));
if((G__92689__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92689__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92682,i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92690 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92690))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92690], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92690))?null:[daiquiri.interpreter.interpret(attrs92690)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92691 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92691))?daiquiri.interpreter.element_attributes(attrs92691):null),((cljs.core.map_QMARK_(attrs92691))?null:[daiquiri.interpreter.interpret(attrs92691)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92692 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92682,i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92684,id,map__92687,map__92687__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__92683,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92692))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92692], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92692))?null:[daiquiri.interpreter.interpret(attrs92692)]));
})():null))])]):null):null));

var G__92782 = (i__92682 + (1));
i__92682 = G__92782;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92683),frontend$components$shortcut$iter__92653_$_iter__92680(cljs.core.chunk_rest(s__92681__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92683),null);
}
} else {
var vec__92693 = cljs.core.first(s__92681__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92693,(0),null);
var map__92696 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92693,(1),null);
var map__92696__$1 = cljs.core.__destructure_map(map__92696);
var m = map__92696__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92696__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92696__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92697 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92697 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92697);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92698 = p1__92534_SHARP_;
var G__92698__$1 = (((G__92698 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92698));
var G__92698__$2 = (((G__92698__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92698__$1));
if((G__92698__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92698__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92655,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92690 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92690))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92690], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92690))?null:[daiquiri.interpreter.interpret(attrs92690)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92691 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92691))?daiquiri.interpreter.element_attributes(attrs92691):null),((cljs.core.map_QMARK_(attrs92691))?null:[daiquiri.interpreter.interpret(attrs92691)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92692 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92655,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92693,id,map__92696,map__92696__$1,m,binding,user_binding,s__92681__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92692))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92692], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92692))?null:[daiquiri.interpreter.interpret(attrs92692)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92653_$_iter__92680(cljs.core.rest(s__92681__$2)));
}
} else {
return null;
}
break;
}
});})(i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__92655,attrs92652,folded_QMARK_,vec__92657,c,binding_map,c__5478__auto__,size__5479__auto__,b__92656,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})());

var G__92783 = (i__92655 + (1));
i__92655 = G__92783;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92656),frontend$components$shortcut$iter__92653(cljs.core.chunk_rest(s__92654__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92656),null);
}
} else {
var vec__92699 = cljs.core.first(s__92654__$2);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92699,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92699,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
return cljs.core.cons((function (){var attrs92652 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__92702 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__92702) : set_folded_categories_BANG_.call(null,G__92702));
});})(folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs92652))?daiquiri.interpreter.element_attributes(attrs92652):null),((cljs.core.map_QMARK_(attrs92652))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92653_$_iter__92703(s__92704){
return (new cljs.core.LazySeq(null,(function (){
var s__92704__$1 = s__92704;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92704__$1);
if(temp__5804__auto____$1){
var s__92704__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92704__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92704__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92706 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92705 = (0);
while(true){
if((i__92705 < size__5479__auto__)){
var vec__92707 = cljs.core._nth(c__5478__auto__,i__92705);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92707,(0),null);
var map__92710 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92707,(1),null);
var map__92710__$1 = cljs.core.__destructure_map(map__92710);
var m = map__92710__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92710__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92710__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92706,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92711 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92711 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92711);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92705,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92712 = p1__92534_SHARP_;
var G__92712__$1 = (((G__92712 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92712));
var G__92712__$2 = (((G__92712__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92712__$1));
if((G__92712__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92712__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92705,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92671 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92671))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92671], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92671))?null:[daiquiri.interpreter.interpret(attrs92671)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92672 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92672))?daiquiri.interpreter.element_attributes(attrs92672):null),((cljs.core.map_QMARK_(attrs92672))?null:[daiquiri.interpreter.interpret(attrs92672)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92673 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92705,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92707,id,map__92710,map__92710__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92706,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92673))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92673], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92673))?null:[daiquiri.interpreter.interpret(attrs92673)]));
})():null))])]):null):null));

var G__92784 = (i__92705 + (1));
i__92705 = G__92784;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92706),frontend$components$shortcut$iter__92653_$_iter__92703(cljs.core.chunk_rest(s__92704__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92706),null);
}
} else {
var vec__92713 = cljs.core.first(s__92704__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92713,(0),null);
var map__92716 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92713,(1),null);
var map__92716__$1 = cljs.core.__destructure_map(map__92716);
var m = map__92716__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92716__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92716__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92717 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92717 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92717);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92718 = p1__92534_SHARP_;
var G__92718__$1 = (((G__92718 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92718));
var G__92718__$2 = (((G__92718__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92718__$1));
if((G__92718__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92718__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92671 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92671))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92671], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92671))?null:[daiquiri.interpreter.interpret(attrs92671)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92672 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92672))?daiquiri.interpreter.element_attributes(attrs92672):null),((cljs.core.map_QMARK_(attrs92672))?null:[daiquiri.interpreter.interpret(attrs92672)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92673 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92713,id,map__92716,map__92716__$1,m,binding,user_binding,s__92704__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92673))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92673], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92673))?null:[daiquiri.interpreter.interpret(attrs92673)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92653_$_iter__92703(cljs.core.rest(s__92704__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs92652),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__92653_$_iter__92719(s__92720){
return (new cljs.core.LazySeq(null,(function (){
var s__92720__$1 = s__92720;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__92720__$1);
if(temp__5804__auto____$1){
var s__92720__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__92720__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92720__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92722 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92721 = (0);
while(true){
if((i__92721 < size__5479__auto__)){
var vec__92723 = cljs.core._nth(c__5478__auto__,i__92721);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92723,(0),null);
var map__92726 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92723,(1),null);
var map__92726__$1 = cljs.core.__destructure_map(map__92726);
var m = map__92726__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92726__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92726__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
cljs.core.chunk_append(b__92722,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92727 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92727 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92727);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__92721,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92728 = p1__92534_SHARP_;
var G__92728__$1 = (((G__92728 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92728));
var G__92728__$2 = (((G__92728__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92728__$1));
if((G__92728__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92728__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(i__92721,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92690 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92690))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92690], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92690))?null:[daiquiri.interpreter.interpret(attrs92690)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92691 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92691))?daiquiri.interpreter.element_attributes(attrs92691):null),((cljs.core.map_QMARK_(attrs92691))?null:[daiquiri.interpreter.interpret(attrs92691)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92692 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(i__92721,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92723,id,map__92726,map__92726__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__92722,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92692))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92692], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92692))?null:[daiquiri.interpreter.interpret(attrs92692)]));
})():null))])]):null):null));

var G__92785 = (i__92721 + (1));
i__92721 = G__92785;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92722),frontend$components$shortcut$iter__92653_$_iter__92719(cljs.core.chunk_rest(s__92720__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92722),null);
}
} else {
var vec__92729 = cljs.core.first(s__92720__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92729,(0),null);
var map__92732 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92729,(1),null);
var map__92732__$1 = cljs.core.__destructure_map(map__92732);
var m = map__92732__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92732__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92732__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
var binding__$1 = frontend.components.shortcut.to_vector(binding);
var user_binding__$1 = (function (){var and__5000__auto__ = user_binding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.shortcut.to_vector(user_binding);
} else {
return and__5000__auto__;
}
})();
var label = frontend.components.shortcut.shortcut_desc_label(id,m);
var custom_QMARK_ = (!((user_binding__$1 == null)));
var disabled_QMARK_ = ((user_binding__$1 === false) || (cljs.core.first(binding__$1) === false));
var unset_QMARK_ = (((!(disabled_QMARK_))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(user_binding__$1,cljs.core.PersistentVector.EMPTY)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(binding__$1,cljs.core.PersistentVector.EMPTY)) && ((user_binding__$1 == null)))))));
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Custom","Custom",-1084118283)))?custom_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Disabled","Disabled",-1564259627)))?disabled_QMARK_:null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.contains_QMARK_(filters,new cljs.core.Keyword(null,"Unset","Unset",91993016))){
return unset_QMARK_;
} else {
return null;
}
}
}
}
})())?(cljs.core.truth_((function (){var or__5002__auto__ = (!(in_keystroke_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (!(disabled_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(unset_QMARK_));
if(and__5000__auto____$1){
var binding_SINGLEQUOTE_ = (function (){var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return binding__$1;
}
})();
var keystroke_SINGLEQUOTE_ = (function (){var G__92733 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__92733 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92733);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92534_SHARP_){
var temp__5804__auto____$2 = (function (){var G__92734 = p1__92534_SHARP_;
var G__92734__$1 = (((G__92734 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__92734));
var G__92734__$2 = (((G__92734__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__92734__$1));
if((G__92734__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__92734__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var s = temp__5804__auto____$2;
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,keystroke_SINGLEQUOTE_);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$2 = cljs.core.sequential_QMARK_(s);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.sequential_QMARK_(keystroke_SINGLEQUOTE_);
if(and__5000__auto____$3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,keystroke_SINGLEQUOTE_], null)));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
} else {
return null;
}
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding_SINGLEQUOTE_);
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs92690 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92690))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs92690], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs92690))?null:[daiquiri.interpreter.interpret(attrs92690)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
:null),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null))},[(cljs.core.truth_((function (){var or__5002__auto__ = unset_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = user_binding__$1;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return user_binding__$1 === false;
}
}
})())?(function (){var attrs92691 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92535_SHARP_){
if(p1__92535_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__92535_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92691))?daiquiri.interpreter.element_attributes(attrs92691):null),((cljs.core.map_QMARK_(attrs92691))?null:[daiquiri.interpreter.interpret(attrs92691)]));
})():(((!(unset_QMARK_)))?(function (){var attrs92692 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__92536_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__92536_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__92729,id,map__92732,map__92732__$1,m,binding,user_binding,s__92720__$2,temp__5804__auto____$1,attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs92692))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs92692], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs92692))?null:[daiquiri.interpreter.interpret(attrs92692)]));
})():null))])]):null):null),frontend$components$shortcut$iter__92653_$_iter__92719(cljs.core.rest(s__92720__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs92652,folded_QMARK_,vec__92699,c,binding_map,s__92654__$2,temp__5804__auto__,attrs92564,_,___$1,vec__92537,ready_QMARK_,set_ready_BANG_,vec__92540,filters,set_filters_BANG_,vec__92543,keystroke,set_keystroke_BANG_,vec__92546,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__92549,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})(),frontend$components$shortcut$iter__92653(cljs.core.rest(s__92654__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result_list_map);
})())]):null)]));
})()]);
}),null,"frontend.components.shortcut/shortcut-keymap-x");

//# sourceMappingURL=frontend.components.shortcut.js.map
