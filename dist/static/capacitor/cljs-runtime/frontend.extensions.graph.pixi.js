goog.provide('frontend.extensions.graph.pixi');
goog.scope(function(){
  frontend.extensions.graph.pixi.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$d3_force$src$index=shadow.js.require("module$node_modules$d3_force$src$index", {});
var module$node_modules$graphology$dist$graphology_umd_min=shadow.js.require("module$node_modules$graphology$dist$graphology_umd_min", {});
var module$node_modules$pixi_graph_fork$dist$pixi_graph_cjs=shadow.js.require("module$node_modules$pixi_graph_fork$dist$pixi_graph_cjs", {});
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.graph !== 'undefined') && (typeof frontend.extensions.graph.pixi !== 'undefined') && (typeof frontend.extensions.graph.pixi._STAR_graph_instance !== 'undefined')){
} else {
frontend.extensions.graph.pixi._STAR_graph_instance = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.graph !== 'undefined') && (typeof frontend.extensions.graph.pixi !== 'undefined') && (typeof frontend.extensions.graph.pixi._STAR_simulation !== 'undefined')){
} else {
frontend.extensions.graph.pixi._STAR_simulation = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.graph !== 'undefined') && (typeof frontend.extensions.graph.pixi !== 'undefined') && (typeof frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_ !== 'undefined')){
} else {
frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.extensions.graph.pixi.Graph = frontend.extensions.graph.pixi.goog$module$goog$object.get(module$node_modules$graphology$dist$graphology_umd_min,"Graph");
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.graph !== 'undefined') && (typeof frontend.extensions.graph.pixi !== 'undefined') && (typeof frontend.extensions.graph.pixi.colors !== 'undefined')){
} else {
frontend.extensions.graph.pixi.colors = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"], null);
}
frontend.extensions.graph.pixi.default_style = (function frontend$extensions$graph$pixi$default_style(dark_QMARK_){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),(function (node){
var or__5002__auto__ = node.size;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (8);
}
}),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),(0)], null),new cljs.core.Keyword(null,"color","color",1011675173),(function (node){
var temp__5802__auto__ = frontend.extensions.graph.pixi.goog$module$goog$object.get(node,"parent");
if(cljs.core.truth_(temp__5802__auto__)){
var parent = temp__5802__auto__;
var temp__5804__auto__ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(parent,"ls-selected-nodes"))?parent:node.id);
if(cljs.core.truth_(temp__5804__auto__)){
var parent__$1 = temp__5804__auto__;
var v = Math.abs(cljs.core.hash(parent__$1));
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(frontend.extensions.graph.pixi.colors,cljs.core.mod(v,cljs.core.count(frontend.extensions.graph.pixi.colors)));
} else {
return null;
}
} else {
return node.color;
}
}),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"content","content",15833224),(function (node){
return node.label;
}),new cljs.core.Keyword(null,"type","type",1174270348),module$node_modules$pixi_graph_fork$dist$pixi_graph_cjs.TextType.TEXT,new cljs.core.Keyword(null,"fontSize","fontSize",919623033),(12),new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(dark_QMARK_)?"rgba(255, 255, 255, 0.8)":"rgba(0, 0, 0, 0.8)"),new cljs.core.Keyword(null,"padding","padding",1660304693),(4)], null)], null),new cljs.core.Keyword(null,"edge","edge",919909153),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),(1),new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(dark_QMARK_)?(function (){var or__5002__auto__ = frontend.colors.get_accent_color();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "#094b5a";
}
})():"#cccccc")], null)], null);
});
frontend.extensions.graph.pixi.default_hover_style = (function frontend$extensions$graph$pixi$default_hover_style(_dark_QMARK_){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = frontend.colors.get_accent_color();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "#6366F1";
}
})(),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"backgroundColor","backgroundColor",1738438491),"rgba(238, 238, 238, 1)",new cljs.core.Keyword(null,"color","color",1011675173),"#333333"], null)], null),new cljs.core.Keyword(null,"edge","edge",919909153),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"#A5B4FC"], null)], null);
});
/**
 * Node forces documentation can be read in more detail here https://d3js.org/d3-force
 */
