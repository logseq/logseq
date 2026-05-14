goog.provide('frontend.handler.import$');
frontend.handler.import$.import_from_opml_BANG_ = (function frontend$handler$import$import_from_opml_BANG_(data,finished_ok_handler){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var config = logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var vec__131139 = frontend.format.mldoc.opml__GT_edn(config,data);
var headers = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131139,(0),null);
var parsed_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131139,(1),null);
var parsed_blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [b,cljs.core.PersistentArrayMap.EMPTY], null);
}),parsed_blocks);
var page_name = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(headers);
var parsed_blocks__$2 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.wrap_parse_block,frontend.format.block.extract_blocks(parsed_blocks__$1,"",new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name], null)));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not((frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.page_exists_QMARK_.call(null,page_name))))?(function (){var G__131142 = page_name;
var G__131143 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131142,G__131143) : frontend.handler.page._LT_create_BANG_.call(null,G__131142,G__131143));
})():null)),(function (___41611__auto__){
return promesa.protocols._promise((function (){var page_block = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(page_block);
var blocks = (frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1(children) : frontend.db.sort_by_order.call(null,children));
var last_block = cljs.core.last(blocks);
var snd_last_block = cljs.core.last(cljs.core.butlast(blocks));
var vec__131144 = (cljs.core.truth_((function (){var and__5000__auto__ = last_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(last_block));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [last_block,true], null):(cljs.core.truth_(snd_last_block)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [snd_last_block,true], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_block,false], null)));
var target_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131144,(0),null);
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131144,(1),null);
frontend.handler.editor.paste_blocks(parsed_blocks__$2,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"target-block","target-block",348392017),target_block,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_], null));

var G__131147 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name], null);
return (finished_ok_handler.cljs$core$IFn$_invoke$arity$1 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$1(G__131147) : finished_ok_handler.call(null,G__131147));
})());
}));
}));
} else {
return null;
}
});
/**
 * Create page from the per page object generated in `export-repo-as-edn-v2!`
 * Return page-name (title)
 * Extension to `insert-block-tree-after-target`
 * :id       - page's uuid
 * :title    - page's title (original name)
 * :children - tree
 * :properties - map
 * 
 */
frontend.handler.import$.create_page_with_exported_tree_BANG_ = (function frontend$handler$import$create_page_with_exported_tree_BANG_(p__131149){
var map__131150 = p__131149;
var map__131150__$1 = cljs.core.__destructure_map(map__131150);
var tree = map__131150__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131150__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131150__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131150__$1,new cljs.core.Keyword(null,"title","title",636505583));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131150__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131150__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var title_131241__$1 = clojure.string.trim(title);
var has_children_QMARK__131242 = cljs.core.seq(children);
var page_format_131243 = (function (){var or__5002__auto__ = (function (){var G__131151 = tree;
var G__131151__$1 = (((G__131151 == null))?null:new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(G__131151));
var G__131151__$2 = (((G__131151__$1 == null))?null:cljs.core.first(G__131151__$1));
if((G__131151__$2 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"format","format",-1306924766).cljs$core$IFn$_invoke$arity$1(G__131151__$2);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var whiteboard_QMARK__131244 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"whiteboard");
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){try{var G__131153 = title_131241__$1;
var G__131154 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"format","format",-1306924766),page_format_131243,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),uuid,new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK__131244], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131153,G__131154) : frontend.handler.page._LT_create_BANG_.call(null,G__131153,G__131154));
}catch (e131152){var e = e131152;
console.error(e);

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tree","tree",-196312028),tree], null)], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Error happens when creating page ",title_131241__$1,":\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),"\nSkipped and continue the remaining import."].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
}})()),(function (___41611__auto__){
return promesa.protocols._promise(((has_children_QMARK__131242)?(function (){var page_name = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(title_131241__$1) : frontend.util.page_name_sanity_lc.call(null,title_131241__$1));
var page_block = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
try{if(whiteboard_QMARK__131244){
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131148_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__131148_SHARP_,logseq.graph_parser.whiteboard.with_whiteboard_block_props(p1__131148_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid], null))], 0));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.whiteboard.migrate_shape_block,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(medley.core.map_keys,(function (k){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("block",k);
})),children)));
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(blocks);
} else {
return frontend.handler.editor.insert_block_tree(children,page_format_131243,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"target-block","target-block",348392017),page_block,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
}
}catch (e131155){var e = e131155;
console.error(e);

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tree","tree",-196312028),tree], null)], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Error happens when creating block content of page ",title_131241__$1,"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),"\nSkipped and continue the remaining import."].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
}})():null));
}));
}));

