goog.provide('frontend.fs');
if((typeof frontend !== 'undefined') && (typeof frontend.fs !== 'undefined') && (typeof frontend.fs.memory_backend !== 'undefined')){
} else {
frontend.fs.memory_backend = frontend.fs.memory_fs.__GT_MemoryFs();
}
if((typeof frontend !== 'undefined') && (typeof frontend.fs !== 'undefined') && (typeof frontend.fs.node_backend !== 'undefined')){
} else {
frontend.fs.node_backend = frontend.fs.node.__GT_Node();
}
/**
 * Native FS backend of current platform
 */
frontend.fs.get_native_backend = (function frontend$fs$get_native_backend(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.fs.node_backend;
} else {
return null;
}
});
frontend.fs.get_fs = (function frontend$fs$get_fs(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61992 = arguments.length;
var i__5727__auto___61993 = (0);
while(true){
if((i__5727__auto___61993 < len__5726__auto___61992)){
args__5732__auto__.push((arguments[i__5727__auto___61993]));

var G__61994 = (i__5727__auto___61993 + (1));
i__5727__auto___61993 = G__61994;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.fs.get_fs.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.fs.get_fs.cljs$core$IFn$_invoke$arity$variadic = (function (dir,p__61927){
var map__61928 = p__61927;
var map__61928__$1 = cljs.core.__destructure_map(map__61928);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61928__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var rpath = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61928__$1,new cljs.core.Keyword(null,"rpath","rpath",1489437835));
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
var bfs_local_QMARK_ = (function (){var and__5000__auto__ = dir;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.starts_with_QMARK_(dir,["/",frontend.config.demo_repo].join(''))) || (clojure.string.starts_with_QMARK_(dir,frontend.config.demo_repo)));
} else {
return and__5000__auto__;
}
})();
var db_assets_QMARK_ = (function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo__$1);
if(and__5000__auto__){
var and__5000__auto____$1 = rpath;
if(cljs.core.truth_(and__5000__auto____$1)){
return clojure.string.starts_with_QMARK_(rpath,"assets/");
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = db_assets_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.electron_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return frontend.fs.node_backend;
} else {
if(cljs.core.truth_(db_assets_QMARK_)){
return frontend.fs.memory_backend;
} else {
if((dir == null)){
return frontend.fs.get_native_backend();
} else {
if(clojure.string.starts_with_QMARK_(dir,"memory://")){
return frontend.fs.memory_backend;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(bfs_local_QMARK_);
} else {
return and__5000__auto__;
}
})())){
return frontend.fs.node_backend;
} else {
return null;

}
}
}
}
}
}));

(frontend.fs.get_fs.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.fs.get_fs.cljs$lang$applyTo = (function (seq61925){
var G__61926 = cljs.core.first(seq61925);
var seq61925__$1 = cljs.core.next(seq61925);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61926,seq61925__$1);
}));

frontend.fs.mkdir_BANG_ = (function frontend$fs$mkdir_BANG_(dir){
return frontend.fs.protocol.mkdir_BANG_(frontend.fs.get_fs(dir),dir);
});
frontend.fs.mkdir_recur_BANG_ = (function frontend$fs$mkdir_recur_BANG_(dir){
return frontend.fs.protocol.mkdir_recur_BANG_(frontend.fs.get_fs(dir),dir);
});
/**
 * list all absolute paths in dir, absolute
 */
frontend.fs.readdir = (function frontend$fs$readdir(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61995 = arguments.length;
var i__5727__auto___61996 = (0);
while(true){
if((i__5727__auto___61996 < len__5726__auto___61995)){
args__5732__auto__.push((arguments[i__5727__auto___61996]));

var G__61997 = (i__5727__auto___61996 + (1));
i__5727__auto___61996 = G__61997;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic = (function (dir,p__61938){
var map__61939 = p__61938;
var map__61939__$1 = cljs.core.__destructure_map(map__61939);
var path_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61939__$1,new cljs.core.Keyword(null,"path-only?","path-only?",-825545027));
if(cljs.core.truth_(path_only_QMARK_)){
} else {
console.error("BUG: (deprecation) path-only? is always true");
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.protocol.readdir(frontend.fs.get_fs(dir),dir)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_bean.core.__GT_clj(result)),(function (result__$1){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.path_normalize,result__$1));
}));
}));
}));
}));

(frontend.fs.readdir.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.fs.readdir.cljs$lang$applyTo = (function (seq61935){
var G__61937 = cljs.core.first(seq61935);
var seq61935__$1 = cljs.core.next(seq61935);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61937,seq61935__$1);
}));

/**
 * Should move the path to logseq/recycle instead of deleting it.
 */
frontend.fs.unlink_BANG_ = (function frontend$fs$unlink_BANG_(repo,fpath,opts){
return frontend.fs.protocol.unlink_BANG_(frontend.fs.get_fs(fpath),repo,fpath,opts);
});
/**
 * Remove the directory recursively.
 * Warning: only run it for browser cache.
 */
