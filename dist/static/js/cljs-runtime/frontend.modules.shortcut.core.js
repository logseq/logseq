goog.provide('frontend.modules.shortcut.core');
if((typeof frontend !== 'undefined') && (typeof frontend.modules !== 'undefined') && (typeof frontend.modules.shortcut !== 'undefined') && (typeof frontend.modules.shortcut.core !== 'undefined') && (typeof frontend.modules.shortcut.core._STAR_installed_handlers !== 'undefined')){
} else {
frontend.modules.shortcut.core._STAR_installed_handlers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.modules !== 'undefined') && (typeof frontend.modules.shortcut !== 'undefined') && (typeof frontend.modules.shortcut.core !== 'undefined') && (typeof frontend.modules.shortcut.core._STAR_pending_inited_QMARK_ !== 'undefined')){
} else {
frontend.modules.shortcut.core._STAR_pending_inited_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.modules !== 'undefined') && (typeof frontend.modules.shortcut !== 'undefined') && (typeof frontend.modules.shortcut.core !== 'undefined') && (typeof frontend.modules.shortcut.core._STAR_pending_shortcuts !== 'undefined')){
} else {
frontend.modules.shortcut.core._STAR_pending_shortcuts = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
frontend.modules.shortcut.core.global_keys = [goog.events.KeyCodes.TAB,goog.events.KeyCodes.ENTER,goog.events.KeyCodes.BACKSPACE,goog.events.KeyCodes.DELETE,goog.events.KeyCodes.UP,goog.events.KeyCodes.LEFT,goog.events.KeyCodes.DOWN,goog.events.KeyCodes.RIGHT];
frontend.modules.shortcut.core.key_names = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(goog.events.KeyNames);
frontend.modules.shortcut.core.consume_pending_shortcuts_BANG_ = (function frontend$modules$shortcut$core$consume_pending_shortcuts_BANG_(){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_shortcuts));
} else {
return and__5000__auto__;
}
})())){
var seq__105923_106013 = cljs.core.seq(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_shortcuts));
var chunk__105924_106014 = null;
var count__105925_106015 = (0);
var i__105926_106016 = (0);
while(true){
if((i__105926_106016 < count__105925_106015)){
var vec__105933_106017 = chunk__105924_106014.cljs$core$IIndexed$_nth$arity$2(null,i__105926_106016);
var handler_id_106018 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105933_106017,(0),null);
var id_106019 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105933_106017,(1),null);
var shortcut_106020 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105933_106017,(2),null);
(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id_106018,id_106019,shortcut_106020) : frontend.modules.shortcut.core.register_shortcut_BANG_.call(null,handler_id_106018,id_106019,shortcut_106020));


var G__106021 = seq__105923_106013;
var G__106022 = chunk__105924_106014;
var G__106023 = count__105925_106015;
var G__106024 = (i__105926_106016 + (1));
seq__105923_106013 = G__106021;
chunk__105924_106014 = G__106022;
count__105925_106015 = G__106023;
i__105926_106016 = G__106024;
continue;
} else {
var temp__5804__auto___106025 = cljs.core.seq(seq__105923_106013);
if(temp__5804__auto___106025){
var seq__105923_106026__$1 = temp__5804__auto___106025;
if(cljs.core.chunked_seq_QMARK_(seq__105923_106026__$1)){
var c__5525__auto___106027 = cljs.core.chunk_first(seq__105923_106026__$1);
var G__106028 = cljs.core.chunk_rest(seq__105923_106026__$1);
var G__106029 = c__5525__auto___106027;
var G__106030 = cljs.core.count(c__5525__auto___106027);
var G__106031 = (0);
seq__105923_106013 = G__106028;
chunk__105924_106014 = G__106029;
count__105925_106015 = G__106030;
i__105926_106016 = G__106031;
continue;
} else {
var vec__105936_106032 = cljs.core.first(seq__105923_106026__$1);
var handler_id_106033 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105936_106032,(0),null);
var id_106034 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105936_106032,(1),null);
var shortcut_106035 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105936_106032,(2),null);
(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id_106033,id_106034,shortcut_106035) : frontend.modules.shortcut.core.register_shortcut_BANG_.call(null,handler_id_106033,id_106034,shortcut_106035));


