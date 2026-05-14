goog.provide('rum.core');
goog.scope(function(){
  rum.core.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$react_dom$client=shadow.js.require("module$node_modules$react_dom$client", {});
/**
 * Given React component, returns Rum state associated with it.
 */
rum.core.state = (function rum$core$state(comp){
return rum.core.goog$module$goog$object.get(comp.state,":rum/state");
});
rum.core.extend_BANG_ = (function rum$core$extend_BANG_(obj,props){
var seq__72292 = cljs.core.seq(props);
var chunk__72294 = null;
var count__72295 = (0);
var i__72296 = (0);
while(true){
if((i__72296 < count__72295)){
var vec__72312 = chunk__72294.cljs$core$IIndexed$_nth$arity$2(null,i__72296);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72312,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72312,(1),null);
if((!((v == null)))){
rum.core.goog$module$goog$object.set(obj,cljs.core.name(k),cljs.core.clj__GT_js(v));


var G__72519 = seq__72292;
var G__72520 = chunk__72294;
var G__72521 = count__72295;
var G__72522 = (i__72296 + (1));
seq__72292 = G__72519;
chunk__72294 = G__72520;
count__72295 = G__72521;
i__72296 = G__72522;
continue;
} else {
var G__72523 = seq__72292;
var G__72524 = chunk__72294;
var G__72525 = count__72295;
var G__72526 = (i__72296 + (1));
seq__72292 = G__72523;
chunk__72294 = G__72524;
count__72295 = G__72525;
i__72296 = G__72526;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__72292);
if(temp__5804__auto__){
var seq__72292__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__72292__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__72292__$1);
var G__72527 = cljs.core.chunk_rest(seq__72292__$1);
var G__72528 = c__5525__auto__;
var G__72529 = cljs.core.count(c__5525__auto__);
var G__72530 = (0);
seq__72292 = G__72527;
chunk__72294 = G__72528;
count__72295 = G__72529;
i__72296 = G__72530;
continue;
} else {
var vec__72323 = cljs.core.first(seq__72292__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72323,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72323,(1),null);
if((!((v == null)))){
rum.core.goog$module$goog$object.set(obj,cljs.core.name(k),cljs.core.clj__GT_js(v));


var G__72531 = cljs.core.next(seq__72292__$1);
var G__72532 = null;
var G__72533 = (0);
var G__72534 = (0);
seq__72292 = G__72531;
chunk__72294 = G__72532;
count__72295 = G__72533;
i__72296 = G__72534;
continue;
} else {
var G__72536 = cljs.core.next(seq__72292__$1);
var G__72537 = null;
var G__72538 = (0);
var G__72539 = (0);
seq__72292 = G__72536;
chunk__72294 = G__72537;
count__72295 = G__72538;
i__72296 = G__72539;
continue;
}
}
} else {
return null;
}
}
break;
}
});
rum.core.build_class = (function rum$core$build_class(render,mixins,display_name){
if(goog.DEBUG){
var mixins_72541__$1 = cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.keys,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([mixins], 0)));
if(clojure.set.subset_QMARK_(mixins_72541__$1,rum.specs.mixins)){
} else {
throw (new Error(["Assert failed: ",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(display_name)," declares invalid mixin keys ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(mixins_72541__$1,rum.specs.mixins)),", ","did you mean one of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rum.specs.mixins)].join(''),"\n","(set/subset? mixins rum.specs/mixins)"].join('')));
}

cljs.core.run_BANG_((function (p1__72328_SHARP_){
return console.warn(p1__72328_SHARP_);
}),cljs.core.vals(cljs.core.select_keys(rum.specs.deprecated_mixins,mixins_72541__$1)));
} else {
}

var init = rum.util.collect(new cljs.core.Keyword(null,"init","init",-1875481434),mixins);
var before_render = rum.util.collect_STAR_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),new cljs.core.Keyword("unsafe","will-mount","unsafe/will-mount",265089051),new cljs.core.Keyword(null,"before-render","before-render",71256781)], null),mixins);
var render__$1 = render;
var wrap_render = rum.util.collect(new cljs.core.Keyword(null,"wrap-render","wrap-render",1782000986),mixins);
var wrapped_render = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__72331_SHARP_,p2__72330_SHARP_){
return (p2__72330_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p2__72330_SHARP_.cljs$core$IFn$_invoke$arity$1(p1__72331_SHARP_) : p2__72330_SHARP_.call(null,p1__72331_SHARP_));
}),render__$1,wrap_render);
var did_mount = rum.util.collect_STAR_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),new cljs.core.Keyword(null,"after-render","after-render",1997533433)], null),mixins);
var will_remount = rum.util.collect_STAR_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"did-remount","did-remount",1362550500),new cljs.core.Keyword(null,"will-remount","will-remount",-141604325)], null),mixins);
var should_update = rum.util.collect(new cljs.core.Keyword(null,"should-update","should-update",-1292781795),mixins);
var before_update = rum.util.collect_STAR_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"will-update","will-update",328062998),new cljs.core.Keyword("unsafe","will-update","unsafe/will-update",1505013232),new cljs.core.Keyword(null,"before-render","before-render",71256781)], null),mixins);
var did_update = rum.util.collect_STAR_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"did-update","did-update",-2143702256),new cljs.core.Keyword(null,"after-render","after-render",1997533433)], null),mixins);
var did_catch = rum.util.collect(new cljs.core.Keyword(null,"did-catch","did-catch",2139522313),mixins);
var will_unmount = rum.util.collect(new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),mixins);
var child_context = rum.util.collect(new cljs.core.Keyword(null,"child-context","child-context",-1375270295),mixins);
var class_props = cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,rum.util.collect(new cljs.core.Keyword(null,"class-properties","class-properties",1351279702),mixins));
var static_props = cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,rum.util.collect(new cljs.core.Keyword(null,"static-properties","static-properties",-577838503),mixins));
var ctor = (function (props){
var this$ = this;
rum.core.goog$module$goog$object.set(this$,"state",({":rum/state": cljs.core.volatile_BANG_(rum.util.call_all.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(rum.core.goog$module$goog$object.get(props,":rum/initial-state"),new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248),this$),init,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props], 0)))}));

return React.Component.call(this$,props);
});
var _ = goog.inherits(ctor,React.Component);
var prototype = rum.core.goog$module$goog$object.get(ctor,"prototype");
if(cljs.core.empty_QMARK_(before_render)){
} else {
rum.core.goog$module$goog$object.set(prototype,"UNSAFE_componentWillMount",(function (){
var this$ = this;
return cljs.core._vreset_BANG_(rum.core.state(this$),rum.util.call_all(cljs.core._deref(rum.core.state(this$)),before_render));
}));
}

