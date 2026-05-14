goog.provide('frontend.components.cmdk.list_item');
var module$node_modules$remove_accents$index=shadow.js.require("module$node_modules$remove_accents$index", {});
frontend.components.cmdk.list_item.to_string = (function frontend$components$cmdk$list_item$to_string(input){
if(typeof input === 'string'){
return input;
} else {
if((input instanceof cljs.core.Keyword)){
return cljs.core.name(input);
} else {
if((input instanceof cljs.core.Symbol)){
return cljs.core.name(input);
} else {
if(typeof input === 'number'){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(input);
} else {
if(cljs.core.uuid_QMARK_(input)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(input);
} else {
if((input == null)){
return "";
} else {
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));

}
}
}
}
}
}
});
frontend.components.cmdk.list_item.normalize_text = (function frontend$components$cmdk$list_item$normalize_text(app_config,text){
var G__126368 = frontend.components.cmdk.list_item.to_string(text);
var G__126368__$1 = G__126368.normalize("NFKC")
;
if(cljs.core.truth_(new cljs.core.Keyword("feature","enable-search-remove-accents?","feature/enable-search-remove-accents?",1106083837).cljs$core$IFn$_invoke$arity$1(app_config))){
return module$node_modules$remove_accents$index(G__126368__$1);
} else {
return G__126368__$1;
}
});
frontend.components.cmdk.list_item.highlight_query_STAR_ = (function frontend$components$cmdk$list_item$highlight_query_STAR_(app_config,query,text){
if(((cljs.core.vector_QMARK_(text)) || (cljs.core.object_QMARK_(text)))){
return text;
} else {
if(clojure.string.blank_QMARK_(query)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.components.cmdk.list_item.to_string(text)], null);
} else {
var temp__5804__auto__ = cljs.core.not_empty(frontend.components.cmdk.list_item.to_string(text));
if(cljs.core.truth_(temp__5804__auto__)){
var text_string = temp__5804__auto__;
var normal_text = frontend.components.cmdk.list_item.normalize_text(app_config,text_string);
var normal_query = frontend.components.cmdk.list_item.normalize_text(app_config,query);
var query_terms = clojure.string.replace(goog.string.regExpEscape(normal_query),/\s+/,"|");
var query_re = (new RegExp(["(",query_terms,")"].join(''),"i"));
var highlighted_text = clojure.string.replace(normal_text,query_re,"<:hlmarker>$1<:hlmarker>");
var segs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(highlighted_text,/<:hlmarker>/);
if(cljs.core.seq(segs)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),text_string], null)], null),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,seg){
if(cljs.core.even_QMARK_(i)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),seg], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__list-item-highlighted-span"], null),seg], null);
}
}),segs));
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),normal_text], null);
}
} else {
return null;
}

}
}
});
frontend.components.cmdk.list_item.root = rum.core.lazy_build(rum.core.build_defc,(function (p__126372,p__126373){
var map__126374 = p__126372;
var map__126374__$1 = cljs.core.__destructure_map(map__126374);
var _props = map__126374__$1;
var rounded = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__126374__$1,new cljs.core.Keyword(null,"rounded","rounded",85415706),true);
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var on_mouse_enter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"on-mouse-enter","on-mouse-enter",-1664921661));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"group","group",582596132));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"value","value",305978217));
var on_highlight = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"on-highlight","on-highlight",-1064936151));
var compact = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"compact","compact",-348732150));
var hoverable = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__126374__$1,new cljs.core.Keyword(null,"hoverable","hoverable",1153998892),true);
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var highlighted = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"highlighted","highlighted",1723498733));
var source_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"source-page","source-page",1338615502));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"header","header",119441134));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"title","title",636505583));
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var hls_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"hls-page?","hls-page?",491762704));
var value_label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"value-label","value-label",-1285712590));
var on_highlight_dep = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"on-highlight-dep","on-highlight-dep",-869993420));
var component_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"component-opts","component-opts",-245901196));
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"info","info",-317069002));
var icon_theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126374__$1,new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151));
var map__126375 = p__126373;
var map__126375__$1 = cljs.core.__destructure_map(map__126375);
var app_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126375__$1,new cljs.core.Keyword(null,"app-config","app-config",769785229));
var ref = (logseq.shui.hooks.create_ref.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.hooks.create_ref.cljs$core$IFn$_invoke$arity$0() : logseq.shui.hooks.create_ref.call(null));
var highlight_query = cljs.core.partial.cljs$core$IFn$_invoke$arity$3(frontend.components.cmdk.list_item.highlight_query_STAR_,app_config,query);
var vec__126376 = rum.core.use_state(false);
var hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126376,(0),null);
var set_hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126376,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = highlighted;
if(cljs.core.truth_(and__5000__auto__)){
return on_highlight;
} else {
return and__5000__auto__;
}
})())){
return (on_highlight.cljs$core$IFn$_invoke$arity$1 ? on_highlight.cljs$core$IFn$_invoke$arity$1(ref) : on_highlight.call(null,ref));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlighted,on_highlight_dep], null));

