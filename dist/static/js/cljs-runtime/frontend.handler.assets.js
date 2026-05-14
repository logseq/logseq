goog.provide('frontend.handler.assets');
frontend.handler.assets.alias_enabled_QMARK_ = (function frontend$handler$assets$alias_enabled_QMARK_(){
var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("assets","alias-enabled?","assets/alias-enabled?",-40753727).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
} else {
return and__5000__auto__;
}
});
frontend.handler.assets.clean_path_prefix = (function frontend$handler$assets$clean_path_prefix(path){
if(typeof path === 'string'){
return clojure.string.replace_first(path,/^[.\\/\\]*(assets)[\\/\\]+/,"");
} else {
return null;
}
});
frontend.handler.assets.check_alias_path_QMARK_ = (function frontend$handler$assets$check_alias_path_QMARK_(path){
var and__5000__auto__ = typeof path === 'string';
if(and__5000__auto__){
var G__101082 = path;
var G__101082__$1 = (((G__101082 == null))?null:frontend.handler.assets.clean_path_prefix(G__101082));
if((G__101082__$1 == null)){
return null;
} else {
return clojure.string.starts_with_QMARK_(G__101082__$1,"@");
}
} else {
return and__5000__auto__;
}
});
frontend.handler.assets.get_alias_dirs = (function frontend$handler$assets$get_alias_dirs(){
return new cljs.core.Keyword("assets","alias-dirs","assets/alias-dirs",627599020).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.handler.assets.get_alias_by_dir = (function frontend$handler$assets$get_alias_by_dir(dir){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.handler.assets.alias_enabled_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(frontend.handler.assets.get_alias_dirs());
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var alias_dirs = temp__5804__auto__;
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__101088_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__101088_SHARP_)));
}),medley.core.indexed.cljs$core$IFn$_invoke$arity$1(alias_dirs));
} else {
return null;
}
});
frontend.handler.assets.get_alias_by_name = (function frontend$handler$assets$get_alias_by_name(name){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.handler.assets.alias_enabled_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(frontend.handler.assets.get_alias_dirs());
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var alias_dirs = temp__5804__auto__;
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__101089_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__101089_SHARP_)));
}),medley.core.indexed.cljs$core$IFn$_invoke$arity$1(alias_dirs));
} else {
return null;
}
});
frontend.handler.assets.convert_platform_protocol = (function frontend$handler$assets$convert_platform_protocol(full_path){
var G__101102 = full_path;
if(cljs.core.truth_((function (){var and__5000__auto__ = typeof full_path === 'string';
if(and__5000__auto__){
return frontend.mobile.util.native_platform_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return clojure.string.replace_first(G__101102,/^(file:\/\/|assets:\/\/)/,logseq.common.config.capacitor_protocol_with_prefix);
} else {
return G__101102;
}
});
frontend.handler.assets.resolve_asset_real_path_url = (function frontend$handler$assets$resolve_asset_real_path_url(repo,rpath){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof rpath === 'string';
if(and__5000__auto__){
return clojure.string.replace(rpath,/^[.\\/\\]+/,"");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var rpath__$1 = temp__5804__auto__;
if(frontend.config.publishing_QMARK_){
return ["./",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rpath__$1)].join('');
} else {
var ret = (function (){var rpath__$2 = (((!(clojure.string.starts_with_QMARK_(rpath__$1,logseq.common.config.local_assets_dir))))?logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(logseq.common.config.local_assets_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rpath__$1], 0)):rpath__$1);
var encoded_chars_QMARK_ = cljs.core.boolean$(cljs.core.re_find(/%[0-9a-f]{2}/i,rpath__$2));
var rpath__$3 = ((encoded_chars_QMARK_)?decodeURI(rpath__$2):rpath__$2);
var graph_root = frontend.config.get_repo_dir(repo);
var has_schema_QMARK_ = clojure.string.starts_with_QMARK_(graph_root,"file:");
var temp__5802__auto__ = (function (){var and__5000__auto__ = frontend.handler.assets.alias_enabled_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
var rpath_SINGLEQUOTE_ = clojure.string.replace(rpath__$3,cljs.core.re_pattern(["^",logseq.common.config.local_assets_dir,"[\\/\\\\]+"].join('')),"");
var and__5000__auto____$1 = clojure.string.starts_with_QMARK_(rpath_SINGLEQUOTE_,"@");
if(and__5000__auto____$1){
var G__101108 = (function (){var and__5000__auto____$2 = cljs.core.seq(frontend.handler.assets.get_alias_dirs());
if(and__5000__auto____$2){
return cljs.core.second(frontend.handler.assets.get_alias_by_name(cljs.core.second(cljs.core.re_find(/^@([^\\/]+)/,rpath_SINGLEQUOTE_))));
} else {
return and__5000__auto____$2;
}
})();
if((G__101108 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[rpath_SINGLEQUOTE_,G__101108],null));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var vec__101110 = temp__5802__auto__;
var rpath_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101110,(0),null);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101110,(1),null);
return ["assets://",clojure.string.replace(rpath_SINGLEQUOTE_,["@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(alias))].join(''),new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(alias))].join('');
} else {
if(has_schema_QMARK_){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(graph_root,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rpath__$3], 0));
} else {
return logseq.common.path.prepend_protocol("file:",logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(graph_root,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rpath__$3], 0)));
}
}
})();
return frontend.handler.assets.convert_platform_protocol(ret);
}
} else {
return null;
}
});
/**
 * try to convert resource file to url asset link
 */
