goog.provide('frontend.extensions.srs.handler');
frontend.extensions.srs.handler.click = (function frontend$extensions$srs$handler$click(id){
var nodes = dommy.utils.__GT_Array(document.querySelectorAll(dommy.core.selector(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"#cards-modal","#cards-modal",-1829868740),[".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null))));
var seq__98387 = cljs.core.seq(nodes);
var chunk__98388 = null;
var count__98389 = (0);
var i__98390 = (0);
while(true){
if((i__98390 < count__98389)){
var node = chunk__98388.cljs$core$IIndexed$_nth$arity$2(null,i__98390);
node.click();


var G__98392 = seq__98387;
var G__98393 = chunk__98388;
var G__98394 = count__98389;
var G__98395 = (i__98390 + (1));
seq__98387 = G__98392;
chunk__98388 = G__98393;
count__98389 = G__98394;
i__98390 = G__98395;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__98387);
if(temp__5804__auto__){
var seq__98387__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__98387__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__98387__$1);
var G__98396 = cljs.core.chunk_rest(seq__98387__$1);
var G__98397 = c__5525__auto__;
var G__98398 = cljs.core.count(c__5525__auto__);
var G__98399 = (0);
seq__98387 = G__98396;
chunk__98388 = G__98397;
count__98389 = G__98398;
i__98390 = G__98399;
continue;
} else {
var node = cljs.core.first(seq__98387__$1);
node.click();


var G__98400 = cljs.core.next(seq__98387__$1);
var G__98401 = null;
var G__98402 = (0);
var G__98403 = (0);
seq__98387 = G__98400;
chunk__98388 = G__98401;
count__98389 = G__98402;
i__98390 = G__98403;
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
