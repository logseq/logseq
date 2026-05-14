goog.provide('frontend.image');
goog.scope(function(){
  frontend.image.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.image.reverse_QMARK_ = (function frontend$image$reverse_QMARK_(exif_orientation){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [(7),null,(6),null,(5),null,(8),null], null), null),exif_orientation);
});
frontend.image.re_scale = (function frontend$image$re_scale(exif_orientation,width,height,max_width,max_height){
var vec__112084 = ((frontend.image.reverse_QMARK_(exif_orientation))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [height,width], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [width,height], null));
var width__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112084,(0),null);
var height__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112084,(1),null);
var ratio = (width__$1 / height__$1);
var to_width = (((width__$1 > max_width))?max_width:width__$1);
var to_height = (((height__$1 > max_height))?max_height:height__$1);
var new_ratio = (to_width / to_height);
var vec__112087 = (((new_ratio > ratio))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(ratio * to_height),to_height], null):(((new_ratio < ratio))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [to_width,(to_width / ratio)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [to_width,to_height], null)
));
var w = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112087,(0),null);
var h = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112087,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(w | (0)),(h | (0))], null);
});
/**
 * Given image and exif orientation, ensure the photo is displayed
 *   rightside up
 */
frontend.image.fix_orientation = (function frontend$image$fix_orientation(img,exif_orientation,cb,max_width,max_height){
var off_canvas = document.createElement("canvas");
var ctx = off_canvas.getContext("2d");
var width = frontend.image.goog$module$goog$object.get(img,"width");
var height = frontend.image.goog$module$goog$object.get(img,"height");
var vec__112099 = frontend.image.re_scale(exif_orientation,width,height,max_width,max_height);
var to_width = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112099,(0),null);
var to_height = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112099,(1),null);
frontend.image.goog$module$goog$object.set(ctx,"imageSmoothingEnabled",false);

(off_canvas.width = to_width);

(off_canvas.height = to_height);

var vec__112105_112149 = ((frontend.image.reverse_QMARK_(exif_orientation))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [to_height,to_width], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [to_width,to_height], null));
var width_112150__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112105_112149,(0),null);
var height_112151__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112105_112149,(1),null);
var G__112108_112154 = exif_orientation;
switch (G__112108_112154) {
case (2):
ctx.transform((-1),(0),(0),(1),width_112150__$1,(0));

break;
case (3):
ctx.transform((-1),(0),(0),(-1),width_112150__$1,height_112151__$1);

break;
case (4):
ctx.transform((1),(0),(0),(-1),(0),height_112151__$1);

break;
case (5):
ctx.transform((0),(1),(1),(0),(0),(0));

break;
case (6):
ctx.transform((0),(1),(-1),(0),height_112151__$1,(0));

break;
case (7):
ctx.transform((0),(-1),(-1),(0),height_112151__$1,width_112150__$1);

break;
case (8):
ctx.transform((0),(-1),(1),(0),(0),width_112150__$1);

break;
default:
ctx.transform((1),(0),(0),(1),(0),(0));

}

ctx.drawImage(img,(0),(0),width_112150__$1,height_112151__$1);

return (cb.cljs$core$IFn$_invoke$arity$1 ? cb.cljs$core$IFn$_invoke$arity$1(off_canvas) : cb.call(null,off_canvas));
});
frontend.image.get_orientation = (function frontend$image$get_orientation(img,cb,max_width,max_height){
return module$frontend$exif.getEXIFOrientation(img,(function (orientation){
return frontend.image.fix_orientation(img,orientation,cb,max_width,max_height);
}));
});
frontend.image.create_object_url = (function frontend$image$create_object_url(file){
return (function (){var or__5002__auto__ = window.URL;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return window.webkitURL;
}
})().createObjectURL(file);
});

//# sourceMappingURL=frontend.image.js.map
