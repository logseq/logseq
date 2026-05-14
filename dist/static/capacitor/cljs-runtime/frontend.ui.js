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
frontend.ui._emoji_init_data = (function (){var G__67165 = ({"data": module$node_modules$$emoji_mart$data$sets$14$native_json});
var fexpr__67164 = frontend.ui.goog$module$goog$object.get(module$node_modules$emoji_mart$dist$main,"init");
return (fexpr__67164.cljs$core$IFn$_invoke$arity$1 ? fexpr__67164.cljs$core$IFn$_invoke$arity$1(G__67165) : fexpr__67164.call(null,G__67165));
})();
}
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.icon_size !== 'undefined')){
} else {
frontend.ui.icon_size = (cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?(24):(20));
}
frontend.ui.shui_popups_QMARK_ = (function frontend$ui$shui_popups_QMARK_(){
var G__67166 = logseq.shui.popup.core.get_popups();
var G__67166__$1 = (((G__67166 == null))?null:cljs.core.count(G__67166));
if((G__67166__$1 == null)){
return null;
} else {
return (G__67166__$1 > (0));
}
});
frontend.ui.last_shui_preview_popup_QMARK_ = (function frontend$ui$last_shui_preview_popup_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ls-preview-popup",(function (){var G__67167 = logseq.shui.popup.core.get_last_popup();
var G__67167__$1 = (((G__67167 == null))?null:new cljs.core.Keyword(null,"content-props","content-props",687449284).cljs$core$IFn$_invoke$arity$1(G__67167));
if((G__67167__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(G__67167__$1);
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
return daiquiri.core.create_element("div",{'className':"flex flex-row justify-between py-1 px-2 items-center"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between flex-1 mx-2 mt-2"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67168(s__67169){
return (new cljs.core.LazySeq(null,(function (){
var s__67169__$1 = s__67169;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67169__$1);
if(temp__5804__auto__){
var s__67169__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67169__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67169__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67171 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67170 = (0);
while(true){
if((i__67170 < size__5479__auto__)){
var color = cljs.core._nth(c__5478__auto__,i__67170);
cljs.core.chunk_append(b__67171,daiquiri.core.create_element("a",{'key':["key-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color)].join(''),'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("color",color)], 0)),'onClick':((function (i__67170,color,c__5478__auto__,size__5479__auto__,b__67171,s__67169__$2,temp__5804__auto__){
return (function (){
return (add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1 ? add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1(color) : add_bgcolor_fn.call(null,color));
});})(i__67170,color,c__5478__auto__,size__5479__auto__,b__67171,s__67169__$2,temp__5804__auto__))
},[daiquiri.core.create_element("div",{'style':{'backgroundColor':["var(--color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"-500)"].join('')},'className':"heading-bg"},[])]));

var G__67597 = (i__67170 + (1));
i__67170 = G__67597;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67171),frontend$ui$iter__67168(cljs.core.chunk_rest(s__67169__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67171),null);
}
} else {
var color = cljs.core.first(s__67169__$2);
return cljs.core.cons(daiquiri.core.create_element("a",{'key':["key-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color)].join(''),'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("color",color)], 0)),'onClick':((function (color,s__67169__$2,temp__5804__auto__){
return (function (){
return (add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1 ? add_bgcolor_fn.cljs$core$IFn$_invoke$arity$1(color) : add_bgcolor_fn.call(null,color));
});})(color,s__67169__$2,temp__5804__auto__))
},[daiquiri.core.create_element("div",{'style':{'backgroundColor':["var(--color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"-500)"].join('')},'className':"heading-bg"},[])]),frontend$ui$iter__67168(cljs.core.rest(s__67169__$2)));
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
frontend.ui.ls_textarea = rum.core.lazy_build(rum.core.build_defc,(function (p__67175){
var map__67176 = p__67175;
var map__67176__$1 = cljs.core.__destructure_map(map__67176);
var props = map__67176__$1;
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67176__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var skip_composition_QMARK_ = frontend.state.sub(new cljs.core.Keyword("editor","action","editor/action",449993861));
var on_composition = (function (e){
if(cljs.core.truth_(skip_composition_QMARK_)){
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(e) : on_change.call(null,e));
} else {
var G__67177 = e.type;
switch (G__67177) {
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
var el_67599 = rum.core.dom_node(state);
var _STAR_mouse_point_67600 = cljs.core.volatile_BANG_(null);
var G__67178_67601 = el_67599;
G__67178_67601.addEventListener("select",(function (){
var start = frontend.util.get_selection_start(el_67599);
var end = frontend.util.get_selection_end(el_67599);
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(start,end);
if(and__5000__auto__){
var caret_pos = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(el_67599);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"caret","caret",-1275001854),caret_pos,new cljs.core.Keyword(null,"start","start",-355208981),start,new cljs.core.Keyword(null,"end","end",-268185958),end,new cljs.core.Keyword(null,"text","text",-1790561697),el_67599.value.substring(start,end),new cljs.core.Keyword(null,"point","point",1813198264),cljs.core.select_keys((function (){var or__5002__auto__ = cljs.core.deref(_STAR_mouse_point_67600);
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

return cljs.core.vreset_BANG_(_STAR_mouse_point_67600,null);
} else {
return null;
}
} else {
return null;
}
}));

G__67178_67601.addEventListener("mouseup",(function (p1__67174_SHARP_){
return cljs.core.vreset_BANG_(_STAR_mouse_point_67600,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),p1__67174_SHARP_.x,new cljs.core.Keyword(null,"y","y",-1757859776),p1__67174_SHARP_.y], null));
}));


return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___67602 = new cljs.core.Keyword(null,"on-unmount","on-unmount",245689269).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(temp__5804__auto___67602)){
var on_unmount_67603 = temp__5804__auto___67602;
(on_unmount_67603.cljs$core$IFn$_invoke$arity$0 ? on_unmount_67603.cljs$core$IFn$_invoke$arity$0() : on_unmount_67603.call(null));
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
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(style_opts),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["dropdown-wrapper","max-h-screen","overflow-y-auto",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$__$1)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__67181 = dropdown_state;
switch (G__67181) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__67181)].join('')));

}
})())].join('')], null))},[daiquiri.interpreter.interpret(content)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var k = (cljs.core.count(frontend.state.sub(new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881))) + (1));
var args = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881),k], null),cljs.core.second(args));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","k","frontend.ui/k",-230439489),k);
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.update_state_BANG_(new cljs.core.Keyword("modal","dropdowns","modal/dropdowns",901161881),(function (p1__67179_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__67179_SHARP_,new cljs.core.Keyword("frontend.ui","k","frontend.ui/k",-230439489).cljs$core$IFn$_invoke$arity$1(state));
}));

return state;
})], null)], null),"frontend.ui/dropdown-content-wrapper");
frontend.ui.dropdown = rum.core.lazy_build(rum.core.build_defcs,(function() { 
var G__67605__delegate = function (state,content_fn,modal_content_fn,p__67182){
var vec__67183 = p__67182;
var map__67186 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67183,(0),null);
var map__67186__$1 = cljs.core.__destructure_map(map__67186);
var modal_class = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67186__$1,new cljs.core.Keyword(null,"modal-class","modal-class",226435127));
var z_index = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67186__$1,new cljs.core.Keyword(null,"z-index","z-index",1892827090),(999));
var trigger_class = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67186__$1,new cljs.core.Keyword(null,"trigger-class","trigger-class",1251717016));
var _initial_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67186__$1,new cljs.core.Keyword(null,"_initial-open?","_initial-open?",-937885738));
var _STAR_toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67186__$1,new cljs.core.Keyword(null,"*toggle-fn","*toggle-fn",458369769));
var _on_toggle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67186__$1,new cljs.core.Keyword(null,"_on-toggle","_on-toggle",847598975));
var map__67187 = state;
var map__67187__$1 = cljs.core.__destructure_map(map__67187);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67187__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
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
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative","ui__dropdown-trigger",trigger_class], null))},[daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$1 ? content_fn.cljs$core$IFn$_invoke$arity$1(state) : content_fn.call(null,state))),daiquiri.interpreter.interpret((function (){var G__67190 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"in","in",-1531184865),cljs.core.deref(open_QMARK_),new cljs.core.Keyword(null,"timeout","timeout",-318625318),(0)], null);
var G__67191 = (function (dropdown_state){
if(cljs.core.truth_(cljs.core.deref(open_QMARK_))){
return frontend.ui.dropdown_content_wrapper(dropdown_state,close_fn,modal_content,modal_class,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),z_index], null));
} else {
return null;
}
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__67190,G__67191) : frontend.ui.css_transition.call(null,G__67190,G__67191));
})())]);
};
var G__67605 = function (state,content_fn,modal_content_fn,var_args){
var p__67182 = null;
if (arguments.length > 3) {
var G__67606__i = 0, G__67606__a = new Array(arguments.length -  3);
while (G__67606__i < G__67606__a.length) {G__67606__a[G__67606__i] = arguments[G__67606__i + 3]; ++G__67606__i;}
  p__67182 = new cljs.core.IndexedSeq(G__67606__a,0,null);
} 
return G__67605__delegate.call(this,state,content_fn,modal_content_fn,p__67182);};
G__67605.cljs$lang$maxFixedArity = 3;
G__67605.cljs$lang$applyTo = (function (arglist__67607){
var state = cljs.core.first(arglist__67607);
arglist__67607 = cljs.core.next(arglist__67607);
var content_fn = cljs.core.first(arglist__67607);
arglist__67607 = cljs.core.next(arglist__67607);
var modal_content_fn = cljs.core.first(arglist__67607);
var p__67182 = cljs.core.rest(arglist__67607);
return G__67605__delegate(state,content_fn,modal_content_fn,p__67182);
});
G__67605.cljs$core$IFn$_invoke$arity$variadic = G__67605__delegate;
return G__67605;
})()
,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.mixins.modal(new cljs.core.Keyword(null,"open?","open?",1238443125)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var opts_67608 = ((cljs.core.map_QMARK_(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))?cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)):cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.vec,cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))));
if(cljs.core.truth_(new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108).cljs$core$IFn$_invoke$arity$1(opts_67608))){
cljs.core.reset_BANG_(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state),true);
} else {
}

var on_toggle_67609 = new cljs.core.Keyword(null,"on-toggle","on-toggle",-695538774).cljs$core$IFn$_invoke$arity$1(opts_67608);
if(cljs.core.fn_QMARK_(on_toggle_67609)){
cljs.core.add_watch(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword("frontend.ui","listen-open-value","frontend.ui/listen-open-value",-184395002),(function (_,___$1,___$2,___$3){
var G__67192 = cljs.core.deref(new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(state));
return (on_toggle_67609.cljs$core$IFn$_invoke$arity$1 ? on_toggle_67609.cljs$core$IFn$_invoke$arity$1(G__67192) : on_toggle_67609.call(null,G__67192));
}));
} else {
}

