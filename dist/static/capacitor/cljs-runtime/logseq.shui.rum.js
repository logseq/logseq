goog.provide('logseq.shui.rum');
goog.scope(function(){
  logseq.shui.rum.goog$module$goog$object = goog.module.get('goog.object');
});
/**
 * Create a React element. Returns a JavaScript object when running
 *   under ClojureScript, and a om.dom.Element record in Clojure.
 */
logseq.shui.rum.create_element = (function logseq$shui$rum$create_element(type,attrs,children){
return React.createElement.apply(null,[type,attrs].concat(children));
});
logseq.shui.rum.component_attributes = (function logseq$shui$rum$component_attributes(attrs){
var x = daiquiri.util.camel_case_keys_STAR_(attrs);
var m = ({});
var seq__69422_69600 = cljs.core.seq(x);
var chunk__69424_69601 = null;
var count__69425_69602 = (0);
var i__69426_69603 = (0);
while(true){
if((i__69426_69603 < count__69425_69602)){
var vec__69469_69605 = chunk__69424_69601.cljs$core$IIndexed$_nth$arity$2(null,i__69426_69603);
var k_69606 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69469_69605,(0),null);
var v_69607 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69469_69605,(1),null);
logseq.shui.rum.goog$module$goog$object.set(m,cljs.core.name(k_69606),v_69607);


var G__69608 = seq__69422_69600;
var G__69609 = chunk__69424_69601;
var G__69610 = count__69425_69602;
var G__69611 = (i__69426_69603 + (1));
seq__69422_69600 = G__69608;
chunk__69424_69601 = G__69609;
count__69425_69602 = G__69610;
i__69426_69603 = G__69611;
continue;
} else {
var temp__5804__auto___69612 = cljs.core.seq(seq__69422_69600);
if(temp__5804__auto___69612){
var seq__69422_69613__$1 = temp__5804__auto___69612;
if(cljs.core.chunked_seq_QMARK_(seq__69422_69613__$1)){
var c__5525__auto___69614 = cljs.core.chunk_first(seq__69422_69613__$1);
var G__69615 = cljs.core.chunk_rest(seq__69422_69613__$1);
var G__69616 = c__5525__auto___69614;
var G__69617 = cljs.core.count(c__5525__auto___69614);
var G__69618 = (0);
seq__69422_69600 = G__69615;
chunk__69424_69601 = G__69616;
count__69425_69602 = G__69617;
i__69426_69603 = G__69618;
continue;
} else {
var vec__69477_69619 = cljs.core.first(seq__69422_69613__$1);
var k_69620 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69477_69619,(0),null);
var v_69621 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69477_69619,(1),null);
logseq.shui.rum.goog$module$goog$object.set(m,cljs.core.name(k_69620),v_69621);


var G__69624 = cljs.core.next(seq__69422_69613__$1);
var G__69625 = null;
var G__69626 = (0);
var G__69627 = (0);
seq__69422_69600 = G__69624;
chunk__69424_69601 = G__69625;
count__69425_69602 = G__69626;
i__69426_69603 = G__69627;
continue;
}
} else {
}
}
break;
}

return m;
});
logseq.shui.rum.element_attributes = (function logseq$shui$rum$element_attributes(attrs){
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
logseq.shui.rum.interpret_seq = (function logseq$shui$rum$interpret_seq(x){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret,x__$1){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,(logseq.shui.rum.interpret.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.rum.interpret.cljs$core$IFn$_invoke$arity$1(x__$1) : logseq.shui.rum.interpret.call(null,x__$1)));
}),cljs.core.PersistentVector.EMPTY,x);
});
/**
 * Render an element vector as a HTML element.
 */
logseq.shui.rum.element = (function logseq$shui$rum$element(element){
var vec__69496 = daiquiri.normalize.element(element);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69496,(0),null);
var attrs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69496,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69496,(2),null);
return logseq.shui.rum.create_element(type,logseq.shui.rum.element_attributes(attrs),logseq.shui.rum.interpret_seq(content));
});
logseq.shui.rum.fragment = (function logseq$shui$rum$fragment(p__69507){
var vec__69511 = p__69507;
var seq__69512 = cljs.core.seq(vec__69511);
var first__69513 = cljs.core.first(seq__69512);
var seq__69512__$1 = cljs.core.next(seq__69512);
var _ = first__69513;
var first__69513__$1 = cljs.core.first(seq__69512__$1);
var seq__69512__$2 = cljs.core.next(seq__69512__$1);
var attrs = first__69513__$1;
var children = seq__69512__$2;
var vec__69515 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.rum.component_attributes(attrs),logseq.shui.rum.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,logseq.shui.rum.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69515,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69515,(1),null);
return logseq.shui.rum.create_element(React.Fragment,attrs__$1,children__$1);
});
logseq.shui.rum.interop = (function logseq$shui$rum$interop(p__69556){
var vec__69557 = p__69556;
var seq__69558 = cljs.core.seq(vec__69557);
var first__69559 = cljs.core.first(seq__69558);
var seq__69558__$1 = cljs.core.next(seq__69558);
var _ = first__69559;
var first__69559__$1 = cljs.core.first(seq__69558__$1);
var seq__69558__$2 = cljs.core.next(seq__69558__$1);
var component = first__69559__$1;
var first__69559__$2 = cljs.core.first(seq__69558__$2);
var seq__69558__$3 = cljs.core.next(seq__69558__$2);
var attrs = first__69559__$2;
var children = seq__69558__$3;
var vec__69560 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.rum.component_attributes(attrs),logseq.shui.rum.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,logseq.shui.rum.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69560,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69560,(1),null);
return logseq.shui.rum.create_element(component,attrs__$1,children__$1);
});
/**
 * Interpret the vector `x` as an HTML element or a the children of an
 *   element.
 */
logseq.shui.rum.interpret_vec = (function logseq$shui$rum$interpret_vec(x){
if(daiquiri.util.fragment_QMARK_(x)){
return logseq.shui.rum.fragment(x);
} else {
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,">",">",-555517146),cljs.core.nth.cljs$core$IFn$_invoke$arity$3(x,(0),null))){
return logseq.shui.rum.interop(x);
} else {
if(daiquiri.util.element_QMARK_(x)){
return logseq.shui.rum.element(x);
} else {
return logseq.shui.rum.interpret_seq(x);

}
}
}
});
logseq.shui.rum.interpret = (function logseq$shui$rum$interpret(v){
if(cljs.core.vector_QMARK_(v)){
return logseq.shui.rum.interpret_vec(v);
} else {
if(cljs.core.seq_QMARK_(v)){
return logseq.shui.rum.interpret_seq(v);
} else {
return v;

}
}
});

//# sourceMappingURL=logseq.shui.rum.js.map
