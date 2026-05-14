goog.provide('frontend.components.file');
goog.scope(function(){
  frontend.components.file.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.file.get_path = (function frontend$components$file$get_path(state){
var route_match = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"path","path",-188191168)], null));
});
frontend.components.file.files_all = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var files = rum.core.react(new cljs.core.Keyword("frontend.components.file","files","frontend.components.file/files",693547406).cljs$core$IFn$_invoke$arity$1(state));
var files__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.first,goog.string.intAwareCompare,files);
var mobile_QMARK_ = frontend.util.mobile_QMARK_();
return daiquiri.core.create_element("table",{'className':"table-auto"},[daiquiri.core.create_element("thead",null,[daiquiri.core.create_element("tr",null,[(function (){var attrs131067 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","name","file/name",1848919477)], 0));
return daiquiri.core.create_element("th",((cljs.core.map_QMARK_(attrs131067))?daiquiri.interpreter.element_attributes(attrs131067):null),((cljs.core.map_QMARK_(attrs131067))?null:[daiquiri.interpreter.interpret(attrs131067)]));
})(),(cljs.core.truth_(mobile_QMARK_)?null:(function (){var attrs131068 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310)], 0));
return daiquiri.core.create_element("th",((cljs.core.map_QMARK_(attrs131068))?daiquiri.interpreter.element_attributes(attrs131068):null),((cljs.core.map_QMARK_(attrs131068))?null:[daiquiri.interpreter.interpret(attrs131068)]));
})()),(cljs.core.truth_(mobile_QMARK_)?null:daiquiri.core.create_element("th",null,[""]))])]),daiquiri.core.create_element("tbody",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$file$iter__131071(s__131072){
return (new cljs.core.LazySeq(null,(function (){
var s__131072__$1 = s__131072;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__131072__$1);
if(temp__5804__auto__){
var s__131072__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__131072__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131072__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131074 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131073 = (0);
while(true){
if((i__131073 < size__5479__auto__)){
var vec__131075 = cljs.core._nth(c__5478__auto__,i__131073);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131075,(0),null);
var modified_at = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131075,(1),null);
cljs.core.chunk_append(b__131074,(function (){var file_id = file;
return daiquiri.core.create_element("tr",{'key':file_id},[(function (){var attrs131078 = (function (){var href = ((logseq.common.config.draw_QMARK_(file))?reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"draw","draw",1358331674),null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file","file",-1269645878),clojure.string.replace(file,[logseq.common.config.default_draw_directory,"/"].join(''),"")], null)):reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),file_id], null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),href], null),file], null);
})();
return daiquiri.core.create_element("td",((cljs.core.map_QMARK_(attrs131078))?daiquiri.interpreter.element_attributes(attrs131078):null),((cljs.core.map_QMARK_(attrs131078))?null:[daiquiri.interpreter.interpret(attrs131078)]));
})(),(cljs.core.truth_(mobile_QMARK_)?null:daiquiri.core.create_element("td",null,[(function (){var attrs131079 = (((((modified_at == null)) || ((modified_at === (0)))))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","no-data","file/no-data",-1707813734)], 0)):frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$1(cljs_time.core.to_default_time_zone(cljs_time.coerce.to_date_time(modified_at))));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs131079))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-gray-500","text-sm"], null)], null),attrs131079], 0))):{'className':"text-gray-500 text-sm"}),((cljs.core.map_QMARK_(attrs131079))?null:[daiquiri.interpreter.interpret(attrs131079)]));
})()]))]);
})());

