goog.provide('frontend.rum');
/**
 * Converts from kebab case to camel case, eg: on-click to onClick
 */
frontend.rum.kebab_case__GT_camel_case = (function frontend$rum$kebab_case__GT_camel_case(input){
return clojure.string.replace(input,/-([a-z])/,(function (p__74093){
var vec__74094 = p__74093;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74094,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74094,(1),null);
return clojure.string.upper_case(c);
}));
});
/**
 * Stringifys all the keys of a cljs hashmap and converts them
 * from kebab case to camel case. If :html-props option is specified,
 * then rename the html properties values to their dom equivalent
 * before conversion
 */
frontend.rum.map_keys__GT_camel_case = (function frontend$rum$map_keys__GT_camel_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74162 = arguments.length;
var i__5727__auto___74163 = (0);
while(true){
if((i__5727__auto___74163 < len__5726__auto___74162)){
args__5732__auto__.push((arguments[i__5727__auto___74163]));

var G__74164 = (i__5727__auto___74163 + (1));
i__5727__auto___74163 = G__74164;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.rum.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.rum.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic = (function (data,p__74109){
var map__74110 = p__74109;
var map__74110__$1 = cljs.core.__destructure_map(map__74110);
var html_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74110__$1,new cljs.core.Keyword(null,"html-props","html-props",-455448229));
var convert_to_camel = (function (p__74113){
var vec__74114 = p__74113;
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74114,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74114,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.rum.kebab_case__GT_camel_case(cljs.core.name(key)),value], null);
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

(frontend.rum.map_keys__GT_camel_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.rum.map_keys__GT_camel_case.cljs$lang$applyTo = (function (seq74102){
var G__74103 = cljs.core.first(seq74102);
var seq74102__$1 = cljs.core.next(seq74102);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74103,seq74102__$1);
}));

frontend.rum.adapt_class = (function frontend$rum$adapt_class(var_args){
var G__74124 = arguments.length;
switch (G__74124) {
case 1:
return frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1 = (function (react_class){
return frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$2(react_class,false);
}));

(frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$2 = (function (react_class,skip_opts_transform_QMARK_){
return (function() { 
var G__74166__delegate = function (args){
var vec__74129 = ((cljs.core.map_QMARK_(cljs.core.first(args)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(args),cljs.core.rest(args)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.EMPTY,args], null));
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74129,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74129,(1),null);
var type_SHARP_ = cljs.core.first(children);
var new_children = ((cljs.core.sequential_QMARK_(type_SHARP_))?(function (){var result = daiquiri.interpreter.interpret(children);
if(cljs.core.sequential_QMARK_(result)){
return result;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [result], null);
}
})():children);
var vector__GT_react_elems = (function (p__74132){
var vec__74133 = p__74132;
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74133,(0),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74133,(1),null);
if(cljs.core.sequential_QMARK_(val)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,daiquiri.interpreter.interpret(val)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,val], null);
}
});
var new_options = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(cljs.core.truth_(skip_opts_transform_QMARK_)?opts:cljs.core.map.cljs$core$IFn$_invoke$arity$2(vector__GT_react_elems,opts)));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(React.createElement,react_class,cljs_bean.core.__GT_js(frontend.rum.map_keys__GT_camel_case.cljs$core$IFn$_invoke$arity$variadic(new_options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html-props","html-props",-455448229),true], 0))),new_children);
};
var G__74166 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__74167__i = 0, G__74167__a = new Array(arguments.length -  0);
while (G__74167__i < G__74167__a.length) {G__74167__a[G__74167__i] = arguments[G__74167__i + 0]; ++G__74167__i;}
  args = new cljs.core.IndexedSeq(G__74167__a,0,null);
} 
return G__74166__delegate.call(this,args);};
G__74166.cljs$lang$maxFixedArity = 0;
G__74166.cljs$lang$applyTo = (function (arglist__74168){
var args = cljs.core.seq(arglist__74168);
return G__74166__delegate(args);
});
G__74166.cljs$core$IFn$_invoke$arity$variadic = G__74166__delegate;
return G__74166;
})()
;
}));

(frontend.rum.adapt_class.cljs$lang$maxFixedArity = 2);

frontend.rum.use_atom_fn = (function frontend$rum$use_atom_fn(a,getter_fn,setter_fn){
var vec__74140 = rum.core.use_state((function (){var G__74143 = cljs.core.deref(a);
return (getter_fn.cljs$core$IFn$_invoke$arity$1 ? getter_fn.cljs$core$IFn$_invoke$arity$1(G__74143) : getter_fn.call(null,G__74143));
})());
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74140,(0),null);
var set_val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74140,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
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

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [val,(function (p1__74138_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(a,setter_fn,p1__74138_SHARP_);
})], null);
});
/**
 * (use-atom my-atom)
 */
