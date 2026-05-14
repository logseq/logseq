goog.provide('logseq.api.block');
logseq.api.block.encode_user_property_name = (function logseq$api$block$encode_user_property_name(k){
if(typeof k === 'string'){
return clojure.string.replace(clojure.string.replace(clojure.string.trim(k),"/","")," ","");
} else {
return k;
}
});
logseq.api.block.convert_QMARK_to_built_in_property_name = (function logseq$api$block$convert_QMARK_to_built_in_property_name(property_name){
if((((!(cljs.core.qualified_keyword_QMARK_(property_name)))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"background-color","background-color",570434026),null], null), null),property_name)))){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logseq.property","logseq.property",-1804993641),property_name);
} else {
return property_name;
}
});
/**
 * Finds a property :db/ident for a given property name
 */
logseq.api.block.get_db_ident_for_user_property_name = (function logseq$api$block$get_db_ident_for_user_property_name(property_name){
var property_name_SINGLEQUOTE_ = ((typeof property_name === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(property_name):property_name);
var property_name_SINGLEQUOTE___$1 = logseq.api.block.convert_QMARK_to_built_in_property_name(property_name_SINGLEQUOTE_);
if(cljs.core.qualified_keyword_QMARK_(property_name_SINGLEQUOTE___$1)){
return property_name_SINGLEQUOTE___$1;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("plugin.property",logseq.api.block.encode_user_property_name(property_name));
}
});
logseq.api.block.into_readable_db_properties = (function logseq$api$block$into_readable_db_properties(properties){
var G__131457 = properties;
if((G__131457 == null)){
return null;
} else {
return frontend.handler.db_based.property.util.readable_properties.cljs$core$IFn$_invoke$arity$2(G__131457,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"original-key?","original-key?",-219511082),true,new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),cljs.core.str], null));
}
});
logseq.api.block.into_properties = (function logseq$api$block$into_properties(var_args){
var G__131461 = arguments.length;
switch (G__131461) {
case 1:
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$1 = (function (block){
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),block);
}));

(logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2 = (function (repo,block){
if(cljs.core.truth_((function (){var G__131462 = repo;
if((G__131462 == null)){
return null;
} else {
return frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__131462);
}
})())){
var props = (function (){var G__131463 = block;
var G__131463__$1 = (((G__131463 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__131465){
var vec__131466 = p__131465;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131466,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131466,(1),null);
return logseq.db.frontend.property.property_QMARK_(k);
}),G__131463));
var G__131463__$2 = (((G__131463__$1 == null))?null:cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__131463__$1));
if((G__131463__$2 == null)){
return null;
} else {
return logseq.api.block.into_readable_db_properties(G__131463__$2);
}
})();
var block__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.merge,props);
var block__$2 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block__$1], null),cljs.core.keys(props)));
return block__$2;
} else {
return block;
}
}));

(logseq.api.block.into_properties.cljs$lang$maxFixedArity = 2);

