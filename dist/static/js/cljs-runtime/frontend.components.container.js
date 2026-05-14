goog.provide('frontend.components.container');
goog.scope(function(){
  frontend.components.container.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$react_draggable$dist$react_draggable=shadow.js.require("module$node_modules$react_draggable$dist$react_draggable", {});
frontend.components.container.sidebar_content_group = rum.core.lazy_build(rum.core.build_defc,(function (name,p__134892,child){
var map__134893 = p__134892;
var map__134893__$1 = cljs.core.__destructure_map(map__134893);
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"count","count",2139924085));
var more = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"more","more",-2058821800));
var header_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"header-props","header-props",742830512));
var enter_show_more_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"enter-show-more?","enter-show-more?",-1295464885));
var collapsable_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134893__$1,new cljs.core.Keyword(null,"collapsable?","collapsable?",-634623825));
var collapsed_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","navigation-item-collapsed?","ui/navigation-item-collapsed?",-1247120960),class$], null));
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["sidebar-content-group",frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"is-expand","is-expand",-1852164794),cljs.core.not(collapsed_QMARK_),new cljs.core.Keyword(null,"has-children","has-children",-934485512),((typeof count === 'number') && ((count > (0))))], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"sidebar-content-group-inner"},[(function (){var attrs134897 = (function (){var G__134903 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([header_props,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(header_props),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"non-collapsable","non-collapsable",1791768854),collapsable_QMARK_ === false,new cljs.core.Keyword(null,"enter-show-more","enter-show-more",-1028935444),enter_show_more_QMARK_ === true], null)], null))], null)], 0));
if((!(collapsable_QMARK_ === false))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__134903,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return frontend.state.toggle_navigation_item_collapsed_BANG_(class$);
}));
} else {
return G__134903;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134897))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["hd","items-center"], null)], null),attrs134897], 0))):{'className':"hd items-center"}),((cljs.core.map_QMARK_(attrs134897))?[(function (){var attrs134898 = name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134898))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["a"], null)], null),attrs134898], 0))):{'className':"a"}),((cljs.core.map_QMARK_(attrs134898))?null:[daiquiri.interpreter.interpret(attrs134898)]));
})(),(function (){var attrs134899 = (function (){var or__5002__auto__ = more;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.ui.icon("chevron-right",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"more",new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
}
})();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134899))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["b"], null)], null),attrs134899], 0))):{'className':"b"}),((cljs.core.map_QMARK_(attrs134899))?null:[daiquiri.interpreter.interpret(attrs134899)]));
})()]:[daiquiri.interpreter.interpret(attrs134897),(function (){var attrs134900 = name;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134900))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["a"], null)], null),attrs134900], 0))):{'className':"a"}),((cljs.core.map_QMARK_(attrs134900))?null:[daiquiri.interpreter.interpret(attrs134900)]));
})(),(function (){var attrs134901 = (function (){var or__5002__auto__ = more;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.ui.icon("chevron-right",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"more",new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
}
})();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134901))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["b"], null)], null),attrs134901], 0))):{'className':"b"}),((cljs.core.map_QMARK_(attrs134901))?null:[daiquiri.interpreter.interpret(attrs134901)]));
})()]));
})(),(cljs.core.truth_(child)?(function (){var attrs134902 = child;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134902))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["bd"], null)], null),attrs134902], 0))):{'className':"bd"}),((cljs.core.map_QMARK_(attrs134902))?null:[daiquiri.interpreter.interpret(attrs134902)]));
})():null)])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.container/sidebar-content-group");
frontend.components.container.page_name = rum.core.lazy_build(rum.core.build_defc,(function (page,icon,recent_QMARK_){
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var untitled_QMARK_ = frontend.db.model.untitled_page_QMARK_(title);
var name = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
var file_rpath = (cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.util.page.get_page_file_rpath.cljs$core$IFn$_invoke$arity$1(name):null);
var ctx_icon = (function (p1__134904_SHARP_){
return logseq.shui.ui.tabler_icon(p1__134904_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-90 pr-1 opacity-80"], null));
});
var open_in_sidebar = (function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"page","page",849072397));
});
var x_menu_content = (function (){
var x_menu_item = logseq.shui.ui.dropdown_menu_item;
var x_menu_shortcut = logseq.shui.ui.dropdown_menu_shortcut;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(cljs.core.truth_(recent_QMARK_)?null:(function (){var G__134915 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"unfavorite",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.page._LT_unfavorite_page_BANG_(((db_based_QMARK_)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)):title));
})], null);
var G__134916 = ctx_icon("star-off");
var G__134917 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","unfavorite","page/unfavorite",578994300)], 0));
var G__134918 = (function (){var G__134919 = (function (){var temp__5804__auto__ = frontend.modules.shortcut.data_helper.shortcut_binding(new cljs.core.Keyword("command","toggle-favorite","command/toggle-favorite",-2107893568));
if(cljs.core.truth_(temp__5804__auto__)){
var binding = temp__5804__auto__;
var G__134920 = binding;
var G__134920__$1 = (((G__134920 == null))?null:cljs.core.first(G__134920));
if((G__134920__$1 == null)){
return null;
} else {
return frontend.modules.shortcut.utils.decorate_binding(G__134920__$1);
}
} else {
return null;
}
})();
return (x_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? x_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__134919) : x_menu_shortcut.call(null,G__134919));
})();
return (x_menu_item.cljs$core$IFn$_invoke$arity$4 ? x_menu_item.cljs$core$IFn$_invoke$arity$4(G__134915,G__134916,G__134917,G__134918) : x_menu_item.call(null,G__134915,G__134916,G__134917,G__134918));
})()),(function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = file_rpath;
if(cljs.core.truth_(and__5000__auto____$1)){
return frontend.config.get_repo_fpath(frontend.state.get_current_repo(),file_rpath);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page_fpath = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__134921 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open-in-folder",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"openFileInFolder","openFileInFolder",660878411),page_fpath], 0));
})], null);
var G__134922 = ctx_icon("folder");
var G__134923 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","open-in-finder","page/open-in-finder",-891703594)], 0));
return (x_menu_item.cljs$core$IFn$_invoke$arity$3 ? x_menu_item.cljs$core$IFn$_invoke$arity$3(G__134921,G__134922,G__134923) : x_menu_item.call(null,G__134921,G__134922,G__134923));
})(),(function (){var G__134924 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open with default app",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.apis.openPath(page_fpath);
})], null);
var G__134925 = ctx_icon("file");
var G__134926 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","open-with-default-app","page/open-with-default-app",2097221682)], 0));
return (x_menu_item.cljs$core$IFn$_invoke$arity$3 ? x_menu_item.cljs$core$IFn$_invoke$arity$3(G__134924,G__134925,G__134926) : x_menu_item.call(null,G__134924,G__134925,G__134926));
})()], null);
} else {
return null;
}
})(),(function (){var G__134927 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open in sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_in_sidebar], null);
var G__134928 = ctx_icon("layout-sidebar-right");
var G__134929 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("content","open-in-sidebar","content/open-in-sidebar",731683416)], 0));
var G__134930 = (function (){var G__134931 = frontend.modules.shortcut.utils.decorate_binding("shift+click");
return (x_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? x_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__134931) : x_menu_shortcut.call(null,G__134931));
})();
return (x_menu_item.cljs$core$IFn$_invoke$arity$4 ? x_menu_item.cljs$core$IFn$_invoke$arity$4(G__134927,G__134928,G__134929,G__134930) : x_menu_item.call(null,G__134927,G__134928,G__134929,G__134930));
})()], null);
});
var attrs134914 = (function (){var G__134932 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_(frontend.components.container.goog$module$goog$object.get(e,"shiftKey"))){
return open_in_sidebar();
} else {
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"click-from-recent?","click-from-recent?",-1191845464),recent_QMARK_], null));
}
}),new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340),(function (e){
var G__134933_135131 = e;
var G__134934_135132 = x_menu_content();
var G__134935_135133 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-60"], null)], null);
(logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134933_135131,G__134934_135132,G__134935_135133) : logseq.shui.ui.popup_show_BANG_.call(null,G__134933_135131,G__134934_135132,G__134935_135133));

return frontend.util.stop(e);
})], null);
if(cljs.core.truth_((logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.object_QMARK_.call(null,page)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__134932,new cljs.core.Keyword(null,"title","title",636505583),frontend.handler.block.block_unique_title(page));
} else {
return G__134932;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs134914))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["link-item","group"], null)], null),attrs134914], 0))):{'className':"link-item group"}),((cljs.core.map_QMARK_(attrs134914))?[daiquiri.core.create_element("span",{'key':"page-icon",'className':"page-icon"},[daiquiri.interpreter.interpret(icon)]),daiquiri.core.create_element("span",{'key':"title",'style':{'display':"ruby"},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-title",(cljs.core.truth_(untitled_QMARK_)?"opacity-50":null)], null))},[((cljs.core.not((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.page_QMARK_.call(null,page))))?daiquiri.interpreter.interpret(frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page))):(cljs.core.truth_(untitled_QMARK_)?daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0))):(function (){var title_SINGLEQUOTE_ = frontend.extensions.pdf.utils.fix_local_asset_pagename(title);
var parent = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_((function (){var and__5000__auto__ = parent;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)));
} else {
return and__5000__auto__;
}
})())){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(parent)),logseq.common.util.namespace.parent_char,cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_SINGLEQUOTE_)].join('');
} else {
return daiquiri.interpreter.interpret(title_SINGLEQUOTE_);
}
})()
))]),daiquiri.interpreter.interpret((function (){var G__134941 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),"more actions",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"absolute !bg-transparent right-0 top-0 px-1.5 scale-75 opacity-40 hidden group-hover:block hover:opacity-80 active:opacity-100",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__134905_SHARP_){
var G__134943_135134 = p1__134905_SHARP_.target;
var G__134944_135135 = x_menu_content();
var G__134945_135136 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-60"], null)], null);
(logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134943_135134,G__134944_135135,G__134945_135136) : logseq.shui.ui.popup_show_BANG_.call(null,G__134943_135134,G__134944_135135,G__134945_135136));

return frontend.util.stop(p1__134905_SHARP_);
})], null);
var G__134942 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.relative","i.relative",-2078662318),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"top","top",-1856271961),"4px"], null)], null),logseq.shui.ui.tabler_icon("dots")], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134941,G__134942) : logseq.shui.ui.button.call(null,G__134941,G__134942));
})())]:[daiquiri.interpreter.interpret(attrs134914),daiquiri.core.create_element("span",{'key':"page-icon",'className':"page-icon"},[daiquiri.interpreter.interpret(icon)]),daiquiri.core.create_element("span",{'key':"title",'style':{'display':"ruby"},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-title",(cljs.core.truth_(untitled_QMARK_)?"opacity-50":null)], null))},[((cljs.core.not((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.page_QMARK_.call(null,page))))?daiquiri.interpreter.interpret(frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page))):(cljs.core.truth_(untitled_QMARK_)?daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0))):(function (){var title_SINGLEQUOTE_ = frontend.extensions.pdf.utils.fix_local_asset_pagename(title);
var parent = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_((function (){var and__5000__auto__ = parent;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)));
} else {
return and__5000__auto__;
}
})())){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(parent)),logseq.common.util.namespace.parent_char,cljs.core.str.cljs$core$IFn$_invoke$arity$1(title_SINGLEQUOTE_)].join('');
} else {
return daiquiri.interpreter.interpret(title_SINGLEQUOTE_);
}
})()
))]),daiquiri.interpreter.interpret((function (){var G__134951 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),"more actions",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"absolute !bg-transparent right-0 top-0 px-1.5 scale-75 opacity-40 hidden group-hover:block hover:opacity-80 active:opacity-100",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__134905_SHARP_){
var G__134953_135137 = p1__134905_SHARP_.target;
var G__134954_135138 = x_menu_content();
var G__134955_135139 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-60"], null)], null);
(logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134953_135137,G__134954_135138,G__134955_135139) : logseq.shui.ui.popup_show_BANG_.call(null,G__134953_135137,G__134954_135138,G__134955_135139));

return frontend.util.stop(p1__134905_SHARP_);
})], null);
var G__134952 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.relative","i.relative",-2078662318),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"top","top",-1856271961),"4px"], null)], null),logseq.shui.ui.tabler_icon("dots")], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134951,G__134952) : logseq.shui.ui.button.call(null,G__134951,G__134952));
})())]));
}),null,"frontend.components.container/page-name");
frontend.components.container.sidebar_item = (function frontend$components$container$sidebar_item(p__134956){
var map__134957 = p__134956;
var map__134957__$1 = cljs.core.__destructure_map(map__134957);
var icon_extension_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"icon-extension?","icon-extension?",507506462));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"title","title",636505583));
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
var on_click_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723));
var active = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"active","active",1895962068));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var more = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134957__$1,new cljs.core.Keyword(null,"more","more",-2058821800));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),class$,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),active], null)], null))], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.item.group.flex.items-center.text-sm.rounded-md.font-medium","a.item.group.flex.items-center.text-sm.rounded-md.font-medium",-1380714428),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click_handler,new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(active)?"active":null),new cljs.core.Keyword(null,"href","href",-793805698),href], null),frontend.ui.icon(cljs.core.str.cljs$core$IFn$_invoke$arity$1(icon),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"extension?","extension?",-1574402873),icon_extension_QMARK_,new cljs.core.Keyword(null,"size","size",1098693007),(16)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex-1","span.flex-1",1756749525),title], null),(cljs.core.truth_(shortcut)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),frontend.ui.render_keyboard_shortcut(frontend.ui.keyboard_shortcut_from_config.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pick-first?","pick-first?",-2055544652),true], null)], 0)))], null):null),more], null)], null);
});
frontend.components.container.sidebar_graphs = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"sidebar-graphs"},[frontend.components.repo.graphs_selector()]);
}),null,"frontend.components.container/sidebar-graphs");
frontend.components.container.sidebar_navigations_edit_content = rum.core.lazy_build(rum.core.build_defc,(function (p__134959){
var map__134960 = p__134959;
var map__134960__$1 = cljs.core.__destructure_map(map__134960);
var _id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134960__$1,new cljs.core.Keyword(null,"_id","_id",-789960287));
var navs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134960__$1,new cljs.core.Keyword(null,"navs","navs",-1350609868));
var checked_navs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134960__$1,new cljs.core.Keyword(null,"checked-navs","checked-navs",774369896));
var set_checked_navs_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134960__$1,new cljs.core.Keyword(null,"set-checked-navs!","set-checked-navs!",-2081871382));
var vec__134961 = rum.core.use_state(checked_navs);
var local_navs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134961,(0),null);
var set_local_navs_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134961,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return (set_checked_navs_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_checked_navs_BANG_.cljs$core$IFn$_invoke$arity$1(local_navs) : set_checked_navs_BANG_.call(null,local_navs));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [local_navs], null));

