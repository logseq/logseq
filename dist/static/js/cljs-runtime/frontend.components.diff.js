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
return daiquiri.core.create_element("div",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$diff$iter__127950(s__127951){
return (new cljs.core.LazySeq(null,(function (){
var s__127951__$1 = s__127951;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__127951__$1);
if(temp__5804__auto__){
var s__127951__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__127951__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__127951__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__127953 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__127952 = (0);
while(true){
if((i__127952 < size__5479__auto__)){
var vec__127954 = cljs.core._nth(c__5478__auto__,i__127952);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127954,(0),null);
var map__127957 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127954,(1),null);
var map__127957__$1 = cljs.core.__destructure_map(map__127957);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127957__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127957__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127957__$1,new cljs.core.Keyword(null,"value","value",305978217));
cljs.core.chunk_append(b__127953,(function (){var bg_color = (cljs.core.truth_(added)?"#057a55":(cljs.core.truth_(removed)?"#d61f69":"initial"
));
return daiquiri.core.create_element("span",{'key':idx,'style':{'backgroundColor':bg_color},'className':"diff"},[daiquiri.interpreter.interpret(value)]);
})());

var G__128024 = (i__127952 + (1));
i__127952 = G__128024;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__127953),frontend$components$diff$iter__127950(cljs.core.chunk_rest(s__127951__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__127953),null);
}
} else {
var vec__127958 = cljs.core.first(s__127951__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127958,(0),null);
var map__127961 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127958,(1),null);
var map__127961__$1 = cljs.core.__destructure_map(map__127961);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127961__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127961__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__127961__$1,new cljs.core.Keyword(null,"value","value",305978217));
return cljs.core.cons((function (){var bg_color = (cljs.core.truth_(added)?"#057a55":(cljs.core.truth_(removed)?"#d61f69":"initial"
));
return daiquiri.core.create_element("span",{'key':idx,'style':{'backgroundColor':bg_color},'className':"diff"},[daiquiri.interpreter.interpret(value)]);
})(),frontend$components$diff$iter__127950(cljs.core.rest(s__127951__$2)));
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

return daiquiri.core.create_element("div",{'className':"cp__diff-file"},[daiquiri.core.create_element("div",{'className':"cp__diff-file-header"},[(function (){var attrs128008 = logseq.shui.ui.tabler_icon("info-triangle");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs128008))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__diff-file-header-content","pl-1"], null)], null),attrs128008], 0))):{'className':"cp__diff-file-header-content pl-1"}),((cljs.core.map_QMARK_(attrs128008))?[daiquiri.core.create_element("span",null,[["File ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"has been modified on the disk."].join('')])]:[daiquiri.interpreter.interpret(attrs128008),daiquiri.core.create_element("span",null,[["File ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"has been modified on the disk."].join('')])]));
})()]),(function (){var attrs128003 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(disk_content),clojure.string.trim(db_content)))?frontend.ui.foldable((function (){var G__128009 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-0"], null);
var G__128010 = "Check diff";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__128009,G__128010) : logseq.shui.ui.button.call(null,G__128009,G__128010));
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
var diff_QMARK_ = cljs.core.some((function (p__128011){
var vec__128012 = p__128011;
var _idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128012,(0),null);
var map__128015 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128012,(1),null);
var map__128015__$1 = cljs.core.__destructure_map(map__128015);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128015__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var removed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128015__$1,new cljs.core.Keyword(null,"removed","removed",609626430));
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128003))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-4"], null)], null),attrs128003], 0))):{'className':"p-4"}),((cljs.core.map_QMARK_(attrs128003))?[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex flex-col mt-4 sm:flex-row"},[daiquiri.core.create_element("div",{'className':"flex-1"},[daiquiri.core.create_element("div",{'className':"mb-2"},["On disk:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.disk_value),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(frontend.components.diff.disk_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(disk_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___128025 = cljs.core.deref(frontend.components.diff.disk_value);
if(cljs.core.truth_(temp__5804__auto___128025)){
var value_128026 = temp__5804__auto___128025;
frontend.handler.file_based.file.alter_file(repo,path,value_128026,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))]),daiquiri.core.create_element("div",{'className':"flex-1 mt-8 sm:ml-4 sm:mt-0"},[daiquiri.core.create_element("div",{'className':"mb-2"},["In Logseq:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.db_value),'onChange':rum.core.mark_sync_update((function (e){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["new-value: ",frontend.util.evalue(e)], 0));

return cljs.core.reset_BANG_(frontend.components.diff.db_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(db_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___128027 = cljs.core.deref(frontend.components.diff.db_value);
if(cljs.core.truth_(temp__5804__auto___128027)){
var value_128028 = temp__5804__auto___128027;
frontend.handler.file_based.file.alter_file(repo,path,value_128028,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))])])]:[daiquiri.interpreter.interpret(attrs128003),daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex flex-col mt-4 sm:flex-row"},[daiquiri.core.create_element("div",{'className':"flex-1"},[daiquiri.core.create_element("div",{'className':"mb-2"},["On disk:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.disk_value),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(frontend.components.diff.disk_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(disk_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___128029 = cljs.core.deref(frontend.components.diff.disk_value);
if(cljs.core.truth_(temp__5804__auto___128029)){
var value_128030 = temp__5804__auto___128029;
frontend.handler.file_based.file.alter_file(repo,path,value_128030,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0)))]),daiquiri.core.create_element("div",{'className':"flex-1 mt-8 sm:ml-4 sm:mt-0"},[daiquiri.core.create_element("div",{'className':"mb-2"},["In Logseq:"]),daiquiri.core.create_element("textarea",{'value':rum.core.react(frontend.components.diff.db_value),'onChange':rum.core.mark_sync_update((function (e){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["new-value: ",frontend.util.evalue(e)], 0));

return cljs.core.reset_BANG_(frontend.components.diff.db_value,frontend.util.evalue(e));
})),'className':"overflow-auto"},[daiquiri.interpreter.interpret(db_content)]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Select this",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___128031 = cljs.core.deref(frontend.components.diff.db_value);
if(cljs.core.truth_(temp__5804__auto___128031)){
var value_128032 = temp__5804__auto___128031;
frontend.handler.file_based.file.alter_file(repo,path,value_128032,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
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
