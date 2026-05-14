goog.provide('frontend.components.onboarding.quick_tour');
frontend.components.onboarding.quick_tour.load_base_assets$ = (function frontend$components$onboarding$quick_tour$load_base_assets$(){
return frontend.util.js_load$([frontend.util.JS_ROOT,"/shepherd.min.js"].join(''));
});
frontend.components.onboarding.quick_tour.make_skip_fns = (function frontend$components$onboarding$quick_tour$make_skip_fns(jsTour){
var el = document.createElement("button");
el.classList.add("cp__onboarding-skip-quick-tour");

(el.innerHTML = hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.ti.ti-player-skip-forward","i.ti.ti-player-skip-forward",77204923)], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-skip","on-boarding/quick-tour-btn-skip",-1960098833)], 0))], null)));

el.addEventListener("click",(function (){
return jsTour.cancel();
}));

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){
return document.body.appendChild(el);
}),(function (){
return document.body.removeChild(el);
})], null);
});
frontend.components.onboarding.quick_tour.wait_target = (function frontend$components$onboarding$quick_tour$wait_target(fn_or_selector,time){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((typeof fn_or_selector === 'string')?(function (){
return document.querySelector(dommy.core.selector(fn_or_selector));
}):fn_or_selector)),(function (action){
return promesa.protocols._mcat(promesa.protocols._promise((action.cljs$core$IFn$_invoke$arity$0 ? action.cljs$core$IFn$_invoke$arity$0() : action.call(null))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1(time)),(function (___$1){
return promesa.impl.resolved(null);
}));
}));
}));
}));
});
frontend.components.onboarding.quick_tour.inject_steps_indicator = (function frontend$components$onboarding$quick_tour$inject_steps_indicator(current,total){
return hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.steps","div.steps",-1177755215),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-steps","on-boarding/quick-tour-steps",-850478446)], 0))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(current)].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),(function (){var iter__5480__auto__ = (function frontend$components$onboarding$quick_tour$inject_steps_indicator_$_iter__91212(s__91213){
return (new cljs.core.LazySeq(null,(function (){
var s__91213__$1 = s__91213;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91213__$1);
if(temp__5804__auto__){
var s__91213__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91213__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91213__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91215 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91214 = (0);
while(true){
if((i__91214 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__91214);
cljs.core.chunk_append(b__91215,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current,(i + (1))))?"active":null)], null),i], null));

var G__91275 = (i__91214 + (1));
i__91214 = G__91275;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91215),frontend$components$onboarding$quick_tour$inject_steps_indicator_$_iter__91212(cljs.core.chunk_rest(s__91213__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91215),null);
}
} else {
var i = cljs.core.first(s__91213__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current,(i + (1))))?"active":null)], null),i], null),frontend$components$onboarding$quick_tour$inject_steps_indicator_$_iter__91212(cljs.core.rest(s__91213__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1(total));
})()], null)], null));
});
frontend.components.onboarding.quick_tour.create_steps_BANG_ = (function frontend$components$onboarding$quick_tour$create_steps_BANG_(jsTour){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),"nav-help",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-help-title","on-boarding/quick-tour-help-title",-938594904)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-help-desc","on-boarding/quick-tour-help-desc",816986425)], 0))], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".cp__sidebar-help-btn",new cljs.core.Keyword(null,"on","on",173873944),"top"], null),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887)))){
return frontend.components.onboarding.quick_tour.wait_target(frontend.state.hide_right_sidebar_BANG_,(700));
} else {
return promesa.core.resolved(true);
}
}),new cljs.core.Keyword(null,"canClickTarget","canClickTarget",-330036997),true,new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-next","on-boarding/quick-tour-btn-next",1544164990)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.next], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(10)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),"nav-journal-page",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-journal-page-title","on-boarding/quick-tour-journal-page-title",-456062514)], 0))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-journal-page-desc-1","on-boarding/quick-tour-journal-page-desc-1",-670416006)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-journal-page-desc-2","on-boarding/quick-tour-journal-page-desc-2",-5735671)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-journal-page-desc-3","on-boarding/quick-tour-journal-page-desc-3",504661280)], 0))], null)], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".page.is-journals .page-title",new cljs.core.Keyword(null,"on","on",173873944),"top-end"], null),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
if((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.safe_lower_case(frontend.state.get_current_page()),frontend.util.safe_lower_case(frontend.date.today()))))){
return frontend.components.onboarding.quick_tour.wait_target((function (){
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.date.today());

return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$0();
}),(200));
} else {
return promesa.core.resolved(true);
}
}),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-back","on-boarding/quick-tour-btn-back",774475157)], 0)),new cljs.core.Keyword(null,"classes","classes",2037804510),"back",new cljs.core.Keyword(null,"action","action",-811238024),jsTour.back], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-next","on-boarding/quick-tour-btn-next",1544164990)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.next], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(63)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(10),(10)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),"nav-left-sidebar",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-left-sidebar-title","on-boarding/quick-tour-left-sidebar-title",-443601505)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-left-sidebar-desc","on-boarding/quick-tour-left-sidebar-desc",-296940269)], 0))], null)], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),"#left-menu",new cljs.core.Keyword(null,"on","on",173873944),"top"], null),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
return promesa.core.resolved(true);
}),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-back","on-boarding/quick-tour-btn-back",774475157)], 0)),new cljs.core.Keyword(null,"classes","classes",2037804510),"back",new cljs.core.Keyword(null,"action","action",-811238024),jsTour.back], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-next","on-boarding/quick-tour-btn-next",1544164990)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.next], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(10),(10)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"nav-favorites",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-favorites-title","on-boarding/quick-tour-favorites-title",-302863655)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-favorites-desc-1","on-boarding/quick-tour-favorites-desc-1",789212905)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-favorites-desc-2","on-boarding/quick-tour-favorites-desc-2",-1095748497)], 0))], null)], null)),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
if(cljs.core.not(frontend.state.sub(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728)))){
return frontend.components.onboarding.quick_tour.wait_target(frontend.state.toggle_left_sidebar_BANG_,(500));
} else {
return promesa.core.resolved(true);
}
}),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".nav-content-item.favorites",new cljs.core.Keyword(null,"on","on",173873944),"right"], null),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-back","on-boarding/quick-tour-btn-back",774475157)], 0)),new cljs.core.Keyword(null,"classes","classes",2037804510),"back",new cljs.core.Keyword(null,"action","action",-811238024),jsTour.back], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","quick-tour-btn-finish","on-boarding/quick-tour-btn-finish",-162889014)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.complete], null)], null)], null)], null);
});
frontend.components.onboarding.quick_tour.create_steps_file_sync_BANG_ = (function frontend$components$onboarding$quick_tour$create_steps_file_sync_BANG_(jsTour){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),"sync-initiate",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"\uD83D\uDE80 Initiate synchronization of your current graph"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Clicking here will start the process of uploading your local files to an encrypted remote graph."], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".cp__file-sync-indicator",new cljs.core.Keyword(null,"on","on",173873944),"bottom"], null),new cljs.core.Keyword(null,"canClickTarget","canClickTarget",-330036997),true,new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),"Cancel",new cljs.core.Keyword(null,"classes","classes",2037804510),"bg-gray",new cljs.core.Keyword(null,"action","action",-811238024),(function (){
return jsTour.hide();
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"Continue",new cljs.core.Keyword(null,"action","action",-811238024),(function (){
var G__91223_91276 = document.querySelector(".cp__file-sync-indicator a.button");
if((G__91223_91276 == null)){
} else {
G__91223_91276.click();
}

return jsTour.hide();
})], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(15)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),"sync-learn",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"\uD83D\uDCA1 Learn about your sync status"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Click here to see the progress of your local graph being synced with the cloud."], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".cp__file-sync-indicator",new cljs.core.Keyword(null,"on","on",173873944),"bottom"], null),new cljs.core.Keyword(null,"canClickTarget","canClickTarget",-330036997),true,new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"Got it!",new cljs.core.Keyword(null,"action","action",-811238024),(function (){
jsTour.hide();

