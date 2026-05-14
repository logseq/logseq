goog.provide('frontend.handler.file_based.repo');
frontend.handler.file_based.repo.create_contents_file = (function frontend$handler$file_based$repo$create_contents_file(repo_url){
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo_url)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_pages_directory()),(function (pages_dir){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65479_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pages_dir),"/contents.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__65479_SHARP_)].join('');
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["org","md"], null))),(function (p__65481){
var vec__65482 = p__65481;
var org_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65482,(0),null);
var md_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65482,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (p1__65480_SHARP_){
return frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,p1__65480_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [org_path,md_path], null))),(function (contents_file_exist_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(contents_file_exist_QMARK_)?null:(function (){var format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var file_rpath = ["pages/","contents.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_file_extension(format))].join('');
var default_content = (function (){var G__65485 = cljs.core.name(format);
switch (G__65485) {
case "org":
return "*\n";

break;
case "markdown":
return "-\n";

break;
default:
return "";

}
})();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_dir], 0)))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo_url,repo_dir,file_rpath,default_content)),(function (file_exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(file_exists_QMARK_)?null:frontend.handler.file_based.file.reset_file_BANG_(repo_url,file_rpath,default_content,cljs.core.PersistentArrayMap.EMPTY)));
}));
}));
}));
})()));
}));
}));
}));
}));
}));
});
frontend.handler.file_based.repo.create_custom_theme = (function frontend$handler$file_based$repo$create_custom_theme(repo_url){
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

var repo_dir = frontend.config.get_repo_dir(repo_url);
var path = [frontend.config.app_name,"/",frontend.config.custom_css_file].join('');
var file_rpath = path;
var default_content = "";
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name], 0)))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo_url,repo_dir,file_rpath,default_content)),(function (file_exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(file_exists_QMARK_)?null:frontend.handler.file_based.file.reset_file_BANG_(repo_url,path,default_content,cljs.core.PersistentArrayMap.EMPTY)));
}));
}));
}));
});
/**
 * Creates a default logseq/config.edn if it doesn't exist
 */
frontend.handler.file_based.repo.create_config_file_if_not_exists = (function frontend$handler$file_based$repo$create_config_file_if_not_exists(repo_url){
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

var repo_dir = frontend.config.get_repo_dir(repo_url);
var app_dir = frontend.config.app_name;
var dir = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([app_dir], 0));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(dir)),(function (_){
return promesa.protocols._promise((function (){var default_content = frontend.config.config_default_content;
var path = [app_dir,"/",frontend.config.config_file].join('');
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo_url,repo_dir,"logseq/config.edn",default_content)),(function (file_exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(file_exists_QMARK_)?null:(function (){
frontend.handler.file_based.file.reset_file_BANG_(repo_url,path,default_content,cljs.core.PersistentArrayMap.EMPTY);

return frontend.handler.repo_config.set_repo_config_state_BANG_(repo_url,default_content);
})()
));
}));
}));
})());
}));
}));
});
frontend.handler.file_based.repo.create_default_files_BANG_ = (function frontend$handler$file_based$repo$create_default_files_BANG_(repo_url){
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

var repo_dir = frontend.config.get_repo_dir(repo_url);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name], 0)))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name,frontend.config.recycle_dir], 0)))),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.get_journals_directory()], 0)))),(function (___40947__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_config_file_if_not_exists(repo_url)),(function (___40947__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_contents_file(repo_url)),(function (___40947__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_custom_theme(repo_url)),(function (___40947__auto____$5){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","create-today-journal","page/create-today-journal",-248526088),repo_url], null)));
}));
}));
}));
}));
}));
}));
}));
});
/**
 * Accept: .md, .org, .edn, .css
 */
frontend.handler.file_based.repo.parse_and_load_file_BANG_ = (function frontend$handler$file_based$repo$parse_and_load_file_BANG_(repo_url,file,p__65503){
var map__65504 = p__65503;
var map__65504__$1 = cljs.core.__destructure_map(map__65504);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65504__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65504__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_file(repo_url,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0)))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}))),(function (___40947__auto__){
return promesa.protocols._promise(result);
}));
}));
})),(function (e){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Parse and load file failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file))], 0));

