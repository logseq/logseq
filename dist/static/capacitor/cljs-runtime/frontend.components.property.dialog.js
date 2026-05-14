goog.provide('frontend.components.property.dialog');
frontend.components.property.dialog.dialog = rum.core.lazy_build(rum.core.build_defcs,(function (state,blocks,opts){
if(cljs.core.seq(blocks)){
var _STAR_property_key = new cljs.core.Keyword("frontend.components.property.dialog","property-key","frontend.components.property.dialog/property-key",759523393).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_property = new cljs.core.Keyword("frontend.components.property.dialog","property","frontend.components.property.dialog/property",-1306311517).cljs$core$IFn$_invoke$arity$1(state);
var block = cljs.core.first(blocks);
return daiquiri.core.create_element("div",{'className':"ls-property-dialog"},[frontend.components.property.property_input(block,_STAR_property_key,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"*property","*property",1796678517),_STAR_property))]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.disable_all_shortcuts,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.property.dialog","property-value","frontend.components.property.dialog/property-value",1202453256)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var opts = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var k = new cljs.core.Keyword(null,"property-key","property-key",972402246).cljs$core$IFn$_invoke$arity$1(opts);
var temp__5804__auto___91886 = new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto___91886)){
var view_selected_blocks_91887 = temp__5804__auto___91886;
frontend.state.set_state_BANG_(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027),view_selected_blocks_91887);
} else {
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.property.dialog","property-key","frontend.components.property.dialog/property-key",759523393),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(k),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.property.dialog","property","frontend.components.property.dialog/property",-1306311517),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(k)?(frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1(k) : frontend.db.get_case_page.call(null,k)):null))], 0));
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___91888 = new cljs.core.Keyword(null,"on-dialog-close","on-dialog-close",-900873769).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(temp__5804__auto___91888)){
var close_fn_91889 = temp__5804__auto___91888;
(close_fn_91889.cljs$core$IFn$_invoke$arity$0 ? close_fn_91889.cljs$core$IFn$_invoke$arity$0() : close_fn_91889.call(null));
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027),null);

return state;
})], null)], null),"frontend.components.property.dialog/dialog");

//# sourceMappingURL=frontend.components.property.dialog.js.map
