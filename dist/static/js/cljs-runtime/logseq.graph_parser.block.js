goog.provide('logseq.graph_parser.block');
logseq.graph_parser.block.heading_block_QMARK_ = (function logseq$graph_parser$block$heading_block_QMARK_(block){
return ((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Heading",cljs.core.first(block))));
});
logseq.graph_parser.block.get_tag = (function logseq$graph_parser$block$get_tag(block){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.vector_QMARK_(block);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Tag",cljs.core.first(block));
if(and__5000__auto____$1){
return cljs.core.second(block);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var tag_value = temp__5804__auto__;
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__143932){
var vec__143935 = p__143932;
var elem = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143935,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143935,(1),null);
var G__143938 = elem;
switch (G__143938) {
case "Plain":
return value;

break;
case "Link":
return new cljs.core.Keyword(null,"full_text","full_text",1634289075).cljs$core$IFn$_invoke$arity$1(value);

break;
case "Nested_link":
return new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(value);

break;
default:
return "";

}
}),tag_value));
} else {
return null;
}
});
logseq.graph_parser.block.get_page_reference = (function logseq$graph_parser$block$get_page_reference(block,format){
var page = ((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Link",cljs.core.first(block)))))?(function (){var url_type = cljs.core.first(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)));
var value = cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)));
var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url_type,"Page_ref");
if(and__5000__auto__){
var and__5000__auto____$1 = ((typeof value === 'string') && (cljs.core.not((function (){var or__5002__auto__ = logseq.common.config.local_asset_QMARK_(value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.common.config.draw_QMARK_(value);
}
})())));
if(and__5000__auto____$1){
return value;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url_type,"Search");
if(and__5000__auto__){
var and__5000__auto____$1 = logseq.common.util.page_ref.page_ref_QMARK_(value);
if(and__5000__auto____$1){
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(value) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,value));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url_type,"Search");
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not(logseq.common.config.local_asset_QMARK_(value));
if(and__5000__auto____$2){
return value;
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url_type,"File");
if(and__5000__auto__){
return cljs.core.second(cljs.core.first(new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block))));
} else {
return and__5000__auto__;
}
}
}
}
})():((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Nested_link",cljs.core.first(block)))))?(function (){var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(cljs.core.last(block));
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
})():((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Macro",cljs.core.first(block)))))?(function (){var map__143966 = cljs.core.second(block);
var map__143966__$1 = cljs.core.__destructure_map(map__143966);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143966__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143966__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
var argument = clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",arguments$);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"embed")){
if(logseq.common.util.page_ref.page_ref_QMARK_(argument)){
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(argument) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,argument));
} else {
return null;
}
} else {
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"macro",new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"arguments","arguments",-1182834456),arguments$], null);
}
})():((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Tag",cljs.core.first(block)))))?(function (){var text = logseq.graph_parser.block.get_tag(block);
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(text) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,text));
})():null
))));
if(cljs.core.truth_(page)){
var or__5002__auto__ = ((typeof page === 'string')?logseq.common.util.block_ref.get_block_ref_id(page):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page;
}
} else {
return null;
}
});
logseq.graph_parser.block.get_block_reference = (function logseq$graph_parser$block$get_block_reference(block){
var temp__5804__auto__ = ((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Block_reference",cljs.core.first(block)))))?cljs.core.last(block):((((cljs.core.vector_QMARK_(block)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Link",cljs.core.first(block))) && (((cljs.core.map_QMARK_(cljs.core.second(block))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Block_ref",cljs.core.first(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)))))))))))?cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block))):((((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Macro",cljs.core.first(block)))))?(function (){var map__143994 = cljs.core.second(block);
var map__143994__$1 = cljs.core.__destructure_map(map__143994);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143994__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143994__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"embed")) && (((typeof cljs.core.first(arguments$) === 'string') && (logseq.common.util.block_ref.string_block_ref_QMARK_(cljs.core.first(arguments$))))))){
return logseq.common.util.block_ref.get_string_block_ref_id(cljs.core.first(arguments$));
} else {
return null;
}
})():((((cljs.core.vector_QMARK_(block)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Link",cljs.core.first(block))) && (cljs.core.map_QMARK_(cljs.core.second(block)))))))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("id",new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block))))))?new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)))):(function (){var id = cljs.core.second(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)));
if(typeof id === 'string'){
var or__5002__auto__ = logseq.common.util.block_ref.get_block_ref_id(id);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return id;
}
} else {
return null;
}
})()):null
))));
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
if(cljs.core.truth_((function (){var G__144004 = block_id;
if((G__144004 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__144004);
}
})())){
return block_id;
} else {
return null;
}
} else {
return null;
}
});
logseq.graph_parser.block.paragraph_block_QMARK_ = (function logseq$graph_parser$block$paragraph_block_QMARK_(block){
return ((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Paragraph",cljs.core.first(block))));
});
logseq.graph_parser.block.timestamp_block_QMARK_ = (function logseq$graph_parser$block$timestamp_block_QMARK_(block){
return ((cljs.core.vector_QMARK_(block)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Timestamp",cljs.core.first(block))));
});
logseq.graph_parser.block.get_page_refs_from_property_names = (function logseq$graph_parser$block$get_page_refs_from_property_names(properties,p__144048){
var map__144050 = p__144048;
var map__144050__$1 = cljs.core.__destructure_map(map__144050);
var enabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144050__$1,new cljs.core.Keyword("property-pages","enabled?","property-pages/enabled?",-48336645));
var excludelist = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144050__$1,new cljs.core.Keyword("property-pages","excludelist","property-pages/excludelist",1710831097));
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,true,null], null), null),enabled_QMARK_)){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.name,cljs.core.first)),cljs.core.remove.cljs$core$IFn$_invoke$arity$1(clojure.string.blank_QMARK_),cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,excludelist))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.name),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.conj,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.disj,logseq.graph_parser.property.editable_built_in_properties(),logseq.graph_parser.property.editable_linkable_built_in_properties),logseq.graph_parser.property.hidden_built_in_properties()))),cljs.core.distinct.cljs$core$IFn$_invoke$arity$0()], 0)),properties);
} else {
return cljs.core.PersistentVector.EMPTY;
}
});
logseq.graph_parser.block.extract_refs_from_property_value = (function logseq$graph_parser$block$extract_refs_from_property_value(value,format){
if(cljs.core.coll_QMARK_(value)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (v){
return ((typeof v === 'string') && ((!(clojure.string.blank_QMARK_(v)))));
}),value);
} else {
if(((typeof value === 'string') && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic("\"",cljs.core.first(value),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.last(value)], 0))))){
return null;
} else {
if(typeof value === 'string'){
var ast = logseq.graph_parser.mldoc.inline__GT_edn(value,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(format));
return logseq.graph_parser.text.extract_refs_from_mldoc_ast(ast);
} else {
return null;

}
}
}
});
logseq.graph_parser.block.get_page_ref_names_from_properties = (function logseq$graph_parser$block$get_page_ref_names_from_properties(properties,user_config){
var page_refs = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.coll_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,properties))),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (value){
return logseq.graph_parser.block.extract_refs_from_property_value(value,cljs.core.get.cljs$core$IFn$_invoke$arity$3(user_config,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__144081){
var vec__144082 = p__144081;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144082,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144082,(1),null);
return cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.disj,logseq.graph_parser.property.editable_built_in_properties(),logseq.graph_parser.property.editable_linkable_built_in_properties),logseq.graph_parser.property.hidden_built_in_properties()),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k));
}),properties))], 0)));
var page_refs_from_property_names = logseq.graph_parser.block.get_page_refs_from_property_names(properties,user_config);
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_refs,page_refs_from_property_names)));
});
logseq.graph_parser.block.extract_block_refs = (function logseq$graph_parser$block$extract_block_refs(nodes){
var ref_blocks = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
clojure.walk.postwalk((function (form){
var temp__5804__auto___144567 = logseq.graph_parser.block.get_block_reference(form);
if(cljs.core.truth_(temp__5804__auto___144567)){
var block_144568 = temp__5804__auto___144567;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(ref_blocks,cljs.core.conj,block_144568);
} else {
}

return form;
}),nodes);

return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block){
var temp__5804__auto__ = cljs.core.parse_uuid(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return null;
}
}),cljs.core.deref(ref_blocks));
});
logseq.graph_parser.block.extract_properties = (function logseq$graph_parser$block$extract_properties(properties,user_config){
if(cljs.core.seq(properties)){
var properties__$1 = cljs.core.seq(properties);
var _STAR_invalid_properties = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var properties__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__144108_SHARP_){
return (cljs.core.second(p1__144108_SHARP_) == null);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__144119){
var vec__144120 = p__144119;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144120,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144120,(1),null);
var mldoc_ast = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144120,(2),null);
var k__$1 = (((((k instanceof cljs.core.Keyword)) || ((k instanceof cljs.core.Symbol))))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),(1)):k);
var k__$2 = clojure.string.replace(clojure.string.replace(clojure.string.lower_case(k__$1)," ","-"),"_","-");
if(cljs.core.truth_(logseq.graph_parser.property.valid_property_name_QMARK_([":",k__$2].join('')))){
var k_SINGLEQUOTE_ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["custom-id",null,"custom_id",null], null), null),k__$2))?"id":k__$2));
var v_SINGLEQUOTE_ = logseq.graph_parser.text.parse_property(k__$2,v,mldoc_ast,user_config);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,v_SINGLEQUOTE_,mldoc_ast,v], null);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_invalid_properties,cljs.core.conj,k__$2);

