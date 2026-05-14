goog.provide('frontend.extensions.pdf.assets');
frontend.extensions.pdf.assets.get_in_repo_assets_full_filename = (function frontend$extensions$pdf$assets$get_in_repo_assets_full_filename(url){
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
if(cljs.core.truth_((function (){var G__71427 = url;
var G__71427__$1 = (((G__71427 == null))?null:clojure.string.trim(G__71427));
if((G__71427__$1 == null)){
return null;
} else {
return clojure.string.includes_QMARK_(G__71427__$1,repo_dir);
}
})())){
var G__71428 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(url,repo_dir);
var G__71428__$1 = (((G__71428 == null))?null:cljs.core.last(G__71428));
if((G__71428__$1 == null)){
return null;
} else {
return clojure.string.replace_first(G__71428__$1,"/assets/","");
}
} else {
return null;
}
});
frontend.extensions.pdf.assets.inflate_asset = (function frontend$extensions$pdf$assets$inflate_asset(var_args){
var args__5732__auto__ = [];
var len__5726__auto___71717 = arguments.length;
var i__5727__auto___71718 = (0);
while(true){
if((i__5727__auto___71718 < len__5726__auto___71717)){
args__5732__auto__.push((arguments[i__5727__auto___71718]));

var G__71719 = (i__5727__auto___71718 + (1));
i__5727__auto___71718 = G__71719;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.extensions.pdf.assets.inflate_asset.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.extensions.pdf.assets.inflate_asset.cljs$core$IFn$_invoke$arity$variadic = (function (original_path,p__71431){
var map__71432 = p__71431;
var map__71432__$1 = cljs.core.__destructure_map(map__71432);
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71432__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71432__$1,new cljs.core.Keyword(null,"block","block",664686210));
var web_link_QMARK_ = clojure.string.starts_with_QMARK_(original_path,"http");
var blob_res_QMARK_ = (function (){var G__71433 = href;
if((G__71433 == null)){
return null;
} else {
return clojure.string.starts_with_QMARK_(G__71433,"blob");
}
})();
var asset_res_QMARK_ = (function (){var G__71434 = href;
if((G__71434 == null)){
return null;
} else {
return clojure.string.starts_with_QMARK_(G__71434,"assets");
}
})();
var filename = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(original_path) : frontend.util.node_path.basename.call(null,original_path));
var ext_name = "pdf";
var url = (cljs.core.truth_(blob_res_QMARK_)?href:frontend.handler.assets.normalize_asset_resource_url(original_path));
var filename_SINGLEQUOTE_ = (cljs.core.truth_((function (){var or__5002__auto__ = asset_res_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = web_link_QMARK_;
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return blob_res_QMARK_;
}
}
})())?filename:(function (){var G__71440 = url;
var G__71440__$1 = (((G__71440 == null))?null:decodeURIComponent(G__71440));
var G__71440__$2 = (((G__71440__$1 == null))?null:frontend.extensions.pdf.assets.get_in_repo_assets_full_filename(G__71440__$1));
if((G__71440__$2 == null)){
return null;
} else {
return clojure.string.replace(G__71440__$2,"/","_");
}
})());
var filekey = frontend.util.safe_sanitize_file_name(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(filename_SINGLEQUOTE_,(0),(cljs.core.count(filename_SINGLEQUOTE_) - (((ext_name).length) + (1)))));
var temp__5804__auto__ = (function (){var and__5000__auto__ = (!(clojure.string.blank_QMARK_(filekey)));
if(and__5000__auto__){
if(web_link_QMARK_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(filekey),"__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.hash(url))].join('');
} else {
return filekey;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"identity","identity",1647396035),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(key,(cljs.core.count(key) - (15))),new cljs.core.Keyword(null,"filename","filename",-1428840783),filename,new cljs.core.Keyword(null,"url","url",276297046),url,new cljs.core.Keyword(null,"hls-file","hls-file",192681120),["assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),".edn"].join(''),new cljs.core.Keyword(null,"original-path","original-path",538600599),original_path], null);
} else {
return null;
}
}));

(frontend.extensions.pdf.assets.inflate_asset.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.extensions.pdf.assets.inflate_asset.cljs$lang$applyTo = (function (seq71429){
var G__71430 = cljs.core.first(seq71429);
var seq71429__$1 = cljs.core.next(seq71429);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71430,seq71429__$1);
}));

frontend.extensions.pdf.assets.resolve_area_image_file = (function frontend$extensions$pdf$assets$resolve_area_image_file(img_stamp,current,p__71447){
var map__71448 = p__71447;
var map__71448__$1 = cljs.core.__destructure_map(map__71448);
var _hl = map__71448__$1;
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71448__$1,new cljs.core.Keyword(null,"page","page",849072397));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71448__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var temp__5804__auto__ = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(current);
if(cljs.core.truth_(temp__5804__auto__)){
var key = temp__5804__auto__;
return [logseq.common.config.local_assets_dir,cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var image_id = (function (){var G__71451 = id;
var G__71451__$1 = (((G__71451 == null))?null:frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(G__71451));
var G__71451__$2 = (((G__71451__$1 == null))?null:new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009).cljs$core$IFn$_invoke$arity$1(G__71451__$1));
if((G__71451__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__71451__$2);
}
})();
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("/%s.png",image_id) : frontend.util.format.call(null,"/%s.png",image_id));
})():(frontend.util.format.cljs$core$IFn$_invoke$arity$5 ? frontend.util.format.cljs$core$IFn$_invoke$arity$5("/%s/%s_%s_%s.png",key,page,id,img_stamp) : frontend.util.format.call(null,"/%s/%s_%s_%s.png",key,page,id,img_stamp))))].join('');
} else {
return null;
}
});
frontend.extensions.pdf.assets.file_based_ensure_ref_page_BANG_ = (function frontend$extensions$pdf$assets$file_based_ensure_ref_page_BANG_(pdf_current){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return null;
} else {
var temp__5804__auto__ = frontend.util.trim_safe(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(pdf_current));
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(["hls__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name)].join('')),(function (page_name__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(repo,page_name__$1)),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"original-path","original-path",538600599).cljs$core$IFn$_invoke$arity$1(pdf_current)),(function (file_path){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0()),(function (format){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.get_repo_dir(repo)),(function (repo_dir){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(repo_dir,logseq.common.config.local_assets_dir) : frontend.util.node_path.join.call(null,repo_dir,logseq.common.config.local_assets_dir))),(function (asset_dir){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.includes_QMARK_(file_path,asset_dir))?["..",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(file_path,repo_dir)))].join(''):file_path)),(function (url){
return promesa.protocols._promise(((cljs.core.not(page))?(function (){var label = new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(pdf_current);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__71467 = page_name__$1;
var G__71468 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161),false,new cljs.core.Keyword(null,"format","format",-1306924766),format,new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"file","file",-1269645878),(function (){var G__71469 = format;
var G__71469__$1 = (((G__71469 instanceof cljs.core.Keyword))?G__71469.fqn:null);
switch (G__71469__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[%s](%s)",label,url) : frontend.util.format.call(null,"[%s](%s)",label,url));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[[%s][%s]]",url,label) : frontend.util.format.call(null,"[[%s][%s]]",url,label));

break;
default:
return url;

}
})(),new cljs.core.Keyword(null,"file-path","file-path",-2005501162),url], null)], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__71467,G__71468) : frontend.handler.page._LT_create_BANG_.call(null,G__71467,G__71468));
})()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.db.model.get_page(page_name__$1));
}));
}));
})():(function (){
if(((function (){var G__71474 = page;
var G__71474__$1 = (((G__71474 == null))?null:new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(G__71474));
if((G__71474__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"file-path","file-path",-2005501162).cljs$core$IFn$_invoke$arity$1(G__71474__$1);
}
})() == null)){
frontend.handler.property.add_page_property_BANG_(page_name__$1,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),url);
} else {
}

return page;
})()
));
}));
}));
}));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
}
});
frontend.extensions.pdf.assets.file_based_ensure_ref_block_BANG_ = (function frontend$extensions$pdf$assets$file_based_ensure_ref_block_BANG_(pdf_current,p__71482,insert_opts){
var map__71483 = p__71482;
var map__71483__$1 = cljs.core.__destructure_map(map__71483);
var hl = map__71483__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71483__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71483__$1,new cljs.core.Keyword(null,"content","content",15833224));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71483__$1,new cljs.core.Keyword(null,"page","page",849072397));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71483__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(pdf_current)?frontend.extensions.pdf.assets.file_based_ensure_ref_page_BANG_(pdf_current):null)),(function (ref_page){
return promesa.protocols._promise((cljs.core.truth_(ref_page)?(function (){var ref_block = frontend.db.model.query_block_by_uuid(id);
if((!((new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref_block) == null)))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[existed ref block]",ref_block], 0));

return ref_block;
} else {
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(content);
var wrap_props = (function (p1__71477_SHARP_){
var temp__5802__auto__ = new cljs.core.Keyword(null,"image","image",-58725096).cljs$core$IFn$_invoke$arity$1(content);
if(cljs.core.truth_(temp__5802__auto__)){
var stamp = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(p1__71477_SHARP_,new cljs.core.Keyword(null,"hl-type","hl-type",992471876),new cljs.core.Keyword(null,"area","area",472007256),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),stamp], 0));
} else {
return p1__71477_SHARP_;
}
});
var db_base_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var props = (function (){var G__71496 = cljs.core.PersistentArrayMap.createAsIfByAssoc([frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)),new cljs.core.Keyword(null,"annotation","annotation",-344661666),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596)),page,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)),new cljs.core.Keyword(null,"color","color",1011675173).cljs$core$IFn$_invoke$arity$1(properties)]);
var G__71496__$1 = ((db_base_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__71496,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402)),hl):G__71496);
if((!(db_base_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__71496__$1,new cljs.core.Keyword(null,"id","id",-1388402092),((typeof id === 'string')?cljs.core.uuid(id):id));
} else {
return G__71496__$1;
}
})();
var properties__$1 = wrap_props(props);
if(typeof text === 'string'){
return frontend.handler.editor.api_insert_new_block_BANG_(text,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(ref_page),new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),id,new cljs.core.Keyword(null,"properties","properties",685819552),properties__$1], null),insert_opts], 0)));
} else {
return null;
}
}
})():null));
}));
}));
});
frontend.extensions.pdf.assets.db_based_ensure_ref_block_BANG_ = (function frontend$extensions$pdf$assets$db_based_ensure_ref_block_BANG_(pdf_current,p__71503,insert_opts){
var map__71504 = p__71503;
var map__71504__$1 = cljs.core.__destructure_map(map__71504);
var hl = map__71504__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71504__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71504__$1,new cljs.core.Keyword(null,"content","content",15833224));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71504__$1,new cljs.core.Keyword(null,"page","page",849072397));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71504__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var temp__5804__auto__ = new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(pdf_current);
if(cljs.core.truth_(temp__5804__auto__)){
var pdf_block = temp__5804__auto__;
var ref_block = frontend.db.model.query_block_by_uuid(id);
if(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref_block))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[existed ref block]",ref_block], 0));

