goog.provide('frontend.fs.capacitor_fs');
var module$node_modules$$capacitor$filesystem$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$filesystem$dist$plugin_cjs", {});
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
frontend.fs.capacitor_fs.ios_ensure_documents_BANG_ = (function frontend$fs$capacitor_fs$ios_ensure_documents_BANG_(){
return frontend.mobile.util.ios_file_container.ensureDocuments();
});
} else {
}
if(cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())){
frontend.fs.capacitor_fs.android_check_permission = (function frontend$fs$capacitor_fs$android_check_permission(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.checkPermissions()),(function (permission){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"publicStorage","publicStorage",-1416960599).cljs$core$IFn$_invoke$arity$1(cljs_bean.core.__GT_clj(permission))),(function (permission__$1){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(permission__$1,"granted"))?null:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41073__auto__){
return promesa.protocols._promise(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.requestPermissions());
}))));
}));
}));
}));
});
} else {
}
frontend.fs.capacitor_fs._LT_dir_exists_QMARK_ = (function frontend$fs$capacitor_fs$_LT_dir_exists_QMARK_(fpath){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.path_normalize(fpath)),(function (fpath__$1){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.stat(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),fpath__$1], null)))),(function (stat){
return promesa.protocols._promise(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs_bean.core.__GT_clj(stat)),"directory"));
}));
}));
})),(function (_error){
return false;
}));
});
/**
 * Write a binary file, requires base64 encoding
 */
frontend.fs.capacitor_fs._LT_write_file_with_base64 = (function frontend$fs$capacitor_fs$_LT_write_file_with_base64(path,content){
if(clojure.string.blank_QMARK_(path)){
return null;
} else {
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.writeFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"data","data",-232669377),content,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null))),(function (p1__48204_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48204_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),(function (error){
console.error("writeFile Error: ",path,": ",error);

return null;
}));
}
});
frontend.fs.capacitor_fs._LT_write_file_with_utf8 = (function frontend$fs$capacitor_fs$_LT_write_file_with_utf8(path,content){
if(clojure.string.blank_QMARK_(path)){
return null;
} else {
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.writeFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"data","data",-232669377),content,new cljs.core.Keyword(null,"encoding","encoding",1728578272),module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Encoding.UTF8,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null))),(function (p1__48209_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48209_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),(function (error){
console.error("writeFile Error: ",path,": ",error);

return null;
}));
}
});
frontend.fs.capacitor_fs._LT_read_file_with_utf8 = (function frontend$fs$capacitor_fs$_LT_read_file_with_utf8(path){
if(clojure.string.blank_QMARK_(path)){
return null;
} else {
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$variadic(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.readFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"encoding","encoding",1728578272),module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Encoding.UTF8], null))),(function (p1__48215_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48215_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (p1__48216_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__48216_SHARP_,new cljs.core.Keyword(null,"data","data",-232669377),null);
})], 0)),(function (error){
console.error("readFile Error: ",path,": ",error);

return null;
}));
}
});
frontend.fs.capacitor_fs._LT_readdir = (function frontend$fs$capacitor_fs$_LT_readdir(path){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$variadic(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.readdir(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),path], null))),(function (p1__48223_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48223_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"files","files",-472457450)], 0)),(function (error){
console.error("readdir Error: ",path,": ",error);

return null;
}));
});
/**
 * get all file paths recursively
 */
frontend.fs.capacitor_fs.get_file_paths = (function frontend$fs$capacitor_fs$get_file_paths(path){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_48250,reject_fn_48249){
var loop_fn_48246 = (function frontend$fs$capacitor_fs$get_file_paths_$_loop_fn_48246(result,dirs){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_48247,err_48248){
if((!((err_48248 == null)))){
return (reject_fn_48249.cljs$core$IFn$_invoke$arity$1 ? reject_fn_48249.cljs$core$IFn$_invoke$arity$1(err_48248) : reject_fn_48249.call(null,err_48248));
} else {
if(promesa.core.recur_QMARK_(res_48247)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$fs$capacitor_fs$get_file_paths_$_loop_fn_48246,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_48247));
})));

