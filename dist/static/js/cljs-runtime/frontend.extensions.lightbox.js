goog.provide('frontend.extensions.lightbox');
frontend.extensions.lightbox.preview_images_BANG_ = (function frontend$extensions$lightbox$preview_images_BANG_(images){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.js_load$([frontend.util.JS_ROOT,"/photoswipe.umd.min.js"].join(''))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.js_load$([frontend.util.JS_ROOT,"/photoswipe-lightbox.umd.min.js"].join(''))),(function (___$1){
return promesa.protocols._promise((function (){var options = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"dataSource","dataSource",-178401132),images,new cljs.core.Keyword(null,"pswpModule","pswpModule",1055928079),window.PhotoSwipe,new cljs.core.Keyword(null,"showHideAnimationType","showHideAnimationType",-1813136721),"fade"], null);
var lightbox = (new window.PhotoSwipeLightbox(cljs_bean.core.__GT_js(options)));
var G__117573 = lightbox;
G__117573.init();

G__117573.loadAndOpen((0));

return G__117573;
})());
}));
}));
}));
});

//# sourceMappingURL=frontend.extensions.lightbox.js.map
