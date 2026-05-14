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
var k__99485__auto___127482 = "[shortcuts] unlisten*";
console.time(k__99485__auto___127482);

var res__99486__auto___127483 = frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(true);
console.timeEnd(k__99485__auto___127482);

} else {
frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}

goog.events.listen(key_handler,"key",(function (e){
e.preventDefault();

var G__126663 = (function (p1__126655_SHARP_){
return frontend.util.trim_safe([cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__126655_SHARP_),frontend.modules.shortcut.core.keyname(e)].join(''));
});
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1(G__126663) : set_keystroke_BANG_.call(null,G__126663));
}));

return (function (){
if(cljs.core.truth_(goog.DEBUG)){
var k__99485__auto___127485 = "[shortcuts] listen*";
console.time(k__99485__auto___127485);

var res__99486__auto___127486 = frontend.modules.shortcut.core.listen_all_BANG_();
console.timeEnd(k__99485__auto___127485);

} else {
frontend.modules.shortcut.core.listen_all_BANG_();
}

return key_handler.dispose();
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"keyboard-filter-record"},[daiquiri.core.create_element("h2",null,[(function (){var attrs126682 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-filter","keymap/keystroke-filter",-601559587)], 0));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs126682))?daiquiri.interpreter.element_attributes(attrs126682):null),((cljs.core.map_QMARK_(attrs126682))?null:[daiquiri.interpreter.interpret(attrs126682)]));
})(),(function (){var attrs126701 = ((keypressed_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
})], null),frontend.ui.icon("zoom-reset",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null))], null):null);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126701))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","space-x-2"], null)], null),attrs126701], 0))):{'className':"flex space-x-2"}),((cljs.core.map_QMARK_(attrs126701))?[daiquiri.core.create_element("a",{'onClick':(function (){
(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]:[daiquiri.interpreter.interpret(attrs126701),daiquiri.core.create_element("a",{'onClick':(function (){
(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]));
})()]),(function (){var attrs126681 = (((!(keypressed_QMARK_)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-record-desc","keymap/keystroke-record-desc",1257024427)], 0))], null):((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.render_keyboard_shortcut(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [keystroke], null))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126681))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["wrap","p-2"], null)], null),attrs126681], 0))):{'className':"wrap p-2"}),((cljs.core.map_QMARK_(attrs126681))?null:[daiquiri.interpreter.interpret(attrs126681)]));
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
})(),'autoFocus':true,'onKeyDown':(function (p1__126721_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((27),p1__126721_SHARP_.keyCode)){
frontend.util.stop(p1__126721_SHARP_);

if(clojure.string.blank_QMARK_(q)){
var G__126766 = rum.core.deref(_STAR_search_ref);
if((G__126766 == null)){
return null;
} else {
return G__126766.blur();
}
} else {
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_q_BANG_.call(null,""));
}
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (p1__126722_SHARP_){
var v = frontend.util.evalue(p1__126722_SHARP_);
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1(v) : set_q_BANG_.call(null,v));
})),'className':"form-input is-small"},[]),((clojure.string.blank_QMARK_(q))?null:daiquiri.core.create_element("a",{'onClick':(function (){
(set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_q_BANG_.call(null,""));

return setTimeout((function (){
var G__126777 = rum.core.deref(_STAR_search_ref);
if((G__126777 == null)){
return null;
} else {
return G__126777.focus();
}
}),(50));
}),'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]),frontend.ui.dropdown((function (p__126792){
var map__126805 = p__126792;
var map__126805__$1 = cljs.core.__destructure_map(map__126805);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126805__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.icon-link","a.flex.items-center.icon-link",2144652115),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn], null),frontend.ui.icon("keyboard"),((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.point("bg-red-600.absolute",(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"right","right",-452581833),(-2),new cljs.core.Keyword(null,"top","top",-1856271961),(-2)], null)], null)))], null);
}),(function (p__126810){
var map__126813 = p__126810;
var map__126813__$1 = cljs.core.__destructure_map(map__126813);
var close_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126813__$1,new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512));
return frontend.components.shortcut.keyboard_filter_record_inner(keystroke,set_keystroke_BANG_,close_fn);
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outside?","outside?",-1930213908),true,new cljs.core.Keyword(null,"trigger-class","trigger-class",1251717016),"keyboard-filter"], null)),frontend.ui.dropdown_with_links((function (p__126873){
var map__126874 = p__126873;
var map__126874__$1 = cljs.core.__destructure_map(map__126874);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126874__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.icon-link.relative","a.flex.items-center.icon-link.relative",1980117728),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn], null),frontend.ui.icon("filter"),((cljs.core.seq(filters))?frontend.ui.point("bg-red-600.absolute",(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"right","right",-452581833),(-2),new cljs.core.Keyword(null,"top","top",-1856271961),(-2)], null)], null)):null)], null);
}),(function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__126876(s__126877){
return (new cljs.core.LazySeq(null,(function (){
var s__126877__$1 = s__126877;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__126877__$1);
if(temp__5804__auto__){
var s__126877__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__126877__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__126877__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__126879 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__126878 = (0);
while(true){
if((i__126878 < size__5479__auto__)){
var k = cljs.core._nth(c__5478__auto__,i__126878);
var all_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"All","All",-2078402587));
var checked_QMARK_ = ((cljs.core.contains_QMARK_(filters,k)) || (((all_QMARK_) && ((cljs.core.seq(filters) == null)))));
cljs.core.chunk_append(b__126879,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),((all_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","all","keymap/all",160385963)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"keymap","keymap",-499605268),clojure.string.lower_case(cljs.core.name(k)))], 0))),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(((checked_QMARK_)?"checkbox":"square")),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__126878,all_QMARK_,checked_QMARK_,k,c__5478__auto__,size__5479__auto__,b__126879,s__126877__$2,temp__5804__auto__,_STAR_search_ref){
return (function (){
var G__126888 = ((all_QMARK_)?cljs.core.PersistentHashSet.EMPTY:(function (){var f = ((checked_QMARK_)?cljs.core.disj:cljs.core.conj);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(filters,k) : f.call(null,filters,k));
})());
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__126888) : set_filters_BANG_.call(null,G__126888));
});})(i__126878,all_QMARK_,checked_QMARK_,k,c__5478__auto__,size__5479__auto__,b__126879,s__126877__$2,temp__5804__auto__,_STAR_search_ref))
], null)], null));

