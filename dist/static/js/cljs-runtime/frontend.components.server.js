goog.provide('frontend.components.server');
frontend.components.server.panel_of_tokens = rum.core.lazy_build(rum.core.build_defcs,(function (_state,close_panel){
var server_state = frontend.state.sub(new cljs.core.Keyword("electron","server","electron/server",1484164422));
var _STAR_tokens = new cljs.core.Keyword("frontend.components.server","tokens","frontend.components.server/tokens",1256431253).cljs$core$IFn$_invoke$arity$1(_state);
var changed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tokens),new cljs.core.Keyword(null,"tokens","tokens",-818939304).cljs$core$IFn$_invoke$arity$1(server_state));
return daiquiri.core.create_element("div",{'className':"cp__server-tokens-panel pt-6"},[daiquiri.core.create_element("h2",{'className':"text-3xl -translate-y-4"},["Authorization tokens"]),(function (){var update_value_BANG_ = (function (idx,k,v){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_tokens,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx,k], null),v);
});
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$server$iter__129857(s__129858){
return (new cljs.core.LazySeq(null,(function (){
var s__129858__$1 = s__129858;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129858__$1);
if(temp__5804__auto__){
var s__129858__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129858__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129858__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129860 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129859 = (0);
while(true){
if((i__129859 < size__5479__auto__)){
var vec__129862 = cljs.core._nth(c__5478__auto__,i__129859);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129862,(0),null);
var map__129865 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129862,(1),null);
var map__129865__$1 = cljs.core.__destructure_map(map__129865);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129865__$1,new cljs.core.Keyword(null,"value","value",305978217));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129865__$1,new cljs.core.Keyword(null,"name","name",1843675177));
cljs.core.chunk_append(b__129860,daiquiri.core.create_element("div",{'key':idx,'className':"item py-2 flex space-x-2 items-center"},[daiquiri.core.create_element("input",{'autoFocus':true,'placeholder':"name",'value':name,'onChange':rum.core.mark_sync_update(((function (i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (p1__129827_SHARP_){
var value__$1 = p1__129827_SHARP_.target.value;
return update_value_BANG_(idx,new cljs.core.Keyword(null,"name","name",1843675177),value__$1);
});})(i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
),'className':"form-input basis-36"},[]),daiquiri.core.create_element("input",{'placeholder':"value",'value':value,'onChange':rum.core.mark_sync_update(((function (i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (p1__129828_SHARP_){
var value__$1 = p1__129828_SHARP_.target.value;
return update_value_BANG_(idx,new cljs.core.Keyword(null,"value","value",305978217),value__$1);
});})(i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
),'className':"form-input"},[]),daiquiri.core.create_element("button",{'onClick':((function (i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_tokens,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(idx,cljs.core.deref(_STAR_tokens))));
});})(i__129859,vec__129862,idx,map__129865,map__129865__$1,value,name,c__5478__auto__,size__5479__auto__,b__129860,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
,'className':"px-2 opacity-50 hover:opacity-90 active:opacity-100"},[(function (){var attrs129866 = frontend.ui.icon("trash-x");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs129866))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs129866], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs129866))?null:[daiquiri.interpreter.interpret(attrs129866)]));
})()])]));

