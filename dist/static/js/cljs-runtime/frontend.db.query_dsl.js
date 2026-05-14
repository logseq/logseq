goog.provide('frontend.db.query_dsl');
frontend.db.query_dsl.__GT_journal_day_int = (function frontend$db$query_dsl$__GT_journal_day_int(input){
var input__$1 = clojure.string.lower_case(cljs.core.name(input));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("today",input__$1)){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.today());
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("yesterday",input__$1)){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.yesterday());
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("tomorrow",input__$1)){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
} else {
if(logseq.common.util.page_ref.page_ref_QMARK_(input__$1)){
var input__$2 = clojure.string.capitalize(clojure.string.replace(logseq.common.util.page_ref.get_page_name(input__$1),":",""));
if(frontend.date.valid_journal_title_QMARK_(input__$2)){
return frontend.date.journal_title__GT_int(input__$2);
} else {
return null;
}
} else {
var duration = cljs.core.parse_long(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(input__$1,(0),(((input__$1).length) - (1))));
var kind = cljs.core.last(input__$1);
var tf = (function (){var G__103529 = kind;
switch (G__103529) {
case "y":
return cljs_time.core.years;

break;
case "m":
return cljs_time.core.months;

break;
case "w":
return cljs_time.core.weeks;

break;
default:
return cljs_time.core.days;

}
})();
return logseq.common.util.date_time.date__GT_int(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),(tf.cljs$core$IFn$_invoke$arity$1 ? tf.cljs$core$IFn$_invoke$arity$1(duration) : tf.call(null,duration))));

}
}
}
}
});
frontend.db.query_dsl.__GT_timestamp = (function frontend$db$query_dsl$__GT_timestamp(input){
var input__$1 = clojure.string.lower_case(cljs.core.name(input));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("now",input__$1)){
return (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("today",input__$1)){
return cljs_time.coerce.to_long(cljs_time.core.today());
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("yesterday",input__$1)){
return cljs_time.coerce.to_long(cljs_time.core.yesterday());
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("tomorrow",input__$1)){
return cljs_time.coerce.to_long(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
} else {
if(logseq.common.util.page_ref.page_ref_QMARK_(input__$1)){
var input__$2 = clojure.string.capitalize(clojure.string.replace(logseq.common.util.page_ref.get_page_name(input__$1),":",""));
if(frontend.date.valid_journal_title_QMARK_(input__$2)){
return frontend.date.journal_title__GT_long(input__$2);
} else {
return null;
}
} else {
var duration = cljs.core.parse_long(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(input__$1,(0),(((input__$1).length) - (1))));
var kind = cljs.core.last(input__$1);
var tf = (function (){var G__103539 = kind;
switch (G__103539) {
case "y":
return cljs_time.core.years;

break;
case "m":
return cljs_time.core.months;

break;
case "w":
return cljs_time.core.weeks;

break;
case "h":
return cljs_time.core.hours;

break;
case "n":
return cljs_time.core.minutes;

break;
default:
return cljs_time.core.days;

}
})();
return cljs_time.coerce.to_long(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.now(),(tf.cljs$core$IFn$_invoke$arity$1 ? tf.cljs$core$IFn$_invoke$arity$1(duration) : tf.call(null,duration))));

}
}
}
}
}
});
frontend.db.query_dsl.collect_vars = (function frontend$db$query_dsl$collect_vars(l){
var vars = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
clojure.walk.postwalk((function (f){
if((((f instanceof cljs.core.Symbol)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("?",cljs.core.first(cljs.core.name(f)))))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(vars,cljs.core.conj,f);
} else {
}

return f;
}),l);

return cljs.core.deref(vars);
});
frontend.db.query_dsl.build_and_or_not_result = (function frontend$db$query_dsl$build_and_or_not_result(fe,clauses,current_filter,nested_and_QMARK_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(fe,new cljs.core.Symbol(null,"not","not",1044554643,null))){
if(cljs.core.every_QMARK_(cljs.core.list_QMARK_,clauses)){
return cljs.core.cons(fe,cljs.core.seq(clauses));
} else {
var clauses__$1 = ((cljs.core.coll_QMARK_(cljs.core.first(clauses)))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,clauses):clauses);
var clauses__$2 = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(clauses__$1))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"and","and",668631710,null),cljs.core.ffirst(clauses__$1)))))?cljs.core.rest(cljs.core.first(clauses__$1)):clauses__$1);
return cljs.core.cons(fe,cljs.core.seq(clauses__$2));
}
} else {
if(cljs.core.coll_QMARK_(cljs.core.first(clauses))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_filter,new cljs.core.Symbol(null,"not","not",1044554643,null))){
return cljs.core.cons(new cljs.core.Symbol(null,"and","and",668631710,null),clauses);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_filter,new cljs.core.Symbol(null,"or","or",1876275696,null));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return nested_and_QMARK_;
}
})())){
return cljs.core.cons(new cljs.core.Symbol(null,"and","and",668631710,null),clauses);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.list,fe,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (result){
if(cljs.core.list_QMARK_(result)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [result], null);
} else {
if(cljs.core.vector_QMARK_(result)){
return result;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.cons(new cljs.core.Symbol(null,"and","and",668631710,null),cljs.core.seq(result))], null);

}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clauses], 0)));

}
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.list,fe,clauses);

}
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.query_dsl !== 'undefined') && (typeof frontend.db.query_dsl.remove_nil_QMARK_ !== 'undefined')){
} else {
frontend.db.query_dsl.remove_nil_QMARK_ = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.remove,cljs.core.nil_QMARK_);
}
frontend.db.query_dsl.build_and_or_not = (function frontend$db$query_dsl$build_and_or_not(e,p__103569,level,fe){
var map__103570 = p__103569;
var map__103570__$1 = cljs.core.__destructure_map(map__103570);
var env = map__103570__$1;
var current_filter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103570__$1,new cljs.core.Keyword(null,"current-filter","current-filter",1519815247));
var vars = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103570__$1,new cljs.core.Keyword(null,"vars","vars",-2046957217));
var raw_clauses = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (form){
var G__103571 = form;
var G__103572 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"current-filter","current-filter",1519815247),fe);
var G__103573 = (level + (1));
return (frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$3 ? frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$3(G__103571,G__103572,G__103573) : frontend.db.query_dsl.build_query.call(null,G__103571,G__103572,G__103573));
}),cljs.core.rest(e));
var clauses = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(frontend.db.query_dsl.remove_nil_QMARK_(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"query","query",-1288509510),raw_clauses)));
var nested_and_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(fe,new cljs.core.Symbol(null,"and","and",668631710,null))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_filter,new cljs.core.Symbol(null,"and","and",668631710,null))));
if(cljs.core.seq(clauses)){
var result = frontend.db.query_dsl.build_and_or_not_result(fe,clauses,current_filter,nested_and_QMARK_);
var vars_SINGLEQUOTE_ = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.deref(vars)),frontend.db.query_dsl.collect_vars(result));
var query = ((nested_and_QMARK_)?result:(((((level === (0))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"and","and",668631710,null),null,new cljs.core.Symbol(null,"or","or",1876275696,null),null], null), null),fe))))?result:((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"not","not",1044554643,null),fe)) && ((!((current_filter == null))))))?result:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [result], null)
)));
cljs.core.reset_BANG_(vars,vars_SINGLEQUOTE_);

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),query,new cljs.core.Keyword(null,"rules","rules",1198912366),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"rules","rules",1198912366),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([raw_clauses], 0)))], null);
} else {
return null;
}
});
frontend.db.query_dsl.resolve_timestamp_property = (function frontend$db$query_dsl$resolve_timestamp_property(e){
var k = cljs.core.second(e);
if((((k instanceof cljs.core.Keyword)) || ((((k instanceof cljs.core.Symbol)) || (typeof k === 'string'))))){
var k_SINGLEQUOTE_ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.lower_case(cljs.core.name(k)),"_","-"));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
return logseq.db.frontend.property.property_QMARK_(k_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})())){
return k_SINGLEQUOTE_;
} else {
var G__103576 = k_SINGLEQUOTE_;
var G__103576__$1 = (((G__103576 instanceof cljs.core.Keyword))?G__103576.fqn:null);
switch (G__103576__$1) {
case "created-at":
return new cljs.core.Keyword("block","created-at","block/created-at",1440015);

break;
case "updated-at":
return new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551);

break;
default:
return null;

}
}
} else {
return null;
}
});
frontend.db.query_dsl.get_timestamp_property = (function frontend$db$query_dsl$get_timestamp_property(e){
var temp__5804__auto__ = frontend.db.query_dsl.resolve_timestamp_property(e);
if(cljs.core.truth_(temp__5804__auto__)){
var k = temp__5804__auto__;
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
if((k instanceof cljs.core.Keyword)){
return k;
} else {
return null;
}
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null], null), null),k)){
return k;
} else {
return null;
}
}
} else {
return null;
}
});
frontend.db.query_dsl.build_journal_between_two_arg = (function frontend$db$query_dsl$build_journal_between_two_arg(e){
var start = frontend.db.query_dsl.__GT_journal_day_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(1)));
var end = frontend.db.query_dsl.__GT_journal_day_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(2)));
var vec__103583 = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,end], null));
var start__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103583,(0),null);
var end__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103583,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"between","between",-1523336493,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,start__$1,(new cljs.core.List(null,end__$1,null,(1),null)),(2),null)),(3),null)),(4),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"between","between",1131099276)], null)], null);
});
frontend.db.query_dsl.file_based_build_between_three_arg = (function frontend$db$query_dsl$file_based_build_between_three_arg(e){
var temp__5804__auto__ = frontend.db.query_dsl.get_timestamp_property(e);
if(cljs.core.truth_(temp__5804__auto__)){
var k = temp__5804__auto__;
var start = frontend.db.query_dsl.__GT_timestamp(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(2)));
var end = frontend.db.query_dsl.__GT_timestamp(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(3)));
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())){
var vec__103599 = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,end], null));
var start__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103599,(0),null);
var end__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103599,(1),null);
var sym = new cljs.core.Symbol(null,"?v","?v",-464183118,null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,"get","get",-971253014,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),(new cljs.core.List(null,k,null,(1),null)),(2),null)),(3),null)),sym], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,">=",">=",1016916022,null),(new cljs.core.List(null,sym,(new cljs.core.List(null,start__$1,null,(1),null)),(2),null)),(3),null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,"<","<",993667236,null),(new cljs.core.List(null,sym,(new cljs.core.List(null,end__$1,null,(1),null)),(2),null)),(3),null))], null)], null)], null);
} else {
return null;
}
} else {
return null;
}
});
frontend.db.query_dsl.db_based_build_between_three_arg = (function frontend$db$query_dsl$db_based_build_between_three_arg(e){
var temp__5804__auto__ = frontend.db.query_dsl.get_timestamp_property(e);
if(cljs.core.truth_(temp__5804__auto__)){
var k = temp__5804__auto__;
var start = frontend.db.query_dsl.__GT_timestamp(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(2)));
var end = frontend.db.query_dsl.__GT_timestamp(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(3)));
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())){
var vec__103605 = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,end], null));
var start__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103605,(0),null);
var end__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103605,(1),null);
var sym = new cljs.core.Symbol(null,"?v","?v",-464183118,null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),k,sym], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,">=",">=",1016916022,null),(new cljs.core.List(null,sym,(new cljs.core.List(null,start__$1,null,(1),null)),(2),null)),(3),null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,"<","<",993667236,null),(new cljs.core.List(null,sym,(new cljs.core.List(null,end__$1,null,(1),null)),(2),null)),(3),null))], null)], null)], null);
} else {
return null;
}
} else {
return null;
}
});
frontend.db.query_dsl.db_based_build_between_two_arg = (function frontend$db$query_dsl$db_based_build_between_two_arg(e){
return frontend.db.query_dsl.db_based_build_between_three_arg(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(e,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"now","now",-9994004,null)], null)));
});
frontend.db.query_dsl.build_between = (function frontend$db$query_dsl$build_between(e,p__103608){
var map__103609 = p__103608;
var map__103609__$1 = cljs.core.__destructure_map(map__103609);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103609__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((3),cljs.core.count(e))){
var k = frontend.db.query_dsl.get_timestamp_property(e);
if(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return k;
} else {
return and__5000__auto__;
}
})())){
return frontend.db.query_dsl.db_based_build_between_two_arg(e);
} else {
return frontend.db.query_dsl.build_journal_between_two_arg(e);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((4),cljs.core.count(e))){
if(cljs.core.truth_(db_graph_QMARK_)){
return frontend.db.query_dsl.db_based_build_between_three_arg(e);
} else {
return frontend.db.query_dsl.file_based_build_between_three_arg(e);
}
} else {
return null;
}
}
});
/**
 * Parses property values for file graphs and handles non-string values or any page-ref like values
 */
