goog.provide('frontend.components.reference_filters');
frontend.components.reference_filters.frequencies_sort = (function frontend$components$reference_filters$frequencies_sort(references){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.second,(function (p1__87293_SHARP_,p2__87294_SHARP_){
return (p1__87293_SHARP_ > p2__87294_SHARP_);
}),references);
});
frontend.components.reference_filters.ref_button = rum.core.lazy_build(rum.core.build_defc,(function (page,filters,ref_name,ref_count){
var lc_reference = clojure.string.lower_case(ref_name);
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),ref_name,(cljs.core.truth_(ref_count)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup","sup",-2039492346)," ",ref_count], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var includes = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters)));
var excludes = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)));
var included_QMARK_ = (includes.cljs$core$IFn$_invoke$arity$1 ? includes.cljs$core$IFn$_invoke$arity$1(lc_reference) : includes.call(null,lc_reference));
var not_in_filters_QMARK_ = ((cljs.core.not(included_QMARK_)) && (cljs.core.not((excludes.cljs$core$IFn$_invoke$arity$1 ? excludes.cljs$core$IFn$_invoke$arity$1(lc_reference) : excludes.call(null,lc_reference)))));
var shift_QMARK_ = e.shiftKey;
if(db_based_QMARK_){
return frontend.handler.page.db_based_save_filter_BANG_(page,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(lc_reference) : frontend.db.get_page.call(null,lc_reference))),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"add?","add?",1263018409),not_in_filters_QMARK_,new cljs.core.Keyword(null,"include?","include?",859165569),((not_in_filters_QMARK_)?cljs.core.not(shift_QMARK_):included_QMARK_)], null));
} else {
var filters_m = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__87300_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__87300_SHARP_,true],null));
}),includes),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__87301_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__87301_SHARP_,false],null));
}),excludes)));
var filters_SINGLEQUOTE_ = ((not_in_filters_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(filters_m,lc_reference,cljs.core.not(shift_QMARK_)):cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(filters_m,lc_reference));
return frontend.handler.page.file_based_save_filter_BANG_(page,filters_SINGLEQUOTE_);
}
}),new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], 0)));
}),null,"frontend.components.reference-filters/ref-button");
frontend.components.reference_filters.filtered_refs = (function frontend$components$reference_filters$filtered_refs(page,filters,filtered_references_STAR_,virtual_QMARK_){
var filtered_references = ((datascript.impl.entity.entity_QMARK_(cljs.core.first(filtered_references_STAR_)))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e)], null);
}),filtered_references_STAR_):filtered_references_STAR_);
if((((cljs.core.count(filtered_references) > (100))) && ((!(virtual_QMARK_ === false))))){
var G__87341 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"height","height",1025178622),(500),new cljs.core.Keyword(null,"width","width",-384071477),(500),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(500)], null),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(filtered_references),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
return ["ref-button-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
var vec__87345 = frontend.util.nth_safe(filtered_references,idx);
var ref_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87345,(0),null);
var ref_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87345,(1),null);
return frontend.components.reference_filters.ref_button(page,filters,ref_name,ref_count);
})], null);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__87341) : frontend.ui.virtualized_list.call(null,G__87341));
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-2.flex-wrap.items-center","div.flex.gap-2.flex-wrap.items-center",-484417061),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(500),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(500)], null)], null),(function (){var iter__5480__auto__ = (function frontend$components$reference_filters$filtered_refs_$_iter__87348(s__87349){
return (new cljs.core.LazySeq(null,(function (){
var s__87349__$1 = s__87349;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__87349__$1);
if(temp__5804__auto__){
var s__87349__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__87349__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__87349__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__87351 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__87350 = (0);
while(true){
if((i__87350 < size__5479__auto__)){
var vec__87360 = cljs.core._nth(c__5478__auto__,i__87350);
var ref_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87360,(0),null);
var ref_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87360,(1),null);
cljs.core.chunk_append(b__87351,rum.core.with_key(frontend.components.reference_filters.ref_button(page,filters,ref_name,ref_count),["ref-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ref_name)].join('')));

var G__87478 = (i__87350 + (1));
i__87350 = G__87478;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__87351),frontend$components$reference_filters$filtered_refs_$_iter__87348(cljs.core.chunk_rest(s__87349__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__87351),null);
}
} else {
var vec__87371 = cljs.core.first(s__87349__$2);
var ref_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87371,(0),null);
var ref_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87371,(1),null);
return cljs.core.cons(rum.core.with_key(frontend.components.reference_filters.ref_button(page,filters,ref_name,ref_count),["ref-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ref_name)].join('')),frontend$components$reference_filters$filtered_refs_$_iter__87348(cljs.core.rest(s__87349__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(filtered_references);
})()], null);
}
});
frontend.components.reference_filters.filter_dialog_aux = rum.core.lazy_build(rum.core.build_defc,(function (page_entity,references){
var vec__87385 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1("") : logseq.shui.hooks.use_state.call(null,""));
var filter_search = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87385,(0),null);
var set_filter_search_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87385,(1),null);
var vec__87388 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(references) : logseq.shui.hooks.use_state.call(null,references));
var filtered_references = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87388,(0),null);
var set_filtered_references_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87388,(1),null);
var filters = logseq.db.common.view.get_filters((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page_entity);
var map__87391 = filters;
var map__87391__$1 = cljs.core.__destructure_map(map__87391);
var included = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87391__$1,new cljs.core.Keyword(null,"included","included",-1002787476));
var excluded = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87391__$1,new cljs.core.Keyword(null,"excluded","excluded",-715952088));
logseq.shui.hooks.use_effect_BANG_((function (){
var references__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_search,""))?references:frontend.components.reference_filters.frequencies_sort((frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(references,filter_search,new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),cljs.core.first) : frontend.search.fuzzy_search.call(null,references,filter_search,new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),cljs.core.first))));
return (set_filtered_references_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filtered_references_BANG_.cljs$core$IFn$_invoke$arity$1(references__$1) : set_filtered_references_BANG_.call(null,references__$1));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.hooks.use_debounced_value(filter_search,(200))], null));

