goog.provide('logseq.clj_fractional_indexing');
logseq.clj_fractional_indexing.base_62_digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
logseq.clj_fractional_indexing.char__GT_int = (function logseq$clj_fractional_indexing$char__GT_int(c){
return c.charCodeAt((0));
});
logseq.clj_fractional_indexing.get_integer_length = (function logseq$clj_fractional_indexing$get_integer_length(head){
var head_char = logseq.clj_fractional_indexing.char__GT_int(head);
if((((head_char >= logseq.clj_fractional_indexing.char__GT_int("a"))) && ((head_char <= logseq.clj_fractional_indexing.char__GT_int("z"))))){
return ((head_char - logseq.clj_fractional_indexing.char__GT_int("a")) + (2));
} else {
if((((head_char >= logseq.clj_fractional_indexing.char__GT_int("A"))) && ((head_char <= logseq.clj_fractional_indexing.char__GT_int("Z"))))){
return ((logseq.clj_fractional_indexing.char__GT_int("Z") - head_char) + (2));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["invalid order key head: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(head)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"head","head",-771383919),head], null));

}
}
});
logseq.clj_fractional_indexing.validate_integer = (function logseq$clj_fractional_indexing$validate_integer(int$){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(int$),logseq.clj_fractional_indexing.get_integer_length(cljs.core.first(int$)))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["invalid integer part of order key: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(int$)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"int","int",-1741416922),int$], null));
}
});
logseq.clj_fractional_indexing.str_slice = (function logseq$clj_fractional_indexing$str_slice(var_args){
var G__61845 = arguments.length;
switch (G__61845) {
case 2:
return logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2 = (function (s,i){
return logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3(s,i,cljs.core.count(s));
}));

(logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3 = (function (s,start,end){
if(cljs.core.truth_((function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return (((cljs.core.count(s) >= start)) && ((((cljs.core.count(s) >= end)) && ((end > start)))));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,start,end);
} else {
return "";
}
}));

(logseq.clj_fractional_indexing.str_slice.cljs$lang$maxFixedArity = 3);

logseq.clj_fractional_indexing.get_integer_part = (function logseq$clj_fractional_indexing$get_integer_part(key){
var integer_part_length = logseq.clj_fractional_indexing.get_integer_length(cljs.core.first(key));
if((integer_part_length > cljs.core.count(key))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["invalid order key: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),key], null));
} else {
}

return logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3(key,(0),integer_part_length);
});
logseq.clj_fractional_indexing.validate_order_key = (function logseq$clj_fractional_indexing$validate_order_key(key,digits){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,["A",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((26),cljs.core.first(digits))))].join(''))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["invalid order key: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),key], null));
} else {
}

var i = logseq.clj_fractional_indexing.get_integer_part(key);
var f = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(key,((i).length));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(f),cljs.core.first(digits))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["invalid order key: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),key], null));
} else {
return null;
}
});
logseq.clj_fractional_indexing.increment_integer = (function logseq$clj_fractional_indexing$increment_integer(x,digits){
logseq.clj_fractional_indexing.validate_integer(x);

var vec__61864 = cljs.core.seq(x);
var seq__61865 = cljs.core.seq(vec__61864);
var first__61866 = cljs.core.first(seq__61865);
var seq__61865__$1 = cljs.core.next(seq__61865);
var head = first__61866;
var digs = seq__61865__$1;
var vec__61867 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__61872,dig){
var vec__61873 = p__61872;
var carry_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61873,(0),null);
var digs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61873,(1),null);
if(cljs.core.truth_(carry_QMARK_)){
var d = (digits.indexOf(cljs.core.str.cljs$core$IFn$_invoke$arity$1(dig)) + (1));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(d,cljs.core.count(digits))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(digs__$1,cljs.core.first(digits))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(digs__$1,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(digits,d))], null);
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [carry_QMARK_,digs__$1], null);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,cljs.core.PersistentVector.EMPTY], null),cljs.core.reverse(digs));
var carry_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61867,(0),null);
var diff = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61867,(1),null);
var digs__$1 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(cljs.core.vec(digs),(0),(cljs.core.count(digs) - cljs.core.count(diff))),cljs.core.reverse(diff));
if(cljs.core.truth_(carry_QMARK_)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(head,"Z")){
return ["a",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(digits))].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(head,"z")){
return null;
} else {
var h = cljs.core.char$((logseq.clj_fractional_indexing.char__GT_int(head) + (1)));
var digs__$2 = (((cljs.core.compare(h,"a") > (0)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(digs__$1,cljs.core.first(digits)):cljs.core.pop(digs__$1));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(h),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,digs__$2))].join('');

}
}
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(head),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,digs__$1))].join('');
}
});
logseq.clj_fractional_indexing.decrement_integer = (function logseq$clj_fractional_indexing$decrement_integer(x,digits){
logseq.clj_fractional_indexing.validate_integer(x);

var vec__61885 = cljs.core.seq(x);
var seq__61886 = cljs.core.seq(vec__61885);
var first__61887 = cljs.core.first(seq__61886);
var seq__61886__$1 = cljs.core.next(seq__61886);
var head = first__61887;
var digs = seq__61886__$1;
var vec__61888 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__61893,dig){
var vec__61895 = p__61893;
var borrow_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61895,(0),null);
var acc = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61895,(1),null);
if(cljs.core.not(borrow_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,dig)], null);
} else {
var d = (digits.indexOf(cljs.core.str.cljs$core$IFn$_invoke$arity$1(dig)) - (1));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(d,(-1))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,cljs.core.last(digits))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(digits,d))], null);
}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,cljs.core.PersistentVector.EMPTY], null),cljs.core.reverse(digs));
var borrow = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61888,(0),null);
var new_digs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61888,(1),null);
var new_digs__$1 = cljs.core.vec(cljs.core.reverse(new_digs));
if(cljs.core.truth_(borrow)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(head,"a")){
return ["Z",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(digits))].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(head,"A")){
return null;
} else {
var h = cljs.core.char$((logseq.clj_fractional_indexing.char__GT_int(head) - (1)));
var new_digs__$2 = (((cljs.core.compare(h,"Z") < (0)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_digs__$1,cljs.core.last(digits)):cljs.core.pop(new_digs__$1));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(h),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,new_digs__$2))].join('');

}
}
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(head),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,new_digs__$1))].join('');
}
});
logseq.clj_fractional_indexing.midpoint = (function logseq$clj_fractional_indexing$midpoint(a,b,digits){
var zero = cljs.core.first(digits);
if(cljs.core.truth_((function (){var and__5000__auto__ = b;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.compare(a,b) >= (0));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(a)," >= ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(b)].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b], null));
} else {
}

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(a),zero)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(b),zero)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(" trailing zero",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b], null));
} else {
}

