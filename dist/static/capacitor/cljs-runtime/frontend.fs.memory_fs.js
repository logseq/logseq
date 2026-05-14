goog.provide('frontend.fs.memory_fs');
/**
 * Read dir recursively, return all paths
 * 
 * accept dir as path, without memory:// prefix for simplicity
 */
frontend.fs.memory_fs._LT_readdir = (function frontend$fs$memory_fs$_LT_readdir(dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_93360,reject_fn_93359){
var loop_fn_93356 = (function frontend$fs$memory_fs$_LT_readdir_$_loop_fn_93356(result,dirs){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_93357,err_93358){
if((!((err_93358 == null)))){
return (reject_fn_93359.cljs$core$IFn$_invoke$arity$1 ? reject_fn_93359.cljs$core$IFn$_invoke$arity$1(err_93358) : reject_fn_93359.call(null,err_93358));
} else {
if(promesa.core.recur_QMARK_(res_93357)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$fs$memory_fs$_LT_readdir_$_loop_fn_93356,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_93357));
})));

return null;
} else {
return (resolve_fn_93360.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_93360.cljs$core$IFn$_invoke$arity$1(res_93357) : resolve_fn_93360.call(null,res_93357));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(result),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(dirs),(function (dirs__$1){
return promesa.protocols._promise(((cljs.core.empty_QMARK_(dirs__$1))?result__$1:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(dirs__$1)),(function (dir__$1){
return promesa.protocols._mcat(promesa.protocols._promise(window.pfs.stat(dir__$1)),(function (stat){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(stat.type,"file")),(function (is_file_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(is_file_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result__$1,dir__$1):result__$1)),(function (result__$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(is_file_QMARK_)?null:promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(window.pfs.readdir(dir__$1),cljs_bean.core.__GT_clj),(function (rpaths){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__93354_SHARP_){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__93354_SHARP_], 0));
}),rpaths);
})))),(function (dir_content){
return promesa.protocols._promise(promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [result__$2,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(dirs__$1),dir_content)], null)));
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
return loop_fn_93356(cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [dir], null));
})));
}))),(function (result){
return promesa.protocols._promise(result);
}));
}));
});
/**
 * dir is path, without memory:// prefix for simplicity
 */
frontend.fs.memory_fs._LT_ensure_dir_BANG_ = (function frontend$fs$memory_fs$_LT_ensure_dir_BANG_(dir){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(window.pfs.stat(dir)),(function (stat){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(stat.type,"file"))?promesa.core.rejected("Path is a file"):promesa.core.resolved(null)
));
}));
})),(function (_error){
return window.pfs.mkdir(dir);
}));
});
/**
 * dir is path, without memory:// prefix for simplicity
 */
frontend.fs.memory_fs._LT_exists_QMARK_ = (function frontend$fs$memory_fs$_LT_exists_QMARK_(dir){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(window.pfs.stat(dir),(function (stat){
return (!((stat == null)));
})),(function (_){
return null;
}));
});
/**
 * mkdir, recursively create parent directories if not exist
 * 
 * lightning-fs does not support's :recursive in mkdir options
 */
