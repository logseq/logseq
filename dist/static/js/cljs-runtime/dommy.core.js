goog.provide('dommy.core');
/**
 * Returns a selector in string format.
 * Accepts string, keyword, or collection.
 */
dommy.core.selector = (function dommy$core$selector(data){
if(cljs.core.coll_QMARK_(data)){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(dommy.core.selector,data));
} else {
if(((typeof data === 'string') || ((data instanceof cljs.core.Keyword)))){
return cljs.core.name(data);
} else {
return null;
}
}
});
dommy.core.text = (function dommy$core$text(elem){
var or__5002__auto__ = elem.textContent;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return elem.innerText;
}
});
dommy.core.html = (function dommy$core$html(elem){
return elem.innerHTML;
});
dommy.core.value = (function dommy$core$value(elem){
return elem.value;
});
dommy.core.class$ = (function dommy$core$class(elem){
return elem.className;
});
dommy.core.attr = (function dommy$core$attr(elem,k){
if(cljs.core.truth_(k)){
return elem.getAttribute(dommy.utils.as_str(k));
} else {
return null;
}
});
/**
 * The computed style of `elem`, optionally specifying the key of
 * a particular style to return
 */
dommy.core.style = (function dommy$core$style(var_args){
var G__69844 = arguments.length;
switch (G__69844) {
case 1:
return dommy.core.style.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return dommy.core.style.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.style.cljs$core$IFn$_invoke$arity$1 = (function (elem){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(window.getComputedStyle(elem));
}));

(dommy.core.style.cljs$core$IFn$_invoke$arity$2 = (function (elem,k){
return (window.getComputedStyle(elem)[dommy.utils.as_str(k)]);
}));

(dommy.core.style.cljs$lang$maxFixedArity = 2);

dommy.core.px = (function dommy$core$px(elem,k){

var pixels = dommy.core.style.cljs$core$IFn$_invoke$arity$2(elem,k);
if(cljs.core.seq(pixels)){
return parseInt(pixels);
} else {
return null;
}
});
/**
 * Does `elem` contain `c` in its class list
 */
dommy.core.has_class_QMARK_ = (function dommy$core$has_class_QMARK_(elem,c){
var c__$1 = dommy.utils.as_str(c);
var temp__5802__auto__ = elem.classList;
if(cljs.core.truth_(temp__5802__auto__)){
var class_list = temp__5802__auto__;
return class_list.contains(c__$1);
} else {
var temp__5804__auto__ = dommy.core.class$(elem);
if(cljs.core.truth_(temp__5804__auto__)){
var class_name = temp__5804__auto__;
var temp__5804__auto____$1 = dommy.utils.class_index(class_name,c__$1);
if(cljs.core.truth_(temp__5804__auto____$1)){
var i = temp__5804__auto____$1;
return (i >= (0));
} else {
return null;
}
} else {
return null;
}
}
});
/**
 * Is `elem` hidden (as associated with hide!/show!/toggle!, using display: none)
 */
dommy.core.hidden_QMARK_ = (function dommy$core$hidden_QMARK_(elem){
return (dommy.core.style.cljs$core$IFn$_invoke$arity$2(elem,new cljs.core.Keyword(null,"display","display",242065432)) === "none");
});
/**
 * Returns a map of the bounding client rect of `elem`
 * as a map with [:top :left :right :bottom :width :height]
 */
dommy.core.bounding_client_rect = (function dommy$core$bounding_client_rect(elem){
var r = elem.getBoundingClientRect();
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"top","top",-1856271961),r.top,new cljs.core.Keyword(null,"bottom","bottom",-1550509018),r.bottom,new cljs.core.Keyword(null,"left","left",-399115937),r.left,new cljs.core.Keyword(null,"right","right",-452581833),r.right,new cljs.core.Keyword(null,"width","width",-384071477),r.width,new cljs.core.Keyword(null,"height","height",1025178622),r.height], null);
});
dommy.core.parent = (function dommy$core$parent(elem){
return elem.parentNode;
});
dommy.core.children = (function dommy$core$children(elem){
return elem.children;
});
/**
 * Lazy seq of the ancestors of `elem`
 */
dommy.core.ancestors = (function dommy$core$ancestors(elem){
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(dommy.core.parent,elem));
});
dommy.core.ancestor_nodes = dommy.core.ancestors;
/**
 * Returns a predicate on nodes that match `selector` at the
 * time of this `matches-pred` call (may return outdated results
 * if you fuck with the DOM)
 */
dommy.core.matches_pred = (function dommy$core$matches_pred(var_args){
var G__69853 = arguments.length;
switch (G__69853) {
case 2:
return dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$2 = (function (base,selector){
var matches = dommy.utils.__GT_Array(base.querySelectorAll(dommy.core.selector(selector)));
return (function (elem){
return (matches.indexOf(elem) >= (0));
});
}));

(dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$1 = (function (selector){
return dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$2(document,selector);
}));

(dommy.core.matches_pred.cljs$lang$maxFixedArity = 2);

/**
 * Closest ancestor of `elem` (up to `base`, if provided)
 * that matches `selector`
 */
dommy.core.closest = (function dommy$core$closest(var_args){
var G__69863 = arguments.length;
switch (G__69863) {
case 3:
return dommy.core.closest.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return dommy.core.closest.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.closest.cljs$core$IFn$_invoke$arity$3 = (function (base,elem,selector){
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$2(base,selector),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__69859_SHARP_){
return (!((p1__69859_SHARP_ === base)));
}),dommy.core.ancestors(elem))));
}));

(dommy.core.closest.cljs$core$IFn$_invoke$arity$2 = (function (elem,selector){
return dommy.core.closest.cljs$core$IFn$_invoke$arity$3(document.body,elem,selector);
}));

(dommy.core.closest.cljs$lang$maxFixedArity = 3);

/**
 * Is `descendant` a descendant of `ancestor`?
 * (http://goo.gl/T8pgCX)
 */
dommy.core.descendant_QMARK_ = (function dommy$core$descendant_QMARK_(descendant,ancestor){
if(cljs.core.truth_(ancestor.contains)){
return ancestor.contains(descendant);
} else {
if(cljs.core.truth_(ancestor.compareDocumentPosition)){
return ((ancestor.compareDocumentPosition(descendant) & (1 << (4))) != 0);
} else {
return null;
}
}
});
/**
 * Set the textContent of `elem` to `text`, fall back to innerText
 */
dommy.core.set_text_BANG_ = (function dommy$core$set_text_BANG_(elem,text){
if((!((void 0 === elem.textContent)))){
(elem.textContent = text);
} else {
(elem.innerText = text);
}

return elem;
});
/**
 * Set the innerHTML of `elem` to `html`
 */
dommy.core.set_html_BANG_ = (function dommy$core$set_html_BANG_(elem,html){
(elem.innerHTML = html);

return elem;
});
/**
 * Set the value of `elem` to `value`
 */
dommy.core.set_value_BANG_ = (function dommy$core$set_value_BANG_(elem,value){
(elem.value = value);

return elem;
});
/**
 * Set the css class of `elem` to `elem`
 */
dommy.core.set_class_BANG_ = (function dommy$core$set_class_BANG_(elem,c){
return (elem.className = c);
});
/**
 * Set the style of `elem` using key-value pairs:
 * 
 *    (set-style! elem :display "block" :color "red")
 */
dommy.core.set_style_BANG_ = (function dommy$core$set_style_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70691 = arguments.length;
var i__5727__auto___70692 = (0);
while(true){
if((i__5727__auto___70692 < len__5726__auto___70691)){
args__5732__auto__.push((arguments[i__5727__auto___70692]));

var G__70693 = (i__5727__auto___70692 + (1));
i__5727__auto___70692 = G__70693;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,kvs){
if(cljs.core.even_QMARK_(cljs.core.count(kvs))){
} else {
throw (new Error("Assert failed: (even? (count kvs))"));
}

var style = elem.style;
var seq__69934_70694 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs));
var chunk__69935_70695 = null;
var count__69936_70696 = (0);
var i__69937_70697 = (0);
while(true){
if((i__69937_70697 < count__69936_70696)){
var vec__69944_70698 = chunk__69935_70695.cljs$core$IIndexed$_nth$arity$2(null,i__69937_70697);
var k_70699 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69944_70698,(0),null);
var v_70700 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69944_70698,(1),null);
style.setProperty(dommy.utils.as_str(k_70699),v_70700);


var G__70701 = seq__69934_70694;
var G__70702 = chunk__69935_70695;
var G__70703 = count__69936_70696;
var G__70704 = (i__69937_70697 + (1));
seq__69934_70694 = G__70701;
chunk__69935_70695 = G__70702;
count__69936_70696 = G__70703;
i__69937_70697 = G__70704;
continue;
} else {
var temp__5804__auto___70705 = cljs.core.seq(seq__69934_70694);
if(temp__5804__auto___70705){
var seq__69934_70706__$1 = temp__5804__auto___70705;
if(cljs.core.chunked_seq_QMARK_(seq__69934_70706__$1)){
var c__5525__auto___70707 = cljs.core.chunk_first(seq__69934_70706__$1);
var G__70708 = cljs.core.chunk_rest(seq__69934_70706__$1);
var G__70709 = c__5525__auto___70707;
var G__70710 = cljs.core.count(c__5525__auto___70707);
var G__70711 = (0);
seq__69934_70694 = G__70708;
chunk__69935_70695 = G__70709;
count__69936_70696 = G__70710;
i__69937_70697 = G__70711;
continue;
} else {
var vec__69951_70712 = cljs.core.first(seq__69934_70706__$1);
var k_70713 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69951_70712,(0),null);
var v_70714 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69951_70712,(1),null);
style.setProperty(dommy.utils.as_str(k_70713),v_70714);


var G__70715 = cljs.core.next(seq__69934_70706__$1);
var G__70716 = null;
var G__70717 = (0);
var G__70718 = (0);
seq__69934_70694 = G__70715;
chunk__69935_70695 = G__70716;
count__69936_70696 = G__70717;
i__69937_70697 = G__70718;
continue;
}
} else {
}
}
break;
}