logseq.api.block.infer_property_value_type_to_save_BANG_ = (function logseq$api$block$infer_property_value_type_to_save_BANG_(ident,value){
var multi_QMARK_ = cljs.core.coll_QMARK_(value);
var value_handle = (function (){
if(multi_QMARK_){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all((function (){var iter__5480__auto__ = (function logseq$api$block$infer_property_value_type_to_save_BANG__$_iter__131472(s__131473){
return (new cljs.core.LazySeq(null,(function (){
var s__131473__$1 = s__131473;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__131473__$1);
if(temp__5804__auto__){
var s__131473__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__131473__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131473__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131475 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131474 = (0);
while(true){
if((i__131474 < size__5479__auto__)){
var v = cljs.core._nth(c__5478__auto__,i__131474);
cljs.core.chunk_append(b__131475,(function (){var temp__5804__auto____$1 = (function (){var G__131476 = v;
var G__131476__$1 = (((G__131476 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__131476));
if((G__131476__$1 == null)){
return null;
} else {
return clojure.string.trim(G__131476__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_case_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page));
if((id == null)){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__131477 = page;
var G__131478 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131477,G__131478) : frontend.handler.page._LT_create_BANG_.call(null,G__131477,G__131478));
})(),((function (i__131474,id,page,temp__5804__auto____$1,v,c__5478__auto__,size__5479__auto__,b__131475,s__131473__$2,temp__5804__auto__,multi_QMARK_){
return (function (p1__131470_SHARP_){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__131470_SHARP_);
});})(i__131474,id,page,temp__5804__auto____$1,v,c__5478__auto__,size__5479__auto__,b__131475,s__131473__$2,temp__5804__auto__,multi_QMARK_))
);
} else {
return id;
}
} else {
return null;
}
})());

var G__131550 = (i__131474 + (1));
i__131474 = G__131550;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131475),logseq$api$block$infer_property_value_type_to_save_BANG__$_iter__131472(cljs.core.chunk_rest(s__131473__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131475),null);
}
} else {
var v = cljs.core.first(s__131473__$2);
return cljs.core.cons((function (){var temp__5804__auto____$1 = (function (){var G__131479 = v;
var G__131479__$1 = (((G__131479 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__131479));
if((G__131479__$1 == null)){
return null;
} else {
return clojure.string.trim(G__131479__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_case_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page));
if((id == null)){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__131480 = page;
var G__131481 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131480,G__131481) : frontend.handler.page._LT_create_BANG_.call(null,G__131480,G__131481));
})(),((function (id,page,temp__5804__auto____$1,v,s__131473__$2,temp__5804__auto__,multi_QMARK_){
return (function (p1__131470_SHARP_){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__131470_SHARP_);
});})(id,page,temp__5804__auto____$1,v,s__131473__$2,temp__5804__auto__,multi_QMARK_))
);
} else {
return id;
}
} else {
return null;
}
})(),logseq$api$block$infer_property_value_type_to_save_BANG__$_iter__131472(cljs.core.rest(s__131473__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(value);
})()),(function (vs){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [ident,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),vs,true], null);
}));
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [ident,value,null,false], null);
}
});
if(cljs.core.not(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(ident))){
var type = ((cljs.core.boolean_QMARK_(value))?new cljs.core.Keyword(null,"checkbox","checkbox",1612615655):((typeof value === 'number')?new cljs.core.Keyword(null,"number","number",1570378438):((cljs.core.coll_QMARK_(value))?new cljs.core.Keyword(null,"node","node",581201198):new cljs.core.Keyword(null,"default","default",-1987822328)
)));
var schema = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"cardinality","cardinality",-104971109),((multi_QMARK_)?new cljs.core.Keyword(null,"many","many",1092119164):new cljs.core.Keyword(null,"one","one",935007904))], null);
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(frontend.handler.db_based.property.upsert_property_BANG_(ident,schema,cljs.core.PersistentArrayMap.EMPTY),value_handle);
} else {
return value_handle();
}
});
logseq.api.block.save_db_based_block_properties_BANG_ = (function logseq$api$block$save_db_based_block_properties_BANG_(block,properties){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(properties);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
var properties__$1 = cljs.core.update_keys(properties,(function (k){
return logseq.api.block.get_db_ident_for_user_property_name(k);
}));
var _STAR_properties_page_refs = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
return promesa.core.chain.cljs$core$IFn$_invoke$arity$variadic(promesa.core.all((function (){var iter__5480__auto__ = (function logseq$api$block$save_db_based_block_properties_BANG__$_iter__131482(s__131483){
return (new cljs.core.LazySeq(null,(function (){
var s__131483__$1 = s__131483;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__131483__$1);
if(temp__5804__auto____$1){
var s__131483__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__131483__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131483__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131485 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131484 = (0);
while(true){
if((i__131484 < size__5479__auto__)){
var ident = cljs.core._nth(c__5478__auto__,i__131484);
cljs.core.chunk_append(b__131485,promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__131484,ident,c__5478__auto__,size__5479__auto__,b__131485,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.block.infer_property_value_type_to_save_BANG_(ident,cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties__$1,ident))),((function (i__131484,ident,c__5478__auto__,size__5479__auto__,b__131485,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (ret){
return promesa.protocols._promise(ret);
});})(i__131484,ident,c__5478__auto__,size__5479__auto__,b__131485,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
);
});})(i__131484,ident,c__5478__auto__,size__5479__auto__,b__131485,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
));

var G__131551 = (i__131484 + (1));
i__131484 = G__131551;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131485),logseq$api$block$save_db_based_block_properties_BANG__$_iter__131482(cljs.core.chunk_rest(s__131483__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131485),null);
}
} else {
var ident = cljs.core.first(s__131483__$2);
return cljs.core.cons(promesa.protocols._mcat(promesa.protocols._promise(null),((function (ident,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.block.infer_property_value_type_to_save_BANG_(ident,cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties__$1,ident))),(function (ret){
return promesa.protocols._promise(ret);
}));
});})(ident,s__131483__$2,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
),logseq$api$block$save_db_based_block_properties_BANG__$_iter__131482(cljs.core.rest(s__131483__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.keys(properties__$1));
})()),(function (props){
return frontend.handler.db_based.property.set_block_properties_BANG_(block_id,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,p__131486){
var vec__131487 = p__131486;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131487,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131487,(1),null);
var vs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131487,(2),null);
var multi_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131487,(3),null);
if(cljs.core.truth_(multi_QMARK_)){
_STAR_properties_page_refs.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(_STAR_properties_page_refs.cljs$core$IDeref$_deref$arity$1(null),k,vs));

return a;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(a,k,v);
}
}),cljs.core.PersistentArrayMap.EMPTY,props));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){
if(cljs.core.seq(cljs.core.deref(_STAR_properties_page_refs))){
var seq__131490 = cljs.core.seq(cljs.core.deref(_STAR_properties_page_refs));
var chunk__131491 = null;
var count__131492 = (0);
var i__131493 = (0);
while(true){
if((i__131493 < count__131492)){
var vec__131520 = chunk__131491.cljs$core$IIndexed$_nth$arity$2(null,i__131493);
var ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131520,(0),null);
var refs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131520,(1),null);
promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident),((function (seq__131490,chunk__131491,count__131492,i__131493,vec__131520,ident,refs,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (){
if(cljs.core.seq(refs)){
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__131523 = cljs.core.seq(refs);
var chunk__131524 = null;
var count__131525 = (0);
var i__131526 = (0);
while(true){
if((i__131526 < count__131525)){
var eid = chunk__131524.cljs$core$IIndexed$_nth$arity$2(null,i__131526);
if(typeof eid === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid);
} else {
}


var G__131552 = seq__131523;
var G__131553 = chunk__131524;
var G__131554 = count__131525;
var G__131555 = (i__131526 + (1));
seq__131523 = G__131552;
chunk__131524 = G__131553;
count__131525 = G__131554;
i__131526 = G__131555;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__131523);
if(temp__5804__auto____$1){
var seq__131523__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__131523__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131523__$1);
var G__131556 = cljs.core.chunk_rest(seq__131523__$1);
var G__131557 = c__5525__auto__;
var G__131558 = cljs.core.count(c__5525__auto__);
var G__131559 = (0);
seq__131523 = G__131556;
chunk__131524 = G__131557;
count__131525 = G__131558;
i__131526 = G__131559;
continue;
} else {
var eid = cljs.core.first(seq__131523__$1);
if(typeof eid === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid);
} else {
}


var G__131560 = cljs.core.next(seq__131523__$1);
var G__131561 = null;
var G__131562 = (0);
var G__131563 = (0);
seq__131523 = G__131560;
chunk__131524 = G__131561;
count__131525 = G__131562;
i__131526 = G__131563;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__131527 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__131528 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__131528);

try{var seq__131529_131564 = cljs.core.seq(refs);
var chunk__131530_131565 = null;
var count__131531_131566 = (0);
var i__131532_131567 = (0);
while(true){
if((i__131532_131567 < count__131531_131566)){
var eid_131568 = chunk__131530_131565.cljs$core$IIndexed$_nth$arity$2(null,i__131532_131567);
if(typeof eid_131568 === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid_131568);
} else {
}


var G__131569 = seq__131529_131564;
var G__131570 = chunk__131530_131565;
var G__131571 = count__131531_131566;
var G__131572 = (i__131532_131567 + (1));
seq__131529_131564 = G__131569;
chunk__131530_131565 = G__131570;
count__131531_131566 = G__131571;
i__131532_131567 = G__131572;
continue;
} else {
var temp__5804__auto___131573__$1 = cljs.core.seq(seq__131529_131564);
if(temp__5804__auto___131573__$1){
var seq__131529_131574__$1 = temp__5804__auto___131573__$1;
if(cljs.core.chunked_seq_QMARK_(seq__131529_131574__$1)){
var c__5525__auto___131575 = cljs.core.chunk_first(seq__131529_131574__$1);
var G__131576 = cljs.core.chunk_rest(seq__131529_131574__$1);
var G__131577 = c__5525__auto___131575;
var G__131578 = cljs.core.count(c__5525__auto___131575);
var G__131579 = (0);
seq__131529_131564 = G__131576;
chunk__131530_131565 = G__131577;
count__131531_131566 = G__131578;
i__131532_131567 = G__131579;
continue;
} else {
var eid_131580 = cljs.core.first(seq__131529_131574__$1);
if(typeof eid_131580 === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid_131580);
} else {
}


var G__131581 = cljs.core.next(seq__131529_131574__$1);
var G__131582 = null;
var G__131583 = (0);
var G__131584 = (0);
seq__131529_131564 = G__131581;
chunk__131530_131565 = G__131582;
count__131531_131566 = G__131583;
i__131532_131567 = G__131584;
continue;
}
} else {
}
}
break;
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-properties","set-block-properties",-1338069568)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = ((function (seq__131490,chunk__131491,count__131492,i__131493,request_id__49430__auto__,r__49429__auto__,_STAR_outliner_ops_STAR__orig_val__131527,_STAR_outliner_ops_STAR__temp_val__131528,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,vec__131520,ident,refs,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-properties","set-block-properties",-1338069568)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});})(seq__131490,chunk__131491,count__131492,i__131493,request_id__49430__auto__,r__49429__auto__,_STAR_outliner_ops_STAR__orig_val__131527,_STAR_outliner_ops_STAR__temp_val__131528,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,vec__131520,ident,refs,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
;
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__131527);
}}
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(block_id,ident,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
}
});})(seq__131490,chunk__131491,count__131492,i__131493,vec__131520,ident,refs,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
);


