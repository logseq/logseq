goog.provide('logseq.shui.util');
goog.scope(function(){
  logseq.shui.util.goog$module$goog$object = goog.module.get('goog.object');
});
/**
 * @define {boolean}
 */
logseq.shui.util.NODETEST = goog.define("logseq.shui.util.NODETEST",false);
/**
 * Converts from kebab case to camel case, eg: on-click to onClick
 */
logseq.shui.util.kebab_case__GT_camel_case = (function logseq$shui$util$kebab_case__GT_camel_case(input){
var words = clojure.string.split.cljs$core$IFn$_invoke$arity$2(input,/-/);
var capitalize = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__71170_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.str,clojure.string.upper_case(cljs.core.first(p1__71170_SHARP_)),cljs.core.rest(p1__71170_SHARP_));
}),cljs.core.rest(words));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.str,cljs.core.first(words),capitalize);
});
/**
 * Stringify all the keys of a cljs hashmap and converts them
 * from kebab case to camel case. If :html-props option is specified,
 * then rename the html properties values to their dom equivalent
 * before conversion
 */
logseq.shui.util.map_keys__GT_camel_case = (function logseq$shui$util$map_keys__GT_camel_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71442 = arguments.length;
var i__5727__auto___71447 = (0);
while(true){
if((i__5727__auto___71447 < len__5726__auto___71442)){
args__5732__auto__.push((arguments[i__5727__auto___71447]));

var G__71448 = (i__5727__auto___71447 + (1));
i__5727__auto___71447 = G__71448;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.util.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.util.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic = (function (data,p__71178){
var map__71179 = p__71178;
var map__71179__$1 = cljs.core.__destructure_map(map__71179);
var html_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71179__$1,new cljs.core.Keyword(null,"html-props","html-props",-455448229));
var convert_to_camel = (function (p__71184){
var vec__71186 = p__71184;
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71186,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71186,(1),null);
var k = cljs.core.name(key);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(((!(((clojure.string.starts_with_QMARK_(k,"data-")) || (clojure.string.starts_with_QMARK_(k,"aria-"))))))?logseq.shui.util.kebab_case__GT_camel_case(k):k),value], null);
});
return clojure.walk.postwalk((function (x){
if(cljs.core.map_QMARK_(x)){
var new_map = (cljs.core.truth_(html_props)?clojure.set.rename_keys(x,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"className","className",-1983287057),new cljs.core.Keyword(null,"for","for",-1323786319),new cljs.core.Keyword(null,"htmlFor","htmlFor",-1050291720)], null)):x);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(convert_to_camel,new_map));
} else {
return x;
}
}),data);
}));

(logseq.shui.util.map_keys__GT_camel_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.util.map_keys__GT_camel_case.cljs$lang$applyTo = (function (seq71175){
var G__71176 = cljs.core.first(seq71175);
var seq71175__$1 = cljs.core.next(seq71175);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71176,seq71175__$1);
}));

logseq.shui.util.$LSUtils = (function logseq$shui$util$$LSUtils(){
return (window["LSUtils"]);
});
logseq.shui.util.dev_QMARK_ = (function (){var G__71243 = logseq.shui.util.$LSUtils();
if((G__71243 == null)){
return null;
} else {
return (G__71243["isDev"]);
}
})();
logseq.shui.util.uuid_color = (function logseq$shui$util$uuid_color(uuid_str){
var G__71265 = logseq.shui.util.$LSUtils();
var G__71265__$1 = (((G__71265 == null))?null:(G__71265["uniqolor"]));
var G__71265__$2 = (((G__71265__$1 == null))?null:cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__71265__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [uuid_str,({"saturation": [(55),(70)], "lightness": (70), "differencePoint": (60)})], null)));
if((G__71265__$2 == null)){
return null;
} else {
return (G__71265__$2["color"]);
}
});
/**
 * Returns the component path.
 */
