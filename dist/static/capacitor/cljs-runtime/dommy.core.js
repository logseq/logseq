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
var G__71066 = arguments.length;
switch (G__71066) {
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
var G__71079 = arguments.length;
switch (G__71079) {
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
var G__71086 = arguments.length;
switch (G__71086) {
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
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(dommy.core.matches_pred.cljs$core$IFn$_invoke$arity$2(base,selector),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__71084_SHARP_){
return (!((p1__71084_SHARP_ === base)));
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
var len__5726__auto___71848 = arguments.length;
var i__5727__auto___71849 = (0);
while(true){
if((i__5727__auto___71849 < len__5726__auto___71848)){
args__5732__auto__.push((arguments[i__5727__auto___71849]));

var G__71851 = (i__5727__auto___71849 + (1));
i__5727__auto___71849 = G__71851;
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
var seq__71132_71852 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs));
var chunk__71133_71853 = null;
var count__71134_71854 = (0);
var i__71135_71855 = (0);
while(true){
if((i__71135_71855 < count__71134_71854)){
var vec__71158_71856 = chunk__71133_71853.cljs$core$IIndexed$_nth$arity$2(null,i__71135_71855);
var k_71857 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71158_71856,(0),null);
var v_71858 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71158_71856,(1),null);
style.setProperty(dommy.utils.as_str(k_71857),v_71858);


var G__71859 = seq__71132_71852;
var G__71860 = chunk__71133_71853;
var G__71861 = count__71134_71854;
var G__71862 = (i__71135_71855 + (1));
seq__71132_71852 = G__71859;
chunk__71133_71853 = G__71860;
count__71134_71854 = G__71861;
i__71135_71855 = G__71862;
continue;
} else {
var temp__5804__auto___71863 = cljs.core.seq(seq__71132_71852);
if(temp__5804__auto___71863){
var seq__71132_71864__$1 = temp__5804__auto___71863;
if(cljs.core.chunked_seq_QMARK_(seq__71132_71864__$1)){
var c__5525__auto___71865 = cljs.core.chunk_first(seq__71132_71864__$1);
var G__71866 = cljs.core.chunk_rest(seq__71132_71864__$1);
var G__71867 = c__5525__auto___71865;
var G__71868 = cljs.core.count(c__5525__auto___71865);
var G__71869 = (0);
seq__71132_71852 = G__71866;
chunk__71133_71853 = G__71867;
count__71134_71854 = G__71868;
i__71135_71855 = G__71869;
continue;
} else {
var vec__71165_71870 = cljs.core.first(seq__71132_71864__$1);
var k_71871 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71165_71870,(0),null);
var v_71872 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71165_71870,(1),null);
style.setProperty(dommy.utils.as_str(k_71871),v_71872);


var G__71874 = cljs.core.next(seq__71132_71864__$1);
var G__71875 = null;
var G__71876 = (0);
var G__71877 = (0);
seq__71132_71852 = G__71874;
chunk__71133_71853 = G__71875;
count__71134_71854 = G__71876;
i__71135_71855 = G__71877;
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
(dommy.core.set_style_BANG_.cljs$lang$applyTo = (function (seq71128){
var G__71129 = cljs.core.first(seq71128);
var seq71128__$1 = cljs.core.next(seq71128);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71129,seq71128__$1);
}));

/**
 * Remove the style of `elem` using keywords:
 *   
 *    (remove-style! elem :display :color)
 */
dommy.core.remove_style_BANG_ = (function dommy$core$remove_style_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71880 = arguments.length;
var i__5727__auto___71881 = (0);
while(true){
if((i__5727__auto___71881 < len__5726__auto___71880)){
args__5732__auto__.push((arguments[i__5727__auto___71881]));

var G__71884 = (i__5727__auto___71881 + (1));
i__5727__auto___71881 = G__71884;
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
var seq__71171_71889 = cljs.core.seq(keywords);
var chunk__71172_71890 = null;
var count__71173_71891 = (0);
var i__71174_71892 = (0);
while(true){
if((i__71174_71892 < count__71173_71891)){
var kw_71893 = chunk__71172_71890.cljs$core$IIndexed$_nth$arity$2(null,i__71174_71892);
style.removeProperty(dommy.utils.as_str(kw_71893));


var G__71894 = seq__71171_71889;
var G__71895 = chunk__71172_71890;
var G__71896 = count__71173_71891;
var G__71897 = (i__71174_71892 + (1));
seq__71171_71889 = G__71894;
chunk__71172_71890 = G__71895;
count__71173_71891 = G__71896;
i__71174_71892 = G__71897;
continue;
} else {
var temp__5804__auto___71898 = cljs.core.seq(seq__71171_71889);
if(temp__5804__auto___71898){
var seq__71171_71899__$1 = temp__5804__auto___71898;
if(cljs.core.chunked_seq_QMARK_(seq__71171_71899__$1)){
var c__5525__auto___71901 = cljs.core.chunk_first(seq__71171_71899__$1);
var G__71902 = cljs.core.chunk_rest(seq__71171_71899__$1);
var G__71903 = c__5525__auto___71901;
var G__71904 = cljs.core.count(c__5525__auto___71901);
var G__71905 = (0);
seq__71171_71889 = G__71902;
chunk__71172_71890 = G__71903;
count__71173_71891 = G__71904;
i__71174_71892 = G__71905;
continue;
} else {
var kw_71906 = cljs.core.first(seq__71171_71899__$1);
style.removeProperty(dommy.utils.as_str(kw_71906));


var G__71907 = cljs.core.next(seq__71171_71899__$1);
var G__71908 = null;
var G__71909 = (0);
var G__71910 = (0);
seq__71171_71889 = G__71907;
chunk__71172_71890 = G__71908;
count__71173_71891 = G__71909;
i__71174_71892 = G__71910;
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
(dommy.core.remove_style_BANG_.cljs$lang$applyTo = (function (seq71168){
var G__71169 = cljs.core.first(seq71168);
var seq71168__$1 = cljs.core.next(seq71168);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71169,seq71168__$1);
}));

dommy.core.set_px_BANG_ = (function dommy$core$set_px_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71912 = arguments.length;
var i__5727__auto___71913 = (0);
while(true){
if((i__5727__auto___71913 < len__5726__auto___71912)){
args__5732__auto__.push((arguments[i__5727__auto___71913]));

var G__71914 = (i__5727__auto___71913 + (1));
i__5727__auto___71913 = G__71914;
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

var seq__71251_71917 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs));
var chunk__71252_71918 = null;
var count__71253_71919 = (0);
var i__71254_71920 = (0);
while(true){
if((i__71254_71920 < count__71253_71919)){
var vec__71283_71921 = chunk__71252_71918.cljs$core$IIndexed$_nth$arity$2(null,i__71254_71920);
var k_71922 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71283_71921,(0),null);
var v_71923 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71283_71921,(1),null);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k_71922,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_71923),"px"].join('')], 0));


var G__71925 = seq__71251_71917;
var G__71926 = chunk__71252_71918;
var G__71927 = count__71253_71919;
var G__71928 = (i__71254_71920 + (1));
seq__71251_71917 = G__71925;
chunk__71252_71918 = G__71926;
count__71253_71919 = G__71927;
i__71254_71920 = G__71928;
continue;
} else {
var temp__5804__auto___71929 = cljs.core.seq(seq__71251_71917);
if(temp__5804__auto___71929){
var seq__71251_71930__$1 = temp__5804__auto___71929;
if(cljs.core.chunked_seq_QMARK_(seq__71251_71930__$1)){
var c__5525__auto___71931 = cljs.core.chunk_first(seq__71251_71930__$1);
var G__71932 = cljs.core.chunk_rest(seq__71251_71930__$1);
var G__71933 = c__5525__auto___71931;
var G__71934 = cljs.core.count(c__5525__auto___71931);
var G__71935 = (0);
seq__71251_71917 = G__71932;
chunk__71252_71918 = G__71933;
count__71253_71919 = G__71934;
i__71254_71920 = G__71935;
continue;
} else {
var vec__71292_71936 = cljs.core.first(seq__71251_71930__$1);
var k_71937 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71292_71936,(0),null);
var v_71938 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71292_71936,(1),null);
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k_71937,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_71938),"px"].join('')], 0));