return state;
})], null)], null),"frontend.ui/dropdown");
frontend.ui.render_keyboard_shortcut = (function frontend$ui$render_keyboard_shortcut(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67610 = arguments.length;
var i__5727__auto___67611 = (0);
while(true){
if((i__5727__auto___67611 < len__5726__auto___67610)){
args__5732__auto__.push((arguments[i__5727__auto___67611]));

var G__67612 = (i__5727__auto___67611 + (1));
i__5727__auto___67611 = G__67612;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic = (function (sequence,p__67195){
var map__67196 = p__67195;
var map__67196__$1 = cljs.core.__destructure_map(map__67196);
var opts = map__67196__$1;
var sequence__$1 = ((typeof sequence === 'string')?clojure.string.split.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(clojure.string.trim(sequence)),/ /):sequence);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.keyboard-shortcut","span.keyboard-shortcut",-1239684213),logseq.shui.ui.shortcut(sequence__$1,opts)], null);
}));

(frontend.ui.render_keyboard_shortcut.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.ui.render_keyboard_shortcut.cljs$lang$applyTo = (function (seq67193){
var G__67194 = cljs.core.first(seq67193);
var seq67193__$1 = cljs.core.next(seq67193);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67194,seq67193__$1);
}));

frontend.ui.menu_link = rum.core.lazy_build(rum.core.build_defc,(function (p__67197,child){
var map__67198 = p__67197;
var map__67198__$1 = cljs.core.__destructure_map(map__67198);
var options = map__67198__$1;
var only_child_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67198__$1,new cljs.core.Keyword(null,"only-child?","only-child?",1700034724));
var no_padding_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67198__$1,new cljs.core.Keyword(null,"no-padding?","no-padding?",1618158522));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67198__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67198__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
if(cljs.core.truth_(only_child_QMARK_)){
var attrs67199 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.Keyword(null,"only-child?","only-child?",1700034724));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67199))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["menu-link"], null)], null),attrs67199], 0))):{'className':"menu-link"}),((cljs.core.map_QMARK_(attrs67199))?[daiquiri.interpreter.interpret(child)]:[daiquiri.interpreter.interpret(attrs67199),daiquiri.interpreter.interpret(child)]));
} else {
var attrs67202 = (function (){var G__67207 = options;
var G__67207__$1 = ((no_padding_QMARK_ === true)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67207,new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)," no-padding"].join('')):G__67207);
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__67207__$1,new cljs.core.Keyword(null,"no-padding?","no-padding?",1618158522));

})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs67202))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-between","menu-link"], null)], null),attrs67202], 0))):{'className':"flex justify-between menu-link"}),((cljs.core.map_QMARK_(attrs67202))?[(function (){var attrs67203 = child;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67203))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs67203], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs67203))?null:[daiquiri.interpreter.interpret(attrs67203)]));
})(),(cljs.core.truth_(shortcut)?(function (){var attrs67204 = frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),false], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67204))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs67204], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs67204))?null:[daiquiri.interpreter.interpret(attrs67204)]));
})():null)]:[daiquiri.interpreter.interpret(attrs67202),(function (){var attrs67205 = child;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67205))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs67205], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs67205))?null:[daiquiri.interpreter.interpret(attrs67205)]));
})(),(cljs.core.truth_(shortcut)?(function (){var attrs67206 = frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),false], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67206))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs67206], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs67206))?null:[daiquiri.interpreter.interpret(attrs67206)]));
})():null)]));
}
}),null,"frontend.ui/menu-link");
frontend.ui.dropdown_with_links = rum.core.lazy_build(rum.core.build_defc,(function (content_fn,links,p__67208){
var map__67209 = p__67208;
var map__67209__$1 = cljs.core.__destructure_map(map__67209);
var opts = map__67209__$1;
var outer_header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67209__$1,new cljs.core.Keyword(null,"outer-header","outer-header",-1732961785));
var outer_footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67209__$1,new cljs.core.Keyword(null,"outer-footer","outer-footer",1884321739));
var links_header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67209__$1,new cljs.core.Keyword(null,"links-header","links-header",-1729119536));
var links_footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67209__$1,new cljs.core.Keyword(null,"links-footer","links-footer",1890937614));
return frontend.ui.dropdown(content_fn,(function (p__67220){
var map__67221 = p__67220;
var map__67221__$1 = cljs.core.__destructure_map(map__67221);
var close_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67221__$1,new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512));
var links_children = (function (){var links__$1 = ((cljs.core.fn_QMARK_(links))?(links.cljs$core$IFn$_invoke$arity$0 ? links.cljs$core$IFn$_invoke$arity$0() : links.call(null)):links);
var links__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,links__$1);
var iter__5480__auto__ = (function frontend$ui$iter__67222(s__67223){
return (new cljs.core.LazySeq(null,(function (){
var s__67223__$1 = s__67223;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67223__$1);
if(temp__5804__auto__){
var s__67223__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67223__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67223__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67225 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67224 = (0);
while(true){
if((i__67224 < size__5479__auto__)){
var map__67226 = cljs.core._nth(c__5478__auto__,i__67224);
var map__67226__$1 = cljs.core.__destructure_map(map__67226);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"options","options",99638489));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"title","title",636505583));
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"item","item",249373802));
var _as_link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67226__$1,new cljs.core.Keyword(null,"_as-link?","_as-link?",-2015408331));
cljs.core.chunk_append(b__67225,(function (){var new_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,(function (){var G__67227 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),hover_detail,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__67224,map__67226,map__67226__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,c__5478__auto__,size__5479__auto__,b__67225,s__67223__$2,temp__5804__auto__,links__$1,links__$2,map__67221,map__67221__$1,close_fn,map__67209,map__67209__$1,opts,outer_header,outer_footer,links_header,links_footer){
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
});})(i__67224,map__67226,map__67226__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,c__5478__auto__,size__5479__auto__,b__67225,s__67223__$2,temp__5804__auto__,links__$1,links__$2,map__67221,map__67221__$1,close_fn,map__67209,map__67209__$1,opts,outer_header,outer_footer,links_header,links_footer))
], null);
if(cljs.core.truth_(key)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67227,new cljs.core.Keyword(null,"key","key",-1516042587),key);
} else {
return G__67227;
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

var G__67613 = (i__67224 + (1));
i__67224 = G__67613;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67225),frontend$ui$iter__67222(cljs.core.chunk_rest(s__67223__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67225),null);
}
} else {
var map__67228 = cljs.core.first(s__67223__$2);
var map__67228__$1 = cljs.core.__destructure_map(map__67228);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"options","options",99638489));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"title","title",636505583));
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"item","item",249373802));
var _as_link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67228__$1,new cljs.core.Keyword(null,"_as-link?","_as-link?",-2015408331));
return cljs.core.cons((function (){var new_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,(function (){var G__67229 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),hover_detail,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__67228,map__67228__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,s__67223__$2,temp__5804__auto__,links__$1,links__$2,map__67221,map__67221__$1,close_fn,map__67209,map__67209__$1,opts,outer_header,outer_footer,links_header,links_footer){
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
});})(map__67228,map__67228__$1,icon_SINGLEQUOTE_,options,title,key,hr,hover_detail,item,_as_link_QMARK_,s__67223__$2,temp__5804__auto__,links__$1,links__$2,map__67221,map__67221__$1,close_fn,map__67209,map__67209__$1,opts,outer_header,outer_footer,links_header,links_footer))
], null);
if(cljs.core.truth_(key)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67229,new cljs.core.Keyword(null,"key","key",-1516042587),key);
} else {
return G__67229;
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
})(),frontend$ui$iter__67222(cljs.core.rest(s__67223__$2)));
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
var svg = (((status instanceof cljs.core.Keyword))?(function (){var G__67230 = status;
var G__67230__$1 = (((G__67230 instanceof cljs.core.Keyword))?G__67230.fqn:null);
switch (G__67230__$1) {
case "success":
var G__67231 = "circle-check";
var G__67232 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-success",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__67231,G__67232) : frontend.ui.icon.call(null,G__67231,G__67232));

break;
case "warning":
var G__67233 = "alert-circle";
var G__67234 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-warning",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__67233,G__67234) : frontend.ui.icon.call(null,G__67233,G__67234));

break;
case "error":
var G__67235 = "circle-x";
var G__67236 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-error",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__67235,G__67236) : frontend.ui.icon.call(null,G__67235,G__67236));

break;
default:
var G__67237 = "info-circle";
var G__67238 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-indigo-500",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null);
return (frontend.ui.icon.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.icon.cljs$core$IFn$_invoke$arity$2(G__67237,G__67238) : frontend.ui.icon.call(null,G__67237,G__67238));

}
})():status);
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exiting")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exited"))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),(-1)], null):null)),'className':"ui__notifications-content"},[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["max-w-sm","w-full","shadow-lg","rounded-lg","pointer-events-auto","notification-area",(function (){var G__67239 = state;
switch (G__67239) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__67239)].join('')));

}
})()], null))},[daiquiri.core.create_element("div",{'style':{'maxHeight':"calc(100vh - 200px)",'overflowY':"auto",'overflowX':"hidden"},'className':"rounded-lg shadow-xs"},[daiquiri.core.create_element("div",{'className':"p-4"},[daiquiri.core.create_element("div",{'className':"flex items-start"},[(function (){var attrs67240 = svg;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67240))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-shrink-0","pt-2"], null)], null),attrs67240], 0))):{'className':"flex-shrink-0 pt-2"}),((cljs.core.map_QMARK_(attrs67240))?null:[daiquiri.interpreter.interpret(attrs67240)]));
})(),daiquiri.core.create_element("div",{'className':"ml-3 w-0 flex-1 pt-2"},[daiquiri.core.create_element("div",{'style':{'margin':(0)},'className':"text-sm leading-5 font-medium whitespace-pre-line"},[daiquiri.interpreter.interpret(content)])]),daiquiri.core.create_element("div",{'style':{'marginTop':(-9),'marginRight':(-18)},'className':"flex-shrink-0 flex"},[daiquiri.interpreter.interpret((function (){var G__67242 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"button-props","button-props",-392655929),new cljs.core.PersistentArrayMap(null, 1, ["aria-label","Close"], null),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"hover:bg-transparent hover:text-foreground scale-90",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.notification.clear_BANG_(uid);
}),new cljs.core.Keyword(null,"icon","icon",1679606541),"x"], null);
return (frontend.ui.button.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.button.cljs$core$IFn$_invoke$arity$1(G__67242) : frontend.ui.button.call(null,G__67242));
})())])])])])])]);
} else {
return null;
}
}),null,"frontend.ui/notification-content");
frontend.ui.notification_clear_all = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"ui__notifications-content"},[(function (){var attrs67253 = (function (){var G__67254 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("notification","clear-all","notification/clear-all",-1229504749)], 0));
var G__67255 = new cljs.core.Keyword(null,"intent","intent",-390846953);
var G__67256 = "logseq";
var G__67257 = new cljs.core.Keyword(null,"on-click","on-click",1632826543);
var G__67258 = (function (){
return frontend.handler.notification.clear_all_BANG_();
});
return (frontend.ui.button.cljs$core$IFn$_invoke$arity$5 ? frontend.ui.button.cljs$core$IFn$_invoke$arity$5(G__67254,G__67255,G__67256,G__67257,G__67258) : frontend.ui.button.call(null,G__67254,G__67255,G__67256,G__67257,G__67258));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67253))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pointer-events-auto","notification-clear"], null)], null),attrs67253], 0))):{'className':"pointer-events-auto notification-clear"}),((cljs.core.map_QMARK_(attrs67253))?null:[daiquiri.interpreter.interpret(attrs67253)]));
})()]);
}),null,"frontend.ui/notification-clear-all");
frontend.ui.notification = rum.core.lazy_build(rum.core.build_defc,(function (){
var contents = frontend.state.sub(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618));
return daiquiri.interpreter.interpret((function (){var G__67265 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-name","class-name",945142584),"notifications ui__notifications"], null);
var G__67266 = (function (){var notifications = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (el){
var k = cljs.core.first(el);
var v = cljs.core.second(el);
var G__67267 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(k)], null);
var G__67268 = (function (state){
return frontend.ui.notification_content(state,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(v),k);
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__67267,G__67268) : frontend.ui.css_transition.call(null,G__67267,G__67268));
}),contents);
var clear_all = (((cljs.core.count(contents) > (1)))?(function (){var G__67269 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"k","k",-2146297393),"clear-all"], null);
var G__67270 = (function (_state){
return frontend.ui.notification_clear_all();
});
return (frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__67269,G__67270) : frontend.ui.css_transition.call(null,G__67269,G__67270));
})():null);
var items = (cljs.core.truth_(clear_all)?cljs.core.cons(clear_all,notifications):notifications);
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(items);
})();
return (frontend.ui.transition_group.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.transition_group.cljs$core$IFn$_invoke$arity$2(G__67265,G__67266) : frontend.ui.transition_group.call(null,G__67265,G__67266));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.ui/notification");
frontend.ui.humanity_time_ago = rum.core.lazy_build(rum.core.build_defc,(function (input,opts){
var time_fn = (function (){
try{return frontend.util.human_time(input);
}catch (e67275){var e = e67275;
console.error(e);

return input;
}});
var vec__67272 = rum.core.use_state(time_fn());
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67272,(0),null);
var set_time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67272,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var timer = setInterval((function (){
var G__67276 = time_fn();
return (set_time.cljs$core$IFn$_invoke$arity$1 ? set_time.cljs$core$IFn$_invoke$arity$1(G__67276) : set_time.call(null,G__67276));
}),((1000) * (30)));
return (function (){
return clearInterval(timer);
});
}),cljs.core.PersistentVector.EMPTY);

