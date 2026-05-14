goog.provide('frontend.extensions.srs');
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.srs !== 'undefined') && (typeof frontend.extensions.srs.global_cards_mode_QMARK_ !== 'undefined')){
} else {
frontend.extensions.srs.global_cards_mode_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.extensions.srs.card_hash_tag = "card";
frontend.extensions.srs.card_last_interval_property = new cljs.core.Keyword(null,"card-last-interval","card-last-interval",-1889773077);
frontend.extensions.srs.card_repeats_property = new cljs.core.Keyword(null,"card-repeats","card-repeats",1071489736);
frontend.extensions.srs.card_last_reviewed_property = new cljs.core.Keyword(null,"card-last-reviewed","card-last-reviewed",-965683716);
frontend.extensions.srs.card_next_schedule_property = new cljs.core.Keyword(null,"card-next-schedule","card-next-schedule",2132454825);
frontend.extensions.srs.card_last_easiness_factor_property = new cljs.core.Keyword(null,"card-ease-factor","card-ease-factor",-2122824488);
frontend.extensions.srs.card_last_score_property = new cljs.core.Keyword(null,"card-last-score","card-last-score",2121541607);
frontend.extensions.srs.default_card_properties_map = cljs.core.PersistentArrayMap.createAsIfByAssoc([frontend.extensions.srs.card_last_interval_property,(-1),frontend.extensions.srs.card_repeats_property,(0),frontend.extensions.srs.card_last_easiness_factor_property,2.5]);
/**
 * cloze syntax: {{cloze: ...}}
 */
frontend.extensions.srs.cloze_macro_name = "cloze";
/**
 * {{cards ...}}
 */
frontend.extensions.srs.query_macro_name = "cards";
/**
 * any number between 0 and 1 (the greater it is the faster the changes of the OF matrix)
 */
frontend.extensions.srs.learning_fraction_default = 0.5;
frontend.extensions.srs.get_learning_fraction = (function frontend$extensions$srs$get_learning_fraction(){
var temp__5802__auto__ = new cljs.core.Keyword("srs","learning-fraction","srs/learning-fraction",-869447179).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(temp__5802__auto__)){
var learning_fraction = temp__5802__auto__;
if(((typeof learning_fraction === 'number') && ((((learning_fraction < (1))) && ((learning_fraction > (0))))))){
return learning_fraction;
} else {
return frontend.extensions.srs.learning_fraction_default;
}
} else {
return frontend.extensions.srs.learning_fraction_default;
}
});
frontend.extensions.srs.srs_of_matrix = frontend.util.persist_var.persist_var(null,"srs-of-matrix");
frontend.extensions.srs.initial_interval_default = (4);
frontend.extensions.srs.get_initial_interval = (function frontend$extensions$srs$get_initial_interval(){
var temp__5802__auto__ = new cljs.core.Keyword("srs","initial-interval","srs/initial-interval",-1802131142).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(temp__5802__auto__)){
var initial_interval = temp__5802__auto__;
if(((typeof initial_interval === 'number') && ((initial_interval > (0))))){
return initial_interval;
} else {
return frontend.extensions.srs.initial_interval_default;
}
} else {
return frontend.extensions.srs.initial_interval_default;
}
});
frontend.extensions.srs.get_block_card_properties = (function frontend$extensions$srs$get_block_card_properties(block){
var temp__5804__auto__ = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var properties = temp__5804__auto__;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.extensions.srs.default_card_properties_map,cljs.core.select_keys(properties,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.srs.card_last_interval_property,frontend.extensions.srs.card_repeats_property,frontend.extensions.srs.card_last_reviewed_property,frontend.extensions.srs.card_next_schedule_property,frontend.extensions.srs.card_last_easiness_factor_property,frontend.extensions.srs.card_last_score_property], null))], 0));
} else {
return null;
}
});
frontend.extensions.srs.save_block_card_properties_BANG_ = (function frontend$extensions$srs$save_block_card_properties_BANG_(block,props){
return frontend.handler.editor.save_block_if_changed_BANG_.cljs$core$IFn$_invoke$arity$3(block,frontend.handler.property.file.insert_properties_when_file_based(frontend.state.get_current_repo(),new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),props),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"force?","force?",1839038675),true], null));
});
frontend.extensions.srs.reset_block_card_properties_BANG_ = (function frontend$extensions$srs$reset_block_card_properties_BANG_(block){
return frontend.extensions.srs.save_block_card_properties_BANG_(block,cljs.core.PersistentArrayMap.createAsIfByAssoc([frontend.extensions.srs.card_last_interval_property,(-1),frontend.extensions.srs.card_repeats_property,(0),frontend.extensions.srs.card_last_easiness_factor_property,2.5,frontend.extensions.srs.card_last_reviewed_property,"nil",frontend.extensions.srs.card_next_schedule_property,"nil",frontend.extensions.srs.card_last_score_property,"nil"]));
});
frontend.extensions.srs.card_block_QMARK_ = (function frontend$extensions$srs$card_block_QMARK_(block){
var card_entity = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(frontend.extensions.srs.card_hash_tag) : frontend.db.get_page.call(null,frontend.extensions.srs.card_hash_tag));
var refs = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block));
return cljs.core.contains_QMARK_(refs,card_entity);
});
frontend.extensions.srs.fix_2f = (function frontend$extensions$srs$fix_2f(n){
return (Math.round(((100) * n)) / (100));
});
frontend.extensions.srs.get_of = (function frontend$extensions$srs$get_of(of_matrix,n,ef){
var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(of_matrix,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [n,ef], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if((n <= (1))){
return frontend.extensions.srs.get_initial_interval();
} else {
return ef;
}
}
});
frontend.extensions.srs.set_of = (function frontend$extensions$srs$set_of(of_matrix,n,ef,of){
return cljs.core.assoc_in(of_matrix,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [n,ef], null),frontend.extensions.srs.fix_2f(of));
});
frontend.extensions.srs.interval = (function frontend$extensions$srs$interval(n,ef,of_matrix){
if((n <= (1))){
return frontend.extensions.srs.get_of(of_matrix,(1),ef);
} else {
return (frontend.extensions.srs.get_of(of_matrix,n,ef) * (function (){var G__133320 = (n - (1));
var G__133321 = ef;
var G__133322 = of_matrix;
return (frontend.extensions.srs.interval.cljs$core$IFn$_invoke$arity$3 ? frontend.extensions.srs.interval.cljs$core$IFn$_invoke$arity$3(G__133320,G__133321,G__133322) : frontend.extensions.srs.interval.call(null,G__133320,G__133321,G__133322));
})());
}
});
frontend.extensions.srs.get_next_ef = (function frontend$extensions$srs$get_next_ef(ef,quality){
var ef_STAR_ = (ef + (0.1 - (((5) - quality) * (0.08 + (0.02 * ((5) - quality))))));
if((ef_STAR_ < 1.3)){
return 1.3;
} else {
return ef_STAR_;
}
});
frontend.extensions.srs.get_next_of_matrix = (function frontend$extensions$srs$get_next_of_matrix(of_matrix,n,quality,fraction,ef){
var of = frontend.extensions.srs.get_of(of_matrix,n,ef);
var of_STAR_ = (of * (0.72 + (quality * 0.07)));
var of_STAR__STAR_ = ((((1) - fraction) * of) + (of_STAR_ * fraction));
return frontend.extensions.srs.set_of(of_matrix,n,ef,of_STAR__STAR_);
});
/**
 * return [next-interval repeats next-ef of-matrix]
 */
