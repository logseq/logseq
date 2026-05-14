goog.provide('frontend.components.settings');
goog.scope(function(){
  frontend.components.settings.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.settings.toggle = (function frontend$components$settings$toggle(var_args){
var args__5732__auto__ = [];
var len__5726__auto___92980 = arguments.length;
var i__5727__auto___92981 = (0);
while(true){
if((i__5727__auto___92981 < len__5726__auto___92980)){
args__5732__auto__.push((arguments[i__5727__auto___92981]));

var G__92982 = (i__5727__auto___92981 + (1));
i__5727__auto___92981 = G__92982;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic = (function (label_for,name,state,on_toggle,p__92791){
var vec__92792 = p__92791;
var detail_text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92792,(0),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),label_for], null),name], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.rounded-md.sm:max-w-tss.sm:col-span-2","div.rounded-md.sm:max-w-tss.sm:col-span-2",-1315636593),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.rounded-md","div.rounded-md",-395116423),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"1rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(state,on_toggle,true),detail_text], null)], null)], null);
}));

(frontend.components.settings.toggle.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.components.settings.toggle.cljs$lang$applyTo = (function (seq92786){
var G__92787 = cljs.core.first(seq92786);
var seq92786__$1 = cljs.core.next(seq92786);
var G__92788 = cljs.core.first(seq92786__$1);
var seq92786__$2 = cljs.core.next(seq92786__$1);
var G__92789 = cljs.core.first(seq92786__$2);
var seq92786__$3 = cljs.core.next(seq92786__$2);
var G__92790 = cljs.core.first(seq92786__$3);
var seq92786__$4 = cljs.core.next(seq92786__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__92787,G__92788,G__92789,G__92790,seq92786__$4);
}));

frontend.components.settings.app_updater = rum.core.lazy_build(rum.core.build_defcs,(function (state,version){
var update_pending_QMARK_ = frontend.state.sub(new cljs.core.Keyword("electron","updater-pending?","electron/updater-pending?",-1675811595));
var map__92795 = frontend.state.sub(new cljs.core.Keyword("electron","updater","electron/updater",454456683));
var map__92795__$1 = cljs.core.__destructure_map(map__92795);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92795__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92795__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
return daiquiri.core.create_element("span",{'className':"cp__settings-app-updater"},[daiquiri.core.create_element("div",{'className':"ctls flex items-center"},[daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2 flex gap-4 items-center flex-wrap"},[(function (){var attrs92801 = (cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","check-for-updates","settings-page/check-for-updates",-915665420)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm mr-1",new cljs.core.Keyword(null,"href","href",-793805698),"https://github.com/logseq/logseq/releases"], 0)):(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","check-for-updates","settings-page/check-for-updates",-915665420)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm mr-1",new cljs.core.Keyword(null,"href","href",-793805698),"https://apps.apple.com/app/logseq/id1601013908"], 0)):(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_(update_pending_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","checking","settings-page/checking",1127502507)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","check-for-updates","settings-page/check-for-updates",-915665420)], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm mr-1",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),update_pending_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.apis.checkForUpdates(false);
})], 0)):null
)));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92801))?daiquiri.interpreter.element_attributes(attrs92801):null),((cljs.core.map_QMARK_(attrs92801))?null:[daiquiri.interpreter.interpret(attrs92801)]));
})(),daiquiri.core.create_element("div",{'title':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","revision","settings-page/revision",339283629)], 0))),frontend.config.revision].join(''),'onClick':(function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Current Revision: ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"target","target",253001721),"_blank",new cljs.core.Keyword(null,"href","href",-793805698),["https://github.com/logseq/logseq/commit/",frontend.config.revision].join('')], null),frontend.config.revision], null)], null),new cljs.core.Keyword(null,"info","info",-317069002),false);
}),'className':"text-sm cursor"},[daiquiri.interpreter.interpret(version)]),daiquiri.core.create_element("a",{'target':"_blank",'href':"https://docs.logseq.com/#/page/changelog",'className':"text-sm fade-link underline inline"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","changelog","settings-page/changelog",-952629289)], 0)))])])]),(cljs.core.truth_((function (){var or__5002__auto__ = update_pending_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(type);
}
})())?null:(function (){var attrs92800 = (function (){var G__92802 = type;
switch (G__92802) {
case "update-not-available":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","app-updated","settings-page/app-updated",-370351656)], 0))], null);

break;
case "update-available":
var map__92803 = payload;
var map__92803__$1 = cljs.core.__destructure_map(map__92803);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92803__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92803__$1,new cljs.core.Keyword(null,"url","url",276297046));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","update-available","settings-page/update-available",-941309384)], 0))),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.link","a.link",-619461443),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
window.apis.openExternal(url);

return frontend.util.stop(e);
})], null),frontend.components.svg.external_link,name," \uD83C\uDF89"], null)], null);

break;
case "error":
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","update-error-1","settings-page/update-error-1",150460179)], 0)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","update-error-2","settings-page/update-error-2",1459224149)], 0)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.link","a.link",-619461443),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
window.apis.openExternal("https://github.com/logseq/logseq/releases");

return frontend.util.stop(e);
})], null),frontend.components.svg.external_link," release channel"], null)], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__92802)].join('')));

}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92800))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["update-state","text-sm"], null)], null),attrs92800], 0))):{'className':"update-state text-sm"}),((cljs.core.map_QMARK_(attrs92800))?null:[daiquiri.interpreter.interpret(attrs92800)]));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/app-updater");
frontend.components.settings.outdenting_hint = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'style':{'boxShadow':"0 4px 20px 4px rgba(0, 20, 60, .1), 0 4px 80px -8px rgba(0, 20, 60, .2)"},'className':"ui__modal-panel"},[daiquiri.core.create_element("div",{'style':{'margin':"12px",'maxWidth':"500px"}},[(function (){var attrs92804 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","preferred-outdenting-tip","settings-page/preferred-outdenting-tip",-1681275706)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92804))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm"], null)], null),attrs92804], 0))):{'className':"text-sm"}),((cljs.core.map_QMARK_(attrs92804))?[daiquiri.core.create_element("a",{'target':"_blank",'href':"https://discuss.logseq.com/t/whats-your-preferred-outdent-behavior-the-direct-one-or-the-logical-one/978",'className':"text-sm"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","preferred-outdenting-tip-more","settings-page/preferred-outdenting-tip-more",301475512)], 0)))])]:[daiquiri.interpreter.interpret(attrs92804),daiquiri.core.create_element("a",{'target':"_blank",'href':"https://discuss.logseq.com/t/whats-your-preferred-outdent-behavior-the-direct-one-or-the-logical-one/978",'className':"text-sm"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","preferred-outdenting-tip-more","settings-page/preferred-outdenting-tip-more",301475512)], 0)))])]));
})(),daiquiri.core.create_element("img",{'src':"https://discuss.logseq.com/uploads/default/original/1X/e8ea82f63a5e01f6d21b5da827927f538f3277b9.gif",'width':(500),'height':(500)},null)])]);
}),null,"frontend.components.settings/outdenting-hint");
frontend.components.settings.auto_expand_hint = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'style':{'boxShadow':"0 4px 20px 4px rgba(0, 20, 60, .1), 0 4px 80px -8px rgba(0, 20, 60, .2)"},'className':"ui__modal-panel"},[daiquiri.core.create_element("div",{'style':{'margin':"12px",'maxWidth':"500px"}},[(function (){var attrs92807 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","auto-expand-block-refs-tip","settings-page/auto-expand-block-refs-tip",356113505)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92807))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm"], null)], null),attrs92807], 0))):{'className':"text-sm"}),((cljs.core.map_QMARK_(attrs92807))?null:[daiquiri.interpreter.interpret(attrs92807)]));
})(),daiquiri.core.create_element("img",{'src':"https://user-images.githubusercontent.com/28241963/225818326-118deda9-9d1e-477d-b0ce-771ca0bcd976.gif",'width':(500),'height':(500)},null)])]);
}),null,"frontend.components.settings/auto-expand-hint");
frontend.components.settings.row_with_button_action = (function frontend$components$settings$row_with_button_action(p__92810){
var map__92811 = p__92810;
var map__92811__$1 = cljs.core.__destructure_map(map__92811);
var stretch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"stretch","stretch",-1888837380));
var _for = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"-for","-for",-490432963));
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var left_label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"left-label","left-label",-1662718913));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var desc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"desc","desc",2093485764));
var button_label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"button-label","button-label",-1402542935));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92811__$1,new cljs.core.Keyword(null,"action","action",-811238024));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4","div.it.sm:grid.sm:grid-cols-3.sm:gap-4",-1107683600),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"sm:items-start"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col","div.flex.flex-col",255067761),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),_for], null),left_label], null),(cljs.core.truth_(description)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-10","div.text-xs.text-gray-10",317949892),description], null):null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.sm:mt-0.sm:col-span-2.flex.items-center","div.mt-1.sm:mt-0.sm:col-span-2.flex.items-center",232187274),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),(cljs.core.truth_(stretch)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),"100%"], null):null)], null),(cljs.core.truth_(action)?action:(function (){var G__92812 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),(!(clojure.string.blank_QMARK_(href))),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null);
var G__92813 = ((clojure.string.blank_QMARK_(href))?button_label:(function (){var G__92814 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),href], null);
var G__92815 = button_label;
return (logseq.shui.ui.link.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.link.cljs$core$IFn$_invoke$arity$2(G__92814,G__92815) : logseq.shui.ui.link.call(null,G__92814,G__92815));
})());
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92812,G__92813) : logseq.shui.ui.button.call(null,G__92812,G__92813));
})())], null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.flex","div.text-sm.flex",-1550635209),desc], null))], null)], null);
});
frontend.components.settings.edit_config_edn = (function frontend$components$settings$edit_config_edn(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","custom-configuration","settings-page/custom-configuration",1579321198)], 0)),new cljs.core.Keyword(null,"button-label","button-label",-1402542935),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","edit-config-edn","settings-page/edit-config-edn",-945931569)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),frontend.config.get_repo_config_path()], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.ui.toggle_settings_modal_BANG_,new cljs.core.Keyword(null,"-for","-for",-490432963),"config_edn"], null));
});
frontend.components.settings.edit_global_config_edn = (function frontend$components$settings$edit_global_config_edn(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","custom-global-configuration","settings-page/custom-global-configuration",880442968)], 0)),new cljs.core.Keyword(null,"button-label","button-label",-1402542935),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","edit-global-config-edn","settings-page/edit-global-config-edn",-570818390)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),frontend.handler.global_config.global_config_path()], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.ui.toggle_settings_modal_BANG_,new cljs.core.Keyword(null,"-for","-for",-490432963),"global_config_edn"], null));
});
frontend.components.settings.edit_custom_css = (function frontend$components$settings$edit_custom_css(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","custom-theme","settings-page/custom-theme",-1859779920)], 0)),new cljs.core.Keyword(null,"button-label","button-label",-1402542935),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","edit-custom-css","settings-page/edit-custom-css",-612557961)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),frontend.config.get_custom_css_path.cljs$core$IFn$_invoke$arity$0()], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.ui.toggle_settings_modal_BANG_,new cljs.core.Keyword(null,"-for","-for",-490432963),"customize_css"], null));
});
frontend.components.settings.edit_export_css = (function frontend$components$settings$edit_export_css(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","export-theme","settings-page/export-theme",-522644991)], 0)),new cljs.core.Keyword(null,"button-label","button-label",-1402542935),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","edit-export-css","settings-page/edit-export-css",1335541441)], 0)),new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),frontend.config.get_export_css_path.cljs$core$IFn$_invoke$arity$0()], null)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.ui.toggle_settings_modal_BANG_,new cljs.core.Keyword(null,"-for","-for",-490432963),"export_css"], null));
});
frontend.components.settings.show_brackets_row = (function frontend$components$settings$show_brackets_row(t,show_brackets_QMARK_){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"show_brackets"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","show-brackets","settings-page/show-brackets",369525621)) : t.call(null,new cljs.core.Keyword("settings-page","show-brackets","settings-page/show-brackets",369525621)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.rounded-md.sm:max-w-xs","div.rounded-md.sm:max-w-xs",-1969074733),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(show_brackets_QMARK_,frontend.handler.config.toggle_ui_show_brackets_BANG_,true)], null)], null),((cljs.core.not((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})()))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text-align","text-align",1786091845),"right"], null)], null),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("ui","toggle-brackets","ui/toggle-brackets",297620244)))], null):null)], null);
});
frontend.components.settings.toggle_wide_mode_row = (function frontend$components$settings$toggle_wide_mode_row(t,wide_mode_QMARK_){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"wide_mode"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","wide-mode","settings-page/wide-mode",-2109957595)) : t.call(null,new cljs.core.Keyword("settings-page","wide-mode","settings-page/wide-mode",-2109957595)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.rounded-md.sm:max-w-xs","div.rounded-md.sm:max-w-xs",-1969074733),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(wide_mode_QMARK_,frontend.handler.ui.toggle_wide_mode_BANG_,true)], null)], null),((cljs.core.not((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})()))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text-align","text-align",1786091845),"right"], null)], null),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("ui","toggle-wide-mode","ui/toggle-wide-mode",449633976)))], null):null)], null);
});
frontend.components.settings.editor_font_family_row = (function frontend$components$settings$editor_font_family_row(t,font){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4","div.it.sm:grid.sm:grid-cols-3.sm:gap-4",-1107683600),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"font_family"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","editor-font","settings-page/editor-font",15472738)) : t.call(null,new cljs.core.Keyword("settings-page","editor-font","settings-page/editor-font",15472738)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2.flex.gap-2","div.col-span-2.flex.gap-2",-1978454791),(function (){var iter__5480__auto__ = (function frontend$components$settings$editor_font_family_row_$_iter__92816(s__92817){
return (new cljs.core.LazySeq(null,(function (){
var s__92817__$1 = s__92817;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92817__$1);
if(temp__5804__auto__){
var s__92817__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92817__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92817__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92819 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92818 = (0);
while(true){
if((i__92818 < size__5479__auto__)){
var t__$1 = cljs.core._nth(c__5478__auto__,i__92818);
var t__$2 = cljs.core.name(t__$1);
var tt = clojure.string.capitalize(t__$2);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(font,t__$2);
cljs.core.chunk_append(b__92819,(function (){var G__92820 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"class","class",-2030961996),((active_QMARK_)?" border-primary border-[2px]":null),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),"4.4rem"], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92818,t__$2,tt,active_QMARK_,t__$1,c__5478__auto__,size__5479__auto__,b__92819,s__92817__$2,temp__5804__auto__){
return (function (){
return frontend.state.set_editor_font_BANG_(t__$2);
});})(i__92818,t__$2,tt,active_QMARK_,t__$1,c__5478__auto__,size__5479__auto__,b__92819,s__92817__$2,temp__5804__auto__))
], null);
var G__92821 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["ls-font-",t__$2].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Ag"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),tt], null)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92820,G__92821) : logseq.shui.ui.button.call(null,G__92820,G__92821));
})());

