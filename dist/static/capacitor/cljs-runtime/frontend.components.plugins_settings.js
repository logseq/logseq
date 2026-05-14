goog.provide('frontend.components.plugins_settings');
frontend.components.plugins_settings.dom_purify = (function frontend$components$plugins_settings$dom_purify(html,opts){
try{return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(DOMPurify,"sanitize",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([html,cljs_bean.core.__GT_js(opts)], 0));
}catch (e67875){if((e67875 instanceof Error)){
var e = e67875;
console.warn(e);

return html;
} else {
throw e67875;

}
}});
frontend.components.plugins_settings.html_content = rum.core.lazy_build(rum.core.build_defc,(function (html){
return daiquiri.core.create_element("div",{'dangerouslySetInnerHTML':{'__html':frontend.components.plugins_settings.dom_purify(html,null)},'className':"html-content pl-1 flex-1 text-sm"},[]);
}),null,"frontend.components.plugins-settings/html-content");
frontend.components.plugins_settings.edit_settings_file = rum.core.lazy_build(rum.core.build_defc,(function (pid,p__67878){
var map__67879 = p__67878;
var map__67879__$1 = cljs.core.__destructure_map(map__67879);
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67879__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var edit_mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67879__$1,new cljs.core.Keyword(null,"edit-mode","edit-mode",1940640993));
var set_edit_mode_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67879__$1,new cljs.core.Keyword(null,"set-edit-mode!","set-edit-mode!",948556739));
return daiquiri.core.create_element("a",{'onClick':(function (){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.handler.plugin.open_settings_file_in_default_app_BANG_(pid);
} else {
var G__67881 = (function (p1__67876_SHARP_){
if(cljs.core.truth_(p1__67876_SHARP_)){
return null;
} else {
return new cljs.core.Keyword(null,"code","code",1586293142);
}
});
return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(G__67881) : set_edit_mode_BANG_.call(null,G__67881));
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","hover:underline",class$], null))},[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(edit_mode,new cljs.core.Keyword(null,"code","code",1586293142)))?"Exit code mode":"Edit settings.json")]);
}),null,"frontend.components.plugins-settings/edit-settings-file");
frontend.components.plugins_settings.render_item_input = rum.core.lazy_build(rum.core.build_defc,(function (val,p__67889,update_setting_BANG_){
var map__67890 = p__67889;
var map__67890__$1 = cljs.core.__destructure_map(map__67890);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"title","title",636505583));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var inputAs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67890__$1,new cljs.core.Keyword(null,"inputAs","inputAs",1243305598));
return daiquiri.core.create_element("div",{'data-key':key,'key':key,'className':"desc-item as-input"},[daiquiri.core.create_element("h2",null,[(function (){var attrs67895 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs67895))?daiquiri.interpreter.element_attributes(attrs67895):null),((cljs.core.map_QMARK_(attrs67895))?null:[daiquiri.interpreter.interpret(attrs67895)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs67896 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs67896))?daiquiri.interpreter.element_attributes(attrs67896):null),((cljs.core.map_QMARK_(attrs67896))?null:[daiquiri.interpreter.interpret(attrs67896)]));
})()]),daiquiri.core.create_element("label",{'className':"form-control"},[frontend.components.plugins_settings.html_content(description),(function (){var input_as = frontend.util.safe_lower_case((function (){var or__5002__auto__ = inputAs;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(type);
}
})());
var input_as__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input_as,"string"))?new cljs.core.Keyword(null,"text","text",-1790561697):cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(input_as));
return daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input_as__$1,new cljs.core.Keyword(null,"textarea","textarea",-650375824)))?new cljs.core.Keyword(null,"textarea","textarea",-650375824):new cljs.core.Keyword(null,"input","input",556931961)),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"form-input","form-input",-226883230),(!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color","color",1011675173),null,new cljs.core.Keyword(null,"range","range",1639692286),null], null), null),input_as__$1)))], null)], null)),new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.name(input_as__$1),new cljs.core.Keyword(null,"defaultValue","defaultValue",-586131910),(function (){var or__5002__auto__ = val;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
})(),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (p1__67883_SHARP_){
return p1__67883_SHARP_.stopPropagation();
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),goog.functions.debounce((function (p1__67884_SHARP_){
var G__67901 = key;
var G__67902 = frontend.util.evalue(p1__67884_SHARP_);
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(G__67901,G__67902) : update_setting_BANG_.call(null,G__67901,G__67902));
}),(1000))], null)], null));
})()])]);
}),null,"frontend.components.plugins-settings/render-item-input");
frontend.components.plugins_settings.render_item_toggle = rum.core.lazy_build(rum.core.build_defc,(function (val,p__67903,update_setting_BANG_){
var map__67904 = p__67903;
var map__67904__$1 = cljs.core.__destructure_map(map__67904);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var val__$1 = ((cljs.core.boolean_QMARK_(val))?val:cljs.core.boolean$(default$));
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-toggle"},[daiquiri.core.create_element("h2",null,[(function (){var attrs67917 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs67917))?daiquiri.interpreter.element_attributes(attrs67917):null),((cljs.core.map_QMARK_(attrs67917))?null:[daiquiri.interpreter.interpret(attrs67917)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs67918 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs67918))?daiquiri.interpreter.element_attributes(attrs67918):null),((cljs.core.map_QMARK_(attrs67918))?null:[daiquiri.interpreter.interpret(attrs67918)]));
})()]),(function (){var attrs67912 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),val__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (){
var G__67923 = key;
var G__67924 = (!(val__$1));
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(G__67923,G__67924) : update_setting_BANG_.call(null,G__67923,G__67924));
})], null));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs67912))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["form-control"], null)], null),attrs67912], 0))):{'className':"form-control"}),((cljs.core.map_QMARK_(attrs67912))?[frontend.components.plugins_settings.html_content(description)]:[daiquiri.interpreter.interpret(attrs67912),frontend.components.plugins_settings.html_content(description)]));
})()]);
}),null,"frontend.components.plugins-settings/render-item-toggle");
frontend.components.plugins_settings.render_item_enum = rum.core.lazy_build(rum.core.build_defc,(function (val,p__67946,update_setting_BANG_){
var map__67947 = p__67946;
var map__67947__$1 = cljs.core.__destructure_map(map__67947);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var enumChoices = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"enumChoices","enumChoices",-177859500));
var enumPicker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"enumPicker","enumPicker",-719781503));
var val__$1 = (function (){var or__5002__auto__ = val;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
})();
var vals = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,((cljs.core.sequential_QMARK_(val__$1))?val__$1:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [val__$1], null)));
var options = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),v,new cljs.core.Keyword(null,"value","value",305978217),v,new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core.contains_QMARK_(vals,v)], null);
}),enumChoices);
var picker = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(enumPicker);
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-enum"},[daiquiri.core.create_element("h2",null,[(function (){var attrs67953 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs67953))?daiquiri.interpreter.element_attributes(attrs67953):null),((cljs.core.map_QMARK_(attrs67953))?null:[daiquiri.interpreter.interpret(attrs67953)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs67954 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs67954))?daiquiri.interpreter.element_attributes(attrs67954):null),((cljs.core.map_QMARK_(attrs67954))?null:[daiquiri.interpreter.interpret(attrs67954)]));
})()]),daiquiri.core.create_element("div",{'className':"form-control"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"radio","radio",1323726374),null,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null], null), null),picker))?new cljs.core.Keyword(null,"div.wrap","div.wrap",1832950772):new cljs.core.Keyword(null,"label.wrap","label.wrap",-1504723647)),frontend.components.plugins_settings.html_content(description),(function (){var G__67960 = picker;
var G__67960__$1 = (((G__67960 instanceof cljs.core.Keyword))?G__67960.fqn:null);
switch (G__67960__$1) {
case "radio":
return frontend.ui.radio_list(options,(function (p1__67939_SHARP_){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,p1__67939_SHARP_) : update_setting_BANG_.call(null,key,p1__67939_SHARP_));
}),null);

break;
case "checkbox":
return frontend.ui.checkbox_list(options,(function (p1__67940_SHARP_){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,p1__67940_SHARP_) : update_setting_BANG_.call(null,key,p1__67940_SHARP_));
}),null);