var attrs67271 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY,opts], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67271))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__humanity-time"], null)], null),attrs67271], 0))):{'className':"ui__humanity-time"}),((cljs.core.map_QMARK_(attrs67271))?[daiquiri.interpreter.interpret(time)]:[daiquiri.interpreter.interpret(attrs67271),daiquiri.interpreter.interpret(time)]));
}),null,"frontend.ui/humanity-time-ago");
frontend.ui.checkbox = (function frontend$ui$checkbox(option){
var on_change_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-change","on-change",-732046149).cljs$core$IFn$_invoke$arity$1(option);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(option);
var option__$1 = (function (){var G__67277 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"on-change","on-change",-732046149),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543)], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = on_change_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return on_click_SINGLEQUOTE_;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67277,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__67278_67616 = on_click_SINGLEQUOTE_;
if((G__67278_67616 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__67278_67616,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}

var checked_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.target.dataset.state,"checked");
(e.target.checked = (!(checked_QMARK_)));

var G__67279 = on_change_SINGLEQUOTE_;
if((G__67279 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__67279,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}
}));
} else {
return G__67277;
}
})();
var G__67280 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"disabled","disabled",-1529784218).cljs$core$IFn$_invoke$arity$1(option__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.publishing_QMARK_;
}
})()], null)], 0));
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__67280) : logseq.shui.ui.checkbox.call(null,G__67280));
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
var seq__67285_67617 = cljs.core.seq(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["persist-zoom-level",((function (cl){
return (function (p1__67281_SHARP_){
return frontend.storage.set(new cljs.core.Keyword(null,"zoom-level","zoom-level",-91022225),p1__67281_SHARP_);
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
return (function (p1__67282_SHARP_){
cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(cl,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__67282_SHARP_,"enter"))?"add":"remove"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["is-fullscreen"], 0));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-fullscreen?","electron/window-fullscreen?",-499490630),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__67282_SHARP_,"enter"));
});})(cl))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["maximize",((function (cl){
return (function (p1__67283_SHARP_){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","window-maximized?","electron/window-maximized?",-1905378935),p1__67283_SHARP_);
});})(cl))
], null)], null));
var chunk__67286_67618 = null;
var count__67287_67619 = (0);
var i__67288_67620 = (0);
while(true){
if((i__67288_67620 < count__67287_67619)){
var vec__67295_67621 = chunk__67286_67618.cljs$core$IIndexed$_nth$arity$2(null,i__67288_67620);
var event_67622 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67295_67621,(0),null);
var function_67623 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67295_67621,(1),null);
window.apis.on(event_67622,function_67623);


var G__67624 = seq__67285_67617;
var G__67625 = chunk__67286_67618;
var G__67626 = count__67287_67619;
var G__67627 = (i__67288_67620 + (1));
seq__67285_67617 = G__67624;
chunk__67286_67618 = G__67625;
count__67287_67619 = G__67626;
i__67288_67620 = G__67627;
continue;
} else {
var temp__5804__auto___67628 = cljs.core.seq(seq__67285_67617);
if(temp__5804__auto___67628){
var seq__67285_67629__$1 = temp__5804__auto___67628;
if(cljs.core.chunked_seq_QMARK_(seq__67285_67629__$1)){
var c__5525__auto___67630 = cljs.core.chunk_first(seq__67285_67629__$1);
var G__67631 = cljs.core.chunk_rest(seq__67285_67629__$1);
var G__67632 = c__5525__auto___67630;
var G__67633 = cljs.core.count(c__5525__auto___67630);
var G__67634 = (0);
seq__67285_67617 = G__67631;
chunk__67286_67618 = G__67632;
count__67287_67619 = G__67633;
i__67288_67620 = G__67634;
continue;
} else {
var vec__67298_67635 = cljs.core.first(seq__67285_67629__$1);
var event_67636 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67298_67635,(0),null);
var function_67637 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67298_67635,(1),null);
window.apis.on(event_67636,function_67637);


var G__67638 = cljs.core.next(seq__67285_67629__$1);
var G__67639 = null;
var G__67640 = (0);
var G__67641 = (0);
seq__67285_67617 = G__67638;
chunk__67286_67618 = G__67639;
count__67287_67619 = G__67640;
i__67288_67620 = G__67641;
continue;
}
} else {
}
}
break;
}

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"getAppBaseInfo","getAppBaseInfo",-1406218507)], 0)),(function (p1__67284_SHARP_){
var map__67301 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__67284_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var map__67301__$1 = cljs.core.__destructure_map(map__67301);
var isFullScreen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67301__$1,new cljs.core.Keyword(null,"isFullScreen","isFullScreen",-1879720011));
var isMaximized = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67301__$1,new cljs.core.Keyword(null,"isMaximized","isMaximized",-2003319926));
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
}catch (e67302){var _error_67642 = e67302;
schemaMedia.addListener(frontend.state.sync_system_theme_BANG_);
}
frontend.state.sync_system_theme_BANG_();

