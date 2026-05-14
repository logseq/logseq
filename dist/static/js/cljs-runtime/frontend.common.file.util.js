goog.provide('frontend.common.file.util');
frontend.common.file.util.multiplatform_reserved_chars = ":\\*\\?\"<>|\\#\\\\";
frontend.common.file.util.reserved_chars_pattern = cljs.core.re_pattern(["[",frontend.common.file.util.multiplatform_reserved_chars,"]+"].join(''));
frontend.common.file.util.encode_url_lowbar = (function frontend$common$file$util$encode_url_lowbar(input){
return clojure.string.replace(input,"_","%5F");
});
frontend.common.file.util.encode_url_percent = (function frontend$common$file$util$encode_url_percent(input){
return clojure.string.replace(input,"%","%25");
});
/**
 * Encode slashes / as triple lowbars ___
 * Don't encode _ in most cases, except causing ambiguation
 */
frontend.common.file.util.escape_namespace_slashes_and_multilowbars = (function frontend$common$file$util$escape_namespace_slashes_and_multilowbars(string){
return clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(string,"___",frontend.common.file.util.encode_url_lowbar),"_/",frontend.common.file.util.encode_url_lowbar),"/_",frontend.common.file.util.encode_url_lowbar),"/","___");
});
frontend.common.file.util.windows_reserved_filebodies = cljs.core.set(cljs.core.list("CON","PRN","AUX","NUL","COM1","COM2","COM3","COM4","COM5","COM6","COM7","COM8","COM9","LPT1","LPT2","LPT3","LPT4","LPT5","LPT6","LPT7","LPT8","LPT9"));
/**
 * Encode reserved file names in Windows
 */
frontend.common.file.util.escape_windows_reserved_filebodies = (function frontend$common$file$util$escape_windows_reserved_filebodies(file_body){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_body),((((cljs.core.contains_QMARK_(frontend.common.file.util.windows_reserved_filebodies,file_body)) || (clojure.string.ends_with_QMARK_(file_body,"."))))?"/":null)].join('');
});
frontend.common.file.util.url_encode_file_name = (function frontend$common$file$util$url_encode_file_name(file_name){
return clojure.string.replace(encodeURIComponent(file_name),"*","%2A");
});
/**
 * Sanitize page-name for file name (strict), for file name in file writing.
 * Use triple lowbar as namespace separator
 */
frontend.common.file.util.tri_lb_file_name_sanity = (function frontend$common$file$util$tri_lb_file_name_sanity(title){
var G__43926 = title;
var G__43926__$1 = (((G__43926 == null))?null:logseq.common.util.page_name_sanity(G__43926));
var G__43926__$2 = (((G__43926__$1 == null))?null:clojure.string.replace(G__43926__$1,logseq.common.util.url_encoded_pattern,frontend.common.file.util.encode_url_percent));
var G__43926__$3 = (((G__43926__$2 == null))?null:clojure.string.replace(G__43926__$2,frontend.common.file.util.reserved_chars_pattern,frontend.common.file.util.url_encode_file_name));
var G__43926__$4 = (((G__43926__$3 == null))?null:frontend.common.file.util.escape_windows_reserved_filebodies(G__43926__$3));
if((G__43926__$4 == null)){
return null;
} else {
return frontend.common.file.util.escape_namespace_slashes_and_multilowbars(G__43926__$4);
}
});
frontend.common.file.util.file_name_sanity = (function frontend$common$file$util$file_name_sanity(title){
if(typeof title === 'string'){
return frontend.common.file.util.tri_lb_file_name_sanity(title);
} else {
return null;
}
});
/**
 * Includes reserved characters that would broken FS
 */
frontend.common.file.util.include_reserved_chars_QMARK_ = (function frontend$common$file$util$include_reserved_chars_QMARK_(s){
return logseq.common.util.safe_re_find(frontend.common.file.util.reserved_chars_pattern,s);
});
frontend.common.file.util.print_prefix_map_STAR_ = (function frontend$common$file$util$print_prefix_map_STAR_(prefix,m,print_one,writer,opts){
return cljs.core.pr_sequential_writer(writer,(function (e,w,opts__$1){
var G__43936_43977 = cljs.core.key(e);
var G__43937_43978 = w;
var G__43938_43979 = opts__$1;
(print_one.cljs$core$IFn$_invoke$arity$3 ? print_one.cljs$core$IFn$_invoke$arity$3(G__43936_43977,G__43937_43978,G__43938_43979) : print_one.call(null,G__43936_43977,G__43937_43978,G__43938_43979));

cljs.core._write(w," ");

var G__43948 = cljs.core.val(e);
var G__43949 = w;
var G__43950 = opts__$1;
return (print_one.cljs$core$IFn$_invoke$arity$3 ? print_one.cljs$core$IFn$_invoke$arity$3(G__43948,G__43949,G__43950) : print_one.call(null,G__43948,G__43949,G__43950));
}),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),"\n{"].join(''),"\n","}",opts,cljs.core.seq(m));
});
/**
 * Ugly printing fast, with newlines so that git diffs are smaller
 */
frontend.common.file.util.ugly_pr_str = (function frontend$common$file$util$ugly_pr_str(x){
var print_prefix_map_orig_val__43959 = cljs.core.print_prefix_map;
var print_prefix_map_temp_val__43960 = frontend.common.file.util.print_prefix_map_STAR_;
(cljs.core.print_prefix_map = print_prefix_map_temp_val__43960);

try{return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0));
}finally {(cljs.core.print_prefix_map = print_prefix_map_orig_val__43959);
}});
frontend.common.file.util.post_message = (function frontend$common$file$util$post_message(type,data){
if((typeof self !== 'undefined')){
return self.postMessage(logseq.db.write_transit_str(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [type,data], null)));
} else {
return null;
}
});

//# sourceMappingURL=frontend.common.file.util.js.map