break;
default:
return frontend.ui.select(options,(function (_,value){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,value) : update_setting_BANG_.call(null,key,value));
}));

}
})()], null))])]);
}),null,"frontend.components.plugins-settings/render-item-enum");
frontend.components.plugins_settings.render_item_object = rum.core.lazy_build(rum.core.build_defc,(function (_val,p__67965,pid){
var map__67967 = p__67965;
var map__67967__$1 = cljs.core.__destructure_map(map__67967);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67967__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67967__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67967__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var _default = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67967__$1,new cljs.core.Keyword(null,"_default","_default",308892991));
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-object"},[daiquiri.core.create_element("h2",null,[(function (){var attrs67971 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs67971))?daiquiri.interpreter.element_attributes(attrs67971):null),((cljs.core.map_QMARK_(attrs67971))?null:[daiquiri.interpreter.interpret(attrs67971)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs67972 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs67972))?daiquiri.interpreter.element_attributes(attrs67972):null),((cljs.core.map_QMARK_(attrs67972))?null:[daiquiri.interpreter.interpret(attrs67972)]));
})()]),daiquiri.core.create_element("div",{'className':"form-control"},[frontend.components.plugins_settings.html_content(description),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.core.create_element("div",{'className':"pl-1"},[frontend.components.plugins_settings.edit_settings_file(pid,null)]):null)])]);
}),null,"frontend.components.plugins-settings/render-item-object");
frontend.components.plugins_settings.render_item_heading = rum.core.lazy_build(rum.core.build_defc,(function (p__67984){
var map__67985 = p__67984;
var map__67985__$1 = cljs.core.__destructure_map(map__67985);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67985__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67985__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67985__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
return daiquiri.core.create_element("div",{'data-key':key,'className':"heading-item"},[(function (){var attrs67990 = title;
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs67990))?daiquiri.interpreter.element_attributes(attrs67990):null),((cljs.core.map_QMARK_(attrs67990))?null:[daiquiri.interpreter.interpret(attrs67990)]));
})(),frontend.components.plugins_settings.html_content(description)]);
}),null,"frontend.components.plugins-settings/render-item-heading");
frontend.components.plugins_settings.render_item_not_handled = rum.core.lazy_build(rum.core.build_defc,(function (s){
return daiquiri.core.create_element("p",{'className':"text-red-500"},[["#Not Handled# ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join('')]);
}),null,"frontend.components.plugins-settings/render-item-not-handled");
frontend.components.plugins_settings.settings_container = rum.core.lazy_build(rum.core.build_defc,(function (schema,pl){
var plugin_settings = pl.settings;
var pid = pl.id;
var vec__68001 = rum.core.use_state(cljs_bean.core.__GT_clj(plugin_settings.toJSON()));
var settings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68001,(0),null);
var set_settings_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68001,(1),null);
var vec__68004 = rum.core.use_state(null);
var edit_mode = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68004,(0),null);
var set_edit_mode_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68004,(1),null);
var update_setting_BANG_ = (function (k,v){
return plugin_settings.set(cljs.core.name(k),cljs_bean.core.__GT_js(v));
});
logseq.shui.hooks.use_effect_BANG_((function (){
var on_change = (function (s){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(s);
if(cljs.core.truth_(temp__5804__auto__)){
var s__$1 = temp__5804__auto__;
return (set_settings_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_settings_BANG_.cljs$core$IFn$_invoke$arity$1(s__$1) : set_settings_BANG_.call(null,s__$1));
} else {
return null;
}
});
plugin_settings.on("change",on_change);

return (function (){
return plugin_settings.off("change",on_change);
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pid], null));

if(cljs.core.seq(schema)){
return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("h2",{'className':"text-xl px-2 pt-1 opacity-90"},["ID: ",pid]),daiquiri.core.create_element("div",{'data-mode':(function (){var G__68032 = edit_mode;
if((G__68032 == null)){
return null;
} else {
return cljs.core.name(G__68032);
}
})(),'className':"cp__plugins-settings-inner"},[daiquiri.core.create_element("span",{'className':"edit-file"},[frontend.components.plugins_settings.edit_settings_file(pid,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"set-edit-mode!","set-edit-mode!",948556739),set_edit_mode_BANG_,new cljs.core.Keyword(null,"edit-mode","edit-mode",1940640993),edit_mode], null))]),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(edit_mode,new cljs.core.Keyword(null,"code","code",1586293142)))?(function (){var attrs68033 = (function (){var content_SINGLEQUOTE_ = JSON.stringify(cljs_bean.core.__GT_js(settings),null,(2));
return frontend.components.lazy_editor.editor(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file?","file?",1755223728),false], null),"code-edit-lsp-settings",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),"json"], null),content_SINGLEQUOTE_,cljs.core.PersistentArrayMap.EMPTY);
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs68033))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["code-mode-wrap","pl-3","pr-1","py-1","mb-8","-ml-1"], null)], null),attrs68033], 0))):{'className':"code-mode-wrap pl-3 pr-1 py-1 mb-8 -ml-1"}),((cljs.core.map_QMARK_(attrs68033))?[(function (){var attrs68040 = (function (){var G__68048 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content_SINGLEQUOTE_ = (function (){var G__68050 = plugin_settings.toJSON();
if((G__68050 == null)){
return null;
} else {
return JSON.stringify(G__68050,null,(2));
}
})();
return cm.setValue(content_SINGLEQUOTE_);
})], null);
var G__68049 = "Reset";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68048,G__68049) : logseq.shui.ui.button.call(null,G__68048,G__68049));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs68040))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-2","gap-2"], null)], null),attrs68040], 0))):{'className':"flex justify-end pt-2 gap-2"}),((cljs.core.map_QMARK_(attrs68040))?[daiquiri.interpreter.interpret((function (){var G__68057 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e68062){if((e68062 instanceof Error)){
var e__$1 = e68062;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e68062;

}
}})], null);
var G__68058 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68057,G__68058) : logseq.shui.ui.button.call(null,G__68057,G__68058));
})())]:[daiquiri.interpreter.interpret(attrs68040),daiquiri.interpreter.interpret((function (){var G__68071 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e68073){if((e68073 instanceof Error)){
var e__$1 = e68073;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e68073;

}
}})], null);
var G__68072 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68071,G__68072) : logseq.shui.ui.button.call(null,G__68071,G__68072));
})())]));
})()]:[daiquiri.interpreter.interpret(attrs68033),(function (){var attrs68047 = (function (){var G__68074 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content_SINGLEQUOTE_ = (function (){var G__68076 = plugin_settings.toJSON();
if((G__68076 == null)){
return null;
} else {
return JSON.stringify(G__68076,null,(2));
}
})();
return cm.setValue(content_SINGLEQUOTE_);
})], null);
var G__68075 = "Reset";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68074,G__68075) : logseq.shui.ui.button.call(null,G__68074,G__68075));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs68047))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-2","gap-2"], null)], null),attrs68047], 0))):{'className':"flex justify-end pt-2 gap-2"}),((cljs.core.map_QMARK_(attrs68047))?[daiquiri.interpreter.interpret((function (){var G__68081 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e68083){if((e68083 instanceof Error)){
var e__$1 = e68083;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e68083;

}
}})], null);
var G__68082 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68081,G__68082) : logseq.shui.ui.button.call(null,G__68081,G__68082));
})())]:[daiquiri.interpreter.interpret(attrs68047),daiquiri.interpreter.interpret((function (){var G__68087 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e68090){if((e68090 instanceof Error)){
var e__$1 = e68090;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e68090;

}
}})], null);
var G__68088 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68087,G__68088) : logseq.shui.ui.button.call(null,G__68087,G__68088));
})())]));
})()]));
})():cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins_settings$iter__68091(s__68092){
return (new cljs.core.LazySeq(null,(function (){
var s__68092__$1 = s__68092;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68092__$1);
if(temp__5804__auto__){
var s__68092__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__68092__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68092__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68094 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68093 = (0);
while(true){
if((i__68093 < size__5479__auto__)){
var desc = cljs.core._nth(c__5478__auto__,i__68093);
var key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(desc);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(settings,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key));
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(desc));
var desc__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(desc,new cljs.core.Keyword(null,"description","description",-1428560544),((function (i__68093,key,val,type,desc,c__5478__auto__,size__5479__auto__,b__68094,s__68092__$2,temp__5804__auto__,plugin_settings,pid,vec__68001,settings,set_settings_BANG_,vec__68004,edit_mode,set_edit_mode_BANG_,update_setting_BANG_){
return (function (p1__67999_SHARP_){
return frontend.handler.plugin.markdown_to_html(p1__67999_SHARP_);
});})(i__68093,key,val,type,desc,c__5478__auto__,size__5479__auto__,b__68094,s__68092__$2,temp__5804__auto__,plugin_settings,pid,vec__68001,settings,set_settings_BANG_,vec__68004,edit_mode,set_edit_mode_BANG_,update_setting_BANG_))
);
cljs.core.chunk_append(b__68094,rum.core.with_key((function (){var pred__68109 = cljs.core.contains_QMARK_;
var expr__68110 = type;
if(cljs.core.truth_((function (){var G__68112 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"string","string",-1989541586),null], null), null);
var G__68113 = expr__68110;
return (pred__68109.cljs$core$IFn$_invoke$arity$2 ? pred__68109.cljs$core$IFn$_invoke$arity$2(G__68112,G__68113) : pred__68109.call(null,G__68112,G__68113));
})())){
return frontend.components.plugins_settings.render_item_input(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68115 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"boolean","boolean",-1919418404),null], null), null);
var G__68116 = expr__68110;
return (pred__68109.cljs$core$IFn$_invoke$arity$2 ? pred__68109.cljs$core$IFn$_invoke$arity$2(G__68115,G__68116) : pred__68109.call(null,G__68115,G__68116));
})())){
return frontend.components.plugins_settings.render_item_toggle(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68118 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"enum","enum",1679018432),null], null), null);
var G__68119 = expr__68110;
return (pred__68109.cljs$core$IFn$_invoke$arity$2 ? pred__68109.cljs$core$IFn$_invoke$arity$2(G__68118,G__68119) : pred__68109.call(null,G__68118,G__68119));
})())){
return frontend.components.plugins_settings.render_item_enum(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68120 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"object","object",1474613949),null], null), null);
var G__68121 = expr__68110;
return (pred__68109.cljs$core$IFn$_invoke$arity$2 ? pred__68109.cljs$core$IFn$_invoke$arity$2(G__68120,G__68121) : pred__68109.call(null,G__68120,G__68121));
})())){
return frontend.components.plugins_settings.render_item_object(val,desc__$1,pid);
} else {
if(cljs.core.truth_((function (){var G__68122 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null);
var G__68123 = expr__68110;
return (pred__68109.cljs$core$IFn$_invoke$arity$2 ? pred__68109.cljs$core$IFn$_invoke$arity$2(G__68122,G__68123) : pred__68109.call(null,G__68122,G__68123));
})())){
return frontend.components.plugins_settings.render_item_heading(desc__$1);
} else {
return frontend.components.plugins_settings.render_item_not_handled(key);
}
}
}
}
}
})(),key));