frontend.extensions.srs.calc_next_interval = (function frontend$extensions$srs$calc_next_interval(_last_interval,repeats,ef,quality,of_matrix){
if((((quality <= (5))) && ((quality >= (0))))){
} else {
throw (new Error("Assert failed: (and (<= quality 5) (>= quality 0))"));
}

var ef__$1 = (function (){var or__5002__auto__ = ef;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return 2.5;
}
})();
var next_ef = frontend.extensions.srs.get_next_ef(ef__$1,quality);
var next_of_matrix = frontend.extensions.srs.get_next_of_matrix(of_matrix,repeats,quality,frontend.extensions.srs.get_learning_fraction(),ef__$1);
var next_interval = frontend.extensions.srs.interval(repeats,next_ef,next_of_matrix);
if((quality < (3))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(-1),(1),ef__$1,next_of_matrix], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.srs.fix_2f(next_interval),((1) + repeats),frontend.extensions.srs.fix_2f(next_ef),next_of_matrix], null);
}
});

/**
 * @interface
 */
frontend.extensions.srs.ICard = function(){};

var frontend$extensions$srs$ICard$get_root_block$dyn_134130 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.extensions.srs.get_root_block[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (frontend.extensions.srs.get_root_block["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("ICard.get-root-block",this$);
}
}
});
frontend.extensions.srs.get_root_block = (function frontend$extensions$srs$get_root_block(this$){
if((((!((this$ == null)))) && ((!((this$.frontend$extensions$srs$ICard$get_root_block$arity$1 == null)))))){
return this$.frontend$extensions$srs$ICard$get_root_block$arity$1(this$);
} else {
return frontend$extensions$srs$ICard$get_root_block$dyn_134130(this$);
}
});


/**
 * @interface
 */
frontend.extensions.srs.ICardShow = function(){};

var frontend$extensions$srs$ICardShow$show_cycle$dyn_134131 = (function (this$,phase){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.extensions.srs.show_cycle[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,phase) : m__5351__auto__.call(null,this$,phase));
} else {
var m__5349__auto__ = (frontend.extensions.srs.show_cycle["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,phase) : m__5349__auto__.call(null,this$,phase));
} else {
throw cljs.core.missing_protocol("ICardShow.show-cycle",this$);
}
}
});
frontend.extensions.srs.show_cycle = (function frontend$extensions$srs$show_cycle(this$,phase){
if((((!((this$ == null)))) && ((!((this$.frontend$extensions$srs$ICardShow$show_cycle$arity$2 == null)))))){
return this$.frontend$extensions$srs$ICardShow$show_cycle$arity$2(this$,phase);
} else {
return frontend$extensions$srs$ICardShow$show_cycle$dyn_134131(this$,phase);
}
});

var frontend$extensions$srs$ICardShow$show_cycle_config$dyn_134132 = (function (this$,phase){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.extensions.srs.show_cycle_config[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,phase) : m__5351__auto__.call(null,this$,phase));
} else {
var m__5349__auto__ = (frontend.extensions.srs.show_cycle_config["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,phase) : m__5349__auto__.call(null,this$,phase));
} else {
throw cljs.core.missing_protocol("ICardShow.show-cycle-config",this$);
}
}
});
frontend.extensions.srs.show_cycle_config = (function frontend$extensions$srs$show_cycle_config(this$,phase){
if((((!((this$ == null)))) && ((!((this$.frontend$extensions$srs$ICardShow$show_cycle_config$arity$2 == null)))))){
return this$.frontend$extensions$srs$ICardShow$show_cycle_config$arity$2(this$,phase);
} else {
return frontend$extensions$srs$ICardShow$show_cycle_config$dyn_134132(this$,phase);
}
});

frontend.extensions.srs.has_cloze_QMARK_ = (function frontend$extensions$srs$has_cloze_QMARK_(blocks){
return cljs.core.some((function (p1__133384_SHARP_){
return clojure.string.includes_QMARK_(p1__133384_SHARP_,"{{cloze ");
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),blocks));
});
/**
 * Clear block's collapsed property if exists
 */
frontend.extensions.srs.clear_collapsed_property = (function frontend$extensions$srs$clear_collapsed_property(blocks){
var result = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"collapsed","collapsed",-628494523)], null));
}),blocks);
return result;
});

/**
* @constructor
 * @implements {frontend.extensions.srs.ICardShow}
 * @implements {frontend.extensions.srs.ICard}
*/
frontend.extensions.srs.Sided_Cloze_Card = (function (block){
this.block = block;
});
(frontend.extensions.srs.Sided_Cloze_Card.prototype.frontend$extensions$srs$ICard$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.extensions.srs.Sided_Cloze_Card.prototype.frontend$extensions$srs$ICard$get_root_block$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var G__133402 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),self__.block], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__133402) : frontend.db.pull.call(null,G__133402));
}));

(frontend.extensions.srs.Sided_Cloze_Card.prototype.frontend$extensions$srs$ICardShow$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.extensions.srs.Sided_Cloze_Card.prototype.frontend$extensions$srs$ICardShow$show_cycle$arity$2 = (function (_this,phase){
var self__ = this;
var _this__$1 = this;
var block_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(self__.block);
var blocks = frontend.extensions.srs.clear_collapsed_property(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.db.entity.call(null,block_id))], null));
var cloze_QMARK_ = frontend.extensions.srs.has_cloze_QMARK_(blocks);
var G__133415 = phase;
switch (G__133415) {
case (1):
var blocks_count = cljs.core.count(blocks);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(blocks)], null),new cljs.core.Keyword(null,"next-phase","next-phase",-424821986),(cljs.core.truth_((function (){var or__5002__auto__ = (blocks_count > (1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cloze_QMARK_;
}
})())?(2):(3))], null);

break;
case (2):
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),blocks,new cljs.core.Keyword(null,"next-phase","next-phase",-424821986),(cljs.core.truth_(cloze_QMARK_)?(3):(1))], null);

break;
case (3):
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),blocks,new cljs.core.Keyword(null,"next-phase","next-phase",-424821986),(1)], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__133415)].join('')));

}
}));

(frontend.extensions.srs.Sided_Cloze_Card.prototype.frontend$extensions$srs$ICardShow$show_cycle_config$arity$2 = (function (_this,phase){
var self__ = this;
var _this__$1 = this;
var G__133420 = phase;
switch (G__133420) {
case (1):
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603),true], null);

break;
case (2):
return cljs.core.PersistentArrayMap.EMPTY;

break;
case (3):
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872),true], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__133420)].join('')));

}
}));

(frontend.extensions.srs.Sided_Cloze_Card.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"block","block",-1989749559,null)], null);
}));

(frontend.extensions.srs.Sided_Cloze_Card.cljs$lang$type = true);

(frontend.extensions.srs.Sided_Cloze_Card.cljs$lang$ctorStr = "frontend.extensions.srs/Sided-Cloze-Card");

(frontend.extensions.srs.Sided_Cloze_Card.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.extensions.srs/Sided-Cloze-Card");
}));

/**
 * Positional factory function for frontend.extensions.srs/Sided-Cloze-Card.
 */
frontend.extensions.srs.__GT_Sided_Cloze_Card = (function frontend$extensions$srs$__GT_Sided_Cloze_Card(block){
return (new frontend.extensions.srs.Sided_Cloze_Card(block));
});

frontend.extensions.srs.__GT_card = (function frontend$extensions$srs$__GT_card(block){
var block_SINGLEQUOTE_ = (function (){var G__133439 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__133439) : frontend.db.pull.call(null,G__133439));
})();
return frontend.extensions.srs.__GT_Sided_Cloze_Card(block_SINGLEQUOTE_);
});
/**
 * Use same syntax as frontend.db.query-dsl.
 *   Add an extra condition: block's :block/refs contains `#card or [[card]]'
 */