return null;
} else {
return (resolve_fn_48250.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_48250.cljs$core$IFn$_invoke$arity$1(res_48247) : resolve_fn_48250.call(null,res_48247));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(result),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(dirs),(function (dirs__$1){
return promesa.protocols._promise(((cljs.core.empty_QMARK_(dirs__$1))?result__$1:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(dirs__$1)),(function (d){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_readdir(d)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__48265){
var map__48266 = p__48265;
var map__48266__$1 = cljs.core.__destructure_map(map__48266);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48266__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48266__$1,new cljs.core.Keyword(null,"type","type",1174270348));
return ((clojure.string.starts_with_QMARK_(name,".")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"directory")) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"bak")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"version-files")))))));
}),files)),(function (files__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uri","uri",-774711847),cljs.core.filterv((function (p1__48234_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__48234_SHARP_),"directory");
}),files__$1))),(function (files_dir){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uri","uri",-774711847),cljs.core.filterv((function (p1__48235_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__48235_SHARP_),"file");
}),files__$1))),(function (paths_result){
return promesa.protocols._promise(promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result__$1,paths_result),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(dirs__$1),files_dir)], null)));
}));
}));
}));
}));
}));
}))));
}));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_48246(cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [path], null));
})));
}))),(function (result){
return promesa.protocols._promise(result);
}));
}));
});
/**
 * get all files and contents recursively
 */
frontend.fs.capacitor_fs.get_files = (function frontend$fs$capacitor_fs$get_files(path){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_48277,reject_fn_48276){
var loop_fn_48273 = (function frontend$fs$capacitor_fs$get_files_$_loop_fn_48273(result,dirs){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_48274,err_48275){
if((!((err_48275 == null)))){
return (reject_fn_48276.cljs$core$IFn$_invoke$arity$1 ? reject_fn_48276.cljs$core$IFn$_invoke$arity$1(err_48275) : reject_fn_48276.call(null,err_48275));
} else {
if(promesa.core.recur_QMARK_(res_48274)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$fs$capacitor_fs$get_files_$_loop_fn_48273,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_48274));
})));

