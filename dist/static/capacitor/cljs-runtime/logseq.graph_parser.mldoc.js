goog.provide('logseq.graph_parser.mldoc');
goog.scope(function(){
  logseq.graph_parser.mldoc.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$mldoc$index=shadow.js.require("module$node_modules$mldoc$index", {});
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.mldoc !== 'undefined') && (typeof logseq.graph_parser.mldoc.parseJson !== 'undefined')){
} else {
logseq.graph_parser.mldoc.parseJson = logseq.graph_parser.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"parseJson");
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.mldoc !== 'undefined') && (typeof logseq.graph_parser.mldoc.parseInlineJson !== 'undefined')){
} else {
logseq.graph_parser.mldoc.parseInlineJson = logseq.graph_parser.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"parseInlineJson");
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.mldoc !== 'undefined') && (typeof logseq.graph_parser.mldoc.astExportMarkdown !== 'undefined')){
} else {
logseq.graph_parser.mldoc.astExportMarkdown = logseq.graph_parser.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"astExportMarkdown");
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.mldoc !== 'undefined') && (typeof logseq.graph_parser.mldoc.getReferences !== 'undefined')){
} else {
logseq.graph_parser.mldoc.getReferences = logseq.graph_parser.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"getReferences");
}
logseq.graph_parser.mldoc.default_references = JSON.stringify(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"embed_blocks","embed_blocks",785928846),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"embed_pages","embed_pages",94877387),cljs.core.PersistentVector.EMPTY], null)));
logseq.graph_parser.mldoc.convert_export_md_remove_options = (function logseq$graph_parser$mldoc$convert_export_md_remove_options(opts){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (opt){
var G__61396 = opt;
var G__61396__$1 = (((G__61396 instanceof cljs.core.Keyword))?G__61396.fqn:null);
switch (G__61396__$1) {
case "page-ref":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Page_ref"], null);

break;
case "emphasis":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Emphasis"], null);

break;
default:
return cljs.core.PersistentVector.EMPTY;

}
}),opts));
});
logseq.graph_parser.mldoc.parse_json = (function logseq$graph_parser$mldoc$parse_json(content,config){
return (logseq.graph_parser.mldoc.parseJson.cljs$core$IFn$_invoke$arity$2 ? logseq.graph_parser.mldoc.parseJson.cljs$core$IFn$_invoke$arity$2(content,config) : logseq.graph_parser.mldoc.parseJson.call(null,content,config));
});
logseq.graph_parser.mldoc.inline_parse_json = (function logseq$graph_parser$mldoc$inline_parse_json(text,config){
return (logseq.graph_parser.mldoc.parseInlineJson.cljs$core$IFn$_invoke$arity$2 ? logseq.graph_parser.mldoc.parseInlineJson.cljs$core$IFn$_invoke$arity$2(text,config) : logseq.graph_parser.mldoc.parseInlineJson.call(null,text,config));
});
logseq.graph_parser.mldoc.get_references = (function logseq$graph_parser$mldoc$get_references(text,config){
if(clojure.string.blank_QMARK_(text)){
return null;
} else {
return logseq.common.util.json__GT_clj((logseq.graph_parser.mldoc.getReferences.cljs$core$IFn$_invoke$arity$2 ? logseq.graph_parser.mldoc.getReferences.cljs$core$IFn$_invoke$arity$2(text,config) : logseq.graph_parser.mldoc.getReferences.call(null,text,config)));
}
});
logseq.graph_parser.mldoc.ast_export_markdown = (function logseq$graph_parser$mldoc$ast_export_markdown(ast,config,references){
var G__61422 = ast;
var G__61423 = config;
var G__61424 = (function (){var or__5002__auto__ = references;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.mldoc.default_references;
}
})();
return (logseq.graph_parser.mldoc.astExportMarkdown.cljs$core$IFn$_invoke$arity$3 ? logseq.graph_parser.mldoc.astExportMarkdown.cljs$core$IFn$_invoke$arity$3(G__61422,G__61423,G__61424) : logseq.graph_parser.mldoc.astExportMarkdown.call(null,G__61422,G__61423,G__61424));
});
logseq.graph_parser.mldoc.default_config_map = (function logseq$graph_parser$mldoc$default_config_map(var_args){
var G__61454 = arguments.length;
switch (G__61454) {
case 1:
return logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$1 = (function (format){
return logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-heading-to-list?","export-heading-to-list?",-596132321),false], null));
}));

(logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$2 = (function (format,p__61474){
var map__61483 = p__61474;
var map__61483__$1 = cljs.core.__destructure_map(map__61483);
var export_heading_to_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61483__$1,new cljs.core.Keyword(null,"export-heading-to-list?","export-heading-to-list?",-596132321));
var export_keep_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61483__$1,new cljs.core.Keyword(null,"export-keep-properties?","export-keep-properties?",1001383866));
var export_md_indent_style = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61483__$1,new cljs.core.Keyword(null,"export-md-indent-style","export-md-indent-style",481813710));
var export_md_remove_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61483__$1,new cljs.core.Keyword(null,"export-md-remove-options","export-md-remove-options",-1015252352));
var parse_outline_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61483__$1,new cljs.core.Keyword(null,"parse_outline_only?","parse_outline_only?",-731229637));
var format__$1 = clojure.string.capitalize(cljs.core.name((function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})()));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__61445_SHARP_){
return (!((cljs.core.second(p1__61445_SHARP_) == null)));
}),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"toc","toc",2050089251),new cljs.core.Keyword(null,"export_md_indent_style","export_md_indent_style",-323704308),new cljs.core.Keyword(null,"exporting_keep_properties","exporting_keep_properties",-955323347),new cljs.core.Keyword(null,"parse_outline_only","parse_outline_only",-1224318063),new cljs.core.Keyword(null,"export_md_remove_options","export_md_remove_options",-1267687277),new cljs.core.Keyword(null,"heading_to_list","heading_to_list",-525406087),new cljs.core.Keyword(null,"heading_number","heading_number",1357313628),new cljs.core.Keyword(null,"keep_line_break","keep_line_break",-1954057059)],[format__$1,false,export_md_indent_style,export_keep_properties_QMARK_,(function (){var or__5002__auto__ = parse_outline_only_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})(),logseq.graph_parser.mldoc.convert_export_md_remove_options(export_md_remove_options),(function (){var or__5002__auto__ = export_heading_to_list_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})(),false,true])));
}));

