goog.provide('frontend.handler.file_based.events');
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","ask-for-re-index","graph/ask-for-re-index",2038098533),(function (p__93483){
var vec__93484 = p__93483;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93484,(0),null);
var _STAR_multiple_windows_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93484,(1),null);
var ui = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93484,(2),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.atom_QMARK_(_STAR_multiple_windows_QMARK_);
if(and__5000__auto__){
return cljs.core.deref(_STAR_multiple_windows_QMARK_);
} else {
return and__5000__auto__;
}
})())){
var G__93487 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(((!((ui == null))))?ui:null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"re-index-multiple-windows-warning","re-index-multiple-windows-warning",-1586754166)], 0))], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93487) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93487));
} else {
var G__93488 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(700)], null)], null),(((!((ui == null))))?ui:null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"re-index-discard-unsaved-changes-warning","re-index-discard-unsaved-changes-warning",2059145826)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-end.pt-2","div.flex.justify-end.pt-2",261308485),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"yes","yes",182838819)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"autoFocus","autoFocus",-552622425),"on",new cljs.core.Keyword(null,"class","class",-2030961996),"ui__modal-enter",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","re-index","graph/re-index",-1506681327)], null));
})], 0))], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93488) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93488));
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","re-index","graph/re-index",-1506681327),(function (p__93489){
var vec__93490 = p__93489;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93490,(0),null);
if(frontend.config.local_file_based_graph_QMARK_(frontend.state.get_current_repo())){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_93499){
var state_val_93500 = (state_93499[(1)]);
if((state_val_93500 === (1))){
var inst_93493 = frontend.fs.sync._LT_sync_stop();
var state_93499__$1 = state_93499;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93499__$1,(2),inst_93493);
} else {
if((state_val_93500 === (2))){
var inst_93495 = (state_93499[(2)]);
var inst_93496 = (function (){return (function (){
frontend.handler.page.create_today_journal_BANG_();

return frontend.handler.events.file_sync_restart_BANG_();
});
})();
var inst_93497 = frontend.handler.repo.re_index_BANG_(frontend.handler.file_based.native_fs.rebuild_index_BANG_,inst_93496);
var state_93499__$1 = (function (){var statearr_93501 = state_93499;
(statearr_93501[(7)] = inst_93495);

return statearr_93501;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_93499__$1,inst_93497);
} else {
return null;
}
}
});
return (function() {
var frontend$handler$file_based$events$state_machine__32051__auto__ = null;
var frontend$handler$file_based$events$state_machine__32051__auto____0 = (function (){
var statearr_93502 = [null,null,null,null,null,null,null,null];
(statearr_93502[(0)] = frontend$handler$file_based$events$state_machine__32051__auto__);

(statearr_93502[(1)] = (1));

return statearr_93502;
});
var frontend$handler$file_based$events$state_machine__32051__auto____1 = (function (state_93499){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_93499);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e93503){var ex__32054__auto__ = e93503;
var statearr_93504_93675 = state_93499;
(statearr_93504_93675[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_93499[(4)]))){
var statearr_93505_93676 = state_93499;
(statearr_93505_93676[(1)] = cljs.core.first((state_93499[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__93677 = state_93499;
state_93499 = G__93677;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_based$events$state_machine__32051__auto__ = function(state_93499){
switch(arguments.length){
case 0:
return frontend$handler$file_based$events$state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_based$events$state_machine__32051__auto____1.call(this,state_93499);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_based$events$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_based$events$state_machine__32051__auto____0;
frontend$handler$file_based$events$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_based$events$state_machine__32051__auto____1;
return frontend$handler$file_based$events$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_93506 = f__32125__auto__();
(statearr_93506[(6)] = c__32124__auto__);

return statearr_93506;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
} else {
return null;
}
}));
frontend.handler.file_based.events.set_block_query_properties_BANG_ = (function frontend$handler$file_based$events$set_block_query_properties_BANG_(block_id,all_properties,key,add_QMARK_){
var temp__5804__auto__ = (function (){var G__93507 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__93507) : frontend.db.entity.call(null,G__93507));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var query_properties = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"query-properties","query-properties",-953532199)], null));
var repo = frontend.state.get_current_repo();
var query_properties__$1 = (function (){var G__93508 = query_properties;
if((G__93508 == null)){
return null;
} else {
return frontend.handler.common.safe_read_string(G__93508,"Parsing query properties failed");
}
})();
var query_properties__$2 = ((cljs.core.seq(query_properties__$1))?query_properties__$1:all_properties);
var query_properties__$3 = (cljs.core.truth_(add_QMARK_)?cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(query_properties__$2,key)):cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([key]),query_properties__$2));
var query_properties__$4 = cljs.core.vec(query_properties__$3);
if(cljs.core.seq(query_properties__$4)){
return frontend.handler.property.set_block_property_BANG_(repo,block_id,new cljs.core.Keyword(null,"query-properties","query-properties",-953532199),cljs.core.str.cljs$core$IFn$_invoke$arity$1(query_properties__$4));
} else {
return frontend.handler.property.remove_block_property_BANG_(repo,block_id,new cljs.core.Keyword(null,"query-properties","query-properties",-953532199));
}
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.file_based !== 'undefined') && (typeof frontend.handler.file_based.events !== 'undefined') && (typeof frontend.handler.file_based.events._STAR_query_properties !== 'undefined')){
} else {
frontend.handler.file_based.events._STAR_query_properties = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.handler.file_based.events.query_properties_settings_inner = rum.core.lazy_build(rum.core.build_defc,(function (block,shown_properties,all_properties){
var query_properties = rum.core.react(frontend.handler.file_based.events._STAR_query_properties);
return daiquiri.core.create_element("div",null,[(function (){var attrs93509 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("query","config-property-settings","query/config-property-settings",1039572177)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs93509))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-semibold","-mt-2","mb-2","text-lg"], null)], null),attrs93509], 0))):{'className':"font-semibold -mt-2 mb-2 text-lg"}),((cljs.core.map_QMARK_(attrs93509))?null:[daiquiri.interpreter.interpret(attrs93509)]));
})(),daiquiri.core.create_element("a",{'title':"Refresh list of columns",'onClick':(function (){
cljs.core.reset_BANG_(frontend.handler.file_based.events._STAR_query_properties,cljs.core.PersistentArrayMap.EMPTY);

return frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"query-properties","query-properties",-953532199));
}),'className':"flex"},[daiquiri.interpreter.interpret(frontend.ui.icon("refresh"))]),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$handler$file_based$events$iter__93510(s__93511){
return (new cljs.core.LazySeq(null,(function (){
var s__93511__$1 = s__93511;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93511__$1);
if(temp__5804__auto__){
var s__93511__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93511__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93511__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93513 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93512 = (0);
while(true){
if((i__93512 < size__5479__auto__)){
var property = cljs.core._nth(c__5478__auto__,i__93512);
cljs.core.chunk_append(b__93513,(function (){var property_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(query_properties,property);
var shown_QMARK_ = (((property_value == null))?cljs.core.contains_QMARK_(shown_properties,property):property_value);
return daiquiri.core.create_element("div",{'className':"flex flex-row my-2 justify-between align-items"},[daiquiri.core.create_element("div",null,[cljs.core.name(property)]),(function (){var attrs93514 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(shown_QMARK_,((function (i__93512,property_value,shown_QMARK_,property,c__5478__auto__,size__5479__auto__,b__93513,s__93511__$2,temp__5804__auto__,query_properties){
return (function (){
var value = cljs.core.not(shown_QMARK_);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.file_based.events._STAR_query_properties,cljs.core.assoc,property,value);

return frontend.handler.file_based.events.set_block_query_properties_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),all_properties,property,value);
});})(i__93512,property_value,shown_QMARK_,property,c__5478__auto__,size__5479__auto__,b__93513,s__93511__$2,temp__5804__auto__,query_properties))
,true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93514))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1"], null)], null),attrs93514], 0))):{'className':"mt-1"}),((cljs.core.map_QMARK_(attrs93514))?null:[daiquiri.interpreter.interpret(attrs93514)]));
})()]);
})());

var G__93678 = (i__93512 + (1));
i__93512 = G__93678;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93513),frontend$handler$file_based$events$iter__93510(cljs.core.chunk_rest(s__93511__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93513),null);
}
} else {
var property = cljs.core.first(s__93511__$2);
return cljs.core.cons((function (){var property_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(query_properties,property);
var shown_QMARK_ = (((property_value == null))?cljs.core.contains_QMARK_(shown_properties,property):property_value);
return daiquiri.core.create_element("div",{'className':"flex flex-row my-2 justify-between align-items"},[daiquiri.core.create_element("div",null,[cljs.core.name(property)]),(function (){var attrs93514 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(shown_QMARK_,((function (property_value,shown_QMARK_,property,s__93511__$2,temp__5804__auto__,query_properties){
return (function (){
var value = cljs.core.not(shown_QMARK_);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.file_based.events._STAR_query_properties,cljs.core.assoc,property,value);

return frontend.handler.file_based.events.set_block_query_properties_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),all_properties,property,value);
});})(property_value,shown_QMARK_,property,s__93511__$2,temp__5804__auto__,query_properties))
,true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93514))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1"], null)], null),attrs93514], 0))):{'className':"mt-1"}),((cljs.core.map_QMARK_(attrs93514))?null:[daiquiri.interpreter.interpret(attrs93514)]));
})()]);
})(),frontend$handler$file_based$events$iter__93510(cljs.core.rest(s__93511__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(all_properties);
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.handler.file_based.events._STAR_query_properties,cljs.core.PersistentArrayMap.EMPTY);

return state;
})], null)], null),"frontend.handler.file-based.events/query-properties-settings-inner");
frontend.handler.file_based.events.query_properties_settings = (function frontend$handler$file_based$events$query_properties_settings(block,shown_properties,all_properties){
return (function (_close_fn){
return frontend.handler.file_based.events.query_properties_settings_inner(block,shown_properties,all_properties);
});
});
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","set-query-properties","modal/set-query-properties",-724632293),(function (p__93515){
var vec__93516 = p__93515;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93516,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93516,(1),null);
var all_properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93516,(2),null);
var query_properties = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"query-properties","query-properties",-953532199)], null));
var block_properties = (function (){var G__93519 = query_properties;
if((G__93519 == null)){
return null;
} else {
return frontend.handler.common.safe_read_string(G__93519,"Parsing query properties failed");
}
})();
var shown_properties = ((cljs.core.seq(block_properties))?cljs.core.set(block_properties):cljs.core.set(all_properties));
var shown_properties__$1 = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(all_properties),shown_properties);
var G__93520 = frontend.handler.file_based.events.query_properties_settings(block,shown_properties__$1,all_properties);
var G__93521 = cljs.core.PersistentArrayMap.EMPTY;
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93520,G__93521) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93520,G__93521));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","set-git-username-and-email","modal/set-git-username-and-email",-1189789991),(function (p__93522){
var vec__93523 = p__93522;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93523,(0),null);
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93523,(1),null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.file_based.git.set_git_username_and_email) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.file_based.git.set_git_username_and_email));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file","not-matched-from-disk","file/not-matched-from-disk",1915939272),(function (p__93526){
var vec__93527 = p__93526;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93527,(0),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93527,(1),null);
var disk_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93527,(2),null);
var db_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93527,(3),null);
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var G__93530 = (function (){
return frontend.components.diff.local_file(repo,path,disk_content,db_content);
});
var G__93531 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"diff__cp"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93530,G__93531) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93530,G__93531));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","display-file-version-selector","modal/display-file-version-selector",-1615581416),(function (p__93532){
var vec__93533 = p__93532;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93533,(0),null);
var versions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93533,(1),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93533,(2),null);
var get_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93533,(3),null);
var G__93536 = (function (){
return frontend.components.file_based.git.file_version_selector(versions,path,get_content);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93536) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93536));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("modal","remote-encryption-input-pw-dialog","modal/remote-encryption-input-pw-dialog",1246595794),(function (p__93537){
var vec__93538 = p__93537;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93538,(0),null);
var repo_url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93538,(1),null);
var remote_graph_info = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93538,(2),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93538,(3),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93538,(4),null);
var G__93541 = frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$3(repo_url,null,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(remote_graph_info,new cljs.core.Keyword(null,"type","type",1174270348),(function (){var or__5002__auto__ = type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-pwd-remote","create-pwd-remote",-1888366296);
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"repo","repo",-1999060679),repo_url], 0)),opts], 0)));
var G__93542 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"close-backdrop?","close-backdrop?",2081649802),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93541,G__93542) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93541,G__93542));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","pull-down-remote-graph","graph/pull-down-remote-graph",-1238246835),(function (p__93543){
var vec__93544 = p__93543;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93544,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93544,(1),null);
var dir_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93544,(2),null);
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
var temp__5804__auto__ = (function (){var or__5002__auto__ = dir_name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(graph);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var graph_name = temp__5804__auto__;
var graph_name__$1 = frontend.util.safe_sanitize_file_name(graph_name);
if(clojure.string.blank_QMARK_(graph_name__$1)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1("Illegal graph folder name.");
} else {
var temp__5804__auto____$1 = frontend.state.get_local_container_root_url();
if(cljs.core.truth_(temp__5804__auto____$1)){
var root = temp__5804__auto____$1;
var graph_path = frontend.mobile.graph_picker.validate_graph_dirname(root,graph_name__$1);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.dir_exists_QMARK_(graph_path)),(function (exists_QMARK_){
return promesa.protocols._promise((function (){var overwrite_QMARK_ = (cljs.core.truth_(exists_QMARK_)?confirm(["There's already a directory with the name \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name__$1),"\", do you want to overwrite it? Make sure to backup it first if you're not sure about it."].join('')):true);
if(cljs.core.truth_(overwrite_QMARK_)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(graph_path)),(function (___$1){
return promesa.protocols._promise(frontend.handler.file_based.native_fs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2(graph_path,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089),(function (){
frontend.handler.file_sync.init_remote_graph(graph_path,graph);

return setTimeout((function (){
return frontend.handler.repo.refresh_repos_BANG_();
}),(200));
})], null)));
}));
}));
} else {
var graph_name__$2 = clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(prompt("Please specify a new directory name to download the graph:")));
if(clojure.string.blank_QMARK_(graph_name__$2)){
return null;
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","pull-down-remote-graph","graph/pull-down-remote-graph",-1238246835),graph,graph_name__$2], null));
}
}
})());
}));
})),(function (e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"error","error",-978969032));

