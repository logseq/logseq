goog.provide('frontend.handler.file_based.property');
frontend.handler.file_based.property.insert_property = (function frontend$handler$file_based$property$insert_property(var_args){
var args__5732__auto__ = [];
var len__5726__auto___101869 = arguments.length;
var i__5727__auto___101870 = (0);
while(true){
if((i__5727__auto___101870 < len__5726__auto___101869)){
args__5732__auto__.push((arguments[i__5727__auto___101870]));

var G__101871 = (i__5727__auto___101870 + (1));
i__5727__auto___101870 = G__101871;
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
(frontend.handler.file_based.property.insert_property.cljs$lang$applyTo = (function (seq101789){
var G__101790 = cljs.core.first(seq101789);
var seq101789__$1 = cljs.core.next(seq101789);
var G__101791 = cljs.core.first(seq101789__$1);
var seq101789__$2 = cljs.core.next(seq101789__$1);
var G__101792 = cljs.core.first(seq101789__$2);
var seq101789__$3 = cljs.core.next(seq101789__$2);
var G__101793 = cljs.core.first(seq101789__$3);
var seq101789__$4 = cljs.core.next(seq101789__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__101790,G__101791,G__101792,G__101793,seq101789__$4);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__101794 = cljs.core.seq(col_SINGLEQUOTE_);
var chunk__101795 = null;
var count__101796 = (0);
var i__101797 = (0);
while(true){
if((i__101797 < count__101796)){
var vec__101814 = chunk__101795.cljs$core$IIndexed$_nth$arity$2(null,i__101797);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101814,(0),null);
var items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101814,(1),null);
var block_id_101872__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var new_properties_101873 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items));
var temp__5804__auto___101874 = (function (){var G__101817 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101872__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101817) : frontend.db.entity.call(null,G__101817));
})();
if(cljs.core.truth_(temp__5804__auto___101874)){
var block_101875 = temp__5804__auto___101874;
var format_101876 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_101875,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_101877 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_101875);
var properties_STAR__101878 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_101875));
var properties_text_values_101879 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_101875);
var properties_101880 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__101878,new_properties_101873], 0)));
var properties_text_values_101881__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_101879,new_properties_101873], 0)));
var property_ks_101882 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_101880)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_101875),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items)))));
var content_101883__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_101876,content_101877) : frontend.handler.file_based.property.util.remove_properties.call(null,format_101876,content_101877));
var kvs_101884 = (function (){var iter__5480__auto__ = ((function (seq__101794,chunk__101795,count__101796,i__101797,format_101876,content_101877,properties_STAR__101878,properties_text_values_101879,properties_101880,properties_text_values_101881__$1,property_ks_101882,content_101883__$1,block_101875,temp__5804__auto___101874,block_id_101872__$1,new_properties_101873,vec__101814,block_id,items,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101818(s__101819){
return (new cljs.core.LazySeq(null,((function (seq__101794,chunk__101795,count__101796,i__101797,format_101876,content_101877,properties_STAR__101878,properties_text_values_101879,properties_101880,properties_text_values_101881__$1,property_ks_101882,content_101883__$1,block_101875,temp__5804__auto___101874,block_id_101872__$1,new_properties_101873,vec__101814,block_id,items,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function (){
var s__101819__$1 = s__101819;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__101819__$1);
if(temp__5804__auto____$1){
var s__101819__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__101819__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__101819__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__101821 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__101820 = (0);
while(true){
if((i__101820 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__101820);
cljs.core.chunk_append(b__101821,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101881__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101880,key);
}
})()], null));

var G__101888 = (i__101820 + (1));
i__101820 = G__101888;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__101821),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101818(cljs.core.chunk_rest(s__101819__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__101821),null);
}
} else {
var key = cljs.core.first(s__101819__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101881__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101880,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101818(cljs.core.rest(s__101819__$2)));
}
} else {
return null;
}
break;
}
});})(seq__101794,chunk__101795,count__101796,i__101797,format_101876,content_101877,properties_STAR__101878,properties_text_values_101879,properties_101880,properties_text_values_101881__$1,property_ks_101882,content_101883__$1,block_101875,temp__5804__auto___101874,block_id_101872__$1,new_properties_101873,vec__101814,block_id,items,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__101794,chunk__101795,count__101796,i__101797,format_101876,content_101877,properties_STAR__101878,properties_text_values_101879,properties_101880,properties_text_values_101881__$1,property_ks_101882,content_101883__$1,block_101875,temp__5804__auto___101874,block_id_101872__$1,new_properties_101873,vec__101814,block_id,items,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_101882);
})();
var content_101885__$2 = frontend.handler.file_based.property.util.insert_properties(format_101876,content_101883__$1,kvs_101884);
var content_101886__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_101885__$2);
var block_101887__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101872__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_101880,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_101882,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_101881__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_101886__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_101887__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__101889 = seq__101794;
var G__101890 = chunk__101795;
var G__101891 = count__101796;
var G__101892 = (i__101797 + (1));
seq__101794 = G__101889;
chunk__101795 = G__101890;
count__101796 = G__101891;
i__101797 = G__101892;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__101794);
if(temp__5804__auto__){
var seq__101794__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__101794__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__101794__$1);
var G__101893 = cljs.core.chunk_rest(seq__101794__$1);
var G__101894 = c__5525__auto__;
var G__101895 = cljs.core.count(c__5525__auto__);
var G__101896 = (0);
seq__101794 = G__101893;
chunk__101795 = G__101894;
count__101796 = G__101895;
i__101797 = G__101896;
continue;
} else {
var vec__101822 = cljs.core.first(seq__101794__$1);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101822,(0),null);
var items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101822,(1),null);
var block_id_101897__$1 = ((typeof block_id === 'string')?cljs.core.uuid(block_id):block_id);
var new_properties_101898 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items));
var temp__5804__auto___101899__$1 = (function (){var G__101825 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101897__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101825) : frontend.db.entity.call(null,G__101825));
})();
if(cljs.core.truth_(temp__5804__auto___101899__$1)){
var block_101900 = temp__5804__auto___101899__$1;
var format_101901 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_101900,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_101902 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_101900);
var properties_STAR__101903 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_101900));
var properties_text_values_101904 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_101900);
var properties_101905 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__101903,new_properties_101898], 0)));
var properties_text_values_101906__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_101904,new_properties_101898], 0)));
var property_ks_101907 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_101905)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_101900),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items)))));
var content_101908__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_101901,content_101902) : frontend.handler.file_based.property.util.remove_properties.call(null,format_101901,content_101902));
var kvs_101909 = (function (){var iter__5480__auto__ = ((function (seq__101794,chunk__101795,count__101796,i__101797,format_101901,content_101902,properties_STAR__101903,properties_text_values_101904,properties_101905,properties_text_values_101906__$1,property_ks_101907,content_101908__$1,block_101900,temp__5804__auto___101899__$1,block_id_101897__$1,new_properties_101898,vec__101822,block_id,items,seq__101794__$1,temp__5804__auto__,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101826(s__101827){
return (new cljs.core.LazySeq(null,((function (seq__101794,chunk__101795,count__101796,i__101797,format_101901,content_101902,properties_STAR__101903,properties_text_values_101904,properties_101905,properties_text_values_101906__$1,property_ks_101907,content_101908__$1,block_101900,temp__5804__auto___101899__$1,block_id_101897__$1,new_properties_101898,vec__101822,block_id,items,seq__101794__$1,temp__5804__auto__,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function (){
var s__101827__$1 = s__101827;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__101827__$1);
if(temp__5804__auto____$2){
var s__101827__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__101827__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__101827__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__101829 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__101828 = (0);
while(true){
if((i__101828 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__101828);
cljs.core.chunk_append(b__101829,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101906__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101905,key);
}
})()], null));

var G__101913 = (i__101828 + (1));
i__101828 = G__101913;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__101829),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101826(cljs.core.chunk_rest(s__101827__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__101829),null);
}
} else {
var key = cljs.core.first(s__101827__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101906__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101905,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101826(cljs.core.rest(s__101827__$2)));
}
} else {
return null;
}
break;
}
});})(seq__101794,chunk__101795,count__101796,i__101797,format_101901,content_101902,properties_STAR__101903,properties_text_values_101904,properties_101905,properties_text_values_101906__$1,property_ks_101907,content_101908__$1,block_101900,temp__5804__auto___101899__$1,block_id_101897__$1,new_properties_101898,vec__101822,block_id,items,seq__101794__$1,temp__5804__auto__,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__101794,chunk__101795,count__101796,i__101797,format_101901,content_101902,properties_STAR__101903,properties_text_values_101904,properties_101905,properties_text_values_101906__$1,property_ks_101907,content_101908__$1,block_101900,temp__5804__auto___101899__$1,block_id_101897__$1,new_properties_101898,vec__101822,block_id,items,seq__101794__$1,temp__5804__auto__,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_101907);
})();
var content_101910__$2 = frontend.handler.file_based.property.util.insert_properties(format_101901,content_101908__$1,kvs_101909);
var content_101911__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_101910__$2);
var block_101912__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101897__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_101905,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_101907,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_101906__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_101911__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_101912__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__101914 = cljs.core.next(seq__101794__$1);
var G__101915 = null;
var G__101916 = (0);
var G__101917 = (0);
seq__101794 = G__101914;
chunk__101795 = G__101915;
count__101796 = G__101916;
i__101797 = G__101917;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__101830 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__101831 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__101831);