frontend.db.query_dsl.__GT_file_property_value = (function frontend$db$query_dsl$__GT_file_property_value(v_STAR_){
if((!((v_STAR_ == null)))){
var v = cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_STAR_);
var result = (function (){var temp__5806__auto__ = logseq.graph_parser.text.parse_non_string_property_value(v);
if((temp__5806__auto__ == null)){
if(clojure.string.starts_with_QMARK_(v,"#")){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(v,(1));
} else {
var or__5002__auto__ = logseq.common.util.page_ref.get_page_name(v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v;
}
}
} else {
var res = temp__5806__auto__;
return res;
}
})();
if(typeof result === 'string'){
var or__5002__auto__ = cljs.core.parse_double(result);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.trim(result);
}
} else {
return result;
}
} else {
return v_STAR_;
}
});
/**
 * Parses property values for DB graphs
 */
frontend.db.query_dsl.__GT_db_property_value = (function frontend$db$query_dsl$__GT_db_property_value(k,v){
var v_SINGLEQUOTE_ = (((v instanceof cljs.core.Symbol))?cljs.core.str.cljs$core$IFn$_invoke$arity$1(v):v);
if(typeof v_SINGLEQUOTE_ === 'string'){
if(clojure.string.starts_with_QMARK_(v_SINGLEQUOTE_,"#")){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(v_SINGLEQUOTE_,(1));
} else {
var or__5002__auto__ = logseq.common.util.page_ref.get_page_name(v_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_SINGLEQUOTE_;
}
}
} else {
if(((cljs.core.double_QMARK_(v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(k)))))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(v);
} else {
return v_SINGLEQUOTE_;

}
}
});
/**
 * Case-insensitive property names for file graphs. Users manually type queries to enter them as they appear
 */
