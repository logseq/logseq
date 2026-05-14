goog.provide('frontend.spec');
cljs.spec.alpha.check_asserts(true);
(cljs.spec.alpha._STAR_explain_out_STAR_ = expound.alpha.printer);
/**
 * This function won't crash the current thread, just log error.
 */
frontend.spec.validate = (function frontend$spec$validate(spec,value){
if(cljs.core.truth_(frontend.config.dev_QMARK_)){
if(cljs.core.truth_(cljs.spec.alpha.explain_data(spec,value))){
var error_message = expound.alpha.expound_str.cljs$core$IFn$_invoke$arity$2(spec,value);
var ex = cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Error in validate",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),value], null));
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.spec",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"exception","exception",-335277064),ex,new cljs.core.Keyword("spec","validate-failed","spec/validate-failed",867846215),error_message,new cljs.core.Keyword(null,"line","line",212345235),22], null)),ex);

return false;
} else {
return true;
}
} else {
return null;
}
});
cljs.spec.alpha.def_impl(new cljs.core.Keyword("repos","url","repos/url",454158615),new cljs.core.Symbol("cljs.core","string?","cljs.core/string?",-2072921719,null),cljs.core.string_QMARK_);

//# sourceMappingURL=frontend.spec.js.map
