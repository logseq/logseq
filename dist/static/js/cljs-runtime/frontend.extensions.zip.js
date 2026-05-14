goog.provide('frontend.extensions.zip');
var module$node_modules$jszip$lib$index=shadow.js.require("module$node_modules$jszip$lib$index", {});
frontend.extensions.zip.make_file = (function frontend$extensions$zip$make_file(content,file_name,args){
var blob_content = cljs.core.clj__GT_js(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [content], null));
var last_modified = (function (){var or__5002__auto__ = (content["lastModified"]);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new Date());
}
})();
var args__$1 = cljs.core.clj__GT_js(args);
(args__$1["lastModified"] = last_modified);

return (new File(blob_content,file_name,args__$1));
});
frontend.extensions.zip.make_zip = (function frontend$extensions$zip$make_zip(zip_filename,file_name_content,_repo){
var zip = (new module$node_modules$jszip$lib$index());
var folder = zip.folder(zip_filename);
var seq__84502_84518 = cljs.core.seq(file_name_content);
var chunk__84503_84519 = null;
var count__84504_84520 = (0);
var i__84505_84521 = (0);
while(true){
if((i__84505_84521 < count__84504_84520)){
var vec__84512_84522 = chunk__84503_84519.cljs$core$IIndexed$_nth$arity$2(null,i__84505_84521);
var file_name_84523 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__84512_84522,(0),null);
var content_84524 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__84512_84522,(1),null);
if(clojure.string.blank_QMARK_(content_84524)){
} else {
folder.file(clojure.string.replace(file_name_84523,/^\/+/,""),content_84524);
}


var G__84525 = seq__84502_84518;
var G__84526 = chunk__84503_84519;
var G__84527 = count__84504_84520;
var G__84528 = (i__84505_84521 + (1));
seq__84502_84518 = G__84525;
chunk__84503_84519 = G__84526;
count__84504_84520 = G__84527;
i__84505_84521 = G__84528;
continue;
} else {
var temp__5804__auto___84529 = cljs.core.seq(seq__84502_84518);
if(temp__5804__auto___84529){
var seq__84502_84530__$1 = temp__5804__auto___84529;
if(cljs.core.chunked_seq_QMARK_(seq__84502_84530__$1)){
var c__5525__auto___84531 = cljs.core.chunk_first(seq__84502_84530__$1);
var G__84532 = cljs.core.chunk_rest(seq__84502_84530__$1);
var G__84533 = c__5525__auto___84531;
var G__84534 = cljs.core.count(c__5525__auto___84531);
var G__84535 = (0);
seq__84502_84518 = G__84532;
chunk__84503_84519 = G__84533;
count__84504_84520 = G__84534;
i__84505_84521 = G__84535;
continue;
} else {
var vec__84515_84536 = cljs.core.first(seq__84502_84530__$1);
var file_name_84537 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__84515_84536,(0),null);
var content_84538 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__84515_84536,(1),null);
if(clojure.string.blank_QMARK_(content_84538)){
} else {
folder.file(clojure.string.replace(file_name_84537,/^\/+/,""),content_84538);
}


var G__84539 = cljs.core.next(seq__84502_84530__$1);
var G__84540 = null;
var G__84541 = (0);
var G__84542 = (0);
seq__84502_84518 = G__84539;
chunk__84503_84519 = G__84540;
count__84504_84520 = G__84541;
i__84505_84521 = G__84542;
continue;
}
} else {
}
}
break;
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___61710__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(zip.generateAsync(({"type": "blob"}))),(function (zip_blob){
return promesa.protocols._promise(frontend.extensions.zip.make_file(zip_blob,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(zip_filename),".zip"].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"application/zip"], null)));
}));
}));
});

//# sourceMappingURL=frontend.extensions.zip.js.map