frontend.db.query_dsl.__GT_file_keyword_property = (function frontend$db$query_dsl$__GT_file_keyword_property(property_name){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(clojure.string.replace(cljs.core.name(property_name),"_","-")));
});
/**
 * Returns property db-ident given case sensitive property names for db graphs
 */
frontend.db.query_dsl.__GT_db_keyword_property = (function frontend$db$query_dsl$__GT_db_keyword_property(property_name){
if(cljs.core.qualified_keyword_QMARK_(property_name)){
return property_name;
} else {
var or__5002__auto__ = (function (){var G__103621 = cljs.core.name(property_name);
var G__103621__$1 = (((G__103621 == null))?null:frontend.db.utils.q.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?title","?title",-835622503,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?title","?title",-835622503,null)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__103621], 0)));
var G__103621__$2 = (((G__103621__$1 == null))?null:cljs.core.first(G__103621__$1));
if((G__103621__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(G__103621__$2);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("frontend.db.query-dsl","no-property-found","frontend.db.query-dsl/no-property-found",1452661023);
}
}
});
frontend.db.query_dsl.build_property_two_arg = (function frontend$db$query_dsl$build_property_two_arg(e,p__103622){
var map__103623 = p__103622;
var map__103623__$1 = cljs.core.__destructure_map(map__103623);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103623__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var private_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103623__$1,new cljs.core.Keyword(null,"private-property?","private-property?",321853022));
var k = (cljs.core.truth_(db_graph_QMARK_)?frontend.db.query_dsl.__GT_db_keyword_property(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(1))):frontend.db.query_dsl.__GT_file_keyword_property(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(1))));
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(2));
var v_SINGLEQUOTE_ = (cljs.core.truth_(db_graph_QMARK_)?frontend.db.query_dsl.__GT_db_property_value(k,v):frontend.db.query_dsl.__GT_file_property_value(v));
if(cljs.core.truth_(db_graph_QMARK_)){
if(cljs.core.truth_(private_property_QMARK_)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"private-simple-query-property","private-simple-query-property",-1380489961,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,(new cljs.core.List(null,v_SINGLEQUOTE_,null,(1),null)),(2),null)),(3),null)),(4),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"private-simple-query-property","private-simple-query-property",1273945808)], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"simple-query-property","simple-query-property",-1386391486,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,(new cljs.core.List(null,v_SINGLEQUOTE_,null,(1),null)),(2),null)),(3),null)),(4),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"simple-query-property","simple-query-property",1268044283)], null)], null);
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"property","property",526253295,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,(new cljs.core.List(null,v_SINGLEQUOTE_,null,(1),null)),(2),null)),(3),null)),(4),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"property","property",-1114278232)], null)], null);
}
});
frontend.db.query_dsl.build_property_one_arg = (function frontend$db$query_dsl$build_property_one_arg(e,p__103624){
var map__103625 = p__103624;
var map__103625__$1 = cljs.core.__destructure_map(map__103625);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103625__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var private_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103625__$1,new cljs.core.Keyword(null,"private-property?","private-property?",321853022));
var k = (cljs.core.truth_(db_graph_QMARK_)?frontend.db.query_dsl.__GT_db_keyword_property(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(1))):frontend.db.query_dsl.__GT_file_keyword_property(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(e,(1))));
if(cljs.core.truth_(db_graph_QMARK_)){
if(cljs.core.truth_(private_property_QMARK_)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"has-private-simple-query-property","has-private-simple-query-property",-555006775,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-private-simple-query-property","has-private-simple-query-property",2099428994)], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"has-simple-query-property","has-simple-query-property",372683689,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-simple-query-property","has-simple-query-property",-1267847838)], null)], null);
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"has-property","has-property",-130314949,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,k,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-property","has-property",-1770846476)], null)], null);
}
});
frontend.db.query_dsl.build_property = (function frontend$db$query_dsl$build_property(e,env){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((3),cljs.core.count(e))){
return frontend.db.query_dsl.build_property_two_arg(e,env);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(e))){
return frontend.db.query_dsl.build_property_one_arg(e,env);
} else {
return null;
}
}
});
frontend.db.query_dsl.build_task = (function frontend$db$query_dsl$build_task(e,p__103626){
var map__103627 = p__103626;
var map__103627__$1 = cljs.core.__destructure_map(map__103627);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103627__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var markers = ((cljs.core.coll_QMARK_(cljs.core.first(cljs.core.rest(e))))?cljs.core.first(cljs.core.rest(e)):cljs.core.rest(e));
if(cljs.core.seq(markers)){
if(cljs.core.truth_(db_graph_QMARK_)){
var markers_SINGLEQUOTE_ = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(logseq.common.util.capitalize_all,cljs.core.name),markers));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"task","task",163923534,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,cljs.core.set(markers_SINGLEQUOTE_),null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"task","task",-1476607993)], null)], null);
} else {
var markers__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.upper_case,cljs.core.name),markers));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"task","task",163923534,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,markers__$1,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"task","task",-1476607993)], null)], null);
}
} else {
return null;
}
});
frontend.db.query_dsl.build_priority = (function frontend$db$query_dsl$build_priority(e,p__103628){
var map__103629 = p__103628;
var map__103629__$1 = cljs.core.__destructure_map(map__103629);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103629__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var priorities = ((cljs.core.coll_QMARK_(cljs.core.first(cljs.core.rest(e))))?cljs.core.first(cljs.core.rest(e)):cljs.core.rest(e));
if(cljs.core.seq(priorities)){
if(cljs.core.truth_(db_graph_QMARK_)){
var priorities__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.capitalize,cljs.core.name),priorities));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"priority","priority",-1223342054,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,priorities__$1,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"priority","priority",1431093715)], null)], null);
} else {
var priorities__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.upper_case,cljs.core.name),priorities));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"priority","priority",-1223342054,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,priorities__$1,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"priority","priority",1431093715)], null)], null);
}
} else {
return null;
}
});
frontend.db.query_dsl.build_page_property = (function frontend$db$query_dsl$build_page_property(e){
var vec__103630 = cljs.core.rest(e);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103630,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103630,(1),null);
var k_SINGLEQUOTE_ = frontend.db.query_dsl.__GT_file_keyword_property(k);
if((!((v == null)))){
var v_SINGLEQUOTE_ = frontend.db.query_dsl.__GT_file_property_value(v);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"page-property","page-property",1223486862,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),(new cljs.core.List(null,k_SINGLEQUOTE_,(new cljs.core.List(null,v_SINGLEQUOTE_,null,(1),null)),(2),null)),(3),null)),(4),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-property","page-property",-417044665)], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"has-page-property","has-page-property",1696919326,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),(new cljs.core.List(null,k_SINGLEQUOTE_,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-page-property","has-page-property",56387799)], null)], null);
}
});
frontend.db.query_dsl.build_tags = (function frontend$db$query_dsl$build_tags(e,p__103633){
var map__103634 = p__103633;
var map__103634__$1 = cljs.core.__destructure_map(map__103634);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103634__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var tags = ((cljs.core.coll_QMARK_(cljs.core.first(cljs.core.rest(e))))?cljs.core.first(cljs.core.rest(e)):cljs.core.rest(e));
var tags__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,cljs.core.name),tags);
if(cljs.core.seq(tags__$1)){
var tags__$2 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(logseq.common.util.page_ref.get_page_name_BANG_,clojure.string.lower_case,cljs.core.name),tags__$1));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"tags","tags",-883016792,null),(new cljs.core.List(null,(cljs.core.truth_(db_graph_QMARK_)?new cljs.core.Symbol(null,"?b","?b",1575118075,null):new cljs.core.Symbol(null,"?p","?p",-10896580,null)),(new cljs.core.List(null,tags__$2,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tags","tags",1771418977)], null)], null);
} else {
return null;
}
});
frontend.db.query_dsl.build_page_tags = (function frontend$db$query_dsl$build_page_tags(e){
var tags = ((cljs.core.coll_QMARK_(cljs.core.first(cljs.core.rest(e))))?cljs.core.first(cljs.core.rest(e)):cljs.core.rest(e));
var tags__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,cljs.core.name),tags);
if(cljs.core.seq(tags__$1)){
var tags__$2 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(logseq.common.util.page_ref.get_page_name_BANG_,clojure.string.lower_case,cljs.core.name),tags__$1));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"page-tags","page-tags",631095502,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),(new cljs.core.List(null,tags__$2,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025)], null)], null);
} else {
return null;
}
});
frontend.db.query_dsl.build_all_page_tags = (function frontend$db$query_dsl$build_all_page_tags(){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"all-page-tags","all-page-tags",-118720438,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),null,(1),null)),(2),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-page-tags","all-page-tags",-1759251965)], null)], null);
});
frontend.db.query_dsl.build_sample = (function frontend$db$query_dsl$build_sample(e,sample){
var temp__5804__auto__ = cljs.core.second(e);
if(cljs.core.truth_(temp__5804__auto__)){
var num = temp__5804__auto__;
if(cljs.core.integer_QMARK_(num)){
cljs.core.reset_BANG_(sample,num);

return cljs.core.PersistentArrayMap.EMPTY;
} else {
return null;
}
} else {
return null;
}
});
frontend.db.query_dsl.build_sort_by = (function frontend$db$query_dsl$build_sort_by(e,sort_by_){
var vec__103642 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,cljs.core.rest(e));
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103642,(0),null);
var order_STAR_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103642,(1),null);
var order = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"desc","desc",2093485764),null,new cljs.core.Keyword(null,"asc","asc",356854569),null], null), null),order_STAR_))?order_STAR_:new cljs.core.Keyword(null,"desc","desc",2093485764));
var comp = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(order,new cljs.core.Keyword(null,"desc","desc",2093485764)))?(function (p1__103637_SHARP_,p2__103636_SHARP_){
if((p2__103636_SHARP_ == null)){
return true;
} else {
return (p1__103637_SHARP_ >= p2__103636_SHARP_);
}
}):(function (p1__103639_SHARP_,p2__103640_SHARP_){
if((p1__103639_SHARP_ == null)){
return true;
} else {
return (p1__103639_SHARP_ <= p2__103640_SHARP_);
}
}));
cljs.core.reset_BANG_(sort_by_,(function frontend$db$query_dsl$build_sort_by_$_sort_results(result,property_val_fn){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (p1__103641_SHARP_){
var G__103645 = cljs.core.first(p1__103641_SHARP_);
var G__103646 = k;
return (property_val_fn.cljs$core$IFn$_invoke$arity$2 ? property_val_fn.cljs$core$IFn$_invoke$arity$2(G__103645,G__103646) : property_val_fn.call(null,G__103645,G__103646));
}),comp,result);
}));

