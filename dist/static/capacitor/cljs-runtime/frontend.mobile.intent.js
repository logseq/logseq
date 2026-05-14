goog.provide('frontend.mobile.intent');
var module$node_modules$$capacitor$action_sheet$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$action_sheet$dist$plugin_cjs", {});
var module$node_modules$$capacitor$filesystem$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$filesystem$dist$plugin_cjs", {});
var module$node_modules$$capacitor$share$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$share$dist$plugin_cjs", {});
var module$node_modules$path$path=shadow.js.require("module$node_modules$path$path", {});
var module$node_modules$send_intent$dist$esm$index=shadow.js.require("module$node_modules$send_intent$dist$esm$index", {});
/**
 * Share file to mobile platform
 */
frontend.mobile.intent.open_or_share_file = (function frontend$mobile$intent$open_or_share_file(uri){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Open",new cljs.core.Keyword(null,"style","style",-496642736),"DEFAULT"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Share"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Cancel",new cljs.core.Keyword(null,"style","style",-496642736),"CANCEL"], null)], null)),(function (options){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$action_sheet$dist$plugin_cjs.ActionSheet.showActions(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"File Options",new cljs.core.Keyword(null,"message","message",-406056002),"Select an option to perform",new cljs.core.Keyword(null,"options","options",99638489),options], null)))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(result.index),(function (index){
return promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(index,(2)))?(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(0));
if(and__5000__auto__){
return frontend.mobile.util.native_android_QMARK_();
} else {
return and__5000__auto__;
}
})())?frontend.mobile.util.folder_picker.openFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"uri","uri",-774711847),uri], null))):module$node_modules$$capacitor$share$dist$plugin_cjs.Share.share(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"url","url",276297046),uri,new cljs.core.Keyword(null,"dialogTitle","dialogTitle",-1897103343),"Open file with your favorite app",new cljs.core.Keyword(null,"title","title",636505583),"Open file with your favorite app"], null)))):null));
}));
}));
}));
}));
});
frontend.mobile.intent.is_link = (function frontend$mobile$intent$is_link(url){
if(cljs.core.truth_(cljs.core.not_empty(url))){
return cljs.core.re_matches(/^[a-zA-Z0-9]+:\/\/.*$/,url);
} else {
return null;
}
});
/**
 * Extract highlighted text and url from mobile browser intent share.
 * - url can be prefixed with the highlighted text.
 * - url can be highlighted text only in some cases.
 */