frontend.extensions.srs.query = (function frontend$extensions$srs$query(var_args){
var G__133457 = arguments.length;
switch (G__133457) {
case 2:
return frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$2 = (function (repo,query_string){
return frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$3(repo,query_string,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$3 = (function (repo,query_string,p__133462){
var map__133463 = p__133462;
var map__133463__$1 = cljs.core.__destructure_map(map__133463);
var use_cache_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133463__$1,new cljs.core.Keyword(null,"use-cache?","use-cache?",-81331778),true);
if(typeof query_string === 'string'){
var result = ((clojure.string.blank_QMARK_(query_string))?new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(frontend.extensions.srs.card_hash_tag) : frontend.db.get_page.call(null,frontend.extensions.srs.card_hash_tag))):(function (){var query_string__$1 = frontend.template.resolve_dynamic_template_BANG_(query_string);
var map__133469 = frontend.db.query_dsl.parse(query_string__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)], null));
var map__133469__$1 = cljs.core.__destructure_map(map__133469);
var query_STAR_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133469__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var sort_by = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133469__$1,new cljs.core.Keyword(null,"sort-by","sort-by",-322599303));
var rules = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133469__$1,new cljs.core.Keyword(null,"rules","rules",1198912366));
var temp__5804__auto__ = frontend.db.query_dsl.query_wrapper(query_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks?","blocks?",58578620),true,new cljs.core.Keyword(null,"block-attrs","block-attrs",-451459398),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","properties","block/properties",708347145)], null)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var query_SINGLEQUOTE_ = temp__5804__auto__;
var result = frontend.db.query_react.react_query(repo,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),cljs.core.with_meta(query_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cards-query?","cards-query?",1220374615),true], null)),new cljs.core.Keyword(null,"rules","rules",1198912366),(function (){var or__5002__auto__ = rules;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})()], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"use-cache?","use-cache?",-81331778),use_cache_QMARK_], null),(cljs.core.truth_(sort_by)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),sort_by], null):null)], 0)));
if(cljs.core.truth_(result)){
return cljs.core.flatten(frontend.util.react(result));
} else {
return null;
}
} else {
return null;
}
})());
return cljs.core.vec(result);
} else {
return null;
}
}));

(frontend.extensions.srs.query.cljs$lang$maxFixedArity = 3);

/**
 * Return blocks scheduled to 'time' or before
 */
frontend.extensions.srs.query_scheduled = (function frontend$extensions$srs$query_scheduled(blocks,time){
var filtered_result = cljs.core.filterv((function (b){
var props = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(b);
var next_sched = cljs.core.get.cljs$core$IFn$_invoke$arity$2(props,frontend.extensions.srs.card_next_schedule_property);
var next_sched_STAR_ = cljs_time.coerce.from_string(next_sched);
var repeats = cljs.core.get.cljs$core$IFn$_invoke$arity$2(props,frontend.extensions.srs.card_repeats_property);
var or__5002__auto__ = (repeats == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (repeats < (1));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (next_sched == null);
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (next_sched_STAR_ == null);
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
return cljs_time.core.before_QMARK_(next_sched_STAR_,time);
}
}
}
}
}),blocks);
var sort_by_next_schedule = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(b,new cljs.core.Keyword("block","properties","block/properties",708347145)),frontend.extensions.srs.card_next_schedule_property);
}),filtered_result);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"total","total",1916810418),cljs.core.count(blocks),new cljs.core.Keyword(null,"result","result",1415092211),sort_by_next_schedule], null);
});
frontend.extensions.srs.get_next_interval = (function frontend$extensions$srs$get_next_interval(card,score){
if((((score <= (5))) && ((score >= (0))))){
} else {
throw (new Error("Assert failed: (and (<= score 5) (>= score 0))"));
}

if((((!((card == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === card.frontend$extensions$srs$ICard$))))?true:(((!card.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card):false)):cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card))){
} else {
throw (new Error("Assert failed: (satisfies? ICard card)"));
}

var block = card.block;
var props = frontend.extensions.srs.get_block_card_properties(block);
var last_interval = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(props,frontend.extensions.srs.card_last_interval_property);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return frontend.util.safe_parse_float(v);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var repeats = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(props,frontend.extensions.srs.card_repeats_property);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return frontend.util.safe_parse_int(v);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var last_ef = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(props,frontend.extensions.srs.card_last_easiness_factor_property);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return frontend.util.safe_parse_float(v);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return 2.5;
}
})();
var vec__133505 = frontend.extensions.srs.calc_next_interval(last_interval,repeats,last_ef,score,cljs.core.deref(frontend.extensions.srs.srs_of_matrix));
var next_interval = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133505,(0),null);
var next_repeats = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133505,(1),null);
var next_ef = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133505,(2),null);
var of_matrix_STAR_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133505,(3),null);
var next_interval_STAR_ = (((next_interval < (0)))?(0):next_interval);
var next_schedule = cljs_time.coerce.to_string(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.local.local_now(),cljs_time.core.hours.cljs$core$IFn$_invoke$arity$1(((24) * next_interval_STAR_))));
var now = cljs_time.coerce.to_string(cljs_time.local.local_now());
return cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword(null,"next-of-matrix","next-of-matrix",1337218979),of_matrix_STAR_,frontend.extensions.srs.card_last_interval_property,next_interval,frontend.extensions.srs.card_repeats_property,next_repeats,frontend.extensions.srs.card_last_easiness_factor_property,next_ef,frontend.extensions.srs.card_next_schedule_property,next_schedule,frontend.extensions.srs.card_last_reviewed_property,now,frontend.extensions.srs.card_last_score_property,score]);
});
frontend.extensions.srs.operation_score_BANG_ = (function frontend$extensions$srs$operation_score_BANG_(card,score){
if((((score <= (5))) && ((score >= (0))))){
} else {
throw (new Error("Assert failed: (and (<= score 5) (>= score 0))"));
}

if((((!((card == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === card.frontend$extensions$srs$ICard$))))?true:(((!card.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card):false)):cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card))){
} else {
throw (new Error("Assert failed: (satisfies? ICard card)"));
}

var block = card.block;
var result = frontend.extensions.srs.get_next_interval(card,score);
var next_of_matrix = new cljs.core.Keyword(null,"next-of-matrix","next-of-matrix",1337218979).cljs$core$IFn$_invoke$arity$1(result);
cljs.core.reset_BANG_(frontend.extensions.srs.srs_of_matrix,next_of_matrix);

return frontend.extensions.srs.save_block_card_properties_BANG_((function (){var G__133529 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__133529) : frontend.db.pull.call(null,G__133529));
})(),cljs.core.select_keys(result,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.srs.card_last_interval_property,frontend.extensions.srs.card_repeats_property,frontend.extensions.srs.card_last_easiness_factor_property,frontend.extensions.srs.card_next_schedule_property,frontend.extensions.srs.card_last_reviewed_property,frontend.extensions.srs.card_last_score_property], null)));
});
frontend.extensions.srs.operation_reset_BANG_ = (function frontend$extensions$srs$operation_reset_BANG_(card){
if((((!((card == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === card.frontend$extensions$srs$ICard$))))?true:(((!card.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card):false)):cljs.core.native_satisfies_QMARK_(frontend.extensions.srs.ICard,card))){
} else {
throw (new Error("Assert failed: (satisfies? ICard card)"));
}

var block = card.block;
return frontend.extensions.srs.reset_block_card_properties_BANG_((function (){var G__133547 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__133547) : frontend.db.pull.call(null,G__133547));
})());
});
frontend.extensions.srs.operation_card_info_summary_BANG_ = (function frontend$extensions$srs$operation_card_info_summary_BANG_(review_records,review_cards,card_query_block){
if(cljs.core.truth_(card_query_block)){
var review_count = cljs.core.count(cljs.core.flatten(cljs.core.vals(review_records)));
var review_cards_count = cljs.core.count(review_cards);
var score_remembered_count = (cljs.core.count(cljs.core.get.cljs$core$IFn$_invoke$arity$2(review_records,(5))) + cljs.core.count(cljs.core.get.cljs$core$IFn$_invoke$arity$2(review_records,(3))));
var score_forgotten_count = cljs.core.count(cljs.core.get.cljs$core$IFn$_invoke$arity$2(review_records,(1)));
return frontend.handler.editor.insert_block_tree_after_target(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(card_query_block),false,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),(function (){var G__133548 = "Summary: %d items, %d review counts [[%s]]";
var G__133549 = review_cards_count;
var G__133550 = review_count;
var G__133551 = frontend.date.today();
return (frontend.util.format.cljs$core$IFn$_invoke$arity$4 ? frontend.util.format.cljs$core$IFn$_invoke$arity$4(G__133548,G__133549,G__133550,G__133551) : frontend.util.format.call(null,G__133548,G__133549,G__133550,G__133551));
})(),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),(function (){var G__133552 = "Remembered:   %d (%d%%)";
var G__133553 = score_remembered_count;
var G__133554 = ((100) * (score_remembered_count / review_count));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__133552,G__133553,G__133554) : frontend.util.format.call(null,G__133552,G__133553,G__133554));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),(function (){var G__133555 = "Forgotten :   %d (%d%%)";
var G__133556 = score_forgotten_count;
var G__133557 = ((100) * (score_forgotten_count / review_count));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__133555,G__133556,G__133557) : frontend.util.format.call(null,G__133555,G__133556,G__133557));
})()], null)], null)], null)], null),new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(card_query_block),false);
} else {
return null;
}
});
frontend.extensions.srs.dec_cards_due_count_BANG_ = (function frontend$extensions$srs$dec_cards_due_count_BANG_(){
return frontend.state.update_state_BANG_(new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746),(function (n){
if((n > (0))){
return (n - (1));
} else {
return n;
}
}));
});
frontend.extensions.srs.score_and_next_card = (function frontend$extensions$srs$score_and_next_card(score,card,_STAR_card_index,finished_QMARK_,_STAR_phase,_STAR_review_records,cb){
frontend.extensions.srs.operation_score_BANG_(card,score);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_review_records,(function (p1__133561_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(p1__133561_SHARP_,score,(function (ov){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ov,card);
}));
}));