var G__131098 = (i__131073 + (1));
i__131073 = G__131098;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131074),frontend$components$file$iter__131071(cljs.core.chunk_rest(s__131072__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131074),null);
}
} else {
var vec__131080 = cljs.core.first(s__131072__$2);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131080,(0),null);
var modified_at = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131080,(1),null);
return cljs.core.cons((function (){var file_id = file;
return daiquiri.core.create_element("tr",{'key':file_id},[(function (){var attrs131078 = (function (){var href = ((logseq.common.config.draw_QMARK_(file))?reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"draw","draw",1358331674),null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file","file",-1269645878),clojure.string.replace(file,[logseq.common.config.default_draw_directory,"/"].join(''),"")], null)):reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),file_id], null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),href], null),file], null);
})();
return daiquiri.core.create_element("td",((cljs.core.map_QMARK_(attrs131078))?daiquiri.interpreter.element_attributes(attrs131078):null),((cljs.core.map_QMARK_(attrs131078))?null:[daiquiri.interpreter.interpret(attrs131078)]));
})(),(cljs.core.truth_(mobile_QMARK_)?null:daiquiri.core.create_element("td",null,[(function (){var attrs131079 = (((((modified_at == null)) || ((modified_at === (0)))))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","no-data","file/no-data",-1707813734)], 0)):frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$1(cljs_time.core.to_default_time_zone(cljs_time.coerce.to_date_time(modified_at))));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs131079))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-gray-500","text-sm"], null)], null),attrs131079], 0))):{'className':"text-gray-500 text-sm"}),((cljs.core.map_QMARK_(attrs131079))?null:[daiquiri.interpreter.interpret(attrs131079)]));
})()]))]);
})(),frontend$components$file$iter__131071(cljs.core.rest(s__131072__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(files__$1);
})())])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_files = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_files(frontend.state.get_current_repo())),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_files,result));
}));
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.file","files","frontend.components.file/files",693547406),_STAR_files);
})], null)], null),"frontend.components.file/files-all");
frontend.components.file.files = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"flex-1 overflow-hidden"},[(function (){var attrs131083 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-files","all-files",1120339891)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs131083))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["title"], null)], null),attrs131083], 0))):{'className':"title"}),((cljs.core.map_QMARK_(attrs131083))?null:[daiquiri.interpreter.interpret(attrs131083)]));
})(),frontend.components.file.files_all()]);
}),null,"frontend.components.file/files");
frontend.components.file.file_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,path,format){
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var rel_path = ((clojure.string.starts_with_QMARK_(path,repo_dir))?logseq.common.path.trim_dir_prefix(repo_dir,path):null);
var title = frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return rel_path;
}
})());
var in_db_QMARK_ = ((logseq.common.path.absolute_QMARK_(path))?null:cljs.core.boolean$((function (){var G__131084 = (function (){var or__5002__auto__ = path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return rel_path;
}
})();
return (frontend.db.get_file.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$1(G__131084) : frontend.db.get_file.call(null,G__131084));
})()));
var file_path = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?path:(cljs.core.truth_(in_db_QMARK_)?logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0)):path
));
var random_id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0());
var content = rum.core.react(new cljs.core.Keyword("frontend.components.file","file-content","frontend.components.file/file-content",1852452186).cljs$core$IFn$_invoke$arity$1(state));
return daiquiri.core.create_element("div",{'id':["file-edit-wrapper-",random_id].join(''),'key':path,'className':"file"},[daiquiri.core.create_element("h1",{'className':"title"},[(function (){var attrs131091 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = rel_path;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return path;
}
}
})();
return daiquiri.core.create_element("bdi",((cljs.core.map_QMARK_(attrs131091))?daiquiri.interpreter.element_attributes(attrs131091):null),((cljs.core.map_QMARK_(attrs131091))?null:[daiquiri.interpreter.interpret(attrs131091)]));
})()]),(cljs.core.truth_(title)?daiquiri.core.create_element("div",{'className':"text-sm mb-4 ml-1"},["Page: ",daiquiri.core.create_element("a",{'style':{'borderRadius':(4)},'href':reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),title], null)),'onClick':(function (e){
if(cljs.core.truth_(frontend.components.file.goog$module$goog$object.get(e,"shiftKey"))){
var temp__5804__auto___131099 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(title) : frontend.db.get_page.call(null,title));
if(cljs.core.truth_(temp__5804__auto___131099)){
var page_131100 = temp__5804__auto___131099;
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_131100),new cljs.core.Keyword(null,"page","page",849072397));
} else {
}

return frontend.util.stop(e);
} else {
return null;
}
}),'className':"bg-base-2 p-1 ml-1"},[daiquiri.interpreter.interpret(title)])]):null),(cljs.core.truth_((function (){var and__5000__auto__ = title;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.starts_with_QMARK_(title,"logseq/")));
} else {
return and__5000__auto__;
}
})())?(function (){var attrs131085 = frontend.components.svg.warning.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"1em",new cljs.core.Keyword(null,"display","display",242065432),"inline-block"], null)], null));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs131085))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","ml-1","mb-4"], null)], null),attrs131085], 0))):{'className':"text-sm ml-1 mb-4"}),((cljs.core.map_QMARK_(attrs131085))?[daiquiri.core.create_element("span",{'className':"ml-1"},["Please don't remove the page's title property (you can still modify it)."])]:[daiquiri.interpreter.interpret(attrs131085),daiquiri.core.create_element("span",{'className':"ml-1"},["Please don't remove the page's title property (you can still modify it)."])]));
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = format;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(logseq.common.config.img_formats(),format);
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("img",{'src':logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("file://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0))},[]):(cljs.core.truth_((function (){var and__5000__auto__ = format;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.contains_QMARK_(logseq.common.config.text_formats(),format);
if(and__5000__auto____$1){
return content;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var content_SINGLEQUOTE_ = clojure.string.trim(content);
var mode = frontend.util.get_file_ext(path);
return frontend.components.lazy_editor.editor(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"file?","file?",1755223728),true,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),file_path], null),["file-edit-",random_id].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),mode], null),content_SINGLEQUOTE_,cljs.core.PersistentArrayMap.EMPTY);
})():(cljs.core.truth_((function (){var and__5000__auto__ = format;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(logseq.common.config.text_formats(),format);
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$0()):(function (){var attrs131090 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("file","format-not-supported","file/format-not-supported",1268716007),cljs.core.name(format)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131090))?daiquiri.interpreter.element_attributes(attrs131090):null),((cljs.core.map_QMARK_(attrs131090))?null:[daiquiri.interpreter.interpret(attrs131090)]));
})()
)))]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var _STAR_content = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var vec__131092 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131092,(0),null);
var format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131092,(1),null);
var repo = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo);
var vec__131095 = ((logseq.common.path.absolute_QMARK_(path))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,path], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo_dir,path], null)
);
var dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131095,(0),null);
var path__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131095,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = format;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(logseq.common.config.text_formats(),format);
} else {
return and__5000__auto__;
}
})())){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) && ((!(clojure.string.starts_with_QMARK_(path__$1,"/"))))))?(frontend.db.get_file.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$1(path__$1) : frontend.db.get_file.call(null,path__$1)):frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(dir,path__$1))),(function (content){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_content,(function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()));
}));
}));
} else {
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.file","file-content","frontend.components.file/file-content",1852452186),_STAR_content);
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.state.set_file_component_BANG_(new cljs.core.Keyword("rum","react-component","rum/react-component",-1879897248).cljs$core$IFn$_invoke$arity$1(state));

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.clear_file_component_BANG_();

return state;
})], null)], null),"frontend.components.file/file-inner");
frontend.components.file.file = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var path = frontend.components.file.get_path(state);
var format = logseq.common.util.get_format(path);
return rum.core.with_key(frontend.components.file.file_inner(path,format),path);
}),null,"frontend.components.file/file");

//# sourceMappingURL=frontend.components.file.js.map
