goog.provide('malli.edn');
malli.edn._var_symbol = (function malli$edn$_var_symbol(s){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(["#'",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join(''));
});
malli.edn._fail_BANG_ = (function malli$edn$_fail_BANG_(s){
return (function (v){
return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.edn","var-parsing-not-supported","malli.edn/var-parsing-not-supported",-283037656),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"var","var",-769682797),malli.edn._var_symbol(v),new cljs.core.Keyword(null,"string","string",-1989541586),s], null));
});
});
malli.edn._parse_string = (function malli$edn$_parse_string(var_args){
var G__73592 = arguments.length;
switch (G__73592) {
case 1:
return malli.edn._parse_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.edn._parse_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.edn._parse_string.cljs$core$IFn$_invoke$arity$1 = (function (x){
return malli.edn._parse_string.cljs$core$IFn$_invoke$arity$2(x,null);
}));

(malli.edn._parse_string.cljs$core$IFn$_invoke$arity$2 = (function (x,options){
return edamame.core.parse_string.cljs$core$IFn$_invoke$arity$2(x,(function (){var or__5002__auto__ = options;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"regex","regex",939488856),true,new cljs.core.Keyword(null,"fn","fn",-1175266204),true,new cljs.core.Keyword(null,"var","var",-769682797),malli.edn._fail_BANG_(x)], null);
}
})());
}));

(malli.edn._parse_string.cljs$lang$maxFixedArity = 2);

malli.edn.write_string = (function malli$edn$write_string(var_args){
var G__73606 = arguments.length;
switch (G__73606) {
case 1:
return malli.edn.write_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.edn.write_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.edn.write_string.cljs$core$IFn$_invoke$arity$1 = (function (_QMARK_schema){
return malli.edn.write_string.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,null);
}));

(malli.edn.write_string.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_schema,options){
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([malli.core.form.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,options)], 0));
}));

(malli.edn.write_string.cljs$lang$maxFixedArity = 2);

malli.edn.read_string = (function malli$edn$read_string(var_args){
var G__73626 = arguments.length;
switch (G__73626) {
case 1:
return malli.edn.read_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.edn.read_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.edn.read_string.cljs$core$IFn$_invoke$arity$1 = (function (form){
return malli.edn.read_string.cljs$core$IFn$_invoke$arity$2(form,null);
}));

(malli.edn.read_string.cljs$core$IFn$_invoke$arity$2 = (function (form,p__73629){
var map__73636 = p__73629;
var map__73636__$1 = cljs.core.__destructure_map(map__73636);
var options = map__73636__$1;
var edamame_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73636__$1,new cljs.core.Keyword("malli.edn","edamame-options","malli.edn/edamame-options",1062392066));
return malli.core.schema.cljs$core$IFn$_invoke$arity$2(malli.edn._parse_string.cljs$core$IFn$_invoke$arity$2(form,edamame_options),options);
}));

(malli.edn.read_string.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=malli.edn.js.map
