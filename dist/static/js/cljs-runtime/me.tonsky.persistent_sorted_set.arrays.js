goog.provide('me.tonsky.persistent_sorted_set.arrays');
me.tonsky.persistent_sorted_set.arrays.if_cljs = (function me$tonsky$persistent_sorted_set$arrays$if_cljs(env,then,else$){
if(cljs.core.truth_(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env))){
return then;
} else {
return else$;
}
});
me.tonsky.persistent_sorted_set.arrays.make_array = (function me$tonsky$persistent_sorted_set$arrays$make_array(size){
return (new Array(size));
});
me.tonsky.persistent_sorted_set.arrays.into_array = (function me$tonsky$persistent_sorted_set$arrays$into_array(aseq){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,x){
a.push(x);

return a;
}),(new Array()),aseq);
});
me.tonsky.persistent_sorted_set.arrays.aclone = (function me$tonsky$persistent_sorted_set$arrays$aclone(from){
return from.slice((0));
});
me.tonsky.persistent_sorted_set.arrays.aconcat = (function me$tonsky$persistent_sorted_set$arrays$aconcat(a,b){
return a.concat(b);
});
me.tonsky.persistent_sorted_set.arrays.amap = (function me$tonsky$persistent_sorted_set$arrays$amap(f,arr){
return arr.map(f);
});
me.tonsky.persistent_sorted_set.arrays.asort = (function me$tonsky$persistent_sorted_set$arrays$asort(arr,cmp){
return arr.sort(cmp);
});
me.tonsky.persistent_sorted_set.arrays.array_QMARK_ = (function me$tonsky$persistent_sorted_set$arrays$array_QMARK_(x){
if((cljs.core._STAR_target_STAR_ === "nodejs")){
return Array.isArray(x);
} else {
return (x instanceof Array);
}
});

//# sourceMappingURL=me.tonsky.persistent_sorted_set.arrays.js.map