return ref_block;
} else {
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(content);
var colors = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887))));
var color_id = cljs.core.some((function (color){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(color),new cljs.core.Keyword(null,"color","color",1011675173).cljs$core$IFn$_invoke$arity$1(properties))){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(color);
} else {
return null;
}
}),colors);
if(cljs.core.truth_(color_id)){
var properties__$1 = (function (){var G__71508 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Pdf-annotation","logseq.class/Pdf-annotation",-504959620),new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),new cljs.core.Keyword(null,"annotation","annotation",-344661666),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887),color_id,new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(pdf_block),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596),page,new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402),hl], null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"image","image",-58725096).cljs$core$IFn$_invoke$arity$1(content))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__71508,new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832),new cljs.core.Keyword(null,"area","area",472007256),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009),new cljs.core.Keyword(null,"image","image",-58725096).cljs$core$IFn$_invoke$arity$1(content)], 0));
} else {
return G__71508;
}
})();
if(typeof text === 'string'){
return frontend.handler.editor.api_insert_new_block_BANG_(text,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(pdf_block),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),id,new cljs.core.Keyword(null,"properties","properties",685819552),properties__$1], null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(insert_opts,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false)], 0)));
} else {
return null;
}
} else {
return null;
}
}
} else {
return null;
}
});
frontend.extensions.pdf.assets.ensure_ref_block_BANG_ = (function frontend$extensions$pdf$assets$ensure_ref_block_BANG_(pdf_current,hl,insert_opts){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.pdf.assets.db_based_ensure_ref_block_BANG_(pdf_current,hl,insert_opts);
} else {
return frontend.extensions.pdf.assets.file_based_ensure_ref_block_BANG_(pdf_current,hl,insert_opts);
}
});
frontend.extensions.pdf.assets.construct_highlights_from_hls_page = (function frontend$extensions$pdf$assets$construct_highlights_from_hls_page(hls_page){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(hls_page),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),true,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711),false], null)], 0))),(function (result){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"highlights","highlights",945143465),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402),result)], null));
}));
}));
});
frontend.extensions.pdf.assets.file_based_load_hls_data$ = (function frontend$extensions$pdf$assets$file_based_load_hls_data$(p__71513){
var map__71514 = p__71513;
var map__71514__$1 = cljs.core.__destructure_map(map__71514);
var hls_file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71514__$1,new cljs.core.Keyword(null,"hls-file","hls-file",192681120));
if(cljs.core.truth_(hls_file)){
var repo = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo);
var db_base_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo,repo_dir,hls_file,"{:highlights []}")),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,hls_file)),(function (res){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(res)?cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(res):cljs.core.PersistentArrayMap.EMPTY)),(function (data){
return promesa.protocols._promise(((db_base_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.file_based_ensure_ref_page_BANG_(frontend.state.get_current_pdf())),(function (hls_page){
return promesa.protocols._promise(frontend.extensions.pdf.assets.construct_highlights_from_hls_page(hls_page));
}));
})):data));
}));
}));
}));
}));
} else {
return null;
}
});
frontend.extensions.pdf.assets.file_based_persist_hls_data$ = (function frontend$extensions$pdf$assets$file_based_persist_hls_data$(p__71524,highlights,extra){
var map__71526 = p__71524;
var map__71526__$1 = cljs.core.__destructure_map(map__71526);
var hls_file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71526__$1,new cljs.core.Keyword(null,"hls-file","hls-file",192681120));
if(cljs.core.truth_(hls_file)){
var repo_cur = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo_cur);
var data = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__71531_71731 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__71532_71732 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__71534_71733 = true;
var _STAR_print_fn_STAR__temp_val__71535_71734 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__71534_71733);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__71535_71734);

