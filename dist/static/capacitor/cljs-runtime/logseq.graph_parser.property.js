goog.provide('logseq.graph_parser.property');
/**
 * Property delimiter for markdown mode
 */
logseq.graph_parser.property.colons = "::";
/**
 * Property delimiter for org mode
 */
logseq.graph_parser.property.colons_org = (function logseq$graph_parser$property$colons_org(property){
return [":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property),":"].join('');
});
/**
 * Creates a block content string from properties map
 */
logseq.graph_parser.property.__GT_block_content = (function logseq$graph_parser$property$__GT_block_content(properties){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62166_SHARP_){
return [cljs.core.name(cljs.core.key(p1__62166_SHARP_)),[logseq.graph_parser.property.colons," "].join(''),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.val(p1__62166_SHARP_))].join('');
}),properties));
});
logseq.graph_parser.property.properties_ast_QMARK_ = (function logseq$graph_parser$property$properties_ast_QMARK_(block){
return ((cljs.core.vector_QMARK_(block)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Property_Drawer",null,"Properties",null], null), null),cljs.core.first(block))));
});
logseq.graph_parser.property.valid_property_name_QMARK_ = (function logseq$graph_parser$property$valid_property_name_QMARK_(s){
if(typeof s === 'string'){
} else {
throw (new Error("Assert failed: (string? s)"));
}

var and__5000__auto__ = logseq.common.util.valid_edn_keyword_QMARK_(s);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(cljs.core.re_find(/[\"|^|(|)|{|}]+/,s))) && (cljs.core.not(cljs.core.re_find(/^:#/,s))));
} else {
return and__5000__auto__;
}
});
logseq.graph_parser.property.built_in_extended_properties = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
logseq.graph_parser.property.register_built_in_properties = (function logseq$graph_parser$property$register_built_in_properties(props){
return cljs.core.reset_BANG_(logseq.graph_parser.property.built_in_extended_properties,clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.graph_parser.property.built_in_extended_properties),props));
});
/**
 * Properties used by logseq that user can edit and that can have linkable property values
 */
logseq.graph_parser.property.editable_linkable_built_in_properties = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tags","tags",1771418977),null,new cljs.core.Keyword(null,"alias","alias",-2039751630),null,new cljs.core.Keyword(null,"aliases","aliases",1346874714),null], null), null);
/**
 * Properties used by logseq that user can edit
 */
logseq.graph_parser.property.editable_built_in_properties = (function logseq$graph_parser$property$editable_built_in_properties(){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 10, [new cljs.core.Keyword(null,"template-including-parent","template-including-parent",1449989665),null,new cljs.core.Keyword(null,"filetags","filetags",-1157605850),null,new cljs.core.Keyword(null,"filters","filters",974726919),null,new cljs.core.Keyword(null,"public","public",1566243851),null,new cljs.core.Keyword(null,"template","template",-702405684),null,new cljs.core.Keyword(null,"icon","icon",1679606541),null,new cljs.core.Keyword(null,"title","title",636505583),null,new cljs.core.Keyword(null,"exclude-from-graph-view","exclude-from-graph-view",-1509369969),null,new cljs.core.Keyword("logseq.query","nlp-date","logseq.query/nlp-date",-145078221),null,new cljs.core.Keyword(null,"macro","macro",-867863404),null], null), null),logseq.graph_parser.property.editable_linkable_built_in_properties);
});
/**
 * Properties used by logseq that user can't edit or see
 */
