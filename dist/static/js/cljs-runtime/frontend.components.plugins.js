goog.provide('frontend.components.plugins');
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.plugins !== 'undefined') && (typeof frontend.components.plugins.PER_PAGE_SIZE !== 'undefined')){
} else {
frontend.components.plugins.PER_PAGE_SIZE = (15);
}
frontend.components.plugins._STAR_dirties_toggle_items = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
frontend.components.plugins.clear_dirties_states_BANG_ = (function frontend$components$plugins$clear_dirties_states_BANG_(){
return cljs.core.reset_BANG_(frontend.components.plugins._STAR_dirties_toggle_items,cljs.core.PersistentArrayMap.EMPTY);
});
frontend.components.plugins.render_classic_dropdown_items = (function frontend$components$plugins$render_classic_dropdown_items(id,items){
var iter__5480__auto__ = (function frontend$components$plugins$render_classic_dropdown_items_$_iter__107093(s__107094){
return (new cljs.core.LazySeq(null,(function (){
var s__107094__$1 = s__107094;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107094__$1);
if(temp__5804__auto__){
var s__107094__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107094__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107094__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107096 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107095 = (0);
while(true){
if((i__107095 < size__5479__auto__)){
var map__107106 = cljs.core._nth(c__5478__auto__,i__107095);
var map__107106__$1 = cljs.core.__destructure_map(map__107106);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107106__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107106__$1,new cljs.core.Keyword(null,"item","item",249373802));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107106__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107106__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107106__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
cljs.core.chunk_append(b__107096,(function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
} else {
var G__107120 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__107095,on_click_SINGLEQUOTE_,map__107106,map__107106__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__107096,s__107094__$2,temp__5804__auto__){
return (function (e){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}
} else {
return null;
}
});})(i__107095,on_click_SINGLEQUOTE_,map__107106,map__107106__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__107096,s__107094__$2,temp__5804__auto__))
);
var G__107121 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__107120,G__107121) : logseq.shui.ui.dropdown_menu_item.call(null,G__107120,G__107121));
}
})());

var G__108317 = (i__107095 + (1));
i__107095 = G__108317;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107096),frontend$components$plugins$render_classic_dropdown_items_$_iter__107093(cljs.core.chunk_rest(s__107094__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107096),null);
}
} else {
var map__107127 = cljs.core.first(s__107094__$2);
var map__107127__$1 = cljs.core.__destructure_map(map__107127);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107127__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107127__$1,new cljs.core.Keyword(null,"item","item",249373802));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107127__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107127__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107127__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
return cljs.core.cons((function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
} else {
var G__107129 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (on_click_SINGLEQUOTE_,map__107127,map__107127__$1,hr,item,title,options,icon,s__107094__$2,temp__5804__auto__){
return (function (e){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}
} else {
return null;
}
});})(on_click_SINGLEQUOTE_,map__107127,map__107127__$1,hr,item,title,options,icon,s__107094__$2,temp__5804__auto__))
);
var G__107130 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__107129,G__107130) : logseq.shui.ui.dropdown_menu_item.call(null,G__107129,G__107130));
}
})(),frontend$components$plugins$render_classic_dropdown_items_$_iter__107093(cljs.core.rest(s__107094__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
});
frontend.components.plugins.installed_themes = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_cursor = new cljs.core.Keyword("frontend.components.plugins","cursor","frontend.components.plugins/cursor",-841365704).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_themes = new cljs.core.Keyword("frontend.components.plugins","themes","frontend.components.plugins/themes",607722898).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",{'tabIndex':(-1),'className':"cp__themes-installed"},[(function (){var attrs107135 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"themes","themes",-702786642)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs107135))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-4","text-2xl","p-1"], null)], null),attrs107135], 0))):{'className':"mb-4 text-2xl p-1"}),((cljs.core.map_QMARK_(attrs107135))?null:[daiquiri.interpreter.interpret(attrs107135)]));
})(),daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,opt){
var current_selected_QMARK_ = new cljs.core.Keyword(null,"selected","selected",574897764).cljs$core$IFn$_invoke$arity$1(opt);
var group_first_QMARK_ = new cljs.core.Keyword(null,"group-first","group-first",1023924108).cljs$core$IFn$_invoke$arity$1(opt);
var plg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pid","pid",1018387698).cljs$core$IFn$_invoke$arity$1(opt)));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(opt))].join('')], null),(cljs.core.truth_((function (){var and__5000__auto__ = group_first_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(idx,(0));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.my-2","hr.my-2",930024796)], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.flex.px-3.py-1.5.rounded-sm.justify-between","div.it.flex.px-3.py-1.5.rounded-sm.justify-between",1407568914),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(opt),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"is-selected","is-selected",-334199992),current_selected_QMARK_,new cljs.core.Keyword(null,"is-active","is-active",-1424968720),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(idx,cljs.core.deref(_STAR_cursor))], null)], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
LSPluginCore.selectTheme(cljs_bean.core.__GT_js(opt));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.text-xs","div.flex.items-center.text-xs",505827359),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-60","div.opacity-60",-1650446509),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Logseq";
}
})())," \u2022"].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.name.ml-1","div.name.ml-1",1330505409),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(opt)], null)], null),(cljs.core.truth_((function (){var or__5002__auto__ = group_first_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return current_selected_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),(cljs.core.truth_(group_first_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-60","small.opacity-60",1913667792),new cljs.core.Keyword(null,"group-desc","group-desc",-883642045).cljs$core$IFn$_invoke$arity$1(opt)], null):null),(cljs.core.truth_(current_selected_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.inline-flex.ml-1.opacity-60","small.inline-flex.ml-1.opacity-60",1954839558),frontend.ui.icon("check")], null):null)], null):null)], null)], null);
}),cljs.core.deref(_STAR_themes)))]);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword("frontend.components.plugins","themes","frontend.components.plugins/themes",607722898)),rum.core.local.cljs$core$IFn$_invoke$arity$2((0),new cljs.core.Keyword("frontend.components.plugins","cursor","frontend.components.plugins/cursor",-841365704)),rum.core.local.cljs$core$IFn$_invoke$arity$2((0),new cljs.core.Keyword("frontend.components.plugins","total","frontend.components.plugins/total",1120620758)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var _STAR_themes = new cljs.core.Keyword("frontend.components.plugins","themes","frontend.components.plugins/themes",607722898).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_cursor = new cljs.core.Keyword("frontend.components.plugins","cursor","frontend.components.plugins/cursor",-841365704).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_total = new cljs.core.Keyword("frontend.components.plugins","total","frontend.components.plugins/total",1120620758).cljs$core$IFn$_invoke$arity$1(state);
var mode = frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var all_themes = frontend.state.sub(new cljs.core.Keyword("plugin","installed-themes","plugin/installed-themes",1969555197));
var themes = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p1__107132_SHARP_){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__107132_SHARP_);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107131_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(p1__107131_SHARP_),mode);
}),all_themes));
var no_mode_themes = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,opt){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opt,new cljs.core.Keyword(null,"group-first","group-first",1023924108),(idx === (0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"group-desc","group-desc",-883642045),(((idx === (0)))?"light & dark themes":null)], 0));
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p1__107134_SHARP_){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__107134_SHARP_);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107133_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(p1__107133_SHARP_),null);
}),all_themes)));
var selected = frontend.state.sub(new cljs.core.Keyword("plugin","selected-theme","plugin/selected-theme",-172679220));
var themes__$1 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,opt){
var selected_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(opt),selected);
if(selected_QMARK_){
cljs.core.reset_BANG_(_STAR_cursor,(idx + (1)));
} else {
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opt,new cljs.core.Keyword(null,"mode","mode",654403691),mode,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected","selected",574897764),selected_QMARK_], 0));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(themes,no_mode_themes));
var themes__$2 = cljs.core.cons(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"name","name",1843675177),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Default",clojure.string.capitalize(mode),"Theme"], null)),new cljs.core.Keyword(null,"url","url",276297046),null,new cljs.core.Keyword(null,"description","description",-1428560544),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Logseq default",mode,"theme."], null)),new cljs.core.Keyword(null,"mode","mode",654403691),mode,new cljs.core.Keyword(null,"selected","selected",574897764),(selected == null),new cljs.core.Keyword(null,"group-first","group-first",1023924108),true,new cljs.core.Keyword(null,"group-desc","group-desc",-883642045),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(mode)," themes"].join('')], null),themes__$1);
cljs.core.reset_BANG_(_STAR_themes,themes__$2);

cljs.core.reset_BANG_(_STAR_total,cljs.core.count(themes__$2));

return state;
})], null),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
var _STAR_cursor = new cljs.core.Keyword("frontend.components.plugins","cursor","frontend.components.plugins/cursor",-841365704).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_total = new cljs.core.Keyword("frontend.components.plugins","total","frontend.components.plugins/total",1120620758).cljs$core$IFn$_invoke$arity$1(state);
var target = rum.core.dom_node(state);
target.focus();

return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentArrayMap(null, 3, [(38),(function (_e){
return cljs.core.reset_BANG_(_STAR_cursor,(((cljs.core.deref(_STAR_cursor) === (0)))?(cljs.core.deref(_STAR_total) - (1)):(cljs.core.deref(_STAR_cursor) - (1))));
}),(40),(function (_e){
return cljs.core.reset_BANG_(_STAR_cursor,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_cursor),(cljs.core.deref(_STAR_total) - (1))))?(0):(cljs.core.deref(_STAR_cursor) + (1))));
}),(13),(function (){
var temp__5804__auto__ = target.querySelector(".is-active");
if(cljs.core.truth_(temp__5804__auto__)){
var active = temp__5804__auto__;
return active.click();
} else {
return null;
}
})], null));
}))], null),"frontend.components.plugins/installed-themes");
frontend.components.plugins.unpacked_plugin_loader = rum.core.lazy_build(rum.core.build_defc,(function (unpacked_pkg_path){
logseq.shui.hooks.use_effect_BANG_((function (){
var err_handle = (function (e){
var G__107201_108318 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((e["name"]));
var G__107201_108319__$1 = (((G__107201_108318 instanceof cljs.core.Keyword))?G__107201_108318.fqn:null);
switch (G__107201_108319__$1) {
case "IllegalPluginPackageError":
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Illegal Logseq plugin package.",new cljs.core.Keyword(null,"error","error",-978969032));

break;
case "ExistedImportedPluginPackageError":
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Existed plugin package (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message),")."].join(''),new cljs.core.Keyword(null,"error","error",-978969032));

break;
default:

}

return frontend.handler.plugin.reset_unpacked_state();
});
var reg_handle = (function (){
return frontend.handler.plugin.reset_unpacked_state();
});
if(cljs.core.truth_(unpacked_pkg_path)){
var G__107204_108321 = LSPluginCore;
G__107204_108321.once("error",err_handle);

G__107204_108321.once("registered",reg_handle);

G__107204_108321.register(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),unpacked_pkg_path], null)));

} else {
}

return (function (){
var G__107205 = LSPluginCore;
G__107205.off("error",err_handle);

G__107205.off("registered",reg_handle);

return G__107205;
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [unpacked_pkg_path], null));

if(cljs.core.truth_(unpacked_pkg_path)){
return daiquiri.core.create_element("strong",{'className':"inline-flex px-3"},["Loading ..."]);
} else {
return null;
}
}),null,"frontend.components.plugins/unpacked-plugin-loader");
frontend.components.plugins.category_tabs = rum.core.lazy_build(rum.core.build_defc,(function (t,total_nums,category,on_action){
var attrs107220 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("puzzle"),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"plugins","plugins",1900073717)) : t.call(null,new cljs.core.Keyword(null,"plugins","plugins",1900073717))),((cljs.core.vector_QMARK_(total_nums))?[" (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(total_nums)),")"].join(''):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_action.cljs$core$IFn$_invoke$arity$1 ? on_action.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"plugins","plugins",1900073717)) : on_action.call(null,new cljs.core.Keyword(null,"plugins","plugins",1900073717)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(category,new cljs.core.Keyword(null,"plugins","plugins",1900073717)))?"active":"")], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107220))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["secondary-tabs","categories","flex"], null)], null),attrs107220], 0))):{'className':"secondary-tabs categories flex"}),((cljs.core.map_QMARK_(attrs107220))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("palette"),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"themes","themes",-702786642)) : t.call(null,new cljs.core.Keyword(null,"themes","themes",-702786642))),((cljs.core.vector_QMARK_(total_nums))?[" (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(total_nums)),")"].join(''):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_action.cljs$core$IFn$_invoke$arity$1 ? on_action.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"themes","themes",-702786642)) : on_action.call(null,new cljs.core.Keyword(null,"themes","themes",-702786642)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(category,new cljs.core.Keyword(null,"themes","themes",-702786642)))?"active":"")], 0)))]:[daiquiri.interpreter.interpret(attrs107220),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("palette"),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"themes","themes",-702786642)) : t.call(null,new cljs.core.Keyword(null,"themes","themes",-702786642))),((cljs.core.vector_QMARK_(total_nums))?[" (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(total_nums)),")"].join(''):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_action.cljs$core$IFn$_invoke$arity$1 ? on_action.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"themes","themes",-702786642)) : on_action.call(null,new cljs.core.Keyword(null,"themes","themes",-702786642)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(category,new cljs.core.Keyword(null,"themes","themes",-702786642)))?"active":"")], 0)))]));
}),null,"frontend.components.plugins/category-tabs");
frontend.components.plugins.local_markdown_display = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__107259 = frontend.state.sub(new cljs.core.Keyword("plugin","active-readme","plugin/active-readme",-677043988));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107259,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107259,(1),null);
return daiquiri.core.create_element("div",{'onClick':(function (e){
var temp__5804__auto__ = e.target;
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(target.nodeName),"a")) && ((!(clojure.string.blank_QMARK_(target.getAttribute("href"))))))){
apis.openExternal(target.getAttribute("href"));

return e.preventDefault();
} else {
return null;
}
} else {
return null;
}
}),'className':"cp__plugins-details"},[daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"repository","repository",1489835364).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = ((typeof repo === 'string')?repo:new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo));
if(cljs.core.truth_(temp__5804__auto____$1)){
var repo__$1 = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.rounded-md.bg-base-3","div.p-4.rounded-md.bg-base-3",1387249382),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"target","target",253001721),"_blank",new cljs.core.Keyword(null,"href","href",-793805698),repo__$1], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mr-1","span.mr-1",127520086),frontend.components.svg.github.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(25),new cljs.core.Keyword(null,"height","height",1025178622),(25)], null))], null),repo__$1], null)], null)], null);
} else {
return null;
}
} else {
return null;
}
})()),daiquiri.core.create_element("div",{'style':{'minHeight':"60vw",'maxWidth':(900)},'dangerouslySetInnerHTML':{'__html':content},'className':"p-1 bg-transparent border-none ls-block"},[])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.plugins/local-markdown-display");
frontend.components.plugins.remote_readme_display = rum.core.lazy_build(rum.core.build_defc,(function (p__107323,_content){
var map__107324 = p__107323;
var map__107324__$1 = cljs.core.__destructure_map(map__107324);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107324__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var src = [((clojure.string.includes_QMARK_(location.host,"logseq"))?"./static/":"./"),"marketplace.html?repo=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join('');
return daiquiri.core.create_element("iframe",{'src':src,'className':"lsp-frame-readme"},[]);
}),null,"frontend.components.plugins/remote-readme-display");
frontend.components.plugins.security_warning = (function frontend$components$plugins$security_warning(){
return frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm","p.text-sm",-1988028746),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","security-warning","plugin/security-warning",555257415)], 0))], null));
});
frontend.components.plugins.format_number = (function frontend$components$plugins$format_number(var_args){
var args__5732__auto__ = [];
var len__5726__auto___108328 = arguments.length;
var i__5727__auto___108329 = (0);
while(true){
if((i__5727__auto___108329 < len__5726__auto___108328)){
args__5732__auto__.push((arguments[i__5727__auto___108329]));

var G__108330 = (i__5727__auto___108329 + (1));
i__5727__auto___108329 = G__108330;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.components.plugins.format_number.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.components.plugins.format_number.cljs$core$IFn$_invoke$arity$variadic = (function (num,p__107331){
var map__107332 = p__107331;
var map__107332__$1 = cljs.core.__destructure_map(map__107332);
var precision = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__107332__$1,new cljs.core.Keyword(null,"precision","precision",-1175707478),(2));
if((num < (1000))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(num);
} else {
if((num >= (1000))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1((num / (1000)).toFixed(precision)),"k"].join('');
} else {
return null;
}
}
}));

(frontend.components.plugins.format_number.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.components.plugins.format_number.cljs$lang$applyTo = (function (seq107325){
var G__107326 = cljs.core.first(seq107325);
var seq107325__$1 = cljs.core.next(seq107325);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__107326,seq107325__$1);
}));