return daiquiri.core.create_element("div",{'className':"ls-filters filters"},[daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[(function (){var attrs87413 = frontend.ui.icon("filter",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87413))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mx-auto","flex-shrink-0","flex","items-center","justify-center","h-12","w-12","rounded-full","bg-gray-200","text-gray-500","sm:mx-0","sm:h-10","sm:w-10"], null)], null),attrs87413], 0))):{'className':"mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 text-gray-500 sm:mx-0 sm:h-10 sm:w-10"}),((cljs.core.map_QMARK_(attrs87413))?null:[daiquiri.interpreter.interpret(attrs87413)]));
})(),daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left pb-2"},[(function (){var attrs87416 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-heading","linked-references/filter-heading",872972306)], 0));
return daiquiri.core.create_element("h3",((cljs.core.map_QMARK_(attrs87416))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"modal-headline",new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-lg","leading-6","font-medium"], null)], null),attrs87416], 0))):{'id':"modal-headline",'className':"text-lg leading-6 font-medium"}),((cljs.core.map_QMARK_(attrs87416))?null:[daiquiri.interpreter.interpret(attrs87416)]));
})(),(function (){var attrs87417 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-directions","linked-references/filter-directions",652165062)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs87417))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs"], null)], null),attrs87417], 0))):{'className':"text-xs"}),((cljs.core.map_QMARK_(attrs87417))?null:[daiquiri.interpreter.interpret(attrs87417)]));
})()])]),((((cljs.core.seq(included)) || (cljs.core.seq(excluded))))?(function (){var attrs87404 = ((cljs.core.seq(included))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.center-items","div.flex.flex-row.flex-wrap.center-items",1436274387),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-1.font-medium.py-1","div.mr-1.font-medium.py-1",-483586395),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-includes","linked-references/filter-includes",-398466826)], 0))], null),frontend.components.reference_filters.filtered_refs(page_entity,filters,included,false)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87404))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__filters","mb-4","ml-2"], null)], null),attrs87404], 0))):{'className':"cp__filters mb-4 ml-2"}),((cljs.core.map_QMARK_(attrs87404))?[((cljs.core.seq(excluded))?daiquiri.core.create_element("div",{'className':"flex flex-row flex-wrap"},[(function (){var attrs87422 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-excludes","linked-references/filter-excludes",-1023807982)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87422))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-1","font-medium","py-1"], null)], null),attrs87422], 0))):{'className':"mr-1 font-medium py-1"}),((cljs.core.map_QMARK_(attrs87422))?null:[daiquiri.interpreter.interpret(attrs87422)]));
})(),daiquiri.interpreter.interpret(frontend.components.reference_filters.filtered_refs(page_entity,filters,excluded,false))]):null)]:[daiquiri.interpreter.interpret(attrs87404),((cljs.core.seq(excluded))?daiquiri.core.create_element("div",{'className':"flex flex-row flex-wrap"},[(function (){var attrs87429 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-excludes","linked-references/filter-excludes",-1023807982)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87429))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-1","font-medium","py-1"], null)], null),attrs87429], 0))):{'className':"mr-1 font-medium py-1"}),((cljs.core.map_QMARK_(attrs87429))?null:[daiquiri.interpreter.interpret(attrs87429)]));
})(),daiquiri.interpreter.interpret(frontend.components.reference_filters.filtered_refs(page_entity,filters,excluded,false))]):null)]));
})():null),(function (){var attrs87408 = frontend.ui.icon("search");
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87408))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__filters-input-panel","flex","focus-within:bg-gray-03"], null)], null),attrs87408], 0))):{'className':"cp__filters-input-panel flex focus-within:bg-gray-03"}),((cljs.core.map_QMARK_(attrs87408))?[daiquiri.core.create_element("input",{'placeholder':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-search","linked-references/filter-search",-1331351362)], 0)),'autofocus':true,'ref':(function (el){
if(cljs.core.truth_(el)){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((32)),(function (){
return el.focus();
}));
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (e){
var G__87436 = frontend.util.evalue(e);
return (set_filter_search_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filter_search_BANG_.cljs$core$IFn$_invoke$arity$1(G__87436) : set_filter_search_BANG_.call(null,G__87436));
})),'className':"cp__filters-input w-full bg-transparent"},[])]:[daiquiri.interpreter.interpret(attrs87408),daiquiri.core.create_element("input",{'placeholder':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("linked-references","filter-search","linked-references/filter-search",-1331351362)], 0)),'autofocus':true,'ref':(function (el){
if(cljs.core.truth_(el)){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((32)),(function (){
return el.focus();
}));
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (e){
var G__87441 = frontend.util.evalue(e);
return (set_filter_search_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filter_search_BANG_.cljs$core$IFn$_invoke$arity$1(G__87441) : set_filter_search_BANG_.call(null,G__87441));
})),'className':"cp__filters-input w-full bg-transparent"},[])]));
})(),(function (){var all_filters = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),included),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),excluded)));
var refs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__87447){
var vec__87450 = p__87447;
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87450,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87450,(1),null);
var G__87453 = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page) : frontend.util.page_name_sanity_lc.call(null,page));
return (all_filters.cljs$core$IFn$_invoke$arity$1 ? all_filters.cljs$core$IFn$_invoke$arity$1(G__87453) : all_filters.call(null,G__87453));
}),filtered_references);
if(cljs.core.seq(refs)){
var attrs87412 = frontend.components.reference_filters.filtered_refs(page_entity,filters,refs,true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87412))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-4"], null)], null),attrs87412], 0))):{'className':"mt-4"}),((cljs.core.map_QMARK_(attrs87412))?null:[daiquiri.interpreter.interpret(attrs87412)]));
} else {
return null;
}
})()]);
}),null,"frontend.components.reference-filters/filter-dialog-aux");
frontend.components.reference_filters.filter_dialog = rum.core.lazy_build(rum.core.build_defc,(function (page,references){
var page_entity = (function (){var G__87463 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__87463) : frontend.db.sub_block.call(null,G__87463));
})();
return frontend.components.reference_filters.filter_dialog_aux(page_entity,references);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.reference-filters/filter-dialog");

//# sourceMappingURL=frontend.components.reference_filters.js.map