return setTimeout((function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","maybe-onboarding-show","file-sync/maybe-onboarding-show",1562674517),new cljs.core.Keyword(null,"congrats","congrats",1128523125)], null));
}),(3000));
})], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(15)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),"sync-history",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"\u23F1 Go back in time!"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"With file sync you can now go through older versions of this page and revert back to them if you like!"], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".cp__btn_history_version",new cljs.core.Keyword(null,"on","on",173873944),(cljs.core.truth_(frontend.util.mobile_QMARK_())?"bottom":"left")], null),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
var temp__5804__auto__ = document.querySelector(".toolbar-dots-btn");
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
target.click();

return promesa.core.delay.cljs$core$IFn$_invoke$arity$1((300));
} else {
return null;
}
}),new cljs.core.Keyword(null,"canClickTarget","canClickTarget",-330036997),true,new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"Got it!",new cljs.core.Keyword(null,"action","action",-811238024),jsTour.hide], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(15)], null)], null)], null)], null)], null)], null)], null);
});
frontend.components.onboarding.quick_tour.create_steps_whiteboard_BANG_ = (function frontend$components$onboarding$quick_tour$create_steps_whiteboard_BANG_(jsTour){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),"whiteboard-home",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-home","on-boarding/tour-whiteboard-home",884175557),"\uD83D\uDDBC"], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-home-description","on-boarding/tour-whiteboard-home-description",-1599967102)], 0))], null)], null)),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".nav-header .whiteboard",new cljs.core.Keyword(null,"on","on",173873944),"right"], null),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728)))){
} else {
frontend.state.toggle_left_sidebar_BANG_();
}

