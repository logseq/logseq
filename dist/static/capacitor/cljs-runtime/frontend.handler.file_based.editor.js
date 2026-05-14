goog.provide('frontend.handler.file_based.editor');
frontend.handler.file_based.editor.remove_non_existed_refs_BANG_ = (function frontend$handler$file_based$editor$remove_non_existed_refs_BANG_(refs){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (x){
return ((((cljs.core.vector_QMARK_(x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(x))) && (((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(x) : frontend.db.entity.call(null,x)) == null)))))) || ((x == null)));
}),refs);
});
frontend.handler.file_based.editor.with_marker_time = (function frontend$handler$file_based$editor$with_marker_time(content,block,format,new_marker,old_marker){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.enable_timetracking_QMARK_();
if(and__5000__auto__){
return new_marker;
} else {
return and__5000__auto__;
}
})())){
try{var logbook_exists_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.file_based.drawer.get_logbook(new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
})();
var new_marker__$1 = clojure.string.trim(clojure.string.lower_case(cljs.core.name(new_marker)));
var old_marker__$1 = (cljs.core.truth_(old_marker)?clojure.string.trim(clojure.string.lower_case(cljs.core.name(old_marker))):null);
var new_content = (((((((old_marker__$1 == null)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"doing")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"now")))))) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_marker__$1,"todo")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"doing")))) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_marker__$1,"later")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"now")))) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(old_marker__$1,new_marker__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["now"], 0))) && (cljs.core.not(logbook_exists_QMARK_)))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(old_marker__$1,new_marker__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["doing"], 0))) && (cljs.core.not(logbook_exists_QMARK_))))))))))))?frontend.util.file_based.clock.clock_in(format,content):((((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_marker__$1,"doing")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"todo")))) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_marker__$1,"now")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"later")))) || (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["doing",null,"now",null], null), null),old_marker__$1)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_marker__$1,"done"))))))))?frontend.util.file_based.clock.clock_out(format,content):content
));
return new_content;
}catch (e64482){var _e = e64482;
return content;
}} else {
return content;
}
});
frontend.handler.file_based.editor.with_timetracking = (function frontend$handler$file_based$editor$with_timetracking(block,value){
if(((frontend.state.enable_timetracking_QMARK_()) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),value)))){
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var new_marker = cljs.core.last((function (){var G__64483 = (frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1(format) : frontend.handler.file_based.status.marker_pattern.call(null,format));
var G__64484 = (function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__64483,G__64484) : frontend.util.safe_re_find.call(null,G__64483,G__64484));
})());
var new_value = frontend.handler.file_based.editor.with_marker_time(value,block,format,new_marker,new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block));
return new_value;
} else {
return value;
}
});
frontend.handler.file_based.editor.wrap_parse_block = (function frontend$handler$file_based$editor$wrap_parse_block(p__64485){
var map__64486 = p__64485;
var map__64486__$1 = cljs.core.__destructure_map(map__64486);
var block = map__64486__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64486__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64486__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64486__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64486__$1,new cljs.core.Keyword("block","level","block/level",1182509971));
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64486__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var repo = frontend.state.get_current_repo();
var block__$1 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
var G__64490 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__64490) : frontend.db.pull.call(null,G__64490));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var page = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block__$1);
var block__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,format,pre_block_QMARK_,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1))], 0));
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2);
var properties__$1 = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))) && (typeof new cljs.core.Keyword(null,"heading","heading",-1312171873).cljs$core$IFn$_invoke$arity$1(properties) === 'number')))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.Keyword(null,"heading","heading",-1312171873)):properties);
var real_content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$2);
var content = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(properties__$1);
if(and__5000__auto__){
var and__5000__auto____$1 = real_content;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(real_content,title);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.handler.property.file.with_built_in_properties_when_file_based(repo,properties__$1,title,format):title);
var content__$1 = frontend.util.file_based.drawer.with_logbook(block__$2,content);
var content__$2 = frontend.handler.file_based.editor.with_timetracking(block__$2,content__$1);
var first_block_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(logseq.db.get_first_child((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2));
var ast = frontend.format.mldoc.__GT_edn(clojure.string.trim(content__$2),format);
var first_elem_type = cljs.core.first(cljs.core.ffirst(ast));
var first_elem_meta = cljs.core.second(cljs.core.ffirst(ast));
var properties_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Property_Drawer",null,"Properties",null], null), null),first_elem_type);
var markdown_heading_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Heading",first_elem_type)) && ((new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(first_elem_meta) == null)))));
var block_with_title_QMARK_ = (frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1(first_elem_type) : frontend.format.mldoc.block_with_title_QMARK_.call(null,first_elem_type));
var content__$3 = clojure.string.triml(content__$2);
var content__$4 = clojure.string.replace(content__$3,logseq.common.util.block_ref.__GT_block_ref(uuid),"");
var vec__64487 = ((((first_block_QMARK_) && (properties_QMARK_)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content__$4,content__$4], null):((markdown_heading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content__$4,content__$4], null):(function (){var content_SINGLEQUOTE_ = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_block_pattern(format)),(cljs.core.truth_(block_with_title_QMARK_)?" ":"\n"),content__$4].join('');
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content__$4,content_SINGLEQUOTE_], null);
})()
));
var content__$5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64487,(0),null);
var content_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64487,(1),null);
var block__$3 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block__$2,new cljs.core.Keyword("block","title","block/title",710445684),content_SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","format","block/format",-1212045901),format], 0));
var block__$4 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,block__$3,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),null], null), null),logseq.db.file_based.schema.retract_attributes));
var block__$5 = frontend.format.block.parse_block(block__$4);
var block__$6 = (cljs.core.truth_((function (){var and__5000__auto__ = first_block_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block__$5);
} else {
return and__5000__auto__;
}
})())?block__$5:cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block__$5,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521)));
var block__$7 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(block__$6,new cljs.core.Keyword("block","refs","block/refs",-1214495349),frontend.handler.file_based.editor.remove_non_existed_refs_BANG_);
var new_properties = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(properties__$1,(frontend.handler.file_based.property.hidden_properties.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.file_based.property.hidden_properties.cljs$core$IFn$_invoke$arity$0() : frontend.handler.file_based.property.hidden_properties.call(null))),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$7)], 0));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block__$7,new cljs.core.Keyword("block","title","block/title",710445684),content__$5,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","properties","block/properties",708347145),new_properties], 0)),(cljs.core.truth_(level)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","level","block/level",1182509971),level], null):cljs.core.PersistentArrayMap.EMPTY)], 0));
});
frontend.handler.file_based.editor.set_block_property_aux_BANG_ = (function frontend$handler$file_based$editor$set_block_property_aux_BANG_(block_or_id,key,value){
var temp__5804__auto__ = ((typeof block_or_id === 'string')?(function (){var G__64491 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(block_or_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64491) : frontend.db.entity.call(null,G__64491));
})():((cljs.core.uuid_QMARK_(block_or_id))?(function (){var G__64492 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_or_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64492) : frontend.db.entity.call(null,G__64492));
})():block_or_id
));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
var properties__$1 = (((value == null))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(properties,key):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,key,value));
var content__$1 = (((value == null))?(frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.file_based.property.util.remove_property.cljs$core$IFn$_invoke$arity$3(format,key,content) : frontend.handler.file_based.property.util.remove_property.call(null,format,key,content)):frontend.handler.file_based.property.util.insert_property.cljs$core$IFn$_invoke$arity$4(format,content,key,value));
var content__$2 = frontend.handler.file_based.property.util.remove_empty_properties(content__$1);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","properties","block/properties",708347145),properties__$1,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),(function (){var or__5002__auto__ = cljs.core.keys(properties__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})(),new cljs.core.Keyword("block","title","block/title",710445684),content__$2], null);
} else {
return null;
}
});
frontend.handler.file_based.editor.set_heading_aux_BANG_ = (function frontend$handler$file_based$editor$set_heading_aux_BANG_(block_id,heading){
var block = (function (){var G__64493 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__64493) : frontend.db.pull.call(null,G__64493));
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var old_heading = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"heading","heading",-1312171873)], null));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))){
if((((((old_heading == null)) && ((heading == null)))) || (((((old_heading === true) && (heading === true))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_heading,heading)))))){
return null;
} else {
if((((((old_heading == null)) && (heading === true))) || (((old_heading === true) && ((heading == null)))))){
return frontend.handler.file_based.editor.set_block_property_aux_BANG_(block,new cljs.core.Keyword(null,"heading","heading",-1312171873),heading);
} else {
if((((((heading == null)) || (heading === true))) && (typeof old_heading === 'number'))){
var block_SINGLEQUOTE_ = frontend.handler.file_based.editor.set_block_property_aux_BANG_(block,new cljs.core.Keyword(null,"heading","heading",-1312171873),heading);
var content = (function (){var G__64494 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__64494) : frontend.commands.clear_markdown_heading.call(null,G__64494));
})();
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),content], null)], 0));
} else {
if((((((old_heading == null)) || (old_heading === true))) && (typeof heading === 'number'))){
var block_SINGLEQUOTE_ = frontend.handler.file_based.editor.set_block_property_aux_BANG_(block,new cljs.core.Keyword(null,"heading","heading",-1312171873),null);
var properties = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"heading","heading",-1312171873),heading);
var content = frontend.commands.file_based_set_markdown_heading(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_),heading);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),content,new cljs.core.Keyword("block","properties","block/properties",708347145),properties], null)], 0));
} else {
var properties = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"heading","heading",-1312171873),heading);
var content = frontend.commands.file_based_set_markdown_heading((function (){var G__64495 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1 ? frontend.commands.clear_markdown_heading.cljs$core$IFn$_invoke$arity$1(G__64495) : frontend.commands.clear_markdown_heading.call(null,G__64495));
})(),heading);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","properties","block/properties",708347145),properties,new cljs.core.Keyword("block","title","block/title",710445684),content], null);

}
}
}
}
} else {
return frontend.handler.file_based.editor.set_block_property_aux_BANG_(block,new cljs.core.Keyword(null,"heading","heading",-1312171873),heading);
}
});
frontend.handler.file_based.editor.batch_set_heading_BANG_ = (function frontend$handler$file_based$editor$batch_set_heading_BANG_(block_ids,heading){
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__64496 = cljs.core.seq(block_ids);
var chunk__64497 = null;
var count__64498 = (0);
var i__64499 = (0);
while(true){
if((i__64499 < count__64498)){
var block_id = chunk__64497.cljs$core$IIndexed$_nth$arity$2(null,i__64499);
var temp__5804__auto___64550 = frontend.handler.file_based.editor.set_heading_aux_BANG_(block_id,heading);
if(cljs.core.truth_(temp__5804__auto___64550)){
var block_64551 = temp__5804__auto___64550;
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_64551,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__64552 = seq__64496;
var G__64553 = chunk__64497;
var G__64554 = count__64498;
var G__64555 = (i__64499 + (1));
seq__64496 = G__64552;
chunk__64497 = G__64553;
count__64498 = G__64554;
i__64499 = G__64555;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__64496);
if(temp__5804__auto__){
var seq__64496__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__64496__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__64496__$1);
var G__64556 = cljs.core.chunk_rest(seq__64496__$1);
var G__64557 = c__5525__auto__;
var G__64558 = cljs.core.count(c__5525__auto__);
var G__64559 = (0);
seq__64496 = G__64556;
chunk__64497 = G__64557;
count__64498 = G__64558;
i__64499 = G__64559;
continue;
} else {
var block_id = cljs.core.first(seq__64496__$1);
var temp__5804__auto___64560__$1 = frontend.handler.file_based.editor.set_heading_aux_BANG_(block_id,heading);
if(cljs.core.truth_(temp__5804__auto___64560__$1)){
var block_64561 = temp__5804__auto___64560__$1;
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_64561,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__64562 = cljs.core.next(seq__64496__$1);
var G__64563 = null;
var G__64564 = (0);
var G__64565 = (0);
seq__64496 = G__64562;
chunk__64497 = G__64563;
count__64498 = G__64564;
i__64499 = G__64565;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__64500 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__64501 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__64501);

try{var seq__64502_64566 = cljs.core.seq(block_ids);
var chunk__64503_64567 = null;
var count__64504_64568 = (0);
var i__64505_64569 = (0);
while(true){
if((i__64505_64569 < count__64504_64568)){
var block_id_64570 = chunk__64503_64567.cljs$core$IIndexed$_nth$arity$2(null,i__64505_64569);
var temp__5804__auto___64571 = frontend.handler.file_based.editor.set_heading_aux_BANG_(block_id_64570,heading);
if(cljs.core.truth_(temp__5804__auto___64571)){
var block_64572 = temp__5804__auto___64571;
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_64572,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__64573 = seq__64502_64566;
var G__64574 = chunk__64503_64567;
var G__64575 = count__64504_64568;
var G__64576 = (i__64505_64569 + (1));
seq__64502_64566 = G__64573;
chunk__64503_64567 = G__64574;
count__64504_64568 = G__64575;
i__64505_64569 = G__64576;
continue;
} else {
var temp__5804__auto___64577 = cljs.core.seq(seq__64502_64566);
if(temp__5804__auto___64577){
var seq__64502_64578__$1 = temp__5804__auto___64577;
if(cljs.core.chunked_seq_QMARK_(seq__64502_64578__$1)){
var c__5525__auto___64579 = cljs.core.chunk_first(seq__64502_64578__$1);
var G__64580 = cljs.core.chunk_rest(seq__64502_64578__$1);
var G__64581 = c__5525__auto___64579;
var G__64582 = cljs.core.count(c__5525__auto___64579);
var G__64583 = (0);
seq__64502_64566 = G__64580;
chunk__64503_64567 = G__64581;
count__64504_64568 = G__64582;
i__64505_64569 = G__64583;
continue;
} else {
var block_id_64584 = cljs.core.first(seq__64502_64578__$1);
var temp__5804__auto___64585__$1 = frontend.handler.file_based.editor.set_heading_aux_BANG_(block_id_64584,heading);
if(cljs.core.truth_(temp__5804__auto___64585__$1)){
var block_64586 = temp__5804__auto___64585__$1;
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_64586,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__64587 = cljs.core.next(seq__64502_64578__$1);
var G__64588 = null;
var G__64589 = (0);
var G__64590 = (0);
seq__64502_64566 = G__64587;
chunk__64503_64567 = G__64588;
count__64504_64568 = G__64589;
i__64505_64569 = G__64590;
continue;
}
} else {
}
}
break;
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__64500);
}}
});
/**
 * Persist block uuid to file if the uuid is valid, and it's not persisted in file.
 * Accepts a list of uuids.
 */
frontend.handler.file_based.editor.set_blocks_id_BANG_ = (function frontend$handler$file_based$editor$set_blocks_id_BANG_(block_ids){
var block_ids__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,block_ids);
var col = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_id){
var temp__5804__auto__ = (function (){var G__64506 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64506) : frontend.db.entity.call(null,G__64506));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block))){
return null;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)], null);
}
} else {
return null;
}
}),block_ids__$1);
var col__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,col);
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(col__$1);
});
/**
 * Whether block has a valid dsl query.
 */
