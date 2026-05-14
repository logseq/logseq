goog.provide('clojure.core.rrb_vector.trees');
clojure.core.rrb_vector.trees.new_path = (function clojure$core$rrb_vector$trees$new_path(tail,edit,shift,current_node){
if((tail.length === (32))){
var s = (0);
var n = current_node;
while(true){
if((s === shift)){
return n;
} else {
var arr = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
var ret = cljs.core.__GT_VectorNode(edit,arr);
(arr[(0)] = n);

var G__72478 = (s + (5));
var G__72479 = ret;
s = G__72478;
n = G__72479;
continue;
}
break;
}
} else {
var s = (0);
var n = current_node;
while(true){
if((s === shift)){
return n;
} else {
var arr = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
var rngs = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
var ret = cljs.core.__GT_VectorNode(edit,arr);
(arr[(0)] = n);

(arr[(32)] = rngs);

(rngs[(32)] = (1));

(rngs[(0)] = tail.length);

var G__72480 = (s + (5));
var G__72481 = ret;
s = G__72480;
n = G__72481;
continue;
}
break;
}
}
});
clojure.core.rrb_vector.trees.push_tail = (function clojure$core$rrb_vector$trees$push_tail(shift,cnt,root_edit,current_node,tail_node){
if(clojure.core.rrb_vector.nodes.regular_QMARK_(current_node)){
var arr = cljs.core.aclone(current_node.arr);
var ret = cljs.core.__GT_VectorNode(current_node.edit,arr);
var n_72482 = ret;
var shift_72483__$1 = shift;
while(true){
var arr_72484__$1 = n_72482.arr;
var subidx_72485 = (((cnt - (1)) >> shift_72483__$1) & (31));
if((shift_72483__$1 === (5))){
(arr_72484__$1[subidx_72485] = tail_node);
} else {
var temp__5802__auto___72486 = (arr_72484__$1[subidx_72485]);
if(cljs.core.truth_(temp__5802__auto___72486)){
var child_72487 = temp__5802__auto___72486;
var new_carr_72488 = cljs.core.aclone(child_72487.arr);
var new_child_72489 = cljs.core.__GT_VectorNode(root_edit,new_carr_72488);
(arr_72484__$1[subidx_72485] = new_child_72489);

var G__72490 = new_child_72489;
var G__72491 = (shift_72483__$1 - (5));
n_72482 = G__72490;
shift_72483__$1 = G__72491;
continue;
} else {
(arr_72484__$1[subidx_72485] = clojure.core.rrb_vector.trees.new_path(tail_node.arr,root_edit,(shift_72483__$1 - (5)),tail_node));
}
}
break;
}

return ret;
} else {
var arr = cljs.core.aclone(current_node.arr);
var rngs = clojure.core.rrb_vector.nodes.node_ranges(current_node);
var li = ((rngs[(32)]) - (1));
var ret = cljs.core.__GT_VectorNode(current_node.edit,arr);
var cret = (((shift === (5)))?null:(function (){var child = (arr[li]);
var ccnt = ((((li > (0)))?((rngs[li]) - (rngs[(li - (1))])):(rngs[(0)])) + (32));
if((!(clojure.core.rrb_vector.nodes.overflow_QMARK_(child,(shift - (5)),ccnt)))){
var G__72445 = (shift - (5));
var G__72446 = ccnt;
var G__72447 = root_edit;
var G__72448 = child;
var G__72449 = tail_node;
return (clojure.core.rrb_vector.trees.push_tail.cljs$core$IFn$_invoke$arity$5 ? clojure.core.rrb_vector.trees.push_tail.cljs$core$IFn$_invoke$arity$5(G__72445,G__72446,G__72447,G__72448,G__72449) : clojure.core.rrb_vector.trees.push_tail.call(null,G__72445,G__72446,G__72447,G__72448,G__72449));
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
var msg_72494 = ["Assigning index ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((li + (1)))," of vector"," object array to become a node, when that"," index should only be used for storing"," range arrays."].join('');
var data_72495 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"shift","shift",997140064),shift,new cljs.core.Keyword(null,"cnt","cnt",283978798),cnt,new cljs.core.Keyword(null,"current-node","current-node",-814308842),current_node,new cljs.core.Keyword(null,"tail-node","tail-node",-1373693221),tail_node,new cljs.core.Keyword(null,"rngs","rngs",-8039697),rngs,new cljs.core.Keyword(null,"li","li",723558921),li,new cljs.core.Keyword(null,"cret","cret",2090504467),cret], null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(msg_72494,data_72495);
} else {
}

(arr[(li + (1))] = clojure.core.rrb_vector.trees.new_path(tail_node.arr,root_edit,(shift - (5)),tail_node));

(rngs[(li + (1))] = ((rngs[li]) + (32)));

(rngs[(32)] = ((rngs[(32)]) + (1)));

return ret;
}
}
});
clojure.core.rrb_vector.trees.pop_tail = (function clojure$core$rrb_vector$trees$pop_tail(shift,cnt,root_edit,current_node){
if(clojure.core.rrb_vector.nodes.regular_QMARK_(current_node)){
var subidx = (((cnt - (2)) >> shift) & (31));
if((shift > (5))){
var new_child = (function (){var G__72453 = (shift - (5));
var G__72454 = cnt;
var G__72455 = root_edit;
var G__72456 = (current_node.arr[subidx]);
return (clojure.core.rrb_vector.trees.pop_tail.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.trees.pop_tail.cljs$core$IFn$_invoke$arity$4(G__72453,G__72454,G__72455,G__72456) : clojure.core.rrb_vector.trees.pop_tail.call(null,G__72453,G__72454,G__72455,G__72456));
})();
if((((new_child == null)) && ((subidx === (0))))){
return null;
} else {
var arr = cljs.core.aclone(current_node.arr);
(arr[subidx] = new_child);

return cljs.core.__GT_VectorNode(root_edit,arr);
}
} else {
if((subidx === (0))){
return null;
} else {
var arr = cljs.core.aclone(current_node.arr);
(arr[subidx] = null);

return cljs.core.__GT_VectorNode(root_edit,arr);

}
}
} else {
var rngs = clojure.core.rrb_vector.nodes.node_ranges(current_node);
var subidx = ((rngs[(32)]) - (1));
var new_rngs = cljs.core.aclone(rngs);
if((shift > (5))){
var child = (current_node.arr[subidx]);
var child_cnt = (((subidx === (0)))?(rngs[(0)]):((rngs[subidx]) - (rngs[(subidx - (1))])));
var new_child = (function (){var G__72459 = (shift - (5));
var G__72460 = child_cnt;
var G__72461 = root_edit;
var G__72462 = child;
return (clojure.core.rrb_vector.trees.pop_tail.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.trees.pop_tail.cljs$core$IFn$_invoke$arity$4(G__72459,G__72460,G__72461,G__72462) : clojure.core.rrb_vector.trees.pop_tail.call(null,G__72459,G__72460,G__72461,G__72462));
})();
if((((new_child == null)) && ((subidx === (0))))){
return null;
} else {
if(clojure.core.rrb_vector.nodes.regular_QMARK_(child)){
var arr = cljs.core.aclone(current_node.arr);
(new_rngs[subidx] = ((new_rngs[subidx]) - (32)));

(arr[subidx] = new_child);

(arr[(32)] = new_rngs);

if((new_child == null)){
(new_rngs[(32)] = ((new_rngs[(32)]) - (1)));
} else {
}

return cljs.core.__GT_VectorNode(root_edit,arr);
} else {
var rng = clojure.core.rrb_vector.nodes.last_range(child);
var diff = (rng - (cljs.core.truth_(new_child)?clojure.core.rrb_vector.nodes.last_range(new_child):(0)));
var arr = cljs.core.aclone(current_node.arr);
(new_rngs[subidx] = ((new_rngs[subidx]) - diff));

(arr[subidx] = new_child);

(arr[(32)] = new_rngs);

if((new_child == null)){
(new_rngs[(32)] = ((new_rngs[(32)]) - (1)));
} else {
}

return cljs.core.__GT_VectorNode(root_edit,arr);

}
}
} else {
if((subidx === (0))){
return null;
} else {
var arr = cljs.core.aclone(current_node.arr);
var child = (arr[subidx]);
var new_rngs__$1 = cljs.core.aclone(rngs);
(arr[subidx] = null);

(arr[(32)] = new_rngs__$1);

(new_rngs__$1[subidx] = (0));

(new_rngs__$1[(32)] = ((new_rngs__$1[(32)]) - (1)));

return cljs.core.__GT_VectorNode(root_edit,arr);

}
}
}
});
clojure.core.rrb_vector.trees.do_assoc = (function clojure$core$rrb_vector$trees$do_assoc(shift,current_node,i,val){
if(clojure.core.rrb_vector.nodes.regular_QMARK_(current_node)){
var node = clojure.core.rrb_vector.nodes.clone(shift,current_node);
var shift_72499__$1 = shift;
var node_72500__$1 = node;
while(true){
if((shift_72499__$1 === (0))){
var arr_72501 = node_72500__$1.arr;
(arr_72501[(i & (31))] = val);
} else {
var arr_72502 = node_72500__$1.arr;
var subidx_72503 = ((i >> shift_72499__$1) & (31));
var child_72504 = clojure.core.rrb_vector.nodes.clone(shift_72499__$1,(arr_72502[subidx_72503]));
(arr_72502[subidx_72503] = child_72504);

var G__72506 = (shift_72499__$1 - (5));
var G__72507 = child_72504;
shift_72499__$1 = G__72506;
node_72500__$1 = G__72507;
continue;
}
break;
}

return node;
} else {
var arr = cljs.core.aclone(current_node.arr);
var rngs = clojure.core.rrb_vector.nodes.node_ranges(current_node);
var subidx = ((i >> shift) & (31));
var subidx__$1 = (function (){var subidx__$1 = subidx;
while(true){
if((i < ((rngs[subidx__$1]) | (0)))){
return subidx__$1;
} else {
var G__72508 = (subidx__$1 + (1));
subidx__$1 = G__72508;
continue;
}
break;
}
})();
var i__$1 = (((subidx__$1 === (0)))?i:(i - (rngs[(subidx__$1 - (1))])));
(arr[subidx__$1] = (function (){var G__72468 = (shift - (5));
var G__72469 = (arr[subidx__$1]);
var G__72470 = i__$1;
var G__72471 = val;
return (clojure.core.rrb_vector.trees.do_assoc.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.trees.do_assoc.cljs$core$IFn$_invoke$arity$4(G__72468,G__72469,G__72470,G__72471) : clojure.core.rrb_vector.trees.do_assoc.call(null,G__72468,G__72469,G__72470,G__72471));
})());

return cljs.core.__GT_VectorNode(current_node.edit,arr);
}
});

//# sourceMappingURL=clojure.core.rrb_vector.trees.js.map
