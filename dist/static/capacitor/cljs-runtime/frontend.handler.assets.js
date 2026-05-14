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
var G__62114 = path;
var G__62114__$1 = (((G__62114 == null))?null:frontend.handler.assets.clean_path_prefix(G__62114));
if((G__62114__$1 == null)){
return null;
} else {
return clojure.string.starts_with_QMARK_(G__62114__$1,"@");
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
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__62115_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,new cljs.core.Keyword(null,"dir","dir",1734754661).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__62115_SHARP_)));
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
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__62116_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__62116_SHARP_)));
}),medley.core.indexed.cljs$core$IFn$_invoke$arity$1(alias_dirs));
} else {
return null;
}
});
frontend.handler.assets.convert_platform_protocol = (function frontend$handler$assets$convert_platform_protocol(full_path){
var G__62117 = full_path;
if(cljs.core.truth_((function (){var and__5000__auto__ = typeof full_path === 'string';
if(and__5000__auto__){
return frontend.mobile.util.native_platform_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return clojure.string.replace_first(G__62117,/^(file:\/\/|assets:\/\/)/,logseq.common.config.capacitor_protocol_with_prefix);
} else {
return G__62117;
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
var G__62130 = (function (){var and__5000__auto____$2 = cljs.core.seq(frontend.handler.assets.get_alias_dirs());
if(and__5000__auto____$2){
return cljs.core.second(frontend.handler.assets.get_alias_by_name(cljs.core.second(cljs.core.re_find(/^@([^\\/]+)/,rpath_SINGLEQUOTE_))));
} else {
return and__5000__auto____$2;
}
})();
if((G__62130 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[rpath_SINGLEQUOTE_,G__62130],null));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var vec__62131 = temp__5802__auto__;
var rpath_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62131,(0),null);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62131,(1),null);
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
var protocol_link_QMARK_ = cljs.core.some((function (p1__62134_SHARP_){
return clojure.string.starts_with_QMARK_(clojure.string.lower_case(path),p1__62134_SHARP_);
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
var alias = medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p__62140){
var map__62141 = p__62140;
var map__62141__$1 = cljs.core.__destructure_map(map__62141);
var exts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62141__$1,new cljs.core.Keyword(null,"exts","exts",-946342126));
return cljs.core.some((function (p1__62138_SHARP_){
return clojure.string.ends_with_QMARK_(ext__$1,p1__62138_SHARP_);
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
var G__62147 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__62147__$1 = (((G__62147 instanceof cljs.core.Keyword))?G__62147.fqn:null);
switch (G__62147__$1) {
case "markdown":
var G__62150 = [(cljs.core.truth_((function (){var or__5002__auto__ = image_QMARK_;
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
var G__62151 = file_name;
var G__62152 = url;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__62150,G__62151,G__62152) : frontend.util.format.call(null,G__62150,G__62151,G__62152));

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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.assets._LT_make_data_url,fixed_rel_paths))),(function (blob_urls){
return promesa.protocols._promise(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (css__$1,p__62161){
var vec__62162 = p__62161;
var rel_path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62162,(0),null);
var blob_url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62162,(1),null);
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
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(path,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], null)], 0)),cljs.core.constantly(null))),(function (result){
return promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (path__$1){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$3(path__$1,"",cljs.core.PersistentArrayMap.EMPTY)),(function (data){
return promesa.protocols._promise((function (){var path_SINGLEQUOTE_ = (function (){var G__62187 = "assets";
var G__62188 = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(path__$1) : frontend.util.node_path.basename.call(null,path__$1));
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__62187,G__62188) : frontend.util.node_path.join.call(null,G__62187,G__62188));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.ensure_assets_dir_BANG_(frontend.state.get_current_repo())),(function (p__62197){
var vec__62198 = p__62197;
var repo_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62198,(0),null);
var assets_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62198,(1),null);
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
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr62223_block_0 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_0(cr62223_state){
try{var cr62223_place_0 = frontend.common.missionary._LT__BANG_;
var cr62223_place_1 = frontend.handler.assets._LT_read_asset;
var cr62223_place_2 = repo;
var cr62223_place_3 = asset_block_uuid_str;
var cr62223_place_4 = asset_type;
var cr62223_place_5 = (function (){var G__62395 = cr62223_place_2;
var G__62396 = cr62223_place_3;
var G__62397 = cr62223_place_4;
var fexpr__62394 = cr62223_place_1;
return (fexpr__62394.cljs$core$IFn$_invoke$arity$3 ? fexpr__62394.cljs$core$IFn$_invoke$arity$3(G__62395,G__62396,G__62397) : fexpr__62394.call(null,G__62395,G__62396,G__62397));
})();
var cr62223_place_6 = (function (){var G__62402 = cr62223_place_5;
var fexpr__62401 = cr62223_place_0;
return (fexpr__62401.cljs$core$IFn$_invoke$arity$1 ? fexpr__62401.cljs$core$IFn$_invoke$arity$1(G__62402) : fexpr__62401.call(null,G__62402));
})();
(cr62223_state[(0)] = cr62223_block_1);

return missionary.core.park(cr62223_place_6);
}catch (e62379){var cr62223_exception = e62379;
(cr62223_state[(0)] = null);

throw cr62223_exception;
}});
var cr62223_block_1 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_1(cr62223_state){
try{var cr62223_place_7 = missionary.core.unpark();
var cr62223_place_8 = cljs.core.atom;
var cr62223_place_9 = null;
var cr62223_place_10 = (function (){var G__62418 = cr62223_place_9;
var fexpr__62417 = cr62223_place_8;
return (fexpr__62417.cljs$core$IFn$_invoke$arity$1 ? fexpr__62417.cljs$core$IFn$_invoke$arity$1(G__62418) : fexpr__62417.call(null,G__62418));
})();
var cr62223_place_11 = cljs_http_missionary.client.put;
var cr62223_place_12 = put_url;
var cr62223_place_13 = new cljs.core.Keyword(null,"headers","headers",-835030129);
var cr62223_place_14 = "x-amz-meta-checksum";
var cr62223_place_15 = checksum;
var cr62223_place_16 = "x-amz-meta-type";
var cr62223_place_17 = asset_type;
var cr62223_place_18 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62223_place_14,cr62223_place_15,cr62223_place_16,cr62223_place_17]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr62223_place_19 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr62223_place_20 = cr62223_place_7;
var cr62223_place_21 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr62223_place_22 = false;
var cr62223_place_23 = new cljs.core.Keyword(null,"*progress-flow","*progress-flow",2049066069);
var cr62223_place_24 = cr62223_place_10;
var cr62223_place_25 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62223_place_23,cr62223_place_24,cr62223_place_19,cr62223_place_20,cr62223_place_13,cr62223_place_18,cr62223_place_21,cr62223_place_22]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr62223_place_26 = (function (){var G__62421 = cr62223_place_12;
var G__62422 = cr62223_place_25;
var fexpr__62420 = cr62223_place_11;
return (fexpr__62420.cljs$core$IFn$_invoke$arity$2 ? fexpr__62420.cljs$core$IFn$_invoke$arity$2(G__62421,G__62422) : fexpr__62420.call(null,G__62421,G__62422));
})();
var cr62223_place_27 = frontend.common.missionary.run_task;
var cr62223_place_28 = new cljs.core.Keyword(null,"upload-asset-progress","upload-asset-progress",1958748115);
var cr62223_place_29 = missionary.core.reduce;
var cr62223_place_30 = (function (_,v){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),(function (m){
return cljs.core.assoc_in(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,asset_block_uuid_str], null),v);
}));
});
var cr62223_place_31 = cljs.core.deref;
var cr62223_place_32 = cr62223_place_10;
var cr62223_place_33 = (function (){var G__62424 = cr62223_place_32;
var fexpr__62423 = cr62223_place_31;
return (fexpr__62423.cljs$core$IFn$_invoke$arity$1 ? fexpr__62423.cljs$core$IFn$_invoke$arity$1(G__62424) : fexpr__62423.call(null,G__62424));
})();
var cr62223_place_34 = (function (){var G__62426 = cr62223_place_30;
var G__62427 = cr62223_place_33;
var fexpr__62425 = cr62223_place_29;
return (fexpr__62425.cljs$core$IFn$_invoke$arity$2 ? fexpr__62425.cljs$core$IFn$_invoke$arity$2(G__62426,G__62427) : fexpr__62425.call(null,G__62426,G__62427));
})();
var cr62223_place_35 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr62223_place_36 = cljs.core.constantly;
var cr62223_place_37 = null;
var cr62223_place_38 = (function (){var G__62430 = cr62223_place_37;
var fexpr__62429 = cr62223_place_36;
return (fexpr__62429.cljs$core$IFn$_invoke$arity$1 ? fexpr__62429.cljs$core$IFn$_invoke$arity$1(G__62430) : fexpr__62429.call(null,G__62430));
})();
var cr62223_place_39 = (function (){var G__62432 = cr62223_place_28;
var G__62433 = cr62223_place_34;
var G__62434 = cr62223_place_35;
var G__62435 = cr62223_place_38;
var fexpr__62431 = cr62223_place_27;
return (fexpr__62431.cljs$core$IFn$_invoke$arity$4 ? fexpr__62431.cljs$core$IFn$_invoke$arity$4(G__62432,G__62433,G__62434,G__62435) : fexpr__62431.call(null,G__62432,G__62433,G__62434,G__62435));
})();
var cr62223_place_40 = cr62223_place_26;
(cr62223_state[(0)] = cr62223_block_2);

return missionary.core.park(cr62223_place_40);
}catch (e62416){var cr62223_exception = e62416;
(cr62223_state[(0)] = null);

throw cr62223_exception;
}});
var cr62223_block_2 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_2(cr62223_state){
try{var cr62223_place_41 = missionary.core.unpark();
var cr62223_place_42 = cljs.core.__destructure_map;
var cr62223_place_43 = cr62223_place_41;
var cr62223_place_44 = (function (){var G__62444 = cr62223_place_43;
var fexpr__62443 = cr62223_place_42;
return (fexpr__62443.cljs$core$IFn$_invoke$arity$1 ? fexpr__62443.cljs$core$IFn$_invoke$arity$1(G__62444) : fexpr__62443.call(null,G__62444));
})();
var cr62223_place_45 = cr62223_place_44;
var cr62223_place_46 = cljs.core.get;
var cr62223_place_47 = cr62223_place_44;
var cr62223_place_48 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr62223_place_49 = (function (){var G__62447 = cr62223_place_47;
var G__62448 = cr62223_place_48;
var fexpr__62446 = cr62223_place_46;
return (fexpr__62446.cljs$core$IFn$_invoke$arity$2 ? fexpr__62446.cljs$core$IFn$_invoke$arity$2(G__62447,G__62448) : fexpr__62446.call(null,G__62447,G__62448));
})();
var cr62223_place_50 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr62223_place_51 = cr62223_place_49;
var cr62223_place_52 = (function (){var G__62450 = cr62223_place_51;
var fexpr__62449 = cr62223_place_50;
return (fexpr__62449.cljs$core$IFn$_invoke$arity$1 ? fexpr__62449.cljs$core$IFn$_invoke$arity$1(G__62450) : fexpr__62449.call(null,G__62450));
})();
var cr62223_place_53 = null;
if(cljs.core.truth_(cr62223_place_52)){
(cr62223_state[(0)] = cr62223_block_4);

(cr62223_state[(2)] = cr62223_place_53);

return cr62223_state;
} else {
(cr62223_state[(0)] = cr62223_block_3);

(cr62223_state[(1)] = cr62223_place_45);

(cr62223_state[(2)] = cr62223_place_53);

return cr62223_state;
}
}catch (e62441){var cr62223_exception = e62441;
(cr62223_state[(0)] = null);

throw cr62223_exception;
}});
var cr62223_block_3 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_3(cr62223_state){
try{var cr62223_place_45 = (cr62223_state[(1)]);
var cr62223_place_54 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr62223_place_55 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr62223_place_56 = new cljs.core.Keyword("rtc.exception","upload-asset-failed","rtc.exception/upload-asset-failed",811855372);
var cr62223_place_57 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr62223_place_58 = cljs.core.dissoc;
var cr62223_place_59 = cr62223_place_45;
var cr62223_place_60 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr62223_place_61 = (function (){var G__62454 = cr62223_place_59;
var G__62455 = cr62223_place_60;
var fexpr__62453 = cr62223_place_58;
return (fexpr__62453.cljs$core$IFn$_invoke$arity$2 ? fexpr__62453.cljs$core$IFn$_invoke$arity$2(G__62454,G__62455) : fexpr__62453.call(null,G__62454,G__62455));
})();
var cr62223_place_62 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62223_place_57,cr62223_place_61,cr62223_place_55,cr62223_place_56]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr62223_place_63 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62223_place_54,cr62223_place_62]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr62223_state[(0)] = cr62223_block_5);

(cr62223_state[(1)] = null);

(cr62223_state[(2)] = cr62223_place_63);

return cr62223_state;
}catch (e62452){var cr62223_exception = e62452;
(cr62223_state[(0)] = null);

(cr62223_state[(1)] = null);

(cr62223_state[(2)] = null);

throw cr62223_exception;
}});
var cr62223_block_4 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_4(cr62223_state){
try{var cr62223_place_64 = null;
(cr62223_state[(0)] = cr62223_block_5);

(cr62223_state[(2)] = cr62223_place_64);

return cr62223_state;
}catch (e62462){var cr62223_exception = e62462;
(cr62223_state[(0)] = null);

(cr62223_state[(2)] = null);

throw cr62223_exception;
}});
var cr62223_block_5 = (function frontend$handler$assets$new_task__rtc_upload_asset_$_cr62223_block_5(cr62223_state){
try{var cr62223_place_53 = (cr62223_state[(2)]);
(cr62223_state[(0)] = null);

(cr62223_state[(2)] = null);

return cr62223_place_53;
}catch (e62463){var cr62223_exception = e62463;
(cr62223_state[(0)] = null);

(cr62223_state[(2)] = null);

throw cr62223_exception;
}});
return cloroutine.impl.coroutine((function (){var G__62464 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__62464[(0)] = cr62223_block_0);

return G__62464;
})());
})(),missionary.core.sp_run);
});
frontend.handler.assets.new_task__rtc_download_asset = (function frontend$handler$assets$new_task__rtc_download_asset(repo,asset_block_uuid_str,asset_type,get_url){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr62465_block_9 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_9(cr62465_state){
try{var cr62465_place_74 = null;
(cr62465_state[(0)] = cr62465_block_11);

(cr62465_state[(4)] = cr62465_place_74);

return cr62465_state;
}catch (e62532){var cr62465_exception = e62532;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(4)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_1 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_1(cr62465_state){
try{var cr62465_place_12 = (cr62465_state[(4)]);
var cr62465_place_28 = cr62465_place_12;
(cr62465_state[(0)] = cr62465_block_2);

(cr62465_state[(4)] = null);

return missionary.core.park(cr62465_place_28);
}catch (e62533){var cr62465_exception = e62533;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(4)] = null);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_0 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_0(cr62465_state){
try{var cr62465_place_0 = cljs.core.atom;
var cr62465_place_1 = null;
var cr62465_place_2 = (function (){var G__62536 = cr62465_place_1;
var fexpr__62535 = cr62465_place_0;
return (fexpr__62535.cljs$core$IFn$_invoke$arity$1 ? fexpr__62535.cljs$core$IFn$_invoke$arity$1(G__62536) : fexpr__62535.call(null,G__62536));
})();
var cr62465_place_3 = cljs_http_missionary.client.get;
var cr62465_place_4 = get_url;
var cr62465_place_5 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr62465_place_6 = false;
var cr62465_place_7 = new cljs.core.Keyword(null,"response-type","response-type",-1493770458);
var cr62465_place_8 = new cljs.core.Keyword(null,"array-buffer","array-buffer",519008380);
var cr62465_place_9 = new cljs.core.Keyword(null,"*progress-flow","*progress-flow",2049066069);
var cr62465_place_10 = cr62465_place_2;
var cr62465_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62465_place_9,cr62465_place_10,cr62465_place_5,cr62465_place_6,cr62465_place_7,cr62465_place_8]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr62465_place_12 = (function (){var G__62538 = cr62465_place_4;
var G__62539 = cr62465_place_11;
var fexpr__62537 = cr62465_place_3;
return (fexpr__62537.cljs$core$IFn$_invoke$arity$2 ? fexpr__62537.cljs$core$IFn$_invoke$arity$2(G__62538,G__62539) : fexpr__62537.call(null,G__62538,G__62539));
})();
var cr62465_place_13 = frontend.common.missionary.run_task;
var cr62465_place_14 = new cljs.core.Keyword(null,"download-asset-progress","download-asset-progress",-1253479373);
var cr62465_place_15 = missionary.core.reduce;
var cr62465_place_16 = (function (_,v){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),(function (m){
return cljs.core.assoc_in(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,asset_block_uuid_str], null),v);
}));
});
var cr62465_place_17 = cljs.core.deref;
var cr62465_place_18 = cr62465_place_2;
var cr62465_place_19 = (function (){var G__62541 = cr62465_place_18;
var fexpr__62540 = cr62465_place_17;
return (fexpr__62540.cljs$core$IFn$_invoke$arity$1 ? fexpr__62540.cljs$core$IFn$_invoke$arity$1(G__62541) : fexpr__62540.call(null,G__62541));
})();
var cr62465_place_20 = (function (){var G__62543 = cr62465_place_16;
var G__62544 = cr62465_place_19;
var fexpr__62542 = cr62465_place_15;
return (fexpr__62542.cljs$core$IFn$_invoke$arity$2 ? fexpr__62542.cljs$core$IFn$_invoke$arity$2(G__62543,G__62544) : fexpr__62542.call(null,G__62543,G__62544));
})();
var cr62465_place_21 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr62465_place_22 = cljs.core.constantly;
var cr62465_place_23 = null;
var cr62465_place_24 = (function (){var G__62546 = cr62465_place_23;
var fexpr__62545 = cr62465_place_22;
return (fexpr__62545.cljs$core$IFn$_invoke$arity$1 ? fexpr__62545.cljs$core$IFn$_invoke$arity$1(G__62546) : fexpr__62545.call(null,G__62546));
})();
var cr62465_place_25 = (function (){var G__62548 = cr62465_place_14;
var G__62549 = cr62465_place_20;
var G__62550 = cr62465_place_21;
var G__62551 = cr62465_place_24;
var fexpr__62547 = cr62465_place_13;
return (fexpr__62547.cljs$core$IFn$_invoke$arity$4 ? fexpr__62547.cljs$core$IFn$_invoke$arity$4(G__62548,G__62549,G__62550,G__62551) : fexpr__62547.call(null,G__62548,G__62549,G__62550,G__62551));
})();
var cr62465_place_26 = null;
var cr62465_place_27 = false;
(cr62465_state[(0)] = cr62465_block_1);

(cr62465_state[(1)] = cr62465_place_25);

(cr62465_state[(2)] = cr62465_place_27);

(cr62465_state[(3)] = cr62465_place_26);

(cr62465_state[(4)] = cr62465_place_12);

return cr62465_state;
}catch (e62534){var cr62465_exception = e62534;
(cr62465_state[(0)] = null);

throw cr62465_exception;
}});
var cr62465_block_2 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_2(cr62465_state){
try{var cr62465_place_29 = missionary.core.unpark();
var cr62465_place_30 = cljs.core.__destructure_map;
var cr62465_place_31 = cr62465_place_29;
var cr62465_place_32 = (function (){var G__62554 = cr62465_place_31;
var fexpr__62553 = cr62465_place_30;
return (fexpr__62553.cljs$core$IFn$_invoke$arity$1 ? fexpr__62553.cljs$core$IFn$_invoke$arity$1(G__62554) : fexpr__62553.call(null,G__62554));
})();
var cr62465_place_33 = cr62465_place_32;
var cr62465_place_34 = cljs.core.get;
var cr62465_place_35 = cr62465_place_32;
var cr62465_place_36 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr62465_place_37 = (function (){var G__62556 = cr62465_place_35;
var G__62557 = cr62465_place_36;
var fexpr__62555 = cr62465_place_34;
return (fexpr__62555.cljs$core$IFn$_invoke$arity$2 ? fexpr__62555.cljs$core$IFn$_invoke$arity$2(G__62556,G__62557) : fexpr__62555.call(null,G__62556,G__62557));
})();
var cr62465_place_38 = cljs.core.get;
var cr62465_place_39 = cr62465_place_32;
var cr62465_place_40 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr62465_place_41 = (function (){var G__62559 = cr62465_place_39;
var G__62560 = cr62465_place_40;
var fexpr__62558 = cr62465_place_38;
return (fexpr__62558.cljs$core$IFn$_invoke$arity$2 ? fexpr__62558.cljs$core$IFn$_invoke$arity$2(G__62559,G__62560) : fexpr__62558.call(null,G__62559,G__62560));
})();
var cr62465_place_42 = cljs.core.not;
var cr62465_place_43 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr62465_place_44 = cr62465_place_37;
var cr62465_place_45 = (function (){var G__62562 = cr62465_place_44;
var fexpr__62561 = cr62465_place_43;
return (fexpr__62561.cljs$core$IFn$_invoke$arity$1 ? fexpr__62561.cljs$core$IFn$_invoke$arity$1(G__62562) : fexpr__62561.call(null,G__62562));
})();
var cr62465_place_46 = (function (){var G__62564 = cr62465_place_45;
var fexpr__62563 = cr62465_place_42;
return (fexpr__62563.cljs$core$IFn$_invoke$arity$1 ? fexpr__62563.cljs$core$IFn$_invoke$arity$1(G__62564) : fexpr__62563.call(null,G__62564));
})();
var cr62465_place_47 = null;
if(cljs.core.truth_(cr62465_place_46)){
(cr62465_state[(0)] = cr62465_block_5);

(cr62465_state[(4)] = cr62465_place_33);

(cr62465_state[(5)] = cr62465_place_47);

return cr62465_state;
} else {
(cr62465_state[(0)] = cr62465_block_3);

(cr62465_state[(4)] = cr62465_place_41);

(cr62465_state[(5)] = cr62465_place_47);

return cr62465_state;
}
}catch (e62552){var cr62465_exception = e62552;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_11 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_11(cr62465_state){
try{var cr62465_place_73 = (cr62465_state[(4)]);
(cr62465_state[(0)] = cr62465_block_13);

(cr62465_state[(4)] = null);

(cr62465_state[(1)] = cr62465_place_73);

return cr62465_state;
}catch (e62565){var cr62465_exception = e62565;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(4)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_6 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_6(cr62465_state){
try{var cr62465_place_47 = (cr62465_state[(5)]);
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(5)] = null);

(cr62465_state[(3)] = cr62465_place_47);

return cr62465_state;
}catch (e62566){var cr62465_exception = e62566;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(5)] = null);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_13 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_13(cr62465_state){
try{var cr62465_place_71 = (cr62465_state[(1)]);
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(3)] = cr62465_place_71);

return cr62465_state;
}catch (e62567){var cr62465_exception = e62567;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_8 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_8(cr62465_state){
try{var cr62465_place_72 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr62465_place_73 = null;
if(cljs.core.truth_(cr62465_place_72)){
(cr62465_state[(0)] = cr62465_block_10);

(cr62465_state[(1)] = null);

return cr62465_state;
} else {
(cr62465_state[(0)] = cr62465_block_9);

(cr62465_state[(4)] = cr62465_place_73);

return cr62465_state;
}
}catch (e62568){var cr62465_exception = e62568;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_7 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_7(cr62465_state){
try{var cr62465_place_26 = (cr62465_state[(3)]);
var cr62465_place_68 = cr62465_place_26;
var cr62465_place_69 = missionary.Cancelled;
var cr62465_place_70 = (cr62465_place_68 instanceof cr62465_place_69);
var cr62465_place_71 = null;
if(cr62465_place_70){
(cr62465_state[(0)] = cr62465_block_12);

return cr62465_state;
} else {
(cr62465_state[(0)] = cr62465_block_8);

(cr62465_state[(1)] = null);

(cr62465_state[(1)] = cr62465_place_71);

return cr62465_state;
}
}catch (e62573){var cr62465_exception = e62573;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_5 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_5(cr62465_state){
try{var cr62465_place_33 = (cr62465_state[(4)]);
var cr62465_place_58 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr62465_place_59 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr62465_place_60 = new cljs.core.Keyword("rtc.exception","download-asset-failed","rtc.exception/download-asset-failed",1700970262);
var cr62465_place_61 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr62465_place_62 = cljs.core.dissoc;
var cr62465_place_63 = cr62465_place_33;
var cr62465_place_64 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr62465_place_65 = (function (){var G__62578 = cr62465_place_63;
var G__62579 = cr62465_place_64;
var fexpr__62577 = cr62465_place_62;
return (fexpr__62577.cljs$core$IFn$_invoke$arity$2 ? fexpr__62577.cljs$core$IFn$_invoke$arity$2(G__62578,G__62579) : fexpr__62577.call(null,G__62578,G__62579));
})();
var cr62465_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62465_place_61,cr62465_place_65,cr62465_place_59,cr62465_place_60]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr62465_place_67 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr62465_place_58,cr62465_place_66]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr62465_state[(0)] = cr62465_block_6);

(cr62465_state[(4)] = null);

(cr62465_state[(5)] = cr62465_place_67);

return cr62465_state;
}catch (e62574){var cr62465_exception = e62574;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(4)] = null);

(cr62465_state[(5)] = null);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_14 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_14(cr62465_state){
try{var cr62465_place_27 = (cr62465_state[(2)]);
var cr62465_place_26 = (cr62465_state[(3)]);
var cr62465_place_82 = (cljs.core.truth_(cr62465_place_27)?(function(){throw cr62465_place_26})():cr62465_place_26);
(cr62465_state[(0)] = null);

(cr62465_state[(2)] = null);

(cr62465_state[(3)] = null);

return cr62465_place_82;
}catch (e62580){var cr62465_exception = e62580;
(cr62465_state[(0)] = null);

(cr62465_state[(2)] = null);

(cr62465_state[(3)] = null);

throw cr62465_exception;
}});
var cr62465_block_4 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_4(cr62465_state){
try{var cr62465_place_56 = missionary.core.unpark();
var cr62465_place_57 = null;
(cr62465_state[(0)] = cr62465_block_6);

(cr62465_state[(5)] = cr62465_place_57);

return cr62465_state;
}catch (e62581){var cr62465_exception = e62581;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(5)] = null);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_12 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_12(cr62465_state){
try{var cr62465_place_25 = (cr62465_state[(1)]);
var cr62465_place_26 = (cr62465_state[(3)]);
var cr62465_place_77 = cr62465_place_26;
var cr62465_place_78 = cr62465_place_25;
var cr62465_place_79 = cr62465_place_78();
var cr62465_place_80 = cr62465_place_77;
var cr62465_place_81 = (function(){throw cr62465_place_80})();
(cr62465_state[(0)] = null);

(cr62465_state[(1)] = null);

(cr62465_state[(2)] = null);

(cr62465_state[(3)] = null);

return null;
}catch (e62582){var cr62465_exception = e62582;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(1)] = null);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_10 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_10(cr62465_state){
try{var cr62465_place_26 = (cr62465_state[(3)]);
var cr62465_place_75 = cr62465_place_26;
var cr62465_place_76 = (function(){throw cr62465_place_75})();
(cr62465_state[(0)] = null);

(cr62465_state[(2)] = null);

(cr62465_state[(3)] = null);

return null;
}catch (e62583){var cr62465_exception = e62583;
(cr62465_state[(0)] = cr62465_block_14);

(cr62465_state[(2)] = true);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
var cr62465_block_3 = (function frontend$handler$assets$new_task__rtc_download_asset_$_cr62465_block_3(cr62465_state){
try{var cr62465_place_41 = (cr62465_state[(4)]);
var cr62465_place_48 = frontend.common.missionary._LT__BANG_;
var cr62465_place_49 = frontend.handler.assets._LT_write_asset;
var cr62465_place_50 = repo;
var cr62465_place_51 = asset_block_uuid_str;
var cr62465_place_52 = asset_type;
var cr62465_place_53 = cr62465_place_41;
var cr62465_place_54 = (function (){var G__62587 = cr62465_place_50;
var G__62588 = cr62465_place_51;
var G__62589 = cr62465_place_52;
var G__62590 = cr62465_place_53;
var fexpr__62586 = cr62465_place_49;
return (fexpr__62586.cljs$core$IFn$_invoke$arity$4 ? fexpr__62586.cljs$core$IFn$_invoke$arity$4(G__62587,G__62588,G__62589,G__62590) : fexpr__62586.call(null,G__62587,G__62588,G__62589,G__62590));
})();
var cr62465_place_55 = (function (){var G__62592 = cr62465_place_54;
var fexpr__62591 = cr62465_place_48;
return (fexpr__62591.cljs$core$IFn$_invoke$arity$1 ? fexpr__62591.cljs$core$IFn$_invoke$arity$1(G__62592) : fexpr__62591.call(null,G__62592));
})();
(cr62465_state[(0)] = cr62465_block_4);

(cr62465_state[(4)] = null);

return missionary.core.park(cr62465_place_55);
}catch (e62585){var cr62465_exception = e62585;
(cr62465_state[(0)] = cr62465_block_7);

(cr62465_state[(4)] = null);

(cr62465_state[(5)] = null);

(cr62465_state[(3)] = cr62465_exception);

return cr62465_state;
}});
return cloroutine.impl.coroutine((function (){var G__62593 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__62593[(0)] = cr62465_block_0);

return G__62593;
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
