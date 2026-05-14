goog.provide('frontend.ui');
goog.scope(function(){
  frontend.ui.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$emoji_mart$data$sets$14$native_json=shadow.js.require("module$node_modules$$emoji_mart$data$sets$14$native_json", {});
var module$node_modules$$logseq$react_tweet_embed$dist$tweet_embed=shadow.js.require("module$node_modules$$logseq$react_tweet_embed$dist$tweet_embed", {});
var module$node_modules$emoji_mart$dist$main=shadow.js.require("module$node_modules$emoji_mart$dist$main", {});
var module$node_modules$react_intersection_observer$dist$index=shadow.js.require("module$node_modules$react_intersection_observer$dist$index", {});
var module$node_modules$react_textarea_autosize$dist$react_textarea_autosize_browser_cjs=shadow.js.require("module$node_modules$react_textarea_autosize$dist$react_textarea_autosize_browser_cjs", {});
var module$node_modules$react_transition_group$cjs$index=shadow.js.require("module$node_modules$react_transition_group$cjs$index", {});
var module$node_modules$react_virtuoso$dist$index_cjs=shadow.js.require("module$node_modules$react_virtuoso$dist$index_cjs", {});
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.transition_group !== 'undefined')){
} else {
frontend.ui.transition_group = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_transition_group$cjs$index.TransitionGroup);
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.css_transition !== 'undefined')){
} else {
frontend.ui.css_transition = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_transition_group$cjs$index.CSSTransition);
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.textarea !== 'undefined')){
} else {
frontend.ui.textarea = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(frontend.ui.goog$module$goog$object.get(module$node_modules$react_textarea_autosize$dist$react_textarea_autosize_browser_cjs,"default"));
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.virtualized_list !== 'undefined')){
} else {
frontend.ui.virtualized_list = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_virtuoso$dist$index_cjs.Virtuoso);
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.virtualized_grid !== 'undefined')){
} else {
frontend.ui.virtualized_grid = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_virtuoso$dist$index_cjs.VirtuosoGrid);
}
frontend.ui.ReactTweetEmbed = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$$logseq$react_tweet_embed$dist$tweet_embed);
frontend.ui.useInView = frontend.ui.goog$module$goog$object.get(module$node_modules$react_intersection_observer$dist$index,"useInView");
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui._emoji_init_data !== 'undefined')){
} else {
frontend.ui._emoji_init_data = (function (){var G__106138 = ({"data": module$node_modules$$emoji_mart$data$sets$14$native_json});
var fexpr__106137 = frontend.ui.goog$module$goog$object.get(module$node_modules$emoji_mart$dist$main,"init");
return (fexpr__106137.cljs$core$IFn$_invoke$arity$1 ? fexpr__106137.cljs$core$IFn$_invoke$arity$1(G__106138) : fexpr__106137.call(null,G__106138));
})();
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.icon_size !== 'undefined')){
} else {
frontend.ui.icon_size = (cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?(26):(20));
}
frontend.ui.shui_popups_QMARK_ = (function frontend$ui$shui_popups_QMARK_(){
var G__106159 = logseq.shui.popup.core.get_popups();
var G__106159__$1 = (((G__106159 == null))?null:cljs.core.count(G__106159));
if((G__106159__$1 == null)){
return null;
} else {
return (G__106159__$1 > (0));
}
});
frontend.ui.last_shui_preview_popup_QMARK_ = (function frontend$ui$last_shui_preview_popup_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ls-preview-popup",(function (){var G__106179 = logseq.shui.popup.core.get_last_popup();
var G__106179__$1 = (((G__106179 == null))?null:new cljs.core.Keyword(null,"content-props","content-props",687449284).cljs$core$IFn$_invoke$arity$1(G__106179));
if((G__106179__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(G__106179__$1);
}
})());
});
frontend.ui.hide_popups_until_preview_popup_BANG_ = (function frontend$ui$hide_popups_until_preview_popup_BANG_(){
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.ui.shui_popups_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.ui.last_shui_preview_popup_QMARK_()));
} else {
return and__5000__auto__;
}
})())){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

continue;
} else {
return null;
}
break;
}
});
frontend.ui.built_in_colors = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["yellow","red","pink","green","blue","purple","gray"], null);
frontend.ui.__GT_block_background_color = (function frontend$ui$__GT_block_background_color(color){
if(cljs.core.truth_(cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([color]),frontend.ui.built_in_colors))){
return ["var(--ls-highlight-color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),")"].join('');
} else {
return color;
}
});
frontend.ui.built_in_color_QMARK_ = (function frontend$ui$built_in_color_QMARK_(color){
return cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([color]),frontend.ui.built_in_colors);
});
frontend.ui.menu_background_color = rum.core.lazy_build(rum.core.build_defc,(function (add_bgcolor_fn,rm_bgcolor_fn){
return daiquiri.core.create_element("div",{'className':"flex flex-row justify-between py-1 px-2 items-center"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between flex-1 mx-2 mt-2"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106184(s__106185){
return (new cljs.core.LazySeq(null,(function (){
var s__106185__$1 = s__106185;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106185__$1);
if(temp__5804__auto__){
var s__106185__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106185__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106185__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106187 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106186 = (0);
while(true){
if((i__106186 < size__5479__auto__)){
var color = cljs.core._nth(c__5478__auto__,i__106186);
cljs.core.chunk_append(b__106187,daiquiri.core.create_element("a",{'key':["key-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color)].join(''),'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("color",color)], 0)),'onClick':((function (i__106186,color,c__5478__auto__,size__5479__auto__,b__106187,s__106185__$2,temp__5804__auto__){
return (function (){
return (add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1 ? add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1(color) : add_bgcolor_fn.call(null,color));
});})(i__106186,color,c__5478__auto__,size__5479__auto__,b__106187,s__106185__$2,temp__5804__auto__))
},[daiquiri.core.create_element("div",{'style':{'backgroundColor':["var(--color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"-500)"].join('')},'className':"heading-bg"},[])]));

var G__106758 = (i__106186 + (1));
i__106186 = G__106758;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106187),frontend$ui$iter__106184(cljs.core.chunk_rest(s__106185__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106187),null);
}
} else {
var color = cljs.core.first(s__106185__$2);
return cljs.core.cons(daiquiri.core.create_element("a",{'key':["key-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color)].join(''),'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("color",color)], 0)),'onClick':((function (color,s__106185__$2,temp__5804__auto__){
return (function (){
return (add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1 ? add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1(color) : add_bgcolor_fn.call(null,color));
});})(color,s__106185__$2,temp__5804__auto__))
},[daiquiri.core.create_element("div",{'style':{'backgroundColor':["var(--color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"-500)"].join('')},'className':"heading-bg"},[])]),frontend$ui$iter__106184(cljs.core.rest(s__106185__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.ui.built_in_colors);
})()),daiquiri.core.create_element("a",{'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"remove-background","remove-background",291795686)], 0)),'onClick':rm_bgcolor_fn},[daiquiri.core.create_element("div",{'className':"heading-bg remove"},["-"])])])]);
}),null,"frontend.ui/menu-background-color");
frontend.ui.ls_textarea = rum.core.lazy_build(rum.core.build_defc,(function (p__106191){
var map__106192 = p__106191;
var map__106192__$1 = cljs.core.__destructure_map(map__106192);
var props = map__106192__$1;
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106192__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var skip_composition_QMARK_ = frontend.state.sub(new cljs.core.Keyword("editor","action","editor/action",449993861));
var on_composition = (function (e){
if(cljs.core.truth_(skip_composition_QMARK_)){
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(e) : on_change.call(null,e));
} else {
var G__106193 = e.type;
switch (G__106193) {
case "compositionend":
frontend.state.set_editor_in_composition_BANG_(false);

return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(e) : on_change.call(null,e));

break;
default:
return frontend.state.set_editor_in_composition_BANG_(true);

}
}
});
var props__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(props,"data-testid","block editor",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
if(cljs.core.truth_(frontend.state.editor_in_composition_QMARK_())){
return null;
} else {
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(e) : on_change.call(null,e));
}
}),new cljs.core.Keyword(null,"on-composition-start","on-composition-start",-1518620253),on_composition,new cljs.core.Keyword(null,"on-composition-update","on-composition-update",-337521083),on_composition,new cljs.core.Keyword(null,"on-composition-end","on-composition-end",581757376),on_composition], 0));
return daiquiri.interpreter.interpret((frontend.ui.textarea.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.textarea.cljs$core$IFn$_invoke$arity$1(props__$1) : frontend.ui.textarea.call(null,props__$1)));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var el_106771 = rum.core.dom_node(state);
var _STAR_mouse_point_106772 = cljs.core.volatile_BANG_(null);
var G__106194_106773 = el_106771;
G__106194_106773.addEventListener("select",(function (){
var start = frontend.util.get_selection_start(el_106771);
var end = frontend.util.get_selection_end(el_106771);
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(start,end);
if(and__5000__auto__){
var caret_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(el_106771);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"caret","caret",-1275001854),caret_pos,new cljs.core.Keyword(null,"start","start",-355208981),start,new cljs.core.Keyword(null,"end","end",-268185958),end,new cljs.core.Keyword(null,"text","text",-1790561697),el_106771.value.substring(start,end),new cljs.core.Keyword(null,"point","point",1813198264),cljs.core.select_keys((function (){var or__5002__auto__ = cljs.core.deref(_STAR_mouse_point_106772);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return caret_pos;
}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null))], null);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"input-selection-end","input-selection-end",214372173),cljs_bean.core.__GT_js(e));

return cljs.core.vreset_BANG_(_STAR_mouse_point_106772,null);
} else {
return null;
}
} else {
return null;
}
}));

G__106194_106773.addEventListener("mouseup",(function (p1__106190_SHARP_){
return cljs.core.vreset_BANG_(_STAR_mouse_point_106772,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),p1__106190_SHARP_.x,new cljs.core.Keyword(null,"y","y",-1757859776),p1__106190_SHARP_.y], null));
}));


return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___106774 = new cljs.core.Keyword(null,"on-unmount","on-unmount",245689269).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(temp__5804__auto___106774)){
var on_unmount_106775 = temp__5804__auto___106774;
(on_unmount_106775.cljs$core$IFn$_invoke$arity$0 ? on_unmount_106775.cljs$core$IFn$_invoke$arity$0() : on_unmount_106775.call(null));
} else {
}

return state;
})], null)], null),"frontend.ui/ls-textarea");
frontend.ui.dropdown_content_wrapper = rum.core.lazy_build(rum.core.build_defc,(function (dropdown_state,_close_fn,content,class$,style_opts){
var class$__$1 = (function (){var or__5002__auto__ = class$;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.hiccup__GT_class("origin-top-right.absolute.right-0.mt-2");
}
})();
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(style_opts),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["dropdown-wrapper","max-h-screen","overflow-y-auto",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$__$1)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__106197 = dropdown_state;
switch (G__106197) {
case "entering":
return "transition ease-out duration-100 transform opacity-0 scale-95";

break;
case "entered":
return "transition ease-out duration-100 transform opacity-100 scale-100";

break;
case "exiting":
return "transition ease-in duration-75 transform opacity-100 scale-100";

break;
case "exited":
return "transition ease-in duration-75 transform opacity-0 scale-95";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106197)].join('')));

}
})())].join('')], null))},[daiquiri.interpreter.interpret(content)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var k = (cljs.core.count(frontend.state.sub(new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881))) + (1));
var args = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881),k], null),cljs.core.second(args));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","k","frontend.ui/k",-230439489),k);
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.update_state_BANG_(new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881),(function (p1__106195_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__106195_SHARP_,new cljs.core.Keyword("frontend.ui","k","frontend.ui/k",-230439489).cljs$core$IFn$_invoke$arity$1(state));
}));

return state;
})], null)], null),"frontend.ui/dropdown-content-wrapper");
frontend.ui.dropdown = rum.core.lazy_build(rum.core.build_defcs,(function() { 
var G__106778__delegate = function (state,content_fn,modal_content_fn,p__106198){
var vec__106199 = p__106198;
var map__106202 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106199,(0),null);
var map__106202__$1 = cljs.core.__destructure_map(map__106202);
var modal_class = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106202__$1,new cljs.core.Keyword(null,"modal-class","modal-class",226435127));
var z_index = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106202__$1,new cljs.core.Keyword(null,"z-index","z-index",1892827090),(999));
var trigger_class = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106202__$1,new cljs.core.Keyword(null,"trigger-class","trigger-class",1251717016));
var _initial_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106202__$1,new cljs.core.Keyword(null,"_initial-open?","_initial-open?",-937885738));
var _STAR_toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106202__$1,new cljs.core.Keyword(null,"*toggle-fn","*toggle-fn",458369769));
var _on_toggle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106202__$1,new cljs.core.Keyword(null,"_on-toggle","_on-toggle",847598975));
var map__106203 = state;
var map__106203__$1 = cljs.core.__destructure_map(map__106203);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106203__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.atom_QMARK_(_STAR_toggle_fn);
if(and__5000__auto__){
var and__5000__auto____$1 = (cljs.core.deref(_STAR_toggle_fn) == null);
if(and__5000__auto____$1){
return new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425).cljs$core$IFn$_invoke$arity$1(state);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.reset_BANG_(_STAR_toggle_fn,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425).cljs$core$IFn$_invoke$arity$1(state)):null);
var modal_content = (modal_content_fn.cljs$core$IFn$_invoke$arity$1 ? modal_content_fn.cljs$core$IFn$_invoke$arity$1(state) : modal_content_fn.call(null,state));
var close_fn = new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative","ui__dropdown-trigger",trigger_class], null))},[daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$1 ? content_fn.cljs$core$IFn$_invoke$arity$1(state) : content_fn.call(null,state))),daiquiri.interpreter.interpret((function (){var G__106206 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"in","in",-1531184865),cljs.core.deref(open_QMARK_),new cljs.core.Keyword(null,"timeout","timeout",-318625318),(0)], null);
var G__106207 = (function (dropdown_state){
if(cljs.core.truth_(cljs.core.deref(open_QMARK_))){
return frontend.ui.dropdown_content_wrapper(dropdown_state,close_fn,modal_content,modal_class,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),z_index], null));
} else {
return null;
}
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__106206,G__106207) : frontend.ui.css_transition.call(null,G__106206,G__106207));
})())]);
};
var G__106778 = function (state,content_fn,modal_content_fn,var_args){
var p__106198 = null;
if (arguments.length > 3) {
var G__106783__i = 0, G__106783__a = new Array(arguments.length -  3);
while (G__106783__i < G__106783__a.length) {G__106783__a[G__106783__i] = arguments[G__106783__i + 3]; ++G__106783__i;}
  p__106198 = new cljs.core.IndexedSeq(G__106783__a,0,null);
} 
return G__106778__delegate.call(this,state,content_fn,modal_content_fn,p__106198);};
G__106778.cljs$lang$maxFixedArity = 3;
G__106778.cljs$lang$applyTo = (function (arglist__106784){
var state = cljs.core.first(arglist__106784);
arglist__106784 = cljs.core.next(arglist__106784);
var content_fn = cljs.core.first(arglist__106784);
arglist__106784 = cljs.core.next(arglist__106784);
var modal_content_fn = cljs.core.first(arglist__106784);
var p__106198 = cljs.core.rest(arglist__106784);
return G__106778__delegate(state,content_fn,modal_content_fn,p__106198);
});
G__106778.cljs$core$IFn$_invoke$arity$variadic = G__106778__delegate;
return G__106778;
})()
,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.mixins.modal(new cljs.core.Keyword(null,"open?","open?",1238443125)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var opts_106785 = ((cljs.core.map_QMARK_(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))?cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)):cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.vec,cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))));
if(cljs.core.truth_(new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108).cljs$core$IFn$_invoke$arity$1(opts_106785))){
cljs.core.reset_BANG_(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state),true);
} else {
}

