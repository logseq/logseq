goog.provide('frontend.components.file_based.block');
frontend.components.file_based.block.marker_switch = (function frontend$components$file_based$block$marker_switch(p__108620){
var map__108621 = p__108620;
var map__108621__$1 = cljs.core.__destructure_map(map__108621);
var block = map__108621__$1;
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108621__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["TODO",null,"NOW",null,"LATER",null,"DOING",null], null), null),marker)){
var set_marker_fn = (function (new_marker){
return (function (e){
frontend.util.stop(e);

return frontend.handler.editor.set_marker.cljs$core$IFn$_invoke$arity$2(block,new_marker);
});
});
var next_marker = (function (){var G__108623 = marker;
switch (G__108623) {
case "NOW":
return "LATER";

break;
case "LATER":
return "NOW";

break;
case "TODO":
return "DOING";

break;
case "DOING":
return "TODO";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__108623)].join('')));

}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),["marker-switch block-marker ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker)].join(''),new cljs.core.Keyword(null,"title","title",636505583),(frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("Change from %s to %s",marker,next_marker) : frontend.util.format.call(null,"Change from %s to %s",marker,next_marker)),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),set_marker_fn(next_marker)], null),marker], null);
} else {
return null;
}
});
frontend.components.file_based.block.block_checkbox = (function frontend$components$file_based$block$block_checkbox(block,class$){
var marker = new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block);
var vec__108626 = (((marker == null))?null:((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, ["TODO",null,"NOW",null,"LATER",null,"DOING",null,"IN-PROGRESS",null,"WAITING",null,"WAIT",null], null), null),marker))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$,false], null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("DONE",marker))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)," checked"].join(''),true], null):null)));
var class$__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108626,(0),null);
var checked_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108626,(1),null);
if(cljs.core.truth_(class$__$1)){
return frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),class$__$1,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),(5)], null),new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop_propagation(e);
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (_e){
if(cljs.core.truth_(checked_QMARK_)){
return frontend.handler.editor.uncheck(block);
} else {
return frontend.handler.editor.check(block);
}
})], null));
} else {
return null;
}
});
frontend.components.file_based.block.marker_cp = (function frontend$components$file_based$block$marker_cp(p__108630){
var map__108631 = p__108630;
var map__108631__$1 = cljs.core.__destructure_map(map__108631);
var _block = map__108631__$1;
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108631__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108631__$1,new cljs.core.Keyword("block","marker","block/marker",1231576318));
if(cljs.core.truth_(pre_block_QMARK_)){
return null;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["IN-PROGRESS",null,"WAITING",null,"WAIT",null], null), null),marker)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),["task-status block-marker ",clojure.string.lower_case(marker)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),3.5], null)], null),clojure.string.upper_case(marker)], null);
} else {
return null;
}
}
});
frontend.components.file_based.block.set_priority = rum.core.lazy_build(rum.core.build_defc,(function (block,priority){
var attrs108727 = (function (){var priorities = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__108642_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(priority,p1__108642_SHARP_);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["A","B","C"], null)));
var iter__5480__auto__ = (function frontend$components$file_based$block$iter__108733(s__108734){
return (new cljs.core.LazySeq(null,(function (){
var s__108734__$1 = s__108734;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__108734__$1);
if(temp__5804__auto__){
var s__108734__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__108734__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__108734__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__108736 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__108735 = (0);
while(true){
if((i__108735 < size__5479__auto__)){
var p = cljs.core._nth(c__5478__auto__,i__108735);
cljs.core.chunk_append(b__108736,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.mr-2.text-base.tooltip-priority","a.mr-2.text-base.tooltip-priority",1672342386),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),new cljs.core.Keyword(null,"priority","priority",1431093715),p,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__108735,p,c__5478__auto__,size__5479__auto__,b__108736,s__108734__$2,temp__5804__auto__,priorities){
return (function (){
return frontend.handler.editor.set_priority(block,p);
});})(i__108735,p,c__5478__auto__,size__5479__auto__,b__108736,s__108734__$2,temp__5804__auto__,priorities))
], null)], null));

var G__108942 = (i__108735 + (1));
i__108735 = G__108942;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__108736),frontend$components$file_based$block$iter__108733(cljs.core.chunk_rest(s__108734__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__108736),null);
}
} else {
var p = cljs.core.first(s__108734__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.mr-2.text-base.tooltip-priority","a.mr-2.text-base.tooltip-priority",1672342386),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),new cljs.core.Keyword(null,"priority","priority",1431093715),p,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (p,s__108734__$2,temp__5804__auto__,priorities){
return (function (){
return frontend.handler.editor.set_priority(block,p);
});})(p,s__108734__$2,temp__5804__auto__,priorities))
], null)], null),frontend$components$file_based$block$iter__108733(cljs.core.rest(s__108734__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(priorities);
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs108727))?daiquiri.interpreter.element_attributes(attrs108727):null),((cljs.core.map_QMARK_(attrs108727))?null:[daiquiri.interpreter.interpret(attrs108727)]));
}),null,"frontend.components.file-based.block/set-priority");
frontend.components.file_based.block.priority_text = rum.core.lazy_build(rum.core.build_defc,(function (priority){
return daiquiri.core.create_element("a",{'href':reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),priority], null)),'style':{'marginRight':3.5},'className':"opacity-50 hover:opacity-100 priority"},[daiquiri.interpreter.interpret((function (){var G__108756 = "[#%s]";
var G__108757 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(priority);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__108756,G__108757) : frontend.util.format.call(null,G__108756,G__108757));
})())]);
}),null,"frontend.components.file-based.block/priority-text");
frontend.components.file_based.block.priority_cp = (function frontend$components$file_based$block$priority_cp(p__108758){
var map__108759 = p__108758;
var map__108759__$1 = cljs.core.__destructure_map(map__108759);
var block = map__108759__$1;
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108759__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108759__$1,new cljs.core.Keyword("block","priority","block/priority",1491369544));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(pre_block_QMARK_);
if(and__5000__auto__){
return priority;
} else {
return and__5000__auto__;
}
})())){
return frontend.ui.tooltip(frontend.components.file_based.block.priority_text(priority),frontend.components.file_based.block.set_priority(block,priority));
} else {
return null;
}
});
frontend.components.file_based.block.clock_summary_cp = (function frontend$components$file_based$block$clock_summary_cp(block,body){
if(((frontend.state.enable_timetracking_QMARK_()) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block),"DONE")) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["TODO",null,"LATER",null], null), null),new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block))))))){
var summary = frontend.util.file_based.clock.clock_summary(body,true);
if(cljs.core.truth_((function (){var and__5000__auto__ = summary;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(summary,"0m")) && ((!(clojure.string.blank_QMARK_(summary)))));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(100)], null)], null),frontend.ui.tooltip(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.time-spent.ml-1","div.text-sm.time-spent.ml-1",908707952),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding-top","padding-top",1929675955),(3)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.fade-link","a.fade-link",-804169045),summary], null)], null),(function (){var temp__5804__auto__ = frontend.util.file_based.drawer.get_logbook(body);
if(cljs.core.truth_(temp__5804__auto__)){
var logbook = temp__5804__auto__;
var clocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__108760_SHARP_){
return clojure.string.starts_with_QMARK_(p1__108760_SHARP_,"CLOCK:");
}),cljs.core.last(logbook)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-bold.mb-2","div.font-bold.mb-2",2058752701),"LOGBOOK:"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),(function (){var iter__5480__auto__ = (function frontend$components$file_based$block$clock_summary_cp_$_iter__108761(s__108762){
return (new cljs.core.LazySeq(null,(function (){
var s__108762__$1 = s__108762;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__108762__$1);
if(temp__5804__auto____$1){
var s__108762__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__108762__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__108762__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__108764 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__108763 = (0);
while(true){
if((i__108763 < size__5479__auto__)){
var clock = cljs.core._nth(c__5478__auto__,i__108763);
cljs.core.chunk_append(b__108764,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),clock], null));

var G__108956 = (i__108763 + (1));
i__108763 = G__108956;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__108764),frontend$components$file_based$block$clock_summary_cp_$_iter__108761(cljs.core.chunk_rest(s__108762__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__108764),null);
}
} else {
var clock = cljs.core.first(s__108762__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),clock], null),frontend$components$file_based$block$clock_summary_cp_$_iter__108761(cljs.core.rest(s__108762__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.take.cljs$core$IFn$_invoke$arity$2((10),cljs.core.reverse(clocks)));
})()], null)], null);
} else {
return null;
}
})())], null);
} else {
return null;
}
} else {
return null;
}
});
frontend.components.file_based.block.timestamp_editor = rum.core.lazy_build(rum.core.build_defc,(function (ast,_STAR_show_datapicker_QMARK_){
var _STAR_trigger_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var pid = (function (){var G__108769 = rum.core.deref(_STAR_trigger_ref).closest("a");
var G__108770 = frontend.components.file_based.datetime.date_picker(null,null,frontend.handler.file_based.repeated.timestamp__GT_map(ast));
var G__108771 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"timestamp-editor","timestamp-editor",-1573506532),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenChange","onOpenChange",-675762944),(function (p1__108765_SHARP_){
return cljs.core.reset_BANG_(_STAR_show_datapicker_QMARK_,p1__108765_SHARP_);
})], null),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (){
return cljs.core.reset_BANG_(_STAR_show_datapicker_QMARK_,false);
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__108769,G__108770,G__108771) : logseq.shui.ui.popup_show_BANG_.call(null,G__108769,G__108770,G__108771));
})();
return (function (){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(pid) : logseq.shui.ui.popup_hide_BANG_.call(null,pid));

return cljs.core.reset_BANG_(_STAR_show_datapicker_QMARK_,false);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("i",{'ref':_STAR_trigger_ref},[]);
}),null,"frontend.components.file-based.block/timestamp-editor");
frontend.components.file_based.block.timestamp_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,typ,ast){
var ts_block_id = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-timestamp-block","editor/set-timestamp-block",1136443872)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
var _active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),ts_block_id);
var _STAR_show_datapicker_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.block","show-datepicker?","frontend.components.file-based.block/show-datepicker?",754839247));
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-4 timestamp"},[daiquiri.core.create_element("div",{'className':"text-sm flex flex-row"},[daiquiri.core.create_element("div",{'className':"opacity-50 font-medium timestamp-label"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(typ),": "].join('')]),daiquiri.core.create_element("a",{'onPointerDown':(function (e){
frontend.util.stop(e);

