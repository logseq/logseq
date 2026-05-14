goog.provide('frontend.handler.file_based.file');
frontend.handler.file_based.file.load_file = (function frontend$handler$file_based$file$load_file(repo_url,path){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(frontend.config.get_repo_dir(repo_url),path)),(function (content){
return promesa.protocols._promise(content);
}));
})),(function (e){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Load file failed: ",path], 0));

return console.error(e);
}));
});
frontend.handler.file_based.file.reset_file_BANG_ = (function frontend$handler$file_based$file$reset_file_BANG_(repo,file_path,content,opts){
if(frontend.util.node_test_QMARK_){
return frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$5(repo,(frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(repo,false) : frontend.db.get_db.call(null,repo,false)),file_path,content,opts);
} else {
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","reset-file","thread-api/reset-file",1693971804),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,file_path,content,opts], 0));
}
});
frontend.handler.file_based.file.load_multiple_files = (function frontend$handler$file_based$file$load_multiple_files(repo_url,paths){
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__62786_SHARP_){
return frontend.handler.file_based.file.load_file(repo_url,p1__62786_SHARP_);
}),paths));
});
frontend.handler.file_based.file.keep_formats = (function frontend$handler$file_based$file$keep_formats(files,formats){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
var format = logseq.common.util.get_format(file);
return cljs.core.contains_QMARK_(formats,format);
}),files);
});
frontend.handler.file_based.file.only_text_formats = (function frontend$handler$file_based$file$only_text_formats(files){
return frontend.handler.file_based.file.keep_formats(files,logseq.common.config.text_formats());
});
frontend.handler.file_based.file.only_image_formats = (function frontend$handler$file_based$file$only_image_formats(files){
return frontend.handler.file_based.file.keep_formats(files,logseq.common.config.img_formats());
});
frontend.handler.file_based.file.load_files_contents_BANG_ = (function frontend$handler$file_based$file$load_files_contents_BANG_(repo_url,files,ok_handler){
var images = frontend.handler.file_based.file.only_image_formats(files);
var files__$1 = frontend.handler.file_based.file.only_text_formats(files);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all(frontend.handler.file_based.file.load_multiple_files(repo_url,files__$1)),(function (contents){
var file_contents = (function (){var G__62787 = cljs.core.zipmap(files__$1,contents);
if(cljs.core.seq(images)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__62787,cljs.core.zipmap(images,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(images),""))], 0));
} else {
return G__62787;
}
})();
var file_contents__$1 = (function (){var iter__5480__auto__ = (function frontend$handler$file_based$file$load_files_contents_BANG__$_iter__62788(s__62789){
return (new cljs.core.LazySeq(null,(function (){
var s__62789__$1 = s__62789;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__62789__$1);
if(temp__5804__auto__){
var s__62789__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__62789__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62789__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62791 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62790 = (0);
while(true){
if((i__62790 < size__5479__auto__)){
var vec__62793 = cljs.core._nth(c__5478__auto__,i__62790);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62793,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62793,(1),null);
cljs.core.chunk_append(b__62791,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),logseq.common.util.path_normalize(file),new cljs.core.Keyword("file","content","file/content",12680964),content], null));

var G__62840 = (i__62790 + (1));
i__62790 = G__62840;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62791),frontend$handler$file_based$file$load_files_contents_BANG__$_iter__62788(cljs.core.chunk_rest(s__62789__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62791),null);
}
} else {
var vec__62796 = cljs.core.first(s__62789__$2);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62796,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62796,(1),null);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),logseq.common.util.path_normalize(file),new cljs.core.Keyword("file","content","file/content",12680964),content], null),frontend$handler$file_based$file$load_files_contents_BANG__$_iter__62788(cljs.core.rest(s__62789__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(file_contents);
})();
return (ok_handler.cljs$core$IFn$_invoke$arity$1 ? ok_handler.cljs$core$IFn$_invoke$arity$1(file_contents__$1) : ok_handler.call(null,file_contents__$1));
})),(function (error){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("fs","load-files-error","fs/load-files-error",1672389466),repo_url,new cljs.core.Keyword(null,"line","line",212345235),79], null)),null);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),80], null)),error);
}));
});
/**
 * Backup db content to bak directory
 */
