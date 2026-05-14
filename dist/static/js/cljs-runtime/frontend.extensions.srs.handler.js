goog.provide('frontend.extensions.srs.handler');
frontend.extensions.srs.handler.click = (function frontend$extensions$srs$handler$click(id){
var nodes = dommy.utils.__GT_Array(document.querySelectorAll(dommy.core.selector(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"#cards-modal","#cards-modal",-1829868740),[".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null))));
var seq__82262 = cljs.core.seq(nodes);
var chunk__82263 = null;
var count__82264 = (0);
var i__82265 = (0);
while(true){
if((i__82265 < count__82264)){
var node = chunk__82263.cljs$core$IIndexed$_nth$arity$2(null,i__82265);
node.click();


var G__82266 = seq__82262;
var G__82267 = chunk__82263;
var G__82268 = count__82264;
var G__82269 = (i__82265 + (1));
seq__82262 = G__82266;
chunk__82263 = G__82267;
count__82264 = G__82268;
i__82265 = G__82269;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__82262);
if(temp__5804__auto__){
var seq__82262__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__82262__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__82262__$1);
var G__82270 = cljs.core.chunk_rest(seq__82262__$1);
var G__82271 = c__5525__auto__;
var G__82272 = cljs.core.count(c__5525__auto__);
var G__82273 = (0);
seq__82262 = G__82270;
chunk__82263 = G__82271;
count__82264 = G__82272;
i__82265 = G__82273;
continue;
} else {
var node = cljs.core.first(seq__82262__$1);
node.click();


var G__82274 = cljs.core.next(seq__82262__$1);
var G__82275 = null;
var G__82276 = (0);
var G__82277 = (0);
seq__82262 = G__82274;
chunk__82263 = G__82275;
count__82264 = G__82276;
i__82265 = G__82277;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.extensions.srs.handler.toggle_answers = (function frontend$extensions$srs$handler$toggle_answers(){
return frontend.extensions.srs.handler.click("card-answers");
});
frontend.extensions.srs.handler.next_card = (function frontend$extensions$srs$handler$next_card(){
return frontend.extensions.srs.handler.click("card-next");
});
frontend.extensions.srs.handler.forgotten = (function frontend$extensions$srs$handler$forgotten(){
return frontend.extensions.srs.handler.click("card-forgotten");
});
frontend.extensions.srs.handler.remembered = (function frontend$extensions$srs$handler$remembered(){
return frontend.extensions.srs.handler.click("card-remembered");
});
frontend.extensions.srs.handler.recall = (function frontend$extensions$srs$handler$recall(){
return frontend.extensions.srs.handler.click("card-recall");
});
frontend.extensions.srs.handler.card_again = (function frontend$extensions$srs$handler$card_again(){
return frontend.extensions.srs.handler.click("card-again");
});
frontend.extensions.srs.handler.card_hard = (function frontend$extensions$srs$handler$card_hard(){
return frontend.extensions.srs.handler.click("card-hard");
});
frontend.extensions.srs.handler.card_good = (function frontend$extensions$srs$handler$card_good(){
return frontend.extensions.srs.handler.click("card-good");
});
frontend.extensions.srs.handler.card_easy = (function frontend$extensions$srs$handler$card_easy(){
return frontend.extensions.srs.handler.click("card-easy");
});

//# sourceMappingURL=frontend.extensions.srs.handler.js.map
