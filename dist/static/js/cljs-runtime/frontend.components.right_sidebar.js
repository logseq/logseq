goog.provide('frontend.components.right_sidebar');
frontend.components.right_sidebar.toggle = rum.core.lazy_build(rum.core.build_defc,(function (){
if(frontend.util.sm_breakpoint_QMARK_()){
return null;
} else {
return frontend.ui.with_shortcut(new cljs.core.Keyword("ui","toggle-right-sidebar","ui/toggle-right-sidebar",-1502060890),"left",logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"layout-sidebar-right","layout-sidebar-right",405939392),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","toggle-right-sidebar","right-side-bar/toggle-right-sidebar",-89605312)], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"toggle-right-sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.ui.toggle_right_sidebar_BANG_], null)));
}
}),null,"frontend.components.right-sidebar/toggle");
frontend.components.right_sidebar.block_cp = rum.core.lazy_build(rum.core.build_defc,(function (repo,idx,block){
var id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
return daiquiri.core.create_element("div",{'className':"mt-2"},[frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)], null)], null),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),true,new cljs.core.Keyword("sidebar","idx","sidebar/idx",-1047236867),idx,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.right-sidebar/block-cp");
frontend.components.right_sidebar.get_scrollable_container = (function frontend$components$right_sidebar$get_scrollable_container(){
return document.querySelector(".sidebar-item-list");
});
frontend.components.right_sidebar.page_cp = rum.core.lazy_build(rum.core.build_defc,(function (repo,page_name){
return frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),page_name], null)], null),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),true,new cljs.core.Keyword(null,"scroll-container","scroll-container",-1938238550),frontend.components.right_sidebar.get_scrollable_container(),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.right-sidebar/page-cp");
frontend.components.right_sidebar.shortcut_settings = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"contents flex-col flex ml-3"},[frontend.components.shortcut_help.shortcut_page(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-title?","show-title?",1855789994),false], null))]);
}),null,"frontend.components.right-sidebar/shortcut-settings");
frontend.components.right_sidebar.block_with_breadcrumb = (function frontend$components$right_sidebar$block_with_breadcrumb(repo,block,idx,sidebar_key,ref_QMARK_){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(ref_QMARK_)?"ml-2":null)], null),frontend.components.block.breadcrumb(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"block-parent",new cljs.core.Keyword(null,"block?","block?",1102479923),true,new cljs.core.Keyword(null,"sidebar-key","sidebar-key",2034878565),sidebar_key], null),repo,block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"indent?","indent?",1381429379),false], null))], null),frontend.components.right_sidebar.block_cp(repo,idx,block)], null);
} else {
return null;
}
});
frontend.components.right_sidebar.search_title = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_input){
var input = rum.core.react(_STAR_input);
var input_SINGLEQUOTE_ = ((clojure.string.blank_QMARK_(input))?"Blank input":input);
var attrs134491 = input_SINGLEQUOTE_;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134491))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["overflow-hidden","text-ellipsis"], null)], null),attrs134491], 0))):{'className':"overflow-hidden text-ellipsis"}),((cljs.core.map_QMARK_(attrs134491))?null:[daiquiri.interpreter.interpret(attrs134491)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.right-sidebar/search-title");
frontend.components.right_sidebar.sidebar_search = rum.core.lazy_build(rum.core.build_defc,(function (repo,block_type,init_key,input,_STAR_input){
return rum.core.with_key(frontend.components.cmdk.core.cmdk_block(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"initial-input","initial-input",1864686534),input,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),true,new cljs.core.Keyword(null,"on-input-change","on-input-change",-1203383147),(function (new_value){
return cljs.core.reset_BANG_(_STAR_input,new_value);
}),new cljs.core.Keyword(null,"on-input-blur","on-input-blur",938716471),(function (new_value){
return frontend.state.sidebar_replace_block_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,input,block_type], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,new_value,block_type], null));
})], null)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(init_key));
}),null,"frontend.components.right-sidebar/sidebar-search");
frontend.components.right_sidebar._LT_build_sidebar_item = (function frontend$components$right_sidebar$_LT_build_sidebar_item(repo,idx,db_id,block_type,_STAR_db_id,init_key){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"search","search",1564939822),null,new cljs.core.Keyword(null,"contents","contents",-1567174023),null], null), null),block_type))?null:frontend.db.async._LT_get_block(repo,db_id))),(function (___41611__auto__){
return promesa.protocols._promise((function (){var lookup = ((cljs.core.integer_QMARK_(db_id))?db_id:((cljs.core.uuid_QMARK_(db_id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),db_id], null):null
));
var entity = (cljs.core.truth_(lookup)?(frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,lookup) : frontend.db.entity.call(null,repo,lookup)):null);
var page_QMARK_ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.page_QMARK_.call(null,entity));
var block_render = (function (){
if(cljs.core.truth_(entity)){
if(cljs.core.truth_(page_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center.page-title.gap-1",".flex.items-center.page-title.gap-1",601821301),frontend.components.icon.get_node_icon_cp(entity,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.overflow-hidden.text-ellipsis","span.overflow-hidden.text-ellipsis",1998457561),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity)], null)], null),frontend.components.right_sidebar.page_cp(repo,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity)))], null);
} else {
return frontend.components.right_sidebar.block_with_breadcrumb(repo,entity,idx,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,db_id,block_type], null),false);
}
} else {
return null;
}
});
var G__134496 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(block_type);
var G__134496__$1 = (((G__134496 instanceof cljs.core.Keyword))?G__134496.fqn:null);
switch (G__134496__$1) {
case "contents":
var temp__5804__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1("Contents") : frontend.db.get_page.call(null,"Contents"));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("list-details",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","contents","right-side-bar/contents",-293331541)], 0))], null),frontend.components.right_sidebar.page_cp(repo,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)))], null);
} else {
return null;
}

