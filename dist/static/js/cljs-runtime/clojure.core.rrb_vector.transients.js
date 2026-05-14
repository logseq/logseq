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
var n_73050 = ret;
var shift_73051__$1 = shift;
while(true){
var arr_73052 = n_73050.arr;
var subidx_73053 = (((cnt - (1)) >> shift_73051__$1) & (31));
if((shift_73051__$1 === (5))){
(arr_73052[subidx_73053] = tail_node);
} else {
var child_73054 = (arr_73052[subidx_73053]);
if((child_73054 == null)){
(arr_73052[subidx_73053] = clojure.core.rrb_vector.trees.new_path(tail_node.arr,root_edit,(shift_73051__$1 - (5)),tail_node));
} else {
var editable_child_73055 = clojure.core.rrb_vector.transients.ensure_editable(root_edit,child_73054);
(arr_73052[subidx_73053] = editable_child_73055);

var G__73057 = editable_child_73055;
var G__73058 = (shift_73051__$1 - (5));
n_73050 = G__73057;
shift_73051__$1 = G__73058;
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
var G__73027 = (shift - (5));
var G__73028 = ccnt;
var G__73029 = root_edit;
var G__73030 = child;
var G__73031 = tail_node;
return (clojure.core.rrb_vector.transients.push_tail_BANG_.cljs$core$IFn$_invoke$arity$5 ? clojure.core.rrb_vector.transients.push_tail_BANG_.cljs$core$IFn$_invoke$arity$5(G__73027,G__73028,G__73029,G__73030,G__73031) : clojure.core.rrb_vector.transients.push_tail_BANG_.call(null,G__73027,G__73028,G__73029,G__73030,G__73031));
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
var msg_73064 = ["Assigning index ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((li + (1)))," of vector"," object array to become a node, when that"," index should only be used for storing"," range arrays."].join('');
var data_73065 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"shift","shift",997140064),shift,new cljs.core.Keyword(null,"cnd","cnd",-521882032),cnt,new cljs.core.Keyword(null,"current-node","current-node",-814308842),current_node,new cljs.core.Keyword(null,"tail-node","tail-node",-1373693221),tail_node,new cljs.core.Keyword(null,"rngs","rngs",-8039697),rngs,new cljs.core.Keyword(null,"li","li",723558921),li,new cljs.core.Keyword(null,"cret","cret",2090504467),cret], null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(msg_73064,data_73065);
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
var child = (function (){var G__73034 = (shift - (5));
var G__73035 = cnt;
var G__73036 = root_edit;
var G__73037 = (ret.arr[subidx]);
return (clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4(G__73034,G__73035,G__73036,G__73037) : clojure.core.rrb_vector.transients.pop_tail_BANG_.call(null,G__73034,G__73035,G__73036,G__73037));
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
var new_child = (function (){var G__73038 = (shift - (5));
var G__73039 = child_cnt;
var G__73040 = root_edit;
var G__73041 = child;
return (clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4 ? clojure.core.rrb_vector.transients.pop_tail_BANG_.cljs$core$IFn$_invoke$arity$4(G__73038,G__73039,G__73040,G__73041) : clojure.core.rrb_vector.transients.pop_tail_BANG_.call(null,G__73038,G__73039,G__73040,G__73041));
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
var shift_73072__$1 = shift;
var node_73073 = ret;
while(true){
if((shift_73072__$1 === (0))){
var arr_73074 = node_73073.arr;
(arr_73074[(i & (31))] = val);
} else {
var arr_73075 = node_73073.arr;
var subidx_73076 = ((i >> shift_73072__$1) & (31));
var child_73077 = clojure.core.rrb_vector.transients.ensure_editable(root_edit,(arr_73075[subidx_73076]));
(arr_73075[subidx_73076] = child_73077);

var G__73078 = (shift_73072__$1 - (5));
var G__73079 = child_73077;
shift_73072__$1 = G__73078;
node_73073 = G__73079;
continue;
}
break;
}
} else {
var arr_73080 = ret.arr;
var rngs_73081 = clojure.core.rrb_vector.nodes.node_ranges(ret);
var subidx_73082 = ((i >> shift) & (31));
var subidx_73083__$1 = (function (){var subidx_73083__$1 = subidx_73082;
while(true){
if((i < ((rngs_73081[subidx_73083__$1]) | (0)))){
return subidx_73083__$1;
} else {
var G__73085 = (subidx_73083__$1 + (1));
subidx_73083__$1 = G__73085;
continue;
}
break;
}
})();
var i_73084__$1 = (((subidx_73083__$1 === (0)))?i:(i - (rngs_73081[(subidx_73083__$1 - (1))])));
(arr_73080[subidx_73083__$1] = (function (){var G__73044 = (shift - (5));
var G__73045 = root_edit;
var G__73046 = (arr_73080[subidx_73083__$1]);
var G__73047 = i_73084__$1;
var G__73048 = val;
return (clojure.core.rrb_vector.transients.do_assoc_BANG_.cljs$core$IFn$_invoke$arity$5 ? clojure.core.rrb_vector.transients.do_assoc_BANG_.cljs$core$IFn$_invoke$arity$5(G__73044,G__73045,G__73046,G__73047,G__73048) : clojure.core.rrb_vector.transients.do_assoc_BANG_.call(null,G__73044,G__73045,G__73046,G__73047,G__73048));
})());
}

return ret;
});

//# sourceMappingURL=clojure.core.rrb_vector.transients.js.map