return elem;
}));

(dommy.core.set_style_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.set_style_BANG_.cljs$lang$applyTo = (function (seq69929){
var G__69930 = cljs.core.first(seq69929);
var seq69929__$1 = cljs.core.next(seq69929);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69930,seq69929__$1);
}));

/**
 * Remove the style of `elem` using keywords:
 *   
 *    (remove-style! elem :display :color)
 */
dommy.core.remove_style_BANG_ = (function dommy$core$remove_style_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70719 = arguments.length;
var i__5727__auto___70720 = (0);
while(true){
if((i__5727__auto___70720 < len__5726__auto___70719)){
args__5732__auto__.push((arguments[i__5727__auto___70720]));

var G__70721 = (i__5727__auto___70720 + (1));
i__5727__auto___70720 = G__70721;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.remove_style_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.remove_style_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,keywords){
var style = elem.style;
var seq__69960_70722 = cljs.core.seq(keywords);
var chunk__69961_70723 = null;
var count__69962_70724 = (0);
var i__69963_70725 = (0);
while(true){
if((i__69963_70725 < count__69962_70724)){
var kw_70726 = chunk__69961_70723.cljs$core$IIndexed$_nth$arity$2(null,i__69963_70725);
style.removeProperty(dommy.utils.as_str(kw_70726));


var G__70727 = seq__69960_70722;
var G__70728 = chunk__69961_70723;
var G__70729 = count__69962_70724;
var G__70730 = (i__69963_70725 + (1));
seq__69960_70722 = G__70727;
chunk__69961_70723 = G__70728;
count__69962_70724 = G__70729;
i__69963_70725 = G__70730;
continue;
} else {
var temp__5804__auto___70731 = cljs.core.seq(seq__69960_70722);
if(temp__5804__auto___70731){
var seq__69960_70732__$1 = temp__5804__auto___70731;
if(cljs.core.chunked_seq_QMARK_(seq__69960_70732__$1)){
var c__5525__auto___70733 = cljs.core.chunk_first(seq__69960_70732__$1);
var G__70734 = cljs.core.chunk_rest(seq__69960_70732__$1);
var G__70735 = c__5525__auto___70733;
var G__70736 = cljs.core.count(c__5525__auto___70733);
var G__70737 = (0);
seq__69960_70722 = G__70734;
chunk__69961_70723 = G__70735;
count__69962_70724 = G__70736;
i__69963_70725 = G__70737;
continue;
} else {
var kw_70738 = cljs.core.first(seq__69960_70732__$1);
style.removeProperty(dommy.utils.as_str(kw_70738));


var G__70739 = cljs.core.next(seq__69960_70732__$1);
var G__70740 = null;
var G__70741 = (0);
var G__70742 = (0);
seq__69960_70722 = G__70739;
chunk__69961_70723 = G__70740;
count__69962_70724 = G__70741;
i__69963_70725 = G__70742;
continue;
}
} else {
}
}
break;
}

return elem;
}));

(dommy.core.remove_style_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.remove_style_BANG_.cljs$lang$applyTo = (function (seq69956){
var G__69957 = cljs.core.first(seq69956);
var seq69956__$1 = cljs.core.next(seq69956);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69957,seq69956__$1);
}));

dommy.core.set_px_BANG_ = (function dommy$core$set_px_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70743 = arguments.length;
var i__5727__auto___70744 = (0);
while(true){
if((i__5727__auto___70744 < len__5726__auto___70743)){
args__5732__auto__.push((arguments[i__5727__auto___70744]));

var G__70745 = (i__5727__auto___70744 + (1));
i__5727__auto___70744 = G__70745;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.set_px_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.set_px_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,kvs){

if(cljs.core.even_QMARK_(cljs.core.count(kvs))){
} else {
throw (new Error("Assert failed: (even? (count kvs))"));
}

var seq__69978_70746 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs));
var chunk__69979_70747 = null;
var count__69980_70748 = (0);
var i__69981_70749 = (0);
while(true){
if((i__69981_70749 < count__69980_70748)){
var vec__69992_70750 = chunk__69979_70747.cljs$core$IIndexed$_nth$arity$2(null,i__69981_70749);
var k_70751 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69992_70750,(0),null);
var v_70752 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69992_70750,(1),null);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k_70751,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_70752),"px"].join('')], 0));


var G__70753 = seq__69978_70746;
var G__70754 = chunk__69979_70747;
var G__70755 = count__69980_70748;
var G__70756 = (i__69981_70749 + (1));
seq__69978_70746 = G__70753;
chunk__69979_70747 = G__70754;
count__69980_70748 = G__70755;
i__69981_70749 = G__70756;
continue;
} else {
var temp__5804__auto___70757 = cljs.core.seq(seq__69978_70746);
if(temp__5804__auto___70757){
var seq__69978_70758__$1 = temp__5804__auto___70757;
if(cljs.core.chunked_seq_QMARK_(seq__69978_70758__$1)){
var c__5525__auto___70759 = cljs.core.chunk_first(seq__69978_70758__$1);
var G__70760 = cljs.core.chunk_rest(seq__69978_70758__$1);
var G__70761 = c__5525__auto___70759;
var G__70762 = cljs.core.count(c__5525__auto___70759);
var G__70763 = (0);
seq__69978_70746 = G__70760;
chunk__69979_70747 = G__70761;
count__69980_70748 = G__70762;
i__69981_70749 = G__70763;
continue;
} else {
var vec__69999_70764 = cljs.core.first(seq__69978_70758__$1);
var k_70765 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69999_70764,(0),null);
var v_70766 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69999_70764,(1),null);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k_70765,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_70766),"px"].join('')], 0));


var G__70767 = cljs.core.next(seq__69978_70758__$1);
var G__70768 = null;
var G__70769 = (0);
var G__70770 = (0);
seq__69978_70746 = G__70767;
chunk__69979_70747 = G__70768;
count__69980_70748 = G__70769;
i__69981_70749 = G__70770;
continue;
}
} else {
}
}
break;
}

return elem;
}));

(dommy.core.set_px_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.set_px_BANG_.cljs$lang$applyTo = (function (seq69972){
var G__69973 = cljs.core.first(seq69972);
var seq69972__$1 = cljs.core.next(seq69972);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69973,seq69972__$1);
}));

/**
 * Sets dom attributes on and returns `elem`.
 * Attributes without values will be set to their name:
 * 
 *     (set-attr! elem :disabled)
 * 
 * With values, the function takes variadic kv pairs:
 * 
 *     (set-attr! elem :id "some-id"
 *                     :name "some-name")
 */
dommy.core.set_attr_BANG_ = (function dommy$core$set_attr_BANG_(var_args){
var G__70008 = arguments.length;
switch (G__70008) {
case 2:
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70772 = arguments.length;
var i__5727__auto___70773 = (0);
while(true){
if((i__5727__auto___70773 < len__5726__auto___70772)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70773]));

var G__70774 = (i__5727__auto___70773 + (1));
i__5727__auto___70773 = G__70774;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((3) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((3)),(0),null)):null);
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5752__auto__);

}
});

(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,k){
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k,dommy.utils.as_str(k));
}));

(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (elem,k,v){
var k__$1 = dommy.utils.as_str(k);
if(cljs.core.truth_(v)){
if(cljs.core.fn_QMARK_(v)){
var G__70013 = elem;
(G__70013[k__$1] = v);

return G__70013;
} else {
var G__70014 = elem;
G__70014.setAttribute(k__$1,v);

return G__70014;
}
} else {
return null;
}
}));

(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,k,v,kvs){
if(cljs.core.even_QMARK_(cljs.core.count(kvs))){
} else {
throw (new Error("Assert failed: (even? (count kvs))"));
}

var seq__70015_70775 = cljs.core.seq(cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null),cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs)));
var chunk__70016_70776 = null;
var count__70017_70777 = (0);
var i__70018_70778 = (0);
while(true){
if((i__70018_70778 < count__70017_70777)){
var vec__70031_70779 = chunk__70016_70776.cljs$core$IIndexed$_nth$arity$2(null,i__70018_70778);
var k_70780__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70031_70779,(0),null);
var v_70781__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70031_70779,(1),null);
dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k_70780__$1,v_70781__$1);


var G__70782 = seq__70015_70775;
var G__70783 = chunk__70016_70776;
var G__70784 = count__70017_70777;
var G__70785 = (i__70018_70778 + (1));
seq__70015_70775 = G__70782;
chunk__70016_70776 = G__70783;
count__70017_70777 = G__70784;
i__70018_70778 = G__70785;
continue;
} else {
var temp__5804__auto___70786 = cljs.core.seq(seq__70015_70775);
if(temp__5804__auto___70786){
var seq__70015_70787__$1 = temp__5804__auto___70786;
if(cljs.core.chunked_seq_QMARK_(seq__70015_70787__$1)){
var c__5525__auto___70788 = cljs.core.chunk_first(seq__70015_70787__$1);
var G__70789 = cljs.core.chunk_rest(seq__70015_70787__$1);
var G__70790 = c__5525__auto___70788;
var G__70791 = cljs.core.count(c__5525__auto___70788);
var G__70792 = (0);
seq__70015_70775 = G__70789;
chunk__70016_70776 = G__70790;
count__70017_70777 = G__70791;
i__70018_70778 = G__70792;
continue;
} else {
var vec__70036_70793 = cljs.core.first(seq__70015_70787__$1);
var k_70794__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70036_70793,(0),null);
var v_70795__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70036_70793,(1),null);
dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k_70794__$1,v_70795__$1);


