goog.provide('frontend.search');
frontend.search.fuzzy_search = frontend.common.search_fuzzy.fuzzy_search;
frontend.search.get_engine = (function frontend$search$get_engine(repo){
return frontend.search.agency.__GT_Agency(repo);
});
frontend.search.block_search = (function frontend$search$block_search(repo,q,option){
var temp__5804__auto__ = frontend.search.get_engine(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var engine = temp__5804__auto__;
var q__$1 = frontend.common.search_fuzzy.search_normalize(q,frontend.state.enable_search_remove_accents_QMARK_());
if(clojure.string.blank_QMARK_(q__$1)){
return null;
} else {
return engine.frontend$search$protocol$Engine$query$arity$3(null,q__$1,option);
}
} else {
return null;
}
});
frontend.search.file_search = (function frontend$search$file_search(var_args){
var G__102153 = arguments.length;
switch (G__102153) {
case 1:
return frontend.search.file_search.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.search.file_search.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.file_search.cljs$core$IFn$_invoke$arity$1 = (function (q){
return frontend.search.file_search.cljs$core$IFn$_invoke$arity$2(q,(3));
}));

(frontend.search.file_search.cljs$core$IFn$_invoke$arity$2 = (function (q,limit){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var q__$1 = frontend.common.search_fuzzy.clean_str(q);
if(clojure.string.blank_QMARK_(q__$1)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,logseq.common.config.mldoc_support_formats))),(function (mldoc_exts){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_files(repo)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (file){
var G__102154 = frontend.util.get_file_ext(file);
return (mldoc_exts.cljs$core$IFn$_invoke$arity$1 ? mldoc_exts.cljs$core$IFn$_invoke$arity$1(G__102154) : mldoc_exts.call(null,G__102154));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,result))),(function (files){
return promesa.protocols._promise(((cljs.core.seq(files))?frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic(files,q__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"limit","limit",-1355822363),limit], 0)):null));
}));
}));
}));
}));
}
} else {
return null;
}
}));

(frontend.search.file_search.cljs$lang$maxFixedArity = 2);

frontend.search.template_search = (function frontend$search$template_search(var_args){
var G__102156 = arguments.length;
switch (G__102156) {
case 1:
return frontend.search.template_search.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.search.template_search.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.template_search.cljs$core$IFn$_invoke$arity$1 = (function (q){
return frontend.search.template_search.cljs$core$IFn$_invoke$arity$2(q,(100));
}));

(frontend.search.template_search.cljs$core$IFn$_invoke$arity$2 = (function (q,limit){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(q)){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.common.search_fuzzy.clean_str(q)),(function (q__$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.db.async._LT_get_tag_objects(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Template","logseq.class/Template",1720854846)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Template","logseq.class/Template",1720854846))))):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_templates(repo)),(function (result){
return promesa.protocols._promise(cljs.core.vals(result));
}));
})))),(function (templates){
return promesa.protocols._promise(((cljs.core.seq(templates))?(function (){var extract_fn = new cljs.core.Keyword("block","title","block/title",710445684);
return frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic(templates,q__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"limit","limit",-1355822363),limit,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),extract_fn], null)], 0));
})():null));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.search.template_search.cljs$lang$maxFixedArity = 2);

frontend.search.property_search = (function frontend$search$property_search(var_args){
var G__102158 = arguments.length;
switch (G__102158) {
case 1:
return frontend.search.property_search.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.search.property_search.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.property_search.cljs$core$IFn$_invoke$arity$1 = (function (q){
return frontend.search.property_search.cljs$core$IFn$_invoke$arity$2(q,(100));
}));

(frontend.search.property_search.cljs$core$IFn$_invoke$arity$2 = (function (q,limit){
if(cljs.core.truth_(q)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.common.search_fuzzy.clean_str(q)),(function (q__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_properties()),(function (properties_STAR_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),properties_STAR_)),(function (properties){
return promesa.protocols._promise(((cljs.core.seq(properties))?((clojure.string.blank_QMARK_(q__$1))?properties:(function (){var result = frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic(properties,q__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"limit","limit",-1355822363),limit], 0));
return cljs.core.vec(result);
})()):null));
}));
}));
}));
}));
} else {
return null;
}
}));

(frontend.search.property_search.cljs$lang$maxFixedArity = 2);

frontend.search.property_value_search = (function frontend$search$property_value_search(var_args){
var G__102160 = arguments.length;
switch (G__102160) {
case 2:
return frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$2 = (function (property,q){
return frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$3(property,q,(100));
}));

(frontend.search.property_value_search.cljs$core$IFn$_invoke$arity$3 = (function (property,q,limit){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(q)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.common.search_fuzzy.clean_str(q)),(function (q__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_file_get_property_values(repo,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(property))),(function (result){
return promesa.protocols._promise(((cljs.core.seq(result))?((clojure.string.blank_QMARK_(q__$1))?result:(function (){var result__$1 = frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic(result,q__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"limit","limit",-1355822363),limit], 0));
return cljs.core.vec(result__$1);
})()):null));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.search.property_value_search.cljs$lang$maxFixedArity = 3);

frontend.search.rebuild_indices_BANG_ = (function frontend$search$rebuild_indices_BANG_(var_args){
var G__102162 = arguments.length;
switch (G__102162) {
case 0:
return frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
}));

(frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
if(cljs.core.truth_(repo)){
var temp__5804__auto__ = frontend.search.get_engine(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var engine = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(engine.frontend$search$protocol$Engine$rebuild_pages_indice_BANG_$arity$1(null)),(function (___41611__auto__){
return promesa.protocols._promise(engine.frontend$search$protocol$Engine$rebuild_blocks_indice_BANG_$arity$1(null));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.search.rebuild_indices_BANG_.cljs$lang$maxFixedArity = 1);

frontend.search.reset_indice_BANG_ = (function frontend$search$reset_indice_BANG_(repo){
var temp__5804__auto__ = frontend.search.get_engine(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var engine = temp__5804__auto__;
return engine.frontend$search$protocol$Engine$truncate_blocks_BANG_$arity$1(null);
} else {
return null;
}
});
frontend.search.remove_db_BANG_ = (function frontend$search$remove_db_BANG_(repo){
var temp__5804__auto__ = frontend.search.get_engine(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var engine = temp__5804__auto__;
return engine.frontend$search$protocol$Engine$remove_db_BANG_$arity$1(null);
} else {
return null;
}
});

//# sourceMappingURL=frontend.search.js.map
