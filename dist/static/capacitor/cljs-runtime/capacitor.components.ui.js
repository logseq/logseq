goog.provide('capacitor.components.ui');
var module$node_modules$react_transition_group$cjs$index=shadow.js.require("module$node_modules$react_transition_group$cjs$index", {});
if((typeof capacitor !== 'undefined') && (typeof capacitor.components !== 'undefined') && (typeof capacitor.components.ui !== 'undefined') && (typeof capacitor.components.ui.transition_group !== 'undefined')){
} else {
capacitor.components.ui.transition_group = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_transition_group$cjs$index.TransitionGroup);
}
if((typeof capacitor !== 'undefined') && (typeof capacitor.components !== 'undefined') && (typeof capacitor.components.ui !== 'undefined') && (typeof capacitor.components.ui.css_transition !== 'undefined')){
} else {
capacitor.components.ui.css_transition = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$react_transition_group$cjs$index.CSSTransition);
}
capacitor.components.ui.safe_page_container = rum.core.lazy_build(rum.core.build_defc,(function (content,p__60180){
var map__60181 = p__60180;
var map__60181__$1 = cljs.core.__destructure_map(map__60181);
var header_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60181__$1,new cljs.core.Keyword(null,"header-content","header-content",-2015916786));
var page_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60181__$1,new cljs.core.Keyword(null,"page-props","page-props",1938349712));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60181__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
return daiquiri.interpreter.interpret(capacitor.ionic.page(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"app-safe-page"], null),page_props], 0)),(function (){var G__60183 = header_content;
if((G__60183 == null)){
return null;
} else {
return capacitor.ionic.header(G__60183);
}
})(),capacitor.ionic.content(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),content_props], 0)),content)));
}),null,"capacitor.components.ui/safe-page-container");
capacitor.components.ui.classic_app_container_wrap = rum.core.lazy_build(rum.core.build_defc,(function (content){
return daiquiri.core.create_element("main",{'id':"app-container-wrapper",'className':"ls-fold-button-on-right"},[daiquiri.core.create_element("div",{'id':"app-container",'className':"pt-2"},[daiquiri.core.create_element("div",{'id':"main-container",'className':"flex flex-1"},[(function (){var attrs60186 = content;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs60186))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"main-content-container",new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-full","!px-0"], null)], null),attrs60186], 0))):{'id':"main-content-container",'className':"w-full !px-0"}),((cljs.core.map_QMARK_(attrs60186))?null:[daiquiri.interpreter.interpret(attrs60186)]));
})()])])]);
}),null,"capacitor.components.ui/classic-app-container-wrap");
capacitor.components.ui.notification_clear_all = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"ui__notifications-content"},[(function (){var attrs60187 = capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.notification.clear_all_BANG_();
})], null),"clear all");
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs60187))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pointer-events-auto","notification-clear"], null)], null),attrs60187], 0))):{'className':"pointer-events-auto notification-clear"}),((cljs.core.map_QMARK_(attrs60187))?null:[daiquiri.interpreter.interpret(attrs60187)]));
})()]);
}),null,"capacitor.components.ui/notification-clear-all");
capacitor.components.ui.notification_content = rum.core.lazy_build(rum.core.build_defc,(function (state,content,status,uid){
if(cljs.core.truth_((function (){var and__5000__auto__ = content;
if(cljs.core.truth_(and__5000__auto__)){
return status;
} else {
return and__5000__auto__;
}
})())){
var svg = (((status instanceof cljs.core.Keyword))?(function (){var G__60190 = status;
var G__60190__$1 = (((G__60190 instanceof cljs.core.Keyword))?G__60190.fqn:null);
switch (G__60190__$1) {
case "success":
return capacitor.ionic.tabler_icon("circle-check",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-green-600",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null));

break;
case "warning":
return capacitor.ionic.tabler_icon("alert-circle",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-yellow-600",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null));

break;
case "error":
return capacitor.ionic.tabler_icon("circle-x",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-red-600",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null));

break;
default:
return capacitor.ionic.tabler_icon("info-circle",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-indigo-600",new cljs.core.Keyword(null,"size","size",1098693007),"20"], null));

}
})():status);
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exiting")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"exited"))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),(-1)], null):null)),'className':"ui__notifications-content"},[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["max-w-sm","w-full","shadow-lg","rounded-lg","pointer-events-auto","notification-area",(function (){var G__60191 = state;
switch (G__60191) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__60191)].join('')));

}
})()], null))},[daiquiri.core.create_element("div",{'style':{'maxHeight':"calc(100vh - 200px)",'overflowY':"auto",'overflowX':"hidden"},'className':"rounded-lg shadow-xs"},[daiquiri.core.create_element("div",{'className':"p-4"},[daiquiri.core.create_element("div",{'className':"flex items-start"},[(function (){var attrs60192 = svg;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs60192))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-shrink-0","pt-2"], null)], null),attrs60192], 0))):{'className':"flex-shrink-0 pt-2"}),((cljs.core.map_QMARK_(attrs60192))?null:[daiquiri.interpreter.interpret(attrs60192)]));
})(),daiquiri.core.create_element("div",{'className':"ml-3 w-0 flex-1 pt-2"},[daiquiri.core.create_element("div",{'style':{'margin':(0)},'className':"text-sm leading-5 font-medium whitespace-pre-line"},[daiquiri.interpreter.interpret(content)])]),daiquiri.core.create_element("div",{'style':{'marginTop':(-9),'marginRight':(-18)},'className':"flex-shrink-0 flex"},[daiquiri.interpreter.interpret(capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"mode","mode",654403691),"ios",new cljs.core.Keyword(null,"shape","shape",1190694006),"round",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.notification.clear_BANG_(uid);
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"icon-only"], null),capacitor.ionic.tabler_icon("x")], null)))])])])])])]);
} else {
return null;
}
}),null,"capacitor.components.ui/notification-content");
capacitor.components.ui.install_notifications = rum.core.lazy_build(rum.core.build_defc,(function (){
var contents = frontend.state.sub(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618));
return daiquiri.interpreter.interpret((function (){var G__60199 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-name","class-name",945142584),"notifications ui__notifications"], null);
var G__60200 = (function (){var notifications = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (el){
var k = cljs.core.first(el);
var v = cljs.core.second(el);
var G__60203 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(k)], null);
var G__60204 = (function (state){
return capacitor.components.ui.notification_content(state,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(v),k);
});
return (capacitor.components.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? capacitor.components.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__60203,G__60204) : capacitor.components.ui.css_transition.call(null,G__60203,G__60204));
}),contents);
var clear_all = (((cljs.core.count(contents) > (3)))?(function (){var G__60205 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"timeout","timeout",-318625318),(100),new cljs.core.Keyword(null,"k","k",-2146297393),"clear-all"], null);
var G__60206 = (function (_state){
return capacitor.components.ui.notification_clear_all();
});
return (capacitor.components.ui.css_transition.cljs$core$IFn$_invoke$arity$2 ? capacitor.components.ui.css_transition.cljs$core$IFn$_invoke$arity$2(G__60205,G__60206) : capacitor.components.ui.css_transition.call(null,G__60205,G__60206));
})():null);
var items = (cljs.core.truth_(clear_all)?cljs.core.cons(clear_all,notifications):notifications);
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(items);
})();
return (capacitor.components.ui.transition_group.cljs$core$IFn$_invoke$arity$2 ? capacitor.components.ui.transition_group.cljs$core$IFn$_invoke$arity$2(G__60199,G__60200) : capacitor.components.ui.transition_group.call(null,G__60199,G__60200));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.components.ui/install-notifications");
if((typeof capacitor !== 'undefined') && (typeof capacitor.components !== 'undefined') && (typeof capacitor.components.ui !== 'undefined') && (typeof capacitor.components.ui._STAR_modals !== 'undefined')){
} else {
capacitor.components.ui._STAR_modals = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof capacitor !== 'undefined') && (typeof capacitor.components !== 'undefined') && (typeof capacitor.components.ui !== 'undefined') && (typeof capacitor.components.ui._STAR_id !== 'undefined')){
} else {
capacitor.components.ui._STAR_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
if((typeof capacitor !== 'undefined') && (typeof capacitor.components !== 'undefined') && (typeof capacitor.components.ui !== 'undefined') && (typeof capacitor.components.ui.gen_id !== 'undefined')){
} else {
capacitor.components.ui.gen_id = (function capacitor$components$ui$gen_id(){
return cljs.core.reset_BANG_(capacitor.components.ui._STAR_id,(cljs.core.deref(capacitor.components.ui._STAR_id) + (1)));
});
}
capacitor.components.ui.x_modal = rum.core.lazy_build(rum.core.build_defc,(function (p__60207,content){
var map__60208 = p__60207;
var map__60208__$1 = cljs.core.__destructure_map(map__60208);
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
var as_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"as-page?","as-page?",-465105997));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var on_action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"on-action","on-action",-894612848));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"title","title",636505583));
var buttons = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"buttons","buttons",-1953831197));
var inputs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"inputs","inputs",865803858));
var modal_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60208__$1,new cljs.core.Keyword(null,"modal-props","modal-props",828488043));
var map__60209 = modal_props;
var map__60209__$1 = cljs.core.__destructure_map(map__60209);
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60209__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60209__$1,new cljs.core.Keyword(null,"header","header",119441134));
var G__60210 = type;
var G__60210__$1 = (((G__60210 instanceof cljs.core.Keyword))?G__60210.fqn:null);
switch (G__60210__$1) {
case "alert":
return daiquiri.interpreter.interpret(capacitor.ionic.alert(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([modal_props,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"is-open","is-open",1660707069),true,new cljs.core.Keyword(null,"header","header",119441134),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return header;
}
})(),new cljs.core.Keyword(null,"message","message",-406056002),content,new cljs.core.Keyword(null,"backdropDismiss","backdropDismiss",-584340775),false,new cljs.core.Keyword(null,"onWillDismiss","onWillDismiss",1020718323),(function (e){
if(cljs.core.truth_(on_action)){
var G__60212_60271 = cljs_bean.core.__GT_clj(e.detail);
(on_action.cljs$core$IFn$_invoke$arity$1 ? on_action.cljs$core$IFn$_invoke$arity$1(G__60212_60271) : on_action.call(null,G__60212_60271));
} else {
}

return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
}),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),cljs_bean.core.__GT_js((function (){var or__5002__auto__ = buttons;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"buttons","buttons",-1953831197).cljs$core$IFn$_invoke$arity$1(modal_props);
}
})()),new cljs.core.Keyword(null,"inputs","inputs",865803858),cljs_bean.core.__GT_js((function (){var or__5002__auto__ = inputs;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"inputs","inputs",865803858).cljs$core$IFn$_invoke$arity$1(modal_props);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.PersistentVector.EMPTY;
}
}
})())], null)], 0))));

