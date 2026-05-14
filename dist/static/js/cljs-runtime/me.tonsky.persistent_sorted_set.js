goog.provide('me.tonsky.persistent_sorted_set');
/**
 * js limitation for bit ops
 */
me.tonsky.persistent_sorted_set.max_safe_path = Math.pow((2),(31));
/**
 * tunable param
 */
me.tonsky.persistent_sorted_set.bits_per_level = (5);
me.tonsky.persistent_sorted_set.max_len = Math.pow((2),me.tonsky.persistent_sorted_set.bits_per_level);
me.tonsky.persistent_sorted_set.min_len = (me.tonsky.persistent_sorted_set.max_len / (2));
me.tonsky.persistent_sorted_set.avg_len = ((me.tonsky.persistent_sorted_set.max_len + me.tonsky.persistent_sorted_set.min_len) >>> (1));
me.tonsky.persistent_sorted_set.max_safe_level = Math.floor(((31) / me.tonsky.persistent_sorted_set.bits_per_level));
me.tonsky.persistent_sorted_set.bit_mask = (me.tonsky.persistent_sorted_set.max_len - (1));
me.tonsky.persistent_sorted_set.factors = me.tonsky.persistent_sorted_set.arrays.into_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45382_SHARP_){
return Math.pow((2),p1__45382_SHARP_);
}),cljs.core.range.cljs$core$IFn$_invoke$arity$3((0),(52),me.tonsky.persistent_sorted_set.bits_per_level)));
me.tonsky.persistent_sorted_set.empty_path = (0);
me.tonsky.persistent_sorted_set.path_get = (function me$tonsky$persistent_sorted_set$path_get(path,level){
if((level < me.tonsky.persistent_sorted_set.max_safe_level)){
return ((path >>> (level * me.tonsky.persistent_sorted_set.bits_per_level)) & me.tonsky.persistent_sorted_set.bit_mask);
} else {
return (Math.floor((path / (me.tonsky.persistent_sorted_set.factors[level]))) & me.tonsky.persistent_sorted_set.bit_mask);
}
});
me.tonsky.persistent_sorted_set.path_set = (function me$tonsky$persistent_sorted_set$path_set(path,level,idx){
var smol_QMARK_ = (((path < me.tonsky.persistent_sorted_set.max_safe_path)) && ((level < me.tonsky.persistent_sorted_set.max_safe_level)));
var old = me.tonsky.persistent_sorted_set.path_get(path,level);
var minus = ((smol_QMARK_)?(old << (level * me.tonsky.persistent_sorted_set.bits_per_level)):(old * (me.tonsky.persistent_sorted_set.factors[level])));
var plus = ((smol_QMARK_)?(idx << (level * me.tonsky.persistent_sorted_set.bits_per_level)):(idx * (me.tonsky.persistent_sorted_set.factors[level])));
return ((path - minus) + plus);
});
me.tonsky.persistent_sorted_set.path_inc = (function me$tonsky$persistent_sorted_set$path_inc(path){
return (path + (1));
});
me.tonsky.persistent_sorted_set.path_dec = (function me$tonsky$persistent_sorted_set$path_dec(path){
return (path - (1));
});
me.tonsky.persistent_sorted_set.path_cmp = (function me$tonsky$persistent_sorted_set$path_cmp(path1,path2){
return (path1 - path2);
});
me.tonsky.persistent_sorted_set.path_lt = (function me$tonsky$persistent_sorted_set$path_lt(path1,path2){
return (path1 < path2);
});
me.tonsky.persistent_sorted_set.path_lte = (function me$tonsky$persistent_sorted_set$path_lte(path1,path2){
return (path1 <= path2);
});
me.tonsky.persistent_sorted_set.path_eq = (function me$tonsky$persistent_sorted_set$path_eq(path1,path2){
return (path1 === path2);
});
me.tonsky.persistent_sorted_set.path_same_leaf = (function me$tonsky$persistent_sorted_set$path_same_leaf(path1,path2){
if((((path1 < me.tonsky.persistent_sorted_set.max_safe_path)) && ((path2 < me.tonsky.persistent_sorted_set.max_safe_path)))){
return ((path1 >>> me.tonsky.persistent_sorted_set.bits_per_level) === (path2 >>> me.tonsky.persistent_sorted_set.bits_per_level));
} else {
return (Math.floor((path1 / me.tonsky.persistent_sorted_set.max_len)) === Math.floor((path2 / me.tonsky.persistent_sorted_set.max_len)));
}
});
me.tonsky.persistent_sorted_set.path_str = (function me$tonsky$persistent_sorted_set$path_str(path){
var res = cljs.core.List.EMPTY;
var path__$1 = path;
while(true){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(path__$1,(0))){
var G__47123 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(res,cljs.core.mod(path__$1,me.tonsky.persistent_sorted_set.max_len));
var G__47124 = Math.floor((path__$1 / me.tonsky.persistent_sorted_set.max_len));
res = G__47123;
path__$1 = G__47124;
continue;
} else {
return cljs.core.vec(res);
}
break;
}
});
me.tonsky.persistent_sorted_set.binary_search_l = (function me$tonsky$persistent_sorted_set$binary_search_l(cmp,arr,r,k){
var l = (0);
var r__$1 = cljs.core.long$(r);
while(true){
if((l <= r__$1)){
var m = ((l + r__$1) >>> (1));
var mk = (arr[m]);
if(((cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(mk,k) : cmp.call(null,mk,k)) < (0))){
var G__47125 = (m + (1));
var G__47126 = r__$1;
l = G__47125;
r__$1 = G__47126;
continue;
} else {
var G__47127 = l;
var G__47128 = (m - (1));
l = G__47127;
r__$1 = G__47128;
continue;
}
} else {
return l;
}
break;
}
});
me.tonsky.persistent_sorted_set.binary_search_r = (function me$tonsky$persistent_sorted_set$binary_search_r(cmp,arr,r,k){
var l = (0);
var r__$1 = cljs.core.long$(r);
while(true){
if((l <= r__$1)){
var m = ((l + r__$1) >>> (1));
var mk = (arr[m]);
if(((cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(mk,k) : cmp.call(null,mk,k)) > (0))){
var G__47136 = l;
var G__47137 = (m - (1));
l = G__47136;
r__$1 = G__47137;
continue;
} else {
var G__47138 = (m + (1));
var G__47139 = r__$1;
l = G__47138;
r__$1 = G__47139;
continue;
}
} else {
return l;
}
break;
}
});
me.tonsky.persistent_sorted_set.lookup_exact = (function me$tonsky$persistent_sorted_set$lookup_exact(cmp,arr,key){
var arr_l = arr.length;
var idx = me.tonsky.persistent_sorted_set.binary_search_l(cmp,arr,(arr_l - (1)),key);
if((((idx < arr_l)) && (((0) === (function (){var G__45422 = (arr[idx]);
var G__45423 = key;
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__45422,G__45423) : cmp.call(null,G__45422,G__45423));
})())))){
return idx;
} else {
return (-1);
}
});
me.tonsky.persistent_sorted_set.lookup_range = (function me$tonsky$persistent_sorted_set$lookup_range(cmp,arr,key){
var arr_l = arr.length;
var idx = me.tonsky.persistent_sorted_set.binary_search_l(cmp,arr,(arr_l - (1)),key);
if((idx === arr_l)){
return (-1);
} else {
return idx;
}
});
me.tonsky.persistent_sorted_set.cut_n_splice = (function me$tonsky$persistent_sorted_set$cut_n_splice(arr,cut_from,cut_to,splice_from,splice_to,xs){
var xs_l = xs.length;
var l1 = (splice_from - cut_from);
var l2 = (cut_to - splice_to);
var l1xs = (l1 + xs_l);
var new_arr = me.tonsky.persistent_sorted_set.arrays.make_array(((l1 + xs_l) + l2));
var l__45202__auto___47144 = (splice_from - cut_from);
var n__5593__auto___47145 = l__45202__auto___47144;
var i__45203__auto___47146 = (0);
while(true){
if((i__45203__auto___47146 < n__5593__auto___47145)){
(new_arr[(i__45203__auto___47146 + (0))] = (arr[(i__45203__auto___47146 + cut_from)]));

var G__47147 = (i__45203__auto___47146 + (1));
i__45203__auto___47146 = G__47147;
continue;
} else {
}
break;
}

var l__45202__auto___47148 = (xs_l - (0));
var n__5593__auto___47149 = l__45202__auto___47148;
var i__45203__auto___47150 = (0);
while(true){
if((i__45203__auto___47150 < n__5593__auto___47149)){
(new_arr[(i__45203__auto___47150 + l1)] = (xs[(i__45203__auto___47150 + (0))]));

var G__47151 = (i__45203__auto___47150 + (1));
i__45203__auto___47150 = G__47151;
continue;
} else {
}
break;
}

var l__45202__auto___47152 = (cut_to - splice_to);
var n__5593__auto___47153 = l__45202__auto___47152;
var i__45203__auto___47154 = (0);
while(true){
if((i__45203__auto___47154 < n__5593__auto___47153)){
(new_arr[(i__45203__auto___47154 + l1xs)] = (arr[(i__45203__auto___47154 + splice_to)]));

var G__47157 = (i__45203__auto___47154 + (1));
i__45203__auto___47154 = G__47157;
continue;
} else {
}
break;
}

return new_arr;
});
me.tonsky.persistent_sorted_set.splice = (function me$tonsky$persistent_sorted_set$splice(arr,splice_from,splice_to,xs){
return me.tonsky.persistent_sorted_set.cut_n_splice(arr,(0),arr.length,splice_from,splice_to,xs);
});
me.tonsky.persistent_sorted_set.insert = (function me$tonsky$persistent_sorted_set$insert(arr,idx,xs){
return me.tonsky.persistent_sorted_set.cut_n_splice(arr,(0),arr.length,idx,idx,xs);
});
me.tonsky.persistent_sorted_set.merge_n_split = (function me$tonsky$persistent_sorted_set$merge_n_split(a1,a2){
var a1_l = a1.length;
var a2_l = a2.length;
var total_l = (a1_l + a2_l);
var r1_l = (total_l >>> (1));
var r2_l = (total_l - r1_l);
var r1 = me.tonsky.persistent_sorted_set.arrays.make_array(r1_l);
var r2 = me.tonsky.persistent_sorted_set.arrays.make_array(r2_l);
if((a1_l <= r1_l)){
var l__45202__auto___47167 = (a1_l - (0));
var n__5593__auto___47168 = l__45202__auto___47167;
var i__45203__auto___47170 = (0);
while(true){
if((i__45203__auto___47170 < n__5593__auto___47168)){
(r1[(i__45203__auto___47170 + (0))] = (a1[(i__45203__auto___47170 + (0))]));

var G__47172 = (i__45203__auto___47170 + (1));
i__45203__auto___47170 = G__47172;
continue;
} else {
}
break;
}

var l__45202__auto___47173 = ((r1_l - a1_l) - (0));
var n__5593__auto___47174 = l__45202__auto___47173;
var i__45203__auto___47175 = (0);
while(true){
if((i__45203__auto___47175 < n__5593__auto___47174)){
(r1[(i__45203__auto___47175 + a1_l)] = (a2[(i__45203__auto___47175 + (0))]));

var G__47176 = (i__45203__auto___47175 + (1));
i__45203__auto___47175 = G__47176;
continue;
} else {
}
break;
}

var l__45202__auto___47177 = (a2_l - (r1_l - a1_l));
var n__5593__auto___47178 = l__45202__auto___47177;
var i__45203__auto___47179 = (0);
while(true){
if((i__45203__auto___47179 < n__5593__auto___47178)){
(r2[(i__45203__auto___47179 + (0))] = (a2[(i__45203__auto___47179 + (r1_l - a1_l))]));

var G__47182 = (i__45203__auto___47179 + (1));
i__45203__auto___47179 = G__47182;
continue;
} else {
}
break;
}
} else {
var l__45202__auto___47183 = (r1_l - (0));
var n__5593__auto___47184 = l__45202__auto___47183;
var i__45203__auto___47185 = (0);
while(true){
if((i__45203__auto___47185 < n__5593__auto___47184)){
(r1[(i__45203__auto___47185 + (0))] = (a1[(i__45203__auto___47185 + (0))]));

var G__47186 = (i__45203__auto___47185 + (1));
i__45203__auto___47185 = G__47186;
continue;
} else {
}
break;
}

var l__45202__auto___47187 = (a1_l - r1_l);
var n__5593__auto___47188 = l__45202__auto___47187;
var i__45203__auto___47189 = (0);
while(true){
if((i__45203__auto___47189 < n__5593__auto___47188)){
(r2[(i__45203__auto___47189 + (0))] = (a1[(i__45203__auto___47189 + r1_l)]));

var G__47190 = (i__45203__auto___47189 + (1));
i__45203__auto___47189 = G__47190;
continue;
} else {
}
break;
}

var l__45202__auto___47191 = (a2_l - (0));
var n__5593__auto___47192 = l__45202__auto___47191;
var i__45203__auto___47193 = (0);
while(true){
if((i__45203__auto___47193 < n__5593__auto___47192)){
(r2[(i__45203__auto___47193 + (a1_l - r1_l))] = (a2[(i__45203__auto___47193 + (0))]));

var G__47194 = (i__45203__auto___47193 + (1));
i__45203__auto___47193 = G__47194;
continue;
} else {
}
break;
}
}

return [r1,r2];
});
me.tonsky.persistent_sorted_set.eq_arr = (function me$tonsky$persistent_sorted_set$eq_arr(cmp,a1,a1_from,a1_to,a2,a2_from,a2_to){
var len = (a1_to - a1_from);
var and__5000__auto__ = (len === (a2_to - a2_from));
if(and__5000__auto__){
var i = (0);
while(true){
if((i === len)){
return true;
} else {
if((!(((0) === (function (){var G__45457 = (a1[(i + a1_from)]);
var G__45458 = (a2[(i + a2_from)]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__45457,G__45458) : cmp.call(null,G__45457,G__45458));
})())))){
return false;
} else {
var G__47196 = (i + (1));
i = G__47196;
continue;

}
}
break;
}
} else {
return and__5000__auto__;
}
});
me.tonsky.persistent_sorted_set.check_n_splice = (function me$tonsky$persistent_sorted_set$check_n_splice(cmp,arr,from,to,new_arr){
if(me.tonsky.persistent_sorted_set.eq_arr(cmp,arr,from,to,new_arr,(0),new_arr.length)){
return arr;
} else {
return me.tonsky.persistent_sorted_set.splice(arr,from,to,new_arr);
}
});
/**
 * Drop non-nil references and return array of arguments
 */