frontend.components.onboarding.quick_tour.wait_target(".nav-header .whiteboard",(500));

return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$0();
}),new cljs.core.Keyword(null,"canClickTarget","canClickTarget",-330036997),true,new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-btn-next","on-boarding/tour-whiteboard-btn-next",1268653819)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.next], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(10)], null)], null)], null)], null)], null)], null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),"whiteboard-new",new cljs.core.Keyword(null,"text","text",-1790561697),hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-new","on-boarding/tour-whiteboard-new",-1625852557),"\uD83C\uDD95\uFE0F"], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-new-description","on-boarding/tour-whiteboard-new-description",1657645187)], 0))], null)], null)),new cljs.core.Keyword(null,"beforeShowPromise","beforeShowPromise",95458831),(function (){
frontend.handler.route.redirect_to_whiteboard_dashboard_BANG_();

return frontend.components.onboarding.quick_tour.wait_target(".dashboard-create-card",(500));
}),new cljs.core.Keyword(null,"attachTo","attachTo",1933584096),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"element","element",1974019749),".dashboard-create-card",new cljs.core.Keyword(null,"on","on",173873944),"bottom"], null),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-btn-back","on-boarding/tour-whiteboard-btn-back",520581138)], 0)),new cljs.core.Keyword(null,"classes","classes",2037804510),"back",new cljs.core.Keyword(null,"action","action",-811238024),jsTour.back], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","tour-whiteboard-btn-finish","on-boarding/tour-whiteboard-btn-finish",-1523774350)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),jsTour.complete], null)], null),new cljs.core.Keyword(null,"popperOptions","popperOptions",-1545017134),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"preventOverflow",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),(20)], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"offset",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"offset","offset",296498311),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(10)], null)], null)], null)], null)], null)], null)], null);
});
frontend.components.onboarding.quick_tour.start = (function frontend$components$onboarding$quick_tour$start(){
var jsTour = (new Shepherd.Tour(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"useModalOverlay","useModalOverlay",-1323895540),true,new cljs.core.Keyword(null,"defaultStepOptions","defaultStepOptions",-1042424443),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),"cp__onboarding-quick-tour",new cljs.core.Keyword(null,"scrollTo","scrollTo",-658970728),false], null)], null))));
var steps = frontend.components.onboarding.quick_tour.create_steps_BANG_(jsTour);
var steps__$1 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (p1__91230_SHARP_,p2__91229_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p2__91229_SHARP_,new cljs.core.Keyword(null,"text","text",-1790561697),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(p2__91229_SHARP_)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.components.onboarding.quick_tour.inject_steps_indicator((p1__91230_SHARP_ + (1)),cljs.core.count(steps)))].join(''));
}),steps);
var vec__91234 = frontend.components.onboarding.quick_tour.make_skip_fns(jsTour);
var show_skip_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91234,(0),null);
var hide_skip_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91234,(1),null);
var G__91239_91277 = jsTour;
G__91239_91277.on("show",show_skip_BANG_);

