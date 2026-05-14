goog.provide('frontend.modules.shortcut.data_helper');
frontend.modules.shortcut.data_helper.flatten_bindings_by_id = (function frontend$modules$shortcut$data_helper$flatten_bindings_by_id(config,user_shortcuts,binding_only_QMARK_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__66855){
var vec__66856 = p__66855;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66856,(0),null);
var map__66859 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66856,(1),null);
var map__66859__$1 = cljs.core.__destructure_map(map__66859);
var opts = map__66859__$1;
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66859__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
return cljs.core.PersistentArrayMap.createAsIfByAssoc([id,(cljs.core.truth_(binding_only_QMARK_)?cljs.core.get.cljs$core$IFn$_invoke$arity$3(user_shortcuts,id,binding):cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"user-binding","user-binding",851596332),cljs.core.get.cljs$core$IFn$_invoke$arity$2(user_shortcuts,id),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"handler-id","handler-id",1160395333),(frontend.modules.shortcut.data_helper.get_group.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.shortcut.data_helper.get_group.cljs$core$IFn$_invoke$arity$1(id) : frontend.modules.shortcut.data_helper.get_group.call(null,id)),new cljs.core.Keyword(null,"id","id",-1388402092),id], 0)))]);
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.vals(config))));
});
frontend.modules.shortcut.data_helper.flatten_bindings_by_key = (function frontend$modules$shortcut$data_helper$flatten_bindings_by_key(config,user_shortcuts){
return cljs.core.reduce_kv((function (r,handler_id,vs){
return cljs.core.reduce_kv((function (r__$1,id,p__66860){
var map__66861 = p__66860;
var map__66861__$1 = cljs.core.__destructure_map(map__66861);
var binding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66861__$1,new cljs.core.Keyword(null,"binding","binding",539932593));
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(user_shortcuts,id,binding);
if(cljs.core.truth_(temp__5802__auto__)){
var ks = temp__5802__auto__;
var ks__$1 = ((cljs.core.sequential_QMARK_(ks))?ks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null));
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,k){
var k__$1 = frontend.modules.shortcut.utils.undecorate_binding(k);
var k_SINGLEQUOTE_ = frontend.modules.shortcut.utils.safe_parse_string_binding(k__$1);
var k_SINGLEQUOTE___$1 = cljs_bean.core.__GT_clj(k_SINGLEQUOTE_);
return cljs.core.assoc_in(cljs.core.assoc_in(a,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"key","key",-1516042587)], null),k__$1),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"refs","refs",-1560051448),id], null),handler_id);
}),r__$1,ks__$1);
} else {
return r__$1;
}
}),r,vs);
}),cljs.core.PersistentArrayMap.EMPTY,config);
});
frontend.modules.shortcut.data_helper.m_flatten_bindings_by_id = frontend.util.memoize_last(frontend.modules.shortcut.data_helper.flatten_bindings_by_id);
frontend.modules.shortcut.data_helper.m_flatten_bindings_by_key = frontend.util.memoize_last(frontend.modules.shortcut.data_helper.flatten_bindings_by_key);
frontend.modules.shortcut.data_helper.get_bindings = (function frontend$modules$shortcut$data_helper$get_bindings(){
return frontend.modules.shortcut.data_helper.m_flatten_bindings_by_id(cljs.core.deref(frontend.modules.shortcut.config._STAR_config),frontend.state.custom_shortcuts(),true);
});
frontend.modules.shortcut.data_helper.get_bindings_keys_map = (function frontend$modules$shortcut$data_helper$get_bindings_keys_map(){
return frontend.modules.shortcut.data_helper.m_flatten_bindings_by_key(cljs.core.deref(frontend.modules.shortcut.config._STAR_config),frontend.state.custom_shortcuts());
});
frontend.modules.shortcut.data_helper.get_bindings_ids_map = (function frontend$modules$shortcut$data_helper$get_bindings_ids_map(){
return frontend.modules.shortcut.data_helper.m_flatten_bindings_by_id(cljs.core.deref(frontend.modules.shortcut.config._STAR_config),frontend.state.custom_shortcuts(),false);
});
frontend.modules.shortcut.data_helper.get_shortcut_desc = (function frontend$modules$shortcut$data_helper$get_shortcut_desc(binding_map){
var map__66862 = binding_map;
var map__66862__$1 = cljs.core.__destructure_map(map__66862);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66862__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var desc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66862__$1,new cljs.core.Keyword(null,"desc","desc",2093485764));
var cmd = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66862__$1,new cljs.core.Keyword(null,"cmd","cmd",-302931143));
var desc__$1 = (function (){var or__5002__auto__ = desc;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"desc","desc",2093485764).cljs$core$IFn$_invoke$arity$1(cmd);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var G__66863 = id;
var G__66863__$1 = (((G__66863 == null))?null:frontend.modules.shortcut.utils.decorate_namespace(G__66863));
if((G__66863__$1 == null)){
return null;
} else {
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__66863__$1], 0));
}
}
}
})();
if((((desc__$1 == null)) || (((typeof desc__$1 === 'string') && (clojure.string.starts_with_QMARK_(desc__$1,"{Missing")))))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(id);
} else {
return desc__$1;
}
});
frontend.modules.shortcut.data_helper.mod_key = (function frontend$modules$shortcut$data_helper$mod_key(shortcut){
if(typeof shortcut === 'string'){
return clojure.string.replace(shortcut,/mod/i,(cljs.core.truth_(frontend.util.mac_QMARK_)?"meta":"ctrl"));
} else {
return null;
}
});
/**
 * override by user custom binding
 */
