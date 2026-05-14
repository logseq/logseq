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
var seq__96946_97098 = cljs.core.seq(file_name_content);
var chunk__96947_97099 = null;
var count__96948_97100 = (0);
var i__96949_97101 = (0);
while(true){
if((i__96949_97101 < count__96948_97100)){
var vec__96974_97102 = chunk__96947_97099.cljs$core$IIndexed$_nth$arity$2(null,i__96949_97101);
var file_name_97103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96974_97102,(0),null);
var content_97104 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96974_97102,(1),null);
if(clojure.string.blank_QMARK_(content_97104)){
} else {
folder.file(clojure.string.replace(file_name_97103,/^\/+/,""),content_97104);
}


var G__97105 = seq__96946_97098;
var G__97106 = chunk__96947_97099;
var G__97107 = count__96948_97100;
var G__97108 = (i__96949_97101 + (1));
seq__96946_97098 = G__97105;
chunk__96947_97099 = G__97106;
count__96948_97100 = G__97107;
i__96949_97101 = G__97108;
continue;
} else {
var temp__5804__auto___97109 = cljs.core.seq(seq__96946_97098);
if(temp__5804__auto___97109){
var seq__96946_97110__$1 = temp__5804__auto___97109;
if(cljs.core.chunked_seq_QMARK_(seq__96946_97110__$1)){
var c__5525__auto___97111 = cljs.core.chunk_first(seq__96946_97110__$1);
var G__97112 = cljs.core.chunk_rest(seq__96946_97110__$1);
var G__97113 = c__5525__auto___97111;
var G__97114 = cljs.core.count(c__5525__auto___97111);
var G__97115 = (0);
seq__96946_97098 = G__97112;
chunk__96947_97099 = G__97113;
count__96948_97100 = G__97114;
i__96949_97101 = G__97115;
continue;
} else {
var vec__96984_97119 = cljs.core.first(seq__96946_97110__$1);
var file_name_97120 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96984_97119,(0),null);
var content_97121 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96984_97119,(1),null);
if(clojure.string.blank_QMARK_(content_97121)){
} else {
folder.file(clojure.string.replace(file_name_97120,/^\/+/,""),content_97121);
}


var G__97122 = cljs.core.next(seq__96946_97110__$1);
var G__97123 = null;
var G__97124 = (0);
var G__97125 = (0);
seq__96946_97098 = G__97122;
chunk__96947_97099 = G__97123;
count__96948_97100 = G__97124;
i__96949_97101 = G__97125;
continue;
}
} else {
}
}
break;
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(zip.generateAsync(({"type": "blob"}))),(function (zip_blob){
return promesa.protocols._promise(frontend.extensions.zip.make_file(zip_blob,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(zip_filename),".zip"].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"application/zip"], null)));
}));
}));
});

//# sourceMappingURL=frontend.extensions.zip.js.map
