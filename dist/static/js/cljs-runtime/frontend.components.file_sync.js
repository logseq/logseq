goog.provide('frontend.components.file_sync');
frontend.components.file_sync.clone_local_icloud_graph_panel = rum.core.lazy_build(rum.core.build_defc,(function (repo,graph_name,close_fn){
logseq.shui.hooks.use_effect_BANG_((function (){
var G__126192 = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
if((G__126192 == null)){
return null;
} else {
return G__126192.complete();
}
}),cljs.core.PersistentVector.EMPTY);

var graph_dir = frontend.config.get_repo_dir(repo);
var vec__126193 = rum.core.use_state("");
var selected_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126193,(0),null);
var set_selected_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126193,(1),null);
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
})).catch((function (p1__126188_SHARP_){
return console.error(p1__126188_SHARP_);
}));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs126218 = frontend.ui.icon("folders");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126218))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs126218], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs126218))?null:[daiquiri.interpreter.interpret(attrs126218)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},["Clone your local graph away from ",daiquiri.core.create_element("strong",null,["\u2601\uFE0F"])," iCloud!"]),daiquiri.core.create_element("h2",{'className':"text-center opacity-70 text-xs leading-5"},["Unfortunately, Logseq Sync and iCloud don't work perfectly together at the moment. To make sure",daiquiri.core.create_element("br",null,null),"You can always delete the remote graph at a later point."]),daiquiri.core.create_element("div",{'className':"folder-tip flex flex-col items-center"},[daiquiri.core.create_element("h3",null,[(function (){var attrs126243 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126243))?daiquiri.interpreter.element_attributes(attrs126243):null),((cljs.core.map_QMARK_(attrs126243))?[(function (){var attrs126244 = logseq.common.util.safe_decode_uri_component(graph_name);
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs126244))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs126244], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs126244))?null:[daiquiri.interpreter.interpret(attrs126244)]));
})()]:[daiquiri.interpreter.interpret(attrs126243),(function (){var attrs126246 = logseq.common.util.safe_decode_uri_component(graph_name);
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs126246))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs126246], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs126246))?null:[daiquiri.interpreter.interpret(attrs126246)]));
})()]));
})()]),(function (){var attrs126222 = frontend.config.get_string_repo_dir(repo);
return daiquiri.core.create_element("h4",((cljs.core.map_QMARK_(attrs126222))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-6"], null)], null),attrs126222], 0))):{'className':"px-6"}),((cljs.core.map_QMARK_(attrs126222))?null:[daiquiri.interpreter.interpret(attrs126222)]));
})(),(((!(clojure.string.blank_QMARK_(selected_path))))?(function (){var attrs126233 = ((frontend.mobile.util.in_iCloud_container_path_QMARK_(selected_path))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-block.pr-1.text-error.scale-75","span.inline-block.pr-1.text-error.scale-75",-1956736057),frontend.ui.icon("alert-circle")], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-block.pr-1.text-success.scale-75","span.inline-block.pr-1.text-success.scale-75",1932768332),frontend.ui.icon("circle-check")], null));
return daiquiri.core.create_element("h5",((cljs.core.map_QMARK_(attrs126233))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","pt-1","-mb-1","flex","items-center","leading-none"], null)], null),attrs126233], 0))):{'className':"text-xs pt-1 -mb-1 flex items-center leading-none"}),((cljs.core.map_QMARK_(attrs126233))?[daiquiri.interpreter.interpret(selected_path)]:[daiquiri.interpreter.interpret(attrs126233),daiquiri.interpreter.interpret(selected_path)]));
})():null),(function (){var attrs126241 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.leading-none.opacity-90","span.inline-flex.items-center.leading-none.opacity-90",1106304784),"Select new parent folder outside of iCloud",frontend.ui.icon("arrow-right")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openDialog"], 0))),(function (path){
return promesa.protocols._promise((set_selected_path.cljs$core$IFn$_invoke$arity$1 ? set_selected_path.cljs$core$IFn$_invoke$arity$1(path) : set_selected_path.call(null,path)));
}));
}));
} else {
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.chain.cljs$core$IFn$_invoke$arity$2(frontend.mobile.util.folder_picker.pickFolder(),(function (p1__126189_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__126189_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}))),(function (p__126248){
var map__126249 = p__126248;
var map__126249__$1 = cljs.core.__destructure_map(map__126249);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126249__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var _localDocumentsPath = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126249__$1,new cljs.core.Keyword(null,"_localDocumentsPath","_localDocumentsPath",-419062105));
return promesa.protocols._promise((set_selected_path.cljs$core$IFn$_invoke$arity$1 ? set_selected_path.cljs$core$IFn$_invoke$arity$1(path) : set_selected_path.call(null,path)));
}));
}));
} else {
return null;

}
}
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126241))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["out-icloud"], null)], null),attrs126241], 0))):{'className':"out-icloud"}),((cljs.core.map_QMARK_(attrs126241))?null:[daiquiri.interpreter.interpret(attrs126241)]));
})()]),(function (){var attrs126217 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs126217))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","space-x-2","pt-6","flex","justify-center","sm:justify-end","-mb-2"], null)], null),attrs126217], 0))):{'className':"flex items-center space-x-2 pt-6 flex justify-center sm:justify-end -mb-2"}),((cljs.core.map_QMARK_(attrs126217))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Clone graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(selected_path_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]:[daiquiri.interpreter.interpret(attrs126217),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Clone graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(selected_path_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]));
})()]);
}),null,"frontend.components.file-sync/clone-local-icloud-graph-panel");
frontend.components.file_sync.create_remote_graph_panel = rum.core.lazy_build(rum.core.build_defc,(function (repo,graph_name,close_fn){
logseq.shui.hooks.use_effect_BANG_((function (){
var G__126251 = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
if((G__126251 == null)){
return null;
} else {
return G__126251.complete();
}
}),cljs.core.PersistentVector.EMPTY);

var on_confirm = (function (){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_126289){
var state_val_126290 = (state_126289[(1)]);
if((state_val_126290 === (7))){
var state_126289__$1 = state_126289;
var statearr_126297_127031 = state_126289__$1;
(statearr_126297_127031[(2)] = null);

(statearr_126297_127031[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126290 === (1))){
var inst_126253 = (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
var inst_126254 = frontend.mobile.util.in_iCloud_container_path_QMARK_(repo);
var state_126289__$1 = (function (){var statearr_126298 = state_126289;
(statearr_126298[(7)] = inst_126253);

return statearr_126298;
})();
if(inst_126254){
var statearr_126303_127034 = state_126289__$1;
(statearr_126303_127034[(1)] = (2));

} else {
var statearr_126304_127035 = state_126289__$1;
(statearr_126304_127035[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126290 === (4))){
var inst_126287 = (state_126289[(2)]);
var state_126289__$1 = state_126289;
return cljs.core.async.impl.ioc_helpers.return_chan(state_126289__$1,inst_126287);
} else {
if((state_val_126290 === (6))){
var inst_126267 = frontend.fs.sync._LT_sync_start();
var state_126289__$1 = state_126289;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126289__$1,(9),inst_126267);
} else {
if((state_val_126290 === (3))){
var inst_126258 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_126259 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_126260 = (new cljs.core.PersistentVector(null,2,(5),inst_126258,inst_126259,null));
var inst_126261 = frontend.state.set_state_BANG_(inst_126260,true);
var inst_126262 = frontend.handler.file_sync.create_graph(graph_name);
var state_126289__$1 = (function (){var statearr_126306 = state_126289;
(statearr_126306[(8)] = inst_126261);

return statearr_126306;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126289__$1,(5),inst_126262);
} else {
if((state_val_126290 === (2))){
var inst_126256 = (frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1 ? frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$core$IFn$_invoke$arity$1(repo) : frontend.components.file_sync.open_icloud_graph_clone_picker.call(null,repo));
var state_126289__$1 = state_126289;
var statearr_126307_127038 = state_126289__$1;
(statearr_126307_127038[(2)] = inst_126256);

(statearr_126307_127038[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126290 === (9))){
var inst_126265 = (state_126289[(9)]);
var inst_126269 = (state_126289[(2)]);
var inst_126270 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_126271 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_126272 = (new cljs.core.PersistentVector(null,2,(5),inst_126270,inst_126271,null));
var inst_126273 = frontend.state.set_state_BANG_(inst_126272,false);
var inst_126274 = [new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),new cljs.core.Keyword(null,"GraphName","GraphName",-960661337)];
var inst_126275 = [inst_126265,graph_name];
var inst_126276 = cljs.core.PersistentHashMap.fromArrays(inst_126274,inst_126275);
var inst_126277 = frontend.state.add_remote_graph_BANG_(inst_126276);
var inst_126278 = (function (){var temp__5804__auto__ = inst_126265;
var GraphUUID = inst_126265;
return (function (r){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r),repo)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(r,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),GraphUUID,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),graph_name,new cljs.core.Keyword(null,"remote?","remote?",-517415110),true], 0));
} else {
return r;
}
});
})();
var inst_126279 = frontend.state.get_repos();
var inst_126280 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(inst_126278,inst_126279);
var inst_126281 = frontend.state.set_repos_BANG_(inst_126280);
var state_126289__$1 = (function (){var statearr_126309 = state_126289;
(statearr_126309[(10)] = inst_126269);

(statearr_126309[(11)] = inst_126273);

(statearr_126309[(12)] = inst_126277);

return statearr_126309;
})();
var statearr_126320_127043 = state_126289__$1;
(statearr_126320_127043[(2)] = inst_126281);

(statearr_126320_127043[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126290 === (5))){
var inst_126265 = (state_126289[(9)]);
var inst_126264 = (state_126289[(2)]);
var inst_126265__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_126264,(2));
var state_126289__$1 = (function (){var statearr_126321 = state_126289;
(statearr_126321[(9)] = inst_126265__$1);

return statearr_126321;
})();
if(cljs.core.truth_(inst_126265__$1)){
var statearr_126322_127045 = state_126289__$1;
(statearr_126322_127045[(1)] = (6));

} else {
var statearr_126323_127046 = state_126289__$1;
(statearr_126323_127046[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126290 === (8))){
var inst_126285 = (state_126289[(2)]);
var state_126289__$1 = state_126289;
var statearr_126324_127047 = state_126289__$1;
(statearr_126324_127047[(2)] = inst_126285);

(statearr_126324_127047[(1)] = (4));


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
var frontend$components$file_sync$state_machine__32004__auto__ = null;
var frontend$components$file_sync$state_machine__32004__auto____0 = (function (){
var statearr_126325 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_126325[(0)] = frontend$components$file_sync$state_machine__32004__auto__);

(statearr_126325[(1)] = (1));

return statearr_126325;
});
var frontend$components$file_sync$state_machine__32004__auto____1 = (function (state_126289){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_126289);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e126326){var ex__32007__auto__ = e126326;
var statearr_126327_127053 = state_126289;
(statearr_126327_127053[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_126289[(4)]))){
var statearr_126328_127054 = state_126289;
(statearr_126328_127054[(1)] = cljs.core.first((state_126289[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__127055 = state_126289;
state_126289 = G__127055;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32004__auto__ = function(state_126289){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32004__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32004__auto____1.call(this,state_126289);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32004__auto____0;
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32004__auto____1;
return frontend$components$file_sync$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_126329 = f__32196__auto__();
(statearr_126329[(6)] = c__32195__auto__);

return statearr_126329;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs126335 = frontend.ui.icon("cloud-upload",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126335))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs126335], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs126335))?null:[daiquiri.interpreter.interpret(attrs126335)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},["Are you sure you want to create a new remote graph?"]),daiquiri.core.create_element("h2",{'className':"text-center opacity-70 text-xs"},["By continuing this action you will create an encrypted cloud version of your current local graph.",daiquiri.core.create_element("br",null,null),"You can always delete the remote graph at a later point."]),daiquiri.core.create_element("div",{'className':"folder-tip flex flex-col items-center"},[daiquiri.core.create_element("h3",null,[(function (){var attrs126339 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126339))?daiquiri.interpreter.element_attributes(attrs126339):null),((cljs.core.map_QMARK_(attrs126339))?[(function (){var attrs126340 = graph_name;
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs126340))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs126340], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs126340))?null:[daiquiri.interpreter.interpret(attrs126340)]));
})()]:[daiquiri.interpreter.interpret(attrs126339),(function (){var attrs126343 = graph_name;
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs126343))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-0","5"], null)], null),attrs126343], 0))):{'className':"pl-0 5"}),((cljs.core.map_QMARK_(attrs126343))?null:[daiquiri.interpreter.interpret(attrs126343)]));
})()]));
})(),(function (){var attrs126344 = frontend.ui.icon("arrow-right");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126344))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","scale-75"], null)], null),attrs126344], 0))):{'className':"opacity-50 scale-75"}),((cljs.core.map_QMARK_(attrs126344))?null:[daiquiri.interpreter.interpret(attrs126344)]));
})(),(function (){var attrs126345 = frontend.ui.icon("cloud-lock");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126345))?daiquiri.interpreter.element_attributes(attrs126345):null),((cljs.core.map_QMARK_(attrs126345))?null:[daiquiri.interpreter.interpret(attrs126345)]));
})()]),(function (){var attrs126338 = frontend.config.get_string_repo_dir(repo);
return daiquiri.core.create_element("h4",((cljs.core.map_QMARK_(attrs126338))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-4"], null)], null),attrs126338], 0))):{'className':"px-4"}),((cljs.core.map_QMARK_(attrs126338))?null:[daiquiri.interpreter.interpret(attrs126338)]));
})()]),(function (){var attrs126334 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs126334))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","space-x-2","pt-6","flex","justify-center","sm:justify-end","-mb-2"], null)], null),attrs126334], 0))):{'className':"flex items-center space-x-2 pt-6 flex justify-center sm:justify-end -mb-2"}),((cljs.core.map_QMARK_(attrs126334))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create remote graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]:[daiquiri.interpreter.interpret(attrs126334),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create remote graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_confirm], 0)))]));
})()]);
}),null,"frontend.components.file-sync/create-remote-graph-panel");
frontend.components.file_sync.last_synced_cp = rum.core.lazy_build(rum.core.build_defc,(function (){
var last_synced_at = frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),frontend.state.get_current_file_sync_graph_uuid(),new cljs.core.Keyword("file-sync","last-synced-at","file-sync/last-synced-at",1623190259)], null));
var last_synced_at__$1 = (cljs.core.truth_(last_synced_at)?frontend.util.human_time(cljs_time.coerce.from_long((last_synced_at * (1000)))):"just now");
return daiquiri.core.create_element("div",{'className':"cl"},[daiquiri.core.create_element("span",{'className':"opacity-60"},["Last change was"]),(function (){var attrs126355 = last_synced_at__$1;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126355))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs126355], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs126355))?null:[attrs126355]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.file-sync/last-synced-cp");
frontend.components.file_sync.sync_now = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Sync now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"block cursor-pointer",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.async.offer_BANG_(frontend.fs.sync.immediately_local__GT_remote_chan,true);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"#ffffff"], null)], 0)));
}),null,"frontend.components.file-sync/sync-now");
frontend.components.file_sync._STAR_last_calculated_time = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.file_sync.indicator_progress_pane = rum.core.lazy_build(rum.core.build_defc,(function (sync_state,sync_progress,p__126362){
var map__126363 = p__126362;
var map__126363__$1 = cljs.core.__destructure_map(map__126363);
var idle_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"idle?","idle?",1779138705));
var syncing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"syncing?","syncing?",-474023112));
var no_active_files_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"no-active-files?","no-active-files?",1828838351));
var online_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"online?","online?",-1144837492));
var history_files_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"history-files?","history-files?",682465563));
var queuing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126363__$1,new cljs.core.Keyword(null,"queuing?","queuing?",-550117936));
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
return cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__126358_SHARP_){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"percent","percent",2031453817).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__126358_SHARP_)),(100))) && (cljs.core.contains_QMARK_(current_sync_files,cljs.core.first(p1__126358_SHARP_))));
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
var vec__126364 = rum.core.use_state((function (p1__126360_SHARP_){
if((p1__126360_SHARP_ == null)){
return true;
} else {
return p1__126360_SHARP_;
}
})(frontend.storage.get(new cljs.core.Keyword("ui","file-sync-active-file-list?","ui/file-sync-active-file-list?",2000179644))));
var list_active_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126364,(0),null);
var set_list_active_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126364,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var G__126372 = rum.core.deref(_STAR_el_ref);
var G__126372__$1 = (((G__126372 == null))?null:G__126372.closest(".menu-links-outer"));
if((G__126372__$1 == null)){
return null;
} else {
return G__126372__$1.classList;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var outer_class_list = temp__5804__auto__;
(function (p1__126361_SHARP_){
if(cljs.core.truth_(list_active_QMARK_)){
return outer_class_list.add(p1__126361_SHARP_);
} else {
return outer_class_list.remove(p1__126361_SHARP_);
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
)))])]),(function (){var attrs126376 = (cljs.core.truth_(queuing_QMARK_)?frontend.components.file_sync.sync_now():null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126376))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ar"], null)], null),attrs126376], 0))):{'className':"ar"}),((cljs.core.map_QMARK_(attrs126376))?null:[daiquiri.interpreter.interpret(attrs126376)]));
})()]),((waiting_QMARK_)?null:daiquiri.core.create_element("div",{'className':"b dark:text-gray-200"},[daiquiri.core.create_element("div",{'className':"bl"},[(function (){var attrs126384 = (cljs.core.truth_(no_active_files_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-100.pr-1","span.opacity-100.pr-1",-148417813),"Successfully processed"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-60.pr-1","span.opacity-60.pr-1",1607561462),"Processed"], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126384))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs126384], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs126384))?null:[daiquiri.interpreter.interpret(attrs126384)]));
})(),daiquiri.interpreter.interpret(cljs.core.first(tip_b_AMPERSAND_p))]),daiquiri.core.create_element("div",{'className':"br"},[(function (){var attrs126385 = (cljs.core.truth_(syncing_QMARK_)?calc_time_left():null);
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs126385))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50"], null)], null),attrs126385], 0))):{'className':"opacity-50"}),((cljs.core.map_QMARK_(attrs126385))?null:[daiquiri.interpreter.interpret(attrs126385)]));
})()])])),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["c",((waiting_QMARK_)?"pt-2":null)], null))},[daiquiri.interpreter.interpret(cljs.core.second(tip_b_AMPERSAND_p)),(cljs.core.truth_((function (){var or__5002__auto__ = history_files_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(no_active_files_QMARK_);
}
})())?daiquiri.core.create_element("span",{'onClick':(function (){
var G__126386 = cljs.core.not(list_active_QMARK_);
return (set_list_active_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_list_active_QMARK_.cljs$core$IFn$_invoke$arity$1(G__126386) : set_list_active_QMARK_.call(null,G__126386));
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
var confirm_fn = (function (p__126390){
var map__126391 = p__126390;
var map__126391__$1 = cljs.core.__destructure_map(map__126391);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126391__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.components.file_sync.create_remote_graph_panel(current_repo,graph_name,close);
});
var G__126392 = confirm_fn;
var G__126393 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"center?","center?",-323116631),true,new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__126392,G__126393) : logseq.shui.ui.dialog_open_BANG_.call(null,G__126392,G__126393));
} else {
return null;
}
});
var turn_on = goog.functions.debounce((function (){
if(cljs.core.truth_(frontend.handler.file_sync.current_graph_sync_on_QMARK_())){
return null;
} else {
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_126480){
var state_val_126481 = (state_126480[(1)]);
if((state_val_126481 === (7))){
var state_126480__$1 = state_126480;
var statearr_126482_127116 = state_126480__$1;
(statearr_126482_127116[(2)] = null);

(statearr_126482_127116[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (20))){
var inst_126431 = (state_126480[(7)]);
var state_126480__$1 = state_126480;
var statearr_126483_127117 = state_126480__$1;
(statearr_126483_127117[(2)] = inst_126431);

(statearr_126483_127117[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (27))){
var inst_126394 = (state_126480[(8)]);
var inst_126451 = cljs.core.deref(inst_126394);
var inst_126452 = cljs.core.second(inst_126451);
var state_126480__$1 = state_126480;
if(cljs.core.truth_(inst_126452)){
var statearr_126484_127119 = state_126480__$1;
(statearr_126484_127119[(1)] = (29));

} else {
var statearr_126485_127120 = state_126480__$1;
(statearr_126485_127120[(1)] = (30));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (1))){
var inst_126394 = (state_126480[(8)]);
var inst_126394__$1 = frontend.fs.sync.graphs_txid;
var inst_126395 = inst_126394__$1.frontend$util$persist_var$ILoad$_load$arity$1(null);
var inst_126396 = cljs.core.async.interop.p__GT_c(inst_126395);
var state_126480__$1 = (function (){var statearr_126486 = state_126480;
(statearr_126486[(8)] = inst_126394__$1);

return statearr_126486;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126480__$1,(2),inst_126396);
} else {
if((state_val_126481 === (24))){
var inst_126444 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126487_127122 = state_126480__$1;
(statearr_126487_127122[(2)] = inst_126444);

(statearr_126487_127122[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (4))){
var inst_126406 = frontend.handler.user._LT_user_uuid();
var state_126480__$1 = state_126480;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126480__$1,(6),inst_126406);
} else {
if((state_val_126481 === (15))){
var inst_126424 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126488_127123 = state_126480__$1;
(statearr_126488_127123[(2)] = inst_126424);

(statearr_126488_127123[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (21))){
var inst_126447 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
if(cljs.core.truth_(inst_126447)){
var statearr_126489_127124 = state_126480__$1;
(statearr_126489_127124[(1)] = (26));

} else {
var statearr_126490_127125 = state_126480__$1;
(statearr_126490_127125[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (31))){
var inst_126472 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126491_127126 = state_126480__$1;
(statearr_126491_127126[(2)] = inst_126472);

(statearr_126491_127126[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (32))){
var state_126480__$1 = state_126480;
var statearr_126492_127128 = state_126480__$1;
(statearr_126492_127128[(2)] = null);

(statearr_126492_127128[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (33))){
var state_126480__$1 = state_126480;
var statearr_126493_127129 = state_126480__$1;
(statearr_126493_127129[(1)] = (35));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (13))){
var inst_126394 = (state_126480[(8)]);
var inst_126413 = (state_126480[(9)]);
var inst_126418 = cljs.core.deref(inst_126394);
var inst_126419 = cljs.core.first(inst_126418);
var inst_126420 = frontend.fs.sync.check_graph_belong_to_current_user(inst_126413,inst_126419);
var inst_126421 = (!(inst_126420));
var state_126480__$1 = state_126480;
var statearr_126495_127131 = state_126480__$1;
(statearr_126495_127131[(2)] = inst_126421);

(statearr_126495_127131[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (22))){
var inst_126394 = (state_126480[(8)]);
var inst_126437 = cljs.core.deref(inst_126394);
var inst_126438 = cljs.core.second(inst_126437);
var inst_126439 = frontend.fs.sync._LT_check_remote_graph_exists(inst_126438);
var state_126480__$1 = state_126480;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126480__$1,(25),inst_126439);
} else {
if((state_val_126481 === (36))){
var state_126480__$1 = state_126480;
var statearr_126496_127132 = state_126480__$1;
(statearr_126496_127132[(2)] = null);

(statearr_126496_127132[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (29))){
var inst_126394 = (state_126480[(8)]);
var inst_126454 = (function (){var graphs_txid = inst_126394;
return (function (r){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r),current_repo)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(r,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),new cljs.core.Keyword(null,"remote?","remote?",-517415110)], 0));
} else {
return r;
}
});
})();
var inst_126455 = frontend.state.get_repos();
var inst_126456 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(inst_126454,inst_126455);
var inst_126457 = frontend.state.set_repos_BANG_(inst_126456);
var inst_126458 = create_remote_graph_fn();
var state_126480__$1 = (function (){var statearr_126499 = state_126480;
(statearr_126499[(10)] = inst_126457);

return statearr_126499;
})();
var statearr_126500_127133 = state_126480__$1;
(statearr_126500_127133[(2)] = inst_126458);

(statearr_126500_127133[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (6))){
var inst_126408 = (state_126480[(11)]);
var inst_126408__$1 = (state_126480[(2)]);
var inst_126409 = (inst_126408__$1 instanceof cljs.core.ExceptionInfo);
var state_126480__$1 = (function (){var statearr_126501 = state_126480;
(statearr_126501[(11)] = inst_126408__$1);

return statearr_126501;
})();
if(cljs.core.truth_(inst_126409)){
var statearr_126502_127134 = state_126480__$1;
(statearr_126502_127134[(1)] = (7));

} else {
var statearr_126503_127135 = state_126480__$1;
(statearr_126503_127135[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (28))){
var inst_126474 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126506_127136 = state_126480__$1;
(statearr_126506_127136[(2)] = inst_126474);

(statearr_126506_127136[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (25))){
var inst_126441 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126507_127137 = state_126480__$1;
(statearr_126507_127137[(2)] = inst_126441);

(statearr_126507_127137[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (34))){
var inst_126470 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126508_127138 = state_126480__$1;
(statearr_126508_127138[(2)] = inst_126470);

(statearr_126508_127138[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (17))){
var inst_126394 = (state_126480[(8)]);
var inst_126431 = (state_126480[(7)]);
var inst_126430 = cljs.core.deref(inst_126394);
var inst_126431__$1 = cljs.core.second(inst_126430);
var state_126480__$1 = (function (){var statearr_126509 = state_126480;
(statearr_126509[(7)] = inst_126431__$1);

return statearr_126509;
})();
if(cljs.core.truth_(inst_126431__$1)){
var statearr_126510_127139 = state_126480__$1;
(statearr_126510_127139[(1)] = (19));

} else {
var statearr_126511_127140 = state_126480__$1;
(statearr_126511_127140[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (3))){
var inst_126401 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_126402 = [new cljs.core.Keyword("file-sync","onboarding-tip","file-sync/onboarding-tip",-1267073709),new cljs.core.Keyword(null,"unavailable","unavailable",1529915531)];
var inst_126403 = (new cljs.core.PersistentVector(null,2,(5),inst_126401,inst_126402,null));
var inst_126404 = frontend.state.pub_event_BANG_(inst_126403);
var state_126480__$1 = state_126480;
var statearr_126512_127141 = state_126480__$1;
(statearr_126512_127141[(2)] = inst_126404);

(statearr_126512_127141[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (12))){
var inst_126427 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
if(cljs.core.truth_(inst_126427)){
var statearr_126513_127142 = state_126480__$1;
(statearr_126513_127142[(1)] = (16));

} else {
var statearr_126520_127143 = state_126480__$1;
(statearr_126520_127143[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (2))){
var inst_126398 = (state_126480[(2)]);
var inst_126399 = cljs.core.deref(frontend.handler.file_sync._STAR_beta_unavailable_QMARK_);
var state_126480__$1 = (function (){var statearr_126521 = state_126480;
(statearr_126521[(12)] = inst_126398);

return statearr_126521;
})();
if(cljs.core.truth_(inst_126399)){
var statearr_126522_127149 = state_126480__$1;
(statearr_126522_127149[(1)] = (3));

} else {
var statearr_126523_127150 = state_126480__$1;
(statearr_126523_127150[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (23))){
var inst_126435 = (state_126480[(13)]);
var state_126480__$1 = state_126480;
var statearr_126524_127151 = state_126480__$1;
(statearr_126524_127151[(2)] = inst_126435);

(statearr_126524_127151[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (35))){
var inst_126465 = create_remote_graph_fn();
var state_126480__$1 = state_126480;
var statearr_126540_127152 = state_126480__$1;
(statearr_126540_127152[(2)] = inst_126465);

(statearr_126540_127152[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (19))){
var inst_126394 = (state_126480[(8)]);
var inst_126435 = (state_126480[(13)]);
var inst_126433 = cljs.core.deref(inst_126394);
var inst_126434 = cljs.core.second(inst_126433);
var inst_126435__$1 = frontend.fs.sync.graph_sync_off_QMARK_(inst_126434);
var state_126480__$1 = (function (){var statearr_126542 = state_126480;
(statearr_126542[(13)] = inst_126435__$1);

return statearr_126542;
})();
if(inst_126435__$1){
var statearr_126543_127153 = state_126480__$1;
(statearr_126543_127153[(1)] = (22));

} else {
var statearr_126544_127154 = state_126480__$1;
(statearr_126544_127154[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (11))){
var inst_126415 = (state_126480[(14)]);
var state_126480__$1 = state_126480;
var statearr_126545_127155 = state_126480__$1;
(statearr_126545_127155[(2)] = inst_126415);

(statearr_126545_127155[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (9))){
var inst_126394 = (state_126480[(8)]);
var inst_126415 = (state_126480[(14)]);
var inst_126413 = (state_126480[(2)]);
var inst_126414 = cljs.core.deref(inst_126394);
var inst_126415__$1 = cljs.core.first(inst_126414);
var state_126480__$1 = (function (){var statearr_126547 = state_126480;
(statearr_126547[(9)] = inst_126413);

(statearr_126547[(14)] = inst_126415__$1);

return statearr_126547;
})();
if(cljs.core.truth_(inst_126415__$1)){
var statearr_126548_127156 = state_126480__$1;
(statearr_126548_127156[(1)] = (10));

} else {
var statearr_126550_127159 = state_126480__$1;
(statearr_126550_127159[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (5))){
var inst_126478 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
return cljs.core.async.impl.ioc_helpers.return_chan(state_126480__$1,inst_126478);
} else {
if((state_val_126481 === (14))){
var inst_126413 = (state_126480[(9)]);
var state_126480__$1 = state_126480;
var statearr_126551_127160 = state_126480__$1;
(statearr_126551_127160[(2)] = inst_126413);

(statearr_126551_127160[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (26))){
var inst_126449 = frontend.fs.sync._LT_sync_start();
var state_126480__$1 = state_126480;
var statearr_126553_127161 = state_126480__$1;
(statearr_126553_127161[(2)] = inst_126449);

(statearr_126553_127161[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (16))){
var state_126480__$1 = state_126480;
var statearr_126554_127162 = state_126480__$1;
(statearr_126554_127162[(2)] = null);

(statearr_126554_127162[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (30))){
var inst_126394 = (state_126480[(8)]);
var inst_126460 = cljs.core.deref(inst_126394);
var inst_126461 = cljs.core.second(inst_126460);
var state_126480__$1 = state_126480;
if(cljs.core.truth_(inst_126461)){
var statearr_126555_127164 = state_126480__$1;
(statearr_126555_127164[(1)] = (32));

} else {
var statearr_126556_127165 = state_126480__$1;
(statearr_126556_127165[(1)] = (33));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (10))){
var inst_126413 = (state_126480[(9)]);
var state_126480__$1 = state_126480;
if(cljs.core.truth_(inst_126413)){
var statearr_126557_127166 = state_126480__$1;
(statearr_126557_127166[(1)] = (13));

} else {
var statearr_126558_127167 = state_126480__$1;
(statearr_126558_127167[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (18))){
var inst_126476 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126559_127168 = state_126480__$1;
(statearr_126559_127168[(2)] = inst_126476);

(statearr_126559_127168[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (37))){
var inst_126468 = (state_126480[(2)]);
var state_126480__$1 = state_126480;
var statearr_126560_127171 = state_126480__$1;
(statearr_126560_127171[(2)] = inst_126468);

(statearr_126560_127171[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126481 === (8))){
var inst_126408 = (state_126480[(11)]);
var state_126480__$1 = state_126480;
var statearr_126561_127173 = state_126480__$1;
(statearr_126561_127173[(2)] = inst_126408);

(statearr_126561_127173[(1)] = (9));


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
var frontend$components$file_sync$state_machine__32004__auto__ = null;
var frontend$components$file_sync$state_machine__32004__auto____0 = (function (){
var statearr_126562 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_126562[(0)] = frontend$components$file_sync$state_machine__32004__auto__);

(statearr_126562[(1)] = (1));

return statearr_126562;
});
var frontend$components$file_sync$state_machine__32004__auto____1 = (function (state_126480){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_126480);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e126564){var ex__32007__auto__ = e126564;
var statearr_126565_127174 = state_126480;
(statearr_126565_127174[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_126480[(4)]))){
var statearr_126566_127175 = state_126480;
(statearr_126566_127175[(1)] = cljs.core.first((state_126480[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__127176 = state_126480;
state_126480 = G__127176;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32004__auto__ = function(state_126480){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32004__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32004__auto____1.call(this,state_126480);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32004__auto____0;
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32004__auto____1;
return frontend$components$file_sync$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_126567 = f__32196__auto__();
(statearr_126567[(6)] = c__32195__auto__);

return statearr_126567;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
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
})())].join('')], null))], null))},[(((((!(frontend.config.publishing_QMARK_))) && (frontend.handler.user.logged_in_QMARK_())))?frontend.ui.dropdown_with_links((function (p__126590){
var map__126591 = p__126590;
var map__126591__$1 = cljs.core.__destructure_map(map__126591);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126591__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
if((!(off_QMARK_))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button.cloud.on","a.button.cloud.on",-435823998),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),toggle_fn,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"syncing","syncing",-291323582),syncing_QMARK_,new cljs.core.Keyword(null,"is-full","is-full",436383631),full_syncing_QMARK_,new cljs.core.Keyword(null,"queuing","queuing",-1502477638),queuing_QMARK_,new cljs.core.Keyword(null,"idle","idle",-2007156861),(((!(queuing_QMARK_))) && (idle_QMARK_))], null)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("cloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button.cloud.off","a.button.cloud.off",2106434377),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),turn_on], null),frontend.ui.icon("cloud-off",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null);
}
}),(function (){var G__126594 = cljs.core.vec(((((no_active_files_QMARK_) && (idle_QMARK_)))?null:((need_password_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item.flex.items-center.leading-none.pt-3","div.file-item.flex.items-center.leading-none.pt-3",-1729973654),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(-8)], null)], null),frontend.ui.icon("lock",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1.font-semibold","span.pl-1.font-semibold",-1207931896),"Password is required"], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.fs.sync.sync_need_password_BANG_], null)], null)], null):(((!(no_active_files_QMARK_)))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item.is-first","div.file-item.is-first",-135141546),""], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"is-first-placeholder"], null)], null)], null):null))));
if(cljs.core.truth_(synced_file_graph_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(G__126594,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (f){
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
var icon = (function (){var G__126602 = e.type;
switch (G__126602) {
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
var full_path = (function (){var G__126614 = frontend.config.get_repo_dir(current_repo);
var G__126615 = path;
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__126614,G__126615) : frontend.util.node_path.join.call(null,G__126614,G__126615));
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
return G__126594;
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
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs126643 = frontend.ui.icon("cloud-download",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126643))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs126643], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs126643))?null:[daiquiri.interpreter.interpret(attrs126643)]));
})()]),(function (){var attrs126636 = (function (){var G__126645 = "Sync graph \"%s\" to local";
var G__126646 = new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(graph);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__126645,G__126646) : frontend.util.format.call(null,G__126645,G__126646));
})();
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs126636))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mb-5","text-2xl","text-center","font-bold"], null)], null),attrs126636], 0))):{'className':"mb-5 text-2xl text-center font-bold"}),((cljs.core.map_QMARK_(attrs126636))?null:[daiquiri.interpreter.interpret(attrs126636)]));
})(),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Open a local directory",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"block w-full mt-4",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"lg","lg",-80787836),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_modal_BANG_();

frontend.fs.sync._LT_sync_stop();

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.handler.page.ls_dir_files_BANG_.cljs$core$IFn$_invoke$arity$2((function (p__126659){
var map__126660 = p__126659;
var map__126660__$1 = cljs.core.__destructure_map(map__126660);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126660__$1,new cljs.core.Keyword(null,"url","url",276297046));
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
})], 0))),(function (){var attrs126637 = frontend.ui.icon("alert-circle");
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126637))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","opacity-50","px-1","flex-row","flex","items-center","p-2"], null)], null),attrs126637], 0))):{'className':"text-xs opacity-50 px-1 flex-row flex items-center p-2"}),((cljs.core.map_QMARK_(attrs126637))?[daiquiri.core.create_element("span",{'className':"ml-1"},[" An empty directory or an existing remote graph!"])]:[daiquiri.interpreter.interpret(attrs126637),daiquiri.core.create_element("span",{'className':"ml-1"},[" An empty directory or an existing remote graph!"])]));
})()]);
}),null,"frontend.components.file-sync/pick-local-graph-for-sync");
frontend.components.file_sync.pick_dest_to_sync_panel = (function frontend$components$file_sync$pick_dest_to_sync_panel(graph){
return (function (){
return frontend.components.file_sync.pick_local_graph_for_sync(graph);
});
});
frontend.components.file_sync.page_history_list = rum.core.lazy_build(rum.core.build_defc,(function (graph_uuid,page_entity,set_list_ready_QMARK_,set_page){
var vec__126712 = rum.core.use_state(null);
var version_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126712,(0),null);
var set_version_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126712,(1),null);
var vec__126715 = rum.core.use_state(null);
var current_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126715,(0),null);
var set_current_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126715,(1),null);
var vec__126718 = rum.core.use_state(false);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126718,(0),null);
var set_loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126718,(1),null);
var set_page_fn = (function (page_meta){
(set_current_page.cljs$core$IFn$_invoke$arity$1 ? set_current_page.cljs$core$IFn$_invoke$arity$1(page_meta) : set_current_page.call(null,page_meta));

return (set_page.cljs$core$IFn$_invoke$arity$1 ? set_page.cljs$core$IFn$_invoke$arity$1(page_meta) : set_page.call(null,page_meta));
});
var get_version_key = (function (p1__126671_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(p1__126671_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(p1__126671_SHARP_);
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(loading_QMARK_)){
} else {
var c__32195__auto___127204 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_126745){
var state_val_126746 = (state_126745[(1)]);
if((state_val_126746 === (1))){
var inst_126723 = (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_QMARK_.call(null,true));
var state_126745__$1 = (function (){var statearr_126747 = state_126745;
(statearr_126747[(7)] = inst_126723);

return statearr_126747;
})();
var statearr_126749_127205 = state_126745__$1;
(statearr_126749_127205[(2)] = null);

(statearr_126749_127205[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126746 === (2))){
var _ = (function (){var statearr_126750 = state_126745;
(statearr_126750[(4)] = cljs.core.cons((4),(state_126745[(4)])));

return statearr_126750;
})();
var ___$1 = (function (){var statearr_126751 = state_126745;
(statearr_126751[(4)] = cljs.core.cons((5),(state_126745[(4)])));

return statearr_126751;
})();
var inst_126734 = frontend.handler.file_sync._LT_fetch_page_file_versions(graph_uuid,page_entity);
var state_126745__$1 = state_126745;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126745__$1,(6),inst_126734);
} else {
if((state_val_126746 === (3))){
var inst_126743 = (state_126745[(2)]);
var state_126745__$1 = state_126745;
return cljs.core.async.impl.ioc_helpers.return_chan(state_126745__$1,inst_126743);
} else {
if((state_val_126746 === (4))){
var _ = (function (){var statearr_126753 = state_126745;
(statearr_126753[(4)] = cljs.core.rest((state_126745[(4)])));

return statearr_126753;
})();
var inst_126725 = (state_126745[(2)]);
var inst_126726 = (set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_loading_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_QMARK_.call(null,false));
var ___$1 = (function (){var temp__5804__auto__ = (state_126745[(5)]);
if(cljs.core.truth_(temp__5804__auto__)){
var e__31236__auto__ = temp__5804__auto__;
throw e__31236__auto__;
} else {
return null;
}
})();
var state_126745__$1 = (function (){var statearr_126754 = state_126745;
(statearr_126754[(8)] = inst_126726);

return statearr_126754;
})();
var statearr_126755_127206 = state_126745__$1;
(statearr_126755_127206[(2)] = inst_126725);

(statearr_126755_127206[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126746 === (5))){
var _ = (function (){var statearr_126756 = state_126745;
(statearr_126756[(4)] = cljs.core.rest((state_126745[(4)])));

return statearr_126756;
})();
var state_126745__$1 = state_126745;
var ex126752 = (state_126745__$1[(2)]);
var statearr_126757_127207 = state_126745__$1;
(statearr_126757_127207[(5)] = ex126752);


throw ex126752;


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126746 === (6))){
var inst_126736 = (state_126745[(2)]);
var inst_126737 = (set_version_files.cljs$core$IFn$_invoke$arity$1 ? set_version_files.cljs$core$IFn$_invoke$arity$1(inst_126736) : set_version_files.call(null,inst_126736));
var inst_126738 = cljs.core.first(inst_126736);
var inst_126739 = set_page_fn(inst_126738);
var inst_126740 = (set_list_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_list_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_list_ready_QMARK_.call(null,true));
var _ = (function (){var statearr_126758 = state_126745;
(statearr_126758[(4)] = cljs.core.rest((state_126745[(4)])));

return statearr_126758;
})();
var state_126745__$1 = (function (){var statearr_126759 = state_126745;
(statearr_126759[(9)] = inst_126737);

(statearr_126759[(10)] = inst_126739);

return statearr_126759;
})();
var statearr_126760_127208 = state_126745__$1;
(statearr_126760_127208[(2)] = inst_126740);

(statearr_126760_127208[(1)] = (4));


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
var frontend$components$file_sync$state_machine__32004__auto__ = null;
var frontend$components$file_sync$state_machine__32004__auto____0 = (function (){
var statearr_126761 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_126761[(0)] = frontend$components$file_sync$state_machine__32004__auto__);

(statearr_126761[(1)] = (1));

return statearr_126761;
});
var frontend$components$file_sync$state_machine__32004__auto____1 = (function (state_126745){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_126745);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e126762){var ex__32007__auto__ = e126762;
var statearr_126763_127209 = state_126745;
(statearr_126763_127209[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_126745[(4)]))){
var statearr_126764_127210 = state_126745;
(statearr_126764_127210[(1)] = cljs.core.first((state_126745[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__127211 = state_126745;
state_126745 = G__127211;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32004__auto__ = function(state_126745){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32004__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32004__auto____1.call(this,state_126745);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32004__auto____0;
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32004__auto____1;
return frontend$components$file_sync$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_126767 = f__32196__auto__();
(statearr_126767[(6)] = c__32195__auto___127204);

return statearr_126767;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

}

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

var attrs126710 = (cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),frontend.ui.loading.cljs$core$IFn$_invoke$arity$0()], null):(function (){var iter__5480__auto__ = (function frontend$components$file_sync$iter__126772(s__126773){
return (new cljs.core.LazySeq(null,(function (){
var s__126773__$1 = s__126773;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__126773__$1);
if(temp__5804__auto__){
var s__126773__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__126773__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__126773__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__126775 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__126774 = (0);
while(true){
if((i__126774 < size__5479__auto__)){
var version = cljs.core._nth(c__5478__auto__,i__126774);
cljs.core.chunk_append(b__126775,(function (){var version_uuid = get_version_key(version);
var local_QMARK_ = (!((new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(version) == null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.version-list-item","div.version-list-item",-454444581),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),version_uuid], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.item-link.block.fade-link.flex.justify-between","a.item-link.block.fade-link.flex.justify-between",1384569968),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),version_uuid,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = current_page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(version_uuid,get_version_key(current_page));
} else {
return and__5000__auto__;
}
})()], null)], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__126774,version_uuid,local_QMARK_,version,c__5478__auto__,size__5479__auto__,b__126775,s__126773__$2,temp__5804__auto__,vec__126712,version_files,set_version_files,vec__126715,current_page,set_current_page,vec__126718,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key){
return (function (){
return set_page_fn(version);
});})(i__126774,version_uuid,local_QMARK_,version,c__5478__auto__,size__5479__auto__,b__126775,s__126773__$2,temp__5804__auto__,vec__126712,version_files,set_version_files,vec__126715,current_page,set_current_page,vec__126718,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pt-1","div.text-sm.pt-1",632701368),frontend.ui.humanity_time_ago((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(version);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(version);
}
})(),null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-50.translate-y-1.flex.items-center.space-x-1","small.opacity-50.translate-y-1.flex.items-center.space-x-1",799238304),((local_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("git-commit"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"local"], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("cloud"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"remote"], null)], null))], null)], null)], null);
})());

var G__127221 = (i__126774 + (1));
i__126774 = G__127221;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__126775),frontend$components$file_sync$iter__126772(cljs.core.chunk_rest(s__126773__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__126775),null);
}
} else {
var version = cljs.core.first(s__126773__$2);
return cljs.core.cons((function (){var version_uuid = get_version_key(version);
var local_QMARK_ = (!((new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(version) == null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.version-list-item","div.version-list-item",-454444581),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),version_uuid], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.item-link.block.fade-link.flex.justify-between","a.item-link.block.fade-link.flex.justify-between",1384569968),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),version_uuid,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = current_page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(version_uuid,get_version_key(current_page));
} else {
return and__5000__auto__;
}
})()], null)], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (version_uuid,local_QMARK_,version,s__126773__$2,temp__5804__auto__,vec__126712,version_files,set_version_files,vec__126715,current_page,set_current_page,vec__126718,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key){
return (function (){
return set_page_fn(version);
});})(version_uuid,local_QMARK_,version,s__126773__$2,temp__5804__auto__,vec__126712,version_files,set_version_files,vec__126715,current_page,set_current_page,vec__126718,loading_QMARK_,set_loading_QMARK_,set_page_fn,get_version_key))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.pt-1","div.text-sm.pt-1",632701368),frontend.ui.humanity_time_ago((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(version);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(version);
}
})(),null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-50.translate-y-1.flex.items-center.space-x-1","small.opacity-50.translate-y-1.flex.items-center.space-x-1",799238304),((local_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("git-commit"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"local"], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.ui.icon("cloud"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"remote"], null)], null))], null)], null)], null);
})(),frontend$components$file_sync$iter__126772(cljs.core.rest(s__126773__$2)));
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126710))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["version-list"], null)], null),attrs126710], 0))):{'className':"version-list"}),((cljs.core.map_QMARK_(attrs126710))?null:[daiquiri.interpreter.interpret(attrs126710)]));
}),null,"frontend.components.file-sync/page-history-list");
frontend.components.file_sync.pick_page_histories_for_sync = rum.core.lazy_build(rum.core.build_defc,(function (repo_url,graph_uuid,page_name,page_entity){
var vec__126793 = rum.core.use_state(null);
var selected_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126793,(0),null);
var set_selected_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126793,(1),null);
var get_version_key = (function (p1__126786_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(p1__126786_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"relative-path","relative-path",1848635172).cljs$core$IFn$_invoke$arity$1(p1__126786_SHARP_);
}
});
var file_uuid = new cljs.core.Keyword(null,"FileUUID","FileUUID",-1923309150).cljs$core$IFn$_invoke$arity$1(selected_page);
var version_uuid = new cljs.core.Keyword(null,"VersionUUID","VersionUUID",-2097775813).cljs$core$IFn$_invoke$arity$1(selected_page);
var vec__126796 = rum.core.use_state(null);
var version_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126796,(0),null);
var set_version_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126796,(1),null);
var vec__126799 = rum.core.use_state(false);
var list_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126799,(0),null);
var set_list_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126799,(1),null);
var vec__126802 = rum.core.use_state(false);
var content_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126802,(0),null);
var set_content_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126802,(1),null);
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
var G__126811_127236 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(loaded_contents,k);
(set_version_content.cljs$core$IFn$_invoke$arity$1 ? set_version_content.cljs$core$IFn$_invoke$arity$1(G__126811_127236) : set_version_content.call(null,G__126811_127236));

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
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_126856){
var state_val_126857 = (state_126856[(1)]);
if((state_val_126857 === (1))){
var inst_126847 = frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$4(graph_uuid,file_uuid,version_uuid,true);
var state_126856__$1 = state_126856;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_126856__$1,(2),inst_126847);
} else {
if((state_val_126857 === (2))){
var inst_126849 = (state_126856[(7)]);
var inst_126849__$1 = (state_126856[(2)]);
var state_126856__$1 = (function (){var statearr_126858 = state_126856;
(statearr_126858[(7)] = inst_126849__$1);

return statearr_126858;
})();
if(cljs.core.truth_(inst_126849__$1)){
var statearr_126860_127237 = state_126856__$1;
(statearr_126860_127237[(1)] = (3));

} else {
var statearr_126861_127238 = state_126856__$1;
(statearr_126861_127238[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126857 === (3))){
var inst_126849 = (state_126856[(7)]);
var inst_126851 = load_file_SINGLEQUOTE_(repo_url,inst_126849);
var state_126856__$1 = state_126856;
var statearr_126862_127239 = state_126856__$1;
(statearr_126862_127239[(2)] = inst_126851);

(statearr_126862_127239[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126857 === (4))){
var state_126856__$1 = state_126856;
var statearr_126863_127240 = state_126856__$1;
(statearr_126863_127240[(2)] = null);

(statearr_126863_127240[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_126857 === (5))){
var inst_126854 = (state_126856[(2)]);
var state_126856__$1 = state_126856;
return cljs.core.async.impl.ioc_helpers.return_chan(state_126856__$1,inst_126854);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$components$file_sync$state_machine__32004__auto__ = null;
var frontend$components$file_sync$state_machine__32004__auto____0 = (function (){
var statearr_126865 = [null,null,null,null,null,null,null,null];
(statearr_126865[(0)] = frontend$components$file_sync$state_machine__32004__auto__);

(statearr_126865[(1)] = (1));

return statearr_126865;
});
var frontend$components$file_sync$state_machine__32004__auto____1 = (function (state_126856){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_126856);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e126866){var ex__32007__auto__ = e126866;
var statearr_126867_127244 = state_126856;
(statearr_126867_127244[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_126856[(4)]))){
var statearr_126871_127245 = state_126856;
(statearr_126871_127245[(1)] = cljs.core.first((state_126856[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__127246 = state_126856;
state_126856 = G__127246;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$components$file_sync$state_machine__32004__auto__ = function(state_126856){
switch(arguments.length){
case 0:
return frontend$components$file_sync$state_machine__32004__auto____0.call(this);
case 1:
return frontend$components$file_sync$state_machine__32004__auto____1.call(this,state_126856);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$file_sync$state_machine__32004__auto____0;
frontend$components$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$file_sync$state_machine__32004__auto____1;
return frontend$components$file_sync$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_126872 = f__32196__auto__();
(statearr_126872[(6)] = c__32195__auto__);

return statearr_126872;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
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
frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","hidden-editors","editor/hidden-editors",254075860),(function (p1__126790_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__126790_SHARP_,page_name);
}));

return (function (){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("editor","hidden-editors","editor/hidden-editors",254075860),(function (p1__126791_SHARP_){
return cljs.core.disj.cljs$core$IFn$_invoke$arity$2(p1__126791_SHARP_,page_name);
}));
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name], null));

return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__file-sync-page-histories","flex-wrap",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"is-list-ready","is-list-ready",219673575),list_ready_QMARK_], null)], null))], null))},[(function (){var attrs126880 = frontend.ui.icon("history");
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs126880))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["absolute","top-0","left-0","text-xl","px-4","py-4","leading-4"], null)], null),attrs126880], 0))):{'className':"absolute top-0 left-0 text-xl px-4 py-4 leading-4"}),((cljs.core.map_QMARK_(attrs126880))?[" History for page ",(function (){var attrs126881 = original_page_name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126881))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium"], null)], null),attrs126881], 0))):{'className':"font-medium"}),((cljs.core.map_QMARK_(attrs126881))?null:[daiquiri.interpreter.interpret(attrs126881)]));
})()]:[daiquiri.interpreter.interpret(attrs126880)," History for page ",(function (){var attrs126884 = original_page_name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126884))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium"], null)], null),attrs126884], 0))):{'className':"font-medium"}),((cljs.core.map_QMARK_(attrs126884))?null:[daiquiri.interpreter.interpret(attrs126884)]));
})()]));
})(),daiquiri.core.create_element("div",{'className':"cp__file-sync-page-histories-left flex-wrap"},[frontend.components.file_sync.page_history_list(graph_uuid,page_entity,set_list_ready_QMARK_,set_selected_page),(function (){var attrs126897 = (function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = selected_page;
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
return daiquiri.core.create_element("article",((cljs.core.map_QMARK_(attrs126897))?daiquiri.interpreter.element_attributes(attrs126897):null),((cljs.core.map_QMARK_(attrs126897))?null:[daiquiri.interpreter.interpret(attrs126897)]));
})()]),daiquiri.core.create_element("div",{'className':"cp__file-sync-page-histories-right"},[daiquiri.core.create_element("h1",{'className':"title text-xl"},["Current version"]),frontend.components.page.page_blocks_cp(page_entity,null)]),(function (){var attrs126891 = frontend.ui.loading.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126891))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","h-full","justify-center","w-full","absolute","ready-loading"], null)], null),attrs126891], 0))):{'className':"flex items-center h-full justify-center w-full absolute ready-loading"}),((cljs.core.map_QMARK_(attrs126891))?null:[daiquiri.interpreter.interpret(attrs126891)]));
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
var vec__126905 = rum.core.use_state(false);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126905,(0),null);
var set_loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__126905,(1),null);
return daiquiri.core.create_element("div",{'className':"cp__file-sync-welcome-logseq-sync"},[daiquiri.core.create_element("span",{'className':"head-bg"},[daiquiri.core.create_element("strong",null,["CLOSED BETA"])]),daiquiri.core.create_element("h1",{'className':"text-2xl font-bold flex-col sm:flex-row"},[daiquiri.core.create_element("span",{'className':"opacity-80"},["Welcome to "]),daiquiri.core.create_element("span",{'className':"pl-2 dark:text-white text-gray-800"},["Logseq Sync! \uD83D\uDC4B"])]),daiquiri.core.create_element("h2",null,["No more cloud storage worries. With Logseq's encrypted file syncing, ",daiquiri.core.create_element("br",null,null),"you'll always have your notes backed up and available in real-time on any device."]),(function (){var attrs126916 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Later",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126916))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-center","space-x-2","sm:justify-end"], null)], null),attrs126916], 0))):{'className':"pt-6 flex justify-center space-x-2 sm:justify-end"}),((cljs.core.map_QMARK_(attrs126916))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Start syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
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
})], 0)))]:[daiquiri.interpreter.interpret(attrs126916),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Start syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
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
return daiquiri.core.create_element("div",{'className':"cp__file-sync-unavailable-logseq-sync"},[daiquiri.core.create_element("span",{'className':"head-bg"},null),daiquiri.core.create_element("h1",{'className':"text-2xl font-bold"},[daiquiri.core.create_element("span",{'className':"pr-2 dark:text-white text-gray-800"},["Logseq Sync"]),daiquiri.core.create_element("span",{'className':"opacity-80"},["is not yet available for you. \uD83D\uDE14 "])]),daiquiri.core.create_element("h2",null,["Thanks for creating an account! To ensure that our file syncing service runs well when we release it",daiquiri.core.create_element("br",null,null),"to our users, we need a little more time to test it. That\u2019s why we decided to first roll it out only to our ",daiquiri.core.create_element("br",null,null),"charitable OpenCollective sponsors and backers. We can notify you once it becomes available for you."]),(function (){var attrs126937 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Close",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126937))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-end","space-x-2"], null)], null),attrs126937], 0))):{'className':"pt-6 flex justify-end space-x-2"}),((cljs.core.map_QMARK_(attrs126937))?null:[daiquiri.interpreter.interpret(attrs126937)]));
})()]);
}),null,"frontend.components.file-sync/onboarding-unavailable-file-sync");
frontend.components.file_sync.onboarding_congrats_successful_sync = rum.core.lazy_build(rum.core.build_defc,(function (close_fn){
return daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs126952 = frontend.ui.icon("checkup-list",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(28)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126952))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs126952], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs126952))?null:[daiquiri.interpreter.interpret(attrs126952)]));
})()]),daiquiri.core.create_element("h1",{'className':"text-xl font-semibold opacity-90 text-center py-2"},[daiquiri.core.create_element("span",{'className':"dark:opacity-80"},["Congrats on your first successful sync!"])]),daiquiri.core.create_element("h2",{'className':"text-center dark:opacity-70 text-sm opacity-90"},[daiquiri.core.create_element("div",null,["By using this graph with Logseq Sync you can now transition seamlessly between your different "]),daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",null,["devices. Go to the "]),daiquiri.core.create_element("span",{'className':"dark:text-white"},["All Graphs "]),daiquiri.core.create_element("span",null,["pages to manage your remote graph or switch to another local graph "])]),daiquiri.core.create_element("div",null,["and sync it as well."])]),daiquiri.core.create_element("div",{'className':"cloud-tip rounded-md mt-6 py-4"},[daiquiri.core.create_element("div",{'className':"items-center opacity-90 flex justify-center"},[(function (){var attrs126956 = frontend.ui.icon("bell-ringing",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"font-semibold"], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs126956))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pr-2","flex"], null)], null),attrs126956], 0))):{'className':"pr-2 flex"}),((cljs.core.map_QMARK_(attrs126956))?null:[daiquiri.interpreter.interpret(attrs126956)]));
})(),daiquiri.core.create_element("strong",null,["Logseq Sync is still in Beta and we're working on a Pro plan!"])])]),(function (){var attrs126950 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Done",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs126950))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-end","space-x-2"], null)], null),attrs126950], 0))):{'className':"pt-6 flex justify-end space-x-2"}),((cljs.core.map_QMARK_(attrs126950))?null:[daiquiri.interpreter.interpret(attrs126950)]));
})()]);
}),null,"frontend.components.file-sync/onboarding-congrats-successful-sync");
frontend.components.file_sync.open_icloud_graph_clone_picker = (function frontend$components$file_sync$open_icloud_graph_clone_picker(var_args){
var G__126961 = arguments.length;
switch (G__126961) {
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
var G__126962 = (function (close_fn){
return frontend.components.file_sync.clone_local_icloud_graph_panel(repo,(frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(repo) : frontend.util.node_path.basename.call(null,repo)),close_fn);
});
var G__126963 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__126962,G__126963) : logseq.shui.ui.dialog_open_BANG_.call(null,G__126962,G__126963));
} else {
return null;
}
}));

(frontend.components.file_sync.open_icloud_graph_clone_picker.cljs$lang$maxFixedArity = 1);

frontend.components.file_sync.make_onboarding_panel = (function frontend$components$file_sync$make_onboarding_panel(type){
return (function (p__126964){
var map__126965 = p__126964;
var map__126965__$1 = cljs.core.__destructure_map(map__126965);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__126965__$1,new cljs.core.Keyword(null,"close","close",1835149582));
var G__126966 = type;
var G__126966__$1 = (((G__126966 instanceof cljs.core.Keyword))?G__126966.fqn:null);
switch (G__126966__$1) {
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
var G__126969_127268 = type;
var G__126969_127269__$1 = (((G__126969_127268 instanceof cljs.core.Keyword))?G__126969_127268.fqn:null);
switch (G__126969_127269__$1) {
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
}catch (e126968){var e = e126968;
return console.warn("[onboarding SKIP] ",cljs.core.name(type),e);
}}
});

//# sourceMappingURL=frontend.components.file_sync.js.map
