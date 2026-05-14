goog.provide('frontend.components.select');
frontend.components.select.render_item = rum.core.lazy_build(rum.core.build_defc,(function (result,chosen_QMARK_,multiple_choices_QMARK_,_STAR_selected_choices){
var value = ((cljs.core.map_QMARK_(result))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(result);
}
})():result);
var header = new cljs.core.Keyword(null,"header","header",119441134).cljs$core$IFn$_invoke$arity$1(result);
var selected_choices = rum.core.react(_STAR_selected_choices);
var row = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.justify-between.w-full","div.flex.flex-row.justify-between.w-full",1036490182),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(chosen_QMARK_)?"chosen":null),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop_propagation], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_(multiple_choices_QMARK_)?frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.boolean$((function (){var G__110340 = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(result);
return (selected_choices.cljs$core$IFn$_invoke$arity$1 ? selected_choices.cljs$core$IFn$_invoke$arity$1(G__110340) : selected_choices.call(null,G__110340));
})()),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return e.preventDefault();
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181).cljs$core$IFn$_invoke$arity$1(result)], null)):null),value], null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(result);
if(and__5000__auto__){
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(result);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tip.flex","div.tip.flex",-43150018),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.opacity-20.bg-transparent","code.opacity-20.bg-transparent",-2039164517),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(result)], null)], null):null)], null);
if(cljs.core.truth_(header)){
var attrs110377 = header;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs110377))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-1"], null)], null),attrs110377], 0))):{'className':"flex flex-col gap-1"}),((cljs.core.map_QMARK_(attrs110377))?[daiquiri.interpreter.interpret(row)]:[daiquiri.interpreter.interpret(attrs110377),daiquiri.interpreter.interpret(row)]));
} else {
return daiquiri.interpreter.interpret(row);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.select/render-item");
frontend.components.select.search_input = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_input,p__110400){
var map__110401 = p__110400;
var map__110401__$1 = cljs.core.__destructure_map(map__110401);
var prompt_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110401__$1,new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683));
var input_default_placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110401__$1,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250));
var input_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110401__$1,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135));
var on_input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110401__$1,new cljs.core.Keyword(null,"on-input","on-input",-267523366));
var vec__110403 = (function (){var G__110406 = cljs.core.deref(_STAR_input);
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__110406) : logseq.shui.hooks.use_state.call(null,G__110406));
})();
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__110403,(0),null);
var set_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__110403,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
cljs.core.reset_BANG_(_STAR_input,input);

if(cljs.core.fn_QMARK_(on_input)){
return (on_input.cljs$core$IFn$_invoke$arity$1 ? on_input.cljs$core$IFn$_invoke$arity$1(input) : on_input.call(null,input));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.hooks.use_debounced_value(input,(100))], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",cljs.core.deref(_STAR_input))){
return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.hooks.use_debounced_value(cljs.core.deref(_STAR_input),(100))], null));

return daiquiri.core.create_element("div",{'style':{'marginBottom':"-2px"},'className':"input-wrap"},[(function (){var attrs110409 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"class","class",-2030961996),"!p-1.5",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var or__5002__auto__ = input_default_placeholder;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([prompt_key], 0));
}
})(),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"value","value",305978217),input,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var v = frontend.util.evalue(e);
return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1(v) : set_input_BANG_.call(null,v));
})], null),input_opts], 0));
return daiquiri.core.create_element("input",((cljs.core.map_QMARK_(attrs110409))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__select-input","w-full"], null)], null),attrs110409], 0))):{'className':"cp__select-input w-full"}),((cljs.core.map_QMARK_(attrs110409))?null:[daiquiri.interpreter.interpret(attrs110409)]));
})()]);
}),null,"frontend.components.select/search-input");
/**
 * Provides a select dropdown powered by a fuzzy search. Takes the following options:
 * * :items - Vec of things to select from. Assumes a vec of maps with :value key by default. Required option
 * * :limit - Limit number of items to search. Default is 100
 * * :on-chosen - Optional fn to perform an action with chosen item
 * * :extract-fn - Fn applied to each item during fuzzy search. Default is :value
 * * :extract-chosen-fn - Fn applied to each item when choosing an item. Default is identity
 * * :show-new-when-not-exact-match? - Boolean to allow new values be entered. Default is false
 * * :exact-match-exclude-items - A set of strings that can't be added as a new item. Default is #{}
 * * :transform-fn - Optional fn to transform search results given results and current input
 * * :new-case-sensitive? - Boolean to allow new values to be case sensitive
 * * :loading? - whether it's loading the items
 * TODO: Describe more options
 */
