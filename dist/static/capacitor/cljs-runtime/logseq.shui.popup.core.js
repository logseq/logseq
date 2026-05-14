goog.provide('logseq.shui.popup.core');
logseq.shui.popup.core.button = logseq.shui.util.lsui_wrap("Button");
logseq.shui.popup.core.popover = logseq.shui.util.lsui_wrap("Popover");
logseq.shui.popup.core.popover_trigger = logseq.shui.util.lsui_wrap("PopoverTrigger");
logseq.shui.popup.core.popover_content = logseq.shui.util.lsui_wrap("PopoverContent");
logseq.shui.popup.core.popover_arrow = logseq.shui.util.lsui_wrap("PopoverArrow");
logseq.shui.popup.core.popover_close = logseq.shui.util.lsui_wrap("PopoverClose");
logseq.shui.popup.core.popover_remove_scroll = logseq.shui.util.lsui_wrap("PopoverRemoveScroll");
logseq.shui.popup.core.dropdown_menu = logseq.shui.util.lsui_wrap("DropdownMenu");
logseq.shui.popup.core.dropdown_menu_trigger = logseq.shui.util.lsui_wrap("DropdownMenuTrigger");
logseq.shui.popup.core.dropdown_menu_content = logseq.shui.util.lsui_wrap("DropdownMenuContent");
logseq.shui.popup.core.dropdown_menu_arrow = logseq.shui.util.lsui_wrap("DropdownMenuArrow");
logseq.shui.popup.core.dropdown_menu_group = logseq.shui.util.lsui_wrap("DropdownMenuGroup");
logseq.shui.popup.core.dropdown_menu_item = logseq.shui.util.lsui_wrap("DropdownMenuItem");
logseq.shui.popup.core.dropdown_menu_checkbox_item = logseq.shui.util.lsui_wrap("DropdownMenuCheckboxItem");
logseq.shui.popup.core.dropdown_menu_radio_group = logseq.shui.util.lsui_wrap("DropdownMenuRadioGroup");
logseq.shui.popup.core.dropdown_menu_radio_item = logseq.shui.util.lsui_wrap("DropdownMenuRadioItem");
logseq.shui.popup.core.dropdown_menu_label = logseq.shui.util.lsui_wrap("DropdownMenuLabel");
logseq.shui.popup.core.dropdown_menu_separator = logseq.shui.util.lsui_wrap("DropdownMenuSeparator");
logseq.shui.popup.core.dropdown_menu_shortcut = logseq.shui.util.lsui_wrap("DropdownMenuShortcut");
logseq.shui.popup.core.dropdown_menu_portal = logseq.shui.util.lsui_wrap("DropdownMenuPortal");
logseq.shui.popup.core.dropdown_menu_sub = logseq.shui.util.lsui_wrap("DropdownMenuSub");
logseq.shui.popup.core.dropdown_menu_sub_content = logseq.shui.util.lsui_wrap("DropdownMenuSubContent");
logseq.shui.popup.core.dropdown_menu_sub_trigger = logseq.shui.util.lsui_wrap("DropdownMenuSubTrigger");
if((typeof logseq !== 'undefined') && (typeof logseq.shui !== 'undefined') && (typeof logseq.shui.popup !== 'undefined') && (typeof logseq.shui.popup.core !== 'undefined') && (typeof logseq.shui.popup.core._STAR_popups !== 'undefined')){
} else {
logseq.shui.popup.core._STAR_popups = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof logseq !== 'undefined') && (typeof logseq.shui !== 'undefined') && (typeof logseq.shui.popup !== 'undefined') && (typeof logseq.shui.popup.core !== 'undefined') && (typeof logseq.shui.popup.core._STAR_id !== 'undefined')){
} else {
logseq.shui.popup.core._STAR_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
if((typeof logseq !== 'undefined') && (typeof logseq.shui !== 'undefined') && (typeof logseq.shui.popup !== 'undefined') && (typeof logseq.shui.popup.core !== 'undefined') && (typeof logseq.shui.popup.core.gen_id !== 'undefined')){
} else {
logseq.shui.popup.core.gen_id = (function logseq$shui$popup$core$gen_id(){
return cljs.core.reset_BANG_(logseq.shui.popup.core._STAR_id,(cljs.core.deref(logseq.shui.popup.core._STAR_id) + (1)));
});
}
logseq.shui.popup.core.get_popup = (function logseq$shui$popup$core$get_popup(id){
if(cljs.core.truth_(id)){
var G__46384 = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(logseq.shui.popup.core._STAR_popups));
var G__46384__$1 = (((G__46384 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__46333_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__46333_SHARP_)));
}),G__46384));
if((G__46384__$1 == null)){
return null;
} else {
return cljs.core.first(G__46384__$1);
}
} else {
return null;
}
});
logseq.shui.popup.core.get_popups = (function logseq$shui$popup$core$get_popups(){
return cljs.core.deref(logseq.shui.popup.core._STAR_popups);
});
logseq.shui.popup.core.get_last_popup = (function logseq$shui$popup$core$get_last_popup(){
return cljs.core.last(cljs.core.deref(logseq.shui.popup.core._STAR_popups));
});
logseq.shui.popup.core.upsert_popup_BANG_ = (function logseq$shui$popup$core$upsert_popup_BANG_(config){
var temp__5804__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var temp__5802__auto___47009 = logseq.shui.popup.core.get_popup(id);
if(cljs.core.truth_(temp__5802__auto___47009)){
var vec__46461_47010 = temp__5802__auto___47009;
var index_47011 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46461_47010,(0),null);
var config_SINGLEQUOTE__47012 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46461_47010,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.shui.popup.core._STAR_popups,cljs.core.assoc,index_47011,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config_SINGLEQUOTE__47012,config], 0)));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(logseq.shui.popup.core._STAR_popups,cljs.core.conj,config);
}

