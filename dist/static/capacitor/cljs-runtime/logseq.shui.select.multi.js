goog.provide('logseq.shui.select.multi');
logseq.shui.select.multi.get_k = (function logseq$shui$select$multi$get_k(item){
if(cljs.core.map_QMARK_(item)){
var G__47752 = cljs.core.juxt.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"label","label",1718410804))(item);
var G__47752__$1 = (((G__47752 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__47752));
if((G__47752__$1 == null)){
return null;
} else {
return cljs.core.first(G__47752__$1);
}
} else {
return item;
}
});
logseq.shui.select.multi.get_v = (function logseq$shui$select$multi$get_v(item){
if(typeof item === 'string'){
return item;
} else {
var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(item);
}
}
});
logseq.shui.select.multi.search_input = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__48087__delegate = function (input_props,p__47773){
var map__47774 = p__47773;
var map__47774__$1 = cljs.core.__destructure_map(map__47774);
var on_enter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47774__$1,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216));
var valid_search_key_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47774__$1,new cljs.core.Keyword(null,"valid-search-key?","valid-search-key?",-1854491699));
var _STAR_el = rum.core.use_ref(null);
var vec__47779 = rum.core.use_state((0));
var down = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47779,(0),null);
var set_down_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47779,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = (down > (0));
if(and__5000__auto__){
var G__47790 = rum.core.deref(_STAR_el);
var G__47790__$1 = (((G__47790 == null))?null:G__47790.closest(".head"));
if((G__47790__$1 == null)){
return null;
} else {
return G__47790__$1.nextSibling;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var G__47799 = (cljs.core.truth_(valid_search_key_QMARK_)?item.nextSibling:item);
if((G__47799 == null)){
return null;
} else {
return G__47799.focus();
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [down], null));

return daiquiri.core.create_element("div",{'ref':_STAR_el,'className':"search-input"},[daiquiri.interpreter.interpret((function (){var G__47832 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"search",new cljs.core.Keyword(null,"on-key-up","on-key-up",884441808),(function (p1__47753_SHARP_){
var G__47836 = p1__47753_SHARP_.key;
switch (G__47836) {
case "ArrowDown":
var G__47840 = (down + (1));
return (set_down_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_down_BANG_.cljs$core$IFn$_invoke$arity$1(G__47840) : set_down_BANG_.call(null,G__47840));

break;
case "ArrowUp":
return null;

break;
case "Enter":
if(cljs.core.fn_QMARK_(on_enter)){
return (on_enter.cljs$core$IFn$_invoke$arity$0 ? on_enter.cljs$core$IFn$_invoke$arity$0() : on_enter.call(null));
} else {
return null;
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true], null),input_props], 0));
return (logseq.shui.form.core.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.input.cljs$core$IFn$_invoke$arity$1(G__47832) : logseq.shui.form.core.input.call(null,G__47832));
})())]);
};
var G__48087 = function (input_props,var_args){
var p__47773 = null;
if (arguments.length > 1) {
var G__48103__i = 0, G__48103__a = new Array(arguments.length -  1);
while (G__48103__i < G__48103__a.length) {G__48103__a[G__48103__i] = arguments[G__48103__i + 1]; ++G__48103__i;}
  p__47773 = new cljs.core.IndexedSeq(G__48103__a,0,null);
} 
return G__48087__delegate.call(this,input_props,p__47773);};
G__48087.cljs$lang$maxFixedArity = 1;
G__48087.cljs$lang$applyTo = (function (arglist__48107){
var input_props = cljs.core.first(arglist__48107);
var p__47773 = cljs.core.rest(arglist__48107);
return G__48087__delegate(input_props,p__47773);
});
G__48087.cljs$core$IFn$_invoke$arity$variadic = G__48087__delegate;
return G__48087;
})()
,null,"logseq.shui.select.multi/search-input");
logseq.shui.select.multi.simple_search_fn = (function logseq$shui$select$multi$simple_search_fn(items,q){
var q__$1 = (function (){var G__47866 = q;
var G__47866__$1 = (((G__47866 == null))?null:clojure.string.trim(G__47866));
if((G__47866__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__47866__$1);
}
})();
if(clojure.string.blank_QMARK_(q__$1)){
return items;
} else {
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__47857_SHARP_){
var G__47870 = logseq.shui.select.multi.get_v(p1__47857_SHARP_);
var G__47870__$1 = (((G__47870 == null))?null:clojure.string.lower_case(G__47870));
if((G__47870__$1 == null)){
return null;
} else {
return clojure.string.includes_QMARK_(G__47870__$1,q__$1);
}
}),items);
}
});
logseq.shui.select.multi.x_select_content = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__48113__delegate = function (items,selected_items,p__47886){
var map__47890 = p__47886;
var map__47890__$1 = cljs.core.__destructure_map(map__47890);
var value_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"value-render","value-render",882962329));
var on_search_key_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"on-search-key-change","on-search-key-change",-1703317861));
var item_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"item-render","item-render",253627868));
var search_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"search-key","search-key",-655412548));
var head_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"head-render","head-render",1257648669));
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
var search_key_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"search-key-render","search-key-render",1993106176));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var foot_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"foot-render","foot-render",-1936354106));
var search_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"search-fn","search-fn",-646637945));
var item_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"item-props","item-props",-1762062444));
var search_enabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"search-enabled?","search-enabled?",2053474261));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47890__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var x_content = logseq.shui.popup.core.dropdown_menu_content;
var x_item = logseq.shui.popup.core.dropdown_menu_item;
var _STAR_head_ref = rum.core.use_ref(null);
var vec__47894 = rum.core.use_state(search_key);
var search_key1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47894,(0),null);
var set_search_key_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47894,(1),null);
var search_key1_SINGLEQUOTE_ = (function (){var G__47898 = search_key1;
var G__47898__$1 = (((G__47898 == null))?null:clojure.string.trim(G__47898));
if((G__47898__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__47898__$1);
}
})();
var valid_search_key_QMARK_ = (function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(search_key1_SINGLEQUOTE_)));
} else {
return and__5000__auto__;
}
})();
var get_content_el = (function (p1__47871_SHARP_){
var G__47905 = p1__47871_SHARP_;
if((G__47905 == null)){
return null;
} else {
return G__47905.closest("[data-radix-menu-content]");
}
});
var get_item_nodes = (function (p1__47872_SHARP_){
var G__47906 = p1__47872_SHARP_;
var G__47906__$1 = (((G__47906 == null))?null:get_content_el(G__47906));
var G__47906__$2 = (((G__47906__$1 == null))?null:G__47906__$1.querySelectorAll("[data-radix-collection-item]"));
if((G__47906__$2 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(G__47906__$2);
}
});
var focus_search_input_BANG_ = (function (target){
if(cljs.core.truth_((function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("INPUT",target.nodeName);
} else {
return and__5000__auto__;
}
})())){
var G__47913 = get_content_el(target);
var G__47913__$1 = (((G__47913 == null))?null:G__47913.querySelector("input"));
if((G__47913__$1 == null)){
return null;
} else {
return G__47913__$1.focus();
}
} else {
return null;
}
});
var items__$1 = (cljs.core.truth_(search_enabled_QMARK_)?((cljs.core.fn_QMARK_(search_fn))?(search_fn.cljs$core$IFn$_invoke$arity$2 ? search_fn.cljs$core$IFn$_invoke$arity$2(items,search_key1) : search_fn.call(null,items,search_key1)):logseq.shui.select.multi.simple_search_fn(items,search_key1)):items);
var close1_BANG_ = (function (){
if(cljs.core.fn_QMARK_(close_BANG_)){
return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
} else {
return null;
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.fn_QMARK_(on_search_key_change)){
return (on_search_key_change.cljs$core$IFn$_invoke$arity$1 ? on_search_key_change.cljs$core$IFn$_invoke$arity$1(search_key1_SINGLEQUOTE_) : on_search_key_change.call(null,search_key1_SINGLEQUOTE_));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [search_key1_SINGLEQUOTE_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (cljs.core.truth_((function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return open_QMARK_ === false;
} else {
return and__5000__auto__;
}
})())?setTimeout((function (){
return (set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_search_key_BANG_.call(null,""));
}),(500)):null);
if(cljs.core.truth_(temp__5804__auto__)){
var t = temp__5804__auto__;
return (function (){
return clearTimeout(t);
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [open_QMARK_], null));

return daiquiri.interpreter.interpret((function (){var G__48006 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"onInteractOutside","onInteractOutside",-1720265251),close1_BANG_,new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),close1_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var temp__5804__auto__ = e.target;
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
var G__48011 = e.key;
switch (G__48011) {
case "ArrowUp":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__48012 = get_item_nodes(target);
if((G__48012 == null)){
return null;
} else {
return cljs.core.first(G__48012);
}
})(),document.activeElement)){
return focus_search_input_BANG_(target);
} else {
return null;
}

break;
case "l":
if(cljs.core.truth_((function (){var or__5002__auto__ = e.metaKey;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return e.ctrlKey;
}
})())){
return focus_search_input_BANG_(target);
} else {
return null;
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
} else {
return null;
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(content_props))," ui__multi-select-content",(cljs.core.truth_(valid_search_key_QMARK_)?" has-search-key":null)].join('')], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(content_props,new cljs.core.Keyword(null,"class","class",-2030961996))], 0));
var G__48007 = (cljs.core.truth_((function (){var or__5002__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.fn_QMARK_(head_render);
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.head","div.head",603880936),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_head_ref], null),(cljs.core.truth_(search_enabled_QMARK_)?logseq.shui.select.multi.search_input(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),search_key1,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
e.stopPropagation();

var G__48013 = e.key;
switch (G__48013) {
case "Escape":
if(clojure.string.blank_QMARK_(search_key1)){
var G__48014 = e.target;
var G__48014__$1 = (((G__48014 == null))?null:G__48014.closest("[data-radix-menu-content]"));
if((G__48014__$1 == null)){
return null;
} else {
return G__48014__$1.focus();
}
} else {
return (set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_search_key_BANG_.call(null,""));
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__47877_SHARP_){
var G__48017 = p1__47877_SHARP_.target.value;
return (set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1(G__48017) : set_search_key_BANG_.call(null,G__48017));
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = (!(clojure.string.blank_QMARK_(search_key1_SINGLEQUOTE_)));
if(and__5000__auto__){
return rum.core.deref(_STAR_head_ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var head_el = temp__5804__auto__;
var temp__5804__auto____$1 = head_el.nextSibling;
if(cljs.core.truth_(temp__5804__auto____$1)){
var item = temp__5804__auto____$1;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["menuitemcheckbox",null,"menuitem",null], null), null),item.getAttribute("role"))){
return item.click();
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.Keyword(null,"valid-search-key?","valid-search-key?",-1854491699),valid_search_key_QMARK_], null)):null),(cljs.core.truth_(head_render)?(head_render.cljs$core$IFn$_invoke$arity$0 ? head_render.cljs$core$IFn$_invoke$arity$0() : head_render.call(null)):null)], null):null);
var G__48008 = (function (){var iter__5480__auto__ = (function logseq$shui$select$multi$iter__48024(s__48025){
return (new cljs.core.LazySeq(null,(function (){
var s__48025__$1 = s__48025;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__48025__$1);
if(temp__5804__auto__){
var s__48025__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__48025__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__48025__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__48027 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__48026 = (0);
while(true){
if((i__48026 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__48026);
var selected_QMARK_ = cljs.core.some(((function (i__48026,item,c__5478__auto__,size__5479__auto__,b__48027,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (p1__47880_SHARP_){
var k = logseq.shui.select.multi.get_k(item);
var k_SINGLEQUOTE_ = logseq.shui.select.multi.get_k(p1__47880_SHARP_);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,p1__47880_SHARP_)) || ((((!((k == null)))) && ((((!((k_SINGLEQUOTE_ == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,k_SINGLEQUOTE_)))))));
});})(i__48026,item,c__5478__auto__,size__5479__auto__,b__48027,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
,selected_items);
cljs.core.chunk_append(b__48027,((cljs.core.fn_QMARK_(item_render))?(function (){var G__48028 = item;
var G__48029 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
return (item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(G__48028,G__48029) : item_render.call(null,G__48028,G__48029));
})():(function (){var k = logseq.shui.select.multi.get_k(item);
var v = logseq.shui.select.multi.get_v(item);
if(cljs.core.truth_(k)){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item_props);
var on_click = ((function (i__48026,opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,c__5478__auto__,size__5479__auto__,b__48027,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (e){
if(cljs.core.fn_QMARK_(on_click_SINGLEQUOTE_)){
(on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e));
} else {
}

if(cljs.core.fn_QMARK_(on_chosen)){
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(item,opts) : on_chosen.call(null,item,opts));
} else {
return null;
}
});})(i__48026,opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,c__5478__auto__,size__5479__auto__,b__48027,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
;
var G__48030 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-k","data-k",1282759848),k,new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null),item_props], 0));
var G__48031 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-2.w-full","span.flex.items-center.gap-2.w-full",1556721643),(function (){var G__48032 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),selected_QMARK_], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__48032) : logseq.shui.form.core.checkbox.call(null,G__48032));
})(),(function (){var v_SINGLEQUOTE_ = ((cljs.core.fn_QMARK_(v))?(v.cljs$core$IFn$_invoke$arity$2 ? v.cljs$core$IFn$_invoke$arity$2(item,opts) : v.call(null,item,opts)):v);
if(cljs.core.fn_QMARK_(value_render)){
var G__48033 = v_SINGLEQUOTE_;
var G__48034 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"item","item",249373802),item);
return (value_render.cljs$core$IFn$_invoke$arity$2 ? value_render.cljs$core$IFn$_invoke$arity$2(G__48033,G__48034) : value_render.call(null,G__48033,G__48034));
} else {
return v_SINGLEQUOTE_;
}
})()], null);
return (x_item.cljs$core$IFn$_invoke$arity$2 ? x_item.cljs$core$IFn$_invoke$arity$2(G__48030,G__48031) : x_item.call(null,G__48030,G__48031));
} else {
return null;
}
})()));

var G__48176 = (i__48026 + (1));
i__48026 = G__48176;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__48027),logseq$shui$select$multi$iter__48024(cljs.core.chunk_rest(s__48025__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__48027),null);
}
} else {
var item = cljs.core.first(s__48025__$2);
var selected_QMARK_ = cljs.core.some(((function (item,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (p1__47880_SHARP_){
var k = logseq.shui.select.multi.get_k(item);
var k_SINGLEQUOTE_ = logseq.shui.select.multi.get_k(p1__47880_SHARP_);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,p1__47880_SHARP_)) || ((((!((k == null)))) && ((((!((k_SINGLEQUOTE_ == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,k_SINGLEQUOTE_)))))));
});})(item,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
,selected_items);
return cljs.core.cons(((cljs.core.fn_QMARK_(item_render))?(function (){var G__48037 = item;
var G__48038 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
return (item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(G__48037,G__48038) : item_render.call(null,G__48037,G__48038));
})():(function (){var k = logseq.shui.select.multi.get_k(item);
var v = logseq.shui.select.multi.get_v(item);
if(cljs.core.truth_(k)){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item_props);
var on_click = ((function (opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (e){
if(cljs.core.fn_QMARK_(on_click_SINGLEQUOTE_)){
(on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e));
} else {
}

if(cljs.core.fn_QMARK_(on_chosen)){
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(item,opts) : on_chosen.call(null,item,opts));
} else {
return null;
}
});})(opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,s__48025__$2,temp__5804__auto__,G__48006,G__48007,x_content,x_item,_STAR_head_ref,vec__47894,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__47890,map__47890__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
;
var G__48041 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-k","data-k",1282759848),k,new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null),item_props], 0));
var G__48042 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-2.w-full","span.flex.items-center.gap-2.w-full",1556721643),(function (){var G__48045 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),selected_QMARK_], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__48045) : logseq.shui.form.core.checkbox.call(null,G__48045));
})(),(function (){var v_SINGLEQUOTE_ = ((cljs.core.fn_QMARK_(v))?(v.cljs$core$IFn$_invoke$arity$2 ? v.cljs$core$IFn$_invoke$arity$2(item,opts) : v.call(null,item,opts)):v);
if(cljs.core.fn_QMARK_(value_render)){
var G__48048 = v_SINGLEQUOTE_;
var G__48049 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"item","item",249373802),item);
return (value_render.cljs$core$IFn$_invoke$arity$2 ? value_render.cljs$core$IFn$_invoke$arity$2(G__48048,G__48049) : value_render.call(null,G__48048,G__48049));
} else {
return v_SINGLEQUOTE_;
}
})()], null);
return (x_item.cljs$core$IFn$_invoke$arity$2 ? x_item.cljs$core$IFn$_invoke$arity$2(G__48041,G__48042) : x_item.call(null,G__48041,G__48042));
} else {
return null;
}
})()),logseq$shui$select$multi$iter__48024(cljs.core.rest(s__48025__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items__$1);
})();
var G__48009 = (cljs.core.truth_((function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(search_key_render);
} else {
return and__5000__auto__;
}
})())?(function (){var exist_fn = (function (){
return (((!(clojure.string.blank_QMARK_(search_key1)))) && (((cljs.core.seq(items__$1)) && (cljs.core.contains_QMARK_(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__47884_SHARP_){
var G__48054 = logseq.shui.select.multi.get_v(p1__47884_SHARP_);
if((G__48054 == null)){
return null;
} else {
return clojure.string.lower_case(G__48054);
}
}),items__$1)),clojure.string.lower_case(search_key1))))));
});
var G__48059 = search_key1;
var G__48060 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),items__$1,new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"exist-fn","exist-fn",707195532),exist_fn], null);
return (search_key_render.cljs$core$IFn$_invoke$arity$2 ? search_key_render.cljs$core$IFn$_invoke$arity$2(G__48059,G__48060) : search_key_render.call(null,G__48059,G__48060));
})():null);
var G__48010 = ((cljs.core.fn_QMARK_(foot_render))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.foot","div.foot",-1063776446),(foot_render.cljs$core$IFn$_invoke$arity$0 ? foot_render.cljs$core$IFn$_invoke$arity$0() : foot_render.call(null))], null):null);
return (x_content.cljs$core$IFn$_invoke$arity$5 ? x_content.cljs$core$IFn$_invoke$arity$5(G__48006,G__48007,G__48008,G__48009,G__48010) : x_content.call(null,G__48006,G__48007,G__48008,G__48009,G__48010));
})());
};
var G__48113 = function (items,selected_items,var_args){
var p__47886 = null;
if (arguments.length > 2) {
var G__48259__i = 0, G__48259__a = new Array(arguments.length -  2);
while (G__48259__i < G__48259__a.length) {G__48259__a[G__48259__i] = arguments[G__48259__i + 2]; ++G__48259__i;}
  p__47886 = new cljs.core.IndexedSeq(G__48259__a,0,null);
} 
return G__48113__delegate.call(this,items,selected_items,p__47886);};
G__48113.cljs$lang$maxFixedArity = 2;
G__48113.cljs$lang$applyTo = (function (arglist__48260){
var items = cljs.core.first(arglist__48260);
arglist__48260 = cljs.core.next(arglist__48260);
var selected_items = cljs.core.first(arglist__48260);
var p__47886 = cljs.core.rest(arglist__48260);
return G__48113__delegate(items,selected_items,p__47886);
});
G__48113.cljs$core$IFn$_invoke$arity$variadic = G__48113__delegate;
return G__48113;
})()
,null,"logseq.shui.select.multi/x-select-content");

//# sourceMappingURL=logseq.shui.select.multi.js.map