break;
case "help":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("help",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","help","right-side-bar/help",432037932)], 0))], null),frontend.components.onboarding.help()], null);

break;
case "page-graph":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("hierarchy",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","page-graph","right-side-bar/page-graph",1357852608)], 0))], null),frontend.components.page.page_graph()], null);

break;
case "block-ref":
var lookup__$1 = ((cljs.core.integer_QMARK_(db_id))?db_id:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),db_id], null));
var temp__5804__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,lookup__$1) : frontend.db.entity.call(null,repo,lookup__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","block-ref","right-side-bar/block-ref",-642763962)], 0)),frontend.components.right_sidebar.block_with_breadcrumb(repo,block,idx,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,db_id,block_type], null),true)], null);
} else {
return null;
}

break;
case "block":
return block_render();

break;
case "page":
return block_render();

break;
case "search":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center.page-title",".flex.items-center.page-title",345752768),frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),frontend.components.right_sidebar.search_title(_STAR_db_id)], null),frontend.components.right_sidebar.sidebar_search(repo,block_type,init_key,db_id,_STAR_db_id)], null);

break;
case "shortcut-settings":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("command",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("help","shortcuts","help/shortcuts",1722445217)], 0))], null),frontend.components.right_sidebar.shortcut_settings()], null);

break;
case "rtc":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("cloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),"(Dev) RTC"], null),frontend.db.rtc.debug_ui.rtc_debug_ui()], null);

break;
case "profiler":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex.items-center",".flex.items-center",-697647768),frontend.ui.icon("cloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-2"], null)),"(Dev) Profiler"], null),frontend.components.profiler.profiler()], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991)], null)], null);

}
})());
}));
})),(function (error){
return console.error(error);
}));
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.right_sidebar !== 'undefined') && (typeof frontend.components.right_sidebar._STAR_drag_to !== 'undefined')){
} else {
frontend.components.right_sidebar._STAR_drag_to = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.right_sidebar !== 'undefined') && (typeof frontend.components.right_sidebar._STAR_drag_from !== 'undefined')){
} else {
frontend.components.right_sidebar._STAR_drag_from = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.right_sidebar.actions_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (db_id,idx,type,collapsed_QMARK_,block_count){
var multi_items_QMARK_ = (block_count > (1));
var menu_item = logseq.shui.ui.dropdown_menu_item;
var block = ((cljs.core.integer_QMARK_(db_id))?(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.entity.call(null,db_id)):null);
var page_QMARK_ = (function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"contents","contents",-1567174023),null], null), null),type);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block));
}
})();
var attrs134504 = (function (){var G__134519 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_block_BANG_(idx);
})], null);
var G__134520 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close","right-side-bar/pane-close",1498022936)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134519,G__134520) : menu_item.call(null,G__134519,G__134520));
})();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs134504))?daiquiri.interpreter.element_attributes(attrs134504):null),((cljs.core.map_QMARK_(attrs134504))?[((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134524 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_rest_BANG_(db_id);
})], null);
var G__134525 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close-others","right-side-bar/pane-close-others",2036389555)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134524,G__134525) : menu_item.call(null,G__134524,G__134525));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134530 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.clear_sidebar_blocks_BANG_();