var G__129998 = (i__129859 + (1));
i__129859 = G__129998;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129860),frontend$components$server$iter__129857(cljs.core.chunk_rest(s__129858__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129860),null);
}
} else {
var vec__129871 = cljs.core.first(s__129858__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129871,(0),null);
var map__129874 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129871,(1),null);
var map__129874__$1 = cljs.core.__destructure_map(map__129874);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129874__$1,new cljs.core.Keyword(null,"value","value",305978217));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129874__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return cljs.core.cons(daiquiri.core.create_element("div",{'key':idx,'className':"item py-2 flex space-x-2 items-center"},[daiquiri.core.create_element("input",{'autoFocus':true,'placeholder':"name",'value':name,'onChange':rum.core.mark_sync_update(((function (vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (p1__129827_SHARP_){
var value__$1 = p1__129827_SHARP_.target.value;
return update_value_BANG_(idx,new cljs.core.Keyword(null,"name","name",1843675177),value__$1);
});})(vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
),'className':"form-input basis-36"},[]),daiquiri.core.create_element("input",{'placeholder':"value",'value':value,'onChange':rum.core.mark_sync_update(((function (vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (p1__129828_SHARP_){
var value__$1 = p1__129828_SHARP_.target.value;
return update_value_BANG_(idx,new cljs.core.Keyword(null,"value","value",305978217),value__$1);
});})(vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
),'className':"form-input"},[]),daiquiri.core.create_element("button",{'onClick':((function (vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_){
return (function (){
return cljs.core.reset_BANG_(_STAR_tokens,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(idx,cljs.core.deref(_STAR_tokens))));
});})(vec__129871,idx,map__129874,map__129874__$1,value,name,s__129858__$2,temp__5804__auto__,update_value_BANG_,server_state,_STAR_tokens,changed_QMARK_))
,'className':"px-2 opacity-50 hover:opacity-90 active:opacity-100"},[(function (){var attrs129866 = frontend.ui.icon("trash-x");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs129866))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs129866], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs129866))?null:[daiquiri.interpreter.interpret(attrs129866)]));
})()])]),frontend$components$server$iter__129857(cljs.core.rest(s__129858__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_tokens)));
})());
})(),(function (){var attrs129855 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("+ Add new token",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_tokens,cljs.core.conj,cljs.core.PersistentArrayMap.EMPTY);
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs129855))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-6","space-x-3"], null)], null),attrs129855], 0))):{'className':"flex justify-end pt-6 space-x-3"}),((cljs.core.map_QMARK_(attrs129855))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Save",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","set-config","server/set-config",1464784658),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tokens","tokens",-818939304),cljs.core.deref(_STAR_tokens)], null)], 0)),(function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Update tokens successfully!",new cljs.core.Keyword(null,"success","success",1890645906));
})),(function (p1__129829_SHARP_){
return console.error(p1__129829_SHARP_);
})),(function (){
return (close_panel.cljs$core$IFn$_invoke$arity$0 ? close_panel.cljs$core$IFn$_invoke$arity$0() : close_panel.call(null));
}));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(changed_QMARK_))], 0)))]:[daiquiri.interpreter.interpret(attrs129855),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Save",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","set-config","server/set-config",1464784658),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tokens","tokens",-818939304),cljs.core.deref(_STAR_tokens)], null)], 0)),(function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Update tokens successfully!",new cljs.core.Keyword(null,"success","success",1890645906));
})),(function (p1__129829_SHARP_){
return console.error(p1__129829_SHARP_);
})),(function (){
return (close_panel.cljs$core$IFn$_invoke$arity$0 ? close_panel.cljs$core$IFn$_invoke$arity$0() : close_panel.call(null));
}));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(changed_QMARK_))], 0)))]));
})()]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.server","tokens","frontend.components.server/tokens",1256431253)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (s){
var _STAR_tokens = (s.cljs$core$IFn$_invoke$arity$1 ? s.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.components.server","tokens","frontend.components.server/tokens",1256431253)) : s.call(null,new cljs.core.Keyword("frontend.components.server","tokens","frontend.components.server/tokens",1256431253)));
cljs.core.reset_BANG_(_STAR_tokens,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","server","electron/server",1484164422),new cljs.core.Keyword(null,"tokens","tokens",-818939304)], null)));

return s;
})], null)], null),"frontend.components.server/panel-of-tokens");
frontend.components.server.panel_of_configs = rum.core.lazy_build(rum.core.build_defcs,(function (_state,close_panel){
var server_state = frontend.state.sub(new cljs.core.Keyword("electron","server","electron/server",1484164422));
var _STAR_configs = new cljs.core.Keyword("frontend.components.server","configs","frontend.components.server/configs",-195082786).cljs$core$IFn$_invoke$arity$1(_state);
var map__129908 = cljs.core.deref(_STAR_configs);
var map__129908__$1 = cljs.core.__destructure_map(map__129908);
var host = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129908__$1,new cljs.core.Keyword(null,"host","host",-1558485167));
var port = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129908__$1,new cljs.core.Keyword(null,"port","port",1534937262));
var autostart = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129908__$1,new cljs.core.Keyword(null,"autostart","autostart",-2028194117));
var hp_changed_QMARK_ = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(host,new cljs.core.Keyword(null,"host","host",-1558485167).cljs$core$IFn$_invoke$arity$1(server_state))) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.safe_parse_int((function (){var or__5002__auto____$1 = port;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (0);
}
})()),frontend.util.safe_parse_int((function (){var or__5002__auto____$1 = new cljs.core.Keyword(null,"port","port",1534937262).cljs$core$IFn$_invoke$arity$1(server_state);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (0);
}
})()))));
var changed_QMARK_ = (function (){var or__5002__auto__ = hp_changed_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.not_EQ_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__129897_SHARP_){
var G__129910 = p1__129897_SHARP_;
if((p1__129897_SHARP_ == null)){
return cljs.core.boolean$(G__129910);
} else {
return G__129910;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [autostart,new cljs.core.Keyword(null,"autostart","autostart",-2028194117).cljs$core$IFn$_invoke$arity$1(server_state)], null)));
}
})();
return daiquiri.core.create_element("div",{'className':"cp__server-configs-panel pt-5"},[daiquiri.core.create_element("h2",{'className':"text-3xl -translate-y-4"},["Server configurations"]),daiquiri.core.create_element("div",{'className':"item flex items-center space-x-3"},[daiquiri.core.create_element("label",{'className':"basis-96"},[daiquiri.core.create_element("strong",null,["Host"]),daiquiri.core.create_element("input",{'value':host,'onChange':rum.core.mark_sync_update((function (p1__129904_SHARP_){
var value = p1__129904_SHARP_.target.value;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_configs,cljs.core.assoc,new cljs.core.Keyword(null,"host","host",-1558485167),value);
})),'className':"form-input"},[])]),daiquiri.core.create_element("label",null,[daiquiri.core.create_element("strong",null,["Port (1 ~ 65535)"]),daiquiri.core.create_element("input",{'autoFocus':true,'value':port,'min':"1",'max':"65535",'type':"number",'onChange':rum.core.mark_sync_update((function (p1__129905_SHARP_){
var value = p1__129905_SHARP_.target.value;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_configs,cljs.core.assoc,new cljs.core.Keyword(null,"port","port",1534937262),value);
})),'className':"form-input"},[])])]),daiquiri.core.create_element("p",{'className':"py-3 px-1"},[(function (){var attrs129934 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__129906_SHARP_){
var checked = p1__129906_SHARP_.target.checked;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_configs,cljs.core.assoc,new cljs.core.Keyword(null,"autostart","autostart",-2028194117),checked);
}),new cljs.core.Keyword(null,"checked","checked",-50955819),(!(autostart === false))], null));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs129934))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","space-x-2","items-center"], null)], null),attrs129934], 0))):{'className':"flex space-x-2 items-center"}),((cljs.core.map_QMARK_(attrs129934))?[daiquiri.core.create_element("strong",{'className':"select-none"},["Auto start server with the app launched"])]:[daiquiri.interpreter.interpret(attrs129934),daiquiri.core.create_element("strong",{'className':"select-none"},["Auto start server with the app launched"])]));
})()]),(function (){var attrs129929 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Reset",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(_STAR_configs,cljs.core.select_keys(server_state,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"host","host",-1558485167),new cljs.core.Keyword(null,"port","port",1534937262),new cljs.core.Keyword(null,"autostart","autostart",-2028194117)], null)));
})], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs129929))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-6","space-x-3"], null)], null),attrs129929], 0))):{'className':"flex justify-end pt-6 space-x-3"}),((cljs.core.map_QMARK_(attrs129929))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Save & Apply",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.not(changed_QMARK_),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var configs = cljs.core.select_keys(cljs.core.deref(_STAR_configs),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"host","host",-1558485167),new cljs.core.Keyword(null,"port","port",1534937262),new cljs.core.Keyword(null,"autostart","autostart",-2028194117)], null));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","set-config","server/set-config",1464784658),configs], 0)),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((close_panel.cljs$core$IFn$_invoke$arity$0 ? close_panel.cljs$core$IFn$_invoke$arity$0() : close_panel.call(null))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((1000))),(function (___$1){
return promesa.protocols._promise(((hp_changed_QMARK_)?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","do","server/do",1556149508),new cljs.core.Keyword(null,"restart","restart",-1779883612)], 0)):null));
}));
}));
}));
})),(function (p1__129907_SHARP_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__129907_SHARP_),new cljs.core.Keyword(null,"error","error",-978969032));
}));
})], 0)))]:[daiquiri.interpreter.interpret(attrs129929),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Save & Apply",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.not(changed_QMARK_),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var configs = cljs.core.select_keys(cljs.core.deref(_STAR_configs),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"host","host",-1558485167),new cljs.core.Keyword(null,"port","port",1534937262),new cljs.core.Keyword(null,"autostart","autostart",-2028194117)], null));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","set-config","server/set-config",1464784658),configs], 0)),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((close_panel.cljs$core$IFn$_invoke$arity$0 ? close_panel.cljs$core$IFn$_invoke$arity$0() : close_panel.call(null))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((1000))),(function (___$1){
return promesa.protocols._promise(((hp_changed_QMARK_)?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","do","server/do",1556149508),new cljs.core.Keyword(null,"restart","restart",-1779883612)], 0)):null));
}));
}));
}));
})),(function (p1__129907_SHARP_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__129907_SHARP_),new cljs.core.Keyword(null,"error","error",-978969032));
}));
})], 0)))]));
})()]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.server","configs","frontend.components.server/configs",-195082786)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (s){
var _STAR_configs = (s.cljs$core$IFn$_invoke$arity$1 ? s.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.components.server","configs","frontend.components.server/configs",-195082786)) : s.call(null,new cljs.core.Keyword("frontend.components.server","configs","frontend.components.server/configs",-195082786)));
cljs.core.reset_BANG_(_STAR_configs,new cljs.core.Keyword("electron","server","electron/server",1484164422).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));

