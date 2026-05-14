goog.provide('frontend.flows');
frontend.flows._STAR_current_repo = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.flows.current_login_user_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword(null,"logout","logout",1418564329)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"email","email",1415816706),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sub","sub",-2093760025),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904),new cljs.core.Keyword(null,"string","string",-1989541586)], null)], null)], null);
frontend.flows.current_login_user_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(frontend.flows.current_login_user_schema);
frontend.flows._STAR_current_login_user = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),frontend.flows.current_login_user_validator], 0));
frontend.flows._STAR_network_online_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
/**
 * Like get-current-repo.
 */
frontend.flows.current_repo_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),missionary.core.watch(frontend.flows._STAR_current_repo));
frontend.flows.current_login_user_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),missionary.core.watch(frontend.flows._STAR_current_login_user));
frontend.flows.document_visibility_state_flow = missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),missionary.core.observe((function frontend$flows$ctor(emit_BANG_){
var callback_fn = (function (){
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(document.visibilityState) : emit_BANG_.call(null,document.visibilityState));
});
document.addEventListener("visibilitychange",callback_fn);

callback_fn();

return (function frontend$flows$ctor_$_dtor(){
return document.removeEventListener("visibilitychange",callback_fn);
});
}))));
frontend.flows.network_online_event_flow = (cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"connected","connected",-169833045)),frontend.mobile.flows.mobile_network_status_flow):missionary.core.watch(frontend.flows._STAR_network_online_QMARK_));

//# sourceMappingURL=frontend.flows.js.map