return null;
} else {
return (resolve_fn_48277.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_48277.cljs$core$IFn$_invoke$arity$1(res_48274) : resolve_fn_48277.call(null,res_48274));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(result),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(dirs),(function (dirs__$1){
return promesa.protocols._promise(((cljs.core.empty_QMARK_(dirs__$1))?result__$1:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(dirs__$1)),(function (d){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_readdir(d)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__48283){
var map__48284 = p__48283;
var map__48284__$1 = cljs.core.__destructure_map(map__48284);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48284__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48284__$1,new cljs.core.Keyword(null,"type","type",1174270348));
return ((clojure.string.starts_with_QMARK_(name,".")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"directory")) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"bak")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"version-files")))))));
}),files)),(function (files__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uri","uri",-774711847),cljs.core.filterv((function (p1__48269_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__48269_SHARP_),"directory");
}),files__$1))),(function (files_dir){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__48288){
var map__48289 = p__48288;
var map__48289__$1 = cljs.core.__destructure_map(map__48289);
var file_info = map__48289__$1;
var uri = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48289__$1,new cljs.core.Keyword(null,"uri","uri",-774711847));
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(frontend.fs.capacitor_fs._LT_read_file_with_utf8(uri),(function (p1__48272_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(file_info,new cljs.core.Keyword(null,"uri","uri",-774711847)),new cljs.core.Keyword(null,"content","content",15833224),p1__48272_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path","path",-188191168),uri], 0));
}));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__48294){
var map__48295 = p__48294;
var map__48295__$1 = cljs.core.__destructure_map(map__48295);
var uri = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48295__$1,new cljs.core.Keyword(null,"uri","uri",-774711847));
return cljs.core.some((function (p1__48271_SHARP_){
return clojure.string.ends_with_QMARK_(uri,p1__48271_SHARP_);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [".md",".markdown",".org",".edn",".css"], null));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__48270_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__48270_SHARP_),"file");
}),files__$1))))),(function (files_result){
return promesa.protocols._promise(promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result__$1,files_result),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(dirs__$1),files_dir)], null)));
}));
}));
}));
}));
}));
}))));
}));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_48273(cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [path], null));
})));
}))),(function (result){
return promesa.protocols._promise(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
}));
}));
});
frontend.fs.capacitor_fs._LT_contents_matched_QMARK_ = (function frontend$fs$capacitor_fs$_LT_contents_matched_QMARK_(disk_content,db_content){
if(((typeof disk_content === 'string') && (typeof db_content === 'string'))){
return promesa.core.resolved(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(disk_content),clojure.string.trim(db_content)));
} else {
return null;
}
});
frontend.fs.capacitor_fs.backup_dir = "logseq/bak";
frontend.fs.capacitor_fs.version_file_dir = "logseq/version-files/local";
frontend.fs.capacitor_fs.get_backup_dir = (function frontend$fs$capacitor_fs$get_backup_dir(repo_dir,path,bak_dir,ext){
var relative_path = clojure.string.replace(clojure.string.replace(path,cljs.core.re_pattern(["^",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.string.regExpEscape(repo_dir))].join('')),""),cljs.core.re_pattern(["(?i)",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.string.regExpEscape([".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join(''))),"$"].join('')),"");
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([bak_dir,relative_path], 0));
});
/**
 * reserve the latest 6 version files
 */
frontend.fs.capacitor_fs._LT_truncate_old_versioned_files_BANG_ = (function frontend$fs$capacitor_fs$_LT_truncate_old_versioned_files_BANG_(dir){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.readdir(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),dir], null)))),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(files,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)))),(function (files__$1){
return promesa.protocols._promise(cljs.core.drop.cljs$core$IFn$_invoke$arity$2((6),cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"mtime","mtime",963165087),files__$1))));
}));
}));
})),(function (old_version_files){
return promesa.core.all(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (file){
return module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.deleteFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"uri","uri",-774711847).cljs$core$IFn$_invoke$arity$1(file)], null)));
}),old_version_files));
})),(function (_){
return null;
}));
});
/**
 * backup CONTENT under DIR :backup-dir or :version-file-dir
 *   :backup-dir = `backup-dir`
 *   :version-file-dir = `version-file-dir`
 */
frontend.fs.capacitor_fs.backup_file = (function frontend$fs$capacitor_fs$backup_file(repo,dir,path,content){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"version-file-dir","version-file-dir",-1572593656),null,new cljs.core.Keyword(null,"backup-dir","backup-dir",287434857),null], null), null),dir)){
} else {
throw (new Error("Assert failed: (contains? #{:version-file-dir :backup-dir} dir)"));
}

var repo_dir = frontend.config.get_local_dir(repo);
var ext = frontend.util.get_file_ext(path);
var dir__$1 = (function (){var G__48314 = dir;
var G__48314__$1 = (((G__48314 instanceof cljs.core.Keyword))?G__48314.fqn:null);
switch (G__48314__$1) {
case "backup-dir":
return frontend.fs.capacitor_fs.get_backup_dir(repo_dir,path,frontend.fs.capacitor_fs.backup_dir,ext);

break;
case "version-file-dir":
return frontend.fs.capacitor_fs.get_backup_dir(repo_dir,path,frontend.fs.capacitor_fs.version_file_dir,ext);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__48314__$1)].join('')));

}
})();
var new_path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[clojure.string.replace((new Date()).toISOString(),":","_"),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.mobile.util.platform()),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join('')], 0));
frontend.fs.capacitor_fs._LT_write_file_with_utf8(new_path,content);

