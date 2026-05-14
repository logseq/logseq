goog.provide('frontend.handler.export$');
var module$node_modules$$capacitor$filesystem$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$filesystem$dist$plugin_cjs", {});
/**
 * download public pages as html
 */
frontend.handler.export$.download_repo_as_html_BANG_ = (function frontend$handler$export$download_repo_as_html_BANG_(repo){
var temp__5804__auto__ = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var map__104000 = logseq.publishing.html.build_html(db,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"app-state","app-state",-1509963278),cljs.core.select_keys(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","theme","ui/theme",-1247877132),new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921)], null)),new cljs.core.Keyword(null,"repo-config","repo-config",1551936565),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),repo], null)),new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)], null));
var map__104000__$1 = cljs.core.__destructure_map(map__104000);
var asset_filenames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104000__$1,new cljs.core.Keyword(null,"asset-filenames","asset-filenames",-2076716428));
var html = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104000__$1,new cljs.core.Keyword(null,"html","html",-998796897));
var html_str = ["data:text/html;charset=UTF-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(html))].join('');
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return window.apis.exportPublishAssets(html,frontend.config.get_repo_dir(repo),cljs.core.clj__GT_js(asset_filenames),frontend.util.mocked_open_dir_path());
} else {
var temp__5804__auto____$1 = goog.dom.getElement("download-as-html");
if(cljs.core.truth_(temp__5804__auto____$1)){
var anchor = temp__5804__auto____$1;
anchor.setAttribute("href",html_str);

anchor.setAttribute("download","index.html");

return anchor.click();
} else {
return null;
}
}
} else {
return null;
}
});
frontend.handler.export$.db_based_export_repo_as_zip_BANG_ = (function frontend$handler$export$db_based_export_repo_as_zip_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"return-data?","return-data?",-956653504),true], null))),(function (db_data){
return promesa.protocols._mcat(promesa.protocols._promise("db.sqlite"),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.common.sqlite.sanitize_db_name(repo)),(function (repo_name){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets._LT_get_all_assets()),(function (assets){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [filename,db_data], null),assets)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zip.make_zip(repo_name,files,repo)),(function (zipfile){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("download-as-zip");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",window.URL.createObjectURL(zipfile));

anchor.setAttribute("download",zipfile.name);

return anchor.click();
} else {
return null;
}
})());
}));
}));
}));
}));
}));
}));
}));
});
frontend.handler.export$.file_based_export_repo_as_zip_BANG_ = (function frontend$handler$export$file_based_export_repo_as_zip_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_file_contents(repo,"md")),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.get_git_owner_and_repo(repo)),(function (p__104007){
var vec__104008 = p__104007;
var owner = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104008,(0),null);
var repo_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104008,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(owner),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_name)].join('')),(function (repo_name__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__104012){
var map__104013 = p__104012;
var map__104013__$1 = cljs.core.__destructure_map(map__104013);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104013__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__104013__$1,new cljs.core.Keyword(null,"content","content",15833224));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path,content], null);
}),files)),(function (files__$1){
return promesa.protocols._promise(((cljs.core.seq(files__$1))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zip.make_zip(repo_name__$1,files__$1,repo)),(function (zipfile){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("download-as-zip");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",window.URL.createObjectURL(zipfile));

anchor.setAttribute("download",zipfile.name);

return anchor.click();
} else {
return null;
}
})());
}));
})):null));
}));
}));
}));
}));
}));
});
frontend.handler.export$.export_repo_as_zip_BANG_ = (function frontend$handler$export$export_repo_as_zip_BANG_(repo){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.export$.db_based_export_repo_as_zip_BANG_(repo);
} else {
return frontend.handler.export$.file_based_export_repo_as_zip_BANG_(repo);
}
});
frontend.handler.export$.export_file_on_mobile = (function frontend$handler$export$export_file_on_mobile(data,path){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$3(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.writeFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"data","data",-232669377),data,new cljs.core.Keyword(null,"encoding","encoding",1728578272),module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Encoding.UTF8,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null))),frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Export succeeded! You can find you exported file in the root directory of your graph.",new cljs.core.Keyword(null,"success","success",1890645906)),(function (error){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Export failed!",new cljs.core.Keyword(null,"error","error",-978969032));

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.export",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"export-file-failed","export-file-failed",-1288219575),error,new cljs.core.Keyword(null,"line","line",212345235),98], null)),null);
}));
});
frontend.handler.export$.dissoc_properties = (function frontend$handler$export$dissoc_properties(m,ks){
if(cljs.core.truth_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(m))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","properties","block/properties",708347145),(function (v){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,v,ks);
}));
} else {
return m;
}
});
frontend.handler.export$.nested_select_keys = (function frontend$handler$export$nested_select_keys(keyseq,vec_tree){
return clojure.walk.postwalk((function (x){
if(((cljs.core.map_QMARK_(x)) && (cljs.core.contains_QMARK_(x,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))))){
return cljs.core.select_keys(frontend.handler.export$.dissoc_properties(clojure.set.rename_keys(x,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","id","block/id",-1461684825),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","page-name","block/page-name",780489999)], null)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092)], null)),keyseq);
} else {
return x;

}
}),vec_tree);
});
frontend.handler.export$._LT_build_blocks = (function frontend$handler$export$_LT_build_blocks(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_all_pages(repo)),(function (pages){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"version","version",425292698),(1),new cljs.core.Keyword(null,"blocks","blocks",-610462153),frontend.handler.export$.nested_select_keys(new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","id","block/id",-1461684825),new cljs.core.Keyword("block","type","block/type",1537584409),new cljs.core.Keyword("block","page-name","block/page-name",780489999),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","children","block/children",-1040716209),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null),pages)], null));
}));
}));
});
frontend.handler.export$.file_name = (function frontend$handler$export$file_name(repo,extension){
return [[clojure.string.replace(clojure.string.replace(repo,frontend.config.local_db_prefix,""),/^\/+/,""),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.quot((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),(1000)))].join(''),".",clojure.string.lower_case(cljs.core.name(extension))].join('');
});
frontend.handler.export$._LT_export_repo_as_edn_str = (function frontend$handler$export$_LT_export_repo_as_edn_str(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$._LT_build_blocks(repo)),(function (result){
return promesa.protocols._promise((function (){var sb = (new goog.string.StringBuffer());
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$2(result,(new cljs.core.StringBufferWriter(sb)));

return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb);
})());
}));
}));
});
frontend.handler.export$.export_repo_as_edn_BANG_ = (function frontend$handler$export$export_repo_as_edn_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$._LT_export_repo_as_edn_str(repo)),(function (edn_str){
return promesa.protocols._promise((cljs.core.truth_(edn_str)?(function (){var data_str = (function (){var G__104016 = edn_str;
var G__104016__$1 = (((G__104016 == null))?null:encodeURIComponent(G__104016));
if((G__104016__$1 == null)){
return null;
} else {
return ["data:text/edn;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__104016__$1)].join('');
}
})();
var filename = frontend.handler.export$.file_name(repo,new cljs.core.Keyword(null,"edn","edn",1317840885));
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.handler.export$.export_file_on_mobile(edn_str,filename);
} else {
var temp__5804__auto__ = goog.dom.getElement("download-as-edn-v2");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",data_str);

anchor.setAttribute("download",filename);

return anchor.click();
} else {
return null;
}
}
})():null));
}));
}));
});
frontend.handler.export$.nested_update_id = (function frontend$handler$export$nested_update_id(vec_tree){
return clojure.walk.postwalk((function (x){
if(((cljs.core.map_QMARK_(x)) && (cljs.core.contains_QMARK_(x,new cljs.core.Keyword("block","id","block/id",-1461684825))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(x,new cljs.core.Keyword("block","id","block/id",-1461684825),cljs.core.str);
} else {
return x;
}
}),vec_tree);
});
frontend.handler.export$.export_repo_as_json_BANG_ = (function frontend$handler$export$export_repo_as_json_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$._LT_build_blocks(repo)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(JSON.stringify(cljs.core.clj__GT_js(frontend.handler.export$.nested_update_id(result)))),(function (json_str){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.file_name(repo,new cljs.core.Keyword(null,"json","json",1279968570))),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(["data:text/json;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(json_str))].join('')),(function (data_str){
return promesa.protocols._promise((cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?frontend.handler.export$.export_file_on_mobile(json_str,filename):(function (){var temp__5804__auto__ = goog.dom.getElement("download-as-json-v2");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",data_str);

anchor.setAttribute("download",filename);

return anchor.click();
} else {
return null;
}
})()));
}));
}));
}));
}));
}));
});
frontend.handler.export$.export_repo_as_debug_transit_BANG_ = (function frontend$handler$export$export_repo_as_debug_transit_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_debug_datoms(repo)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.file_name([cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"-debug-datoms"].join(''),new cljs.core.Keyword(null,"transit","transit",359458387))),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(["data:text/transit;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(logseq.db.write_transit_str(result)))].join('')),(function (data_str){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("download-as-transit-debug");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",data_str);

anchor.setAttribute("download",filename);

return anchor.click();
} else {
return null;
}
})());
}));
}));
}));
}));
});
frontend.handler.export$.export_repo_as_sqlite_db_BANG_ = (function frontend$handler$export$export_repo_as_sqlite_db_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"return-data?","return-data?",-956653504),true], null))),(function (data){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.file_name(repo,"sqlite")),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(URL.createObjectURL((new Blob([data])))),(function (url){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("download-as-sqlite-db");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",url);

anchor.setAttribute("download",filename);

return anchor.click();
} else {
return null;
}
})());
}));
}));
}));
}));
});
frontend.handler.export$._LT_roam_data = (function frontend$handler$export$_LT_roam_data(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_all_pages(repo)),(function (pages){
return promesa.protocols._promise((function (){var non_empty_pages = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__104033_SHARP_){
return cljs.core.empty_QMARK_(new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$1(p1__104033_SHARP_));
}),pages);
return frontend.external.roam_export.traverse(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","title","page/title",628894782),new cljs.core.Keyword("block","string","block/string",-2066596447),new cljs.core.Keyword("block","uid","block/uid",-1623585167),new cljs.core.Keyword("block","children","block/children",-1040716209)], null),non_empty_pages);
})());
}));
}));
});
frontend.handler.export$.export_repo_as_roam_json_BANG_ = (function frontend$handler$export$export_repo_as_roam_json_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$._LT_roam_data(repo)),(function (data){
return promesa.protocols._mcat(promesa.protocols._promise(JSON.stringify(cljs_bean.core.__GT_js(data))),(function (json_str){
return promesa.protocols._mcat(promesa.protocols._promise(["data:text/json;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(json_str))].join('')),(function (data_str){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("download-as-roam-json");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",data_str);

anchor.setAttribute("download",frontend.handler.export$.file_name([cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"_roam"].join(''),new cljs.core.Keyword(null,"json","json",1279968570)));

return anchor.click();
} else {
return null;
}
})());
}));
}));
}));
}));
});
/**
 * reserve the latest 12 version files
 */