var G__71939 = cljs.core.next(seq__71251_71930__$1);
var G__71940 = null;
var G__71941 = (0);
var G__71942 = (0);
seq__71251_71917 = G__71939;
chunk__71252_71918 = G__71940;
count__71253_71919 = G__71941;
i__71254_71920 = G__71942;
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
(dommy.core.set_px_BANG_.cljs$lang$applyTo = (function (seq71218){
var G__71219 = cljs.core.first(seq71218);
var seq71218__$1 = cljs.core.next(seq71218);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71219,seq71218__$1);
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
var G__71315 = arguments.length;
switch (G__71315) {
case 2:
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___71945 = arguments.length;
var i__5727__auto___71946 = (0);
while(true){
if((i__5727__auto___71946 < len__5726__auto___71945)){
args_arr__5751__auto__.push((arguments[i__5727__auto___71946]));

var G__71947 = (i__5727__auto___71946 + (1));
i__5727__auto___71946 = G__71947;
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
var G__71335 = elem;
(G__71335[k__$1] = v);

return G__71335;
} else {
var G__71338 = elem;
G__71338.setAttribute(k__$1,v);

return G__71338;
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

var seq__71341_71948 = cljs.core.seq(cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null),cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs)));
var chunk__71342_71949 = null;
var count__71343_71950 = (0);
var i__71344_71951 = (0);
while(true){
if((i__71344_71951 < count__71343_71950)){
var vec__71362_71952 = chunk__71342_71949.cljs$core$IIndexed$_nth$arity$2(null,i__71344_71951);
var k_71953__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71362_71952,(0),null);
var v_71954__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71362_71952,(1),null);
dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k_71953__$1,v_71954__$1);


var G__71955 = seq__71341_71948;
var G__71956 = chunk__71342_71949;
var G__71957 = count__71343_71950;
var G__71958 = (i__71344_71951 + (1));
seq__71341_71948 = G__71955;
chunk__71342_71949 = G__71956;
count__71343_71950 = G__71957;
i__71344_71951 = G__71958;
continue;
} else {
var temp__5804__auto___71959 = cljs.core.seq(seq__71341_71948);
if(temp__5804__auto___71959){
var seq__71341_71960__$1 = temp__5804__auto___71959;
if(cljs.core.chunked_seq_QMARK_(seq__71341_71960__$1)){
var c__5525__auto___71961 = cljs.core.chunk_first(seq__71341_71960__$1);
var G__71962 = cljs.core.chunk_rest(seq__71341_71960__$1);
var G__71963 = c__5525__auto___71961;
var G__71964 = cljs.core.count(c__5525__auto___71961);
var G__71965 = (0);
seq__71341_71948 = G__71962;
chunk__71342_71949 = G__71963;
count__71343_71950 = G__71964;
i__71344_71951 = G__71965;
continue;
} else {
var vec__71366_71966 = cljs.core.first(seq__71341_71960__$1);
var k_71967__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71366_71966,(0),null);
var v_71968__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71366_71966,(1),null);
dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(elem,k_71967__$1,v_71968__$1);


var G__71971 = cljs.core.next(seq__71341_71960__$1);
var G__71972 = null;
var G__71973 = (0);
var G__71974 = (0);
seq__71341_71948 = G__71971;
chunk__71342_71949 = G__71972;
count__71343_71950 = G__71973;
i__71344_71951 = G__71974;
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
(dommy.core.set_attr_BANG_.cljs$lang$applyTo = (function (seq71311){
var G__71312 = cljs.core.first(seq71311);
var seq71311__$1 = cljs.core.next(seq71311);
var G__71313 = cljs.core.first(seq71311__$1);
var seq71311__$2 = cljs.core.next(seq71311__$1);
var G__71314 = cljs.core.first(seq71311__$2);
var seq71311__$3 = cljs.core.next(seq71311__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71312,G__71313,G__71314,seq71311__$3);
}));

(dommy.core.set_attr_BANG_.cljs$lang$maxFixedArity = (3));

/**
 * Removes dom attributes on and returns `elem`.
 * `class` and `classes` are special cases which clear
 * out the class name on removal.
 */
dommy.core.remove_attr_BANG_ = (function dommy$core$remove_attr_BANG_(var_args){
var G__71380 = arguments.length;
switch (G__71380) {
case 2:
return dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___71978 = arguments.length;
var i__5727__auto___71979 = (0);
while(true){
if((i__5727__auto___71979 < len__5726__auto___71978)){
args_arr__5751__auto__.push((arguments[i__5727__auto___71979]));

var G__71980 = (i__5727__auto___71979 + (1));
i__5727__auto___71979 = G__71980;
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
var k_71981__$1 = dommy.utils.as_str(k);
if(cljs.core.truth_((function (){var fexpr__71388 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["class",null,"classes",null], null), null);
return (fexpr__71388.cljs$core$IFn$_invoke$arity$1 ? fexpr__71388.cljs$core$IFn$_invoke$arity$1(k_71981__$1) : fexpr__71388.call(null,k_71981__$1));
})())){
dommy.core.set_class_BANG_(elem,"");
} else {
elem.removeAttribute(k_71981__$1);
}

return elem;
}));

(dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,k,ks){
var seq__71393_71985 = cljs.core.seq(cljs.core.cons(k,ks));
var chunk__71394_71986 = null;
var count__71395_71987 = (0);
var i__71396_71988 = (0);
while(true){
if((i__71396_71988 < count__71395_71987)){
var k_71990__$1 = chunk__71394_71986.cljs$core$IIndexed$_nth$arity$2(null,i__71396_71988);
dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k_71990__$1);


var G__71991 = seq__71393_71985;
var G__71992 = chunk__71394_71986;
var G__71993 = count__71395_71987;
var G__71994 = (i__71396_71988 + (1));
seq__71393_71985 = G__71991;
chunk__71394_71986 = G__71992;
count__71395_71987 = G__71993;
i__71396_71988 = G__71994;
continue;
} else {
var temp__5804__auto___71995 = cljs.core.seq(seq__71393_71985);
if(temp__5804__auto___71995){
var seq__71393_71996__$1 = temp__5804__auto___71995;
if(cljs.core.chunked_seq_QMARK_(seq__71393_71996__$1)){
var c__5525__auto___71997 = cljs.core.chunk_first(seq__71393_71996__$1);
var G__71998 = cljs.core.chunk_rest(seq__71393_71996__$1);
var G__71999 = c__5525__auto___71997;
var G__72000 = cljs.core.count(c__5525__auto___71997);
var G__72001 = (0);
seq__71393_71985 = G__71998;
chunk__71394_71986 = G__71999;
count__71395_71987 = G__72000;
i__71396_71988 = G__72001;
continue;
} else {
var k_72002__$1 = cljs.core.first(seq__71393_71996__$1);
dommy.core.remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2(elem,k_72002__$1);


var G__72003 = cljs.core.next(seq__71393_71996__$1);
var G__72004 = null;
var G__72005 = (0);
var G__72006 = (0);
seq__71393_71985 = G__72003;
chunk__71394_71986 = G__72004;
count__71395_71987 = G__72005;
i__71396_71988 = G__72006;
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
(dommy.core.remove_attr_BANG_.cljs$lang$applyTo = (function (seq71377){
var G__71378 = cljs.core.first(seq71377);
var seq71377__$1 = cljs.core.next(seq71377);
var G__71379 = cljs.core.first(seq71377__$1);
var seq71377__$2 = cljs.core.next(seq71377__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71378,G__71379,seq71377__$2);
}));

(dommy.core.remove_attr_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Toggles a dom attribute `k` on `elem`, optionally specifying
 * the boolean value with `add?`
 */
dommy.core.toggle_attr_BANG_ = (function dommy$core$toggle_attr_BANG_(var_args){
var G__71410 = arguments.length;
switch (G__71410) {
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
var G__71433 = arguments.length;
switch (G__71433) {
case 2:
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___72009 = arguments.length;
var i__5727__auto___72010 = (0);
while(true){
if((i__5727__auto___72010 < len__5726__auto___72009)){
args_arr__5751__auto__.push((arguments[i__5727__auto___72010]));

var G__72012 = (i__5727__auto___72010 + (1));
i__5727__auto___72010 = G__72012;
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
var temp__5802__auto___72016 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___72016)){
var class_list_72017 = temp__5802__auto___72016;
var seq__71438_72018 = cljs.core.seq(classes__$1);
var chunk__71439_72019 = null;
var count__71440_72020 = (0);
var i__71441_72021 = (0);
while(true){
if((i__71441_72021 < count__71440_72020)){
var c_72022 = chunk__71439_72019.cljs$core$IIndexed$_nth$arity$2(null,i__71441_72021);
class_list_72017.add(c_72022);


var G__72023 = seq__71438_72018;
var G__72024 = chunk__71439_72019;
var G__72025 = count__71440_72020;
var G__72026 = (i__71441_72021 + (1));
seq__71438_72018 = G__72023;
chunk__71439_72019 = G__72024;
count__71440_72020 = G__72025;
i__71441_72021 = G__72026;
continue;
} else {
var temp__5804__auto___72027 = cljs.core.seq(seq__71438_72018);
if(temp__5804__auto___72027){
var seq__71438_72028__$1 = temp__5804__auto___72027;
if(cljs.core.chunked_seq_QMARK_(seq__71438_72028__$1)){
var c__5525__auto___72029 = cljs.core.chunk_first(seq__71438_72028__$1);
var G__72030 = cljs.core.chunk_rest(seq__71438_72028__$1);
var G__72031 = c__5525__auto___72029;
var G__72032 = cljs.core.count(c__5525__auto___72029);
var G__72033 = (0);
seq__71438_72018 = G__72030;
chunk__71439_72019 = G__72031;
count__71440_72020 = G__72032;
i__71441_72021 = G__72033;
continue;
} else {
var c_72034 = cljs.core.first(seq__71438_72028__$1);
class_list_72017.add(c_72034);


var G__72035 = cljs.core.next(seq__71438_72028__$1);
var G__72036 = null;
var G__72037 = (0);
var G__72038 = (0);
seq__71438_72018 = G__72035;
chunk__71439_72019 = G__72036;
count__71440_72020 = G__72037;
i__71441_72021 = G__72038;
continue;
}
} else {
}
}
break;
}
} else {
var seq__71443_72039 = cljs.core.seq(classes__$1);
var chunk__71444_72040 = null;
var count__71445_72041 = (0);
var i__71446_72042 = (0);
while(true){
if((i__71446_72042 < count__71445_72041)){
var c_72043 = chunk__71444_72040.cljs$core$IIndexed$_nth$arity$2(null,i__71446_72042);
var class_name_72044 = dommy.core.class$(elem);
if(cljs.core.truth_(dommy.utils.class_index(class_name_72044,c_72043))){
} else {
dommy.core.set_class_BANG_(elem,(((class_name_72044 === ""))?c_72043:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class_name_72044)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c_72043)].join('')));
}


var G__72045 = seq__71443_72039;
var G__72046 = chunk__71444_72040;
var G__72047 = count__71445_72041;
var G__72048 = (i__71446_72042 + (1));
seq__71443_72039 = G__72045;
chunk__71444_72040 = G__72046;
count__71445_72041 = G__72047;
i__71446_72042 = G__72048;
continue;
} else {
var temp__5804__auto___72049 = cljs.core.seq(seq__71443_72039);
if(temp__5804__auto___72049){
var seq__71443_72050__$1 = temp__5804__auto___72049;
if(cljs.core.chunked_seq_QMARK_(seq__71443_72050__$1)){
var c__5525__auto___72051 = cljs.core.chunk_first(seq__71443_72050__$1);
var G__72053 = cljs.core.chunk_rest(seq__71443_72050__$1);
var G__72054 = c__5525__auto___72051;
var G__72055 = cljs.core.count(c__5525__auto___72051);
var G__72056 = (0);
seq__71443_72039 = G__72053;
chunk__71444_72040 = G__72054;
count__71445_72041 = G__72055;
i__71446_72042 = G__72056;
continue;
} else {
var c_72058 = cljs.core.first(seq__71443_72050__$1);
var class_name_72059 = dommy.core.class$(elem);
if(cljs.core.truth_(dommy.utils.class_index(class_name_72059,c_72058))){
} else {
dommy.core.set_class_BANG_(elem,(((class_name_72059 === ""))?c_72058:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class_name_72059)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c_72058)].join('')));
}


var G__72060 = cljs.core.next(seq__71443_72050__$1);
var G__72061 = null;
var G__72062 = (0);
var G__72063 = (0);
seq__71443_72039 = G__72060;
chunk__71444_72040 = G__72061;
count__71445_72041 = G__72062;
i__71446_72042 = G__72063;
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
var seq__71453_72064 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(more_classes,classes));
var chunk__71454_72065 = null;
var count__71455_72066 = (0);
var i__71456_72067 = (0);
while(true){
if((i__71456_72067 < count__71455_72066)){
var c_72068 = chunk__71454_72065.cljs$core$IIndexed$_nth$arity$2(null,i__71456_72067);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c_72068);


var G__72069 = seq__71453_72064;
var G__72070 = chunk__71454_72065;
var G__72071 = count__71455_72066;
var G__72072 = (i__71456_72067 + (1));
seq__71453_72064 = G__72069;
chunk__71454_72065 = G__72070;
count__71455_72066 = G__72071;
i__71456_72067 = G__72072;
continue;
} else {
var temp__5804__auto___72073 = cljs.core.seq(seq__71453_72064);
if(temp__5804__auto___72073){
var seq__71453_72074__$1 = temp__5804__auto___72073;
if(cljs.core.chunked_seq_QMARK_(seq__71453_72074__$1)){
var c__5525__auto___72075 = cljs.core.chunk_first(seq__71453_72074__$1);
var G__72076 = cljs.core.chunk_rest(seq__71453_72074__$1);
var G__72077 = c__5525__auto___72075;
var G__72078 = cljs.core.count(c__5525__auto___72075);
var G__72079 = (0);
seq__71453_72064 = G__72076;
chunk__71454_72065 = G__72077;
count__71455_72066 = G__72078;
i__71456_72067 = G__72079;
continue;
} else {
var c_72080 = cljs.core.first(seq__71453_72074__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c_72080);


var G__72081 = cljs.core.next(seq__71453_72074__$1);
var G__72082 = null;
var G__72083 = (0);
var G__72084 = (0);
seq__71453_72064 = G__72081;
chunk__71454_72065 = G__72082;
count__71455_72066 = G__72083;
i__71456_72067 = G__72084;
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
(dommy.core.add_class_BANG_.cljs$lang$applyTo = (function (seq71430){
var G__71431 = cljs.core.first(seq71430);
var seq71430__$1 = cljs.core.next(seq71430);
var G__71432 = cljs.core.first(seq71430__$1);
var seq71430__$2 = cljs.core.next(seq71430__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71431,G__71432,seq71430__$2);
}));

(dommy.core.add_class_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Remove `c` from `elem` class list
 */
dommy.core.remove_class_BANG_ = (function dommy$core$remove_class_BANG_(var_args){
var G__71467 = arguments.length;
switch (G__71467) {
case 2:
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___72086 = arguments.length;
var i__5727__auto___72087 = (0);
while(true){
if((i__5727__auto___72087 < len__5726__auto___72086)){
args_arr__5751__auto__.push((arguments[i__5727__auto___72087]));

var G__72088 = (i__5727__auto___72087 + (1));
i__5727__auto___72087 = G__72088;
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
var temp__5802__auto___72091 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___72091)){
var class_list_72092 = temp__5802__auto___72091;
class_list_72092.remove(c__$1);
} else {
var class_name_72093 = dommy.core.class$(elem);
var new_class_name_72094 = dommy.utils.remove_class_str(class_name_72093,c__$1);
if((class_name_72093 === new_class_name_72094)){
} else {
dommy.core.set_class_BANG_(elem,new_class_name_72094);
}
}

return elem;
}));

(dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (elem,class$,classes){
var seq__71468 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(classes,class$));
var chunk__71469 = null;
var count__71470 = (0);
var i__71471 = (0);
while(true){
if((i__71471 < count__71470)){
var c = chunk__71469.cljs$core$IIndexed$_nth$arity$2(null,i__71471);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c);


var G__72095 = seq__71468;
var G__72096 = chunk__71469;
var G__72097 = count__71470;
var G__72098 = (i__71471 + (1));
seq__71468 = G__72095;
chunk__71469 = G__72096;
count__71470 = G__72097;
i__71471 = G__72098;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__71468);
if(temp__5804__auto__){
var seq__71468__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__71468__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__71468__$1);
var G__72099 = cljs.core.chunk_rest(seq__71468__$1);
var G__72100 = c__5525__auto__;
var G__72101 = cljs.core.count(c__5525__auto__);
var G__72102 = (0);
seq__71468 = G__72099;
chunk__71469 = G__72100;
count__71470 = G__72101;
i__71471 = G__72102;
continue;
} else {
var c = cljs.core.first(seq__71468__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(elem,c);


var G__72103 = cljs.core.next(seq__71468__$1);
var G__72104 = null;
var G__72105 = (0);
var G__72106 = (0);
seq__71468 = G__72103;
chunk__71469 = G__72104;
count__71470 = G__72105;
i__71471 = G__72106;
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
(dommy.core.remove_class_BANG_.cljs$lang$applyTo = (function (seq71464){
var G__71465 = cljs.core.first(seq71464);
var seq71464__$1 = cljs.core.next(seq71464);
var G__71466 = cljs.core.first(seq71464__$1);
var seq71464__$2 = cljs.core.next(seq71464__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71465,G__71466,seq71464__$2);
}));

(dommy.core.remove_class_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * (toggle-class! elem class) will add-class! if elem does not have class
 * and remove-class! otherwise.
 * (toggle-class! elem class add?) will add-class! if add? is truthy,
 * otherwise it will remove-class!
 */
dommy.core.toggle_class_BANG_ = (function dommy$core$toggle_class_BANG_(var_args){
var G__71475 = arguments.length;
switch (G__71475) {
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
var temp__5802__auto___72109 = elem.classList;
if(cljs.core.truth_(temp__5802__auto___72109)){
var class_list_72110 = temp__5802__auto___72109;
class_list_72110.toggle(c__$1);
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
var G__71480 = arguments.length;
switch (G__71480) {
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
var G__71485 = arguments.length;
switch (G__71485) {
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
var G__71493 = arguments.length;
switch (G__71493) {
case 2:
return dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___72118 = arguments.length;
var i__5727__auto___72119 = (0);
while(true){
if((i__5727__auto___72119 < len__5726__auto___72118)){
args_arr__5751__auto__.push((arguments[i__5727__auto___72119]));

var G__72120 = (i__5727__auto___72119 + (1));
i__5727__auto___72119 = G__72120;
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
var G__71498 = parent;
G__71498.appendChild(child);

return G__71498;
}));

(dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (parent,child,more_children){
var seq__71499_72122 = cljs.core.seq(cljs.core.cons(child,more_children));
var chunk__71500_72123 = null;
var count__71501_72124 = (0);
var i__71502_72125 = (0);
while(true){
if((i__71502_72125 < count__71501_72124)){
var c_72126 = chunk__71500_72123.cljs$core$IIndexed$_nth$arity$2(null,i__71502_72125);
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_72126);


var G__72127 = seq__71499_72122;
var G__72128 = chunk__71500_72123;
var G__72129 = count__71501_72124;
var G__72130 = (i__71502_72125 + (1));
seq__71499_72122 = G__72127;
chunk__71500_72123 = G__72128;
count__71501_72124 = G__72129;
i__71502_72125 = G__72130;
continue;
} else {
var temp__5804__auto___72131 = cljs.core.seq(seq__71499_72122);
if(temp__5804__auto___72131){
var seq__71499_72132__$1 = temp__5804__auto___72131;
if(cljs.core.chunked_seq_QMARK_(seq__71499_72132__$1)){
var c__5525__auto___72133 = cljs.core.chunk_first(seq__71499_72132__$1);
var G__72134 = cljs.core.chunk_rest(seq__71499_72132__$1);
var G__72135 = c__5525__auto___72133;
var G__72136 = cljs.core.count(c__5525__auto___72133);
var G__72137 = (0);
seq__71499_72122 = G__72134;
chunk__71500_72123 = G__72135;
count__71501_72124 = G__72136;
i__71502_72125 = G__72137;
continue;
} else {
var c_72138 = cljs.core.first(seq__71499_72132__$1);
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_72138);


var G__72139 = cljs.core.next(seq__71499_72132__$1);
var G__72140 = null;
var G__72141 = (0);
var G__72142 = (0);
seq__71499_72122 = G__72139;
chunk__71500_72123 = G__72140;
count__71501_72124 = G__72141;
i__71502_72125 = G__72142;
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
(dommy.core.append_BANG_.cljs$lang$applyTo = (function (seq71490){
var G__71491 = cljs.core.first(seq71490);
var seq71490__$1 = cljs.core.next(seq71490);
var G__71492 = cljs.core.first(seq71490__$1);
var seq71490__$2 = cljs.core.next(seq71490__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71491,G__71492,seq71490__$2);
}));

(dommy.core.append_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Prepend `child` to `parent`
 */
dommy.core.prepend_BANG_ = (function dommy$core$prepend_BANG_(var_args){
var G__71515 = arguments.length;
switch (G__71515) {
case 2:
return dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___72145 = arguments.length;
var i__5727__auto___72146 = (0);
while(true){
if((i__5727__auto___72146 < len__5726__auto___72145)){
args_arr__5751__auto__.push((arguments[i__5727__auto___72146]));

var G__72147 = (i__5727__auto___72146 + (1));
i__5727__auto___72146 = G__72147;
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
var G__71518 = parent;
G__71518.insertBefore(child,parent.firstChild);

return G__71518;
}));

(dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (parent,child,more_children){
var seq__71519_72148 = cljs.core.seq(cljs.core.cons(child,more_children));
var chunk__71520_72149 = null;
var count__71521_72150 = (0);
var i__71522_72151 = (0);
while(true){
if((i__71522_72151 < count__71521_72150)){
var c_72155 = chunk__71520_72149.cljs$core$IIndexed$_nth$arity$2(null,i__71522_72151);
dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_72155);


var G__72156 = seq__71519_72148;
var G__72157 = chunk__71520_72149;
var G__72158 = count__71521_72150;
var G__72159 = (i__71522_72151 + (1));
seq__71519_72148 = G__72156;
chunk__71520_72149 = G__72157;
count__71521_72150 = G__72158;
i__71522_72151 = G__72159;
continue;
} else {
var temp__5804__auto___72160 = cljs.core.seq(seq__71519_72148);
if(temp__5804__auto___72160){
var seq__71519_72161__$1 = temp__5804__auto___72160;
if(cljs.core.chunked_seq_QMARK_(seq__71519_72161__$1)){
var c__5525__auto___72162 = cljs.core.chunk_first(seq__71519_72161__$1);
var G__72163 = cljs.core.chunk_rest(seq__71519_72161__$1);
var G__72164 = c__5525__auto___72162;
var G__72165 = cljs.core.count(c__5525__auto___72162);
var G__72166 = (0);
seq__71519_72148 = G__72163;
chunk__71520_72149 = G__72164;
count__71521_72150 = G__72165;
i__71522_72151 = G__72166;
continue;
} else {
var c_72167 = cljs.core.first(seq__71519_72161__$1);
dommy.core.prepend_BANG_.cljs$core$IFn$_invoke$arity$2(parent,c_72167);


var G__72168 = cljs.core.next(seq__71519_72161__$1);
var G__72169 = null;
var G__72170 = (0);
var G__72171 = (0);
seq__71519_72148 = G__72168;
chunk__71520_72149 = G__72169;
count__71521_72150 = G__72170;
i__71522_72151 = G__72171;
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
(dommy.core.prepend_BANG_.cljs$lang$applyTo = (function (seq71512){
var G__71513 = cljs.core.first(seq71512);
var seq71512__$1 = cljs.core.next(seq71512);
var G__71514 = cljs.core.first(seq71512__$1);
var seq71512__$2 = cljs.core.next(seq71512__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71513,G__71514,seq71512__$2);
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
var temp__5802__auto___72174 = other.nextSibling;
if(cljs.core.truth_(temp__5802__auto___72174)){
var next_72175 = temp__5802__auto___72174;
dommy.core.insert_before_BANG_(elem,next_72175);
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
var G__71531 = arguments.length;
switch (G__71531) {
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
var G__71534 = p;
G__71534.removeChild(elem);

return G__71534;
}));

(dommy.core.remove_BANG_.cljs$lang$maxFixedArity = 2);

dommy.core.special_listener_makers = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__71535){
var vec__71536 = p__71535;
var special_mouse_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71536,(0),null);
var real_mouse_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71536,(1),null);
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
var len__5726__auto___72190 = arguments.length;
var i__5727__auto___72191 = (0);
while(true){
if((i__5727__auto___72191 < len__5726__auto___72190)){
args__5732__auto__.push((arguments[i__5727__auto___72191]));

var G__72192 = (i__5727__auto___72191 + (1));
i__5727__auto___72191 = G__72192;
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
(dommy.core.update_event_listeners_BANG_.cljs$lang$applyTo = (function (seq71539){
var G__71540 = cljs.core.first(seq71539);
var seq71539__$1 = cljs.core.next(seq71539);
var G__71541 = cljs.core.first(seq71539__$1);
var seq71539__$2 = cljs.core.next(seq71539__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71540,G__71541,seq71539__$2);
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
var len__5726__auto___72199 = arguments.length;
var i__5727__auto___72200 = (0);
while(true){
if((i__5727__auto___72200 < len__5726__auto___72199)){
args__5732__auto__.push((arguments[i__5727__auto___72200]));

var G__72201 = (i__5727__auto___72200 + (1));
i__5727__auto___72200 = G__72201;
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

var vec__71552_72202 = dommy.core.elem_and_selector(elem_sel);
var elem_72203 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71552_72202,(0),null);
var selector_72204 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71552_72202,(1),null);
var seq__71555_72205 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__71562_72206 = null;
var count__71563_72207 = (0);
var i__71564_72208 = (0);
while(true){
if((i__71564_72208 < count__71563_72207)){
var vec__71638_72210 = chunk__71562_72206.cljs$core$IIndexed$_nth$arity$2(null,i__71564_72208);
var orig_type_72211 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71638_72210,(0),null);
var f_72212 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71638_72210,(1),null);
var seq__71565_72213 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_72211,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_72211,cljs.core.identity])));
var chunk__71567_72214 = null;
var count__71568_72215 = (0);
var i__71569_72216 = (0);
while(true){
if((i__71569_72216 < count__71568_72215)){
var vec__71654_72217 = chunk__71567_72214.cljs$core$IIndexed$_nth$arity$2(null,i__71569_72216);
var actual_type_72218 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71654_72217,(0),null);
var factory_72219 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71654_72217,(1),null);
var canonical_f_72221 = (function (){var G__71658 = (factory_72219.cljs$core$IFn$_invoke$arity$1 ? factory_72219.cljs$core$IFn$_invoke$arity$1(f_72212) : factory_72219.call(null,f_72212));
var fexpr__71657 = (cljs.core.truth_(selector_72204)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_72203,selector_72204):cljs.core.identity);
return (fexpr__71657.cljs$core$IFn$_invoke$arity$1 ? fexpr__71657.cljs$core$IFn$_invoke$arity$1(G__71658) : fexpr__71657.call(null,G__71658));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72203,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72204,actual_type_72218,f_72212], null),canonical_f_72221], 0));

if(cljs.core.truth_(elem_72203.addEventListener)){
elem_72203.addEventListener(cljs.core.name(actual_type_72218),canonical_f_72221);
} else {
elem_72203.attachEvent(cljs.core.name(actual_type_72218),canonical_f_72221);
}


var G__72223 = seq__71565_72213;
var G__72224 = chunk__71567_72214;
var G__72225 = count__71568_72215;
var G__72226 = (i__71569_72216 + (1));
seq__71565_72213 = G__72223;
chunk__71567_72214 = G__72224;
count__71568_72215 = G__72225;
i__71569_72216 = G__72226;
continue;
} else {
var temp__5804__auto___72227 = cljs.core.seq(seq__71565_72213);
if(temp__5804__auto___72227){
var seq__71565_72228__$1 = temp__5804__auto___72227;
if(cljs.core.chunked_seq_QMARK_(seq__71565_72228__$1)){
var c__5525__auto___72229 = cljs.core.chunk_first(seq__71565_72228__$1);
var G__72230 = cljs.core.chunk_rest(seq__71565_72228__$1);
var G__72231 = c__5525__auto___72229;
var G__72232 = cljs.core.count(c__5525__auto___72229);
var G__72233 = (0);
seq__71565_72213 = G__72230;
chunk__71567_72214 = G__72231;
count__71568_72215 = G__72232;
i__71569_72216 = G__72233;
continue;
} else {
var vec__71660_72234 = cljs.core.first(seq__71565_72228__$1);
var actual_type_72235 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71660_72234,(0),null);
var factory_72236 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71660_72234,(1),null);
var canonical_f_72237 = (function (){var G__71665 = (factory_72236.cljs$core$IFn$_invoke$arity$1 ? factory_72236.cljs$core$IFn$_invoke$arity$1(f_72212) : factory_72236.call(null,f_72212));
var fexpr__71664 = (cljs.core.truth_(selector_72204)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_72203,selector_72204):cljs.core.identity);
return (fexpr__71664.cljs$core$IFn$_invoke$arity$1 ? fexpr__71664.cljs$core$IFn$_invoke$arity$1(G__71665) : fexpr__71664.call(null,G__71665));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72203,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72204,actual_type_72235,f_72212], null),canonical_f_72237], 0));

if(cljs.core.truth_(elem_72203.addEventListener)){
elem_72203.addEventListener(cljs.core.name(actual_type_72235),canonical_f_72237);
} else {
elem_72203.attachEvent(cljs.core.name(actual_type_72235),canonical_f_72237);
}


var G__72239 = cljs.core.next(seq__71565_72228__$1);
var G__72240 = null;
var G__72241 = (0);
var G__72242 = (0);
seq__71565_72213 = G__72239;
chunk__71567_72214 = G__72240;
count__71568_72215 = G__72241;
i__71569_72216 = G__72242;
continue;
}
} else {
}
}
break;
}

var G__72243 = seq__71555_72205;
var G__72244 = chunk__71562_72206;
var G__72245 = count__71563_72207;
var G__72246 = (i__71564_72208 + (1));
seq__71555_72205 = G__72243;
chunk__71562_72206 = G__72244;
count__71563_72207 = G__72245;
i__71564_72208 = G__72246;
continue;
} else {
var temp__5804__auto___72247 = cljs.core.seq(seq__71555_72205);
if(temp__5804__auto___72247){
var seq__71555_72248__$1 = temp__5804__auto___72247;
if(cljs.core.chunked_seq_QMARK_(seq__71555_72248__$1)){
var c__5525__auto___72249 = cljs.core.chunk_first(seq__71555_72248__$1);
var G__72250 = cljs.core.chunk_rest(seq__71555_72248__$1);
var G__72251 = c__5525__auto___72249;
var G__72252 = cljs.core.count(c__5525__auto___72249);
var G__72253 = (0);
seq__71555_72205 = G__72250;
chunk__71562_72206 = G__72251;
count__71563_72207 = G__72252;
i__71564_72208 = G__72253;
continue;
} else {
var vec__71672_72254 = cljs.core.first(seq__71555_72248__$1);
var orig_type_72255 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71672_72254,(0),null);
var f_72256 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71672_72254,(1),null);
var seq__71556_72257 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_72255,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_72255,cljs.core.identity])));
var chunk__71558_72258 = null;
var count__71559_72259 = (0);
var i__71560_72260 = (0);
while(true){
if((i__71560_72260 < count__71559_72259)){
var vec__71688_72261 = chunk__71558_72258.cljs$core$IIndexed$_nth$arity$2(null,i__71560_72260);
var actual_type_72262 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71688_72261,(0),null);
var factory_72263 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71688_72261,(1),null);
var canonical_f_72264 = (function (){var G__71692 = (factory_72263.cljs$core$IFn$_invoke$arity$1 ? factory_72263.cljs$core$IFn$_invoke$arity$1(f_72256) : factory_72263.call(null,f_72256));
var fexpr__71691 = (cljs.core.truth_(selector_72204)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_72203,selector_72204):cljs.core.identity);
return (fexpr__71691.cljs$core$IFn$_invoke$arity$1 ? fexpr__71691.cljs$core$IFn$_invoke$arity$1(G__71692) : fexpr__71691.call(null,G__71692));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72203,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72204,actual_type_72262,f_72256], null),canonical_f_72264], 0));

if(cljs.core.truth_(elem_72203.addEventListener)){
elem_72203.addEventListener(cljs.core.name(actual_type_72262),canonical_f_72264);
} else {
elem_72203.attachEvent(cljs.core.name(actual_type_72262),canonical_f_72264);
}


var G__72265 = seq__71556_72257;
var G__72266 = chunk__71558_72258;
var G__72267 = count__71559_72259;
var G__72268 = (i__71560_72260 + (1));
seq__71556_72257 = G__72265;
chunk__71558_72258 = G__72266;
count__71559_72259 = G__72267;
i__71560_72260 = G__72268;
continue;
} else {
var temp__5804__auto___72269__$1 = cljs.core.seq(seq__71556_72257);
if(temp__5804__auto___72269__$1){
var seq__71556_72270__$1 = temp__5804__auto___72269__$1;
if(cljs.core.chunked_seq_QMARK_(seq__71556_72270__$1)){
var c__5525__auto___72271 = cljs.core.chunk_first(seq__71556_72270__$1);
var G__72272 = cljs.core.chunk_rest(seq__71556_72270__$1);
var G__72273 = c__5525__auto___72271;
var G__72274 = cljs.core.count(c__5525__auto___72271);
var G__72275 = (0);
seq__71556_72257 = G__72272;
chunk__71558_72258 = G__72273;
count__71559_72259 = G__72274;
i__71560_72260 = G__72275;
continue;
} else {
var vec__71693_72276 = cljs.core.first(seq__71556_72270__$1);
var actual_type_72277 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71693_72276,(0),null);
var factory_72278 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71693_72276,(1),null);
var canonical_f_72279 = (function (){var G__71697 = (factory_72278.cljs$core$IFn$_invoke$arity$1 ? factory_72278.cljs$core$IFn$_invoke$arity$1(f_72256) : factory_72278.call(null,f_72256));
var fexpr__71696 = (cljs.core.truth_(selector_72204)?cljs.core.partial.cljs$core$IFn$_invoke$arity$3(dommy.core.live_listener,elem_72203,selector_72204):cljs.core.identity);
return (fexpr__71696.cljs$core$IFn$_invoke$arity$1 ? fexpr__71696.cljs$core$IFn$_invoke$arity$1(G__71697) : fexpr__71696.call(null,G__71697));
})();
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72203,cljs.core.assoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72204,actual_type_72277,f_72256], null),canonical_f_72279], 0));

if(cljs.core.truth_(elem_72203.addEventListener)){
elem_72203.addEventListener(cljs.core.name(actual_type_72277),canonical_f_72279);
} else {
elem_72203.attachEvent(cljs.core.name(actual_type_72277),canonical_f_72279);
}


var G__72282 = cljs.core.next(seq__71556_72270__$1);
var G__72283 = null;
var G__72284 = (0);
var G__72285 = (0);
seq__71556_72257 = G__72282;
chunk__71558_72258 = G__72283;
count__71559_72259 = G__72284;
i__71560_72260 = G__72285;
continue;
}
} else {
}
}
break;
}

var G__72286 = cljs.core.next(seq__71555_72248__$1);
var G__72287 = null;
var G__72288 = (0);
var G__72289 = (0);
seq__71555_72205 = G__72286;
chunk__71562_72206 = G__72287;
count__71563_72207 = G__72288;
i__71564_72208 = G__72289;
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
(dommy.core.listen_BANG_.cljs$lang$applyTo = (function (seq71543){
var G__71544 = cljs.core.first(seq71543);
var seq71543__$1 = cljs.core.next(seq71543);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71544,seq71543__$1);
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
var len__5726__auto___72292 = arguments.length;
var i__5727__auto___72293 = (0);
while(true){
if((i__5727__auto___72293 < len__5726__auto___72292)){
args__5732__auto__.push((arguments[i__5727__auto___72293]));

var G__72295 = (i__5727__auto___72293 + (1));
i__5727__auto___72293 = G__72295;
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

var vec__71700_72297 = dommy.core.elem_and_selector(elem_sel);
var elem_72298 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71700_72297,(0),null);
var selector_72299 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71700_72297,(1),null);
var seq__71703_72300 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__71710_72301 = null;
var count__71711_72302 = (0);
var i__71712_72303 = (0);
while(true){
if((i__71712_72303 < count__71711_72302)){
var vec__71754_72304 = chunk__71710_72301.cljs$core$IIndexed$_nth$arity$2(null,i__71712_72303);
var orig_type_72305 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71754_72304,(0),null);
var f_72306 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71754_72304,(1),null);
var seq__71713_72307 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_72305,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_72305,cljs.core.identity])));
var chunk__71715_72308 = null;
var count__71716_72309 = (0);
var i__71717_72310 = (0);
while(true){
if((i__71717_72310 < count__71716_72309)){
var vec__71770_72311 = chunk__71715_72308.cljs$core$IIndexed$_nth$arity$2(null,i__71717_72310);
var actual_type_72312 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71770_72311,(0),null);
var __72313 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71770_72311,(1),null);
var keys_72314 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72299,actual_type_72312,f_72306], null);
var canonical_f_72315 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_72298),keys_72314);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72298,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_72314], 0));