var G__106036 = cljs.core.next(seq__105923_106026__$1);
var G__106037 = null;
var G__106038 = (0);
var G__106039 = (0);
seq__105923_106013 = G__106036;
chunk__105924_106014 = G__106037;
count__105925_106015 = G__106038;
i__105926_106016 = G__106039;
continue;
}
} else {
}
}
break;
}

return cljs.core.reset_BANG_(frontend.modules.shortcut.core._STAR_pending_shortcuts,cljs.core.PersistentVector.EMPTY);
} else {
return null;
}
});
frontend.modules.shortcut.core.get_handler_by_id = (function frontend$modules$shortcut$core$get_handler_by_id(handler_id){
return new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105939_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(p1__105939_SHARP_),handler_id);
}),cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)))));
});
frontend.modules.shortcut.core.get_installed_ids_by_handler_id = (function frontend$modules$shortcut$core$get_installed_ids_by_handler_id(handler_id){
var G__105941 = cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers);
var G__105941__$1 = (((G__105941 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105940_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__105940_SHARP_)),handler_id);
}),G__105941));
var G__105941__$2 = (((G__105941__$1 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,G__105941__$1));
var G__105941__$3 = (((G__105941__$2 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__105941__$2));
if((G__105941__$3 == null)){
return null;
} else {
return cljs.core.vec(G__105941__$3);
}
});
/**
 * Register a shortcut, notice the id need to be a namespaced keyword to avoid
 *   conflicts.
 *   Example:
 *   (register-shortcut! :shortcut.handler/misc :foo/bar {:binding "mod+shift+8"
 *   :fn (fn [_state _event]
 *   (js/alert "test shortcut"))})
 */
frontend.modules.shortcut.core.register_shortcut_BANG_ = (function frontend$modules$shortcut$core$register_shortcut_BANG_(var_args){
var G__105943 = arguments.length;
switch (G__105943) {
case 2:
return frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (handler_id,id){
return frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id,id,null);
}));

(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (handler_id,id,shortcut_map){
if((((handler_id instanceof cljs.core.Keyword)) && (cljs.core.not(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_inited_QMARK_))))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.modules.shortcut.core._STAR_pending_shortcuts,cljs.core.conj,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [handler_id,id,shortcut_map], null));
} else {
var temp__5804__auto__ = ((((typeof handler_id === 'string') || ((handler_id instanceof cljs.core.Keyword))))?(function (){var handler_id__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(handler_id);
return frontend.modules.shortcut.core.get_handler_by_id(handler_id__$1);
})():handler_id);
if(cljs.core.truth_(temp__5804__auto__)){
var handler = temp__5804__auto__;
if(cljs.core.truth_(shortcut_map)){
frontend.modules.shortcut.config.add_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id,id,shortcut_map);
} else {
}

if(frontend.modules.shortcut.data_helper.shortcut_binding(id) === false){
return null;
} else {
var seq__105944 = cljs.core.seq(frontend.modules.shortcut.data_helper.shortcut_binding(id));
var chunk__105945 = null;
var count__105946 = (0);
var i__105947 = (0);
while(true){
if((i__105947 < count__105946)){
var k = chunk__105945.cljs$core$IIndexed$_nth$arity$2(null,i__105947);
try{lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k], null),new cljs.core.Keyword(null,"line","line",212345235),80], null)),null);

handler.registerShortcut(frontend.util.keyname(id),frontend.modules.shortcut.utils.undecorate_binding(k));
}catch (e105950){var e_106041 = e105950;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k,new cljs.core.Keyword(null,"error","error",-978969032),e_106041], null),new cljs.core.Keyword(null,"line","line",212345235),83], null)),null);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,k,e_106041.message], null)),new cljs.core.Keyword(null,"error","error",-978969032),false);
}

var G__106042 = seq__105944;
var G__106043 = chunk__105945;
var G__106044 = count__105946;
var G__106045 = (i__105947 + (1));
seq__105944 = G__106042;
chunk__105945 = G__106043;
count__105946 = G__106044;
i__105947 = G__106045;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__105944);
if(temp__5804__auto____$1){
var seq__105944__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__105944__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__105944__$1);
var G__106046 = cljs.core.chunk_rest(seq__105944__$1);
var G__106047 = c__5525__auto__;
var G__106048 = cljs.core.count(c__5525__auto__);
var G__106049 = (0);
seq__105944 = G__106046;
chunk__105945 = G__106047;
count__105946 = G__106048;
i__105947 = G__106049;
continue;
} else {
var k = cljs.core.first(seq__105944__$1);
try{lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k], null),new cljs.core.Keyword(null,"line","line",212345235),80], null)),null);

