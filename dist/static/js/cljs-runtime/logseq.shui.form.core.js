goog.provide('logseq.shui.form.core');
logseq.shui.form.core.form_provider = logseq.shui.util.lsui_wrap("Form",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.form_field_SINGLEQUOTE_ = logseq.shui.util.lsui_wrap("FormField",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.form_field = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__74362__delegate = function (render_SINGLEQUOTE_,args){
var vec__74315 = ((cljs.core.map_QMARK_(render_SINGLEQUOTE_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [render_SINGLEQUOTE_,cljs.core.first(args)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(args),render_SINGLEQUOTE_], null));
var props = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74315,(0),null);
var render_SINGLEQUOTE___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74315,(1),null);
var _ = ((cljs.core.contains_QMARK_(props,new cljs.core.Keyword(null,"name","name",1843675177)))?null:(function(){throw (new Error(["Assert failed: ",":name is required for <ui/form-field>","\n","(contains? props :name)"].join('')))})());
var render = (function (ctx){
var G__74321 = cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(ctx.field);
var G__74322 = (function (){var G__74325 = ctx.fieldState;
var G__74325__$1 = (((G__74325 == null))?null:G__74325.error);
if((G__74325__$1 == null)){
return null;
} else {
return cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(G__74325__$1);
}
})();
var G__74323 = cljs_bean.core.bean.cljs$core$IFn$_invoke$arity$1(ctx.fieldState);
var G__74324 = ctx;
return (render_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$4 ? render_SINGLEQUOTE___$1.cljs$core$IFn$_invoke$arity$4(G__74321,G__74322,G__74323,G__74324) : render_SINGLEQUOTE___$1.call(null,G__74321,G__74322,G__74323,G__74324));
});
return daiquiri.interpreter.interpret((function (){var G__74332 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword(null,"render","render",-1408033454),render);
return (logseq.shui.form.core.form_field_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.form_field_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(G__74332) : logseq.shui.form.core.form_field_SINGLEQUOTE_.call(null,G__74332));
})());
};
var G__74362 = function (render_SINGLEQUOTE_,var_args){
var args = null;
if (arguments.length > 1) {
var G__74366__i = 0, G__74366__a = new Array(arguments.length -  1);
while (G__74366__i < G__74366__a.length) {G__74366__a[G__74366__i] = arguments[G__74366__i + 1]; ++G__74366__i;}
  args = new cljs.core.IndexedSeq(G__74366__a,0,null);
} 
return G__74362__delegate.call(this,render_SINGLEQUOTE_,args);};
G__74362.cljs$lang$maxFixedArity = 1;
G__74362.cljs$lang$applyTo = (function (arglist__74367){
var render_SINGLEQUOTE_ = cljs.core.first(arglist__74367);
var args = cljs.core.rest(arglist__74367);
return G__74362__delegate(render_SINGLEQUOTE_,args);
});
G__74362.cljs$core$IFn$_invoke$arity$variadic = G__74362__delegate;
return G__74362;
})()
,null,"logseq.shui.form.core/form-field");
logseq.shui.form.core.form_control = logseq.shui.util.lsui_wrap("FormControl",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"static?","static?",-1639874822),false], null));
logseq.shui.form.core.yup = logseq.shui.util.lsui_get("yup");
logseq.shui.form.core.yup_resolver = logseq.shui.util.lsui_get("yupResolver");
logseq.shui.form.core.use_form_SINGLEQUOTE_ = logseq.shui.util.lsui_get("useForm");
logseq.shui.form.core.use_form_context = logseq.shui.util.lsui_get("useFormContext");
logseq.shui.form.core.use_form = (function logseq$shui$form$core$use_form(var_args){
var G__74342 = arguments.length;
switch (G__74342) {
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
var methods$ = (function (){var G__74348 = cljs_bean.core.__GT_js((function (){var G__74349 = opts;
if((!((yup_schema == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74349,new cljs.core.Keyword(null,"resolver","resolver",-1740553583),(logseq.shui.form.core.yup_resolver.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.yup_resolver.cljs$core$IFn$_invoke$arity$1(yup_schema) : logseq.shui.form.core.yup_resolver.call(null,yup_schema)));
} else {
return G__74349;
}
})());
return (logseq.shui.form.core.use_form_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.use_form_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(G__74348) : logseq.shui.form.core.use_form_SINGLEQUOTE_.call(null,G__74348));
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