frontend.handler.assets.normalize_asset_resource_url = (function frontend$handler$assets$normalize_asset_resource_url(path){
var protocol_link_QMARK_ = cljs.core.some((function (p1__101115_SHARP_){
return clojure.string.starts_with_QMARK_(clojure.string.lower_case(path),p1__101115_SHARP_);
}),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["https://",null,"file://",null,"assets://",null,"http://",null], null), null));
if(cljs.core.truth_(protocol_link_QMARK_)){
return path;
} else {
if(logseq.common.path.absolute_QMARK_(path)){
if(cljs.core.boolean$(cljs.core.re_find(/%[0-9a-f]{2}/i,path))){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("file://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.common.util.safe_decode_uri_component(path)], 0));
} else {
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("file://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));
}
} else {
return frontend.handler.assets.resolve_asset_real_path_url(frontend.state.get_current_repo(),path);

}
}
});
frontend.handler.assets.get_matched_alias_by_ext = (function frontend$handler$assets$get_matched_alias_by_ext(ext){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.handler.assets.alias_enabled_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = typeof ext === 'string';
if(and__5000__auto____$1){
var and__5000__auto____$2 = (!(clojure.string.blank_QMARK_(ext)));
if(and__5000__auto____$2){
return frontend.util.safe_lower_case(ext);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ext__$1 = temp__5804__auto__;
var alias = medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p__101128){
var map__101129 = p__101128;
var map__101129__$1 = cljs.core.__destructure_map(map__101129);
var exts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101129__$1,new cljs.core.Keyword(null,"exts","exts",-946342126));
return cljs.core.some((function (p1__101118_SHARP_){
return clojure.string.ends_with_QMARK_(ext__$1,p1__101118_SHARP_);
}),exts);
}),frontend.handler.assets.get_alias_dirs());
return alias;
} else {
return null;
}
});
/**
 * Link text for inserting to markdown/org
 */
frontend.handler.assets.get_asset_file_link = (function frontend$handler$assets$get_asset_file_link(format,url,file_name,image_QMARK_){
var pdf_QMARK_ = (function (){var and__5000__auto__ = url;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.ends_with_QMARK_(clojure.string.lower_case(url),".pdf");
} else {
return and__5000__auto__;
}
})();
var media_QMARK_ = (function (){var and__5000__auto__ = url;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = frontend.config.ext_of_audio_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.ext_of_video_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
}
} else {
return and__5000__auto__;
}
})();
var G__101134 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__101134__$1 = (((G__101134 instanceof cljs.core.Keyword))?G__101134.fqn:null);
switch (G__101134__$1) {
case "markdown":
var G__101135 = [(cljs.core.truth_((function (){var or__5002__auto__ = image_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = media_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return pdf_QMARK_;
}
}
})())?"!":null),"[%s](%s)"].join('');
var G__101136 = file_name;
var G__101137 = url;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__101135,G__101136,G__101137) : frontend.util.format.call(null,G__101135,G__101136,G__101137));

break;
case "org":
if(cljs.core.truth_(image_QMARK_)){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[[%s]]",url) : frontend.util.format.call(null,"[[%s]]",url));
} else {
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[[%s][%s]]",url,file_name) : frontend.util.format.call(null,"[[%s][%s]]",url,file_name));
}

break;
default:
return null;

}
});
frontend.handler.assets._LT_make_data_url = (function frontend$handler$assets$_LT_make_data_url(path){
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(repo_dir,path,cljs.core.PersistentArrayMap.EMPTY)),(function (binary){
return promesa.protocols._mcat(promesa.protocols._promise((new Blob([binary],cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"image"], null))))),(function (blob){
return promesa.protocols._promise((cljs.core.truth_(blob)?URL.createObjectURL(blob):null));
}));
}));
}));
});
/**
 * Expand ../assets/ links in custom.css file to blob url.
 * 
 * Only for db-based graph
 */
frontend.handler.assets._LT_expand_assets_links_for_db_graph = (function frontend$handler$assets$_LT_expand_assets_links_for_db_graph(css){
var rel_paths = cljs.core.re_seq(/\(['\"]?(\.\.\/assets\/.*?)['\"]?\)/,css);
var rel_paths__$1 = cljs.core.vec(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,rel_paths)));
var fixed_rel_paths = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("./logseq/",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p], 0));
}),rel_paths__$1);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.assets._LT_make_data_url,fixed_rel_paths))),(function (blob_urls){
return promesa.protocols._promise(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (css__$1,p__101150){
var vec__101151 = p__101150;
var rel_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101151,(0),null);
var blob_url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101151,(1),null);
return clojure.string.replace(css__$1,rel_path,["'",cljs.core.str.cljs$core$IFn$_invoke$arity$1(blob_url),"'"].join(''));
}),css,cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,rel_paths__$1,blob_urls)));
}));
}));
});
/**
 * Make asset URL for UI element, to fill img.src
 */
