goog.provide('frontend.components.file_based.datetime');
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.file_based !== 'undefined') && (typeof frontend.components.file_based.datetime !== 'undefined') && (typeof frontend.components.file_based.datetime.default_timestamp_value !== 'undefined')){
} else {
frontend.components.file_based.datetime.default_timestamp_value = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"time","time",1385887882),"",new cljs.core.Keyword(null,"repeater","repeater",-1071171146),cljs.core.PersistentArrayMap.EMPTY], null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.file_based !== 'undefined') && (typeof frontend.components.file_based.datetime !== 'undefined') && (typeof frontend.components.file_based.datetime._STAR_timestamp !== 'undefined')){
} else {
frontend.components.file_based.datetime._STAR_timestamp = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(frontend.components.file_based.datetime.default_timestamp_value);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.file_based !== 'undefined') && (typeof frontend.components.file_based.datetime !== 'undefined') && (typeof frontend.components.file_based.datetime._STAR_show_time_QMARK_ !== 'undefined')){
} else {
frontend.components.file_based.datetime._STAR_show_time_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.file_based.datetime.time_input = rum.core.lazy_build(rum.core.build_defc,(function (default_value){
var show_QMARK_ = rum.core.react(frontend.components.file_based.datetime._STAR_show_time_QMARK_);
if(cljs.core.truth_((function (){var or__5002__auto__ = show_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(clojure.string.blank_QMARK_(default_value)));
}
})())){
return daiquiri.core.create_element("div",{'style':{'height':(32)},'className':"flex flex-row"},[daiquiri.core.create_element("input",{'id':"time",'defaultValue':default_value,'onChange':rum.core.mark_sync_update((function (event){
frontend.util.stop(event);

var value = frontend.util.evalue(event);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc,new cljs.core.Keyword(null,"time","time",1385887882),value);
})),'className':"form-input w-20 ms:w-60"},[]),daiquiri.core.create_element("a",{'onClick':(function (){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_time_QMARK_,false);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc,new cljs.core.Keyword(null,"time","time",1385887882),null);
}),'className':"ml-2 self-center"},[daiquiri.interpreter.interpret(frontend.components.svg.close)])]);
} else {
return daiquiri.core.create_element("a",{'onClick':(function (){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_time_QMARK_,true);

var map__107864 = frontend.date.get_local_date();
var map__107864__$1 = cljs.core.__destructure_map(map__107864);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107864__$1,new cljs.core.Keyword(null,"hour","hour",-555989214));
var minute = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107864__$1,new cljs.core.Keyword(null,"minute","minute",-642875969));
var result = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(hour),":",frontend.util.zero_pad(minute)].join('');
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc,new cljs.core.Keyword(null,"time","time",1385887882),result);
}),'className':"text-sm"},["Add time"]);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.file-based.datetime/time-input");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.file_based !== 'undefined') && (typeof frontend.components.file_based.datetime !== 'undefined') && (typeof frontend.components.file_based.datetime._STAR_show_repeater_QMARK_ !== 'undefined')){
} else {
frontend.components.file_based.datetime._STAR_show_repeater_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.file_based.datetime.repeater_cp = rum.core.lazy_build(rum.core.build_defc,(function (p__107865){
var map__107866 = p__107865;
var map__107866__$1 = cljs.core.__destructure_map(map__107866);
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107866__$1,new cljs.core.Keyword(null,"num","num",1985240673));
var duration = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107866__$1,new cljs.core.Keyword(null,"duration","duration",1444101068));
var kind = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107866__$1,new cljs.core.Keyword(null,"kind","kind",-717265803));
var show_QMARK_ = rum.core.react(frontend.components.file_based.datetime._STAR_show_repeater_QMARK_);
if(cljs.core.truth_((function (){var or__5002__auto__ = show_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = num;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = duration;
if(cljs.core.truth_(and__5000__auto____$1)){
return kind;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())){
return daiquiri.core.create_element("div",{'className':"w full flex flex-row justify-left items-center"},[daiquiri.core.create_element("input",{'id':"repeater-num",'defaultValue':num,'onChange':rum.core.mark_sync_update((function (event){
var value = frontend.util.evalue(event);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repeater","repeater",-1071171146),new cljs.core.Keyword(null,"num","num",1985240673)], null),value);
})),'className':"form-input w-8 mr-2 px-1 sm:w-20 sm:px-2 text-center"},[]),frontend.ui.select(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(item),duration)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword(null,"selected","selected",574897764),"selected");
} else {
return item;
}
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"h"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"d"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"w"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"m"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"y"], null)], null)),(function (_e,value){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repeater","repeater",-1071171146),new cljs.core.Keyword(null,"duration","duration",1444101068)], null),value);
})),daiquiri.core.create_element("a",{'onClick':(function (){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_repeater_QMARK_,false);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc,new cljs.core.Keyword(null,"repeater","repeater",-1071171146),cljs.core.PersistentArrayMap.EMPTY);
}),'className':"ml-2 self-center"},[daiquiri.interpreter.interpret(frontend.components.svg.close)])]);
} else {
return daiquiri.core.create_element("a",{'onClick':(function (){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_repeater_QMARK_,true);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.file_based.datetime._STAR_timestamp,cljs.core.assoc,new cljs.core.Keyword(null,"repeater","repeater",-1071171146),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"kind","kind",-717265803),".+",new cljs.core.Keyword(null,"num","num",1985240673),(1),new cljs.core.Keyword(null,"duration","duration",1444101068),"d"], null));
}),'className':"text-sm"},["Add repeater"]);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.file-based.datetime/repeater-cp");
frontend.components.file_based.datetime.clear_timestamp_BANG_ = (function frontend$components$file_based$datetime$clear_timestamp_BANG_(){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_timestamp,frontend.components.file_based.datetime.default_timestamp_value);

cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_time_QMARK_,false);

cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_show_repeater_QMARK_,false);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581),null);
});
/**
 * Submit handler of date picker
 */
frontend.components.file_based.datetime.on_submit = (function frontend$components$file_based$datetime$on_submit(e){
if(cljs.core.truth_(e)){
frontend.util.stop(e);
} else {
}

var map__107878_107896 = cljs.core.deref(frontend.components.file_based.datetime._STAR_timestamp);
var map__107878_107897__$1 = cljs.core.__destructure_map(map__107878_107896);
var timestamp_107898 = map__107878_107897__$1;
var repeater_107899 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107878_107897__$1,new cljs.core.Keyword(null,"repeater","repeater",-1071171146));
var date_107900 = frontend.date.js_date__GT_goog_date(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var timestamp_107901__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(timestamp_107898,new cljs.core.Keyword(null,"date","date",-1463434462),(function (){var or__5002__auto__ = date_107900;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs_time.core.today();
}
})());
var kind_107902 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("w",new cljs.core.Keyword(null,"duration","duration",1444101068).cljs$core$IFn$_invoke$arity$1(repeater_107899)))?"++":".+");
var timestamp_107903__$2 = cljs.core.assoc_in(timestamp_107901__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repeater","repeater",-1071171146),new cljs.core.Keyword(null,"kind","kind",-717265803)], null),kind_107902);
var text_107904 = frontend.handler.file_based.repeated.timestamp_map__GT_text(timestamp_107903__$2);
var block_data_107905 = frontend.state.get_timestamp_block();
var map__107879_107906 = block_data_107905;
var map__107879_107907__$1 = cljs.core.__destructure_map(map__107879_107906);
var block_107908 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107879_107907__$1,new cljs.core.Keyword(null,"block","block",664686210));
var typ_107909 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107879_107907__$1,new cljs.core.Keyword(null,"typ","typ",-1304536900));
var show_QMARK__107910 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107879_107907__$1,new cljs.core.Keyword(null,"show?","show?",1543842127));
var editing_block_id_107911 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
var block_id_107912 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_107908);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return editing_block_id_107911;
}
})();
var typ_107913__$1 = (function (){var or__5002__auto__ = cljs.core.deref(frontend.commands._STAR_current_command);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return typ_107909;
}
})();
if(((frontend.state.editing_QMARK_()) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(editing_block_id_107911,block_id_107912)))){
frontend.handler.editor.set_editing_block_timestamp_BANG_(typ_107913__$1,text_107904);
} else {
frontend.handler.editor.set_block_timestamp_BANG_(block_id_107912,typ_107913__$1,text_107904);
}

if(cljs.core.truth_(show_QMARK__107910)){
cljs.core.reset_BANG_(show_QMARK__107910,false);
} else {
}

frontend.components.file_based.datetime.clear_timestamp_BANG_();

frontend.state.set_timestamp_block_BANG_(null);

