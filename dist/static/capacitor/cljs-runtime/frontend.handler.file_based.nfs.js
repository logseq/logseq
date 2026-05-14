goog.provide('frontend.handler.file_based.nfs');
goog.scope(function(){
  frontend.handler.file_based.nfs.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.file_based.nfs.remove_ignore_files = (function frontend$handler$file_based$nfs$remove_ignore_files(files,dir_name,nfs_QMARK_){
var files__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (f){
var path = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(f);
var or__5002__auto__ = clojure.string.starts_with_QMARK_(path,".git/");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = clojure.string.includes_QMARK_(path,".git/");
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto__ = frontend.util.fs.ignored_path_QMARK_((cljs.core.truth_(nfs_QMARK_)?"":dir_name),path);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","name","file/name",1848919477).cljs$core$IFn$_invoke$arity$1(f),".gitignore");
} else {
return and__5000__auto__;
}
}
}
}),files);
var temp__5802__auto__ = cljs.core.some((function (p1__97843_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","name","file/name",1848919477).cljs$core$IFn$_invoke$arity$1(p1__97843_SHARP_),".gitignore")){
return p1__97843_SHARP_;
} else {
return null;
}
}),files__$1);
if(cljs.core.truth_(temp__5802__auto__)){
var ignore_file = temp__5802__auto__;
var temp__5802__auto____$1 = new cljs.core.Keyword("file","file","file/file",-1241327538).cljs$core$IFn$_invoke$arity$1(ignore_file);
if(cljs.core.truth_(temp__5802__auto____$1)){
var file = temp__5802__auto____$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(file.text()),(function (content){
return promesa.protocols._promise((cljs.core.truth_(content)?(function (){var paths = cljs.core.set(frontend.handler.common.ignore_files(content,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748),files__$1)));
if(cljs.core.seq(paths)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (f){
return cljs.core.contains_QMARK_(paths,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(f));
}),files__$1);
} else {
return null;
}
})():null));
}));
}));
} else {
return promesa.core.resolved(files__$1);
}
} else {
return promesa.core.resolved(files__$1);
}
});
frontend.handler.file_based.nfs.__GT_db_files = (function frontend$handler$file_based$nfs$__GT_db_files(result,nfs_QMARK_){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return nfs_QMARK_;
}
}
})())?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__97855){
var map__97856 = p__97855;
var map__97856__$1 = cljs.core.__destructure_map(map__97856);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97856__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97856__$1,new cljs.core.Keyword(null,"content","content",15833224));
var stat = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97856__$1,new cljs.core.Keyword(null,"stat","stat",-1370599836));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("file","path","file/path",-191335748),logseq.common.util.path_normalize(path),new cljs.core.Keyword("file","content","file/content",12680964),content,new cljs.core.Keyword(null,"stat","stat",-1370599836),stat], null);
}),result):result
));
});
frontend.handler.file_based.nfs.filter_markup_and_built_in_files = (function frontend$handler$file_based$nfs$filter_markup_and_built_in_files(files){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
return cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(frontend.config.markup_formats,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"css","css",1135045163),null,new cljs.core.Keyword(null,"edn","edn",1317840885),null], null), null)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.get_file_ext(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file))));
}),files);
});
/**
 * Check graph dir, notify user if:
 * 
 * - Graph dir contains a nested graph, which should be avoided
 * - Over 10000 files found in graph dir, which might cause performance issues
 */
frontend.handler.file_based.nfs.precheck_graph_dir = (function frontend$handler$file_based$nfs$precheck_graph_dir(_dir,files){
if(cljs.core.truth_(cljs.core.some((function (p1__97861_SHARP_){
return clojure.string.ends_with_QMARK_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__97861_SHARP_),"/logseq/config.edn");
}),files))){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),"It seems that you are trying to open a Logseq graph folder with nested graph. Please unlink this graph and choose a correct folder.",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));
} else {
}

if((cljs.core.count(files) >= (10000))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),"It seems that you are trying to open a Logseq graph folder that contains an excessive number of files, This might lead to performance issues.",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.Keyword(null,"clear?","clear?",1363344639),true], null)], null));
} else {
return null;
}
});
/**
 * Read files from directory and setup repo (for the first time setup a repo)
 */
frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_ = (function frontend$handler$file_based$nfs$ls_dir_files_with_handler_BANG_(var_args){
var G__97874 = arguments.length;
switch (G__97874) {
case 1:
return frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (ok_handler){
return frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$2(ok_handler,null);
}));

(frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (ok_handler,p__97881){
var map__97884 = p__97881;
var map__97884__$1 = cljs.core.__destructure_map(map__97884);
var on_open_dir = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97884__$1,new cljs.core.Keyword(null,"on-open-dir","on-open-dir",1666374285));
var dir_result_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97884__$1,new cljs.core.Keyword(null,"dir-result-fn","dir-result-fn",839285404));
var picked_root_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97884__$1,new cljs.core.Keyword(null,"picked-root-fn","picked-root-fn",42247568));
var dir = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97884__$1,new cljs.core.Keyword(null,"dir","dir",1734754661));
var electron_QMARK_ = frontend.util.electron_QMARK_();
var mobile_native_QMARK_ = frontend.mobile.util.native_platform_QMARK_();
var nfs_QMARK_ = ((cljs.core.not(electron_QMARK_)) && (cljs.core.not(mobile_native_QMARK_)));
var _STAR_repo = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.fn_QMARK_(dir_result_fn))?(dir_result_fn.cljs$core$IFn$_invoke$arity$0 ? dir_result_fn.cljs$core$IFn$_invoke$arity$0() : dir_result_fn.call(null)):frontend.fs.open_dir(dir))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.fn_QMARK_(on_open_dir))?(on_open_dir.cljs$core$IFn$_invoke$arity$1 ? on_open_dir.cljs$core$IFn$_invoke$arity$1(result) : on_open_dir.call(null,result)):null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(result)),(function (root_dir){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.fn_QMARK_(picked_root_fn))?(picked_root_fn.cljs$core$IFn$_invoke$arity$1 ? picked_root_fn.cljs$core$IFn$_invoke$arity$1(root_dir) : picked_root_fn.call(null,root_dir)):null)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise([frontend.config.local_db_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(root_dir)].join('')),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_loading_files_BANG_(repo,true)),(function (___51192__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.state.home_QMARK_())?null:frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$1(false))),(function (___51192__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_repo,repo)),(function (___51192__auto____$2){
return promesa.protocols._promise(((clojure.string.blank_QMARK_(root_dir))?null:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(result)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.nfs.precheck_graph_dir(root_dir,new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(result))),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.nfs.remove_ignore_files(frontend.handler.file_based.nfs.__GT_db_files(files,nfs_QMARK_),root_dir,nfs_QMARK_)),(function (files__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.nfs.filter_markup_and_built_in_files(files__$1)),(function (markup_files){
return promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(files__$1,(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__97872_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__97872_SHARP_,new cljs.core.Keyword("file","file","file/file",-1241327538));
}),result__$1)),(function (files__$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.fs.read_graphs_txid_info(root_dir)),(function (graphs_txid_meta){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(graphs_txid_meta);
if(and__5000__auto__){
return cljs.core.second(graphs_txid_meta);
} else {
return and__5000__auto__;
}
})()),(function (graph_uuid){
return promesa.protocols._promise((function (){var temp__5802__auto__ = frontend.state.get_sync_graph_by_id(graph_uuid);
if(cljs.core.truth_(temp__5802__auto__)){
var exists_graph = temp__5802__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),["This graph already exists in \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"root","root",-448657453).cljs$core$IFn$_invoke$arity$1(exists_graph)),"\""].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51203__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_new(repo,cljs.core.PersistentArrayMap.EMPTY)),(function (___51192__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.start_repo_db_if_not_exists_BANG_(repo)),(function (___51192__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?frontend.handler.global_config.restore_global_config_BANG_():null)),(function (___51192__auto____$5){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.load_new_repo_to_db_BANG_(repo,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),true,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),(cljs.core.seq(markup_files) == null),new cljs.core.Keyword(null,"file-objs","file-objs",545613385),files__$2], null))),(function (___51192__auto____$6){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541),false], null))),(function (___51192__auto____$7){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"url","url",276297046),repo,new cljs.core.Keyword(null,"nfs?","nfs?",-544337673),true], null))),(function (___51192__auto____$8){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,cljs.core.PersistentArrayMap.EMPTY)),(function (___51192__auto____$9){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_loading_files_BANG_(repo,false)),(function (___51192__auto____$10){
return promesa.protocols._promise((cljs.core.truth_(ok_handler)?(function (){var G__97913 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),repo], null);
return (ok_handler.cljs$core$IFn$_invoke$arity$1 ? ok_handler.cljs$core$IFn$_invoke$arity$1(G__97913) : ok_handler.call(null,G__97913));
})():null));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}
})());
}));
}));
}));
}));
})),(function (error){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.nfs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("nfs","load-files-error","nfs/load-files-error",1672347248),repo,new cljs.core.Keyword(null,"line","line",212345235),145], null)),null);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.nfs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),146], null)),error);
})));
}));
}));
}));
}));
}))));
}));
}));
}));
}));
}));
}));
}));
}));
})),(function (error){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.nfs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),148], null)),error);