handler.registerShortcut(frontend.util.keyname(id),frontend.modules.shortcut.utils.undecorate_binding(k));
}catch (e105951){var e_106050 = e105951;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k,new cljs.core.Keyword(null,"error","error",-978969032),e_106050], null),new cljs.core.Keyword(null,"line","line",212345235),83], null)),null);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,k,e_106050.message], null)),new cljs.core.Keyword(null,"error","error",-978969032),false);
}

var G__106051 = cljs.core.next(seq__105944__$1);
var G__106052 = null;
var G__106053 = (0);
var G__106054 = (0);
seq__105944 = G__106051;
chunk__105945 = G__106052;
count__105946 = G__106053;
i__105947 = G__106054;
continue;
}
} else {
return null;
}
}
break;
}
}
} else {
return null;
}
}
}));

(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Unregister a shortcut.
 *   Example:
 *   (unregister-shortcut! :shortcut.handler/misc :foo/bar)
 */
frontend.modules.shortcut.core.unregister_shortcut_BANG_ = (function frontend$modules$shortcut$core$unregister_shortcut_BANG_(handler_id,shortcut_id){
var temp__5804__auto___106055 = frontend.modules.shortcut.core.get_handler_by_id(handler_id);
if(cljs.core.truth_(temp__5804__auto___106055)){
var handler_106056 = temp__5804__auto___106055;
var temp__5804__auto___106057__$1 = frontend.modules.shortcut.data_helper.shortcut_binding(shortcut_id);
if(cljs.core.truth_(temp__5804__auto___106057__$1)){
var ks_106058 = temp__5804__auto___106057__$1;
var seq__105952_106059 = cljs.core.seq(ks_106058);
var chunk__105953_106060 = null;
var count__105954_106061 = (0);
var i__105955_106062 = (0);
while(true){
if((i__105955_106062 < count__105954_106061)){
var k_106063 = chunk__105953_106060.cljs$core$IIndexed$_nth$arity$2(null,i__105955_106062);
handler_106056.unregisterShortcut(frontend.modules.shortcut.utils.undecorate_binding(k_106063));


var G__106064 = seq__105952_106059;
var G__106065 = chunk__105953_106060;
var G__106066 = count__105954_106061;
var G__106067 = (i__105955_106062 + (1));
seq__105952_106059 = G__106064;
chunk__105953_106060 = G__106065;
count__105954_106061 = G__106066;
i__105955_106062 = G__106067;
continue;
} else {
var temp__5804__auto___106068__$2 = cljs.core.seq(seq__105952_106059);
if(temp__5804__auto___106068__$2){
var seq__105952_106069__$1 = temp__5804__auto___106068__$2;
if(cljs.core.chunked_seq_QMARK_(seq__105952_106069__$1)){
var c__5525__auto___106070 = cljs.core.chunk_first(seq__105952_106069__$1);
var G__106071 = cljs.core.chunk_rest(seq__105952_106069__$1);
var G__106072 = c__5525__auto___106070;
var G__106073 = cljs.core.count(c__5525__auto___106070);
var G__106074 = (0);
seq__105952_106059 = G__106071;
chunk__105953_106060 = G__106072;
count__105954_106061 = G__106073;
i__105955_106062 = G__106074;
continue;
} else {
var k_106075 = cljs.core.first(seq__105952_106069__$1);
handler_106056.unregisterShortcut(frontend.modules.shortcut.utils.undecorate_binding(k_106075));


var G__106076 = cljs.core.next(seq__105952_106069__$1);
var G__106077 = null;
var G__106078 = (0);
var G__106079 = (0);
seq__105952_106059 = G__106076;
chunk__105953_106060 = G__106077;
count__105954_106061 = G__106078;
i__105955_106062 = G__106079;
continue;
}
} else {
}
}
break;
}
} else {
}
} else {
}

if(cljs.core.truth_(shortcut_id)){
return frontend.modules.shortcut.config.remove_shortcut_BANG_(handler_id,shortcut_id);
} else {
return null;
}
});
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_ = (function frontend$modules$shortcut$core$uninstall_shortcut_handler_BANG_(var_args){
var G__105957 = arguments.length;
switch (G__105957) {
case 1:
return frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (install_id){
return frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$2(install_id,false);
}));

(frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (install_id,refresh_QMARK_){
var temp__5804__auto__ = new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers),install_id));
if(cljs.core.truth_(temp__5804__auto__)){
var handler = temp__5804__auto__;
handler.dispose();

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcuts","uninstall-handler","shortcuts/uninstall-handler",-1055305832),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers),install_id))),(cljs.core.truth_(refresh_QMARK_)?"*":"")].join(''),new cljs.core.Keyword(null,"line","line",212345235),106], null)),null);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.modules.shortcut.core._STAR_installed_handlers,cljs.core.dissoc,install_id);
} else {
return null;
}
}));

(frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$lang$maxFixedArity = 2);

frontend.modules.shortcut.core.install_shortcut_handler_BANG_ = (function frontend$modules$shortcut$core$install_shortcut_handler_BANG_(handler_id,p__105959){
var map__105960 = p__105959;
var map__105960__$1 = cljs.core.__destructure_map(map__105960);
var set_global_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__105960__$1,new cljs.core.Keyword(null,"set-global-keys?","set-global-keys?",-497167260),true);
var prevent_default_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__105960__$1,new cljs.core.Keyword(null,"prevent-default?","prevent-default?",-1165567888),false);
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105960__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var G__105961_106081 = frontend.modules.shortcut.core.get_installed_ids_by_handler_id(handler_id);
var G__105961_106082__$1 = (((G__105961_106081 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105958_SHARP_){
return frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$2(p1__105958_SHARP_,true);
}),G__105961_106081));
if((G__105961_106082__$1 == null)){
} else {
cljs.core.doall.cljs$core$IFn$_invoke$arity$1(G__105961_106082__$1);
}

var shortcut_map = frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2(handler_id,state);
var handler = (new goog.ui.KeyboardShortcutHandler(window));
if(cljs.core.truth_(set_global_keys_QMARK_)){
handler.setGlobalKeys(frontend.modules.shortcut.core.global_keys);
} else {
}

handler.setAlwaysPreventDefault(prevent_default_QMARK_);

var seq__105962_106083 = cljs.core.seq(shortcut_map);
var chunk__105963_106084 = null;
var count__105964_106085 = (0);
var i__105965_106086 = (0);
while(true){
if((i__105965_106086 < count__105964_106085)){
var vec__105972_106087 = chunk__105963_106084.cljs$core$IIndexed$_nth$arity$2(null,i__105965_106086);
var id_106088 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105972_106087,(0),null);
var __106089 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105972_106087,(1),null);
frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2(handler,id_106088);


var G__106090 = seq__105962_106083;
var G__106091 = chunk__105963_106084;
var G__106092 = count__105964_106085;
var G__106093 = (i__105965_106086 + (1));
seq__105962_106083 = G__106090;
chunk__105963_106084 = G__106091;
count__105964_106085 = G__106092;
i__105965_106086 = G__106093;
continue;
} else {
var temp__5804__auto___106094 = cljs.core.seq(seq__105962_106083);
if(temp__5804__auto___106094){
var seq__105962_106095__$1 = temp__5804__auto___106094;
if(cljs.core.chunked_seq_QMARK_(seq__105962_106095__$1)){
var c__5525__auto___106096 = cljs.core.chunk_first(seq__105962_106095__$1);
var G__106097 = cljs.core.chunk_rest(seq__105962_106095__$1);
var G__106098 = c__5525__auto___106096;
var G__106099 = cljs.core.count(c__5525__auto___106096);
var G__106100 = (0);
seq__105962_106083 = G__106097;
chunk__105963_106084 = G__106098;
count__105964_106085 = G__106099;
i__105965_106086 = G__106100;
continue;
} else {
var vec__105975_106101 = cljs.core.first(seq__105962_106095__$1);
var id_106102 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105975_106101,(0),null);
var __106103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105975_106101,(1),null);
frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2(handler,id_106102);


var G__106104 = cljs.core.next(seq__105962_106095__$1);
var G__106105 = null;
var G__106106 = (0);
var G__106107 = (0);
seq__105962_106083 = G__106104;
chunk__105963_106084 = G__106105;
count__105964_106085 = G__106106;
i__105965_106086 = G__106107;
continue;
}
} else {
}
}
break;
}