return null;
}
}),properties__$1));
var page_refs = logseq.graph_parser.block.get_page_ref_names_from_properties(properties__$2,user_config);
var block_refs = logseq.graph_parser.block.extract_block_refs(properties__$2);
var properties_text_values = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__144141){
var vec__144142 = p__144141;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144142,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144142,(1),null);
var _refs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144142,(2),null);
var original_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144142,(3),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,original_text], null);
}),properties__$2));
var properties__$3 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__144145){
var vec__144146 = p__144145;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144146,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144146,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144146,(2),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}),properties__$2);
var properties_SINGLEQUOTE_ = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,properties__$3);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"properties","properties",685819552),properties_SINGLEQUOTE_,new cljs.core.Keyword(null,"properties-order","properties-order",-768725444),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,properties__$3),new cljs.core.Keyword(null,"properties-text-values","properties-text-values",1110303535),properties_text_values,new cljs.core.Keyword(null,"invalid-properties","invalid-properties",1416774099),cljs.core.deref(_STAR_invalid_properties),new cljs.core.Keyword(null,"page-refs","page-refs",1204379971),page_refs,new cljs.core.Keyword(null,"block-refs","block-refs",1507119654),block_refs], null);
} else {
return null;
}
});
logseq.graph_parser.block.paragraph_timestamp_block_QMARK_ = (function logseq$graph_parser$block$paragraph_timestamp_block_QMARK_(block){
return ((logseq.graph_parser.block.paragraph_block_QMARK_(block)) && (((logseq.graph_parser.block.timestamp_block_QMARK_(cljs.core.first(cljs.core.second(block)))) || (logseq.graph_parser.block.timestamp_block_QMARK_(cljs.core.second(cljs.core.second(block)))))));
});
logseq.graph_parser.block.extract_timestamps = (function logseq$graph_parser$block$extract_timestamps(block){
var G__144153 = cljs.core.second(block);
var G__144153__$1 = (((G__144153 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.block.timestamp_block_QMARK_,G__144153));
var G__144153__$2 = (((G__144153__$1 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,G__144153__$1));
if((G__144153__$2 == null)){
return null;
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__144153__$2);
}
});
logseq.graph_parser.block.timestamps__GT_scheduled_and_deadline = (function logseq$graph_parser$block$timestamps__GT_scheduled_and_deadline(timestamps){
var timestamps__$1 = cljs.core.update_keys(timestamps,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,clojure.string.lower_case));
var m = (function (){var G__144162 = cljs.core.select_keys(timestamps__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"scheduled","scheduled",553898551),new cljs.core.Keyword(null,"deadline","deadline",628964572)], null));
if((G__144162 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__144166){
var vec__144170 = p__144166;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144170,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144170,(1),null);
var map__144173 = v;
var map__144173__$1 = cljs.core.__destructure_map(map__144173);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144173__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144173__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var map__144174 = date;
var map__144174__$1 = cljs.core.__destructure_map(map__144174);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144174__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144174__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144174__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var day__$1 = parseInt([cljs.core.str.cljs$core$IFn$_invoke$arity$1(year),logseq.common.util.zero_pad(month),logseq.common.util.zero_pad(day)].join(''));
var G__144175 = (function (){var G__144176 = k;
var G__144176__$1 = (((G__144176 instanceof cljs.core.Keyword))?G__144176.fqn:null);
switch (G__144176__$1) {
case "scheduled":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"scheduled","scheduled",553898551),day__$1], null);

break;
case "deadline":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"deadline","deadline",628964572),day__$1], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__144176__$1)].join('')));

}
})();
if(cljs.core.truth_(repetition)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144175,new cljs.core.Keyword(null,"repeated?","repeated?",-1169980868),true);
} else {
return G__144175;
}
}),G__144162);
}
})();
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,m);
});
/**
 * Convert journal file name to user' custom date format
 */