frontend.handler.file_based.editor.valid_dsl_query_block_QMARK_ = (function frontend$handler$file_based$editor$valid_dsl_query_block_QMARK_(block){
return cljs.core.some((function (macro){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(macro);
var macro_name = new cljs.core.Keyword(null,"logseq.macro-name","logseq.macro-name",1789949403).cljs$core$IFn$_invoke$arity$1(properties);
var macro_arguments = new cljs.core.Keyword(null,"logseq.macro-arguments","logseq.macro-arguments",-655551868).cljs$core$IFn$_invoke$arity$1(properties);
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("query",macro_name);
if(and__5000__auto__){
return cljs.core.not_empty(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",macro_arguments));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var query_body = temp__5804__auto__;
return cljs.core.seq(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1((function (){try{return frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$1(query_body);
}catch (e64507){var _e = e64507;
return null;
}})()));
} else {
return null;
}
}),new cljs.core.Keyword("block","macros","block/macros",650396438).cljs$core$IFn$_invoke$arity$1((function (){var G__64508 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64508) : frontend.db.entity.call(null,G__64508));
})()));
});
/**
 * Whether block has a valid custom query.
 */
frontend.handler.file_based.editor.valid_custom_query_block_QMARK_ = (function frontend$handler$file_based$editor$valid_custom_query_block_QMARK_(block){
var entity = (function (){var G__64509 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64509) : frontend.db.entity.call(null,G__64509));
})();
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(content)){
if(((clojure.string.includes_QMARK_(content,"#+BEGIN_QUERY")) && (clojure.string.includes_QMARK_(content,"#+END_QUERY")))){
var ast = frontend.format.mldoc.__GT_edn(clojure.string.trim(content),cljs.core.get.cljs$core$IFn$_invoke$arity$3(entity,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
var q = frontend.format.mldoc.extract_first_query_from_ast(ast);
return (!((new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(q)) == null)));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.file_based.editor.update_timestamps_content_BANG_ = (function frontend$handler$file_based$editor$update_timestamps_content_BANG_(p__64510,content){
var map__64511 = p__64510;
var map__64511__$1 = cljs.core.__destructure_map(map__64511);
var block = map__64511__$1;
var repeated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64511__$1,new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64511__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64511__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
if(cljs.core.truth_(repeated_QMARK_)){
var scheduled_ast = frontend.handler.block.get_scheduled_ast(block);
var deadline_ast = frontend.handler.block.get_deadline_ast(block);
var content__$1 = (function (){var G__64512 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.repeated.repeated_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [scheduled_ast,deadline_ast], null));
var G__64512__$1 = (((G__64512 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ts){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$1(ts),frontend.handler.file_based.repeated.next_timestamp_text(ts)], null);
}),G__64512));
if((G__64512__$1 == null)){
return null;
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,p__64513){
var vec__64514 = p__64513;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64514,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64514,(1),null);
return clojure.string.replace(content__$1,old,new$);
}),content,G__64512__$1);
}
})();
var content__$2 = clojure.string.replace_first(content__$1,marker,(function (){var G__64517 = marker;
switch (G__64517) {
case "DOING":
return "TODO";

break;
case "NOW":
return "LATER";

break;
default:
return marker;

}
})());
var content__$3 = frontend.util.file_based.clock.clock_out(format,content__$2);
var content__$4 = frontend.util.file_based.drawer.insert_drawer(format,content__$3,"logbook",(function (){var G__64518 = [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format))?"-":"*")," State \"DONE\" from \"%s\" [%s]"].join('');
var G__64519 = marker;
var G__64520 = frontend.date.get_date_time_string_3();
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64518,G__64519,G__64520) : frontend.util.format.call(null,G__64518,G__64519,G__64520));
})());
return content__$4;
} else {
return content;
}
});
/**
 * Save incoming(pasted) assets to assets directory.
 * 
 * Returns: [file-rpath file-obj file-fpath matched-alias]
 */
