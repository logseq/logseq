goog.provide('frontend.mobile.haptics');
var module$node_modules$$capacitor$haptics$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$haptics$dist$plugin_cjs", {});
frontend.mobile.haptics.haptics = (function frontend$mobile$haptics$haptics(var_args){
var G__60643 = arguments.length;
switch (G__60643) {
case 0:
return frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"light","light",1918998747));
}));

(frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$1 = (function (impact_style){
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
var style = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(impact_style,new cljs.core.Keyword(null,"light","light",1918998747)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$haptics$dist$plugin_cjs.ImpactStyle.Light], null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(impact_style,new cljs.core.Keyword(null,"medium","medium",-1864319384)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$haptics$dist$plugin_cjs.ImpactStyle.Medium], null):null));
return module$node_modules$$capacitor$haptics$dist$plugin_cjs.Haptics.impact(cljs.core.clj__GT_js(style));
} else {
return null;
}
}));

(frontend.mobile.haptics.haptics.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=frontend.mobile.haptics.js.map