logseq.graph_parser.block.convert_page_if_journal_impl = (function logseq$graph_parser$block$convert_page_if_journal_impl(var_args){
var args__5732__auto__ = [];
var len__5726__auto___144590 = arguments.length;
var i__5727__auto___144591 = (0);
while(true){
if((i__5727__auto___144591 < len__5726__auto___144590)){
args__5732__auto__.push((arguments[i__5727__auto___144591]));

var G__144592 = (i__5727__auto___144591 + (1));
i__5727__auto___144591 = G__144592;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.graph_parser.block.convert_page_if_journal_impl.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.graph_parser.block.convert_page_if_journal_impl.cljs$core$IFn$_invoke$arity$variadic = (function (original_page_name,date_formatter,p__144188){
var map__144189 = p__144188;
var map__144189__$1 = cljs.core.__destructure_map(map__144189);
var export_to_db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144189__$1,new cljs.core.Keyword(null,"export-to-db-graph?","export-to-db-graph?",2008973423));
if(cljs.core.truth_(original_page_name)){
var page_name = logseq.common.util.page_name_sanity_lc(original_page_name);
var day = (cljs.core.truth_(date_formatter)?logseq.common.util.date_time.journal_title__GT_int(page_name,(cljs.core.truth_(export_to_db_graph_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [date_formatter], null):logseq.common.util.date_time.safe_journal_title_formatters(date_formatter))):null);
if(cljs.core.truth_(day)){
var original_page_name_SINGLEQUOTE_ = logseq.common.util.date_time.int__GT_journal_title(day,date_formatter);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [original_page_name_SINGLEQUOTE_,logseq.common.util.page_name_sanity_lc(original_page_name_SINGLEQUOTE_),day], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [original_page_name,page_name,day], null);
}
} else {
return null;
}
}));

(logseq.graph_parser.block.convert_page_if_journal_impl.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.graph_parser.block.convert_page_if_journal_impl.cljs$lang$applyTo = (function (seq144184){
var G__144186 = cljs.core.first(seq144184);
var seq144184__$1 = cljs.core.next(seq144184);
var G__144187 = cljs.core.first(seq144184__$1);
var seq144184__$2 = cljs.core.next(seq144184__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__144186,G__144187,seq144184__$2);
}));

logseq.graph_parser.block.convert_page_if_journal = cljs.core.memoize(logseq.graph_parser.block.convert_page_if_journal_impl);
logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
logseq.graph_parser.block.page_name_string__GT_map = (function logseq$graph_parser$block$page_name_string__GT_map(original_page_name,db,date_formatter,p__144203){
var map__144204 = p__144203;
var map__144204__$1 = cljs.core.__destructure_map(map__144204);
var with_timestamp_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144204__$1,new cljs.core.Keyword(null,"with-timestamp?","with-timestamp?",-1639768666));
var page_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144204__$1,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915));
var from_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144204__$1,new cljs.core.Keyword(null,"from-page","from-page",75165656));
var class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144204__$1,new cljs.core.Keyword(null,"class?","class?",385834571));
var skip_existing_page_check_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144204__$1,new cljs.core.Keyword(null,"skip-existing-page-check?","skip-existing-page-check?",1358622588));
var db_based_QMARK_ = (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db));
var original_page_name__$1 = logseq.common.util.remove_boundary_slashes(original_page_name);
var vec__144210 = logseq.graph_parser.block.convert_page_if_journal(original_page_name__$1,date_formatter,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-to-db-graph?","export-to-db-graph?",2008973423),cljs.core.deref(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_)], null));
var original_page_name_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144210,(0),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144210,(1),null);
var journal_day = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144210,(2),null);
var namespace_QMARK_ = (function (){var and__5000__auto__ = (function (){var or__5002__auto__ = cljs.core.not(db_based_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.deref(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(cljs.core.boolean$(logseq.graph_parser.text.get_nested_page_name(original_page_name_SINGLEQUOTE_))));
if(and__5000__auto____$1){
return (logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(original_page_name_SINGLEQUOTE_) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,original_page_name_SINGLEQUOTE_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var page_entity = (cljs.core.truth_((function (){var and__5000__auto__ = db;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(skip_existing_page_check_QMARK_);
} else {
return and__5000__auto__;
}
})())?(cljs.core.truth_(class_QMARK_)?logseq.db.get_case_page(db,original_page_name_SINGLEQUOTE_):logseq.db.get_page(db,original_page_name_SINGLEQUOTE_)):null);
var original_page_name_SINGLEQUOTE___$1 = (function (){var or__5002__auto__ = from_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return original_page_name_SINGLEQUOTE_;
}
}
})();
var page = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","name","block/name",1619760316),page_name,new cljs.core.Keyword("block","title","block/title",710445684),original_page_name_SINGLEQUOTE___$1], null),(cljs.core.truth_((function (){var and__5000__auto__ = original_page_name__$1;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(original_page_name__$1),clojure.string.lower_case(original_page_name_SINGLEQUOTE___$1))) && (cljs.core.not(cljs.core.deref(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_))));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508),original_page_name__$1], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = page_entity;
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page_entity);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page_entity)], null):(function (){var new_uuid_STAR_ = ((cljs.core.uuid_QMARK_(page_uuid))?page_uuid:(cljs.core.truth_(journal_day)?logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"journal-page-uuid","journal-page-uuid",1859101489),journal_day):logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0()));
var new_uuid = (cljs.core.truth_(skip_existing_page_check_QMARK_)?new_uuid_STAR_:(function (){var or__5002__auto__ = (cljs.core.truth_(page_entity)?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity):((cljs.core.uuid_QMARK_(page_uuid))?page_uuid:null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new_uuid_STAR_;
}
})());
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_uuid], null);
})()),(cljs.core.truth_(namespace_QMARK_)?(function (){var namespace_SINGLEQUOTE_ = cljs.core.first(logseq.common.util.split_last("/",original_page_name__$1));
if(clojure.string.blank_QMARK_(namespace_SINGLEQUOTE_)){
return null;
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),clojure.string.trim(logseq.common.util.page_name_sanity_lc(namespace_SINGLEQUOTE_))], null)], null);
}
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = with_timestamp_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = skip_existing_page_check_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(page_entity);
}
} else {
return and__5000__auto__;
}
})())?(function (){var current_ms = logseq.common.util.time_ms();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),current_ms,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),current_ms], null);
})():null),(cljs.core.truth_(journal_day)?(function (){var G__144220 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),journal_day], null);
var G__144220__$1 = (cljs.core.truth_(db_based_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144220,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)], null)):G__144220);
if(cljs.core.not(db_based_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144220__$1,new cljs.core.Keyword("block","type","block/type",1537584409),"journal");
} else {
return G__144220__$1;
}
})():cljs.core.PersistentArrayMap.EMPTY)], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,page_entity], null);
});
/**
 * This must be kept in sync with its reverse operation in logseq.db.frontend.content
 */
logseq.graph_parser.block.sanitize_hashtag_name = (function logseq$graph_parser$block$sanitize_hashtag_name(s){
return clojure.string.replace(s,"#","HashTag-");
});
/**
 * Create a page's map structure given a original page name (string).
 * map as input is supported for legacy compatibility.
 * `with-timestamp?`: assign timestampes to the map structure.
 *  Useful when creating new pages from references or namespaces,
 *  as there's no chance to introduce timestamps via editing in page
 * `skip-existing-page-check?`: if true, allows pages to have the same name
 */
logseq.graph_parser.block.page_name__GT_map = (function logseq$graph_parser$block$page_name__GT_map(var_args){
var args__5732__auto__ = [];
var len__5726__auto___144611 = arguments.length;
var i__5727__auto___144612 = (0);
while(true){
if((i__5727__auto___144612 < len__5726__auto___144611)){
args__5732__auto__.push((arguments[i__5727__auto___144612]));

var G__144613 = (i__5727__auto___144612 + (1));
i__5727__auto___144612 = G__144613;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic = (function (original_page_name,db,with_timestamp_QMARK_,date_formatter,p__144238){
var map__144239 = p__144238;
var map__144239__$1 = cljs.core.__destructure_map(map__144239);
var options = map__144239__$1;
var page_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144239__$1,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915));
var class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144239__$1,new cljs.core.Keyword(null,"class?","class?",385834571));
if(cljs.core.truth_((function (){var and__5000__auto__ = db;
if(cljs.core.truth_(and__5000__auto__)){
return ((logseq.common.util.uuid_string_QMARK_(original_page_name)) && (cljs.core.not((function (){var G__144244 = (function (){var G__144245 = db;
var G__144246 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(original_page_name)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144245,G__144246) : datascript.core.entity.call(null,G__144245,G__144246));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__144244) : logseq.db.page_QMARK_.call(null,G__144244));
})())));
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
var db_based_QMARK_ = (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db));
var original_page_name__$1 = (function (){var G__144251 = clojure.string.trim(original_page_name);
if(cljs.core.truth_(db_based_QMARK_)){
return logseq.graph_parser.block.sanitize_hashtag_name(G__144251);
} else {
return G__144251;
}
})();
var vec__144248 = (cljs.core.truth_((function (){var and__5000__auto__ = original_page_name__$1;
if(cljs.core.truth_(and__5000__auto__)){
return typeof original_page_name__$1 === 'string';
} else {
return and__5000__auto__;
}
})())?logseq.graph_parser.block.page_name_string__GT_map(original_page_name__$1,db,date_formatter,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"with-timestamp?","with-timestamp?",-1639768666),with_timestamp_QMARK_)):(function (){var page = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(original_page_name__$1);
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(original_page_name__$1);
} else {
return and__5000__auto__;
}
})())?original_page_name__$1:((cljs.core.map_QMARK_(original_page_name__$1))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(original_page_name__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var or__5002__auto__ = page_uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null));
}
})()):null
));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,null], null);
})()
);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144248,(0),null);
var _page_entity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144248,(1),null);
if(cljs.core.truth_(page)){
if(cljs.core.truth_(db_based_QMARK_)){
var tags = (cljs.core.truth_(class_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null):(function (){var or__5002__auto__ = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null);
}
})());
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","tags","block/tags",1814948340),tags);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","type","block/type",1537584409),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","type","block/type",1537584409).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "page";
}
})());
}
} else {
return null;
}
}
}));