var f = (function (e){
var id = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(e.identifier);
var shortcut_map__$1 = frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2(handler_id,state);
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(shortcut_map__$1,id);
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","latest-shortcut","editor/latest-shortcut",-2095243213),id);

if(cljs.core.truth_(dispatch_fn)){
return frontend.handler.plugin.hook_lifecycle_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic(id,dispatch_fn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e], 0));
} else {
return null;
}
});
var install_id = cljs.core.random_uuid();
var data = cljs.core.PersistentArrayMap.createAsIfByAssoc([install_id,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"group","group",582596132),handler_id,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614),f,new cljs.core.Keyword(null,"handler","handler",-195596612),handler], null)]);
handler.listen(goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,f);

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcuts","install-handler","shortcuts/install-handler",657811157),cljs.core.str.cljs$core$IFn$_invoke$arity$1(handler_id),new cljs.core.Keyword(null,"line","line",212345235),151], null)),null);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.modules.shortcut.core._STAR_installed_handlers,cljs.core.merge,data);

return install_id;
});
frontend.modules.shortcut.core.install_shortcuts_BANG_ = (function frontend$modules$shortcut$core$install_shortcuts_BANG_(handler_ids){
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105978_SHARP_){
return frontend.modules.shortcut.core.install_shortcut_handler_BANG_(p1__105978_SHARP_,cljs.core.PersistentArrayMap.EMPTY);
}),(function (){var or__5002__auto__ = cljs.core.seq(handler_ids);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741),new cljs.core.Keyword("shortcut.handler","editor-global","shortcut.handler/editor-global",-799336480),new cljs.core.Keyword("shortcut.handler","global-non-editing-only","shortcut.handler/global-non-editing-only",-2118756985),new cljs.core.Keyword("shortcut.handler","global-prevent-default","shortcut.handler/global-prevent-default",-1269226682),new cljs.core.Keyword("shortcut.handler","block-editing-only","shortcut.handler/block-editing-only",794342449)], null);
}
})()));
});
frontend.modules.shortcut.core.mixin = (function frontend$modules$shortcut$core$mixin(var_args){
var G__105980 = arguments.length;
switch (G__105980) {
case 1:
return frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$1 = (function (handler_id){
return frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2(handler_id,true);
}));

(frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2 = (function (handler_id,remount_reinstall_QMARK_){
var G__105981 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var install_id = frontend.modules.shortcut.core.install_shortcut_handler_BANG_(handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"state","state",-1988618099),state], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293),install_id);
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___106109 = new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___106109)){
var install_id_106110 = temp__5804__auto___106109;
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(install_id_106110);
} else {
}

return state;
})], null);
if(cljs.core.truth_(remount_reinstall_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__105981,new cljs.core.Keyword(null,"will-remount","will-remount",-141604325),(function (old_state,new_state){
if(cljs.core.truth_(goog.DEBUG)){
var k__99485__auto__ = "[shortcuts] reinstalled:";
console.time(k__99485__auto__);

var res__99486__auto__ = (function (){
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(old_state));

var temp__5804__auto__ = frontend.modules.shortcut.core.install_shortcut_handler_BANG_(handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"state","state",-1988618099),new_state], null));
if(cljs.core.truth_(temp__5804__auto__)){
var install_id = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new_state,new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293),install_id);
} else {
return null;
}
})()
;
console.timeEnd(k__99485__auto__);

return res__99486__auto__;
} else {
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(old_state));

var temp__5804__auto__ = frontend.modules.shortcut.core.install_shortcut_handler_BANG_(handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"state","state",-1988618099),new_state], null));
if(cljs.core.truth_(temp__5804__auto__)){
var install_id = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new_state,new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293),install_id);
} else {
return null;
}
}
}));
} else {
return G__105981;
}
}));

(frontend.modules.shortcut.core.mixin.cljs$lang$maxFixedArity = 2);

/**
 * This is an optimized version compared to (mixin).
 * And the shortcuts will not be frequently loaded and unloaded.
 * As well as ensuring unnecessary updates of components.
 */