console.error(e);

frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(m,new cljs.core.Keyword(null,"failed-parsing-files","failed-parsing-files",1012423223),cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),e], null));
}));

frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}));

return null;
}));
});
/**
 * Accept: .md, .org, .edn, .css
 */
frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_ = (function frontend$handler$file_based$repo$parse_and_load_file_test_version_BANG_(repo_url,file,p__65508){
var map__65509 = p__65508;
var map__65509__$1 = cljs.core.__destructure_map(map__65509);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65509__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65509__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
try{var result = frontend.handler.file_based.file.alter_file_test_version(repo_url,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0)));
frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}));

return result;
}catch (e65510){var e = e65510;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Parse and load file failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file))], 0));

console.error(e);

frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(m,new cljs.core.Keyword(null,"failed-parsing-files","failed-parsing-files",1012423223),cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),e], null));
}));

return frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}));
}});
frontend.handler.file_based.repo.after_parse = (function frontend$handler$file_based$repo$after_parse(repo_url,re_render_QMARK_,re_render_opts,opts,graph_added_chan){
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570).cljs$core$IFn$_invoke$arity$1(opts));
}
})())){
frontend.handler.file_based.repo.create_default_files_BANG_(repo_url);
} else {
}

if(cljs.core.truth_(re_render_QMARK_)){
frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$1(re_render_opts);
} else {
}

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","added","graph/added",2021754774),repo_url,opts], null));

var parse_errors_65756 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),repo_url,new cljs.core.Keyword(null,"failed-parsing-files","failed-parsing-files",1012423223)], null));
if(cljs.core.seq(parse_errors_65756)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","parse-and-load-error","file/parse-and-load-error",-808105720),repo_url,parse_errors_65756], null));
} else {
}

frontend.state.reset_parsing_state_BANG_();

frontend.state.set_loading_files_BANG_(repo_url,false);

return cljs.core.async.offer_BANG_(graph_added_chan,true);
});
frontend.handler.file_based.repo.parse_files_and_create_default_files_inner_BANG_ = (function frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts){
var supported_files = logseq.graph_parser.filter_files(files);
var delete_data = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(delete_files,delete_blocks));
var indexed_files = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(supported_files);
var chan = cljs.core.async.to_chan_BANG_(indexed_files);
var graph_added_chan = cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0();
var total = cljs.core.count(supported_files);
var large_graph_QMARK_ = (total > (1000));
var _STAR_page_names = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var _STAR_page_name__GT_path = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
if(cljs.core.seq(delete_data)){
frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo_url,delete_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delete-files?","delete-files?",-1341179689),true], null));
} else {
}

frontend.state.set_current_repo_BANG_(repo_url);

frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"total","total",1916810418),cljs.core.count(supported_files)], null));

if(frontend.util.node_test_QMARK_){
var seq__65523_65757 = cljs.core.seq(supported_files);
var chunk__65524_65758 = null;
var count__65525_65759 = (0);
var i__65526_65760 = (0);
while(true){
if((i__65526_65760 < count__65525_65759)){
var file_65761 = chunk__65524_65758.cljs$core$IIndexed$_nth$arity$2(null,i__65526_65760);
frontend.state.set_parsing_state_BANG_(((function (seq__65523_65757,chunk__65524_65758,count__65525_65759,i__65526_65760,file_65761,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path){
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file_65761));
});})(seq__65523_65757,chunk__65524_65758,count__65525_65759,i__65526_65760,file_65761,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path))
);

frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_(repo_url,file_65761,cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)], null)));


