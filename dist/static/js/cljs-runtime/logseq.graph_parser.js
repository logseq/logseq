goog.provide('logseq.graph_parser');
logseq.graph_parser.retract_blocks_tx = (function logseq$graph_parser$retract_blocks_tx(blocks,retain_uuids){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__45358){
var map__45360 = p__45358;
var map__45360__$1 = cljs.core.__destructure_map(map__45360);
var uuid_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45360__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var eid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45360__$1,new cljs.core.Keyword("db","id","db/id",-1388397098));
if(cljs.core.truth_((function (){var and__5000__auto__ = uuid_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(retain_uuids,uuid_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (attr){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),eid,attr], null);
}),logseq.db.file_based.schema.retract_attributes);
} else {
if(cljs.core.truth_(eid)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),eid], null)], null);
} else {
return null;
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0));
});
/**
 * Copy of file-model/get-file-page. Too basic to couple to main app
 */
logseq.graph_parser.get_file_page = (function logseq$graph_parser$get_file_page(db,file_path){
return cljs.core.ffirst((function (){var G__45369 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?path","?path",385070032,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Symbol(null,"?file","?file",-1121006094,null)], null)], null);
var G__45370 = db;
var G__45371 = file_path;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__45369,G__45370,G__45371) : datascript.core.q.call(null,G__45369,G__45370,G__45371));
})());
});
/**
 * Returns the transactional operations to retract blocks belonging to the
 *   given page name and file path. This function is required when a file is being
 *   parsed from disk; before saving the parsed, blocks from the previous version
 *   of that file need to be retracted.
 * 
 *   The 'Page' parsed from the new file version is passed separately from the
 *   file-path, as the page name can be set via properties in the file, and thus
 *   can change between versions. If it has changed, existing blocks for both the
 *   old and new page name will be retracted.
 * 
 *   Blocks are by default fully cleared via retractEntity. However, a collection
 *   of block UUIDs to retain can be passed, and any blocks with matching uuids
 *   will instead have their attributes cleared individually via
 *   'retractAttribute'. This will preserve block references to the retained
 *   UUIDs.
 */
logseq.graph_parser.get_blocks_to_delete = (function logseq$graph_parser$get_blocks_to_delete(db,file_page,file_path,retain_uuid_blocks){
var existing_file_page = logseq.graph_parser.get_file_page(db,file_path);
var pages_to_clear = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.some_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [existing_file_page,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(file_page)], null)));
var blocks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (page_id){
return new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id) : datascript.core.entity.call(null,db,page_id)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_to_clear], 0));
var retain_uuids = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),retain_uuid_blocks));
return logseq.graph_parser.retract_blocks_tx(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(blocks),retain_uuids);
});
/**
 * Parse file and save parsed data to the given db. Main parse fn used by logseq app.
 * Options available:
 * 
 *   * :delete-blocks-fn - Optional fn which is called with the new page, file and existing block uuids
 *   which may be referenced elsewhere. Used to delete the existing blocks before saving the new ones.
 * Implemented in file-common-handler/validate-and-get-blocks-to-delete for IoC
 *   * :extract-options - Options map to pass to extract/extract
 */
