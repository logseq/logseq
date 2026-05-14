goog.provide('frontend.handler.file_based.property.util');
/**
 * These are properties hidden from user including built-in ones and ones
 *   configured by user
 */
frontend.handler.file_based.property.util.hidden_properties = (function frontend$handler$file_based$property$util$hidden_properties(){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.hidden_built_in_properties(),cljs.core.set(frontend.config.get_block_hidden_properties()));
});
/**
 * Alias to hidden-properties to keep existing behavior
 */
frontend.handler.file_based.property.util.built_in_properties = frontend.handler.file_based.property.util.hidden_properties;
frontend.handler.file_based.property.util.remove_empty_properties = (function frontend$handler$file_based$property$util$remove_empty_properties(content){
if(cljs.core.truth_(logseq.graph_parser.property.contains_properties_QMARK_(content))){
return clojure.string.replace(content,cljs.core.re_pattern(":PROPERTIES:\n+:END:\n*"),"");
} else {
return content;
}
});
frontend.handler.file_based.property.util.simplified_property_QMARK_ = logseq.graph_parser.property.simplified_property_QMARK_;
frontend.handler.file_based.property.util.get_property_key = (function frontend$handler$file_based$property$util$get_property_key(line,format){
var and__5000__auto__ = typeof line === 'string';
if(and__5000__auto__){
var temp__5804__auto__ = cljs.core.last(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985)))?(function (){var G__101570 = /^\s*:([^: ]+): /;
var G__101571 = line;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__101570,G__101571) : frontend.util.safe_re_find.call(null,G__101570,G__101571));
})():(function (){var G__101572 = /^\s*([^ ]+):: /;
var G__101573 = line;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__101572,G__101573) : frontend.util.safe_re_find.call(null,G__101572,G__101573));
})()));
if(cljs.core.truth_(temp__5804__auto__)){
var key = temp__5804__auto__;
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
} else {
return null;
}
} else {
return and__5000__auto__;
}
});
frontend.handler.file_based.property.util.org_property_QMARK_ = (function frontend$handler$file_based$property$util$org_property_QMARK_(line){
return cljs.core.boolean$((function (){var and__5000__auto__ = typeof line === 'string';
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var G__101574 = /^\s*:[^: ]+: /;
var G__101575 = line;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__101574,G__101575) : frontend.util.safe_re_find.call(null,G__101574,G__101575));
})();
if(cljs.core.truth_(and__5000__auto____$1)){
var temp__5804__auto__ = frontend.handler.file_based.property.util.get_property_key(line,new cljs.core.Keyword(null,"org","org",1495985));
if(cljs.core.truth_(temp__5804__auto__)){
var key = temp__5804__auto__;
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"PROPERTIES","PROPERTIES",1607656426),null,new cljs.core.Keyword(null,"END","END",-1810083115),null], null), null),key)));
} else {
return null;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})());
});
frontend.handler.file_based.property.util.get_org_property_keys = (function frontend$handler$file_based$property$util$get_org_property_keys(content){
var content_lines = clojure.string.split_lines(content);
var vec__101579 = cljs.core.split_with((function (p1__101576_SHARP_){
return (!(clojure.string.starts_with_QMARK_(clojure.string.upper_case(clojure.string.triml(p1__101576_SHARP_)),logseq.graph_parser.property.properties_start)));
}),content_lines);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101579,(0),null);
var properties_AMPERSAND_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101579,(1),null);
var properties = cljs.core.rest(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__101577_SHARP_){
return (((!(clojure.string.starts_with_QMARK_(clojure.string.upper_case(clojure.string.trim(p1__101577_SHARP_)),logseq.graph_parser.property.properties_end)))) || (clojure.string.blank_QMARK_(p1__101577_SHARP_)));
}),properties_AMPERSAND_body));
if(cljs.core.seq(properties)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101578_SHARP_){
return clojure.string.upper_case(cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__101578_SHARP_,":"))));
}),properties);
} else {
return null;
}
});
frontend.handler.file_based.property.util.get_markdown_property_keys = (function frontend$handler$file_based$property$util$get_markdown_property_keys(content){
var content_lines = clojure.string.split_lines(content);
var properties = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__101582_SHARP_){
return cljs.core.re_matches(cljs.core.re_pattern(["^.+",logseq.graph_parser.property.colons,"\\s*.+"].join('')),p1__101582_SHARP_);
}),content_lines);
if(cljs.core.seq(properties)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101583_SHARP_){
return clojure.string.upper_case(cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__101583_SHARP_,logseq.graph_parser.property.colons))));
}),properties);
} else {
return null;
}
});
frontend.handler.file_based.property.util.get_property_keys = (function frontend$handler$file_based$property$util$get_property_keys(format,content){
if(cljs.core.truth_(logseq.graph_parser.property.contains_properties_QMARK_(content))){
return frontend.handler.file_based.property.util.get_org_property_keys(content);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),format)){
return frontend.handler.file_based.property.util.get_markdown_property_keys(content);
} else {
return null;
}
}
});
frontend.handler.file_based.property.util.property_key_exist_QMARK_ = (function frontend$handler$file_based$property$util$property_key_exist_QMARK_(format,content,key){
var key__$1 = clojure.string.upper_case(key);
return cljs.core.contains_QMARK_(cljs.core.set((function (){var G__101584 = cljs.core.PersistentHashSet.createAsIfByAssoc([key__$1]);
var G__101585 = frontend.handler.file_based.property.util.get_property_keys(format,content);
return (frontend.util.remove_first.cljs$core$IFn$_invoke$arity$2 ? frontend.util.remove_first.cljs$core$IFn$_invoke$arity$2(G__101584,G__101585) : frontend.util.remove_first.call(null,G__101584,G__101585));
})()),key__$1);
});
frontend.handler.file_based.property.util.goto_properties_end = (function frontend$handler$file_based$property$util$goto_properties_end(_format,input){
frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$3(input,logseq.graph_parser.property.properties_start,(0));

var from = frontend.util.cursor.pos(input);
return frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$3(input,logseq.graph_parser.property.properties_end,from);
});
frontend.handler.file_based.property.util.remove_properties = logseq.graph_parser.property.remove_properties;
frontend.handler.file_based.property.util.with_built_in_properties = (function frontend$handler$file_based$property$util$with_built_in_properties(properties,content,format){
var org_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
var properties__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__101587){
var vec__101588 = p__101587;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101588,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101588,(1),null);
var fexpr__101591 = (frontend.handler.file_based.property.util.built_in_properties.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.file_based.property.util.built_in_properties.cljs$core$IFn$_invoke$arity$0() : frontend.handler.file_based.property.util.built_in_properties.call(null));
return (fexpr__101591.cljs$core$IFn$_invoke$arity$1 ? fexpr__101591.cljs$core$IFn$_invoke$arity$1(k) : fexpr__101591.call(null,k));
}),properties);
if(cljs.core.seq(properties__$1)){
var lines = clojure.string.split_lines(content);
var ast = frontend.format.mldoc.__GT_edn(content,format);
var vec__101592 = (cljs.core.truth_((function (){var G__101596 = cljs.core.first(cljs.core.ffirst(ast));
return (frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1(G__101596) : frontend.format.mldoc.block_with_title_QMARK_.call(null,G__101596));
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(lines),cljs.core.rest(lines)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,lines], null));
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101592,(0),null);
var body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101592,(1),null);
var properties_in_content_QMARK_ = (function (){var and__5000__auto__ = title;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.upper_case(title),logseq.graph_parser.property.properties_start);
} else {
return and__5000__auto__;
}
})();
var no_title_QMARK_ = (function (){var or__5002__auto__ = (frontend.handler.file_based.property.util.simplified_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.property.util.simplified_property_QMARK_.cljs$core$IFn$_invoke$arity$1(title) : frontend.handler.file_based.property.util.simplified_property_QMARK_.call(null,title));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return properties_in_content_QMARK_;
}
})();
var properties_AMPERSAND_body = cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_((function (){var and__5000__auto__ = no_title_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(org_QMARK_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [title], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = org_QMARK_;
if(and__5000__auto__){
return properties_in_content_QMARK_;
} else {
return and__5000__auto__;
}
})())?cljs.core.rest(body):body));
var map__101595 = cljs.core.group_by((function (s){
var or__5002__auto__ = (frontend.handler.file_based.property.util.simplified_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.property.util.simplified_property_QMARK_.cljs$core$IFn$_invoke$arity$1(s) : frontend.handler.file_based.property.util.simplified_property_QMARK_.call(null,s));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((org_QMARK_) && (frontend.handler.file_based.property.util.org_property_QMARK_(s)));
}
}),properties_AMPERSAND_body);
var map__101595__$1 = cljs.core.__destructure_map(map__101595);
var properties_lines = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101595__$1,true);
var body__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101595__$1,false);
var body__$2 = ((org_QMARK_)?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (s){
return cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.createAsIfByAssoc([logseq.graph_parser.property.properties_start,logseq.graph_parser.property.properties_end]),clojure.string.trim(s));
}),body__$1):body__$1);
var properties_in_content = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101586_SHARP_){
return frontend.handler.file_based.property.util.get_property_key(p1__101586_SHARP_,format);
}),properties_lines)));
var properties__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(properties_in_content,cljs.core.first),properties__$1);
var built_in_properties_area = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__101597){
var vec__101598 = p__101597;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101598,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101598,(1),null);
if(org_QMARK_){
return [":",cljs.core.name(k),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)].join('');
} else {
return [cljs.core.name(k),logseq.graph_parser.property.colons," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)].join('');
}
}),properties__$2);
var body__$3 = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(no_title_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [title], null)),((org_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.property.properties_start], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([built_in_properties_area,properties_lines,((org_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.property.properties_end], null):null),body__$2], 0));
return clojure.string.triml(clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",body__$3));
} else {
return content;
}
});
/**
 * Only accept nake content (without any indentation)
 */