frontend.handler.assets._LT_make_asset_url = (function frontend$handler$assets$_LT_make_asset_url(path){
if(frontend.config.publishing_QMARK_){
return clojure.string.replace_first(path,/^\//,"");
} else {
var repo = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo);
var path__$1 = clojure.string.replace(path,/^(\.\.)?\//,"./");
var full_path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path__$1], 0));
var data_url_QMARK_ = clojure.string.starts_with_QMARK_(path__$1,"data:");
if(data_url_QMARK_){
return path__$1;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.handler.assets.alias_enabled_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.assets.check_alias_path_QMARK_(path__$1);
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.assets.resolve_asset_real_path_url(frontend.state.get_current_repo(),path__$1);
} else {
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return logseq.common.path.prepend_protocol("assets:",full_path);
} else {
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.mobile.util.convert_file_src(full_path);
} else {
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(repo_dir,path__$1,cljs.core.PersistentArrayMap.EMPTY)),(function (binary){
return promesa.protocols._mcat(promesa.protocols._promise((new Blob([binary],cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"image"], null))))),(function (blob){
return promesa.protocols._promise((cljs.core.truth_(blob)?URL.createObjectURL(blob):null));
}));
}));
}));
} else {
return null;
}
}
}
}
}
}
});
frontend.handler.assets.decode_digest = (function frontend$handler$assets$decode_digest(digest){
return Array.from(digest).map((function (s){
return s.toString((16)).padStart((2),"0");
})).join("");
});
frontend.handler.assets.get_file_checksum = (function frontend$handler$assets$get_file_checksum(file){
return file.arrayBuffer().then((function (buf){
return crypto.subtle.digest("SHA-256",buf);
})).then((function (dig){
return (new Uint8Array(dig));
})).then(frontend.handler.assets.decode_digest);
});
frontend.handler.assets._LT_get_all_assets = (function frontend$handler$assets$_LT_get_all_assets(){
var temp__5804__auto__ = frontend.config.get_current_repo_assets_root();
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(path,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], null)], 0)),cljs.core.constantly(null))),(function (result){
return promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (path__$1){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(path__$1,"",cljs.core.PersistentArrayMap.EMPTY)),(function (data){
return promesa.protocols._promise((function (){var path_SINGLEQUOTE_ = (function (){var G__101160 = "assets";
var G__101161 = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(path__$1) : frontend.util.node_path.basename.call(null,path__$1));
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__101160,G__101161) : frontend.util.node_path.join.call(null,G__101160,G__101161));
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path_SINGLEQUOTE_,data], null);
})());
}));
}));
}),result)));
}));
}));
} else {
return null;
}
});
frontend.handler.assets.ensure_assets_dir_BANG_ = (function frontend$handler$assets$ensure_assets_dir_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise("assets"),(function (assets_dir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([assets_dir], 0)))),(function (_){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo_dir,assets_dir], null));
}));
}));
}));
}));
});
/**
 * Get asset path from filename, ensure assets dir exists
 */
