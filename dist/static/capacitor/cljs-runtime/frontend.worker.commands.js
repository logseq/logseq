goog.provide('frontend.worker.commands');
frontend.worker.commands._STAR_commands = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repeated-task","repeated-task",-1930488185),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),"Repeated task",new cljs.core.Keyword(null,"entity-conditions","entity-conditions",76654116),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789),new cljs.core.Keyword(null,"value","value",305978217),true], null)], null),new cljs.core.Keyword(null,"tx-conditions","tx-conditions",2010708451),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"done","done",-889844188)], null)], null),new cljs.core.Keyword(null,"actions","actions",-812656882),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reschedule","reschedule",1619723410)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-property","set-property",-1835834610),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"todo","todo",-1046442570)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"property-history","property-history",2018084536),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Record property history",new cljs.core.Keyword(null,"tx-conditions","tx-conditions",2010708451),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"kind","kind",-717265803),new cljs.core.Keyword(null,"datom-attribute-check?","datom-attribute-check?",2133793803),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602),new cljs.core.Keyword(null,"value","value",305978217),true], null)], null),new cljs.core.Keyword(null,"actions","actions",-812656882),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"record-property-history","record-property-history",1601769046)], null)], null)], null)], null)], null));
frontend.worker.commands.get_property = (function frontend$worker$commands$get_property(entity,property){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword(null,"status","status",-1997798413))){
var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553).cljs$core$IFn$_invoke$arity$1(entity));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853);
}
} else {
return property;
}
});
frontend.worker.commands.get_value = (function frontend$worker$commands$get_value(entity,property,value){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword(null,"status","status",-1997798413))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword(null,"done","done",-889844188))))){
var or__5002__auto__ = (function (){var p = new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553).cljs$core$IFn$_invoke$arity$1(entity);
var choices = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(p);
var checkbox_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(p));
if(checkbox_QMARK_){
return true;
} else {
return cljs.core.some((function (choice){
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice))){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice);
} else {
return null;
}
}),choices);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082);
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword(null,"status","status",-1997798413))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword(null,"todo","todo",-1046442570))))){
var or__5002__auto__ = (function (){var p = new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553).cljs$core$IFn$_invoke$arity$1(entity);
var choices = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(p);
var checkbox_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(p));
if(checkbox_QMARK_){
return false;
} else {
return cljs.core.some((function (choice){
if(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice) === false){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice);
} else {
return null;
}
}),choices);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377);
}
} else {
return value;

}
}
});
/**
 * Whether entity or updated datoms satisfy the `condition`
 */
frontend.worker.commands.satisfy_condition_QMARK_ = (function frontend$worker$commands$satisfy_condition_QMARK_(db,entity,p__129885,datoms){
var map__129886 = p__129885;
var map__129886__$1 = cljs.core.__destructure_map(map__129886);
var kind = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129886__$1,new cljs.core.Keyword(null,"kind","kind",-717265803));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129886__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129886__$1,new cljs.core.Keyword(null,"value","value",305978217));
var property_SINGLEQUOTE_ = frontend.worker.commands.get_property(entity,property);
var value_SINGLEQUOTE_ = frontend.worker.commands.get_value(entity,property,value);
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_SINGLEQUOTE_) : datascript.core.entity.call(null,db,property_SINGLEQUOTE_));
if(cljs.core.truth_(temp__5804__auto__)){
var property_entity = temp__5804__auto__;
var value_matches_QMARK_ = (function (datom_value){
var ref_QMARK_ = cljs.core.contains_QMARK_(logseq.db.frontend.property.type.all_ref_property_types,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property_entity));
var db_value = (((datom_value == null))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,property_SINGLEQUOTE_):((ref_QMARK_)?(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,datom_value) : datascript.core.entity.call(null,db,datom_value)):datom_value
));
if(cljs.core.qualified_keyword_QMARK_(value_SINGLEQUOTE_)){
return ((cljs.core.map_QMARK_(db_value)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value_SINGLEQUOTE_,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(db_value))));
} else {
if(ref_QMARK_){
return ((((cljs.core.uuid_QMARK_(value_SINGLEQUOTE_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(db_value),value_SINGLEQUOTE_)))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value_SINGLEQUOTE_,logseq.db.frontend.property.property_value_content(db_value))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value_SINGLEQUOTE_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(db_value))))));
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(db_value,value_SINGLEQUOTE_);

}
}
});
if(cljs.core.seq(datoms)){
var G__129891 = kind;
var G__129891__$1 = (((G__129891 instanceof cljs.core.Keyword))?G__129891.fqn:null);
switch (G__129891__$1) {
case "datom-attribute-check?":
return cljs.core.some((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value_SINGLEQUOTE_,cljs.core.get.cljs$core$IFn$_invoke$arity$2((function (){var G__129892 = db;
var G__129893 = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__129892,G__129893) : datascript.core.entity.call(null,G__129892,G__129893));
})(),property));
}),datoms);

