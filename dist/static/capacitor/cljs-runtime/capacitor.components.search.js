goog.provide('capacitor.components.search');
capacitor.components.search.search_blocks = (function capacitor$components$search$search_blocks(input){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(repo,input,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks)),(function (blocks__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__91142 = blocks__$1;
var G__91143 = input;
var G__91144 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__91142,G__91143,G__91144) : frontend.search.fuzzy_search.call(null,G__91142,G__91143,G__91144));
})()),(function (blocks__$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block){
if(cljs.core.truth_(new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(block))){
return frontend.components.cmdk.core.page_item(repo,block);
} else {
return frontend.components.cmdk.core.block_item(repo,block,null,input);
}
}),blocks__$2)),(function (items){
return promesa.protocols._promise(items);
}));
}));
}));
}));
}));
}));
});
capacitor.components.search.get_recent_pages = (function capacitor$components$search$get_recent_pages(){
var recent_pages = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,(function (){var G__91145 = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
return (logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1(G__91145) : logseq.db.get_recent_updated_pages.call(null,G__91145));
})());
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var text = frontend.handler.block.block_unique_title(block);
var icon = frontend.components.cmdk.core.get_page_icon(block);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),icon,new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),text,new cljs.core.Keyword(null,"source-block","source-block",-878290804),block], null);
}),recent_pages);
});
capacitor.components.search.search = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_page){
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__91146 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1("") : logseq.shui.hooks.use_state.call(null,""));
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91146,(0),null);
var set_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91146,(1),null);
var vec__91149 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var search_result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91149,(0),null);
var set_search_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91149,(1),null);
var vec__91152 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var last_input_at = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91152,(0),null);
var set_last_input_at_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91152,(1),null);
var vec__91155 = (function (){var G__91158 = frontend.handler.search.get_recents();
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__91158) : logseq.shui.hooks.use_state.call(null,G__91158));
})();
var recents = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91155,(0),null);
var set_recents_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91155,(1),null);
var result = ((clojure.string.blank_QMARK_(input))?capacitor.components.search.get_recent_pages():search_result);
logseq.shui.hooks.use_effect_BANG_((function (){
var _STAR_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
if(clojure.string.blank_QMARK_(input)){
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(capacitor.components.search.search_blocks(input)),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise((set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_search_result_BANG_.call(null,result__$1))),(function (___40947__auto__){
return promesa.protocols._promise(((cljs.core.seq(result__$1))?cljs.core.reset_BANG_(_STAR_timeout,setTimeout((function (){
var now = (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
if(cljs.core.truth_((function (){var and__5000__auto__ = last_input_at;
if(cljs.core.truth_(and__5000__auto__)){
return ((now - last_input_at) >= (2000));
} else {
return and__5000__auto__;
}
})())){
frontend.handler.search.add_recent_BANG_(input);

var G__91159 = frontend.handler.search.get_recents();
return (set_recents_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_recents_BANG_.cljs$core$IFn$_invoke$arity$1(G__91159) : set_recents_BANG_.call(null,G__91159));
} else {
return null;
}
}),(2000))):null));
}));
}));
}));
}

return (function (){
var temp__5804__auto__ = cljs.core.deref(_STAR_timeout);
if(cljs.core.truth_(temp__5804__auto__)){
var timeout = temp__5804__auto__;
return clearTimeout(timeout);
} else {
return null;
}
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.hooks.use_debounced_value(input,(150))], null));