if(cljs.core.empty_QMARK_(did_mount)){
} else {
rum.core.goog$module$goog$object.set(prototype,"componentDidMount",(function (){
var this$ = this;
return cljs.core._vreset_BANG_(rum.core.state(this$),rum.util.call_all(cljs.core._deref(rum.core.state(this$)),did_mount));
}));
}

rum.core.goog$module$goog$object.set(prototype,"UNSAFE_componentWillReceiveProps",(function (next_props){
var this$ = this;
var old_state = cljs.core.deref(rum.core.state(this$));
var state = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_state,rum.core.goog$module$goog$object.get(next_props,":rum/initial-state")], 0));
var next_state = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__72335_SHARP_,p2__72334_SHARP_){
return (p2__72334_SHARP_.cljs$core$IFn$_invoke$arity$2 ? p2__72334_SHARP_.cljs$core$IFn$_invoke$arity$2(old_state,p1__72335_SHARP_) : p2__72334_SHARP_.call(null,old_state,p1__72335_SHARP_));
}),state,will_remount);
return this$.setState(({":rum/state": cljs.core.volatile_BANG_(next_state)}));
}));

if(cljs.core.empty_QMARK_(should_update)){
} else {
rum.core.goog$module$goog$object.set(prototype,"shouldComponentUpdate",(function (next_props,next_state){
var this$ = this;
var old_state = cljs.core.deref(rum.core.state(this$));
var new_state = cljs.core.deref(rum.core.goog$module$goog$object.get(next_state,":rum/state"));
var or__5002__auto__ = cljs.core.some((function (p1__72338_SHARP_){
return (p1__72338_SHARP_.cljs$core$IFn$_invoke$arity$2 ? p1__72338_SHARP_.cljs$core$IFn$_invoke$arity$2(old_state,new_state) : p1__72338_SHARP_.call(null,old_state,new_state));
}),should_update);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
}));
}

if(cljs.core.empty_QMARK_(before_update)){
} else {
rum.core.goog$module$goog$object.set(prototype,"UNSAFE_componentWillUpdate",(function (___$1,next_state){
var this$ = this;
var new_state = rum.core.goog$module$goog$object.get(next_state,":rum/state");
return cljs.core._vreset_BANG_(new_state,rum.util.call_all(cljs.core._deref(new_state),before_update));
}));
}

rum.core.goog$module$goog$object.set(prototype,"render",(function (){
var this$ = this;
var state = rum.core.state(this$);
var vec__72347 = (function (){var G__72350 = cljs.core.deref(state);
return (wrapped_render.cljs$core$IFn$_invoke$arity$1 ? wrapped_render.cljs$core$IFn$_invoke$arity$1(G__72350) : wrapped_render.call(null,G__72350));
})();
var dom = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72347,(0),null);
var next_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72347,(1),null);
cljs.core.vreset_BANG_(state,next_state);

return dom;
}));

if(cljs.core.empty_QMARK_(did_update)){
} else {
rum.core.goog$module$goog$object.set(prototype,"componentDidUpdate",(function (___$1,___$2){
var this$ = this;
return cljs.core._vreset_BANG_(rum.core.state(this$),rum.util.call_all(cljs.core._deref(rum.core.state(this$)),did_update));
}));
}

if(cljs.core.empty_QMARK_(did_catch)){
} else {
rum.core.goog$module$goog$object.set(prototype,"componentDidCatch",(function (error,info){
var this$ = this;
cljs.core._vreset_BANG_(rum.core.state(this$),rum.util.call_all.cljs$core$IFn$_invoke$arity$variadic(cljs.core._deref(rum.core.state(this$)),did_catch,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([error,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","component-stack","rum/component-stack",2037541138),rum.core.goog$module$goog$object.get(info,"componentStack")], null)], 0)));

return this$.forceUpdate();
}));
}

rum.core.goog$module$goog$object.set(prototype,"componentWillUnmount",(function (){
var this$ = this;
if(cljs.core.empty_QMARK_(will_unmount)){
} else {
cljs.core._vreset_BANG_(rum.core.state(this$),rum.util.call_all(cljs.core._deref(rum.core.state(this$)),will_unmount));
}

return rum.core.goog$module$goog$object.set(this$,":rum/unmounted?",true);
}));

if(cljs.core.empty_QMARK_(child_context)){
} else {
rum.core.goog$module$goog$object.set(prototype,"getChildContext",(function (){
var this$ = this;
var state = cljs.core.deref(rum.core.state(this$));
return cljs.core.clj__GT_js(cljs.core.transduce.cljs$core$IFn$_invoke$arity$4(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__72341_SHARP_){
return (p1__72341_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__72341_SHARP_.cljs$core$IFn$_invoke$arity$1(state) : p1__72341_SHARP_.call(null,state));
})),cljs.core.merge,cljs.core.PersistentArrayMap.EMPTY,child_context));
}));
}

rum.core.extend_BANG_(prototype,class_props);

rum.core.goog$module$goog$object.set(ctor,"displayName",display_name);

rum.core.extend_BANG_(ctor,static_props);

return ctor;
});
rum.core.set_meta_BANG_ = (function rum$core$set_meta_BANG_(c){
var f = (function (){
var ctr = (c.cljs$core$IFn$_invoke$arity$0 ? c.cljs$core$IFn$_invoke$arity$0() : c.call(null));
return ctr.apply(ctr,arguments);
});
var x72355_72551 = f;
(x72355_72551.cljs$core$IMeta$ = cljs.core.PROTOCOL_SENTINEL);

(x72355_72551.cljs$core$IMeta$_meta$arity$1 = (function (_){
var ___$1 = this;
return cljs.core.meta((c.cljs$core$IFn$_invoke$arity$0 ? c.cljs$core$IFn$_invoke$arity$0() : c.call(null)));
}));


return f;
});
/**
 * Wraps component construction in a way so that Google Closure Compiler
 * can properly recognize and elide unused components. The extra `set-meta`
 * fn is needed so that the compiler can properly detect that all functions
 * are side effect free.
 */