if(cljs.core.truth_(elem_72298.removeEventListener)){
elem_72298.removeEventListener(cljs.core.name(actual_type_72312),canonical_f_72315);
} else {
elem_72298.detachEvent(cljs.core.name(actual_type_72312),canonical_f_72315);
}


var G__72316 = seq__71713_72307;
var G__72317 = chunk__71715_72308;
var G__72318 = count__71716_72309;
var G__72319 = (i__71717_72310 + (1));
seq__71713_72307 = G__72316;
chunk__71715_72308 = G__72317;
count__71716_72309 = G__72318;
i__71717_72310 = G__72319;
continue;
} else {
var temp__5804__auto___72321 = cljs.core.seq(seq__71713_72307);
if(temp__5804__auto___72321){
var seq__71713_72322__$1 = temp__5804__auto___72321;
if(cljs.core.chunked_seq_QMARK_(seq__71713_72322__$1)){
var c__5525__auto___72325 = cljs.core.chunk_first(seq__71713_72322__$1);
var G__72326 = cljs.core.chunk_rest(seq__71713_72322__$1);
var G__72327 = c__5525__auto___72325;
var G__72328 = cljs.core.count(c__5525__auto___72325);
var G__72329 = (0);
seq__71713_72307 = G__72326;
chunk__71715_72308 = G__72327;
count__71716_72309 = G__72328;
i__71717_72310 = G__72329;
continue;
} else {
var vec__71780_72331 = cljs.core.first(seq__71713_72322__$1);
var actual_type_72332 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71780_72331,(0),null);
var __72333 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71780_72331,(1),null);
var keys_72334 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72299,actual_type_72332,f_72306], null);
var canonical_f_72335 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_72298),keys_72334);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72298,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_72334], 0));