frontend.mobile.intent.extract_highlight = (function frontend$mobile$intent$extract_highlight(url){
var vec__73589 = cljs.core.re_find(/\s+([a-zA-Z0-9]+:\/\/[\S]*)$/,url);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73589,(0),null);
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73589,(1),null);
var highlight = (cljs.core.truth_(cljs.core.not_empty(link))?(function (){var quoted = clojure.string.replace(url,link,"");
var quoted__$1 = goog.string.trimRight(quoted);
return goog.string.stripQuotes(quoted__$1,"\"");
})():null);
if(cljs.core.truth_(cljs.core.not_empty(highlight))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlight,link], null);
} else {
if(cljs.core.truth_(frontend.mobile.intent.is_link(url))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,url], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [url,null], null);

}
}
});
frontend.mobile.intent.transform_args = (function frontend$mobile$intent$transform_args(args){
var map__73592 = args;
var map__73592__$1 = cljs.core.__destructure_map(map__73592);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73592__$1,new cljs.core.Keyword(null,"url","url",276297046));
if(cljs.core.truth_(frontend.mobile.intent.is_link(url))){
return args;
} else {
var vec__73595 = frontend.mobile.intent.extract_highlight(url);
var highlight = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73595,(0),null);
var url_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73595,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(args,new cljs.core.Keyword(null,"url","url",276297046),url_SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"content","content",15833224),highlight], 0));
}
});
frontend.mobile.intent.handle_received_text = (function frontend$mobile$intent$handle_received_text(args){
var args__$1 = frontend.mobile.intent.transform_args(args);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","quick-capture","editor/quick-capture",799865811),args__$1], null));
});
frontend.mobile.intent.embed_asset_file = (function frontend$mobile$intent$embed_asset_file(url,format){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$path$path.basename(url)),(function (basename){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1(basename) : frontend.util.node_path.name.call(null,basename))),(function (label){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.date.get_current_time()),(function (time){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.date.today()),(function (date_ref_name){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_path(basename)),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.copy(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),url,new cljs.core.Keyword(null,"to","to",192099007),path], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.intent",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"copy-file-error","copy-file-error",-264206453),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),95], null)),null);
}))),(function (_file){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("../assets/%s",basename) : frontend.util.format.call(null,"../assets/%s",basename))),(function (url__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_file_link(format,url__$1,label,true)),(function (url__$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-templates","quick-capture-templates",-1488741596),new cljs.core.Keyword(null,"media","media",-1066138403)], null),"**{time}** [[quick capture]]: {url}")),(function (template){
return promesa.protocols._promise(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(template,"{time}",time),"{date}",date_ref_name),"{text}",""),"{url}",(function (){var or__5002__auto__ = url__$2;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
/**
 * Store external content with url into Logseq repo
 */
frontend.mobile.intent.embed_text_file = (function frontend$mobile$intent$embed_text_file(url,title){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.date.get_current_time()),(function (time){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.date.today()),(function (date_ref_name){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__73598 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return module$node_modules$path$path.basename(url);
}
})();
var G__73598__$1 = (((G__73598 == null))?null:logseq.common.util.safe_decode_uri_component(G__73598));
var G__73598__$2 = (((G__73598__$1 == null))?null:(frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1(G__73598__$1) : frontend.util.node_path.name.call(null,G__73598__$1)));
if((G__73598__$2 == null)){
return null;
} else {
return logseq.common.util.page_name_sanity(G__73598__$2);
}
})()),(function (title__$1){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$path$path.join(frontend.config.get_repo_dir(frontend.state.get_current_repo()),frontend.config.get_pages_directory(),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURI(frontend.util.fs.file_name_sanity(title__$1,new cljs.core.Keyword(null,"markdown","markdown",1227225089)))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(module$node_modules$path$path.extname(url))].join(''))),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.copy(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),url,new cljs.core.Keyword(null,"to","to",192099007),path], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.intent",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"copy-file-error","copy-file-error",-264206453),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),123], null)),null);
}))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(title__$1) : frontend.util.ref.__GT_page_ref.call(null,title__$1))),(function (url__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-templates","quick-capture-templates",-1488741596),new cljs.core.Keyword(null,"text","text",-1790561697)], null),"**{time}** [[quick capture]]: {url}")),(function (template){
return promesa.protocols._promise(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(template,"{time}",time),"{date}",date_ref_name),"{text}",""),"{url}",(function (){var or__5002__auto__ = url__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()));
}));
}));
}));
}));
}));
}));
}));
}));
});
frontend.mobile.intent.handle_received_media = (function frontend$mobile$intent$handle_received_media(result){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(result),(function (p__73599){
var map__73600 = p__73599;
var map__73600__$1 = cljs.core.__destructure_map(map__73600);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73600__$1,new cljs.core.Keyword(null,"url","url",276297046));
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page_format.call(null,page))),(function (format){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.mobile.intent.embed_asset_file(url,format)),(function (content){
return promesa.protocols._promise((cljs.core.truth_(frontend.state.get_edit_block())?frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(content):frontend.handler.editor.api_insert_new_block_BANG_(content,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null))));
}));
}));
}));
}));
}));
});
frontend.mobile.intent.handle_received_application = (function frontend$mobile$intent$handle_received_application(result){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(result),(function (p__73601){
var map__73602 = p__73601;
var map__73602__$1 = cljs.core.__destructure_map(map__73602);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73602__$1,new cljs.core.Keyword(null,"title","title",636505583));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73602__$1,new cljs.core.Keyword(null,"url","url",276297046));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73602__$1,new cljs.core.Keyword(null,"type","type",1174270348));
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page_format.call(null,page))),(function (format){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(type,"/"))),(function (application_type){
return promesa.protocols._mcat(promesa.protocols._promise(((logseq.common.config.mldoc_support_QMARK_(application_type))?frontend.mobile.intent.embed_text_file(url,title):((cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(frontend.config.doc_formats,frontend.config.media_formats),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(application_type)))?frontend.mobile.intent.embed_asset_file(url,format):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),["Import ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(application_type)," file has not been supported. You can report it on "].join(''),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/logseq/issues",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Github"], null),". We will look into it soon."], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false)
))),(function (content){
return promesa.protocols._promise((cljs.core.truth_(frontend.state.get_edit_block())?frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(content):frontend.handler.editor.api_insert_new_block_BANG_(content,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null))));
}));
}));
}));
}));
}));
}));
});
frontend.mobile.intent.decode_received_result = (function frontend$mobile$intent$decode_received_result(m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function frontend$mobile$intent$decode_received_result_$_iter__73607(s__73608){
return (new cljs.core.LazySeq(null,(function (){
var s__73608__$1 = s__73608;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73608__$1);
if(temp__5804__auto__){
var s__73608__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73608__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73608__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73610 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73609 = (0);
while(true){
if((i__73609 < size__5479__auto__)){
var vec__73613 = cljs.core._nth(c__5478__auto__,i__73609);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73613,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73613,(1),null);
cljs.core.chunk_append(b__73610,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((cljs.core.vector_QMARK_(v))?cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.mobile.intent.decode_received_result,v)):((clojure.string.blank_QMARK_(v))?null:(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?logseq.common.util.safe_decode_uri_component(v):v)
))], null));

var G__73682 = (i__73609 + (1));
i__73609 = G__73682;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73610),frontend$mobile$intent$decode_received_result_$_iter__73607(cljs.core.chunk_rest(s__73608__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73610),null);
}
} else {
var vec__73618 = cljs.core.first(s__73608__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73618,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73618,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((cljs.core.vector_QMARK_(v))?cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.mobile.intent.decode_received_result,v)):((clojure.string.blank_QMARK_(v))?null:(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?logseq.common.util.safe_decode_uri_component(v):v)
))], null),frontend$mobile$intent$decode_received_result_$_iter__73607(cljs.core.rest(s__73608__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(m);
})());
});
frontend.mobile.intent.handle_asset_file = (function frontend$mobile$intent$handle_asset_file(url,format){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$path$path.basename(url)),(function (basename){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.name.cljs$core$IFn$_invoke$arity$1(basename) : frontend.util.node_path.name.call(null,basename))),(function (label){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_path(basename)),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.copy(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),url,new cljs.core.Keyword(null,"to","to",192099007),path], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.intent",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"copy-file-error","copy-file-error",-264206453),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),192], null)),null);
}))),(function (_file){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("../assets/%s",basename) : frontend.util.format.call(null,"../assets/%s",basename))),(function (url__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_file_link(format,url__$1,label,true)),(function (url_link){
return promesa.protocols._promise(url_link);
}));
}));
}));
}));
}));
}));
}));
});
frontend.mobile.intent.handle_payload_resource = (function frontend$mobile$intent$handle_payload_resource(p__73623,format){
var map__73624 = p__73623;
var map__73624__$1 = cljs.core.__destructure_map(map__73624);
var resource = map__73624__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73624__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73624__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var ext = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73624__$1,new cljs.core.Keyword(null,"ext","ext",-996964541));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73624__$1,new cljs.core.Keyword(null,"url","url",276297046));
if(cljs.core.truth_(url)){
if(cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(frontend.config.doc_formats,frontend.config.media_formats),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(ext))){
return frontend.mobile.intent.handle_asset_file(url,format);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Parsing current shared content are not supported. Please report the following codes on ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Github"], null),". We will look into it soon.",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__73626_73684 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__73627_73685 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__73628_73686 = true;
var _STAR_print_fn_STAR__temp_val__73629_73687 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__73628_73686);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__73629_73687);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(resource);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__73627_73685);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__73626_73684);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()], null)], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"text/plain")){
return name;
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Parsing current shared content are not supported. Please report the following codes on ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Github"], null),". We will look into it soon.",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__73633_73688 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__73634_73689 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__73635_73690 = true;
var _STAR_print_fn_STAR__temp_val__73636_73691 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__73635_73690);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__73636_73691);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(resource);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__73634_73689);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__73633_73688);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()], null)], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

}
}
});
/**
 * Mobile share intent handler v2, use complex payload to support more types of content.
 */