var G__131585 = seq__131490;
var G__131586 = chunk__131491;
var G__131587 = count__131492;
var G__131588 = (i__131493 + (1));
seq__131490 = G__131585;
chunk__131491 = G__131586;
count__131492 = G__131587;
i__131493 = G__131588;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__131490);
if(temp__5804__auto____$1){
var seq__131490__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__131490__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131490__$1);
var G__131589 = cljs.core.chunk_rest(seq__131490__$1);
var G__131590 = c__5525__auto__;
var G__131591 = cljs.core.count(c__5525__auto__);
var G__131592 = (0);
seq__131490 = G__131589;
chunk__131491 = G__131590;
count__131492 = G__131591;
i__131493 = G__131592;
continue;
} else {
var vec__131533 = cljs.core.first(seq__131490__$1);
var ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131533,(0),null);
var refs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131533,(1),null);
promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident),((function (seq__131490,chunk__131491,count__131492,i__131493,vec__131533,ident,refs,seq__131490__$1,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (){
if(cljs.core.seq(refs)){
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__131536 = cljs.core.seq(refs);
var chunk__131537 = null;
var count__131538 = (0);
var i__131539 = (0);
while(true){
if((i__131539 < count__131538)){
var eid = chunk__131537.cljs$core$IIndexed$_nth$arity$2(null,i__131539);
if(typeof eid === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid);
} else {
}


var G__131593 = seq__131536;
var G__131594 = chunk__131537;
var G__131595 = count__131538;
var G__131596 = (i__131539 + (1));
seq__131536 = G__131593;
chunk__131537 = G__131594;
count__131538 = G__131595;
i__131539 = G__131596;
continue;
} else {
var temp__5804__auto____$2 = cljs.core.seq(seq__131536);
if(temp__5804__auto____$2){
var seq__131536__$1 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(seq__131536__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131536__$1);
var G__131597 = cljs.core.chunk_rest(seq__131536__$1);
var G__131598 = c__5525__auto__;
var G__131599 = cljs.core.count(c__5525__auto__);
var G__131600 = (0);
seq__131536 = G__131597;
chunk__131537 = G__131598;
count__131538 = G__131599;
i__131539 = G__131600;
continue;
} else {
var eid = cljs.core.first(seq__131536__$1);
if(typeof eid === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid);
} else {
}


var G__131601 = cljs.core.next(seq__131536__$1);
var G__131602 = null;
var G__131603 = (0);
var G__131604 = (0);
seq__131536 = G__131601;
chunk__131537 = G__131602;
count__131538 = G__131603;
i__131539 = G__131604;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__131540 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__131541 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__131541);

try{var seq__131542_131605 = cljs.core.seq(refs);
var chunk__131543_131606 = null;
var count__131544_131607 = (0);
var i__131545_131608 = (0);
while(true){
if((i__131545_131608 < count__131544_131607)){
var eid_131609 = chunk__131543_131606.cljs$core$IIndexed$_nth$arity$2(null,i__131545_131608);
if(typeof eid_131609 === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid_131609);
} else {
}


var G__131610 = seq__131542_131605;
var G__131611 = chunk__131543_131606;
var G__131612 = count__131544_131607;
var G__131613 = (i__131545_131608 + (1));
seq__131542_131605 = G__131610;
chunk__131543_131606 = G__131611;
count__131544_131607 = G__131612;
i__131545_131608 = G__131613;
continue;
} else {
var temp__5804__auto___131614__$2 = cljs.core.seq(seq__131542_131605);
if(temp__5804__auto___131614__$2){
var seq__131542_131615__$1 = temp__5804__auto___131614__$2;
if(cljs.core.chunked_seq_QMARK_(seq__131542_131615__$1)){
var c__5525__auto___131616 = cljs.core.chunk_first(seq__131542_131615__$1);
var G__131617 = cljs.core.chunk_rest(seq__131542_131615__$1);
var G__131618 = c__5525__auto___131616;
var G__131619 = cljs.core.count(c__5525__auto___131616);
var G__131620 = (0);
seq__131542_131605 = G__131617;
chunk__131543_131606 = G__131618;
count__131544_131607 = G__131619;
i__131545_131608 = G__131620;
continue;
} else {
var eid_131621 = cljs.core.first(seq__131542_131615__$1);
if(typeof eid_131621 === 'number'){
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),block_id,ident,eid_131621);
} else {
}


var G__131622 = cljs.core.next(seq__131542_131615__$1);
var G__131623 = null;
var G__131624 = (0);
var G__131625 = (0);
seq__131542_131605 = G__131622;
chunk__131543_131606 = G__131623;
count__131544_131607 = G__131624;
i__131545_131608 = G__131625;
continue;
}
} else {
}
}
break;
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-properties","set-block-properties",-1338069568)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = ((function (seq__131490,chunk__131491,count__131492,i__131493,request_id__49430__auto__,r__49429__auto__,_STAR_outliner_ops_STAR__orig_val__131540,_STAR_outliner_ops_STAR__temp_val__131541,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,vec__131533,ident,refs,seq__131490__$1,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__){
return (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-properties","set-block-properties",-1338069568)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});})(seq__131490,chunk__131491,count__131492,i__131493,request_id__49430__auto__,r__49429__auto__,_STAR_outliner_ops_STAR__orig_val__131540,_STAR_outliner_ops_STAR__temp_val__131541,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,vec__131533,ident,refs,seq__131490__$1,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
;
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__131540);
}}
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(block_id,ident,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
}
});})(seq__131490,chunk__131491,count__131492,i__131493,vec__131533,ident,refs,seq__131490__$1,temp__5804__auto____$1,properties__$1,_STAR_properties_page_refs,block_id,temp__5804__auto__))
);