if(cljs.core.truth_(elem_72298.removeEventListener)){
elem_72298.removeEventListener(cljs.core.name(actual_type_72332),canonical_f_72335);
} else {
elem_72298.detachEvent(cljs.core.name(actual_type_72332),canonical_f_72335);
}


var G__72336 = cljs.core.next(seq__71713_72322__$1);
var G__72337 = null;
var G__72338 = (0);
var G__72339 = (0);
seq__71713_72307 = G__72336;
chunk__71715_72308 = G__72337;
count__71716_72309 = G__72338;
i__71717_72310 = G__72339;
continue;
}
} else {
}
}
break;
}

var G__72340 = seq__71703_72300;
var G__72341 = chunk__71710_72301;
var G__72342 = count__71711_72302;
var G__72343 = (i__71712_72303 + (1));
seq__71703_72300 = G__72340;
chunk__71710_72301 = G__72341;
count__71711_72302 = G__72342;
i__71712_72303 = G__72343;
continue;
} else {
var temp__5804__auto___72344 = cljs.core.seq(seq__71703_72300);
if(temp__5804__auto___72344){
var seq__71703_72345__$1 = temp__5804__auto___72344;
if(cljs.core.chunked_seq_QMARK_(seq__71703_72345__$1)){
var c__5525__auto___72346 = cljs.core.chunk_first(seq__71703_72345__$1);
var G__72347 = cljs.core.chunk_rest(seq__71703_72345__$1);
var G__72348 = c__5525__auto___72346;
var G__72349 = cljs.core.count(c__5525__auto___72346);
var G__72350 = (0);
seq__71703_72300 = G__72347;
chunk__71710_72301 = G__72348;
count__71711_72302 = G__72349;
i__71712_72303 = G__72350;
continue;
} else {
var vec__71783_72351 = cljs.core.first(seq__71703_72345__$1);
var orig_type_72352 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71783_72351,(0),null);
var f_72353 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71783_72351,(1),null);
var seq__71704_72354 = cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$3(dommy.core.special_listener_makers,orig_type_72352,cljs.core.PersistentArrayMap.createAsIfByAssoc([orig_type_72352,cljs.core.identity])));
var chunk__71706_72355 = null;
var count__71707_72356 = (0);
var i__71708_72357 = (0);
while(true){
if((i__71708_72357 < count__71707_72356)){
var vec__71797_72358 = chunk__71706_72355.cljs$core$IIndexed$_nth$arity$2(null,i__71708_72357);
var actual_type_72359 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71797_72358,(0),null);
var __72360 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71797_72358,(1),null);
var keys_72361 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72299,actual_type_72359,f_72353], null);
var canonical_f_72362 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_72298),keys_72361);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72298,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_72361], 0));

