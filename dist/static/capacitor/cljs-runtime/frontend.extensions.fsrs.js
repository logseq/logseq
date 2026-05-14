goog.provide('frontend.extensions.fsrs');
frontend.extensions.fsrs.instant__GT_inst_ms = cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.inst_ms,tick.core.inst);
frontend.extensions.fsrs.inst_ms__GT_instant = (function frontend$extensions$fsrs$inst_ms__GT_instant(ms){
return tick.core.instant.cljs$core$IFn$_invoke$arity$1((new Date(ms)));
});
/**
 * Convert card-map to value stored in property
 */
frontend.extensions.fsrs.fsrs_card_map__GT_property_fsrs_state = (function frontend$extensions$fsrs$fsrs_card_map__GT_property_fsrs_state(fsrs_card_map){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(fsrs_card_map,new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113),frontend.extensions.fsrs.instant__GT_inst_ms),new cljs.core.Keyword(null,"due","due",-1754731313),frontend.extensions.fsrs.instant__GT_inst_ms);
});
/**
 * opposite version of `fsrs-card->property-fsrs-state`
 */
frontend.extensions.fsrs.property_fsrs_state__GT_fsrs_card_map = (function frontend$extensions$fsrs$property_fsrs_state__GT_fsrs_card_map(prop_fsrs_state){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(prop_fsrs_state,new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113),frontend.extensions.fsrs.inst_ms__GT_instant),new cljs.core.Keyword(null,"due","due",-1754731313),frontend.extensions.fsrs.inst_ms__GT_instant);
});
/**
 * Return nil if block is not #card.
 *   Return default card-map if `:logseq.property.fsrs/state` or `:logseq.property.fsrs/due` is nil
 */
