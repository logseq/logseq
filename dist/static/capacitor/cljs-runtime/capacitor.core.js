goog.provide('capacitor.core');
var module$node_modules$react_dom$client=shadow.js.require("module$node_modules$react_dom$client", {});
if((typeof capacitor !== 'undefined') && (typeof capacitor.core !== 'undefined') && (typeof capacitor.core.root !== 'undefined')){
} else {
capacitor.core.root = module$node_modules$react_dom$client.createRoot(document.getElementById("root"));
}
capacitor.core.render_BANG_ = (function capacitor$core$render_BANG_(){
return capacitor.core.root.render(capacitor.components.app.main());
});
goog.exportSymbol('capacitor.core.render_BANG_', capacitor.core.render_BANG_);
capacitor.core.routes = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["/page/:name",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"view","view",1247994814),(function (route_match){
return frontend.components.page.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(route_match,new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),true));
})], null)], null)], null);
capacitor.core.set_router_BANG_ = (function capacitor$core$set_router_BANG_(){
window.addEventListener("popstate",frontend.handler.route.restore_scroll_pos);

return reitit.frontend.easy.start_BANG_(reitit.frontend.router.cljs$core$IFn$_invoke$arity$2(capacitor.core.routes,null),(function (route){
frontend.handler.route.set_route_match_BANG_(route);

var G__93936 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var G__93936__$1 = (((G__93936 instanceof cljs.core.Keyword))?G__93936.fqn:null);
switch (G__93936__$1) {
case "page":
var id_str = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null));
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(id_str) : frontend.util.uuid_string_QMARK_.call(null,id_str)))){
var page_uuid = cljs.core.uuid(id_str);
return capacitor.state.set_modal_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open?","open?",1238443125),true,new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null)], null));
} else {
return null;
}

break;
case "user-login":
return null;

break;
default:
return null;

}
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"use-fragment","use-fragment",-1617737154),true], null));
});
capacitor.core.init = (function capacitor$core$init(){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[capacitor-new] init!"], 0));

capacitor.core.set_router_BANG_();

frontend.mobile.core.init_BANG_();

return frontend.handler.start_BANG_(capacitor.core.render_BANG_);
});
goog.exportSymbol('capacitor.core.init', capacitor.core.init);
capacitor.core.stop_BANG_ = (function capacitor$core$stop_BANG_(){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[capacitor-new] stop!"], 0));
});
goog.exportSymbol('capacitor.core.stop_BANG_', capacitor.core.stop_BANG_);

//# sourceMappingURL=capacitor.core.js.map