var on_toggle_106786 = new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774).cljs$core$IFn$_invoke$arity$1(opts_106785);
if(cljs.core.fn_QMARK_(on_toggle_106786)){
cljs.core.add_watch(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword("frontend.ui","listen-open-value","frontend.ui/listen-open-value",-184395002),(function (_,___$1,___$2,___$3){
var G__106208 = cljs.core.deref(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state));
return (on_toggle_106786.cljs$core$IFn$_invoke$arity$1 ? on_toggle_106786.cljs$core$IFn$_invoke$arity$1(G__106208) : on_toggle_106786.call(null,G__106208));
}));
} else {
}

return state;
})], null)], null),"frontend.ui/dropdown");
frontend.ui.render_keyboard_shortcut = (function frontend$ui$render_keyboard_shortcut(var_args){
var args__5732__auto__ = [];
var len__5726__auto___106788 = arguments.length;
var i__5727__auto___106789 = (0);
while(true){
if((i__5727__auto___106789 < len__5726__auto___106788)){
args__5732__auto__.push((arguments[i__5727__auto___106789]));

var G__106790 = (i__5727__auto___106789 + (1));
i__5727__auto___106789 = G__106790;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic = (function (sequence,p__106211){
var map__106212 = p__106211;
var map__106212__$1 = cljs.core.__destructure_map(map__106212);
var opts = map__106212__$1;
var sequence__$1 = ((typeof sequence === 'string')?clojure.string.split.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(clojure.string.trim(sequence)),/ /):sequence);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut","span.keyboard-shortcut",-1239684213),logseq.shui.ui.shortcut(sequence__$1,opts)], null);
}));

(frontend.ui.render_keyboard_shortcut.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.ui.render_keyboard_shortcut.cljs$lang$applyTo = (function (seq106209){
var G__106210 = cljs.core.first(seq106209);
var seq106209__$1 = cljs.core.next(seq106209);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__106210,seq106209__$1);
}));

frontend.ui.menu_link = rum.core.lazy_build(rum.core.build_defc,(function (p__106213,child){
var map__106214 = p__106213;
var map__106214__$1 = cljs.core.__destructure_map(map__106214);
var options = map__106214__$1;
var only_child_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106214__$1,new cljs.core.Keyword(null,"only-child?","only-child?",1700034724));
var no_padding_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106214__$1,new cljs.core.Keyword(null,"no-padding?","no-padding?",1618158522));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106214__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106214__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
if(cljs.core.truth_(only_child_QMARK_)){
var attrs106215 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.Keyword(null,"only-child?","only-child?",1700034724));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106215))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["menu-link"], null)], null),attrs106215], 0))):{'className':"menu-link"}),((cljs.core.map_QMARK_(attrs106215))?[daiquiri.interpreter.interpret(child)]:[daiquiri.interpreter.interpret(attrs106215),daiquiri.interpreter.interpret(child)]));
} else {
var attrs106218 = (function (){var G__106223 = options;
var G__106223__$1 = ((no_padding_QMARK_ === true)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106223,new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)," no-padding"].join('')):G__106223);
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__106223__$1,new cljs.core.Keyword(null,"no-padding?","no-padding?",1618158522));

})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs106218))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-between","menu-link"], null)], null),attrs106218], 0))):{'className':"flex justify-between menu-link"}),((cljs.core.map_QMARK_(attrs106218))?[(function (){var attrs106219 = child;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106219))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs106219], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs106219))?null:[daiquiri.interpreter.interpret(attrs106219)]));
})(),(cljs.core.truth_(shortcut)?(function (){var attrs106220 = frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),false], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106220))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs106220], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs106220))?null:[daiquiri.interpreter.interpret(attrs106220)]));
})():null)]:[daiquiri.interpreter.interpret(attrs106218),(function (){var attrs106221 = child;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106221))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs106221], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs106221))?null:[daiquiri.interpreter.interpret(attrs106221)]));
})(),(cljs.core.truth_(shortcut)?(function (){var attrs106222 = frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),false], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106222))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs106222], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs106222))?null:[daiquiri.interpreter.interpret(attrs106222)]));
})():null)]));
}
}),null,"frontend.ui/menu-link");
frontend.ui.dropdown_with_links = rum.core.lazy_build(rum.core.build_defc,(function (content_fn,links,p__106224){
var map__106225 = p__106224;
var map__106225__$1 = cljs.core.__destructure_map(map__106225);
var opts = map__106225__$1;
var outer_header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106225__$1,new cljs.core.Keyword(null,"outer-header","outer-header",-1732961785));
var outer_footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106225__$1,new cljs.core.Keyword(null,"outer-footer","outer-footer",1884321739));
var links_header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106225__$1,new cljs.core.Keyword(null,"links-header","links-header",-1729119536));
var links_footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106225__$1,new cljs.core.Keyword(null,"links-footer","links-footer",1890937614));
return frontend.ui.dropdown(content_fn,(function (p__106236){
var map__106237 = p__106236;
var map__106237__$1 = cljs.core.__destructure_map(map__106237);
var close_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106237__$1,new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512));
var links_children = (function (){var links__$1 = ((cljs.core.fn_QMARK_(links))?(links.cljs$core$IFn$_invoke$arity$0 ? links.cljs$core$IFn$_invoke$arity$0() : links.call(null)):links);
var links__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,links__$1);
var iter__5480__auto__ = (function frontend$ui$iter__106238(s__106239){
return (new cljs.core.LazySeq(null,(function (){
var s__106239__$1 = s__106239;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106239__$1);
if(temp__5804__auto__){
var s__106239__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106239__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106239__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106241 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106240 = (0);
while(true){
if((i__106240 < size__5479__auto__)){
var map__106242 = cljs.core._nth(c__5478__auto__,i__106240);
var map__106242__$1 = cljs.core.__destructure_map(map__106242);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"options","options",99638489));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"title","title",636505583));
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"item","item",249373802));
var _as_link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106242__$1,new cljs.core.Keyword(null,"_as-link?","_as-link?",-2015408331));
cljs.core.chunk_append(b__106241,(function (){var new_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,(function (){var G__106243 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),hover_detail,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__106240,map__106242,map__106242__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,c__5478__auto__,size__5479__auto__,b__106241,s__106239__$2,temp__5804__auto__,links__$1,links__$2,map__106237,map__106237__$1,close_fn,map__106225,map__106225__$1,opts,outer_header,outer_footer,links_header,links_footer){
return (function (e){
if((function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(temp__5804__auto____$1)){
var on_click_fn = temp__5804__auto____$1;
return (on_click_fn.cljs$core$IFn$_invoke$arity$1 ? on_click_fn.cljs$core$IFn$_invoke$arity$1(e) : on_click_fn.call(null,e));
} else {
return null;
}
})() === false){
return null;
} else {
return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
}
});})(i__106240,map__106242,map__106242__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,c__5478__auto__,size__5479__auto__,b__106241,s__106239__$2,temp__5804__auto__,links__$1,links__$2,map__106237,map__106237__$1,close_fn,map__106225,map__106225__$1,opts,outer_header,outer_footer,links_header,links_footer))
], null);
if(cljs.core.truth_(key)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106243,new cljs.core.Keyword(null,"key","key",-1516042587),key);
} else {
return G__106243;
}
})()], 0));
var child = (cljs.core.truth_(hr)?null:(function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),(cljs.core.truth_(icon_SINGLEQUOTE_)?icon_SINGLEQUOTE_:null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.title-wrap","div.title-wrap",456162205),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),"8px",new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),"4px"], null)], null),title], null)], null);
}
})());
if(cljs.core.truth_(hr)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.menu-separator","hr.menu-separator",-527266614),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),(function (){var or__5002__auto__ = key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "dropdown-hr";
}
})()], null)], null);
} else {
return rum.core.with_key(frontend.ui.menu_link(new_options,child),title);
}
})());

var G__106804 = (i__106240 + (1));
i__106240 = G__106804;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106241),frontend$ui$iter__106238(cljs.core.chunk_rest(s__106239__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106241),null);
}
} else {
var map__106244 = cljs.core.first(s__106239__$2);
var map__106244__$1 = cljs.core.__destructure_map(map__106244);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"options","options",99638489));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"title","title",636505583));
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"item","item",249373802));
var _as_link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106244__$1,new cljs.core.Keyword(null,"_as-link?","_as-link?",-2015408331));
return cljs.core.cons((function (){var new_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,(function (){var G__106245 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),hover_detail,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__106244,map__106244__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,s__106239__$2,temp__5804__auto__,links__$1,links__$2,map__106237,map__106237__$1,close_fn,map__106225,map__106225__$1,opts,outer_header,outer_footer,links_header,links_footer){
return (function (e){
if((function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(temp__5804__auto____$1)){
var on_click_fn = temp__5804__auto____$1;
return (on_click_fn.cljs$core$IFn$_invoke$arity$1 ? on_click_fn.cljs$core$IFn$_invoke$arity$1(e) : on_click_fn.call(null,e));
} else {
return null;
}
})() === false){
return null;
} else {
return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
}
});})(map__106244,map__106244__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,s__106239__$2,temp__5804__auto__,links__$1,links__$2,map__106237,map__106237__$1,close_fn,map__106225,map__106225__$1,opts,outer_header,outer_footer,links_header,links_footer))
], null);
if(cljs.core.truth_(key)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106245,new cljs.core.Keyword(null,"key","key",-1516042587),key);
} else {
return G__106245;
}
})()], 0));
var child = (cljs.core.truth_(hr)?null:(function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),(cljs.core.truth_(icon_SINGLEQUOTE_)?icon_SINGLEQUOTE_:null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.title-wrap","div.title-wrap",456162205),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),"8px",new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),"4px"], null)], null),title], null)], null);
}
})());
if(cljs.core.truth_(hr)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.menu-separator","hr.menu-separator",-527266614),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),(function (){var or__5002__auto__ = key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "dropdown-hr";
}
})()], null)], null);
} else {
return rum.core.with_key(frontend.ui.menu_link(new_options,child),title);
}
})(),frontend$ui$iter__106238(cljs.core.rest(s__106239__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(links__$2);
})();
var wrapper_children = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".menu-links-wrapper",".menu-links-wrapper",202541467),(cljs.core.truth_(links_header)?links_header:null),links_children,(cljs.core.truth_(links_footer)?links_footer:null)], null);
if(cljs.core.truth_((function (){var or__5002__auto__ = outer_header;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return outer_footer;
}
})())){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".menu-links-outer",".menu-links-outer",-2127780108),outer_header,wrapper_children,outer_footer], null);
} else {
return wrapper_children;
}
}),opts);
}),null,"frontend.ui/dropdown-with-links");
frontend.ui.notification_content = rum.core.lazy_build(rum.core.build_defc,(function (state,content,status,uid){
if(cljs.core.truth_((function (){var and__5000__auto__ = content;
if(cljs.core.truth_(and__5000__auto__)){
return status;
} else {
return and__5000__auto__;
}
})())){
var svg = (((status instanceof cljs.core.Keyword))?(function (){var G__106246 = status;
var G__106246__$1 = (((G__106246 instanceof cljs.core.Keyword))?G__106246.fqn:null);
switch (G__106246__$1) {
case "success":
var G__106247 = "circle-check";
var G__106248 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-success",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__106247,G__106248) : frontend.ui.icon.call(null,G__106247,G__106248));

break;
case "warning":
var G__106249 = "alert-circle";
var G__106250 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-warning",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__106249,G__106250) : frontend.ui.icon.call(null,G__106249,G__106250));

break;
case "error":
var G__106251 = "circle-x";
var G__106252 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-error",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__106251,G__106252) : frontend.ui.icon.call(null,G__106251,G__106252));

break;
default:
var G__106253 = "info-circle";
var G__106254 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-indigo-500",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__106253,G__106254) : frontend.ui.icon.call(null,G__106253,G__106254));

}
})():status);
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exiting")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exited"))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),(-1)], null):null)),'className':"ui__notifications-content"},[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["max-w-sm","w-full","shadow-lg","rounded-lg","pointer-events-auto","notification-area",(function (){var G__106255 = state;
switch (G__106255) {
case "entering":
return "transition ease-out duration-300 transform opacity-0 translate-y-2 sm:translate-x-0";

break;
case "entered":
return "transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0";

break;
case "exiting":
return "transition ease-in duration-100 opacity-100";

break;
case "exited":
return "transition ease-in duration-100 opacity-0";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106255)].join('')));

}
})()], null))},[daiquiri.core.create_element("div",{'style':{'maxHeight':"calc(100vh - 200px)",'overflowY':"auto",'overflowX':"hidden"},'className':"rounded-lg shadow-xs"},[daiquiri.core.create_element("div",{'className':"p-4"},[daiquiri.core.create_element("div",{'className':"flex items-start"},[(function (){var attrs106256 = svg;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106256))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-shrink-0","pt-2"], null)], null),attrs106256], 0))):{'className':"flex-shrink-0 pt-2"}),((cljs.core.map_QMARK_(attrs106256))?null:[daiquiri.interpreter.interpret(attrs106256)]));
})(),daiquiri.core.create_element("div",{'className':"ml-3 w-0 flex-1 pt-2"},[daiquiri.core.create_element("div",{'style':{'margin':(0)},'className':"text-sm leading-5 font-medium whitespace-pre-line"},[daiquiri.interpreter.interpret(content)])]),daiquiri.core.create_element("div",{'style':{'marginTop':(-9),'marginRight':(-18)},'className':"flex-shrink-0 flex"},[daiquiri.interpreter.interpret((function (){var G__106258 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"button-props","button-props",-392655929),new cljs.core.PersistentArrayMap(null, 1, ["aria-label","Close"], null),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"hover:bg-transparent hover:text-foreground scale-90",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.notification.clear_BANG_(uid);
}),new cljs.core.Keyword(null,"icon","icon",1679606541),"x"], null);
return (frontend.ui.button.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.button.cljs$core$IFn$_invoke$arity$1(G__106258) : frontend.ui.button.call(null,G__106258));
})())])])])])])]);
} else {
return null;
}
}),null,"frontend.ui/notification-content");
frontend.ui.notification_clear_all = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"ui__notifications-content"},[(function (){var attrs106269 = (function (){var G__106270 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("notification","clear-all","notification/clear-all",-1229504749)], 0));
var G__106271 = new cljs.core.Keyword(null,"intent","intent",-390846953);
var G__106272 = "logseq";
var G__106273 = new cljs.core.Keyword(null,"on-click","on-click",1632826543);
var G__106274 = (function (){
return frontend.handler.notification.clear_all_BANG_();
});
return (frontend.ui.button.cljs$core$IFn$_invoke$arity$5 ? frontend.ui.button.cljs$core$IFn$_invoke$arity$5(G__106270,G__106271,G__106272,G__106273,G__106274) : frontend.ui.button.call(null,G__106270,G__106271,G__106272,G__106273,G__106274));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106269))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pointer-events-auto","notification-clear"], null)], null),attrs106269], 0))):{'className':"pointer-events-auto notification-clear"}),((cljs.core.map_QMARK_(attrs106269))?null:[daiquiri.interpreter.interpret(attrs106269)]));
})()]);
}),null,"frontend.ui/notification-clear-all");
frontend.ui.notification = rum.core.lazy_build(rum.core.build_defc,(function (){
var contents = frontend.state.sub(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618));
return daiquiri.interpreter.interpret((function (){var G__106281 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-name","class-name",945142584),"notifications ui__notifications"], null);
var G__106282 = (function (){var notifications = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (el){
var k = cljs.core.first(el);
var v = cljs.core.second(el);
var G__106283 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(k)], null);
var G__106284 = (function (state){
return frontend.ui.notification_content(state,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(v),k);
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__106283,G__106284) : frontend.ui.css_transition.call(null,G__106283,G__106284));
}),contents);
var clear_all = (((cljs.core.count(contents) > (1)))?(function (){var G__106285 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"k","k",-2146297393),"clear-all"], null);
var G__106286 = (function (_state){
return frontend.ui.notification_clear_all();
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__106285,G__106286) : frontend.ui.css_transition.call(null,G__106285,G__106286));
})():null);
var items = (cljs.core.truth_(clear_all)?cljs.core.cons(clear_all,notifications):notifications);
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(items);
})();
return (frontend.ui.transition_group.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.transition_group.cljs$core$IFn$_invoke$arity$2(G__106281,G__106282) : frontend.ui.transition_group.call(null,G__106281,G__106282));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.ui/notification");
frontend.ui.humanity_time_ago = rum.core.lazy_build(rum.core.build_defc,(function (input,opts){
var time_fn = (function (){
try{return frontend.util.human_time(input);
}catch (e106291){var e = e106291;
console.error(e);

return input;
}});
var vec__106288 = rum.core.use_state(time_fn());
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106288,(0),null);
var set_time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106288,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var timer = setInterval((function (){
var G__106292 = time_fn();
return (set_time.cljs$core$IFn$_invoke$arity$1 ? set_time.cljs$core$IFn$_invoke$arity$1(G__106292) : set_time.call(null,G__106292));
}),((1000) * (30)));
return (function (){
return clearInterval(timer);
});
}),cljs.core.PersistentVector.EMPTY);