frontend.extensions.fsrs.get_card_map = (function frontend$extensions$fsrs$get_card_map(block_entity){
if(cljs.core.truth_(cljs.core.some((function (tag){
if((!((new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag) == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),"\n","(some? (:db/ident tag))"].join('')));
}

return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag));
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block_entity)))){
var fsrs_state = new cljs.core.Keyword("logseq.property.fsrs","state","logseq.property.fsrs/state",-1165165087).cljs$core$IFn$_invoke$arity$1(block_entity);
var fsrs_due = new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549).cljs$core$IFn$_invoke$arity$1(block_entity);
var return_default_card_map_QMARK_ = cljs.core.not((function (){var and__5000__auto__ = fsrs_state;
if(cljs.core.truth_(and__5000__auto__)){
return fsrs_due;
} else {
return and__5000__auto__;
}
})());
if(return_default_card_map_QMARK_){
var temp__5802__auto__ = (function (){var G__90047 = new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block_entity);
var G__90047__$1 = (((G__90047 == null))?null:(new Date(G__90047)));
if((G__90047__$1 == null)){
return null;
} else {
return tick.core.instant.cljs$core$IFn$_invoke$arity$1(G__90047__$1);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block_created_at = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(open_spaced_repetition.cljc_fsrs.core.new_card_BANG_(),new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113),block_created_at,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"due","due",-1754731313),block_created_at], 0));
} else {
return open_spaced_repetition.cljc_fsrs.core.new_card_BANG_();
}
} else {
return frontend.extensions.fsrs.property_fsrs_state__GT_fsrs_card_map(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(fsrs_state,new cljs.core.Keyword(null,"due","due",-1754731313),fsrs_due));
}
} else {
return null;
}
});
frontend.extensions.fsrs.repeat_card_BANG_ = (function frontend$extensions$fsrs$repeat_card_BANG_(repo,block_id,rating){
var eid = ((cljs.core.uuid_QMARK_(block_id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null):block_id);
var block_entity = (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,eid) : frontend.db.entity.call(null,repo,eid));
var temp__5804__auto__ = frontend.extensions.fsrs.get_card_map(block_entity);
if(cljs.core.truth_(temp__5804__auto__)){
var card_map = temp__5804__auto__;
var next_card_map = open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$2(card_map,rating);
var prop_card_map = frontend.extensions.fsrs.fsrs_card_map__GT_property_fsrs_state(next_card_map);
var prop_fsrs_state = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(prop_card_map,new cljs.core.Keyword(null,"due","due",-1754731313)),new cljs.core.Keyword("logseq","last-rating","logseq/last-rating",952769713),rating);
var prop_fsrs_due = new cljs.core.Keyword(null,"due","due",-1754731313).cljs$core$IFn$_invoke$arity$1(prop_card_map);
return frontend.handler.property.set_block_properties_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_entity),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.fsrs","state","logseq.property.fsrs/state",-1165165087),prop_fsrs_state,new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549),prop_fsrs_due], null));
} else {
return null;
}
});
frontend.extensions.fsrs._LT_get_due_card_block_ids = (function frontend$extensions$fsrs$_LT_get_due_card_block_ids(repo,cards_id){
var now_inst_ms = cljs.core.inst_ms((new Date()));
var cards = (cljs.core.truth_((function (){var and__5000__auto__ = cards_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cards_id),new cljs.core.Keyword(null,"global","global",93595047));
} else {
return and__5000__auto__;
}
})())?(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(cards_id) : frontend.db.entity.call(null,cards_id)):null);
var query = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(cards);
var result = frontend.db.query_dsl.parse(query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),true], null));
var q = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?now-inst-ms","?now-inst-ms",2042923576,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)], null),cljs.core.list(new cljs.core.Symbol(null,"or-join","or-join",591375469,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?now-inst-ms","?now-inst-ms",2042923576,null)], null),cljs.core.list(new cljs.core.Symbol(null,"and","and",668631710,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549),new cljs.core.Symbol(null,"?due","?due",-1593059592,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?now-inst-ms","?now-inst-ms",2042923576,null),new cljs.core.Symbol(null,"?due","?due",-1593059592,null))], null)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"missing?","missing?",-1710383910,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549))], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)], null);
var q_SINGLEQUOTE_ = (cljs.core.truth_(query)?(function (){var query_STAR_ = new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(result);
var G__90057 = q;
var G__90058 = ((cljs.core.coll_QMARK_(cljs.core.first(query_STAR_)))?query_STAR_:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [query_STAR_], null));
return (frontend.util.concat_without_nil.cljs$core$IFn$_invoke$arity$2 ? frontend.util.concat_without_nil.cljs$core$IFn$_invoke$arity$2(G__90057,G__90058) : frontend.util.concat_without_nil.call(null,G__90057,G__90058));
})():q);
var G__90061 = repo;
var G__90062 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__90063 = q_SINGLEQUOTE_;
var G__90064 = now_inst_ms;
var G__90065 = new cljs.core.Keyword(null,"rules","rules",1198912366).cljs$core$IFn$_invoke$arity$1(result);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5(G__90061,G__90062,G__90063,G__90064,G__90065) : frontend.db.async._LT_q.call(null,G__90061,G__90062,G__90063,G__90064,G__90065));
});
frontend.extensions.fsrs.btn_with_shortcut = (function frontend$extensions$fsrs$btn_with_shortcut(p__90079){
var map__90082 = p__90079;
var map__90082__$1 = cljs.core.__destructure_map(map__90082);
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var btn_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"btn-text","btn-text",1312481577));
var due = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"due","due",-1754731313));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90082__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var bg_class = (function (){var G__90086 = id;
switch (G__90086) {
case "card-again":
return "primary-red";

break;
case "card-hard":
return "primary-purple";

break;
case "card-good":
return "primary-logseq";

break;
case "card-easy":
return "primary-green";

break;
default:
return null;

}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-2","div.flex.flex-row.items-center.gap-2",212596841),(function (){var G__90091 = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"title","title",636505583),["Shortcut: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(shortcut)].join(''),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),false,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)," !px-2 !py-1 bg-primary/5 hover:bg-primary/10\n        border-primary opacity-90 hover:opacity-100 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(bg_class)].join(''),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop_propagation(e);
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return setTimeout((function (){
return (on_click.cljs$core$IFn$_invoke$arity$0 ? on_click.cljs$core$IFn$_invoke$arity$0() : on_click.call(null));
}),(10));
})], null);
var G__90092 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),btn_text], null),((frontend.util.sm_breakpoint_QMARK_())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.scale-90","span.scale-90",1153506075),logseq.shui.ui.shortcut(shortcut)], null))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90091,G__90092) : logseq.shui.ui.button.call(null,G__90091,G__90092));
})(),(cljs.core.truth_(due)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.opacity-50","div.text-sm.opacity-50",829333122),frontend.util.human_time.cljs$core$IFn$_invoke$arity$variadic(due,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ago?","ago?",1414384824),false], null)], 0))], null):null)], null);
});
frontend.extensions.fsrs.has_cloze_QMARK_ = (function frontend$extensions$fsrs$has_cloze_QMARK_(block){
return clojure.string.includes_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),"{{cloze ");
});
frontend.extensions.fsrs.phase__GT_next_phase = (function frontend$extensions$fsrs$phase__GT_next_phase(block,phase){
var cloze_QMARK_ = frontend.extensions.fsrs.has_cloze_QMARK_(block);
var G__90096 = phase;
var G__90096__$1 = (((G__90096 instanceof cljs.core.Keyword))?G__90096.fqn:null);
switch (G__90096__$1) {
case "init":
if(cloze_QMARK_){
return new cljs.core.Keyword(null,"show-cloze","show-cloze",-1276602675);
} else {
return new cljs.core.Keyword(null,"show-answer","show-answer",876509201);
}

break;
case "show-cloze":
if(cloze_QMARK_){
return new cljs.core.Keyword(null,"show-answer","show-answer",876509201);
} else {
return new cljs.core.Keyword(null,"init","init",-1875481434);
}

break;
case "show-answer":
return new cljs.core.Keyword(null,"init","init",-1875481434);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__90096__$1)].join('')));

}
});
frontend.extensions.fsrs.rating__GT_shortcut = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"again","again",1312602037),"1",new cljs.core.Keyword(null,"hard","hard",2068420191),"2",new cljs.core.Keyword(null,"good","good",511701169),"3",new cljs.core.Keyword(null,"easy","easy",315769928),"4"], null);
frontend.extensions.fsrs.rating_btns = (function frontend$extensions$fsrs$rating_btns(repo,block,_STAR_card_index,_STAR_phase){
var block_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-8.flex-wrap","div.flex.flex-row.items-center.gap-8.flex-wrap",-1342542990),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (rating){
var card_map = frontend.extensions.fsrs.get_card_map(block);
var due = new cljs.core.Keyword(null,"due","due",-1754731313).cljs$core$IFn$_invoke$arity$1(open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$2(card_map,rating));
return frontend.extensions.fsrs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),clojure.string.capitalize(cljs.core.name(rating)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),(frontend.extensions.fsrs.rating__GT_shortcut.cljs$core$IFn$_invoke$arity$1 ? frontend.extensions.fsrs.rating__GT_shortcut.cljs$core$IFn$_invoke$arity$1(rating) : frontend.extensions.fsrs.rating__GT_shortcut.call(null,rating)),new cljs.core.Keyword(null,"due","due",-1754731313),due,new cljs.core.Keyword(null,"id","id",-1388402092),["card-",cljs.core.name(rating)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.extensions.fsrs.repeat_card_BANG_(repo,block_id,rating);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_card_index,cljs.core.inc);

return cljs.core.reset_BANG_(_STAR_phase,new cljs.core.Keyword(null,"init","init",-1875481434));
})], null));
}),cljs.core.keys(frontend.extensions.fsrs.rating__GT_shortcut)),(function (){var G__90109 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-0 text-muted-foreground !h-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__90114 = e.target;
var G__90115 = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.max-w-lg","div.p-4.max-w-lg",1345462591),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl","dl",-2140151713),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt","dt",-368444759),"Again"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),"We got the answer wrong. Automatically means that we have forgotten the card. This is a lapse in memory."], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl","dl",-2140151713),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt","dt",-368444759),"Hard"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),"The answer was correct but we were not confident about it and/or took too long to recall."], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl","dl",-2140151713),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt","dt",-368444759),"Good"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),"The answer was correct but we took some mental effort to recall it."], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl","dl",-2140151713),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt","dt",-368444759),"Easy"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),"The answer was correct and we were confident and quick in our recall without mental effort."], null)], null)], null);
});
var G__90116 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__90114,G__90115,G__90116) : logseq.shui.ui.popup_show_BANG_.call(null,G__90114,G__90115,G__90116));
})], null);
var G__90110 = frontend.ui.icon("info-circle");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90109,G__90110) : logseq.shui.ui.button.call(null,G__90109,G__90110));
})()], null);
});
frontend.extensions.fsrs.card_view = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo,block_id,_STAR_card_index,_STAR_phase){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.db.sub_block.call(null,block_id));
if(cljs.core.truth_(temp__5804__auto__)){
var block_entity = temp__5804__auto__;
var phase = rum.core.react(_STAR_phase);
var next_phase = frontend.extensions.fsrs.phase__GT_next_phase(block_entity,phase);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-card.content.flex.flex-col.overflow-y-auto.overflow-x-hidden","div.ls-card.content.flex.flex-col.overflow-y-auto.overflow-x-hidden",-1777186689),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.breadcrumb(cljs.core.PersistentArrayMap.EMPTY,repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_entity),cljs.core.PersistentArrayMap.EMPTY)], null),(function (){var option = (function (){var G__90137 = phase;
var G__90137__$1 = (((G__90137 instanceof cljs.core.Keyword))?G__90137.fqn:null);
switch (G__90137__$1) {
case "init":
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603),true], null);

