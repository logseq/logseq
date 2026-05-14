goog.provide('frontend.mobile.flows');
var module$node_modules$$capacitor$network$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$network$dist$plugin_cjs", {});
frontend.mobile.flows._STAR_mobile_network_status = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.mobile.flows._STAR_mobile_app_state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.mobile.flows.mobile_network_init_status_flow = missionary.core.observe((function frontend$mobile$flows$ctor(emit_BANG_){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$network$dist$plugin_cjs.Network.getStatus()),(function (init_network_status){
return promesa.protocols._promise((emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(init_network_status) : emit_BANG_.call(null,init_network_status)));
}));
}));

return (function frontend$mobile$flows$ctor_$_dtor(){
return null;
});
}));
frontend.mobile.flows.mobile_network_status_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__73127_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__73127_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.mobile.flows.mobile_network_init_status_flow,missionary.core.watch(frontend.mobile.flows._STAR_mobile_network_status)], 0)));
frontend.mobile.flows.mobile_app_state_flow = missionary.core.watch(frontend.mobile.flows._STAR_mobile_app_state);

//# sourceMappingURL=frontend.mobile.flows.js.map
