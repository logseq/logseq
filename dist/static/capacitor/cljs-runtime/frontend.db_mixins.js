goog.provide('frontend.db_mixins');
frontend.db_mixins.query = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function frontend$db_mixins$query_mixin_init(state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"reactive-queries","reactive-queries",1681514457),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY));
}),new cljs.core.Keyword(null,"wrap-render","wrap-render",1782000986),(function frontend$db_mixins$query_mixin_wrap_render(render_fn){
return (function (state){
var _STAR_query_component_STAR__orig_val__64719 = frontend.db.react._STAR_query_component_STAR_;
var _STAR_reactive_queries_STAR__orig_val__64720 = frontend.db.react._STAR_reactive_queries_STAR_;
var _STAR_query_component_STAR__temp_val__64721 = new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_reactive_queries_STAR__temp_val__64722 = new cljs.core.Keyword(null,"reactive-queries","reactive-queries",1681514457).cljs$core$IFn$_invoke$arity$1(state);
(frontend.db.react._STAR_query_component_STAR_ = _STAR_query_component_STAR__temp_val__64721);

(frontend.db.react._STAR_reactive_queries_STAR_ = _STAR_reactive_queries_STAR__temp_val__64722);

try{return (render_fn.cljs$core$IFn$_invoke$arity$1 ? render_fn.cljs$core$IFn$_invoke$arity$1(state) : render_fn.call(null,state));
}finally {(frontend.db.react._STAR_reactive_queries_STAR_ = _STAR_reactive_queries_STAR__orig_val__64720);

(frontend.db.react._STAR_query_component_STAR_ = _STAR_query_component_STAR__orig_val__64719);
}});
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function frontend$db_mixins$query_mixin_will_unmount(state){
frontend.db.react.remove_query_component_BANG_(new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state));

return state;
})], null);

//# sourceMappingURL=frontend.db_mixins.js.map
