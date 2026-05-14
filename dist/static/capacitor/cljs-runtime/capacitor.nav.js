goog.provide('capacitor.nav');
capacitor.nav.nav_push_BANG_ = (function capacitor$nav$nav_push_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___88421 = arguments.length;
var i__5727__auto___88422 = (0);
while(true){
if((i__5727__auto___88422 < len__5726__auto___88421)){
args__5732__auto__.push((arguments[i__5727__auto___88422]));

var G__88423 = (i__5727__auto___88422 + (1));
i__5727__auto___88422 = G__88423;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return capacitor.nav.nav_push_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(capacitor.nav.nav_push_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (component,opts){
var G__88418 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__88418 == null)){
return null;
} else {
return G__88418.push(component,cljs_bean.core.__GT_js(opts));
}
}));

(capacitor.nav.nav_push_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(capacitor.nav.nav_push_BANG_.cljs$lang$applyTo = (function (seq88416){
var G__88417 = cljs.core.first(seq88416);
var seq88416__$1 = cljs.core.next(seq88416);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__88417,seq88416__$1);
}));

capacitor.nav.nav_pop_BANG_ = (function capacitor$nav$nav_pop_BANG_(){
var G__88419 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__88419 == null)){
return null;
} else {
return G__88419.pop();
}
});
capacitor.nav.nav_length_QMARK_ = (function capacitor$nav$nav_length_QMARK_(){
var G__88420 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__88420 == null)){
return null;
} else {
return G__88420.getLength();
}
});
capacitor.nav.nav_to_block_BANG_ = (function capacitor$nav$nav_to_block_BANG_(page_or_block,opts){
return capacitor.nav.nav_push_BANG_((function (){
return capacitor.components.page.page(page_or_block,opts);
}));
});

//# sourceMappingURL=capacitor.nav.js.map