var G__65762 = seq__65523_65757;
var G__65763 = chunk__65524_65758;
var G__65764 = count__65525_65759;
var G__65765 = (i__65526_65760 + (1));
seq__65523_65757 = G__65762;
chunk__65524_65758 = G__65763;
count__65525_65759 = G__65764;
i__65526_65760 = G__65765;
continue;
} else {
var temp__5804__auto___65766 = cljs.core.seq(seq__65523_65757);
if(temp__5804__auto___65766){
var seq__65523_65767__$1 = temp__5804__auto___65766;
if(cljs.core.chunked_seq_QMARK_(seq__65523_65767__$1)){
var c__5525__auto___65768 = cljs.core.chunk_first(seq__65523_65767__$1);
var G__65769 = cljs.core.chunk_rest(seq__65523_65767__$1);
var G__65770 = c__5525__auto___65768;
var G__65771 = cljs.core.count(c__5525__auto___65768);
var G__65772 = (0);
seq__65523_65757 = G__65769;
chunk__65524_65758 = G__65770;
count__65525_65759 = G__65771;
i__65526_65760 = G__65772;
continue;
} else {
var file_65773 = cljs.core.first(seq__65523_65767__$1);
frontend.state.set_parsing_state_BANG_(((function (seq__65523_65757,chunk__65524_65758,count__65525_65759,i__65526_65760,file_65773,seq__65523_65767__$1,temp__5804__auto___65766,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path){
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file_65773));
});})(seq__65523_65757,chunk__65524_65758,count__65525_65759,i__65526_65760,file_65773,seq__65523_65767__$1,temp__5804__auto___65766,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path))
);

frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_(repo_url,file_65773,cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)], null)));


var G__65774 = cljs.core.next(seq__65523_65767__$1);
var G__65775 = null;
var G__65776 = (0);
var G__65777 = (0);
seq__65523_65757 = G__65774;
chunk__65524_65758 = G__65775;
count__65525_65759 = G__65776;
i__65526_65760 = G__65777;
continue;
}
} else {
}
}
break;
}