break;
case "show-cloze":
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872),true,new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603),true], null);

break;
default:
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872),true], null);

}
})();
return frontend.components.block.blocks_container(option,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_entity], null));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-8.pb-2","div.mt-8.pb-2",1675918772),((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"show-cloze","show-cloze",-1276602675),null,new cljs.core.Keyword(null,"show-answer","show-answer",876509201),null], null), null),next_phase))?frontend.extensions.fsrs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__90139 = next_phase;
var G__90139__$1 = (((G__90139 instanceof cljs.core.Keyword))?G__90139.fqn:null);
switch (G__90139__$1) {
case "show-answer":
return new cljs.core.Keyword("flashcards","modal-btn-show-answers","flashcards/modal-btn-show-answers",-715699091);

break;
case "show-cloze":
return new cljs.core.Keyword("flashcards","modal-btn-show-clozes","flashcards/modal-btn-show-clozes",1508845905);

break;
case "init":
return new cljs.core.Keyword("flashcards","modal-btn-hide-answers","flashcards/modal-btn-hide-answers",2088000675);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__90139__$1)].join('')));

}
})()], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"s",new cljs.core.Keyword(null,"id","id",-1388402092),"card-answers",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_phase,(function (phase__$1){
return frontend.extensions.fsrs.phase__GT_next_phase(block_entity,phase__$1);
}));
})], null)):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-center","div.flex.justify-center",-491420122),frontend.extensions.fsrs.rating_btns(repo,block_entity,_STAR_card_index,_STAR_phase)], null))], null)], null);
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var temp__5804__auto___90299 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___90299)){
var vec__90145_90300 = temp__5804__auto___90299;
var repo_90301 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90145_90300,(0),null);
var block_id_90302 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90145_90300,(1),null);
var __90303 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90145_90300,(2),null);
frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo_90301,block_id_90302,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0));
} else {
}