frontend.modules.shortcut.data_helper.shortcut_binding = (function frontend$modules$shortcut$data_helper$shortcut_binding(id){
var shortcut = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.data_helper.get_bindings(),id);
if((shortcut == null)){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.data-helper",new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","binding-not-found","shortcut/binding-not-found",-1239068733),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null),new cljs.core.Keyword(null,"line","line",212345235),82], null)),null);
} else {
if(shortcut === false){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.modules.shortcut.data-helper",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("shortcut","disabled","shortcut/disabled",-1351895776),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null),new cljs.core.Keyword(null,"line","line",212345235),86], null)),null);

return false;
} else {
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.data_helper.mod_key,((typeof shortcut === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [shortcut], null):shortcut));

}
}
});
frontend.modules.shortcut.data_helper.shortcut_item = (function frontend$modules$shortcut$data_helper$shortcut_item(id){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.data_helper.get_bindings_ids_map(),id);
});
frontend.modules.shortcut.data_helper.binding_by_category = (function frontend$modules$shortcut$data_helper$binding_by_category(name){
var dict = frontend.modules.shortcut.data_helper.get_bindings_ids_map();
var plugin_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,new cljs.core.Keyword("shortcut.category","plugins","shortcut.category/plugins",-1801186145));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (k){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(dict,k),new cljs.core.Keyword(null,"category","category",-593092832),name)], null);
}),((plugin_QMARK_)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__66864_SHARP_){
return clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__66864_SHARP_),":plugin.");
}),cljs.core.keys(dict)):frontend.modules.shortcut.config.get_category_shortcuts(name)));
});
frontend.modules.shortcut.data_helper.shortcuts_map_full = (function frontend$modules$shortcut$data_helper$shortcuts_map_full(){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.config._STAR_config)));
});
frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id = (function frontend$modules$shortcut$data_helper$shortcuts_map_by_handler_id(var_args){
var G__66866 = arguments.length;
switch (G__66866) {
case 1:
return frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$1 = (function (handler_id){
return frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2(handler_id,null);
}));

(frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$core$IFn$_invoke$arity$2 = (function (handler_id,state){
var raw = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.modules.shortcut.config._STAR_config),handler_id);
var raw_SINGLEQUOTE_ = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,raw);
var handler_m = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__66867){
var vec__66868 = p__66867;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66868,(0),null);
var map__66871 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66868,(1),null);
var map__66871__$1 = cljs.core.__destructure_map(map__66871);
var fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66871__$1,new cljs.core.Keyword(null,"fn","fn",-1175266204));
return cljs.core.PersistentArrayMap.createAsIfByAssoc([k,fn]);
}),raw));
var before = new cljs.core.Keyword(null,"before","before",-1633692388).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(raw));
var G__66872 = handler_m;
var G__66872__$1 = (cljs.core.truth_(state)?cljs.core.reduce_kv((function (r,k,handle_fn){
var handle_fn_SINGLEQUOTE_ = ((cljs.core.volatile_QMARK_(state))?(function() { 
var G__66903__delegate = function (_STAR_state,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(handle_fn,cljs.core.cons(cljs.core.deref(_STAR_state),args));
};
var G__66903 = function (_STAR_state,var_args){
var args = null;
if (arguments.length > 1) {
var G__66904__i = 0, G__66904__a = new Array(arguments.length -  1);
while (G__66904__i < G__66904__a.length) {G__66904__a[G__66904__i] = arguments[G__66904__i + 1]; ++G__66904__i;}
  args = new cljs.core.IndexedSeq(G__66904__a,0,null);
} 
return G__66903__delegate.call(this,_STAR_state,args);};
G__66903.cljs$lang$maxFixedArity = 1;
G__66903.cljs$lang$applyTo = (function (arglist__66905){
var _STAR_state = cljs.core.first(arglist__66905);
var args = cljs.core.rest(arglist__66905);
return G__66903__delegate(_STAR_state,args);
});
G__66903.cljs$core$IFn$_invoke$arity$variadic = G__66903__delegate;
return G__66903;
})()
:handle_fn);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(handle_fn_SINGLEQUOTE_,state));
}),cljs.core.PersistentArrayMap.EMPTY,G__66872):G__66872);
if(cljs.core.truth_(before)){
return cljs.core.reduce_kv((function (r,k,f){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,(function (){var G__66873 = f;
var G__66874 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(raw_SINGLEQUOTE_,k);
return (before.cljs$core$IFn$_invoke$arity$2 ? before.cljs$core$IFn$_invoke$arity$2(G__66873,G__66874) : before.call(null,G__66873,G__66874));
})());
}),cljs.core.PersistentArrayMap.EMPTY,G__66872__$1);
} else {
return G__66872__$1;
}
}));

