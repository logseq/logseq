goog.provide('frontend.mixins');
/**
 * Detach all event listeners.
 */
frontend.mixins.detach = (function frontend$mixins$detach(state){
var G__100798 = state;
var G__100798__$1 = (((G__100798 == null))?null:new cljs.core.Keyword("frontend.mixins","event-handler","frontend.mixins/event-handler",1780579383).cljs$core$IFn$_invoke$arity$1(G__100798));
if((G__100798__$1 == null)){
return null;
} else {
return G__100798__$1.removeAll();
}
});
/**
 * Register an event `handler` for events of `type` on `target`.
 */
frontend.mixins.listen = (function frontend$mixins$listen(var_args){
var args__5732__auto__ = [];
var len__5726__auto___100827 = arguments.length;
var i__5727__auto___100828 = (0);
while(true){
if((i__5727__auto___100828 < len__5726__auto___100827)){
args__5732__auto__.push((arguments[i__5727__auto___100828]));

var G__100829 = (i__5727__auto___100828 + (1));
i__5727__auto___100828 = G__100829;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.mixins.listen.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.mixins.listen.cljs$core$IFn$_invoke$arity$variadic = (function (state,target,type,handler,p__100804){
var vec__100805 = p__100804;
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100805,(0),null);
var temp__5804__auto__ = new cljs.core.Keyword("frontend.mixins","event-handler","frontend.mixins/event-handler",1780579383).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto__)){
var event_handler = temp__5804__auto__;
return event_handler.listen(target,cljs.core.name(type),handler,cljs.core.clj__GT_js(opts));
} else {
return null;
}
}));

(frontend.mixins.listen.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.mixins.listen.cljs$lang$applyTo = (function (seq100799){
var G__100800 = cljs.core.first(seq100799);
var seq100799__$1 = cljs.core.next(seq100799);
var G__100801 = cljs.core.first(seq100799__$1);
var seq100799__$2 = cljs.core.next(seq100799__$1);
var G__100802 = cljs.core.first(seq100799__$2);
var seq100799__$3 = cljs.core.next(seq100799__$2);
var G__100803 = cljs.core.first(seq100799__$3);
var seq100799__$4 = cljs.core.next(seq100799__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100800,G__100801,G__100802,G__100803,seq100799__$4);
}));

/**
 * The event handler mixin.
 */
frontend.mixins.event_handler_mixin = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.mixins","event-handler","frontend.mixins/event-handler",1780579383),(new goog.events.EventHandler()));
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.mixins.detach(state);

return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.mixins","event-handler","frontend.mixins/event-handler",1780579383));
})], null);
frontend.mixins.hide_when_esc_or_outside = (function frontend$mixins$hide_when_esc_or_outside(var_args){
var args__5732__auto__ = [];
var len__5726__auto___100830 = arguments.length;
var i__5727__auto___100831 = (0);
while(true){
if((i__5727__auto___100831 < len__5726__auto___100830)){
args__5732__auto__.push((arguments[i__5727__auto___100831]));

var G__100832 = (i__5727__auto___100831 + (1));
i__5727__auto___100831 = G__100832;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic = (function (state,p__100811){
var map__100812 = p__100811;
var map__100812__$1 = cljs.core.__destructure_map(map__100812);
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100812__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
var node = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100812__$1,new cljs.core.Keyword(null,"node","node",581201198));
var visibilitychange_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100812__$1,new cljs.core.Keyword(null,"visibilitychange?","visibilitychange?",994612206));
var outside_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100812__$1,new cljs.core.Keyword(null,"outside?","outside?",-1930213908));
var opts = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var outside_QMARK___$1 = (function (){var G__100813 = opts;
if((outside_QMARK_ == null)){
return new cljs.core.Keyword(null,"outside?","outside?",-1930213908).cljs$core$IFn$_invoke$arity$1(G__100813);
} else {
return G__100813;
}
})();
try{var dom_node = rum.core.dom_node(state);
var temp__5804__auto__ = (function (){var or__5002__auto__ = node;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return dom_node;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var dom_node__$1 = temp__5804__auto__;
var click_fn_100833 = (function (e){
var target = e.target;
if(((cljs.core.not(goog.dom.contains(dom_node__$1,target))) && (cljs.core.not(target.classList.contains("ignore-outside-event"))))){
return (on_hide.cljs$core$IFn$_invoke$arity$3 ? on_hide.cljs$core$IFn$_invoke$arity$3(state,e,new cljs.core.Keyword(null,"click","click",1912301393)) : on_hide.call(null,state,e,new cljs.core.Keyword(null,"click","click",1912301393)));
} else {
return null;
}
});
if(outside_QMARK___$1 === false){
} else {
frontend.mixins.listen(state,window,"mousedown",click_fn_100833);
}

frontend.mixins.listen(state,window,"keydown",(function (e){
var G__100815 = e.keyCode;
switch (G__100815) {
case (27):
return (on_hide.cljs$core$IFn$_invoke$arity$3 ? on_hide.cljs$core$IFn$_invoke$arity$3(state,e,new cljs.core.Keyword(null,"esc","esc",-1671924121)) : on_hide.call(null,state,e,new cljs.core.Keyword(null,"esc","esc",-1671924121)));

break;
default:
return null;

}
}));

if(cljs.core.truth_(visibilitychange_QMARK_)){
return frontend.mixins.listen(state,window,"visibilitychange",(function (e){
return (on_hide.cljs$core$IFn$_invoke$arity$3 ? on_hide.cljs$core$IFn$_invoke$arity$3(state,e,new cljs.core.Keyword(null,"visibilitychange","visibilitychange",-1648113311)) : on_hide.call(null,state,e,new cljs.core.Keyword(null,"visibilitychange","visibilitychange",-1648113311)));
}));
} else {
return null;
}
} else {
return null;
}
}catch (e100814){var _e = e100814;
return null;
}}));

(frontend.mixins.hide_when_esc_or_outside.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.mixins.hide_when_esc_or_outside.cljs$lang$applyTo = (function (seq100809){
var G__100810 = cljs.core.first(seq100809);
var seq100809__$1 = cljs.core.next(seq100809);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100810,seq100809__$1);
}));