rum.core.lazy_build = (function rum$core$lazy_build(ctor,render,mixins,display_name){
var bf = (function (){
return (ctor.cljs$core$IFn$_invoke$arity$3 ? ctor.cljs$core$IFn$_invoke$arity$3(render,mixins,display_name) : ctor.call(null,render,mixins,display_name));
});
var c = goog.functions.cacheReturnValue(bf);
return rum.core.set_meta_BANG_(c);
});
rum.core.build_ctor = (function rum$core$build_ctor(render,mixins,display_name){
var class$ = rum.core.build_class(render,mixins,display_name);
var key_fn = cljs.core.first(rum.util.collect(new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),mixins));
var ctor = (((!((key_fn == null))))?(function() { 
var G__72552__delegate = function (args){
var props = ({":rum/initial-state": new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","args","rum/args",1315791754),args], null), "key": cljs.core.apply.cljs$core$IFn$_invoke$arity$2(key_fn,args)});
return React.createElement(class$,props);
};
var G__72552 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__72554__i = 0, G__72554__a = new Array(arguments.length -  0);
while (G__72554__i < G__72554__a.length) {G__72554__a[G__72554__i] = arguments[G__72554__i + 0]; ++G__72554__i;}
  args = new cljs.core.IndexedSeq(G__72554__a,0,null);
} 
return G__72552__delegate.call(this,args);};
G__72552.cljs$lang$maxFixedArity = 0;
G__72552.cljs$lang$applyTo = (function (arglist__72555){
var args = cljs.core.seq(arglist__72555);
return G__72552__delegate(args);
});
G__72552.cljs$core$IFn$_invoke$arity$variadic = G__72552__delegate;
return G__72552;
})()
:(function() { 
var G__72556__delegate = function (args){
var props = ({":rum/initial-state": new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","args","rum/args",1315791754),args], null)});
return React.createElement(class$,props);
};
var G__72556 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__72557__i = 0, G__72557__a = new Array(arguments.length -  0);
while (G__72557__i < G__72557__a.length) {G__72557__a[G__72557__i] = arguments[G__72557__i + 0]; ++G__72557__i;}
  args = new cljs.core.IndexedSeq(G__72557__a,0,null);
} 
return G__72556__delegate.call(this,args);};
G__72556.cljs$lang$maxFixedArity = 0;
G__72556.cljs$lang$applyTo = (function (arglist__72558){
var args = cljs.core.seq(arglist__72558);
return G__72556__delegate(args);
});
G__72556.cljs$core$IFn$_invoke$arity$variadic = G__72556__delegate;
return G__72556;
})()
);
return cljs.core.with_meta(ctor,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","class","rum/class",-2030775258),class$], null));
});
rum.core.memo_compare_props = (function rum$core$memo_compare_props(prev_props,next_props){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((prev_props[":rum/args"]),(next_props[":rum/args"]));
});
rum.core.react_memo = (function rum$core$react_memo(f){
var temp__5806__auto__ = React.memo;
if((temp__5806__auto__ == null)){
return f;
} else {
var memo = temp__5806__auto__;
return (memo.cljs$core$IFn$_invoke$arity$2 ? memo.cljs$core$IFn$_invoke$arity$2(f,rum.core.memo_compare_props) : memo.call(null,f,rum.core.memo_compare_props));
}
});
rum.core.build_defc = (function rum$core$build_defc(render_body,mixins,display_name){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mixins,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null))){
var class$ = (function (props){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(render_body,(props[":rum/args"]));
});
var _ = (class$["displayName"] = display_name);
var memo_class = rum.core.react_memo(class$);
var ctor = (function() { 
var G__72562__delegate = function (args){
return React.createElement(memo_class,({":rum/args": args}));
};
var G__72562 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__72563__i = 0, G__72563__a = new Array(arguments.length -  0);
while (G__72563__i < G__72563__a.length) {G__72563__a[G__72563__i] = arguments[G__72563__i + 0]; ++G__72563__i;}
  args = new cljs.core.IndexedSeq(G__72563__a,0,null);
} 
return G__72562__delegate.call(this,args);};
G__72562.cljs$lang$maxFixedArity = 0;
G__72562.cljs$lang$applyTo = (function (arglist__72564){
var args = cljs.core.seq(arglist__72564);
return G__72562__delegate(args);
});
G__72562.cljs$core$IFn$_invoke$arity$variadic = G__72562__delegate;
return G__72562;
})()
;
return cljs.core.with_meta(ctor,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","class","rum/class",-2030775258),memo_class], null));
} else {
if(cljs.core.empty_QMARK_(mixins)){
var class$ = (function (props){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(render_body,(props[":rum/args"]));
});
var _ = (class$["displayName"] = display_name);
var ctor = (function() { 
var G__72568__delegate = function (args){
return React.createElement(class$,({":rum/args": args}));
};
var G__72568 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__72570__i = 0, G__72570__a = new Array(arguments.length -  0);
while (G__72570__i < G__72570__a.length) {G__72570__a[G__72570__i] = arguments[G__72570__i + 0]; ++G__72570__i;}
  args = new cljs.core.IndexedSeq(G__72570__a,0,null);
} 
return G__72568__delegate.call(this,args);};
G__72568.cljs$lang$maxFixedArity = 0;
G__72568.cljs$lang$applyTo = (function (arglist__72571){
var args = cljs.core.seq(arglist__72571);
return G__72568__delegate(args);
});
G__72568.cljs$core$IFn$_invoke$arity$variadic = G__72568__delegate;
return G__72568;
})()
;
return cljs.core.with_meta(ctor,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rum","class","rum/class",-2030775258),class$], null));
} else {
var render = (function (state){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$2(render_body,new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)),state], null);
});
return rum.core.build_ctor(render,mixins,display_name);

}
}
});
rum.core.build_defcs = (function rum$core$build_defcs(render_body,mixins,display_name){
var render = (function (state){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$3(render_body,state,new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)),state], null);
});
return rum.core.build_ctor(render,mixins,display_name);
});
rum.core.build_defcc = (function rum$core$build_defcc(render_body,mixins,display_name){
var render = (function (state){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$3(render_body,new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)),state], null);
});
return rum.core.build_ctor(render,mixins,display_name);
});
rum.core.schedule = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = (typeof window !== 'undefined');
if(and__5000__auto__){
var or__5002__auto__ = window.requestAnimationFrame;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = window.webkitRequestAnimationFrame;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = window.mozRequestAnimationFrame;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return window.msRequestAnimationFrame;
}
}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__72357_SHARP_){
return setTimeout(p1__72357_SHARP_,(16));
});
}
})();
rum.core.batch = (function (){var or__5002__auto__ = (((typeof ReactNative !== 'undefined'))?ReactNative.unstable_batchedUpdates:null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (((typeof ReactDOM !== 'undefined'))?ReactDOM.unstable_batchedUpdates:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (function (f,a){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(a) : f.call(null,a));
});
}
}
})();
rum.core.empty_queue = cljs.core.PersistentVector.EMPTY;
rum.core.render_queue = cljs.core.volatile_BANG_(rum.core.empty_queue);
rum.core.render_one = (function rum$core$render_one(comp){
if((((!((comp == null)))) && (cljs.core.not(rum.core.goog$module$goog$object.get(comp,":rum/unmounted?"))))){
return comp.forceUpdate();
} else {
return null;
}
});
rum.core.render_all = (function rum$core$render_all(queue){
return cljs.core.run_BANG_(rum.core.render_one,queue);
});
rum.core.render = (function rum$core$render(){
var queue = cljs.core.deref(rum.core.render_queue);
cljs.core.vreset_BANG_(rum.core.render_queue,rum.core.empty_queue);

return (rum.core.batch.cljs$core$IFn$_invoke$arity$2 ? rum.core.batch.cljs$core$IFn$_invoke$arity$2(rum.core.render_all,queue) : rum.core.batch.call(null,rum.core.render_all,queue));
});
rum.core.sync_update_QMARK_ = cljs.core.volatile_BANG_(false);
/**
 * Schedules react component to be rendered on next animation frame,
 *   unless the requested update happens to be in a sync-update phase.
 */