frontend.handler.file_based.property.util.insert_property = (function frontend$handler$file_based$property$util$insert_property(var_args){
var G__101602 = arguments.length;
switch (G__101602) {
case 4:
return frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$4 = (function (format,content,key,value){
return frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$5(format,content,key,value,false);
}));

(frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$5 = (function (format,content,key,value,front_matter_QMARK_){
var repo = frontend.state.get_current_repo();
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$6(repo,format,content,key,value,front_matter_QMARK_);
}));

(frontend.handler.file_based.property.util.insert_property.cljs$lang$maxFixedArity = 5);

frontend.handler.file_based.property.util.insert_properties = (function frontend$handler$file_based$property$util$insert_properties(format,content,kvs){
var repo = frontend.state.get_current_repo();
return logseq.graph_parser.property.insert_properties(repo,format,content,kvs);
});
frontend.handler.file_based.property.util.remove_property = logseq.graph_parser.property.remove_property;
frontend.handler.file_based.property.util.remove_id_property = (function frontend$handler$file_based$property$util$remove_id_property(format,content){
return (frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$4(format,"id",content,false) : frontend.handler.file_based.property.util.remove_property.call(null,format,"id",content,false));
});
frontend.handler.file_based.property.util.remove_built_in_properties = (function frontend$handler$file_based$property$util$remove_built_in_properties(format,content){
if(cljs.core.truth_(content)){
var trim_content = clojure.string.trim(content);
if(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))) && (((clojure.string.starts_with_QMARK_(trim_content,"```")) && (clojure.string.ends_with_QMARK_(trim_content,"```")))))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985))) && (((clojure.string.starts_with_QMARK_(trim_content,"#+BEGIN_SRC")) && (clojure.string.ends_with_QMARK_(trim_content,"#+END_SRC")))))))){
return content;
} else {
var built_in_properties_STAR_ = (frontend.handler.file_based.property.util.built_in_properties.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.file_based.property.util.built_in_properties.cljs$core$IFn$_invoke$arity$0() : frontend.handler.file_based.property.util.built_in_properties.call(null));
var content__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,key){
return (frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$3(format,key,content__$1) : frontend.handler.file_based.property.util.remove_property.call(null,format,key,content__$1));
}),content,built_in_properties_STAR_);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985))){
return clojure.string.replace_first(content__$1,cljs.core.re_pattern(":PROPERTIES:\n:END:\n*"),"");
} else {
return content__$1;
}
}
} else {
return null;
}
});
/**
 * Properties that are hidden in the pre-block (page property)
 */
