goog.provide('frontend.worker.file');
goog.scope(function(){
  frontend.worker.file.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.file !== 'undefined') && (typeof frontend.worker.file._STAR_writes !== 'undefined')){
} else {
frontend.worker.file._STAR_writes = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.file !== 'undefined') && (typeof frontend.worker.file._STAR_request_id !== 'undefined')){
} else {
frontend.worker.file._STAR_request_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
frontend.worker.file.conj_page_write_BANG_ = (function frontend$worker$file$conj_page_write_BANG_(page_id){
var request_id = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.file._STAR_request_id,cljs.core.inc);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.file._STAR_writes,cljs.core.assoc,request_id,page_id);

return request_id;
});
frontend.worker.file.dissoc_request_BANG_ = (function frontend$worker$file$dissoc_request_BANG_(request_id){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.file._STAR_writes),request_id);
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
var old_page_request_ids = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__100309){
var vec__100313 = p__100309;
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100313,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100313,(1),null);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p,page_id)) && ((r <= request_id)))){
return r;
} else {
return null;
}
}),cljs.core.deref(frontend.worker.file._STAR_writes));
if(cljs.core.seq(old_page_request_ids)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.file._STAR_writes,(function (x){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,x,old_page_request_ids);
}));
} else {
return null;
}
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.file !== 'undefined') && (typeof frontend.worker.file.file_writes_chan !== 'undefined')){
} else {
frontend.worker.file.file_writes_chan = (function (){var coercer = malli.core.coercer.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repo","repo",-1999060679),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.Keyword(null,"any","any",1705907423)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"any","any",1705907423)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"epoch","epoch",1435633666),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"request-id","request-id",-985684093),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null));
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$2((10000),cljs.core.map.cljs$core$IFn$_invoke$arity$1(coercer));
})();
}
frontend.worker.file.batch_write_interval = (1000);
frontend.worker.file.whiteboard_blocks_pull_keys_with_persisted_ids = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)], null)], null);
frontend.worker.file.cleanup_whiteboard_block = (function frontend$worker$file$cleanup_whiteboard_block(block){
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"ls-type","ls-type",1383834313)], null),false))){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","parent","block/parent",-918309064)], 0));
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","page","block/page",822314108)], 0));
}
});
frontend.worker.file.transact_file_tx_if_not_exists_BANG_ = (function frontend$worker$file$transact_file_tx_if_not_exists_BANG_(conn,page_block,ok_handler,context){
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_block))){
var format = cljs.core.name(cljs.core.get.cljs$core$IFn$_invoke$arity$3(page_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"preferred-format","preferred-format",-1784393121).cljs$core$IFn$_invoke$arity$1(context)));
var date_formatter = new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709).cljs$core$IFn$_invoke$arity$1(context);
var title = clojure.string.capitalize(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_block));
var whiteboard_page_QMARK_ = logseq.db.file_based.entity_util.whiteboard_QMARK_(page_block);
var format__$1 = ((whiteboard_page_QMARK_)?"edn":format);
var journal_page_QMARK_ = logseq.common.date.valid_journal_title_QMARK_(title,date_formatter);
var journal_title = logseq.common.date.normalize_journal_title(title,date_formatter);
var journal_page_QMARK___$1 = ((journal_page_QMARK_) && ((!(clojure.string.blank_QMARK_(journal_title)))));
var filename = ((journal_page_QMARK___$1)?logseq.common.date.date__GT_file_name(journal_title,new cljs.core.Keyword(null,"journal-file-name-format","journal-file-name-format",-323969121).cljs$core$IFn$_invoke$arity$1(context)):frontend.common.file.util.file_name_sanity((function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_block);
}
})()));
var sub_dir = ((journal_page_QMARK___$1)?new cljs.core.Keyword(null,"journals-directory","journals-directory",1373812460).cljs$core$IFn$_invoke$arity$1(context):((whiteboard_page_QMARK_)?new cljs.core.Keyword(null,"whiteboards-directory","whiteboards-directory",1994949079).cljs$core$IFn$_invoke$arity$1(context):new cljs.core.Keyword(null,"pages-directory","pages-directory",-1705912407).cljs$core$IFn$_invoke$arity$1(context)
));
var ext = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format__$1,"markdown"))?"md":format__$1);
var file_rpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(sub_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(filename),".",ext].join('')], 0));
var file = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("file","path","file/path",-191335748),file_rpath], null);
var tx = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("file","path","file/path",-191335748),file_rpath], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_block),new cljs.core.Keyword("block","file","block/file",183171933),file], null)], null);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx);

