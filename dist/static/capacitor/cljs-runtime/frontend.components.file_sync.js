goog.provide('frontend.components.file_sync');
frontend.components.file_sync.clone_local_icloud_graph_panel = rum.core.lazy_build(rum.core.build_defc,(function (repo,graph_name,close_fn){
logseq.shui.hooks.use_effect_BANG_((function (){
var G__91786 = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
if((G__91786 == null)){
return null;
} else {
return G__91786.complete();
}
}),cljs.core.PersistentVector.EMPTY);

var graph_dir = frontend.config.get_repo_dir(repo);
var vec__91787 = rum.core.use_state("");
var selected_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91787,(0),null);
var set_selected_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91787,(1),null);
var selected_path_QMARK_ = (((!(clojure.string.blank_QMARK_(selected_path)))) && ((!(frontend.mobile.util.in_iCloud_container_path_QMARK_(selected_path)))));
var on_confirm = (function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = selected_path_QMARK_;
if(and__5000__auto__){
return [clojure.string.replace(selected_path,/\/+$/,""),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name)].join('');
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var dest_dir = temp__5804__auto__;
return (cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"copyDirectory","copyDirectory",1154233935),graph_dir,dest_dir], 0)):(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?frontend.fs.copy_BANG_(repo,graph_dir,dest_dir):null
)).then((function (){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Cloned to => ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(dest_dir)].join(''),new cljs.core.Keyword(null,"success","success",1890645906));

frontend.handler.file_based.native_fs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$1(dest_dir);

frontend.handler.repo.remove_repo_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),repo], null));

return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
})).catch((function (p1__91784_SHARP_){
return console.error(p1__91784_SHARP_);
}));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs91795 = frontend.ui.icon("folders");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91795))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs91795], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs91795))?null:[daiquiri.interpreter.interpret(attrs91795)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},["Clone your local graph away from ",daiquiri.core.create_element("strong",null,["\u2601\uFE0F"])," iCloud!"]),daiquiri.core.create_element("h2",{'className':"text-center opacity-70 text-xs leading-5"},["Unfortunately, Logseq Sync and iCloud don't work perfectly together at the moment. To make sure",daiquiri.core.create_element("br",null,null),"You can always delete the remote graph at a later point."]),daiquiri.core.create_element("div",{'className':"folder-tip flex flex-col items-center"},[daiquiri.core.create_element("h3",null,[(function (){var attrs91803 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91803))?daiquiri.interpreter.element_attributes(attrs91803):null),((cljs.core.map_QMARK_(attrs91803))?[(function (){var attrs91804 = logseq.common.util.safe_decode_uri_component(graph_name);
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs91804))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs91804], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs91804))?null:[daiquiri.interpreter.interpret(attrs91804)]));
})()]:[daiquiri.interpreter.interpret(attrs91803),(function (){var attrs91805 = logseq.common.util.safe_decode_uri_component(graph_name);
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs91805))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs91805], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs91805))?null:[daiquiri.interpreter.interpret(attrs91805)]));
})()]));
})()]),(function (){var attrs91796 = frontend.config.get_string_repo_dir(repo);
return daiquiri.core.create_element("h4",((cljs.core.map_QMARK_(attrs91796))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-6"], null)], null),attrs91796], 0))):{'className':"px-6"}),((cljs.core.map_QMARK_(attrs91796))?null:[daiquiri.interpreter.interpret(attrs91796)]));
})(),(((!(clojure.string.blank_QMARK_(selected_path))))?(function (){var attrs91797 = ((frontend.mobile.util.in_iCloud_container_path_QMARK_(selected_path))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-block.pr-1.text-error.scale-75","span.inline-block.pr-1.text-error.scale-75",-1956736057),frontend.ui.icon("alert-circle")], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-block.pr-1.text-success.scale-75","span.inline-block.pr-1.text-success.scale-75",1932768332),frontend.ui.icon("circle-check")], null));
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs91797))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","pt-1","-mb-1","flex","items-center","leading-none"], null)], null),attrs91797], 0))):{'className':"text-xs pt-1 -mb-1 flex items-center leading-none"}),((cljs.core.map_QMARK_(attrs91797))?[daiquiri.interpreter.interpret(selected_path)]:[daiquiri.interpreter.interpret(attrs91797),daiquiri.interpreter.interpret(selected_path)]));
})():null),(function (){var attrs91802 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.leading-none.opacity-90","span.inline-flex.items-center.leading-none.opacity-90",1106304784),"Select new parent folder outside of iCloud",frontend.ui.icon("arrow-right")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openDialog"], 0))),(function (path){
return promesa.protocols._promise((set_selected_path.cljs$core$IFn$_invoke$arity$1 ? set_selected_path.cljs$core$IFn$_invoke$arity$1(path) : set_selected_path.call(null,path)));
}));
}));
} else {
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.chain.cljs$core$IFn$_invoke$arity$2(frontend.mobile.util.folder_picker.pickFolder(),(function (p1__91785_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__91785_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}))),(function (p__91806){
var map__91807 = p__91806;
var map__91807__$1 = cljs.core.__destructure_map(map__91807);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91807__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var _localDocumentsPath = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91807__$1,new cljs.core.Keyword(null,"_localDocumentsPath","_localDocumentsPath",-419062105));
return promesa.protocols._promise((set_selected_path.cljs$core$IFn$_invoke$arity$1 ? set_selected_path.cljs$core$IFn$_invoke$arity$1(path) : set_selected_path.call(null,path)));
}));
}));
} else {
return null;

}
}
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91802))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["out-icloud"], null)], null),attrs91802], 0))):{'className':"out-icloud"}),((cljs.core.map_QMARK_(attrs91802))?null:[daiquiri.interpreter.interpret(attrs91802)]));
})()]),(function (){var attrs91794 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs91794))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","space-x-2","pt-6","flex","justify-center","sm:justify-end","-mb-2"], null)], null),attrs91794], 0))):{'className':"flex items-center space-x-2 pt-6 flex justify-center sm:justify-end -mb-2"}),((cljs.core.map_QMARK_(attrs91794))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Clone graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(selected_path_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]:[daiquiri.interpreter.interpret(attrs91794),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Clone graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(selected_path_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]));
})()]);
}),null,"frontend.components.file-sync/clone-local-icloud-graph-panel");
frontend.components.file_sync.create_remote_graph_panel = rum.core.lazy_build(rum.core.build_defc,(function (repo,graph_name,close_fn){
logseq.shui.hooks.use_effect_BANG_((function (){
var G__91808 = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
if((G__91808 == null)){
return null;
} else {
return G__91808.complete();
}
}),cljs.core.PersistentVector.EMPTY);

var on_confirm = (function (){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_91844){
var state_val_91845 = (state_91844[(1)]);
if((state_val_91845 === (7))){
var state_91844__$1 = state_91844;
var statearr_91846_92216 = state_91844__$1;
(statearr_91846_92216[(2)] = null);

(statearr_91846_92216[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91845 === (1))){
var inst_91809 = (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
var inst_91810 = frontend.mobile.util.in_iCloud_container_path_QMARK_(repo);
var state_91844__$1 = (function (){var statearr_91847 = state_91844;
(statearr_91847[(7)] = inst_91809);

return statearr_91847;
})();
if(inst_91810){
var statearr_91848_92217 = state_91844__$1;
(statearr_91848_92217[(1)] = (2));

} else {
var statearr_91849_92218 = state_91844__$1;
(statearr_91849_92218[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91845 === (4))){
var inst_91842 = (state_91844[(2)]);
var state_91844__$1 = state_91844;
return cljs.core.async.impl.ioc_helpers.return_chan(state_91844__$1,inst_91842);
} else {
if((state_val_91845 === (6))){
var inst_91823 = frontend.fs.sync._LT_sync_start();
var state_91844__$1 = state_91844;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91844__$1,(9),inst_91823);
} else {
if((state_val_91845 === (3))){
var inst_91814 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_91815 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_91816 = (new cljs.core.PersistentVector(null,2,(5),inst_91814,inst_91815,null));
var inst_91817 = frontend.state.set_state_BANG_(inst_91816,true);
var inst_91818 = frontend.handler.file_sync.create_graph(graph_name);
var state_91844__$1 = (function (){var statearr_91850 = state_91844;
(statearr_91850[(8)] = inst_91817);

return statearr_91850;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91844__$1,(5),inst_91818);
} else {
if((state_val_91845 === (2))){
var inst_91812 = (frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1(repo) : frontend.components.file_sync.open_icloud_graph_clone_picker.call(null,repo));
var state_91844__$1 = state_91844;
var statearr_91851_92219 = state_91844__$1;
(statearr_91851_92219[(2)] = inst_91812);

(statearr_91851_92219[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91845 === (9))){
var inst_91821 = (state_91844[(9)]);
var inst_91825 = (state_91844[(2)]);
var inst_91826 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_91827 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_91828 = (new cljs.core.PersistentVector(null,2,(5),inst_91826,inst_91827,null));
var inst_91829 = frontend.state.set_state_BANG_(inst_91828,false);
var inst_91830 = [new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),new cljs.core.Keyword(null,"GraphName","GraphName",-960661337)];
var inst_91831 = [inst_91821,graph_name];
var inst_91832 = cljs.core.PersistentHashMap.fromArrays(inst_91830,inst_91831);
var inst_91833 = frontend.state.add_remote_graph_BANG_(inst_91832);
var inst_91834 = (function (){var temp__5804__auto__ = inst_91821;
var GraphUUID = inst_91821;
return (function (r){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r),repo)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(r,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),GraphUUID,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),graph_name,new cljs.core.Keyword(null,"remote?","remote?",-517415110),true], 0));
} else {
return r;
}
});
})();
var inst_91835 = frontend.state.get_repos();
var inst_91836 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(inst_91834,inst_91835);
var inst_91837 = frontend.state.set_repos_BANG_(inst_91836);
var state_91844__$1 = (function (){var statearr_91852 = state_91844;
(statearr_91852[(10)] = inst_91825);

(statearr_91852[(11)] = inst_91829);

(statearr_91852[(12)] = inst_91833);

return statearr_91852;
})();
var statearr_91853_92220 = state_91844__$1;
(statearr_91853_92220[(2)] = inst_91837);

(statearr_91853_92220[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91845 === (5))){
var inst_91821 = (state_91844[(9)]);
var inst_91820 = (state_91844[(2)]);
var inst_91821__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_91820,(2));
var state_91844__$1 = (function (){var statearr_91854 = state_91844;
(statearr_91854[(9)] = inst_91821__$1);

return statearr_91854;
})();
if(cljs.core.truth_(inst_91821__$1)){
var statearr_91855_92221 = state_91844__$1;
(statearr_91855_92221[(1)] = (6));

} else {
var statearr_91856_92222 = state_91844__$1;
(statearr_91856_92222[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91845 === (8))){
var inst_91840 = (state_91844[(2)]);
var state_91844__$1 = state_91844;
var statearr_91857_92223 = state_91844__$1;
(statearr_91857_92223[(2)] = inst_91840);

(statearr_91857_92223[(1)] = (4));


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
}
}
});
return (function() {
var frontend$components$file_sync$state_machine__32051__auto__ = null;
var frontend$components$file_sync$state_machine__32051__auto____0 = (function (){
var statearr_91858 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_91858[(0)] = frontend$components$file_sync$state_machine__32051__auto__);

(statearr_91858[(1)] = (1));

return statearr_91858;
});
var frontend$components$file_sync$state_machine__32051__auto____1 = (function (state_91844){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_91844);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e91859){var ex__32054__auto__ = e91859;
var statearr_91860_92224 = state_91844;
(statearr_91860_92224[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_91844[(4)]))){
var statearr_91861_92225 = state_91844;
(statearr_91861_92225[(1)] = cljs.core.first((state_91844[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__92226 = state_91844;
state_91844 = G__92226;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32051__auto__ = function(state_91844){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32051__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32051__auto____1.call(this,state_91844);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32051__auto____0;
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32051__auto____1;
return frontend$components$file_sync$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_91862 = f__32125__auto__();
(statearr_91862[(6)] = c__32124__auto__);

return statearr_91862;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs91868 = frontend.ui.icon("cloud-upload",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91868))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs91868], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs91868))?null:[daiquiri.interpreter.interpret(attrs91868)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},["Are you sure you want to create a new remote graph?"]),daiquiri.core.create_element("h2",{'className':"text-center opacity-70 text-xs"},["By continuing this action you will create an encrypted cloud version of your current local graph.",daiquiri.core.create_element("br",null,null),"You can always delete the remote graph at a later point."]),daiquiri.core.create_element("div",{'className':"folder-tip flex flex-col items-center"},[daiquiri.core.create_element("h3",null,[(function (){var attrs91870 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91870))?daiquiri.interpreter.element_attributes(attrs91870):null),((cljs.core.map_QMARK_(attrs91870))?[(function (){var attrs91871 = graph_name;
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs91871))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs91871], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs91871))?null:[daiquiri.interpreter.interpret(attrs91871)]));
})()]:[daiquiri.interpreter.interpret(attrs91870),(function (){var attrs91872 = graph_name;
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs91872))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs91872], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs91872))?null:[daiquiri.interpreter.interpret(attrs91872)]));
})()]));
})(),(function (){var attrs91873 = frontend.ui.icon("arrow-right");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91873))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","scale-75"], null)], null),attrs91873], 0))):{'className':"opacity-50 scale-75"}),((cljs.core.map_QMARK_(attrs91873))?null:[daiquiri.interpreter.interpret(attrs91873)]));
})(),(function (){var attrs91874 = frontend.ui.icon("cloud-lock");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91874))?daiquiri.interpreter.element_attributes(attrs91874):null),((cljs.core.map_QMARK_(attrs91874))?null:[daiquiri.interpreter.interpret(attrs91874)]));
})()]),(function (){var attrs91869 = frontend.config.get_string_repo_dir(repo);
return daiquiri.core.create_element("h4",((cljs.core.map_QMARK_(attrs91869))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-4"], null)], null),attrs91869], 0))):{'className':"px-4"}),((cljs.core.map_QMARK_(attrs91869))?null:[daiquiri.interpreter.interpret(attrs91869)]));
})()]),(function (){var attrs91867 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs91867))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","space-x-2","pt-6","flex","justify-center","sm:justify-end","-mb-2"], null)], null),attrs91867], 0))):{'className':"flex items-center space-x-2 pt-6 flex justify-center sm:justify-end -mb-2"}),((cljs.core.map_QMARK_(attrs91867))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create remote graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]:[daiquiri.interpreter.interpret(attrs91867),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create remote graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]));
})()]);
}),null,"frontend.components.file-sync/create-remote-graph-panel");
frontend.components.file_sync.last_synced_cp = rum.core.lazy_build(rum.core.build_defc,(function (){
var last_synced_at = frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),frontend.state.get_current_file_sync_graph_uuid(),new cljs.core.Keyword("file-sync","last-synced-at","file-sync/last-synced-at",1623190259)], null));
var last_synced_at__$1 = (cljs.core.truth_(last_synced_at)?frontend.util.human_time(cljs_time.coerce.from_long((last_synced_at * (1000)))):"just now");
return daiquiri.core.create_element("div",{'className':"cl"},[daiquiri.core.create_element("span",{'className':"opacity-60"},["Last change was"]),(function (){var attrs91877 = last_synced_at__$1;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91877))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs91877], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs91877))?null:[attrs91877]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.file-sync/last-synced-cp");
frontend.components.file_sync.sync_now = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Sync now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"block cursor-pointer",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.async.offer_BANG_(frontend.fs.sync.immediately_local__GT_remote_chan,true);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"#ffffff"], null)], 0)));
}),null,"frontend.components.file-sync/sync-now");
frontend.components.file_sync._STAR_last_calculated_time = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.file_sync.indicator_progress_pane = rum.core.lazy_build(rum.core.build_defc,(function (sync_state,sync_progress,p__91881){
var map__91882 = p__91881;
var map__91882__$1 = cljs.core.__destructure_map(map__91882);
var idle_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"idle?","idle?",1779138705));
var syncing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"syncing?","syncing?",-474023112));
var no_active_files_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"no-active-files?","no-active-files?",1828838351));
var online_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"online?","online?",-1144837492));
var history_files_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"history-files?","history-files?",682465563));
var queuing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91882__$1,new cljs.core.Keyword(null,"queuing?","queuing?",-550117936));
logseq.shui.hooks.use_effect_BANG_((function (){
return (function (){
return cljs.core.reset_BANG_(frontend.components.file_sync._STAR_last_calculated_time,null);
});
}),cljs.core.PersistentVector.EMPTY);

