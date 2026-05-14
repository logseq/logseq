goog.provide('capacitor.pages.blocks');
capacitor.pages.blocks.edit_block_modal = rum.core.lazy_build(rum.core.build_defc,(function (block,p__99350){
var map__99354 = p__99350;
var map__99354__$1 = cljs.core.__destructure_map(map__99354);
var reload_page_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99354__$1,new cljs.core.Keyword(null,"reload-page!","reload-page!",2081192252));
var vec__99362 = capacitor.state.use_nav_root();
var nav = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99362,(0),null);
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var _STAR_input = rum.core.use_ref(null);
var close_BANG_ = (function (){
return nav.pop();
});
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
setTimeout((function (){
var temp__5804__auto__ = (function (){var G__99376 = rum.core.deref(_STAR_input);
if((G__99376 == null)){
return null;
} else {
return G__99376.querySelector("textarea");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
input.focus();

var len = input.value.length;
return input.setSelectionRange(len,len);
} else {
return null;
}
}),(100));

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.interpreter.interpret(capacitor.ionic.ion_page(capacitor.ionic.ion_header(capacitor.ionic.ion_toolbar(capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),(((!((new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block) == null))))?capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-80 text-red-500",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.delete_block_aux_BANG_(block),(function (){
close_BANG_();

return (reload_page_BANG_.cljs$core$IFn$_invoke$arity$0 ? reload_page_BANG_.cljs$core$IFn$_invoke$arity$0() : reload_page_BANG_.call(null));
}));
})], null),capacitor.ionic.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null))):null)),capacitor.ionic.ion_title((function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Untitled";
}
})()))),capacitor.ionic.ion_content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.py-2","div.py-2",-1233160868),capacitor.ionic.ion_textarea(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"block content",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input,new cljs.core.Keyword(null,"class","class",-2030961996),"bg-gray-100",new cljs.core.Keyword(null,"auto-grow","auto-grow",1663039400),true,new cljs.core.Keyword(null,"autofocus","autofocus",-712814732),true,new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.py-2.justify-between","div.flex.py-2.justify-between",-2091881525),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return close_BANG_();
}),new cljs.core.Keyword(null,"fill","fill",883462889),"clear"], null),"Cancel"),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var new_QMARK_ = (new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block) == null);
var val = rum.core.deref(_STAR_input).querySelector("textarea").value;
var temp__5802__auto__ = (function (){var and__5000__auto__ = new_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var page = temp__5802__auto__;
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.api_insert_new_block_BANG_(val,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], null)),(function (){
close_BANG_();

return (reload_page_BANG_.cljs$core$IFn$_invoke$arity$0 ? reload_page_BANG_.cljs$core$IFn$_invoke$arity$0() : reload_page_BANG_.call(null));
}));
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),val),(function (){
close_BANG_();

return (reload_page_BANG_.cljs$core$IFn$_invoke$arity$0 ? reload_page_BANG_.cljs$core$IFn$_invoke$arity$0() : reload_page_BANG_.call(null));
}));
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),""], null),"Save")], null))));
}),null,"capacitor.pages.blocks/edit-block-modal");
capacitor.pages.blocks.nav_to_edit_block_BANG_ = (function capacitor$pages$blocks$nav_to_edit_block_BANG_(block,opts){
var G__99431 = cljs.core.deref(capacitor.state._STAR_nav_root);
if((G__99431 == null)){
return null;
} else {
return G__99431.push((function (){
return capacitor.pages.blocks.edit_block_modal(block,opts);
}));
}
});
capacitor.pages.blocks.page = rum.core.lazy_build(rum.core.build_defc,(function (block,p__99450){
var map__99451 = p__99450;
var map__99451__$1 = cljs.core.__destructure_map(map__99451);
var reload_pages_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99451__$1,new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889));
var vec__99462 = capacitor.state.use_nav_root();
var nav = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99462,(0),null);
var vec__99465 = rum.core.use_state(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)));
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99465,(0),null);
var set_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99465,(1),null);
var title = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block.temp","cached-title","block.temp/cached-title",1568935493).cljs$core$IFn$_invoke$arity$1(block);
}
})();
var vec__99468 = rum.core.use_state(true);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99468,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99468,(1),null);
var rerender_BANG_ = (function (){
var G__99477 = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return (set_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__99477) : set_page_BANG_.call(null,G__99477));
});
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),(function (p1__99434_SHARP_){
var G__99481 = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__99434_SHARP_));
return (set_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__99481) : set_page_BANG_.call(null,G__99481));
})),(function (){
return (set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false));
}));

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.interpreter.interpret(capacitor.ionic.ion_page(capacitor.ionic.ion_header(capacitor.ionic.ion_toolbar(capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return nav.pop();
})], null),capacitor.ionic.tabler_icon("arrow-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-80",new cljs.core.Keyword(null,"on-click","on-click",1632826543),rerender_BANG_], null),capacitor.ionic.tabler_icon("refresh",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null))),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-80 text-red-500",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__99504 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var G__99505 = (function (){
nav.pop();