var G__127502 = (i__126878 + (1));
i__126878 = G__127502;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__126879),frontend$components$shortcut$iter__126876(cljs.core.chunk_rest(s__126877__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__126879),null);
}
} else {
var k = cljs.core.first(s__126877__$2);
var all_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"All","All",-2078402587));
var checked_QMARK_ = ((cljs.core.contains_QMARK_(filters,k)) || (((all_QMARK_) && ((cljs.core.seq(filters) == null)))));
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),((all_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","all","keymap/all",160385963)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"keymap","keymap",-499605268),clojure.string.lower_case(cljs.core.name(k)))], 0))),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(((checked_QMARK_)?"checkbox":"square")),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (all_QMARK_,checked_QMARK_,k,s__126877__$2,temp__5804__auto__,_STAR_search_ref){
return (function (){
var G__126893 = ((all_QMARK_)?cljs.core.PersistentHashSet.EMPTY:(function (){var f = ((checked_QMARK_)?cljs.core.disj:cljs.core.conj);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(filters,k) : f.call(null,filters,k));
})());
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__126893) : set_filters_BANG_.call(null,G__126893));
});})(all_QMARK_,checked_QMARK_,k,s__126877__$2,temp__5804__auto__,_STAR_search_ref))
], null)], null),frontend$components$shortcut$iter__126876(cljs.core.rest(s__126877__$2)));
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
var id_SINGLEQUOTE___$1 = ((plugin_QMARK_)?(function (){var G__126898 = id_SINGLEQUOTE_;
if((G__126898 == null)){
return null;
} else {
return clojure.string.replace(G__126898,"plugin.","");
}
})():id_SINGLEQUOTE_);
var plugin_id = ((plugin_QMARK_)?cljs.core.namespace(id):null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE___$1),"#",(function (){var G__126903 = new cljs.core.Keyword(null,"handler-id","handler-id",1160395333).cljs$core$IFn$_invoke$arity$1(binding_map);
if((G__126903 == null)){
return null;
} else {
return cljs.core.name(G__126903);
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
var map__126910 = temp__5804__auto__;
var map__126910__$1 = cljs.core.__destructure_map(map__126910);
var m = map__126910__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126910__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126910__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var G__126921 = (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.components.shortcut.customize_shortcut_dialog_inner,args);
});
var G__126922 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),modal_id,new cljs.core.Keyword(null,"class","class",-2030961996),"w-auto md:max-w-2xl",new cljs.core.Keyword(null,"payload","payload",-383036092),args], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__126921,G__126922) : logseq.shui.ui.dialog_open_BANG_.call(null,G__126921,G__126922));
} else {
return null;
}
});
frontend.components.shortcut.shortcut_conflicts_display = rum.core.lazy_build(rum.core.build_defc,(function (_k,conflicts_map){
return daiquiri.core.create_element("div",{'className':"cp__shortcut-conflicts-list-wrap"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__126932(s__126933){
return (new cljs.core.LazySeq(null,(function (){
var s__126933__$1 = s__126933;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__126933__$1);
if(temp__5804__auto__){
var s__126933__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__126933__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__126933__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__126935 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__126934 = (0);
while(true){
if((i__126934 < size__5479__auto__)){
var vec__126946 = cljs.core._nth(c__5478__auto__,i__126934);
var g = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126946,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126946,(1),null);
cljs.core.chunk_append(b__126935,daiquiri.core.create_element("section",{'className':"relative"},[(function (){var attrs126953 = frontend.ui.icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs126953))?daiquiri.interpreter.element_attributes(attrs126953):null),((cljs.core.map_QMARK_(attrs126953))?[(function (){var attrs126955 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126955))?daiquiri.interpreter.element_attributes(attrs126955):null),((cljs.core.map_QMARK_(attrs126955))?null:[daiquiri.interpreter.interpret(attrs126955)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]:[daiquiri.interpreter.interpret(attrs126953),(function (){var attrs126959 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126959))?daiquiri.interpreter.element_attributes(attrs126959):null),((cljs.core.map_QMARK_(attrs126959))?null:[daiquiri.interpreter.interpret(attrs126959)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]));
})(),daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__126934,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__126980(s__126981){
return (new cljs.core.LazySeq(null,((function (i__126934,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
var s__126981__$1 = s__126981;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__126981__$1);
if(temp__5804__auto____$1){
var s__126981__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__126981__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__126981__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__126983 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__126982 = (0);
while(true){
if((i__126982 < size__5479__auto____$1)){
var v = cljs.core._nth(c__5478__auto____$1,i__126982);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
cljs.core.chunk_append(b__126983,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__126982,i__126934,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__126984(s__126985){
return (new cljs.core.LazySeq(null,((function (i__126982,i__126934,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
var s__126985__$1 = s__126985;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__126985__$1);
if(temp__5804__auto____$2){
var s__126985__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__126985__$2)){
var c__5478__auto____$2 = cljs.core.chunk_first(s__126985__$2);
var size__5479__auto____$2 = cljs.core.count(c__5478__auto____$2);
var b__126987 = cljs.core.chunk_buffer(size__5479__auto____$2);
if((function (){var i__126986 = (0);
while(true){
if((i__126986 < size__5479__auto____$2)){
var vec__126988 = cljs.core._nth(c__5478__auto____$2,i__126986);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126988,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126988,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__126987,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__126986,s__126985__$1,i__126982,i__126934,m,vec__126988,id_SINGLEQUOTE_,handler_id,c__5478__auto____$2,size__5479__auto____$2,b__126987,s__126985__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__126986,s__126985__$1,i__126982,i__126934,m,vec__126988,id_SINGLEQUOTE_,handler_id,c__5478__auto____$2,size__5479__auto____$2,b__126987,s__126985__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__127507 = (i__126986 + (1));
i__126986 = G__127507;
continue;
} else {
var G__127508 = (i__126986 + (1));
i__126986 = G__127508;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__126987),frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__126984(cljs.core.chunk_rest(s__126985__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__126987),null);
}
} else {
var vec__127004 = cljs.core.first(s__126985__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127004,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127004,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__126985__$1,i__126982,i__126934,m,vec__127004,id_SINGLEQUOTE_,handler_id,s__126985__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__126985__$1,i__126982,i__126934,m,vec__127004,id_SINGLEQUOTE_,handler_id,s__126985__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__126984(cljs.core.rest(s__126985__$2)));
} else {
var G__127510 = cljs.core.rest(s__126985__$2);
s__126985__$1 = G__127510;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__126982,i__126934,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,null,null));
});})(i__126982,i__126934,k,vs,v,c__5478__auto____$1,size__5479__auto____$1,b__126983,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()));

var G__127511 = (i__126982 + (1));
i__126982 = G__127511;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__126983),frontend$components$shortcut$iter__126932_$_iter__126980(cljs.core.chunk_rest(s__126981__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__126983),null);
}
} else {
var v = cljs.core.first(s__126981__$2);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
return cljs.core.cons(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__126934,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__127013(s__127014){
return (new cljs.core.LazySeq(null,((function (i__126934,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
var s__127014__$1 = s__127014;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__127014__$1);
if(temp__5804__auto____$2){
var s__127014__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__127014__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127014__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127016 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127015 = (0);
while(true){
if((i__127015 < size__5479__auto____$1)){
var vec__127020 = cljs.core._nth(c__5478__auto____$1,i__127015);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127020,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127020,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__127016,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__127015,s__127014__$1,i__126934,m,vec__127020,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__127016,s__127014__$2,temp__5804__auto____$2,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__127015,s__127014__$1,i__126934,m,vec__127020,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__127016,s__127014__$2,temp__5804__auto____$2,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__127514 = (i__127015 + (1));
i__127015 = G__127514;
continue;
} else {
var G__127515 = (i__127015 + (1));
i__127015 = G__127515;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127016),frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__127013(cljs.core.chunk_rest(s__127014__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127016),null);
}
} else {
var vec__127027 = cljs.core.first(s__127014__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127027,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127027,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__127014__$1,i__126934,m,vec__127027,id_SINGLEQUOTE_,handler_id,s__127014__$2,temp__5804__auto____$2,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__127014__$1,i__126934,m,vec__127027,id_SINGLEQUOTE_,handler_id,s__127014__$2,temp__5804__auto____$2,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__126932_$_iter__126980_$_iter__127013(cljs.core.rest(s__127014__$2)));
} else {
var G__127516 = cljs.core.rest(s__127014__$2);
s__127014__$1 = G__127516;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__126934,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,null,null));
});})(i__126934,k,vs,v,s__126981__$2,temp__5804__auto____$1,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()),frontend$components$shortcut$iter__126932_$_iter__126980(cljs.core.rest(s__126981__$2)));
}
} else {
return null;
}
break;
}
});})(i__126934,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
,null,null));
});})(i__126934,vec__126946,g,ks,c__5478__auto__,size__5479__auto__,b__126935,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.vals(ks));
})())])]));