frontend.components.select.select = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__110411){
var map__110412 = p__110411;
var map__110412__$1 = cljs.core.__destructure_map(map__110412);
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var on_input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"on-input","on-input",-267523366));
var empty_placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),(function (_t){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632)], null);
}));
var initial_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108),true);
var exact_match_exclude_items = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"exact-match-exclude-items","exact-match-exclude-items",-668398850),cljs.core.PersistentHashSet.EMPTY);
var prompt_key = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select","default-prompt","select/default-prompt",-657561626));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var tap__STAR_input_val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"tap-*input-val","tap-*input-val",1531539652));
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),(100));
var dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147));
var show_new_when_not_exact_match_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201));
var loading_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"loading?","loading?",1905707049));
var input_container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"input-container","input-container",-1901353206));
var item_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"item-cp","item-cp",294728683));
var new_case_sensitive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"new-case-sensitive?","new-case-sensitive?",-581012500));
var extract_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"value","value",305978217));
var input_default_placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250));
var extract_chosen_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),cljs.core.identity);
var input_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135));
var transform_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327));
var host_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"host-opts","host-opts",-933691505));
var on_apply = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"on-apply","on-apply",-1897056081));
var close_modal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__110412__$1,new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),true);
var grouped_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"grouped?","grouped?",531080948));
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110412__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var input = new cljs.core.Keyword("frontend.components.select","input","frontend.components.select/input",-1394442831).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_toggle = new cljs.core.Keyword("frontend.components.select","toggle","frontend.components.select/toggle",-791702138).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_selected_choices = new cljs.core.Keyword("frontend.components.select","selected-choices","frontend.components.select/selected-choices",-195451595).cljs$core$IFn$_invoke$arity$1(state);
var selected_choices = rum.core.react(_STAR_selected_choices);
var full_choices = (function (){var G__110413 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,items);
if(cljs.core.seq(cljs.core.deref(input))){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"clear?","clear?",1363344639),G__110413);
} else {
return G__110413;
}
})();
var search_result_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var G__110414 = (function (){var G__110415 = full_choices;
var G__110416 = cljs.core.deref(input);
var G__110417 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__110418 = limit;
var G__110419 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__110420 = extract_fn;
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(G__110415,G__110416,G__110417,G__110418,G__110419,G__110420) : frontend.search.fuzzy_search.call(null,G__110415,G__110416,G__110417,G__110418,G__110419,G__110420));
})();
if(cljs.core.fn_QMARK_(transform_fn)){
var G__110421 = G__110414;
var G__110422 = cljs.core.deref(input);
return (transform_fn.cljs$core$IFn$_invoke$arity$2 ? transform_fn.cljs$core$IFn$_invoke$arity$2(G__110421,G__110422) : transform_fn.call(null,G__110421,G__110422));
} else {
return G__110414;
}
})());
var exact_transform_fn = (cljs.core.truth_(new_case_sensitive_QMARK_)?cljs.core.identity:clojure.string.lower_case);
var exact_match_QMARK_ = cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(exact_transform_fn,cljs.core.str,extract_fn),search_result_SINGLEQUOTE_)),(function (){var G__110423 = cljs.core.deref(input);
return (exact_transform_fn.cljs$core$IFn$_invoke$arity$1 ? exact_transform_fn.cljs$core$IFn$_invoke$arity$1(G__110423) : exact_transform_fn.call(null,G__110423));
})());
var search_result_SINGLEQUOTE___$1 = (cljs.core.truth_((function (){var and__5000__auto__ = multiple_choices_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(cljs.core.deref(input))));
} else {
return and__5000__auto__;
}
})())?cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (item){
return (!(cljs.core.contains_QMARK_(selected_choices,new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(item))));
}),search_result_SINGLEQUOTE_):search_result_SINGLEQUOTE_);
var search_result = (cljs.core.truth_((function (){var and__5000__auto__ = show_new_when_not_exact_match_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(exact_match_QMARK_))) && ((((!(clojure.string.blank_QMARK_(cljs.core.deref(input))))) && (cljs.core.not((function (){var G__110425 = cljs.core.deref(input);
return (exact_match_exclude_items.cljs$core$IFn$_invoke$arity$1 ? exact_match_exclude_items.cljs$core$IFn$_invoke$arity$1(G__110425) : exact_match_exclude_items.call(null,G__110425));
})())))));
} else {
return and__5000__auto__;
}
})())?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.cons(cljs.core.first(search_result_SINGLEQUOTE___$1),cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(input),new cljs.core.Keyword(null,"label","label",1718410804),["+ New option: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(input))].join('')], null),cljs.core.rest(search_result_SINGLEQUOTE___$1)))):search_result_SINGLEQUOTE___$1);
var input_opts_SINGLEQUOTE_ = ((cljs.core.fn_QMARK_(input_opts))?(function (){var G__110426 = cljs.core.empty_QMARK_(search_result);
return (input_opts.cljs$core$IFn$_invoke$arity$1 ? input_opts.cljs$core$IFn$_invoke$arity$1(G__110426) : input_opts.call(null,G__110426));
})():input_opts);
var input_container__$1 = (function (){var or__5002__auto__ = input_container;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.components.select.search_input(input,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),prompt_key,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),input_default_placeholder,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),input_opts_SINGLEQUOTE_,new cljs.core.Keyword(null,"on-input","on-input",-267523366),on_input], null));
}
})();
var results_container_f = (function (){
if(cljs.core.truth_(loading_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-1.py-2","div.px-1.py-2",1183803022),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Loading ...")], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core.seq(search_result))?"py-1":null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.item-results-wrap","div.item-results-wrap",1314997010),frontend.ui.auto_complete(search_result,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"grouped?","grouped?",531080948),grouped_QMARK_,new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (){var or__5002__auto__ = item_cp;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (result,chosen_QMARK_){
return frontend.components.select.render_item(result,chosen_QMARK_,multiple_choices_QMARK_,_STAR_selected_choices);
});
}
})(),new cljs.core.Keyword(null,"class","class",-2030961996),"cp__select-results",new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (raw_chosen,e){
cljs.core.reset_BANG_(input,"");

var chosen = (extract_chosen_fn.cljs$core$IFn$_invoke$arity$1 ? extract_chosen_fn.cljs$core$IFn$_invoke$arity$1(raw_chosen) : extract_chosen_fn.call(null,raw_chosen));
if(cljs.core.truth_(multiple_choices_QMARK_)){
if(cljs.core.truth_((selected_choices.cljs$core$IFn$_invoke$arity$1 ? selected_choices.cljs$core$IFn$_invoke$arity$1(chosen) : selected_choices.call(null,chosen)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_selected_choices,cljs.core.disj,chosen);

if(cljs.core.truth_(on_chosen)){
var G__110427 = chosen;
var G__110428 = false;
var G__110429 = cljs.core.deref(_STAR_selected_choices);
var G__110430 = e;
return (on_chosen.cljs$core$IFn$_invoke$arity$4 ? on_chosen.cljs$core$IFn$_invoke$arity$4(G__110427,G__110428,G__110429,G__110430) : on_chosen.call(null,G__110427,G__110428,G__110429,G__110430));
} else {
return null;
}
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_selected_choices,cljs.core.conj,chosen);

if(cljs.core.truth_(on_chosen)){
var G__110431 = chosen;
var G__110432 = true;
var G__110433 = cljs.core.deref(_STAR_selected_choices);
var G__110434 = e;
return (on_chosen.cljs$core$IFn$_invoke$arity$4 ? on_chosen.cljs$core$IFn$_invoke$arity$4(G__110431,G__110432,G__110433,G__110434) : on_chosen.call(null,G__110431,G__110432,G__110433,G__110434));
} else {
return null;
}
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = close_modal_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(multiple_choices_QMARK_);
} else {
return and__5000__auto__;
}
})())){
frontend.state.close_modal_BANG_();
} else {
}