frontend.handler.file_based.file.backup_file_BANG_ = (function frontend$handler$file_based$file$backup_file_BANG_(repo_url,path,db_content,content){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["backupDbFile",repo_url,path,db_content,content], 0));
} else {
return null;
}
});
frontend.handler.file_based.file.detect_deprecations = (function frontend$handler$file_based$file$detect_deprecations(path,content){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/config.edn")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.path.dirname(path),frontend.handler.global_config.safe_global_config_dir())))){
return frontend.handler.common.config_edn.detect_deprecations(path,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),false], null));
} else {
return null;
}
});
/**
 * Returns true if valid and if false validator displays error message. Files
 *   that are not validated just return true
 */
frontend.handler.file_based.file.validate_file = (function frontend$handler$file_based$file$validate_file(path,content){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"logseq/config.edn")){
return frontend.handler.common.config_edn.validate_config_edn(path,content,frontend.schema.handler.repo_config.Config_edn);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.path.dirname(path),frontend.handler.global_config.safe_global_config_dir())){
return frontend.handler.common.config_edn.validate_config_edn(path,content,frontend.schema.handler.global_config.Config_edn);
} else {
return true;

}
}
});
frontend.handler.file_based.file.write_file_aux_BANG_ = (function frontend$handler$file_based$file$write_file_aux_BANG_(repo,path,content,write_file_options){
var original_content = (frontend.db.get_file.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$2(repo,path) : frontend.db.get_file.call(null,repo,path));
var path_dir = frontend.config.get_repo_dir(repo);
var write_file_options_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([write_file_options,(cljs.core.truth_(original_content)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"old-content","old-content",1851086779),original_content], null):null)], 0));
return frontend.fs.write_plain_text_file_BANG_(repo,path_dir,path,content,write_file_options_SINGLEQUOTE_);
});
/**
 * Does pre-checks on a global file, writes if it's not already written
 *   (:from-disk? is not set) and then does post-checks. Currently only handles
 *   global config.edn but can be extended as needed
 */
frontend.handler.file_based.file.alter_global_file = (function frontend$handler$file_based$file$alter_global_file(path,content,p__62806){
var map__62807 = p__62806;
var map__62807__$1 = cljs.core.__destructure_map(map__62807);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62807__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
if(cljs.core.truth_((function (){var and__5000__auto__ = path;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,frontend.handler.global_config.safe_global_config_path());
} else {
return and__5000__auto__;
}
})())){
frontend.handler.file_based.file.detect_deprecations(path,content);

if(frontend.handler.file_based.file.validate_file(path,content)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(from_disk_QMARK_)?null:frontend.fs.write_plain_text_file_BANG_("",null,path,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null)))),(function (_){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.global_config.restore_global_config_BANG_()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577)], null)));
}));
})));
}));
})),(function (error){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),["Failed to write to file ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),", error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("write","failed","write/failed",-1544073021),error,new cljs.core.Keyword(null,"line","line",212345235),133], null)),null);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("write-file","failed-for-alter-file","write-file/failed-for-alter-file",-2085354444)], null)], null)], null));
}));
} else {
return null;
}
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"alter-global-file does not support this file",new cljs.core.Keyword(null,"file","file",-1269645878),path,new cljs.core.Keyword(null,"line","line",212345235),137], null)),null);
}
});
/**
 * Write any in-DB file, e.g. repo config, page, whiteboard, etc.
 */