rum.core.request_render = (function rum$core$request_render(component){
if(cljs.core.truth_(cljs.core.deref(rum.core.sync_update_QMARK_))){
return rum.core.render_one(component);
} else {
if(cljs.core.empty_QMARK_(cljs.core.deref(rum.core.render_queue))){
(rum.core.schedule.cljs$core$IFn$_invoke$arity$1 ? rum.core.schedule.cljs$core$IFn$_invoke$arity$1(rum.core.render) : rum.core.schedule.call(null,rum.core.render));
} else {
}

return rum.core.render_queue.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(rum.core.render_queue.cljs$core$IDeref$_deref$arity$1(null),component));
}
});
rum.core.mark_sync_update = (function rum$core$mark_sync_update(f){
if(cljs.core.fn_QMARK_(f)){
return (function rum$core$mark_sync_update_$_wrapped_handler(e){
var _ = cljs.core.vreset_BANG_(rum.core.sync_update_QMARK_,true);
var ret = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(e) : f.call(null,e));
var ___$1 = cljs.core.vreset_BANG_(rum.core.sync_update_QMARK_,false);
return ret;
});
} else {
return f;
}
});
goog.exportSymbol('rum.core.mark_sync_update', rum.core.mark_sync_update);
/**
 * Add element to the DOM tree. Idempotent. Subsequent mounts will just update element.
 */
rum.core.mount = (function rum$core$mount(element,node){
if(cljs.core.truth_(ReactDOM.createRoot)){
if(cljs.core.truth_(node.render)){
return node.render(element);
} else {
var root = module$node_modules$react_dom$client.createRoot(node);
root.render(element);

return root;
}
} else {
ReactDOM.render(element,node);

return null;
}
});
/**
 * Removes component from the DOM tree.
 */
rum.core.unmount = (function rum$core$unmount(node){
if(cljs.core.truth_(node.unmount)){
return node.unmount();
} else {
return ReactDOM.unmountComponentAtNode(node);
}
});
/**
 * Same as [[mount]] but must be called on DOM tree already rendered by a server via [[render-html]].
 */
rum.core.hydrate = (function rum$core$hydrate(element,node){
if(cljs.core.truth_(ReactDOM.hydrateRoot)){
return module$node_modules$react_dom$client.hydrateRoot(node,element);
} else {
return ReactDOM.hydrate(element,node);
}
});
/**
 * Render `element` in a DOM `node` that is ouside of current DOM hierarchy.
 */
rum.core.portal = (function rum$core$portal(element,node){
return ReactDOM.createPortal(element,node);
});
rum.core.create_context = (function rum$core$create_context(default_value){
return React.createContext(default_value);
});
/**
 * Adds React key to element.
 * 
 * ```
 * (rum/defc label [text] [:div text])
 * 
 * (-> (label)
 *     (rum/with-key "abc")
 *     (rum/mount js/document.body))
 * ```
 */
rum.core.with_key = (function rum$core$with_key(element,key){
return React.cloneElement(element,({"key": key}),null);
});
/**
 * Adds React ref (string or callback) to element.
 * 
 * ```
 * (rum/defc label [text] [:div text])
 * 
 * (-> (label)
 *     (rum/with-ref "abc")
 *     (rum/mount js/document.body))
 * ```
 */
rum.core.with_ref = (function rum$core$with_ref(element,ref){
return React.cloneElement(element,({"ref": ref}),null);
});
/**
 * Usage of this function is discouraged. Use :ref callback instead.
 *   Given state, returns top-level DOM node of component. Call it during lifecycle callbacks. Can’t be called during render.
 */
rum.core.dom_node = (function rum$core$dom_node(state){
return ReactDOM.findDOMNode(new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state));
});
/**
 * DEPRECATED: Use :ref (fn [dom-or-nil]) callback instead. See rum issue #124
 *   Given state and ref handle, returns React component.
 */
rum.core.ref = (function rum$core$ref(state,key){
return ((new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state)["refs"])[cljs.core.name(key)]);
});
/**
 * DEPRECATED: Use :ref (fn [dom-or-nil]) callback instead. See rum issue #124
 *   Given state and ref handle, returns DOM node associated with ref.
 */
rum.core.ref_node = (function rum$core$ref_node(state,key){
return ReactDOM.findDOMNode(rum.core.ref(state,cljs.core.name(key)));
});
/**
 * Mixin. Will avoid re-render if none of component’s arguments have changed. Does equality check (`=`) on all arguments.
 * 
 * ```
 * (rum/defc label < rum/static
 *   [text]
 *   [:div text])
 * 
 * (rum/mount (label "abc") js/document.body)
 * 
 * ;; def != abc, will re-render
 * (rum/mount (label "def") js/document.body)
 * 
 * ;; def == def, won’t re-render
 * (rum/mount (label "def") js/document.body)
 * ```
 */
rum.core.static$ = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"should-update","should-update",-1292781795),(function (old_state,new_state){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state),new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state));
})], null);
/**
 * Mixin constructor. Adds an atom to component’s state that can be used to keep stuff during component’s lifecycle. Component will be re-rendered if atom’s value changes. Atom is stored under user-provided key or under `:rum/local` by default.
 * 
 * ```
 * (rum/defcs counter < (rum/local 0 :cnt)
 *   [state label]
 *   (let [*cnt (:cnt state)]
 *     [:div {:on-click (fn [_] (swap! *cnt inc))}
 *       label @*cnt]))
 * 
 * (rum/mount (counter "Click count: "))
 * ```
 */
