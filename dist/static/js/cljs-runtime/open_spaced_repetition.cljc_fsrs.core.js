goog.provide('open_spaced_repetition.cljc_fsrs.core');
open_spaced_repetition.cljc_fsrs.core.default_params = open_spaced_repetition.cljc_fsrs.parameters.default_params;
/**
 * Return a brand new empty card, with empty values
 */
open_spaced_repetition.cljc_fsrs.core.new_card_BANG_ = (function open_spaced_repetition$cljc_fsrs$core$new_card_BANG_(){
return open_spaced_repetition.cljc_fsrs.card.new_card_BANG_(tick.core.now());
});
/**
 * We have repeated the `card` according to previous instructions. We
 *   have a new `rating` for the card. Generate the new state of the card
 *   after the rating.
 */
open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_ = (function open_spaced_repetition$cljc_fsrs$core$repeat_card_BANG_(var_args){
var G__125420 = arguments.length;
switch (G__125420) {
case 2:
return open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (card,rating){
return open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$3(card,rating,open_spaced_repetition.cljc_fsrs.core.default_params);
}));

(open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (card,rating,params){
open_spaced_repetition.cljc_fsrs.parameters.assert_rating(rating);

open_spaced_repetition.cljc_fsrs.parameters.assert_weights(new cljs.core.Keyword(null,"weights","weights",-1097626197).cljs$core$IFn$_invoke$arity$1(params));

return open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$4(card,rating,tick.core.now(),params);
}));

(open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (card,rating,repeat_time_instant,params){
var G__125421 = open_spaced_repetition.cljc_fsrs.card.repeat_card_BANG_(card,repeat_time_instant,params);
return (rating.cljs$core$IFn$_invoke$arity$1 ? rating.cljs$core$IFn$_invoke$arity$1(G__125421) : rating.call(null,G__125421));
}));

(open_spaced_repetition.cljc_fsrs.core.repeat_card_BANG_.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=open_spaced_repetition.cljc_fsrs.core.js.map