frontend.handler.file_based.file.alter_file = (function frontend$handler$file_based$file$alter_file(repo,path,content,p__62812){
var map__62813 = p__62812;
var map__62813__$1 = cljs.core.__destructure_map(map__62813);
var mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62813__$1,new cljs.core.Keyword(null,"mtime","mtime",963165087));
var skip_compare_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62813__$1,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),false);
var reset_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62813__$1,new cljs.core.Keyword(null,"reset?","reset?",-1051875415),true);
var re_render_root_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62813__$1,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false);
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62813__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62813__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),false);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62813__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var event = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62813__$1,new cljs.core.Keyword("fs","event","fs/event",301434435));
var ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62813__$1,new cljs.core.Keyword(null,"ctime","ctime",1459030131));
var path__$1 = logseq.common.util.path_normalize(path);
var config_file_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path__$1,"logseq/config.edn");
var _ = ((config_file_QMARK_)?frontend.handler.file_based.file.detect_deprecations(path__$1,content):null);
var config_valid_QMARK_ = ((config_file_QMARK_) && (frontend.handler.file_based.file.validate_file(path__$1,content)));
if(((config_valid_QMARK_) || ((!(config_file_QMARK_))))){
var opts = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),from_disk_QMARK_,new cljs.core.Keyword("fs","event","fs/event",301434435),event,new cljs.core.Keyword(null,"ctime","ctime",1459030131),ctime,new cljs.core.Keyword(null,"mtime","mtime",963165087),mtime], null);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(reset_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.db.file_based.model.get_file_page_id(path__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),page_id,new cljs.core.Keyword("block","alias","block/alias",-2112644699)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),page_id,new cljs.core.Keyword("block","tags","block/tags",1814948340)], null)], null),opts);
} else {
return null;
}
})()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.file_based.file.reset_file_BANG_(repo,path__$1,content,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0))));
}));
})):frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$4(repo,path__$1,content,opts))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(from_disk_QMARK_)?null:frontend.handler.file_based.file.write_file_aux_BANG_(repo,path__$1,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),skip_compare_QMARK_], null)))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(re_render_root_QMARK_)?frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0():null)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path__$1,"logseq/custom.css"))?(function (){
frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3(repo,path__$1,content);

return frontend.handler.ui.add_style_if_exists_BANG_();
})()
:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path__$1,"logseq/config.edn"))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo_config.restore_repo_config_BANG_.cljs$core$IFn$_invoke$arity$2(repo,content)),(function (___$2){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577)], null)));
}));
})):null))),(function (___40947__auto____$1){
return promesa.protocols._promise(result);
}));
}));
}));
}));
})),(function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Write file failed, path: ",path__$1,", content: ",content], 0));

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("write","failed","write/failed",-1544073021),error,new cljs.core.Keyword(null,"line","line",212345235),190], null)),null);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("write-file","failed-for-alter-file","write-file/failed-for-alter-file",-2085354444)], null)], null)], null));
}));
} else {
return null;
}
});
/**
 * Test version of alter-file that is synchronous
 */
frontend.handler.file_based.file.alter_file_test_version = (function frontend$handler$file_based$file$alter_file_test_version(repo,path,content,p__62826){
var map__62827 = p__62826;
var map__62827__$1 = cljs.core.__destructure_map(map__62827);
var reset_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62827__$1,new cljs.core.Keyword(null,"reset?","reset?",-1051875415),true);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62827__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),false);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62827__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62827__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
var ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62827__$1,new cljs.core.Keyword(null,"ctime","ctime",1459030131));
var mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62827__$1,new cljs.core.Keyword(null,"mtime","mtime",963165087));
var event = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62827__$1,new cljs.core.Keyword("fs","event","fs/event",301434435));
var path__$1 = logseq.common.util.path_normalize(path);
var config_file_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path__$1,"logseq/config.edn");
var _ = ((config_file_QMARK_)?frontend.handler.file_based.file.detect_deprecations(path__$1,content):null);
var config_valid_QMARK_ = ((config_file_QMARK_) && (frontend.handler.file_based.file.validate_file(path__$1,content)));
if(((config_valid_QMARK_) || ((!(config_file_QMARK_))))){
var opts = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),from_disk_QMARK_,new cljs.core.Keyword("fs","event","fs/event",301434435),event,new cljs.core.Keyword(null,"ctime","ctime",1459030131),ctime,new cljs.core.Keyword(null,"mtime","mtime",963165087),mtime], null);
var result = (cljs.core.truth_(reset_QMARK_)?(function (){
var temp__5804__auto___62847 = frontend.db.file_based.model.get_file_page_id(path__$1);
if(cljs.core.truth_(temp__5804__auto___62847)){
var page_id_62848 = temp__5804__auto___62847;
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),page_id_62848,new cljs.core.Keyword("block","alias","block/alias",-2112644699)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),page_id_62848,new cljs.core.Keyword("block","tags","block/tags",1814948340)], null)], null),opts);
} else {
}

