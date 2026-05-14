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
var seq__73936_73982 = cljs.core.seq(x);
var chunk__73937_73983 = null;
var count__73938_73984 = (0);
var i__73939_73985 = (0);
while(true){
if((i__73939_73985 < count__73938_73984)){
var vec__73951_73986 = chunk__73937_73983.cljs$core$IIndexed$_nth$arity$2(null,i__73939_73985);
var k_73987 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73951_73986,(0),null);
var v_73988 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73951_73986,(1),null);
logseq.shui.rum.goog$module$goog$object.set(m,cljs.core.name(k_73987),v_73988);


var G__73989 = seq__73936_73982;
var G__73990 = chunk__73937_73983;
var G__73991 = count__73938_73984;
var G__73992 = (i__73939_73985 + (1));
seq__73936_73982 = G__73989;
chunk__73937_73983 = G__73990;
count__73938_73984 = G__73991;
i__73939_73985 = G__73992;
continue;
} else {
var temp__5804__auto___73993 = cljs.core.seq(seq__73936_73982);
if(temp__5804__auto___73993){
var seq__73936_73994__$1 = temp__5804__auto___73993;
if(cljs.core.chunked_seq_QMARK_(seq__73936_73994__$1)){
var c__5525__auto___73995 = cljs.core.chunk_first(seq__73936_73994__$1);
var G__73997 = cljs.core.chunk_rest(seq__73936_73994__$1);
var G__73998 = c__5525__auto___73995;
var G__73999 = cljs.core.count(c__5525__auto___73995);
var G__74000 = (0);
seq__73936_73982 = G__73997;
chunk__73937_73983 = G__73998;
count__73938_73984 = G__73999;
i__73939_73985 = G__74000;
continue;
} else {
var vec__73954_74001 = cljs.core.first(seq__73936_73994__$1);
var k_74002 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73954_74001,(0),null);
var v_74003 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73954_74001,(1),null);
logseq.shui.rum.goog$module$goog$object.set(m,cljs.core.name(k_74002),v_74003);


var G__74004 = cljs.core.next(seq__73936_73994__$1);
var G__74005 = null;
var G__74006 = (0);
var G__74007 = (0);
seq__73936_73982 = G__74004;
chunk__73937_73983 = G__74005;
count__73938_73984 = G__74006;
i__73939_73985 = G__74007;
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
var vec__73959 = daiquiri.normalize.element(element);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73959,(0),null);
var attrs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73959,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73959,(2),null);
return logseq.shui.rum.create_element(type,logseq.shui.rum.element_attributes(attrs),logseq.shui.rum.interpret_seq(content));
});
logseq.shui.rum.fragment = (function logseq$shui$rum$fragment(p__73962){
var vec__73963 = p__73962;
var seq__73964 = cljs.core.seq(vec__73963);
var first__73965 = cljs.core.first(seq__73964);
var seq__73964__$1 = cljs.core.next(seq__73964);
var _ = first__73965;
var first__73965__$1 = cljs.core.first(seq__73964__$1);
var seq__73964__$2 = cljs.core.next(seq__73964__$1);
var attrs = first__73965__$1;
var children = seq__73964__$2;
var vec__73966 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.rum.component_attributes(attrs),logseq.shui.rum.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,logseq.shui.rum.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73966,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73966,(1),null);
return logseq.shui.rum.create_element(React.Fragment,attrs__$1,children__$1);
});
logseq.shui.rum.interop = (function logseq$shui$rum$interop(p__73971){
var vec__73972 = p__73971;
var seq__73973 = cljs.core.seq(vec__73972);
var first__73974 = cljs.core.first(seq__73973);
var seq__73973__$1 = cljs.core.next(seq__73973);
var _ = first__73974;
var first__73974__$1 = cljs.core.first(seq__73973__$1);
var seq__73973__$2 = cljs.core.next(seq__73973__$1);
var component = first__73974__$1;
var first__73974__$2 = cljs.core.first(seq__73973__$2);
var seq__73973__$3 = cljs.core.next(seq__73973__$2);
var attrs = first__73974__$2;
var children = seq__73973__$3;
var vec__73975 = ((cljs.core.map_QMARK_(attrs))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.rum.component_attributes(attrs),logseq.shui.rum.interpret_seq(children)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,logseq.shui.rum.interpret_seq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [attrs], null),children))], null));
var attrs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73975,(0),null);
var children__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73975,(1),null);
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
