goog.provide('logseq.db.sqlite.create_graph');
logseq.db.sqlite.create_graph.mark_block_as_built_in = (function logseq$db$sqlite$create_graph$mark_block_as_built_in(block){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true);
});
logseq.db.sqlite.create_graph.schema__GT_qualified_property_keyword = (function logseq$db$sqlite$create_graph$schema__GT_qualified_property_keyword(prop_schema){
return cljs.core.reduce_kv((function (r,k,v){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.simple_keyword_QMARK_(k);
if(and__5000__auto__){
return (logseq.db.frontend.property.schema_properties_map.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.schema_properties_map.cljs$core$IFn$_invoke$arity$1(k) : logseq.db.frontend.property.schema_properties_map.call(null,k));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var new_k = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,new_k,v);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,v);
}
}),cljs.core.PersistentArrayMap.EMPTY,prop_schema);
});
/**
 * Given a new block and its properties, creates a map of properties which have values of property value tx.
 * This map is used for both creating the new property values and then adding them to a block
 */
logseq.db.sqlite.create_graph.__GT_property_value_tx_m = (function logseq$db$sqlite$create_graph$__GT_property_value_tx_m(new_block,properties){
return logseq.db.frontend.property.build.build_property_values_tx_m.cljs$core$IFn$_invoke$arity$variadic(new_block,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__143568){
var vec__143569 = p__143568;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143569,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143569,(1),null);
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"type","type",1174270348)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var built_in_type = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1(built_in_type) : logseq.db.frontend.property.type.value_ref_property_types.call(null,built_in_type));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"closed-values","closed-values",364658811)], null)));
} else {
return and__5000__auto__;
}
})())){
var property_map = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),k,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),built_in_type], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_map,v], null);
} else {
var temp__5804__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("build","properties-ref-types","build/properties-ref-types",-1991321370).cljs$core$IFn$_invoke$arity$1(new_block),built_in_type);
if(cljs.core.truth_(temp__5804__auto____$1)){
var built_in_type_SINGLEQUOTE_ = temp__5804__auto____$1;
var property_map = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),k,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),built_in_type_SINGLEQUOTE_], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_map,v], null);
} else {
return null;
}
}
} else {
return null;
}
}),properties),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pure?","pure?",350862691),true], 0));
});
/**
 * Given a properties map in the format of db-property/built-in-properties, builds their properties tx
 */
logseq.db.sqlite.create_graph.build_properties = (function logseq$db$sqlite$create_graph$build_properties(built_in_properties){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__143576){
var vec__143577 = p__143576;
var db_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143577,(0),null);
var map__143580 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143577,(1),null);
var map__143580__$1 = cljs.core.__destructure_map(map__143580);
var attribute = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143580__$1,new cljs.core.Keyword(null,"attribute","attribute",-2074029119));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143580__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143580__$1,new cljs.core.Keyword(null,"title","title",636505583));
var closed_values = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143580__$1,new cljs.core.Keyword(null,"closed-values","closed-values",364658811));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143580__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var db_ident__$1 = (function (){var or__5002__auto__ = attribute;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return db_ident;
}
})();
var schema_SINGLEQUOTE_ = logseq.db.sqlite.create_graph.schema__GT_qualified_property_keyword(schema);
var vec__143582 = (cljs.core.truth_(closed_values)?logseq.db.frontend.property.build.build_closed_values(db_ident__$1,title,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema_SINGLEQUOTE_,new cljs.core.Keyword(null,"closed-values","closed-values",364658811),closed_values], null),cljs.core.PersistentArrayMap.EMPTY):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident__$1,schema_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),title], null))], null));
var seq__143583 = cljs.core.seq(vec__143582);
var first__143584 = cljs.core.first(seq__143583);
var seq__143583__$1 = cljs.core.next(seq__143583);
var property = first__143584;
var others = seq__143583__$1;
var pvalue_tx_m = logseq.db.sqlite.create_graph.__GT_property_value_tx_m(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("build","properties-ref-types","build/properties-ref-types",-1991321370),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity","entity",-450970276),new cljs.core.Keyword(null,"number","number",1570378438)], null)], null)], 0)),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__143585){
var vec__143586 = p__143585;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143586,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143586,(1),null);
return (((v instanceof cljs.core.Keyword)) && (logseq.db.frontend.malli_schema.internal_ident_QMARK_(v)));
}),properties)));
var tx = (function (){var G__143589 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [property], null);
var G__143589__$1 = ((cljs.core.seq(others))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(G__143589,others):G__143589);
var G__143589__$2 = ((cljs.core.seq(pvalue_tx_m))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(G__143589__$1,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__143573_SHARP_){
if(cljs.core.set_QMARK_(p1__143573_SHARP_)){
return p1__143573_SHARP_;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__143573_SHARP_], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(pvalue_tx_m)], 0))):G__143589__$1);
if(cljs.core.seq(properties)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__143589__$2,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property)], null),properties,logseq.db.frontend.property.build.build_properties_with_ref_values(pvalue_tx_m)], 0)));
} else {
return G__143589__$2;
}
})();
return tx;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([built_in_properties], 0));
});
logseq.db.sqlite.create_graph.build_bootstrap_property = (function logseq$db$sqlite$create_graph$build_bootstrap_property(db_ident){
return logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident,logseq.db.sqlite.create_graph.schema__GT_qualified_property_keyword(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_ident,new cljs.core.Keyword(null,"schema","schema",-1582001791)], null))),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_ident,new cljs.core.Keyword(null,"title","title",636505583)], null))], null));
});
/**
 * Builds initial properties and their closed values and marks them
 *   as built-in?. Returns their tx data as well as data needed for subsequent build steps
 */