break;
case "action-sheet":
return daiquiri.interpreter.interpret(capacitor.ionic.action_sheet(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([modal_props,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"is-open","is-open",1660707069),true,new cljs.core.Keyword(null,"header","header",119441134),(function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = title;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return header;
}
}
})(),new cljs.core.Keyword(null,"onWillDismiss","onWillDismiss",1020718323),(function (e){
if(cljs.core.truth_(on_action)){
var G__60216_60274 = cljs_bean.core.__GT_clj(e.detail);
(on_action.cljs$core$IFn$_invoke$arity$1 ? on_action.cljs$core$IFn$_invoke$arity$1(G__60216_60274) : on_action.call(null,G__60216_60274));
} else {
}

return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
}),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),cljs_bean.core.__GT_js((function (){var or__5002__auto__ = buttons;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"buttons","buttons",-1953831197).cljs$core$IFn$_invoke$arity$1(modal_props);
}
})())], null)], 0))));

break;
default:
return daiquiri.interpreter.interpret(capacitor.ionic.modal(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([modal_props,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"is-open","is-open",1660707069),true,new cljs.core.Keyword(null,"onWillDismiss","onWillDismiss",1020718323),(function (){
return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$),(((!(as_page_QMARK_ === true)))?" ion-datetime-button-overlay":null)].join('')], null)], 0)),((cljs.core.fn_QMARK_(content))?(content.cljs$core$IFn$_invoke$arity$0 ? content.cljs$core$IFn$_invoke$arity$0() : content.call(null)):content)));

}
}),null,"capacitor.components.ui/x-modal");
capacitor.components.ui.get_modal = (function capacitor$components$ui$get_modal(var_args){
var G__60224 = arguments.length;
switch (G__60224) {
case 0:
return capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$0 = (function (){
var G__60225 = cljs.core.deref(capacitor.components.ui._STAR_modals);
if((G__60225 == null)){
return null;
} else {
return cljs.core.last(G__60225);
}
}));

(capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$1 = (function (id){
if(cljs.core.truth_(id)){
var G__60226 = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(capacitor.components.ui._STAR_modals));
var G__60226__$1 = (((G__60226 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__60222_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__60222_SHARP_)));
}),G__60226));
if((G__60226__$1 == null)){
return null;
} else {
return cljs.core.first(G__60226__$1);
}
} else {
return null;
}
}));

