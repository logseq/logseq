goog.provide('logseq.db.frontend.entity_util');
logseq.db.frontend.entity_util.has_tag_QMARK_ = (function logseq$db$frontend$entity_util$has_tag_QMARK_(entity,tag_ident){
if(((cljs.core.map_QMARK_(entity)) || (datascript.impl.entity.entity_QMARK_(entity)))){
return cljs.core.some((function (t){
return ((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(t),tag_ident)) || (cljs.core.keyword_identical_QMARK_(t,tag_ident)));
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity));
} else {
return null;
}
});
logseq.db.frontend.entity_util.internal_page_QMARK_ = (function logseq$db$frontend$entity_util$internal_page_QMARK_(entity){
return logseq.db.frontend.entity_util.has_tag_QMARK_(entity,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329));
});
logseq.db.frontend.entity_util.class_QMARK_ = (function logseq$db$frontend$entity_util$class_QMARK_(entity){
return logseq.db.frontend.entity_util.has_tag_QMARK_(entity,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083));
});
logseq.db.frontend.entity_util.property_QMARK_ = (function logseq$db$frontend$entity_util$property_QMARK_(entity){
return logseq.db.frontend.entity_util.has_tag_QMARK_(entity,new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048));
});
/**
 * Given a page entity or map, check if it is a whiteboard page
 */
logseq.db.frontend.entity_util.whiteboard_QMARK_ = (function logseq$db$frontend$entity_util$whiteboard_QMARK_(entity){
return logseq.db.frontend.entity_util.has_tag_QMARK_(entity,new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452));
});
logseq.db.frontend.entity_util.closed_value_QMARK_ = (function logseq$db$frontend$entity_util$closed_value_QMARK_(entity){
return (!((new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(entity) == null)));
});
/**
 * Given a page entity or map, check if it is a journal page
 */
logseq.db.frontend.entity_util.journal_QMARK_ = (function logseq$db$frontend$entity_util$journal_QMARK_(entity){
return logseq.db.frontend.entity_util.has_tag_QMARK_(entity,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081));
});
logseq.db.frontend.entity_util.page_QMARK_ = (function logseq$db$frontend$entity_util$page_QMARK_(entity){
var or__5002__auto__ = logseq.db.frontend.entity_util.internal_page_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = logseq.db.frontend.entity_util.class_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = logseq.db.frontend.entity_util.property_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = logseq.db.frontend.entity_util.whiteboard_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return logseq.db.frontend.entity_util.journal_QMARK_(entity);
}
}
}
}
});
/**
 * Given an entity or map, check if it is an asset block
 */
logseq.db.frontend.entity_util.asset_QMARK_ = (function logseq$db$frontend$entity_util$asset_QMARK_(entity){
return (!((new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(entity) == null)));
});
logseq.db.frontend.entity_util.hidden_QMARK_ = (function logseq$db$frontend$entity_util$hidden_QMARK_(page){
return cljs.core.boolean$((cljs.core.truth_(page)?((typeof page === 'string')?clojure.string.starts_with_QMARK_(page,"$$$"):((((cljs.core.map_QMARK_(page)) || (datascript.impl.entity.entity_QMARK_(page))))?new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(page):null)):null));
});
logseq.db.frontend.entity_util.object_QMARK_ = (function logseq$db$frontend$entity_util$object_QMARK_(node){
return cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(node));
});
/**
 * Get entity types from :block/tags
 */
logseq.db.frontend.entity_util.get_entity_types = (function logseq$db$frontend$entity_util$get_entity_types(entity){
var ident__GT_type = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),new cljs.core.Keyword(null,"journal","journal",1585898830),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),new cljs.core.Keyword(null,"whiteboard","whiteboard",-1766646928),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),new cljs.core.Keyword(null,"page","page",849072397)], null);
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58349_SHARP_){
var G__58353 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__58349_SHARP_);
return (ident__GT_type.cljs$core$IFn$_invoke$arity$1 ? ident__GT_type.cljs$core$IFn$_invoke$arity$1(G__58353) : ident__GT_type.call(null,G__58353));
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity)));
});
/**
 * Built-in page or block
 */
logseq.db.frontend.entity_util.built_in_QMARK_ = (function logseq$db$frontend$entity_util$built_in_QMARK_(entity){
return new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(entity);
});

//# sourceMappingURL=logseq.db.frontend.entity_util.js.map