frontend.fs.memory_fs._LT_mkdir_recur_BANG_ = (function frontend$fs$memory_fs$_LT_mkdir_recur_BANG_(dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.url_to_path(dir)),(function (fpath){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_93430,reject_fn_93429){
var loop_fn_93426 = (function frontend$fs$memory_fs$_LT_mkdir_recur_BANG__$_loop_fn_93426(top_parent,remains){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_93427,err_93428){
if((!((err_93428 == null)))){
return (reject_fn_93429.cljs$core$IFn$_invoke$arity$1 ? reject_fn_93429.cljs$core$IFn$_invoke$arity$1(err_93428) : reject_fn_93429.call(null,err_93428));
} else {
if(promesa.core.recur_QMARK_(res_93427)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$fs$memory_fs$_LT_mkdir_recur_BANG__$_loop_fn_93426,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_93427));
})));

return null;
} else {
return (resolve_fn_93430.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_93430.cljs$core$IFn$_invoke$arity$1(res_93427) : resolve_fn_93430.call(null,res_93427));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(top_parent),(function (top_parent__$1){
return promesa.protocols._mcat(promesa.protocols._promise(remains),(function (remains__$1){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.memory_fs._LT_exists_QMARK_(top_parent__$1)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?cljs.core.reverse(remains__$1):promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.common.path.parent(top_parent__$1),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(remains__$1,top_parent__$1)], null))));
}));
})));
}));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_93426(fpath,cljs.core.PersistentVector.EMPTY);
})));
}))),(function (sub_dirs){
return promesa.protocols._promise(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_93443,reject_fn_93442){
var loop_fn_93439 = (function frontend$fs$memory_fs$_LT_mkdir_recur_BANG__$_loop_fn_93439(remains){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_93440,err_93441){
if((!((err_93441 == null)))){
return (reject_fn_93442.cljs$core$IFn$_invoke$arity$1 ? reject_fn_93442.cljs$core$IFn$_invoke$arity$1(err_93441) : reject_fn_93442.call(null,err_93441));
} else {
if(promesa.core.recur_QMARK_(res_93440)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$fs$memory_fs$_LT_mkdir_recur_BANG__$_loop_fn_93439,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_93440));
})));

return null;
} else {
return (resolve_fn_93443.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_93443.cljs$core$IFn$_invoke$arity$1(res_93440) : resolve_fn_93443.call(null,res_93440));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(remains),(function (remains__$1){
return promesa.protocols._promise(((cljs.core.empty_QMARK_(remains__$1))?promesa.core.resolved(null):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(window.pfs.mkdir(cljs.core.first(remains__$1))),(function (___48186__auto__){
return promesa.protocols._promise(promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.rest(remains__$1)], null)));
}));
}))));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_93439(sub_dirs);
})));
})));
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
frontend.fs.memory_fs.MemoryFs = (function (__meta,__extmap,__hash){
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k93452,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__93459 = k93452;
switch (G__93459) {
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k93452,else__5303__auto__);

}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__93461){
var vec__93464 = p__93461;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93464,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93464,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#frontend.fs.memory-fs.MemoryFs{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__93451){
var self__ = this;
var G__93451__$1 = this;
return (new cljs.core.RecordIter((0),G__93451__$1,0,cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new frontend.fs.memory_fs.MemoryFs(self__.__meta,self__.__extmap,self__.__hash));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (0 + cljs.core.count(self__.__extmap));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1927770687 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this93453,other93454){
var self__ = this;
var this93453__$1 = this;
return (((!((other93454 == null)))) && ((((this93453__$1.constructor === other93454.constructor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this93453__$1.__extmap,other93454.__extmap)))));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.EMPTY,k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new frontend.fs.memory_fs.MemoryFs(self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k93452){
var self__ = this;
var this__5307__auto____$1 = this;
return cljs.core.contains_QMARK_(self__.__extmap,k93452);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__93451){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__93473 = cljs.core.keyword_identical_QMARK_;
var expr__93474 = k__5309__auto__;
return (new frontend.fs.memory_fs.MemoryFs(self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__93451),null));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__93451){
var self__ = this;
var this__5299__auto____$1 = this;
return (new frontend.fs.memory_fs.MemoryFs(G__93451,self__.__extmap,self__.__hash));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$mkdir_BANG_$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
if(cljs.core.truth_(window.pfs)){
var fpath = logseq.common.path.url_to_path(dir);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(window.pfs.mkdir(fpath),(function (error){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["(memory-fs)Mkdir error: ",error], 0));
}));
} else {
return null;
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$unlink_BANG_$arity$4 = (function (_this,_repo,path,opts){
var self__ = this;
var _this__$1 = this;
if(cljs.core.truth_(window.pfs)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.url_to_path(path)),(function (fpath){
return promesa.protocols._mcat(promesa.protocols._promise(window.pfs.stat(fpath)),(function (stat){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(stat.type,"file"))?window.pfs.unlink(fpath,opts):promesa.core.rejected("Unlinking a directory is not allowed, use rmdir! instead")));
}));
}));
}));
} else {
return null;
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$get_files$arity$2 = (function (_this,_path_or_handle){
var self__ = this;
var _this__$1 = this;
return null;
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$rename_BANG_$arity$4 = (function (_this,_repo,old_path,new_path){
var self__ = this;
var _this__$1 = this;
var old_path__$1 = logseq.common.path.url_to_path(old_path);
var new_path__$1 = logseq.common.path.url_to_path(new_path);
return window.pfs.rename(old_path__$1,new_path__$1);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$readdir$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
if(cljs.core.truth_(window.pfs)){
var fpath = logseq.common.path.url_to_path(dir);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.fs.memory_fs._LT_readdir(fpath),(function (rpaths){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__93449_SHARP_){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("memory://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__93449_SHARP_], 0));
}),rpaths);
})),(function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["(memory-fs)Readdir error: ",error], 0));

return promesa.core.rejected(error);
}));
} else {
return null;
}
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$stat$arity$2 = (function (_this,fpath){
var self__ = this;
var _this__$1 = this;
var fpath__$1 = logseq.common.path.url_to_path(fpath);
return window.pfs.stat(fpath__$1);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$watch_dir_BANG_$arity$3 = (function (_this,_dir,_options){
var self__ = this;
var _this__$1 = this;
return null;
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$unwatch_dir_BANG_$arity$2 = (function (_this,_dir){
var self__ = this;
var _this__$1 = this;
return null;
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$rmdir_BANG_$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
var fpath = logseq.common.path.url_to_path(dir);
return window.workerThread.rimraf(fpath);
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$write_file_BANG_$arity$6 = (function (_this,_repo,dir,rpath,content,_opts){
var self__ = this;
var _this__$1 = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.url_to_path(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rpath], 0)))),(function (fpath){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.path.parent(fpath)),(function (containing_dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.memory_fs._LT_ensure_dir_BANG_(containing_dir)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(window.pfs.writeFile(fpath,content)),(function (___$1){
return promesa.impl.resolved(null);
}));
}));
}));
}));
}));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$open_dir$arity$2 = (function (_this,_dir){
var self__ = this;
var _this__$1 = this;
return null;
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$read_file$arity$4 = (function (_this,dir,path,options){
var self__ = this;
var _this__$1 = this;
var fpath = logseq.common.path.url_to_path(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0)));
return window.pfs.readFile(fpath,cljs.core.clj__GT_js(options));
}));