var G__92984 = (i__92818 + (1));
i__92818 = G__92984;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92819),frontend$components$settings$editor_font_family_row_$_iter__92816(cljs.core.chunk_rest(s__92817__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92819),null);
}
} else {
var t__$1 = cljs.core.first(s__92817__$2);
var t__$2 = cljs.core.name(t__$1);
var tt = clojure.string.capitalize(t__$2);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(font,t__$2);
return cljs.core.cons((function (){var G__92822 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"class","class",-2030961996),((active_QMARK_)?" border-primary border-[2px]":null),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),"4.4rem"], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (t__$2,tt,active_QMARK_,t__$1,s__92817__$2,temp__5804__auto__){
return (function (){
return frontend.state.set_editor_font_BANG_(t__$2);
});})(t__$2,tt,active_QMARK_,t__$1,s__92817__$2,temp__5804__auto__))
], null);
var G__92823 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["ls-font-",t__$2].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Ag"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),tt], null)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92822,G__92823) : logseq.shui.ui.button.call(null,G__92822,G__92823));
})(),frontend$components$settings$editor_font_family_row_$_iter__92816(cljs.core.rest(s__92817__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"serif","serif",984284934),new cljs.core.Keyword(null,"mono","mono",-1777958350)], null));
})()], null)], null);
});
frontend.components.settings.switch_spell_check_row = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var enabled_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword(null,"spell-check","spell-check",-2060352968)], null));
return daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92824 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","spell-checker","settings-page/spell-checker",234247295)) : t.call(null,new cljs.core.Keyword("settings-page","spell-checker","settings-page/spell-checker",234247295)));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92824))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block","text-sm","font-medium","leading-5","opacity-70"], null)], null),attrs92824], 0))):{'className':"block text-sm font-medium leading-5 opacity-70"}),((cljs.core.map_QMARK_(attrs92824))?null:[daiquiri.interpreter.interpret(attrs92824)]));
})(),daiquiri.core.create_element("div",null,[(function (){var attrs92825 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword(null,"spell-check","spell-check",-2060352968)], null),cljs.core.not(enabled_QMARK_));

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword(null,"spell-check","spell-check",-2060352968),cljs.core.not(enabled_QMARK_)], 0)),(function (){
if(cljs.core.truth_(confirm((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"relaunch-confirm-to-work","relaunch-confirm-to-work",-672675357)) : t.call(null,new cljs.core.Keyword(null,"relaunch-confirm-to-work","relaunch-confirm-to-work",-672675357)))))){
return logseq.api.relaunch();
} else {
return null;
}
}));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92825))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs92825], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs92825))?null:[daiquiri.interpreter.interpret(attrs92825)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/switch-spell-check-row");
frontend.components.settings.switch_git_auto_commit_row = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var enabled_QMARK_ = frontend.state.get_git_auto_commit_enabled_QMARK_();
return daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92826 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","git-switcher-label","settings-page/git-switcher-label",404759182)) : t.call(null,new cljs.core.Keyword("settings-page","git-switcher-label","settings-page/git-switcher-label",404759182)));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92826))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block","text-sm","font-medium","leading-5","opacity-70"], null)], null),attrs92826], 0))):{'className':"block text-sm font-medium leading-5 opacity-70"}),((cljs.core.map_QMARK_(attrs92826))?null:[daiquiri.interpreter.interpret(attrs92826)]));
})(),daiquiri.core.create_element("div",null,[(function (){var attrs92827 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","disable-auto-commit?","git/disable-auto-commit?",1374476539)], null),enabled_QMARK_);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword("git","disable-auto-commit?","git/disable-auto-commit?",1374476539),enabled_QMARK_], 0))),(function (___40947__auto__){
return promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"setGitAutoCommit","setGitAutoCommit",1394010060)], 0)));
}));
}));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92827))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs92827], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs92827))?null:[daiquiri.interpreter.interpret(attrs92827)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/switch-git-auto-commit-row");
frontend.components.settings.switch_git_commit_on_close_row = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var enabled_QMARK_ = frontend.state.get_git_commit_on_close_enabled_QMARK_();
return daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92828 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","git-commit-on-close","settings-page/git-commit-on-close",274889554)) : t.call(null,new cljs.core.Keyword("settings-page","git-commit-on-close","settings-page/git-commit-on-close",274889554)));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92828))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block","text-sm","font-medium","leading-5","opacity-70"], null)], null),attrs92828], 0))):{'className':"block text-sm font-medium leading-5 opacity-70"}),((cljs.core.map_QMARK_(attrs92828))?null:[daiquiri.interpreter.interpret(attrs92828)]));
})(),daiquiri.core.create_element("div",null,[(function (){var attrs92829 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","commit-on-close?","git/commit-on-close?",398720116)], null),cljs.core.not(enabled_QMARK_));

return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword("git","commit-on-close?","git/commit-on-close?",398720116),cljs.core.not(enabled_QMARK_)], 0));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92829))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs92829], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs92829))?null:[daiquiri.interpreter.interpret(attrs92829)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/switch-git-commit-on-close-row");
frontend.components.settings.git_auto_commit_seconds = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var secs = (function (){var or__5002__auto__ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","auto-commit-seconds","git/auto-commit-seconds",1991447826)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (60);
}
})();
return daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92830 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","git-commit-delay","settings-page/git-commit-delay",-724346800)) : t.call(null,new cljs.core.Keyword("settings-page","git-commit-delay","settings-page/git-commit-delay",-724346800)));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92830))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block","text-sm","font-medium","leading-5","opacity-70"], null)], null),attrs92830], 0))):{'className':"block text-sm font-medium leading-5 opacity-70"}),((cljs.core.map_QMARK_(attrs92830))?null:[daiquiri.interpreter.interpret(attrs92830)]));
})(),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md sm:max-w-xs"},[daiquiri.core.create_element("input",{'id':"home-default-page",'defaultValue':secs,'onBlur':(function (event){
var value = frontend.util.safe_parse_int(frontend.util.evalue(event));
if(((typeof value === 'number') && (((((0) < value)) && ((value < ((86400) + (1)))))))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("git","auto-commit-seconds","git/auto-commit-seconds",1991447826)], null),value)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword("git","auto-commit-seconds","git/auto-commit-seconds",1991447826),value], 0))),(function (___40947__auto____$1){
return promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"setGitAutoCommit","setGitAutoCommit",1394010060)], 0)));
}));
}));
}));
} else {
var temp__5804__auto__ = frontend.components.settings.goog$module$goog$object.get(event,"target");
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Invalid value! Must be a number between 1 and 86400"], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),true);

return frontend.components.settings.goog$module$goog$object.set(elem,"value",secs);
} else {
return null;
}
}
}),'className':"form-input is-small transition duration-150 ease-in-out"},[])])])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/git-auto-commit-seconds");
frontend.components.settings.app_auto_update_row = rum.core.lazy_build(rum.core.build_defc,(function (t){
var enabled_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword(null,"auto-update","auto-update",-1471446628)], null));
var enabled_QMARK___$1 = (((enabled_QMARK_ == null))?true:enabled_QMARK_);
return daiquiri.interpreter.interpret(frontend.components.settings.toggle("usage-diagnostics",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","auto-updater","settings-page/auto-updater",542727320)) : t.call(null,new cljs.core.Keyword("settings-page","auto-updater","settings-page/auto-updater",542727320))),enabled_QMARK___$1,(function (){
var G__92834 = electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword(null,"auto-update","auto-update",-1471446628),cljs.core.not(enabled_QMARK___$1)], 0));
var fexpr__92833 = frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword(null,"auto-update","auto-update",-1471446628)], null),cljs.core.not(enabled_QMARK___$1));
return (fexpr__92833.cljs$core$IFn$_invoke$arity$1 ? fexpr__92833.cljs$core$IFn$_invoke$arity$1(G__92834) : fexpr__92833.call(null,G__92834));
})));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/app-auto-update-row");
frontend.components.settings.language_row = (function frontend$components$settings$language_row(t,preferred_language){
var on_change = (function (e){
var lang_code = frontend.util.evalue(e);
frontend.state.set_preferred_language_BANG_(lang_code);

return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();
});
var action = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.form-select.is-small","select.form-select.is-small",1007249743),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),preferred_language,new cljs.core.Keyword(null,"on-change","on-change",-732046149),on_change], null),(function (){var iter__5480__auto__ = (function frontend$components$settings$language_row_$_iter__92835(s__92836){
return (new cljs.core.LazySeq(null,(function (){
var s__92836__$1 = s__92836;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92836__$1);
if(temp__5804__auto__){
var s__92836__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92836__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92836__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92838 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92837 = (0);
while(true){
if((i__92837 < size__5479__auto__)){
var language = cljs.core._nth(c__5478__auto__,i__92837);
cljs.core.chunk_append(b__92838,(function (){var lang_code = cljs.core.name(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(language));
var lang_label = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(language);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),lang_code,new cljs.core.Keyword(null,"value","value",305978217),lang_code], null),lang_label], null);
})());

var G__92985 = (i__92837 + (1));
i__92837 = G__92985;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92838),frontend$components$settings$language_row_$_iter__92835(cljs.core.chunk_rest(s__92836__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92838),null);
}
} else {
var language = cljs.core.first(s__92836__$2);
return cljs.core.cons((function (){var lang_code = cljs.core.name(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(language));
var lang_label = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(language);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),lang_code,new cljs.core.Keyword(null,"value","value",305978217),lang_code], null),lang_label], null);
})(),frontend$components$settings$language_row_$_iter__92835(cljs.core.rest(s__92836__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.dicts.languages);
})()], null);
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"language","language",-1591107564)) : t.call(null,new cljs.core.Keyword(null,"language","language",-1591107564))),new cljs.core.Keyword(null,"-for","-for",-490432963),"preferred_language",new cljs.core.Keyword(null,"action","action",-811238024),action], null));
});
frontend.components.settings.theme_modes_row = rum.core.lazy_build(rum.core.build_defc,(function (t){
var theme = frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dark",theme);
var system_theme_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","system-theme?","ui/system-theme?",1330390822));
var switch_theme = ((dark_QMARK_)?"light":"dark");
var color_accent = frontend.state.sub(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984));
var pick_theme = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.cp__theme-modes-options","ul.cp__theme-modes-options",-1938085458),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.state.use_theme_mode_BANG_,"light"),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(system_theme_QMARK_)) && ((!(dark_QMARK_))))], null)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.mode-light","i.mode-light",2081173027),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(color_accent)?"radix":null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","theme-light","settings-page/theme-light",1503129825)) : t.call(null,new cljs.core.Keyword("settings-page","theme-light","settings-page/theme-light",1503129825)))], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.state.use_theme_mode_BANG_,"dark"),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),((cljs.core.not(system_theme_QMARK_)) && (dark_QMARK_))], null)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.mode-dark","i.mode-dark",733780794),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(color_accent)?"radix":null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","theme-dark","settings-page/theme-dark",690383413)) : t.call(null,new cljs.core.Keyword("settings-page","theme-dark","settings-page/theme-dark",690383413)))], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.state.use_theme_mode_BANG_,"system"),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),system_theme_QMARK_], null)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.mode-system","i.mode-system",411983973),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(color_accent)?"radix":null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","theme-system","settings-page/theme-system",2128147838)) : t.call(null,new cljs.core.Keyword("settings-page","theme-system","settings-page/theme-system",2128147838)))], null)], null)], null);
return daiquiri.interpreter.interpret(frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),(function (){var G__92841 = new cljs.core.Keyword("right-side-bar","switch-theme","right-side-bar/switch-theme",-247650664);
var G__92842 = clojure.string.capitalize(switch_theme);
return (t.cljs$core$IFn$_invoke$arity$2 ? t.cljs$core$IFn$_invoke$arity$2(G__92841,G__92842) : t.call(null,G__92841,G__92842));
})(),new cljs.core.Keyword(null,"-for","-for",-490432963),"toggle_theme",new cljs.core.Keyword(null,"action","action",-811238024),pick_theme,new cljs.core.Keyword(null,"desc","desc",2093485764),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("ui","toggle-theme","ui/toggle-theme",-91905800)))], null)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/theme-modes-row");
frontend.components.settings.accent_color_row = rum.core.lazy_build(rum.core.build_defc,(function (_in_modal_QMARK_){
var color_accent = frontend.state.sub(new cljs.core.Keyword("ui","radix-color","ui/radix-color",1454689984));
var pick_theme = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.cp__accent-colors-list-wrap","div.cp__accent-colors-list-wrap",-1810587712),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(_in_modal_QMARK_)?"as-modal-picker":"")], null),(function (){var iter__5480__auto__ = (function frontend$components$settings$iter__92847(s__92848){
return (new cljs.core.LazySeq(null,(function (){
var s__92848__$1 = s__92848;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92848__$1);
if(temp__5804__auto__){
var s__92848__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92848__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92848__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92850 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92849 = (0);
while(true){
if((i__92849 < size__5479__auto__)){
var color = cljs.core._nth(c__5478__auto__,i__92849);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(color,color_accent);
var none_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(color,new cljs.core.Keyword(null,"none","none",1333468478));
cljs.core.chunk_append(b__92850,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),frontend.ui.tooltip((function (){var G__92853 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5 px-1 rounded-full flex justify-center items-center transition ease-in duration-100 hover:cursor-pointer hover:opacity-100",new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),(function (){var and__5000__auto__ = _in_modal_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return active_QMARK_;
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"background-color","background-color",570434026),frontend.colors.variable.cljs$core$IFn$_invoke$arity$2(color,new cljs.core.Keyword(null,"09","09",-2019125985)),new cljs.core.Keyword(null,"outline-color","outline-color",-804747875),frontend.colors.variable.cljs$core$IFn$_invoke$arity$2(color,((active_QMARK_)?new cljs.core.Keyword(null,"07","07",-2092670845):new cljs.core.Keyword(null,"06","06",1040277546))),new cljs.core.Keyword(null,"outline-width","outline-width",-381531602),((active_QMARK_)?"4px":"1px"),new cljs.core.Keyword(null,"outline-style","outline-style",227043878),new cljs.core.Keyword(null,"solid","solid",-2023773691),new cljs.core.Keyword(null,"opacity","opacity",397153780),((active_QMARK_)?(1):0.5)], null),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__92849,active_QMARK_,none_QMARK_,color,c__5478__auto__,size__5479__auto__,b__92850,s__92848__$2,temp__5804__auto__,color_accent){
return (function (_e){
return frontend.state.set_color_accent_BANG_(color);
});})(i__92849,active_QMARK_,none_QMARK_,color,c__5478__auto__,size__5479__auto__,b__92850,s__92848__$2,temp__5804__auto__,color_accent))
], null);
var G__92854 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((none_QMARK_)?"h-0.5 w-full bg-red-700":"w-2 h-2 rounded-full transition ease-in duration-100"),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),(((!(none_QMARK_)))?["var(--rx-",cljs.core.name(color),"-07)"].join(''):""),new cljs.core.Keyword(null,"opacity","opacity",397153780),((((none_QMARK_) || (active_QMARK_)))?(1):(0))], null)], null)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92853,G__92854) : logseq.shui.ui.button.call(null,G__92853,G__92854));
})(),(function (){var G__92857 = color;
var G__92857__$1 = (((G__92857 instanceof cljs.core.Keyword))?G__92857.fqn:null);
switch (G__92857__$1) {
case "none":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"300px"], null)], null),"Cancel accent color. This is currently in beta stage and mainly used for compatibility with custom themes."], null);

