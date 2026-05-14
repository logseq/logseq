goog.provide('frontend.worker.file.reset');
/**
 * Conflict of files towards same page
 */
frontend.worker.file.reset.page_exists_in_another_file = (function frontend$worker$file$reset$page_exists_in_another_file(db,page,file){
var temp__5804__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var current_file = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(logseq.graph_parser.db.get_page_file(db,page_name));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(file,current_file)){
return current_file;
} else {
return null;
}
} else {
return null;
}
});
/**
 * Handle the case when the file is already exists in db
 *   Likely caused by renaming between caps and non-caps, then cause file system
 *   bugs on some OS
 *   e.g. on macOS, it doesn't fire the file change event when renaming between
 *     caps and non-caps
 */
frontend.worker.file.reset.validate_existing_file = (function frontend$worker$file$reset$validate_existing_file(repo,conn,file_page,file_path){
var temp__5804__auto__ = frontend.worker.file.reset.page_exists_in_another_file(cljs.core.deref(conn),file_page,file_path);
if(cljs.core.truth_(temp__5804__auto__)){
var current_file_path = temp__5804__auto__;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(file_path,current_file_path)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.path_normalize(clojure.string.lower_case(current_file_path)),logseq.common.util.path_normalize(clojure.string.lower_case(file_path)))){
var temp__5804__auto____$1 = (function (){var G__69079 = cljs.core.deref(conn);
var G__69080 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),current_file_path], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__69079,G__69080) : datascript.core.entity.call(null,G__69079,G__69080));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var file = temp__5804__auto____$1;
var G__69085_69151 = new cljs.core.Keyword(null,"backup-file","backup-file",-560755353);
var G__69086_69152 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,current_file_path,new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__69085_69151,G__69086_69152) : frontend.worker.util.post_message.call(null,G__69085_69151,G__69086_69152));

return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","path","file/path",-191335748),file_path], null)], null));
} else {
return null;
}
} else {
var G__69087 = new cljs.core.Keyword(null,"notify-existing-file","notify-existing-file",1395099748);
var G__69088 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"current-file-path","current-file-path",2051233087),current_file_path,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),file_path], null)], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__69087,G__69088) : frontend.worker.util.post_message.call(null,G__69087,G__69088));

}
} else {
return null;
}
} else {
return null;
}
});
/**
 * An implementation for the delete-blocks-fn in graph-parser/parse-file
 */
frontend.worker.file.reset.validate_and_get_blocks_to_delete = (function frontend$worker$file$reset$validate_and_get_blocks_to_delete(repo,conn,file_page,file_path,retain_uuid_blocks){
frontend.worker.file.reset.validate_existing_file(repo,conn,file_page,file_path);

return logseq.graph_parser.get_blocks_to_delete(cljs.core.deref(conn),file_page,file_path,retain_uuid_blocks);
});
/**
 * Parse file.
 * Decide how to treat the parsed file based on the file's triggering event
 * options -
 *   :fs/reset-event - the event that triggered the file update
 *   :fs/local-file-change - file changed on local disk
 *   :fs/remote-file-change - file changed on remote
 */
frontend.worker.file.reset.reset_file_BANG__STAR_ = (function frontend$worker$file$reset$reset_file_BANG__STAR_(db_conn,file_path,content,options){
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4(db_conn,file_path,content,options);
});
/**
 * Main fn for updating a db with the results of a parsed file
 */
frontend.worker.file.reset.reset_file_BANG_ = (function frontend$worker$file$reset$reset_file_BANG_(var_args){
var G__69121 = arguments.length;
switch (G__69121) {
case 4:
return frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (repo,conn,file_path,content){
return frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$5(repo,conn,file_path,content,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$5 = (function (repo,conn,file_path,content,p__69135){
var map__69137 = p__69135;
var map__69137__$1 = cljs.core.__destructure_map(map__69137);
var options = map__69137__$1;
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69137__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
var _ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69137__$1,new cljs.core.Keyword(null,"_ctime","_ctime",851368378));
var _mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69137__$1,new cljs.core.Keyword(null,"_mtime","_mtime",-882459022));
var config = frontend.worker.state.get_config(repo);
var options__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.Keyword(null,"verbose","verbose",1694226060)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"delete-blocks-fn","delete-blocks-fn",586451366),cljs.core.partial.cljs$core$IFn$_invoke$arity$3(frontend.worker.file.reset.validate_and_get_blocks_to_delete,repo,conn),new cljs.core.Keyword(null,"extract-options","extract-options",-572164844),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"user-config","user-config",-1138679827),config,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),frontend.worker.state.get_date_formatter(repo),new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),logseq.common.config.get_block_pattern((function (){var or__5002__auto__ = logseq.common.util.get_format(file_path);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})()),new cljs.core.Keyword(null,"filename-format","filename-format",-1193264412),new cljs.core.Keyword("file","name-format","file/name-format",1975432459).cljs$core$IFn$_invoke$arity$1(config)], null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0))], null)], 0));
return new cljs.core.Keyword(null,"tx","tx",466630418).cljs$core$IFn$_invoke$arity$1(frontend.worker.file.reset.reset_file_BANG__STAR_(conn,file_path,content,options__$1));
}));

(frontend.worker.file.reset.reset_file_BANG_.cljs$lang$maxFixedArity = 5);


//# sourceMappingURL=frontend.worker.file.reset.js.map