(frontend.fs.memory_fs.MemoryFs.prototype.frontend$fs$protocol$Fs$mkdir_recur_BANG_$arity$2 = (function (_this,dir){
var self__ = this;
var _this__$1 = this;
if(cljs.core.truth_(window.pfs)){
var fpath = logseq.common.path.url_to_path(dir);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.memory_fs._LT_mkdir_recur_BANG_(fpath),(function (error){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["(memory-fs)Mkdir-recur error: ",error], 0));
}));
} else {
return null;
}
}));

(frontend.fs.memory_fs.MemoryFs.getBasis = (function (){
return cljs.core.PersistentVector.EMPTY;
}));

(frontend.fs.memory_fs.MemoryFs.cljs$lang$type = true);

(frontend.fs.memory_fs.MemoryFs.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"frontend.fs.memory-fs/MemoryFs",null,(1),null));
}));

(frontend.fs.memory_fs.MemoryFs.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"frontend.fs.memory-fs/MemoryFs");
}));

/**
 * Positional factory function for frontend.fs.memory-fs/MemoryFs.
 */
frontend.fs.memory_fs.__GT_MemoryFs = (function frontend$fs$memory_fs$__GT_MemoryFs(){
return (new frontend.fs.memory_fs.MemoryFs(null,null,null));
});

/**
 * Factory function for frontend.fs.memory-fs/MemoryFs, taking a map of keywords to field values.
 */
frontend.fs.memory_fs.map__GT_MemoryFs = (function frontend$fs$memory_fs$map__GT_MemoryFs(G__93456){
var extmap__5342__auto__ = (function (){var G__93489 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$1(G__93456);
if(cljs.core.record_QMARK_(G__93456)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__93489);
} else {
return G__93489;
}
})();
return (new frontend.fs.memory_fs.MemoryFs(null,cljs.core.not_empty(extmap__5342__auto__),null));
});


//# sourceMappingURL=frontend.fs.memory_fs.js.map
