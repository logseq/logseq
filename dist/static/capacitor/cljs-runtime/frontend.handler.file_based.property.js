goog.provide('frontend.handler.file_based.property');
frontend.handler.file_based.property.insert_property = (function frontend$handler$file_based$property$insert_property(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62263 = arguments.length;
var i__5727__auto___62264 = (0);
while(true){
if((i__5727__auto___62264 < len__5726__auto___62263)){
args__5732__auto__.push((arguments[i__5727__auto___62264]));

var G__62265 = (i__5727__auto___62264 + (1));
i__5727__auto___62264 = G__62265;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.handler.file_based.property.insert_property.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.handler.file_based.property.insert_property.cljs$core$IFn$_invoke$arity$variadic = (function (format,content,key,value,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.file_based.property.util.insert_property,format,content,key,value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0));
}));

(frontend.handler.file_based.property.insert_property.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.handler.file_based.property.insert_property.cljs$lang$applyTo = (function (seq62109){
var G__62110 = cljs.core.first(seq62109);
var seq62109__$1 = cljs.core.next(seq62109);
var G__62111 = cljs.core.first(seq62109__$1);
var seq62109__$2 = cljs.core.next(seq62109__$1);
var G__62112 = cljs.core.first(seq62109__$2);
var seq62109__$3 = cljs.core.next(seq62109__$2);
var G__62113 = cljs.core.first(seq62109__$3);
var seq62109__$4 = cljs.core.next(seq62109__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62110,G__62111,G__62112,G__62113,seq62109__$4);
}));

frontend.handler.file_based.property.remove_id_property = (function frontend$handler$file_based$property$remove_id_property(format,content){
return frontend.handler.file_based.property.util.remove_id_property(format,content);
});
frontend.handler.file_based.property.hidden_properties = frontend.handler.file_based.property.util.hidden_properties;
frontend.handler.file_based.property.built_in_properties = frontend.handler.file_based.property.util.built_in_properties;
/**
 * col: a collection of [block-id property-key property-value].
 */
frontend.handler.file_based.property.batch_set_block_property_aux_BANG_ = (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG_(col){
var col_SINGLEQUOTE_ = cljs.core.group_by(cljs.core.first,col);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__62118 = cljs.core.seq(col_SINGLEQUOTE_);
var chunk__62119 = null;
var count__62120 = (0);
var i__62121 = (0);
while(true){
if((i__62121 < count__62120)){
var vec__62153 = chunk__62119.cljs$core$IIndexed$_nth$arity$2(null,i__62121);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62153,(0),null);
var items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62153,(1),null);
var block_id_62267__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var new_properties_62268 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items));
var temp__5804__auto___62269 = (function (){var G__62156 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62267__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__62156) : frontend.db.entity.call(null,G__62156));
})();
if(cljs.core.truth_(temp__5804__auto___62269)){
var block_62270 = temp__5804__auto___62269;
var format_62271 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_62270,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_62272 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_62270);
var properties_STAR__62273 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_62270));
var properties_text_values_62274 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_62270);
var properties_62275 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__62273,new_properties_62268], 0)));
var properties_text_values_62276__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_62274,new_properties_62268], 0)));
var property_ks_62277 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_62275)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_62270),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items)))));
var content_62278__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_62271,content_62272) : frontend.handler.file_based.property.util.remove_properties.call(null,format_62271,content_62272));
var kvs_62279 = (function (){var iter__5480__auto__ = ((function (seq__62118,chunk__62119,count__62120,i__62121,format_62271,content_62272,properties_STAR__62273,properties_text_values_62274,properties_62275,properties_text_values_62276__$1,property_ks_62277,content_62278__$1,block_62270,temp__5804__auto___62269,block_id_62267__$1,new_properties_62268,vec__62153,block_id,items,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62157(s__62158){
return (new cljs.core.LazySeq(null,((function (seq__62118,chunk__62119,count__62120,i__62121,format_62271,content_62272,properties_STAR__62273,properties_text_values_62274,properties_62275,properties_text_values_62276__$1,property_ks_62277,content_62278__$1,block_62270,temp__5804__auto___62269,block_id_62267__$1,new_properties_62268,vec__62153,block_id,items,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function (){
var s__62158__$1 = s__62158;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__62158__$1);
if(temp__5804__auto____$1){
var s__62158__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__62158__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62158__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62160 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62159 = (0);
while(true){
if((i__62159 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__62159);
cljs.core.chunk_append(b__62160,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62276__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62275,key);
}
})()], null));

var G__62285 = (i__62159 + (1));
i__62159 = G__62285;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62160),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62157(cljs.core.chunk_rest(s__62158__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62160),null);
}
} else {
var key = cljs.core.first(s__62158__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62276__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62275,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62157(cljs.core.rest(s__62158__$2)));
}
} else {
return null;
}
break;
}
});})(seq__62118,chunk__62119,count__62120,i__62121,format_62271,content_62272,properties_STAR__62273,properties_text_values_62274,properties_62275,properties_text_values_62276__$1,property_ks_62277,content_62278__$1,block_62270,temp__5804__auto___62269,block_id_62267__$1,new_properties_62268,vec__62153,block_id,items,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__62118,chunk__62119,count__62120,i__62121,format_62271,content_62272,properties_STAR__62273,properties_text_values_62274,properties_62275,properties_text_values_62276__$1,property_ks_62277,content_62278__$1,block_62270,temp__5804__auto___62269,block_id_62267__$1,new_properties_62268,vec__62153,block_id,items,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_62277);
})();
var content_62280__$2 = frontend.handler.file_based.property.util.insert_properties(format_62271,content_62278__$1,kvs_62279);
var content_62281__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_62280__$2);
var block_62282__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62267__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_62275,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_62277,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_62276__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_62281__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_62282__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__62287 = seq__62118;
var G__62288 = chunk__62119;
var G__62289 = count__62120;
var G__62290 = (i__62121 + (1));
seq__62118 = G__62287;
chunk__62119 = G__62288;
count__62120 = G__62289;
i__62121 = G__62290;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__62118);
if(temp__5804__auto__){
var seq__62118__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__62118__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__62118__$1);
var G__62291 = cljs.core.chunk_rest(seq__62118__$1);
var G__62292 = c__5525__auto__;
var G__62293 = cljs.core.count(c__5525__auto__);
var G__62294 = (0);
seq__62118 = G__62291;
chunk__62119 = G__62292;
count__62120 = G__62293;
i__62121 = G__62294;
continue;
} else {
var vec__62165 = cljs.core.first(seq__62118__$1);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62165,(0),null);
var items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62165,(1),null);
var block_id_62295__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var new_properties_62296 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items));
var temp__5804__auto___62298__$1 = (function (){var G__62168 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62295__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__62168) : frontend.db.entity.call(null,G__62168));
})();
if(cljs.core.truth_(temp__5804__auto___62298__$1)){
var block_62299 = temp__5804__auto___62298__$1;
var format_62300 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_62299,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_62301 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_62299);
var properties_STAR__62302 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_62299));
var properties_text_values_62303 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_62299);
var properties_62304 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__62302,new_properties_62296], 0)));
var properties_text_values_62305__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_62303,new_properties_62296], 0)));
var property_ks_62306 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_62304)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_62299),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items)))));
var content_62307__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_62300,content_62301) : frontend.handler.file_based.property.util.remove_properties.call(null,format_62300,content_62301));
var kvs_62308 = (function (){var iter__5480__auto__ = ((function (seq__62118,chunk__62119,count__62120,i__62121,format_62300,content_62301,properties_STAR__62302,properties_text_values_62303,properties_62304,properties_text_values_62305__$1,property_ks_62306,content_62307__$1,block_62299,temp__5804__auto___62298__$1,block_id_62295__$1,new_properties_62296,vec__62165,block_id,items,seq__62118__$1,temp__5804__auto__,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62169(s__62170){
return (new cljs.core.LazySeq(null,((function (seq__62118,chunk__62119,count__62120,i__62121,format_62300,content_62301,properties_STAR__62302,properties_text_values_62303,properties_62304,properties_text_values_62305__$1,property_ks_62306,content_62307__$1,block_62299,temp__5804__auto___62298__$1,block_id_62295__$1,new_properties_62296,vec__62165,block_id,items,seq__62118__$1,temp__5804__auto__,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function (){
var s__62170__$1 = s__62170;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__62170__$1);
if(temp__5804__auto____$2){
var s__62170__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__62170__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62170__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62172 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62171 = (0);
while(true){
if((i__62171 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__62171);
cljs.core.chunk_append(b__62172,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62305__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62304,key);
}
})()], null));

var G__62318 = (i__62171 + (1));
i__62171 = G__62318;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62172),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62169(cljs.core.chunk_rest(s__62170__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62172),null);
}
} else {
var key = cljs.core.first(s__62170__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62305__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62304,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62169(cljs.core.rest(s__62170__$2)));
}
} else {
return null;
}
break;
}
});})(seq__62118,chunk__62119,count__62120,i__62121,format_62300,content_62301,properties_STAR__62302,properties_text_values_62303,properties_62304,properties_text_values_62305__$1,property_ks_62306,content_62307__$1,block_62299,temp__5804__auto___62298__$1,block_id_62295__$1,new_properties_62296,vec__62165,block_id,items,seq__62118__$1,temp__5804__auto__,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__62118,chunk__62119,count__62120,i__62121,format_62300,content_62301,properties_STAR__62302,properties_text_values_62303,properties_62304,properties_text_values_62305__$1,property_ks_62306,content_62307__$1,block_62299,temp__5804__auto___62298__$1,block_id_62295__$1,new_properties_62296,vec__62165,block_id,items,seq__62118__$1,temp__5804__auto__,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_62306);
})();
var content_62309__$2 = frontend.handler.file_based.property.util.insert_properties(format_62300,content_62307__$1,kvs_62308);
var content_62310__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_62309__$2);
var block_62311__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62295__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_62304,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_62306,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_62305__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_62310__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_62311__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__62325 = cljs.core.next(seq__62118__$1);
var G__62326 = null;
var G__62327 = (0);
var G__62328 = (0);
seq__62118 = G__62325;
chunk__62119 = G__62326;
count__62120 = G__62327;
i__62121 = G__62328;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__62173 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__62174 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__62174);