if(cljs.core.truth_(mobile_native_QMARK_)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),cljs.core.str.cljs$core$IFn$_invoke$arity$1(error),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Error",null,"AbortError",null], null), null),frontend.handler.file_based.nfs.goog$module$goog$object.get(error,"name"))){
if(cljs.core.truth_(cljs.core.deref(_STAR_repo))){
frontend.state.set_loading_files_BANG_(cljs.core.deref(_STAR_repo),false);
} else {
}

throw error;
} else {
return null;
}
})),(function (){
return frontend.state.set_loading_files_BANG_(cljs.core.deref(_STAR_repo),false);
}));
}));

(frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_ = (function frontend$handler$file_based$nfs$ls_dir_files_with_path_BANG_(var_args){
var G__97921 = arguments.length;
switch (G__97921) {
case 1:
return frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (path){
return frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2(path,null);
}));

(frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (path,opts){
var temp__5804__auto__ = (function (){var and__5000__auto__ = path;
if(cljs.core.truth_(and__5000__auto__)){
return (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.open_dir(path)),(function (files_result){
return promesa.protocols._promise(files_result);
}));
}));
});
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var dir_result_fn = temp__5804__auto__;
return frontend.handler.file_based.nfs.ls_dir_files_with_handler_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089).cljs$core$IFn$_invoke$arity$1(opts),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dir-result-fn","dir-result-fn",839285404),dir_result_fn], null),opts], 0)));
} else {
return null;
}
}));

(frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.file_based.nfs.compute_diffs = (function frontend$handler$file_based$nfs$compute_diffs(old_files,new_files){
var ks = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),new cljs.core.Keyword("file","content","file/content",12680964)], null);
var __GT_set = (function (files,ks__$1){
if(cljs.core.seq(files)){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__97928_SHARP_){
return cljs.core.select_keys(p1__97928_SHARP_,ks__$1);
}),files));
} else {
return null;
}
});
var old_files__$1 = __GT_set(old_files,ks);
var new_files__$1 = __GT_set(new_files,ks);
var file_path_set_f = (function (col){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748),col));
});
var get_file_f = (function (files,path){
return cljs.core.some((function (p1__97929_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__97929_SHARP_),path)){
return p1__97929_SHARP_;
} else {
return null;
}
}),files);
});
var old_file_paths = file_path_set_f(old_files__$1);
var new_file_paths = file_path_set_f(new_files__$1);
var added = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(new_file_paths,old_file_paths);
var deleted = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(old_file_paths,new_file_paths);
var modified = cljs.core.set(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (path){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(get_file_f(old_files__$1,path)),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(get_file_f(new_files__$1,path)));
}),clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(new_file_paths,old_file_paths)));
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.handler.file-based.nfs","compute-diffs","frontend.handler.file-based.nfs/compute-diffs",-1942560919),new cljs.core.Keyword(null,"added","added",2057651688),cljs.core.count(added),new cljs.core.Keyword(null,"modified","modified",-2134587826),cljs.core.count(modified),new cljs.core.Keyword(null,"deleted","deleted",-510100639),cljs.core.count(deleted)], 0));