frontend.modules.shortcut.core.mixin_STAR_ = (function frontend$modules$shortcut$core$mixin_STAR_(handler_id){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var _STAR_state = cljs.core.volatile_BANG_(state);
var install_id = frontend.modules.shortcut.core.install_shortcut_handler_BANG_(handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"state","state",-1988618099),_STAR_state], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293),install_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.modules.shortcut.core","*state","frontend.modules.shortcut.core/*state",262386927),_STAR_state], 0));
}),new cljs.core.Keyword(null,"will-remount","will-remount",-141604325),(function (old_state,new_state){
var temp__5804__auto___106111 = new cljs.core.Keyword("frontend.modules.shortcut.core","*state","frontend.modules.shortcut.core/*state",262386927).cljs$core$IFn$_invoke$arity$1(old_state);
if(cljs.core.truth_(temp__5804__auto___106111)){
var _STAR_state_106112 = temp__5804__auto___106111;
cljs.core.vreset_BANG_(_STAR_state_106112,new_state);
} else {
}

return new_state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___106113 = new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___106113)){
var install_id_106114 = temp__5804__auto___106113;
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(install_id_106114);

var G__105982_106115 = new cljs.core.Keyword("frontend.modules.shortcut.core","*state","frontend.modules.shortcut.core/*state",262386927).cljs$core$IFn$_invoke$arity$1(state);
if((G__105982_106115 == null)){
} else {
cljs.core.vreset_BANG_(G__105982_106115,null);
}
} else {
}

return state;
})], null);
});
frontend.modules.shortcut.core.unlisten_all_BANG_ = (function frontend$modules$shortcut$core$unlisten_all_BANG_(var_args){
var G__105984 = arguments.length;
switch (G__105984) {
case 0:
return frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1(false);
}));

(frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (dispose_QMARK_){
var seq__105985 = cljs.core.seq(cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)));
var chunk__105987 = null;
var count__105988 = (0);
var i__105989 = (0);
while(true){
if((i__105989 < count__105988)){
var map__105993 = chunk__105987.cljs$core$IIndexed$_nth$arity$2(null,i__105989);
var map__105993__$1 = cljs.core.__destructure_map(map__105993);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105993__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105993__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105993__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(dispose_QMARK_)){
handler.dispose();
} else {
goog.events.unlisten(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__106117 = seq__105985;
var G__106118 = chunk__105987;
var G__106119 = count__105988;
var G__106120 = (i__105989 + (1));
seq__105985 = G__106117;
chunk__105987 = G__106118;
count__105988 = G__106119;
i__105989 = G__106120;
continue;
} else {
var G__106121 = seq__105985;
var G__106122 = chunk__105987;
var G__106123 = count__105988;
var G__106124 = (i__105989 + (1));
seq__105985 = G__106121;
chunk__105987 = G__106122;
count__105988 = G__106123;
i__105989 = G__106124;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__105985);
if(temp__5804__auto__){
var seq__105985__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__105985__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__105985__$1);
var G__106125 = cljs.core.chunk_rest(seq__105985__$1);
var G__106126 = c__5525__auto__;
var G__106127 = cljs.core.count(c__5525__auto__);
var G__106128 = (0);
seq__105985 = G__106125;
chunk__105987 = G__106126;
count__105988 = G__106127;
i__105989 = G__106128;
continue;
} else {
var map__105994 = cljs.core.first(seq__105985__$1);
var map__105994__$1 = cljs.core.__destructure_map(map__105994);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105994__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105994__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105994__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(dispose_QMARK_)){
handler.dispose();
} else {
goog.events.unlisten(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__106129 = cljs.core.next(seq__105985__$1);
var G__106130 = null;
var G__106131 = (0);
var G__106132 = (0);
seq__105985 = G__106129;
chunk__105987 = G__106130;
count__105988 = G__106131;
i__105989 = G__106132;
continue;
} else {
var G__106133 = cljs.core.next(seq__105985__$1);
var G__106134 = null;
var G__106135 = (0);
var G__106136 = (0);
seq__105985 = G__106133;
chunk__105987 = G__106134;
count__105988 = G__106135;
i__105989 = G__106136;
continue;
}
}
} else {
return null;
}
}
break;
}
}));

(frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$lang$maxFixedArity = 1);

frontend.modules.shortcut.core.listen_all_BANG_ = (function frontend$modules$shortcut$core$listen_all_BANG_(){
var seq__105995 = cljs.core.seq(cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)));
var chunk__105997 = null;
var count__105998 = (0);
var i__105999 = (0);
while(true){
if((i__105999 < count__105998)){
var map__106003 = chunk__105997.cljs$core$IIndexed$_nth$arity$2(null,i__105999);
var map__106003__$1 = cljs.core.__destructure_map(map__106003);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106003__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106003__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106003__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(handler.isDisposed())){
frontend.modules.shortcut.core.install_shortcut_handler_BANG_(group,cljs.core.PersistentArrayMap.EMPTY);
} else {
goog.events.listen(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__106139 = seq__105995;
var G__106140 = chunk__105997;
var G__106141 = count__105998;
var G__106142 = (i__105999 + (1));
seq__105995 = G__106139;
chunk__105997 = G__106140;
count__105998 = G__106141;
i__105999 = G__106142;
continue;
} else {
var G__106143 = seq__105995;
var G__106144 = chunk__105997;
var G__106145 = count__105998;
var G__106146 = (i__105999 + (1));
seq__105995 = G__106143;
chunk__105997 = G__106144;
count__105998 = G__106145;
i__105999 = G__106146;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__105995);
if(temp__5804__auto__){
var seq__105995__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__105995__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__105995__$1);
var G__106147 = cljs.core.chunk_rest(seq__105995__$1);
var G__106148 = c__5525__auto__;
var G__106149 = cljs.core.count(c__5525__auto__);
var G__106150 = (0);
seq__105995 = G__106147;
chunk__105997 = G__106148;
count__105998 = G__106149;
i__105999 = G__106150;
continue;
} else {
var map__106004 = cljs.core.first(seq__105995__$1);
var map__106004__$1 = cljs.core.__destructure_map(map__106004);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106004__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106004__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106004__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(handler.isDisposed())){
frontend.modules.shortcut.core.install_shortcut_handler_BANG_(group,cljs.core.PersistentArrayMap.EMPTY);
} else {
goog.events.listen(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__106151 = cljs.core.next(seq__105995__$1);
var G__106152 = null;
var G__106153 = (0);
var G__106154 = (0);
seq__105995 = G__106151;
chunk__105997 = G__106152;
count__105998 = G__106153;
i__105999 = G__106154;
continue;
} else {
var G__106155 = cljs.core.next(seq__105995__$1);
var G__106156 = null;
var G__106157 = (0);
var G__106158 = (0);
seq__105995 = G__106155;
chunk__105997 = G__106156;
count__105998 = G__106157;
i__105999 = G__106158;
continue;
}
}
} else {
return null;
}
}
break;
}
});
frontend.modules.shortcut.core.disable_all_shortcuts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$0();

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.modules.shortcut.core.listen_all_BANG_();

return state;
})], null);
/**
 * Always use this function to refresh shortcuts
 */
