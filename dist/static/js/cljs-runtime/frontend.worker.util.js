goog.provide('frontend.worker.util');
frontend.worker.util.dev_QMARK_ = goog.DEBUG;
frontend.worker.util.post_message = frontend.common.file.util.post_message;

frontend.worker.util.get_pool_name = (function frontend$worker$util$get_pool_name(graph_name){
return ["logseq-pool-",logseq.db.common.sqlite.sanitize_db_name(graph_name)].join('');
});

frontend.worker.util.decode_username = (function frontend$worker$util$decode_username(username){
var arr = (new Uint8Array(cljs.core.count(username)));
var seq__45012_45071 = cljs.core.seq(cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(username)));
var chunk__45013_45072 = null;
var count__45014_45073 = (0);
var i__45015_45074 = (0);
while(true){
if((i__45015_45074 < count__45014_45073)){
var i_45076 = chunk__45013_45072.cljs$core$IIndexed$_nth$arity$2(null,i__45015_45074);
(arr[i_45076] = username.charCodeAt(i_45076));


var G__45077 = seq__45012_45071;
var G__45078 = chunk__45013_45072;
var G__45079 = count__45014_45073;
var G__45080 = (i__45015_45074 + (1));
seq__45012_45071 = G__45077;
chunk__45013_45072 = G__45078;
count__45014_45073 = G__45079;
i__45015_45074 = G__45080;
continue;
} else {
var temp__5804__auto___45081 = cljs.core.seq(seq__45012_45071);
if(temp__5804__auto___45081){
var seq__45012_45082__$1 = temp__5804__auto___45081;
if(cljs.core.chunked_seq_QMARK_(seq__45012_45082__$1)){
var c__5525__auto___45083 = cljs.core.chunk_first(seq__45012_45082__$1);
var G__45085 = cljs.core.chunk_rest(seq__45012_45082__$1);
var G__45086 = c__5525__auto___45083;
var G__45087 = cljs.core.count(c__5525__auto___45083);
var G__45088 = (0);
seq__45012_45071 = G__45085;
chunk__45013_45072 = G__45086;
count__45014_45073 = G__45087;
i__45015_45074 = G__45088;
continue;
} else {
var i_45089 = cljs.core.first(seq__45012_45082__$1);
(arr[i_45089] = username.charCodeAt(i_45089));


var G__45090 = cljs.core.next(seq__45012_45082__$1);
var G__45091 = null;
var G__45092 = (0);
var G__45093 = (0);
seq__45012_45071 = G__45090;
chunk__45013_45072 = G__45091;
count__45014_45073 = G__45092;
i__45015_45074 = G__45093;
continue;
}
} else {
}
}
break;
}

return (new TextDecoder("utf-8")).decode(arr);
});

frontend.worker.util.parse_jwt = (function frontend$worker$util$parse_jwt(jwt){
var G__45043 = jwt;
var G__45043__$1 = (((G__45043 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__45043,"."));
var G__45043__$2 = (((G__45043__$1 == null))?null:cljs.core.second(G__45043__$1));
var G__45043__$3 = (((G__45043__$2 == null))?null:(function (p1__44988_SHARP_){
return goog.crypt.base64.decodeString(p1__44988_SHARP_,true);
})(G__45043__$2));
var G__45043__$4 = (((G__45043__$3 == null))?null:JSON.parse(G__45043__$3));
var G__45043__$5 = (((G__45043__$4 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__45043__$4,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
if((G__45043__$5 == null)){
return null;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__45043__$5,new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904),frontend.worker.util.decode_username);
}
});

//# sourceMappingURL=frontend.worker.util.js.map
