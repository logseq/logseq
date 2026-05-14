goog.provide('frontend.modules.instrumentation.core');
frontend.modules.instrumentation.core.init = (function frontend$modules$instrumentation$core$init(){
if(cljs.core.truth_(new cljs.core.Keyword("instrument","disabled?","instrument/disabled?",165654178).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
frontend.modules.instrumentation.posthog.init();

return frontend.modules.instrumentation.sentry.init();
}
});
frontend.modules.instrumentation.core.disable_instrument = (function frontend$modules$instrumentation$core$disable_instrument(disable_QMARK_){
frontend.state.set_state_BANG_(new cljs.core.Keyword("instrument","disabled?","instrument/disabled?",165654178),disable_QMARK_);

frontend.storage.set("instrument-disabled",disable_QMARK_);

frontend.modules.instrumentation.posthog.opt_out(disable_QMARK_);

if(cljs.core.truth_(disable_QMARK_)){
return null;
} else {
return frontend.modules.instrumentation.sentry.init();
}
});

//# sourceMappingURL=frontend.modules.instrumentation.core.js.map