me.tonsky.persistent_sorted_set.return_array = (function me$tonsky$persistent_sorted_set$return_array(var_args){
var G__45468 = arguments.length;
switch (G__45468) {
case 1:
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$1 = (function (a1){
return [a1];
}));

(me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2 = (function (a1,a2){
if(cljs.core.truth_(a1)){
if(cljs.core.truth_(a2)){
return [a1,a2];
} else {
return [a1];
}
} else {
return [a2];
}
}));

(me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$3 = (function (a1,a2,a3){
if(cljs.core.truth_(a1)){
if(cljs.core.truth_(a2)){
if(cljs.core.truth_(a3)){
return [a1,a2,a3];
} else {
return [a1,a2];
}
} else {
if(cljs.core.truth_(a3)){
return [a1,a3];
} else {
return [a1];
}
}
} else {
if(cljs.core.truth_(a2)){
if(cljs.core.truth_(a3)){
return [a2,a3];
} else {
return [a2];
}
} else {
return [a3];
}
}
}));

(me.tonsky.persistent_sorted_set.return_array.cljs$lang$maxFixedArity = 3);


/**
 * @interface
 */
me.tonsky.persistent_sorted_set.INode = function(){};

var me$tonsky$persistent_sorted_set$INode$node_lim_key$dyn_47198 = (function (_){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_lim_key[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5351__auto__.call(null,_));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_lim_key["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5349__auto__.call(null,_));
} else {
throw cljs.core.missing_protocol("INode.node-lim-key",_);
}
}
});
me.tonsky.persistent_sorted_set.node_lim_key = (function me$tonsky$persistent_sorted_set$node_lim_key(_){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_lim_key$arity$1 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_lim_key$arity$1(_);
} else {
return me$tonsky$persistent_sorted_set$INode$node_lim_key$dyn_47198(_);
}
});

var me$tonsky$persistent_sorted_set$INode$node_len$dyn_47199 = (function (_){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_len[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5351__auto__.call(null,_));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_len["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5349__auto__.call(null,_));
} else {
throw cljs.core.missing_protocol("INode.node-len",_);
}
}
});
me.tonsky.persistent_sorted_set.node_len = (function me$tonsky$persistent_sorted_set$node_len(_){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_len$arity$1 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_len$arity$1(_);
} else {
return me$tonsky$persistent_sorted_set$INode$node_len$dyn_47199(_);
}
});

var me$tonsky$persistent_sorted_set$INode$node_merge$dyn_47200 = (function (_,next,storage){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_merge[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,next,storage) : m__5351__auto__.call(null,_,next,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_merge["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,next,storage) : m__5349__auto__.call(null,_,next,storage));
} else {
throw cljs.core.missing_protocol("INode.node-merge",_);
}
}
});
me.tonsky.persistent_sorted_set.node_merge = (function me$tonsky$persistent_sorted_set$node_merge(_,next,storage){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_merge$arity$3 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_merge$arity$3(_,next,storage);
} else {
return me$tonsky$persistent_sorted_set$INode$node_merge$dyn_47200(_,next,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_merge_n_split$dyn_47201 = (function (_,next){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_merge_n_split[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(_,next) : m__5351__auto__.call(null,_,next));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_merge_n_split["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(_,next) : m__5349__auto__.call(null,_,next));
} else {
throw cljs.core.missing_protocol("INode.node-merge-n-split",_);
}
}
});
me.tonsky.persistent_sorted_set.node_merge_n_split = (function me$tonsky$persistent_sorted_set$node_merge_n_split(_,next){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_merge_n_split$arity$2 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_merge_n_split$arity$2(_,next);
} else {
return me$tonsky$persistent_sorted_set$INode$node_merge_n_split$dyn_47201(_,next);
}
});

var me$tonsky$persistent_sorted_set$INode$node_lookup$dyn_47202 = (function (_,cmp,key,storage){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_lookup[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(_,cmp,key,storage) : m__5351__auto__.call(null,_,cmp,key,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_lookup["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(_,cmp,key,storage) : m__5349__auto__.call(null,_,cmp,key,storage));
} else {
throw cljs.core.missing_protocol("INode.node-lookup",_);
}
}
});
me.tonsky.persistent_sorted_set.node_lookup = (function me$tonsky$persistent_sorted_set$node_lookup(_,cmp,key,storage){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_lookup$arity$4 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_lookup$arity$4(_,cmp,key,storage);
} else {
return me$tonsky$persistent_sorted_set$INode$node_lookup$dyn_47202(_,cmp,key,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_child$dyn_47203 = (function (_,idx,storage){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_child[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,idx,storage) : m__5351__auto__.call(null,_,idx,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_child["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,idx,storage) : m__5349__auto__.call(null,_,idx,storage));
} else {
throw cljs.core.missing_protocol("INode.node-child",_);
}
}
});
me.tonsky.persistent_sorted_set.node_child = (function me$tonsky$persistent_sorted_set$node_child(_,idx,storage){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_child$arity$3 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(_,idx,storage);
} else {
return me$tonsky$persistent_sorted_set$INode$node_child$dyn_47203(_,idx,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_conj$dyn_47205 = (function (_,cmp,key,storage){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_conj[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(_,cmp,key,storage) : m__5351__auto__.call(null,_,cmp,key,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_conj["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(_,cmp,key,storage) : m__5349__auto__.call(null,_,cmp,key,storage));
} else {
throw cljs.core.missing_protocol("INode.node-conj",_);
}
}
});
me.tonsky.persistent_sorted_set.node_conj = (function me$tonsky$persistent_sorted_set$node_conj(_,cmp,key,storage){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_conj$arity$4 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_conj$arity$4(_,cmp,key,storage);
} else {
return me$tonsky$persistent_sorted_set$INode$node_conj$dyn_47205(_,cmp,key,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_disj$dyn_47209 = (function (_,cmp,key,root_QMARK_,left,right,storage){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.node_disj[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$7 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$7(_,cmp,key,root_QMARK_,left,right,storage) : m__5351__auto__.call(null,_,cmp,key,root_QMARK_,left,right,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.node_disj["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$7 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$7(_,cmp,key,root_QMARK_,left,right,storage) : m__5349__auto__.call(null,_,cmp,key,root_QMARK_,left,right,storage));
} else {
throw cljs.core.missing_protocol("INode.node-disj",_);
}
}
});
me.tonsky.persistent_sorted_set.node_disj = (function me$tonsky$persistent_sorted_set$node_disj(_,cmp,key,root_QMARK_,left,right,storage){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$INode$node_disj$arity$7 == null)))))){
return _.me$tonsky$persistent_sorted_set$INode$node_disj$arity$7(_,cmp,key,root_QMARK_,left,right,storage);
} else {
return me$tonsky$persistent_sorted_set$INode$node_disj$dyn_47209(_,cmp,key,root_QMARK_,left,right,storage);
}
});

me.tonsky.persistent_sorted_set.set_child_BANG_ = (function me$tonsky$persistent_sorted_set$set_child_BANG_(children,idx,child){
return (children[idx] = child);
});
me.tonsky.persistent_sorted_set.rotate = (function me$tonsky$persistent_sorted_set$rotate(node,root_QMARK_,left,right,storage){
if(cljs.core.truth_(root_QMARK_)){
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$1(node);
} else {
if((me.tonsky.persistent_sorted_set.node_len(node) > me.tonsky.persistent_sorted_set.min_len)){
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$3(left,node,right);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = left;
if(cljs.core.truth_(and__5000__auto__)){
return (me.tonsky.persistent_sorted_set.node_len(left) <= me.tonsky.persistent_sorted_set.min_len);
} else {
return and__5000__auto__;
}
})())){
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.node_merge(left,node,storage),right);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = right;
if(cljs.core.truth_(and__5000__auto__)){
return (me.tonsky.persistent_sorted_set.node_len(right) <= me.tonsky.persistent_sorted_set.min_len);
} else {
return and__5000__auto__;
}
})())){
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2(left,me.tonsky.persistent_sorted_set.node_merge(node,right,storage));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = left;
if(cljs.core.truth_(and__5000__auto__)){
return (((right == null)) || ((me.tonsky.persistent_sorted_set.node_len(left) < me.tonsky.persistent_sorted_set.node_len(right))));
} else {
return and__5000__auto__;
}
})())){
var nodes = me.tonsky.persistent_sorted_set.node_merge_n_split(left,node);
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$3((nodes[(0)]),(nodes[(1)]),right);
} else {
var nodes = me.tonsky.persistent_sorted_set.node_merge_n_split(node,right);
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$3(left,(nodes[(0)]),(nodes[(1)]));

}
}
}
}
}
});

/**
 * @interface
 */
me.tonsky.persistent_sorted_set.IStore = function(){};

var me$tonsky$persistent_sorted_set$IStore$store_aux$dyn_47219 = (function (this$,storage){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set.store_aux[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,storage) : m__5351__auto__.call(null,this$,storage));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set.store_aux["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,storage) : m__5349__auto__.call(null,this$,storage));
} else {
throw cljs.core.missing_protocol("IStore.store-aux",this$);
}
}
});
me.tonsky.persistent_sorted_set.store_aux = (function me$tonsky$persistent_sorted_set$store_aux(this$,storage){
if((((!((this$ == null)))) && ((!((this$.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2 == null)))))){
return this$.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2(this$,storage);
} else {
return me$tonsky$persistent_sorted_set$IStore$store_aux$dyn_47219(this$,storage);
}
});

