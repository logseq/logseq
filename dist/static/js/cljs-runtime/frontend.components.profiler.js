goog.provide('frontend.components.profiler');
frontend.components.profiler.profiler = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var profiling_fns = cljs.core.keys(rum.core.react(frontend.handler.profiler._STAR_fn_symbol__GT_origin_fn));
var _STAR_reports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.profiler","reports","frontend.components.profiler/reports",-1287611148));
var _STAR_mem_leak_reports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.profiler","mem-leak-reports","frontend.components.profiler/mem-leak-reports",1356682245));
var _STAR_register_fn_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.profiler","register-fn-name","frontend.components.profiler/register-fn-name",211814967));
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("b",null,["Profiling fns(Only support UI thread now):"]),daiquiri.core.create_element("div",{'className':"pb-4"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$profiler$iter__129062(s__129063){
return (new cljs.core.LazySeq(null,(function (){
var s__129063__$1 = s__129063;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129063__$1);
if(temp__5804__auto__){
var s__129063__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129063__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129063__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129065 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129064 = (0);
while(true){
if((i__129064 < size__5479__auto__)){
var f_name = cljs.core._nth(c__5478__auto__,i__129064);
cljs.core.chunk_append(b__129065,daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-2"},[daiquiri.core.create_element("pre",{'className':"select-text"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(f_name)]),daiquiri.core.create_element("a",{'title':"Unregister",'onPointerDown':((function (i__129064,f_name,c__5478__auto__,size__5479__auto__,b__129065,s__129063__$2,temp__5804__auto__,profiling_fns,_STAR_reports,_STAR_mem_leak_reports,_STAR_register_fn_name){
return (function (e){
frontend.util.stop(e);

return frontend.handler.profiler.unregister_fn_BANG_(f_name);
});})(i__129064,f_name,c__5478__auto__,size__5479__auto__,b__129065,s__129063__$2,temp__5804__auto__,profiling_fns,_STAR_reports,_STAR_mem_leak_reports,_STAR_register_fn_name))
,'className':"inline close flex transition-opacity duration-300 ease-in"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x"))])]));

var G__129113 = (i__129064 + (1));
i__129064 = G__129113;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129065),frontend$components$profiler$iter__129062(cljs.core.chunk_rest(s__129063__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129065),null);
}
} else {
var f_name = cljs.core.first(s__129063__$2);
return cljs.core.cons(daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-2"},[daiquiri.core.create_element("pre",{'className':"select-text"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(f_name)]),daiquiri.core.create_element("a",{'title':"Unregister",'onPointerDown':((function (f_name,s__129063__$2,temp__5804__auto__,profiling_fns,_STAR_reports,_STAR_mem_leak_reports,_STAR_register_fn_name){
return (function (e){
frontend.util.stop(e);

return frontend.handler.profiler.unregister_fn_BANG_(f_name);
});})(f_name,s__129063__$2,temp__5804__auto__,profiling_fns,_STAR_reports,_STAR_mem_leak_reports,_STAR_register_fn_name))
,'className':"inline close flex transition-opacity duration-300 ease-in"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x"))])]),frontend$components$profiler$iter__129062(cljs.core.rest(s__129063__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(profiling_fns);
})())]),(function (){var attrs129029 = (function (){var G__129066 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto__ = (function (){var G__129068 = cljs.core.deref(_STAR_register_fn_name);
if((G__129068 == null)){
return null;
} else {
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(G__129068);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var fn_sym = temp__5804__auto__;
return frontend.handler.profiler.register_fn_BANG_(fn_sym);
} else {
return null;
}
})], null);
var G__129067 = "Register fn";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__129066,G__129067) : logseq.shui.ui.button.call(null,G__129066,G__129067));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129029))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129029], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129029))?[daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(_STAR_register_fn_name,frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"input fn name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"input fn name here",'className':"form-input my-2 py-1"},[])]:[daiquiri.interpreter.interpret(attrs129029),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(_STAR_register_fn_name,frontend.util.evalue(e));
})),'onFocus':(function (e){
var v = e.target.value;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"input fn name here")){
return (e.target.value = "");
} else {
return null;
}
}),'placeholder':"input fn name here",'className':"form-input my-2 py-1"},[])]));
})(),(function (){var attrs129036 = (function (){var G__129069 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
return cljs.core.reset_BANG_(_STAR_reports,frontend.handler.profiler.profile_report());
})], null);
var G__129070 = logseq.shui.ui.tabler_icon("refresh");
var G__129071 = "Refresh reports";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129069,G__129070,G__129071) : logseq.shui.ui.button.call(null,G__129069,G__129070,G__129071));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129036))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","gap-2","flex-wrap","items-center","pb-3"], null)], null),attrs129036], 0))):{'className':"flex gap-2 flex-wrap items-center pb-3"}),((cljs.core.map_QMARK_(attrs129036))?[daiquiri.interpreter.interpret((function (){var G__129075 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
frontend.handler.profiler.reset_report_BANG_();