var G__127517 = (i__126934 + (1));
i__126934 = G__127517;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__126935),frontend$components$shortcut$iter__126932(cljs.core.chunk_rest(s__126933__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__126935),null);
}
} else {
var vec__127039 = cljs.core.first(s__126933__$2);
var g = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127039,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127039,(1),null);
return cljs.core.cons(daiquiri.core.create_element("section",{'className':"relative"},[(function (){var attrs126953 = frontend.ui.icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs126953))?daiquiri.interpreter.element_attributes(attrs126953):null),((cljs.core.map_QMARK_(attrs126953))?[(function (){var attrs126955 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126955))?daiquiri.interpreter.element_attributes(attrs126955):null),((cljs.core.map_QMARK_(attrs126955))?null:[daiquiri.interpreter.interpret(attrs126955)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]:[daiquiri.interpreter.interpret(attrs126953),(function (){var attrs126959 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","conflicts-for-label","keymap/conflicts-for-label",254824561)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126959))?daiquiri.interpreter.element_attributes(attrs126959):null),((cljs.core.map_QMARK_(attrs126959))?null:[daiquiri.interpreter.interpret(attrs126959)]));
})(),daiquiri.core.create_element("code",null,[frontend.modules.shortcut.utils.decorate_binding(g)])]));
})(),daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__127049(s__127050){
return (new cljs.core.LazySeq(null,(function (){
var s__127050__$1 = s__127050;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127050__$1);
if(temp__5804__auto____$1){
var s__127050__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127050__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127050__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127052 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127051 = (0);
while(true){
if((i__127051 < size__5479__auto__)){
var v = cljs.core._nth(c__5478__auto__,i__127051);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
cljs.core.chunk_append(b__127052,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__127051,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127061(s__127062){
return (new cljs.core.LazySeq(null,((function (i__127051,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function (){
var s__127062__$1 = s__127062;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__127062__$1);
if(temp__5804__auto____$2){
var s__127062__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__127062__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127062__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127064 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127063 = (0);
while(true){
if((i__127063 < size__5479__auto____$1)){
var vec__127065 = cljs.core._nth(c__5478__auto____$1,i__127063);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127065,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127065,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__127064,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__127063,s__127062__$1,i__127051,m,vec__127065,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__127064,s__127062__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__127063,s__127062__$1,i__127051,m,vec__127065,id_SINGLEQUOTE_,handler_id,c__5478__auto____$1,size__5479__auto____$1,b__127064,s__127062__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__127520 = (i__127063 + (1));
i__127063 = G__127520;
continue;
} else {
var G__127521 = (i__127063 + (1));
i__127063 = G__127521;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127064),frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127061(cljs.core.chunk_rest(s__127062__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127064),null);
}
} else {
var vec__127069 = cljs.core.first(s__127062__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127069,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127069,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__127062__$1,i__127051,m,vec__127069,id_SINGLEQUOTE_,handler_id,s__127062__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__127062__$1,i__127051,m,vec__127069,id_SINGLEQUOTE_,handler_id,s__127062__$2,temp__5804__auto____$2,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127061(cljs.core.rest(s__127062__$2)));
} else {
var G__127522 = cljs.core.rest(s__127062__$2);
s__127062__$1 = G__127522;
continue;
}
}
} else {
return null;
}
break;
}
});})(i__127051,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
,null,null));
});})(i__127051,k,vs,v,c__5478__auto__,size__5479__auto__,b__127052,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()));

var G__127523 = (i__127051 + (1));
i__127051 = G__127523;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127052),frontend$components$shortcut$iter__126932_$_iter__127049(cljs.core.chunk_rest(s__127050__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127052),null);
}
} else {
var v = cljs.core.first(s__127050__$2);
var k = cljs.core.first(v);
var vs = cljs.core.second(v);
return cljs.core.cons(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127073(s__127074){
return (new cljs.core.LazySeq(null,(function (){
var s__127074__$1 = s__127074;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__127074__$1);
if(temp__5804__auto____$2){
var s__127074__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__127074__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127074__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127076 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127075 = (0);
while(true){
if((i__127075 < size__5479__auto__)){
var vec__127078 = cljs.core._nth(c__5478__auto__,i__127075);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127078,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127078,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
cljs.core.chunk_append(b__127076,daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (i__127075,s__127074__$1,m,vec__127078,id_SINGLEQUOTE_,handler_id,c__5478__auto__,size__5479__auto__,b__127076,s__127074__$2,temp__5804__auto____$2,k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(i__127075,s__127074__$1,m,vec__127078,id_SINGLEQUOTE_,handler_id,c__5478__auto__,size__5479__auto__,b__127076,s__127074__$2,temp__5804__auto____$2,k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]));

var G__127524 = (i__127075 + (1));
i__127075 = G__127524;
continue;
} else {
var G__127525 = (i__127075 + (1));
i__127075 = G__127525;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127076),frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127073(cljs.core.chunk_rest(s__127074__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127076),null);
}
} else {
var vec__127083 = cljs.core.first(s__127074__$2);
var id_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127083,(0),null);
var handler_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127083,(1),null);
var m = frontend.modules.shortcut.data_helper.shortcut_item(id_SINGLEQUOTE_);
if((!((m == null)))){
return cljs.core.cons(daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)},[daiquiri.core.create_element("a",{'onClick':((function (s__127074__$1,m,vec__127083,id_SINGLEQUOTE_,handler_id,s__127074__$2,temp__5804__auto____$2,k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id_SINGLEQUOTE_);
});})(s__127074__$1,m,vec__127083,id_SINGLEQUOTE_,handler_id,s__127074__$2,temp__5804__auto____$2,k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
,'title':cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),'className':"select-none hover:underline"},[daiquiri.core.create_element("code",{'className':"inline-block mr-1 text-xs"},[frontend.modules.shortcut.utils.decorate_binding(k)]),(function (){var attrs127000 = frontend.modules.shortcut.data_helper.get_shortcut_desc(m);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127000))?daiquiri.interpreter.element_attributes(attrs127000):null),((cljs.core.map_QMARK_(attrs127000))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]:[daiquiri.interpreter.interpret(attrs127000),daiquiri.interpreter.interpret(frontend.ui.icon("external-link",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))]));
})(),daiquiri.core.create_element("code",null,[daiquiri.core.create_element("small",null,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_SINGLEQUOTE_)])])])]),frontend$components$shortcut$iter__126932_$_iter__127049_$_iter__127073(cljs.core.rest(s__127074__$2)));
} else {
var G__127527 = cljs.core.rest(s__127074__$2);
s__127074__$1 = G__127527;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});})(k,vs,v,s__127050__$2,temp__5804__auto____$1,vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(vs);
})()),frontend$components$shortcut$iter__126932_$_iter__127049(cljs.core.rest(s__127050__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__127039,g,ks,s__126933__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.vals(ks));
})())])]),frontend$components$shortcut$iter__126932(cljs.core.rest(s__126933__$2)));
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
frontend.components.shortcut.customize_shortcut_dialog_inner = rum.core.lazy_build(rum.core.build_defc,(function (k,action_name,binding,user_binding,p__127094){
var map__127096 = p__127094;
var map__127096__$1 = cljs.core.__destructure_map(map__127096);
var saved_cb = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127096__$1,new cljs.core.Keyword(null,"saved-cb","saved-cb",-1362182471));
var modal_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127096__$1,new cljs.core.Keyword(null,"modal-id","modal-id",-1810873919));
var _STAR_ref_el = rum.core.use_ref(null);
var vec__127099 = frontend.rum.use_atom(frontend.components.shortcut._STAR_customize_modal_life_sentry);
var modal_life = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127099,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127099,(1),null);
var vec__127102 = rum.core.use_state("");
var keystroke = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127102,(0),null);
var set_keystroke_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127102,(1),null);
var vec__127105 = rum.core.use_state((function (){var or__5002__auto__ = user_binding;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return binding;
}
})());
var current_binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127105,(0),null);
var set_current_binding_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127105,(1),null);
var vec__127108 = rum.core.use_state(null);
var key_conflicts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127108,(0),null);
var set_key_conflicts_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127108,(1),null);
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
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$5(["Shortcut conflicts from existing binding: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__127114 = current_conflicts;
if((G__127114 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__127087_SHARP_){
return frontend.modules.shortcut.utils.decorate_binding(p1__127087_SHARP_);
}),G__127114);
}
})()], 0))].join(''),new cljs.core.Keyword(null,"error","error",-978969032),true,new cljs.core.Keyword("shortcut-conflicts","warning","shortcut-conflicts/warning",1445082331),(5000));
} else {
var conflicts_map = frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$2(keystroke,handler_id);
if(cljs.core.not(cljs.core.seq(conflicts_map))){
var G__127115_127528 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_binding,keystroke);
(set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__127115_127528) : set_current_binding_BANG_.call(null,G__127115_127528));

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
var G__127118_127529 = el;
if((G__127118_127529 == null)){
} else {
G__127118_127529.focus();
}

