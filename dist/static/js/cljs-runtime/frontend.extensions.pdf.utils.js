goog.provide('frontend.extensions.pdf.utils');
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.pdf !== 'undefined') && (typeof frontend.extensions.pdf.utils !== 'undefined') && (typeof frontend.extensions.pdf.utils.MAX_SCALE !== 'undefined')){
} else {
frontend.extensions.pdf.utils.MAX_SCALE = 5.0;
}
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.pdf !== 'undefined') && (typeof frontend.extensions.pdf.utils !== 'undefined') && (typeof frontend.extensions.pdf.utils.MIN_SCALE !== 'undefined')){
} else {
frontend.extensions.pdf.utils.MIN_SCALE = 0.25;
}
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.pdf !== 'undefined') && (typeof frontend.extensions.pdf.utils !== 'undefined') && (typeof frontend.extensions.pdf.utils.DELTA_SCALE !== 'undefined')){
} else {
frontend.extensions.pdf.utils.DELTA_SCALE = 1.05;
}
frontend.extensions.pdf.utils.hls_file_QMARK_ = (function frontend$extensions$pdf$utils$hls_file_QMARK_(filename){
var and__5000__auto__ = filename;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof filename === 'string') && (clojure.string.starts_with_QMARK_(filename,"hls__")));
} else {
return and__5000__auto__;
}
});
frontend.extensions.pdf.utils.get_bounding_rect = (function frontend$extensions$pdf$utils$get_bounding_rect(rects){
return cljs_bean.core.__GT_clj(module$frontend$extensions$pdf$utils.getBoundingRect(cljs_bean.core.__GT_js(rects)));
});
frontend.extensions.pdf.utils.viewport_to_scaled = (function frontend$extensions$pdf$utils$viewport_to_scaled(bounding,viewport){
return cljs_bean.core.__GT_clj(module$frontend$extensions$pdf$utils.viewportToScaled(cljs_bean.core.__GT_js(bounding),viewport));
});
frontend.extensions.pdf.utils.scaled_to_viewport = (function frontend$extensions$pdf$utils$scaled_to_viewport(bounding,viewport){
return cljs_bean.core.__GT_clj(module$frontend$extensions$pdf$utils.scaledToViewport(cljs_bean.core.__GT_js(bounding),viewport));
});
frontend.extensions.pdf.utils.optimize_client_reacts = (function frontend$extensions$pdf$utils$optimize_client_reacts(rects){
if(cljs.core.seq(rects)){
return cljs_bean.core.__GT_clj(module$frontend$extensions$pdf$utils.optimizeClientRects(cljs_bean.core.__GT_js(rects)));
} else {
return null;
}
});
frontend.extensions.pdf.utils.vw_to_scaled_pos = (function frontend$extensions$pdf$utils$vw_to_scaled_pos(viewer,p__102233){
var map__102234 = p__102233;
var map__102234__$1 = cljs.core.__destructure_map(map__102234);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102234__$1,new cljs.core.Keyword(null,"page","page",849072397));
var bounding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102234__$1,new cljs.core.Keyword(null,"bounding","bounding",-2125178263));
var rects = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102234__$1,new cljs.core.Keyword(null,"rects","rects",1714526167));
var temp__5804__auto__ = viewer.getPageView((page - (1))).viewport;
if(cljs.core.truth_(temp__5804__auto__)){
var viewport = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),frontend.extensions.pdf.utils.viewport_to_scaled(bounding,viewport),new cljs.core.Keyword(null,"rects","rects",1714526167),(function (){var iter__5480__auto__ = (function frontend$extensions$pdf$utils$vw_to_scaled_pos_$_iter__102237(s__102238){
return (new cljs.core.LazySeq(null,(function (){
var s__102238__$1 = s__102238;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__102238__$1);
if(temp__5804__auto____$1){
var s__102238__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__102238__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__102238__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__102240 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__102239 = (0);
while(true){
if((i__102239 < size__5479__auto__)){
var rect = cljs.core._nth(c__5478__auto__,i__102239);
cljs.core.chunk_append(b__102240,frontend.extensions.pdf.utils.viewport_to_scaled(rect,viewport));

var G__102305 = (i__102239 + (1));
i__102239 = G__102305;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__102240),frontend$extensions$pdf$utils$vw_to_scaled_pos_$_iter__102237(cljs.core.chunk_rest(s__102238__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__102240),null);
}
} else {
var rect = cljs.core.first(s__102238__$2);
return cljs.core.cons(frontend.extensions.pdf.utils.viewport_to_scaled(rect,viewport),frontend$extensions$pdf$utils$vw_to_scaled_pos_$_iter__102237(cljs.core.rest(s__102238__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(rects);
})(),new cljs.core.Keyword(null,"page","page",849072397),page], null);
} else {
return null;
}
});
frontend.extensions.pdf.utils.scaled_to_vw_pos = (function frontend$extensions$pdf$utils$scaled_to_vw_pos(viewer,p__102242){
var map__102243 = p__102242;
var map__102243__$1 = cljs.core.__destructure_map(map__102243);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102243__$1,new cljs.core.Keyword(null,"page","page",849072397));
var bounding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102243__$1,new cljs.core.Keyword(null,"bounding","bounding",-2125178263));
var rects = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102243__$1,new cljs.core.Keyword(null,"rects","rects",1714526167));
var temp__5804__auto__ = viewer.getPageView((page - (1))).viewport;
if(cljs.core.truth_(temp__5804__auto__)){
var viewport = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),frontend.extensions.pdf.utils.scaled_to_viewport(bounding,viewport),new cljs.core.Keyword(null,"rects","rects",1714526167),(function (){var iter__5480__auto__ = (function frontend$extensions$pdf$utils$scaled_to_vw_pos_$_iter__102244(s__102245){
return (new cljs.core.LazySeq(null,(function (){
var s__102245__$1 = s__102245;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__102245__$1);
if(temp__5804__auto____$1){
var s__102245__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__102245__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__102245__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__102247 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__102246 = (0);
while(true){
if((i__102246 < size__5479__auto__)){
var rect = cljs.core._nth(c__5478__auto__,i__102246);
cljs.core.chunk_append(b__102247,frontend.extensions.pdf.utils.scaled_to_viewport(rect,viewport));

var G__102310 = (i__102246 + (1));
i__102246 = G__102310;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__102247),frontend$extensions$pdf$utils$scaled_to_vw_pos_$_iter__102244(cljs.core.chunk_rest(s__102245__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__102247),null);
}
} else {
var rect = cljs.core.first(s__102245__$2);
return cljs.core.cons(frontend.extensions.pdf.utils.scaled_to_viewport(rect,viewport),frontend$extensions$pdf$utils$scaled_to_vw_pos_$_iter__102244(cljs.core.rest(s__102245__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(rects);
})(),new cljs.core.Keyword(null,"page","page",849072397),page], null);
} else {
return null;
}
});
frontend.extensions.pdf.utils.get_page_bounding = (function frontend$extensions$pdf$utils$get_page_bounding(viewer,page_number){
var temp__5804__auto__ = (function (){var and__5000__auto__ = page_number;
if(cljs.core.truth_(and__5000__auto__)){
return viewer.getPageView((page_number - (1))).div;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return cljs_bean.core.__GT_clj(el.getBoundingClientRect().toJSON());
} else {
return null;
}
});
frontend.extensions.pdf.utils.resolve_hls_layer_BANG_ = (function frontend$extensions$pdf$utils$resolve_hls_layer_BANG_(viewer,page){
var temp__5804__auto__ = viewer.getPageView((page - (1))).textLayer;
if(cljs.core.truth_(temp__5804__auto__)){
var text_layer = temp__5804__auto__;
var cnt = text_layer.div;
var cls = "extensions__pdf-hls-layer";
var doc = document;
var layer = cnt.querySelector([".",cls].join(''));
if(cljs.core.not(layer)){
var layer__$1 = doc.createElement("div");
(layer__$1.className = cls);

cnt.appendChild(layer__$1);

return layer__$1;
} else {
return layer;
}
} else {
return null;
}
});
frontend.extensions.pdf.utils.scroll_to_highlight = (function frontend$extensions$pdf$utils$scroll_to_highlight(viewer,hl){
var temp__5804__auto__ = cljs_bean.core.__GT_js(hl);
if(cljs.core.truth_(temp__5804__auto__)){
var js_hl = temp__5804__auto__;
return module$frontend$extensions$pdf$utils.scrollToHighlight(viewer,js_hl);
} else {
return null;
}
});
frontend.extensions.pdf.utils.zoom_in_viewer = (function frontend$extensions$pdf$utils$zoom_in_viewer(viewer){
var cur_scale = viewer.currentScale;
if((cur_scale < frontend.extensions.pdf.utils.MAX_SCALE)){
var new_scale = (cur_scale * frontend.extensions.pdf.utils.DELTA_SCALE).toFixed((2));
var new_scale__$1 = (Math.ceil((new_scale * (10))) / (10));
var new_scale__$2 = (function (){var x__5090__auto__ = frontend.extensions.pdf.utils.MAX_SCALE;
var y__5091__auto__ = new_scale__$1;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return (viewer.currentScale = new_scale__$2);
} else {
return null;
}
});
frontend.extensions.pdf.utils.zoom_out_viewer = (function frontend$extensions$pdf$utils$zoom_out_viewer(viewer){
var cur_scale = viewer.currentScale;
if((cur_scale > frontend.extensions.pdf.utils.MIN_SCALE)){
var new_scale = (cur_scale / frontend.extensions.pdf.utils.DELTA_SCALE).toFixed((2));
var new_scale__$1 = (Math.floor((new_scale * (10))) / (10));
var new_scale__$2 = (function (){var x__5087__auto__ = frontend.extensions.pdf.utils.MIN_SCALE;
var y__5088__auto__ = new_scale__$1;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return (viewer.currentScale = new_scale__$2);
} else {
return null;
}
});
frontend.extensions.pdf.utils.get_meta_data$ = (function frontend$extensions$pdf$utils$get_meta_data$(viewer){
var temp__5804__auto__ = (function (){var and__5000__auto__ = viewer;
if(cljs.core.truth_(and__5000__auto__)){
return viewer.pdfDocument;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var doc = temp__5804__auto__;
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(doc.getMetadata(),(function (r){
console.debug("[metadata] ",r);

var temp__5804__auto____$1 = (function (){var and__5000__auto__ = r;
if(cljs.core.truth_(and__5000__auto__)){
return r.info;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var info = temp__5804__auto____$1;
var G__102255 = cljs_bean.core.__GT_clj(info);
return (resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(G__102255) : resolve.call(null,G__102255));
} else {
return null;
}
})),(function (e){
(resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(null) : resolve.call(null,null));

return console.error(e);
}));
}));
} else {
return null;
}
});
frontend.extensions.pdf.utils.clear_all_selection = (function frontend$extensions$pdf$utils$clear_all_selection(var_args){
var G__102257 = arguments.length;
switch (G__102257) {
case 0:
return frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$1(window);
}));

(frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$1 = (function (win){
var G__102258 = win;
var G__102258__$1 = (((G__102258 == null))?null:G__102258.getSelection());
if((G__102258__$1 == null)){
return null;
} else {
return G__102258__$1.removeAllRanges();
}
}));

(frontend.extensions.pdf.utils.clear_all_selection.cljs$lang$maxFixedArity = 1);

frontend.extensions.pdf.utils.adjust_viewer_size_BANG_ = (function (){var G__102259 = (function (viewer){
return (viewer.currentScaleValue = "auto");
});
var G__102260 = (200);
return (frontend.util.debounce.cljs$core$IFn$_invoke$arity$2 ? frontend.util.debounce.cljs$core$IFn$_invoke$arity$2(G__102259,G__102260) : frontend.util.debounce.call(null,G__102259,G__102260));
})();
frontend.extensions.pdf.utils.fix_nested_js = (function frontend$extensions$pdf$utils$fix_nested_js(its){
if(cljs.core.sequential_QMARK_(its)){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__102261_SHARP_){
if(cljs.core.map_QMARK_(p1__102261_SHARP_)){
return p1__102261_SHARP_;
} else {
return cljs_bean.core.__GT_clj(p1__102261_SHARP_);
}
}),its);
} else {
return null;
}
});
frontend.extensions.pdf.utils.gen_uuid = (function frontend$extensions$pdf$utils$gen_uuid(){
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0();
});
frontend.extensions.pdf.utils.get_page_from_el = (function frontend$extensions$pdf$utils$get_page_from_el(el){
var temp__5804__auto__ = (function (){var and__5000__auto__ = el;
if(cljs.core.truth_(and__5000__auto__)){
return el.closest(".page");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page_el = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-number","page-number",556880104),page_el.dataset.pageNumber,new cljs.core.Keyword(null,"page-el","page-el",-124721580),page_el], null);
} else {
return null;
}
});
frontend.extensions.pdf.utils.get_page_from_range = (function frontend$extensions$pdf$utils$get_page_from_range(r){
var temp__5804__auto__ = (function (){var and__5000__auto__ = r;
if(cljs.core.truth_(and__5000__auto__)){
return r.startContainer.parentElement;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var parent_el = temp__5804__auto__;
return frontend.extensions.pdf.utils.get_page_from_el(parent_el);
} else {
return null;
}
});
frontend.extensions.pdf.utils.get_range_rects_LT__page_cnt = (function frontend$extensions$pdf$utils$get_range_rects_LT__page_cnt(r,page_cnt){
var rge_rects = cljs_bean.core.__GT_clj(r.getClientRects());
var cnt_offset = page_cnt.getBoundingClientRect();
if(cljs.core.seq(rge_rects)){
var rects = (function (){var iter__5480__auto__ = (function frontend$extensions$pdf$utils$get_range_rects_LT__page_cnt_$_iter__102264(s__102265){
return (new cljs.core.LazySeq(null,(function (){
var s__102265__$1 = s__102265;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__102265__$1);
if(temp__5804__auto__){
var s__102265__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__102265__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__102265__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__102267 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__102266 = (0);
while(true){
if((i__102266 < size__5479__auto__)){
var rect = cljs.core._nth(c__5478__auto__,i__102266);
if(cljs.core.truth_((function (){var and__5000__auto__ = rect;
if(cljs.core.truth_(and__5000__auto__)){
return (((!((rect.width === (0))))) && ((!((rect.height === (0))))));
} else {
return and__5000__auto__;
}
})())){
cljs.core.chunk_append(b__102267,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"top","top",-1856271961),((rect.top + page_cnt.scrollTop) - cnt_offset.top),new cljs.core.Keyword(null,"left","left",-399115937),((rect.left + page_cnt.scrollLeft) - cnt_offset.left),new cljs.core.Keyword(null,"width","width",-384071477),rect.width,new cljs.core.Keyword(null,"height","height",1025178622),rect.height], null));

var G__102319 = (i__102266 + (1));
i__102266 = G__102319;
continue;
} else {
var G__102323 = (i__102266 + (1));
i__102266 = G__102323;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__102267),frontend$extensions$pdf$utils$get_range_rects_LT__page_cnt_$_iter__102264(cljs.core.chunk_rest(s__102265__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__102267),null);
}
} else {
var rect = cljs.core.first(s__102265__$2);
if(cljs.core.truth_((function (){var and__5000__auto__ = rect;
if(cljs.core.truth_(and__5000__auto__)){
return (((!((rect.width === (0))))) && ((!((rect.height === (0))))));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"top","top",-1856271961),((rect.top + page_cnt.scrollTop) - cnt_offset.top),new cljs.core.Keyword(null,"left","left",-399115937),((rect.left + page_cnt.scrollLeft) - cnt_offset.left),new cljs.core.Keyword(null,"width","width",-384071477),rect.width,new cljs.core.Keyword(null,"height","height",1025178622),rect.height], null),frontend$extensions$pdf$utils$get_range_rects_LT__page_cnt_$_iter__102264(cljs.core.rest(s__102265__$2)));
} else {
var G__102328 = cljs.core.rest(s__102265__$2);
s__102265__$1 = G__102328;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(rge_rects);
})();
return frontend.extensions.pdf.utils.optimize_client_reacts(rects);
} else {
return null;
}
});
frontend.extensions.pdf.utils.fix_selection_text_breakline = (function frontend$extensions$pdf$utils$fix_selection_text_breakline(text){
if(clojure.string.blank_QMARK_(text)){
return null;
} else {
var sp = "|#|";
return clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(text,/[\r\n]+/,sp),["-",sp].join(''),""),/\|#\|([a-zA-Z_])/," $1"),sp,"");
}
});
frontend.extensions.pdf.utils.fix_local_asset_pagename = (function frontend$extensions$pdf$utils$fix_local_asset_pagename(filename){
if(((typeof filename === 'string') && ((!(clojure.string.blank_QMARK_(filename)))))){
var local_asset_QMARK_ = cljs.core.re_find(/[0-9]{13}_\d$/,filename);
var hls_QMARK_ = frontend.extensions.pdf.utils.hls_file_QMARK_(filename);
var len = cljs.core.count(filename);
if(cljs.core.truth_((function (){var or__5002__auto__ = local_asset_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return hls_QMARK_;
}
})())){
return clojure.string.trimr(clojure.string.replace(clojure.string.replace(clojure.string.replace(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(filename,(0),(cljs.core.truth_(local_asset_QMARK_)?(len - (15)):len)),/^hls__/,""),/__[-\d]+$/,""),"_"," "));
} else {
return filename;
}
} else {
return filename;
}
});
frontend.extensions.pdf.utils.next_page = (function frontend$extensions$pdf$utils$next_page(){
try{return cljs.core.js_invoke(window.lsActivePdfViewer,"nextPage");
}catch (e102274){var _e = e102274;
return null;
}});
frontend.extensions.pdf.utils.prev_page = (function frontend$extensions$pdf$utils$prev_page(){
try{return cljs.core.js_invoke(window.lsActivePdfViewer,"previousPage");
}catch (e102275){var _e = e102275;
return null;
}});
frontend.extensions.pdf.utils.open_finder = (function frontend$extensions$pdf$utils$open_finder(){
try{var temp__5804__auto__ = document.querySelector(".extensions__pdf-toolbar a[title=Search]");
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return el.click();
} else {
return null;
}
}catch (e102276){if((e102276 instanceof Error)){
var _e = e102276;
return null;
} else {
throw e102276;

}
}});

//# sourceMappingURL=frontend.extensions.pdf.utils.js.map