var attrs106287 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY,opts], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106287))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__humanity-time"], null)], null),attrs106287], 0))):{'className':"ui__humanity-time"}),((cljs.core.map_QMARK_(attrs106287))?[daiquiri.interpreter.interpret(time)]:[daiquiri.interpreter.interpret(attrs106287),daiquiri.interpreter.interpret(time)]));
}),null,"frontend.ui/humanity-time-ago");
frontend.ui.checkbox = (function frontend$ui$checkbox(option){
var on_change_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-change","on-change",-732046149).cljs$core$IFn$_invoke$arity$1(option);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(option);
var option__$1 = (function (){var G__106293 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"on-change","on-change",-732046149),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543)], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = on_change_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return on_click_SINGLEQUOTE_;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106293,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__106294_106817 = on_click_SINGLEQUOTE_;
if((G__106294_106817 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__106294_106817,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}

var checked_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.target.dataset.state,"checked");
(e.target.checked = (!(checked_QMARK_)));

var G__106295 = on_change_SINGLEQUOTE_;
if((G__106295 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__106295,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}
}));
} else {
return G__106293;
}
})();
var G__106296 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"disabled","disabled",-1529784218).cljs$core$IFn$_invoke$arity$1(option__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.publishing_QMARK_;
}
})()], null)], 0));
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__106296) : logseq.shui.ui.checkbox.call(null,G__106296));
});
frontend.ui.main_node = (function frontend$ui$main_node(){
return goog.dom.getElement("main-content-container");
});
frontend.ui.focus_element = (function frontend$ui$focus_element(element){
var temp__5804__auto__ = goog.dom.getElement(element);
if(cljs.core.truth_(temp__5804__auto__)){
var element__$1 = temp__5804__auto__;
return element__$1.focus();
} else {
return null;
}
});
frontend.ui.get_dynamic_style_node = (function frontend$ui$get_dynamic_style_node(){
return document.getElementById("dynamic-style-scope");
});
frontend.ui.inject_document_devices_envs_BANG_ = (function frontend$ui$inject_document_devices_envs_BANG_(){
var cl = document.documentElement.classList;
if(frontend.config.publishing_QMARK_){
cl.add("is-publish-mode");
} else {
}

if(cljs.core.truth_(frontend.util.mac_QMARK_)){
cl.add("is-mac");
} else {
}

if(cljs.core.truth_(frontend.util.win32_QMARK_)){
cl.add("is-win32");
} else {
}

if(cljs.core.truth_(frontend.util.linux_QMARK_)){
cl.add("is-linux");
} else {
}

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
cl.add("is-electron");
} else {
}

if(cljs.core.truth_(frontend.util.ios_QMARK_())){
cl.add("is-ios");
} else {
}

if(cljs.core.truth_(frontend.util.mobile_QMARK_())){
cl.add("is-mobile");
} else {
}

if(cljs.core.truth_(frontend.util.safari_QMARK_())){
cl.add("is-safari");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
cl.add("is-native-ios");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())){
cl.add("is-native-android");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_iphone_QMARK_())){
cl.add("is-native-iphone");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_iphone_without_notch_QMARK_())){
cl.add("is-native-iphone-without-notch");
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ipad_QMARK_())){
cl.add("is-native-ipad");
} else {
}

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
var seq__106301_106820 = cljs.core.seq(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["persist-zoom-level",((function (cl){
return (function (p1__106297_SHARP_){
return frontend.storage.set(new cljs.core.Keyword(null,"zoom-level","zoom-level",-91022225),p1__106297_SHARP_);
});})(cl))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["restore-zoom-level",((function (cl){
return (function (){
var temp__5804__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"zoom-level","zoom-level",-91022225));
if(cljs.core.truth_(temp__5804__auto__)){
var zoom_level = temp__5804__auto__;
return window.apis.setZoomLevel(zoom_level);
} else {
return null;
}
});})(cl))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["full-screen",((function (cl){
return (function (p1__106298_SHARP_){
cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(cl,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__106298_SHARP_,"enter"))?"add":"remove"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["is-fullscreen"], 0));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-fullscreen?","electron/window-fullscreen?",-499490630),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__106298_SHARP_,"enter"));
});})(cl))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["maximize",((function (cl){
return (function (p1__106299_SHARP_){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-maximized?","electron/window-maximized?",-1905378935),p1__106299_SHARP_);
});})(cl))
], null)], null));
var chunk__106302_106821 = null;
var count__106303_106822 = (0);
var i__106304_106823 = (0);
while(true){
if((i__106304_106823 < count__106303_106822)){
var vec__106311_106824 = chunk__106302_106821.cljs$core$IIndexed$_nth$arity$2(null,i__106304_106823);
var event_106825 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106311_106824,(0),null);
var function_106826 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106311_106824,(1),null);
window.apis.on(event_106825,function_106826);


var G__106827 = seq__106301_106820;
var G__106828 = chunk__106302_106821;
var G__106829 = count__106303_106822;
var G__106830 = (i__106304_106823 + (1));
seq__106301_106820 = G__106827;
chunk__106302_106821 = G__106828;
count__106303_106822 = G__106829;
i__106304_106823 = G__106830;
continue;
} else {
var temp__5804__auto___106831 = cljs.core.seq(seq__106301_106820);
if(temp__5804__auto___106831){
var seq__106301_106832__$1 = temp__5804__auto___106831;
if(cljs.core.chunked_seq_QMARK_(seq__106301_106832__$1)){
var c__5525__auto___106833 = cljs.core.chunk_first(seq__106301_106832__$1);
var G__106834 = cljs.core.chunk_rest(seq__106301_106832__$1);
var G__106835 = c__5525__auto___106833;
var G__106836 = cljs.core.count(c__5525__auto___106833);
var G__106837 = (0);
seq__106301_106820 = G__106834;
chunk__106302_106821 = G__106835;
count__106303_106822 = G__106836;
i__106304_106823 = G__106837;
continue;
} else {
var vec__106314_106838 = cljs.core.first(seq__106301_106832__$1);
var event_106839 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106314_106838,(0),null);
var function_106840 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106314_106838,(1),null);
window.apis.on(event_106839,function_106840);


var G__106841 = cljs.core.next(seq__106301_106832__$1);
var G__106842 = null;
var G__106843 = (0);
var G__106844 = (0);
seq__106301_106820 = G__106841;
chunk__106302_106821 = G__106842;
count__106303_106822 = G__106843;
i__106304_106823 = G__106844;
continue;
}
} else {
}
}
break;
}

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"getAppBaseInfo","getAppBaseInfo",-1406218507)], 0)),(function (p1__106300_SHARP_){
var map__106317 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__106300_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var map__106317__$1 = cljs.core.__destructure_map(map__106317);
var isFullScreen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106317__$1,new cljs.core.Keyword(null,"isFullScreen","isFullScreen",-1879720011));
var isMaximized = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106317__$1,new cljs.core.Keyword(null,"isMaximized","isMaximized",-2003319926));
if(cljs.core.truth_(isFullScreen)){
cl.add("is-fullscreen");

frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-fullscreen?","electron/window-fullscreen?",-499490630),true);
} else {
}

if(cljs.core.truth_(isMaximized)){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-maximized?","electron/window-maximized?",-1905378935),true);
} else {
return null;
}
}));
} else {
return null;
}
});
frontend.ui.inject_dynamic_style_node_BANG_ = (function frontend$ui$inject_dynamic_style_node_BANG_(){
var style = frontend.ui.get_dynamic_style_node();
if((style == null)){
var node = document.createElement("style");
(node.id = "dynamic-style-scope");

return document.head.appendChild(node);
} else {
return style;
}
});
frontend.ui.apply_custom_theme_effect_BANG_ = (function frontend$ui$apply_custom_theme_effect_BANG_(theme){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
var temp__5804__auto__ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","custom-theme","ui/custom-theme",1944833347),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(theme)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var custom_theme = temp__5804__auto__;
if((!((new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(custom_theme) == null)))){
return LSPluginCore.selectTheme(cljs_bean.core.__GT_js(custom_theme),cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"emit","emit",-1327179018),false], null)));
} else {
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","selected-theme","plugin/selected-theme",-172679220),new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(custom_theme));
}
} else {
return null;
}
} else {
return null;
}
});
frontend.ui.setup_system_theme_effect_BANG_ = (function frontend$ui$setup_system_theme_effect_BANG_(){
var schemaMedia = window.matchMedia("(prefers-color-scheme: dark)");
try{schemaMedia.addEventListener("change",frontend.state.sync_system_theme_BANG_);
}catch (e106318){var _error_106847 = e106318;
schemaMedia.addListener(frontend.state.sync_system_theme_BANG_);
}
frontend.state.sync_system_theme_BANG_();

return (function (){
try{return schemaMedia.removeEventListener("change",frontend.state.sync_system_theme_BANG_);
}catch (e106319){var _error = e106319;
return schemaMedia.removeListener(frontend.state.sync_system_theme_BANG_);
}});
});
frontend.ui.set_global_active_keystroke = (function frontend$ui$set_global_active_keystroke(val){
return document.body.setAttribute("data-active-keystroke",val);
});
frontend.ui.setup_active_keystroke_BANG_ = (function frontend$ui$setup_active_keystroke_BANG_(){
var active_keystroke = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var heads = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"shift","shift",997140064),null,new cljs.core.Keyword(null,"meta","meta",1499536964),null,new cljs.core.Keyword(null,"alt","alt",-3214426),null,new cljs.core.Keyword(null,"control","control",1892578036),null], null), null);
var handle_global_keystroke = (function (down_QMARK_,e){
var handler_106851 = (cljs.core.truth_(down_QMARK_)?cljs.core.conj:cljs.core.disj);
var keystroke_106852 = e.key;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(active_keystroke,handler_106851,keystroke_106852);

if(cljs.core.contains_QMARK_(heads,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(e.key)))){
return frontend.ui.set_global_active_keystroke(clojure.string.join.cljs$core$IFn$_invoke$arity$2("+",cljs.core.deref(active_keystroke)));
} else {
return null;
}
});
var keydown_handler = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(handle_global_keystroke,true);
var keyup_handler = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(handle_global_keystroke,false);
var clear_all = (function (){
frontend.ui.set_global_active_keystroke("");

return cljs.core.reset_BANG_(active_keystroke,cljs.core.PersistentHashSet.EMPTY);
});
window.addEventListener("keydown",keydown_handler);

window.addEventListener("keyup",keyup_handler);

window.addEventListener("blur",clear_all);

window.addEventListener("visibilitychange",clear_all);