try{fipp.edn.pprint.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"highlights","highlights",945143465),highlights,new cljs.core.Keyword(null,"extra","extra",1612569067),extra], null));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__71532_71732);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__71531_71731);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
return frontend.fs.write_plain_text_file_BANG_(repo_cur,repo_dir,hls_file,data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
return null;
}
});
frontend.extensions.pdf.assets.file_based_resolve_hls_data_by_key$ = (function frontend$extensions$pdf$assets$file_based_resolve_hls_data_by_key$(target_key){
var temp__5804__auto__ = (function (){var and__5000__auto__ = target_key;
if(cljs.core.truth_(and__5000__auto__)){
return [logseq.common.config.local_assets_dir,"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_key),".edn"].join('');
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var hls_file = temp__5804__auto__;
return frontend.extensions.pdf.assets.file_based_load_hls_data$(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hls-file","hls-file",192681120),hls_file], null));
} else {
return null;
}
});
frontend.extensions.pdf.assets.area_highlight_QMARK_ = (function frontend$extensions$pdf$assets$area_highlight_QMARK_(hl){
var and__5000__auto__ = hl;
if(cljs.core.truth_(and__5000__auto__)){
return (!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null)) == null)));
} else {
return and__5000__auto__;
}
});
frontend.extensions.pdf.assets.file_based_persist_hl_area_image = (function frontend$extensions$pdf$assets$file_based_persist_hl_area_image(repo_url,repo_dir,current,new_hl,old_hl,png){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(console.time(new cljs.core.Keyword(null,"write-area-image","write-area-image",-1753983626))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(png.arrayBuffer()),(function (png__$1){
return promesa.protocols._mcat(promesa.protocols._promise(current),(function (p__71561){
var map__71563 = p__71561;
var map__71563__$1 = cljs.core.__destructure_map(map__71563);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71563__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(new_hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null))),(function (fstamp){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = old_hl;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(old_hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null));
} else {
return and__5000__auto__;
}
})()),(function (old_fstamp){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(new_hl)),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new_hl))].join('')),(function (fname){
return promesa.protocols._mcat(promesa.protocols._promise([logseq.common.config.local_assets_dir,"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')),(function (fdir){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([fdir], 0)))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(fdir),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fname),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fstamp),".png"].join('')),(function (new_fpath){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = old_fstamp;
if(cljs.core.truth_(and__5000__auto__)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(fdir),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fname),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_fstamp),".png"].join('');
} else {
return and__5000__auto__;
}
})()),(function (old_fpath){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = old_fpath;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.fs.rename_BANG_(repo_url,old_fpath,new_fpath);
} else {
return and__5000__auto__;
}
})()),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo_url,repo_dir,new_fpath,png__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null))),(function (___$3){
return promesa.protocols._promise(console.timeEnd(new cljs.core.Keyword(null,"write-area-image","write-area-image",-1753983626)));
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
}));
}));
}));
});
frontend.extensions.pdf.assets.db_based_persist_hl_area_image = (function frontend$extensions$pdf$assets$db_based_persist_hl_area_image(repo,png){
var file = (new File([png],"pdf area highlight.png"));
return frontend.handler.editor.db_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [file], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pdf-area?","pdf-area?",770305490),true], null)], 0));
});
frontend.extensions.pdf.assets.persist_hl_area_image = (function frontend$extensions$pdf$assets$persist_hl_area_image(repo_url,repo_dir,current,new_hl,old_hl,png){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.db_based_persist_hl_area_image(repo_url,png)),(function (result){
return promesa.protocols._promise(cljs.core.first(result));
}));
}));
} else {
return frontend.extensions.pdf.assets.file_based_persist_hl_area_image(repo_url,repo_dir,current,new_hl,old_hl,png);
}
});
/**
 * Save pdf highlight area image
 */
