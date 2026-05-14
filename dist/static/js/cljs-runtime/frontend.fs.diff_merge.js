goog.provide('frontend.fs.diff_merge');
var module$node_modules$$logseq$diff_merge$dist$diff_merge_umd_cjs=shadow.js.require("module$node_modules$$logseq$diff_merge$dist$diff_merge_umd_cjs", {});
/**
 * 2-ways diff
 * Accept: blocks in the struct with the required info
 * Please refer to the `Block` struct in the link below
 * https://github.com/logseq/diff-merge/blob/master/lib/mldoc.ts
 */
frontend.fs.diff_merge.diff = (function frontend$fs$diff_merge$diff(base,incoming){
var differ = (new module$node_modules$$logseq$diff_merge$dist$diff_merge_umd_cjs.Differ());
return differ.diff_logseqMode(cljs_bean.core.__GT_js(base),cljs_bean.core.__GT_js(incoming));
});
if((typeof frontend !== 'undefined') && (typeof frontend.fs !== 'undefined') && (typeof frontend.fs.diff_merge !== 'undefined') && (typeof frontend.fs.diff_merge.attachUUID !== 'undefined')){
} else {
frontend.fs.diff_merge.attachUUID = module$node_modules$$logseq$diff_merge$dist$diff_merge_umd_cjs.attach_uuids;
}
/**
 * db: datascript db
 * page-name: string
 */
frontend.fs.diff_merge.db__GT_diff_blocks = (function frontend$fs$diff_merge$db__GT_diff_blocks(page_name){
if(cljs.core.string_QMARK_){
} else {
throw (new Error("Assert failed: string?"));
}

if(cljs.core.truth_(page_name)){
} else {
throw (new Error("Assert failed: page-name"));
}

var walked = frontend.db.file_based.model.get_sorted_page_block_ids_and_levels(page_name);
var blocks = frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","level","block/level",1182509971)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),walked));
var levels = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"level","level",1290497552),walked);
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$3((function (block,level){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"level","level",1290497552),level], null);
}),blocks,levels);
return blocks__$1;
});
/**
 * Prepare the blocks for diff-merge
 * blocks: ast of blocks
 * content: corresponding raw content
 */
frontend.fs.diff_merge.ast__GT_diff_blocks = (function frontend$fs$diff_merge$ast__GT_diff_blocks(blocks,content,format,p__66167){
var map__66168 = p__66167;
var map__66168__$1 = cljs.core.__destructure_map(map__66168);
var user_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66168__$1,new cljs.core.Keyword(null,"user-config","user-config",-1138679827));
var block_pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66168__$1,new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959));
if(typeof content === 'string'){
} else {
throw (new Error("Assert failed: (string? content)"));
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"markdown","markdown",1227225089),null,new cljs.core.Keyword(null,"org","org",1495985),null], null), null),format)){
} else {
throw (new Error("Assert failed: (contains? #{:markdown :org} format)"));
}