return (function (){
window.removeEventListener("keydown",keydown_handler);

window.removeEventListener("keyup",keyup_handler);

window.removeEventListener("blur",clear_all);

return window.removeEventListener("visibilitychange",clear_all);
});
});
frontend.ui.setup_viewport_listeners_BANG_ = (function frontend$ui$setup_viewport_listeners_BANG_(){
var temp__5804__auto__ = frontend.ui.goog$module$goog$object.get(window,"visualViewport");
if(cljs.core.truth_(temp__5804__auto__)){
var vw = temp__5804__auto__;
var handler = (function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","viewport","ui/viewport",443348007),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"width","width",-384071477),vw.width,new cljs.core.Keyword(null,"height","height",1025178622),vw.height,new cljs.core.Keyword(null,"scale","scale",-230427353),vw.scale], null));
});
window.visualViewport.addEventListener("resize",handler);

handler();

return (function (){
return window.visualViewport.removeEventListener("resize",handler);
});
} else {
return null;
}
});
frontend.ui.auto_complete = rum.core.lazy_build(rum.core.build_defcs,(function (state,matched,p__106321){
var map__106322 = p__106321;
var map__106322__$1 = cljs.core.__destructure_map(map__106322);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var on_shift_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"on-shift-chosen","on-shift-chosen",-310778328));
var get_group_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"get-group-name","get-group-name",-160379696));
var empty_placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085));
var item_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"item-render","item-render",253627868));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"header","header",119441134));
var grouped_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106322__$1,new cljs.core.Keyword(null,"grouped?","grouped?",531080948));
var _STAR_current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
var _STAR_groups = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var render_f = (function (matched__$1){
var iter__5480__auto__ = (function frontend$ui$iter__106323(s__106324){
return (new cljs.core.LazySeq(null,(function (){
var s__106324__$1 = s__106324;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106324__$1);
if(temp__5804__auto__){
var s__106324__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106324__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106324__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106326 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106325 = (0);
while(true){
if((i__106325 < size__5479__auto__)){
var vec__106331 = cljs.core._nth(c__5478__auto__,i__106325);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106331,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106331,(1),null);
cljs.core.chunk_append(b__106326,(function (){var react_key = cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx);
var item_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.menu-link-wrap","div.menu-link-wrap",2002705411),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),react_key,new cljs.core.Keyword(null,"on-mouse-move","on-mouse-move",-1386320874),((function (i__106325,react_key,vec__106331,idx,item,c__5478__auto__,size__5479__auto__,b__106326,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_current_idx,idx);
});})(i__106325,react_key,vec__106331,idx,item,c__5478__auto__,size__5479__auto__,b__106326,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(function (){var chosen_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_current_idx),idx);
return frontend.ui.menu_link(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),["ac-",react_key].join(''),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"class","class",-2030961996),((chosen_QMARK_)?"chosen":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__106325,chosen_QMARK_,react_key,vec__106331,idx,item,c__5478__auto__,size__5479__auto__,b__106326,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (e){
frontend.util.stop(e);

if(cljs.core.truth_(new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181).cljs$core$IFn$_invoke$arity$1(item))){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.ui.goog$module$goog$object.get(e,"shiftKey");
if(cljs.core.truth_(and__5000__auto__)){
return on_shift_chosen;
} else {
return and__5000__auto__;
}
})())){
return (on_shift_chosen.cljs$core$IFn$_invoke$arity$1 ? on_shift_chosen.cljs$core$IFn$_invoke$arity$1(item) : on_shift_chosen.call(null,item));
} else {
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(item,e) : on_chosen.call(null,item,e));
}
}
});})(i__106325,chosen_QMARK_,react_key,vec__106331,idx,item,c__5478__auto__,size__5479__auto__,b__106326,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(cljs.core.truth_(item_render)?(item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(item,chosen_QMARK_) : item_render.call(null,item,chosen_QMARK_)):item));
})()], null);
var group_name = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(get_group_name);
if(and__5000__auto__){
return (get_group_name.cljs$core$IFn$_invoke$arity$1 ? get_group_name.cljs$core$IFn$_invoke$arity$1(item) : get_group_name.call(null,item));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = group_name;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(cljs.core.deref(_STAR_groups),group_name)));
} else {
return and__5000__auto__;
}
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_groups,cljs.core.conj,group_name);

return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__ac-group-name","div.ui__ac-group-name",1988705321),group_name], null),item_cp], null);
} else {
return item_cp;
}
})());

var G__106877 = (i__106325 + (1));
i__106325 = G__106877;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106326),frontend$ui$iter__106323(cljs.core.chunk_rest(s__106324__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106326),null);
}
} else {
var vec__106334 = cljs.core.first(s__106324__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106334,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106334,(1),null);
return cljs.core.cons((function (){var react_key = cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx);
var item_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.menu-link-wrap","div.menu-link-wrap",2002705411),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),react_key,new cljs.core.Keyword(null,"on-mouse-move","on-mouse-move",-1386320874),((function (react_key,vec__106334,idx,item,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_current_idx,idx);
});})(react_key,vec__106334,idx,item,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(function (){var chosen_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_current_idx),idx);
return frontend.ui.menu_link(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),["ac-",react_key].join(''),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"class","class",-2030961996),((chosen_QMARK_)?"chosen":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (chosen_QMARK_,react_key,vec__106334,idx,item,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (e){
frontend.util.stop(e);

if(cljs.core.truth_(new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181).cljs$core$IFn$_invoke$arity$1(item))){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.ui.goog$module$goog$object.get(e,"shiftKey");
if(cljs.core.truth_(and__5000__auto__)){
return on_shift_chosen;
} else {
return and__5000__auto__;
}
})())){
return (on_shift_chosen.cljs$core$IFn$_invoke$arity$1 ? on_shift_chosen.cljs$core$IFn$_invoke$arity$1(item) : on_shift_chosen.call(null,item));
} else {
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(item,e) : on_chosen.call(null,item,e));
}
}
});})(chosen_QMARK_,react_key,vec__106334,idx,item,s__106324__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(cljs.core.truth_(item_render)?(item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(item,chosen_QMARK_) : item_render.call(null,item,chosen_QMARK_)):item));
})()], null);
var group_name = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(get_group_name);
if(and__5000__auto__){
return (get_group_name.cljs$core$IFn$_invoke$arity$1 ? get_group_name.cljs$core$IFn$_invoke$arity$1(item) : get_group_name.call(null,item));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = group_name;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(cljs.core.deref(_STAR_groups),group_name)));
} else {
return and__5000__auto__;
}
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_groups,cljs.core.conj,group_name);

return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__ac-group-name","div.ui__ac-group-name",1988705321),group_name], null),item_cp], null);
} else {
return item_cp;
}
})(),frontend$ui$iter__106323(cljs.core.rest(s__106324__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(matched__$1);
});
return daiquiri.core.create_element("div",{'id':"ui__ac",'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$], null))},[((cljs.core.seq(matched))?(function (){var attrs106352 = (cljs.core.truth_(header)?header:null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106352))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"ui__ac-inner",new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["hide-scrollbar"], null)], null),attrs106352], 0))):{'id':"ui__ac-inner",'className':"hide-scrollbar"}),((cljs.core.map_QMARK_(attrs106352))?[(cljs.core.truth_(grouped_QMARK_)?(function (){var _STAR_idx = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1));
var inc_idx = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_idx,cljs.core.inc);
});
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106353(s__106354){
return (new cljs.core.LazySeq(null,(function (){
var s__106354__$1 = s__106354;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106354__$1);
if(temp__5804__auto__){
var s__106354__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106354__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106354__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106356 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106355 = (0);
while(true){
if((i__106355 < size__5479__auto__)){
var vec__106357 = cljs.core._nth(c__5478__auto__,i__106355);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106357,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106357,(1),null);
cljs.core.chunk_append(b__106356,(function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__106355,vec__106357,group,matched__$1,c__5478__auto__,size__5479__auto__,b__106356,s__106354__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(i__106355,vec__106357,group,matched__$1,c__5478__auto__,size__5479__auto__,b__106356,s__106354__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs106360 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106360))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs106360], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs106360))?null:[daiquiri.interpreter.interpret(attrs106360)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})());

var G__106892 = (i__106355 + (1));
i__106355 = G__106892;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106356),frontend$ui$iter__106353(cljs.core.chunk_rest(s__106354__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106356),null);
}
} else {
var vec__106361 = cljs.core.first(s__106354__$2);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106361,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106361,(1),null);
return cljs.core.cons((function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__106361,group,matched__$1,s__106354__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(vec__106361,group,matched__$1,s__106354__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs106360 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106360))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs106360], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs106360))?null:[daiquiri.interpreter.interpret(attrs106360)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})(),frontend$ui$iter__106353(cljs.core.rest(s__106354__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.group_by(new cljs.core.Keyword(null,"group","group",582596132),matched));
})());
})():daiquiri.interpreter.interpret(render_f(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(matched))))]:[daiquiri.interpreter.interpret(attrs106352),(cljs.core.truth_(grouped_QMARK_)?(function (){var _STAR_idx = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1));
var inc_idx = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_idx,cljs.core.inc);
});
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106364(s__106365){
return (new cljs.core.LazySeq(null,(function (){
var s__106365__$1 = s__106365;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106365__$1);
if(temp__5804__auto__){
var s__106365__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106365__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106365__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106367 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106366 = (0);
while(true){
if((i__106366 < size__5479__auto__)){
var vec__106368 = cljs.core._nth(c__5478__auto__,i__106366);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106368,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106368,(1),null);
cljs.core.chunk_append(b__106367,(function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__106366,vec__106368,group,matched__$1,c__5478__auto__,size__5479__auto__,b__106367,s__106365__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(i__106366,vec__106368,group,matched__$1,c__5478__auto__,size__5479__auto__,b__106367,s__106365__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs106371 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106371))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs106371], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs106371))?null:[daiquiri.interpreter.interpret(attrs106371)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})());

var G__106896 = (i__106366 + (1));
i__106366 = G__106896;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106367),frontend$ui$iter__106364(cljs.core.chunk_rest(s__106365__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106367),null);
}
} else {
var vec__106372 = cljs.core.first(s__106365__$2);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106372,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106372,(1),null);
return cljs.core.cons((function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__106372,group,matched__$1,s__106365__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(vec__106372,group,matched__$1,s__106365__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs106352,_STAR_current_idx,_STAR_groups,render_f,map__106322,map__106322__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs106371 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106371))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs106371], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs106371))?null:[daiquiri.interpreter.interpret(attrs106371)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})(),frontend$ui$iter__106364(cljs.core.rest(s__106365__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.group_by(new cljs.core.Keyword(null,"group","group",582596132),matched));
})());
})():daiquiri.interpreter.interpret(render_f(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(matched))))]));
})():(cljs.core.truth_(empty_placeholder)?daiquiri.interpreter.interpret(empty_placeholder):null))]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2((0),new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612)),frontend.modules.shortcut.core.mixin_STAR_(new cljs.core.Keyword("shortcut.handler","auto-complete","shortcut.handler/auto-complete",1783376094))], null),"frontend.ui/auto-complete");
frontend.ui.toggle = (function frontend$ui$toggle(var_args){
var G__106376 = arguments.length;
switch (G__106376) {
case 2:
return frontend.ui.toggle.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$2 = (function (on_QMARK_,on_click){
return frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(on_QMARK_,on_click,false);
}));

(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3 = (function (on_QMARK_,on_click,small_QMARK_){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.ui__toggle","a.ui__toggle",307271518),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click,new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(small_QMARK_)?"is-small":""),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core.truth_((function (){var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.key,"Enter");
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(e) : on_click.call(null,e));
} else {
return null;
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.wrapper.transition-colors.ease-in-out.duration-200","span.wrapper.transition-colors.ease-in-out.duration-200",805399991),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"aria-checked","aria-checked",980530562),(cljs.core.truth_(on_QMARK_)?"true":"false"),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"role","role",-736691072),"checkbox",new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(on_QMARK_)?"ui__toggle-background-on":"ui__toggle-background-off")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.switcher.transform.transition.ease-in-out.duration-200","span.switcher.transform.transition.ease-in-out.duration-200",-1989927127),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(on_QMARK_)?(cljs.core.truth_(small_QMARK_)?"translate-x-4":"translate-x-5"):"translate-x-0"),new cljs.core.Keyword(null,"aria-hidden","aria-hidden",399337029),"true"], null)], null)], null)], null);
}));

(frontend.ui.toggle.cljs$lang$maxFixedArity = 3);

frontend.ui.keyboard_shortcut_from_config = (function frontend$ui$keyboard_shortcut_from_config(var_args){
var args__5732__auto__ = [];
var len__5726__auto___106899 = arguments.length;
var i__5727__auto___106900 = (0);
while(true){
if((i__5727__auto___106900 < len__5726__auto___106899)){
args__5732__auto__.push((arguments[i__5727__auto___106900]));

var G__106901 = (i__5727__auto___106900 + (1));
i__5727__auto___106900 = G__106901;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.keyboard_shortcut_from_config.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.keyboard_shortcut_from_config.cljs$core$IFn$_invoke$arity$variadic = (function (shortcut_name,p__106379){
var map__106380 = p__106379;
var map__106380__$1 = cljs.core.__destructure_map(map__106380);
var pick_first_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106380__$1,new cljs.core.Keyword(null,"pick-first?","pick-first?",-2055544652));
var built_in_binding = new cljs.core.Keyword(null,"binding","binding",539932593).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.config.all_built_in_keyboard_shortcuts,shortcut_name));
var custom_binding = (cljs.core.truth_(frontend.state.custom_shortcuts())?cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.custom_shortcuts(),shortcut_name):null);
var binding = (function (){var or__5002__auto__ = custom_binding;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return built_in_binding;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = pick_first_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.coll_QMARK_(binding);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.first(binding);
} else {
return frontend.modules.shortcut.utils.decorate_binding(binding);
}
}));

(frontend.ui.keyboard_shortcut_from_config.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.ui.keyboard_shortcut_from_config.cljs$lang$applyTo = (function (seq106377){
var G__106378 = cljs.core.first(seq106377);
var seq106377__$1 = cljs.core.next(seq106377);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__106378,seq106377__$1);
}));

frontend.ui.loading = (function frontend$ui$loading(var_args){
var G__106382 = arguments.length;
switch (G__106382) {
case 0:
return frontend.ui.loading.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.ui.loading.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.ui.loading.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.ui.loading.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"loading","loading",-737050189)], 0)));
}));