if(cljs.core.truth_(finished_QMARK_)){
if(cljs.core.truth_(cb)){
var G__133566_134169 = cljs.core.deref(_STAR_review_records);
(cb.cljs$core$IFn$_invoke$arity$1 ? cb.cljs$core$IFn$_invoke$arity$1(G__133566_134169) : cb.call(null,G__133566_134169));
} else {
}
} else {
cljs.core.reset_BANG_(_STAR_phase,(1));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_card_index,cljs.core.inc);

if(cljs.core.truth_(cljs.core.deref(frontend.extensions.srs.global_cards_mode_QMARK_))){
return frontend.extensions.srs.dec_cards_due_count_BANG_();
} else {
return null;
}
});
frontend.extensions.srs.skip_card = (function frontend$extensions$srs$skip_card(card,_STAR_card_index,finished_QMARK_,_STAR_phase,_STAR_review_records,cb){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_review_records,(function (p1__133581_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(p1__133581_SHARP_,"skip",(function (ov){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ov,card);
}));
}));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_card_index,cljs.core.inc);

if(cljs.core.truth_(finished_QMARK_)){
if(cljs.core.truth_(cb)){
var G__133586 = cljs.core.deref(_STAR_review_records);
return (cb.cljs$core$IFn$_invoke$arity$1 ? cb.cljs$core$IFn$_invoke$arity$1(G__133586) : cb.call(null,G__133586));
} else {
return null;
}
} else {
return cljs.core.reset_BANG_(_STAR_phase,(1));
}
});
frontend.extensions.srs.review_finished = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.p-2","p.p-2",1061889157),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-finished","flashcards/modal-finished",-349040160)], 0))], null);
frontend.extensions.srs.btn_with_shortcut = (function frontend$extensions$srs$btn_with_shortcut(p__133591){
var map__133592 = p__133591;
var map__133592__$1 = cljs.core.__destructure_map(map__133592);
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"shortcut","shortcut",-431647697));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var btn_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"btn-text","btn-text",1312481577));
var background = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"background","background",-863952629));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133592__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),btn_text,((frontend.util.sm_breakpoint_QMARK_())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [" ",frontend.ui.render_keyboard_shortcut.cljs$core$IFn$_invoke$arity$variadic(shortcut,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"text","text",-1790561697)], null)], 0))], null))], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)].join(''),new cljs.core.Keyword(null,"background","background",-863952629),background,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop_propagation(e);
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
return setTimeout((function (){
return (on_click.cljs$core$IFn$_invoke$arity$0 ? on_click.cljs$core$IFn$_invoke$arity$0() : on_click.call(null));
}),(10));
})], 0));
});
frontend.extensions.srs.view = rum.core.lazy_build(rum.core.build_defcs,(function (state,blocks,p__133595,card_index){
var map__133596 = p__133595;
var map__133596__$1 = cljs.core.__destructure_map(map__133596);
var preview_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133596__$1,new cljs.core.Keyword(null,"preview?","preview?",590561578));
var cards_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133596__$1,new cljs.core.Keyword(null,"cards?","cards?",1232384109));
var modal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133596__$1,new cljs.core.Keyword(null,"modal?","modal?",2146094679));
var cb = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133596__$1,new cljs.core.Keyword(null,"callback","callback",-705136228));
var review_records = new cljs.core.Keyword("frontend.extensions.srs","review-records","frontend.extensions.srs/review-records",955589499).cljs$core$IFn$_invoke$arity$1(state);
var current_block = frontend.util.nth_safe(blocks,cljs.core.deref(card_index));
var card = (cljs.core.truth_(current_block)?frontend.extensions.srs.__GT_card(current_block):null);
var finished_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((cljs.core.deref(card_index) + (1)),cljs.core.count(blocks));
if((card == null)){
return daiquiri.interpreter.interpret(frontend.extensions.srs.review_finished);
} else {
var phase = new cljs.core.Keyword("frontend.extensions.srs","phase","frontend.extensions.srs/phase",1185310974).cljs$core$IFn$_invoke$arity$1(state);
var map__133603 = frontend.extensions.srs.show_cycle(card,cljs.core.deref(phase));
var map__133603__$1 = cljs.core.__destructure_map(map__133603);
var current_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133603__$1,new cljs.core.Keyword(null,"value","value",305978217));
var next_phase = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133603__$1,new cljs.core.Keyword(null,"next-phase","next-phase",-424821986));
var root_block = card.block;
var root_block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(root_block);
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-card","content",(cljs.core.truth_((function (){var or__5002__auto__ = preview_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return modal_QMARK_;
}
})())?[frontend.util.hiccup__GT_class(".flex.flex-col.resize.overflow-y-auto"),(cljs.core.truth_(modal_QMARK_)?" modal-cards":null)].join(''):null)], null))},[(function (){var repo = frontend.state.get_current_repo();
return daiquiri.core.create_element("div",{'style':{'marginTop':(20)}},[frontend.components.block.breadcrumb(cljs.core.PersistentArrayMap.EMPTY,repo,root_block_id,cljs.core.PersistentArrayMap.EMPTY)]);
})(),frontend.components.block.blocks_container(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.extensions.srs.show_cycle_config(card,cljs.core.deref(phase)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(root_block_id),new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.components.editor.box,new cljs.core.Keyword(null,"review-cards?","review-cards?",-1467055076),true], null)], 0)),current_blocks),(cljs.core.truth_((function (){var or__5002__auto__ = preview_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return modal_QMARK_;
}
})())?(function (){var attrs133634 = ((((cljs.core.not(preview_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(next_phase,(1)))))?null:frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),(function (){var G__133700 = next_phase;
switch (G__133700) {
case (1):
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-hide-answers","flashcards/modal-btn-hide-answers",2088000675)], 0));

break;
case (2):
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-show-answers","flashcards/modal-btn-show-answers",-715699091)], 0));

break;
case (3):
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-show-clozes","flashcards/modal-btn-show-clozes",1508845905)], 0));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__133700)].join('')));

}
})(),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"s",new cljs.core.Keyword(null,"id","id",-1388402092),"card-answers",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(phase,next_phase);
})], null)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133634))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","my-4","justify-between"], null)], null),attrs133634], 0))):{'className':"flex my-4 justify-between"}),((cljs.core.map_QMARK_(attrs133634))?[(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(card_index),cljs.core.count(blocks));
if(and__5000__auto__){
var and__5000__auto____$1 = cards_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return preview_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-next-card","flashcards/modal-btn-next-card",737014033)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"n",new cljs.core.Keyword(null,"id","id",-1388402092),"card-next",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.extensions.srs.skip_card(card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))):null),((((cljs.core.not(preview_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),next_phase))))?(function (){var attrs133665 = frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-forgotten","flashcards/modal-btn-forgotten",-196234244)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"f",new cljs.core.Keyword(null,"id","id",-1388402092),"card-forgotten",new cljs.core.Keyword(null,"background","background",-863952629),"red",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.extensions.srs.score_and_next_card((1),card,card_index,finished_QMARK_,phase,review_records,cb);

