goog.provide('frontend.components.header');
frontend.components.header.home_button = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"home","home",-74557309),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"home","home",-74557309)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(frontend.mobile.util.native_iphone_QMARK_())){
frontend.state.set_left_sidebar_open_BANG_(false);
} else {
}

return frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();
})], null)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (){
return cljs.core.identity("home-button");
})], null)], null),"frontend.components.header/home-button");
frontend.components.header.rtc_collaborators = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var rtc_graph_id = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
var online_users = cljs.core.deref(new cljs.core.Keyword("frontend.components.header","online-users","frontend.components.header/online-users",1171195019).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_(rtc_graph_id)){
var attrs130002 = logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"user-plus","user-plus",-196932293),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__130003 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-2.-mb-8","div.p-2.-mb-8",-765782485),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.-mt-2.-ml-2","h1.text-3xl.-mt-2.-ml-2",-1960111444),"Collaborators:"], null),frontend.components.settings.settings_collaboration()], null);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__130003) : logseq.shui.ui.dialog_open_BANG_.call(null,G__130003));
})], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs130002))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rtc-collaborators","flex","gap-1","text-sm","py-2","bg-gray-01","items-center"], null)], null),attrs130002], 0))):{'className':"rtc-collaborators flex gap-1 text-sm py-2 bg-gray-01 items-center"}),((cljs.core.map_QMARK_(attrs130002))?[((cljs.core.seq(online_users))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$header$iter__130004(s__130005){
return (new cljs.core.LazySeq(null,(function (){
var s__130005__$1 = s__130005;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__130005__$1);
if(temp__5804__auto__){
var s__130005__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__130005__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__130005__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__130007 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__130006 = (0);
while(true){
if((i__130006 < size__5479__auto__)){
var map__130008 = cljs.core._nth(c__5478__auto__,i__130006);
var map__130008__$1 = cljs.core.__destructure_map(map__130008);
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130008__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130008__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130008__$1,new cljs.core.Keyword("user","uuid","user/uuid",2146253734));
var color = logseq.shui.util.uuid_color(user_uuid);
cljs.core.chunk_append(b__130007,(cljs.core.truth_(user_name)?daiquiri.interpreter.interpret((function (){var G__130014 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"app-region","app-region",-1412948438),"no-drag"], null),new cljs.core.Keyword(null,"title","title",636505583),user_email], null);
var G__130015 = (function (){var G__130016 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"50"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(11)], null)], null);
var G__130017 = (function (){var G__130018 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(user_name,(0),(2));
if((G__130018 == null)){
return null;
} else {
return clojure.string.upper_case(G__130018);
}
})();
return (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2(G__130016,G__130017) : logseq.shui.ui.avatar_fallback.call(null,G__130016,G__130017));
})();
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2(G__130014,G__130015) : logseq.shui.ui.avatar.call(null,G__130014,G__130015));
})()):null));

var G__130167 = (i__130006 + (1));
i__130006 = G__130167;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__130007),frontend$components$header$iter__130004(cljs.core.chunk_rest(s__130005__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__130007),null);
}
} else {
var map__130019 = cljs.core.first(s__130005__$2);
var map__130019__$1 = cljs.core.__destructure_map(map__130019);
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130019__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130019__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130019__$1,new cljs.core.Keyword("user","uuid","user/uuid",2146253734));
var color = logseq.shui.util.uuid_color(user_uuid);
return cljs.core.cons((cljs.core.truth_(user_name)?daiquiri.interpreter.interpret((function (){var G__130025 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"app-region","app-region",-1412948438),"no-drag"], null),new cljs.core.Keyword(null,"title","title",636505583),user_email], null);
var G__130026 = (function (){var G__130027 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"50"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(11)], null)], null);
var G__130028 = (function (){var G__130029 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(user_name,(0),(2));
if((G__130029 == null)){
return null;
} else {
return clojure.string.upper_case(G__130029);
}
})();
return (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2(G__130027,G__130028) : logseq.shui.ui.avatar_fallback.call(null,G__130027,G__130028));
})();
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2(G__130025,G__130026) : logseq.shui.ui.avatar.call(null,G__130025,G__130026));
})()):null),frontend$components$header$iter__130004(cljs.core.rest(s__130005__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(online_users);
})()):null)]:[daiquiri.interpreter.interpret(attrs130002),((cljs.core.seq(online_users))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$header$iter__130030(s__130031){
return (new cljs.core.LazySeq(null,(function (){
var s__130031__$1 = s__130031;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__130031__$1);
if(temp__5804__auto__){
var s__130031__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__130031__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__130031__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__130033 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__130032 = (0);
while(true){
if((i__130032 < size__5479__auto__)){
var map__130034 = cljs.core._nth(c__5478__auto__,i__130032);
var map__130034__$1 = cljs.core.__destructure_map(map__130034);
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130034__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130034__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130034__$1,new cljs.core.Keyword("user","uuid","user/uuid",2146253734));
var color = logseq.shui.util.uuid_color(user_uuid);
cljs.core.chunk_append(b__130033,(cljs.core.truth_(user_name)?daiquiri.interpreter.interpret((function (){var G__130040 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"app-region","app-region",-1412948438),"no-drag"], null),new cljs.core.Keyword(null,"title","title",636505583),user_email], null);
var G__130041 = (function (){var G__130042 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"50"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(11)], null)], null);
var G__130043 = (function (){var G__130044 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(user_name,(0),(2));
if((G__130044 == null)){
return null;
} else {
return clojure.string.upper_case(G__130044);
}
})();
return (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2(G__130042,G__130043) : logseq.shui.ui.avatar_fallback.call(null,G__130042,G__130043));
})();
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2(G__130040,G__130041) : logseq.shui.ui.avatar.call(null,G__130040,G__130041));
})()):null));