return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$container$iter__134964(s__134965){
return (new cljs.core.LazySeq(null,(function (){
var s__134965__$1 = s__134965;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__134965__$1);
if(temp__5804__auto__){
var s__134965__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__134965__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__134965__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__134967 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__134966 = (0);
while(true){
if((i__134966 < size__5479__auto__)){
var nav = cljs.core._nth(c__5478__auto__,i__134966);
var name_SINGLEQUOTE_ = cljs.core.name(nav);
cljs.core.chunk_append(b__134967,daiquiri.interpreter.interpret((function (){var G__134971 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.contains_QMARK_(cljs.core.set(local_navs),nav),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_){
return (function (v){
var G__134973 = ((function (i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_){
return (function (){
if(cljs.core.truth_(v)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(local_navs,nav);
} else {
return cljs.core.filterv(((function (i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_){
return (function (p1__134958_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(nav,p1__134958_SHARP_);
});})(i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_))
,local_navs);
}
});})(i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_))
;
return (set_local_navs_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_local_navs_BANG_.cljs$core$IFn$_invoke$arity$1(G__134973) : set_local_navs_BANG_.call(null,G__134973));
});})(i__134966,name_SINGLEQUOTE_,nav,c__5478__auto__,size__5479__auto__,b__134967,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_))
], null);
var G__134972 = frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("left-side-bar",name_SINGLEQUOTE_),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("right-side-bar",name_SINGLEQUOTE_)], 0));
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__134971,G__134972) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__134971,G__134972));
})()));

var G__135140 = (i__134966 + (1));
i__134966 = G__135140;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__134967),frontend$components$container$iter__134964(cljs.core.chunk_rest(s__134965__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__134967),null);
}
} else {
var nav = cljs.core.first(s__134965__$2);
var name_SINGLEQUOTE_ = cljs.core.name(nav);
return cljs.core.cons(daiquiri.interpreter.interpret((function (){var G__134977 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.contains_QMARK_(cljs.core.set(local_navs),nav),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (name_SINGLEQUOTE_,nav,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_){
return (function (v){
var G__134979 = (function (){
if(cljs.core.truth_(v)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(local_navs,nav);
} else {
return cljs.core.filterv((function (p1__134958_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(nav,p1__134958_SHARP_);
}),local_navs);
}
});
return (set_local_navs_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_local_navs_BANG_.cljs$core$IFn$_invoke$arity$1(G__134979) : set_local_navs_BANG_.call(null,G__134979));
});})(name_SINGLEQUOTE_,nav,s__134965__$2,temp__5804__auto__,vec__134961,local_navs,set_local_navs_BANG_,map__134960,map__134960__$1,_id,navs,checked_navs,set_checked_navs_BANG_))
], null);
var G__134978 = frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("left-side-bar",name_SINGLEQUOTE_),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("right-side-bar",name_SINGLEQUOTE_)], 0));
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__134977,G__134978) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__134977,G__134978));
})()),frontend$components$container$iter__134964(cljs.core.rest(s__134965__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(navs);
})());
}),null,"frontend.components.container/sidebar-navigations-edit-content");
frontend.components.container.sidebar_navigations = rum.core.lazy_build(rum.core.build_defc,(function (p__134982){
var map__134983 = p__134982;
var map__134983__$1 = cljs.core.__destructure_map(map__134983);
var default_home = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"default-home","default-home",171104159));
var route_match = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"route-match","route-match",-1450985937));
var route_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"route-name","route-name",-932603717));
var srs_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"srs-open?","srs-open?",407120677));
var db_based_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232));
var enable_whiteboards_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134983__$1,new cljs.core.Keyword(null,"enable-whiteboards?","enable-whiteboards?",-1186549034));
var navs = (function (){var G__134987 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"flashcards","flashcards",2038329166),new cljs.core.Keyword(null,"graph-view","graph-view",-233626947),new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)], null);
var G__134987__$1 = (cljs.core.truth_(db_based_QMARK_)?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__134987,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("tag","tasks","tag/tasks",-1754778910),new cljs.core.Keyword("tag","assets","tag/assets",210425625)], null)):G__134987);
if(cljs.core.not(db_based_QMARK_)){
return (function (p1__134980_SHARP_){
return cljs.core.cons(new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),p1__134980_SHARP_);
})(G__134987__$1);
} else {
return G__134987__$1;
}
})();
var vec__134984 = rum.core.use_state((function (){var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"ls-sidebar-navigations","ls-sidebar-navigations",1383970328));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),new cljs.core.Keyword(null,"flashcards","flashcards",2038329166),new cljs.core.Keyword(null,"graph-view","graph-view",-233626947),new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)], null);
}
})());
var checked_navs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134984,(0),null);
var set_checked_navs_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134984,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.vector_QMARK_(checked_navs)){
return frontend.storage.set(new cljs.core.Keyword(null,"ls-sidebar-navigations","ls-sidebar-navigations",1383970328),checked_navs);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [checked_navs], null));

return frontend.components.container.sidebar_content_group(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.wrap-th","a.wrap-th",1385261646),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.flex-1","strong.flex-1",-332188689),"Navigations"], null)], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"collapsable?","collapsable?",-634623825),false,new cljs.core.Keyword(null,"enter-show-more?","enter-show-more?",-1295464885),true,new cljs.core.Keyword(null,"header-props","header-props",742830512),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var temp__5804__auto__ = (function (){var G__134998 = e.target;
if((G__134998 == null)){
return null;
} else {
return G__134998.closest(".as-edit");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var _el = temp__5804__auto__;
var G__134999 = _el;
var G__135000 = (function (p1__134981_SHARP_){
return frontend.components.container.sidebar_navigations_edit_content(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__134981_SHARP_),new cljs.core.Keyword(null,"navs","navs",-1350609868),navs,new cljs.core.Keyword(null,"checked-navs","checked-navs",774369896),checked_navs,new cljs.core.Keyword(null,"set-checked-navs!","set-checked-navs!",-2081871382),set_checked_navs_BANG_], null));
});
var G__135001 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),false], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__134999,G__135000,G__135001) : logseq.shui.ui.popup_show_BANG_.call(null,G__134999,G__135000,G__135001));
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"more","more",-2058821800),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.as-edit","a.as-edit",1392106955),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!opacity-60 hover:!opacity-80 relative -top-0.5 -right-0.5"], null),logseq.shui.ui.tabler_icon("filter-edit",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sidebar-navigations.flex.flex-col.mt-1","div.sidebar-navigations.flex.flex-col.mt-1",-947305194),(function (){var page = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(default_home);
var enable_journals_QMARK_ = frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
return (!(enable_journals_QMARK_));
} else {
return and__5000__auto__;
}
})())){
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"home-nav",new cljs.core.Keyword(null,"title","title",636505583),page,new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),frontend.handler.route.redirect_to_home_BANG_,new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"page","page",849072397))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null))))))),new cljs.core.Keyword(null,"icon","icon",1679606541),"home",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","home","go/home",-74562325)], null));
} else {
if(enable_journals_QMARK_){
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"journals-nav",new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"all-journals","all-journals",-347015095))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"home","home",-74557309)))))),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("left-side-bar","journals","left-side-bar/journals",1870239904)], 0)),new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),(function (e){
if(cljs.core.truth_(frontend.components.container.goog$module$goog$object.get(e,"shiftKey"))){
return frontend.handler.route.sidebar_journals_BANG_();
} else {
return frontend.handler.route.go_to_journals_BANG_();
}
}),new cljs.core.Keyword(null,"icon","icon",1679606541),"calendar",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","journals","go/journals",-1915759787)], null));
} else {
return null;
}
}
})(),(function (){var iter__5480__auto__ = (function frontend$components$container$iter__135002(s__135003){
return (new cljs.core.LazySeq(null,(function (){
var s__135003__$1 = s__135003;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__135003__$1);
if(temp__5804__auto__){
var s__135003__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__135003__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__135003__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__135005 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__135004 = (0);
while(true){
if((i__135004 < size__5479__auto__)){
var nav = cljs.core._nth(c__5478__auto__,i__135004);
cljs.core.chunk_append(b__135005,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)))?(cljs.core.truth_(enable_whiteboards_QMARK_)?((cljs.core.not(db_based_QMARK_))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"class","class",-2030961996),"whiteboard",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","whiteboards","right-side-bar/whiteboards",-163296452)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)),new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),((function (i__135004,nav,c__5478__auto__,size__5479__auto__,b__135005,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_){
return (function (_e){
return frontend.handler.whiteboard.onboarding_show();
});})(i__135004,nav,c__5478__auto__,size__5479__auto__,b__135005,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_))
,new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = cljs.core.not(srs_open_QMARK_);
if(and__5000__auto__){
var fexpr__135006 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),null,new cljs.core.Keyword(null,"whiteboard","whiteboard",-1766646928),null], null), null);
return (fexpr__135006.cljs$core$IFn$_invoke$arity$1 ? fexpr__135006.cljs$core$IFn$_invoke$arity$1(route_name) : fexpr__135006.call(null,route_name));
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"icon","icon",1679606541),"writing",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","whiteboards","go/whiteboards",710208894)], null)):null):null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"flashcards","flashcards",2038329166)))?((frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?(function (){var num = frontend.state.sub(new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746));
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"class","class",-2030961996),"flashcards-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","flashcards","right-side-bar/flashcards",-1920196000)], 0)),new cljs.core.Keyword(null,"icon","icon",1679606541),"infinity",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","flashcards","go/flashcards",2038317222),new cljs.core.Keyword(null,"active","active",1895962068),srs_open_QMARK_,new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),((function (i__135004,num,nav,c__5478__auto__,size__5479__auto__,b__135005,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_){
return (function (){
frontend.extensions.fsrs.update_due_cards_count();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906)], null));
});})(i__135004,num,nav,c__5478__auto__,size__5479__auto__,b__135005,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_))
,new cljs.core.Keyword(null,"more","more",-2058821800),(cljs.core.truth_((function (){var and__5000__auto__ = num;
if(cljs.core.truth_(and__5000__auto__)){
return (!((num === (0))));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in","span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in",-2063677125),num], null):null)], null));
})():null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"graph-view","graph-view",-233626947)))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"graph-view-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","graph-view","right-side-bar/graph-view",-1104966609)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph","graph",1558099509)),new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"graph","graph",1558099509)))),new cljs.core.Keyword(null,"icon","icon",1679606541),"hierarchy",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","graph-view","go/graph-view",-233622043)], null)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"all-pages-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","all-pages","right-side-bar/all-pages",-258695220)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)),new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)))),new cljs.core.Keyword(null,"icon","icon",1679606541),"files"], null)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(nav),"tag"))?(cljs.core.truth_(db_based_QMARK_)?(function (){var name_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.name(nav);
var class_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, ["assets",new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970),"tasks",new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)], null),name_SINGLEQUOTE__SINGLEQUOTE_);
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = class_ident;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(class_ident) : frontend.db.entity.call(null,class_ident)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var tag_uuid = temp__5804__auto____$1;
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),["tag-view-nav ",name_SINGLEQUOTE__SINGLEQUOTE_].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("left-side-bar",name_SINGLEQUOTE__SINGLEQUOTE_),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("right-side-bar",name_SINGLEQUOTE__SINGLEQUOTE_)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),tag_uuid], null)),new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag_uuid),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null))),new cljs.core.Keyword(null,"icon","icon",1679606541),"hash"], null));
} else {
return null;
}
})():null):null))))));