return frontend.state.hide_right_sidebar_BANG_();
})], null);
var G__134531 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close-all","right-side-bar/pane-close-all",-2046824627)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134530,G__134531) : menu_item.call(null,G__134530,G__134531));
})()):null),((((cljs.core.not(collapsed_QMARK_)) && (multi_items_QMARK_)))?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(collapsed_QMARK_)?null:daiquiri.interpreter.interpret((function (){var G__134536 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
})], null);
var G__134537 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse","right-side-bar/pane-collapse",1078755450)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134536,G__134537) : menu_item.call(null,G__134536,G__134537));
})())),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134541 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_collapse_rest_BANG_(db_id);
})], null);
var G__134542 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse-others","right-side-bar/pane-collapse-others",580764536)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134541,G__134542) : menu_item.call(null,G__134541,G__134542));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134546 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_set_collapsed_all_BANG_(true);
})], null);
var G__134547 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse-all","right-side-bar/pane-collapse-all",341880617)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134546,G__134547) : menu_item.call(null,G__134546,G__134547));
})()):null),(cljs.core.truth_((function (){var and__5000__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return multi_items_QMARK_;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(collapsed_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134552 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
})], null);
var G__134553 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-expand","right-side-bar/pane-expand",-42815216)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134552,G__134553) : menu_item.call(null,G__134552,G__134553));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134556 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_set_collapsed_all_BANG_(false);
})], null);
var G__134557 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-expand-all","right-side-bar/pane-expand-all",1422902443)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134556,G__134557) : menu_item.call(null,G__134556,G__134557));
})()):null),(cljs.core.truth_(page_QMARK_)?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(page_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134560 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
})], null);
var G__134561 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-open-as-page","right-side-bar/pane-open-as-page",-400676304)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134560,G__134561) : menu_item.call(null,G__134560,G__134561));
})()):null)]:[daiquiri.interpreter.interpret(attrs134504),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134564 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_rest_BANG_(db_id);
})], null);
var G__134565 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close-others","right-side-bar/pane-close-others",2036389555)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134564,G__134565) : menu_item.call(null,G__134564,G__134565));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134574 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.clear_sidebar_blocks_BANG_();