G__91239_91277.on("hide",hide_skip_BANG_);

G__91239_91277.on("complete",hide_skip_BANG_);

G__91239_91277.on("cancel",hide_skip_BANG_);


var seq__91240_91278 = cljs.core.seq(steps__$1);
var chunk__91242_91279 = null;
var count__91243_91280 = (0);
var i__91244_91281 = (0);
while(true){
if((i__91244_91281 < count__91243_91280)){
var step_91282 = chunk__91242_91279.cljs$core$IIndexed$_nth$arity$2(null,i__91244_91281);
jsTour.addStep(cljs_bean.core.__GT_js(step_91282));


var G__91283 = seq__91240_91278;
var G__91284 = chunk__91242_91279;
var G__91285 = count__91243_91280;
var G__91286 = (i__91244_91281 + (1));
seq__91240_91278 = G__91283;
chunk__91242_91279 = G__91284;
count__91243_91280 = G__91285;
i__91244_91281 = G__91286;
continue;
} else {
var temp__5804__auto___91287 = cljs.core.seq(seq__91240_91278);
if(temp__5804__auto___91287){
var seq__91240_91288__$1 = temp__5804__auto___91287;
if(cljs.core.chunked_seq_QMARK_(seq__91240_91288__$1)){
var c__5525__auto___91289 = cljs.core.chunk_first(seq__91240_91288__$1);
var G__91290 = cljs.core.chunk_rest(seq__91240_91288__$1);
var G__91291 = c__5525__auto___91289;
var G__91292 = cljs.core.count(c__5525__auto___91289);
var G__91293 = (0);
seq__91240_91278 = G__91290;
chunk__91242_91279 = G__91291;
count__91243_91280 = G__91292;
i__91244_91281 = G__91293;
continue;
} else {
var step_91294 = cljs.core.first(seq__91240_91288__$1);
jsTour.addStep(cljs_bean.core.__GT_js(step_91294));


var G__91295 = cljs.core.next(seq__91240_91288__$1);
var G__91296 = null;
var G__91297 = (0);
var G__91298 = (0);
seq__91240_91278 = G__91295;
chunk__91242_91279 = G__91296;
count__91243_91280 = G__91297;
i__91244_91281 = G__91298;
continue;
}
} else {
}
}
break;
}