if(cljs.core.truth_(elem_72298.removeEventListener)){
elem_72298.removeEventListener(cljs.core.name(actual_type_72359),canonical_f_72362);
} else {
elem_72298.detachEvent(cljs.core.name(actual_type_72359),canonical_f_72362);
}


var G__72367 = seq__71704_72354;
var G__72368 = chunk__71706_72355;
var G__72369 = count__71707_72356;
var G__72370 = (i__71708_72357 + (1));
seq__71704_72354 = G__72367;
chunk__71706_72355 = G__72368;
count__71707_72356 = G__72369;
i__71708_72357 = G__72370;
continue;
} else {
var temp__5804__auto___72371__$1 = cljs.core.seq(seq__71704_72354);
if(temp__5804__auto___72371__$1){
var seq__71704_72372__$1 = temp__5804__auto___72371__$1;
if(cljs.core.chunked_seq_QMARK_(seq__71704_72372__$1)){
var c__5525__auto___72373 = cljs.core.chunk_first(seq__71704_72372__$1);
var G__72374 = cljs.core.chunk_rest(seq__71704_72372__$1);
var G__72375 = c__5525__auto___72373;
var G__72376 = cljs.core.count(c__5525__auto___72373);
var G__72377 = (0);
seq__71704_72354 = G__72374;
chunk__71706_72355 = G__72375;
count__71707_72356 = G__72376;
i__71708_72357 = G__72377;
continue;
} else {
var vec__71802_72378 = cljs.core.first(seq__71704_72372__$1);
var actual_type_72379 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71802_72378,(0),null);
var __72380 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71802_72378,(1),null);
var keys_72381 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [selector_72299,actual_type_72379,f_72353], null);
var canonical_f_72382 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(dommy.core.event_listeners(elem_72298),keys_72381);
dommy.core.update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_72298,dommy.utils.dissoc_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([keys_72381], 0));