frontend.handler.assets.get_asset_path = (function frontend$handler$assets$get_asset_path(filename){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.ensure_assets_dir_BANG_(frontend.state.get_current_repo())),(function (p__101162){
var vec__101164 = p__101162;
var repo_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101164,(0),null);
var assets_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101164,(1),null);
return promesa.protocols._promise(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([assets_dir,filename], 0)));
}));
}));
});
frontend.handler.assets._LT_get_all_asset_file_paths = (function frontend$handler$assets$_LT_get_all_asset_file_paths(repo){
var temp__5804__auto__ = frontend.config.get_repo_assets_root(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(path,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], null)], 0)),cljs.core.constantly(null));
} else {
return null;
}
});
frontend.handler.assets._LT_read_asset = (function frontend$handler$assets$_LT_read_asset(repo,asset_block_id,asset_type){
var repo_dir = frontend.config.get_repo_dir(repo);
var file_path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(logseq.common.config.local_assets_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_block_id),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_type)].join('')], 0));
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(repo_dir,file_path,cljs.core.PersistentArrayMap.EMPTY);
});
frontend.handler.assets._LT_get_asset_file_metadata = (function frontend$handler$assets$_LT_get_asset_file_metadata(repo,asset_block_id,asset_type){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets._LT_read_asset(repo,asset_block_id,asset_type)),(function (file){
return promesa.protocols._mcat(promesa.protocols._promise((new Blob([file],cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"image"], null))))),(function (blob){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_file_checksum(blob)),(function (checksum){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checksum","checksum",549736371),checksum], null));
}));
}));
}));
})),cljs.core.constantly(null));
});
frontend.handler.assets._LT_write_asset = (function frontend$handler$assets$_LT_write_asset(repo,asset_block_id,asset_type,data){
var asset_block_id_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_block_id);
var repo_dir = frontend.config.get_repo_dir(repo);
var file_path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(logseq.common.config.local_assets_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[asset_block_id_str,".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_type)].join('')], 0));
return frontend.fs.write_plain_text_file_BANG_(repo,repo_dir,file_path,data,cljs.core.PersistentArrayMap.EMPTY);
});
frontend.handler.assets._LT_unlink_asset = (function frontend$handler$assets$_LT_unlink_asset(repo,asset_block_id,asset_type){
var file_path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_repo_dir(repo),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.common.config.local_assets_dir,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_block_id),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_type)].join('')], 0));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.unlink_BANG_(repo,file_path,cljs.core.PersistentArrayMap.EMPTY),cljs.core.constantly(null));
});
frontend.handler.assets.new_task__rtc_upload_asset = (function frontend$handler$assets$new_task__rtc_upload_asset(repo,asset_block_uuid_str,asset_type,checksum,put_url){
if(cljs.core.truth_((function (){var and__5000__auto__ = asset_type;
if(cljs.core.truth_(and__5000__auto__)){
return checksum;
} else {
return and__5000__auto__;
}
})())){
} else {
throw (new Error("Assert failed: (and asset-type checksum)"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101170_block_0 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_0(cr101170_state){
try{var cr101170_place_0 = frontend.common.missionary._LT__BANG_;
var cr101170_place_1 = frontend.handler.assets._LT_read_asset;
var cr101170_place_2 = repo;
var cr101170_place_3 = asset_block_uuid_str;
var cr101170_place_4 = asset_type;
var cr101170_place_5 = (function (){var G__101245 = cr101170_place_2;
var G__101246 = cr101170_place_3;
var G__101247 = cr101170_place_4;
var fexpr__101244 = cr101170_place_1;
return (fexpr__101244.cljs$core$IFn$_invoke$arity$3 ? fexpr__101244.cljs$core$IFn$_invoke$arity$3(G__101245,G__101246,G__101247) : fexpr__101244.call(null,G__101245,G__101246,G__101247));
})();
var cr101170_place_6 = (function (){var G__101249 = cr101170_place_5;
var fexpr__101248 = cr101170_place_0;
return (fexpr__101248.cljs$core$IFn$_invoke$arity$1 ? fexpr__101248.cljs$core$IFn$_invoke$arity$1(G__101249) : fexpr__101248.call(null,G__101249));
})();
(cr101170_state[(0)] = cr101170_block_1);

return missionary.core.park(cr101170_place_6);
}catch (e101243){var cr101170_exception = e101243;
(cr101170_state[(0)] = null);

throw cr101170_exception;
}});
var cr101170_block_1 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_1(cr101170_state){
try{var cr101170_place_7 = missionary.core.unpark();
var cr101170_place_8 = cljs.core.atom;
var cr101170_place_9 = null;
var cr101170_place_10 = (function (){var G__101252 = cr101170_place_9;
var fexpr__101251 = cr101170_place_8;
return (fexpr__101251.cljs$core$IFn$_invoke$arity$1 ? fexpr__101251.cljs$core$IFn$_invoke$arity$1(G__101252) : fexpr__101251.call(null,G__101252));
})();
var cr101170_place_11 = cljs_http_missionary.client.put;
var cr101170_place_12 = put_url;
var cr101170_place_13 = new cljs.core.Keyword(null,"headers","headers",-835030129);
var cr101170_place_14 = "x-amz-meta-checksum";
var cr101170_place_15 = checksum;
var cr101170_place_16 = "x-amz-meta-type";
var cr101170_place_17 = asset_type;
var cr101170_place_18 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101170_place_16,cr101170_place_17,cr101170_place_14,cr101170_place_15]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101170_place_19 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr101170_place_20 = cr101170_place_7;
var cr101170_place_21 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr101170_place_22 = false;
var cr101170_place_23 = new cljs.core.Keyword(null,"*progress-flow","*progress-flow",2049066069);
var cr101170_place_24 = cr101170_place_10;
var cr101170_place_25 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101170_place_21,cr101170_place_22,cr101170_place_19,cr101170_place_20,cr101170_place_13,cr101170_place_18,cr101170_place_23,cr101170_place_24]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101170_place_26 = (function (){var G__101255 = cr101170_place_12;
var G__101256 = cr101170_place_25;
var fexpr__101254 = cr101170_place_11;
return (fexpr__101254.cljs$core$IFn$_invoke$arity$2 ? fexpr__101254.cljs$core$IFn$_invoke$arity$2(G__101255,G__101256) : fexpr__101254.call(null,G__101255,G__101256));
})();
var cr101170_place_27 = frontend.common.missionary.run_task;
var cr101170_place_28 = new cljs.core.Keyword(null,"upload-asset-progress","upload-asset-progress",1958748115);
var cr101170_place_29 = missionary.core.reduce;
var cr101170_place_30 = (function (_,v){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),(function (m){
return cljs.core.assoc_in(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,asset_block_uuid_str], null),v);
}));
});
var cr101170_place_31 = cljs.core.deref;
var cr101170_place_32 = cr101170_place_10;
var cr101170_place_33 = (function (){var G__101276 = cr101170_place_32;
var fexpr__101275 = cr101170_place_31;
return (fexpr__101275.cljs$core$IFn$_invoke$arity$1 ? fexpr__101275.cljs$core$IFn$_invoke$arity$1(G__101276) : fexpr__101275.call(null,G__101276));
})();
var cr101170_place_34 = (function (){var G__101278 = cr101170_place_30;
var G__101279 = cr101170_place_33;
var fexpr__101277 = cr101170_place_29;
return (fexpr__101277.cljs$core$IFn$_invoke$arity$2 ? fexpr__101277.cljs$core$IFn$_invoke$arity$2(G__101278,G__101279) : fexpr__101277.call(null,G__101278,G__101279));
})();
var cr101170_place_35 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr101170_place_36 = cljs.core.constantly;
var cr101170_place_37 = null;
var cr101170_place_38 = (function (){var G__101281 = cr101170_place_37;
var fexpr__101280 = cr101170_place_36;
return (fexpr__101280.cljs$core$IFn$_invoke$arity$1 ? fexpr__101280.cljs$core$IFn$_invoke$arity$1(G__101281) : fexpr__101280.call(null,G__101281));
})();
var cr101170_place_39 = (function (){var G__101285 = cr101170_place_28;
var G__101286 = cr101170_place_34;
var G__101287 = cr101170_place_35;
var G__101288 = cr101170_place_38;
var fexpr__101284 = cr101170_place_27;
return (fexpr__101284.cljs$core$IFn$_invoke$arity$4 ? fexpr__101284.cljs$core$IFn$_invoke$arity$4(G__101285,G__101286,G__101287,G__101288) : fexpr__101284.call(null,G__101285,G__101286,G__101287,G__101288));
})();
var cr101170_place_40 = cr101170_place_26;
(cr101170_state[(0)] = cr101170_block_2);

