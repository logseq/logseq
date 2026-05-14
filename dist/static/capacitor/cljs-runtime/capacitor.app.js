goog.provide('capacitor.app');
var module$node_modules$$capacitor$app$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$app$dist$plugin_cjs", {});
var module$node_modules$$capacitor$status_bar$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$status_bar$dist$plugin_cjs", {});
capacitor.app.app_sidebar = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(capacitor.ionic.ion_menu(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content-id","content-id",2059825940),"app-main-content",new cljs.core.Keyword(null,"type","type",1174270348),"push"], null),capacitor.ionic.ion_header(capacitor.ionic.ion_toolbar(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.px-2","strong.px-2",-781471565),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),"Navigations"], null))),capacitor.ionic.ion_content(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"hello, logseq?"], null)], null))));
}),null,"capacitor.app/app-sidebar");
capacitor.app.journals_list = rum.core.lazy_build(rum.core.build_defc,(function (){
var journals = capacitor.handler.sub_journals();
return daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function capacitor$app$iter__99621(s__99622){
return (new cljs.core.LazySeq(null,(function (){
var s__99622__$1 = s__99622;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__99622__$1);
if(temp__5804__auto__){
var s__99622__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__99622__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__99622__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__99624 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__99623 = (0);
while(true){
if((i__99623 < size__5479__auto__)){
var journal_id = cljs.core._nth(c__5478__auto__,i__99623);
cljs.core.chunk_append(b__99624,(function (){var journal = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(journal_id);
return daiquiri.core.create_element("li",{'onClick':((function (i__99623,journal,journal_id,c__5478__auto__,size__5479__auto__,b__99624,s__99622__$2,temp__5804__auto__,journals){
return (function (){
return capacitor.pages.utils.nav_to_block_BANG_(journal,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),((function (i__99623,journal,journal_id,c__5478__auto__,size__5479__auto__,b__99624,s__99622__$2,temp__5804__auto__,journals){
return (function (){
return cljs.core.List.EMPTY;
});})(i__99623,journal,journal_id,c__5478__auto__,size__5479__auto__,b__99624,s__99622__$2,temp__5804__auto__,journals))
], null));
});})(i__99623,journal,journal_id,c__5478__auto__,size__5479__auto__,b__99624,s__99622__$2,temp__5804__auto__,journals))
,'className':"font-mono flex items-center py-1 active:opacity-50 active:underline whitespace-nowrap"},[daiquiri.interpreter.interpret(capacitor.ionic.tabler_icon("calendar")),(function (){var attrs99632 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(journal);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs99632))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs99632], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs99632))?null:[daiquiri.interpreter.interpret(attrs99632)]));
})()]);
})());

var G__99886 = (i__99623 + (1));
i__99623 = G__99886;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__99624),capacitor$app$iter__99621(cljs.core.chunk_rest(s__99622__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__99624),null);
}
} else {
var journal_id = cljs.core.first(s__99622__$2);
return cljs.core.cons((function (){var journal = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(journal_id);
return daiquiri.core.create_element("li",{'onClick':((function (journal,journal_id,s__99622__$2,temp__5804__auto__,journals){
return (function (){
return capacitor.pages.utils.nav_to_block_BANG_(journal,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),(function (){
return cljs.core.List.EMPTY;
})], null));
});})(journal,journal_id,s__99622__$2,temp__5804__auto__,journals))
,'className':"font-mono flex items-center py-1 active:opacity-50 active:underline whitespace-nowrap"},[daiquiri.interpreter.interpret(capacitor.ionic.tabler_icon("calendar")),(function (){var attrs99632 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(journal);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs99632))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pl-1"], null)], null),attrs99632], 0))):{'className':"pl-1"}),((cljs.core.map_QMARK_(attrs99632))?null:[daiquiri.interpreter.interpret(attrs99632)]));
})()]);
})(),capacitor$app$iter__99621(cljs.core.rest(s__99622__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(journals);
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"capacitor.app/journals-list");
capacitor.app.create_page_input = rum.core.lazy_build(rum.core.build_defc,(function (p__99652){
var map__99653 = p__99652;
var map__99653__$1 = cljs.core.__destructure_map(map__99653);
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99653__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
var reload_pages_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99653__$1,new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889));
return daiquiri.interpreter.interpret(capacitor.ionic.ion_alert(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"is-open","is-open",1660707069),true,new cljs.core.Keyword(null,"header","header",119441134),"Create new page",new cljs.core.Keyword(null,"onWillDismiss","onWillDismiss",1020718323),(function (e){
var detail = e.detail;
var temp__5804__auto___99891 = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("confirm",detail.role);
if(and__5000__auto__){
return (detail.data.values[(0)]);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___99891)){
var val_99892 = temp__5804__auto___99891;
promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(capacitor.handler._LT_create_page_BANG_(val_99892),reload_pages_BANG_);
} else {
}

return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
}),new cljs.core.Keyword(null,"onDidPresent","onDidPresent",244043342),(function (e){
var target = e.target;
var temp__5804__auto__ = target.querySelector("input");
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return setTimeout((function (){
return input.focus();
}));
} else {
return null;
}
}),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [({"text": "Cancel", "role": "cancel"}),({"text": "Confirm", "role": "confirm"})], null),new cljs.core.Keyword(null,"inputs","inputs",865803858),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [({"placeholder": "page name", "auto-focus": true})], null)], null)));
}),null,"capacitor.app/create-page-input");
capacitor.app.home = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__99699 = rum.core.use_state(cljs.core.PersistentVector.EMPTY);
var all_pages = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99699,(0),null);
var set_all_pages_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99699,(1),null);
var vec__99702 = rum.core.use_state((0));
var reload = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99702,(0),null);
var set_reload_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99702,(1),null);
var vec__99705 = rum.core.use_state(false);
var page_input_open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99705,(0),null);
var set_page_input_open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99705,(1),null);
var vec__99708 = rum.core.use_state(cljs.core.PersistentVector.EMPTY);
var filtered_pages = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99708,(0),null);
var set_filtered_pages_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99708,(1),null);
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var G__99713_99900 = capacitor.handler.local_all_pages();
(set_all_pages_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_all_pages_BANG_.cljs$core$IFn$_invoke$arity$1(G__99713_99900) : set_all_pages_BANG_.call(null,G__99713_99900));

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [reload], null));

rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var pages_99901 = cljs.core.filterv((function (page){
var ident = (function (){var G__99716 = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page);
var G__99716__$1 = (((G__99716 == null))?null:cljs.core.first(G__99716));
if((G__99716__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(G__99716__$1);
}
})();
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),null,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null),ident)));
}),all_pages);
(set_filtered_pages_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filtered_pages_BANG_.cljs$core$IFn$_invoke$arity$1(pages_99901) : set_filtered_pages_BANG_.call(null,pages_99901));

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [all_pages], null));

return daiquiri.interpreter.interpret(capacitor.ionic.ion_content(capacitor.ionic.ion_refresher(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"slot","slot",240229571),"fixed",new cljs.core.Keyword(null,"pull-factor","pull-factor",1428236013),0.5,new cljs.core.Keyword(null,"pull-min","pull-min",-2031488524),(100),new cljs.core.Keyword(null,"pull-max","pull-max",-103911866),(200),new cljs.core.Keyword(null,"on-ion-refresh","on-ion-refresh",-1806220105),(function (e){
return setTimeout((function (){
e.detail.complete();

var G__99809 = (reload + (1));
return (set_reload_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_reload_BANG_.cljs$core$IFn$_invoke$arity$1(G__99809) : set_reload_BANG_.call(null,G__99809));
}),(1000));
})], null),capacitor.ionic.ion_refresher_content()),(cljs.core.truth_(page_input_open_QMARK_)?capacitor.app.create_page_input(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"close!","close!",-2079310498),(function (){
return (set_page_input_open_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_page_input_open_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_page_input_open_QMARK_.call(null,false));
}),new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),(function (){
var G__99818 = (reload + (1));
return (set_reload_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_reload_BANG_.cljs$core$IFn$_invoke$arity$1(G__99818) : set_reload_BANG_.call(null,G__99818));
})], null)):null),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pt-6.px-6","div.pt-6.px-6",-360618093),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center","div.flex.justify-between.items-center",-1855308582),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.font-mono.font-bold.py-2","h1.text-3xl.font-mono.font-bold.py-2",1466834687),"Current graph"], null),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto__ = prompt("Create new db");
if(cljs.core.truth_(temp__5804__auto__)){
var db_name = temp__5804__auto__;
if(clojure.string.blank_QMARK_(db_name)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1(db_name),(function (){
var G__99822 = (reload + (1));
return (set_reload_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_reload_BANG_.cljs$core$IFn$_invoke$arity$1(G__99822) : set_reload_BANG_.call(null,G__99822));
}));
}
} else {
return null;
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"icon-only"], null),capacitor.ionic.tabler_icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null))], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.py-1.text-lg","h2.py-1.text-lg",2108468579),frontend.state.get_current_repo()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center.mt-4","div.flex.justify-between.items-center.mt-4",-589409754),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.font-mono.font-bold.py-2","h1.text-3xl.font-mono.font-bold.py-2",1466834687),"Journals"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"flex.gap-1","flex.gap-1",1920182326),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return capacitor.components.ui.open_modal_BANG_((function (p__99831){
var map__99832 = p__99831;
var map__99832__$1 = cljs.core.__destructure_map(map__99832);
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99832__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
return capacitor.ionic.ion_datetime(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"presentation","presentation",-997269830),"date",new cljs.core.Keyword(null,"onIonChange","onIonChange",-155182027),(function (e){
var val = e.detail.value;
var page_name = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1((new goog.date.Date((new Date(val)))));
var nav_to_journal_BANG_ = (function (p1__99687_SHARP_){
return capacitor.pages.utils.nav_to_block_BANG_(p1__99687_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),(function (){
return cljs.core.List.EMPTY;
})], null));
});
var temp__5802__auto___99908 = capacitor.handler.local_page(page_name);
if(cljs.core.truth_(temp__5802__auto___99908)){
var journal_99912 = temp__5802__auto___99908;
nav_to_journal_BANG_(journal_99912);
} else {
promesa.core.then.cljs$core$IFn$_invoke$arity$2(capacitor.handler._LT_create_page_BANG_(page_name),(function (){
return nav_to_journal_BANG_(capacitor.handler.local_page(page_name));
}));
}