(capacitor.components.ui.get_modal.cljs$lang$maxFixedArity = 1);

capacitor.components.ui.upsert_modal_BANG_ = (function capacitor$components$ui$upsert_modal_BANG_(config){
var temp__5804__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var temp__5802__auto___60280 = capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$1(id);
if(cljs.core.truth_(temp__5802__auto___60280)){
var vec__60229_60281 = temp__5802__auto___60280;
var index_60282 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60229_60281,(0),null);
var config_SINGLEQUOTE__60283 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60229_60281,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(capacitor.components.ui._STAR_modals,cljs.core.assoc,index_60282,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config_SINGLEQUOTE__60283,config], 0)));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(capacitor.components.ui._STAR_modals,cljs.core.conj,config);
}

return id;
} else {
return null;
}
});
capacitor.components.ui.delete_modal_BANG_ = (function capacitor$components$ui$delete_modal_BANG_(id){
var temp__5804__auto__ = capacitor.components.ui.get_modal.cljs$core$IFn$_invoke$arity$1(id);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__60233 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60233,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60233,(1),null);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(capacitor.components.ui._STAR_modals,(function (p1__60232_SHARP_){
return cljs.core.vec(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(index,p1__60232_SHARP_));
}));
} else {
return null;
}
});
capacitor.components.ui.open_modal_BANG_ = (function capacitor$components$ui$open_modal_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60284 = arguments.length;
var i__5727__auto___60285 = (0);
while(true){
if((i__5727__auto___60285 < len__5726__auto___60284)){
args__5732__auto__.push((arguments[i__5727__auto___60285]));

var G__60286 = (i__5727__auto___60285 + (1));
i__5727__auto___60285 = G__60286;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return capacitor.components.ui.open_modal_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(capacitor.components.ui.open_modal_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (content,p__60240){
var map__60241 = p__60240;
var map__60241__$1 = cljs.core.__destructure_map(map__60241);
var props = map__60241__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60241__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60241__$1,new cljs.core.Keyword(null,"type","type",1174270348));
return capacitor.components.ui.upsert_modal_BANG_(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return capacitor.components.ui.gen_id();
}
})(),new cljs.core.Keyword(null,"type","type",1174270348),(function (){var or__5002__auto__ = type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})(),new cljs.core.Keyword(null,"as-page?","as-page?",-465105997),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"page","page",849072397)),new cljs.core.Keyword(null,"content","content",15833224),content], null)], 0)));
}));