frontend.extensions.graph.pixi.layout_BANG_ = (function frontend$extensions$graph$pixi$layout_BANG_(nodes,links,link_dist,charge_strength,charge_range){
var simulation = module$node_modules$d3_force$src$index.forceSimulation(nodes);
simulation.force("link",module$node_modules$d3_force$src$index.forceLink().id((function (d){
return d.id;
})).distance(link_dist).links(links)).force("charge",module$node_modules$d3_force$src$index.forceManyBody().distanceMin((1)).distanceMax(charge_range).theta(0.5).strength(charge_strength)).force("collision",module$node_modules$d3_force$src$index.forceCollide().radius(((8) + (18))).iterations((2))).force("x",module$node_modules$d3_force$src$index.forceX((0)).strength(0.02)).force("y",module$node_modules$d3_force$src$index.forceY((0)).strength(0.02)).force("center",module$node_modules$d3_force$src$index.forceCenter()).velocityDecay(0.5);

cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation,simulation);

return simulation;
});
frontend.extensions.graph.pixi.clear_nodes_BANG_ = (function frontend$extensions$graph$pixi$clear_nodes_BANG_(graph){
return graph.forEachNode((function (node){
return graph.dropNode(node);
}));
});
frontend.extensions.graph.pixi.destroy_instance_BANG_ = (function frontend$extensions$graph$pixi$destroy_instance_BANG_(){
var temp__5804__auto___88272 = new cljs.core.Keyword(null,"pixi","pixi",808009198).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.extensions.graph.pixi._STAR_graph_instance));
if(cljs.core.truth_(temp__5804__auto___88272)){
var instance_88273 = temp__5804__auto___88272;
instance_88273.destroy();

cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_graph_instance,null);

cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation,null);
} else {
}

return cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_,false);
});
frontend.extensions.graph.pixi.stop_simulation_BANG_ = (function frontend$extensions$graph$pixi$stop_simulation_BANG_(){
var temp__5804__auto__ = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto__)){
var simulation = temp__5804__auto__;
simulation.stop();

return cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_,true);
} else {
return null;
}
});
frontend.extensions.graph.pixi.resume_simulation_BANG_ = (function frontend$extensions$graph$pixi$resume_simulation_BANG_(){
var temp__5804__auto___88274 = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto___88274)){
var simulation_88275 = temp__5804__auto___88274;
simulation_88275.restart();
} else {
}

return cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_,false);
});
frontend.extensions.graph.pixi.update_position_BANG_ = (function frontend$extensions$graph$pixi$update_position_BANG_(node,obj){
if(cljs.core.truth_(node)){
try{return node.updatePosition(({"x": obj.x, "y": obj.y}));
}catch (e88231){var e = e88231;
return console.error(e);
}} else {
return null;
}
});
frontend.extensions.graph.pixi.tick_BANG_ = (function frontend$extensions$graph$pixi$tick_BANG_(pixi,_graph,nodes_js,links_js){
return (function (){
try{var nodes_objects = pixi.getNodesObjects();
var edges_objects = pixi.getEdgesObjects();
var seq__88233_88277 = cljs.core.seq(nodes_js);
var chunk__88234_88278 = null;
var count__88235_88279 = (0);
var i__88236_88280 = (0);
while(true){
if((i__88236_88280 < count__88235_88279)){
var node_88281 = chunk__88234_88278.cljs$core$IIndexed$_nth$arity$2(null,i__88236_88280);
var temp__5804__auto___88282 = nodes_objects.get(node_88281.id);
if(cljs.core.truth_(temp__5804__auto___88282)){
var node_object_88283 = temp__5804__auto___88282;
frontend.extensions.graph.pixi.update_position_BANG_(node_object_88283,node_88281);
} else {
}


var G__88284 = seq__88233_88277;
var G__88285 = chunk__88234_88278;
var G__88286 = count__88235_88279;
var G__88287 = (i__88236_88280 + (1));
seq__88233_88277 = G__88284;
chunk__88234_88278 = G__88285;
count__88235_88279 = G__88286;
i__88236_88280 = G__88287;
continue;
} else {
var temp__5804__auto___88290 = cljs.core.seq(seq__88233_88277);
if(temp__5804__auto___88290){
var seq__88233_88291__$1 = temp__5804__auto___88290;
if(cljs.core.chunked_seq_QMARK_(seq__88233_88291__$1)){
var c__5525__auto___88292 = cljs.core.chunk_first(seq__88233_88291__$1);
var G__88293 = cljs.core.chunk_rest(seq__88233_88291__$1);
var G__88294 = c__5525__auto___88292;
var G__88295 = cljs.core.count(c__5525__auto___88292);
var G__88296 = (0);
seq__88233_88277 = G__88293;
chunk__88234_88278 = G__88294;
count__88235_88279 = G__88295;
i__88236_88280 = G__88296;
continue;
} else {
var node_88297 = cljs.core.first(seq__88233_88291__$1);
var temp__5804__auto___88298__$1 = nodes_objects.get(node_88297.id);
if(cljs.core.truth_(temp__5804__auto___88298__$1)){
var node_object_88299 = temp__5804__auto___88298__$1;
frontend.extensions.graph.pixi.update_position_BANG_(node_object_88299,node_88297);
} else {
}


var G__88300 = cljs.core.next(seq__88233_88291__$1);
var G__88301 = null;
var G__88302 = (0);
var G__88303 = (0);
seq__88233_88277 = G__88300;
chunk__88234_88278 = G__88301;
count__88235_88279 = G__88302;
i__88236_88280 = G__88303;
continue;
}
} else {
}
}
break;
}

var seq__88237 = cljs.core.seq(links_js);
var chunk__88238 = null;
var count__88239 = (0);
var i__88240 = (0);
while(true){
if((i__88240 < count__88239)){
var edge = chunk__88238.cljs$core$IIndexed$_nth$arity$2(null,i__88240);
var temp__5804__auto___88304 = edges_objects.get(cljs.core.str.cljs$core$IFn$_invoke$arity$1(edge.index));
if(cljs.core.truth_(temp__5804__auto___88304)){
var edge_object_88305 = temp__5804__auto___88304;
edge_object_88305.updatePosition(({"x": edge.source.x, "y": edge.source.y}),({"x": edge.target.x, "y": edge.target.y}));
} else {
}


var G__88307 = seq__88237;
var G__88308 = chunk__88238;
var G__88309 = count__88239;
var G__88310 = (i__88240 + (1));
seq__88237 = G__88307;
chunk__88238 = G__88308;
count__88239 = G__88309;
i__88240 = G__88310;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__88237);
if(temp__5804__auto__){
var seq__88237__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__88237__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__88237__$1);
var G__88311 = cljs.core.chunk_rest(seq__88237__$1);
var G__88312 = c__5525__auto__;
var G__88313 = cljs.core.count(c__5525__auto__);
var G__88314 = (0);
seq__88237 = G__88311;
chunk__88238 = G__88312;
count__88239 = G__88313;
i__88240 = G__88314;
continue;
} else {
var edge = cljs.core.first(seq__88237__$1);
var temp__5804__auto___88318__$1 = edges_objects.get(cljs.core.str.cljs$core$IFn$_invoke$arity$1(edge.index));
if(cljs.core.truth_(temp__5804__auto___88318__$1)){
var edge_object_88319 = temp__5804__auto___88318__$1;
edge_object_88319.updatePosition(({"x": edge.source.x, "y": edge.source.y}),({"x": edge.target.x, "y": edge.target.y}));
} else {
}


var G__88320 = cljs.core.next(seq__88237__$1);
var G__88321 = null;
var G__88322 = (0);
var G__88323 = (0);
seq__88237 = G__88320;
chunk__88238 = G__88321;
count__88239 = G__88322;
i__88240 = G__88323;
continue;
}
} else {
return null;
}
}
break;
}
}catch (e88232){var e = e88232;
console.error(e);

return null;
}});
});
frontend.extensions.graph.pixi.set_up_listeners_BANG_ = (function frontend$extensions$graph$pixi$set_up_listeners_BANG_(pixi_graph){
if(cljs.core.truth_(pixi_graph)){
var _STAR_dragging_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var nodes = pixi_graph.getNodesObjects();
var on_drag_end = (function (_node,event){
event.stopPropagation();

var temp__5804__auto___88324 = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto___88324)){
var s_88325 = temp__5804__auto___88324;
if(cljs.core.truth_(event.active)){
} else {
s_88325.alphaTarget((0));
}
} else {
}

return cljs.core.reset_BANG_(_STAR_dragging_QMARK_,false);
});
pixi_graph.on("nodeMousedown",(function (event,node_key){
var temp__5804__auto__ = nodes.get(node_key);
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto____$1)){
var s = temp__5804__auto____$1;
if(cljs.core.truth_((function (){var or__5002__auto__ = event.active;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_);
}
})())){
} else {
s.alphaTarget(0.3).restart();

setTimeout((function (){
return s.alphaTarget((0));
}),(2000));
}

return cljs.core.reset_BANG_(_STAR_dragging_QMARK_,true);
} else {
return null;
}
} else {
return null;
}
}));