try{var seq__101832_101918 = cljs.core.seq(col_SINGLEQUOTE_);
var chunk__101833_101919 = null;
var count__101834_101920 = (0);
var i__101835_101921 = (0);
while(true){
if((i__101835_101921 < count__101834_101920)){
var vec__101852_101922 = chunk__101833_101919.cljs$core$IIndexed$_nth$arity$2(null,i__101835_101921);
var block_id_101923 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101852_101922,(0),null);
var items_101924 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101852_101922,(1),null);
var block_id_101925__$1 = ((typeof block_id_101923 === 'string')?cljs.core.uuid(block_id_101923):block_id_101923);
var new_properties_101926 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_101924),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items_101924));
var temp__5804__auto___101927 = (function (){var G__101855 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101925__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101855) : frontend.db.entity.call(null,G__101855));
})();
if(cljs.core.truth_(temp__5804__auto___101927)){
var block_101928 = temp__5804__auto___101927;
var format_101929 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_101928,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_101930 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_101928);
var properties_STAR__101931 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_101928));
var properties_text_values_101932 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_101928);
var properties_101933 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__101931,new_properties_101926], 0)));
var properties_text_values_101934__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_101932,new_properties_101926], 0)));
var property_ks_101935 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_101933)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_101928),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_101924)))));
var content_101936__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_101929,content_101930) : frontend.handler.file_based.property.util.remove_properties.call(null,format_101929,content_101930));
var kvs_101937 = (function (){var iter__5480__auto__ = ((function (seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101929,content_101930,properties_STAR__101931,properties_text_values_101932,properties_101933,properties_text_values_101934__$1,property_ks_101935,content_101936__$1,block_101928,temp__5804__auto___101927,block_id_101925__$1,new_properties_101926,vec__101852_101922,block_id_101923,items_101924,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101856(s__101857){
return (new cljs.core.LazySeq(null,((function (seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101929,content_101930,properties_STAR__101931,properties_text_values_101932,properties_101933,properties_text_values_101934__$1,property_ks_101935,content_101936__$1,block_101928,temp__5804__auto___101927,block_id_101925__$1,new_properties_101926,vec__101852_101922,block_id_101923,items_101924,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function (){
var s__101857__$1 = s__101857;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__101857__$1);
if(temp__5804__auto____$1){
var s__101857__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__101857__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__101857__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__101859 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__101858 = (0);
while(true){
if((i__101858 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__101858);
cljs.core.chunk_append(b__101859,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101934__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101933,key);
}
})()], null));

var G__101941 = (i__101858 + (1));
i__101858 = G__101941;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__101859),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101856(cljs.core.chunk_rest(s__101857__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__101859),null);
}
} else {
var key = cljs.core.first(s__101857__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101934__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101933,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101856(cljs.core.rest(s__101857__$2)));
}
} else {
return null;
}
break;
}
});})(seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101929,content_101930,properties_STAR__101931,properties_text_values_101932,properties_101933,properties_text_values_101934__$1,property_ks_101935,content_101936__$1,block_101928,temp__5804__auto___101927,block_id_101925__$1,new_properties_101926,vec__101852_101922,block_id_101923,items_101924,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101929,content_101930,properties_STAR__101931,properties_text_values_101932,properties_101933,properties_text_values_101934__$1,property_ks_101935,content_101936__$1,block_101928,temp__5804__auto___101927,block_id_101925__$1,new_properties_101926,vec__101852_101922,block_id_101923,items_101924,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_101935);
})();
var content_101938__$2 = frontend.handler.file_based.property.util.insert_properties(format_101929,content_101936__$1,kvs_101937);
var content_101939__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_101938__$2);
var block_101940__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101925__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_101933,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_101935,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_101934__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_101939__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_101940__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__101942 = seq__101832_101918;
var G__101943 = chunk__101833_101919;
var G__101944 = count__101834_101920;
var G__101945 = (i__101835_101921 + (1));
seq__101832_101918 = G__101942;
chunk__101833_101919 = G__101943;
count__101834_101920 = G__101944;
i__101835_101921 = G__101945;
continue;
} else {
var temp__5804__auto___101946 = cljs.core.seq(seq__101832_101918);
if(temp__5804__auto___101946){
var seq__101832_101947__$1 = temp__5804__auto___101946;
if(cljs.core.chunked_seq_QMARK_(seq__101832_101947__$1)){
var c__5525__auto___101948 = cljs.core.chunk_first(seq__101832_101947__$1);
var G__101949 = cljs.core.chunk_rest(seq__101832_101947__$1);
var G__101950 = c__5525__auto___101948;
var G__101951 = cljs.core.count(c__5525__auto___101948);
var G__101952 = (0);
seq__101832_101918 = G__101949;
chunk__101833_101919 = G__101950;
count__101834_101920 = G__101951;
i__101835_101921 = G__101952;
continue;
} else {
var vec__101860_101953 = cljs.core.first(seq__101832_101947__$1);
var block_id_101954 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101860_101953,(0),null);
var items_101955 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101860_101953,(1),null);
var block_id_101956__$1 = ((typeof block_id_101954 === 'string')?cljs.core.uuid(block_id_101954):block_id_101954);
var new_properties_101957 = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_101955),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,items_101955));
var temp__5804__auto___101958__$1 = (function (){var G__101863 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101956__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101863) : frontend.db.entity.call(null,G__101863));
})();
if(cljs.core.truth_(temp__5804__auto___101958__$1)){
var block_101959 = temp__5804__auto___101958__$1;
var format_101960 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block_101959,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content_101961 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_101959);
var properties_STAR__101962 = cljs.core.not_empty(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block_101959));
var properties_text_values_101963 = new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block_101959);
var properties_101964 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_STAR__101962,new_properties_101957], 0)));
var properties_text_values_101965__$1 = logseq.common.util.remove_nils_non_nested(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties_text_values_101963,new_properties_101957], 0)));
var property_ks_101966 = cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(properties_101964)),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block_101959),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,items_101955)))));
var content_101967__$1 = (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format_101960,content_101961) : frontend.handler.file_based.property.util.remove_properties.call(null,format_101960,content_101961));
var kvs_101968 = (function (){var iter__5480__auto__ = ((function (seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101960,content_101961,properties_STAR__101962,properties_text_values_101963,properties_101964,properties_text_values_101965__$1,property_ks_101966,content_101967__$1,block_101959,temp__5804__auto___101958__$1,block_id_101956__$1,new_properties_101957,vec__101860_101953,block_id_101954,items_101955,seq__101832_101947__$1,temp__5804__auto___101946,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101864(s__101865){
return (new cljs.core.LazySeq(null,((function (seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101960,content_101961,properties_STAR__101962,properties_text_values_101963,properties_101964,properties_text_values_101965__$1,property_ks_101966,content_101967__$1,block_101959,temp__5804__auto___101958__$1,block_id_101956__$1,new_properties_101957,vec__101860_101953,block_id_101954,items_101955,seq__101832_101947__$1,temp__5804__auto___101946,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_){
return (function (){
var s__101865__$1 = s__101865;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__101865__$1);
if(temp__5804__auto____$2){
var s__101865__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__101865__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__101865__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__101867 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__101866 = (0);
while(true){
if((i__101866 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__101866);
cljs.core.chunk_append(b__101867,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101965__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101964,key);
}
})()], null));

var G__101972 = (i__101866 + (1));
i__101866 = G__101972;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__101867),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101864(cljs.core.chunk_rest(s__101865__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__101867),null);
}
} else {
var key = cljs.core.first(s__101865__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values_101965__$1,key);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_101964,key);
}
})()], null),frontend$handler$file_based$property$batch_set_block_property_aux_BANG__$_iter__101864(cljs.core.rest(s__101865__$2)));
}
} else {
return null;
}
break;
}
});})(seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101960,content_101961,properties_STAR__101962,properties_text_values_101963,properties_101964,properties_text_values_101965__$1,property_ks_101966,content_101967__$1,block_101959,temp__5804__auto___101958__$1,block_id_101956__$1,new_properties_101957,vec__101860_101953,block_id_101954,items_101955,seq__101832_101947__$1,temp__5804__auto___101946,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
,null,null));
});})(seq__101832_101918,chunk__101833_101919,count__101834_101920,i__101835_101921,format_101960,content_101961,properties_STAR__101962,properties_text_values_101963,properties_101964,properties_text_values_101965__$1,property_ks_101966,content_101967__$1,block_101959,temp__5804__auto___101958__$1,block_id_101956__$1,new_properties_101957,vec__101860_101953,block_id_101954,items_101955,seq__101832_101947__$1,temp__5804__auto___101946,_STAR_outliner_ops_STAR__orig_val__101830,_STAR_outliner_ops_STAR__temp_val__101831,test_QMARK___49426__auto__,ops__49427__auto__,editor_info__49428__auto__,col_SINGLEQUOTE_))
;
return iter__5480__auto__(property_ks_101966);
})();
var content_101969__$2 = frontend.handler.file_based.property.util.insert_properties(format_101960,content_101967__$1,kvs_101968);
var content_101970__$3 = frontend.handler.file_based.property.util.remove_empty_properties(content_101969__$2);
var block_101971__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id_101956__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties_101964,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),property_ks_101966,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),properties_text_values_101965__$1,new cljs.core.Keyword("block","title","block/title",710445684),content_101970__$3], null);
frontend.modules.outliner.op.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_101971__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),false], null)], 0));
} else {
}


var G__101977 = cljs.core.next(seq__101832_101947__$1);
var G__101978 = null;
var G__101979 = (0);
var G__101980 = (0);
seq__101832_101918 = G__101977;
chunk__101833_101919 = G__101978;
count__101834_101920 = G__101979;
i__101835_101921 = G__101980;
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
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__101830);
}}
})()),(function (___41611__auto__){
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
return frontend.handler.file_based.property.batch_set_block_property_aux_BANG_(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101868_SHARP_){
return (new cljs.core.PersistentVector(null,3,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__101868_SHARP_,property_key,property_value],null));
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
