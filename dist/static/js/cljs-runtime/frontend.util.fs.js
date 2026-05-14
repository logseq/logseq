goog.provide('frontend.util.fs');
var module$node_modules$path$path=shadow.js.require("module$node_modules$path$path", {});
/**
 * Ignore path for ls-dir-files-with-handler! and reload-dir!
 */
frontend.util.fs.ignored_path_QMARK_ = (function frontend$util$fs$ignored_path_QMARK_(dir,path){
var ignores = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [".",".recycle","node_modules","logseq/bak","logseq/version-files","logseq/graphs-txid.edn"], null);
if(typeof path === 'string'){
var or__5002__auto__ = cljs.core.some((function (p1__64501_SHARP_){
return clojure.string.starts_with_QMARK_(path,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,""))?p1__64501_SHARP_:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(dir),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__64501_SHARP_)].join('')));
}),ignores);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.some((function (p1__64502_SHARP_){
return clojure.string.includes_QMARK_(path,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,""))?["/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__64502_SHARP_),"/"].join(''):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__64502_SHARP_),"/"].join('')));
}),ignores);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = cljs.core.some((function (p1__64503_SHARP_){
return clojure.string.ends_with_QMARK_(path,p1__64503_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [".DS_Store","logseq/graphs-txid.edn"], null));
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (function (){var relpath = module$node_modules$path$path.relative(dir,path);
var or__5002__auto____$3 = cljs.core.re_find(/\/\.[^.]+/,relpath);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return cljs.core.re_find(/^\.[^.]+/,relpath);
}
})();
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var path__$1 = clojure.string.lower_case(path);
return (((!(clojure.string.blank_QMARK_(module$node_modules$path$path.extname(path__$1))))) && (cljs.core.not(cljs.core.some((function (p1__64504_SHARP_){
return clojure.string.ends_with_QMARK_(path__$1,p1__64504_SHARP_);
}),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [".md",".markdown",".org",".js",".edn",".css"], null)))));
}
}
}
}
} else {
return null;
}
});
frontend.util.fs.read_graphs_txid_info = (function frontend$util$fs$read_graphs_txid_info(root){
if(typeof root === 'string'){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(root,"logseq/graphs-txid.edn")),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(root,"logseq/graphs-txid.edn")),(function (txid_str){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = txid_str;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(txid_str);
} else {
return and__5000__auto__;
}
})()),(function (txid_meta){
return promesa.protocols._promise(txid_meta);
}));
}));
})),(function (e){
return console.error("[fs read txid data error]",e);
})):null));
}));
}));
} else {
return null;
}
});
frontend.util.fs.inflate_graphs_info = (function frontend$util$fs$inflate_graphs_info(graphs){
if(cljs.core.seq(graphs)){
return promesa.core.all((function (){var iter__5480__auto__ = (function frontend$util$fs$inflate_graphs_info_$_iter__64508(s__64509){
return (new cljs.core.LazySeq(null,(function (){
var s__64509__$1 = s__64509;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__64509__$1);
if(temp__5804__auto__){
var s__64509__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__64509__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__64509__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__64511 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__64510 = (0);
while(true){
if((i__64510 < size__5479__auto__)){
var map__64512 = cljs.core._nth(c__5478__auto__,i__64510);
var map__64512__$1 = cljs.core.__destructure_map(map__64512);
var graph = map__64512__$1;
var root = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64512__$1,new cljs.core.Keyword(null,"root","root",-448657453));
cljs.core.chunk_append(b__64511,promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__64510,map__64512,map__64512__$1,graph,root,c__5478__auto__,size__5479__auto__,b__64511,s__64509__$2,temp__5804__auto__){
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.fs.read_graphs_txid_info(root)),((function (i__64510,map__64512,map__64512__$1,graph,root,c__5478__auto__,size__5479__auto__,b__64511,s__64509__$2,temp__5804__auto__){
return (function (sync_meta){
return promesa.protocols._promise((cljs.core.truth_(sync_meta)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(graph,new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022),sync_meta,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),cljs.core.second(sync_meta)], 0)):graph));
});})(i__64510,map__64512,map__64512__$1,graph,root,c__5478__auto__,size__5479__auto__,b__64511,s__64509__$2,temp__5804__auto__))
);
});})(i__64510,map__64512,map__64512__$1,graph,root,c__5478__auto__,size__5479__auto__,b__64511,s__64509__$2,temp__5804__auto__))
));

var G__64517 = (i__64510 + (1));
i__64510 = G__64517;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__64511),frontend$util$fs$inflate_graphs_info_$_iter__64508(cljs.core.chunk_rest(s__64509__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__64511),null);
}
} else {
var map__64515 = cljs.core.first(s__64509__$2);
var map__64515__$1 = cljs.core.__destructure_map(map__64515);
var graph = map__64515__$1;
var root = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64515__$1,new cljs.core.Keyword(null,"root","root",-448657453));
return cljs.core.cons(promesa.protocols._mcat(promesa.protocols._promise(null),((function (map__64515,map__64515__$1,graph,root,s__64509__$2,temp__5804__auto__){
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.fs.read_graphs_txid_info(root)),(function (sync_meta){
return promesa.protocols._promise((cljs.core.truth_(sync_meta)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(graph,new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022),sync_meta,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),cljs.core.second(sync_meta)], 0)):graph));
}));
});})(map__64515,map__64515__$1,graph,root,s__64509__$2,temp__5804__auto__))
),frontend$util$fs$inflate_graphs_info_$_iter__64508(cljs.core.rest(s__64509__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(graphs);
})());
} else {
return cljs.core.PersistentVector.EMPTY;
}
});
frontend.util.fs.read_repo_file = (function frontend$util$fs$read_repo_file(repo_url,file_rpath){
var temp__5804__auto__ = frontend.config.get_repo_dir(repo_url);
if(cljs.core.truth_(temp__5804__auto__)){
var repo_dir = temp__5804__auto__;
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,file_rpath);
} else {
return null;
}
});
frontend.util.fs.include_reserved_chars_QMARK_ = frontend.common.file.util.include_reserved_chars_QMARK_;
frontend.util.fs.windows_reserved_filebodies = frontend.common.file.util.windows_reserved_filebodies;
frontend.util.fs.file_name_sanity = (function frontend$util$fs$file_name_sanity(name,_format){
return frontend.common.file.util.file_name_sanity(name);
});

//# sourceMappingURL=frontend.util.fs.js.map