pixi_graph.on("nodeMouseup",(function (event,node_key){
var temp__5804__auto__ = nodes.get(node_key);
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return on_drag_end(node,event);
} else {
return null;
}
}));

return pixi_graph.on("nodeMousemove",(function (event,node_key){
var temp__5804__auto__ = nodes.get(node_key);
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.deref(_STAR_dragging_QMARK_))){
return frontend.extensions.graph.pixi.update_position_BANG_(node,event);
} else {
return null;
}
} else {
return null;
}
}));
} else {
return null;
}
});
frontend.extensions.graph.pixi.render_BANG_ = (function frontend$extensions$graph$pixi$render_BANG_(state){
try{if(cljs.core.truth_(cljs.core.deref(frontend.extensions.graph.pixi._STAR_graph_instance))){
frontend.extensions.graph.pixi.clear_nodes_BANG_(new cljs.core.Keyword(null,"graph","graph",1558099509).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.extensions.graph.pixi._STAR_graph_instance)));

frontend.extensions.graph.pixi.destroy_instance_BANG_();
} else {
}

var map__88245_88328 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var map__88245_88329__$1 = cljs.core.__destructure_map(map__88245_88328);
var hover_style_88330 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"hover-style","hover-style",976094077));
var links_88331 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"links","links",-654507394));
var height_88332 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"height","height",1025178622));
var charge_range_88333 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"charge-range","charge-range",509183775));
var charge_strength_88334 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"charge-strength","charge-strength",1642158883));
var link_dist_88335 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"link-dist","link-dist",48179915));
var register_handlers_fn_88336 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"register-handlers-fn","register-handlers-fn",2000178094));
var dark_QMARK__88337 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"dark?","dark?",622933231));
var style_88338 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"style","style",-496642736));
var nodes_88339 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88245_88329__$1,new cljs.core.Keyword(null,"nodes","nodes",-2099585805));
var style_88340__$1 = (function (){var or__5002__auto__ = style_88338;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.extensions.graph.pixi.default_style(dark_QMARK__88337);
}
})();
var hover_style_88341__$1 = (function (){var or__5002__auto__ = hover_style_88330;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.extensions.graph.pixi.default_hover_style(dark_QMARK__88337);
}
})();
var graph_88342 = (new frontend.extensions.graph.pixi.Graph());
var nodes_set_88343 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),nodes_88339));
var links_88344__$1 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (link){
var and__5000__auto__ = (function (){var G__88246 = new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(link);
return (nodes_set_88343.cljs$core$IFn$_invoke$arity$1 ? nodes_set_88343.cljs$core$IFn$_invoke$arity$1(G__88246) : nodes_set_88343.call(null,G__88246));
})();
if(cljs.core.truth_(and__5000__auto__)){
var G__88247 = new cljs.core.Keyword(null,"target","target",253001721).cljs$core$IFn$_invoke$arity$1(link);
return (nodes_set_88343.cljs$core$IFn$_invoke$arity$1 ? nodes_set_88343.cljs$core$IFn$_invoke$arity$1(G__88247) : nodes_set_88343.call(null,G__88247));
} else {
return and__5000__auto__;
}
}),links_88331));
var nodes_88345__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,nodes_88339);
var links_88346__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__88248){
var map__88249 = p__88248;
var map__88249__$1 = cljs.core.__destructure_map(map__88249);
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88249__$1,new cljs.core.Keyword(null,"source","source",-433931539));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88249__$1,new cljs.core.Keyword(null,"target","target",253001721));
return (((source == null)) || ((target == null)));
}),links_88344__$1);
var nodes_js_88347 = cljs_bean.core.__GT_js(nodes_88345__$1);
var links_js_88348 = cljs_bean.core.__GT_js(links_88346__$2);
var simulation_88349 = frontend.extensions.graph.pixi.layout_BANG_(nodes_js_88347,links_js_88348,link_dist_88335,charge_strength_88334,charge_range_88333);
var seq__88251_88351 = cljs.core.seq(nodes_js_88347);
var chunk__88252_88352 = null;
var count__88253_88353 = (0);
var i__88254_88354 = (0);
while(true){
if((i__88254_88354 < count__88253_88353)){
var node_88355 = chunk__88252_88352.cljs$core$IIndexed$_nth$arity$2(null,i__88254_88354);
try{graph_88342.addNode(node_88355.id,node_88355);
}catch (e88258){var e_88357 = e88258;
console.error(e_88357);
}

var G__88358 = seq__88251_88351;
var G__88359 = chunk__88252_88352;
var G__88360 = count__88253_88353;
var G__88361 = (i__88254_88354 + (1));
seq__88251_88351 = G__88358;
chunk__88252_88352 = G__88359;
count__88253_88353 = G__88360;
i__88254_88354 = G__88361;
continue;
} else {
var temp__5804__auto___88362 = cljs.core.seq(seq__88251_88351);
if(temp__5804__auto___88362){
var seq__88251_88363__$1 = temp__5804__auto___88362;
if(cljs.core.chunked_seq_QMARK_(seq__88251_88363__$1)){
var c__5525__auto___88364 = cljs.core.chunk_first(seq__88251_88363__$1);
var G__88365 = cljs.core.chunk_rest(seq__88251_88363__$1);
var G__88366 = c__5525__auto___88364;
var G__88367 = cljs.core.count(c__5525__auto___88364);
var G__88368 = (0);
seq__88251_88351 = G__88365;
chunk__88252_88352 = G__88366;
count__88253_88353 = G__88367;
i__88254_88354 = G__88368;
continue;
} else {
var node_88369 = cljs.core.first(seq__88251_88363__$1);
try{graph_88342.addNode(node_88369.id,node_88369);
}catch (e88259){var e_88371 = e88259;
console.error(e_88371);
}

var G__88372 = cljs.core.next(seq__88251_88363__$1);
var G__88373 = null;
var G__88374 = (0);
var G__88375 = (0);
seq__88251_88351 = G__88372;
chunk__88252_88352 = G__88373;
count__88253_88353 = G__88374;
i__88254_88354 = G__88375;
continue;
}
} else {
}
}
break;
}