frontend.components.plugins.card_ctls_of_market = rum.core.lazy_build(rum.core.build_defc,(function (item,stat,installed_QMARK_,installing_or_updating_QMARK_){
return daiquiri.core.create_element("div",{'className':"ctl"},[daiquiri.core.create_element("ul",{'className':"l flex items-center"},[(function (){var attrs107335 = frontend.components.svg.star.cljs$core$IFn$_invoke$arity$1((16));
return daiquiri.core.create_element("li",((cljs.core.map_QMARK_(attrs107335))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","text-sm","items-center","pr-3"], null)], null),attrs107335], 0))):{'className':"flex text-sm items-center pr-3"}),((cljs.core.map_QMARK_(attrs107335))?[(function (){var attrs107336 = new cljs.core.Keyword(null,"stargazers_count","stargazers_count",-984649909).cljs$core$IFn$_invoke$arity$1(stat);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107336))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs107336], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs107336))?null:[daiquiri.interpreter.interpret(attrs107336)]));
})()]:[daiquiri.interpreter.interpret(attrs107335),(function (){var attrs107337 = new cljs.core.Keyword(null,"stargazers_count","stargazers_count",-984649909).cljs$core$IFn$_invoke$arity$1(stat);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107337))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs107337], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs107337))?null:[daiquiri.interpreter.interpret(attrs107337)]));
})()]));
})(),daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = stat;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"total_downloads","total_downloads",-1370933259).cljs$core$IFn$_invoke$arity$1(stat);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var downloads = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = downloads;
if(cljs.core.truth_(and__5000__auto__)){
return (downloads > (0));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.flex.text-sm.items-center.pr-3","li.flex.text-sm.items-center.pr-3",1837860767),frontend.components.svg.cloud_down.cljs$core$IFn$_invoke$arity$1((16)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),frontend.components.plugins.format_number(downloads)], null)], null);
} else {
return null;
}
} else {
return null;
}
})())]),daiquiri.core.create_element("div",{'className':"r flex items-center"},[daiquiri.core.create_element("a",{'onClick':(function (){
return frontend.handler.common.plugin.install_marketplace_plugin_BANG_(item);
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["btn",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = installed_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return installing_or_updating_QMARK_;
}
})(),new cljs.core.Keyword(null,"installing","installing",506071602),installing_or_updating_QMARK_], null)], null))], null))},[(cljs.core.truth_(installed_QMARK_)?daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installed","plugin/installed",-431253936)], 0))):(cljs.core.truth_(installing_or_updating_QMARK_)?daiquiri.core.create_element("span",{'className':"flex items-center"},[(function (){var attrs107338 = frontend.components.svg.loading;
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs107338))?daiquiri.interpreter.element_attributes(attrs107338):null),((cljs.core.map_QMARK_(attrs107338))?null:[daiquiri.interpreter.interpret(attrs107338)]));
})(),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581)], 0)))]):daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","install","plugin/install",-432957003)], 0)))))])])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/card-ctls-of-market");
frontend.components.plugins.card_ctls_of_installed = rum.core.lazy_build(rum.core.build_defc,(function (id,name,url,sponsors,unpacked_QMARK_,disabled_QMARK_,installing_or_updating_QMARK_,has_other_pending_QMARK_,new_version,item){
return daiquiri.core.create_element("div",{'className':"ctl"},[daiquiri.core.create_element("div",{'className':"l"},[daiquiri.core.create_element("div",{'className':"de"},[(function (){var attrs107340 = frontend.ui.icon("settings");
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107340))?daiquiri.interpreter.element_attributes(attrs107340):null),((cljs.core.map_QMARK_(attrs107340))?null:[daiquiri.interpreter.interpret(attrs107340)]));
})(),daiquiri.core.create_element("ul",{'className':"menu-list"},[daiquiri.core.create_element("li",{'onClick':(function (){
return frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$2(id,false);
})},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-settings","plugin/open-settings",755186792)], 0)))]),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.core.create_element("li",{'onClick':(function (){
return apis.openPath(url);
})},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-package","plugin/open-package",-735283330)], 0)))]):null),daiquiri.core.create_element("li",{'onClick':(function (){
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$2(id,name);
})},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","report-security","plugin/report-security",29084696)], 0)))]),daiquiri.core.create_element("li",{'onClick':(function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__107341 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b","b",1482224470),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","delete-alert","plugin/delete-alert",918910734),name], 0))], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__107341) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__107341));
})(),(function (){
frontend.handler.common.plugin.unregister_plugin(id);

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.handler.plugin_config.remove_plugin(id);
} else {
return null;
}
}));
})},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","uninstall","plugin/uninstall",233071235)], 0)))])])]),((cljs.core.seq(sponsors))?daiquiri.core.create_element("div",{'className':"de sponsors"},[(function (){var attrs107342 = frontend.ui.icon("coffee");
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107342))?daiquiri.interpreter.element_attributes(attrs107342):null),((cljs.core.map_QMARK_(attrs107342))?null:[daiquiri.interpreter.interpret(attrs107342)]));
})(),daiquiri.core.create_element("ul",{'className':"menu-list"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107343(s__107344){
return (new cljs.core.LazySeq(null,(function (){
var s__107344__$1 = s__107344;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107344__$1);
if(temp__5804__auto__){
var s__107344__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107344__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107344__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107346 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107345 = (0);
while(true){
if((i__107345 < size__5479__auto__)){
var link = cljs.core._nth(c__5478__auto__,i__107345);
cljs.core.chunk_append(b__107346,daiquiri.core.create_element("li",{'key':link},[daiquiri.core.create_element("a",{'href':link,'target':"_blank"},[(function (){var attrs107347 = link;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107347))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs107347], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs107347))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link"))]:[daiquiri.interpreter.interpret(attrs107347),daiquiri.interpreter.interpret(frontend.ui.icon("external-link"))]));
})()])]));

var G__108333 = (i__107345 + (1));
i__107345 = G__108333;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107346),frontend$components$plugins$iter__107343(cljs.core.chunk_rest(s__107344__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107346),null);
}
} else {
var link = cljs.core.first(s__107344__$2);
return cljs.core.cons(daiquiri.core.create_element("li",{'key':link},[daiquiri.core.create_element("a",{'href':link,'target':"_blank"},[(function (){var attrs107347 = link;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107347))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs107347], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs107347))?[daiquiri.interpreter.interpret(frontend.ui.icon("external-link"))]:[daiquiri.interpreter.interpret(attrs107347),daiquiri.interpreter.interpret(frontend.ui.icon("external-link"))]));
})()])]),frontend$components$plugins$iter__107343(cljs.core.rest(s__107344__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sponsors);
})())])]):null)]),(function (){var attrs107339 = (cljs.core.truth_((function (){var and__5000__auto__ = unpacked_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(disabled_QMARK_);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.btn","a.btn",-2143027730),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(LSPluginCore,"reload",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","reload","plugin/reload",-389898430)], 0))], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107339))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["r","flex","items-center"], null)], null),attrs107339], 0))):{'className':"r flex items-center"}),((cljs.core.map_QMARK_(attrs107339))?[((cljs.core.not(unpacked_QMARK_))?daiquiri.core.create_element("div",{'className':"updates-actions"},[daiquiri.core.create_element("a",{'onClick':(function (){
if(cljs.core.truth_(has_other_pending_QMARK_)){
return null;
} else {
return frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword(null,"only-check","only-check",-1961506795),cljs.core.not(new_version)),(function (e){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e.toString(),new cljs.core.Keyword(null,"error","error",-978969032));
}));
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["btn",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),installing_or_updating_QMARK_], null)], null))], null))},[(cljs.core.truth_(installing_or_updating_QMARK_)?daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","updating","plugin/updating",1642276684)], 0))):(cljs.core.truth_(new_version)?(function (){var attrs107348 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update","plugin/update",2040056703)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107348))?daiquiri.interpreter.element_attributes(attrs107348):null),((cljs.core.map_QMARK_(attrs107348))?[" \uD83D\uDC49 ",daiquiri.interpreter.interpret(new_version)]:[daiquiri.interpreter.interpret(attrs107348)," \uD83D\uDC49 ",daiquiri.interpreter.interpret(new_version)]));
})():daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","check-update","plugin/check-update",1581546124)], 0)))))])]):null),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(cljs.core.not(disabled_QMARK_),(function (){
cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(LSPluginCore,(cljs.core.truth_(disabled_QMARK_)?"enable":"disable"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));