return jsTour.start();
});
frontend.components.onboarding.quick_tour.start_file_sync = (function frontend$components$onboarding$quick_tour$start_file_sync(type){
var jsTour = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
var jsTour__$1 = (function (){var or__5002__auto__ = jsTour;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var inst = (new Shepherd.Tour(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"useModalOverlay","useModalOverlay",-1323895540),true,new cljs.core.Keyword(null,"defaultStepOptions","defaultStepOptions",-1042424443),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),"cp__onboarding-quick-tour ignore-outside-event",new cljs.core.Keyword(null,"scrollTo","scrollTo",-658970728),false], null)], null))));
var steps = frontend.components.onboarding.quick_tour.create_steps_file_sync_BANG_(inst);
inst.on("show",(function (){
return setTimeout((function (){
var step = inst.currentStep;
var temp__5804__auto__ = (function (){var and__5000__auto__ = step;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = step.el.classList.contains("ignore-outside-event");
if(cljs.core.truth_(and__5000__auto____$1)){
return document.querySelector(".shepherd-modal-overlay-container");
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var overlay = temp__5804__auto__;
overlay.classList.add("ignore-outside-event");

var G__91255 = step.target;
if((G__91255 == null)){
return null;
} else {
return G__91255.addEventListener("click",(function (){
return inst.hide();
}));
}
} else {
return null;
}
}),(1000));
}));

var seq__91256_91299 = cljs.core.seq(steps);
var chunk__91257_91300 = null;
var count__91258_91301 = (0);
var i__91259_91302 = (0);
while(true){
if((i__91259_91302 < count__91258_91301)){
var step_91303 = chunk__91257_91300.cljs$core$IIndexed$_nth$arity$2(null,i__91259_91302);
inst.addStep(cljs_bean.core.__GT_js(step_91303));


var G__91304 = seq__91256_91299;
var G__91305 = chunk__91257_91300;
var G__91306 = count__91258_91301;
var G__91307 = (i__91259_91302 + (1));
seq__91256_91299 = G__91304;
chunk__91257_91300 = G__91305;
count__91258_91301 = G__91306;
i__91259_91302 = G__91307;
continue;
} else {
var temp__5804__auto___91308 = cljs.core.seq(seq__91256_91299);
if(temp__5804__auto___91308){
var seq__91256_91309__$1 = temp__5804__auto___91308;
if(cljs.core.chunked_seq_QMARK_(seq__91256_91309__$1)){
var c__5525__auto___91310 = cljs.core.chunk_first(seq__91256_91309__$1);
var G__91311 = cljs.core.chunk_rest(seq__91256_91309__$1);
var G__91312 = c__5525__auto___91310;
var G__91313 = cljs.core.count(c__5525__auto___91310);
var G__91314 = (0);
seq__91256_91299 = G__91311;
chunk__91257_91300 = G__91312;
count__91258_91301 = G__91313;
i__91259_91302 = G__91314;
continue;
} else {
var step_91315 = cljs.core.first(seq__91256_91309__$1);
inst.addStep(cljs_bean.core.__GT_js(step_91315));


var G__91316 = cljs.core.next(seq__91256_91309__$1);
var G__91317 = null;
var G__91318 = (0);
var G__91319 = (0);
seq__91256_91299 = G__91316;
chunk__91257_91300 = G__91317;
count__91258_91301 = G__91318;
i__91259_91302 = G__91319;
continue;
}
} else {
}
}
break;
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291),inst);

return inst;
}
})();
return setTimeout((function (){
return jsTour__$1.show(cljs.core.name(type));
}),(200));
});
frontend.components.onboarding.quick_tour.start_whiteboard = (function frontend$components$onboarding$quick_tour$start_whiteboard(){
var jsTour = (new Shepherd.Tour(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"useModalOverlay","useModalOverlay",-1323895540),true,new cljs.core.Keyword(null,"defaultStepOptions","defaultStepOptions",-1042424443),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),"cp__onboarding-quick-tour",new cljs.core.Keyword(null,"scrollTo","scrollTo",-658970728),false], null)], null))));
var steps = frontend.components.onboarding.quick_tour.create_steps_whiteboard_BANG_(jsTour);
var steps__$1 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (p1__91261_SHARP_,p2__91260_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p2__91260_SHARP_,new cljs.core.Keyword(null,"text","text",-1790561697),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(p2__91260_SHARP_)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.components.onboarding.quick_tour.inject_steps_indicator((p1__91261_SHARP_ + (1)),cljs.core.count(steps)))].join(''));
}),steps);
var vec__91262 = frontend.components.onboarding.quick_tour.make_skip_fns(jsTour);
var show_skip_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91262,(0),null);
var hide_skip_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91262,(1),null);
var G__91266_91320 = jsTour;
G__91266_91320.on("show",show_skip_BANG_);