frontend.handler.file_based.editor.file_based_save_assets_BANG_ = (function frontend$handler$file_based$editor$file_based_save_assets_BANG_(var_args){
var G__64522 = arguments.length;
switch (G__64522) {
case 2:
return frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 5:
return frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,files){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.ensure_assets_dir_BANG_(repo)),(function (p__64523){
var vec__64524 = p__64523;
var repo_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64524,(0),null);
var assets_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64524,(1),null);
return promesa.protocols._promise(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$5(repo,repo_dir,assets_dir,files,(function (index,file_stem){
var file_base = clojure.string.replace(clojure.string.replace(clojure.string.replace(file_stem," ","_"),"%","_"),"/","_");
var file_name = [file_base,"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(Date.now()),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(index)].join('');
return clojure.string.replace(file_name,/_+/,"_");
})));
}));
}));
}));

(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$5 = (function (repo,repo_dir,asset_dir_rpath,files,gen_filename){
return promesa.core.all((function (){var iter__5480__auto__ = (function frontend$handler$file_based$editor$iter__64527(s__64528){
return (new cljs.core.LazySeq(null,(function (){
var s__64528__$1 = s__64528;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__64528__$1);
if(temp__5804__auto__){
var s__64528__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__64528__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__64528__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__64530 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__64529 = (0);
while(true){
if((i__64529 < size__5479__auto__)){
var vec__64531 = cljs.core._nth(c__5478__auto__,i__64529);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64531,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64531,(1),null);
cljs.core.chunk_append(b__64530,(function (){var file_name = (function (){var G__64537 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__64537) : frontend.util.node_path.basename.call(null,G__64537));
})();
var vec__64534 = (cljs.core.truth_(file_name)?(function (){var ext_base = (frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.extname.call(null,file_name));
var ext_full = ((cljs.core.not(frontend.config.extname_of_supported_QMARK_.cljs$core$IFn$_invoke$arity$1(ext_base)))?(frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.full_path_extname.call(null,file_name)):ext_base);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(file_name,(0),(cljs.core.count(file_name) - cljs.core.count(ext_full))),ext_full,ext_base], null);
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["","",""], null));
var file_stem = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64534,(0),null);
var ext_full = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64534,(1),null);
var ext_base = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64534,(2),null);
var filename = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((gen_filename.cljs$core$IFn$_invoke$arity$2 ? gen_filename.cljs$core$IFn$_invoke$arity$2(index,file_stem) : gen_filename.call(null,index,file_stem))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext_full)].join('');
var file_rpath = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_dir_rpath),"/",filename].join('');
var matched_alias = frontend.handler.assets.get_matched_alias_by_ext(ext_base);
var file_rpath__$1 = (function (){var G__64538 = file_rpath;
if((!((matched_alias == null)))){
return clojure.string.replace(G__64538,/^[.\\/\\]*assets[\\/\\]+/,"");
} else {
return G__64538;
}
})();
var dir = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(matched_alias);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return repo_dir;
}
})();
return promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(console.debug("Debug: Writing Asset #",dir,file_rpath__$1)),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (content){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath__$1], 0))),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (file_fpath){
return promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["writeFile",repo,file_fpath,content], 0)));
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
);
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
);
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
)),((function (i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__){
return (function (___40947__auto____$1){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [file_rpath__$1,file,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath__$1], 0)),matched_alias], null));
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
);
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
);
});})(i__64529,file_name,vec__64534,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64531,index,file,c__5478__auto__,size__5479__auto__,b__64530,s__64528__$2,temp__5804__auto__))
);
})());