return state;
})], null)], null),"frontend.extensions.fsrs/card-view");
frontend.extensions.fsrs.cards_view = rum.core.lazy_build(rum.core.build_defcs,(function (state,_cards_id){
var repo = frontend.state.get_current_repo();
var _STAR_cards_id = new cljs.core.Keyword("frontend.extensions.fsrs","cards-id","frontend.extensions.fsrs/cards-id",-2132910751).cljs$core$IFn$_invoke$arity$1(state);
var cards_id = rum.core.react(_STAR_cards_id);
var all_cards = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"global","global",93595047),new cljs.core.Keyword("block","title","block/title",710445684),"All cards"], null)], null),frontend.db.model.get_class_objects(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Cards","logseq.class/Cards",-1284265167)))));
var _STAR_block_ids = new cljs.core.Keyword("frontend.extensions.fsrs","block-ids","frontend.extensions.fsrs/block-ids",-833851804).cljs$core$IFn$_invoke$arity$1(state);
var block_ids = rum.core.react(_STAR_block_ids);
var loading_QMARK_ = rum.core.react(new cljs.core.Keyword("frontend.extensions.fsrs","loading?","frontend.extensions.fsrs/loading?",1084263837).cljs$core$IFn$_invoke$arity$1(state));
var _STAR_card_index = new cljs.core.Keyword("frontend.extensions.fsrs","card-index","frontend.extensions.fsrs/card-index",-1862032166).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_phase = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"init","init",-1875481434));
if(loading_QMARK_ === false){
return daiquiri.core.create_element("div",{'id':"cards-modal",'className':"flex flex-col gap-8 h-full flex-1"},[(function (){var attrs90202 = (function (){var G__90205 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
cljs.core.reset_BANG_(_STAR_cards_id,v);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.fsrs._LT_get_due_card_block_ids(repo,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"global","global",93595047),v))?null:v))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_card_index,(0))),(function (___40947__auto__){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_block_ids,result));
}));
}));
}));
}),new cljs.core.Keyword(null,"default-value","default-value",232220170),cards_id], null);
var G__90206 = (function (){var G__90207 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8 w-64"], null);
var G__90208 = (function (){var G__90210 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select cards"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__90210) : logseq.shui.ui.select_value.call(null,G__90210));
})();
var G__90209 = (function (){var G__90211 = (function (){var G__90212 = (function (){var iter__5480__auto__ = (function frontend$extensions$fsrs$iter__90213(s__90214){
return (new cljs.core.LazySeq(null,(function (){
var s__90214__$1 = s__90214;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90214__$1);
if(temp__5804__auto__){
var s__90214__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90214__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90214__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90216 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90215 = (0);
while(true){
if((i__90215 < size__5479__auto__)){
var card_entity = cljs.core._nth(c__5478__auto__,i__90215);
cljs.core.chunk_append(b__90216,(function (){var G__90218 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(card_entity)], null);
var G__90219 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(card_entity);
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__90218,G__90219) : logseq.shui.ui.select_item.call(null,G__90218,G__90219));
})());

var G__90311 = (i__90215 + (1));
i__90215 = G__90311;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90216),frontend$extensions$fsrs$iter__90213(cljs.core.chunk_rest(s__90214__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90216),null);
}
} else {
var card_entity = cljs.core.first(s__90214__$2);
return cljs.core.cons((function (){var G__90221 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(card_entity)], null);
var G__90222 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(card_entity);
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__90221,G__90222) : logseq.shui.ui.select_item.call(null,G__90221,G__90222));
})(),frontend$extensions$fsrs$iter__90213(cljs.core.rest(s__90214__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(all_cards);
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__90212) : logseq.shui.ui.select_group.call(null,G__90212));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__90211) : logseq.shui.ui.select_content.call(null,G__90211));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$3(G__90207,G__90208,G__90209) : logseq.shui.ui.select_trigger.call(null,G__90207,G__90208,G__90209));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$2(G__90205,G__90206) : logseq.shui.ui.select.call(null,G__90205,G__90206));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90202))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2","flex-wrap"], null)], null),attrs90202], 0))):{'className':"flex flex-row items-center gap-2 flex-wrap"}),((cljs.core.map_QMARK_(attrs90202))?[daiquiri.core.create_element("span",{'className':"text-sm opacity-50"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var x__5090__auto__ = (cljs.core.deref(_STAR_card_index) + (1));
var y__5091__auto__ = cljs.core.count(cljs.core.deref(_STAR_block_ids));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(cljs.core.deref(_STAR_block_ids)))].join('')])]:[daiquiri.interpreter.interpret(attrs90202),daiquiri.core.create_element("span",{'className':"text-sm opacity-50"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var x__5090__auto__ = (cljs.core.deref(_STAR_card_index) + (1));
var y__5091__auto__ = cljs.core.count(cljs.core.deref(_STAR_block_ids));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(cljs.core.deref(_STAR_block_ids)))].join('')])]));
})(),(function (){var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(block_ids,cljs.core.deref(_STAR_card_index),null);
if(cljs.core.truth_(block_id)){
return daiquiri.core.create_element("div",{'className':"flex flex-col"},[frontend.extensions.fsrs.card_view(repo,block_id,_STAR_card_index,_STAR_phase)]);
} else {
if(cljs.core.empty_QMARK_(block_ids)){
return daiquiri.core.create_element("div",{'className':"ls-card content ml-2"},[(function (){var attrs90225 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-title","flashcards/modal-welcome-title",1382331804)], 0));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs90225))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium"], null)], null),attrs90225], 0))):{'className':"font-medium"}),((cljs.core.map_QMARK_(attrs90225))?null:[daiquiri.interpreter.interpret(attrs90225)]));
})(),daiquiri.core.create_element("div",null,[(function (){var attrs90226 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-1","flashcards/modal-welcome-desc-1",-2060009736)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs90226))?daiquiri.interpreter.element_attributes(attrs90226):null),((cljs.core.map_QMARK_(attrs90226))?null:[daiquiri.interpreter.interpret(attrs90226)]));
})()])]);
} else {
var attrs90204 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-finished","flashcards/modal-finished",-349040160)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs90204))?daiquiri.interpreter.element_attributes(attrs90204):null),((cljs.core.map_QMARK_(attrs90204))?null:[daiquiri.interpreter.interpret(attrs90204)]));

}
}
})()]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2((0),new cljs.core.Keyword("frontend.extensions.fsrs","card-index","frontend.extensions.fsrs/card-index",-1862032166)),frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("shortcut.handler","cards","shortcut.handler/cards",-979698196),false),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_block_ids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_loading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var cards_id = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
cljs.core.reset_BANG_(_STAR_loading_QMARK_,true);

promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.fsrs._LT_get_due_card_block_ids(frontend.state.get_current_repo(),cards_id)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_block_ids,result)),(function (___40947__auto__){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_loading_QMARK_,false));
}));
}));
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.extensions.fsrs","block-ids","frontend.extensions.fsrs/block-ids",-833851804),_STAR_block_ids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.extensions.fsrs","cards-id","frontend.extensions.fsrs/cards-id",-2132910751),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = cards_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"global","global",93595047);
}
})()),new cljs.core.Keyword("frontend.extensions.fsrs","loading?","frontend.extensions.fsrs/loading?",1084263837),_STAR_loading_QMARK_], 0));
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
(frontend.extensions.fsrs.update_due_cards_count.cljs$core$IFn$_invoke$arity$0 ? frontend.extensions.fsrs.update_due_cards_count.cljs$core$IFn$_invoke$arity$0() : frontend.extensions.fsrs.update_due_cards_count.call(null));

return state;
})], null)], null),"frontend.extensions.fsrs/cards-view");
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.fsrs !== 'undefined') && (typeof frontend.extensions.fsrs._STAR_last_update_due_cards_count_canceler !== 'undefined')){
} else {
frontend.extensions.fsrs._STAR_last_update_due_cards_count_canceler = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * Return a task that update `:srs/cards-due-count` periodically.
 */
frontend.extensions.fsrs.new_task__update_due_cards_count = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr90229_block_0 = (function frontend$extensions$fsrs$cr90229_block_0(cr90229_state){
try{var cr90229_place_0 = frontend.state.get_current_repo;
var cr90229_place_1 = (function (){var fexpr__90253 = cr90229_place_0;
return (fexpr__90253.cljs$core$IFn$_invoke$arity$0 ? fexpr__90253.cljs$core$IFn$_invoke$arity$0() : fexpr__90253.call(null));
})();
var cr90229_place_2 = frontend.config.db_based_graph_QMARK_;
var cr90229_place_3 = cr90229_place_1;
var cr90229_place_4 = (function (){var G__90255 = cr90229_place_3;
var fexpr__90254 = cr90229_place_2;
return (fexpr__90254.cljs$core$IFn$_invoke$arity$1 ? fexpr__90254.cljs$core$IFn$_invoke$arity$1(G__90255) : fexpr__90254.call(null,G__90255));
})();
var cr90229_place_5 = null;
if(cljs.core.truth_(cr90229_place_4)){
(cr90229_state[(0)] = cr90229_block_2);

(cr90229_state[(2)] = cr90229_place_1);

(cr90229_state[(1)] = cr90229_place_5);

return cr90229_state;
} else {
(cr90229_state[(0)] = cr90229_block_1);

(cr90229_state[(1)] = cr90229_place_5);

return cr90229_state;
}
}catch (e90251){var cr90229_exception = e90251;
(cr90229_state[(0)] = null);

throw cr90229_exception;
}});
var cr90229_block_1 = (function frontend$extensions$fsrs$cr90229_block_1(cr90229_state){
try{var cr90229_place_6 = frontend.extensions.srs.update_cards_due_count_BANG_;
var cr90229_place_7 = (function (){var fexpr__90258 = cr90229_place_6;
return (fexpr__90258.cljs$core$IFn$_invoke$arity$0 ? fexpr__90258.cljs$core$IFn$_invoke$arity$0() : fexpr__90258.call(null));
})();
(cr90229_state[(0)] = cr90229_block_4);

(cr90229_state[(1)] = cr90229_place_7);

return cr90229_state;
}catch (e90257){var cr90229_exception = e90257;
(cr90229_state[(0)] = null);

(cr90229_state[(1)] = null);

throw cr90229_exception;
}});
var cr90229_block_2 = (function frontend$extensions$fsrs$cr90229_block_2(cr90229_state){
try{var cr90229_place_1 = (cr90229_state[(2)]);
var cr90229_place_8 = missionary.core.reduce;
var cr90229_place_9 = (function (_,___$1){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.fsrs._LT_get_due_card_block_ids(cr90229_place_1,null)),(function (due_cards){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746),cljs.core.count(due_cards)));
}));
}));
});
var cr90229_place_10 = frontend.common.missionary.clock;
var cr90229_place_11 = (3600);
var cr90229_place_12 = (1000);
var cr90229_place_13 = (cr90229_place_11 * cr90229_place_12);
var cr90229_place_14 = (function (){var G__90262 = cr90229_place_13;
var fexpr__90261 = cr90229_place_10;
return (fexpr__90261.cljs$core$IFn$_invoke$arity$1 ? fexpr__90261.cljs$core$IFn$_invoke$arity$1(G__90262) : fexpr__90261.call(null,G__90262));
})();
var cr90229_place_15 = (function (){var G__90265 = cr90229_place_9;
var G__90266 = cr90229_place_14;
var fexpr__90264 = cr90229_place_8;
return (fexpr__90264.cljs$core$IFn$_invoke$arity$2 ? fexpr__90264.cljs$core$IFn$_invoke$arity$2(G__90265,G__90266) : fexpr__90264.call(null,G__90265,G__90266));
})();
(cr90229_state[(0)] = cr90229_block_3);

