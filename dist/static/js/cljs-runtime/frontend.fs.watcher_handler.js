goog.provide('frontend.fs.watcher_handler');
/**
 * For every referred block in the content, fix their block ids in files if missing.
 */
frontend.fs.watcher_handler.set_missing_block_ids_BANG_ = (function frontend$fs$watcher_handler$set_missing_block_ids_BANG_(content){
if(typeof content === 'string'){
var missing_blocks = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(frontend.db.model.get_block_by_uuid,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(logseq.common.util.block_ref.get_all_block_ref_ids(content))));
if(cljs.core.seq(missing_blocks)){
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))], null);
}),missing_blocks));
} else {
return null;
}
} else {
return null;
}
});
frontend.fs.watcher_handler.handle_add_and_change_BANG_ = (function frontend$fs$watcher_handler$handle_add_and_change_BANG_(repo,path,content,db_content,ctime,mtime,backup_QMARK_){
var config = frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo);
var path_hidden_patterns = new cljs.core.Keyword(null,"hidden","hidden",-312506092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(path_hidden_patterns);
if(and__5000__auto__){
return logseq.common.config.hidden_QMARK_(path,path_hidden_patterns);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(content,db_content);
}
})())){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(backup_QMARK_)?promesa.core.catch$.cljs$core$IFn$_invoke$arity$2((function (){var temp__5804__auto__ = frontend.config.get_local_dir(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var repo_dir = temp__5804__auto__;
return frontend.handler.file_based.file.backup_file_BANG_(repo_dir,path,db_content,content);
} else {
return null;
}
})(),(function (p1__107305_SHARP_){
return console.error("\u274C Bak Error: ",path,p1__107305_SHARP_);
})):null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_file(repo,path,content,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true,new cljs.core.Keyword("fs","event","fs/event",301434435),new cljs.core.Keyword("fs","local-file-change","fs/local-file-change",-2084936824),new cljs.core.Keyword(null,"ctime","ctime",1459030131),ctime,new cljs.core.Keyword(null,"mtime","mtime",963165087),mtime], null))),(function (___$1){
return promesa.protocols._promise(frontend.fs.watcher_handler.set_missing_block_ids_BANG_(content));
}));
}));
}));
}
});
frontend.fs.watcher_handler.handle_changed_BANG_ = (function frontend$fs$watcher_handler$handle_changed_BANG_(type,p__107316){
var map__107317 = p__107316;
var map__107317__$1 = cljs.core.__destructure_map(map__107317);
var payload = map__107317__$1;
var dir = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107317__$1,new cljs.core.Keyword(null,"dir","dir",1734754661));
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107317__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107317__$1,new cljs.core.Keyword(null,"content","content",15833224));
var stat = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107317__$1,new cljs.core.Keyword(null,"stat","stat",-1370599836));
var global_dir = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107317__$1,new cljs.core.Keyword(null,"global-dir","global-dir",-1891401566));
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_(dir)){
var repo__$1 = (cljs.core.truth_(global_dir)?repo:frontend.config.get_local_repo(dir)
);
var repo_dir = frontend.config.get_local_dir(repo__$1);
var map__107318 = stat;
var map__107318__$1 = cljs.core.__destructure_map(map__107318);
var mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107318__$1,new cljs.core.Keyword(null,"mtime","mtime",963165087));
var ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107318__$1,new cljs.core.Keyword(null,"ctime","ctime",1459030131));
var ext = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(logseq.common.path.file_ext(path));
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"markdown","markdown",1227225089),null,new cljs.core.Keyword(null,"js","js",1768080579),null,new cljs.core.Keyword(null,"tldr","tldr",1945790343),null,new cljs.core.Keyword(null,"excalidraw","excalidraw",-397772502),null,new cljs.core.Keyword(null,"css","css",1135045163),null,new cljs.core.Keyword(null,"org","org",1495985),null,new cljs.core.Keyword(null,"edn","edn",1317840885),null,new cljs.core.Keyword(null,"md","md",707286655),null], null), null),ext)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_file(repo__$1,path)),(function (db_content){
return promesa.protocols._mcat(promesa.protocols._promise((!((db_content == null)))),(function (exists_in_db_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = db_content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()),(function (db_content__$1){
return promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["unlinkDir",null,"unlink",null,"addDir",null], null), null),type);
}
})())?(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("unlinkDir",type);
if(and__5000__auto__){
return dir;
} else {
return and__5000__auto__;
}
})())?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","dir-gone","graph/dir-gone",-796087345),dir], null)):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("addDir",type);
if(and__5000__auto__){
return dir;
} else {
return and__5000__auto__;
}
})())?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","dir-back","graph/dir-back",-1720939782),repo__$1,dir], null)):((cljs.core.contains_QMARK_(new cljs.core.Keyword("file","unlinked-dirs","file/unlinked-dirs",-1488422337).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),dir))?null:((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("add",type)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(content),clojure.string.trim(db_content__$1)))))?(function (){var backup_QMARK_ = (!(clojure.string.blank_QMARK_(db_content__$1)));
return frontend.fs.watcher_handler.handle_add_and_change_BANG_(repo__$1,path,content,db_content__$1,ctime,mtime,backup_QMARK_);
})():((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("change",type)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,repo_dir)) && (cljs.core.not(logseq.common.config.local_asset_QMARK_(path)))))))?frontend.fs.watcher_handler.handle_add_and_change_BANG_(repo__$1,path,content,db_content__$1,ctime,mtime,cljs.core.not(global_dir)):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("unlink",type);
if(and__5000__auto__){
return exists_in_db_QMARK_;
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(dir,"")),(function (dir_exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(dir_exists_QMARK_)?(function (){var temp__5804__auto__ = frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1(path);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Delete page: ",page_name,", file path: ",path,"."], 0));

var G__107319 = page_name;
var G__107320 = (function (){
return cljs.core.List.EMPTY;
});
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2(G__107319,G__107320) : frontend.handler.page._LT_delete_BANG_.call(null,G__107319,G__107320));
} else {
return null;
}
})():null));
}));
})):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("change",type)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,frontend.handler.global_config.global_config_dir()))))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"config.edn"))?frontend.handler.file_based.file.alter_global_file(frontend.handler.global_config.global_config_path(),content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null)):null):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("change",type)) && (cljs.core.not(exists_in_db_QMARK_))))?console.error("Can't get file in the db: ",path):((((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["unlink",null,"add",null,"change",null], null), null),type)) && (clojure.string.ends_with_QMARK_(path,"logseq/custom.css"))))?(function (){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["reloading custom.css"], 0));