var uploading_files = new cljs.core.Keyword(null,"current-local->remote-files","current-local->remote-files",-183130256).cljs$core$IFn$_invoke$arity$1(sync_state);
var downloading_files = new cljs.core.Keyword(null,"current-remote->local-files","current-remote->local-files",1479283085).cljs$core$IFn$_invoke$arity$1(sync_state);
var uploading_QMARK_ = cljs.core.seq(uploading_files);
var downloading_QMARK_ = cljs.core.seq(downloading_files);
var progressing_QMARK_ = ((uploading_QMARK_) || (downloading_QMARK_));
var full_upload_files = new cljs.core.Keyword(null,"full-local->remote-files","full-local->remote-files",224642435).cljs$core$IFn$_invoke$arity$1(sync_state);
var full_download_files = new cljs.core.Keyword(null,"full-remote->local-files","full-remote->local-files",1421172401).cljs$core$IFn$_invoke$arity$1(sync_state);
var calc_progress_total = (function (){
if(uploading_QMARK_){
return cljs.core.count(full_upload_files);
} else {
if(downloading_QMARK_){
return cljs.core.count(full_download_files);
} else {
return (0);

}
}
});
var calc_progress_finished = (function (){
var current_sync_files = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168),((cljs.core.seq(full_upload_files)) || (cljs.core.seq(full_download_files)))));
return cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__91878_SHARP_){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"percent","percent",2031453817).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__91878_SHARP_)),(100))) && (cljs.core.contains_QMARK_(current_sync_files,cljs.core.first(p1__91878_SHARP_))));
}),sync_progress));
});
var calc_time_left = (function (){
var last_calculated_at = new cljs.core.Keyword(null,"calculated-at","calculated-at",1296184984).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.components.file_sync._STAR_last_calculated_time));
var now = cljs_time.coerce.to_epoch(cljs_time.core.now());
if(cljs.core.truth_((function (){var and__5000__auto__ = last_calculated_at;
if(cljs.core.truth_(and__5000__auto__)){
return ((now - last_calculated_at) < (10));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.components.file_sync._STAR_last_calculated_time));
} else {
var result = frontend.handler.file_sync.calculate_time_left(sync_state,sync_progress);
cljs.core.reset_BANG_(frontend.components.file_sync._STAR_last_calculated_time,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"calculated-at","calculated-at",1296184984),now,new cljs.core.Keyword(null,"result","result",1415092211),result], null));

return result;
}
});
var p_total = (cljs.core.truth_(syncing_QMARK_)?calc_progress_total():(0));
var p_finished = (cljs.core.truth_(syncing_QMARK_)?calc_progress_finished():(0));
var tip_b_AMPERSAND_p = (cljs.core.truth_((function (){var and__5000__auto__ = syncing_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return progressing_QMARK_;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("%s of %s files",p_finished,p_total) : frontend.util.format.call(null,"%s of %s files",p_finished,p_total))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.progress-bar","div.progress-bar",929518721),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((((p_total > (0)))?((p_finished / p_total) * (100)):(0))),"%"].join('')], null)], null)], null)], null)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-60","span.opacity-60",-1080417386),"all file edits"], null),frontend.components.file_sync.last_synced_cp()], null));
var _STAR_el_ref = rum.core.use_ref(null);
var vec__91883 = rum.core.use_state((function (p1__91879_SHARP_){
if((p1__91879_SHARP_ == null)){
return true;
} else {
return p1__91879_SHARP_;
}
})(frontend.storage.get(new cljs.core.Keyword("ui","file-sync-active-file-list?","ui/file-sync-active-file-list?",2000179644))));
var list_active_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91883,(0),null);
var set_list_active_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91883,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var G__91890 = rum.core.deref(_STAR_el_ref);
var G__91890__$1 = (((G__91890 == null))?null:G__91890.closest(".menu-links-outer"));
if((G__91890__$1 == null)){
return null;
} else {
return G__91890__$1.classList;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var outer_class_list = temp__5804__auto__;
(function (p1__91880_SHARP_){
if(cljs.core.truth_(list_active_QMARK_)){
return outer_class_list.add(p1__91880_SHARP_);
} else {
return outer_class_list.remove(p1__91880_SHARP_);
}
})("is-list-active");

return frontend.storage.set(new cljs.core.Keyword("ui","file-sync-active-file-list?","ui/file-sync-active-file-list?",2000179644),list_active_QMARK_);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [list_active_QMARK_], null));