return console.error(e);
}));
} else {
return null;
}
}
} else {
return null;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(graph))){
var G__93547 = frontend.components.file_sync.pick_dest_to_sync_panel(graph);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__93547) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93547));
} else {
return null;
}
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","pick-page-histories","graph/pick-page-histories",2080848727),(function (p__93548){
var vec__93549 = p__93548;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93549,(0),null);
var graph_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93549,(1),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93549,(2),null);
var G__93552 = frontend.components.file_sync.pick_page_histories_panel(graph_uuid,page_name);
var G__93553 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"page-histories","page-histories",524382634),new cljs.core.Keyword(null,"label","label",1718410804),"modal-page-histories"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93552,G__93553) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93552,G__93553));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync","maybe-onboarding-show","file-sync/maybe-onboarding-show",1562674517),(function (p__93554){
var vec__93555 = p__93554;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93555,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93555,(1),null);
return frontend.components.file_sync.maybe_onboarding_show(type);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync","storage-exceed-limit","file-sync/storage-exceed-limit",2112370143),(function (p__93558){
var vec__93559 = p__93558;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93559,(0),null);
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("file sync storage exceed limit",new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

return frontend.handler.events.file_sync_stop_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync","graph-count-exceed-limit","file-sync/graph-count-exceed-limit",182223148),(function (p__93562){
var vec__93563 = p__93562;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93563,(0),null);
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("file sync graph count exceed limit",new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

return frontend.handler.events.file_sync_stop_BANG_();
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","dir-gone","graph/dir-gone",-796087345),(function (p__93566){
var vec__93567 = p__93566;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93567,(0),null);
var dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93567,(1),null);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),["The directory ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(dir)," has been renamed or deleted, the editor will be disabled for this graph, you can unlink the graph."].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));

return frontend.state.update_state_BANG_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337),(function (dirs){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(dirs,dir);
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","dir-back","graph/dir-back",-1720939782),(function (p__93570){
var vec__93571 = p__93570;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93571,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93571,(1),null);
var dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93571,(2),null);
if(cljs.core.contains_QMARK_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),dir)){
frontend.handler.notification.clear_all_BANG_();

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),["The directory ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(dir)," has been back, you can edit your graph now."].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"clear?","clear?",1363344639),true], null)], null));

frontend.state.update_state_BANG_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337),(function (dirs){
return cljs.core.disj.cljs$core$IFn$_invoke$arity$2(dirs,dir);
}));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,frontend.config.get_repo_dir(repo))){
return frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir);
} else {
return null;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("ui","notify-skipped-downloading-files","ui/notify-skipped-downloading-files",-1655942465),(function (p__93574){
var vec__93575 = p__93574;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93575,(0),null);
var paths = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93575,(1),null);
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-semibold.mb-4.text-xl","div.font-semibold.mb-4.text-xl",-231639327),"It seems that some of your filenames are in the outdated format."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"The files below that have reserved characters can't be saved on this device."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.overflow-y-auto.max-h-96","div.overflow-y-auto.max-h-96",770942221),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ol.my-2","ol.my-2",2118515659),(function (){var iter__5480__auto__ = (function frontend$handler$file_based$events$iter__93578(s__93579){
return (new cljs.core.LazySeq(null,(function (){
var s__93579__$1 = s__93579;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93579__$1);
if(temp__5804__auto__){
var s__93579__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93579__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93579__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93581 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93580 = (0);
while(true){
if((i__93580 < size__5479__auto__)){
var path = cljs.core._nth(c__5478__auto__,i__93580);
cljs.core.chunk_append(b__93581,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),path], null));

var G__93679 = (i__93580 + (1));
i__93580 = G__93679;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93581),frontend$handler$file_based$events$iter__93578(cljs.core.chunk_rest(s__93579__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93581),null);
}
} else {
var path = cljs.core.first(s__93579__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),path], null),frontend$handler$file_based$events$iter__93578(cljs.core.rest(s__93579__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(paths);
})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Check ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://docs.logseq.com/#/page/logseq%20file%20and%20folder%20naming%20rules",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Logseq file and folder naming rules"], null)," for more details."], null)], null)], null)], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","setup-a-repo","graph/setup-a-repo",992514529),(function (p__93582){
var vec__93583 = p__93582;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93583,(0),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93583,(1),null);
var opts_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"picked-root-fn","picked-root-fn",42247568),(function (){
return frontend.state.close_modal_BANG_();
}),new cljs.core.Keyword(null,"native-icloud?","native-icloud?",-1892335688),(!(clojure.string.blank_QMARK_(frontend.state.get_icloud_container_root_url()))),new cljs.core.Keyword(null,"logged?","logged?",-814149905),frontend.handler.user.logged_in_QMARK_()], null),opts], 0));
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
var G__93586 = (function (){
return frontend.mobile.graph_picker.graph_picker_cp(opts_SINGLEQUOTE_);
});
var G__93587 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"graph-setup"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__93586,G__93587) : logseq.shui.ui.dialog_open_BANG_.call(null,G__93586,G__93587));
} else {
return frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.refresh_BANG_,opts_SINGLEQUOTE_);
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file","alter","file/alter",1559248582),(function (p__93588){
var vec__93589 = p__93588;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93589,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93589,(1),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93589,(2),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93589,(3),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_file(repo,path,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null))),(function (___$1){
return promesa.protocols._promise(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0());
}));
}));
}));
frontend.handler.file_based.events.file_id_conflict_item = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo,file,data){
var resolved_QMARK_ = new cljs.core.Keyword("frontend.handler.file-based.events","resolved?","frontend.handler.file-based.events/resolved?",-1556530470).cljs$core$IFn$_invoke$arity$1(state);
var id = cljs.core.last(new cljs.core.Keyword(null,"assertion","assertion",-1645134882).cljs$core$IFn$_invoke$arity$1(data));
return daiquiri.core.create_element("li",{'key':file},[daiquiri.core.create_element("div",null,[daiquiri.core.create_element("a",{'onClick':(function (){
return window.apis.openPath(file);
})},[daiquiri.interpreter.interpret(file)]),(cljs.core.truth_(cljs.core.deref(resolved_QMARK_))?(function (){var attrs93592 = frontend.ui.icon("circle-check",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93592))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs93592], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs93592))?[daiquiri.core.create_element("div",{'className':"ml-1"},["Resolved"])]:[daiquiri.interpreter.interpret(attrs93592),daiquiri.core.create_element("div",{'className':"ml-1"},["Resolved"])]));
})():daiquiri.core.create_element("div",null,[daiquiri.core.create_element("p",null,[["It seems that another whiteboard file already has the ID \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"\". You can fix it by changing the ID in this file with another UUID."].join('')]),daiquiri.core.create_element("p",null,["Or, let me",daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Fix",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var dir = frontend.config.get_repo_dir(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(dir,file)),(function (content){
return promesa.protocols._promise((function (){var new_content = clojure.string.replace(content,cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,dir,file,new_content,cljs.core.PersistentArrayMap.EMPTY)),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(resolved_QMARK_,true));
}));
}));
})());
}));
}));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"inline mx-1"], 0))),"it."])]))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.handler.file-based.events","resolved?","frontend.handler.file-based.events/resolved?",-1556530470))], null),"frontend.handler.file-based.events/file-id-conflict-item");
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file","parse-and-load-error","file/parse-and-load-error",-808105720),(function (p__93597){
var vec__93598 = p__93597;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93598,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93598,(1),null);
var parse_errors = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93598,(2),null);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.title","h2.title",866247517),"Oops. These files failed to import to your graph:"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ol.my-2","ol.my-2",2118515659),(function (){var iter__5480__auto__ = (function frontend$handler$file_based$events$iter__93601(s__93602){
return (new cljs.core.LazySeq(null,(function (){
var s__93602__$1 = s__93602;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93602__$1);
if(temp__5804__auto__){
var s__93602__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93602__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93602__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93604 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93603 = (0);
while(true){
if((i__93603 < size__5479__auto__)){
var vec__93605 = cljs.core._nth(c__5478__auto__,i__93603);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93605,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93605,(1),null);
cljs.core.chunk_append(b__93604,(function (){var data = cljs.core.ex_data(error);
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.common.config.whiteboard_QMARK_(file);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transact","upsert","transact/upsert",412688078),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(data))) && (cljs.core.uuid_QMARK_(cljs.core.last(new cljs.core.Keyword(null,"assertion","assertion",-1645134882).cljs$core$IFn$_invoke$arity$1(data)))));
} else {
return and__5000__auto__;
}
})())){
return rum.core.with_key(frontend.handler.file_based.events.file_id_conflict_item(repo,file,data),file);
} else {
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("file","parse-and-load-error","file/parse-and-load-error",-808105720)], null)], null)], null));

return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.my-1","li.my-1",-949403355),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),file], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__93603,data,vec__93605,file,error,c__5478__auto__,size__5479__auto__,b__93604,s__93602__$2,temp__5804__auto__,vec__93598,_,repo,parse_errors){
return (function (){
return window.apis.openPath(file);
});})(i__93603,data,vec__93605,file,error,c__5478__auto__,size__5479__auto__,b__93604,s__93602__$2,temp__5804__auto__,vec__93598,_,repo,parse_errors))
], null),file], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),error.message], null)], null);

}
})());