return cljs.core.PersistentArrayMap.EMPTY;
});
frontend.db.query_dsl.build_page = (function frontend$db$query_dsl$build_page(e){
var page_name = logseq.common.util.page_ref.get_page_name_BANG_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.rest(e))));
var page_name__$1 = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"page","page",-1805363372,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,page_name__$1,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397)], null)], null);
});
frontend.db.query_dsl.build_namespace = (function frontend$db$query_dsl$build_namespace(e){
var page_name = logseq.common.util.page_ref.get_page_name_BANG_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.rest(e))));
var page = (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name));
if(clojure.string.blank_QMARK_(page)){
return null;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"namespace","namespace",1263021155,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),(new cljs.core.List(null,page,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespace","namespace",-377510372)], null)], null);
}
});
frontend.db.query_dsl.build_page_ref = (function frontend$db$query_dsl$build_page_ref(e){
var page_name = (function (){var G__103649 = logseq.common.util.page_ref.get_page_name_BANG_(e);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__103649) : frontend.util.page_name_sanity_lc.call(null,G__103649));
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"page-ref","page-ref",593400376,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,page_name,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)], null)], null);
});
frontend.db.query_dsl.build_block_content = (function frontend$db$query_dsl$build_block_content(e){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),(new cljs.core.List(null,new cljs.core.Symbol(null,"block-content","block-content",2117451217,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),(new cljs.core.List(null,e,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"rules","rules",1198912366),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-content","block-content",476919690)], null)], null);
});
frontend.db.query_dsl.datalog_clause_QMARK_ = (function frontend$db$query_dsl$datalog_clause_QMARK_(e){
return ((cljs.core.coll_QMARK_(e)) && (((cljs.core.list_QMARK_(cljs.core.first(e))) || ((((cljs.core.count(e) >= (2))) && (((clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(e)),"?")) || (cljs.core.list_QMARK_(cljs.core.first(e))))))))));
});
frontend.db.query_dsl.build_file_query = (function frontend$db$query_dsl$build_file_query(e,fe,p__103650){
var map__103651 = p__103650;
var map__103651__$1 = cljs.core.__destructure_map(map__103651);
var sort_by = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103651__$1,new cljs.core.Keyword(null,"sort-by","sort-by",-322599303));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"namespace","namespace",1263021155,null),fe)){
return frontend.db.query_dsl.build_namespace(e);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"page-property","page-property",1223486862,null),fe)){
return frontend.db.query_dsl.build_page_property(e);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"page-tags","page-tags",631095502,null),fe)){
return frontend.db.query_dsl.build_page_tags(e);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"all-page-tags","all-page-tags",-118720438,null),fe)){
return frontend.db.query_dsl.build_all_page_tags();
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"sort-by","sort-by",1317932224,null),fe)){
return frontend.db.query_dsl.build_sort_by(e,sort_by);
} else {
return null;
}
}
}
}
}
});
/**
 * This fn converts a form/list in a query e.g. `(operator arg1 arg2)` to its datalog
 *   equivalent. This fn is called recursively on sublists for boolean operators
 *   `and`, `or` and `not`. This fn should return a map with :query and :rules or nil.
 * 
 * Some bindings in this fn:
 * 
 * * e - the list being processed
 * * fe - the query operator e.g. `property`
 */