return setTimeout((function (){
var G__127121 = el.querySelector(".shortcut-record-control a.submit");
if((G__127121 == null)){
return null;
} else {
return G__127121.click();
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

var G__127127 = (function (p1__127090_SHARP_){
return frontend.util.trim_safe([cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__127090_SHARP_),frontend.modules.shortcut.core.keyname(e)].join(''));
});
return (set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1(G__127127) : set_keystroke_BANG_.call(null,G__127127));
}));

setTimeout((function (){
return el.focus();
}),(128));

return (function (){
var G__127130_127530 = teardown_global_BANG_;
if((G__127130_127530 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__127130_127530,null);
}

key_handler.dispose();

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.shortcut._STAR_customize_modal_life_sentry,cljs.core.inc);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'tabIndex':(-1),'ref':_STAR_ref_el,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__shortcut-page-x-record-dialog-inner",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"keypressed","keypressed",-1097101815),keypressed_QMARK_,new cljs.core.Keyword(null,"dirty","dirty",729553281),dirty_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"sm:w-lsm"},[(function (){var attrs127201 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","customize-for-label","keymap/customize-for-label",1860516586)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs127201))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xl","pb-2"], null)], null),attrs127201], 0))):{'className':"text-2xl pb-2"}),((cljs.core.map_QMARK_(attrs127201))?null:[daiquiri.interpreter.interpret(attrs127201)]));
})(),daiquiri.core.create_element("p",{'className':"mb-4 text-md"},[(function (){var attrs127203 = action_name;
return daiquiri.core.create_element("b",((cljs.core.map_QMARK_(attrs127203))?daiquiri.interpreter.element_attributes(attrs127203):null),((cljs.core.map_QMARK_(attrs127203))?null:[daiquiri.interpreter.interpret(attrs127203)]));
})()]),daiquiri.core.create_element("div",{'className':"shortcuts-keys-wrap"},[daiquiri.core.create_element("span",{'className':"keyboard-shortcut flex flex-wrap mr-2 space-x-2"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__127213(s__127214){
return (new cljs.core.LazySeq(null,(function (){
var s__127214__$1 = s__127214;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__127214__$1);
if(temp__5804__auto__){
var s__127214__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__127214__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127214__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127216 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127215 = (0);
while(true){
if((i__127215 < size__5479__auto__)){
var x = cljs.core._nth(c__5478__auto__,i__127215);
if(typeof x === 'string'){
cljs.core.chunk_append(b__127216,daiquiri.core.create_element("code",{'className':"tracking-wider"},[frontend.modules.shortcut.utils.decorate_binding(clojure.string.lower_case(clojure.string.trim(x))),daiquiri.core.create_element("a",{'onClick':((function (i__127215,s__127214__$1,x,c__5478__auto__,size__5479__auto__,b__127216,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id){
return (function (){
var G__127220 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (i__127215,s__127214__$1,x,c__5478__auto__,size__5479__auto__,b__127216,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id){
return (function (p1__127091_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,p1__127091_SHARP_);
});})(i__127215,s__127214__$1,x,c__5478__auto__,size__5479__auto__,b__127216,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id))
,current_binding));
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__127220) : set_current_binding_BANG_.call(null,G__127220));
});})(i__127215,s__127214__$1,x,c__5478__auto__,size__5479__auto__,b__127216,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id))
,'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]));

var G__127534 = (i__127215 + (1));
i__127215 = G__127534;
continue;
} else {
var G__127535 = (i__127215 + (1));
i__127215 = G__127535;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127216),frontend$components$shortcut$iter__127213(cljs.core.chunk_rest(s__127214__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127216),null);
}
} else {
var x = cljs.core.first(s__127214__$2);
if(typeof x === 'string'){
return cljs.core.cons(daiquiri.core.create_element("code",{'className':"tracking-wider"},[frontend.modules.shortcut.utils.decorate_binding(clojure.string.lower_case(clojure.string.trim(x))),daiquiri.core.create_element("a",{'onClick':((function (s__127214__$1,x,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id){
return (function (){
var G__127224 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (s__127214__$1,x,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id){
return (function (p1__127091_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,p1__127091_SHARP_);
});})(s__127214__$1,x,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id))
,current_binding));
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(G__127224) : set_current_binding_BANG_.call(null,G__127224));
});})(s__127214__$1,x,s__127214__$2,temp__5804__auto__,_STAR_ref_el,vec__127099,modal_life,_,vec__127102,keystroke,set_keystroke_BANG_,vec__127105,current_binding,set_current_binding_BANG_,vec__127108,key_conflicts,set_key_conflicts_BANG_,handler_id,dirty_QMARK_,keypressed_QMARK_,save_keystroke_fn_BANG_,map__127096,map__127096__$1,saved_cb,modal_id))
,'className':"x"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))])]),frontend$components$shortcut$iter__127213(cljs.core.rest(s__127214__$2)));
} else {
var G__127537 = cljs.core.rest(s__127214__$2);
s__127214__$1 = G__127537;
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
})())]),(function (){var attrs127212 = ((keypressed_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((clojure.string.blank_QMARK_(keystroke))?null:frontend.ui.render_keyboard_shortcut(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [keystroke], null))),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.active:opacity-90.submit","a.flex.items-center.active:opacity-90.submit",-1059179250),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),save_keystroke_fn_BANG_], null),frontend.ui.icon("check",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90.cancel","a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90.cancel",389890030),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_keystroke_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_keystroke_BANG_.call(null,""));

return (set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_key_conflicts_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_key_conflicts_BANG_.call(null,null));
})], null),frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.flex.items-center","code.flex.items-center",450036941),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.pr-1","small.pr-1",794910716),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","keystroke-record-setup-label","keymap/keystroke-record-setup-label",-1426705636)], 0))], null),frontend.ui.icon("keyboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs127212))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["shortcut-record-control"], null)], null),attrs127212], 0))):{'className':"shortcut-record-control"}),((cljs.core.map_QMARK_(attrs127212))?null:[daiquiri.interpreter.interpret(attrs127212)]));
})()])]),((cljs.core.seq(key_conflicts))?frontend.components.shortcut.shortcut_conflicts_display(k,key_conflicts):null),(function (){var attrs127197 = ((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_binding,binding)) && (cljs.core.seq(binding))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.space-x-1.text-sm.fade-link","a.flex.items-center.space-x-1.text-sm.fade-link",-1501146342),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_binding_BANG_.cljs$core$IFn$_invoke$arity$1(binding) : set_current_binding_BANG_.call(null,binding));
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","restore-to-default","keymap/restore-to-default",805883024)], 0)),(function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__127225(s__127226){
return (new cljs.core.LazySeq(null,(function (){
var s__127226__$1 = s__127226;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__127226__$1);
if(temp__5804__auto__){
var s__127226__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__127226__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127226__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127228 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127227 = (0);
while(true){
if((i__127227 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__127227);
cljs.core.chunk_append(b__127228,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut.ml-1","span.keyboard-shortcut.ml-1",-656404157),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),it], null)], null));

var G__127540 = (i__127227 + (1));
i__127227 = G__127540;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127228),frontend$components$shortcut$iter__127225(cljs.core.chunk_rest(s__127226__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127228),null);
}
} else {
var it = cljs.core.first(s__127226__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut.ml-1","span.keyboard-shortcut.ml-1",-656404157),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),it], null)], null),frontend$components$shortcut$iter__127225(cljs.core.rest(s__127226__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__((function (){var G__127230 = binding;
if((G__127230 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__127093_SHARP_){
var G__127231 = p1__127093_SHARP_;
var G__127231__$1 = (((G__127231 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127231));
if((G__127231__$1 == null)){
return null;
} else {
return frontend.modules.shortcut.utils.decorate_binding(G__127231__$1);
}
}),G__127230);
}
})());
})()], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs127197))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-btns","text-right","mt-6","flex","justify-between","items-center"], null)], null),attrs127197], 0))):{'className':"action-btns text-right mt-6 flex justify-between items-center"}),((cljs.core.map_QMARK_(attrs127197))?[(function (){var attrs127198 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"save","save",1850079149)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(dirty_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs127198))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs127198], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs127198))?null:[daiquiri.interpreter.interpret(attrs127198)]));
})()]:[daiquiri.interpreter.interpret(attrs127197),(function (){var attrs127200 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"save","save",1850079149)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(dirty_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs127200))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs127200], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs127200))?null:[daiquiri.interpreter.interpret(attrs127200)]));
})()]));
})()]);
}),null,"frontend.components.shortcut/customize-shortcut-dialog-inner");
frontend.components.shortcut.build_categories_map = (function frontend$components$shortcut$build_categories_map(){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__127232_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__127232_SHARP_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.sorted_map(),frontend.modules.shortcut.data_helper.binding_by_category(p1__127232_SHARP_))],null));
}),frontend.components.shortcut.categories);
});
frontend.components.shortcut.shortcut_keymap_x = rum.core.lazy_build(rum.core.build_defc,(function (){
var _ = frontend.rum.use_atom(frontend.modules.shortcut.config._STAR_category);
var ___$1 = frontend.rum.use_atom(frontend.components.shortcut._STAR_refresh_sentry);
var vec__127249 = rum.core.use_state(false);
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127249,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127249,(1),null);
var vec__127252 = rum.core.use_state(cljs.core.PersistentHashSet.EMPTY);
var filters = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127252,(0),null);
var set_filters_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127252,(1),null);
var vec__127255 = rum.core.use_state("");
var keystroke = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127255,(0),null);
var set_keystroke_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127255,(1),null);
var vec__127258 = rum.core.use_state(null);
var q = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127258,(0),null);
var set_q_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127258,(1),null);
var categories_list_map = frontend.components.shortcut.build_categories_map();
var all_categories = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,categories_list_map));
var in_filters_QMARK_ = cljs.core.boolean$(cljs.core.seq(filters));
var in_query_QMARK_ = (!(clojure.string.blank_QMARK_(frontend.util.trim_safe(q))));
var in_keystroke_QMARK_ = (!(clojure.string.blank_QMARK_(keystroke)));
var vec__127261 = rum.core.use_state(cljs.core.PersistentHashSet.EMPTY);
var folded_categories = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127261,(0),null);
var set_folded_categories_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127261,(1),null);
var matched_list_map = ((((in_query_QMARK_) && ((!(in_keystroke_QMARK_)))))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__127271){
var vec__127272 = p__127271;
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127272,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127272,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [c,(function (){var G__127275 = binding_map;
var G__127276 = q;
var G__127277 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__127278 = (function (p1__127233_SHARP_){
var vec__127279 = p1__127233_SHARP_;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127279,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127279,(1),null);
return [cljs.core.name(id)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.modules.shortcut.data_helper.get_shortcut_desc(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"id","id",-1388402092),id)))].join('');
});
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4(G__127275,G__127276,G__127277,G__127278) : frontend.search.fuzzy_search.call(null,G__127275,G__127276,G__127277,G__127278));
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
var G__127282 = cljs.core.PersistentHashSet.EMPTY;
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__127282) : set_folded_categories_BANG_.call(null,G__127282));
} else {
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(all_categories) : set_folded_categories_BANG_.call(null,all_categories));
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
}),(100));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"cp__shortcut-page-x"},[daiquiri.core.create_element("header",{'className':"relative"},[daiquiri.core.create_element("h2",{'className':"text-xs opacity-70"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","total","keymap/total",-1306092209)], 0)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(ready_QMARK_)?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__127234_SHARP_){
return cljs.core.count(cljs.core.second(p1__127234_SHARP_));
}),result_list_map)):" ..."))].join('')]),frontend.components.shortcut.pane_controls(q,set_q_BANG_,filters,set_filters_BANG_,keystroke,set_keystroke_BANG_,toggle_categories_BANG_)]),(function (){var attrs127283 = (cljs.core.truth_(ready_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.py-8.flex.justify-center","p.py-8.flex.justify-center",-1082958729),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null));
return daiquiri.core.create_element("article",((cljs.core.map_QMARK_(attrs127283))?daiquiri.interpreter.element_attributes(attrs127283):null),((cljs.core.map_QMARK_(attrs127283))?[(cljs.core.truth_(ready_QMARK_)?daiquiri.core.create_element("ul",{'className':"list-none m-0 py-3"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__127301(s__127302){
return (new cljs.core.LazySeq(null,(function (){
var s__127302__$1 = s__127302;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__127302__$1);
if(temp__5804__auto__){
var s__127302__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__127302__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127302__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127304 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127303 = (0);
while(true){
if((i__127303 < size__5479__auto__)){
var vec__127305 = cljs.core._nth(c__5478__auto__,i__127303);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127305,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127305,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
cljs.core.chunk_append(b__127304,(function (){var attrs127300 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__127303,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__127308 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__127308) : set_folded_categories_BANG_.call(null,G__127308));
});})(i__127303,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs127300))?daiquiri.interpreter.element_attributes(attrs127300):null),((cljs.core.map_QMARK_(attrs127300))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127301_$_iter__127309(s__127310){
return (new cljs.core.LazySeq(null,((function (i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__127310__$1 = s__127310;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127310__$1);
if(temp__5804__auto____$1){
var s__127310__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127310__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127310__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127312 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127311 = (0);
while(true){
if((i__127311 < size__5479__auto____$1)){
var vec__127313 = cljs.core._nth(c__5478__auto____$1,i__127311);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127313,(0),null);
var map__127316 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127313,(1),null);
var map__127316__$1 = cljs.core.__destructure_map(map__127316);
var m = map__127316__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127316__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127316__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127312,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127317 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127317 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127317);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127311,i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127318 = p1__127241_SHARP_;
var G__127318__$1 = (((G__127318 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127318));
var G__127318__$2 = (((G__127318__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127318__$1));
if((G__127318__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127318__$2);
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
});})(i__127311,i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127319 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127319))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127319], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127319))?null:[daiquiri.interpreter.interpret(attrs127319)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127320 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127320))?daiquiri.interpreter.element_attributes(attrs127320):null),((cljs.core.map_QMARK_(attrs127320))?null:[daiquiri.interpreter.interpret(attrs127320)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127321 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127311,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127313,id,map__127316,map__127316__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127312,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127321))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127321], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127321))?null:[daiquiri.interpreter.interpret(attrs127321)]));
})():null))])]):null):null));