if((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.plugins._STAR_dirties_toggle_items),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id)) == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.plugins._STAR_dirties_toggle_items,cljs.core.assoc,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id),cljs.core.not(disabled_QMARK_));
} else {
return null;
}
}),true))]:[daiquiri.interpreter.interpret(attrs107339),((cljs.core.not(unpacked_QMARK_))?daiquiri.core.create_element("div",{'className':"updates-actions"},[daiquiri.core.create_element("a",{'onClick':(function (){
if(cljs.core.truth_(has_other_pending_QMARK_)){
return null;
} else {
return frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword(null,"only-check","only-check",-1961506795),cljs.core.not(new_version)),(function (e){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e.toString(),new cljs.core.Keyword(null,"error","error",-978969032));
}));
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["btn",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),installing_or_updating_QMARK_], null)], null))], null))},[(cljs.core.truth_(installing_or_updating_QMARK_)?daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","updating","plugin/updating",1642276684)], 0))):(cljs.core.truth_(new_version)?(function (){var attrs107349 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update","plugin/update",2040056703)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107349))?daiquiri.interpreter.element_attributes(attrs107349):null),((cljs.core.map_QMARK_(attrs107349))?[" \uD83D\uDC49 ",daiquiri.interpreter.interpret(new_version)]:[daiquiri.interpreter.interpret(attrs107349)," \uD83D\uDC49 ",daiquiri.interpreter.interpret(new_version)]));
})():daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","check-update","plugin/check-update",1581546124)], 0)))))])]):null),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(cljs.core.not(disabled_QMARK_),(function (){
cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(LSPluginCore,(cljs.core.truth_(disabled_QMARK_)?"enable":"disable"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([id], 0));

if((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.plugins._STAR_dirties_toggle_items),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id)) == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.plugins._STAR_dirties_toggle_items,cljs.core.assoc,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id),cljs.core.not(disabled_QMARK_));
} else {
return null;
}
}),true))]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/card-ctls-of-installed");
frontend.components.plugins.get_open_plugin_readme_handler = (function frontend$components$plugins$get_open_plugin_readme_handler(url,p__107350,repo){
var map__107351 = p__107350;
var map__107351__$1 = cljs.core.__destructure_map(map__107351);
var item = map__107351__$1;
var webPkg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107351__$1,new cljs.core.Keyword(null,"webPkg","webPkg",-614725372));
return (function (){
return frontend.handler.plugin.open_readme_BANG_(url,item,(cljs.core.truth_((function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return webPkg;
}
})())?frontend.components.plugins.remote_readme_display:frontend.components.plugins.local_markdown_display));
});
});
frontend.components.plugins.plugin_item_card = rum.core.lazy_build(rum.core.build_defc,(function (t,p__107352,disabled_QMARK_,market_QMARK_,_STAR_search_key,has_other_pending_QMARK_,installing_or_updating_QMARK_,installed_QMARK_,stat,coming_update){
var map__107353 = p__107352;
var map__107353__$1 = cljs.core.__destructure_map(map__107353);
var item = map__107353__$1;
var sponsors = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"sponsors","sponsors",-2122570439));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"version","version",425292698));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var webPkg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"webPkg","webPkg",-614725372));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"title","title",636505583));
var author = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"author","author",2111686192));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var iir = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"iir","iir",-231680811));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107353__$1,new cljs.core.Keyword(null,"url","url",276297046));
var name__$1 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = name;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Untitled";
}
}
})();
var web_QMARK_ = (!((webPkg == null)));
var unpacked_QMARK_ = (((!(web_QMARK_))) && (cljs.core.not(iir)));
var new_version = frontend.state.coming_update_new_version_QMARK_(coming_update);
return daiquiri.core.create_element("div",{'key':["lsp-card-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__plugins-item-card",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"market","market",-1425134471),market_QMARK_,new cljs.core.Keyword(null,"installed","installed",553977691),installed_QMARK_,new cljs.core.Keyword(null,"updating","updating",1454028951),installing_or_updating_QMARK_,new cljs.core.Keyword(null,"has-new-version","has-new-version",1406719631),new_version], null)], null))], null))},[daiquiri.core.create_element("div",{'onClick':frontend.components.plugins.get_open_plugin_readme_handler(url,item,repo),'className':"l link-block cursor-pointer"},[(cljs.core.truth_((function (){var and__5000__auto__ = icon;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(icon)));
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("img",{'src':(cljs.core.truth_(market_QMARK_)?frontend.handler.plugin.pkg_asset(id,icon):icon),'className':"icon"},[]):daiquiri.interpreter.interpret(frontend.components.svg.folder)),((((cljs.core.not(market_QMARK_)) && (unpacked_QMARK_)))?(function (){var attrs107354 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","unpacked","plugin/unpacked",-80516789)) : t.call(null,new cljs.core.Keyword("plugin","unpacked","plugin/unpacked",-80516789)));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107354))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-center","text-xs","text-error","pt-2"], null)], null),attrs107354], 0))):{'className':"flex justify-center text-xs text-error pt-2"}),((cljs.core.map_QMARK_(attrs107354))?null:[daiquiri.interpreter.interpret(attrs107354)]));
})():null)]),daiquiri.core.create_element("div",{'className':"r"},[daiquiri.core.create_element("h3",{'className':"head text-xl font-bold pt-1 5"},[daiquiri.core.create_element("span",{'onClick':frontend.components.plugins.get_open_plugin_readme_handler(url,item,repo),'className':"l link-block cursor-pointer"},[daiquiri.interpreter.interpret(name__$1)]),((cljs.core.not(market_QMARK_))?(function (){var attrs107356 = version;
return daiquiri.core.create_element("sup",((cljs.core.map_QMARK_(attrs107356))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["inline-block","px-1","text-xs","opacity-50"], null)], null),attrs107356], 0))):{'className':"inline-block px-1 text-xs opacity-50"}),((cljs.core.map_QMARK_(attrs107356))?null:[daiquiri.interpreter.interpret(attrs107356)]));
})():null)]),daiquiri.core.create_element("div",{'className':"desc text-xs opacity-70"},[(function (){var attrs107357 = description;
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107357))?daiquiri.interpreter.element_attributes(attrs107357):null),((cljs.core.map_QMARK_(attrs107357))?null:[daiquiri.interpreter.interpret(attrs107357)]));
})()]),daiquiri.core.create_element("div",{'className':"flag"},[daiquiri.core.create_element("p",{'className':"text-xs pr-2 flex justify-between"},[daiquiri.core.create_element("small",{'onClick':(function (){
var temp__5804__auto__ = document.querySelector(".cp__plugins-page .search-ctls input");
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
cljs.core.reset_BANG_(_STAR_search_key,["@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(author)].join(''));

return el.select();
} else {
return null;
}
})},[daiquiri.interpreter.interpret(author)]),daiquiri.core.create_element("small",{'onClick':(function (){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));

return frontend.util.copy_to_clipboard_BANG_(id);
})},[["ID: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')])])]),(function (){var attrs107355 = (cljs.core.truth_(repo)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex","a.flex",-995526906),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"target","target",253001721),"_blank",new cljs.core.Keyword(null,"href","href",-793805698),frontend.handler.plugin.gh_repo_url(repo)], null),frontend.components.svg.github.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(16),new cljs.core.Keyword(null,"height","height",1025178622),(16)], null))], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107355))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flag","is-top","opacity-50"], null)], null),attrs107355], 0))):{'className':"flag is-top opacity-50"}),((cljs.core.map_QMARK_(attrs107355))?null:[daiquiri.interpreter.interpret(attrs107355)]));
})(),(cljs.core.truth_(market_QMARK_)?frontend.components.plugins.card_ctls_of_market(item,stat,installed_QMARK_,installing_or_updating_QMARK_):frontend.components.plugins.card_ctls_of_installed(id,name__$1,url,sponsors,unpacked_QMARK_,disabled_QMARK_,installing_or_updating_QMARK_,has_other_pending_QMARK_,new_version,item))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/plugin-item-card");
frontend.components.plugins.panel_tab_search = rum.core.lazy_build(rum.core.build_defc,(function (search_key,_STAR_search_key,_STAR_search_ref){
return daiquiri.core.create_element("div",{'className':"search-ctls"},[(function (){var attrs107365 = frontend.ui.icon("search");
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs107365))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["absolute","s1"], null)], null),attrs107365], 0))):{'className':"absolute s1"}),((cljs.core.map_QMARK_(attrs107365))?null:[daiquiri.interpreter.interpret(attrs107365)]));
})(),((clojure.string.blank_QMARK_(search_key))?null:daiquiri.core.create_element("small",{'onClick':(function (){
var temp__5804__auto__ = rum.core.deref(_STAR_search_ref);
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
cljs.core.reset_BANG_(_STAR_search_key,null);

return target.focus();
} else {
return null;
}
}),'className':"absolute s2"},[daiquiri.interpreter.interpret(frontend.ui.icon("x"))])),daiquiri.interpreter.interpret((function (){var G__107371 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","search-plugin","plugin/search-plugin",-764896238)], 0)),new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_search_ref,new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((27),e.keyCode)){
frontend.util.stop(e);

if(clojure.string.blank_QMARK_(search_key)){
var G__107372 = document.querySelector(".cp__plugins-page");
if((G__107372 == null)){
return null;
} else {
return G__107372.focus();
}
} else {
return cljs.core.reset_BANG_(_STAR_search_key,null);
}
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__107363_SHARP_){
var target = p1__107363_SHARP_.target;
return cljs.core.reset_BANG_(_STAR_search_key,(function (){var G__107374 = target.value;
if((G__107374 == null)){
return null;
} else {
return clojure.string.triml(G__107374);
}
})());
}),new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = search_key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__107371) : logseq.shui.ui.input.call(null,G__107371));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/panel-tab-search");
frontend.components.plugins.panel_tab_developer = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","contribute","plugin/contribute",1070040335)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/marketplace",new cljs.core.Keyword(null,"class","class",-2030961996),"contribute",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], 0)));
}),null,"frontend.components.plugins/panel-tab-developer");
frontend.components.plugins.user_proxy_settings_container = rum.core.lazy_build(rum.core.build_defc,(function (p__107379){
var map__107380 = p__107379;
var map__107380__$1 = cljs.core.__destructure_map(map__107380);
var agent_opts = map__107380__$1;
var protocol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107380__$1,new cljs.core.Keyword(null,"protocol","protocol",652470118));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107380__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var type__$1 = (function (){var or__5002__auto__ = cljs.core.not_empty(type);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.not_empty(protocol);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "system";
}
}
})();
var vec__107381 = rum.core.use_state(agent_opts);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107381,(0),null);
var set_opts_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107381,(1),null);
var vec__107384 = rum.core.use_state(false);
var testing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107384,(0),null);
var set_testing_QMARK__BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107384,(1),null);
var _STAR_test_input = rum.core.create_ref();
var disabled_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(opts),"system")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(opts),"direct")));
return daiquiri.core.create_element("div",{'className':"cp__settings-network-proxy-cnt"},[(function (){var attrs107389 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","network-proxy","settings-page/network-proxy",-895413144)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs107389))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-2","text-2xl","font-bold"], null)], null),attrs107389], 0))):{'className':"mb-2 text-2xl font-bold"}),((cljs.core.map_QMARK_(attrs107389))?null:[daiquiri.interpreter.interpret(attrs107389)]));
})(),daiquiri.core.create_element("div",{'className':"p-2"},[daiquiri.core.create_element("p",null,[daiquiri.core.create_element("label",null,[(function (){var attrs107461 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"type","type",1174270348)], 0));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107461))?daiquiri.interpreter.element_attributes(attrs107461):null),((cljs.core.map_QMARK_(attrs107461))?null:[daiquiri.interpreter.interpret(attrs107461)]));
})(),frontend.ui.select(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"System",new cljs.core.Keyword(null,"value","value",305978217),"system",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,"system")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"Direct",new cljs.core.Keyword(null,"value","value",305978217),"direct",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,"direct")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"HTTP",new cljs.core.Keyword(null,"value","value",305978217),"http",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,"http")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"SOCKS5",new cljs.core.Keyword(null,"value","value",305978217),"socks5",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type__$1,"socks5")], null)], null),(function (_e,value){
var G__107483 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"type","type",1174270348),value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"protocol","protocol",652470118),value], 0));
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107483) : set_opts_BANG_.call(null,G__107483));
}))])]),daiquiri.core.create_element("p",{'className':"flex"},[daiquiri.core.create_element("label",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pr-4",((disabled_QMARK_)?"opacity-50":null)], null))},[(function (){var attrs107492 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"host","host",-1558485167)], 0));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107492))?daiquiri.interpreter.element_attributes(attrs107492):null),((cljs.core.map_QMARK_(attrs107492))?null:[daiquiri.interpreter.interpret(attrs107492)]));
})(),daiquiri.core.create_element("input",{'value':new cljs.core.Keyword(null,"host","host",-1558485167).cljs$core$IFn$_invoke$arity$1(opts),'disabled':disabled_QMARK_,'onChange':rum.core.mark_sync_update((function (p1__107376_SHARP_){
var G__107493 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"host","host",-1558485167),frontend.util.trim_safe(frontend.util.evalue(p1__107376_SHARP_)));
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107493) : set_opts_BANG_.call(null,G__107493));
})),'className':"form-input is-small"},[])]),daiquiri.core.create_element("label",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [((disabled_QMARK_)?"opacity-50":null)], null))},[(function (){var attrs107494 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"port","port",1534937262)], 0));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107494))?daiquiri.interpreter.element_attributes(attrs107494):null),((cljs.core.map_QMARK_(attrs107494))?null:[daiquiri.interpreter.interpret(attrs107494)]));
})(),daiquiri.core.create_element("input",{'value':new cljs.core.Keyword(null,"port","port",1534937262).cljs$core$IFn$_invoke$arity$1(opts),'type':"number",'min':(1),'max':(65535),'disabled':disabled_QMARK_,'onChange':rum.core.mark_sync_update((function (p1__107377_SHARP_){
var G__107506 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"port","port",1534937262),frontend.util.trim_safe(frontend.util.evalue(p1__107377_SHARP_)));
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107506) : set_opts_BANG_.call(null,G__107506));
})),'className':"form-input is-small"},[])])]),daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("p",{'className':"flex items-center space-x-2"},[daiquiri.core.create_element("span",{'className':"w-60"},[daiquiri.core.create_element("input",{'ref':_STAR_test_input,'list':"proxy-test-url-datalist",'type':"url",'placeholder':"https://",'onChange':rum.core.mark_sync_update((function (p1__107378_SHARP_){
var G__107533 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"test","test",577538877),frontend.util.trim_safe(frontend.util.evalue(p1__107378_SHARP_)));
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107533) : set_opts_BANG_.call(null,G__107533));
})),'value':new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(opts),'className':"form-input is-small"},[]),daiquiri.core.create_element("datalist",{'id':"proxy-test-url-datalist"},[daiquiri.core.create_element("option",null,["https://api.logseq.com/logseq/version"]),daiquiri.core.create_element("option",null,["https://logseq-connectivity-testing-prod.s3.us-east-1.amazonaws.com/logseq-connectivity-testing"]),daiquiri.core.create_element("option",null,["https://www.google.com"]),daiquiri.core.create_element("option",null,["https://s3.amazonaws.com"]),daiquiri.core.create_element("option",null,["https://clients3.google.com/generate_204"])])]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(testing_QMARK_)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Testing"):"Test URL"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var val = frontend.util.trim_safe(rum.core.deref(_STAR_test_input).value);
if(((cljs.core.not(testing_QMARK_)) && ((!(clojure.string.blank_QMARK_(val)))))){
(set_testing_QMARK__BANG_.cljs$core$IFn$_invoke$arity$1 ? set_testing_QMARK__BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_testing_QMARK__BANG_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"testProxyUrl","testProxyUrl",-814931268),val,opts], 0))),(function (result){
return promesa.protocols._promise(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
}));
})),(function (p__107583){
var map__107584 = p__107583;
var map__107584__$1 = cljs.core.__destructure_map(map__107584);
var code = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107584__$1,new cljs.core.Keyword(null,"code","code",1586293142));
var response_ms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107584__$1,new cljs.core.Keyword(null,"response-ms","response-ms",-265710367));
frontend.handler.notification.clear_BANG_(new cljs.core.Keyword(null,"proxy-net-check","proxy-net-check",344482008));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Success! Status ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(code)," in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(response_ms),"ms."].join(''),new cljs.core.Keyword(null,"success","success",1890645906));
})),(function (e){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"error","error",-978969032),false,new cljs.core.Keyword(null,"proxy-net-check","proxy-net-check",344482008));
})),(function (){
return (set_testing_QMARK__BANG_.cljs$core$IFn$_invoke$arity$1 ? set_testing_QMARK__BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_testing_QMARK__BANG_.call(null,false));
}));
} else {
return null;
}
})], 0)))]),(function (){var attrs107455 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"save","save",1850079149)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"setProxy","setProxy",777692671),opts], 0))),(function (_){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("settings","agent","settings/agent",2144439922)], null),opts));
}));
}));
})], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107455))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2"], null)], null),attrs107455], 0))):{'className':"pt-2"}),((cljs.core.map_QMARK_(attrs107455))?null:[daiquiri.interpreter.interpret(attrs107455)]));
})()])]);
}),null,"frontend.components.plugins/user-proxy-settings-container");
frontend.components.plugins.load_from_web_url_container = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__107621 = rum.core.use_state("http://127.0.0.1:8080/");
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107621,(0),null);
var set_url_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107621,(1),null);
var vec__107624 = rum.core.use_state(false);
var pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107624,(0),null);
var set_pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107624,(1),null);
var handle_submit_BANG_ = (function (){
(set_pending_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_pending_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_pending_QMARK_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.load_plugin_from_web_url_BANG_(url),(function (){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("New plugin registered!",new cljs.core.Keyword(null,"success","success",1890645906));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})),(function (p1__107611_SHARP_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__107611_SHARP_),new cljs.core.Keyword(null,"error","error",-978969032));
})),(function (){
return (set_pending_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_pending_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_pending_QMARK_.call(null,false));
}));
});
return daiquiri.core.create_element("div",{'className':"px-4 pt-4 pb-2 rounded-md flex flex-col gap-2"},[(function (){var attrs107638 = (function (){var G__107654 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"http://",new cljs.core.Keyword(null,"value","value",305978217),url,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__107612_SHARP_){
var G__107655 = frontend.util.trim_safe(frontend.util.evalue(p1__107612_SHARP_));
return (set_url_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_url_BANG_.cljs$core$IFn$_invoke$arity$1(G__107655) : set_url_BANG_.call(null,G__107655));
}),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__107654) : logseq.shui.ui.input.call(null,G__107654));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107638))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-3"], null)], null),attrs107638], 0))):{'className':"flex flex-col gap-3"}),((cljs.core.map_QMARK_(attrs107638))?[(function (){var attrs107639 = logseq.shui.ui.tabler_icon("info-circle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107639))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-gray-10"], null)], null),attrs107639], 0))):{'className':"text-gray-10"}),((cljs.core.map_QMARK_(attrs107639))?[daiquiri.core.create_element("span",null,["URLs support both GitHub repositories and local development servers.\n      (For examples: https://github.com/xyhp915/logseq-journals-calendar,\n      http://localhost:8080/<plugin-dir-root>)"])]:[daiquiri.interpreter.interpret(attrs107639),daiquiri.core.create_element("span",null,["URLs support both GitHub repositories and local development servers.\n      (For examples: https://github.com/xyhp915/logseq-journals-calendar,\n      http://localhost:8080/<plugin-dir-root>)"])]));
})()]:[daiquiri.interpreter.interpret(attrs107638),(function (){var attrs107644 = logseq.shui.ui.tabler_icon("info-circle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107644))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-gray-10"], null)], null),attrs107644], 0))):{'className':"text-gray-10"}),((cljs.core.map_QMARK_(attrs107644))?[daiquiri.core.create_element("span",null,["URLs support both GitHub repositories and local development servers.\n      (For examples: https://github.com/xyhp915/logseq-journals-calendar,\n      http://localhost:8080/<plugin-dir-root>)"])]:[daiquiri.interpreter.interpret(attrs107644),daiquiri.core.create_element("span",null,["URLs support both GitHub repositories and local development servers.\n      (For examples: https://github.com/xyhp915/logseq-journals-calendar,\n      http://localhost:8080/<plugin-dir-root>)"])]));
})()]));
})(),(function (){var attrs107653 = (function (){var G__107656 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = pending_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(url);
}
})(),new cljs.core.Keyword(null,"on-click","on-click",1632826543),handle_submit_BANG_], null);
var G__107657 = (cljs.core.truth_(pending_QMARK_)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$0():"Install");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__107656,G__107657) : logseq.shui.ui.button.call(null,G__107656,G__107657));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107653))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end"], null)], null),attrs107653], 0))):{'className':"flex justify-end"}),((cljs.core.map_QMARK_(attrs107653))?null:[daiquiri.interpreter.interpret(attrs107653)]));
})()]);
}),null,"frontend.components.plugins/load-from-web-url-container");
frontend.components.plugins.install_from_github_release_container = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__107681 = rum.core.use_state("");
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107681,(0),null);
var set_url_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107681,(1),null);
var vec__107684 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"theme?","theme?",375926679),false,new cljs.core.Keyword(null,"effect?","effect?",1893336906),false], null));
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107684,(0),null);
var set_opts_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107684,(1),null);
var vec__107687 = rum.core.use_state(false);
var pending = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107687,(0),null);
var set_pending_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107687,(1),null);
var _STAR_input = rum.core.use_ref(null);
var attrs107666 = (function (){var G__107690 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"GitHub repo url",new cljs.core.Keyword(null,"value","value",305978217),url,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__107658_SHARP_){
var G__107691 = frontend.util.evalue(p1__107658_SHARP_);
return (set_url_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_url_BANG_.cljs$core$IFn$_invoke$arity$1(G__107691) : set_url_BANG_.call(null,G__107691));
}),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__107690) : logseq.shui.ui.input.call(null,G__107690));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107666))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-4","flex","flex-col","pb-0"], null)], null),attrs107666], 0))):{'className':"p-4 flex flex-col pb-0"}),((cljs.core.map_QMARK_(attrs107666))?[daiquiri.core.create_element("div",{'className':"flex gap-6 pt-3 items-center select-none"},[(function (){var attrs107696 = (function (){var G__107710 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"theme?","theme?",375926679).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__107659_SHARP_){
var G__107711 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"theme?","theme?",375926679),p1__107659_SHARP_);
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107711) : set_opts_BANG_.call(null,G__107711));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107710) : logseq.shui.ui.checkbox.call(null,G__107710));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs107696))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs107696], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs107696))?[daiquiri.core.create_element("span",{'className':"opacity-60"},["theme?"])]:[daiquiri.interpreter.interpret(attrs107696),daiquiri.core.create_element("span",{'className':"opacity-60"},["theme?"])]));
})(),(function (){var attrs107705 = (function (){var G__107712 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"effect?","effect?",1893336906).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__107660_SHARP_){
var G__107713 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"effect?","effect?",1893336906),p1__107660_SHARP_);
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107713) : set_opts_BANG_.call(null,G__107713));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107712) : logseq.shui.ui.checkbox.call(null,G__107712));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs107705))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs107705], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs107705))?[daiquiri.core.create_element("span",{'className':"opacity-60"},["effect?"])]:[daiquiri.interpreter.interpret(attrs107705),daiquiri.core.create_element("span",{'className':"opacity-60"},["effect?"])]));
})()]),(function (){var attrs107673 = (function (){var G__107714 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(((clojure.string.blank_QMARK_(frontend.util.trim_safe(url))) || ((!(clojure.string.starts_with_QMARK_(url,"https://")))))){
return rum.core.deref(_STAR_input).focus();
} else {
var url__$1 = clojure.string.replace_first(url,"https://github.com/","");
var matched = cljs.core.re_find(/([^\\/]+)\/([^\\/]+)/,url__$1);
var temp__5802__auto__ = (function (){var G__107716 = matched;
if((G__107716 == null)){
return null;
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(G__107716,(2));
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
(set_pending_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_pending_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_pending_BANG_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(window.logseq.api.__install_plugin(({"id": id, "repo": cljs.core.first(matched), "theme": new cljs.core.Keyword(null,"theme?","theme?",375926679).cljs$core$IFn$_invoke$arity$1(opts), "effect": new cljs.core.Keyword(null,"effect?","effect?",1893336906).cljs$core$IFn$_invoke$arity$1(opts)})),(function (){
return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})),(function (p1__107661_SHARP_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__107661_SHARP_),new cljs.core.Keyword(null,"error","error",-978969032));
})),(function (){
return (set_pending_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_pending_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_pending_BANG_.call(null,false));
}));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Invalid GitHub repo url",new cljs.core.Keyword(null,"error","error",-978969032));
}
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),pending], null);
var G__107715 = (cljs.core.truth_(pending)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Installing"):"Install");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__107714,G__107715) : logseq.shui.ui.button.call(null,G__107714,G__107715));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107673))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-3"], null)], null),attrs107673], 0))):{'className':"flex justify-end pt-3"}),((cljs.core.map_QMARK_(attrs107673))?null:[daiquiri.interpreter.interpret(attrs107673)]));
})()]:[daiquiri.interpreter.interpret(attrs107666),daiquiri.core.create_element("div",{'className':"flex gap-6 pt-3 items-center select-none"},[(function (){var attrs107721 = (function (){var G__107739 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"theme?","theme?",375926679).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__107659_SHARP_){
var G__107740 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"theme?","theme?",375926679),p1__107659_SHARP_);
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107740) : set_opts_BANG_.call(null,G__107740));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107739) : logseq.shui.ui.checkbox.call(null,G__107739));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs107721))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs107721], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs107721))?[daiquiri.core.create_element("span",{'className':"opacity-60"},["theme?"])]:[daiquiri.interpreter.interpret(attrs107721),daiquiri.core.create_element("span",{'className':"opacity-60"},["theme?"])]));
})(),(function (){var attrs107734 = (function (){var G__107741 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"effect?","effect?",1893336906).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__107660_SHARP_){
var G__107742 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"effect?","effect?",1893336906),p1__107660_SHARP_);
return (set_opts_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opts_BANG_.cljs$core$IFn$_invoke$arity$1(G__107742) : set_opts_BANG_.call(null,G__107742));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107741) : logseq.shui.ui.checkbox.call(null,G__107741));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs107734))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs107734], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs107734))?[daiquiri.core.create_element("span",{'className':"opacity-60"},["effect?"])]:[daiquiri.interpreter.interpret(attrs107734),daiquiri.core.create_element("span",{'className':"opacity-60"},["effect?"])]));
})()]),(function (){var attrs107680 = (function (){var G__107743 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(((clojure.string.blank_QMARK_(frontend.util.trim_safe(url))) || ((!(clojure.string.starts_with_QMARK_(url,"https://")))))){
return rum.core.deref(_STAR_input).focus();
} else {
var url__$1 = clojure.string.replace_first(url,"https://github.com/","");
var matched = cljs.core.re_find(/([^\\/]+)\/([^\\/]+)/,url__$1);
var temp__5802__auto__ = (function (){var G__107745 = matched;
if((G__107745 == null)){
return null;
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(G__107745,(2));
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
(set_pending_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_pending_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_pending_BANG_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(window.logseq.api.__install_plugin(({"id": id, "repo": cljs.core.first(matched), "theme": new cljs.core.Keyword(null,"theme?","theme?",375926679).cljs$core$IFn$_invoke$arity$1(opts), "effect": new cljs.core.Keyword(null,"effect?","effect?",1893336906).cljs$core$IFn$_invoke$arity$1(opts)})),(function (){
return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})),(function (p1__107661_SHARP_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__107661_SHARP_),new cljs.core.Keyword(null,"error","error",-978969032));
})),(function (){
return (set_pending_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_pending_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_pending_BANG_.call(null,false));
}));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Invalid GitHub repo url",new cljs.core.Keyword(null,"error","error",-978969032));
}
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),pending], null);
var G__107744 = (cljs.core.truth_(pending)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Installing"):"Install");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__107743,G__107744) : logseq.shui.ui.button.call(null,G__107743,G__107744));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107680))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-3"], null)], null),attrs107680], 0))):{'className':"flex justify-end pt-3"}),((cljs.core.map_QMARK_(attrs107680))?null:[daiquiri.interpreter.interpret(attrs107680)]));
})()]));
}),null,"frontend.components.plugins/install-from-github-release-container");
frontend.components.plugins.auto_check_for_updates_control = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__107746 = rum.core.use_state(frontend.handler.plugin.get_enabled_auto_check_for_updates_QMARK_());
var enabled = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107746,(0),null);
var set_enabled_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107746,(1),null);
var text = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","auto-check-for-updates","plugin/auto-check-for-updates",1128838222)], 0));
return daiquiri.core.create_element("div",{'onClick':(function (){
var t = cljs.core.not(enabled);
(set_enabled_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_enabled_BANG_.cljs$core$IFn$_invoke$arity$1(t) : set_enabled_BANG_.call(null,t));

frontend.handler.plugin.set_enabled_auto_check_for_updates(t);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),text,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.pl-1","strong.pl-1",384034726),((t)?"ON":"OFF")], null),"!"], null),((t)?new cljs.core.Keyword(null,"success","success",1890645906):new cljs.core.Keyword(null,"info","info",-317069002)));
}),'className':"flex items-center justify-between px-3 py-2"},[(function (){var attrs107749 = text;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs107749))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pr-3","opacity-80"], null)], null),attrs107749], 0))):{'className':"pr-3 opacity-80"}),((cljs.core.map_QMARK_(attrs107749))?null:[daiquiri.interpreter.interpret(attrs107749)]));
})(),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled,(function (){
return cljs.core.List.EMPTY;
}),true))]);
}),null,"frontend.components.plugins/auto-check-for-updates-control");
frontend.components.plugins.panel_control_tabs = rum.core.lazy_build(rum.core.build_defc,(function (search_key,_STAR_search_key,category,_STAR_category,sort_by,_STAR_sort_by,filter_by,_STAR_filter_by,total_nums,selected_unpacked_pkg,market_QMARK_,develop_mode_QMARK_,reload_market_fn,agent_opts){
var _STAR_search_ref = rum.core.create_ref();
return daiquiri.core.create_element("div",{'className':"pb-3 flex justify-between control-tabs relative"},[daiquiri.core.create_element("div",{'className':"flex items-center l"},[frontend.components.plugins.category_tabs(frontend.context.i18n.t,total_nums,category,(function (p1__107750_SHARP_){
return cljs.core.reset_BANG_(_STAR_category,p1__107750_SHARP_);
})),(cljs.core.truth_((function (){var and__5000__auto__ = develop_mode_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(market_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",null,[frontend.ui.tooltip(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","load-unpacked","plugin/load-unpacked",507641009)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),"upload",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"class","class",-2030961996),"load-unpacked",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.plugin.load_unpacked_plugin], null)], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","unpacked-tips","plugin/unpacked-tips",-460131094)], 0))], null)),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.plugins.unpacked_plugin_loader(selected_unpacked_pkg):null)]):null)]),(function (){var attrs107756 = (function (){var temp__5804__auto__ = frontend.state.http_proxy_enabled_or_val_QMARK_();
if(cljs.core.truth_(temp__5804__auto__)){
var proxy_val = temp__5804__auto__;
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.text-indigo-500","span.flex.items-center.text-indigo-500",1098756579),frontend.ui.icon("world-download"),proxy_val], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),agent_opts], null));
})], 0));
} else {
return null;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107756))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","r"], null)], null),attrs107756], 0))):{'className':"flex items-center r"}),((cljs.core.map_QMARK_(attrs107756))?[frontend.components.plugins.panel_tab_search(search_key,_STAR_search_key,_STAR_search_ref),(function (){var aim_icon = (function (p1__107751_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_by,p1__107751_SHARP_)){
return "check";
} else {
return "circle";
}
});
var items = (cljs.core.truth_(market_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","all","plugin/all",-235519199)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installed","plugin/installed",-431253936)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"installed","installed",553977691));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"installed","installed",553977691)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","not-installed","plugin/not-installed",177167620)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"not-installed","not-installed",1160178735));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"not-installed","not-installed",1160178735)))], null)], null):new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","all","plugin/all",-235519199)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","enabled","plugin/enabled",-2065640529)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"enabled","enabled",1195909756));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"enabled","enabled",1195909756)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","disabled","plugin/disabled",-644208599)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"disabled","disabled",-1529784218));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"disabled","disabled",-1529784218)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","unpacked","plugin/unpacked",-80516789)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"unpacked","unpacked",828895838));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"unpacked","unpacked",828895838)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update-available","plugin/update-available",-1277547790)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"update-available","update-available",-283010019));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"update-available","update-available",-283010019)))], null)], null));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("filter"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),[((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null),filter_by))?null:"picked "),"sort-or-filter-by"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107752_SHARP_){
var G__107762 = p1__107752_SHARP_.target;
var G__107763 = (function (p__107765){
var map__107766 = p__107765;
var map__107766__$1 = cljs.core.__destructure_map(map__107766);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107766__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107764 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107762,G__107763,G__107764) : logseq.shui.ui.popup_show_BANG_.call(null,G__107762,G__107763,G__107764));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})(),(cljs.core.truth_(market_QMARK_)?(function (){var aim_icon = (function (p1__107753_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sort_by,p1__107753_SHARP_)){
return "check";
} else {
return "circle";
}
});
var items = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","popular","plugin/popular",476085695)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","downloads","plugin/downloads",622437555)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"downloads","downloads",-513600190));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"downloads","downloads",-513600190)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","stars","plugin/stars",-1508522616)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"stars","stars",-556837771));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"stars","stars",-556837771)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","title","plugin/title",1789469082),"A - Z"], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"letters","letters",2098125298));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"letters","letters",2098125298)))], null)], null);
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("arrows-sort"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),[((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"popular","popular",-752193652),null], null), null),sort_by))?null:"picked "),"sort-or-filter-by"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107754_SHARP_){
var G__107772 = p1__107754_SHARP_.target;
var G__107773 = (function (p__107775){
var map__107776 = p__107775;
var map__107776__$1 = cljs.core.__destructure_map(map__107776);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107776__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107774 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107772,G__107773,G__107774) : logseq.shui.ui.popup_show_BANG_.call(null,G__107772,G__107773,G__107774));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})():null),(function (){var items = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(market_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("rotate-clockwise"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","refresh-lists","plugin/refresh-lists",-968393268)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (reload_market_fn.cljs$core$IFn$_invoke$arity$0 ? reload_market_fn.cljs$core$IFn$_invoke$arity$0() : reload_market_fn.call(null));
})], null)], null)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("rotate-clockwise"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","check-all-updates","plugin/check-all-updates",1407600189)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.user_check_enabled_for_updates_BANG_(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"plugins","plugins",1900073717),category));
})], null)], null)], null)),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("world"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","network-proxy","settings-page/network-proxy",-895413144)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),agent_opts], null));
})], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("arrow-down-circle"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin.install-from-file","menu-title","plugin.install-from-file/menu-title",1329038520)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.plugin_config.open_replace_plugins_modal], null)], null)], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr","hr",1377740067),true], null)], null),(cljs.core.truth_(frontend.state.developer_mode_QMARK_())?(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("file-code"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-preferences","plugin/open-preferences",-453136863)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.get_ls_dotdir_root()),(function (root){
return promesa.protocols._promise(apis.openPath([cljs.core.str.cljs$core$IFn$_invoke$arity$1(root),"/preferences.json"].join('')));
}));
}));
})], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.whitespace-nowrap.gap-1","span.flex.items-center.whitespace-nowrap.gap-1",-1439858223),frontend.ui.icon("bug"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-logseq-dir","plugin/open-logseq-dir",2030587800)], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"~/.logseq"], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.get_ls_dotdir_root()),(function (root){
return promesa.protocols._promise(apis.openPath(root));
}));
}));
})], null)], null)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.whitespace-nowrap.gap-1","span.flex.items-center.whitespace-nowrap.gap-1",-1439858223),frontend.ui.icon("plug"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","load-from-web-url","plugin/load-from-web-url",-429739384)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.plugins.load_from_web_url_container) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.plugins.load_from_web_url_container));
})], null)], null)], null)):null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("alert-triangle"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","report-security","plugin/report-security",29084696)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$0();
})], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hr","hr",1377740067),true,new cljs.core.Keyword(null,"key","key",-1516042587),"dropdown-more"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),frontend.components.plugins.auto_check_for_updates_control()], null)], null)], 0));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("dots-vertical"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"more-do",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107755_SHARP_){
var G__107782 = p1__107755_SHARP_.target;
var G__107783 = (function (p__107785){
var map__107786 = p__107785;
var map__107786__$1 = cljs.core.__destructure_map(map__107786);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107786__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107784 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"center",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"side-offset","side-offset",207149931),(10)], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107782,G__107783,G__107784) : logseq.shui.ui.popup_show_BANG_.call(null,G__107782,G__107783,G__107784));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})(),frontend.components.plugins.panel_tab_developer()]:[daiquiri.interpreter.interpret(attrs107756),frontend.components.plugins.panel_tab_search(search_key,_STAR_search_key,_STAR_search_ref),(function (){var aim_icon = (function (p1__107751_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_by,p1__107751_SHARP_)){
return "check";
} else {
return "circle";
}
});
var items = (cljs.core.truth_(market_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","all","plugin/all",-235519199)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installed","plugin/installed",-431253936)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"installed","installed",553977691));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"installed","installed",553977691)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","not-installed","plugin/not-installed",177167620)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"not-installed","not-installed",1160178735));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"not-installed","not-installed",1160178735)))], null)], null):new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","all","plugin/all",-235519199)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","enabled","plugin/enabled",-2065640529)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"enabled","enabled",1195909756));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"enabled","enabled",1195909756)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","disabled","plugin/disabled",-644208599)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"disabled","disabled",-1529784218));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"disabled","disabled",-1529784218)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","unpacked","plugin/unpacked",-80516789)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"unpacked","unpacked",828895838));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"unpacked","unpacked",828895838)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update-available","plugin/update-available",-1277547790)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_filter_by,new cljs.core.Keyword(null,"update-available","update-available",-283010019));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"update-available","update-available",-283010019)))], null)], null));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("filter"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),[((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null),filter_by))?null:"picked "),"sort-or-filter-by"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107752_SHARP_){
var G__107793 = p1__107752_SHARP_.target;
var G__107794 = (function (p__107796){
var map__107798 = p__107796;
var map__107798__$1 = cljs.core.__destructure_map(map__107798);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107798__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107795 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107793,G__107794,G__107795) : logseq.shui.ui.popup_show_BANG_.call(null,G__107793,G__107794,G__107795));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})(),(cljs.core.truth_(market_QMARK_)?(function (){var aim_icon = (function (p1__107753_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sort_by,p1__107753_SHARP_)){
return "check";
} else {
return "circle";
}
});
var items = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","popular","plugin/popular",476085695)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"default","default",-1987822328));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"default","default",-1987822328)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","downloads","plugin/downloads",622437555)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"downloads","downloads",-513600190));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"downloads","downloads",-513600190)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","stars","plugin/stars",-1508522616)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"stars","stars",-556837771));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"stars","stars",-556837771)))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","title","plugin/title",1789469082),"A - Z"], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_sort_by,new cljs.core.Keyword(null,"letters","letters",2098125298));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(aim_icon(new cljs.core.Keyword(null,"letters","letters",2098125298)))], null)], null);
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("arrows-sort"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),[((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"popular","popular",-752193652),null], null), null),sort_by))?null:"picked "),"sort-or-filter-by"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107754_SHARP_){
var G__107804 = p1__107754_SHARP_.target;
var G__107805 = (function (p__107807){
var map__107808 = p__107807;
var map__107808__$1 = cljs.core.__destructure_map(map__107808);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107808__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107806 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107804,G__107805,G__107806) : logseq.shui.ui.popup_show_BANG_.call(null,G__107804,G__107805,G__107806));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})():null),(function (){var items = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(market_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("rotate-clockwise"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","refresh-lists","plugin/refresh-lists",-968393268)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (reload_market_fn.cljs$core$IFn$_invoke$arity$0 ? reload_market_fn.cljs$core$IFn$_invoke$arity$0() : reload_market_fn.call(null));
})], null)], null)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("rotate-clockwise"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","check-all-updates","plugin/check-all-updates",1407600189)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.user_check_enabled_for_updates_BANG_(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"plugins","plugins",1900073717),category));
})], null)], null)], null)),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("world"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","network-proxy","settings-page/network-proxy",-895413144)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),agent_opts], null));
})], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("arrow-down-circle"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin.install-from-file","menu-title","plugin.install-from-file/menu-title",1329038520)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.plugin_config.open_replace_plugins_modal], null)], null)], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr","hr",1377740067),true], null)], null),(cljs.core.truth_(frontend.state.developer_mode_QMARK_())?(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("file-code"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-preferences","plugin/open-preferences",-453136863)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.get_ls_dotdir_root()),(function (root){
return promesa.protocols._promise(apis.openPath([cljs.core.str.cljs$core$IFn$_invoke$arity$1(root),"/preferences.json"].join('')));
}));
}));
})], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.whitespace-nowrap.gap-1","span.flex.items-center.whitespace-nowrap.gap-1",-1439858223),frontend.ui.icon("bug"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","open-logseq-dir","plugin/open-logseq-dir",2030587800)], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"~/.logseq"], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.get_ls_dotdir_root()),(function (root){
return promesa.protocols._promise(apis.openPath(root));
}));
}));
})], null)], null)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.whitespace-nowrap.gap-1","span.flex.items-center.whitespace-nowrap.gap-1",-1439858223),frontend.ui.icon("plug"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","load-from-web-url","plugin/load-from-web-url",-429739384)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.plugins.load_from_web_url_container) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.plugins.load_from_web_url_container));
})], null)], null)], null)):null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),frontend.ui.icon("alert-triangle"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","report-security","plugin/report-security",29084696)], 0))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$0();
})], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hr","hr",1377740067),true,new cljs.core.Keyword(null,"key","key",-1516042587),"dropdown-more"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),frontend.components.plugins.auto_check_for_updates_control()], null)], null)], 0));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("dots-vertical"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"more-do",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__107755_SHARP_){
var G__107814 = p1__107755_SHARP_.target;
var G__107815 = (function (p__107817){
var map__107818 = p__107817;
var map__107818__$1 = cljs.core.__destructure_map(map__107818);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107818__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items);
});
var G__107816 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"center",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"side-offset","side-offset",207149931),(10)], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107814,G__107815,G__107816) : logseq.shui.ui.popup_show_BANG_.call(null,G__107814,G__107815,G__107816));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576)], 0)));
})(),frontend.components.plugins.panel_tab_developer()]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/panel-control-tabs");
frontend.components.plugins.plugin_items_list_mixins = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (s){
var temp__5804__auto___108357 = rum.core.dom_node(s);
if(cljs.core.truth_(temp__5804__auto___108357)){
var el_108358 = temp__5804__auto___108357;
var temp__5804__auto___108359__$1 = el_108358.querySelector(".cp__plugins-item-lists");
if(cljs.core.truth_(temp__5804__auto___108359__$1)){
var el_list_108360 = temp__5804__auto___108359__$1;
var temp__5804__auto___108361__$2 = el_108358.querySelector(".control-tabs").classList;
if(cljs.core.truth_(temp__5804__auto___108361__$2)){
var cls_108362 = temp__5804__auto___108361__$2;
el_list_108360.addEventListener("scroll",(function (){
if((el_list_108360.scrollTop > (1))){
return cls_108362.add("scrolled");
} else {
return cls_108362.remove("scrolled");
}
}));
} else {
}
} else {
}
} else {
}

return s;
})], null);
frontend.components.plugins.lazy_items_loader = rum.core.lazy_build(rum.core.build_defc,(function (load_more_BANG_){
var inViewState = (function (){var G__107819 = ({"threshold": (0)});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__107819) : frontend.ui.useInView.call(null,G__107819));
})();
var in_view_QMARK_ = inViewState.inView;
logseq.shui.hooks.use_effect_BANG_((function (){
return (load_more_BANG_.cljs$core$IFn$_invoke$arity$0 ? load_more_BANG_.cljs$core$IFn$_invoke$arity$0() : load_more_BANG_.call(null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [in_view_QMARK_], null));

return daiquiri.core.create_element("div",{'ref':inViewState.ref},[daiquiri.core.create_element("p",{'className':"py-1 text-center opacity-0"},[(cljs.core.truth_(inViewState.inView)?"\u00B7":null)])]);
}),null,"frontend.components.plugins/lazy-items-loader");
frontend.components.plugins.weighted_sort_by = (function frontend$components$plugins$weighted_sort_by(key,pkgs){
var default_QMARK_ = (((key == null)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,new cljs.core.Keyword(null,"default","default",-1987822328))));
var grouped_pkgs = ((default_QMARK_)?(function (){var G__107828 = pkgs;
var G__107828__$1 = (((G__107828 == null))?null:cljs.core.group_by((function (p__107829){
var map__107830 = p__107829;
var map__107830__$1 = cljs.core.__destructure_map(map__107830);
var addedAt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107830__$1,new cljs.core.Keyword(null,"addedAt","addedAt",-2067173712));
return ((typeof addedAt === 'number') && (((Date.now() - addedAt) < (((((1000) * (60)) * (60)) * (24)) * (6)))));
}),G__107828));
if((G__107828__$1 == null)){
return null;
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__107828__$1);
}
})():new cljs.core.PersistentArrayMap(null, 1, [false,pkgs], null));
var pinned_pkgs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_pkgs,true);
var pkgs__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_pkgs,false);
var vec__107825 = ((default_QMARK_)?(function (){var decay_factor = 0.001;
var download_weight = 0.8;
var star_weight = 0.2;
var normalize = (function frontend$components$plugins$weighted_sort_by_$_normalize(vals,val){
var min_val = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,vals);
var max_val = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,vals);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(max_val,min_val)){
return (0);
} else {
return ((val - min_val) / (max_val - min_val));
}
});
var time_diff_in_days = (function frontend$components$plugins$weighted_sort_by_$_time_diff_in_days(ts){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof ts === 'number';
if(and__5000__auto__){
return (Date.now() - ts);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var time_diff = temp__5804__auto__;
return (time_diff / ((((1000) * (60)) * (60)) * (24)));
} else {
return null;
}
});
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"weight","weight",-1262796205),(function (){var all_downloads = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__107820_SHARP_){
return (!(typeof p1__107820_SHARP_ === 'number'));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"downloads","downloads",-513600190),pkgs__$1));
var all_stars = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__107821_SHARP_){
return (!(typeof p1__107821_SHARP_ === 'number'));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"stars","stars",-556837771),pkgs__$1));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__107831){
var map__107832 = p__107831;
var map__107832__$1 = cljs.core.__destructure_map(map__107832);
var pkg = map__107832__$1;
var downloads = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107832__$1,new cljs.core.Keyword(null,"downloads","downloads",-513600190));
var stars = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107832__$1,new cljs.core.Keyword(null,"stars","stars",-556837771));
var latestAt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107832__$1,new cljs.core.Keyword(null,"latestAt","latestAt",1260716261));
var downloads__$1 = ((typeof downloads === 'number')?downloads:(1));
var stars__$1 = ((typeof stars === 'number')?stars:(1));
var days_since_latest = time_diff_in_days(latestAt);
var decay = Math.exp((((-1) * decay_factor) * days_since_latest));
var normalized_downloads = normalize(all_downloads,downloads__$1);
var normalize_stars = normalize(all_stars,stars__$1);
var download_score = (normalized_downloads * download_weight);
var star_score = (normalize_stars * star_weight);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(pkg,new cljs.core.Keyword(null,"weight","weight",-1262796205),((download_score + star_score) + decay));
}),pkgs__$1);
})()], null);
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,pkgs__$1], null));
var key__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107825,(0),null);
var pkgs__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107825,(1),null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(pinned_pkgs,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.sort_by,cljs.core.conj.cljs$core$IFn$_invoke$arity$2((function (){var G__107833 = key__$1;
var G__107833__$1 = (((G__107833 instanceof cljs.core.Keyword))?G__107833.fqn:null);
switch (G__107833__$1) {
case "letters":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (p1__107822_SHARP_){
return frontend.util.safe_lower_case((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(p1__107822_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__107822_SHARP_);
}
})());
})], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key__$1,(function (p1__107824_SHARP_,p2__107823_SHARP_){
return cljs.core.compare(p2__107823_SHARP_,p1__107824_SHARP_);
})], null);

}
})(),pkgs__$2)));
});
frontend.components.plugins.marketplace_plugins = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_list_node_ref = rum.core.create_ref();
var pkgs = frontend.state.sub(new cljs.core.Keyword("plugin","marketplace-pkgs","plugin/marketplace-pkgs",637462798));
var stats = frontend.state.sub(new cljs.core.Keyword("plugin","marketplace-stats","plugin/marketplace-stats",1801405730));
var installed_plugins = frontend.state.sub(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034));
var installing = frontend.state.sub(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581));
var online_QMARK_ = frontend.state.sub(new cljs.core.Keyword("network","online?","network/online?",1306822774));
var develop_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878));
var agent_opts = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("settings","agent","settings/agent",2144439922)], null));
var _STAR_search_key = new cljs.core.Keyword("frontend.components.plugins","search-key","frontend.components.plugins/search-key",1754546424).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_category = new cljs.core.Keyword("frontend.components.plugins","category","frontend.components.plugins/category",1292709236).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_sort_by = new cljs.core.Keyword("frontend.components.plugins","sort-by","frontend.components.plugins/sort-by",1336057821).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_filter_by = new cljs.core.Keyword("frontend.components.plugins","filter-by","frontend.components.plugins/filter-by",-1578178539).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_cached_query_flag = new cljs.core.Keyword("frontend.components.plugins","cached-query-flag","frontend.components.plugins/cached-query-flag",-1516213499).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_current_page = new cljs.core.Keyword("frontend.components.plugins","current-page","frontend.components.plugins/current-page",1720536456).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_fetching = new cljs.core.Keyword("frontend.components.plugins","fetching","frontend.components.plugins/fetching",-330343025).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_error = new cljs.core.Keyword("frontend.components.plugins","error","frontend.components.plugins/error",1422088124).cljs$core$IFn$_invoke$arity$1(state);
var theme_plugins = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107835_SHARP_){
return new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__107835_SHARP_);
}),pkgs);
var normal_plugins = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107836_SHARP_){
return cljs.core.not(new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__107836_SHARP_));
}),pkgs);
var filtered_pkgs = ((cljs.core.seq(pkgs))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_category),new cljs.core.Keyword(null,"themes","themes",-702786642)))?theme_plugins:normal_plugins):null);
var total_nums = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.count(normal_plugins),cljs.core.count(theme_plugins)], null);
var filtered_pkgs__$1 = ((((cljs.core.seq(filtered_pkgs)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),cljs.core.deref(_STAR_filter_by)))))?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107837_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"installed","installed",553977691),cljs.core.deref(_STAR_filter_by)))?cljs.core.identity:cljs.core.not),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.contains_QMARK_(installed_plugins,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__107837_SHARP_)))], null));
}),filtered_pkgs):filtered_pkgs);
var filtered_pkgs__$2 = (((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_search_key)))))?(function (){var temp__5802__auto__ = (function (){var and__5000__auto__ = clojure.string.starts_with_QMARK_(cljs.core.deref(_STAR_search_key),"@");
if(and__5000__auto__){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_search_key),(1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var author = temp__5802__auto__;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107838_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(author,new cljs.core.Keyword(null,"author","author",2111686192).cljs$core$IFn$_invoke$arity$1(p1__107838_SHARP_));
}),filtered_pkgs__$1);
} else {
var G__107841 = filtered_pkgs__$1;
var G__107842 = cljs.core.deref(_STAR_search_key);
var G__107843 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__107844 = (30);
var G__107845 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__107846 = new cljs.core.Keyword(null,"title","title",636505583);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(G__107841,G__107842,G__107843,G__107844,G__107845,G__107846) : frontend.search.fuzzy_search.call(null,G__107841,G__107842,G__107843,G__107844,G__107845,G__107846));
}
})():filtered_pkgs__$1);
var filtered_pkgs__$3 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107839_SHARP_){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(stats,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__107839_SHARP_)));
if(cljs.core.truth_(temp__5802__auto__)){
var stat = temp__5802__auto__;
var downloads = new cljs.core.Keyword(null,"total_downloads","total_downloads",-1370933259).cljs$core$IFn$_invoke$arity$1(stat);
var stars = new cljs.core.Keyword(null,"stargazers_count","stargazers_count",-984649909).cljs$core$IFn$_invoke$arity$1(stat);
var latest_at = (function (){var G__107847 = new cljs.core.Keyword(null,"updated_at","updated_at",-460224592).cljs$core$IFn$_invoke$arity$1(stat);
var G__107847__$1 = (((G__107847 == null))?null:(new Date(G__107847)));
if((G__107847__$1 == null)){
return null;
} else {
return G__107847__$1.getTime();
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(p1__107839_SHARP_,new cljs.core.Keyword(null,"stat","stat",-1370599836),stat,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stars","stars",-556837771),stars,new cljs.core.Keyword(null,"latestAt","latestAt",1260716261),latest_at,new cljs.core.Keyword(null,"downloads","downloads",-513600190),downloads], 0));
} else {
return p1__107839_SHARP_;
}
}),filtered_pkgs__$2);
var sorted_plugins = frontend.components.plugins.weighted_sort_by(cljs.core.deref(_STAR_sort_by),filtered_pkgs__$3);
var fn_query_flag = (function (){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("_",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107840_SHARP_){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(p1__107840_SHARP_));
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [_STAR_filter_by,_STAR_sort_by,_STAR_search_key,_STAR_category], null)));
});
var str_query_flag = fn_query_flag();
var _ = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(str_query_flag,cljs.core.deref(_STAR_cached_query_flag)))?(function (){
var temp__5804__auto___108364 = rum.core.deref(_STAR_list_node_ref);
if(cljs.core.truth_(temp__5804__auto___108364)){
var list_cnt_108365 = temp__5804__auto___108364;
(list_cnt_108365.scrollTop = (0));
} else {
}

return cljs.core.reset_BANG_(_STAR_current_page,(1));
})()
:null);
var ___$1 = cljs.core.reset_BANG_(_STAR_cached_query_flag,str_query_flag);
var page_total_items = cljs.core.count(sorted_plugins);
var sorted_plugins__$1 = (((!((page_total_items > frontend.components.plugins.PER_PAGE_SIZE))))?sorted_plugins:cljs.core.take.cljs$core$IFn$_invoke$arity$2((cljs.core.deref(_STAR_current_page) * frontend.components.plugins.PER_PAGE_SIZE),sorted_plugins));
var load_more_pages_BANG_ = (function (){
if((page_total_items > frontend.components.plugins.PER_PAGE_SIZE)){
if(((frontend.components.plugins.PER_PAGE_SIZE * cljs.core.deref(_STAR_current_page)) < page_total_items)){
return cljs.core.reset_BANG_(_STAR_current_page,(cljs.core.deref(_STAR_current_page) + (1)));
} else {
return null;
}
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"cp__plugins-marketplace"},[frontend.components.plugins.panel_control_tabs(cljs.core.deref(_STAR_search_key),_STAR_search_key,cljs.core.deref(_STAR_category),_STAR_category,cljs.core.deref(_STAR_sort_by),_STAR_sort_by,cljs.core.deref(_STAR_filter_by),_STAR_filter_by,total_nums,null,true,develop_mode_QMARK_,new cljs.core.Keyword("frontend.components.plugins","reload","frontend.components.plugins/reload",-1021433549).cljs$core$IFn$_invoke$arity$1(state),agent_opts),((cljs.core.not(online_QMARK_))?(function (){var attrs107848 = frontend.components.svg.offline.cljs$core$IFn$_invoke$arity$1((30));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107848))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-center","pt-20","opacity-50"], null)], null),attrs107848], 0))):{'className':"flex justify-center pt-20 opacity-50"}),((cljs.core.map_QMARK_(attrs107848))?null:[daiquiri.interpreter.interpret(attrs107848)]));
})():(cljs.core.truth_(cljs.core.deref(_STAR_fetching))?(function (){var attrs107849 = frontend.components.svg.loading;
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107849))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-center","py-20"], null)], null),attrs107849], 0))):{'className':"flex justify-center py-20"}),((cljs.core.map_QMARK_(attrs107849))?null:[daiquiri.interpreter.interpret(attrs107849)]));
})():(cljs.core.truth_(cljs.core.deref(_STAR_error))?(function (){var attrs107850 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","remote-error","plugin/remote-error",-1070592042)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107850))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-center","pt-20","opacity-50"], null)], null),attrs107850], 0))):{'className':"flex justify-center pt-20 opacity-50"}),((cljs.core.map_QMARK_(attrs107850))?[daiquiri.interpreter.interpret(cljs.core.deref(_STAR_error).message)]:[daiquiri.interpreter.interpret(attrs107850),daiquiri.interpreter.interpret(cljs.core.deref(_STAR_error).message)]));
})():daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__plugins-marketplace-cnt",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"has-installing","has-installing",853601088),cljs.core.boolean$(installing)], null)], null))], null))},[daiquiri.core.create_element("div",{'ref':_STAR_list_node_ref,'className':"cp__plugins-item-lists"},[daiquiri.core.create_element("div",{'className':"cp__plugins-item-lists-inner"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107851(s__107852){
return (new cljs.core.LazySeq(null,(function (){
var s__107852__$1 = s__107852;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107852__$1);
if(temp__5804__auto__){
var s__107852__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107852__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107852__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107854 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107853 = (0);
while(true){
if((i__107853 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__107853);
cljs.core.chunk_append(b__107854,rum.core.with_key((function (){var pid = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
var stat = new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(item);
return frontend.components.plugins.plugin_item_card(frontend.context.i18n.t,item,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null)),true,_STAR_search_key,installing,(function (){var and__5000__auto__ = installing;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(installing)),pid);
} else {
return and__5000__auto__;
}
})(),cljs.core.contains_QMARK_(installed_plugins,pid),stat,null);
})(),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)));

