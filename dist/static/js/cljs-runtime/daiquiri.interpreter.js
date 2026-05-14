goog.provide('daiquiri.interpreter');
goog.scope(function(){
  daiquiri.interpreter.goog$module$goog$object = goog.module.get('goog.object');
});
/**
 * Create a React element. Returns a JavaScript object when running
 *   under ClojureScript, and a om.dom.Element record in Clojure.
 */
daiquiri.interpreter.create_element = (function daiquiri$interpreter$create_element(type,attrs,children){
return React.createElement.apply(null,[type,attrs].concat(children));
});
daiquiri.interpreter.component_attributes = (function daiquiri$interpreter$component_attributes(attrs){
var x = daiquiri.util.camel_case_keys_STAR_(attrs);
var m = ({});
var seq__70524_70641 = cljs.core.seq(x);
var chunk__70525_70642 = null;
var count__70526_70643 = (0);
var i__70527_70644 = (0);
while(true){
if((i__70527_70644 < count__70526_70643)){
var vec__70540_70645 = chunk__70525_70642.cljs$core$IIndexed$_nth$arity$2(null,i__70527_70644);
var k_70646 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70540_70645,(0),null);
var v_70647 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70540_70645,(1),null);
daiquiri.interpreter.goog$module$goog$object.set(m,cljs.core.name(k_70646),v_70647);


var G__70648 = seq__70524_70641;
var G__70649 = chunk__70525_70642;
var G__70650 = count__70526_70643;
var G__70651 = (i__70527_70644 + (1));
seq__70524_70641 = G__70648;
chunk__70525_70642 = G__70649;
count__70526_70643 = G__70650;
i__70527_70644 = G__70651;
continue;
} else {
var temp__5804__auto___70652 = cljs.core.seq(seq__70524_70641);
if(temp__5804__auto___70652){
var seq__70524_70653__$1 = temp__5804__auto___70652;
if(cljs.core.chunked_seq_QMARK_(seq__70524_70653__$1)){
var c__5525__auto___70654 = cljs.core.chunk_first(seq__70524_70653__$1);
var G__70655 = cljs.core.chunk_rest(seq__70524_70653__$1);
var G__70656 = c__5525__auto___70654;
var G__70657 = cljs.core.count(c__5525__auto___70654);
var G__70658 = (0);
seq__70524_70641 = G__70655;
chunk__70525_70642 = G__70656;
count__70526_70643 = G__70657;
i__70527_70644 = G__70658;
continue;
} else {
var vec__70557_70659 = cljs.core.first(seq__70524_70653__$1);
var k_70660 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70557_70659,(0),null);
var v_70661 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70557_70659,(1),null);
daiquiri.interpreter.goog$module$goog$object.set(m,cljs.core.name(k_70660),v_70661);


var G__70662 = cljs.core.next(seq__70524_70653__$1);
var G__70663 = null;
var G__70664 = (0);
var G__70665 = (0);
seq__70524_70641 = G__70662;
chunk__70525_70642 = G__70663;
count__70526_70643 = G__70664;
i__70527_70644 = G__70665;
continue;
}
} else {
}
}
break;
}

return m;
});
daiquiri.interpreter.element_attributes = (function daiquiri$interpreter$element_attributes(attrs){
var temp__5804__auto__ = cljs.core.clj__GT_js(daiquiri.util.html_to_dom_attrs(attrs));
if(cljs.core.truth_(temp__5804__auto__)){
var js_attrs = temp__5804__auto__;
var class$ = js_attrs.className;
var class$__$1 = ((cljs.core.array_QMARK_(class$))?clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",class$):class$);
if(cljs.core.truth_(js_attrs.onChange)){
(js_attrs.onChange = rum.core.mark_sync_update(js_attrs.onChange));
} else {
}

if(clojure.string.blank_QMARK_(class$__$1)){
delete js_attrs["className"];
} else {
(js_attrs.className = class$__$1);
}

return js_attrs;
} else {
return null;
}
});
/**
 * Eagerly interpret the seq `x` as HTML elements.
 */
daiquiri.interpreter.interpret_seq = (function daiquiri$interpreter$interpret_seq(x){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret,x__$1){
ret.push((daiquiri.interpreter.interpret.cljs$core$IFn$_invoke$arity$1 ? daiquiri.interpreter.interpret.cljs$core$IFn$_invoke$arity$1(x__$1) : daiquiri.interpreter.interpret.call(null,x__$1)));

return ret;
}),[],x);
});
/**
 * Render an element vector as a HTML element.
 */