break;
default:
return cljs.core.some((function (d){
var and__5000__auto__ = value_matches_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_SINGLEQUOTE_,new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
}),datoms));

}
} else {
return value_matches_QMARK_(null);
}
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.commands !== 'undefined') && (typeof frontend.worker.commands.handle_command !== 'undefined')){
} else {
frontend.worker.commands.handle_command = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__129895 = cljs.core.get_global_hierarchy;
return (fexpr__129895.cljs$core$IFn$_invoke$arity$0 ? fexpr__129895.cljs$core$IFn$_invoke$arity$0() : fexpr__129895.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.commands","handle-command"),(function() { 
var G__129968__delegate = function (action_id,_others){
return action_id;
};
var G__129968 = function (action_id,var_args){
var _others = null;
if (arguments.length > 1) {
var G__129969__i = 0, G__129969__a = new Array(arguments.length -  1);
while (G__129969__i < G__129969__a.length) {G__129969__a[G__129969__i] = arguments[G__129969__i + 1]; ++G__129969__i;}
  _others = new cljs.core.IndexedSeq(G__129969__a,0,null);
} 
return G__129968__delegate.call(this,action_id,_others);};
G__129968.cljs$lang$maxFixedArity = 1;
G__129968.cljs$lang$applyTo = (function (arglist__129970){
var action_id = cljs.core.first(arglist__129970);
var _others = cljs.core.rest(arglist__129970);
return G__129968__delegate(action_id,_others);
});
G__129968.cljs$core$IFn$_invoke$arity$variadic = G__129968__delegate;
return G__129968;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.commands.repeat_until_future_timestamp = (function frontend$worker$commands$repeat_until_future_timestamp(datetime,recur_unit,frequency,period_f,keep_week_QMARK_){
var now = cljs_time.core.now();
if(cljs.core.truth_(cljs_time.core.after_QMARK_(datetime,now))){
return datetime;
} else {
var v = (function (){var G__129899 = cljs_time.core.interval(datetime,now);
return (period_f.cljs$core$IFn$_invoke$arity$1 ? period_f.cljs$core$IFn$_invoke$arity$1(G__129899) : period_f.call(null,G__129899));
})();
var delta = (function (){var G__129900 = (frequency * Math.ceil(((((v === (0)))?(1):v) / frequency)));
return (recur_unit.cljs$core$IFn$_invoke$arity$1 ? recur_unit.cljs$core$IFn$_invoke$arity$1(G__129900) : recur_unit.call(null,G__129900));
})();
var result = cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(datetime,delta);
var w1 = cljs_time.core.day_of_week(datetime);
var w2 = cljs_time.core.day_of_week(result);
if(cljs.core.truth_((function (){var and__5000__auto__ = keep_week_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(w1,w2);
} else {
return and__5000__auto__;
}
})())){
if((w2 > w1)){
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(result,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1(((7) - (w2 - w1))));
} else {
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(result,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((w1 - w2)));
}
} else {
return result;
}
}
});
frontend.worker.commands.get_next_time = (function frontend$worker$commands$get_next_time(current_value,unit,frequency){
var current_date_time = cljs_time.coerce.to_date_time(current_value);
var default_timezone_time = cljs_time.core.to_default_time_zone(current_date_time);
var vec__129905 = (function (){var G__129908 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(unit);
var G__129908__$1 = (((G__129908 instanceof cljs.core.Keyword))?G__129908.fqn:null);
switch (G__129908__$1) {
case "logseq.property.repeat/recur-unit.minute":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.minutes,cljs_time.core.in_minutes], null);

break;
case "logseq.property.repeat/recur-unit.hour":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.hours,cljs_time.core.in_hours], null);

break;
case "logseq.property.repeat/recur-unit.day":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.days,cljs_time.core.in_days], null);