var n = (cljs.core.truth_(b)?cljs.core.first(cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (i,_c){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.nth.cljs$core$IFn$_invoke$arity$3(a,i,zero),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(b,i))){
return null;
} else {
return i;
}
}),b)):null);
if(cljs.core.truth_((function (){var and__5000__auto__ = n;
if(cljs.core.truth_(and__5000__auto__)){
return (n > (0));
} else {
return and__5000__auto__;
}
})())){
return [logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3(b,(0),n),cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__61919 = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(a,n);
var G__61920 = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(b,n);
var G__61921 = digits;
return (logseq.clj_fractional_indexing.midpoint.cljs$core$IFn$_invoke$arity$3 ? logseq.clj_fractional_indexing.midpoint.cljs$core$IFn$_invoke$arity$3(G__61919,G__61920,G__61921) : logseq.clj_fractional_indexing.midpoint.call(null,G__61919,G__61920,G__61921));
})())].join('');
} else {
var digit_a = ((cljs.core.seq(a))?digits.indexOf(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(a))):(0));
var digit_b = (cljs.core.truth_(b)?digits.indexOf(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(b))):cljs.core.count(digits));
if(((digit_b - digit_a) > (1))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(digits,(Math.round((0.5 * (digit_a + digit_b))) | (0))));
} else {
if(((cljs.core.seq(b)) && ((cljs.core.count(b) > (1))))){
return logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$3(b,(0),(1));
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(digits,digit_a)),cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__61931 = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(a,(1));
var G__61932 = null;
var G__61933 = digits;
return (logseq.clj_fractional_indexing.midpoint.cljs$core$IFn$_invoke$arity$3 ? logseq.clj_fractional_indexing.midpoint.cljs$core$IFn$_invoke$arity$3(G__61931,G__61932,G__61933) : logseq.clj_fractional_indexing.midpoint.call(null,G__61931,G__61932,G__61933));
})())].join('');
}
}
}
});
logseq.clj_fractional_indexing.generate_key_between = (function logseq$clj_fractional_indexing$generate_key_between(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62070 = arguments.length;
var i__5727__auto___62071 = (0);
while(true){
if((i__5727__auto___62071 < len__5726__auto___62070)){
args__5732__auto__.push((arguments[i__5727__auto___62071]));

var G__62072 = (i__5727__auto___62071 + (1));
i__5727__auto___62071 = G__62072;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic = (function (a,b,p__61953){
var map__61954 = p__61953;
var map__61954__$1 = cljs.core.__destructure_map(map__61954);
var digits = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__61954__$1,new cljs.core.Keyword(null,"digits","digits",-1134635061),logseq.clj_fractional_indexing.base_62_digits);
if(cljs.core.truth_(a)){
logseq.clj_fractional_indexing.validate_order_key(a,digits);
} else {
}

if(cljs.core.truth_(b)){
logseq.clj_fractional_indexing.validate_order_key(b,digits);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = a;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = b;
if(cljs.core.truth_(and__5000__auto____$1)){
return (cljs.core.compare(a,b) >= (0));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(a)," >= ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(b)].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b], null));
} else {
}

var result = (((a == null))?(((b == null))?["a",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(digits))].join(''):(function (){var ib = logseq.clj_fractional_indexing.get_integer_part(b);
var fb = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(b,((ib).length));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ib,["A",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((26),cljs.core.first(digits))))].join(''))){
return [ib,logseq.clj_fractional_indexing.midpoint("",fb,digits)].join('');
} else {
if((cljs.core.compare(ib,b) < (0))){
return [ib,logseq.clj_fractional_indexing.midpoint("",fb,digits)].join('');
} else {
var res = logseq.clj_fractional_indexing.decrement_integer(ib,digits);
if((res == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("cannot decrement any more",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b,new cljs.core.Keyword(null,"ib","ib",220610727),ib], null));
} else {
return res;
}
}
}
})()):(((b == null))?(function (){var ia = logseq.clj_fractional_indexing.get_integer_part(a);
var fa = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(a,((ia).length));
var i = logseq.clj_fractional_indexing.increment_integer(ia,digits);
if((i == null)){
return [ia,logseq.clj_fractional_indexing.midpoint(fa,null,digits)].join('');
} else {
return i;
}
})():(function (){var ia = logseq.clj_fractional_indexing.get_integer_part(a);
var fa = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(a,((ia).length));
var ib = logseq.clj_fractional_indexing.get_integer_part(b);
var fb = logseq.clj_fractional_indexing.str_slice.cljs$core$IFn$_invoke$arity$2(b,((ib).length));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ia,ib)){
return [ia,logseq.clj_fractional_indexing.midpoint(fa,fb,digits)].join('');
} else {
var i = logseq.clj_fractional_indexing.increment_integer(ia,digits);
if((i == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("cannot increment any more",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b,new cljs.core.Keyword(null,"ia","ia",1614010639),ia], null));
} else {
if((cljs.core.compare(i,b) < (0))){
return i;
} else {
return [ia,logseq.clj_fractional_indexing.midpoint(fa,null,digits)].join('');
}
}
}
})()
));
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = a;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.compare(a,result) >= (0));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = b;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.compare(result,b) >= (0));
} else {
return and__5000__auto__;
}
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("generate-key-between failed",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"a","a",-2123407586),a,new cljs.core.Keyword(null,"b","b",1482224470),b,new cljs.core.Keyword(null,"between","between",1131099276),result], null));
} else {
return result;
}
}));