(frontend.ui.loading.cljs$core$IFn$_invoke$arity$1 = (function (content){
return frontend.ui.loading.cljs$core$IFn$_invoke$arity$2(content,null);
}));

(frontend.ui.loading.cljs$core$IFn$_invoke$arity$2 = (function (content,opts){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.inline.icon-loading","div.flex.flex-row.items-center.inline.icon-loading",-1637284770),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.icon.flex.items-center","span.icon.flex.items-center",-1264305839),frontend.components.svg.loader_fn(opts),((clojure.string.blank_QMARK_(content))?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text.pl-2","span.text.pl-2",-2100749954),content], null))], null)], null);
}));

(frontend.ui.loading.cljs$lang$maxFixedArity = 2);

frontend.ui.rotating_arrow = rum.core.lazy_build(rum.core.build_defc,(function (collapsed_QMARK_){
return daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(collapsed_QMARK_)?"rotating-arrow collapsed":"rotating-arrow not-collapsed")], null))},[frontend.components.svg.caret_right()]);
}),null,"frontend.ui/rotating-arrow");
frontend.ui.foldable_title = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__106383){
var map__106384 = p__106383;
var map__106384__$1 = cljs.core.__destructure_map(map__106384);
var on_pointer_down = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106384__$1,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106384__$1,new cljs.core.Keyword(null,"header","header",119441134));
var title_trigger_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106384__$1,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106384__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var control_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","control?","frontend.ui/control?",1642964409));
return daiquiri.core.create_element("div",{'className':"ls-foldable-title content"},[(function (){var attrs106387 = (function (){var G__106388 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
return cljs.core.reset_BANG_(control_QMARK_,true);
}),new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.reset_BANG_(control_QMARK_,false);
})], null);
if(cljs.core.truth_(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__106388,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"cursor"], 0));
} else {
return G__106388;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106387))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1","flex-row","foldable-title"], null)], null),attrs106387], 0))):{'className':"flex-1 flex-row foldable-title"}),((cljs.core.map_QMARK_(attrs106387))?[daiquiri.core.create_element("div",{'onClick':(function (e){
var target = e.target;
if(cljs.core.truth_((function (){var G__106389 = target;
if((G__106389 == null)){
return null;
} else {
return G__106389.closest(".as-toggle");
}
})())){
return cljs.core.reset_BANG_(collapsed_QMARK_,cljs.core.not(cljs.core.deref(collapsed_QMARK_)));
} else {
return null;
}
}),'className':"flex flex-row items-center ls-foldable-header gap-1"},[(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:(function (){var style = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(14),new cljs.core.Keyword(null,"height","height",1025178622),(16)], null);
var attrs106392 = (function (){var G__106393 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null);
if(cljs.core.not(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106393,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down);
} else {
return G__106393;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs106392))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-foldable-title-control","block-control","opacity-50","hover:opacity-100"], null)], null),attrs106392], 0))):{'className':"ls-foldable-title-control block-control opacity-50 hover:opacity-100"}),((cljs.core.map_QMARK_(attrs106392))?[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]:[daiquiri.interpreter.interpret(attrs106392),daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]));
})()),((cljs.core.fn_QMARK_(header))?daiquiri.interpreter.interpret((function (){var G__106395 = cljs.core.deref(collapsed_QMARK_);
return (header.cljs$core$IFn$_invoke$arity$1 ? header.cljs$core$IFn$_invoke$arity$1(G__106395) : header.call(null,G__106395));
})()):daiquiri.interpreter.interpret(header))])]:[daiquiri.interpreter.interpret(attrs106387),daiquiri.core.create_element("div",{'onClick':(function (e){
var target = e.target;
if(cljs.core.truth_((function (){var G__106396 = target;
if((G__106396 == null)){
return null;
} else {
return G__106396.closest(".as-toggle");
}
})())){
return cljs.core.reset_BANG_(collapsed_QMARK_,cljs.core.not(cljs.core.deref(collapsed_QMARK_)));
} else {
return null;
}
}),'className':"flex flex-row items-center ls-foldable-header gap-1"},[(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:(function (){var style = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(14),new cljs.core.Keyword(null,"height","height",1025178622),(16)], null);
var attrs106399 = (function (){var G__106400 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null);
if(cljs.core.not(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106400,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down);
} else {
return G__106400;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs106399))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-foldable-title-control","block-control","opacity-50","hover:opacity-100"], null)], null),attrs106399], 0))):{'className':"ls-foldable-title-control block-control opacity-50 hover:opacity-100"}),((cljs.core.map_QMARK_(attrs106399))?[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]:[daiquiri.interpreter.interpret(attrs106399),daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]));
})()),((cljs.core.fn_QMARK_(header))?daiquiri.interpreter.interpret((function (){var G__106402 = cljs.core.deref(collapsed_QMARK_);
return (header.cljs$core$IFn$_invoke$arity$1 ? header.cljs$core$IFn$_invoke$arity$1(G__106402) : header.call(null,G__106402));
})()):daiquiri.interpreter.interpret(header))])]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.ui","control?","frontend.ui/control?",1642964409))], null),"frontend.ui/foldable-title");
frontend.ui.foldable = rum.core.lazy_build(rum.core.build_defcs,(function (state,header,content,p__106403){
var map__106404 = p__106403;
var map__106404__$1 = cljs.core.__destructure_map(map__106404);
var title_trigger_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106404__$1,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873));
var on_pointer_down = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106404__$1,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106404__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var _default_collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106404__$1,new cljs.core.Keyword(null,"_default-collapsed?","_default-collapsed?",1256331234));
var _init_collapsed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106404__$1,new cljs.core.Keyword(null,"_init-collapsed","_init-collapsed",282845909));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586));
var on_pointer_down__$1 = (function (e){
frontend.util.stop(e);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(collapsed_QMARK_,cljs.core.not);

if(cljs.core.truth_(on_pointer_down)){
var G__106405 = cljs.core.deref(collapsed_QMARK_);
return (on_pointer_down.cljs$core$IFn$_invoke$arity$1 ? on_pointer_down.cljs$core$IFn$_invoke$arity$1(G__106405) : on_pointer_down.call(null,G__106405));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col",class$], null))},[frontend.ui.foldable_title(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down__$1,new cljs.core.Keyword(null,"header","header",119441134),header,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),title_trigger_QMARK_,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK_], null)),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(cljs.core.deref(collapsed_QMARK_))?"hidden":"initial")], null))},[((cljs.core.fn_QMARK_(content))?((cljs.core.not(cljs.core.deref(collapsed_QMARK_)))?daiquiri.interpreter.interpret((content.cljs$core$IFn$_invoke$arity$0 ? content.cljs$core$IFn$_invoke$arity$0() : content.call(null))):null):daiquiri.interpreter.interpret(content))])]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.db_mixins.query,rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var args_106930 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
if(new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823).cljs$core$IFn$_invoke$arity$1(cljs.core.last(args_106930)) === true){
cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586)),true);
} else {
}

return state;
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var temp__5804__auto___106931 = new cljs.core.Keyword(null,"init-collapsed","init-collapsed",-220931385).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(temp__5804__auto___106931)){
var f_106932 = temp__5804__auto___106931;
var G__106406_106933 = new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586).cljs$core$IFn$_invoke$arity$1(state);
(f_106932.cljs$core$IFn$_invoke$arity$1 ? f_106932.cljs$core$IFn$_invoke$arity$1(G__106406_106933) : f_106932.call(null,G__106406_106933));
} else {
}

return state;
})], null)], null),"frontend.ui/foldable");
frontend.ui.admonition = rum.core.lazy_build(rum.core.build_defc,(function (type,content){
var type__$1 = cljs.core.name(type);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__106408 = clojure.string.lower_case(type__$1);
switch (G__106408) {
case "note":
return frontend.components.svg.note;

break;
case "tip":
return frontend.components.svg.tip;

break;
case "important":
return frontend.components.svg.important;

break;
case "caution":
return frontend.components.svg.caution;

break;
case "warning":
return frontend.components.svg.warning;

break;
case "pinned":
return frontend.components.svg.pinned;

break;
default:
return null;

}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var icon_SINGLEQUOTE_ = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.admonitionblock.align-items","div.flex.flex-row.admonitionblock.align-items",-513234862),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),type__$1], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pr-4.admonition-icon.flex.flex-col.justify-center","div.pr-4.admonition-icon.flex.flex-col.justify-center",-1325303445),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),clojure.string.capitalize(type__$1)], null),(icon_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$0 ? icon_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$0() : icon_SINGLEQUOTE_.call(null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-4.text-lg","div.ml-4.text-lg",525424974),content], null)], null);
} else {
return null;
}
})());
}),null,"frontend.ui/admonition");
frontend.ui.catch_error = rum.core.lazy_build(rum.core.build_defcs,(function (p__106409,error_view,view){
var map__106410 = p__106409;
var map__106410__$1 = cljs.core.__destructure_map(map__106410);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106410__$1,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008));
var c = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106410__$1,new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248));
if((!((error == null)))){
if(cljs.core.fn_QMARK_(error_view)){
return daiquiri.interpreter.interpret((error_view.cljs$core$IFn$_invoke$arity$1 ? error_view.cljs$core$IFn$_invoke$arity$1(error) : error_view.call(null,error)));
} else {
return daiquiri.interpreter.interpret(error_view);
}
} else {
return daiquiri.interpreter.interpret(view);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-catch","did-catch",2139522313),(function (state,error,_info){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.ui",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),687], null)),error);

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008),error);
})], null)], null),"frontend.ui/catch-error");
frontend.ui.catch_error_and_notify = rum.core.lazy_build(rum.core.build_defcs,(function (p__106411,error_view,view){
var map__106412 = p__106411;
var map__106412__$1 = cljs.core.__destructure_map(map__106412);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106412__$1,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008));
var c = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106412__$1,new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248));
if((!((error == null)))){
return daiquiri.interpreter.interpret(error_view);
} else {
return daiquiri.interpreter.interpret(view);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-catch","did-catch",2139522313),(function (state,error,_info){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.ui",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),697], null)),error);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-2","div.flex.flex-col.gap-2",1564729900),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["Error caught by UI!\n ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join('')], null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.stack)], null),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008),error);
})], null)], null),"frontend.ui/catch-error-and-notify");
/**
 * Well styled error message for blocks
 */
frontend.ui.block_error = rum.core.lazy_build(rum.core.build_defc,(function (title,p__106414){
var map__106415 = p__106414;
var map__106415__$1 = cljs.core.__destructure_map(map__106415);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106415__$1,new cljs.core.Keyword(null,"content","content",15833224));
var section_attrs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106415__$1,new cljs.core.Keyword(null,"section-attrs","section-attrs",1373816150));
var attrs106413 = section_attrs;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs106413))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["border","mt-1","p-1","cursor-pointer","block-content-fallback-ui","w-full"], null)], null),attrs106413], 0))):{'className':"border mt-1 p-1 cursor-pointer block-content-fallback-ui w-full"}),((cljs.core.map_QMARK_(attrs106413))?[daiquiri.core.create_element("div",{'className':"flex justify-between items-center px-1"},[(function (){var attrs106416 = title;
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs106416))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-error","pb-1"], null)], null),attrs106416], 0))):{'className':"text-error pb-1"}),((cljs.core.map_QMARK_(attrs106416))?null:[daiquiri.interpreter.interpret(attrs106416)]));
})(),daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'target':"_blank",'className':"text-xs opacity-50 hover:opacity-80"},["report issue"])]),(cljs.core.truth_(content)?daiquiri.core.create_element("pre",{'className':"m-0 text-sm"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)]):null)]:[daiquiri.interpreter.interpret(attrs106413),daiquiri.core.create_element("div",{'className':"flex justify-between items-center px-1"},[(function (){var attrs106419 = title;
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs106419))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-error","pb-1"], null)], null),attrs106419], 0))):{'className':"text-error pb-1"}),((cljs.core.map_QMARK_(attrs106419))?null:[daiquiri.interpreter.interpret(attrs106419)]));
})(),daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'target':"_blank",'className':"text-xs opacity-50 hover:opacity-80"},["report issue"])]),(cljs.core.truth_(content)?daiquiri.core.create_element("pre",{'className':"m-0 text-sm"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)]):null)]));
}),null,"frontend.ui/block-error");
/**
 * Well styled error message for higher level components. Currently same as
 *   block-error but this could change
 */