logseq.graph_parser.property.hidden_built_in_properties = (function logseq$graph_parser$property$hidden_built_in_properties(){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 29, [new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336),null,new cljs.core.Keyword(null,"last_modified_at","last_modified_at",-1069251263),null,new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033),null,new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366),null,new cljs.core.Keyword(null,"query-table","query-table",2095143554),null,new cljs.core.Keyword(null,"doing","doing",-3342172),null,new cljs.core.Keyword(null,"done","done",-889844188),null,new cljs.core.Keyword(null,"hl-type","hl-type",992471876),null,new cljs.core.Keyword(null,"now","now",-1650525531),null,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),null,new cljs.core.Keyword(null,"later","later",961723974),null,new cljs.core.Keyword(null,"hl-value","hl-value",-755264538),null,new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905),null,new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),null,new cljs.core.Keyword(null,"custom-id","custom-id",-615733336),null,new cljs.core.Keyword(null,"hl-page","hl-page",949012424),null,new cljs.core.Keyword(null,"ls-type","ls-type",1383834313),null,new cljs.core.Keyword(null,"background_color","background_color",-1953390743),null,new cljs.core.Keyword(null,"last-modified-at","last-modified-at",478765450),null,new cljs.core.Keyword(null,"background-color","background-color",570434026),null,new cljs.core.Keyword(null,"logseq.tldraw.page","logseq.tldraw.page",-1937463021),null,new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"todo","todo",-1046442570),null,new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008),null,new cljs.core.Keyword(null,"query-properties","query-properties",-953532199),null,new cljs.core.Keyword(null,"created-at","created-at",-89248644),null,new cljs.core.Keyword(null,"hl-color","hl-color",1100781725),null,new cljs.core.Keyword(null,"created_at","created_at",1484050750),null,new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null),cljs.core.deref(logseq.graph_parser.property.built_in_extended_properties));
});
/**
 * Types for built-in properties. Built-in properties whose values are to be
 *   parsed by gp-text/parse-non-string-property-value should be added here
 */
logseq.graph_parser.property.built_in_property_types = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336),new cljs.core.Keyword(null,"last_modified_at","last_modified_at",-1069251263),new cljs.core.Keyword(null,"template-including-parent","template-including-parent",1449989665),new cljs.core.Keyword(null,"query-table","query-table",2095143554),new cljs.core.Keyword(null,"doing","doing",-3342172),new cljs.core.Keyword(null,"done","done",-889844188),new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),new cljs.core.Keyword(null,"later","later",961723974),new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),new cljs.core.Keyword(null,"hl-page","hl-page",949012424),new cljs.core.Keyword(null,"last-modified-at","last-modified-at",478765450),new cljs.core.Keyword(null,"public","public",1566243851),new cljs.core.Keyword(null,"exclude-from-graph-view","exclude-from-graph-view",-1509369969),new cljs.core.Keyword("logseq.query","nlp-date","logseq.query/nlp-date",-145078221),new cljs.core.Keyword(null,"todo","todo",-1046442570),new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword(null,"created_at","created_at",1484050750),new cljs.core.Keyword(null,"heading","heading",-1312171873)],[new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"integer","integer",-604721710),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)]);
if(clojure.set.subset_QMARK_(cljs.core.set(cljs.core.keys(logseq.graph_parser.property.built_in_property_types)),clojure.set.union.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.hidden_built_in_properties(),logseq.graph_parser.property.editable_built_in_properties()))){
} else {
throw (new Error(["Assert failed: ","Keys of built-in-property-types must be valid built-in properties","\n","(set/subset? (set (keys built-in-property-types)) (set/union (hidden-built-in-properties) (editable-built-in-properties)))"].join('')));
}
/**
 * Properties whose values will not be parsed by gp-text/parse-property
 */
