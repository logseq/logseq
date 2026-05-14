goog.provide('logseq.db.frontend.db');
/**
 * Whether property a built-in property for the specific class
 */
logseq.db.frontend.db.built_in_class_property_QMARK_ = (function logseq$db$frontend$db$built_in_class_property_QMARK_(class_entity,property_entity){
var and__5000__auto__ = logseq.db.frontend.entity_util.built_in_QMARK_(class_entity);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = logseq.db.frontend.entity_util.class_QMARK_(class_entity);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = logseq.db.frontend.entity_util.built_in_QMARK_(property_entity);
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((function (){var G__60091 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class_entity);
return (logseq.db.frontend.class$.built_in_classes.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.class$.built_in_classes.cljs$core$IFn$_invoke$arity$1(G__60091) : logseq.db.frontend.class$.built_in_classes.call(null,G__60091));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"properties","properties",685819552)], null))),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property_entity));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
/**
 * Private built-in pages should not be navigable or searchable by users. Later it
 * could be useful to use this for the All Pages view
 */
logseq.db.frontend.db.private_built_in_page_QMARK_ = (function logseq$db$frontend$db$private_built_in_page_QMARK_(page){
if(cljs.core.truth_(logseq.db.frontend.entity_util.property_QMARK_(page))){
return cljs.core.not(logseq.db.frontend.property.public_built_in_property_QMARK_(page));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = logseq.db.frontend.entity_util.class_QMARK_(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.entity_util.internal_page_QMARK_(page);
}
})())){
return false;
} else {
return true;

}
}
});
/**
 * Builds tx for a favorite block in favorite page
 */
logseq.db.frontend.db.build_favorite_tx = (function logseq$db$frontend$db$build_favorite_tx(favorite_uuid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),favorite_uuid], null),new cljs.core.Keyword("block","title","block/title",710445684),""], null);
});
logseq.db.frontend.db.get_all_properties = (function logseq$db$frontend$db$get_all_properties(db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var G__60101 = db;
var G__60102 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__60101,G__60102) : datascript.core.entity.call(null,G__60101,G__60102));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)));
});
logseq.db.frontend.db.get_page_parents = (function logseq$db$frontend$db$get_page_parents(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60238 = arguments.length;
var i__5727__auto___60239 = (0);
while(true){
if((i__5727__auto___60239 < len__5726__auto___60238)){
args__5732__auto__.push((arguments[i__5727__auto___60239]));

var G__60240 = (i__5727__auto___60239 + (1));
i__5727__auto___60239 = G__60240;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.db.frontend.db.get_page_parents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.db.frontend.db.get_page_parents.cljs$core$IFn$_invoke$arity$variadic = (function (node,p__60114){
var map__60116 = p__60114;
var map__60116__$1 = cljs.core.__destructure_map(map__60116);
var node_class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60116__$1,new cljs.core.Keyword(null,"node-class?","node-class?",-430242441));
var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(node);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var current_parent = parent;
var parents_SINGLEQUOTE_ = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = current_parent;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (cljs.core.truth_(node_class_QMARK_)?logseq.db.frontend.entity_util.class_QMARK_(current_parent):true);
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(cljs.core.contains_QMARK_(parents_SINGLEQUOTE_,current_parent)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var G__60245 = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(current_parent);
var G__60246 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents_SINGLEQUOTE_,current_parent);
current_parent = G__60245;
parents_SINGLEQUOTE_ = G__60246;
continue;
} else {
return cljs.core.vec(cljs.core.reverse(parents_SINGLEQUOTE_));
}
break;
}
} else {
return null;
}
}));

(logseq.db.frontend.db.get_page_parents.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.db.frontend.db.get_page_parents.cljs$lang$applyTo = (function (seq60111){
var G__60112 = cljs.core.first(seq60111);
var seq60111__$1 = cljs.core.next(seq60111);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60112,seq60111__$1);
}));

