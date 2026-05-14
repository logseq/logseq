goog.provide('missionary.impl.Heap');
missionary.impl.Heap.create = (function missionary$impl$Heap$create(cap){
var G__43152 = (new Array((cap + (1))));
(G__43152[(0)] = (0));

return G__43152;
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

var G__43164 = p;
j__$1 = G__43164;
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

var j_43166 = (1);
while(true){
var l_43167 = (j_43166 << (1));
if((l_43167 < s)){
var x_43168 = (heap[j_43166]);
var y_43169 = (heap[l_43167]);
var r_43170 = (l_43167 + (1));
if((r_43170 < s)){
var z_43172 = (heap[r_43170]);
if((y_43169 < z_43172)){
if((z_43172 < x_43168)){
(heap[r_43170] = x_43168);

(heap[j_43166] = z_43172);

var G__43174 = r_43170;
j_43166 = G__43174;
continue;
} else {
}
} else {
if((y_43169 < x_43168)){
(heap[l_43167] = x_43168);

(heap[j_43166] = y_43169);

var G__43176 = l_43167;
j_43166 = G__43176;
continue;
} else {
}
}
} else {
if((y_43169 < x_43168)){
(heap[l_43167] = x_43168);

(heap[j_43166] = y_43169);

var G__43178 = l_43167;
j_43166 = G__43178;
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