var G__70796 = cljs.core.next(seq__70015_70787__$1);
var G__70797 = null;
var G__70798 = (0);
var G__70799 = (0);
seq__70015_70775 = G__70796;
chunk__70016_70776 = G__70797;
count__70017_70777 = G__70798;
i__70018_70778 = G__70799;
continue;
}
} else {
}
}
break;
}

return elem;
}));

/** @this {Function} */
(dommy.core.set_attr_BANG_.cljs$lang$applyTo = (function (seq70004){
var G__70005 = cljs.core.first(seq70004);
var seq70004__$1 = cljs.core.next(seq70004);
var G__70006 = cljs.core.first(seq70004__$1);
var seq70004__$2 = cljs.core.next(seq70004__$1);
var G__70007 = cljs.core.first(seq70004__$2);
var seq70004__$3 = cljs.core.next(seq70004__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70005,G__70006,G__70007,seq70004__$3);
}));

(dommy.core.set_attr_BANG_.cljs$lang$maxFixedArity = (3));

/**
 * Removes dom attributes on and returns `elem`.
 * `class` and `classes` are special cases which clear
 * out the class name on removal.
 */
dommy.core.remove_attr_BANG_ = (function dommy$core$remove_attr_BANG_(var_args){
var G__70051 = arguments.length;
switch (G__70051) {
case 2:
return dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70805 = arguments.length;
var i__5727__auto___70806 = (0);
while(true){
if((i__5727__auto___70806 < len__5726__auto___70805)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70806]));

var G__70807 = (i__5727__auto___70806 + (1));
i__5727__auto___70806 = G__70807;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,k){
var k_70808__$1 = dommy.utils.as_str(k);
if(cljs.core.truth_((function (){var fexpr__70052 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["class",null,"classes",null], null), null);
return (fexpr__70052.cljs$core$IFn$_invoke$arity$1 ? fexpr__70052.cljs$core$IFn$_invoke$arity$1(k_70808__$1) : fexpr__70052.call(null,k_70808__$1));
})())){
dommy.core.set_class_BANG_(elem,"");
} else {
elem.removeAttribute(k_70808__$1);
}

return elem;
}));

(dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,k,ks){
var seq__70053_70811 = cljs.core.seq(cljs.core.cons(k,ks));
var chunk__70054_70812 = null;
var count__70055_70813 = (0);
var i__70056_70814 = (0);
while(true){
if((i__70056_70814 < count__70055_70813)){
var k_70815__$1 = chunk__70054_70812.cljs$core$IIndexed$_nth$arity$2(null,i__70056_70814);
dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k_70815__$1);


var G__70816 = seq__70053_70811;
var G__70817 = chunk__70054_70812;
var G__70818 = count__70055_70813;
var G__70819 = (i__70056_70814 + (1));
seq__70053_70811 = G__70816;
chunk__70054_70812 = G__70817;
count__70055_70813 = G__70818;
i__70056_70814 = G__70819;
continue;
} else {
var temp__5804__auto___70820 = cljs.core.seq(seq__70053_70811);
if(temp__5804__auto___70820){
var seq__70053_70821__$1 = temp__5804__auto___70820;
if(cljs.core.chunked_seq_QMARK_(seq__70053_70821__$1)){
var c__5525__auto___70822 = cljs.core.chunk_first(seq__70053_70821__$1);
var G__70823 = cljs.core.chunk_rest(seq__70053_70821__$1);
var G__70824 = c__5525__auto___70822;
var G__70825 = cljs.core.count(c__5525__auto___70822);
var G__70826 = (0);
seq__70053_70811 = G__70823;
chunk__70054_70812 = G__70824;
count__70055_70813 = G__70825;
i__70056_70814 = G__70826;
continue;
} else {
var k_70827__$1 = cljs.core.first(seq__70053_70821__$1);
dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k_70827__$1);


var G__70828 = cljs.core.next(seq__70053_70821__$1);
var G__70829 = null;
var G__70830 = (0);
var G__70831 = (0);
seq__70053_70811 = G__70828;
chunk__70054_70812 = G__70829;
count__70055_70813 = G__70830;
i__70056_70814 = G__70831;
continue;
}
} else {
}
}
break;
}

return elem;
}));

/** @this {Function} */
(dommy.core.remove_attr_BANG_.cljs$lang$applyTo = (function (seq70047){
var G__70048 = cljs.core.first(seq70047);
var seq70047__$1 = cljs.core.next(seq70047);
var G__70049 = cljs.core.first(seq70047__$1);
var seq70047__$2 = cljs.core.next(seq70047__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70048,G__70049,seq70047__$2);
}));

(dommy.core.remove_attr_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Toggles a dom attribute `k` on `elem`, optionally specifying
 * the boolean value with `add?`
 */
dommy.core.toggle_attr_BANG_ = (function dommy$core$toggle_attr_BANG_(var_args){
var G__70069 = arguments.length;
switch (G__70069) {
case 2:
return dommy.core.toggle_attr_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return dommy.core.toggle_attr_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.toggle_attr_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,k){
return dommy.core.toggle_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k,cljs.core.boolean$(dommy.core.attr(elem,k)));
}));

(dommy.core.toggle_attr_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (elem,k,add_QMARK_){
if(add_QMARK_){
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k);
} else {
return dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k);
}
}));

(dommy.core.toggle_attr_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Add `classes` to `elem`, trying to use Element::classList, and
 * falling back to fast string parsing/manipulation
 */
dommy.core.add_class_BANG_ = (function dommy$core$add_class_BANG_(var_args){
var G__70075 = arguments.length;
switch (G__70075) {
case 2:
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70838 = arguments.length;
var i__5727__auto___70839 = (0);
while(true){
if((i__5727__auto___70839 < len__5726__auto___70838)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70839]));

var G__70840 = (i__5727__auto___70839 + (1));
i__5727__auto___70839 = G__70840;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,classes){
var classes__$1 = clojure.string.trim(dommy.utils.as_str(classes)).split(/\s+/);
if(cljs.core.seq(classes__$1)){
var temp__5802__auto___70842 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___70842)){
var class_list_70843 = temp__5802__auto___70842;
var seq__70076_70844 = cljs.core.seq(classes__$1);
var chunk__70077_70845 = null;
var count__70078_70846 = (0);
var i__70079_70847 = (0);
while(true){
if((i__70079_70847 < count__70078_70846)){
var c_70850 = chunk__70077_70845.cljs$core$IIndexed$_nth$arity$2(null,i__70079_70847);
class_list_70843.add(c_70850);


var G__70851 = seq__70076_70844;
var G__70852 = chunk__70077_70845;
var G__70853 = count__70078_70846;
var G__70854 = (i__70079_70847 + (1));
seq__70076_70844 = G__70851;
chunk__70077_70845 = G__70852;
count__70078_70846 = G__70853;
i__70079_70847 = G__70854;
continue;
} else {
var temp__5804__auto___70858 = cljs.core.seq(seq__70076_70844);
if(temp__5804__auto___70858){
var seq__70076_70861__$1 = temp__5804__auto___70858;
if(cljs.core.chunked_seq_QMARK_(seq__70076_70861__$1)){
var c__5525__auto___70862 = cljs.core.chunk_first(seq__70076_70861__$1);
var G__70863 = cljs.core.chunk_rest(seq__70076_70861__$1);
var G__70864 = c__5525__auto___70862;
var G__70865 = cljs.core.count(c__5525__auto___70862);
var G__70866 = (0);
seq__70076_70844 = G__70863;
chunk__70077_70845 = G__70864;
count__70078_70846 = G__70865;
i__70079_70847 = G__70866;
continue;
} else {
var c_70867 = cljs.core.first(seq__70076_70861__$1);
class_list_70843.add(c_70867);


var G__70868 = cljs.core.next(seq__70076_70861__$1);
var G__70869 = null;
var G__70870 = (0);
var G__70871 = (0);
seq__70076_70844 = G__70868;
chunk__70077_70845 = G__70869;
count__70078_70846 = G__70870;
i__70079_70847 = G__70871;
continue;
}
} else {
}
}
break;
}
} else {
var seq__70116_70872 = cljs.core.seq(classes__$1);
var chunk__70117_70873 = null;
var count__70118_70874 = (0);
var i__70119_70875 = (0);
while(true){
if((i__70119_70875 < count__70118_70874)){
var c_70876 = chunk__70117_70873.cljs$core$IIndexed$_nth$arity$2(null,i__70119_70875);
var class_name_70877 = dommy.core.class$(elem);
if(cljs.core.truth_(dommy.utils.class_index(class_name_70877,c_70876))){
} else {
dommy.core.set_class_BANG_(elem,(((class_name_70877 === ""))?c_70876:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class_name_70877)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c_70876)].join('')));
}


var G__70878 = seq__70116_70872;
var G__70879 = chunk__70117_70873;
var G__70880 = count__70118_70874;
var G__70881 = (i__70119_70875 + (1));
seq__70116_70872 = G__70878;
chunk__70117_70873 = G__70879;
count__70118_70874 = G__70880;
i__70119_70875 = G__70881;
continue;
} else {
var temp__5804__auto___70882 = cljs.core.seq(seq__70116_70872);
if(temp__5804__auto___70882){
var seq__70116_70883__$1 = temp__5804__auto___70882;
if(cljs.core.chunked_seq_QMARK_(seq__70116_70883__$1)){
var c__5525__auto___70884 = cljs.core.chunk_first(seq__70116_70883__$1);
var G__70885 = cljs.core.chunk_rest(seq__70116_70883__$1);
var G__70886 = c__5525__auto___70884;
var G__70887 = cljs.core.count(c__5525__auto___70884);
var G__70888 = (0);
seq__70116_70872 = G__70885;
chunk__70117_70873 = G__70886;
count__70118_70874 = G__70887;
i__70119_70875 = G__70888;
continue;
} else {
var c_70889 = cljs.core.first(seq__70116_70883__$1);
var class_name_70890 = dommy.core.class$(elem);
if(cljs.core.truth_(dommy.utils.class_index(class_name_70890,c_70889))){
} else {
dommy.core.set_class_BANG_(elem,(((class_name_70890 === ""))?c_70889:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class_name_70890)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c_70889)].join('')));
}


var G__70891 = cljs.core.next(seq__70116_70883__$1);
var G__70892 = null;
var G__70893 = (0);
var G__70894 = (0);
seq__70116_70872 = G__70891;
chunk__70117_70873 = G__70892;
count__70118_70874 = G__70893;
i__70119_70875 = G__70894;
continue;
}
} else {
}
}
break;
}
}
} else {
}