return s;
})], null)], null),"frontend.components.server/panel-of-configs");
frontend.components.server.server_indicator = rum.core.lazy_build(rum.core.build_defc,(function (server_state){
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((1000))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","load-state","server/load-state",135727163)], 0))),(function (___$1){
return promesa.protocols._promise((function (){var t = setTimeout((function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("electron","server","electron/server",1484164422),new cljs.core.Keyword(null,"autostart","autostart",-2028194117)], null)))){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","do","server/do",1556149508),new cljs.core.Keyword(null,"restart","restart",-1779883612)], 0));
} else {
return null;
}
}),(1000));
return (function (){
return clearTimeout(t);
});
})());
}));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

var map__129976 = server_state;
var map__129976__$1 = cljs.core.__destructure_map(map__129976);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129976__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129976__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var status__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(status));
var running_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"running","running",1554969103),status__$1);
var href = (function (){var and__5000__auto__ = running_QMARK_;
if(and__5000__auto__){
return ["http://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"host","host",-1558485167).cljs$core$IFn$_invoke$arity$1(server_state)),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"port","port",1534937262).cljs$core$IFn$_invoke$arity$1(server_state))].join('');
} else {
return and__5000__auto__;
}
})();
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(error)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["[Server] ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [error], null));

var attrs129974 = logseq.shui.ui.button_ghost_icon(((running_QMARK_)?"api":"api-off"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__129979 = e.target;
var G__129980 = (function (p__129982){
var map__129983 = p__129982;
var map__129983__$1 = cljs.core.__destructure_map(map__129983);
var _close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129983__$1,new cljs.core.Keyword(null,"_close","_close",-1082869631));
var items = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr?","hr?",1767859540),true], null),((running_QMARK_)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Stop server",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","do","server/do",1556149508),new cljs.core.Keyword(null,"stop","stop",-2140911342)], 0));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-red-500.flex.items-center","span.text-red-500.flex.items-center",-491946714),frontend.ui.icon("player-stop")], null)], null):new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Start server",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("server","do","server/do",1556149508),new cljs.core.Keyword(null,"restart","restart",-1779883612)], 0));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-green-500.flex.items-center","span.text-green-500.flex.items-center",-945500541),frontend.ui.icon("player-play")], null)], null)
),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Authorization tokens",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__129984 = (function (){
return frontend.components.server.panel_of_tokens(logseq.shui.ui.dialog_close_BANG_);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__129984) : logseq.shui.ui.dialog_open_BANG_.call(null,G__129984));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("key")], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),"Server configurations",new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__129985 = (function (){
return frontend.components.server.panel_of_configs(logseq.shui.ui.dialog_close_BANG_);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__129985) : logseq.shui.ui.dialog_open_BANG_.call(null,G__129985));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("server-cog")], null)], null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.links-header.flex.justify-center.py-2","div.links-header.flex.justify-center.py-2",62632997),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1.text-sm.opacity-70","span.ml-1.text-sm.opacity-70",451201778),(((!(running_QMARK_)))?clojure.string.upper_case((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(server_state);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "stopped";
}
})()):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.hover:underline","a.hover:underline",-1510791830),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),href], null),href], null))], null)], null),(function (){var iter__5480__auto__ = (function frontend$components$server$iter__129987(s__129988){
return (new cljs.core.LazySeq(null,(function (){
var s__129988__$1 = s__129988;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__129988__$1);
if(temp__5804__auto__){
var s__129988__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__129988__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__129988__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__129990 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__129989 = (0);
while(true){
if((i__129989 < size__5479__auto__)){
var map__129991 = cljs.core._nth(c__5478__auto__,i__129989);
var map__129991__$1 = cljs.core.__destructure_map(map__129991);
var hr_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129991__$1,new cljs.core.Keyword(null,"hr?","hr?",1767859540));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129991__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129991__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129991__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
cljs.core.chunk_append(b__129990,(cljs.core.truth_(hr_QMARK_)?(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)):(function (){var G__129992 = options;
var G__129993 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),title], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__129992,G__129993) : logseq.shui.ui.dropdown_menu_item.call(null,G__129992,G__129993));
})()
));