var G__93680 = (i__93603 + (1));
i__93603 = G__93680;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93604),frontend$handler$file_based$events$iter__93601(cljs.core.chunk_rest(s__93602__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93604),null);
}
} else {
var vec__93608 = cljs.core.first(s__93602__$2);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93608,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93608,(1),null);
return cljs.core.cons((function (){var data = cljs.core.ex_data(error);
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.common.config.whiteboard_QMARK_(file);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transact","upsert","transact/upsert",412688078),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(data))) && (cljs.core.uuid_QMARK_(cljs.core.last(new cljs.core.Keyword(null,"assertion","assertion",-1645134882).cljs$core$IFn$_invoke$arity$1(data)))));
} else {
return and__5000__auto__;
}
})())){
return rum.core.with_key(frontend.handler.file_based.events.file_id_conflict_item(repo,file,data),file);
} else {
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("file","parse-and-load-error","file/parse-and-load-error",-808105720)], null)], null)], null));

return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.my-1","li.my-1",-949403355),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),file], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (data,vec__93608,file,error,s__93602__$2,temp__5804__auto__,vec__93598,_,repo,parse_errors){
return (function (){
return window.apis.openPath(file);
});})(data,vec__93608,file,error,s__93602__$2,temp__5804__auto__,vec__93598,_,repo,parse_errors))
], null),file], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),error.message], null)], null);

}
})(),frontend$handler$file_based$events$iter__93601(cljs.core.rest(s__93602__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(parse_errors);
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Don't forget to re-index your graph when all the conflicts are resolved."], null)], null),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("file-sync-graph","restore-file","file-sync-graph/restore-file",691096310),(function (p__93611){
var vec__93612 = p__93611;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93612,(0),null);
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93612,(1),null);
var page_entity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93612,(2),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93612,(3),null);
if(cljs.core.truth_((frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(graph) : frontend.db.get_db.call(null,graph)))){
var file = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page_entity);
var temp__5804__auto__ = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file);
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(content,new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file));
if(and__5000__auto__){
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file);
} else {
return and__5000__auto__;
}
})())){
frontend.fs.sync.add_new_version_file(graph,path,new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file));
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_file(graph,path,content,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.close_modal_BANG_()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_entity)], null)], null)));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sync","create-remote-graph","sync/create-remote-graph",-1953229831),(function (p__93615){
var vec__93616 = p__93615;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93616,(0),null);
var current_repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93616,(1),null);
var graph_name = decodeURI((frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(current_repo) : frontend.util.node_path.basename.call(null,current_repo)));
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_93646){
var state_val_93647 = (state_93646[(1)]);
if((state_val_93647 === (1))){
var inst_93619 = frontend.fs.sync._LT_sync_stop();
var state_93646__$1 = state_93646;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93646__$1,(2),inst_93619);
} else {
if((state_val_93647 === (2))){
var inst_93621 = (state_93646[(2)]);
var inst_93622 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_93623 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_93624 = (new cljs.core.PersistentVector(null,2,(5),inst_93622,inst_93623,null));
var inst_93625 = frontend.state.set_state_BANG_(inst_93624,true);
var inst_93626 = frontend.handler.file_sync.create_graph(graph_name);
var state_93646__$1 = (function (){var statearr_93648 = state_93646;
(statearr_93648[(7)] = inst_93621);

(statearr_93648[(8)] = inst_93625);

return statearr_93648;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93646__$1,(3),inst_93626);
} else {
if((state_val_93647 === (3))){
var inst_93629 = (state_93646[(9)]);
var inst_93628 = (state_93646[(2)]);
var inst_93629__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_93628,(2));
var state_93646__$1 = (function (){var statearr_93649 = state_93646;
(statearr_93649[(9)] = inst_93629__$1);

return statearr_93649;
})();
if(cljs.core.truth_(inst_93629__$1)){
var statearr_93650_93681 = state_93646__$1;
(statearr_93650_93681[(1)] = (4));

} else {
var statearr_93651_93682 = state_93646__$1;
(statearr_93651_93682[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93647 === (4))){
var inst_93631 = frontend.fs.sync._LT_sync_start();
var state_93646__$1 = state_93646;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93646__$1,(7),inst_93631);
} else {
if((state_val_93647 === (5))){
var state_93646__$1 = state_93646;
var statearr_93652_93683 = state_93646__$1;
(statearr_93652_93683[(2)] = null);

(statearr_93652_93683[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93647 === (6))){
var inst_93644 = (state_93646[(2)]);
var state_93646__$1 = state_93646;
return cljs.core.async.impl.ioc_helpers.return_chan(state_93646__$1,inst_93644);
} else {
if((state_val_93647 === (7))){
var inst_93629 = (state_93646[(9)]);
var inst_93633 = (state_93646[(2)]);
var inst_93634 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_93635 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_93636 = (new cljs.core.PersistentVector(null,2,(5),inst_93634,inst_93635,null));
var inst_93637 = frontend.state.set_state_BANG_(inst_93636,false);
var inst_93638 = (function (){var temp__5804__auto__ = inst_93629;
var GraphUUID = inst_93629;
return (function (r){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r),current_repo)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(r,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),GraphUUID,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),graph_name,new cljs.core.Keyword(null,"remote?","remote?",-517415110),true], 0));
} else {
return r;
}
});
})();
var inst_93639 = frontend.state.get_repos();
var inst_93640 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(inst_93638,inst_93639);
var inst_93641 = frontend.state.set_repos_BANG_(inst_93640);
var state_93646__$1 = (function (){var statearr_93653 = state_93646;
(statearr_93653[(10)] = inst_93633);

(statearr_93653[(11)] = inst_93637);

return statearr_93653;
})();
var statearr_93654_93684 = state_93646__$1;
(statearr_93654_93684[(2)] = inst_93641);

