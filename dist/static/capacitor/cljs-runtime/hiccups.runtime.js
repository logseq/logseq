goog.provide('hiccups.runtime');
/**
 * Regular expression that parses a CSS-style id and class from a tag name.
 */
hiccups.runtime.re_tag = /([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;
/**
 * Characters to replace when escaping HTML
 */
hiccups.runtime.character_escapes = new cljs.core.PersistentArrayMap(null, 4, ["&","&amp;","<","&lt;",">","&gt;","\"","&quot;"], null);
/**
 * A list of tags that need an explicit ending tag when rendered.
 */
hiccups.runtime.container_tags = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 33, ["table",null,"canvas",null,"body",null,"h3",null,"dt",null,"label",null,"fieldset",null,"form",null,"em",null,"option",null,"h2",null,"h4",null,"style",null,"span",null,"script",null,"ol",null,"dd",null,"a",null,"head",null,"textarea",null,"i",null,"div",null,"b",null,"h5",null,"pre",null,"ul",null,"iframe",null,"strong",null,"html",null,"h1",null,"li",null,"dl",null,"h6",null], null), null);
hiccups.runtime.as_str = (function hiccups$runtime$as_str(x){
if((((x instanceof cljs.core.Keyword)) || ((x instanceof cljs.core.Symbol)))){
return cljs.core.name(x);
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(x);
}
});
hiccups.runtime._STAR_html_mode_STAR_ = new cljs.core.Keyword(null,"xml","xml",-1170142052);
hiccups.runtime.xml_mode_QMARK_ = (function hiccups$runtime$xml_mode_QMARK_(){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(hiccups.runtime._STAR_html_mode_STAR_,new cljs.core.Keyword(null,"xml","xml",-1170142052));
});
hiccups.runtime.in_mode = (function hiccups$runtime$in_mode(mode,f){
var _STAR_html_mode_STAR__orig_val__96478 = hiccups.runtime._STAR_html_mode_STAR_;
var _STAR_html_mode_STAR__temp_val__96480 = mode;
(hiccups.runtime._STAR_html_mode_STAR_ = _STAR_html_mode_STAR__temp_val__96480);

try{return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
}finally {(hiccups.runtime._STAR_html_mode_STAR_ = _STAR_html_mode_STAR__orig_val__96478);
}});
/**
 * Change special characters into HTML character entities.
 */
hiccups.runtime.escape_html = (function hiccups$runtime$escape_html(text){
return clojure.string.escape(hiccups.runtime.as_str(text),hiccups.runtime.character_escapes);
});
hiccups.runtime.h = hiccups.runtime.escape_html;
hiccups.runtime.end_tag = (function hiccups$runtime$end_tag(){
if(hiccups.runtime.xml_mode_QMARK_()){
return " />";
} else {
return ">";
}
});
hiccups.runtime.xml_attribute = (function hiccups$runtime$xml_attribute(name,value){
return [" ",hiccups.runtime.as_str(name),"=\"",hiccups.runtime.escape_html(value),"\""].join('');
});
hiccups.runtime.render_attribute = (function hiccups$runtime$render_attribute(p__96532){
var vec__96537 = p__96532;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96537,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96537,(1),null);
if(value === true){
if(hiccups.runtime.xml_mode_QMARK_()){
return hiccups.runtime.xml_attribute(name,name);
} else {
return [" ",hiccups.runtime.as_str(name)].join('');
}
} else {
if(cljs.core.not(value)){
return "";
} else {
return hiccups.runtime.xml_attribute(name,value);

}
}
});
hiccups.runtime.render_attr_map = (function hiccups$runtime$render_attr_map(attrs){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(hiccups.runtime.render_attribute,attrs)));
});
/**
 * Ensure a tag vector is of the form [tag-name attrs content].
 */
hiccups.runtime.normalize_element = (function hiccups$runtime$normalize_element(p__96546){
var vec__96549 = p__96546;
var seq__96550 = cljs.core.seq(vec__96549);
var first__96551 = cljs.core.first(seq__96550);
var seq__96550__$1 = cljs.core.next(seq__96550);
var tag = first__96551;
var content = seq__96550__$1;
if((!((((tag instanceof cljs.core.Keyword)) || ((((tag instanceof cljs.core.Symbol)) || (typeof tag === 'string'))))))){
throw [cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag)," is not a valid tag name"].join('');
} else {
}

var vec__96552 = cljs.core.re_matches(hiccups.runtime.re_tag,hiccups.runtime.as_str(tag));
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96552,(0),null);
var tag__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96552,(1),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96552,(2),null);
var class$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96552,(3),null);
var tag_attrs = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(class$)?clojure.string.replace(class$,"."," "):null)], null);
var map_attrs = cljs.core.first(content);
if(cljs.core.map_QMARK_(map_attrs)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [tag__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tag_attrs,map_attrs], 0)),cljs.core.next(content)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [tag__$1,tag_attrs,content], null);
}
});
/**
 * Render a tag vector as a HTML element.
 */
hiccups.runtime.render_element = (function hiccups$runtime$render_element(element){
var vec__96555 = hiccups.runtime.normalize_element(element);
var tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96555,(0),null);
var attrs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96555,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96555,(2),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (hiccups.runtime.container_tags.cljs$core$IFn$_invoke$arity$1 ? hiccups.runtime.container_tags.cljs$core$IFn$_invoke$arity$1(tag) : hiccups.runtime.container_tags.call(null,tag));
}
})())){
return ["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hiccups.runtime.render_attr_map(attrs)),">",cljs.core.str.cljs$core$IFn$_invoke$arity$1((hiccups.runtime.render_html.cljs$core$IFn$_invoke$arity$1 ? hiccups.runtime.render_html.cljs$core$IFn$_invoke$arity$1(content) : hiccups.runtime.render_html.call(null,content))),"</",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),">"].join('');
} else {
return ["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hiccups.runtime.render_attr_map(attrs)),hiccups.runtime.end_tag()].join('');
}
});
/**
 * Turn a Clojure data type into a string of HTML.
 */
hiccups.runtime.render_html = (function hiccups$runtime$render_html(x){
if(cljs.core.vector_QMARK_(x)){
return hiccups.runtime.render_element(x);
} else {
if(cljs.core.seq_QMARK_(x)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.map.cljs$core$IFn$_invoke$arity$2(hiccups.runtime.render_html,x));
} else {
return hiccups.runtime.as_str(x);

}
}
});

//# sourceMappingURL=hiccups.runtime.js.map