var G__130168 = (i__130032 + (1));
i__130032 = G__130168;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__130033),frontend$components$header$iter__130030(cljs.core.chunk_rest(s__130031__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__130033),null);
}
} else {
var map__130045 = cljs.core.first(s__130031__$2);
var map__130045__$1 = cljs.core.__destructure_map(map__130045);
var user_email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130045__$1,new cljs.core.Keyword("user","email","user/email",1419686391));
var user_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130045__$1,new cljs.core.Keyword("user","name","user/name",1848814598));
var user_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130045__$1,new cljs.core.Keyword("user","uuid","user/uuid",2146253734));
var color = logseq.shui.util.uuid_color(user_uuid);
return cljs.core.cons((cljs.core.truth_(user_name)?daiquiri.interpreter.interpret((function (){var G__130051 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-5 h-5",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"app-region","app-region",-1412948438),"no-drag"], null),new cljs.core.Keyword(null,"title","title",636505583),user_email], null);
var G__130052 = (function (){var G__130053 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(color),"50"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(11)], null)], null);
var G__130054 = (function (){var G__130055 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(user_name,(0),(2));
if((G__130055 == null)){
return null;
} else {
return clojure.string.upper_case(G__130055);
}
})();
return (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$2(G__130053,G__130054) : logseq.shui.ui.avatar_fallback.call(null,G__130053,G__130054));
})();
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2(G__130051,G__130052) : logseq.shui.ui.avatar.call(null,G__130051,G__130052));
})()):null),frontend$components$header$iter__130030(cljs.core.rest(s__130031__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(online_users);
})()):null)]));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.header","online-users","frontend.components.header/online-users",1171195019)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.header","online-users-canceler","frontend.components.header/online-users-canceler",172173629)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.header","online-users-canceler","frontend.components.header/online-users-canceler",172173629).cljs$core$IFn$_invoke$arity$1(state),frontend.common.missionary.run_task.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"fetch-online-users","fetch-online-users",1646897378),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,v){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.header","online-users","frontend.components.header/online-users",1171195019).cljs$core$IFn$_invoke$arity$1(state),v);
}),frontend.handler.db_based.rtc_flows.rtc_online_users_flow),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"succ","succ",1386276271),cljs.core.constantly(null)], 0)));

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("frontend.components.header","online-users-canceler","frontend.components.header/online-users-canceler",172173629).cljs$core$IFn$_invoke$arity$1(state)))){
var fexpr__130056_130169 = cljs.core.deref(new cljs.core.Keyword("frontend.components.header","online-users-canceler","frontend.components.header/online-users-canceler",172173629).cljs$core$IFn$_invoke$arity$1(state));
(fexpr__130056_130169.cljs$core$IFn$_invoke$arity$0 ? fexpr__130056_130169.cljs$core$IFn$_invoke$arity$0() : fexpr__130056_130169.call(null));
} else {
}

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.header","online-users","frontend.components.header/online-users",1171195019).cljs$core$IFn$_invoke$arity$1(state),null);

