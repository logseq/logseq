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
var seq__66907_66997 = cljs.core.seq(cljs.core.deref(frontend.modules.shortcut.core._STAR_pending_shortcuts));
var chunk__66908_66998 = null;
var count__66909_66999 = (0);
var i__66910_67000 = (0);
while(true){
if((i__66910_67000 < count__66909_66999)){
var vec__66917_67001 = chunk__66908_66998.cljs$core$IIndexed$_nth$arity$2(null,i__66910_67000);
var handler_id_67002 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66917_67001,(0),null);
var id_67003 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66917_67001,(1),null);
var shortcut_67004 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66917_67001,(2),null);
(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id_67002,id_67003,shortcut_67004) : frontend.modules.shortcut.core.register_shortcut_BANG_.call(null,handler_id_67002,id_67003,shortcut_67004));


var G__67005 = seq__66907_66997;
var G__67006 = chunk__66908_66998;
var G__67007 = count__66909_66999;
var G__67008 = (i__66910_67000 + (1));
seq__66907_66997 = G__67005;
chunk__66908_66998 = G__67006;
count__66909_66999 = G__67007;
i__66910_67000 = G__67008;
continue;
} else {
var temp__5804__auto___67009 = cljs.core.seq(seq__66907_66997);
if(temp__5804__auto___67009){
var seq__66907_67010__$1 = temp__5804__auto___67009;
if(cljs.core.chunked_seq_QMARK_(seq__66907_67010__$1)){
var c__5525__auto___67011 = cljs.core.chunk_first(seq__66907_67010__$1);
var G__67012 = cljs.core.chunk_rest(seq__66907_67010__$1);
var G__67013 = c__5525__auto___67011;
var G__67014 = cljs.core.count(c__5525__auto___67011);
var G__67015 = (0);
seq__66907_66997 = G__67012;
chunk__66908_66998 = G__67013;
count__66909_66999 = G__67014;
i__66910_67000 = G__67015;
continue;
} else {
var vec__66920_67016 = cljs.core.first(seq__66907_67010__$1);
var handler_id_67017 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66920_67016,(0),null);
var id_67018 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66920_67016,(1),null);
var shortcut_67019 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66920_67016,(2),null);
(frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(handler_id_67017,id_67018,shortcut_67019) : frontend.modules.shortcut.core.register_shortcut_BANG_.call(null,handler_id_67017,id_67018,shortcut_67019));


var G__67020 = cljs.core.next(seq__66907_67010__$1);
var G__67021 = null;
var G__67022 = (0);
var G__67023 = (0);
seq__66907_66997 = G__67020;
chunk__66908_66998 = G__67021;
count__66909_66999 = G__67022;
i__66910_67000 = G__67023;
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
return new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__66923_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(p1__66923_SHARP_),handler_id);
}),cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)))));
});
frontend.modules.shortcut.core.get_installed_ids_by_handler_id = (function frontend$modules$shortcut$core$get_installed_ids_by_handler_id(handler_id){
var G__66925 = cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers);
var G__66925__$1 = (((G__66925 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__66924_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__66924_SHARP_)),handler_id);
}),G__66925));
var G__66925__$2 = (((G__66925__$1 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,G__66925__$1));
var G__66925__$3 = (((G__66925__$2 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__66925__$2));
if((G__66925__$3 == null)){
return null;
} else {
return cljs.core.vec(G__66925__$3);
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
var G__66927 = arguments.length;
switch (G__66927) {
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
var seq__66928 = cljs.core.seq(frontend.modules.shortcut.data_helper.shortcut_binding(id));
var chunk__66929 = null;
var count__66930 = (0);
var i__66931 = (0);
while(true){
if((i__66931 < count__66930)){
var k = chunk__66929.cljs$core$IIndexed$_nth$arity$2(null,i__66931);
try{lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k], null),new cljs.core.Keyword(null,"line","line",212345235),80], null)),null);

handler.registerShortcut(frontend.util.keyname(id),frontend.modules.shortcut.utils.undecorate_binding(k));
}catch (e66934){var e_67025 = e66934;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k,new cljs.core.Keyword(null,"error","error",-978969032),e_67025], null),new cljs.core.Keyword(null,"line","line",212345235),83], null)),null);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,k,e_67025.message], null)),new cljs.core.Keyword(null,"error","error",-978969032),false);
}