frontend.extensions.pdf.assets.persist_hl_area_image$ = (function frontend$extensions$pdf$assets$persist_hl_area_image$(viewer,current,new_hl,old_hl,p__71610){
var map__71611 = p__71610;
var map__71611__$1 = cljs.core.__destructure_map(map__71611);
var top = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71611__$1,new cljs.core.Keyword(null,"top","top",-1856271961));
var left = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71611__$1,new cljs.core.Keyword(null,"left","left",-399115937));
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71611__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var height = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71611__$1,new cljs.core.Keyword(null,"height","height",1025178622));
var temp__5804__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(current);
if(cljs.core.truth_(and__5000__auto__)){
return viewer.getPageView((new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(new_hl) - (1))).canvas;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var canvas = temp__5804__auto__;
var doc = canvas.ownerDocument;
var canvas_SINGLEQUOTE_ = doc.createElement("canvas");
var dpr = window.devicePixelRatio;
var repo_url = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo_url);
var dw = (dpr * width);
var dh = (dpr * height);
(canvas_SINGLEQUOTE_.width = dw);

(canvas_SINGLEQUOTE_.height = dh);

var temp__5804__auto____$1 = canvas_SINGLEQUOTE_.getContext("2d",({"alpha": false}));
if(cljs.core.truth_(temp__5804__auto____$1)){
var ctx = temp__5804__auto____$1;
(ctx.imageSmoothingEnabled = false);

ctx.drawImage(canvas,(left * dpr),(top * dpr),(width * dpr),(height * dpr),(0),(0),dw,dh);

return (new Promise((function (resolve,reject){
return canvas_SINGLEQUOTE_.toBlob((function (png){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2((function (){var G__71614 = frontend.extensions.pdf.assets.persist_hl_area_image(repo_url,repo_dir,current,new_hl,old_hl,png);
return (resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(G__71614) : resolve.call(null,G__71614));
})(),(function (err){
(reject.cljs$core$IFn$_invoke$arity$1 ? reject.cljs$core$IFn$_invoke$arity$1(err) : reject.call(null,err));

return console.error("[write area image Error]",err);
}));
}));
})));
} else {
return null;
}
} else {
return null;
}
});
frontend.extensions.pdf.assets.update_hl_block_BANG_ = (function frontend$extensions$pdf$assets$update_hl_block_BANG_(highlight){
var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(highlight));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(highlight,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"color","color",1011675173)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var color = temp__5804__auto____$1;
var k = frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887));
var color_SINGLEQUOTE_ = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var colors = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887))));
return cljs.core.some((function (color_block){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(color_block),color)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(color_block);
} else {
return null;
}
}),colors);
})():color);
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),k,color_SINGLEQUOTE_);
} else {
return null;
}
} else {
return null;
}
});
frontend.extensions.pdf.assets.unlink_hl_area_image$ = (function frontend$extensions$pdf$assets$unlink_hl_area_image$(_viewer,current,hl){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.extensions.pdf.assets.area_highlight_QMARK_(hl);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(current);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var fkey = temp__5804__auto__;
var repo_cur = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo_cur);
var fstamp = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null));
var fname = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(hl)),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl))].join('');
var fdir = [logseq.common.config.local_assets_dir,"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fkey)].join('');
var fpath = (function (){var G__71616 = repo_dir;
var G__71617 = [fdir,"/",fname,"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fstamp),".png"].join('');
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__71616,G__71617) : frontend.util.node_path.join.call(null,G__71616,G__71617));
})();
return frontend.fs.unlink_BANG_(repo_cur,fpath,cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
});
frontend.extensions.pdf.assets.del_ref_block_BANG_ = (function frontend$extensions$pdf$assets$del_ref_block_BANG_(p__71618){
var map__71619 = p__71618;
var map__71619__$1 = cljs.core.__destructure_map(map__71619);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71619__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(id);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.handler.editor.delete_block_aux_BANG_(block);
} else {
return null;
}
});
frontend.extensions.pdf.assets.copy_hl_ref_BANG_ = (function frontend$extensions$pdf$assets$copy_hl_ref_BANG_(highlight,viewer){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.ensure_ref_block_BANG_(frontend.state.get_current_pdf(),highlight,null)),(function (ref_block){
return promesa.protocols._promise((cljs.core.truth_(ref_block)?frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.util.ref.__GT_block_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref_block)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"owner-window","owner-window",-2139116435),frontend.extensions.pdf.windows.resolve_own_window(viewer)], 0)):null));
}));
}));
});
frontend.extensions.pdf.assets.file_based_open_block_ref_BANG_ = (function frontend$extensions$pdf$assets$file_based_open_block_ref_BANG_(block){
var id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var page = (function (){var G__71621 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71621) : frontend.db.entity.call(null,G__71621));
})();
var page_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var file_path = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"file-path","file-path",-2005501162)], null));
var hl_page = frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596));
var hl_value = frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402));
var temp__5804__auto__ = (function (){var and__5000__auto__ = page_name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(page_name,(5));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var target_key = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.file_based_resolve_hls_data_by_key$(target_key)),(function (hls){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = hls;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"highlights","highlights",945143465).cljs$core$IFn$_invoke$arity$1(hls);
} else {
return and__5000__auto__;
}
})()),(function (hls__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["../assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_key),".pdf"].join('');
}
})()),(function (file_path__$1){
return promesa.protocols._promise((function (){var temp__5802__auto__ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = hls__$1;
if(cljs.core.truth_(and__5000__auto__)){
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__71620_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__71620_SHARP_));
}),hls__$1);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(hl_page)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),hl_page], null);
} else {
var temp__5804__auto____$1 = (function (){var G__71629 = hl_value;
if((G__71629 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(G__71629);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page__$1 = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page__$1], null);
} else {
return null;
}
}
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var matched = temp__5802__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267),matched);