frontend.mixins.on_enter = (function frontend$mixins$on_enter(var_args){
var args__5732__auto__ = [];
var len__5726__auto___100835 = arguments.length;
var i__5727__auto___100836 = (0);
while(true){
if((i__5727__auto___100836 < len__5726__auto___100835)){
args__5732__auto__.push((arguments[i__5727__auto___100836]));

var G__100837 = (i__5727__auto___100836 + (1));
i__5727__auto___100836 = G__100837;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.mixins.on_enter.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.mixins.on_enter.cljs$core$IFn$_invoke$arity$variadic = (function (state,p__100818){
var map__100819 = p__100818;
var map__100819__$1 = cljs.core.__destructure_map(map__100819);
var on_enter_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100819__$1,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216));
var node = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100819__$1,new cljs.core.Keyword(null,"node","node",581201198));
var node__$1 = (function (){var or__5002__auto__ = node;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return rum.core.dom_node(state);
}
})();
return frontend.mixins.listen(state,node__$1,"keyup",(function (e){
var G__100820 = e.keyCode;
switch (G__100820) {
case (13):
return (on_enter_fn.cljs$core$IFn$_invoke$arity$1 ? on_enter_fn.cljs$core$IFn$_invoke$arity$1(e) : on_enter_fn.call(null,e));

break;
default:
return null;

}
}));
}));

(frontend.mixins.on_enter.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.mixins.on_enter.cljs$lang$applyTo = (function (seq100816){
var G__100817 = cljs.core.first(seq100816);
var seq100816__$1 = cljs.core.next(seq100816);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100817,seq100816__$1);
}));

/**
 * Caution: This mixin uses a different args than on-key-down
 */
frontend.mixins.on_key_up = (function frontend$mixins$on_key_up(state,keycode_map,all_handler){
return frontend.mixins.listen(state,window,"keyup",(function (e){
var key_code = e.keyCode;
var temp__5804__auto___100839 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(keycode_map,key_code);
if(cljs.core.truth_(temp__5804__auto___100839)){
var f_100840 = temp__5804__auto___100839;
(f_100840.cljs$core$IFn$_invoke$arity$2 ? f_100840.cljs$core$IFn$_invoke$arity$2(state,e) : f_100840.call(null,state,e));
} else {
}

if(cljs.core.truth_(all_handler)){
return (all_handler.cljs$core$IFn$_invoke$arity$2 ? all_handler.cljs$core$IFn$_invoke$arity$2(e,key_code) : all_handler.call(null,e,key_code));
} else {
return null;
}
}));
});
frontend.mixins.on_key_down = (function frontend$mixins$on_key_down(var_args){
var G__100822 = arguments.length;
switch (G__100822) {
case 2:
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2 = (function (state,keycode_map){
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$3(state,keycode_map,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$3 = (function (state,keycode_map,p__100823){
var map__100824 = p__100823;
var map__100824__$1 = cljs.core.__destructure_map(map__100824);
var not_matched_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100824__$1,new cljs.core.Keyword(null,"not-matched-handler","not-matched-handler",1162926887));
var all_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100824__$1,new cljs.core.Keyword(null,"all-handler","all-handler",396726950));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100824__$1,new cljs.core.Keyword(null,"target","target",253001721));
var keycode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100824__$1,new cljs.core.Keyword(null,"keycode?","keycode?",1611892012),true);
return frontend.mixins.listen(state,(function (){var or__5002__auto__ = target;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return window;
}
})(),"keydown",(function (e){
var key = (cljs.core.truth_(keycode_QMARK_)?e.keyCode:e.key);
var temp__5802__auto___100842 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(keycode_map,key);
if(cljs.core.truth_(temp__5802__auto___100842)){
var f_100843 = temp__5802__auto___100842;
(f_100843.cljs$core$IFn$_invoke$arity$2 ? f_100843.cljs$core$IFn$_invoke$arity$2(state,e) : f_100843.call(null,state,e));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = not_matched_handler;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(not_matched_handler);
} else {
return and__5000__auto__;
}
})())){
(not_matched_handler.cljs$core$IFn$_invoke$arity$2 ? not_matched_handler.cljs$core$IFn$_invoke$arity$2(e,key) : not_matched_handler.call(null,e,key));
} else {
}
}

if(cljs.core.truth_((function (){var and__5000__auto__ = all_handler;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(all_handler);
} else {
return and__5000__auto__;
}
})())){
return (all_handler.cljs$core$IFn$_invoke$arity$2 ? all_handler.cljs$core$IFn$_invoke$arity$2(e,key) : all_handler.call(null,e,key));
} else {
return null;
}
}));
}));