var G__67026 = seq__66928;
var G__67027 = chunk__66929;
var G__67028 = count__66930;
var G__67029 = (i__66931 + (1));
seq__66928 = G__67026;
chunk__66929 = G__67027;
count__66930 = G__67028;
i__66931 = G__67029;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__66928);
if(temp__5804__auto____$1){
var seq__66928__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__66928__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__66928__$1);
var G__67030 = cljs.core.chunk_rest(seq__66928__$1);
var G__67031 = c__5525__auto__;
var G__67032 = cljs.core.count(c__5525__auto__);
var G__67033 = (0);
seq__66928 = G__67030;
chunk__66929 = G__67031;
count__66930 = G__67032;
i__66931 = G__67033;
continue;
} else {
var k = cljs.core.first(seq__66928__$1);
try{lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k], null),new cljs.core.Keyword(null,"line","line",212345235),80], null)),null);

handler.registerShortcut(frontend.util.keyname(id),frontend.modules.shortcut.utils.undecorate_binding(k));
}catch (e66935){var e_67034 = e66935;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.core",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"binding","binding",539932593),k,new cljs.core.Keyword(null,"error","error",-978969032),e_67034], null),new cljs.core.Keyword(null,"line","line",212345235),83], null)),null);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,k,e_67034.message], null)),new cljs.core.Keyword(null,"error","error",-978969032),false);
}