return id;
} else {
return null;
}
});
logseq.shui.popup.core.update_popup_BANG_ = (function logseq$shui$popup$core$update_popup_BANG_(id,ks,val){
var temp__5804__auto__ = logseq.shui.popup.core.get_popup(id);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__46478 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46478,(0),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46478,(1),null);
var ks__$1 = ((cljs.core.coll_QMARK_(ks))?ks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null));
var config__$1 = (((val == null))?medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(config,ks__$1):cljs.core.assoc_in(config,ks__$1,val));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.shui.popup.core._STAR_popups,cljs.core.assoc,index,config__$1);
} else {
return null;
}
});
logseq.shui.popup.core.detach_popup_BANG_ = (function logseq$shui$popup$core$detach_popup_BANG_(id){
var vec__46493 = logseq.shui.popup.core.get_popup(id);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46493,(0),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46493,(1),null);
if(cljs.core.truth_(index)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(logseq.shui.popup.core._STAR_popups,(function (p1__46491_SHARP_){
return cljs.core.vec(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(index,p1__46491_SHARP_));
}));

var map__46497 = config;
var map__46497__$1 = cljs.core.__destructure_map(map__46497);
var auto_focus_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46497__$1,new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46497__$1,new cljs.core.Keyword(null,"target","target",253001721));
var trigger_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46497__$1,new cljs.core.Keyword(null,"trigger-id","trigger-id",-599381518));
if(cljs.core.truth_((function (){var and__5000__auto__ = auto_focus_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return target;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (cljs.core.truth_(trigger_id)?document.getElementById(trigger_id):target);
if(cljs.core.truth_(temp__5804__auto__)){
var target__$1 = temp__5804__auto__;
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(target__$1,"ls-popup-closed");

return target__$1.focus();
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
logseq.shui.popup.core.show_BANG_ = (function logseq$shui$popup$core$show_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___47019 = arguments.length;
var i__5727__auto___47020 = (0);
while(true){
if((i__5727__auto___47020 < len__5726__auto___47019)){
args__5732__auto__.push((arguments[i__5727__auto___47020]));

var G__47021 = (i__5727__auto___47020 + (1));
i__5727__auto___47020 = G__47021;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.popup.core.show_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.popup.core.show_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (event,content,p__46591){
var map__46593 = p__46591;
var map__46593__$1 = cljs.core.__destructure_map(map__46593);
var opts = map__46593__$1;
var align = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"align","align",1964212802));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var as_dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558));
var on_after_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229));
var as_mask_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"as-mask?","as-mask?",1898009773));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var trigger_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"trigger-id","trigger-id",-599381518));
var focus_trigger_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"focus-trigger?","focus-trigger?",799847826));
var on_before_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var as_content_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46593__$1,new cljs.core.Keyword(null,"as-content?","as-content?",-609445867));
var id__$1 = (function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.shui.popup.core.gen_id();
}
})();
var _STAR_target = cljs.core.volatile_BANG_(null);
var position = ((cljs.core.vector_QMARK_(event))?event:((((((function (){var or__5002__auto__ = event.nativeEvent;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return event;
}
})() instanceof MouseEvent)) || ((event instanceof goog.events.BrowserEvent))))?(function (){
cljs.core.vreset_BANG_(_STAR_target,(function (){var or__5002__auto__ = event.nativeEvent;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return event;
}
})().target);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [event.clientX,event.clientY], null);
})()
:(((event instanceof Element))?(function (){var rect = event.getBoundingClientRect();
var left = rect.left;
var width = rect.width;
var height = rect.height;
var bottom = rect.bottom;
cljs.core.vreset_BANG_(_STAR_target,event);

return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(left + (function (){var G__46614 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(align);
var G__46614__$1 = (((G__46614 instanceof cljs.core.Keyword))?G__46614.fqn:null);
switch (G__46614__$1) {
case "start":
return (0);

break;
case "end":
return width;

break;
default:
return (width / (2));

}
})()),((bottom - height) - (cljs.core.truth_(as_mask_QMARK_)?(6):(0))),width,(cljs.core.truth_(as_mask_QMARK_)?(1):height)], null);
})():(cljs.core.truth_((function (){var and__5000__auto__ = (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[event],null));
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(event),(2))) && (cljs.core.every_QMARK_(cljs.core.integer_QMARK_,event)));
} else {
return and__5000__auto__;
}
})())?event:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(0)], null)
))));
var G__46630_47029 = cljs.core.deref(_STAR_target);
if((G__46630_47029 == null)){
} else {
dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(G__46630_47029,"data-popup-active",(((id__$1 instanceof cljs.core.Keyword))?cljs.core.name(id__$1):cljs.core.str.cljs$core$IFn$_invoke$arity$1(id__$1)));
}