var tomorrow = cljs_time.coerce.to_string(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),root_block_id,frontend.extensions.srs.card_next_schedule_property,tomorrow);
})], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs133665))?daiquiri.interpreter.element_attributes(attrs133665):null),((cljs.core.map_QMARK_(attrs133665))?[daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),(cljs.core.truth_(frontend.util.mobile_QMARK_())?"Hard":frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-recall","flashcards/modal-btn-recall",590327539)], 0))),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"t",new cljs.core.Keyword(null,"id","id",-1388402092),"card-recall",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((3),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-remembered","flashcards/modal-btn-remembered",-42354537)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"r",new cljs.core.Keyword(null,"id","id",-1388402092),"card-remembered",new cljs.core.Keyword(null,"background","background",-863952629),"green",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((5),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null)))]:[daiquiri.interpreter.interpret(attrs133665),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),(cljs.core.truth_(frontend.util.mobile_QMARK_())?"Hard":frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-recall","flashcards/modal-btn-recall",590327539)], 0))),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"t",new cljs.core.Keyword(null,"id","id",-1388402092),"card-recall",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((3),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-remembered","flashcards/modal-btn-remembered",-42354537)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"r",new cljs.core.Keyword(null,"id","id",-1388402092),"card-remembered",new cljs.core.Keyword(null,"background","background",-863952629),"green",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((5),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null)))]));
})():null),(cljs.core.truth_(preview_QMARK_)?frontend.ui.tooltip(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-reset","flashcards/modal-btn-reset",-1549744901)], 0))], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),"card-reset",new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.hiccup__GT_class("opacity-60.hover:opacity-100.card-reset"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.extensions.srs.operation_reset_BANG_(card);
})], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-reset-tip","flashcards/modal-btn-reset-tip",1655794165)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null)):null)]:[daiquiri.interpreter.interpret(attrs133634),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(card_index),cljs.core.count(blocks));
if(and__5000__auto__){
var and__5000__auto____$1 = cards_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return preview_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-next-card","flashcards/modal-btn-next-card",737014033)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"n",new cljs.core.Keyword(null,"id","id",-1388402092),"card-next",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-2",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.extensions.srs.skip_card(card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))):null),((((cljs.core.not(preview_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),next_phase))))?(function (){var attrs133698 = frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-forgotten","flashcards/modal-btn-forgotten",-196234244)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"f",new cljs.core.Keyword(null,"id","id",-1388402092),"card-forgotten",new cljs.core.Keyword(null,"background","background",-863952629),"red",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.extensions.srs.score_and_next_card((1),card,card_index,finished_QMARK_,phase,review_records,cb);

var tomorrow = cljs_time.coerce.to_string(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),root_block_id,frontend.extensions.srs.card_next_schedule_property,tomorrow);
})], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs133698))?daiquiri.interpreter.element_attributes(attrs133698):null),((cljs.core.map_QMARK_(attrs133698))?[daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),(cljs.core.truth_(frontend.util.mobile_QMARK_())?"Hard":frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-recall","flashcards/modal-btn-recall",590327539)], 0))),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"t",new cljs.core.Keyword(null,"id","id",-1388402092),"card-recall",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((3),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-remembered","flashcards/modal-btn-remembered",-42354537)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"r",new cljs.core.Keyword(null,"id","id",-1388402092),"card-remembered",new cljs.core.Keyword(null,"background","background",-863952629),"green",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((5),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null)))]:[daiquiri.interpreter.interpret(attrs133698),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),(cljs.core.truth_(frontend.util.mobile_QMARK_())?"Hard":frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-recall","flashcards/modal-btn-recall",590327539)], 0))),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"t",new cljs.core.Keyword(null,"id","id",-1388402092),"card-recall",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((3),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null))),daiquiri.interpreter.interpret(frontend.extensions.srs.btn_with_shortcut(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"btn-text","btn-text",1312481577),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-remembered","flashcards/modal-btn-remembered",-42354537)], 0)),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),"r",new cljs.core.Keyword(null,"id","id",-1388402092),"card-remembered",new cljs.core.Keyword(null,"background","background",-863952629),"green",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.extensions.srs.score_and_next_card((5),card,card_index,finished_QMARK_,phase,review_records,cb);
})], null)))]));
})():null),(cljs.core.truth_(preview_QMARK_)?frontend.ui.tooltip(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-reset","flashcards/modal-btn-reset",-1549744901)], 0))], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),"card-reset",new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.hiccup__GT_class("opacity-60.hover:opacity-100.card-reset"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.extensions.srs.operation_reset_BANG_(card);
})], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-btn-reset-tip","flashcards/modal-btn-reset-tip",1655794165)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null)):null)]));
})():(function (){var attrs133699 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Review cards",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133699))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["my-3"], null)], null),attrs133699], 0))):{'className':"my-3"}),((cljs.core.map_QMARK_(attrs133699))?null:[daiquiri.interpreter.interpret(attrs133699)]));
})())]);
}
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword("frontend.extensions.srs","phase","frontend.extensions.srs/phase",1185310974)),rum.core.local.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("frontend.extensions.srs","review-records","frontend.extensions.srs/review-records",955589499))], null),"frontend.extensions.srs/view");
frontend.extensions.srs.view_modal = rum.core.lazy_build(rum.core.build_defc,(function (blocks,option,card_index){
var attrs133784 = ((cljs.core.seq(blocks))?rum.core.with_key(frontend.extensions.srs.view(blocks,option,card_index),["ls-card-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)))].join('')):frontend.extensions.srs.review_finished);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133784))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"cards-modal"], null),attrs133784], 0))):{'id':"cards-modal"}),((cljs.core.map_QMARK_(attrs133784))?null:[daiquiri.interpreter.interpret(attrs133784)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("shortcut.handler","cards","shortcut.handler/cards",-979698196),false)], null),"frontend.extensions.srs/view-modal");
frontend.extensions.srs.preview_cp = rum.core.lazy_build(rum.core.build_defc,(function (block_id){
var blocks = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(block_id) : frontend.db.entity.call(null,block_id))], null);
return frontend.extensions.srs.view_modal(blocks,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"preview?","preview?",590561578),true], null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.extensions.srs/preview-cp");
frontend.extensions.srs.preview = (function frontend$extensions$srs$preview(block_id){
var G__133800 = (function (){
return frontend.extensions.srs.preview_cp(block_id);
});
var G__133801 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"srs","srs",1327991978)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__133800,G__133801) : logseq.shui.ui.dialog_open_BANG_.call(null,G__133800,G__133801));
});
frontend.extensions.srs.cloze_cue_separator = "\\\\";
/**
 * Parse the cloze content, and return [answer cue].
 */
frontend.extensions.srs.cloze_parse = (function frontend$extensions$srs$cloze_parse(content){
var parts = clojure.string.split.cljs$core$IFn$_invoke$arity$3(content,frontend.extensions.srs.cloze_cue_separator,(-1));
if((cljs.core.count(parts) <= (1))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content,null], null);
} else {
var cue = clojure.string.trim(cljs.core.last(parts));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.trimr(clojure.string.join.cljs$core$IFn$_invoke$arity$2(frontend.extensions.srs.cloze_cue_separator,cljs.core.drop_last.cljs$core$IFn$_invoke$arity$1(parts))),cue], null);
}
});
frontend.extensions.srs.cloze_macro_show = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,options){
var shown_QMARK__STAR_ = new cljs.core.Keyword(null,"shown?","shown?",1568009366).cljs$core$IFn$_invoke$arity$1(state);
var shown_QMARK_ = rum.core.react(shown_QMARK__STAR_);
var toggle_BANG_ = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(shown_QMARK__STAR_,cljs.core.not);
});
var vec__133812 = frontend.extensions.srs.cloze_parse(clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",new cljs.core.Keyword(null,"arguments","arguments",-1182834456).cljs$core$IFn$_invoke$arity$1(options)));
var answer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133812,(0),null);
var cue = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133812,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = shown_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872).cljs$core$IFn$_invoke$arity$1(config);
}
})())){
return daiquiri.core.create_element("a",{'onClick':toggle_BANG_,'className':"cloze-revealed"},[daiquiri.interpreter.interpret((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[%s]",answer) : frontend.util.format.call(null,"[%s]",answer)))]);
} else {
return daiquiri.core.create_element("a",{'onClick':toggle_BANG_,'className':"cloze"},[((clojure.string.blank_QMARK_(cue))?"[...]":["(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cue),")"].join(''))]);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var config = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var shown_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872).cljs$core$IFn$_invoke$arity$1(config));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"shown?","shown?",1568009366),shown_QMARK_);
})], null)], null),"frontend.extensions.srs/cloze-macro-show");
frontend.components.macro.register(frontend.extensions.srs.cloze_macro_name,frontend.extensions.srs.cloze_macro_show);
frontend.extensions.srs.cards_total = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
frontend.extensions.srs.get_srs_cards_total = (function frontend$extensions$srs$get_srs_cards_total(){
try{var repo = frontend.state.get_current_repo();
var query_string = "";
var blocks = frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$3(repo,query_string,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"use-cache?","use-cache?",-81331778),false], null));
if(cljs.core.seq(blocks)){
var map__133840 = frontend.extensions.srs.query_scheduled(blocks,cljs_time.local.local_now());
var map__133840__$1 = cljs.core.__destructure_map(map__133840);
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133840__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var count = cljs.core.count(result);
cljs.core.reset_BANG_(frontend.extensions.srs.cards_total,count);

return count;
} else {
return null;
}
}catch (e133836){var e = e133836;
console.error(e);

return (0);
}});
frontend.extensions.srs.cards_select = rum.core.lazy_build(rum.core.build_defc,(function (p__133841){
var map__133842 = p__133841;
var map__133842__$1 = cljs.core.__destructure_map(map__133842);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133842__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var items = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-all","flashcards/modal-select-all",-414628791)], 0))], null);
return frontend.components.select.select(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen,new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-switch","flashcards/modal-select-switch",317376108)], 0)),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),null], null));
}),null,"frontend.extensions.srs/cards-select");
frontend.extensions.srs.cards_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,options,p__133848){
var map__133850 = p__133848;
var map__133850__$1 = cljs.core.__destructure_map(map__133850);
var query_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133850__$1,new cljs.core.Keyword(null,"query-atom","query-atom",-1533727884));
var query_string = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133850__$1,new cljs.core.Keyword(null,"query-string","query-string",-1018845061));
var query_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133850__$1,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var due_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133850__$1,new cljs.core.Keyword(null,"due-result","due-result",1968277441));
var _STAR_random_mode_QMARK_ = new cljs.core.Keyword("frontend.extensions.srs","random-mode?","frontend.extensions.srs/random-mode?",-303322398).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_preview_mode_QMARK_ = new cljs.core.Keyword("frontend.extensions.srs","preview-mode?","frontend.extensions.srs/preview-mode?",-572584).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_card_index = new cljs.core.Keyword("frontend.extensions.srs","card-index","frontend.extensions.srs/card-index",1206694388).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.seq(query_result)){
var map__133858 = due_result;
var map__133858__$1 = cljs.core.__destructure_map(map__133858);
var total = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133858__$1,new cljs.core.Keyword(null,"total","total",1916810418));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133858__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var review_cards = (cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?query_result:result);
var card_query_block = (function (){var G__133859 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__133859) : frontend.db.entity.call(null,G__133859));
})();
var filtered_total = cljs.core.count(result);
var modal_QMARK_ = new cljs.core.Keyword(null,"modal?","modal?",2146094679).cljs$core$IFn$_invoke$arity$1(config);
var callback_fn = (function (review_records){
if(cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))){
return null;
} else {
frontend.extensions.srs.operation_card_info_summary_BANG_(review_records,review_cards,card_query_block);

return frontend.util.persist_var.persist_save(frontend.extensions.srs.srs_of_matrix);
}
});
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes((cljs.core.truth_(modal_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"height","height",1025178622),"100%"], null):null)),'className':"flex-1 cards-review"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center justify-between cards-title"},[(function (){var attrs133905 = frontend.ui.icon("infinity",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133905))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs133905], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs133905))?[frontend.ui.dropdown((function (p__133952){
var map__133955 = p__133952;
var map__133955__$1 = cljs.core.__destructure_map(map__133955);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133955__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-1.text-sm.font-medium.cursor","div.ml-1.text-sm.font-medium.cursor",-1510733785),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex","span.flex",-133532969),((clojure.string.blank_QMARK_(query_string))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-all","flashcards/modal-select-all",-414628791)], 0)):query_string),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),(2)], null)], null),frontend.components.svg.caret_down()], null)], null)], null);
}),(function (p__133960){
var map__133967 = p__133960;
var map__133967__$1 = cljs.core.__destructure_map(map__133967);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133967__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return frontend.extensions.srs.cards_select(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (query_SINGLEQUOTE_){
var query_SINGLEQUOTE__SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(query_SINGLEQUOTE_,frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-all","flashcards/modal-select-all",-414628791)], 0))))?"":query_SINGLEQUOTE_);
cljs.core.reset_BANG_(query_atom,query_SINGLEQUOTE__SINGLEQUOTE_);

return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
})], null));
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modal-class","modal-class",226435127),frontend.util.hiccup__GT_class("origin-top-right.absolute.left-0.mt-2.ml-2.rounded-md.shadow-lg")], null))]:[daiquiri.interpreter.interpret(attrs133905),frontend.ui.dropdown((function (p__133986){
var map__133987 = p__133986;
var map__133987__$1 = cljs.core.__destructure_map(map__133987);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133987__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-1.text-sm.font-medium.cursor","div.ml-1.text-sm.font-medium.cursor",-1510733785),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex","span.flex",-133532969),((clojure.string.blank_QMARK_(query_string))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-all","flashcards/modal-select-all",-414628791)], 0)):query_string),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),(2)], null)], null),frontend.components.svg.caret_down()], null)], null)], null);
}),(function (p__133990){
var map__133993 = p__133990;
var map__133993__$1 = cljs.core.__destructure_map(map__133993);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133993__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return frontend.extensions.srs.cards_select(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (query_SINGLEQUOTE_){
var query_SINGLEQUOTE__SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(query_SINGLEQUOTE_,frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-select-all","flashcards/modal-select-all",-414628791)], 0))))?"":query_SINGLEQUOTE_);
cljs.core.reset_BANG_(query_atom,query_SINGLEQUOTE__SINGLEQUOTE_);

return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
})], null));
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modal-class","modal-class",226435127),frontend.util.hiccup__GT_class("origin-top-right.absolute.left-0.mt-2.ml-2.rounded-md.shadow-lg")], null))]));
})(),(function (){var attrs133931 = (cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?frontend.ui.tooltip(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-60.text-sm.mr-2","div.opacity-60.text-sm.mr-2",-218738293),cljs.core.deref(_STAR_card_index),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"/"], null),total], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-current-total","flashcards/modal-current-total",-34416590)], 0))], null)):frontend.ui.tooltip(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-60.text-sm.mr-2","div.opacity-60.text-sm.mr-2",-218738293),(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (filtered_total - cljs.core.deref(_STAR_card_index));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"/"], null),total], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-overdue-total","flashcards/modal-overdue-total",1095274325)], 0))], null)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133931))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs133931], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs133931))?[frontend.ui.tooltip(frontend.ui.button(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),"letter-a",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_preview_mode_QMARK_,cljs.core.not);

return cljs.core.reset_BANG_(_STAR_card_index,(0));
}),new cljs.core.Keyword(null,"button-props","button-props",-392655929),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"preview-all-cards"], null),new cljs.core.Keyword(null,"small?","small?",95242445),true], null),(cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--ls-button-background)"], null)], null)], null):null)], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-toggle-preview-mode","flashcards/modal-toggle-preview-mode",-357240106)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null)),frontend.ui.tooltip(frontend.ui.button(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),"arrows-shuffle",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_random_mode_QMARK_,cljs.core.not);
}),new cljs.core.Keyword(null,"small?","small?",95242445),true], null),(cljs.core.truth_(cljs.core.deref(_STAR_random_mode_QMARK_))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--ls-button-background)"], null)], null)], null):null)], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-toggle-random-mode","flashcards/modal-toggle-random-mode",591792275)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null))]:[daiquiri.interpreter.interpret(attrs133931),frontend.ui.tooltip(frontend.ui.button(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),"letter-a",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_preview_mode_QMARK_,cljs.core.not);

return cljs.core.reset_BANG_(_STAR_card_index,(0));
}),new cljs.core.Keyword(null,"button-props","button-props",-392655929),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"preview-all-cards"], null),new cljs.core.Keyword(null,"small?","small?",95242445),true], null),(cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--ls-button-background)"], null)], null)], null):null)], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-toggle-preview-mode","flashcards/modal-toggle-preview-mode",-357240106)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null)),frontend.ui.tooltip(frontend.ui.button(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),"arrows-shuffle",new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_random_mode_QMARK_,cljs.core.not);
}),new cljs.core.Keyword(null,"small?","small?",95242445),true], null),(cljs.core.truth_(cljs.core.deref(_STAR_random_mode_QMARK_))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--ls-button-background)"], null)], null)], null):null)], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-toggle-random-mode","flashcards/modal-toggle-random-mode",591792275)], 0))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-props","trigger-props",1619401213),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),false], null)], null))]));
})()]),(function (){var attrs133902 = ((((cljs.core.not(modal_QMARK_)) && (cljs.core.not(cljs.core.deref(_STAR_preview_mode_QMARK_)))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__134025 = (function (){
var G__134029 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"modal?","modal?",2146094679),true);
var G__134030 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query-string","query-string",-1018845061),query_string], null);
return (frontend.extensions.srs.cards.cljs$core$IFn$_invoke$arity$2 ? frontend.extensions.srs.cards.cljs$core$IFn$_invoke$arity$2(G__134029,G__134030) : frontend.extensions.srs.cards.call(null,G__134029,G__134030));
});
var G__134028 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"srs","srs",1327991978)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__134025,G__134028) : logseq.shui.ui.dialog_open_BANG_.call(null,G__134025,G__134028));
})], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133902))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-1"], null)], null),attrs133902], 0))):{'className':"px-1"}),((cljs.core.map_QMARK_(attrs133902))?[(function (){var view_fn = (cljs.core.truth_(modal_QMARK_)?frontend.extensions.srs.view_modal:frontend.extensions.srs.view);
var blocks = (cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?query_result:review_cards);
var blocks__$1 = (cljs.core.truth_(cljs.core.deref(_STAR_random_mode_QMARK_))?cljs.core.shuffle(blocks):blocks);
return daiquiri.interpreter.interpret(view_fn(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"random-mode?","random-mode?",160495452),cljs.core.deref(_STAR_random_mode_QMARK_),new cljs.core.Keyword(null,"preview?","preview?",590561578),cljs.core.deref(_STAR_preview_mode_QMARK_),new cljs.core.Keyword(null,"callback","callback",-705136228),callback_fn], null)], 0))], 0)),_STAR_card_index));
})()]:[daiquiri.interpreter.interpret(attrs133902),(function (){var view_fn = (cljs.core.truth_(modal_QMARK_)?frontend.extensions.srs.view_modal:frontend.extensions.srs.view);
var blocks = (cljs.core.truth_(cljs.core.deref(_STAR_preview_mode_QMARK_))?query_result:review_cards);
var blocks__$1 = (cljs.core.truth_(cljs.core.deref(_STAR_random_mode_QMARK_))?cljs.core.shuffle(blocks):blocks);
return daiquiri.interpreter.interpret(view_fn(blocks__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"random-mode?","random-mode?",160495452),cljs.core.deref(_STAR_random_mode_QMARK_),new cljs.core.Keyword(null,"preview?","preview?",590561578),cljs.core.deref(_STAR_preview_mode_QMARK_),new cljs.core.Keyword(null,"callback","callback",-705136228),callback_fn], null)], 0))], 0)),_STAR_card_index));
})()]));
})()]);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"global?","global?",-2022837689).cljs$core$IFn$_invoke$arity$1(config))){
return daiquiri.core.create_element("div",{'className':"ls-card content"},[(function (){var attrs134041 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-title","flashcards/modal-welcome-title",1382331804)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs134041))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["title"], null)], null),attrs134041], 0))):{'className':"title"}),((cljs.core.map_QMARK_(attrs134041))?null:[daiquiri.interpreter.interpret(attrs134041)]));
})(),daiquiri.core.create_element("div",null,[(function (){var attrs134044 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-1","flashcards/modal-welcome-desc-1",-2060009736)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs134044))?daiquiri.interpreter.element_attributes(attrs134044):null),((cljs.core.map_QMARK_(attrs134044))?null:[daiquiri.interpreter.interpret(attrs134044)]));
})(),daiquiri.core.create_element("img",{'src':"https://docs.logseq.com/assets/2021-07-22_22.28.02_1626964258528_0.gif",'className':"my-4"},null),(function (){var attrs134052 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-2","flashcards/modal-welcome-desc-2",-1874683117)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs134052))?daiquiri.interpreter.element_attributes(attrs134052):null),((cljs.core.map_QMARK_(attrs134052))?[daiquiri.core.create_element("a",{'href':"https://docs.logseq.com/#/page/Flashcards",'target':"_blank"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-3","flashcards/modal-welcome-desc-3",-1875980337)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-4","flashcards/modal-welcome-desc-4",1856560367)], 0)))]:[daiquiri.interpreter.interpret(attrs134052),daiquiri.core.create_element("a",{'href':"https://docs.logseq.com/#/page/Flashcards",'target':"_blank"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-3","flashcards/modal-welcome-desc-3",-1875980337)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("flashcards","modal-welcome-desc-4","flashcards/modal-welcome-desc-4",1856560367)], 0)))]));
})()])]);
} else {
return daiquiri.core.create_element("div",{'className':"opacity-60 custom-query-title ls-card content"},[daiquiri.core.create_element("div",{'className':"w-full flex-1"},[daiquiri.core.create_element("code",{'className':"p-1"},[["Cards: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(query_string)].join('')])]),daiquiri.core.create_element("div",{'className':"mt-2 ml-2 font-medium"},["No matched cards"])]);
}
}
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2((0),new cljs.core.Keyword("frontend.extensions.srs","card-index","frontend.extensions.srs/card-index",1206694388)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.srs","random-mode?","frontend.extensions.srs/random-mode?",-303322398)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.srs","preview-mode?","frontend.extensions.srs/preview-mode?",-572584))], null),"frontend.extensions.srs/cards-inner");
frontend.extensions.srs.cards = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,options){
var _STAR_query = new cljs.core.Keyword("frontend.extensions.srs","query","frontend.extensions.srs/query",-826559416).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
var query_string = (function (){var or__5002__auto__ = cljs.core.deref(_STAR_query);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"query-string","query-string",-1018845061).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",new cljs.core.Keyword(null,"arguments","arguments",-1182834456).cljs$core$IFn$_invoke$arity$1(options));
}
}
})();
var query_result = frontend.extensions.srs.query.cljs$core$IFn$_invoke$arity$2(repo,query_string);
var due_result = frontend.extensions.srs.query_scheduled(query_result,cljs_time.local.local_now());
return frontend.extensions.srs.cards_inner(config,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"cards?","cards?",1232384109),true),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"query-atom","query-atom",-1533727884),_STAR_query,new cljs.core.Keyword(null,"query-string","query-string",-1018845061),query_string,new cljs.core.Keyword(null,"query-result","query-result",-833644142),query_result,new cljs.core.Keyword(null,"due-result","due-result",1968277441),due_result], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.srs","query","frontend.extensions.srs/query",-826559416)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.state.set_state_BANG_(new cljs.core.Keyword("srs","mode?","srs/mode?",-258295984),true);

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.set_state_BANG_(new cljs.core.Keyword("srs","mode?","srs/mode?",-258295984),false);

