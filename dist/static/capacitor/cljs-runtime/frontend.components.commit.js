goog.provide('frontend.components.commit');
goog.scope(function(){
  frontend.components.commit.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.commit.commit_all_BANG_ = (function frontend$components$commit$commit_all_BANG_(){
var value = frontend.components.commit.goog$module$goog$object.get(goog.dom.getElement("commit-message"),"value");
if(cljs.core.truth_((function (){var and__5000__auto__ = value;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(value) >= (1));
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["gitCommitAll",value], 0));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
} else {
return null;
}
});
frontend.components.commit.prettify_git_status = (function frontend$components$commit$prettify_git_status(status){
var lines = clojure.string.split_lines(status);
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (line){
var first_char = cljs.core.first(clojure.string.trim(line));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"#")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),line], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"M")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-green-400","span.text-green-400",-309035999),line], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"A")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-green-500","span.text-green-500",330761057),line], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"D")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-red-500","span.text-red-500",442347414),line], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"?")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-green-500","span.text-green-500",330761057),line], null);
} else {
return line;

}
}
}
}
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,lines)));
});
frontend.components.commit.add_commit_message = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_git_status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.commit","git-status","frontend.components.commit/git-status",-1785252520));
var attrs65312 = ((cljs.core.empty_QMARK_(cljs.core.deref(_STAR_git_status)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sm:flex.sm:items-start","div.sm:flex.sm:items-start",-437342012),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-4.text-center.sm:mt-0.sm:text-left.mb-0","div.mt-4.text-center.sm:mt-0.sm:text-left.mb-0",-1571415053),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.leading-6.font-medium","h3.text-lg.leading-6.font-medium",-434918288),"No changes to commit!"], null)], null)], null)], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sm:flex.sm:items-start","div.sm:flex.sm:items-start",-437342012),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2.w-full","div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2.w-full",-1425875518),(((cljs.core.deref(_STAR_git_status) == null))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Loading..."], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.w-full.flex-col","div.flex.w-full.flex-col",-1216883392),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xl","h2.text-xl",1843221886),"You have uncommitted changes: "], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.max-h-96.overflow-y-auto.bg-gray-02","pre.max-h-96.overflow-y-auto.bg-gray-02",-1885159649),frontend.components.commit.prettify_git_status(cljs.core.deref(_STAR_git_status))], null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3#modal-headline.text-lg.leading-6.font-medium","h3#modal-headline.text-lg.leading-6.font-medium",365314317),"Your commit message:"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2","input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2",1244359753),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"default-value","default-value",232220170),""], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-5.sm:mt-4.flex.justify-end.pt-4","div.mt-5.sm:mt-4.flex.justify-end.pt-4",663612447),(function (){var G__65316 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.commit.commit_all_BANG_();
})], null);
var G__65317 = "Commit";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__65316,G__65317) : logseq.shui.ui.button.call(null,G__65316,G__65317));
})()], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs65312))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-full","mx-auto"], null)], null),attrs65312], 0))):{'className':"w-full mx-auto"}),((cljs.core.map_QMARK_(attrs65312))?null:[daiquiri.interpreter.interpret(attrs65312)]));
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.commit","git-status","frontend.components.commit/git-status",-1785252520)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["gitStatus",frontend.state.get_current_repo()], 0)),(function (status){
return cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.commit","git-status","frontend.components.commit/git-status",-1785252520)),status);
}));

return state;
}),new cljs.core.Keyword(null,"did-update","did-update",-2143702256),(function (state){
var temp__5804__auto___65326 = goog.dom.getElement("commit-message");
if(cljs.core.truth_(temp__5804__auto___65326)){
var input_65327 = temp__5804__auto___65326;
input_65327.focus();

frontend.util.cursor.move_cursor_to_end(input_65327);
} else {
}

return state;
})], null),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.on_enter.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"node","node",581201198),goog.dom.getElement("commit-message"),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (){
return frontend.components.commit.commit_all_BANG_();
})], 0));
}))], null),"frontend.components.commit/add-commit-message");
frontend.components.commit.show_commit_modal_BANG_ = (function frontend$components$commit$show_commit_modal_BANG_(e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.export_current_graph_BANG_()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65319 = frontend.components.commit.add_commit_message;
var G__65320 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202),(function (p1__65318_SHARP_){
return p1__65318_SHARP_.preventDefault();
})], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__65319,G__65320) : logseq.shui.ui.dialog_open_BANG_.call(null,G__65319,G__65320));
})()),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(e)?frontend.util.stop(e):null));
}));
}));
}));
});

//# sourceMappingURL=frontend.components.commit.js.map
