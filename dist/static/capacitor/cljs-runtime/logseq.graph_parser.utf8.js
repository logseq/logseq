goog.provide('logseq.graph_parser.utf8');
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.utf8 !== 'undefined') && (typeof logseq.graph_parser.utf8.encoder !== 'undefined')){
} else {
logseq.graph_parser.utf8.encoder = (new TextEncoder("utf-8"));
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.utf8 !== 'undefined') && (typeof logseq.graph_parser.utf8.decoder !== 'undefined')){
} else {
logseq.graph_parser.utf8.decoder = (new TextDecoder("utf-8"));
}
logseq.graph_parser.utf8.encode = (function logseq$graph_parser$utf8$encode(s){
return logseq.graph_parser.utf8.encoder.encode(s);
});
logseq.graph_parser.utf8.decode = (function logseq$graph_parser$utf8$decode(arr){
return logseq.graph_parser.utf8.decoder.decode(arr);
});
logseq.graph_parser.utf8.substring = (function logseq$graph_parser$utf8$substring(var_args){
var G__61175 = arguments.length;
switch (G__61175) {
case 2:
return logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$2 = (function (arr,start){
return logseq.graph_parser.utf8.decode(arr.subarray(start));
}));

(logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3 = (function (arr,start,end){
if(cljs.core.truth_(end)){
return logseq.graph_parser.utf8.decode(arr.subarray(start,end));
} else {
return logseq.graph_parser.utf8.decode(arr.subarray(start));
}
}));

(logseq.graph_parser.utf8.substring.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=logseq.graph_parser.utf8.js.map
