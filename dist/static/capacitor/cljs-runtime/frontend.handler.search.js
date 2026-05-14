goog.provide('frontend.handler.search');
/**
 * Convert a block to the display contents for searching
 */
frontend.handler.search.sanity_search_content = (function frontend$handler$search$sanity_search_content(format,content){
return logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3(content,format,frontend.config.get_block_pattern(format));
});
/**
 * The aggretation of search results
 */
frontend.handler.search.search = (function frontend$handler$search$search(var_args){
var G__64596 = arguments.length;
switch (G__64596) {
case 1:
return frontend.handler.search.search.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.search.search.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.search.search.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.search.search.cljs$core$IFn$_invoke$arity$1 = (function (q){
return frontend.handler.search.search.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),q);
}));

(frontend.handler.search.search.cljs$core$IFn$_invoke$arity$2 = (function (repo,q){
return frontend.handler.search.search.cljs$core$IFn$_invoke$arity$3(repo,q,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(10)], null));
}));

(frontend.handler.search.search.cljs$core$IFn$_invoke$arity$3 = (function (repo,q,p__64597){
var map__64598 = p__64597;
var map__64598__$1 = cljs.core.__destructure_map(map__64598);
var opts = map__64598__$1;
var page_db_id = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64598__$1,new cljs.core.Keyword(null,"page-db-id","page-db-id",-761574235),null);
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64598__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),(10));
var more_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64598__$1,new cljs.core.Keyword(null,"more?","more?",519437444));
if(clojure.string.blank_QMARK_(q)){
return null;
} else {
var page_db_id__$1 = ((typeof page_db_id === 'string')?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_db_id) : frontend.db.get_page.call(null,page_db_id))):page_db_id);
var opts__$1 = (cljs.core.truth_(page_db_id__$1)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"page","page",849072397),cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_db_id__$1)):opts);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(repo,q,opts__$1)),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.file_search.cljs$core$IFn$_invoke$arity$1(q)),(function (files){
return promesa.protocols._promise((function (){var result = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks,new cljs.core.Keyword(null,"has-more?","has-more?",-1528440566),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(limit,cljs.core.count(blocks))], null),(cljs.core.truth_(page_db_id__$1)?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"files","files",-472457450),files], null))], 0));
var search_key = (cljs.core.truth_(more_QMARK_)?new cljs.core.Keyword("search","more-result","search/more-result",1439170242):new cljs.core.Keyword("search","result","search/result",443756363));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,search_key,result);

return result;
})());
}));
}));
}));
}
}));

(frontend.handler.search.search.cljs$lang$maxFixedArity = 3);

frontend.handler.search.open_find_in_page_BANG_ = (function frontend$handler$search$open_find_in_page_BANG_(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
var map__64602 = new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var map__64602__$1 = cljs.core.__destructure_map(map__64602);
var active_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64602__$1,new cljs.core.Keyword(null,"active?","active?",459499776));
if(cljs.core.truth_(active_QMARK_)){
return null;
} else {
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"active?","active?",459499776)], null),true);
}
} else {
return null;
}
});
frontend.handler.search.electron_find_in_page_BANG_ = (function frontend$handler$search$electron_find_in_page_BANG_(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
var map__64603 = new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var map__64603__$1 = cljs.core.__destructure_map(map__64603);
var active_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64603__$1,new cljs.core.Keyword(null,"active?","active?",459499776));
var backward_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64603__$1,new cljs.core.Keyword(null,"backward?","backward?",-1388361117));
var match_case_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64603__$1,new cljs.core.Keyword(null,"match-case?","match-case?",-1836393163));
var q = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64603__$1,new cljs.core.Keyword(null,"q","q",689001697));
var option = (function (){var G__64608 = cljs.core.PersistentArrayMap.EMPTY;
var G__64608__$1 = ((cljs.core.not(active_QMARK_))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64608,new cljs.core.Keyword(null,"findNext","findNext",648169934),true):G__64608);
var G__64608__$2 = (cljs.core.truth_(backward_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64608__$1,new cljs.core.Keyword(null,"forward","forward",-557345303),false):G__64608__$1);
if(cljs.core.truth_(match_case_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64608__$2,new cljs.core.Keyword(null,"matchCase","matchCase",-1316588853),true);
} else {
return G__64608__$2;
}
})();
frontend.handler.search.open_find_in_page_BANG_();