var G__64593 = (i__64529 + (1));
i__64529 = G__64593;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__64530),frontend$handler$file_based$editor$iter__64527(cljs.core.chunk_rest(s__64528__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__64530),null);
}
} else {
var vec__64539 = cljs.core.first(s__64528__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64539,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64539,(1),null);
return cljs.core.cons((function (){var file_name = (function (){var G__64545 = file.name;
return (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(G__64545) : frontend.util.node_path.basename.call(null,G__64545));
})();
var vec__64542 = (cljs.core.truth_(file_name)?(function (){var ext_base = (frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.node_path.extname.call(null,file_name));
var ext_full = ((cljs.core.not(frontend.config.extname_of_supported_QMARK_.cljs$core$IFn$_invoke$arity$1(ext_base)))?(frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1(file_name) : frontend.util.full_path_extname.call(null,file_name)):ext_base);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(file_name,(0),(cljs.core.count(file_name) - cljs.core.count(ext_full))),ext_full,ext_base], null);
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["","",""], null));
var file_stem = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64542,(0),null);
var ext_full = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64542,(1),null);
var ext_base = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64542,(2),null);
var filename = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((gen_filename.cljs$core$IFn$_invoke$arity$2 ? gen_filename.cljs$core$IFn$_invoke$arity$2(index,file_stem) : gen_filename.call(null,index,file_stem))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext_full)].join('');
var file_rpath = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_dir_rpath),"/",filename].join('');
var matched_alias = frontend.handler.assets.get_matched_alias_by_ext(ext_base);
var file_rpath__$1 = (function (){var G__64546 = file_rpath;
if((!((matched_alias == null)))){
return clojure.string.replace(G__64546,/^[.\\/\\]*assets[\\/\\]+/,"");
} else {
return G__64546;
}
})();
var dir = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(matched_alias);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return repo_dir;
}
})();
return promesa.protocols._mcat(promesa.protocols._promise(null),((function (file_name,vec__64542,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64539,index,file,s__64528__$2,temp__5804__auto__){
return (function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(console.debug("Debug: Writing Asset #",dir,file_rpath__$1)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath__$1], 0))),(function (file_fpath){
return promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["writeFile",repo,file_fpath,content], 0)));
}));
}));
}))),(function (___40947__auto____$1){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [file_rpath__$1,file,logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_rpath__$1], 0)),matched_alias], null));
}));
}));
});})(file_name,vec__64542,file_stem,ext_full,ext_base,filename,file_rpath,matched_alias,file_rpath__$1,dir,vec__64539,index,file,s__64528__$2,temp__5804__auto__))
);
})(),frontend$handler$file_based$editor$iter__64527(cljs.core.rest(s__64528__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,files));
})());
}));