frontend.handler.file_based.property.util.hidden_editable_page_properties = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"filters","filters",974726919),null,new cljs.core.Keyword(null,"icon","icon",1679606541),null,new cljs.core.Keyword(null,"title","title",636505583),null], null), null);
if(clojure.set.subset_QMARK_(frontend.handler.file_based.property.util.hidden_editable_page_properties,logseq.graph_parser.property.editable_built_in_properties())){
} else {
throw (new Error(["Assert failed: ","Hidden editable page properties must be valid editable properties","\n","(set/subset? hidden-editable-page-properties (gp-property/editable-built-in-properties))"].join('')));
}
/**
 * Properties that are hidden in a block (block property)
 */
frontend.handler.file_based.property.util.hidden_editable_block_properties = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.query","nlp-date","logseq.query/nlp-date",-145078221),null], null), null);
if(clojure.set.subset_QMARK_(frontend.handler.file_based.property.util.hidden_editable_block_properties,logseq.graph_parser.property.editable_built_in_properties())){
} else {
throw (new Error(["Assert failed: ","Hidden editable page properties must be valid editable properties","\n","(set/subset? hidden-editable-block-properties (gp-property/editable-built-in-properties))"].join('')));
}
/**
 * Adds aliases to a page when a page has aliases and is also an alias of other pages
 */