var G__68219 = (i__68093 + (1));
i__68093 = G__68219;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68094),frontend$components$plugins_settings$iter__68091(cljs.core.chunk_rest(s__68092__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68094),null);
}
} else {
var desc = cljs.core.first(s__68092__$2);
var key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(desc);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(settings,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key));
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(desc));
var desc__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(desc,new cljs.core.Keyword(null,"description","description",-1428560544),((function (key,val,type,desc,s__68092__$2,temp__5804__auto__,plugin_settings,pid,vec__68001,settings,set_settings_BANG_,vec__68004,edit_mode,set_edit_mode_BANG_,update_setting_BANG_){
return (function (p1__67999_SHARP_){
return frontend.handler.plugin.markdown_to_html(p1__67999_SHARP_);
});})(key,val,type,desc,s__68092__$2,temp__5804__auto__,plugin_settings,pid,vec__68001,settings,set_settings_BANG_,vec__68004,edit_mode,set_edit_mode_BANG_,update_setting_BANG_))
);
return cljs.core.cons(rum.core.with_key((function (){var pred__68148 = cljs.core.contains_QMARK_;
var expr__68149 = type;
if(cljs.core.truth_((function (){var G__68151 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"string","string",-1989541586),null], null), null);
var G__68152 = expr__68149;
return (pred__68148.cljs$core$IFn$_invoke$arity$2 ? pred__68148.cljs$core$IFn$_invoke$arity$2(G__68151,G__68152) : pred__68148.call(null,G__68151,G__68152));
})())){
return frontend.components.plugins_settings.render_item_input(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68153 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"boolean","boolean",-1919418404),null], null), null);
var G__68154 = expr__68149;
return (pred__68148.cljs$core$IFn$_invoke$arity$2 ? pred__68148.cljs$core$IFn$_invoke$arity$2(G__68153,G__68154) : pred__68148.call(null,G__68153,G__68154));
})())){
return frontend.components.plugins_settings.render_item_toggle(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68155 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"enum","enum",1679018432),null], null), null);
var G__68156 = expr__68149;
return (pred__68148.cljs$core$IFn$_invoke$arity$2 ? pred__68148.cljs$core$IFn$_invoke$arity$2(G__68155,G__68156) : pred__68148.call(null,G__68155,G__68156));
})())){
return frontend.components.plugins_settings.render_item_enum(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__68158 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"object","object",1474613949),null], null), null);
var G__68159 = expr__68149;
return (pred__68148.cljs$core$IFn$_invoke$arity$2 ? pred__68148.cljs$core$IFn$_invoke$arity$2(G__68158,G__68159) : pred__68148.call(null,G__68158,G__68159));
})())){
return frontend.components.plugins_settings.render_item_object(val,desc__$1,pid);
} else {
if(cljs.core.truth_((function (){var G__68160 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null);
var G__68161 = expr__68149;
return (pred__68148.cljs$core$IFn$_invoke$arity$2 ? pred__68148.cljs$core$IFn$_invoke$arity$2(G__68160,G__68161) : pred__68148.call(null,G__68160,G__68161));
})())){
return frontend.components.plugins_settings.render_item_heading(desc__$1);
} else {
return frontend.components.plugins_settings.render_item_not_handled(key);
}
}
}
}
}
})(),key),frontend$components$plugins_settings$iter__68091(cljs.core.rest(s__68092__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(schema);
})()))])]);
} else {
return daiquiri.core.create_element("h2",{'className':"font-bold text-lg py-4 warning"},["No Settings Schema!"]);
}
}),null,"frontend.components.plugins-settings/settings-container");

//# sourceMappingURL=frontend.components.plugins_settings.js.map