frontend.modules.shortcut.core.refresh_BANG_ = (function frontend$modules$shortcut$core$refresh_BANG_(){
if(cljs.core.truth_(new cljs.core.Keyword("ui","shortcut-handler-refreshing?","ui/shortcut-handler-refreshing?",741908481).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","shortcut-handler-refreshing?","ui/shortcut-handler-refreshing?",741908481),true);

var ids_106160 = cljs.core.keys(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers));
var _handler_ids_106161 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132),cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers))));
var seq__106005_106162 = cljs.core.seq(ids_106160);
var chunk__106006_106163 = null;
var count__106007_106164 = (0);
var i__106008_106165 = (0);
while(true){
if((i__106008_106165 < count__106007_106164)){
var id_106166 = chunk__106006_106163.cljs$core$IIndexed$_nth$arity$2(null,i__106008_106165);
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(id_106166);


var G__106167 = seq__106005_106162;
var G__106168 = chunk__106006_106163;
var G__106169 = count__106007_106164;
var G__106170 = (i__106008_106165 + (1));
seq__106005_106162 = G__106167;
chunk__106006_106163 = G__106168;
count__106007_106164 = G__106169;
i__106008_106165 = G__106170;
continue;
} else {
var temp__5804__auto___106171 = cljs.core.seq(seq__106005_106162);
if(temp__5804__auto___106171){
var seq__106005_106172__$1 = temp__5804__auto___106171;
if(cljs.core.chunked_seq_QMARK_(seq__106005_106172__$1)){
var c__5525__auto___106173 = cljs.core.chunk_first(seq__106005_106172__$1);
var G__106174 = cljs.core.chunk_rest(seq__106005_106172__$1);
var G__106175 = c__5525__auto___106173;
var G__106176 = cljs.core.count(c__5525__auto___106173);
var G__106177 = (0);
seq__106005_106162 = G__106174;
chunk__106006_106163 = G__106175;
count__106007_106164 = G__106176;
i__106008_106165 = G__106177;
continue;
} else {
var id_106178 = cljs.core.first(seq__106005_106172__$1);
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(id_106178);


var G__106180 = cljs.core.next(seq__106005_106172__$1);
var G__106181 = null;
var G__106182 = (0);
var G__106183 = (0);
seq__106005_106162 = G__106180;
chunk__106006_106163 = G__106181;
count__106007_106164 = G__106182;
i__106008_106165 = G__106183;
continue;
}
} else {
}
}
break;
}