return frontend.fs.capacitor_fs._LT_truncate_old_versioned_files_BANG_(dir__$1);
});
frontend.fs.capacitor_fs.backup_file_handle_changed_BANG_ = (function frontend$fs$capacitor_fs$backup_file_handle_changed_BANG_(repo_dir,file_path,content){
var divider_schema = "://";
var file_schema = clojure.string.split.cljs$core$IFn$_invoke$arity$2(file_path,divider_schema);
var file_schema__$1 = (((cljs.core.count(file_schema) > (1)))?cljs.core.first(file_schema):"");
var dir_schema_QMARK_ = ((typeof repo_dir === 'string') && (clojure.string.includes_QMARK_(repo_dir,divider_schema)));
var repo_dir__$1 = (((!(dir_schema_QMARK_)))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_schema__$1),divider_schema,cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_dir)].join(''):repo_dir);
var backup_root = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.fs.capacitor_fs.backup_dir], 0));
var backup_dir_parent = (frontend.util.node_path.dirname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.dirname.cljs$core$IFn$_invoke$arity$1(file_path) : frontend.util.node_path.dirname.call(null,file_path));
var backup_dir_parent__$1 = clojure.string.replace(backup_dir_parent,repo_dir__$1,"");
var backup_dir_name = (frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1(file_path) : frontend.util.node_path.name.call(null,file_path));
var file_extname = frontend.util.node_path.extname(file_path);
var file_root = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(backup_root,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([backup_dir_parent__$1,backup_dir_name], 0));
var file_path__$1 = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(file_root,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[clojure.string.replace((new Date()).toISOString(),":","_"),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.mobile.util.platform()),cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_extname)].join('')], 0));
frontend.fs.capacitor_fs._LT_write_file_with_utf8(file_path__$1,content);

return frontend.fs.capacitor_fs._LT_truncate_old_versioned_files_BANG_(file_root);
});
frontend.fs.capacitor_fs.write_file_impl_BANG_ = (function frontend$fs$capacitor_fs$write_file_impl_BANG_(repo,dir,rpath,content,p__48336,stat){
var map__48337 = p__48336;
var map__48337__$1 = cljs.core.__destructure_map(map__48337);
var ok_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48337__$1,new cljs.core.Keyword(null,"ok-handler","ok-handler",-804644089));
var error_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48337__$1,new cljs.core.Keyword(null,"error-handler","error-handler",-484945776));
var old_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48337__$1,new cljs.core.Keyword(null,"old-content","old-content",1851086779));
var skip_compare_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48337__$1,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960));
var fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rpath], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = clojure.string.blank_QMARK_(repo);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return skip_compare_QMARK_;
}
})())){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_write_file_with_utf8(fpath,content)),(function (result){
return promesa.protocols._promise((cljs.core.truth_(ok_handler)?(ok_handler.cljs$core$IFn$_invoke$arity$3 ? ok_handler.cljs$core$IFn$_invoke$arity$3(repo,fpath,result) : ok_handler.call(null,repo,fpath,result)):null));
}));
})),(function (error){
if(cljs.core.truth_(error_handler)){
return (error_handler.cljs$core$IFn$_invoke$arity$1 ? error_handler.cljs$core$IFn$_invoke$arity$1(error) : error_handler.call(null,error));
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"write-file-failed","write-file-failed",1274270449),error,new cljs.core.Keyword(null,"line","line",212345235),226], null)),null);
}
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(stat,new cljs.core.Keyword(null,"not-found","not-found",-629079980)))?frontend.fs.capacitor_fs._LT_read_file_with_utf8(fpath):"")),(function (disk_content){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = disk_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()),(function (disk_content__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_local_dir(repo)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = old_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (frontend.db.get_file.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$2(repo,rpath) : frontend.db.get_file.call(null,repo,rpath));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
}
})()),(function (db_content){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_contents_matched_QMARK_(disk_content__$1,db_content)),(function (contents_matched_QMARK_){
return promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_write_file_with_utf8(fpath,content)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"mtime","mtime",963165087).cljs$core$IFn$_invoke$arity$1(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(stat,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)))),(function (mtime){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(contents_matched_QMARK_)?null:frontend.fs.capacitor_fs.backup_file(repo_dir,new cljs.core.Keyword(null,"backup-dir","backup-dir",287434857),fpath,disk_content__$1))),(function (___41063__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.set_file_last_modified_at_BANG_(repo,rpath,mtime)),(function (___41063__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3(repo,rpath,content)),(function (___41063__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(ok_handler)?(ok_handler.cljs$core$IFn$_invoke$arity$3 ? ok_handler.cljs$core$IFn$_invoke$arity$3(repo,fpath,result) : ok_handler.call(null,repo,fpath,result)):null)),(function (___41063__auto____$3){
return promesa.protocols._promise(result);
}));
}));
}));
}));
}));
}));
})),(function (error){
if(cljs.core.truth_(error_handler)){
return (error_handler.cljs$core$IFn$_invoke$arity$1 ? error_handler.cljs$core$IFn$_invoke$arity$1(error) : error_handler.call(null,error));
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"write-file-failed","write-file-failed",1274270449),error,new cljs.core.Keyword(null,"line","line",212345235),250], null)),null);
}
})));
}));
}));
}));
}));
}));
}));
}
});
/**
 * iOS sometimes return paths without the private part.
 */