(logseq.graph_parser.mldoc.default_config_map.cljs$lang$maxFixedArity = 2);

logseq.graph_parser.mldoc.default_config = (function logseq$graph_parser$mldoc$default_config(var_args){
var G__61532 = arguments.length;
switch (G__61532) {
case 1:
return logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1 = (function (format){
return logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-heading-to-list?","export-heading-to-list?",-596132321),false], null));
}));

(logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$2 = (function (format,opts){
return JSON.stringify(cljs_bean.core.__GT_js(logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$2(format,opts)));
}));

(logseq.graph_parser.mldoc.default_config.cljs$lang$maxFixedArity = 2);

/**
 * Remove the indentation spaces from the content. Only for markdown.
 * level - ast level + 1 (2 for the first level, 3 for the second level, etc., as the non-first line of multi-line block has 2 more space
 *         Ex.
 *            - level 1 multiline block first line
 *              level 1 multiline block second line
 *            	- level 2 multiline block first line
 *            	  level 2 multiline block second line
 * remove-first-line? - apply the indentation removal to the first line or not
 */
logseq.graph_parser.mldoc.remove_indentation_spaces = (function logseq$graph_parser$mldoc$remove_indentation_spaces(s,level,remove_first_line_QMARK_){
var lines = clojure.string.split_lines(s);
var vec__61582 = lines;
var seq__61583 = cljs.core.seq(vec__61582);
var first__61584 = cljs.core.first(seq__61583);
var seq__61583__$1 = cljs.core.next(seq__61583);
var f = first__61584;
var r = seq__61583__$1;
var body = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (line){
if(clojure.string.blank_QMARK_(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(line,(0),level))){
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(line,level);
} else {
return clojure.string.triml(line);
}
}),(cljs.core.truth_(remove_first_line_QMARK_)?lines:r));
var content = (cljs.core.truth_(remove_first_line_QMARK_)?body:cljs.core.cons(f,body));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",content);
});
logseq.graph_parser.mldoc.update_src_full_content = (function logseq$graph_parser$mldoc$update_src_full_content(ast,content){
var content__$1 = logseq.graph_parser.utf8.encode(content);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__61636){
var vec__61637 = p__61636;
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61637,(0),null);
var pos_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61637,(1),null);
if(((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Src",cljs.core.first(block))))){
var map__61650 = pos_meta;
var map__61650__$1 = cljs.core.__destructure_map(map__61650);
var start_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61650__$1,new cljs.core.Keyword(null,"start_pos","start_pos",272375959));
var end_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61650__$1,new cljs.core.Keyword(null,"end_pos","end_pos",-1418940));
var content__$2 = logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3(content__$1,start_pos,end_pos);
var spaces = cljs.core.re_find(/^[\t ]+/,cljs.core.first(clojure.string.split_lines(content__$2)));
var content__$3 = (cljs.core.truth_(spaces)?logseq.graph_parser.mldoc.remove_indentation_spaces(content__$2,cljs.core.count(spaces),true):content__$2);
var block__$1 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Src",cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.second(block),new cljs.core.Keyword(null,"full_content","full_content",-1214517830),content__$3)], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block__$1,pos_meta], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,pos_meta], null);
}
}),ast);
});
logseq.graph_parser.mldoc.collect_page_properties = (function logseq$graph_parser$mldoc$collect_page_properties(ast,config){
if(cljs.core.seq(ast)){
var original_ast = ast;
var directive_QMARK_ = (function (p__61679){
var vec__61680 = p__61679;
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61680,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61680,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("directive",clojure.string.lower_case(cljs.core.first(item)));
});
var grouped_ast = cljs.core.group_by(directive_QMARK_,original_ast);
var vec__61670 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_ast,true)),cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_ast,false)], null);
var properties_ast = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61670,(0),null);
var other_ast = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61670,(1),null);
var properties = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__61700){
var vec__61701 = p__61700;
var _directive = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61701,(0),null);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61701,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61701,(2),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v,logseq.graph_parser.mldoc.get_references(v,config)], null);
}),properties_ast);
if(cljs.core.seq(properties)){
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Properties",properties], null),null], null),other_ast);
} else {
return original_ast;
}
} else {
return null;
}
});
/**
 * Gets a mldoc default config for the given format. Works for DB and file graphs
 */
