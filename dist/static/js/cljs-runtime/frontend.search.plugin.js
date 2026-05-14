goog.provide('frontend.search.plugin');
frontend.search.plugin.call_service_BANG_ = (function frontend$search$plugin$call_service_BANG_(var_args){
var G__102011 = arguments.length;
switch (G__102011) {
case 3:
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (service,event,payload){
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$4(service,event,payload,false);
}));

(frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (service,event,payload,reply_QMARK_){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(new cljs.core.Keyword(null,"pid","pid",1018387698).cljs$core$IFn$_invoke$arity$1(service));
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
var map__102012 = service;
var map__102012__$1 = cljs.core.__destructure_map(map__102012);
var pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102012__$1,new cljs.core.Keyword(null,"pid","pid",1018387698));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102012__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var hookEvent = ["service:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(event),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
pl.caller.call(hookEvent,cljs_bean.core.__GT_js(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph","graph",1558099509),frontend.state.get_current_repo()], null),payload], 0))));

if(cljs.core.truth_(reply_QMARK_)){
return pl.caller.once([hookEvent,":reply"].join(''),(function (e){
return frontend.state.update_plugin_search_engine(pid,name,(function (p1__102009_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__102009_SHARP_,new cljs.core.Keyword(null,"result","result",1415092211),cljs_bean.core.__GT_clj(e));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.search.plugin.call_service_BANG_.cljs$lang$maxFixedArity = 4);


/**
* @constructor
 * @implements {frontend.search.protocol.Engine}
*/
frontend.search.plugin.Plugin = (function (service,repo){
this.service = service;
this.repo = repo;
});
(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$query$arity$3 = (function (_this,q,opts){
var self__ = this;
var _this__$1 = this;
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$4(self__.service,"search:query",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"q","q",689001697),q], null),opts], 0)),true);
}));

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$rebuild_blocks_indice_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3(self__.service,"search:rebuildBlocksIndice",cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$rebuild_pages_indice_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3(self__.service,"search:rebuildPagesIndice",cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$transact_blocks_BANG_$arity$2 = (function (_this,data){
var self__ = this;
var _this__$1 = this;
var map__102013 = data;
var map__102013__$1 = cljs.core.__destructure_map(map__102013);
var blocks_to_remove_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102013__$1,new cljs.core.Keyword(null,"blocks-to-remove-set","blocks-to-remove-set",266406009));
var blocks_to_add = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102013__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792));
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3(self__.service,"search:transactBlocks",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"added","added",2057651688),blocks_to_add,new cljs.core.Keyword(null,"removed","removed",609626430),blocks_to_remove_set], null)], null));
}));

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$truncate_blocks_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3(self__.service,"search:truncateBlocks",cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.search.plugin.Plugin.prototype.frontend$search$protocol$Engine$remove_db_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.search.plugin.call_service_BANG_.cljs$core$IFn$_invoke$arity$3(self__.service,"search:removeDb",cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.search.plugin.Plugin.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"service","service",-322523032,null),new cljs.core.Symbol(null,"repo","repo",-358529152,null)], null);
}));

(frontend.search.plugin.Plugin.cljs$lang$type = true);

(frontend.search.plugin.Plugin.cljs$lang$ctorStr = "frontend.search.plugin/Plugin");

(frontend.search.plugin.Plugin.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.search.plugin/Plugin");
}));

/**
 * Positional factory function for frontend.search.plugin/Plugin.
 */
frontend.search.plugin.__GT_Plugin = (function frontend$search$plugin$__GT_Plugin(service,repo){
return (new frontend.search.plugin.Plugin(service,repo));
});


//# sourceMappingURL=frontend.search.plugin.js.map