var G__127565 = (i__127311 + (1));
i__127311 = G__127565;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127312),frontend$components$shortcut$iter__127301_$_iter__127309(cljs.core.chunk_rest(s__127310__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127312),null);
}
} else {
var vec__127327 = cljs.core.first(s__127310__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127327,(0),null);
var map__127330 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127327,(1),null);
var map__127330__$1 = cljs.core.__destructure_map(map__127330);
var m = map__127330__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127330__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127330__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127331 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127331 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127331);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127332 = p1__127241_SHARP_;
var G__127332__$1 = (((G__127332 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127332));
var G__127332__$2 = (((G__127332__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127332__$1));
if((G__127332__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127332__$2);
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
});})(i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127319 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127319))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127319], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127319))?null:[daiquiri.interpreter.interpret(attrs127319)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127320 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127320))?daiquiri.interpreter.element_attributes(attrs127320):null),((cljs.core.map_QMARK_(attrs127320))?null:[daiquiri.interpreter.interpret(attrs127320)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127321 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127327,id,map__127330,map__127330__$1,m,binding,user_binding,s__127310__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127321))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127321], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127321))?null:[daiquiri.interpreter.interpret(attrs127321)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127301_$_iter__127309(cljs.core.rest(s__127310__$2)));
}
} else {
return null;
}
break;
}
});})(i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs127300),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127301_$_iter__127333(s__127334){
return (new cljs.core.LazySeq(null,((function (i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__127334__$1 = s__127334;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127334__$1);
if(temp__5804__auto____$1){
var s__127334__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127334__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127334__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127336 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127335 = (0);
while(true){
if((i__127335 < size__5479__auto____$1)){
var vec__127337 = cljs.core._nth(c__5478__auto____$1,i__127335);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127337,(0),null);
var map__127340 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127337,(1),null);
var map__127340__$1 = cljs.core.__destructure_map(map__127340);
var m = map__127340__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127340__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127340__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127336,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127341 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127341 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127341);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127335,i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127342 = p1__127241_SHARP_;
var G__127342__$1 = (((G__127342 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127342));
var G__127342__$2 = (((G__127342__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127342__$1));
if((G__127342__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127342__$2);
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
});})(i__127335,i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127343 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127343))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127343], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127343))?null:[daiquiri.interpreter.interpret(attrs127343)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127344 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127344))?daiquiri.interpreter.element_attributes(attrs127344):null),((cljs.core.map_QMARK_(attrs127344))?null:[daiquiri.interpreter.interpret(attrs127344)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127345 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127335,i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127337,id,map__127340,map__127340__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127336,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127345))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127345], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127345))?null:[daiquiri.interpreter.interpret(attrs127345)]));
})():null))])]):null):null));

