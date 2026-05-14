goog.provide('logseq.db.frontend.content');
logseq.db.frontend.content.id_ref_pattern = cljs.core.re_pattern(["\\[\\[","(",logseq.common.util.uuid_pattern,")","\\]\\]"].join(''));
/**
 * Convert id ref backs to page name using refs.
 */
logseq.db.frontend.content.content_id_ref__GT_page = (function logseq$db$frontend$content$content_id_ref__GT_page(content,refs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,ref){
if(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref))){
return clojure.string.replace(content__$1,logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref)),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref));
} else {
return content__$1;
}
}),content,refs);
});
/**
 * Nested pages first
 */
logseq.db.frontend.content.sort_refs = (function logseq$db$frontend$content$sort_refs(refs){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (ref){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(ref);
if(and__5000__auto__){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var title = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.boolean$(cljs.core.re_find(logseq.common.util.page_ref.page_ref_without_nested_re,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref))),title], null);
} else {
return null;
}
}),cljs.core._GT_,refs);
});
/**
 * Convert id ref backs to page name refs using refs.
 */
logseq.db.frontend.content.id_ref__GT_title_ref = (function logseq$db$frontend$content$id_ref__GT_title_ref(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62315 = arguments.length;
var i__5727__auto___62316 = (0);
while(true){
if((i__5727__auto___62316 < len__5726__auto___62315)){
args__5732__auto__.push((arguments[i__5727__auto___62316]));

var G__62317 = (i__5727__auto___62316 + (1));
i__5727__auto___62316 = G__62317;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.frontend.content.id_ref__GT_title_ref.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.frontend.content.id_ref__GT_title_ref.cljs$core$IFn$_invoke$arity$variadic = (function (content_STAR_,refs_STAR_,p__62234){
var map__62236 = p__62234;
var map__62236__$1 = cljs.core.__destructure_map(map__62236);
var replace_block_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62236__$1,new cljs.core.Keyword(null,"replace-block-id?","replace-block-id?",296788113),false);
var refs = (cljs.core.truth_(replace_block_id_QMARK_)?refs_STAR_:cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.common.entity_util.page_QMARK_,refs_STAR_));
var content = cljs.core.str.cljs$core$IFn$_invoke$arity$1(content_STAR_);
if(cljs.core.truth_(cljs.core.re_find(logseq.db.frontend.content.id_ref_pattern,content))){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,ref){
if(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref))){
var content_SINGLEQUOTE_ = (((!(clojure.string.includes_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref)," "))))?clojure.string.replace(content__$1,["#",logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref))].join(''),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref))].join('')):content__$1);
return clojure.string.replace(content_SINGLEQUOTE_,logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref)),logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ref)));
} else {
return content__$1;
}
}),content,logseq.db.frontend.content.sort_refs(refs));
} else {
return content;
}
}));

(logseq.db.frontend.content.id_ref__GT_title_ref.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.frontend.content.id_ref__GT_title_ref.cljs$lang$applyTo = (function (seq62218){
var G__62219 = cljs.core.first(seq62218);
var seq62218__$1 = cljs.core.next(seq62218);
var G__62220 = cljs.core.first(seq62218__$1);
var seq62218__$2 = cljs.core.next(seq62218__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62219,G__62220,seq62218__$2);
}));

logseq.db.frontend.content.get_matched_ids = (function logseq$db$frontend$content$get_matched_ids(content){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.uuid,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.re_seq(logseq.db.frontend.content.id_ref_pattern,content))));
});
logseq.db.frontend.content.replace_tag_ref = (function logseq$db$frontend$content$replace_tag_ref(content,page_name,id){
var page = ((clojure.string.includes_QMARK_(page_name," "))?logseq.common.util.page_ref.__GT_page_ref(page_name):page_name);
var wrapped_id = logseq.common.util.page_ref.__GT_page_ref(id);
var page_name__$1 = logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#%s",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page], 0));
var r = logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#%s",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([wrapped_id], 0));
return clojure.string.replace(content,cljs.core.re_pattern(["(?i)(^|\\s)(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.escape_regex_chars(page_name__$1)),")(?=[,\\.]*($|\\s))"].join('')),(function (p__62258){
var vec__62259 = p__62258;
var _match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62259,(0),null);
var lhs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62259,(1),null);
var _grp2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62259,(2),null);
var _grp3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62259,(3),null);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(lhs),cljs.core.str.cljs$core$IFn$_invoke$arity$1(r)].join('');
}));
});
logseq.db.frontend.content.replace_page_ref = (function logseq$db$frontend$content$replace_page_ref(content,page_name,id){
var vec__62272 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.__GT_page_ref,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name,id], null));
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62272,(0),null);
var wrapped_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62272,(1),null);
return logseq.common.util.replace_ignore_case(content,page,wrapped_id);
});
logseq.db.frontend.content.replace_page_ref_with_id = (function logseq$db$frontend$content$replace_page_ref_with_id(content,page_name,id,replace_tag_QMARK_){
var page_name__$1 = clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),"HashTag-","#");
var id__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(id);
var content_SINGLEQUOTE_ = logseq.db.frontend.content.replace_page_ref(content,page_name__$1,id__$1);
if(cljs.core.truth_(replace_tag_QMARK_)){
return logseq.db.frontend.content.replace_tag_ref(content_SINGLEQUOTE_,page_name__$1,id__$1);
} else {
return content_SINGLEQUOTE_;
}
});
/**
 * Convert ref to id refs e.g. `[[page name]] -> [[uuid]].
 */