frontend.modules.shortcut.core.install_shortcuts_BANG_(null);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"shortcut-handler-refreshed","shortcut-handler-refreshed",1293579011)], null));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","shortcut-handler-refreshing?","ui/shortcut-handler-refreshing?",741908481),false);
}
});
frontend.modules.shortcut.core.name_with_meta = (function frontend$modules$shortcut$core$name_with_meta(e){
var ctrl = e.ctrlKey;
var alt = e.altKey;
var meta = e.metaKey;
var shift = e.shiftKey;
var keyname = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.key_names,cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.keyCode));
var G__106009 = keyname;
var G__106009__$1 = (cljs.core.truth_(ctrl)?["ctrl+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106009)].join(''):G__106009);
var G__106009__$2 = (cljs.core.truth_(alt)?["alt+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106009__$1)].join(''):G__106009__$1);
var G__106009__$3 = (cljs.core.truth_(meta)?["meta+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106009__$2)].join(''):G__106009__$2);
if(cljs.core.truth_(shift)){
return ["shift+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106009__$3)].join('');
} else {
return G__106009__$3;
}
});
frontend.modules.shortcut.core.keyname = (function frontend$modules$shortcut$core$keyname(e){
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.key_names,cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.keyCode));
var G__106010 = name;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__106010)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ctrl",G__106010)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("shift",G__106010)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("alt",G__106010)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("esc",G__106010)){
return null;
} else {
return [" ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.modules.shortcut.core.name_with_meta(e))].join('');

}
}
}
}
}
});
frontend.modules.shortcut.core.persist_user_shortcut_BANG_ = (function frontend$modules$shortcut$core$persist_user_shortcut_BANG_(id,binding){
var global_QMARK_ = true;
var into_shortcuts = (function frontend$modules$shortcut$core$persist_user_shortcut_BANG__$_into_shortcuts(shortcuts){
var G__106012 = (function (){var or__5002__auto__ = shortcuts;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var G__106012__$1 = (((binding == null))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__106012,id):G__106012);
if(((global_QMARK_) && (((typeof binding === 'string') || (((cljs.core.vector_QMARK_(binding)) || (cljs.core.boolean_QMARK_(binding)))))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106012__$1,id,binding);
} else {
return G__106012__$1;
}
});
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"shortcuts","shortcuts",1717107810),into_shortcuts(new cljs.core.Keyword(null,"shortcuts","shortcuts",1717107810).cljs$core$IFn$_invoke$arity$1(frontend.state.get_graph_config.cljs$core$IFn$_invoke$arity$0())));

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.handler.global_config.set_global_config_kv_BANG_(new cljs.core.Keyword(null,"shortcuts","shortcuts",1717107810),into_shortcuts(new cljs.core.Keyword(null,"shortcuts","shortcuts",1717107810).cljs$core$IFn$_invoke$arity$1(frontend.state.get_global_config())));
} else {
return frontend.storage.set(new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504),into_shortcuts(frontend.storage.get(new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504))));
}
});

//# sourceMappingURL=frontend.modules.shortcut.core.js.map
