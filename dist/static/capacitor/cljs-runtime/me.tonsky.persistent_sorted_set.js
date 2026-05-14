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
me.tonsky.persistent_sorted_set.factors = me.tonsky.persistent_sorted_set.arrays.into_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__43212_SHARP_){
return Math.pow((2),p1__43212_SHARP_);
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
var G__43808 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(res,cljs.core.mod(path__$1,me.tonsky.persistent_sorted_set.max_len));
var G__43809 = Math.floor((path__$1 / me.tonsky.persistent_sorted_set.max_len));
res = G__43808;
path__$1 = G__43809;
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
var G__43811 = (m + (1));
var G__43812 = r__$1;
l = G__43811;
r__$1 = G__43812;
continue;
} else {
var G__43813 = l;
var G__43814 = (m - (1));
l = G__43813;
r__$1 = G__43814;
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
var G__43816 = l;
var G__43817 = (m - (1));
l = G__43816;
r__$1 = G__43817;
continue;
} else {
var G__43818 = (m + (1));
var G__43819 = r__$1;
l = G__43818;
r__$1 = G__43819;
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
if((((idx < arr_l)) && (((0) === (function (){var G__43238 = (arr[idx]);
var G__43239 = key;
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__43238,G__43239) : cmp.call(null,G__43238,G__43239));
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
var l__43134__auto___43821 = (splice_from - cut_from);
var n__5593__auto___43822 = l__43134__auto___43821;
var i__43135__auto___43823 = (0);
while(true){
if((i__43135__auto___43823 < n__5593__auto___43822)){
(new_arr[(i__43135__auto___43823 + (0))] = (arr[(i__43135__auto___43823 + cut_from)]));

var G__43824 = (i__43135__auto___43823 + (1));
i__43135__auto___43823 = G__43824;
continue;
} else {
}
break;
}

var l__43134__auto___43825 = (xs_l - (0));
var n__5593__auto___43826 = l__43134__auto___43825;
var i__43135__auto___43827 = (0);
while(true){
if((i__43135__auto___43827 < n__5593__auto___43826)){
(new_arr[(i__43135__auto___43827 + l1)] = (xs[(i__43135__auto___43827 + (0))]));

var G__43829 = (i__43135__auto___43827 + (1));
i__43135__auto___43827 = G__43829;
continue;
} else {
}
break;
}

var l__43134__auto___43830 = (cut_to - splice_to);
var n__5593__auto___43831 = l__43134__auto___43830;
var i__43135__auto___43832 = (0);
while(true){
if((i__43135__auto___43832 < n__5593__auto___43831)){
(new_arr[(i__43135__auto___43832 + l1xs)] = (arr[(i__43135__auto___43832 + splice_to)]));

var G__43833 = (i__43135__auto___43832 + (1));
i__43135__auto___43832 = G__43833;
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
var l__43134__auto___43834 = (a1_l - (0));
var n__5593__auto___43835 = l__43134__auto___43834;
var i__43135__auto___43836 = (0);
while(true){
if((i__43135__auto___43836 < n__5593__auto___43835)){
(r1[(i__43135__auto___43836 + (0))] = (a1[(i__43135__auto___43836 + (0))]));

var G__43837 = (i__43135__auto___43836 + (1));
i__43135__auto___43836 = G__43837;
continue;
} else {
}
break;
}

var l__43134__auto___43838 = ((r1_l - a1_l) - (0));
var n__5593__auto___43839 = l__43134__auto___43838;
var i__43135__auto___43840 = (0);
while(true){
if((i__43135__auto___43840 < n__5593__auto___43839)){
(r1[(i__43135__auto___43840 + a1_l)] = (a2[(i__43135__auto___43840 + (0))]));

var G__43841 = (i__43135__auto___43840 + (1));
i__43135__auto___43840 = G__43841;
continue;
} else {
}
break;
}

var l__43134__auto___43842 = (a2_l - (r1_l - a1_l));
var n__5593__auto___43843 = l__43134__auto___43842;
var i__43135__auto___43844 = (0);
while(true){
if((i__43135__auto___43844 < n__5593__auto___43843)){
(r2[(i__43135__auto___43844 + (0))] = (a2[(i__43135__auto___43844 + (r1_l - a1_l))]));

var G__43845 = (i__43135__auto___43844 + (1));
i__43135__auto___43844 = G__43845;
continue;
} else {
}
break;
}
} else {
var l__43134__auto___43846 = (r1_l - (0));
var n__5593__auto___43847 = l__43134__auto___43846;
var i__43135__auto___43848 = (0);
while(true){
if((i__43135__auto___43848 < n__5593__auto___43847)){
(r1[(i__43135__auto___43848 + (0))] = (a1[(i__43135__auto___43848 + (0))]));

var G__43849 = (i__43135__auto___43848 + (1));
i__43135__auto___43848 = G__43849;
continue;
} else {
}
break;
}

var l__43134__auto___43850 = (a1_l - r1_l);
var n__5593__auto___43851 = l__43134__auto___43850;
var i__43135__auto___43852 = (0);
while(true){
if((i__43135__auto___43852 < n__5593__auto___43851)){
(r2[(i__43135__auto___43852 + (0))] = (a1[(i__43135__auto___43852 + r1_l)]));

var G__43853 = (i__43135__auto___43852 + (1));
i__43135__auto___43852 = G__43853;
continue;
} else {
}
break;
}

var l__43134__auto___43854 = (a2_l - (0));
var n__5593__auto___43855 = l__43134__auto___43854;
var i__43135__auto___43856 = (0);
while(true){
if((i__43135__auto___43856 < n__5593__auto___43855)){
(r2[(i__43135__auto___43856 + (a1_l - r1_l))] = (a2[(i__43135__auto___43856 + (0))]));

var G__43857 = (i__43135__auto___43856 + (1));
i__43135__auto___43856 = G__43857;
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
if((!(((0) === (function (){var G__43267 = (a1[(i + a1_from)]);
var G__43268 = (a2[(i + a2_from)]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__43267,G__43268) : cmp.call(null,G__43267,G__43268));
})())))){
return false;
} else {
var G__43859 = (i + (1));
i = G__43859;
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
var G__43280 = arguments.length;
switch (G__43280) {
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

var me$tonsky$persistent_sorted_set$INode$node_lim_key$dyn_43871 = (function (_){
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
return me$tonsky$persistent_sorted_set$INode$node_lim_key$dyn_43871(_);
}
});

var me$tonsky$persistent_sorted_set$INode$node_len$dyn_43872 = (function (_){
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
return me$tonsky$persistent_sorted_set$INode$node_len$dyn_43872(_);
}
});

var me$tonsky$persistent_sorted_set$INode$node_merge$dyn_43874 = (function (_,next,storage){
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
return me$tonsky$persistent_sorted_set$INode$node_merge$dyn_43874(_,next,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_merge_n_split$dyn_43881 = (function (_,next){
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
return me$tonsky$persistent_sorted_set$INode$node_merge_n_split$dyn_43881(_,next);
}
});

var me$tonsky$persistent_sorted_set$INode$node_lookup$dyn_43883 = (function (_,cmp,key,storage){
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
return me$tonsky$persistent_sorted_set$INode$node_lookup$dyn_43883(_,cmp,key,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_child$dyn_43884 = (function (_,idx,storage){
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
return me$tonsky$persistent_sorted_set$INode$node_child$dyn_43884(_,idx,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_conj$dyn_43886 = (function (_,cmp,key,storage){
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
return me$tonsky$persistent_sorted_set$INode$node_conj$dyn_43886(_,cmp,key,storage);
}
});

var me$tonsky$persistent_sorted_set$INode$node_disj$dyn_43887 = (function (_,cmp,key,root_QMARK_,left,right,storage){
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
return me$tonsky$persistent_sorted_set$INode$node_disj$dyn_43887(_,cmp,key,root_QMARK_,left,right,storage);
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

var me$tonsky$persistent_sorted_set$IStore$store_aux$dyn_43892 = (function (this$,storage){
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
return me$tonsky$persistent_sorted_set$IStore$store_aux$dyn_43892(this$,storage);
}
});

me.tonsky.persistent_sorted_set.node_addresses__GT_array = (function me$tonsky$persistent_sorted_set$node_addresses__GT_array(children){
var children_addresses = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__43398_SHARP_){
return p1__43398_SHARP_._address;
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
var G__43404 = arguments.length;
switch (G__43404) {
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
var arr__43150__auto__ = self__.keys;
return (arr__43150__auto__[(arr__43150__auto__.length - (1))]);
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

var temp__5804__auto___43908 = next._address;
if(cljs.core.truth_(temp__5804__auto___43908)){
var next_address_43909 = temp__5804__auto___43908;
me.tonsky.persistent_sorted_set.protocol.delete$(storage,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [next_address_43909], null));
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
var child_43911__$1 = me.tonsky.persistent_sorted_set.protocol.restore(storage,address);
me.tonsky.persistent_sorted_set.set_child_BANG_(self__.children,idx,child_43911__$1);
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
var cut_addresses_43914 = self__._addresses.slice(left_idx,right_idx);
var removed_43915 = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cut_addresses_43914)),cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new_addresses)));
if(cljs.core.truth_((function (){var and__5000__auto__ = storage;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(removed_43915);
} else {
return and__5000__auto__;
}
})())){
me.tonsky.persistent_sorted_set.protocol.delete$(storage,removed_43915);
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
var G__43445 = arguments.length;
switch (G__43445) {
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
var arr__43150__auto__ = self__.keys;
return (arr__43150__auto__[(arr__43150__auto__.length - (1))]);
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_len$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.keys.length;
}));

(me.tonsky.persistent_sorted_set.Leaf.prototype.me$tonsky$persistent_sorted_set$INode$node_merge$arity$3 = (function (_,next,storage){
var self__ = this;
var ___$1 = this;
var temp__5804__auto___43919 = next._address;
if(cljs.core.truth_(temp__5804__auto___43919)){
var next_address_43920 = temp__5804__auto___43919;
me.tonsky.persistent_sorted_set.protocol.delete$(storage,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [next_address_43920], null));
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
if((((idx < keys_l)) && (((0) === (function (){var G__43454 = key;
var G__43455 = (self__.keys[idx]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__43454,G__43455) : cmp.call(null,G__43454,G__43455));
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

var me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$dyn_43921 = (function (_){
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
return me$tonsky$persistent_sorted_set$IRoot$_ensure_root_node$dyn_43921(_);
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
return ((cljs.core.set_QMARK_(other)) && ((((self__.cnt === cljs.core.count(other))) && (cljs.core.every_QMARK_((function (p1__43460_SHARP_){
return cljs.core.contains_QMARK_(this$__$1,p1__43460_SHARP_);
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
var G__43473 = (arguments.length - (1));
switch (G__43473) {
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

(me.tonsky.persistent_sorted_set.BTSet.prototype.apply = (function (self__,args43461){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43461)));
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
var G__43939 = (level - (1));
var G__43940 = me.tonsky.persistent_sorted_set.child(node,me.tonsky.persistent_sorted_set.path_get(path,level),set.storage);
level = G__43939;
node = G__43940;
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
var sub_path = (function (){var G__43480 = set;
var G__43481 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__43482 = path;
var G__43483 = (level - (1));
return (me.tonsky.persistent_sorted_set._next_path.cljs$core$IFn$_invoke$arity$4 ? me.tonsky.persistent_sorted_set._next_path.cljs$core$IFn$_invoke$arity$4(G__43480,G__43481,G__43482,G__43483) : me.tonsky.persistent_sorted_set._next_path.call(null,G__43480,G__43481,G__43482,G__43483));
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
var node_child = (function (){var or__5002__auto__ = (function (){var arr__43150__auto__ = node__$1.children;
return (arr__43150__auto__[(arr__43150__auto__.length - (1))]);
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return me.tonsky.persistent_sorted_set.child(node__$1,last_idx,storage);
}
})();
var G__43947 = node_child;
var G__43948 = me.tonsky.persistent_sorted_set.path_set(path__$1,level__$1,last_idx);
var G__43949 = (level__$1 - (1));
node__$1 = G__43947;
path__$1 = G__43948;
level__$1 = G__43949;
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
var path_SINGLEQUOTE_ = (function (){var G__43499 = set;
var G__43500 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__43501 = path;
var G__43502 = (level - (1));
return (me.tonsky.persistent_sorted_set._prev_path.cljs$core$IFn$_invoke$arity$4 ? me.tonsky.persistent_sorted_set._prev_path.cljs$core$IFn$_invoke$arity$4(G__43499,G__43500,G__43501,G__43502) : me.tonsky.persistent_sorted_set._prev_path.call(null,G__43499,G__43500,G__43501,G__43502));
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
var val_SINGLEQUOTE_ = (function (){var G__43508 = val;
var G__43509 = (self__.arr[n]);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__43508,G__43509) : f.call(null,G__43508,G__43509));
})();
if(cljs.core.reduced_QMARK_(val_SINGLEQUOTE_)){
return cljs.core.deref(val_SINGLEQUOTE_);
} else {
var G__43960 = val_SINGLEQUOTE_;
var G__43961 = (n + (1));
val = G__43960;
n = G__43961;
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

var me$tonsky$persistent_sorted_set$IIter$_copy$dyn_43962 = (function (this$,left,right){
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
return me$tonsky$persistent_sorted_set$IIter$_copy$dyn_43962(this$,left,right);
}
});


/**
 * @interface
 */
me.tonsky.persistent_sorted_set.ISeek = function(){};

var me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_43967 = (function() {
var G__43968 = null;
var G__43968__2 = (function (this$,key){
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
var G__43968__3 = (function (this$,key,comparator){
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
G__43968 = function(this$,key,comparator){
switch(arguments.length){
case 2:
return G__43968__2.call(this,this$,key);
case 3:
return G__43968__3.call(this,this$,key,comparator);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__43968.cljs$core$IFn$_invoke$arity$2 = G__43968__2;
G__43968.cljs$core$IFn$_invoke$arity$3 = G__43968__3;
return G__43968;
})()
;
me.tonsky.persistent_sorted_set._seek = (function me$tonsky$persistent_sorted_set$_seek(var_args){
var G__43539 = arguments.length;
switch (G__43539) {
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
return me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_43967(this$,key);
}
}));

(me.tonsky.persistent_sorted_set._seek.cljs$core$IFn$_invoke$arity$3 = (function (this$,key,comparator){
if((((!((this$ == null)))) && ((!((this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3 == null)))))){
return this$.me$tonsky$persistent_sorted_set$ISeek$_seek$arity$3(this$,key,comparator);
} else {
return me$tonsky$persistent_sorted_set$ISeek$_seek$dyn_43967(this$,key,comparator);
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
if(cljs.core.nat_int_QMARK_((function (){var G__43551 = (self__.keys[self__.idx]);
var G__43552 = key;
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__43551,G__43552) : cmp.call(null,G__43551,G__43552));
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
var G__43553 = self__.set;
var G__43554 = me.tonsky.persistent_sorted_set.prev_path(self__.set,self__.left);
var G__43555 = me.tonsky.persistent_sorted_set.prev_path(self__.set,self__.right);
return (me.tonsky.persistent_sorted_set.riter.cljs$core$IFn$_invoke$arity$3 ? me.tonsky.persistent_sorted_set.riter.cljs$core$IFn$_invoke$arity$3(G__43553,G__43554,G__43555) : me.tonsky.persistent_sorted_set.riter.call(null,G__43553,G__43554,G__43555));
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
var new_acc = (function (){var G__43556 = acc;
var G__43557 = (keys__$1[idx__$1]);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__43556,G__43557) : f.call(null,G__43556,G__43557));
})();
if(cljs.core.reduced_QMARK_(new_acc)){
return cljs.core.deref(new_acc);
} else {
if(((idx__$1 + (1)) < keys__$1.length)){
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.path_inc(left__$1);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
var G__43992 = left_SINGLEQUOTE_;
var G__43993 = keys__$1;
var G__43994 = (idx__$1 + (1));
var G__43995 = new_acc;
left__$1 = G__43992;
keys__$1 = G__43993;
idx__$1 = G__43994;
acc = G__43995;
continue;
} else {
return new_acc;
}
} else {
var left_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.next_path(self__.set,left__$1);
if(me.tonsky.persistent_sorted_set.path_lt(left_SINGLEQUOTE_,self__.right)){
var G__43998 = left_SINGLEQUOTE_;
var G__43999 = me.tonsky.persistent_sorted_set.keys_for(self__.set,left_SINGLEQUOTE_);
var G__44000 = me.tonsky.persistent_sorted_set.path_get(left_SINGLEQUOTE_,(0));
var G__44001 = new_acc;
left__$1 = G__43998;
keys__$1 = G__43999;
idx__$1 = G__44000;
acc = G__44001;
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
if(cljs.core.nat_int_QMARK_((function (){var G__43586 = key;
var G__43587 = (self__.keys[self__.idx]);
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__43586,G__43587) : cmp.call(null,G__43586,G__43587));
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
var G__43625 = set;
var G__43626 = me.tonsky.persistent_sorted_set.child(node,idx_l,set.storage);
var G__43627 = left;
var G__43628 = right;
var G__43629 = (level - (1));
return (me.tonsky.persistent_sorted_set._distance.cljs$core$IFn$_invoke$arity$5 ? me.tonsky.persistent_sorted_set._distance.cljs$core$IFn$_invoke$arity$5(G__43625,G__43626,G__43627,G__43628,G__43629) : me.tonsky.persistent_sorted_set._distance.call(null,G__43625,G__43626,G__43627,G__43628,G__43629));
} else {
var level__$1 = level;
var res = (idx_r - idx_l);
while(true){
if(((0) === level__$1)){
return res;
} else {
var G__44065 = (level__$1 - (1));
var G__44066 = (res * me.tonsky.persistent_sorted_set.avg_len);
level__$1 = G__44065;
res = G__44066;
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
var G__44091 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__44092 = me.tonsky.persistent_sorted_set.path_set(path,level,idx);
var G__44093 = (level - (1));
node = G__44091;
path = G__44092;
level = G__44093;
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
var G__44129 = me.tonsky.persistent_sorted_set.child(node,idx,set.storage);
var G__44130 = res;
var G__44131 = (level - (1));
node = G__44129;
path = G__44130;
level = G__44131;
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
var i_44143 = (0);
while(true){
if((i_44143 < len)){
(arr[i_44143] = (function (){var G__43673 = (arr[i_44143]);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__43673) : f.call(null,G__43673));
})());

var G__44151 = (i_44143 + (1));
i_44143 = G__44151;
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
var pos_44164 = (0);
while(true){
var rest_44165 = (len - pos_44164);
if((rest_44165 <= max_len)){
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_44164));
} else {
if((rest_44165 >= (chunk_len + min_len))){
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_44164,(pos_44164 + chunk_len)));

var G__44171 = (pos_44164 + chunk_len);
pos_44164 = G__44171;
continue;
} else {
var piece_len_44172 = (rest_44165 >>> (1));
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,arr.slice(pos_44164,(pos_44164 + piece_len_44172)));

var G__44183 = (pos_44164 + piece_len_44172);
pos_44164 = G__44183;
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
var G__44200 = (i + (1));
var G__44201 = e;
i = G__44200;
p = G__44201;
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
var G__44213 = acc;
var G__44214 = (i + (1));
var G__44215 = e;
acc = G__44213;
i = G__44214;
p = G__44215;
continue;
} else {
var G__44216 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,e);
var G__44217 = (i + (1));
var G__44218 = e;
acc = G__44216;
i = G__44217;
p = G__44218;
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
var G__43706 = arguments.length;
switch (G__43706) {
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
var G__43708 = arguments.length;
switch (G__43708) {
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
var G__43709 = me.tonsky.persistent_sorted_set._slice(set,key,key,set.comparator);
if((G__43709 == null)){
return null;
} else {
return cljs.core.rseq(G__43709);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3 = (function (set,key_from,key_to){
var G__43710 = me.tonsky.persistent_sorted_set._slice(set,key_to,key_from,set.comparator);
if((G__43710 == null)){
return null;
} else {
return cljs.core.rseq(G__43710);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$4 = (function (set,key_from,key_to,comparator){
var G__43711 = me.tonsky.persistent_sorted_set._slice(set,key_to,key_from,comparator);
if((G__43711 == null)){
return null;
} else {
return cljs.core.rseq(G__43711);
}
}));

(me.tonsky.persistent_sorted_set.rslice.cljs$lang$maxFixedArity = 4);

/**
 * An efficient way to seek to a specific key in a seq (either returned by [[clojure.core.seq]] or a slice.)
 *   `(seek (seq set) to)` returns iterator for all Xs where to <= X.
 *   Optionally pass in comparator that will override the one that set uses.
 */
me.tonsky.persistent_sorted_set.seek = (function me$tonsky$persistent_sorted_set$seek(var_args){
var G__43713 = arguments.length;
switch (G__43713) {
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
var G__43716 = arguments.length;
switch (G__43716) {
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
var G__43717 = cljs.core.count(current_level);
switch (G__43717) {
case (0):
return (new me.tonsky.persistent_sorted_set.BTSet(storage,me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$1([]),(0),(0),cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));

break;
case (1):
return (new me.tonsky.persistent_sorted_set.BTSet(storage,cljs.core.first(current_level),shift,arr.length,cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,me.tonsky.persistent_sorted_set.uninitialized_address));

break;
default:
var G__44341 = me.tonsky.persistent_sorted_set.arr_map_inplace(((function (current_level,shift,G__43717,leaves,storage){
return (function (p1__43714_SHARP_){
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$3(me.tonsky.persistent_sorted_set.arrays.amap(me.tonsky.persistent_sorted_set.node_lim_key,p1__43714_SHARP_),p1__43714_SHARP_,null);
});})(current_level,shift,G__43717,leaves,storage))
,me.tonsky.persistent_sorted_set.arr_partition_approx(me.tonsky.persistent_sorted_set.min_len,me.tonsky.persistent_sorted_set.max_len,current_level));
var G__44342 = (shift + (1));
current_level = G__44341;
shift = G__44342;
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
var G__43721 = arguments.length;
switch (G__43721) {
case 1:
return me.tonsky.persistent_sorted_set.sorted_set_by.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___44347 = arguments.length;
var i__5727__auto___44348 = (0);
while(true){
if((i__5727__auto___44348 < len__5726__auto___44347)){
args_arr__5751__auto__.push((arguments[i__5727__auto___44348]));

var G__44350 = (i__5727__auto___44348 + (1));
i__5727__auto___44348 = G__44350;
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
(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$lang$applyTo = (function (seq43719){
var G__43720 = cljs.core.first(seq43719);
var seq43719__$1 = cljs.core.next(seq43719);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__43720,seq43719__$1);
}));

(me.tonsky.persistent_sorted_set.sorted_set_by.cljs$lang$maxFixedArity = (1));

me.tonsky.persistent_sorted_set.sorted_set = (function me$tonsky$persistent_sorted_set$sorted_set(var_args){
var G__43724 = arguments.length;
switch (G__43724) {
case 0:
return me.tonsky.persistent_sorted_set.sorted_set.cljs$core$IFn$_invoke$arity$0();

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___44353 = arguments.length;
var i__5727__auto___44354 = (0);
while(true){
if((i__5727__auto___44354 < len__5726__auto___44353)){
args_arr__5751__auto__.push((arguments[i__5727__auto___44354]));

var G__44357 = (i__5727__auto___44354 + (1));
i__5727__auto___44354 = G__44357;
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
(me.tonsky.persistent_sorted_set.sorted_set.cljs$lang$applyTo = (function (seq43723){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq43723));
}));

(me.tonsky.persistent_sorted_set.sorted_set.cljs$lang$maxFixedArity = (0));

/**
 * Constructs lazily-loaded set from storage, root address and custom comparator.
 * Supports all operations that normal in-memory impl would,
 * will fetch missing nodes by calling IStorage::restore when needed
 */
me.tonsky.persistent_sorted_set.restore_by = (function me$tonsky$persistent_sorted_set$restore_by(var_args){
var G__43737 = arguments.length;
switch (G__43737) {
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

(me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4 = (function (cmp,address,storage,p__43742){
var map__43743 = p__43742;
var map__43743__$1 = cljs.core.__destructure_map(map__43743);
var set_metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43743__$1,new cljs.core.Keyword(null,"set-metadata","set-metadata",1293757705));
return (new me.tonsky.persistent_sorted_set.BTSet(storage,null,new cljs.core.Keyword(null,"shift","shift",997140064).cljs$core$IFn$_invoke$arity$1(set_metadata),new cljs.core.Keyword(null,"count","count",2139924085).cljs$core$IFn$_invoke$arity$1(set_metadata),cmp,null,me.tonsky.persistent_sorted_set.uninitialized_hash,address));
}));

(me.tonsky.persistent_sorted_set.restore_by.cljs$lang$maxFixedArity = 4);

/**
 * Constructs lazily-loaded set from storage and root address.
 * Supports all operations that normal in-memory impl would,
 * will fetch missing nodes by calling IStorage::restore when needed
 */
me.tonsky.persistent_sorted_set.restore = (function me$tonsky$persistent_sorted_set$restore(var_args){
var G__43747 = arguments.length;
switch (G__43747) {
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
var G__43758 = arguments.length;
switch (G__43758) {
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
