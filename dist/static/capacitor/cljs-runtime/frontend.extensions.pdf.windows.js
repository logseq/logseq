goog.provide('frontend.extensions.pdf.windows');
frontend.extensions.pdf.windows._STAR_active_win = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.extensions.pdf.windows._STAR_exit_pending_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
frontend.extensions.pdf.windows.resolve_styles_BANG_ = (function frontend$extensions$pdf$windows$resolve_styles_BANG_(doc){
var temp__5804__auto__ = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__71013_SHARP_){
if(cljs.core.truth_((function (){var G__71017 = p1__71013_SHARP_;
var G__71017__$1 = (((G__71017 == null))?null:G__71017.href);
if((G__71017__$1 == null)){
return null;
} else {
return G__71017__$1.endsWith("style.css");
}
})())){
return p1__71013_SHARP_.href;
} else {
return null;
}
}),cljs.core.seq(document.styleSheets));
if(cljs.core.truth_(temp__5804__auto__)){
var styles = temp__5804__auto__;
var seq__71018 = cljs.core.seq(styles);
var chunk__71019 = null;
var count__71020 = (0);
var i__71021 = (0);
while(true){
if((i__71021 < count__71020)){
var r = chunk__71019.cljs$core$IIndexed$_nth$arity$2(null,i__71021);
var link_71160 = document.createElement("link");
(link_71160.rel = "stylesheet");

(link_71160.href = r);

doc.head.appendChild(link_71160);


var G__71161 = seq__71018;
var G__71162 = chunk__71019;
var G__71163 = count__71020;
var G__71164 = (i__71021 + (1));
seq__71018 = G__71161;
chunk__71019 = G__71162;
count__71020 = G__71163;
i__71021 = G__71164;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__71018);
if(temp__5804__auto____$1){
var seq__71018__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__71018__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__71018__$1);
var G__71165 = cljs.core.chunk_rest(seq__71018__$1);
var G__71166 = c__5525__auto__;
var G__71167 = cljs.core.count(c__5525__auto__);
var G__71168 = (0);
seq__71018 = G__71165;
chunk__71019 = G__71166;
count__71020 = G__71167;
i__71021 = G__71168;
continue;
} else {
var r = cljs.core.first(seq__71018__$1);
var link_71169 = document.createElement("link");
(link_71169.rel = "stylesheet");

(link_71169.href = r);

doc.head.appendChild(link_71169);


var G__71170 = cljs.core.next(seq__71018__$1);
var G__71171 = null;
var G__71172 = (0);
var G__71173 = (0);
seq__71018 = G__71170;
chunk__71019 = G__71171;
count__71020 = G__71172;
i__71021 = G__71173;
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
var G__71065 = viewer;
var G__71065__$1 = (((G__71065 == null))?null:G__71065.viewer);
if((G__71065__$1 == null)){
return null;
} else {
return G__71065__$1.ownerDocument;
}
});
frontend.extensions.pdf.windows.resolve_own_container = (function frontend$extensions$pdf$windows$resolve_own_container(viewer){
var G__71075 = frontend.extensions.pdf.windows.resolve_own_document(viewer);
if((G__71075 == null)){
return null;
} else {
return G__71075.querySelector("body");
}
});
frontend.extensions.pdf.windows.resolve_own_window = (function frontend$extensions$pdf$windows$resolve_own_window(viewer){
var G__71081 = frontend.extensions.pdf.windows.resolve_own_document(viewer);
if((G__71081 == null)){
return null;
} else {
return G__71081.defaultView;
}
});
frontend.extensions.pdf.windows.check_viewer_in_system_win_QMARK_ = (function frontend$extensions$pdf$windows$check_viewer_in_system_win_QMARK_(viewer){
var G__71085 = viewer;
if((G__71085 == null)){
return null;
} else {
return G__71085.$inSystemWindow;
}
});
frontend.extensions.pdf.windows.resolve_classes_BANG_ = (function frontend$extensions$pdf$windows$resolve_classes_BANG_(doc){
var html = doc.documentElement;
var G__71089 = html.classList;
G__71089.add("is-system-window");

return G__71089;
});
frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_ = (function frontend$extensions$pdf$windows$close_pdf_in_new_window_BANG_(var_args){
var G__71102 = arguments.length;
switch (G__71102) {
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
var G__71133 = arguments.length;
switch (G__71133) {
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
var layouts__$1 = ((((cljs.core.map_QMARK_(layouts)) && (((cljs.core.contains_QMARK_(layouts,new cljs.core.Keyword(null,"width","width",-384071477))) && (cljs.core.contains_QMARK_(layouts,new cljs.core.Keyword(null,"height","height",1025178622)))))))?cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,p__71145){
var vec__71146 = p__71145;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71146,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71146,(1),null);
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
var doc_71177 = win.document;
var doc_el_71178 = doc_71177.documentElement;
var base_71179 = document.createElement("base");
var main_71180 = document.createElement("main");
var theme_mode_71181 = new cljs.core.Keyword("ui","theme","ui/theme",-1247877132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
(base_71179.href = location.href);

doc_71177.head.appendChild(base_71179);

(doc_71177.title = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(pdf_current);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Logseq";
}
})());

(doc_el_71178.dataset.theme = cljs.core.str.cljs$core$IFn$_invoke$arity$1(theme_mode_71181));

(doc_el_71178.dataset.color = (function (){var or__5002__auto__ = (function (){var G__71154 = frontend.state.sub(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984));
if((G__71154 == null)){
return null;
} else {
return cljs.core.name(G__71154);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "logseq";
}
})());

frontend.extensions.pdf.windows.resolve_classes_BANG_(doc_71177);

frontend.extensions.pdf.windows.resolve_styles_BANG_(doc_71177);

doc_71177.body.appendChild(main_71180);

rum.core.mount((pdf_playground.cljs$core$IFn$_invoke$arity$1 ? pdf_playground.cljs$core$IFn$_invoke$arity$1(pdf_current) : pdf_playground.call(null,pdf_current)),main_71180);

win.addEventListener("beforeunload",(function (){
return frontend.extensions.pdf.windows.close_pdf_in_new_window_BANG_.cljs$core$IFn$_invoke$arity$0();
}));

win.addEventListener("resize",(function (){
return frontend.storage.set(new cljs.core.Keyword(null,"ls-pdf-system-win-layout","ls-pdf-system-win-layout",-1686178173),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"height","height",1025178622),doc_el_71178.clientHeight,new cljs.core.Keyword(null,"width","width",-384071477),doc_el_71178.clientWidth,new cljs.core.Keyword(null,"x","x",2099068185),win.screenX,new cljs.core.Keyword(null,"y","y",-1757859776),win.screenY], null));
}));

cljs.core.reset_BANG_(frontend.extensions.pdf.windows._STAR_active_win,win);

frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","system-win?","pdf/system-win?",-2028066550),true);

var G__71155 = win.apis;
if((G__71155 == null)){
return null;
} else {
return G__71155.doAction(cljs_bean.core.__GT_js(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("window","open-blank-callback","window/open-blank-callback",637950248),new cljs.core.Keyword(null,"pdf","pdf",1586765132)], null)));
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