return missionary.core.park(cr101170_place_40);
}catch (e101250){var cr101170_exception = e101250;
(cr101170_state[(0)] = null);

throw cr101170_exception;
}});
var cr101170_block_2 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_2(cr101170_state){
try{var cr101170_place_41 = missionary.core.unpark();
var cr101170_place_42 = cljs.core.__destructure_map;
var cr101170_place_43 = cr101170_place_41;
var cr101170_place_44 = (function (){var G__101291 = cr101170_place_43;
var fexpr__101290 = cr101170_place_42;
return (fexpr__101290.cljs$core$IFn$_invoke$arity$1 ? fexpr__101290.cljs$core$IFn$_invoke$arity$1(G__101291) : fexpr__101290.call(null,G__101291));
})();
var cr101170_place_45 = cr101170_place_44;
var cr101170_place_46 = cljs.core.get;
var cr101170_place_47 = cr101170_place_44;
var cr101170_place_48 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr101170_place_49 = (function (){var G__101293 = cr101170_place_47;
var G__101294 = cr101170_place_48;
var fexpr__101292 = cr101170_place_46;
return (fexpr__101292.cljs$core$IFn$_invoke$arity$2 ? fexpr__101292.cljs$core$IFn$_invoke$arity$2(G__101293,G__101294) : fexpr__101292.call(null,G__101293,G__101294));
})();
var cr101170_place_50 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr101170_place_51 = cr101170_place_49;
var cr101170_place_52 = (function (){var G__101296 = cr101170_place_51;
var fexpr__101295 = cr101170_place_50;
return (fexpr__101295.cljs$core$IFn$_invoke$arity$1 ? fexpr__101295.cljs$core$IFn$_invoke$arity$1(G__101296) : fexpr__101295.call(null,G__101296));
})();
var cr101170_place_53 = null;
if(cljs.core.truth_(cr101170_place_52)){
(cr101170_state[(0)] = cr101170_block_4);

(cr101170_state[(2)] = cr101170_place_53);

return cr101170_state;
} else {
(cr101170_state[(0)] = cr101170_block_3);

(cr101170_state[(1)] = cr101170_place_45);

(cr101170_state[(2)] = cr101170_place_53);

return cr101170_state;
}
}catch (e101289){var cr101170_exception = e101289;
(cr101170_state[(0)] = null);

throw cr101170_exception;
}});
var cr101170_block_3 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_3(cr101170_state){
try{var cr101170_place_45 = (cr101170_state[(1)]);
var cr101170_place_54 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr101170_place_55 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr101170_place_56 = new cljs.core.Keyword("rtc.exception","upload-asset-failed","rtc.exception/upload-asset-failed",811855372);
var cr101170_place_57 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr101170_place_58 = cljs.core.dissoc;
var cr101170_place_59 = cr101170_place_45;
var cr101170_place_60 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr101170_place_61 = (function (){var G__101306 = cr101170_place_59;
var G__101307 = cr101170_place_60;
var fexpr__101305 = cr101170_place_58;
return (fexpr__101305.cljs$core$IFn$_invoke$arity$2 ? fexpr__101305.cljs$core$IFn$_invoke$arity$2(G__101306,G__101307) : fexpr__101305.call(null,G__101306,G__101307));
})();
var cr101170_place_62 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101170_place_57,cr101170_place_61,cr101170_place_55,cr101170_place_56]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101170_place_63 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101170_place_54,cr101170_place_62]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr101170_state[(0)] = cr101170_block_5);

(cr101170_state[(1)] = null);

(cr101170_state[(2)] = cr101170_place_63);