break;
case "logseq":
return "Logseq classical color";

break;
default:
return [cljs.core.name(color)," color"].join('');

}
})())], null));

var G__92987 = (i__92849 + (1));
i__92849 = G__92987;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92850),frontend$components$settings$iter__92847(cljs.core.chunk_rest(s__92848__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92850),null);
}
} else {
var color = cljs.core.first(s__92848__$2);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(color,color_accent);
var none_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(color,new cljs.core.Keyword(null,"none","none",1333468478));
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),frontend.ui.tooltip((function (){var G__92858 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5 px-1 rounded-full flex justify-center items-center transition ease-in duration-100 hover:cursor-pointer hover:opacity-100",new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),(function (){var and__5000__auto__ = _in_modal_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return active_QMARK_;
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"background-color","background-color",570434026),frontend.colors.variable.cljs$core$IFn$_invoke$arity$2(color,new cljs.core.Keyword(null,"09","09",-2019125985)),new cljs.core.Keyword(null,"outline-color","outline-color",-804747875),frontend.colors.variable.cljs$core$IFn$_invoke$arity$2(color,((active_QMARK_)?new cljs.core.Keyword(null,"07","07",-2092670845):new cljs.core.Keyword(null,"06","06",1040277546))),new cljs.core.Keyword(null,"outline-width","outline-width",-381531602),((active_QMARK_)?"4px":"1px"),new cljs.core.Keyword(null,"outline-style","outline-style",227043878),new cljs.core.Keyword(null,"solid","solid",-2023773691),new cljs.core.Keyword(null,"opacity","opacity",397153780),((active_QMARK_)?(1):0.5)], null),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (active_QMARK_,none_QMARK_,color,s__92848__$2,temp__5804__auto__,color_accent){
return (function (_e){
return frontend.state.set_color_accent_BANG_(color);
});})(active_QMARK_,none_QMARK_,color,s__92848__$2,temp__5804__auto__,color_accent))
], null);
var G__92859 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((none_QMARK_)?"h-0.5 w-full bg-red-700":"w-2 h-2 rounded-full transition ease-in duration-100"),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),(((!(none_QMARK_)))?["var(--rx-",cljs.core.name(color),"-07)"].join(''):""),new cljs.core.Keyword(null,"opacity","opacity",397153780),((((none_QMARK_) || (active_QMARK_)))?(1):(0))], null)], null)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92858,G__92859) : logseq.shui.ui.button.call(null,G__92858,G__92859));
})(),(function (){var G__92860 = color;
var G__92860__$1 = (((G__92860 instanceof cljs.core.Keyword))?G__92860.fqn:null);
switch (G__92860__$1) {
case "none":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"300px"], null)], null),"Cancel accent color. This is currently in beta stage and mainly used for compatibility with custom themes."], null);

break;
case "logseq":
return "Logseq classical color";

break;
default:
return [cljs.core.name(color)," color"].join('');

}
})())], null),frontend$components$settings$iter__92847(cljs.core.rest(s__92848__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"none","none",1333468478),new cljs.core.Keyword(null,"logseq","logseq",-928939893)], null),frontend.colors.color_list));
})()], null);
var attrs92843 = frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","accent-color","settings-page/accent-color",215925442)], 0)),new cljs.core.Keyword(null,"-for","-for",-490432963),"toggle_radix_theme",new cljs.core.Keyword(null,"desc","desc",2093485764),(cljs.core.truth_(_in_modal_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-6","span.pl-6",-709977211),frontend.ui.render_keyboard_shortcut(frontend.modules.shortcut.data_helper.gen_shortcut_seq(new cljs.core.Keyword("ui","customize-appearance","ui/customize-appearance",-52617607)))], null)),new cljs.core.Keyword(null,"stretch","stretch",-1888837380),cljs.core.boolean$(_in_modal_QMARK_),new cljs.core.Keyword(null,"action","action",-811238024),pick_theme], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92843))?daiquiri.interpreter.element_attributes(attrs92843):null),((cljs.core.map_QMARK_(attrs92843))?[(function (){var attrs92844 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","accent-color-alert","settings-page/accent-color-alert",3671021)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92844))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50","mt-1"], null)], null),attrs92844], 0))):{'className':"text-sm opacity-50 mt-1"}),((cljs.core.map_QMARK_(attrs92844))?null:[daiquiri.interpreter.interpret(attrs92844)]));
})()]:[daiquiri.interpreter.interpret(attrs92843),(function (){var attrs92845 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","accent-color-alert","settings-page/accent-color-alert",3671021)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92845))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50","mt-1"], null)], null),attrs92845], 0))):{'className':"text-sm opacity-50 mt-1"}),((cljs.core.map_QMARK_(attrs92845))?null:[daiquiri.interpreter.interpret(attrs92845)]));
})()]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/accent-color-row");
frontend.components.settings.appearance = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'id':"appearance_settings",'className':"cp__settings-appearance-modal-inner w-96 p-4 shadow-xl"},[frontend.components.settings.theme_modes_row(frontend.context.i18n.t),daiquiri.interpreter.interpret(frontend.components.settings.editor_font_family_row(frontend.context.i18n.t,frontend.state.sub(new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775)))),daiquiri.interpreter.interpret(frontend.components.settings.toggle_wide_mode_row(frontend.context.i18n.t,frontend.state.sub(new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061)))),daiquiri.interpreter.interpret(frontend.components.settings.show_brackets_row(frontend.context.i18n.t,frontend.state.show_brackets_QMARK_())),frontend.components.settings.accent_color_row(true)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/appearance");
frontend.components.settings.date_format_row = (function frontend$components$settings$date_format_row(t,preferred_date_format){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-596880729),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"custom_date_format"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","custom-date-format","settings-page/custom-date-format",1127600129)) : t.call(null,new cljs.core.Keyword("settings-page","custom-date-format","settings-page/custom-date-format",1127600129))),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?null:frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.px-2","span.flex.px-2",-1203404947),frontend.components.svg.info()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","custom-date-format-warning","settings-page/custom-date-format-warning",855517727)) : t.call(null,new cljs.core.Keyword("settings-page","custom-date-format-warning","settings-page/custom-date-format-warning",855517727)))], null)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.sm:mt-0.sm:col-span-2","div.mt-1.sm:mt-0.sm:col-span-2",1617581337),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-lg.rounded-md","div.max-w-lg.rounded-md",-1164491035),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.form-select.is-small","select.form-select.is-small",1007249743),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),preferred_date_format,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var repo = frontend.state.get_current_repo();
var format = frontend.util.evalue(e);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(clojure.string.blank_QMARK_(format)){
return null;
} else {
if(db_based_QMARK_){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954),format)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1("Please refresh the app for this change to take effect"));
}));
}));
} else {
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("journal","page-title-format","journal/page-title-format",2033061997),format);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","custom-date-format-notification","settings-page/custom-date-format-notification",1192674718)) : t.call(null,new cljs.core.Keyword("settings-page","custom-date-format-notification","settings-page/custom-date-format-notification",1192674718)))], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
}

(logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_all_BANG_.call(null));

if(db_based_QMARK_){
return null;
} else {
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null));
}
}
})], null),(function (){var iter__5480__auto__ = (function frontend$components$settings$date_format_row_$_iter__92861(s__92862){
return (new cljs.core.LazySeq(null,(function (){
var s__92862__$1 = s__92862;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92862__$1);
if(temp__5804__auto__){
var s__92862__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92862__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92862__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92864 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92863 = (0);
while(true){
if((i__92863 < size__5479__auto__)){
var format = cljs.core._nth(c__5478__auto__,i__92863);
cljs.core.chunk_append(b__92864,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),format], null),format], null));

var G__92989 = (i__92863 + (1));
i__92863 = G__92989;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92864),frontend$components$settings$date_format_row_$_iter__92861(cljs.core.chunk_rest(s__92862__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92864),null);
}
} else {
var format = cljs.core.first(s__92862__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),format], null),format], null),frontend$components$settings$date_format_row_$_iter__92861(cljs.core.rest(s__92862__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(frontend.date.journal_title_formatters()));
})()], null)], null)], null)], null);
});
frontend.components.settings.workflow_row = (function frontend$components$settings$workflow_row(t,preferred_workflow){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"preferred_workflow"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","preferred-workflow","settings-page/preferred-workflow",-899500557)) : t.call(null,new cljs.core.Keyword("settings-page","preferred-workflow","settings-page/preferred-workflow",-899500557)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.sm:mt-0.sm:col-span-2","div.mt-1.sm:mt-0.sm:col-span-2",1617581337),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-lg.rounded-md","div.max-w-lg.rounded-md",-1164491035),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.form-select.is-small","select.form-select.is-small",1007249743),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.name(preferred_workflow),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
return frontend.handler.user.set_preferred_workflow_BANG_((function (p1__92865_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__92865_SHARP_,new cljs.core.Keyword(null,"now","now",-1650525531))){
return new cljs.core.Keyword(null,"now","now",-1650525531);
} else {
return new cljs.core.Keyword(null,"todo","todo",-1046442570);
}
})(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(frontend.util.evalue(e)))));
})], null),(function (){var iter__5480__auto__ = (function frontend$components$settings$workflow_row_$_iter__92866(s__92867){
return (new cljs.core.LazySeq(null,(function (){
var s__92867__$1 = s__92867;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92867__$1);
if(temp__5804__auto__){
var s__92867__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92867__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92867__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92869 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92868 = (0);
while(true){
if((i__92868 < size__5479__auto__)){
var workflow = cljs.core._nth(c__5478__auto__,i__92868);
cljs.core.chunk_append(b__92869,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(workflow),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.name(workflow)], null),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(workflow,new cljs.core.Keyword(null,"now","now",-1650525531)))?"NOW/LATER":"TODO/DOING")], null));

var G__92990 = (i__92868 + (1));
i__92868 = G__92990;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92869),frontend$components$settings$workflow_row_$_iter__92866(cljs.core.chunk_rest(s__92867__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92869),null);
}
} else {
var workflow = cljs.core.first(s__92867__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(workflow),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.name(workflow)], null),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(workflow,new cljs.core.Keyword(null,"now","now",-1650525531)))?"NOW/LATER":"TODO/DOING")], null),frontend$components$settings$workflow_row_$_iter__92866(cljs.core.rest(s__92867__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"todo","todo",-1046442570)], null));
})()], null)], null)], null)], null);
});
frontend.components.settings.outdenting_row = (function frontend$components$settings$outdenting_row(t,logical_outdenting_QMARK_){
return frontend.components.settings.toggle("preferred_outdenting",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","preferred-outdenting","settings-page/preferred-outdenting",-641736419)) : t.call(null,new cljs.core.Keyword("settings-page","preferred-outdenting","settings-page/preferred-outdenting",-641736419))),frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.px-2","span.flex.px-2",-1203404947),frontend.components.svg.info()], null),frontend.components.settings.outdenting_hint(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"side","side",389652279),"right"], null)], null))], null),logical_outdenting_QMARK_,frontend.handler.config.toggle_logical_outdenting_BANG_);
});
frontend.components.settings.showing_full_blocks = (function frontend$components$settings$showing_full_blocks(t,show_full_blocks_QMARK_){
return frontend.components.settings.toggle("show_full_blocks",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","show-full-blocks","settings-page/show-full-blocks",1786638364)) : t.call(null,new cljs.core.Keyword("settings-page","show-full-blocks","settings-page/show-full-blocks",1786638364))),show_full_blocks_QMARK_,frontend.handler.config.toggle_show_full_blocks_BANG_);
});
frontend.components.settings.preferred_pasting_file = (function frontend$components$settings$preferred_pasting_file(t,preferred_pasting_file_QMARK_){
return frontend.components.settings.toggle("preferred_pasting_file",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","preferred-pasting-file","settings-page/preferred-pasting-file",-880533391)) : t.call(null,new cljs.core.Keyword("settings-page","preferred-pasting-file","settings-page/preferred-pasting-file",-880533391))),frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.px-2","span.flex.px-2",-1203404947),frontend.components.svg.info()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.block.w-64","span.block.w-64",1641501410),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","preferred-pasting-file-hint","settings-page/preferred-pasting-file-hint",-1430361970)) : t.call(null,new cljs.core.Keyword("settings-page","preferred-pasting-file-hint","settings-page/preferred-pasting-file-hint",-1430361970)))], null))], null),preferred_pasting_file_QMARK_,frontend.handler.config.toggle_preferred_pasting_file_BANG_);
});
frontend.components.settings.auto_expand_row = (function frontend$components$settings$auto_expand_row(t,auto_expand_block_refs_QMARK_){
return frontend.components.settings.toggle("auto_expand_block_refs",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","auto-expand-block-refs","settings-page/auto-expand-block-refs",-501557671)) : t.call(null,new cljs.core.Keyword("settings-page","auto-expand-block-refs","settings-page/auto-expand-block-refs",-501557671))),frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.px-2","span.flex.px-2",-1203404947),frontend.components.svg.info()], null),frontend.components.settings.auto_expand_hint())], null),auto_expand_block_refs_QMARK_,frontend.handler.config.toggle_auto_expand_block_refs_BANG_);
});
frontend.components.settings.tooltip_row = (function frontend$components$settings$tooltip_row(t,enable_tooltip_QMARK_){
return frontend.components.settings.toggle("enable_tooltip",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","enable-tooltip","settings-page/enable-tooltip",1761325062)) : t.call(null,new cljs.core.Keyword("settings-page","enable-tooltip","settings-page/enable-tooltip",1761325062))),enable_tooltip_QMARK_,(function (){
return frontend.handler.config.toggle_ui_enable_tooltip_BANG_();
}));
});
frontend.components.settings.shortcut_tooltip_row = (function frontend$components$settings$shortcut_tooltip_row(t,enable_shortcut_tooltip_QMARK_){
return frontend.components.settings.toggle("enable_tooltip",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","enable-shortcut-tooltip","settings-page/enable-shortcut-tooltip",1996032597)) : t.call(null,new cljs.core.Keyword("settings-page","enable-shortcut-tooltip","settings-page/enable-shortcut-tooltip",1996032597))),enable_shortcut_tooltip_QMARK_,(function (){
return frontend.state.toggle_shortcut_tooltip_BANG_();
}));
});
frontend.components.settings.timetracking_row = (function frontend$components$settings$timetracking_row(t,enable_timetracking_QMARK_){
return frontend.components.settings.toggle("enable_timetracking",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","enable-timetracking","settings-page/enable-timetracking",-953831670)) : t.call(null,new cljs.core.Keyword("settings-page","enable-timetracking","settings-page/enable-timetracking",-953831670))),enable_timetracking_QMARK_,(function (){
var value = cljs.core.not(enable_timetracking_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-timetracking?","feature/enable-timetracking?",1612021873),value);
}));
});
frontend.components.settings.update_home_page = (function frontend$components$settings$update_home_page(event){
var value = frontend.util.evalue(event);
if(clojure.string.blank_QMARK_(value)){
var home = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"default-home","default-home",171104159),cljs.core.PersistentArrayMap.EMPTY);
var new_home = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(home,new cljs.core.Keyword(null,"page","page",849072397));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"default-home","default-home",171104159),new_home)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-journals?","feature/enable-journals?",1609498182),true)),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Journals enabled",new cljs.core.Keyword(null,"success","success",1890645906)));
}));
}));
}));
} else {
if(cljs.core.truth_(logseq.db.get_page((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),value))){
var home = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"default-home","default-home",171104159),cljs.core.PersistentArrayMap.EMPTY);
var new_home = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(home,new cljs.core.Keyword(null,"page","page",849072397),value);
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"default-home","default-home",171104159),new_home);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Home default page updated successfully!",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["The page \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"\" doesn't exist yet. Please create that page first, and then try again."].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671));

}
}
});
frontend.components.settings.journal_row = (function frontend$components$settings$journal_row(enable_journals_QMARK_){
return frontend.components.settings.toggle("enable_journals",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","enable-journals","settings-page/enable-journals",-1792981415)], 0)),enable_journals_QMARK_,(function (){
var value = cljs.core.not(enable_journals_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-journals?","feature/enable-journals?",1609498182),value);
}));
});
frontend.components.settings.enable_all_pages_public_row = (function frontend$components$settings$enable_all_pages_public_row(t,enable_all_pages_public_QMARK_){
return frontend.components.settings.toggle("all pages public",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","enable-all-pages-public","settings-page/enable-all-pages-public",-1352366581)) : t.call(null,new cljs.core.Keyword("settings-page","enable-all-pages-public","settings-page/enable-all-pages-public",-1352366581))),enable_all_pages_public_QMARK_,(function (){
var value = cljs.core.not(enable_all_pages_public_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("publishing","all-pages-public?","publishing/all-pages-public?",-386830034),value);
}));
});
frontend.components.settings.zotero_settings_row = (function frontend$components$settings$zotero_settings_row(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"zotero_settings"], null),"Zotero"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.sm:mt-0.sm:col-span-2","div.mt-1.sm:mt-0.sm:col-span-2",1617581337),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"settings","settings",1556144875)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0px"], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_settings_BANG_();