G__91266_91320.on("hide",hide_skip_BANG_);

G__91266_91320.on("complete",hide_skip_BANG_);

G__91266_91320.on("cancel",hide_skip_BANG_);


var seq__91267_91321 = cljs.core.seq(steps__$1);
var chunk__91268_91322 = null;
var count__91269_91323 = (0);
var i__91270_91324 = (0);
while(true){
if((i__91270_91324 < count__91269_91323)){
var step_91325 = chunk__91268_91322.cljs$core$IIndexed$_nth$arity$2(null,i__91270_91324);
jsTour.addStep(cljs_bean.core.__GT_js(step_91325));


var G__91326 = seq__91267_91321;
var G__91327 = chunk__91268_91322;
var G__91328 = count__91269_91323;
var G__91329 = (i__91270_91324 + (1));
seq__91267_91321 = G__91326;
chunk__91268_91322 = G__91327;
count__91269_91323 = G__91328;
i__91270_91324 = G__91329;
continue;
} else {
var temp__5804__auto___91330 = cljs.core.seq(seq__91267_91321);
if(temp__5804__auto___91330){
var seq__91267_91331__$1 = temp__5804__auto___91330;
if(cljs.core.chunked_seq_QMARK_(seq__91267_91331__$1)){
var c__5525__auto___91332 = cljs.core.chunk_first(seq__91267_91331__$1);
var G__91333 = cljs.core.chunk_rest(seq__91267_91331__$1);
var G__91334 = c__5525__auto___91332;
var G__91335 = cljs.core.count(c__5525__auto___91332);
var G__91336 = (0);
seq__91267_91321 = G__91333;
chunk__91268_91322 = G__91334;
count__91269_91323 = G__91335;
i__91270_91324 = G__91336;
continue;
} else {
var step_91337 = cljs.core.first(seq__91267_91331__$1);
jsTour.addStep(cljs_bean.core.__GT_js(step_91337));


var G__91338 = cljs.core.next(seq__91267_91331__$1);
var G__91339 = null;
var G__91340 = (0);
var G__91341 = (0);
seq__91267_91321 = G__91338;
chunk__91268_91322 = G__91339;
count__91269_91323 = G__91340;
i__91270_91324 = G__91341;
continue;
}
} else {
}
}
break;
}

return jsTour.start();
});
frontend.components.onboarding.quick_tour.ready = (function frontend$components$onboarding$quick_tour$ready(callback){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((((window.Shepherd == null))?frontend.components.onboarding.quick_tour.load_base_assets$():promesa.core.resolved(true)),callback);
});
frontend.components.onboarding.quick_tour.should_guide_QMARK_ = false;
frontend.components.onboarding.quick_tour.init = (function frontend$components$onboarding$quick_tour$init(){
frontend.handler.command_palette.register(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("document","quick-tour","document/quick-tour",-2012804753),new cljs.core.Keyword(null,"desc","desc",2093485764),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","command-palette-quick-tour","on-boarding/command-palette-quick-tour",912103452)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),(function (){
return frontend.components.onboarding.quick_tour.ready(frontend.components.onboarding.quick_tour.start);
})], null));

if(frontend.components.onboarding.quick_tour.should_guide_QMARK_){
return frontend.components.onboarding.quick_tour.ready(frontend.components.onboarding.quick_tour.start);
} else {
return null;
}
});

//# sourceMappingURL=frontend.components.onboarding.quick_tour.js.map
