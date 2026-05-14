goog.provide('devtools.formatters.helpers');
devtools.formatters.helpers.pref = (function devtools$formatters$helpers$pref(v){
while(true){
if((v instanceof cljs.core.Keyword)){
var G__33341 = devtools.prefs.pref(v);
v = G__33341;
continue;
} else {
return v;
}
break;
}
});
devtools.formatters.helpers.get_prototype = (function devtools$formatters$helpers$get_prototype(o){
return o.prototype;
});
devtools.formatters.helpers.get_constructor = (function devtools$formatters$helpers$get_constructor(o){
return o.constructor;
});
devtools.formatters.helpers.is_prototype_QMARK_ = (function devtools$formatters$helpers$is_prototype_QMARK_(o){
return (devtools.formatters.helpers.get_prototype(devtools.formatters.helpers.get_constructor(o)) === o);
});
devtools.formatters.helpers.is_js_symbol_QMARK_ = (function devtools$formatters$helpers$is_js_symbol_QMARK_(o){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(goog.typeOf(o),"symbol");
});
devtools.formatters.helpers.cljs_function_QMARK_ = (function devtools$formatters$helpers$cljs_function_QMARK_(value){
var and__5000__auto__ = cljs.core.not(devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"disable-cljs-fn-formatting","disable-cljs-fn-formatting",1903786837)));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(cljs.core.var_QMARK_(value)));
if(and__5000__auto____$1){
return devtools.munging.cljs_fn_QMARK_(value);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
devtools.formatters.helpers.has_formatting_protocol_QMARK_ = (function devtools$formatters$helpers$has_formatting_protocol_QMARK_(value){
var or__5002__auto__ = (function (){try{if((!((value == null)))){
if((((value.cljs$lang$protocol_mask$partition0$ & (2147483648))) || ((cljs.core.PROTOCOL_SENTINEL === value.cljs$core$IPrintWithWriter$)))){
return true;
} else {
if((!value.cljs$lang$protocol_mask$partition0$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IPrintWithWriter,value);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IPrintWithWriter,value);
}
}catch (e33277){var _e__32385__auto__ = e33277;
return false;
}})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){try{if((!((value == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === value.devtools$format$IDevtoolsFormat$)))){
return true;
} else {
if((!value.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(devtools.format.IDevtoolsFormat,value);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(devtools.format.IDevtoolsFormat,value);
}
}catch (e33279){var _e__32385__auto__ = e33279;
return false;
}})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
try{if((!((value == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === value.devtools$protocols$IFormat$)))){
return true;
} else {
if((!value.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(devtools.protocols.IFormat,value);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(devtools.protocols.IFormat,value);
}
}catch (e33281){var _e__32385__auto__ = e33281;
return false;
}}
}
});
devtools.formatters.helpers.cljs_type_QMARK_ = (function devtools$formatters$helpers$cljs_type_QMARK_(f){
var and__5000__auto__ = goog.isObject(f);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(devtools.formatters.helpers.is_prototype_QMARK_(f)));
if(and__5000__auto____$1){
return f.cljs$lang$type;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
devtools.formatters.helpers.cljs_instance_QMARK_ = (function devtools$formatters$helpers$cljs_instance_QMARK_(value){
var and__5000__auto__ = goog.isObject(value);
if(cljs.core.truth_(and__5000__auto__)){
return devtools.formatters.helpers.cljs_type_QMARK_(devtools.formatters.helpers.get_constructor(value));
} else {
return and__5000__auto__;
}
});
devtools.formatters.helpers.cljs_land_value_QMARK_ = (function devtools$formatters$helpers$cljs_land_value_QMARK_(value){
var or__5002__auto__ = devtools.formatters.helpers.cljs_instance_QMARK_(value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.formatters.helpers.has_formatting_protocol_QMARK_(value);
}
});
devtools.formatters.helpers.cljs_value_QMARK_ = (function devtools$formatters$helpers$cljs_value_QMARK_(value){
var and__5000__auto__ = (function (){var or__5002__auto__ = devtools.formatters.helpers.cljs_land_value_QMARK_(value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.formatters.helpers.cljs_function_QMARK_(value);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (((!(devtools.formatters.helpers.is_prototype_QMARK_(value)))) && ((!(devtools.formatters.helpers.is_js_symbol_QMARK_(value)))));
} else {
return and__5000__auto__;
}
});
devtools.formatters.helpers.bool_QMARK_ = (function devtools$formatters$helpers$bool_QMARK_(value){
return ((value === true) || (value === false));
});
devtools.formatters.helpers.instance_of_a_well_known_type_QMARK_ = (function devtools$formatters$helpers$instance_of_a_well_known_type_QMARK_(value){
var well_known_types = devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"well-known-types","well-known-types",70638649));
var constructor_fn = devtools.formatters.helpers.get_constructor(value);
var vec__33306 = devtools.munging.parse_constructor_info(constructor_fn);
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33306,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33306,(1),null);
var fully_qualified_type_name = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
return cljs.core.contains_QMARK_(well_known_types,fully_qualified_type_name);
});
devtools.formatters.helpers.should_render_instance_QMARK_ = (function devtools$formatters$helpers$should_render_instance_QMARK_(value){
var and__5000__auto__ = devtools.formatters.helpers.cljs_instance_QMARK_(value);
if(cljs.core.truth_(and__5000__auto__)){
return (!(devtools.formatters.helpers.instance_of_a_well_known_type_QMARK_(value)));
} else {
return and__5000__auto__;
}
});
devtools.formatters.helpers.directly_printable_QMARK_ = (function devtools$formatters$helpers$directly_printable_QMARK_(value){
return ((typeof value === 'string') || (((typeof value === 'number') || (devtools.formatters.helpers.bool_QMARK_(value)))));
});
devtools.formatters.helpers.abbreviated_QMARK_ = (function devtools$formatters$helpers$abbreviated_QMARK_(template){
return cljs.core.some((function (p1__33313_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"more-marker","more-marker",-14717935)),p1__33313_SHARP_);
}),template);
});
devtools.formatters.helpers.abbreviate_long_string = (function devtools$formatters$helpers$abbreviate_long_string(string,marker,prefix_limit,postfix_limit){
var prefix = string.slice((0),prefix_limit);
var postfix = string.slice((string.length - postfix_limit));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker),cljs.core.str.cljs$core$IFn$_invoke$arity$1(postfix)].join('');
});
devtools.formatters.helpers.get_more_marker = (function devtools$formatters$helpers$get_more_marker(more_count){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"plus-symbol","plus-symbol",-1984915189))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(more_count),cljs.core.str.cljs$core$IFn$_invoke$arity$1(devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"more-symbol","more-symbol",-2139760242)))].join('');
});
devtools.formatters.helpers.wrap_arity = (function devtools$formatters$helpers$wrap_arity(arity){
var args_open_symbol = devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"args-open-symbol","args-open-symbol",-1336957557));
var args_close_symbol = devtools.formatters.helpers.pref(new cljs.core.Keyword(null,"args-close-symbol","args-close-symbol",777697973));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(args_open_symbol),cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity),cljs.core.str.cljs$core$IFn$_invoke$arity$1(args_close_symbol)].join('');
});
devtools.formatters.helpers.fetch_field_value = (function devtools$formatters$helpers$fetch_field_value(obj,field){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [field,(obj[cljs.core.munge(field)])], null);
});
devtools.formatters.helpers.fetch_fields_values = (function devtools$formatters$helpers$fetch_fields_values(obj,fields){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(devtools.formatters.helpers.fetch_field_value,obj),fields);
});
devtools.formatters.helpers.expandable_QMARK_ = (function devtools$formatters$helpers$expandable_QMARK_(obj){
if((((!((obj == null))))?(((((obj.cljs$lang$protocol_mask$partition0$ & (8388608))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$ISeqable$))))?true:(((!obj.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ISeqable,obj):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ISeqable,obj))){
var temp__5802__auto__ = devtools.formatters.helpers.pref(((devtools.formatters.helpers.instance_of_a_well_known_type_QMARK_(obj))?new cljs.core.Keyword(null,"min-expandable-sequable-count-for-well-known-types","min-expandable-sequable-count-for-well-known-types",-1879576081):new cljs.core.Keyword(null,"min-expandable-sequable-count","min-expandable-sequable-count",63566227)));
if(cljs.core.truth_(temp__5802__auto__)){
var min_count = temp__5802__auto__;
if((!(cljs.core.empty_QMARK_(obj)))){
var actual_count = cljs.core.bounded_count(min_count,obj);
return (actual_count >= min_count);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
devtools.formatters.helpers.should_render_QMARK_ = (function devtools$formatters$helpers$should_render_QMARK_(pref_key,value,default_check){
var temp__5802__auto__ = devtools.formatters.helpers.pref(pref_key);
if(cljs.core.truth_(temp__5802__auto__)){
var render_pref = temp__5802__auto__;
if(render_pref === true){
return (default_check.cljs$core$IFn$_invoke$arity$1 ? default_check.cljs$core$IFn$_invoke$arity$1(value) : default_check.call(null,value));
} else {
if(cljs.core.fn_QMARK_(render_pref)){
return (render_pref.cljs$core$IFn$_invoke$arity$1 ? render_pref.cljs$core$IFn$_invoke$arity$1(value) : render_pref.call(null,value));
} else {
return null;
}
}
} else {
return null;
}
});

//# sourceMappingURL=devtools.formatters.helpers.js.map