logseq.db.frontend.content.title_ref__GT_id_ref = (function logseq$db$frontend$content$title_ref__GT_id_ref(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62318 = arguments.length;
var i__5727__auto___62319 = (0);
while(true){
if((i__5727__auto___62319 < len__5726__auto___62318)){
args__5732__auto__.push((arguments[i__5727__auto___62319]));

var G__62320 = (i__5727__auto___62319 + (1));
i__5727__auto___62319 = G__62320;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.frontend.content.title_ref__GT_id_ref.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.frontend.content.title_ref__GT_id_ref.cljs$core$IFn$_invoke$arity$variadic = (function (title,refs,p__62286){
var map__62288 = p__62286;
var map__62288__$1 = cljs.core.__destructure_map(map__62288);
var replace_tag_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__62288__$1,new cljs.core.Keyword(null,"replace-tag?","replace-tag?",-1653793949),true);
if(typeof title === 'string'){
} else {
throw (new Error("Assert failed: (string? title)"));
}

var refs_SINGLEQUOTE_ = logseq.db.frontend.content.sort_refs(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
if(((cljs.core.vector_QMARK_(ref)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.second(ref),new cljs.core.Keyword("block","title","block/title",710445684),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(ref))], null);
} else {
return ref;
}
}),refs));
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content,p__62297){
var map__62300 = p__62297;
var map__62300__$1 = cljs.core.__destructure_map(map__62300);
var block = map__62300__$1;
var uuid_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62300__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62300__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var title_SINGLEQUOTE_ = (function (){var or__5002__auto__ = new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title__$1;
}
})();
return logseq.db.frontend.content.replace_page_ref_with_id(content,title_SINGLEQUOTE_,uuid_SINGLEQUOTE_,replace_tag_QMARK_);
}),title,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),refs_SINGLEQUOTE_));
}));

(logseq.db.frontend.content.title_ref__GT_id_ref.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.frontend.content.title_ref__GT_id_ref.cljs$lang$applyTo = (function (seq62281){
var G__62282 = cljs.core.first(seq62281);
var seq62281__$1 = cljs.core.next(seq62281);
var G__62283 = cljs.core.first(seq62281__$1);
var seq62281__$2 = cljs.core.next(seq62281__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62282,G__62283,seq62281__$2);
}));

/**
 * Replace `[[internal-id]]` with `[[page name]]`
 */
logseq.db.frontend.content.update_block_content = (function logseq$db$frontend$content$update_block_content(db,item,eid){
var temp__5802__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(temp__5802__auto__)){
var content = temp__5802__auto__;
var refs = new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.frontend.content.id_ref__GT_title_ref(content,refs));
} else {
return item;
}
});
/**
 * Replace tag names in content with page-ref ids e.g. #TAG -> [[UUID]].
 * Ignore case because tags in content can have any case and still have a valid ref
 */
logseq.db.frontend.content.replace_tags_with_id_refs = (function logseq$db$frontend$content$replace_tags_with_id_refs(content,tags){
return clojure.string.trim(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,tag){
var id_ref = logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(tag));
return logseq.common.util.replace_ignore_case(logseq.common.util.replace_ignore_case(content__$1,["#",logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag))].join(''),id_ref),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag))].join(''),id_ref);
}),content,logseq.db.frontend.content.sort_refs(tags)));
});
/**
 * Replace tag refs in content with page refs e.g. #[[UUID]] -> [[UUID]]
 */
logseq.db.frontend.content.replace_tag_refs_with_page_refs = (function logseq$db$frontend$content$replace_tag_refs_with_page_refs(content,tags){
return clojure.string.trim(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,tag){
var id_ref = logseq.common.util.page_ref.__GT_page_ref(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(tag));
return logseq.common.util.replace_ignore_case(logseq.common.util.replace_ignore_case(content__$1,["#",id_ref].join(''),id_ref),["#",id_ref].join(''),id_ref);
}),content,logseq.db.frontend.content.sort_refs(tags)));
});
/**
 * Convert id ref (recursively) backs to page name refs, returns replaced title
 */
logseq.db.frontend.content.recur_replace_uuid_in_block_title = (function logseq$db$frontend$content$recur_replace_uuid_in_block_title(var_args){
var G__62307 = arguments.length;
switch (G__62307) {
case 1:
return logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1 = (function (ent){
return logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$2(ent,(10));
}));

(logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$2 = (function (ent,max_depth){
if(cljs.core.truth_((function (){var G__62308 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent);
if((G__62308 == null)){
return null;
} else {
return cljs.core.re_find(logseq.db.frontend.content.id_ref_pattern,G__62308);
}
})())){
var ref_set = (function (){var result_refs = new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(ent);
var current_refs = new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(ent);
var depth = (0);
while(true){
if((((depth >= max_depth)) || (cljs.core.empty_QMARK_(current_refs)))){
return result_refs;
} else {
var next_refs = cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([current_refs], 0)));
var result_refs_SINGLEQUOTE_ = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.conj,result_refs,next_refs);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(result_refs_SINGLEQUOTE_),cljs.core.count(result_refs))){
return result_refs;
} else {
var G__62327 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.conj,result_refs,next_refs);
var G__62328 = next_refs;
var G__62329 = (depth + (1));
result_refs = G__62327;
current_refs = G__62328;
depth = G__62329;
continue;
}
}
break;
}
})();
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"replace-block-id?","replace-block-id?",296788113),true], null);
var result = logseq.db.frontend.content.id_ref__GT_title_ref.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent),ref_set,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
var last_result = null;
var depth = (0);
while(true){
if((((depth >= max_depth)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_result,result)))){
return result;
} else {
var G__62331 = logseq.db.frontend.content.id_ref__GT_title_ref.cljs$core$IFn$_invoke$arity$variadic(result,ref_set,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
var G__62332 = result;
var G__62333 = (depth + (1));
result = G__62331;
last_result = G__62332;
depth = G__62333;
continue;
}
break;
}
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent);
}
}));

(logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=logseq.db.frontend.content.js.map
