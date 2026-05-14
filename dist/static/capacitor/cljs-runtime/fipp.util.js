goog.provide('fipp.util');
fipp.util.boolean_QMARK_ = (function fipp$util$boolean_QMARK_(x){
return ((x === true) || (x === false));
});
fipp.util.char_QMARK_ = (function fipp$util$char_QMARK_(x){
return false;
});
fipp.util.regexp_QMARK_ = cljs.core.regexp_QMARK_;
/**
 * Is the root of x an edn type?
 */
fipp.util.edn_QMARK_ = (function fipp$util$edn_QMARK_(x){
var or__5002__auto__ = (x == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = fipp.util.boolean_QMARK_(x);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = typeof x === 'string';
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = fipp.util.char_QMARK_(x);
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (x instanceof cljs.core.Symbol);
if(or__5002__auto____$4){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = (x instanceof cljs.core.Keyword);
if(or__5002__auto____$5){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = typeof x === 'number';
if(or__5002__auto____$6){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = cljs.core.seq_QMARK_(x);
if(or__5002__auto____$7){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = cljs.core.vector_QMARK_(x);
if(or__5002__auto____$8){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = cljs.core.record_QMARK_(x);
if(or__5002__auto____$9){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = cljs.core.map_QMARK_(x);
if(or__5002__auto____$10){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = cljs.core.set_QMARK_(x);
if(or__5002__auto____$11){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = cljs.core.tagged_literal_QMARK_(x);
if(or__5002__auto____$12){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = cljs.core.var_QMARK_(x);
if(or__5002__auto____$13){
return or__5002__auto____$13;
} else {
return (fipp.util.regexp_QMARK_.cljs$core$IFn$_invoke$arity$1 ? fipp.util.regexp_QMARK_.cljs$core$IFn$_invoke$arity$1(x) : fipp.util.regexp_QMARK_.call(null,x));
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
});
fipp.util.value_obj_QMARK_ = (function fipp$util$value_obj_QMARK_(x){
var and__5000__auto__ = (((!((x == null))))?(((((x.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IWithMeta$))))?true:(((!x.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,x):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,x));
if(and__5000__auto__){
return (!(cljs.core.var_QMARK_(x)));
} else {
return and__5000__auto__;
}
});
fipp.util.instant_supported_QMARK_ = true;

//# sourceMappingURL=fipp.util.js.map