(logseq.clj_fractional_indexing.generate_key_between.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.clj_fractional_indexing.generate_key_between.cljs$lang$applyTo = (function (seq61934){
var G__61936 = cljs.core.first(seq61934);
var seq61934__$1 = cljs.core.next(seq61934);
var G__61937 = cljs.core.first(seq61934__$1);
var seq61934__$2 = cljs.core.next(seq61934__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61936,G__61937,seq61934__$2);
}));

logseq.clj_fractional_indexing.generate_n_keys_between = (function logseq$clj_fractional_indexing$generate_n_keys_between(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62081 = arguments.length;
var i__5727__auto___62082 = (0);
while(true){
if((i__5727__auto___62082 < len__5726__auto___62081)){
args__5732__auto__.push((arguments[i__5727__auto___62082]));

var G__62083 = (i__5727__auto___62082 + (1));
i__5727__auto___62082 = G__62083;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.clj_fractional_indexing.generate_n_keys_between.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.clj_fractional_indexing.generate_n_keys_between.cljs$core$IFn$_invoke$arity$variadic = (function (a,b,n,p__61997){
var map__62000 = p__61997;
var map__62000__$1 = cljs.core.__destructure_map(map__62000);
var digits = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62000__$1,new cljs.core.Keyword(null,"digits","digits",-1134635061),logseq.clj_fractional_indexing.base_62_digits);
var result = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n,(0)))?cljs.core.PersistentVector.EMPTY:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n,(1)))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic(a,b,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0))], null):(((b == null))?cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (col,_){
var k = logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic((function (){var or__5002__auto__ = cljs.core.last(col);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return a;
}
})(),b,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0));
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(col,k);
}),cljs.core.PersistentVector.EMPTY,cljs.core.range.cljs$core$IFn$_invoke$arity$1(n)):(((a == null))?cljs.core.vec(cljs.core.reverse(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (col,_){
var k = logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic(a,(function (){var or__5002__auto__ = cljs.core.last(col);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0));
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(col,k);
}),cljs.core.PersistentVector.EMPTY,cljs.core.range.cljs$core$IFn$_invoke$arity$1(n)))):(function (){var mid = (Math.floor((n / (2))) | (0));
var c = logseq.clj_fractional_indexing.generate_key_between.cljs$core$IFn$_invoke$arity$variadic(a,b,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(logseq.clj_fractional_indexing.generate_n_keys_between.cljs$core$IFn$_invoke$arity$variadic(a,c,mid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [c], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.clj_fractional_indexing.generate_n_keys_between.cljs$core$IFn$_invoke$arity$variadic(c,b,((n - mid) - (1)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"digits","digits",-1134635061),digits], null)], 0))], 0));
})()
))));
return cljs.core.vec(cljs.core.take.cljs$core$IFn$_invoke$arity$2(n,result));
}));

(logseq.clj_fractional_indexing.generate_n_keys_between.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.clj_fractional_indexing.generate_n_keys_between.cljs$lang$applyTo = (function (seq61984){
var G__61985 = cljs.core.first(seq61984);
var seq61984__$1 = cljs.core.next(seq61984);
var G__61986 = cljs.core.first(seq61984__$1);
var seq61984__$2 = cljs.core.next(seq61984__$1);
var G__61987 = cljs.core.first(seq61984__$2);
var seq61984__$3 = cljs.core.next(seq61984__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61985,G__61986,G__61987,seq61984__$3);
}));


//# sourceMappingURL=logseq.clj_fractional_indexing.js.map
