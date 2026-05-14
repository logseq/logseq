goog.provide('logseq.graph_parser.text');
logseq.graph_parser.text.get_file_basename = logseq.common.util.page_ref.get_file_basename;
logseq.graph_parser.text.get_page_name = logseq.common.util.page_ref.get_page_name;
logseq.graph_parser.text.page_ref_un_brackets_BANG_ = logseq.common.util.page_ref.page_ref_un_brackets_BANG_;
logseq.graph_parser.text.get_nested_page_name = (function logseq$graph_parser$text$get_nested_page_name(page_name){
var temp__5804__auto__ = cljs.core.re_find(logseq.common.util.page_ref.page_ref_without_nested_re,page_name);
if(cljs.core.truth_(temp__5804__auto__)){
var first_match = temp__5804__auto__;
return cljs.core.second(first_match);
} else {
return null;
}
});
logseq.graph_parser.text.remove_level_space_aux_BANG_ = (function logseq$graph_parser$text$remove_level_space_aux_BANG_(text,pattern,space_QMARK_,trim_left_QMARK_){
var pattern__$1 = goog.string.format((cljs.core.truth_(space_QMARK_)?"^[%s]+\\s+":"^[%s]+\\s?"),pattern);
var text__$1 = (cljs.core.truth_(trim_left_QMARK_)?clojure.string.triml(text):text);
return clojure.string.replace_first(text__$1,cljs.core.re_pattern(pattern__$1),"");
});
logseq.graph_parser.text.remove_level_spaces = (function logseq$graph_parser$text$remove_level_spaces(var_args){
var G__62573 = arguments.length;
switch (G__62573) {
case 3:
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3 = (function (text,format,block_pattern){
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$5(text,format,block_pattern,false,true);
}));

(logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$4 = (function (text,format,block_pattern,space_QMARK_){
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$5(text,format,block_pattern,space_QMARK_,true);
}));

(logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$5 = (function (text,format,block_pattern,space_QMARK_,trim_left_QMARK_){
if(cljs.core.truth_(format)){
if(clojure.string.blank_QMARK_(text)){
return "";
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("markdown",cljs.core.name(format))) && (clojure.string.starts_with_QMARK_(text,"---")))){
return text;
} else {
return logseq.graph_parser.text.remove_level_space_aux_BANG_(text,block_pattern,space_QMARK_,trim_left_QMARK_);

}
}
} else {
return null;
}
}));

(logseq.graph_parser.text.remove_level_spaces.cljs$lang$maxFixedArity = 5);

/**
 * Return parsed non-string property value or nil if none is found
 */
logseq.graph_parser.text.parse_non_string_property_value = (function logseq$graph_parser$text$parse_non_string_property_value(v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"true")){
return true;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"false")){
return false;
} else {
if(cljs.core.truth_(cljs.core.re_find(/^\d+$/,v))){
return cljs.core.parse_long(v);
} else {
return null;
}
}
}
});
logseq.graph_parser.text.get_ref_from_ast = (function logseq$graph_parser$text$get_ref_from_ast(p__62598){
var vec__62599 = p__62598;
var typ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62599,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62599,(1),null);
var G__62604 = typ;
switch (G__62604) {
case "Link":
var G__62605 = cljs.core.first(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(data));
switch (G__62605) {
case "Page_ref":
return cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(data));

break;
case "Search":
return cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(data));

break;
default:
return null;

}

break;
case "Nested_link":
return logseq.common.util.page_ref.get_page_name(new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(data));

break;
case "Tag":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Plain",cljs.core.ffirst(data))){
return cljs.core.second(cljs.core.first(data));
} else {
var G__62606 = cljs.core.first(data);
return (logseq.graph_parser.text.get_ref_from_ast.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_ref_from_ast.cljs$core$IFn$_invoke$arity$1(G__62606) : logseq.graph_parser.text.get_ref_from_ast.call(null,G__62606));
}