return cljs.core.reset_BANG_(_STAR_reports,frontend.handler.profiler.profile_report());
})], null);
var G__129076 = logseq.shui.ui.tabler_icon("x");
var G__129077 = "Reset reports";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129075,G__129076,G__129077) : logseq.shui.ui.button.call(null,G__129075,G__129076,G__129077));
})())]:[daiquiri.interpreter.interpret(attrs129036),daiquiri.interpreter.interpret((function (){var G__129081 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
frontend.handler.profiler.reset_report_BANG_();

return cljs.core.reset_BANG_(_STAR_reports,frontend.handler.profiler.profile_report());
})], null);
var G__129082 = logseq.shui.ui.tabler_icon("x");
var G__129083 = "Reset reports";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129081,G__129082,G__129083) : logseq.shui.ui.button.call(null,G__129081,G__129082,G__129083));
})())]));
})(),(function (){var update_time_sum = (function (m){
return cljs.core.update_vals(m,(function (m2){
return cljs.core.update_vals(m2,(function (p1__129020_SHARP_){
return p1__129020_SHARP_.toFixed((6));
}));
}));
});
return daiquiri.core.create_element("div",{'className':"pb-4"},[daiquiri.core.create_element("pre",{'className':"select-text"},[(cljs.core.truth_(cljs.core.deref(_STAR_reports))?(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__129096_129114 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__129097_129115 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__129098_129116 = true;
var _STAR_print_fn_STAR__temp_val__129099_129117 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__129098_129116);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__129099_129117);

try{fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(_STAR_reports),new cljs.core.Keyword(null,"time-sum","time-sum",592043870),update_time_sum),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(20)], null));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__129097_129115);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__129096_129114);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})():null)])]);
})(),daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("b",null,["Atom/Volatile Mem Leak Detect(Only support UI thread now):"]),daiquiri.core.create_element("pre",null,["Only check atoms/volatiles with a value type of `coll`.\nThe report shows refs with coll-size > 5k and atom's watches-count > 1k.\n`ref` means atom or volatile.\n`ref-hash` means `(hash ref)`."]),(function (){var attrs129053 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","reset!","cljs.core/reset!",657404621,null),null,new cljs.core.Symbol("cljs.core","vreset!","cljs.core/vreset!",-1308835928,null),null], null), null),cljs.core.set(profiling_fns)))))?(function (){var G__129100 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.profiler.mem_leak_detect();
})], null);
var G__129101 = "Start to detect";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__129100,G__129101) : logseq.shui.ui.button.call(null,G__129100,G__129101));
})():(function (){var G__129102 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
return cljs.core.reset_BANG_(_STAR_mem_leak_reports,frontend.handler.profiler.mem_leak_report());
})], null);
var G__129103 = logseq.shui.ui.tabler_icon("refresh");
var G__129104 = "Refresh reports";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__129102,G__129103,G__129104) : logseq.shui.ui.button.call(null,G__129102,G__129103,G__129104));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129053))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs129053], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs129053))?null:[daiquiri.interpreter.interpret(attrs129053)]));
})(),daiquiri.core.create_element("pre",{'className':"select-text"},[(cljs.core.truth_(cljs.core.deref(_STAR_mem_leak_reports))?(function (){var ref_hash__GT_ref = new cljs.core.Keyword(null,"ref-hash->ref","ref-hash->ref",92453043).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_mem_leak_reports));
var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__129109_129118 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__129110_129119 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__129111_129120 = true;
var _STAR_print_fn_STAR__temp_val__129112_129121 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__129111_129120);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__129112_129121);

try{fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_mem_leak_reports),new cljs.core.Keyword(null,"ref-hash->ref","ref-hash->ref",92453043)),new cljs.core.Keyword(null,"ref-hash->take-3-items","ref-hash->take-3-items",-1593457432),cljs.core.update_vals(ref_hash__GT_ref,(function (ref){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((3),cljs.core.deref(ref));
})),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ref-hash->take-3-watch-keys","ref-hash->take-3-watch-keys",-776384491),cljs.core.update_vals(ref_hash__GT_ref,(function (ref){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((3),ref.watches);
}))], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(20)], null));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__129110_129119);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__129109_129118);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})():null)])]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.profiler","reports","frontend.components.profiler/reports",-1287611148)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.profiler","mem-leak-reports","frontend.components.profiler/mem-leak-reports",1356682245)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.profiler","register-fn-name","frontend.components.profiler/register-fn-name",211814967))], null),"frontend.components.profiler/profiler");

//# sourceMappingURL=frontend.components.profiler.js.map