return state;
})], null)], null),"frontend.components.header/rtc-collaborators");
frontend.components.header.left_menu_button = rum.core.lazy_build(rum.core.build_defc,(function (p__130057){
var map__130058 = p__130057;
var map__130058__$1 = cljs.core.__destructure_map(map__130058);
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130058__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
return frontend.ui.with_shortcut(new cljs.core.Keyword("ui","toggle-left-sidebar","ui/toggle-left-sidebar",-468835605),"bottom",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.#left-menu.cp__header-left-menu.button.icon","button.#left-menu.cp__header-left-menu.button.icon",-1814867254),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("header","toggle-left-sidebar","header/toggle-left-sidebar",-1152332042)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click], null),frontend.ui.icon("menu-2",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (){
return cljs.core.identity("left-menu-toggle-button");
})], null)], null),"frontend.components.header/left-menu-button");
frontend.components.header.bug_report_url = (function frontend$components$header$bug_report_url(){
var ua = navigator.userAgent;
var safe_ua = clojure.string.replace(ua,/[^_\/a-zA-Z0-9\.\(\)]+/," ");
var platform = ["App Version: ",frontend.version.version,"\n","Git Revision: ",frontend.config.REVISION,"\n","Platform: ",safe_ua,"\n","Language: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(navigator.language),"\n","Plugins: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__130063){
var vec__130064 = p__130063;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130064,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130064,(1),null);
return [cljs.core.name(k)," (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(v)),")"].join('');
}),new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))].join('');
return ["https://github.com/logseq/logseq/issues/new?","title=&","template=bug_report.yaml&","labels=from:in-app&","platform=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(platform))].join('');
});
frontend.components.header.toolbar_dots_menu = rum.core.lazy_build(rum.core.build_defc,(function (p__130067){
var map__130068 = p__130067;
var map__130068__$1 = cljs.core.__destructure_map(map__130068);
var current_repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130068__$1,new cljs.core.Keyword(null,"current-repo","current-repo",134812359));
var t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130068__$1,new cljs.core.Keyword(null,"t","t",-1397832519));
var page = (function (){var G__130069 = frontend.components.right_sidebar.get_current_page();
if((G__130069 == null)){
return null;
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__130069) : frontend.db.get_page.call(null,G__130069));
}
})();
var working_page_QMARK_ = ((frontend.config.publishing_QMARK_)?cljs.core.not(frontend.state.sub(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233))):true);
var page_menu = (cljs.core.truth_((function (){var and__5000__auto__ = working_page_QMARK_;
if(and__5000__auto__){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto__;
}
})())?frontend.components.page_menu.page_menu(page):((frontend.config.publishing_QMARK_)?null:(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var block_id_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page));
var favorited_QMARK_ = frontend.handler.page.favorited_QMARK_(block_id_str);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),((favorited_QMARK_)?(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("page","unfavorite","page/unfavorite",578994300)) : t.call(null,new cljs.core.Keyword("page","unfavorite","page/unfavorite",578994300))):(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("page","add-to-favorites","page/add-to-favorites",-641181093)) : t.call(null,new cljs.core.Keyword("page","add-to-favorites","page/add-to-favorites",-641181093)))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(favorited_QMARK_){
return frontend.handler.page._LT_unfavorite_page_BANG_(block_id_str);
} else {
return frontend.handler.page._LT_favorite_page_BANG_(block_id_str);
}
})], null)], null)], null);
})():null)));
var page_menu_and_hr = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_menu,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr","hr",1377740067),true], null)], null));
var login_QMARK_ = (function (){var and__5000__auto__ = frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946));
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.user.logged_in_QMARK_();
} else {
return and__5000__auto__;
}
})();
var items = (function (){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_menu_and_hr,new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(frontend.state.enable_editing_QMARK_())?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"settings","settings",1556144875)) : t.call(null,new cljs.core.Keyword(null,"settings","settings",1556144875))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.state.open_settings_BANG_], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("settings")], null):null),(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"plugins","plugins",1900073717)) : t.call(null,new cljs.core.Keyword(null,"plugins","plugins",1900073717))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.plugin.goto_plugins_dashboard_BANG_();
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("apps")], null):null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"appearance","appearance",-216383432)) : t.call(null,new cljs.core.Keyword(null,"appearance","appearance",-216383432))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","toggle-appearance","ui/toggle-appearance",1527686942)], null));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("color-swatch")], null),(cljs.core.truth_(current_repo)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"export-graph","export-graph",1223786998)) : t.call(null,new cljs.core.Keyword(null,"export-graph","export-graph",1223786998))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.components.export$.export$) : logseq.shui.ui.dialog_open_BANG_.call(null,frontend.components.export$.export$));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("database-export")], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.enable_editing_QMARK_();
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"import","import",-1399500709)) : t.call(null,new cljs.core.Keyword(null,"import","import",-1399500709))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"import","import",-1399500709))], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("file-upload")], null):null),((frontend.config.publishing_QMARK_)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"toggle-theme","toggle-theme",-91905156)) : t.call(null,new cljs.core.Keyword(null,"toggle-theme","toggle-theme",-91905156))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.toggle_theme_BANG_();
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("bulb")], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(login_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = frontend.storage.get(new cljs.core.Keyword(null,"login-enabled","login-enabled",-1432803848));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(frontend.util.web_platform_QMARK_));
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"login","login",55217519)) : t.call(null,new cljs.core.Keyword(null,"login","login",55217519))),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","login","user/login",51503538)], null));
})], null),new cljs.core.Keyword(null,"icon","icon",1679606541),frontend.ui.icon("user")], null):null),(cljs.core.truth_(login_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hr","hr",1377740067),true], null):null),(cljs.core.truth_(login_QMARK_)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"item","item",249373802),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col.relative.group.pt-1.w-full","span.flex.flex-col.relative.group.pt-1.w-full",243573534),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.leading-none","b.leading-none",-836005278),frontend.handler.user.username()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-70","small.opacity-70",-476663833),frontend.handler.user.email()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.absolute.opacity-0.group-hover:opacity-100.text-red-rx-09","i.absolute.opacity-0.group-hover:opacity-100.text-red-rx-09",1142086953),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"right-1 top-3",new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"logout","logout",1418564329)) : t.call(null,new cljs.core.Keyword(null,"logout","logout",1418564329)))], null),frontend.ui.icon("logout")], null)], null),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.user.logout();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-full"], null)], null):null)], null)));
});
return daiquiri.interpreter.interpret(logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"dots","dots",714343900),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("header","more","header/more",1258535361)) : t.call(null,new cljs.core.Keyword("header","more","header/more",1258535361))),new cljs.core.Keyword(null,"class","class",-2030961996),"toolbar-dots-btn",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
var G__130085 = e.target;
var G__130086 = (function (p__130088){
var map__130089 = p__130088;
var map__130089__$1 = cljs.core.__destructure_map(map__130089);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130089__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var iter__5480__auto__ = (function frontend$components$header$iter__130090(s__130091){
return (new cljs.core.LazySeq(null,(function (){
var s__130091__$1 = s__130091;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__130091__$1);
if(temp__5804__auto__){
var s__130091__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__130091__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__130091__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__130093 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__130092 = (0);
while(true){
if((i__130092 < size__5479__auto__)){
var map__130094 = cljs.core._nth(c__5478__auto__,i__130092);
var map__130094__$1 = cljs.core.__destructure_map(map__130094);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130094__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130094__$1,new cljs.core.Keyword(null,"item","item",249373802));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130094__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130094__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130094__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
cljs.core.chunk_append(b__130093,(function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
var href = new cljs.core.Keyword(null,"href","href",-793805698).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
} else {
var G__130095 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__130092,on_click_SINGLEQUOTE_,href,map__130094,map__130094__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__130093,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t){
return (function (e__$1){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e__$1) : on_click_SINGLEQUOTE_.call(null,e__$1)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}
} else {
return null;
}
});})(i__130092,on_click_SINGLEQUOTE_,href,map__130094,map__130094__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__130093,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t))
);
var G__130096 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(href)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.w-full","a.flex.items-center.w-full",578384940),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__130092,or__5002__auto__,G__130095,on_click_SINGLEQUOTE_,href,map__130094,map__130094__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__130093,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t){
return (function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
});})(i__130092,or__5002__auto__,G__130095,on_click_SINGLEQUOTE_,href,map__130094,map__130094__$1,hr,item,title,options,icon,c__5478__auto__,size__5479__auto__,b__130093,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"inherit"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__130095,G__130096) : logseq.shui.ui.dropdown_menu_item.call(null,G__130095,G__130096));
}
})());