break;
default:
return null;

}
});
logseq.graph_parser.text.extract_refs_from_mldoc_ast = (function logseq$graph_parser$text$extract_refs_from_mldoc_ast(v){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.remove.cljs$core$IFn$_invoke$arity$1(logseq.graph_parser.mldoc.ast_link_QMARK_),cljs.core.keep.cljs$core$IFn$_invoke$arity$1(logseq.graph_parser.text.get_ref_from_ast),cljs.core.map.cljs$core$IFn$_invoke$arity$1(clojure.string.trim)),v);
});
logseq.graph_parser.text.sep_by_comma = (function logseq$graph_parser$text$sep_by_comma(s){
if(cljs.core.string_QMARK_){
} else {
throw (new Error("Assert failed: string?"));
}

if(cljs.core.truth_(s)){
} else {
throw (new Error("Assert failed: s"));
}

return cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/[\,，]{1}/))));
});
logseq.graph_parser.text.separated_by_commas_QMARK_ = (function logseq$graph_parser$text$separated_by_commas_QMARK_(config_state,k){
var k_SINGLEQUOTE_ = (((k instanceof cljs.core.Keyword))?k:cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k));
return cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.editable_linkable_built_in_properties,cljs.core.set(cljs.core.get.cljs$core$IFn$_invoke$arity$2(config_state,new cljs.core.Keyword("property","separated-by-commas","property/separated-by-commas",1105223737)))),k_SINGLEQUOTE_);
});
logseq.graph_parser.text.extract_refs_by_commas = (function logseq$graph_parser$text$extract_refs_by_commas(v,format){
var plains = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62626_SHARP_){
return ((cljs.core.vector_QMARK_(p1__62626_SHARP_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Plain",cljs.core.first(p1__62626_SHARP_))));
}),cljs.core.second(cljs.core.first(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2(v,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(format)))))));
return cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.graph_parser.text.sep_by_comma,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plains], 0)));
});
logseq.graph_parser.text.parse_property_refs = (function logseq$graph_parser$text$parse_property_refs(k,v,mldoc_references_ast,config_state){
var refs = logseq.graph_parser.text.extract_refs_from_mldoc_ast(mldoc_references_ast);
var property_separated_by_commas_QMARK_ = logseq.graph_parser.text.separated_by_commas_QMARK_(config_state,k);
if(property_separated_by_commas_QMARK_){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(refs,logseq.graph_parser.text.extract_refs_by_commas(v,cljs.core.get.cljs$core$IFn$_invoke$arity$3(config_state,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089))));
} else {
return refs;
}
});
/**
 * Property value parsing that takes into account built-in properties, format
 *   and user config
 */
logseq.graph_parser.text.parse_property = (function logseq$graph_parser$text$parse_property(k,v,mldoc_references_ast,config_state){
var v_SINGLEQUOTE_ = clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v));
if(cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,logseq.graph_parser.property.unparsed_built_in_properties())),cljs.core.get.cljs$core$IFn$_invoke$arity$2(config_state,new cljs.core.Keyword(null,"ignored-page-references-keywords","ignored-page-references-keywords",44006978))),cljs.core.name(k))){
return v_SINGLEQUOTE_;
} else {
if(logseq.common.util.wrapped_by_quotes_QMARK_(v_SINGLEQUOTE_)){
return v_SINGLEQUOTE_;
} else {
var refs = logseq.graph_parser.text.parse_property_refs(k,v_SINGLEQUOTE_,mldoc_references_ast,config_state);
if(cljs.core.seq(refs)){
return refs;
} else {
var temp__5806__auto__ = logseq.graph_parser.text.parse_non_string_property_value(v_SINGLEQUOTE_);
if((temp__5806__auto__ == null)){
return v_SINGLEQUOTE_;
} else {
var new_val = temp__5806__auto__;
return new_val;
}
}

}
}
});
logseq.graph_parser.text.namespace_page_QMARK_ = logseq.common.util.namespace.namespace_page_QMARK_;
logseq.graph_parser.text.get_namespace_last_part = logseq.common.util.namespace.get_last_part;

//# sourceMappingURL=logseq.graph_parser.text.js.map