return cr101170_state;
}catch (e101303){var cr101170_exception = e101303;
(cr101170_state[(0)] = null);

(cr101170_state[(1)] = null);

(cr101170_state[(2)] = null);

throw cr101170_exception;
}});
var cr101170_block_4 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_4(cr101170_state){
try{var cr101170_place_64 = null;
(cr101170_state[(0)] = cr101170_block_5);

(cr101170_state[(2)] = cr101170_place_64);

return cr101170_state;
}catch (e101308){var cr101170_exception = e101308;
(cr101170_state[(0)] = null);

(cr101170_state[(2)] = null);

throw cr101170_exception;
}});
var cr101170_block_5 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr101170_block_5(cr101170_state){
try{var cr101170_place_53 = (cr101170_state[(2)]);
(cr101170_state[(0)] = null);

(cr101170_state[(2)] = null);

return cr101170_place_53;
}catch (e101309){var cr101170_exception = e101309;
(cr101170_state[(0)] = null);

(cr101170_state[(2)] = null);

throw cr101170_exception;
}});
return cloroutine.impl.coroutine((function (){var G__101310 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__101310[(0)] = cr101170_block_0);

return G__101310;
})());
})(),missionary.core.sp_run);
});
frontend.handler.assets.new_task__rtc_download_asset = (function frontend$handler$assets$new_task__rtc_download_asset(repo,asset_block_uuid_str,asset_type,get_url){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101311_block_1 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_1(cr101311_state){
try{var cr101311_place_12 = (cr101311_state[(2)]);
var cr101311_place_28 = cr101311_place_12;
(cr101311_state[(0)] = cr101311_block_2);

(cr101311_state[(2)] = null);

return missionary.core.park(cr101311_place_28);
}catch (e101395){var cr101311_exception = e101395;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(2)] = null);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_4 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_4(cr101311_state){
try{var cr101311_place_56 = missionary.core.unpark();
var cr101311_place_57 = null;
(cr101311_state[(0)] = cr101311_block_6);

(cr101311_state[(2)] = cr101311_place_57);

return cr101311_state;
}catch (e101397){var cr101311_exception = e101397;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(2)] = null);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_10 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_10(cr101311_state){
try{var cr101311_place_26 = (cr101311_state[(1)]);
var cr101311_place_75 = cr101311_place_26;
var cr101311_place_76 = (function(){throw cr101311_place_75})();
(cr101311_state[(0)] = null);

(cr101311_state[(1)] = null);

(cr101311_state[(3)] = null);

return null;
}catch (e101398){var cr101311_exception = e101398;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_13 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_13(cr101311_state){
try{var cr101311_place_71 = (cr101311_state[(2)]);
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(1)] = cr101311_place_71);

return cr101311_state;
}catch (e101399){var cr101311_exception = e101399;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_5 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_5(cr101311_state){
try{var cr101311_place_33 = (cr101311_state[(5)]);
var cr101311_place_58 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr101311_place_59 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr101311_place_60 = new cljs.core.Keyword("rtc.exception","download-asset-failed","rtc.exception/download-asset-failed",1700970262);
var cr101311_place_61 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr101311_place_62 = cljs.core.dissoc;
var cr101311_place_63 = cr101311_place_33;
var cr101311_place_64 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr101311_place_65 = (function (){var G__101402 = cr101311_place_63;
var G__101403 = cr101311_place_64;
var fexpr__101401 = cr101311_place_62;
return (fexpr__101401.cljs$core$IFn$_invoke$arity$2 ? fexpr__101401.cljs$core$IFn$_invoke$arity$2(G__101402,G__101403) : fexpr__101401.call(null,G__101402,G__101403));
})();
var cr101311_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101311_place_61,cr101311_place_65,cr101311_place_59,cr101311_place_60]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101311_place_67 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101311_place_58,cr101311_place_66]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr101311_state[(0)] = cr101311_block_6);

(cr101311_state[(5)] = null);

(cr101311_state[(2)] = cr101311_place_67);

return cr101311_state;
}catch (e101400){var cr101311_exception = e101400;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(2)] = null);

(cr101311_state[(5)] = null);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_9 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_9(cr101311_state){
try{var cr101311_place_74 = null;
(cr101311_state[(0)] = cr101311_block_11);

(cr101311_state[(4)] = cr101311_place_74);

return cr101311_state;
}catch (e101404){var cr101311_exception = e101404;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(4)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_0 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_0(cr101311_state){
try{var cr101311_place_0 = cljs.core.atom;
var cr101311_place_1 = null;
var cr101311_place_2 = (function (){var G__101407 = cr101311_place_1;
var fexpr__101406 = cr101311_place_0;
return (fexpr__101406.cljs$core$IFn$_invoke$arity$1 ? fexpr__101406.cljs$core$IFn$_invoke$arity$1(G__101407) : fexpr__101406.call(null,G__101407));
})();
var cr101311_place_3 = cljs_http_missionary.client.get;
var cr101311_place_4 = get_url;
var cr101311_place_5 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr101311_place_6 = false;
var cr101311_place_7 = new cljs.core.Keyword(null,"response-type","response-type",-1493770458);
var cr101311_place_8 = new cljs.core.Keyword(null,"array-buffer","array-buffer",519008380);
var cr101311_place_9 = new cljs.core.Keyword(null,"*progress-flow","*progress-flow",2049066069);
var cr101311_place_10 = cr101311_place_2;
var cr101311_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101311_place_7,cr101311_place_8,cr101311_place_9,cr101311_place_10,cr101311_place_5,cr101311_place_6]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101311_place_12 = (function (){var G__101410 = cr101311_place_4;
var G__101411 = cr101311_place_11;
var fexpr__101409 = cr101311_place_3;
return (fexpr__101409.cljs$core$IFn$_invoke$arity$2 ? fexpr__101409.cljs$core$IFn$_invoke$arity$2(G__101410,G__101411) : fexpr__101409.call(null,G__101410,G__101411));
})();
var cr101311_place_13 = frontend.common.missionary.run_task;
var cr101311_place_14 = new cljs.core.Keyword(null,"download-asset-progress","download-asset-progress",-1253479373);
var cr101311_place_15 = missionary.core.reduce;
var cr101311_place_16 = (function (_,v){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),(function (m){
return cljs.core.assoc_in(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,asset_block_uuid_str], null),v);
}));
});
var cr101311_place_17 = cljs.core.deref;
var cr101311_place_18 = cr101311_place_2;
var cr101311_place_19 = (function (){var G__101413 = cr101311_place_18;
var fexpr__101412 = cr101311_place_17;
return (fexpr__101412.cljs$core$IFn$_invoke$arity$1 ? fexpr__101412.cljs$core$IFn$_invoke$arity$1(G__101413) : fexpr__101412.call(null,G__101413));
})();
var cr101311_place_20 = (function (){var G__101415 = cr101311_place_16;
var G__101416 = cr101311_place_19;
var fexpr__101414 = cr101311_place_15;
return (fexpr__101414.cljs$core$IFn$_invoke$arity$2 ? fexpr__101414.cljs$core$IFn$_invoke$arity$2(G__101415,G__101416) : fexpr__101414.call(null,G__101415,G__101416));
})();
var cr101311_place_21 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr101311_place_22 = cljs.core.constantly;
var cr101311_place_23 = null;
var cr101311_place_24 = (function (){var G__101418 = cr101311_place_23;
var fexpr__101417 = cr101311_place_22;
return (fexpr__101417.cljs$core$IFn$_invoke$arity$1 ? fexpr__101417.cljs$core$IFn$_invoke$arity$1(G__101418) : fexpr__101417.call(null,G__101418));
})();
var cr101311_place_25 = (function (){var G__101420 = cr101311_place_14;
var G__101421 = cr101311_place_20;
var G__101422 = cr101311_place_21;
var G__101423 = cr101311_place_24;
var fexpr__101419 = cr101311_place_13;
return (fexpr__101419.cljs$core$IFn$_invoke$arity$4 ? fexpr__101419.cljs$core$IFn$_invoke$arity$4(G__101420,G__101421,G__101422,G__101423) : fexpr__101419.call(null,G__101420,G__101421,G__101422,G__101423));
})();
var cr101311_place_26 = null;
var cr101311_place_27 = false;
(cr101311_state[(0)] = cr101311_block_1);