me.tonsky.persistent_sorted_set.node_addresses__GT_array = (function me$tonsky$persistent_sorted_set$node_addresses__GT_array(children){
var children_addresses = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45688_SHARP_){
return p1__45688_SHARP_._address;
}),children);
return me.tonsky.persistent_sorted_set.arrays.into_array(children_addresses);
});
me.tonsky.persistent_sorted_set.ensure_addresses_BANG_ = (function me$tonsky$persistent_sorted_set$ensure_addresses_BANG_(node,size){
if(cljs.core.empty_QMARK_(node._addresses)){
var addresses = ((cljs.core.seq(node.children))?me.tonsky.persistent_sorted_set.node_addresses__GT_array(node.children):me.tonsky.persistent_sorted_set.arrays.make_array(size));
return (node._addresses = addresses);
} else {
return null;
}
});
me.tonsky.persistent_sorted_set.set_address_BANG_ = (function me$tonsky$persistent_sorted_set$set_address_BANG_(addresses,idx,address){
return (addresses[idx] = address);
});
me.tonsky.persistent_sorted_set.new_node = (function me$tonsky$persistent_sorted_set$new_node(var_args){
var G__45703 = arguments.length;
switch (G__45703) {
case 3:
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3 = (function (keys,children,addresses){
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4(keys,children,addresses,null);
}));

(me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4 = (function (keys,children,addresses,address){
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$5(keys,children,addresses,address,true);
}));

(me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$5 = (function (keys,children,addresses,address,dirty_QMARK_){
var addresses__$1 = (((addresses == null))?((cljs.core.seq(children))?me.tonsky.persistent_sorted_set.node_addresses__GT_array(children):me.tonsky.persistent_sorted_set.arrays.make_array(keys.length)):addresses);
return (new me.tonsky.persistent_sorted_set.Node(keys,children,addresses__$1,address,dirty_QMARK_));
}));

(me.tonsky.persistent_sorted_set.new_node.cljs$lang$maxFixedArity = 5);


/**
* @constructor
 * @implements {me.tonsky.persistent_sorted_set.IStore}
 * @implements {me.tonsky.persistent_sorted_set.INode}
*/
me.tonsky.persistent_sorted_set.Node = (function (keys,children,_addresses,_address,_dirty){
this.keys = keys;
this.children = children;
this._addresses = _addresses;
this._address = _address;
this._dirty = _dirty;
});
(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$IStore$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2 = (function (this$,storage){
var self__ = this;
var this$__$1 = this;
me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(this$__$1,cljs.core.count(self__.children));

cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,addr){
var child = (self__.children[idx]);
if(cljs.core.truth_((function (){var and__5000__auto__ = child;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = (addr == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return child._dirty;
}
} else {
return and__5000__auto__;
}
})())){
if((!((self__.children == null)))){
} else {
throw (new Error("Assert failed: (not (nil? children))"));
}

if((!((child == null)))){
} else {
throw (new Error("Assert failed: (not (nil? child))"));
}

var child_address = me.tonsky.persistent_sorted_set.store_aux(child,storage);
return me.tonsky.persistent_sorted_set.set_address_BANG_(self__._addresses,idx,child_address);
} else {
return null;
}
}),self__._addresses));

var new_address = me.tonsky.persistent_sorted_set.protocol.store(storage,this$__$1,self__._address);
(self__._dirty = false);

(self__._address = new_address);

return new_address;
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_lim_key$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
var arr__45242__auto__ = self__.keys;
return (arr__45242__auto__[(arr__45242__auto__.length - (1))]);
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_len$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.keys.length;
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_merge$arity$3 = (function (this$,next,storage){
var self__ = this;
var this$__$1 = this;
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(self__.keys),cljs.core.count(self__.children))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(next.keys),cljs.core.count(next.children))))){
} else {
throw (new Error("Assert failed: (and (= (count keys) (count children)) (= (count (.-keys next)) (count (.-children next))))"));
}

me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(this$__$1,cljs.core.count(self__.children));

me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(next,cljs.core.count(next.children));

var temp__5804__auto___47234 = next._address;
if(cljs.core.truth_(temp__5804__auto___47234)){
var next_address_47235 = temp__5804__auto___47234;
me.tonsky.persistent_sorted_set.protocol.delete$(storage,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [next_address_47235], null));
} else {
}

return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4(me.tonsky.persistent_sorted_set.arrays.aconcat(self__.keys,next.keys),me.tonsky.persistent_sorted_set.arrays.aconcat(self__.children,next.children),me.tonsky.persistent_sorted_set.arrays.aconcat(self__._addresses,next._addresses),self__._address);
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_merge_n_split$arity$2 = (function (this$,next){
var self__ = this;
var this$__$1 = this;
me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(this$__$1,cljs.core.count(self__.children));

me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(next,cljs.core.count(next.children));

var ks = me.tonsky.persistent_sorted_set.merge_n_split(self__.keys,next.keys);
var ps = me.tonsky.persistent_sorted_set.merge_n_split(self__.children,next.children);
var as = me.tonsky.persistent_sorted_set.merge_n_split(self__._addresses,next._addresses);
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4((ks[(0)]),(ps[(0)]),(as[(0)]),self__._address),me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4((ks[(1)]),(ps[(1)]),(as[(1)]),next._address));
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_child$arity$3 = (function (_this,idx,storage){
var self__ = this;
var _this__$1 = this;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),idx)){
return null;
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(self__.children);
if(and__5000__auto__){
return (self__.children[idx]);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core.seq(self__._addresses);
if(and__5000__auto__){
return (self__._addresses[idx]);
} else {
return and__5000__auto__;
}
}
})())){
} else {
throw (new Error(["Assert failed: ",["Neither child or address exists",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"address","address",559499426),self__._address,new cljs.core.Keyword(null,"keys","keys",1068423698),self__.keys,new cljs.core.Keyword(null,"addresses","addresses",-559529694),self__._addresses,new cljs.core.Keyword(null,"idx","idx",1053688473),idx,new cljs.core.Keyword(null,"children","children",-940561982),self__.children], null))].join(''),"\n","(or (and (seq children) (arrays/aget children idx)) (and (seq _addresses) (arrays/aget _addresses idx)))"].join('')));
}

var child = (self__.children[idx]);
var address = (cljs.core.truth_(self__._addresses)?(self__._addresses[idx]):null);
if(cljs.core.not(child)){
var child_47271__$1 = me.tonsky.persistent_sorted_set.protocol.restore(storage,address);
me.tonsky.persistent_sorted_set.set_child_BANG_(self__.children,idx,child_47271__$1);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = storage;
if(cljs.core.truth_(and__5000__auto__)){
return address;
} else {
return and__5000__auto__;
}
})())){
me.tonsky.persistent_sorted_set.protocol.accessed(storage,address);
} else {
}
}

return (self__.children[idx]);
}
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_lookup$arity$4 = (function (this$,cmp,key,storage){
var self__ = this;
var this$__$1 = this;
var idx = me.tonsky.persistent_sorted_set.lookup_range(cmp,self__.keys,key);
var temp__5804__auto__ = this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,idx,storage);
if(cljs.core.truth_(temp__5804__auto__)){
var child = temp__5804__auto__;
return me.tonsky.persistent_sorted_set.node_lookup(child,cmp,key,storage);
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_conj$arity$4 = (function (this$,cmp,key,storage){
var self__ = this;
var this$__$1 = this;
me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(this$__$1,cljs.core.count(self__.children));

var idx = me.tonsky.persistent_sorted_set.binary_search_l(cmp,self__.keys,(self__.keys.length - (2)),key);
var child = this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,idx,storage);
var nodes = (cljs.core.truth_(child)?me.tonsky.persistent_sorted_set.node_conj(child,cmp,key,storage):null);
if(cljs.core.truth_(nodes)){
var new_keys = me.tonsky.persistent_sorted_set.check_n_splice(cmp,self__.keys,idx,(idx + (1)),me.tonsky.persistent_sorted_set.arrays.amap(me.tonsky.persistent_sorted_set.node_lim_key,nodes));
var new_children = me.tonsky.persistent_sorted_set.splice(self__.children,idx,(idx + (1)),nodes);
var new_addresses = me.tonsky.persistent_sorted_set.splice(self__._addresses,idx,(idx + (1)),me.tonsky.persistent_sorted_set.node_addresses__GT_array(nodes));
if((new_children.length <= me.tonsky.persistent_sorted_set.max_len)){
return [me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4(new_keys,new_children,new_addresses,self__._address)];
} else {
var middle = (new_children.length >>> (1));
return [me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4(new_keys.slice((0),middle),new_children.slice((0),middle),new_addresses.slice((0),middle),self__._address),me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3(new_keys.slice(middle),new_children.slice(middle),new_addresses.slice(middle))];
}
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Node.prototype.me$tonsky$persistent_sorted_set$INode$node_disj$arity$7 = (function (this$,cmp,key,root_QMARK_,left,right,storage){
var self__ = this;
var this$__$1 = this;
me.tonsky.persistent_sorted_set.ensure_addresses_BANG_(this$__$1,cljs.core.count(self__.children));

var idx = me.tonsky.persistent_sorted_set.lookup_range(cmp,self__.keys,key);
if(((-1) === idx)){
return null;
} else {
var child = this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,idx,storage);
var left_child = ((((idx - (1)) >= (0)))?this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,(idx - (1)),storage):null);
var right_child = ((((idx + (1)) < self__.children.length))?this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,(idx + (1)),storage):null);
var disjned = me.tonsky.persistent_sorted_set.node_disj(child,cmp,key,false,left_child,right_child,storage);
if(cljs.core.truth_(disjned)){
var left_idx = (cljs.core.truth_(left_child)?(idx - (1)):idx);
var right_idx = (cljs.core.truth_(right_child)?((2) + idx):((1) + idx));
var new_keys = me.tonsky.persistent_sorted_set.check_n_splice(cmp,self__.keys,left_idx,right_idx,me.tonsky.persistent_sorted_set.arrays.amap(me.tonsky.persistent_sorted_set.node_lim_key,disjned));
var new_children = me.tonsky.persistent_sorted_set.splice(self__.children,left_idx,right_idx,disjned);
var new_addresses = me.tonsky.persistent_sorted_set.splice(self__._addresses,left_idx,right_idx,me.tonsky.persistent_sorted_set.node_addresses__GT_array(disjned));
if((right_idx > left_idx)){
var cut_addresses_47311 = self__._addresses.slice(left_idx,right_idx);
var removed_47312 = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cut_addresses_47311)),cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new_addresses)));
if(cljs.core.truth_((function (){var and__5000__auto__ = storage;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(removed_47312);
} else {
return and__5000__auto__;
}
})())){
me.tonsky.persistent_sorted_set.protocol.delete$(storage,removed_47312);
} else {
}
} else {
}

return me.tonsky.persistent_sorted_set.rotate(me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$4(new_keys,new_children,new_addresses,self__._address),root_QMARK_,left,right,storage);
} else {
return null;
}
}
}));

(me.tonsky.persistent_sorted_set.Node.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"keys","keys",-1586012071,null),new cljs.core.Symbol(null,"children","children",699969545,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_addresses","_addresses",-1083489418,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"_address","_address",1446185928,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"_dirty","_dirty",248309330,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(me.tonsky.persistent_sorted_set.Node.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.Node.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/Node");

