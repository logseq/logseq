goog.provide('missionary.impl.Heap');
missionary.impl.Heap.create = (function missionary$impl$Heap$create(cap){
var G__56817 = (new Array((cap + (1))));
(G__56817[(0)] = (0));

return G__56817;
});
missionary.impl.Heap.size = (function missionary$impl$Heap$size(heap){
return (heap[(0)]);
});
missionary.impl.Heap.enqueue = (function missionary$impl$Heap$enqueue(heap,i){
var j = ((heap[(0)]) + (1));
(heap[(0)] = j);

(heap[j] = i);

var j__$1 = j;
while(true){
if(((1) === j__$1)){
return null;
} else {
var p = (j__$1 >> (1));
var x = (heap[j__$1]);
var y = (heap[p]);
if((y < x)){
return null;
} else {
(heap[p] = x);

(heap[j__$1] = y);

var G__56852 = p;
j__$1 = G__56852;
continue;
}
}
break;
}
});
missionary.impl.Heap.dequeue = (function missionary$impl$Heap$dequeue(heap){
var s = (heap[(0)]);
var i = (heap[(1)]);
(heap[(0)] = (s - (1)));

(heap[(1)] = (heap[s]));

var j_56853 = (1);
while(true){
var l_56854 = (j_56853 << (1));
if((l_56854 < s)){
var x_56855 = (heap[j_56853]);
var y_56856 = (heap[l_56854]);
var r_56857 = (l_56854 + (1));
if((r_56857 < s)){
var z_56858 = (heap[r_56857]);
if((y_56856 < z_56858)){
if((z_56858 < x_56855)){
(heap[r_56857] = x_56855);

(heap[j_56853] = z_56858);

var G__56859 = r_56857;
j_56853 = G__56859;
continue;
} else {
}
} else {
if((y_56856 < x_56855)){
(heap[l_56854] = x_56855);

(heap[j_56853] = y_56856);

var G__56860 = l_56854;
j_56853 = G__56860;
continue;
} else {
}
}
} else {
if((y_56856 < x_56855)){
(heap[l_56854] = x_56855);

(heap[j_56853] = y_56856);

var G__56864 = l_56854;
j_56853 = G__56864;
continue;
} else {
}
}
} else {
}
break;
}

return i;
});

//# sourceMappingURL=missionary.impl.Heap.js.map