return frontend.handler.ui.add_style_if_exists_BANG_();
})()
:((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["unlink",null,"add",null,"change",null], null), null),type))?null:lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs.watcher-handler",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("fs","watcher-no-handler","fs/watcher-no-handler",1727093639),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null),new cljs.core.Keyword(null,"line","line",212345235),130], null)),null)
)))))))))):null));
}));
}));
}));
}));
} else {
}

return null;
} else {
return null;
}
});
/**
 * This fn replaces the former initial fs watcher
 */
frontend.fs.watcher_handler.load_graph_files_BANG_ = (function frontend$fs$watcher_handler$load_graph_files_BANG_(graph){
if(cljs.core.truth_(graph)){
var repo_dir = frontend.config.get_repo_dir(graph);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_files(graph)),(function (db_files_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,db_files_SINGLEQUOTE_)),(function (db_files){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.chain.cljs$core$IFn$_invoke$arity$variadic(frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], 0)),(function (files){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (f){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(!(clojure.string.starts_with_QMARK_(f,"logseq/"))),(!(clojure.string.starts_with_QMARK_(f,"journals/"))),(!(clojure.string.starts_with_QMARK_(f,"pages/"))),clojure.string.lower_case(f)], null);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__107322_SHARP_){
return frontend.util.fs.ignored_path_QMARK_(repo_dir,p1__107322_SHARP_);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107321_SHARP_){
return logseq.common.path.relative_path(repo_dir,p1__107321_SHARP_);
}),files)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (files){
var deleted_files = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(db_files),cljs.core.set(files));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [files,deleted_files], null);
})], 0)),(function (error){
if(frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph)){
} else {
console.error("reading",graph);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),["The graph ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph)," can not be read:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,null], null);
}))),(function (p__107327){
var vec__107328 = p__107327;
var files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107328,(0),null);
var deleted_files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107328,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise((((((cljs.core.abs((cljs.core.count(db_files) - cljs.core.count(files))) > (100))) || ((cljs.core.count(deleted_files) > (100)))))?(function (){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.fs.watcher-handler","init-watcher-large-change-set","frontend.fs.watcher-handler/init-watcher-large-change-set",-1379095453)], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Loading changes from disk...",new cljs.core.Keyword(null,"info","info",-317069002),false);
})()
:null)),(function (notification_uid){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.fs.watcher-handler","initial-watcher","frontend.fs.watcher-handler/initial-watcher",164808834),repo_dir,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"deleted","deleted",-510100639),cljs.core.count(deleted_files),new cljs.core.Keyword(null,"total","total",1916810418),cljs.core.count(files)], null)], 0))),(function (___41611__auto__){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(deleted_files))?promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (path){
var temp__5804__auto__ = frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1(path);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Delete page: ",page_name,", file path: ",path,"."], 0));

var G__107333 = page_name;
var G__107334 = (function (){
return cljs.core.List.EMPTY;
});
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2(G__107333,G__107334) : frontend.handler.page._LT_delete_BANG_.call(null,G__107333,G__107334));
} else {
return null;
}
}),deleted_files)):null)),(function (___41611__auto____$1){
return promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((500)),(function (){
return promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (file_rpath){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.stat.cljs$core$IFn$_invoke$arity$2(repo_dir,file_rpath)),(function (stat){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,file_rpath)),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((frontend.db.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(graph,file_rpath) : frontend.db.file_exists_QMARK_.call(null,graph,file_rpath)))?"change":"add")),(function (type){
return promesa.protocols._promise(frontend.fs.watcher_handler.handle_changed_BANG_(type,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"dir","dir",1734754661),repo_dir,new cljs.core.Keyword(null,"path","path",-188191168),file_rpath,new cljs.core.Keyword(null,"content","content",15833224),content,new cljs.core.Keyword(null,"stat","stat",-1370599836),stat], null)));
}));
}));
}));
}));
}),files));
})),(function (){
if(cljs.core.truth_(notification_uid)){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.fs.watcher-handler","init-notify","frontend.fs.watcher-handler/init-notify",-1180623646)], 0));

frontend.handler.notification.clear_BANG_(notification_uid);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),["The graph ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph)," is loaded."].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"clear?","clear?",1363344639),true], null)], null));
} else {
return null;
}
})),(function (error){
return console.dir(error);
})));
}));
})));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.fs.watcher_handler.js.map