var G__108366 = (i__107853 + (1));
i__107853 = G__108366;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107854),frontend$components$plugins$iter__107851(cljs.core.chunk_rest(s__107852__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107854),null);
}
} else {
var item = cljs.core.first(s__107852__$2);
return cljs.core.cons(rum.core.with_key((function (){var pid = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
var stat = new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(item);
return frontend.components.plugins.plugin_item_card(frontend.context.i18n.t,item,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null)),true,_STAR_search_key,installing,(function (){var and__5000__auto__ = installing;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(installing)),pid);
} else {
return and__5000__auto__;
}
})(),cljs.core.contains_QMARK_(installed_plugins,pid),stat,null);
})(),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)),frontend$components$plugins$iter__107851(cljs.core.rest(s__107852__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sorted_plugins__$1);
})())]),((cljs.core.seq(sorted_plugins__$1))?frontend.components.plugins.lazy_items_loader(load_more_pages_BANG_):null)])])
)))]);
}),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive,frontend.components.plugins.plugin_items_list_mixins,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.plugins","fetching","frontend.components.plugins/fetching",-330343025)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.plugins","search-key","frontend.components.plugins/search-key",1754546424)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"plugins","plugins",1900073717),new cljs.core.Keyword("frontend.components.plugins","category","frontend.components.plugins/category",1292709236)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("frontend.components.plugins","sort-by","frontend.components.plugins/sort-by",1336057821)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("frontend.components.plugins","filter-by","frontend.components.plugins/filter-by",-1578178539)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.plugins","error","frontend.components.plugins/error",1422088124)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.plugins","cached-query-flag","frontend.components.plugins/cached-query-flag",-1516213499)),rum.core.local.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword("frontend.components.plugins","current-page","frontend.components.plugins/current-page",1720536456)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (s){
var reload_fn = (function (force_refresh_QMARK_){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("frontend.components.plugins","fetching","frontend.components.plugins/fetching",-330343025).cljs$core$IFn$_invoke$arity$1(s)))){
return null;
} else {
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.plugins","fetching","frontend.components.plugins/fetching",-330343025).cljs$core$IFn$_invoke$arity$1(s),true);

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.plugins","error","frontend.components.plugins/error",1422088124).cljs$core$IFn$_invoke$arity$1(s),null);

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.load_marketplace_plugins(force_refresh_QMARK_),(function (){
return frontend.handler.plugin.load_marketplace_stats(false);
})),(function (p1__107834_SHARP_){
console.error(p1__107834_SHARP_);

return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.plugins","error","frontend.components.plugins/error",1422088124).cljs$core$IFn$_invoke$arity$1(s),p1__107834_SHARP_);
})),(function (){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.plugins","fetching","frontend.components.plugins/fetching",-330343025).cljs$core$IFn$_invoke$arity$1(s),false);
}));
}
});
reload_fn(false);

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(s,new cljs.core.Keyword("frontend.components.plugins","reload","frontend.components.plugins/reload",-1021433549),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(reload_fn,true));
})], null)], null),"frontend.components.plugins/marketplace-plugins");
frontend.components.plugins.installed_plugins = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_list_node_ref = rum.core.create_ref();
var installed_plugins_SINGLEQUOTE_ = cljs.core.vals(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034)], null)));
var updating = frontend.state.sub(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581));
var develop_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878));
var selected_unpacked_pkg = frontend.state.sub(new cljs.core.Keyword("plugin","selected-unpacked-pkg","plugin/selected-unpacked-pkg",-286319185));
var coming_updates = frontend.state.sub(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263));
var agent_opts = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("settings","agent","settings/agent",2144439922)], null));
var _STAR_filter_by = new cljs.core.Keyword("frontend.components.plugins","filter-by","frontend.components.plugins/filter-by",-1578178539).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_sort_by = new cljs.core.Keyword("frontend.components.plugins","sort-by","frontend.components.plugins/sort-by",1336057821).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_search_key = new cljs.core.Keyword("frontend.components.plugins","search-key","frontend.components.plugins/search-key",1754546424).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_category = new cljs.core.Keyword("frontend.components.plugins","category","frontend.components.plugins/category",1292709236).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_cached_query_flag = new cljs.core.Keyword("frontend.components.plugins","cached-query-flag","frontend.components.plugins/cached-query-flag",-1516213499).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_current_page = new cljs.core.Keyword("frontend.components.plugins","current-page","frontend.components.plugins/current-page",1720536456).cljs$core$IFn$_invoke$arity$1(state);
var default_filter_by_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),cljs.core.deref(_STAR_filter_by));
var theme_plugins = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107855_SHARP_){
return new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__107855_SHARP_);
}),installed_plugins_SINGLEQUOTE_);
var normal_plugins = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107856_SHARP_){
return cljs.core.not(new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__107856_SHARP_));
}),installed_plugins_SINGLEQUOTE_);
var filtered_plugins = ((cljs.core.seq(installed_plugins_SINGLEQUOTE_))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_category),new cljs.core.Keyword(null,"themes","themes",-702786642)))?theme_plugins:normal_plugins):null);
var total_nums = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.count(normal_plugins),cljs.core.count(theme_plugins)], null);
var filtered_plugins__$1 = (((!(default_filter_by_QMARK_)))?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (it){
var disabled = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(it,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null));
var G__107867 = cljs.core.deref(_STAR_filter_by);
var G__107867__$1 = (((G__107867 instanceof cljs.core.Keyword))?G__107867.fqn:null);
switch (G__107867__$1) {
case "enabled":
return cljs.core.not(disabled);

break;
case "disabled":
return disabled;

break;
case "unpacked":
return cljs.core.not(new cljs.core.Keyword(null,"iir","iir",-231680811).cljs$core$IFn$_invoke$arity$1(it));

break;
case "update-available":
return frontend.state.plugin_update_available_QMARK_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it));

