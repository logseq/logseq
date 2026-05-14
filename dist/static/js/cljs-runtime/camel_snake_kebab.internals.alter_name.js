goog.provide('camel_snake_kebab.internals.alter_name');

/**
 * @interface
 */
camel_snake_kebab.internals.alter_name.AlterName = function(){};

var camel_snake_kebab$internals$alter_name$AlterName$alter_name$dyn_73692 = (function (this$,f){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (camel_snake_kebab.internals.alter_name.alter_name[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,f) : m__5351__auto__.call(null,this$,f));
} else {
var m__5349__auto__ = (camel_snake_kebab.internals.alter_name.alter_name["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,f) : m__5349__auto__.call(null,this$,f));
} else {
throw cljs.core.missing_protocol("AlterName.alter-name",this$);
}
}
});
/**
 * Alters the name of this with f.
 */
camel_snake_kebab.internals.alter_name.alter_name = (function camel_snake_kebab$internals$alter_name$alter_name(this$,f){
if((((!((this$ == null)))) && ((!((this$.camel_snake_kebab$internals$alter_name$AlterName$alter_name$arity$2 == null)))))){
return this$.camel_snake_kebab$internals$alter_name$AlterName$alter_name$arity$2(this$,f);
} else {
return camel_snake_kebab$internals$alter_name$AlterName$alter_name$dyn_73692(this$,f);
}
});

(camel_snake_kebab.internals.alter_name.AlterName["string"] = true);

(camel_snake_kebab.internals.alter_name.alter_name["string"] = (function (this$,f){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(this$) : f.call(null,this$));
}));

(cljs.core.Keyword.prototype.camel_snake_kebab$internals$alter_name$AlterName$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Keyword.prototype.camel_snake_kebab$internals$alter_name$AlterName$alter_name$arity$2 = (function (this$,f){
var this$__$1 = this;
if(cljs.core.truth_(cljs.core.namespace(this$__$1))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Namespaced keywords are not supported",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"input","input",556931961),this$__$1], null));
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var G__73682 = cljs.core.name(this$__$1);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__73682) : f.call(null,G__73682));
})());
}
}));

(cljs.core.Symbol.prototype.camel_snake_kebab$internals$alter_name$AlterName$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Symbol.prototype.camel_snake_kebab$internals$alter_name$AlterName$alter_name$arity$2 = (function (this$,f){
var this$__$1 = this;
if(cljs.core.truth_(cljs.core.namespace(this$__$1))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Namespaced symbols are not supported",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"input","input",556931961),this$__$1], null));
} else {
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1((function (){var G__73685 = cljs.core.name(this$__$1);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__73685) : f.call(null,G__73685));
})());
}
}));

//# sourceMappingURL=camel_snake_kebab.internals.alter_name.js.map