var G__131626 = cljs.core.next(seq__131490__$1);
var G__131627 = null;
var G__131628 = (0);
var G__131629 = (0);
seq__131490 = G__131626;
chunk__131491 = G__131627;
count__131492 = G__131628;
i__131493 = G__131629;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
})], 0));
} else {
return null;
}
});
logseq.api.block._LT_sync_children_blocks_BANG_ = (function logseq$api$block$_LT_sync_children_blocks_BANG_(block){
if(cljs.core.truth_(block)){
return frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),true], null)], 0));
} else {
return null;
}
});
logseq.api.block.get_block = (function logseq$api$block$get_block(id_or_uuid,opts){
var temp__5804__auto__ = ((typeof id_or_uuid === 'number')?frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(id_or_uuid):(function (){var and__5000__auto__ = id_or_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.query_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(id_or_uuid));
} else {
return and__5000__auto__;
}
})());
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if((((function (){var G__131547 = opts;
if((G__131547 == null)){
return null;
} else {
return G__131547.includePage;
}
})() === true) || ((!(cljs.core.contains_QMARK_(block,new cljs.core.Keyword("block","name","block/name",1619760316))))))){
var temp__5804__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var uuid = temp__5804__auto____$1;
var map__131548 = cljs_bean.core.__GT_clj(opts);
var map__131548__$1 = cljs.core.__destructure_map(map__131548);
var includeChildren = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131548__$1,new cljs.core.Keyword(null,"includeChildren","includeChildren",-941062106));
var repo = frontend.state.get_current_repo();
var block__$1 = (cljs.core.truth_(includeChildren)?(function (){var blocks = frontend.db.model.get_block_and_children(repo,uuid);
return cljs.core.first(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2(blocks,uuid));
})():cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","children","block/children",-1040716209),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131546_SHARP_){
return (new cljs.core.List(null,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),(new cljs.core.List(null,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131546_SHARP_),null,(1),null)),(2),null));
}),(frontend.db.get_block_immediate_children.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_block_immediate_children.cljs$core$IFn$_invoke$arity$2(repo,uuid) : frontend.db.get_block_immediate_children.call(null,repo,uuid)))));
var block__$2 = logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2(repo,block__$1);
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(block__$2));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=logseq.api.block.js.map