break;
default:
return true;

}
}),filtered_plugins):filtered_plugins);
var filtered_plugins__$2 = (((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_search_key)))))?(function (){var temp__5802__auto__ = (function (){var and__5000__auto__ = clojure.string.starts_with_QMARK_(cljs.core.deref(_STAR_search_key),"@");
if(and__5000__auto__){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_search_key),(1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var author = temp__5802__auto__;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__107857_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(author,new cljs.core.Keyword(null,"author","author",2111686192).cljs$core$IFn$_invoke$arity$1(p1__107857_SHARP_));
}),filtered_plugins__$1);
} else {
var G__107868 = filtered_plugins__$1;
var G__107869 = cljs.core.deref(_STAR_search_key);
var G__107870 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__107871 = (30);
var G__107872 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__107873 = new cljs.core.Keyword(null,"name","name",1843675177);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(G__107868,G__107869,G__107870,G__107871,G__107872,G__107873) : frontend.search.fuzzy_search.call(null,G__107868,G__107869,G__107870,G__107871,G__107872,G__107873));
}
})():filtered_plugins__$1);
var sorted_plugins = ((default_filter_by_QMARK_)?cljs.core.flatten((function (p1__107860_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(p1__107860_SHARP_,(0),(function (coll){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"iir","iir",-231680811),coll);
}));
})(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__107859_SHARP_,p2__107858_SHARP_){
var disabled_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p2__107858_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null));
var old_dirty = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.plugins._STAR_dirties_toggle_items),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p2__107858_SHARP_)));
var k = (cljs.core.truth_(((cljs.core.boolean_QMARK_(old_dirty))?(!(old_dirty)):disabled_QMARK_))?(1):(0));
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(p1__107859_SHARP_,k,cljs.core.conj,p2__107858_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentVector.EMPTY,cljs.core.PersistentVector.EMPTY], null),filtered_plugins__$2))):(function (){
frontend.components.plugins.clear_dirties_states_BANG_();

return filtered_plugins__$2;
})()
);
var fn_query_flag = (function (){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("_",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107861_SHARP_){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(p1__107861_SHARP_));
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [_STAR_filter_by,_STAR_sort_by,_STAR_search_key,_STAR_category], null)));
});
var str_query_flag = fn_query_flag();
var _ = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(str_query_flag,cljs.core.deref(_STAR_cached_query_flag)))?(function (){
var temp__5804__auto___108368 = rum.core.deref(_STAR_list_node_ref);
if(cljs.core.truth_(temp__5804__auto___108368)){
var list_cnt_108369 = temp__5804__auto___108368;
(list_cnt_108369.scrollTop = (0));
} else {
}

return cljs.core.reset_BANG_(_STAR_current_page,(1));
})()
:null);
var ___$1 = cljs.core.reset_BANG_(_STAR_cached_query_flag,str_query_flag);
var page_total_items = cljs.core.count(sorted_plugins);
var sorted_plugins__$1 = (((!((page_total_items > frontend.components.plugins.PER_PAGE_SIZE))))?sorted_plugins:cljs.core.take.cljs$core$IFn$_invoke$arity$2((cljs.core.deref(_STAR_current_page) * frontend.components.plugins.PER_PAGE_SIZE),sorted_plugins));
var load_more_pages_BANG_ = (function (){
if((page_total_items > frontend.components.plugins.PER_PAGE_SIZE)){
if(((frontend.components.plugins.PER_PAGE_SIZE * cljs.core.deref(_STAR_current_page)) < page_total_items)){
return cljs.core.reset_BANG_(_STAR_current_page,(cljs.core.deref(_STAR_current_page) + (1)));
} else {
return null;
}
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"cp__plugins-installed"},[frontend.components.plugins.panel_control_tabs(cljs.core.deref(_STAR_search_key),_STAR_search_key,cljs.core.deref(_STAR_category),_STAR_category,cljs.core.deref(_STAR_sort_by),_STAR_sort_by,cljs.core.deref(_STAR_filter_by),_STAR_filter_by,total_nums,selected_unpacked_pkg,false,develop_mode_QMARK_,null,agent_opts),daiquiri.core.create_element("div",{'ref':_STAR_list_node_ref,'className':"cp__plugins-item-lists pb-6"},[daiquiri.core.create_element("div",{'className':"cp__plugins-item-lists-inner"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107874(s__107875){
return (new cljs.core.LazySeq(null,(function (){
var s__107875__$1 = s__107875;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107875__$1);
if(temp__5804__auto__){
var s__107875__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107875__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107875__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107877 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107876 = (0);
while(true){
if((i__107876 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__107876);
cljs.core.chunk_append(b__107877,rum.core.with_key((function (){var pid = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
return frontend.components.plugins.plugin_item_card(frontend.context.i18n.t,item,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null)),false,_STAR_search_key,updating,(function (){var and__5000__auto__ = updating;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(updating)),pid);
} else {
return and__5000__auto__;
}
})(),true,null,cljs.core.get.cljs$core$IFn$_invoke$arity$2(coming_updates,pid));
})(),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)));

var G__108370 = (i__107876 + (1));
i__107876 = G__108370;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107877),frontend$components$plugins$iter__107874(cljs.core.chunk_rest(s__107875__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107877),null);
}
} else {
var item = cljs.core.first(s__107875__$2);
return cljs.core.cons(rum.core.with_key((function (){var pid = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
return frontend.components.plugins.plugin_item_card(frontend.context.i18n.t,item,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.Keyword(null,"disabled","disabled",-1529784218)], null)),false,_STAR_search_key,updating,(function (){var and__5000__auto__ = updating;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(updating)),pid);
} else {
return and__5000__auto__;
}
})(),true,null,cljs.core.get.cljs$core$IFn$_invoke$arity$2(coming_updates,pid));
})(),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)),frontend$components$plugins$iter__107874(cljs.core.rest(s__107875__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sorted_plugins__$1);
})())]),((cljs.core.seq(sorted_plugins__$1))?frontend.components.plugins.lazy_items_loader(load_more_pages_BANG_):(function (){var attrs107881 = logseq.shui.ui.tabler_icon("list-search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(40)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107881))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","justify-center","py-28","flex-col","gap-2","opacity-30"], null)], null),attrs107881], 0))):{'className':"flex items-center justify-center py-28 flex-col gap-2 opacity-30"}),((cljs.core.map_QMARK_(attrs107881))?[daiquiri.core.create_element("span",{'className':"text-sm"},["Nothing Found."])]:[daiquiri.interpreter.interpret(attrs107881),daiquiri.core.create_element("span",{'className':"text-sm"},["Nothing Found."])]));
})())])]);
}),new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive,frontend.components.plugins.plugin_items_list_mixins,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.plugins","search-key","frontend.components.plugins/search-key",1754546424)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("frontend.components.plugins","filter-by","frontend.components.plugins/filter-by",-1578178539)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("frontend.components.plugins","sort-by","frontend.components.plugins/sort-by",1336057821)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"plugins","plugins",1900073717),new cljs.core.Keyword("frontend.components.plugins","category","frontend.components.plugins/category",1292709236)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.plugins","cached-query-flag","frontend.components.plugins/cached-query-flag",-1516213499)),rum.core.local.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword("frontend.components.plugins","current-page","frontend.components.plugins/current-page",1720536456))], null),"frontend.components.plugins/installed-plugins");
frontend.components.plugins.waiting_coming_updates = rum.core.lazy_build(rum.core.build_defcs,(function (_s){
var _ = frontend.state.sub(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263));
var downloading_QMARK_ = frontend.state.sub(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608));
var unchecked = frontend.state.sub(new cljs.core.Keyword("plugin","updates-unchecked","plugin/updates-unchecked",723985111));
var updates = frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("div",{'className':"cp__plugins-waiting-updates"},[(function (){var attrs107895 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","found-n-updates","plugin/found-n-updates",-1766578685),cljs.core.count(updates)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs107895))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-4","text-2xl","p-1"], null)], null),attrs107895], 0))):{'className':"mb-4 text-2xl p-1"}),((cljs.core.map_QMARK_(attrs107895))?null:[daiquiri.interpreter.interpret(attrs107895)]));
})(),((cljs.core.seq(updates))?daiquiri.core.create_element("ul",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(downloading_QMARK_)?"downloading":null)], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107919(s__107920){
return (new cljs.core.LazySeq(null,(function (){
var s__107920__$1 = s__107920;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107920__$1);
if(temp__5804__auto__){
var s__107920__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107920__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107920__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107922 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107921 = (0);
while(true){
if((i__107921 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__107921);
var k = ["lsp-it-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))].join('');
var c_QMARK_ = (!(cljs.core.contains_QMARK_(unchecked,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))));
var notes = frontend.util.trim_safe(new cljs.core.Keyword(null,"latest-notes","latest-notes",-368663386).cljs$core$IFn$_invoke$arity$1(it));
cljs.core.chunk_append(b__107922,daiquiri.core.create_element("li",{'key':k,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center",((c_QMARK_)?"checked":null)], null))},[daiquiri.core.create_element("label",{'className':"flex-1",'htmlFor':k},[daiquiri.interpreter.interpret((function (){var G__107927 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),k,new cljs.core.Keyword(null,"default-checked","default-checked",1039965863),c_QMARK_,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),((function (i__107921,k,c_QMARK_,notes,it,c__5478__auto__,size__5479__auto__,b__107922,s__107920__$2,temp__5804__auto__,_,downloading_QMARK_,unchecked,updates){
return (function (checked_QMARK_){
if(cljs.core.truth_(downloading_QMARK_)){
return null;
} else {
return frontend.state.set_unchecked_update(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it),cljs.core.not(checked_QMARK_));
}
});})(i__107921,k,c_QMARK_,notes,it,c__5478__auto__,size__5479__auto__,b__107922,s__107920__$2,temp__5804__auto__,_,downloading_QMARK_,unchecked,updates))
], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107927) : logseq.shui.ui.checkbox.call(null,G__107927));
})()),(function (){var attrs107925 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(it);
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107925))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-3"], null)], null),attrs107925], 0))):{'className':"px-3"}),((cljs.core.map_QMARK_(attrs107925))?[daiquiri.core.create_element("sup",null,[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))," \uD83D\uDC49 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(it))].join('')])]:[daiquiri.interpreter.interpret(attrs107925),daiquiri.core.create_element("sup",null,[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))," \uD83D\uDC49 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(it))].join('')])]));
})()]),(function (){var attrs107924 = ((clojure.string.blank_QMARK_(notes))?null:frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-30.hover:opacity-80","span.opacity-30.hover:opacity-80",825778773),frontend.ui.icon("info-circle")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),notes], null)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107924))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-4"], null)], null),attrs107924], 0))):{'className':"px-4"}),((cljs.core.map_QMARK_(attrs107924))?null:[daiquiri.interpreter.interpret(attrs107924)]));
})()]));