(logseq.graph_parser.block.page_name__GT_map.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(logseq.graph_parser.block.page_name__GT_map.cljs$lang$applyTo = (function (seq144225){
var G__144226 = cljs.core.first(seq144225);
var seq144225__$1 = cljs.core.next(seq144225);
var G__144227 = cljs.core.first(seq144225__$1);
var seq144225__$2 = cljs.core.next(seq144225__$1);
var G__144228 = cljs.core.first(seq144225__$2);
var seq144225__$3 = cljs.core.next(seq144225__$2);
var G__144229 = cljs.core.first(seq144225__$3);
var seq144225__$4 = cljs.core.next(seq144225__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__144226,G__144227,G__144228,G__144229,seq144225__$4);
}));

/**
 * Namespace page that're not journal pages
 */
logseq.graph_parser.block.db_namespace_page_QMARK_ = (function logseq$graph_parser$block$db_namespace_page_QMARK_(db_based_QMARK_,page){
var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(logseq.common.date.valid_journal_title_with_slash_QMARK_(page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
logseq.graph_parser.block.ref__GT_map = (function logseq$graph_parser$block$ref__GT_map(db,_STAR_col,p__144280){
var map__144281 = p__144280;
var map__144281__$1 = cljs.core.__destructure_map(map__144281);
var date_formatter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144281__$1,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709));
var db_based_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144281__$1,new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232));
var _STAR_name__GT_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144281__$1,new cljs.core.Keyword(null,"*name->id","*name->id",-486855390));
var tag_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144281__$1,new cljs.core.Keyword(null,"tag?","tag?",1714008252));
var col = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.deref(_STAR_col));
var children_pages = (cljs.core.truth_(db_based_QMARK_)?null:cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p){
var p__$1 = ((cljs.core.map_QMARK_(p))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p):p);
if(typeof p__$1 === 'string'){
var p__$2 = (function (){var or__5002__auto__ = logseq.graph_parser.text.get_nested_page_name(p__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return p__$1;
}
})();
if(cljs.core.truth_((logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(p__$2) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,p__$2)))){
return logseq.common.util.split_namespace_pages(p__$2);
} else {
return null;
}
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0)))));
var col__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(col,children_pages)));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
var macro_QMARK_ = ((cljs.core.map_QMARK_(item)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("macro",new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item))));
if(macro_QMARK_){
return null;
} else {
var m = logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic(item,db,true,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class?","class?",385834571),tag_QMARK_], null)], 0));
var result = (function (){var G__144290 = m;
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = tag_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return logseq.db.frontend.class$.build_new_class(db,G__144290);
} else {
return G__144290;
}
})();
var page_name = (cljs.core.truth_(db_based_QMARK_)?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(result):new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(result));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_name__GT_id),page_name);
if((id == null)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_name__GT_id,cljs.core.assoc,page_name,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result));
} else {
}

if(cljs.core.truth_(id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(result,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id);
} else {
return result;
}
}
}),col__$1);
});
logseq.graph_parser.block.with_page_refs_and_tags = (function logseq$graph_parser$block$with_page_refs_and_tags(p__144303,db,date_formatter,parse_block){
var map__144306 = p__144303;
var map__144306__$1 = cljs.core.__destructure_map(map__144306);
var block = map__144306__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"title","title",636505583));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
var refs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"refs","refs",-1560051448));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144306__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var db_based_QMARK_ = (function (){var and__5000__auto__ = (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_);
} else {
return and__5000__auto__;
}
})();
var refs__$1 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(tags,refs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [marker,priority], null))], 0))));
var _STAR_refs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(refs__$1);
var _STAR_structured_tags = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
clojure.walk.prewalk((function (form){
if(((cljs.core.vector_QMARK_(form)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(form),"Custom")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(form),"query")))))){
return null;
} else {
var temp__5804__auto___144641 = logseq.graph_parser.block.get_page_reference(form,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
if(cljs.core.truth_(temp__5804__auto___144641)){
var page_144643 = temp__5804__auto___144641;
var temp__5804__auto___144644__$1 = (cljs.core.truth_(logseq.graph_parser.block.db_namespace_page_QMARK_(db_based_QMARK_,page_144643))?null:page_144643);
if(cljs.core.truth_(temp__5804__auto___144644__$1)){
var page_SINGLEQUOTE__144645 = temp__5804__auto___144644__$1;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_refs,cljs.core.conj,page_SINGLEQUOTE__144645);
} else {
}
} else {
}

var temp__5804__auto___144648 = logseq.graph_parser.block.get_tag(form);
if(cljs.core.truth_(temp__5804__auto___144648)){
var tag_144649 = temp__5804__auto___144648;
var tag_144650__$1 = (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(tag_144649) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,tag_144649));
var temp__5804__auto___144651__$1 = (cljs.core.truth_(logseq.graph_parser.block.db_namespace_page_QMARK_(db_based_QMARK_,tag_144650__$1))?null:tag_144650__$1);
if(cljs.core.truth_(temp__5804__auto___144651__$1)){
var tag_SINGLEQUOTE__144652 = temp__5804__auto___144651__$1;
if(cljs.core.truth_(logseq.common.util.tag_valid_QMARK_(tag_SINGLEQUOTE__144652))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_refs,cljs.core.conj,tag_SINGLEQUOTE__144652);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_structured_tags,cljs.core.conj,tag_SINGLEQUOTE__144652);
} else {
}
} else {
}
} else {
}

return form;
}
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(title,body));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_refs,(function (p1__144297_SHARP_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,p1__144297_SHARP_);
}));

var _STAR_name__GT_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var ref__GT_map_options = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232),db_based_QMARK_,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),date_formatter,new cljs.core.Keyword(null,"*name->id","*name->id",-486855390),_STAR_name__GT_id], null);
var refs__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
var ref_SINGLEQUOTE_ = (function (){var temp__5802__auto__ = logseq.db.get_case_page(db,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref));
if(cljs.core.truth_(temp__5802__auto__)){
var entity = temp__5802__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parse_block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity))){
return ref;
} else {
return cljs.core.select_keys(entity,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","name","block/name",1619760316)], null));
}
} else {
return ref;
}
})();
var G__144329 = ref_SINGLEQUOTE_;
if(cljs.core.truth_(new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508).cljs$core$IFn$_invoke$arity$1(ref))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144329,new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508),new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508).cljs$core$IFn$_invoke$arity$1(ref));
} else {
return G__144329;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,logseq.graph_parser.block.ref__GT_map(db,_STAR_refs,ref__GT_map_options)));
var tags__$1 = logseq.graph_parser.block.ref__GT_map(db,_STAR_structured_tags,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ref__GT_map_options,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword(null,"refs","refs",-1560051448),refs__$2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tags","tags",1771418977),tags__$1], 0));
});
logseq.graph_parser.block.with_block_refs = (function logseq$graph_parser$block$with_block_refs(p__144335){
var map__144336 = p__144335;
var map__144336__$1 = cljs.core.__destructure_map(map__144336);
var block = map__144336__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144336__$1,new cljs.core.Keyword(null,"title","title",636505583));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144336__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var ref_blocks = logseq.graph_parser.block.extract_block_refs(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(title,body));
var refs = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"refs","refs",-1560051448).cljs$core$IFn$_invoke$arity$1(block),ref_blocks));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword(null,"refs","refs",-1560051448),refs);
});
logseq.graph_parser.block.block_keywordize = (function logseq$graph_parser$block$block_keywordize(block){
return cljs.core.update_keys(block,(function (k){
if(cljs.core.truth_(cljs.core.namespace(k))){
return k;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("block",k);
}
}));
});
/**
 * Clean up blocks data and add `block` ns to all keys
 */