(me.tonsky.persistent_sorted_set.Node.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/Node");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/Node.
 */
me.tonsky.persistent_sorted_set.__GT_Node = (function me$tonsky$persistent_sorted_set$__GT_Node(keys,children,_addresses,_address,_dirty){
return (new me.tonsky.persistent_sorted_set.Node(keys,children,_addresses,_address,_dirty));
});

me.tonsky.persistent_sorted_set.new_leaf = (function me$tonsky$persistent_sorted_set$new_leaf(var_args){
var G__45814 = arguments.length;
switch (G__45814) {
case 1:
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1 = (function (keys){
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(keys,null);
}));

(me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2 = (function (keys,address){
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$3(keys,address,true);
}));

(me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$3 = (function (keys,address,dirty){
return (new me.tonsky.persistent_sorted_set.Leaf(keys,address,dirty));
}));

(me.tonsky.persistent_sorted_set.new_leaf.cljs$lang$maxFixedArity = 3);


/**
* @constructor
 * @implements {me.tonsky.persistent_sorted_set.IStore}
 * @implements {me.tonsky.persistent_sorted_set.INode}
*/
me.tonsky.persistent_sorted_set.Leaf = (function (keys,_address,_dirty){
this.keys = keys;
this._address = _address;
this._dirty = _dirty;
});
(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$IStore$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2 = (function (this$,storage){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_((function (){var or__5002__auto__ = self__._dirty;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (self__._address == null);
}
})())){
var new_address = me.tonsky.persistent_sorted_set.protocol.store(storage,this$__$1,self__._address);
(self__._dirty = false);

(self__._address = new_address);

return new_address;
} else {
return self__._address;
}
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_lim_key$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
var arr__45242__auto__ = self__.keys;
return (arr__45242__auto__[(arr__45242__auto__.length - (1))]);
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_len$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.keys.length;
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_merge$arity$3 = (function (_,next,storage){
var self__ = this;
var ___$1 = this;
var temp__5804__auto___47325 = next._address;
if(cljs.core.truth_(temp__5804__auto___47325)){
var next_address_47326 = temp__5804__auto___47325;
me.tonsky.persistent_sorted_set.protocol.delete$(storage,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [next_address_47326], null));
} else {
}

return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.arrays.aconcat(self__.keys,next.keys),self__._address);
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_merge_n_split$arity$2 = (function (_,next){
var self__ = this;
var ___$1 = this;
var ks = me.tonsky.persistent_sorted_set.merge_n_split(self__.keys,next.keys);
return me.tonsky.persistent_sorted_set.return_array.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2((ks[(0)]),self__._address),me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2((ks[(1)]),next._address));
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_child$arity$3 = (function (_this,idx,_storage){
var self__ = this;
var _this__$1 = this;
return (self__.keys[idx]);
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_lookup$arity$4 = (function (this$,cmp,key,storage){
var self__ = this;
var this$__$1 = this;
var idx = me.tonsky.persistent_sorted_set.lookup_exact(cmp,self__.keys,key);
if(((-1) === idx)){
return null;
} else {
return this$__$1.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,idx,storage);
}
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_conj$arity$4 = (function (_,cmp,key,storage){
var self__ = this;
var ___$1 = this;
var idx = me.tonsky.persistent_sorted_set.binary_search_l(cmp,self__.keys,(self__.keys.length - (1)),key);
var keys_l = self__.keys.length;
if((((idx < keys_l)) && (((0) === (function (){var G__45842 = key;
var G__45843 = (self__.keys[idx]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__45842,G__45843) : cmp.call(null,G__45842,G__45843));
})())))){
return null;
} else {
if((keys_l === me.tonsky.persistent_sorted_set.max_len)){
var middle = ((keys_l + (1)) >>> (1));
if((idx > middle)){
return [me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(self__.keys.slice((0),middle),self__._address),me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1(me.tonsky.persistent_sorted_set.cut_n_splice(self__.keys,middle,keys_l,idx,idx,[key]))];
} else {
return [me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.cut_n_splice(self__.keys,(0),middle,idx,idx,[key]),self__._address),me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1(self__.keys.slice(middle,keys_l))];
}
} else {
return [me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(me.tonsky.persistent_sorted_set.splice(self__.keys,idx,idx,[key]),self__._address)];

}
}
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_disj$arity$7 = (function (_,cmp,key,root_QMARK_,left,right,storage){
var self__ = this;
var ___$1 = this;
var idx = me.tonsky.persistent_sorted_set.lookup_exact(cmp,self__.keys,key);
if(((-1) === idx)){
return null;
} else {
var new_keys = me.tonsky.persistent_sorted_set.splice(self__.keys,idx,(idx + (1)),[]);
return me.tonsky.persistent_sorted_set.rotate(me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$2(new_keys,self__._address),root_QMARK_,left,right,storage);
}
}));

(me.tonsky.persistent_sorted_set.Leaf.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"keys","keys",-1586012071,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_address","_address",1446185928,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"_dirty","_dirty",248309330,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(me.tonsky.persistent_sorted_set.Leaf.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.Leaf.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/Leaf");

(me.tonsky.persistent_sorted_set.Leaf.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/Leaf");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/Leaf.
 */
me.tonsky.persistent_sorted_set.__GT_Leaf = (function me$tonsky$persistent_sorted_set$__GT_Leaf(keys,_address,_dirty){
return (new me.tonsky.persistent_sorted_set.Leaf(keys,_address,_dirty));
});



me.tonsky.persistent_sorted_set.uninitialized_hash = null;
me.tonsky.persistent_sorted_set.uninitialized_address = null;

/**
 * @interface
 */
me.tonsky.persistent_sorted_set.IRoot = function(){};

var me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$dyn_47331 = (function (_){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set._ensure_root_node[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5351__auto__.call(null,_));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set._ensure_root_node["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5349__auto__.call(null,_));
} else {
throw cljs.core.missing_protocol("IRoot.-ensure-root-node",_);
}
}
});
me.tonsky.persistent_sorted_set._ensure_root_node = (function me$tonsky$persistent_sorted_set$_ensure_root_node(_){
if((((!((_ == null)))) && ((!((_.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1 == null)))))){
return _.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(_);
} else {
return me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$dyn_47331(_);
}
});


/**
* @constructor
 * @implements {me.tonsky.persistent_sorted_set.IRoot}
 * @implements {cljs.core.IReversible}
 * @implements {cljs.core.ITransientSet}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEditableCollection}
 * @implements {cljs.core.ISet}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {me.tonsky.persistent_sorted_set.IStore}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.ITransientCollection}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.ILookup}
 * @implements {cljs.core.IReduce}
*/
me.tonsky.persistent_sorted_set.BTSet = (function (storage,root,shift,cnt,comparator,meta,_hash,_address){
this.storage = storage;
this.root = root;
this.shift = shift;
this.cnt = cnt;
this.comparator = comparator;
this.meta = meta;
this._hash = _hash;
this._address = _address;
this.cljs$lang$protocol_mask$partition0$ = 2297303311;
this.cljs$lang$protocol_mask$partition1$ = 8332;
});
(me.tonsky.persistent_sorted_set.BTSet.prototype.me$tonsky$persistent_sorted_set$IRoot$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.BTSet.prototype.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var or__5002__auto__ = self__.root;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(self__._address)){
var node = me.tonsky.persistent_sorted_set.protocol.restore(self__.storage,self__._address);
(self__.root = node);

return node;
} else {
return null;
}
}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return cljs.core.pr_str_STAR_(this$);
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,k){
var self__ = this;
var this$__$1 = this;
this$__$1.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null);

return me.tonsky.persistent_sorted_set.node_lookup(self__.root,self__.comparator,k,self__.storage);
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this$,k,not_found){
var self__ = this;
var this$__$1 = this;
this$__$1.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null);

var or__5002__auto__ = me.tonsky.persistent_sorted_set.node_lookup(self__.root,self__.comparator,k,self__.storage);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return not_found;
}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this$,writer,opts){
var self__ = this;
var this$__$1 = this;
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,"#{"," ","}",opts,cljs.core.seq(this$__$1));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.meta;
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return (new me.tonsky.persistent_sorted_set.BTSet(self__.storage,self__.root,self__.shift,self__.cnt,self__.comparator,self__.meta,self__._hash,self__._address));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ICounted$_count$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.cnt;
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.rseq((me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1 ? me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1(this$__$1) : me.tonsky.persistent_sorted_set.btset_iter.call(null,this$__$1)));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IHash$_hash$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var h__5111__auto__ = self__._hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = cljs.core.hash_unordered_coll(this$__$1);
(self__._hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,other){
var self__ = this;
var this$__$1 = this;
return ((cljs.core.set_QMARK_(other)) && ((((self__.cnt === cljs.core.count(other))) && (cljs.core.every_QMARK_((function (p1__45899_SHARP_){
return cljs.core.contains_QMARK_(this$__$1,p1__45899_SHARP_);
}),other)))));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return this$__$1;
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return (new me.tonsky.persistent_sorted_set.BTSet(self__.storage,me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1([]),(0),(0),self__.comparator,self__.meta,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ISet$_disjoin$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return (me.tonsky.persistent_sorted_set.disj.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.disj.cljs$core$IFn$_invoke$arity$3(this$__$1,key,self__.comparator) : me.tonsky.persistent_sorted_set.disj.call(null,this$__$1,key,self__.comparator));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IReduce$_reduce$arity$2 = (function (this$,f){
var self__ = this;
var this$__$1 = this;
var temp__5802__auto__ = (me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1 ? me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1(this$__$1) : me.tonsky.persistent_sorted_set.btset_iter.call(null,this$__$1));
if(cljs.core.truth_(temp__5802__auto__)){
var i = temp__5802__auto__;
return cljs.core._reduce(i,f);
} else {
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IReduce$_reduce$arity$3 = (function (this$,f,start){
var self__ = this;
var this$__$1 = this;
var temp__5802__auto__ = (me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1 ? me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1(this$__$1) : me.tonsky.persistent_sorted_set.btset_iter.call(null,this$__$1));
if(cljs.core.truth_(temp__5802__auto__)){
var i = temp__5802__auto__;
return cljs.core._reduce(i,f,start);
} else {
return start;
}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return (me.tonsky.persistent_sorted_set.conj.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.conj.cljs$core$IFn$_invoke$arity$3(this$__$1,key,self__.comparator) : me.tonsky.persistent_sorted_set.conj.call(null,this$__$1,key,self__.comparator));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return this$__$1;
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.me$tonsky$persistent_sorted_set$IStore$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.BTSet.prototype.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2 = (function (this$,storage_STAR_){
var self__ = this;
var this$__$1 = this;
if((self__.storage == null)){
(self__.storage = storage_STAR_);
} else {
}

this$__$1.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null);

if((self__._address == null)){
if((!((self__.storage == null)))){
} else {
throw (new Error(["Assert failed: ","storage couldn't be nil","\n","(some? storage)"].join('')));
}

(self__._address = me.tonsky.persistent_sorted_set.store_aux(self__.root,self__.storage));
} else {
}

return self__._address;
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return (me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1 ? me.tonsky.persistent_sorted_set.btset_iter.cljs$core$IFn$_invoke$arity$1(this$__$1) : me.tonsky.persistent_sorted_set.btset_iter.call(null,this$__$1));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return (me.tonsky.persistent_sorted_set.disj.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.disj.cljs$core$IFn$_invoke$arity$3(this$__$1,key,self__.comparator) : me.tonsky.persistent_sorted_set.disj.call(null,this$__$1,key,self__.comparator));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_,new_meta){
var self__ = this;
var ___$1 = this;
return (new me.tonsky.persistent_sorted_set.BTSet(self__.storage,self__.root,self__.shift,self__.cnt,self__.comparator,new_meta,self__._hash,self__._address));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return (me.tonsky.persistent_sorted_set.conj.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.conj.cljs$core$IFn$_invoke$arity$3(this$__$1,key,self__.comparator) : me.tonsky.persistent_sorted_set.conj.call(null,this$__$1,key,self__.comparator));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__45991 = (arguments.length - (1));
switch (G__45991) {
case (1):
return self__.cljs$core$IFn$_invoke$arity$1((arguments[(1)]));

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.apply = (function (self__,args45921){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args45921)));
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IFn$_invoke$arity$1 = (function (k){
var self__ = this;
var this$ = this;
return this$.cljs$core$ILookup$_lookup$arity$2(null,k);
}));

(me.tonsky.persistent_sorted_set.BTSet.prototype.cljs$core$IFn$_invoke$arity$2 = (function (k,not_found){
var self__ = this;
var this$ = this;
return this$.cljs$core$ILookup$_lookup$arity$3(null,k,not_found);
}));

(me.tonsky.persistent_sorted_set.BTSet.getBasis = (function (){
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"storage","storage",-787188258,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"root","root",1191874074,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),new cljs.core.Symbol(null,"shift","shift",-1657295705,null),new cljs.core.Symbol(null,"cnt","cnt",1924510325,null),new cljs.core.Symbol(null,"comparator","comparator",-509539107,null),new cljs.core.Symbol(null,"meta","meta",-1154898805,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_hash","_hash",-2130838312,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"_address","_address",1446185928,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(me.tonsky.persistent_sorted_set.BTSet.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.BTSet.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/BTSet");

(me.tonsky.persistent_sorted_set.BTSet.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/BTSet");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/BTSet.
 */
me.tonsky.persistent_sorted_set.__GT_BTSet = (function me$tonsky$persistent_sorted_set$__GT_BTSet(storage,root,shift,cnt,comparator,meta,_hash,_address){
return (new me.tonsky.persistent_sorted_set.BTSet(storage,root,shift,cnt,comparator,meta,_hash,_address));
});

me.tonsky.persistent_sorted_set.child = (function me$tonsky$persistent_sorted_set$child(node,idx,storage){
if((node instanceof me.tonsky.persistent_sorted_set.Node)){
return node.me$tonsky$persistent_sorted_set$INode$node_child$arity$3(null,idx,storage);
} else {
return null;
}
});
me.tonsky.persistent_sorted_set.keys_for = (function me$tonsky$persistent_sorted_set$keys_for(set,path){
var level = set.shift;
var node = me.tonsky.persistent_sorted_set._ensure_root_node(set);
while(true){
if((level > (0))){
var G__47346 = (level - (1));
var G__47347 = me.tonsky.persistent_sorted_set.child(node,me.tonsky.persistent_sorted_set.path_get(path,level),set.storage);
level = G__47346;
node = G__47347;
continue;
} else {
return node.keys;
}
break;
}
});
me.tonsky.persistent_sorted_set.alter_btset = (function me$tonsky$persistent_sorted_set$alter_btset(set,root,shift,cnt){
return (new me.tonsky.persistent_sorted_set.BTSet(set.storage,root,shift,cnt,set.comparator,set.meta,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));
});
me.tonsky.persistent_sorted_set._next_path = (function me$tonsky$persistent_sorted_set$_next_path(set,node,path,level){
var idx = me.tonsky.persistent_sorted_set.path_get(path,level);
if((level > (0))){
var sub_path = (function (){var G__46018 = set;
var G__46019 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__46020 = path;
var G__46021 = (level - (1));
return (me.tonsky.persistent_sorted_set._next_path.cljs$core$IFn$_invoke$arity$4 ? me.tonsky.persistent_sorted_set._next_path.cljs$core$IFn$_invoke$arity$4(G__46018,G__46019,G__46020,G__46021) : me.tonsky.persistent_sorted_set._next_path.call(null,G__46018,G__46019,G__46020,G__46021));
})();
if((sub_path == null)){
if(((idx + (1)) < node.children.length)){
return me.tonsky.persistent_sorted_set.path_set(me.tonsky.persistent_sorted_set.empty_path,level,(idx + (1)));
} else {
return null;
}
} else {
return me.tonsky.persistent_sorted_set.path_set(sub_path,level,idx);
}
} else {
if(((idx + (1)) < node.keys.length)){
return me.tonsky.persistent_sorted_set.path_set(me.tonsky.persistent_sorted_set.empty_path,(0),(idx + (1)));
} else {
return null;
}
}
});
/**
 * Returns rightmost path possible starting from node and going deeper
 */
me.tonsky.persistent_sorted_set._rpath = (function me$tonsky$persistent_sorted_set$_rpath(node,path,level,storage){
var node__$1 = node;
var path__$1 = path;
var level__$1 = level;
while(true){
if((level__$1 > (0))){
var last_idx = (node__$1.children.length - (1));
var node_child = (function (){var or__5002__auto__ = (function (){var arr__45242__auto__ = node__$1.children;
return (arr__45242__auto__[(arr__45242__auto__.length - (1))]);
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return me.tonsky.persistent_sorted_set.child(node__$1,last_idx,storage);
}
})();
var G__47353 = node_child;
var G__47354 = me.tonsky.persistent_sorted_set.path_set(path__$1,level__$1,last_idx);
var G__47355 = (level__$1 - (1));
node__$1 = G__47353;
path__$1 = G__47354;
level__$1 = G__47355;
continue;
} else {
if(cljs.core.truth_(node__$1)){
return me.tonsky.persistent_sorted_set.path_set(path__$1,(0),(node__$1.keys.length - (1)));
} else {
return null;
}
}
break;
}
});
/**
 * Returns path representing next item after `path` in natural traversal order.
 * Will overflow at leaf if at the end of the tree
 */
me.tonsky.persistent_sorted_set.next_path = (function me$tonsky$persistent_sorted_set$next_path(set,path){
if((path < (0))){
return me.tonsky.persistent_sorted_set.empty_path;
} else {
var or__5002__auto__ = me.tonsky.persistent_sorted_set._next_path(set,me.tonsky.persistent_sorted_set._ensure_root_node(set),path,set.shift);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return me.tonsky.persistent_sorted_set.path_inc(me.tonsky.persistent_sorted_set._rpath(me.tonsky.persistent_sorted_set._ensure_root_node(set),me.tonsky.persistent_sorted_set.empty_path,set.shift,set.storage));
}
}
});
me.tonsky.persistent_sorted_set._prev_path = (function me$tonsky$persistent_sorted_set$_prev_path(set,node,path,level){
var idx = me.tonsky.persistent_sorted_set.path_get(path,level);
if(((((0) === level)) && (((0) === idx)))){
return null;
} else {
if(((0) === level)){
return me.tonsky.persistent_sorted_set.path_set(me.tonsky.persistent_sorted_set.empty_path,(0),(idx - (1)));
} else {
if((idx >= me.tonsky.persistent_sorted_set.node_len(node))){
return me.tonsky.persistent_sorted_set._rpath(node,path,level,set.storage);
} else {
var path_SINGLEQUOTE_ = (function (){var G__46046 = set;
var G__46047 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__46048 = path;
var G__46049 = (level - (1));
return (me.tonsky.persistent_sorted_set._prev_path.cljs$core$IFn$_invoke$arity$4 ? me.tonsky.persistent_sorted_set._prev_path.cljs$core$IFn$_invoke$arity$4(G__46046,G__46047,G__46048,G__46049) : me.tonsky.persistent_sorted_set._prev_path.call(null,G__46046,G__46047,G__46048,G__46049));
})();
if((!((path_SINGLEQUOTE_ == null)))){
return me.tonsky.persistent_sorted_set.path_set(path_SINGLEQUOTE_,level,idx);
} else {
if(((0) === idx)){
return null;
} else {
var path_SINGLEQUOTE___$1 = me.tonsky.persistent_sorted_set._rpath(me.tonsky.persistent_sorted_set.child(node,(idx - (1)),set.storage),path,(level - (1)),set.storage);
return me.tonsky.persistent_sorted_set.path_set(path_SINGLEQUOTE___$1,level,(idx - (1)));

}
}

}
}
}
});
/**
 * Returns path representing previous item before `path` in natural traversal order.
 * Will overflow at leaf if at beginning of tree
 */
me.tonsky.persistent_sorted_set.prev_path = (function me$tonsky$persistent_sorted_set$prev_path(set,path){
if((me.tonsky.persistent_sorted_set.path_get(path,(set.shift + (1))) > (0))){
return me.tonsky.persistent_sorted_set._rpath(me.tonsky.persistent_sorted_set._ensure_root_node(set),path,set.shift,set.storage);
} else {
var or__5002__auto__ = me.tonsky.persistent_sorted_set._prev_path(set,me.tonsky.persistent_sorted_set._ensure_root_node(set),path,set.shift);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return me.tonsky.persistent_sorted_set.path_dec(me.tonsky.persistent_sorted_set.empty_path);
}
}
});

/**
 * Iterator that represents the whole set
 */
me.tonsky.persistent_sorted_set.btset_iter = (function me$tonsky$persistent_sorted_set$btset_iter(set){
if((me.tonsky.persistent_sorted_set.node_len(me.tonsky.persistent_sorted_set._ensure_root_node(set)) > (0))){
var left = me.tonsky.persistent_sorted_set.empty_path;
var rpath = me.tonsky.persistent_sorted_set._rpath(me.tonsky.persistent_sorted_set._ensure_root_node(set),me.tonsky.persistent_sorted_set.empty_path,set.shift,set.storage);
var right = me.tonsky.persistent_sorted_set.next_path(set,rpath);
return (me.tonsky.persistent_sorted_set.iter.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.iter.cljs$core$IFn$_invoke$arity$3(set,left,right) : me.tonsky.persistent_sorted_set.iter.call(null,set,left,right));
} else {
return null;
}
});

/**
* @constructor
 * @implements {cljs.core.IIndexed}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.IChunk}
 * @implements {cljs.core.IReduce}
*/
me.tonsky.persistent_sorted_set.Chunk = (function (arr,off,end){
this.arr = arr;
this.off = off;
this.end = end;
this.cljs$lang$protocol_mask$partition0$ = 524306;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$ICounted$_count$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return (self__.end - self__.off);
}));

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (this$,i){
var self__ = this;
var this$__$1 = this;
return (self__.arr[(self__.off + i)]);
}));

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (this$,i,not_found){
var self__ = this;
var this$__$1 = this;
if((((i >= (0))) && ((i < (self__.end - self__.off))))){
return (self__.arr[(self__.off + i)]);
} else {
return not_found;
}
}));

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IChunk$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if((self__.off === self__.end)){
throw (new Error("-drop-first of empty chunk"));
} else {
return (new cljs.core.ArrayChunk(self__.arr,(self__.off + (1)),self__.end));
}
}));

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IReduce$_reduce$arity$2 = (function (this$,f){
var self__ = this;
var this$__$1 = this;
if((self__.off === self__.end)){
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
return cljs.core._reduce(this$__$1.cljs$core$IChunk$_drop_first$arity$1(null),f,(self__.arr[self__.off]));
}
}));

(me.tonsky.persistent_sorted_set.Chunk.prototype.cljs$core$IReduce$_reduce$arity$3 = (function (this$,f,start){
var self__ = this;
var this$__$1 = this;
var val = start;
var n = self__.off;
while(true){
if((n < self__.end)){
var val_SINGLEQUOTE_ = (function (){var G__46142 = val;
var G__46143 = (self__.arr[n]);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__46142,G__46143) : f.call(null,G__46142,G__46143));
})();
if(cljs.core.reduced_QMARK_(val_SINGLEQUOTE_)){
return cljs.core.deref(val_SINGLEQUOTE_);
} else {
var G__47365 = val_SINGLEQUOTE_;
var G__47366 = (n + (1));
val = G__47365;
n = G__47366;
continue;
}
} else {
return val;
}
break;
}
}));

(me.tonsky.persistent_sorted_set.Chunk.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"arr","arr",2115492975,null),new cljs.core.Symbol(null,"off","off",-2047994980,null),new cljs.core.Symbol(null,"end","end",1372345569,null)], null);
}));