frontend.state.clear_editor_action_BANG_();

frontend.handler.editor.escape_editing();

cljs.core.reset_BANG_(_STAR_show_datapicker_QMARK_,true);

cljs.core.reset_BANG_(frontend.commands._STAR_current_command,typ);

return frontend.state.set_timestamp_block_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"typ","typ",-1304536900),typ], null));
}),'className':"opacity-80 hover:opacity-100"},[daiquiri.core.create_element("span",{'className':"time-start"},["<"]),(function (){var attrs108901 = frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$1(ast);
return daiquiri.core.create_element("time",((cljs.core.map_QMARK_(attrs108901))?daiquiri.interpreter.element_attributes(attrs108901):null),((cljs.core.map_QMARK_(attrs108901))?null:[daiquiri.interpreter.interpret(attrs108901)]));
})(),daiquiri.core.create_element("span",{'className':"time-stop"},[">"]),(cljs.core.truth_((function (){var and__5000__auto__ = _active_QMARK_;
if(and__5000__auto__){
return cljs.core.deref(_STAR_show_datapicker_QMARK_);
} else {
return and__5000__auto__;
}
})())?frontend.components.file_based.block.timestamp_editor(ast,_STAR_show_datapicker_QMARK_):null)])])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.file-based.block","show-datepicker?","frontend.components.file-based.block/show-datepicker?",754839247))], null),"frontend.components.file-based.block/timestamp-cp");

//# sourceMappingURL=frontend.components.file_based.block.js.map
