goog.provide('frontend.components.selection');
frontend.components.selection.action_bar = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__114914__delegate = function (p__114832){
var map__114833 = p__114832;
var map__114833__$1 = cljs.core.__destructure_map(map__114833);
var on_cut = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__114833__$1,new cljs.core.Keyword(null,"on-cut","on-cut",-1019124687),(function (){
return frontend.handler.editor.cut_selection_blocks(true);
}));
var on_copy = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114833__$1,new cljs.core.Keyword(null,"on-copy","on-copy",-227435882));
var selected_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114833__$1,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948));
var hide_dots_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114833__$1,new cljs.core.Keyword(null,"hide-dots?","hide-dots?",-901521952));
var button_border_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114833__$1,new cljs.core.Keyword(null,"button-border?","button-border?",-2028710343));
var selected_blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
if(typeof block === 'number'){
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(block) : frontend.db.entity.call(null,block));
} else {
return block;
}
}),selected_blocks);
var on_copy__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = selected_blocks__$1;
if(cljs.core.truth_(and__5000__auto__)){
return (on_copy == null);
} else {
return and__5000__auto__;
}
})())?(function (){
return frontend.handler.editor.copy_selection_blocks.cljs$core$IFn$_invoke$arity$variadic(true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_blocks__$1], null)], 0));
}):(function (){var or__5002__auto__ = on_copy;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (){
return frontend.handler.editor.copy_selection_blocks(true);
});
}
})());
var button_opts = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),["p-2 text-xs h-8",(cljs.core.truth_(button_border_QMARK_)?null:" !border-b-0")].join('')], null);
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var attrs114831 = (function (){var G__114840 = (cljs.core.truth_(db_graph_QMARK_)?(function (){var G__114846 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"target","target",253001721),e.target,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_blocks__$1,new cljs.core.Keyword(null,"property-key","property-key",972402246),"Tags",new cljs.core.Keyword(null,"on-dialog-close","on-dialog-close",-900873769),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
})], null)], null));
}));
var G__114847 = frontend.ui.tooltip(frontend.ui.icon("hash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null)),"Set tag",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex"], null)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114846,G__114847) : logseq.shui.ui.button.call(null,G__114846,G__114847));
})():null);
var G__114841 = (function (){var G__114850 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

(on_copy__$1.cljs$core$IFn$_invoke$arity$0 ? on_copy__$1.cljs$core$IFn$_invoke$arity$0() : on_copy__$1.call(null));

frontend.state.clear_selection_BANG_();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
}));
var G__114851 = "Copy";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114850,G__114851) : logseq.shui.ui.button.call(null,G__114850,G__114851));
})();
var G__114842 = (cljs.core.truth_(db_graph_QMARK_)?(function (){var G__114852 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"target","target",253001721),e.target,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_blocks__$1,new cljs.core.Keyword(null,"on-dialog-close","on-dialog-close",-900873769),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
})], null)], null));
}));
var G__114853 = "Set property";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114852,G__114853) : logseq.shui.ui.button.call(null,G__114852,G__114853));
})():null);
var G__114843 = (cljs.core.truth_(db_graph_QMARK_)?(function (){var G__114854 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"target","target",253001721),e.target,new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_blocks__$1,new cljs.core.Keyword(null,"remove-property?","remove-property?",-521702287),true,new cljs.core.Keyword(null,"select-opts","select-opts",855704004),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),false], null),new cljs.core.Keyword(null,"on-dialog-close","on-dialog-close",-900873769),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
})], null)], null));
}));
var G__114855 = "Unset property";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114854,G__114855) : logseq.shui.ui.button.call(null,G__114854,G__114855));
})():null);
var G__114844 = (function (){var G__114889 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

(on_cut.cljs$core$IFn$_invoke$arity$0 ? on_cut.cljs$core$IFn$_invoke$arity$0() : on_cut.call(null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","hide-action-bar","editor/hide-action-bar",-1927566378)], null));
}));
var G__114890 = frontend.ui.icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114889,G__114890) : logseq.shui.ui.button.call(null,G__114889,G__114890));
})();
var G__114845 = (cljs.core.truth_(hide_dots_QMARK_)?null:(function (){var G__114894 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(button_opts,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var G__114896 = e;
var G__114897 = (function (p__114899){
var map__114901 = p__114899;
var map__114901__$1 = cljs.core.__destructure_map(map__114901);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114901__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}),new cljs.core.Keyword(null,"data-keep-selection","data-keep-selection",-2035432191),true], null),(function (){var fexpr__114904 = frontend.state.get_component(new cljs.core.Keyword("selection","context-menu","selection/context-menu",1845974273));
return (fexpr__114904.cljs$core$IFn$_invoke$arity$0 ? fexpr__114904.cljs$core$IFn$_invoke$arity$0() : fexpr__114904.call(null));
})()], null);
});
var G__114898 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-[280px] ls-context-menu-content"], null),new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__114896,G__114897,G__114898) : logseq.shui.ui.popup_show_BANG_.call(null,G__114896,G__114897,G__114898));
}));
var G__114895 = frontend.ui.icon("dots",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__114894,G__114895) : logseq.shui.ui.button.call(null,G__114894,G__114895));
})());
return (logseq.shui.ui.button_group.cljs$core$IFn$_invoke$arity$6 ? logseq.shui.ui.button_group.cljs$core$IFn$_invoke$arity$6(G__114840,G__114841,G__114842,G__114843,G__114844,G__114845) : logseq.shui.ui.button_group.call(null,G__114840,G__114841,G__114842,G__114843,G__114844,G__114845));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs114831))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["selection-action-bar"], null)], null),attrs114831], 0))):{'className':"selection-action-bar"}),((cljs.core.map_QMARK_(attrs114831))?null:[daiquiri.interpreter.interpret(attrs114831)]));
};
var G__114914 = function (var_args){
var p__114832 = null;
if (arguments.length > 0) {
var G__114959__i = 0, G__114959__a = new Array(arguments.length -  0);
while (G__114959__i < G__114959__a.length) {G__114959__a[G__114959__i] = arguments[G__114959__i + 0]; ++G__114959__i;}
  p__114832 = new cljs.core.IndexedSeq(G__114959__a,0,null);
} 
return G__114914__delegate.call(this,p__114832);};
G__114914.cljs$lang$maxFixedArity = 0;
G__114914.cljs$lang$applyTo = (function (arglist__114961){
var p__114832 = cljs.core.seq(arglist__114961);
return G__114914__delegate(p__114832);
});
G__114914.cljs$core$IFn$_invoke$arity$variadic = G__114914__delegate;
return G__114914;
})()
,null,"frontend.components.selection/action-bar");

//# sourceMappingURL=frontend.components.selection.js.map