var G__67035 = cljs.core.next(seq__66928__$1);
var G__67036 = null;
var G__67037 = (0);
var G__67038 = (0);
seq__66928 = G__67035;
chunk__66929 = G__67036;
count__66930 = G__67037;
i__66931 = G__67038;
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
var temp__5804__auto___67039 = frontend.modules.shortcut.core.get_handler_by_id(handler_id);
if(cljs.core.truth_(temp__5804__auto___67039)){
var handler_67040 = temp__5804__auto___67039;
var temp__5804__auto___67041__$1 = frontend.modules.shortcut.data_helper.shortcut_binding(shortcut_id);
if(cljs.core.truth_(temp__5804__auto___67041__$1)){
var ks_67042 = temp__5804__auto___67041__$1;
var seq__66936_67043 = cljs.core.seq(ks_67042);
var chunk__66937_67044 = null;
var count__66938_67045 = (0);
var i__66939_67046 = (0);
while(true){
if((i__66939_67046 < count__66938_67045)){
var k_67047 = chunk__66937_67044.cljs$core$IIndexed$_nth$arity$2(null,i__66939_67046);
handler_67040.unregisterShortcut(frontend.modules.shortcut.utils.undecorate_binding(k_67047));


var G__67048 = seq__66936_67043;
var G__67049 = chunk__66937_67044;
var G__67050 = count__66938_67045;
var G__67051 = (i__66939_67046 + (1));
seq__66936_67043 = G__67048;
chunk__66937_67044 = G__67049;
count__66938_67045 = G__67050;
i__66939_67046 = G__67051;
continue;
} else {
var temp__5804__auto___67052__$2 = cljs.core.seq(seq__66936_67043);
if(temp__5804__auto___67052__$2){
var seq__66936_67053__$1 = temp__5804__auto___67052__$2;
if(cljs.core.chunked_seq_QMARK_(seq__66936_67053__$1)){
var c__5525__auto___67054 = cljs.core.chunk_first(seq__66936_67053__$1);
var G__67055 = cljs.core.chunk_rest(seq__66936_67053__$1);
var G__67056 = c__5525__auto___67054;
var G__67057 = cljs.core.count(c__5525__auto___67054);
var G__67058 = (0);
seq__66936_67043 = G__67055;
chunk__66937_67044 = G__67056;
count__66938_67045 = G__67057;
i__66939_67046 = G__67058;
continue;
} else {
var k_67059 = cljs.core.first(seq__66936_67053__$1);
handler_67040.unregisterShortcut(frontend.modules.shortcut.utils.undecorate_binding(k_67059));


var G__67060 = cljs.core.next(seq__66936_67053__$1);
var G__67061 = null;
var G__67062 = (0);
var G__67063 = (0);
seq__66936_67043 = G__67060;
chunk__66937_67044 = G__67061;
count__66938_67045 = G__67062;
i__66939_67046 = G__67063;
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
var G__66941 = arguments.length;
switch (G__66941) {
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

frontend.modules.shortcut.core.install_shortcut_handler_BANG_ = (function frontend$modules$shortcut$core$install_shortcut_handler_BANG_(handler_id,p__66943){
var map__66944 = p__66943;
var map__66944__$1 = cljs.core.__destructure_map(map__66944);
var set_global_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__66944__$1,new cljs.core.Keyword(null,"set-global-keys?","set-global-keys?",-497167260),true);
var prevent_default_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__66944__$1,new cljs.core.Keyword(null,"prevent-default?","prevent-default?",-1165567888),false);
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66944__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var G__66945_67065 = frontend.modules.shortcut.core.get_installed_ids_by_handler_id(handler_id);
var G__66945_67066__$1 = (((G__66945_67065 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__66942_SHARP_){
return frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$2(p1__66942_SHARP_,true);
}),G__66945_67065));
if((G__66945_67066__$1 == null)){
} else {
cljs.core.doall.cljs$core$IFn$_invoke$arity$1(G__66945_67066__$1);
}

var shortcut_map = frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2(handler_id,state);
var handler = (new goog.ui.KeyboardShortcutHandler(window));
if(cljs.core.truth_(set_global_keys_QMARK_)){
handler.setGlobalKeys(frontend.modules.shortcut.core.global_keys);
} else {
}

handler.setAlwaysPreventDefault(prevent_default_QMARK_);

var seq__66946_67067 = cljs.core.seq(shortcut_map);
var chunk__66947_67068 = null;
var count__66948_67069 = (0);
var i__66949_67070 = (0);
while(true){
if((i__66949_67070 < count__66948_67069)){
var vec__66956_67071 = chunk__66947_67068.cljs$core$IIndexed$_nth$arity$2(null,i__66949_67070);
var id_67072 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66956_67071,(0),null);
var __67073 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66956_67071,(1),null);
frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2(handler,id_67072);


var G__67074 = seq__66946_67067;
var G__67075 = chunk__66947_67068;
var G__67076 = count__66948_67069;
var G__67077 = (i__66949_67070 + (1));
seq__66946_67067 = G__67074;
chunk__66947_67068 = G__67075;
count__66948_67069 = G__67076;
i__66949_67070 = G__67077;
continue;
} else {
var temp__5804__auto___67078 = cljs.core.seq(seq__66946_67067);
if(temp__5804__auto___67078){
var seq__66946_67079__$1 = temp__5804__auto___67078;
if(cljs.core.chunked_seq_QMARK_(seq__66946_67079__$1)){
var c__5525__auto___67080 = cljs.core.chunk_first(seq__66946_67079__$1);
var G__67081 = cljs.core.chunk_rest(seq__66946_67079__$1);
var G__67082 = c__5525__auto___67080;
var G__67083 = cljs.core.count(c__5525__auto___67080);
var G__67084 = (0);
seq__66946_67067 = G__67081;
chunk__66947_67068 = G__67082;
count__66948_67069 = G__67083;
i__66949_67070 = G__67084;
continue;
} else {
var vec__66959_67085 = cljs.core.first(seq__66946_67079__$1);
var id_67086 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66959_67085,(0),null);
var __67087 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66959_67085,(1),null);
frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$2(handler,id_67086);


var G__67088 = cljs.core.next(seq__66946_67079__$1);
var G__67089 = null;
var G__67090 = (0);
var G__67091 = (0);
seq__66946_67067 = G__67088;
chunk__66947_67068 = G__67089;
count__66948_67069 = G__67090;
i__66949_67070 = G__67091;
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
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__66962_SHARP_){
return frontend.modules.shortcut.core.install_shortcut_handler_BANG_(p1__66962_SHARP_,cljs.core.PersistentArrayMap.EMPTY);
}),(function (){var or__5002__auto__ = cljs.core.seq(handler_ids);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741),new cljs.core.Keyword("shortcut.handler","editor-global","shortcut.handler/editor-global",-799336480),new cljs.core.Keyword("shortcut.handler","global-non-editing-only","shortcut.handler/global-non-editing-only",-2118756985),new cljs.core.Keyword("shortcut.handler","global-prevent-default","shortcut.handler/global-prevent-default",-1269226682),new cljs.core.Keyword("shortcut.handler","block-editing-only","shortcut.handler/block-editing-only",794342449)], null);
}
})()));
});
frontend.modules.shortcut.core.mixin = (function frontend$modules$shortcut$core$mixin(var_args){
var G__66964 = arguments.length;
switch (G__66964) {
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
var G__66965 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var install_id = frontend.modules.shortcut.core.install_shortcut_handler_BANG_(handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"state","state",-1988618099),state], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293),install_id);
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___67093 = new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___67093)){
var install_id_67094 = temp__5804__auto___67093;
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(install_id_67094);
} else {
}

