goog.provide('frontend.components.filepicker');
frontend.components.filepicker.picker = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__86723){
var map__86725 = p__86723;
var map__86725__$1 = cljs.core.__destructure_map(map__86725);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__86725__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
if(cljs.core.fn_QMARK_(on_change)){
} else {
throw (new Error("Assert failed: (fn? on-change)"));
}

var _STAR_input = new cljs.core.Keyword("frontend.components.filepicker","input","frontend.components.filepicker/input",-1861559425).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",{'id':"filepicker",'onClick':(function (){
return cljs.core.deref(_STAR_input).click();
}),'className':"border border-dashed"},[daiquiri.core.create_element("div",{'className':"relative flex flex-col gap-6 overflow-hidden"},[daiquiri.core.create_element("div",{'tabIndex':(0),'className':"group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"},[daiquiri.core.create_element("input",{'ref':(function (p1__86717_SHARP_){
return cljs.core.reset_BANG_(_STAR_input,p1__86717_SHARP_);
}),'tabIndex':(-1),'multiple':true,'type':"file",'onChange':rum.core.mark_sync_update((function (e){
var files = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(e.target.files);
return (on_change.cljs$core$IFn$_invoke$arity$2 ? on_change.cljs$core$IFn$_invoke$arity$2(e,files) : on_change.call(null,e,files));
})),'className':"hidden"},[]),daiquiri.core.create_element("div",{'className':"flex flex-col items-center justify-center gap-4 sm:px-5"},[daiquiri.core.create_element("div",{'className':"rounded-full border border-dashed p-3"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("upload",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"!block text-muted-foreground",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(28),new cljs.core.Keyword(null,"height","height",1025178622),(28)], null)], null)))]),daiquiri.core.create_element("div",{'className':"flex flex-col gap-px"},[daiquiri.core.create_element("div",{'className':"font-medium text-muted-foreground"},["Drag 'n' drop files here, or click to select files"])])])])])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.filepicker","input","frontend.components.filepicker/input",-1861559425)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var on_change_86823 = new cljs.core.Keyword(null,"on-change","on-change",-732046149).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
var temp__5804__auto___86824 = goog.dom.getElement("filepicker");
if(cljs.core.truth_(temp__5804__auto___86824)){
var element_86825 = temp__5804__auto___86824;
cljs_drag_n_drop.core.subscribe_BANG_(element_86825,new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"drop","drop",364481611),(function (e,files){
return (on_change_86823.cljs$core$IFn$_invoke$arity$2 ? on_change_86823.cljs$core$IFn$_invoke$arity$2(e,files) : on_change_86823.call(null,e,files));
})], null));
} else {
}

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___86829 = goog.dom.getElement("filepicker");
if(cljs.core.truth_(temp__5804__auto___86829)){
var el_86830 = temp__5804__auto___86829;
cljs_drag_n_drop.core.unsubscribe_BANG_(el_86830,new cljs.core.Keyword(null,"upload-files","upload-files",-771877630));
} else {
}

return state;
})], null)], null),"frontend.components.filepicker/picker");

//# sourceMappingURL=frontend.components.filepicker.js.map