(me.tonsky.persistent_sorted_set.Chunk.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.Chunk.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/Chunk");

(me.tonsky.persistent_sorted_set.Chunk.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/Chunk");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/Chunk.
 */
me.tonsky.persistent_sorted_set.__GT_Chunk = (function me$tonsky$persistent_sorted_set$__GT_Chunk(arr,off,end){
return (new me.tonsky.persistent_sorted_set.Chunk(arr,off,end));
});


/**
 * @interface
 */
me.tonsky.persistent_sorted_set.IIter = function(){};

var me$tonsky$persistent_sorted_set$IIter$_copy$dyn_47368 = (function (this$,left,right){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set._copy[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,left,right) : m__5351__auto__.call(null,this$,left,right));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set._copy["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,left,right) : m__5349__auto__.call(null,this$,left,right));
} else {
throw cljs.core.missing_protocol("IIter.-copy",this$);
}
}
});
me.tonsky.persistent_sorted_set._copy = (function me$tonsky$persistent_sorted_set$_copy(this$,left,right){
if((((!((this$ == null)))) && ((!((this$.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3 == null)))))){
return this$.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3(this$,left,right);
} else {
return me$tonsky$persistent_sorted_set$IIter$_copy$dyn_47368(this$,left,right);
}
});


/**
 * @interface
 */
me.tonsky.persistent_sorted_set.ISeek = function(){};