if(cljs.core.truth_(ok_handler)){
return (ok_handler.cljs$core$IFn$_invoke$arity$0 ? ok_handler.cljs$core$IFn$_invoke$arity$0() : ok_handler.call(null));
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.file.remove_transit_ids = (function frontend$worker$file$remove_transit_ids(block){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","file","block/file",183171933)], 0));
});
frontend.worker.file.save_tree_aux_BANG_ = (function frontend$worker$file$save_tree_aux_BANG_(repo,db,page_block,tree,blocks_just_deleted_QMARK_,context,request_id){
var page_block__$1 = (function (){var G__100351 = db;
var G__100352 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__100353 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__100351,G__100352,G__100353) : datascript.core.pull.call(null,G__100351,G__100352,G__100353));
})();
var init_level = (1);
var file_db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page_block__$1));
var file_path = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,file_db_id) : datascript.core.entity.call(null,db,file_db_id)));
var result = (cljs.core.truth_((function (){var and__5000__auto__ = typeof file_path === 'string';
if(and__5000__auto__){
return cljs.core.not_empty(file_path);
} else {
return and__5000__auto__;
}
})())?(function (){var new_content = ((logseq.db.file_based.entity_util.whiteboard_QMARK_(page_block__$1))?clojure.string.triml(frontend.common.file.util.ugly_pr_str(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),tree,new cljs.core.Keyword(null,"pages","pages",-285406513),(new cljs.core.List(null,frontend.worker.file.remove_transit_ids(page_block__$1),null,(1),null))], null))):frontend.common.file.core.tree__GT_file_content(repo,db,tree,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init-level","init-level",-1605905283),init_level], null),context));
if(((clojure.string.blank_QMARK_(new_content)) && (cljs.core.not(blocks_just_deleted_QMARK_)))){
return null;
} else {
var files = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [file_path,new_content], null)], null);
if(cljs.core.seq(files)){
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block__$1);
frontend.common.file.util.post_message(new cljs.core.Keyword(null,"write-files","write-files",1810322942),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id,new cljs.core.Keyword(null,"page-id","page-id",-872941168),page_id,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"files","files",-472457450),files], null));