var G__108371 = (i__107921 + (1));
i__107921 = G__108371;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107922),frontend$components$plugins$iter__107919(cljs.core.chunk_rest(s__107920__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107922),null);
}
} else {
var it = cljs.core.first(s__107920__$2);
var k = ["lsp-it-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))].join('');
var c_QMARK_ = (!(cljs.core.contains_QMARK_(unchecked,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))));
var notes = frontend.util.trim_safe(new cljs.core.Keyword(null,"latest-notes","latest-notes",-368663386).cljs$core$IFn$_invoke$arity$1(it));
return cljs.core.cons(daiquiri.core.create_element("li",{'key':k,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center",((c_QMARK_)?"checked":null)], null))},[daiquiri.core.create_element("label",{'className':"flex-1",'htmlFor':k},[daiquiri.interpreter.interpret((function (){var G__107929 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),k,new cljs.core.Keyword(null,"default-checked","default-checked",1039965863),c_QMARK_,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),((function (k,c_QMARK_,notes,it,s__107920__$2,temp__5804__auto__,_,downloading_QMARK_,unchecked,updates){
return (function (checked_QMARK_){
if(cljs.core.truth_(downloading_QMARK_)){
return null;
} else {
return frontend.state.set_unchecked_update(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it),cljs.core.not(checked_QMARK_));
}
});})(k,c_QMARK_,notes,it,s__107920__$2,temp__5804__auto__,_,downloading_QMARK_,unchecked,updates))
], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__107929) : logseq.shui.ui.checkbox.call(null,G__107929));
})()),(function (){var attrs107925 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(it);
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs107925))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-3"], null)], null),attrs107925], 0))):{'className':"px-3"}),((cljs.core.map_QMARK_(attrs107925))?[daiquiri.core.create_element("sup",null,[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))," \uD83D\uDC49 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(it))].join('')])]:[daiquiri.interpreter.interpret(attrs107925),daiquiri.core.create_element("sup",null,[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))," \uD83D\uDC49 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(it))].join('')])]));
})()]),(function (){var attrs107924 = ((clojure.string.blank_QMARK_(notes))?null:frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-30.hover:opacity-80","span.opacity-30.hover:opacity-80",825778773),frontend.ui.icon("info-circle")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),notes], null)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107924))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-4"], null)], null),attrs107924], 0))):{'className':"px-4"}),((cljs.core.map_QMARK_(attrs107924))?null:[daiquiri.interpreter.interpret(attrs107924)]));
})()]),frontend$components$plugins$iter__107919(cljs.core.rest(s__107920__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(updates);
})())]):daiquiri.core.create_element("div",{'className':"py-4"},[daiquiri.core.create_element("strong",{'className':"text-4xl"},[["\uD83C\uDF89 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","all-updated","plugin/all-updated",5666680)], 0)))].join('')])])),((cljs.core.seq(updates))?(function (){var attrs107914 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(downloading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","updates-downloading","plugin/updates-downloading",1242309586)], 0)))], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("download"),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update-all-selected","plugin/update-all-selected",-306619318)], 0))], null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(downloading_QMARK_)){
return null;
} else {
frontend.handler.plugin.open_updates_downloading();

var temp__5802__auto__ = frontend.state.get_next_selected_coming_update();
if(cljs.core.truth_(temp__5802__auto__)){
var n = temp__5802__auto__;
return frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(n,new cljs.core.Keyword(null,"only-check","only-check",-1961506795),false),(function (e){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e.toString(),new cljs.core.Keyword(null,"error","error",-978969032));
}));
} else {
return frontend.handler.plugin.close_updates_downloading();
}
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = downloading_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core.seq(unchecked)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(unchecked),cljs.core.count(updates))));
}
})()], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107914))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-5","flex","justify-end"], null)], null),attrs107914], 0))):{'className':"pt-5 flex justify-end"}),((cljs.core.map_QMARK_(attrs107914))?null:[daiquiri.interpreter.interpret(attrs107914)]));
})():null)]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (s){
frontend.state.reset_unchecked_update();

return s;
})], null)], null),"frontend.components.plugins/waiting-coming-updates");
frontend.components.plugins.plugins_from_file = rum.core.lazy_build(rum.core.build_defc,(function (plugins){
return daiquiri.core.create_element("div",{'className':"cp__plugins-fom-file"},[(function (){var attrs107930 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin.install-from-file","title","plugin.install-from-file/title",1282492345)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs107930))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-4","text-2xl","p-1"], null)], null),attrs107930], 0))):{'className':"mb-4 text-2xl p-1"}),((cljs.core.map_QMARK_(attrs107930))?null:[daiquiri.interpreter.interpret(attrs107930)]));
})(),((cljs.core.seq(plugins))?daiquiri.core.create_element("div",null,[(function (){var attrs107931 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin.install-from-file","notice","plugin.install-from-file/notice",-1800784446)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107931))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-2","text-xl"], null)], null),attrs107931], 0))):{'className':"mb-2 text-xl"}),((cljs.core.map_QMARK_(attrs107931))?null:[daiquiri.interpreter.interpret(attrs107931)]));
})(),daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107933(s__107934){
return (new cljs.core.LazySeq(null,(function (){
var s__107934__$1 = s__107934;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107934__$1);
if(temp__5804__auto__){
var s__107934__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107934__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107934__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107936 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107935 = (0);
while(true){
if((i__107935 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__107935);
var k = ["lsp-it-",cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))].join('');
cljs.core.chunk_append(b__107936,daiquiri.core.create_element("li",{'key':k,'className':"flex items-center"},[daiquiri.core.create_element("label",{'className':"flex-1",'htmlFor':k},[daiquiri.core.create_element("strong",{'className':"px-3"},[[cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))].join('')])])]));

var G__108372 = (i__107935 + (1));
i__107935 = G__108372;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107936),frontend$components$plugins$iter__107933(cljs.core.chunk_rest(s__107934__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107936),null);
}
} else {
var it = cljs.core.first(s__107934__$2);
var k = ["lsp-it-",cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))].join('');
return cljs.core.cons(daiquiri.core.create_element("li",{'key':k,'className':"flex items-center"},[daiquiri.core.create_element("label",{'className':"flex-1",'htmlFor':k},[daiquiri.core.create_element("strong",{'className':"px-3"},[[cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(it))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(it))].join('')])])]),frontend$components$plugins$iter__107933(cljs.core.rest(s__107934__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"install","install",-655751038).cljs$core$IFn$_invoke$arity$1(plugins));
})())]),(function (){var attrs107932 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","install","plugin/install",-432957003)], 0))], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.handler.plugin_config.replace_plugins(plugins);

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1("ls-plugins-from-file-modal") : logseq.shui.ui.dialog_close_BANG_.call(null,"ls-plugins-from-file-modal"));
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107932))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-5"], null)], null),attrs107932], 0))):{'className':"pt-5"}),((cljs.core.map_QMARK_(attrs107932))?null:[daiquiri.interpreter.interpret(attrs107932)]));
})()]):daiquiri.core.create_element("div",{'className':"py-4"},[daiquiri.core.create_element("strong",{'className':"text-xl"},[["\uD83C\uDF89 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin.install-from-file","success","plugin.install-from-file/success",1513078116)], 0)))].join('')])]))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.plugins/plugins-from-file");
frontend.components.plugins.open_select_theme_BANG_ = (function frontend$components$plugins$open_select_theme_BANG_(){
var G__107937 = frontend.components.plugins.installed_themes;
var G__107938 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__107937,G__107938) : logseq.shui.ui.dialog_open_BANG_.call(null,G__107937,G__107938));
});
frontend.components.plugins.hook_ui_slot = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__108373 = null;
var G__108373__2 = (function (type,payload){
return daiquiri.interpreter.interpret((function (){var G__107945 = type;
var G__107946 = payload;
var G__107947 = null;
var G__107948 = (function (p1__107939_SHARP_){
return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$3(type,p1__107939_SHARP_,null);
});
return (frontend.components.plugins.hook_ui_slot.cljs$core$IFn$_invoke$arity$4 ? frontend.components.plugins.hook_ui_slot.cljs$core$IFn$_invoke$arity$4(G__107945,G__107946,G__107947,G__107948) : frontend.components.plugins.hook_ui_slot.call(null,G__107945,G__107946,G__107947,G__107948));
})());
});
var G__108373__4 = (function (type,payload,opts,callback){
var rs = frontend.util.rand_str((8));
var id = ["slot__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rs)].join('');
var _STAR_el_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var timer = setTimeout((function (){
var G__107949 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"slot","slot",240229571),id,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null);
return (callback.cljs$core$IFn$_invoke$arity$1 ? callback.cljs$core$IFn$_invoke$arity$1(G__107949) : callback.call(null,G__107949));
}),(50));
return (function (){
return clearTimeout(timer);
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [id], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var el = rum.core.deref(_STAR_el_ref);
return (function (){
var temp__5804__auto__ = cljs.core.seq(el.querySelectorAll("[data-injected-ui]"));
if(temp__5804__auto__){
var uis = temp__5804__auto__;
var seq__107950 = cljs.core.seq(uis);
var chunk__107951 = null;
var count__107952 = (0);
var i__107953 = (0);
while(true){
if((i__107953 < count__107952)){
var el__$1 = chunk__107951.cljs$core$IIndexed$_nth$arity$2(null,i__107953);
var temp__5804__auto___108374__$1 = el__$1.dataset.injectedUi;
if(cljs.core.truth_(temp__5804__auto___108374__$1)){
var id_108375__$1 = temp__5804__auto___108374__$1;
LSPluginCore._forceCleanInjectedUI(id_108375__$1);
} else {
}


var G__108376 = seq__107950;
var G__108377 = chunk__107951;
var G__108378 = count__107952;
var G__108379 = (i__107953 + (1));
seq__107950 = G__108376;
chunk__107951 = G__108377;
count__107952 = G__108378;
i__107953 = G__108379;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__107950);
if(temp__5804__auto____$1){
var seq__107950__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__107950__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__107950__$1);
var G__108380 = cljs.core.chunk_rest(seq__107950__$1);
var G__108381 = c__5525__auto__;
var G__108382 = cljs.core.count(c__5525__auto__);
var G__108383 = (0);
seq__107950 = G__108380;
chunk__107951 = G__108381;
count__107952 = G__108382;
i__107953 = G__108383;
continue;
} else {
var el__$1 = cljs.core.first(seq__107950__$1);
var temp__5804__auto___108384__$2 = el__$1.dataset.injectedUi;
if(cljs.core.truth_(temp__5804__auto___108384__$2)){
var id_108385__$1 = temp__5804__auto___108384__$2;
LSPluginCore._forceCleanInjectedUI(id_108385__$1);
} else {
}


var G__108386 = cljs.core.next(seq__107950__$1);
var G__108387 = null;
var G__108388 = (0);
var G__108389 = (0);
seq__107950 = G__108386;
chunk__107951 = G__108387;
count__107952 = G__108388;
i__107953 = G__108389;
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
}),cljs.core.PersistentVector.EMPTY);

var attrs107940 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el_ref,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop_propagation(e);
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs107940))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["lsp-hook-ui-slot"], null)], null),attrs107940], 0))):{'className':"lsp-hook-ui-slot"}),((cljs.core.map_QMARK_(attrs107940))?null:[daiquiri.interpreter.interpret(attrs107940)]));
});
G__108373 = function(type,payload,opts,callback){
switch(arguments.length){
case 2:
return G__108373__2.call(this,type,payload);
case 4:
return G__108373__4.call(this,type,payload,opts,callback);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__108373.cljs$core$IFn$_invoke$arity$2 = G__108373__2;
G__108373.cljs$core$IFn$_invoke$arity$4 = G__108373__4;
return G__108373;
})()
,null,"frontend.components.plugins/hook-ui-slot");
frontend.components.plugins.hook_block_slot = rum.core.lazy_build(rum.core.build_defc,(function (type,block){
return frontend.components.plugins.hook_ui_slot(type,cljs.core.PersistentArrayMap.EMPTY,null,(function (p1__107954_SHARP_){
return frontend.handler.plugin.hook_plugin_block_slot(block,p1__107954_SHARP_);
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.plugins/hook-block-slot");
frontend.components.plugins.ui_item_renderer = rum.core.lazy_build(rum.core.build_defc,(function (pid,type,p__107958){
var map__107959 = p__107958;
var map__107959__$1 = cljs.core.__destructure_map(map__107959);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107959__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var template = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107959__$1,new cljs.core.Keyword(null,"template","template",-702405684));
var prefix = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107959__$1,new cljs.core.Keyword(null,"prefix","prefix",-265908465));
var _STAR_el = rum.core.use_ref(null);
var uni = (function (p1__107955_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),"injected-ui-item-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__107955_SHARP_)].join('');
});
var pl = LSPluginCore.registeredPlugins.get(cljs.core.name(pid));
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(_STAR_el);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return LSPlugin.pluginHelpers.setupInjectedUI.call(pl,({"slot": el.id, "key": key, "template": template}),({}));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [template], null));

if((!((pl == null)))){
return daiquiri.core.create_element("div",{'id':uni([cljs.core.name(key),"-",cljs.core.name(pid)].join('')),'title':key,'ref':_STAR_el,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [uni(cljs.core.name(type))], null))},[]);
} else {
return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}
}),null,"frontend.components.plugins/ui-item-renderer");
frontend.components.plugins.toolbar_plugins_manager_list = rum.core.lazy_build(rum.core.build_defc,(function (updates_coming,items){
var badge_updates_QMARK_ = ((cljs.core.not(frontend.handler.plugin.get_auto_checking_QMARK_())) && (cljs.core.seq(frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$1(updates_coming))));
var items__$1 = (function (){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__107960(s__107961){
return (new cljs.core.LazySeq(null,(function (){
var s__107961__$1 = s__107961;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__107961__$1);
if(temp__5804__auto__){
var s__107961__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__107961__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__107961__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__107963 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__107962 = (0);
while(true){
if((i__107962 < size__5479__auto__)){
var vec__107964 = cljs.core._nth(c__5478__auto__,i__107962);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107964,(0),null);
var map__107967 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107964,(1),null);
var map__107967__$1 = cljs.core.__destructure_map(map__107967);
var opts = map__107967__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107967__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var pinned_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107967__$1,new cljs.core.Keyword(null,"pinned?","pinned?",440024168));
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107964,(2),null);
var pkey = [cljs.core.name(pid),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('');
cljs.core.chunk_append(b__107963,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),key,new cljs.core.Keyword(null,"item","item",249373802),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.item-wrap","div.flex.items-center.item-wrap",-1430672609),frontend.components.plugins.ui_item_renderer(pid,new cljs.core.Keyword(null,"toolbar","toolbar",-1172789065),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"prefix","prefix",-265908465),"pl-",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"key","key",-1516042587),["pl-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')], 0))),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding-left","padding-left",-1180879053),"2px"], null)], null),key], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pin.flex.items-center.opacity-60","span.pin.flex.items-center.opacity-60",1509350049),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pinned","pinned",-1216085339),pinned_QMARK_], null)], null))], null),frontend.ui.icon((cljs.core.truth_(pinned_QMARK_)?"pinned":"pin"))], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__107962,pkey,vec__107964,_,map__107967,map__107967__$1,opts,key,pinned_QMARK_,pid,c__5478__auto__,size__5479__auto__,b__107963,s__107961__$2,temp__5804__auto__,badge_updates_QMARK_){
return (function (e){
var target = e.target;
var user_btn_QMARK_ = cljs.core.boolean$(target.closest("div[data-injected-ui]"));
if(user_btn_QMARK_){
} else {
frontend.handler.plugin.op_pinned_toolbar_item_BANG_(pkey,(cljs.core.truth_(pinned_QMARK_)?new cljs.core.Keyword(null,"remove","remove",-131428414):new cljs.core.Keyword(null,"add","add",235287739)));
}

return true;
});})(i__107962,pkey,vec__107964,_,map__107967,map__107967__$1,opts,key,pinned_QMARK_,pid,c__5478__auto__,size__5479__auto__,b__107963,s__107961__$2,temp__5804__auto__,badge_updates_QMARK_))
], null)], null));

var G__108424 = (i__107962 + (1));
i__107962 = G__108424;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__107963),frontend$components$plugins$iter__107960(cljs.core.chunk_rest(s__107961__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__107963),null);
}
} else {
var vec__107968 = cljs.core.first(s__107961__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107968,(0),null);
var map__107971 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107968,(1),null);
var map__107971__$1 = cljs.core.__destructure_map(map__107971);
var opts = map__107971__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107971__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var pinned_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107971__$1,new cljs.core.Keyword(null,"pinned?","pinned?",440024168));
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107968,(2),null);
var pkey = [cljs.core.name(pid),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('');
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),key,new cljs.core.Keyword(null,"item","item",249373802),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.item-wrap","div.flex.items-center.item-wrap",-1430672609),frontend.components.plugins.ui_item_renderer(pid,new cljs.core.Keyword(null,"toolbar","toolbar",-1172789065),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"prefix","prefix",-265908465),"pl-",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"key","key",-1516042587),["pl-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')], 0))),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding-left","padding-left",-1180879053),"2px"], null)], null),key], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pin.flex.items-center.opacity-60","span.pin.flex.items-center.opacity-60",1509350049),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pinned","pinned",-1216085339),pinned_QMARK_], null)], null))], null),frontend.ui.icon((cljs.core.truth_(pinned_QMARK_)?"pinned":"pin"))], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (pkey,vec__107968,_,map__107971,map__107971__$1,opts,key,pinned_QMARK_,pid,s__107961__$2,temp__5804__auto__,badge_updates_QMARK_){
return (function (e){
var target = e.target;
var user_btn_QMARK_ = cljs.core.boolean$(target.closest("div[data-injected-ui]"));
if(user_btn_QMARK_){
} else {
frontend.handler.plugin.op_pinned_toolbar_item_BANG_(pkey,(cljs.core.truth_(pinned_QMARK_)?new cljs.core.Keyword(null,"remove","remove",-131428414):new cljs.core.Keyword(null,"add","add",235287739)));
}

return true;
});})(pkey,vec__107968,_,map__107971,map__107971__$1,opts,key,pinned_QMARK_,pid,s__107961__$2,temp__5804__auto__,badge_updates_QMARK_))
], null)], null),frontend$components$plugins$iter__107960(cljs.core.rest(s__107961__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
})(),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr","hr",1377740067),true], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"plugins","plugins",1900073717)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.goto_plugins_dashboard_BANG_();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"extra-item mt-2"], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("apps")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"themes","themes",-702786642)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$0();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"extra-item"], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("palette")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"settings","settings",1556144875)], 0)),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.goto_plugins_settings_BANG_();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"extra-item"], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("adjustments")], null),((badge_updates_QMARK_)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-5.leading-none","div.flex.items-center.space-x-5.leading-none",1217724633),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","found-updates","plugin/found-updates",1914242130)], 0))], null),frontend.ui.point("bg-red-700",(5),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),(2)], null)], null))], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (frontend.components.plugins.open_waiting_updates_modal_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.components.plugins.open_waiting_updates_modal_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.components.plugins.open_waiting_updates_modal_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"extra-item"], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("download")], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hr","hr",1377740067),true,new cljs.core.Keyword(null,"key","key",-1516042587),"dropdown-more"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),frontend.components.plugins.auto_check_for_updates_control()], null)], null)], 0)));
});
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
var G__107972 = e.target;
var G__107973 = (function (p__107975){
var map__107976 = p__107975;
var map__107976__$1 = cljs.core.__destructure_map(map__107976);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107976__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.plugins.render_classic_dropdown_items(id,items__$1());
});
var G__107974 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"toolbar-plugins-manager-content"], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__107972,G__107973,G__107974) : logseq.shui.ui.popup_show_BANG_.call(null,G__107972,G__107973,G__107974));
}),'className':"toolbar-plugins-manager"},[daiquiri.interpreter.interpret(logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"puzzle","puzzle",-825926240),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex relative toolbar-plugins-manager-trigger"], null),((badge_updates_QMARK_)?frontend.ui.point("bg-red-600.top-1.right-1.absolute",(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),(2),new cljs.core.Keyword(null,"margin-top","margin-top",392161226),(2)], null)], null)):null)))]);
}),null,"frontend.components.plugins/toolbar-plugins-manager-list");
frontend.components.plugins.header_ui_items_list_wrap = rum.core.lazy_build(rum.core.build_defc,(function (children){
var _STAR_wrap_el = rum.core.use_ref(null);
var vec__107983 = frontend.rum.use_atom(frontend.handler.ui._STAR_right_sidebar_resized_at);
var right_sidebar_resized = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107983,(0),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(_STAR_wrap_el);
if(cljs.core.truth_(temp__5804__auto__)){
var wrap_el = temp__5804__auto__;
var temp__5804__auto____$1 = wrap_el.closest(".cp__header");
if(cljs.core.truth_(temp__5804__auto____$1)){
var header_el = temp__5804__auto____$1;
var header_l = header_el.querySelector("* > .l");
var header_r = header_el.querySelector("* > .r");
var set_max_width_BANG_ = (function (p1__107981_SHARP_){
if(typeof p1__107981_SHARP_ === 'number'){
return (wrap_el.style.maxWidth = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__107981_SHARP_),"px"].join(''));
} else {
return null;
}
});
var calc_wrap_max_width = (function (){
var width_l = header_l.offsetWidth;
var width_t = document.querySelector("#main-content-container").offsetWidth;
var children__$1 = cljs.core.to_array(header_r.children);
var width_c_SINGLEQUOTE_ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,e){
if(cljs.core.truth_((function (){var G__107987 = e;
var G__107987__$1 = (((G__107987 == null))?null:G__107987.classList);
var G__107987__$2 = (((G__107987__$1 == null))?null:G__107987__$1.contains("ui-items-container"));
if((G__107987__$2 == null)){
return null;
} else {
return cljs.core.not(G__107987__$2);
}
})())){
return (acc + (function (){var or__5002__auto__ = e.offsetWidth;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
} else {
return null;
}
}),(0),children__$1);
var temp__5804__auto____$2 = (function (){var and__5000__auto__ = typeof width_t === 'number';
if(and__5000__auto__){
if(cljs.core.not(frontend.state.get_left_sidebar_open_QMARK_())){
return (width_t - width_l);
} else {
return width_t;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var width_t__$1 = temp__5804__auto____$2;
return set_max_width_BANG_((function (){var x__5087__auto__ = ((width_t__$1 - width_c_SINGLEQUOTE_) - (100));
var y__5088__auto__ = (76);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
} else {
return null;
}
});
window.addEventListener("resize",calc_wrap_max_width);

setTimeout(calc_wrap_max_width,(16));

return (function (){
return window.removeEventListener("resize",calc_wrap_max_width);
});
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [right_sidebar_resized], null));

return daiquiri.core.create_element("div",{'ref':_STAR_wrap_el,'className':"list-wrap"},[daiquiri.interpreter.interpret(children)]);
}),null,"frontend.components.plugins/header-ui-items-list-wrap");
/**
 * type of :toolbar, :pagebar
 */
frontend.components.plugins.hook_ui_items = rum.core.lazy_build(rum.core.build_defcs,(function (_state,type){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868)], null)))){
var toolbar_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"toolbar","toolbar",-1172789065),type);
var pinned_items = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","preferences","plugin/preferences",668527388),new cljs.core.Keyword(null,"pinnedToolbarItems","pinnedToolbarItems",889309943)], null));
var pinned_items__$1 = (function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(pinned_items);
if(and__5000__auto__){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,pinned_items);
} else {
return and__5000__auto__;
}
})();
var items = frontend.state.get_plugins_ui_items_with_type(type);
var items__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p1__107989_SHARP_){
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__107989_SHARP_));
}),items);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(items__$1);
if(and__5000__auto__){
if(toolbar_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107990_SHARP_){
return cljs.core.assoc_in(p1__107990_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),new cljs.core.Keyword(null,"pinned?","pinned?",440024168)], null),(function (){var vec__108007 = p1__107990_SHARP_;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108007,(0),null);
var map__108010 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108007,(1),null);
var map__108010__$1 = cljs.core.__destructure_map(map__108010);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108010__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108007,(2),null);
var pkey = [cljs.core.name(pid),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('');
return cljs.core.contains_QMARK_(pinned_items__$1,pkey);
})());
}),items__$1);
} else {
return items__$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var items__$2 = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui-items-container","div.ui-items-container",1212408615),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-type","data-type",-326421468),cljs.core.name(type)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.components.plugins.header_ui_items_list_wrap((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__108011(s__108012){
return (new cljs.core.LazySeq(null,(function (){
var s__108012__$1 = s__108012;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__108012__$1);
if(temp__5804__auto____$1){
var s__108012__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__108012__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__108012__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__108014 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__108013 = (0);
while(true){
if((i__108013 < size__5479__auto__)){
var vec__108015 = cljs.core._nth(c__5478__auto__,i__108013);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108015,(0),null);
var map__108018 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108015,(1),null);
var map__108018__$1 = cljs.core.__destructure_map(map__108018);
var opts = map__108018__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108018__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var pinned_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108018__$1,new cljs.core.Keyword(null,"pinned?","pinned?",440024168));
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108015,(2),null);
cljs.core.chunk_append(b__108014,(cljs.core.truth_((function (){var or__5002__auto__ = (!(toolbar_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (!(cljs.core.set_QMARK_(pinned_items__$1)));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return pinned_QMARK_;
}
}
})())?rum.core.with_key(frontend.components.plugins.ui_item_renderer(pid,type,opts),key):null));

var G__108449 = (i__108013 + (1));
i__108013 = G__108449;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__108014),frontend$components$plugins$iter__108011(cljs.core.chunk_rest(s__108012__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__108014),null);
}
} else {
var vec__108019 = cljs.core.first(s__108012__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108019,(0),null);
var map__108022 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108019,(1),null);
var map__108022__$1 = cljs.core.__destructure_map(map__108022);
var opts = map__108022__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108022__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var pinned_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108022__$1,new cljs.core.Keyword(null,"pinned?","pinned?",440024168));
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108019,(2),null);
return cljs.core.cons((cljs.core.truth_((function (){var or__5002__auto__ = (!(toolbar_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (!(cljs.core.set_QMARK_(pinned_items__$1)));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return pinned_QMARK_;
}
}
})())?rum.core.with_key(frontend.components.plugins.ui_item_renderer(pid,type,opts),key):null),frontend$components$plugins$iter__108011(cljs.core.rest(s__108012__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items__$2);
})()),((toolbar_QMARK_)?(function (){var updates_coming = frontend.state.sub(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263));
return frontend.components.plugins.toolbar_plugins_manager_list(updates_coming,items__$2);
})():null)], null)], null);
} else {
return null;
}
})());
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (){
return cljs.core.identity("plugin-hook-items");
})], null)], null),"frontend.components.plugins/hook-ui-items");
frontend.components.plugins.hook_ui_fenced_code = rum.core.lazy_build(rum.core.build_defc,(function (block,content,p__108025){
var map__108026 = p__108025;
var map__108026__$1 = cljs.core.__destructure_map(map__108026);
var _opts = map__108026__$1;
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108026__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
var edit = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108026__$1,new cljs.core.Keyword(null,"edit","edit",-1641834166));
var vec__108027 = rum.core.use_state(content);
var content1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108027,(0),null);
var set_content1_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108027,(1),null);
var vec__108030 = rum.core.use_state(clojure.string.blank_QMARK_(content));
var editor_active_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108030,(0),null);
var set_editor_active_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108030,(1),null);
var _STAR_cm = rum.core.use_ref(null);
var _STAR_el = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
return (set_content1_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_content1_BANG_.cljs$core$IFn$_invoke$arity$1(content) : set_content1_BANG_.call(null,content));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [content], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var G__108033_108467 = rum.core.deref(_STAR_el);
var G__108033_108468__$1 = (((G__108033_108467 == null))?null:G__108033_108467.closest(".ui-fenced-code-wrap"));
var G__108033_108469__$2 = (((G__108033_108468__$1 == null))?null:G__108033_108468__$1.classList);
if((G__108033_108469__$2 == null)){
} else {
(function (p1__108023_SHARP_){
if(cljs.core.truth_(editor_active_QMARK_)){
return p1__108023_SHARP_.add("is-active");
} else {
return p1__108023_SHARP_.remove("is-active");
}
})(G__108033_108469__$2);
}