var encoded_content = logseq.graph_parser.utf8.encode(content);
var headings = cljs.core.PersistentVector.EMPTY;
var blocks__$1 = cljs.core.reverse(blocks);
var properties = cljs.core.PersistentArrayMap.EMPTY;
var end_pos = encoded_content.length;
while(true){
if(cljs.core.seq(blocks__$1)){
var vec__66213 = cljs.core.first(blocks__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66213,(0),null);
var pos_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66213,(1),null);
var pos_meta__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(pos_meta,new cljs.core.Keyword(null,"end_pos","end_pos",-1418940),end_pos);
if(logseq.graph_parser.block.heading_block_QMARK_(block)){
var content__$1 = logseq.graph_parser.block.get_block_content(encoded_content,cljs.core.second(block),format,pos_meta__$1,block_pattern);
var G__66322 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(headings,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"body","body",-2049205669),content__$1,new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(properties)], null));
var G__66323 = cljs.core.rest(blocks__$1);
var G__66324 = cljs.core.PersistentArrayMap.EMPTY;
var G__66325 = new cljs.core.Keyword(null,"start_pos","start_pos",272375959).cljs$core$IFn$_invoke$arity$1(pos_meta__$1);
headings = G__66322;
blocks__$1 = G__66323;
properties = G__66324;
end_pos = G__66325;
continue;
} else {
if(logseq.graph_parser.property.properties_ast_QMARK_(block)){
var new_props = new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(logseq.graph_parser.block.extract_properties(cljs.core.second(block),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(user_config,new cljs.core.Keyword(null,"format","format",-1306924766),format)));
var G__66326 = headings;
var G__66327 = cljs.core.rest(blocks__$1);
var G__66328 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties,new_props], 0));
var G__66329 = new cljs.core.Keyword(null,"end_pos","end_pos",-1418940).cljs$core$IFn$_invoke$arity$1(pos_meta__$1);
headings = G__66326;
blocks__$1 = G__66327;
properties = G__66328;
end_pos = G__66329;
continue;
} else {
var G__66330 = headings;
var G__66331 = cljs.core.rest(blocks__$1);
var G__66332 = properties;
var G__66333 = new cljs.core.Keyword(null,"end_pos","end_pos",-1418940).cljs$core$IFn$_invoke$arity$1(pos_meta__$1);
headings = G__66330;
blocks__$1 = G__66331;
properties = G__66332;
end_pos = G__66333;
continue;

}
}
} else {
if(cljs.core.empty_QMARK_(properties)){
return cljs.core.reverse(headings);
} else {
var vec__66235 = cljs.core.first(blocks__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66235,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66235,(1),null);
var pos_meta = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start_pos","start_pos",272375959),(0),new cljs.core.Keyword(null,"end_pos","end_pos",-1418940),end_pos], null);
var content__$1 = logseq.graph_parser.block.get_block_content(encoded_content,block,format,pos_meta,block_pattern);
var uuid = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(properties);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"body","body",-2049205669),content__$1,new cljs.core.Keyword(null,"level","level",1290497552),(1),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),uuid], null),cljs.core.reverse(headings));
}
}
break;
}
});
/**
 * Replace gp-block/get-block-content, return bare content, without any trim
 */
frontend.fs.diff_merge.get_sub_content_from_pos_meta = (function frontend$fs$diff_merge$get_sub_content_from_pos_meta(raw_content,pos_meta){
var map__66240 = pos_meta;
var map__66240__$1 = cljs.core.__destructure_map(map__66240);
var start_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66240__$1,new cljs.core.Keyword(null,"start_pos","start_pos",272375959));
var end_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66240__$1,new cljs.core.Keyword(null,"end_pos","end_pos",-1418940));
return logseq.graph_parser.utf8.substring.cljs$core$IFn$_invoke$arity$3(raw_content,start_pos,end_pos);
});
/**
 * Prepare the blocks for diff-merge
 * blocks: ast of blocks
 * content: corresponding raw content
 */
frontend.fs.diff_merge.ast__GT_diff_blocks_alt = (function frontend$fs$diff_merge$ast__GT_diff_blocks_alt(blocks,content,format,p__66241){
var map__66242 = p__66241;
var map__66242__$1 = cljs.core.__destructure_map(map__66242);
var user_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66242__$1,new cljs.core.Keyword(null,"user-config","user-config",-1138679827));
var block_pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66242__$1,new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959));
if(typeof content === 'string'){
} else {
throw (new Error("Assert failed: (string? content)"));
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"markdown","markdown",1227225089),null,new cljs.core.Keyword(null,"org","org",1495985),null], null), null),format)){
} else {
throw (new Error("Assert failed: (contains? #{:markdown :org} format)"));
}

