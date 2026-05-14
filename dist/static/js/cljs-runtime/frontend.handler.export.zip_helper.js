goog.provide('frontend.handler.export$.zip_helper');
frontend.handler.export$.zip_helper.goto_last = (function frontend$handler$export$zip_helper$goto_last(loc){
while(true){
var loc_STAR_ = clojure.zip.next(loc);
if(clojure.zip.end_QMARK_(loc_STAR_)){
return loc;
} else {
var G__84103 = loc_STAR_;
loc = G__84103;
continue;
}
break;
}
});
frontend.handler.export$.zip_helper.get_level = (function frontend$handler$export$zip_helper$get_level(loc){
return cljs.core.count(clojure.zip.path(loc));
});
frontend.handler.export$.zip_helper.goto_level = (function frontend$handler$export$zip_helper$goto_level(loc,level){
var current_level = frontend.handler.export$.zip_helper.get_level(loc);
if((level <= (current_level + (1)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"level","level",1290497552),level,new cljs.core.Keyword(null,"current-level","current-level",-11925890),current_level], 0)),"\n","(<= level (inc current-level))"].join('')));
}

var diff = (level - current_level);
var up_or_down = (((diff > (0)))?clojure.zip.down:clojure.zip.up);
var diff_STAR_ = cljs.core.abs(diff);
var loc__$1 = loc;
var count_STAR_ = diff_STAR_;
while(true){
if((count_STAR_ === (0))){
return loc__$1;
} else {
var G__84107 = (up_or_down.cljs$core$IFn$_invoke$arity$1 ? up_or_down.cljs$core$IFn$_invoke$arity$1(loc__$1) : up_or_down.call(null,loc__$1));
var G__84108 = (count_STAR_ - (1));
loc__$1 = G__84107;
count_STAR_ = G__84108;
continue;
}
break;
}
});

//# sourceMappingURL=frontend.handler.export.zip_helper.js.map