(statearr_93654_93684[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});
return (function() {
var frontend$handler$file_based$events$state_machine__32051__auto__ = null;
var frontend$handler$file_based$events$state_machine__32051__auto____0 = (function (){
var statearr_93655 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_93655[(0)] = frontend$handler$file_based$events$state_machine__32051__auto__);

(statearr_93655[(1)] = (1));

return statearr_93655;
});
var frontend$handler$file_based$events$state_machine__32051__auto____1 = (function (state_93646){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_93646);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e93656){var ex__32054__auto__ = e93656;
var statearr_93657_93685 = state_93646;
(statearr_93657_93685[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_93646[(4)]))){
var statearr_93658_93686 = state_93646;
(statearr_93658_93686[(1)] = cljs.core.first((state_93646[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__93687 = state_93646;
state_93646 = G__93687;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_based$events$state_machine__32051__auto__ = function(state_93646){
switch(arguments.length){
case 0:
return frontend$handler$file_based$events$state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_based$events$state_machine__32051__auto____1.call(this,state_93646);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_based$events$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_based$events$state_machine__32051__auto____0;
frontend$handler$file_based$events$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_based$events$state_machine__32051__auto____1;
return frontend$handler$file_based$events$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_93659 = f__32125__auto__();
(statearr_93659[(6)] = c__32124__auto__);

return statearr_93659;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("journal","insert-template","journal/insert-template",-1273735332),(function (p__93660){
var vec__93661 = p__93660;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93661,(0),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93661,(1),null);
var page_name__$1 = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name));
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name__$1) : frontend.db.get_page.call(null,page_name__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_((function (){var G__93664 = frontend.state.get_current_repo();
var G__93665 = page_name__$1;
return (frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_empty_QMARK_.cljs$core$IFn$_invoke$arity$2(G__93664,G__93665) : frontend.db.page_empty_QMARK_.call(null,G__93664,G__93665));
})())?(function (){var temp__5804__auto____$1 = frontend.state.get_default_journal_template();
if(cljs.core.truth_(temp__5804__auto____$1)){
var template = temp__5804__auto____$1;
return frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3(null,template,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"target","target",253001721),page], null));
} else {
return null;
}
})():null));
}));
}));
} else {
return null;
}
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","backup-file","graph/backup-file",-457945391),(function (p__93666){
var vec__93667 = p__93666;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93667,(0),null);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93667,(1),null);
var file_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93667,(2),null);
var db_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93667,(3),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2("",file_path)),(function (disk_content){
return promesa.protocols._promise(frontend.fs.backup_db_file_BANG_(repo,file_path,db_content,disk_content));
}));
}));
}));
frontend.handler.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("graph","notify-existing-file","graph/notify-existing-file",1565444534),(function (p__93670){
var vec__93671 = p__93670;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93671,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93671,(1),null);
var map__93674 = data;
var map__93674__$1 = cljs.core.__destructure_map(map__93674);
var current_file_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93674__$1,new cljs.core.Keyword(null,"current-file-path","current-file-path",2051233087));
var file_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93674__$1,new cljs.core.Keyword(null,"file-path","file-path",-2005501162));
var error = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","validate-existing-file-error","file/validate-existing-file-error",-2073698910),current_file_path,file_path], 0));
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),error,new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));
}));

//# sourceMappingURL=frontend.handler.file_based.events.js.map