rum.core.local = (function rum$core$local(var_args){
var G__72410 = arguments.length;
switch (G__72410) {
case 1:
return rum.core.local.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.local.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.local.cljs$core$IFn$_invoke$arity$1 = (function (initial){
return rum.core.local.cljs$core$IFn$_invoke$arity$2(initial,new cljs.core.Keyword("rum","local","rum/local",-1497916586));
}));

(rum.core.local.cljs$core$IFn$_invoke$arity$2 = (function (initial,key){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var local_state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(initial);
var component = new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.add_watch(local_state,key,(function (_,___$1,p,n){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p,n)){
return rum.core.request_render(component);
} else {
return null;
}
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,key,local_state);
})], null);
}));

(rum.core.local.cljs$lang$maxFixedArity = 2);

/**
 * Mixin. Works in conjunction with [[react]].
 * 
 * ```
 * (rum/defc comp < rum/reactive
 *   [*counter]
 *   [:div (rum/react counter)])
 * 
 * (def *counter (atom 0))
 * (rum/mount (comp *counter) js/document.body)
 * (swap! *counter inc) ;; will force comp to re-render
 * ```
 */
rum.core.reactive = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state,props){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("rum.reactive","key","rum.reactive/key",-803425142),cljs.core.random_uuid());
}),new cljs.core.Keyword(null,"wrap-render","wrap-render",1782000986),(function (render_fn){
return (function (state){
var _STAR_reactions_STAR__orig_val__72417 = rum.core._STAR_reactions_STAR_;
var _STAR_reactions_STAR__temp_val__72418 = cljs.core.volatile_BANG_(cljs.core.PersistentHashSet.EMPTY);
(rum.core._STAR_reactions_STAR_ = _STAR_reactions_STAR__temp_val__72418);

try{var comp = new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state);
var old_reactions = new cljs.core.Keyword("rum.reactive","refs","rum.reactive/refs",-814076325).cljs$core$IFn$_invoke$arity$2(state,cljs.core.PersistentHashSet.EMPTY);
var vec__72419 = (render_fn.cljs$core$IFn$_invoke$arity$1 ? render_fn.cljs$core$IFn$_invoke$arity$1(state) : render_fn.call(null,state));
var dom = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72419,(0),null);
var next_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72419,(1),null);
var new_reactions = cljs.core.deref(rum.core._STAR_reactions_STAR_);
var key = new cljs.core.Keyword("rum.reactive","key","rum.reactive/key",-803425142).cljs$core$IFn$_invoke$arity$1(state);
var seq__72422_72581 = cljs.core.seq(old_reactions);
var chunk__72423_72582 = null;
var count__72424_72583 = (0);
var i__72425_72584 = (0);
while(true){
if((i__72425_72584 < count__72424_72583)){
var ref_72586 = chunk__72423_72582.cljs$core$IIndexed$_nth$arity$2(null,i__72425_72584);
if(cljs.core.contains_QMARK_(new_reactions,ref_72586)){
} else {
cljs.core.remove_watch(ref_72586,key);
}


var G__72588 = seq__72422_72581;
var G__72589 = chunk__72423_72582;
var G__72590 = count__72424_72583;
var G__72591 = (i__72425_72584 + (1));
seq__72422_72581 = G__72588;
chunk__72423_72582 = G__72589;
count__72424_72583 = G__72590;
i__72425_72584 = G__72591;
continue;
} else {
var temp__5804__auto___72592 = cljs.core.seq(seq__72422_72581);
if(temp__5804__auto___72592){
var seq__72422_72593__$1 = temp__5804__auto___72592;
if(cljs.core.chunked_seq_QMARK_(seq__72422_72593__$1)){
var c__5525__auto___72595 = cljs.core.chunk_first(seq__72422_72593__$1);
var G__72596 = cljs.core.chunk_rest(seq__72422_72593__$1);
var G__72597 = c__5525__auto___72595;
var G__72598 = cljs.core.count(c__5525__auto___72595);
var G__72599 = (0);
seq__72422_72581 = G__72596;
chunk__72423_72582 = G__72597;
count__72424_72583 = G__72598;
i__72425_72584 = G__72599;
continue;
} else {
var ref_72600 = cljs.core.first(seq__72422_72593__$1);
if(cljs.core.contains_QMARK_(new_reactions,ref_72600)){
} else {
cljs.core.remove_watch(ref_72600,key);
}


var G__72602 = cljs.core.next(seq__72422_72593__$1);
var G__72603 = null;
var G__72604 = (0);
var G__72605 = (0);
seq__72422_72581 = G__72602;
chunk__72423_72582 = G__72603;
count__72424_72583 = G__72604;
i__72425_72584 = G__72605;
continue;
}
} else {
}
}
break;
}

var seq__72430_72606 = cljs.core.seq(new_reactions);
var chunk__72431_72607 = null;
var count__72432_72608 = (0);
var i__72433_72609 = (0);
while(true){
if((i__72433_72609 < count__72432_72608)){
var ref_72610 = chunk__72431_72607.cljs$core$IIndexed$_nth$arity$2(null,i__72433_72609);
if(cljs.core.contains_QMARK_(old_reactions,ref_72610)){
} else {
cljs.core.add_watch(ref_72610,key,((function (seq__72430_72606,chunk__72431_72607,count__72432_72608,i__72433_72609,ref_72610,comp,old_reactions,vec__72419,dom,next_state,new_reactions,key,_STAR_reactions_STAR__orig_val__72417,_STAR_reactions_STAR__temp_val__72418){
return (function (_,___$1,p,n){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p,n)){
return rum.core.request_render(comp);
} else {
return null;
}
});})(seq__72430_72606,chunk__72431_72607,count__72432_72608,i__72433_72609,ref_72610,comp,old_reactions,vec__72419,dom,next_state,new_reactions,key,_STAR_reactions_STAR__orig_val__72417,_STAR_reactions_STAR__temp_val__72418))
);
}


var G__72611 = seq__72430_72606;
var G__72612 = chunk__72431_72607;
var G__72613 = count__72432_72608;
var G__72614 = (i__72433_72609 + (1));
seq__72430_72606 = G__72611;
chunk__72431_72607 = G__72612;
count__72432_72608 = G__72613;
i__72433_72609 = G__72614;
continue;
} else {
var temp__5804__auto___72615 = cljs.core.seq(seq__72430_72606);
if(temp__5804__auto___72615){
var seq__72430_72616__$1 = temp__5804__auto___72615;
if(cljs.core.chunked_seq_QMARK_(seq__72430_72616__$1)){
var c__5525__auto___72617 = cljs.core.chunk_first(seq__72430_72616__$1);
var G__72618 = cljs.core.chunk_rest(seq__72430_72616__$1);
var G__72619 = c__5525__auto___72617;
var G__72620 = cljs.core.count(c__5525__auto___72617);
var G__72621 = (0);
seq__72430_72606 = G__72618;
chunk__72431_72607 = G__72619;
count__72432_72608 = G__72620;
i__72433_72609 = G__72621;
continue;
} else {
var ref_72623 = cljs.core.first(seq__72430_72616__$1);
if(cljs.core.contains_QMARK_(old_reactions,ref_72623)){
} else {
cljs.core.add_watch(ref_72623,key,((function (seq__72430_72606,chunk__72431_72607,count__72432_72608,i__72433_72609,ref_72623,seq__72430_72616__$1,temp__5804__auto___72615,comp,old_reactions,vec__72419,dom,next_state,new_reactions,key,_STAR_reactions_STAR__orig_val__72417,_STAR_reactions_STAR__temp_val__72418){
return (function (_,___$1,p,n){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p,n)){
return rum.core.request_render(comp);
} else {
return null;
}
});})(seq__72430_72606,chunk__72431_72607,count__72432_72608,i__72433_72609,ref_72623,seq__72430_72616__$1,temp__5804__auto___72615,comp,old_reactions,vec__72419,dom,next_state,new_reactions,key,_STAR_reactions_STAR__orig_val__72417,_STAR_reactions_STAR__temp_val__72418))
);
}


var G__72626 = cljs.core.next(seq__72430_72616__$1);
var G__72627 = null;
var G__72628 = (0);
var G__72629 = (0);
seq__72430_72606 = G__72626;
chunk__72431_72607 = G__72627;
count__72432_72608 = G__72628;
i__72433_72609 = G__72629;
continue;
}
} else {
}
}
break;
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [dom,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(next_state,new cljs.core.Keyword("rum.reactive","refs","rum.reactive/refs",-814076325),new_reactions)], null);
}finally {(rum.core._STAR_reactions_STAR_ = _STAR_reactions_STAR__orig_val__72417);
}});
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var key_72631 = new cljs.core.Keyword("rum.reactive","key","rum.reactive/key",-803425142).cljs$core$IFn$_invoke$arity$1(state);
var seq__72438_72632 = cljs.core.seq(new cljs.core.Keyword("rum.reactive","refs","rum.reactive/refs",-814076325).cljs$core$IFn$_invoke$arity$1(state));
var chunk__72439_72633 = null;
var count__72440_72634 = (0);
var i__72441_72635 = (0);
while(true){
if((i__72441_72635 < count__72440_72634)){
var ref_72636 = chunk__72439_72633.cljs$core$IIndexed$_nth$arity$2(null,i__72441_72635);
cljs.core.remove_watch(ref_72636,key_72631);


var G__72637 = seq__72438_72632;
var G__72638 = chunk__72439_72633;
var G__72639 = count__72440_72634;
var G__72640 = (i__72441_72635 + (1));
seq__72438_72632 = G__72637;
chunk__72439_72633 = G__72638;
count__72440_72634 = G__72639;
i__72441_72635 = G__72640;
continue;
} else {
var temp__5804__auto___72641 = cljs.core.seq(seq__72438_72632);
if(temp__5804__auto___72641){
var seq__72438_72642__$1 = temp__5804__auto___72641;
if(cljs.core.chunked_seq_QMARK_(seq__72438_72642__$1)){
var c__5525__auto___72643 = cljs.core.chunk_first(seq__72438_72642__$1);
var G__72644 = cljs.core.chunk_rest(seq__72438_72642__$1);
var G__72645 = c__5525__auto___72643;
var G__72646 = cljs.core.count(c__5525__auto___72643);
var G__72647 = (0);
seq__72438_72632 = G__72644;
chunk__72439_72633 = G__72645;
count__72440_72634 = G__72646;
i__72441_72635 = G__72647;
continue;
} else {
var ref_72648 = cljs.core.first(seq__72438_72642__$1);
cljs.core.remove_watch(ref_72648,key_72631);


var G__72649 = cljs.core.next(seq__72438_72642__$1);
var G__72650 = null;
var G__72651 = (0);
var G__72652 = (0);
seq__72438_72632 = G__72649;
chunk__72439_72633 = G__72650;
count__72440_72634 = G__72651;
i__72441_72635 = G__72652;
continue;
}
} else {
}
}
break;
}