return title;
});
/**
 * Collect all uuids from page trees and write them to the db before hand.
 */
frontend.handler.import$.pre_transact_uuids_BANG_ = (function frontend$handler$import$pre_transact_uuids_BANG_(pages){
var uuids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (block){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719).cljs$core$IFn$_invoke$arity$1(block)], null);
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__131156_SHARP_){
return cljs.core.tree_seq(cljs.core.map_QMARK_,new cljs.core.Keyword(null,"children","children",-940561982),p1__131156_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages], 0)));
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(uuids);
});
/**
 * Not rely on file system - backend compatible.
 * tree-translator-fn: translate exported tree structure to the desired tree for import
 */
frontend.handler.import$.import_from_tree_BANG_ = (function frontend$handler$import$import_from_tree_BANG_(data,tree_translator_fn){
var imported_chan = cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0();
try{var blocks = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"title","title",636505583),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(tree_translator_fn,new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(data))));
var job_chan = cljs.core.async.to_chan_BANG_(blocks);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"total","total",1916810418)], null),cljs.core.count(blocks));

frontend.handler.import$.pre_transact_uuids_BANG_(blocks);

var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_131195){
var state_val_131196 = (state_131195[(1)]);
if((state_val_131196 === (7))){
var inst_131191 = (state_131195[(2)]);
var state_131195__$1 = state_131195;
var statearr_131197_131245 = state_131195__$1;
(statearr_131197_131245[(2)] = inst_131191);

(statearr_131197_131245[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_131196 === (1))){
var state_131195__$1 = state_131195;
var statearr_131198_131246 = state_131195__$1;
(statearr_131198_131246[(2)] = null);

(statearr_131198_131246[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_131196 === (4))){
var inst_131160 = (state_131195[(7)]);
var inst_131160__$1 = (state_131195[(2)]);
var state_131195__$1 = (function (){var statearr_131199 = state_131195;
(statearr_131199[(7)] = inst_131160__$1);

return statearr_131199;
})();
if(cljs.core.truth_(inst_131160__$1)){
var statearr_131200_131247 = state_131195__$1;
(statearr_131200_131247[(1)] = (5));

} else {
var statearr_131201_131248 = state_131195__$1;
(statearr_131201_131248[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_131196 === (6))){
var inst_131183 = frontend.state.get_current_repo();
var inst_131184 = frontend.db.async._LT_get_all_referenced_blocks_uuid(inst_131183);
var inst_131185 = cljs.core.async.interop.p__GT_c(inst_131184);
var state_131195__$1 = state_131195;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_131195__$1,(9),inst_131185);
} else {
if((state_val_131196 === (3))){
var inst_131193 = (state_131195[(2)]);
var state_131195__$1 = state_131195;
return cljs.core.async.impl.ioc_helpers.return_chan(state_131195__$1,inst_131193);
} else {
if((state_val_131196 === (2))){
var state_131195__$1 = state_131195;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_131195__$1,(4),job_chan);
} else {
if((state_val_131196 === (9))){
var inst_131187 = (state_131195[(2)]);
var inst_131188 = frontend.handler.editor.set_blocks_id_BANG_(inst_131187);
var inst_131189 = cljs.core.async.offer_BANG_(imported_chan,true);
var state_131195__$1 = (function (){var statearr_131202 = state_131195;
(statearr_131202[(8)] = inst_131188);

return statearr_131202;
})();
var statearr_131203_131249 = state_131195__$1;
(statearr_131203_131249[(2)] = inst_131189);

(statearr_131203_131249[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_131196 === (5))){
var inst_131160 = (state_131195[(7)]);
var inst_131166 = (state_131195[(9)]);
var inst_131165 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_131160,(0),null);
var inst_131166__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_131160,(1),null);
var inst_131167 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_131168 = [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-idx","current-idx",1734114444)];
var inst_131169 = (new cljs.core.PersistentVector(null,2,(5),inst_131167,inst_131168,null));
var inst_131170 = (inst_131165 + (1));
var inst_131171 = frontend.state.set_state_BANG_(inst_131169,inst_131170);
var inst_131172 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_131173 = [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-page","current-page",-101294180)];
var inst_131174 = (new cljs.core.PersistentVector(null,2,(5),inst_131172,inst_131173,null));
var inst_131175 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(inst_131166__$1);
var inst_131176 = frontend.state.set_state_BANG_(inst_131174,inst_131175);
var inst_131177 = cljs.core.async.timeout((10));
var state_131195__$1 = (function (){var statearr_131204 = state_131195;
(statearr_131204[(9)] = inst_131166__$1);

(statearr_131204[(10)] = inst_131171);

(statearr_131204[(11)] = inst_131176);

return statearr_131204;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_131195__$1,(8),inst_131177);
} else {
if((state_val_131196 === (8))){
var inst_131166 = (state_131195[(9)]);
var inst_131179 = (state_131195[(2)]);
var inst_131180 = frontend.handler.import$.create_page_with_exported_tree_BANG_(inst_131166);
var state_131195__$1 = (function (){var statearr_131205 = state_131195;
(statearr_131205[(12)] = inst_131179);

(statearr_131205[(13)] = inst_131180);

return statearr_131205;
})();
var statearr_131206_131250 = state_131195__$1;
(statearr_131206_131250[(2)] = null);

(statearr_131206_131250[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_131207 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_131207[(0)] = frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__);

(statearr_131207[(1)] = (1));

return statearr_131207;
});
var frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____1 = (function (state_131195){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_131195);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e131208){var ex__32007__auto__ = e131208;
var statearr_131209_131251 = state_131195;
(statearr_131209_131251[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_131195[(4)]))){
var statearr_131210_131252 = state_131195;
(statearr_131210_131252[(1)] = cljs.core.first((state_131195[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__131253 = state_131195;
state_131195 = G__131253;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__ = function(state_131195){
switch(arguments.length){
case 0:
return frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____1.call(this,state_131195);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____0;
frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto____1;
return frontend$handler$import$import_from_tree_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_131211 = f__32196__auto__();
(statearr_131211[(6)] = c__32195__auto__);

return statearr_131211;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}catch (e131157){var e = e131157;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Error happens when importing:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.async.offer_BANG_(imported_chan,true);
}});
/**
 * Actions to do for loading edn tree structure.
 * 1) Removes namespace `:block/` from all levels of the `tree-vec`
 * 2) Rename all :block/page-name to :title
 * 3) Rename all :block/id to :uuid
 */
frontend.handler.import$.tree_vec_translate_edn = (function frontend$handler$import$tree_vec_translate_edn(tree_vec){
var kw_trans_fn = (function (p1__131212_SHARP_){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.replace(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__131212_SHARP_),":block/page-name",":block/title"),":block/id",":block/uuid"),":block/",""));
});
var map_trans_fn = (function (acc,k,v){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,kw_trans_fn(k),v);
});
var tree_trans_fn = (function (form){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(form);
if(and__5000__auto__){
return new cljs.core.Keyword("block","id","block/id",-1461684825).cljs$core$IFn$_invoke$arity$1(form);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reduce_kv(map_trans_fn,cljs.core.PersistentArrayMap.EMPTY,form);
} else {
return form;
}
});
return clojure.walk.postwalk(tree_trans_fn,tree_vec);
});
frontend.handler.import$.import_from_edn_BANG_ = (function frontend$handler$import$import_from_edn_BANG_(raw,finished_ok_handler){
try{var data = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(raw);
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_131219){
var state_val_131220 = (state_131219[(1)]);
if((state_val_131220 === (1))){
var inst_131214 = frontend.handler.import$.import_from_tree_BANG_(data,frontend.handler.import$.tree_vec_translate_edn);
var state_131219__$1 = state_131219;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_131219__$1,(2),inst_131214);
} else {
if((state_val_131220 === (2))){
var inst_131216 = (state_131219[(2)]);
var inst_131217 = (finished_ok_handler.cljs$core$IFn$_invoke$arity$1 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$1(null) : finished_ok_handler.call(null,null));
var state_131219__$1 = (function (){var statearr_131221 = state_131219;
(statearr_131221[(7)] = inst_131216);

return statearr_131221;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_131219__$1,inst_131217);
} else {
return null;
}
}
});
return (function() {
var frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_131222 = [null,null,null,null,null,null,null,null];
(statearr_131222[(0)] = frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__);

(statearr_131222[(1)] = (1));

return statearr_131222;
});
var frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____1 = (function (state_131219){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_131219);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e131223){var ex__32007__auto__ = e131223;
var statearr_131224_131254 = state_131219;
(statearr_131224_131254[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_131219[(4)]))){
var statearr_131225_131255 = state_131219;
(statearr_131225_131255[(1)] = cljs.core.first((state_131219[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__131256 = state_131219;
state_131219 = G__131256;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__ = function(state_131219){
switch(arguments.length){
case 0:
return frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____1.call(this,state_131219);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____0;
frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto____1;
return frontend$handler$import$import_from_edn_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_131226 = f__32196__auto__();
(statearr_131226[(6)] = c__32195__auto__);

return statearr_131226;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}catch (e131213){var e = e131213;
console.error(e);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message),new cljs.core.Keyword(null,"error","error",-978969032));
}});
/**
 * Actions to do for loading json tree structure.
 * 1) Rename all :id to :uuid
 * 2) Rename all :page-name to :title
 * 3) Rename all :format "markdown" to :format `:markdown`
 */
frontend.handler.import$.tree_vec_translate_json = (function frontend$handler$import$tree_vec_translate_json(tree_vec){
var kw_trans_fn = (function (p1__131227_SHARP_){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.replace(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__131227_SHARP_),":page-name",":title"),":id",":uuid"),/^:/,""));
});
var map_trans_fn = (function (acc,k,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"format","format",-1306924766),k)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,kw_trans_fn(k),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(v));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),k)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,kw_trans_fn(k),cljs.core.uuid(v));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,kw_trans_fn(k),v);

}
}
});
var tree_trans_fn = (function (form){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(form);
if(and__5000__auto__){
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(form);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reduce_kv(map_trans_fn,cljs.core.PersistentArrayMap.EMPTY,form);
} else {
return form;
}
});
return clojure.walk.postwalk(tree_trans_fn,tree_vec);
});
frontend.handler.import$.import_from_json_BANG_ = (function frontend$handler$import$import_from_json_BANG_(raw,finished_ok_handler){
var json = JSON.parse(raw);
var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(json,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_131233){
var state_val_131234 = (state_131233[(1)]);
if((state_val_131234 === (1))){
var inst_131228 = frontend.handler.import$.import_from_tree_BANG_(clj_data,frontend.handler.import$.tree_vec_translate_json);
var state_131233__$1 = state_131233;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_131233__$1,(2),inst_131228);
} else {
if((state_val_131234 === (2))){
var inst_131230 = (state_131233[(2)]);
var inst_131231 = (finished_ok_handler.cljs$core$IFn$_invoke$arity$1 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$1(null) : finished_ok_handler.call(null,null));
var state_131233__$1 = (function (){var statearr_131235 = state_131233;
(statearr_131235[(7)] = inst_131230);

return statearr_131235;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_131233__$1,inst_131231);
} else {
return null;
}
}
});
return (function() {
var frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__ = null;
var frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_131236 = [null,null,null,null,null,null,null,null];
(statearr_131236[(0)] = frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__);

(statearr_131236[(1)] = (1));

return statearr_131236;
});
var frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____1 = (function (state_131233){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_131233);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e131237){var ex__32007__auto__ = e131237;
var statearr_131238_131257 = state_131233;
(statearr_131238_131257[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_131233[(4)]))){
var statearr_131239_131258 = state_131233;
(statearr_131239_131258[(1)] = cljs.core.first((state_131233[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__131260 = state_131233;
state_131233 = G__131260;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__ = function(state_131233){
switch(arguments.length){
case 0:
return frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____1.call(this,state_131233);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____0;
frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto____1;
return frontend$handler$import$import_from_json_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_131240 = f__32196__auto__();
(statearr_131240[(6)] = c__32195__auto__);

return statearr_131240;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});

//# sourceMappingURL=frontend.handler.import.js.map