frontend.handler.file_based.repo.after_parse(repo_url,re_render_QMARK_,re_render_opts,opts,graph_added_chan);
} else {
var c__32124__auto___65778 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_65647){
var state_val_65649 = (state_65647[(1)]);
if((state_val_65649 === (7))){
var inst_65630 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
var statearr_65655_65779 = state_65647__$1;
(statearr_65655_65779[(2)] = inst_65630);

(statearr_65655_65779[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (20))){
var inst_65571 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
var statearr_65658_65780 = state_65647__$1;
(statearr_65658_65780[(2)] = inst_65571);

(statearr_65658_65780[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (27))){
var inst_65595 = (state_65647[(7)]);
var inst_65595__$1 = (state_65647[(2)]);
var state_65647__$1 = (function (){var statearr_65659 = state_65647;
(statearr_65659[(7)] = inst_65595__$1);

return statearr_65659;
})();
if(cljs.core.truth_(inst_65595__$1)){
var statearr_65660_65781 = state_65647__$1;
(statearr_65660_65781[(1)] = (28));

} else {
var statearr_65661_65782 = state_65647__$1;
(statearr_65661_65782[(1)] = (29));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (1))){
var state_65647__$1 = state_65647;
var statearr_65665_65783 = state_65647__$1;
(statearr_65665_65783[(2)] = null);

(statearr_65665_65783[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (24))){
var inst_65589 = (state_65647[(8)]);
var inst_65589__$1 = (state_65647[(2)]);
var state_65647__$1 = (function (){var statearr_65666 = state_65647;
(statearr_65666[(8)] = inst_65589__$1);

return statearr_65666;
})();
if(cljs.core.truth_(inst_65589__$1)){
var statearr_65667_65784 = state_65647__$1;
(statearr_65667_65784[(1)] = (25));

} else {
var statearr_65668_65785 = state_65647__$1;
(statearr_65668_65785[(1)] = (26));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (4))){
var inst_65535 = (state_65647[(9)]);
var inst_65535__$1 = (state_65647[(2)]);
var state_65647__$1 = (function (){var statearr_65669 = state_65647;
(statearr_65669[(9)] = inst_65535__$1);

return statearr_65669;
})();
if(cljs.core.truth_(inst_65535__$1)){
var statearr_65670_65786 = state_65647__$1;
(statearr_65670_65786[(1)] = (5));

} else {
var statearr_65671_65787 = state_65647__$1;
(statearr_65671_65787[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (15))){
var inst_65543 = (state_65647[(10)]);
var state_65647__$1 = state_65647;
var statearr_65672_65788 = state_65647__$1;
(statearr_65672_65788[(2)] = inst_65543);

(statearr_65672_65788[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (21))){
var inst_65582 = (state_65647[(11)]);
var inst_65582__$1 = (state_65647[(2)]);
var inst_65583 = cljs.core.coll_QMARK_(inst_65582__$1);
var state_65647__$1 = (function (){var statearr_65673 = state_65647;
(statearr_65673[(11)] = inst_65582__$1);

return statearr_65673;
})();
if(inst_65583){
var statearr_65674_65789 = state_65647__$1;
(statearr_65674_65789[(1)] = (22));

} else {
var statearr_65675_65790 = state_65647__$1;
(statearr_65675_65790[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (31))){
var inst_65595 = (state_65647[(7)]);
var inst_65615 = cljs.core.not(inst_65595);
var state_65647__$1 = state_65647;
var statearr_65676_65791 = state_65647__$1;
(statearr_65676_65791[(2)] = inst_65615);

(statearr_65676_65791[(1)] = (33));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (32))){
var inst_65589 = (state_65647[(8)]);
var state_65647__$1 = state_65647;
var statearr_65677_65792 = state_65647__$1;
(statearr_65677_65792[(2)] = inst_65589);

(statearr_65677_65792[(1)] = (33));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (33))){
var inst_65618 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
if(cljs.core.truth_(inst_65618)){
var statearr_65686_65793 = state_65647__$1;
(statearr_65686_65793[(1)] = (34));

} else {
var statearr_65687_65794 = state_65647__$1;
(statearr_65687_65794[(1)] = (35));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (13))){
var inst_65558 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
var statearr_65689_65795 = state_65647__$1;
(statearr_65689_65795[(2)] = inst_65558);

(statearr_65689_65795[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (22))){
var inst_65540 = (state_65647[(12)]);
var inst_65535 = (state_65647[(9)]);
var inst_65543 = (state_65647[(10)]);
var inst_65560 = (state_65647[(13)]);
var inst_65541 = (state_65647[(14)]);
var inst_65578 = (state_65647[(15)]);
var inst_65582 = (state_65647[(11)]);
var inst_65585 = (function (){var idx = inst_65540;
var temp__5802__auto__ = inst_65535;
var whiteboard_QMARK_ = inst_65543;
var yield_for_ui_QMARK_ = inst_65560;
var vec__65537 = inst_65535;
var file = inst_65541;
var item = inst_65535;
var opts_SINGLEQUOTE_ = inst_65578;
var result = inst_65582;
return (function (x){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(x);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(x)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(x);
} else {
return null;
}
});
})();
var inst_65586 = cljs.core.some(inst_65585,inst_65582);
var state_65647__$1 = state_65647;
var statearr_65693_65796 = state_65647__$1;
(statearr_65693_65796[(2)] = inst_65586);

(statearr_65693_65796[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (36))){
var inst_65625 = (state_65647[(2)]);
var state_65647__$1 = (function (){var statearr_65694 = state_65647;
(statearr_65694[(16)] = inst_65625);

return statearr_65694;
})();
var statearr_65695_65797 = state_65647__$1;
(statearr_65695_65797[(2)] = null);

(statearr_65695_65797[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (29))){
var state_65647__$1 = state_65647;
var statearr_65696_65798 = state_65647__$1;
(statearr_65696_65798[(2)] = null);

(statearr_65696_65798[(1)] = (30));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (6))){
var inst_65628 = frontend.handler.file_based.repo.after_parse(repo_url,re_render_QMARK_,re_render_opts,opts,graph_added_chan);
var state_65647__$1 = state_65647;
var statearr_65697_65799 = state_65647__$1;
(statearr_65697_65799[(2)] = inst_65628);

(statearr_65697_65799[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (28))){
var inst_65541 = (state_65647[(14)]);
var inst_65589 = (state_65647[(8)]);
var inst_65597 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_65598 = [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"clear?","clear?",1363344639)];
var inst_65599 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_65600 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_65541);
var inst_65601 = cljs.core.deref(_STAR_page_name__GT_path);
var inst_65602 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_65601,inst_65589);
var inst_65603 = (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("The file \"%s\" will be skipped because another file \"%s\" has the same page title.",inst_65600,inst_65602) : frontend.util.format.call(null,"The file \"%s\" will be skipped because another file \"%s\" has the same page title.",inst_65600,inst_65602));
var inst_65604 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_65603];
var inst_65605 = (new cljs.core.PersistentVector(null,2,(5),inst_65599,inst_65604,null));
var inst_65606 = [inst_65605,new cljs.core.Keyword(null,"warning","warning",-1685650671),false];
var inst_65607 = cljs.core.PersistentHashMap.fromArrays(inst_65598,inst_65606);
var inst_65608 = [new cljs.core.Keyword("notification","show","notification/show",1864741804),inst_65607];
var inst_65609 = (new cljs.core.PersistentVector(null,2,(5),inst_65597,inst_65608,null));
var inst_65610 = frontend.state.pub_event_BANG_(inst_65609);
var state_65647__$1 = state_65647;
var statearr_65698_65803 = state_65647__$1;
(statearr_65698_65803[(2)] = inst_65610);

(statearr_65698_65803[(1)] = (30));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (25))){
var inst_65589 = (state_65647[(8)]);
var inst_65591 = cljs.core.deref(_STAR_page_names);
var inst_65592 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_65591,inst_65589);
var state_65647__$1 = state_65647;
var statearr_65699_65804 = state_65647__$1;
(statearr_65699_65804[(2)] = inst_65592);

(statearr_65699_65804[(1)] = (27));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (34))){
var inst_65589 = (state_65647[(8)]);
var inst_65541 = (state_65647[(14)]);
var inst_65620 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_page_names,cljs.core.conj,inst_65589);
var inst_65621 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_65541);
var inst_65622 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_page_name__GT_path,cljs.core.assoc,inst_65589,inst_65621);
var state_65647__$1 = (function (){var statearr_65700 = state_65647;
(statearr_65700[(17)] = inst_65620);

return statearr_65700;
})();
var statearr_65701_65805 = state_65647__$1;
(statearr_65701_65805[(2)] = inst_65622);