try{var seq__62175_62331 = cljs.core.seq(col_SINGLEQUOTE_);
var chunk__62176_62332 = null;
var count__62177_62333 = (0);
var i__62178_62334 = (0);
while(true){
if((i__62178_62334 < count__62177_62333)){
var vec__62201_62340 = chunk__62176_62332.cljs$core$IIndexed$_nth$arity$2(null,i__62178_62334);
var block_id_62341 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62201_62340,(0),null);
var items_62342 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62201_62340,(1),null);
var block_id_62348__$1 = ((typeof block_id_62341 === 'string')?cljs.core.uuid(block_id_62341):block_id_62341);
var new_properties_62349 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_62342),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items_62342));
var temp__5804__auto___62350 = (function (){var G__62208 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62348__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__62208) : frontend.db.entity.call(null,G__62208));
})();
if(cljs.core.truth_(temp__5804__auto___62350)){
var block_62352 = temp__5804__auto___62350;
var format_62353 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_62352,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_62354 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_62352);
var properties_STAR__62355 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_62352));
var properties_text_values_62356 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_62352);
var properties_62357 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__62355,new_properties_62349], 0)));
var properties_text_values_62358__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_62356,new_properties_62349], 0)));
var property_ks_62359 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_62357)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_62352),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_62342)))));
var content_62360__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_62353,content_62354) : frontend.handler.file_based.property.util.remove_properties.call(null,format_62353,content_62354));
var kvs_62361 = (function (){var iter__5480__auto__ = ((function (seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62353,content_62354,properties_STAR__62355,properties_text_values_62356,properties_62357,properties_text_values_62358__$1,property_ks_62359,content_62360__$1,block_62352,temp__5804__auto___62350,block_id_62348__$1,new_properties_62349,vec__62201_62340,block_id_62341,items_62342,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62209(s__62210){
return (new cljs.core.LazySeq(null,((function (seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62353,content_62354,properties_STAR__62355,properties_text_values_62356,properties_62357,properties_text_values_62358__$1,property_ks_62359,content_62360__$1,block_62352,temp__5804__auto___62350,block_id_62348__$1,new_properties_62349,vec__62201_62340,block_id_62341,items_62342,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function (){
var s__62210__$1 = s__62210;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__62210__$1);
if(temp__5804__auto____$1){
var s__62210__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__62210__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62210__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62212 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62211 = (0);
while(true){
if((i__62211 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__62211);
cljs.core.chunk_append(b__62212,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62358__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62357,key);
}
})()], null));

var G__62376 = (i__62211 + (1));
i__62211 = G__62376;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62212),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62209(cljs.core.chunk_rest(s__62210__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62212),null);
}
} else {
var key = cljs.core.first(s__62210__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62358__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62357,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62209(cljs.core.rest(s__62210__$2)));
}
} else {
return null;
}
break;
}
});})(seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62353,content_62354,properties_STAR__62355,properties_text_values_62356,properties_62357,properties_text_values_62358__$1,property_ks_62359,content_62360__$1,block_62352,temp__5804__auto___62350,block_id_62348__$1,new_properties_62349,vec__62201_62340,block_id_62341,items_62342,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62353,content_62354,properties_STAR__62355,properties_text_values_62356,properties_62357,properties_text_values_62358__$1,property_ks_62359,content_62360__$1,block_62352,temp__5804__auto___62350,block_id_62348__$1,new_properties_62349,vec__62201_62340,block_id_62341,items_62342,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_62359);
})();
var content_62362__$2 = frontend.handler.file_based.property.util.insert_properties(format_62353,content_62360__$1,kvs_62361);
var content_62363__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_62362__$2);
var block_62364__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62348__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_62357,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_62359,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_62358__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_62363__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_62364__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__62380 = seq__62175_62331;
var G__62381 = chunk__62176_62332;
var G__62382 = count__62177_62333;
var G__62383 = (i__62178_62334 + (1));
seq__62175_62331 = G__62380;
chunk__62176_62332 = G__62381;
count__62177_62333 = G__62382;
i__62178_62334 = G__62383;
continue;
} else {
var temp__5804__auto___62384 = cljs.core.seq(seq__62175_62331);
if(temp__5804__auto___62384){
var seq__62175_62385__$1 = temp__5804__auto___62384;
if(cljs.core.chunked_seq_QMARK_(seq__62175_62385__$1)){
var c__5525__auto___62386 = cljs.core.chunk_first(seq__62175_62385__$1);
var G__62387 = cljs.core.chunk_rest(seq__62175_62385__$1);
var G__62388 = c__5525__auto___62386;
var G__62389 = cljs.core.count(c__5525__auto___62386);
var G__62390 = (0);
seq__62175_62331 = G__62387;
chunk__62176_62332 = G__62388;
count__62177_62333 = G__62389;
i__62178_62334 = G__62390;
continue;
} else {
var vec__62220_62391 = cljs.core.first(seq__62175_62385__$1);
var block_id_62392 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62220_62391,(0),null);
var items_62393 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62220_62391,(1),null);
var block_id_62398__$1 = ((typeof block_id_62392 === 'string')?cljs.core.uuid(block_id_62392):block_id_62392);
var new_properties_62399 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_62393),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items_62393));
var temp__5804__auto___62400__$1 = (function (){var G__62224 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62398__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__62224) : frontend.db.entity.call(null,G__62224));
})();
if(cljs.core.truth_(temp__5804__auto___62400__$1)){
var block_62403 = temp__5804__auto___62400__$1;
var format_62404 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_62403,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_62405 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_62403);
var properties_STAR__62406 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_62403));
var properties_text_values_62407 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_62403);
var properties_62408 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__62406,new_properties_62399], 0)));
var properties_text_values_62409__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_62407,new_properties_62399], 0)));
var property_ks_62410 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_62408)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_62403),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_62393)))));
var content_62411__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_62404,content_62405) : frontend.handler.file_based.property.util.remove_properties.call(null,format_62404,content_62405));
var kvs_62412 = (function (){var iter__5480__auto__ = ((function (seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62404,content_62405,properties_STAR__62406,properties_text_values_62407,properties_62408,properties_text_values_62409__$1,property_ks_62410,content_62411__$1,block_62403,temp__5804__auto___62400__$1,block_id_62398__$1,new_properties_62399,vec__62220_62391,block_id_62392,items_62393,seq__62175_62385__$1,temp__5804__auto___62384,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62227(s__62228){
return (new cljs.core.LazySeq(null,((function (seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62404,content_62405,properties_STAR__62406,properties_text_values_62407,properties_62408,properties_text_values_62409__$1,property_ks_62410,content_62411__$1,block_62403,temp__5804__auto___62400__$1,block_id_62398__$1,new_properties_62399,vec__62220_62391,block_id_62392,items_62393,seq__62175_62385__$1,temp__5804__auto___62384,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_){
return (function (){
var s__62228__$1 = s__62228;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__62228__$1);
if(temp__5804__auto____$2){
var s__62228__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__62228__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62228__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62230 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62229 = (0);
while(true){
if((i__62229 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__62229);
cljs.core.chunk_append(b__62230,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62409__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62408,key);
}
})()], null));

var G__62419 = (i__62229 + (1));
i__62229 = G__62419;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62230),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62227(cljs.core.chunk_rest(s__62228__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62230),null);
}
} else {
var key = cljs.core.first(s__62228__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_62409__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_62408,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__62227(cljs.core.rest(s__62228__$2)));
}
} else {
return null;
}
break;
}
});})(seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62404,content_62405,properties_STAR__62406,properties_text_values_62407,properties_62408,properties_text_values_62409__$1,property_ks_62410,content_62411__$1,block_62403,temp__5804__auto___62400__$1,block_id_62398__$1,new_properties_62399,vec__62220_62391,block_id_62392,items_62393,seq__62175_62385__$1,temp__5804__auto___62384,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__62175_62331,chunk__62176_62332,count__62177_62333,i__62178_62334,format_62404,content_62405,properties_STAR__62406,properties_text_values_62407,properties_62408,properties_text_values_62409__$1,property_ks_62410,content_62411__$1,block_62403,temp__5804__auto___62400__$1,block_id_62398__$1,new_properties_62399,vec__62220_62391,block_id_62392,items_62393,seq__62175_62385__$1,temp__5804__auto___62384,_STAR_outliner_ops_STAR__orig_val__62173,_STAR_outliner_ops_STAR__temp_val__62174,test_QMARK___60293__auto__,ops__60294__auto__,editor_info__60295__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_62410);
})();
var content_62413__$2 = frontend.handler.file_based.property.util.insert_properties(format_62404,content_62411__$1,kvs_62412);
var content_62414__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_62413__$2);
var block_62415__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_62398__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_62408,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_62410,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_62409__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_62414__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_62415__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__62436 = cljs.core.next(seq__62175_62385__$1);
var G__62437 = null;
var G__62438 = (0);
var G__62439 = (0);
seq__62175_62331 = G__62436;
chunk__62176_62332 = G__62437;
count__62177_62333 = G__62438;
i__62178_62334 = G__62439;
continue;
}
} else {
}
}
break;
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__62173);
}}
})()),(function (___40947__auto__){
return promesa.protocols._promise((function (){var block_id = cljs.core.ffirst(col);
var block_id__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var input_pos = (function (){var or__5002__auto__ = frontend.state.get_edit_pos();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"max","max",61366548);
}
})();
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var editing_block = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block),block_id__$1)){
return frontend.handler.block.edit_block_BANG_(editing_block,input_pos);
} else {
return null;
}
} else {
return null;
}
})());
}));
}));
});
frontend.handler.file_based.property.batch_set_block_property_BANG_ = (function frontend$handler$file_based$property$batch_set_block_property_BANG_(block_ids,property_key,property_value){
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62256_SHARP_){
return (new cljs.core.PersistentVector(null,3,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__62256_SHARP_,property_key,property_value],null));
}),block_ids));
});
frontend.handler.file_based.property.batch_remove_block_property_BANG_ = (function frontend$handler$file_based$property$batch_remove_block_property_BANG_(block_ids,property_key){
return frontend.handler.file_based.property.batch_set_block_property_BANG_(block_ids,property_key,null);
});
frontend.handler.file_based.property.remove_block_property_BANG_ = (function frontend$handler$file_based$property$remove_block_property_BANG_(block_id,key){
var key__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id,key__$1,null], null)], null));
});
frontend.handler.file_based.property.set_block_property_BANG_ = (function frontend$handler$file_based$property$set_block_property_BANG_(block_id,key,value){
var key__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id,key__$1,value], null)], null));
});

//# sourceMappingURL=frontend.handler.file_based.property.js.map