frontend.db.query_dsl.build_query = (function frontend$db$query_dsl$build_query(var_args){
var G__103655 = arguments.length;
switch (G__103655) {
case 2:
return frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$2 = (function (e,env){
return frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$3(e,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"vars","vars",-2046957217),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY)),(0));
}));

(frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$3 = (function (e,p__103660,level){
var map__103661 = p__103660;
var map__103661__$1 = cljs.core.__destructure_map(map__103661);
var env = map__103661__$1;
var blocks_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__103661__$1,new cljs.core.Keyword(null,"blocks?","blocks?",58578620),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null));
var sample = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103661__$1,new cljs.core.Keyword(null,"sample","sample",79023601));
var fe = cljs.core.first(e);
var fe__$1 = (cljs.core.truth_(fe)?((cljs.core.list_QMARK_(fe))?fe:(((((fe instanceof cljs.core.Symbol)) || ((fe instanceof cljs.core.Keyword))))?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(cljs.core.name(fe))):clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(fe))
)):null);
var page_ref_QMARK_ = logseq.common.util.page_ref.page_ref_QMARK_(e);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876).cljs$core$IFn$_invoke$arity$1(env);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((((page_ref_QMARK_) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"page-tags","page-tags",631095502,null),null,new cljs.core.Symbol(null,"page-property","page-property",1223486862,null),null], null), null),new cljs.core.Keyword(null,"current-filter","current-filter",1519815247).cljs$core$IFn$_invoke$arity$1(env))))))) || (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Symbol(null,"between","between",-1523336493,null),null,new cljs.core.Symbol(null,"todo","todo",594088957,null),null,new cljs.core.Symbol(null,"priority","priority",-1223342054,null),null,new cljs.core.Symbol(null,"task","task",163923534,null),null,new cljs.core.Symbol(null,"private-property","private-property",-1573656708,null),null,new cljs.core.Symbol(null,"property","property",526253295,null),null,new cljs.core.Symbol(null,"page","page",-1805363372,null),null], null), null),fe__$1)) || ((((!(page_ref_QMARK_))) && (typeof e === 'string'))))));
}
})())){
cljs.core.reset_BANG_(blocks_QMARK_,true);
} else {
}