logseq.graph_parser.mldoc.get_default_config = (function logseq$graph_parser$mldoc$get_default_config(repo,format){
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
return JSON.stringify(cljs_bean.core.__GT_js((function (){var G__61710 = logseq.graph_parser.mldoc.default_config_map.cljs$core$IFn$_invoke$arity$1(format);
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__61710,new cljs.core.Keyword(null,"enable_drawers","enable_drawers",741491867),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parse_marker","parse_marker",767731762),false,new cljs.core.Keyword(null,"parse_priority","parse_priority",-1503633537),false], 0));
} else {
return G__61710;
}
})()));
});
logseq.graph_parser.mldoc.__GT_edn = (function logseq$graph_parser$mldoc$__GT_edn(var_args){
var G__61723 = arguments.length;
switch (G__61723) {
case 2:
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2 = (function (content,config){
if(typeof content === 'string'){
try{if(clojure.string.blank_QMARK_(content)){
return cljs.core.PersistentVector.EMPTY;
} else {
return logseq.graph_parser.mldoc.collect_page_properties(logseq.graph_parser.mldoc.update_src_full_content(logseq.common.util.json__GT_clj(logseq.graph_parser.mldoc.parse_json(content,config)),content),config);
}
}catch (e61749){var e = e61749;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.graph-parser.mldoc",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"unexpected-error","unexpected-error",1973845951),e,new cljs.core.Keyword(null,"line","line",212345235),168], null)),null);

return cljs.core.PersistentVector.EMPTY;
}} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.graph-parser.mldoc",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("edn","wrong-content-type","edn/wrong-content-type",-1345928079),content,new cljs.core.Keyword(null,"line","line",212345235),170], null)),null);
}
}));

(logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3 = (function (repo,content,format){
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2(content,logseq.graph_parser.mldoc.get_default_config(repo,format));
}));

(logseq.graph_parser.mldoc.__GT_edn.cljs$lang$maxFixedArity = 3);

logseq.graph_parser.mldoc.inline__GT_edn = (function logseq$graph_parser$mldoc$inline__GT_edn(text,config){
try{if(clojure.string.blank_QMARK_(text)){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
return logseq.common.util.json__GT_clj(logseq.graph_parser.mldoc.inline_parse_json(text,config));
}
}catch (e61759){var _e = e61759;
return cljs.core.PersistentVector.EMPTY;
}});
logseq.graph_parser.mldoc.ast_link_QMARK_ = (function logseq$graph_parser$mldoc$ast_link_QMARK_(p__61779){
var vec__61784 = p__61779;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61784,(0),null);
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61784,(1),null);
var vec__61791 = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(link);
var ref_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61791,(0),null);
var ref_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61791,(1),null);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Link",type)) && ((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Page_ref",null,"Block_ref",null], null), null),ref_type)))) || (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Page_ref",null], null), null),ref_type)) && (((logseq.common.config.draw_QMARK_(ref_value)) || (cljs.core.boolean$(logseq.common.config.local_asset_QMARK_(ref_value))))))))));
});
logseq.graph_parser.mldoc.link_QMARK_ = (function logseq$graph_parser$mldoc$link_QMARK_(format,link){
if(typeof link === 'string'){
var G__61804 = cljs.core.first(logseq.graph_parser.mldoc.inline__GT_edn(link,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(format)));
if((G__61804 == null)){
return null;
} else {
return logseq.graph_parser.mldoc.ast_link_QMARK_(G__61804);
}
} else {
return null;
}
});
/**
 * Check whether s is a link (including page/block refs).
 */