var G__127581 = (i__127335 + (1));
i__127335 = G__127581;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127336),frontend$components$shortcut$iter__127301_$_iter__127333(cljs.core.chunk_rest(s__127334__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127336),null);
}
} else {
var vec__127346 = cljs.core.first(s__127334__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127346,(0),null);
var map__127349 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127346,(1),null);
var map__127349__$1 = cljs.core.__destructure_map(map__127349);
var m = map__127349__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127349__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127349__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127350 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127350 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127350);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127351 = p1__127241_SHARP_;
var G__127351__$1 = (((G__127351 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127351));
var G__127351__$2 = (((G__127351__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127351__$1));
if((G__127351__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127351__$2);
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
});})(i__127303,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127343 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127343))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127343], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127343))?null:[daiquiri.interpreter.interpret(attrs127343)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127344 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127344))?daiquiri.interpreter.element_attributes(attrs127344):null),((cljs.core.map_QMARK_(attrs127344))?null:[daiquiri.interpreter.interpret(attrs127344)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127345 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127303,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127346,id,map__127349,map__127349__$1,m,binding,user_binding,s__127334__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127345))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127345], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127345))?null:[daiquiri.interpreter.interpret(attrs127345)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127301_$_iter__127333(cljs.core.rest(s__127334__$2)));
}
} else {
return null;
}
break;
}
});})(i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__127303,attrs127300,folded_QMARK_,vec__127305,c,binding_map,c__5478__auto__,size__5479__auto__,b__127304,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})());

var G__127592 = (i__127303 + (1));
i__127303 = G__127592;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127304),frontend$components$shortcut$iter__127301(cljs.core.chunk_rest(s__127302__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127304),null);
}
} else {
var vec__127352 = cljs.core.first(s__127302__$2);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127352,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127352,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
return cljs.core.cons((function (){var attrs127300 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__127355 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__127355) : set_folded_categories_BANG_.call(null,G__127355));
});})(folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs127300))?daiquiri.interpreter.element_attributes(attrs127300):null),((cljs.core.map_QMARK_(attrs127300))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127301_$_iter__127356(s__127357){
return (new cljs.core.LazySeq(null,(function (){
var s__127357__$1 = s__127357;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127357__$1);
if(temp__5804__auto____$1){
var s__127357__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127357__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127357__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127359 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127358 = (0);
while(true){
if((i__127358 < size__5479__auto__)){
var vec__127360 = cljs.core._nth(c__5478__auto__,i__127358);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127360,(0),null);
var map__127363 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127360,(1),null);
var map__127363__$1 = cljs.core.__destructure_map(map__127363);
var m = map__127363__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127363__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127363__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127359,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127364 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127364 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127364);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127358,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127365 = p1__127241_SHARP_;
var G__127365__$1 = (((G__127365 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127365));
var G__127365__$2 = (((G__127365__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127365__$1));
if((G__127365__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127365__$2);
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
});})(i__127358,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127319 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127319))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127319], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127319))?null:[daiquiri.interpreter.interpret(attrs127319)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127320 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127320))?daiquiri.interpreter.element_attributes(attrs127320):null),((cljs.core.map_QMARK_(attrs127320))?null:[daiquiri.interpreter.interpret(attrs127320)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127321 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127358,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127360,id,map__127363,map__127363__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127359,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127321))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127321], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127321))?null:[daiquiri.interpreter.interpret(attrs127321)]));
})():null))])]):null):null));

var G__127602 = (i__127358 + (1));
i__127358 = G__127602;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127359),frontend$components$shortcut$iter__127301_$_iter__127356(cljs.core.chunk_rest(s__127357__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127359),null);
}
} else {
var vec__127366 = cljs.core.first(s__127357__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127366,(0),null);
var map__127369 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127366,(1),null);
var map__127369__$1 = cljs.core.__destructure_map(map__127369);
var m = map__127369__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127369__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127369__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127370 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127370 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127370);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127371 = p1__127241_SHARP_;
var G__127371__$1 = (((G__127371 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127371));
var G__127371__$2 = (((G__127371__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127371__$1));
if((G__127371__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127371__$2);
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
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127319 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127319))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127319], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127319))?null:[daiquiri.interpreter.interpret(attrs127319)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127320 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127320))?daiquiri.interpreter.element_attributes(attrs127320):null),((cljs.core.map_QMARK_(attrs127320))?null:[daiquiri.interpreter.interpret(attrs127320)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127321 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127366,id,map__127369,map__127369__$1,m,binding,user_binding,s__127357__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127321))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127321], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127321))?null:[daiquiri.interpreter.interpret(attrs127321)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127301_$_iter__127356(cljs.core.rest(s__127357__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs127300),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127301_$_iter__127372(s__127373){
return (new cljs.core.LazySeq(null,(function (){
var s__127373__$1 = s__127373;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127373__$1);
if(temp__5804__auto____$1){
var s__127373__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127373__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127373__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127375 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127374 = (0);
while(true){
if((i__127374 < size__5479__auto__)){
var vec__127376 = cljs.core._nth(c__5478__auto__,i__127374);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127376,(0),null);
var map__127379 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127376,(1),null);
var map__127379__$1 = cljs.core.__destructure_map(map__127379);
var m = map__127379__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127379__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127379__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127375,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127380 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127380 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127380);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127374,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127381 = p1__127241_SHARP_;
var G__127381__$1 = (((G__127381 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127381));
var G__127381__$2 = (((G__127381__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127381__$1));
if((G__127381__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127381__$2);
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
});})(i__127374,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127343 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127343))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127343], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127343))?null:[daiquiri.interpreter.interpret(attrs127343)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127344 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127344))?daiquiri.interpreter.element_attributes(attrs127344):null),((cljs.core.map_QMARK_(attrs127344))?null:[daiquiri.interpreter.interpret(attrs127344)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127345 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127374,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127376,id,map__127379,map__127379__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127375,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127345))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127345], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127345))?null:[daiquiri.interpreter.interpret(attrs127345)]));
})():null))])]):null):null));