var G__135141 = (i__135004 + (1));
i__135004 = G__135141;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__135005),frontend$components$container$iter__135002(cljs.core.chunk_rest(s__135003__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__135005),null);
}
} else {
var nav = cljs.core.first(s__135003__$2);
return cljs.core.cons(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)))?(cljs.core.truth_(enable_whiteboards_QMARK_)?((cljs.core.not(db_based_QMARK_))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"class","class",-2030961996),"whiteboard",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","whiteboards","right-side-bar/whiteboards",-163296452)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)),new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),((function (nav,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_){
return (function (_e){
return frontend.handler.whiteboard.onboarding_show();
});})(nav,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_))
,new cljs.core.Keyword(null,"active","active",1895962068),(function (){var and__5000__auto__ = cljs.core.not(srs_open_QMARK_);
if(and__5000__auto__){
var fexpr__135007 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),null,new cljs.core.Keyword(null,"whiteboard","whiteboard",-1766646928),null], null), null);
return (fexpr__135007.cljs$core$IFn$_invoke$arity$1 ? fexpr__135007.cljs$core$IFn$_invoke$arity$1(route_name) : fexpr__135007.call(null,route_name));
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"icon","icon",1679606541),"writing",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","whiteboards","go/whiteboards",710208894)], null)):null):null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"flashcards","flashcards",2038329166)))?((frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?(function (){var num = frontend.state.sub(new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746));
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"class","class",-2030961996),"flashcards-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","flashcards","right-side-bar/flashcards",-1920196000)], 0)),new cljs.core.Keyword(null,"icon","icon",1679606541),"infinity",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","flashcards","go/flashcards",2038317222),new cljs.core.Keyword(null,"active","active",1895962068),srs_open_QMARK_,new cljs.core.Keyword(null,"on-click-handler","on-click-handler",746440723),((function (num,nav,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_){
return (function (){
frontend.extensions.fsrs.update_due_cards_count();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906)], null));
});})(num,nav,s__135003__$2,temp__5804__auto__,navs,vec__134984,checked_navs,set_checked_navs_BANG_,map__134983,map__134983__$1,default_home,route_match,route_name,srs_open_QMARK_,db_based_QMARK_,enable_whiteboards_QMARK_))
,new cljs.core.Keyword(null,"more","more",-2058821800),(cljs.core.truth_((function (){var and__5000__auto__ = num;
if(cljs.core.truth_(and__5000__auto__)){
return (!((num === (0))));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in","span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in",-2063677125),num], null):null)], null));
})():null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"graph-view","graph-view",-233626947)))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"graph-view-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","graph-view","right-side-bar/graph-view",-1104966609)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph","graph",1558099509)),new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"graph","graph",1558099509)))),new cljs.core.Keyword(null,"icon","icon",1679606541),"hierarchy",new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword("go","graph-view","go/graph-view",-233622043)], null)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)))?frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"all-pages-nav",new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","all-pages","right-side-bar/all-pages",-258695220)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)),new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(srs_open_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route_name,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)))),new cljs.core.Keyword(null,"icon","icon",1679606541),"files"], null)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(nav),"tag"))?(cljs.core.truth_(db_based_QMARK_)?(function (){var name_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.name(nav);
var class_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, ["assets",new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970),"tasks",new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)], null),name_SINGLEQUOTE__SINGLEQUOTE_);
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = class_ident;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(class_ident) : frontend.db.entity.call(null,class_ident)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var tag_uuid = temp__5804__auto____$1;
return frontend.components.container.sidebar_item(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),["tag-view-nav ",name_SINGLEQUOTE__SINGLEQUOTE_].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("left-side-bar",name_SINGLEQUOTE__SINGLEQUOTE_),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("right-side-bar",name_SINGLEQUOTE__SINGLEQUOTE_)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),tag_uuid], null)),new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag_uuid),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null))),new cljs.core.Keyword(null,"icon","icon",1679606541),"hash"], null));
} else {
return null;
}
})():null):null))))),frontend$components$container$iter__135002(cljs.core.rest(s__135003__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(checked_navs);
})()], null));
}),null,"frontend.components.container/sidebar-navigations");
frontend.components.container.sidebar_favorites = rum.core.lazy_build(rum.core.build_defc,(function (){
var _favorites_updated_QMARK_ = frontend.state.sub(new cljs.core.Keyword("favorites","updated?","favorites/updated?",-1904365701));
var favorite_entities = frontend.handler.page.get_favorites();
return frontend.components.container.sidebar_content_group(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.wrap-th","a.wrap-th",1385261646),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.flex-1","strong.flex-1",-332188689),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("left-side-bar","nav-favorites","left-side-bar/nav-favorites",-1723503312)], 0))], null)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"favorites",new cljs.core.Keyword(null,"count","count",2139924085),cljs.core.count(favorite_entities),new cljs.core.Keyword(null,"edit-fn","edit-fn",-1974067620),(function (e){
reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"Favorites"], null));

return frontend.util.stop(e);
})], null),((cljs.core.seq(favorite_entities))?(function (){var favorite_items = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
var icon = frontend.components.icon.get_node_icon_cp(e,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e)),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.favorite-item.font-medium","li.favorite-item.font-medium",692268096),frontend.components.container.page_name(e,icon,false)], null)], null);
}),favorite_entities);
return frontend.components.dnd.items(favorite_items,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (favorites_SINGLEQUOTE_){
return frontend.handler.page._LT_reorder_favorites_BANG_(favorites_SINGLEQUOTE_);
}),new cljs.core.Keyword(null,"parent-node","parent-node",-605954869),new cljs.core.Keyword(null,"ul.favorites.text-sm","ul.favorites.text-sm",800189534)], null));
})():null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.container/sidebar-favorites");
frontend.components.container.sidebar_recent_pages = rum.core.lazy_build(rum.core.build_defc,(function (){
var pages = frontend.handler.recent.get_recent_pages();
return frontend.components.container.sidebar_content_group(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.wrap-th","a.wrap-th",1385261646),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.flex-1","strong.flex-1",-332188689),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("left-side-bar","nav-recent-pages","left-side-bar/nav-recent-pages",-554223849)], 0))], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"recent",new cljs.core.Keyword(null,"count","count",2139924085),cljs.core.count(pages)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.text-sm","ul.text-sm",423832983),(function (){var iter__5480__auto__ = (function frontend$components$container$iter__135012(s__135013){
return (new cljs.core.LazySeq(null,(function (){
var s__135013__$1 = s__135013;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__135013__$1);
if(temp__5804__auto__){
var s__135013__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__135013__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__135013__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__135015 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__135014 = (0);
while(true){
if((i__135014 < size__5479__auto__)){
var page = cljs.core._nth(c__5478__auto__,i__135014);
cljs.core.chunk_append(b__135015,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.recent-item.select-none.font-medium","li.recent-item.select-none.font-medium",-1331506661),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),["recent-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.handler.block.block_unique_title(page)], null),frontend.components.container.page_name(page,frontend.components.icon.get_node_icon_cp(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null)),true)], null));

var G__135142 = (i__135014 + (1));
i__135014 = G__135142;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__135015),frontend$components$container$iter__135012(cljs.core.chunk_rest(s__135013__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__135015),null);
}
} else {
var page = cljs.core.first(s__135013__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.recent-item.select-none.font-medium","li.recent-item.select-none.font-medium",-1331506661),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),["recent-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))].join(''),new cljs.core.Keyword(null,"title","title",636505583),frontend.handler.block.block_unique_title(page)], null),frontend.components.container.page_name(page,frontend.components.icon.get_node_icon_cp(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null)),true)], null),frontend$components$container$iter__135012(cljs.core.rest(s__135013__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(pages);
})()], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.container/sidebar-recent-pages");
frontend.components.container.get_default_home_if_valid = (function frontend$components$container$get_default_home_if_valid(){
var temp__5804__auto__ = frontend.state.get_default_home();
if(cljs.core.truth_(temp__5804__auto__)){
var default_home = temp__5804__auto__;
var page = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(default_home);
var page__$1 = ((((typeof page === 'string') && ((!(clojure.string.blank_QMARK_(page))))))?(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page)):null);
if(cljs.core.truth_(page__$1)){
return default_home;
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(default_home,new cljs.core.Keyword(null,"page","page",849072397));
}
} else {
return null;
}
});
frontend.components.container.sidebar_container = rum.core.lazy_build(rum.core.build_defc,(function (route_match,close_modal_fn,left_sidebar_open_QMARK_,enable_whiteboards_QMARK_,srs_open_QMARK_,_STAR_closing_QMARK_,close_signal,touching_x_offset){
var vec__135018 = rum.core.use_state(false);
var local_closing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135018,(0),null);
var set_local_closing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135018,(1),null);
var vec__135021 = rum.core.use_state(null);
var el_rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135021,(0),null);
var set_el_rect_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135021,(1),null);
var ref_el = rum.core.use_ref(null);
var ref_open_QMARK_ = rum.core.use_ref(left_sidebar_open_QMARK_);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var default_home = frontend.components.container.get_default_home_if_valid();
var route_name = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var on_contents_scroll = (function (p1__135016_SHARP_){
var temp__5804__auto__ = p1__135016_SHARP_.target;
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var top = el.scrollTop;
var cls = el.classList;
var cls_SINGLEQUOTE_ = "is-scrolled";
if((top > (2))){
return cls.add(cls_SINGLEQUOTE_);
} else {
return cls.remove(cls_SINGLEQUOTE_);
}
} else {
return null;
}
});
var close_fn = (function (){
return (set_local_closing_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_local_closing_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_local_closing_QMARK_.call(null,true));
});
var touching_x_offset__$1 = ((typeof touching_x_offset === 'number')?((cljs.core.not(left_sidebar_open_QMARK_))?(((touching_x_offset > (0)))?(function (){var x__5090__auto__ = touching_x_offset;
var y__5091__auto__ = new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(el_rect);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():null):(((touching_x_offset < (0)))?(function (){var x__5087__auto__ = touching_x_offset;
var y__5088__auto__ = ((0) - new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(el_rect));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})():null)):null);
var offset_ratio = (function (){var and__5000__auto__ = typeof touching_x_offset__$1 === 'number';
if(and__5000__auto__){
var G__135024 = new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(el_rect);
if((G__135024 == null)){
return null;
} else {
return (touching_x_offset__$1 / G__135024);
}
} else {
return and__5000__auto__;
}
})();
logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
var G__135025 = rum.core.deref(ref_el);
var G__135025__$1 = (((G__135025 == null))?null:G__135025.getBoundingClientRect());
var G__135025__$2 = (((G__135025__$1 == null))?null:G__135025__$1.toJSON());
var G__135025__$3 = (((G__135025__$2 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__135025__$2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
if((G__135025__$3 == null)){
return null;
} else {
return (set_el_rect_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_el_rect_BANG_.cljs$core$IFn$_invoke$arity$1(G__135025__$3) : set_el_rect_BANG_.call(null,G__135025__$3));
}
}),(16));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_layout_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = rum.core.deref(ref_open_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return local_closing_QMARK_;
} else {
return and__5000__auto__;
}
})())){
cljs.core.reset_BANG_(_STAR_closing_QMARK_,true);
} else {
}

