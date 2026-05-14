goog.provide('frontend.mobile.footer');
frontend.mobile.footer.mobile_bar_command = rum.core.lazy_build(rum.core.build_defc,(function (command_handler,icon){
return daiquiri.core.create_element("button",{'onPointerDown':(function (e){
frontend.util.stop(e);

return (command_handler.cljs$core$IFn$_invoke$arity$0 ? command_handler.cljs$core$IFn$_invoke$arity$0() : command_handler.call(null));
}),'className':"bottom-action"},[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(icon,"player-stop"))?daiquiri.interpreter.interpret(frontend.components.svg.circle_stop):daiquiri.interpreter.interpret(frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null))))]);
}),null,"frontend.mobile.footer/mobile-bar-command");
frontend.mobile.footer.seconds__GT_minutes_COLON_seconds = (function frontend$mobile$footer$seconds__GT_minutes_COLON_seconds(seconds){
var minutes = cljs.core.quot(seconds,(60));
var seconds__$1 = cljs.core.mod(seconds,(60));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("%02d:%02d",minutes,seconds__$1) : frontend.util.format.call(null,"%02d:%02d",minutes,seconds__$1));
});
frontend.mobile.footer._STAR_record_start = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.mobile.footer.audio_record_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557)),"NONE")){
return frontend.mobile.footer.mobile_bar_command((function (){
frontend.mobile.record.start_recording();

return cljs.core.reset_BANG_(frontend.mobile.footer._STAR_record_start,Date.now());
}),"microphone");
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-row items-center"},[frontend.mobile.footer.mobile_bar_command((function (){
cljs.core.reset_BANG_(frontend.mobile.footer._STAR_record_start,null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785),false);

return frontend.mobile.record.stop_recording();
}),"player-stop"),daiquiri.core.create_element("div",{'onClick':frontend.mobile.record.stop_recording,'className':"timer ml-2"},[daiquiri.interpreter.interpret(frontend.mobile.footer.seconds__GT_minutes_COLON_seconds(((Date.now() - cljs.core.deref(frontend.mobile.footer._STAR_record_start)) / (1000))))])]);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var comp = new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state);
var callback = (function (){
return rum.core.request_render(comp);
});
var interval = setInterval(callback,(1000));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.mobile.footer","interval","frontend.mobile.footer/interval",-960322604),interval);
}),new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
clearInterval(new cljs.core.Keyword("frontend.mobile.footer","interval","frontend.mobile.footer/interval",-960322604).cljs$core$IFn$_invoke$arity$1(state));

return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.mobile.footer","interval","frontend.mobile.footer/interval",-960322604));
})], null)], null),"frontend.mobile.footer/audio-record-cp");
frontend.mobile.footer.footer = rum.core.lazy_build(rum.core.build_defc,(function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__130708 = frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"route-match","route-match",-1450985937),new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var fexpr__130707 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"home","home",-74557309),null,new cljs.core.Keyword(null,"page","page",849072397),null], null), null);
return (fexpr__130707.cljs$core$IFn$_invoke$arity$1 ? fexpr__130707.cljs$core$IFn$_invoke$arity$1(G__130708) : fexpr__130707.call(null,G__130708));
})();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not(frontend.state.editing_QMARK_());
if(and__5000__auto____$1){
var and__5000__auto____$2 = frontend.state.sub(new cljs.core.Keyword("mobile","show-tabbar?","mobile/show-tabbar?",925227298));
if(cljs.core.truth_(and__5000__auto____$2)){
return frontend.state.get_current_repo();
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return daiquiri.core.create_element("div",{'className':"cp__footer w-full bottom-0 justify-between"},[frontend.mobile.footer.audio_record_cp(),frontend.mobile.footer.mobile_bar_command((function (){
if(cljs.core.truth_(frontend.mobile.util.native_ipad_QMARK_())){
} else {
frontend.state.set_left_sidebar_open_BANG_(false);
}

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","search","go/search",1564957958)], null));
}),"search"),frontend.mobile.footer.mobile_bar_command(frontend.state.toggle_document_mode_BANG_,"notes"),frontend.mobile.footer.mobile_bar_command((function (){
var page = (function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
}
})();
return frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null));
}),"edit")]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.mobile.footer/footer");

//# sourceMappingURL=frontend.mobile.footer.js.map
