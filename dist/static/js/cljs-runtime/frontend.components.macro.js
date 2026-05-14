goog.provide('frontend.components.macro');
/**
 * Register extended macros here.
 */
frontend.components.macro.macros = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
/**
 * (FN config options) return Hiccup
 */
frontend.components.macro.register = (function frontend$components$macro$register(macro_name,fn){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.macro.macros,cljs.core.assoc,macro_name,fn);
});

//# sourceMappingURL=frontend.components.macro.js.map
