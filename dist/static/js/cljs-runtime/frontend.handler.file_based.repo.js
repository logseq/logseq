goog.provide('frontend.handler.file_based.repo');
frontend.handler.file_based.repo.create_contents_file = (function frontend$handler$file_based$repo$create_contents_file(repo_url){
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo_url)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_pages_directory()),(function (pages_dir){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__104800_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pages_dir),"/contents.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__104800_SHARP_)].join('');
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["org","md"], null))),(function (p__104802){
var vec__104803 = p__104802;
var org_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104803,(0),null);
var md_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104803,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (p1__104801_SHARP_){
return frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,p1__104801_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [org_path,md_path], null))),(function (contents_file_exist_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(contents_file_exist_QMARK_)?null:(function (){var format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var file_rpath = ["pages/","contents.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_file_extension(format))].join('');
var default_content = (function (){var G__104806 = cljs.core.name(format);
switch (G__104806) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(dir)),(function (_){
return promesa.protocols._promise((function (){var default_content = frontend.config.config_default_content;
var path = [app_dir,"/",frontend.config.config_file].join('');
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name], 0)))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.app_name,frontend.config.recycle_dir], 0)))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.config.get_journals_directory()], 0)))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_config_file_if_not_exists(repo_url)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_contents_file(repo_url)),(function (___41611__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.repo.create_custom_theme(repo_url)),(function (___41611__auto____$5){
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
frontend.handler.file_based.repo.parse_and_load_file_BANG_ = (function frontend$handler$file_based$repo$parse_and_load_file_BANG_(repo_url,file,p__104822){
var map__104823 = p__104822;
var map__104823__$1 = cljs.core.__destructure_map(map__104823);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104823__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104823__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.file_based.file.alter_file(repo_url,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0)))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}))),(function (___41611__auto__){
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
frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_ = (function frontend$handler$file_based$repo$parse_and_load_file_test_version_BANG_(repo_url,file,p__104824){
var map__104825 = p__104824;
var map__104825__$1 = cljs.core.__destructure_map(map__104825);
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104825__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var verbose = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104825__$1,new cljs.core.Keyword(null,"verbose","verbose",1694226060));
try{var result = frontend.handler.file_based.file.alter_file_test_version(repo_url,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(file),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stat","stat",-1370599836).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_,new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),false,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161),true], null),(((!((verbose == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"verbose","verbose",1694226060),verbose], null):null)], 0)));
frontend.state.set_parsing_state_BANG_((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"finished","finished",-1018867731),cljs.core.inc);
}));

return result;
}catch (e104826){var e = e104826;
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

var parse_errors_105150 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),repo_url,new cljs.core.Keyword(null,"failed-parsing-files","failed-parsing-files",1012423223)], null));
if(cljs.core.seq(parse_errors_105150)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","parse-and-load-error","file/parse-and-load-error",-808105720),repo_url,parse_errors_105150], null));
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
var seq__104832_105152 = cljs.core.seq(supported_files);
var chunk__104833_105153 = null;
var count__104834_105154 = (0);
var i__104835_105155 = (0);
while(true){
if((i__104835_105155 < count__104834_105154)){
var file_105156 = chunk__104833_105153.cljs$core$IIndexed$_nth$arity$2(null,i__104835_105155);
frontend.state.set_parsing_state_BANG_(((function (seq__104832_105152,chunk__104833_105153,count__104834_105154,i__104835_105155,file_105156,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path){
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file_105156));
});})(seq__104832_105152,chunk__104833_105153,count__104834_105154,i__104835_105155,file_105156,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path))
);

frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_(repo_url,file_105156,cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)], null)));