return state;
})], null)], null),"frontend.extensions.srs/cards");
frontend.extensions.srs.global_cards = rum.core.lazy_build(rum.core.build_defc,(function (){
return frontend.extensions.srs.cards(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"modal?","modal?",2146094679),true,new cljs.core.Keyword(null,"global?","global?",-2022837689),true], null),cljs.core.PersistentArrayMap.EMPTY);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
cljs.core.reset_BANG_(frontend.extensions.srs.global_cards_mode_QMARK_,true);

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.extensions.srs.global_cards_mode_QMARK_,false);

return state;
})], null)], null),"frontend.extensions.srs/global-cards");
frontend.components.macro.register(frontend.extensions.srs.query_macro_name,frontend.extensions.srs.cards);
logseq.graph_parser.property.register_built_in_properties(cljs.core.PersistentHashSet.createAsIfByAssoc([frontend.extensions.srs.card_last_score_property,frontend.extensions.srs.card_last_reviewed_property,frontend.extensions.srs.card_next_schedule_property,frontend.extensions.srs.card_last_interval_property,frontend.extensions.srs.card_repeats_property,frontend.extensions.srs.card_last_easiness_factor_property]));
frontend.commands.register_slash_command(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Cards",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{cards }}",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null),"Create a cards query",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword("icon","cards","icon/cards",156934547),new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),false], null)], null));
frontend.commands.register_slash_command(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Cloze",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{cloze }}",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null),"Create a cloze",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword("icon","eye-question","icon/eye-question",1398093085)], null)], null));
/**
 * given a block struct, adds the #card to title and returns
 * a seq of [original-block new-content-string]
 */