(frontend.modules.shortcut.data_helper.shortcuts_map_by_handler_id.cljs$lang$maxFixedArity = 2);

frontend.modules.shortcut.data_helper.gen_shortcut_seq = (function frontend$modules$shortcut$data_helper$gen_shortcut_seq(id){
var bindings = frontend.modules.shortcut.data_helper.shortcut_binding(id);
if(bindings === false){
return cljs.core.PersistentVector.EMPTY;
} else {
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.last(bindings),/ |\+/);
}
});
frontend.modules.shortcut.data_helper.binding_for_display = (function frontend$modules$shortcut$data_helper$binding_for_display(k,binding){
var tmp = ((binding === false)?(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("editor","kill-line-after","editor/kill-line-after",-1948172258));
} else {
return and__5000__auto__;
}
})())?"ctrl k":(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("editor","beginning-of-block","editor/beginning-of-block",-1731001628));
} else {
return and__5000__auto__;
}
})())?"ctrl a":(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("editor","end-of-block","editor/end-of-block",87939440));
} else {
return and__5000__auto__;
}
})())?"ctrl e":(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.mac_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("editor","backward-kill-word","editor/backward-kill-word",2024635319));
} else {
return and__5000__auto__;
}
})())?"opt delete":frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("keymap","disabled","keymap/disabled",1622330055)], 0))
)))):((typeof binding === 'string')?frontend.modules.shortcut.utils.decorate_binding(binding):clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.utils.decorate_binding,binding))
));
return clojure.string.replace(tmp,"meta","cmd");
});
/**
 * Given shortcut key, return handler group
 *   eg: :editor/new-line -> :shortcut.handler/block-editing-only
 */
