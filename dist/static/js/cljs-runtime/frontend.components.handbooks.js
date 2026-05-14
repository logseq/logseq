goog.provide('frontend.components.handbooks');
frontend.components.handbooks.handbooks_popup = rum.core.lazy_build(rum.core.build_defc,(function (){
var popup_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(popup_ref);
if(cljs.core.truth_(temp__5804__auto__)){
var popup_el = temp__5804__auto__;
return cljs.core.comp.cljs$core$IFn$_invoke$arity$1(frontend.modules.layout.core.setup_draggable_container_BANG_(popup_el,null));
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'data-identity':"logseq-handbooks",'ref':popup_ref,'className':"cp__handbooks-popup"},[daiquiri.core.create_element("div",{'className':"cp__handbooks-content-wrap"},[frontend.extensions.handbooks.core.content()])]);
}),null,"frontend.components.handbooks/handbooks-popup");
frontend.components.handbooks.toggle_handbooks = (function frontend$components$handbooks$toggle_handbooks(){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));
});

//# sourceMappingURL=frontend.components.handbooks.js.map