frontend.fs.capacitor_fs.ios_force_include_private = (function frontend$fs$capacitor_fs$ios_force_include_private(path){
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
if(((clojure.string.includes_QMARK_(path,"///private/")) || (clojure.string.starts_with_QMARK_(path,"file:///Users/")))){
return path;
} else {
if(clojure.string.includes_QMARK_(path,"///")){
var vec__48389 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(path,"///");
var prefix = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__48389,(0),null);
var others = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__48389,(1),null);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),"///private/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(others)].join('');
} else {
return path;

}
}
} else {
return path;
}
});
/**
 * Check whether `path' is logseq's container `localDocumentsPath' on iOS
 */
frontend.fs.capacitor_fs.local_container_path_QMARK_ = (function frontend$fs$capacitor_fs$local_container_path_QMARK_(path,localDocumentsPath){
return clojure.string.includes_QMARK_(path,localDocumentsPath);
});
frontend.fs.capacitor_fs.instruction = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"instruction"},[daiquiri.core.create_element("h1",{'className':"title"},["Please choose a valid directory!"]),daiquiri.core.create_element("p",{'className':"leading-6"},["Logseq app can only save or access your graphs stored in a specific directory with a ",daiquiri.core.create_element("strong",null,["Logseq icon"])," inside, located either in \"iCloud Drive\", \"On My iPhone\" or \"On My iPad\"."]),daiquiri.core.create_element("p",{'className':"leading-6"},["Please watch the following short instruction video. ",daiquiri.core.create_element("small",{'className':"text-gray-500"},["(may take few seconds to load...)"])]),daiquiri.core.create_element("iframe",{'src':"https://www.loom.com/embed/dae612ae5fd94e508bd0acdf02efb888",'frameBorder':"0",'position':"relative",'allowFullScreen':"allowfullscreen",'webkitAllowFullScreen':"webkitallowfullscreen",'height':"100%"},null)]);
}),null,"frontend.fs.capacitor-fs/instruction");
frontend.fs.capacitor_fs.open_dir = (function frontend$fs$capacitor_fs$open_dir(dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())?frontend.fs.capacitor_fs.android_check_permission():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.mobile.util.folder_picker.pickFolder(cljs.core.clj__GT_js((cljs.core.truth_((function (){var and__5000__auto__ = dir;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.mobile.util.native_ios_QMARK_();
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),dir], null):null))),(function (p1__48409_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48409_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),(function (e){
alert(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e));

return null;
}))),(function (p__48429){
var map__48430 = p__48429;
var map__48430__$1 = cljs.core.__destructure_map(map__48430);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48430__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var localDocumentsPath = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__48430__$1,new cljs.core.Keyword(null,"localDocumentsPath","localDocumentsPath",1185925114));
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = frontend.mobile.util.native_ios_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return (!(((frontend.fs.capacitor_fs.local_container_path_QMARK_(path,localDocumentsPath)) || (frontend.mobile.util.in_iCloud_container_path_QMARK_(path)))));
} else {
return and__5000__auto__;
}
})())?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-instruction","modal/show-instruction",-270524467)], null)):null)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs._LT_dir_exists_QMARK_(path)),(function (exists_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?null:promesa.core.rejected(["Cannot access selected directory: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join('')))),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.is_iCloud_container_path_QMARK_(path))?promesa.core.rejected(["Please avoid accessing the top-level iCloud container path: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join('')):null)),(function (___$3){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?frontend.fs.capacitor_fs.ios_force_include_private(path):path)),(function (path__$1){
return promesa.protocols._mcat(promesa.protocols._promise(console.log("Opening or Creating graph at directory: ",path__$1)),(function (___$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.capacitor_fs.get_files(path__$1)),(function (files){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path__$1,new cljs.core.Keyword(null,"files","files",-472457450),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,files)], null));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});