frontend.modules.shortcut.data_helper.get_group = (function frontend$modules$shortcut$data_helper$get_group(k){
return cljs.core.first(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.key,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__66875){
var vec__66876 = p__66875;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66876,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66876,(1),null);
return cljs.core.contains_QMARK_(v,k);
}),cljs.core.deref(frontend.modules.shortcut.config._STAR_config))));
});
frontend.modules.shortcut.data_helper.should_be_included_to_global_handler = (function frontend$modules$shortcut$data_helper$should_be_included_to_global_handler(from_handler_id){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("shortcut.handler","pdf","shortcut.handler/pdf",468089398),null], null), null),from_handler_id)){
return cljs.core.PersistentHashSet.createAsIfByAssoc([new cljs.core.Keyword("shortcut.handler","global-prevent-default","shortcut.handler/global-prevent-default",-1269226682),from_handler_id]);
} else {
return cljs.core.PersistentHashSet.createAsIfByAssoc([from_handler_id]);
}
});
frontend.modules.shortcut.data_helper.get_conflicts_by_keys = (function frontend$modules$shortcut$data_helper$get_conflicts_by_keys(var_args){
var G__66882 = arguments.length;
switch (G__66882) {
case 1:
return frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$1 = (function (ks){
return frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3(ks,new cljs.core.Keyword("shortcut.handler","global-prevent-default","shortcut.handler/global-prevent-default",-1269226682),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group-global?","group-global?",188550543),true], null));
}));

(frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$2 = (function (ks,handler_id){
return frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3(ks,handler_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group-global?","group-global?",188550543),true], null));
}));

(frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$core$IFn$_invoke$arity$3 = (function (ks,handler_id,p__66883){
var map__66884 = p__66883;
var map__66884__$1 = cljs.core.__destructure_map(map__66884);
var exclude_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66884__$1,new cljs.core.Keyword(null,"exclude-ids","exclude-ids",7408318));
var group_global_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66884__$1,new cljs.core.Keyword(null,"group-global?","group-global?",188550543));
var global_handlers = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("shortcut.handler","editor-global","shortcut.handler/editor-global",-799336480),null,new cljs.core.Keyword("shortcut.handler","global-prevent-default","shortcut.handler/global-prevent-default",-1269226682),null,new cljs.core.Keyword("shortcut.handler","global-non-editing-only","shortcut.handler/global-non-editing-only",-2118756985),null,new cljs.core.Keyword("shortcut.handler","misc","shortcut.handler/misc",525554741),null], null), null);
var ks_bindings = frontend.modules.shortcut.data_helper.get_bindings_keys_map();
var handler_ids = frontend.modules.shortcut.data_helper.should_be_included_to_global_handler(handler_id);
var global_QMARK_ = (cljs.core.truth_(group_global_QMARK_)?cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(global_handlers,handler_ids)):null);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__66880_SHARP_){
return cljs.core.empty_QMARK_(cljs.core.vals(cljs.core.second(p1__66880_SHARP_)));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (k){
var temp__5804__auto__ = frontend.modules.shortcut.utils.undecorate_binding(k);
if(cljs.core.truth_(temp__5804__auto__)){
var k_SINGLEQUOTE_ = temp__5804__auto__;
var k__$1 = frontend.modules.shortcut.utils.safe_parse_string_binding(k_SINGLEQUOTE_);
var k__$2 = cljs_bean.core.__GT_clj(k__$1);
var same_leading_key_QMARK_ = (function (p__66885){
var vec__66886 = p__66885;
var k_SINGLEQUOTE___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66886,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66886,(1),null);
if(cljs.core.sequential_QMARK_(k__$2)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k__$2,k_SINGLEQUOTE___$1)) || ((((cljs.core.count(k_SINGLEQUOTE___$1) > cljs.core.count(k__$2))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(k__$2),cljs.core.first(k_SINGLEQUOTE___$1))))));
} else {
return null;
}
});
var into_conflict_refs = (function (p__66889){
var vec__66890 = p__66889;
var k__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66890,(0),null);
var o = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66890,(1),null);
var temp__5804__auto____$1 = o;
if(cljs.core.truth_(temp__5804__auto____$1)){
var map__66893 = temp__5804__auto____$1;
var map__66893__$1 = cljs.core.__destructure_map(map__66893);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66893__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var refs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66893__$1,new cljs.core.Keyword(null,"refs","refs",-1560051448));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k__$3,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [key,cljs.core.reduce_kv((function (r,id,handler_id_SINGLEQUOTE_){
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(cljs.core.contains_QMARK_(exclude_ids,id)));
if(and__5000__auto__){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(handler_ids,cljs.core.PersistentHashSet.createAsIfByAssoc([handler_id_SINGLEQUOTE_]));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.set_QMARK_(handler_ids)) && (cljs.core.contains_QMARK_(handler_ids,handler_id_SINGLEQUOTE_)));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto____$1 = global_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.contains_QMARK_(global_handlers,handler_id_SINGLEQUOTE_);
} else {
return and__5000__auto____$1;
}
}
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,id,handler_id_SINGLEQUOTE_);
} else {
return r;
}
}),cljs.core.PersistentArrayMap.EMPTY,refs)], null)], null);
} else {
return null;
}
});
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__66879_SHARP_){
return cljs.core.empty_QMARK_(cljs.core.second(cljs.core.second(p1__66879_SHARP_)));
}),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(into_conflict_refs,cljs.core.filterv(same_leading_key_QMARK_,ks_bindings))))], null);
} else {
return null;
}
}),((typeof ks === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null):ks))));
}));