(cr90229_state[(2)] = null);

return missionary.core.park(cr90229_place_15);
}catch (e90259){var cr90229_exception = e90259;
(cr90229_state[(0)] = null);

(cr90229_state[(1)] = null);

(cr90229_state[(2)] = null);

throw cr90229_exception;
}});
var cr90229_block_3 = (function frontend$extensions$fsrs$cr90229_block_3(cr90229_state){
try{var cr90229_place_16 = missionary.core.unpark();
(cr90229_state[(0)] = cr90229_block_4);

(cr90229_state[(1)] = cr90229_place_16);

return cr90229_state;
}catch (e90267){var cr90229_exception = e90267;
(cr90229_state[(0)] = null);

(cr90229_state[(1)] = null);

throw cr90229_exception;
}});
var cr90229_block_4 = (function frontend$extensions$fsrs$cr90229_block_4(cr90229_state){
try{var cr90229_place_5 = (cr90229_state[(1)]);
(cr90229_state[(0)] = null);

(cr90229_state[(1)] = null);

return cr90229_place_5;
}catch (e90269){var cr90229_exception = e90269;
(cr90229_state[(0)] = null);

(cr90229_state[(1)] = null);

throw cr90229_exception;
}});
return cloroutine.impl.coroutine((function (){var G__90271 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__90271[(0)] = cr90229_block_0);

return G__90271;
})());
})(),missionary.core.sp_run);
frontend.extensions.fsrs.update_due_cards_count = (function frontend$extensions$fsrs$update_due_cards_count(){
var temp__5804__auto___90329 = cljs.core.deref(frontend.extensions.fsrs._STAR_last_update_due_cards_count_canceler);
if(cljs.core.truth_(temp__5804__auto___90329)){
var canceler_90330 = temp__5804__auto___90329;
(canceler_90330.cljs$core$IFn$_invoke$arity$0 ? canceler_90330.cljs$core$IFn$_invoke$arity$0() : canceler_90330.call(null));

cljs.core.reset_BANG_(frontend.extensions.fsrs._STAR_last_update_due_cards_count_canceler,null);
} else {
}

var canceler = frontend.common.missionary.run_task(new cljs.core.Keyword(null,"update-due-cards-count","update-due-cards-count",-2052708738),frontend.extensions.fsrs.new_task__update_due_cards_count);
cljs.core.reset_BANG_(frontend.extensions.fsrs._STAR_last_update_due_cards_count_canceler,canceler);

return null;
});
frontend.extensions.fsrs.get_operating_blocks = (function frontend$extensions$fsrs$get_operating_blocks(block_ids){
var G__90273 = block_ids;
var G__90273__$1 = (((G__90273 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var G__90275 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90275) : frontend.db.entity.call(null,G__90275));
}),G__90273));
var G__90273__$2 = (((G__90273__$1 == null))?null:cljs.core.seq(G__90273__$1));
var G__90273__$3 = (((G__90273__$2 == null))?null:frontend.handler.block.get_top_level_blocks(G__90273__$2));
if((G__90273__$3 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.property_QMARK_,G__90273__$3);
}
});
frontend.extensions.fsrs.batch_make_cards_BANG_ = (function frontend$extensions$fsrs$batch_make_cards_BANG_(var_args){
var G__90277 = arguments.length;
switch (G__90277) {
case 0:
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_selection_block_ids());
}));

(frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (block_ids){
var repo = frontend.state.get_current_repo();
var blocks = frontend.extensions.fsrs.get_operating_blocks(block_ids);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks));
if(cljs.core.truth_(temp__5804__auto__)){
var block_ids__$1 = temp__5804__auto__;
return frontend.handler.property.batch_set_block_property_BANG_(repo,block_ids__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)))));
} else {
return null;
}
}));

(frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=frontend.extensions.fsrs.js.map