logseq.graph_parser.property.unparsed_built_in_properties = (function logseq$graph_parser$property$unparsed_built_in_properties(){
return clojure.set.difference.cljs$core$IFn$_invoke$arity$variadic(clojure.set.union.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.hidden_built_in_properties(),logseq.graph_parser.property.editable_built_in_properties()),cljs.core.deref(logseq.graph_parser.property.built_in_extended_properties),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.graph_parser.property.editable_linkable_built_in_properties,cljs.core.set(cljs.core.keys(logseq.graph_parser.property.built_in_property_types))], 0));
});
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.property !== 'undefined') && (typeof logseq.graph_parser.property.properties_start !== 'undefined')){
} else {
logseq.graph_parser.property.properties_start = ":PROPERTIES:";
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.property !== 'undefined') && (typeof logseq.graph_parser.property.properties_end !== 'undefined')){
} else {
logseq.graph_parser.property.properties_end = ":END:";
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.property !== 'undefined') && (typeof logseq.graph_parser.property.properties_end_pattern !== 'undefined')){
} else {
logseq.graph_parser.property.properties_end_pattern = cljs.core.re_pattern(goog.string.format("%s[\t\r ]*\n|(%s\\s*$)",logseq.graph_parser.property.properties_end,logseq.graph_parser.property.properties_end));
}
logseq.graph_parser.property.contains_properties_QMARK_ = (function logseq$graph_parser$property$contains_properties_QMARK_(content){
if(cljs.core.truth_(content)){
var and__5000__auto__ = clojure.string.includes_QMARK_(content,logseq.graph_parser.property.properties_start);
if(and__5000__auto__){
return cljs.core.re_find(logseq.graph_parser.property.properties_end_pattern,content);
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
/**
 * New syntax: key:: value
 */
logseq.graph_parser.property.__GT_new_properties = (function logseq$graph_parser$property$__GT_new_properties(content){
if(cljs.core.truth_(logseq.graph_parser.property.contains_properties_QMARK_(content))){
var lines = clojure.string.split_lines(content);
var start_idx = lines.indexOf(logseq.graph_parser.property.properties_start);
var end_idx = lines.indexOf(logseq.graph_parser.property.properties_end);
if((((start_idx >= (0))) && ((((end_idx > (0))) && ((end_idx > start_idx)))))){
var before = cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(lines,(0),start_idx);
var middle = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (text){
var vec__62236 = logseq.common.util.split_first(":",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(text,(1)));
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62236,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62236,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = k;
if(cljs.core.truth_(and__5000__auto__)){
return v;
} else {
return and__5000__auto__;
}
})())){
var k__$1 = clojure.string.replace(k,"_","-");
var compare_k = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(k__$1));
var k__$2 = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"custom-id","custom-id",-615733336),null,new cljs.core.Keyword(null,"custom_id","custom_id",834948303),null,new cljs.core.Keyword(null,"id","id",-1388402092),null], null), null),compare_k))?"id":k__$1);
var k__$3 = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-modified-at","last-modified-at",478765450),null], null), null),compare_k))?"updated-at":k__$2);
return [k__$3,logseq.graph_parser.property.colons," ",clojure.string.trim(v)].join('');
} else {
return text;
}
}),cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(lines,(start_idx + (1)),end_idx));
var after = cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(lines,(end_idx + (1)));
var lines__$1 = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(before,middle,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([after], 0));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines__$1);
} else {
return content;
}
} else {
return content;
}
});
logseq.graph_parser.property.build_properties_str = (function logseq$graph_parser$property$build_properties_str(format,properties){
if(cljs.core.seq(properties)){
var org_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
var kv_format = ((org_QMARK_)?":%s: %s":["%s",logseq.graph_parser.property.colons," %s"].join(''));
var full_format = ((org_QMARK_)?":PROPERTIES:\n%s\n:END:":"%s\n");
var properties_content = clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__62251){
var vec__62253 = p__62251;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62253,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62253,(1),null);
return goog.string.format(kv_format,cljs.core.name(k),v);
}),properties));
return goog.string.format(full_format,properties_content);
} else {
return null;
}
});
logseq.graph_parser.property.simplified_property_QMARK_ = (function logseq$graph_parser$property$simplified_property_QMARK_(line){
return cljs.core.boolean$((function (){var and__5000__auto__ = typeof line === 'string';
if(and__5000__auto__){
return cljs.core.re_find(cljs.core.re_pattern(["^\\s?[^ ]+",logseq.graph_parser.property.colons].join('')),line);
} else {
return and__5000__auto__;
}
})());
});
logseq.graph_parser.property.front_matter_property_QMARK_ = (function logseq$graph_parser$property$front_matter_property_QMARK_(line){
return cljs.core.boolean$((function (){var and__5000__auto__ = typeof line === 'string';
if(and__5000__auto__){
return logseq.common.util.safe_re_find(/^\s*[^ ]+:/,line);
} else {
return and__5000__auto__;
}
})());
});
logseq.graph_parser.property.insert_property_not_org = (function logseq$graph_parser$property$insert_property_not_org(key_STAR_,value,lines,p__62277){
var map__62278 = p__62277;
var map__62278__$1 = cljs.core.__destructure_map(map__62278);
var front_matter_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62278__$1,new cljs.core.Keyword(null,"front-matter?","front-matter?",-1524574675));
var has_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62278__$1,new cljs.core.Keyword(null,"has-properties?","has-properties?",-1165607917));
var title_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62278__$1,new cljs.core.Keyword(null,"title?","title?",-1510254555));
var exists_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var sym = (cljs.core.truth_(front_matter_QMARK_)?": ":[logseq.graph_parser.property.colons," "].join(''));
var new_property_s = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(key_STAR_),sym,cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('');
var property_f = (cljs.core.truth_(front_matter_QMARK_)?logseq.graph_parser.property.front_matter_property_QMARK_:logseq.graph_parser.property.simplified_property_QMARK_);
var groups = cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2(property_f,lines);
var compose_lines = (function (){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (lines__$1){
if(cljs.core.truth_((function (){var G__62286 = cljs.core.first(lines__$1);
return (property_f.cljs$core$IFn$_invoke$arity$1 ? property_f.cljs$core$IFn$_invoke$arity$1(G__62286) : property_f.call(null,G__62286));
})())){
var lines__$2 = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (text){
var vec__62292 = logseq.common.util.split_first(sym,text);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62292,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62292,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = k;
if(cljs.core.truth_(and__5000__auto__)){
return v;
} else {
return and__5000__auto__;
}
})())){
var key_exists_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,key_STAR_);
var _ = ((key_exists_QMARK_)?cljs.core.reset_BANG_(exists_QMARK_,true):null);
var v__$1 = ((key_exists_QMARK_)?value:v);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),sym,clojure.string.trim(v__$1)].join('');
} else {
return text;
}
}),lines__$1));
var lines__$3 = (cljs.core.truth_(cljs.core.deref(exists_QMARK_))?lines__$2:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(lines__$2,new_property_s));
return lines__$3;
} else {
return lines__$1;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([groups], 0));
});
var lines__$1 = (cljs.core.truth_(has_properties_QMARK_)?compose_lines():(cljs.core.truth_(title_QMARK_)?cljs.core.cons(cljs.core.first(lines),cljs.core.cons(new_property_s,cljs.core.rest(lines))):cljs.core.cons(new_property_s,lines)
));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines__$1);
});
/**
 * Only accept nake content (without any indentation)
 */