if(clojure.string.blank_QMARK_(q)){
return null;
} else {
dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(document.getElementById("search-in-page-input"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"visibility","visibility",1338380893),"hidden"], 0));

if((cljs.core.count(q) > (1))){
dommy.core.set_html_BANG_(document.getElementById("search-in-page-placeholder"),(function (){var G__64638 = "<span><span>%s</span><span style=\"margin-left: -4px;\">%s</span></span>";
var G__64639 = cljs.core.first(q);
var G__64640 = [" ",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(q,(1))].join('');
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64638,G__64639,G__64640) : frontend.util.format.call(null,G__64638,G__64639,G__64640));
})());
} else {
}

return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["find-in-page",q,option], 0));
}
} else {
return null;
}
});
var cancelable_debounce_search_64740 = frontend.util.cancelable_debounce(frontend.handler.search.electron_find_in_page_BANG_,(500));
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.search !== 'undefined') && (typeof frontend.handler.search.debounced_search !== 'undefined')){
} else {
frontend.handler.search.debounced_search = cljs.core.first(cancelable_debounce_search_64740);
}

if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.search !== 'undefined') && (typeof frontend.handler.search.stop_debounced_search_BANG_ !== 'undefined')){
} else {
frontend.handler.search.stop_debounced_search_BANG_ = cljs.core.second(cancelable_debounce_search_64740);
}
frontend.handler.search.loop_find_in_page_BANG_ = (function frontend$handler$search$loop_find_in_page_BANG_(backward_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"active?","active?",459499776)], null));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.state.editing_QMARK_());
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"backward?","backward?",-1388361117)], null),backward_QMARK_);

return (frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.debounced_search.call(null));
} else {
return false;
}
});
frontend.handler.search.electron_exit_find_in_page_BANG_ = (function frontend$handler$search$electron_exit_find_in_page_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64741 = arguments.length;
var i__5727__auto___64742 = (0);
while(true){
if((i__5727__auto___64742 < len__5726__auto___64741)){
args__5732__auto__.push((arguments[i__5727__auto___64742]));

var G__64743 = (i__5727__auto___64742 + (1));
i__5727__auto___64742 = G__64743;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.search.electron_exit_find_in_page_BANG_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.search.electron_exit_find_in_page_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__64649){
var map__64650 = p__64649;
var map__64650__$1 = cljs.core.__destructure_map(map__64650);
var clear_state_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64650__$1,new cljs.core.Keyword(null,"clear-state?","clear-state?",-1950459393),true);
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["clear-find-in-page"], 0));

if(cljs.core.truth_(clear_state_QMARK_)){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),null);
} else {
return null;
}
} else {
return null;
}
}));

(frontend.handler.search.electron_exit_find_in_page_BANG_.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.handler.search.electron_exit_find_in_page_BANG_.cljs$lang$applyTo = (function (seq64648){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64648));
}));

frontend.handler.search.clear_search_BANG_ = (function frontend$handler$search$clear_search_BANG_(var_args){
var G__64660 = arguments.length;
switch (G__64660) {
case 0:
return frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}));

(frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (clear_search_mode_QMARK_){
var m_64750 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("search","result","search/result",443756363),null,new cljs.core.Keyword("search","q","search/q",-553992135),""], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,cljs.core.merge,m_64750);

if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
frontend.state.reset_plugin_search_engines();
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = clear_search_mode_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_search_mode(),new cljs.core.Keyword(null,"graph","graph",1558099509));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"global","global",93595047));
} else {
return null;
}
}));