var G__105157 = seq__104832_105152;
var G__105158 = chunk__104833_105153;
var G__105159 = count__104834_105154;
var G__105160 = (i__104835_105155 + (1));
seq__104832_105152 = G__105157;
chunk__104833_105153 = G__105158;
count__104834_105154 = G__105159;
i__104835_105155 = G__105160;
continue;
} else {
var temp__5804__auto___105161 = cljs.core.seq(seq__104832_105152);
if(temp__5804__auto___105161){
var seq__104832_105162__$1 = temp__5804__auto___105161;
if(cljs.core.chunked_seq_QMARK_(seq__104832_105162__$1)){
var c__5525__auto___105163 = cljs.core.chunk_first(seq__104832_105162__$1);
var G__105164 = cljs.core.chunk_rest(seq__104832_105162__$1);
var G__105165 = c__5525__auto___105163;
var G__105166 = cljs.core.count(c__5525__auto___105163);
var G__105167 = (0);
seq__104832_105152 = G__105164;
chunk__104833_105153 = G__105165;
count__104834_105154 = G__105166;
i__104835_105155 = G__105167;
continue;
} else {
var file_105168 = cljs.core.first(seq__104832_105162__$1);
frontend.state.set_parsing_state_BANG_(((function (seq__104832_105152,chunk__104833_105153,count__104834_105154,i__104835_105155,file_105168,seq__104832_105162__$1,temp__5804__auto___105161,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path){
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file_105168));
});})(seq__104832_105152,chunk__104833_105153,count__104834_105154,i__104835_105155,file_105168,seq__104832_105162__$1,temp__5804__auto___105161,supported_files,delete_data,indexed_files,chan,graph_added_chan,total,large_graph_QMARK_,_STAR_page_names,_STAR_page_name__GT_path))
);

frontend.handler.file_based.repo.parse_and_load_file_test_version_BANG_(repo_url,file_105168,cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)], null)));


var G__105169 = cljs.core.next(seq__104832_105162__$1);
var G__105170 = null;
var G__105171 = (0);
var G__105172 = (0);
seq__104832_105152 = G__105169;
chunk__104833_105153 = G__105170;
count__104834_105154 = G__105171;
i__104835_105155 = G__105172;
continue;
}
} else {
}
}
break;
}