logseq.graph_parser.property.insert_property = (function logseq$graph_parser$property$insert_property(var_args){
var G__62366 = arguments.length;
switch (G__62366) {
case 5:
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5 = (function (repo,format,content,key,value){
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$6(repo,format,content,key,value,false);
}));

(logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$6 = (function (repo,format,content,key,value,front_matter_QMARK_){
if(typeof content === 'string'){
var ast = logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3(repo,content,format);
var title_QMARK_ = logseq.graph_parser.mldoc.block_with_title_QMARK_(cljs.core.ffirst(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,ast)));
var has_properties_QMARK_ = ((((title_QMARK_) && (((logseq.graph_parser.mldoc.properties_QMARK_(cljs.core.second(ast))) || (logseq.graph_parser.mldoc.properties_QMARK_(cljs.core.second(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__62379){
var vec__62380 = p__62379;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62380,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62380,(1),null);
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Raw_Html",null,"Hiccup",null], null), null),cljs.core.first(x));
}),ast)))))))) || (logseq.graph_parser.mldoc.properties_QMARK_(cljs.core.first(ast))));
var lines = clojure.string.split_lines(content);
var vec__62373 = logseq.graph_parser.mldoc.get_title_AMPERSAND_body(repo,content,format);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62373,(0),null);
var body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62373,(1),null);
var scheduled = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62340_SHARP_){
return clojure.string.starts_with_QMARK_(p1__62340_SHARP_,"SCHEDULED");
}),lines);
var deadline = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62341_SHARP_){
return clojure.string.starts_with_QMARK_(p1__62341_SHARP_,"DEADLINE");
}),lines);
var body_without_timestamps = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62342_SHARP_){
return (!(((clojure.string.starts_with_QMARK_(p1__62342_SHARP_,"SCHEDULED")) || (clojure.string.starts_with_QMARK_(p1__62342_SHARP_,"DEADLINE")))));
}),clojure.string.split_lines(body));
var org_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format);
var key__$1 = clojure.string.lower_case(cljs.core.name(key));
var value__$1 = clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
var start_idx = lines.indexOf(logseq.graph_parser.property.properties_start);
var end_idx = lines.indexOf(logseq.graph_parser.property.properties_end);
var result = ((((org_QMARK_) && ((!(has_properties_QMARK_)))))?(function (){var properties = logseq.graph_parser.property.build_properties_str(format,cljs.core.PersistentArrayMap.createAsIfByAssoc([key__$1,value__$1]));
if(cljs.core.truth_(title)){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [title], null),scheduled,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deadline,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [properties], null),body_without_timestamps], 0)));
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(properties),"\n",content].join('');
}
})():((((has_properties_QMARK_) && ((((start_idx >= (0))) && ((((end_idx > (0))) && ((end_idx > start_idx))))))))?(function (){var exists_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var before = cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(lines,(0),start_idx);
var middle = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (text){
var vec__62393 = logseq.common.util.split_first(":",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(text,(1)));
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62393,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62393,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = k;
if(cljs.core.truth_(and__5000__auto__)){
return v;
} else {
return and__5000__auto__;
}
})())){
var key_exists_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,key__$1);
var _ = ((key_exists_QMARK_)?cljs.core.reset_BANG_(exists_QMARK_,true):null);
var v__$1 = ((key_exists_QMARK_)?value__$1:v);
return [":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),": ",clojure.string.trim(v__$1)].join('');
} else {
return text;
}
}),cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(lines,(start_idx + (1)),end_idx)));
var middle__$1 = (cljs.core.truth_(cljs.core.deref(exists_QMARK_))?middle:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(middle,[":",key__$1,": ",value__$1].join('')));
var after = cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(lines,(end_idx + (1)));
var lines__$1 = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(before,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.property.properties_start], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([middle__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.property.properties_end], null),after], 0));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines__$1);
})():(((!(org_QMARK_)))?logseq.graph_parser.property.insert_property_not_org(key__$1,value__$1,lines,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"has-properties?","has-properties?",-1165607917),has_properties_QMARK_,new cljs.core.Keyword(null,"title?","title?",-1510254555),title_QMARK_,new cljs.core.Keyword(null,"front-matter?","front-matter?",-1524574675),front_matter_QMARK_], null)):content
)));
return clojure.string.trimr(result);
} else {
return null;
}
}));

