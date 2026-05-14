goog.provide('frontend.handler.test');
frontend.handler.test.clear_whiteboard_storage_for_e2e_tests = (function frontend$handler$test$clear_whiteboard_storage_for_e2e_tests(){
frontend.storage.set(new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248),false);

frontend.storage.set(new cljs.core.Keyword("whiteboard","onboarding-tour?","whiteboard/onboarding-tour?",2082551629),false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248),false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","onboarding-tour?","whiteboard/onboarding-tour?",2082551629),false);

return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248),new cljs.core.Keyword("whiteboard","onboarding-whiteboard?","whiteboard/onboarding-whiteboard?",-1925305248).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0));
});
frontend.handler.test.setup_test_BANG_ = (function frontend$handler$test$setup_test_BANG_(){
return (window.clearWhiteboardStorage = frontend.handler.test.clear_whiteboard_storage_for_e2e_tests);
});

//# sourceMappingURL=frontend.handler.test.js.map
