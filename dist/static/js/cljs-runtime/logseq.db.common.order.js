goog.provide('logseq.db.common.order');
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.common !== 'undefined') && (typeof logseq.db.common.order !== 'undefined') && (typeof logseq.db.common.order._STAR_max_key !== 'undefined')){
} else {
logseq.db.common.order._STAR_max_key = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
logseq.db.common.order.reset_max_key_BANG_ = (function logseq$db$common$order$reset_max_key_BANG_(var_args){
var G__62189 = arguments.length;
switch (G__62189) {
case 1:
return logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (key){
return logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$2(logseq.db.common.order._STAR_max_key,key);
}));

(logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (max_key_atom,key){
if(cljs.core.truth_((function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return (((cljs.core.deref(max_key_atom) == null)) || ((cljs.core.compare(key,cljs.core.deref(max_key_atom)) > (0))));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reset_BANG_(max_key_atom,key);
} else {
return null;
}
}));

(logseq.db.common.order.reset_max_key_BANG_.cljs$lang$maxFixedArity = 2);

logseq.db.common.order.gen_key = (function logseq$db$common$order$gen_key(var_args){
var G__62203 = arguments.length;
switch (G__62203) {
case 0:
return logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___62290 = arguments.length;
var i__5727__auto___62291 = (0);
while(true){
if((i__5727__auto___62291 < len__5726__auto___62290)){
args_arr__5751__auto__.push((arguments[i__5727__auto___62291]));

var G__62292 = (i__5727__auto___62291 + (1));
i__5727__auto___62291 = G__62292;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.db.common.order.gen_key(cljs.core.deref(logseq.db.common.order._STAR_max_key),null);
}));

(logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1 = (function (end){
return logseq.db.common.order.gen_key(cljs.core.deref(logseq.db.common.order._STAR_max_key),end);
}));

(logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$variadic = (function (start,end,p__62206){
var map__62207 = p__62206;
var map__62207__$1 = cljs.core.__destructure_map(map__62207);
var max_key_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62207__$1,new cljs.core.Keyword(null,"max-key-atom","max-key-atom",-1459331700),logseq.db.common.order._STAR_max_key);
var k = logseq.clj_fractional_indexing.generate_key_between(start,end);
logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$2(max_key_atom,k);

return k;
}));

/** @this {Function} */
(logseq.db.common.order.gen_key.cljs$lang$applyTo = (function (seq62200){
var G__62201 = cljs.core.first(seq62200);
var seq62200__$1 = cljs.core.next(seq62200);
var G__62202 = cljs.core.first(seq62200__$1);
var seq62200__$2 = cljs.core.next(seq62200__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62201,G__62202,seq62200__$2);
}));

(logseq.db.common.order.gen_key.cljs$lang$maxFixedArity = (2));

logseq.db.common.order.get_max_order = (function logseq$db$common$order$get_max_order(db){
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","order","block/order",-1429282437))));
});
logseq.db.common.order.gen_n_keys = (function logseq$db$common$order$gen_n_keys(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62298 = arguments.length;
var i__5727__auto___62299 = (0);
while(true){
if((i__5727__auto___62299 < len__5726__auto___62298)){
args__5732__auto__.push((arguments[i__5727__auto___62299]));

var G__62301 = (i__5727__auto___62299 + (1));
i__5727__auto___62299 = G__62301;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.db.common.order.gen_n_keys.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.db.common.order.gen_n_keys.cljs$core$IFn$_invoke$arity$variadic = (function (n,start,end,p__62238){
var map__62239 = p__62238;
var map__62239__$1 = cljs.core.__destructure_map(map__62239);
var max_key_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62239__$1,new cljs.core.Keyword(null,"max-key-atom","max-key-atom",-1459331700),logseq.db.common.order._STAR_max_key);
var ks = logseq.clj_fractional_indexing.generate_n_keys_between(start,end,n);
logseq.db.common.order.reset_max_key_BANG_.cljs$core$IFn$_invoke$arity$2(max_key_atom,cljs.core.last(ks));

return ks;
}));

(logseq.db.common.order.gen_n_keys.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.db.common.order.gen_n_keys.cljs$lang$applyTo = (function (seq62224){
var G__62225 = cljs.core.first(seq62224);
var seq62224__$1 = cljs.core.next(seq62224);
var G__62226 = cljs.core.first(seq62224__$1);
var seq62224__$2 = cljs.core.next(seq62224__$1);
var G__62227 = cljs.core.first(seq62224__$2);
var seq62224__$3 = cljs.core.next(seq62224__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62225,G__62226,G__62227,seq62224__$3);
}));

logseq.db.common.order.validate_order_key_QMARK_ = (function logseq$db$common$order$validate_order_key_QMARK_(key){
logseq.clj_fractional_indexing.validate_order_key(key,logseq.clj_fractional_indexing.base_62_digits);

return true;
});
logseq.db.common.order.get_prev_order = (function logseq$db$common$order$get_prev_order(db,property,value_id){
var value = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,value_id) : datascript.core.entity.call(null,db,value_id));
if(cljs.core.truth_(property)){
var values = cljs.core.reverse(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
return cljs.core.some((function (e){
if((((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(value)) < (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value))))){
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(e);
} else {
return null;
}
}),values);
} else {
var properties = cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var G__62255 = db;
var G__62256 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__62255,G__62256) : datascript.core.entity.call(null,G__62255,G__62256));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)))));
return cljs.core.some((function (property__$1){
if((((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(value)) < (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value))))){
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(property__$1);
} else {
return null;
}
}),properties);
}
});
logseq.db.common.order.get_next_order = (function logseq$db$common$order$get_next_order(db,property,value_id){
var value = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,value_id) : datascript.core.entity.call(null,db,value_id));
if(cljs.core.truth_(property)){
var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
return cljs.core.some((function (e){
if((((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(value)) > (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value))))){
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(e);
} else {
return null;
}
}),values);
} else {
var properties = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var G__62275 = db;
var G__62276 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__62275,G__62276) : datascript.core.entity.call(null,G__62275,G__62276));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048))));
return cljs.core.some((function (property__$1){
if((((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(value)) > (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value))))){
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(property__$1);
} else {
return null;
}
}),properties);
}
});

//# sourceMappingURL=logseq.db.common.order.js.map