(frontend.modules.shortcut.data_helper.get_conflicts_by_keys.cljs$lang$maxFixedArity = 3);

frontend.modules.shortcut.data_helper.parse_conflicts_from_binding = (function frontend$modules$shortcut$data_helper$parse_conflicts_from_binding(from_binding,target){
var temp__5804__auto__ = ((typeof target === 'string') && (((cljs.core.sequential_QMARK_(from_binding)) && (cljs.core.seq(from_binding)))));
if(temp__5804__auto__){
var from_binding__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__66895 = target;
var G__66895__$1 = (((G__66895 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__66895));
var G__66895__$2 = (((G__66895__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__66895__$1));
if((G__66895__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__66895__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var target__$1 = temp__5804__auto____$1;
return cljs.core.filterv((function (p1__66894_SHARP_){
var temp__5804__auto____$2 = (function (){var G__66896 = p1__66894_SHARP_;
var G__66896__$1 = (((G__66896 == null))?null:frontend.modules.shortcut.data_helper.mod_key(G__66896));
var G__66896__$2 = (((G__66896__$1 == null))?null:frontend.modules.shortcut.utils.safe_parse_string_binding(G__66896__$1));
if((G__66896__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__66896__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var from = temp__5804__auto____$2;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(from,target__$1)) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(from),(1))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(target__$1),(1))))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(target__$1),cljs.core.first(from))))));
} else {
return null;
}
}),from_binding__$1);
} else {
return null;
}
} else {
return null;
}
});
frontend.modules.shortcut.data_helper.shortcut_data_by_id = (function frontend$modules$shortcut$data_helper$shortcut_data_by_id(id){
var binding = frontend.modules.shortcut.data_helper.shortcut_binding(id);
var data = (function (){var G__66897 = frontend.modules.shortcut.data_helper.shortcuts_map_full();
return (id.cljs$core$IFn$_invoke$arity$1 ? id.cljs$core$IFn$_invoke$arity$1(G__66897) : id.call(null,G__66897));
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data,new cljs.core.Keyword(null,"binding","binding",539932593),frontend.modules.shortcut.data_helper.binding_for_display(id,binding));
});
frontend.modules.shortcut.data_helper.shortcuts__GT_commands = (function frontend$modules$shortcut$data_helper$shortcuts__GT_commands(handler_id){
var m = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.modules.shortcut.config._STAR_config),handler_id);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__66898){
var vec__66899 = p__66898;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66899,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66899,(1),null);
return clojure.set.rename_keys(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(frontend.modules.shortcut.data_helper.shortcut_data_by_id(id),new cljs.core.Keyword(null,"id","id",-1388402092),id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"handler-id","handler-id",1160395333),handler_id], 0)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"binding","binding",539932593),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"action","action",-811238024)], null));
}),m);
});

//# sourceMappingURL=frontend.modules.shortcut.data_helper.js.map