logseq.db.sqlite.create_graph.build_initial_properties = (function logseq$db$sqlite$create_graph$build_initial_properties(){
var bootstrap_idents = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),null,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),null,new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null], null), null);
var bootstrap_properties = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.create_graph.build_bootstrap_property,bootstrap_idents);
var bootstrap_properties_tx = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__143595_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,p1__143595_SHARP_,bootstrap_idents);
}),bootstrap_properties),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__143599_SHARP_){
return cljs.core.select_keys(p1__143599_SHARP_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),bootstrap_idents));
}),bootstrap_properties));
var properties_tx = logseq.db.sqlite.create_graph.build_properties(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,logseq.db.frontend.property.built_in_properties,bootstrap_idents));
var mark_block_as_built_in_SINGLEQUOTE_ = (function (b){
return logseq.db.sqlite.create_graph.mark_block_as_built_in(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)], null));
});
var tx = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(bootstrap_properties_tx,properties_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2(mark_block_as_built_in_SINGLEQUOTE_,bootstrap_properties),cljs.core.map.cljs$core$IFn$_invoke$arity$2(mark_block_as_built_in_SINGLEQUOTE_,properties_tx)], 0));
var seq__143603_143713 = cljs.core.seq(tx);
var chunk__143604_143714 = null;
var count__143605_143715 = (0);
var i__143606_143716 = (0);
while(true){
if((i__143606_143716 < count__143605_143715)){
var m_143717 = chunk__143604_143714.cljs$core$IIndexed$_nth$arity$2(null,i__143606_143716);
var temp__5804__auto___143719 = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m_143717);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m_143717);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___143719)){
var block_uuid_143720 = temp__5804__auto___143719;
if(clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid_143720),"00000002")){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(m_143717),"\n","(string/starts-with? (str block-uuid) \"00000002\")"].join('')));
}
} else {
}


var G__143721 = seq__143603_143713;
var G__143722 = chunk__143604_143714;
var G__143723 = count__143605_143715;
var G__143724 = (i__143606_143716 + (1));
seq__143603_143713 = G__143721;
chunk__143604_143714 = G__143722;
count__143605_143715 = G__143723;
i__143606_143716 = G__143724;
continue;
} else {
var temp__5804__auto___143725 = cljs.core.seq(seq__143603_143713);
if(temp__5804__auto___143725){
var seq__143603_143726__$1 = temp__5804__auto___143725;
if(cljs.core.chunked_seq_QMARK_(seq__143603_143726__$1)){
var c__5525__auto___143727 = cljs.core.chunk_first(seq__143603_143726__$1);
var G__143728 = cljs.core.chunk_rest(seq__143603_143726__$1);
var G__143729 = c__5525__auto___143727;
var G__143730 = cljs.core.count(c__5525__auto___143727);
var G__143731 = (0);
seq__143603_143713 = G__143728;
chunk__143604_143714 = G__143729;
count__143605_143715 = G__143730;
i__143606_143716 = G__143731;
continue;
} else {
var m_143732 = cljs.core.first(seq__143603_143726__$1);
var temp__5804__auto___143733__$1 = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m_143732);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m_143732);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___143733__$1)){
var block_uuid_143734 = temp__5804__auto___143733__$1;
if(clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid_143734),"00000002")){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(m_143732),"\n","(string/starts-with? (str block-uuid) \"00000002\")"].join('')));
}
} else {
}