if((e == null)){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876).cljs$core$IFn$_invoke$arity$1(env);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.query_dsl.datalog_clause_QMARK_(e);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e], null),new cljs.core.Keyword(null,"rules","rules",1198912366),cljs.core.PersistentVector.EMPTY], null);
} else {
if(page_ref_QMARK_){
return frontend.db.query_dsl.build_page_ref(e);
} else {
if(typeof e === 'string'){
return frontend.db.query_dsl.build_block_content(e);
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Symbol(null,"and","and",668631710,null),null,new cljs.core.Symbol(null,"not","not",1044554643,null),null,new cljs.core.Symbol(null,"or","or",1876275696,null),null], null), null),fe__$1)){
return frontend.db.query_dsl.build_and_or_not(e,env,level,fe__$1);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"between","between",-1523336493,null),fe__$1)){
return frontend.db.query_dsl.build_between(e,env);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"property","property",526253295,null),fe__$1)){
return frontend.db.query_dsl.build_property(e,env);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"private-property","private-property",-1573656708,null),fe__$1)){
return frontend.db.query_dsl.build_property(e,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"private-property?","private-property?",321853022),true));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"todo","todo",594088957,null),fe__$1)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"task","task",163923534,null),fe__$1)))){
return frontend.db.query_dsl.build_task(e,env);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"priority","priority",-1223342054,null),fe__$1)){
return frontend.db.query_dsl.build_priority(e,env);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"page","page",-1805363372,null),fe__$1)){
return frontend.db.query_dsl.build_page(e);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"sample","sample",1719555128,null),fe__$1)){
return frontend.db.query_dsl.build_sample(e,sample);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"tags","tags",-883016792,null),fe__$1)){
return frontend.db.query_dsl.build_tags(e,env);
} else {
if(cljs.core.not(new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876).cljs$core$IFn$_invoke$arity$1(env))){
return frontend.db.query_dsl.build_file_query(e,fe__$1,env);
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
}
}
}
}
}
}));

(frontend.db.query_dsl.build_query.cljs$lang$maxFixedArity = 3);