rum.core.set_ref_BANG_(ref_open_QMARK_,left_sidebar_open_QMARK_);

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [local_closing_QMARK_,left_sidebar_open_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if((close_signal < (0))){
return null;
} else {
return close_fn();
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [close_signal], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'key':"left-sidebar",'ref':ref_el,'style':daiquiri.interpreter.element_attributes((function (){var G__135031 = cljs.core.PersistentArrayMap.EMPTY;
var G__135031__$1 = ((((typeof offset_ratio === 'number') && ((touching_x_offset__$1 > (0)))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135031,new cljs.core.Keyword(null,"transform","transform",1381301764),["translate3d(calc(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(touching_x_offset__$1),"px - 100%), 0, 0)"].join('')):G__135031);
if(((typeof offset_ratio === 'number') && ((touching_x_offset__$1 < (0))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135031__$1,new cljs.core.Keyword(null,"transform","transform",1381301764),["translate3d(",cljs.core.str.cljs$core$IFn$_invoke$arity$1((offset_ratio * (100))),"%, 0, 0)"].join(''));
} else {
return G__135031__$1;
}
})()),'onTransitionEnd':(function (){
if(cljs.core.truth_(local_closing_QMARK_)){
cljs.core.reset_BANG_(_STAR_closing_QMARK_,false);

(set_local_closing_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_local_closing_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_local_closing_QMARK_.call(null,false));

return (close_modal_fn.cljs$core$IFn$_invoke$arity$0 ? close_modal_fn.cljs$core$IFn$_invoke$arity$0() : close_modal_fn.call(null));
} else {
return null;
}
}),'onClick':(function (p1__135017_SHARP_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.util.sm_breakpoint_QMARK_();
if(and__5000__auto__){
return p1__135017_SHARP_.target;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.some((function (sel){
return cljs.core.boolean$(target.closest(sel));
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [".favorites .bd",".recent .bd",".dropdown-wrapper",".nav-header"], null)))){
return close_fn();
} else {
return null;
}
} else {
return null;
}
}),'className':"left-sidebar-inner flex-1 flex flex-col min-h-0"},[daiquiri.core.create_element("div",{'className':"wrap"},[daiquiri.core.create_element("div",{'className':"sidebar-header-container"},[frontend.components.container.sidebar_graphs(),frontend.components.container.sidebar_navigations(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"default-home","default-home",171104159),default_home,new cljs.core.Keyword(null,"route-match","route-match",-1450985937),route_match,new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232),db_based_QMARK_,new cljs.core.Keyword(null,"enable-whiteboards?","enable-whiteboards?",-1186549034),enable_whiteboards_QMARK_,new cljs.core.Keyword(null,"route-name","route-name",-932603717),route_name,new cljs.core.Keyword(null,"srs-open?","srs-open?",407120677),srs_open_QMARK_], null))]),daiquiri.core.create_element("div",{'onScroll':on_contents_scroll,'className':"sidebar-contents-container"},[frontend.components.container.sidebar_favorites(),(((!(frontend.config.publishing_QMARK_)))?frontend.components.container.sidebar_recent_pages():null)])])]),(function (){var attrs135030 = (function (){var G__135032 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"key","key",-1516042587),"shade-mask"], null);
if(typeof offset_ratio === 'number'){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135032,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"opacity","opacity",397153780),(function (){var G__135033 = offset_ratio;
if((offset_ratio < (0))){
return (G__135033 + (1));
} else {
return G__135033;
}
})()], null));
} else {
return G__135032;
}
})();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs135030))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["shade-mask"], null)], null),attrs135030], 0))):{'className':"shade-mask"}),((cljs.core.map_QMARK_(attrs135030))?null:[daiquiri.interpreter.interpret(attrs135030)]));
})()]);
}),null,"frontend.components.container/sidebar-container");
frontend.components.container.sidebar_resizer = rum.core.lazy_build(rum.core.build_defc,(function (){
var _STAR_el_ref = rum.core.use_ref(null);
var el_doc = document.documentElement;
var adjust_size_BANG_ = (function (width){
el_doc.style.setProperty("--ls-left-sidebar-width",width);

return frontend.storage.set(new cljs.core.Keyword(null,"ls-left-sidebar-width","ls-left-sidebar-width",1579560028),width);
});
logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1((function (){
var temp__5804__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"ls-left-sidebar-width","ls-left-sidebar-width",1579560028));
if(cljs.core.truth_(temp__5804__auto__)){
var width = temp__5804__auto__;
return el_doc.style.setProperty("--ls-left-sidebar-width",width);
} else {
return null;
}
}));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(window.interact);
if(and__5000__auto__){
return rum.core.deref(_STAR_el_ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var sidebar_el_135143 = el_doc.querySelector("#left-sidebar");
interact(el).draggable(({"listeners": ({"move": (function (e){
var temp__5804__auto____$1 = e.rect.left;
if(cljs.core.truth_(temp__5804__auto____$1)){
var offset = temp__5804__auto____$1;
var width = (function (){var x__5087__auto__ = (function (){var x__5090__auto__ = offset;
var y__5091__auto__ = (460);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var y__5088__auto__ = (240);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})().toFixed((2));
return adjust_size_BANG_([cljs.core.str.cljs$core$IFn$_invoke$arity$1(width),"px"].join(''));
} else {
return null;
}
})})})).styleCursor(false).on("dragstart",(function (){
sidebar_el_135143.classList.add("is-resizing");

return el_doc.classList.add("is-resizing-buf");
})).on("dragend",(function (){
sidebar_el_135143.classList.remove("is-resizing");

return el_doc.classList.remove("is-resizing-buf");
}));

return (function (){
return cljs.core.List.EMPTY;
});
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("span",{'ref':_STAR_el_ref,'className':"left-sidebar-resizer"},[]);
}),null,"frontend.components.container/sidebar-resizer");
frontend.components.container.left_sidebar = rum.core.lazy_build(rum.core.build_defcs,(function (s,p__135035){
var map__135036 = p__135035;
var map__135036__$1 = cljs.core.__destructure_map(map__135036);
var left_sidebar_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135036__$1,new cljs.core.Keyword(null,"left-sidebar-open?","left-sidebar-open?",899591356));
var route_match = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135036__$1,new cljs.core.Keyword(null,"route-match","route-match",-1450985937));
var close_fn = (function (){
return frontend.state.set_left_sidebar_open_BANG_(false);
});
var _STAR_closing_QMARK_ = new cljs.core.Keyword("frontend.components.container","closing?","frontend.components.container/closing?",-783814635).cljs$core$IFn$_invoke$arity$1(s);
var _STAR_touch_state = new cljs.core.Keyword("frontend.components.container","touch-state","frontend.components.container/touch-state",-2049636095).cljs$core$IFn$_invoke$arity$1(s);
var _STAR_close_signal = new cljs.core.Keyword("frontend.components.container","close-signal","frontend.components.container/close-signal",-1192524851).cljs$core$IFn$_invoke$arity$1(s);
var enable_whiteboards_QMARK_ = frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$0();
var touch_point_fn = (function (e){
var G__135037 = frontend.components.container.goog$module$goog$object.get(e,"touches");
var G__135037__$1 = (((G__135037 == null))?null:(G__135037[(0)]));
if((G__135037__$1 == null)){
return null;
} else {
return (function (p1__135034_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)],[p1__135034_SHARP_.clientX,p1__135034_SHARP_.clientY]);
})(G__135037__$1);
}
});
var srs_open_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"srs","srs",1327991978),frontend.state.sub(new cljs.core.Keyword("modal","id","modal/id",-1274892409)));
var touching_x_offset = (function (){var and__5000__auto__ = (function (){var G__135038 = cljs.core.deref(_STAR_touch_state);
if((G__135038 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"after","after",594996914).cljs$core$IFn$_invoke$arity$1(G__135038);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
var G__135039 = cljs.core.deref(_STAR_touch_state);
var G__135039__$1 = (((G__135039 == null))?null:cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"after","after",594996914),new cljs.core.Keyword(null,"before","before",-1633692388))(G__135039));
var G__135039__$2 = (((G__135039__$1 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"x","x",2099068185),G__135039__$1));
if((G__135039__$2 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._,G__135039__$2);
}
} else {
return and__5000__auto__;
}
})();
var touch_pending_QMARK_ = (cljs.core.abs(touching_x_offset) > (20));
return daiquiri.core.create_element("div",{'id':"left-sidebar",'onTouchStart':(function (e){
return cljs.core.reset_BANG_(_STAR_touch_state,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"before","before",-1633692388),touch_point_fn(e)], null));
}),'onTouchMove':(function (e){
if(cljs.core.truth_(cljs.core.deref(_STAR_touch_state))){
var G__135040 = _STAR_touch_state;
if((G__135040 == null)){
return null;
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(G__135040,cljs.core.assoc,new cljs.core.Keyword(null,"after","after",594996914),touch_point_fn(e));
}
} else {
return null;
}
}),'onTouchEnd':(function (){
if(touch_pending_QMARK_){
if(((cljs.core.not(left_sidebar_open_QMARK_)) && ((touching_x_offset > (40))))){
frontend.state.set_left_sidebar_open_BANG_(true);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = left_sidebar_open_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (touching_x_offset < (-30));
} else {
return and__5000__auto__;
}
})())){
cljs.core.reset_BANG_(_STAR_close_signal,(cljs.core.deref(_STAR_close_signal) + (1)));
} else {
}
}
} else {
}