(capacitor.components.ui.open_modal_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(capacitor.components.ui.open_modal_BANG_.cljs$lang$applyTo = (function (seq60237){
var G__60238 = cljs.core.first(seq60237);
var seq60237__$1 = cljs.core.next(seq60237);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60238,seq60237__$1);
}));

capacitor.components.ui.close_modal_BANG_ = (function capacitor$components$ui$close_modal_BANG_(var_args){
var G__60249 = arguments.length;
switch (G__60249) {
case 0:
return capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
var G__60254 = cljs.core.deref(capacitor.components.ui._STAR_modals);
var G__60254__$1 = (((G__60254 == null))?null:cljs.core.last(G__60254));
var G__60254__$2 = (((G__60254__$1 == null))?null:new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__60254__$1));
if((G__60254__$2 == null)){
return null;
} else {
return capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$1(G__60254__$2);
}
}));

(capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (id){
return capacitor.components.ui.delete_modal_BANG_(id);
}));

(capacitor.components.ui.close_modal_BANG_.cljs$lang$maxFixedArity = 1);

capacitor.components.ui.install_modals = rum.core.lazy_build(rum.core.build_defc,(function (){
var _ = frontend.rum.use_atom(capacitor.components.ui._STAR_modals);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function capacitor$components$ui$iter__60258(s__60259){
return (new cljs.core.LazySeq(null,(function (){
var s__60259__$1 = s__60259;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__60259__$1);
if(temp__5804__auto__){
var s__60259__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__60259__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__60259__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__60261 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__60260 = (0);
while(true){
if((i__60260 < size__5479__auto__)){
var map__60262 = cljs.core._nth(c__5478__auto__,i__60260);
var map__60262__$1 = cljs.core.__destructure_map(map__60262);
var props = map__60262__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60262__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60262__$1,new cljs.core.Keyword(null,"content","content",15833224));
var close_BANG_ = ((function (i__60260,map__60262,map__60262__$1,props,id,content,c__5478__auto__,size__5479__auto__,b__60261,s__60259__$2,temp__5804__auto__,_){
return (function (){
return capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$1(id);
});})(i__60260,map__60262,map__60262__$1,props,id,content,c__5478__auto__,size__5479__auto__,b__60261,s__60259__$2,temp__5804__auto__,_))
;
var props_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword(null,"close!","close!",-2079310498),close_BANG_);
cljs.core.chunk_append(b__60261,capacitor.components.ui.x_modal(props_SINGLEQUOTE_,((cljs.core.fn_QMARK_(content))?(content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(props_SINGLEQUOTE_) : content.call(null,props_SINGLEQUOTE_)):content)));

var G__60292 = (i__60260 + (1));
i__60260 = G__60292;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__60261),capacitor$components$ui$iter__60258(cljs.core.chunk_rest(s__60259__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__60261),null);
}
} else {
var map__60264 = cljs.core.first(s__60259__$2);
var map__60264__$1 = cljs.core.__destructure_map(map__60264);
var props = map__60264__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60264__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60264__$1,new cljs.core.Keyword(null,"content","content",15833224));
var close_BANG_ = ((function (map__60264,map__60264__$1,props,id,content,s__60259__$2,temp__5804__auto__,_){
return (function (){
return capacitor.components.ui.close_modal_BANG_.cljs$core$IFn$_invoke$arity$1(id);
});})(map__60264,map__60264__$1,props,id,content,s__60259__$2,temp__5804__auto__,_))
;
var props_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword(null,"close!","close!",-2079310498),close_BANG_);
return cljs.core.cons(capacitor.components.ui.x_modal(props_SINGLEQUOTE_,((cljs.core.fn_QMARK_(content))?(content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(props_SINGLEQUOTE_) : content.call(null,props_SINGLEQUOTE_)):content)),capacitor$components$ui$iter__60258(cljs.core.rest(s__60259__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(capacitor.components.ui._STAR_modals));
})())]);
}),null,"capacitor.components.ui/install-modals");

//# sourceMappingURL=capacitor.components.ui.js.map