return elem;
}));

(dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,classes,more_classes){
var seq__70129_70895 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(more_classes,classes));
var chunk__70130_70896 = null;
var count__70131_70897 = (0);
var i__70132_70898 = (0);
while(true){
if((i__70132_70898 < count__70131_70897)){
var c_70900 = chunk__70130_70896.cljs$core$IIndexed$_nth$arity$2(null,i__70132_70898);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c_70900);


var G__70901 = seq__70129_70895;
var G__70902 = chunk__70130_70896;
var G__70903 = count__70131_70897;
var G__70904 = (i__70132_70898 + (1));
seq__70129_70895 = G__70901;
chunk__70130_70896 = G__70902;
count__70131_70897 = G__70903;
i__70132_70898 = G__70904;
continue;
} else {
var temp__5804__auto___70905 = cljs.core.seq(seq__70129_70895);
if(temp__5804__auto___70905){
var seq__70129_70906__$1 = temp__5804__auto___70905;
if(cljs.core.chunked_seq_QMARK_(seq__70129_70906__$1)){
var c__5525__auto___70907 = cljs.core.chunk_first(seq__70129_70906__$1);
var G__70908 = cljs.core.chunk_rest(seq__70129_70906__$1);
var G__70909 = c__5525__auto___70907;
var G__70910 = cljs.core.count(c__5525__auto___70907);
var G__70911 = (0);
seq__70129_70895 = G__70908;
chunk__70130_70896 = G__70909;
count__70131_70897 = G__70910;
i__70132_70898 = G__70911;
continue;
} else {
var c_70912 = cljs.core.first(seq__70129_70906__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c_70912);


var G__70913 = cljs.core.next(seq__70129_70906__$1);
var G__70914 = null;
var G__70915 = (0);
var G__70916 = (0);
seq__70129_70895 = G__70913;
chunk__70130_70896 = G__70914;
count__70131_70897 = G__70915;
i__70132_70898 = G__70916;
continue;
}
} else {
}
}
break;
}

return elem;
}));

/** @this {Function} */
(dommy.core.add_class_BANG_.cljs$lang$applyTo = (function (seq70071){
var G__70072 = cljs.core.first(seq70071);
var seq70071__$1 = cljs.core.next(seq70071);
var G__70073 = cljs.core.first(seq70071__$1);
var seq70071__$2 = cljs.core.next(seq70071__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70072,G__70073,seq70071__$2);
}));

(dommy.core.add_class_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Remove `c` from `elem` class list
 */
dommy.core.remove_class_BANG_ = (function dommy$core$remove_class_BANG_(var_args){
var G__70142 = arguments.length;
switch (G__70142) {
case 2:
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70919 = arguments.length;
var i__5727__auto___70920 = (0);
while(true){
if((i__5727__auto___70920 < len__5726__auto___70919)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70920]));

var G__70921 = (i__5727__auto___70920 + (1));
i__5727__auto___70920 = G__70921;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,c){
var c__$1 = dommy.utils.as_str(c);
var temp__5802__auto___70922 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___70922)){
var class_list_70923 = temp__5802__auto___70922;
class_list_70923.remove(c__$1);
} else {
var class_name_70924 = dommy.core.class$(elem);
var new_class_name_70925 = dommy.utils.remove_class_str(class_name_70924,c__$1);
if((class_name_70924 === new_class_name_70925)){
} else {
dommy.core.set_class_BANG_(elem,new_class_name_70925);
}
}

return elem;
}));

(dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,class$,classes){
var seq__70147 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(classes,class$));
var chunk__70148 = null;
var count__70149 = (0);
var i__70150 = (0);
while(true){
if((i__70150 < count__70149)){
var c = chunk__70148.cljs$core$IIndexed$_nth$arity$2(null,i__70150);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c);


var G__70930 = seq__70147;
var G__70931 = chunk__70148;
var G__70932 = count__70149;
var G__70933 = (i__70150 + (1));
seq__70147 = G__70930;
chunk__70148 = G__70931;
count__70149 = G__70932;
i__70150 = G__70933;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__70147);
if(temp__5804__auto__){
var seq__70147__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__70147__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__70147__$1);
var G__70934 = cljs.core.chunk_rest(seq__70147__$1);
var G__70935 = c__5525__auto__;
var G__70936 = cljs.core.count(c__5525__auto__);
var G__70937 = (0);
seq__70147 = G__70934;
chunk__70148 = G__70935;
count__70149 = G__70936;
i__70150 = G__70937;
continue;
} else {
var c = cljs.core.first(seq__70147__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c);


var G__70938 = cljs.core.next(seq__70147__$1);
var G__70939 = null;
var G__70940 = (0);
var G__70941 = (0);
seq__70147 = G__70938;
chunk__70148 = G__70939;
count__70149 = G__70940;
i__70150 = G__70941;
continue;
}
} else {
return null;
}
}
break;
}
}));

/** @this {Function} */
(dommy.core.remove_class_BANG_.cljs$lang$applyTo = (function (seq70139){
var G__70140 = cljs.core.first(seq70139);
var seq70139__$1 = cljs.core.next(seq70139);
var G__70141 = cljs.core.first(seq70139__$1);
var seq70139__$2 = cljs.core.next(seq70139__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70140,G__70141,seq70139__$2);
}));

(dommy.core.remove_class_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * (toggle-class! elem class) will add-class! if elem does not have class
 * and remove-class! otherwise.
 * (toggle-class! elem class add?) will add-class! if add? is truthy,
 * otherwise it will remove-class!
 */
dommy.core.toggle_class_BANG_ = (function dommy$core$toggle_class_BANG_(var_args){
var G__70158 = arguments.length;
switch (G__70158) {
case 2:
return dommy.core.toggle_class_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return dommy.core.toggle_class_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.toggle_class_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,c){
var c__$1 = dommy.utils.as_str(c);
var temp__5802__auto___70945 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___70945)){
var class_list_70946 = temp__5802__auto___70945;
class_list_70946.toggle(c__$1);
} else {
dommy.core.toggle_class_BANG_.cljs$core$IFn$_invoke$arity$3(elem,c__$1,(!(dommy.core.has_class_QMARK_(elem,c__$1))));
}

return elem;
}));

(dommy.core.toggle_class_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (elem,class$,add_QMARK_){
if(add_QMARK_){
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,class$);
} else {
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,class$);
}

return elem;
}));

(dommy.core.toggle_class_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Display or hide the given `elem` (using display: none).
 * Takes an optional boolean `show?`
 */
dommy.core.toggle_BANG_ = (function dommy$core$toggle_BANG_(var_args){
var G__70163 = arguments.length;
switch (G__70163) {
case 2:
return dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (elem,show_QMARK_){
return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"display","display",242065432),((show_QMARK_)?"":"none")], 0));
}));

(dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (elem){
return dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$2(elem,dommy.core.hidden_QMARK_(elem));
}));

(dommy.core.toggle_BANG_.cljs$lang$maxFixedArity = 2);