return (function (){
try{return schemaMedia.removeEventListener("change",frontend.state.sync_system_theme_BANG_);
}catch (e67303){var _error = e67303;
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
var handler_67643 = (cljs.core.truth_(down_QMARK_)?cljs.core.conj:cljs.core.disj);
var keystroke_67644 = e.key;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(active_keystroke,handler_67643,keystroke_67644);

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
frontend.ui.auto_complete = rum.core.lazy_build(rum.core.build_defcs,(function (state,matched,p__67304){
var map__67305 = p__67304;
var map__67305__$1 = cljs.core.__destructure_map(map__67305);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var on_shift_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"on-shift-chosen","on-shift-chosen",-310778328));
var get_group_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"get-group-name","get-group-name",-160379696));
var empty_placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085));
var item_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"item-render","item-render",253627868));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"header","header",119441134));
var grouped_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67305__$1,new cljs.core.Keyword(null,"grouped?","grouped?",531080948));
var _STAR_current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
var _STAR_groups = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var render_f = (function (matched__$1){
var iter__5480__auto__ = (function frontend$ui$iter__67306(s__67307){
return (new cljs.core.LazySeq(null,(function (){
var s__67307__$1 = s__67307;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67307__$1);
if(temp__5804__auto__){
var s__67307__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67307__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67307__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67309 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67308 = (0);
while(true){
if((i__67308 < size__5479__auto__)){
var vec__67310 = cljs.core._nth(c__5478__auto__,i__67308);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67310,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67310,(1),null);
cljs.core.chunk_append(b__67309,(function (){var react_key = cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx);
var item_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.menu-link-wrap","div.menu-link-wrap",2002705411),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),react_key,new cljs.core.Keyword(null,"on-mouse-move","on-mouse-move",-1386320874),((function (i__67308,react_key,vec__67310,idx,item,c__5478__auto__,size__5479__auto__,b__67309,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_current_idx,idx);
});})(i__67308,react_key,vec__67310,idx,item,c__5478__auto__,size__5479__auto__,b__67309,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(function (){var chosen_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_current_idx),idx);
return frontend.ui.menu_link(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),["ac-",react_key].join(''),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"class","class",-2030961996),((chosen_QMARK_)?"chosen":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__67308,chosen_QMARK_,react_key,vec__67310,idx,item,c__5478__auto__,size__5479__auto__,b__67309,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
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
});})(i__67308,chosen_QMARK_,react_key,vec__67310,idx,item,c__5478__auto__,size__5479__auto__,b__67309,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
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

var G__67645 = (i__67308 + (1));
i__67308 = G__67645;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67309),frontend$ui$iter__67306(cljs.core.chunk_rest(s__67307__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67309),null);
}
} else {
var vec__67313 = cljs.core.first(s__67307__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67313,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67313,(1),null);
return cljs.core.cons((function (){var react_key = cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx);
var item_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.menu-link-wrap","div.menu-link-wrap",2002705411),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),react_key,new cljs.core.Keyword(null,"on-mouse-move","on-mouse-move",-1386320874),((function (react_key,vec__67313,idx,item,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_current_idx,idx);
});})(react_key,vec__67313,idx,item,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
], null),(function (){var chosen_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_current_idx),idx);
return frontend.ui.menu_link(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),["ac-",react_key].join(''),new cljs.core.Keyword(null,"tab-index","tab-index",895755393),"0",new cljs.core.Keyword(null,"class","class",-2030961996),((chosen_QMARK_)?"chosen":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (chosen_QMARK_,react_key,vec__67313,idx,item,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
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
});})(chosen_QMARK_,react_key,vec__67313,idx,item,s__67307__$2,temp__5804__auto__,_STAR_current_idx,_STAR_groups,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
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
})(),frontend$ui$iter__67306(cljs.core.rest(s__67307__$2)));
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
return daiquiri.core.create_element("div",{'id':"ui__ac",'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$], null))},[((cljs.core.seq(matched))?(function (){var attrs67316 = (cljs.core.truth_(header)?header:null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67316))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"ui__ac-inner",new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["hide-scrollbar"], null)], null),attrs67316], 0))):{'id':"ui__ac-inner",'className':"hide-scrollbar"}),((cljs.core.map_QMARK_(attrs67316))?[(cljs.core.truth_(grouped_QMARK_)?(function (){var _STAR_idx = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1));
var inc_idx = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_idx,cljs.core.inc);
});
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67317(s__67318){
return (new cljs.core.LazySeq(null,(function (){
var s__67318__$1 = s__67318;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67318__$1);
if(temp__5804__auto__){
var s__67318__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67318__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67318__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67320 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67319 = (0);
while(true){
if((i__67319 < size__5479__auto__)){
var vec__67321 = cljs.core._nth(c__5478__auto__,i__67319);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67321,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67321,(1),null);
cljs.core.chunk_append(b__67320,(function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__67319,vec__67321,group,matched__$1,c__5478__auto__,size__5479__auto__,b__67320,s__67318__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(i__67319,vec__67321,group,matched__$1,c__5478__auto__,size__5479__auto__,b__67320,s__67318__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs67324 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67324))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs67324], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs67324))?null:[daiquiri.interpreter.interpret(attrs67324)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})());

var G__67646 = (i__67319 + (1));
i__67319 = G__67646;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67320),frontend$ui$iter__67317(cljs.core.chunk_rest(s__67318__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67320),null);
}
} else {
var vec__67325 = cljs.core.first(s__67318__$2);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67325,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67325,(1),null);
return cljs.core.cons((function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__67325,group,matched__$1,s__67318__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(vec__67325,group,matched__$1,s__67318__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs67324 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67324))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs67324], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs67324))?null:[daiquiri.interpreter.interpret(attrs67324)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})(),frontend$ui$iter__67317(cljs.core.rest(s__67318__$2)));
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
})():daiquiri.interpreter.interpret(render_f(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(matched))))]:[daiquiri.interpreter.interpret(attrs67316),(cljs.core.truth_(grouped_QMARK_)?(function (){var _STAR_idx = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1));
var inc_idx = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_idx,cljs.core.inc);
});
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67328(s__67329){
return (new cljs.core.LazySeq(null,(function (){
var s__67329__$1 = s__67329;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67329__$1);
if(temp__5804__auto__){
var s__67329__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67329__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67329__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67331 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67330 = (0);
while(true){
if((i__67330 < size__5479__auto__)){
var vec__67332 = cljs.core._nth(c__5478__auto__,i__67330);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67332,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67332,(1),null);
cljs.core.chunk_append(b__67331,(function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__67330,vec__67332,group,matched__$1,c__5478__auto__,size__5479__auto__,b__67331,s__67329__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(i__67330,vec__67332,group,matched__$1,c__5478__auto__,size__5479__auto__,b__67331,s__67329__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs67335 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67335))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs67335], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs67335))?null:[daiquiri.interpreter.interpret(attrs67335)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})());

var G__67647 = (i__67330 + (1));
i__67330 = G__67647;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67331),frontend$ui$iter__67328(cljs.core.chunk_rest(s__67329__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67331),null);
}
} else {
var vec__67336 = cljs.core.first(s__67329__$2);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67336,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67336,(1),null);
return cljs.core.cons((function (){var matched_SINGLEQUOTE_ = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__67336,group,matched__$1,s__67329__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_){
return (function (item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inc_idx(),item], null);
});})(vec__67336,group,matched__$1,s__67329__$2,temp__5804__auto__,_STAR_idx,inc_idx,attrs67316,_STAR_current_idx,_STAR_groups,render_f,map__67305,map__67305__$1,on_chosen,on_shift_chosen,get_group_name,empty_placeholder,item_render,class$,header,grouped_QMARK_))
,matched__$1));
if(cljs.core.truth_(group)){
return daiquiri.core.create_element("div",null,[(function (){var attrs67335 = group;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67335))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__ac-group-name"], null)], null),attrs67335], 0))):{'className':"ui__ac-group-name"}),((cljs.core.map_QMARK_(attrs67335))?null:[daiquiri.interpreter.interpret(attrs67335)]));
})(),daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_))]);
} else {
return daiquiri.interpreter.interpret(render_f(matched_SINGLEQUOTE_));
}
})(),frontend$ui$iter__67328(cljs.core.rest(s__67329__$2)));
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
var G__67340 = arguments.length;
switch (G__67340) {
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
var len__5726__auto___67649 = arguments.length;
var i__5727__auto___67650 = (0);
while(true){
if((i__5727__auto___67650 < len__5726__auto___67649)){
args__5732__auto__.push((arguments[i__5727__auto___67650]));

var G__67651 = (i__5727__auto___67650 + (1));
i__5727__auto___67650 = G__67651;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.keyboard_shortcut_from_config.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.keyboard_shortcut_from_config.cljs$core$IFn$_invoke$arity$variadic = (function (shortcut_name,p__67343){
var map__67344 = p__67343;
var map__67344__$1 = cljs.core.__destructure_map(map__67344);
var pick_first_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67344__$1,new cljs.core.Keyword(null,"pick-first?","pick-first?",-2055544652));
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
(frontend.ui.keyboard_shortcut_from_config.cljs$lang$applyTo = (function (seq67341){
var G__67342 = cljs.core.first(seq67341);
var seq67341__$1 = cljs.core.next(seq67341);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67342,seq67341__$1);
}));

frontend.ui.loading = (function frontend$ui$loading(var_args){
var G__67346 = arguments.length;
switch (G__67346) {
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
frontend.ui.foldable_title = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__67347){
var map__67348 = p__67347;
var map__67348__$1 = cljs.core.__destructure_map(map__67348);
var on_pointer_down = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67348__$1,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67348__$1,new cljs.core.Keyword(null,"header","header",119441134));
var title_trigger_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67348__$1,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67348__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var control_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","control?","frontend.ui/control?",1642964409));
return daiquiri.core.create_element("div",{'className':"ls-foldable-title content"},[(function (){var attrs67351 = (function (){var G__67352 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
return cljs.core.reset_BANG_(control_QMARK_,true);
}),new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.reset_BANG_(control_QMARK_,false);
})], null);
if(cljs.core.truth_(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__67352,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"cursor"], 0));
} else {
return G__67352;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67351))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1","flex-row","foldable-title"], null)], null),attrs67351], 0))):{'className':"flex-1 flex-row foldable-title"}),((cljs.core.map_QMARK_(attrs67351))?[daiquiri.core.create_element("div",{'onClick':(function (e){
var target = e.target;
if(cljs.core.truth_((function (){var G__67353 = target;
if((G__67353 == null)){
return null;
} else {
return G__67353.closest(".as-toggle");
}
})())){
return cljs.core.reset_BANG_(collapsed_QMARK_,cljs.core.not(cljs.core.deref(collapsed_QMARK_)));
} else {
return null;
}
}),'className':"flex flex-row items-center ls-foldable-header gap-1"},[(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:(function (){var style = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(14),new cljs.core.Keyword(null,"height","height",1025178622),(16)], null);
var attrs67356 = (function (){var G__67357 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null);
if(cljs.core.not(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67357,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down);
} else {
return G__67357;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs67356))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-foldable-title-control","block-control","opacity-50","hover:opacity-100"], null)], null),attrs67356], 0))):{'className':"ls-foldable-title-control block-control opacity-50 hover:opacity-100"}),((cljs.core.map_QMARK_(attrs67356))?[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]:[daiquiri.interpreter.interpret(attrs67356),daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]));
})()),((cljs.core.fn_QMARK_(header))?daiquiri.interpreter.interpret((function (){var G__67359 = cljs.core.deref(collapsed_QMARK_);
return (header.cljs$core$IFn$_invoke$arity$1 ? header.cljs$core$IFn$_invoke$arity$1(G__67359) : header.call(null,G__67359));
})()):daiquiri.interpreter.interpret(header))])]:[daiquiri.interpreter.interpret(attrs67351),daiquiri.core.create_element("div",{'onClick':(function (e){
var target = e.target;
if(cljs.core.truth_((function (){var G__67360 = target;
if((G__67360 == null)){
return null;
} else {
return G__67360.closest(".as-toggle");
}
})())){
return cljs.core.reset_BANG_(collapsed_QMARK_,cljs.core.not(cljs.core.deref(collapsed_QMARK_)));
} else {
return null;
}
}),'className':"flex flex-row items-center ls-foldable-header gap-1"},[(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:(function (){var style = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(14),new cljs.core.Keyword(null,"height","height",1025178622),(16)], null);
var attrs67363 = (function (){var G__67364 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null);
if(cljs.core.not(title_trigger_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67364,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down);
} else {
return G__67364;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs67363))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-foldable-title-control","block-control","opacity-50","hover:opacity-100"], null)], null),attrs67363], 0))):{'className':"ls-foldable-title-control block-control opacity-50 hover:opacity-100"}),((cljs.core.map_QMARK_(attrs67363))?[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]:[daiquiri.interpreter.interpret(attrs67363),daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.deref(control_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(collapsed_QMARK_);
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(collapsed_QMARK_))])]));
})()),((cljs.core.fn_QMARK_(header))?daiquiri.interpreter.interpret((function (){var G__67366 = cljs.core.deref(collapsed_QMARK_);
return (header.cljs$core$IFn$_invoke$arity$1 ? header.cljs$core$IFn$_invoke$arity$1(G__67366) : header.call(null,G__67366));
})()):daiquiri.interpreter.interpret(header))])]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.ui","control?","frontend.ui/control?",1642964409))], null),"frontend.ui/foldable-title");
frontend.ui.foldable = rum.core.lazy_build(rum.core.build_defcs,(function (state,header,content,p__67367){
var map__67368 = p__67367;
var map__67368__$1 = cljs.core.__destructure_map(map__67368);
var title_trigger_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67368__$1,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873));
var on_pointer_down = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67368__$1,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67368__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var _default_collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67368__$1,new cljs.core.Keyword(null,"_default-collapsed?","_default-collapsed?",1256331234));
var _init_collapsed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67368__$1,new cljs.core.Keyword(null,"_init-collapsed","_init-collapsed",282845909));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586));
var on_pointer_down__$1 = (function (e){
frontend.util.stop(e);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(collapsed_QMARK_,cljs.core.not);

if(cljs.core.truth_(on_pointer_down)){
var G__67369 = cljs.core.deref(collapsed_QMARK_);
return (on_pointer_down.cljs$core$IFn$_invoke$arity$1 ? on_pointer_down.cljs$core$IFn$_invoke$arity$1(G__67369) : on_pointer_down.call(null,G__67369));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col",class$], null))},[frontend.ui.foldable_title(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down__$1,new cljs.core.Keyword(null,"header","header",119441134),header,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),title_trigger_QMARK_,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK_], null)),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(cljs.core.deref(collapsed_QMARK_))?"hidden":"initial")], null))},[((cljs.core.fn_QMARK_(content))?((cljs.core.not(cljs.core.deref(collapsed_QMARK_)))?daiquiri.interpreter.interpret((content.cljs$core$IFn$_invoke$arity$0 ? content.cljs$core$IFn$_invoke$arity$0() : content.call(null))):null):daiquiri.interpreter.interpret(content))])]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.db_mixins.query,rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var args_67653 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
if(new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823).cljs$core$IFn$_invoke$arity$1(cljs.core.last(args_67653)) === true){
cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586)),true);
} else {
}