var seq__88260_88376 = cljs.core.seq(links_js_88348);
var chunk__88261_88377 = null;
var count__88262_88378 = (0);
var i__88263_88380 = (0);
while(true){
if((i__88263_88380 < count__88262_88378)){
var link_88381 = chunk__88261_88377.cljs$core$IIndexed$_nth$arity$2(null,i__88263_88380);
var source_88383 = link_88381.source.id;
var target_88384 = link_88381.target.id;
try{graph_88342.addEdge(source_88383,target_88384,link_88381);
}catch (e88266){var e_88385 = e88266;
console.error(e_88385);
}

var G__88387 = seq__88260_88376;
var G__88388 = chunk__88261_88377;
var G__88389 = count__88262_88378;
var G__88390 = (i__88263_88380 + (1));
seq__88260_88376 = G__88387;
chunk__88261_88377 = G__88388;
count__88262_88378 = G__88389;
i__88263_88380 = G__88390;
continue;
} else {
var temp__5804__auto___88391 = cljs.core.seq(seq__88260_88376);
if(temp__5804__auto___88391){
var seq__88260_88392__$1 = temp__5804__auto___88391;
if(cljs.core.chunked_seq_QMARK_(seq__88260_88392__$1)){
var c__5525__auto___88393 = cljs.core.chunk_first(seq__88260_88392__$1);
var G__88394 = cljs.core.chunk_rest(seq__88260_88392__$1);
var G__88395 = c__5525__auto___88393;
var G__88396 = cljs.core.count(c__5525__auto___88393);
var G__88397 = (0);
seq__88260_88376 = G__88394;
chunk__88261_88377 = G__88395;
count__88262_88378 = G__88396;
i__88263_88380 = G__88397;
continue;
} else {
var link_88398 = cljs.core.first(seq__88260_88392__$1);
var source_88399 = link_88398.source.id;
var target_88400 = link_88398.target.id;
try{graph_88342.addEdge(source_88399,target_88400,link_88398);
}catch (e88267){var e_88401 = e88267;
console.error(e_88401);
}

var G__88402 = cljs.core.next(seq__88260_88392__$1);
var G__88403 = null;
var G__88404 = (0);
var G__88405 = (0);
seq__88260_88376 = G__88402;
chunk__88261_88377 = G__88403;
count__88262_88378 = G__88404;
i__88263_88380 = G__88405;
continue;
}
} else {
}
}
break;
}