(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$lang$maxFixedArity = 5);

/**
 * Relative path to current file path.
 * 
 * Requires editing state
 */
frontend.handler.file_based.editor.resolve_relative_path = (function frontend$handler$file_based$editor$resolve_relative_path(file_path){
var temp__5802__auto__ = (function (){var or__5002__auto__ = frontend.db.file_based.model.get_block_file_path(frontend.state.get_edit_block());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (cljs.core.truth_(frontend.config.get_pages_directory())?logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_pages_directory(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["_.md"], 0)):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "pages/contents.md";
}
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var current_file_rpath = temp__5802__auto__;
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var current_file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([current_file_rpath], 0));
return logseq.common.path.get_relative_path(current_file_fpath,file_path);
} else {
return file_path;
}
});
/**
 * Paste asset for file graph and insert link to current editing block
 */
frontend.handler.file_based.editor.file_upload_assets_BANG_ = (function frontend$handler$file_based$editor$file_upload_assets_BANG_(repo,id,files,format,uploading_QMARK_,_STAR_asset_uploading_QMARK_,_STAR_asset_uploading_process,drop_or_paste_QMARK_){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$2(repo,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(files)),(function (res){
while(true){
var temp__5804__auto__ = cljs.core.first(res);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__64547 = temp__5804__auto__;
var asset_file_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64547,(0),null);
var file_obj = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64547,(1),null);
var asset_file_fpath = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64547,(2),null);
var matched_alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64547,(3),null);
var image_QMARK_ = frontend.config.ext_of_image_QMARK_(asset_file_name);
frontend.handler.common.editor.insert_command_BANG_(id,frontend.handler.assets.get_asset_file_link(format,(cljs.core.truth_(matched_alias)?[(cljs.core.truth_(image_QMARK_)?"../assets/":""),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(matched_alias)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_file_name)].join(''):frontend.handler.file_based.editor.resolve_relative_path((function (){var or__5002__auto__ = asset_file_fpath;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return asset_file_name;
}
})())),(cljs.core.truth_(file_obj)?file_obj.name:(cljs.core.truth_(image_QMARK_)?"image":"asset")),image_QMARK_),format,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),(cljs.core.truth_(drop_or_paste_QMARK_)?"":frontend.commands.command_trigger),new cljs.core.Keyword(null,"restore?","restore?",1172240305),true,new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"insert-asset","insert-asset",1232083817)], null));

var G__64594 = cljs.core.rest(res);
res = G__64594;
continue;
} else {
return null;
}
break;
}
})),(function (e){
return console.error(e);
})),(function (){
cljs.core.reset_BANG_(uploading_QMARK_,false);

cljs.core.reset_BANG_(_STAR_asset_uploading_QMARK_,false);

return cljs.core.reset_BANG_(_STAR_asset_uploading_process,(0));
}));
});

//# sourceMappingURL=frontend.handler.file_based.editor.js.map