logseq.graph_parser.mldoc.mldoc_link_QMARK_ = (function logseq$graph_parser$mldoc$mldoc_link_QMARK_(format,s){
var result = logseq.graph_parser.mldoc.inline__GT_edn(s,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(format));
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(result));
if(and__5000__auto__){
var result_SINGLEQUOTE_ = cljs.core.first(result);
return ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Nested_link",null], null), null),cljs.core.first(result_SINGLEQUOTE_))) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["Complex",null,"Page_ref",null,"Block_ref",null], null), null),cljs.core.first(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(result_SINGLEQUOTE_))))));
} else {
return and__5000__auto__;
}
});
logseq.graph_parser.mldoc.properties_QMARK_ = (function logseq$graph_parser$mldoc$properties_QMARK_(ast){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Property_Drawer",null,"Properties",null], null), null),cljs.core.ffirst(ast));
});
logseq.graph_parser.mldoc.block_with_title_QMARK_ = (function logseq$graph_parser$mldoc$block_with_title_QMARK_(type){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["Raw_Html",null,"Hiccup",null,"Paragraph",null,"Heading",null], null), null),type);
});
logseq.graph_parser.mldoc.has_title_QMARK_ = (function logseq$graph_parser$mldoc$has_title_QMARK_(repo,content,format){
var ast = logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3(repo,content,format);
return logseq.graph_parser.mldoc.block_with_title_QMARK_(cljs.core.ffirst(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,ast)));
});
/**
 * parses content and returns [title body]
 * returns nil if no title
 */
logseq.graph_parser.mldoc.get_title_AMPERSAND_body = (function logseq$graph_parser$mldoc$get_title_AMPERSAND_body(repo,content,format){
var lines = clojure.string.split_lines(content);
if(logseq.graph_parser.mldoc.has_title_QMARK_(repo,content,format)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(lines),clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.rest(lines))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines)], null);
}
});

//# sourceMappingURL=logseq.graph_parser.mldoc.js.map