(statearr_65701_65805[(1)] = (36));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (17))){
var inst_65569 = cljs.core.async.timeout((1));
var state_65647__$1 = state_65647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_65647__$1,(20),inst_65569);
} else {
if((state_val_65649 === (3))){
var inst_65632 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
return cljs.core.async.impl.ioc_helpers.return_chan(state_65647__$1,inst_65632);
} else {
if((state_val_65649 === (12))){
var inst_65540 = (state_65647[(12)]);
var inst_65552 = (state_65647[(18)]);
var inst_65551 = (total - inst_65540);
var inst_65552__$1 = (inst_65551 <= (10));
var state_65647__$1 = (function (){var statearr_65703 = state_65647;
(statearr_65703[(18)] = inst_65552__$1);

return statearr_65703;
})();
if(cljs.core.truth_(inst_65552__$1)){
var statearr_65704_65806 = state_65647__$1;
(statearr_65704_65806[(1)] = (14));

} else {
var statearr_65705_65807 = state_65647__$1;
(statearr_65705_65807[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (2))){
var state_65647__$1 = state_65647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_65647__$1,(4),chan);
} else {
if((state_val_65649 === (23))){
var state_65647__$1 = state_65647;
var statearr_65706_65808 = state_65647__$1;
(statearr_65706_65808[(2)] = null);

(statearr_65706_65808[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (35))){
var state_65647__$1 = state_65647;
var statearr_65707_65809 = state_65647__$1;
(statearr_65707_65809[(2)] = null);

(statearr_65707_65809[(1)] = (36));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (19))){
var inst_65541 = (state_65647[(14)]);
var inst_65578 = (state_65647[(15)]);
var inst_65574 = (state_65647[(2)]);
var inst_65575 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_65576 = [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)];
var inst_65577 = (new cljs.core.PersistentVector(null,2,(5),inst_65575,inst_65576,null));
var inst_65578__$1 = cljs.core.select_keys(opts,inst_65577);
var inst_65579 = frontend.handler.file_based.repo.parse_and_load_file_BANG_(repo_url,inst_65541,inst_65578__$1);
var inst_65580 = cljs.core.async.interop.p__GT_c(inst_65579);
var state_65647__$1 = (function (){var statearr_65708 = state_65647;
(statearr_65708[(19)] = inst_65574);

(statearr_65708[(15)] = inst_65578__$1);

return statearr_65708;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_65647__$1,(21),inst_65580);
} else {
if((state_val_65649 === (11))){
var inst_65548 = (state_65647[(20)]);
var state_65647__$1 = state_65647;
var statearr_65709_65810 = state_65647__$1;
(statearr_65709_65810[(2)] = inst_65548);

(statearr_65709_65810[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (9))){
var inst_65540 = (state_65647[(12)]);
var inst_65548 = (state_65647[(20)]);
var inst_65547 = cljs.core.rem(inst_65540,(10));
var inst_65548__$1 = (inst_65547 === (0));
var state_65647__$1 = (function (){var statearr_65710 = state_65647;
(statearr_65710[(20)] = inst_65548__$1);

return statearr_65710;
})();
if(cljs.core.truth_(inst_65548__$1)){
var statearr_65711_65811 = state_65647__$1;
(statearr_65711_65811[(1)] = (11));

} else {
var statearr_65712_65812 = state_65647__$1;
(statearr_65712_65812[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (5))){
var inst_65535 = (state_65647[(9)]);
var inst_65541 = (state_65647[(14)]);
var inst_65544 = (state_65647[(21)]);
var inst_65540 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_65535,(0),null);
var inst_65541__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_65535,(1),null);
var inst_65542 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_65541__$1);
var inst_65543 = logseq.common.config.whiteboard_QMARK_(inst_65542);
var inst_65544__$1 = (!(large_graph_QMARK_));
var state_65647__$1 = (function (){var statearr_65713 = state_65647;
(statearr_65713[(12)] = inst_65540);

(statearr_65713[(14)] = inst_65541__$1);

(statearr_65713[(10)] = inst_65543);

(statearr_65713[(21)] = inst_65544__$1);

return statearr_65713;
})();
if(inst_65544__$1){
var statearr_65721_65813 = state_65647__$1;
(statearr_65721_65813[(1)] = (8));

} else {
var statearr_65722_65814 = state_65647__$1;
(statearr_65722_65814[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (14))){
var inst_65552 = (state_65647[(18)]);
var state_65647__$1 = state_65647;
var statearr_65723_65815 = state_65647__$1;
(statearr_65723_65815[(2)] = inst_65552);

(statearr_65723_65815[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (26))){
var inst_65589 = (state_65647[(8)]);
var state_65647__$1 = state_65647;
var statearr_65724_65816 = state_65647__$1;
(statearr_65724_65816[(2)] = inst_65589);

(statearr_65724_65816[(1)] = (27));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (16))){
var inst_65556 = (state_65647[(2)]);
var state_65647__$1 = state_65647;
var statearr_65725_65817 = state_65647__$1;
(statearr_65725_65817[(2)] = inst_65556);

(statearr_65725_65817[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (30))){
var inst_65589 = (state_65647[(8)]);
var inst_65613 = (state_65647[(2)]);
var state_65647__$1 = (function (){var statearr_65726 = state_65647;
(statearr_65726[(22)] = inst_65613);

return statearr_65726;
})();
if(cljs.core.truth_(inst_65589)){
var statearr_65727_65818 = state_65647__$1;
(statearr_65727_65818[(1)] = (31));

} else {
var statearr_65728_65819 = state_65647__$1;
(statearr_65728_65819[(1)] = (32));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (10))){
var inst_65535 = (state_65647[(9)]);
var inst_65540 = (state_65647[(12)]);
var inst_65541 = (state_65647[(14)]);
var inst_65543 = (state_65647[(10)]);
var inst_65560 = (state_65647[(13)]);
var inst_65560__$1 = (state_65647[(2)]);
var inst_65566 = (function (){var temp__5802__auto__ = inst_65535;
var item = inst_65535;
var vec__65537 = inst_65535;
var idx = inst_65540;
var file = inst_65541;
var whiteboard_QMARK_ = inst_65543;
var yield_for_ui_QMARK_ = inst_65560__$1;
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file));
});
})();
var inst_65567 = frontend.state.set_parsing_state_BANG_(inst_65566);
var state_65647__$1 = (function (){var statearr_65729 = state_65647;
(statearr_65729[(13)] = inst_65560__$1);

(statearr_65729[(23)] = inst_65567);

return statearr_65729;
})();
if(cljs.core.truth_(inst_65560__$1)){
var statearr_65733_65820 = state_65647__$1;
(statearr_65733_65820[(1)] = (17));

} else {
var statearr_65734_65821 = state_65647__$1;
(statearr_65734_65821[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (18))){
var state_65647__$1 = state_65647;
var statearr_65735_65822 = state_65647__$1;
(statearr_65735_65822[(2)] = null);

(statearr_65735_65822[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_65649 === (8))){
var inst_65544 = (state_65647[(21)]);
var state_65647__$1 = state_65647;
var statearr_65736_65824 = state_65647__$1;
(statearr_65736_65824[(2)] = inst_65544);

(statearr_65736_65824[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__ = null;
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_65737 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_65737[(0)] = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__);

(statearr_65737[(1)] = (1));

return statearr_65737;
});
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____1 = (function (state_65647){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_65647);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e65738){var ex__32054__auto__ = e65738;
var statearr_65739_65825 = state_65647;
(statearr_65739_65825[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_65647[(4)]))){
var statearr_65740_65826 = state_65647;
(statearr_65740_65826[(1)] = cljs.core.first((state_65647[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__65827 = state_65647;
state_65647 = G__65827;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__ = function(state_65647){
switch(arguments.length){
case 0:
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____1.call(this,state_65647);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____0;
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto____1;
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_65741 = f__32125__auto__();
(statearr_65741[(6)] = c__32124__auto___65778);

return statearr_65741;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

}

return graph_added_chan;
});
frontend.handler.file_based.repo.parse_files_and_create_default_files_BANG_ = (function frontend$handler$file_based$repo$parse_files_and_create_default_files_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts){
return frontend.handler.file_based.repo.parse_files_and_create_default_files_inner_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts);
});
frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_ = (function frontend$handler$file_based$repo$parse_files_and_load_to_db_BANG_(repo_url,files,p__65743){
var map__65744 = p__65743;
var map__65744__$1 = cljs.core.__destructure_map(map__65744);
var opts = map__65744__$1;
var delete_files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65744__$1,new cljs.core.Keyword(null,"delete-files","delete-files",-1930731439));
var delete_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65744__$1,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596));
var re_render_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__65744__$1,new cljs.core.Keyword(null,"re-render?","re-render?",-1390644928),true);
var re_render_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65744__$1,new cljs.core.Keyword(null,"re-render-opts","re-render-opts",-832360338));
var _refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65744__$1,new cljs.core.Keyword(null,"_refresh?","_refresh?",677352006));
return frontend.handler.file_based.repo.parse_files_and_create_default_files_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts);
});
/**
 * load graph files to db.
 */
frontend.handler.file_based.repo.load_new_repo_to_db_BANG_ = (function frontend$handler$file_based$repo$load_new_repo_to_db_BANG_(repo_url,p__65746){
var map__65747 = p__65746;
var map__65747__$1 = cljs.core.__destructure_map(map__65747);
var file_objs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65747__$1,new cljs.core.Keyword(null,"file-objs","file-objs",545613385));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65747__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65747__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.handler.file-based.repo","load-new-repo","frontend.handler.file-based.repo/load-new-repo",534665435),repo_url,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_], 0));

frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541),true], null));