logseq.db.frontend.db.get_title_with_parents = (function logseq$db$frontend$db$get_title_with_parents(entity){
if(cljs.core.truth_((function (){var or__5002__auto__ = logseq.db.frontend.entity_util.class_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.entity_util.internal_page_QMARK_(entity);
}
})())){
var parents_SINGLEQUOTE_ = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e));
}),logseq.db.frontend.db.get_page_parents(entity)));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(logseq.common.util.namespace.parent_char,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(parents_SINGLEQUOTE_),entity)));
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity);
}
});
logseq.db.frontend.db.get_classes_parents = (function logseq$db$frontend$db$get_classes_parents(tags){
var tags_SINGLEQUOTE_ = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.class_QMARK_,tags);
var result = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__60144_SHARP_){
return logseq.db.frontend.db.get_page_parents.cljs$core$IFn$_invoke$arity$variadic(p1__60144_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node-class?","node-class?",-430242441),true], null)], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tags_SINGLEQUOTE_], 0));
return cljs.core.set(result);
});
/**
 * Whether `object` is an instance of `class`
 */
logseq.db.frontend.db.class_instance_QMARK_ = (function logseq$db$frontend$db$class_instance_QMARK_(class$,object){
var tags = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(object);
var tags_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),tags));
var or__5002__auto__ = cljs.core.contains_QMARK_(tags_ids,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var class_parent_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),logseq.db.frontend.db.get_classes_parents(tags)));
return cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(class_parent_ids,tags_ids),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$));
}
});
logseq.db.frontend.db.inline_tag_QMARK_ = (function logseq$db$frontend$db$inline_tag_QMARK_(block_raw_title,tag){
if(typeof block_raw_title === 'string'){
} else {
throw (new Error(["Assert failed: ","block-raw-title should be a string","\n","(string? block-raw-title)"].join('')));
}

return clojure.string.includes_QMARK_(block_raw_title,["#",logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(tag))].join(''));
});
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.frontend !== 'undefined') && (typeof logseq.db.frontend.db !== 'undefined') && (typeof logseq.db.frontend.db.node_display_type_classes !== 'undefined')){
} else {
logseq.db.frontend.db.node_display_type_classes = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("logseq.class","Quote-block","logseq.class/Quote-block",-1176166617),null,new cljs.core.Keyword("logseq.class","Math-block","logseq.class/Math-block",-2038963121),null,new cljs.core.Keyword("logseq.class","Code-block","logseq.class/Code-block",1454986641),null], null), null);
}
logseq.db.frontend.db.get_class_ident_by_display_type = (function logseq$db$frontend$db$get_class_ident_by_display_type(display_type){
var G__60198 = display_type;
var G__60198__$1 = (((G__60198 instanceof cljs.core.Keyword))?G__60198.fqn:null);
switch (G__60198__$1) {
case "code":
return new cljs.core.Keyword("logseq.class","Code-block","logseq.class/Code-block",1454986641);

break;
case "math":
return new cljs.core.Keyword("logseq.class","Math-block","logseq.class/Math-block",-2038963121);

break;
case "quote":
return new cljs.core.Keyword("logseq.class","Quote-block","logseq.class/Quote-block",-1176166617);

break;
default:
return null;

}
});
logseq.db.frontend.db.get_display_type_by_class_ident = (function logseq$db$frontend$db$get_display_type_by_class_ident(class_ident){
var G__60206 = class_ident;
var G__60206__$1 = (((G__60206 instanceof cljs.core.Keyword))?G__60206.fqn:null);
switch (G__60206__$1) {
case "logseq.class/Code-block":
return new cljs.core.Keyword(null,"code","code",1586293142);

break;
case "logseq.class/Math-block":
return new cljs.core.Keyword(null,"math","math",-2026912803);

break;
case "logseq.class/Quote-block":
return new cljs.core.Keyword(null,"quote","quote",-262615245);

break;
default:
return null;

}
});

//# sourceMappingURL=logseq.db.frontend.db.js.map