var me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_47372 = (function() {
var G__47373 = null;
var G__47373__2 = (function (this$,key){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set._seek[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,key) : m__5351__auto__.call(null,this$,key));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set._seek["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,key) : m__5349__auto__.call(null,this$,key));
} else {
throw cljs.core.missing_protocol("ISeek.-seek",this$);
}
}
});
var G__47373__3 = (function (this$,key,comparator){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (me.tonsky.persistent_sorted_set._seek[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,key,comparator) : m__5351__auto__.call(null,this$,key,comparator));
} else {
var m__5349__auto__ = (me.tonsky.persistent_sorted_set._seek["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,key,comparator) : m__5349__auto__.call(null,this$,key,comparator));
} else {
throw cljs.core.missing_protocol("ISeek.-seek",this$);
}
}
});
G__47373 = function(this$,key,comparator){
switch(arguments.length){
case 2:
return G__47373__2.call(this,this$,key);
case 3:
return G__47373__3.call(this,this$,key,comparator);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__47373.cljs$core$IFn$_invoke$arity$2 = G__47373__2;
G__47373.cljs$core$IFn$_invoke$arity$3 = G__47373__3;
return G__47373;
})()
;
me.tonsky.persistent_sorted_set._seek = (function me$tonsky$persistent_sorted_set$_seek(var_args){
var G__46246 = arguments.length;
switch (G__46246) {
case 2:
return me.tonsky.persistent_sorted_set._seek.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set._seek.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set._seek.cljs$core$IFn$_invoke$arity$2 = (function (this$,key){
if((((!((this$ == null)))) && ((!((this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$2 == null)))))){
return this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$2(this$,key);
} else {
return me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_47372(this$,key);
}
}));

(me.tonsky.persistent_sorted_set._seek.cljs$core$IFn$_invoke$arity$3 = (function (this$,key,comparator){
if((((!((this$ == null)))) && ((!((this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3 == null)))))){
return this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3(this$,key,comparator);
} else {
return me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_47372(this$,key,comparator);
}
}));

(me.tonsky.persistent_sorted_set._seek.cljs$lang$maxFixedArity = 3);




/**
* @constructor
 * @implements {me.tonsky.persistent_sorted_set.IIter}
 * @implements {cljs.core.IReversible}
 * @implements {me.tonsky.persistent_sorted_set.ISeek}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IChunkedNext}
 * @implements {cljs.core.ISeq}
 * @implements {cljs.core.INext}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IChunkedSeq}
 * @implements {cljs.core.ISequential}
 * @implements {cljs.core.IReduce}
*/
me.tonsky.persistent_sorted_set.Iter = (function (set,left,right,keys,idx){
this.set = set;
this.left = left;
this.right = right;
this.keys = keys;
this.idx = idx;
this.cljs$lang$protocol_mask$partition0$ = 2309488832;
this.cljs$lang$protocol_mask$partition1$ = 1536;
});
(me.tonsky.persistent_sorted_set.Iter.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return cljs.core.pr_str_STAR_(this$);
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.me$tonsky$persistent_sorted_set$ISeek$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Iter.prototype.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return this$__$1.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3(null,key,self__.set.comparator);
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3 = (function (this$,key,cmp){
var self__ = this;
var this$__$1 = this;
if((key == null)){
throw (new Error("seek can't be called with a nil key!"));
} else {
if(cljs.core.nat_int_QMARK_((function (){var G__46351 = (self__.keys[self__.idx]);
var G__46352 = key;
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__46351,G__46352) : cmp.call(null,G__46351,G__46352));
})())){
return this$__$1;
} else {
var temp__5808__auto__ = (me.tonsky.persistent_sorted_set._seek_STAR_.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set._seek_STAR_.cljs$core$IFn$_invoke$arity$3(self__.set,key,cmp) : me.tonsky.persistent_sorted_set._seek_STAR_.call(null,self__.set,key,cmp));
if((temp__5808__auto__ == null)){
return null;
} else {
var left_SINGLEQUOTE_ = temp__5808__auto__;
return (new me.tonsky.persistent_sorted_set.Iter(self__.set,left_SINGLEQUOTE_,self__.right,me.tonsky.persistent_sorted_set.keys_for(self__.set,left_SINGLEQUOTE_),me.tonsky.persistent_sorted_set.path_get(left_SINGLEQUOTE_,(0))));
}

}
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this$,writer,opts){
var self__ = this;
var this$__$1 = this;
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,"("," ",")",opts,cljs.core.seq(this$__$1));
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$INext$_next$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
if(((self__.idx + (1)) < self__.keys.length)){
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.path_inc(self__.left);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
return (new me.tonsky.persistent_sorted_set.Iter(self__.set,left_SINGLEQUOTE_,self__.right,self__.keys,(self__.idx + (1))));
} else {
return null;
}
} else {
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.next_path(self__.set,self__.left);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
return this$__$1.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3(null,left_SINGLEQUOTE_,self__.right);
} else {
return null;
}
}
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
var G__46393 = self__.set;
var G__46394 = me.tonsky.persistent_sorted_set.prev_path(self__.set,self__.left);
var G__46395 = me.tonsky.persistent_sorted_set.prev_path(self__.set,self__.right);
return (me.tonsky.persistent_sorted_set.riter.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.riter.cljs$core$IFn$_invoke$arity$3(G__46393,G__46394,G__46395) : me.tonsky.persistent_sorted_set.riter.call(null,G__46393,G__46394,G__46395));
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,other){
var self__ = this;
var this$__$1 = this;
return cljs.core.equiv_sequential(this$__$1,other);
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IReduce$_reduce$arity$2 = (function (this$,f){
var self__ = this;
var this$__$1 = this;
if((self__.keys == null)){
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
var first = this$__$1.cljs$core$ISeq$_first$arity$1(null);
var temp__5806__auto__ = this$__$1.cljs$core$INext$_next$arity$1(null);
if((temp__5806__auto__ == null)){
return first;
} else {
var next = temp__5806__auto__;
return cljs.core._reduce(next,f,first);
}
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IReduce$_reduce$arity$3 = (function (this$,f,start){
var self__ = this;
var this$__$1 = this;
var left__$1 = self__.left;
var keys__$1 = self__.keys;
var idx__$1 = self__.idx;
var acc = start;
while(true){
if((keys__$1 == null)){
return acc;
} else {
var new_acc = (function (){var G__46413 = acc;
var G__46414 = (keys__$1[idx__$1]);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__46413,G__46414) : f.call(null,G__46413,G__46414));
})();
if(cljs.core.reduced_QMARK_(new_acc)){
return cljs.core.deref(new_acc);
} else {
if(((idx__$1 + (1)) < keys__$1.length)){
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.path_inc(left__$1);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
var G__47388 = left_SINGLEQUOTE_;
var G__47389 = keys__$1;
var G__47390 = (idx__$1 + (1));
var G__47391 = new_acc;
left__$1 = G__47388;
keys__$1 = G__47389;
idx__$1 = G__47390;
acc = G__47391;
continue;
} else {
return new_acc;
}
} else {
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.next_path(self__.set,left__$1);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
var G__47392 = left_SINGLEQUOTE_;
var G__47393 = me.tonsky.persistent_sorted_set.keys_for(self__.set,left_SINGLEQUOTE_);
var G__47394 = me.tonsky.persistent_sorted_set.path_get(left_SINGLEQUOTE_,(0));
var G__47395 = new_acc;
left__$1 = G__47392;
keys__$1 = G__47393;
idx__$1 = G__47394;
acc = G__47395;
continue;
} else {
return new_acc;
}

}
}
}
break;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$ISeq$_first$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
return (self__.keys[self__.idx]);
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$ISeq$_rest$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var or__5002__auto__ = this$__$1.cljs$core$INext$_next$arity$1(null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
return this$__$1;
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var end_idx = ((me.tonsky.persistent_sorted_set.path_same_leaf(self__.left,self__.right))?me.tonsky.persistent_sorted_set.path_get(self__.right,(0)):self__.keys.length);
return (new me.tonsky.persistent_sorted_set.Chunk(self__.keys,self__.idx,end_idx));
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var or__5002__auto__ = this$__$1.cljs$core$IChunkedNext$_chunked_next$arity$1(null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.me$tonsky$persistent_sorted_set$IIter$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.Iter.prototype.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3 = (function (_,l,r){
var self__ = this;
var ___$1 = this;
return (new me.tonsky.persistent_sorted_set.Iter(self__.set,l,r,me.tonsky.persistent_sorted_set.keys_for(self__.set,l),me.tonsky.persistent_sorted_set.path_get(l,(0))));
}));

(me.tonsky.persistent_sorted_set.Iter.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var last = me.tonsky.persistent_sorted_set.path_set(self__.left,(0),(self__.keys.length - (1)));
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.next_path(self__.set,last);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
return this$__$1.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3(null,left_SINGLEQUOTE_,self__.right);
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.Iter.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"set","set",1945134081,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"BTSet","BTSet",-1359820187,null)], null)),new cljs.core.Symbol(null,"left","left",1241415590,null),new cljs.core.Symbol(null,"right","right",1187949694,null),new cljs.core.Symbol(null,"keys","keys",-1586012071,null),new cljs.core.Symbol(null,"idx","idx",-1600747296,null)], null);
}));

(me.tonsky.persistent_sorted_set.Iter.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.Iter.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/Iter");

(me.tonsky.persistent_sorted_set.Iter.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/Iter");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/Iter.
 */
me.tonsky.persistent_sorted_set.__GT_Iter = (function me$tonsky$persistent_sorted_set$__GT_Iter(set,left,right,keys,idx){
return (new me.tonsky.persistent_sorted_set.Iter(set,left,right,keys,idx));
});

me.tonsky.persistent_sorted_set.iter = (function me$tonsky$persistent_sorted_set$iter(set,left,right){
return (new me.tonsky.persistent_sorted_set.Iter(set,left,right,me.tonsky.persistent_sorted_set.keys_for(set,left),me.tonsky.persistent_sorted_set.path_get(left,(0))));
});

/**
* @constructor
 * @implements {me.tonsky.persistent_sorted_set.IIter}
 * @implements {cljs.core.IReversible}
 * @implements {me.tonsky.persistent_sorted_set.ISeek}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.ISeq}
 * @implements {cljs.core.INext}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.ISequential}
*/
me.tonsky.persistent_sorted_set.ReverseIter = (function (set,left,right,keys,idx){
this.set = set;
this.left = left;
this.right = right;
this.keys = keys;
this.idx = idx;
this.cljs$lang$protocol_mask$partition0$ = 2308964544;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(me.tonsky.persistent_sorted_set.ReverseIter.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return cljs.core.pr_str_STAR_(this$);
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.me$tonsky$persistent_sorted_set$ISeek$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
return this$__$1.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3(null,key,self__.set.comparator);
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3 = (function (this$,key,cmp){
var self__ = this;
var this$__$1 = this;
if((key == null)){
throw (new Error("seek can't be called with a nil key!"));
} else {
if(cljs.core.nat_int_QMARK_((function (){var G__46518 = key;
var G__46519 = (self__.keys[self__.idx]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__46518,G__46519) : cmp.call(null,G__46518,G__46519));
})())){
return this$__$1;
} else {
var right_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.prev_path(self__.set,(me.tonsky.persistent_sorted_set._rseek_STAR_.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set._rseek_STAR_.cljs$core$IFn$_invoke$arity$3(self__.set,key,cmp) : me.tonsky.persistent_sorted_set._rseek_STAR_.call(null,self__.set,key,cmp)));
if(((cljs.core.nat_int_QMARK_(right_SINGLEQUOTE_)) && (((me.tonsky.persistent_sorted_set.path_lte(self__.left,right_SINGLEQUOTE_)) && (me.tonsky.persistent_sorted_set.path_lt(right_SINGLEQUOTE_,self__.right)))))){
return (new me.tonsky.persistent_sorted_set.ReverseIter(self__.set,self__.left,right_SINGLEQUOTE_,me.tonsky.persistent_sorted_set.keys_for(self__.set,right_SINGLEQUOTE_),me.tonsky.persistent_sorted_set.path_get(right_SINGLEQUOTE_,(0))));
} else {
return null;
}

}
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this$,writer,opts){
var self__ = this;
var this$__$1 = this;
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,"("," ",")",opts,cljs.core.seq(this$__$1));
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$INext$_next$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
if((self__.idx > (0))){
var right_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.path_dec(self__.right);
if(me.tonsky.persistent_sorted_set.path_lt(self__.left,right_SINGLEQUOTE_)){
return (new me.tonsky.persistent_sorted_set.ReverseIter(self__.set,self__.left,right_SINGLEQUOTE_,self__.keys,(self__.idx - (1))));
} else {
return null;
}
} else {
var right_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.prev_path(self__.set,self__.right);
if(me.tonsky.persistent_sorted_set.path_lt(self__.left,right_SINGLEQUOTE_)){
return this$__$1.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3(null,self__.left,right_SINGLEQUOTE_);
} else {
return null;
}
}
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
return me.tonsky.persistent_sorted_set.iter(self__.set,me.tonsky.persistent_sorted_set.next_path(self__.set,self__.left),me.tonsky.persistent_sorted_set.next_path(self__.set,self__.right));
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,other){
var self__ = this;
var this$__$1 = this;
return cljs.core.equiv_sequential(this$__$1,other);
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$ISeq$_first$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
return (self__.keys[self__.idx]);
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$ISeq$_rest$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var or__5002__auto__ = this$__$1.cljs$core$INext$_next$arity$1(null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keys)){
return this$__$1;
} else {
return null;
}
}));

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.me$tonsky$persistent_sorted_set$IIter$ = cljs.core.PROTOCOL_SENTINEL);

(me.tonsky.persistent_sorted_set.ReverseIter.prototype.me$tonsky$persistent_sorted_set$IIter$_copy$arity$3 = (function (_,l,r){
var self__ = this;
var ___$1 = this;
return (new me.tonsky.persistent_sorted_set.ReverseIter(self__.set,l,r,me.tonsky.persistent_sorted_set.keys_for(self__.set,r),me.tonsky.persistent_sorted_set.path_get(r,(0))));
}));

(me.tonsky.persistent_sorted_set.ReverseIter.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"set","set",1945134081,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"BTSet","BTSet",-1359820187,null)], null)),new cljs.core.Symbol(null,"left","left",1241415590,null),new cljs.core.Symbol(null,"right","right",1187949694,null),new cljs.core.Symbol(null,"keys","keys",-1586012071,null),new cljs.core.Symbol(null,"idx","idx",-1600747296,null)], null);
}));