dommy.core.hide_BANG_ = (function dommy$core$hide_BANG_(elem){
return dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$2(elem,false);
});
dommy.core.show_BANG_ = (function dommy$core$show_BANG_(elem){
return dommy.core.toggle_BANG_.cljs$core$IFn$_invoke$arity$2(elem,true);
});
dommy.core.scroll_into_view = (function dommy$core$scroll_into_view(elem,align_with_top_QMARK_){
var top = new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(dommy.core.bounding_client_rect(elem));
if((window.innerHeight < (top + elem.offsetHeight))){
return elem.scrollIntoView(align_with_top_QMARK_);
} else {
return null;
}
});
dommy.core.create_element = (function dommy$core$create_element(var_args){
var G__70174 = arguments.length;
switch (G__70174) {
case 1:
return dommy.core.create_element.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return dommy.core.create_element.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.create_element.cljs$core$IFn$_invoke$arity$1 = (function (tag){
return document.createElement(dommy.utils.as_str(tag));
}));

(dommy.core.create_element.cljs$core$IFn$_invoke$arity$2 = (function (tag_ns,tag){
return document.createElementNS(dommy.utils.as_str(tag_ns),dommy.utils.as_str(tag));
}));

(dommy.core.create_element.cljs$lang$maxFixedArity = 2);

dommy.core.create_text_node = (function dommy$core$create_text_node(text){
return document.createTextNode(text);
});
/**
 * Clears all children from `elem`
 */
dommy.core.clear_BANG_ = (function dommy$core$clear_BANG_(elem){
return dommy.core.set_html_BANG_(elem,"");
});
/**
 * Append `child` to `parent`
 */
dommy.core.append_BANG_ = (function dommy$core$append_BANG_(var_args){
var G__70184 = arguments.length;
switch (G__70184) {
case 2:
return dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70952 = arguments.length;
var i__5727__auto___70953 = (0);
while(true){
if((i__5727__auto___70953 < len__5726__auto___70952)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70953]));

var G__70955 = (i__5727__auto___70953 + (1));
i__5727__auto___70953 = G__70955;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (parent,child){
var G__70187 = parent;
G__70187.appendChild(child);

return G__70187;
}));

(dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (parent,child,more_children){
var seq__70188_70956 = cljs.core.seq(cljs.core.cons(child,more_children));
var chunk__70189_70957 = null;
var count__70190_70958 = (0);
var i__70191_70959 = (0);
while(true){
if((i__70191_70959 < count__70190_70958)){
var c_70962 = chunk__70189_70957.cljs$core$IIndexed$_nth$arity$2(null,i__70191_70959);
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_70962);


var G__70963 = seq__70188_70956;
var G__70964 = chunk__70189_70957;
var G__70965 = count__70190_70958;
var G__70966 = (i__70191_70959 + (1));
seq__70188_70956 = G__70963;
chunk__70189_70957 = G__70964;
count__70190_70958 = G__70965;
i__70191_70959 = G__70966;
continue;
} else {
var temp__5804__auto___70967 = cljs.core.seq(seq__70188_70956);
if(temp__5804__auto___70967){
var seq__70188_70968__$1 = temp__5804__auto___70967;
if(cljs.core.chunked_seq_QMARK_(seq__70188_70968__$1)){
var c__5525__auto___70969 = cljs.core.chunk_first(seq__70188_70968__$1);
var G__70970 = cljs.core.chunk_rest(seq__70188_70968__$1);
var G__70971 = c__5525__auto___70969;
var G__70972 = cljs.core.count(c__5525__auto___70969);
var G__70973 = (0);
seq__70188_70956 = G__70970;
chunk__70189_70957 = G__70971;
count__70190_70958 = G__70972;
i__70191_70959 = G__70973;
continue;
} else {
var c_70974 = cljs.core.first(seq__70188_70968__$1);
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_70974);


var G__70975 = cljs.core.next(seq__70188_70968__$1);
var G__70976 = null;
var G__70977 = (0);
var G__70978 = (0);
seq__70188_70956 = G__70975;
chunk__70189_70957 = G__70976;
count__70190_70958 = G__70977;
i__70191_70959 = G__70978;
continue;
}
} else {
}
}
break;
}

return parent;
}));

/** @this {Function} */
(dommy.core.append_BANG_.cljs$lang$applyTo = (function (seq70181){
var G__70182 = cljs.core.first(seq70181);
var seq70181__$1 = cljs.core.next(seq70181);
var G__70183 = cljs.core.first(seq70181__$1);
var seq70181__$2 = cljs.core.next(seq70181__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70182,G__70183,seq70181__$2);
}));

(dommy.core.append_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Prepend `child` to `parent`
 */
dommy.core.prepend_BANG_ = (function dommy$core$prepend_BANG_(var_args){
var G__70202 = arguments.length;
switch (G__70202) {
case 2:
return dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___70980 = arguments.length;
var i__5727__auto___70981 = (0);
while(true){
if((i__5727__auto___70981 < len__5726__auto___70980)){
args_arr__5751__auto__.push((arguments[i__5727__auto___70981]));

var G__70982 = (i__5727__auto___70981 + (1));
i__5727__auto___70981 = G__70982;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (parent,child){
var G__70203 = parent;
G__70203.insertBefore(child,parent.firstChild);

return G__70203;
}));

(dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (parent,child,more_children){
var seq__70204_70984 = cljs.core.seq(cljs.core.cons(child,more_children));
var chunk__70205_70985 = null;
var count__70206_70986 = (0);
var i__70207_70987 = (0);
while(true){
if((i__70207_70987 < count__70206_70986)){
var c_70988 = chunk__70205_70985.cljs$core$IIndexed$_nth$arity$2(null,i__70207_70987);
dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_70988);


var G__70989 = seq__70204_70984;
var G__70990 = chunk__70205_70985;
var G__70991 = count__70206_70986;
var G__70992 = (i__70207_70987 + (1));
seq__70204_70984 = G__70989;
chunk__70205_70985 = G__70990;
count__70206_70986 = G__70991;
i__70207_70987 = G__70992;
continue;
} else {
var temp__5804__auto___70994 = cljs.core.seq(seq__70204_70984);
if(temp__5804__auto___70994){
var seq__70204_70995__$1 = temp__5804__auto___70994;
if(cljs.core.chunked_seq_QMARK_(seq__70204_70995__$1)){
var c__5525__auto___70996 = cljs.core.chunk_first(seq__70204_70995__$1);
var G__70997 = cljs.core.chunk_rest(seq__70204_70995__$1);
var G__70998 = c__5525__auto___70996;
var G__70999 = cljs.core.count(c__5525__auto___70996);
var G__71000 = (0);
seq__70204_70984 = G__70997;
chunk__70205_70985 = G__70998;
count__70206_70986 = G__70999;
i__70207_70987 = G__71000;
continue;
} else {
var c_71001 = cljs.core.first(seq__70204_70995__$1);
dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_71001);


var G__71003 = cljs.core.next(seq__70204_70995__$1);
var G__71004 = null;
var G__71005 = (0);
var G__71006 = (0);
seq__70204_70984 = G__71003;
chunk__70205_70985 = G__71004;
count__70206_70986 = G__71005;
i__70207_70987 = G__71006;
continue;
}
} else {
}
}
break;
}

return parent;
}));

/** @this {Function} */
(dommy.core.prepend_BANG_.cljs$lang$applyTo = (function (seq70199){
var G__70200 = cljs.core.first(seq70199);
var seq70199__$1 = cljs.core.next(seq70199);
var G__70201 = cljs.core.first(seq70199__$1);
var seq70199__$2 = cljs.core.next(seq70199__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70200,G__70201,seq70199__$2);
}));

(dommy.core.prepend_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Insert `elem` before `other`, `other` must have a parent
 */
dommy.core.insert_before_BANG_ = (function dommy$core$insert_before_BANG_(elem,other){
var p = dommy.core.parent(other);
if(cljs.core.truth_(p)){
} else {
throw (new Error(["Assert failed: ","Target element must have a parent","\n","p"].join('')));
}

p.insertBefore(elem,other);

return elem;
});
/**
 * Insert `elem` after `other`, `other` must have a parent
 */
dommy.core.insert_after_BANG_ = (function dommy$core$insert_after_BANG_(elem,other){
var temp__5802__auto___71009 = other.nextSibling;
if(cljs.core.truth_(temp__5802__auto___71009)){
var next_71010 = temp__5802__auto___71009;
dommy.core.insert_before_BANG_(elem,next_71010);
} else {
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(dommy.core.parent(other),elem);
}

return elem;
});
/**
 * Replace `elem` with `new`, return `new`
 */
dommy.core.replace_BANG_ = (function dommy$core$replace_BANG_(elem,new$){
var p = dommy.core.parent(elem);
if(cljs.core.truth_(p)){
} else {
throw (new Error(["Assert failed: ","Target element must have a parent","\n","p"].join('')));
}

p.replaceChild(new$,elem);

return new$;
});
/**
 * Replace children of `elem` with `child`
 */
dommy.core.replace_contents_BANG_ = (function dommy$core$replace_contents_BANG_(p,child){
return dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(dommy.core.clear_BANG_(p),child);
});
/**
 * Remove `elem` from `parent`, return `parent`
 */
dommy.core.remove_BANG_ = (function dommy$core$remove_BANG_(var_args){
var G__70228 = arguments.length;
switch (G__70228) {
case 1:
return dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (elem){
var p = dommy.core.parent(elem);
if(cljs.core.truth_(p)){
} else {
throw (new Error(["Assert failed: ","Target element must have a parent","\n","p"].join('')));
}

return dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$2(p,elem);
}));

(dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (p,elem){
var G__70229 = p;
G__70229.removeChild(elem);

return G__70229;
}));

(dommy.core.remove_BANG_.cljs$lang$maxFixedArity = 2);

dommy.core.special_listener_makers = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70230){
var vec__70231 = p__70230;
var special_mouse_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70231,(0),null);
var real_mouse_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70231,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [special_mouse_event,cljs.core.PersistentArrayMap.createAsIfByAssoc([real_mouse_event,(function (f){
return (function (event){
var related_target = event.relatedTarget;
var listener_target = (function (){var or__5002__auto__ = event.selectedTarget;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return event.currentTarget;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = related_target;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.descendant_QMARK_(related_target,listener_target);
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(event) : f.call(null,event));
}
});
})])], null);
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mouseenter","mouseenter",-1792413560),new cljs.core.Keyword(null,"mouseover","mouseover",-484272303),new cljs.core.Keyword(null,"mouseleave","mouseleave",531566580),new cljs.core.Keyword(null,"mouseout","mouseout",2049446890)], null)));
/**
 * fires f if event.target is found with `selector`
 */