return frontend.state.set_current_pdf_BANG_(frontend.extensions.pdf.assets.inflate_asset(file_path__$1));
} else {
return console.debug("[Unmatched highlight ref]",block);
}
})());
}));
}));
}));
}));
} else {
return null;
}
});
frontend.extensions.pdf.assets.db_based_open_block_ref_BANG_ = (function frontend$extensions$pdf$assets$db_based_open_block_ref_BANG_(block){
var hl_value = new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402).cljs$core$IFn$_invoke$arity$1(block);
var asset = new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790).cljs$core$IFn$_invoke$arity$1(block);
var file_path = ["../assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset)),".pdf"].join('');
if(cljs.core.truth_(asset)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets._LT_make_asset_url(file_path)),(function (href){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267),hl_value)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.state.set_current_pdf_BANG_(frontend.extensions.pdf.assets.inflate_asset.cljs$core$IFn$_invoke$arity$variadic(file_path,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"block","block",664686210),asset], null)], 0))));
}));
}));
})),(function (error){
return console.error(error);
}));
} else {
return console.error("Pdf asset no longer exists");
}
});
frontend.extensions.pdf.assets.open_block_ref_BANG_ = (function frontend$extensions$pdf$assets$open_block_ref_BANG_(block){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.pdf.assets.db_based_open_block_ref_BANG_(block);
} else {
return frontend.extensions.pdf.assets.file_based_open_block_ref_BANG_(block);
}
});
frontend.extensions.pdf.assets.goto_block_ref_BANG_ = (function frontend$extensions$pdf$assets$goto_block_ref_BANG_(p__71650){
var map__71653 = p__71650;
var map__71653__$1 = cljs.core.__destructure_map(map__71653);
var hl = map__71653__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71653__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_(id)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.ensure_ref_block_BANG_(frontend.state.get_current_pdf(),hl,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false], null))),(function (___40947__auto__){
return promesa.protocols._promise(reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)], null)));
}));
}));
} else {
return null;
}
});
frontend.extensions.pdf.assets.goto_annotations_page_BANG_ = (function frontend$extensions$pdf$assets$goto_annotations_page_BANG_(var_args){
var G__71670 = arguments.length;
switch (G__71670) {
case 1:
return frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (current){
return frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$core$IFn$_invoke$arity$2(current,null);
}));

(frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (current,id){
if(cljs.core.truth_(current)){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(current))], null),(cljs.core.truth_(id)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),["block-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core._PLUS_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null):null));
} else {
var temp__5804__auto__ = (function (){var G__71678 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(current);
var G__71678__$1 = (((G__71678 == null))?null:["hls__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__71678)].join(''));
if((G__71678__$1 == null)){
return null;
} else {
return frontend.db.model.get_page(G__71678__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e))], null),(cljs.core.truth_(id)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),["block-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core._PLUS_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null):null));
} else {
return null;
}
}
} else {
return null;
}
}));