return cljs.core.reset_BANG_(_STAR_touch_state,null);
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__sidebar-left-layout",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"is-open","is-open",1660707069),left_sidebar_open_QMARK_,new cljs.core.Keyword(null,"is-closing","is-closing",1975869223),cljs.core.deref(_STAR_closing_QMARK_),new cljs.core.Keyword(null,"is-touching","is-touching",-546912701),touch_pending_QMARK_], null)], null))], null))},[frontend.components.container.sidebar_container(route_match,close_fn,left_sidebar_open_QMARK_,enable_whiteboards_QMARK_,srs_open_QMARK_,_STAR_closing_QMARK_,cljs.core.deref(_STAR_close_signal),(function (){var and__5000__auto__ = touch_pending_QMARK_;
if(and__5000__auto__){
return touching_x_offset;
} else {
return and__5000__auto__;
}
})()),frontend.components.container.sidebar_resizer()]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.container","closing?","frontend.components.container/closing?",-783814635)),rum.core.local.cljs$core$IFn$_invoke$arity$2((-1),new cljs.core.Keyword("frontend.components.container","close-signal","frontend.components.container/close-signal",-1192524851)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.container","touch-state","frontend.components.container/touch-state",-2049636095))], null),"frontend.components.container/left-sidebar");
frontend.components.container.recording_bar = rum.core.lazy_build(rum.core.build_defc,(function (){
return rum.core.adapt_class_helper(module$node_modules$react_draggable$dist$react_draggable,{'onStart':(function (_event){
var temp__5804__auto__ = (function (){var G__135041 = frontend.state.get_input();
if((G__135041 == null)){
return null;
} else {
return frontend.util.cursor.pos(G__135041);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pos = temp__5804__auto__;
return frontend.state.set_editor_last_pos_BANG_(pos);
} else {
return null;
}
}),'onStop':(function (_event){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("editor","block","editor/block",1699377461))),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block,new cljs.core.Keyword(null,"max","max",61366548)));

var temp__5804__auto____$1 = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
var temp__5804__auto____$2 = frontend.state.get_editor_last_pos();
if(cljs.core.truth_(temp__5804__auto____$2)){
var saved_cursor = temp__5804__auto____$2;
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,saved_cursor);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
})},[daiquiri.core.create_element("div",{'id':"audio-record-toolbar",'style':{'bottom':(cljs.core.deref(frontend.util.keyboard_height) + (45))}},[frontend.mobile.footer.audio_record_cp()])]);
}),null,"frontend.components.container/recording-bar");
frontend.components.container.main = rum.core.lazy_build(rum.core.build_defc,(function (p__135042){
var map__135043 = p__135042;
var map__135043__$1 = cljs.core.__destructure_map(map__135043);
var route_match = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"route-match","route-match",-1450985937));
var margin_less_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"margin-less-pages?","margin-less-pages?",-1770705087));
var route_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"route-name","route-name",-932603717));
var indexeddb_support_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"indexeddb-support?","indexeddb-support?",-1571226476));
var db_restoring_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664));
var main_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"main-content","main-content",1386726798));
var show_action_bar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"show-action-bar?","show-action-bar?",1936923598));
var show_recording_bar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135043__$1,new cljs.core.Keyword(null,"show-recording-bar?","show-recording-bar?",-1835604479));
var left_sidebar_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728));
var onboarding_and_home_QMARK_ = (function (){var and__5000__auto__ = (function (){var or__5002__auto__ = (frontend.state.get_current_repo() == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (((!(frontend.config.publishing_QMARK_))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"home","home",-74557309),route_name)));
} else {
return and__5000__auto__;
}
})();
var margin_less_pages_QMARK___$1 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return onboarding_and_home_QMARK_;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return margin_less_pages_QMARK_;
}
})();
return daiquiri.core.create_element("div",{'id':"main-container",'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__sidebar-main-layout","flex-1","flex",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"is-left-sidebar-open","is-left-sidebar-open",-1193752939),left_sidebar_open_QMARK_], null)], null))], null))},[frontend.components.container.left_sidebar(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-sidebar-open?","left-sidebar-open?",899591356),left_sidebar_open_QMARK_,new cljs.core.Keyword(null,"route-match","route-match",-1450985937),route_match], null)),daiquiri.core.create_element("div",{'id':"main-content-container",'tabIndex':"-1",'data-is-margin-less-pages':margin_less_pages_QMARK___$1,'className':"scrollbar-spacing w-full flex justify-center flex-row outline-none relative"},[(cljs.core.truth_(show_action_bar_QMARK_)?frontend.mobile.action_bar.action_bar():null),daiquiri.core.create_element("div",{'data-is-margin-less-pages':margin_less_pages_QMARK___$1,'data-is-full-width':(function (){var or__5002__auto__ = margin_less_pages_QMARK___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"my-publishing","my-publishing",227980452),null,new cljs.core.Keyword(null,"all-files","all-files",1120339891),null,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),null], null), null),route_name);
}
})(),'className':"cp__sidebar-main-content"},[(cljs.core.truth_(show_recording_bar_QMARK_)?frontend.components.container.recording_bar():null),frontend.mobile.mobile_bar.mobile_bar(),frontend.mobile.footer.footer(),((cljs.core.not(indexeddb_support_QMARK_))?null:(cljs.core.truth_(db_restoring_QMARK_)?((frontend.config.publishing_QMARK_)?(function (){var attrs135046 = (function (){var G__135050 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 w-1/3 mb-8 bg-gray-400"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135050) : logseq.shui.ui.skeleton.call(null,G__135050));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs135046))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["space-y-2"], null)], null),attrs135046], 0))):{'className':"space-y-2"}),((cljs.core.map_QMARK_(attrs135046))?[daiquiri.interpreter.interpret((function (){var G__135052 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full bg-gray-400"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135052) : logseq.shui.ui.skeleton.call(null,G__135052));
})()),daiquiri.interpreter.interpret((function (){var G__135054 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full bg-gray-400"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135054) : logseq.shui.ui.skeleton.call(null,G__135054));
})())]:[daiquiri.interpreter.interpret(attrs135046),daiquiri.interpreter.interpret((function (){var G__135056 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full bg-gray-400"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135056) : logseq.shui.ui.skeleton.call(null,G__135056));
})()),daiquiri.interpreter.interpret((function (){var G__135058 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full bg-gray-400"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135058) : logseq.shui.ui.skeleton.call(null,G__135058));
})())]));
})():(function (){var attrs135049 = (function (){var G__135059 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 w-1/3 mb-8"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135059) : logseq.shui.ui.skeleton.call(null,G__135059));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs135049))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["space-y-2"], null)], null),attrs135049], 0))):{'className':"space-y-2"}),((cljs.core.map_QMARK_(attrs135049))?[daiquiri.interpreter.interpret((function (){var G__135061 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135061) : logseq.shui.ui.skeleton.call(null,G__135061));
})()),daiquiri.interpreter.interpret((function (){var G__135063 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135063) : logseq.shui.ui.skeleton.call(null,G__135063));
})())]:[daiquiri.interpreter.interpret(attrs135049),daiquiri.interpreter.interpret((function (){var G__135065 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135065) : logseq.shui.ui.skeleton.call(null,G__135065));
})()),daiquiri.interpreter.interpret((function (){var G__135067 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__135067) : logseq.shui.ui.skeleton.call(null,G__135067));
})())]));
})()):daiquiri.core.create_element("div",{'style':{'marginBottom':(cljs.core.truth_(margin_less_pages_QMARK___$1)?(0):(cljs.core.truth_(onboarding_and_home_QMARK_)?(0):(120)
))},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = onboarding_and_home_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return margin_less_pages_QMARK___$1;
}
})())?"":frontend.util.hiccup__GT_class("mx-auto.pb-24"))], null))},[daiquiri.interpreter.interpret(main_content)])
)),null])])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var temp__5804__auto___135144 = goog.dom.getElement("main-content-container");
if(cljs.core.truth_(temp__5804__auto___135144)){
var element_135145 = temp__5804__auto___135144;
cljs_drag_n_drop.core.subscribe_BANG_(element_135145,new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"drop","drop",364481611),(function (_e,files){
var temp__5804__auto____$1 = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.get_edit_block(),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.editor.upload_asset_BANG_(id,files,format,frontend.handler.editor._STAR_asset_uploading_QMARK_,true);
} else {
return null;
}
})], null));

frontend.handler.common.listen_to_scroll_BANG_(element_135145);

if(cljs.core.truth_(new cljs.core.Keyword(null,"margin-less-pages?","margin-less-pages?",-1770705087).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))){
(element_135145.scrollTop = (0));
} else {
}
} else {
}

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___135146 = goog.dom.getElement("main-content-container");
if(cljs.core.truth_(temp__5804__auto___135146)){
var el_135147 = temp__5804__auto___135146;
cljs_drag_n_drop.core.unsubscribe_BANG_(el_135147,new cljs.core.Keyword(null,"upload-files","upload-files",-771877630));
} else {
}