dommy.core.live_listener = (function dommy$core$live_listener(elem,selector,f){
return (function (event){
var selected_target = dommy.core.closest.cljs$core$IFn$_invoke$arity$3(elem,event.target,selector);
if(cljs.core.truth_((function (){var and__5000__auto__ = selected_target;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(dommy.core.attr(selected_target,new cljs.core.Keyword(null,"disabled","disabled",-1529784218)));
} else {
return and__5000__auto__;
}
})())){
(event.selectedTarget = selected_target);

return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(event) : f.call(null,event));
} else {
return null;
}
});
});
/**
 * Returns a nested map of event listeners on `elem`
 */
dommy.core.event_listeners = (function dommy$core$event_listeners(elem){
var or__5002__auto__ = elem.dommyEventListeners;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
});
dommy.core.update_event_listeners_BANG_ = (function dommy$core$update_event_listeners_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71020 = arguments.length;
var i__5727__auto___71021 = (0);
while(true){
if((i__5727__auto___71021 < len__5726__auto___71020)){
args__5732__auto__.push((arguments[i__5727__auto___71021]));

var G__71022 = (i__5727__auto___71021 + (1));
i__5727__auto___71021 = G__71022;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,f,args){
var elem__$1 = elem;
return (elem__$1.dommyEventListeners = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,dommy.core.event_listeners(elem__$1),args));
}));

(dommy.core.update_event_listeners_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(dommy.core.update_event_listeners_BANG_.cljs$lang$applyTo = (function (seq70234){
var G__70235 = cljs.core.first(seq70234);
var seq70234__$1 = cljs.core.next(seq70234);
var G__70236 = cljs.core.first(seq70234__$1);
var seq70234__$2 = cljs.core.next(seq70234__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70235,G__70236,seq70234__$2);
}));

dommy.core.elem_and_selector = (function dommy$core$elem_and_selector(elem_sel){
if(cljs.core.sequential_QMARK_(elem_sel)){
return cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.rest)(elem_sel);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [elem_sel,null], null);
}
});
/**
 * Adds `f` as a listener for events of type `event-type` on
 * `elem-sel`, which must either be a DOM node, or a sequence
 * whose first item is a DOM node.
 * 
 * In other words, the call to `listen!` can take two forms:
 * 
 * If `elem-sel` is a DOM node, i.e., you're doing something like:
 * 
 *     (listen! elem :click click-handler)
 * 
 * then `click-handler` will be set as a listener for `click` events
 * on the `elem`.
 * 
 * If `elem-sel` is a sequence:
 * 
 *     (listen! [elem :.selector.for :.some.descendants] :click click-handler)
 * 
 * then `click-handler` will be set as a listener for `click` events
 * on descendants of `elem` that match the selector
 * 
 * Also accepts any number of event-type and handler pairs for setting
 * multiple listeners at once:
 * 
 *     (listen! some-elem :click click-handler :hover hover-handler)
 */
dommy.core.listen_BANG_ = (function dommy$core$listen_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71025 = arguments.length;
var i__5727__auto___71026 = (0);
while(true){
if((i__5727__auto___71026 < len__5726__auto___71025)){
args__5732__auto__.push((arguments[i__5727__auto___71026]));

var G__71027 = (i__5727__auto___71026 + (1));
i__5727__auto___71026 = G__71027;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem_sel,type_fs){
if(cljs.core.even_QMARK_(cljs.core.count(type_fs))){
} else {
throw (new Error("Assert failed: (even? (count type-fs))"));
}

var vec__70245_71028 = dommy.core.elem_and_selector(elem_sel);
var elem_71029 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70245_71028,(0),null);
var selector_71030 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70245_71028,(1),null);
var seq__70248_71031 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__70255_71032 = null;
var count__70256_71033 = (0);
var i__70257_71034 = (0);
while(true){
if((i__70257_71034 < count__70256_71033)){
var vec__70356_71035 = chunk__70255_71032.cljs$core$IIndexed$_nth$arity$2(null,i__70257_71034);
var orig_type_71036 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70356_71035,(0),null);
var f_71037 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70356_71035,(1),null);
var seq__70258_71040 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_71036,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_71036,cljs.core.identity])));
var chunk__70260_71041 = null;
var count__70261_71042 = (0);
var i__70262_71043 = (0);
while(true){
if((i__70262_71043 < count__70261_71042)){
var vec__70377_71044 = chunk__70260_71041.cljs$core$IIndexed$_nth$arity$2(null,i__70262_71043);
var actual_type_71045 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70377_71044,(0),null);
var factory_71046 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70377_71044,(1),null);
var canonical_f_71047 = (function (){var G__70381 = (factory_71046.cljs$core$IFn$_invoke$arity$1 ? factory_71046.cljs$core$IFn$_invoke$arity$1(f_71037) : factory_71046.call(null,f_71037));
var fexpr__70380 = (cljs.core.truth_(selector_71030)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_71029,selector_71030):cljs.core.identity);
return (fexpr__70380.cljs$core$IFn$_invoke$arity$1 ? fexpr__70380.cljs$core$IFn$_invoke$arity$1(G__70381) : fexpr__70380.call(null,G__70381));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71029,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71030,actual_type_71045,f_71037], null),canonical_f_71047], 0));

if(cljs.core.truth_(elem_71029.addEventListener)){
elem_71029.addEventListener(cljs.core.name(actual_type_71045),canonical_f_71047);
} else {
elem_71029.attachEvent(cljs.core.name(actual_type_71045),canonical_f_71047);
}


var G__71050 = seq__70258_71040;
var G__71051 = chunk__70260_71041;
var G__71052 = count__70261_71042;
var G__71053 = (i__70262_71043 + (1));
seq__70258_71040 = G__71050;
chunk__70260_71041 = G__71051;
count__70261_71042 = G__71052;
i__70262_71043 = G__71053;
continue;
} else {
var temp__5804__auto___71054 = cljs.core.seq(seq__70258_71040);
if(temp__5804__auto___71054){
var seq__70258_71055__$1 = temp__5804__auto___71054;
if(cljs.core.chunked_seq_QMARK_(seq__70258_71055__$1)){
var c__5525__auto___71056 = cljs.core.chunk_first(seq__70258_71055__$1);
var G__71057 = cljs.core.chunk_rest(seq__70258_71055__$1);
var G__71058 = c__5525__auto___71056;
var G__71059 = cljs.core.count(c__5525__auto___71056);
var G__71060 = (0);
seq__70258_71040 = G__71057;
chunk__70260_71041 = G__71058;
count__70261_71042 = G__71059;
i__70262_71043 = G__71060;
continue;
} else {
var vec__70383_71061 = cljs.core.first(seq__70258_71055__$1);
var actual_type_71062 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70383_71061,(0),null);
var factory_71063 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70383_71061,(1),null);
var canonical_f_71064 = (function (){var G__70387 = (factory_71063.cljs$core$IFn$_invoke$arity$1 ? factory_71063.cljs$core$IFn$_invoke$arity$1(f_71037) : factory_71063.call(null,f_71037));
var fexpr__70386 = (cljs.core.truth_(selector_71030)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_71029,selector_71030):cljs.core.identity);
return (fexpr__70386.cljs$core$IFn$_invoke$arity$1 ? fexpr__70386.cljs$core$IFn$_invoke$arity$1(G__70387) : fexpr__70386.call(null,G__70387));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71029,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71030,actual_type_71062,f_71037], null),canonical_f_71064], 0));

if(cljs.core.truth_(elem_71029.addEventListener)){
elem_71029.addEventListener(cljs.core.name(actual_type_71062),canonical_f_71064);
} else {
elem_71029.attachEvent(cljs.core.name(actual_type_71062),canonical_f_71064);
}


var G__71065 = cljs.core.next(seq__70258_71055__$1);
var G__71066 = null;
var G__71067 = (0);
var G__71068 = (0);
seq__70258_71040 = G__71065;
chunk__70260_71041 = G__71066;
count__70261_71042 = G__71067;
i__70262_71043 = G__71068;
continue;
}
} else {
}
}
break;
}