(frontend.mixins.on_key_down.cljs$lang$maxFixedArity = 3);

frontend.mixins.event_mixin = (function frontend$mixins$event_mixin(var_args){
var G__100826 = arguments.length;
switch (G__100826) {
case 1:
return frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1 = (function (attach_listeners){
return frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$2(attach_listeners,cljs.core.identity);
}));

(frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$2 = (function (attach_listeners,init_callback){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.mixins.event_handler_mixin,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state,_props){
return (init_callback.cljs$core$IFn$_invoke$arity$1 ? init_callback.cljs$core$IFn$_invoke$arity$1(state) : init_callback.call(null,state));
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
(attach_listeners.cljs$core$IFn$_invoke$arity$1 ? attach_listeners.cljs$core$IFn$_invoke$arity$1(state) : attach_listeners.call(null,state));

return state;
})], null)], 0));
}));

(frontend.mixins.event_mixin.cljs$lang$maxFixedArity = 2);

frontend.mixins.modal = (function frontend$mixins$modal(k){
return frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$2((function (state){
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = open_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(open_QMARK_);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reset_BANG_(open_QMARK_,false);
} else {
return null;
}
})], 0));
}),(function (state){
var open_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var component = new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.add_watch(open_QMARK_,new cljs.core.Keyword("frontend.mixins","open","frontend.mixins/open",396960498),(function (_,___$1,___$2,___$3){
return rum.core.request_render(component);
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword(null,"open?","open?",1238443125),open_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"close-fn","close-fn",-1779772512),(function (){
return cljs.core.reset_BANG_(open_QMARK_,false);
}),new cljs.core.Keyword(null,"open-fn","open-fn",1265855718),(function (){
return cljs.core.reset_BANG_(open_QMARK_,true);
}),new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(open_QMARK_,cljs.core.not);
})], 0));
}));
});
/**
 * Notice: the first parameter needs to be a `config` with `id`, optional `sidebar?`, `whiteboard?`
 */
frontend.mixins.container_id = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var config = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var key = cljs.core.select_keys(config,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),new cljs.core.Keyword(null,"embed?","embed?",-922305920),new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951),new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.Keyword(null,"current-block","current-block",1027687970),new cljs.core.Keyword(null,"table?","table?",-1064705406)], null));
var container_id = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_container_id(key);
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id);
})], null);
/**
 * Does performance measurements in development.
 */
frontend.mixins.perf_measure_mixin = (function frontend$mixins$perf_measure_mixin(desc){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"wrap-render","wrap-render",1782000986),(function frontend$mixins$perf_measure_mixin_$_wrap_render(render_fn){
return (function (state){
if(cljs.core.truth_(goog.DEBUG)){
var k__99485__auto__ = ["Render ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(desc)].join('');
console.time(k__99485__auto__);

var res__99486__auto__ = (render_fn.cljs$core$IFn$_invoke$arity$1 ? render_fn.cljs$core$IFn$_invoke$arity$1(state) : render_fn.call(null,state));
console.timeEnd(k__99485__auto__);

return res__99486__auto__;
} else {
return (render_fn.cljs$core$IFn$_invoke$arity$1 ? render_fn.cljs$core$IFn$_invoke$arity$1(state) : render_fn.call(null,state));
}
});
})], null);
});

//# sourceMappingURL=frontend.mixins.js.map