var G__130170 = (i__130092 + (1));
i__130092 = G__130170;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__130093),frontend$components$header$iter__130090(cljs.core.chunk_rest(s__130091__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__130093),null);
}
} else {
var map__130097 = cljs.core.first(s__130091__$2);
var map__130097__$1 = cljs.core.__destructure_map(map__130097);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130097__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130097__$1,new cljs.core.Keyword(null,"item","item",249373802));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130097__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130097__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130097__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
return cljs.core.cons((function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
var href = new cljs.core.Keyword(null,"href","href",-793805698).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
} else {
var G__130098 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (on_click_SINGLEQUOTE_,href,map__130097,map__130097__$1,hr,item,title,options,icon,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t){
return (function (e__$1){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e__$1) : on_click_SINGLEQUOTE_.call(null,e__$1)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}
} else {
return null;
}
});})(on_click_SINGLEQUOTE_,href,map__130097,map__130097__$1,hr,item,title,options,icon,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t))
);
var G__130099 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(href)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.w-full","a.flex.items-center.w-full",578384940),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (or__5002__auto__,G__130098,on_click_SINGLEQUOTE_,href,map__130097,map__130097__$1,hr,item,title,options,icon,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t){
return (function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
});})(or__5002__auto__,G__130098,on_click_SINGLEQUOTE_,href,map__130097,map__130097__$1,hr,item,title,options,icon,s__130091__$2,temp__5804__auto__,map__130089,map__130089__$1,id,G__130085,page,working_page_QMARK_,page_menu,page_menu_and_hr,login_QMARK_,items,map__130068,map__130068__$1,current_repo,t))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"inherit"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__130098,G__130099) : logseq.shui.ui.dropdown_menu_item.call(null,G__130098,G__130099));
}
})(),frontend$components$header$iter__130090(cljs.core.rest(s__130091__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items());
});
var G__130087 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"align","align",1964212802),"end",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-64",new cljs.core.Keyword(null,"align-offset","align-offset",894421035),(-32)], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__130085,G__130086,G__130087) : logseq.shui.ui.popup_show_BANG_.call(null,G__130085,G__130086,G__130087));
})], null)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.header/toolbar-dots-menu");
frontend.components.header.back_and_forward = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"flex flex-row"},[frontend.ui.with_shortcut(new cljs.core.Keyword("go","backward","go/backward",554039684),"bottom",logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"arrow-left","arrow-left",588569792),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("header","go-back","header/go-back",852769152)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.history.back();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"it navigation nav-left"], null))),frontend.ui.with_shortcut(new cljs.core.Keyword("go","forward","go/forward",-557348207),"bottom",logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"arrow-right","arrow-right",1734868482),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("header","go-forward","header/go-forward",-788133303)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.history.forward();
}),new cljs.core.Keyword(null,"class","class",-2030961996),"it navigation nav-right"], null)))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),(function (){
return cljs.core.identity("nav-history-buttons");
})], null)], null),"frontend.components.header/back-and-forward");
frontend.components.header.updater_tips_new_version = rum.core.lazy_build(rum.core.build_defc,(function (t){
var vec__130100 = rum.core.use_state(null);
var downloaded = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130100,(0),null);
var set_downloaded = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130100,(1),null);
var _ = logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return "auto-updater-downloaded";
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var channel = temp__5804__auto__;
var callback = (function (_,args){
console.debug("[new-version downloaded] args:",args);

var args_130171__$1 = cljs_bean.core.__GT_clj(args);
(set_downloaded.cljs$core$IFn$_invoke$arity$1 ? set_downloaded.cljs$core$IFn$_invoke$arity$1(args_130171__$1) : set_downloaded.call(null,args_130171__$1));

frontend.state.set_state_BANG_(new cljs.core.Keyword("electron","auto-updater-downloaded","electron/auto-updater-downloaded",760067750),args_130171__$1);

return null;
});
apis.addListener(channel,callback);

return (function (){
return apis.removeListener(channel,callback);
});
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);
if(cljs.core.truth_(downloaded)){
return daiquiri.core.create_element("div",{'className':"cp__header-tips"},[(function (){var attrs130103 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("updater","new-version-install","updater/new-version-install",1958846611)) : t.call(null,new cljs.core.Keyword("updater","new-version-install","updater/new-version-install",1958846611)));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs130103))?daiquiri.interpreter.element_attributes(attrs130103):null),((cljs.core.map_QMARK_(attrs130103))?[daiquiri.core.create_element("a",{'onClick':(function (){
return frontend.handler.quit_and_install_new_version_BANG_();
}),'className':"restart ml-2"},[daiquiri.interpreter.interpret(frontend.components.svg.reload.cljs$core$IFn$_invoke$arity$1((16))),(function (){var attrs130104 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("updater","quit-and-install","updater/quit-and-install",-1112335838)) : t.call(null,new cljs.core.Keyword("updater","quit-and-install","updater/quit-and-install",-1112335838)));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs130104))?daiquiri.interpreter.element_attributes(attrs130104):null),((cljs.core.map_QMARK_(attrs130104))?null:[daiquiri.interpreter.interpret(attrs130104)]));
})()])]:[daiquiri.interpreter.interpret(attrs130103),daiquiri.core.create_element("a",{'onClick':(function (){
return frontend.handler.quit_and_install_new_version_BANG_();
}),'className':"restart ml-2"},[daiquiri.interpreter.interpret(frontend.components.svg.reload.cljs$core$IFn$_invoke$arity$1((16))),(function (){var attrs130105 = (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("updater","quit-and-install","updater/quit-and-install",-1112335838)) : t.call(null,new cljs.core.Keyword("updater","quit-and-install","updater/quit-and-install",-1112335838)));
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs130105))?daiquiri.interpreter.element_attributes(attrs130105):null),((cljs.core.map_QMARK_(attrs130105))?null:[daiquiri.interpreter.interpret(attrs130105)]));
})()])]));
})()]);
} else {
return null;
}
}),null,"frontend.components.header/updater-tips-new-version");
frontend.components.header.clear_recent_highlight_BANG_ = (function frontend$components$header$clear_recent_highlight_BANG_(){
var nodes = dommy.utils.__GT_Array(document.getElementsByClassName("recent-block"));
if(cljs.core.seq(nodes)){
var seq__130106 = cljs.core.seq(nodes);
var chunk__130107 = null;
var count__130108 = (0);
var i__130109 = (0);
while(true){
if((i__130109 < count__130108)){
var node = chunk__130107.cljs$core$IIndexed$_nth$arity$2(null,i__130109);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"recent-block");


var G__130172 = seq__130106;
var G__130173 = chunk__130107;
var G__130174 = count__130108;
var G__130175 = (i__130109 + (1));
seq__130106 = G__130172;
chunk__130107 = G__130173;
count__130108 = G__130174;
i__130109 = G__130175;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__130106);
if(temp__5804__auto__){
var seq__130106__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__130106__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__130106__$1);
var G__130176 = cljs.core.chunk_rest(seq__130106__$1);
var G__130177 = c__5525__auto__;
var G__130178 = cljs.core.count(c__5525__auto__);
var G__130179 = (0);
seq__130106 = G__130176;
chunk__130107 = G__130177;
count__130108 = G__130178;
i__130109 = G__130179;
continue;
} else {
var node = cljs.core.first(seq__130106__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"recent-block");


var G__130180 = cljs.core.next(seq__130106__$1);
var G__130181 = null;
var G__130182 = (0);
var G__130183 = (0);
seq__130106 = G__130180;
chunk__130107 = G__130181;
count__130108 = G__130182;
i__130109 = G__130183;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
frontend.components.header.recent_slider_inner = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__130110 = rum.core.use_state(frontend.state.get_highlight_recent_days());
var recent_days = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130110,(0),null);
var set_recent_days_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130110,(1),null);
var vec__130113 = rum.core.use_state(null);
var thumb_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130113,(0),null);
var set_thumb_ref_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130113,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(thumb_ref)){
return thumb_ref.focus();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [thumb_ref], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var all_nodes = dommy.utils.__GT_Array(document.getElementsByClassName("ls-block"));
var recent_node = (function (node){
var id = (function (){var G__130116 = dommy.core.attr(node,"blockid");
if((G__130116 == null)){
return null;
} else {
return cljs.core.uuid(G__130116);
}
})();
var block = (function (){var G__130117 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__130117) : frontend.db.entity.call(null,G__130117));
})();
if(cljs.core.truth_(block)){
return cljs_time.core.after_QMARK_(cljs_time.coerce.from_long(new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(block)),cljs_time.core.ago(cljs_time.core.days.cljs$core$IFn$_invoke$arity$1(recent_days)));
} else {
return null;
}
});
var recent_nodes = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(recent_node,all_nodes);
var old_nodes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(recent_node,all_nodes);
if(cljs.core.seq(recent_nodes)){
var seq__130118_130184 = cljs.core.seq(recent_nodes);
var chunk__130119_130185 = null;
var count__130120_130186 = (0);
var i__130121_130187 = (0);
while(true){
if((i__130121_130187 < count__130120_130186)){
var node_130188 = chunk__130119_130185.cljs$core$IIndexed$_nth$arity$2(null,i__130121_130187);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_130188,"recent-block");


var G__130189 = seq__130118_130184;
var G__130190 = chunk__130119_130185;
var G__130191 = count__130120_130186;
var G__130192 = (i__130121_130187 + (1));
seq__130118_130184 = G__130189;
chunk__130119_130185 = G__130190;
count__130120_130186 = G__130191;
i__130121_130187 = G__130192;
continue;
} else {
var temp__5804__auto___130193 = cljs.core.seq(seq__130118_130184);
if(temp__5804__auto___130193){
var seq__130118_130194__$1 = temp__5804__auto___130193;
if(cljs.core.chunked_seq_QMARK_(seq__130118_130194__$1)){
var c__5525__auto___130195 = cljs.core.chunk_first(seq__130118_130194__$1);
var G__130196 = cljs.core.chunk_rest(seq__130118_130194__$1);
var G__130197 = c__5525__auto___130195;
var G__130198 = cljs.core.count(c__5525__auto___130195);
var G__130199 = (0);
seq__130118_130184 = G__130196;
chunk__130119_130185 = G__130197;
count__130120_130186 = G__130198;
i__130121_130187 = G__130199;
continue;
} else {
var node_130200 = cljs.core.first(seq__130118_130194__$1);
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_130200,"recent-block");


var G__130201 = cljs.core.next(seq__130118_130194__$1);
var G__130202 = null;
var G__130203 = (0);
var G__130204 = (0);
seq__130118_130184 = G__130201;
chunk__130119_130185 = G__130202;
count__130120_130186 = G__130203;
i__130121_130187 = G__130204;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.seq(old_nodes)){
var seq__130122 = cljs.core.seq(old_nodes);
var chunk__130123 = null;
var count__130124 = (0);
var i__130125 = (0);
while(true){
if((i__130125 < count__130124)){
var node = chunk__130123.cljs$core$IIndexed$_nth$arity$2(null,i__130125);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"recent-block");


var G__130205 = seq__130122;
var G__130206 = chunk__130123;
var G__130207 = count__130124;
var G__130208 = (i__130125 + (1));
seq__130122 = G__130205;
chunk__130123 = G__130206;
count__130124 = G__130207;
i__130125 = G__130208;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__130122);
if(temp__5804__auto__){
var seq__130122__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__130122__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__130122__$1);
var G__130209 = cljs.core.chunk_rest(seq__130122__$1);
var G__130210 = c__5525__auto__;
var G__130211 = cljs.core.count(c__5525__auto__);
var G__130212 = (0);
seq__130122 = G__130209;
chunk__130123 = G__130210;
count__130124 = G__130211;
i__130125 = G__130212;
continue;
} else {
var node = cljs.core.first(seq__130122__$1);
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"recent-block");


var G__130213 = cljs.core.next(seq__130122__$1);
var G__130214 = null;
var G__130215 = (0);
var G__130216 = (0);
seq__130122 = G__130213;
chunk__130123 = G__130214;
count__130124 = G__130215;
i__130125 = G__130216;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [recent_days], null));