frontend.extensions.srs.add_card_tag_to_block = (function frontend$extensions$srs$add_card_tag_to_block(block){
var temp__5804__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var content = temp__5804__auto__;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var content__$1 = frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_built_in_properties_when_file_based(frontend.state.get_current_repo(),format,content));
var vec__134094 = frontend.format.mldoc.get_title_AMPERSAND_body(content__$1,format);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134094,(0),null);
var body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134094,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)," #",frontend.extensions.srs.card_hash_tag,"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(body)].join('')], null);
} else {
return null;
}
});
frontend.extensions.srs.batch_make_cards_BANG_ = (function frontend$extensions$srs$batch_make_cards_BANG_(var_args){
var G__134102 = arguments.length;
switch (G__134102) {
case 0:
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_selection_block_ids());
}));

(frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (block_ids){
var valid_blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__134098_SHARP_){
var G__134111 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__134098_SHARP_)], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__134111) : frontend.db.pull.call(null,G__134111));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.extensions.srs.card_block_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__134097_SHARP_){
var G__134112 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__134097_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__134112) : frontend.db.entity.call(null,G__134112));
}),block_ids)));
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.extensions.srs.add_card_tag_to_block,valid_blocks);
if(cljs.core.empty_QMARK_(blocks)){
return null;
} else {
return frontend.handler.editor.save_blocks_BANG_(blocks);
}
}));

(frontend.extensions.srs.batch_make_cards_BANG_.cljs$lang$maxFixedArity = 1);

if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.srs !== 'undefined') && (typeof frontend.extensions.srs._STAR_due_cards_interval !== 'undefined')){
} else {
frontend.extensions.srs._STAR_due_cards_interval = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.extensions.srs.update_cards_due_count_BANG_ = (function frontend$extensions$srs$update_cards_due_count_BANG_(){
if(cljs.core.truth_(frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0())){
var f = (function (){
var total = frontend.extensions.srs.get_srs_cards_total();
return frontend.state.set_state_BANG_(new cljs.core.Keyword("srs","cards-due-count","srs/cards-due-count",950004746),total);
});
setTimeout(f,(1000));

if((cljs.core.deref(frontend.extensions.srs._STAR_due_cards_interval) == null)){
var interval_SINGLEQUOTE_ = setInterval(f,((3600) * (1000)));
return cljs.core.reset_BANG_(frontend.extensions.srs._STAR_due_cards_interval,interval_SINGLEQUOTE_);
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.extensions.srs.js.map
