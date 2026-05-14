goog.provide('frontend.extensions.pdf.windows');
frontend.extensions.pdf.windows._STAR_active_win = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.extensions.pdf.windows._STAR_exit_pending_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
frontend.extensions.pdf.windows.resolve_styles_BANG_ = (function frontend$extensions$pdf$windows$resolve_styles_BANG_(doc){
var temp__5804__auto__ = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__117730_SHARP_){
if(cljs.core.truth_((function (){var G__117736 = p1__117730_SHARP_;
var G__117736__$1 = (((G__117736 == null))?null:G__117736.href);
if((G__117736__$1 == null)){
return null;
} else {
return G__117736__$1.endsWith("style.css");
}
})())){
return p1__117730_SHARP_.href;
} else {
return null;
}
}),cljs.core.seq(document.styleSheets));
if(cljs.core.truth_(temp__5804__auto__)){
var styles = temp__5804__auto__;
var seq__117741 = cljs.core.seq(styles);
var chunk__117742 = null;
var count__117743 = (0);
var i__117744 = (0);
while(true){
if((i__117744 < count__117743)){
var r = chunk__117742.cljs$core$IIndexed$_nth$arity$2(null,i__117744);
var link_117898 = document.createElement("link");
(link_117898.rel = "stylesheet");

(link_117898.href = r);

doc.head.appendChild(link_117898);


var G__117900 = seq__117741;
var G__117901 = chunk__117742;
var G__117902 = count__117743;
var G__117903 = (i__117744 + (1));
seq__117741 = G__117900;
chunk__117742 = G__117901;
count__117743 = G__117902;
i__117744 = G__117903;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__117741);
if(temp__5804__auto____$1){
var seq__117741__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__117741__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__117741__$1);
var G__117905 = cljs.core.chunk_rest(seq__117741__$1);
var G__117906 = c__5525__auto__;
var G__117907 = cljs.core.count(c__5525__auto__);
var G__117908 = (0);
seq__117741 = G__117905;
chunk__117742 = G__117906;
count__117743 = G__117907;
i__117744 = G__117908;
continue;
} else {
var r = cljs.core.first(seq__117741__$1);
var link_117909 = document.createElement("link");
(link_117909.rel = "stylesheet");

(link_117909.href = r);

doc.head.appendChild(link_117909);


var G__117910 = cljs.core.next(seq__117741__$1);
var G__117911 = null;
var G__117912 = (0);
var G__117913 = (0);
seq__117741 = G__117910;
chunk__117742 = G__117911;
count__117743 = G__117912;
i__117744 = G__117913;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
frontend.extensions.pdf.windows.resolve_own_document = (function frontend$extensions$pdf$windows$resolve_own_document(viewer){
var G__117769 = viewer;
var G__117769__$1 = (((G__117769 == null))?null:G__117769.viewer);
if((G__117769__$1 == null)){
return null;
} else {
return G__117769__$1.ownerDocument;
}
});
frontend.extensions.pdf.windows.resolve_own_container = (function frontend$extensions$pdf$windows$resolve_own_container(viewer){
var G__117776 = frontend.extensions.pdf.windows.resolve_own_document(viewer);
if((G__117776 == null)){
return null;
} else {
return G__117776.querySelector("body");
}
});
frontend.extensions.pdf.windows.resolve_own_window = (function frontend$extensions$pdf$windows$resolve_own_window(viewer){
var G__117779 = frontend.extensions.pdf.windows.resolve_own_document(viewer);
if((G__117779 == null)){
return null;
} else {
return G__117779.defaultView;
}
});
frontend.extensions.pdf.windows.check_viewer_in_system_win_QMARK_ = (function frontend$extensions$pdf$windows$check_viewer_in_system_win_QMARK_(viewer){
var G__117783 = viewer;
if((G__117783 == null)){
return null;
} else {
return G__117783.$inSystemWindow;
}
});
frontend.extensions.pdf.windows.resolve_classes_BANG_ = (function frontend$extensions$pdf$windows$resolve_classes_BANG_(doc){
var html = doc.documentElement;
var G__117787 = html.classList;
G__117787.add("is-system-window");

return G__117787;
});
frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_ = (function frontend$extensions$pdf$windows$close_pdf_in_new_window_BANG_(var_args){
var G__117791 = arguments.length;
switch (G__117791) {
case 0:
return frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}));

(frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (reset_current_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = reset_current_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(frontend.extensions.pdf.windows._STAR_exit_pending_QMARK_));
} else {
return and__5000__auto__;
}
})())){
frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","system-win?","pdf/system-win?",-2028066550),false);

cljs.core.reset_BANG_(frontend.extensions.pdf.windows._STAR_active_win,null);

return cljs.core.reset_BANG_(frontend.extensions.pdf.windows._STAR_exit_pending_QMARK_,false);
}));

(frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$lang$maxFixedArity = 1);

frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_ = (function frontend$extensions$pdf$windows$exit_pdf_in_system_window_BANG_(var_args){
var G__117802 = arguments.length;
switch (G__117802) {
case 0:
return frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}));

(frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (restore_QMARK_){
var temp__5804__auto__ = cljs.core.deref(frontend.extensions.pdf.windows._STAR_active_win);
if(cljs.core.truth_(temp__5804__auto__)){
var win = temp__5804__auto__;
if(cljs.core.truth_(restore_QMARK_)){
cljs.core.reset_BANG_(frontend.extensions.pdf.windows._STAR_exit_pending_QMARK_,true);
} else {
}

return win.close();
} else {
return null;
}
}));

(frontend.extensions.pdf.windows.exit_pdf_in_system_window_BANG_.cljs$lang$maxFixedArity = 1);

frontend.extensions.pdf.windows.open_pdf_in_new_window_BANG_ = (function frontend$extensions$pdf$windows$open_pdf_in_new_window_BANG_(pdf_playground,pdf_current){
if(cljs.core.truth_(pdf_current)){
var setup_win_BANG_ = (function (){
var layouts = frontend.storage.get(new cljs.core.Keyword(null,"ls-pdf-system-win-layout","ls-pdf-system-win-layout",-1686178173));
var layouts__$1 = ((((cljs.core.map_QMARK_(layouts)) && (((cljs.core.contains_QMARK_(layouts,new cljs.core.Keyword(null,"width","width",-384071477))) && (cljs.core.contains_QMARK_(layouts,new cljs.core.Keyword(null,"height","height",1025178622)))))))?cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,p__117815){
var vec__117816 = p__117815;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117816,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117816,(1),null);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(a),cljs.core.name(k),"=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),","].join('');
}),"",layouts):"width=700,height=800");
var temp__5804__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(pdf_current);
if(cljs.core.truth_(and__5000__auto__)){
return window.open("about:blank","_blank",layouts__$1);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var win = temp__5804__auto__;
var doc_117935 = win.document;
var doc_el_117936 = doc_117935.documentElement;
var base_117937 = document.createElement("base");
var main_117938 = document.createElement("main");
var theme_mode_117939 = new cljs.core.Keyword("ui","theme","ui/theme",-1247877132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
(base_117937.href = location.href);

doc_117935.head.appendChild(base_117937);

(doc_117935.title = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(pdf_current);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Logseq";
}
})());

(doc_el_117936.dataset.theme = cljs.core.str.cljs$core$IFn$_invoke$arity$1(theme_mode_117939));

(doc_el_117936.dataset.color = (function (){var or__5002__auto__ = (function (){var G__117847 = frontend.state.sub(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984));
if((G__117847 == null)){
return null;
} else {
return cljs.core.name(G__117847);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "logseq";
}
})());

frontend.extensions.pdf.windows.resolve_classes_BANG_(doc_117935);

frontend.extensions.pdf.windows.resolve_styles_BANG_(doc_117935);

doc_117935.body.appendChild(main_117938);

rum.core.mount((pdf_playground.cljs$core$IFn$_invoke$arity$1 ? pdf_playground.cljs$core$IFn$_invoke$arity$1(pdf_current) : pdf_playground.call(null,pdf_current)),main_117938);

win.addEventListener("beforeunload",(function (){
return frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$0();
}));

win.addEventListener("resize",(function (){
return frontend.storage.set(new cljs.core.Keyword(null,"ls-pdf-system-win-layout","ls-pdf-system-win-layout",-1686178173),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"height","height",1025178622),doc_el_117936.clientHeight,new cljs.core.Keyword(null,"width","width",-384071477),doc_el_117936.clientWidth,new cljs.core.Keyword(null,"x","x",2099068185),win.screenX,new cljs.core.Keyword(null,"y","y",-1757859776),win.screenY], null));
}));

cljs.core.reset_BANG_(frontend.extensions.pdf.windows._STAR_active_win,win);

frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","system-win?","pdf/system-win?",-2028066550),true);

var G__117850 = win.apis;
if((G__117850 == null)){
return null;
} else {
return G__117850.doAction(cljs_bean.core.__GT_js(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("window","open-blank-callback","window/open-blank-callback",637950248),new cljs.core.Keyword(null,"pdf","pdf",1586765132)], null)));
}
} else {
return null;
}
});
return setTimeout((function (){
var temp__5802__auto__ = cljs.core.deref(frontend.extensions.pdf.windows._STAR_active_win);
if(cljs.core.truth_(temp__5802__auto__)){
var win = temp__5802__auto__;
return win.focus();
} else {
return setup_win_BANG_();
}
}),(16));
} else {
return null;
}
});

//# sourceMappingURL=frontend.extensions.pdf.windows.js.map