(logseq.graph_parser.property.insert_property.cljs$lang$maxFixedArity = 6);

logseq.graph_parser.property.remove_property = (function logseq$graph_parser$property$remove_property(var_args){
var G__62407 = arguments.length;
switch (G__62407) {
case 3:
return logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$3 = (function (format,key,content){
return logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$4(format,key,content,true);
}));

(logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$4 = (function (format,key,content,first_QMARK_){
if((!(clojure.string.blank_QMARK_(cljs.core.name(key))))){
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var key__$1 = clojure.string.lower_case(cljs.core.name(key));
var remove_f = (cljs.core.truth_(first_QMARK_)?logseq.common.util.remove_first:cljs.core.remove);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format__$1,new cljs.core.Keyword(null,"org","org",1495985))) && (cljs.core.not(logseq.graph_parser.property.contains_properties_QMARK_(content))))){
return content;
} else {
var lines = (function (){var G__62415 = (function (line){
var s = clojure.string.triml(clojure.string.lower_case(line));
return ((clojure.string.starts_with_QMARK_(s,[":",key__$1,":"].join(''))) || (clojure.string.starts_with_QMARK_(s,[key__$1,logseq.graph_parser.property.colons," "].join(''))));
});
var G__62416 = clojure.string.split_lines(content);
return (remove_f.cljs$core$IFn$_invoke$arity$2 ? remove_f.cljs$core$IFn$_invoke$arity$2(G__62415,G__62416) : remove_f.call(null,G__62415,G__62416));
})();
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines);
}
} else {
return null;
}
}));