var utf8_encoded_content = logseq.graph_parser.utf8.encode(content);
var headings = cljs.core.PersistentVector.EMPTY;
var blocks__$1 = cljs.core.reverse(blocks);
var properties = cljs.core.PersistentArrayMap.EMPTY;
var end_pos = utf8_encoded_content.length;
while(true){
if(cljs.core.seq(blocks__$1)){
var vec__66280 = cljs.core.first(blocks__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66280,(0),null);
var pos_meta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66280,(1),null);
var fixed_pos_meta = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(pos_meta,new cljs.core.Keyword(null,"end_pos","end_pos",-1418940),end_pos);
if(logseq.graph_parser.block.heading_block_QMARK_(block)){
var content__$1 = logseq.graph_parser.block.get_block_content(utf8_encoded_content,cljs.core.second(block),format,fixed_pos_meta,block_pattern);
var content_raw = frontend.fs.diff_merge.get_sub_content_from_pos_meta(utf8_encoded_content,fixed_pos_meta);
var G__66334 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(headings,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"body","body",-2049205669),content__$1,new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"raw-body","raw-body",819785310),clojure.string.trimr(content_raw)], null),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(cljs.core.second(block)),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(properties)], null));
var G__66335 = cljs.core.rest(blocks__$1);
var G__66336 = cljs.core.PersistentArrayMap.EMPTY;
var G__66337 = new cljs.core.Keyword(null,"start_pos","start_pos",272375959).cljs$core$IFn$_invoke$arity$1(fixed_pos_meta);
headings = G__66334;
blocks__$1 = G__66335;
properties = G__66336;
end_pos = G__66337;
continue;
} else {
if(logseq.graph_parser.property.properties_ast_QMARK_(block)){
var new_props = new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(logseq.graph_parser.block.extract_properties(cljs.core.second(block),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(user_config,new cljs.core.Keyword(null,"format","format",-1306924766),format)));
var G__66338 = headings;
var G__66339 = cljs.core.rest(blocks__$1);
var G__66340 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties,new_props], 0));
var G__66341 = new cljs.core.Keyword(null,"end_pos","end_pos",-1418940).cljs$core$IFn$_invoke$arity$1(fixed_pos_meta);
headings = G__66338;
blocks__$1 = G__66339;
properties = G__66340;
end_pos = G__66341;
continue;
} else {
var G__66342 = headings;
var G__66343 = cljs.core.rest(blocks__$1);
var G__66344 = properties;
var G__66345 = new cljs.core.Keyword(null,"end_pos","end_pos",-1418940).cljs$core$IFn$_invoke$arity$1(fixed_pos_meta);
headings = G__66342;
blocks__$1 = G__66343;
properties = G__66344;
end_pos = G__66345;
continue;

}
}
} else {
if(cljs.core.empty_QMARK_(properties)){
return cljs.core.reverse(headings);
} else {
var vec__66297 = cljs.core.first(blocks__$1);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66297,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66297,(1),null);
var pos_meta = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start_pos","start_pos",272375959),(0),new cljs.core.Keyword(null,"end_pos","end_pos",-1418940),end_pos], null);
var content__$1 = logseq.graph_parser.block.get_block_content(utf8_encoded_content,block,format,pos_meta,block_pattern);
var content_raw = frontend.fs.diff_merge.get_sub_content_from_pos_meta(utf8_encoded_content,pos_meta);
var uuid = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(properties);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"body","body",-2049205669),content__$1,new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"raw-body","raw-body",819785310),clojure.string.trimr(content_raw)], null),new cljs.core.Keyword(null,"level","level",1290497552),(1),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),uuid], null),cljs.core.reverse(headings));

}
}
break;
}
});
/**
 * translate [[[op block]]] to merged content
 */
frontend.fs.diff_merge.rebuild_content = (function frontend$fs$diff_merge$rebuild_content(_base_diffblocks,diffs,_format){
var ops_fn = (function (ops){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__66313){
var vec__66314 = p__66313;
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66314,(0),null);
var map__66317 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66314,(1),null);
var map__66317__$1 = cljs.core.__destructure_map(map__66317);
var meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66317__$1,new cljs.core.Keyword(null,"meta","meta",1499536964));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,(0))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,(1))))){
return new cljs.core.Keyword(null,"raw-body","raw-body",819785310).cljs$core$IFn$_invoke$arity$1(meta);
} else {
return null;
}
}),ops);
});
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.seq,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(ops_fn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([diffs], 0))));
});
frontend.fs.diff_merge.three_way_merge = (function frontend$fs$diff_merge$three_way_merge(base,income,current,format){
var __GT_ast = (function (text){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985))){
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2(text,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"org","org",1495985)));
} else {
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2(text,logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
}
});
var options = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),"*"], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),"-"], null));
var merger = (new module$node_modules$$logseq$diff_merge$dist$diff_merge_umd_cjs.Merger());
var base_ast = __GT_ast(base);
var base_diffblocks = frontend.fs.diff_merge.ast__GT_diff_blocks_alt(base_ast,base,format,options);
var income_ast = __GT_ast(income);
var income_diffblocks = frontend.fs.diff_merge.ast__GT_diff_blocks_alt(income_ast,income,format,options);
var current_ast = __GT_ast(current);
var current_diffblocks = frontend.fs.diff_merge.ast__GT_diff_blocks_alt(current_ast,current,format,options);
var branch_diffblocks = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_diffblocks,income_diffblocks], null);
var merged = merger.mergeBlocks(cljs_bean.core.__GT_js(base_diffblocks),cljs_bean.core.__GT_js(branch_diffblocks));
var merged_diff = cljs_bean.core.__GT_clj(merged);
var merged_content = frontend.fs.diff_merge.rebuild_content(base_diffblocks,merged_diff,format);
return merged_content;
});

//# sourceMappingURL=frontend.fs.diff_merge.js.map