return new cljs.core.Keyword(null,"sent","sent",-1537501490);
} else {
return null;
}
}
})():console.error("File path from page-block is not valid",page_block__$1,tree));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sent","sent",-1537501490),result)){
return null;
} else {
return frontend.worker.file.dissoc_request_BANG_(request_id);
}
});
frontend.worker.file.save_tree_BANG_ = (function frontend$worker$file$save_tree_BANG_(repo,conn,page_block,tree,blocks_just_deleted_QMARK_,context,request_id){
if(cljs.core.map_QMARK_(page_block)){
} else {
throw (new Error("Assert failed: (map? page-block)"));
}

if(cljs.core.truth_(repo)){
var ok_handler = (function (){
return frontend.worker.file.save_tree_aux_BANG_(repo,cljs.core.deref(conn),page_block,tree,blocks_just_deleted_QMARK_,context,request_id);
});
var file = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page_block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(page_block));
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1((function (){var G__100365 = cljs.core.deref(conn);
var G__100366 = page_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__100365,G__100366) : datascript.core.entity.call(null,G__100365,G__100366));
})());
} else {
return null;
}
}
})();
if(cljs.core.truth_(file)){
return ok_handler();
} else {
return frontend.worker.file.transact_file_tx_if_not_exists_BANG_(conn,page_block,ok_handler,context);
}
} else {
return null;
}
});
frontend.worker.file.do_write_file_BANG_ = (function frontend$worker$file$do_write_file_BANG_(repo,conn,page_db_id,outliner_op,context,request_id){
var page_block = (function (){var G__100375 = cljs.core.deref(conn);
var G__100376 = page_db_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__100375,G__100376) : datascript.core.entity.call(null,G__100375,G__100376));
})();
var page_db_id__$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block);
var whiteboard_QMARK_ = logseq.db.file_based.entity_util.whiteboard_QMARK_(page_block);
var blocks_count = logseq.db.get_page_blocks_count(cljs.core.deref(conn),page_db_id__$1);
var blocks_just_deleted_QMARK_ = (((blocks_count === (0))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),null,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),null], null), null),outliner_op)));
if((((blocks_count >= (1))) || (blocks_just_deleted_QMARK_))){
if((((((blocks_count > (500))) || (whiteboard_QMARK_))) && (cljs.core.not(frontend.worker.state.tx_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"diff","diff",2135942783),(3000)], null)], 0)))))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.file.file_writes_chan,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,page_db_id__$1,outliner_op,cljs_time.coerce.to_long(cljs_time.core.now()),request_id], null));
} else {
var blocks = ((whiteboard_QMARK_)?logseq.db.get_page_blocks.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(conn),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pull-keys","pull-keys",-768938808),frontend.worker.file.whiteboard_blocks_pull_keys_with_persisted_ids], null)], 0)):new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page_block));
var blocks__$1 = ((whiteboard_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.worker.file.cleanup_whiteboard_block,blocks):blocks);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(blocks__$1))) && (((clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks__$1)))) && ((((new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page_block) == null)) && ((!(whiteboard_QMARK_))))))))){
return frontend.worker.file.dissoc_request_BANG_(request_id);
} else {
var tree_or_blocks = ((whiteboard_QMARK_)?blocks__$1:logseq.outliner.tree.blocks__GT_vec_tree(repo,cljs.core.deref(conn),blocks__$1,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block)));
if(cljs.core.truth_(page_block)){
return frontend.worker.file.save_tree_BANG_(repo,conn,page_block,tree_or_blocks,blocks_just_deleted_QMARK_,context,request_id);
} else {
console.error(["can't find page id: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_db_id__$1)].join(''));

return frontend.worker.file.dissoc_request_BANG_(request_id);
}
}
}
} else {
return frontend.worker.file.dissoc_request_BANG_(request_id);
}
});
frontend.worker.file.write_files_BANG_ = (function frontend$worker$file$write_files_BANG_(conn,pages,context){
if(cljs.core.seq(pages)){
var all_request_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,pages));
var distincted_pages = logseq.common.util.distinct_by((function (p1__100386_SHARP_){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((3),p1__100386_SHARP_);
}),pages);
var repeated_ids = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(all_request_ids,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,distincted_pages)));
var seq__100388_100490 = cljs.core.seq(repeated_ids);
var chunk__100389_100491 = null;
var count__100390_100492 = (0);
var i__100391_100493 = (0);
while(true){
if((i__100391_100493 < count__100390_100492)){
var id_100495 = chunk__100389_100491.cljs$core$IIndexed$_nth$arity$2(null,i__100391_100493);
frontend.worker.file.dissoc_request_BANG_(id_100495);


var G__100496 = seq__100388_100490;
var G__100497 = chunk__100389_100491;
var G__100498 = count__100390_100492;
var G__100499 = (i__100391_100493 + (1));
seq__100388_100490 = G__100496;
chunk__100389_100491 = G__100497;
count__100390_100492 = G__100498;
i__100391_100493 = G__100499;
continue;
} else {
var temp__5804__auto___100501 = cljs.core.seq(seq__100388_100490);
if(temp__5804__auto___100501){
var seq__100388_100502__$1 = temp__5804__auto___100501;
if(cljs.core.chunked_seq_QMARK_(seq__100388_100502__$1)){
var c__5525__auto___100503 = cljs.core.chunk_first(seq__100388_100502__$1);
var G__100504 = cljs.core.chunk_rest(seq__100388_100502__$1);
var G__100505 = c__5525__auto___100503;
var G__100506 = cljs.core.count(c__5525__auto___100503);
var G__100507 = (0);
seq__100388_100490 = G__100504;
chunk__100389_100491 = G__100505;
count__100390_100492 = G__100506;
i__100391_100493 = G__100507;
continue;
} else {
var id_100508 = cljs.core.first(seq__100388_100502__$1);
frontend.worker.file.dissoc_request_BANG_(id_100508);


var G__100509 = cljs.core.next(seq__100388_100502__$1);
var G__100510 = null;
var G__100511 = (0);
var G__100512 = (0);
seq__100388_100490 = G__100509;
chunk__100389_100491 = G__100510;
count__100390_100492 = G__100511;
i__100391_100493 = G__100512;
continue;
}
} else {
}
}
break;
}