logseq.graph_parser.block.sanity_blocks_data = (function logseq$graph_parser$block$sanity_blocks_data(blocks){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
if(cljs.core.map_QMARK_(block)){
return logseq.graph_parser.block.block_keywordize(logseq.common.util.remove_nils_non_nested(block));
} else {
return block;
}
}),blocks);
});
logseq.graph_parser.block.get_block_content = (function logseq$graph_parser$block$get_block_content(utf8_content,block,format,meta_SINGLEQUOTE_,block_pattern){
var content = (function (){var temp__5802__auto__ = new cljs.core.Keyword(null,"end_pos","end_pos",-1418940).cljs$core$IFn$_invoke$arity$1(meta_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5802__auto__)){
var end_pos = temp__5802__auto__;
return logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3(utf8_content,new cljs.core.Keyword(null,"start_pos","start_pos",272375959).cljs$core$IFn$_invoke$arity$1(meta_SINGLEQUOTE_),end_pos);
} else {
return logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$2(utf8_content,new cljs.core.Keyword(null,"start_pos","start_pos",272375959).cljs$core$IFn$_invoke$arity$1(meta_SINGLEQUOTE_));
}
})();
var content__$1 = (cljs.core.truth_(content)?(function (){var content__$1 = logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3(content,format,block_pattern);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"pre-block?","pre-block?",-1762448460).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword(null,"org","org",1495985));
}
})())){
return content__$1;
} else {
return logseq.graph_parser.mldoc.remove_indentation_spaces(content__$1,(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(block) + (1)),false);
}
})():null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985))){
return content__$1;
} else {
return logseq.graph_parser.property.__GT_new_properties(content__$1);
}
});
logseq.graph_parser.block.get_custom_id_or_new_id = (function logseq$graph_parser$block$get_custom_id_or_new_id(properties){
var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"custom-id","custom-id",-615733336)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"custom_id","custom_id",834948303)], null));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"id","id",-1388402092)], null));
}
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var custom_id = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = typeof custom_id === 'string';
if(and__5000__auto__){
return clojure.string.trim(custom_id);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var custom_id__$1 = temp__5804__auto____$1;
var G__144351 = custom_id__$1;
if((G__144351 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__144351);
}
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null));
}
});
logseq.graph_parser.block.get_page_refs_from_properties = (function logseq$graph_parser$block$get_page_refs_from_properties(properties,db,date_formatter,user_config){
var page_refs = logseq.graph_parser.block.get_page_ref_names_from_properties(properties,user_config);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page){
return logseq.graph_parser.block.page_name__GT_map(page,db,true,date_formatter);
}),page_refs);
});
logseq.graph_parser.block.with_page_block_refs = (function logseq$graph_parser$block$with_page_block_refs(var_args){
var args__5732__auto__ = [];
var len__5726__auto___144668 = arguments.length;
var i__5727__auto___144669 = (0);
while(true){
if((i__5727__auto___144669 < len__5726__auto___144668)){
args__5732__auto__.push((arguments[i__5727__auto___144669]));

var G__144672 = (i__5727__auto___144669 + (1));
i__5727__auto___144669 = G__144672;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.graph_parser.block.with_page_block_refs.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.graph_parser.block.with_page_block_refs.cljs$core$IFn$_invoke$arity$variadic = (function (block,db,date_formatter,p__144357){
var map__144358 = p__144357;
var map__144358__$1 = cljs.core.__destructure_map(map__144358);
var parse_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144358__$1,new cljs.core.Keyword(null,"parse-block","parse-block",-741293779));
var G__144359 = block;
var G__144359__$1 = (((G__144359 == null))?null:logseq.graph_parser.block.with_page_refs_and_tags(G__144359,db,date_formatter,parse_block));
var G__144359__$2 = (((G__144359__$1 == null))?null:logseq.graph_parser.block.with_block_refs(G__144359__$1));
if((G__144359__$2 == null)){
return null;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__144359__$2,new cljs.core.Keyword(null,"refs","refs",-1560051448),(function (col){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,col);
}));
}
}));

(logseq.graph_parser.block.with_page_block_refs.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.graph_parser.block.with_page_block_refs.cljs$lang$applyTo = (function (seq144353){
var G__144354 = cljs.core.first(seq144353);
var seq144353__$1 = cljs.core.next(seq144353);
var G__144355 = cljs.core.first(seq144353__$1);
var seq144353__$2 = cljs.core.next(seq144353__$1);
var G__144356 = cljs.core.first(seq144353__$2);
var seq144353__$3 = cljs.core.next(seq144353__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__144354,G__144355,G__144356,seq144353__$3);
}));

/**
 * macro: {:name "" arguments [""]}
 */
logseq.graph_parser.block.macro__GT_block = (function logseq$graph_parser$block$macro__GT_block(macro){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword("block","type","block/type",1537584409),"macro",new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"logseq.macro-name","logseq.macro-name",1789949403),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(macro),new cljs.core.Keyword(null,"logseq.macro-arguments","logseq.macro-arguments",-655551868),new cljs.core.Keyword(null,"arguments","arguments",-1182834456).cljs$core$IFn$_invoke$arity$1(macro)], null)], null);
});
logseq.graph_parser.block.extract_macros_from_ast = (function logseq$graph_parser$block$extract_macros_from_ast(ast){
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
clojure.walk.postwalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(f),"Macro")))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_result,cljs.core.conj,cljs.core.second(f));

return null;
} else {
return f;
}
}),ast);