frontend.ui.component_error = frontend.ui.block_error;
frontend.ui.select = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__106936 = null;
var G__106936__2 = (function (options,on_change){
return daiquiri.interpreter.interpret((function (){var G__106432 = options;
var G__106433 = on_change;
var G__106434 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.ui.select.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.select.cljs$core$IFn$_invoke$arity$3(G__106432,G__106433,G__106434) : frontend.ui.select.call(null,G__106432,G__106433,G__106434));
})());
});
var G__106936__3 = (function (options,on_change,select_options){
var attrs106422 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"form-select",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var value = frontend.util.evalue(e);
return (on_change.cljs$core$IFn$_invoke$arity$2 ? on_change.cljs$core$IFn$_invoke$arity$2(e,value) : on_change.call(null,e,value));
})], null),select_options], 0));
return daiquiri.core.create_element("select",((cljs.core.map_QMARK_(attrs106422))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-6","block","text-base","leading-6","border-gray-300","focus:outline-none","focus:shadow-outline-blue","focus:border-blue-300","sm:text-sm","sm:leading-5"], null)], null),attrs106422], 0))):{'className':"pl-6 block text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5"}),((cljs.core.map_QMARK_(attrs106422))?[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106435(s__106436){
return (new cljs.core.LazySeq(null,(function (){
var s__106436__$1 = s__106436;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106436__$1);
if(temp__5804__auto__){
var s__106436__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106436__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106436__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106438 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106437 = (0);
while(true){
if((i__106437 < size__5479__auto__)){
var map__106439 = cljs.core._nth(c__5478__auto__,i__106437);
var map__106439__$1 = cljs.core.__destructure_map(map__106439);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106439__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106439__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106439__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106439__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
cljs.core.chunk_append(b__106438,(function (){var attrs106425 = (function (){var G__106440 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__106440__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106440,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__106440);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106440__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__106440__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs106425))?daiquiri.interpreter.element_attributes(attrs106425):null),((cljs.core.map_QMARK_(attrs106425))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs106425),daiquiri.interpreter.interpret(label)]));
})());

var G__106947 = (i__106437 + (1));
i__106437 = G__106947;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106438),frontend$ui$iter__106435(cljs.core.chunk_rest(s__106436__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106438),null);
}
} else {
var map__106441 = cljs.core.first(s__106436__$2);
var map__106441__$1 = cljs.core.__destructure_map(map__106441);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106441__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106441__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106441__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106441__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
return cljs.core.cons((function (){var attrs106425 = (function (){var G__106442 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__106442__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106442,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__106442);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106442__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__106442__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs106425))?daiquiri.interpreter.element_attributes(attrs106425):null),((cljs.core.map_QMARK_(attrs106425))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs106425),daiquiri.interpreter.interpret(label)]));
})(),frontend$ui$iter__106435(cljs.core.rest(s__106436__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})())]:[daiquiri.interpreter.interpret(attrs106422),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106443(s__106444){
return (new cljs.core.LazySeq(null,(function (){
var s__106444__$1 = s__106444;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106444__$1);
if(temp__5804__auto__){
var s__106444__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106444__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106444__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106446 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106445 = (0);
while(true){
if((i__106445 < size__5479__auto__)){
var map__106447 = cljs.core._nth(c__5478__auto__,i__106445);
var map__106447__$1 = cljs.core.__destructure_map(map__106447);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106447__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106447__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106447__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106447__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
cljs.core.chunk_append(b__106446,(function (){var attrs106428 = (function (){var G__106448 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__106448__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106448,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__106448);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106448__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__106448__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs106428))?daiquiri.interpreter.element_attributes(attrs106428):null),((cljs.core.map_QMARK_(attrs106428))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs106428),daiquiri.interpreter.interpret(label)]));
})());

var G__106959 = (i__106445 + (1));
i__106445 = G__106959;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106446),frontend$ui$iter__106443(cljs.core.chunk_rest(s__106444__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106446),null);
}
} else {
var map__106449 = cljs.core.first(s__106444__$2);
var map__106449__$1 = cljs.core.__destructure_map(map__106449);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106449__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106449__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106449__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106449__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
return cljs.core.cons((function (){var attrs106428 = (function (){var G__106450 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__106450__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106450,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__106450);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106450__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__106450__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs106428))?daiquiri.interpreter.element_attributes(attrs106428):null),((cljs.core.map_QMARK_(attrs106428))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs106428),daiquiri.interpreter.interpret(label)]));
})(),frontend$ui$iter__106443(cljs.core.rest(s__106444__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})())]));
});
G__106936 = function(options,on_change,select_options){
switch(arguments.length){
case 2:
return G__106936__2.call(this,options,on_change);
case 3:
return G__106936__3.call(this,options,on_change,select_options);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__106936.cljs$core$IFn$_invoke$arity$2 = G__106936__2;
G__106936.cljs$core$IFn$_invoke$arity$3 = G__106936__3;
return G__106936;
})()
,null,"frontend.ui/select");
frontend.ui.radio_list = rum.core.lazy_build(rum.core.build_defc,(function (options,on_change,class$){
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__radio-list",class$], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106452(s__106453){
return (new cljs.core.LazySeq(null,(function (){
var s__106453__$1 = s__106453;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106453__$1);
if(temp__5804__auto__){
var s__106453__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106453__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106453__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106455 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106454 = (0);
while(true){
if((i__106454 < size__5479__auto__)){
var map__106456 = cljs.core._nth(c__5478__auto__,i__106454);
var map__106456__$1 = cljs.core.__destructure_map(map__106456);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106456__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106456__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106456__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__106455,daiquiri.core.create_element("label",{'key':["radio-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"radio",'onChange':rum.core.mark_sync_update(((function (i__106454,map__106456,map__106456__$1,label,value,selected,c__5478__auto__,size__5479__auto__,b__106455,s__106453__$2,temp__5804__auto__){
return (function (p1__106451_SHARP_){
var G__106457 = frontend.util.evalue(p1__106451_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__106457) : on_change.call(null,G__106457));
});})(i__106454,map__106456,map__106456__$1,label,value,selected,c__5478__auto__,size__5479__auto__,b__106455,s__106453__$2,temp__5804__auto__))
),'checked':selected,'className':"form-radio"},[]),daiquiri.interpreter.interpret(label)]));

var G__106967 = (i__106454 + (1));
i__106454 = G__106967;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106455),frontend$ui$iter__106452(cljs.core.chunk_rest(s__106453__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106455),null);
}
} else {
var map__106458 = cljs.core.first(s__106453__$2);
var map__106458__$1 = cljs.core.__destructure_map(map__106458);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106458__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106458__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106458__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons(daiquiri.core.create_element("label",{'key':["radio-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"radio",'onChange':rum.core.mark_sync_update(((function (map__106458,map__106458__$1,label,value,selected,s__106453__$2,temp__5804__auto__){
return (function (p1__106451_SHARP_){
var G__106459 = frontend.util.evalue(p1__106451_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__106459) : on_change.call(null,G__106459));
});})(map__106458,map__106458__$1,label,value,selected,s__106453__$2,temp__5804__auto__))
),'checked':selected,'className':"form-radio"},[]),daiquiri.interpreter.interpret(label)]),frontend$ui$iter__106452(cljs.core.rest(s__106453__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})())]);
}),null,"frontend.ui/radio-list");
frontend.ui.checkbox_list = rum.core.lazy_build(rum.core.build_defc,(function (options,on_change,class$){
var checked_vals = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"value","value",305978217),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"selected","selected",574897764),options)));
var on_item_change = (function (e){
var target = e.target;
var checked_QMARK_ = target.checked;
var value = target.value;
var G__106460 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(checked_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(checked_vals,value):cljs.core.disj.cljs$core$IFn$_invoke$arity$2(checked_vals,value)));
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__106460) : on_change.call(null,G__106460));
});
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__checkbox-list",class$], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106461(s__106462){
return (new cljs.core.LazySeq(null,(function (){
var s__106462__$1 = s__106462;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106462__$1);
if(temp__5804__auto__){
var s__106462__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106462__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106462__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106464 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106463 = (0);
while(true){
if((i__106463 < size__5479__auto__)){
var map__106465 = cljs.core._nth(c__5478__auto__,i__106463);
var map__106465__$1 = cljs.core.__destructure_map(map__106465);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106465__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106465__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106465__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__106464,daiquiri.core.create_element("label",{'key':["check-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"checkbox",'onChange':rum.core.mark_sync_update(on_item_change),'checked':selected,'className':"form-checkbox"},[]),daiquiri.interpreter.interpret(label)]));

var G__106974 = (i__106463 + (1));
i__106463 = G__106974;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106464),frontend$ui$iter__106461(cljs.core.chunk_rest(s__106462__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106464),null);
}
} else {
var map__106466 = cljs.core.first(s__106462__$2);
var map__106466__$1 = cljs.core.__destructure_map(map__106466);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106466__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106466__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106466__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons(daiquiri.core.create_element("label",{'key':["check-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"checkbox",'onChange':rum.core.mark_sync_update(on_item_change),'checked':selected,'className':"form-checkbox"},[]),daiquiri.interpreter.interpret(label)]),frontend$ui$iter__106461(cljs.core.rest(s__106462__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})())]);
}),null,"frontend.ui/checkbox-list");
frontend.ui.slider = rum.core.lazy_build(rum.core.build_defcs,(function (state,_default_value,p__106469){
var map__106470 = p__106469;
var map__106470__$1 = cljs.core.__destructure_map(map__106470);
var max_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106470__$1,new cljs.core.Keyword(null,"max","max",61366548));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106470__$1,new cljs.core.Keyword(null,"min","min",444991522));
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106470__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var _STAR_value = new cljs.core.Keyword("frontend.ui","value","frontend.ui/value",-1486153895).cljs$core$IFn$_invoke$arity$1(state);
var value = rum.core.react(_STAR_value);
var value_SINGLEQUOTE_ = (value | (0));
if(cljs.core.int_QMARK_(value_SINGLEQUOTE_)){
} else {
throw (new Error("Assert failed: (int? value')"));
}

return daiquiri.core.create_element("input",{'type':"range",'value':value_SINGLEQUOTE_,'min':min,'max':max_SINGLEQUOTE_,'style':{'width':"100%"},'onChange':rum.core.mark_sync_update((function (p1__106467_SHARP_){
var value__$1 = frontend.util.evalue(p1__106467_SHARP_);
return cljs.core.reset_BANG_(_STAR_value,value__$1);
})),'onPointerUp':(function (p1__106468_SHARP_){
var value__$1 = frontend.util.evalue(p1__106468_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value__$1) : on_change.call(null,value__$1));
}),'className':"cursor-pointer"},[]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","value","frontend.ui/value",-1486153895),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))));
})], null)], null),"frontend.ui/slider");
frontend.ui.tweet_embed = rum.core.lazy_build(rum.core.build_defcs,(function (state,id){
var _STAR_loading_QMARK_ = new cljs.core.Keyword(null,"loading?","loading?",1905707049).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",null,[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(cljs.core.deref(_STAR_loading_QMARK_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.svg.loading," ... loading"], null)], null):null),(function (){var G__106471 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),"contents",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"theme","theme",-1247880880),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132)),"dark"))?"dark":null)], null),new cljs.core.Keyword(null,"on-tweet-load-success","on-tweet-load-success",1698437749),(function (){
return cljs.core.reset_BANG_(_STAR_loading_QMARK_,false);
})], null);
return (frontend.ui.ReactTweetEmbed.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.ReactTweetEmbed.cljs$core$IFn$_invoke$arity$1(G__106471) : frontend.ui.ReactTweetEmbed.call(null,G__106471));
})()], null))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(true,new cljs.core.Keyword(null,"loading?","loading?",1905707049))], null),"frontend.ui/tweet-embed");
frontend.ui.icon = logseq.shui.icon.v2.root;
frontend.ui.button_inner = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__107022__delegate = function (text,p__106472){
var map__106473 = p__106472;
var map__106473__$1 = cljs.core.__destructure_map(map__106473);
var opts = map__106473__$1;
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var variant = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"variant","variant",-424354234));
var button_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"button-props","button-props",-392655929));
var background = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"background","background",-863952629));
var icon_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875));
var small_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106473__$1,new cljs.core.Keyword(null,"small?","small?",95242445),false);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"size","size",1098693007));
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var intent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106473__$1,new cljs.core.Keyword(null,"intent","intent",-390846953));
var button_props__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"theme","theme",-1247880880),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"href","href",-793805698),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"intent","intent",-390846953),new cljs.core.Keyword(null,"small?","small?",95242445),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),new cljs.core.Keyword(null,"button-props","button-props",-392655929)], 0)),button_props], 0));
var props = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"variant","variant",-424354234),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme,new cljs.core.Keyword(null,"gray","gray",1013268388)))?new cljs.core.Keyword(null,"ghost","ghost",-1531157576):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(background,"gray"))?new cljs.core.Keyword(null,"secondary","secondary",-669381460):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(background,"red"))?new cljs.core.Keyword(null,"destructive","destructive",-1587723243):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(intent,"link"))?new cljs.core.Keyword(null,"ghost","ghost",-1531157576):(function (){var or__5002__auto__ = variant;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})()
)))),new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"size","size",1098693007),(cljs.core.truth_(small_QMARK_)?new cljs.core.Keyword(null,"xs","xs",649443341):(function (){var or__5002__auto__ = size;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"sm","sm",-1402575065);
}
})()),new cljs.core.Keyword(null,"icon","icon",1679606541),icon_SINGLEQUOTE_,new cljs.core.Keyword(null,"class","class",-2030961996),((((typeof background === 'string') && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["gray",null,"red",null], null), null),background))))))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)," primary-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(background)].join(''):class$),new cljs.core.Keyword(null,"muted","muted",1275109029),disabled_QMARK_], null),button_props__$1], 0));
var icon_SINGLEQUOTE__SINGLEQUOTE_ = (cljs.core.truth_(icon_SINGLEQUOTE_)?logseq.shui.ui.tabler_icon(icon_SINGLEQUOTE_,icon_props):null);
var href_QMARK_ = (!(clojure.string.blank_QMARK_(href)));
var text__$1 = ((href_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"target","target",253001721),"_blank",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"inherit"], null)], null),text], null):text
);
var children = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [icon_SINGLEQUOTE__SINGLEQUOTE_,text__$1], null);
return daiquiri.interpreter.interpret((logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(props,children) : logseq.shui.ui.button.call(null,props,children)));
};
var G__107022 = function (text,var_args){
var p__106472 = null;
if (arguments.length > 1) {
var G__107049__i = 0, G__107049__a = new Array(arguments.length -  1);
while (G__107049__i < G__107049__a.length) {G__107049__a[G__107049__i] = arguments[G__107049__i + 1]; ++G__107049__i;}
  p__106472 = new cljs.core.IndexedSeq(G__107049__a,0,null);
} 
return G__107022__delegate.call(this,text,p__106472);};
G__107022.cljs$lang$maxFixedArity = 1;
G__107022.cljs$lang$applyTo = (function (arglist__107050){
var text = cljs.core.first(arglist__107050);
var p__106472 = cljs.core.rest(arglist__107050);
return G__107022__delegate(text,p__106472);
});
G__107022.cljs$core$IFn$_invoke$arity$variadic = G__107022__delegate;
return G__107022;
})()
,null,"frontend.ui/button-inner");
frontend.ui.button = (function frontend$ui$button(var_args){
var args__5732__auto__ = [];
var len__5726__auto___107055 = arguments.length;
var i__5727__auto___107056 = (0);
while(true){
if((i__5727__auto___107056 < len__5726__auto___107055)){
args__5732__auto__.push((arguments[i__5727__auto___107056]));

var G__107057 = (i__5727__auto___107056 + (1));
i__5727__auto___107056 = G__107057;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic = (function (text,p__106476){
var map__106477 = p__106476;
var map__106477__$1 = cljs.core.__destructure_map(map__106477);
var opts = map__106477__$1;
if(cljs.core.map_QMARK_(text)){
return frontend.ui.button_inner(null,text);
} else {
return frontend.ui.button_inner(text,opts);
}
}));

(frontend.ui.button.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.ui.button.cljs$lang$applyTo = (function (seq106474){
var G__106475 = cljs.core.first(seq106474);
var seq106474__$1 = cljs.core.next(seq106474);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__106475,seq106474__$1);
}));

frontend.ui.point = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__107064 = null;
var G__107064__0 = (function (){
return daiquiri.interpreter.interpret((frontend.ui.point.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.point.cljs$core$IFn$_invoke$arity$3("bg-red-600",(5),null) : frontend.ui.point.call(null,"bg-red-600",(5),null)));
});
var G__107064__3 = (function (klass,size,p__106479){
var map__106480 = p__106479;
var map__106480__$1 = cljs.core.__destructure_map(map__106480);
var opts = map__106480__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106480__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var style = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106480__$1,new cljs.core.Keyword(null,"style","style",-496642736));
var attrs106478 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),[frontend.util.hiccup__GT_class(klass)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),size,new cljs.core.Keyword(null,"height","height",1025178622),size], null),style], 0))], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996)], 0))], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106478))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__point","overflow-hidden","rounded-full","inline-block"], null)], null),attrs106478], 0))):{'className':"ui__point overflow-hidden rounded-full inline-block"}),((cljs.core.map_QMARK_(attrs106478))?null:[daiquiri.interpreter.interpret(attrs106478)]));
});
G__107064 = function(klass,size,p__106479){
switch(arguments.length){
case 0:
return G__107064__0.call(this);
case 3:
return G__107064__3.call(this,klass,size,p__106479);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__107064.cljs$core$IFn$_invoke$arity$0 = G__107064__0;
G__107064.cljs$core$IFn$_invoke$arity$3 = G__107064__3;
return G__107064;
})()
,null,"frontend.ui/point");
frontend.ui.with_shortcut = rum.core.lazy_build(rum.core.build_defc,(function (shortcut_key,_position,content){
var shortcut_tooltip_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086));
var enabled_tooltip_QMARK_ = frontend.state.enable_tooltip_QMARK_();
if(cljs.core.truth_((function (){var and__5000__auto__ = enabled_tooltip_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return shortcut_tooltip_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return daiquiri.interpreter.interpret((function (){var G__106484 = content;
var G__106485 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium","div.text-sm.font-medium",-120265550),frontend.ui.keyboard_shortcut_from_config(shortcut_key)], null);
var G__106486 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null)], null);
return (frontend.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__106484,G__106485,G__106486) : frontend.ui.tooltip.call(null,G__106484,G__106485,G__106486));
})());
} else {
return daiquiri.interpreter.interpret(content);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (key,pos){
return ["shortcut-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pos)].join('');
})], null)], null),"frontend.ui/with-shortcut");
frontend.ui.progress_bar = rum.core.lazy_build(rum.core.build_defc,(function (width){
if(cljs.core.truth_(cljs.core.integer_QMARK_)){
} else {
throw (new Error("Assert failed: integer?"));
}

if(cljs.core.truth_(width)){
} else {
throw (new Error("Assert failed: width"));
}

return daiquiri.core.create_element("div",{'className':"w-full rounded-full h-2 5 animate-pulse bg-gray-06-alpha"},[daiquiri.core.create_element("div",{'style':{'width':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(width),"%"].join('')},'transition':"width 1s",'className':"bg-gray-09-alpha h-2 5 rounded-full"},[])]);
}),null,"frontend.ui/progress-bar");
frontend.ui.progress_bar_with_label = rum.core.lazy_build(rum.core.build_defc,(function (width,label_left,label_right){
if(cljs.core.truth_(cljs.core.integer_QMARK_)){
} else {
throw (new Error("Assert failed: integer?"));
}

if(cljs.core.truth_(width)){
} else {
throw (new Error("Assert failed: width"));
}

return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"flex justify-between mb-1"},[(function (){var attrs106487 = label_left;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106487))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-base"], null)], null),attrs106487], 0))):{'className':"text-base"}),((cljs.core.map_QMARK_(attrs106487))?null:[daiquiri.interpreter.interpret(attrs106487)]));
})(),(function (){var attrs106488 = label_right;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs106488))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","font-medium"], null)], null),attrs106488], 0))):{'className':"text-sm font-medium"}),((cljs.core.map_QMARK_(attrs106488))?null:[daiquiri.interpreter.interpret(attrs106488)]));
})()]),frontend.ui.progress_bar(width)]);
}),null,"frontend.ui/progress-bar-with-label");
frontend.ui.lazy_loading_placeholder = rum.core.lazy_build(rum.core.build_defc,(function (height){
return daiquiri.core.create_element("div",{'style':{'height':height}},[]);
}),null,"frontend.ui/lazy-loading-placeholder");
frontend.ui.lazy_visible_inner = rum.core.lazy_build(rum.core.build_defc,(function (visible_QMARK_,content_fn,ref,fade_in_QMARK_,placeholder){
var vec__106490 = frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$0();
var set_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106490,(0),null);
var rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106490,(1),null);
var placeholder_height = (function (){var or__5002__auto__ = (cljs.core.truth_(rect)?rect.height:null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (24);
}
})();
return daiquiri.core.create_element("div",{'ref':ref,'className':"lazy-visibility"},[daiquiri.core.create_element("div",{'ref':set_ref},[(cljs.core.truth_(visible_QMARK_)?((cljs.core.fn_QMARK_(content_fn))?(cljs.core.truth_(fade_in_QMARK_)?daiquiri.core.create_element("div",{'ref':(function (p1__106489_SHARP_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = p1__106489_SHARP_;
if(cljs.core.truth_(and__5000__auto__)){
return p1__106489_SHARP_.classList;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var cls = temp__5804__auto__;
return cls.add("fade-enter-active");
} else {
return null;
}
}),'className':"fade-enter"},[daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$0 ? content_fn.cljs$core$IFn$_invoke$arity$0() : content_fn.call(null)))]):daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$0 ? content_fn.cljs$core$IFn$_invoke$arity$0() : content_fn.call(null)))):null):daiquiri.interpreter.interpret((function (){var or__5002__auto__ = placeholder;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.ui.lazy_loading_placeholder(placeholder_height);
}
})()))])]);
}),null,"frontend.ui/lazy-visible-inner");
frontend.ui.lazy_visible = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__107078 = null;
var G__107078__1 = (function (content_fn){
return daiquiri.interpreter.interpret((frontend.ui.lazy_visible.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.lazy_visible.cljs$core$IFn$_invoke$arity$2(content_fn,null) : frontend.ui.lazy_visible.call(null,content_fn,null)));
});
var G__107078__2 = (function (content_fn,p__106493){
var map__106494 = p__106493;
var map__106494__$1 = cljs.core.__destructure_map(map__106494);
var initial_state = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106494__$1,new cljs.core.Keyword(null,"initial-state","initial-state",-2021616806),false);
var trigger_once_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106494__$1,new cljs.core.Keyword(null,"trigger-once?","trigger-once?",1582103477),true);
var fade_in_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106494__$1,new cljs.core.Keyword(null,"fade-in?","fade-in?",-1662119882),true);
var root_margin = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106494__$1,new cljs.core.Keyword(null,"root-margin","root-margin",-1598874814),(100));
var placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106494__$1,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083));
var _debug_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106494__$1,new cljs.core.Keyword(null,"_debug-id","_debug-id",1776601068));
var vec__106495 = rum.core.use_state(initial_state);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106495,(0),null);
var set_visible_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106495,(1),null);
var inViewState = (function (){var G__106498 = ({"initialInView": initial_state, "rootMargin": [cljs.core.str.cljs$core$IFn$_invoke$arity$1(root_margin),"px"].join(''), "triggerOnce": trigger_once_QMARK_, "onChange": (function (in_view_QMARK_,_entry){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(in_view_QMARK_,visible_QMARK_)){
return null;
} else {
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(in_view_QMARK_) : set_visible_BANG_.call(null,in_view_QMARK_));
}
})});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__106498) : frontend.ui.useInView.call(null,G__106498));
})();
var ref = inViewState.ref;
return frontend.ui.lazy_visible_inner(visible_QMARK_,content_fn,ref,fade_in_QMARK_,placeholder);
});
G__107078 = function(content_fn,p__106493){
switch(arguments.length){
case 1:
return G__107078__1.call(this,content_fn);
case 2:
return G__107078__2.call(this,content_fn,p__106493);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__107078.cljs$core$IFn$_invoke$arity$1 = G__107078__1;
G__107078.cljs$core$IFn$_invoke$arity$2 = G__107078__2;
return G__107078;
})()
,null,"frontend.ui/lazy-visible");
frontend.ui.menu_heading = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__107079 = null;
var G__107079__3 = (function (add_heading_fn,auto_heading_fn,rm_heading_fn){
return daiquiri.interpreter.interpret((frontend.ui.menu_heading.cljs$core$IFn$_invoke$arity$4 ? frontend.ui.menu_heading.cljs$core$IFn$_invoke$arity$4(null,add_heading_fn,auto_heading_fn,rm_heading_fn) : frontend.ui.menu_heading.call(null,null,add_heading_fn,auto_heading_fn,rm_heading_fn)));
});
var G__107079__4 = (function (heading,add_heading_fn,auto_heading_fn,rm_heading_fn){
return daiquiri.core.create_element("div",{'className':"flex flex-row justify-between pb-2 pt-1 px-2 items-center"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between flex-1 px-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__106499(s__106500){
return (new cljs.core.LazySeq(null,(function (){
var s__106500__$1 = s__106500;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106500__$1);
if(temp__5804__auto__){
var s__106500__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106500__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106500__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106502 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106501 = (0);
while(true){
if((i__106501 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__106501);
cljs.core.chunk_append(b__106502,rum.core.with_key(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading,i))),new cljs.core.Keyword(null,"icon","icon",1679606541),["h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"heading","heading",-1312171873),i], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__106501,i,c__5478__auto__,size__5479__auto__,b__106502,s__106500__$2,temp__5804__auto__){
return (function (){
return (add_heading_fn.cljs$core$IFn$_invoke$arity$1 ? add_heading_fn.cljs$core$IFn$_invoke$arity$1(i) : add_heading_fn.call(null,i));
});})(i__106501,i,c__5478__auto__,size__5479__auto__,b__106502,s__106500__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0)),["key-h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join('')));

var G__107080 = (i__106501 + (1));
i__106501 = G__107080;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106502),frontend$ui$iter__106499(cljs.core.chunk_rest(s__106500__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106502),null);
}
} else {
var i = cljs.core.first(s__106500__$2);
return cljs.core.cons(rum.core.with_key(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading,i))),new cljs.core.Keyword(null,"icon","icon",1679606541),["h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"heading","heading",-1312171873),i], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i,s__106500__$2,temp__5804__auto__){
return (function (){
return (add_heading_fn.cljs$core$IFn$_invoke$arity$1 ? add_heading_fn.cljs$core$IFn$_invoke$arity$1(i) : add_heading_fn.call(null,i));
});})(i,s__106500__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0)),["key-h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join('')),frontend$ui$iter__106499(cljs.core.rest(s__106500__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(7)));
})()),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"icon","icon",1679606541),"h-auto",new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (heading === true)),new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extension?","extension?",-1574402873),true], null),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"auto-heading","auto-heading",-1133447719)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),auto_heading_fn,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"icon","icon",1679606541),"heading-off",new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (cljs.core.not(heading))),new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extension?","extension?",-1574402873),true], null),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"remove-heading","remove-heading",-698258619)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),rm_heading_fn,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0)))])]);
});
G__107079 = function(heading,add_heading_fn,auto_heading_fn,rm_heading_fn){
switch(arguments.length){
case 3:
return G__107079__3.call(this,heading,add_heading_fn,auto_heading_fn);
case 4:
return G__107079__4.call(this,heading,add_heading_fn,auto_heading_fn,rm_heading_fn);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__107079.cljs$core$IFn$_invoke$arity$3 = G__107079__3;
G__107079.cljs$core$IFn$_invoke$arity$4 = G__107079__4;
return G__107079;
})()
,null,"frontend.ui/menu-heading");
frontend.ui.tooltip = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__107081__delegate = function (trigger,tooltip_content,p__106503){
var map__106504 = p__106503;
var map__106504__$1 = cljs.core.__destructure_map(map__106504);
var portal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106504__$1,new cljs.core.Keyword(null,"portal?","portal?",-167584340));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106504__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var trigger_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106504__$1,new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106504__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
return daiquiri.interpreter.interpret((function (){var G__106512 = (function (){var G__106513 = root_props;
var G__106514 = (function (){var G__106516 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null),trigger_props], 0));
var G__106517 = trigger;
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2(G__106516,G__106517) : logseq.shui.ui.tooltip_trigger.call(null,G__106516,G__106517));
})();
var G__106515 = (((!(portal_QMARK_ === false)))?(function (){var G__106518 = (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(content_props,tooltip_content) : logseq.shui.ui.tooltip_content.call(null,content_props,tooltip_content));
return (logseq.shui.ui.tooltip_portal.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_portal.cljs$core$IFn$_invoke$arity$1(G__106518) : logseq.shui.ui.tooltip_portal.call(null,G__106518));
})():(logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(content_props,tooltip_content) : logseq.shui.ui.tooltip_content.call(null,content_props,tooltip_content)));
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__106513,G__106514,G__106515) : logseq.shui.ui.tooltip.call(null,G__106513,G__106514,G__106515));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__106512) : logseq.shui.ui.tooltip_provider.call(null,G__106512));
})());
};
var G__107081 = function (trigger,tooltip_content,var_args){
var p__106503 = null;
if (arguments.length > 2) {
var G__107083__i = 0, G__107083__a = new Array(arguments.length -  2);
while (G__107083__i < G__107083__a.length) {G__107083__a[G__107083__i] = arguments[G__107083__i + 2]; ++G__107083__i;}
  p__106503 = new cljs.core.IndexedSeq(G__107083__a,0,null);
} 
return G__107081__delegate.call(this,trigger,tooltip_content,p__106503);};
G__107081.cljs$lang$maxFixedArity = 2;
G__107081.cljs$lang$applyTo = (function (arglist__107084){
var trigger = cljs.core.first(arglist__107084);
arglist__107084 = cljs.core.next(arglist__107084);
var tooltip_content = cljs.core.first(arglist__107084);
var p__106503 = cljs.core.rest(arglist__107084);
return G__107081__delegate(trigger,tooltip_content,p__106503);
});
G__107081.cljs$core$IFn$_invoke$arity$variadic = G__107081__delegate;
return G__107081;
})()
,null,"frontend.ui/tooltip");
frontend.ui.DelDateButton = rum.core.lazy_build(rum.core.build_defc,(function (on_delete){
return daiquiri.interpreter.interpret((function (){var G__106521 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"del-date-btn",new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_delete], null);
var G__106522 = logseq.shui.ui.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106521,G__106522) : logseq.shui.ui.button.call(null,G__106521,G__106522));
})());
}),null,"frontend.ui/DelDateButton");
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.month_values !== 'undefined')){
} else {
frontend.ui.month_values = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"January","January",1371836485),new cljs.core.Keyword(null,"February","February",-1121382977),new cljs.core.Keyword(null,"March","March",-1927014290),new cljs.core.Keyword(null,"April","April",2129469609),new cljs.core.Keyword(null,"May","May",291127633),new cljs.core.Keyword(null,"June","June",-239852188),new cljs.core.Keyword(null,"July","July",22844502),new cljs.core.Keyword(null,"August","August",1477870381),new cljs.core.Keyword(null,"September","September",-1384246246),new cljs.core.Keyword(null,"October","October",1442498414),new cljs.core.Keyword(null,"November","November",1309168199),new cljs.core.Keyword(null,"December","December",-997702713)], null);
}
frontend.ui.get_month_label = (function frontend$ui$get_month_label(n){
var G__106523 = n;
var G__106523__$1 = (((G__106523 == null))?null:cljs.core.nth.cljs$core$IFn$_invoke$arity$2(frontend.ui.month_values,G__106523));
if((G__106523__$1 == null)){
return null;
} else {
return cljs.core.name(G__106523__$1);
}
});
frontend.ui.date_year_month_select = rum.core.lazy_build(rum.core.build_defc,(function (p__106569){
var map__106570 = p__106569;
var map__106570__$1 = cljs.core.__destructure_map(map__106570);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106570__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106570__$1,new cljs.core.Keyword(null,"value","value",305978217));
var onChange = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106570__$1,new cljs.core.Keyword(null,"onChange","onChange",-312891301));
var _children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106570__$1,new cljs.core.Keyword(null,"_children","_children",1993687667));
var attrs106568 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"years"))?(function (){var G__106571 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (v){
if(cljs.core.truth_(v)){
return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(v) : onChange.call(null,v));
} else {
return null;
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 ml-2 !w-auto !px-2",new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"type","type",1174270348),"number",new cljs.core.Keyword(null,"min","min",444991522),(1),new cljs.core.Keyword(null,"max","max",61366548),(9999)], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__106571) : logseq.shui.ui.input.call(null,G__106571));
})():(function (){var G__106572 = (function (){var G__106574 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__106575 = (function (){var G__106576 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 h-6 border border-input rounded-md",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__106577 = frontend.ui.get_month_label(value);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106576,G__106577) : logseq.shui.ui.button.call(null,G__106576,G__106577));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__106574,G__106575) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__106574,G__106575));
})();
var G__106573 = (function (){var G__106578 = (function (){var iter__5480__auto__ = (function frontend$ui$iter__106579(s__106580){
return (new cljs.core.LazySeq(null,(function (){
var s__106580__$1 = s__106580;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106580__$1);
if(temp__5804__auto__){
var s__106580__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106580__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106580__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106582 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106581 = (0);
while(true){
if((i__106581 < size__5479__auto__)){
var vec__106583 = cljs.core._nth(c__5478__auto__,i__106581);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106583,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106583,(1),null);
var label = cljs.core.name(month);
cljs.core.chunk_append(b__106582,(function (){var G__106586 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,idx),new cljs.core.Keyword(null,"on-select","on-select",-192407950),((function (i__106581,label,vec__106583,idx,month,c__5478__auto__,size__5479__auto__,b__106582,s__106580__$2,temp__5804__auto__,G__106572,map__106570,map__106570__$1,name,value,onChange,_children){
return (function (){
var e = (new Event("change"));
Object.defineProperty(e,"target",({"value": ({"value": idx}), "enumerable": true}));

return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(e) : onChange.call(null,e));
});})(i__106581,label,vec__106583,idx,month,c__5478__auto__,size__5479__auto__,b__106582,s__106580__$2,temp__5804__auto__,G__106572,map__106570,map__106570__$1,name,value,onChange,_children))
], null);
var G__106587 = label;
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__106586,G__106587) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__106586,G__106587));
})());

var G__107085 = (i__106581 + (1));
i__106581 = G__107085;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106582),frontend$ui$iter__106579(cljs.core.chunk_rest(s__106580__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106582),null);
}
} else {
var vec__106588 = cljs.core.first(s__106580__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106588,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106588,(1),null);
var label = cljs.core.name(month);
return cljs.core.cons((function (){var G__106591 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,idx),new cljs.core.Keyword(null,"on-select","on-select",-192407950),((function (label,vec__106588,idx,month,s__106580__$2,temp__5804__auto__,G__106572,map__106570,map__106570__$1,name,value,onChange,_children){
return (function (){
var e = (new Event("change"));
Object.defineProperty(e,"target",({"value": ({"value": idx}), "enumerable": true}));

return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(e) : onChange.call(null,e));
});})(label,vec__106588,idx,month,s__106580__$2,temp__5804__auto__,G__106572,map__106570,map__106570__$1,name,value,onChange,_children))
], null);
var G__106592 = label;
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__106591,G__106592) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__106591,G__106592));
})(),frontend$ui$iter__106579(cljs.core.rest(s__106580__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(frontend.ui.month_values));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$1(G__106578) : logseq.shui.ui.dropdown_menu_content.call(null,G__106578));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__106572,G__106573) : logseq.shui.ui.dropdown_menu.call(null,G__106572,G__106573));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106568))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["months-years-nav"], null)], null),attrs106568], 0))):{'className':"months-years-nav"}),((cljs.core.map_QMARK_(attrs106568))?null:[daiquiri.interpreter.interpret(attrs106568)]));
}),null,"frontend.ui/date-year-month-select");
frontend.ui.single_calendar = (function frontend$ui$single_calendar(p__106594){
var map__106595 = p__106594;
var map__106595__$1 = cljs.core.__destructure_map(map__106595);
var opts = map__106595__$1;
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106595__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106595__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106595__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var on_day_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106595__$1,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076));
var G__106596 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"mode","mode",654403691),"single",new cljs.core.Keyword(null,"caption-layout","caption-layout",2068081731),"dropdown-buttons",new cljs.core.Keyword(null,"fromYear","fromYear",1259124862),(1000),new cljs.core.Keyword(null,"toYear","toYear",-1218322336),(3000),new cljs.core.Keyword(null,"components","components",-1073188942),(function (){var G__106597 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"Dropdown","Dropdown",405115910),(function (p1__106593_SHARP_){
return frontend.ui.date_year_month_select(cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(p1__106593_SHARP_));
})], null);
if(cljs.core.truth_(del_btn_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106597,new cljs.core.Keyword(null,"Head","Head",474150288),(function (){
return frontend.ui.DelDateButton(on_delete);
}));
} else {
return G__106597;
}
})(),new cljs.core.Keyword(null,"class-names","class-names",1257115065),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"months","months",-45571637),"",new cljs.core.Keyword(null,"root","root",-448657453),(cljs.core.truth_(del_btn_QMARK_)?"has-del-btn":null)], null),new cljs.core.Keyword(null,"on-day-key-down","on-day-key-down",-466083153),(function (d,_,e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",e.key)){
var on_select_SINGLEQUOTE_ = (function (){var or__5002__auto__ = on_select;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return on_day_click;
}
})();
return (on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(d) : on_select_SINGLEQUOTE_.call(null,d));
} else {
return null;
}
})], null),opts], 0));
return (logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1(G__106596) : logseq.shui.ui.calendar.call(null,G__106596));
});
frontend.ui.get_current_hh_mm = (function frontend$ui$get_current_hh_mm(){
var current_time_s = cljs.core.first((new Date()).toTimeString().split(" "));
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(current_time_s,(0),(cljs.core.count(current_time_s) - (3)));
});
frontend.ui.time_picker = rum.core.lazy_build(rum.core.build_defc,(function (p__106603){
var map__106604 = p__106603;
var map__106604__$1 = cljs.core.__destructure_map(map__106604);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106604__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var default_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106604__$1,new cljs.core.Keyword(null,"default-value","default-value",232220170));
var attrs106602 = (function (){var G__106605 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"time-picker",new cljs.core.Keyword(null,"type","type",1174270348),"time",new cljs.core.Keyword(null,"class","class",-2030961996),"!py-0 !w-max !h-8",new cljs.core.Keyword(null,"default-value","default-value",232220170),(function (){var or__5002__auto__ = default_value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "00:00";
}
})(),new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (e){
var G__106606 = frontend.util.evalue(e);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__106606) : on_change.call(null,G__106606));
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__106605) : logseq.shui.ui.input.call(null,G__106605));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106602))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2","mx-3","mb-3"], null)], null),attrs106602], 0))):{'className':"flex flex-row items-center gap-2 mx-3 mb-3"}),((cljs.core.map_QMARK_(attrs106602))?[daiquiri.interpreter.interpret((function (){var G__106609 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value = frontend.ui.get_current_hh_mm();
(goog.dom.getElement("time-picker").value = value);