return frontend.handler.file_based.file.reset_file_BANG_(repo,path__$1,content,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0)));
})()
:frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$4(repo,path__$1,content,opts));
return result;
} else {
return null;
}
});
frontend.handler.file_based.file.set_file_content_BANG_ = (function frontend$handler$file_based$file$set_file_content_BANG_(repo,path,new_content){
return frontend.handler.file_based.file.alter_file(repo,path,new_content,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reset?","reset?",-1051875415),false,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false], null));
});
frontend.handler.file_based.file.alter_files_handler_BANG_ = (function frontend$handler$file_based$file$alter_files_handler_BANG_(repo,files,p__62828,file__GT_content){
var map__62829 = p__62828;
var map__62829__$1 = cljs.core.__destructure_map(map__62829);
var finish_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62829__$1,new cljs.core.Keyword(null,"finish-handler","finish-handler",770511735));
var write_file_f = (function (p__62830){
var vec__62831 = p__62830;
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62831,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62831,(1),null);
if(cljs.core.truth_(path)){
var path__$1 = logseq.common.util.path_normalize(path);
var original_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(file__GT_content,path__$1);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.write_plain_text_file_BANG_(repo,frontend.config.get_repo_dir(repo),path__$1,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"old-content","old-content",1851086779),original_content], null)),(function (error){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),["Failed to save the file ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path__$1),". Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("write-file","failed","write-file/failed",325307384)], null)], null)], null));

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("write-file","failed","write-file/failed",325307384),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"path","path",-188191168),path__$1,new cljs.core.Keyword(null,"content","content",15833224),content,new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),249], null)),null);
}));
} else {
return null;
}
});
var finish_handler__$1 = (function (){
if(cljs.core.truth_(finish_handler)){
return (finish_handler.cljs$core$IFn$_invoke$arity$0 ? finish_handler.cljs$core$IFn$_invoke$arity$0() : finish_handler.call(null));
} else {
return null;
}
});
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2(write_file_f,files)),(function (){
return finish_handler__$1();
})),(function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Alter files failed:"], 0));

return console.error(error);
}));
});
frontend.handler.file_based.file.alter_files = (function frontend$handler$file_based$file$alter_files(repo,files,p__62834){
var map__62835 = p__62834;
var map__62835__$1 = cljs.core.__destructure_map(map__62835);
var opts = map__62835__$1;
var reset_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62835__$1,new cljs.core.Keyword(null,"reset?","reset?",-1051875415),false);
var update_db_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62835__$1,new cljs.core.Keyword(null,"update-db?","update-db?",-1641846808),true);
var file__GT_content = (function (){var paths = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,files);
return cljs.core.zipmap(paths,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (path){
return (frontend.db.get_file.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$2(repo,path) : frontend.db.get_file.call(null,repo,path));
}),paths));
})();
if(cljs.core.truth_(update_db_QMARK_)){
promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__62836){
var vec__62837 = p__62836;
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62837,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62837,(1),null);
if(cljs.core.truth_(reset_QMARK_)){
return frontend.handler.file_based.file.reset_file_BANG_(repo,path,content,cljs.core.PersistentArrayMap.EMPTY);
} else {
return frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3(repo,path,content);
}
}),files));
} else {
}

return frontend.handler.file_based.file.alter_files_handler_BANG_(repo,files,opts,file__GT_content);
});
frontend.handler.file_based.file.watch_for_current_graph_dir_BANG_ = (function frontend$handler$file_based$file$watch_for_current_graph_dir_BANG_(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.config.get_repo_dir(repo);
if(cljs.core.truth_(temp__5804__auto____$1)){
var dir = temp__5804__auto____$1;
frontend.fs.unwatch_dir_BANG_(dir);

return frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1(dir);
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.file_based.file.js.map