return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.block.macro__GT_block,cljs.core.deref(_STAR_result));
});
logseq.graph_parser.block.with_pre_block_if_exists = (function logseq$graph_parser$block$with_pre_block_if_exists(blocks,body,pre_block_properties,encoded_content,p__144380){
var map__144381 = p__144380;
var map__144381__$1 = cljs.core.__destructure_map(map__144381);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144381__$1,new cljs.core.Keyword(null,"db","db",993250759));
var date_formatter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144381__$1,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709));
var user_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144381__$1,new cljs.core.Keyword(null,"user-config","user-config",-1138679827));
var first_block = cljs.core.first(blocks);
var first_block_start_pos = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(first_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","meta","block/meta",1064819153),new cljs.core.Keyword(null,"start_pos","start_pos",272375959)], null));
var blocks__$1 = (((((first_block_start_pos > (0))) || (cljs.core.empty_QMARK_(blocks))))?cljs.core.cons(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var content = logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3(encoded_content,(0),first_block_start_pos);
var map__144384 = pre_block_properties;
var map__144384__$1 = cljs.core.__destructure_map(map__144384);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144384__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var properties_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144384__$1,new cljs.core.Keyword(null,"properties-order","properties-order",-768725444));
var properties_text_values = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144384__$1,new cljs.core.Keyword(null,"properties-text-values","properties-text-values",1110303535));
var invalid_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144384__$1,new cljs.core.Keyword(null,"invalid-properties","invalid-properties",1416774099));
var id = logseq.graph_parser.block.get_custom_id_or_new_id(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),properties], null));
var property_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),logseq.graph_parser.block.get_page_refs_from_properties(properties,db,date_formatter,user_config));
var pre_block_QMARK_ = (cljs.core.truth_(new cljs.core.Keyword(null,"heading","heading",-1312171873).cljs$core$IFn$_invoke$arity$1(properties))?false:true);
var block = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","macros","block/macros",650396438)],[properties_text_values,pre_block_QMARK_,id,invalid_properties,properties,body,cljs.core.vec(properties_order),(1),content,logseq.graph_parser.block.extract_macros_from_ast(body)]);
var map__144385 = logseq.graph_parser.block.with_page_block_refs(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"body","body",-2049205669),body,new cljs.core.Keyword(null,"refs","refs",-1560051448),property_refs], null),db,date_formatter);
var map__144385__$1 = cljs.core.__destructure_map(map__144385);
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144385__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
var refs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144385__$1,new cljs.core.Keyword(null,"refs","refs",-1560051448));
var G__144387 = block;
var G__144387__$1 = (cljs.core.truth_(tags)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144387,new cljs.core.Keyword("block","tags","block/tags",1814948340),tags):G__144387);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144387__$1,new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(refs,new cljs.core.Keyword(null,"block-refs","block-refs",1507119654).cljs$core$IFn$_invoke$arity$1(pre_block_properties)));

})(),cljs.core.select_keys(first_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","page","block/page",822314108)], null))], 0)),blocks):blocks);
return blocks__$1;
});
logseq.graph_parser.block.with_heading_property = (function logseq$graph_parser$block$with_heading_property(properties,markdown_heading_QMARK_,size){
if(cljs.core.truth_(markdown_heading_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"heading","heading",-1312171873),size);
} else {
return properties;
}
});
logseq.graph_parser.block.construct_block = (function logseq$graph_parser$block$construct_block(block,properties,timestamps,body,encoded_content,format,pos_meta,p__144397){
var map__144398 = p__144397;
var map__144398__$1 = cljs.core.__destructure_map(map__144398);
var block_pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959));
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"db","db",993250759));
var date_formatter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709));
var parse_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"parse-block","parse-block",-741293779));
var remove_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556));
var db_graph_mode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"db-graph-mode?","db-graph-mode?",586979227));
var export_to_db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144398__$1,new cljs.core.Keyword(null,"export-to-db-graph?","export-to-db-graph?",2008973423));
var id = logseq.graph_parser.block.get_custom_id_or_new_id(properties);
var ref_pages_in_properties = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,new cljs.core.Keyword(null,"page-refs","page-refs",1204379971).cljs$core$IFn$_invoke$arity$1(properties));
var block__$1 = cljs.core.second(block);
var unordered_QMARK_ = new cljs.core.Keyword(null,"unordered","unordered",-731655096).cljs$core$IFn$_invoke$arity$1(block__$1);
var markdown_heading_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),format);
} else {
return and__5000__auto__;
}
})();
var block__$2 = (cljs.core.truth_(markdown_heading_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword(null,"level","level",1290497552),(cljs.core.truth_(unordered_QMARK_)?new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(block__$1):(1))):block__$1);
var block__$3 = (function (){var G__144404 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block__$2,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"refs","refs",-1560051448),ref_pages_in_properties,new cljs.core.Keyword(null,"format","format",-1306924766),format,new cljs.core.Keyword(null,"meta","meta",1499536964),pos_meta], 0)),new cljs.core.Keyword(null,"size","size",1098693007),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"unordered","unordered",-731655096)], 0));
var G__144404__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.seq(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(properties));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return markdown_heading_QMARK_;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__144404,new cljs.core.Keyword(null,"properties","properties",685819552),logseq.graph_parser.block.with_heading_property(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(properties),markdown_heading_QMARK_,new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(block__$2)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"properties-text-values","properties-text-values",1110303535),new cljs.core.Keyword(null,"properties-text-values","properties-text-values",1110303535).cljs$core$IFn$_invoke$arity$1(properties),new cljs.core.Keyword(null,"properties-order","properties-order",-768725444),cljs.core.vec(new cljs.core.Keyword(null,"properties-order","properties-order",-768725444).cljs$core$IFn$_invoke$arity$1(properties))], 0)):G__144404);
if(cljs.core.seq(new cljs.core.Keyword(null,"invalid-properties","invalid-properties",1416774099).cljs$core$IFn$_invoke$arity$1(properties))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144404__$1,new cljs.core.Keyword(null,"invalid-properties","invalid-properties",1416774099),new cljs.core.Keyword(null,"invalid-properties","invalid-properties",1416774099).cljs$core$IFn$_invoke$arity$1(properties));
} else {
return G__144404__$1;
}
})();
var block__$4 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block__$3,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"collapsed","collapsed",-628494523)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$3,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),true),new cljs.core.Keyword(null,"properties","properties",685819552),(function (m){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523));
})),new cljs.core.Keyword(null,"properties-text-values","properties-text-values",1110303535),cljs.core.dissoc,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523)),new cljs.core.Keyword(null,"properties-order","properties-order",-768725444),(function (keys_SINGLEQUOTE_){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),null], null), null),keys_SINGLEQUOTE_));
})):block__$3);
var title = (function (){var G__144406 = logseq.graph_parser.block.get_block_content(encoded_content,block__$4,format,pos_meta,block_pattern);
if(cljs.core.truth_(remove_properties_QMARK_)){
return logseq.graph_parser.property.remove_properties(cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$4,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),G__144406);
} else {
return G__144406;
}
})();
var block__$5 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$4,new cljs.core.Keyword("block","title","block/title",710445684),title);
var block__$6 = ((cljs.core.seq(timestamps))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$5,logseq.graph_parser.block.timestamps__GT_scheduled_and_deadline(timestamps)], 0)):block__$5);
var db_based_QMARK_ = (function (){var or__5002__auto__ = db_graph_mode_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return export_to_db_graph_QMARK_;
}
})();
var block__$7 = logseq.graph_parser.block.with_page_block_refs.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$6,new cljs.core.Keyword(null,"body","body",-2049205669),body),db,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"parse-block","parse-block",-741293779),parse_block], null)], 0));
var block__$8 = (cljs.core.truth_(db_based_QMARK_)?block__$7:cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(block__$7,new cljs.core.Keyword(null,"tags","tags",1771418977),(function (tags){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144392_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__144392_SHARP_,new cljs.core.Keyword("block","format","block/format",-1212045901),format);
}),tags);
})),new cljs.core.Keyword(null,"refs","refs",-1560051448),(function (refs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144393_SHARP_){
if(cljs.core.map_QMARK_(p1__144393_SHARP_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__144393_SHARP_,new cljs.core.Keyword("block","format","block/format",-1212045901),format);
} else {
return p1__144393_SHARP_;
}
}),refs);
})));
var block__$9 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(block__$8,new cljs.core.Keyword(null,"refs","refs",-1560051448),cljs.core.concat,new cljs.core.Keyword(null,"block-refs","block-refs",1507119654).cljs$core$IFn$_invoke$arity$1(properties));
var map__144401 = new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(properties);
var map__144401__$1 = cljs.core.__destructure_map(map__144401);
var created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144401__$1,new cljs.core.Keyword(null,"created-at","created-at",-89248644));
var updated_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144401__$1,new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336));
var block__$10 = (function (){var G__144411 = block__$9;
var G__144411__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = created_at;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.integer_QMARK_(created_at);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144411,new cljs.core.Keyword("block","created-at","block/created-at",1440015),created_at):G__144411);
if(cljs.core.truth_((function (){var and__5000__auto__ = updated_at;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.integer_QMARK_(updated_at);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144411__$1,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),updated_at);
} else {
return G__144411__$1;
}
})();
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block__$10,new cljs.core.Keyword(null,"title","title",636505583),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.Keyword(null,"anchor","anchor",1549638489)], 0));
});
logseq.graph_parser.block.fix_duplicate_id = (function logseq$graph_parser$block$fix_duplicate_id(block){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Logseq will assign a new id for block with content:",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block)], 0))], 0));

return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))),new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.dissoc,new cljs.core.Keyword(null,"id","id",-1388402092)),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),cljs.core.dissoc,new cljs.core.Keyword(null,"id","id",-1388402092)),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),(function (p1__144413_SHARP_){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),null], null), null),p1__144413_SHARP_));
})),new cljs.core.Keyword("block","title","block/title",710445684),(function (c){
var replace_str = cljs.core.re_pattern(["\n*\\s*",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089))))?["id",logseq.graph_parser.property.colons," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''):[logseq.graph_parser.property.colons_org("id")," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''))].join(''));
return clojure.string.replace_first(c,replace_str,"");
}));
});
/**
 * If the block exists in another page or the current page, we need to fix it
 */
