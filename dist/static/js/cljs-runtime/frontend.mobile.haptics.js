goog.provide('frontend.mobile.haptics');
var module$node_modules$$capacitor$haptics$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$haptics$dist$plugin_cjs", {});
frontend.mobile.haptics.with_haptics_impact = (function frontend$mobile$haptics$with_haptics_impact(fn,impact_style){
var style = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(impact_style,new cljs.core.Keyword(null,"light","light",1918998747)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$haptics$dist$plugin_cjs.ImpactStyle.Light], null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(impact_style,new cljs.core.Keyword(null,"medium","medium",-1864319384)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$haptics$dist$plugin_cjs.ImpactStyle.Medium], null):null));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___61688__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$haptics$dist$plugin_cjs.Haptics.impact(cljs.core.clj__GT_js(style))),(function (___61678__auto__){
return promesa.protocols._promise(fn);
}));
}));
});

//# sourceMappingURL=frontend.mobile.haptics.js.map
