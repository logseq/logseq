goog.provide('frontend.format.block');
/**
 * Wrapper around logseq.graph-parser.block/extract-blocks that adds in system state
 * and handles unexpected failure.
 */
frontend.format.block.extract_blocks = (function frontend$format$block$extract_blocks(blocks,content,format,p__102505){
var map__102506 = p__102505;
var map__102506__$1 = cljs.core.__destructure_map(map__102506);
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102506__$1,new cljs.core.Keyword(null,"page-name","page-name",974981762));
var parse_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102506__$1,new cljs.core.Keyword(null,"parse-block","parse-block",-741293779));
var repo = frontend.state.get_current_repo();
try{var blocks__$1 = logseq.graph_parser.block.extract_blocks(blocks,content,format,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"user-config","user-config",-1138679827),frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"parse-block","parse-block",-741293779),parse_block,new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),frontend.config.get_block_pattern(format),new cljs.core.Keyword(null,"db","db",993250759),(frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo)),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),frontend.state.get_date_formatter(),new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name,new cljs.core.Keyword(null,"db-graph-mode?","db-graph-mode?",586979227),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)], null));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var G__102512 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("block","format","block/format",-1212045901),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","macros","block/macros",650396438),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873)], 0));
if(cljs.core.truth_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block))){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__102512,cljs.core.update_keys(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),(function (k){
var or__5002__auto__ = (function (){var fexpr__102516 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"heading","heading",-1312171873),new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415)], null);
return (fexpr__102516.cljs$core$IFn$_invoke$arity$1 ? fexpr__102516.cljs$core$IFn$_invoke$arity$1(k) : fexpr__102516.call(null,k));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Don't know how to save graph-parser property ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k], 0))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
}))], 0));
} else {
return G__102512;
}
}),blocks__$1);
} else {
return blocks__$1;
}
}catch (e102507){var e = e102507;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.format.block",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),e,new cljs.core.Keyword(null,"line","line",212345235),43], null)),e);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),e,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"Extract-blocks"], null)], null)], null));

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("An unexpected error occurred during block extraction.",new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.PersistentVector.EMPTY;
}});
frontend.format.block.normalize_as_percentage = (function frontend$format$block$normalize_as_percentage(block){
var G__102519 = block;
var G__102519__$1 = (((G__102519 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102519));
var G__102519__$2 = (((G__102519__$1 == null))?null:cljs.core.re_matches(/(-?\d+\.?\d*)%/,G__102519__$1));
var G__102519__$3 = (((G__102519__$2 == null))?null:cljs.core.second(G__102519__$2));
if((G__102519__$3 == null)){
return null;
} else {
return (function (p1__102517_SHARP_){
return (p1__102517_SHARP_ / (100));
})(G__102519__$3);
}
});
frontend.format.block.normalize_as_date = (function frontend$format$block$normalize_as_date(block){
var G__102520 = block;
var G__102520__$1 = (((G__102520 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102520));
var G__102520__$2 = (((G__102520__$1 == null))?null:frontend.date.normalize_date(G__102520__$1));
if((G__102520__$2 == null)){
return null;
} else {
return cljs_time.format.unparse(frontend.date.custom_formatter,G__102520__$2);
}
});
/**
 * Normalizes supported formats such as dates and percentages.
 * Be careful, this function may harm query sort performance!
 * - nlp-date? - Enable NLP parsing on date items.
 *     Requires heavy computation (see `normalize-as-date` for details)
 */
frontend.format.block.normalize_block = (function frontend$format$block$normalize_block(block,nlp_date_QMARK_){
return cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__102521_SHARP_){
var G__102522 = ((cljs.core.set_QMARK_(block))?cljs.core.first(block):block);
return (p1__102521_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__102521_SHARP_.cljs$core$IFn$_invoke$arity$1(G__102522) : p1__102521_SHARP_.call(null,G__102522));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.format.block.normalize_as_percentage,(cljs.core.truth_(nlp_date_QMARK_)?frontend.format.block.normalize_as_date:null),cljs.core.identity], null)))));
});
frontend.format.block.parse_block = (function frontend$format$block$parse_block(p__102526){
var map__102527 = p__102526;
var map__102527__$1 = cljs.core.__destructure_map(map__102527);
var block = map__102527__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102527__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102527__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102527__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
if(clojure.string.blank_QMARK_(title)){
return null;
} else {
var block__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var parse_config = frontend.format.mldoc.get_default_config(format__$1);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var blocks = (cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block__$1);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block__$1], null):(function (){var ast = frontend.format.to_edn(title,format__$1,parse_config);
return frontend.format.block.extract_blocks(ast,title,format__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"parse-block","parse-block",-741293779),block__$1], null));
})());
var new_block = cljs.core.first(blocks);
var block__$2 = (function (){var G__102530 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,new_block], 0));
var G__102530__$1 = (((cljs.core.count(blocks) > (1)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__102530,new cljs.core.Keyword("block","warning","block/warning",2131709542),new cljs.core.Keyword(null,"multiple-blocks","multiple-blocks",1235340805)):G__102530);
if(db_based_QMARK_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__102530__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
} else {
return G__102530__$1;
}
})();
var block__$3 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block__$2,new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","level","block/level",1182509971)], 0));
if(cljs.core.truth_(uuid)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$3,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid);
} else {
return block__$3;
}
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.block !== 'undefined') && (typeof frontend.format.block._STAR_blocks_ast_cache !== 'undefined')){
} else {
frontend.format.block._STAR_blocks_ast_cache = cljs.core.volatile_BANG_(cljs.cache.lru_cache_factory.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentArrayMap.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"threshold","threshold",204221583),(5000)], 0)));
}
frontend.format.block.parse_title_and_body_helper = (function frontend$format$block$parse_title_and_body_helper(format,content){
var parse_config = frontend.format.mldoc.get_default_config(format);
var ast = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,frontend.format.to_edn(content,format,parse_config));
var title = ((logseq.graph_parser.block.heading_block_QMARK_(cljs.core.first(ast)))?new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(cljs.core.second(cljs.core.first(ast))):null);
var body = cljs.core.vec((cljs.core.truth_(title)?cljs.core.rest(ast):ast));
var body__$1 = cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.property.properties_ast_QMARK_,body);
var G__102533 = ((cljs.core.seq(body__$1))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035),body__$1], null):cljs.core.PersistentArrayMap.EMPTY);
if(cljs.core.truth_(title)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__102533,new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067),title);
} else {
return G__102533;
}
});
frontend.format.block.cached_parse_title_and_body_helper = frontend.common.cache.cache_fn(frontend.format.block._STAR_blocks_ast_cache,(function (format,content){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [format,content], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [format,content], null)], null);
}),frontend.format.block.parse_title_and_body_helper);
frontend.format.block.parse_title_and_body = (function frontend$format$block$parse_title_and_body(var_args){
var G__102537 = arguments.length;
switch (G__102537) {
case 1:
return frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 4:
return frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$1 = (function (block){
if(cljs.core.map_QMARK_(block)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))], 0));
} else {
return null;
}
}));

(frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4 = (function (_block_uuid,format,pre_block_QMARK_,content){
if(clojure.string.blank_QMARK_(content)){
return null;
} else {
var content__$1 = (cljs.core.truth_(pre_block_QMARK_)?content:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_block_pattern(format))," ",clojure.string.triml(content)].join(''));
return frontend.format.block.cached_parse_title_and_body_helper(format,content__$1);
}
}));

(frontend.format.block.parse_title_and_body.cljs$lang$maxFixedArity = 4);

frontend.format.block.break_line_paragraph_QMARK_ = (function frontend$format$block$break_line_paragraph_QMARK_(p__102543){
var vec__102544 = p__102543;
var typ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102544,(0),null);
var break_lines = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102544,(1),null);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(typ,"Paragraph")) && (cljs.core.every_QMARK_((function (p1__102542_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__102542_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Break_Line"], null));
}),break_lines)));
});
frontend.format.block.trim_paragraph_special_break_lines = (function frontend$format$block$trim_paragraph_special_break_lines(ast){
var vec__102549 = ast;
var typ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102549,(0),null);
var paras = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102549,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(typ,"Paragraph")){
var indexed_paras = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,paras);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [typ,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__102548_SHARP_){
return cljs.core.last(p1__102548_SHARP_);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__102547_SHARP_){
var vec__102552 = p1__102547_SHARP_;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102552,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102552,(1),null);
return (!((((index > (0))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Break_Line"], null))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Timestamp",null,"Macro",null], null), null),cljs.core.first(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(paras,(index - (1)))))))))));
}),indexed_paras))], null);
} else {
return ast;
}
});
frontend.format.block.trim_break_lines_BANG_ = (function frontend$format$block$trim_break_lines_BANG_(ast){
return cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(frontend.format.block.break_line_paragraph_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.format.block.trim_paragraph_special_break_lines,ast));
});

//# sourceMappingURL=frontend.format.block.js.map
