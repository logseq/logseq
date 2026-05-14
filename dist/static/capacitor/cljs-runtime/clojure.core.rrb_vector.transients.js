goog.provide('clojure.core.rrb_vector.transients');
clojure.core.rrb_vector.transients.ensure_editable = (function clojure$core$rrb_vector$transients$ensure_editable(edit,node){
if((node.edit === edit)){
return node;
} else {
var new_arr = cljs.core.aclone(node.arr);
if(((33) === new_arr.length)){
(new_arr[(32)] = cljs.core.aclone((new_arr[(32)])));
} else {
}

return (new cljs.core.VectorNode(edit,new_arr));
}
});
clojure.core.rrb_vector.transients.editable_root = (function clojure$core$rrb_vector$transients$editable_root(root){
var new_arr = cljs.core.aclone(root.arr);
if(((33) === new_arr.length)){
(new_arr[(32)] = cljs.core.aclone((new_arr[(32)])));
} else {
}

return (new cljs.core.VectorNode(({}),new_arr));
});
clojure.core.rrb_vector.transients.editable_tail = (function clojure$core$rrb_vector$transients$editable_tail(tail){
var ret = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
cljs.core.array_copy(tail,(0),ret,(0),tail.length);

return ret;
});
clojure.core.rrb_vector.transients.push_tail_BANG_ = (function clojure$core$rrb_vector$transients$push_tail_BANG_(shift,cnt,root_edit,current_node,tail_node){
var ret = clojure.core.rrb_vector.transients.ensure_editable(root_edit,current_node);
if(clojure.core.rrb_vector.nodes.regular_QMARK_(ret)){
var n_71383 = ret;
var shift_71384__$1 = shift;
while(true){
var arr_71385 = n_71383.arr;
var subidx_71386 = (((cnt - (1)) >> shift_71384__$1) & (31));
if((shift_71384__$1 === (5))){
(arr_71385[subidx_71386] = tail_node);
} else {
var child_71387 = (arr_71385[subidx_71386]);
if((child_71387 == null)){
(arr_71385[subidx_71386] = clojure.core.rrb_vector.trees.new_path(tail_node.arr,root_edit,(shift_71384__$1 - (5)),tail_node));
} else {
var editable_child_71389 = clojure.core.rrb_vector.transients.ensure_editable(root_edit,child_71387);
(arr_71385[subidx_71386] = editable_child_71389);

var G__71390 = editable_child_71389;
var G__71391 = (shift_71384__$1 - (5));
n_71383 = G__71390;
shift_71384__$1 = G__71391;
continue;
}
}
break;
}

return ret;
} else {
var arr = ret.arr;
var rngs = clojure.core.rrb_vector.nodes.node_ranges(ret);
var li = ((rngs[(32)]) - (1));
var cret = (((shift === (5)))?null:(function (){var child = clojure.core.rrb_vector.transients.ensure_editable(root_edit,(arr[li]));
var ccnt = ((((li > (0)))?((rngs[li]) - (rngs[(li - (1))])):(rngs[(0)])) + (32));
if((!(clojure.core.rrb_vector.nodes.overflow_QMARK_(child,(shift - (5)),ccnt)))){
var G__71275 = (shift - (5));
var G__71276 = ccnt;
var G__71277 = root_edit;
var G__71278 = child;
var G__71279 = tail_node;
return (clojure.core.rrb_vector.transients.push_tail_BANG_.cljs$core$IFn$_invoke$arity$5 ? clojure.core.rrb_vector.transients.push_tail_BANG_.cljs$core$IFn$_invoke$arity$5(G__71275,G__71276,G__71277,G__71278,G__71279) : clojure.core.rrb_vector.transients.push_tail_BANG_.call(null,G__71275,G__71276,G__71277,G__71278,G__71279));
} else {
return null;
}
})());
if(cljs.core.truth_(cret)){
(arr[li] = cret);

(rngs[li] = ((rngs[li]) + (32)));

return ret;
} else {
if((li >= (31))){
var msg_71397 = ["Assigning index ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((li + (1)))," of vector"," object array to become a node, when that"," index should only be used for storing"," range arrays."].join('');
var data_71398 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"shift","shift",997140064),shift,new cljs.core.Keyword(null,"cnd","cnd",-521882032),cnt,new cljs.core.Keyword(null,"current-node","current-node",-814308842),current_node,new cljs.core.Keyword(null,"tail-node","tail-node",-1373693221),tail_node,new cljs.core.Keyword(null,"rngs","rngs",-8039697),rngs,new cljs.core.Keyword(null,"li","li",723558921),li,new cljs.core.Keyword(null,"cret","cret",2090504467),cret], null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(msg_71397,data_71398);
} else {
}

(arr[(li + (1))] = clojure.core.rrb_vector.trees.new_path(tail_node.arr,root_edit,(shift - (5)),tail_node));

(rngs[(li + (1))] = ((rngs[li]) + (32)));

(rngs[(32)] = ((rngs[(32)]) + (1)));

return ret;
}
}
});
clojure.core.rrb_vector.transients.pop_tail_BANG_ = (function clojure$core$rrb_vector$transients$pop_tail_BANG_(shift,cnt,root_edit,current_node){
var ret = clojure.core.rrb_vector.transients.ensure_editable(root_edit,current_node);
if(clojure.core.rrb_vector.nodes.regular_QMARK_(ret)){
var subidx = (((cnt - (2)) >> shift) & (31));
if((shift > (5))){
var child = (function (){var G__71307 = (shift - (5));
var G__71308 = cnt;
var G__71309 = root_edit;
var G__71310 = (ret.arr[subidx]);
return (clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4(G__71307,G__71308,G__71309,G__71310) : clojure.core.rrb_vector.transients.pop_tail_BANG_.call(null,G__71307,G__71308,G__71309,G__71310));
})();
if((((child == null)) && ((subidx === (0))))){
return null;
} else {
var arr = ret.arr;
(arr[subidx] = child);

return ret;
}
} else {
if((subidx === (0))){
return null;
} else {
var arr = ret.arr;
(arr[subidx] = null);

return ret;

}
}
} else {
var rngs = clojure.core.rrb_vector.nodes.node_ranges(ret);
var subidx = ((rngs[(32)]) - (1));
if((shift > (5))){
var child = (ret.arr[subidx]);
var child_cnt = (((subidx === (0)))?(rngs[(0)]):((rngs[subidx]) - (rngs[(subidx - (1))])));
var new_child = (function (){var G__71328 = (shift - (5));
var G__71329 = child_cnt;
var G__71330 = root_edit;
var G__71331 = child;
return (clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4(G__71328,G__71329,G__71330,G__71331) : clojure.core.rrb_vector.transients.pop_tail_BANG_.call(null,G__71328,G__71329,G__71330,G__71331));
})();
if((((new_child == null)) && ((subidx === (0))))){
return null;
} else {
if(clojure.core.rrb_vector.nodes.regular_QMARK_(child)){
var arr = ret.arr;
(rngs[subidx] = ((rngs[subidx]) - (32)));

(arr[subidx] = new_child);

if((new_child == null)){
(rngs[(32)] = ((rngs[(32)]) - (1)));
} else {
}

return ret;
} else {
var rng = clojure.core.rrb_vector.nodes.last_range(child);
var diff = (rng - (cljs.core.truth_(new_child)?clojure.core.rrb_vector.nodes.last_range(new_child):(0)));
var arr = ret.arr;
(rngs[subidx] = ((rngs[subidx]) - diff));

(arr[subidx] = new_child);

if((new_child == null)){
(rngs[(32)] = ((rngs[(32)]) - (1)));
} else {
}

return ret;

}
}
} else {
if((subidx === (0))){
return null;
} else {
var arr = ret.arr;
var child = (arr[subidx]);
(arr[subidx] = null);

(rngs[subidx] = (0));

(rngs[(32)] = ((rngs[(32)]) - (1)));

return ret;

}
}
}
});
clojure.core.rrb_vector.transients.do_assoc_BANG_ = (function clojure$core$rrb_vector$transients$do_assoc_BANG_(shift,root_edit,current_node,i,val){
var ret = clojure.core.rrb_vector.transients.ensure_editable(root_edit,current_node);
if(clojure.core.rrb_vector.nodes.regular_QMARK_(ret)){
var shift_71411__$1 = shift;
var node_71412 = ret;
while(true){
if((shift_71411__$1 === (0))){
var arr_71413 = node_71412.arr;
(arr_71413[(i & (31))] = val);
} else {
var arr_71414 = node_71412.arr;
var subidx_71415 = ((i >> shift_71411__$1) & (31));
var child_71416 = clojure.core.rrb_vector.transients.ensure_editable(root_edit,(arr_71414[subidx_71415]));
(arr_71414[subidx_71415] = child_71416);

var G__71419 = (shift_71411__$1 - (5));
var G__71420 = child_71416;
shift_71411__$1 = G__71419;
node_71412 = G__71420;
continue;
}
break;
}
} else {
var arr_71421 = ret.arr;
var rngs_71422 = clojure.core.rrb_vector.nodes.node_ranges(ret);
var subidx_71423 = ((i >> shift) & (31));
var subidx_71424__$1 = (function (){var subidx_71424__$1 = subidx_71423;
while(true){
if((i < ((rngs_71422[subidx_71424__$1]) | (0)))){
return subidx_71424__$1;
} else {
var G__71427 = (subidx_71424__$1 + (1));
subidx_71424__$1 = G__71427;
continue;
}
break;
}
})();
var i_71425__$1 = (((subidx_71424__$1 === (0)))?i:(i - (rngs_71422[(subidx_71424__$1 - (1))])));
(arr_71421[subidx_71424__$1] = (function (){var G__71369 = (shift - (5));
var G__71370 = root_edit;
var G__71371 = (arr_71421[subidx_71424__$1]);
var G__71372 = i_71425__$1;
var G__71373 = val;
return (clojure.core.rrb_vector.transients.do_assoc_BANG_.cljs$core$IFn$_invoke$arity$5 ? clojure.core.rrb_vector.transients.do_assoc_BANG_.cljs$core$IFn$_invoke$arity$5(G__71369,G__71370,G__71371,G__71372,G__71373) : clojure.core.rrb_vector.transients.do_assoc_BANG_.call(null,G__71369,G__71370,G__71371,G__71372,G__71373));
})());
}

return ret;
});

//# sourceMappingURL=clojure.core.rrb_vector.transients.js.map