var on_before_hide__$1 = (function (){
var G__46645_47030 = on_after_hide;
if((G__46645_47030 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46645_47030,null);
}

var temp__5804__auto__ = (function (){var and__5000__auto__ = (!(focus_trigger_QMARK_ === false));
if(and__5000__auto__){
var G__46655 = cljs.core.deref(_STAR_target);
if((G__46655 == null)){
return null;
} else {
return G__46655.closest("[tabindex='0']");
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var trigger = temp__5804__auto__;
return setTimeout((function (){
return trigger.focus();
}),(16));
} else {
return null;
}
});
return logseq.shui.popup.core.upsert_popup_BANG_(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.Keyword(null,"trigger-id","trigger-id",-599381518),new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"as-content?","as-content?",-609445867),new cljs.core.Keyword(null,"open?","open?",1238443125),new cljs.core.Keyword(null,"position","position",-2011731912),new cljs.core.Keyword(null,"target","target",253001721)],[(function (){var G__46661 = content_props;
if((!((align == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__46661,new cljs.core.Keyword(null,"align","align",1964212802),cljs.core.name(align));
} else {
return G__46661;
}
})(),content,as_dropdown_QMARK_,on_after_hide,root_props,trigger_id,on_before_hide__$1,id__$1,as_content_QMARK_,true,position,cljs.core.deref(_STAR_target)])], 0)));
}));