(frontend.extensions.pdf.assets.goto_annotations_page_BANG_.cljs$lang$maxFixedArity = 2);

frontend.extensions.pdf.assets.open_lightbox = (function frontend$extensions$pdf$assets$open_lightbox(e){
var images = document.querySelectorAll(".hl-area img");
var images__$1 = cljs.core.to_array(images);
var images__$2 = (((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(((images__$1).length),(1)))))?(function (){var image = e.target.closest(".hl-area");
var image__$1 = image.querySelector("img");
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.reverse(cljs.core.split_with(cljs.core.complement(cljs.core.PersistentHashSet.createAsIfByAssoc([image__$1])),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2((function (p1__71679_SHARP_){
return p1__71679_SHARP_.y;
}),(function (p1__71683_SHARP_){
return p1__71683_SHARP_.x;
})),images__$1))));
})():images__$1);
var images__$3 = (function (){var iter__5480__auto__ = (function frontend$extensions$pdf$assets$open_lightbox_$_iter__71695(s__71696){
return (new cljs.core.LazySeq(null,(function (){
var s__71696__$1 = s__71696;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71696__$1);
if(temp__5804__auto__){
var s__71696__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71696__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71696__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71698 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71697 = (0);
while(true){
if((i__71697 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__71697);
cljs.core.chunk_append(b__71698,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"src","src",-1651076051),it.src,new cljs.core.Keyword(null,"w","w",354169001),it.naturalWidth,new cljs.core.Keyword(null,"h","h",1109658740),it.naturalHeight], null));

var G__71761 = (i__71697 + (1));
i__71697 = G__71761;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71698),frontend$extensions$pdf$assets$open_lightbox_$_iter__71695(cljs.core.chunk_rest(s__71696__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71698),null);
}
} else {
var it = cljs.core.first(s__71696__$2);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"src","src",-1651076051),it.src,new cljs.core.Keyword(null,"w","w",354169001),it.naturalWidth,new cljs.core.Keyword(null,"h","h",1109658740),it.naturalHeight], null),frontend$extensions$pdf$assets$open_lightbox_$_iter__71695(cljs.core.rest(s__71696__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(images__$2);
})();
if(cljs.core.seq(images__$3)){
return frontend.extensions.lightbox.preview_images_BANG_(images__$3);
} else {
return null;
}
});
frontend.extensions.pdf.assets.area_display = rum.core.lazy_build(rum.core.build_defcs,(function (state,block){
var _STAR_src = new cljs.core.Keyword("frontend.extensions.pdf.assets","src","frontend.extensions.pdf.assets/src",-769531152).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.publishing.db.get_area_block_asset_url(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()),block,frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var asset_path_SINGLEQUOTE_ = temp__5804__auto__;
if((cljs.core.deref(_STAR_src) == null)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets._LT_make_asset_url(asset_path_SINGLEQUOTE_)),(function (asset_path){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_src,asset_path));
}));
}));
} else {
}