var idle__AMPERSAND__no_active_QMARK_ = (function (){var and__5000__auto__ = idle_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return no_active_files_QMARK_;
} else {
return and__5000__auto__;
}
})();
var waiting_QMARK_ = cljs.core.not((function (){var or__5002__auto__ = cljs.core.not(online_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = idle__AMPERSAND__no_active_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return syncing_QMARK_;
}
}
})());
return daiquiri.core.create_element("div",{'ref':_STAR_el_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__file-sync-indicator-progress-pane",(cljs.core.truth_((function (){var and__5000__auto__ = syncing_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return progressing_QMARK_;
} else {
return and__5000__auto__;
}
})())?"is-progress-active":null)], null))},[daiquiri.core.create_element("div",{'className':"a"},[daiquiri.core.create_element("div",{'className':"al"},[daiquiri.core.create_element("strong",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(idle__AMPERSAND__no_active_QMARK_)?"is-no-active":null)], null))},[((cljs.core.not(online_QMARK_))?daiquiri.interpreter.interpret(frontend.ui.icon("wifi-off")):((uploading_QMARK_)?daiquiri.interpreter.interpret(frontend.ui.icon("arrow-up")):((downloading_QMARK_)?daiquiri.interpreter.interpret(frontend.ui.icon("arrow-down")):daiquiri.interpreter.interpret(frontend.ui.icon("thumb-up"))
)))]),daiquiri.core.create_element("span",null,[((cljs.core.not(online_QMARK_))?"Currently having connection issues...":(cljs.core.truth_(idle__AMPERSAND__no_active_QMARK_)?"Everything is synced!":(cljs.core.truth_(syncing_QMARK_)?"Currently syncing your graph...":"Waiting..."
)))])]),(function (){var attrs91891 = (cljs.core.truth_(queuing_QMARK_)?frontend.components.file_sync.sync_now():null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91891))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ar"], null)], null),attrs91891], 0))):{'className':"ar"}),((cljs.core.map_QMARK_(attrs91891))?null:[daiquiri.interpreter.interpret(attrs91891)]));
})()]),((waiting_QMARK_)?null:daiquiri.core.create_element("div",{'className':"b dark:text-gray-200"},[daiquiri.core.create_element("div",{'className':"bl"},[(function (){var attrs91892 = (cljs.core.truth_(no_active_files_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-100.pr-1","span.opacity-100.pr-1",-148417813),"Successfully processed"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-60.pr-1","span.opacity-60.pr-1",1607561462),"Processed"], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91892))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs91892], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs91892))?null:[daiquiri.interpreter.interpret(attrs91892)]));
})(),daiquiri.interpreter.interpret(cljs.core.first(tip_b_AMPERSAND_p))]),daiquiri.core.create_element("div",{'className':"br"},[(function (){var attrs91893 = (cljs.core.truth_(syncing_QMARK_)?calc_time_left():null);
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs91893))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50"], null)], null),attrs91893], 0))):{'className':"opacity-50"}),((cljs.core.map_QMARK_(attrs91893))?null:[daiquiri.interpreter.interpret(attrs91893)]));
})()])])),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["c",((waiting_QMARK_)?"pt-2":null)], null))},[daiquiri.interpreter.interpret(cljs.core.second(tip_b_AMPERSAND_p)),(cljs.core.truth_((function (){var or__5002__auto__ = history_files_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(no_active_files_QMARK_);
}
})())?daiquiri.core.create_element("span",{'onClick':(function (){
var G__91894 = cljs.core.not(list_active_QMARK_);
return (set_list_active_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_list_active_QMARK_.cljs$core$IFn$_invoke$arity$1(G__91894) : set_list_active_QMARK_.call(null,G__91894));
}),'className':"inline-flex pl-2 active:opacity-50"},[(cljs.core.truth_(list_active_QMARK_)?daiquiri.interpreter.interpret(frontend.ui.icon("chevron-up",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(24)], null)], null))):daiquiri.interpreter.interpret(frontend.ui.icon("chevron-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(24)], null)], null))))]):null)])]);
}),null,"frontend.components.file-sync/indicator-progress-pane");
frontend.components.file_sync.sort_files = (function frontend$components$file_sync$sort_files(files){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (f){
var or__5002__auto__ = new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(f);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
}),cljs.core._GT_,files);
});
frontend.components.file_sync.indicator = rum.core.lazy_build(rum.core.build_defcs,(function (_state){
var _ = frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946));
var online_QMARK_ = frontend.state.sub(new cljs.core.Keyword("network","online?","network/online?",1306822774));
var enabled_progress_panel_QMARK_ = true;
var current_repo = frontend.state.get_current_repo();
var creating_remote_graph_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)], null));
var current_graph_id = frontend.state.sub_current_file_sync_graph_uuid();
var sync_state = frontend.state.sub_file_sync_state(current_graph_id);
var sync_progress = frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),current_graph_id,new cljs.core.Keyword("file-sync","progress","file-sync/progress",-1051866953)], null));
var ___$1 = rum.core.react(frontend.handler.file_sync.refresh_file_sync_component);
var synced_file_graph_QMARK_ = frontend.handler.file_sync.synced_file_graph_QMARK_(current_repo);
var uploading_files = frontend.components.file_sync.sort_files(new cljs.core.Keyword(null,"current-local->remote-files","current-local->remote-files",-183130256).cljs$core$IFn$_invoke$arity$1(sync_state));
var downloading_files = frontend.components.file_sync.sort_files(new cljs.core.Keyword(null,"current-remote->local-files","current-remote->local-files",1479283085).cljs$core$IFn$_invoke$arity$1(sync_state));
var queuing_files = new cljs.core.Keyword(null,"queued-local->remote-files","queued-local->remote-files",1051660812).cljs$core$IFn$_invoke$arity$1(sync_state);
var history_files = new cljs.core.Keyword(null,"history","history",-247395220).cljs$core$IFn$_invoke$arity$1(sync_state);
var status = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(sync_state);
var status__$1 = (function (){var or__5002__auto__ = (status == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.name(status));
}
})();
var off_QMARK_ = frontend.fs.sync.sync_off_QMARK_(sync_state);
var full_syncing_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"local->remote-full-sync","local->remote-full-sync",-542133906),null,new cljs.core.Keyword(null,"remote->local-full-sync","remote->local-full-sync",-1658033000),null], null), null),status__$1);
var syncing_QMARK_ = ((full_syncing_QMARK_) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remote->local","remote->local",2046829451),null,new cljs.core.Keyword(null,"local->remote","local->remote",-1724677356),null], null), null),status__$1)));
var idle_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"idle","idle",-2007156861),null], null), null),status__$1);
var need_password_QMARK_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"need-password","need-password",-2018968752),null], null), null),status__$1)) && (cljs.core.not(frontend.fs.sync.graph_encrypted_QMARK_())));
var queuing_QMARK_ = ((idle_QMARK_) && (cljs.core.boolean$(cljs.core.seq(queuing_files))));
var no_active_files_QMARK_ = cljs.core.empty_QMARK_(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(downloading_files,queuing_files,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([uploading_files], 0)));
var create_remote_graph_fn = (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
} else {
return and__5000__auto__;
}
})())){
var graph_name = decodeURI((frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(current_repo) : frontend.util.node_path.basename.call(null,current_repo)));
var confirm_fn = (function (p__91895){
var map__91896 = p__91895;
var map__91896__$1 = cljs.core.__destructure_map(map__91896);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91896__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.components.file_sync.create_remote_graph_panel(current_repo,graph_name,close);
});
var G__91897 = confirm_fn;
var G__91898 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__91897,G__91898) : logseq.shui.ui.dialog_open_BANG_.call(null,G__91897,G__91898));
} else {
return null;
}
});
var turn_on = goog.functions.debounce((function (){
if(cljs.core.truth_(frontend.handler.file_sync.current_graph_sync_on_QMARK_())){
return null;
} else {
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_91985){
var state_val_91986 = (state_91985[(1)]);
if((state_val_91986 === (7))){
var state_91985__$1 = state_91985;
var statearr_91987_92227 = state_91985__$1;
(statearr_91987_92227[(2)] = null);

(statearr_91987_92227[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (20))){
var inst_91936 = (state_91985[(7)]);
var state_91985__$1 = state_91985;
var statearr_91988_92228 = state_91985__$1;
(statearr_91988_92228[(2)] = inst_91936);

(statearr_91988_92228[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (27))){
var inst_91899 = (state_91985[(8)]);
var inst_91956 = cljs.core.deref(inst_91899);
var inst_91957 = cljs.core.second(inst_91956);
var state_91985__$1 = state_91985;
if(cljs.core.truth_(inst_91957)){
var statearr_91989_92229 = state_91985__$1;
(statearr_91989_92229[(1)] = (29));

} else {
var statearr_91990_92230 = state_91985__$1;
(statearr_91990_92230[(1)] = (30));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (1))){
var inst_91899 = (state_91985[(8)]);
var inst_91899__$1 = frontend.fs.sync.graphs_txid;
var inst_91900 = inst_91899__$1.frontend$util$persist_var$ILoad$_load$arity$1(null);
var inst_91901 = cljs.core.async.interop.p__GT_c(inst_91900);
var state_91985__$1 = (function (){var statearr_91991 = state_91985;
(statearr_91991[(8)] = inst_91899__$1);

return statearr_91991;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91985__$1,(2),inst_91901);
} else {
if((state_val_91986 === (24))){
var inst_91949 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_91992_92231 = state_91985__$1;
(statearr_91992_92231[(2)] = inst_91949);

(statearr_91992_92231[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (4))){
var inst_91911 = frontend.handler.user._LT_user_uuid();
var state_91985__$1 = state_91985;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91985__$1,(6),inst_91911);
} else {
if((state_val_91986 === (15))){
var inst_91929 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_91993_92232 = state_91985__$1;
(statearr_91993_92232[(2)] = inst_91929);

(statearr_91993_92232[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (21))){
var inst_91952 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
if(cljs.core.truth_(inst_91952)){
var statearr_91994_92233 = state_91985__$1;
(statearr_91994_92233[(1)] = (26));

} else {
var statearr_91995_92234 = state_91985__$1;
(statearr_91995_92234[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (31))){
var inst_91977 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_91996_92235 = state_91985__$1;
(statearr_91996_92235[(2)] = inst_91977);

(statearr_91996_92235[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (32))){
var state_91985__$1 = state_91985;
var statearr_91997_92236 = state_91985__$1;
(statearr_91997_92236[(2)] = null);

(statearr_91997_92236[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (33))){
var state_91985__$1 = state_91985;
var statearr_91998_92237 = state_91985__$1;
(statearr_91998_92237[(1)] = (35));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (13))){
var inst_91899 = (state_91985[(8)]);
var inst_91918 = (state_91985[(9)]);
var inst_91923 = cljs.core.deref(inst_91899);
var inst_91924 = cljs.core.first(inst_91923);
var inst_91925 = frontend.fs.sync.check_graph_belong_to_current_user(inst_91918,inst_91924);
var inst_91926 = (!(inst_91925));
var state_91985__$1 = state_91985;
var statearr_92000_92238 = state_91985__$1;
(statearr_92000_92238[(2)] = inst_91926);

(statearr_92000_92238[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (22))){
var inst_91899 = (state_91985[(8)]);
var inst_91942 = cljs.core.deref(inst_91899);
var inst_91943 = cljs.core.second(inst_91942);
var inst_91944 = frontend.fs.sync._LT_check_remote_graph_exists(inst_91943);
var state_91985__$1 = state_91985;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_91985__$1,(25),inst_91944);
} else {
if((state_val_91986 === (36))){
var state_91985__$1 = state_91985;
var statearr_92001_92239 = state_91985__$1;
(statearr_92001_92239[(2)] = null);

(statearr_92001_92239[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (29))){
var inst_91899 = (state_91985[(8)]);
var inst_91959 = (function (){var graphs_txid = inst_91899;
return (function (r){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r),current_repo)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(r,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),new cljs.core.Keyword(null,"remote?","remote?",-517415110)], 0));
} else {
return r;
}
});
})();
var inst_91960 = frontend.state.get_repos();
var inst_91961 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(inst_91959,inst_91960);
var inst_91962 = frontend.state.set_repos_BANG_(inst_91961);
var inst_91963 = create_remote_graph_fn();
var state_91985__$1 = (function (){var statearr_92002 = state_91985;
(statearr_92002[(10)] = inst_91962);

return statearr_92002;
})();
var statearr_92003_92240 = state_91985__$1;
(statearr_92003_92240[(2)] = inst_91963);

(statearr_92003_92240[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (6))){
var inst_91913 = (state_91985[(11)]);
var inst_91913__$1 = (state_91985[(2)]);
var inst_91914 = (inst_91913__$1 instanceof cljs.core.ExceptionInfo);
var state_91985__$1 = (function (){var statearr_92004 = state_91985;
(statearr_92004[(11)] = inst_91913__$1);

return statearr_92004;
})();
if(cljs.core.truth_(inst_91914)){
var statearr_92005_92241 = state_91985__$1;
(statearr_92005_92241[(1)] = (7));

} else {
var statearr_92006_92242 = state_91985__$1;
(statearr_92006_92242[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (28))){
var inst_91979 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_92007_92243 = state_91985__$1;
(statearr_92007_92243[(2)] = inst_91979);

(statearr_92007_92243[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (25))){
var inst_91946 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_92008_92244 = state_91985__$1;
(statearr_92008_92244[(2)] = inst_91946);

(statearr_92008_92244[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (34))){
var inst_91975 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_92009_92245 = state_91985__$1;
(statearr_92009_92245[(2)] = inst_91975);

(statearr_92009_92245[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (17))){
var inst_91899 = (state_91985[(8)]);
var inst_91936 = (state_91985[(7)]);
var inst_91935 = cljs.core.deref(inst_91899);
var inst_91936__$1 = cljs.core.second(inst_91935);
var state_91985__$1 = (function (){var statearr_92010 = state_91985;
(statearr_92010[(7)] = inst_91936__$1);

return statearr_92010;
})();
if(cljs.core.truth_(inst_91936__$1)){
var statearr_92011_92246 = state_91985__$1;
(statearr_92011_92246[(1)] = (19));

} else {
var statearr_92012_92247 = state_91985__$1;
(statearr_92012_92247[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (3))){
var inst_91906 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_91907 = [new cljs.core.Keyword("file-sync","onboarding-tip","file-sync/onboarding-tip",-1267073709),new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)];
var inst_91908 = (new cljs.core.PersistentVector(null,2,(5),inst_91906,inst_91907,null));
var inst_91909 = frontend.state.pub_event_BANG_(inst_91908);
var state_91985__$1 = state_91985;
var statearr_92013_92248 = state_91985__$1;
(statearr_92013_92248[(2)] = inst_91909);

(statearr_92013_92248[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (12))){
var inst_91932 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
if(cljs.core.truth_(inst_91932)){
var statearr_92014_92249 = state_91985__$1;
(statearr_92014_92249[(1)] = (16));

} else {
var statearr_92015_92250 = state_91985__$1;
(statearr_92015_92250[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (2))){
var inst_91903 = (state_91985[(2)]);
var inst_91904 = cljs.core.deref(frontend.handler.file_sync._STAR_beta_unavailable_QMARK_);
var state_91985__$1 = (function (){var statearr_92016 = state_91985;
(statearr_92016[(12)] = inst_91903);

return statearr_92016;
})();
if(cljs.core.truth_(inst_91904)){
var statearr_92017_92251 = state_91985__$1;
(statearr_92017_92251[(1)] = (3));

} else {
var statearr_92018_92252 = state_91985__$1;
(statearr_92018_92252[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (23))){
var inst_91940 = (state_91985[(13)]);
var state_91985__$1 = state_91985;
var statearr_92019_92253 = state_91985__$1;
(statearr_92019_92253[(2)] = inst_91940);

(statearr_92019_92253[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (35))){
var inst_91970 = create_remote_graph_fn();
var state_91985__$1 = state_91985;
var statearr_92020_92254 = state_91985__$1;
(statearr_92020_92254[(2)] = inst_91970);

(statearr_92020_92254[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (19))){
var inst_91899 = (state_91985[(8)]);
var inst_91940 = (state_91985[(13)]);
var inst_91938 = cljs.core.deref(inst_91899);
var inst_91939 = cljs.core.second(inst_91938);
var inst_91940__$1 = frontend.fs.sync.graph_sync_off_QMARK_(inst_91939);
var state_91985__$1 = (function (){var statearr_92021 = state_91985;
(statearr_92021[(13)] = inst_91940__$1);

return statearr_92021;
})();
if(inst_91940__$1){
var statearr_92022_92255 = state_91985__$1;
(statearr_92022_92255[(1)] = (22));

} else {
var statearr_92023_92256 = state_91985__$1;
(statearr_92023_92256[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (11))){
var inst_91920 = (state_91985[(14)]);
var state_91985__$1 = state_91985;
var statearr_92024_92257 = state_91985__$1;
(statearr_92024_92257[(2)] = inst_91920);

(statearr_92024_92257[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (9))){
var inst_91899 = (state_91985[(8)]);
var inst_91920 = (state_91985[(14)]);
var inst_91918 = (state_91985[(2)]);
var inst_91919 = cljs.core.deref(inst_91899);
var inst_91920__$1 = cljs.core.first(inst_91919);
var state_91985__$1 = (function (){var statearr_92025 = state_91985;
(statearr_92025[(9)] = inst_91918);

(statearr_92025[(14)] = inst_91920__$1);

return statearr_92025;
})();
if(cljs.core.truth_(inst_91920__$1)){
var statearr_92026_92258 = state_91985__$1;
(statearr_92026_92258[(1)] = (10));

} else {
var statearr_92027_92259 = state_91985__$1;
(statearr_92027_92259[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (5))){
var inst_91983 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
return cljs.core.async.impl.ioc_helpers.return_chan(state_91985__$1,inst_91983);
} else {
if((state_val_91986 === (14))){
var inst_91918 = (state_91985[(9)]);
var state_91985__$1 = state_91985;
var statearr_92028_92260 = state_91985__$1;
(statearr_92028_92260[(2)] = inst_91918);

(statearr_92028_92260[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (26))){
var inst_91954 = frontend.fs.sync._LT_sync_start();
var state_91985__$1 = state_91985;
var statearr_92029_92261 = state_91985__$1;
(statearr_92029_92261[(2)] = inst_91954);

(statearr_92029_92261[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (16))){
var state_91985__$1 = state_91985;
var statearr_92030_92262 = state_91985__$1;
(statearr_92030_92262[(2)] = null);

(statearr_92030_92262[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (30))){
var inst_91899 = (state_91985[(8)]);
var inst_91965 = cljs.core.deref(inst_91899);
var inst_91966 = cljs.core.second(inst_91965);
var state_91985__$1 = state_91985;
if(cljs.core.truth_(inst_91966)){
var statearr_92031_92263 = state_91985__$1;
(statearr_92031_92263[(1)] = (32));

} else {
var statearr_92032_92264 = state_91985__$1;
(statearr_92032_92264[(1)] = (33));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (10))){
var inst_91918 = (state_91985[(9)]);
var state_91985__$1 = state_91985;
if(cljs.core.truth_(inst_91918)){
var statearr_92033_92265 = state_91985__$1;
(statearr_92033_92265[(1)] = (13));

} else {
var statearr_92034_92266 = state_91985__$1;
(statearr_92034_92266[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (18))){
var inst_91981 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_92035_92267 = state_91985__$1;
(statearr_92035_92267[(2)] = inst_91981);

(statearr_92035_92267[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (37))){
var inst_91973 = (state_91985[(2)]);
var state_91985__$1 = state_91985;
var statearr_92036_92268 = state_91985__$1;
(statearr_92036_92268[(2)] = inst_91973);

(statearr_92036_92268[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_91986 === (8))){
var inst_91913 = (state_91985[(11)]);
var state_91985__$1 = state_91985;
var statearr_92037_92269 = state_91985__$1;
(statearr_92037_92269[(2)] = inst_91913);

(statearr_92037_92269[(1)] = (9));


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
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$components$file_sync$state_machine__32051__auto__ = null;
var frontend$components$file_sync$state_machine__32051__auto____0 = (function (){
var statearr_92038 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_92038[(0)] = frontend$components$file_sync$state_machine__32051__auto__);

(statearr_92038[(1)] = (1));

return statearr_92038;
});
var frontend$components$file_sync$state_machine__32051__auto____1 = (function (state_91985){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_91985);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e92039){var ex__32054__auto__ = e92039;
var statearr_92040_92270 = state_91985;
(statearr_92040_92270[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_91985[(4)]))){
var statearr_92041_92271 = state_91985;
(statearr_92041_92271[(1)] = cljs.core.first((state_91985[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__92272 = state_91985;
state_91985 = G__92272;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32051__auto__ = function(state_91985){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32051__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32051__auto____1.call(this,state_91985);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32051__auto____0;
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32051__auto____1;
return frontend$components$file_sync$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_92042 = f__32125__auto__();
(statearr_92042[(6)] = c__32124__auto__);

return statearr_92042;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}
}),(1500));
if(cljs.core.truth_(creating_remote_graph_QMARK_)){
return daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(""));
} else {
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__file-sync-indicator",frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"is-enabled-progress-pane","is-enabled-progress-pane",1275548472),enabled_progress_panel_QMARK_,new cljs.core.Keyword(null,"has-active-files","has-active-files",-177039525),(!(no_active_files_QMARK_))], null),["status-of-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var and__5000__auto__ = (status__$1 instanceof cljs.core.Keyword);
if(and__5000__auto__){
return cljs.core.name(status__$1);
} else {
return and__5000__auto__;
}
})())].join('')], null))], null))},[(((((!(frontend.config.publishing_QMARK_))) && (frontend.handler.user.logged_in_QMARK_())))?frontend.ui.dropdown_with_links((function (p__92049){
var map__92050 = p__92049;
var map__92050__$1 = cljs.core.__destructure_map(map__92050);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92050__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
if((!(off_QMARK_))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button.cloud.on","a.button.cloud.on",-435823998),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"syncing","syncing",-291323582),syncing_QMARK_,new cljs.core.Keyword(null,"is-full","is-full",436383631),full_syncing_QMARK_,new cljs.core.Keyword(null,"queuing","queuing",-1502477638),queuing_QMARK_,new cljs.core.Keyword(null,"idle","idle",-2007156861),(((!(queuing_QMARK_))) && (idle_QMARK_))], null)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("cloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button.cloud.off","a.button.cloud.off",2106434377),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),turn_on], null),frontend.ui.icon("cloud-off",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null);
}
}),(function (){var G__92051 = cljs.core.vec(((((no_active_files_QMARK_) && (idle_QMARK_)))?null:((need_password_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item.flex.items-center.leading-none.pt-3","div.file-item.flex.items-center.leading-none.pt-3",-1729973654),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(-8)], null)], null),frontend.ui.icon("lock",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1.font-semibold","span.pl-1.font-semibold",-1207931896),"Password is required"], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.fs.sync.sync_need_password_BANG_], null)], null)], null):(((!(no_active_files_QMARK_)))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item.is-first","div.file-item.is-first",-135141546),""], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"is-first-placeholder"], null)], null)], null):null))));
if(cljs.core.truth_(synced_file_graph_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(G__92051,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (f){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["downloading-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(f)].join('')], null),f], null),new cljs.core.Keyword(null,"key","key",-1516042587),["downloading-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(f)].join(''),new cljs.core.Keyword(null,"icon","icon",1679606541),((enabled_progress_panel_QMARK_)?(function (){var progress = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sync_progress,f);
var percent = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"percent","percent",2031453817).cljs$core$IFn$_invoke$arity$1(progress);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
if(((typeof percent === 'number') && ((percent < (100))))){
return frontend.ui.indicator_progress_pie(percent);
} else {
return frontend.ui.icon("circle-check");
}
})():frontend.ui.icon("arrow-narrow-down"))], null);
}),downloading_files),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
var icon = (function (){var G__92052 = e.type;
switch (G__92052) {
case "add":
return "plus";

break;
case "unlink":
return "minus";

break;
default:
return "edit";

}
})();
var path = frontend.fs.sync.relative_path(e);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["queue-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join('')], null),path], null),new cljs.core.Keyword(null,"key","key",-1516042587),["queue-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join(''),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon(icon)], null);
}),cljs.core.take.cljs$core$IFn$_invoke$arity$2((10),queuing_files)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (f){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["uploading-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(f)].join('')], null),f], null),new cljs.core.Keyword(null,"key","key",-1516042587),["uploading-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(f)].join(''),new cljs.core.Keyword(null,"icon","icon",1679606541),((enabled_progress_panel_QMARK_)?(function (){var progress = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sync_progress,f);
var percent = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"percent","percent",2031453817).cljs$core$IFn$_invoke$arity$1(progress);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
if(((typeof percent === 'number') && ((percent < (100))))){
return frontend.ui.indicator_progress_pie(percent);
} else {
return frontend.ui.icon("circle-check");
}
})():frontend.ui.icon("arrow-up"))], null);
}),uploading_files),((cljs.core.seq(history_files))?cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,f){
new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(f);

var temp__5804__auto__ = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(f);
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
var full_path = (function (){var G__92053 = frontend.config.get_repo_dir(current_repo);
var G__92054 = path;
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__92053,G__92054) : frontend.util.node_path.join.call(null,G__92053,G__92054));
})();
var page_name = frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1(full_path);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.files-history.cursor-pointer","div.files-history.cursor-pointer",-1415790468),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),i,new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(i,(0)))?"is-first":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(page_name)){
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),page_name], null));
} else {
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),full_path], null));
}
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.file-sync-item","span.file-sync-item",-1634303923),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(f)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50","div.opacity-50",-874367312),frontend.ui.humanity_time_ago(new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(f),null)], null)], null)], null);
} else {
return null;
}
}),cljs.core.take.cljs$core$IFn$_invoke$arity$2((10),history_files)):null)], 0));
} else {
return G__92051;
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outer-header","outer-header",-1732961785),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.components.file_sync.indicator_progress_pane(sync_state,sync_progress,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"idle?","idle?",1779138705),idle_QMARK_,new cljs.core.Keyword(null,"syncing?","syncing?",-474023112),syncing_QMARK_,new cljs.core.Keyword(null,"need-password?","need-password?",97580677),need_password_QMARK_,new cljs.core.Keyword(null,"full-sync?","full-sync?",-234400018),full_syncing_QMARK_,new cljs.core.Keyword(null,"online?","online?",-1144837492),online_QMARK_,new cljs.core.Keyword(null,"queuing?","queuing?",-550117936),queuing_QMARK_,new cljs.core.Keyword(null,"no-active-files?","no-active-files?",1828838351),no_active_files_QMARK_,new cljs.core.Keyword(null,"history-files?","history-files?",682465563),cljs.core.seq(history_files)], null)),(cljs.core.truth_((function (){var and__5000__auto__ = (!(enabled_progress_panel_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = synced_file_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return queuing_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.head-ctls","div.head-ctls",-822457687),frontend.components.file_sync.sync_now()], null):null)], null)], null)):null)]);
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (){
return cljs.core.identity("file-sync-indicator");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var unsub_fn = frontend.handler.file_sync.setup_file_sync_event_listeners();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.file-sync","unsub-events","frontend.components.file-sync/unsub-events",-1321825907),unsub_fn);
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.components.file-sync","unsub-events","frontend.components.file-sync/unsub-events",-1321825907).cljs$core$IFn$_invoke$arity$1(state),null);

return state;
})], null)], null),"frontend.components.file-sync/indicator");
frontend.components.file_sync.pick_local_graph_for_sync = rum.core.lazy_build(rum.core.build_defc,(function (graph){
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs92065 = frontend.ui.icon("cloud-download",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92065))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs92065], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs92065))?null:[daiquiri.interpreter.interpret(attrs92065)]));
})()]),(function (){var attrs92059 = (function (){var G__92066 = "Sync graph \"%s\" to local";
var G__92067 = new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(graph);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__92066,G__92067) : frontend.util.format.call(null,G__92066,G__92067));
})();
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs92059))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-5","text-2xl","text-center","font-bold"], null)], null),attrs92059], 0))):{'className':"mb-5 text-2xl text-center font-bold"}),((cljs.core.map_QMARK_(attrs92059))?null:[daiquiri.interpreter.interpret(attrs92059)]));
})(),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Open a local directory",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"block w-full mt-4",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"lg","lg",-80787836),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_modal_BANG_();