frontend.handler.export$.truncate_old_versioned_files_BANG_ = (function frontend$handler$export$truncate_old_versioned_files_BANG_(backups_handle){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$frontend$utils.getFiles(backups_handle,true)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.drop.cljs$core$IFn$_invoke$arity$2((12),cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (file){
return file.name;
}),files)))),(function (old_versioned_files){
return promesa.protocols._promise(promesa.core.map.cljs$core$IFn$_invoke$arity$2((function (files__$1){
var seq__104034 = cljs.core.seq(files__$1);
var chunk__104035 = null;
var count__104036 = (0);
var i__104037 = (0);
while(true){
if((i__104037 < count__104036)){
var file = chunk__104035.cljs$core$IIndexed$_nth$arity$2(null,i__104037);
file.handle.remove();


var G__104102 = seq__104034;
var G__104103 = chunk__104035;
var G__104104 = count__104036;
var G__104105 = (i__104037 + (1));
seq__104034 = G__104102;
chunk__104035 = G__104103;
count__104036 = G__104104;
i__104037 = G__104105;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__104034);
if(temp__5804__auto__){
var seq__104034__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__104034__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__104034__$1);
var G__104106 = cljs.core.chunk_rest(seq__104034__$1);
var G__104107 = c__5525__auto__;
var G__104108 = cljs.core.count(c__5525__auto__);
var G__104109 = (0);
seq__104034 = G__104106;
chunk__104035 = G__104107;
count__104036 = G__104108;
i__104037 = G__104109;
continue;
} else {
var file = cljs.core.first(seq__104034__$1);
file.handle.remove();


var G__104110 = cljs.core.next(seq__104034__$1);
var G__104111 = null;
var G__104112 = (0);
var G__104113 = (0);
seq__104034 = G__104110;
chunk__104035 = G__104111;
count__104036 = G__104112;
i__104037 = G__104113;
continue;
}
} else {
return null;
}
}
break;
}
}),old_versioned_files));
}));
}));
}));
});
frontend.handler.export$.choose_backup_folder = (function frontend$handler$export$choose_backup_folder(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$frontend$utils.openDirectory(({"mode": "readwrite"}))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(result)),(function (handle){
return promesa.protocols._mcat(promesa.protocols._promise(handle.name),(function (folder_name){
return promesa.protocols._mcat(promesa.protocols._promise(console.dir(handle)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.set_item_BANG_(["handle/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(btoa(repo)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(folder_name)].join(''),handle)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532),folder_name) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532),folder_name))], null))),(function (___41611__auto____$2){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [folder_name,handle], null));
}));
}));
}));
}));
}));
}));
}));
});
frontend.handler.export$.backup_db_graph = (function frontend$handler$export$backup_db_graph(repo,_backup_type){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,frontend.state.get_current_repo());
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = logseq.db.get_key_value((frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo)),new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532));
if(cljs.core.truth_(temp__5804__auto__)){
var backup_folder = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){try{return frontend.idb.get_item(["handle/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(btoa(repo)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(backup_folder)].join(''));
}catch (e104040){var _e = e104040;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Backup file handle no longer exists",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null));
}})()),(function (handle){
return promesa.protocols._mcat(promesa.protocols._promise((function (){try{module$frontend$utils.verifyPermission(handle,true);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [backup_folder,handle], null);
}catch (e104041){var e = e104041;
console.error(e);

return frontend.handler.export$.choose_backup_folder(repo);
}})()),(function (p__104042){
var vec__104043 = p__104042;
var _folder = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104043,(0),null);
var handle__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104043,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.common.sqlite.sanitize_db_name(repo)),(function (repo_name){
return promesa.protocols._promise((cljs.core.truth_(handle__$1)?promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(handle__$1.getDirectoryHandle(repo_name,({"create": true}))),(function (graph_dir_handle){
return promesa.protocols._mcat(promesa.protocols._promise(graph_dir_handle.getDirectoryHandle("backups",({"create": true}))),(function (backups_handle){
return promesa.protocols._mcat(promesa.protocols._promise(graph_dir_handle.getFileHandle("db.sqlite",({"create": true}))),(function (backup_handle){
return promesa.protocols._mcat(promesa.protocols._promise(backup_handle.getFile()),(function (file){
return promesa.protocols._mcat(promesa.protocols._promise(file.text()),(function (file_content){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"return-data?","return-data?",-956653504),true], null))),(function (data){
return promesa.protocols._mcat(promesa.protocols._promise((new TextDecoder()).decode(data)),(function (decoded_content){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(file_content,decoded_content))?(function (){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Graph has not been updated since last export."], 0));

return new cljs.core.Keyword(null,"graph-not-changed","graph-not-changed",1463753852);
})()
:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((((file.size > (0)))?backup_handle.move(backups_handle,[cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null))),".db.sqlite"].join('')):null)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.truncate_old_versioned_files_BANG_(backups_handle)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(graph_dir_handle.getFileHandle("db.sqlite",({"create": true}))),(function (new_backup_handle){
return promesa.protocols._promise(module$frontend$utils.writeFile(new_backup_handle,data));
}));
}))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Successfully created a backup for",repo_name,"at",cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date())),"."], 0))),(function (___41611__auto____$3){
return promesa.protocols._promise(true);
}));
}));
}));
}));
}))));
}));
}));
}));
}));
}));
}));
}));
})),(function (error){
return console.error(error);
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("DB backup failed, please go to Export and specify a backup folder.",new cljs.core.Keyword(null,"error","error",-978969032))),(function (___41611__auto__){
return promesa.protocols._promise(false);
}));
}))));
}));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.export$ !== 'undefined') && (typeof frontend.handler.export$._STAR_backup_interval !== 'undefined')){
} else {
frontend.handler.export$._STAR_backup_interval = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.handler.export$.cancel_db_backup_BANG_ = (function frontend$handler$export$cancel_db_backup_BANG_(){
var temp__5804__auto__ = cljs.core.deref(frontend.handler.export$._STAR_backup_interval);
if(cljs.core.truth_(temp__5804__auto__)){
var i = temp__5804__auto__;
return clearInterval(i);
} else {
return null;
}
});
frontend.handler.export$.auto_db_backup_BANG_ = (function frontend$handler$export$auto_db_backup_BANG_(repo,p__104062){
var map__104064 = p__104062;
var map__104064__$1 = cljs.core.__destructure_map(map__104064);
var backup_now_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__104064__$1,new cljs.core.Keyword(null,"backup-now?","backup-now?",-918244579),true);
if(cljs.core.truth_(logseq.db.get_key_value((frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo)),new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532)))){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.util.web_platform_QMARK_;
if(and__5000__auto____$1){
return module$frontend$utils.nfsSupported();
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
frontend.handler.export$.cancel_db_backup_BANG_();

if(cljs.core.truth_(backup_now_QMARK_)){
frontend.handler.export$.backup_db_graph(repo,new cljs.core.Keyword(null,"backup-now","backup-now",1270691000));
} else {
}

var interval = setInterval((function (){
return frontend.handler.export$.backup_db_graph(repo,new cljs.core.Keyword(null,"auto","auto",-566279492));
}),((((1) * (60)) * (60)) * (1000)));
return cljs.core.reset_BANG_(frontend.handler.export$._STAR_backup_interval,interval);
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.export.js.map
