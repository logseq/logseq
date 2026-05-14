goog.provide('frontend.components.diff');
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.diff !== 'undefined') && (typeof frontend.components.diff.disk_value !== 'undefined')){
} else {
frontend.components.diff.disk_value = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.diff !== 'undefined') && (typeof frontend.components.diff.db_value !== 'undefined')){
} else {
frontend.components.diff.db_value = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.diff.diff_cp = rum.core.lazy_build(rum.core.build_defc,(function (diff){
return daiquiri.core.create_element("div",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$diff$iter__92994(s__92995){
return (new cljs.core.LazySeq(null,(function (){
var s__92995__$1 = s__92995;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92995__$1);
if(temp__5804__auto__){
var s__92995__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92995__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92995__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92997 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92996 = (0);
while(true){
if((i__92996 < size__5479__auto__)){
var vec__92999 = cljs.core._nth(c__5478__auto__,i__92996);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92999,(0),null);
var map__93002 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92999,(1),null);
var map__93002__$1 = cljs.core.__destructure_map(map__93002);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93002__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93002__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93002__$1,new cljs.core.Keyword(null,"value","value",305978217));
cljs.core.chunk_append(b__92997,(function (){var bg_color = (cljs.core.truth_(added)?"#057a55":(cljs.core.truth_(removed)?"#d61f69":"initial"
));
return daiquiri.core.create_element("span",{'key':idx,'style':{'backgroundColor':bg_color},'className':"diff"},[daiquiri.interpreter.interpret(value)]);
})());

var G__93046 = (i__92996 + (1));
i__92996 = G__93046;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92997),frontend$components$diff$iter__92994(cljs.core.chunk_rest(s__92995__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92997),null);
}
} else {
var vec__93003 = cljs.core.first(s__92995__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93003,(0),null);
var map__93006 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93003,(1),null);
var map__93006__$1 = cljs.core.__destructure_map(map__93006);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93006__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93006__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93006__$1,new cljs.core.Keyword(null,"value","value",305978217));
return cljs.core.cons((function (){var bg_color = (cljs.core.truth_(added)?"#057a55":(cljs.core.truth_(removed)?"#d61f69":"initial"
));
return daiquiri.core.create_element("span",{'key':idx,'style':{'backgroundColor':bg_color},'className':"diff"},[daiquiri.interpreter.interpret(value)]);
})(),frontend$components$diff$iter__92994(cljs.core.rest(s__92995__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(diff);
})())]);
}),null,"frontend.components.diff/diff-cp");
frontend.components.diff.local_file = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo,path,disk_content,db_content){
if((cljs.core.deref(frontend.components.diff.disk_value) == null)){
cljs.core.reset_BANG_(frontend.components.diff.disk_value,disk_content);

cljs.core.reset_BANG_(frontend.components.diff.db_value,db_content);
} else {
}

return daiquiri.core.create_element("div",{'className':"cp__diff-file"},[daiquiri.core.create_element("div",{'className':"cp__diff-file-header"},[(function (){var attrs93030 = logseq.shui.ui.tabler_icon("info-triangle");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93030))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__diff-file-header-content","pl-1"], null)], null),attrs93030], 0))):{'className':"cp__diff-file-header-content pl-1"}),((cljs.core.map_QMARK_(attrs93030))?[daiquiri.core.create_element("span",null,[["File ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"has been modified on the disk."].join('')])]:[daiquiri.interpreter.interpret(attrs93030),daiquiri.core.create_element("span",null,[["File ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"has been modified on the disk."].join('')])]));
})()]),(function (){var attrs93022 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(disk_content),clojure.string.trim(db_content)))?frontend.ui.foldable((function (){var G__93031 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-0"], null);
var G__93032 = "Check diff";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__93031,G__93032) : logseq.shui.ui.button.call(null,G__93031,G__93032));
})(),(function (){
var local_content = (function (){var or__5002__auto__ = db_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var content = (function (){var or__5002__auto__ = disk_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var diff = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(frontend.diff.diff(local_content,content));
var diff_QMARK_ = cljs.core.some((function (p__93033){
var vec__93034 = p__93033;
var _idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93034,(0),null);
var map__93037 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93034,(1),null);
var map__93037__$1 = cljs.core.__destructure_map(map__93037);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93037__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93037__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
var or__5002__auto__ = added;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return removed;
}
}),diff);
if(cljs.core.truth_(diff_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.overflow-y-scroll.flex.flex-col","div.overflow-y-scroll.flex.flex-col",-1644783899),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-height","max-height",-612563804),"65vh"], null)], null),frontend.components.diff.diff_cp(diff)], null)], null);
} else {
return null;
}
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),true,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null)):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93022))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-4"], null)], null),attrs93022], 0))):{'className':"p-4"}),((cljs.core.map_QMARK_(attrs93022))?[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex flex-col mt-4 sm:flex-row"},[daiquiri.core.create_element("div",{'className':"flex-1"},[daiquiri.core.create_element("div",{'className':"mb-2"},["On disk:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.disk_value),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(frontend.components.diff.disk_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(disk_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___93054 = cljs.core.deref(frontend.components.diff.disk_value);
if(cljs.core.truth_(temp__5804__auto___93054)){
var value_93055 = temp__5804__auto___93054;
frontend.handler.file_based.file.alter_file(repo,path,value_93055,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))]),daiquiri.core.create_element("div",{'className':"flex-1 mt-8 sm:ml-4 sm:mt-0"},[daiquiri.core.create_element("div",{'className':"mb-2"},["In Logseq:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.db_value),'onChange':rum.core.mark_sync_update((function (e){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["new-value: ",frontend.util.evalue(e)], 0));

return cljs.core.reset_BANG_(frontend.components.diff.db_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(db_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___93060 = cljs.core.deref(frontend.components.diff.db_value);
if(cljs.core.truth_(temp__5804__auto___93060)){
var value_93061 = temp__5804__auto___93060;
frontend.handler.file_based.file.alter_file(repo,path,value_93061,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))])])]:[daiquiri.interpreter.interpret(attrs93022),daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex flex-col mt-4 sm:flex-row"},[daiquiri.core.create_element("div",{'className':"flex-1"},[daiquiri.core.create_element("div",{'className':"mb-2"},["On disk:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.disk_value),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(frontend.components.diff.disk_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(disk_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___93067 = cljs.core.deref(frontend.components.diff.disk_value);
if(cljs.core.truth_(temp__5804__auto___93067)){
var value_93068 = temp__5804__auto___93067;
frontend.handler.file_based.file.alter_file(repo,path,value_93068,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))]),daiquiri.core.create_element("div",{'className':"flex-1 mt-8 sm:ml-4 sm:mt-0"},[daiquiri.core.create_element("div",{'className':"mb-2"},["In Logseq:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.db_value),'onChange':rum.core.mark_sync_update((function (e){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["new-value: ",frontend.util.evalue(e)], 0));

return cljs.core.reset_BANG_(frontend.components.diff.db_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(db_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___93069 = cljs.core.deref(frontend.components.diff.db_value);
if(cljs.core.truth_(temp__5804__auto___93069)){
var value_93070 = temp__5804__auto___93069;
frontend.handler.file_based.file.alter_file(repo,path,value_93070,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))])])]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.components.diff.disk_value,null);

cljs.core.reset_BANG_(frontend.components.diff.db_value,null);

return state;
})], null)], null),"frontend.components.diff/local-file");

//# sourceMappingURL=frontend.components.diff.js.map
