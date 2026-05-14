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
var temp__5804__auto___88978 = new cljs.core.Keyword(null,"pixi","pixi",808009198).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.extensions.graph.pixi._STAR_graph_instance));
if(cljs.core.truth_(temp__5804__auto___88978)){
var instance_88979 = temp__5804__auto___88978;
instance_88979.destroy();

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
var temp__5804__auto___88981 = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto___88981)){
var simulation_88982 = temp__5804__auto___88981;
simulation_88982.restart();
} else {
}

return cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_,false);
});
frontend.extensions.graph.pixi.update_position_BANG_ = (function frontend$extensions$graph$pixi$update_position_BANG_(node,obj){
if(cljs.core.truth_(node)){
try{return node.updatePosition(({"x": obj.x, "y": obj.y}));
}catch (e88860){var e = e88860;
return console.error(e);
}} else {
return null;
}
});
frontend.extensions.graph.pixi.tick_BANG_ = (function frontend$extensions$graph$pixi$tick_BANG_(pixi,_graph,nodes_js,links_js){
return (function (){
try{var nodes_objects = pixi.getNodesObjects();
var edges_objects = pixi.getEdgesObjects();
var seq__88862_88989 = cljs.core.seq(nodes_js);
var chunk__88863_88990 = null;
var count__88864_88991 = (0);
var i__88865_88992 = (0);
while(true){
if((i__88865_88992 < count__88864_88991)){
var node_88993 = chunk__88863_88990.cljs$core$IIndexed$_nth$arity$2(null,i__88865_88992);
var temp__5804__auto___88996 = nodes_objects.get(node_88993.id);
if(cljs.core.truth_(temp__5804__auto___88996)){
var node_object_89000 = temp__5804__auto___88996;
frontend.extensions.graph.pixi.update_position_BANG_(node_object_89000,node_88993);
} else {
}


var G__89001 = seq__88862_88989;
var G__89002 = chunk__88863_88990;
var G__89003 = count__88864_88991;
var G__89004 = (i__88865_88992 + (1));
seq__88862_88989 = G__89001;
chunk__88863_88990 = G__89002;
count__88864_88991 = G__89003;
i__88865_88992 = G__89004;
continue;
} else {
var temp__5804__auto___89005 = cljs.core.seq(seq__88862_88989);
if(temp__5804__auto___89005){
var seq__88862_89006__$1 = temp__5804__auto___89005;
if(cljs.core.chunked_seq_QMARK_(seq__88862_89006__$1)){
var c__5525__auto___89007 = cljs.core.chunk_first(seq__88862_89006__$1);
var G__89008 = cljs.core.chunk_rest(seq__88862_89006__$1);
var G__89009 = c__5525__auto___89007;
var G__89010 = cljs.core.count(c__5525__auto___89007);
var G__89011 = (0);
seq__88862_88989 = G__89008;
chunk__88863_88990 = G__89009;
count__88864_88991 = G__89010;
i__88865_88992 = G__89011;
continue;
} else {
var node_89013 = cljs.core.first(seq__88862_89006__$1);
var temp__5804__auto___89014__$1 = nodes_objects.get(node_89013.id);
if(cljs.core.truth_(temp__5804__auto___89014__$1)){
var node_object_89015 = temp__5804__auto___89014__$1;
frontend.extensions.graph.pixi.update_position_BANG_(node_object_89015,node_89013);
} else {
}


var G__89016 = cljs.core.next(seq__88862_89006__$1);
var G__89017 = null;
var G__89018 = (0);
var G__89019 = (0);
seq__88862_88989 = G__89016;
chunk__88863_88990 = G__89017;
count__88864_88991 = G__89018;
i__88865_88992 = G__89019;
continue;
}
} else {
}
}
break;
}

var seq__88866 = cljs.core.seq(links_js);
var chunk__88867 = null;
var count__88868 = (0);
var i__88869 = (0);
while(true){
if((i__88869 < count__88868)){
var edge = chunk__88867.cljs$core$IIndexed$_nth$arity$2(null,i__88869);
var temp__5804__auto___89022 = edges_objects.get(cljs.core.str.cljs$core$IFn$_invoke$arity$1(edge.index));
if(cljs.core.truth_(temp__5804__auto___89022)){
var edge_object_89024 = temp__5804__auto___89022;
edge_object_89024.updatePosition(({"x": edge.source.x, "y": edge.source.y}),({"x": edge.target.x, "y": edge.target.y}));
} else {
}


var G__89025 = seq__88866;
var G__89026 = chunk__88867;
var G__89027 = count__88868;
var G__89028 = (i__88869 + (1));
seq__88866 = G__89025;
chunk__88867 = G__89026;
count__88868 = G__89027;
i__88869 = G__89028;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__88866);
if(temp__5804__auto__){
var seq__88866__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__88866__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__88866__$1);
var G__89029 = cljs.core.chunk_rest(seq__88866__$1);
var G__89030 = c__5525__auto__;
var G__89031 = cljs.core.count(c__5525__auto__);
var G__89032 = (0);
seq__88866 = G__89029;
chunk__88867 = G__89030;
count__88868 = G__89031;
i__88869 = G__89032;
continue;
} else {
var edge = cljs.core.first(seq__88866__$1);
var temp__5804__auto___89033__$1 = edges_objects.get(cljs.core.str.cljs$core$IFn$_invoke$arity$1(edge.index));
if(cljs.core.truth_(temp__5804__auto___89033__$1)){
var edge_object_89034 = temp__5804__auto___89033__$1;
edge_object_89034.updatePosition(({"x": edge.source.x, "y": edge.source.y}),({"x": edge.target.x, "y": edge.target.y}));
} else {
}


var G__89035 = cljs.core.next(seq__88866__$1);
var G__89036 = null;
var G__89037 = (0);
var G__89038 = (0);
seq__88866 = G__89035;
chunk__88867 = G__89036;
count__88868 = G__89037;
i__88869 = G__89038;
continue;
}
} else {
return null;
}
}
break;
}
}catch (e88861){var e = e88861;
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

var temp__5804__auto___89042 = cljs.core.deref(frontend.extensions.graph.pixi._STAR_simulation);
if(cljs.core.truth_(temp__5804__auto___89042)){
var s_89044 = temp__5804__auto___89042;
if(cljs.core.truth_(event.active)){
} else {
s_89044.alphaTarget((0));
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

var map__88902_89047 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var map__88902_89048__$1 = cljs.core.__destructure_map(map__88902_89047);
var hover_style_89049 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"hover-style","hover-style",976094077));
var links_89050 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"links","links",-654507394));
var height_89051 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"height","height",1025178622));
var charge_range_89052 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"charge-range","charge-range",509183775));
var charge_strength_89053 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"charge-strength","charge-strength",1642158883));
var link_dist_89054 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"link-dist","link-dist",48179915));
var register_handlers_fn_89055 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"register-handlers-fn","register-handlers-fn",2000178094));
var dark_QMARK__89056 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"dark?","dark?",622933231));
var style_89057 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"style","style",-496642736));
var nodes_89058 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88902_89048__$1,new cljs.core.Keyword(null,"nodes","nodes",-2099585805));
var style_89059__$1 = (function (){var or__5002__auto__ = style_89057;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.extensions.graph.pixi.default_style(dark_QMARK__89056);
}
})();
var hover_style_89060__$1 = (function (){var or__5002__auto__ = hover_style_89049;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.extensions.graph.pixi.default_hover_style(dark_QMARK__89056);
}
})();
var graph_89061 = (new frontend.extensions.graph.pixi.Graph());
var nodes_set_89062 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),nodes_89058));
var links_89063__$1 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (link){
var and__5000__auto__ = (function (){var G__88907 = new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(link);
return (nodes_set_89062.cljs$core$IFn$_invoke$arity$1 ? nodes_set_89062.cljs$core$IFn$_invoke$arity$1(G__88907) : nodes_set_89062.call(null,G__88907));
})();
if(cljs.core.truth_(and__5000__auto__)){
var G__88908 = new cljs.core.Keyword(null,"target","target",253001721).cljs$core$IFn$_invoke$arity$1(link);
return (nodes_set_89062.cljs$core$IFn$_invoke$arity$1 ? nodes_set_89062.cljs$core$IFn$_invoke$arity$1(G__88908) : nodes_set_89062.call(null,G__88908));
} else {
return and__5000__auto__;
}
}),links_89050));
var nodes_89064__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,nodes_89058);
var links_89065__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__88910){
var map__88911 = p__88910;
var map__88911__$1 = cljs.core.__destructure_map(map__88911);
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88911__$1,new cljs.core.Keyword(null,"source","source",-433931539));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88911__$1,new cljs.core.Keyword(null,"target","target",253001721));
return (((source == null)) || ((target == null)));
}),links_89063__$1);
var nodes_js_89066 = cljs_bean.core.__GT_js(nodes_89064__$1);
var links_js_89067 = cljs_bean.core.__GT_js(links_89065__$2);
var simulation_89068 = frontend.extensions.graph.pixi.layout_BANG_(nodes_js_89066,links_js_89067,link_dist_89054,charge_strength_89053,charge_range_89052);
var seq__88914_89085 = cljs.core.seq(nodes_js_89066);
var chunk__88915_89086 = null;
var count__88916_89087 = (0);
var i__88917_89088 = (0);
while(true){
if((i__88917_89088 < count__88916_89087)){
var node_89089 = chunk__88915_89086.cljs$core$IIndexed$_nth$arity$2(null,i__88917_89088);
try{graph_89061.addNode(node_89089.id,node_89089);
}catch (e88920){var e_89090 = e88920;
console.error(e_89090);
}

var G__89091 = seq__88914_89085;
var G__89092 = chunk__88915_89086;
var G__89093 = count__88916_89087;
var G__89094 = (i__88917_89088 + (1));
seq__88914_89085 = G__89091;
chunk__88915_89086 = G__89092;
count__88916_89087 = G__89093;
i__88917_89088 = G__89094;
continue;
} else {
var temp__5804__auto___89096 = cljs.core.seq(seq__88914_89085);
if(temp__5804__auto___89096){
var seq__88914_89097__$1 = temp__5804__auto___89096;
if(cljs.core.chunked_seq_QMARK_(seq__88914_89097__$1)){
var c__5525__auto___89098 = cljs.core.chunk_first(seq__88914_89097__$1);
var G__89099 = cljs.core.chunk_rest(seq__88914_89097__$1);
var G__89100 = c__5525__auto___89098;
var G__89101 = cljs.core.count(c__5525__auto___89098);
var G__89102 = (0);
seq__88914_89085 = G__89099;
chunk__88915_89086 = G__89100;
count__88916_89087 = G__89101;
i__88917_89088 = G__89102;
continue;
} else {
var node_89103 = cljs.core.first(seq__88914_89097__$1);
try{graph_89061.addNode(node_89103.id,node_89103);
}catch (e88924){var e_89105 = e88924;
console.error(e_89105);
}

var G__89106 = cljs.core.next(seq__88914_89097__$1);
var G__89107 = null;
var G__89108 = (0);
var G__89109 = (0);
seq__88914_89085 = G__89106;
chunk__88915_89086 = G__89107;
count__88916_89087 = G__89108;
i__88917_89088 = G__89109;
continue;
}
} else {
}
}
break;
}