frontend.handler.file_based.property.util.add_aliases_to_properties = (function frontend$handler$file_based$property$util$add_aliases_to_properties(properties,page_id){
var repo = frontend.state.get_current_repo();
var aliases = (frontend.db.get_page_alias_names.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_page_alias_names.cljs$core$IFn$_invoke$arity$2(repo,page_id) : frontend.db.get_page_alias_names.call(null,repo,page_id));
if(cljs.core.seq(aliases)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"alias","alias",-2039751630).cljs$core$IFn$_invoke$arity$1(properties))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"alias","alias",-2039751630),(function (c){
var G__101603 = clojure.string.lower_case;
var G__101604 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(c,aliases);
return (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(G__101603,G__101604) : frontend.util.distinct_by.call(null,G__101603,G__101604));
}));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"alias","alias",-2039751630),aliases);
}
} else {
return properties;
}
});
/**
 * Given a block's properties, order of properties and any display context,
 *   returns a tuple of property pairs that are visible when not being edited
 */
frontend.handler.file_based.property.util.get_visible_ordered_properties = (function frontend$handler$file_based$property$util$get_visible_ordered_properties(properties_STAR_,properties_order,p__101605){
var map__101606 = p__101605;
var map__101606__$1 = cljs.core.__destructure_map(map__101606);
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101606__$1,new cljs.core.Keyword(null,"pre-block?","pre-block?",-1762448460));
var page_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101606__$1,new cljs.core.Keyword(null,"page-id","page-id",-872941168));
var dissoc_keys = (function (m,keys){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,m,keys);
});
var properties = (function (){var G__101607 = cljs.core.update_keys(properties_STAR_,cljs.core.keyword);
var G__101607__$1 = dissoc_keys(G__101607,frontend.handler.file_based.property.util.hidden_properties())
;
var G__101607__$2 = (cljs.core.truth_(pre_block_QMARK_)?dissoc_keys(G__101607__$1,frontend.handler.file_based.property.util.hidden_editable_page_properties):G__101607__$1);
var G__101607__$3 = ((cljs.core.not(pre_block_QMARK_))?dissoc_keys(G__101607__$2,frontend.handler.file_based.property.util.hidden_editable_block_properties):G__101607__$2);
if(cljs.core.truth_(pre_block_QMARK_)){
return frontend.handler.file_based.property.util.add_aliases_to_properties(G__101607__$3,page_id);
} else {
return G__101607__$3;
}
})();
if(cljs.core.seq(properties_order)){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (k){
if(cljs.core.contains_QMARK_(properties,k)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,k)], null);
} else {
return null;
}
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(properties_order));
} else {
return properties_STAR_;
}
});

//# sourceMappingURL=frontend.handler.file_based.property.util.js.map
