goog.provide('frontend.mobile.action_bar');
frontend.mobile.action_bar.action_command = (function frontend$mobile$action_bar$action_command(icon,description,command_handler){
var callback = (function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);

return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
});
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bottom-action.flex-row","button.bottom-action.flex-row",1523316063),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_event){
(command_handler.cljs$core$IFn$_invoke$arity$0 ? command_handler.cljs$core$IFn$_invoke$arity$0() : command_handler.call(null));

return callback();
})], null),frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fontSize","fontSize",919623033),(23)], null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.description","div.description",1049154676),description], null)], null);
});
frontend.mobile.action_bar.action_bar = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var blocks = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
var G__88929 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88929) : frontend.db.entity.call(null,G__88929));
}),frontend.state.get_selection_block_ids());
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
return daiquiri.core.create_element("div",{'className':"action-bar"},[(function (){var attrs88930 = frontend.mobile.action_bar.action_command("copy","Copy",(function (){
return frontend.handler.editor.copy_selection_blocks(false);
}));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88930))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["action-bar-commands"], null)], null),attrs88930], 0))):{'className':"action-bar-commands"}),((cljs.core.map_QMARK_(attrs88930))?[daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("cut","Cut",(function (){
return frontend.handler.editor.cut_selection_blocks.cljs$core$IFn$_invoke$arity$variadic(true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mobile-action-bar?","mobile-action-bar?",921992889),true], null)], 0));
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("registered","Copy ref",(function (_event){
return frontend.handler.editor.copy_block_refs();
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("link","Copy url",(function (_event){
var current_repo = frontend.state.get_current_repo();
var tap_f = (function (block_id){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3(null,current_repo,block_id);
});
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(block_ids),tap_f);
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("x","Unselect",(function (_event){
frontend.state.clear_selection_BANG_();

return frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
})))]:[daiquiri.interpreter.interpret(attrs88930),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("cut","Cut",(function (){
return frontend.handler.editor.cut_selection_blocks.cljs$core$IFn$_invoke$arity$variadic(true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mobile-action-bar?","mobile-action-bar?",921992889),true], null)], 0));
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("registered","Copy ref",(function (_event){
return frontend.handler.editor.copy_block_refs();
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("link","Copy url",(function (_event){
var current_repo = frontend.state.get_current_repo();
var tap_f = (function (block_id){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3(null,current_repo,block_id);
});
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(block_ids),tap_f);
}))),daiquiri.interpreter.interpret(frontend.mobile.action_bar.action_command("x","Unselect",(function (_event){
frontend.state.clear_selection_BANG_();

return frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
})))]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.mobile.action-bar/action-bar");

//# sourceMappingURL=frontend.mobile.action_bar.js.map