logseq.graph_parser.block.fix_block_id_if_duplicated_BANG_ = (function logseq$graph_parser$block$fix_block_id_if_duplicated_BANG_(db,page_name,_STAR_extracted_block_ids,block){
var block_page_name = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__144422 = db;
var G__144423 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144422,G__144423) : datascript.core.entity.call(null,G__144422,G__144423));
})()));
var block__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = block_page_name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_page_name,page_name);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(cljs.core.deref(_STAR_extracted_block_ids),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
}
})())?logseq.graph_parser.block.fix_duplicate_id(block):block);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_extracted_block_ids,cljs.core.conj,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));

return block__$1;
});
/**
 * Extract headings from mldoc ast. Args:
 *   *`blocks`: mldoc ast.
 *   *  `content`: markdown or org-mode text.
 *   *  `format`: content's format, it could be either :markdown or :org-mode.
 *   *  `options`: Options are :user-config, :block-pattern, :parse-block, :date-formatter, :db and
 *   * :db-graph-mode? : Set when a db graph in the frontend
 *   * :export-to-db-graph? : Set when exporting to a db graph
 */
logseq.graph_parser.block.extract_blocks = (function logseq$graph_parser$block$extract_blocks(blocks,content,format,p__144435){
var map__144436 = p__144435;
var map__144436__$1 = cljs.core.__destructure_map(map__144436);
var options = map__144436__$1;
var user_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144436__$1,new cljs.core.Keyword(null,"user-config","user-config",-1138679827));
var db_graph_mode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144436__$1,new cljs.core.Keyword(null,"db-graph-mode?","db-graph-mode?",586979227));
var export_to_db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144436__$1,new cljs.core.Keyword(null,"export-to-db-graph?","export-to-db-graph?",2008973423));
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

if(typeof content === 'string'){
} else {
throw (new Error("Assert failed: (string? content)"));
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"markdown","markdown",1227225089),null,new cljs.core.Keyword(null,"org","org",1495985),null], null), null),format)){
} else {
throw (new Error("Assert failed: (contains? #{:markdown :org} format)"));
}