break;
case "logseq.property.repeat/recur-unit.week":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.weeks,cljs_time.core.in_weeks], null);

break;
case "logseq.property.repeat/recur-unit.month":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.months,cljs_time.core.in_months], null);

break;
case "logseq.property.repeat/recur-unit.year":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.years,cljs_time.core.in_years], null);

break;
default:
return null;

}
})();
var recur_unit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129905,(0),null);
var period_f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129905,(1),null);
if(cljs.core.truth_(recur_unit)){
var delta = (recur_unit.cljs$core$IFn$_invoke$arity$1 ? recur_unit.cljs$core$IFn$_invoke$arity$1(frequency) : recur_unit.call(null,frequency));
var next_time = (function (){var G__129909 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(unit);
var G__129909__$1 = (((G__129909 instanceof cljs.core.Keyword))?G__129909.fqn:null);
switch (G__129909__$1) {
case "logseq.property.repeat/recur-unit.year":
return frontend.worker.commands.repeat_until_future_timestamp(default_timezone_time,recur_unit,frequency,period_f,false);

break;
case "logseq.property.repeat/recur-unit.month":
return frontend.worker.commands.repeat_until_future_timestamp(default_timezone_time,recur_unit,frequency,period_f,false);

break;
case "logseq.property.repeat/recur-unit.week":
return frontend.worker.commands.repeat_until_future_timestamp(default_timezone_time,recur_unit,frequency,period_f,true);

break;
default:
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.now(),delta);

}
})();
return cljs_time.coerce.to_long(next_time);
} else {
return null;
}
});
frontend.worker.commands.handle_command.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"reschedule","reschedule",1619723410),(function (_,db,entity,_datoms){
var property_ident = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784).cljs$core$IFn$_invoke$arity$1(entity));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943);
}
})();
var frequency = logseq.db.frontend.property.property_value_content(new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922).cljs$core$IFn$_invoke$arity$1(entity));
var unit = new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247).cljs$core$IFn$_invoke$arity$1(entity);
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_ident) : datascript.core.entity.call(null,db,property_ident));
var date_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
var current_value = (function (){var G__129915 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,property_ident);
if(date_QMARK_){
return (function (p1__129914_SHARP_){
return logseq.common.util.date_time.journal_day__GT_ms(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(p1__129914_SHARP_));
})(G__129915);
} else {
return G__129915;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = frequency;
if(cljs.core.truth_(and__5000__auto__)){
return unit;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = frontend.worker.commands.get_next_time(current_value,unit,frequency);
if(cljs.core.truth_(temp__5804__auto__)){
var next_time_long = temp__5804__auto__;
var journal_day = logseq.outliner.pipeline.get_journal_day_from_long(db,next_time_long);
var map__129916 = (cljs.core.truth_(journal_day)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,journal_day) : datascript.core.entity.call(null,db,journal_day)))], null):(function (){var formatter = new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))));
var title = logseq.common.util.date_time.format(cljs_time.core.to_default_time_zone(cljs_time.coerce.to_date_time(next_time_long)),formatter);
return frontend.worker.handler.page.db_based.page.create(db,title,cljs.core.PersistentArrayMap.EMPTY);
})());
var map__129916__$1 = cljs.core.__destructure_map(map__129916);
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129916__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var page_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129916__$1,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915));
var value = ((date_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null):next_time_long);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data,(cljs.core.truth_(value)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),property_ident,value], null)], null):null));
} else {
return null;
}
} else {
return null;
}
}));
frontend.worker.commands.handle_command.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"set-property","set-property",-1835834610),(function (_,_db,entity,_datoms,property,value){
var property_SINGLEQUOTE_ = frontend.worker.commands.get_property(entity,property);
var value_SINGLEQUOTE_ = frontend.worker.commands.get_value(entity,property,value);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),property_SINGLEQUOTE_,value_SINGLEQUOTE_], null)], null);
}));
frontend.worker.commands.handle_command.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"record-property-history","record-property-history",1601769046),(function (_,db,entity,datoms){
var changes = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var property = (function (){var G__129917 = db;
var G__129918 = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__129917,G__129918) : datascript.core.entity.call(null,G__129917,G__129918));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602)) === true;
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),property,new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)], null);
} else {
return null;
}
}),datoms);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__129920){
var map__129921 = p__129920;
var map__129921__$1 = cljs.core.__destructure_map(map__129921);
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129921__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129921__$1,new cljs.core.Keyword(null,"value","value",305978217));
var ref_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property));
var value_key = ((ref_QMARK_)?new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037):new cljs.core.Keyword("logseq.property.history","scalar-value","logseq.property.history/scalar-value",239337775));
var G__129929 = cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.db.new_block_id(),value_key,value,new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)]);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__129929) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__129929));
}),changes);
}));
frontend.worker.commands.handle_command.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (command,_db,entity,datoms){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Unhandled command",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",-894540724),command,new cljs.core.Keyword(null,"entity","entity",-450970276),entity,new cljs.core.Keyword(null,"datoms","datoms",-290874434),datoms], null));
}));
/**
 * Build tx-data
 */