var temp__5804__auto__ = rum.core.deref(_STAR_cm);
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
cm.refresh();

cm.focus();

return cm.setCursor(cm.lineCount(),cljs.core.count(cm.getLine(cm.lastLine())));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [editor_active_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var t = setTimeout((function (){
var temp__5804__auto__ = (function (){var G__108034 = rum.core.deref(_STAR_el);
var G__108034__$1 = (((G__108034 == null))?null:G__108034.closest(".ui-fenced-code-wrap"));
var G__108034__$2 = (((G__108034__$1 == null))?null:G__108034__$1.querySelector(".CodeMirror"));
if((G__108034__$2 == null)){
return null;
} else {
return G__108034__$2.CodeMirror;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
rum.core.set_ref_BANG_(_STAR_cm,cm);

var G__108035 = cm;
G__108035.on("change",(function (){
var G__108036 = cm;
var G__108036__$1 = (((G__108036 == null))?null:G__108036.getDoc());
var G__108036__$2 = (((G__108036__$1 == null))?null:G__108036__$1.getValue());
if((G__108036__$2 == null)){
return null;
} else {
return (set_content1_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_content1_BANG_.cljs$core$IFn$_invoke$arity$1(G__108036__$2) : set_content1_BANG_.call(null,G__108036__$2));
}
}));

return G__108035;
} else {
return null;
}
}),(1000));
return (function (){
return clearTimeout(t);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
if(edit === false){
return frontend.util.stop(e);
} else {
return null;
}
}),'ref':_STAR_el,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui-fenced-code-result",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"not-edit","not-edit",-1875881710),edit === false], null)], null))], null))},[daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("span",{'onPointerDown':(function (p1__108024_SHARP_){
return frontend.util.stop(p1__108024_SHARP_);
}),'className':"actions"},[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("square-toggle-horizontal",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__108038 = cljs.core.not(editor_active_QMARK_);
return (set_editor_active_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editor_active_BANG_.cljs$core$IFn$_invoke$arity$1(G__108038) : set_editor_active_BANG_.call(null,G__108038));
})], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("source-code",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__108043 = block;
var G__108044 = cljs.core.count(content1);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(G__108043,G__108044) : frontend.handler.editor.edit_block_BANG_.call(null,G__108043,G__108044));
})], 0)))]),((cljs.core.fn_QMARK_(render))?React.createElement(render,({"content": content1})):null)])]);
}),null,"frontend.components.plugins/hook-ui-fenced-code");
frontend.components.plugins.plugins_page = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__108070 = rum.core.use_state(new cljs.core.Keyword(null,"installed","installed",553977691));
var active = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108070,(0),null);
var set_active_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108070,(1),null);
var market_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active,new cljs.core.Keyword(null,"marketplace","marketplace",236355452));
var _STAR_el_ref = rum.core.create_ref();
logseq.shui.hooks.use_effect_BANG_((function (){
frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$0();

return (function (){
return frontend.components.plugins.clear_dirties_states_BANG_();
});
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.components.plugins.clear_dirties_states_BANG_();
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [market_QMARK_], null));

return daiquiri.core.create_element("div",{'ref':_STAR_el_ref,'tabIndex':"-1",'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__plugins-page",(cljs.core.truth_(frontend.util.electron_QMARK_())?null:"web-platform")], null))},[(function (){var attrs108078 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"plugins","plugins",1900073717)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs108078))?daiquiri.interpreter.element_attributes(attrs108078):null),((cljs.core.map_QMARK_(attrs108078))?null:[daiquiri.interpreter.interpret(attrs108078)]));
})(),(cljs.core.truth_(frontend.util.electron_QMARK_())?(function (){var attrs108079 = frontend.components.plugins.security_warning();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs108079))?daiquiri.interpreter.element_attributes(attrs108079):null),((cljs.core.map_QMARK_(attrs108079))?[daiquiri.core.create_element("hr",{'className':"my-4"},null)]:[daiquiri.interpreter.interpret(attrs108079),daiquiri.core.create_element("hr",{'className':"my-4"},null)]));
})():null),daiquiri.core.create_element("div",{'className':"tabs flex items-center justify-center"},[(function (){var attrs108108 = (function (){var G__108109 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_active_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"installed","installed",553977691)) : set_active_BANG_.call(null,new cljs.core.Keyword(null,"installed","installed",553977691)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),(((!(market_QMARK_)))?"active":null),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null);
var G__108110 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installed","plugin/installed",-431253936)], 0));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__108109,G__108110) : logseq.shui.ui.button.call(null,G__108109,G__108110));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs108108))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["tabs-inner","flex","items-center"], null)], null),attrs108108], 0))):{'className':"tabs-inner flex items-center"}),((cljs.core.map_QMARK_(attrs108108))?[daiquiri.interpreter.interpret((function (){var G__108114 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_active_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"marketplace","marketplace",236355452)) : set_active_BANG_.call(null,new cljs.core.Keyword(null,"marketplace","marketplace",236355452)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),((market_QMARK_)?"active":null),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null);
var G__108115 = logseq.shui.ui.tabler_icon("apps");
var G__108116 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","marketplace","plugin/marketplace",-1095225687)], 0));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__108114,G__108115,G__108116) : logseq.shui.ui.button.call(null,G__108114,G__108115,G__108116));
})())]:[daiquiri.interpreter.interpret(attrs108108),daiquiri.interpreter.interpret((function (){var G__108120 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_active_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"marketplace","marketplace",236355452)) : set_active_BANG_.call(null,new cljs.core.Keyword(null,"marketplace","marketplace",236355452)));
}),new cljs.core.Keyword(null,"class","class",-2030961996),((market_QMARK_)?"active":null),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null);
var G__108121 = logseq.shui.ui.tabler_icon("apps");
var G__108122 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","marketplace","plugin/marketplace",-1095225687)], 0));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__108120,G__108121,G__108122) : logseq.shui.ui.button.call(null,G__108120,G__108121,G__108122));
})())]));
})()]),(function (){var attrs108103 = ((market_QMARK_)?frontend.components.plugins.marketplace_plugins():frontend.components.plugins.installed_plugins());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs108103))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["panels"], null)], null),attrs108103], 0))):{'className':"panels"}),((cljs.core.map_QMARK_(attrs108103))?null:[daiquiri.interpreter.interpret(attrs108103)]));
})()]);
}),null,"frontend.components.plugins/plugins-page");
frontend.components.plugins._STAR_updates_sub_content_timer = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.plugins._STAR_updates_sub_content = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.plugins.set_updates_sub_content_BANG_ = (function frontend$components$plugins$set_updates_sub_content_BANG_(content,duration){
cljs.core.reset_BANG_(frontend.components.plugins._STAR_updates_sub_content,content);

if((duration > (0))){
var G__108123_108480 = cljs.core.deref(frontend.components.plugins._STAR_updates_sub_content_timer);
if((G__108123_108480 == null)){
} else {
clearTimeout(G__108123_108480);
}

return cljs.core.reset_BANG_(frontend.components.plugins._STAR_updates_sub_content_timer,setTimeout((function (){
return cljs.core.reset_BANG_(frontend.components.plugins._STAR_updates_sub_content,null);
}),duration));
} else {
return null;
}
});
frontend.components.plugins.updates_notifications_impl = rum.core.lazy_build(rum.core.build_defc,(function (check_pending_QMARK_,auto_checking_QMARK_,online_QMARK_){
var vec__108137 = rum.core.use_state(null);
var uid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108137,(0),null);
var set_uid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108137,(1),null);
var vec__108140 = frontend.rum.use_atom(frontend.components.plugins._STAR_updates_sub_content);
var sub_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108140,(0),null);
var _set_sub_content_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108140,(1),null);
var notify_BANG_ = (function (content,status){
if(cljs.core.truth_(auto_checking_QMARK_)){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","list-of-updates","plugin/list-of-updates",1463733048)], 0)),content], 0));
} else {
var cb = (function (){
return frontend.handler.plugin.cancel_user_checking_BANG_();
});
try{var G__108147 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,false,uid,null,cb);
return (set_uid.cljs$core$IFn$_invoke$arity$1 ? set_uid.cljs$core$IFn$_invoke$arity$1(G__108147) : set_uid.call(null,G__108147));
}catch (e108145){if((e108145 instanceof Error)){
var _ = e108145;
var G__108146 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,false,null,null,cb);
return (set_uid.cljs$core$IFn$_invoke$arity$1 ? set_uid.cljs$core$IFn$_invoke$arity$1(G__108146) : set_uid.call(null,G__108146));
} else {
throw e108145;

}
}}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(check_pending_QMARK_)){
return notify_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","checking-for-updates","plugin/checking-for-updates",1789948483)], 0))], null),(cljs.core.truth_(sub_content)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.opacity-60","p.opacity-60",441728988),sub_content], null):null)], null),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(""));
} else {
if(cljs.core.truth_(uid)){
return frontend.handler.notification.clear_BANG_(uid);
} else {
return null;
}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [check_pending_QMARK_,sub_content], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(online_QMARK_)){
var last_updates = frontend.storage.get(new cljs.core.Keyword(null,"lsp-last-auto-updates","lsp-last-auto-updates",1901307330));
if((((!(last_updates === false))) && (((last_updates === true) || ((((!(typeof last_updates === 'number'))) || (((Date.now() - last_updates) > ((((60) * (60)) * (12)) * (1000)))))))))){
var update_timer = setTimeout((function (){
frontend.handler.plugin.auto_check_enabled_for_updates_BANG_();

return frontend.storage.set(new cljs.core.Keyword(null,"lsp-last-auto-updates","lsp-last-auto-updates",1901307330),Date.now());
}),(cljs.core.truth_(frontend.util.electron_QMARK_())?(3000):((60) * (1000))));
return (function (){
return clearTimeout(update_timer);
});
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [online_QMARK_], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}),null,"frontend.components.plugins/updates-notifications-impl");
frontend.components.plugins.updates_notifications = rum.core.lazy_build(rum.core.build_defcs,(function (_){
var updates_pending = frontend.state.sub(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256));
var online_QMARK_ = frontend.state.sub(new cljs.core.Keyword("network","online?","network/online?",1306822774));
var auto_checking_QMARK_ = frontend.state.sub(new cljs.core.Keyword("plugin","updates-auto-checking?","plugin/updates-auto-checking?",1617323181));
var check_pending_QMARK_ = cljs.core.boolean$(cljs.core.seq(updates_pending));
return frontend.components.plugins.updates_notifications_impl(check_pending_QMARK_,auto_checking_QMARK_,online_QMARK_);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.plugins/updates-notifications");
frontend.components.plugins.focused_settings_content = rum.core.lazy_build(rum.core.build_defcs,(function (_state,title){
var _STAR_cache = new cljs.core.Keyword("frontend.components.plugins","cache","frontend.components.plugins/cache",366972046).cljs$core$IFn$_invoke$arity$1(_state);
var focused = frontend.state.sub(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137));
var nav_QMARK_ = frontend.state.sub(new cljs.core.Keyword("plugin","navs-settings?","plugin/navs-settings?",-615901808));
var _ = frontend.state.sub(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034));
var ___$1 = setTimeout((function (){
return cljs.core.reset_BANG_(_STAR_cache,focused);
}),(100));
return daiquiri.core.create_element("div",{'className':"cp__plugins-settings cp__settings-main"},[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__settings-inner","md:flex",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"no-aside","no-aside",71744870),cljs.core.not(nav_QMARK_)], null)], null))], null))},[(cljs.core.truth_(nav_QMARK_)?daiquiri.core.create_element("aside",{'style':{'minWidth':"10rem"},'className':"md:w-64"},[daiquiri.core.create_element("header",{'className':"cp__settings-header"},[(function (){var attrs108171 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"settings-of-plugins","settings-of-plugins",-1896805353)], 0));
}
})();
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs108171))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__settings-modal-title"], null)], null),attrs108171], 0))):{'className':"cp__settings-modal-title"}),((cljs.core.map_QMARK_(attrs108171))?null:[daiquiri.interpreter.interpret(attrs108171)]));
})()]),(function (){var plugins = frontend.handler.plugin.get_enabled_plugins_if_setting_schema();
return daiquiri.core.create_element("ul",{'className':"settings-plugin-list"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins$iter__108173(s__108174){
return (new cljs.core.LazySeq(null,(function (){
var s__108174__$1 = s__108174;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__108174__$1);
if(temp__5804__auto__){
var s__108174__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__108174__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__108174__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__108176 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__108175 = (0);
while(true){
if((i__108175 < size__5479__auto__)){
var map__108179 = cljs.core._nth(c__5478__auto__,i__108175);
var map__108179__$1 = cljs.core.__destructure_map(map__108179);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108179__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108179__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var title__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108179__$1,new cljs.core.Keyword(null,"title","title",636505583));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108179__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
cljs.core.chunk_append(b__108176,daiquiri.core.create_element("li",{'key':id,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,focused)], null)], null))], null))},[daiquiri.core.create_element("a",{'data-id':id,'onClick':((function (i__108175,map__108179,map__108179__$1,id,name,title__$1,icon,c__5478__auto__,size__5479__auto__,b__108176,s__108174__$2,temp__5804__auto__,plugins,_STAR_cache,focused,nav_QMARK_,_,___$1){
return (function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),id);
});})(i__108175,map__108179,map__108179__$1,id,name,title__$1,icon,c__5478__auto__,size__5479__auto__,b__108176,s__108174__$2,temp__5804__auto__,plugins,_STAR_cache,focused,nav_QMARK_,_,___$1))
,'className':"flex items-center settings-plugin-item"},[(cljs.core.truth_((function (){var and__5000__auto__ = icon;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(icon)));
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("img",{'src':icon,'className':"icon"},[]):daiquiri.interpreter.interpret(frontend.components.svg.folder)),(function (){var attrs108239 = (function (){var or__5002__auto__ = title__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs108239))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs108239], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs108239))?null:[daiquiri.interpreter.interpret(attrs108239)]));
})()])]));