if(cljs.core.truth_(elem_72298.removeEventListener)){
elem_72298.removeEventListener(cljs.core.name(actual_type_72379),canonical_f_72382);
} else {
elem_72298.detachEvent(cljs.core.name(actual_type_72379),canonical_f_72382);
}


var G__72383 = cljs.core.next(seq__71704_72372__$1);
var G__72384 = null;
var G__72385 = (0);
var G__72386 = (0);
seq__71704_72354 = G__72383;
chunk__71706_72355 = G__72384;
count__71707_72356 = G__72385;
i__71708_72357 = G__72386;
continue;
}
} else {
}
}
break;
}

var G__72388 = cljs.core.next(seq__71703_72345__$1);
var G__72389 = null;
var G__72390 = (0);
var G__72391 = (0);
seq__71703_72300 = G__72388;
chunk__71710_72301 = G__72389;
count__71711_72302 = G__72390;
i__71712_72303 = G__72391;
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
(dommy.core.unlisten_BANG_.cljs$lang$applyTo = (function (seq71698){
var G__71699 = cljs.core.first(seq71698);
var seq71698__$1 = cljs.core.next(seq71698);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71699,seq71698__$1);
}));

/**
 * Behaves like `listen!`, but removes the listener after the first event occurs.
 */
dommy.core.listen_once_BANG_ = (function dommy$core$listen_once_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___72392 = arguments.length;
var i__5727__auto___72393 = (0);
while(true){
if((i__5727__auto___72393 < len__5726__auto___72392)){
args__5732__auto__.push((arguments[i__5727__auto___72393]));

var G__72394 = (i__5727__auto___72393 + (1));
i__5727__auto___72393 = G__72394;
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

var vec__71812_72395 = dommy.core.elem_and_selector(elem_sel);
var elem_72396 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71812_72395,(0),null);
var selector_72397 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71812_72395,(1),null);
var seq__71815_72399 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),type_fs));
var chunk__71816_72400 = null;
var count__71817_72401 = (0);
var i__71818_72402 = (0);
while(true){
if((i__71818_72402 < count__71817_72401)){
var vec__71825_72403 = chunk__71816_72400.cljs$core$IIndexed$_nth$arity$2(null,i__71818_72402);
var type_72404 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71825_72403,(0),null);
var f_72405 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71825_72403,(1),null);
dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_72404,((function (seq__71815_72399,chunk__71816_72400,count__71817_72401,i__71818_72402,vec__71825_72403,type_72404,f_72405,vec__71812_72395,elem_72396,selector_72397){
return (function dommy$core$this_fn(e){
dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_72404,dommy$core$this_fn], 0));

return (f_72405.cljs$core$IFn$_invoke$arity$1 ? f_72405.cljs$core$IFn$_invoke$arity$1(e) : f_72405.call(null,e));
});})(seq__71815_72399,chunk__71816_72400,count__71817_72401,i__71818_72402,vec__71825_72403,type_72404,f_72405,vec__71812_72395,elem_72396,selector_72397))
], 0));