return daiquiri.core.create_element("div",{'className':"recent-slider flex flex-row gap-1 items-center w-[32%]"},[daiquiri.interpreter.interpret((function (){var G__130139 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"relative flex w-full touch-none select-none items-center ",new cljs.core.Keyword(null,"default-value","default-value",232220170),[(3),(100)],new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (result){
var G__130142_130217 = cljs.core.first(result);
(set_recent_days_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_recent_days_BANG_.cljs$core$IFn$_invoke$arity$1(G__130142_130217) : set_recent_days_BANG_.call(null,G__130142_130217));

return frontend.state.set_highlight_recent_days_BANG_(cljs.core.first(result));
}),new cljs.core.Keyword(null,"minStepsBetweenThumbs","minStepsBetweenThumbs",-1562725313),(1)], null);
var G__130140 = (function (){var G__130143 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"], null);
return (logseq.shui.ui.slider_track.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.slider_track.cljs$core$IFn$_invoke$arity$1(G__130143) : logseq.shui.ui.slider_track.call(null,G__130143));
})();
var G__130141 = (function (){var G__130144 = (function (){var G__130145 = (function (){var G__130147 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return e.preventDefault();
})], null);
var G__130148 = (function (){var G__130149 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref","ref",1289896967),set_thumb_ref_BANG_,new cljs.core.Keyword(null,"class","class",-2030961996),"block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none"], null);
return (logseq.shui.ui.slider_thumb.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.slider_thumb.cljs$core$IFn$_invoke$arity$1(G__130149) : logseq.shui.ui.slider_thumb.call(null,G__130149));
})();
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2(G__130147,G__130148) : logseq.shui.ui.tooltip_trigger.call(null,G__130147,G__130148));
})();
var G__130146 = (function (){var G__130150 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),(function (e){
return e.preventDefault();
})], null);
var G__130151 = ["Highlight recent blocks",((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(recent_days,(0)))?[": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(recent_days)," days ago"].join(''):null)].join('');
return (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(G__130150,G__130151) : logseq.shui.ui.tooltip_content.call(null,G__130150,G__130151));
})();
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2(G__130145,G__130146) : logseq.shui.ui.tooltip.call(null,G__130145,G__130146));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__130144) : logseq.shui.ui.tooltip_provider.call(null,G__130144));
})();
return (logseq.shui.ui.slider.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.slider.cljs$core$IFn$_invoke$arity$3(G__130139,G__130140,G__130141) : logseq.shui.ui.slider.call(null,G__130139,G__130140,G__130141));
})()),daiquiri.interpreter.interpret((function (){var G__130154 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Quit highlight recent blocks",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50 hover:opacity-100",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.toggle_highlight_recent_blocks_BANG_();
})], null);
var G__130155 = frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__130154,G__130155) : logseq.shui.ui.button.call(null,G__130154,G__130155));
})())]);
}),null,"frontend.components.header/recent-slider-inner");
frontend.components.header.recent_slider = rum.core.lazy_build(rum.core.build_defc,(function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("ui","toggle-highlight-recent-blocks?","ui/toggle-highlight-recent-blocks?",261743188)))){
return frontend.components.header.recent_slider_inner();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-update","will-update",328062998),(function (state){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("ui","toggle-highlight-recent-blocks?","ui/toggle-highlight-recent-blocks?",261743188).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
} else {
frontend.components.header.clear_recent_highlight_BANG_();
}