var G__127603 = (i__127374 + (1));
i__127374 = G__127603;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127375),frontend$components$shortcut$iter__127301_$_iter__127372(cljs.core.chunk_rest(s__127373__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127375),null);
}
} else {
var vec__127382 = cljs.core.first(s__127373__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127382,(0),null);
var map__127385 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127382,(1),null);
var map__127385__$1 = cljs.core.__destructure_map(map__127385);
var m = map__127385__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127385__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127385__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127386 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127386 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127386);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127387 = p1__127241_SHARP_;
var G__127387__$1 = (((G__127387 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127387));
var G__127387__$2 = (((G__127387__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127387__$1));
if((G__127387__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127387__$2);
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
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127343 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127343))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127343], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127343))?null:[daiquiri.interpreter.interpret(attrs127343)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127344 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127344))?daiquiri.interpreter.element_attributes(attrs127344):null),((cljs.core.map_QMARK_(attrs127344))?null:[daiquiri.interpreter.interpret(attrs127344)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127345 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127382,id,map__127385,map__127385__$1,m,binding,user_binding,s__127373__$2,temp__5804__auto____$1,attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127345))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127345], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127345))?null:[daiquiri.interpreter.interpret(attrs127345)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127301_$_iter__127372(cljs.core.rest(s__127373__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs127300,folded_QMARK_,vec__127352,c,binding_map,s__127302__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})(),frontend$components$shortcut$iter__127301(cljs.core.rest(s__127302__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result_list_map);
})())]):null)]:[daiquiri.interpreter.interpret(attrs127283),(cljs.core.truth_(ready_QMARK_)?daiquiri.core.create_element("ul",{'className':"list-none m-0 py-3"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$shortcut$iter__127391(s__127392){
return (new cljs.core.LazySeq(null,(function (){
var s__127392__$1 = s__127392;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__127392__$1);
if(temp__5804__auto__){
var s__127392__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__127392__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127392__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127394 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127393 = (0);
while(true){
if((i__127393 < size__5479__auto__)){
var vec__127395 = cljs.core._nth(c__5478__auto__,i__127393);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127395,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127395,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
cljs.core.chunk_append(b__127394,(function (){var attrs127390 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__127393,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__127398 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__127398) : set_folded_categories_BANG_.call(null,G__127398));
});})(i__127393,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs127390))?daiquiri.interpreter.element_attributes(attrs127390):null),((cljs.core.map_QMARK_(attrs127390))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127391_$_iter__127399(s__127400){
return (new cljs.core.LazySeq(null,((function (i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__127400__$1 = s__127400;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127400__$1);
if(temp__5804__auto____$1){
var s__127400__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127400__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127400__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127402 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127401 = (0);
while(true){
if((i__127401 < size__5479__auto____$1)){
var vec__127403 = cljs.core._nth(c__5478__auto____$1,i__127401);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127403,(0),null);
var map__127406 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127403,(1),null);
var map__127406__$1 = cljs.core.__destructure_map(map__127406);
var m = map__127406__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127406__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127406__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127402,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127407 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127407 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127407);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127401,i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127408 = p1__127241_SHARP_;
var G__127408__$1 = (((G__127408 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127408));
var G__127408__$2 = (((G__127408__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127408__$1));
if((G__127408__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127408__$2);
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
});})(i__127401,i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127409 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127409))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127409], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127409))?null:[daiquiri.interpreter.interpret(attrs127409)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127410 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127410))?daiquiri.interpreter.element_attributes(attrs127410):null),((cljs.core.map_QMARK_(attrs127410))?null:[daiquiri.interpreter.interpret(attrs127410)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127411 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127401,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127403,id,map__127406,map__127406__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127402,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127411))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127411], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127411))?null:[daiquiri.interpreter.interpret(attrs127411)]));
})():null))])]):null):null));

var G__127619 = (i__127401 + (1));
i__127401 = G__127619;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127402),frontend$components$shortcut$iter__127391_$_iter__127399(cljs.core.chunk_rest(s__127400__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127402),null);
}
} else {
var vec__127412 = cljs.core.first(s__127400__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127412,(0),null);
var map__127415 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127412,(1),null);
var map__127415__$1 = cljs.core.__destructure_map(map__127415);
var m = map__127415__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127415__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127415__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127416 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127416 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127416);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127417 = p1__127241_SHARP_;
var G__127417__$1 = (((G__127417 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127417));
var G__127417__$2 = (((G__127417__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127417__$1));
if((G__127417__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127417__$2);
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
});})(i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127409 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127409))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127409], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127409))?null:[daiquiri.interpreter.interpret(attrs127409)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127410 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127410))?daiquiri.interpreter.element_attributes(attrs127410):null),((cljs.core.map_QMARK_(attrs127410))?null:[daiquiri.interpreter.interpret(attrs127410)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127411 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127412,id,map__127415,map__127415__$1,m,binding,user_binding,s__127400__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127411))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127411], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127411))?null:[daiquiri.interpreter.interpret(attrs127411)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127391_$_iter__127399(cljs.core.rest(s__127400__$2)));
}
} else {
return null;
}
break;
}
});})(i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs127390),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127391_$_iter__127418(s__127419){
return (new cljs.core.LazySeq(null,((function (i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var s__127419__$1 = s__127419;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127419__$1);
if(temp__5804__auto____$1){
var s__127419__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127419__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__127419__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__127421 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__127420 = (0);
while(true){
if((i__127420 < size__5479__auto____$1)){
var vec__127422 = cljs.core._nth(c__5478__auto____$1,i__127420);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127422,(0),null);
var map__127425 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127422,(1),null);
var map__127425__$1 = cljs.core.__destructure_map(map__127425);
var m = map__127425__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127425__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127425__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127421,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127426 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127426 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127426);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127420,i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127427 = p1__127241_SHARP_;
var G__127427__$1 = (((G__127427 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127427));
var G__127427__$2 = (((G__127427__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127427__$1));
if((G__127427__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127427__$2);
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
});})(i__127420,i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127428 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127428))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127428], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127428))?null:[daiquiri.interpreter.interpret(attrs127428)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127429 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127429))?daiquiri.interpreter.element_attributes(attrs127429):null),((cljs.core.map_QMARK_(attrs127429))?null:[daiquiri.interpreter.interpret(attrs127429)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127430 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127420,i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127422,id,map__127425,map__127425__$1,m,binding,user_binding,c__5478__auto____$1,size__5479__auto____$1,b__127421,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127430))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127430], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127430))?null:[daiquiri.interpreter.interpret(attrs127430)]));
})():null))])]):null):null));

var G__127626 = (i__127420 + (1));
i__127420 = G__127626;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127421),frontend$components$shortcut$iter__127391_$_iter__127418(cljs.core.chunk_rest(s__127419__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127421),null);
}
} else {
var vec__127431 = cljs.core.first(s__127419__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127431,(0),null);
var map__127434 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127431,(1),null);
var map__127434__$1 = cljs.core.__destructure_map(map__127434);
var m = map__127434__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127434__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127434__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127435 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127435 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127435);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127436 = p1__127241_SHARP_;
var G__127436__$1 = (((G__127436 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127436));
var G__127436__$2 = (((G__127436__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127436__$1));
if((G__127436__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127436__$2);
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
});})(i__127393,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127428 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127428))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127428], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127428))?null:[daiquiri.interpreter.interpret(attrs127428)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127429 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127429))?daiquiri.interpreter.element_attributes(attrs127429):null),((cljs.core.map_QMARK_(attrs127429))?null:[daiquiri.interpreter.interpret(attrs127429)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127430 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127393,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127431,id,map__127434,map__127434__$1,m,binding,user_binding,s__127419__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127430))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127430], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127430))?null:[daiquiri.interpreter.interpret(attrs127430)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127391_$_iter__127418(cljs.core.rest(s__127419__$2)));
}
} else {
return null;
}
break;
}
});})(i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,null,null));
});})(i__127393,attrs127390,folded_QMARK_,vec__127395,c,binding_map,c__5478__auto__,size__5479__auto__,b__127394,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})());

var G__127633 = (i__127393 + (1));
i__127393 = G__127633;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127394),frontend$components$shortcut$iter__127391(cljs.core.chunk_rest(s__127392__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127394),null);
}
} else {
var vec__127437 = cljs.core.first(s__127392__$2);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127437,(0),null);
var binding_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127437,(1),null);
var folded_QMARK_ = cljs.core.contains_QMARK_(folded_categories,c);
return cljs.core.cons((function (){var attrs127390 = (((((!(in_query_QMARK_))) && ((((!(in_filters_QMARK_))) && ((!(in_keystroke_QMARK_)))))))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.justify-between.th","li.flex.justify-between.th",-179015278),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
var f = ((folded_QMARK_)?cljs.core.disj:cljs.core.conj);
var G__127440 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(folded_categories,c) : f.call(null,folded_categories,c));
return (set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_folded_categories_BANG_.cljs$core$IFn$_invoke$arity$1(G__127440) : set_folded_categories_BANG_.call(null,G__127440));
});})(folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center","i.flex.items-center",1064024509),frontend.ui.icon(((folded_QMARK_)?"chevron-left":"chevron-down"))], null)], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs127390))?daiquiri.interpreter.element_attributes(attrs127390):null),((cljs.core.map_QMARK_(attrs127390))?[((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127391_$_iter__127441(s__127442){
return (new cljs.core.LazySeq(null,(function (){
var s__127442__$1 = s__127442;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127442__$1);
if(temp__5804__auto____$1){
var s__127442__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127442__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127442__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127444 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127443 = (0);
while(true){
if((i__127443 < size__5479__auto__)){
var vec__127445 = cljs.core._nth(c__5478__auto__,i__127443);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127445,(0),null);
var map__127448 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127445,(1),null);
var map__127448__$1 = cljs.core.__destructure_map(map__127448);
var m = map__127448__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127448__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127448__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127444,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127449 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127449 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127449);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127443,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127450 = p1__127241_SHARP_;
var G__127450__$1 = (((G__127450 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127450));
var G__127450__$2 = (((G__127450__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127450__$1));
if((G__127450__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127450__$2);
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
});})(i__127443,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127409 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127409))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127409], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127409))?null:[daiquiri.interpreter.interpret(attrs127409)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127410 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127410))?daiquiri.interpreter.element_attributes(attrs127410):null),((cljs.core.map_QMARK_(attrs127410))?null:[daiquiri.interpreter.interpret(attrs127410)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127411 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127443,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127445,id,map__127448,map__127448__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127444,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127411))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127411], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127411))?null:[daiquiri.interpreter.interpret(attrs127411)]));
})():null))])]):null):null));