if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.query_dsl !== 'undefined') && (typeof frontend.db.query_dsl.tag_placeholder !== 'undefined')){
} else {
frontend.db.query_dsl.tag_placeholder = "~~~tag-placeholder~~~";
}
frontend.db.query_dsl.pre_transform = (function frontend$db$query_dsl$pre_transform(s){
if(logseq.common.util.wrapped_by_quotes_QMARK_(s)){
return s;
} else {
var quoted_page_ref = (function (matches){
var match_SINGLEQUOTE_ = clojure.string.replace(cljs.core.second(matches),"#",frontend.db.query_dsl.tag_placeholder);
return ["\"",logseq.common.util.page_ref.left_brackets,match_SINGLEQUOTE_,logseq.common.util.page_ref.right_brackets,"\""].join('');
});
var G__103664 = s;
var G__103664__$1 = (((G__103664 == null))?null:clojure.string.replace(G__103664,/\"?\[\[(.*?)\]\]\"?/,quoted_page_ref));
var G__103664__$2 = (((G__103664__$1 == null))?null:clojure.string.replace(G__103664__$1,frontend.util.text.between_re,(function (p__103665){
var vec__103666 = p__103665;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103666,(0),null);
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103666,(1),null);
var G__103669 = "(between %s)";
var G__103670 = clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x__$1){
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["-",null,"+",null], null), null),cljs.core.first(x__$1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (function (){var G__103671 = /\d/;
var G__103672 = cljs.core.first(x__$1);
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__103671,G__103672) : frontend.util.safe_re_find.call(null,G__103671,G__103672));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.some((function (p1__103663_SHARP_){
return clojure.string.ends_with_QMARK_(x__$1,p1__103663_SHARP_);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["y","m","d","h","min"], null));
} else {
return and__5000__auto__;
}
}
})())){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.name(x__$1));
} else {
return x__$1;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,clojure.string.split.cljs$core$IFn$_invoke$arity$2(x,/ /))));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__103669,G__103670) : frontend.util.format.call(null,G__103669,G__103670));
})));
var G__103664__$3 = (((G__103664__$2 == null))?null:clojure.string.replace(G__103664__$2,/\"[^\"]+\"/,(function (s__$1){
return clojure.string.replace(s__$1,"#",frontend.db.query_dsl.tag_placeholder);
})));
var G__103664__$4 = (((G__103664__$3 == null))?null:clojure.string.replace(G__103664__$3," #"," #tag "));
var G__103664__$5 = (((G__103664__$4 == null))?null:clojure.string.replace(G__103664__$4,/^#/,"#tag "));
if((G__103664__$5 == null)){
return null;
} else {
return clojure.string.replace(G__103664__$5,frontend.db.query_dsl.tag_placeholder,"#");
}
}
});
frontend.db.query_dsl.add_bindings_BANG_ = (function frontend$db$query_dsl$add_bindings_BANG_(q,p__103675){
var map__103676 = p__103675;
var map__103676__$1 = cljs.core.__destructure_map(map__103676);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103676__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var forms = cljs.core.set(cljs.core.flatten(q));
var syms = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"not","not",1044554643,null)], null);
var vec__103677 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(syms),forms),syms);
var b_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103677,(0),null);
var p_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103677,(1),null);
var not_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103677,(2),null);
if(cljs.core.truth_(not_QMARK_)){
if(cljs.core.truth_((function (){var and__5000__auto__ = b_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return p_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null)], null),q);
} else {
if(cljs.core.truth_(b_QMARK_)){
if(cljs.core.truth_(db_graph_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"missing?","missing?",-1710383910,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160))], null)], null),q);
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)], null),q);
}
} else {
if(cljs.core.truth_(p_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null),q);
} else {
return q;

}
}
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = b_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return p_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null)], null),q);
} else {
return q;

}
}
});
frontend.db.query_dsl.simplify_query = (function frontend$db$query_dsl$simplify_query(query){
if(typeof query === 'string'){
return query;
} else {
return clojure.walk.postwalk((function (f){
if(((cljs.core.coll_QMARK_(f)) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"and","and",668631710,null),null,new cljs.core.Symbol(null,"or","or",1876275696,null),null], null), null),cljs.core.first(f))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(f))))))){
return cljs.core.second(f);
} else {
return f;
}
}),query);
}
});
frontend.db.query_dsl.custom_readers = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"readers","readers",-2118263030),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"tag","tag",350170304,null),(function (x){
return logseq.common.util.page_ref.__GT_page_ref(x);
})], null)], null);
frontend.db.query_dsl.parse = (function frontend$db$query_dsl$parse(s,p__103682){
var map__103683 = p__103682;
var map__103683__$1 = cljs.core.__destructure_map(map__103683);
var opts = map__103683__$1;
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103683__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var cards_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103683__$1,new cljs.core.Keyword(null,"cards?","cards?",1232384109));
if(((typeof s === 'string') && ((!(clojure.string.blank_QMARK_(s)))))){
var s__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",cljs.core.first(s)))?logseq.common.util.page_ref.__GT_page_ref(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1))):s);
var form = (function (){var G__103685 = s__$1;
var G__103685__$1 = (((G__103685 == null))?null:frontend.db.query_dsl.pre_transform(G__103685));
if((G__103685__$1 == null)){
return null;
} else {
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$2(frontend.db.query_dsl.custom_readers,G__103685__$1);
}
})();
var sort_by = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var blocks_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var sample = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var form__$1 = frontend.db.query_dsl.simplify_query(form);
var map__103684 = (cljs.core.truth_(form__$1)?frontend.db.query_dsl.build_query.cljs$core$IFn$_invoke$arity$2(form__$1,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"sort-by","sort-by",-322599303),sort_by,new cljs.core.Keyword(null,"blocks?","blocks?",58578620),blocks_QMARK_,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_graph_QMARK_,new cljs.core.Keyword(null,"sample","sample",79023601),sample,new cljs.core.Keyword(null,"cards?","cards?",1232384109),cards_QMARK_], null)):null);
var map__103684__$1 = cljs.core.__destructure_map(map__103684);
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103684__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var rules = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103684__$1,new cljs.core.Keyword(null,"rules","rules",1198912366));
var result_SINGLEQUOTE_ = ((cljs.core.seq(result))?(function (){var key = ((cljs.core.coll_QMARK_(cljs.core.first(result)))?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.ffirst(result)):cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(result)));
return frontend.db.query_dsl.add_bindings_BANG_(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,new cljs.core.Keyword(null,"and","and",-971899817)))?cljs.core.rest(result):result),opts);
})():null);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"query","query",-1288509510),result_SINGLEQUOTE_,new cljs.core.Keyword(null,"rules","rules",1198912366),(cljs.core.truth_(db_graph_QMARK_)?logseq.db.frontend.rules.extract_rules.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.rules.db_query_dsl_rules,rules,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"deps","deps",1883360319),logseq.db.frontend.rules.rules_dependencies], null)], 0)):cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.db.file_based.rules.query_dsl_rules,rules)),new cljs.core.Keyword(null,"sort-by","sort-by",-322599303),cljs.core.deref(sort_by),new cljs.core.Keyword(null,"blocks?","blocks?",58578620),cljs.core.boolean$(cljs.core.deref(blocks_QMARK_)),new cljs.core.Keyword(null,"sample","sample",79023601),sample], null);
} else {
return null;
}
});
frontend.db.query_dsl.query_wrapper = (function frontend$db$query_dsl$query_wrapper(where,p__103688){
var map__103689 = p__103688;
var map__103689__$1 = cljs.core.__destructure_map(map__103689);
var blocks_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103689__$1,new cljs.core.Keyword(null,"blocks?","blocks?",58578620));
var block_attrs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103689__$1,new cljs.core.Keyword(null,"block-attrs","block-attrs",-451459398));
var block_attrs__$1 = (function (){var or__5002__auto__ = block_attrs;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.butlast(frontend.db.file_based.model.file_graph_block_attrs);
}
})();
var q = (cljs.core.truth_(blocks_QMARK_)?cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Keyword(null,"find","find",496279456),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"pull","pull",779986722,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,block_attrs__$1,null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"in","in",-1531184865),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"$","$",-1580747756,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"%","%",-950237169,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"where","where",-2044795965),null,(1),null))], 0))))):new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965)], null));
if(cljs.core.coll_QMARK_(cljs.core.first(where))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.conj,q,where);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(q,where);
}
});
frontend.db.query_dsl.parse_query = (function frontend$db$query_dsl$parse_query(var_args){
var G__103691 = arguments.length;
switch (G__103691) {
case 1:
return frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$1 = (function (q){
return frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$2(q,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$2 = (function (q,options){
var q_SINGLEQUOTE_ = frontend.template.resolve_dynamic_template_BANG_(q);
return frontend.db.query_dsl.parse(q_SINGLEQUOTE_,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())], null),options], 0)));
}));

(frontend.db.query_dsl.parse_query.cljs$lang$maxFixedArity = 2);

frontend.db.query_dsl.pre_transform_query = (function frontend$db$query_dsl$pre_transform_query(q){
var q_SINGLEQUOTE_ = frontend.template.resolve_dynamic_template_BANG_(q);
return frontend.db.query_dsl.pre_transform(q_SINGLEQUOTE_);
});
/**
 * Block attributes for db graph queries
 */
frontend.db.query_dsl.db_block_attrs = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098)], null);
/**
 * Runs a dsl query with query as a string. Primary use is from '/query' or '{{query }}'
 */
