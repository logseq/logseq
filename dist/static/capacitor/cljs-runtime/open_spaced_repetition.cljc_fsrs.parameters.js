goog.provide('open_spaced_repetition.cljc_fsrs.parameters');
/**
 * Mapping from rating keyword to it's index in the `weights`
 */
open_spaced_repetition.cljc_fsrs.parameters.__GT_rating = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"again","again",1312602037),(1),new cljs.core.Keyword(null,"hard","hard",2068420191),(2),new cljs.core.Keyword(null,"good","good",511701169),(3),new cljs.core.Keyword(null,"easy","easy",315769928),(4)], null);
/**
 * The state of the card we are studying.
 */
open_spaced_repetition.cljc_fsrs.parameters.state = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"new","new",-2085437848),null,new cljs.core.Keyword(null,"learning","learning",612366512),null,new cljs.core.Keyword(null,"relearning","relearning",-395034959),null,new cljs.core.Keyword(null,"review","review",1101692435),null], null), null);
/**
 * The default parameters we use with FSRS.
 */
open_spaced_repetition.cljc_fsrs.parameters.default_params = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"weights","weights",-1097626197),new cljs.core.PersistentVector(null, 17, 5, cljs.core.PersistentVector.EMPTY_NODE, [0.4,0.6,2.4,5.8,4.93,0.94,0.86,0.01,1.49,0.14,0.94,2.18,0.05,0.34,1.26,0.29,2.61], null),new cljs.core.Keyword(null,"request-retention","request-retention",1139336831),0.9,new cljs.core.Keyword(null,"maximum-interval","maximum-interval",76033288),(36500)], null);
/**
 * Ensure that weights are meaningful
 */
open_spaced_repetition.cljc_fsrs.parameters.assert_weights = (function open_spaced_repetition$cljc_fsrs$parameters$assert_weights(weights){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(weights),cljs.core.count(new cljs.core.Keyword(null,"weights","weights",-1097626197).cljs$core$IFn$_invoke$arity$1(open_spaced_repetition.cljc_fsrs.parameters.default_params)))){
return null;
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.string.format("Given weights %s do not have enough parameters.",weights)),"\n","(= (count weights) (count (:weights default-params)))"].join('')));
}
});
/**
 * Ensure that rating is valid
 */
open_spaced_repetition.cljc_fsrs.parameters.assert_rating = (function open_spaced_repetition$cljc_fsrs$parameters$assert_rating(rating){
if(cljs.core.truth_((open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1 ? open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1(rating) : open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.call(null,rating)))){
return null;
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.string.format("Given rating %s does not exist",rating)),"\n","(->rating rating)"].join('')));
}
});
/**
 * Give the initial value of difficulty for given `rating`
 */
open_spaced_repetition.cljc_fsrs.parameters.init_difficulty = (function open_spaced_repetition$cljc_fsrs$parameters$init_difficulty(weights,rating){
open_spaced_repetition.cljc_fsrs.parameters.assert_weights(weights);

open_spaced_repetition.cljc_fsrs.parameters.assert_rating(rating);

return (cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(4)) - (cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(5)) * ((open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1 ? open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1(rating) : open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.call(null,rating)) - (3))));
});
/**
 * Give the initial value of stability for given `rating`
 */
open_spaced_repetition.cljc_fsrs.parameters.init_stability = (function open_spaced_repetition$cljc_fsrs$parameters$init_stability(weights,rating){
open_spaced_repetition.cljc_fsrs.parameters.assert_weights(weights);

open_spaced_repetition.cljc_fsrs.parameters.assert_rating(rating);

var x__5087__auto__ = 0.1;
var y__5088__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,((open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1 ? open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1(rating) : open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.call(null,rating)) - (1)));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
});
/**
 * Calculate decay in recall over time
 */
open_spaced_repetition.cljc_fsrs.parameters.calculate_retrievability = (function open_spaced_repetition$cljc_fsrs$parameters$calculate_retrievability(elapsed_days,stability){
return Math.pow(((1) + (elapsed_days / (stability * (9)))),(-1));
});
/**
 * Keep difficulty between 1 and 10
 */
open_spaced_repetition.cljc_fsrs.parameters.constrain_difficulty = (function open_spaced_repetition$cljc_fsrs$parameters$constrain_difficulty(difficulty){
var x__5090__auto__ = (function (){var x__5087__auto__ = difficulty;
var y__5088__auto__ = (1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var y__5091__auto__ = (10);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
});
/**
 * Ensure that we do not get stuck in easy hell
 */
open_spaced_repetition.cljc_fsrs.parameters.mean_reversion = (function open_spaced_repetition$cljc_fsrs$parameters$mean_reversion(current_difficulty,weights){
return ((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(7)) * cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(4))) + (((1) - cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(7))) * current_difficulty));
});
/**
 * Given `difficulty` and `rating`, calculate the new diff
 */
open_spaced_repetition.cljc_fsrs.parameters.next_difficulty = (function open_spaced_repetition$cljc_fsrs$parameters$next_difficulty(difficulty,rating,weights){
var new_diff = (difficulty - (cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(6)) * ((open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1 ? open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.cljs$core$IFn$_invoke$arity$1(rating) : open_spaced_repetition.cljc_fsrs.parameters.__GT_rating.call(null,rating)) - (3))));
return open_spaced_repetition.cljc_fsrs.parameters.constrain_difficulty(open_spaced_repetition.cljc_fsrs.parameters.mean_reversion(new_diff,weights));
});
/**
 * Given current D, S, R and rating, find the new stability
 */
open_spaced_repetition.cljc_fsrs.parameters.next_stability = (function open_spaced_repetition$cljc_fsrs$parameters$next_stability(difficulty,stability,retrievability,rating,weights){
var recall_factor = (((Math.exp(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(8))) * ((11) - difficulty)) * Math.pow(stability,(- cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(9))))) * (Math.exp((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(10)) * ((1) - retrievability))) - (1)));
var G__113156 = rating;
var G__113156__$1 = (((G__113156 instanceof cljs.core.Keyword))?G__113156.fqn:null);
switch (G__113156__$1) {
case "again":
var x__5090__auto__ = (((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(11)) * Math.pow(difficulty,(- cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(12))))) * (Math.pow(((1) + stability),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(13))) - (1))) * Math.exp((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(14)) * ((1) - retrievability))));
var y__5091__auto__ = stability;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);

break;
case "hard":
return (stability * ((1) + (recall_factor * cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(15)))));

break;
case "good":
return (stability * ((1) + recall_factor));

break;
case "easy":
return (stability * ((1) + (recall_factor * cljs.core.nth.cljs$core$IFn$_invoke$arity$2(weights,(16)))));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__113156__$1)].join('')));

}
});
/**
 * Given the `stability` of item, when should we revisit it?
 */
open_spaced_repetition.cljc_fsrs.parameters.next_interval = (function open_spaced_repetition$cljc_fsrs$parameters$next_interval(p__113161,stability){
var map__113162 = p__113161;
var map__113162__$1 = cljs.core.__destructure_map(map__113162);
var maximum_interval = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113162__$1,new cljs.core.Keyword(null,"maximum-interval","maximum-interval",76033288));
var request_retention = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113162__$1,new cljs.core.Keyword(null,"request-retention","request-retention",1139336831));
var new_interval = ((stability * (9)) * (((1) / request_retention) - (1)));
var x__5087__auto__ = (function (){var x__5090__auto__ = Math.round(new_interval);
var y__5091__auto__ = maximum_interval;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var y__5088__auto__ = (1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
});

//# sourceMappingURL=open_spaced_repetition.cljc_fsrs.parameters.js.map
