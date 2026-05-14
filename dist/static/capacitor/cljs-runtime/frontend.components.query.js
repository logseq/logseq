goog.provide('frontend.components.query');
frontend.components.query.built_in_custom_query_QMARK_ = (function frontend$components$query$built_in_custom_query_QMARK_(title){
var queries = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default-queries","default-queries",1508774260),new cljs.core.Keyword(null,"journals","journals",-1915761091)], null));
if(cljs.core.seq(queries)){
return cljs.core.boolean$(cljs.core.some((function (p1__73159_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__73159_SHARP_,title);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"title","title",636505583),queries)));
} else {
return null;
}
});
frontend.components.query.custom_query_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__73168,p__73169,p__73170){
var map__73171 = p__73168;
var map__73171__$1 = cljs.core.__destructure_map(map__73171);
var config = map__73171__$1;
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73171__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var dsl_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73171__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662));
var map__73172 = p__73169;
var map__73172__$1 = cljs.core.__destructure_map(map__73172);
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73172__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var breadcrumb_show_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73172__$1,new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369));
var map__73173 = p__73170;
var map__73173__$1 = cljs.core.__destructure_map(map__73173);
var query_error_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"query-error-atom","query-error-atom",-2138638607));
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
var table_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"table?","table?",-1064705406));
var page_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"page-list?","page-list?",-466504566));
var view_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"view-f","view-f",314082005));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var group_by_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73173__$1,new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448));
var map__73182 = config;
var map__73182__$1 = cljs.core.__destructure_map(map__73182);
var __GT_hiccup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73182__$1,new cljs.core.Keyword(null,"->hiccup","->hiccup",1204690951));
var __GT_elem = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73182__$1,new cljs.core.Keyword(null,"->elem","->elem",-260360654));
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73182__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73182__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var map_inline = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73182__$1,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144));
var _STAR_query_error = query_error_atom;
var only_blocks_QMARK_ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(result));
var blocks_grouped_by_page_QMARK_ = (function (){var and__5000__auto__ = group_by_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.seq(result);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.coll_QMARK_(cljs.core.first(result));
if(and__5000__auto____$2){
var and__5000__auto____$3 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(cljs.core.ffirst(result));
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.second(cljs.core.first(result))));
if(cljs.core.truth_(and__5000__auto____$4)){
return true;
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
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
if(cljs.core.truth_(cljs.core.deref(_STAR_query_error))){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.query",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),cljs.core.deref(_STAR_query_error),new cljs.core.Keyword(null,"line","line",212345235),47], null)),cljs.core.deref(_STAR_query_error));

return daiquiri.core.create_element("div",{'className':"warning my-1"},["Query failed: ",(function (){var attrs73337 = cljs.core.deref(_STAR_query_error).message;
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs73337))?daiquiri.interpreter.element_attributes(attrs73337):null),((cljs.core.map_QMARK_(attrs73337))?null:[daiquiri.interpreter.interpret(attrs73337)]));
})()]);
} else {
var attrs73334 = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(result);
if(and__5000__auto__){
return view_f;
} else {
return and__5000__auto__;
}
})())?(function (){var result__$1 = (function (){try{return frontend.extensions.sci.call_fn.cljs$core$IFn$_invoke$arity$variadic(view_f,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result], 0));
}catch (e73338){var error = e73338;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.query",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"custom-view-failed","custom-view-failed",-1564949541),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"result","result",1415092211),result], null),new cljs.core.Keyword(null,"line","line",212345235),56], null)),null);

return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Custom view failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)], null);
}})();
return frontend.util.hiccup_keywordize(result__$1);
})():(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385).cljs$core$IFn$_invoke$arity$1(config));
} else {
return and__5000__auto__;
}
})())?(function (){var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(current_block);
if(cljs.core.truth_(temp__5804__auto__)){
var query__$1 = temp__5804__auto__;
if(clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(query__$1))){
return null;
} else {
return frontend.components.query.view.query_result(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block))),current_block,result);
}
} else {
return null;
}
})():(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(db_graph_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = page_list_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return table_QMARK_;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.file_based.query_table.result_table(config,current_block,result,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page?","page?",644039860),page_list_QMARK_], null),map_inline,page_cp,__GT_elem,inline_text):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(result);
if(and__5000__auto__){
var or__5002__auto__ = only_blocks_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return blocks_grouped_by_page_QMARK_;
}
} else {
return and__5000__auto__;
}
})())?(function (){var G__73343 = result;
var G__73344 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662),dsl_query_QMARK_,new cljs.core.Keyword(null,"query","query",-1288509510),query,new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369),(((!((breadcrumb_show_QMARK_ == null))))?breadcrumb_show_QMARK_:true),new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),blocks_grouped_by_page_QMARK_,new cljs.core.Keyword(null,"ref?","ref?",1932693720),true], 0));
var G__73345 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem",new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),"0.25rem"], null)], null);
return (__GT_hiccup.cljs$core$IFn$_invoke$arity$3 ? __GT_hiccup.cljs$core$IFn$_invoke$arity$3(G__73343,G__73344,G__73345) : __GT_hiccup.call(null,G__73343,G__73344,G__73345));
})():((cljs.core.seq(result))?(function (){var result__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var iter__5480__auto__ = (function frontend$components$query$iter__73347(s__73348){
return (new cljs.core.LazySeq(null,(function (){
var s__73348__$1 = s__73348;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73348__$1);
if(temp__5804__auto__){
var s__73348__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73348__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73348__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73350 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73349 = (0);
while(true){
if((i__73349 < size__5479__auto__)){
var record = cljs.core._nth(c__5478__auto__,i__73349);
cljs.core.chunk_append(b__73350,((cljs.core.map_QMARK_(record))?[frontend.util.pp_str(record),"\n"].join(''):record));

var G__73404 = (i__73349 + (1));
i__73349 = G__73404;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73350),frontend$components$query$iter__73347(cljs.core.chunk_rest(s__73348__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73350),null);
}
} else {
var record = cljs.core.first(s__73348__$2);
return cljs.core.cons(((cljs.core.map_QMARK_(record))?[frontend.util.pp_str(record),"\n"].join(''):record),frontend$components$query$iter__73347(cljs.core.rest(s__73348__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result);
})());
if(cljs.core.seq(result__$1)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),(function (){var iter__5480__auto__ = (function frontend$components$query$iter__73360(s__73361){
return (new cljs.core.LazySeq(null,(function (){
var s__73361__$1 = s__73361;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73361__$1);
if(temp__5804__auto__){
var s__73361__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73361__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73361__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73363 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73362 = (0);
while(true){
if((i__73362 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__73362);
cljs.core.chunk_append(b__73363,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),cljs.core.str.cljs$core$IFn$_invoke$arity$1(item)], null));

var G__73405 = (i__73362 + (1));
i__73362 = G__73405;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73363),frontend$components$query$iter__73360(cljs.core.chunk_rest(s__73361__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73363),null);
}
} else {
var item = cljs.core.first(s__73361__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),cljs.core.str.cljs$core$IFn$_invoke$arity$1(item)], null),frontend$components$query$iter__73360(cljs.core.rest(s__73361__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result__$1);
})()], null);
} else {
return null;
}
})():((((clojure.string.blank_QMARK_(query)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(query,"(and)"))))?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.mt-2.opacity-90","div.text-sm.mt-2.opacity-90",1307580190),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("search-item","no-result","search-item/no-result",-1067254379)], 0))], null)
))))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73334))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["custom-query-results"], null)], null),attrs73334], 0))):{'className':"custom-query-results"}),((cljs.core.map_QMARK_(attrs73334))?null:[daiquiri.interpreter.interpret(attrs73334)]));
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.query/custom-query-inner");
frontend.components.query.query_title = rum.core.lazy_build(rum.core.build_defc,(function (config,title,p__73370){
var map__73371 = p__73370;
var map__73371__$1 = cljs.core.__destructure_map(map__73371);
var result_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73371__$1,new cljs.core.Keyword(null,"result-count","result-count",-1827800573));
var inline_text = new cljs.core.Keyword(null,"inline-text","inline-text",910915394).cljs$core$IFn$_invoke$arity$1(config);
return daiquiri.core.create_element("div",{'className':"custom-query-title flex justify-between w-full"},[(function (){var attrs73378 = ((cljs.core.vector_QMARK_(title))?title:((typeof title === 'string')?(function (){var G__73379 = config;
var G__73380 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var G__73381 = title;
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__73379,G__73380,G__73381) : inline_text.call(null,G__73379,G__73380,G__73381));
})():title
));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs73378))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["title-text"], null)], null),attrs73378], 0))):{'className':"title-text"}),((cljs.core.map_QMARK_(attrs73378))?null:[daiquiri.interpreter.interpret(attrs73378)]));
})(),(cljs.core.truth_(result_count)?daiquiri.core.create_element("span",{'className':"opacity-60 text-sm ml-2 results-count"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(result_count),(((result_count > (1)))?" results":" result")].join('')]):null)]);
}),null,"frontend.components.query/query-title");
frontend.components.query.calculate_collapsed_QMARK_ = (function frontend$components$query$calculate_collapsed_QMARK_(current_block,current_block_uuid,p__73382){
var map__73383 = p__73382;
var map__73383__$1 = cljs.core.__destructure_map(map__73383);
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73383__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var temp_collapsed_QMARK_ = frontend.state.sub_block_collapsed(current_block_uuid);
var collapsed_QMARK__SINGLEQUOTE_ = (((!((temp_collapsed_QMARK_ == null))))?temp_collapsed_QMARK_:(function (){var or__5002__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(current_block);
}
})());
return collapsed_QMARK__SINGLEQUOTE_;
});
frontend.components.query.custom_query_STAR_ = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__73384,p__73385){
var map__73386 = p__73384;
var map__73386__$1 = cljs.core.__destructure_map(map__73386);
var config = map__73386__$1;
var _STAR_query_error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"*query-error","*query-error",-582907792));
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var dsl_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662));
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
var table_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"table?","table?",-1064705406));
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73386__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
var map__73387 = p__73385;
var map__73387__$1 = cljs.core.__destructure_map(map__73387);
var q = map__73387__$1;
var builder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73387__$1,new cljs.core.Keyword(null,"builder","builder",-2055262005));
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73387__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var view = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73387__$1,new cljs.core.Keyword(null,"view","view",1247994814));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73387__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var _STAR_result = new cljs.core.Keyword("frontend.components.query","result","frontend.components.query/result",-213467985).cljs$core$IFn$_invoke$arity$1(state);
var collapsed_QMARK__SINGLEQUOTE_ = new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674).cljs$core$IFn$_invoke$arity$1(config);
var result_SINGLEQUOTE_ = frontend.components.query.result.run_custom_query(config,q,_STAR_result,_STAR_query_error);
var result = (cljs.core.truth_(result_SINGLEQUOTE_)?frontend.components.query.result.transform_query_result(config,q,result_SINGLEQUOTE_):null);
var result__$1 = ((((cljs.core.coll_QMARK_(result)) && ((!(cljs.core.map_QMARK_(result))))))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.truth_((function (){var and__5000__auto__ = current_block;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_block);
} else {
return and__5000__auto__;
}
})())){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_block));
} else {
return null;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(b);
if(and__5000__auto__){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(b);
} else {
return and__5000__auto__;
}
})())){
var G__73388 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(b);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__73388) : logseq.db.hidden_QMARK_.call(null,G__73388));
} else {
return null;
}
}),result)):result);
var view_fn = (((view instanceof cljs.core.Keyword))?cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("query","views","query/views",1105149223),view], null)):view);
var view_f = (function (){var and__5000__auto__ = view_fn;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$1(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([view_fn], 0)));
} else {
return and__5000__auto__;
}
})();
var page_list_QMARK_ = ((cljs.core.seq(result__$1)) && ((!((new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(cljs.core.first(result__$1)) == null)))));
var opts = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"query-error-atom","query-error-atom",-2138638607),_STAR_query_error,new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block,new cljs.core.Keyword(null,"table?","table?",-1064705406),table_QMARK_,new cljs.core.Keyword(null,"view-f","view-f",314082005),view_f,new cljs.core.Keyword(null,"page-list?","page-list?",-466504566),page_list_QMARK_,new cljs.core.Keyword(null,"result","result",1415092211),result__$1,new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),frontend.components.query.result.get_group_by_page(q,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"table?","table?",-1064705406),table_QMARK_], null))], null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config))){
return daiquiri.core.create_element("code",null,[(cljs.core.truth_(dsl_query_QMARK_)?["Results for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query], 0))].join(''):"Advanced query results")]);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = built_in_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.empty_QMARK_(result__$1);
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
var attrs73389 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"attr","attr",-604132353),cljs.core.PersistentArrayMap.EMPTY);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73389))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["custom-query"], null)], null),attrs73389], 0))):{'className':"custom-query"}),((cljs.core.map_QMARK_(attrs73389))?[((((cljs.core.not(db_graph_QMARK_)) && (cljs.core.not(built_in_query_QMARK_))))?frontend.components.file_based.query.custom_query_header(config,q,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"query-error-atom","query-error-atom",-2138638607),_STAR_query_error,new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block,new cljs.core.Keyword(null,"table?","table?",-1064705406),table_QMARK_,new cljs.core.Keyword(null,"view-f","view-f",314082005),view_f,new cljs.core.Keyword(null,"page-list?","page-list?",-466504566),page_list_QMARK_,new cljs.core.Keyword(null,"*result","*result",-1157548516),_STAR_result,new cljs.core.Keyword(null,"result","result",1415092211),result__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK__SINGLEQUOTE_], null)):null),(cljs.core.truth_((function (){var and__5000__auto__ = dsl_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return builder;
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(builder):null),(cljs.core.truth_(built_in_query_QMARK_)?daiquiri.core.create_element("div",{'style':{'marginLeft':(2)}},[frontend.ui.foldable(frontend.components.query.query_title(config,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(q),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"result-count","result-count",-1827800573),cljs.core.count(result__$1)], null)),(function (){
return frontend.components.query.custom_query_inner(config,q,opts);
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),collapsed_QMARK_,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null))]):(function (){var attrs73390 = (cljs.core.truth_(collapsed_QMARK__SINGLEQUOTE_)?null:frontend.components.query.custom_query_inner(config,q,opts));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73390))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["bd"], null)], null),attrs73390], 0))):{'className':"bd"}),((cljs.core.map_QMARK_(attrs73390))?null:[daiquiri.interpreter.interpret(attrs73390)]));
})())]:[daiquiri.interpreter.interpret(attrs73389),((((cljs.core.not(db_graph_QMARK_)) && (cljs.core.not(built_in_query_QMARK_))))?frontend.components.file_based.query.custom_query_header(config,q,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"query-error-atom","query-error-atom",-2138638607),_STAR_query_error,new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block,new cljs.core.Keyword(null,"table?","table?",-1064705406),table_QMARK_,new cljs.core.Keyword(null,"view-f","view-f",314082005),view_f,new cljs.core.Keyword(null,"page-list?","page-list?",-466504566),page_list_QMARK_,new cljs.core.Keyword(null,"*result","*result",-1157548516),_STAR_result,new cljs.core.Keyword(null,"result","result",1415092211),result__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK__SINGLEQUOTE_], null)):null),(cljs.core.truth_((function (){var and__5000__auto__ = dsl_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return builder;
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(builder):null),(cljs.core.truth_(built_in_query_QMARK_)?daiquiri.core.create_element("div",{'style':{'marginLeft':(2)}},[frontend.ui.foldable(frontend.components.query.query_title(config,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(q),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"result-count","result-count",-1827800573),cljs.core.count(result__$1)], null)),(function (){
return frontend.components.query.custom_query_inner(config,q,opts);
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),collapsed_QMARK_,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null))]):(function (){var attrs73391 = (cljs.core.truth_(collapsed_QMARK__SINGLEQUOTE_)?null:frontend.components.query.custom_query_inner(config,q,opts));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73391))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["bd"], null)], null),attrs73391], 0))):{'className':"bd"}),((cljs.core.map_QMARK_(attrs73391))?null:[daiquiri.interpreter.interpret(attrs73391)]));
})())]));
}
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.query","result","frontend.components.query/result",-213467985),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null));
})], null)], null),"frontend.components.query/custom-query*");
frontend.components.query.custom_query = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__73392,p__73393){
var map__73394 = p__73392;
var map__73394__$1 = cljs.core.__destructure_map(map__73394);
var config = map__73394__$1;
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73394__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
var map__73395 = p__73393;
var map__73395__$1 = cljs.core.__destructure_map(map__73395);
var q = map__73395__$1;
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73395__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73395__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
return frontend.ui.catch_error(frontend.ui.block_error("Query Error:",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(q)], null)),(function (){var _STAR_query_error = new cljs.core.Keyword(null,"query-error","query-error",-898801975).cljs$core$IFn$_invoke$arity$1(state);
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var current_block_uuid = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
}
})();
var current_block = (function (){var G__73397 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),current_block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__73397) : frontend.db.entity.call(null,G__73397));
})();
var collapsed_QMARK__SINGLEQUOTE_ = frontend.components.query.calculate_collapsed_QMARK_(current_block,current_block_uuid,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),(((!(db_graph_QMARK_)))?collapsed_QMARK_:false)], null));
var built_in_collapsed_QMARK_ = (function (){var and__5000__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return built_in_query_QMARK_;
} else {
return and__5000__auto__;
}
})();
var table_QMARK_ = ((db_graph_QMARK_)?null:(function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(current_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"query-table","query-table",2095143554)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((typeof query === 'string') && (clojure.string.ends_with_QMARK_(clojure.string.trim(query),"table")));
}
})());
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_graph_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970),current_block,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957),current_block_uuid,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK__SINGLEQUOTE_,new cljs.core.Keyword(null,"table?","table?",-1064705406),table_QMARK_,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385),frontend.components.query.built_in_custom_query_QMARK_(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(q)),new cljs.core.Keyword(null,"*query-error","*query-error",-582907792),_STAR_query_error], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = built_in_collapsed_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (((!(db_graph_QMARK_))) || (cljs.core.not(collapsed_QMARK__SINGLEQUOTE_)));
}
})())){
return frontend.components.query.custom_query_STAR_(config_SINGLEQUOTE_,q);
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var db_graph_QMARK__73406 = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var vec__73398_73407 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var map__73401_73408 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73398_73407,(0),null);
var map__73401_73409__$1 = cljs.core.__destructure_map(map__73401_73408);
var config_73410 = map__73401_73409__$1;
var dsl_query_QMARK__73411 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73401_73409__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662));
var built_in_query_QMARK__73412 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73401_73409__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
var map__73402_73413 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73398_73407,(1),null);
var map__73402_73414__$1 = cljs.core.__destructure_map(map__73402_73413);
var collapsed_QMARK__73415 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73402_73414__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
if((!(db_graph_QMARK__73406))){
if(cljs.core.truth_((function (){var or__5002__auto__ = built_in_query_QMARK__73412;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return dsl_query_QMARK__73411;
}
})())){
} else {
if(cljs.core.truth_(collapsed_QMARK__73415)){
frontend.handler.editor.collapse_block_BANG_((function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config_73410));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config_73410);
}
})());
} else {
}
}
} else {
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"query-error","query-error",-898801975),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null));
})], null)], null),"frontend.components.query/custom-query");

//# sourceMappingURL=frontend.components.query.js.map