return frontend.state.hide_right_sidebar_BANG_();
})], null);
var G__134575 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close-all","right-side-bar/pane-close-all",-2046824627)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134574,G__134575) : menu_item.call(null,G__134574,G__134575));
})()):null),((((cljs.core.not(collapsed_QMARK_)) && (multi_items_QMARK_)))?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(collapsed_QMARK_)?null:daiquiri.interpreter.interpret((function (){var G__134578 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
})], null);
var G__134579 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse","right-side-bar/pane-collapse",1078755450)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134578,G__134579) : menu_item.call(null,G__134578,G__134579));
})())),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134582 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_collapse_rest_BANG_(db_id);
})], null);
var G__134583 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse-others","right-side-bar/pane-collapse-others",580764536)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134582,G__134583) : menu_item.call(null,G__134582,G__134583));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134586 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_set_collapsed_all_BANG_(true);
})], null);
var G__134587 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-collapse-all","right-side-bar/pane-collapse-all",341880617)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134586,G__134587) : menu_item.call(null,G__134586,G__134587));
})()):null),(cljs.core.truth_((function (){var and__5000__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return multi_items_QMARK_;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(collapsed_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134590 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
})], null);
var G__134591 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-expand","right-side-bar/pane-expand",-42815216)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134590,G__134591) : menu_item.call(null,G__134590,G__134591));
})()):null),((multi_items_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134595 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_block_set_collapsed_all_BANG_(false);
})], null);
var G__134596 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-expand-all","right-side-bar/pane-expand-all",1422902443)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134595,G__134596) : menu_item.call(null,G__134595,G__134596));
})()):null),(cljs.core.truth_(page_QMARK_)?daiquiri.core.create_element("hr",{'className':"menu-separator"},null):null),(cljs.core.truth_(page_QMARK_)?daiquiri.interpreter.interpret((function (){var G__134600 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
})], null);
var G__134601 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-open-as-page","right-side-bar/pane-open-as-page",-400676304)], 0));
return (menu_item.cljs$core$IFn$_invoke$arity$2 ? menu_item.cljs$core$IFn$_invoke$arity$2(G__134600,G__134601) : menu_item.call(null,G__134600,G__134601));
})()):null)]));
}),null,"frontend.components.right-sidebar/actions-menu-content");
frontend.components.right_sidebar.drop_indicator = rum.core.lazy_build(rum.core.build_defc,(function (idx,drag_to){
return daiquiri.core.create_element("div",{'onDragEnter':(function (){
if(cljs.core.truth_(drag_to)){
return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_to,idx);
} else {
return null;
}
}),'onDragOver':frontend.util.stop,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["sidebar-drop-indicator",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(idx,drag_to))?"drag-over":null)], null))},[]);
}),null,"frontend.components.right-sidebar/drop-indicator");
frontend.components.right_sidebar.drop_area = rum.core.lazy_build(rum.core.build_defc,(function (idx){
return daiquiri.core.create_element("div",{'onDragOver':frontend.util.stop,'className':"sidebar-item-drop-area"},[daiquiri.core.create_element("div",{'onDragEnter':(function (){
return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_to,(idx - (1)));
}),'className':"sidebar-item-drop-area-overlay top"},[]),daiquiri.core.create_element("div",{'onDragEnter':(function (){
return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_to,idx);
}),'className':"sidebar-item-drop-area-overlay bottom"},[])]);
}),null,"frontend.components.right-sidebar/drop-area");
frontend.components.right_sidebar.inner_component = rum.core.lazy_build(rum.core.build_defc,(function (component,_should_update_QMARK_){
return daiquiri.interpreter.interpret(component);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"should-update","should-update",-1292781795),(function (_prev_state,state){
return cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
})], null)], null),"frontend.components.right-sidebar/inner-component");
frontend.components.right_sidebar.sidebar_item_inner = rum.core.lazy_build(rum.core.build_defc,(function (db_id,p__134612){
var map__134613 = p__134612;
var map__134613__$1 = cljs.core.__destructure_map(map__134613);
var idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"idx","idx",1053688473));
var drag_from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"drag-from","drag-from",2105951417));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var block_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"block-count","block-count",237453570));
var _STAR_db_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"*db-id","*db-id",2087619142));
var drag_to = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"drag-to","drag-to",1628899148));
var init_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"init-key","init-key",496347888));
var block_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134613__$1,new cljs.core.Keyword(null,"block-type","block-type",1348400470));
var vec__134616 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134616,(0),null);
var set_item_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134616,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.right_sidebar._LT_build_sidebar_item(repo,idx,db_id,block_type,_STAR_db_id,init_key)),(function (item__$1){
return promesa.protocols._promise((set_item_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_item_BANG_.cljs$core$IFn$_invoke$arity$1(item__$1) : set_item_BANG_.call(null,item__$1)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(item)){
var attrs134610 = (((idx === (0)))?frontend.components.right_sidebar.drop_indicator((idx - (1)),drag_to):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs134610))?daiquiri.interpreter.element_attributes(attrs134610):null),((cljs.core.map_QMARK_(attrs134610))?[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","sidebar-item","content","color-level","rounded-md","shadow-lg",["item-type-",cljs.core.name(block_type)].join(''),(cljs.core.truth_(collapsed_QMARK_)?"collapsed":null)], null))},[(function (){var vec__134621 = item;
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134621,(0),null);
var component = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134621,(1),null);
return daiquiri.core.create_element("div",{'className':"flex flex-col w-full relative"},[daiquiri.core.create_element("div",{'draggable':true,'onContextMenu':(function (e){
frontend.util.stop(e);

var G__134626 = e;
var G__134627 = frontend.components.right_sidebar.actions_menu_content(db_id,idx,block_type,collapsed_QMARK_,block_count);
var G__134628 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134626,G__134627,G__134628) : logseq.shui.ui.popup_show_BANG_.call(null,G__134626,G__134627,G__134628));
}),'onDragStart':(function (event){
frontend.handler.editor.block__GT_data_transfer_BANG_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.entity.call(null,db_id))),event,true);

return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_from,idx);
}),'onDragEnd':(function (_event){
if(cljs.core.truth_(drag_to)){
frontend.state.sidebar_move_block_BANG_(idx,drag_to);
} else {
}

cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_to,null);

return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_from,null);
}),'onPointerUp':(function (event){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(event.nativeEvent.which,(2))){
return frontend.state.sidebar_remove_block_BANG_(idx);
} else {
return null;
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","sidebar-item-header","color-level","rounded-t-md",(cljs.core.truth_(collapsed_QMARK_)?"rounded-b-md":null)], null))},[daiquiri.core.create_element("button",{'aria-expanded':cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.not(collapsed_QMARK_)),'id':["sidebar-panel-header-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'aria-controls':["sidebar-panel-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'onClick':(function (event){
frontend.util.stop(event);

return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
}),'className':"flex flex-row px-2 items-center w-full overflow-hidden"},[daiquiri.core.create_element("span",{'className':"opacity-50 hover:opacity-100 flex items-center pr-1"},[frontend.ui.rotating_arrow(collapsed_QMARK_)]),(function (){var attrs134662 = title;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134662))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1","font-medium","text-sm","overflow-hidden","whitespace-nowrap"], null)], null),attrs134662], 0))):{'className':"ml-1 font-medium text-sm overflow-hidden whitespace-nowrap"}),((cljs.core.map_QMARK_(attrs134662))?null:[daiquiri.interpreter.interpret(attrs134662)]));
})()]),(function (){var attrs134655 = (function (){var G__134663 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-more","right-side-bar/pane-more",-1214725157)], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__134607_SHARP_){
var G__134665 = p1__134607_SHARP_.target;
var G__134666 = frontend.components.right_sidebar.actions_menu_content(db_id,idx,block_type,collapsed_QMARK_,block_count);
var G__134667 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134665,G__134666,G__134667) : logseq.shui.ui.popup_show_BANG_.call(null,G__134665,G__134666,G__134667));
})], null);
var G__134664 = frontend.ui.icon("dots");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134663,G__134664) : logseq.shui.ui.button.call(null,G__134663,G__134664));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134655))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["item-actions","flex","items-center"], null)], null),attrs134655], 0))):{'className':"item-actions flex items-center"}),((cljs.core.map_QMARK_(attrs134655))?[daiquiri.interpreter.interpret((function (){var G__134672 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close","right-side-bar/pane-close",1498022936)], 0)),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_block_BANG_(idx);
})], null);
var G__134673 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134672,G__134673) : logseq.shui.ui.button.call(null,G__134672,G__134673));
})())]:[daiquiri.interpreter.interpret(attrs134655),daiquiri.interpreter.interpret((function (){var G__134676 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close","right-side-bar/pane-close",1498022936)], 0)),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_block_BANG_(idx);
})], null);
var G__134677 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134676,G__134677) : logseq.shui.ui.button.call(null,G__134676,G__134677));
})())]));
})()]),daiquiri.core.create_element("div",{'role':"region",'id':["sidebar-panel-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'aria-labelledby':["sidebar-panel-header-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"hidden","hidden",-312506092),collapsed_QMARK_,new cljs.core.Keyword(null,"initial","initial",1854648214),cljs.core.not(collapsed_QMARK_),new cljs.core.Keyword(null,"sidebar-panel-content","sidebar-panel-content",-777475157),true,new cljs.core.Keyword(null,"px-2","px-2",-2089219718),(!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"search","search",1564939822),null,new cljs.core.Keyword(null,"shortcut-settings","shortcut-settings",-1663349734),null], null), null),block_type)))], null)], null))], null))},[frontend.components.right_sidebar.inner_component(component,cljs.core.not(drag_from))]),(cljs.core.truth_(drag_from)?frontend.components.right_sidebar.drop_area(idx):null)]);
})()]),frontend.components.right_sidebar.drop_indicator(idx,drag_to)]:[daiquiri.interpreter.interpret(attrs134610),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","sidebar-item","content","color-level","rounded-md","shadow-lg",["item-type-",cljs.core.name(block_type)].join(''),(cljs.core.truth_(collapsed_QMARK_)?"collapsed":null)], null))},[(function (){var vec__134680 = item;
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134680,(0),null);
var component = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134680,(1),null);
return daiquiri.core.create_element("div",{'className':"flex flex-col w-full relative"},[daiquiri.core.create_element("div",{'draggable':true,'onContextMenu':(function (e){
frontend.util.stop(e);

var G__134683 = e;
var G__134684 = frontend.components.right_sidebar.actions_menu_content(db_id,idx,block_type,collapsed_QMARK_,block_count);
var G__134685 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134683,G__134684,G__134685) : logseq.shui.ui.popup_show_BANG_.call(null,G__134683,G__134684,G__134685));
}),'onDragStart':(function (event){
frontend.handler.editor.block__GT_data_transfer_BANG_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.entity.call(null,db_id))),event,true);

return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_from,idx);
}),'onDragEnd':(function (_event){
if(cljs.core.truth_(drag_to)){
frontend.state.sidebar_move_block_BANG_(idx,drag_to);
} else {
}

cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_to,null);

return cljs.core.reset_BANG_(frontend.components.right_sidebar._STAR_drag_from,null);
}),'onPointerUp':(function (event){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(event.nativeEvent.which,(2))){
return frontend.state.sidebar_remove_block_BANG_(idx);
} else {
return null;
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","sidebar-item-header","color-level","rounded-t-md",(cljs.core.truth_(collapsed_QMARK_)?"rounded-b-md":null)], null))},[daiquiri.core.create_element("button",{'aria-expanded':cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.not(collapsed_QMARK_)),'id':["sidebar-panel-header-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'aria-controls':["sidebar-panel-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'onClick':(function (event){
frontend.util.stop(event);

return frontend.state.sidebar_block_toggle_collapse_BANG_(db_id);
}),'className':"flex flex-row px-2 items-center w-full overflow-hidden"},[daiquiri.core.create_element("span",{'className':"opacity-50 hover:opacity-100 flex items-center pr-1"},[frontend.ui.rotating_arrow(collapsed_QMARK_)]),(function (){var attrs134705 = title;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134705))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1","font-medium","text-sm","overflow-hidden","whitespace-nowrap"], null)], null),attrs134705], 0))):{'className':"ml-1 font-medium text-sm overflow-hidden whitespace-nowrap"}),((cljs.core.map_QMARK_(attrs134705))?null:[daiquiri.interpreter.interpret(attrs134705)]));
})()]),(function (){var attrs134701 = (function (){var G__134706 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-more","right-side-bar/pane-more",-1214725157)], 0)),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__134607_SHARP_){
var G__134708 = p1__134607_SHARP_.target;
var G__134709 = frontend.components.right_sidebar.actions_menu_content(db_id,idx,block_type,collapsed_QMARK_,block_count);
var G__134710 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134708,G__134709,G__134710) : logseq.shui.ui.popup_show_BANG_.call(null,G__134708,G__134709,G__134710));
})], null);
var G__134707 = frontend.ui.icon("dots");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134706,G__134707) : logseq.shui.ui.button.call(null,G__134706,G__134707));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134701))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["item-actions","flex","items-center"], null)], null),attrs134701], 0))):{'className':"item-actions flex items-center"}),((cljs.core.map_QMARK_(attrs134701))?[daiquiri.interpreter.interpret((function (){var G__134713 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close","right-side-bar/pane-close",1498022936)], 0)),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_block_BANG_(idx);
})], null);
var G__134714 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134713,G__134714) : logseq.shui.ui.button.call(null,G__134713,G__134714));
})())]:[daiquiri.interpreter.interpret(attrs134701),daiquiri.interpreter.interpret((function (){var G__134717 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","pane-close","right-side-bar/pane-close",1498022936)], 0)),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-2 h-8 w-8 text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_remove_block_BANG_(idx);
})], null);
var G__134718 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134717,G__134718) : logseq.shui.ui.button.call(null,G__134717,G__134718));
})())]));
})()]),daiquiri.core.create_element("div",{'role':"region",'id':["sidebar-panel-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'aria-labelledby':["sidebar-panel-header-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"hidden","hidden",-312506092),collapsed_QMARK_,new cljs.core.Keyword(null,"initial","initial",1854648214),cljs.core.not(collapsed_QMARK_),new cljs.core.Keyword(null,"sidebar-panel-content","sidebar-panel-content",-777475157),true,new cljs.core.Keyword(null,"px-2","px-2",-2089219718),(!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"search","search",1564939822),null,new cljs.core.Keyword(null,"shortcut-settings","shortcut-settings",-1663349734),null], null), null),block_type)))], null)], null))], null))},[frontend.components.right_sidebar.inner_component(component,cljs.core.not(drag_from))]),(cljs.core.truth_(drag_from)?frontend.components.right_sidebar.drop_area(idx):null)]);
})()]),frontend.components.right_sidebar.drop_indicator(idx,drag_to)]));
} else {
return null;
}
}),null,"frontend.components.right-sidebar/sidebar-item-inner");
frontend.components.right_sidebar.sidebar_item = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo,idx,db_id,block_type,block_count){
var drag_from = rum.core.react(frontend.components.right_sidebar._STAR_drag_from);
var drag_to = rum.core.react(frontend.components.right_sidebar._STAR_drag_to);
var collapsed_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),db_id], null));
return frontend.components.right_sidebar.sidebar_item_inner(db_id,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"block-count","block-count",237453570),new cljs.core.Keyword(null,"*db-id","*db-id",2087619142),new cljs.core.Keyword(null,"drag-to","drag-to",1628899148),new cljs.core.Keyword(null,"init-key","init-key",496347888),new cljs.core.Keyword(null,"block-type","block-type",1348400470),new cljs.core.Keyword(null,"drag-from","drag-from",2105951417),new cljs.core.Keyword(null,"repo","repo",-1999060679),new cljs.core.Keyword(null,"idx","idx",1053688473),new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674)],[block_count,new cljs.core.Keyword("frontend.components.right-sidebar","db-id","frontend.components.right-sidebar/db-id",545804022).cljs$core$IFn$_invoke$arity$1(state),drag_to,new cljs.core.Keyword("frontend.components.right-sidebar","init-key","frontend.components.right-sidebar/init-key",427386561).cljs$core$IFn$_invoke$arity$1(state),block_type,drag_from,repo,idx,collapsed_QMARK_]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.right-sidebar","db-id","frontend.components.right-sidebar/db-id",545804022),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state),(2))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.right-sidebar","init-key","frontend.components.right-sidebar/init-key",427386561),cljs.core.random_uuid()], 0));
})], null)], null),"frontend.components.right-sidebar/sidebar-item");
frontend.components.right_sidebar.get_page = (function frontend$components$right_sidebar$get_page(match){
var route_name = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var page = (function (){var G__134721 = route_name;
var G__134721__$1 = (((G__134721 instanceof cljs.core.Keyword))?G__134721.fqn:null);
switch (G__134721__$1) {
case "page":
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null));

break;
case "file":
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"path","path",-188191168)], null));

