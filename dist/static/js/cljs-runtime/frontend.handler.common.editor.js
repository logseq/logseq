goog.provide('frontend.handler.common.editor');
frontend.handler.common.editor.insert_command_BANG_ = (function frontend$handler$common$editor$insert_command_BANG_(id,command_output,format,p__54110){
var map__54114 = p__54110;
var map__54114__$1 = cljs.core.__destructure_map(map__54114);
var option = map__54114__$1;
var restore_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__54114__$1,new cljs.core.Keyword(null,"restore?","restore?",1172240305),true);
if(typeof command_output === 'string'){
frontend.commands.insert_BANG_(id,command_output,option);
} else {
if(cljs.core.vector_QMARK_(command_output)){
frontend.commands.handle_steps(command_output,format);
} else {
if(cljs.core.fn_QMARK_(command_output)){
var s_54117 = (command_output.cljs$core$IFn$_invoke$arity$0 ? command_output.cljs$core$IFn$_invoke$arity$0() : command_output.call(null));
frontend.commands.insert_BANG_(id,s_54117,option);
} else {

}
}
}

if(cljs.core.truth_(restore_QMARK_)){
return frontend.commands.restore_state();
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.common.editor.js.map