var attrs126371 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"opacity","opacity",397153780),(cljs.core.truth_(highlighted)?(1):0.8)], null),new cljs.core.Keyword(null,"class","class",-2030961996),(function (){var G__126379 = "flex flex-col transition-opacity";
var G__126379__$1 = (cljs.core.truth_(highlighted)?[G__126379," !opacity-100 bg-gray-03-alpha dark:bg-gray-04-alpha"].join(''):G__126379);
var G__126379__$2 = (cljs.core.truth_(hoverable)?[G__126379__$1," transition-all duration-50 ease-in !opacity-75 hover:!opacity-100 hover:cursor-pointer hover:bg-gradient-to-r hover:from-gray-03-alpha hover:to-gray-01-alpha from-0% to-100%"].join(''):G__126379__$1);
var G__126379__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = hoverable;
if(cljs.core.truth_(and__5000__auto__)){
return rounded;
} else {
return and__5000__auto__;
}
})())?[G__126379__$2," !rounded-lg"].join(''):G__126379__$2);
var G__126379__$4 = ((cljs.core.not(compact))?[G__126379__$3," py-4 px-6 gap-1"].join(''):G__126379__$3);
var G__126379__$5 = (cljs.core.truth_(compact)?[G__126379__$4," py-1.5 px-3 gap-0.5"].join(''):G__126379__$4);
if(cljs.core.not(highlighted)){
return [G__126379__$5," "].join('');
} else {
return G__126379__$5;
}
})(),new cljs.core.Keyword(null,"ref","ref",1289896967),ref,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(cljs.core.truth_(on_click)?on_click:null),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_hover_QMARK_.call(null,true));
}),new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_hover_QMARK_.call(null,false));
}),new cljs.core.Keyword(null,"on-mouse-enter","on-mouse-enter",-1664921661),(cljs.core.truth_(on_mouse_enter)?on_mouse_enter:null)], null),component_opts], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126371))?daiquiri.interpreter.element_attributes(attrs126371):null),((cljs.core.map_QMARK_(attrs126371))?[(cljs.core.truth_(header)?daiquiri.core.create_element("div",{'style':{'color':"var(--lx-gray-11)"},'className':"text-xs pl-8 font-light -mt-1"},[daiquiri.interpreter.interpret(highlight_query(header))]):null),daiquiri.core.create_element("div",{'className':"flex items-center gap-3"},[daiquiri.core.create_element("div",{'style':{'background':(cljs.core.truth_((function (){var fexpr__126381 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"gradient","gradient",-1983908971),null], null), null);
return (fexpr__126381.cljs$core$IFn$_invoke$arity$1 ? fexpr__126381.cljs$core$IFn$_invoke$arity$1(icon_theme) : fexpr__126381.call(null,icon_theme));
})())?"linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)":null),'boxShadow':(cljs.core.truth_((function (){var fexpr__126382 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"gradient","gradient",-1983908971),null], null), null);
return (fexpr__126382.cljs$core$IFn$_invoke$arity$1 ? fexpr__126382.cljs$core$IFn$_invoke$arity$1(icon_theme) : fexpr__126382.call(null,icon_theme));
})())?"inset 0 0 0 1px rgba(255,255,255,0.3) ":null)},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-5","h-5","rounded","flex","items-center","justify-center",(function (){var G__126383 = "w-5 h-5 rounded flex items-center justify-center";
var G__126383__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(icon_theme,new cljs.core.Keyword(null,"color","color",1011675173)))?[G__126383," ",(cljs.core.truth_(highlighted)?"bg-accent-07-alpha":"bg-gray-05")," dark:text-white"].join(''):G__126383);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(icon_theme,new cljs.core.Keyword(null,"gray","gray",1013268388))){
return [G__126383__$1," bg-gray-05 dark:text-white"].join('');
} else {
return G__126383__$1;
}
})()], null))},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),"14",new cljs.core.Keyword(null,"class","class",-2030961996),""], null)))]),(function (){var attrs126380 = (cljs.core.truth_(title)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pb-2.font-bold.text-gray-11","div.text-sm.pb-2.font-bold.text-gray-11",-573368239),highlight_query(title)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126380))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","flex-col"], null)], null),attrs126380], 0))):{'className':"flex flex-1 flex-col"}),((cljs.core.map_QMARK_(attrs126380))?[daiquiri.core.create_element("div",{'className':"text-sm font-medium text-gray-12"},[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"pages","pages",-285406513))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(text,source_page))))?(function (){var attrs126384 = highlight_query(text);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126384))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs126384], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs126384))?[((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]:[daiquiri.interpreter.interpret(attrs126384),((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]));
})():daiquiri.interpreter.interpret(highlight_query(text))),(cljs.core.truth_(info)?daiquiri.core.create_element("span",{'className':"text-xs text-gray-11"},[" \u2014 ",daiquiri.interpreter.interpret(highlight_query(info))]):null)])]:[daiquiri.interpreter.interpret(attrs126380),daiquiri.core.create_element("div",{'className':"text-sm font-medium text-gray-12"},[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"pages","pages",-285406513))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(text,source_page))))?(function (){var attrs126393 = highlight_query(text);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126393))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs126393], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs126393))?[((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]:[daiquiri.interpreter.interpret(attrs126393),((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]));
})():daiquiri.interpreter.interpret(highlight_query(text))),(cljs.core.truth_(info)?daiquiri.core.create_element("span",{'className':"text-xs text-gray-11"},[" \u2014 ",daiquiri.interpreter.interpret(highlight_query(info))]):null)])]));
})(),(cljs.core.truth_((function (){var or__5002__auto__ = value_label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})())?daiquiri.core.create_element("div",{'className':"text-xs"},[(cljs.core.truth_((function (){var and__5000__auto__ = value_label;
if(cljs.core.truth_(and__5000__auto__)){
return value;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("span",{'className':"text-gray-11"},[[frontend.components.cmdk.list_item.to_string(value_label),": "].join('')]):null),(cljs.core.truth_((function (){var and__5000__auto__ = value_label;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(value);
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("span",{'className':"text-gray-11"},[frontend.components.cmdk.list_item.to_string(value_label)]):null),(cljs.core.truth_(value)?daiquiri.core.create_element("span",{'className':"text-gray-11"},[frontend.components.cmdk.list_item.to_string(value)]):null)]):null),(cljs.core.truth_(shortcut)?daiquiri.core.create_element("div",{'style':{'opacity':(cljs.core.truth_((function (){var or__5002__auto__ = highlighted;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return hover_QMARK_;
}
})())?(1):0.9)},'className':"flex gap-1"},[daiquiri.interpreter.interpret(logseq.shui.ui.shortcut(shortcut))]):null)])]:[daiquiri.interpreter.interpret(attrs126371),(cljs.core.truth_(header)?daiquiri.core.create_element("div",{'style':{'color':"var(--lx-gray-11)"},'className':"text-xs pl-8 font-light -mt-1"},[daiquiri.interpreter.interpret(highlight_query(header))]):null),daiquiri.core.create_element("div",{'className':"flex items-center gap-3"},[daiquiri.core.create_element("div",{'style':{'background':(cljs.core.truth_((function (){var fexpr__126403 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"gradient","gradient",-1983908971),null], null), null);
return (fexpr__126403.cljs$core$IFn$_invoke$arity$1 ? fexpr__126403.cljs$core$IFn$_invoke$arity$1(icon_theme) : fexpr__126403.call(null,icon_theme));
})())?"linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)":null),'boxShadow':(cljs.core.truth_((function (){var fexpr__126404 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"gradient","gradient",-1983908971),null], null), null);
return (fexpr__126404.cljs$core$IFn$_invoke$arity$1 ? fexpr__126404.cljs$core$IFn$_invoke$arity$1(icon_theme) : fexpr__126404.call(null,icon_theme));
})())?"inset 0 0 0 1px rgba(255,255,255,0.3) ":null)},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-5","h-5","rounded","flex","items-center","justify-center",(function (){var G__126405 = "w-5 h-5 rounded flex items-center justify-center";
var G__126405__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(icon_theme,new cljs.core.Keyword(null,"color","color",1011675173)))?[G__126405," ",(cljs.core.truth_(highlighted)?"bg-accent-07-alpha":"bg-gray-05")," dark:text-white"].join(''):G__126405);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(icon_theme,new cljs.core.Keyword(null,"gray","gray",1013268388))){
return [G__126405__$1," bg-gray-05 dark:text-white"].join('');
} else {
return G__126405__$1;
}
})()], null))},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),"14",new cljs.core.Keyword(null,"class","class",-2030961996),""], null)))]),(function (){var attrs126402 = (cljs.core.truth_(title)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pb-2.font-bold.text-gray-11","div.text-sm.pb-2.font-bold.text-gray-11",-573368239),highlight_query(title)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126402))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","flex-col"], null)], null),attrs126402], 0))):{'className':"flex flex-1 flex-col"}),((cljs.core.map_QMARK_(attrs126402))?[daiquiri.core.create_element("div",{'className':"text-sm font-medium text-gray-12"},[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"pages","pages",-285406513))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(text,source_page))))?(function (){var attrs126406 = highlight_query(text);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126406))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs126406], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs126406))?[((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]:[daiquiri.interpreter.interpret(attrs126406),((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]));
})():daiquiri.interpreter.interpret(highlight_query(text))),(cljs.core.truth_(info)?daiquiri.core.create_element("span",{'className':"text-xs text-gray-11"},[" \u2014 ",daiquiri.interpreter.interpret(highlight_query(info))]):null)])]:[daiquiri.interpreter.interpret(attrs126402),daiquiri.core.create_element("div",{'className':"text-sm font-medium text-gray-12"},[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"pages","pages",-285406513))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(text,source_page))))?(function (){var attrs126415 = highlight_query(text);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126415))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs126415], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs126415))?[((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]:[daiquiri.interpreter.interpret(attrs126415),((cljs.core.not(hls_page_QMARK_))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"opacity-50 font-normal"},["alias of"]),daiquiri.interpreter.interpret(source_page)]):daiquiri.core.create_element("div",{'className':"opacity-50 font-normal text-xs"},[" \u2014 Highlights page"]))]));
})():daiquiri.interpreter.interpret(highlight_query(text))),(cljs.core.truth_(info)?daiquiri.core.create_element("span",{'className':"text-xs text-gray-11"},[" \u2014 ",daiquiri.interpreter.interpret(highlight_query(info))]):null)])]));
})(),(cljs.core.truth_((function (){var or__5002__auto__ = value_label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})())?daiquiri.core.create_element("div",{'className':"text-xs"},[(cljs.core.truth_((function (){var and__5000__auto__ = value_label;
if(cljs.core.truth_(and__5000__auto__)){
return value;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("span",{'className':"text-gray-11"},[[frontend.components.cmdk.list_item.to_string(value_label),": "].join('')]):null),(cljs.core.truth_((function (){var and__5000__auto__ = value_label;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(value);
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("span",{'className':"text-gray-11"},[frontend.components.cmdk.list_item.to_string(value_label)]):null),(cljs.core.truth_(value)?daiquiri.core.create_element("span",{'className':"text-gray-11"},[frontend.components.cmdk.list_item.to_string(value)]):null)]):null),(cljs.core.truth_(shortcut)?daiquiri.core.create_element("div",{'style':{'opacity':(cljs.core.truth_((function (){var or__5002__auto__ = highlighted;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return hover_QMARK_;
}
})())?(1):0.9)},'className':"flex gap-1"},[daiquiri.interpreter.interpret(logseq.shui.ui.shortcut(shortcut))]):null)])]));
}),null,"frontend.components.cmdk.list-item/root");

//# sourceMappingURL=frontend.components.cmdk.list_item.js.map