(frontend.handler.search.clear_search_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.search.rebuild_indices_BANG_ = (function frontend$handler$search$rebuild_indices_BANG_(var_args){
var G__64683 = arguments.length;
switch (G__64683) {
case 0:
return frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1(false);
}));

(frontend.handler.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (notice_QMARK_){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Starting to rebuild search indices!"], 0));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.rebuild_indices_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (_){
return promesa.protocols._promise((cljs.core.truth_(notice_QMARK_)?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Search indices rebuilt successfully!",new cljs.core.Keyword(null,"success","success",1890645906)):null));
}));
}));
}));

(frontend.handler.search.rebuild_indices_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.search.highlight_exact_query = (function frontend$handler$search$highlight_exact_query(content,q){
if(((clojure.string.blank_QMARK_(content)) || (clojure.string.blank_QMARK_(q)))){
return content;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = content;
if(cljs.core.truth_(and__5000__auto__)){
return q;
} else {
return and__5000__auto__;
}
})())){
var q_words = clojure.string.split.cljs$core$IFn$_invoke$arity$2(q,/ /);
var lc_content = frontend.common.search_fuzzy.search_normalize(content,frontend.state.enable_search_remove_accents_QMARK_());
var lc_q = frontend.common.search_fuzzy.search_normalize(q,frontend.state.enable_search_remove_accents_QMARK_());
if(((clojure.string.includes_QMARK_(lc_content,lc_q)) && (cljs.core.not((function (){var G__64697 = / /;
var G__64698 = q;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__64697,G__64698) : frontend.util.safe_re_find.call(null,G__64697,G__64698));
})())))){
var i = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(lc_content,lc_q);
var vec__64702 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),i),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,(i + cljs.core.count(q)))], null);
var before = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64702,(0),null);
var after = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64702,(1),null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),((clojure.string.blank_QMARK_(before))?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),before], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"mark.p-0.rounded-none","mark.p-0.rounded-none",-1487431150),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,i,(i + cljs.core.count(q)))], null),((clojure.string.blank_QMARK_(after))?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),after], null))], null);
} else {
var elements = (function (){var words = q_words;
var content__$1 = content;
var result = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(words);
if(and__5000__auto__){
return content__$1;
} else {
return and__5000__auto__;
}
})())){
var word = cljs.core.first(words);
var lc_word = frontend.common.search_fuzzy.search_normalize(word,frontend.state.enable_search_remove_accents_QMARK_());
var lc_content__$1 = frontend.common.search_fuzzy.search_normalize(content__$1,frontend.state.enable_search_remove_accents_QMARK_());
var temp__5802__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(lc_content__$1,lc_word);
if(cljs.core.truth_(temp__5802__auto__)){
var i = temp__5802__auto__;
var G__64756 = cljs.core.rest(words);
var G__64757 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content__$1,(i + cljs.core.count(word)));
var G__64758 = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content__$1,(0),i)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"mark.p-0.rounded-none","mark.p-0.rounded-none",-1487431150),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content__$1,i,(i + cljs.core.count(word)))], null)], null)));
words = G__64756;
content__$1 = G__64757;
result = G__64758;
continue;
} else {
var G__64759 = null;
var G__64760 = content__$1;
var G__64761 = result;
words = G__64759;
content__$1 = G__64760;
result = G__64761;
continue;
}
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),content__$1], null));
}
break;
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"m-0"], null),elements], null);
}
} else {
return null;
}
}
});
frontend.handler.search.get_recents = (function frontend$handler$search$get_recents(){
return frontend.storage.get(new cljs.core.Keyword(null,"recent-search-items","recent-search-items",1838971866));
});
frontend.handler.search.add_recent_BANG_ = (function frontend$handler$search$add_recent_BANG_(item){
if(clojure.string.blank_QMARK_(item)){
return null;
} else {
var recents = frontend.handler.search.get_recents();
return frontend.storage.set(new cljs.core.Keyword(null,"recent-search-items","recent-search-items",1838971866),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.take.cljs$core$IFn$_invoke$arity$2((20),cljs.core.cons(item,recents))));
}
});
frontend.handler.search.clear_recents_BANG_ = (function frontend$handler$search$clear_recents_BANG_(){
return frontend.storage.remove(new cljs.core.Keyword(null,"recent-search-items","recent-search-items",1838971866));
});

//# sourceMappingURL=frontend.handler.search.js.map