frontend.handler.file_based.repo.after_parse(repo_url,re_render_QMARK_,re_render_opts,opts,graph_added_chan);
} else {
var c__32195__auto___105173 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_104985){
var state_val_104986 = (state_104985[(1)]);
if((state_val_104986 === (7))){
var inst_104981 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
var statearr_105026_105174 = state_104985__$1;
(statearr_105026_105174[(2)] = inst_104981);

(statearr_105026_105174[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (20))){
var inst_104871 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
var statearr_105027_105176 = state_104985__$1;
(statearr_105027_105176[(2)] = inst_104871);

(statearr_105027_105176[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (27))){
var inst_104943 = (state_104985[(7)]);
var inst_104943__$1 = (state_104985[(2)]);
var state_104985__$1 = (function (){var statearr_105028 = state_104985;
(statearr_105028[(7)] = inst_104943__$1);

return statearr_105028;
})();
if(cljs.core.truth_(inst_104943__$1)){
var statearr_105029_105177 = state_104985__$1;
(statearr_105029_105177[(1)] = (28));

} else {
var statearr_105030_105178 = state_104985__$1;
(statearr_105030_105178[(1)] = (29));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (1))){
var state_104985__$1 = state_104985;
var statearr_105031_105179 = state_104985__$1;
(statearr_105031_105179[(2)] = null);

(statearr_105031_105179[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (24))){
var inst_104934 = (state_104985[(8)]);
var inst_104934__$1 = (state_104985[(2)]);
var state_104985__$1 = (function (){var statearr_105032 = state_104985;
(statearr_105032[(8)] = inst_104934__$1);

return statearr_105032;
})();
if(cljs.core.truth_(inst_104934__$1)){
var statearr_105033_105180 = state_104985__$1;
(statearr_105033_105180[(1)] = (25));

} else {
var statearr_105034_105181 = state_104985__$1;
(statearr_105034_105181[(1)] = (26));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (4))){
var inst_104839 = (state_104985[(9)]);
var inst_104839__$1 = (state_104985[(2)]);
var state_104985__$1 = (function (){var statearr_105035 = state_104985;
(statearr_105035[(9)] = inst_104839__$1);

return statearr_105035;
})();
if(cljs.core.truth_(inst_104839__$1)){
var statearr_105039_105182 = state_104985__$1;
(statearr_105039_105182[(1)] = (5));

} else {
var statearr_105040_105183 = state_104985__$1;
(statearr_105040_105183[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (15))){
var inst_104847 = (state_104985[(10)]);
var state_104985__$1 = state_104985;
var statearr_105041_105184 = state_104985__$1;
(statearr_105041_105184[(2)] = inst_104847);

(statearr_105041_105184[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (21))){
var inst_104924 = (state_104985[(11)]);
var inst_104924__$1 = (state_104985[(2)]);
var inst_104925 = cljs.core.coll_QMARK_(inst_104924__$1);
var state_104985__$1 = (function (){var statearr_105042 = state_104985;
(statearr_105042[(11)] = inst_104924__$1);

return statearr_105042;
})();
if(inst_104925){
var statearr_105043_105185 = state_104985__$1;
(statearr_105043_105185[(1)] = (22));

} else {
var statearr_105044_105186 = state_104985__$1;
(statearr_105044_105186[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (31))){
var inst_104943 = (state_104985[(7)]);
var inst_104966 = cljs.core.not(inst_104943);
var state_104985__$1 = state_104985;
var statearr_105045_105187 = state_104985__$1;
(statearr_105045_105187[(2)] = inst_104966);

(statearr_105045_105187[(1)] = (33));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (32))){
var inst_104934 = (state_104985[(8)]);
var state_104985__$1 = state_104985;
var statearr_105046_105188 = state_104985__$1;
(statearr_105046_105188[(2)] = inst_104934);

(statearr_105046_105188[(1)] = (33));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (33))){
var inst_104969 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
if(cljs.core.truth_(inst_104969)){
var statearr_105047_105189 = state_104985__$1;
(statearr_105047_105189[(1)] = (34));

} else {
var statearr_105048_105190 = state_104985__$1;
(statearr_105048_105190[(1)] = (35));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (13))){
var inst_104862 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
var statearr_105049_105193 = state_104985__$1;
(statearr_105049_105193[(2)] = inst_104862);

(statearr_105049_105193[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (22))){
var inst_104844 = (state_104985[(12)]);
var inst_104839 = (state_104985[(9)]);
var inst_104847 = (state_104985[(10)]);
var inst_104864 = (state_104985[(13)]);
var inst_104845 = (state_104985[(14)]);
var inst_104890 = (state_104985[(15)]);
var inst_104924 = (state_104985[(11)]);
var inst_104930 = (function (){var idx = inst_104844;
var temp__5802__auto__ = inst_104839;
var whiteboard_QMARK_ = inst_104847;
var yield_for_ui_QMARK_ = inst_104864;
var file = inst_104845;
var item = inst_104839;
var opts_SINGLEQUOTE_ = inst_104890;
var vec__104841 = inst_104839;
var result = inst_104924;
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
var inst_104931 = cljs.core.some(inst_104930,inst_104924);
var state_104985__$1 = state_104985;
var statearr_105052_105195 = state_104985__$1;
(statearr_105052_105195[(2)] = inst_104931);

(statearr_105052_105195[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (36))){
var inst_104976 = (state_104985[(2)]);
var state_104985__$1 = (function (){var statearr_105053 = state_104985;
(statearr_105053[(16)] = inst_104976);

return statearr_105053;
})();
var statearr_105054_105196 = state_104985__$1;
(statearr_105054_105196[(2)] = null);

(statearr_105054_105196[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (29))){
var state_104985__$1 = state_104985;
var statearr_105055_105197 = state_104985__$1;
(statearr_105055_105197[(2)] = null);

(statearr_105055_105197[(1)] = (30));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (6))){
var inst_104979 = frontend.handler.file_based.repo.after_parse(repo_url,re_render_QMARK_,re_render_opts,opts,graph_added_chan);
var state_104985__$1 = state_104985;
var statearr_105056_105198 = state_104985__$1;
(statearr_105056_105198[(2)] = inst_104979);

(statearr_105056_105198[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (28))){
var inst_104845 = (state_104985[(14)]);
var inst_104934 = (state_104985[(8)]);
var inst_104945 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_104946 = [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"clear?","clear?",1363344639)];
var inst_104950 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_104951 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_104845);
var inst_104952 = cljs.core.deref(_STAR_page_name__GT_path);
var inst_104953 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_104952,inst_104934);
var inst_104954 = (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("The file \"%s\" will be skipped because another file \"%s\" has the same page title.",inst_104951,inst_104953) : frontend.util.format.call(null,"The file \"%s\" will be skipped because another file \"%s\" has the same page title.",inst_104951,inst_104953));
var inst_104955 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_104954];
var inst_104956 = (new cljs.core.PersistentVector(null,2,(5),inst_104950,inst_104955,null));
var inst_104957 = [inst_104956,new cljs.core.Keyword(null,"warning","warning",-1685650671),false];
var inst_104958 = cljs.core.PersistentHashMap.fromArrays(inst_104946,inst_104957);
var inst_104959 = [new cljs.core.Keyword("notification","show","notification/show",1864741804),inst_104958];
var inst_104960 = (new cljs.core.PersistentVector(null,2,(5),inst_104945,inst_104959,null));
var inst_104961 = frontend.state.pub_event_BANG_(inst_104960);
var state_104985__$1 = state_104985;
var statearr_105063_105199 = state_104985__$1;
(statearr_105063_105199[(2)] = inst_104961);

(statearr_105063_105199[(1)] = (30));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (25))){
var inst_104934 = (state_104985[(8)]);
var inst_104939 = cljs.core.deref(_STAR_page_names);
var inst_104940 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_104939,inst_104934);
var state_104985__$1 = state_104985;
var statearr_105064_105200 = state_104985__$1;
(statearr_105064_105200[(2)] = inst_104940);

(statearr_105064_105200[(1)] = (27));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (34))){
var inst_104934 = (state_104985[(8)]);
var inst_104845 = (state_104985[(14)]);
var inst_104971 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_page_names,cljs.core.conj,inst_104934);
var inst_104972 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_104845);
var inst_104973 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_page_name__GT_path,cljs.core.assoc,inst_104934,inst_104972);
var state_104985__$1 = (function (){var statearr_105072 = state_104985;
(statearr_105072[(17)] = inst_104971);

return statearr_105072;
})();
var statearr_105073_105201 = state_104985__$1;
(statearr_105073_105201[(2)] = inst_104973);

(statearr_105073_105201[(1)] = (36));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (17))){
var inst_104869 = cljs.core.async.timeout((1));
var state_104985__$1 = state_104985;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_104985__$1,(20),inst_104869);
} else {
if((state_val_104986 === (3))){
var inst_104983 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
return cljs.core.async.impl.ioc_helpers.return_chan(state_104985__$1,inst_104983);
} else {
if((state_val_104986 === (12))){
var inst_104844 = (state_104985[(12)]);
var inst_104856 = (state_104985[(18)]);
var inst_104855 = (total - inst_104844);
var inst_104856__$1 = (inst_104855 <= (10));
var state_104985__$1 = (function (){var statearr_105074 = state_104985;
(statearr_105074[(18)] = inst_104856__$1);

return statearr_105074;
})();
if(cljs.core.truth_(inst_104856__$1)){
var statearr_105075_105206 = state_104985__$1;
(statearr_105075_105206[(1)] = (14));

} else {
var statearr_105076_105207 = state_104985__$1;
(statearr_105076_105207[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (2))){
var state_104985__$1 = state_104985;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_104985__$1,(4),chan);
} else {
if((state_val_104986 === (23))){
var state_104985__$1 = state_104985;
var statearr_105077_105208 = state_104985__$1;
(statearr_105077_105208[(2)] = null);

(statearr_105077_105208[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (35))){
var state_104985__$1 = state_104985;
var statearr_105078_105209 = state_104985__$1;
(statearr_105078_105209[(2)] = null);

(statearr_105078_105209[(1)] = (36));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (19))){
var inst_104845 = (state_104985[(14)]);
var inst_104890 = (state_104985[(15)]);
var inst_104874 = (state_104985[(2)]);
var inst_104887 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_104888 = [new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new cljs.core.Keyword(null,"verbose","verbose",1694226060)];
var inst_104889 = (new cljs.core.PersistentVector(null,2,(5),inst_104887,inst_104888,null));
var inst_104890__$1 = cljs.core.select_keys(opts,inst_104889);
var inst_104891 = frontend.handler.file_based.repo.parse_and_load_file_BANG_(repo_url,inst_104845,inst_104890__$1);
var inst_104892 = cljs.core.async.interop.p__GT_c(inst_104891);
var state_104985__$1 = (function (){var statearr_105082 = state_104985;
(statearr_105082[(19)] = inst_104874);

(statearr_105082[(15)] = inst_104890__$1);

return statearr_105082;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_104985__$1,(21),inst_104892);
} else {
if((state_val_104986 === (11))){
var inst_104852 = (state_104985[(20)]);
var state_104985__$1 = state_104985;
var statearr_105083_105210 = state_104985__$1;
(statearr_105083_105210[(2)] = inst_104852);

(statearr_105083_105210[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (9))){
var inst_104844 = (state_104985[(12)]);
var inst_104852 = (state_104985[(20)]);
var inst_104851 = cljs.core.rem(inst_104844,(10));
var inst_104852__$1 = (inst_104851 === (0));
var state_104985__$1 = (function (){var statearr_105084 = state_104985;
(statearr_105084[(20)] = inst_104852__$1);

return statearr_105084;
})();
if(cljs.core.truth_(inst_104852__$1)){
var statearr_105085_105211 = state_104985__$1;
(statearr_105085_105211[(1)] = (11));

} else {
var statearr_105086_105212 = state_104985__$1;
(statearr_105086_105212[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (5))){
var inst_104839 = (state_104985[(9)]);
var inst_104845 = (state_104985[(14)]);
var inst_104848 = (state_104985[(21)]);
var inst_104844 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_104839,(0),null);
var inst_104845__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_104839,(1),null);
var inst_104846 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_104845__$1);
var inst_104847 = logseq.common.config.whiteboard_QMARK_(inst_104846);
var inst_104848__$1 = (!(large_graph_QMARK_));
var state_104985__$1 = (function (){var statearr_105087 = state_104985;
(statearr_105087[(12)] = inst_104844);

(statearr_105087[(14)] = inst_104845__$1);

(statearr_105087[(10)] = inst_104847);

(statearr_105087[(21)] = inst_104848__$1);

return statearr_105087;
})();
if(inst_104848__$1){
var statearr_105088_105213 = state_104985__$1;
(statearr_105088_105213[(1)] = (8));

} else {
var statearr_105089_105214 = state_104985__$1;
(statearr_105089_105214[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (14))){
var inst_104856 = (state_104985[(18)]);
var state_104985__$1 = state_104985;
var statearr_105090_105215 = state_104985__$1;
(statearr_105090_105215[(2)] = inst_104856);

(statearr_105090_105215[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (26))){
var inst_104934 = (state_104985[(8)]);
var state_104985__$1 = state_104985;
var statearr_105091_105216 = state_104985__$1;
(statearr_105091_105216[(2)] = inst_104934);

(statearr_105091_105216[(1)] = (27));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (16))){
var inst_104860 = (state_104985[(2)]);
var state_104985__$1 = state_104985;
var statearr_105092_105217 = state_104985__$1;
(statearr_105092_105217[(2)] = inst_104860);

(statearr_105092_105217[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (30))){
var inst_104934 = (state_104985[(8)]);
var inst_104964 = (state_104985[(2)]);
var state_104985__$1 = (function (){var statearr_105093 = state_104985;
(statearr_105093[(22)] = inst_104964);

return statearr_105093;
})();
if(cljs.core.truth_(inst_104934)){
var statearr_105094_105218 = state_104985__$1;
(statearr_105094_105218[(1)] = (31));

} else {
var statearr_105095_105219 = state_104985__$1;
(statearr_105095_105219[(1)] = (32));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (10))){
var inst_104839 = (state_104985[(9)]);
var inst_104844 = (state_104985[(12)]);
var inst_104845 = (state_104985[(14)]);
var inst_104847 = (state_104985[(10)]);
var inst_104864 = (state_104985[(13)]);
var inst_104864__$1 = (state_104985[(2)]);
var inst_104866 = (function (){var temp__5802__auto__ = inst_104839;
var item = inst_104839;
var vec__104841 = inst_104839;
var idx = inst_104844;
var file = inst_104845;
var whiteboard_QMARK_ = inst_104847;
var yield_for_ui_QMARK_ = inst_104864__$1;
return (function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file));
});
})();
var inst_104867 = frontend.state.set_parsing_state_BANG_(inst_104866);
var state_104985__$1 = (function (){var statearr_105096 = state_104985;
(statearr_105096[(13)] = inst_104864__$1);

(statearr_105096[(23)] = inst_104867);

return statearr_105096;
})();
if(cljs.core.truth_(inst_104864__$1)){
var statearr_105097_105220 = state_104985__$1;
(statearr_105097_105220[(1)] = (17));

} else {
var statearr_105098_105221 = state_104985__$1;
(statearr_105098_105221[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (18))){
var state_104985__$1 = state_104985;
var statearr_105099_105222 = state_104985__$1;
(statearr_105099_105222[(2)] = null);

(statearr_105099_105222[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_104986 === (8))){
var inst_104848 = (state_104985[(21)]);
var state_104985__$1 = state_104985;
var statearr_105100_105223 = state_104985__$1;
(statearr_105100_105223[(2)] = inst_104848);

(statearr_105100_105223[(1)] = (10));


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
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_105103 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_105103[(0)] = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__);

(statearr_105103[(1)] = (1));

return statearr_105103;
});
var frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____1 = (function (state_104985){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_104985);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e105104){var ex__32007__auto__ = e105104;
var statearr_105105_105224 = state_104985;
(statearr_105105_105224[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_104985[(4)]))){
var statearr_105106_105225 = state_104985;
(statearr_105106_105225[(1)] = cljs.core.first((state_104985[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__105226 = state_104985;
state_104985 = G__105226;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__ = function(state_104985){
switch(arguments.length){
case 0:
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____1.call(this,state_104985);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____0;
frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto____1;
return frontend$handler$file_based$repo$parse_files_and_create_default_files_inner_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_105107 = f__32196__auto__();
(statearr_105107[(6)] = c__32195__auto___105173);

return statearr_105107;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

}

return graph_added_chan;
});
frontend.handler.file_based.repo.parse_files_and_create_default_files_BANG_ = (function frontend$handler$file_based$repo$parse_files_and_create_default_files_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts){
return frontend.handler.file_based.repo.parse_files_and_create_default_files_inner_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts);
});
frontend.handler.file_based.repo.parse_files_and_load_to_db_BANG_ = (function frontend$handler$file_based$repo$parse_files_and_load_to_db_BANG_(repo_url,files,p__105121){
var map__105122 = p__105121;
var map__105122__$1 = cljs.core.__destructure_map(map__105122);
var opts = map__105122__$1;
var delete_files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105122__$1,new cljs.core.Keyword(null,"delete-files","delete-files",-1930731439));
var delete_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105122__$1,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596));
var re_render_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__105122__$1,new cljs.core.Keyword(null,"re-render?","re-render?",-1390644928),true);
var re_render_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105122__$1,new cljs.core.Keyword(null,"re-render-opts","re-render-opts",-832360338));
var _refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105122__$1,new cljs.core.Keyword(null,"_refresh?","_refresh?",677352006));
return frontend.handler.file_based.repo.parse_files_and_create_default_files_BANG_(repo_url,files,delete_files,delete_blocks,re_render_QMARK_,re_render_opts,opts);
});
/**
 * load graph files to db.
 */
frontend.handler.file_based.repo.load_new_repo_to_db_BANG_ = (function frontend$handler$file_based$repo$load_new_repo_to_db_BANG_(repo_url,p__105133){
var map__105134 = p__105133;
var map__105134__$1 = cljs.core.__destructure_map(map__105134);
var file_objs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105134__$1,new cljs.core.Keyword(null,"file-objs","file-objs",545613385));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105134__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105134__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.handler.file-based.repo","load-new-repo","frontend.handler.file-based.repo/load-new-repo",534665435),repo_url,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639),empty_graph_QMARK_,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695),new_graph_QMARK_], 0));

frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541),true], null));