/**
* @constructor
 * @implements {frontend.fs.protocol.Fs}
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
frontend.fs.capacitor_fs.Capacitorfs = (function (__meta,__extmap,__hash){
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k48475,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__48509 = k48475;
switch (G__48509) {
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k48475,else__5303__auto__);

}
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__48511){
var vec__48512 = p__48511;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__48512,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__48512,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#frontend.fs.capacitor-fs.Capacitorfs{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__48474){
var self__ = this;
var G__48474__$1 = this;
return (new cljs.core.RecordIter((0),G__48474__$1,0,cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new frontend.fs.capacitor_fs.Capacitorfs(self__.__meta,self__.__extmap,self__.__hash));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (0 + cljs.core.count(self__.__extmap));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-70169615 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this48476,other48477){
var self__ = this;
var this48476__$1 = this;
return (((!((other48477 == null)))) && ((((this48476__$1.constructor === other48477.constructor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this48476__$1.__extmap,other48477.__extmap)))));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.EMPTY,k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new frontend.fs.capacitor_fs.Capacitorfs(self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k48475){
var self__ = this;
var this__5307__auto____$1 = this;
return cljs.core.contains_QMARK_(self__.__extmap,k48475);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__48474){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__48533 = cljs.core.keyword_identical_QMARK_;
var expr__48534 = k__5309__auto__;
return (new frontend.fs.capacitor_fs.Capacitorfs(self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__48474),null));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__48474){
var self__ = this;
var this__5299__auto____$1 = this;
return (new frontend.fs.capacitor_fs.Capacitorfs(G__48474,self__.__extmap,self__.__hash));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$mkdir_BANG_$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.fs.capacitor_fs._LT_dir_exists_QMARK_(dir),(function (exists_QMARK_){
if(cljs.core.truth_(exists_QMARK_)){
return promesa.core.resolved(true);
} else {
return module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.mkdir(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),dir], null)));
}
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mkdir!","mkdir!",1839224283),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),dir,new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),330], null)),null);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$unlink_BANG_$arity$4 = (function (this$,repo,fpath,_opts){
var self__ = this;
var this$__$1 = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_local_dir(repo)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name,".recycle"], 0))),(function (recycle_dir){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.replace(logseq.common.path.trim_dir_prefix(repo_dir,fpath),"/","_")),(function (file_name){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(recycle_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_name], 0))),(function (new_path){
return promesa.protocols._mcat(promesa.protocols._promise(this$__$1.frontend$fs$protocol$Fs$mkdir_recur_BANG_$arity$2(null,recycle_dir)),(function (_){
return promesa.protocols._promise(this$__$1.frontend$fs$protocol$Fs$rename_BANG_$arity$4(null,repo,fpath,new_path));
}));
}));
}));
}));
}));
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$get_files$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
return frontend.fs.capacitor_fs.get_files(dir);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$rename_BANG_$arity$4 = (function (_this,_repo,old_fpath,new_fpath){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.rename(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),old_fpath,new cljs.core.Keyword(null,"to","to",192099007),new_fpath], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"rename-file-failed","rename-file-failed",705067468),error,new cljs.core.Keyword(null,"line","line",212345235),378], null)),null);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$readdir$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
var dir__$1 = logseq.common.path.path_normalize(dir);
return frontend.fs.capacitor_fs.get_file_paths(dir__$1);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$stat$arity$2 = (function (_this,fpath){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.stat(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),fpath], null))),(function (p1__48470_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__48470_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),(function (error){
var errstr = (cljs.core.truth_(error)?error.toString():"");
if(clojure.string.includes_QMARK_(errstr,"because you don\u2019t have permission to view it")){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),"No permission, please clear cache and re-open graph folder.",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
}

return promesa.core.rejected(error);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$watch_dir_BANG_$arity$3 = (function (_this,dir,_options){
var self__ = this;
var _this__$1 = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.mobile.util.fs_watcher.unwatch()),(function (_){
return promesa.protocols._promise(frontend.mobile.util.fs_watcher.watch(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),dir], null))));
}));
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$unwatch_dir_BANG_$arity$2 = (function (_this,_dir){
var self__ = this;
var _this__$1 = this;
return frontend.mobile.util.fs_watcher.unwatch();
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$rmdir_BANG_$arity$2 = (function (_this,_dir){
var self__ = this;
var _this__$1 = this;
return null;
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$copy_BANG_$arity$4 = (function (_this,_repo,old_path,new_path){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.copy(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),old_path,new cljs.core.Keyword(null,"to","to",192099007),new_path], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"copy-file-failed","copy-file-failed",-2076893342),error,new cljs.core.Keyword(null,"line","line",212345235),385], null)),null);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$write_file_BANG_$arity$6 = (function (_this,repo,dir,path,content,opts){
var self__ = this;
var _this__$1 = this;
var fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41095__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.stat(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),fpath], null))),(function (_e){
return new cljs.core.Keyword(null,"not-found","not-found",-629079980);
}))),(function (stat){
return promesa.protocols._promise(frontend.fs.capacitor_fs.write_file_impl_BANG_(repo,dir,path,content,opts,stat));
}));
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$open_dir$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
return frontend.fs.capacitor_fs.open_dir(dir);
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$read_file$arity$4 = (function (_this,dir,path,_options){
var self__ = this;
var _this__$1 = this;
var fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.capacitor_fs._LT_read_file_with_utf8(fpath),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"read-file-failed","read-file-failed",1054578592),error,new cljs.core.Keyword(null,"line","line",212345235),364], null)),null);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.prototype.frontend$fs$protocol$Fs$mkdir_recur_BANG_$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.fs.capacitor_fs._LT_dir_exists_QMARK_(dir),(function (exists_QMARK_){
if(cljs.core.truth_(exists_QMARK_)){
return promesa.core.resolved(true);
} else {
return module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.mkdir(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),dir,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null)));
}
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.capacitor-fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mkdir-recur!","mkdir-recur!",-670303496),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),dir,new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),342], null)),null);
}));
}));

(frontend.fs.capacitor_fs.Capacitorfs.getBasis = (function (){
return cljs.core.PersistentVector.EMPTY;
}));

(frontend.fs.capacitor_fs.Capacitorfs.cljs$lang$type = true);

(frontend.fs.capacitor_fs.Capacitorfs.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"frontend.fs.capacitor-fs/Capacitorfs",null,(1),null));
}));

(frontend.fs.capacitor_fs.Capacitorfs.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"frontend.fs.capacitor-fs/Capacitorfs");
}));

/**
 * Positional factory function for frontend.fs.capacitor-fs/Capacitorfs.
 */
frontend.fs.capacitor_fs.__GT_Capacitorfs = (function frontend$fs$capacitor_fs$__GT_Capacitorfs(){
return (new frontend.fs.capacitor_fs.Capacitorfs(null,null,null));
});

/**
 * Factory function for frontend.fs.capacitor-fs/Capacitorfs, taking a map of keywords to field values.
 */
frontend.fs.capacitor_fs.map__GT_Capacitorfs = (function frontend$fs$capacitor_fs$map__GT_Capacitorfs(G__48484){
var extmap__5342__auto__ = (function (){var G__48578 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$1(G__48484);
if(cljs.core.record_QMARK_(G__48484)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__48578);
} else {
return G__48578;
}
})();
return (new frontend.fs.capacitor_fs.Capacitorfs(null,cljs.core.not_empty(extmap__5342__auto__),null));
});


//# sourceMappingURL=frontend.fs.capacitor_fs.js.map