return state;
})], null);
if(cljs.core.truth_(remount_reinstall_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__66965,new cljs.core.Keyword(null,"will-remount","will-remount",-141604325),(function (old_state,new_state){
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = "[shortcuts] reinstalled:";
console.time(k__50701__auto__);

var res__50702__auto__ = (function (){
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
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
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
return G__66965;
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
var temp__5804__auto___67095 = new cljs.core.Keyword("frontend.modules.shortcut.core","*state","frontend.modules.shortcut.core/*state",262386927).cljs$core$IFn$_invoke$arity$1(old_state);
if(cljs.core.truth_(temp__5804__auto___67095)){
var _STAR_state_67096 = temp__5804__auto___67095;
cljs.core.vreset_BANG_(_STAR_state_67096,new_state);
} else {
}

return new_state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var temp__5804__auto___67097 = new cljs.core.Keyword("frontend.modules.shortcut.core","install-id","frontend.modules.shortcut.core/install-id",-1116337293).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___67097)){
var install_id_67098 = temp__5804__auto___67097;
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(install_id_67098);

var G__66966_67099 = new cljs.core.Keyword("frontend.modules.shortcut.core","*state","frontend.modules.shortcut.core/*state",262386927).cljs$core$IFn$_invoke$arity$1(state);
if((G__66966_67099 == null)){
} else {
cljs.core.vreset_BANG_(G__66966_67099,null);
}
} else {
}

return state;
})], null);
});
frontend.modules.shortcut.core.unlisten_all_BANG_ = (function frontend$modules$shortcut$core$unlisten_all_BANG_(var_args){
var G__66968 = arguments.length;
switch (G__66968) {
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
var seq__66969 = cljs.core.seq(cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)));
var chunk__66971 = null;
var count__66972 = (0);
var i__66973 = (0);
while(true){
if((i__66973 < count__66972)){
var map__66977 = chunk__66971.cljs$core$IIndexed$_nth$arity$2(null,i__66973);
var map__66977__$1 = cljs.core.__destructure_map(map__66977);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66977__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66977__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66977__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(dispose_QMARK_)){
handler.dispose();
} else {
goog.events.unlisten(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__67101 = seq__66969;
var G__67102 = chunk__66971;
var G__67103 = count__66972;
var G__67104 = (i__66973 + (1));
seq__66969 = G__67101;
chunk__66971 = G__67102;
count__66972 = G__67103;
i__66973 = G__67104;
continue;
} else {
var G__67105 = seq__66969;
var G__67106 = chunk__66971;
var G__67107 = count__66972;
var G__67108 = (i__66973 + (1));
seq__66969 = G__67105;
chunk__66971 = G__67106;
count__66972 = G__67107;
i__66973 = G__67108;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__66969);
if(temp__5804__auto__){
var seq__66969__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__66969__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__66969__$1);
var G__67109 = cljs.core.chunk_rest(seq__66969__$1);
var G__67110 = c__5525__auto__;
var G__67111 = cljs.core.count(c__5525__auto__);
var G__67112 = (0);
seq__66969 = G__67109;
chunk__66971 = G__67110;
count__66972 = G__67111;
i__66973 = G__67112;
continue;
} else {
var map__66978 = cljs.core.first(seq__66969__$1);
var map__66978__$1 = cljs.core.__destructure_map(map__66978);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66978__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66978__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66978__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(dispose_QMARK_)){
handler.dispose();
} else {
goog.events.unlisten(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__67113 = cljs.core.next(seq__66969__$1);
var G__67114 = null;
var G__67115 = (0);
var G__67116 = (0);
seq__66969 = G__67113;
chunk__66971 = G__67114;
count__66972 = G__67115;
i__66973 = G__67116;
continue;
} else {
var G__67117 = cljs.core.next(seq__66969__$1);
var G__67118 = null;
var G__67119 = (0);
var G__67120 = (0);
seq__66969 = G__67117;
chunk__66971 = G__67118;
count__66972 = G__67119;
i__66973 = G__67120;
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
var seq__66979 = cljs.core.seq(cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers)));
var chunk__66981 = null;
var count__66982 = (0);
var i__66983 = (0);
while(true){
if((i__66983 < count__66982)){
var map__66987 = chunk__66981.cljs$core$IIndexed$_nth$arity$2(null,i__66983);
var map__66987__$1 = cljs.core.__destructure_map(map__66987);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66987__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66987__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66987__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(handler.isDisposed())){
frontend.modules.shortcut.core.install_shortcut_handler_BANG_(group,cljs.core.PersistentArrayMap.EMPTY);
} else {
goog.events.listen(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__67121 = seq__66979;
var G__67122 = chunk__66981;
var G__67123 = count__66982;
var G__67124 = (i__66983 + (1));
seq__66979 = G__67121;
chunk__66981 = G__67122;
count__66982 = G__67123;
i__66983 = G__67124;
continue;
} else {
var G__67125 = seq__66979;
var G__67126 = chunk__66981;
var G__67127 = count__66982;
var G__67128 = (i__66983 + (1));
seq__66979 = G__67125;
chunk__66981 = G__67126;
count__66982 = G__67127;
i__66983 = G__67128;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__66979);
if(temp__5804__auto__){
var seq__66979__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__66979__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__66979__$1);
var G__67129 = cljs.core.chunk_rest(seq__66979__$1);
var G__67130 = c__5525__auto__;
var G__67131 = cljs.core.count(c__5525__auto__);
var G__67132 = (0);
seq__66979 = G__67129;
chunk__66981 = G__67130;
count__66982 = G__67131;
i__66983 = G__67132;
continue;
} else {
var map__66988 = cljs.core.first(seq__66979__$1);
var map__66988__$1 = cljs.core.__destructure_map(map__66988);
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66988__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var group = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66988__$1,new cljs.core.Keyword(null,"group","group",582596132));
var dispatch_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66988__$1,new cljs.core.Keyword(null,"dispatch-fn","dispatch-fn",1253347614));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741))){
if(cljs.core.truth_(handler.isDisposed())){
frontend.modules.shortcut.core.install_shortcut_handler_BANG_(group,cljs.core.PersistentArrayMap.EMPTY);
} else {
goog.events.listen(handler,goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,dispatch_fn);
}


var G__67133 = cljs.core.next(seq__66979__$1);
var G__67134 = null;
var G__67135 = (0);
var G__67136 = (0);
seq__66979 = G__67133;
chunk__66981 = G__67134;
count__66982 = G__67135;
i__66983 = G__67136;
continue;
} else {
var G__67137 = cljs.core.next(seq__66979__$1);
var G__67138 = null;
var G__67139 = (0);
var G__67140 = (0);
seq__66979 = G__67137;
chunk__66981 = G__67138;
count__66982 = G__67139;
i__66983 = G__67140;
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

var ids_67141 = cljs.core.keys(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers));
var _handler_ids_67142 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"group","group",582596132),cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.core._STAR_installed_handlers))));
var seq__66989_67143 = cljs.core.seq(ids_67141);
var chunk__66990_67144 = null;
var count__66991_67145 = (0);
var i__66992_67146 = (0);
while(true){
if((i__66992_67146 < count__66991_67145)){
var id_67147 = chunk__66990_67144.cljs$core$IIndexed$_nth$arity$2(null,i__66992_67146);
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(id_67147);


var G__67148 = seq__66989_67143;
var G__67149 = chunk__66990_67144;
var G__67150 = count__66991_67145;
var G__67151 = (i__66992_67146 + (1));
seq__66989_67143 = G__67148;
chunk__66990_67144 = G__67149;
count__66991_67145 = G__67150;
i__66992_67146 = G__67151;
continue;
} else {
var temp__5804__auto___67152 = cljs.core.seq(seq__66989_67143);
if(temp__5804__auto___67152){
var seq__66989_67153__$1 = temp__5804__auto___67152;
if(cljs.core.chunked_seq_QMARK_(seq__66989_67153__$1)){
var c__5525__auto___67154 = cljs.core.chunk_first(seq__66989_67153__$1);
var G__67155 = cljs.core.chunk_rest(seq__66989_67153__$1);
var G__67156 = c__5525__auto___67154;
var G__67157 = cljs.core.count(c__5525__auto___67154);
var G__67158 = (0);
seq__66989_67143 = G__67155;
chunk__66990_67144 = G__67156;
count__66991_67145 = G__67157;
i__66992_67146 = G__67158;
continue;
} else {
var id_67159 = cljs.core.first(seq__66989_67153__$1);
frontend.modules.shortcut.core.uninstall_shortcut_handler_BANG_.cljs$core$IFn$_invoke$arity$1(id_67159);


var G__67160 = cljs.core.next(seq__66989_67153__$1);
var G__67161 = null;
var G__67162 = (0);
var G__67163 = (0);
seq__66989_67143 = G__67160;
chunk__66990_67144 = G__67161;
count__66991_67145 = G__67162;
i__66992_67146 = G__67163;
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
var G__66993 = keyname;
var G__66993__$1 = (cljs.core.truth_(ctrl)?["ctrl+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__66993)].join(''):G__66993);
var G__66993__$2 = (cljs.core.truth_(alt)?["alt+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__66993__$1)].join(''):G__66993__$1);
var G__66993__$3 = (cljs.core.truth_(meta)?["meta+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__66993__$2)].join(''):G__66993__$2);
if(cljs.core.truth_(shift)){
return ["shift+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__66993__$3)].join('');
} else {
return G__66993__$3;
}
});
frontend.modules.shortcut.core.keyname = (function frontend$modules$shortcut$core$keyname(e){
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.core.key_names,cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.keyCode));
var G__66994 = name;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__66994)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ctrl",G__66994)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("shift",G__66994)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("alt",G__66994)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("esc",G__66994)){
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
var G__66996 = (function (){var or__5002__auto__ = shortcuts;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var G__66996__$1 = (((binding == null))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__66996,id):G__66996);
if(((global_QMARK_) && (((typeof binding === 'string') || (((cljs.core.vector_QMARK_(binding)) || (cljs.core.boolean_QMARK_(binding)))))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__66996__$1,id,binding);
} else {
return G__66996__$1;
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