logseq.graph_parser.parse_file = (function logseq$graph_parser$parse_file(var_args){
var G__45414 = arguments.length;
switch (G__45414) {
case 3:
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$3 = (function (conn,file_path,content){
return logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4(conn,file_path,content,cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.graph_parser.parse_file.cljs$core$IFn$_invoke$arity$4 = (function (conn,file_path,content,p__45427){
var map__45429 = p__45427;
var map__45429__$1 = cljs.core.__destructure_map(map__45429);
var options = map__45429__$1;
var delete_blocks_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__45429__$1,new cljs.core.Keyword(null,"delete-blocks-fn","delete-blocks-fn",586451366),cljs.core.constantly(cljs.core.PersistentVector.EMPTY));
var extract_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45429__$1,new cljs.core.Keyword(null,"extract-options","extract-options",-572164844));
var ctime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45429__$1,new cljs.core.Keyword(null,"ctime","ctime",1459030131));
var mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45429__$1,new cljs.core.Keyword(null,"mtime","mtime",963165087));
var format = logseq.common.util.get_format(file_path);
var file_content = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("file","path","file/path",-191335748),file_path], null)], null);
var map__45431 = (function (){var extract_options_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),logseq.common.config.get_block_pattern(format),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),"MMM do, yyyy",new cljs.core.Keyword(null,"uri-encoded?","uri-encoded?",663370134),false,new cljs.core.Keyword(null,"filename-format","filename-format",-1193264412),new cljs.core.Keyword(null,"legacy","legacy",1434943289)], null),extract_options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.deref(conn)], null)], 0));
var map__45433 = ((cljs.core.contains_QMARK_(logseq.common.config.mldoc_support_formats,format))?logseq.graph_parser.extract.extract(file_path,content,extract_options_SINGLEQUOTE_):(cljs.core.truth_(logseq.common.config.whiteboard_QMARK_(file_path))?logseq.graph_parser.extract.extract_whiteboard_edn(file_path,content,extract_options_SINGLEQUOTE_):null
));
var map__45433__$1 = cljs.core.__destructure_map(map__45433);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__45433__$1,new cljs.core.Keyword(null,"pages","pages",-285406513),cljs.core.PersistentVector.EMPTY);
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__45433__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.PersistentVector.EMPTY);
var ast = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__45433__$1,new cljs.core.Keyword(null,"ast","ast",-860334068),cljs.core.PersistentVector.EMPTY);
var refs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45433__$1,new cljs.core.Keyword(null,"refs","refs",-1560051448));
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
}),blocks);
var delete_blocks = (function (){var G__45443 = cljs.core.first(pages);
var G__45444 = file_path;
var G__45445 = block_ids;
return (delete_blocks_fn.cljs$core$IFn$_invoke$arity$3 ? delete_blocks_fn.cljs$core$IFn$_invoke$arity$3(G__45443,G__45444,G__45445) : delete_blocks_fn.call(null,G__45443,G__45444,G__45445));
})();
var block_refs_ids = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.second(ref)], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (ref){
return ((cljs.core.vector_QMARK_(ref)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0)))));
var block_ids__$1 = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(block_ids),cljs.core.set(block_refs_ids));
var pages__$1 = logseq.graph_parser.extract.with_ref_pages(pages,blocks);
var pages_index = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45411_SHARP_){
return cljs.core.select_keys(p1__45411_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316)], null));
}),pages__$1);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx","tx",466630418),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(file_content,refs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_index,delete_blocks,pages__$1,block_ids__$1,blocks], 0)),new cljs.core.Keyword(null,"ast","ast",-860334068),ast], null);
})();
var map__45431__$1 = cljs.core.__destructure_map(map__45431);
var tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45431__$1,new cljs.core.Keyword(null,"tx","tx",466630418));
var ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45431__$1,new cljs.core.Keyword(null,"ast","ast",-860334068));
var file_entity = (function (){var G__45453 = cljs.core.deref(conn);
var G__45454 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),file_path], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__45453,G__45454) : datascript.core.entity.call(null,G__45453,G__45454));
})();
var tx__$1 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__45458 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),file_path,new cljs.core.Keyword("file","content","file/content",12680964),content], null);
var G__45458__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = ctime;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (file_entity == null);
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45458,new cljs.core.Keyword("file","created-at","file/created-at",-92397056),(function (){var or__5002__auto__ = ctime;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new Date());
}
})()):G__45458);
if(cljs.core.truth_(mtime)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45458__$1,new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),mtime);
} else {
return G__45458__$1;
}
})()], null));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx__$1,cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161)], null)));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx","tx",466630418),tx__$1,new cljs.core.Keyword(null,"ast","ast",-860334068),ast], null);
}));

(logseq.graph_parser.parse_file.cljs$lang$maxFixedArity = 4);

/**
 * Filters files in preparation for parsing. Only includes files that are
 *   supported by parser
 */
logseq.graph_parser.filter_files = (function logseq$graph_parser$filter_files(files){
var support_files = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
var format = logseq.common.util.get_format(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file));
return cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"css","css",1135045163),null,new cljs.core.Keyword(null,"edn","edn",1317840885),null], null), null),logseq.common.config.mldoc_support_formats),format);
}),files);
var support_files__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748),support_files);
var map__45472 = cljs.core.group_by((function (file){
return clojure.string.includes_QMARK_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),"journals/");
}),support_files__$1);
var map__45472__$1 = cljs.core.__destructure_map(map__45472);
var journals = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45472__$1,true);
var non_journals = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45472__$1,false);
var map__45473 = cljs.core.group_by((function (file){
return ((clojure.string.includes_QMARK_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),"contents.")) || (((clojure.string.includes_QMARK_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),".edn")) || (clojure.string.includes_QMARK_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),"custom.css")))));
}),non_journals);
var map__45473__$1 = cljs.core.__destructure_map(map__45473);
var built_in = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45473__$1,true);
var others = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45473__$1,false);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.reverse(journals),built_in,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([others], 0));
});

//# sourceMappingURL=logseq.graph_parser.js.map