return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"added","added",2057651688),added,new cljs.core.Keyword(null,"modified","modified",-2134587826),modified,new cljs.core.Keyword(null,"deleted","deleted",-510100639),deleted], null);
});
/**
 * Compute directory diffs and (re)load repo
 */
frontend.handler.file_based.nfs.handle_diffs_BANG_ = (function frontend$handler$file_based$nfs$handle_diffs_BANG_(repo,nfs_QMARK_,old_files,new_files,re_index_QMARK_,ok_handler){
var get_last_modified_at = (function (path){
return cljs.core.some((function (file){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file))){
return new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310).cljs$core$IFn$_invoke$arity$1(file);
} else {
return null;
}
}),new_files);
});
var get_file_f = (function (path,files){
return cljs.core.some((function (p1__97944_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__97944_SHARP_),path)){
return p1__97944_SHARP_;
} else {
return null;
}
}),files);
});
var map__97952 = frontend.handler.file_based.nfs.compute_diffs(old_files,new_files);
var map__97952__$1 = cljs.core.__destructure_map(map__97952);
var added = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97952__$1,new cljs.core.Keyword(null,"added","added",2057651688));
var modified = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97952__$1,new cljs.core.Keyword(null,"modified","modified",-2134587826));
var deleted = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97952__$1,new cljs.core.Keyword(null,"deleted","deleted",-510100639));
var rename_f = (function (typ,col){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (file){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),typ,new cljs.core.Keyword(null,"path","path",-188191168),file,new cljs.core.Keyword(null,"last-modified-at","last-modified-at",478765450),get_last_modified_at(file)], null);
}),col);
});
var added_or_modified = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(added,modified));
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (path){
var temp__5804__auto__ = get_file_f(path,new_files);
if(cljs.core.truth_(temp__5804__auto__)){
var file = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(nfs_QMARK_)?new cljs.core.Keyword("file","file","file/file",-1241327538).cljs$core$IFn$_invoke$arity$1(file).text():new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file))),(function (content){
return promesa.protocols._promise(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(file,new cljs.core.Keyword("file","content","file/content",12680964),content));
}));
}));
} else {
return null;
}
}),added_or_modified)),(function (result){
var files = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__97945_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__97945_SHARP_,new cljs.core.Keyword("file","file","file/file",-1241327538));
}),result);
var vec__97961 = (cljs.core.truth_(re_index_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [files,cljs.core.set(modified)], null):(function (){var modified_files = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
return cljs.core.contains_QMARK_(added_or_modified,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file));
}),files);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [modified_files,cljs.core.set(modified)], null);
})());
var modified_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97961,(0),null);
var modified__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97961,(1),null);
var diffs = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(rename_f("remove",deleted),rename_f("add",added),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rename_f("modify",modified__$1)], 0));
if(((((cljs.core.seq(diffs)) && (cljs.core.seq(modified_files)))) || (cljs.core.seq(diffs)))){
promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.repo.load_repo_to_db_BANG_(repo,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"diffs","diffs",-1720136241),diffs,new cljs.core.Keyword(null,"nfs-files","nfs-files",-360703182),modified_files,new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570),cljs.core.not(re_index_QMARK_),new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),re_index_QMARK_], null)),(function (_state){
return (ok_handler.cljs$core$IFn$_invoke$arity$0 ? ok_handler.cljs$core$IFn$_invoke$arity$0() : ok_handler.call(null));
})),(function (error){
return console.error("load-repo-to-db",error);
}));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(re_index_QMARK_);
} else {
return and__5000__auto__;
}
})())){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo,new_files);
} else {
return null;
}
}));
});
/**
 * Handle refresh and re-index
 */