(cr101311_state[(1)] = cr101311_place_26);

(cr101311_state[(2)] = cr101311_place_12);

(cr101311_state[(3)] = cr101311_place_27);

(cr101311_state[(4)] = cr101311_place_25);

return cr101311_state;
}catch (e101405){var cr101311_exception = e101405;
(cr101311_state[(0)] = null);

throw cr101311_exception;
}});
var cr101311_block_2 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_2(cr101311_state){
try{var cr101311_place_29 = missionary.core.unpark();
var cr101311_place_30 = cljs.core.__destructure_map;
var cr101311_place_31 = cr101311_place_29;
var cr101311_place_32 = (function (){var G__101426 = cr101311_place_31;
var fexpr__101425 = cr101311_place_30;
return (fexpr__101425.cljs$core$IFn$_invoke$arity$1 ? fexpr__101425.cljs$core$IFn$_invoke$arity$1(G__101426) : fexpr__101425.call(null,G__101426));
})();
var cr101311_place_33 = cr101311_place_32;
var cr101311_place_34 = cljs.core.get;
var cr101311_place_35 = cr101311_place_32;
var cr101311_place_36 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr101311_place_37 = (function (){var G__101428 = cr101311_place_35;
var G__101429 = cr101311_place_36;
var fexpr__101427 = cr101311_place_34;
return (fexpr__101427.cljs$core$IFn$_invoke$arity$2 ? fexpr__101427.cljs$core$IFn$_invoke$arity$2(G__101428,G__101429) : fexpr__101427.call(null,G__101428,G__101429));
})();
var cr101311_place_38 = cljs.core.get;
var cr101311_place_39 = cr101311_place_32;
var cr101311_place_40 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr101311_place_41 = (function (){var G__101431 = cr101311_place_39;
var G__101432 = cr101311_place_40;
var fexpr__101430 = cr101311_place_38;
return (fexpr__101430.cljs$core$IFn$_invoke$arity$2 ? fexpr__101430.cljs$core$IFn$_invoke$arity$2(G__101431,G__101432) : fexpr__101430.call(null,G__101431,G__101432));
})();
var cr101311_place_42 = cljs.core.not;
var cr101311_place_43 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr101311_place_44 = cr101311_place_37;
var cr101311_place_45 = (function (){var G__101434 = cr101311_place_44;
var fexpr__101433 = cr101311_place_43;
return (fexpr__101433.cljs$core$IFn$_invoke$arity$1 ? fexpr__101433.cljs$core$IFn$_invoke$arity$1(G__101434) : fexpr__101433.call(null,G__101434));
})();
var cr101311_place_46 = (function (){var G__101436 = cr101311_place_45;
var fexpr__101435 = cr101311_place_42;
return (fexpr__101435.cljs$core$IFn$_invoke$arity$1 ? fexpr__101435.cljs$core$IFn$_invoke$arity$1(G__101436) : fexpr__101435.call(null,G__101436));
})();
var cr101311_place_47 = null;
if(cljs.core.truth_(cr101311_place_46)){
(cr101311_state[(0)] = cr101311_block_5);

(cr101311_state[(2)] = cr101311_place_47);

(cr101311_state[(5)] = cr101311_place_33);

return cr101311_state;
} else {
(cr101311_state[(0)] = cr101311_block_3);

(cr101311_state[(2)] = cr101311_place_47);

(cr101311_state[(5)] = cr101311_place_41);

return cr101311_state;
}
}catch (e101424){var cr101311_exception = e101424;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_3 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_3(cr101311_state){
try{var cr101311_place_41 = (cr101311_state[(5)]);
var cr101311_place_48 = frontend.common.missionary._LT__BANG_;
var cr101311_place_49 = frontend.handler.assets._LT_write_asset;
var cr101311_place_50 = repo;
var cr101311_place_51 = asset_block_uuid_str;
var cr101311_place_52 = asset_type;
var cr101311_place_53 = cr101311_place_41;
var cr101311_place_54 = (function (){var G__101439 = cr101311_place_50;
var G__101440 = cr101311_place_51;
var G__101441 = cr101311_place_52;
var G__101442 = cr101311_place_53;
var fexpr__101438 = cr101311_place_49;
return (fexpr__101438.cljs$core$IFn$_invoke$arity$4 ? fexpr__101438.cljs$core$IFn$_invoke$arity$4(G__101439,G__101440,G__101441,G__101442) : fexpr__101438.call(null,G__101439,G__101440,G__101441,G__101442));
})();
var cr101311_place_55 = (function (){var G__101444 = cr101311_place_54;
var fexpr__101443 = cr101311_place_48;
return (fexpr__101443.cljs$core$IFn$_invoke$arity$1 ? fexpr__101443.cljs$core$IFn$_invoke$arity$1(G__101444) : fexpr__101443.call(null,G__101444));
})();
(cr101311_state[(0)] = cr101311_block_4);

(cr101311_state[(5)] = null);

return missionary.core.park(cr101311_place_55);
}catch (e101437){var cr101311_exception = e101437;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(2)] = null);

(cr101311_state[(5)] = null);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_7 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_7(cr101311_state){
try{var cr101311_place_26 = (cr101311_state[(1)]);
var cr101311_place_68 = cr101311_place_26;
var cr101311_place_69 = missionary.Cancelled;
var cr101311_place_70 = (cr101311_place_68 instanceof cr101311_place_69);
var cr101311_place_71 = null;
if(cr101311_place_70){
(cr101311_state[(0)] = cr101311_block_12);

return cr101311_state;
} else {
(cr101311_state[(0)] = cr101311_block_8);

(cr101311_state[(4)] = null);

(cr101311_state[(2)] = cr101311_place_71);

return cr101311_state;
}
}catch (e101449){var cr101311_exception = e101449;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(4)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_8 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_8(cr101311_state){
try{var cr101311_place_72 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr101311_place_73 = null;
if(cljs.core.truth_(cr101311_place_72)){
(cr101311_state[(0)] = cr101311_block_10);

(cr101311_state[(2)] = null);

return cr101311_state;
} else {
(cr101311_state[(0)] = cr101311_block_9);

(cr101311_state[(4)] = cr101311_place_73);

return cr101311_state;
}
}catch (e101458){var cr101311_exception = e101458;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_11 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_11(cr101311_state){
try{var cr101311_place_73 = (cr101311_state[(4)]);
(cr101311_state[(0)] = cr101311_block_13);

(cr101311_state[(4)] = null);

(cr101311_state[(2)] = cr101311_place_73);

return cr101311_state;
}catch (e101459){var cr101311_exception = e101459;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(4)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_12 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_12(cr101311_state){
try{var cr101311_place_26 = (cr101311_state[(1)]);
var cr101311_place_25 = (cr101311_state[(4)]);
var cr101311_place_77 = cr101311_place_26;
var cr101311_place_78 = cr101311_place_25;
var cr101311_place_79 = cr101311_place_78();
var cr101311_place_80 = cr101311_place_77;
var cr101311_place_81 = (function(){throw cr101311_place_80})();
(cr101311_state[(0)] = null);

(cr101311_state[(1)] = null);

(cr101311_state[(3)] = null);

(cr101311_state[(4)] = null);

return null;
}catch (e101460){var cr101311_exception = e101460;
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(4)] = null);

(cr101311_state[(3)] = true);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
var cr101311_block_14 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_14(cr101311_state){
try{var cr101311_place_26 = (cr101311_state[(1)]);
var cr101311_place_27 = (cr101311_state[(3)]);
var cr101311_place_82 = (cljs.core.truth_(cr101311_place_27)?(function(){throw cr101311_place_26})():cr101311_place_26);
(cr101311_state[(0)] = null);

(cr101311_state[(1)] = null);

(cr101311_state[(3)] = null);

return cr101311_place_82;
}catch (e101461){var cr101311_exception = e101461;
(cr101311_state[(0)] = null);

(cr101311_state[(1)] = null);

(cr101311_state[(3)] = null);

throw cr101311_exception;
}});
var cr101311_block_6 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr101311_block_6(cr101311_state){
try{var cr101311_place_47 = (cr101311_state[(2)]);
(cr101311_state[(0)] = cr101311_block_14);

(cr101311_state[(2)] = null);

(cr101311_state[(4)] = null);

(cr101311_state[(1)] = cr101311_place_47);

return cr101311_state;
}catch (e101462){var cr101311_exception = e101462;
(cr101311_state[(0)] = cr101311_block_7);

(cr101311_state[(2)] = null);

(cr101311_state[(1)] = cr101311_exception);

return cr101311_state;
}});
return cloroutine.impl.coroutine((function (){var G__101463 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__101463[(0)] = cr101311_block_0);

return G__101463;
})());
})(),missionary.core.sp_run);
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","unlink-asset","thread-api/unlink-asset",289779656),(function frontend$handler$assets$thread_api__unlink_asset(repo,asset_block_id,asset_type){
return frontend.handler.assets._LT_unlink_asset(repo,asset_block_id,asset_type);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-all-asset-file-paths","thread-api/get-all-asset-file-paths",-1018236719),(function frontend$handler$assets$thread_api__get_all_asset_file_paths(repo){
return frontend.handler.assets._LT_get_all_asset_file_paths(repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-asset-file-metadata","thread-api/get-asset-file-metadata",1768768708),(function frontend$handler$assets$thread_api__get_asset_file_metadata(repo,asset_block_id,asset_type){
return frontend.handler.assets._LT_get_asset_file_metadata(repo,asset_block_id,asset_type);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-upload-asset","thread-api/rtc-upload-asset",-1194088361),(function frontend$handler$assets$thread_api__rtc_upload_asset(repo,asset_block_uuid_str,asset_type,checksum,put_url){
return frontend.handler.assets.new_task__rtc_upload_asset(repo,asset_block_uuid_str,asset_type,checksum,put_url);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-download-asset","thread-api/rtc-download-asset",-555458777),(function frontend$handler$assets$thread_api__rtc_download_asset(repo,asset_block_uuid_str,asset_type,get_url){
return frontend.handler.assets.new_task__rtc_download_asset(repo,asset_block_uuid_str,asset_type,get_url);
})));

//# sourceMappingURL=frontend.handler.assets.js.map