logseq.shui.util.get_path = (function logseq$shui$util$get_path(component_name){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(component_name),/\./);
});
logseq.shui.util.adapt_class = (function logseq$shui$util$adapt_class(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71450 = arguments.length;
var i__5727__auto___71451 = (0);
while(true){
if((i__5727__auto___71451 < len__5726__auto___71450)){
args__5732__auto__.push((arguments[i__5727__auto___71451]));

var G__71452 = (i__5727__auto___71451 + (1));
i__5727__auto___71451 = G__71452;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.util.adapt_class.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.util.adapt_class.cljs$core$IFn$_invoke$arity$variadic = (function (react_class,args){
var vec__71299 = ((cljs.core.map_QMARK_(cljs.core.first(args)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(args),cljs.core.rest(args)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.EMPTY,args], null));
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71299,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71299,(1),null);
var children__$1 = (function (){var G__71303 = children;
if((G__71303 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__71303);
}
})();
var type_SHARP_ = cljs.core.first(children__$1);
var children_SHARP_ = daiquiri.interpreter.interpret(children__$1);
var children_SHARP___$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(children_SHARP_)))?cljs.core.first(children_SHARP_):children_SHARP_);
var new_children = (((((!((children_SHARP___$1 == null)))) && ((((!(cljs.core.empty_QMARK_(children__$1)))) && ((((!(cljs.core.array_QMARK_(children_SHARP___$1)))) || ((!(cljs.core.vector_QMARK_(type_SHARP_))))))))))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [children_SHARP___$1], null):children_SHARP___$1);
var vector__GT_react_elems = (function (p__71324){
var vec__71325 = p__71324;
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71325,(0),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71325,(1),null);
if(cljs.core.sequential_QMARK_(val)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,daiquiri.interpreter.interpret(val)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,val], null);
}
});
var new_options = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(vector__GT_react_elems,opts));
var react_class__$1 = (cljs.core.truth_(logseq.shui.util.dev_QMARK_)?(react_class.cljs$core$IFn$_invoke$arity$0 ? react_class.cljs$core$IFn$_invoke$arity$0() : react_class.call(null)):react_class);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(React.createElement,react_class__$1,cljs_bean.core.__GT_js(logseq.shui.util.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic(new_options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html-props","html-props",-455448229),true], 0))),new_children);
}));

(logseq.shui.util.adapt_class.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.util.adapt_class.cljs$lang$applyTo = (function (seq71289){
var G__71290 = cljs.core.first(seq71289);
var seq71289__$1 = cljs.core.next(seq71289);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71290,seq71289__$1);
}));

logseq.shui.util.use_atom_fn = (function logseq$shui$util$use_atom_fn(a,getter_fn,setter_fn){
var vec__71353 = rum.core.use_state((function (){var G__71356 = cljs.core.deref(a);
return (getter_fn.cljs$core$IFn$_invoke$arity$1 ? getter_fn.cljs$core$IFn$_invoke$arity$1(G__71356) : getter_fn.call(null,G__71356));
})());
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71353,(0),null);
var set_val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71353,(1),null);
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid());
cljs.core.add_watch(a,id,(function (_,___$1,prev_state,next_state){
var prev_value = (getter_fn.cljs$core$IFn$_invoke$arity$1 ? getter_fn.cljs$core$IFn$_invoke$arity$1(prev_state) : getter_fn.call(null,prev_state));
var next_value = (getter_fn.cljs$core$IFn$_invoke$arity$1 ? getter_fn.cljs$core$IFn$_invoke$arity$1(next_state) : getter_fn.call(null,next_state));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prev_value,next_value)){
return null;
} else {
return (set_val.cljs$core$IFn$_invoke$arity$1 ? set_val.cljs$core$IFn$_invoke$arity$1(next_value) : set_val.call(null,next_value));
}
}));

return (function (){
return cljs.core.remove_watch(a,id);
});
}),cljs.core.PersistentVector.EMPTY);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [val,(function (p1__71346_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(a,setter_fn,p1__71346_SHARP_);
})], null);
});
/**
 * (use-atom my-atom)
 */