(me.tonsky.persistent_sorted_set.ReverseIter.cljs$lang$type = true);

(me.tonsky.persistent_sorted_set.ReverseIter.cljs$lang$ctorStr = "me.tonsky.persistent-sorted-set/ReverseIter");

(me.tonsky.persistent_sorted_set.ReverseIter.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"me.tonsky.persistent-sorted-set/ReverseIter");
}));

/**
 * Positional factory function for me.tonsky.persistent-sorted-set/ReverseIter.
 */
me.tonsky.persistent_sorted_set.__GT_ReverseIter = (function me$tonsky$persistent_sorted_set$__GT_ReverseIter(set,left,right,keys,idx){
return (new me.tonsky.persistent_sorted_set.ReverseIter(set,left,right,keys,idx));
});

me.tonsky.persistent_sorted_set.riter = (function me$tonsky$persistent_sorted_set$riter(set,left,right){
return (new me.tonsky.persistent_sorted_set.ReverseIter(set,left,right,me.tonsky.persistent_sorted_set.keys_for(set,right),me.tonsky.persistent_sorted_set.path_get(right,(0))));
});
me.tonsky.persistent_sorted_set._distance = (function me$tonsky$persistent_sorted_set$_distance(set,node,left,right,level){
var idx_l = me.tonsky.persistent_sorted_set.path_get(left,level);
var idx_r = me.tonsky.persistent_sorted_set.path_get(right,level);
if((level > (0))){
if((idx_l === idx_r)){
var G__46590 = set;
var G__46591 = me.tonsky.persistent_sorted_set.child(node,idx_l,set.storage);
var G__46592 = left;
var G__46593 = right;
var G__46594 = (level - (1));
return (me.tonsky.persistent_sorted_set._distance.cljs$core$IFn$_invoke$arity$5 ? me.tonsky.persistent_sorted_set._distance.cljs$core$IFn$_invoke$arity$5(G__46590,G__46591,G__46592,G__46593,G__46594) : me.tonsky.persistent_sorted_set._distance.call(null,G__46590,G__46591,G__46592,G__46593,G__46594));
} else {
var level__$1 = level;
var res = (idx_r - idx_l);
while(true){
if(((0) === level__$1)){
return res;
} else {
var G__47422 = (level__$1 - (1));
var G__47423 = (res * me.tonsky.persistent_sorted_set.avg_len);
level__$1 = G__47422;
res = G__47423;
continue;
}
break;
}
}
} else {
return (idx_r - idx_l);
}
});
me.tonsky.persistent_sorted_set.distance = (function me$tonsky$persistent_sorted_set$distance(set,path_l,path_r){
if(me.tonsky.persistent_sorted_set.path_eq(path_l,path_r)){
return (0);
} else {
if(me.tonsky.persistent_sorted_set.path_eq(me.tonsky.persistent_sorted_set.path_inc(path_l),path_r)){
return (1);
} else {
if(me.tonsky.persistent_sorted_set.path_eq(me.tonsky.persistent_sorted_set.next_path(set,path_l),path_r)){
return (1);
} else {
return me.tonsky.persistent_sorted_set._distance(set,set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null),path_l,path_r,set.shift);

}
}
}
});
me.tonsky.persistent_sorted_set.est_count = (function me$tonsky$persistent_sorted_set$est_count(iter){
return me.tonsky.persistent_sorted_set.distance(iter.set,iter.left,iter.right);
});
/**
 * Returns path to first element >= key,
 * or -1 if all elements in a set < key
 */
me.tonsky.persistent_sorted_set._seek_STAR_ = (function me$tonsky$persistent_sorted_set$_seek_STAR_(set,key,comparator){
if((key == null)){
return me.tonsky.persistent_sorted_set.empty_path;
} else {
var node = set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null);
var path = me.tonsky.persistent_sorted_set.empty_path;
var level = set.shift;
while(true){
if(cljs.core.truth_(node)){
var keys_l = me.tonsky.persistent_sorted_set.node_len(node);
if(((0) === level)){
var keys = node.keys;
var idx = me.tonsky.persistent_sorted_set.binary_search_l(comparator,keys,(keys_l - (1)),key);
if((keys_l === idx)){
return null;
} else {
return me.tonsky.persistent_sorted_set.path_set(path,(0),idx);
}
} else {
var keys = node.keys;
var idx = me.tonsky.persistent_sorted_set.binary_search_l(comparator,keys,(keys_l - (2)),key);
var G__47432 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__47433 = me.tonsky.persistent_sorted_set.path_set(path,level,idx);
var G__47434 = (level - (1));
node = G__47432;
path = G__47433;
level = G__47434;
continue;
}
} else {
return null;
}
break;
}
}
});
/**
 * Returns path to the first element that is > key.
 * If all elements in a set are <= key, returns `(-rpath set) + 1`.
 * It’s a virtual path that is bigger than any path in a tree
 */
me.tonsky.persistent_sorted_set._rseek_STAR_ = (function me$tonsky$persistent_sorted_set$_rseek_STAR_(set,key,comparator){
if((key == null)){
return me.tonsky.persistent_sorted_set.path_inc(me.tonsky.persistent_sorted_set._rpath(set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null),me.tonsky.persistent_sorted_set.empty_path,set.shift,set.storage));
} else {
var node = set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null);
var path = me.tonsky.persistent_sorted_set.empty_path;
var level = set.shift;
while(true){
if(cljs.core.truth_(node)){
var keys_l = me.tonsky.persistent_sorted_set.node_len(node);
if(((0) === level)){
var keys = node.keys;
var idx = me.tonsky.persistent_sorted_set.binary_search_r(comparator,keys,(keys_l - (1)),key);
var res = me.tonsky.persistent_sorted_set.path_set(path,(0),idx);
return res;
} else {
var keys = node.keys;
var idx = me.tonsky.persistent_sorted_set.binary_search_r(comparator,keys,(keys_l - (2)),key);
var res = me.tonsky.persistent_sorted_set.path_set(path,level,idx);
var G__47439 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__47440 = res;
var G__47441 = (level - (1));
node = G__47439;
path = G__47440;
level = G__47441;
continue;
}
} else {
return null;
}
break;
}
}
});
me.tonsky.persistent_sorted_set._slice = (function me$tonsky$persistent_sorted_set$_slice(set,key_from,key_to,comparator){
var temp__5808__auto__ = me.tonsky.persistent_sorted_set._seek_STAR_(set,key_from,comparator);
if((temp__5808__auto__ == null)){
return null;
} else {
var path = temp__5808__auto__;
var till_path = me.tonsky.persistent_sorted_set._rseek_STAR_(set,key_to,comparator);
if(me.tonsky.persistent_sorted_set.path_lt(path,till_path)){
return (new me.tonsky.persistent_sorted_set.Iter(set,path,till_path,me.tonsky.persistent_sorted_set.keys_for(set,path),me.tonsky.persistent_sorted_set.path_get(path,(0))));
} else {
return null;
}
}
});
me.tonsky.persistent_sorted_set.arr_map_inplace = (function me$tonsky$persistent_sorted_set$arr_map_inplace(f,arr){
var len = arr.length;
var i_47446 = (0);
while(true){
if((i_47446 < len)){
(arr[i_47446] = (function (){var G__46595 = (arr[i_47446]);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__46595) : f.call(null,G__46595));
})());

var G__47450 = (i_47446 + (1));
i_47446 = G__47450;
continue;
} else {
}
break;
}

return arr;
});
/**
 * Splits `arr` into arrays of size between min-len and max-len,
 * trying to stick to (min+max)/2
 */
me.tonsky.persistent_sorted_set.arr_partition_approx = (function me$tonsky$persistent_sorted_set$arr_partition_approx(min_len,max_len,arr){
var chunk_len = me.tonsky.persistent_sorted_set.avg_len;
var len = arr.length;
var acc = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
if((len > (0))){
var pos_47454 = (0);
while(true){
var rest_47455 = (len - pos_47454);
if((rest_47455 <= max_len)){
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_47454));
} else {
if((rest_47455 >= (chunk_len + min_len))){
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_47454,(pos_47454 + chunk_len)));

var G__47458 = (pos_47454 + chunk_len);
pos_47454 = G__47458;
continue;
} else {
var piece_len_47459 = (rest_47455 >>> (1));
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_47454,(pos_47454 + piece_len_47459)));

var G__47461 = (pos_47454 + piece_len_47459);
pos_47454 = G__47461;
continue;

}
}
break;
}
} else {
}

return cljs.core.to_array(cljs.core.persistent_BANG_(acc));
});
me.tonsky.persistent_sorted_set.sorted_arr_distinct_QMARK_ = (function me$tonsky$persistent_sorted_set$sorted_arr_distinct_QMARK_(arr,cmp){
var al = arr.length;
if((al <= (1))){
return true;
} else {
var i = (1);
var p = (arr[(0)]);
while(true){
if((i >= al)){
return true;
} else {
var e = (arr[i]);
if(((0) === (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(e,p) : cmp.call(null,e,p)))){
return false;
} else {
var G__47466 = (i + (1));
var G__47467 = e;
i = G__47466;
p = G__47467;
continue;
}
}
break;
}
}
});
/**
 * Filter out repetitive values in a sorted array.
 * Optimized for no-duplicates case
 */
me.tonsky.persistent_sorted_set.sorted_arr_distinct = (function me$tonsky$persistent_sorted_set$sorted_arr_distinct(arr,cmp){
if(me.tonsky.persistent_sorted_set.sorted_arr_distinct_QMARK_(arr,cmp)){
return arr;
} else {
var al = arr.length;
var acc = cljs.core.transient$(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(arr[(0)])], null));
var i = (1);
var p = (arr[(0)]);
while(true){
if((i >= al)){
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.persistent_BANG_(acc));
} else {
var e = (arr[i]);
if(((0) === (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(e,p) : cmp.call(null,e,p)))){
var G__47470 = acc;
var G__47471 = (i + (1));
var G__47472 = e;
acc = G__47470;
i = G__47471;
p = G__47472;
continue;
} else {
var G__47473 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,e);
var G__47474 = (i + (1));
var G__47475 = e;
acc = G__47473;
i = G__47474;
p = G__47475;
continue;
}
}
break;
}
}
});
/**
 * Analogue to [[clojure.core/conj]] with comparator that overrides the one stored in set.
 */
me.tonsky.persistent_sorted_set.conj = (function me$tonsky$persistent_sorted_set$conj(set,key,cmp){
var roots = me.tonsky.persistent_sorted_set.node_conj(set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null),cmp,key,set.storage);
if((roots == null)){
return set;
} else {
if((roots.length === (1))){
return me.tonsky.persistent_sorted_set.alter_btset(set,(roots[(0)]),set.shift,(set.cnt + (1)));
} else {
return me.tonsky.persistent_sorted_set.alter_btset(set,me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3(me.tonsky.persistent_sorted_set.arrays.amap(me.tonsky.persistent_sorted_set.node_lim_key,roots),roots,me.tonsky.persistent_sorted_set.node_addresses__GT_array(roots)),(set.shift + (1)),(set.cnt + (1)));

}
}
});
/**
 * Analogue to [[clojure.core/disj]] with comparator that overrides the one stored in set.
 */
me.tonsky.persistent_sorted_set.disj = (function me$tonsky$persistent_sorted_set$disj(set,key,cmp){
var new_roots = me.tonsky.persistent_sorted_set.node_disj(set.me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$arity$1(null),cmp,key,true,null,null,set.storage);
if((new_roots == null)){
return set;
} else {
var new_root = (new_roots[(0)]);
if((((new_root instanceof me.tonsky.persistent_sorted_set.Node)) && (((1) === new_root.children.length)))){
return me.tonsky.persistent_sorted_set.alter_btset(set,(new_root.children[(0)]),(set.shift - (1)),(set.cnt - (1)));
} else {
return me.tonsky.persistent_sorted_set.alter_btset(set,new_root,set.shift,(set.cnt - (1)));
}
}
});
/**
 * An iterator for part of the set with provided boundaries.
 * `(slice set from to)` returns iterator for all Xs where from <= X <= to.
 * Optionally pass in comparator that will override the one that set uses. Supports efficient [[clojure.core/rseq]].
 */
