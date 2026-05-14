goog.provide('open_spaced_repetition.cljc_fsrs.card');
/**
 * Update the total number of times this card has been repeated
 */
open_spaced_repetition.cljc_fsrs.card.update_reps = (function open_spaced_repetition$cljc_fsrs$card$update_reps(card){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(card,new cljs.core.Keyword(null,"reps","reps",1391310856),cljs.core.inc);
});
/**
 * How long has it been since we repeated this card?
 */
open_spaced_repetition.cljc_fsrs.card.update_elapsed_days = (function open_spaced_repetition$cljc_fsrs$card$update_elapsed_days(card,repeat_time_instant){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(card,new cljs.core.Keyword(null,"elapsed-days","elapsed-days",1972412563),tick.core.days(tick.core.between.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113).cljs$core$IFn$_invoke$arity$1(card),repeat_time_instant)));
});
/**
 * Update the last time we studied this card
 */
open_spaced_repetition.cljc_fsrs.card.update_last_repeat_time = (function open_spaced_repetition$cljc_fsrs$card$update_last_repeat_time(card,repeat_time_instant){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(card,new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113),repeat_time_instant);
});
/**
 * Repeat this card. Return the `scheduler` datastructure for every
 *   possible future state of this card.
 */
open_spaced_repetition.cljc_fsrs.card.repeat_card_BANG_ = (function open_spaced_repetition$cljc_fsrs$card$repeat_card_BANG_(card,repeat_time_instant,params){
return open_spaced_repetition.cljc_fsrs.scheduler.next_repeat_schedule(open_spaced_repetition.cljc_fsrs.card.update_last_repeat_time(open_spaced_repetition.cljc_fsrs.card.update_elapsed_days(open_spaced_repetition.cljc_fsrs.card.update_reps(card),repeat_time_instant),repeat_time_instant),repeat_time_instant,params);
});
/**
 * Return a brand new empty card, with empty values
 */
open_spaced_repetition.cljc_fsrs.card.new_card_BANG_ = (function open_spaced_repetition$cljc_fsrs$card$new_card_BANG_(creation_time_instant){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"lapses","lapses",1460246370),new cljs.core.Keyword(null,"stability","stability",1733225509),new cljs.core.Keyword(null,"difficulty","difficulty",755680807),new cljs.core.Keyword(null,"last-repeat","last-repeat",-1968073113),new cljs.core.Keyword(null,"reps","reps",1391310856),new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"due","due",-1754731313),new cljs.core.Keyword(null,"elapsed-days","elapsed-days",1972412563),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)],[(0),(0),(0),creation_time_instant,(0),new cljs.core.Keyword(null,"new","new",-2085437848),creation_time_instant,(0),(0)]);
});

//# sourceMappingURL=open_spaced_repetition.cljc_fsrs.card.js.map
