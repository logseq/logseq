goog.provide('frontend.handler.draw');
frontend.handler.draw.create_draws_directory_BANG_ = (function frontend$handler$draw$create_draws_directory_BANG_(repo){
if(cljs.core.truth_(repo)){
var repo_dir = frontend.config.get_repo_dir(repo);
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(frontend.fs.mkdir_BANG_([cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_dir),["/",logseq.common.config.default_draw_directory].join('')].join('')),(function (_result){
return null;
}),(function (_error){
return null;
}));
} else {
return null;
}
});
frontend.handler.draw.save_excalidraw_BANG_ = (function frontend$handler$draw$save_excalidraw_BANG_(file,data){
var path = file;
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_(repo)){
var repo_dir = frontend.config.get_repo_dir(repo);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.draw.create_draws_directory_BANG_(repo)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,repo_dir,path,data,null)),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(file) : frontend.util.page_name_sanity_lc.call(null,file)),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null)], null)], null)));
}));
}));
})),(function (error){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Write file failed, path: ",path,", data: ",data], 0));

return console.dir(error);
}));
} else {
return null;
}
});
frontend.handler.draw.load_excalidraw_file = (function frontend$handler$draw$load_excalidraw_file(file,ok_handler){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(frontend.handler.file_based.file.load_file(repo,file),(function (content){
return (ok_handler.cljs$core$IFn$_invoke$arity$1 ? ok_handler.cljs$core$IFn$_invoke$arity$1(content) : ok_handler.call(null,content));
}),(function (error){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error loading ",file,": ",error], 0));
}));
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.draw !== 'undefined') && (typeof frontend.handler.draw.default_content !== 'undefined')){
} else {
frontend.handler.draw.default_content = (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{\n  \"type\": \"excalidraw\",\n  \"version\": 2,\n  \"source\": \"%s\",\n  \"elements\": [],\n  \"appState\": {\n    \"viewBackgroundColor\": \"#FFF\",\n    \"gridSize\": null\n  }\n}",frontend.config.website) : frontend.util.format.call(null,"{\n  \"type\": \"excalidraw\",\n  \"version\": 2,\n  \"source\": \"%s\",\n  \"elements\": [],\n  \"appState\": {\n    \"viewBackgroundColor\": \"#FFF\",\n    \"gridSize\": null\n  }\n}",frontend.config.website));
}
frontend.handler.draw.file_name = (function frontend$handler$draw$file_name(){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.date.get_date_time_string_2()),".excalidraw"].join('');
});
frontend.handler.draw.create_draw_with_default_content = (function frontend$handler$draw$create_draw_with_default_content(current_file){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(frontend.config.get_repo_dir(repo),[logseq.common.config.default_draw_directory,cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_file)].join(''))),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?null:frontend.handler.draw.save_excalidraw_BANG_(current_file,frontend.handler.draw.default_content)));
}));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.draw.js.map