var seq__88927_89110 = cljs.core.seq(links_js_89067);
var chunk__88928_89111 = null;
var count__88929_89112 = (0);
var i__88930_89113 = (0);
while(true){
if((i__88930_89113 < count__88929_89112)){
var link_89119 = chunk__88928_89111.cljs$core$IIndexed$_nth$arity$2(null,i__88930_89113);
var source_89120 = link_89119.source.id;
var target_89121 = link_89119.target.id;
try{graph_89061.addEdge(source_89120,target_89121,link_89119);
}catch (e88943){var e_89122 = e88943;
console.error(e_89122);
}

var G__89125 = seq__88927_89110;
var G__89126 = chunk__88928_89111;
var G__89127 = count__88929_89112;
var G__89128 = (i__88930_89113 + (1));
seq__88927_89110 = G__89125;
chunk__88928_89111 = G__89126;
count__88929_89112 = G__89127;
i__88930_89113 = G__89128;
continue;
} else {
var temp__5804__auto___89129 = cljs.core.seq(seq__88927_89110);
if(temp__5804__auto___89129){
var seq__88927_89130__$1 = temp__5804__auto___89129;
if(cljs.core.chunked_seq_QMARK_(seq__88927_89130__$1)){
var c__5525__auto___89131 = cljs.core.chunk_first(seq__88927_89130__$1);
var G__89132 = cljs.core.chunk_rest(seq__88927_89130__$1);
var G__89133 = c__5525__auto___89131;
var G__89134 = cljs.core.count(c__5525__auto___89131);
var G__89135 = (0);
seq__88927_89110 = G__89132;
chunk__88928_89111 = G__89133;
count__88929_89112 = G__89134;
i__88930_89113 = G__89135;
continue;
} else {
var link_89136 = cljs.core.first(seq__88927_89130__$1);
var source_89137 = link_89136.source.id;
var target_89138 = link_89136.target.id;
try{graph_89061.addEdge(source_89137,target_89138,link_89136);
}catch (e88949){var e_89140 = e88949;
console.error(e_89140);
}

var G__89141 = cljs.core.next(seq__88927_89130__$1);
var G__89142 = null;
var G__89143 = (0);
var G__89144 = (0);
seq__88927_89110 = G__89141;
chunk__88928_89111 = G__89142;
count__88929_89112 = G__89143;
i__88930_89113 = G__89144;
continue;
}
} else {
}
}
break;
}