return state;
})], null)], null),"frontend.components.container/main");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.container !== 'undefined') && (typeof frontend.components.container.sidebar_inited_QMARK_ !== 'undefined')){
} else {
frontend.components.container.sidebar_inited_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.container.parsing_progress = rum.core.lazy_build(rum.core.build_defc,(function (state){
var finished = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"finished","finished",-1018867731).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var total = new cljs.core.Keyword(null,"total","total",1916810418).cljs$core$IFn$_invoke$arity$1(state);
var width = Math.round(((finished / total).toFixed((2)) * (100)));
var display_filename = (function (){var G__135068 = new cljs.core.Keyword(null,"current-parsing-file","current-parsing-file",1063090327).cljs$core$IFn$_invoke$arity$1(state);
var G__135068__$1 = (((G__135068 == null))?null:cljs.core.not_empty(G__135068));
if((G__135068__$1 == null)){
return null;
} else {
return logseq.common.path.filename(G__135068__$1);
}
})();
var left_label = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.font-bold","div.flex.flex-row.font-bold",2116828028),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parsing-files","parsing-files",-565009782)], 0)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.hidden.md:flex.flex-row","div.hidden.md:flex.flex-row",-212067351),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mr-1","span.mr-1",127520086),": "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-ellipsis-wrapper","div.text-ellipsis-wrapper",-595927398),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(300)], null)], null),display_filename], null)], null)], null);
return frontend.ui.progress_bar_with_label(width,left_label,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(finished),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total)].join(''));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.container/parsing-progress");
frontend.components.container.main_content = rum.core.lazy_build(rum.core.build_defc,(function (){
var default_home = frontend.components.container.get_default_home_if_valid();
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var loading_files_QMARK_ = (cljs.core.truth_(current_repo)?frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("repo","loading-files?","repo/loading-files?",196666138),current_repo], null)):null);
var graph_parsing_state = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","parsing-state","graph/parsing-state",-1745487605),current_repo], null));
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"graph-loading?","graph-loading?",1136649541).cljs$core$IFn$_invoke$arity$1(graph_parsing_state);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"total","total",1916810418).cljs$core$IFn$_invoke$arity$1(graph_parsing_state),new cljs.core.Keyword(null,"finished","finished",-1018867731).cljs$core$IFn$_invoke$arity$1(graph_parsing_state));
}
})())){
return daiquiri.core.create_element("div",{'className':"flex items-center justify-center full-height-without-header"},[daiquiri.core.create_element("div",{'className':"flex-1"},[frontend.components.container.parsing_progress(graph_parsing_state)])]);
} else {
var attrs135073 = (cljs.core.truth_((function (){var and__5000__auto__ = default_home;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"home","home",-74557309),frontend.state.get_current_route());
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not(frontend.state.route_has_p_QMARK_());
if(and__5000__auto____$2){
return new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(default_home);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(default_home)):(((function (){var or__5002__auto__ = (!(frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var latest_journals = (function (){var G__135074 = frontend.state.get_current_repo();
var G__135075 = (1);
return (frontend.db.get_latest_journals.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_latest_journals.cljs$core$IFn$_invoke$arity$2(G__135074,G__135075) : frontend.db.get_latest_journals.call(null,G__135074,G__135075));
})();
return ((frontend.config.publishing_QMARK_) && (((cljs.core.not(default_home)) && (cljs.core.empty_QMARK_(latest_journals)))));
}
})())?frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)], null)):(cljs.core.truth_(loading_files_QMARK_)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"loading-files","loading-files",-611285064)], 0))):frontend.components.journal.all_journals()
)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs135073))?daiquiri.interpreter.element_attributes(attrs135073):null),((cljs.core.map_QMARK_(attrs135073))?null:[daiquiri.interpreter.interpret(attrs135073)]));

}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
if(cljs.core.truth_(cljs.core.deref(frontend.components.container.sidebar_inited_QMARK_))){
} else {
var current_repo_135148 = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var default_home_135149 = frontend.components.container.get_default_home_if_valid();
var sidebar_135150 = new cljs.core.Keyword(null,"sidebar","sidebar",35784458).cljs$core$IFn$_invoke$arity$1(default_home_135149);
var sidebar_135151__$1 = ((typeof sidebar_135150 === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [sidebar_135150], null):sidebar_135150);
var temp__5804__auto___135152 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.seq(sidebar_135151__$1));
if(cljs.core.truth_(temp__5804__auto___135152)){
var pages_135153 = temp__5804__auto___135152;
var seq__135076_135154 = cljs.core.seq(pages_135153);
var chunk__135077_135155 = null;
var count__135078_135156 = (0);
var i__135079_135157 = (0);
while(true){
if((i__135079_135157 < count__135078_135156)){
var page_135158 = chunk__135077_135155.cljs$core$IIndexed$_nth$arity$2(null,i__135079_135157);
var page_135159__$1 = (frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_135158) : frontend.util.safe_page_name_sanity_lc.call(null,page_135158));
var vec__135086_135160 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_135159__$1,"contents"))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_135159__$1) : frontend.db.get_page.call(null,page_135159__$1)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "contents";
}
})(),new cljs.core.Keyword(null,"contents","contents",-1567174023)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_135159__$1) : frontend.db.get_page.call(null,page_135159__$1))),new cljs.core.Keyword(null,"page","page",849072397)], null));
var db_id_135161 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135086_135160,(0),null);
var block_type_135162 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135086_135160,(1),null);
frontend.state.sidebar_add_block_BANG_(current_repo_135148,db_id_135161,block_type_135162);


var G__135163 = seq__135076_135154;
var G__135164 = chunk__135077_135155;
var G__135165 = count__135078_135156;
var G__135166 = (i__135079_135157 + (1));
seq__135076_135154 = G__135163;
chunk__135077_135155 = G__135164;
count__135078_135156 = G__135165;
i__135079_135157 = G__135166;
continue;
} else {
var temp__5804__auto___135167__$1 = cljs.core.seq(seq__135076_135154);
if(temp__5804__auto___135167__$1){
var seq__135076_135168__$1 = temp__5804__auto___135167__$1;
if(cljs.core.chunked_seq_QMARK_(seq__135076_135168__$1)){
var c__5525__auto___135169 = cljs.core.chunk_first(seq__135076_135168__$1);
var G__135170 = cljs.core.chunk_rest(seq__135076_135168__$1);
var G__135171 = c__5525__auto___135169;
var G__135172 = cljs.core.count(c__5525__auto___135169);
var G__135173 = (0);
seq__135076_135154 = G__135170;
chunk__135077_135155 = G__135171;
count__135078_135156 = G__135172;
i__135079_135157 = G__135173;
continue;
} else {
var page_135174 = cljs.core.first(seq__135076_135168__$1);
var page_135175__$1 = (frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_135174) : frontend.util.safe_page_name_sanity_lc.call(null,page_135174));
var vec__135089_135176 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_135175__$1,"contents"))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_135175__$1) : frontend.db.get_page.call(null,page_135175__$1)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "contents";
}
})(),new cljs.core.Keyword(null,"contents","contents",-1567174023)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_135175__$1) : frontend.db.get_page.call(null,page_135175__$1))),new cljs.core.Keyword(null,"page","page",849072397)], null));
var db_id_135177 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135089_135176,(0),null);
var block_type_135178 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135089_135176,(1),null);
frontend.state.sidebar_add_block_BANG_(current_repo_135148,db_id_135177,block_type_135178);


var G__135179 = cljs.core.next(seq__135076_135168__$1);
var G__135180 = null;
var G__135181 = (0);
var G__135182 = (0);
seq__135076_135154 = G__135179;
chunk__135077_135155 = G__135180;
count__135078_135156 = G__135181;
i__135079_135157 = G__135182;
continue;
}
} else {
}
}
break;
}

cljs.core.reset_BANG_(frontend.components.container.sidebar_inited_QMARK_,true);
} else {
}
}

if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-tabbar?","mobile/show-tabbar?",925227298),true);
} else {
}

return state;
})], null)], null),"frontend.components.container/main-content");
frontend.components.container.hide_context_menu_and_clear_selection = (function frontend$components$container$hide_context_menu_and_clear_selection(var_args){
var args__5732__auto__ = [];
var len__5726__auto___135183 = arguments.length;
var i__5727__auto___135184 = (0);
while(true){
if((i__5727__auto___135184 < len__5726__auto___135183)){
args__5732__auto__.push((arguments[i__5727__auto___135184]));

var G__135185 = (i__5727__auto___135184 + (1));
i__5727__auto___135184 = G__135185;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.components.container.hide_context_menu_and_clear_selection.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.components.container.hide_context_menu_and_clear_selection.cljs$core$IFn$_invoke$arity$variadic = (function (e,p__135094){
var map__135095 = p__135094;
var map__135095__$1 = cljs.core.__destructure_map(map__135095);
var esc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135095__$1,new cljs.core.Keyword(null,"esc?","esc?",926265416));
frontend.state.hide_custom_context_menu_BANG_();

if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.components.container.goog$module$goog$object.get(e,"shiftKey");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.state.get_edit_input_id();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (function (){var G__135096 = e.target;
if((G__135096 == null)){
return null;
} else {
return frontend.util.input_QMARK_(G__135096);
}
})();
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.shui.dialog.core.get_last_modal_id(),new cljs.core.Keyword(null,"property-dialog","property-dialog",1885514281));
if(or__5002__auto____$4){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = (function (){var G__135097 = e.target;
if((G__135097 == null)){
return null;
} else {
return G__135097.closest(".ls-block");
}
})();
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var G__135098 = e.target;
if((G__135098 == null)){
return null;
} else {
return G__135098.closest("[data-keep-selection]");
}
}
}
}
}
}
}
})())){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = esc_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.editor.popup_exists_QMARK_(new cljs.core.Keyword(null,"selection-action-bar","selection-action-bar",885868555));
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
} else {
return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
}
}
}));

(frontend.components.container.hide_context_menu_and_clear_selection.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.components.container.hide_context_menu_and_clear_selection.cljs$lang$applyTo = (function (seq135092){
var G__135093 = cljs.core.first(seq135092);
var seq135092__$1 = cljs.core.next(seq135092);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__135093,seq135092__$1);
}));

frontend.components.container.render_custom_context_menu = rum.core.lazy_build(rum.core.build_defc,(function (links,position){
var ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1((function (){
var el = rum.core.deref(ref);
var map__135099 = frontend.util.calc_delta_rect_offset(el,document.documentElement);
var map__135099__$1 = cljs.core.__destructure_map(map__135099);
var x = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135099__$1,new cljs.core.Keyword(null,"x","x",2099068185));
var y = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135099__$1,new cljs.core.Keyword(null,"y","y",-1757859776));
return (el.style.transform = ["translate3d(",cljs.core.str.cljs$core$IFn$_invoke$arity$1((((x < (0)))?x:(0))),"px,",cljs.core.str.cljs$core$IFn$_invoke$arity$1((((y < (0)))?(y - (10)):(0))),"px",",0)"].join(''));
}));

return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'onPointerDown':(function (e){
return frontend.components.container.hide_context_menu_and_clear_selection(e);
}),'className':"menu-backdrop"},[]),daiquiri.core.create_element("div",{'id':"custom-context-menu",'ref':ref,'style':{'zIndex':(999),'left':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(position)),"px"].join(''),'top':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(position)),"px"].join('')}},[daiquiri.interpreter.interpret(links)])]);
}),null,"frontend.components.container/render-custom-context-menu");
frontend.components.container.custom_context_menu = rum.core.lazy_build(rum.core.build_defc,(function (){
var show_QMARK_ = frontend.state.sub(new cljs.core.Keyword("custom-context-menu","show?","custom-context-menu/show?",2074408902));
var links = frontend.state.sub(new cljs.core.Keyword("custom-context-menu","links","custom-context-menu/links",-1197608677));
var position = frontend.state.sub(new cljs.core.Keyword("custom-context-menu","position","custom-context-menu/position",666089423));
if(cljs.core.truth_((function (){var and__5000__auto__ = show_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = links;
if(cljs.core.truth_(and__5000__auto____$1)){
return position;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.components.container.render_custom_context_menu(links,position);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.container/custom-context-menu");
frontend.components.container.new_block_mode = rum.core.lazy_build(rum.core.build_defc,(function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("document","mode?","document/mode?",-994203479)], null)))){
return frontend.ui.tooltip(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2","a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2",700721131),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.state.toggle_document_mode_BANG_], null),"D"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-2","div.p-2",-325121057),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.mb-2","p.mb-2",-1476899286),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b","b",1482224470),"Document mode"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inline-block.mr-1","div.inline-block.mr-1",803362566),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("editor","new-line","editor/new-line",363787014)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.inline-block","p.inline-block",-100331424),"to create new block"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.inline-block.mr-1","p.inline-block.mr-1",1865795813),"Click `D` or type"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inline-block.mr-1","div.inline-block.mr-1",803362566),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("ui","toggle-document-mode","ui/toggle-document-mode",-1556999601)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.inline-block","p.inline-block",-100331424),"to toggle document mode"], null)], null)], null)], null));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.container/new-block-mode");
frontend.components.container.help_menu_items = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Handbook",new cljs.core.Keyword(null,"icon","icon",1679606541),"book-2",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.handbooks.toggle_handbooks();
})], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Keyboard shortcuts",new cljs.core.Keyword(null,"icon","icon",1679606541),"command",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),"shortcut-settings",new cljs.core.Keyword(null,"shortcut-settings","shortcut-settings",-1663349734));
})], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Documentation",new cljs.core.Keyword(null,"icon","icon",1679606541),"help",new cljs.core.Keyword(null,"href","href",-793805698),"https://docs.logseq.com/"], null),new cljs.core.Keyword(null,"hr","hr",1377740067),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Report bug",new cljs.core.Keyword(null,"icon","icon",1679606541),"bug",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"bug-report","bug-report",-903169180));
})], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Request feature",new cljs.core.Keyword(null,"icon","icon",1679606541),"git-pull-request",new cljs.core.Keyword(null,"href","href",-793805698),"https://discuss.logseq.com/c/feedback/feature-requests/"], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Submit feedback",new cljs.core.Keyword(null,"icon","icon",1679606541),"messages",new cljs.core.Keyword(null,"href","href",-793805698),"https://discuss.logseq.com/c/feedback/13"], null),new cljs.core.Keyword(null,"hr","hr",1377740067),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Ask the community",new cljs.core.Keyword(null,"icon","icon",1679606541),"brand-discord",new cljs.core.Keyword(null,"href","href",-793805698),"https://discord.com/invite/KpN4eHY"], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Support forum",new cljs.core.Keyword(null,"icon","icon",1679606541),"message",new cljs.core.Keyword(null,"href","href",-793805698),"https://discuss.logseq.com/"], null),new cljs.core.Keyword(null,"hr","hr",1377740067),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Release notes",new cljs.core.Keyword(null,"icon","icon",1679606541),"asterisk",new cljs.core.Keyword(null,"href","href",-793805698),"https://docs.logseq.com/#/page/changelog"], null)], null);
frontend.components.container.help_menu_popup = rum.core.lazy_build(rum.core.build_defc,(function (){
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058),false);
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
var h = (function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612),false);
});
document.body.addEventListener("click",h);