var encoded_content = logseq.graph_parser.utf8.encode(content);
var all_blocks = cljs.core.vec(cljs.core.reverse(blocks));
var vec__144437 = (function (){var headings = cljs.core.PersistentVector.EMPTY;
var blocks__$1 = cljs.core.reverse(blocks);
var block_idx = (0);
var timestamps = cljs.core.PersistentArrayMap.EMPTY;
var properties = cljs.core.PersistentArrayMap.EMPTY;
var body = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.seq(blocks__$1)){
var vec__144447 = cljs.core.first(blocks__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144447,(0),null);
var pos_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144447,(1),null);
if(logseq.graph_parser.block.paragraph_timestamp_block_QMARK_(block)){
var timestamps__$1 = logseq.graph_parser.block.extract_timestamps(block);
var timestamps_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([timestamps__$1,timestamps__$1], 0));
var G__144709 = headings;
var G__144710 = cljs.core.rest(blocks__$1);
var G__144711 = (block_idx + (1));
var G__144712 = timestamps_SINGLEQUOTE_;
var G__144713 = properties;
var G__144714 = body;
headings = G__144709;
blocks__$1 = G__144710;
block_idx = G__144711;
timestamps = G__144712;
properties = G__144713;
body = G__144714;
continue;
} else {
if(logseq.graph_parser.property.properties_ast_QMARK_(block)){
var properties__$1 = logseq.graph_parser.block.extract_properties(cljs.core.second(block),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(user_config,new cljs.core.Keyword(null,"format","format",-1306924766),format));
var G__144716 = headings;
var G__144717 = cljs.core.rest(blocks__$1);
var G__144718 = (block_idx + (1));
var G__144719 = timestamps;
var G__144720 = properties__$1;
var G__144721 = body;
headings = G__144716;
blocks__$1 = G__144717;
block_idx = G__144718;
timestamps = G__144719;
properties = G__144720;
body = G__144721;
continue;
} else {
if(logseq.graph_parser.block.heading_block_QMARK_(block)){
var cut_multiline_QMARK_ = (function (){var and__5000__auto__ = export_to_db_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var temp__5804__auto__ = cljs.core.first(cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_blocks,(block_idx - (1))));
if(cljs.core.truth_(temp__5804__auto__)){
var prev_block = temp__5804__auto__;
return ((((logseq.graph_parser.property.properties_ast_QMARK_(prev_block)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("Custom",cljs.core.ffirst(cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_blocks,(block_idx - (2)))))))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Drawer","logbook"], null),cljs.core.take.cljs$core$IFn$_invoke$arity$2((2),prev_block))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Paragraph",cljs.core.first(prev_block))) && (cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.flatten(prev_block)),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Deadline",null,"Scheduled",null], null), null)))))))));
} else {
return null;
}
} else {
return and__5000__auto__;
}
})();
var pos_meta_SINGLEQUOTE_ = (cljs.core.truth_(cut_multiline_QMARK_)?pos_meta:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(pos_meta,new cljs.core.Keyword(null,"end_pos","end_pos",-1418940),((cljs.core.seq(headings))?cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.last(headings),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.Keyword(null,"start_pos","start_pos",272375959)], null)):null)));
var options_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556),(function (){var and__5000__auto__ = export_to_db_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((logseq.graph_parser.property.properties_ast_QMARK_(cljs.core.first(cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_blocks,(block_idx - (1)))))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Custom",cljs.core.ffirst(cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_blocks,(block_idx - (2)))))));
} else {
return and__5000__auto__;
}
})());
var block_SINGLEQUOTE_ = logseq.graph_parser.block.construct_block(block,properties,timestamps,body,encoded_content,format,pos_meta_SINGLEQUOTE_,options_SINGLEQUOTE_);
var block_SINGLEQUOTE__SINGLEQUOTE_ = (cljs.core.truth_((function (){var or__5002__auto__ = db_graph_mode_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return export_to_db_graph_QMARK_;
}
})())?block_SINGLEQUOTE_:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block_SINGLEQUOTE_,new cljs.core.Keyword(null,"macros","macros",811339431),logseq.graph_parser.block.extract_macros_from_ast(cljs.core.cons(block,body))));
var G__144729 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(headings,block_SINGLEQUOTE__SINGLEQUOTE_);
var G__144730 = cljs.core.rest(blocks__$1);
var G__144731 = (block_idx + (1));
var G__144732 = cljs.core.PersistentArrayMap.EMPTY;
var G__144733 = cljs.core.PersistentArrayMap.EMPTY;
var G__144734 = cljs.core.PersistentVector.EMPTY;
headings = G__144729;
blocks__$1 = G__144730;
block_idx = G__144731;
timestamps = G__144732;
properties = G__144733;
body = G__144734;
continue;
} else {
var G__144735 = headings;
var G__144736 = cljs.core.rest(blocks__$1);
var G__144737 = (block_idx + (1));
var G__144738 = timestamps;
var G__144739 = properties;
var G__144740 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(body,block);
headings = G__144735;
blocks__$1 = G__144736;
block_idx = G__144737;
timestamps = G__144738;
properties = G__144739;
body = G__144740;
continue;

}
}
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.block.sanity_blocks_data(cljs.core.reverse(headings)),body,properties], null);
}
break;
}
})();
var blocks__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144437,(0),null);
var body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144437,(1),null);
var pre_block_properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144437,(2),null);
var result = logseq.graph_parser.block.with_pre_block_if_exists(blocks__$1,body,pre_block_properties,encoded_content,options);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144434_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__144434_SHARP_,new cljs.core.Keyword("block","meta","block/meta",1064819153));
}),result);
});
logseq.graph_parser.block.with_parent_and_order = (function logseq$graph_parser$block$with_parent_and_order(page_id,blocks){
var vec__144464 = cljs.core.split_with((function (b){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("macro",new cljs.core.Keyword("block","type","block/type",1537584409).cljs$core$IFn$_invoke$arity$1(b));
}),blocks);
var blocks__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144464,(0),null);
var other_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144464,(1),null);
var result = (function (){var blocks__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__144464,blocks__$1,other_blocks){
return (function (block){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(block));
});})(vec__144464,blocks__$1,other_blocks))
,blocks__$1);
var parents = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("page","id","page/id",-1375529051),page_id,new cljs.core.Keyword("block","level","block/level",1182509971),(0),new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765),(0)], null)], null);
var result = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.empty_QMARK_(blocks__$2)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (blocks__$2,parents,result,vec__144464,blocks__$1,other_blocks){
return (function (p1__144460_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__144460_SHARP_,new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765));
});})(blocks__$2,parents,result,vec__144464,blocks__$1,other_blocks))
,result);
} else {
var vec__144488 = blocks__$2;
var seq__144489 = cljs.core.seq(vec__144488);
var first__144490 = cljs.core.first(seq__144489);
var seq__144489__$1 = cljs.core.next(seq__144489);
var block = first__144490;
var others = seq__144489__$1;
var level_spaces = new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(block);
var map__144491 = cljs.core.last(parents);
var map__144491__$1 = cljs.core.__destructure_map(map__144491);
var last_parent = map__144491__$1;
var uuid_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144491__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144491__$1,new cljs.core.Keyword("block","level","block/level",1182509971));
var parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144491__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064));
var parent_spaces = new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(last_parent);
var vec__144492 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(level_spaces,parent_spaces))?(function (){var block__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("block","parent","block/parent",-918309064),parent,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","level","block/level",1182509971),level], 0));
var parents_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.butlast(parents)),block__$1);
var result_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,block__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [others,parents_SINGLEQUOTE_,result_SINGLEQUOTE_], null);
})():(((level_spaces > parent_spaces))?(function (){var parent__$1 = (cljs.core.truth_(uuid_SINGLEQUOTE_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_], null):new cljs.core.Keyword("page","id","page/id",-1375529051).cljs$core$IFn$_invoke$arity$1(last_parent));
var block__$1 = (function (){var G__144501 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","parent","block/parent",-918309064),parent__$1);
if(((level_spaces - parent_spaces) >= (1))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144501,new cljs.core.Keyword("block","level","block/level",1182509971),(level + (1)));
} else {
return G__144501;
}
})();
var parents_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,block__$1);
var result_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,block__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [others,parents_SINGLEQUOTE_,result_SINGLEQUOTE_], null);
})():(((level_spaces < parent_spaces))?(cljs.core.truth_(cljs.core.some(((function (blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks){
return (function (p1__144463_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(p1__144463_SHARP_),new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(block));
});})(blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks))
,parents))?(function (){var parents_SINGLEQUOTE_ = cljs.core.vec(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(((function (blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks){
return (function (p){
return (new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(p) <= level_spaces);
});})(blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks))
,parents));
var blocks__$3 = cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(blocks__$2),new cljs.core.Keyword("block","level","block/level",1182509971),(level - (1))),cljs.core.rest(blocks__$2));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [blocks__$3,parents_SINGLEQUOTE_,result], null);
})():(function (){var vec__144505 = cljs.core.split_with(((function (blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks){
return (function (p){
return (new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(p) <= level_spaces);
});})(blocks__$2,parents,result,vec__144488,seq__144489,first__144490,seq__144489__$1,block,others,level_spaces,map__144491,map__144491__$1,last_parent,uuid_SINGLEQUOTE_,level,parent,parent_spaces,vec__144464,blocks__$1,other_blocks))
,parents);
var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144505,(0),null);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144505,(1),null);
var left = cljs.core.first(r);
var parent_id = (function (){var temp__5802__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.last(f));
if(cljs.core.truth_(temp__5802__auto__)){
var block_id = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
} else {
return page_id;
}
})();
var block__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("block","parent","block/parent",-918309064),parent_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(left),new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765),new cljs.core.Keyword("block","level-spaces","block/level-spaces",-683391765).cljs$core$IFn$_invoke$arity$1(left)], 0));
var parents_SINGLEQUOTE_ = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block__$1], null)));
var result_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,block__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [others,parents_SINGLEQUOTE_,result_SINGLEQUOTE_], null);
})()
):null)));
var blocks__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144492,(0),null);
var parents__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144492,(1),null);
var result__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144492,(2),null);
var G__144753 = blocks__$3;
var G__144754 = parents__$1;
var G__144755 = result__$1;
blocks__$2 = G__144753;
parents = G__144754;
result = G__144755;
continue;
}
break;
}
})();
var result_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0());
}),result);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result_SINGLEQUOTE_,other_blocks);
});
/**
 * Extract plain elements including page refs
 */
logseq.graph_parser.block.extract_plain = (function logseq$graph_parser$block$extract_plain(repo,content){
var ast = logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3(repo,content,new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
clojure.walk.prewalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Tag",cljs.core.first(f))))){
return null;
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Nested_link",cljs.core.first(f))))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_result,cljs.core.conj,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(cljs.core.second(f)));
} else {
if(((cljs.core.vector_QMARK_(f)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Link",cljs.core.first(f))) && (((cljs.core.map_QMARK_(cljs.core.second(f))) && (((cljs.core.vector_QMARK_(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(f)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Page_ref",cljs.core.first(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.second(f))))))))))))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_result,cljs.core.conj,new cljs.core.Keyword(null,"full_text","full_text",1634289075).cljs$core$IFn$_invoke$arity$1(cljs.core.second(f)));
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Plain",cljs.core.first(f))))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_result,cljs.core.conj,cljs.core.second(f));
} else {
return f;

}
}
}
}
}),ast);

var G__144525 = clojure.string.trim(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.deref(_STAR_result)));
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(G__144525) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,G__144525));
});
logseq.graph_parser.block.extract_refs_from_text = (function logseq$graph_parser$block$extract_refs_from_text(repo,db,text,date_formatter){
if(typeof text === 'string'){
var ast_refs = logseq.graph_parser.mldoc.get_references(text,logseq.graph_parser.mldoc.get_default_config(repo,new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
var page_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144526_SHARP_){
return logseq.graph_parser.block.get_page_reference(p1__144526_SHARP_,new cljs.core.Keyword(null,"markdown","markdown",1227225089));
}),ast_refs);
var block_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.block.get_block_reference,ast_refs);
var refs_SINGLEQUOTE_ = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_refs,block_refs)));
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144528_SHARP_){
if(datascript.impl.entity.entity_QMARK_(p1__144528_SHARP_)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__144528_SHARP_)], null);
} else {
if(logseq.common.util.uuid_string_QMARK_(p1__144528_SHARP_)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(p1__144528_SHARP_)], null);
} else {
return logseq.graph_parser.block.page_name__GT_map(p1__144528_SHARP_,db,true,date_formatter);

}
}
}),refs_SINGLEQUOTE_));
} else {
return null;
}
});

//# sourceMappingURL=logseq.graph_parser.block.js.map