var G__71069 = seq__70248_71031;
var G__71070 = chunk__70255_71032;
var G__71071 = count__70256_71033;
var G__71072 = (i__70257_71034 + (1));
seq__70248_71031 = G__71069;
chunk__70255_71032 = G__71070;
count__70256_71033 = G__71071;
i__70257_71034 = G__71072;
continue;
} else {
var temp__5804__auto___71073 = cljs.core.seq(seq__70248_71031);
if(temp__5804__auto___71073){
var seq__70248_71074__$1 = temp__5804__auto___71073;
if(cljs.core.chunked_seq_QMARK_(seq__70248_71074__$1)){
var c__5525__auto___71075 = cljs.core.chunk_first(seq__70248_71074__$1);
var G__71076 = cljs.core.chunk_rest(seq__70248_71074__$1);
var G__71077 = c__5525__auto___71075;
var G__71078 = cljs.core.count(c__5525__auto___71075);
var G__71079 = (0);
seq__70248_71031 = G__71076;
chunk__70255_71032 = G__71077;
count__70256_71033 = G__71078;
i__70257_71034 = G__71079;
continue;
} else {
var vec__70395_71081 = cljs.core.first(seq__70248_71074__$1);
var orig_type_71082 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70395_71081,(0),null);
var f_71083 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70395_71081,(1),null);
var seq__70249_71084 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_71082,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_71082,cljs.core.identity])));
var chunk__70251_71085 = null;
var count__70252_71086 = (0);
var i__70253_71087 = (0);
while(true){
if((i__70253_71087 < count__70252_71086)){
var vec__70415_71088 = chunk__70251_71085.cljs$core$IIndexed$_nth$arity$2(null,i__70253_71087);
var actual_type_71089 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70415_71088,(0),null);
var factory_71090 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70415_71088,(1),null);
var canonical_f_71091 = (function (){var G__70422 = (factory_71090.cljs$core$IFn$_invoke$arity$1 ? factory_71090.cljs$core$IFn$_invoke$arity$1(f_71083) : factory_71090.call(null,f_71083));
var fexpr__70421 = (cljs.core.truth_(selector_71030)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_71029,selector_71030):cljs.core.identity);
return (fexpr__70421.cljs$core$IFn$_invoke$arity$1 ? fexpr__70421.cljs$core$IFn$_invoke$arity$1(G__70422) : fexpr__70421.call(null,G__70422));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71029,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71030,actual_type_71089,f_71083], null),canonical_f_71091], 0));

if(cljs.core.truth_(elem_71029.addEventListener)){
elem_71029.addEventListener(cljs.core.name(actual_type_71089),canonical_f_71091);
} else {
elem_71029.attachEvent(cljs.core.name(actual_type_71089),canonical_f_71091);
}


var G__71092 = seq__70249_71084;
var G__71093 = chunk__70251_71085;
var G__71094 = count__70252_71086;
var G__71095 = (i__70253_71087 + (1));
seq__70249_71084 = G__71092;
chunk__70251_71085 = G__71093;
count__70252_71086 = G__71094;
i__70253_71087 = G__71095;
continue;
} else {
var temp__5804__auto___71096__$1 = cljs.core.seq(seq__70249_71084);
if(temp__5804__auto___71096__$1){
var seq__70249_71097__$1 = temp__5804__auto___71096__$1;
if(cljs.core.chunked_seq_QMARK_(seq__70249_71097__$1)){
var c__5525__auto___71098 = cljs.core.chunk_first(seq__70249_71097__$1);
var G__71099 = cljs.core.chunk_rest(seq__70249_71097__$1);
var G__71100 = c__5525__auto___71098;
var G__71101 = cljs.core.count(c__5525__auto___71098);
var G__71102 = (0);
seq__70249_71084 = G__71099;
chunk__70251_71085 = G__71100;
count__70252_71086 = G__71101;
i__70253_71087 = G__71102;
continue;
} else {
var vec__70423_71103 = cljs.core.first(seq__70249_71097__$1);
var actual_type_71104 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70423_71103,(0),null);
var factory_71105 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70423_71103,(1),null);
var canonical_f_71106 = (function (){var G__70427 = (factory_71105.cljs$core$IFn$_invoke$arity$1 ? factory_71105.cljs$core$IFn$_invoke$arity$1(f_71083) : factory_71105.call(null,f_71083));
var fexpr__70426 = (cljs.core.truth_(selector_71030)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_71029,selector_71030):cljs.core.identity);
return (fexpr__70426.cljs$core$IFn$_invoke$arity$1 ? fexpr__70426.cljs$core$IFn$_invoke$arity$1(G__70427) : fexpr__70426.call(null,G__70427));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71029,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71030,actual_type_71104,f_71083], null),canonical_f_71106], 0));

if(cljs.core.truth_(elem_71029.addEventListener)){
elem_71029.addEventListener(cljs.core.name(actual_type_71104),canonical_f_71106);
} else {
elem_71029.attachEvent(cljs.core.name(actual_type_71104),canonical_f_71106);
}


var G__71108 = cljs.core.next(seq__70249_71097__$1);
var G__71109 = null;
var G__71110 = (0);
var G__71111 = (0);
seq__70249_71084 = G__71108;
chunk__70251_71085 = G__71109;
count__70252_71086 = G__71110;
i__70253_71087 = G__71111;
continue;
}
} else {
}
}
break;
}

var G__71112 = cljs.core.next(seq__70248_71074__$1);
var G__71113 = null;
var G__71114 = (0);
var G__71115 = (0);
seq__70248_71031 = G__71112;
chunk__70255_71032 = G__71113;
count__70256_71033 = G__71114;
i__70257_71034 = G__71115;
continue;
}
} else {
}
}
break;
}

return elem_sel;
}));

(dommy.core.listen_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.listen_BANG_.cljs$lang$applyTo = (function (seq70241){
var G__70242 = cljs.core.first(seq70241);
var seq70241__$1 = cljs.core.next(seq70241);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70242,seq70241__$1);
}));

/**
 * Removes event listener for the element defined in `elem-sel`,
 * which is the same format as listen!.
 * 
 *   The following forms are allowed, and will remove all handlers
 *   that match the parameters passed in:
 * 
 *    (unlisten! [elem :.selector] :click event-listener)
 * 
 *    (unlisten! [elem :.selector]
 *      :click event-listener
 *      :mouseover other-event-listener)
 */
dommy.core.unlisten_BANG_ = (function dommy$core$unlisten_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71116 = arguments.length;
var i__5727__auto___71117 = (0);
while(true){
if((i__5727__auto___71117 < len__5726__auto___71116)){
args__5732__auto__.push((arguments[i__5727__auto___71117]));

var G__71118 = (i__5727__auto___71117 + (1));
i__5727__auto___71117 = G__71118;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem_sel,type_fs){
if(cljs.core.even_QMARK_(cljs.core.count(type_fs))){
} else {
throw (new Error("Assert failed: (even? (count type-fs))"));
}

var vec__70443_71119 = dommy.core.elem_and_selector(elem_sel);
var elem_71120 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70443_71119,(0),null);
var selector_71121 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70443_71119,(1),null);
var seq__70448_71122 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__70455_71123 = null;
var count__70456_71124 = (0);
var i__70457_71125 = (0);
while(true){
if((i__70457_71125 < count__70456_71124)){
var vec__70569_71126 = chunk__70455_71123.cljs$core$IIndexed$_nth$arity$2(null,i__70457_71125);
var orig_type_71127 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70569_71126,(0),null);
var f_71128 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70569_71126,(1),null);
var seq__70458_71129 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_71127,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_71127,cljs.core.identity])));
var chunk__70460_71130 = null;
var count__70461_71131 = (0);
var i__70462_71132 = (0);
while(true){
if((i__70462_71132 < count__70461_71131)){
var vec__70590_71133 = chunk__70460_71130.cljs$core$IIndexed$_nth$arity$2(null,i__70462_71132);
var actual_type_71134 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70590_71133,(0),null);
var __71135 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70590_71133,(1),null);
var keys_71137 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71121,actual_type_71134,f_71128], null);
var canonical_f_71138 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_71120),keys_71137);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71120,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_71137], 0));

if(cljs.core.truth_(elem_71120.removeEventListener)){
elem_71120.removeEventListener(cljs.core.name(actual_type_71134),canonical_f_71138);
} else {
elem_71120.detachEvent(cljs.core.name(actual_type_71134),canonical_f_71138);
}


var G__71139 = seq__70458_71129;
var G__71140 = chunk__70460_71130;
var G__71141 = count__70461_71131;
var G__71142 = (i__70462_71132 + (1));
seq__70458_71129 = G__71139;
chunk__70460_71130 = G__71140;
count__70461_71131 = G__71141;
i__70462_71132 = G__71142;
continue;
} else {
var temp__5804__auto___71143 = cljs.core.seq(seq__70458_71129);
if(temp__5804__auto___71143){
var seq__70458_71144__$1 = temp__5804__auto___71143;
if(cljs.core.chunked_seq_QMARK_(seq__70458_71144__$1)){
var c__5525__auto___71145 = cljs.core.chunk_first(seq__70458_71144__$1);
var G__71146 = cljs.core.chunk_rest(seq__70458_71144__$1);
var G__71147 = c__5525__auto___71145;
var G__71148 = cljs.core.count(c__5525__auto___71145);
var G__71149 = (0);
seq__70458_71129 = G__71146;
chunk__70460_71130 = G__71147;
count__70461_71131 = G__71148;
i__70462_71132 = G__71149;
continue;
} else {
var vec__70603_71150 = cljs.core.first(seq__70458_71144__$1);
var actual_type_71151 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70603_71150,(0),null);
var __71152 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70603_71150,(1),null);
var keys_71153 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71121,actual_type_71151,f_71128], null);
var canonical_f_71154 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_71120),keys_71153);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71120,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_71153], 0));

if(cljs.core.truth_(elem_71120.removeEventListener)){
elem_71120.removeEventListener(cljs.core.name(actual_type_71151),canonical_f_71154);
} else {
elem_71120.detachEvent(cljs.core.name(actual_type_71151),canonical_f_71154);
}


var G__71155 = cljs.core.next(seq__70458_71144__$1);
var G__71156 = null;
var G__71157 = (0);
var G__71158 = (0);
seq__70458_71129 = G__71155;
chunk__70460_71130 = G__71156;
count__70461_71131 = G__71157;
i__70462_71132 = G__71158;
continue;
}
} else {
}
}
break;
}