logseq.shui.util.use_atom = (function logseq$shui$util$use_atom(a){
return logseq.shui.util.use_atom_fn(a,cljs.core.identity,(function (_,v){
return v;
}));
});
logseq.shui.util.use_mounted = (function logseq$shui$util$use_mounted(){
var _STAR_mounted = rum.core.use_ref(false);
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
rum.core.set_ref_BANG_(_STAR_mounted,true);

return (function (){
return rum.core.set_ref_BANG_(_STAR_mounted,false);
});
}),cljs.core.PersistentVector.EMPTY);

return (function (){
return rum.core.deref(_STAR_mounted);
});
});
logseq.shui.util.react__GT_rum = (function logseq$shui$util$react__GT_rum(c,static_QMARK_){
if(cljs.core.truth_(static_QMARK_)){
return (
logseq.shui.util.react__GT_rum_SINGLEQUOTE_ = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__71457__delegate = function (args){
return daiquiri.interpreter.interpret(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.shui.util.adapt_class,c,args));
};
var G__71457 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__71458__i = 0, G__71458__a = new Array(arguments.length -  0);
while (G__71458__i < G__71458__a.length) {G__71458__a[G__71458__i] = arguments[G__71458__i + 0]; ++G__71458__i;}
  args = new cljs.core.IndexedSeq(G__71458__a,0,null);
} 
return G__71457__delegate.call(this,args);};
G__71457.cljs$lang$maxFixedArity = 0;
G__71457.cljs$lang$applyTo = (function (arglist__71459){
var args = cljs.core.seq(arglist__71459);
return G__71457__delegate(args);
});
G__71457.cljs$core$IFn$_invoke$arity$variadic = G__71457__delegate;
return G__71457;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.util/react->rum'"))
;
} else {
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.shui.util.adapt_class,c);
}
});
/**
 * Returns the component by the given component name.
 */
logseq.shui.util.component_wrap = (function logseq$shui$util$component_wrap(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71460 = arguments.length;
var i__5727__auto___71461 = (0);
while(true){
if((i__5727__auto___71461 < len__5726__auto___71460)){
args__5732__auto__.push((arguments[i__5727__auto___71461]));

var G__71462 = (i__5727__auto___71461 + (1));
i__5727__auto___71461 = G__71462;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.util.component_wrap.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.util.component_wrap.cljs$core$IFn$_invoke$arity$variadic = (function (ns,name,p__71417){
var map__71418 = p__71417;
var map__71418__$1 = cljs.core.__destructure_map(map__71418);
var static_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__71418__$1,new cljs.core.Keyword(null,"static?","static?",-1639874822),false);
var path = logseq.shui.util.get_path(name);
var cp = (function (){
return logseq.shui.util.goog$module$goog$object.getValueByKeys(ns,cljs.core.clj__GT_js(path));
});
return logseq.shui.util.react__GT_rum((cljs.core.truth_(logseq.shui.util.dev_QMARK_)?cp:cp()),static_QMARK_);
}));

(logseq.shui.util.component_wrap.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.util.component_wrap.cljs$lang$applyTo = (function (seq71405){
var G__71406 = cljs.core.first(seq71405);
var seq71405__$1 = cljs.core.next(seq71405);
var G__71407 = cljs.core.first(seq71405__$1);
var seq71405__$2 = cljs.core.next(seq71405__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71406,G__71407,seq71405__$2);
}));

logseq.shui.util.lsui_wrap = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.shui.util.component_wrap,window.LSUI);
logseq.shui.util.lsui_get = (function logseq$shui$util$lsui_get(name){
if(logseq.shui.util.NODETEST){
return ({});
} else {
var G__71437 = window.LSUI;
if((G__71437 == null)){
return null;
} else {
return (G__71437[name]);
}
}
});

//# sourceMappingURL=logseq.shui.util.js.map