frontend.mobile.intent.handle_payload = (function frontend$mobile$intent$handle_payload(payload){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page_format.call(null,page))),(function (format){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-templates","quick-capture-templates",-1488741596),new cljs.core.Keyword(null,"text","text",-1790561697)], null),"**{time}** [[quick capture]]: {text} {url}")),(function (template){
return promesa.protocols._mcat(promesa.protocols._promise(payload),(function (p__73637){
var map__73638 = p__73637;
var map__73638__$1 = cljs.core.__destructure_map(map__73638);
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var resources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"resources","resources",1632806811));
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = text;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()),(function (text__$1){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (resource){
return frontend.mobile.intent.handle_payload_resource(resource,format);
}),resources)),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(clojure.string.join,"\n"))),(function (rich_content){
return promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not_empty(text__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not_empty(rich_content);
}
})())?(function (){var time = frontend.date.get_current_time();
var date_ref_name = frontend.date.today();
var content = clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(template,"{time}",time),"{date}",date_ref_name),"{text}",text__$1),"{url}",rich_content);
var edit_content = frontend.state.get_edit_content();
var edit_content_blank_QMARK_ = clojure.string.blank_QMARK_(edit_content);
var edit_content_include_capture_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not_empty(edit_content);
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(edit_content,"[[quick capture]]");
} else {
return and__5000__auto__;
}
})();
if(((frontend.state.editing_QMARK_()) && (cljs.core.not(edit_content_include_capture_QMARK_)))){
if(edit_content_blank_QMARK_){
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(content);
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(["\n",content].join(''));
}
} else {
frontend.handler.editor.escape_editing();

return setTimeout((function (){
return frontend.handler.editor.api_insert_new_block_BANG_(content,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null));
}),(100));
}
})():null));
}));
}));
}));
}));
}));
}));
}));
});
/**
 * Mobile share intent handler v1, legacy. Only for Android
 */