daiquiri.interpreter.element = (function daiquiri$interpreter$element(element){
var vec__70587 = daiquiri.normalize.element(element);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70587,(0),null);
var attrs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70587,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70587,(2),null);
return daiquiri.interpreter.create_element(type,daiquiri.interpreter.element_attributes(attrs),daiquiri.interpreter.interpret_seq(content));
});
daiquiri.interpreter.fragment = (function daiquiri$interpreter$fragment(p__70594){
var vec__70595 = p__70594;
var seq__70596 = cljs.core.seq(vec__70595);
var first__70597 = cljs.core.first(seq__70596);
var seq__70596__$1 = cljs.core.next(seq__70596);
var _ = first__70597;
var first__70597__$1 = cljs.core.first(seq__70596__$1);
var seq__70596__$2 = cljs.core.next(seq__70596__$1);
var attrs = first__70597__$1;
var children = seq__70596__$2;
var vec__70600 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [daiquiri.interpreter.component_attributes(attrs),daiquiri.interpreter.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,daiquiri.interpreter.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70600,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70600,(1),null);
return daiquiri.interpreter.create_element(React.Fragment,attrs__$1,children__$1);
});
daiquiri.interpreter.interop = (function daiquiri$interpreter$interop(p__70609){
var vec__70614 = p__70609;
var seq__70615 = cljs.core.seq(vec__70614);
var first__70616 = cljs.core.first(seq__70615);
var seq__70615__$1 = cljs.core.next(seq__70615);
var _ = first__70616;
var first__70616__$1 = cljs.core.first(seq__70615__$1);
var seq__70615__$2 = cljs.core.next(seq__70615__$1);
var component = first__70616__$1;
var first__70616__$2 = cljs.core.first(seq__70615__$2);
var seq__70615__$3 = cljs.core.next(seq__70615__$2);
var attrs = first__70616__$2;
var children = seq__70615__$3;
var vec__70624 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [daiquiri.interpreter.component_attributes(attrs),daiquiri.interpreter.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,daiquiri.interpreter.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70624,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70624,(1),null);
return daiquiri.interpreter.create_element(component,attrs__$1,children__$1);
});
/**
 * Interpret the vector `x` as an HTML element or a the children of an
 *   element.
 */
daiquiri.interpreter.interpret_vec = (function daiquiri$interpreter$interpret_vec(x){
if(daiquiri.util.fragment_QMARK_(x)){
return daiquiri.interpreter.fragment(x);
} else {
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,">",">",-555517146),cljs.core.nth.cljs$core$IFn$_invoke$arity$3(x,(0),null))){
return daiquiri.interpreter.interop(x);
} else {
if(daiquiri.util.element_QMARK_(x)){
return daiquiri.interpreter.element(x);
} else {
return daiquiri.interpreter.interpret_seq(x);

}
}
}
});
daiquiri.interpreter.interpret = (function daiquiri$interpreter$interpret(v){
if(cljs.core.vector_QMARK_(v)){
return daiquiri.interpreter.interpret_vec(v);
} else {
if(cljs.core.seq_QMARK_(v)){
return daiquiri.interpreter.interpret_seq(v);
} else {
return v;

}
}
});

//# sourceMappingURL=daiquiri.interpreter.js.map