return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
})], null));
}));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"icon-only"], null),capacitor.ionic.tabler_icon("calendar",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null))], null))], null)], null),capacitor.app.journals_list(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center.pt-4","div.flex.justify-between.items-center.pt-4",668662381),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.font-mono.font-bold.py-2","h1.text-3xl.font-mono.font-bold.py-2",1466834687),"All pages",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-xs.pl-2.opacity-50","small.text-xs.pl-2.opacity-50",-1496693660),cljs.core.count(filtered_pages)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-1","div.flex.gap-1",-128514922),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_page_input_open_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_page_input_open_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_page_input_open_QMARK_.call(null,true));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"icon-only"], null),capacitor.ionic.tabler_icon("file-plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null))], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.mb-24.pt-2","ul.mb-24.pt-2",1787234848),(function (){var iter__5480__auto__ = (function capacitor$app$iter__99839(s__99840){
return (new cljs.core.LazySeq(null,(function (){
var s__99840__$1 = s__99840;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__99840__$1);
if(temp__5804__auto__){
var s__99840__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__99840__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__99840__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__99842 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__99841 = (0);
while(true){
if((i__99841 < size__5479__auto__)){
var page = cljs.core._nth(c__5478__auto__,i__99841);
cljs.core.chunk_append(b__99842,(function (){var ident = (function (){var G__99848 = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page);
var G__99848__$1 = (((G__99848 == null))?null:cljs.core.first(G__99848));
if((G__99848__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(G__99848__$1);
}
})();
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap","li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap",-1923791790),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__99841,ident,page,c__5478__auto__,size__5479__auto__,b__99842,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_){
return (function (){
return capacitor.pages.utils.nav_to_block_BANG_(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),((function (i__99841,ident,page,c__5478__auto__,size__5479__auto__,b__99842,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_){
return (function (){
var G__99849 = (reload + (1));
return (set_reload_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_reload_BANG_.cljs$core$IFn$_invoke$arity$1(G__99849) : set_reload_BANG_.call(null,G__99849));
});})(i__99841,ident,page,c__5478__auto__,size__5479__auto__,b__99842,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_))
], null));
});})(i__99841,ident,page,c__5478__auto__,size__5479__auto__,b__99842,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_))
], null),(function (){var G__99850 = ident;
var G__99850__$1 = (((G__99850 instanceof cljs.core.Keyword))?G__99850.fqn:null);
switch (G__99850__$1) {
case "logseq.class/Property":
return capacitor.ionic.tabler_icon("letter-t");

break;
case "logseq.class/Page":
return capacitor.ionic.tabler_icon("file");

break;
case "logseq.class/Journal":
return capacitor.ionic.tabler_icon("calendar");

break;
default:
return capacitor.ionic.tabler_icon("hash");

}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.opacity-30.scale-75","code.opacity-30.scale-75",-1697091300),(new Date(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(page))).toLocaleDateString()], null)], null);
})());

var G__99921 = (i__99841 + (1));
i__99841 = G__99921;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__99842),capacitor$app$iter__99839(cljs.core.chunk_rest(s__99840__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__99842),null);
}
} else {
var page = cljs.core.first(s__99840__$2);
return cljs.core.cons((function (){var ident = (function (){var G__99854 = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page);
var G__99854__$1 = (((G__99854 == null))?null:cljs.core.first(G__99854));
if((G__99854__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(G__99854__$1);
}
})();
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap","li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap",-1923791790),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (ident,page,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_){
return (function (){
return capacitor.pages.utils.nav_to_block_BANG_(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889),(function (){
var G__99855 = (reload + (1));
return (set_reload_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_reload_BANG_.cljs$core$IFn$_invoke$arity$1(G__99855) : set_reload_BANG_.call(null,G__99855));
})], null));
});})(ident,page,s__99840__$2,temp__5804__auto__,vec__99699,all_pages,set_all_pages_BANG_,vec__99702,reload,set_reload_BANG_,vec__99705,page_input_open_QMARK_,set_page_input_open_QMARK_,vec__99708,filtered_pages,set_filtered_pages_BANG_))
], null),(function (){var G__99856 = ident;
var G__99856__$1 = (((G__99856 instanceof cljs.core.Keyword))?G__99856.fqn:null);
switch (G__99856__$1) {
case "logseq.class/Property":
return capacitor.ionic.tabler_icon("letter-t");

break;
case "logseq.class/Page":
return capacitor.ionic.tabler_icon("file");

break;
case "logseq.class/Journal":
return capacitor.ionic.tabler_icon("calendar");

break;
default:
return capacitor.ionic.tabler_icon("hash");

}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.opacity-30.scale-75","code.opacity-30.scale-75",-1697091300),(new Date(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(page))).toLocaleDateString()], null)], null);
})(),capacitor$app$iter__99839(cljs.core.rest(s__99840__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(filtered_pages);
})()], null)], null)));
}),null,"capacitor.app/home");
capacitor.app.root = rum.core.lazy_build(rum.core.build_defc,(function (){
var db_restoring_QMARK_ = frontend.state.sub(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233));
return daiquiri.core.create_element(daiquiri.core.fragment,null,[capacitor.app.app_sidebar(),daiquiri.interpreter.interpret(capacitor.ionic.ion_page(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"app-main-content"], null),capacitor.ionic.ion_header(capacitor.ionic.ion_toolbar(capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),capacitor.ionic.ion_menu_button(),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-90"], null),capacitor.ionic.tabler_icon("search",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(22),new cljs.core.Keyword(null,"stroke","stroke",1741823555),(2)], null)))),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"slot","slot",240229571),"end",new cljs.core.Keyword(null,"fill","fill",883462889),"clear"], null),capacitor.ionic.ion_nav_link(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"routerDirection","routerDirection",1587214),"forward",new cljs.core.Keyword(null,"class","class",-2030961996),"w-full",new cljs.core.Keyword(null,"component","component",1555936782),capacitor.pages.settings.page], null),capacitor.ionic.tabler_icon("upload",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(24),new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-70"], null)))))),(cljs.core.truth_(db_restoring_QMARK_)?capacitor.ionic.ion_content(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.flex.justify-center.items-center.py-24","strong.flex.justify-center.items-center.py-24",1688462136),capacitor.ionic.tabler_icon("loader",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"animate animate-spin opacity-50",new cljs.core.Keyword(null,"size","size",1098693007),(30)], null))], null)):capacitor.app.home())))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.app/root");
capacitor.app.main = rum.core.lazy_build(rum.core.build_defc,(function (){
var nav_ref = rum.core.use_ref(null);
var vec__99864 = capacitor.state.use_nav_root();
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99864,(0),null);
var set_nav_root_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99864,(1),null);
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var G__99869_99923 = window.externalsjs;
if((G__99869_99923 == null)){
} else {
G__99869_99923.settleStatusBar();
}

var G__99870 = window.externalsjs;
if((G__99870 == null)){
return null;
} else {
return G__99870.initGlobalListeners();
}
}),cljs.core.PersistentVector.EMPTY);

rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var handle_back_BANG_ = (function (){
return rum.core.deref(nav_ref).pop();
});
var back_listener = module$node_modules$$capacitor$app$dist$plugin_cjs.App.addListener("backButton",handle_back_BANG_);
return (function (){
return back_listener.remove();
});
}),cljs.core.PersistentVector.EMPTY);

rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
var G__99871_99924 = rum.core.deref(nav_ref);
(set_nav_root_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_nav_root_BANG_.cljs$core$IFn$_invoke$arity$1(G__99871_99924) : set_nav_root_BANG_.call(null,G__99871_99924));

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.deref(nav_ref)], null));

return rum.core.adapt_class_helper(capacitor.ionic.ionic_react.IonApp,null,[(function (){var attrs99875 = capacitor.ionic.ion_nav(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"ref","ref",1289896967),nav_ref,new cljs.core.Keyword(null,"root","root",-448657453),capacitor.app.root,new cljs.core.Keyword(null,"animated","animated",129318795),true,new cljs.core.Keyword(null,"swipeGesture","swipeGesture",38034953),false], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs99875))?daiquiri.interpreter.element_attributes(attrs99875):null),((cljs.core.map_QMARK_(attrs99875))?[capacitor.components.ui.install_notifications(),capacitor.components.ui.install_modals()]:[daiquiri.interpreter.interpret(attrs99875),capacitor.components.ui.install_notifications(),capacitor.components.ui.install_modals()]));
})()]);
}),null,"capacitor.app/main");

//# sourceMappingURL=capacitor.app.js.map