var config = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var G__65749 = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__65745_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq/config.edn",new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__65745_SHARP_));
}),file_objs));
if((G__65749 == null)){
return null;
} else {
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(G__65749);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var content = temp__5804__auto__;
return frontend.handler.repo_config.read_repo_config(content);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo_url);
}
})();
var _ = frontend.state.set_config_BANG_(repo_url,config);
var file_objs__$1 = logseq.common.config.remove_hidden_files(file_objs,config,new cljs.core.Keyword("file","path","file/path",-191335748));
return frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_(repo_url,file_objs__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_], null));
});
frontend.handler.file_based.repo.load_repo_to_db_BANG_ = (function frontend$handler$file_based$repo$load_repo_to_db_BANG_(repo_url,p__65751){
var map__65752 = p__65751;
var map__65752__$1 = cljs.core.__destructure_map(map__65752);
var diffs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65752__$1,new cljs.core.Keyword(null,"diffs","diffs",-1720136241));
var file_objs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65752__$1,new cljs.core.Keyword(null,"file-objs","file-objs",545613385));
var refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65752__$1,new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65752__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65752__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.handler.file-based.repo","load-repo-to-db!","frontend.handler.file-based.repo/load-repo-to-db!",1635766816),repo_url], 0));

frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541),true], null));