(logseq.shui.popup.core.show_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.popup.core.show_BANG_.cljs$lang$applyTo = (function (seq46561){
var G__46566 = cljs.core.first(seq46561);
var seq46561__$1 = cljs.core.next(seq46561);
var G__46568 = cljs.core.first(seq46561__$1);
var seq46561__$2 = cljs.core.next(seq46561__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__46566,G__46568,seq46561__$2);
}));

logseq.shui.popup.core.hide_BANG_ = (function logseq$shui$popup$core$hide_BANG_(var_args){
var G__46688 = arguments.length;
switch (G__46688) {
case 0:
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
var temp__5804__auto__ = (function (){var G__46701 = logseq.shui.popup.core.get_popups();
var G__46701__$1 = (((G__46701 == null))?null:cljs.core.last(G__46701));
if((G__46701__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__46701__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$2(id,(0));
} else {
return null;
}
}));

(logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (id){
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3(id,(0),cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (id,delay){
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3(id,delay,cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (id,delay,p__46708){
var map__46710 = p__46708;
var map__46710__$1 = cljs.core.__destructure_map(map__46710);
var _all_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46710__$1,new cljs.core.Keyword(null,"_all?","_all?",-2086727971));
var temp__5804__auto__ = logseq.shui.popup.core.get_popup(id);
if(cljs.core.truth_(temp__5804__auto__)){
var popup = temp__5804__auto__;
var config = cljs.core.last(popup);
var target = new cljs.core.Keyword(null,"target","target",253001721).cljs$core$IFn$_invoke$arity$1(config);
var f = (function (){
logseq.shui.popup.core.detach_popup_BANG_(id);

var G__46713 = new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229).cljs$core$IFn$_invoke$arity$1(config);
if((G__46713 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46713,cljs.core.PersistentVector.EMPTY);
}
});
var G__46715_47036 = new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747).cljs$core$IFn$_invoke$arity$1(config);
if((G__46715_47036 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46715_47036,cljs.core.PersistentVector.EMPTY);
}

var G__46718_47037 = target;
if((G__46718_47037 == null)){
} else {
dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(G__46718_47037,"data-popup-active");
}

if(((typeof delay === 'number') && ((delay > (0))))){
return setTimeout(f,delay);
} else {
return f();
}
} else {
return null;
}
}));

(logseq.shui.popup.core.hide_BANG_.cljs$lang$maxFixedArity = 3);

logseq.shui.popup.core.hide_all_BANG_ = (function logseq$shui$popup$core$hide_all_BANG_(){
var seq__46733 = cljs.core.seq(cljs.core.deref(logseq.shui.popup.core._STAR_popups));
var chunk__46734 = null;
var count__46735 = (0);
var i__46736 = (0);
while(true){
if((i__46736 < count__46735)){
var map__46748 = chunk__46734.cljs$core$IIndexed$_nth$arity$2(null,i__46736);
var map__46748__$1 = cljs.core.__destructure_map(map__46748);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46748__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3(id,(0),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"all?","all?",1103779750),true], null));


var G__47042 = seq__46733;
var G__47043 = chunk__46734;
var G__47044 = count__46735;
var G__47045 = (i__46736 + (1));
seq__46733 = G__47042;
chunk__46734 = G__47043;
count__46735 = G__47044;
i__46736 = G__47045;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__46733);
if(temp__5804__auto__){
var seq__46733__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__46733__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__46733__$1);
var G__47047 = cljs.core.chunk_rest(seq__46733__$1);
var G__47048 = c__5525__auto__;
var G__47049 = cljs.core.count(c__5525__auto__);
var G__47050 = (0);
seq__46733 = G__47047;
chunk__46734 = G__47048;
count__46735 = G__47049;
i__46736 = G__47050;
continue;
} else {
var map__46751 = cljs.core.first(seq__46733__$1);
var map__46751__$1 = cljs.core.__destructure_map(map__46751);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46751__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$3(id,(0),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"all?","all?",1103779750),true], null));