var G__127642 = (i__127443 + (1));
i__127443 = G__127642;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127444),frontend$components$shortcut$iter__127391_$_iter__127441(cljs.core.chunk_rest(s__127442__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127444),null);
}
} else {
var vec__127451 = cljs.core.first(s__127442__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127451,(0),null);
var map__127454 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127451,(1),null);
var map__127454__$1 = cljs.core.__destructure_map(map__127454);
var m = map__127454__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127454__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127454__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127455 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127455 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127455);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127456 = p1__127241_SHARP_;
var G__127456__$1 = (((G__127456 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127456));
var G__127456__$2 = (((G__127456__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127456__$1));
if((G__127456__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127456__$2);
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
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127409 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127409))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127409], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127409))?null:[daiquiri.interpreter.interpret(attrs127409)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127410 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127410))?daiquiri.interpreter.element_attributes(attrs127410):null),((cljs.core.map_QMARK_(attrs127410))?null:[daiquiri.interpreter.interpret(attrs127410)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127411 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127451,id,map__127454,map__127454__$1,m,binding,user_binding,s__127442__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127411))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127411], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127411))?null:[daiquiri.interpreter.interpret(attrs127411)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127391_$_iter__127441(cljs.core.rest(s__127442__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]:[daiquiri.interpreter.interpret(attrs127390),((((in_query_QMARK_) || (((in_filters_QMARK_) || ((!(folded_QMARK_)))))))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function frontend$components$shortcut$iter__127391_$_iter__127457(s__127458){
return (new cljs.core.LazySeq(null,(function (){
var s__127458__$1 = s__127458;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__127458__$1);
if(temp__5804__auto____$1){
var s__127458__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__127458__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127458__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127460 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127459 = (0);
while(true){
if((i__127459 < size__5479__auto__)){
var vec__127461 = cljs.core._nth(c__5478__auto__,i__127459);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127461,(0),null);
var map__127464 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127461,(1),null);
var map__127464__$1 = cljs.core.__destructure_map(map__127464);
var m = map__127464__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127464__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127464__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
cljs.core.chunk_append(b__127460,(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.core.seq(filters) == null);
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127465 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127465 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127465);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (i__127459,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127466 = p1__127241_SHARP_;
var G__127466__$1 = (((G__127466 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127466));
var G__127466__$2 = (((G__127466__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127466__$1));
if((G__127466__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127466__$2);
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
});})(i__127459,binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127428 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127428))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127428], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127428))?null:[daiquiri.interpreter.interpret(attrs127428)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127429 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127429))?daiquiri.interpreter.element_attributes(attrs127429):null),((cljs.core.map_QMARK_(attrs127429))?null:[daiquiri.interpreter.interpret(attrs127429)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127430 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(i__127459,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127461,id,map__127464,map__127464__$1,m,binding,user_binding,c__5478__auto__,size__5479__auto__,b__127460,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127430))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127430], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127430))?null:[daiquiri.interpreter.interpret(attrs127430)]));
})():null))])]):null):null));

var G__127655 = (i__127459 + (1));
i__127459 = G__127655;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127460),frontend$components$shortcut$iter__127391_$_iter__127457(cljs.core.chunk_rest(s__127458__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127460),null);
}
} else {
var vec__127467 = cljs.core.first(s__127458__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127467,(0),null);
var map__127470 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127467,(1),null);
var map__127470__$1 = cljs.core.__destructure_map(map__127470);
var m = map__127470__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127470__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var user_binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127470__$1,new cljs.core.Keyword(null,"user-binding","user-binding",851596332));
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
var keystroke_SINGLEQUOTE_ = (function (){var G__127471 = frontend.modules.shortcut.utils.safe_parse_string_binding(keystroke);
if((G__127471 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127471);
}
})();
if(cljs.core.sequential_QMARK_(binding_SINGLEQUOTE_)){
return cljs.core.some(((function (binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127241_SHARP_){
var temp__5804__auto____$2 = (function (){var G__127472 = p1__127241_SHARP_;
var G__127472__$1 = (((G__127472 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__127472));
var G__127472__$2 = (((G__127472__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__127472__$1));
if((G__127472__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__127472__$2);
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
});})(binding_SINGLEQUOTE_,keystroke_SINGLEQUOTE_,and__5000__auto____$1,and__5000__auto__,or__5002__auto__,binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?daiquiri.core.create_element("li",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),'className':"flex items-center justify-between text-sm"},[(function (){var attrs127428 = label;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs127428))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["label-wrap"], null)], null),attrs127428], 0))):{'className':"label-wrap"}),((cljs.core.map_QMARK_(attrs127428))?null:[daiquiri.interpreter.interpret(attrs127428)]));
})(),daiquiri.core.create_element("a",{'onClick':(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(disabled_QMARK_));
} else {
return and__5000__auto__;
}
})())?((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (){
return frontend.components.shortcut.open_customize_shortcut_dialog_BANG_(id);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
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
})())?(function (){var attrs127429 = ((unset_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","unset","keymap/unset",629799647)], 0)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","custom","keymap/custom",1357129701)], 0))),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((disabled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0)):cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127247_SHARP_){
if(p1__127247_SHARP_ === false){
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0));
} else {
return frontend.modules.shortcut.utils.decorate_binding(p1__127247_SHARP_);
}
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,user_binding__$1))))].join(''));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127429))?daiquiri.interpreter.element_attributes(attrs127429):null),((cljs.core.map_QMARK_(attrs127429))?null:[daiquiri.interpreter.interpret(attrs127429)]));
})():(((!(unset_QMARK_)))?(function (){var attrs127430 = logseq.shui.ui.shortcut(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_){
return (function (p1__127248_SHARP_){
return frontend.modules.shortcut.data_helper.binding_for_display(id,p1__127248_SHARP_);
});})(binding__$1,user_binding__$1,label,custom_QMARK_,disabled_QMARK_,unset_QMARK_,vec__127467,id,map__127470,map__127470__$1,m,binding,user_binding,s__127458__$2,temp__5804__auto____$1,attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
,binding__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true], null));
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs127430))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","bg-transparent"], null)], null),attrs127430], 0))):{'className':"flex items-center bg-transparent"}),((cljs.core.map_QMARK_(attrs127430))?null:[daiquiri.interpreter.interpret(attrs127430)]));
})():null))])]):null):null),frontend$components$shortcut$iter__127391_$_iter__127457(cljs.core.rest(s__127458__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(attrs127390,folded_QMARK_,vec__127437,c,binding_map,s__127392__$2,temp__5804__auto__,attrs127283,_,___$1,vec__127249,ready_QMARK_,set_ready_BANG_,vec__127252,filters,set_filters_BANG_,vec__127255,keystroke,set_keystroke_BANG_,vec__127258,q,set_q_BANG_,categories_list_map,all_categories,in_filters_QMARK_,in_query_QMARK_,in_keystroke_QMARK_,vec__127261,folded_categories,set_folded_categories_BANG_,matched_list_map,result_list_map,toggle_categories_BANG_))
;
return iter__5480__auto__(binding_map);
})()):null)]));
})(),frontend$components$shortcut$iter__127391(cljs.core.rest(s__127392__$2)));
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