frontend.mobile.intent.handle_result = (function frontend$mobile$intent$handle_result(result){
var result__$1 = frontend.mobile.intent.decode_received_result(result);
var temp__5804__auto__ = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(result__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var type = temp__5804__auto__;
if(clojure.string.starts_with_QMARK_(type,"text/")){
return frontend.mobile.intent.handle_received_text(result__$1);
} else {
if(((clojure.string.starts_with_QMARK_(type,"image/")) || (((clojure.string.starts_with_QMARK_(type,"video/")) || (clojure.string.starts_with_QMARK_(type,"audio/")))))){
return frontend.mobile.intent.handle_received_media(result__$1);
} else {
if(clojure.string.starts_with_QMARK_(type,"application/")){
return frontend.mobile.intent.handle_received_application(result__$1);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Parsing current shared content are not supported. Please report the following codes on ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Github"], null),". We will look into it soon.",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__73664_73717 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__73665_73718 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__73666_73719 = true;
var _STAR_print_fn_STAR__temp_val__73667_73720 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__73666_73719);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__73667_73720);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result__$1);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__73665_73718);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__73664_73717);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()], null)], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

}
}
}
} else {
return null;
}
});
frontend.mobile.intent.handle_received = (function frontend$mobile$intent$handle_received(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$send_intent$dist$esm$index.SendIntent.checkSendIntentReceived(),(function (error){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent-received-error","intent-received-error",2097503730),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null)], 0));
}))),(function (received){
return promesa.protocols._promise((cljs.core.truth_(received)?(function (){var result = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(received,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
return frontend.mobile.intent.handle_result(result);
})():null));
}));
}));
});

//# sourceMappingURL=frontend.mobile.intent.js.map