var G__108521 = (i__108175 + (1));
i__108175 = G__108521;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__108176),frontend$components$plugins$iter__108173(cljs.core.chunk_rest(s__108174__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__108176),null);
}
} else {
var map__108243 = cljs.core.first(s__108174__$2);
var map__108243__$1 = cljs.core.__destructure_map(map__108243);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108243__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108243__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var title__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108243__$1,new cljs.core.Keyword(null,"title","title",636505583));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108243__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
return cljs.core.cons(daiquiri.core.create_element("li",{'key':id,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,focused)], null)], null))], null))},[daiquiri.core.create_element("a",{'data-id':id,'onClick':((function (map__108243,map__108243__$1,id,name,title__$1,icon,s__108174__$2,temp__5804__auto__,plugins,_STAR_cache,focused,nav_QMARK_,_,___$1){
return (function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),id);
});})(map__108243,map__108243__$1,id,name,title__$1,icon,s__108174__$2,temp__5804__auto__,plugins,_STAR_cache,focused,nav_QMARK_,_,___$1))
,'className':"flex items-center settings-plugin-item"},[(cljs.core.truth_((function (){var and__5000__auto__ = icon;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(icon)));
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("img",{'src':icon,'className':"icon"},[]):daiquiri.interpreter.interpret(frontend.components.svg.folder)),(function (){var attrs108239 = (function (){var or__5002__auto__ = title__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs108239))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1"], null)], null),attrs108239], 0))):{'className':"flex-1"}),((cljs.core.map_QMARK_(attrs108239))?null:[daiquiri.interpreter.interpret(attrs108239)]));
})()])]),frontend$components$plugins$iter__108173(cljs.core.rest(s__108174__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(plugins);
})())]);
})()]):null),daiquiri.core.create_element("article",null,[daiquiri.core.create_element("div",{'data-id':focused,'className':"panel-wrap"},[daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = focused;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_cache),focused);
if(and__5000__auto____$1){
return frontend.handler.plugin.get_plugin_inst(focused);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
return frontend.ui.catch_error(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.warning.text-lg.mt-5","p.warning.text-lg.mt-5",-1216205355),"Settings schema Error!"], null),frontend.components.plugins_settings.settings_container(cljs_bean.core.__GT_clj(pl.settingsSchema),pl));
} else {
return null;
}
})())])])])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137)),new cljs.core.Keyword("frontend.components.plugins","cache","frontend.components.plugins/cache",366972046))], null),"frontend.components.plugins/focused-settings-content");
frontend.components.plugins.custom_js_installer = rum.core.lazy_build(rum.core.build_defc,(function (p__108257){
var map__108258 = p__108257;
var map__108258__$1 = cljs.core.__destructure_map(map__108258);
var t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108258__$1,new cljs.core.Keyword(null,"t","t",-1397832519));
var current_repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108258__$1,new cljs.core.Keyword(null,"current-repo","current-repo",134812359));
var db_restoring_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108258__$1,new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664));
logseq.shui.hooks.use_effect_BANG_((function (){
if(((cljs.core.not(db_restoring_QMARK_)) && ((!(frontend.util.nfs_QMARK_))))){
return frontend.handler.ui.exec_js_if_exists__AMPERSAND__allowed_BANG_(t);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_repo,db_restoring_QMARK_], null));

return null;
}),null,"frontend.components.plugins/custom-js-installer");
frontend.components.plugins.perf_tip_content = rum.core.lazy_build(rum.core.build_defc,(function (pid,name,url){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"block whitespace-normal"},["This plugin ",daiquiri.core.create_element("strong",{'className':"text-error"},["#",daiquiri.interpreter.interpret(name)])," takes too long to load, affecting the application startup time and\n     potentially causing other plugins to fail to load."]),daiquiri.core.create_element("path",{'className':"opacity-50"},[daiquiri.core.create_element("small",null,[(function (){var attrs108278 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs108278))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pr-1"], null)], null),attrs108278], 0))):{'className':"pr-1"}),((cljs.core.map_QMARK_(attrs108278))?null:[daiquiri.interpreter.interpret(attrs108278)]));
})(),daiquiri.interpreter.interpret(url)])]),(function (){var attrs108273 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Disable now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(LSPluginCore.disable(pid),(function (){
frontend.handler.notification.clear_BANG_(pid);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"The plugin ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.text-error","strong.text-error",443803578),"#",name], null)," is disabled."], null),new cljs.core.Keyword(null,"success","success",1890645906),true,null,(3000),null);
})),(function (p1__108263_SHARP_){
return console.error(p1__108263_SHARP_);
}));
})], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs108273))?daiquiri.interpreter.element_attributes(attrs108273):null),((cljs.core.map_QMARK_(attrs108273))?null:[daiquiri.interpreter.interpret(attrs108273)]));
})()]);
}),null,"frontend.components.plugins/perf-tip-content");
frontend.components.plugins.open_plugins_modal_BANG_ = (function frontend$components$plugins$open_plugins_modal_BANG_(){
var G__108282 = frontend.components.plugins.plugins_page();
var G__108283 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"plugins-dashboard","plugins-dashboard",-1133253109),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__108282,G__108283) : logseq.shui.ui.dialog_open_BANG_.call(null,G__108282,G__108283));
});
frontend.components.plugins.open_waiting_updates_modal_BANG_ = (function frontend$components$plugins$open_waiting_updates_modal_BANG_(){
var G__108284 = (function (){
return frontend.components.plugins.waiting_coming_updates();
});
var G__108285 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"center?","center?",-323116631),true], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__108284,G__108285) : logseq.shui.ui.dialog_open_BANG_.call(null,G__108284,G__108285));
});
frontend.components.plugins.open_plugins_from_file_modal_BANG_ = (function frontend$components$plugins$open_plugins_from_file_modal_BANG_(plugins){
var G__108294 = (function (){
return frontend.components.plugins.plugins_from_file(plugins);
});
var G__108295 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"ls-plugins-from-file-modal"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__108294,G__108295) : logseq.shui.ui.dialog_open_BANG_.call(null,G__108294,G__108295));
});
frontend.components.plugins.open_focused_settings_modal_BANG_ = (function frontend$components$plugins$open_focused_settings_modal_BANG_(title){
var G__108296 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.settings-modal.of-plugins","div.settings-modal.of-plugins",-1980465429),frontend.components.plugins.focused_settings_content(title)], null);
});
var G__108297 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"plugin-settings-modal",new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"id","id",-1388402092),"ls-focused-settings-modal"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__108296,G__108297) : logseq.shui.ui.dialog_open_BANG_.call(null,G__108296,G__108297));
});
frontend.components.plugins.hook_custom_routes = (function frontend$components$plugins$hook_custom_routes(routes){
var G__108302 = routes;
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__108302,(function (){var G__108304 = frontend.handler.plugin.get_route_renderers();
var G__108304__$1 = (((G__108304 == null))?null:cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__108300_SHARP_){
var temp__5804__auto__ = p1__108300_SHARP_;
if(cljs.core.truth_(temp__5804__auto__)){
var map__108307 = temp__5804__auto__;
var map__108307__$1 = cljs.core.__destructure_map(map__108307);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108307__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108307__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108307__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
if((!(clojure.string.blank_QMARK_(path)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"view","view",1247994814),(function (r){
return (render.cljs$core$IFn$_invoke$arity$2 ? render.cljs$core$IFn$_invoke$arity$2(r,p1__108300_SHARP_) : render.call(null,r,p1__108300_SHARP_));
})], null)], null);
} else {
return null;
}
} else {
return null;
}
}),G__108304));
if((G__108304__$1 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__108304__$1);
}
})());
} else {
return G__108302;
}
});
frontend.components.plugins.hook_daemon_renderers = (function frontend$components$plugins$hook_daemon_renderers(){
var temp__5804__auto__ = cljs.core.seq(frontend.handler.plugin.get_daemon_renderers());
if(temp__5804__auto__){
var rs = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.lsp-daemon-container.fixed.z-10","div.lsp-daemon-container.fixed.z-10",-1252879504),(function (){var iter__5480__auto__ = (function frontend$components$plugins$hook_daemon_renderers_$_iter__108309(s__108310){
return (new cljs.core.LazySeq(null,(function (){
var s__108310__$1 = s__108310;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__108310__$1);
if(temp__5804__auto____$1){
var s__108310__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__108310__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__108310__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__108312 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__108311 = (0);
while(true){
if((i__108311 < size__5479__auto__)){
var map__108313 = cljs.core._nth(c__5478__auto__,i__108311);
var map__108313__$1 = cljs.core.__destructure_map(map__108313);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108313__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var _pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108313__$1,new cljs.core.Keyword(null,"_pid","_pid",-925264248));
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108313__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
cljs.core.chunk_append(b__108312,((cljs.core.fn_QMARK_(render))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.lsp-daemon-container-card","div.lsp-daemon-container-card",-1494438165),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-key","data-key",1775480631),key], null),(render.cljs$core$IFn$_invoke$arity$0 ? render.cljs$core$IFn$_invoke$arity$0() : render.call(null))], null):null));

var G__108538 = (i__108311 + (1));
i__108311 = G__108538;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__108312),frontend$components$plugins$hook_daemon_renderers_$_iter__108309(cljs.core.chunk_rest(s__108310__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__108312),null);
}
} else {
var map__108314 = cljs.core.first(s__108310__$2);
var map__108314__$1 = cljs.core.__destructure_map(map__108314);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108314__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var _pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108314__$1,new cljs.core.Keyword(null,"_pid","_pid",-925264248));
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108314__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
return cljs.core.cons(((cljs.core.fn_QMARK_(render))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.lsp-daemon-container-card","div.lsp-daemon-container-card",-1494438165),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-key","data-key",1775480631),key], null),(render.cljs$core$IFn$_invoke$arity$0 ? render.cljs$core$IFn$_invoke$arity$0() : render.call(null))], null):null),frontend$components$plugins$hook_daemon_renderers_$_iter__108309(cljs.core.rest(s__108310__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(rs);
})()], null);
} else {
return null;
}
});

//# sourceMappingURL=frontend.components.plugins.js.map
