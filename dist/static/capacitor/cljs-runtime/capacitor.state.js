goog.provide('capacitor.state');
if((typeof capacitor !== 'undefined') && (typeof capacitor.state !== 'undefined') && (typeof capacitor.state._STAR_nav_root !== 'undefined')){
} else {
capacitor.state._STAR_nav_root = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
capacitor.state.use_nav_root = (function capacitor$state$use_nav_root(){
return frontend.rum.use_atom(capacitor.state._STAR_nav_root);
});
if((typeof capacitor !== 'undefined') && (typeof capacitor.state !== 'undefined') && (typeof capacitor.state._STAR_tab !== 'undefined')){
} else {
capacitor.state._STAR_tab = cljs.core.atom.cljs$core$IFn$_invoke$arity$1("home");
}
capacitor.state.set_tab_BANG_ = (function capacitor$state$set_tab_BANG_(tab){
return cljs.core.reset_BANG_(capacitor.state._STAR_tab,tab);
});
capacitor.state.use_tab = (function capacitor$state$use_tab(){
return frontend.rum.use_atom(capacitor.state._STAR_tab);
});
if((typeof capacitor !== 'undefined') && (typeof capacitor.state !== 'undefined') && (typeof capacitor.state._STAR_modal_data !== 'undefined')){
} else {
capacitor.state._STAR_modal_data = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
capacitor.state.set_modal_BANG_ = (function capacitor$state$set_modal_BANG_(data){
return cljs.core.reset_BANG_(capacitor.state._STAR_modal_data,data);
});
capacitor.state.open_block_modal_BANG_ = (function capacitor$state$open_block_modal_BANG_(block){
return capacitor.state.set_modal_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open?","open?",1238443125),true,new cljs.core.Keyword(null,"block","block",664686210),block], null));
});
if((typeof capacitor !== 'undefined') && (typeof capacitor.state !== 'undefined') && (typeof capacitor.state._STAR_popup_data !== 'undefined')){
} else {
capacitor.state._STAR_popup_data = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
capacitor.state.set_popup_BANG_ = (function capacitor$state$set_popup_BANG_(data){
return cljs.core.reset_BANG_(capacitor.state._STAR_popup_data,data);
});

//# sourceMappingURL=capacitor.state.js.map
