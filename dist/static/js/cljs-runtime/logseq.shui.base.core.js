goog.provide('logseq.shui.base.core');
logseq.shui.base.core.button_base = logseq.shui.util.lsui_wrap("Button",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.base.core.link = logseq.shui.util.lsui_wrap("Link");
logseq.shui.base.core.trigger_as = (function logseq$shui$base$core$trigger_as(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74491 = arguments.length;
var i__5727__auto___74492 = (0);
while(true){
if((i__5727__auto___74492 < len__5726__auto___74491)){
args__5732__auto__.push((arguments[i__5727__auto___74492]));

var G__74493 = (i__5727__auto___74492 + (1));
i__5727__auto___74492 = G__74493;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.base.core.trigger_as.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.base.core.trigger_as.cljs$core$IFn$_invoke$arity$variadic = (function (as,props_or_children){
var vec__74452 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(props_or_children),cljs.core.rest(props_or_children)], null);
var props = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74452,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74452,(1),null);
var props_SINGLEQUOTE_ = (function (){var G__74455 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (p1__74444_SHARP_){
var G__74456 = p1__74444_SHARP_.key;
switch (G__74456) {
case " ":
case "Enter":
var G__74457_74499 = p1__74444_SHARP_.target;
if((G__74457_74499 == null)){
} else {
G__74457_74499.click();
}

p1__74444_SHARP_.preventDefault();

return p1__74444_SHARP_.stopPropagation();

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
})], null);
if(cljs.core.map_QMARK_(props)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__74455,props], 0));
} else {
return G__74455;
}
})();
var children__$1 = ((cljs.core.map_QMARK_(props))?children:cljs.core.cons(props,children));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [as,props_SINGLEQUOTE_,children__$1], null);
}));

(logseq.shui.base.core.trigger_as.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.base.core.trigger_as.cljs$lang$applyTo = (function (seq74447){
var G__74448 = cljs.core.first(seq74447);
var seq74447__$1 = cljs.core.next(seq74447);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74448,seq74447__$1);
}));

logseq.shui.base.core.trigger_child_wrap = (function logseq$shui$base$core$trigger_child_wrap(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74501 = arguments.length;
var i__5727__auto___74502 = (0);
while(true){
if((i__5727__auto___74502 < len__5726__auto___74501)){
args__5732__auto__.push((arguments[i__5727__auto___74502]));

var G__74503 = (i__5727__auto___74502 + (1));
i__5727__auto___74502 = G__74503;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.shui.base.core.trigger_child_wrap.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.shui.base.core.trigger_child_wrap.cljs$core$IFn$_invoke$arity$variadic = (function (props_and_children){
var props = cljs.core.first(props_and_children);
var children = cljs.core.rest(props_and_children);
var children__$1 = ((cljs.core.map_QMARK_(props))?children:cljs.core.cons(props,children));
var children__$2 = ((cljs.core.seq(children__$1))?daiquiri.interpreter.interpret(children__$1):null);
var props__$1 = ((cljs.core.map_QMARK_(props))?props:cljs.core.PersistentArrayMap.EMPTY);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(React.createElement,"div",cljs_bean.core.__GT_js(props__$1),children__$2);
}));

(logseq.shui.base.core.trigger_child_wrap.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.shui.base.core.trigger_child_wrap.cljs$lang$applyTo = (function (seq74466){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq74466));
}));

logseq.shui.base.core.button = (function logseq$shui$base$core$button(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74508 = arguments.length;
var i__5727__auto___74509 = (0);
while(true){
if((i__5727__auto___74509 < len__5726__auto___74508)){
args__5732__auto__.push((arguments[i__5727__auto___74509]));

var G__74512 = (i__5727__auto___74509 + (1));
i__5727__auto___74509 = G__74512;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic = (function (props_and_children){
var props = cljs.core.first(props_and_children);
var children = cljs.core.rest(props_and_children);
var children__$1 = ((cljs.core.map_QMARK_(props))?children:cljs.core.cons(props,children));
var props_SINGLEQUOTE_ = ((cljs.core.map_QMARK_(props))?props:cljs.core.PersistentArrayMap.EMPTY);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.shui.base.core.button_base,props_SINGLEQUOTE_,children__$1);
}));

(logseq.shui.base.core.button.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.shui.base.core.button.cljs$lang$applyTo = (function (seq74475){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq74475));
}));

logseq.shui.base.core.button_icon = (function logseq$shui$base$core$button_icon(variant,icon_name,p__74482,child){
var map__74483 = p__74482;
var map__74483__$1 = cljs.core.__destructure_map(map__74483);
var props = map__74483__$1;
var icon_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74483__$1,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74483__$1,new cljs.core.Keyword(null,"size","size",1098693007));
return logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(props,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"size","size",1098693007)], 0)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),variant,new cljs.core.Keyword(null,"data-button","data-button",-2145431612),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"style","style",-496642736),(cljs.core.truth_(size)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),size,new cljs.core.Keyword(null,"height","height",1025178622),size], null):null)], null)], 0)),logseq.shui.icon.v2.root(cljs.core.name(icon_name),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(20),new cljs.core.Keyword(null,"key","key",-1516042587),"icon"], null),icon_props], 0))),child], 0));
});
logseq.shui.base.core.button_ghost_icon = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.shui.base.core.button_icon,new cljs.core.Keyword(null,"ghost","ghost",-1531157576));
logseq.shui.base.core.button_outline_icon = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.shui.base.core.button_icon,new cljs.core.Keyword(null,"outline","outline",793464534));
logseq.shui.base.core.button_secondary_icon = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.shui.base.core.button_icon,new cljs.core.Keyword(null,"secondary","secondary",-669381460));

//# sourceMappingURL=logseq.shui.base.core.js.map