return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"zotero-setting","zotero-setting",-1619504499)], null));
})], 0))], null)], null)], null);
});
frontend.components.settings.auto_push_row = (function frontend$components$settings$auto_push_row(_t,current_repo,enable_git_auto_push_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(current_repo,"https://");
} else {
return and__5000__auto__;
}
})())){
return frontend.components.settings.toggle("enable_git_auto_push","Enable Git auto push",enable_git_auto_push_QMARK_,(function (){
var value = cljs.core.not(enable_git_auto_push_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"git-auto-push","git-auto-push",2144454612),value);
}));
} else {
return null;
}
});
frontend.components.settings.usage_diagnostics_row = (function frontend$components$settings$usage_diagnostics_row(t,instrument_disabled_QMARK_){
return frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic("usage-diagnostics",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","disable-sentry","settings-page/disable-sentry",-1347031056)) : t.call(null,new cljs.core.Keyword("settings-page","disable-sentry","settings-page/disable-sentry",-1347031056))),cljs.core.not(instrument_disabled_QMARK_),(function (){
return frontend.modules.instrumentation.core.disable_instrument(cljs.core.not(instrument_disabled_QMARK_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.opacity-50","span.text-sm.opacity-50",1991571125),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","disable-sentry-desc","settings-page/disable-sentry-desc",594327150)) : t.call(null,new cljs.core.Keyword("settings-page","disable-sentry-desc","settings-page/disable-sentry-desc",594327150)))], null)], 0));
});
frontend.components.settings.version_row = (function frontend$components$settings$version_row(t,version){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","current-version","settings-page/current-version",724725196)) : t.call(null,new cljs.core.Keyword("settings-page","current-version","settings-page/current-version",724725196))),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.app_updater(version),new cljs.core.Keyword(null,"-for","-for",-490432963),"current-version"], null));
});
frontend.components.settings.developer_mode_row = (function frontend$components$settings$developer_mode_row(t,developer_mode_QMARK_){
return frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic("developer_mode",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","developer-mode","settings-page/developer-mode",1909434761)) : t.call(null,new cljs.core.Keyword("settings-page","developer-mode","settings-page/developer-mode",1909434761))),developer_mode_QMARK_,(function (){
var mode = cljs.core.not(developer_mode_QMARK_);
return frontend.state.set_developer_mode_BANG_(mode);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.opacity-50","div.text-sm.opacity-50",829333122),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","developer-mode-desc","settings-page/developer-mode-desc",1029179391)) : t.call(null,new cljs.core.Keyword("settings-page","developer-mode-desc","settings-page/developer-mode-desc",1029179391)))], null)], 0));
});
frontend.components.settings.plugin_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (t){
var value = frontend.state.lsp_enabled_QMARK__or_theme();
var vec__92871 = rum.core.use_state(value);
var on_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92871,(0),null);
var set_on_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92871,(1),null);
var on_toggle = (function (){
var v = cljs.core.not(on_QMARK_);
(set_on_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_on_QMARK_.cljs$core$IFn$_invoke$arity$1(v) : set_on_QMARK_.call(null,v));

return frontend.storage.set(new cljs.core.Keyword("frontend.spec.storage","lsp-core-enabled","frontend.spec.storage/lsp-core-enabled",-1474488934),v);
});
var attrs92870 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(on_QMARK_,on_toggle,true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92870))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs92870], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs92870))?[(cljs.core.truth_(frontend.util.electron_QMARK_())?((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(value),on_QMARK_))?daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071)) : t.call(null,new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.api.relaunch();
}),new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq"], 0))):null):null)]:[daiquiri.interpreter.interpret(attrs92870),(cljs.core.truth_(frontend.util.electron_QMARK_())?((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(value),on_QMARK_))?daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071)) : t.call(null,new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.api.relaunch();
}),new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq"], 0))):null):null)]));
}),null,"frontend.components.settings/plugin-enabled-switcher");
frontend.components.settings.http_server_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (t){
var vec__92875 = rum.core.use_state(cljs.core.boolean$(frontend.storage.get(new cljs.core.Keyword("frontend.spec.storage","http-server-enabled","frontend.spec.storage/http-server-enabled",-1753032348))));
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92875,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92875,(1),null);
var vec__92878 = rum.core.use_state(value);
var on_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92878,(0),null);
var set_on_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92878,(1),null);
var on_toggle = (function (){
var v = cljs.core.not(on_QMARK_);
(set_on_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_on_QMARK_.cljs$core$IFn$_invoke$arity$1(v) : set_on_QMARK_.call(null,v));

return frontend.storage.set(new cljs.core.Keyword("frontend.spec.storage","http-server-enabled","frontend.spec.storage/http-server-enabled",-1753032348),v);
});
var attrs92874 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(on_QMARK_,on_toggle,true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92874))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","gap-2"], null)], null),attrs92874], 0))):{'className':"flex items-center gap-2"}),((cljs.core.map_QMARK_(attrs92874))?[((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(value),on_QMARK_))?daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071)) : t.call(null,new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.api.relaunch();
}),new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq"], 0))):null)]:[daiquiri.interpreter.interpret(attrs92874),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(value),on_QMARK_))?daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071)) : t.call(null,new cljs.core.Keyword("plugin","restart","plugin/restart",-927945071))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.api.relaunch();
}),new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq"], 0))):null)]));
}),null,"frontend.components.settings/http-server-enabled-switcher");
frontend.components.settings.flashcards_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (enable_flashcards_QMARK_){
return daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enable_flashcards_QMARK_,(function (){
var value = cljs.core.not(enable_flashcards_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-flashcards?","feature/enable-flashcards?",1572039243),value);
}),true));
}),null,"frontend.components.settings/flashcards-enabled-switcher");
frontend.components.settings.user_proxy_settings = rum.core.lazy_build(rum.core.build_defc,(function (p__92881){
var map__92882 = p__92881;
var map__92882__$1 = cljs.core.__destructure_map(map__92882);
var agent_opts = map__92882__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92882__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var protocol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92882__$1,new cljs.core.Keyword(null,"protocol","protocol",652470118));
var host = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92882__$1,new cljs.core.Keyword(null,"host","host",-1558485167));
var port = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92882__$1,new cljs.core.Keyword(null,"port","port",1534937262));
return daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pr-1","span.pr-1",-524129241),(function (){var G__92884 = type;
switch (G__92884) {
case "system":
return "System Default";

break;
case "direct":
return "Direct";

break;
default:
var and__5000__auto__ = protocol;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = host;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = port;
if(cljs.core.truth_(and__5000__auto____$2)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol),"://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(host),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(port)].join('');
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}

}
})()], null),frontend.ui.icon("edit")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","proxy-settings","go/proxy-settings",1019838469),agent_opts], null));
})], 0)));
}),null,"frontend.components.settings/user-proxy-settings");
frontend.components.settings.plugin_system_switcher_row = (function frontend$components$settings$plugin_system_switcher_row(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","plugin-system","settings-page/plugin-system",-1976608350)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.plugin_enabled_switcher(frontend.context.i18n.t)], null));
});
frontend.components.settings.http_server_switcher_row = (function frontend$components$settings$http_server_switcher_row(){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),"HTTP APIs server",new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.http_server_enabled_switcher(frontend.context.i18n.t)], null));
});
frontend.components.settings.flashcards_switcher_row = (function frontend$components$settings$flashcards_switcher_row(enable_flashcards_QMARK_){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","enable-flashcards","settings-page/enable-flashcards",-1402029773)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.flashcards_enabled_switcher(enable_flashcards_QMARK_)], null));
});
frontend.components.settings.https_user_agent_row = (function frontend$components$settings$https_user_agent_row(agent_opts){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","network-proxy","settings-page/network-proxy",-895413144)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.user_proxy_settings(agent_opts)], null));
});
frontend.components.settings.auto_chmod_row = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var enabled_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("feature","enable-automatic-chmod?","feature/enable-automatic-chmod?",2038808000)], null))))?true:frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("feature","enable-automatic-chmod?","feature/enable-automatic-chmod?",2038808000)], null)));
return daiquiri.interpreter.interpret(frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic("automatic-chmod",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","auto-chmod","settings-page/auto-chmod",-199383742)) : t.call(null,new cljs.core.Keyword("settings-page","auto-chmod","settings-page/auto-chmod",-199383742))),enabled_QMARK_,(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("feature","enable-automatic-chmod?","feature/enable-automatic-chmod?",2038808000)], null),cljs.core.not(enabled_QMARK_));

return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword("feature","enable-automatic-chmod?","feature/enable-automatic-chmod?",2038808000),cljs.core.not(enabled_QMARK_)], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.opacity-50","span.text-sm.opacity-50",1991571125),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","auto-chmod-desc","settings-page/auto-chmod-desc",-1233790095)) : t.call(null,new cljs.core.Keyword("settings-page","auto-chmod-desc","settings-page/auto-chmod-desc",-1233790095)))], null)], 0)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/auto-chmod-row");
frontend.components.settings.native_titlebar_row = rum.core.lazy_build(rum.core.build_defcs,(function (state,t){
var enabled_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("window","native-titlebar?","window/native-titlebar?",195665142)], null));
return daiquiri.interpreter.interpret(frontend.components.settings.toggle.cljs$core$IFn$_invoke$arity$variadic("native-titlebar",(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","native-titlebar","settings-page/native-titlebar",1581577646)) : t.call(null,new cljs.core.Keyword("settings-page","native-titlebar","settings-page/native-titlebar",1581577646))),enabled_QMARK_,(function (){
if(cljs.core.truth_(confirm((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"relaunch-confirm-to-work","relaunch-confirm-to-work",-672675357)) : t.call(null,new cljs.core.Keyword(null,"relaunch-confirm-to-work","relaunch-confirm-to-work",-672675357)))))){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("window","native-titlebar?","window/native-titlebar?",195665142)], null),cljs.core.not(enabled_QMARK_));

electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"userAppCfgs","userAppCfgs",-1274935350),new cljs.core.Keyword("window","native-titlebar?","window/native-titlebar?",195665142),cljs.core.not(enabled_QMARK_)], 0));