me.tonsky.persistent_sorted_set.slice = (function me$tonsky$persistent_sorted_set$slice(var_args){
var G__46647 = arguments.length;
switch (G__46647) {
case 3:
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3 = (function (set,key_from,key_to){
return me.tonsky.persistent_sorted_set._slice(set,key_from,key_to,set.comparator);
}));

(me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$4 = (function (set,key_from,key_to,comparator){
return me.tonsky.persistent_sorted_set._slice(set,key_from,key_to,comparator);
}));

(me.tonsky.persistent_sorted_set.slice.cljs$lang$maxFixedArity = 4);

/**
 * A reverse iterator for part of the set with provided boundaries.
 * `(rslice set from to)` returns backwards iterator for all Xs where from <= X <= to.
 * Optionally pass in comparator that will override the one that set uses. Supports efficient [[clojure.core/rseq]].
 */
me.tonsky.persistent_sorted_set.rslice = (function me$tonsky$persistent_sorted_set$rslice(var_args){
var G__46696 = arguments.length;
switch (G__46696) {
case 2:
return me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$2 = (function (set,key){
var G__46718 = me.tonsky.persistent_sorted_set._slice(set,key,key,set.comparator);
if((G__46718 == null)){
return null;
} else {
return cljs.core.rseq(G__46718);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3 = (function (set,key_from,key_to){
var G__46719 = me.tonsky.persistent_sorted_set._slice(set,key_to,key_from,set.comparator);
if((G__46719 == null)){
return null;
} else {
return cljs.core.rseq(G__46719);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$4 = (function (set,key_from,key_to,comparator){
var G__46725 = me.tonsky.persistent_sorted_set._slice(set,key_to,key_from,comparator);
if((G__46725 == null)){
return null;
} else {
return cljs.core.rseq(G__46725);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$lang$maxFixedArity = 4);

/**
 * An efficient way to seek to a specific key in a seq (either returned by [[clojure.core.seq]] or a slice.)
 *   `(seek (seq set) to)` returns iterator for all Xs where to <= X.
 *   Optionally pass in comparator that will override the one that set uses.
 */
me.tonsky.persistent_sorted_set.seek = (function me$tonsky$persistent_sorted_set$seek(var_args){
var G__46758 = arguments.length;
switch (G__46758) {
case 2:
return me.tonsky.persistent_sorted_set.seek.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.seek.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.seek.cljs$core$IFn$_invoke$arity$2 = (function (seq,to){
return me.tonsky.persistent_sorted_set._seek(seq,to);
}));

(me.tonsky.persistent_sorted_set.seek.cljs$core$IFn$_invoke$arity$3 = (function (seq,to,cmp){
return me.tonsky.persistent_sorted_set._seek(seq,to,cmp);
}));

(me.tonsky.persistent_sorted_set.seek.cljs$lang$maxFixedArity = 3);

/**
 * Fast path to create a set if you already have a sorted array of elements on your hands.
 */
me.tonsky.persistent_sorted_set.from_sorted_array = (function me$tonsky$persistent_sorted_set$from_sorted_array(var_args){
var G__46801 = arguments.length;
switch (G__46801) {
case 2:
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$2 = (function (cmp,arr){
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(cmp,arr,arr.length,cljs.core.PersistentArrayMap.EMPTY);
}));

(me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$3 = (function (cmp,arr,_len){
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(cmp,arr,_len,cljs.core.PersistentArrayMap.EMPTY);
}));

(me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4 = (function (cmp,arr,_len,opts){
var leaves = me.tonsky.persistent_sorted_set.arr_map_inplace(me.tonsky.persistent_sorted_set.new_leaf,me.tonsky.persistent_sorted_set.arr_partition_approx(me.tonsky.persistent_sorted_set.min_len,me.tonsky.persistent_sorted_set.max_len,arr));
var storage = new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(opts);
var current_level = leaves;
var shift = (0);
while(true){
var G__46825 = cljs.core.count(current_level);
switch (G__46825) {
case (0):
return (new me.tonsky.persistent_sorted_set.BTSet(storage,me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1([]),(0),(0),cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));

break;
case (1):
return (new me.tonsky.persistent_sorted_set.BTSet(storage,cljs.core.first(current_level),shift,arr.length,cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));

break;
default:
var G__47508 = me.tonsky.persistent_sorted_set.arr_map_inplace(((function (current_level,shift,G__46825,leaves,storage){
return (function (p1__46782_SHARP_){
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3(me.tonsky.persistent_sorted_set.arrays.amap(me.tonsky.persistent_sorted_set.node_lim_key,p1__46782_SHARP_),p1__46782_SHARP_,null);
});})(current_level,shift,G__46825,leaves,storage))
,me.tonsky.persistent_sorted_set.arr_partition_approx(me.tonsky.persistent_sorted_set.min_len,me.tonsky.persistent_sorted_set.max_len,current_level));
var G__47509 = (shift + (1));
current_level = G__47508;
shift = G__47509;
continue;

}
break;
}
}));

(me.tonsky.persistent_sorted_set.from_sorted_array.cljs$lang$maxFixedArity = 4);

/**
 * Create a set with custom comparator and a collection of keys. Useful when you don’t want to call [[clojure.core/apply]] on [[sorted-set-by]].
 */
me.tonsky.persistent_sorted_set.from_sequential = (function me$tonsky$persistent_sorted_set$from_sequential(cmp,seq){
var arr = me.tonsky.persistent_sorted_set.sorted_arr_distinct(me.tonsky.persistent_sorted_set.arrays.asort(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(seq),cmp),cmp);
return me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$2(cmp,arr);
});
/**
 * Create a set with custom comparator, metadata and settings
 */
me.tonsky.persistent_sorted_set.sorted_set_STAR_ = (function me$tonsky$persistent_sorted_set$sorted_set_STAR_(opts){
return (new me.tonsky.persistent_sorted_set.BTSet(new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(opts),me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1([]),(0),(0),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"cmp","cmp",575646375).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.compare;
}
})(),new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(opts),me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));
});
me.tonsky.persistent_sorted_set.sorted_set_by = (function me$tonsky$persistent_sorted_set$sorted_set_by(var_args){
var G__46845 = arguments.length;
switch (G__46845) {
case 1:
return me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___47518 = arguments.length;
var i__5727__auto___47519 = (0);
while(true){
if((i__5727__auto___47519 < len__5726__auto___47518)){
args_arr__5751__auto__.push((arguments[i__5727__auto___47519]));

var G__47520 = (i__5727__auto___47519 + (1));
i__5727__auto___47519 = G__47520;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((1) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((1)),(0),null)):null);
return me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5752__auto__);

}
});

(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$1 = (function (cmp){
return (new me.tonsky.persistent_sorted_set.BTSet(null,me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1([]),(0),(0),cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));
}));

(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = (function (cmp,keys){
return me.tonsky.persistent_sorted_set.from_sequential(cmp,keys);
}));

/** @this {Function} */
(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$lang$applyTo = (function (seq46842){
var G__46843 = cljs.core.first(seq46842);
var seq46842__$1 = cljs.core.next(seq46842);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__46843,seq46842__$1);
}));

(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$lang$maxFixedArity = (1));

me.tonsky.persistent_sorted_set.sorted_set = (function me$tonsky$persistent_sorted_set$sorted_set(var_args){
var G__46868 = arguments.length;
switch (G__46868) {
case 0:
return me.tonsky.persistent_sorted_set.sorted_set.cljs$core$IFn$_invoke$arity$0();

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___47529 = arguments.length;
var i__5727__auto___47530 = (0);
while(true){
if((i__5727__auto___47530 < len__5726__auto___47529)){
args_arr__5751__auto__.push((arguments[i__5727__auto___47530]));

var G__47532 = (i__5727__auto___47530 + (1));
i__5727__auto___47530 = G__47532;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((0) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((0)),(0),null)):null);
return me.tonsky.persistent_sorted_set.sorted_set.cljs$core$IFn$_invoke$arity$variadic(argseq__5752__auto__);

}
});

(me.tonsky.persistent_sorted_set.sorted_set.cljs$core$IFn$_invoke$arity$0 = (function (){
return me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$1(cljs.core.compare);
}));

(me.tonsky.persistent_sorted_set.sorted_set.cljs$core$IFn$_invoke$arity$variadic = (function (keys){
return me.tonsky.persistent_sorted_set.from_sequential(cljs.core.compare,keys);
}));

/** @this {Function} */
(me.tonsky.persistent_sorted_set.sorted_set.cljs$lang$applyTo = (function (seq46867){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq46867));
}));

(me.tonsky.persistent_sorted_set.sorted_set.cljs$lang$maxFixedArity = (0));

/**
 * Constructs lazily-loaded set from storage, root address and custom comparator.
 * Supports all operations that normal in-memory impl would,
 * will fetch missing nodes by calling IStorage::restore when needed
 */
me.tonsky.persistent_sorted_set.restore_by = (function me$tonsky$persistent_sorted_set$restore_by(var_args){
var G__46884 = arguments.length;
switch (G__46884) {
case 3:
return me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$3 = (function (cmp,address,storage){
return me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(cmp,address,storage,cljs.core.PersistentArrayMap.EMPTY);
}));

(me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4 = (function (cmp,address,storage,p__46894){
var map__46896 = p__46894;
var map__46896__$1 = cljs.core.__destructure_map(map__46896);
var set_metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46896__$1,new cljs.core.Keyword(null,"set-metadata","set-metadata",1293757705));
return (new me.tonsky.persistent_sorted_set.BTSet(storage,null,new cljs.core.Keyword(null,"shift","shift",997140064).cljs$core$IFn$_invoke$arity$1(set_metadata),new cljs.core.Keyword(null,"count","count",2139924085).cljs$core$IFn$_invoke$arity$1(set_metadata),cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,address));
}));

(me.tonsky.persistent_sorted_set.restore_by.cljs$lang$maxFixedArity = 4);

/**
 * Constructs lazily-loaded set from storage and root address.
 * Supports all operations that normal in-memory impl would,
 * will fetch missing nodes by calling IStorage::restore when needed
 */
me.tonsky.persistent_sorted_set.restore = (function me$tonsky$persistent_sorted_set$restore(var_args){
var G__46914 = arguments.length;
switch (G__46914) {
case 2:
return me.tonsky.persistent_sorted_set.restore.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return me.tonsky.persistent_sorted_set.restore.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.restore.cljs$core$IFn$_invoke$arity$2 = (function (address,storage){
return me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(cljs.core.compare,address,storage,cljs.core.PersistentArrayMap.EMPTY);
}));

(me.tonsky.persistent_sorted_set.restore.cljs$core$IFn$_invoke$arity$3 = (function (address,storage,opts){
return me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(cljs.core.compare,address,storage,opts);
}));

(me.tonsky.persistent_sorted_set.restore.cljs$lang$maxFixedArity = 3);

/**
 * Store each not-yet-stored node by calling IStorage::store and remembering
 * returned address. Incremental, won’t store same node twice on subsequent calls.
 * Returns root address. Remember it and use it for restore
 */
me.tonsky.persistent_sorted_set.store = (function me$tonsky$persistent_sorted_set$store(var_args){
var G__46924 = arguments.length;
switch (G__46924) {
case 1:
return me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$1 = (function (set){
if((!((set.storage == null)))){
} else {
throw (new Error("Assert failed: (some? (.-storage set))"));
}

return set.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2(null,set.storage);
}));

(me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$2 = (function (set,storage){
return set.me$tonsky$persistent_sorted_set$IStore$store_aux$arity$2(null,storage);
}));

(me.tonsky.persistent_sorted_set.store.cljs$lang$maxFixedArity = 2);

me.tonsky.persistent_sorted_set.settings = (function me$tonsky$persistent_sorted_set$settings(set){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"branching-factor","branching-factor",1903198601),me.tonsky.persistent_sorted_set.max_len,new cljs.core.Keyword(null,"ref-type","ref-type",-1367328851),new cljs.core.Keyword(null,"strong","strong",269529000)], null);
});

//# sourceMappingURL=me.tonsky.persistent_sorted_set.js.map