break;
default:
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0();

}
})();
if(cljs.core.truth_(page)){
return clojure.string.lower_case(page);
} else {
return null;
}
});
frontend.components.right_sidebar.get_current_page = (function frontend$components$right_sidebar$get_current_page(){
var match = new cljs.core.Keyword(null,"route-match","route-match",-1450985937).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
return frontend.components.right_sidebar.get_page(match);
});
frontend.components.right_sidebar.sidebar_resizer = rum.core.lazy_build(rum.core.build_defc,(function (sidebar_open_QMARK_,sidebar_id,handler_position){
var el_ref = rum.core.use_ref(null);
var min_px_width = (320);
var min_ratio = 0.1;
var max_ratio = 0.7;
var keyboard_step = (5);
var add_resizing_class = (function (){
return document.documentElement.classList.add("is-resizing-buf");
});
var remove_resizing_class = (function (){
document.documentElement.classList.remove("is-resizing-buf");

return cljs.core.reset_BANG_(frontend.handler.ui._STAR_right_sidebar_resized_at,Date.now());
});
var set_width_BANG_ = (function (ratio){
if(cljs.core.truth_(el_ref)){
var value = (ratio * (100));
var width = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"%"].join('');
rum.core.deref(el_ref).setAttribute("aria-valuenow",value);

return frontend.handler.ui.persist_right_sidebar_width_BANG_(width);
} else {
return null;
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto___134879 = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(window.interact);
if(and__5000__auto__){
return rum.core.deref(el_ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___134879)){
var el_134882 = temp__5804__auto___134879;
interact(el_134882).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var width = document.documentElement.clientWidth;
var min_ratio__$1 = (function (){var x__5087__auto__ = min_ratio;
var y__5088__auto__ = (min_px_width / width);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var sidebar_el = document.getElementById(sidebar_id);
var offset = e.pageX;
var ratio = (offset / width).toFixed((6));
var ratio__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(handler_position,new cljs.core.Keyword(null,"west","west",708776677)))?((1) - ratio):ratio);
var cursor_class = ["cursor-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.name(handler_position))),"-resize"].join('');
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(el_134882.getAttribute("data-expanded"),"true")){
if((ratio__$1 < (min_ratio__$1 / (2)))){
return frontend.state.hide_right_sidebar_BANG_();
} else {
if((ratio__$1 < min_ratio__$1)){
return document.documentElement.classList.add(cursor_class);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (ratio__$1 < max_ratio);
if(and__5000__auto__){
return sidebar_el;
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(sidebar_el)){
return (function (){
return document.documentElement.classList.remove(cursor_class);
})(set_width_BANG_(ratio__$1));
} else {
return null;
}
} else {
return (function (){
return document.documentElement.classList.remove(cursor_class);
});

}
}
}
} else {
if((ratio__$1 > (min_ratio__$1 / (2)))){
return frontend.state.open_right_sidebar_BANG_();
} else {
return null;
}
}
})], null)], null))).styleCursor(false).on("dragstart",add_resizing_class).on("dragend",remove_resizing_class).on("keydown",(function (e){
var temp__5804__auto____$1 = document.getElementById(sidebar_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var sidebar_el = temp__5804__auto____$1;
var width = document.documentElement.clientWidth;
var min_ratio__$1 = (function (){var x__5087__auto__ = min_ratio;
var y__5088__auto__ = (min_px_width / width);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var keyboard_step__$1 = (function (){var G__134727 = e.code;
switch (G__134727) {
case "ArrowLeft":
return (- keyboard_step);

break;
case "ArrowRight":
return keyboard_step;

break;
default:
return (0);

}
})();
var offset = (sidebar_el.getBoundingClientRect().x + keyboard_step__$1);
var ratio = (offset / width).toFixed((6));
var ratio__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(handler_position,new cljs.core.Keyword(null,"west","west",708776677)))?((1) - ratio):ratio);
if((((ratio__$1 > min_ratio__$1)) && ((((ratio__$1 < max_ratio)) && ((!((keyboard_step__$1 === (0))))))))){
add_resizing_class();

return set_width_BANG_(ratio__$1);
} else {
return null;
}
} else {
return null;
}
})).on("keyup",remove_resizing_class);
} else {
}

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
return cljs.core.reset_BANG_(frontend.handler.ui._STAR_right_sidebar_resized_at,Date.now());
}),(300));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [sidebar_open_QMARK_], null));