var G__143735 = cljs.core.next(seq__143603_143726__$1);
var G__143736 = null;
var G__143737 = (0);
var G__143738 = (0);
seq__143603_143713 = G__143735;
chunk__143604_143714 = G__143736;
count__143605_143715 = G__143737;
i__143606_143716 = G__143738;
continue;
}
} else {
}
}
break;
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx","tx",466630418),tx,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.property_QMARK_,properties_tx)], null);
});
logseq.db.sqlite.create_graph.built_in_pages_names = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Contents",null], null), null);
logseq.db.sqlite.create_graph.validate_tx_for_duplicate_idents = (function logseq$db$sqlite$create_graph$validate_tx_for_duplicate_idents(tx){
var temp__5804__auto__ = cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__143623){
var vec__143624 = p__143623;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143624,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143624,(1),null);
if((v > (1))){
return k;
} else {
return null;
}
}),cljs.core.frequencies(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),tx))));
if(temp__5804__auto__){
var conflicting_idents = temp__5804__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The following :db/idents are not unique and clobbered each other: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.vec(conflicting_idents))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"idents","idents",198394065),conflicting_idents], null));
} else {
return null;
}
});
logseq.db.sqlite.create_graph.build_initial_classes_STAR_ = (function logseq$db$sqlite$create_graph$build_initial_classes_STAR_(built_in_classes,db_ident__GT_properties){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__143635){
var vec__143636 = p__143635;
var db_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143636,(0),null);
var map__143639 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143636,(1),null);
var map__143639__$1 = cljs.core.__destructure_map(map__143639);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143639__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143639__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143639__$1,new cljs.core.Keyword(null,"title","title",636505583));
var title_SINGLEQUOTE_ = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(db_ident);
}
})();
return logseq.db.sqlite.create_graph.mark_block_as_built_in(logseq.db.sqlite.util.build_new_class((function (){var class_properties = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (db_ident__$1){
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(db_ident__GT_properties,db_ident__$1);
if(cljs.core.truth_(property)){
} else {
throw (new Error(["Assert failed: ",["Built-in property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(db_ident__$1)," is not defined yet"].join(''),"\n","property"].join('')));
}

return db_ident__$1;
}),new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(schema));
var G__143644 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","title","block/title",710445684),title_SINGLEQUOTE_,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(title_SINGLEQUOTE_),new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),db_ident)], null);
var G__143644__$1 = ((cljs.core.seq(class_properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143644,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),class_properties):G__143644);
if(cljs.core.seq(properties)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__143644__$1,properties], 0));
} else {
return G__143644__$1;
}
})()));
}),built_in_classes);
});
logseq.db.sqlite.create_graph.build_initial_classes = (function logseq$db$sqlite$create_graph$build_initial_classes(db_ident__GT_properties){
return logseq.db.sqlite.create_graph.build_initial_classes_STAR_(logseq.db.frontend.class$.built_in_classes,db_ident__GT_properties);
});
/**
 * Builds initial blocks used for storing views
 */
logseq.db.sqlite.create_graph.build_initial_views = (function logseq$db$sqlite$create_graph$build_initial_views(){
var page_id = logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),logseq.common.config.views_page_name);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__143646 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_id,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.config.views_page_name,new cljs.core.Keyword("block","title","block/title",710445684),logseq.common.config.views_page_name,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null),new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),true,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true], null);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__143646) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__143646));
})()], null);
});
logseq.db.sqlite.create_graph.build_favorites_page = (function logseq$db$sqlite$create_graph$build_favorites_page(){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__143647 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),logseq.common.config.favorites_page_name),new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.config.favorites_page_name,new cljs.core.Keyword("block","title","block/title",710445684),logseq.common.config.favorites_page_name,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null),new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),true,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true], null);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__143647) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__143647));
})()], null);
});
logseq.db.sqlite.create_graph.build_initial_files = (function logseq$db$sqlite$create_graph$build_initial_files(config_content){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),"logseq/config.edn"),new cljs.core.Keyword("file","path","file/path",-191335748),["logseq/","config.edn"].join(''),new cljs.core.Keyword("file","content","file/content",12680964),config_content,new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(new Date()),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),"logseq/custom.css"),new cljs.core.Keyword("file","path","file/path",-191335748),["logseq/","custom.css"].join(''),new cljs.core.Keyword("file","content","file/content",12680964),"",new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(new Date()),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),"logseq/custom.js"),new cljs.core.Keyword("file","path","file/path",-191335748),["logseq/","custom.js"].join(''),new cljs.core.Keyword("file","content","file/content",12680964),"",new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(new Date()),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null)], null);
});
/**
 * Builds tx of initial data for a new graph including key values, initial files,
 * built-in properties and built-in classes
 */