frontend.fs.sync._LT_sync_stop();

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2((function (p__92070){
var map__92071 = p__92070;
var map__92071__$1 = cljs.core.__destructure_map(map__92071);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92071__$1,new cljs.core.Keyword(null,"url","url",276297046));
frontend.handler.file_sync.init_remote_graph(url,graph);

return setTimeout((function (){
return frontend.handler.repo.refresh_repos_BANG_();
}),(200));
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-open-dir","on-open-dir",1666374285),(function (result){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.file-sync","on-open-dir","frontend.components.file-sync/on-open-dir",-1815698275),result], 0));

var empty_dir_QMARK_ = cljs.core.not(cljs.core.seq(new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(result)));
var root = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(result);
if(clojure.string.blank_QMARK_(root)){
return promesa.core.rejected((new Error(null)));
} else {
if(empty_dir_QMARK_){
return promesa.core.resolved(null);
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"readGraphTxIdInfo","readGraphTxIdInfo",-419437463),root], 0)):frontend.util.fs.read_graphs_txid_info(root)),(function (info){
if((((info == null)) || ((((cljs.core.second(info) == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(info),new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(graph))))))){
if(cljs.core.truth_(confirm("This directory is not empty, are you sure to sync the remote graph to it? Make sure to back up the directory first."))){
return promesa.core.resolved(null);
} else {
return promesa.core.rejected((new Error(null)));
}
} else {
return null;
}
}));

}
}
})], null)),(function (){
return null;
}));
})], 0))),(function (){var attrs92060 = frontend.ui.icon("alert-circle");
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92060))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","opacity-50","px-1","flex-row","flex","items-center","p-2"], null)], null),attrs92060], 0))):{'className':"text-xs opacity-50 px-1 flex-row flex items-center p-2"}),((cljs.core.map_QMARK_(attrs92060))?[daiquiri.core.create_element("span",{'className':"ml-1"},[" An empty directory or an existing remote graph!"])]:[daiquiri.interpreter.interpret(attrs92060),daiquiri.core.create_element("span",{'className':"ml-1"},[" An empty directory or an existing remote graph!"])]));
})()]);
}),null,"frontend.components.file-sync/pick-local-graph-for-sync");
frontend.components.file_sync.pick_dest_to_sync_panel = (function frontend$components$file_sync$pick_dest_to_sync_panel(graph){
return (function (){
return frontend.components.file_sync.pick_local_graph_for_sync(graph);
});
});
frontend.components.file_sync.page_history_list = rum.core.lazy_build(rum.core.build_defc,(function (graph_uuid,page_entity,set_list_ready_QMARK_,set_page){
var vec__92082 = rum.core.use_state(null);
var version_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92082,(0),null);
var set_version_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92082,(1),null);
var vec__92085 = rum.core.use_state(null);
var current_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92085,(0),null);
var set_current_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92085,(1),null);
var vec__92088 = rum.core.use_state(false);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92088,(0),null);
var set_loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92088,(1),null);
var set_page_fn = (function (page_meta){
(set_current_page.cljs$core$IFn$_invoke$arity$1 ? set_current_page.cljs$core$IFn$_invoke$arity$1(page_meta) : set_current_page.call(null,page_meta));

return (set_page.cljs$core$IFn$_invoke$arity$1 ? set_page.cljs$core$IFn$_invoke$arity$1(page_meta) : set_page.call(null,page_meta));
});
var get_version_key = (function (p1__92072_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(p1__92072_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(p1__92072_SHARP_);
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(loading_QMARK_)){
} else {
var c__32124__auto___92274 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_92113){
var state_val_92114 = (state_92113[(1)]);
if((state_val_92114 === (1))){
var inst_92091 = (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_QMARK_.call(null,true));
var state_92113__$1 = (function (){var statearr_92115 = state_92113;
(statearr_92115[(7)] = inst_92091);

return statearr_92115;
})();
var statearr_92116_92275 = state_92113__$1;
(statearr_92116_92275[(2)] = null);

(statearr_92116_92275[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92114 === (2))){
var _ = (function (){var statearr_92117 = state_92113;
(statearr_92117[(4)] = cljs.core.cons((4),(state_92113[(4)])));

return statearr_92117;
})();
var ___$1 = (function (){var statearr_92118 = state_92113;
(statearr_92118[(4)] = cljs.core.cons((5),(state_92113[(4)])));

return statearr_92118;
})();
var inst_92102 = frontend.handler.file_sync._LT_fetch_page_file_versions(graph_uuid,page_entity);
var state_92113__$1 = state_92113;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_92113__$1,(6),inst_92102);
} else {
if((state_val_92114 === (3))){
var inst_92111 = (state_92113[(2)]);
var state_92113__$1 = state_92113;
return cljs.core.async.impl.ioc_helpers.return_chan(state_92113__$1,inst_92111);
} else {
if((state_val_92114 === (4))){
var _ = (function (){var statearr_92120 = state_92113;
(statearr_92120[(4)] = cljs.core.rest((state_92113[(4)])));

return statearr_92120;
})();
var inst_92093 = (state_92113[(2)]);
var inst_92094 = (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_QMARK_.call(null,false));
var ___$1 = (function (){var temp__5804__auto__ = (state_92113[(5)]);
if(cljs.core.truth_(temp__5804__auto__)){
var e__31283__auto__ = temp__5804__auto__;
throw e__31283__auto__;
} else {
return null;
}
})();
var state_92113__$1 = (function (){var statearr_92121 = state_92113;
(statearr_92121[(8)] = inst_92094);

return statearr_92121;
})();
var statearr_92122_92276 = state_92113__$1;
(statearr_92122_92276[(2)] = inst_92093);

(statearr_92122_92276[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92114 === (5))){
var _ = (function (){var statearr_92123 = state_92113;
(statearr_92123[(4)] = cljs.core.rest((state_92113[(4)])));

return statearr_92123;
})();
var state_92113__$1 = state_92113;
var ex92119 = (state_92113__$1[(2)]);
var statearr_92124_92277 = state_92113__$1;
(statearr_92124_92277[(5)] = ex92119);


throw ex92119;


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92114 === (6))){
var inst_92104 = (state_92113[(2)]);
var inst_92105 = (set_version_files.cljs$core$IFn$_invoke$arity$1 ? set_version_files.cljs$core$IFn$_invoke$arity$1(inst_92104) : set_version_files.call(null,inst_92104));
var inst_92106 = cljs.core.first(inst_92104);
var inst_92107 = set_page_fn(inst_92106);
var inst_92108 = (set_list_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_list_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_list_ready_QMARK_.call(null,true));
var _ = (function (){var statearr_92125 = state_92113;
(statearr_92125[(4)] = cljs.core.rest((state_92113[(4)])));

return statearr_92125;
})();
var state_92113__$1 = (function (){var statearr_92126 = state_92113;
(statearr_92126[(9)] = inst_92105);

(statearr_92126[(10)] = inst_92107);

return statearr_92126;
})();
var statearr_92127_92278 = state_92113__$1;
(statearr_92127_92278[(2)] = inst_92108);

(statearr_92127_92278[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
});
return (function() {
var frontend$components$file_sync$state_machine__32051__auto__ = null;
var frontend$components$file_sync$state_machine__32051__auto____0 = (function (){
var statearr_92128 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_92128[(0)] = frontend$components$file_sync$state_machine__32051__auto__);

(statearr_92128[(1)] = (1));

return statearr_92128;
});
var frontend$components$file_sync$state_machine__32051__auto____1 = (function (state_92113){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_92113);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e92129){var ex__32054__auto__ = e92129;
var statearr_92130_92279 = state_92113;
(statearr_92130_92279[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_92113[(4)]))){
var statearr_92131_92280 = state_92113;
(statearr_92131_92280[(1)] = cljs.core.first((state_92113[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__92281 = state_92113;
state_92113 = G__92281;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32051__auto__ = function(state_92113){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32051__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32051__auto____1.call(this,state_92113);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32051__auto____0;
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32051__auto____1;
return frontend$components$file_sync$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_92132 = f__32125__auto__();
(statearr_92132[(6)] = c__32124__auto___92274);

return statearr_92132;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

}

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

var attrs92081 = (cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),frontend.ui.loading.cljs$core$IFn$_invoke$arity$0()], null):(function (){var iter__5480__auto__ = (function frontend$components$file_sync$iter__92133(s__92134){
return (new cljs.core.LazySeq(null,(function (){
var s__92134__$1 = s__92134;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92134__$1);
if(temp__5804__auto__){
var s__92134__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92134__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92134__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92136 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92135 = (0);
while(true){
if((i__92135 < size__5479__auto__)){
var version = cljs.core._nth(c__5478__auto__,i__92135);
cljs.core.chunk_append(b__92136,(function (){var version_uuid = get_version_key(version);
var local_QMARK_ = (!((new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(version) == null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.version-list-item","div.version-list-item",-454444581),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),version_uuid], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.item-link.block.fade-link.flex.justify-between","a.item-link.block.fade-link.flex.justify-between",1384569968),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),version_uuid,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = current_page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(version_uuid,get_version_key(current_page));
} else {
return and__5000__auto__;
}
})()], null)], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92135,version_uuid,local_QMARK_,version,c__5478__auto__,size__5479__auto__,b__92136,s__92134__$2,temp__5804__auto__,vec__92082,version_files,set_version_files,vec__92085,current_page,set_current_page,vec__92088,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key){
return (function (){
return set_page_fn(version);
});})(i__92135,version_uuid,local_QMARK_,version,c__5478__auto__,size__5479__auto__,b__92136,s__92134__$2,temp__5804__auto__,vec__92082,version_files,set_version_files,vec__92085,current_page,set_current_page,vec__92088,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pt-1","div.text-sm.pt-1",632701368),frontend.ui.humanity_time_ago((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(version);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(version);
}
})(),null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-50.translate-y-1.flex.items-center.space-x-1","small.opacity-50.translate-y-1.flex.items-center.space-x-1",799238304),((local_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("git-commit"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"local"], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("cloud"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"remote"], null)], null))], null)], null)], null);
})());

var G__92282 = (i__92135 + (1));
i__92135 = G__92282;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92136),frontend$components$file_sync$iter__92133(cljs.core.chunk_rest(s__92134__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92136),null);
}
} else {
var version = cljs.core.first(s__92134__$2);
return cljs.core.cons((function (){var version_uuid = get_version_key(version);
var local_QMARK_ = (!((new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(version) == null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.version-list-item","div.version-list-item",-454444581),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),version_uuid], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.item-link.block.fade-link.flex.justify-between","a.item-link.block.fade-link.flex.justify-between",1384569968),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),version_uuid,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = current_page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(version_uuid,get_version_key(current_page));
} else {
return and__5000__auto__;
}
})()], null)], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (version_uuid,local_QMARK_,version,s__92134__$2,temp__5804__auto__,vec__92082,version_files,set_version_files,vec__92085,current_page,set_current_page,vec__92088,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key){
return (function (){
return set_page_fn(version);
});})(version_uuid,local_QMARK_,version,s__92134__$2,temp__5804__auto__,vec__92082,version_files,set_version_files,vec__92085,current_page,set_current_page,vec__92088,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pt-1","div.text-sm.pt-1",632701368),frontend.ui.humanity_time_ago((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(version);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(version);
}
})(),null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-50.translate-y-1.flex.items-center.space-x-1","small.opacity-50.translate-y-1.flex.items-center.space-x-1",799238304),((local_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("git-commit"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"local"], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("cloud"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"remote"], null)], null))], null)], null)], null);
})(),frontend$components$file_sync$iter__92133(cljs.core.rest(s__92134__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(version_files);
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92081))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["version-list"], null)], null),attrs92081], 0))):{'className':"version-list"}),((cljs.core.map_QMARK_(attrs92081))?null:[daiquiri.interpreter.interpret(attrs92081)]));
}),null,"frontend.components.file-sync/page-history-list");
frontend.components.file_sync.pick_page_histories_for_sync = rum.core.lazy_build(rum.core.build_defc,(function (repo_url,graph_uuid,page_name,page_entity){
var vec__92140 = rum.core.use_state(null);
var selected_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92140,(0),null);
var set_selected_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92140,(1),null);
var get_version_key = (function (p1__92137_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(p1__92137_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(p1__92137_SHARP_);
}
});
var file_uuid = new cljs.core.Keyword(null,"FileUUID","FileUUID",-1923309150).cljs$core$IFn$_invoke$arity$1(selected_page);
var version_uuid = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(selected_page);
var vec__92143 = rum.core.use_state(null);
var version_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92143,(0),null);
var set_version_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92143,(1),null);
var vec__92146 = rum.core.use_state(false);
var list_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92146,(0),null);
var set_list_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92146,(1),null);
var vec__92149 = rum.core.use_state(false);
var content_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92149,(0),null);
var set_content_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92149,(1),null);
var _STAR_ref_contents = rum.core.use_ref(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY));
var original_page_name = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_name;
}
})();
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(selected_page)){
(set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_content_ready_QMARK_.call(null,false));

var k = get_version_key(selected_page);
var loaded_contents = cljs.core.deref(rum.core.deref(_STAR_ref_contents));
if(cljs.core.contains_QMARK_(loaded_contents,k)){
var G__92152_92283 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(loaded_contents,k);
(set_version_content.cljs$core$IFn$_invoke$arity$1 ? set_version_content.cljs$core$IFn$_invoke$arity$1(G__92152_92283) : set_version_content.call(null,G__92152_92283));

return setTimeout((function (){
return (set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_content_ready_QMARK_.call(null,true));
}),(100));
} else {
var load_file_SINGLEQUOTE_ = (function (repo_url__$1,file){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.util.fs.read_repo_file(repo_url__$1,file),(function (content){
(set_version_content.cljs$core$IFn$_invoke$arity$1 ? set_version_content.cljs$core$IFn$_invoke$arity$1(content) : set_version_content.call(null,content));

(set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_content_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_content_ready_QMARK_.call(null,true));

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(rum.core.deref(_STAR_ref_contents),cljs.core.assoc,k,content);
}));
});
if(cljs.core.truth_((function (){var and__5000__auto__ = file_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return version_uuid;
} else {
return and__5000__auto__;
}
})())){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_92162){
var state_val_92163 = (state_92162[(1)]);
if((state_val_92163 === (1))){
var inst_92153 = frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$4(graph_uuid,file_uuid,version_uuid,true);
var state_92162__$1 = state_92162;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_92162__$1,(2),inst_92153);
} else {
if((state_val_92163 === (2))){
var inst_92155 = (state_92162[(7)]);
var inst_92155__$1 = (state_92162[(2)]);
var state_92162__$1 = (function (){var statearr_92164 = state_92162;
(statearr_92164[(7)] = inst_92155__$1);

return statearr_92164;
})();
if(cljs.core.truth_(inst_92155__$1)){
var statearr_92165_92284 = state_92162__$1;
(statearr_92165_92284[(1)] = (3));

} else {
var statearr_92166_92285 = state_92162__$1;
(statearr_92166_92285[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92163 === (3))){
var inst_92155 = (state_92162[(7)]);
var inst_92157 = load_file_SINGLEQUOTE_(repo_url,inst_92155);
var state_92162__$1 = state_92162;
var statearr_92167_92286 = state_92162__$1;
(statearr_92167_92286[(2)] = inst_92157);

(statearr_92167_92286[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92163 === (4))){
var state_92162__$1 = state_92162;
var statearr_92168_92287 = state_92162__$1;
(statearr_92168_92287[(2)] = null);

(statearr_92168_92287[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_92163 === (5))){
var inst_92160 = (state_92162[(2)]);
var state_92162__$1 = state_92162;
return cljs.core.async.impl.ioc_helpers.return_chan(state_92162__$1,inst_92160);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$components$file_sync$state_machine__32051__auto__ = null;
var frontend$components$file_sync$state_machine__32051__auto____0 = (function (){
var statearr_92169 = [null,null,null,null,null,null,null,null];
(statearr_92169[(0)] = frontend$components$file_sync$state_machine__32051__auto__);

(statearr_92169[(1)] = (1));

return statearr_92169;
});
var frontend$components$file_sync$state_machine__32051__auto____1 = (function (state_92162){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_92162);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e92170){var ex__32054__auto__ = e92170;
var statearr_92171_92288 = state_92162;
(statearr_92171_92288[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_92162[(4)]))){
var statearr_92172_92289 = state_92162;
(statearr_92172_92289[(1)] = cljs.core.first((state_92162[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__92290 = state_92162;
state_92162 = G__92290;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32051__auto__ = function(state_92162){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32051__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32051__auto____1.call(this,state_92162);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32051__auto____0;
frontend$components$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32051__auto____1;
return frontend$components$file_sync$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_92173 = f__32125__auto__();
(statearr_92173[(6)] = c__32124__auto__);

return statearr_92173;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(selected_page);
if(cljs.core.truth_(temp__5804__auto__)){
var relative_path = temp__5804__auto__;
return load_file_SINGLEQUOTE_(repo_url,relative_path);
} else {
return null;
}
}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_page], null));

logseq.shui.hooks.use_effect_BANG_((function (){
frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","hidden-editors","editor/hidden-editors",254075860),(function (p1__92138_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__92138_SHARP_,page_name);
}));

return (function (){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","hidden-editors","editor/hidden-editors",254075860),(function (p1__92139_SHARP_){
return cljs.core.disj.cljs$core$IFn$_invoke$arity$2(p1__92139_SHARP_,page_name);
}));
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name], null));

return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__file-sync-page-histories","flex-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"is-list-ready","is-list-ready",219673575),list_ready_QMARK_], null)], null))], null))},[(function (){var attrs92174 = frontend.ui.icon("history");
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs92174))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["absolute","top-0","left-0","text-xl","px-4","py-4","leading-4"], null)], null),attrs92174], 0))):{'className':"absolute top-0 left-0 text-xl px-4 py-4 leading-4"}),((cljs.core.map_QMARK_(attrs92174))?[" History for page ",(function (){var attrs92175 = original_page_name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92175))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium"], null)], null),attrs92175], 0))):{'className':"font-medium"}),((cljs.core.map_QMARK_(attrs92175))?null:[daiquiri.interpreter.interpret(attrs92175)]));
})()]:[daiquiri.interpreter.interpret(attrs92174)," History for page ",(function (){var attrs92176 = original_page_name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92176))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium"], null)], null),attrs92176], 0))):{'className':"font-medium"}),((cljs.core.map_QMARK_(attrs92176))?null:[daiquiri.interpreter.interpret(attrs92176)]));
})()]));
})(),daiquiri.core.create_element("div",{'className':"cp__file-sync-page-histories-left flex-wrap"},[frontend.components.file_sync.page_history_list(graph_uuid,page_entity,set_list_ready_QMARK_,set_selected_page),(function (){var attrs92178 = (function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = selected_page;
if(cljs.core.truth_(and__5000__auto__)){
return get_version_key(selected_page);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var inst_id = temp__5804__auto__;
if(cljs.core.truth_(content_ready_QMARK_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.relative.raw-content-editor","div.relative.raw-content-editor",1936421322),frontend.components.lazy_editor.editor(null,inst_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),"markdown"], null),version_content,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"lineWrapping","lineWrapping",1248501985),true,new cljs.core.Keyword(null,"readOnly","readOnly",-1749118317),true,new cljs.core.Keyword(null,"lineNumbers","lineNumbers",1374890941),true], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute.top-1.right-1.opacity-50.hover:opacity-100","div.absolute.top-1.right-1.opacity-50.hover:opacity-100",2040158965),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Restore",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync-graph","restore-file","file-sync-graph/restore-file",691096310),frontend.state.get_current_repo(),page_entity,version_content], null));
})], 0))], null)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.p-15.items-center.justify-center","span.flex.p-15.items-center.justify-center",-1593905937),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null);
}
} else {
return null;
}
})();
return daiquiri.core.create_element("article",((cljs.core.map_QMARK_(attrs92178))?daiquiri.interpreter.element_attributes(attrs92178):null),((cljs.core.map_QMARK_(attrs92178))?null:[daiquiri.interpreter.interpret(attrs92178)]));
})()]),daiquiri.core.create_element("div",{'className':"cp__file-sync-page-histories-right"},[daiquiri.core.create_element("h1",{'className':"title text-xl"},["Current version"]),frontend.components.page.page_blocks_cp(page_entity,null)]),(function (){var attrs92177 = frontend.ui.loading.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92177))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","h-full","justify-center","w-full","absolute","ready-loading"], null)], null),attrs92177], 0))):{'className':"flex items-center h-full justify-center w-full absolute ready-loading"}),((cljs.core.map_QMARK_(attrs92177))?null:[daiquiri.interpreter.interpret(attrs92177)]));
})()]);
}),null,"frontend.components.file-sync/pick-page-histories-for-sync");
frontend.components.file_sync.pick_page_histories_panel = (function frontend$components$file_sync$pick_page_histories_panel(graph_uuid,page_name){
return (function (){
var temp__5802__auto__ = frontend.db.model.get_page(page_name);
if(cljs.core.truth_(temp__5802__auto__)){
var page_entity = temp__5802__auto__;
return frontend.components.file_sync.pick_page_histories_for_sync(frontend.state.get_current_repo(),graph_uuid,page_name,page_entity);
} else {
return frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),["The page (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),") does not exist!"].join(''));
}
});
});
frontend.components.file_sync.onboarding_welcome_logseq_sync = rum.core.lazy_build(rum.core.build_defc,(function (close_fn){
var vec__92181 = rum.core.use_state(false);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92181,(0),null);
var set_loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92181,(1),null);
return daiquiri.core.create_element("div",{'className':"cp__file-sync-welcome-logseq-sync"},[daiquiri.core.create_element("span",{'className':"head-bg"},[daiquiri.core.create_element("strong",null,["CLOSED BETA"])]),daiquiri.core.create_element("h1",{'className':"text-2xl font-bold flex-col sm:flex-row"},[daiquiri.core.create_element("span",{'className':"opacity-80"},["Welcome to "]),daiquiri.core.create_element("span",{'className':"pl-2 dark:text-white text-gray-800"},["Logseq Sync! \uD83D\uDC4B"])]),daiquiri.core.create_element("h2",null,["No more cloud storage worries. With Logseq's encrypted file syncing, ",daiquiri.core.create_element("br",null,null),"you'll always have your notes backed up and available in real-time on any device."]),(function (){var attrs92190 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Later",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92190))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-center","space-x-2","sm:justify-end"], null)], null),attrs92190], 0))):{'className':"pt-6 flex justify-center space-x-2 sm:justify-end"}),((cljs.core.map_QMARK_(attrs92190))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Start syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_QMARK_.call(null,true));