if(cljs.core.truth_(on_chosen)){
var G__110435 = chosen;
var G__110436 = true;
var G__110437 = cljs.core.deref(_STAR_selected_choices);
var G__110438 = e;
return (on_chosen.cljs$core$IFn$_invoke$arity$4 ? on_chosen.cljs$core$IFn$_invoke$arity$4(G__110435,G__110436,G__110437,G__110438) : on_chosen.call(null,G__110435,G__110436,G__110437,G__110438));
} else {
return null;
}
}
}),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),(empty_placeholder.cljs$core$IFn$_invoke$arity$1 ? empty_placeholder.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t) : empty_placeholder.call(null,frontend.context.i18n.t))], null))], null),(cljs.core.truth_((function (){var and__5000__auto__ = multiple_choices_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(on_apply);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Apply",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

if(cljs.core.truth_(cljs.core.deref(_STAR_toggle))){
var fexpr__110439_110603 = cljs.core.deref(_STAR_toggle);
(fexpr__110439_110603.cljs$core$IFn$_invoke$arity$0 ? fexpr__110439_110603.cljs$core$IFn$_invoke$arity$0() : fexpr__110439_110603.call(null));
} else {
}

(on_apply.cljs$core$IFn$_invoke$arity$1 ? on_apply.cljs$core$IFn$_invoke$arity$1(selected_choices) : on_apply.call(null,selected_choices));

if(cljs.core.truth_(close_modal_QMARK_)){
return frontend.state.close_modal_BANG_();
} else {
return null;
}
})], null)], 0))], null):null)], null);
}
});
if(cljs.core.fn_QMARK_(tap__STAR_input_val)){
(tap__STAR_input_val.cljs$core$IFn$_invoke$arity$1 ? tap__STAR_input_val.cljs$core$IFn$_invoke$arity$1(input) : tap__STAR_input_val.call(null,input));
} else {
}

