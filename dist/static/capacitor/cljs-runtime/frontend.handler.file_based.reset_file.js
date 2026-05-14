goog.provide('frontend.handler.file_based.reset_file');
/**
 * Conflict of files towards same page
 */
frontend.handler.file_based.reset_file.page_exists_in_another_file = (function frontend$handler$file_based$reset_file$page_exists_in_another_file(repo_url,page,file){
var temp__5804__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var current_file = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$2(repo_url,page_name));
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
frontend.handler.file_based.reset_file.validate_existing_file = (function frontend$handler$file_based$reset_file$validate_existing_file(repo_url,file_page,file_path){
var temp__5804__auto__ = frontend.handler.file_based.reset_file.page_exists_in_another_file(repo_url,file_page,file_path);
if(cljs.core.truth_(temp__5804__auto__)){
var current_file = temp__5804__auto__;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(file_path,current_file)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.path_normalize(clojure.string.lower_case(current_file)),logseq.common.util.path_normalize(clojure.string.lower_case(file_path)))){
var temp__5804__auto____$1 = (function (){var G__73171 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),current_file], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__73171) : frontend.db.pull.call(null,G__73171));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var file = temp__5804__auto____$1;
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___38832__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2("",current_file)),(function (disk_content){
return promesa.protocols._promise(frontend.fs.backup_db_file_BANG_(repo_url,current_file,new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file),disk_content));
}));
}));

return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo_url,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","path","file/path",-191335748),file_path], null)], null));
} else {
return null;
}
} else {
var error = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","validate-existing-file-error","file/validate-existing-file-error",-2073698910),current_file,file_path], 0));
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),error,new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));

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
frontend.handler.file_based.reset_file.validate_and_get_blocks_to_delete = (function frontend$handler$file_based$reset_file$validate_and_get_blocks_to_delete(repo_url,db,file_page,file_path,retain_uuid_blocks){
frontend.handler.file_based.reset_file.validate_existing_file(repo_url,file_page,file_path);

return logseq.graph_parser.get_blocks_to_delete(db,file_page,file_path,retain_uuid_blocks);
});
/**
 * Infer new uuids from existing DB data and diff with the new AST
 * Return a list of uuids for the new blocks
 */
frontend.handler.file_based.reset_file.diff_merge_uuids_2ways = (function frontend$handler$file_based$reset_file$diff_merge_uuids_2ways(format,ast,content,p__73182){
var map__73183 = p__73182;
var map__73183__$1 = cljs.core.__destructure_map(map__73183);
var options = map__73183__$1;
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73183__$1,new cljs.core.Keyword(null,"page-name","page-name",974981762));
try{var base_diffblocks = frontend.fs.diff_merge.db__GT_diff_blocks(page_name);
var income_diffblocks = frontend.fs.diff_merge.ast__GT_diff_blocks(ast,content,format,options);
var diff_ops = frontend.fs.diff_merge.diff(base_diffblocks,income_diffblocks);
var new_uuids = (function (){var G__73185 = diff_ops;
var G__73186 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uuid","uuid",-2145095719),base_diffblocks);
return (frontend.fs.diff_merge.attachUUID.cljs$core$IFn$_invoke$arity$2 ? frontend.fs.diff_merge.attachUUID.cljs$core$IFn$_invoke$arity$2(G__73185,G__73186) : frontend.fs.diff_merge.attachUUID.call(null,G__73185,G__73186));
})();
return cljs_bean.core.__GT_clj(new_uuids);
}catch (e73184){if((e73184 instanceof Error)){
var e = e73184;
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-based.reset-file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("diff-merge","diff-merge-2way-calling-failed","diff-merge/diff-merge-2way-calling-failed",-1539844445),e,new cljs.core.Keyword(null,"line","line",212345235),69], null)),null);
} else {
throw e73184;

}
}});
/**
 * Parse file considering diff-merge with local or remote file
 * Decide how to treat the parsed file based on the file's triggering event
 * options -
 *   :fs/reset-event - the event that triggered the file update
 *   :fs/local-file-change - file changed on local disk
 *   :fs/remote-file-change - file changed on remote
 */
frontend.handler.file_based.reset_file.reset_file_BANG__STAR_ = (function frontend$handler$file_based$reset_file$reset_file_BANG__STAR_(repo_url,file_path,content,p__73194){
var map__73195 = p__73194;
var map__73195__$1 = cljs.core.__destructure_map(map__73195);
var options = map__73195__$1;
var event = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73195__$1,new cljs.core.Keyword("fs","event","fs/event",301434435));
var temp__5804__auto__ = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(repo_url,false) : frontend.db.get_db.call(null,repo_url,false));
if(cljs.core.truth_(temp__5804__auto__)){
var db_conn = temp__5804__auto__;
var G__73196 = event;
var G__73196__$1 = (((G__73196 instanceof cljs.core.Keyword))?G__73196.fqn:null);
switch (G__73196__$1) {
case "fs/local-file-change":
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4(db_conn,file_path,content,cljs.core.assoc_in(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extract-options","extract-options",-572164844),new cljs.core.Keyword(null,"resolve-uuid-fn","resolve-uuid-fn",-1951054525)], null),frontend.handler.file_based.reset_file.diff_merge_uuids_2ways));

break;
default:
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4(db_conn,file_path,content,options);

}
} else {
return null;
}
});
/**
 * Main fn for updating a db with the results of a parsed file
 */
frontend.handler.file_based.reset_file.reset_file_BANG_ = (function frontend$handler$file_based$reset_file$reset_file_BANG_(var_args){
var G__73199 = arguments.length;
switch (G__73199) {
case 3:
return frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo_url,file_path,content){
return frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$core$IFn$_invoke$arity$4(repo_url,file_path,content,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (repo_url,file_path,content,p__73202){
var map__73203 = p__73202;
var map__73203__$1 = cljs.core.__destructure_map(map__73203);
var options = map__73203__$1;
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73203__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
var extracted_block_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73203__$1,new cljs.core.Keyword(null,"extracted-block-ids","extracted-block-ids",-1444219803));
var _ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73203__$1,new cljs.core.Keyword(null,"_ctime","_ctime",851368378));
var _mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73203__$1,new cljs.core.Keyword(null,"_mtime","_mtime",-882459022));
var options__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"verbose","verbose",1694226060),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"extracted-block-ids","extracted-block-ids",-1444219803)], 0)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"delete-blocks-fn","delete-blocks-fn",586451366),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.reset_file.validate_and_get_blocks_to_delete,repo_url),new cljs.core.Keyword(null,"extract-options","extract-options",-572164844),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"user-config","user-config",-1138679827),frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),frontend.state.get_date_formatter(),new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),frontend.config.get_block_pattern(logseq.common.util.get_format(file_path)),new cljs.core.Keyword(null,"filename-format","filename-format",-1193264412),frontend.state.get_filename_format.cljs$core$IFn$_invoke$arity$1(repo_url)], null),(((!((extracted_block_ids == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extracted-block-ids","extracted-block-ids",-1444219803),extracted_block_ids], null):null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0))], null)], 0));
return new cljs.core.Keyword(null,"tx","tx",466630418).cljs$core$IFn$_invoke$arity$1(frontend.handler.file_based.reset_file.reset_file_BANG__STAR_(repo_url,file_path,content,options__$1));
}));

(frontend.handler.file_based.reset_file.reset_file_BANG_.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=frontend.handler.file_based.reset_file.js.map
