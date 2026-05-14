goog.provide('extend_clj.core');

/**
 * @interface
 */
extend_clj.core.IAtom3 = function(){};

var extend_clj$core$IAtom3$deref_impl$dyn_43666 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (extend_clj.core.deref_impl[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (extend_clj.core.deref_impl["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IAtom3.deref-impl",this$);
}
}
});
extend_clj.core.deref_impl = (function extend_clj$core$deref_impl(this$){
if((((!((this$ == null)))) && ((!((this$.extend_clj$core$IAtom3$deref_impl$arity$1 == null)))))){
return this$.extend_clj$core$IAtom3$deref_impl$arity$1(this$);
} else {
return extend_clj$core$IAtom3$deref_impl$dyn_43666(this$);
}
});

var extend_clj$core$IAtom3$compare_and_set_impl$dyn_43667 = (function (this$,oldv,newv){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (extend_clj.core.compare_and_set_impl[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,oldv,newv) : m__5351__auto__.call(null,this$,oldv,newv));
} else {
var m__5349__auto__ = (extend_clj.core.compare_and_set_impl["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,oldv,newv) : m__5349__auto__.call(null,this$,oldv,newv));
} else {
throw cljs.core.missing_protocol("IAtom3.compare-and-set-impl",this$);
}
}
});
extend_clj.core.compare_and_set_impl = (function extend_clj$core$compare_and_set_impl(this$,oldv,newv){
if((((!((this$ == null)))) && ((!((this$.extend_clj$core$IAtom3$compare_and_set_impl$arity$3 == null)))))){
return this$.extend_clj$core$IAtom3$compare_and_set_impl$arity$3(this$,oldv,newv);
} else {
return extend_clj$core$IAtom3$compare_and_set_impl$dyn_43667(this$,oldv,newv);
}
});

var extend_clj$core$IAtom3$validate$dyn_43669 = (function (this$,validator,value){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (extend_clj.core.validate[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,validator,value) : m__5351__auto__.call(null,this$,validator,value));
} else {
var m__5349__auto__ = (extend_clj.core.validate["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,validator,value) : m__5349__auto__.call(null,this$,validator,value));
} else {
throw cljs.core.missing_protocol("IAtom3.validate",this$);
}
}
});
extend_clj.core.validate = (function extend_clj$core$validate(this$,validator,value){
if((((!((this$ == null)))) && ((!((this$.extend_clj$core$IAtom3$validate$arity$3 == null)))))){
return this$.extend_clj$core$IAtom3$validate$arity$3(this$,validator,value);
} else {
return extend_clj$core$IAtom3$validate$dyn_43669(this$,validator,value);
}
});

var extend_clj$core$IAtom3$notify_watches$dyn_43670 = (function (this$,oldv,newv){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (extend_clj.core.notify_watches[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,oldv,newv) : m__5351__auto__.call(null,this$,oldv,newv));
} else {
var m__5349__auto__ = (extend_clj.core.notify_watches["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,oldv,newv) : m__5349__auto__.call(null,this$,oldv,newv));
} else {
throw cljs.core.missing_protocol("IAtom3.notify-watches",this$);
}
}
});
extend_clj.core.notify_watches = (function extend_clj$core$notify_watches(this$,oldv,newv){
if((((!((this$ == null)))) && ((!((this$.extend_clj$core$IAtom3$notify_watches$arity$3 == null)))))){
return this$.extend_clj$core$IAtom3$notify_watches$arity$3(this$,oldv,newv);
} else {
return extend_clj$core$IAtom3$notify_watches$dyn_43670(this$,oldv,newv);
}
});

var extend_clj$core$IAtom3$swap_STAR_$dyn_43671 = (function (this$,f,args){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (extend_clj.core.swap_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,f,args) : m__5351__auto__.call(null,this$,f,args));
} else {
var m__5349__auto__ = (extend_clj.core.swap_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,f,args) : m__5349__auto__.call(null,this$,f,args));
} else {
throw cljs.core.missing_protocol("IAtom3.swap*",this$);
}
}
});
extend_clj.core.swap_STAR_ = (function extend_clj$core$swap_STAR_(this$,f,args){
if((((!((this$ == null)))) && ((!((this$.extend_clj$core$IAtom3$swap_STAR_$arity$3 == null)))))){
return this$.extend_clj$core$IAtom3$swap_STAR_$arity$3(this$,f,args);
} else {
return extend_clj$core$IAtom3$swap_STAR_$dyn_43671(this$,f,args);
}
});


//# sourceMappingURL=extend_clj.core.js.map
