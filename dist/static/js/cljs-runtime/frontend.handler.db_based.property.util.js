goog.provide('frontend.handler.db_based.property.util');
/**
 * Get a property's name given its id
 */
frontend.handler.db_based.property.util.get_property_value = (function frontend$handler$db_based$property$util$get_property_value(e){
var temp__5802__auto__ = ((typeof e === 'number')?frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(e):e);
if(cljs.core.truth_(temp__5802__auto__)){
var e__$1 = temp__5802__auto__;
return logseq.db.frontend.property.property_value_content(e__$1);
} else {
return e;
}
});
/**
 * Given a DB graph's properties, returns a readable properties map with keys as
 *   property names and property values dereferenced where possible. Has some
 *   overlap with block-macros/properties-by-name
 */
frontend.handler.db_based.property.util.readable_properties = (function frontend$handler$db_based$property$util$readable_properties(var_args){
var G__100997 = arguments.length;
switch (G__100997) {
case 1:
return frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$1 = (function (properties){
return frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"original-key?","original-key?",-219511082),true], null));
}));

(frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$2 = (function (properties,p__101002){
var map__101003 = p__101002;
var map__101003__$1 = cljs.core.__destructure_map(map__101003);
var original_key_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101003__$1,new cljs.core.Keyword(null,"original-key?","original-key?",-219511082));
var key_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__101003__$1,new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),cljs.core.identity);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__101012){
var vec__101013 = p__101012;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101013,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101013,(1),null);
var prop_ent = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(k);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__101024 = (cljs.core.truth_(original_key_QMARK_)?k:cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(prop_ent)));
return (key_fn.cljs$core$IFn$_invoke$arity$1 ? key_fn.cljs$core$IFn$_invoke$arity$1(G__101024) : key_fn.call(null,G__101024));
})(),((cljs.core.set_QMARK_(v))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,v)):((cljs.core.sequential_QMARK_(v))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__100995_SHARP_){
return frontend.handler.db_based.property.util.get_property_value((function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__100995_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return p1__100995_SHARP_;
}
})());
}),v):(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v))?frontend.handler.db_based.property.util.get_property_value((function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v;
}
})()):v
)))], null);
}),properties));
}));

(frontend.handler.db_based.property.util.readable_properties.cljs$lang$maxFixedArity = 2);

frontend.handler.db_based.property.util.get_closed_property_values = (function frontend$handler$db_based$property$util$get_closed_property_values(property_id){
var repo = frontend.state.get_current_repo();
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return logseq.db.frontend.property.get_closed_property_values(db,property_id);
});

//# sourceMappingURL=frontend.handler.db_based.property.util.js.map