return logseq.api.relaunch();
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.opacity-50","span.text-sm.opacity-50",1991571125),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","native-titlebar-desc","settings-page/native-titlebar-desc",162616922)) : t.call(null,new cljs.core.Keyword("settings-page","native-titlebar-desc","settings-page/native-titlebar-desc",162616922)))], null)], 0)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/native-titlebar-row");
frontend.components.settings.settings_general = rum.core.lazy_build(rum.core.build_defcs,(function (_state,current_repo){
var preferred_language = frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017)], null));
var show_radix_themes_QMARK_ = true;
var editor_font = frontend.state.sub(new cljs.core.Keyword("ui","editor-font","ui/editor-font",582019775));
var attrs92885 = frontend.components.settings.version_row(frontend.context.i18n.t,frontend.version.version);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92885))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["panel-wrap","is-general"], null)], null),attrs92885], 0))):{'className':"panel-wrap is-general"}),((cljs.core.map_QMARK_(attrs92885))?[daiquiri.interpreter.interpret(frontend.components.settings.language_row(frontend.context.i18n.t,preferred_language)),frontend.components.settings.theme_modes_row(frontend.context.i18n.t),daiquiri.interpreter.interpret(frontend.components.settings.editor_font_family_row(frontend.context.i18n.t,editor_font)),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.util.mac_QMARK_);
} else {
return and__5000__auto__;
}
})())?frontend.components.settings.native_titlebar_row(frontend.context.i18n.t):null),((show_radix_themes_QMARK_)?frontend.components.settings.accent_color_row(false):null),(cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.edit_global_config_edn()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_config_edn()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_custom_css()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_export_css()):null)]:[daiquiri.interpreter.interpret(attrs92885),daiquiri.interpreter.interpret(frontend.components.settings.language_row(frontend.context.i18n.t,preferred_language)),frontend.components.settings.theme_modes_row(frontend.context.i18n.t),daiquiri.interpreter.interpret(frontend.components.settings.editor_font_family_row(frontend.context.i18n.t,editor_font)),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.util.mac_QMARK_);
} else {
return and__5000__auto__;
}
})())?frontend.components.settings.native_titlebar_row(frontend.context.i18n.t):null),((show_radix_themes_QMARK_)?frontend.components.settings.accent_color_row(false):null),(cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.edit_global_config_edn()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_config_edn()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_custom_css()):null),(cljs.core.truth_(current_repo)?daiquiri.interpreter.interpret(frontend.components.settings.edit_export_css()):null)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/settings-general");
frontend.components.settings.file_format_row = (function frontend$components$settings$file_format_row(t,preferred_format){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center","div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center",-761433112),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.leading-5.opacity-70","label.block.text-sm.font-medium.leading-5.opacity-70",643274172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"preferred_format"], null),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("settings-page","preferred-file-format","settings-page/preferred-file-format",-474760732)) : t.call(null,new cljs.core.Keyword("settings-page","preferred-file-format","settings-page/preferred-file-format",-474760732)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.sm:mt-0.sm:col-span-2","div.mt-1.sm:mt-0.sm:col-span-2",1617581337),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-lg.rounded-md","div.max-w-lg.rounded-md",-1164491035),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.form-select.is-small","select.form-select.is-small",1007249743),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.name(preferred_format),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var format = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(frontend.util.evalue(e)));
return frontend.handler.user.set_preferred_format_BANG_(format);
})], null),(function (){var iter__5480__auto__ = (function frontend$components$settings$file_format_row_$_iter__92886(s__92887){
return (new cljs.core.LazySeq(null,(function (){
var s__92887__$1 = s__92887;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92887__$1);
if(temp__5804__auto__){
var s__92887__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92887__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92887__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92889 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92888 = (0);
while(true){
if((i__92888 < size__5479__auto__)){
var format = cljs.core._nth(c__5478__auto__,i__92888);
cljs.core.chunk_append(b__92889,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),format,new cljs.core.Keyword(null,"value","value",305978217),format], null),clojure.string.capitalize(format)], null));

var G__92992 = (i__92888 + (1));
i__92888 = G__92992;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92889),frontend$components$settings$file_format_row_$_iter__92886(cljs.core.chunk_rest(s__92887__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92889),null);
}
} else {
var format = cljs.core.first(s__92887__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),format,new cljs.core.Keyword(null,"value","value",305978217),format], null),clojure.string.capitalize(format)], null),frontend$components$settings$file_format_row_$_iter__92886(cljs.core.rest(s__92887__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"org","org",1495985),new cljs.core.Keyword(null,"markdown","markdown",1227225089)], null)));
})()], null)], null)], null)], null);
});
frontend.components.settings.settings_editor = rum.core.lazy_build(rum.core.build_defcs,(function (_state,current_repo){
var preferred_format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var preferred_date_format = frontend.state.get_date_formatter();
var preferred_workflow = frontend.state.get_preferred_workflow();
var enable_timetracking_QMARK_ = frontend.state.enable_timetracking_QMARK_();
var enable_all_pages_public_QMARK_ = frontend.state.all_pages_public_QMARK_();
var logical_outdenting_QMARK_ = frontend.state.logical_outdenting_QMARK_();
var show_full_blocks_QMARK_ = frontend.state.show_full_blocks_QMARK_();
var preferred_pasting_file_QMARK_ = frontend.state.preferred_pasting_file_QMARK_();
var auto_expand_block_refs_QMARK_ = frontend.state.auto_expand_block_refs_QMARK_();
var enable_tooltip_QMARK_ = frontend.state.enable_tooltip_QMARK_();
var enable_shortcut_tooltip_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","shortcut-tooltip?","ui/shortcut-tooltip?",1921963086));
var show_brackets_QMARK_ = frontend.state.show_brackets_QMARK_();
var wide_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061));
var enable_git_auto_push_QMARK_ = frontend.state.enable_git_auto_push_QMARK_(current_repo);
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var attrs92890 = ((db_graph_QMARK_)?null:frontend.components.settings.file_format_row(frontend.context.i18n.t,preferred_format));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92890))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["panel-wrap","is-editor"], null)], null),attrs92890], 0))):{'className':"panel-wrap is-editor"}),((cljs.core.map_QMARK_(attrs92890))?[daiquiri.interpreter.interpret(frontend.components.settings.date_format_row(frontend.context.i18n.t,preferred_date_format)),((db_graph_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.workflow_row(frontend.context.i18n.t,preferred_workflow))),daiquiri.interpreter.interpret(frontend.components.settings.show_brackets_row(frontend.context.i18n.t,show_brackets_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.toggle_wide_mode_row(frontend.context.i18n.t,wide_mode_QMARK_)),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.settings.switch_spell_check_row(frontend.context.i18n.t):null),daiquiri.interpreter.interpret(frontend.components.settings.outdenting_row(frontend.context.i18n.t,logical_outdenting_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.showing_full_blocks(frontend.context.i18n.t,show_full_blocks_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.preferred_pasting_file(frontend.context.i18n.t,preferred_pasting_file_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.auto_expand_row(frontend.context.i18n.t,auto_expand_block_refs_QMARK_)),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?null:daiquiri.interpreter.interpret(frontend.components.settings.shortcut_tooltip_row(frontend.context.i18n.t,enable_shortcut_tooltip_QMARK_))),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?null:daiquiri.interpreter.interpret(frontend.components.settings.tooltip_row(frontend.context.i18n.t,enable_tooltip_QMARK_))),daiquiri.interpreter.interpret(frontend.components.settings.timetracking_row(frontend.context.i18n.t,enable_timetracking_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.enable_all_pages_public_row(frontend.context.i18n.t,enable_all_pages_public_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.auto_push_row(frontend.context.i18n.t,current_repo,enable_git_auto_push_QMARK_))]:[daiquiri.interpreter.interpret(attrs92890),daiquiri.interpreter.interpret(frontend.components.settings.date_format_row(frontend.context.i18n.t,preferred_date_format)),((db_graph_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.workflow_row(frontend.context.i18n.t,preferred_workflow))),daiquiri.interpreter.interpret(frontend.components.settings.show_brackets_row(frontend.context.i18n.t,show_brackets_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.toggle_wide_mode_row(frontend.context.i18n.t,wide_mode_QMARK_)),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.settings.switch_spell_check_row(frontend.context.i18n.t):null),daiquiri.interpreter.interpret(frontend.components.settings.outdenting_row(frontend.context.i18n.t,logical_outdenting_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.showing_full_blocks(frontend.context.i18n.t,show_full_blocks_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.preferred_pasting_file(frontend.context.i18n.t,preferred_pasting_file_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.auto_expand_row(frontend.context.i18n.t,auto_expand_block_refs_QMARK_)),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?null:daiquiri.interpreter.interpret(frontend.components.settings.shortcut_tooltip_row(frontend.context.i18n.t,enable_shortcut_tooltip_QMARK_))),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?null:daiquiri.interpreter.interpret(frontend.components.settings.tooltip_row(frontend.context.i18n.t,enable_tooltip_QMARK_))),daiquiri.interpreter.interpret(frontend.components.settings.timetracking_row(frontend.context.i18n.t,enable_timetracking_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.enable_all_pages_public_row(frontend.context.i18n.t,enable_all_pages_public_QMARK_)),daiquiri.interpreter.interpret(frontend.components.settings.auto_push_row(frontend.context.i18n.t,current_repo,enable_git_auto_push_QMARK_))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/settings-editor");
frontend.components.settings.settings_git = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"panel-wrap"},[daiquiri.core.create_element("div",{'className':"text-sm my-4"},[frontend.ui.admonition(new cljs.core.Keyword(null,"tip","tip",1221810860),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","git-tip","settings-page/git-tip",-1231187294)], 0))], null)),(function (){var attrs92893 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","git-desc-1","settings-page/git-desc-1",1764142740)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92893))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50","my-4"], null)], null),attrs92893], 0))):{'className':"text-sm opacity-50 my-4"}),((cljs.core.map_QMARK_(attrs92893))?null:[daiquiri.interpreter.interpret(attrs92893)]));
})(),daiquiri.core.create_element("br",null,null),daiquiri.core.create_element("br",null,null),(function (){var attrs92898 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","git-desc-2","settings-page/git-desc-2",438169741)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92898))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50","my-4"], null)], null),attrs92898], 0))):{'className':"text-sm opacity-50 my-4"}),((cljs.core.map_QMARK_(attrs92898))?null:[daiquiri.interpreter.interpret(attrs92898)]));
})(),daiquiri.core.create_element("a",{'href':"https://git-scm.com/",'target':"_blank"},["Git"]),(function (){var attrs92901 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","git-desc-3","settings-page/git-desc-3",-1595310248)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs92901))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50","my-4"], null)], null),attrs92901], 0))):{'className':"text-sm opacity-50 my-4"}),((cljs.core.map_QMARK_(attrs92901))?null:[daiquiri.interpreter.interpret(attrs92901)]));
})()]),daiquiri.core.create_element("br",null,null),frontend.components.settings.switch_git_auto_commit_row(frontend.context.i18n.t),frontend.components.settings.switch_git_commit_on_close_row(frontend.context.i18n.t),frontend.components.settings.git_auto_commit_seconds(frontend.context.i18n.t)]);
}),null,"frontend.components.settings/settings-git");
frontend.components.settings.settings_advanced = rum.core.lazy_build(rum.core.build_defc,(function (){
var instrument_disabled_QMARK_ = frontend.state.sub(new cljs.core.Keyword("instrument","disabled?","instrument/disabled?",165654178));
var developer_mode_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","developer-mode?","ui/developer-mode?",-664501878)], null));
var https_agent_opts = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","user-cfgs","electron/user-cfgs",-76972489),new cljs.core.Keyword("settings","agent","settings/agent",2144439922)], null));
var attrs92902 = (cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.win32_QMARK_;
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.electron_QMARK_();
} else {
return and__5000__auto__;
}
})())?frontend.components.settings.app_auto_update_row(frontend.context.i18n.t):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92902))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["panel-wrap","is-advanced"], null)], null),attrs92902], 0))):{'className':"panel-wrap is-advanced"}),((cljs.core.map_QMARK_(attrs92902))?[daiquiri.interpreter.interpret(frontend.components.settings.usage_diagnostics_row(frontend.context.i18n.t,instrument_disabled_QMARK_)),(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:daiquiri.interpreter.interpret(frontend.components.settings.developer_mode_row(frontend.context.i18n.t,developer_mode_QMARK_))),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.https_user_agent_row(https_agent_opts)):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.settings.auto_chmod_row(frontend.context.i18n.t):null)]:[daiquiri.interpreter.interpret(attrs92902),daiquiri.interpreter.interpret(frontend.components.settings.usage_diagnostics_row(frontend.context.i18n.t,instrument_disabled_QMARK_)),(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:daiquiri.interpreter.interpret(frontend.components.settings.developer_mode_row(frontend.context.i18n.t,developer_mode_QMARK_))),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.https_user_agent_row(https_agent_opts)):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.settings.auto_chmod_row(frontend.context.i18n.t):null)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/settings-advanced");
frontend.components.settings.sync_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (enabled_QMARK_){
return daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
return frontend.handler.file_sync.set_sync_enabled_BANG_(cljs.core.not(enabled_QMARK_));
}),true));
}),null,"frontend.components.settings/sync-enabled-switcher");
frontend.components.settings.sync_diff_merge_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (enabled_QMARK_){
return daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
return frontend.handler.file_sync.set_sync_diff_merge_enabled_BANG_(cljs.core.not(enabled_QMARK_));
}),true));
}),null,"frontend.components.settings/sync-diff-merge-enabled-switcher");
frontend.components.settings.sync_switcher_row = (function frontend$components$settings$sync_switcher_row(repo,enabled_QMARK_){
return frontend.components.settings.row_with_button_action((function (){var G__92903 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync","settings-page/sync",-1241342933)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.sync_enabled_switcher(enabled_QMARK_)], null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__92903,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),null,new cljs.core.Keyword(null,"desc","desc",2093485764),"Not available yet for database graphs"], null)], 0));
} else {
return G__92903;
}
})());
});
frontend.components.settings.sync_diff_merge_switcher_row = (function frontend$components$settings$sync_diff_merge_switcher_row(enabled_QMARK_){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-diff-merge","settings-page/sync-diff-merge",-128695381)], 0)))," (Experimental!)"].join(''),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.sync_diff_merge_enabled_switcher(enabled_QMARK_),new cljs.core.Keyword(null,"desc","desc",2093485764),frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.px-1","span.inline-flex.px-1",-1480964027),frontend.components.svg.info()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-diff-merge-desc","settings-page/sync-diff-merge-desc",-959868849)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-diff-merge-warn","settings-page/sync-diff-merge-warn",1790952981)], 0))], null)], null))], null));
});
frontend.components.settings.rtc_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (enabled_QMARK_){
return daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
var value = cljs.core.not(enabled_QMARK_);
return frontend.state.set_rtc_enabled_BANG_(value);
}),true));
}),null,"frontend.components.settings/rtc-enabled-switcher");
frontend.components.settings.rtc_switcher_row = (function frontend$components$settings$rtc_switcher_row(enabled_QMARK_){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),"RTC",new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.rtc_enabled_switcher(enabled_QMARK_)], null));
});
frontend.components.settings.whiteboards_enabled_switcher = rum.core.lazy_build(rum.core.build_defc,(function (enabled_QMARK_){
return daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(enabled_QMARK_,(function (){
var value = cljs.core.not(enabled_QMARK_);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("feature","enable-whiteboards?","feature/enable-whiteboards?",-52089888),value);
}),true));
}),null,"frontend.components.settings/whiteboards-enabled-switcher");
frontend.components.settings.whiteboards_switcher_row = (function frontend$components$settings$whiteboards_switcher_row(enabled_QMARK_){
return frontend.components.settings.row_with_button_action(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"left-label","left-label",-1662718913),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","enable-whiteboards","settings-page/enable-whiteboards",-739283258)], 0)),new cljs.core.Keyword(null,"action","action",-811238024),frontend.components.settings.whiteboards_enabled_switcher(enabled_QMARK_)], null));
});
frontend.components.settings.settings_account_usage_description = rum.core.lazy_build(rum.core.build_defc,(function (pro_account_QMARK_,graph_usage){
var count_usage = cljs.core.count(graph_usage);
var count_limit = (cljs.core.truth_(pro_account_QMARK_)?(10):(1));
var count_percent = Math.round(((count_usage / count_limit) / 0.01));
var storage_usage = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._PLUS_,(0),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"used-gbs","used-gbs",271660092),graph_usage));
var storage_usage_formatted = (((storage_usage === (0)))?"0.0":(((storage_usage < 0.01))?"Less than 0.01":goog.string.format("%.2f",storage_usage)
));
var default_storage_limit = (cljs.core.truth_(pro_account_QMARK_)?(10):0.05);
var storage_limit = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._PLUS_,(0),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92904_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(graph_usage,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__92904_SHARP_,new cljs.core.Keyword(null,"limit-gbs","limit-gbs",-997314467)], null),default_storage_limit);
}),cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),count_limit)));
var storage_percent = ((storage_usage / storage_limit) / 0.01);
var storage_percent_formatted = goog.string.format("%.1f",storage_percent);
var attrs92905 = (cljs.core.truth_(pro_account_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),goog.string.format("%s of %s synced graphs ",count_usage,count_limit),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.text-white","strong.text-white",1320859471),goog.string.format("(%s%%)",count_percent)], null),", "], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92905))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm"], null)], null),attrs92905], 0))):{'className':"text-sm"}),((cljs.core.map_QMARK_(attrs92905))?[goog.string.format("%sGB of %sGB total storage ",storage_usage_formatted,storage_limit),daiquiri.core.create_element("strong",{'className':"text-white"},[goog.string.format("(%s%%)",storage_percent_formatted)])]:[daiquiri.interpreter.interpret(attrs92905),goog.string.format("%sGB of %sGB total storage ",storage_usage_formatted,storage_limit),daiquiri.core.create_element("strong",{'className':"text-white"},[goog.string.format("(%s%%)",storage_percent_formatted)])]));
}),null,"frontend.components.settings/settings-account-usage-description");
frontend.components.settings.settings_account_usage_graphs = rum.core.lazy_build(rum.core.build_defc,(function (_pro_account_QMARK_,graph_usage){
if(((0) < cljs.core.count(graph_usage))){
return daiquiri.core.create_element("div",{'style':{'gridTemplateColumns':["repeat(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(graph_usage)),", 1fr)"].join('')},'className':"grid gap-3"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$settings$iter__92906(s__92907){
return (new cljs.core.LazySeq(null,(function (){
var s__92907__$1 = s__92907;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92907__$1);
if(temp__5804__auto__){
var s__92907__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92907__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92907__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92909 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92908 = (0);
while(true){
if((i__92908 < size__5479__auto__)){
var map__92910 = cljs.core._nth(c__5478__auto__,i__92908);
var map__92910__$1 = cljs.core.__destructure_map(map__92910);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92910__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var used_percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92910__$1,new cljs.core.Keyword(null,"used-percent","used-percent",-1822070047));
var color = ((((100) <= used_percent))?"bg-red-500":"bg-blue-500");
cljs.core.chunk_append(b__92909,daiquiri.core.create_element("div",{'tooltip':name,'className':"rounded-full w-full h-2 bg-black/50"},[daiquiri.core.create_element("div",{'style':{'width':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(used_percent),"%"].join(''),'minWidth':"0.5rem",'maxWidth':"100%"},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-full","h-2",color], null))},[])]));

var G__92993 = (i__92908 + (1));
i__92908 = G__92993;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92909),frontend$components$settings$iter__92906(cljs.core.chunk_rest(s__92907__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92909),null);
}
} else {
var map__92911 = cljs.core.first(s__92907__$2);
var map__92911__$1 = cljs.core.__destructure_map(map__92911);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92911__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var used_percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92911__$1,new cljs.core.Keyword(null,"used-percent","used-percent",-1822070047));
var color = ((((100) <= used_percent))?"bg-red-500":"bg-blue-500");
return cljs.core.cons(daiquiri.core.create_element("div",{'tooltip':name,'className':"rounded-full w-full h-2 bg-black/50"},[daiquiri.core.create_element("div",{'style':{'width':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(used_percent),"%"].join(''),'minWidth':"0.5rem",'maxWidth':"100%"},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-full","h-2",color], null))},[])]),frontend$components$settings$iter__92906(cljs.core.rest(s__92907__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(graph_usage);
})())]);
} else {
return null;
}
}),null,"frontend.components.settings/settings-account-usage-graphs");
frontend.components.settings.settings_account = rum.core.lazy_build(rum.core.build_defc,(function (){
var current_graph_uuid = frontend.state.sub_current_file_sync_graph_uuid();
var graph_usage = frontend.state.get_remote_graph_usage();
var current_graph_is_remote_QMARK_ = (function (){var fexpr__92912 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uuid","uuid",-2145095719),graph_usage));
return (fexpr__92912.cljs$core$IFn$_invoke$arity$1 ? fexpr__92912.cljs$core$IFn$_invoke$arity$1(current_graph_uuid) : fexpr__92912.call(null,current_graph_uuid));
})();
var logged_in_QMARK_ = frontend.handler.user.logged_in_QMARK_();
var user_info = frontend.state.get_user_info();
var paid_user_QMARK_ = (function (){var G__92914 = new cljs.core.Keyword(null,"LemonStatus","LemonStatus",-1872117472).cljs$core$IFn$_invoke$arity$1(user_info);
var fexpr__92913 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["cancelled",null,"on_trial",null,"active",null], null), null);
return (fexpr__92913.cljs$core$IFn$_invoke$arity$1 ? fexpr__92913.cljs$core$IFn$_invoke$arity$1(G__92914) : fexpr__92913.call(null,G__92914));
})();
var gift_user_QMARK_ = cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["pro",null], null), null),new cljs.core.Keyword(null,"UserGroups","UserGroups",1693861388).cljs$core$IFn$_invoke$arity$1(user_info));
var pro_account_QMARK_ = (function (){var or__5002__auto__ = paid_user_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return gift_user_QMARK_;
}
})();
var expiration_date = (function (){var G__92915 = user_info;
var G__92915__$1 = (((G__92915 == null))?null:new cljs.core.Keyword(null,"LemonEndsAt","LemonEndsAt",-914445868).cljs$core$IFn$_invoke$arity$1(G__92915));
if((G__92915__$1 == null)){
return null;
} else {
return frontend.date.parse_iso(G__92915__$1);
}
})();
var renewal_date = (function (){var G__92916 = user_info;
var G__92916__$1 = (((G__92916 == null))?null:new cljs.core.Keyword(null,"LemonRenewsAt","LemonRenewsAt",-398590396).cljs$core$IFn$_invoke$arity$1(G__92916));
if((G__92916__$1 == null)){
return null;
} else {
return frontend.date.parse_iso(G__92916__$1);
}
})();
var has_subscribed_QMARK_ = (!((new cljs.core.Keyword(null,"LemonStatus","LemonStatus",-1872117472).cljs$core$IFn$_invoke$arity$1(user_info) == null)));
return daiquiri.core.create_element("div",{'className':"panel-wrap is-features mb-8"},[(function (){var attrs92917 = ((logged_in_QMARK_)?new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.grid-cols-3.gap-8.pt-2","div.grid.grid-cols-3.gap-8.pt-2",290782413),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Current plan"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2","div.col-span-2",-228761363),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-full bg-gray-500/10 rounded-lg p-4 flex flex-col gap-4"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-4.items-center","div.flex.gap-4.items-center",1354546562),(cljs.core.truth_(pro_account_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),"Pro"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),"Free"], null)),((has_subscribed_QMARK_)?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Manage plan",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"icon","icon",1679606541),"upload"], null)], 0)):((cljs.core.not(pro_account_QMARK_))?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Upgrade plan",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center",new cljs.core.Keyword(null,"icon","icon",1679606541),"upload",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.upgrade], null)], 0)):null
))], null),frontend.components.settings.settings_account_usage_graphs(pro_account_QMARK_,graph_usage),frontend.components.settings.settings_account_usage_description(pro_account_QMARK_,graph_usage),(cljs.core.truth_(current_graph_is_remote_QMARK_)?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Deactivate syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"icon","icon",1679606541),"cloud-off"], null)], 0)):frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Activate syncing",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center",new cljs.core.Keyword(null,"background","background",-863952629),"blue",new cljs.core.Keyword(null,"icon","icon",1679606541),"cloud",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.file_sync.maybe_onboarding_show(new cljs.core.Keyword(null,"sync-initiate","sync-initiate",1636471756));
})], null)], 0)))], null)], null),((has_subscribed_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Billing"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2.flex.flex-col.gap-4","div.col-span-2.flex.flex-col.gap-4",1390783784),(cljs.core.truth_((function (){var and__5000__auto__ = renewal_date;
if(cljs.core.truth_(and__5000__auto__)){
return (expiration_date == null);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),"Next billing date: ",frontend.date.get_locale_string(renewal_date)], null)], null):((((new Date()) < expiration_date))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),"Pro plan expires on: ",frontend.date.get_locale_string(expiration_date)], null)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-semibold","strong.font-semibold",1691174885),"Pro plan expired on: ",frontend.date.get_locale_string(expiration_date)], null)], null)
)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Open invoices",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-full h-8 p-1 justify-center",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"icon","icon",1679606541),"receipt"], null)], 0))], null)], null)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Profile"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2.grid.grid-cols-2.gap-4","div.col-span-2.grid.grid-cols-2.gap-4",-701221645),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-2.box-border","div.flex.flex-col.gap-2.box-border",-278902786),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"basis-1/2"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.text-sm.font-semibold","label.text-sm.font-semibold",1064326551),"First name"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.rounded.border.px-2.py-1.box-border","input.rounded.border.px-2.py-1.box-border",1870923625),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"border-blue-500 bg-black/25 w-full"], null)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-2","div.flex.flex-col.gap-2",1564729900),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"basis-1/2"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.text-sm.font-semibold","label.text-sm.font-semibold",1064326551),"Last name"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.rounded.border.px-2.py-1.box-border","input.rounded.border.px-2.py-1.box-border",1870923625),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"border-blue-500 bg-black/25 w-full"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.flex.flex-col.gap-2.col-span-2","div.flex-1.flex.flex-col.gap-2.col-span-2",-2141170604),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.text-sm.font-semibold","label.text-sm.font-semibold",1064326551),"Username"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.rounded.border.px-2.py-1.box-border","input.rounded.border.px-2.py-1.box-border",1870923625),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"border-blue-500 bg-black/25",new cljs.core.Keyword(null,"value","value",305978217),frontend.handler.user.email()], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Authentication"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2","div.col-span-2",-228761363),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.grid-cols-2.gap-4","div.grid.grid-cols-2.gap-4",-491431037),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"logout","logout",1418564329)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center w-full",new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"icon","icon",1679606541),"logout",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Reset password",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center w-full",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"icon","icon",1679606541),"key",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2","div.col-span-2",-228761363),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Delete Account",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 h-8 justify-center w-full",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"background","background",-863952629),"red"], null)], 0))], null)], null)], null)], null):(((!(logged_in_QMARK_)))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.grid-cols-3.gap-8.pt-2","div.grid.grid-cols-3.gap-8.pt-2",290782413),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Authentication"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2.flex.flex-wrap.gap-4","div.col-span-2.flex.flex-wrap.gap-4",1230706020),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-full.text-white","div.w-full.text-white",-488938165),"With a Logseq account, you can access cloud-based services like Logseq Sync and alpha/beta features."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Sign up",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 w-full text-center justify-center",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_settings_BANG_();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","login","user/login",51503538)], null));
})], null)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"login","login",55217519)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),"login",new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 w-full text-center justify-center",new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_settings_BANG_();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","login","user/login",51503538)], null));
})], null)], 0))], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-3.flex.flex-col.gap-4","div.col-span-3.flex.flex-col.gap-4",157916243),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-black/20 p-4 rounded-lg"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.w-full.items-center","div.flex.w-full.items-center",802327045),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-1/2 text-lg"], null),"Discover the power of ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-white/80"], null),"Logseq Sync"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-1/2 bg-gradient-to-r from-white/10 to-transparent p-3 rounded-lg flex items-center gap-2 px-5 ml-5"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-3.h-3.rounded-full.bg-green-500","div.w-3.h-3.rounded-full.bg-green-500",-1431849955)], null),"Synced"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.w-full.gap-4","div.flex.w-full.gap-4",-1379783377),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-1/2 bg-black/50 rounded-lg p-4 pt-10 relative flex flex-col gap-4"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute.top-0.left-4.bg-gray-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs","div.absolute.top-0.left-4.bg-gray-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs",987025160),"Free"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.text-white.text-xl.font-normal","strong.text-white.text-xl.font-normal",1050344267),"$0"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-white.font-bold","div.text-white.font-bold",1366308171),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-[2.5rem] "], null),"Get started with basic syncing"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5","ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5",-2115791392),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Unlimited unsynced graphs"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"1 synced graph (up to 50MB, notes only)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"No asset syncing"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Access to core Logseq features"], null)], null)], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-1/2 bg-black/50 rounded-lg p-4 pt-10 relative flex flex-col gap-4"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute.top-0.left-4.bg-blue-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs","div.absolute.top-0.left-4.bg-blue-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs",-1751797796),"Pro"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.text-white.text-xl.font-normal","strong.text-white.text-xl.font-normal",1050344267),"$10"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs.font-base","span.text-xs.font-base",2010205099),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ml-0.5"], null),"/ month"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-white.font-bold","div.text-white.font-bold",1366308171),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-[2.5rem]"], null),"Unlock advanced syncing and more"], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5","ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5",-2115791392),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Unlimited unsynced graphs"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"10 synced graphs (up to 5GB each)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Sync assets up to 100MB per file"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Early access to alpha/beta features"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"Upcoming cloud-based features, including Logseq Publish"], null)], null)], null)], null)], null)], null):null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92917))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1","sm:mt-0","sm:col-span-2"], null)], null),attrs92917], 0))):{'className':"mt-1 sm:mt-0 sm:col-span-2"}),((cljs.core.map_QMARK_(attrs92917))?null:[daiquiri.interpreter.interpret(attrs92917)]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/settings-account");
frontend.components.settings.settings_features = rum.core.lazy_build(rum.core.build_defc,(function (){
var current_repo = frontend.state.get_current_repo();
var enable_journals_QMARK_ = frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var enable_flashcards_QMARK_ = frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var enable_sync_QMARK_ = frontend.state.enable_sync_QMARK_();
var enable_sync_diff_merge_QMARK_ = frontend.state.enable_sync_diff_merge_QMARK_();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var enable_whiteboards_QMARK_ = frontend.state.enable_whiteboards_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var logged_in_QMARK_ = frontend.handler.user.logged_in_QMARK_();
var attrs92918 = frontend.components.settings.journal_row(enable_journals_QMARK_);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92918))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["panel-wrap","is-features","mb-8"], null)], null),attrs92918], 0))):{'className':"panel-wrap is-features mb-8"}),((cljs.core.map_QMARK_(attrs92918))?[(((!(enable_journals_QMARK_)))?daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[daiquiri.core.create_element("label",{'className':"block text-sm font-medium leading-5 opacity-70",'htmlFor':"default page"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","home-default-page","settings-page/home-default-page",-2049462828)], 0)))]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md sm:max-w-xs"},[daiquiri.core.create_element("input",{'id':"home-default-page",'defaultValue':frontend.state.sub_default_home_page(),'onBlur':frontend.components.settings.update_home_page,'onKeyPress':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
return frontend.components.settings.update_home_page(e);
} else {
return null;
}
}),'className':"form-input is-small transition duration-150 ease-in-out"},[])])])]):null),((db_based_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.whiteboards_switcher_row(enable_whiteboards_QMARK_))),((((frontend.util.web_platform_QMARK_) && (frontend.config.feature_plugin_system_on_QMARK_)))?daiquiri.interpreter.interpret(frontend.components.settings.plugin_system_switcher_row()):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.http_server_switcher_row()):null),daiquiri.interpreter.interpret(frontend.components.settings.flashcards_switcher_row(enable_flashcards_QMARK_)),((db_based_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.zotero_settings_row())),((((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)) && (frontend.handler.user.team_member_QMARK_())))?daiquiri.interpreter.interpret(frontend.components.settings.rtc_switcher_row(frontend.state.enable_rtc_QMARK_())):null),((frontend.util.web_platform_QMARK_)?null:daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("hr",null,null),((logged_in_QMARK_)?(function (){var attrs92921 = frontend.handler.user.email();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92921))?daiquiri.interpreter.element_attributes(attrs92921):null),((cljs.core.map_QMARK_(attrs92921))?[(function (){var attrs92922 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"logout","logout",1418564329)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"logout",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92922))?daiquiri.interpreter.element_attributes(attrs92922):null),((cljs.core.map_QMARK_(attrs92922))?null:[daiquiri.interpreter.interpret(attrs92922)]));
})()]:[daiquiri.interpreter.interpret(attrs92921),(function (){var attrs92923 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"logout","logout",1418564329)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"logout",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92923))?daiquiri.interpreter.element_attributes(attrs92923):null),((cljs.core.map_QMARK_(attrs92923))?null:[daiquiri.interpreter.interpret(attrs92923)]));
})()]));
})():(function (){var attrs92924 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"login","login",55217519)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"login",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_settings_BANG_();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","login","user/login",51503538)], null));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92924))?daiquiri.interpreter.element_attributes(attrs92924):null),((cljs.core.map_QMARK_(attrs92924))?[(function (){var attrs92925 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","login-prompt","settings-page/login-prompt",794382699)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92925))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50"], null)], null),attrs92925], 0))):{'className':"text-sm opacity-50"}),((cljs.core.map_QMARK_(attrs92925))?null:[daiquiri.interpreter.interpret(attrs92925)]));
})()]:[daiquiri.interpreter.interpret(attrs92924),(function (){var attrs92926 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","login-prompt","settings-page/login-prompt",794382699)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92926))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50"], null)], null),attrs92926], 0))):{'className':"text-sm opacity-50"}),((cljs.core.map_QMARK_(attrs92926))?null:[daiquiri.interpreter.interpret(attrs92926)]));
})()]));
})())])),((frontend.util.web_platform_QMARK_)?null:daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92927 = frontend.ui.icon(((logged_in_QMARK_)?"lock-open":"lock"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1"], null));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92927))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","font-medium","leading-5","self-start","mt-1"], null)], null),attrs92927], 0))):{'className':"flex font-medium leading-5 self-start mt-1"}),((cljs.core.map_QMARK_(attrs92927))?[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","beta-features","settings-page/beta-features",-1456488418)], 0)))]:[daiquiri.interpreter.interpret(attrs92927),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","beta-features","settings-page/beta-features",-1456488418)], 0)))]));
})()]),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-4",(cljs.core.truth_(frontend.handler.user.alpha_or_beta_user_QMARK_)?null:"opacity-50 pointer-events-none cursor-not-allowed")], null))},[daiquiri.interpreter.interpret(frontend.components.settings.sync_switcher_row(current_repo,enable_sync_QMARK_)),(cljs.core.truth_((function (){var and__5000__auto__ = enable_sync_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(frontend.components.settings.sync_diff_merge_switcher_row(enable_sync_diff_merge_QMARK_)):null),(function (){var attrs92928 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-1","settings-page/sync-desc-1",553194869)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92928))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm"], null)], null),attrs92928], 0))):{'className':"text-sm"}),((cljs.core.map_QMARK_(attrs92928))?[daiquiri.core.create_element("a",{'href':"https://blog.logseq.com/how-to-setup-and-use-logseq-sync/",'target':"_blank",'className':"mx-1"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-2","settings-page/sync-desc-2",-518718326)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-3","settings-page/sync-desc-3",1385541959)], 0)))]:[daiquiri.interpreter.interpret(attrs92928),daiquiri.core.create_element("a",{'href':"https://blog.logseq.com/how-to-setup-and-use-logseq-sync/",'target':"_blank",'className':"mx-1"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-2","settings-page/sync-desc-2",-518718326)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-3","settings-page/sync-desc-3",1385541959)], 0)))]));
})()])]))]:[daiquiri.interpreter.interpret(attrs92918),(((!(enable_journals_QMARK_)))?daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[daiquiri.core.create_element("label",{'className':"block text-sm font-medium leading-5 opacity-70",'htmlFor':"default page"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","home-default-page","settings-page/home-default-page",-2049462828)], 0)))]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md sm:max-w-xs"},[daiquiri.core.create_element("input",{'id':"home-default-page",'defaultValue':frontend.state.sub_default_home_page(),'onBlur':frontend.components.settings.update_home_page,'onKeyPress':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
return frontend.components.settings.update_home_page(e);
} else {
return null;
}
}),'className':"form-input is-small transition duration-150 ease-in-out"},[])])])]):null),((db_based_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.whiteboards_switcher_row(enable_whiteboards_QMARK_))),((((frontend.util.web_platform_QMARK_) && (frontend.config.feature_plugin_system_on_QMARK_)))?daiquiri.interpreter.interpret(frontend.components.settings.plugin_system_switcher_row()):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.interpreter.interpret(frontend.components.settings.http_server_switcher_row()):null),daiquiri.interpreter.interpret(frontend.components.settings.flashcards_switcher_row(enable_flashcards_QMARK_)),((db_based_QMARK_)?null:daiquiri.interpreter.interpret(frontend.components.settings.zotero_settings_row())),((((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)) && (frontend.handler.user.team_member_QMARK_())))?daiquiri.interpreter.interpret(frontend.components.settings.rtc_switcher_row(frontend.state.enable_rtc_QMARK_())):null),((frontend.util.web_platform_QMARK_)?null:daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("hr",null,null),((logged_in_QMARK_)?(function (){var attrs92931 = frontend.handler.user.email();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92931))?daiquiri.interpreter.element_attributes(attrs92931):null),((cljs.core.map_QMARK_(attrs92931))?[(function (){var attrs92932 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"logout","logout",1418564329)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"logout",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92932))?daiquiri.interpreter.element_attributes(attrs92932):null),((cljs.core.map_QMARK_(attrs92932))?null:[daiquiri.interpreter.interpret(attrs92932)]));
})()]:[daiquiri.interpreter.interpret(attrs92931),(function (){var attrs92933 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"logout","logout",1418564329)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"logout",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92933))?daiquiri.interpreter.element_attributes(attrs92933):null),((cljs.core.map_QMARK_(attrs92933))?null:[daiquiri.interpreter.interpret(attrs92933)]));
})()]));
})():(function (){var attrs92934 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"login","login",55217519)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-1",new cljs.core.Keyword(null,"icon","icon",1679606541),"login",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.close_settings_BANG_();

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","login","user/login",51503538)], null));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92934))?daiquiri.interpreter.element_attributes(attrs92934):null),((cljs.core.map_QMARK_(attrs92934))?[(function (){var attrs92935 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","login-prompt","settings-page/login-prompt",794382699)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92935))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50"], null)], null),attrs92935], 0))):{'className':"text-sm opacity-50"}),((cljs.core.map_QMARK_(attrs92935))?null:[daiquiri.interpreter.interpret(attrs92935)]));
})()]:[daiquiri.interpreter.interpret(attrs92934),(function (){var attrs92936 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","login-prompt","settings-page/login-prompt",794382699)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs92936))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50"], null)], null),attrs92936], 0))):{'className':"text-sm opacity-50"}),((cljs.core.map_QMARK_(attrs92936))?null:[daiquiri.interpreter.interpret(attrs92936)]));
})()]));
})())])),((frontend.util.web_platform_QMARK_)?null:daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"},[(function (){var attrs92937 = frontend.ui.icon(((logged_in_QMARK_)?"lock-open":"lock"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1"], null));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs92937))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","font-medium","leading-5","self-start","mt-1"], null)], null),attrs92937], 0))):{'className':"flex font-medium leading-5 self-start mt-1"}),((cljs.core.map_QMARK_(attrs92937))?[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","beta-features","settings-page/beta-features",-1456488418)], 0)))]:[daiquiri.interpreter.interpret(attrs92937),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","beta-features","settings-page/beta-features",-1456488418)], 0)))]));
})()]),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-4",(cljs.core.truth_(frontend.handler.user.alpha_or_beta_user_QMARK_)?null:"opacity-50 pointer-events-none cursor-not-allowed")], null))},[daiquiri.interpreter.interpret(frontend.components.settings.sync_switcher_row(current_repo,enable_sync_QMARK_)),(cljs.core.truth_((function (){var and__5000__auto__ = enable_sync_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(frontend.components.settings.sync_diff_merge_switcher_row(enable_sync_diff_merge_QMARK_)):null),(function (){var attrs92938 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-1","settings-page/sync-desc-1",553194869)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92938))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm"], null)], null),attrs92938], 0))):{'className':"text-sm"}),((cljs.core.map_QMARK_(attrs92938))?[daiquiri.core.create_element("a",{'href':"https://blog.logseq.com/how-to-setup-and-use-logseq-sync/",'target':"_blank",'className':"mx-1"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-2","settings-page/sync-desc-2",-518718326)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-3","settings-page/sync-desc-3",1385541959)], 0)))]:[daiquiri.interpreter.interpret(attrs92938),daiquiri.core.create_element("a",{'href':"https://blog.logseq.com/how-to-setup-and-use-logseq-sync/",'target':"_blank",'className':"mx-1"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-2","settings-page/sync-desc-2",-518718326)], 0)))]),daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","sync-desc-3","settings-page/sync-desc-3",1385541959)], 0)))]));
})()])]))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.settings/settings-features");
frontend.components.settings.DEFAULT_ACTIVE_TAB_STATE = ((frontend.config.ENABLE_SETTINGS_ACCOUNT_TAB)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"account","account",718006320),new cljs.core.Keyword(null,"account","account",718006320)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"general","general",380803686),new cljs.core.Keyword(null,"general","general",380803686)], null));
frontend.components.settings.settings_effect = rum.core.lazy_build(rum.core.build_defc,(function (active){
logseq.shui.hooks.use_effect_BANG_((function (){
var active__$1 = (function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(active);
if(and__5000__auto__){
return cljs.core.name(cljs.core.first(active));
} else {
return and__5000__auto__;
}
})();
var ds = document.body.dataset;
if(cljs.core.truth_(active__$1)){
(ds.settingsTab = active__$1);
} else {
delete ds["settingsTab"];
}

return (function (){
return delete ds["settingsTab"];
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [active], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.settings/settings-effect");
frontend.components.settings.settings_collaboration = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_invite_email = new cljs.core.Keyword("frontend.components.settings","invite-email","frontend.components.settings/invite-email",-1977808057).cljs$core$IFn$_invoke$arity$1(state);
var current_repo = frontend.state.get_current_repo();
var users = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("rtc","users-info","rtc/users-info",8288930)),current_repo);
return daiquiri.core.create_element("div",{'className':"panel-wrap is-collaboration mb-8"},[daiquiri.core.create_element("div",{'className':"flex flex-col gap-2 mt-4"},[daiquiri.core.create_element("h2",{'className':"opacity-50 font-medium"},["Members:"]),daiquiri.core.create_element("div",{'className':"users flex flex-col gap-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$settings$iter__92947(s__92948){
return (new cljs.core.LazySeq(null,(function (){
var s__92948__$1 = s__92948;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92948__$1);
if(temp__5804__auto__){
var s__92948__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92948__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92948__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92950 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92949 = (0);
while(true){
if((i__92949 < size__5479__auto__)){
var map__92951 = cljs.core._nth(c__5478__auto__,i__92949);
var map__92951__$1 = cljs.core.__destructure_map(map__92951);
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92951__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92951__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var graph_LT___GT_user_user_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92951__$1,new cljs.core.Keyword("graph<->user","user-type","graph<->user/user-type",-237330466));
cljs.core.chunk_append(b__92950,daiquiri.core.create_element("div",{'key':["user-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(user_name)].join(''),'className':"flex flex-row items-center gap-2"},[(function (){var attrs92952 = user_name;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92952))?daiquiri.interpreter.element_attributes(attrs92952):null),((cljs.core.map_QMARK_(attrs92952))?null:[daiquiri.interpreter.interpret(attrs92952)]));
})(),(cljs.core.truth_(user_email)?(function (){var attrs92953 = user_email;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92953))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs92953], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs92953))?null:[daiquiri.interpreter.interpret(attrs92953)]));
})():null),(cljs.core.truth_(graph_LT___GT_user_user_type)?daiquiri.core.create_element("div",{'className':"opacity-50 text-sm"},[cljs.core.name(graph_LT___GT_user_user_type)]):null)]));

var G__92998 = (i__92949 + (1));
i__92949 = G__92998;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92950),frontend$components$settings$iter__92947(cljs.core.chunk_rest(s__92948__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92950),null);
}
} else {
var map__92954 = cljs.core.first(s__92948__$2);
var map__92954__$1 = cljs.core.__destructure_map(map__92954);
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92954__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92954__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var graph_LT___GT_user_user_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__92954__$1,new cljs.core.Keyword("graph<->user","user-type","graph<->user/user-type",-237330466));
return cljs.core.cons(daiquiri.core.create_element("div",{'key':["user-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(user_name)].join(''),'className':"flex flex-row items-center gap-2"},[(function (){var attrs92952 = user_name;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92952))?daiquiri.interpreter.element_attributes(attrs92952):null),((cljs.core.map_QMARK_(attrs92952))?null:[daiquiri.interpreter.interpret(attrs92952)]));
})(),(cljs.core.truth_(user_email)?(function (){var attrs92953 = user_email;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92953))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs92953], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs92953))?null:[daiquiri.interpreter.interpret(attrs92953)]));
})():null),(cljs.core.truth_(graph_LT___GT_user_user_type)?daiquiri.core.create_element("div",{'className':"opacity-50 text-sm"},[cljs.core.name(graph_LT___GT_user_user_type)]):null)]),frontend$components$settings$iter__92947(cljs.core.rest(s__92948__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(users);
})())]),(function (){var attrs92946 = (function (){var G__92955 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Email address",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__92941_SHARP_){
return cljs.core.reset_BANG_(_STAR_invite_email,frontend.util.evalue(p1__92941_SHARP_));
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__92955) : logseq.shui.ui.input.call(null,G__92955));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs92946))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","gap-4","mt-4"], null)], null),attrs92946], 0))):{'className':"flex flex-col gap-4 mt-4"}),((cljs.core.map_QMARK_(attrs92946))?[daiquiri.interpreter.interpret((function (){var G__92958 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var user_email = cljs.core.deref(_STAR_invite_email);
var graph_uuid = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(clojure.string.blank_QMARK_(user_email)){
return null;
} else {
if(cljs.core.truth_(graph_uuid)){
return frontend.handler.db_based.rtc._LT_rtc_invite_email(graph_uuid,user_email);
} else {
return null;
}
}
})], null);
var G__92959 = "Invite";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92958,G__92959) : logseq.shui.ui.button.call(null,G__92958,G__92959));
})())]:[daiquiri.interpreter.interpret(attrs92946),daiquiri.interpreter.interpret((function (){var G__92962 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var user_email = cljs.core.deref(_STAR_invite_email);
var graph_uuid = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(clojure.string.blank_QMARK_(user_email)){
return null;
} else {
if(cljs.core.truth_(graph_uuid)){
return frontend.handler.db_based.rtc._LT_rtc_invite_email(graph_uuid,user_email);
} else {
return null;
}
}
})], null);
var G__92963 = "Invite";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__92962,G__92963) : logseq.shui.ui.button.call(null,G__92962,G__92963));
})())]));
})()])]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.settings","invite-email","frontend.components.settings/invite-email",-1977808057)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.handler.db_based.rtc._LT_rtc_get_users_info();