frontend.worker.commands.execute_command = (function frontend$worker$commands$execute_command(db,entity,datoms,p__129930){
var vec__129931 = p__129930;
var _command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129931,(0),null);
var map__129934 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129931,(1),null);
var map__129934__$1 = cljs.core.__destructure_map(map__129934);
var actions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129934__$1,new cljs.core.Keyword(null,"actions","actions",-812656882));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (action){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.commands.handle_command,cljs.core.first(action),db,entity,datoms,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.rest(action)], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([actions], 0));
});
frontend.worker.commands.run_commands = (function frontend$worker$commands$run_commands(p__129939){
var map__129940 = p__129939;
var map__129940__$1 = cljs.core.__destructure_map(map__129940);
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129940__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129940__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var db = db_after;
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__129941){
var vec__129942 = p__129941;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129942,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129942,(1),null);
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e));
var commands = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__129945){
var vec__129949 = p__129945;
var _command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129949,(0),null);
var map__129952 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129949,(1),null);
var map__129952__$1 = cljs.core.__destructure_map(map__129952);
var entity_conditions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129952__$1,new cljs.core.Keyword(null,"entity-conditions","entity-conditions",76654116));
var tx_conditions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129952__$1,new cljs.core.Keyword(null,"tx-conditions","tx-conditions",2010708451));
var and__5000__auto__ = ((cljs.core.seq(entity_conditions))?cljs.core.every_QMARK_((function (p1__129937_SHARP_){
return frontend.worker.commands.satisfy_condition_QMARK_(db,entity,p1__129937_SHARP_,null);
}),entity_conditions):true);
if(and__5000__auto__){
return cljs.core.every_QMARK_((function (p1__129938_SHARP_){
return frontend.worker.commands.satisfy_condition_QMARK_(db,entity,p1__129938_SHARP_,datoms);
}),tx_conditions);
} else {
return and__5000__auto__;
}
}),cljs.core.deref(frontend.worker.commands._STAR_commands));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (command){
return frontend.worker.commands.execute_command(db,entity,datoms,command);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([commands], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),tx_data)], 0));
});

//# sourceMappingURL=frontend.worker.commands.js.map