var result = new cljs.core.Keyword("user","info","user/info",-345834271).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var ex_time = new cljs.core.Keyword(null,"ExpireTime","ExpireTime",-1718142784).cljs$core$IFn$_invoke$arity$1(result);
if(((typeof ex_time === 'number') && (((ex_time * (1000)) < Date.now())))){
cljs.core.vreset_BANG_(frontend.handler.file_sync._STAR_beta_unavailable_QMARK_,true);

(frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)) : frontend.components.file_sync.maybe_onboarding_show.call(null,new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)));
} else {
(frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sync-initiate","sync-initiate",1636471756)) : frontend.components.file_sync.maybe_onboarding_show.call(null,new cljs.core.Keyword(null,"sync-initiate","sync-initiate",1636471756)));
}

(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_QMARK_.call(null,false));
})], 0)))]:[daiquiri.interpreter.interpret(attrs92190),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Start syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_QMARK_.call(null,true));

var result = new cljs.core.Keyword("user","info","user/info",-345834271).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var ex_time = new cljs.core.Keyword(null,"ExpireTime","ExpireTime",-1718142784).cljs$core$IFn$_invoke$arity$1(result);
if(((typeof ex_time === 'number') && (((ex_time * (1000)) < Date.now())))){
cljs.core.vreset_BANG_(frontend.handler.file_sync._STAR_beta_unavailable_QMARK_,true);

(frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)) : frontend.components.file_sync.maybe_onboarding_show.call(null,new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)));
} else {
(frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.maybe_onboarding_show.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sync-initiate","sync-initiate",1636471756)) : frontend.components.file_sync.maybe_onboarding_show.call(null,new cljs.core.Keyword(null,"sync-initiate","sync-initiate",1636471756)));
}

(close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));