return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("rum.reactive","refs","rum.reactive/refs",-814076325),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("rum.reactive","key","rum.reactive/key",-803425142)], 0));
})], null);
/**
 * Works in conjunction with [[reactive]] mixin. Use this function instead of `deref` inside render, and your component will subscribe to changes happening to the derefed atom.
 */
rum.core.react = (function rum$core$react(ref){
if(cljs.core.truth_(rum.core._STAR_reactions_STAR_)){
} else {
throw (new Error(["Assert failed: ","rum.core/react is only supported in conjunction with rum.core/reactive","\n","*reactions*"].join('')));
}

cljs.core._vreset_BANG_(rum.core._STAR_reactions_STAR_,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core._deref(rum.core._STAR_reactions_STAR_),ref));

return cljs.core.deref(ref);
});
/**
 * Use this to create “chains” and acyclic graphs of dependent atoms.
 * 
 *           [[derived-atom]] will:
 * 
 *           - Take N “source” refs.
 *           - Set up a watch on each of them.
 *           - Create “sink” atom.
 *           - When any of source refs changes:
 *              - re-run function `f`, passing N dereferenced values of source refs.
 *              - `reset!` result of `f` to the sink atom.
 *           - Return sink atom.
 * 
 *           Example:
 * 
 *           ```
 *           (def *a (atom 0))
 *           (def *b (atom 1))
 *           (def *x (derived-atom [*a *b] ::key
 *                     (fn [a b]
 *                       (str a ":" b))))
 * 
 *           (type *x)  ;; => clojure.lang.Atom
 *           (deref *x) ;; => "0:1"
 * 
 *           (swap! *a inc)
 *           (deref *x) ;; => "1:1"
 * 
 *           (reset! *b 7)
 *           (deref *x) ;; => "1:7"
 *           ```
 * 
 *           Arguments:
 * 
 *           - `refs` - sequence of source refs,
 *           - `key`  - unique key to register watcher, same as in `clojure.core/add-watch`,
 *           - `f`    - function that must accept N arguments (same as number of source refs) and return a value to be written to the sink ref. Note: `f` will be called with already dereferenced values,
 *           - `opts` - optional. Map of:
 *             - `:ref` - use this as sink ref. By default creates new atom,
 *             - `:check-equals?` - Defaults to `true`. If equality check should be run on each source update: `(= @sink (f new-vals))`. When result of recalculating `f` equals to the old value, `reset!` won’t be called. Set to `false` if checking for equality can be expensive.
 */