if(cljs.core.truth_(cljs.core.deref(_STAR_src))){
var asset_block = (function (){var G__71708 = block;
if((G__71708 == null)){
return null;
} else {
return new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009).cljs$core$IFn$_invoke$arity$1(G__71708);
}
})();
var resize_metadata = (function (){var G__71709 = asset_block;
if((G__71709 == null)){
return null;
} else {
return new cljs.core.Keyword("logseq.property.asset","resize-metadata","logseq.property.asset/resize-metadata",-1297523055).cljs$core$IFn$_invoke$arity$1(G__71709);
}
})();
var style = (function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(resize_metadata);
if(cljs.core.truth_(temp__5804__auto____$1)){
var w = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),w], null)], null);
} else {
return null;
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.hl-area","div.hl-area",400249084),style,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.asset-container","div.asset-container",1221095823),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(cljs.core.truth_(style)?"100%":"auto")], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.asset-action-bar","span.asset-action-bar",-297372259),(function (){var temp__5804__auto____$1 = (function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
var G__71710 = asset_block;
if((G__71710 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__71710);
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var asset_uuid = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","ref-block","asset/ref-block",-2025624917)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(asset_uuid);
})], null),frontend.ui.icon("file-symlink")], null);
} else {
return null;
}
})(),((frontend.config.publishing_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","copy","asset/copy",-867708909)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.util.copy_image_to_clipboard(logseq.common.config.remove_asset_protocol(cljs.core.deref(_STAR_src))),(function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));
}));
})], null),frontend.ui.icon("copy")], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","maximize","asset/maximize",-20255358)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.extensions.pdf.assets.open_lightbox], null),frontend.ui.icon("maximize")], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"img.w-full","img.w-full",-1776690076),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"src","src",-1651076051),cljs.core.deref(_STAR_src)], null)], null)], null)], null);
} else {
return null;
}
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.pdf.assets","src","frontend.extensions.pdf.assets/src",-769531152))], null),"frontend.extensions.pdf.assets/area-display");

//# sourceMappingURL=frontend.extensions.pdf.assets.js.map