frontend.handler.file_based.nfs.reload_dir_BANG_ = (function frontend$handler$file_based$nfs$reload_dir_BANG_(repo,p__97969){
var map__97971 = p__97969;
var map__97971__$1 = cljs.core.__destructure_map(map__97971);
var re_index_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__97971__$1,new cljs.core.Keyword(null,"re-index?","re-index?",1279325395),false);
var ok_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97971__$1,new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089));
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.config.local_file_based_graph_QMARK_(repo);
} else {
return and__5000__auto__;
}
})())){
var old_files = (frontend.db.get_files_full.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_files_full.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_files_full.call(null,repo));
var repo_dir = frontend.config.get_local_dir(repo);
var handle_path = ["handle/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_dir)].join('');
var electron_QMARK_ = frontend.util.electron_QMARK_();
var mobile_native_QMARK_ = frontend.mobile.util.native_platform_QMARK_();
var nfs_QMARK_ = ((cljs.core.not(electron_QMARK_)) && (cljs.core.not(mobile_native_QMARK_)));
if(cljs.core.truth_(re_index_QMARK_)){
frontend.state.set_graph_syncing_QMARK_(true);
} else {
}

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(electron_QMARK_)?null:frontend.idb.get_item(handle_path))),(function (handle){
return promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = handle;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = electron_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return mobile_native_QMARK_;
}
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((nfs_QMARK_)?frontend.fs.nfs.verify_permission(repo,true):null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.get_files(repo_dir)),(function (local_files_result){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?frontend.handler.global_config.restore_global_config_BANG_():null)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.nfs.remove_ignore_files(frontend.handler.file_based.nfs.__GT_db_files(new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(local_files_result),nfs_QMARK_),repo_dir,nfs_QMARK_)),(function (new_files){
return promesa.protocols._promise(frontend.handler.file_based.nfs.handle_diffs_BANG_(repo,nfs_QMARK_,old_files,new_files,re_index_QMARK_,ok_handler));
}));
}));
}));
}));
})):null));
}));
})),(function (error){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.nfs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("nfs","load-files-error","nfs/load-files-error",1672347248),repo,new cljs.core.Keyword(null,"line","line",212345235),265], null)),null);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.nfs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),266], null)),error);
})),(function (_){
return frontend.state.set_graph_syncing_QMARK_(false);
}));
} else {
return null;
}
});
frontend.handler.file_based.nfs.rebuild_index_BANG_ = (function frontend$handler$file_based$nfs$rebuild_index_BANG_(repo,ok_handler){
var graph_dir = frontend.config.get_repo_dir(repo);
if(cljs.core.truth_(repo)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51203__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.remove_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),repo], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"switch-graph?","switch-graph?",1080858350),false], 0))),(function (___51192__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.nfs.ls_dir_files_with_path_BANG_.cljs$core$IFn$_invoke$arity$2(graph_dir,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"re-index?","re-index?",1279325395),true], null))),(function (___51192__auto____$1){
return promesa.protocols._promise(((cljs.core.fn_QMARK_(ok_handler))?(ok_handler.cljs$core$IFn$_invoke$arity$0 ? ok_handler.cljs$core$IFn$_invoke$arity$0() : ok_handler.call(null)):null));
}));
}));
}));
} else {
return null;
}
});
frontend.handler.file_based.nfs.refresh_BANG_ = (function frontend$handler$file_based$nfs$refresh_BANG_(repo,ok_handler){
var ok_handler__$1 = (function (){
(ok_handler.cljs$core$IFn$_invoke$arity$0 ? ok_handler.cljs$core$IFn$_invoke$arity$0() : ok_handler.call(null));

return frontend.state.set_nfs_refreshing_BANG_(false);
});
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.state.unlinked_dir_QMARK_(frontend.config.get_repo_dir(repo))));
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_nfs_refreshing_BANG_(true);

return frontend.handler.file_based.nfs.reload_dir_BANG_(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089),ok_handler__$1], null));
} else {
return null;
}
});
frontend.handler.file_based.nfs.supported_QMARK_ = (function frontend$handler$file_based$nfs$supported_QMARK_(){
var or__5002__auto__ = module$frontend$utils.nfsSupported();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.electron_QMARK_();
}
});

//# sourceMappingURL=frontend.handler.file_based.nfs.js.map