return (reload_pages_BANG_.cljs$core$IFn$_invoke$arity$0 ? reload_pages_BANG_.cljs$core$IFn$_invoke$arity$0() : reload_pages_BANG_.call(null));
});
var G__99506 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (e){
return console.error(e);
})], null);
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3(G__99504,G__99505,G__99506) : frontend.handler.page._LT_delete_BANG_.call(null,G__99504,G__99505,G__99506));
})], null),capacitor.ionic.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.ion_title(title))),capacitor.ionic.ion_content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),(cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xl.text-center","p.text-xl.text-center",858386954),"Loading ..."], null):(function (){var edit_opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-page!","reload-page!",2081192252),rerender_BANG_], null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto__)){
var children = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.mt-2","ul.mt-2",-237871742),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"min-h-[80px]"], null),(function (){var iter__5480__auto__ = (function capacitor$pages$blocks$iter__99507(s__99508){
return (new cljs.core.LazySeq(null,(function (){
var s__99508__$1 = s__99508;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__99508__$1);
if(temp__5804__auto____$1){
var s__99508__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__99508__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__99508__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__99510 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__99509 = (0);
while(true){
if((i__99509 < size__5479__auto__)){
var block__$1 = cljs.core._nth(c__5478__auto__,i__99509);
cljs.core.chunk_append(b__99510,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.text-xl","li.text-xl",2132224196),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__99509,block__$1,c__5478__auto__,size__5479__auto__,b__99510,s__99508__$2,temp__5804__auto____$1,children,temp__5804__auto__,edit_opts,vec__99462,nav,vec__99465,page,set_page_BANG_,title,vec__99468,loading_QMARK_,set_loading_BANG_,rerender_BANG_,map__99451,map__99451__$1,reload_pages_BANG_){
return (function (){
return capacitor.pages.blocks.nav_to_edit_block_BANG_(block__$1,edit_opts);
});})(i__99509,block__$1,c__5478__auto__,size__5479__auto__,b__99510,s__99508__$2,temp__5804__auto____$1,children,temp__5804__auto__,edit_opts,vec__99462,nav,vec__99465,page,set_page_BANG_,title,vec__99468,loading_QMARK_,set_loading_BANG_,rerender_BANG_,map__99451,map__99451__$1,reload_pages_BANG_))
], null),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1)], null));

var G__99555 = (i__99509 + (1));
i__99509 = G__99555;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__99510),capacitor$pages$blocks$iter__99507(cljs.core.chunk_rest(s__99508__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__99510),null);
}
} else {
var block__$1 = cljs.core.first(s__99508__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.text-xl","li.text-xl",2132224196),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (block__$1,s__99508__$2,temp__5804__auto____$1,children,temp__5804__auto__,edit_opts,vec__99462,nav,vec__99465,page,set_page_BANG_,title,vec__99468,loading_QMARK_,set_loading_BANG_,rerender_BANG_,map__99451,map__99451__$1,reload_pages_BANG_){
return (function (){
return capacitor.pages.blocks.nav_to_edit_block_BANG_(block__$1,edit_opts);
});})(block__$1,s__99508__$2,temp__5804__auto____$1,children,temp__5804__auto__,edit_opts,vec__99462,nav,vec__99465,page,set_page_BANG_,title,vec__99468,loading_QMARK_,set_loading_BANG_,rerender_BANG_,map__99451,map__99451__$1,reload_pages_BANG_))
], null),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1)], null),capacitor$pages$blocks$iter__99507(cljs.core.rest(s__99508__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(children);
})()], null);
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.pt-3.flex","p.pt-3.flex",-400916353),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"outline",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return capacitor.pages.blocks.nav_to_edit_block_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","page","block/page",822314108),page], null),edit_opts);
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-full"], null),"+ Add")], null)], null);
})()))));
}),null,"capacitor.pages.blocks/page");

//# sourceMappingURL=capacitor.pages.blocks.js.map