return (function (){
return document.body.removeEventListener("click",h);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"cp__sidebar-help-menu-popup"},[daiquiri.core.create_element("div",{'className':"list-wrap"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$container$iter__135100(s__135101){
return (new cljs.core.LazySeq(null,(function (){
var s__135101__$1 = s__135101;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__135101__$1);
if(temp__5804__auto__){
var s__135101__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__135101__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__135101__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__135103 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__135102 = (0);
while(true){
if((i__135102 < size__5479__auto__)){
var vec__135104 = cljs.core._nth(c__5478__auto__,i__135102);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135104,(0),null);
var map__135107 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135104,(1),null);
var map__135107__$1 = cljs.core.__destructure_map(map__135107);
var item = map__135107__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135107__$1,new cljs.core.Keyword(null,"title","title",636505583));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135107__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135107__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135107__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
cljs.core.chunk_append(b__135103,(function (){var G__135108 = item;
var G__135108__$1 = (((G__135108 instanceof cljs.core.Keyword))?G__135108.fqn:null);
switch (G__135108__$1) {
case "hr":
return daiquiri.core.create_element("hr",{'key':idx,'className':"my-2"},[]);

break;
default:
return daiquiri.core.create_element("a",{'key':title,'onClick':((function (i__135102,G__135108,G__135108__$1,vec__135104,idx,map__135107,map__135107__$1,item,title,icon,href,on_click,c__5478__auto__,size__5479__auto__,b__135103,s__135101__$2,temp__5804__auto__){
return (function (){
if(cljs.core.fn_QMARK_(on_click)){
(on_click.cljs$core$IFn$_invoke$arity$0 ? on_click.cljs$core$IFn$_invoke$arity$0() : on_click.call(null));
} else {
if(typeof href === 'string'){
frontend.util.open_url(href);
} else {
}
}

return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612),false);
});})(i__135102,G__135108,G__135108__$1,vec__135104,idx,map__135107,map__135107__$1,item,title,icon,href,on_click,c__5478__auto__,size__5479__auto__,b__135103,s__135101__$2,temp__5804__auto__))
,'className':"it flex items-center px-4 py-1 select-none"},[(function (){var attrs135109 = frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs135109))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","pr-2","opacity-40"], null)], null),attrs135109], 0))):{'className':"flex items-center pr-2 opacity-40"}),((cljs.core.map_QMARK_(attrs135109))?null:[daiquiri.interpreter.interpret(attrs135109)]));
})(),(function (){var attrs135110 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs135110))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-normal"], null)], null),attrs135110], 0))):{'className':"font-normal"}),((cljs.core.map_QMARK_(attrs135110))?null:[daiquiri.interpreter.interpret(attrs135110)]));
})()]);

}
})());

var G__135187 = (i__135102 + (1));
i__135102 = G__135187;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__135103),frontend$components$container$iter__135100(cljs.core.chunk_rest(s__135101__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__135103),null);
}
} else {
var vec__135111 = cljs.core.first(s__135101__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135111,(0),null);
var map__135114 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135111,(1),null);
var map__135114__$1 = cljs.core.__destructure_map(map__135114);
var item = map__135114__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135114__$1,new cljs.core.Keyword(null,"title","title",636505583));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135114__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135114__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135114__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
return cljs.core.cons((function (){var G__135115 = item;
var G__135115__$1 = (((G__135115 instanceof cljs.core.Keyword))?G__135115.fqn:null);
switch (G__135115__$1) {
case "hr":
return daiquiri.core.create_element("hr",{'key':idx,'className':"my-2"},[]);

break;
default:
return daiquiri.core.create_element("a",{'key':title,'onClick':((function (G__135115,G__135115__$1,vec__135111,idx,map__135114,map__135114__$1,item,title,icon,href,on_click,s__135101__$2,temp__5804__auto__){
return (function (){
if(cljs.core.fn_QMARK_(on_click)){
(on_click.cljs$core$IFn$_invoke$arity$0 ? on_click.cljs$core$IFn$_invoke$arity$0() : on_click.call(null));
} else {
if(typeof href === 'string'){
frontend.util.open_url(href);
} else {
}
}

return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612),false);
});})(G__135115,G__135115__$1,vec__135111,idx,map__135114,map__135114__$1,item,title,icon,href,on_click,s__135101__$2,temp__5804__auto__))
,'className':"it flex items-center px-4 py-1 select-none"},[(function (){var attrs135109 = frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs135109))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","pr-2","opacity-40"], null)], null),attrs135109], 0))):{'className':"flex items-center pr-2 opacity-40"}),((cljs.core.map_QMARK_(attrs135109))?null:[daiquiri.interpreter.interpret(attrs135109)]));
})(),(function (){var attrs135110 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs135110))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-normal"], null)], null),attrs135110], 0))):{'className':"font-normal"}),((cljs.core.map_QMARK_(attrs135110))?null:[daiquiri.interpreter.interpret(attrs135110)]));
})()]);

}
})(),frontend$components$container$iter__135100(cljs.core.rest(s__135101__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(frontend.components.container.help_menu_items));
})())]),daiquiri.core.create_element("div",{'className':"ft pl-11 pb-3"},[daiquiri.core.create_element("span",{'className':"opacity text-xs opacity-30"},["Logseq ",frontend.version.version])])]);
}),null,"frontend.components.container/help-menu-popup");
frontend.components.container.help_button = rum.core.lazy_build(rum.core.build_defc,(function (){
var help_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612));
var handbooks_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));
return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"cp__sidebar-help-btn"},[daiquiri.core.create_element("div",{'title':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"help-shortcut-title","help-shortcut-title",-410057505)], 0)),'onClick':(function (){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612));
}),'className':"inner"},[daiquiri.core.create_element("svg",{'stroke':"currentColor",'fill':"none",'width':"24",'xmlns':"http://www.w3.org/2000/svg",'className':"scale-125 icon icon-tabler icon-tabler-help-small",'strokeWidth':"2",'strokeLinejoin':"round",'viewBox':"0 0 24 24",'strokeLinecap':"round",'height':"24"},[daiquiri.core.create_element("path",{'stroke':"none",'d':"M0 0h24v24H0z",'fill':"none"},null),daiquiri.core.create_element("path",{'d':"M12 16v.01"},null),daiquiri.core.create_element("path",{'d':"M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483"},null)])])]),(cljs.core.truth_(help_open_QMARK_)?frontend.components.container.help_menu_popup():null),(cljs.core.truth_(handbooks_open_QMARK_)?frontend.components.handbooks.handbooks_popup():null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.container/help-button");
frontend.components.container.app_context_menu_observer = rum.core.lazy_build(rum.core.build_defc,(function (){
return null;
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.listen(state,window,"contextmenu",(function (e){
var target = frontend.components.container.goog$module$goog$object.get(e,"target");
var block_el = target.closest(".bullet-container[blockid]");
var block_id = (function (){var G__135120 = block_el;
if((G__135120 == null)){
return null;
} else {
return G__135120.getAttribute("blockid");
}
})();
var map__135118 = frontend.state.sub(new cljs.core.Keyword("block-ref","context","block-ref/context",-2102048446));
var map__135118__$1 = cljs.core.__destructure_map(map__135118);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135118__$1,new cljs.core.Keyword(null,"block","block",664686210));
var block_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135118__$1,new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
var map__135119 = frontend.state.sub(new cljs.core.Keyword("page-title","context","page-title/context",1788836745));
var map__135119__$1 = cljs.core.__destructure_map(map__135119);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135119__$1,new cljs.core.Keyword(null,"page","page",849072397));
var page_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135119__$1,new cljs.core.Keyword(null,"page-entity","page-entity",1168837897));
var show_BANG_ = (function() { 
var G__135189__delegate = function (content,p__135121){
var map__135122 = p__135121;
var map__135122__$1 = cljs.core.__destructure_map(map__135122);
var option = map__135122__$1;
var G__135123 = e;
var G__135124 = (function (p__135126){
var map__135127 = p__135126;
var map__135127__$1 = cljs.core.__destructure_map(map__135127);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135127__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}),new cljs.core.Keyword(null,"data-keep-selection","data-keep-selection",-2035432191),true], null),content], null);
});
var G__135125 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747),frontend.state.dom_clear_selection_BANG_,new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),frontend.state.state_clear_selection_BANG_,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-[280px] ls-context-menu-content"], null),new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null),option], 0));
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__135123,G__135124,G__135125) : logseq.shui.ui.popup_show_BANG_.call(null,G__135123,G__135124,G__135125));
};
var G__135189 = function (content,var_args){
var p__135121 = null;
if (arguments.length > 1) {
var G__135190__i = 0, G__135190__a = new Array(arguments.length -  1);
while (G__135190__i < G__135190__a.length) {G__135190__a[G__135190__i] = arguments[G__135190__i + 1]; ++G__135190__i;}
  p__135121 = new cljs.core.IndexedSeq(G__135190__a,0,null);
} 
return G__135189__delegate.call(this,content,p__135121);};
G__135189.cljs$lang$maxFixedArity = 1;
G__135189.cljs$lang$applyTo = (function (arglist__135191){
var content = cljs.core.first(arglist__135191);
var p__135121 = cljs.core.rest(arglist__135191);
return G__135189__delegate(content,p__135121);
});
G__135189.cljs$core$IFn$_invoke$arity$variadic = G__135189__delegate;
return G__135189;
})()
;
var handled = (cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(block_id);
} else {
return and__5000__auto__;
}
})())?(function (){
show_BANG_(frontend.components.content.page_title_custom_context_menu_content(page_entity));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("page-title","context","page-title/context",1788836745),null);
})()
:(cljs.core.truth_(block_ref)?(function (){
show_BANG_(frontend.components.content.block_ref_custom_context_menu_content(block,block_ref));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("block-ref","context","block-ref/context",-2102048446),null);
})()
:((((frontend.state.selection_QMARK_()) && ((!(dommy.core.has_class_QMARK_(target,"bullet"))))))?show_BANG_(frontend.components.content.custom_context_menu_content(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"blocks-selection-context-menu","blocks-selection-context-menu",695587257)], null)):(cljs.core.truth_((function (){var and__5000__auto__ = block_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.parse_uuid(block_id);
} else {
return and__5000__auto__;
}
})())?(function (){var block__$1 = target.closest(".ls-block");
var property_default_value_QMARK_ = (cljs.core.truth_(block__$1)?cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(block__$1,"data-is-property-default-value")):null);
if(cljs.core.truth_(block__$1)){
frontend.state.clear_selection_BANG_();

frontend.state.conj_selection_block_BANG_(block__$1,new cljs.core.Keyword(null,"down","down",1565245570));
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),cljs.core.uuid(block_id),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0))),(function (___41611__auto__){
return promesa.protocols._promise(show_BANG_(frontend.components.content.block_context_menu_content(target,cljs.core.uuid(block_id),property_default_value_QMARK_)));
}));
}));
})():false
))));
if((!(handled === false))){
return frontend.util.stop(e);
} else {
return null;
}
}));
}))], null),"frontend.components.container/app-context-menu-observer");
frontend.components.container.on_mouse_up = (function frontend$components$container$on_mouse_up(e){
if(cljs.core.truth_((function (){var or__5002__auto__ = e.target.closest(".block-control-wrap");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = e.target.closest("button");
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = e.target.closest("input");
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = e.target.closest("textarea");
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return e.target.closest("a");
}
}
}
}
})())){
return null;
} else {
return frontend.handler.editor.show_action_bar_BANG_();
}
});
frontend.components.container.root_container = rum.core.lazy_build(rum.core.build_defcs,(function (state,route_match,main_content_SINGLEQUOTE_){
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var theme = frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var accent_color = (function (){var G__135128 = frontend.state.sub(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984));
if((G__135128 == null)){
return null;
} else {
return cljs.core.name(G__135128);
}
})();
var editor_font = (function (){var G__135129 = frontend.state.sub(new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775));
if((G__135129 == null)){
return null;
} else {
return cljs.core.name(G__135129);
}
})();
var system_theme_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822));
var light_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("light",frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132)));
var sidebar_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887));
var settings_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","settings-open?","ui/settings-open?",1491870343));
var left_sidebar_open_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728));
var wide_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061));
var ls_block_hl_colored_QMARK_ = frontend.state.sub(new cljs.core.Keyword("pdf","block-highlight-colored?","pdf/block-highlight-colored?",1763046626));
var onboarding_state = frontend.state.sub(new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833));
var right_sidebar_blocks = frontend.state.sub_right_sidebar_blocks();
var route_name = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var margin_less_pages_QMARK_ = (function (){var or__5002__auto__ = cljs.core.boolean$((function (){var fexpr__135130 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph","graph",1558099509),null], null), null);
return (fexpr__135130.cljs$core$IFn$_invoke$arity$1 ? fexpr__135130.cljs$core$IFn$_invoke$arity$1(route_name) : fexpr__135130.call(null,route_name));
})());
if(or__5002__auto__){
return or__5002__auto__;
} else {
return frontend.db.model.whiteboard_page_QMARK_(frontend.state.get_current_page());
}
})();
var db_restoring_QMARK_ = frontend.state.sub(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233));
var indexeddb_support_QMARK_ = frontend.state.sub(new cljs.core.Keyword("indexeddb","support?","indexeddb/support?",114020185));
var page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),route_name);
var home_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"home","home",-74557309),route_name);
var native_titlebar_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("window","native-titlebar?","window/native-titlebar?",195665142)], null));
var window_controls_QMARK_ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(frontend.util.mac_QMARK_)) && (cljs.core.not(native_titlebar_QMARK_)));
} else {
return and__5000__auto__;
}
})();
var edit_QMARK_ = frontend.state.editing_QMARK_();
var default_home = frontend.components.container.get_default_home_if_valid();
var logged_QMARK_ = frontend.handler.user.logged_in_QMARK_();
var fold_button_on_right_QMARK_ = frontend.state.enable_fold_button_right_QMARK_();
var show_action_bar_QMARK_ = frontend.state.sub(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440));
var show_recording_bar_QMARK_ = frontend.state.sub(new cljs.core.Keyword("mobile","show-recording-bar?","mobile/show-recording-bar?",-758548785));
var preferred_language = frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017)], null));
return frontend.components.theme.container(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"onboarding-state","onboarding-state",2059697923),new cljs.core.Keyword(null,"current-repo","current-repo",134812359),new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664),new cljs.core.Keyword(null,"sidebar-blocks-len","sidebar-blocks-len",235708585),new cljs.core.Keyword(null,"accent-color","accent-color",908336425),new cljs.core.Keyword(null,"editor-font","editor-font",582015595),new cljs.core.Keyword(null,"route","route",329891309),new cljs.core.Keyword(null,"on-click","on-click",1632826543),new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"edit?","edit?",-842131310),new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017),new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"system-theme?","system-theme?",1330394234),new cljs.core.Keyword(null,"settings-open?","settings-open?",1491874651),new cljs.core.Keyword(null,"sidebar-open?","sidebar-open?",-1099774467)],[onboarding_state,current_repo,db_restoring_QMARK_,cljs.core.count(right_sidebar_blocks),accent_color,editor_font,route_match,(function (e){
frontend.handler.editor.unhighlight_blocks_BANG_();

return frontend.util.fix_open_external_with_shift_BANG_(e);
}),theme,edit_QMARK_,preferred_language,frontend.context.i18n.t,system_theme_QMARK_,settings_open_QMARK_,sidebar_open_QMARK_]),new cljs.core.PersistentVector(null, 24, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"main.theme-container-inner#app-container-wrapper","main.theme-container-inner#app-container-wrapper",-537901372),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"ls-left-sidebar-open","ls-left-sidebar-open",-1583098913),left_sidebar_open_QMARK_,new cljs.core.Keyword(null,"ls-right-sidebar-open","ls-right-sidebar-open",2065397740),sidebar_open_QMARK_,new cljs.core.Keyword(null,"ls-wide-mode","ls-wide-mode",1888272579),wide_mode_QMARK_,new cljs.core.Keyword(null,"ls-window-controls","ls-window-controls",17376007),window_controls_QMARK_,new cljs.core.Keyword(null,"ls-fold-button-on-right","ls-fold-button-on-right",-1787568911),fold_button_on_right_QMARK_,new cljs.core.Keyword(null,"ls-hl-colored","ls-hl-colored",1822824926),ls_block_hl_colored_QMARK_], null)], null)),new cljs.core.Keyword(null,"on-pointer-up","on-pointer-up",385194000),(function (){
var temp__5804__auto__ = goog.dom.getElement("app-container-wrapper");
if(cljs.core.truth_(temp__5804__auto__)){
var container = temp__5804__auto__;
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container,"blocks-selection-mode");

if((cljs.core.count(frontend.state.get_selection_blocks()) > (1))){
return (frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.util.clear_selection_BANG_.call(null));
} else {
return null;
}
} else {
return null;
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button#skip-to-main","button#skip-to-main",-1395479666),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.ui.focus_element(frontend.ui.main_node());
}),new cljs.core.Keyword(null,"on-key-up","on-key-up",884441808),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",e.key)){
return frontend.ui.focus_element(frontend.ui.main_node());
} else {
return null;
}
})], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("accessibility","skip-to-main-content","accessibility/skip-to-main-content",-1231891104)], 0))], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.#app-container","div.#app-container",-2087174968),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-mouse-up","on-mouse-up",-1340533320),frontend.components.container.on_mouse_up], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div#left-container","div#left-container",1782073488),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887)))?"overflow-hidden":"w-full")], null),frontend.components.header.header(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"light?","light?",1454164744),light_QMARK_,new cljs.core.Keyword(null,"current-repo","current-repo",134812359),current_repo,new cljs.core.Keyword(null,"logged?","logged?",-814149905),logged_QMARK_,new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_,new cljs.core.Keyword(null,"route-match","route-match",-1450985937),route_match,new cljs.core.Keyword(null,"default-home","default-home",171104159),default_home,new cljs.core.Keyword(null,"new-block-mode","new-block-mode",1189333509),frontend.components.container.new_block_mode], null)),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.find_in_page.search():null),frontend.components.container.main(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"show-recording-bar?","show-recording-bar?",-1835604479),new cljs.core.Keyword(null,"margin-less-pages?","margin-less-pages?",-1770705087),new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664),new cljs.core.Keyword(null,"light?","light?",1454164744),new cljs.core.Keyword(null,"main-content","main-content",1386726798),new cljs.core.Keyword(null,"show-action-bar?","show-action-bar?",1936923598),new cljs.core.Keyword(null,"route-match","route-match",-1450985937),new cljs.core.Keyword(null,"logged?","logged?",-814149905),new cljs.core.Keyword(null,"indexeddb-support?","indexeddb-support?",-1571226476),new cljs.core.Keyword(null,"home?","home?",806196596),new cljs.core.Keyword(null,"route-name","route-name",-932603717)],[show_recording_bar_QMARK_,margin_less_pages_QMARK_,db_restoring_QMARK_,light_QMARK_,main_content_SINGLEQUOTE_,show_action_bar_QMARK_,route_match,logged_QMARK_,indexeddb_support_QMARK_,home_QMARK_,route_name]))], null),(cljs.core.truth_(window_controls_QMARK_)?frontend.components.window_controls.container():null),frontend.components.right_sidebar.sidebar(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div#app-single-container","div#app-single-container",-126204141)], null)], null),frontend.ui.notification(),logseq.shui.toaster.core.install_toaster(),logseq.shui.dialog.core.install_modals(),logseq.shui.popup.core.install_popups(),frontend.components.container.custom_context_menu(),frontend.components.plugins.custom_js_installer(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"t","t",-1397832519),frontend.context.i18n.t,new cljs.core.Keyword(null,"current-repo","current-repo",134812359),current_repo,new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664),db_restoring_QMARK_], null)),frontend.components.container.app_context_menu_observer(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download.hidden","a#download.hidden",2057981313)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-edn-v2.hidden","a#download-as-edn-v2.hidden",35025946)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-json-v2.hidden","a#download-as-json-v2.hidden",-1429454050)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-transit-debug.hidden","a#download-as-transit-debug.hidden",-1127249060)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-sqlite-db.hidden","a#download-as-sqlite-db.hidden",1318065699)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-db-edn.hidden","a#download-as-db-edn.hidden",-215919181)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-roam-json.hidden","a#download-as-roam-json.hidden",1957328973)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-html.hidden","a#download-as-html.hidden",-1218412359)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#download-as-zip.hidden","a#download-as-zip.hidden",-1589405338)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#export-as-markdown.hidden","a#export-as-markdown.hidden",-1156151275)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#export-as-opml.hidden","a#export-as-opml.hidden",679727892)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a#convert-markdown-to-unordered-list-or-heading.hidden","a#convert-markdown-to-unordered-list-or-heading.hidden",196834605)], null),((((cljs.core.not(frontend.config.mobile_QMARK_)) && ((!(frontend.config.publishing_QMARK_)))))?frontend.components.container.help_button():null)], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
frontend.mixins.listen(state,window,"pointerdown",frontend.components.container.hide_context_menu_and_clear_selection);

frontend.mixins.listen(state,window,"keydown",(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((27),e.keyCode)){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.modal_opened_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return (!(((frontend.util.node_test_QMARK_) && (frontend.state.editing_QMARK_()))));
} else {
return and__5000__auto__;
}
})())){
frontend.state.close_modal_BANG_();
} else {
frontend.components.container.hide_context_menu_and_clear_selection.cljs$core$IFn$_invoke$arity$variadic(e,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"esc?","esc?",926265416),true], null)], 0));
}
} else {
}

return frontend.state.set_ui_last_key_code_BANG_(e.key);
}));

return frontend.mixins.listen(state,window,"keyup",(function (_e){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","latest-shortcut","editor/latest-shortcut",-2095243213),null);
}));
}))], null),"frontend.components.container/root-container");

//# sourceMappingURL=frontend.components.container.js.map