var seq__100395 = cljs.core.seq(distincted_pages);
var chunk__100396 = null;
var count__100397 = (0);
var i__100398 = (0);
while(true){
if((i__100398 < count__100397)){
var vec__100416 = chunk__100396.cljs$core$IIndexed$_nth$arity$2(null,i__100398);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100416,(0),null);
var page_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100416,(1),null);
var outliner_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100416,(2),null);
var _time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100416,(3),null);
var request_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100416,(4),null);
try{frontend.worker.file.do_write_file_BANG_(repo,conn,page_id,outliner_op,context,request_id);
}catch (e100419){var e_100514 = e100419;
var G__100421_100515 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__100422_100516 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Write file failed, please copy the changes to other editors in case of losing data."], null),"Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.worker.file.goog$module$goog$object.get(e_100514,"stack"))], null),new cljs.core.Keyword(null,"error","error",-978969032)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__100421_100515,G__100422_100516) : frontend.worker.util.post_message.call(null,G__100421_100515,G__100422_100516));

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","write-file-error","file/write-file-error",-1260826625),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e_100514], null),new cljs.core.Keyword(null,"line","line",212345235),196], null)),null);

frontend.worker.file.dissoc_request_BANG_(request_id);
}

var G__100526 = seq__100395;
var G__100527 = chunk__100396;
var G__100528 = count__100397;
var G__100529 = (i__100398 + (1));
seq__100395 = G__100526;
chunk__100396 = G__100527;
count__100397 = G__100528;
i__100398 = G__100529;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__100395);
if(temp__5804__auto__){
var seq__100395__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__100395__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__100395__$1);
var G__100530 = cljs.core.chunk_rest(seq__100395__$1);
var G__100531 = c__5525__auto__;
var G__100532 = cljs.core.count(c__5525__auto__);
var G__100533 = (0);
seq__100395 = G__100530;
chunk__100396 = G__100531;
count__100397 = G__100532;
i__100398 = G__100533;
continue;
} else {
var vec__100429 = cljs.core.first(seq__100395__$1);
var repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100429,(0),null);
var page_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100429,(1),null);
var outliner_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100429,(2),null);
var _time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100429,(3),null);
var request_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100429,(4),null);
try{frontend.worker.file.do_write_file_BANG_(repo,conn,page_id,outliner_op,context,request_id);
}catch (e100434){var e_100534 = e100434;
var G__100435_100535 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__100436_100536 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Write file failed, please copy the changes to other editors in case of losing data."], null),"Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.worker.file.goog$module$goog$object.get(e_100534,"stack"))], null),new cljs.core.Keyword(null,"error","error",-978969032)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__100435_100535,G__100436_100536) : frontend.worker.util.post_message.call(null,G__100435_100535,G__100436_100536));

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.file",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","write-file-error","file/write-file-error",-1260826625),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e_100534], null),new cljs.core.Keyword(null,"line","line",212345235),196], null)),null);

frontend.worker.file.dissoc_request_BANG_(request_id);
}

var G__100540 = cljs.core.next(seq__100395__$1);
var G__100541 = null;
var G__100542 = (0);
var G__100543 = (0);
seq__100395 = G__100540;
chunk__100396 = G__100541;
count__100397 = G__100542;
i__100398 = G__100543;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
frontend.worker.file.sync_to_file = (function frontend$worker$file$sync_to_file(repo,page_id,tx_meta){
if(cljs.core.truth_((function (){var and__5000__auto__ = page_id;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(new cljs.core.Keyword(null,"created-from-journal-template?","created-from-journal-template?",-2127356314).cljs$core$IFn$_invoke$arity$1(tx_meta))) && (cljs.core.not(new cljs.core.Keyword(null,"delete-files?","delete-files?",-1341179689).cljs$core$IFn$_invoke$arity$1(tx_meta))));
} else {
return and__5000__auto__;
}
})())){
var request_id = frontend.worker.file.conj_page_write_BANG_(page_id);
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.file.file_writes_chan,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,page_id,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta),cljs_time.coerce.to_long(cljs_time.core.now()),request_id], null));
} else {
return null;
}
});
frontend.worker.file._LT_ratelimit_file_writes_BANG_ = (function frontend$worker$file$_LT_ratelimit_file_writes_BANG_(flush_fn){
return frontend.common.async_util._LT_ratelimit.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.file.file_writes_chan,frontend.worker.file.batch_write_interval,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"filter-fn","filter-fn",1689475675),(function (_){
return true;
}),new cljs.core.Keyword(null,"flush-fn","flush-fn",668974810),flush_fn], 0));
});

//# sourceMappingURL=frontend.worker.file.js.map
