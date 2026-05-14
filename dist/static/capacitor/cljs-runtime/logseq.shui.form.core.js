goog.provide('logseq.shui.form.core');
logseq.shui.form.core.form_provider = logseq.shui.util.lsui_wrap("Form",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.form_field_SINGLEQUOTE_ = logseq.shui.util.lsui_wrap("FormField",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.form_field = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__73318__delegate = function (render_SINGLEQUOTE_,args){
var vec__73268 = ((cljs.core.map_QMARK_(render_SINGLEQUOTE_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [render_SINGLEQUOTE_,cljs.core.first(args)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(args),render_SINGLEQUOTE_], null));
var props = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73268,(0),null);
var render_SINGLEQUOTE___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73268,(1),null);
var _ = ((cljs.core.contains_QMARK_(props,new cljs.core.Keyword(null,"name","name",1843675177)))?null:(function(){throw (new Error(["Assert failed: ",":name is required for <ui/form-field>","\n","(contains? props :name)"].join('')))})());
var render = (function (ctx){
var G__73284 = cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(ctx.field);
var G__73285 = (function (){var G__73288 = ctx.fieldState;
var G__73288__$1 = (((G__73288 == null))?null:G__73288.error);
if((G__73288__$1 == null)){
return null;
} else {
return cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(G__73288__$1);
}
})();
var G__73286 = cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(ctx.fieldState);
var G__73287 = ctx;
return (render_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$4 ? render_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$4(G__73284,G__73285,G__73286,G__73287) : render_SINGLEQUOTE___$1.call(null,G__73284,G__73285,G__73286,G__73287));
});
return daiquiri.interpreter.interpret((function (){var G__73293 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword(null,"render","render",-1408033454),render);
return (logseq.shui.form.core.form_field_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.form_field_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(G__73293) : logseq.shui.form.core.form_field_SINGLEQUOTE_.call(null,G__73293));
})());
};
var G__73318 = function (render_SINGLEQUOTE_,var_args){
var args = null;
if (arguments.length > 1) {
var G__73327__i = 0, G__73327__a = new Array(arguments.length -  1);
while (G__73327__i < G__73327__a.length) {G__73327__a[G__73327__i] = arguments[G__73327__i + 1]; ++G__73327__i;}
  args = new cljs.core.IndexedSeq(G__73327__a,0,null);
} 
return G__73318__delegate.call(this,render_SINGLEQUOTE_,args);};
G__73318.cljs$lang$maxFixedArity = 1;
G__73318.cljs$lang$applyTo = (function (arglist__73328){
var render_SINGLEQUOTE_ = cljs.core.first(arglist__73328);
var args = cljs.core.rest(arglist__73328);
return G__73318__delegate(render_SINGLEQUOTE_,args);
});
G__73318.cljs$core$IFn$_invoke$arity$variadic = G__73318__delegate;
return G__73318;
})()
,null,"logseq.shui.form.core/form-field");
logseq.shui.form.core.form_control = logseq.shui.util.lsui_wrap("FormControl",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.yup = logseq.shui.util.lsui_get("yup");
logseq.shui.form.core.yup_resolver = logseq.shui.util.lsui_get("yupResolver");
logseq.shui.form.core.use_form_SINGLEQUOTE_ = logseq.shui.util.lsui_get("useForm");
logseq.shui.form.core.use_form_context = logseq.shui.util.lsui_get("useFormContext");
logseq.shui.form.core.use_form = (function logseq$shui$form$core$use_form(var_args){
var G__73306 = arguments.length;
switch (G__73306) {
case 0:
return logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$1 = (function (opts){
var yup_schema = new cljs.core.Keyword(null,"yupSchema","yupSchema",-1266946445).cljs$core$IFn$_invoke$arity$1(opts);
var methods$ = (function (){var G__73314 = cljs_bean.core.__GT_js((function (){var G__73316 = opts;
if((!((yup_schema == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__73316,new cljs.core.Keyword(null,"resolver","resolver",-1740553583),(logseq.shui.form.core.yup_resolver.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.yup_resolver.cljs$core$IFn$_invoke$arity$1(yup_schema) : logseq.shui.form.core.yup_resolver.call(null,yup_schema)));
} else {
return G__73316;
}
})());
return (logseq.shui.form.core.use_form_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.use_form_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(G__73314) : logseq.shui.form.core.use_form_SINGLEQUOTE_.call(null,G__73314));
})();
return cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(methods$);
}));

(logseq.shui.form.core.use_form.cljs$lang$maxFixedArity = 1);

logseq.shui.form.core.form_item = logseq.shui.util.lsui_wrap("FormItem");
logseq.shui.form.core.form_label = logseq.shui.util.lsui_wrap("FormLabel");
logseq.shui.form.core.form_description = logseq.shui.util.lsui_wrap("FormDescription");
logseq.shui.form.core.form_message = logseq.shui.util.lsui_wrap("FormMessage");
logseq.shui.form.core.input = logseq.shui.util.lsui_wrap("Input");
logseq.shui.form.core.textarea = logseq.shui.util.lsui_wrap("Textarea");
logseq.shui.form.core.switch$ = logseq.shui.util.lsui_wrap("Switch");
logseq.shui.form.core.checkbox = logseq.shui.util.lsui_wrap("Checkbox");
logseq.shui.form.core.radio_group = logseq.shui.util.lsui_wrap("RadioGroup");
logseq.shui.form.core.radio_group_item = logseq.shui.util.lsui_wrap("RadioGroupItem");

//# sourceMappingURL=logseq.shui.form.core.js.map