return daiquiri.interpreter.interpret(capacitor.ionic.page(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"search-tab",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_page], null),capacitor.ionic.header(capacitor.ionic.toolbar(capacitor.ionic.searchbar(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ref,new cljs.core.Keyword(null,"slot","slot",240229571),"start",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Search",new cljs.core.Keyword(null,"value","value",305978217),input,new cljs.core.Keyword(null,"on-ion-input","on-ion-input",1352827535),(function (e){
var input__$1 = e.detail.value;
(set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1(input__$1) : set_input_BANG_.call(null,input__$1));

var G__91171 = (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
return (set_last_input_at_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_last_input_at_BANG_.cljs$core$IFn$_invoke$arity$1(G__91171) : set_last_input_at_BANG_.call(null,G__91171));
})], null)))),capacitor.ionic.content(((clojure.string.blank_QMARK_(input))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.text-sm.text-muted-foreground.border-b","div.px-4.text-sm.text-muted-foreground.border-b",1201185736),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-item.items-center.justify-between","div.flex.flex-item.items-center.justify-between",1467311931),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Recent search"], null),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"mode","mode",654403691),"ios",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.handler.search.clear_recents_BANG_();

return (set_recents_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_recents_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_recents_BANG_.call(null,null));
})], null),"Clear all")], null)], null),capacitor.ionic.list((function (){var iter__5480__auto__ = (function capacitor$components$search$iter__91172(s__91173){
return (new cljs.core.LazySeq(null,(function (){
var s__91173__$1 = s__91173;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91173__$1);
if(temp__5804__auto__){
var s__91173__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91173__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91173__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91175 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91174 = (0);
while(true){
if((i__91174 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__91174);
cljs.core.chunk_append(b__91175,capacitor.ionic.item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__91174,item,c__5478__auto__,size__5479__auto__,b__91175,s__91173__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result){
return (function (){
return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1(item) : set_input_BANG_.call(null,item));
});})(i__91174,item,c__5478__auto__,size__5479__auto__,b__91175,s__91173__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result))
], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground"], null)),item], null)));

var G__91182 = (i__91174 + (1));
i__91174 = G__91182;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91175),capacitor$components$search$iter__91172(cljs.core.chunk_rest(s__91173__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91175),null);
}
} else {
var item = cljs.core.first(s__91173__$2);
return cljs.core.cons(capacitor.ionic.item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__91173__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result){
return (function (){
return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1(item) : set_input_BANG_.call(null,item));
});})(item,s__91173__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result))
], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground"], null)),item], null)),capacitor$components$search$iter__91172(cljs.core.rest(s__91173__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(recents);
})())], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.text-sm.text-muted-foreground.border-b","div.px-4.py-2.text-sm.text-muted-foreground.border-b",-2064980072),"Recent updates"], null)], null):null),capacitor.ionic.list((function (){var iter__5480__auto__ = (function capacitor$components$search$iter__91176(s__91177){
return (new cljs.core.LazySeq(null,(function (){
var s__91177__$1 = s__91177;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91177__$1);
if(temp__5804__auto__){
var s__91177__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91177__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91177__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91179 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91178 = (0);
while(true){
if((i__91178 < size__5479__auto__)){
var map__91180 = cljs.core._nth(c__5478__auto__,i__91178);
var map__91180__$1 = cljs.core.__destructure_map(map__91180);
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91180__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91180__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91180__$1,new cljs.core.Keyword(null,"header","header",119441134));
var source_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91180__$1,new cljs.core.Keyword(null,"source-page","source-page",1338615502));
var source_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91180__$1,new cljs.core.Keyword(null,"source-block","source-block",-878290804));
cljs.core.chunk_append(b__91179,(function (){var block = (function (){var or__5002__auto__ = source_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return source_block;
}
})();
return capacitor.ionic.item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__91178,block,map__91180,map__91180__$1,icon,text,header,source_page,source_block,c__5478__auto__,size__5479__auto__,b__91179,s__91177__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result){
return (function (){
return capacitor.state.open_block_modal_BANG_(block);
});})(i__91178,block,map__91180,map__91180__$1,icon,text,header,source_page,source_block,c__5478__auto__,size__5479__auto__,b__91179,s__91177__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result))
], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-1.py-1","div.flex.flex-col.gap-1.py-1",-295856894),(cljs.core.truth_(header)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50.text-sm","div.opacity-50.text-sm",602959872),header], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_(icon)?frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground"], null)):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),text], null)], null)], null));
})());

var G__91183 = (i__91178 + (1));
i__91178 = G__91183;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91179),capacitor$components$search$iter__91176(cljs.core.chunk_rest(s__91177__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91179),null);
}
} else {
var map__91181 = cljs.core.first(s__91177__$2);
var map__91181__$1 = cljs.core.__destructure_map(map__91181);
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91181__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91181__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91181__$1,new cljs.core.Keyword(null,"header","header",119441134));
var source_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91181__$1,new cljs.core.Keyword(null,"source-page","source-page",1338615502));
var source_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91181__$1,new cljs.core.Keyword(null,"source-block","source-block",-878290804));
return cljs.core.cons((function (){var block = (function (){var or__5002__auto__ = source_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return source_block;
}
})();
return capacitor.ionic.item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (block,map__91181,map__91181__$1,icon,text,header,source_page,source_block,s__91177__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result){
return (function (){
return capacitor.state.open_block_modal_BANG_(block);
});})(block,map__91181,map__91181__$1,icon,text,header,source_page,source_block,s__91177__$2,temp__5804__auto__,_STAR_ref,vec__91146,input,set_input_BANG_,vec__91149,search_result,set_search_result_BANG_,vec__91152,last_input_at,set_last_input_at_BANG_,vec__91155,recents,set_recents_BANG_,result))
], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-1.py-1","div.flex.flex-col.gap-1.py-1",-295856894),(cljs.core.truth_(header)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50.text-sm","div.opacity-50.text-sm",602959872),header], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_(icon)?frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground"], null)):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),text], null)], null)], null));
})(),capacitor$components$search$iter__91176(cljs.core.rest(s__91177__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(result);
})()))));
}),null,"capacitor.components.search/search");

//# sourceMappingURL=capacitor.components.search.js.map
