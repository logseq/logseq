goog.provide('frontend.modules.layout.core');
goog.scope(function(){
  frontend.modules.layout.core.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.modules !== 'undefined') && (typeof frontend.modules.layout !== 'undefined') && (typeof frontend.modules.layout.core !== 'undefined') && (typeof frontend.modules.layout.core._STAR_movable_containers !== 'undefined')){
} else {
frontend.modules.layout.core._STAR_movable_containers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.modules.layout.core.calc_layout_data = (function frontend$modules$layout$core$calc_layout_data(cnt,_evt){
var o = cnt.getBoundingClientRect().toJSON();
(o.vw = frontend.modules.layout.core.goog$module$goog$object.get(visualViewport,"width"));

(o.vh = frontend.modules.layout.core.goog$module$goog$object.get(visualViewport,"height"));

return o;
});
frontend.modules.layout.core.move_container_to_top = (function frontend$modules$layout$core$move_container_to_top(identity){
var temp__5804__auto__ = (function (){var and__5000__auto__ = (cljs.core.count(cljs.core.deref(frontend.modules.layout.core._STAR_movable_containers)) > (1));
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.modules.layout.core._STAR_movable_containers),identity);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var container = temp__5804__auto__;
var zdx = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__128864){
var vec__128865 = p__128864;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128865,(0),null);
var el = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128865,(1),null);
var c = getComputedStyle(el);
var v1 = c.visibility;
var v2 = c.display;
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("visible",v1);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("none",v2);
if(and__5000__auto____$1){
return c.zIndex;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var z = temp__5804__auto____$1;
return z;
} else {
return null;
}
}),cljs.core.deref(frontend.modules.layout.core._STAR_movable_containers)));
var zdx__$1 = cljs_bean.core.__GT_js(zdx);
var zdx__$2 = (function (){var and__5000__auto__ = zdx__$1;
if(cljs.core.truth_(and__5000__auto__)){
return Math.max.apply(null,zdx__$1);
} else {
return and__5000__auto__;
}
})();
var zdx_SINGLEQUOTE_ = (function (){var G__128870 = container.style.zIndex;
if((G__128870 == null)){
return null;
} else {
return cljs.core.parse_long(G__128870);
}
})();
if((((zdx_SINGLEQUOTE_ == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(zdx__$2,zdx_SINGLEQUOTE_)))){
return (container.style.zIndex = (zdx__$2 + (1)));
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('frontend.modules.layout.core.move_container_to_top', frontend.modules.layout.core.move_container_to_top);
frontend.modules.layout.core.setup_draggable_container_BANG_ = (function frontend$modules$layout$core$setup_draggable_container_BANG_(el,callback){
var temp__5804__auto__ = el.querySelector(".draggable-handle");
if(cljs.core.truth_(temp__5804__auto__)){
var handle = temp__5804__auto__;
var cls = el.classList;
var ds = el.dataset;
var identity = ds.identity;
var ing_QMARK_ = "is-dragging";
interact(handle).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var dset = el.dataset;
var dx = e.dx;
var dy = e.dy;
var dx_SINGLEQUOTE_ = dset.dx;
var dy_SINGLEQUOTE_ = dset.dy;
var dx_SINGLEQUOTE___$1 = (function (){var and__5000__auto__ = dx_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_float(dx_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})();
var dy_SINGLEQUOTE___$1 = (function (){var and__5000__auto__ = dy_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_float(dy_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})();
var x = (dx + (function (){var or__5002__auto__ = dx_SINGLEQUOTE___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
var y = (dy + (function (){var or__5002__auto__ = dy_SINGLEQUOTE___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
(el.style.transform = ["translate(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(x),"px, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(y),"px)"].join(''));

(el.dataset.dx = x);

return (el.dataset.dy = y);
})], null)], null))).on("dragstart",(function (){
return cls.add(ing_QMARK_);
})).on("dragend",(function (e){
cls.remove(ing_QMARK_);

if(cljs.core.fn_QMARK_(callback)){
var G__128938 = cljs_bean.core.__GT_js(frontend.modules.layout.core.calc_layout_data(el,e));
return (callback.cljs$core$IFn$_invoke$arity$1 ? callback.cljs$core$IFn$_invoke$arity$1(G__128938) : callback.call(null,G__128938));
} else {
return null;
}
}));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.modules.layout.core._STAR_movable_containers,cljs.core.assoc,identity,el);

return (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.modules.layout.core._STAR_movable_containers,cljs.core.dissoc,identity,el);
});
} else {
return null;
}
});
goog.exportSymbol('frontend.modules.layout.core.setup_draggable_container_BANG_', frontend.modules.layout.core.setup_draggable_container_BANG_);
frontend.modules.layout.core.setup_resizable_container_BANG_ = (function frontend$modules$layout$core$setup_resizable_container_BANG_(el,callback){
var cls = el.classList;
var ds = el.dataset;
var identity = ds.identity;
var ing_QMARK_ = "is-resizing";
interact(el).resizable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"edges","edges",-694791395),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"left","left",-399115937),true,new cljs.core.Keyword(null,"top","top",-1856271961),true,new cljs.core.Keyword(null,"bottom","bottom",-1550509018),true,new cljs.core.Keyword(null,"right","right",-452581833),true], null),new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){
return cls.add(ing_QMARK_);
}),new cljs.core.Keyword(null,"end","end",-268185958),(function (e){
cls.remove(ing_QMARK_);

if(cljs.core.fn_QMARK_(callback)){
var G__128950 = cljs_bean.core.__GT_js(frontend.modules.layout.core.calc_layout_data(el,e));
return (callback.cljs$core$IFn$_invoke$arity$1 ? callback.cljs$core$IFn$_invoke$arity$1(G__128950) : callback.call(null,G__128950));
} else {
return null;
}
}),new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var dset = el.dataset;
var w = e.rect.width;
var h = e.rect.height;
var dx = e.deltaRect.left;
var dy = e.deltaRect.top;
var dx_SINGLEQUOTE_ = dset.dx;
var dy_SINGLEQUOTE_ = dset.dy;
var dx_SINGLEQUOTE___$1 = (function (){var and__5000__auto__ = dx_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_float(dx_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})();
var dy_SINGLEQUOTE___$1 = (function (){var and__5000__auto__ = dy_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_float(dy_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})();
var x = (dx + (function (){var or__5002__auto__ = dx_SINGLEQUOTE___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
var y = (dy + (function (){var or__5002__auto__ = dy_SINGLEQUOTE___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
(el.style.transform = ["translate(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(x),"px, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(y),"px)"].join(''));

(el.style.width = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(w),"px"].join(''));

(el.style.height = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(h),"px"].join(''));

(dset.dx = x);

return (dset.dy = y);
})], null)], null)));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.modules.layout.core._STAR_movable_containers,cljs.core.assoc,identity,el);

return (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.modules.layout.core._STAR_movable_containers,cljs.core.dissoc,identity,el);
});
});
goog.exportSymbol('frontend.modules.layout.core.setup_resizable_container_BANG_', frontend.modules.layout.core.setup_resizable_container_BANG_);

//# sourceMappingURL=frontend.modules.layout.core.js.map