var config = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var G__65753 = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__65750_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.config.get_repo_config_path(),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__65750_SHARP_));
}),file_objs));
if((G__65753 == null)){
return null;
} else {
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(G__65753);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var content = temp__5804__auto__;
return frontend.handler.repo_config.read_repo_config(content);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_config.cljs$core$IFn$_invoke$arity$1(repo_url);
}
})();
var _ = frontend.state.set_config_BANG_(repo_url,config);
var nfs_files = logseq.common.config.remove_hidden_files(file_objs,config,new cljs.core.Keyword("file","node-node-path","file/node-node-path",-146810932));
var diffs__$1 = logseq.common.config.remove_hidden_files(diffs,config,new cljs.core.Keyword(null,"path","path",-188191168));
var load_contents = (function (files,option){
return frontend.handler.file_based.file.load_files_contents_BANG_(repo_url,files,(function (files_contents){
return frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_(repo_url,files_contents,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570),refresh_QMARK_));
}));
});
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(cljs.core.seq(diffs__$1));
if(and__5000__auto__){
return nfs_files;
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_(repo_url,nfs_files,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_], null));
} else {
if(cljs.core.seq(diffs__$1)){
var filter_diffs = (function (type){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (f){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(f));
}),diffs__$1));
});
var remove_files = filter_diffs("remove");
var modify_files = filter_diffs("modify");
var add_files = filter_diffs("add");
var delete_files = ((cljs.core.seq(remove_files))?(frontend.db.delete_files.cljs$core$IFn$_invoke$arity$1 ? frontend.db.delete_files.cljs$core$IFn$_invoke$arity$1(remove_files) : frontend.db.delete_files.call(null,remove_files)):null);
var delete_blocks = frontend.db.file_based.model.delete_blocks(repo_url,remove_files,true);
var delete_blocks__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(delete_blocks,frontend.db.file_based.model.delete_blocks(repo_url,modify_files,false)));
var delete_pages = ((cljs.core.seq(remove_files))?frontend.db.file_based.model.delete_pages_by_files(remove_files):cljs.core.PersistentVector.EMPTY);
var add_or_modify_files = (function (){var G__65754 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(modify_files,add_files);
if((G__65754 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__65754);
}
})();
var options = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"delete-files","delete-files",-1930731439),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(delete_files,delete_pages),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),delete_blocks__$1,new cljs.core.Keyword(null,"re-render?","re-render?",-1390644928),true], null);
if(cljs.core.seq(nfs_files)){
return frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_(repo_url,nfs_files,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570),refresh_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"re-render-opts","re-render-opts",-832360338),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"clear-all-query-state?","clear-all-query-state?",-289780993),true], null)], 0)));
} else {
return load_contents(add_or_modify_files,options);
}
} else {
return null;
}

}
});

//# sourceMappingURL=frontend.handler.file_based.repo.js.map