return daiquiri.core.create_element("div",{'role':"separator",'data-expanded':sidebar_open_QMARK_,'tabIndex':"0",'ref':el_ref,'aria-valuemax':(max_ratio * (100)),'className':"resizer",'aria-orientation':"vertical",'aria-label':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","separator","right-side-bar/separator",-220656147)], 0)),'aria-valuemin':(min_ratio * (100)),'aria-valuenow':(50)},[]);
}),null,"frontend.components.right-sidebar/sidebar-resizer");
frontend.components.right_sidebar.sidebar_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo,t,blocks){
var _STAR_anim_finished_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.right-sidebar","anim-finished?","frontend.components.right-sidebar/anim-finished?",-1735910019));
var block_count = cljs.core.count(blocks);
return daiquiri.core.create_element("div",{'id':"right-sidebar-container",'className':"cp__right-sidebar-inner flex flex-col h-full"},[daiquiri.core.create_element("div",{'onDragOver':frontend.util.stop,'className':"cp__right-sidebar-scrollable"},[daiquiri.core.create_element("div",{'className':"cp__right-sidebar-topbar flex flex-row justify-between items-center"},[daiquiri.core.create_element("div",{'key':"right-sidebar-settings",'className':"cp__right-sidebar-settings hide-scrollbar gap-1"},[daiquiri.core.create_element("div",{'className':"text-sm"},[daiquiri.core.create_element("button",{'onClick':(function (_e){
return frontend.state.sidebar_add_block_BANG_(repo,"contents",new cljs.core.Keyword(null,"contents","contents",-1567174023));
}),'className':"button cp__right-sidebar-settings-btn"},[daiquiri.interpreter.interpret((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("right-side-bar","contents","right-side-bar/contents",-293331541)) : t.call(null,new cljs.core.Keyword("right-side-bar","contents","right-side-bar/contents",-293331541))))])]),daiquiri.core.create_element("div",{'className':"text-sm"},[daiquiri.core.create_element("button",{'onClick':(function (){
var temp__5804__auto__ = frontend.components.right_sidebar.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return frontend.state.sidebar_add_block_BANG_(repo,page,new cljs.core.Keyword(null,"page-graph","page-graph",1691909522));
} else {
return null;
}
}),'className':"button cp__right-sidebar-settings-btn"},[daiquiri.interpreter.interpret((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("right-side-bar","page-graph","right-side-bar/page-graph",1357852608)) : t.call(null,new cljs.core.Keyword("right-side-bar","page-graph","right-side-bar/page-graph",1357852608))))])]),daiquiri.core.create_element("div",{'className':"text-sm"},[daiquiri.core.create_element("button",{'onClick':(function (_e){
return frontend.state.sidebar_add_block_BANG_(repo,"help",new cljs.core.Keyword(null,"help","help",-439233446));
}),'className':"button cp__right-sidebar-settings-btn"},[daiquiri.interpreter.interpret((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("right-side-bar","help","right-side-bar/help",432037932)) : t.call(null,new cljs.core.Keyword("right-side-bar","help","right-side-bar/help",432037932))))])]),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null)))?daiquiri.core.create_element("div",{'className':"text-sm"},[daiquiri.core.create_element("button",{'onClick':(function (_e){
return frontend.state.sidebar_add_block_BANG_(repo,"rtc",new cljs.core.Keyword(null,"rtc","rtc",-229444279));
}),'className':"button cp__right-sidebar-settings-btn"},["(Dev) RTC"])]):null),(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null)))?daiquiri.core.create_element("div",{'className':"text-sm"},[daiquiri.core.create_element("button",{'onClick':(function (_e){
return frontend.state.sidebar_add_block_BANG_(repo,"profiler",new cljs.core.Keyword(null,"profiler","profiler",-1649150682));
}),'className':"button cp__right-sidebar-settings-btn"},["(Dev) Profiler"])]):null)])]),(function (){var attrs134768 = (cljs.core.truth_(cljs.core.deref(_STAR_anim_finished_QMARK_))?(function (){var iter__5480__auto__ = (function frontend$components$right_sidebar$iter__134772(s__134773){
return (new cljs.core.LazySeq(null,(function (){
var s__134773__$1 = s__134773;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__134773__$1);
if(temp__5804__auto__){
var s__134773__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__134773__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__134773__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__134775 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__134774 = (0);
while(true){
if((i__134774 < size__5479__auto__)){
var vec__134782 = cljs.core._nth(c__5478__auto__,i__134774);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134782,(0),null);
var vec__134785 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134782,(1),null);
var repo__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134785,(0),null);
var db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134785,(1),null);
var block_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134785,(2),null);
cljs.core.chunk_append(b__134775,rum.core.with_key(frontend.components.right_sidebar.sidebar_item(repo__$1,idx,db_id,block_type,block_count),["sidebar-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(db_id)].join('')));

var G__134895 = (i__134774 + (1));
i__134774 = G__134895;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__134775),frontend$components$right_sidebar$iter__134772(cljs.core.chunk_rest(s__134773__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__134775),null);
}
} else {
var vec__134789 = cljs.core.first(s__134773__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134789,(0),null);
var vec__134792 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134789,(1),null);
var repo__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134792,(0),null);
var db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134792,(1),null);
var block_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134792,(2),null);
return cljs.core.cons(rum.core.with_key(frontend.components.right_sidebar.sidebar_item(repo__$1,idx,db_id,block_type,block_count),["sidebar-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(db_id)].join('')),frontend$components$right_sidebar$iter__134772(cljs.core.rest(s__134773__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(blocks));
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium.opacity-50","span.font-medium.opacity-50",768466648),"Loading ..."], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134768))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["sidebar-item-list","flex-1","scrollbar-spacing","px-2"], null)], null),attrs134768], 0))):{'className':"sidebar-item-list flex-1 scrollbar-spacing px-2"}),((cljs.core.map_QMARK_(attrs134768))?null:[daiquiri.interpreter.interpret(attrs134768)]));
})()])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.right-sidebar","anim-finished?","frontend.components.right-sidebar/anim-finished?",-1735910019)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
setTimeout((function (){
return cljs.core.reset_BANG_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.right-sidebar","anim-finished?","frontend.components.right-sidebar/anim-finished?",-1735910019)),true);
}),(300));

return state;
})], null)], null),"frontend.components.right-sidebar/sidebar-inner");
frontend.components.right_sidebar.sidebar = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var blocks = frontend.state.sub_right_sidebar_blocks();
var blocks__$1 = ((cljs.core.empty_QMARK_(blocks))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.state.get_current_repo(),"contents",new cljs.core.Keyword(null,"contents","contents",-1567174023),null], null)], null):blocks);
var sidebar_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887));
var width = frontend.state.sub(new cljs.core.Keyword("ui","sidebar-width","ui/sidebar-width",929889300));
var repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
return daiquiri.core.create_element("div",{'id':"right-sidebar",'style':{'width':width},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__right-sidebar","h-screen",(cljs.core.truth_(sidebar_open_QMARK_)?"open":"closed")], null))},[frontend.components.right_sidebar.sidebar_resizer(sidebar_open_QMARK_,"right-sidebar",new cljs.core.Keyword(null,"west","west",708776677)),(cljs.core.truth_(sidebar_open_QMARK_)?frontend.components.right_sidebar.sidebar_inner(repo,frontend.context.i18n.t,blocks__$1):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.right-sidebar/sidebar");

//# sourceMappingURL=frontend.components.right_sidebar.js.map
