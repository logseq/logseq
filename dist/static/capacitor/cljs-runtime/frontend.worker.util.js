goog.provide('frontend.worker.util');
frontend.worker.util.dev_QMARK_ = goog.DEBUG;
frontend.worker.util.post_message = frontend.common.file.util.post_message;

frontend.worker.util.get_pool_name = (function frontend$worker$util$get_pool_name(graph_name){
return ["logseq-pool-",logseq.db.common.sqlite.sanitize_db_name(graph_name)].join('');
});

frontend.worker.util.decode_username = (function frontend$worker$util$decode_username(username){
var arr = (new Uint8Array(cljs.core.count(username)));
var seq__67663_67670 = cljs.core.seq(cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(username)));
var chunk__67664_67671 = null;
var count__67665_67672 = (0);
var i__67666_67673 = (0);
while(true){
if((i__67666_67673 < count__67665_67672)){
var i_67674 = chunk__67664_67671.cljs$core$IIndexed$_nth$arity$2(null,i__67666_67673);
(arr[i_67674] = username.charCodeAt(i_67674));


var G__67675 = seq__67663_67670;
var G__67676 = chunk__67664_67671;
var G__67677 = count__67665_67672;
var G__67678 = (i__67666_67673 + (1));
seq__67663_67670 = G__67675;
chunk__67664_67671 = G__67676;
count__67665_67672 = G__67677;
i__67666_67673 = G__67678;
continue;
} else {
var temp__5804__auto___67680 = cljs.core.seq(seq__67663_67670);
if(temp__5804__auto___67680){
var seq__67663_67681__$1 = temp__5804__auto___67680;
if(cljs.core.chunked_seq_QMARK_(seq__67663_67681__$1)){
var c__5525__auto___67685 = cljs.core.chunk_first(seq__67663_67681__$1);
var G__67686 = cljs.core.chunk_rest(seq__67663_67681__$1);
var G__67687 = c__5525__auto___67685;
var G__67688 = cljs.core.count(c__5525__auto___67685);
var G__67689 = (0);
seq__67663_67670 = G__67686;
chunk__67664_67671 = G__67687;
count__67665_67672 = G__67688;
i__67666_67673 = G__67689;
continue;
} else {
var i_67690 = cljs.core.first(seq__67663_67681__$1);
(arr[i_67690] = username.charCodeAt(i_67690));


var G__67691 = cljs.core.next(seq__67663_67681__$1);
var G__67692 = null;
var G__67693 = (0);
var G__67694 = (0);
seq__67663_67670 = G__67691;
chunk__67664_67671 = G__67692;
count__67665_67672 = G__67693;
i__67666_67673 = G__67694;
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
var G__67668 = jwt;
var G__67668__$1 = (((G__67668 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__67668,"."));
var G__67668__$2 = (((G__67668__$1 == null))?null:cljs.core.second(G__67668__$1));
var G__67668__$3 = (((G__67668__$2 == null))?null:(function (p1__67662_SHARP_){
return goog.crypt.base64.decodeString(p1__67662_SHARP_,true);
})(G__67668__$2));
var G__67668__$4 = (((G__67668__$3 == null))?null:JSON.parse(G__67668__$3));
var G__67668__$5 = (((G__67668__$4 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__67668__$4,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
if((G__67668__$5 == null)){
return null;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__67668__$5,new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904),frontend.worker.util.decode_username);
}
});

//# sourceMappingURL=frontend.worker.util.js.map