return (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_QMARK_.call(null,false));
})], 0)))]));
})()]);
}),null,"frontend.components.file-sync/onboarding-welcome-logseq-sync");
frontend.components.file_sync.onboarding_unavailable_file_sync = rum.core.lazy_build(rum.core.build_defc,(function (close_fn){
return daiquiri.core.create_element("div",{'className':"cp__file-sync-unavailable-logseq-sync"},[daiquiri.core.create_element("span",{'className':"head-bg"},null),daiquiri.core.create_element("h1",{'className':"text-2xl font-bold"},[daiquiri.core.create_element("span",{'className':"pr-2 dark:text-white text-gray-800"},["Logseq Sync"]),daiquiri.core.create_element("span",{'className':"opacity-80"},["is not yet available for you. \uD83D\uDE14 "])]),daiquiri.core.create_element("h2",null,["Thanks for creating an account! To ensure that our file syncing service runs well when we release it",daiquiri.core.create_element("br",null,null),"to our users, we need a little more time to test it. That\u2019s why we decided to first roll it out only to our ",daiquiri.core.create_element("br",null,null),"charitable OpenCollective sponsors and backers. We can notify you once it becomes available for you."]),(function (){var attrs92197 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Close",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92197))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-end","space-x-2"], null)], null),attrs92197], 0))):{'className':"pt-6 flex justify-end space-x-2"}),((cljs.core.map_QMARK_(attrs92197))?null:[daiquiri.interpreter.interpret(attrs92197)]));
})()]);
}),null,"frontend.components.file-sync/onboarding-unavailable-file-sync");
frontend.components.file_sync.onboarding_congrats_successful_sync = rum.core.lazy_build(rum.core.build_defc,(function (close_fn){
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs92203 = frontend.ui.icon("checkup-list",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(28)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92203))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs92203], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs92203))?null:[daiquiri.interpreter.interpret(attrs92203)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},[daiquiri.core.create_element("span",{'className':"dark:opacity-80"},["Congrats on your first successful sync!"])]),daiquiri.core.create_element("h2",{'className':"text-center dark:opacity-70 text-sm opacity-90"},[daiquiri.core.create_element("div",null,["By using this graph with Logseq Sync you can now transition seamlessly between your different "]),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",null,["devices. Go to the "]),daiquiri.core.create_element("span",{'className':"dark:text-white"},["All Graphs "]),daiquiri.core.create_element("span",null,["pages to manage your remote graph or switch to another local graph "])]),daiquiri.core.create_element("div",null,["and sync it as well."])]),daiquiri.core.create_element("div",{'className':"cloud-tip rounded-md mt-6 py-4"},[daiquiri.core.create_element("div",{'className':"items-center opacity-90 flex justify-center"},[(function (){var attrs92204 = frontend.ui.icon("bell-ringing",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"font-semibold"], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92204))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pr-2","flex"], null)], null),attrs92204], 0))):{'className':"pr-2 flex"}),((cljs.core.map_QMARK_(attrs92204))?null:[daiquiri.interpreter.interpret(attrs92204)]));
})(),daiquiri.core.create_element("strong",null,["Logseq Sync is still in Beta and we're working on a Pro plan!"])])]),(function (){var attrs92202 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Done",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92202))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-end","space-x-2"], null)], null),attrs92202], 0))):{'className':"pt-6 flex justify-end space-x-2"}),((cljs.core.map_QMARK_(attrs92202))?null:[daiquiri.interpreter.interpret(attrs92202)]));
})()]);
}),null,"frontend.components.file-sync/onboarding-congrats-successful-sync");
frontend.components.file_sync.open_icloud_graph_clone_picker = (function frontend$components$file_sync$open_icloud_graph_clone_picker(var_args){
var G__92208 = arguments.length;
switch (G__92208) {
case 0:
return frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
}));

(frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1 = (function (repo){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.mobile.util.in_iCloud_container_path_QMARK_(repo);
} else {
return and__5000__auto__;
}
})())){
var G__92209 = (function (close_fn){
return frontend.components.file_sync.clone_local_icloud_graph_panel(repo,(frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(repo) : frontend.util.node_path.basename.call(null,repo)),close_fn);
});
var G__92210 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__92209,G__92210) : logseq.shui.ui.dialog_open_BANG_.call(null,G__92209,G__92210));
} else {
return null;
}
}));

(frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$lang$maxFixedArity = 1);

frontend.components.file_sync.make_onboarding_panel = (function frontend$components$file_sync$make_onboarding_panel(type){
return (function (p__92211){
var map__92212 = p__92211;
var map__92212__$1 = cljs.core.__destructure_map(map__92212);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92212__$1,new cljs.core.Keyword(null,"close","close",1835149582));
var G__92213 = type;
var G__92213__$1 = (((G__92213 instanceof cljs.core.Keyword))?G__92213.fqn:null);
switch (G__92213__$1) {
case "welcome":
return frontend.components.file_sync.onboarding_welcome_logseq_sync(close);

break;
case "unavailable":
return frontend.components.file_sync.onboarding_unavailable_file_sync(close);

break;
case "congrats":
return frontend.components.file_sync.onboarding_congrats_successful_sync(close);

break;
default:
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-xl.font-bold","h1.text-xl.font-bold",-807773808),"Not handled!"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button","a.button",275710893),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),close], null),"Got it!"], null)], null);

}
});
});
frontend.components.file_sync.maybe_onboarding_show = (function frontend$components$file_sync$maybe_onboarding_show(type){
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type)))){
return null;
} else {
try{var current_repo = frontend.state.get_current_repo();
var demo_repo_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_repo,frontend.config.demo_repo);
var login_QMARK_ = cljs.core.boolean$(frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946)));
if(login_QMARK_){
var G__92215_92293 = type;
var G__92215_92294__$1 = (((G__92215_92293 instanceof cljs.core.Keyword))?G__92215_92293.fqn:null);
switch (G__92215_92294__$1) {
case "welcome":
if(cljs.core.truth_((function (){var or__5002__auto__ = demo_repo_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(frontend.handler.repo.get_detail_graph_info(current_repo));
}
})())){
throw (new Error("current repo have been local or remote graph"));
} else {
}

break;
case "sync-initiate":
case "sync-learn":
case "sync-history":
frontend.components.onboarding.quick_tour.ready((function (){
frontend.components.onboarding.quick_tour.start_file_sync(type);

return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833),type], null),true);
}));

throw (new Error(null));

break;
default:

}

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","onboarding-tip","file-sync/onboarding-tip",-1267073709),type], null));

return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type)], null),true);
} else {
return null;
}
}catch (e92214){var e = e92214;
return console.warn("[onboarding SKIP] ",cljs.core.name(type),e);
}}
});

//# sourceMappingURL=frontend.components.file_sync.js.map