var G__71159 = seq__70448_71122;
var G__71160 = chunk__70455_71123;
var G__71161 = count__70456_71124;
var G__71162 = (i__70457_71125 + (1));
seq__70448_71122 = G__71159;
chunk__70455_71123 = G__71160;
count__70456_71124 = G__71161;
i__70457_71125 = G__71162;
continue;
} else {
var temp__5804__auto___71163 = cljs.core.seq(seq__70448_71122);
if(temp__5804__auto___71163){
var seq__70448_71164__$1 = temp__5804__auto___71163;
if(cljs.core.chunked_seq_QMARK_(seq__70448_71164__$1)){
var c__5525__auto___71165 = cljs.core.chunk_first(seq__70448_71164__$1);
var G__71166 = cljs.core.chunk_rest(seq__70448_71164__$1);
var G__71167 = c__5525__auto___71165;
var G__71168 = cljs.core.count(c__5525__auto___71165);
var G__71169 = (0);
seq__70448_71122 = G__71166;
chunk__70455_71123 = G__71167;
count__70456_71124 = G__71168;
i__70457_71125 = G__71169;
continue;
} else {
var vec__70610_71170 = cljs.core.first(seq__70448_71164__$1);
var orig_type_71171 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70610_71170,(0),null);
var f_71172 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70610_71170,(1),null);
var seq__70449_71173 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_71171,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_71171,cljs.core.identity])));
var chunk__70451_71174 = null;
var count__70452_71175 = (0);
var i__70453_71176 = (0);
while(true){
if((i__70453_71176 < count__70452_71175)){
var vec__70635_71177 = chunk__70451_71174.cljs$core$IIndexed$_nth$arity$2(null,i__70453_71176);
var actual_type_71178 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70635_71177,(0),null);
var __71179 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70635_71177,(1),null);
var keys_71180 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71121,actual_type_71178,f_71172], null);
var canonical_f_71181 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_71120),keys_71180);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71120,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_71180], 0));

if(cljs.core.truth_(elem_71120.removeEventListener)){
elem_71120.removeEventListener(cljs.core.name(actual_type_71178),canonical_f_71181);
} else {
elem_71120.detachEvent(cljs.core.name(actual_type_71178),canonical_f_71181);
}


var G__71182 = seq__70449_71173;
var G__71183 = chunk__70451_71174;
var G__71184 = count__70452_71175;
var G__71185 = (i__70453_71176 + (1));
seq__70449_71173 = G__71182;
chunk__70451_71174 = G__71183;
count__70452_71175 = G__71184;
i__70453_71176 = G__71185;
continue;
} else {
var temp__5804__auto___71186__$1 = cljs.core.seq(seq__70449_71173);
if(temp__5804__auto___71186__$1){
var seq__70449_71187__$1 = temp__5804__auto___71186__$1;
if(cljs.core.chunked_seq_QMARK_(seq__70449_71187__$1)){
var c__5525__auto___71188 = cljs.core.chunk_first(seq__70449_71187__$1);
var G__71189 = cljs.core.chunk_rest(seq__70449_71187__$1);
var G__71190 = c__5525__auto___71188;
var G__71191 = cljs.core.count(c__5525__auto___71188);
var G__71192 = (0);
seq__70449_71173 = G__71189;
chunk__70451_71174 = G__71190;
count__70452_71175 = G__71191;
i__70453_71176 = G__71192;
continue;
} else {
var vec__70638_71193 = cljs.core.first(seq__70449_71187__$1);
var actual_type_71194 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70638_71193,(0),null);
var __71195 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70638_71193,(1),null);
var keys_71196 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_71121,actual_type_71194,f_71172], null);
var canonical_f_71197 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_71120),keys_71196);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_71120,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_71196], 0));

if(cljs.core.truth_(elem_71120.removeEventListener)){
elem_71120.removeEventListener(cljs.core.name(actual_type_71194),canonical_f_71197);
} else {
elem_71120.detachEvent(cljs.core.name(actual_type_71194),canonical_f_71197);
}


var G__71198 = cljs.core.next(seq__70449_71187__$1);
var G__71199 = null;
var G__71200 = (0);
var G__71201 = (0);
seq__70449_71173 = G__71198;
chunk__70451_71174 = G__71199;
count__70452_71175 = G__71200;
i__70453_71176 = G__71201;
continue;
}
} else {
}
}
break;
}

var G__71202 = cljs.core.next(seq__70448_71164__$1);
var G__71203 = null;
var G__71204 = (0);
var G__71205 = (0);
seq__70448_71122 = G__71202;
chunk__70455_71123 = G__71203;
count__70456_71124 = G__71204;
i__70457_71125 = G__71205;
continue;
}
} else {
}
}
break;
}

return elem_sel;
}));

(dommy.core.unlisten_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.unlisten_BANG_.cljs$lang$applyTo = (function (seq70430){
var G__70431 = cljs.core.first(seq70430);
var seq70430__$1 = cljs.core.next(seq70430);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70431,seq70430__$1);
}));

/**
 * Behaves like `listen!`, but removes the listener after the first event occurs.
 */
dommy.core.listen_once_BANG_ = (function dommy$core$listen_once_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71206 = arguments.length;
var i__5727__auto___71207 = (0);
while(true){
if((i__5727__auto___71207 < len__5726__auto___71206)){
args__5732__auto__.push((arguments[i__5727__auto___71207]));

var G__71208 = (i__5727__auto___71207 + (1));
i__5727__auto___71207 = G__71208;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return dommy.core.listen_once_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(dommy.core.listen_once_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem_sel,type_fs){
if(cljs.core.even_QMARK_(cljs.core.count(type_fs))){
} else {
throw (new Error("Assert failed: (even? (count type-fs))"));
}

var vec__70668_71209 = dommy.core.elem_and_selector(elem_sel);
var elem_71210 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70668_71209,(0),null);
var selector_71211 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70668_71209,(1),null);
var seq__70671_71212 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__70672_71213 = null;
var count__70673_71214 = (0);
var i__70674_71215 = (0);
while(true){
if((i__70674_71215 < count__70673_71214)){
var vec__70681_71216 = chunk__70672_71213.cljs$core$IIndexed$_nth$arity$2(null,i__70674_71215);
var type_71217 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70681_71216,(0),null);
var f_71218 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70681_71216,(1),null);
dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_71217,((function (seq__70671_71212,chunk__70672_71213,count__70673_71214,i__70674_71215,vec__70681_71216,type_71217,f_71218,vec__70668_71209,elem_71210,selector_71211){
return (function dommy$core$this_fn(e){
dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_71217,dommy$core$this_fn], 0));

return (f_71218.cljs$core$IFn$_invoke$arity$1 ? f_71218.cljs$core$IFn$_invoke$arity$1(e) : f_71218.call(null,e));
});})(seq__70671_71212,chunk__70672_71213,count__70673_71214,i__70674_71215,vec__70681_71216,type_71217,f_71218,vec__70668_71209,elem_71210,selector_71211))
], 0));


var G__71221 = seq__70671_71212;
var G__71222 = chunk__70672_71213;
var G__71223 = count__70673_71214;
var G__71224 = (i__70674_71215 + (1));
seq__70671_71212 = G__71221;
chunk__70672_71213 = G__71222;
count__70673_71214 = G__71223;
i__70674_71215 = G__71224;
continue;
} else {
var temp__5804__auto___71225 = cljs.core.seq(seq__70671_71212);
if(temp__5804__auto___71225){
var seq__70671_71226__$1 = temp__5804__auto___71225;
if(cljs.core.chunked_seq_QMARK_(seq__70671_71226__$1)){
var c__5525__auto___71227 = cljs.core.chunk_first(seq__70671_71226__$1);
var G__71228 = cljs.core.chunk_rest(seq__70671_71226__$1);
var G__71229 = c__5525__auto___71227;
var G__71230 = cljs.core.count(c__5525__auto___71227);
var G__71231 = (0);
seq__70671_71212 = G__71228;
chunk__70672_71213 = G__71229;
count__70673_71214 = G__71230;
i__70674_71215 = G__71231;
continue;
} else {
var vec__70685_71232 = cljs.core.first(seq__70671_71226__$1);
var type_71233 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70685_71232,(0),null);
var f_71234 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70685_71232,(1),null);
dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_71233,((function (seq__70671_71212,chunk__70672_71213,count__70673_71214,i__70674_71215,vec__70685_71232,type_71233,f_71234,seq__70671_71226__$1,temp__5804__auto___71225,vec__70668_71209,elem_71210,selector_71211){
return (function dommy$core$this_fn(e){
dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_71233,dommy$core$this_fn], 0));

return (f_71234.cljs$core$IFn$_invoke$arity$1 ? f_71234.cljs$core$IFn$_invoke$arity$1(e) : f_71234.call(null,e));
});})(seq__70671_71212,chunk__70672_71213,count__70673_71214,i__70674_71215,vec__70685_71232,type_71233,f_71234,seq__70671_71226__$1,temp__5804__auto___71225,vec__70668_71209,elem_71210,selector_71211))
], 0));


var G__71235 = cljs.core.next(seq__70671_71226__$1);
var G__71236 = null;
var G__71237 = (0);
var G__71238 = (0);
seq__70671_71212 = G__71235;
chunk__70672_71213 = G__71236;
count__70673_71214 = G__71237;
i__70674_71215 = G__71238;
continue;
}
} else {
}
}
break;
}

return elem_sel;
}));

(dommy.core.listen_once_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(dommy.core.listen_once_BANG_.cljs$lang$applyTo = (function (seq70666){
var G__70667 = cljs.core.first(seq70666);
var seq70666__$1 = cljs.core.next(seq70666);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70667,seq70666__$1);
}));


//# sourceMappingURL=dommy.core.js.map
