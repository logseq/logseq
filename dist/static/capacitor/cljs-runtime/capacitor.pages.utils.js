goog.provide('capacitor.pages.utils');
capacitor.pages.utils.nav_push_BANG_ = (function capacitor$pages$utils$nav_push_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___99577 = arguments.length;
var i__5727__auto___99578 = (0);
while(true){
if((i__5727__auto___99578 < len__5726__auto___99577)){
args__5732__auto__.push((arguments[i__5727__auto___99578]));

var G__99579 = (i__5727__auto___99578 + (1));
i__5727__auto___99578 = G__99579;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return capacitor.pages.utils.nav_push_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(capacitor.pages.utils.nav_push_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (component,opts){
var G__99565 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__99565 == null)){
return null;
} else {
return G__99565.push(component,cljs_bean.core.__GT_js(opts));
}
}));

(capacitor.pages.utils.nav_push_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(capacitor.pages.utils.nav_push_BANG_.cljs$lang$applyTo = (function (seq99558){
var G__99559 = cljs.core.first(seq99558);
var seq99558__$1 = cljs.core.next(seq99558);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__99559,seq99558__$1);
}));

capacitor.pages.utils.nav_pop_BANG_ = (function capacitor$pages$utils$nav_pop_BANG_(){
var G__99568 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__99568 == null)){
return null;
} else {
return G__99568.pop();
}
});
capacitor.pages.utils.nav_to_block_BANG_ = (function capacitor$pages$utils$nav_to_block_BANG_(page_or_block,opts){
var G__99573 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__99573 == null)){
return null;
} else {
return G__99573.push((function (){
return capacitor.pages.blocks.page(page_or_block,opts);
}));
}
});
capacitor.pages.utils.nav_to_edit_block_BANG_ = (function capacitor$pages$utils$nav_to_edit_block_BANG_(block,opts){
var G__99576 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__99576 == null)){
return null;
} else {
return G__99576.push((function (){
return capacitor.pages.blocks.edit_block_modal(block,opts);
}));
}
});

//# sourceMappingURL=capacitor.pages.utils.js.map