var G__129999 = (i__129989 + (1));
i__129989 = G__129999;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__129990),frontend$components$server$iter__129987(cljs.core.chunk_rest(s__129988__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__129990),null);
}
} else {
var map__129994 = cljs.core.first(s__129988__$2);
var map__129994__$1 = cljs.core.__destructure_map(map__129994);
var hr_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129994__$1,new cljs.core.Keyword(null,"hr?","hr?",1767859540));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129994__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129994__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129994__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
return cljs.core.cons((cljs.core.truth_(hr_QMARK_)?(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)):(function (){var G__129995 = options;
var G__129996 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),title], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__129995,G__129996) : logseq.shui.ui.dropdown_menu_item.call(null,G__129995,G__129996));
})()
),frontend$components$server$iter__129987(cljs.core.rest(s__129988__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
})());
});
var G__129981 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onClick","onClick",-1991238530),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__129979,G__129980,G__129981) : logseq.shui.ui.popup_show_BANG_.call(null,G__129979,G__129980,G__129981));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs129974))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__server-indicator"], null)], null),attrs129974], 0))):{'className':"cp__server-indicator"}),((cljs.core.map_QMARK_(attrs129974))?null:[daiquiri.interpreter.interpret(attrs129974)]));
}),null,"frontend.components.server/server-indicator");

//# sourceMappingURL=frontend.components.server.js.map