frontend.fs.rmdir_BANG_ = (function frontend$fs$rmdir_BANG_(dir){
var temp__5804__auto__ = frontend.fs.get_fs(dir);
if(cljs.core.truth_(temp__5804__auto__)){
var fs = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(fs,frontend.fs.memory_backend)){
return frontend.fs.protocol.rmdir_BANG_(fs,dir);
} else {
return null;
}
} else {
return null;
}
});
/**
 * Use it only for plain-text files, not binary
 */
frontend.fs.write_plain_text_file_BANG_ = (function frontend$fs$write_plain_text_file_BANG_(repo,dir,rpath,content,opts){
if(cljs.core.truth_(content)){
var path = logseq.common.util.path_normalize(rpath);
var fs_record = frontend.fs.get_fs.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"rpath","rpath",1489437835),rpath], null)], 0));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (error){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("write-file","failed","write-file/failed",325307384),new cljs.core.Keyword(null,"fs","fs",-2122926244),cljs.core.type(fs_record),new cljs.core.Keyword(null,"user-agent","user-agent",1220426212),(cljs.core.truth_(navigator)?navigator.userAgent:null),new cljs.core.Keyword(null,"content-length","content-length",441319507),cljs.core.count(content)], null)], null)], null));
}))),(function (opts__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.protocol.write_file_BANG_(fs_record,repo,dir,path,content,opts__$1)),(function (_){
return promesa.impl.resolved(null);
}));
}));
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.fs",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","write-failed","file/write-failed",-229053199),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"dir","dir",1734754661),dir,new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),105], null)),null);
}));
} else {
return null;
}
});
frontend.fs.read_file = (function frontend$fs$read_file(var_args){
var G__61946 = arguments.length;
switch (G__61946) {
case 2:
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2 = (function (dir,path){
var fs = frontend.fs.get_fs(dir);
var options = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(fs,frontend.fs.memory_backend))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"encoding","encoding",1728578272),"utf8"], null):cljs.core.PersistentArrayMap.EMPTY);
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(dir,path,options);
}));

(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3 = (function (dir,path,options){
return frontend.fs.protocol.read_file(frontend.fs.get_fs(dir),dir,path,options);
}));

(frontend.fs.read_file.cljs$lang$maxFixedArity = 3);

/**
 * Rename files, incoming relative path, converted to absolute path
 */
frontend.fs.rename_BANG_ = (function frontend$fs$rename_BANG_(repo,old_path,new_path){
var new_path__$1 = logseq.common.util.path_normalize(new_path);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_path,new_path__$1)){
return promesa.core.resolved(null);
} else {
var repo_dir = frontend.config.get_repo_dir(repo);
var old_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_path], 0));
var new_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_path__$1], 0));
return frontend.fs.protocol.rename_BANG_(frontend.fs.get_fs(old_fpath),repo,old_fpath,new_fpath);

}
});
frontend.fs.stat = (function frontend$fs$stat(var_args){
var G__61955 = arguments.length;
switch (G__61955) {
case 1:
return frontend.fs.stat.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.fs.stat.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.fs.stat.cljs$core$IFn$_invoke$arity$1 = (function (fpath){
return frontend.fs.protocol.stat(frontend.fs.get_fs(fpath),fpath);
}));

(frontend.fs.stat.cljs$core$IFn$_invoke$arity$2 = (function (dir,path){
var fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));
return frontend.fs.protocol.stat(frontend.fs.get_fs(dir),fpath);
}));

(frontend.fs.stat.cljs$lang$maxFixedArity = 2);

frontend.fs.mkdir_if_not_exists = (function frontend$fs$mkdir_if_not_exists(dir){
if(cljs.core.truth_(dir)){
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(frontend.fs.stat.cljs$core$IFn$_invoke$arity$1(dir),(function (_stat){
return null;
}),(function (_error){
return frontend.fs.mkdir_recur_BANG_(dir);
}));
} else {
return null;
}
});
/**
 * Only used by Logseq Sync
 */