var config = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var G__105135 = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105131_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq/config.edn",new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__105131_SHARP_));
}),file_objs));
if((G__105135 == null)){
return null;
} else {
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(G__105135);
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
frontend.handler.file_based.repo.load_repo_to_db_BANG_ = (function frontend$handler$file_based$repo$load_repo_to_db_BANG_(repo_url,p__105137){
var map__105138 = p__105137;
var map__105138__$1 = cljs.core.__destructure_map(map__105138);
var diffs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105138__$1,new cljs.core.Keyword(null,"diffs","diffs",-1720136241));
var file_objs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105138__$1,new cljs.core.Keyword(null,"file-objs","file-objs",545613385));
var refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105138__$1,new cljs.core.Keyword(null,"refresh?","refresh?",-1507960570));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105138__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
var empty_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105138__$1,new cljs.core.Keyword(null,"empty-graph?","empty-graph?",981603639));
frontend.spec.validate(new cljs.core.Keyword("repos","url","repos/url",454158615),repo_url);

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.handler.file-based.repo","load-repo-to-db!","frontend.handler.file-based.repo/load-repo-to-db!",1635766816),repo_url], 0));

frontend.state.set_parsing_state_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541),true], null));

var config = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var G__105139 = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105136_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.config.get_repo_config_path(),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__105136_SHARP_));
}),file_objs));
if((G__105139 == null)){
return null;
} else {
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(G__105139);
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
var add_or_modify_files = (function (){var G__105140 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(modify_files,add_files);
if((G__105140 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__105140);
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