var attrs110410 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"cp__select-main"], null),host_opts], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs110410))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__select"], null)], null),attrs110410], 0))):{'className':"cp__select"}),((cljs.core.map_QMARK_(attrs110410))?[(cljs.core.truth_(dropdown_QMARK_)?frontend.ui.dropdown(((cljs.core.fn_QMARK_(input_container__$1))?input_container__$1:(function (){
return input_container__$1;
})),results_container_f,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108),initial_open_QMARK_,new cljs.core.Keyword(null,"*toggle-fn","*toggle-fn",458369769),_STAR_toggle], null)):(function (){var attrs110440 = ((cljs.core.fn_QMARK_(input_container__$1))?(input_container__$1.cljs$core$IFn$_invoke$arity$0 ? input_container__$1.cljs$core$IFn$_invoke$arity$0() : input_container__$1.call(null)):input_container__$1);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs110440))?daiquiri.interpreter.element_attributes(attrs110440):null),((cljs.core.map_QMARK_(attrs110440))?[daiquiri.interpreter.interpret(results_container_f())]:[daiquiri.interpreter.interpret(attrs110440),daiquiri.interpreter.interpret(results_container_f())]));
})())]:[daiquiri.interpreter.interpret(attrs110410),(cljs.core.truth_(dropdown_QMARK_)?frontend.ui.dropdown(((cljs.core.fn_QMARK_(input_container__$1))?input_container__$1:(function (){
return input_container__$1;
})),results_container_f,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108),initial_open_QMARK_,new cljs.core.Keyword(null,"*toggle-fn","*toggle-fn",458369769),_STAR_toggle], null)):(function (){var attrs110441 = ((cljs.core.fn_QMARK_(input_container__$1))?(input_container__$1.cljs$core$IFn$_invoke$arity$0 ? input_container__$1.cljs$core$IFn$_invoke$arity$0() : input_container__$1.call(null)):input_container__$1);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs110441))?daiquiri.interpreter.element_attributes(attrs110441):null),((cljs.core.map_QMARK_(attrs110441))?[daiquiri.interpreter.interpret(results_container_f())]:[daiquiri.interpreter.interpret(attrs110441),daiquiri.interpreter.interpret(results_container_f())]));
})())]));
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.modules.shortcut.core.disable_all_shortcuts,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.select","input","frontend.components.select/input",-1394442831)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.select","toggle","frontend.components.select/toggle",-791702138)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var choices = new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.select","selected-choices","frontend.components.select/selected-choices",-195451595),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.set(choices)));
}),new cljs.core.Keyword(null,"will-remount","will-remount",-141604325),(function (_old_state,new_state){
var choices = cljs.core.set(new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state))));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(choices,cljs.core.deref(new cljs.core.Keyword("frontend.components.select","selected-choices","frontend.components.select/selected-choices",-195451595).cljs$core$IFn$_invoke$arity$1(new_state)))){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.select","selected-choices","frontend.components.select/selected-choices",-195451595).cljs$core$IFn$_invoke$arity$1(new_state),choices);
} else {
}