logseq.db.sqlite.create_graph.build_db_initial_data = (function logseq$db$sqlite$create_graph$build_db_initial_data(var_args){
var args__5732__auto__ = [];
var len__5726__auto___143741 = arguments.length;
var i__5727__auto___143742 = (0);
while(true){
if((i__5727__auto___143742 < len__5726__auto___143741)){
args__5732__auto__.push((arguments[i__5727__auto___143742]));

var G__143743 = (i__5727__auto___143742 + (1));
i__5727__auto___143742 = G__143743;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.db.sqlite.create_graph.build_db_initial_data.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.db.sqlite.create_graph.build_db_initial_data.cljs$core$IFn$_invoke$arity$variadic = (function (config_content,p__143665){
var map__143666 = p__143665;
var map__143666__$1 = cljs.core.__destructure_map(map__143666);
var import_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143666__$1,new cljs.core.Keyword(null,"import-type","import-type",-499283032));
var graph_git_sha = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143666__$1,new cljs.core.Keyword(null,"graph-git-sha","graph-git-sha",-266655130));
if(typeof config_content === 'string'){
} else {
throw (new Error("Assert failed: (string? config-content)"));
}

var initial_data = (function (){var G__143668 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),"db"),logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676),logseq.db.frontend.schema.version),logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","graph-initial-schema-version","logseq.kv/graph-initial-schema-version",91284097),logseq.db.frontend.schema.version),logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","graph-created-at","logseq.kv/graph-created-at",1108266678),logseq.common.util.time_ms()),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))], null)], null);
var G__143668__$1 = (cljs.core.truth_(import_type)?cljs.core.into.cljs$core$IFn$_invoke$arity$2(G__143668,logseq.db.sqlite.util.import_tx(import_type)):G__143668);
if(cljs.core.truth_(graph_git_sha)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__143668__$1,logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","graph-git-sha","logseq.kv/graph-git-sha",-1509491768),graph_git_sha));
} else {
return G__143668__$1;
}
})();
var initial_files = logseq.db.sqlite.create_graph.build_initial_files(config_content);
var map__143667 = logseq.db.sqlite.create_graph.build_initial_properties();
var map__143667__$1 = cljs.core.__destructure_map(map__143667);
var properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143667__$1,new cljs.core.Keyword(null,"tx","tx",466630418));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143667__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var db_ident__GT_properties = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),properties),properties);
var default_classes = logseq.db.sqlite.create_graph.build_initial_classes(db_ident__GT_properties);
var default_pages = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.create_graph.mark_block_as_built_in,cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.util.build_new_page,logseq.db.sqlite.create_graph.built_in_pages_names));
var hidden_pages = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.create_graph.build_initial_views(),logseq.db.sqlite.create_graph.build_favorites_page());
var bootstrap_class_QMARK_ = (function (c){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),null,new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),null,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null,new cljs.core.Keyword("logseq.class","Template","logseq.class/Template",1720854846),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(c));
});
var bootstrap_classes = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(bootstrap_class_QMARK_,default_classes);
var bootstrap_class_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__143651_SHARP_){
return cljs.core.select_keys(p1__143651_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}),bootstrap_classes);
var classes_tx = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__143652_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__143652_SHARP_,new cljs.core.Keyword("db","ident","db/ident",-737096));
}),bootstrap_classes),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(bootstrap_class_QMARK_,default_classes));
var tx = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(bootstrap_class_ids,initial_data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_tx,classes_tx,initial_files,default_pages,hidden_pages], 0)));
logseq.db.sqlite.create_graph.validate_tx_for_duplicate_idents(tx);

return tx;
}));

(logseq.db.sqlite.create_graph.build_db_initial_data.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.db.sqlite.create_graph.build_db_initial_data.cljs$lang$applyTo = (function (seq143654){
var G__143655 = cljs.core.first(seq143654);
var seq143654__$1 = cljs.core.next(seq143654);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__143655,seq143654__$1);
}));


//# sourceMappingURL=logseq.db.sqlite.create_graph.js.map