var G__72407 = seq__71815_72399;
var G__72408 = chunk__71816_72400;
var G__72409 = count__71817_72401;
var G__72410 = (i__71818_72402 + (1));
seq__71815_72399 = G__72407;
chunk__71816_72400 = G__72408;
count__71817_72401 = G__72409;
i__71818_72402 = G__72410;
continue;
} else {
var temp__5804__auto___72411 = cljs.core.seq(seq__71815_72399);
if(temp__5804__auto___72411){
var seq__71815_72412__$1 = temp__5804__auto___72411;
if(cljs.core.chunked_seq_QMARK_(seq__71815_72412__$1)){
var c__5525__auto___72413 = cljs.core.chunk_first(seq__71815_72412__$1);
var G__72414 = cljs.core.chunk_rest(seq__71815_72412__$1);
var G__72415 = c__5525__auto___72413;
var G__72416 = cljs.core.count(c__5525__auto___72413);
var G__72417 = (0);
seq__71815_72399 = G__72414;
chunk__71816_72400 = G__72415;
count__71817_72401 = G__72416;
i__71818_72402 = G__72417;
continue;
} else {
var vec__71828_72418 = cljs.core.first(seq__71815_72412__$1);
var type_72419 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71828_72418,(0),null);
var f_72420 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71828_72418,(1),null);
dommy.core.listen_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_72419,((function (seq__71815_72399,chunk__71816_72400,count__71817_72401,i__71818_72402,vec__71828_72418,type_72419,f_72420,seq__71815_72412__$1,temp__5804__auto___72411,vec__71812_72395,elem_72396,selector_72397){
return (function dommy$core$this_fn(e){
dommy.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic(elem_sel,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([type_72419,dommy$core$this_fn], 0));

return (f_72420.cljs$core$IFn$_invoke$arity$1 ? f_72420.cljs$core$IFn$_invoke$arity$1(e) : f_72420.call(null,e));
});})(seq__71815_72399,chunk__71816_72400,count__71817_72401,i__71818_72402,vec__71828_72418,type_72419,f_72420,seq__71815_72412__$1,temp__5804__auto___72411,vec__71812_72395,elem_72396,selector_72397))
], 0));


var G__72421 = cljs.core.next(seq__71815_72412__$1);
var G__72422 = null;
var G__72423 = (0);
var G__72424 = (0);
seq__71815_72399 = G__72421;
chunk__71816_72400 = G__72422;
count__71817_72401 = G__72423;
i__71818_72402 = G__72424;
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
(dommy.core.listen_once_BANG_.cljs$lang$applyTo = (function (seq71805){
var G__71806 = cljs.core.first(seq71805);
var seq71805__$1 = cljs.core.next(seq71805);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71806,seq71805__$1);
}));


//# sourceMappingURL=dommy.core.js.map