frontend.db.query_dsl.query = (function frontend$db$query_dsl$query(var_args){
var G__103699 = arguments.length;
switch (G__103699) {
case 2:
return frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$2 = (function (repo,query_string){
return frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$3(repo,query_string,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$3 = (function (repo,query_string,query_opts){
if(((typeof query_string === 'string') && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("\"\"",query_string)))){
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var map__103700 = frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$2(query_string,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cards?","cards?",1232384109),new cljs.core.Keyword(null,"cards?","cards?",1232384109).cljs$core$IFn$_invoke$arity$1(query_opts)], null));
var map__103700__$1 = cljs.core.__destructure_map(map__103700);
var query_STAR_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103700__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var rules = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103700__$1,new cljs.core.Keyword(null,"rules","rules",1198912366));
var sort_by = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103700__$1,new cljs.core.Keyword(null,"sort-by","sort-by",-322599303));
var blocks_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103700__$1,new cljs.core.Keyword(null,"blocks?","blocks?",58578620));
var sample = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103700__$1,new cljs.core.Keyword(null,"sample","sample",79023601));
var query_STAR___$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"cards?","cards?",1232384109).cljs$core$IFn$_invoke$arity$1(query_opts))?(function (){var card_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)));
var G__103701 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),card_id], null)], null);
var G__103702 = ((cljs.core.coll_QMARK_(cljs.core.first(query_STAR_)))?query_STAR_:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [query_STAR_], null));
return (frontend.util.concat_without_nil.cljs$core$IFn$_invoke$arity$2 ? frontend.util.concat_without_nil.cljs$core$IFn$_invoke$arity$2(G__103701,G__103702) : frontend.util.concat_without_nil.call(null,G__103701,G__103702));
})():query_STAR_);
var blocks_QMARK___$1 = ((db_graph_QMARK_)?true:blocks_QMARK_);
var temp__5804__auto__ = (function (){var G__103703 = query_STAR___$1;
if((G__103703 == null)){
return null;
} else {
return frontend.db.query_dsl.query_wrapper(G__103703,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks?","blocks?",58578620),blocks_QMARK___$1,new cljs.core.Keyword(null,"block-attrs","block-attrs",-451459398),((db_graph_QMARK_)?frontend.db.query_dsl.db_block_attrs:null)], null));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var query_SINGLEQUOTE_ = temp__5804__auto__;
var random_samples = (cljs.core.truth_(cljs.core.deref(sample))?(function (col){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(sample),cljs.core.shuffle(col));
}):cljs.core.identity);
var sort_by_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = sort_by;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
} else {
return and__5000__auto__;
}
})())?(function (p1__103697_SHARP_){
var G__103704 = p1__103697_SHARP_;
var G__103705 = (function (m,prop){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),prop], null));
});
return (sort_by.cljs$core$IFn$_invoke$arity$2 ? sort_by.cljs$core$IFn$_invoke$arity$2(G__103704,G__103705) : sort_by.call(null,G__103704,G__103705));
}):cljs.core.identity);
var transform_fn = cljs.core.comp.cljs$core$IFn$_invoke$arity$2(sort_by_SINGLEQUOTE_,random_samples);
return frontend.db.query_react.react_query(repo,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"query","query",-1288509510),query_SINGLEQUOTE_,new cljs.core.Keyword(null,"query-string","query-string",-1018845061),query_string,new cljs.core.Keyword(null,"rules","rules",1198912366),rules], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),transform_fn], null),query_opts], 0)));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.query_dsl.query.cljs$lang$maxFixedArity = 3);

/**
 * Runs a dsl query with query as a seq. Primary use is from advanced query
 */
frontend.db.query_dsl.custom_query = (function frontend$db$query_dsl$custom_query(repo,query_m,query_opts){
if(cljs.core.seq(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_m))){
var query_string = frontend.template.resolve_dynamic_template_BANG_(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_m)], 0)));
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var map__103708 = frontend.db.query_dsl.parse(query_string,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_graph_QMARK_], null));
var map__103708__$1 = cljs.core.__destructure_map(map__103708);
var query_STAR_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103708__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var sort_by = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103708__$1,new cljs.core.Keyword(null,"sort-by","sort-by",-322599303));
var blocks_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103708__$1,new cljs.core.Keyword(null,"blocks?","blocks?",58578620));
var rules = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103708__$1,new cljs.core.Keyword(null,"rules","rules",1198912366));
var temp__5804__auto__ = (function (){var G__103709 = query_STAR_;
if((G__103709 == null)){
return null;
} else {
return frontend.db.query_dsl.query_wrapper(G__103709,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks?","blocks?",58578620),blocks_QMARK_,new cljs.core.Keyword(null,"block-attrs","block-attrs",-451459398),((db_graph_QMARK_)?frontend.db.query_dsl.db_block_attrs:null)], null));
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var query_SINGLEQUOTE_ = temp__5804__auto__;
return frontend.db.query_react.react_query(repo,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_m,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),query_SINGLEQUOTE_,new cljs.core.Keyword(null,"rules","rules",1198912366),rules], null)], 0)),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_opts,(cljs.core.truth_(sort_by)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),((db_graph_QMARK_)?cljs.core.identity:(function (p1__103707_SHARP_){
var G__103710 = p1__103707_SHARP_;
var G__103711 = (function (m,prop){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),prop], null));
});
return (sort_by.cljs$core$IFn$_invoke$arity$2 ? sort_by.cljs$core$IFn$_invoke$arity$2(G__103710,G__103711) : sort_by.call(null,G__103710,G__103711));
}))], null):null)], 0)));
} else {
return null;
}
} else {
return null;
}
});
frontend.db.query_dsl.query_contains_filter_QMARK_ = (function frontend$db$query_dsl$query_contains_filter_QMARK_(query_SINGLEQUOTE_,filter_name){
return clojure.string.includes_QMARK_(query_SINGLEQUOTE_,["(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(filter_name)].join(''));
});

//# sourceMappingURL=frontend.db.query_dsl.js.map
