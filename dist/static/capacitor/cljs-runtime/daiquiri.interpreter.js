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
var seq__69407_69566 = cljs.core.seq(x);
var chunk__69408_69567 = null;
var count__69409_69568 = (0);
var i__69410_69569 = (0);
while(true){
if((i__69410_69569 < count__69409_69568)){
var vec__69445_69570 = chunk__69408_69567.cljs$core$IIndexed$_nth$arity$2(null,i__69410_69569);
var k_69571 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69445_69570,(0),null);
var v_69572 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69445_69570,(1),null);
daiquiri.interpreter.goog$module$goog$object.set(m,cljs.core.name(k_69571),v_69572);


var G__69573 = seq__69407_69566;
var G__69574 = chunk__69408_69567;
var G__69575 = count__69409_69568;
var G__69576 = (i__69410_69569 + (1));
seq__69407_69566 = G__69573;
chunk__69408_69567 = G__69574;
count__69409_69568 = G__69575;
i__69410_69569 = G__69576;
continue;
} else {
var temp__5804__auto___69577 = cljs.core.seq(seq__69407_69566);
if(temp__5804__auto___69577){
var seq__69407_69580__$1 = temp__5804__auto___69577;
if(cljs.core.chunked_seq_QMARK_(seq__69407_69580__$1)){
var c__5525__auto___69581 = cljs.core.chunk_first(seq__69407_69580__$1);
var G__69582 = cljs.core.chunk_rest(seq__69407_69580__$1);
var G__69583 = c__5525__auto___69581;
var G__69584 = cljs.core.count(c__5525__auto___69581);
var G__69585 = (0);
seq__69407_69566 = G__69582;
chunk__69408_69567 = G__69583;
count__69409_69568 = G__69584;
i__69410_69569 = G__69585;
continue;
} else {
var vec__69466_69588 = cljs.core.first(seq__69407_69580__$1);
var k_69589 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69466_69588,(0),null);
var v_69590 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69466_69588,(1),null);
daiquiri.interpreter.goog$module$goog$object.set(m,cljs.core.name(k_69589),v_69590);


var G__69591 = cljs.core.next(seq__69407_69580__$1);
var G__69592 = null;
var G__69593 = (0);
var G__69594 = (0);
seq__69407_69566 = G__69591;
chunk__69408_69567 = G__69592;
count__69409_69568 = G__69593;
i__69410_69569 = G__69594;
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
var vec__69499 = daiquiri.normalize.element(element);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69499,(0),null);
var attrs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69499,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69499,(2),null);
return daiquiri.interpreter.create_element(type,daiquiri.interpreter.element_attributes(attrs),daiquiri.interpreter.interpret_seq(content));
});
daiquiri.interpreter.fragment = (function daiquiri$interpreter$fragment(p__69504){
var vec__69508 = p__69504;
var seq__69509 = cljs.core.seq(vec__69508);
var first__69510 = cljs.core.first(seq__69509);
var seq__69509__$1 = cljs.core.next(seq__69509);
var _ = first__69510;
var first__69510__$1 = cljs.core.first(seq__69509__$1);
var seq__69509__$2 = cljs.core.next(seq__69509__$1);
var attrs = first__69510__$1;
var children = seq__69509__$2;
var vec__69519 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [daiquiri.interpreter.component_attributes(attrs),daiquiri.interpreter.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,daiquiri.interpreter.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69519,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69519,(1),null);
return daiquiri.interpreter.create_element(React.Fragment,attrs__$1,children__$1);
});
daiquiri.interpreter.interop = (function daiquiri$interpreter$interop(p__69547){
var vec__69549 = p__69547;
var seq__69550 = cljs.core.seq(vec__69549);
var first__69551 = cljs.core.first(seq__69550);
var seq__69550__$1 = cljs.core.next(seq__69550);
var _ = first__69551;
var first__69551__$1 = cljs.core.first(seq__69550__$1);
var seq__69550__$2 = cljs.core.next(seq__69550__$1);
var component = first__69551__$1;
var first__69551__$2 = cljs.core.first(seq__69550__$2);
var seq__69550__$3 = cljs.core.next(seq__69550__$2);
var attrs = first__69551__$2;
var children = seq__69550__$3;
var vec__69553 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [daiquiri.interpreter.component_attributes(attrs),daiquiri.interpreter.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,daiquiri.interpreter.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69553,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69553,(1),null);
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