frontend.fs.copy_BANG_ = (function frontend$fs$copy_BANG_(repo,old_path,new_path){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_path,new_path)){
return promesa.core.resolved(null);
} else {
var vec__61960 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__61956_SHARP_){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return p1__61956_SHARP_;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_repo_dir(repo)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__61956_SHARP_)].join('');
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [old_path,new_path], null));
var old_path__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61960,(0),null);
var new_path__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61960,(1),null);
var new_dir = logseq.common.path.dirname(new_path__$1);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(new_dir)),(function (_){
return promesa.protocols._promise(frontend.fs.protocol.copy_BANG_(frontend.fs.get_fs(old_path__$1),repo,old_path__$1,new_path__$1));
}));
}));

}
});
frontend.fs.open_dir = (function frontend$fs$open_dir(dir){
var record = frontend.fs.get_native_backend();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.protocol.open_dir(record,dir)),(function (result){
return promesa.protocols._promise((cljs.core.truth_(result)?(function (){var map__61966 = result;
var map__61966__$1 = cljs.core.__destructure_map(map__61966);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61966__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61966__$1,new cljs.core.Keyword(null,"files","files",-472457450));
var dir__$1 = path;
var files__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (entry){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entry,new cljs.core.Keyword(null,"path","path",-188191168),logseq.common.path.relative_path(dir__$1,new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)));
}),files);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"files","files",-472457450),files__$1], null);
})():null));
}));
}));
});
/**
 * List all files in the directory, recursively.
 * 
 * Wrap as {:path string :files []}, using relative path
 */
frontend.fs.get_files = (function frontend$fs$get_files(dir){
var fs_record = frontend.fs.get_native_backend();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.protocol.get_files(fs_record,dir)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.fs","get-files","frontend.fs/get-files",52623820),cljs.core.count(files),"files"], 0))),(function (___40947__auto__){
return promesa.protocols._promise((function (){var files__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (entry){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entry,new cljs.core.Keyword(null,"path","path",-188191168),logseq.common.path.relative_path(dir,new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)));
}),files);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),dir,new cljs.core.Keyword(null,"files","files",-472457450),files__$1], null);
})());
}));
}));
}));
});
frontend.fs.watch_dir_BANG_ = (function frontend$fs$watch_dir_BANG_(var_args){
var G__61977 = arguments.length;
switch (G__61977) {
case 1:
return frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (dir){
return frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$2(dir,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (dir,options){
return frontend.fs.protocol.watch_dir_BANG_(frontend.fs.get_fs(dir),dir,options);
}));

(frontend.fs.watch_dir_BANG_.cljs$lang$maxFixedArity = 2);

frontend.fs.unwatch_dir_BANG_ = (function frontend$fs$unwatch_dir_BANG_(dir){
return frontend.fs.protocol.unwatch_dir_BANG_(frontend.fs.get_fs(dir),dir);
});
/**
 * Create a file if it doesn't exist. return false on written, true on already exists
 */
frontend.fs.create_if_not_exists = (function frontend$fs$create_if_not_exists(var_args){
var G__61980 = arguments.length;
switch (G__61980) {
case 3:
return frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$3 = (function (repo,dir,path){
return frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo,dir,path,"");
}));

(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4 = (function (repo,dir,path,initial_content){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.stat.cljs$core$IFn$_invoke$arity$2(dir,path)),(function (_stat){
return promesa.protocols._promise(true);
}));
})),(function (_error){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,dir,path,initial_content,null)),(function (_){
return promesa.protocols._promise(false);
}));
}));
}));
}));

(frontend.fs.create_if_not_exists.cljs$lang$maxFixedArity = 4);

frontend.fs.file_exists_QMARK_ = (function frontend$fs$file_exists_QMARK_(var_args){
var G__61985 = arguments.length;
switch (G__61985) {
case 1:
return frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (fpath){
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(frontend.fs.stat.cljs$core$IFn$_invoke$arity$1(fpath),(function (stat_SINGLEQUOTE_){
return (!((stat_SINGLEQUOTE_ == null)));
}),(function (_e){
return false;
}));
}));

(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (dir,path){
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(frontend.fs.stat.cljs$core$IFn$_invoke$arity$2(dir,path),(function (stat_SINGLEQUOTE_){
return (!((stat_SINGLEQUOTE_ == null)));
}),(function (_e){
return false;
}));
}));

(frontend.fs.file_exists_QMARK_.cljs$lang$maxFixedArity = 2);

/**
 * href is from `make-asset-url`, so it's most likely a full-path
 */
frontend.fs.asset_href_exists_QMARK_ = (function frontend$fs$asset_href_exists_QMARK_(href){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(frontend.state.get_current_repo())),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.relative_path(repo_dir,href)),(function (rpath){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,rpath)),(function (exist_QMARK_){
return promesa.protocols._promise(exist_QMARK_);
}));
}));
}));
}));
});
frontend.fs.asset_path_normalize = (function frontend$fs$asset_path_normalize(path){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return logseq.common.path.url_to_path(path);
} else {
return path;

}
});
frontend.fs.dir_exists_QMARK_ = (function frontend$fs$dir_exists_QMARK_(dir){
return frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(dir,"");
});
frontend.fs.backup_db_file_BANG_ = (function frontend$fs$backup_db_file_BANG_(repo,path,db_content,disk_content){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["backupDbFile",frontend.config.get_local_dir(repo),path,db_content,disk_content], 0));
} else {
return null;
}
});

//# sourceMappingURL=frontend.fs.js.map