return state;
})], null)], null),"frontend.components.settings/settings-collaboration");
frontend.components.settings.settings = rum.core.lazy_build(rum.core.build_defcs,(function (state,_active_tab){
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var _installed_plugins = frontend.state.sub(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034));
var plugins_of_settings = (function (){var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(frontend.handler.plugin.get_enabled_plugins_if_setting_schema());
} else {
return and__5000__auto__;
}
})();
var _STAR_active = new cljs.core.Keyword("frontend.components.settings","active","frontend.components.settings/active",-1461390411).cljs$core$IFn$_invoke$arity$1(state);
var logged_in_QMARK_ = frontend.handler.user.logged_in_QMARK_();
return daiquiri.core.create_element("div",{'id':"settings",'className':"cp__settings-main"},[frontend.components.settings.settings_effect(cljs.core.deref(_STAR_active)),daiquiri.core.create_element("div",{'className':"cp__settings-inner"},[daiquiri.core.create_element("aside",{'style':{'minWidth':"10rem"},'className':"md:w-64"},[daiquiri.core.create_element("header",{'className':"cp__settings-header"},[(function (){var attrs92964 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"settings","settings",1556144875)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs92964))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__settings-modal-title"], null)], null),attrs92964], 0))):{'className':"cp__settings-modal-title"}),((cljs.core.map_QMARK_(attrs92964))?null:[daiquiri.interpreter.interpret(attrs92964)]));
})()]),daiquiri.core.create_element("ul",{'className':"settings-menu"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$settings$iter__92965(s__92966){
return (new cljs.core.LazySeq(null,(function (){
var s__92966__$1 = s__92966;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__92966__$1);
if(temp__5804__auto__){
var s__92966__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__92966__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__92966__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__92968 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__92967 = (0);
while(true){
if((i__92967 < size__5479__auto__)){
var vec__92969 = cljs.core._nth(c__5478__auto__,i__92967);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92969,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92969,(1),null);
var text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92969,(2),null);
var icon = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92969,(3),null);
cljs.core.chunk_append(b__92968,(cljs.core.truth_(label)?daiquiri.core.create_element("li",{'key':text,'data-id':id,'onClick':((function (i__92967,vec__92969,label,id,text,icon,c__5478__auto__,size__5479__auto__,b__92968,s__92966__$2,temp__5804__auto__,current_repo,_installed_plugins,plugins_of_settings,_STAR_active,logged_in_QMARK_){
return (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,new cljs.core.Keyword(null,"plugins-setting","plugins-setting",-1797317643))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.first(plugins_of_settings))], null));
} else {
return cljs.core.reset_BANG_(_STAR_active,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [label,cljs.core.first(cljs.core.deref(_STAR_active))], null));
}
});})(i__92967,vec__92969,label,id,text,icon,c__5478__auto__,size__5479__auto__,b__92968,s__92966__$2,temp__5804__auto__,current_repo,_installed_plugins,plugins_of_settings,_STAR_active,logged_in_QMARK_))
,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["settings-menu-item",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,cljs.core.first(cljs.core.deref(_STAR_active)))], null)], null))], null))},[(function (){var attrs92972 = icon;
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs92972))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","settings-menu-link"], null)], null),attrs92972], 0))):{'className':"flex items-center settings-menu-link"}),((cljs.core.map_QMARK_(attrs92972))?[(function (){var attrs92973 = text;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs92973))?daiquiri.interpreter.element_attributes(attrs92973):null),((cljs.core.map_QMARK_(attrs92973))?null:[daiquiri.interpreter.interpret(attrs92973)]));
})()]:[daiquiri.interpreter.interpret(attrs92972),(function (){var attrs92974 = text;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs92974))?daiquiri.interpreter.element_attributes(attrs92974):null),((cljs.core.map_QMARK_(attrs92974))?null:[daiquiri.interpreter.interpret(attrs92974)]));
})()]));
})()]):null));