return state;
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var temp__5804__auto___67654 = new cljs.core.Keyword(null,"init-collapsed","init-collapsed",-220931385).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(temp__5804__auto___67654)){
var f_67655 = temp__5804__auto___67654;
var G__67370_67656 = new cljs.core.Keyword("frontend.ui","collapsed?","frontend.ui/collapsed?",-772841586).cljs$core$IFn$_invoke$arity$1(state);
(f_67655.cljs$core$IFn$_invoke$arity$1 ? f_67655.cljs$core$IFn$_invoke$arity$1(G__67370_67656) : f_67655.call(null,G__67370_67656));
} else {
}

return state;
})], null)], null),"frontend.ui/foldable");
frontend.ui.admonition = rum.core.lazy_build(rum.core.build_defc,(function (type,content){
var type__$1 = cljs.core.name(type);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__67372 = clojure.string.lower_case(type__$1);
switch (G__67372) {
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
frontend.ui.catch_error = rum.core.lazy_build(rum.core.build_defcs,(function (p__67373,error_view,view){
var map__67374 = p__67373;
var map__67374__$1 = cljs.core.__destructure_map(map__67374);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67374__$1,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008));
var c = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67374__$1,new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248));
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
frontend.ui.catch_error_and_notify = rum.core.lazy_build(rum.core.build_defcs,(function (p__67375,error_view,view){
var map__67376 = p__67375;
var map__67376__$1 = cljs.core.__destructure_map(map__67376);
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67376__$1,new cljs.core.Keyword("frontend.ui","error","frontend.ui/error",-2009366008));
var c = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67376__$1,new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248));
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
frontend.ui.block_error = rum.core.lazy_build(rum.core.build_defc,(function (title,p__67378){
var map__67379 = p__67378;
var map__67379__$1 = cljs.core.__destructure_map(map__67379);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67379__$1,new cljs.core.Keyword(null,"content","content",15833224));
var section_attrs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67379__$1,new cljs.core.Keyword(null,"section-attrs","section-attrs",1373816150));
var attrs67377 = section_attrs;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs67377))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["border","mt-1","p-1","cursor-pointer","block-content-fallback-ui","w-full"], null)], null),attrs67377], 0))):{'className':"border mt-1 p-1 cursor-pointer block-content-fallback-ui w-full"}),((cljs.core.map_QMARK_(attrs67377))?[daiquiri.core.create_element("div",{'className':"flex justify-between items-center px-1"},[(function (){var attrs67380 = title;
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs67380))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-error","pb-1"], null)], null),attrs67380], 0))):{'className':"text-error pb-1"}),((cljs.core.map_QMARK_(attrs67380))?null:[daiquiri.interpreter.interpret(attrs67380)]));
})(),daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'target':"_blank",'className':"text-xs opacity-50 hover:opacity-80"},["report issue"])]),(cljs.core.truth_(content)?daiquiri.core.create_element("pre",{'className':"m-0 text-sm"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)]):null)]:[daiquiri.interpreter.interpret(attrs67377),daiquiri.core.create_element("div",{'className':"flex justify-between items-center px-1"},[(function (){var attrs67383 = title;
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs67383))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-error","pb-1"], null)], null),attrs67383], 0))):{'className':"text-error pb-1"}),((cljs.core.map_QMARK_(attrs67383))?null:[daiquiri.interpreter.interpret(attrs67383)]));
})(),daiquiri.core.create_element("a",{'href':"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",'target':"_blank",'className':"text-xs opacity-50 hover:opacity-80"},["report issue"])]),(cljs.core.truth_(content)?daiquiri.core.create_element("pre",{'className':"m-0 text-sm"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)]):null)]));
}),null,"frontend.ui/block-error");
/**
 * Well styled error message for higher level components. Currently same as
 *   block-error but this could change
 */