return new_state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-select-modal","ls-select-modal",-1423366619)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-select-modal","ls-select-modal",-1423366619)));

return state;
})], null)], null),"frontend.components.select/select");
/**
 * Config that supports multiple types (uses) of this component. To add a new
 *   type, add a key with the value being a map with the following keys:
 * 
 *   * :items-fn - fn that returns items with a :value key that are used for the
 *  fuzzy search and selection. Items can have an optional :id and are displayed
 *  lightly for a given item.
 *   * :on-chosen - fn that is given item when it is chosen.
 *   * :empty-placeholder (optional) - fn that returns hiccup html to render if no
 *  matched graphs found.
 *   * :prompt-key (optional) - dictionary keyword that prompts when components is
 *  first open. Defaults to :select/default-prompt.
 */
frontend.components.select.select_config = (function frontend$components$select$select_config(){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"graph-open","graph-open",-328022081),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"items-fn","items-fn",1580041737),(function (){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__110446){
var map__110447 = p__110446;
var map__110447__$1 = cljs.core.__destructure_map(map__110447);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110447__$1,new cljs.core.Keyword(null,"url","url",276297046));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),frontend.util.text.get_graph_name_from_path(url),new cljs.core.Keyword(null,"id","id",-1388402092),frontend.config.get_repo_dir(url),new cljs.core.Keyword(null,"graph","graph",1558099509),url], null);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__110449){
var map__110450 = p__110449;
var map__110450__$1 = cljs.core.__destructure_map(map__110450);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110450__$1,new cljs.core.Keyword(null,"url","url",276297046));
return ((frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url,frontend.state.get_current_repo())));
}),frontend.state.get_repos()));
}),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select.graph","prompt","select.graph/prompt",640552877),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (p1__110443_SHARP_){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),new cljs.core.Keyword(null,"graph","graph",1558099509).cljs$core$IFn$_invoke$arity$1(p1__110443_SHARP_)], null));
}),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),(function (t){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2","div.px-4.py-2",441645500),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-2","div.mb-2",-710047800),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("select.graph","empty-placeholder-description","select.graph/empty-placeholder-description",-1915654845)) : t.call(null,new cljs.core.Keyword("select.graph","empty-placeholder-description","select.graph/empty-placeholder-description",-1915654845)))], null),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("select.graph","add-graph","select.graph/add-graph",-167280293)) : t.call(null,new cljs.core.Keyword("select.graph","add-graph","select.graph/add-graph",-167280293))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graphs","graphs",-1584479112)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.state.close_modal_BANG_], 0))], null);
})], null),new cljs.core.Keyword(null,"graph-remove","graph-remove",-143683669),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"items-fn","items-fn",1580041737),(function (){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__110453){
var map__110454 = p__110453;
var map__110454__$1 = cljs.core.__destructure_map(map__110454);
var original_graph = map__110454__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110454__$1,new cljs.core.Keyword(null,"url","url",276297046));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),frontend.util.text.get_graph_name_from_path(url),new cljs.core.Keyword(null,"id","id",-1388402092),frontend.config.get_repo_dir(url),new cljs.core.Keyword(null,"graph","graph",1558099509),url,new cljs.core.Keyword(null,"original-graph","original-graph",1959751157),original_graph], null);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__110455){
var map__110456 = p__110455;
var map__110456__$1 = cljs.core.__destructure_map(map__110456);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110456__$1,new cljs.core.Keyword(null,"url","url",276297046));
return frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
}),frontend.state.get_repos()));
}),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (p1__110444_SHARP_){
return frontend.handler.repo.remove_repo_BANG_(new cljs.core.Keyword(null,"original-graph","original-graph",1959751157).cljs$core$IFn$_invoke$arity$1(p1__110444_SHARP_));
})], null),new cljs.core.Keyword(null,"db-graph-replace","db-graph-replace",542096376),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"items-fn","items-fn",1580041737),(function (){
var current_repo = frontend.state.get_current_repo();
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__110459){
var map__110460 = p__110459;
var map__110460__$1 = cljs.core.__destructure_map(map__110460);
var original_graph = map__110460__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110460__$1,new cljs.core.Keyword(null,"url","url",276297046));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),frontend.util.text.get_graph_name_from_path(url),new cljs.core.Keyword(null,"id","id",-1388402092),frontend.config.get_repo_dir(url),new cljs.core.Keyword(null,"graph","graph",1558099509),url,new cljs.core.Keyword(null,"original-graph","original-graph",1959751157),original_graph], null);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__110461){
var map__110462 = p__110461;
var map__110462__$1 = cljs.core.__destructure_map(map__110462);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__110462__$1,new cljs.core.Keyword(null,"url","url",276297046));
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url,current_repo)) || ((!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url)))));
}),frontend.state.get_repos()));
}),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (p1__110445_SHARP_){
return frontend.handler.common.developer.import_chosen_graph(new cljs.core.Keyword(null,"graph","graph",1558099509).cljs$core$IFn$_invoke$arity$1(p1__110445_SHARP_));
})], null)], null);
});
frontend.components.select.dialog_select_BANG_ = (function frontend$components$select$dialog_select_BANG_(select_type){
if(cljs.core.truth_(select_type)){
var select_type_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.components.select.select_config(),select_type);
var on_chosen_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900).cljs$core$IFn$_invoke$arity$1(select_type_config);
var G__110464 = (function (){
return frontend.components.select.select(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.select_keys(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(select_type_config,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (it){
(on_chosen_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_chosen_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(it) : on_chosen_SINGLEQUOTE_.call(null,it));

return (logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_all_BANG_.call(null));
})),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683)], null)),new cljs.core.Keyword(null,"items","items",1031954938),(function (){var fexpr__110467 = new cljs.core.Keyword(null,"items-fn","items-fn",1580041737).cljs$core$IFn$_invoke$arity$1(select_type_config);
return (fexpr__110467.cljs$core$IFn$_invoke$arity$0 ? fexpr__110467.cljs$core$IFn$_invoke$arity$0() : fexpr__110467.call(null));
})()));
});
var G__110465 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-select-modal","ls-select-modal",-1423366619),new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-dialog-select"], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__110464,G__110465) : logseq.shui.ui.dialog_open_BANG_.call(null,G__110464,G__110465));
} else {
return null;
}
});

//# sourceMappingURL=frontend.components.select.js.map