var G__47052 = cljs.core.next(seq__46733__$1);
var G__47053 = null;
var G__47054 = (0);
var G__47055 = (0);
seq__46733 = G__47052;
chunk__46734 = G__47053;
count__46735 = G__47054;
i__46736 = G__47055;
continue;
}
} else {
return null;
}
}
break;
}
});
logseq.shui.popup.core.x_popup = rum.core.lazy_build(rum.core.build_defc,(function (p__46775){
var map__46776 = p__46775;
var map__46776__$1 = cljs.core.__destructure_map(map__46776);
var _props = map__46776__$1;
var auto_side_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"auto-side?","auto-side?",-577583716));
var _on_before_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"_on-before-hide","_on-before-hide",2101953085));
var _on_after_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"_on-after-hide","_on-after-hide",1932954788));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"content","content",15833224));
var as_dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558));
var _auto_focus_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"_auto-focus?","_auto-focus?",-2028945558));
var as_mask_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"as-mask?","as-mask?",1898009773));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var _target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"_target","_target",-820699148));
var as_content_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"as-content?","as-content?",-609445867));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var force_popover_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"force-popover?","force-popover?",237318839));
var position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46776__$1,new cljs.core.Keyword(null,"position","position",-2011731912));
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = position;
if(cljs.core.truth_(temp__5804__auto__)){
var vec__46847 = temp__5804__auto__;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46847,(0),null);
var y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46847,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46847,(2),null);
var height = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46847,(3),null);
var popup_root = ((cljs.core.not(force_popover_QMARK_))?logseq.shui.popup.core.dropdown_menu:logseq.shui.popup.core.popover);
var popup_trigger = ((cljs.core.not(force_popover_QMARK_))?logseq.shui.popup.core.dropdown_menu_trigger:logseq.shui.popup.core.popover_trigger);
var popup_content = ((cljs.core.not(force_popover_QMARK_))?logseq.shui.popup.core.dropdown_menu_content:logseq.shui.popup.core.popover_content);
var auto_side_fn = (function (){
var vh = window.innerHeight;
var vec__46852 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [y,(vh - (y + height))], null);
var th = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46852,(0),null);
var bh = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46852,(1),null);
if((bh > (280))){
return "bottom";
} else {
if(((th - bh) > (100))){
return "top";
} else {
return "bottom";
}
}
});
var auto_side_QMARK___$1 = ((cljs.core.boolean_QMARK_(auto_side_QMARK_))?auto_side_QMARK_:true);
var content_props__$1 = (function (){var G__46865 = content_props;
if(((cljs.core.not(as_mask_QMARK_)) && (auto_side_QMARK___$1))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__46865,new cljs.core.Keyword(null,"side","side",389652279),auto_side_fn());
} else {
return G__46865;
}
})();
var handle_key_escape_BANG_ = (function (e){
if((function (){var G__46866 = content_props__$1;
var G__46866__$1 = (((G__46866 == null))?null:new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912).cljs$core$IFn$_invoke$arity$1(G__46866));
if((G__46866__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46866__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}
})() === false){
return null;
} else {
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$2(id,(1));
}
});
var handle_pointer_outside_BANG_ = (function (e){
if((function (){var G__46867 = content_props__$1;
var G__46867__$1 = (((G__46867 == null))?null:new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036).cljs$core$IFn$_invoke$arity$1(G__46867));
if((G__46867__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46867__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}
})() === false){
return null;
} else {
return logseq.shui.popup.core.hide_BANG_.cljs$core$IFn$_invoke$arity$2(id,(1));
}
});
var G__46868 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([root_props,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_], null)], 0));
var G__46869 = (function (){var G__46872 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__46873 = (function (){var G__46874 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"overflow-hidden fixed p-0 opacity-0",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"height","height",1025178622),((((typeof height === 'number') && ((height > (0)))))?height:(1)),new cljs.core.Keyword(null,"width","width",-384071477),(1),new cljs.core.Keyword(null,"top","top",-1856271961),y,new cljs.core.Keyword(null,"left","left",-399115937),x], null)], null);
var G__46875 = "";
return (logseq.shui.popup.core.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.popup.core.button.cljs$core$IFn$_invoke$arity$2(G__46874,G__46875) : logseq.shui.popup.core.button.call(null,G__46874,G__46875));
})();
return (popup_trigger.cljs$core$IFn$_invoke$arity$2 ? popup_trigger.cljs$core$IFn$_invoke$arity$2(G__46872,G__46873) : popup_trigger.call(null,G__46872,G__46873));
})();
var G__46870 = (function (){var content_props__$2 = (function (){var G__46877 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content_props__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),handle_key_escape_BANG_,new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),handle_pointer_outside_BANG_], null)], 0));
var G__46877__$1 = (cljs.core.truth_(as_mask_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__46877,new cljs.core.Keyword(null,"data-as-mask","data-as-mask",277341317),true):G__46877);
if(((cljs.core.not(force_popover_QMARK_)) && (cljs.core.not(as_dropdown_QMARK_)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__46877__$1,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__46891_47083 = content_props__$1;
var G__46891_47084__$1 = (((G__46891_47083 == null))?null:new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765).cljs$core$IFn$_invoke$arity$1(G__46891_47083));
if((G__46891_47084__$1 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__46891_47084__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null));
}

return (e.defaultPrevented = true);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-pointer-move","on-pointer-move",-775121695),(function (p1__46760_SHARP_){
return (p1__46760_SHARP_.defaultPrevented = true);
})], 0));
} else {
return G__46877__$1;
}
})();
var content__$1 = ((cljs.core.fn_QMARK_(content))?(function (){var G__46901 = (function (){var G__46902 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
if(cljs.core.truth_(as_content_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__46902,new cljs.core.Keyword(null,"content-props","content-props",687449284),content_props__$2);
} else {
return G__46902;
}
})();
return (content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(G__46901) : content.call(null,G__46901));
})():content);
if(cljs.core.truth_(as_content_QMARK_)){
return content__$1;
} else {
return (popup_content.cljs$core$IFn$_invoke$arity$2 ? popup_content.cljs$core$IFn$_invoke$arity$2(content_props__$2,content__$1) : popup_content.call(null,content_props__$2,content__$1));
}
})();
return (popup_root.cljs$core$IFn$_invoke$arity$3 ? popup_root.cljs$core$IFn$_invoke$arity$3(G__46868,G__46869,G__46870) : popup_root.call(null,G__46868,G__46869,G__46870));
} else {
return null;
}
})());
}),null,"logseq.shui.popup.core/x-popup");
logseq.shui.popup.core.install_popups = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__46916 = logseq.shui.util.use_atom(logseq.shui.popup.core._STAR_popups);
var popups = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46916,(0),null);
var _set_popups_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46916,(1),null);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function logseq$shui$popup$core$iter__46930(s__46931){
return (new cljs.core.LazySeq(null,(function (){
var s__46931__$1 = s__46931;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__46931__$1);
if(temp__5804__auto__){
var s__46931__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__46931__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__46931__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__46937 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__46936 = (0);
while(true){
if((i__46936 < size__5479__auto__)){
var config = cljs.core._nth(c__5478__auto__,i__46936);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(config);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"all?","all?",1103779750).cljs$core$IFn$_invoke$arity$1(config));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
cljs.core.chunk_append(b__46937,rum.core.with_key(logseq.shui.popup.core.x_popup(config),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config)));

var G__47091 = (i__46936 + (1));
i__46936 = G__47091;
continue;
} else {
var G__47092 = (i__46936 + (1));
i__46936 = G__47092;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__46937),logseq$shui$popup$core$iter__46930(cljs.core.chunk_rest(s__46931__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__46937),null);
}
} else {
var config = cljs.core.first(s__46931__$2);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(config);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"all?","all?",1103779750).cljs$core$IFn$_invoke$arity$1(config));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.cons(rum.core.with_key(logseq.shui.popup.core.x_popup(config),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config)),logseq$shui$popup$core$iter__46930(cljs.core.rest(s__46931__$2)));
} else {
var G__47095 = cljs.core.rest(s__46931__$2);
s__46931__$1 = G__47095;
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
return iter__5480__auto__(popups);
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.popup.core/install-popups");

//# sourceMappingURL=logseq.shui.popup.core.js.map