frontend.ui.component_error = frontend.ui.block_error;
frontend.ui.select = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__67658 = null;
var G__67658__2 = (function (options,on_change){
return daiquiri.interpreter.interpret((function (){var G__67396 = options;
var G__67397 = on_change;
var G__67398 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.ui.select.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.select.cljs$core$IFn$_invoke$arity$3(G__67396,G__67397,G__67398) : frontend.ui.select.call(null,G__67396,G__67397,G__67398));
})());
});
var G__67658__3 = (function (options,on_change,select_options){
var attrs67386 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"form-select",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var value = frontend.util.evalue(e);
return (on_change.cljs$core$IFn$_invoke$arity$2 ? on_change.cljs$core$IFn$_invoke$arity$2(e,value) : on_change.call(null,e,value));
})], null),select_options], 0));
return daiquiri.core.create_element("select",((cljs.core.map_QMARK_(attrs67386))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-6","block","text-base","leading-6","border-gray-300","focus:outline-none","focus:shadow-outline-blue","focus:border-blue-300","sm:text-sm","sm:leading-5"], null)], null),attrs67386], 0))):{'className':"pl-6 block text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5"}),((cljs.core.map_QMARK_(attrs67386))?[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67399(s__67400){
return (new cljs.core.LazySeq(null,(function (){
var s__67400__$1 = s__67400;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67400__$1);
if(temp__5804__auto__){
var s__67400__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67400__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67400__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67402 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67401 = (0);
while(true){
if((i__67401 < size__5479__auto__)){
var map__67403 = cljs.core._nth(c__5478__auto__,i__67401);
var map__67403__$1 = cljs.core.__destructure_map(map__67403);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67403__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67403__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67403__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67403__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
cljs.core.chunk_append(b__67402,(function (){var attrs67389 = (function (){var G__67404 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__67404__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67404,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__67404);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67404__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__67404__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs67389))?daiquiri.interpreter.element_attributes(attrs67389):null),((cljs.core.map_QMARK_(attrs67389))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs67389),daiquiri.interpreter.interpret(label)]));
})());

var G__67659 = (i__67401 + (1));
i__67401 = G__67659;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67402),frontend$ui$iter__67399(cljs.core.chunk_rest(s__67400__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67402),null);
}
} else {
var map__67405 = cljs.core.first(s__67400__$2);
var map__67405__$1 = cljs.core.__destructure_map(map__67405);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67405__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67405__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67405__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67405__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
return cljs.core.cons((function (){var attrs67389 = (function (){var G__67406 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__67406__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67406,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__67406);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67406__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__67406__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs67389))?daiquiri.interpreter.element_attributes(attrs67389):null),((cljs.core.map_QMARK_(attrs67389))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs67389),daiquiri.interpreter.interpret(label)]));
})(),frontend$ui$iter__67399(cljs.core.rest(s__67400__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})())]:[daiquiri.interpreter.interpret(attrs67386),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67407(s__67408){
return (new cljs.core.LazySeq(null,(function (){
var s__67408__$1 = s__67408;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67408__$1);
if(temp__5804__auto__){
var s__67408__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67408__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67408__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67410 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67409 = (0);
while(true){
if((i__67409 < size__5479__auto__)){
var map__67411 = cljs.core._nth(c__5478__auto__,i__67409);
var map__67411__$1 = cljs.core.__destructure_map(map__67411);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67411__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67411__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67411__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67411__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
cljs.core.chunk_append(b__67410,(function (){var attrs67392 = (function (){var G__67412 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__67412__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67412,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__67412);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67412__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__67412__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs67392))?daiquiri.interpreter.element_attributes(attrs67392):null),((cljs.core.map_QMARK_(attrs67392))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs67392),daiquiri.interpreter.interpret(label)]));
})());

var G__67660 = (i__67409 + (1));
i__67409 = G__67660;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67410),frontend$ui$iter__67407(cljs.core.chunk_rest(s__67408__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67410),null);
}
} else {
var map__67413 = cljs.core.first(s__67408__$2);
var map__67413__$1 = cljs.core.__destructure_map(map__67413);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67413__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67413__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67413__$1,new cljs.core.Keyword(null,"selected","selected",574897764),false);
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67413__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),false);
return cljs.core.cons((function (){var attrs67392 = (function (){var G__67414 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})()], null);
var G__67414__$1 = (cljs.core.truth_(disabled)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67414,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled):G__67414);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67414__$1,new cljs.core.Keyword(null,"selected","selected",574897764),selected);
} else {
return G__67414__$1;
}
})();
return daiquiri.core.create_element("option",((cljs.core.map_QMARK_(attrs67392))?daiquiri.interpreter.element_attributes(attrs67392):null),((cljs.core.map_QMARK_(attrs67392))?[daiquiri.interpreter.interpret(label)]:[daiquiri.interpreter.interpret(attrs67392),daiquiri.interpreter.interpret(label)]));
})(),frontend$ui$iter__67407(cljs.core.rest(s__67408__$2)));
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
G__67658 = function(options,on_change,select_options){
switch(arguments.length){
case 2:
return G__67658__2.call(this,options,on_change);
case 3:
return G__67658__3.call(this,options,on_change,select_options);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__67658.cljs$core$IFn$_invoke$arity$2 = G__67658__2;
G__67658.cljs$core$IFn$_invoke$arity$3 = G__67658__3;
return G__67658;
})()
,null,"frontend.ui/select");
frontend.ui.radio_list = rum.core.lazy_build(rum.core.build_defc,(function (options,on_change,class$){
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__radio-list",class$], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67416(s__67417){
return (new cljs.core.LazySeq(null,(function (){
var s__67417__$1 = s__67417;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67417__$1);
if(temp__5804__auto__){
var s__67417__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67417__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67417__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67419 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67418 = (0);
while(true){
if((i__67418 < size__5479__auto__)){
var map__67420 = cljs.core._nth(c__5478__auto__,i__67418);
var map__67420__$1 = cljs.core.__destructure_map(map__67420);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67420__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67420__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67420__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__67419,daiquiri.core.create_element("label",{'key':["radio-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"radio",'onChange':rum.core.mark_sync_update(((function (i__67418,map__67420,map__67420__$1,label,value,selected,c__5478__auto__,size__5479__auto__,b__67419,s__67417__$2,temp__5804__auto__){
return (function (p1__67415_SHARP_){
var G__67421 = frontend.util.evalue(p1__67415_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__67421) : on_change.call(null,G__67421));
});})(i__67418,map__67420,map__67420__$1,label,value,selected,c__5478__auto__,size__5479__auto__,b__67419,s__67417__$2,temp__5804__auto__))
),'checked':selected,'className':"form-radio"},[]),daiquiri.interpreter.interpret(label)]));

var G__67661 = (i__67418 + (1));
i__67418 = G__67661;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67419),frontend$ui$iter__67416(cljs.core.chunk_rest(s__67417__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67419),null);
}
} else {
var map__67422 = cljs.core.first(s__67417__$2);
var map__67422__$1 = cljs.core.__destructure_map(map__67422);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67422__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67422__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67422__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons(daiquiri.core.create_element("label",{'key':["radio-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"radio",'onChange':rum.core.mark_sync_update(((function (map__67422,map__67422__$1,label,value,selected,s__67417__$2,temp__5804__auto__){
return (function (p1__67415_SHARP_){
var G__67423 = frontend.util.evalue(p1__67415_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__67423) : on_change.call(null,G__67423));
});})(map__67422,map__67422__$1,label,value,selected,s__67417__$2,temp__5804__auto__))
),'checked':selected,'className':"form-radio"},[]),daiquiri.interpreter.interpret(label)]),frontend$ui$iter__67416(cljs.core.rest(s__67417__$2)));
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
var G__67424 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(checked_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(checked_vals,value):cljs.core.disj.cljs$core$IFn$_invoke$arity$2(checked_vals,value)));
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__67424) : on_change.call(null,G__67424));
});
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__checkbox-list",class$], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67425(s__67426){
return (new cljs.core.LazySeq(null,(function (){
var s__67426__$1 = s__67426;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67426__$1);
if(temp__5804__auto__){
var s__67426__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67426__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67426__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67428 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67427 = (0);
while(true){
if((i__67427 < size__5479__auto__)){
var map__67429 = cljs.core._nth(c__5478__auto__,i__67427);
var map__67429__$1 = cljs.core.__destructure_map(map__67429);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67429__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67429__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67429__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
cljs.core.chunk_append(b__67428,daiquiri.core.create_element("label",{'key':["check-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"checkbox",'onChange':rum.core.mark_sync_update(on_item_change),'checked':selected,'className':"form-checkbox"},[]),daiquiri.interpreter.interpret(label)]));

var G__67662 = (i__67427 + (1));
i__67427 = G__67662;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67428),frontend$ui$iter__67425(cljs.core.chunk_rest(s__67426__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67428),null);
}
} else {
var map__67430 = cljs.core.first(s__67426__$2);
var map__67430__$1 = cljs.core.__destructure_map(map__67430);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67430__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67430__$1,new cljs.core.Keyword(null,"value","value",305978217));
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67430__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
return cljs.core.cons(daiquiri.core.create_element("label",{'key':["check-list-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('')},[daiquiri.core.create_element("input",{'value':value,'type':"checkbox",'onChange':rum.core.mark_sync_update(on_item_change),'checked':selected,'className':"form-checkbox"},[]),daiquiri.interpreter.interpret(label)]),frontend$ui$iter__67425(cljs.core.rest(s__67426__$2)));
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
frontend.ui.slider = rum.core.lazy_build(rum.core.build_defcs,(function (state,_default_value,p__67433){
var map__67434 = p__67433;
var map__67434__$1 = cljs.core.__destructure_map(map__67434);
var max_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67434__$1,new cljs.core.Keyword(null,"max","max",61366548));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67434__$1,new cljs.core.Keyword(null,"min","min",444991522));
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67434__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var _STAR_value = new cljs.core.Keyword("frontend.ui","value","frontend.ui/value",-1486153895).cljs$core$IFn$_invoke$arity$1(state);
var value = rum.core.react(_STAR_value);
var value_SINGLEQUOTE_ = (value | (0));
if(cljs.core.int_QMARK_(value_SINGLEQUOTE_)){
} else {
throw (new Error("Assert failed: (int? value')"));
}

return daiquiri.core.create_element("input",{'type':"range",'value':value_SINGLEQUOTE_,'min':min,'max':max_SINGLEQUOTE_,'style':{'width':"100%"},'onChange':rum.core.mark_sync_update((function (p1__67431_SHARP_){
var value__$1 = frontend.util.evalue(p1__67431_SHARP_);
return cljs.core.reset_BANG_(_STAR_value,value__$1);
})),'onPointerUp':(function (p1__67432_SHARP_){
var value__$1 = frontend.util.evalue(p1__67432_SHARP_);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value__$1) : on_change.call(null,value__$1));
}),'className':"cursor-pointer"},[]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.ui","value","frontend.ui/value",-1486153895),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))));
})], null)], null),"frontend.ui/slider");
frontend.ui.tweet_embed = rum.core.lazy_build(rum.core.build_defcs,(function (state,id){
var _STAR_loading_QMARK_ = new cljs.core.Keyword(null,"loading?","loading?",1905707049).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",null,[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(cljs.core.deref(_STAR_loading_QMARK_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.svg.loading," ... loading"], null)], null):null),(function (){var G__67435 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),"contents",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"theme","theme",-1247880880),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132)),"dark"))?"dark":null)], null),new cljs.core.Keyword(null,"on-tweet-load-success","on-tweet-load-success",1698437749),(function (){
return cljs.core.reset_BANG_(_STAR_loading_QMARK_,false);
})], null);
return (frontend.ui.ReactTweetEmbed.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.ReactTweetEmbed.cljs$core$IFn$_invoke$arity$1(G__67435) : frontend.ui.ReactTweetEmbed.call(null,G__67435));
})()], null))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(true,new cljs.core.Keyword(null,"loading?","loading?",1905707049))], null),"frontend.ui/tweet-embed");
frontend.ui.icon = logseq.shui.icon.v2.root;
frontend.ui.button_inner = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__67663__delegate = function (text,p__67436){
var map__67437 = p__67436;
var map__67437__$1 = cljs.core.__destructure_map(map__67437);
var opts = map__67437__$1;
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var variant = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"variant","variant",-424354234));
var button_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"button-props","button-props",-392655929));
var background = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"background","background",-863952629));
var icon_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875));
var small_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67437__$1,new cljs.core.Keyword(null,"small?","small?",95242445),false);
var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"size","size",1098693007));
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var intent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67437__$1,new cljs.core.Keyword(null,"intent","intent",-390846953));
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
var G__67663 = function (text,var_args){
var p__67436 = null;
if (arguments.length > 1) {
var G__67664__i = 0, G__67664__a = new Array(arguments.length -  1);
while (G__67664__i < G__67664__a.length) {G__67664__a[G__67664__i] = arguments[G__67664__i + 1]; ++G__67664__i;}
  p__67436 = new cljs.core.IndexedSeq(G__67664__a,0,null);
} 
return G__67663__delegate.call(this,text,p__67436);};
G__67663.cljs$lang$maxFixedArity = 1;
G__67663.cljs$lang$applyTo = (function (arglist__67665){
var text = cljs.core.first(arglist__67665);
var p__67436 = cljs.core.rest(arglist__67665);
return G__67663__delegate(text,p__67436);
});
G__67663.cljs$core$IFn$_invoke$arity$variadic = G__67663__delegate;
return G__67663;
})()
,null,"frontend.ui/button-inner");
frontend.ui.button = (function frontend$ui$button(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67666 = arguments.length;
var i__5727__auto___67667 = (0);
while(true){
if((i__5727__auto___67667 < len__5726__auto___67666)){
args__5732__auto__.push((arguments[i__5727__auto___67667]));

var G__67669 = (i__5727__auto___67667 + (1));
i__5727__auto___67667 = G__67669;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic = (function (text,p__67440){
var map__67441 = p__67440;
var map__67441__$1 = cljs.core.__destructure_map(map__67441);
var opts = map__67441__$1;
if(cljs.core.map_QMARK_(text)){
return frontend.ui.button_inner(null,text);
} else {
return frontend.ui.button_inner(text,opts);
}
}));

(frontend.ui.button.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.ui.button.cljs$lang$applyTo = (function (seq67438){
var G__67439 = cljs.core.first(seq67438);
var seq67438__$1 = cljs.core.next(seq67438);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67439,seq67438__$1);
}));

frontend.ui.point = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__67670 = null;
var G__67670__0 = (function (){
return daiquiri.interpreter.interpret((frontend.ui.point.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.point.cljs$core$IFn$_invoke$arity$3("bg-red-600",(5),null) : frontend.ui.point.call(null,"bg-red-600",(5),null)));
});
var G__67670__3 = (function (klass,size,p__67443){
var map__67444 = p__67443;
var map__67444__$1 = cljs.core.__destructure_map(map__67444);
var opts = map__67444__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67444__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var style = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67444__$1,new cljs.core.Keyword(null,"style","style",-496642736));
var attrs67442 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),[frontend.util.hiccup__GT_class(klass)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),size,new cljs.core.Keyword(null,"height","height",1025178622),size], null),style], 0))], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996)], 0))], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67442))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__point","overflow-hidden","rounded-full","inline-block"], null)], null),attrs67442], 0))):{'className':"ui__point overflow-hidden rounded-full inline-block"}),((cljs.core.map_QMARK_(attrs67442))?null:[daiquiri.interpreter.interpret(attrs67442)]));
});
G__67670 = function(klass,size,p__67443){
switch(arguments.length){
case 0:
return G__67670__0.call(this);
case 3:
return G__67670__3.call(this,klass,size,p__67443);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__67670.cljs$core$IFn$_invoke$arity$0 = G__67670__0;
G__67670.cljs$core$IFn$_invoke$arity$3 = G__67670__3;
return G__67670;
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
return daiquiri.interpreter.interpret((function (){var G__67448 = content;
var G__67449 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium","div.text-sm.font-medium",-120265550),frontend.ui.keyboard_shortcut_from_config(shortcut_key)], null);
var G__67450 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null)], null);
return (frontend.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? frontend.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__67448,G__67449,G__67450) : frontend.ui.tooltip.call(null,G__67448,G__67449,G__67450));
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

return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"flex justify-between mb-1"},[(function (){var attrs67451 = label_left;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67451))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-base"], null)], null),attrs67451], 0))):{'className':"text-base"}),((cljs.core.map_QMARK_(attrs67451))?null:[daiquiri.interpreter.interpret(attrs67451)]));
})(),(function (){var attrs67452 = label_right;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs67452))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","font-medium"], null)], null),attrs67452], 0))):{'className':"text-sm font-medium"}),((cljs.core.map_QMARK_(attrs67452))?null:[daiquiri.interpreter.interpret(attrs67452)]));
})()]),frontend.ui.progress_bar(width)]);
}),null,"frontend.ui/progress-bar-with-label");
frontend.ui.lazy_loading_placeholder = rum.core.lazy_build(rum.core.build_defc,(function (height){
return daiquiri.core.create_element("div",{'style':{'height':height}},[]);
}),null,"frontend.ui/lazy-loading-placeholder");
frontend.ui.lazy_visible_inner = rum.core.lazy_build(rum.core.build_defc,(function (visible_QMARK_,content_fn,ref,fade_in_QMARK_,placeholder){
var vec__67454 = frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$0();
var set_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67454,(0),null);
var rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67454,(1),null);
var placeholder_height = (function (){var or__5002__auto__ = (cljs.core.truth_(rect)?rect.height:null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (24);
}
})();
return daiquiri.core.create_element("div",{'ref':ref,'className':"lazy-visibility"},[daiquiri.core.create_element("div",{'ref':set_ref},[(cljs.core.truth_(visible_QMARK_)?((cljs.core.fn_QMARK_(content_fn))?(cljs.core.truth_(fade_in_QMARK_)?daiquiri.core.create_element("div",{'ref':(function (p1__67453_SHARP_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = p1__67453_SHARP_;
if(cljs.core.truth_(and__5000__auto__)){
return p1__67453_SHARP_.classList;
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
var G__67679 = null;
var G__67679__1 = (function (content_fn){
return daiquiri.interpreter.interpret((frontend.ui.lazy_visible.cljs$core$IFn$_invoke$arity$2 ? frontend.ui.lazy_visible.cljs$core$IFn$_invoke$arity$2(content_fn,null) : frontend.ui.lazy_visible.call(null,content_fn,null)));
});
var G__67679__2 = (function (content_fn,p__67457){
var map__67458 = p__67457;
var map__67458__$1 = cljs.core.__destructure_map(map__67458);
var initial_state = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67458__$1,new cljs.core.Keyword(null,"initial-state","initial-state",-2021616806),false);
var trigger_once_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67458__$1,new cljs.core.Keyword(null,"trigger-once?","trigger-once?",1582103477),true);
var fade_in_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67458__$1,new cljs.core.Keyword(null,"fade-in?","fade-in?",-1662119882),true);
var root_margin = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67458__$1,new cljs.core.Keyword(null,"root-margin","root-margin",-1598874814),(100));
var placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67458__$1,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083));
var _debug_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67458__$1,new cljs.core.Keyword(null,"_debug-id","_debug-id",1776601068));
var vec__67459 = rum.core.use_state(initial_state);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67459,(0),null);
var set_visible_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67459,(1),null);
var inViewState = (function (){var G__67462 = ({"initialInView": initial_state, "rootMargin": [cljs.core.str.cljs$core$IFn$_invoke$arity$1(root_margin),"px"].join(''), "triggerOnce": trigger_once_QMARK_, "onChange": (function (in_view_QMARK_,_entry){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(in_view_QMARK_,visible_QMARK_)){
return null;
} else {
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(in_view_QMARK_) : set_visible_BANG_.call(null,in_view_QMARK_));
}
})});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__67462) : frontend.ui.useInView.call(null,G__67462));
})();
var ref = inViewState.ref;
return frontend.ui.lazy_visible_inner(visible_QMARK_,content_fn,ref,fade_in_QMARK_,placeholder);
});
G__67679 = function(content_fn,p__67457){
switch(arguments.length){
case 1:
return G__67679__1.call(this,content_fn);
case 2:
return G__67679__2.call(this,content_fn,p__67457);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__67679.cljs$core$IFn$_invoke$arity$1 = G__67679__1;
G__67679.cljs$core$IFn$_invoke$arity$2 = G__67679__2;
return G__67679;
})()
,null,"frontend.ui/lazy-visible");
frontend.ui.menu_heading = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__67688 = null;
var G__67688__3 = (function (add_heading_fn,auto_heading_fn,rm_heading_fn){
return daiquiri.interpreter.interpret((frontend.ui.menu_heading.cljs$core$IFn$_invoke$arity$4 ? frontend.ui.menu_heading.cljs$core$IFn$_invoke$arity$4(null,add_heading_fn,auto_heading_fn,rm_heading_fn) : frontend.ui.menu_heading.call(null,null,add_heading_fn,auto_heading_fn,rm_heading_fn)));
});
var G__67688__4 = (function (heading,add_heading_fn,auto_heading_fn,rm_heading_fn){
return daiquiri.core.create_element("div",{'className':"flex flex-row justify-between pb-2 pt-1 px-2 items-center"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between flex-1 px-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$ui$iter__67463(s__67464){
return (new cljs.core.LazySeq(null,(function (){
var s__67464__$1 = s__67464;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67464__$1);
if(temp__5804__auto__){
var s__67464__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67464__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67464__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67466 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67465 = (0);
while(true){
if((i__67465 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__67465);
cljs.core.chunk_append(b__67466,rum.core.with_key(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading,i))),new cljs.core.Keyword(null,"icon","icon",1679606541),["h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"heading","heading",-1312171873),i], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__67465,i,c__5478__auto__,size__5479__auto__,b__67466,s__67464__$2,temp__5804__auto__){
return (function (){
return (add_heading_fn.cljs$core$IFn$_invoke$arity$1 ? add_heading_fn.cljs$core$IFn$_invoke$arity$1(i) : add_heading_fn.call(null,i));
});})(i__67465,i,c__5478__auto__,size__5479__auto__,b__67466,s__67464__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0)),["key-h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join('')));

var G__67690 = (i__67465 + (1));
i__67465 = G__67690;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67466),frontend$ui$iter__67463(cljs.core.chunk_rest(s__67464__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67466),null);
}
} else {
var i = cljs.core.first(s__67464__$2);
return cljs.core.cons(rum.core.with_key(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),(((!((heading == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading,i))),new cljs.core.Keyword(null,"icon","icon",1679606541),["h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"heading","heading",-1312171873),i], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"to-heading-button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i,s__67464__$2,temp__5804__auto__){
return (function (){
return (add_heading_fn.cljs$core$IFn$_invoke$arity$1 ? add_heading_fn.cljs$core$IFn$_invoke$arity$1(i) : add_heading_fn.call(null,i));
});})(i,s__67464__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true], 0)),["key-h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join('')),frontend$ui$iter__67463(cljs.core.rest(s__67464__$2)));
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
G__67688 = function(heading,add_heading_fn,auto_heading_fn,rm_heading_fn){
switch(arguments.length){
case 3:
return G__67688__3.call(this,heading,add_heading_fn,auto_heading_fn);
case 4:
return G__67688__4.call(this,heading,add_heading_fn,auto_heading_fn,rm_heading_fn);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__67688.cljs$core$IFn$_invoke$arity$3 = G__67688__3;
G__67688.cljs$core$IFn$_invoke$arity$4 = G__67688__4;
return G__67688;
})()
,null,"frontend.ui/menu-heading");
frontend.ui.tooltip = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__67694__delegate = function (trigger,tooltip_content,p__67467){
var map__67468 = p__67467;
var map__67468__$1 = cljs.core.__destructure_map(map__67468);
var portal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67468__$1,new cljs.core.Keyword(null,"portal?","portal?",-167584340));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67468__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var trigger_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67468__$1,new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67468__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
return daiquiri.interpreter.interpret((function (){var G__67476 = (function (){var G__67477 = root_props;
var G__67478 = (function (){var G__67480 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null),trigger_props], 0));
var G__67481 = trigger;
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2(G__67480,G__67481) : logseq.shui.ui.tooltip_trigger.call(null,G__67480,G__67481));
})();
var G__67479 = (((!(portal_QMARK_ === false)))?(function (){var G__67482 = (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(content_props,tooltip_content) : logseq.shui.ui.tooltip_content.call(null,content_props,tooltip_content));
return (logseq.shui.ui.tooltip_portal.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_portal.cljs$core$IFn$_invoke$arity$1(G__67482) : logseq.shui.ui.tooltip_portal.call(null,G__67482));
})():(logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(content_props,tooltip_content) : logseq.shui.ui.tooltip_content.call(null,content_props,tooltip_content)));
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__67477,G__67478,G__67479) : logseq.shui.ui.tooltip.call(null,G__67477,G__67478,G__67479));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__67476) : logseq.shui.ui.tooltip_provider.call(null,G__67476));
})());
};
var G__67694 = function (trigger,tooltip_content,var_args){
var p__67467 = null;
if (arguments.length > 2) {
var G__67704__i = 0, G__67704__a = new Array(arguments.length -  2);
while (G__67704__i < G__67704__a.length) {G__67704__a[G__67704__i] = arguments[G__67704__i + 2]; ++G__67704__i;}
  p__67467 = new cljs.core.IndexedSeq(G__67704__a,0,null);
} 
return G__67694__delegate.call(this,trigger,tooltip_content,p__67467);};
G__67694.cljs$lang$maxFixedArity = 2;
G__67694.cljs$lang$applyTo = (function (arglist__67705){
var trigger = cljs.core.first(arglist__67705);
arglist__67705 = cljs.core.next(arglist__67705);
var tooltip_content = cljs.core.first(arglist__67705);
var p__67467 = cljs.core.rest(arglist__67705);
return G__67694__delegate(trigger,tooltip_content,p__67467);
});
G__67694.cljs$core$IFn$_invoke$arity$variadic = G__67694__delegate;
return G__67694;
})()
,null,"frontend.ui/tooltip");
frontend.ui.DelDateButton = rum.core.lazy_build(rum.core.build_defc,(function (on_delete){
return daiquiri.interpreter.interpret((function (){var G__67485 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"del-date-btn",new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_delete], null);
var G__67486 = logseq.shui.ui.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67485,G__67486) : logseq.shui.ui.button.call(null,G__67485,G__67486));
})());
}),null,"frontend.ui/DelDateButton");
if((typeof frontend !== 'undefined') && (typeof frontend.ui !== 'undefined') && (typeof frontend.ui.month_values !== 'undefined')){
} else {
frontend.ui.month_values = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"January","January",1371836485),new cljs.core.Keyword(null,"February","February",-1121382977),new cljs.core.Keyword(null,"March","March",-1927014290),new cljs.core.Keyword(null,"April","April",2129469609),new cljs.core.Keyword(null,"May","May",291127633),new cljs.core.Keyword(null,"June","June",-239852188),new cljs.core.Keyword(null,"July","July",22844502),new cljs.core.Keyword(null,"August","August",1477870381),new cljs.core.Keyword(null,"September","September",-1384246246),new cljs.core.Keyword(null,"October","October",1442498414),new cljs.core.Keyword(null,"November","November",1309168199),new cljs.core.Keyword(null,"December","December",-997702713)], null);
}
frontend.ui.get_month_label = (function frontend$ui$get_month_label(n){
var G__67487 = n;
var G__67487__$1 = (((G__67487 == null))?null:cljs.core.nth.cljs$core$IFn$_invoke$arity$2(frontend.ui.month_values,G__67487));
if((G__67487__$1 == null)){
return null;
} else {
return cljs.core.name(G__67487__$1);
}
});
frontend.ui.date_year_month_select = rum.core.lazy_build(rum.core.build_defc,(function (p__67533){
var map__67534 = p__67533;
var map__67534__$1 = cljs.core.__destructure_map(map__67534);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67534__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67534__$1,new cljs.core.Keyword(null,"value","value",305978217));
var onChange = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67534__$1,new cljs.core.Keyword(null,"onChange","onChange",-312891301));
var _children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67534__$1,new cljs.core.Keyword(null,"_children","_children",1993687667));
var attrs67532 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"years"))?(function (){var G__67535 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (v){
if(cljs.core.truth_(v)){
return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(v) : onChange.call(null,v));
} else {
return null;
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 ml-2 !w-auto !px-2",new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"type","type",1174270348),"number",new cljs.core.Keyword(null,"min","min",444991522),(1),new cljs.core.Keyword(null,"max","max",61366548),(9999)], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67535) : logseq.shui.ui.input.call(null,G__67535));
})():(function (){var G__67536 = (function (){var G__67538 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__67539 = (function (){var G__67540 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 h-6 border border-input rounded-md",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__67541 = frontend.ui.get_month_label(value);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67540,G__67541) : logseq.shui.ui.button.call(null,G__67540,G__67541));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__67538,G__67539) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__67538,G__67539));
})();
var G__67537 = (function (){var G__67542 = (function (){var iter__5480__auto__ = (function frontend$ui$iter__67543(s__67544){
return (new cljs.core.LazySeq(null,(function (){
var s__67544__$1 = s__67544;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67544__$1);
if(temp__5804__auto__){
var s__67544__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67544__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67544__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67546 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67545 = (0);
while(true){
if((i__67545 < size__5479__auto__)){
var vec__67547 = cljs.core._nth(c__5478__auto__,i__67545);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67547,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67547,(1),null);
var label = cljs.core.name(month);
cljs.core.chunk_append(b__67546,(function (){var G__67550 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,idx),new cljs.core.Keyword(null,"on-select","on-select",-192407950),((function (i__67545,label,vec__67547,idx,month,c__5478__auto__,size__5479__auto__,b__67546,s__67544__$2,temp__5804__auto__,G__67536,map__67534,map__67534__$1,name,value,onChange,_children){
return (function (){
var e = (new Event("change"));
Object.defineProperty(e,"target",({"value": ({"value": idx}), "enumerable": true}));

return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(e) : onChange.call(null,e));
});})(i__67545,label,vec__67547,idx,month,c__5478__auto__,size__5479__auto__,b__67546,s__67544__$2,temp__5804__auto__,G__67536,map__67534,map__67534__$1,name,value,onChange,_children))
], null);
var G__67551 = label;
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__67550,G__67551) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__67550,G__67551));
})());

var G__67713 = (i__67545 + (1));
i__67545 = G__67713;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67546),frontend$ui$iter__67543(cljs.core.chunk_rest(s__67544__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67546),null);
}
} else {
var vec__67552 = cljs.core.first(s__67544__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67552,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67552,(1),null);
var label = cljs.core.name(month);
return cljs.core.cons((function (){var G__67555 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,idx),new cljs.core.Keyword(null,"on-select","on-select",-192407950),((function (label,vec__67552,idx,month,s__67544__$2,temp__5804__auto__,G__67536,map__67534,map__67534__$1,name,value,onChange,_children){
return (function (){
var e = (new Event("change"));
Object.defineProperty(e,"target",({"value": ({"value": idx}), "enumerable": true}));

return (onChange.cljs$core$IFn$_invoke$arity$1 ? onChange.cljs$core$IFn$_invoke$arity$1(e) : onChange.call(null,e));
});})(label,vec__67552,idx,month,s__67544__$2,temp__5804__auto__,G__67536,map__67534,map__67534__$1,name,value,onChange,_children))
], null);
var G__67556 = label;
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__67555,G__67556) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__67555,G__67556));
})(),frontend$ui$iter__67543(cljs.core.rest(s__67544__$2)));
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
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$1(G__67542) : logseq.shui.ui.dropdown_menu_content.call(null,G__67542));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__67536,G__67537) : logseq.shui.ui.dropdown_menu.call(null,G__67536,G__67537));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67532))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["months-years-nav"], null)], null),attrs67532], 0))):{'className':"months-years-nav"}),((cljs.core.map_QMARK_(attrs67532))?null:[daiquiri.interpreter.interpret(attrs67532)]));
}),null,"frontend.ui/date-year-month-select");
frontend.ui.single_calendar = (function frontend$ui$single_calendar(p__67558){
var map__67559 = p__67558;
var map__67559__$1 = cljs.core.__destructure_map(map__67559);
var opts = map__67559__$1;
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67559__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67559__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67559__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var on_day_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67559__$1,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076));
var G__67560 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"mode","mode",654403691),"single",new cljs.core.Keyword(null,"caption-layout","caption-layout",2068081731),"dropdown-buttons",new cljs.core.Keyword(null,"fromYear","fromYear",1259124862),(1000),new cljs.core.Keyword(null,"toYear","toYear",-1218322336),(3000),new cljs.core.Keyword(null,"components","components",-1073188942),(function (){var G__67561 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"Dropdown","Dropdown",405115910),(function (p1__67557_SHARP_){
return frontend.ui.date_year_month_select(cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(p1__67557_SHARP_));
})], null);
if(cljs.core.truth_(del_btn_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67561,new cljs.core.Keyword(null,"Head","Head",474150288),(function (){
return frontend.ui.DelDateButton(on_delete);
}));
} else {
return G__67561;
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
return (logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1(G__67560) : logseq.shui.ui.calendar.call(null,G__67560));
});
frontend.ui.get_current_hh_mm = (function frontend$ui$get_current_hh_mm(){
var current_time_s = cljs.core.first((new Date()).toTimeString().split(" "));
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(current_time_s,(0),(cljs.core.count(current_time_s) - (3)));
});
frontend.ui.time_picker = rum.core.lazy_build(rum.core.build_defc,(function (p__67567){
var map__67568 = p__67567;
var map__67568__$1 = cljs.core.__destructure_map(map__67568);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67568__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var default_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67568__$1,new cljs.core.Keyword(null,"default-value","default-value",232220170));
var attrs67566 = (function (){var G__67569 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"time-picker",new cljs.core.Keyword(null,"type","type",1174270348),"time",new cljs.core.Keyword(null,"class","class",-2030961996),"!py-0 !w-max !h-8",new cljs.core.Keyword(null,"default-value","default-value",232220170),(function (){var or__5002__auto__ = default_value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "00:00";
}
})(),new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (e){
var G__67570 = frontend.util.evalue(e);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(G__67570) : on_change.call(null,G__67570));
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67569) : logseq.shui.ui.input.call(null,G__67569));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67566))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2","mx-3","mb-3"], null)], null),attrs67566], 0))):{'className':"flex flex-row items-center gap-2 mx-3 mb-3"}),((cljs.core.map_QMARK_(attrs67566))?[daiquiri.interpreter.interpret((function (){var G__67573 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value = frontend.ui.get_current_hh_mm();
(goog.dom.getElement("time-picker").value = value);