var temp__5804__auto___89147 = new cljs.core.Keyword(null,"ref","ref",1289896967).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto___89147)){
var container_ref_89148 = temp__5804__auto___89147;
var pixi_graph_89149 = (new module$node_modules$pixi_graph_fork$dist$pixi_graph_cjs.PixiGraph(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"container","container",-1736937707),cljs.core.deref(container_ref_89148),new cljs.core.Keyword(null,"graph","graph",1558099509),graph_89061,new cljs.core.Keyword(null,"style","style",-496642736),style_89059__$1,new cljs.core.Keyword(null,"hoverStyle","hoverStyle",1695150190),hover_style_89060__$1,new cljs.core.Keyword(null,"height","height",1025178622),height_89051], null))));
cljs.core.reset_BANG_(frontend.extensions.graph.pixi._STAR_graph_instance,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph","graph",1558099509),graph_89061,new cljs.core.Keyword(null,"pixi","pixi",808009198),pixi_graph_89149], null));

if(cljs.core.truth_(register_handlers_fn_89055)){
(register_handlers_fn_89055.cljs$core$IFn$_invoke$arity$1 ? register_handlers_fn_89055.cljs$core$IFn$_invoke$arity$1(pixi_graph_89149) : register_handlers_fn_89055.call(null,pixi_graph_89149));
} else {
}

frontend.extensions.graph.pixi.set_up_listeners_BANG_(pixi_graph_89149);

simulation_89068.on("tick",frontend.extensions.graph.pixi.tick_BANG_(pixi_graph_89149,graph_89061,nodes_js_89066,links_js_89067));
} else {
}
}catch (e88899){var e_89156 = e88899;
console.error(e_89156);
}
return state;
});

//# sourceMappingURL=frontend.extensions.graph.pixi.js.map
