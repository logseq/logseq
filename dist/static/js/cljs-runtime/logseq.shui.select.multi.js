goog.provide('logseq.shui.select.multi');
logseq.shui.select.multi.get_k = (function logseq$shui$select$multi$get_k(item){
if(cljs.core.map_QMARK_(item)){
var G__74713 = cljs.core.juxt.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"label","label",1718410804))(item);
var G__74713__$1 = (((G__74713 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__74713));
if((G__74713__$1 == null)){
return null;
} else {
return cljs.core.first(G__74713__$1);
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
var G__74937__delegate = function (input_props,p__74735){
var map__74736 = p__74735;
var map__74736__$1 = cljs.core.__destructure_map(map__74736);
var on_enter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74736__$1,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216));
var valid_search_key_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74736__$1,new cljs.core.Keyword(null,"valid-search-key?","valid-search-key?",-1854491699));
var _STAR_el = rum.core.use_ref(null);
var vec__74737 = rum.core.use_state((0));
var down = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74737,(0),null);
var set_down_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74737,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = (down > (0));
if(and__5000__auto__){
var G__74743 = rum.core.deref(_STAR_el);
var G__74743__$1 = (((G__74743 == null))?null:G__74743.closest(".head"));
if((G__74743__$1 == null)){
return null;
} else {
return G__74743__$1.nextSibling;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var G__74752 = (cljs.core.truth_(valid_search_key_QMARK_)?item.nextSibling:item);
if((G__74752 == null)){
return null;
} else {
return G__74752.focus();
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [down], null));

return daiquiri.core.create_element("div",{'ref':_STAR_el,'className':"search-input"},[daiquiri.interpreter.interpret((function (){var G__74758 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"search",new cljs.core.Keyword(null,"on-key-up","on-key-up",884441808),(function (p1__74727_SHARP_){
var G__74759 = p1__74727_SHARP_.key;
switch (G__74759) {
case "ArrowDown":
var G__74761 = (down + (1));
return (set_down_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_down_BANG_.cljs$core$IFn$_invoke$arity$1(G__74761) : set_down_BANG_.call(null,G__74761));

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
return (logseq.shui.form.core.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.input.cljs$core$IFn$_invoke$arity$1(G__74758) : logseq.shui.form.core.input.call(null,G__74758));
})())]);
};
var G__74937 = function (input_props,var_args){
var p__74735 = null;
if (arguments.length > 1) {
var G__74946__i = 0, G__74946__a = new Array(arguments.length -  1);
while (G__74946__i < G__74946__a.length) {G__74946__a[G__74946__i] = arguments[G__74946__i + 1]; ++G__74946__i;}
  p__74735 = new cljs.core.IndexedSeq(G__74946__a,0,null);
} 
return G__74937__delegate.call(this,input_props,p__74735);};
G__74937.cljs$lang$maxFixedArity = 1;
G__74937.cljs$lang$applyTo = (function (arglist__74947){
var input_props = cljs.core.first(arglist__74947);
var p__74735 = cljs.core.rest(arglist__74947);
return G__74937__delegate(input_props,p__74735);
});
G__74937.cljs$core$IFn$_invoke$arity$variadic = G__74937__delegate;
return G__74937;
})()
,null,"logseq.shui.select.multi/search-input");
logseq.shui.select.multi.simple_search_fn = (function logseq$shui$select$multi$simple_search_fn(items,q){
var q__$1 = (function (){var G__74773 = q;
var G__74773__$1 = (((G__74773 == null))?null:clojure.string.trim(G__74773));
if((G__74773__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__74773__$1);
}
})();
if(clojure.string.blank_QMARK_(q__$1)){
return items;
} else {
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__74764_SHARP_){
var G__74774 = logseq.shui.select.multi.get_v(p1__74764_SHARP_);
var G__74774__$1 = (((G__74774 == null))?null:clojure.string.lower_case(G__74774));
if((G__74774__$1 == null)){
return null;
} else {
return clojure.string.includes_QMARK_(G__74774__$1,q__$1);
}
}),items);
}
});
logseq.shui.select.multi.x_select_content = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__74956__delegate = function (items,selected_items,p__74788){
var map__74789 = p__74788;
var map__74789__$1 = cljs.core.__destructure_map(map__74789);
var value_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"value-render","value-render",882962329));
var on_search_key_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"on-search-key-change","on-search-key-change",-1703317861));
var item_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"item-render","item-render",253627868));
var search_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"search-key","search-key",-655412548));
var head_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"head-render","head-render",1257648669));
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
var search_key_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"search-key-render","search-key-render",1993106176));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var foot_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"foot-render","foot-render",-1936354106));
var search_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"search-fn","search-fn",-646637945));
var item_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"item-props","item-props",-1762062444));
var search_enabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"search-enabled?","search-enabled?",2053474261));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74789__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var x_content = logseq.shui.popup.core.dropdown_menu_content;
var x_item = logseq.shui.popup.core.dropdown_menu_item;
var _STAR_head_ref = rum.core.use_ref(null);
var vec__74790 = rum.core.use_state(search_key);
var search_key1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74790,(0),null);
var set_search_key_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74790,(1),null);
var search_key1_SINGLEQUOTE_ = (function (){var G__74793 = search_key1;
var G__74793__$1 = (((G__74793 == null))?null:clojure.string.trim(G__74793));
if((G__74793__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__74793__$1);
}
})();
var valid_search_key_QMARK_ = (function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(search_key1_SINGLEQUOTE_)));
} else {
return and__5000__auto__;
}
})();
var get_content_el = (function (p1__74780_SHARP_){
var G__74794 = p1__74780_SHARP_;
if((G__74794 == null)){
return null;
} else {
return G__74794.closest("[data-radix-menu-content]");
}
});
var get_item_nodes = (function (p1__74781_SHARP_){
var G__74795 = p1__74781_SHARP_;
var G__74795__$1 = (((G__74795 == null))?null:get_content_el(G__74795));
var G__74795__$2 = (((G__74795__$1 == null))?null:G__74795__$1.querySelectorAll("[data-radix-collection-item]"));
if((G__74795__$2 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(G__74795__$2);
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
var G__74796 = get_content_el(target);
var G__74796__$1 = (((G__74796 == null))?null:G__74796.querySelector("input"));
if((G__74796__$1 == null)){
return null;
} else {
return G__74796__$1.focus();
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

return daiquiri.interpreter.interpret((function (){var G__74831 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"onInteractOutside","onInteractOutside",-1720265251),close1_BANG_,new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),close1_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var temp__5804__auto__ = e.target;
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
var G__74836 = e.key;
switch (G__74836) {
case "ArrowUp":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__74837 = get_item_nodes(target);
if((G__74837 == null)){
return null;
} else {
return cljs.core.first(G__74837);
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
var G__74832 = (cljs.core.truth_((function (){var or__5002__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.fn_QMARK_(head_render);
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.head","div.head",603880936),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_head_ref], null),(cljs.core.truth_(search_enabled_QMARK_)?logseq.shui.select.multi.search_input(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),search_key1,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
e.stopPropagation();

var G__74838 = e.key;
switch (G__74838) {
case "Escape":
if(clojure.string.blank_QMARK_(search_key1)){
var G__74839 = e.target;
var G__74839__$1 = (((G__74839 == null))?null:G__74839.closest("[data-radix-menu-content]"));
if((G__74839__$1 == null)){
return null;
} else {
return G__74839__$1.focus();
}
} else {
return (set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_search_key_BANG_.call(null,""));
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__74783_SHARP_){
var G__74840 = p1__74783_SHARP_.target.value;
return (set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_key_BANG_.cljs$core$IFn$_invoke$arity$1(G__74840) : set_search_key_BANG_.call(null,G__74840));
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
var G__74833 = (function (){var iter__5480__auto__ = (function logseq$shui$select$multi$iter__74858(s__74859){
return (new cljs.core.LazySeq(null,(function (){
var s__74859__$1 = s__74859;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74859__$1);
if(temp__5804__auto__){
var s__74859__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74859__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74859__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74861 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74860 = (0);
while(true){
if((i__74860 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__74860);
var selected_QMARK_ = cljs.core.some(((function (i__74860,item,c__5478__auto__,size__5479__auto__,b__74861,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (p1__74784_SHARP_){
var k = logseq.shui.select.multi.get_k(item);
var k_SINGLEQUOTE_ = logseq.shui.select.multi.get_k(p1__74784_SHARP_);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,p1__74784_SHARP_)) || ((((!((k == null)))) && ((((!((k_SINGLEQUOTE_ == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,k_SINGLEQUOTE_)))))));
});})(i__74860,item,c__5478__auto__,size__5479__auto__,b__74861,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
,selected_items);
cljs.core.chunk_append(b__74861,((cljs.core.fn_QMARK_(item_render))?(function (){var G__74872 = item;
var G__74873 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
return (item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(G__74872,G__74873) : item_render.call(null,G__74872,G__74873));
})():(function (){var k = logseq.shui.select.multi.get_k(item);
var v = logseq.shui.select.multi.get_v(item);
if(cljs.core.truth_(k)){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item_props);
var on_click = ((function (i__74860,opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,c__5478__auto__,size__5479__auto__,b__74861,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
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
});})(i__74860,opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,c__5478__auto__,size__5479__auto__,b__74861,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
;
var G__74884 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-k","data-k",1282759848),k,new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null),item_props], 0));
var G__74885 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-2.w-full","span.flex.items-center.gap-2.w-full",1556721643),(function (){var G__74886 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),selected_QMARK_], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__74886) : logseq.shui.form.core.checkbox.call(null,G__74886));
})(),(function (){var v_SINGLEQUOTE_ = ((cljs.core.fn_QMARK_(v))?(v.cljs$core$IFn$_invoke$arity$2 ? v.cljs$core$IFn$_invoke$arity$2(item,opts) : v.call(null,item,opts)):v);
if(cljs.core.fn_QMARK_(value_render)){
var G__74887 = v_SINGLEQUOTE_;
var G__74888 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"item","item",249373802),item);
return (value_render.cljs$core$IFn$_invoke$arity$2 ? value_render.cljs$core$IFn$_invoke$arity$2(G__74887,G__74888) : value_render.call(null,G__74887,G__74888));
} else {
return v_SINGLEQUOTE_;
}
})()], null);
return (x_item.cljs$core$IFn$_invoke$arity$2 ? x_item.cljs$core$IFn$_invoke$arity$2(G__74884,G__74885) : x_item.call(null,G__74884,G__74885));
} else {
return null;
}
})()));

var G__74995 = (i__74860 + (1));
i__74860 = G__74995;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74861),logseq$shui$select$multi$iter__74858(cljs.core.chunk_rest(s__74859__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74861),null);
}
} else {
var item = cljs.core.first(s__74859__$2);
var selected_QMARK_ = cljs.core.some(((function (item,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
return (function (p1__74784_SHARP_){
var k = logseq.shui.select.multi.get_k(item);
var k_SINGLEQUOTE_ = logseq.shui.select.multi.get_k(p1__74784_SHARP_);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,p1__74784_SHARP_)) || ((((!((k == null)))) && ((((!((k_SINGLEQUOTE_ == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,k_SINGLEQUOTE_)))))));
});})(item,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
,selected_items);
return cljs.core.cons(((cljs.core.fn_QMARK_(item_render))?(function (){var G__74899 = item;
var G__74900 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
return (item_render.cljs$core$IFn$_invoke$arity$2 ? item_render.cljs$core$IFn$_invoke$arity$2(G__74899,G__74900) : item_render.call(null,G__74899,G__74900));
})():(function (){var k = logseq.shui.select.multi.get_k(item);
var v = logseq.shui.select.multi.get_v(item);
if(cljs.core.truth_(k)){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], null);
var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item_props);
var on_click = ((function (opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_){
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
});})(opts,on_click_SINGLEQUOTE_,k,v,selected_QMARK_,item,s__74859__$2,temp__5804__auto__,G__74831,G__74832,x_content,x_item,_STAR_head_ref,vec__74790,search_key1,set_search_key_BANG_,search_key1_SINGLEQUOTE_,valid_search_key_QMARK_,get_content_el,get_item_nodes,focus_search_input_BANG_,items__$1,close1_BANG_,map__74789,map__74789__$1,value_render,on_search_key_change,item_render,search_key,head_render,close_BANG_,search_key_render,on_chosen,content_props,foot_render,search_fn,item_props,search_enabled_QMARK_,open_QMARK_))
;
var G__74907 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-k","data-k",1282759848),k,new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null),item_props], 0));
var G__74908 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-2.w-full","span.flex.items-center.gap-2.w-full",1556721643),(function (){var G__74912 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),selected_QMARK_], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__74912) : logseq.shui.form.core.checkbox.call(null,G__74912));
})(),(function (){var v_SINGLEQUOTE_ = ((cljs.core.fn_QMARK_(v))?(v.cljs$core$IFn$_invoke$arity$2 ? v.cljs$core$IFn$_invoke$arity$2(item,opts) : v.call(null,item,opts)):v);
if(cljs.core.fn_QMARK_(value_render)){
var G__74914 = v_SINGLEQUOTE_;
var G__74915 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"item","item",249373802),item);
return (value_render.cljs$core$IFn$_invoke$arity$2 ? value_render.cljs$core$IFn$_invoke$arity$2(G__74914,G__74915) : value_render.call(null,G__74914,G__74915));
} else {
return v_SINGLEQUOTE_;
}
})()], null);
return (x_item.cljs$core$IFn$_invoke$arity$2 ? x_item.cljs$core$IFn$_invoke$arity$2(G__74907,G__74908) : x_item.call(null,G__74907,G__74908));
} else {
return null;
}
})()),logseq$shui$select$multi$iter__74858(cljs.core.rest(s__74859__$2)));
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
var G__74834 = (cljs.core.truth_((function (){var and__5000__auto__ = search_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(search_key_render);
} else {
return and__5000__auto__;
}
})())?(function (){var exist_fn = (function (){
return (((!(clojure.string.blank_QMARK_(search_key1)))) && (((cljs.core.seq(items__$1)) && (cljs.core.contains_QMARK_(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__74787_SHARP_){
var G__74918 = logseq.shui.select.multi.get_v(p1__74787_SHARP_);
if((G__74918 == null)){
return null;
} else {
return clojure.string.lower_case(G__74918);
}
}),items__$1)),clojure.string.lower_case(search_key1))))));
});
var G__74924 = search_key1;
var G__74925 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),items__$1,new cljs.core.Keyword(null,"x-item","x-item",-248931189),x_item,new cljs.core.Keyword(null,"exist-fn","exist-fn",707195532),exist_fn], null);
return (search_key_render.cljs$core$IFn$_invoke$arity$2 ? search_key_render.cljs$core$IFn$_invoke$arity$2(G__74924,G__74925) : search_key_render.call(null,G__74924,G__74925));
})():null);
var G__74835 = ((cljs.core.fn_QMARK_(foot_render))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.foot","div.foot",-1063776446),(foot_render.cljs$core$IFn$_invoke$arity$0 ? foot_render.cljs$core$IFn$_invoke$arity$0() : foot_render.call(null))], null):null);
return (x_content.cljs$core$IFn$_invoke$arity$5 ? x_content.cljs$core$IFn$_invoke$arity$5(G__74831,G__74832,G__74833,G__74834,G__74835) : x_content.call(null,G__74831,G__74832,G__74833,G__74834,G__74835));
})());
};
var G__74956 = function (items,selected_items,var_args){
var p__74788 = null;
if (arguments.length > 2) {
var G__75009__i = 0, G__75009__a = new Array(arguments.length -  2);
while (G__75009__i < G__75009__a.length) {G__75009__a[G__75009__i] = arguments[G__75009__i + 2]; ++G__75009__i;}
  p__74788 = new cljs.core.IndexedSeq(G__75009__a,0,null);
} 
return G__74956__delegate.call(this,items,selected_items,p__74788);};
G__74956.cljs$lang$maxFixedArity = 2;
G__74956.cljs$lang$applyTo = (function (arglist__75010){
var items = cljs.core.first(arglist__75010);
arglist__75010 = cljs.core.next(arglist__75010);
var selected_items = cljs.core.first(arglist__75010);
var p__74788 = cljs.core.rest(arglist__75010);
return G__74956__delegate(items,selected_items,p__74788);
});
G__74956.cljs$core$IFn$_invoke$arity$variadic = G__74956__delegate;
return G__74956;
})()
,null,"logseq.shui.select.multi/x-select-content");

//# sourceMappingURL=logseq.shui.select.multi.js.map