(logseq.graph_parser.property.remove_property.cljs$lang$maxFixedArity = 4);

logseq.graph_parser.property.remove_properties = (function logseq$graph_parser$property$remove_properties(format,content){
if(cljs.core.truth_(logseq.graph_parser.property.contains_properties_QMARK_(content))){
var lines = clojure.string.split_lines(content);
var vec__62427 = cljs.core.split_with((function (p1__62422_SHARP_){
return (!(clojure.string.starts_with_QMARK_(clojure.string.upper_case(clojure.string.triml(p1__62422_SHARP_)),logseq.graph_parser.property.properties_start)));
}),lines);
var title_lines = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62427,(0),null);
var properties_AMPERSAND_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62427,(1),null);
var body = cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (p1__62424_SHARP_){
return (((!(clojure.string.starts_with_QMARK_(clojure.string.upper_case(clojure.string.trim(p1__62424_SHARP_)),logseq.graph_parser.property.properties_end)))) || (clojure.string.blank_QMARK_(p1__62424_SHARP_)));
}),properties_AMPERSAND_body);
var body__$1 = ((((cljs.core.seq(body)) && (clojure.string.starts_with_QMARK_(clojure.string.upper_case(clojure.string.triml(cljs.core.first(body))),logseq.graph_parser.property.properties_end))))?(function (){var line = clojure.string.replace(cljs.core.first(body),/:END:\s?/i,"");
if(clojure.string.blank_QMARK_(line)){
return cljs.core.rest(body);
} else {
return cljs.core.cons(line,cljs.core.rest(body));
}
})():body);
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.concat.cljs$core$IFn$_invoke$arity$2(title_lines,body__$1));
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985))){
var lines = clojure.string.split_lines(content);
var lines__$1 = ((logseq.graph_parser.property.simplified_property_QMARK_(cljs.core.first(lines)))?cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.simplified_property_QMARK_,lines):cljs.core.cons(cljs.core.first(lines),cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.simplified_property_QMARK_,cljs.core.rest(lines))));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines__$1);
} else {
return content;

}
}
});
logseq.graph_parser.property.insert_properties = (function logseq$graph_parser$property$insert_properties(repo,format,content,kvs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,p__62437){
var vec__62438 = p__62437;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62438,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62438,(1),null);
var k__$1 = ((typeof k === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.lower_case(k)," ","-")):k);
var v__$1 = ((cljs.core.coll_QMARK_(v))?(function (){var G__62444 = cljs.core.seq(v);
var G__62444__$1 = (((G__62444 == null))?null:cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(G__62444));
var G__62444__$2 = (((G__62444__$1 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
return logseq.common.util.page_ref.__GT_page_ref(logseq.common.util.page_ref.page_ref_un_brackets_BANG_(item));
}),G__62444__$1));
if((G__62444__$2 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",G__62444__$2);
}
})():(((v instanceof cljs.core.Keyword))?cljs.core.name(v):v));
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5(repo,format,content__$1,k__$1,v__$1);
}),content,kvs);
});

//# sourceMappingURL=logseq.graph_parser.property.js.map