return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value) : on_change.call(null,value));
})], null);
var G__106610 = "Use current time";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106609,G__106610) : logseq.shui.ui.button.call(null,G__106609,G__106610));
})())]:[daiquiri.interpreter.interpret(attrs106602),daiquiri.interpreter.interpret((function (){var G__106613 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value = frontend.ui.get_current_hh_mm();
(goog.dom.getElement("time-picker").value = value);

return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value) : on_change.call(null,value));
})], null);
var G__106614 = "Use current time";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106613,G__106614) : logseq.shui.ui.button.call(null,G__106613,G__106614));
})())]));
}),null,"frontend.ui/time-picker");
frontend.ui.nlp_calendar = rum.core.lazy_build(rum.core.build_defc,(function (p__106620){
var map__106621 = p__106620;
var map__106621__$1 = cljs.core.__destructure_map(map__106621);
var opts = map__106621__$1;
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106621__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106621__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var on_day_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106621__$1,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076));
var default_on_select = (function (){var or__5002__auto__ = on_select;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return on_day_click;
}
})();
var on_select_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100).cljs$core$IFn$_invoke$arity$1(opts))?(function (date,value){
var value__$1 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = typeof value === 'string';
if(and__5000__auto__){
return value;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.dom.getElement("time-picker").value;
}
})();
var vec__106622 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(value__$1,":");
var h = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106622,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106622,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = date;
if(cljs.core.truth_(and__5000__auto__)){
return selected;
} else {
return and__5000__auto__;
}
})())){
date.setHours(h,m,(0));
} else {
}