var G__93009 = (i__92967 + (1));
i__92967 = G__93009;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__92968),frontend$components$settings$iter__92965(cljs.core.chunk_rest(s__92966__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__92968),null);
}
} else {
var vec__92975 = cljs.core.first(s__92966__$2);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92975,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92975,(1),null);
var text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92975,(2),null);
var icon = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92975,(3),null);
return cljs.core.cons((cljs.core.truth_(label)?daiquiri.core.create_element("li",{'key':text,'data-id':id,'onClick':((function (vec__92975,label,id,text,icon,s__92966__$2,temp__5804__auto__,current_repo,_installed_plugins,plugins_of_settings,_STAR_active,logged_in_QMARK_){
return (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,new cljs.core.Keyword(null,"plugins-setting","plugins-setting",-1797317643))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.first(plugins_of_settings))], null));
} else {
return cljs.core.reset_BANG_(_STAR_active,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [label,cljs.core.first(cljs.core.deref(_STAR_active))], null));
}
});})(vec__92975,label,id,text,icon,s__92966__$2,temp__5804__auto__,current_repo,_installed_plugins,plugins_of_settings,_STAR_active,logged_in_QMARK_))
,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["settings-menu-item",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,cljs.core.first(cljs.core.deref(_STAR_active)))], null)], null))], null))},[(function (){var attrs92972 = icon;
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs92972))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","settings-menu-link"], null)], null),attrs92972], 0))):{'className':"flex items-center settings-menu-link"}),((cljs.core.map_QMARK_(attrs92972))?[(function (){var attrs92973 = text;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs92973))?daiquiri.interpreter.element_attributes(attrs92973):null),((cljs.core.map_QMARK_(attrs92973))?null:[daiquiri.interpreter.interpret(attrs92973)]));
})()]:[daiquiri.interpreter.interpret(attrs92972),(function (){var attrs92974 = text;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs92974))?daiquiri.interpreter.element_attributes(attrs92974):null),((cljs.core.map_QMARK_(attrs92974))?null:[daiquiri.interpreter.interpret(attrs92974)]));
})()]));
})()]):null),frontend$components$settings$iter__92965(cljs.core.rest(s__92966__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [((frontend.config.ENABLE_SETTINGS_ACCOUNT_TAB)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"account","account",718006320),"account",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-account","settings-page/tab-account",489752642)], 0)),frontend.ui.icon("user-circle")], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"general","general",380803686),"general",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-general","settings-page/tab-general",1840304513)], 0)),frontend.ui.icon("adjustments")], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"editor","editor",-989377770),"editor",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-editor","settings-page/tab-editor",-1772715324)], 0)),frontend.ui.icon("writing")], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"keymap","keymap",-499605268),"keymap",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-keymap","settings-page/tab-keymap",264389435)], 0)),frontend.ui.icon("keyboard")], null),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"version-control","version-control",-170929403),"git",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-version-control","settings-page/tab-version-control",-65211424)], 0)),frontend.ui.icon("history")], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"advanced","advanced",-451287892),"advanced",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-advanced","settings-page/tab-advanced",-1070820797)], 0)),frontend.ui.icon("bulb")], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"features","features",-1146962336),"features",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-features","settings-page/tab-features",-69488817)], 0)),frontend.ui.icon("app-feature")], null),((logged_in_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"collaboration","collaboration",266985379),"collaboration",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","tab-collaboration","settings-page/tab-collaboration",1980583476)], 0)),frontend.ui.icon("users")], null):null),(cljs.core.truth_(plugins_of_settings)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugins-setting","plugins-setting",-1797317643),"plugins",frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"settings-of-plugins","settings-of-plugins",-1896805353)], 0)),frontend.ui.icon("puzzle")], null):null)], null));
})())])]),daiquiri.core.create_element("article",null,[daiquiri.core.create_element("header",{'className':"cp__settings-header"},[(function (){var attrs92978 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(["settings-page/tab-",cljs.core.name(cljs.core.first(cljs.core.deref(_STAR_active)))].join(''))], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs92978))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__settings-category-title"], null)], null),attrs92978], 0))):{'className':"cp__settings-category-title"}),((cljs.core.map_QMARK_(attrs92978))?null:[daiquiri.interpreter.interpret(attrs92978)]));
})()]),(function (){var G__92979 = cljs.core.first(cljs.core.deref(_STAR_active));
var G__92979__$1 = (((G__92979 instanceof cljs.core.Keyword))?G__92979.fqn:null);
switch (G__92979__$1) {
case "plugins-setting":
var label = cljs.core.second(cljs.core.deref(_STAR_active));
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.first(plugins_of_settings))], null));