return state;
})], null)], null),"frontend.components.header/recent-slider");
frontend.components.header.header_aux = rum.core.lazy_build(rum.core.build_defc,(function (p__130156){
var map__130157 = p__130156;
var map__130157__$1 = cljs.core.__destructure_map(map__130157);
var current_repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130157__$1,new cljs.core.Keyword(null,"current-repo","current-repo",134812359));
var default_home = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130157__$1,new cljs.core.Keyword(null,"default-home","default-home",171104159));
var new_block_mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130157__$1,new cljs.core.Keyword(null,"new-block-mode","new-block-mode",1189333509));
var electron_mac_QMARK_ = (function (){var and__5000__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.electron_QMARK_();
} else {
return and__5000__auto__;
}
})();
var left_menu = frontend.components.header.left_menu_button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.set_left_sidebar_open_BANG_(cljs.core.not(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
})], null));
var custom_home_page_QMARK_ = ((frontend.state.custom_home_page_QMARK_()) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.sub_default_home_page(),frontend.state.get_current_page())));
return daiquiri.core.create_element("div",{'id':"head",'onDoubleClick':(function (e){
var temp__5804__auto__ = e.target;
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return target.classList.contains("drag-region");
} else {
return and__5000__auto__;
}
})())){
return window.apis.toggleMaxOrMinActiveWindow();
} else {
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$1(true);
} else {
return null;
}
}
} else {
return null;
}
}),'style':{'fontSize':(50)},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__header","drag-region",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"electron-mac","electron-mac",776021658),electron_mac_QMARK_,new cljs.core.Keyword(null,"native-ios","native-ios",1665559494),frontend.mobile.util.native_ios_QMARK_(),new cljs.core.Keyword(null,"native-android","native-android",1622968152),frontend.mobile.util.native_android_QMARK_()], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"l flex items-center drag-region"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [left_menu,(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?((((frontend.state.home_QMARK_()) || (((custom_home_page_QMARK_) || (frontend.state.whiteboard_dashboard_QMARK_())))))?null:frontend.ui.with_shortcut(new cljs.core.Keyword("go","backward","go/backward",554039684),"bottom",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.it.navigation.nav-left.button.icon.opacity-70","button.it.navigation.nav-left.button.icon.opacity-70",1759216793),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("header","go-back","header/go-back",852769152)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.history.back();
})], null),frontend.ui.icon("chevron-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null))], null))):(cljs.core.truth_(current_repo)?frontend.ui.with_shortcut(new cljs.core.Keyword("go","search","go/search",1564957958),"right",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.button.icon#search-button","button.button.icon#search-button",1210758473),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("header","search","header/search",76690335)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.mobile.util.native_android_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_iphone_QMARK_();
}
})())){
frontend.state.set_left_sidebar_open_BANG_(false);
} else {
}

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","search","go/search",1564957958)], null));
})], null),frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),frontend.ui.icon_size], null))], null)):null))], null))]),(function (){var attrs130158 = (cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(cljs.core.truth_(and__5000__auto____$1)){
return ((frontend.handler.user.logged_in_QMARK_()) && (((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)) && (frontend.handler.user.team_member_QMARK_()))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.components.header.recent_slider(),rum.core.with_key(frontend.components.header.rtc_collaborators(),["collab-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_repo)].join('')),frontend.components.rtc.indicator.indicator()], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs130158))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["r","flex","drag-region"], null)], null),attrs130158], 0))):{'className':"r flex drag-region"}),((cljs.core.map_QMARK_(attrs130158))?[((frontend.handler.user.logged_in_QMARK_())?frontend.components.rtc.indicator.downloading_detail():null),((frontend.handler.user.logged_in_QMARK_())?frontend.components.rtc.indicator.uploading_detail():null),(cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
if(and__5000__auto____$2){
return frontend.handler.user.alpha_or_beta_user_QMARK_();
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.file_sync.indicator():null),((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_route(),new cljs.core.Keyword(null,"home","home",-74557309))) && ((!(custom_home_page_QMARK_)))))?frontend.components.header.home_button():null),(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)?daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.plugins.hook_ui_items(new cljs.core.Keyword(null,"toolbar","toolbar",-1172789065)),frontend.components.plugins.updates_notifications()]):null),((frontend.state.feature_http_server_enabled_QMARK_())?frontend.components.server.server_indicator(frontend.state.sub(new cljs.core.Keyword("electron","server","electron/server",1484164422))):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.header.back_and_forward():null),(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:daiquiri.interpreter.interpret((new_block_mode.cljs$core$IFn$_invoke$arity$0 ? new_block_mode.cljs$core$IFn$_invoke$arity$0() : new_block_mode.call(null)))),((frontend.config.publishing_QMARK_)?daiquiri.core.create_element("a",{'href':reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph","graph",1558099509)),'className':"text-sm font-medium button"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"graph","graph",1558099509)], 0)))]):null),frontend.components.header.toolbar_dots_menu(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"t","t",-1397832519),frontend.context.i18n.t,new cljs.core.Keyword(null,"current-repo","current-repo",134812359),current_repo,new cljs.core.Keyword(null,"default-home","default-home",171104159),default_home], null)),frontend.components.right_sidebar.toggle(),frontend.components.header.updater_tips_new_version(frontend.context.i18n.t)]:[daiquiri.interpreter.interpret(attrs130158),((frontend.handler.user.logged_in_QMARK_())?frontend.components.rtc.indicator.downloading_detail():null),((frontend.handler.user.logged_in_QMARK_())?frontend.components.rtc.indicator.uploading_detail():null),(cljs.core.truth_((function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo)));
if(and__5000__auto____$2){
return frontend.handler.user.alpha_or_beta_user_QMARK_();
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.file_sync.indicator():null),((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_route(),new cljs.core.Keyword(null,"home","home",-74557309))) && ((!(custom_home_page_QMARK_)))))?frontend.components.header.home_button():null),(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)?daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.plugins.hook_ui_items(new cljs.core.Keyword(null,"toolbar","toolbar",-1172789065)),frontend.components.plugins.updates_notifications()]):null),((frontend.state.feature_http_server_enabled_QMARK_())?frontend.components.server.server_indicator(frontend.state.sub(new cljs.core.Keyword("electron","server","electron/server",1484164422))):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.header.back_and_forward():null),(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?null:daiquiri.interpreter.interpret((new_block_mode.cljs$core$IFn$_invoke$arity$0 ? new_block_mode.cljs$core$IFn$_invoke$arity$0() : new_block_mode.call(null)))),((frontend.config.publishing_QMARK_)?daiquiri.core.create_element("a",{'href':reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph","graph",1558099509)),'className':"text-sm font-medium button"},[daiquiri.interpreter.interpret(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"graph","graph",1558099509)], 0)))]):null),frontend.components.header.toolbar_dots_menu(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"t","t",-1397832519),frontend.context.i18n.t,new cljs.core.Keyword(null,"current-repo","current-repo",134812359),current_repo,new cljs.core.Keyword(null,"default-home","default-home",171104159),default_home], null)),frontend.components.right_sidebar.toggle(),frontend.components.header.updater_tips_new_version(frontend.context.i18n.t)]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.header/header-aux");
frontend.components.header.header_related_flow = missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic((function (state,rtc_running_QMARK_){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"user-groups","user-groups",-1264926454),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","info","user/info",-345834271),new cljs.core.Keyword(null,"UserGroups","UserGroups",1693861388)], null)),new cljs.core.Keyword(null,"rtc-running?","rtc-running?",777111292),rtc_running_QMARK_], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.watch(frontend.state.state),frontend.handler.db_based.rtc_flows.rtc_running_flow], 0));
frontend.components.header.header = rum.core.lazy_build(rum.core.build_defc,(function (opts){
var _m = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.components.header.header_related_flow);
return frontend.components.header.header_aux(opts);
}),null,"frontend.components.header/header");

//# sourceMappingURL=frontend.components.header.js.map