var temp__5804__auto___88406 = new cljs.core.Keyword(null,"ref","ref",1289896967).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___88406)){
var container_ref_88407 = temp__5804__auto___88406;
var pixi_graph_88408 = (new module$node_modules$pixi_graph_fork$dist$pixi_graph_cjs.PixiGraph(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"container","container",-1736937707),cljs.core.deref(container_ref_88407),new cljs.core.Keyword(null,"graph","graph",1558099509),graph_88342,new cljs.core.Keyword(null,"style","style",-496642736),style_88340__$1,new cljs.core.Keyword(null,"hoverStyle","hoverStyle",1695150190),hover_style_88341__$1,new cljs.core.Keyword(null,"height","height",1025178622),height_88332], null))));
cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_graph_instance,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph","graph",1558099509),graph_88342,new cljs.core.Keyword(null,"pixi","pixi",808009198),pixi_graph_88408], null));

if(cljs.core.truth_(register_handlers_fn_88336)){
(register_handlers_fn_88336.cljs$core$IFn$_invoke$arity$1 ? register_handlers_fn_88336.cljs$core$IFn$_invoke$arity$1(pixi_graph_88408) : register_handlers_fn_88336.call(null,pixi_graph_88408));
} else {
}

frontend.extensions.graph.pixi.set_up_listeners_BANG_(pixi_graph_88408);

simulation_88349.on("tick",frontend.extensions.graph.pixi.tick_BANG_(pixi_graph_88408,graph_88342,nodes_js_88347,links_js_88348));
} else {
}
}catch (e88244){var e_88409 = e88244;
console.error(e_88409);
}
return state;
});

//# sourceMappingURL=frontend.extensions.graph.pixi.js.map