cljs.core.reset_BANG_(_STAR_active,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [label,label], null));

return null;

break;
case "account":
return frontend.components.settings.settings_account();

break;
case "general":
return frontend.components.settings.settings_general(current_repo);

break;
case "editor":
return frontend.components.settings.settings_editor(current_repo);

break;
case "keymap":
return frontend.components.shortcut.shortcut_keymap_x();

break;
case "version-control":
return frontend.components.settings.settings_git();

break;
case "assets":
return frontend.components.assets.settings_content();

break;
case "advanced":
return frontend.components.settings.settings_advanced();

break;
case "features":
return frontend.components.settings.settings_features();

break;
case "collaboration":
return frontend.components.settings.settings_collaboration();

break;
default:
return null;

}
})()])])]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.components.settings.DEFAULT_ACTIVE_TAB_STATE,new cljs.core.Keyword("frontend.components.settings","active","frontend.components.settings/active",-1461390411)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.state.load_app_user_cfgs.cljs$core$IFn$_invoke$arity$0();

return state;
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var active_tab_93026 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var _STAR_active_93027 = new cljs.core.Keyword("frontend.components.settings","active","frontend.components.settings/active",-1461390411).cljs$core$IFn$_invoke$arity$1(state);
if((active_tab_93026 instanceof cljs.core.Keyword)){
cljs.core.reset_BANG_(_STAR_active_93027,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [active_tab_93026,null], null));
} else {
}

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.close_settings_BANG_();

return state;
})], null),rum.core.reactive], null),"frontend.components.settings/settings");

//# sourceMappingURL=frontend.components.settings.js.map