return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value) : on_change.call(null,value));
})], null);
var G__67574 = "Use current time";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67573,G__67574) : logseq.shui.ui.button.call(null,G__67573,G__67574));
})())]:[daiquiri.interpreter.interpret(attrs67566),daiquiri.interpreter.interpret((function (){var G__67577 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value = frontend.ui.get_current_hh_mm();
(goog.dom.getElement("time-picker").value = value);

return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value) : on_change.call(null,value));
})], null);
var G__67578 = "Use current time";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67577,G__67578) : logseq.shui.ui.button.call(null,G__67577,G__67578));
})())]));
}),null,"frontend.ui/time-picker");
frontend.ui.nlp_calendar = rum.core.lazy_build(rum.core.build_defc,(function (p__67580){
var map__67581 = p__67580;
var map__67581__$1 = cljs.core.__destructure_map(map__67581);
var opts = map__67581__$1;
var selected = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67581__$1,new cljs.core.Keyword(null,"selected","selected",574897764));
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67581__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var on_day_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67581__$1,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076));
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
var vec__67582 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(value__$1,":");
var h = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67582,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67582,(1),null);
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
var attrs67579 = frontend.ui.single_calendar(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"on-select","on-select",-192407950),on_select_SINGLEQUOTE_));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67579))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-2","relative"], null)], null),attrs67579], 0))):{'className':"flex flex-col gap-2 relative"}),((cljs.core.map_QMARK_(attrs67579))?[(cljs.core.truth_(new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100).cljs$core$IFn$_invoke$arity$1(opts))?frontend.ui.time_picker((function (){var G__67586 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (value){
return (on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2 ? on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2(selected,value) : on_select_SINGLEQUOTE_.call(null,selected,value));
})], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67586,new cljs.core.Keyword(null,"default-value","default-value",232220170),[frontend.util.zero_pad(selected.getHours()),":",frontend.util.zero_pad(selected.getMinutes())].join(''));
} else {
return G__67586;
}
})()):null),daiquiri.interpreter.interpret((function (){var G__67589 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. Next week",new cljs.core.Keyword(null,"class","class",-2030961996),"mx-3 mb-3",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"initial",new cljs.core.Keyword(null,"tab-index","tab-index",895755393),(-1)], null),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
var value = frontend.util.evalue(e);
if(clojure.string.blank_QMARK_(value)){
return null;
} else {
var result = frontend.date.nld_parse(value);
var temp__5802__auto__ = (function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
var G__67590 = (new goog.date.DateTime());
G__67590.setTime(result.getTime());

return G__67590;
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
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67589) : logseq.shui.ui.input.call(null,G__67589));
})())]:[daiquiri.interpreter.interpret(attrs67579),(cljs.core.truth_(new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100).cljs$core$IFn$_invoke$arity$1(opts))?frontend.ui.time_picker((function (){var G__67592 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (value){
return (on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2 ? on_select_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$2(selected,value) : on_select_SINGLEQUOTE_.call(null,selected,value));
})], null);
if(cljs.core.truth_(selected)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67592,new cljs.core.Keyword(null,"default-value","default-value",232220170),[frontend.util.zero_pad(selected.getHours()),":",frontend.util.zero_pad(selected.getMinutes())].join(''));
} else {
return G__67592;
}
})()):null),daiquiri.interpreter.interpret((function (){var G__67595 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. Next week",new cljs.core.Keyword(null,"class","class",-2030961996),"mx-3 mb-3",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"initial",new cljs.core.Keyword(null,"tab-index","tab-index",895755393),(-1)], null),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
var value = frontend.util.evalue(e);
if(clojure.string.blank_QMARK_(value)){
return null;
} else {
var result = frontend.date.nld_parse(value);
var temp__5802__auto__ = (function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
var G__67596 = (new goog.date.DateTime());
G__67596.setTime(result.getTime());

return G__67596;
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
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67595) : logseq.shui.ui.input.call(null,G__67595));
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