rum.core.derived_atom = rum.derived_atom.derived_atom;
/**
 * Given atom with deep nested value and path inside it, creates an atom-like structure
 * that can be used separately from main atom, but will sync changes both ways:
 * 
 * ```
 * (def db (atom { :users { "Ivan" { :age 30 }}}))
 * 
 * (def ivan (rum/cursor db [:users "Ivan"]))
 * (deref ivan) ;; => { :age 30 }
 * 
 * (swap! ivan update :age inc) ;; => { :age 31 }
 * (deref db) ;; => { :users { "Ivan" { :age 31 }}}
 * 
 * (swap! db update-in [:users "Ivan" :age] inc)
 * ;; => { :users { "Ivan" { :age 32 }}}
 * 
 * (deref ivan) ;; => { :age 32 }
 * ```
 * 
 * Returned value supports `deref`, `swap!`, `reset!`, watches and metadata.
 * 
 * The only supported option is `:meta`
 */
rum.core.cursor_in = (function rum$core$cursor_in(var_args){
var args__5732__auto__ = [];
var len__5726__auto___72655 = arguments.length;
var i__5727__auto___72656 = (0);
while(true){
if((i__5727__auto___72656 < len__5726__auto___72655)){
args__5732__auto__.push((arguments[i__5727__auto___72656]));

var G__72657 = (i__5727__auto___72656 + (1));
i__5727__auto___72656 = G__72657;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return rum.core.cursor_in.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(rum.core.cursor_in.cljs$core$IFn$_invoke$arity$variadic = (function (ref,path,p__72457){
var map__72458 = p__72457;
var map__72458__$1 = cljs.core.__destructure_map(map__72458);
var options = map__72458__$1;
if((ref instanceof rum.cursor.Cursor)){
return (new rum.cursor.Cursor(ref.ref,cljs.core.into.cljs$core$IFn$_invoke$arity$2(ref.path,path),new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(options)));
} else {
return (new rum.cursor.Cursor(ref,path,new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(options)));
}
}));

(rum.core.cursor_in.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(rum.core.cursor_in.cljs$lang$applyTo = (function (seq72450){
var G__72451 = cljs.core.first(seq72450);
var seq72450__$1 = cljs.core.next(seq72450);
var G__72452 = cljs.core.first(seq72450__$1);
var seq72450__$2 = cljs.core.next(seq72450__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__72451,G__72452,seq72450__$2);
}));

/**
 * Same as [[cursor-in]] but accepts single key instead of path vector.
 */
rum.core.cursor = (function rum$core$cursor(var_args){
var args__5732__auto__ = [];
var len__5726__auto___72660 = arguments.length;
var i__5727__auto___72661 = (0);
while(true){
if((i__5727__auto___72661 < len__5726__auto___72660)){
args__5732__auto__.push((arguments[i__5727__auto___72661]));

var G__72662 = (i__5727__auto___72661 + (1));
i__5727__auto___72661 = G__72662;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return rum.core.cursor.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(rum.core.cursor.cljs$core$IFn$_invoke$arity$variadic = (function (ref,key,options){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(rum.core.cursor_in,ref,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [key], null),options);
}));

(rum.core.cursor.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(rum.core.cursor.cljs$lang$applyTo = (function (seq72463){
var G__72464 = cljs.core.first(seq72463);
var seq72463__$1 = cljs.core.next(seq72463);
var G__72465 = cljs.core.first(seq72463__$1);
var seq72463__$2 = cljs.core.next(seq72463__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__72464,G__72465,seq72463__$2);
}));

/**
 * Takes initial value or value returning fn and returns a tuple of [value set-value!],
 *   where `value` is current state value and `set-value!` is a function that schedules re-render.
 * 
 *   (let [[value set-state!] (rum/use-state 0)]
 *  [:button {:on-click #(set-state! (inc value))}
 *    value])
 */
rum.core.use_state = (function rum$core$use_state(value_or_fn){
return React.useState(value_or_fn);
});
/**
 * Takes reducing function and initial state value.
 *   Returns a tuple of [value dispatch!], where `value` is current state value and `dispatch` is a function that schedules re-render.
 * 
 *   (defmulti value-reducer (fn [value event] event))
 * 
 *   (defmethod value-reducer :inc [value _]
 *  (inc value))
 * 
 *   (let [[value dispatch!] (rum/use-reducer value-reducer 0)]
 *  [:button {:on-click #(dispatch! :inc)}
 *    value])
 * 
 *   Read more at https://reactjs.org/docs/hooks-reference.html#usereducer
 */
rum.core.use_reducer = (function rum$core$use_reducer(reducer_fn,initial_value){
return React.useReducer((function (p1__72466_SHARP_,p2__72467_SHARP_){
return (reducer_fn.cljs$core$IFn$_invoke$arity$2 ? reducer_fn.cljs$core$IFn$_invoke$arity$2(p1__72466_SHARP_,p2__72467_SHARP_) : reducer_fn.call(null,p1__72466_SHARP_,p2__72467_SHARP_));
}),initial_value,cljs.core.identity);
});
/**
 * Takes setup-fn that executes either on the first render or after every update.
 *   The function may return cleanup-fn to cleanup the effect, either before unmount or before every next update.
 *   Calling behavior is controlled by deps argument.
 * 
 *   (rum/use-effect!
 *  (fn []
 *    (.addEventListener js/window "load" handler)
 *    #(.removeEventListener js/window "load" handler))
 *  []) ;; empty deps collection instructs React to run setup-fn only once on initial render
 *      ;; and cleanup-fn only once before unmounting
 * 
 *   Read more at https://reactjs.org/docs/hooks-effect.html
 */
rum.core.use_effect_BANG_ = (function rum$core$use_effect_BANG_(var_args){
var G__72473 = arguments.length;
switch (G__72473) {
case 1:
return rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (setup_fn){
return React.useEffect((function (){
var or__5002__auto__ = (setup_fn.cljs$core$IFn$_invoke$arity$0 ? setup_fn.cljs$core$IFn$_invoke$arity$0() : setup_fn.call(null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return undefined;
}
}));
}));

(rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (setup_fn,deps){
return React.useEffect((function (){
var or__5002__auto__ = (setup_fn.cljs$core$IFn$_invoke$arity$0 ? setup_fn.cljs$core$IFn$_invoke$arity$0() : setup_fn.call(null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return undefined;
}
}),((cljs.core.array_QMARK_(deps))?deps:cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(deps)));
}));

(rum.core.use_effect_BANG_.cljs$lang$maxFixedArity = 2);

/**
 * (rum/use-layout-effect!
 *  (fn []
 *    (.addEventListener js/window "load" handler)
 *    #(.removeEventListener js/window "load" handler))
 *  []) ;; empty deps collection instructs React to run setup-fn only once on initial render
 *      ;; and cleanup-fn only once before unmounting
 * 
 *   Read more at https://reactjs.org/docs/hooks-effect.html
 */
rum.core.use_layout_effect_BANG_ = (function rum$core$use_layout_effect_BANG_(var_args){
var G__72475 = arguments.length;
switch (G__72475) {
case 1:
return rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (setup_fn){
return React.useLayoutEffect((function (){
var or__5002__auto__ = (setup_fn.cljs$core$IFn$_invoke$arity$0 ? setup_fn.cljs$core$IFn$_invoke$arity$0() : setup_fn.call(null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return undefined;
}
}));
}));

(rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (setup_fn,deps){
return React.useLayoutEffect((function (){
var or__5002__auto__ = (setup_fn.cljs$core$IFn$_invoke$arity$0 ? setup_fn.cljs$core$IFn$_invoke$arity$0() : setup_fn.call(null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return undefined;
}
}),((cljs.core.array_QMARK_(deps))?deps:cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(deps)));
}));

(rum.core.use_layout_effect_BANG_.cljs$lang$maxFixedArity = 2);

/**
 * Takes callback function and returns memoized variant, memoization is done based on provided deps collection.
 * 
 *   (rum/defc button < rum/static
 *  [{:keys [on-click]} text]
 *  [:button {:on-click on-click}
 *    text])
 * 
 *   (rum/defc app [v]
 *  (let [on-click (rum/use-callback #(do-stuff v) [v])]
 *    ;; because on-click callback is memoized here based on v argument
 *    ;; the callback won't be re-created on every render, unless v changes
 *    ;; which means that underlying `button` component won't re-render wastefully
 *    [button {:on-click on-click}
 *      "press me"]))
 * 
 *   Read more at https://reactjs.org/docs/hooks-reference.html#usecallback
 */
rum.core.use_callback = (function rum$core$use_callback(var_args){
var G__72477 = arguments.length;
switch (G__72477) {
case 1:
return rum.core.use_callback.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.use_callback.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.use_callback.cljs$core$IFn$_invoke$arity$1 = (function (callback){
return React.useCallback(callback);
}));

(rum.core.use_callback.cljs$core$IFn$_invoke$arity$2 = (function (callback,deps){
return React.useCallback(callback,((cljs.core.array_QMARK_(deps))?deps:cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(deps)));
}));

(rum.core.use_callback.cljs$lang$maxFixedArity = 2);

/**
 * Takes a function, memoizes it based on provided deps collection and executes immediately returning a result.
 *   Read more at https://reactjs.org/docs/hooks-reference.html#usememo
 */
rum.core.use_memo = (function rum$core$use_memo(var_args){
var G__72493 = arguments.length;
switch (G__72493) {
case 1:
return rum.core.use_memo.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.use_memo.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.use_memo.cljs$core$IFn$_invoke$arity$1 = (function (f){
return React.useMemo(f);
}));

(rum.core.use_memo.cljs$core$IFn$_invoke$arity$2 = (function (f,deps){
return React.useMemo(f,((cljs.core.array_QMARK_(deps))?deps:cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(deps)));
}));

(rum.core.use_memo.cljs$lang$maxFixedArity = 2);

/**
 * Takes a value and puts it into a mutable container which is persisted for the full lifetime of the component.
 *   https://reactjs.org/docs/hooks-reference.html#useref
 */
rum.core.use_ref = (function rum$core$use_ref(initial_value){
return React.useRef(initial_value);
});
rum.core.create_ref = (function rum$core$create_ref(){
return React.createRef();
});
/**
 * Takes a ref returned from use-ref and returns its current value.
 */
rum.core.deref = (function rum$core$deref(ref){
return ref.current;
});
rum.core.set_ref_BANG_ = (function rum$core$set_ref_BANG_(ref,value){
return (ref.current = value);
});
/**
 * Main server-side rendering method. Given component, returns HTML string with static markup of that component.
 *   Serve that string to the browser and [[hydrate]] same Rum component over it. React will be able to reuse already existing DOM and will initialize much faster.
 *   No opts are supported at the moment.
 */
rum.core.render_html = (function rum$core$render_html(var_args){
var G__72505 = arguments.length;
switch (G__72505) {
case 1:
return rum.core.render_html.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rum.core.render_html.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.core.render_html.cljs$core$IFn$_invoke$arity$1 = (function (element){
return rum.core.render_html.cljs$core$IFn$_invoke$arity$2(element,null);
}));

(rum.core.render_html.cljs$core$IFn$_invoke$arity$2 = (function (element,opts){
if((!((cljs.core._STAR_target_STAR_ === "nodejs")))){
return ReactDOMServer.renderToString(element);
} else {
var react_dom_server = require("react-dom/server");
return react_dom_server.renderToString(element);
}
}));

(rum.core.render_html.cljs$lang$maxFixedArity = 2);

/**
 * Same as [[render-html]] but returned string has nothing React-specific.
 *   This allows Rum to be used as traditional server-side templating engine.
 */
rum.core.render_static_markup = (function rum$core$render_static_markup(src){
if((!((cljs.core._STAR_target_STAR_ === "nodejs")))){
return ReactDOMServer.renderToStaticMarkup(src);
} else {
var react_dom_server = require("react-dom/server");
return react_dom_server.renderToStaticMarkup(src);
}
});
rum.core.adapt_class_helper = (function rum$core$adapt_class_helper(type,attrs,children){
var args = [type,attrs].concat(children);
return React.createElement.apply(React,args);
});

//# sourceMappingURL=rum.core.js.map