frontend.rum.use_atom = (function frontend$rum$use_atom(a){
return frontend.rum.use_atom_fn(a,cljs.core.identity,(function (_,v){
return v;
}));
});
frontend.rum.use_atom_in = (function frontend$rum$use_atom_in(a,ks){
var ks__$1 = (((ks instanceof cljs.core.Keyword))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null):ks);
return frontend.rum.use_atom_fn(a,(function (p1__74145_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__74145_SHARP_,ks__$1);
}),(function (a_SINGLEQUOTE_,v){
return cljs.core.assoc_in(a_SINGLEQUOTE_,ks__$1,v);
}));
});
frontend.rum.use_mounted = (function frontend$rum$use_mounted(){
var _STAR_mounted = rum.core.use_ref(false);
logseq.shui.hooks.use_effect_BANG_((function (){
rum.core.set_ref_BANG_(_STAR_mounted,true);

return (function (){
return rum.core.set_ref_BANG_(_STAR_mounted,false);
});
}),cljs.core.PersistentVector.EMPTY);

return (function (){
return rum.core.deref(_STAR_mounted);
});
});
/**
 * Returns the bounding client rect for a given dom node
 * You can manually change the tick value, if you want to force refresh the value, you can manually change the tick value
 */
frontend.rum.use_bounding_client_rect = (function frontend$rum$use_bounding_client_rect(var_args){
var G__74148 = arguments.length;
switch (G__74148) {
case 0:
return frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$1(null);
}));

(frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$1 = (function (tick__$1){
var vec__74149 = rum.core.use_state(null);
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74149,(0),null);
var set_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74149,(1),null);
var vec__74152 = rum.core.use_state(null);
var rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74152,(0),null);
var set_rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74152,(1),null);
logseq.shui.hooks.use_effect_BANG_((cljs.core.truth_(ref)?(function (){
var update_rect = (function (){
var G__74155 = ref.getBoundingClientRect();
return (set_rect.cljs$core$IFn$_invoke$arity$1 ? set_rect.cljs$core$IFn$_invoke$arity$1(G__74155) : set_rect.call(null,G__74155));
});
var updator = (function (entries){
if(cljs.core.truth_(cljs.core.first(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(entries)).contentRect)){
return update_rect();
} else {
return null;
}
});
var observer = (new ResizeObserver(updator));
update_rect();

observer.observe(ref);

return (function (){
return observer.disconnect();
});
}):(function (){
return cljs.core.List.EMPTY;
})),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref,tick__$1], null));

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [set_ref,rect], null);
}));

(frontend.rum.use_bounding_client_rect.cljs$lang$maxFixedArity = 1);

/**
 * Converts a number to a breakpoint string
 * Values come from https://tailwindcss.com/docs/responsive-design
 */
frontend.rum.__GT_breakpoint = (function frontend$rum$__GT_breakpoint(size){
if((size == null)){
return new cljs.core.Keyword(null,"md","md",707286655);
} else {
if((size <= (640))){
return new cljs.core.Keyword(null,"sm","sm",-1402575065);
} else {
if((size <= (768))){
return new cljs.core.Keyword(null,"md","md",707286655);
} else {
if((size <= (1024))){
return new cljs.core.Keyword(null,"lg","lg",-80787836);
} else {
if((size <= (1280))){
return new cljs.core.Keyword(null,"xl","xl",-1689552936);
} else {
if((size <= (1536))){
return new cljs.core.Keyword(null,"xl","xl",-1689552936);
} else {
return new cljs.core.Keyword(null,"2xl","2xl",54696595);

}
}
}
}
}
}
});
/**
 * Returns the current breakpoint
 * You can manually change the tick value, if you want to force refresh the value, you can manually change the tick value
 */
frontend.rum.use_breakpoint = (function frontend$rum$use_breakpoint(var_args){
var G__74157 = arguments.length;
switch (G__74157) {
case 0:
return frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$1(null);
}));

(frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$1 = (function (tick__$1){
var vec__74158 = frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$1(tick__$1);
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74158,(0),null);
var rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74158,(1),null);
var bp = frontend.rum.__GT_breakpoint((((!((rect == null))))?rect.width:null));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref,bp], null);
}));

(frontend.rum.use_breakpoint.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=frontend.rum.js.map