return frontend.commands.restore_state();
});
frontend.components.file_based.datetime.time_repeater = rum.core.lazy_build(rum.core.build_defc,(function (){
var map__107880 = rum.core.react(frontend.components.file_based.datetime._STAR_timestamp);
var map__107880__$1 = cljs.core.__destructure_map(map__107880);
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107880__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var repeater = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107880__$1,new cljs.core.Keyword(null,"repeater","repeater",-1071171146));
return daiquiri.core.create_element("div",{'id':"time-repeater",'className':"py-1 px-4"},[daiquiri.core.create_element("p",{'className':"text-sm opacity-50 font-medium mt-4"},["Time:"]),frontend.components.file_based.datetime.time_input(time),daiquiri.core.create_element("p",{'className':"text-sm opacity-50 font-medium mt-4"},["Repeater:"]),frontend.components.file_based.datetime.repeater_cp(repeater),(function (){var attrs107888 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.components.file_based.datetime.on_submit], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs107888))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-4"], null)], null),attrs107888], 0))):{'className':"mt-4"}),((cljs.core.map_QMARK_(attrs107888))?null:[daiquiri.interpreter.interpret(attrs107888)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return setTimeout((function (){
return frontend.mixins.on_enter.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"node","node",581201198),input,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),frontend.components.file_based.datetime.on_submit], 0));
}),(100));
} else {
return null;
}
}))], null),"frontend.components.file-based.datetime/time-repeater");
frontend.components.file_based.datetime.date_picker = rum.core.lazy_build(rum.core.build_defc,(function (dom_id,format,_ts){
var current_command = cljs.core.deref(frontend.commands._STAR_current_command);
var deadline_or_schedule_QMARK_ = (function (){var and__5000__auto__ = current_command;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["deadline",null,"scheduled",null], null), null),clojure.string.lower_case(current_command));
} else {
return and__5000__auto__;
}
})();
var date = frontend.state.sub(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581));
var select_handler_BANG_ = (function (d){
if(cljs.core.truth_(d)){
var gd = (new goog.date.Date(d.getFullYear(),d.getMonth(),d.getDate()));
var journal = frontend.date.js_date__GT_journal_title(gd);
if(cljs.core.truth_(deadline_or_schedule_QMARK_)){
} else {
var G__107889_107915 = dom_id;
var G__107890_107916 = logseq.common.util.page_ref.__GT_page_ref(journal);
var G__107891_107917 = format;
var G__107892_107918 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__107889_107915,G__107890_107916,G__107891_107917,G__107892_107918) : frontend.handler.editor.insert_command_BANG_.call(null,G__107889_107915,G__107890_107916,G__107891_107917,G__107892_107918));

frontend.state.clear_editor_action_BANG_();

cljs.core.reset_BANG_(frontend.commands._STAR_current_command,null);
}

return frontend.state.set_state_BANG_(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581),d);
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'id':"date-time-picker",'className':"flex flex-col sm:flex-row"},[daiquiri.core.create_element("div",{'className':"border-red-500"},[frontend.ui.nlp_calendar(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"mode","mode",654403691),"single",new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"show-week-number","show-week-number",532916714),false,new cljs.core.Keyword(null,"selected","selected",574897764),date,new cljs.core.Keyword(null,"on-select","on-select",-192407950),select_handler_BANG_,new cljs.core.Keyword(null,"on-day-key-down","on-day-key-down",-466083153),(function (d,_,e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",e.key)){
select_handler_BANG_(d);

return frontend.util.stop(e);
} else {
return null;
}
})], null))]),(cljs.core.truth_(deadline_or_schedule_QMARK_)?frontend.components.file_based.datetime.time_repeater():null)]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var ts_107923 = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
frontend.components.file_based.datetime.clear_timestamp_BANG_();

if(cljs.core.truth_(ts_107923)){
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_timestamp,ts_107923);
} else {
cljs.core.reset_BANG_(frontend.components.file_based.datetime._STAR_timestamp,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"time","time",1385887882),"",new cljs.core.Keyword(null,"repeater","repeater",-1071171146),cljs.core.PersistentArrayMap.EMPTY], null));
}

if(cljs.core.truth_(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("date-picker","date","date-picker/date",-1622069581),cljs.core.get.cljs$core$IFn$_invoke$arity$3(ts_107923,new cljs.core.Keyword(null,"date","date",-1463434462),cljs_time.core.today()));
}

return state;
})], null)], null),"frontend.components.file-based.datetime/date-picker");

//# sourceMappingURL=frontend.components.file_based.datetime.js.map