return (default_on_select.cljs$core$IFn$_invoke$arity$1 ? default_on_select.cljs$core$IFn$_invoke$arity$1(date) : default_on_select.call(null,date));
}):default_on_select);
var attrs106619 = frontend.ui.single_calendar(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"on-select","on-select",-192407950),on_select_SINGLEQUOTE_));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106619))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-2","relative"], null)], null),attrs106619], 0))):{'className':"flex flex-col gap-2 relative"}),((cljs.core.map_QMARK_(attrs106619))?[(cljs.core.truth_(new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100).cljs$core$IFn$_invoke$arity$1(opts))?frontend.ui.time_picker((function (){var G__106628 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (value){
return (on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2 ? on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2(selected,value) : on_select_SINGLEQUOTE_.call(null,selected,value));
})], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106628,new cljs.core.Keyword(null,"default-value","default-value",232220170),[frontend.util.zero_pad(selected.getHours()),":",frontend.util.zero_pad(selected.getMinutes())].join(''));
} else {
return G__106628;
}
})()):null),daiquiri.interpreter.interpret((function (){var G__106644 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. Next week",new cljs.core.Keyword(null,"class","class",-2030961996),"mx-3 mb-3",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"initial",new cljs.core.Keyword(null,"tab-index","tab-index",895755393),(-1)], null),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
var value = frontend.util.evalue(e);
if(clojure.string.blank_QMARK_(value)){
return null;
} else {
var result = frontend.date.nld_parse(value);
var temp__5802__auto__ = (function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
var G__106645 = (new goog.date.DateTime());
G__106645.setTime(result.getTime());

return G__106645;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var date = temp__5802__auto__;
var on_select_SINGLEQUOTE___$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"on-select","on-select",-192407950).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076).cljs$core$IFn$_invoke$arity$1(opts);
}
})();
return (on_select_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$1 ? on_select_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$1(date) : on_select_SINGLEQUOTE___$1.call(null,date));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0))," is not a valid date. Please try again"].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
}
} else {
return null;
}
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__106644) : logseq.shui.ui.input.call(null,G__106644));
})())]:[daiquiri.interpreter.interpret(attrs106619),(cljs.core.truth_(new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100).cljs$core$IFn$_invoke$arity$1(opts))?frontend.ui.time_picker((function (){var G__106649 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (value){
return (on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2 ? on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2(selected,value) : on_select_SINGLEQUOTE_.call(null,selected,value));
})], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106649,new cljs.core.Keyword(null,"default-value","default-value",232220170),[frontend.util.zero_pad(selected.getHours()),":",frontend.util.zero_pad(selected.getMinutes())].join(''));
} else {
return G__106649;
}
})()):null),daiquiri.interpreter.interpret((function (){var G__106654 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. Next week",new cljs.core.Keyword(null,"class","class",-2030961996),"mx-3 mb-3",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"initial",new cljs.core.Keyword(null,"tab-index","tab-index",895755393),(-1)], null),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
var value = frontend.util.evalue(e);
if(clojure.string.blank_QMARK_(value)){
return null;
} else {
var result = frontend.date.nld_parse(value);
var temp__5802__auto__ = (function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
var G__106655 = (new goog.date.DateTime());
G__106655.setTime(result.getTime());

return G__106655;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var date = temp__5802__auto__;
var on_select_SINGLEQUOTE___$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"on-select","on-select",-192407950).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076).cljs$core$IFn$_invoke$arity$1(opts);
}
})();
return (on_select_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$1 ? on_select_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$1(date) : on_select_SINGLEQUOTE___$1.call(null,date));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0))," is not a valid date. Please try again"].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
}
} else {
return null;
}
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__106654) : logseq.shui.ui.input.call(null,G__106654));
})())]));
}),null,"frontend.ui/nlp-calendar");
frontend.ui.indicator_progress_pie = rum.core.lazy_build(rum.core.build_defc,(function (percentage){
var _STAR_el = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(_STAR_el);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return (el.style.backgroundImage = (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("conic-gradient(var(--ls-pie-fg-color) %s%, var(--ls-pie-bg-color) %s%)",percentage,percentage) : frontend.util.format.call(null,"conic-gradient(var(--ls-pie-fg-color) %s%, var(--ls-pie-bg-color) %s%)",percentage,percentage)));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [percentage], null));

return daiquiri.core.create_element("span",{'ref':_STAR_el,'className':"cp__file-sync-indicator-progress-pie"},[]);
}),null,"frontend.ui/indicator-progress-pie");

//# sourceMappingURL=frontend.ui.js.map
