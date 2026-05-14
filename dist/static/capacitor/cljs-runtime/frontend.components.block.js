goog.provide('frontend.components.block');
goog.scope(function(){
  frontend.components.block.goog$module$goog$object = goog.module.get('goog.object');
  frontend.components.block.goog$module$shadow$loader = goog.module.get('shadow.loader');
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_dragging_QMARK_ !== 'undefined')){
} else {
frontend.components.block._STAR_dragging_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_dragging_block !== 'undefined')){
} else {
frontend.components.block._STAR_dragging_block = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_dragging_over_block !== 'undefined')){
} else {
frontend.components.block._STAR_dragging_over_block = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_drag_to_block !== 'undefined')){
} else {
frontend.components.block._STAR_drag_to_block = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.block._STAR_move_to = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block.max_depth_of_links !== 'undefined')){
} else {
frontend.components.block.max_depth_of_links = (5);
}
frontend.components.block.remove_nils = (function frontend$components$block$remove_nils(col){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,col);
});
frontend.components.block.vec_cat = (function frontend$components$block$vec_cat(var_args){
var args__5732__auto__ = [];
var len__5726__auto___89279 = arguments.length;
var i__5727__auto___89280 = (0);
while(true){
if((i__5727__auto___89280 < len__5726__auto___89279)){
args__5732__auto__.push((arguments[i__5727__auto___89280]));

var G__89281 = (i__5727__auto___89280 + (1));
i__5727__auto___89280 = G__89281;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic = (function (args){
return cljs.core.vec(frontend.components.block.remove_nils(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,args)));
}));

(frontend.components.block.vec_cat.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.components.block.vec_cat.cljs$lang$applyTo = (function (seq87919){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq87919));
}));

frontend.components.block.__GT_elem = (function frontend$components$block$__GT_elem(var_args){
var G__87924 = arguments.length;
switch (G__87924) {
case 2:
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2 = (function (elem,items){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(elem,null,items);
}));

(frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3 = (function (elem,attrs,items){
var elem__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(elem);
if(cljs.core.truth_(attrs)){
return cljs.core.vec(cljs.core.cons(elem__$1,cljs.core.cons(attrs,cljs.core.seq(items))));
} else {
return cljs.core.vec(cljs.core.cons(elem__$1,cljs.core.seq(items)));
}
}));

(frontend.components.block.__GT_elem.cljs$lang$maxFixedArity = 3);

frontend.components.block.join_lines = (function frontend$components$block$join_lines(l){
return clojure.string.trim(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,l));
});
frontend.components.block.string_of_url = (function frontend$components$block$string_of_url(url){
try{if(((cljs.core.vector_QMARK_(url)) && ((cljs.core.count(url) === 2)))){
try{var url_0__87928 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__87928 === "File")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
return clojure.string.replace(clojure.string.replace(s,"file://",""),"file:","");
} else {
throw cljs.core.match.backtrack;

}
}catch (e87931){if((e87931 instanceof Error)){
var e__46744__auto__ = e87931;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{var url_0__87928 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__87928 === "Complex")){
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
var map__87933 = m;
var map__87933__$1 = cljs.core.__destructure_map(map__87933);
var link = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87933__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var protocol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87933__$1,new cljs.core.Keyword(null,"protocol","protocol",652470118));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(protocol,"file")){
return link;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol),"://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(link)].join('');
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e87932){if((e87932 instanceof Error)){
var e__46744__auto____$1 = e87932;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e87932;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e87931;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e87930){if((e87930 instanceof Error)){
var e__46744__auto__ = e87930;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url)].join('')));
} else {
throw e__46744__auto__;
}
} else {
throw e87930;

}
}});
frontend.components.block.get_file_absolute_path = (function frontend$components$block$get_file_absolute_path(config,path){
var path__$1 = clojure.string.replace(path,"file:","");
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
var current_file = (function (){var and__5000__auto__ = block_id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__87935 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__87935) : frontend.db.entity.call(null,G__87935));
})())));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(current_file)){
var parts = clojure.string.split.cljs$core$IFn$_invoke$arity$2(current_file,/\//);
var parts_2 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(path__$1,/\//);
var current_dir = (function (){var G__87936 = cljs.core.drop_last.cljs$core$IFn$_invoke$arity$2((1),parts);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__87936) : frontend.util.string_join_path.call(null,G__87936));
})();
if(cljs.core.truth_((cljs.core.truth_(frontend.util.win32_QMARK_)?module$frontend$utils.win32(path__$1):frontend.util.starts_with_QMARK_(path__$1,"/")))){
return path__$1;
} else {
if((((!(frontend.util.starts_with_QMARK_(path__$1,"..")))) && ((!(frontend.util.starts_with_QMARK_(path__$1,".")))))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_dir),"/",path__$1].join('');
} else {
var parts__$1 = (function (){var acc = cljs.core.PersistentVector.EMPTY;
var parts__$1 = cljs.core.reverse(parts);
var col = cljs.core.reverse(parts_2);
while(true){
if(cljs.core.empty_QMARK_(col)){
return acc;
} else {
var vec__87941 = (function (){var G__87944 = cljs.core.first(col);
switch (G__87944) {
case "..":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(parts__$1),cljs.core.rest(parts__$1)], null);

break;
case ".":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",parts__$1], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(col),cljs.core.rest(parts__$1)], null);

}
})();
var part = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87941,(0),null);
var parts__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87941,(1),null);
var G__89284 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,part);
var G__89285 = parts__$2;
var G__89286 = cljs.core.rest(col);
acc = G__89284;
parts__$1 = G__89285;
col = G__89286;
continue;
}
break;
}
})();
var parts__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__87934_SHARP_){
return clojure.string.blank_QMARK_(p1__87934_SHARP_);
}),parts__$1);
var G__87945 = cljs.core.reverse(parts__$2);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__87945) : frontend.util.string_join_path.call(null,G__87945));

}
}
} else {
return null;
}
});
frontend.components.block.file_based_asset_loader = rum.core.lazy_build(rum.core.build_defcs,(function (state,src,content_fn){
var _ = frontend.state.sub_file_sync_state(frontend.state.get_current_file_sync_graph_uuid());
var exist_QMARK_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.block","exist?","frontend.components.block/exist?",-666100050).cljs$core$IFn$_invoke$arity$1(state));
var loading_QMARK_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.block","loading?","frontend.components.block/loading?",-807026662).cljs$core$IFn$_invoke$arity$1(state));
var asset_file_QMARK_ = new cljs.core.Keyword("frontend.components.block","asset-file?","frontend.components.block/asset-file?",-2055371462).cljs$core$IFn$_invoke$arity$1(state);
var sync_enabled_QMARK_ = cljs.core.boolean$(frontend.handler.file_sync.current_graph_sync_on_QMARK_());
var ext = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.get_file_ext(src));
var img_QMARK_ = cljs.core.contains_QMARK_(logseq.common.config.img_formats(),ext);
var audio_QMARK_ = cljs.core.contains_QMARK_(frontend.config.audio_formats,ext);
var type = ((img_QMARK_)?"image":((audio_QMARK_)?"audio":"asset"
));
if((!(sync_enabled_QMARK_))){
return daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$0 ? content_fn.cljs$core$IFn$_invoke$arity$0() : content_fn.call(null)));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = asset_file_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = loading_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (exist_QMARK_ == null);
}
} else {
return and__5000__auto__;
}
})())){
var attrs87947 = frontend.ui.loading.cljs$core$IFn$_invoke$arity$1((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Syncing %s ...",type) : frontend.util.format.call(null,"Syncing %s ...",type)));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs87947))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-50"], null)], null),attrs87947], 0))):{'className':"text-sm opacity-50"}),((cljs.core.map_QMARK_(attrs87947))?null:[daiquiri.interpreter.interpret(attrs87947)]));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(asset_file_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = exist_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(loading_QMARK_);
} else {
return and__5000__auto__;
}
}
})())){
return daiquiri.interpreter.interpret((content_fn.cljs$core$IFn$_invoke$arity$0 ? content_fn.cljs$core$IFn$_invoke$arity$0() : content_fn.call(null)));
} else {
return daiquiri.core.create_element("p",{'className':"text-error text-xs"},[(function (){var attrs87952 = (function (){var G__87953 = "%s not found!";
var G__87954 = clojure.string.capitalize(type);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__87953,G__87954) : frontend.util.format.call(null,G__87953,G__87954));
})();
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs87952))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-80"], null)], null),attrs87952], 0))):{'className':"opacity-80"}),((cljs.core.map_QMARK_(attrs87952))?null:[daiquiri.interpreter.interpret(attrs87952)]));
})()]);
}
}
}
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.block","exist?","frontend.components.block/exist?",-666100050)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","loading?","frontend.components.block/loading?",-807026662)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var src = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.common.config.local_protocol_asset_QMARK_(src);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.file_sync.current_graph_sync_on_QMARK_();
} else {
return and__5000__auto__;
}
})())){
var _STAR_exist_QMARK_ = new cljs.core.Keyword("frontend.components.block","exist?","frontend.components.block/exist?",-666100050).cljs$core$IFn$_invoke$arity$1(state);
var asset_path = logseq.common.config.remove_asset_protocol(src);
var asset_path__$1 = frontend.fs.asset_path_normalize(asset_path);
if(clojure.string.blank_QMARK_(asset_path__$1)){
cljs.core.reset_BANG_(_STAR_exist_QMARK_,false);
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.asset_href_exists_QMARK_(asset_path__$1)),(function (exist_QMARK_){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_exist_QMARK_,cljs.core.boolean$(exist_QMARK_)));
}));
}));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.block","asset-path","frontend.components.block/asset-path",1132771810),asset_path__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.block","asset-file?","frontend.components.block/asset-file?",-2055371462),true], 0));
} else {
return state;
}
}),new cljs.core.Keyword(null,"will-update","will-update",328062998),(function (state){
var src_89287 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var asset_file_QMARK__89288 = cljs.core.boolean$(new cljs.core.Keyword("frontend.components.block","asset-file?","frontend.components.block/asset-file?",-2055371462).cljs$core$IFn$_invoke$arity$1(state));
var sync_on_QMARK__89289 = frontend.handler.file_sync.current_graph_sync_on_QMARK_();
var _STAR_loading_QMARK__89290 = new cljs.core.Keyword("frontend.components.block","loading?","frontend.components.block/loading?",-807026662).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_exist_QMARK__89291 = new cljs.core.Keyword("frontend.components.block","exist?","frontend.components.block/exist?",-666100050).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_((function (){var and__5000__auto__ = sync_on_QMARK__89289;
if(cljs.core.truth_(and__5000__auto__)){
return ((asset_file_QMARK__89288) && (cljs.core.deref(_STAR_exist_QMARK__89291) === false));
} else {
return and__5000__auto__;
}
})())){
var sync_state_89292 = frontend.state.get_file_sync_state.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_file_sync_graph_uuid());
var downloading_files_89293 = new cljs.core.Keyword(null,"current-remote->local-files","current-remote->local-files",1479283085).cljs$core$IFn$_invoke$arity$1(sync_state_89292);
var contain_url_QMARK__89294 = (function (){var and__5000__auto__ = cljs.core.seq(downloading_files_89293);
if(and__5000__auto__){
return cljs.core.some((function (p1__87946_SHARP_){
return clojure.string.ends_with_QMARK_(src_89287,p1__87946_SHARP_);
}),downloading_files_89293);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(cljs.core.deref(_STAR_loading_QMARK__89290));
if(and__5000__auto__){
return contain_url_QMARK__89294;
} else {
return and__5000__auto__;
}
})())){
cljs.core.reset_BANG_(_STAR_loading_QMARK__89290,true);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_loading_QMARK__89290);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(contain_url_QMARK__89294);
} else {
return and__5000__auto__;
}
})())){
cljs.core.reset_BANG_(_STAR_exist_QMARK__89291,true);

cljs.core.reset_BANG_(_STAR_loading_QMARK__89290,false);
} else {
}
}
} else {
}

return state;
})], null)], null),"frontend.components.block/file-based-asset-loader");
frontend.components.block.open_lightbox = (function frontend$components$block$open_lightbox(e){
var images = document.querySelectorAll(".asset-container img");
var images__$1 = cljs.core.to_array(images);
var images__$2 = (((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(((images__$1).length),(1)))))?(function (){var image = e.target.closest(".asset-container");
var image__$1 = image.querySelector("img");
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.reverse(cljs.core.split_with(cljs.core.complement(cljs.core.PersistentHashSet.createAsIfByAssoc([image__$1])),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2((function (p1__87955_SHARP_){
return p1__87955_SHARP_.y;
}),(function (p1__87956_SHARP_){
return p1__87956_SHARP_.x;
})),images__$1))));
})():images__$1);
var images__$3 = (function (){var iter__5480__auto__ = (function frontend$components$block$open_lightbox_$_iter__87957(s__87958){
return (new cljs.core.LazySeq(null,(function (){
var s__87958__$1 = s__87958;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__87958__$1);
if(temp__5804__auto__){
var s__87958__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__87958__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__87958__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__87960 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__87959 = (0);
while(true){
if((i__87959 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__87959);
cljs.core.chunk_append(b__87960,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"src","src",-1651076051),it.src,new cljs.core.Keyword(null,"w","w",354169001),it.naturalWidth,new cljs.core.Keyword(null,"h","h",1109658740),it.naturalHeight], null));

var G__89295 = (i__87959 + (1));
i__87959 = G__89295;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__87960),frontend$components$block$open_lightbox_$_iter__87957(cljs.core.chunk_rest(s__87958__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__87960),null);
}
} else {
var it = cljs.core.first(s__87958__$2);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"src","src",-1651076051),it.src,new cljs.core.Keyword(null,"w","w",354169001),it.naturalWidth,new cljs.core.Keyword(null,"h","h",1109658740),it.naturalHeight], null),frontend$components$block$open_lightbox_$_iter__87957(cljs.core.rest(s__87958__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(images__$2);
})();
if(cljs.core.seq(images__$3)){
return frontend.extensions.lightbox.preview_images_BANG_(images__$3);
} else {
return null;
}
});
frontend.components.block.resize_image_handles = rum.core.lazy_build(rum.core.build_defc,(function (dx_fn){
var handle_props = cljs.core.PersistentArrayMap.EMPTY;
var add_resizing_class_BANG_ = (function (){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
var remove_resizing_class_BANG_ = (function (){
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
var _STAR_handle_left = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_handle_right = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
logseq.shui.hooks.use_effect_BANG_((function (){
var seq__87961 = cljs.core.seq(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_handle_left) : logseq.shui.hooks.deref.call(null,_STAR_handle_left)),(logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_handle_right) : logseq.shui.hooks.deref.call(null,_STAR_handle_right))], null));
var chunk__87962 = null;
var count__87963 = (0);
var i__87964 = (0);
while(true){
if((i__87964 < count__87963)){
var el = chunk__87962.cljs$core$IIndexed$_nth$arity$2(null,i__87964);
interact(el).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"start","start",-355208981),((function (seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),e) : dx_fn.call(null,new cljs.core.Keyword(null,"start","start",-355208981),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
,new cljs.core.Keyword(null,"move","move",-2110884309),((function (seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"move","move",-2110884309),e) : dx_fn.call(null,new cljs.core.Keyword(null,"move","move",-2110884309),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
,new cljs.core.Keyword(null,"end","end",-268185958),((function (seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end","end",-268185958),e) : dx_fn.call(null,new cljs.core.Keyword(null,"end","end",-268185958),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
], null)], null))).styleCursor(false).on("dragstart",add_resizing_class_BANG_).on("dragend",remove_resizing_class_BANG_);


var G__89296 = seq__87961;
var G__89297 = chunk__87962;
var G__89298 = count__87963;
var G__89299 = (i__87964 + (1));
seq__87961 = G__89296;
chunk__87962 = G__89297;
count__87963 = G__89298;
i__87964 = G__89299;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__87961);
if(temp__5804__auto__){
var seq__87961__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__87961__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__87961__$1);
var G__89300 = cljs.core.chunk_rest(seq__87961__$1);
var G__89301 = c__5525__auto__;
var G__89302 = cljs.core.count(c__5525__auto__);
var G__89303 = (0);
seq__87961 = G__89300;
chunk__87962 = G__89301;
count__87963 = G__89302;
i__87964 = G__89303;
continue;
} else {
var el = cljs.core.first(seq__87961__$1);
interact(el).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"start","start",-355208981),((function (seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),e) : dx_fn.call(null,new cljs.core.Keyword(null,"start","start",-355208981),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
,new cljs.core.Keyword(null,"move","move",-2110884309),((function (seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"move","move",-2110884309),e) : dx_fn.call(null,new cljs.core.Keyword(null,"move","move",-2110884309),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
,new cljs.core.Keyword(null,"end","end",-268185958),((function (seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right){
return (function (e){
return (dx_fn.cljs$core$IFn$_invoke$arity$2 ? dx_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end","end",-268185958),e) : dx_fn.call(null,new cljs.core.Keyword(null,"end","end",-268185958),e));
});})(seq__87961,chunk__87962,count__87963,i__87964,el,seq__87961__$1,temp__5804__auto__,handle_props,add_resizing_class_BANG_,remove_resizing_class_BANG_,_STAR_handle_left,_STAR_handle_right))
], null)], null))).styleCursor(false).on("dragstart",add_resizing_class_BANG_).on("dragend",remove_resizing_class_BANG_);


var G__89304 = cljs.core.next(seq__87961__$1);
var G__89305 = null;
var G__89306 = (0);
var G__89307 = (0);
seq__87961 = G__89304;
chunk__87962 = G__89305;
count__87963 = G__89306;
i__87964 = G__89307;
continue;
}
} else {
return null;
}
}
break;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element(daiquiri.core.fragment,null,[(function (){var attrs87965 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(handle_props,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_handle_left);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs87965))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["handle-left","image-resize"], null)], null),attrs87965], 0))):{'className':"handle-left image-resize"}),((cljs.core.map_QMARK_(attrs87965))?null:[daiquiri.interpreter.interpret(attrs87965)]));
})(),(function (){var attrs87966 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(handle_props,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_handle_right);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs87966))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["handle-right","image-resize"], null)], null),attrs87966], 0))):{'className':"handle-right image-resize"}),((cljs.core.map_QMARK_(attrs87966))?null:[daiquiri.interpreter.interpret(attrs87966)]));
})()]);
}),null,"frontend.components.block/resize-image-handles");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_resizing_image_QMARK_ !== 'undefined')){
} else {
frontend.components.block._STAR_resizing_image_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.block.resizable_image = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,title,src,metadata,full_text,local_QMARK_){
var breadcrumb_QMARK_ = new cljs.core.Keyword(null,"breadcrumb?","breadcrumb?",-1793266363).cljs$core$IFn$_invoke$arity$1(config);
var positioned_QMARK_ = new cljs.core.Keyword(null,"property-position","property-position",-1150084538).cljs$core$IFn$_invoke$arity$1(config);
var asset_block = new cljs.core.Keyword(null,"asset-block","asset-block",1420117445).cljs$core$IFn$_invoke$arity$1(config);
var asset_container = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.asset-container","div.asset-container",1221095823),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),"resize-asset-container"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"img.rounded-sm.relative","img.rounded-sm.relative",2026944242),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"loading","loading",-737050189),"lazy",new cljs.core.Keyword(null,"referrerPolicy","referrerPolicy",1008691405),"no-referrer",new cljs.core.Keyword(null,"src","src",-1651076051),src,new cljs.core.Keyword(null,"title","title",636505583),title], null),metadata], 0))], null),((((cljs.core.not(breadcrumb_QMARK_)) && (cljs.core.not(positioned_QMARK_))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var image_src = frontend.fs.asset_path_normalize(src);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".asset-action-bar",".asset-action-bar",1833566886),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"aria-hidden","aria-hidden",399337029),"true"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".flex",".flex",-73425686),((frontend.config.publishing_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","delete","asset/delete",-1860190756)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

var temp__5804__auto__ = (function (){var G__87968 = e.target;
var G__87968__$1 = (((G__87968 == null))?null:G__87968.closest("[blockid]"));
var G__87968__$2 = (((G__87968__$1 == null))?null:G__87968__$1.getAttribute("blockid"));
if((G__87968__$2 == null)){
return null;
} else {
return cljs.core.uuid(G__87968__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
var _STAR_local_selected_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(local_QMARK_);
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__87969 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.opacity-60.-my-2","div.text-xs.opacity-60.-my-2",1598990931),(cljs.core.truth_((function (){var and__5000__auto__ = local_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_block),block_id);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.gap-1.items-center","label.flex.gap-1.items-center",668901120),(function (){var G__87971 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-checked","default-checked",1039965863),cljs.core.deref(_STAR_local_selected_QMARK_),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__87967_SHARP_){
return cljs.core.reset_BANG_(_STAR_local_selected_QMARK_,p1__87967_SHARP_);
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__87971) : logseq.shui.ui.checkbox.call(null,G__87971));
})(),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","physical-delete","asset/physical-delete",1598822051)], 0))], null):null)], null);
var G__87970 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","confirm-delete","asset/confirm-delete",-559860835),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("text","image","text/image",-63229909)], 0)).toLocaleLowerCase()], 0)),new cljs.core.Keyword(null,"outside-cancel?","outside-cancel?",-1972964985),true], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2(G__87969,G__87970) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__87969,G__87970));
})(),(function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return frontend.handler.editor.delete_asset_of_block_BANG_(new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"asset-block","asset-block",1420117445),asset_block,new cljs.core.Keyword(null,"local?","local?",-1422786101),local_QMARK_,new cljs.core.Keyword(null,"delete-local?","delete-local?",1716577572),cljs.core.deref(_STAR_local_selected_QMARK_),new cljs.core.Keyword(null,"repo","repo",-1999060679),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"href","href",-793805698),src,new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"full-text","full-text",1432444182),full_text], null));
}));
} else {
return null;
}
})], null),frontend.ui.icon("trash")], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","copy","asset/copy",-867708909)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.util.copy_image_to_clipboard(image_src),(function (){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));
}));
})], null),frontend.ui.icon("copy")], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("asset","maximize","asset/maximize",-20255358)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.components.block.open_lightbox], null),frontend.ui.icon("maximize")], null),(cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.asset-action-btn","button.asset-action-btn",-1412633723),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(local_QMARK_)?new cljs.core.Keyword("asset","show-in-folder","asset/show-in-folder",1236393619):new cljs.core.Keyword("asset","open-in-browser","asset/open-in-browser",-915076141))], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"-1",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

if(cljs.core.truth_(local_QMARK_)){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openFileInFolder",image_src], 0));
} else {
return window.apis.openExternal(image_src);
}
})], null),logseq.shui.ui.tabler_icon("folder-pin")], null):null)], null)], null);
})()], null):null)], null);
var width = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(asset_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","resize-metadata","logseq.property.asset/resize-metadata",-1297523055),new cljs.core.Keyword(null,"width","width",-384071477)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(metadata);
}
})();
var _STAR_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.block","size","frontend.components.block/size",1026310526));
var width__$1 = (function (){var or__5002__auto__ = cljs.core.deref(_STAR_width);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return width;
}
})();
var style = (cljs.core.truth_(frontend.util.mobile_QMARK_())?null:(cljs.core.truth_(width__$1)?cljs.core.PersistentArrayMap.createAsIfByAssoc([(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config))?new cljs.core.Keyword(null,"max-width","max-width",-1939924051):new cljs.core.Keyword(null,"width","width",-384071477)),width__$1]):cljs.core.PersistentArrayMap.EMPTY
));
var resizable_QMARK_ = ((cljs.core.not(frontend.mobile.util.native_platform_QMARK_())) && (((cljs.core.not(breadcrumb_QMARK_)) && (cljs.core.not(positioned_QMARK_)))));
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"disable-resize?","disable-resize?",-1998248527).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(resizable_QMARK_));
}
})())){
return daiquiri.interpreter.interpret(asset_container);
} else {
var attrs87972 = (cljs.core.truth_(style)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs87972))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-resize-image","rounded-md"], null)], null),attrs87972], 0))):{'className':"ls-resize-image rounded-md"}),((cljs.core.map_QMARK_(attrs87972))?[daiquiri.interpreter.interpret(asset_container),frontend.components.block.resize_image_handles((function (k,event){
var dx = event.dx;
var target = event.target;
var G__87975 = k;
var G__87975__$1 = (((G__87975 instanceof cljs.core.Keyword))?G__87975.fqn:null);
switch (G__87975__$1) {
case "start":
var c = target.closest(".ls-resize-image");
cljs.core.reset_BANG_(_STAR_width,c.offsetWidth);

return cljs.core.reset_BANG_(frontend.components.block._STAR_resizing_image_QMARK_,true);

break;
case "move":
var width_SINGLEQUOTE_ = (cljs.core.deref(_STAR_width) + dx);
if((((width_SINGLEQUOTE_ > (60))) || ((!((dx < (0))))))){
return cljs.core.reset_BANG_(_STAR_width,width_SINGLEQUOTE_);
} else {
return null;
}

break;
case "end":
var width_SINGLEQUOTE_ = cljs.core.deref(_STAR_width);
if(cljs.core.truth_((function (){var and__5000__auto__ = width_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.components.block._STAR_resizing_image_QMARK_);
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___89309 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__87976 = config;
var G__87976__$1 = (((G__87976 == null))?null:new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(G__87976));
if((G__87976__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__87976__$1);
}
}
})();
if(cljs.core.truth_(temp__5804__auto___89309)){
var block_id_89310 = temp__5804__auto___89309;
frontend.handler.editor.resize_image_BANG_(config,block_id_89310,metadata,full_text,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),width_SINGLEQUOTE_], null));
} else {
}
} else {
}

return cljs.core.reset_BANG_(frontend.components.block._STAR_resizing_image_QMARK_,false);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__87975__$1)].join('')));

}
}))]:[daiquiri.interpreter.interpret(attrs87972),daiquiri.interpreter.interpret(asset_container),frontend.components.block.resize_image_handles((function (k,event){
var dx = event.dx;
var target = event.target;
var G__87979 = k;
var G__87979__$1 = (((G__87979 instanceof cljs.core.Keyword))?G__87979.fqn:null);
switch (G__87979__$1) {
case "start":
var c = target.closest(".ls-resize-image");
cljs.core.reset_BANG_(_STAR_width,c.offsetWidth);

return cljs.core.reset_BANG_(frontend.components.block._STAR_resizing_image_QMARK_,true);

break;
case "move":
var width_SINGLEQUOTE_ = (cljs.core.deref(_STAR_width) + dx);
if((((width_SINGLEQUOTE_ > (60))) || ((!((dx < (0))))))){
return cljs.core.reset_BANG_(_STAR_width,width_SINGLEQUOTE_);
} else {
return null;
}

break;
case "end":
var width_SINGLEQUOTE_ = cljs.core.deref(_STAR_width);
if(cljs.core.truth_((function (){var and__5000__auto__ = width_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.components.block._STAR_resizing_image_QMARK_);
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___89312 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__87980 = config;
var G__87980__$1 = (((G__87980 == null))?null:new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(G__87980));
if((G__87980__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__87980__$1);
}
}
})();
if(cljs.core.truth_(temp__5804__auto___89312)){
var block_id_89313 = temp__5804__auto___89312;
frontend.handler.editor.resize_image_BANG_(config,block_id_89313,metadata,full_text,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),width_SINGLEQUOTE_], null));
} else {
}
} else {
}

return cljs.core.reset_BANG_(frontend.components.block._STAR_resizing_image_QMARK_,false);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__87979__$1)].join('')));

}
}))]));
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.block","size","frontend.components.block/size",1026310526)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.components.block._STAR_resizing_image_QMARK_,false);

return state;
})], null)], null),"frontend.components.block/resizable-image");
frontend.components.block.audio_cp = rum.core.lazy_build(rum.core.build_defc,(function (src){
return daiquiri.core.create_element("audio",{'src':clojure.string.replace_first(src,logseq.common.config.asset_protocol,"file://"),'controls':true,'onTouchStart':(function (p1__87981_SHARP_){
return frontend.util.stop(p1__87981_SHARP_);
})},[]);
}),null,"frontend.components.block/audio-cp");
frontend.components.block.open_pdf_file = (function frontend$components$block$open_pdf_file(e,block,href){
var temp__5804__auto__ = (function (){var or__5002__auto__ = href;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__87982 = e.target;
var G__87982__$1 = (((G__87982 == null))?null:G__87982.dataset);
if((G__87982__$1 == null)){
return null;
} else {
return G__87982__$1.href;
}
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
var load$ = (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = href;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_((function (){var or__5002__auto____$1 = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.util.electron_QMARK_();
}
})())){
return s;
} else {
return frontend.handler.assets._LT_make_asset_url(s);
}
}
})()),(function (href__$1){
return promesa.protocols._promise((function (){var temp__5804__auto____$1 = frontend.extensions.pdf.assets.inflate_asset.cljs$core$IFn$_invoke$arity$variadic(s,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"href","href",-793805698),href__$1], null)], 0));
if(cljs.core.truth_(temp__5804__auto____$1)){
var current = temp__5804__auto____$1;
frontend.state.set_current_pdf_BANG_(current);

return frontend.util.stop(e);
} else {
return null;
}
})());
}));
}));
});
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(load$(),(function (_e){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(window.showOpenFilePicker(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"multiple","multiple",1244445549),false,new cljs.core.Keyword(null,"startIn","startIn",-557546565),"documents",new cljs.core.Keyword(null,"types","types",590030639),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"accept","accept",1874130431),new cljs.core.PersistentArrayMap(null, 1, ["application/pdf",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [".pdf"], null)], null)], null)], null)], null)))),(function (p__87983){
var vec__87984 = p__87983;
var handle = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87984,(0),null);
return promesa.protocols._mcat(promesa.protocols._promise(handle.getFile()),(function (file){
return promesa.protocols._mcat(promesa.protocols._promise(file.arrayBuffer()),(function (buffer){
return promesa.protocols._promise((function (){var temp__5804__auto____$1 = (function (){var G__87987 = buffer;
if((G__87987 == null)){
return null;
} else {
return (new Uint8Array(G__87987));
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var content = temp__5804__auto____$1;
var repo = frontend.state.get_current_repo();
var file_rpath = clojure.string.replace(s,/^[.\\/\\]*assets[\\/\\]+/,"assets/");
var dir = frontend.config.get_repo_dir(repo);
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.fs.write_plain_text_file_BANG_(repo,dir,file_rpath,content,null),load$);
} else {
return null;
}
})());
}));
}));
}));
}));

return console.error(_e);
}));
} else {
return null;
}
});
frontend.components.block.asset_link = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,title,href,metadata,full_text){
var src = new cljs.core.Keyword("frontend.components.block","src","frontend.components.block/src",807373780).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
var href__$1 = frontend.config.get_local_asset_absolute_path(href);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = db_based_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.deref(src) == null);
} else {
return and__5000__auto__;
}
})())){
promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.assets._LT_make_asset_url(href__$1),(function (p1__87988_SHARP_){
return cljs.core.reset_BANG_(src,logseq.common.util.safe_decode_uri_component(p1__87988_SHARP_));
}));
} else {
}

if(cljs.core.truth_(cljs.core.deref(src))){
var ext = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = frontend.util.get_file_ext(cljs.core.deref(src));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.get_file_ext(href__$1);
}
})());
var repo__$1 = frontend.state.get_current_repo();
var repo_dir = frontend.config.get_repo_dir(repo__$1);
var path = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_dir),href__$1].join('');
var share_fn = (function (event){
frontend.util.stop(event);

if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
var vec__87990 = frontend.util.get_dir_and_basename(href__$1);
var rel_dir = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87990,(0),null);
var basename = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87990,(1),null);
var rel_dir__$1 = clojure.string.replace(rel_dir,/^\/+/,"");
var asset_url = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rel_dir__$1,basename], 0));
return frontend.mobile.intent.open_or_share_file(asset_url);
} else {
return null;
}
});
if(cljs.core.contains_QMARK_(frontend.config.audio_formats,ext)){
if(db_based_QMARK_){
return frontend.components.block.audio_cp(cljs.core.deref(src));
} else {
return frontend.components.block.file_based_asset_loader(cljs.core.deref(src),(function (){
return frontend.components.block.audio_cp(cljs.core.deref(src));
}));
}
} else {
if(cljs.core.contains_QMARK_(frontend.config.video_formats,ext)){
return daiquiri.core.create_element("video",{'src':cljs.core.deref(src),'controls':true},[]);
} else {
if(cljs.core.contains_QMARK_(logseq.common.config.img_formats(),ext)){
if(db_based_QMARK_){
return frontend.components.block.resizable_image(config,title,cljs.core.deref(src),metadata,full_text,true);
} else {
return frontend.components.block.file_based_asset_loader(cljs.core.deref(src),(function (){
return frontend.components.block.resizable_image(config,title,cljs.core.deref(src),metadata,full_text,true);
}));
}
} else {
if((((!(db_based_QMARK_))) && (cljs.core.contains_QMARK_(logseq.common.config.text_formats(),ext)))){
return daiquiri.core.create_element("a",{'href':reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),path], null)),'onClick':(function (_event){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,path)),(function (result){
return promesa.protocols._promise(frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3(repo__$1,path,result));
}));
}));
}),'className':"asset-ref is-plaintext"},[daiquiri.interpreter.interpret(title)]);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ext,new cljs.core.Keyword(null,"pdf","pdf",1586765132))){
return daiquiri.core.create_element("a",{'data-href':href__$1,'data-url':cljs.core.deref(src),'draggable':true,'onDragStart':(function (p1__87989_SHARP_){
return frontend.components.block.goog$module$goog$object.get(p1__87989_SHARP_,"dataTransfer").setData("file",href__$1);
}),'onClick':(function (e){
frontend.util.stop(e);

return frontend.components.block.open_pdf_file(e,new cljs.core.Keyword(null,"asset-block","asset-block",1420117445).cljs$core$IFn$_invoke$arity$1(config),cljs.core.deref(src));
}),'className':"asset-ref is-pdf"},[((db_based_QMARK_)?daiquiri.interpreter.interpret(title):daiquiri.core.create_element("span",null,[daiquiri.core.create_element("span",{'className':"opacity-70"},["[[\uD83D\uDCDA"]),daiquiri.interpreter.interpret(title),daiquiri.core.create_element("span",{'className':"opacity-70"},["]]"])]))]);
} else {
if(db_based_QMARK_){
var file_name = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"asset-block","asset-block",1420117445).cljs$core$IFn$_invoke$arity$1(config))),".",cljs.core.name(ext)].join('');
return daiquiri.core.create_element("a",{'href':cljs.core.deref(src),'download':file_name,'className':"asset-ref is-plaintext"},[file_name]);
} else {
return daiquiri.core.create_element("a",{'href':cljs.core.deref(src),'onClick':share_fn,'className':"asset-ref"},[daiquiri.interpreter.interpret(title)]);

}
}
}
}
}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.block","src","frontend.components.block/src",807373780))], null),"frontend.components.block/asset-link");
frontend.components.block.image_link = (function frontend$components$block$image_link(config,url,href,label,metadata,full_text){
var metadata__$1 = ((clojure.string.blank_QMARK_(metadata))?null:logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(metadata));
var title = cljs.core.second(cljs.core.first(label));
var repo = frontend.state.get_current_repo();
return frontend.ui.catch_error(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning","span.warning",-711839668),full_text], null),(cljs.core.truth_((function (){var and__5000__auto__ = logseq.common.config.local_asset_QMARK_(href);
if(cljs.core.truth_(and__5000__auto__)){
return ((frontend.config.local_file_based_graph_QMARK_(repo)) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
} else {
return and__5000__auto__;
}
})())?frontend.components.block.asset_link(config,title,href,metadata__$1,full_text):(function (){var href__$1 = ((frontend.util.starts_with_QMARK_(href,"http"))?href:((frontend.config.publishing_QMARK_)?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(href,(1)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Embed_data",cljs.core.first(url)))?href:(cljs.core.truth_(frontend.handler.assets.check_alias_path_QMARK_(href))?frontend.handler.assets.normalize_asset_resource_url(href):frontend.components.block.get_file_absolute_path(config,href))
)));
return frontend.components.block.resizable_image(config,title,href__$1,metadata__$1,full_text,false);
})()));
});
frontend.components.block.timestamp_to_string = frontend.handler.export$.common.timestamp_to_string;
frontend.components.block.timestamp = (function frontend$components$block$timestamp(p__87997,kind){
var map__87998 = p__87997;
var map__87998__$1 = cljs.core.__destructure_map(map__87998);
var t = map__87998__$1;
var active = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87998__$1,new cljs.core.Keyword(null,"active","active",1895962068));
var _date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87998__$1,new cljs.core.Keyword(null,"_date","_date",-937395064));
var _time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87998__$1,new cljs.core.Keyword(null,"_time","_time",-1976647311));
var _repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87998__$1,new cljs.core.Keyword(null,"_repetition","_repetition",922325838));
var _wday = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87998__$1,new cljs.core.Keyword(null,"_wday","_wday",-1455464025));
var prefix = (function (){var G__87999 = kind;
switch (G__87999) {
case "Scheduled":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"fa fa-calendar",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),3.5], null)], null)], null);

break;
case "Deadline":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"fa fa-calendar-times-o",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),3.5], null)], null)], null);

break;
case "Date":
return null;

break;
case "Closed":
return null;

break;
case "Started":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"fa fa-clock-o",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),3.5], null)], null)], null);

break;
case "Start":
return "From: ";

break;
case "Stop":
return "To: ";

break;
default:
return null;

}
})();
var class$ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kind,"Closed"))?"line-through":null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.timestamp","span.timestamp",1207246744),(function (){var G__88000 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core.str.cljs$core$IFn$_invoke$arity$1(active)], null);
if(cljs.core.truth_(class$)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88000,new cljs.core.Keyword(null,"class","class",-2030961996),class$);
} else {
return G__88000;
}
})(),prefix,(frontend.components.block.timestamp_to_string.cljs$core$IFn$_invoke$arity$1 ? frontend.components.block.timestamp_to_string.cljs$core$IFn$_invoke$arity$1(t) : frontend.components.block.timestamp_to_string.call(null,t))], null);
});
frontend.components.block.range = (function frontend$components$block$range(p__88001,stopped_QMARK_){
var map__88002 = p__88001;
var map__88002__$1 = cljs.core.__destructure_map(map__88002);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88002__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var stop = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88002__$1,new cljs.core.Keyword(null,"stop","stop",-2140911342));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"timestamp-range",new cljs.core.Keyword(null,"stopped","stopped",-1490414640),stopped_QMARK_], null),frontend.components.block.timestamp(start,"Start"),frontend.components.block.timestamp(stop,"Stop")], null);
});
frontend.components.block.open_page_ref = (function frontend$components$block$open_page_ref(config,page_entity,e,page_name,contents_page_QMARK_){
if((!(frontend.util.right_click_QMARK_(e)))){
var ignore_alias_QMARK__89315 = new cljs.core.Keyword(null,"ignore-alias?","ignore-alias?",1336725364).cljs$core$IFn$_invoke$arity$1(config);
var page_89316 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.not(ignore_alias_QMARK__89315);
if(and__5000__auto__){
return cljs.core.first(new cljs.core.Keyword("block","_alias","block/_alias",444442061).cljs$core$IFn$_invoke$arity$1(page_entity));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_entity;
}
})();
if(cljs.core.truth_(frontend.components.block.goog$module$goog$object.get(e,"shiftKey"))){
if(cljs.core.truth_(page_89316)){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_89316),new cljs.core.Keyword(null,"page","page",849072397));
} else {
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.whiteboard.inside_portal_QMARK_(e.target);
} else {
return and__5000__auto__;
}
})())){
frontend.handler.whiteboard.add_new_block_portal_shape_BANG_(page_name,frontend.handler.whiteboard.closest_shape(e.target));
} else {
if((page_89316 == null)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","create","page/create",-1304816391),page_name], null));
} else {
if(((cljs.core.fn_QMARK_(new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138).cljs$core$IFn$_invoke$arity$1(config))) && (cljs.core.not((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.button,(1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = e.metaKey;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return e.ctrlKey;
}
}
})())))){
var fexpr__88003_89317 = new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138).cljs$core$IFn$_invoke$arity$1(config);
(fexpr__88003_89317.cljs$core$IFn$_invoke$arity$1 ? fexpr__88003_89317.cljs$core$IFn$_invoke$arity$1(e) : fexpr__88003_89317.call(null,e));
} else {
var f_89318 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"on-redirect-to-page","on-redirect-to-page",-1420791266).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.route.redirect_to_page_BANG_;
}
})();
var G__88004_89319 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_89316);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_89316);
}
})();
var G__88005_89320 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ignore-alias?","ignore-alias?",1336725364),ignore_alias_QMARK__89315], null);
(f_89318.cljs$core$IFn$_invoke$arity$2 ? f_89318.cljs$core$IFn$_invoke$arity$2(G__88004_89319,G__88005_89320) : f_89318.call(null,G__88004_89319,G__88005_89320));

}
}
}
}
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = contents_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.util.mobile_QMARK_();
if(cljs.core.truth_(and__5000__auto____$1)){
return frontend.state.get_left_sidebar_open_QMARK_();
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.ui.close_left_sidebar_BANG_();
} else {
return null;
}
});
/**
 * The inner div of page reference component
 * 
 * page-name-in-block is the overridable name of the page (legacy)
 * 
 * All page-names are sanitized except page-name-in-block
 */
frontend.components.block.page_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__88079,page_entity,children,label){
var map__88080 = p__88079;
var map__88080__$1 = cljs.core.__destructure_map(map__88080);
var config = map__88080__$1;
var contents_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88080__$1,new cljs.core.Keyword(null,"contents-page?","contents-page?",2137383699));
var whiteboard_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88080__$1,new cljs.core.Keyword(null,"whiteboard-page?","whiteboard-page?",1626270426));
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88080__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var show_unique_title_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88080__$1,new cljs.core.Keyword(null,"show-unique-title?","show-unique-title?",-1545303427));
var stop_click_event_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__88080__$1,new cljs.core.Keyword(null,"stop-click-event?","stop-click-event?",-1661319069),true);
var on_context_menu = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88080__$1,new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340));
var _STAR_hover_QMARK_ = new cljs.core.Keyword("frontend.components.block","hover?","frontend.components.block/hover?",-1558832434).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_mouse_down_QMARK_ = new cljs.core.Keyword("frontend.components.block","mouse-down?","frontend.components.block/mouse-down?",-1962704689).cljs$core$IFn$_invoke$arity$1(state);
var tag_QMARK_ = new cljs.core.Keyword(null,"tag?","tag?",1714008252).cljs$core$IFn$_invoke$arity$1(config);
var page_name = (cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity))?(function (){var G__88081 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__88081) : frontend.util.page_name_sanity_lc.call(null,G__88081));
})():null);
var breadcrumb_QMARK_ = new cljs.core.Keyword(null,"breadcrumb?","breadcrumb?",-1793266363).cljs$core$IFn$_invoke$arity$1(config);
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"whiteboard-page?","whiteboard-page?",1626270426),whiteboard_page_QMARK_);
var untitled_QMARK_ = (cljs.core.truth_(page_name)?frontend.db.model.untitled_page_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity)):null);
var show_icon_QMARK_ = new cljs.core.Keyword(null,"show-icon?","show-icon?",-756836459).cljs$core$IFn$_invoke$arity$1(config__$1);
var attrs88012 = (function (){var G__88082 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),new cljs.core.Keyword(null,"on-click","on-click",1632826543),new cljs.core.Keyword(null,"on-pointer-up","on-pointer-up",385194000),new cljs.core.Keyword(null,"on-key-up","on-key-up",884441808),new cljs.core.Keyword(null,"on-drag-start","on-drag-start",-47712205),new cljs.core.Keyword(null,"draggable","draggable",1676206163),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"data-ref","data-ref",-1090558888),new cljs.core.Keyword(null,"on-mouse-leave","on-mouse-leave",-1864319528),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138)],["0",(function (e){
if(cljs.core.truth_(stop_click_event_QMARK_)){
return frontend.util.stop(e);
} else {
return null;
}
}),(function (e){
if(cljs.core.truth_(cljs.core.deref(_STAR_mouse_down_QMARK_))){
frontend.util.stop(e);

frontend.state.clear_edit_BANG_();

if(cljs.core.truth_(new cljs.core.Keyword(null,"disable-click?","disable-click?",-1186799869).cljs$core$IFn$_invoke$arity$1(config__$1))){
} else {
frontend.components.block.open_page_ref(config__$1,page_entity,e,page_name,contents_page_QMARK_);
}

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,false);
} else {
return null;
}
}),(function (e){
if(cljs.core.truth_((function (){var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.key,"Enter")) && (cljs.core.not(other_position_QMARK_)));
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

frontend.state.clear_edit_BANG_();

return frontend.components.block.open_page_ref(config__$1,page_entity,e,page_name,contents_page_QMARK_);
} else {
return null;
}
}),(function (e){
return frontend.handler.editor.block__GT_data_transfer_BANG_(page_name,e,true);
}),true,(function (){var G__88083 = (cljs.core.truth_(tag_QMARK_)?"tag":"page-ref");
var G__88083__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1))?[G__88083," page-property-key block-property"].join(''):G__88083);
if(cljs.core.truth_(untitled_QMARK_)){
return [G__88083__$1," opacity-50"].join('');
} else {
return G__88083__$1;
}
})(),page_name,(function (){
return cljs.core.reset_BANG_(_STAR_hover_QMARK_,false);
}),(function (){
return cljs.core.reset_BANG_(_STAR_hover_QMARK_,true);
}),(function (e){
if(cljs.core.truth_((function (){var and__5000__auto__ = on_context_menu;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),e.button);
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = other_position_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.meta_key_QMARK_(e);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = other_position_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.util.shift_key_QMARK_(e));
} else {
return and__5000__auto__;
}
})())){
var G__88084 = e.target;
var G__88084__$1 = (((G__88084 == null))?null:G__88084.closest(".jtrigger"));
if((G__88084__$1 == null)){
return null;
} else {
return G__88084__$1.click();
}
} else {
if(cljs.core.truth_(breadcrumb_QMARK_)){
return e.preventDefault();
} else {
e.preventDefault();

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);

}
}
}
}
})]);
if(cljs.core.truth_(on_context_menu)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88082,new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340),on_context_menu);
} else {
return G__88082;
}
})();
return daiquiri.core.create_element("a",((cljs.core.map_QMARK_(attrs88012))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative"], null)], null),attrs88012], 0))):{'className':"relative"}),((cljs.core.map_QMARK_(attrs88012))?[(cljs.core.truth_((function (){var and__5000__auto__ = show_icon_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(tag_QMARK_);
} else {
return and__5000__auto__;
}
})())?(function (){var own_icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(page_entity,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)));
var emoji_QMARK_ = ((cljs.core.map_QMARK_(own_icon)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(own_icon),new cljs.core.Keyword(null,"emoji","emoji",1031230144))));
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.components.icon.get_node_icon_cp(page_entity,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true,new cljs.core.Keyword(null,"not-text-or-page?","not-text-or-page?",1103352804),true,new cljs.core.Keyword(null,"own-icon?","own-icon?",-1404102266),true], null));
if(cljs.core.truth_(temp__5804__auto__)){
var icon = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["icon-emoji-wrap ",((emoji_QMARK_)?"as-emoji":null)].join('')], null),icon], null);
} else {
return null;
}
})());
})():null),(function (){var attrs88045 = ((((cljs.core.coll_QMARK_(children)) && (cljs.core.seq(children))))?(function (){var iter__5480__auto__ = (function frontend$components$block$iter__88085(s__88086){
return (new cljs.core.LazySeq(null,(function (){
var s__88086__$1 = s__88086;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88086__$1);
if(temp__5804__auto__){
var s__88086__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88086__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88086__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88088 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88087 = (0);
while(true){
if((i__88087 < size__5479__auto__)){
var child = cljs.core._nth(c__5478__auto__,i__88087);
cljs.core.chunk_append(b__88088,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(child),"Label"))?cljs.core.last(child):(function (){var map__88089 = cljs.core.last(child);
var map__88089__$1 = cljs.core.__destructure_map(map__88089);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88089__$1,new cljs.core.Keyword(null,"content","content",15833224));
var children__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88089__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var page_name__$1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return rum.core.with_key((function (){var G__88090 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"children","children",-940561982),children__$1);
var G__88091 = page_name__$1;
var G__88092 = null;
return (frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3(G__88090,G__88091,G__88092) : frontend.components.block.page_reference.call(null,G__88090,G__88091,G__88092));
})(),page_name__$1);
})()));

var G__89321 = (i__88087 + (1));
i__88087 = G__89321;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88088),frontend$components$block$iter__88085(cljs.core.chunk_rest(s__88086__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88088),null);
}
} else {
var child = cljs.core.first(s__88086__$2);
return cljs.core.cons(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(child),"Label"))?cljs.core.last(child):(function (){var map__88093 = cljs.core.last(child);
var map__88093__$1 = cljs.core.__destructure_map(map__88093);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88093__$1,new cljs.core.Keyword(null,"content","content",15833224));
var children__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88093__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var page_name__$1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return rum.core.with_key((function (){var G__88094 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"children","children",-940561982),children__$1);
var G__88095 = page_name__$1;
var G__88096 = null;
return (frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3(G__88094,G__88095,G__88096) : frontend.components.block.page_reference.call(null,G__88094,G__88095,G__88096));
})(),page_name__$1);
})()),frontend$components$block$iter__88085(cljs.core.rest(s__88086__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(children);
})():(function (){var page_component = (cljs.core.truth_((function (){var and__5000__auto__ = label;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof label === 'string') && ((!(clojure.string.blank_QMARK_(label)))));
} else {
return and__5000__auto__;
}
})())?label:((cljs.core.coll_QMARK_(label))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span","span",1394872991),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$1,label) : frontend.components.block.map_inline.call(null,config__$1,label))):(cljs.core.truth_(show_unique_title_QMARK_)?frontend.handler.block.block_unique_title(page_entity):(function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
var s = (cljs.core.truth_(untitled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0)):(cljs.core.truth_(frontend.extensions.pdf.utils.hls_file_QMARK_(page_name))?frontend.extensions.pdf.utils.fix_local_asset_pagename(page_name):((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(title) : frontend.util.safe_page_name_sanity_lc.call(null,title)),page_name))?page_name:(cljs.core.truth_(title)?frontend.util.trim_safe(title):frontend.util.trim_safe(page_name)
))));
var _ = (cljs.core.truth_(page_entity)?null:console.warn("page-inner's page-entity is nil, given page-name: ",page_name));
var s__$1 = (((!(typeof s === 'string')))?(function (){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"unknown-title-error","unknown-title-error",2050078621),new cljs.core.Keyword(null,"title","title",636505583),s,new cljs.core.Keyword(null,"data","data",-232669377),(function (){var G__88097 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__88097) : frontend.db.pull.call(null,G__88097));
})()], 0));

return "Unknown title";
})()
:(cljs.core.truth_(cljs.core.re_find(logseq.db.frontend.content.id_ref_pattern,s))?logseq.db.frontend.content.content_id_ref__GT_page(s,new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(page_entity)):s
));
var s__$2 = (cljs.core.truth_((function (){var and__5000__auto__ = tag_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"hide-tag-symbol?","hide-tag-symbol?",1083852788).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})())?["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s__$1)].join(''):s__$1);
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page_entity) : logseq.db.page_QMARK_.call(null,page_entity)))){
return s__$2;
} else {
var G__88098 = config__$1;
var G__88099 = page_entity;
var G__88100 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.components.block.block_title.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.block_title.cljs$core$IFn$_invoke$arity$3(G__88098,G__88099,G__88100) : frontend.components.block.block_title.call(null,G__88098,G__88099,G__88100));
}
})()
)));
return page_component;
})());
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs88045))?daiquiri.interpreter.element_attributes(attrs88045):null),((cljs.core.map_QMARK_(attrs88045))?null:[daiquiri.interpreter.interpret(attrs88045)]));
})()]:[daiquiri.interpreter.interpret(attrs88012),(cljs.core.truth_((function (){var and__5000__auto__ = show_icon_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(tag_QMARK_);
} else {
return and__5000__auto__;
}
})())?(function (){var own_icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(page_entity,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)));
var emoji_QMARK_ = ((cljs.core.map_QMARK_(own_icon)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(own_icon),new cljs.core.Keyword(null,"emoji","emoji",1031230144))));
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.components.icon.get_node_icon_cp(page_entity,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true,new cljs.core.Keyword(null,"not-text-or-page?","not-text-or-page?",1103352804),true,new cljs.core.Keyword(null,"own-icon?","own-icon?",-1404102266),true], null));
if(cljs.core.truth_(temp__5804__auto__)){
var icon = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["icon-emoji-wrap ",((emoji_QMARK_)?"as-emoji":null)].join('')], null),icon], null);
} else {
return null;
}
})());
})():null),(function (){var attrs88078 = ((((cljs.core.coll_QMARK_(children)) && (cljs.core.seq(children))))?(function (){var iter__5480__auto__ = (function frontend$components$block$iter__88101(s__88102){
return (new cljs.core.LazySeq(null,(function (){
var s__88102__$1 = s__88102;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88102__$1);
if(temp__5804__auto__){
var s__88102__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88102__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88102__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88104 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88103 = (0);
while(true){
if((i__88103 < size__5479__auto__)){
var child = cljs.core._nth(c__5478__auto__,i__88103);
cljs.core.chunk_append(b__88104,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(child),"Label"))?cljs.core.last(child):(function (){var map__88105 = cljs.core.last(child);
var map__88105__$1 = cljs.core.__destructure_map(map__88105);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88105__$1,new cljs.core.Keyword(null,"content","content",15833224));
var children__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88105__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var page_name__$1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return rum.core.with_key((function (){var G__88106 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"children","children",-940561982),children__$1);
var G__88107 = page_name__$1;
var G__88108 = null;
return (frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3(G__88106,G__88107,G__88108) : frontend.components.block.page_reference.call(null,G__88106,G__88107,G__88108));
})(),page_name__$1);
})()));

var G__89322 = (i__88103 + (1));
i__88103 = G__89322;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88104),frontend$components$block$iter__88101(cljs.core.chunk_rest(s__88102__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88104),null);
}
} else {
var child = cljs.core.first(s__88102__$2);
return cljs.core.cons(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(child),"Label"))?cljs.core.last(child):(function (){var map__88109 = cljs.core.last(child);
var map__88109__$1 = cljs.core.__destructure_map(map__88109);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88109__$1,new cljs.core.Keyword(null,"content","content",15833224));
var children__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88109__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var page_name__$1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return rum.core.with_key((function (){var G__88110 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"children","children",-940561982),children__$1);
var G__88111 = page_name__$1;
var G__88112 = null;
return (frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.page_reference.cljs$core$IFn$_invoke$arity$3(G__88110,G__88111,G__88112) : frontend.components.block.page_reference.call(null,G__88110,G__88111,G__88112));
})(),page_name__$1);
})()),frontend$components$block$iter__88101(cljs.core.rest(s__88102__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(children);
})():(function (){var page_component = (cljs.core.truth_((function (){var and__5000__auto__ = label;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof label === 'string') && ((!(clojure.string.blank_QMARK_(label)))));
} else {
return and__5000__auto__;
}
})())?label:((cljs.core.coll_QMARK_(label))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span","span",1394872991),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$1,label) : frontend.components.block.map_inline.call(null,config__$1,label))):(cljs.core.truth_(show_unique_title_QMARK_)?frontend.handler.block.block_unique_title(page_entity):(function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
var s = (cljs.core.truth_(untitled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0)):(cljs.core.truth_(frontend.extensions.pdf.utils.hls_file_QMARK_(page_name))?frontend.extensions.pdf.utils.fix_local_asset_pagename(page_name):((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.safe_page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(title) : frontend.util.safe_page_name_sanity_lc.call(null,title)),page_name))?page_name:(cljs.core.truth_(title)?frontend.util.trim_safe(title):frontend.util.trim_safe(page_name)
))));
var _ = (cljs.core.truth_(page_entity)?null:console.warn("page-inner's page-entity is nil, given page-name: ",page_name));
var s__$1 = (((!(typeof s === 'string')))?(function (){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"unknown-title-error","unknown-title-error",2050078621),new cljs.core.Keyword(null,"title","title",636505583),s,new cljs.core.Keyword(null,"data","data",-232669377),(function (){var G__88113 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__88113) : frontend.db.pull.call(null,G__88113));
})()], 0));

return "Unknown title";
})()
:(cljs.core.truth_(cljs.core.re_find(logseq.db.frontend.content.id_ref_pattern,s))?logseq.db.frontend.content.content_id_ref__GT_page(s,new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(page_entity)):s
));
var s__$2 = (cljs.core.truth_((function (){var and__5000__auto__ = tag_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"hide-tag-symbol?","hide-tag-symbol?",1083852788).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})())?["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s__$1)].join(''):s__$1);
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page_entity) : logseq.db.page_QMARK_.call(null,page_entity)))){
return s__$2;
} else {
var G__88114 = config__$1;
var G__88115 = page_entity;
var G__88116 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.components.block.block_title.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.block_title.cljs$core$IFn$_invoke$arity$3(G__88114,G__88115,G__88116) : frontend.components.block.block_title.call(null,G__88114,G__88115,G__88116));
}
})()
)));
return page_component;
})());
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs88078))?daiquiri.interpreter.element_attributes(attrs88078):null),((cljs.core.map_QMARK_(attrs88078))?null:[daiquiri.interpreter.interpret(attrs88078)]));
})()]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","mouse-down?","frontend.components.block/mouse-down?",-1962704689)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","hover?","frontend.components.block/hover?",-1558832434))], null),"frontend.components.block/page-inner");
frontend.components.block.popup_preview_impl = rum.core.lazy_build(rum.core.build_defc,(function (children,p__88117){
var map__88118 = p__88117;
var map__88118__$1 = cljs.core.__destructure_map(map__88118);
var _STAR_timer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"*timer","*timer",-637700106));
var _STAR_timer1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"*timer1","*timer1",605841781));
var visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"visible?","visible?",2129863715));
var set_visible_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"set-visible!","set-visible!",-1042705644));
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
var _STAR_el_popup = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88118__$1,new cljs.core.Keyword(null,"*el-popup","*el-popup",627144628));
var _STAR_el_trigger = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
logseq.shui.hooks.use_effect_BANG_((function (){
if(visible_QMARK_ === true){
var G__88119_89323 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_trigger) : logseq.shui.hooks.deref.call(null,_STAR_el_trigger));
var G__88120_89324 = render;
var G__88121_89325 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onOpenChange","onOpenChange",-675762944),(function (v){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(v) : set_visible_BANG_.call(null,v));
}),new cljs.core.Keyword(null,"modal","modal",-1031880850),false], null),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-preview-popup",new cljs.core.Keyword(null,"onInteractOutside","onInteractOutside",-1720265251),(function (e){
return e.preventDefault();
}),new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (e){
if(frontend.state.editing_QMARK_()){
e.preventDefault();

var G__88122 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_popup) : logseq.shui.hooks.deref.call(null,_STAR_el_popup));
if((G__88122 == null)){
return null;
} else {
return G__88122.focus();
}
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),false], null);
(logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__88119_89323,G__88120_89324,G__88121_89325) : logseq.shui.ui.popup_show_BANG_.call(null,G__88119_89323,G__88120_89324,G__88121_89325));
} else {
}

if(visible_QMARK_ === false){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

if(cljs.core.truth_(frontend.state.get_edit_block())){
frontend.state.clear_edit_BANG_();
} else {
}
} else {
}

(logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_timer,null) : logseq.shui.hooks.set_ref_BANG_.call(null,_STAR_timer,null));

(logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_timer1,null) : logseq.shui.hooks.set_ref_BANG_.call(null,_STAR_timer1,null));

return (function (){
if(cljs.core.truth_(visible_QMARK_)){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return null;
}
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [visible_QMARK_], null));

return daiquiri.core.create_element("span",{'ref':_STAR_el_trigger,'onMouseEnter':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__88123 = e.target;
if((G__88123 == null)){
return null;
} else {
return G__88123.closest(".preview-ref-link");
}
})(),(logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_trigger) : logseq.shui.hooks.deref.call(null,_STAR_el_trigger)))){
var timer = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer) : logseq.shui.hooks.deref.call(null,_STAR_timer));
var timer1 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer1) : logseq.shui.hooks.deref.call(null,_STAR_timer1));
if(cljs.core.truth_(timer)){
} else {
var G__88124_89326 = _STAR_timer;
var G__88125_89327 = setTimeout((function (){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_visible_BANG_.call(null,true));
}),(1000));
(logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(G__88124_89326,G__88125_89327) : logseq.shui.hooks.set_ref_BANG_.call(null,G__88124_89326,G__88125_89327));
}

if(cljs.core.truth_(timer1)){
clearTimeout(timer1);

return (logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_timer1,null) : logseq.shui.hooks.set_ref_BANG_.call(null,_STAR_timer1,null));
} else {
return null;
}
} else {
return null;
}
}),'onMouseLeave':(function (){
var timer = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer) : logseq.shui.hooks.deref.call(null,_STAR_timer));
var timer1 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer1) : logseq.shui.hooks.deref.call(null,_STAR_timer1));
if(((typeof timer === 'number') || (typeof timer1 === 'number'))){
if(cljs.core.truth_(timer)){
clearTimeout(timer);

(logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_timer,null) : logseq.shui.hooks.set_ref_BANG_.call(null,_STAR_timer,null));
} else {
}

if(cljs.core.truth_(timer1)){
return null;
} else {
var G__88126 = _STAR_timer1;
var G__88127 = setTimeout((function (){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_visible_BANG_.call(null,false));
}),(300));
return (logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(G__88126,G__88127) : logseq.shui.hooks.set_ref_BANG_.call(null,G__88126,G__88127));
}
} else {
return null;
}
}),'className':"preview-ref-link"},[daiquiri.interpreter.interpret(children)]);
}),null,"frontend.components.block/popup-preview-impl");
frontend.components.block.page_preview_trigger = rum.core.lazy_build(rum.core.build_defc,(function (p__88128,page_entity){
var map__88129 = p__88128;
var map__88129__$1 = cljs.core.__destructure_map(map__88129);
var config = map__88129__$1;
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88129__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88129__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88129__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var manual_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88129__$1,new cljs.core.Keyword(null,"manual?","manual?",1839586876));
var _STAR_timer = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_timer1 = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_el_popup = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_el_wrap = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__88130 = rum.core.use_state(null);
var in_popup_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88130,(0),null);
var set_in_popup_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88130,(1),null);
var vec__88133 = rum.core.use_state(null);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88133,(0),null);
var set_visible_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88133,(1),null);
var _ = frontend.components.block.preview_render = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__88136 = rum.core.use_state(false);
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88136,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88136,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var el_popup = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_popup) : logseq.shui.hooks.deref.call(null,_STAR_el_popup));
var focus_BANG_ = (function (){
return setTimeout((function (){
return el_popup.focus();
}));
});
(set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));

focus_BANG_();

return (function (){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_visible_BANG_.call(null,false));
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var or__5002__auto__ = (function (){var G__88145 = frontend.state.get_current_repo();
var G__88146 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
return (frontend.db.get_alias_source_page.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_alias_source_page.cljs$core$IFn$_invoke$arity$2(G__88145,G__88146) : frontend.db.get_alias_source_page.call(null,G__88145,G__88146));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_entity;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var source = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tippy-wrapper.as-page","div.tippy-wrapper.as-page",-1396021158),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el_popup,new cljs.core.Keyword(null,"tab-index","tab-index",895755393),(-1),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"width","width",-384071477),(600),new cljs.core.Keyword(null,"text-align","text-align",1786091845),"left",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),(500),new cljs.core.Keyword(null,"padding-bottom","padding-bottom",-1899795591),(64)], null),new cljs.core.Keyword(null,"on-mouse-enter","on-mouse-enter",-1664921661),(function (){
var temp__5804__auto____$1 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer1) : logseq.shui.hooks.deref.call(null,_STAR_timer1));
if(cljs.core.truth_(temp__5804__auto____$1)){
var timer1 = temp__5804__auto____$1;
return clearTimeout(timer1);
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-mouse-leave","on-mouse-leave",-1864319528),(function (){
if(frontend.ui.last_shui_preview_popup_QMARK_()){
var G__88147 = _STAR_timer1;
var G__88148 = setTimeout((function (){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_visible_BANG_.call(null,false));
}),(500));
return (logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(G__88147,G__88148) : logseq.shui.hooks.set_ref_BANG_.call(null,G__88147,G__88148));
} else {
return null;
}
})], null),(function (){var temp__5804__auto____$1 = (function (){var and__5000__auto__ = ready_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_page_blocks_cp();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_cp = temp__5804__auto____$1;
var G__88149 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"repo","repo",-1999060679),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"page-name","page-name",974981762),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(source)),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"scroll-container","scroll-container",-1938238550),(function (){var G__88150 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_popup) : logseq.shui.hooks.deref.call(null,_STAR_el_popup));
if((G__88150 == null)){
return null;
} else {
return G__88150.closest(".ls-preview-popup");
}
})(),new cljs.core.Keyword(null,"preview?","preview?",590561578),true], null);
return (page_cp.cljs$core$IFn$_invoke$arity$1 ? page_cp.cljs$core$IFn$_invoke$arity$1(G__88149) : page_cp.call(null,G__88149));
} else {
return null;
}
})()], null);
} else {
return null;
}
})());
}),null,"frontend.components.block/preview-render");
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var G__88151 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_el_wrap) : logseq.shui.hooks.deref.call(null,_STAR_el_wrap));
if((G__88151 == null)){
return null;
} else {
return G__88151.closest("[data-radix-popper-content-wrapper]");
}
})())){
return (set_in_popup_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_in_popup_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_in_popup_BANG_.call(null,true));
} else {
return (set_in_popup_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_in_popup_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_in_popup_BANG_.call(null,false));
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("span",{'ref':_STAR_el_wrap},[((cljs.core.boolean_QMARK_(in_popup_QMARK_))?(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(new cljs.core.Keyword(null,"preview?","preview?",590561578).cljs$core$IFn$_invoke$arity$1(config));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(in_popup_QMARK_));
if(and__5000__auto____$1){
var or__5002__auto__ = cljs.core.not(manual_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return open_QMARK_;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.popup_preview_impl(children,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),visible_QMARK_,new cljs.core.Keyword(null,"set-visible!","set-visible!",-1042705644),set_visible_BANG_,new cljs.core.Keyword(null,"*timer","*timer",-637700106),_STAR_timer,new cljs.core.Keyword(null,"*timer1","*timer1",605841781),_STAR_timer1,new cljs.core.Keyword(null,"render","render",-1408033454),frontend.components.block.preview_render,new cljs.core.Keyword(null,"*el-popup","*el-popup",627144628),_STAR_el_popup], null)):daiquiri.interpreter.interpret(children)):daiquiri.interpreter.interpret(children))]);
}),null,"frontend.components.block/page-preview-trigger");
frontend.components.block.invalid_node_ref = rum.core.lazy_build(rum.core.build_defc,(function (id){
return daiquiri.core.create_element("span",{'title':"Node ref invalid",'className':"warning mr-1"},[frontend.util.ref.__GT_block_ref(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id))]);
}),null,"frontend.components.block/invalid-node-ref");
frontend.components.block.inline_text = (function frontend$components$block$inline_text(var_args){
var G__88153 = arguments.length;
switch (G__88153) {
case 2:
return frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$2 = (function (format,v){
return frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,format,v);
}));

(frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3 = (function (config,format,v){
if(typeof v === 'string'){
var inline_list = logseq.graph_parser.mldoc.inline__GT_edn(v,frontend.format.mldoc.get_default_config(format));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inline.mr-1","div.inline.mr-1",1595393315),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,inline_list) : frontend.components.block.map_inline.call(null,config,inline_list))], null);
} else {
return null;
}
}));

(frontend.components.block.inline_text.cljs$lang$maxFixedArity = 3);

/**
 * Component for a page. `page` argument contains :block/name which can be (un)sanitized page name.
 * Keys for `config`:
 * - `:preview?`: Is this component under preview mode? (If true, `page-preview-trigger` won't be registered to this `page-cp`)
 */
frontend.components.block.page_cp_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__88154,page){
var map__88155 = p__88154;
var map__88155__$1 = cljs.core.__destructure_map(map__88155);
var config = map__88155__$1;
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var preview_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"preview?","preview?",590561578));
var disable_preview_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365));
var show_non_exists_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"show-non-exists-page?","show-non-exists-page?",-1180311666));
var tag_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"tag?","tag?",1714008252));
var _skip_async_load_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88155__$1,new cljs.core.Keyword(null,"_skip-async-load?","_skip-async-load?",-1062169676));
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = rum.core.react(new cljs.core.Keyword(null,"*entity","*entity",-460460133).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_(temp__5804__auto__)){
var entity_SINGLEQUOTE_ = temp__5804__auto__;
var entity = (function (){var or__5002__auto__ = (function (){var G__88158 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity_SINGLEQUOTE_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__88158) : frontend.db.sub_block.call(null,G__88158));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return entity_SINGLEQUOTE_;
}
})();
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"block","block",664686210),entity);
if(cljs.core.truth_(entity)){
var page_name = (function (){var G__88159 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity);
if((G__88159 == null)){
return null;
} else {
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__88159) : frontend.util.page_name_sanity_lc.call(null,G__88159));
}
})();
var whiteboard_page_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(entity);
var inner = frontend.components.block.page_inner(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"whiteboard-page?","whiteboard-page?",1626270426),whiteboard_page_QMARK_),entity,children,label);
var modal_QMARK_ = logseq.shui.dialog.core.has_modal_QMARK_();
if(((cljs.core.not(frontend.util.mobile_QMARK_())) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page_name,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config__$1))) && ((((!(preview_QMARK_ === false))) && (((cljs.core.not(disable_preview_QMARK_)) && (cljs.core.not(modal_QMARK_)))))))))){
return frontend.components.block.page_preview_trigger(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"children","children",-940561982),inner),entity);
} else {
return inner;
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(and__5000__auto__)){
return show_non_exists_page_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.components.block.page_inner(config__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
}
})(),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page)], null),page], 0)),children,label);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),[(cljs.core.truth_(tag_QMARK_)?"#":null),(cljs.core.truth_(tag_QMARK_)?null:logseq.common.util.page_ref.left_brackets),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page)),(cljs.core.truth_(tag_QMARK_)?null:logseq.common.util.page_ref.right_brackets)].join('')], null);
} else {
return null;

}
}
}
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.db_mixins.query,rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var args = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var vec__88160 = args;
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88160,(0),null);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88160,(1),null);
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var page_id_or_name = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
return clojure.string.trim(s);
} else {
return null;
}
}
}
})();
var page_entity = ((datascript.impl.entity.entity_QMARK_(page))?page:(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_id_or_name) : frontend.db.get_page.call(null,page_id_or_name)));
if(cljs.core.truth_(page_entity)){
cljs.core.reset_BANG_(_STAR_result,page_entity);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"skip-async-load?","skip-async-load?",168412205).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"table-view?","table-view?",2073887505).cljs$core$IFn$_invoke$arity$1(config);
}
})())){
cljs.core.reset_BANG_(_STAR_result,page);
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),page_id_or_name,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null)], 0))),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result));
}));
}));

}
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"*entity","*entity",-460460133),_STAR_result);
})], null)], null),"frontend.components.block/page-cp-inner");
frontend.components.block.page_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,page){
var id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
}
}
})();
return rum.core.with_key(frontend.components.block.page_cp_inner(config,page),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
}),null,"frontend.components.block/page-cp");
frontend.components.block.asset_reference = rum.core.lazy_build(rum.core.build_defc,(function (config,title,path){
var repo = frontend.state.get_current_repo();
var real_path_url = (cljs.core.truth_(logseq.common.util.url_QMARK_(path))?path:((logseq.common.path.absolute_QMARK_(path))?path:frontend.handler.assets.resolve_asset_real_path_url(repo,path)
));
var ext_name = frontend.util.get_file_ext(path);
var title_or_path = ((typeof title === 'string')?title:((cljs.core.seq(title))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span","span",1394872991),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,title) : frontend.components.block.map_inline.call(null,config,title))):path
));
return daiquiri.core.create_element("div",{'data-ext':ext_name,'className':"asset-ref-wrap"},[((cljs.core.contains_QMARK_(frontend.config.video_formats,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(ext_name)))?daiquiri.core.create_element("video",{'src':real_path_url,'controls':true},[]):daiquiri.core.create_element("a",{'target':"_blank",'href':real_path_url,'className':"asset-ref"},[daiquiri.interpreter.interpret(title_or_path)])
)]);
}),null,"frontend.components.block/asset-reference");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block.excalidraw_loaded_QMARK_ !== 'undefined')){
} else {
frontend.components.block.excalidraw_loaded_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.block.excalidraw = rum.core.lazy_build(rum.core.build_defc,(function (file,block_uuid){
var loaded_QMARK_ = rum.core.react(frontend.components.block.excalidraw_loaded_QMARK_);
var draw_component = (cljs.core.truth_(loaded_QMARK_)?(((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.excalidraw !== 'undefined') && (typeof frontend.extensions.excalidraw.draw !== 'undefined'))?(new cljs.core.Var((function (){
return frontend.extensions.excalidraw.draw;
}),cljs.core.with_meta(new cljs.core.Symbol("frontend.extensions.excalidraw","draw","frontend.extensions.excalidraw/draw",-213308303,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)),null)):null):null);
if(cljs.core.truth_(draw_component)){
return daiquiri.interpreter.interpret((function (){var G__88164 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"file","file",-1269645878),file,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null);
return (draw_component.cljs$core$IFn$_invoke$arity$1 ? draw_component.cljs$core$IFn$_invoke$arity$1(G__88164) : draw_component.call(null,G__88164));
})());
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.block.goog$module$shadow$loader.load(new cljs.core.Keyword(null,"excalidraw","excalidraw",-397772502))),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.components.block.excalidraw_loaded_QMARK_,true));
}));
}));

return state;
})], null)], null),"frontend.components.block/excalidraw");
frontend.components.block.asset_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,block){
var asset_type = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(block);
var file = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_type)].join('');
var file_exists_QMARK_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.block","file-exists?","frontend.components.block/file-exists?",376243689).cljs$core$IFn$_invoke$arity$1(state));
var repo = frontend.state.get_current_repo();
var map__88165 = frontend.state.sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path-in-sub-atom","path-in-sub-atom",61043603),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))], null)], null)], 0));
var map__88165__$1 = cljs.core.__destructure_map(map__88165);
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88165__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var loaded = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88165__$1,new cljs.core.Keyword(null,"loaded","loaded",-1246482293));
var total = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88165__$1,new cljs.core.Keyword(null,"total","total",1916810418));
var downloading_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"download","download",-300081668))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loaded,total)));
var download_finished_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"download","download",-300081668))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loaded,total)));
if(cljs.core.truth_((function (){var or__5002__auto__ = file_exists_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return download_finished_QMARK_;
}
})())){
return frontend.components.block.asset_link(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"asset-block","asset-block",1420117445),block),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(["../",logseq.common.config.local_assets_dir].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file], 0)),null,null);
} else {
if(((downloading_QMARK_) || (file_exists_QMARK_ === false))){
return daiquiri.interpreter.interpret((function (){var G__88167 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-[125px] w-[250px] rounded-xl"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__88167) : logseq.shui.ui.skeleton.call(null,G__88167));
})());
} else {
return null;

}
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.block","file-exists?","frontend.components.block/file-exists?",376243689)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var block = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var asset_type = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(block);
var path = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(logseq.common.config.local_assets_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_type)].join('')], 0));
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(frontend.config.get_repo_dir(frontend.state.get_current_repo()),path)),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.block","file-exists?","frontend.components.block/file-exists?",376243689).cljs$core$IFn$_invoke$arity$1(state),result));
}));
}));

return state;
})], null)], null),"frontend.components.block/asset-cp");
frontend.components.block.img_audio_video_QMARK_ = (function frontend$components$block$img_audio_video_QMARK_(block){
var asset_type = (function (){var G__88168 = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(block);
if((G__88168 == null)){
return null;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(G__88168);
}
})();
return ((cljs.core.contains_QMARK_(logseq.common.config.img_formats(),asset_type)) || (((cljs.core.contains_QMARK_(frontend.config.audio_formats,asset_type)) || (cljs.core.contains_QMARK_(frontend.config.video_formats,asset_type)))));
});
/**
 * Component for page reference
 */
frontend.components.block.page_reference = rum.core.lazy_build(rum.core.build_defc,(function (p__88169,uuid_or_title_STAR_,label){
var map__88170 = p__88169;
var map__88170__$1 = cljs.core.__destructure_map(map__88170);
var config_STAR_ = map__88170__$1;
var html_export_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88170__$1,new cljs.core.Keyword(null,"html-export?","html-export?",504770426));
var nested_link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88170__$1,new cljs.core.Keyword(null,"nested-link?","nested-link?",637882262));
var show_brackets_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88170__$1,new cljs.core.Keyword(null,"show-brackets?","show-brackets?",659769842));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88170__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_(uuid_or_title_STAR_)){
var uuid_or_title = ((typeof uuid_or_title_STAR_ === 'string')?(function (){var str_id = clojure.string.trim(uuid_or_title_STAR_);
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(str_id) : frontend.util.uuid_string_QMARK_.call(null,str_id)))){
return cljs.core.parse_uuid(str_id);
} else {
return str_id;
}
})():uuid_or_title_STAR_);
var self_reference_QMARK_ = ((cljs.core.set_QMARK_(new cljs.core.Keyword(null,"ref-set","ref-set",-818151549).cljs$core$IFn$_invoke$arity$1(config_STAR_)))?cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"ref-set","ref-set",-818151549).cljs$core$IFn$_invoke$arity$1(config_STAR_),uuid_or_title):null);
if(cljs.core.truth_(self_reference_QMARK_)){
return null;
} else {
var config = cljs.core.update.cljs$core$IFn$_invoke$arity$3(config_STAR_,new cljs.core.Keyword(null,"ref-set","ref-set",-818151549),(function (s){
var bid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config_STAR_));
if((s == null)){
return cljs.core.PersistentHashSet.createAsIfByAssoc([bid]);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(s,bid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([uuid_or_title], 0));
}
}));
var show_brackets_QMARK___$1 = (((!((show_brackets_QMARK_ == null))))?show_brackets_QMARK_:frontend.state.show_brackets_QMARK_());
var contents_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("contents",clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)));
var block_STAR_ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(uuid_or_title) : frontend.db.get_page.call(null,uuid_or_title));
var block = (function (){var or__5002__auto__ = (function (){var G__88171 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_STAR_);
if((G__88171 == null)){
return null;
} else {
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__88171) : frontend.db.sub_block.call(null,G__88171));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block_STAR_;
}
})();
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"label","label",1718410804),frontend.format.mldoc.plain__GT_text(label),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"contents-page?","contents-page?",2137383699),contents_page_QMARK_,new cljs.core.Keyword(null,"show-icon?","show-icon?",-756836459),cljs.core.true_QMARK_], 0));
var asset_QMARK_ = (!((new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(block) == null)));
var brackets_QMARK_ = (function (){var and__5000__auto__ = (function (){var or__5002__auto__ = show_brackets_QMARK___$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return nested_link_QMARK_;
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(html_export_QMARK_)) && ((!(contents_page_QMARK_))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config)))){
return null;
} else {
if(((asset_QMARK_) && (frontend.components.block.img_audio_video_QMARK_(block)))){
return frontend.components.block.asset_cp(config,block);
} else {
if(((typeof uuid_or_title === 'string') && (clojure.string.ends_with_QMARK_(uuid_or_title,".excalidraw")))){
return daiquiri.core.create_element("div",{'onClick':(function (e){
return e.stopPropagation();
}),'className':"draw"},[frontend.components.block.excalidraw(uuid_or_title,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config))]);
} else {
return daiquiri.core.create_element("span",{'data-ref':cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid_or_title),'className':"page-reference"},[(cljs.core.truth_(brackets_QMARK_)?daiquiri.core.create_element("span",{'className':"text-gray-500 bracket"},[logseq.common.util.page_ref.left_brackets]):null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
var G__88172 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)));
var G__88173 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88172,G__88173) : logseq.db.class_instance_QMARK_.call(null,G__88172,G__88173));
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'style':{'marginRight':(1),'marginTop':(-2),'verticalAlign':"middle"},'onPointerDown':(function (e){
return frontend.util.stop(e);
}),'className':"inline-block"},[daiquiri.interpreter.interpret((frontend.components.block.block_positioned_properties.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.block_positioned_properties.cljs$core$IFn$_invoke$arity$3(config,block,new cljs.core.Keyword(null,"block-left","block-left",-1266158554)) : frontend.components.block.block_positioned_properties.call(null,config,block,new cljs.core.Keyword(null,"block-left","block-left",-1266158554))))]):null),frontend.components.block.page_cp(config_SINGLEQUOTE_,((cljs.core.uuid_QMARK_(uuid_or_title))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_or_title], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),uuid_or_title], null))),(cljs.core.truth_(brackets_QMARK_)?daiquiri.core.create_element("span",{'className':"text-gray-500 bracket"},[logseq.common.util.page_ref.right_brackets]):null)]);

}
}
}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.block/page-reference");
frontend.components.block.latex_environment_content = (function frontend$components$block$latex_environment_content(name,option,content){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(name),"equation")){
return content;
} else {
var G__88174 = "\\begin%s\n%s\\end{%s}";
var G__88175 = ["{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"}",cljs.core.str.cljs$core$IFn$_invoke$arity$1(option)].join('');
var G__88176 = content;
var G__88177 = name;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$4 ? frontend.util.format.cljs$core$IFn$_invoke$arity$4(G__88174,G__88175,G__88176,G__88177) : frontend.util.format.call(null,G__88174,G__88175,G__88176,G__88177));
}
});
frontend.components.block.block_embed = rum.core.lazy_build(rum.core.build_defc,(function (config,block_uuid){
var vec__88178 = (function (){var G__88181 = (function (){var G__88182 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88182) : frontend.db.entity.call(null,G__88182));
})();
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__88181) : logseq.shui.hooks.use_state.call(null,G__88181));
})();
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88178,(0),null);
var set_block_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88178,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null)], 0))),(function (block__$1){
return promesa.protocols._promise((set_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_block_BANG_.cljs$core$IFn$_invoke$arity$1(block__$1) : set_block_BANG_.call(null,block__$1)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(block)){
return daiquiri.core.create_element("div",{'style':{'zIndex':(2)},'onPointerDown':(function (e){
return e.stopPropagation();
}),'className':"color-level embed-block bg-base-2"},[(function (){var attrs88183 = (function (){var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid),new cljs.core.Keyword(null,"embed-id","embed-id",717000009),block_uuid,new cljs.core.Keyword(null,"embed?","embed?",-922305920),true,new cljs.core.Keyword(null,"embed-parent","embed-parent",1172681354),new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword(null,"ref?","ref?",1932693720),false], 0));
return (frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2(config_SINGLEQUOTE_,block) : frontend.components.block.block_container.call(null,config_SINGLEQUOTE_,block));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88183))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-3","pt-1","pb-2"], null)], null),attrs88183], 0))):{'className':"px-3 pt-1 pb-2"}),((cljs.core.map_QMARK_(attrs88183))?null:[daiquiri.interpreter.interpret(attrs88183)]));
})()]);
} else {
return null;
}
}),null,"frontend.components.block/block-embed");
frontend.components.block.page_embed_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,block){
var current_page = frontend.state.get_current_page();
var block__$1 = (function (){var G__88185 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__88185) : frontend.db.sub_block.call(null,G__88185));
})();
var whiteboard_page_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(block__$1);
var page_name = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block__$1);
return daiquiri.core.create_element("div",{'onPointerDown':(function (p1__88184_SHARP_){
return p1__88184_SHARP_.stopPropagation();
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["color-level","embed","embed-page","bg-base-2",(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config))?"in-sidebar":null)], null))},[daiquiri.core.create_element("section",{'className':"flex items-center p-1 embed-header"},[(function (){var attrs88186 = frontend.components.svg.page;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88186))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-3"], null)], null),attrs88186], 0))):{'className':"mr-3"}),((cljs.core.map_QMARK_(attrs88186))?null:[daiquiri.interpreter.interpret(attrs88186)]));
})(),frontend.components.block.page_cp(config,block__$1)]),((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__88187 = (function (){var or__5002__auto__ = current_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__88187) : frontend.util.page_name_sanity_lc.call(null,G__88187));
})(),page_name)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__88188 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"id","id",-1388402092),"");
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__88188) : frontend.util.page_name_sanity_lc.call(null,G__88188));
})(),page_name))))?(cljs.core.truth_(whiteboard_page_QMARK_)?daiquiri.interpreter.interpret((function (){var G__88192 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1);
var fexpr__88191 = frontend.state.get_component(new cljs.core.Keyword("whiteboard","tldraw-preview","whiteboard/tldraw-preview",663400157));
return (fexpr__88191.cljs$core$IFn$_invoke$arity$1 ? fexpr__88191.cljs$core$IFn$_invoke$arity$1(G__88192) : fexpr__88191.call(null,G__88192));
})()):(function (){var blocks = logseq.db.get_children.cljs$core$IFn$_invoke$arity$1(block__$1);
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),page_name,new cljs.core.Keyword(null,"embed?","embed?",-922305920),true,new cljs.core.Keyword(null,"page-embed?","page-embed?",-1714518279),true,new cljs.core.Keyword(null,"ref?","ref?",1932693720),false], 0));
return daiquiri.interpreter.interpret((frontend.components.block.blocks_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.blocks_container.cljs$core$IFn$_invoke$arity$2(config_SINGLEQUOTE_,blocks) : frontend.components.block.blocks_container.call(null,config_SINGLEQUOTE_,blocks)));
})()):null)]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.block/page-embed-aux");
frontend.components.block.page_embed = rum.core.lazy_build(rum.core.build_defc,(function (config,page_name){
var page_name__$1 = (function (){var G__88193 = clojure.string.trim(page_name);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__88193) : frontend.util.page_name_sanity_lc.call(null,G__88193));
})();
var vec__88194 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88194,(0),null);
var set_block_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88194,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),page_name__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),true,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null)], 0))),(function (block__$1){
return promesa.protocols._promise((set_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_block_BANG_.cljs$core$IFn$_invoke$arity$1(block__$1) : set_block_BANG_.call(null,block__$1)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(block)){
return frontend.components.block.page_embed_aux(config,block);
} else {
return null;
}
}),null,"frontend.components.block/page-embed");
frontend.components.block.get_label_text = (function frontend$components$block$get_label_text(label){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(label))) && (typeof cljs.core.last(cljs.core.first(label)) === 'string'))){
return logseq.common.util.safe_decode_uri_component(cljs.core.last(cljs.core.first(label)));
} else {
return null;
}
});
frontend.components.block.get_page = (function frontend$components$block$get_page(label){
var temp__5804__auto__ = frontend.components.block.get_label_text(label);
if(cljs.core.truth_(temp__5804__auto__)){
var label_text = temp__5804__auto__;
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(label_text) : frontend.db.get_page.call(null,label_text));
} else {
return null;
}
});
frontend.components.block.macro__GT_text = (function frontend$components$block$macro__GT_text(name,arguments$){
if(((cljs.core.seq(arguments$)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(arguments$,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["null"], null))))){
var G__88197 = "{{%s %s}}";
var G__88198 = name;
var G__88199 = clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",arguments$);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__88197,G__88198,G__88199) : frontend.util.format.call(null,G__88197,G__88198,G__88199));
} else {
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{%s}}",name) : frontend.util.format.call(null,"{{%s}}",name));
}
});
frontend.components.block.block_reference_preview = rum.core.lazy_build(rum.core.build_defc,(function (children,p__88200){
var map__88201 = p__88200;
var map__88201__$1 = cljs.core.__destructure_map(map__88201);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88201__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88201__$1,new cljs.core.Keyword(null,"config","config",994861415));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88201__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var _STAR_timer = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_timer1 = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__88202 = rum.core.use_state(null);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88202,(0),null);
var set_visible_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88202,(1),null);
var _ = frontend.components.block.render = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'style':{'width':(600),'fontWeight':(500),'textAlign':"left"},'onMouseEnter':(function (){
var temp__5804__auto__ = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_timer1) : logseq.shui.hooks.deref.call(null,_STAR_timer1));
if(cljs.core.truth_(temp__5804__auto__)){
var timer1 = temp__5804__auto__;
return clearTimeout(timer1);
} else {
return null;
}
}),'onMouseLeave':(function (){
if(frontend.ui.last_shui_preview_popup_QMARK_()){
var G__88205 = _STAR_timer1;
var G__88206 = setTimeout((function (){
return (set_visible_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_visible_BANG_.call(null,false));
}),(500));
return (logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.hooks.set_ref_BANG_.cljs$core$IFn$_invoke$arity$2(G__88205,G__88206) : logseq.shui.hooks.set_ref_BANG_.call(null,G__88205,G__88206));
} else {
return null;
}
}),'className':"tippy-wrapper as-block"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__88207 = config;
var G__88208 = repo;
var G__88209 = id;
var G__88210 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"indent?","indent?",1381429379),true], null);
return (frontend.components.block.breadcrumb.cljs$core$IFn$_invoke$arity$4 ? frontend.components.block.breadcrumb.cljs$core$IFn$_invoke$arity$4(G__88207,G__88208,G__88209,G__88210) : frontend.components.block.breadcrumb.call(null,G__88207,G__88208,G__88209,G__88210));
})(),(function (){var G__88211 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"preview?","preview?",590561578),true], 0));
var G__88212 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__88213 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88213) : frontend.db.entity.call(null,G__88213));
})()], null);
return (frontend.components.block.blocks_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.blocks_container.cljs$core$IFn$_invoke$arity$2(G__88211,G__88212) : frontend.components.block.blocks_container.call(null,G__88211,G__88212));
})()], null))]);
}),null,"frontend.components.block/render");
return frontend.components.block.popup_preview_impl(children,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),visible_QMARK_,new cljs.core.Keyword(null,"set-visible!","set-visible!",-1042705644),set_visible_BANG_,new cljs.core.Keyword(null,"*timer","*timer",-637700106),_STAR_timer,new cljs.core.Keyword(null,"*timer1","*timer1",605841781),_STAR_timer1,new cljs.core.Keyword(null,"render","render",-1408033454),frontend.components.block.render], null));
}),null,"frontend.components.block/block-reference-preview");
frontend.components.block.block_reference_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,block,label){
var db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var block__$1 = (cljs.core.truth_(db_id)?(frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.sub_block.call(null,db_id)):null);
var block_type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)));
var hl_type = frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832));
var repo = frontend.state.get_current_repo();
var stop_inner_events_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938));
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"stop-events?","stop-events?",-151471572),stop_inner_events_QMARK_], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = block__$1;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
} else {
return and__5000__auto__;
}
})())){
var content_cp = (function (){var G__88214 = config_SINGLEQUOTE_;
var G__88215 = block__$1;
var G__88216 = null;
var G__88217 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1);
var G__88218 = null;
return (frontend.components.block.block_content.cljs$core$IFn$_invoke$arity$5 ? frontend.components.block.block_content.cljs$core$IFn$_invoke$arity$5(G__88214,G__88215,G__88216,G__88217,G__88218) : frontend.components.block.block_content.call(null,G__88214,G__88215,G__88216,G__88217,G__88218));
})();
var display_type = new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_((function (){var and__5000__auto__ = display_type;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"quote","quote",-262615245),null,new cljs.core.Keyword(null,"math","math",-2026912803),null], null), null),display_type)));
} else {
return and__5000__auto__;
}
})())){
return daiquiri.interpreter.interpret(content_cp);
} else {
var title = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.block-ref","span.block-ref",1894783192),content_cp], null);
var inner = ((cljs.core.seq(label))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span.block-ref","span.block-ref",1894783192),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,label) : frontend.components.block.map_inline.call(null,config,label))):title
);
return daiquiri.core.create_element("div",{'data-type':cljs.core.name((function (){var or__5002__auto__ = block_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})()),'data-hl-type':hl_type,'onPointerDown':(function (e){
if(frontend.util.right_click_QMARK_(e)){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("block-ref","context","block-ref/context",-2102048446),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword(null,"block-ref","block-ref",362929756),block_id], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.components.block.goog$module$goog$object.get(e,"shiftKey");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(e.target.closest(".blank"));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.util.right_click_QMARK_(e)));
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

if(cljs.core.truth_(frontend.components.block.goog$module$goog$object.get(e,"shiftKey"))){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.whiteboard.inside_portal_QMARK_(e.target);
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.whiteboard.add_new_block_portal_shape_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1),frontend.handler.whiteboard.closest_shape(e.target));
} else {
var block_type__$1 = block_type;
var ocr_88219 = frontend.util.electron_QMARK_();
try{if(cljs.core.keyword_identical_QMARK_(block_type__$1,new cljs.core.Keyword(null,"annotation","annotation",-344661666))){
try{if((ocr_88219 === true)){
return frontend.extensions.pdf.assets.open_block_ref_BANG_(block__$1);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88225){if((e88225 instanceof Error)){
var e__46744__auto__ = e88225;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e88225;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88222){if((e88222 instanceof Error)){
var e__46744__auto__ = e88222;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(block_type__$1,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938))){
try{if((ocr_88219 === true)){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null));
} else {
throw cljs.core.match.backtrack;

}
}catch (e88224){if((e88224 instanceof Error)){
var e__46744__auto____$1 = e88224;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88224;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88223){if((e88223 instanceof Error)){
var e__46744__auto____$1 = e88223;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(block_id);
} else {
throw e__46744__auto____$1;
}
} else {
throw e88223;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88222;

}
}
}
}
} else {
return null;
}
}
}),'className':"block-ref-wrap inline"},[((((cljs.core.not(frontend.util.mobile_QMARK_())) && (((cljs.core.not(new cljs.core.Keyword(null,"preview?","preview?",590561578).cljs$core$IFn$_invoke$arity$1(config))) && (((cljs.core.not(logseq.shui.dialog.core.has_modal_QMARK_())) && ((block_type == null))))))))?frontend.components.block.block_reference_preview(inner,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"id","id",-1388402092),block_id], null)):daiquiri.interpreter.interpret(inner))]);
}
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.block",new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"invalid-node","invalid-node",925093359),block__$1,new cljs.core.Keyword(null,"line","line",212345235),1329], null)),null);

return frontend.components.block.invalid_node_ref(block_id);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.block/block-reference-aux");
frontend.components.block.block_reference = rum.core.lazy_build(rum.core.build_defc,(function (config,id,label){
var block_id = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
if(cljs.core.uuid_QMARK_(id)){
return id;
} else {
return cljs.core.parse_uuid(id);
}
} else {
return and__5000__auto__;
}
})();
var vec__88226 = (function (){var G__88229 = (function (){var G__88230 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88230) : frontend.db.entity.call(null,G__88230));
})();
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__88229) : logseq.shui.hooks.use_state.call(null,G__88229));
})();
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88226,(0),null);
var set_block_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88226,(1),null);
var self_reference_QMARK_ = ((cljs.core.set_QMARK_(new cljs.core.Keyword(null,"ref-set","ref-set",-818151549).cljs$core$IFn$_invoke$arity$1(config)))?cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"ref-set","ref-set",-818151549).cljs$core$IFn$_invoke$arity$1(config),block_id):null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null)], 0))),(function (block__$1){
return promesa.protocols._promise((set_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_block_BANG_.cljs$core$IFn$_invoke$arity$1(block__$1) : set_block_BANG_.call(null,block__$1)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(self_reference_QMARK_)){
return null;
} else {
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return frontend.components.block.page_reference(config,block_id,label);
} else {
if(cljs.core.truth_(block)){
var config_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"ref-set","ref-set",-818151549),(function (s){
var bid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config));
if((s == null)){
return cljs.core.PersistentHashSet.createAsIfByAssoc([bid]);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(s,bid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_id], 0));
}
}));
return frontend.components.block.block_reference_aux(config_SINGLEQUOTE_,block,label);
} else {
return frontend.components.block.invalid_node_ref(block_id);

}
}
}
}),null,"frontend.components.block/block-reference");
frontend.components.block.render_macro = (function frontend$components$block$render_macro(config,name,arguments$,macro_content,format){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.macro","div.macro",-2084098642),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-macro-name","data-macro-name",548814604),name], null),(cljs.core.truth_(macro_content)?(function (){var ast = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,frontend.format.mldoc.__GT_edn(macro_content,format));
var paragraph_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(ast))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Paragraph",cljs.core.ffirst(ast))));
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(paragraph_QMARK_));
if(and__5000__auto__){
var G__88241 = cljs.core.ffirst(ast);
return (frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.block_with_title_QMARK_.cljs$core$IFn$_invoke$arity$1(G__88241) : frontend.format.mldoc.block_with_title_QMARK_.call(null,G__88241));
} else {
return and__5000__auto__;
}
})())){
var G__88242 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword("block","format","block/format",-1212045901),format);
var G__88243 = ast;
return (frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(G__88242,G__88243) : frontend.components.block.markup_elements_cp.call(null,G__88242,G__88243));
} else {
return frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3(config,format,macro_content);
}
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning","span.warning",-711839668),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),["Unsupported macro name: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('')], null),frontend.components.block.macro__GT_text(name,arguments$)], null))], null);
});
frontend.components.block.nested_link = rum.core.lazy_build(rum.core.build_defc,(function (config,html_export_QMARK_,link){
var show_brackets_QMARK_ = frontend.state.show_brackets_QMARK_();
var map__88257 = link;
var map__88257__$1 = cljs.core.__destructure_map(map__88257);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88257__$1,new cljs.core.Keyword(null,"content","content",15833224));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88257__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var attrs88250 = ((((show_brackets_QMARK_) && (((cljs.core.not(html_export_QMARK_)) && ((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config),"contents"))))))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-gray-500","span.text-gray-500",811795480),logseq.common.util.page_ref.left_brackets], null):null);
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs88250))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-reference","nested"], null)], null),attrs88250], 0))):{'className':"page-reference nested"}),((cljs.core.map_QMARK_(attrs88250))?[(function (){var page_name = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"children","children",-940561982),children,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"nested-link?","nested-link?",637882262),true], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),page_name], null));
})(),((((show_brackets_QMARK_) && (((cljs.core.not(html_export_QMARK_)) && ((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config),"contents"))))))))?daiquiri.core.create_element("span",{'className':"text-gray-500"},[logseq.common.util.page_ref.right_brackets]):null)]:[daiquiri.interpreter.interpret(attrs88250),(function (){var page_name = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(2),(cljs.core.count(content) - (2)));
return frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"children","children",-940561982),children,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"nested-link?","nested-link?",637882262),true], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),page_name], null));
})(),((((show_brackets_QMARK_) && (((cljs.core.not(html_export_QMARK_)) && ((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config),"contents"))))))))?daiquiri.core.create_element("span",{'className':"text-gray-500"},[logseq.common.util.page_ref.right_brackets]):null)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/nested-link");
frontend.components.block.show_link_QMARK_ = (function frontend$components$block$show_link_QMARK_(config,metadata,s,full_text){
var media_formats = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,frontend.config.media_formats));
var metadata_show = new cljs.core.Keyword(null,"show","show",-576705889).cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(metadata));
var format = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format);
if(and__5000__auto__){
var or__5002__auto__ = (function (){var and__5000__auto____$1 = (metadata_show == null);
if(and__5000__auto____$1){
var or__5002__auto__ = logseq.common.config.local_asset_QMARK_(s);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.text.media_link_QMARK_(media_formats,s);
}
} else {
return and__5000__auto____$1;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.boolean$(metadata_show) === true;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = clojure.string.starts_with_QMARK_(clojure.string.triml(full_text),"!");
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var and__5000__auto__ = ((clojure.string.starts_with_QMARK_(full_text,"http://")) || (clojure.string.starts_with_QMARK_(full_text,"https://")));
if(and__5000__auto__){
return frontend.util.text.media_link_QMARK_(media_formats,s);
} else {
return and__5000__auto__;
}
}
}
});
frontend.components.block.relative_assets_path__GT_absolute_path = (function frontend$components$block$relative_assets_path__GT_absolute_path(path){
if(logseq.common.path.protocol_url_QMARK_(path)){
console.error("BUG: relative-assets-path->absolute-path called with protocol url",path);
} else {
}

if(((logseq.common.path.absolute_QMARK_(path)) || (logseq.common.path.protocol_url_QMARK_(path)))){
return path;
} else {
return frontend.util.node_path.join(frontend.config.get_repo_dir(frontend.state.get_current_repo()),frontend.config.get_local_asset_absolute_path(path));
}
});
frontend.components.block.audio_link = rum.core.lazy_build(rum.core.build_defc,(function (config,url,href,_label,metadata,full_text){
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.common.config.local_asset_QMARK_(href);
if(cljs.core.truth_(and__5000__auto__)){
return ((frontend.config.local_file_based_graph_QMARK_(frontend.state.get_current_repo())) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())));
} else {
return and__5000__auto__;
}
})())){
return frontend.components.block.asset_link(config,null,href,metadata,full_text);
} else {
var href__$1 = ((frontend.util.starts_with_QMARK_(href,"http"))?href:((frontend.config.publishing_QMARK_)?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(href,(1)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Embed_data",cljs.core.first(url)))?href:(cljs.core.truth_(frontend.handler.assets.check_alias_path_QMARK_(href))?frontend.handler.assets.resolve_asset_real_path_url(frontend.state.get_current_repo(),href):frontend.components.block.get_file_absolute_path(config,href))
)));
return frontend.components.block.audio_cp(href__$1);
}
}),null,"frontend.components.block/audio-link");
frontend.components.block.media_link = (function frontend$components$block$media_link(config,url,s,label,metadata,full_text){
var ext = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.get_file_ext(s));
var label_text = frontend.components.block.get_label_text(label);
if(cljs.core.contains_QMARK_(frontend.config.audio_formats,ext)){
return frontend.components.block.audio_link(config,url,s,label,metadata,full_text);
} else {
if(cljs.core.contains_QMARK_(frontend.config.doc_formats,ext)){
return frontend.components.block.asset_link(config,label_text,s,metadata,full_text);
} else {
if((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"webm","webm",-1239807004),null,new cljs.core.Keyword(null,"mp4","mp4",1038217575),null,new cljs.core.Keyword(null,"mov","mov",605355799),null], null), null),ext)))){
return frontend.components.block.image_link(config,url,s,label,metadata,full_text);
} else {
return frontend.components.block.asset_reference(config,label,s);

}
}
}
});
frontend.components.block.search_link_cp = (function frontend$components$block$search_link_cp(config,url,s,label,title,metadata,full_text){
if(clojure.string.blank_QMARK_(s)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning","span.warning",-711839668),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid link"], null),full_text], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",cljs.core.first(s))){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.jump_to_anchor_BANG_((function (){var G__88268 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1));
return (frontend.format.mldoc.anchorLink.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.anchorLink.cljs$core$IFn$_invoke$arity$1(G__88268) : frontend.format.mldoc.anchorLink.call(null,G__88268));
})());
})], null),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1)));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("*",cljs.core.first(s))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("*",cljs.core.last(s))))){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.jump_to_anchor_BANG_((function (){var G__88269 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1));
return (frontend.format.mldoc.anchorLink.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.anchorLink.cljs$core$IFn$_invoke$arity$1(G__88269) : frontend.format.mldoc.anchorLink.call(null,G__88269));
})());
})], null),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1)));
} else {
if(logseq.common.util.block_ref.block_ref_QMARK_(s)){
var id = logseq.common.util.block_ref.get_block_ref_id(s);
return frontend.components.block.block_reference(config,id,label);
} else {
if((!(clojure.string.includes_QMARK_(s,".")))){
return frontend.components.block.page_reference(config,s,label);
} else {
if(logseq.common.path.protocol_url_QMARK_(s)){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),s,new cljs.core.Keyword(null,"data-href","data-href",299087184),s,new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,label) : frontend.components.block.map_inline.call(null,config,label)));
} else {
if(cljs.core.truth_(frontend.components.block.show_link_QMARK_(config,metadata,s,full_text))){
return frontend.components.block.media_link(config,url,s,label,metadata,full_text);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
}
})())){
var path = ((clojure.string.starts_with_QMARK_(s,"file://"))?clojure.string.replace(s,"file://",""):((clojure.string.starts_with_QMARK_(s,"/"))?s:frontend.components.block.relative_assets_path__GT_absolute_path(s)
));
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a","a",-2123407586),(function (){var G__88270 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("file://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0)),new cljs.core.Keyword(null,"data-href","data-href",299087184),path,new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null);
if(cljs.core.truth_(title)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88270,new cljs.core.Keyword(null,"title","title",636505583),title);
} else {
return G__88270;
}
})(),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,label) : frontend.components.block.map_inline.call(null,config,label)));
} else {
return frontend.components.block.page_reference(config,s,label);

}
}
}
}
}
}
}
}
});
frontend.components.block.link_cp = (function frontend$components$block$link_cp(config,link){
var map__88271 = link;
var map__88271__$1 = cljs.core.__destructure_map(map__88271);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88271__$1,new cljs.core.Keyword(null,"url","url",276297046));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88271__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88271__$1,new cljs.core.Keyword(null,"title","title",636505583));
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88271__$1,new cljs.core.Keyword(null,"metadata","metadata",1799301597));
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88271__$1,new cljs.core.Keyword(null,"full_text","full_text",1634289075));
try{if(((cljs.core.vector_QMARK_(url)) && ((cljs.core.count(url) === 2)))){
try{var url_0__88288 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__88288 === "Block_ref")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
var label_STAR_ = ((cljs.core.seq(frontend.format.mldoc.plain__GT_text(label)))?label:null);
var map__88410 = config;
var map__88410__$1 = cljs.core.__destructure_map(map__88410);
var link_depth = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88410__$1,new cljs.core.Keyword(null,"link-depth","link-depth",-293752026));
var link_depth__$1 = (function (){var or__5002__auto__ = link_depth;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
if((link_depth__$1 > frontend.components.block.max_depth_of_links)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.warning.text-sm","p.warning.text-sm",37937796),"Block ref nesting is too deep"], null);
} else {
return frontend.components.block.block_reference(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"reference?","reference?",983881698),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"link-depth","link-depth",-293752026),(link_depth__$1 + (1)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], 0)),id,label_STAR_);
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88370){if((e88370 instanceof Error)){
var e__46744__auto__ = e88370;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{var url_0__88288 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__88288 === "Page_ref")){
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
var format = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.components.block.show_link_QMARK_(config,null,page,page);
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["mp4",null,"webm",null,"ogg",null,"pdf",null], null), null),frontend.util.get_file_ext(page))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.components.block.image_link(config,url,page,null,metadata,full_text);
} else {
var label_STAR_ = ((cljs.core.seq(frontend.format.mldoc.plain__GT_text(label)))?label:null);
if(((typeof page === 'string') && (clojure.string.blank_QMARK_(page)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(page) : frontend.util.ref.__GT_page_ref.call(null,page))], null);
} else {
return frontend.components.block.page_reference(config,page,label_STAR_);
}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88379){if((e88379 instanceof Error)){
var e__46744__auto____$1 = e88379;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
try{var url_0__88288 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__88288 === "Embed_data")){
var src = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
return frontend.components.block.image_link(config,url,src,null,metadata,full_text);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88382){if((e88382 instanceof Error)){
var e__46744__auto____$2 = e88382;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{var url_0__88288 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(0));
if((url_0__88288 === "Search")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(url,(1));
return frontend.components.block.search_link_cp(config,url,s,label,title,metadata,full_text);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88386){if((e88386 instanceof Error)){
var e__46744__auto____$3 = e88386;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$3;
}
} else {
throw e88386;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e88382;

}
}} else {
throw e__46744__auto____$1;
}
} else {
throw e88379;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88370;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88306){if((e88306 instanceof Error)){
var e__46744__auto__ = e88306;
if((e__46744__auto__ === cljs.core.match.backtrack)){
var href = frontend.components.block.string_of_url(url);
var vec__88315 = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Complex",cljs.core.first(url));
if(and__5000__auto__){
return url;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("File",cljs.core.first(url));
if(and__5000__auto__){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["file",cljs.core.second(url)], null);
} else {
return and__5000__auto__;
}
}
})();
var protocol = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88315,(0),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88315,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword(null,"org","org",1495985));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Complex",protocol);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(path)),"id");
if(and__5000__auto____$2){
var and__5000__auto____$3 = typeof new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(path) === 'string';
if(and__5000__auto____$3){
var G__88326 = new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(path);
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__88326) : frontend.util.uuid_string_QMARK_.call(null,G__88326));
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var id = cljs.core.uuid(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(path));
var block = (function (){var G__88327 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88327) : frontend.db.entity.call(null,G__88327));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block))){
var page = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
return frontend.components.block.page_reference(config,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page),label);
} else {
return frontend.components.block.block_reference(config,new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(path),label);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(protocol,"file")){
if(cljs.core.truth_(frontend.components.block.show_link_QMARK_(config,metadata,href,full_text))){
return frontend.components.block.media_link(config,url,href,label,metadata,full_text);
} else {
var redirect_page_name = ((typeof path === 'string')?(logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1(path) : logseq.graph_parser.text.get_page_name.call(null,path)):null);
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"redirect-page-name","redirect-page-name",906009314),redirect_page_name);
var label_text = frontend.components.block.get_label_text(label);
var page = ((clojure.string.blank_QMARK_(label_text))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$2(clojure.string.replace(href,"file:",""),false)], null):frontend.components.block.get_page(label));
var show_brackets_QMARK_ = frontend.state.show_brackets_QMARK_();
if(cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
var temp__5804__auto__ = frontend.util.get_file_ext(href);
if(cljs.core.truth_(temp__5804__auto__)){
var ext = temp__5804__auto__;
return logseq.common.config.mldoc_support_QMARK_(ext);
} else {
return null;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.page-reference","span.page-reference",390731266),((show_brackets_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-gray-500","span.text-gray-500",811795480),logseq.common.util.page_ref.left_brackets], null):null),frontend.components.block.page_cp(config__$1,page),((show_brackets_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-gray-500","span.text-gray-500",811795480),logseq.common.util.page_ref.right_brackets], null):null)], null);
} else {
var href_STAR_ = (cljs.core.truth_(frontend.util.electron_QMARK_())?frontend.components.block.relative_assets_path__GT_absolute_path(href):href);
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a","a",-2123407586),(function (){var G__88350 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("file://",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([href_STAR_], 0)),new cljs.core.Keyword(null,"data-href","data-href",299087184),href_STAR_,new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null);
if(cljs.core.truth_(title)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88350,new cljs.core.Keyword(null,"title","title",636505583),title);
} else {
return G__88350;
}
})(),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$1,label) : frontend.components.block.map_inline.call(null,config__$1,label)));
}
}
} else {
if(cljs.core.truth_(frontend.components.block.show_link_QMARK_(config,metadata,href,full_text))){
return frontend.components.block.media_link(config,url,href,label,metadata,full_text);
} else {
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"a.external-link","a.external-link",-654902016),(function (){var G__88356 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),href,new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null);
if(cljs.core.truth_(title)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88356,new cljs.core.Keyword(null,"title","title",636505583),title);
} else {
return G__88356;
}
})(),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,label) : frontend.components.block.map_inline.call(null,config,label)));

}
}
}
} else {
throw e__46744__auto__;
}
} else {
throw e88306;

}
}});

frontend.components.block.wrap_query_components = (function frontend$components$block$wrap_query_components(config){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"->hiccup","->hiccup",1204690951),frontend.components.block.__GT_hiccup,new cljs.core.Keyword(null,"->elem","->elem",-260360654),frontend.components.block.__GT_elem,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595),frontend.components.block.page_cp,new cljs.core.Keyword(null,"inline-text","inline-text",910915394),frontend.components.block.inline_text,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144),frontend.components.block.map_inline,new cljs.core.Keyword(null,"inline","inline",1399884222),frontend.components.block.inline], null)], 0));
});
frontend.components.block.macro_query_cp = (function frontend$components$block$macro_query_cp(config,arguments$){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.dsl-query.pr-3.sm:pr-0","div.dsl-query.pr-3.sm:pr-0",2079647767),(function (){var query = clojure.string.trim(clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",arguments$));
var build_option = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword("file-version","query-macro-title","file-version/query-macro-title",1175466731),query);
return frontend.components.query.custom_query(frontend.components.block.wrap_query_components(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662),true)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"builder","builder",-2055262005),frontend.components.query.builder.builder(build_option,cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"query","query",-1288509510),query], null));
})()], null);
});
frontend.components.block.macro_function_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,arguments$){
return daiquiri.interpreter.interpret((function (){var or__5002__auto__ = (function (){var G__88414 = new cljs.core.Keyword(null,"query-result","query-result",-833644142).cljs$core$IFn$_invoke$arity$1(config);
var G__88414__$1 = (((G__88414 == null))?null:rum.core.react(G__88414));
if((G__88414__$1 == null)){
return null;
} else {
return frontend.components.block.macros.function_macro(G__88414__$1,arguments$);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning","span.warning",-711839668),(function (){var G__88415 = "{{function %s}}";
var G__88416 = cljs.core.first(arguments$);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__88415,G__88416) : frontend.util.format.call(null,G__88415,G__88416));
})()], null);
}
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/macro-function-cp");
frontend.components.block.macro_embed_cp = (function frontend$components$block$macro_embed_cp(config,arguments$){
var a = cljs.core.first(arguments$);
var map__88417 = config;
var map__88417__$1 = cljs.core.__destructure_map(map__88417);
var link_depth = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88417__$1,new cljs.core.Keyword(null,"link-depth","link-depth",-293752026));
var link_depth__$1 = (function (){var or__5002__auto__ = link_depth;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
if((a == null)){
return null;
} else {
if((link_depth__$1 > frontend.components.block.max_depth_of_links)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.warning.text-sm","p.warning.text-sm",37937796),"Embed depth is too deep"], null);
} else {
if(logseq.common.util.page_ref.page_ref_QMARK_(a)){
var page_name = (logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1(a) : logseq.graph_parser.text.get_page_name.call(null,a));
if(clojure.string.blank_QMARK_(page_name)){
return null;
} else {
return frontend.components.block.page_embed(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"link-depth","link-depth",-293752026),(link_depth__$1 + (1))),page_name);
}
} else {
if(logseq.common.util.block_ref.string_block_ref_QMARK_(a)){
var temp__5804__auto__ = clojure.string.trim(logseq.common.util.block_ref.get_string_block_ref_id(a));
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__88418 = s;
if((G__88418 == null)){
return null;
} else {
return cljs.core.parse_uuid(G__88418);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return frontend.components.block.block_embed(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"link-depth","link-depth",-293752026),(link_depth__$1 + (1))),id);
} else {
return null;
}
} else {
return null;
}
} else {
return null;

}
}
}
}
});
frontend.components.block.macro_vimeo_cp = (function frontend$components$block$macro_vimeo_cp(_config,arguments$){
var temp__5804__auto__ = cljs.core.first(arguments$);
if(cljs.core.truth_(temp__5804__auto__)){
var url = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(frontend.util.text.vimeo_regex,url) : frontend.util.safe_re_find.call(null,frontend.util.text.vimeo_regex,url)),(5));
if(cljs.core.truth_(temp__5804__auto____$1)){
var vimeo_id = temp__5804__auto____$1;
if(clojure.string.blank_QMARK_(vimeo_id)){
return null;
} else {
var width = (function (){var x__5090__auto__ = (frontend.util.get_width() - (96));
var y__5091__auto__ = (560);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var height = ((width * ((315) / (560))) | (0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"iframe","iframe",884422026),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"allow-full-screen","allow-full-screen",-1219396017),"allowfullscreen",new cljs.core.Keyword(null,"allow","allow",-1857325745),"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope",new cljs.core.Keyword(null,"frame-border","frame-border",-1868748185),"0",new cljs.core.Keyword(null,"src","src",-1651076051),["https://player.vimeo.com/video/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(vimeo_id)].join(''),new cljs.core.Keyword(null,"height","height",1025178622),height,new cljs.core.Keyword(null,"width","width",-384071477),width], null)], null);
}
} else {
return null;
}
} else {
return null;
}
});
frontend.components.block.macro_bilibili_cp = (function frontend$components$block$macro_bilibili_cp(_config,arguments$){
var temp__5804__auto__ = cljs.core.first(arguments$);
if(cljs.core.truth_(temp__5804__auto__)){
var url = temp__5804__auto__;
var temp__5804__auto____$1 = (((cljs.core.count(url) <= (15)))?url:cljs.core.nth.cljs$core$IFn$_invoke$arity$2((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(frontend.util.text.bilibili_regex,url) : frontend.util.safe_re_find.call(null,frontend.util.text.bilibili_regex,url)),(5))
);
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
if(clojure.string.blank_QMARK_(id)){
return null;
} else {
var width = (function (){var x__5090__auto__ = (frontend.util.get_width() - (96));
var y__5091__auto__ = (560);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var height = ((width * ((360) / (560))) | (0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"iframe","iframe",884422026),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"allowfullscreen","allowfullscreen",-1595290361),true,new cljs.core.Keyword(null,"framespacing","framespacing",-63114747),"0",new cljs.core.Keyword(null,"frameborder","frameborder",-7707960),"no",new cljs.core.Keyword(null,"border","border",1444987323),"0",new cljs.core.Keyword(null,"scrolling","scrolling",349011090),"no",new cljs.core.Keyword(null,"src","src",-1651076051),["https://player.bilibili.com/player.html?bvid=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"&high_quality=1"].join(''),new cljs.core.Keyword(null,"width","width",-384071477),width,new cljs.core.Keyword(null,"height","height",1025178622),(function (){var x__5087__auto__ = (500);
var y__5088__auto__ = height;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], null)], null);
}
} else {
return null;
}
} else {
return null;
}
});
frontend.components.block.macro_video_cp = (function frontend$components$block$macro_video_cp(_config,arguments$){
var temp__5802__auto__ = cljs.core.first(arguments$);
if(cljs.core.truth_(temp__5802__auto__)){
var url = temp__5802__auto__;
if(cljs.core.truth_(logseq.common.util.url_QMARK_(url))){
var results = frontend.util.text.get_matched_video(url);
var src = (function (){try{if(((cljs.core.vector_QMARK_(results)) && ((cljs.core.count(results) === 7)))){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((results_3__88449 === "youtube.com")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(id),(11))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["youtube-player",id], null);
} else {
return url;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88465){if((e88465 instanceof Error)){
var e__46744__auto__ = e88465;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((results_3__88449 === "youtu.be")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(id),(11))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["youtube-player",id], null);
} else {
return url;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88466){if((e88466 instanceof Error)){
var e__46744__auto____$1 = e88466;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((results_3__88449 === "y2u.be")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(id),(11))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["youtube-player",id], null);
} else {
return url;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88467){if((e88467 instanceof Error)){
var e__46744__auto____$2 = e88467;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((results_3__88449 === "youtube-nocookie.com")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
return ["https://www.youtube-nocookie.com/embed/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e88468){if((e88468 instanceof Error)){
var e__46744__auto____$3 = e88468;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((results_3__88449 === "loom.com")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
return ["https://www.loom.com/embed/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e88469){if((e88469 instanceof Error)){
var e__46744__auto____$4 = e88469;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{var results_3__88449 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(3));
if((function (p1__88419_SHARP_){
return clojure.string.ends_with_QMARK_(p1__88419_SHARP_,"vimeo.com");
})(results_3__88449)){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,(5));
return ["https://player.vimeo.com/video/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e88470){if((e88470 instanceof Error)){
var e__46744__auto____$5 = e88470;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$5;
}
} else {
throw e88470;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e88469;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e88468;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e88467;

}
}} else {
throw e__46744__auto____$1;
}
} else {
throw e88466;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88465;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88461){if((e88461 instanceof Error)){
var e__46744__auto__ = e88461;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(results)) && ((cljs.core.count(results) >= (6))))){
try{var results_left__88453 = cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(results,(0),(6));
if(((cljs.core.vector_QMARK_(results_left__88453)) && ((cljs.core.count(results_left__88453) === (6))))){
try{var results_left__88453_3__88458 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results_left__88453,(3));
if((results_left__88453_3__88458 === "bilibili.com")){
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results_left__88453,(5));
var query = cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(results,(6));
return ["https://player.bilibili.com/player.html?bvid=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"&high_quality=1&autoplay=0",(function (){var temp__5804__auto__ = cljs.core.second(query);
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return ["&page=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page)].join('');
} else {
return null;
}
})()].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e88464){if((e88464 instanceof Error)){
var e__46744__auto____$1 = e88464;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88464;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88463){if((e88463 instanceof Error)){
var e__46744__auto____$1 = e88463;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88463;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88462){if((e88462 instanceof Error)){
var e__46744__auto____$1 = e88462;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
return url;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88462;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88461;

}
}})();
if(((cljs.core.coll_QMARK_(src)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(src),"youtube-player")))){
var t = cljs.core.re_find(/&t=(\d+)/,url);
var opts = ((cljs.core.seq(t))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"start","start",-355208981),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(t,(1))], null):null);
return frontend.extensions.video.youtube.youtube_video(cljs.core.last(src),opts);
} else {
if(cljs.core.truth_(src)){
var width = (function (){var x__5090__auto__ = (frontend.util.get_width() - (96));
var y__5091__auto__ = (560);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var height = ((width * (((clojure.string.includes_QMARK_(src,"player.bilibili.com"))?(360):(315)) / (560))) | (0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"iframe","iframe",884422026),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"framespacing","framespacing",-63114747),new cljs.core.Keyword(null,"frame-border","frame-border",-1868748185),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"src","src",-1651076051),new cljs.core.Keyword(null,"allow","allow",-1857325745),new cljs.core.Keyword(null,"allow-full-screen","allow-full-screen",-1219396017),new cljs.core.Keyword(null,"scrolling","scrolling",349011090),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"height","height",1025178622)],["0","no",width,src,"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope",true,"no","0",height])], null);
} else {
return null;
}
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning.mr-1","span.warning.mr-1",1091749305),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid URL"], null),frontend.components.block.macro__GT_text("video",arguments$)], null);
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.warning.mr-1","span.warning.mr-1",1091749305),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Empty URL"], null),frontend.components.block.macro__GT_text("video",arguments$)], null);
}
});
frontend.components.block.macro_else_cp = (function frontend$components$block$macro_else_cp(name,config,arguments$){
var temp__5802__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5802__auto__)){
var block_uuid = temp__5802__auto__;
var format = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var macros_from_property = ((frontend.config.local_file_based_graph_QMARK_(frontend.state.get_current_repo()))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"macros","macros",811339431).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1((function (){var G__88471 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__88472 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88472) : frontend.db.entity.call(null,G__88472));
})()));
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88471) : frontend.db.entity.call(null,G__88471));
})())),name):null);
var macro_content = (function (){var or__5002__auto__ = macros_from_property;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.get_macros(),name);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.get_macros(),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(name));
}
}
})();
var macro_content__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"img"))?(function (){var G__88473 = cljs.core.count(arguments$);
switch (G__88473) {
case (1):
var G__88474 = "[:img {:src \"%s\"}]";
var G__88475 = cljs.core.first(arguments$);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__88474,G__88475) : frontend.util.format.call(null,G__88474,G__88475));

break;
case (4):
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(2)));
} else {
return and__5000__auto__;
}
})())){
var G__88476 = "[:img.%s {:src \"%s\" :style {:width %s :height %s}}]";
var G__88477 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(3));
var G__88478 = cljs.core.first(arguments$);
var G__88479 = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
var G__88480 = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(2)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$5 ? frontend.util.format.cljs$core$IFn$_invoke$arity$5(G__88476,G__88477,G__88478,G__88479,G__88480) : frontend.util.format.call(null,G__88476,G__88477,G__88478,G__88479,G__88480));
} else {
return null;
}

break;
case (3):
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(2)));
} else {
return and__5000__auto__;
}
})())){
var G__88481 = "[:img {:src \"%s\" :style {:width %s :height %s}}]";
var G__88482 = cljs.core.first(arguments$);
var G__88483 = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
var G__88484 = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(2)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$4 ? frontend.util.format.cljs$core$IFn$_invoke$arity$4(G__88481,G__88482,G__88483,G__88484) : frontend.util.format.call(null,G__88481,G__88482,G__88483,G__88484));
} else {
return null;
}

break;
case (2):
if(cljs.core.truth_(frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1))))){
var G__88485 = "[:img {:src \"%s\" :style {:width %s}}]";
var G__88486 = cljs.core.first(arguments$);
var G__88487 = frontend.util.safe_parse_int(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__88485,G__88486,G__88487) : frontend.util.format.call(null,G__88485,G__88486,G__88487));
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["right",null,"center",null,"left",null], null), null),clojure.string.lower_case(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1))))){
var G__88488 = "[:img.%s {:src \"%s\"}]";
var G__88489 = clojure.string.lower_case(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arguments$,(1)));
var G__88490 = cljs.core.first(arguments$);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__88488,G__88489,G__88490) : frontend.util.format.call(null,G__88488,G__88489,G__88490));
} else {
return macro_content;

}
}

break;
default:
return macro_content;

}
})():(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(arguments$);
if(and__5000__auto__){
return macro_content;
} else {
return and__5000__auto__;
}
})())?logseq.common.util.macro.macro_subs(macro_content,arguments$):macro_content
));
var macro_content__$2 = (cljs.core.truth_(macro_content__$1)?frontend.template.resolve_dynamic_template_BANG_(macro_content__$1):null);
return frontend.components.block.render_macro(config,name,arguments$,macro_content__$2,format);
} else {
var macro_content = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.get_macros(),name);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.get_macros(),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(name));
}
})();
var format = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","format","block/format",-1212045901)], null),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.components.block.render_macro(config,name,arguments$,macro_content,format);
}
});
frontend.components.block.namespace_hierarchy_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,namespace,children){
return daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88491(s__88492){
return (new cljs.core.LazySeq(null,(function (){
var s__88492__$1 = s__88492;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88492__$1);
if(temp__5804__auto__){
var s__88492__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88492__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88492__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88494 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88493 = (0);
while(true){
if((i__88493 < size__5479__auto__)){
var child = cljs.core._nth(c__5478__auto__,i__88493);
cljs.core.chunk_append(b__88494,daiquiri.core.create_element("li",{'key':["namespace-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(namespace),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(child))].join('')},[(function (){var shorten_name = (function (){var G__88495 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(child);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(child);
}
})();
var G__88495__$1 = (((G__88495 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__88495,"/"));
if((G__88495__$1 == null)){
return null;
} else {
return cljs.core.last(G__88495__$1);
}
})();
return frontend.components.block.page_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),shorten_name], null),child);
})(),((cljs.core.seq(new cljs.core.Keyword("namespace","children","namespace/children",-2095628387).cljs$core$IFn$_invoke$arity$1(child)))?daiquiri.interpreter.interpret((function (){var G__88499 = config;
var G__88500 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(child);
var G__88501 = new cljs.core.Keyword("namespace","children","namespace/children",-2095628387).cljs$core$IFn$_invoke$arity$1(child);
return (frontend.components.block.namespace_hierarchy_aux.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.namespace_hierarchy_aux.cljs$core$IFn$_invoke$arity$3(G__88499,G__88500,G__88501) : frontend.components.block.namespace_hierarchy_aux.call(null,G__88499,G__88500,G__88501));
})()):null)]));

var G__89457 = (i__88493 + (1));
i__88493 = G__89457;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88494),frontend$components$block$iter__88491(cljs.core.chunk_rest(s__88492__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88494),null);
}
} else {
var child = cljs.core.first(s__88492__$2);
return cljs.core.cons(daiquiri.core.create_element("li",{'key':["namespace-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(namespace),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(child))].join('')},[(function (){var shorten_name = (function (){var G__88502 = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(child);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(child);
}
})();
var G__88502__$1 = (((G__88502 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__88502,"/"));
if((G__88502__$1 == null)){
return null;
} else {
return cljs.core.last(G__88502__$1);
}
})();
return frontend.components.block.page_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),shorten_name], null),child);
})(),((cljs.core.seq(new cljs.core.Keyword("namespace","children","namespace/children",-2095628387).cljs$core$IFn$_invoke$arity$1(child)))?daiquiri.interpreter.interpret((function (){var G__88506 = config;
var G__88507 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(child);
var G__88508 = new cljs.core.Keyword("namespace","children","namespace/children",-2095628387).cljs$core$IFn$_invoke$arity$1(child);
return (frontend.components.block.namespace_hierarchy_aux.cljs$core$IFn$_invoke$arity$3 ? frontend.components.block.namespace_hierarchy_aux.cljs$core$IFn$_invoke$arity$3(G__88506,G__88507,G__88508) : frontend.components.block.namespace_hierarchy_aux.call(null,G__88506,G__88507,G__88508));
})()):null)]),frontend$components$block$iter__88491(cljs.core.rest(s__88492__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(children);
})())]);
}),null,"frontend.components.block/namespace-hierarchy-aux");
frontend.components.block.namespace_hierarchy = rum.core.lazy_build(rum.core.build_defc,(function (config,namespace,children){
return daiquiri.core.create_element("div",{'className':"namespace"},[daiquiri.core.create_element("div",{'className':"font-medium flex flex-row items-center pb-2"},[daiquiri.core.create_element("span",{'className':"text-sm mr-1"},["Namespace "]),frontend.components.block.page_cp(config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),namespace], null))]),frontend.components.block.namespace_hierarchy_aux(config,namespace,children)]);
}),null,"frontend.components.block/namespace-hierarchy");
frontend.components.block.macro_cp = (function frontend$components$block$macro_cp(config,options){
var map__88511 = options;
var map__88511__$1 = cljs.core.__destructure_map(map__88511);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88511__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88511__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
var arguments$__$1 = (((((cljs.core.count(arguments$) >= (2))) && (((clojure.string.starts_with_QMARK_(cljs.core.first(arguments$),logseq.common.util.page_ref.left_brackets)) && (clojure.string.ends_with_QMARK_(cljs.core.last(arguments$),logseq.common.util.page_ref.right_brackets))))))?(function (){var title = clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",arguments$);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [title], null);
})():arguments$);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"query")){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"{{query}} is deprecated. Use '/Query' command instead."], null);
} else {
return frontend.components.block.macro_query_cp(config,arguments$__$1);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"function")){
return frontend.components.block.macro_function_cp(config,arguments$__$1);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"namespace")){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"Namespace is deprecated, use tags instead"], null);
} else {
var namespace = cljs.core.first(arguments$__$1);
if(clojure.string.blank_QMARK_(namespace)){
return null;
} else {
var namespace__$1 = clojure.string.lower_case(logseq.common.util.page_ref.get_page_name_BANG_(namespace));
var children = frontend.db.file_based.model.get_namespace_hierarchy(frontend.state.get_current_repo(),namespace__$1);
return frontend.components.block.namespace_hierarchy(config,namespace__$1,children);
}
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"youtube")){
var temp__5804__auto__ = cljs.core.first(arguments$__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var url = temp__5804__auto__;
var temp__5804__auto____$1 = ((((11) === cljs.core.count(url)))?url:cljs.core.nth.cljs$core$IFn$_invoke$arity$2((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(frontend.util.text.youtube_regex,url) : frontend.util.safe_re_find.call(null,frontend.util.text.youtube_regex,url)),(5))
);
if(cljs.core.truth_(temp__5804__auto____$1)){
var youtube_id = temp__5804__auto____$1;
if(clojure.string.blank_QMARK_(youtube_id)){
return null;
} else {
return frontend.extensions.video.youtube.youtube_video(youtube_id,null);
}
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"youtube-timestamp")){
var temp__5804__auto__ = cljs.core.first(arguments$__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var timestamp_SINGLEQUOTE_ = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.extensions.video.youtube.parse_timestamp(timestamp_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto____$1)){
var seconds = temp__5804__auto____$1;
return frontend.extensions.video.youtube.timestamp(seconds);
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"zotero-imported-file")){
var vec__88512 = arguments$__$1;
var item_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88512,(0),null);
var filename = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88512,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = item_key;
if(cljs.core.truth_(and__5000__auto__)){
return filename;
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),frontend.extensions.zotero.zotero_imported_file(item_key,filename)], null);
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"zotero-linked-file")){
var temp__5804__auto__ = cljs.core.first(arguments$__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),frontend.extensions.zotero.zotero_linked_file(path)], null);
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"vimeo")){
return frontend.components.block.macro_vimeo_cp(config,arguments$__$1);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"bilibili")){
return frontend.components.block.macro_bilibili_cp(config,arguments$__$1);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"video")){
return frontend.components.block.macro_video_cp(config,arguments$__$1);
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["twitter",null,"tweet",null], null), null),name)){
var temp__5804__auto__ = cljs.core.first(arguments$__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var url = temp__5804__auto__;
var id_regex = /\/status\/(\d+)/;
var temp__5804__auto____$1 = (((cljs.core.count(url) <= (15)))?url:cljs.core.last((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(id_regex,url) : frontend.util.safe_re_find.call(null,id_regex,url)))
);
if(cljs.core.truth_(temp__5804__auto____$1)){
var id = temp__5804__auto____$1;
return frontend.ui.tweet_embed(id);
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"embed")){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"{{embed}} is deprecated. Use '/Node embed' command instead."], null);
} else {
return frontend.components.block.macro_embed_cp(config,arguments$__$1);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"renderer")){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
var temp__5804__auto__ = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config));
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
return frontend.components.plugins.hook_ui_slot(new cljs.core.Keyword(null,"macro-renderer-slotted","macro-renderer-slotted",-1582637864),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),block_uuid));
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.macro.macros),name))){
var fexpr__88515 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.components.macro.macros),name);
return (fexpr__88515.cljs$core$IFn$_invoke$arity$2 ? fexpr__88515.cljs$core$IFn$_invoke$arity$2(config,options) : fexpr__88515.call(null,config,options));
} else {
return frontend.components.block.macro_else_cp(name,config,arguments$__$1);

}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
frontend.components.block.emphasis_cp = (function frontend$components$block$emphasis_cp(config,kind,data){
var elem = (function (){var G__88516 = kind;
switch (G__88516) {
case "Bold":
return new cljs.core.Keyword(null,"b","b",1482224470);

break;
case "Italic":
return new cljs.core.Keyword(null,"i","i",-1386841315);

break;
case "Underline":
return new cljs.core.Keyword(null,"ins","ins",-1021983570);

break;
case "Strike_through":
return new cljs.core.Keyword(null,"del","del",574975584);

break;
case "Highlight":
return new cljs.core.Keyword(null,"mark","mark",-373816345);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__88516)].join('')));

}
})();
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(elem,(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,data) : frontend.components.block.map_inline.call(null,config,data)));
});
frontend.components.block.hiccup__GT_html = (function frontend$components$block$hiccup__GT_html(s){
var result = logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$1(s);
var result_SINGLEQUOTE_ = ((cljs.core.seq(result))?result:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid hiccup"], null),s], null));
return frontend.security.sanitize_html(cljs.core.str.cljs$core$IFn$_invoke$arity$1(hiccups.runtime.render_html(result_SINGLEQUOTE_)));
});
frontend.components.block.inline = (function frontend$components$block$inline(p__88517,item){
var map__88518 = p__88517;
var map__88518__$1 = cljs.core.__destructure_map(map__88518);
var config = map__88518__$1;
var html_export_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88518__$1,new cljs.core.Keyword(null,"html-export?","html-export?",504770426));
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Plain")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return s;
} else {
throw cljs.core.match.backtrack;

}
}catch (e88575){if((e88575 instanceof Error)){
var e__46744__auto__ = e88575;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Spaces")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return s;
} else {
throw cljs.core.match.backtrack;

}
}catch (e88576){if((e88576 instanceof Error)){
var e__46744__auto____$1 = e88576;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Superscript")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sup","sup",-2039492346),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,l) : frontend.components.block.map_inline.call(null,config,l)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e88577){if((e88577 instanceof Error)){
var e__46744__auto____$2 = e88577;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Subscript")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sub","sub",-2093760025),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,l) : frontend.components.block.map_inline.call(null,config,l)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e88578){if((e88578 instanceof Error)){
var e__46744__auto____$3 = e88578;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Tag")){
var temp__5804__auto__ = logseq.graph_parser.block.get_tag(item);
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
var s__$1 = (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(s) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,s));
return frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),s__$1], null));
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88579){if((e88579 instanceof Error)){
var e__46744__auto____$4 = e88579;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Emphasis")){
try{var item_1__88522 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(((cljs.core.vector_QMARK_(item_1__88522)) && ((cljs.core.count(item_1__88522) === 2)))){
try{var item_1__88522_0__88523 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88522,(0));
if(((cljs.core.vector_QMARK_(item_1__88522_0__88523)) && ((cljs.core.count(item_1__88522_0__88523) === 1)))){
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88522_0__88523,(0));
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88522,(1));
return frontend.components.block.emphasis_cp(config,kind,data);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88594){if((e88594 instanceof Error)){
var e__46744__auto____$5 = e88594;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$5;
}
} else {
throw e88594;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88593){if((e88593 instanceof Error)){
var e__46744__auto____$5 = e88593;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$5;
}
} else {
throw e88593;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88580){if((e88580 instanceof Error)){
var e__46744__auto____$5 = e88580;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Entity")){
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.security.sanitize_html(new cljs.core.Keyword(null,"html","html",-998796897).cljs$core$IFn$_invoke$arity$1(e))], null)], null)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88581){if((e88581 instanceof Error)){
var e__46744__auto____$6 = e88581;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Latex_Fragment")){
try{var item_1__88522 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(((cljs.core.vector_QMARK_(item_1__88522)) && ((cljs.core.count(item_1__88522) === 2)))){
var display = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88522,(0));
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88522,(1));
if(cljs.core.truth_(html_export_QMARK_)){
return frontend.extensions.latex.html_export(s,false,true);
} else {
return frontend.extensions.latex.latex(s,false,cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(display,"Inline"));
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88592){if((e88592 instanceof Error)){
var e__46744__auto____$7 = e88592;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$7;
}
} else {
throw e88592;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88582){if((e88582 instanceof Error)){
var e__46744__auto____$7 = e88582;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Target")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),s], null),s], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88583){if((e88583 instanceof Error)){
var e__46744__auto____$8 = e88583;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Radio_Target")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),s], null),s], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88584){if((e88584 instanceof Error)){
var e__46744__auto____$9 = e88584;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Email")){
var address = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var map__88591 = address;
var map__88591__$1 = cljs.core.__destructure_map(map__88591);
var local_part = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88591__$1,new cljs.core.Keyword(null,"local_part","local_part",-1705904558));
var domain = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88591__$1,new cljs.core.Keyword(null,"domain","domain",1847214937));
var address__$1 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_part),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain)].join('');
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),["mailto:",address__$1].join('')], null),address__$1], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88585){if((e88585 instanceof Error)){
var e__46744__auto____$10 = e88585;
if((e__46744__auto____$10 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Nested_link")){
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.nested_link(config,html_export_QMARK_,link);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88586){if((e88586 instanceof Error)){
var e__46744__auto____$11 = e88586;
if((e__46744__auto____$11 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Link")){
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.link_cp(config,link);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88587){if((e88587 instanceof Error)){
var e__46744__auto____$12 = e88587;
if((e__46744__auto____$12 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Verbatim")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),s], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88588){if((e88588 instanceof Error)){
var e__46744__auto____$13 = e88588;
if((e__46744__auto____$13 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Code")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),s], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88589){if((e88589 instanceof Error)){
var e__46744__auto____$14 = e88589;
if((e__46744__auto____$14 === cljs.core.match.backtrack)){
try{var item_0__88521 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88521 === "Inline_Source_Block")){
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword(null,"code","code",1586293142).cljs$core$IFn$_invoke$arity$1(x)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88590){if((e88590 instanceof Error)){
var e__46744__auto____$15 = e88590;
if((e__46744__auto____$15 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$15;
}
} else {
throw e88590;

}
}} else {
throw e__46744__auto____$14;
}
} else {
throw e88589;

}
}} else {
throw e__46744__auto____$13;
}
} else {
throw e88588;

}
}} else {
throw e__46744__auto____$12;
}
} else {
throw e88587;

}
}} else {
throw e__46744__auto____$11;
}
} else {
throw e88586;

}
}} else {
throw e__46744__auto____$10;
}
} else {
throw e88585;

}
}} else {
throw e__46744__auto____$9;
}
} else {
throw e88584;

}
}} else {
throw e__46744__auto____$8;
}
} else {
throw e88583;

}
}} else {
throw e__46744__auto____$7;
}
} else {
throw e88582;

}
}} else {
throw e__46744__auto____$6;
}
} else {
throw e88581;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e88580;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e88579;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e88578;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e88577;

}
}} else {
throw e__46744__auto____$1;
}
} else {
throw e88576;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88575;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88545){if((e88545 instanceof Error)){
var e__46744__auto__ = e88545;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 3)))){
try{var item_0__88528 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88528 === "Export_Snippet")){
try{var item_1__88529 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__88529 === "html")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
if(cljs.core.not(html_export_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.security.sanitize_html(s)], null)], null)], null);
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88574){if((e88574 instanceof Error)){
var e__46744__auto____$1 = e88574;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88574;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88573){if((e88573 instanceof Error)){
var e__46744__auto____$1 = e88573;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e88573;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88546){if((e88546 instanceof Error)){
var e__46744__auto____$1 = e88546;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__88531 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88531 === "Inline_Hiccup")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.ui.catch_error(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid hiccup"], null),s], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.components.block.hiccup__GT_html(s)], null)], null)], null));
} else {
throw cljs.core.match.backtrack;

}
}catch (e88571){if((e88571 instanceof Error)){
var e__46744__auto____$2 = e88571;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{var item_0__88531 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88531 === "Inline_Html")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(cljs.core.not(html_export_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.security.sanitize_html(s)], null)], null)], null);
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e88572){if((e88572 instanceof Error)){
var e__46744__auto____$3 = e88572;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$3;
}
} else {
throw e88572;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e88571;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88547){if((e88547 instanceof Error)){
var e__46744__auto____$2 = e88547;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 1)))){
try{var item_0__88533 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88533 === "Break_Line")){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88569){if((e88569 instanceof Error)){
var e__46744__auto____$3 = e88569;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{var item_0__88533 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88533 === "Hard_Break_Line")){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88570){if((e88570 instanceof Error)){
var e__46744__auto____$4 = e88570;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$4;
}
} else {
throw e88570;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e88569;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88548){if((e88548 instanceof Error)){
var e__46744__auto____$3 = e88548;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__88534 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88534 === "Timestamp")){
try{var item_1__88535 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(((cljs.core.vector_QMARK_(item_1__88535)) && ((cljs.core.count(item_1__88535) === 2)))){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Scheduled")){
var _timestamp = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return null;
} else {
throw cljs.core.match.backtrack;

}
}catch (e88560){if((e88560 instanceof Error)){
var e__46744__auto____$4 = e88560;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Deadline")){
var _timestamp = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return null;
} else {
throw cljs.core.match.backtrack;

}
}catch (e88561){if((e88561 instanceof Error)){
var e__46744__auto____$5 = e88561;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Date")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return frontend.components.block.timestamp(t,"Date");
} else {
throw cljs.core.match.backtrack;

}
}catch (e88562){if((e88562 instanceof Error)){
var e__46744__auto____$6 = e88562;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Closed")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return frontend.components.block.timestamp(t,"Closed");
} else {
throw cljs.core.match.backtrack;

}
}catch (e88563){if((e88563 instanceof Error)){
var e__46744__auto____$7 = e88563;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Range")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return frontend.components.block.range(t,false);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88564){if((e88564 instanceof Error)){
var e__46744__auto____$8 = e88564;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
try{var item_1__88535_0__88536 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88536 === "Clock")){
try{var item_1__88535_1__88537 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
if(((cljs.core.vector_QMARK_(item_1__88535_1__88537)) && ((cljs.core.count(item_1__88535_1__88537) === 2)))){
try{var item_1__88535_1__88537_0__88538 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535_1__88537,(0));
if((item_1__88535_1__88537_0__88538 === "Stopped")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535_1__88537,(1));
return frontend.components.block.range(t,true);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88567){if((e88567 instanceof Error)){
var e__46744__auto____$9 = e88567;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
try{var item_1__88535_1__88537_0__88538 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535_1__88537,(0));
if((item_1__88535_1__88537_0__88538 === "Started")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535_1__88537,(1));
return frontend.components.block.timestamp(t,"Started");
} else {
throw cljs.core.match.backtrack;

}
}catch (e88568){if((e88568 instanceof Error)){
var e__46744__auto____$10 = e88568;
if((e__46744__auto____$10 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$10;
}
} else {
throw e88568;

}
}} else {
throw e__46744__auto____$9;
}
} else {
throw e88567;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88566){if((e88566 instanceof Error)){
var e__46744__auto____$9 = e88566;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$9;
}
} else {
throw e88566;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88565){if((e88565 instanceof Error)){
var e__46744__auto____$9 = e88565;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$9;
}
} else {
throw e88565;

}
}} else {
throw e__46744__auto____$8;
}
} else {
throw e88564;

}
}} else {
throw e__46744__auto____$7;
}
} else {
throw e88563;

}
}} else {
throw e__46744__auto____$6;
}
} else {
throw e88562;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e88561;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e88560;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88559){if((e88559 instanceof Error)){
var e__46744__auto____$4 = e88559;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$4;
}
} else {
throw e88559;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88550){if((e88550 instanceof Error)){
var e__46744__auto____$4 = e88550;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{var item_0__88534 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88534 === "Cookie")){
try{var item_1__88535 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(((cljs.core.vector_QMARK_(item_1__88535)) && ((cljs.core.count(item_1__88535) === 2)))){
try{var item_1__88535_0__88540 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88540 === "Percent")){
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"cookie-percent"], null),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[%d%%]",n) : frontend.util.format.call(null,"[%d%%]",n))], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88558){if((e88558 instanceof Error)){
var e__46744__auto____$5 = e88558;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$5;
}
} else {
throw e88558;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88555){if((e88555 instanceof Error)){
var e__46744__auto____$5 = e88555;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{var item_1__88535 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(((cljs.core.vector_QMARK_(item_1__88535)) && ((cljs.core.count(item_1__88535) === 3)))){
try{var item_1__88535_0__88542 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(0));
if((item_1__88535_0__88542 === "Absolute")){
var current = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(1));
var total = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item_1__88535,(2));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"cookie-absolute"], null),(frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[%d/%d]",current,total) : frontend.util.format.call(null,"[%d/%d]",current,total))], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88557){if((e88557 instanceof Error)){
var e__46744__auto____$6 = e88557;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$6;
}
} else {
throw e88557;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88556){if((e88556 instanceof Error)){
var e__46744__auto____$6 = e88556;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$6;
}
} else {
throw e88556;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e88555;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88551){if((e88551 instanceof Error)){
var e__46744__auto____$5 = e88551;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{var item_0__88534 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88534 === "Footnote_Reference")){
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var map__88554 = options;
var map__88554__$1 = cljs.core.__destructure_map(map__88554);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88554__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var encode_name = frontend.util.url_encode(name);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup.fn","sup.fn",403400163),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),["fnr.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encode_name)].join(''),new cljs.core.Keyword(null,"class","class",-2030961996),"footref",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.jump_to_anchor_BANG_(["fn.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encode_name)].join(''));
})], null),name], null)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88552){if((e88552 instanceof Error)){
var e__46744__auto____$6 = e88552;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
try{var item_0__88534 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__88534 === "Macro")){
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.macro_cp(config,options);
} else {
throw cljs.core.match.backtrack;

}
}catch (e88553){if((e88553 instanceof Error)){
var e__46744__auto____$7 = e88553;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$7;
}
} else {
throw e88553;

}
}} else {
throw e__46744__auto____$6;
}
} else {
throw e88552;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e88551;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e88550;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e88549){if((e88549 instanceof Error)){
var e__46744__auto____$4 = e88549;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
return "";
} else {
throw e__46744__auto____$4;
}
} else {
throw e88549;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e88548;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e88547;

}
}} else {
throw e__46744__auto____$1;
}
} else {
throw e88546;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e88545;

}
}});
frontend.components.block.block_child = rum.core.lazy_build(rum.core.build_defc,(function (block){
return daiquiri.interpreter.interpret(block);
}),null,"frontend.components.block/block-child");
frontend.components.block.dnd_same_block_QMARK_ = (function frontend$components$block$dnd_same_block_QMARK_(uuid){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.components.block._STAR_dragging_block)),uuid);
});
frontend.components.block.on_drag_start = (function frontend$components$block$on_drag_start(event,block,block_id){
var selected = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__88595_SHARP_){
return p1__88595_SHARP_.id;
}),frontend.state.get_selection_blocks()));
var selected_QMARK_ = cljs.core.contains_QMARK_(selected,block_id);
var block_uuid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(selected_QMARK_){
} else {
(frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.util.clear_selection_BANG_.call(null));

frontend.handler.editor.highlight_block_BANG_(block_uuid);
}

frontend.handler.editor.block__GT_data_transfer_BANG_(block_uuid,event,false);

frontend.components.block.goog$module$goog$object.get(event,"dataTransfer").setData("block-dom-id",block_id);

cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_QMARK_,true);

return cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_block,block);
});
frontend.components.block.bullet_on_click = (function frontend$components$block$bullet_on_click(e,block,uuid,p__88596){
var map__88597 = p__88596;
var map__88597__$1 = cljs.core.__destructure_map(map__88597);
var on_redirect_to_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88597__$1,new cljs.core.Keyword(null,"on-redirect-to-page","on-redirect-to-page",-1420791266));
if(frontend.handler.property.util.shape_block_QMARK_(block)){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),uuid], null));
} else {
if(cljs.core.truth_(frontend.components.block.goog$module$goog$object.get(e,"shiftKey"))){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block","block",664686210));

return frontend.util.stop(e);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.whiteboard.inside_portal_QMARK_(e.target);
} else {
return and__5000__auto__;
}
})())){
frontend.handler.whiteboard.add_new_block_portal_shape_BANG_(uuid,frontend.handler.whiteboard.closest_shape(e.target));

return frontend.util.stop(e);
} else {
if(cljs.core.truth_(uuid)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = on_redirect_to_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.route.redirect_to_page_BANG_;
}
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)], null));
} else {
return null;
}

}
}
}
});
frontend.components.block.block_children = rum.core.lazy_build(rum.core.build_defc,(function (config,block,children,collapsed_QMARK_){
var ref_QMARK_ = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
var query_QMARK_ = new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config);
var children__$1 = ((cljs.core.coll_QMARK_(children))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,children):null);
if(((cljs.core.coll_QMARK_(children__$1)) && (((cljs.core.seq(children__$1)) && (cljs.core.not(collapsed_QMARK_)))))){
return daiquiri.core.create_element("div",{'className':"block-children-container flex"},[daiquiri.core.create_element("div",{'onClick':(function (_){
return frontend.handler.editor.toggle_open_block_children_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
}),'className':"block-children-left-border"},[]),daiquiri.core.create_element("div",{'style':{'display':(cljs.core.truth_(collapsed_QMARK_)?"none":"")},'className':"block-children w-full"},[(function (){var config_SINGLEQUOTE_ = (function (){var G__88598 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"embed-parent","embed-parent",1172681354)], 0));
var G__88598__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = ref_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_QMARK_;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88598,new cljs.core.Keyword(null,"ref-query-child?","ref-query-child?",317345933),true):G__88598);
var G__88598__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88598__$1,new cljs.core.Keyword(null,"block-children?","block-children?",-2080380608),true)
;
if(cljs.core.integer_QMARK_(new cljs.core.Keyword(null,"block-level","block-level",390971879).cljs$core$IFn$_invoke$arity$1(config))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__88598__$2,new cljs.core.Keyword(null,"block-level","block-level",390971879),cljs.core.inc);
} else {
return G__88598__$2;
}
})();
return daiquiri.interpreter.interpret((frontend.components.block.block_list.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.block_list.cljs$core$IFn$_invoke$arity$2(config_SINGLEQUOTE_,children__$1) : frontend.components.block.block_list.call(null,config_SINGLEQUOTE_,children__$1)));
})()])]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/block-children");
frontend.components.block.block_content_empty_QMARK_ = (function frontend$components$block$block_content_empty_QMARK_(block){
return clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
});
frontend.components.block.block_control = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,block,p__88600){
var map__88601 = p__88600;
var map__88601__$1 = cljs.core.__destructure_map(map__88601);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var _STAR_control_show_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"*control-show?","*control-show?",-2136402257));
var edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"edit?","edit?",-842131310));
var selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"selected?","selected?",-742502788));
var top_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"top?","top?",-1883283796));
var bottom_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88601__$1,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628));
var _STAR_bullet_dragging_QMARK_ = new cljs.core.Keyword("frontend.components.block","dragging?","frontend.components.block/dragging?",-565044275).cljs$core$IFn$_invoke$arity$1(state);
var doc_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("document","mode?","document/mode?",-994203479));
var control_show_QMARK_ = frontend.util.react(_STAR_control_show_QMARK_);
var ref_QMARK_ = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
var empty_content_QMARK_ = frontend.components.block.block_content_empty_QMARK_(block);
var fold_button_right_QMARK_ = frontend.state.enable_fold_button_right_QMARK_();
var own_number_list_QMARK_ = new cljs.core.Keyword(null,"own-order-number-list?","own-order-number-list?",2048042976).cljs$core$IFn$_invoke$arity$1(config);
var order_list_QMARK_ = cljs.core.boolean$(own_number_list_QMARK_);
var order_list_idx = new cljs.core.Keyword(null,"own-order-list-index","own-order-list-index",2051635079).cljs$core$IFn$_invoke$arity$1(config);
var page_title_QMARK_ = new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config);
var collapsable_QMARK_ = frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$2(uuid,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"semantic?","semantic?",-1258468577),true,new cljs.core.Keyword(null,"ignore-children?","ignore-children?",1993539421),page_title_QMARK_], null));
var link_QMARK_ = cljs.core.boolean$(new cljs.core.Keyword(null,"original-block","original-block",1808045862).cljs$core$IFn$_invoke$arity$1(config));
var icon_size = (cljs.core.truth_(collapsed_QMARK_)?(12):(14));
var icon = frontend.components.icon.get_node_icon_cp(block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),icon_size,new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null));
var with_icon_QMARK_ = (function (){var and__5000__auto__ = (!((icon == null)));
if(and__5000__auto__){
var or__5002__auto__ = (frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : frontend.db.page_QMARK_.call(null,block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = link_QMARK_;
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = cljs.core.some(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["pdf",null], null), null),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(block));
}
}
}
}
} else {
return and__5000__auto__;
}
})();
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-control-wrap","flex","flex-row","items-center","h-6",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"is-order-list","is-order-list",493359915),order_list_QMARK_,new cljs.core.Keyword(null,"is-with-icon","is-with-icon",1801728303),with_icon_QMARK_,new cljs.core.Keyword(null,"bullet-closed","bullet-closed",1327473821),collapsed_QMARK_,new cljs.core.Keyword(null,"bullet-hidden","bullet-hidden",-1622280410),new cljs.core.Keyword(null,"hide-bullet?","hide-bullet?",-990541419).cljs$core$IFn$_invoke$arity$1(config)], null)], null))], null))},[(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = cljs.core.not(fold_button_right_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = collapsable_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return collapsed_QMARK_;
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config));
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("a",{'id':["control-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''),'onClick':(function (event){
frontend.util.stop(event);

frontend.state.clear_edit_BANG_();

promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(ref_QMARK_)?frontend.state.toggle_collapsed_block_BANG_(uuid):(cljs.core.truth_(collapsed_QMARK_)?frontend.handler.editor.expand_block_BANG_(uuid):frontend.handler.editor.collapse_block_BANG_(uuid)))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0());
}));
}));

if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.developer_mode_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return event.metaKey;
} else {
return and__5000__auto__;
}
})())){
return console.debug("[block config]==",config);
} else {
return null;
}
}),'className':"block-control"},[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = control_show_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return collapsable_QMARK_;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto____$1 = page_title_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((order_list_QMARK_) || (frontend.config.publishing_QMARK_));
}
} else {
return and__5000__auto__;
}
}
})())?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(collapsed_QMARK_)])]):null),(cljs.core.truth_(new cljs.core.Keyword(null,"hide-bullet?","hide-bullet?",-990541419).cljs$core$IFn$_invoke$arity$1(config))?null:(function (){var bullet = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.bullet-link-wrap","a.bullet-link-wrap",1602419423),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__88599_SHARP_){
return frontend.components.block.bullet_on_click(p1__88599_SHARP_,block,uuid,config);
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.bullet-container.cursor","span.bullet-container.cursor",-1172876867),(function (){var G__88602 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),["dot-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''),new cljs.core.Keyword(null,"blockid","blockid",-664467760),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),new cljs.core.Keyword(null,"class","class",-2030961996),[(cljs.core.truth_(collapsed_QMARK_)?"bullet-closed":null),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("document","mode?","document/mode?",-994203479).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(collapsed_QMARK_);
} else {
return and__5000__auto__;
}
})())?" hide-inner-bullet":null),((order_list_QMARK_)?" as-order-list typed-list":null)].join('')], null);
if(cljs.core.not(frontend.util.mobile_QMARK_())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__88602,new cljs.core.Keyword(null,"draggable","draggable",1676206163),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-drag-start","on-drag-start",-47712205),(function (event){
cljs.core.reset_BANG_(_STAR_bullet_dragging_QMARK_,true);

frontend.util.stop_propagation(event);

return frontend.components.block.on_drag_start(event,block,block_id);
}),new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (_e){
return cljs.core.reset_BANG_(_STAR_bullet_dragging_QMARK_,false);
})], 0));
} else {
return G__88602;
}
})(),(cljs.core.truth_(with_icon_QMARK_)?icon:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.bullet","span.bullet",1911638461),(function (){var G__88603 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"blockid","blockid",-664467760),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)], null);
if(cljs.core.truth_(selected_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88603,new cljs.core.Keyword(null,"class","class",-2030961996),"selected");
} else {
return G__88603;
}
})(),((order_list_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label","label",1718410804),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(order_list_idx),"."].join('')], null):null)], null))], null)], null);
var bullet_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("ui","show-empty-bullets?","ui/show-empty-bullets?",1453722088).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = collapsed_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = collapsable_QMARK_;
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return (((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)) - new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block)) < (500));
}
}
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(doc_mode_QMARK_);
} else {
return and__5000__auto__;
}
})())?bullet:(cljs.core.truth_((function (){var or__5002__auto__ = ((empty_content_QMARK_) && (((cljs.core.not(edit_QMARK_)) && (((cljs.core.not(top_QMARK_)) && (((cljs.core.not(bottom_QMARK_)) && (((cljs.core.not(frontend.util.react(_STAR_control_show_QMARK_))) && (cljs.core.not(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block))))))))))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = doc_mode_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(collapsed_QMARK_)) && (cljs.core.not(frontend.util.react(_STAR_control_show_QMARK_))));
} else {
return and__5000__auto__;
}
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.bullet-container","span.bullet-container",-1847146553)], null):bullet
));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(_STAR_bullet_dragging_QMARK_));
} else {
return and__5000__auto__;
}
})())){
return frontend.ui.tooltip(bullet_SINGLEQUOTE_,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-1.p-2","div.flex.flex-col.gap-1.p-2",1834455748),(function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908).cljs$core$IFn$_invoke$arity$1(block);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var created_by = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(created_by)], null);
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Created: ",frontend.date.int__GT_local_time_2(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Last edited: ",frontend.date.int__GT_local_time_2(new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(block))], null)], null));
} else {
return daiquiri.interpreter.interpret(bullet_SINGLEQUOTE_);
}
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","dragging?","frontend.components.block/dragging?",-565044275))], null),"frontend.components.block/block-control");
frontend.components.block.dnd_separator = rum.core.lazy_build(rum.core.build_defc,(function (move_to){
return daiquiri.core.create_element("div",{'className':"relative"},[daiquiri.core.create_element("div",{'style':{'left':(function (){var G__88604 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(move_to,new cljs.core.Keyword(null,"nested","nested",18943849)))?(48):(20));
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
return (G__88604 - (20));
} else {
return G__88604;
}
})(),'top':(0),'width':"100%",'zIndex':(3)},'className':"dnd-separator absolute"},[])]);
}),null,"frontend.components.block/dnd-separator");
frontend.components.block.list_checkbox = (function frontend$components$block$list_checkbox(config,checked_QMARK_){
return frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),(6)], null),new cljs.core.Keyword(null,"value","value",305978217),checked_QMARK_,new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (event){
var target = event.target;
var block = new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config);
var item_content = target.nextSibling.data;
return frontend.handler.editor.toggle_list_checkbox(block,item_content);
})], null));
});
frontend.components.block.text_block_title = rum.core.lazy_build(rum.core.build_defc,(function (config,block){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var format = ((db_based_QMARK_)?new cljs.core.Keyword(null,"markdown","markdown",1227225089):(function (){var or__5002__auto__ = new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})());
var pre_block_QMARK_ = ((db_based_QMARK_)?false:new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block));
var marker = ((db_based_QMARK_)?null:new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block));
var block__$1 = ((cljs.core.not(new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067).cljs$core$IFn$_invoke$arity$1(block)))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(cljs.core.uuid,format,pre_block_QMARK_,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))], 0)):block);
var block_ast_title = new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067).cljs$core$IFn$_invoke$arity$1(block__$1);
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"block","block",664686210),block__$1);
var level = new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(config__$1);
var block_ref_QMARK_ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config__$1);
var block_type = (function (){var or__5002__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})();
var html_export_QMARK_ = new cljs.core.Keyword(null,"html-export?","html-export?",504770426).cljs$core$IFn$_invoke$arity$1(config__$1);
var bg_color = frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property","background-color","logseq.property/background-color",-519126606));
var heading_level = new cljs.core.Keyword("block","heading-level","block/heading-level",661361785).cljs$core$IFn$_invoke$arity$1(block__$1);
var heading = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = heading_level;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (heading_level <= (6));
if(and__5000__auto____$1){
return heading_level;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415));
}
})();
var heading__$1 = ((heading === true)?(function (){var x__5090__auto__ = (level + (1));
var y__5091__auto__ = (6);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():heading);
var elem = (cljs.core.truth_(heading__$1)?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(["h",cljs.core.str.cljs$core$IFn$_invoke$arity$1(heading__$1),".block-title-wrap.as-heading",(cljs.core.truth_(block_ref_QMARK_)?".as-inline":null)].join('')):new cljs.core.Keyword(null,"span.block-title-wrap","span.block-title-wrap",547365639));
return daiquiri.interpreter.interpret(frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(elem,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-hl-type","data-hl-type",890635169),frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832))], null),(cljs.core.truth_((function (){var and__5000__auto__ = marker;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(clojure.string.blank_QMARK_(marker)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("nil",marker)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-marker","data-marker",-325466269),clojure.string.lower_case(marker)], null):null),(cljs.core.truth_(bg_color)?(function (){var built_in_color_QMARK_ = frontend.ui.built_in_color_QMARK_(bg_color);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"background-color","background-color",570434026),(cljs.core.truth_(built_in_color_QMARK_)?["var(--ls-highlight-color-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(bg_color),")"].join(''):bg_color),new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(built_in_color_QMARK_)?null:"white")], null),new cljs.core.Keyword(null,"class","class",-2030961996),"px-1 with-bg-color"], null);
})():null)], 0)),(function (){var area_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"area","area",472007256),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832))));
var hl_ref = (function (){
if(cljs.core.not((function (){var fexpr__88611 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938),null,new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null);
return (fexpr__88611.cljs$core$IFn$_invoke$arity$1 ? fexpr__88611.cljs$core$IFn$_invoke$arity$1(block_type) : fexpr__88611.call(null,block_type));
})())){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.prefix-link","div.prefix-link",1572303303),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
var target = e.target;
var G__88612 = block_type;
var G__88612__$1 = (((G__88612 instanceof cljs.core.Keyword))?G__88612.fqn:null);
switch (G__88612__$1) {
case "annotation":
if(cljs.core.truth_((function (){var and__5000__auto__ = area_QMARK_;
if(and__5000__auto__){
return target.classList.contains("blank");
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword(null,"actions","actions",-812656882);
} else {
frontend.extensions.pdf.assets.open_block_ref_BANG_(block__$1);

return frontend.util.stop(e);
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.hl-page","span.hl-page",-1375814803),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.forbid-edit","strong.forbid-edit",1321731345),["P",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = frontend.handler.property.util.lookup(block__$1,new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "?";
}
})())].join('')], null)], null),(cljs.core.truth_((function (){var and__5000__auto__ = area_QMARK_;
if(and__5000__auto__){
var or__5002__auto__ = new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513)], null));
}
} else {
return and__5000__auto__;
}
})())?frontend.extensions.pdf.assets.area_display(block__$1):null)], null);
} else {
return null;
}
});
return frontend.components.block.remove_nils(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(((frontend.config.local_file_based_graph_QMARK_(frontend.state.get_current_repo()))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [((((cljs.core.not(pre_block_QMARK_)) && (cljs.core.not(html_export_QMARK_))))?frontend.components.file_based.block.block_checkbox(block__$1,"mr-1 cursor"):null),((((cljs.core.not(pre_block_QMARK_)) && (cljs.core.not(html_export_QMARK_))))?frontend.components.file_based.block.marker_switch(block__$1):null),frontend.components.file_based.block.marker_cp(block__$1),frontend.components.file_based.block.priority_cp(block__$1)], null):null),((area_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [hl_ref()], null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.conj.cljs$core$IFn$_invoke$arity$2((frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$1,block_ast_title) : frontend.components.block.map_inline.call(null,config__$1,block_ast_title)),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mr-1","span.mr-1",127520086),frontend.ui.icon("whiteboard-element",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extension?","extension?",-1574402873),true], null))], null):null)),((area_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [hl_ref()], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(block_ast_title);
if(and__5000__auto__){
var G__88613 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Cards","logseq.class/Cards",-1284265167));
var G__88614 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88613,G__88614) : logseq.db.class_instance_QMARK_.call(null,G__88613,G__88614));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.ui.tooltip((function (){var G__88615 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"ml-2 !px-1 !h-5 text-xs text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)], null));
})], null);
var G__88616 = "Practice";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88615,G__88616) : logseq.shui.ui.button.call(null,G__88615,G__88616));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Practice cards"], null))], null):null)], 0)));
})()));
}),null,"frontend.components.block/text-block-title");
frontend.components.block.block_title_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,block,p__88617){
var map__88618 = p__88617;
var map__88618__$1 = cljs.core.__destructure_map(map__88618);
var query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88618__$1,new cljs.core.Keyword(null,"query?","query?",1736700454));
var _STAR_show_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88618__$1,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510));
var vec__88619 = rum.core.use_state(false);
var hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88619,(0),null);
var set_hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88619,(1),null);
var blank_QMARK_ = clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
var opacity = (cljs.core.truth_(hover_QMARK_)?"opacity-100":"opacity-0");
var query = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block);
var advanced_query_QMARK_ = (function (){var and__5000__auto__ = query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(query));
} else {
return and__5000__auto__;
}
})();
var show_query_QMARK_ = (function (){var and__5000__auto__ = _STAR_show_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_show_query_QMARK_);
} else {
return and__5000__auto__;
}
})();
var query_setting = (cljs.core.truth_(query_QMARK_)?frontend.ui.tooltip((function (){var G__88622 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),["ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6 transition-opacity ease-in duration-300 ",opacity].join(''),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

if(cljs.core.truth_(_STAR_show_query_QMARK_)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_show_query_QMARK_,cljs.core.not);
} else {
return null;
}
})], null);
var G__88623 = frontend.ui.icon("settings");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88622,G__88623) : logseq.shui.ui.button.call(null,G__88622,G__88623));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-75","div.opacity-75",588240867),(cljs.core.truth_(show_query_QMARK_)?"Hide query":"Set query")], null)):null);
return daiquiri.core.create_element("div",{'onMouseOver':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_hover_QMARK_.call(null,true));
}),'onMouseOut':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_hover_QMARK_.call(null,false));
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-full",(cljs.core.truth_(query_QMARK_)?"inline-flex":"inline")], null))},[(cljs.core.truth_((function (){var and__5000__auto__ = query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = blank_QMARK_;
if(and__5000__auto____$1){
var or__5002__auto__ = advanced_query_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return show_query_QMARK_;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("span",{'className':"opacity-75 hover:opacity-100"},["Untitled query"]):(cljs.core.truth_((function (){var and__5000__auto__ = query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return blank_QMARK_;
} else {
return and__5000__auto__;
}
})())?frontend.components.query.builder.builder(query,cljs.core.PersistentArrayMap.EMPTY):frontend.components.block.text_block_title(config,block)
)),daiquiri.interpreter.interpret(query_setting),daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var temp__5804__auto____$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property)))?cljs.core.first(logseq.outliner.property.validate_property_value((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),property,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))):null);
if(cljs.core.truth_(temp__5804__auto____$1)){
var message = temp__5804__auto____$1;
return frontend.ui.tooltip((function (){var G__88628 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"ls-type-warning ls-small-icon px-1 !py-0 h-4 ml-1"], null);
var G__88629 = frontend.ui.icon("alert-triangle");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88628,G__88629) : logseq.shui.ui.button.call(null,G__88628,G__88629));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-75","div.opacity-75",588240867),message], null));
} else {
return null;
}
} else {
return null;
}
})())]);
}),null,"frontend.components.block/block-title-aux");
frontend.components.block.block_title = rum.core.lazy_build(rum.core.build_defc,(function (config,block,p__88635){
var map__88636 = p__88635;
var map__88636__$1 = cljs.core.__destructure_map(map__88636);
var _STAR_show_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88636__$1,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510));
var block_SINGLEQUOTE_ = (function (){var G__88637 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88637) : frontend.db.entity.call(null,G__88637));
})();
var node_display_type = new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
var query_QMARK_ = (function (){var G__88638 = logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__88639 = block_SINGLEQUOTE_;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88638,G__88639) : logseq.db.class_instance_QMARK_.call(null,G__88638,G__88639));
})();
if(cljs.core.truth_(new cljs.core.Keyword(null,"raw-title?","raw-title?",1309209409).cljs$core$IFn$_invoke$arity$1(config))){
return frontend.components.block.text_block_title(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(config,new cljs.core.Keyword(null,"raw-title?","raw-title?",1309209409)),block);
} else {
if(cljs.core.truth_((logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.asset_QMARK_.call(null,block)))){
return daiquiri.core.create_element("div",{'className':"grid grid-cols-1 justify-items-center asset-block-wrap"},[frontend.components.block.asset_cp(config,block),((frontend.components.block.img_audio_video_QMARK_(block))?daiquiri.core.create_element("div",{'className':"text-xs opacity-60 mt-1"},[frontend.components.block.text_block_title(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(config,new cljs.core.Keyword(null,"raw-title?","raw-title?",1309209409)),block)]):null)]);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),node_display_type)){
var attrs88634 = (function (){var G__88640 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"code-block","code-block",-2113425141),block);
var G__88641 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"language","language",-1591107564),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2(G__88640,G__88641) : frontend.components.block.src_cp.call(null,G__88640,G__88641));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88634))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","w-full"], null)], null),attrs88634], 0))):{'className':"flex flex-1 w-full"}),((cljs.core.map_QMARK_(attrs88634))?null:[daiquiri.interpreter.interpret(attrs88634)]));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"math","math",-2026912803),node_display_type)){
return frontend.extensions.latex.latex(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),true,false);
} else {
if(cljs.core.seq(new cljs.core.Keyword("logseq.property","_query","logseq.property/_query",-1160583010).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_))){
return frontend.components.query.builder.builder(block_SINGLEQUOTE_,cljs.core.PersistentArrayMap.EMPTY);
} else {
return frontend.components.block.block_title_aux(config,block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query?","query?",1736700454),query_QMARK_,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null));

}
}
}
}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.block/block-title");
frontend.components.block.span_comma = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("span",null,[", "]);
}),null,"frontend.components.block/span-comma");
frontend.components.block.property_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,block,k,value){
var date = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"date","date",-1463434462));
if(and__5000__auto__){
return frontend.date.get_locale_string(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
} else {
return and__5000__auto__;
}
})();
var user_config = frontend.state.get_config.cljs$core$IFn$_invoke$arity$0();
var property_separated_by_commas_QMARK_ = logseq.graph_parser.text.separated_by_commas_QMARK_(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),k);
var v = (function (){var or__5002__auto__ = ((((cljs.core.coll_QMARK_(value)) && (((cljs.core.seq(value)) && ((!(property_separated_by_commas_QMARK_)))))))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block),k):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})();
var property_pages_enabled_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,true,null], null), null),new cljs.core.Keyword("property-pages","enabled?","property-pages/enabled?",-48336645).cljs$core$IFn$_invoke$arity$1(user_config));
var attrs88646 = ((property_pages_enabled_QMARK_)?(((((!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))) && (((function (){var G__88685 = cljs.core.name(k);
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__88685) : frontend.db.get_page.call(null,G__88685));
})() == null))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.page-property-key.font-medium","span.page-property-key.font-medium",-589122015),cljs.core.name(k)], null):frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"property?","property?",2060031741),true),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),(1))], null))):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.page-property-key.font-medium","span.page-property-key.font-medium",-589122015),cljs.core.name(k)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88646))?daiquiri.interpreter.element_attributes(attrs88646):null),((cljs.core.map_QMARK_(attrs88646))?[daiquiri.core.create_element("span",{'className':"mr-1"},[":"]),(function (){var attrs88665 = ((cljs.core.int_QMARK_(v))?v:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"file-path","file-path",-2005501162)))?v:(cljs.core.truth_(date)?date:((((typeof v === 'string') && (logseq.common.util.wrapped_by_quotes_QMARK_(v))))?logseq.common.util.unquote_string(v):((((property_separated_by_commas_QMARK_) && (cljs.core.coll_QMARK_(v))))?(function (){var v__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,v));
var vals = (function (){var iter__5480__auto__ = (function frontend$components$block$iter__88686(s__88687){
return (new cljs.core.LazySeq(null,(function (){
var s__88687__$1 = s__88687;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88687__$1);
if(temp__5804__auto__){
var s__88687__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88687__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88687__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88689 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88688 = (0);
while(true){
if((i__88688 < size__5479__auto__)){
var v_item = cljs.core._nth(c__5478__auto__,i__88688);
cljs.core.chunk_append(b__88689,frontend.components.block.page_cp(config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),v_item], null)));

var G__89460 = (i__88688 + (1));
i__88688 = G__89460;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88689),frontend$components$block$iter__88686(cljs.core.chunk_rest(s__88687__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88689),null);
}
} else {
var v_item = cljs.core.first(s__88687__$2);
return cljs.core.cons(frontend.components.block.page_cp(config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),v_item], null)),frontend$components$block$iter__88686(cljs.core.rest(s__88687__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(v__$1);
})();
var elems = cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(frontend.components.block.span_comma(),vals);
var iter__5480__auto__ = (function frontend$components$block$iter__88690(s__88691){
return (new cljs.core.LazySeq(null,(function (){
var s__88691__$1 = s__88691;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88691__$1);
if(temp__5804__auto__){
var s__88691__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88691__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88691__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88693 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88692 = (0);
while(true){
if((i__88692 < size__5479__auto__)){
var elem = cljs.core._nth(c__5478__auto__,i__88692);
cljs.core.chunk_append(b__88693,rum.core.with_key(elem,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid())));

var G__89461 = (i__88692 + (1));
i__88692 = G__89461;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88693),frontend$components$block$iter__88690(cljs.core.chunk_rest(s__88691__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88693),null);
}
} else {
var elem = cljs.core.first(s__88691__$2);
return cljs.core.cons(rum.core.with_key(elem,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid())),frontend$components$block$iter__88690(cljs.core.rest(s__88691__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(elems);
})():frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3(config,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(v))
)))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88665))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-property-value","inline"], null)], null),attrs88665], 0))):{'className':"page-property-value inline"}),((cljs.core.map_QMARK_(attrs88665))?null:[daiquiri.interpreter.interpret(attrs88665)]));
})()]:[daiquiri.interpreter.interpret(attrs88646),daiquiri.core.create_element("span",{'className':"mr-1"},[":"]),(function (){var attrs88684 = ((cljs.core.int_QMARK_(v))?v:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"file-path","file-path",-2005501162)))?v:(cljs.core.truth_(date)?date:((((typeof v === 'string') && (logseq.common.util.wrapped_by_quotes_QMARK_(v))))?logseq.common.util.unquote_string(v):((((property_separated_by_commas_QMARK_) && (cljs.core.coll_QMARK_(v))))?(function (){var v__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,v));
var vals = (function (){var iter__5480__auto__ = (function frontend$components$block$iter__88694(s__88695){
return (new cljs.core.LazySeq(null,(function (){
var s__88695__$1 = s__88695;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88695__$1);
if(temp__5804__auto__){
var s__88695__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88695__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88695__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88697 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88696 = (0);
while(true){
if((i__88696 < size__5479__auto__)){
var v_item = cljs.core._nth(c__5478__auto__,i__88696);
cljs.core.chunk_append(b__88697,frontend.components.block.page_cp(config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),v_item], null)));

var G__89462 = (i__88696 + (1));
i__88696 = G__89462;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88697),frontend$components$block$iter__88694(cljs.core.chunk_rest(s__88695__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88697),null);
}
} else {
var v_item = cljs.core.first(s__88695__$2);
return cljs.core.cons(frontend.components.block.page_cp(config,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),v_item], null)),frontend$components$block$iter__88694(cljs.core.rest(s__88695__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(v__$1);
})();
var elems = cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(frontend.components.block.span_comma(),vals);
var iter__5480__auto__ = (function frontend$components$block$iter__88698(s__88699){
return (new cljs.core.LazySeq(null,(function (){
var s__88699__$1 = s__88699;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88699__$1);
if(temp__5804__auto__){
var s__88699__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88699__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88699__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88701 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88700 = (0);
while(true){
if((i__88700 < size__5479__auto__)){
var elem = cljs.core._nth(c__5478__auto__,i__88700);
cljs.core.chunk_append(b__88701,rum.core.with_key(elem,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid())));

var G__89463 = (i__88700 + (1));
i__88700 = G__89463;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88701),frontend$components$block$iter__88698(cljs.core.chunk_rest(s__88699__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88701),null);
}
} else {
var elem = cljs.core.first(s__88699__$2);
return cljs.core.cons(rum.core.with_key(elem,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid())),frontend$components$block$iter__88698(cljs.core.rest(s__88699__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(elems);
})():frontend.components.block.inline_text.cljs$core$IFn$_invoke$arity$3(config,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(v))
)))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88684))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-property-value","inline"], null)], null),attrs88684], 0))):{'className':"page-property-value inline"}),((cljs.core.map_QMARK_(attrs88684))?null:[daiquiri.interpreter.interpret(attrs88684)]));
})()]));
}),null,"frontend.components.block/property-cp");
frontend.components.block.properties_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,p__88704){
var map__88705 = p__88704;
var map__88705__$1 = cljs.core.__destructure_map(map__88705);
var block = map__88705__$1;
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88705__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var ordered_properties = frontend.handler.file_based.property.util.get_visible_ordered_properties(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pre-block?","pre-block?",-1762448460),pre_block_QMARK_,new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))], null));
if(cljs.core.seq(ordered_properties)){
return daiquiri.core.create_element("div",{'title':(cljs.core.truth_(pre_block_QMARK_)?"Click to edit this page's properties":"Click to edit this block's properties"),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-properties","rounded",(cljs.core.truth_(pre_block_QMARK_)?"page-properties":null)], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88706(s__88707){
return (new cljs.core.LazySeq(null,(function (){
var s__88707__$1 = s__88707;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88707__$1);
if(temp__5804__auto__){
var s__88707__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88707__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88707__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88709 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88708 = (0);
while(true){
if((i__88708 < size__5479__auto__)){
var vec__88710 = cljs.core._nth(c__5478__auto__,i__88708);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88710,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88710,(1),null);
cljs.core.chunk_append(b__88709,rum.core.with_key(frontend.components.block.property_cp(config,block,k,v),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')));

var G__89464 = (i__88708 + (1));
i__88708 = G__89464;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88709),frontend$components$block$iter__88706(cljs.core.chunk_rest(s__88707__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88709),null);
}
} else {
var vec__88713 = cljs.core.first(s__88707__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88713,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88713,(1),null);
return cljs.core.cons(rum.core.with_key(frontend.components.block.property_cp(config,block,k,v),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')),frontend$components$block$iter__88706(cljs.core.rest(s__88707__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(ordered_properties);
})())]);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = pre_block_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ordered_properties;
} else {
return and__5000__auto__;
}
})())){
return daiquiri.core.create_element("span",{'className':"opacity-50"},["Properties"]);
} else {
return null;

}
}
}),null,"frontend.components.block/properties-cp");
frontend.components.block.db_properties_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,block,opts){
return frontend.components.property.properties_area(block,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"inline-text","inline-text",910915394),frontend.components.block.inline_text,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595),frontend.components.block.page_cp,new cljs.core.Keyword(null,"block-cp","block-cp",568894835),frontend.components.block.blocks_container,new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.state.get_component(new cljs.core.Keyword("editor","box","editor/box",-1921770435)),new cljs.core.Keyword(null,"container-id","container-id",1274665684),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("frontend.components.block","initial-container-id","frontend.components.block/initial-container-id",-1287718590).cljs$core$IFn$_invoke$arity$1(state);
}
})()], null),opts], 0)));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var container_id = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_next_container_id();
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.block","initial-container-id","frontend.components.block/initial-container-id",-1287718590),container_id);
})], null)], null),"frontend.components.block/db-properties-cp");
frontend.components.block.invalid_properties_cp = rum.core.lazy_build(rum.core.build_defc,(function (invalid_properties){
if(cljs.core.seq(invalid_properties)){
return daiquiri.core.create_element("div",{'className':"invalid-properties mb-2"},[daiquiri.core.create_element("div",{'title':"Invalid properties",'className':"warning"},["Invalid property names: ",cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88719(s__88720){
return (new cljs.core.LazySeq(null,(function (){
var s__88720__$1 = s__88720;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88720__$1);
if(temp__5804__auto__){
var s__88720__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88720__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88720__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88722 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88721 = (0);
while(true){
if((i__88721 < size__5479__auto__)){
var p = cljs.core._nth(c__5478__auto__,i__88721);
cljs.core.chunk_append(b__88722,(function (){var attrs88718 = p;
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs88718))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-1","mr-2"], null)], null),attrs88718], 0))):{'className':"p-1 mr-2"}),((cljs.core.map_QMARK_(attrs88718))?null:[daiquiri.interpreter.interpret(attrs88718)]));
})());

var G__89465 = (i__88721 + (1));
i__88721 = G__89465;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88722),frontend$components$block$iter__88719(cljs.core.chunk_rest(s__88720__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88722),null);
}
} else {
var p = cljs.core.first(s__88720__$2);
return cljs.core.cons((function (){var attrs88718 = p;
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs88718))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-1","mr-2"], null)], null),attrs88718], 0))):{'className':"p-1 mr-2"}),((cljs.core.map_QMARK_(attrs88718))?null:[daiquiri.interpreter.interpret(attrs88718)]));
})(),frontend$components$block$iter__88719(cljs.core.rest(s__88720__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(invalid_properties);
})())]),daiquiri.core.create_element("code",null,["Property name begins with a non-numeric character and can contain alphanumeric characters and . * + ! - _ ? $ % & = < >. If -, + or . are the first character, the second character (if any) must be non-numeric."])]);
} else {
return null;
}
}),null,"frontend.components.block/invalid-properties-cp");
frontend.components.block.target_forbidden_edit_QMARK_ = (function frontend$components$block$target_forbidden_edit_QMARK_(target){
var or__5002__auto__ = dommy.core.has_class_QMARK_(target,"forbid-edit");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = dommy.core.has_class_QMARK_(target,"bullet");
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = dommy.core.has_class_QMARK_(target,"logbook");
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = dommy.core.has_class_QMARK_(target,"markdown-table");
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = frontend.util.link_QMARK_(target);
if(or__5002__auto____$4){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = frontend.util.time_QMARK_(target);
if(or__5002__auto____$5){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = frontend.util.input_QMARK_(target);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = frontend.util.audio_QMARK_(target);
if(or__5002__auto____$7){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = frontend.util.video_QMARK_(target);
if(or__5002__auto____$8){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = frontend.util.details_or_summary_QMARK_(target);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = ((frontend.util.sup_QMARK_(target)) && (dommy.core.has_class_QMARK_(target,"fn")));
if(or__5002__auto____$10){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = dommy.core.has_class_QMARK_(target,"image-resize");
if(or__5002__auto____$11){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = dommy.core.closest.cljs$core$IFn$_invoke$arity$2(target,"a");
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
return dommy.core.closest.cljs$core$IFn$_invoke$arity$2(target,".query-table");
}
}
}
}
}
}
}
}
}
}
}
}
}
});
frontend.components.block.block_content_on_pointer_down = (function frontend$components$block$block_content_on_pointer_down(e,block,block_id,content,edit_input_id,config){
var selection_blocks = frontend.state.get_selection_blocks();
var starting_block = frontend.state.get_selection_start_block_or_first();
var mobile_selection_QMARK_ = (function (){var and__5000__auto__ = frontend.util.capacitor_new_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(selection_blocks);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(mobile_selection_QMARK_)){
var ids = cljs.core.set(frontend.state.get_selection_block_ids());
var block_node = goog.dom.getElement(block_id);
if(cljs.core.contains_QMARK_(ids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))){
frontend.state.drop_selection_block_BANG_(block_node);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(ids))){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
} else {
return null;
}
} else {
return frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$1(block_node);
}
} else {
frontend.util.mobile_keep_keyboard_open.cljs$core$IFn$_invoke$arity$1(false);

if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"closed-values?","closed-values?",1147014059).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (cljs.core.count(content) > frontend.state.block_content_max_length(frontend.state.get_current_repo()));
}
})())){
return null;
} else {
var target = frontend.components.block.goog$module$goog$object.get(e,"target");
var button = frontend.components.block.goog$module$goog$object.get(e,"buttons");
var shift_QMARK_ = frontend.components.block.goog$module$goog$object.get(e,"shiftKey");
var meta_QMARK_ = frontend.util.meta_key_QMARK_(e);
var forbidden_edit_QMARK_ = frontend.components.block.target_forbidden_edit_QMARK_(target);
if(((cljs.core.not(forbidden_edit_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [(0),null,(1),null], null), null),button)))){
if(cljs.core.truth_((function (){var and__5000__auto__ = meta_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return shift_QMARK_;
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.empty_QMARK_(selection_blocks)){
return null;
} else {
frontend.util.stop(e);

return frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"append?","append?",123923917),true], null)], 0));
}
} else {
if(cljs.core.truth_(meta_QMARK_)){
frontend.util.stop(e);

var block_dom_element_89466 = goog.dom.getElement(block_id);
if(cljs.core.truth_(cljs.core.some((function (p1__88723_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block_dom_element_89466,p1__88723_SHARP_);
}),selection_blocks))){
frontend.state.drop_selection_block_BANG_(block_dom_element_89466);
} else {
frontend.state.conj_selection_block_BANG_.cljs$core$IFn$_invoke$arity$2(block_dom_element_89466,new cljs.core.Keyword(null,"down","down",1565245570));
}

if(cljs.core.empty_QMARK_(frontend.state.get_selection_blocks())){
return frontend.state.clear_selection_BANG_();
} else {
return frontend.state.set_selection_start_block_BANG_(block_id);
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = shift_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return starting_block;
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

(frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.util.clear_selection_BANG_.call(null));

return frontend.handler.editor.highlight_selection_area_BANG_(block_id);
} else {
if(cljs.core.truth_(shift_QMARK_)){
(frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.util.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.util.clear_selection_BANG_.call(null));

return frontend.state.set_selection_start_block_BANG_(block_id);
} else {
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__88724 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88724) : frontend.db.entity.call(null,G__88724));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
(frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));

frontend.handler.editor.unhighlight_blocks_BANG_();

var f = (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((function (){var G__88725 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88725) : frontend.db.entity.call(null,G__88725));
})()))?null:frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)))),(function (___40947__auto__){
return promesa.protocols._promise((function (){var cursor_range = (function (){var G__88727 = goog.dom.getElement(block_id);
var G__88727__$1 = (((G__88727 == null))?null:dommy.utils.__GT_Array(G__88727.getElementsByClassName("block-content-inner")));
var G__88727__$2 = (((G__88727__$1 == null))?null:cljs.core.first(G__88727__$1));
if((G__88727__$2 == null)){
return null;
} else {
return frontend.util.caret_range(G__88727__$2);
}
})();
var block__$2 = (function (){var G__88728 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88728) : frontend.db.entity.call(null,G__88728));
})();
var map__88726 = block__$2;
var map__88726__$1 = cljs.core.__destructure_map(map__88726);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88726__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88726__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var content__$1 = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$2):frontend.util.file_based.drawer.remove_logbook(frontend.handler.property.file.remove_built_in_properties_when_file_based(frontend.state.get_current_repo(),format,title)));
return frontend.state.set_editing_BANG_.cljs$core$IFn$_invoke$arity$variadic(edit_input_id,content__$1,block__$2,cursor_range,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),(frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword(null,"move-cursor?","move-cursor?",-229137728),false,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)], null)], 0));
})());
}));
}));
});
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","save-code-editor","editor/save-code-editor",-1356475475)], null))),(function (___40947__auto__){
return promesa.protocols._promise(f());
}));
}));

return frontend.state.set_selection_start_block_BANG_(block_id);

}
}
}
}
} else {
return null;
}
}
}
});
frontend.components.block.dnd_separator_wrapper = rum.core.lazy_build(rum.core.build_defc,(function (block,block_id,top_QMARK_){
var dragging_QMARK_ = rum.core.react(frontend.components.block._STAR_dragging_QMARK_);
var drag_to_block = rum.core.react(frontend.components.block._STAR_drag_to_block);
var move_to = rum.core.react(frontend.components.block._STAR_move_to);
if(cljs.core.truth_((function (){var and__5000__auto__ = dragging_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block_id,drag_to_block);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block));
if(and__5000__auto____$2){
return move_to;
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = top_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(move_to,new cljs.core.Keyword(null,"top","top",-1856271961));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core.not(top_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(move_to,new cljs.core.Keyword(null,"top","top",-1856271961))));
}
})())){
return null;
} else {
return frontend.components.block.dnd_separator(move_to);
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/dnd-separator-wrapper");
frontend.components.block.block_content_inner = (function frontend$components$block$block_content_inner(config,block,body,plugin_slotted_QMARK_,collapsed_QMARK_,block_ref_with_title_QMARK_){
if(cljs.core.truth_(plugin_slotted_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-slotted-body","div.block-slotted-body",-118968467),frontend.components.plugins.hook_block_slot(new cljs.core.Keyword(null,"block-content-slotted","block-content-slotted",-1577364335),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("block","children","block/children",-1040716209),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","page","block/page",822314108)], 0)))], null);
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"code","code",1586293142),null,new cljs.core.Keyword(null,"math","math",-2026912803),null], null), null),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block))){
return null;
} else {
var title_collapse_enabled_QMARK_ = new cljs.core.Keyword("outliner","block-title-collapse-enabled?","outliner/block-title-collapse-enabled?",1547538161).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(block_ref_with_title_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.seq(body);
if(and__5000__auto____$1){
var or__5002__auto__ = cljs.core.not(title_collapse_enabled_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$2 = title_collapse_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto____$2)){
return ((cljs.core.not(collapsed_QMARK_)) || ((!((frontend.format.mldoc.extract_first_query_from_ast(body) == null)))));
} else {
return and__5000__auto____$2;
}
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-body","div.block-body",-1586332448),(function (){var body__$1 = frontend.format.block.trim_break_lines_BANG_(new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(block));
var uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var iter__5480__auto__ = (function frontend$components$block$block_content_inner_$_iter__88729(s__88730){
return (new cljs.core.LazySeq(null,(function (){
var s__88730__$1 = s__88730;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88730__$1);
if(temp__5804__auto__){
var s__88730__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88730__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88730__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88732 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88731 = (0);
while(true){
if((i__88731 < size__5479__auto__)){
var vec__88733 = cljs.core._nth(c__5478__auto__,i__88731);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88733,(0),null);
var child = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88733,(1),null);
cljs.core.chunk_append(b__88732,(function (){var temp__5804__auto____$1 = (frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2(config,child) : frontend.components.block.markup_element_cp.call(null,config,child));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block__$1 = temp__5804__auto____$1;
return rum.core.with_key(frontend.components.block.block_child(block__$1),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''));
} else {
return null;
}
})());

var G__89467 = (i__88731 + (1));
i__88731 = G__89467;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88732),frontend$components$block$block_content_inner_$_iter__88729(cljs.core.chunk_rest(s__88730__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88732),null);
}
} else {
var vec__88736 = cljs.core.first(s__88730__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88736,(0),null);
var child = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88736,(1),null);
return cljs.core.cons((function (){var temp__5804__auto____$1 = (frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2(config,child) : frontend.components.block.markup_element_cp.call(null,config,child));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block__$1 = temp__5804__auto____$1;
return rum.core.with_key(frontend.components.block.block_child(block__$1),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''));
} else {
return null;
}
})(),frontend$components$block$block_content_inner_$_iter__88729(cljs.core.rest(s__88730__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(body__$1));
})()], null);
} else {
return null;
}
}
}
});
frontend.components.block.block_tag = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,tag,config,popup_opts){
var _STAR_hover_QMARK_ = new cljs.core.Keyword("frontend.components.block","hover?","frontend.components.block/hover?",-1558832434).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_hover_container_QMARK_ = new cljs.core.Keyword("frontend.components.block","hover-container?","frontend.components.block/hover-container?",383627549).cljs$core$IFn$_invoke$arity$1(state);
var private_tag_QMARK_ = (function (){var G__88739 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__88739) : logseq.db.private_tags.call(null,G__88739));
})();
return daiquiri.core.create_element("div",{'key':["tag-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))].join(''),'onMouseOver':(function (){
return cljs.core.reset_BANG_(_STAR_hover_container_QMARK_,true);
}),'onMouseOut':(function (){
return cljs.core.reset_BANG_(_STAR_hover_container_QMARK_,false);
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-tag",[(cljs.core.truth_(private_tag_QMARK_)?"private-tag ":null),(cljs.core.truth_(cljs.core.deref(_STAR_hover_QMARK_))?(cljs.core.truth_(private_tag_QMARK_)?"!px-1":"!pl-0"):null)].join('')], null))},[daiquiri.core.create_element("div",{'onMouseOver':(function (){
return cljs.core.reset_BANG_(_STAR_hover_QMARK_,true);
}),'onMouseOut':(function (){
return cljs.core.reset_BANG_(_STAR_hover_QMARK_,false);
}),'onContextMenu':(function (e){
frontend.util.stop(e);

var G__88740 = e;
var G__88741 = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__88743 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Go to tag",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(tag));
})], null);
var G__88744 = ["Go to #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag))].join('');
var G__88745 = (function (){var G__88746 = frontend.modules.shortcut.utils.decorate_binding("mod+click");
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__88746) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__88746));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__88743,G__88744,G__88745) : logseq.shui.ui.dropdown_menu_item.call(null,G__88743,G__88744,G__88745));
})(),(function (){var G__88747 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Open tag in sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag),new cljs.core.Keyword(null,"page","page",849072397));
})], null);
var G__88748 = "Open in sidebar";
var G__88749 = (function (){var G__88750 = frontend.modules.shortcut.utils.decorate_binding("shift+click");
return (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1(G__88750) : logseq.shui.ui.dropdown_menu_shortcut.call(null,G__88750));
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__88747,G__88748,G__88749) : logseq.shui.ui.dropdown_menu_item.call(null,G__88747,G__88748,G__88749));
})(),(cljs.core.truth_((function (){var G__88751 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__88751) : logseq.db.private_tags.call(null,G__88751));
})())?null:(function (){var G__88752 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Remove tag",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag));
})], null);
var G__88753 = "Remove tag";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__88752,G__88753) : logseq.shui.ui.dropdown_menu_item.call(null,G__88752,G__88753));
})())], null);
});
var G__88742 = popup_opts;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__88740,G__88741,G__88742) : logseq.shui.ui.popup_show_BANG_.call(null,G__88740,G__88741,G__88742));
}),'className':"flex items-center"},[(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_hover_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(private_tag_QMARK_);
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("a",{'title':"Remove this tag",'style':{'marginTop':(1),'paddingLeft':(2),'marginRight':(2)},'onPointerDown':(function (e){
frontend.util.stop(e);

return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag));
}),'className':"inline-flex text-muted-foreground"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(13)], null)))]):daiquiri.core.create_element("a",{'className':"hash-symbol select-none flex"},["#"])),frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tag?","tag?",1714008252),true,new cljs.core.Keyword(null,"hide-tag-symbol?","hide-tag-symbol?",1083852788),true], 0)),tag)])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","hover?","frontend.components.block/hover?",-1558832434)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","hover-container?","frontend.components.block/hover-container?",383627549))], null),"frontend.components.block/block-tag");
/**
 * Tags without inline or hidden tags
 */
frontend.components.block.tags_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,block){
if(cljs.core.truth_(new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block))){
var hidden_internal_tags = (function (){var G__88756 = logseq.db.internal_tags;
if(cljs.core.truth_(new cljs.core.Keyword(null,"show-tag-and-property-classes?","show-tag-and-property-classes?",-152227272).cljs$core$IFn$_invoke$arity$1(config))){
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(G__88756,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),null,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null], null), null));
} else {
return G__88756;
}
})();
var block_tags = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (t){
var or__5002__auto__ = (function (){var G__88757 = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block);
var G__88758 = t;
return (logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88757,G__88758) : logseq.db.inline_tag_QMARK_.call(null,G__88757,G__88758));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("logseq.property.class","hide-from-node","logseq.property.class/hide-from-node",-26103727).cljs$core$IFn$_invoke$arity$1(t);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.contains_QMARK_(hidden_internal_tags,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(t));
}
}
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block));
var popup_opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-60"], null)], null);
var tags_count = cljs.core.count(block_tags);
if(cljs.core.seq(block_tags)){
if((tags_count < (3))){
return daiquiri.core.create_element("div",{'className':"block-tags gap-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88759(s__88760){
return (new cljs.core.LazySeq(null,(function (){
var s__88760__$1 = s__88760;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88760__$1);
if(temp__5804__auto__){
var s__88760__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88760__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88760__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88762 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88761 = (0);
while(true){
if((i__88761 < size__5479__auto__)){
var tag = cljs.core._nth(c__5478__auto__,i__88761);
cljs.core.chunk_append(b__88762,rum.core.with_key(frontend.components.block.block_tag(block,tag,config,popup_opts),["tag-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))].join('')));

var G__89468 = (i__88761 + (1));
i__88761 = G__89468;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88762),frontend$components$block$iter__88759(cljs.core.chunk_rest(s__88760__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88762),null);
}
} else {
var tag = cljs.core.first(s__88760__$2);
return cljs.core.cons(rum.core.with_key(frontend.components.block.block_tag(block,tag,config,popup_opts),["tag-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))].join('')),frontend$components$block$iter__88759(cljs.core.rest(s__88760__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(block_tags);
})())]);
} else {
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
var G__88763 = e;
var G__88764 = (function (){
var iter__5480__auto__ = (function frontend$components$block$iter__88766(s__88767){
return (new cljs.core.LazySeq(null,(function (){
var s__88767__$1 = s__88767;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88767__$1);
if(temp__5804__auto__){
var s__88767__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88767__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88767__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88769 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88768 = (0);
while(true){
if((i__88768 < size__5479__auto__)){
var tag = cljs.core._nth(c__5478__auto__,i__88768);
cljs.core.chunk_append(b__88769,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_((function (){var G__88770 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__88770) : logseq.db.private_tags.call(null,G__88770));
})())?null:(function (){var G__88771 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),"Remove tag",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"!p-1 text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__88768,tag,c__5478__auto__,size__5479__auto__,b__88769,s__88767__$2,temp__5804__auto__,G__88763,hidden_internal_tags,block_tags,popup_opts,tags_count){
return (function (){
return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag));
});})(i__88768,tag,c__5478__auto__,size__5479__auto__,b__88769,s__88767__$2,temp__5804__auto__,G__88763,hidden_internal_tags,block_tags,popup_opts,tags_count))
], null);
var G__88772 = frontend.ui.icon("X",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88771,G__88772) : logseq.shui.ui.button.call(null,G__88771,G__88772));
})()),frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"stop-click-event?","stop-click-event?",-1661319069),false], 0)),tag)], null));

var G__89469 = (i__88768 + (1));
i__88768 = G__89469;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88769),frontend$components$block$iter__88766(cljs.core.chunk_rest(s__88767__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88769),null);
}
} else {
var tag = cljs.core.first(s__88767__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_((function (){var G__88773 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__88773) : logseq.db.private_tags.call(null,G__88773));
})())?null:(function (){var G__88774 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),"Remove tag",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"class","class",-2030961996),"!p-1 text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (tag,s__88767__$2,temp__5804__auto__,G__88763,hidden_internal_tags,block_tags,popup_opts,tags_count){
return (function (){
return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag));
});})(tag,s__88767__$2,temp__5804__auto__,G__88763,hidden_internal_tags,block_tags,popup_opts,tags_count))
], null);
var G__88775 = frontend.ui.icon("X",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88774,G__88775) : logseq.shui.ui.button.call(null,G__88774,G__88775));
})()),frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"stop-click-event?","stop-click-event?",-1661319069),false], 0)),tag)], null),frontend$components$block$iter__88766(cljs.core.rest(s__88767__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(block_tags);
});
var G__88765 = popup_opts;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__88763,G__88764,G__88765) : logseq.shui.ui.popup_show_BANG_.call(null,G__88763,G__88764,G__88765));
}),'className':"block-tags cursor-pointer"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88776(s__88777){
return (new cljs.core.LazySeq(null,(function (){
var s__88777__$1 = s__88777;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88777__$1);
if(temp__5804__auto__){
var s__88777__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88777__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88777__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88779 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88778 = (0);
while(true){
if((i__88778 < size__5479__auto__)){
var tag = cljs.core._nth(c__5478__auto__,i__88778);
cljs.core.chunk_append(b__88779,daiquiri.core.create_element("div",{'key':["tag-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))].join(''),'className':"block-tag pl-2"},[frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"disable-click?","disable-click?",-1186799869),true], 0)),tag)]));

var G__89470 = (i__88778 + (1));
i__88778 = G__89470;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88779),frontend$components$block$iter__88776(cljs.core.chunk_rest(s__88777__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88779),null);
}
} else {
var tag = cljs.core.first(s__88777__$2);
return cljs.core.cons(daiquiri.core.create_element("div",{'key':["tag-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))].join(''),'className':"block-tag pl-2"},[frontend.components.block.page_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"tag?","tag?",1714008252),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"disable-click?","disable-click?",-1186799869),true], 0)),tag)]),frontend$components$block$iter__88776(cljs.core.rest(s__88777__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.take.cljs$core$IFn$_invoke$arity$2((2),block_tags));
})()),daiquiri.core.create_element("div",{'className':"text-sm opacity-50 ml-1"},[["+",cljs.core.str.cljs$core$IFn$_invoke$arity$1((tags_count - (2)))].join('')])]);
}
} else {
return null;
}
} else {
return null;
}
}),null,"frontend.components.block/tags-cp");
frontend.components.block.block_positioned_properties = rum.core.lazy_build(rum.core.build_defc,(function (config,block,position){
var properties = logseq.outliner.property.get_block_positioned_properties((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),position);
var opts = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"icon?","icon?",-1663815703),true,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595),frontend.components.block.page_cp,new cljs.core.Keyword(null,"block-cp","block-cp",568894835),frontend.components.block.blocks_container,new cljs.core.Keyword(null,"inline-text","inline-text",910915394),frontend.components.block.inline_text,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322),true,new cljs.core.Keyword(null,"property-position","property-position",-1150084538),position], null)], 0));
if(cljs.core.seq(properties)){
var G__88780 = position;
var G__88780__$1 = (((G__88780 instanceof cljs.core.Keyword))?G__88780.fqn:null);
switch (G__88780__$1) {
case "block-below":
return daiquiri.core.create_element("div",{'className':"positioned-properties block-below flex flex-row gap-2 item-center flex-wrap text-sm overflow-x-hidden"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88781(s__88782){
return (new cljs.core.LazySeq(null,(function (){
var s__88782__$1 = s__88782;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88782__$1);
if(temp__5804__auto__){
var s__88782__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88782__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88782__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88784 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88783 = (0);
while(true){
if((i__88783 < size__5479__auto__)){
var pid = cljs.core._nth(c__5478__auto__,i__88783);
cljs.core.chunk_append(b__88784,(function (){var property = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(pid) : frontend.db.entity.call(null,pid));
return daiquiri.core.create_element("div",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid),'className':"flex flex-row items-center gap-1"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center"},[frontend.components.property.property_key_cp(block,property,opts),daiquiri.core.create_element("div",{'className':"select-none"},[":"])]),daiquiri.core.create_element("div",{'style':{'minHeight':(20)},'className':"ls-block property-value-container"},[frontend.components.property.value.property_value(block,property,opts)])]);
})());

var G__89474 = (i__88783 + (1));
i__88783 = G__89474;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88784),frontend$components$block$iter__88781(cljs.core.chunk_rest(s__88782__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88784),null);
}
} else {
var pid = cljs.core.first(s__88782__$2);
return cljs.core.cons((function (){var property = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(pid) : frontend.db.entity.call(null,pid));
return daiquiri.core.create_element("div",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid),'className':"flex flex-row items-center gap-1"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center"},[frontend.components.property.property_key_cp(block,property,opts),daiquiri.core.create_element("div",{'className':"select-none"},[":"])]),daiquiri.core.create_element("div",{'style':{'minHeight':(20)},'className':"ls-block property-value-container"},[frontend.components.property.value.property_value(block,property,opts)])]);
})(),frontend$components$block$iter__88781(cljs.core.rest(s__88782__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(properties);
})())]);

break;
default:
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["positioned-properties","flex","flex-row","gap-1","select-none","h-6","self-start",cljs.core.name(position)], null))},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88787(s__88788){
return (new cljs.core.LazySeq(null,(function (){
var s__88788__$1 = s__88788;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88788__$1);
if(temp__5804__auto__){
var s__88788__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88788__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88788__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88790 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88789 = (0);
while(true){
if((i__88789 < size__5479__auto__)){
var pid = cljs.core._nth(c__5478__auto__,i__88789);
cljs.core.chunk_append(b__88790,(function (){var temp__5804__auto____$1 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(pid) : frontend.db.entity.call(null,pid));
if(cljs.core.truth_(temp__5804__auto____$1)){
var property = temp__5804__auto____$1;
return rum.core.with_key(frontend.components.property.value.property_value(block,property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-tooltip?","show-tooltip?",-1214081087),true)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid));
} else {
return null;
}
})());

var G__89478 = (i__88789 + (1));
i__88789 = G__89478;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88790),frontend$components$block$iter__88787(cljs.core.chunk_rest(s__88788__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88790),null);
}
} else {
var pid = cljs.core.first(s__88788__$2);
return cljs.core.cons((function (){var temp__5804__auto____$1 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(pid) : frontend.db.entity.call(null,pid));
if(cljs.core.truth_(temp__5804__auto____$1)){
var property = temp__5804__auto____$1;
return rum.core.with_key(frontend.components.property.value.property_value(block,property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-tooltip?","show-tooltip?",-1214081087),true)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid));
} else {
return null;
}
})(),frontend$components$block$iter__88787(cljs.core.rest(s__88788__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(properties);
})())]);

}
} else {
return null;
}
}),null,"frontend.components.block/block-positioned-properties");
frontend.components.block.status_history_cp = rum.core.lazy_build(rum.core.build_defc,(function (status_history){
var vec__88791 = rum.core.use_state(true);
var sort_desc_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88791,(0),null);
var set_sort_desc_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88791,(1),null);
return daiquiri.core.create_element("div",{'className':"p-2 text-muted-foreground text-sm max-h-96"},[daiquiri.core.create_element("div",{'className':"font-medium mb-2 flex flex-row gap-2 items-center"},[daiquiri.core.create_element("div",null,["Status history"]),daiquiri.interpreter.interpret(logseq.shui.ui.button_ghost_icon((cljs.core.truth_(sort_desc_QMARK_)?new cljs.core.Keyword(null,"arrow-down","arrow-down",141510279):new cljs.core.Keyword(null,"arrow-up","arrow-up",-1363214427)),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),"Sort order",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !h-4 !w-4",new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__88797 = cljs.core.not(sort_desc_QMARK_);
return (set_sort_desc_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sort_desc_BANG_.cljs$core$IFn$_invoke$arity$1(G__88797) : set_sort_desc_BANG_.call(null,G__88797));
})], null)))]),daiquiri.core.create_element("div",{'className':"flex flex-col gap-1"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88798(s__88799){
return (new cljs.core.LazySeq(null,(function (){
var s__88799__$1 = s__88799;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88799__$1);
if(temp__5804__auto__){
var s__88799__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88799__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88799__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88801 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88800 = (0);
while(true){
if((i__88800 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__88800);
cljs.core.chunk_append(b__88801,(function (){var status = new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(item);
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center text-sm justify-between"},[(function (){var attrs88802 = frontend.components.icon.get_node_icon_cp(status,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88802))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-1","items-center"], null)], null),attrs88802], 0))):{'className':"flex flex-row gap-1 items-center"}),((cljs.core.map_QMARK_(attrs88802))?[(function (){var attrs88803 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(status);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88803))?daiquiri.interpreter.element_attributes(attrs88803):null),((cljs.core.map_QMARK_(attrs88803))?null:[daiquiri.interpreter.interpret(attrs88803)]));
})()]:[daiquiri.interpreter.interpret(attrs88802),(function (){var attrs88804 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(status);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88804))?daiquiri.interpreter.element_attributes(attrs88804):null),((cljs.core.map_QMARK_(attrs88804))?null:[daiquiri.interpreter.interpret(attrs88804)]));
})()]));
})(),(function (){var attrs88805 = frontend.date.int__GT_local_time_2(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88805))?daiquiri.interpreter.element_attributes(attrs88805):null),((cljs.core.map_QMARK_(attrs88805))?null:[daiquiri.interpreter.interpret(attrs88805)]));
})()]);
})());

var G__89486 = (i__88800 + (1));
i__88800 = G__89486;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88801),frontend$components$block$iter__88798(cljs.core.chunk_rest(s__88799__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88801),null);
}
} else {
var item = cljs.core.first(s__88799__$2);
return cljs.core.cons((function (){var status = new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(item);
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center text-sm justify-between"},[(function (){var attrs88802 = frontend.components.icon.get_node_icon_cp(status,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88802))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-1","items-center"], null)], null),attrs88802], 0))):{'className':"flex flex-row gap-1 items-center"}),((cljs.core.map_QMARK_(attrs88802))?[(function (){var attrs88803 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(status);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88803))?daiquiri.interpreter.element_attributes(attrs88803):null),((cljs.core.map_QMARK_(attrs88803))?null:[daiquiri.interpreter.interpret(attrs88803)]));
})()]:[daiquiri.interpreter.interpret(attrs88802),(function (){var attrs88804 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(status);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88804))?daiquiri.interpreter.element_attributes(attrs88804):null),((cljs.core.map_QMARK_(attrs88804))?null:[daiquiri.interpreter.interpret(attrs88804)]));
})()]));
})(),(function (){var attrs88805 = frontend.date.int__GT_local_time_2(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88805))?daiquiri.interpreter.element_attributes(attrs88805):null),((cljs.core.map_QMARK_(attrs88805))?null:[daiquiri.interpreter.interpret(attrs88805)]));
})()]);
})(),frontend$components$block$iter__88798(cljs.core.rest(s__88799__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__((cljs.core.truth_(sort_desc_QMARK_)?cljs.core.reverse(status_history):status_history));
})())])]);
}),null,"frontend.components.block/status-history-cp");
frontend.components.block.task_spent_time_cp = rum.core.lazy_build(rum.core.build_defc,(function (block){
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.enable_timetracking_QMARK_();
if(and__5000__auto__){
var G__88817 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)));
var G__88818 = block;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88817,G__88818) : logseq.db.class_instance_QMARK_.call(null,G__88817,G__88818));
} else {
return and__5000__auto__;
}
})())){
var vec__88819 = rum.core.use_state(null);
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88819,(0),null);
var set_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88819,(1),null);
var repo = frontend.state.get_current_repo();
var vec__88822 = result;
var status_history = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88822,(0),null);
var time_spent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88822,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_task_spent_time(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))),(function (result__$1){
return promesa.protocols._promise((set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_result_BANG_.call(null,result__$1)));
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853).cljs$core$IFn$_invoke$arity$1(block)], null));

if(cljs.core.truth_((function (){var and__5000__auto__ = time_spent;
if(cljs.core.truth_(and__5000__auto__)){
return (time_spent > (0));
} else {
return and__5000__auto__;
}
})())){
var attrs88816 = (function (){var G__88825 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !py-0 !px-1 h-6 font-normal",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__88827 = e.target;
var G__88828 = (function (){
return frontend.components.block.status_history_cp(status_history);
});
var G__88829 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__88827,G__88828,G__88829) : logseq.shui.ui.popup_show_BANG_.call(null,G__88827,G__88828,G__88829));
})], null);
var G__88826 = frontend.util.file_based.clock.seconds__GT_days_COLON_hours_COLON_minutes_COLON_seconds(time_spent);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88825,G__88826) : logseq.shui.ui.button.call(null,G__88825,G__88826));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88816))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","time-spent","ml-1"], null)], null),attrs88816], 0))):{'className':"text-sm time-spent ml-1"}),((cljs.core.map_QMARK_(attrs88816))?null:[daiquiri.interpreter.interpret(attrs88816)]));
} else {
return null;
}
} else {
return null;
}
}),null,"frontend.components.block/task-spent-time-cp");
frontend.components.block.block_content = rum.core.lazy_build(rum.core.build_defc,(function (config,p__88848,edit_input_id,block_id,_STAR_show_query_QMARK_){
var map__88849 = p__88848;
var map__88849__$1 = cljs.core.__destructure_map(map__88849);
var block = map__88849__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88849__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var scheduled = ((db_based_QMARK_)?null:new cljs.core.Keyword("block","scheduled","block/scheduled",584810412).cljs$core$IFn$_invoke$arity$1(block));
var deadline = ((db_based_QMARK_)?null:new cljs.core.Keyword("block","deadline","block/deadline",660945231).cljs$core$IFn$_invoke$arity$1(block));
var format = ((db_based_QMARK_)?new cljs.core.Keyword(null,"markdown","markdown",1227225089):(function (){var or__5002__auto__ = new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})());
var pre_block_QMARK_ = ((db_based_QMARK_)?null:new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block));
var collapsed_QMARK_ = new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674).cljs$core$IFn$_invoke$arity$1(config);
var content = ((db_based_QMARK_)?new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block):frontend.handler.file_based.property.util.remove_built_in_properties(format,new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block)));
var content__$1 = ((typeof content === 'string')?clojure.string.trim(content):"");
var block_ref_QMARK_ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config);
var block__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,format,pre_block_QMARK_,content__$1)], 0));
var ast_body = new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(block__$1);
var ast_title = new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067).cljs$core$IFn$_invoke$arity$1(block__$1);
var block__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","title","block/title",710445684),content__$1);
var plugin_slotted_QMARK_ = (function (){var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.slot_hook_exist_QMARK_(uuid);
} else {
return and__5000__auto__;
}
})();
var stop_events_QMARK_ = new cljs.core.Keyword(null,"stop-events?","stop-events?",-151471572).cljs$core$IFn$_invoke$arity$1(config);
var block_ref_with_title_QMARK_ = (function (){var and__5000__auto__ = block_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(frontend.state.show_full_blocks_QMARK_())) && (cljs.core.seq(ast_title)));
} else {
return and__5000__auto__;
}
})();
var block_type = (function (){var or__5002__auto__ = frontend.handler.property.util.lookup(block__$2,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})();
var mouse_down_key = (cljs.core.truth_(frontend.util.mobile_QMARK_())?new cljs.core.Keyword(null,"on-click","on-click",1632826543):new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var attrs = (function (){var G__88850 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"blockid","blockid",-664467760),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"jtrigger","jtrigger",1514336398),new cljs.core.Keyword(null,"property-block?","property-block?",71503268).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword(null,"!cursor-pointer","!cursor-pointer",-662749770),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config);
}
})()], null)], null)),new cljs.core.Keyword(null,"containerid","containerid",-1132769612),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword(null,"data-type","data-type",-326421468),cljs.core.name(block_type),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"100%",new cljs.core.Keyword(null,"pointer-events","pointer-events",-1053858853),(cljs.core.truth_(stop_events_QMARK_)?"none":null)], null)], null);
var G__88850__$1 = (((!(clojure.string.blank_QMARK_(frontend.handler.property.util.lookup(block__$2,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887))))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88850,new cljs.core.Keyword(null,"data-hl-color","data-hl-color",-1003439204),frontend.handler.property.util.lookup(block__$2,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887))):G__88850);
if(cljs.core.not(block_ref_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88850__$1,mouse_down_key,(function (e){
var journal_title_QMARK_ = new cljs.core.Keyword(null,"from-journals?","from-journals?",-483357615).cljs$core$IFn$_invoke$arity$1(config);
if(frontend.util.right_click_QMARK_(e)){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = journal_title_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.components.block.goog$module$goog$object.get(e,"shiftKey");
} else {
return and__5000__auto__;
}
})())){
e.preventDefault();

return frontend.state.sidebar_add_block_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword(null,"page","page",849072397));
} else {
if(cljs.core.truth_(journal_title_QMARK_)){
e.preventDefault();

return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2));
} else {
if(cljs.core.truth_((logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$2) : logseq.db.journal_QMARK_.call(null,block__$2)))){
return e.preventDefault();
} else {
var f = new cljs.core.Keyword(null,"on-block-content-pointer-down","on-block-content-pointer-down",1185021460).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.fn_QMARK_(f)){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(e) : f.call(null,e));
} else {
return frontend.components.block.block_content_on_pointer_down(e,block__$2,block_id,content__$1,edit_input_id,config);
}

}
}
}
}
}));
} else {
return G__88850__$1;
}
})();
var attrs88833 = (function (){var G__88851 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),["block-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''),new cljs.core.Keyword(null,"key","key",-1516042587),["block-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join('')], null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__88851,attrs], 0));

})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88833))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-content","inline"], null)], null),attrs88833], 0))):{'className':"block-content inline"}),((cljs.core.map_QMARK_(attrs88833))?[(function (){var attrs88834 = (((((((content__$1).length) > frontend.state.block_content_max_length(frontend.state.get_current_repo()))) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"code","code",1586293142),null], null), null),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block__$2)))))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning.text-sm","div.warning.text-sm",-192579545),"Large block will not be editable or searchable to not slow down the app, please use another editor to edit this block."], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs88834))?daiquiri.interpreter.element_attributes(attrs88834):null),((cljs.core.map_QMARK_(attrs88834))?[(function (){var attrs88835 = (cljs.core.truth_(plugin_slotted_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-head-wrap","div.block-head-wrap",568923500),frontend.components.block.block_title(config,block__$2,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88835))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","block-content-inner"], null)], null),attrs88835], 0))):{'className':"flex flex-row justify-between block-content-inner"}),((cljs.core.map_QMARK_(attrs88835))?[((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]:[daiquiri.interpreter.interpret(attrs88835),((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]));
})(),(cljs.core.truth_(deadline)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_deadline_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var deadline_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"DEADLINE",deadline_ast);
} else {
return null;
}
})()):null),(cljs.core.truth_(scheduled)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_scheduled_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var scheduled_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"SCHEDULED",scheduled_ast);
} else {
return null;
}
})()):null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?null:daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872).cljs$core$IFn$_invoke$arity$1(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var invalid_properties = temp__5804__auto__;
return frontend.components.block.invalid_properties_cp(invalid_properties);
} else {
return null;
}
})())),(((function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var hidden_QMARK_ = frontend.handler.property.file.properties_hidden_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
return cljs.core.not(hidden_QMARK_);
})();
if(and__5000__auto____$2){
return ((cljs.core.not((function (){var and__5000__auto____$3 = block_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto____$3)){
return ((cljs.core.seq(ast_title)) || (cljs.core.seq(ast_body)));
} else {
return and__5000__auto____$3;
}
})())) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938))) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config))))));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.properties_cp(config,block__$2):null),daiquiri.interpreter.interpret(frontend.components.block.block_content_inner(config,block__$2,ast_body,plugin_slotted_QMARK_,collapsed_QMARK_,block_ref_with_title_QMARK_)),(function (){var G__88852 = new cljs.core.Keyword("block","warning","block/warning",2131709542).cljs$core$IFn$_invoke$arity$1(block__$2);
var G__88852__$1 = (((G__88852 instanceof cljs.core.Keyword))?G__88852.fqn:null);
switch (G__88852__$1) {
case "multiple-blocks":
return daiquiri.core.create_element("p",{'className':"warning text-sm"},["Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]);

break;
default:
return null;

}
})()]:[daiquiri.interpreter.interpret(attrs88834),(function (){var attrs88838 = (cljs.core.truth_(plugin_slotted_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-head-wrap","div.block-head-wrap",568923500),frontend.components.block.block_title(config,block__$2,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88838))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","block-content-inner"], null)], null),attrs88838], 0))):{'className':"flex flex-row justify-between block-content-inner"}),((cljs.core.map_QMARK_(attrs88838))?[((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]:[daiquiri.interpreter.interpret(attrs88838),((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]));
})(),(cljs.core.truth_(deadline)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_deadline_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var deadline_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"DEADLINE",deadline_ast);
} else {
return null;
}
})()):null),(cljs.core.truth_(scheduled)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_scheduled_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var scheduled_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"SCHEDULED",scheduled_ast);
} else {
return null;
}
})()):null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?null:daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872).cljs$core$IFn$_invoke$arity$1(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var invalid_properties = temp__5804__auto__;
return frontend.components.block.invalid_properties_cp(invalid_properties);
} else {
return null;
}
})())),(((function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var hidden_QMARK_ = frontend.handler.property.file.properties_hidden_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
return cljs.core.not(hidden_QMARK_);
})();
if(and__5000__auto____$2){
return ((cljs.core.not((function (){var and__5000__auto____$3 = block_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto____$3)){
return ((cljs.core.seq(ast_title)) || (cljs.core.seq(ast_body)));
} else {
return and__5000__auto____$3;
}
})())) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938))) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config))))));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.properties_cp(config,block__$2):null),daiquiri.interpreter.interpret(frontend.components.block.block_content_inner(config,block__$2,ast_body,plugin_slotted_QMARK_,collapsed_QMARK_,block_ref_with_title_QMARK_)),(function (){var G__88853 = new cljs.core.Keyword("block","warning","block/warning",2131709542).cljs$core$IFn$_invoke$arity$1(block__$2);
var G__88853__$1 = (((G__88853 instanceof cljs.core.Keyword))?G__88853.fqn:null);
switch (G__88853__$1) {
case "multiple-blocks":
return daiquiri.core.create_element("p",{'className':"warning text-sm"},["Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]);

break;
default:
return null;

}
})()]));
})()]:[daiquiri.interpreter.interpret(attrs88833),(function (){var attrs88841 = (((((((content__$1).length) > frontend.state.block_content_max_length(frontend.state.get_current_repo()))) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"code","code",1586293142),null], null), null),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block__$2)))))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning.text-sm","div.warning.text-sm",-192579545),"Large block will not be editable or searchable to not slow down the app, please use another editor to edit this block."], null):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs88841))?daiquiri.interpreter.element_attributes(attrs88841):null),((cljs.core.map_QMARK_(attrs88841))?[(function (){var attrs88842 = (cljs.core.truth_(plugin_slotted_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-head-wrap","div.block-head-wrap",568923500),frontend.components.block.block_title(config,block__$2,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88842))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","block-content-inner"], null)], null),attrs88842], 0))):{'className':"flex flex-row justify-between block-content-inner"}),((cljs.core.map_QMARK_(attrs88842))?[((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]:[daiquiri.interpreter.interpret(attrs88842),((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]));
})(),(cljs.core.truth_(deadline)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_deadline_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var deadline_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"DEADLINE",deadline_ast);
} else {
return null;
}
})()):null),(cljs.core.truth_(scheduled)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_scheduled_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var scheduled_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"SCHEDULED",scheduled_ast);
} else {
return null;
}
})()):null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?null:daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872).cljs$core$IFn$_invoke$arity$1(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var invalid_properties = temp__5804__auto__;
return frontend.components.block.invalid_properties_cp(invalid_properties);
} else {
return null;
}
})())),(((function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var hidden_QMARK_ = frontend.handler.property.file.properties_hidden_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
return cljs.core.not(hidden_QMARK_);
})();
if(and__5000__auto____$2){
return ((cljs.core.not((function (){var and__5000__auto____$3 = block_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto____$3)){
return ((cljs.core.seq(ast_title)) || (cljs.core.seq(ast_body)));
} else {
return and__5000__auto____$3;
}
})())) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938))) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config))))));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.properties_cp(config,block__$2):null),daiquiri.interpreter.interpret(frontend.components.block.block_content_inner(config,block__$2,ast_body,plugin_slotted_QMARK_,collapsed_QMARK_,block_ref_with_title_QMARK_)),(function (){var G__88854 = new cljs.core.Keyword("block","warning","block/warning",2131709542).cljs$core$IFn$_invoke$arity$1(block__$2);
var G__88854__$1 = (((G__88854 instanceof cljs.core.Keyword))?G__88854.fqn:null);
switch (G__88854__$1) {
case "multiple-blocks":
return daiquiri.core.create_element("p",{'className':"warning text-sm"},["Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]);

break;
default:
return null;

}
})()]:[daiquiri.interpreter.interpret(attrs88841),(function (){var attrs88845 = (cljs.core.truth_(plugin_slotted_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-head-wrap","div.block-head-wrap",568923500),frontend.components.block.block_title(config,block__$2,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88845))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","justify-between","block-content-inner"], null)], null),attrs88845], 0))):{'className':"flex flex-row justify-between block-content-inner"}),((cljs.core.map_QMARK_(attrs88845))?[((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]:[daiquiri.interpreter.interpret(attrs88845),((db_based_QMARK_)?frontend.components.block.task_spent_time_cp(block__$2):daiquiri.interpreter.interpret(frontend.components.file_based.block.clock_summary_cp(block__$2,ast_body)))]));
})(),(cljs.core.truth_(deadline)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_deadline_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var deadline_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"DEADLINE",deadline_ast);
} else {
return null;
}
})()):null),(cljs.core.truth_(scheduled)?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.handler.block.get_scheduled_ast(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var scheduled_ast = temp__5804__auto__;
return frontend.components.file_based.block.timestamp_cp(block__$2,"SCHEDULED",scheduled_ast);
} else {
return null;
}
})()):null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?null:daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872).cljs$core$IFn$_invoke$arity$1(block__$2);
if(cljs.core.truth_(temp__5804__auto__)){
var invalid_properties = temp__5804__auto__;
return frontend.components.block.invalid_properties_cp(invalid_properties);
} else {
return null;
}
})())),(((function (){var and__5000__auto__ = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var hidden_QMARK_ = frontend.handler.property.file.properties_hidden_QMARK_(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block__$2));
return cljs.core.not(hidden_QMARK_);
})();
if(and__5000__auto____$2){
return ((cljs.core.not((function (){var and__5000__auto____$3 = block_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto____$3)){
return ((cljs.core.seq(ast_title)) || (cljs.core.seq(ast_body)));
} else {
return and__5000__auto____$3;
}
})())) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_type,new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938))) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config))))));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.properties_cp(config,block__$2):null),daiquiri.interpreter.interpret(frontend.components.block.block_content_inner(config,block__$2,ast_body,plugin_slotted_QMARK_,collapsed_QMARK_,block_ref_with_title_QMARK_)),(function (){var G__88855 = new cljs.core.Keyword("block","warning","block/warning",2131709542).cljs$core$IFn$_invoke$arity$1(block__$2);
var G__88855__$1 = (((G__88855 instanceof cljs.core.Keyword))?G__88855.fqn:null);
switch (G__88855__$1) {
case "multiple-blocks":
return daiquiri.core.create_element("p",{'className':"warning text-sm"},["Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]);

break;
default:
return null;

}
})()]));
})()]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/block-content");
frontend.components.block.block_refs_count = rum.core.lazy_build(rum.core.build_defc,(function (block,block_refs_count_SINGLEQUOTE_,_STAR_hide_block_refs_QMARK_){
if((block_refs_count_SINGLEQUOTE_ > (0))){
var attrs88860 = (function (){var G__88861 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open block references",new cljs.core.Keyword(null,"class","class",-2030961996),"px-1 py-0 w-5 h-5 opacity-70 hover:opacity-100",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_(frontend.components.block.goog$module$goog$object.get(e,"shiftKey"))){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_hide_block_refs_QMARK_,cljs.core.not);
}
})], null);
var G__88862 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm","span.text-sm",1152322665),block_refs_count_SINGLEQUOTE_], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__88861,G__88862) : logseq.shui.ui.button.call(null,G__88861,G__88862));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88860))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["h-6"], null)], null),attrs88860], 0))):{'className':"h-6"}),((cljs.core.map_QMARK_(attrs88860))?null:[daiquiri.interpreter.interpret(attrs88860)]));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.block/block-refs-count");
frontend.components.block.block_content_with_error = rum.core.lazy_build(rum.core.build_defc,(function (config,block,edit_input_id,block_id,_STAR_show_query_QMARK_,editor_box){
var vec__88863 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var editing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88863,(0),null);
var set_editing_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88863,(1),null);
var query = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block);
return frontend.ui.catch_error((cljs.core.truth_(query)?(cljs.core.truth_(editing_QMARK_)?(function (){var G__88872 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block","block",664686210),query,new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(query),new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550),cljs.core.uuid,new cljs.core.Keyword(null,"format","format",-1306924766),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089))], null);
var G__88873 = ["edit-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(query))].join('');
var G__88874 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"editor-opts","editor-opts",-1306154715),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (){
return (set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_editing_BANG_.call(null,false));
})], null));
return (editor_box.cljs$core$IFn$_invoke$arity$3 ? editor_box.cljs$core$IFn$_invoke$arity$3(G__88872,G__88873,G__88874) : editor_box.call(null,G__88872,G__88873,G__88874));
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.text-sm","a.text-sm",-884048665),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_editing_BANG_.call(null,true));

var G__88875 = query;
var G__88876 = new cljs.core.Keyword(null,"max","max",61366548);
var G__88877 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__88875,G__88876,G__88877) : frontend.handler.editor.edit_block_BANG_.call(null,G__88875,G__88876,G__88877));
})], null),"Click to fix query: ",new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(query)], null)):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-col.w-full.gap-2","div.flex.flex-1.flex-col.w-full.gap-2",1007423574),frontend.ui.block_error("Block Render Error:",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(query);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}
})(),new cljs.core.Keyword(null,"section-attrs","section-attrs",1373816150),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
(frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));

frontend.handler.editor.unhighlight_blocks_BANG_();

return frontend.state.set_editing_BANG_.cljs$core$IFn$_invoke$arity$variadic(edit_input_id,content,block,"",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),(frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)], null)], 0));
})], null)], null))], null)),frontend.components.block.block_content(config,block,edit_input_id,block_id,_STAR_show_query_QMARK_));
}),null,"frontend.components.block/block-content-with-error");
frontend.components.block.block_content_or_editor = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,p__88878,p__88879){
var map__88880 = p__88878;
var map__88880__$1 = cljs.core.__destructure_map(map__88880);
var block = map__88880__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88880__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var map__88881 = p__88879;
var map__88881__$1 = cljs.core.__destructure_map(map__88881);
var edit_input_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"edit-input-id","edit-input-id",-1876858101));
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"edit?","edit?",-842131310));
var hide_block_refs_count_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"hide-block-refs-count?","hide-block-refs-count?",-1723688145));
var refs_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"refs-count","refs-count",643531144));
var _STAR_hide_block_refs_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"*hide-block-refs?","*hide-block-refs?",-1362658712));
var _STAR_show_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88881__$1,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510));
var format = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?new cljs.core.Keyword(null,"markdown","markdown",1227225089):(function (){var or__5002__auto__ = new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})());
var editor_box = frontend.state.get_component(new cljs.core.Keyword("editor","box","editor/box",-1921770435));
var editor_id = ["editor-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(edit_input_id)].join('');
var block_reference_only_QMARK_ = (function (){var G__88882 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
var G__88882__$1 = (((G__88882 == null))?null:clojure.string.trim(G__88882));
if((G__88882__$1 == null)){
return null;
} else {
return logseq.common.util.block_ref.block_ref_QMARK_(G__88882__$1);
}
})();
var named_QMARK_ = (!((new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block) == null)));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var table_QMARK_ = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config);
var raw_mode_block = frontend.state.sub(new cljs.core.Keyword("editor","raw-mode-block","editor/raw-mode-block",-1788505944));
var type_block_editor_QMARK_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"code","code",1586293142),null], null), null),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(raw_mode_block))));
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550),block_id);
return daiquiri.core.create_element("div",{'data-node-type':(function (){var G__88883 = new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block);
if((G__88883 == null)){
return null;
} else {
return cljs.core.name(G__88883);
}
})(),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-content-or-editor-wrap",(cljs.core.truth_(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1))?"ls-page-title-container":null)], null))},[((((db_based_QMARK_) && (cljs.core.not(table_QMARK_))))?frontend.components.block.block_positioned_properties(config__$1,block,new cljs.core.Keyword(null,"block-left","block-left",-1266158554)):null),daiquiri.core.create_element("div",{'className':"block-content-or-editor-inner"},[(function (){var attrs88890 = (function (){var content_cp = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.w-full.block-content-wrapper","div.flex.flex-1.w-full.block-content-wrapper",1327018947),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"display","display",242065432),"flex"], null)], null),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"page-title-actions-cp","page-title-actions-cp",-1825610797).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var actions_cp = temp__5804__auto__;
return (actions_cp.cljs$core$IFn$_invoke$arity$1 ? actions_cp.cljs$core$IFn$_invoke$arity$1(block) : actions_cp.call(null,block));
} else {
return null;
}
})(),frontend.components.block.block_content_with_error(config__$1,block,edit_input_id,block_id,_STAR_show_query_QMARK_,editor_box),((((cljs.core.not(hide_block_refs_count_QMARK_)) && ((((!(named_QMARK_))) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config__$1)))))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center","div.flex.flex-row.items-center",2086153476),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"embed-parent","embed-parent",1172681354).cljs$core$IFn$_invoke$arity$1(config__$1);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.opacity-70.hover:opacity-100.svg-small.inline","a.opacity-70.hover:opacity-100.svg-small.inline",-454542425),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

var temp__5804__auto__ = new cljs.core.Keyword(null,"embed-parent","embed-parent",1172681354).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var block__$1 = temp__5804__auto__;
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block__$1,new cljs.core.Keyword(null,"max","max",61366548)));
} else {
return null;
}
})], null),frontend.components.svg.edit], null):null),(cljs.core.truth_(block_reference_only_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.opacity-70.hover:opacity-100.svg-small.inline","a.opacity-70.hover:opacity-100.svg-small.inline",-454542425),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block,new cljs.core.Keyword(null,"max","max",61366548)));
})], null),frontend.components.svg.edit], null):null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
})())?null:frontend.components.block.block_refs_count(block,refs_count,_STAR_hide_block_refs_QMARK_))], null);
var editor_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.editor-wrapper.flex.flex-1.w-full","div.editor-wrapper.flex.flex-1.w-full",-1067704408),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),editor_id,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"opacity-50","opacity-50",-660022124),cljs.core.boolean$((function (){var or__5002__auto__ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.built_in_QMARK_.call(null,block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.journal_QMARK_.call(null,block));
}
})())], null)], null))], null),frontend.ui.catch_error(frontend.ui.block_error("Something wrong in the editor",cljs.core.PersistentArrayMap.EMPTY),(function (){var G__88893 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"block-id","block-id",-70582834),uuid,new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550),block_id,new cljs.core.Keyword(null,"format","format",-1306924766),format], null);
var G__88894 = edit_input_id;
var G__88895 = config__$1;
return (editor_box.cljs$core$IFn$_invoke$arity$3 ? editor_box.cljs$core$IFn$_invoke$arity$3(G__88893,G__88894,G__88895) : editor_box.call(null,G__88893,G__88894,G__88895));
})())], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = editor_box;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = edit_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(type_block_editor_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return editor_cp;
} else {
return content_cp;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88890))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-row","flex","flex-1","flex-row","gap-1","items-center"], null)], null),attrs88890], 0))):{'className':"block-row flex flex-1 flex-row gap-1 items-center"}),((cljs.core.map_QMARK_(attrs88890))?[(cljs.core.truth_(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config__$1))?null:(function (){var attrs88891 = ((((db_based_QMARK_) && (cljs.core.not(table_QMARK_))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-70.hover:opacity-100","div.opacity-70.hover:opacity-100",-76583246),frontend.components.block.block_positioned_properties(config__$1,block,new cljs.core.Keyword(null,"block-right","block-right",-1578897705))], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88891))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-block-right","flex","flex-row","items-center","self-start","gap-1"], null)], null),attrs88891], 0))):{'className':"ls-block-right flex flex-row items-center self-start gap-1"}),((cljs.core.map_QMARK_(attrs88891))?[(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
}
})())?null:((((db_based_QMARK_) && (cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)))))?frontend.components.block.tags_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),block):null))]:[daiquiri.interpreter.interpret(attrs88891),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
}
})())?null:((((db_based_QMARK_) && (cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)))))?frontend.components.block.tags_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),block):null))]));
})())]:[daiquiri.interpreter.interpret(attrs88890),(cljs.core.truth_(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config__$1))?null:(function (){var attrs88892 = ((((db_based_QMARK_) && (cljs.core.not(table_QMARK_))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-70.hover:opacity-100","div.opacity-70.hover:opacity-100",-76583246),frontend.components.block.block_positioned_properties(config__$1,block,new cljs.core.Keyword(null,"block-right","block-right",-1578897705))], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88892))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-block-right","flex","flex-row","items-center","self-start","gap-1"], null)], null),attrs88892], 0))):{'className':"ls-block-right flex flex-row items-center self-start gap-1"}),((cljs.core.map_QMARK_(attrs88892))?[(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
}
})())?null:((((db_based_QMARK_) && (cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)))))?frontend.components.block.tags_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),block):null))]:[daiquiri.interpreter.interpret(attrs88892),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
}
})())?null:((((db_based_QMARK_) && (cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)))))?frontend.components.block.tags_cp(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),block):null))]));
})())]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/block-content-or-editor");
frontend.components.block.single_block_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,_config,block_uuid){
var uuid = ((typeof block_uuid === 'string')?cljs.core.uuid(block_uuid):block_uuid);
var block = (function (){var G__88897 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88897) : frontend.db.entity.call(null,G__88897));
})();
var config = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid,new cljs.core.Keyword(null,"block?","block?",1102479923),true,new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.state.get_component(new cljs.core.Keyword("editor","box","editor/box",-1921770435)),new cljs.core.Keyword(null,"in-whiteboard?","in-whiteboard?",-426774360),true], null);
if(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))){
var attrs88896 = (frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2(config,block) : frontend.components.block.block_container.call(null,config,block));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88896))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["single-block"], null)], null),attrs88896], 0))):{'className':"single-block"}),((cljs.core.map_QMARK_(attrs88896))?null:[daiquiri.interpreter.interpret(attrs88896)]));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.mixins.container_id], null),"frontend.components.block/single-block-cp");
frontend.components.block.non_dragging_QMARK_ = (function frontend$components$block$non_dragging_QMARK_(e){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.components.block.goog$module$goog$object.get(e,"buttons"),(1))) && ((((!(dommy.core.has_class_QMARK_(frontend.components.block.goog$module$goog$object.get(e,"target"),"bullet-container")))) && ((((!(dommy.core.has_class_QMARK_(frontend.components.block.goog$module$goog$object.get(e,"target"),"bullet")))) && (cljs.core.not(cljs.core.deref(frontend.components.block._STAR_dragging_QMARK_))))))));
});
frontend.components.block.breadcrumb_fragment = rum.core.lazy_build(rum.core.build_defc,(function (config,block,label,opts){
return daiquiri.core.create_element("a",{'onPointerDown':(function (e){
if((!((new cljs.core.Keyword(null,"sidebar-key","sidebar-key",2034878565).cljs$core$IFn$_invoke$arity$1(config) == null)))){
return frontend.util.stop(e);
} else {
return null;
}
}),'onPointerUp':(function (e){
if(cljs.core.truth_(frontend.components.block.goog$module$goog$object.get(e,"shiftKey"))){
frontend.util.stop(e);

return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
} else {
if(frontend.util.atom_QMARK_(new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122).cljs$core$IFn$_invoke$arity$1(opts))){
frontend.util.stop(e);

return cljs.core.reset_BANG_(new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
} else {
if((!((new cljs.core.Keyword(null,"sidebar-key","sidebar-key",2034878565).cljs$core$IFn$_invoke$arity$1(config) == null)))){
return null;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var uuid = temp__5804__auto__;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"on-redirect-to-page","on-redirect-to-page",-1420791266).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.route.redirect_to_page_BANG_;
}
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)], null));
} else {
return null;
}

}
}
}
})},[daiquiri.interpreter.interpret(label)]);
}),null,"frontend.components.block/breadcrumb-fragment");
frontend.components.block.breadcrumb_separator = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(frontend.ui.icon("chevron-right",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null),new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50 mx-1"], null)));
}),null,"frontend.components.block/breadcrumb-separator");
frontend.components.block.breadcrumb_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,repo,block_id,p__88898){
var map__88899 = p__88898;
var map__88899__$1 = cljs.core.__destructure_map(map__88899);
var opts = map__88899__$1;
var show_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__88899__$1,new cljs.core.Keyword(null,"show-page?","show-page?",792494155),true);
var indent_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88899__$1,new cljs.core.Keyword(null,"indent?","indent?",1381429379));
var end_separator_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88899__$1,new cljs.core.Keyword(null,"end-separator?","end-separator?",424414922));
var level_limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__88899__$1,new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3));
var _navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88899__$1,new cljs.core.Keyword(null,"_navigating-block","_navigating-block",-946999864));
var from_property = (cljs.core.truth_((function (){var and__5000__auto__ = block_id;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
} else {
return and__5000__auto__;
}
})())?new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1((function (){var G__88900 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88900) : frontend.db.entity.call(null,G__88900));
})()):null);
var parents = (function (){var G__88901 = repo;
var G__88902 = block_id;
var G__88903 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"depth","depth",1768663640),(level_limit + (1))], null);
return (frontend.db.get_block_parents.cljs$core$IFn$_invoke$arity$3 ? frontend.db.get_block_parents.cljs$core$IFn$_invoke$arity$3(G__88901,G__88902,G__88903) : frontend.db.get_block_parents.call(null,G__88901,G__88902,G__88903));
})();
var parents__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(parents,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [from_property], null)));
var page = (function (){var or__5002__auto__ = (frontend.db.get_block_page.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_block_page.cljs$core$IFn$_invoke$arity$2(repo,block_id) : frontend.db.get_block_page.call(null,repo,block_id));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.db.model.query_block_by_uuid(block_id);
}
})();
var page_name = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
var page_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var show_QMARK_ = (function (){var or__5002__auto__ = cljs.core.seq(parents__$1);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = show_page_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return page_name;
}
}
})();
var parents__$2 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_name,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(cljs.core.first(parents__$1))))?cljs.core.rest(parents__$1):parents__$1);
var more_QMARK_ = (cljs.core.count(parents__$2) > level_limit);
var parents__$3 = ((more_QMARK_)?cljs.core.take_last(level_limit,parents__$2):parents__$2);
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"breadcrumb?","breadcrumb?",-1793266363),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"stop-click-event?","stop-click-event?",-1661319069),false], 0));
if(cljs.core.truth_(show_QMARK_)){
var page_name_props = (cljs.core.truth_(show_page_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,frontend.components.block.page_cp(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(config__$1,new cljs.core.Keyword(null,"breadcrumb?","breadcrumb?",-1793266363),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)),page),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),(function (){var or__5002__auto__ = page_title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_name;
}
})()], null)], null):null);
var parents_props = cljs.core.doall.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$block$iter__88904(s__88905){
return (new cljs.core.LazySeq(null,(function (){
var s__88905__$1 = s__88905;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__88905__$1);
if(temp__5804__auto__){
var s__88905__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__88905__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__88905__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__88907 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__88906 = (0);
while(true){
if((i__88906 < size__5479__auto__)){
var map__88908 = cljs.core._nth(c__5478__auto__,i__88906);
var map__88908__$1 = cljs.core.__destructure_map(map__88908);
var block = map__88908__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88908__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88908__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88908__$1,new cljs.core.Keyword("block","title","block/title",710445684));
cljs.core.chunk_append(b__88907,(cljs.core.truth_(name)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,block)], null):(function (){var result = frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block),title);
var ast_body = new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(result);
var ast_title = new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067).cljs$core$IFn$_invoke$arity$1(result);
var config__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,(cljs.core.truth_(ast_title)?((cljs.core.seq(ast_title))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span","span",1394872991),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$2,ast_title) : frontend.components.block.map_inline.call(null,config__$2,ast_title))):frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"div","div",1057191632),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config__$2,ast_body) : frontend.components.block.markup_elements_cp.call(null,config__$2,ast_body)))):null)], null);
})()));

var G__89527 = (i__88906 + (1));
i__88906 = G__89527;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__88907),frontend$components$block$iter__88904(cljs.core.chunk_rest(s__88905__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__88907),null);
}
} else {
var map__88909 = cljs.core.first(s__88905__$2);
var map__88909__$1 = cljs.core.__destructure_map(map__88909);
var block = map__88909__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88909__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88909__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88909__$1,new cljs.core.Keyword("block","title","block/title",710445684));
return cljs.core.cons((cljs.core.truth_(name)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,block)], null):(function (){var result = frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block),title);
var ast_body = new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(result);
var ast_title = new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067).cljs$core$IFn$_invoke$arity$1(result);
var config__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,(cljs.core.truth_(ast_title)?((cljs.core.seq(ast_title))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"span","span",1394872991),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config__$2,ast_title) : frontend.components.block.map_inline.call(null,config__$2,ast_title))):frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"div","div",1057191632),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config__$2,ast_body) : frontend.components.block.markup_elements_cp.call(null,config__$2,ast_body)))):null)], null);
})()),frontend$components$block$iter__88904(cljs.core.rest(s__88905__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(parents__$3);
})());
var breadcrumbs = cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(rum.core.with_key(frontend.components.block.breadcrumb_separator(),"icon"),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(x);
if(and__5000__auto__){
return cljs.core.second(x);
} else {
return and__5000__auto__;
}
})())){
var vec__88910 = x;
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88910,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88910,(1),null);
return rum.core.with_key(frontend.components.block.breadcrumb_fragment(config__$1,block,label,opts),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-70","span.opacity-70",1907592405),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),"dots"], null),"\u22EF"], null);
}
}),cljs.core.filterv(cljs.core.identity,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name_props], null),((more_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"more","more",-2058821800)], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,parents_props)], 0)))));
if(cljs.core.seq(breadcrumbs)){
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["breadcrumb","block-parents",((cljs.core.seq(breadcrumbs))?[(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"search?","search?",785472524).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"list-view?","list-view?",499477951).cljs$core$IFn$_invoke$arity$1(config__$1);
}
})())?null:" my-2"),(cljs.core.truth_(indent_QMARK_)?" ml-4":null)].join(''):null)], null))},[((((new cljs.core.Keyword(null,"top-level?","top-level?",993634489).cljs$core$IFn$_invoke$arity$1(config__$1) === false) && (cljs.core.seq(parents__$3))))?frontend.components.block.breadcrumb_separator():null),daiquiri.interpreter.interpret(breadcrumbs),(cljs.core.truth_(end_separator_QMARK_)?frontend.components.block.breadcrumb_separator():null)]);
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.block/breadcrumb-aux");
frontend.components.block.breadcrumb = rum.core.lazy_build(rum.core.build_defc,(function (config,repo,block_id,p__88913){
var map__88914 = p__88913;
var map__88914__$1 = cljs.core.__destructure_map(map__88914);
var opts = map__88914__$1;
var _show_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88914__$1,new cljs.core.Keyword(null,"_show-page?","_show-page?",-1363232404));
var _indent_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88914__$1,new cljs.core.Keyword(null,"_indent?","_indent?",-1442751225));
var _end_separator_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88914__$1,new cljs.core.Keyword(null,"_end-separator?","_end-separator?",415721322));
var level_limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__88914__$1,new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3));
var _navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88914__$1,new cljs.core.Keyword(null,"_navigating-block","_navigating-block",-946999864));
var vec__88915 = (function (){var G__88918 = (function (){var G__88919 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88919) : frontend.db.entity.call(null,G__88919));
})();
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__88918) : logseq.shui.hooks.use_state.call(null,G__88918));
})();
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88915,(0),null);
var set_block_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88915,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null)], 0))),(function (block__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return frontend.db.async._LT_get_block_parents(frontend.state.get_current_repo(),id,level_limit);
} else {
return null;
}
})()),(function (_){
return promesa.protocols._promise((set_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_block_BANG_.cljs$core$IFn$_invoke$arity$1(block__$1) : set_block_BANG_.call(null,block__$1)));
}));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(block)){
return frontend.components.block.breadcrumb_aux(config,repo,block_id,opts);
} else {
return null;
}
}),null,"frontend.components.block/breadcrumb");
frontend.components.block.block_drag_over = (function frontend$components$block$block_drag_over(event,uuid,top_QMARK_,block_id,_STAR_move_to_SINGLEQUOTE_){
frontend.util.stop(event);

if(frontend.components.block.dnd_same_block_QMARK_(uuid)){
return null;
} else {
var over_block = goog.dom.getElement(block_id);
var rect = module$frontend$utils.getOffsetRect(over_block);
var element_top = frontend.components.block.goog$module$goog$object.get(rect,"top");
var element_left = frontend.components.block.goog$module$goog$object.get(rect,"left");
var x_offset = (event.pageX - element_left);
var cursor_top = frontend.components.block.goog$module$goog$object.get(event,"clientY");
var move_to_value = (cljs.core.truth_((function (){var and__5000__auto__ = top_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (Math.abs((cursor_top - element_top)) <= (16));
} else {
return and__5000__auto__;
}
})())?new cljs.core.Keyword(null,"top","top",-1856271961):(((x_offset > (cljs.core.truth_(frontend.util.capacitor_new_QMARK_())?(100):(50))))?new cljs.core.Keyword(null,"nested","nested",18943849):new cljs.core.Keyword(null,"sibling","sibling",-1183865000)
));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(uuid,cljs.core.deref(frontend.components.block._STAR_dragging_over_block))){
} else {
frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();
}

cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_over_block,uuid);

cljs.core.reset_BANG_(frontend.components.block._STAR_drag_to_block,block_id);

return cljs.core.reset_BANG_(_STAR_move_to_SINGLEQUOTE_,move_to_value);
}
});
frontend.components.block.block_drag_end = (function frontend$components$block$block_drag_end(var_args){
var G__88921 = arguments.length;
switch (G__88921) {
case 1:
return frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$1 = (function (_event){
return frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$2(_event,frontend.components.block._STAR_move_to);
}));

(frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$2 = (function (_event,_STAR_move_to_SINGLEQUOTE_){
var G__88922 = (function (){
cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_QMARK_,false);

cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_block,null);

cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_over_block,null);

cljs.core.reset_BANG_(frontend.components.block._STAR_drag_to_block,null);

cljs.core.reset_BANG_(_STAR_move_to_SINGLEQUOTE_,null);

return frontend.handler.editor.unhighlight_blocks_BANG_();
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__88922) : frontend.util.schedule.call(null,G__88922));
}));

(frontend.components.block.block_drag_end.cljs$lang$maxFixedArity = 2);

frontend.components.block.block_drag_leave = (function frontend$components$block$block_drag_leave(_event,_STAR_move_to_SINGLEQUOTE_){
return cljs.core.reset_BANG_(_STAR_move_to_SINGLEQUOTE_,null);
});
/**
 * Block on-drop handler
 */
frontend.components.block.block_drop = (function frontend$components$block$block_drop(event,uuid,target_block,original_block,_STAR_move_to_SINGLEQUOTE_){
if(frontend.components.block.dnd_same_block_QMARK_(uuid)){
return null;
} else {
frontend.util.stop_propagation(event);

frontend.mobile.haptics.haptics.cljs$core$IFn$_invoke$arity$0();

var block_uuids_89533 = frontend.state.get_selection_block_ids();
var lookup_refs_89534 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),block_uuids_89533);
var selected_89535 = (function (){var G__88923 = frontend.state.get_current_repo();
var G__88924 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__88925 = lookup_refs_89534;
return (frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3 ? frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3(G__88923,G__88924,G__88925) : frontend.db.pull_many.call(null,G__88923,G__88924,G__88925));
})();
var blocks_89536 = ((cljs.core.seq(selected_89535))?selected_89535:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(frontend.components.block._STAR_dragging_block)], null));
var blocks_89537__$1 = frontend.components.block.remove_nils(blocks_89536);
if(cljs.core.seq(blocks_89537__$1)){
frontend.handler.dnd.move_blocks(event,blocks_89537__$1,target_block,original_block,cljs.core.deref(_STAR_move_to_SINGLEQUOTE_));

if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);

frontend.state.clear_selection_BANG_();
} else {
}
} else {
var repo_89538 = frontend.state.get_current_repo();
var data_transfer_89539 = event.dataTransfer;
var transfer_types_89540 = cljs.core.set(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(data_transfer_89539.types));
if(cljs.core.contains_QMARK_(transfer_types_89540,"text/plain")){
var text_89541 = data_transfer_89539.getData("text/plain");
frontend.handler.editor.api_insert_new_block_BANG_(text_89541,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),uuid,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_move_to_SINGLEQUOTE_),new cljs.core.Keyword(null,"sibling","sibling",-1183865000)),new cljs.core.Keyword(null,"before?","before?",765621039),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_move_to_SINGLEQUOTE_),new cljs.core.Keyword(null,"top","top",-1856271961))], null));
} else {
if(cljs.core.contains_QMARK_(transfer_types_89540,"Files")){
var files_89542 = data_transfer_89539.files;
var format_89543 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(target_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(((frontend.config.local_file_based_graph_QMARK_(repo_89538)) && (cljs.core.not(frontend.state.editing_QMARK_())))){
promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.editor.file_based_save_assets_BANG_.cljs$core$IFn$_invoke$arity$2(repo_89538,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(files_89542)),(function (res){
while(true){
var temp__5804__auto__ = cljs.core.first(res);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__88926 = temp__5804__auto__;
var asset_file_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88926,(0),null);
var file_obj = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88926,(1),null);
var asset_file_fpath = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88926,(2),null);
var matched_alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88926,(3),null);
var image_QMARK__89546 = frontend.config.ext_of_image_QMARK_(asset_file_name);
var link_content_89547 = frontend.handler.assets.get_asset_file_link(format_89543,(cljs.core.truth_(matched_alias)?[(cljs.core.truth_(image_QMARK__89546)?"../assets/":""),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(matched_alias)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset_file_name)].join(''):frontend.handler.file_based.editor.resolve_relative_path((function (){var or__5002__auto__ = asset_file_fpath;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return asset_file_name;
}
})())),(cljs.core.truth_(file_obj)?file_obj.name:(cljs.core.truth_(image_QMARK__89546)?"image":"asset")),image_QMARK__89546);
frontend.handler.editor.api_insert_new_block_BANG_(link_content_89547,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),uuid,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true,new cljs.core.Keyword(null,"before?","before?",765621039),false], null));

var G__89549 = cljs.core.rest(res);
res = G__89549;
continue;
} else {
return null;
}
break;
}
}));
} else {
}
} else {
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.block","unhandled-drop-data-transfer-type","frontend.components.block/unhandled-drop-data-transfer-type",742412087),transfer_types_89540], 0));

}
}
}

return frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$2(event,_STAR_move_to_SINGLEQUOTE_);
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.block !== 'undefined') && (typeof frontend.components.block._STAR_block_last_mouse_event !== 'undefined')){
} else {
frontend.components.block._STAR_block_last_mouse_event = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.block.block_mouse_over = (function frontend$components$block$block_mouse_over(e,block,_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_){
var mouse_moving_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__88931 = cljs.core.deref(frontend.components.block._STAR_block_last_mouse_event);
if((G__88931 == null)){
return null;
} else {
return G__88931.clientY;
}
})(),e.clientY);
if(((mouse_moving_QMARK_) && (((cljs.core.not(cljs.core.deref(frontend.components.block._STAR_dragging_QMARK_))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()))))))){
e.preventDefault();

cljs.core.reset_BANG_(_STAR_control_show_QMARK_,true);

var temp__5804__auto___89553 = goog.dom.getElement(block_id);
if(cljs.core.truth_(temp__5804__auto___89553)){
var parent_89554 = temp__5804__auto___89553;
var node_89555 = parent_89554.querySelector(".bullet-container");
if(cljs.core.truth_(doc_mode_QMARK_)){
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(node_89555,"hide-inner-bullet");
} else {
}
} else {
}

if(frontend.components.block.non_dragging_QMARK_(e)){
var temp__5804__auto___89556 = goog.dom.getElement("app-container-wrapper");
if(cljs.core.truth_(temp__5804__auto___89556)){
var container_89557 = temp__5804__auto___89556;
dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(container_89557,"blocks-selection-mode");
} else {
}

return frontend.handler.editor.highlight_selection_area_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"append?","append?",123923917),true], null)], 0));
} else {
return null;
}
} else {
return null;
}
});
frontend.components.block.block_mouse_leave = (function frontend$components$block$block_mouse_leave(_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_){
cljs.core.reset_BANG_(_STAR_control_show_QMARK_,false);

if(cljs.core.truth_(doc_mode_QMARK_)){
var temp__5804__auto__ = goog.dom.getElement(block_id);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var temp__5804__auto____$1 = parent.querySelector(".bullet-container");
if(cljs.core.truth_(temp__5804__auto____$1)){
var node = temp__5804__auto____$1;
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(node,"hide-inner-bullet");
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.components.block.on_drag_and_mouse_attrs = (function frontend$components$block$on_drag_and_mouse_attrs(block,original_block,uuid,top_QMARK_,block_id,_STAR_move_to_SINGLEQUOTE_){
if(cljs.core.truth_((logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.journal_QMARK_.call(null,block)))){
return null;
} else {
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-drag-enter","on-drag-enter",-1692112235),(function (event){
return event.preventDefault();
}),new cljs.core.Keyword(null,"on-drag-over","on-drag-over",-93410408),(function (event){
return frontend.components.block.block_drag_over(event,uuid,top_QMARK_,block_id,_STAR_move_to_SINGLEQUOTE_);
}),new cljs.core.Keyword(null,"on-drag-leave","on-drag-leave",-373180078),(function (event){
return frontend.components.block.block_drag_leave(event,_STAR_move_to_SINGLEQUOTE_);
}),new cljs.core.Keyword(null,"on-drop","on-drop",1867868491),(function (event){
return frontend.components.block.block_drop(event,uuid,block,original_block,_STAR_move_to_SINGLEQUOTE_);
}),new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (event){
return frontend.components.block.block_drag_end.cljs$core$IFn$_invoke$arity$2(event,_STAR_move_to_SINGLEQUOTE_);
})], null);
}
});
frontend.components.block.root_block_QMARK_ = (function frontend$components$block$root_block_QMARK_(config,block){
var and__5000__auto__ = new cljs.core.Keyword(null,"block?","block?",1102479923).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.util.collapsed_QMARK_(block);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
frontend.components.block.build_config = (function frontend$components$block$build_config(config,block,p__88932){
var map__88933 = p__88932;
var map__88933__$1 = cljs.core.__destructure_map(map__88933);
var navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88933__$1,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122));
var navigated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88933__$1,new cljs.core.Keyword(null,"navigated?","navigated?",359191896));
var G__88934 = config;
var G__88934__$1 = (cljs.core.truth_(navigated_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88934,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(navigating_block)):G__88934);
var G__88934__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88934__$1,new cljs.core.Keyword(null,"block","block",664686210),block)
;
var G__88934__$3 = (((new cljs.core.Keyword(null,"query-result","query-result",-833644142).cljs$core$IFn$_invoke$arity$1(config) == null))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88934__$2,new cljs.core.Keyword(null,"query-result","query-result",-833644142),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null)):G__88934__$2);
var G__88934__$4 = frontend.handler.block.attach_order_list_state(G__88934__$3,block)
;
if((new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(config) == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88934__$4,new cljs.core.Keyword(null,"level","level",1290497552),(0));
} else {
return G__88934__$4;
}
});
frontend.components.block.build_block = (function frontend$components$block$build_block(config,block_STAR_,p__88935){
var map__88936 = p__88935;
var map__88936__$1 = cljs.core.__destructure_map(map__88936);
var navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88936__$1,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122));
var navigated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88936__$1,new cljs.core.Keyword(null,"navigated?","navigated?",359191896));
var linked_block = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1((function (){var G__88937 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_STAR_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88937) : frontend.db.entity.call(null,G__88937));
})());
var block = (cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
return (((cljs.core.first(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block_STAR_)) == null)) && (cljs.core.not((function (){var and__5000__auto____$2 = new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto____$2)){
return clojure.string.includes_QMARK_(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(config),"not");
} else {
return and__5000__auto____$2;
}
})())));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return navigated_QMARK_;
}
})())?(function (){var G__88938 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),navigating_block], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88938) : frontend.db.entity.call(null,G__88938));
})():(cljs.core.truth_(new cljs.core.Keyword(null,"loop-linked?","loop-linked?",-595769994).cljs$core$IFn$_invoke$arity$1(config))?block_STAR_:(cljs.core.truth_(linked_block)?linked_block:block_STAR_
)));
var result = (function (){var or__5002__auto__ = (function (){var G__88939 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__88939) : frontend.db.sub_block.call(null,G__88939));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block_STAR_;
}
})();
if(cljs.core.truth_(linked_block)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_STAR_,result], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,result], null);
}
});
frontend.components.block.block_container_inner_aux = rum.core.lazy_build(rum.core.build_defcs,(function (state,container_state,repo,config_STAR_,block,p__88956){
var map__88957 = p__88956;
var map__88957__$1 = cljs.core.__destructure_map(map__88957);
var opts = map__88957__$1;
var navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88957__$1,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122));
var navigated_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88957__$1,new cljs.core.Keyword(null,"navigated?","navigated?",359191896));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88957__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88957__$1,new cljs.core.Keyword(null,"selected?","selected?",-742502788));
var _STAR_ref = new cljs.core.Keyword("frontend.components.block","ref","frontend.components.block/ref",730942488).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_hide_block_refs_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.block","hide-block-refs?","frontend.components.block/hide-block-refs?",1482805904));
var _STAR_show_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.block","show-query?","frontend.components.block/show-query?",-1158112657));
var show_query_QMARK_ = rum.core.react(_STAR_show_query_QMARK_);
var _STAR_refs_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.block","refs-count","frontend.components.block/refs-count",1152301417));
var hide_block_refs_QMARK_ = rum.core.react(_STAR_hide_block_refs_QMARK_);
var refs_count = ((cljs.core.seq(new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(block)))?cljs.core.count(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(block))):rum.core.react(_STAR_refs_count));
var vec__88958 = frontend.components.block.build_block(config_STAR_,block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),navigating_block,new cljs.core.Keyword(null,"navigated?","navigated?",359191896),navigated_QMARK_], null));
var original_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88958,(0),null);
var block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88958,(1),null);
var config_STAR___$1 = (cljs.core.truth_(original_block)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config_STAR_,new cljs.core.Keyword(null,"original-block","original-block",1808045862),original_block):config_STAR_);
var ref_QMARK_ = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config_STAR___$1);
var in_whiteboard_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"in-whiteboard?","in-whiteboard?",-426774360).cljs$core$IFn$_invoke$arity$1(config_STAR___$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config_STAR___$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1)));
} else {
return and__5000__auto__;
}
})();
var edit_input_id = ["edit-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1))].join('');
var container_id = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config_STAR___$1);
var table_QMARK_ = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config_STAR___$1);
var property_QMARK_ = new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config_STAR___$1);
var custom_query_QMARK_ = cljs.core.boolean$(new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config_STAR___$1));
var ref_or_custom_query_QMARK_ = (function (){var or__5002__auto__ = ref_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return custom_query_QMARK_;
}
})();
var _STAR_navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(container_state,new cljs.core.Keyword("frontend.components.block","navigating-block","frontend.components.block/navigating-block",1869853175));
var map__88961 = block__$1;
var map__88961__$1 = cljs.core.__destructure_map(map__88961);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88961__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88961__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88961__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var config = frontend.components.block.build_config(config_STAR___$1,block__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"navigated?","navigated?",359191896),navigated_QMARK_,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),navigating_block], null));
var level = new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(config);
var _STAR_control_show_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(container_state,new cljs.core.Keyword("frontend.components.block","control-show?","frontend.components.block/control-show?",1638613539));
var db_collapsed_QMARK_ = frontend.util.collapsed_QMARK_(block__$1);
var collapsed_QMARK_ = (cljs.core.truth_((function (){var or__5002__auto__ = ref_or_custom_query_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.components.block.root_block_QMARK_(config,block__$1);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = (function (){var or__5002__auto____$3 = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.class_QMARK_.call(null,block__$1));
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.property_QMARK_.call(null,block__$1));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config);
} else {
return and__5000__auto__;
}
}
}
}
})())?frontend.state.sub_block_collapsed(uuid):db_collapsed_QMARK_
);
var config__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK_);
var breadcrumb_show_QMARK_ = new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369).cljs$core$IFn$_invoke$arity$1(config__$1);
var doc_mode_QMARK_ = new cljs.core.Keyword("document","mode?","document/mode?",-994203479).cljs$core$IFn$_invoke$arity$1(config__$1);
var embed_QMARK_ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
var page_embed_QMARK_ = new cljs.core.Keyword(null,"page-embed?","page-embed?",-1714518279).cljs$core$IFn$_invoke$arity$1(config__$1);
var reference_QMARK_ = new cljs.core.Keyword(null,"reference?","reference?",983881698).cljs$core$IFn$_invoke$arity$1(config__$1);
var whiteboard_block_QMARK_ = frontend.handler.property.util.shape_block_QMARK_(block__$1);
var block_id = ["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join('');
var has_child_QMARK_ = cljs.core.first(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((function (){var G__88962 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88962) : frontend.db.entity.call(null,G__88962));
})()));
var top_QMARK_ = new cljs.core.Keyword(null,"top?","top?",-1883283796).cljs$core$IFn$_invoke$arity$1(config__$1);
var original_block__$1 = new cljs.core.Keyword(null,"original-block","original-block",1808045862).cljs$core$IFn$_invoke$arity$1(config__$1);
var attrs = frontend.components.block.on_drag_and_mouse_attrs(block__$1,original_block__$1,uuid,top_QMARK_,block_id,frontend.components.block._STAR_move_to);
var own_number_list_QMARK_ = new cljs.core.Keyword(null,"own-order-number-list?","own-order-number-list?",2048042976).cljs$core$IFn$_invoke$arity$1(config__$1);
var order_list_QMARK_ = cljs.core.boolean$(own_number_list_QMARK_);
var children = logseq.db.get_children.cljs$core$IFn$_invoke$arity$1(block__$1);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var page_icon = (cljs.core.truth_(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1))?(function (){var icon_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block__$1,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)));
var temp__5804__auto__ = (function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.page_QMARK_.call(null,block__$1));
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = icon_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.some(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block__$1));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.class_QMARK_.call(null,block__$1)))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),"hash"], null):null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.property_QMARK_.call(null,block__$1)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),"letter-p"], null);
} else {
return null;
}
}
}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var icon = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-page-icon.flex.self-start","div.ls-page-icon.flex.self-start",-921491236),frontend.components.icon.icon_picker(icon,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon__$1){
if(cljs.core.truth_(icon__$1)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)),cljs.core.select_keys(icon__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"color","color",1011675173)], null)));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)));
}
}),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(icon_SINGLEQUOTE_),new cljs.core.Keyword(null,"icon-props","icon-props",-895221875),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"width","width",-384071477),"1lh",new cljs.core.Keyword(null,"height","height",1025178622),"1lh",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(cljs.core.truth_(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1))?(38):(18))], null)], null)], null))], null);
} else {
return null;
}
})():null);
var attrs88943 = (function (){var G__88963 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"haschild","haschild",1809599360),new cljs.core.Keyword(null,"data-is-property","data-is-property",584873025),new cljs.core.Keyword(null,"on-touch-cancel","on-touch-cancel",1125389250),new cljs.core.Keyword(null,"ref","ref",1289896967),new cljs.core.Keyword(null,"blockid","blockid",-664467760),new cljs.core.Keyword(null,"data-collapsed","data-collapsed",1225882164),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"containerid","containerid",-1132769612),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"on-touch-start","on-touch-start",447239419),new cljs.core.Keyword(null,"on-touch-end","on-touch-end",1515667389)],[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.boolean$(has_child_QMARK_)),(logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.property_QMARK_.call(null,block__$1)),(function (e){
return frontend.handler.block.on_touch_cancel(e);
}),(function (p1__88940_SHARP_){
if((cljs.core.deref(_STAR_ref) == null)){
return cljs.core.reset_BANG_(_STAR_ref,p1__88940_SHARP_);
} else {
return null;
}
}),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),(function (){var and__5000__auto__ = collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return has_child_QMARK_;
} else {
return and__5000__auto__;
}
})(),["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''),container_id,[(cljs.core.truth_(selected_QMARK_)?"selected":null),(cljs.core.truth_(pre_block_QMARK_)?" pre-block":null),((order_list_QMARK_)?" is-order-list":null),((clojure.string.blank_QMARK_(title))?" is-blank":null),(cljs.core.truth_(original_block__$1)?" embed-block":null)].join(''),(function (event,uuid__$1){
if(cljs.core.truth_(cljs.core.deref(frontend.components.block._STAR_dragging_QMARK_))){
return null;
} else {
return frontend.handler.block.on_touch_start(event,uuid__$1);
}
}),(function (event){
if(cljs.core.truth_(cljs.core.deref(frontend.components.block._STAR_dragging_QMARK_))){
return null;
} else {
return frontend.handler.block.on_touch_end(event);
}
})]);
var G__88963__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.capacitor_new_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.page_QMARK_.call(null,block__$1)));
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__88963,new cljs.core.Keyword(null,"draggable","draggable",1676206163),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-drag-start","on-drag-start",-47712205),(function (event){
frontend.util.stop_propagation(event);

return frontend.components.block.on_drag_start(event,block__$1,block_id);
})], 0)):G__88963);
var G__88963__$2 = (cljs.core.truth_(new cljs.core.Keyword(null,"property-default-value?","property-default-value?",769811896).cljs$core$IFn$_invoke$arity$1(config__$1))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$1,new cljs.core.Keyword(null,"data-is-property-default-value","data-is-property-default-value",-2109075218),new cljs.core.Keyword(null,"property-default-value?","property-default-value?",769811896).cljs$core$IFn$_invoke$arity$1(config__$1)):G__88963__$1);
var G__88963__$3 = (cljs.core.truth_(original_block__$1)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$2,new cljs.core.Keyword(null,"originalblockid","originalblockid",1038951526),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(original_block__$1))):G__88963__$2);
var G__88963__$4 = (cljs.core.truth_(level)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$3,new cljs.core.Keyword(null,"level","level",1290497552),level):G__88963__$3);
var G__88963__$5 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__88963__$4,attrs], 0))
;
var G__88963__$6 = (cljs.core.truth_((function (){var or__5002__auto__ = reference_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = embed_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(page_embed_QMARK_);
} else {
return and__5000__auto__;
}
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$5,new cljs.core.Keyword(null,"data-transclude","data-transclude",-1499995699),true):G__88963__$5);
var G__88963__$7 = (cljs.core.truth_(embed_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$6,new cljs.core.Keyword(null,"data-embed","data-embed",-1493193393),true):G__88963__$6);
if(custom_query_QMARK_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__88963__$7,new cljs.core.Keyword(null,"data-query","data-query",369270450),true);
} else {
return G__88963__$7;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88943))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-block","swipe-item"], null)], null),attrs88943], 0))):{'className':"ls-block swipe-item"}),((cljs.core.map_QMARK_(attrs88943))?[(cljs.core.truth_((function (){var and__5000__auto__ = ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = breadcrumb_show_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.breadcrumb(config__$1,repo,uuid,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false,new cljs.core.Keyword(null,"indent?","indent?",1381429379),true,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),_STAR_navigating_block], null)):null),(cljs.core.truth_((function (){var and__5000__auto__ = top_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
} else {
return and__5000__auto__;
}
})())?frontend.components.block.dnd_separator_wrapper(block__$1,block_id,true):null),(cljs.core.truth_(new cljs.core.Keyword(null,"hide-title?","hide-title?",1631018350).cljs$core$IFn$_invoke$arity$1(config__$1))?null:daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes((cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(cljs.core.truth_(frontend.util.mobile_QMARK_())?(0):(cljs.core.truth_(page_icon)?(-36):(-30)
))], null):null)),'data-has-heading':(function (){var G__88964 = block__$1;
if((G__88964 == null)){
return null;
} else {
return frontend.handler.property.util.lookup(G__88964,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415));
}
})(),'onMouseEnter':(function (e){
return frontend.components.block.block_mouse_over(e,block__$1,_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_);
}),'onMouseMove':(function (e){
return cljs.core.reset_BANG_(frontend.components.block._STAR_block_last_mouse_event,e);
}),'onMouseLeave':(function (_e){
return frontend.components.block.block_mouse_leave(_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_);
}),'className':"block-main-container flex flex-row gap-1"},[((((cljs.core.not(in_whiteboard_QMARK_)) && (((cljs.core.not(property_QMARK_)) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config__$1)))))))?(function (){var edit_QMARK_ = (function (){var or__5002__auto__ = editing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(uuid,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
}
})();
return frontend.components.block.block_control(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"hide-bullet?","hide-bullet?",-990541419),new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1)),block__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),uuid,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK_,new cljs.core.Keyword(null,"*control-show?","*control-show?",-2136402257),_STAR_control_show_QMARK_,new cljs.core.Keyword(null,"edit?","edit?",-842131310),edit_QMARK_], null)], 0)));
})():null),daiquiri.core.create_element("div",{'className':"flex flex-col w-full"},[(function (){var attrs88965 = (cljs.core.truth_(page_icon)?page_icon:null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88965))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-main-content","flex","flex-row","gap-2"], null)], null),attrs88965], 0))):{'className':"block-main-content flex flex-row gap-2"}),((cljs.core.map_QMARK_(attrs88965))?[((whiteboard_block_QMARK_)?frontend.components.block.block_reference(cljs.core.PersistentArrayMap.EMPTY,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),null):(function (){var attrs88966 = (function (){var block__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),pre_block_QMARK_,title)], 0));
var hide_block_refs_count_QMARK_ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword(null,"embed-id","embed-id",717000009).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return table_QMARK_;
}
})();
return frontend.components.block.block_content_or_editor(config__$1,block__$2,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"edit-input-id","edit-input-id",-1876858101),edit_input_id,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"edit?","edit?",-842131310),editing_QMARK_,new cljs.core.Keyword(null,"refs-count","refs-count",643531144),refs_count,new cljs.core.Keyword(null,"*hide-block-refs?","*hide-block-refs?",-1362658712),_STAR_hide_block_refs_QMARK_,new cljs.core.Keyword(null,"hide-block-refs-count?","hide-block-refs-count?",-1723688145),hide_block_refs_count_QMARK_,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88966))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","w-full"], null)], null),attrs88966], 0))):{'className':"flex flex-col w-full"}),((cljs.core.map_QMARK_(attrs88966))?null:[daiquiri.interpreter.interpret(attrs88966)]));
})())]:[daiquiri.interpreter.interpret(attrs88965),((whiteboard_block_QMARK_)?frontend.components.block.block_reference(cljs.core.PersistentArrayMap.EMPTY,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),null):(function (){var attrs88967 = (function (){var block__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),pre_block_QMARK_,title)], 0));
var hide_block_refs_count_QMARK_ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword(null,"embed-id","embed-id",717000009).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return table_QMARK_;
}
})();
return frontend.components.block.block_content_or_editor(config__$1,block__$2,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"edit-input-id","edit-input-id",-1876858101),edit_input_id,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"edit?","edit?",-842131310),editing_QMARK_,new cljs.core.Keyword(null,"refs-count","refs-count",643531144),refs_count,new cljs.core.Keyword(null,"*hide-block-refs?","*hide-block-refs?",-1362658712),_STAR_hide_block_refs_QMARK_,new cljs.core.Keyword(null,"hide-block-refs-count?","hide-block-refs-count?",-1723688145),hide_block_refs_count_QMARK_,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88967))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","w-full"], null)], null),attrs88967], 0))):{'className':"flex flex-col w-full"}),((cljs.core.map_QMARK_(attrs88967))?null:[daiquiri.interpreter.interpret(attrs88967)]));
})())]));
})(),((((db_based_QMARK_) && (((cljs.core.not(collapsed_QMARK_)) && (cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = property_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
})()))))))?frontend.components.block.block_positioned_properties(config__$1,block__$1,new cljs.core.Keyword(null,"block-below","block-below",1808846787)):null)])])),((((db_based_QMARK_) && (((cljs.core.not(collapsed_QMARK_)) && (cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})()))))))?(function (){var attrs88944 = (cljs.core.truth_(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1))?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding-left","padding-left",-1180879053),(45)], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88944))?daiquiri.interpreter.element_attributes(attrs88944):null),((cljs.core.map_QMARK_(attrs88944))?[frontend.components.block.db_properties_cp(config__$1,block__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"in-block-container?","in-block-container?",460158400),true], null))]:[daiquiri.interpreter.interpret(attrs88944),frontend.components.block.db_properties_cp(config__$1,block__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"in-block-container?","in-block-container?",460158400),true], null))]));
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = show_query_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var query_QMARK_ = (function (){var G__88968 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__88969 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88968,G__88969) : logseq.db.class_instance_QMARK_.call(null,G__88968,G__88969));
})();
var query = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block__$1);
var advanced_query_QMARK_ = (function (){var and__5000__auto__ = query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(query));
} else {
return and__5000__auto__;
}
})();
var attrs88949 = (cljs.core.truth_(advanced_query_QMARK_)?(function (){var G__88970 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"code-block","code-block",-2113425141),query);
var G__88971 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"language","language",-1591107564),"clojure"], null);
return (frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2(G__88970,G__88971) : frontend.components.block.src_cp.call(null,G__88970,G__88971));
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-75.ml-5.text-sm.mb-1","div.opacity-75.ml-5.text-sm.mb-1",-911928993),"Set query:"], null),(frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2(config__$1,query) : frontend.components.block.block_container.call(null,config__$1,query))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88949))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","my-1"], null)], null),attrs88949], 0))):{'className':"ml-6 my-1"}),((cljs.core.map_QMARK_(attrs88949))?null:[daiquiri.interpreter.interpret(attrs88949)]));
})():null),((((cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
})())) && (((cljs.core.not(hide_block_refs_QMARK_)) && ((((refs_count > (0))) && (cljs.core.not(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1)))))))))?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","linked-references","block/linked-references",-2022711478));
if(cljs.core.truth_(temp__5804__auto__)){
var refs_cp = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.border.rounded.my-2.shadow-xs","div.px-4.py-2.border.rounded.my-2.shadow-xs",-227853613),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(42)], null)], null),(function (){var G__88974 = block__$1;
var G__88975 = cljs.core.PersistentArrayMap.EMPTY;
return (refs_cp.cljs$core$IFn$_invoke$arity$2 ? refs_cp.cljs$core$IFn$_invoke$arity$2(G__88974,G__88975) : refs_cp.call(null,G__88974,G__88975));
})()], null);
} else {
return null;
}
})()):null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(collapsed_QMARK_);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
if(and__5000__auto____$2){
var G__88977 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__88978 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88977,G__88978) : logseq.db.class_instance_QMARK_.call(null,G__88977,G__88978));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var query_block = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1((function (){var G__88982 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__88982) : frontend.db.entity.call(null,G__88982));
})());
var query_block__$1 = (cljs.core.truth_(query_block)?(function (){var G__88983 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(query_block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__88983) : frontend.db.sub_block.call(null,G__88983));
})():query_block);
var query = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(query_block__$1);
var result = logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"log-error?","log-error?",969837063),false], null),query);
var advanced_query_QMARK_ = cljs.core.map_QMARK_(result);
return daiquiri.core.create_element("div",{'style':{'paddingLeft':(42)}},[frontend.components.query.custom_query(frontend.components.block.wrap_query_components(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662),(!(advanced_query_QMARK_)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"cards?","cards?",1232384109),(function (){var G__88986 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Cards","logseq.class/Cards",-1284265167));
var G__88987 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88986,G__88987) : logseq.db.class_instance_QMARK_.call(null,G__88986,G__88987));
})()], 0))),((advanced_query_QMARK_)?result:new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"builder","builder",-2055262005),null,new cljs.core.Keyword(null,"query","query",-1288509510),frontend.components.query.builder.sanitize_q(query)], null)))]);
})():null),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = in_whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = table_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return property_QMARK_;
}
}
}
})())?null:(function (){var config_SINGLEQUOTE_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.update.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"level","level",1290497552),cljs.core.inc),new cljs.core.Keyword(null,"original-block","original-block",1808045862),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data","data",-232669377)], 0));
return frontend.components.block.block_children(config_SINGLEQUOTE_,block__$1,children,collapsed_QMARK_);
})()),(cljs.core.truth_((function (){var or__5002__auto__ = in_whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = table_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return property_QMARK_;
}
}
})())?null:frontend.components.block.dnd_separator_wrapper(block__$1,block_id,false))]:[daiquiri.interpreter.interpret(attrs88943),(cljs.core.truth_((function (){var and__5000__auto__ = ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = breadcrumb_show_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.components.block.breadcrumb(config__$1,repo,uuid,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false,new cljs.core.Keyword(null,"indent?","indent?",1381429379),true,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),_STAR_navigating_block], null)):null),(cljs.core.truth_((function (){var and__5000__auto__ = top_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
} else {
return and__5000__auto__;
}
})())?frontend.components.block.dnd_separator_wrapper(block__$1,block_id,true):null),(cljs.core.truth_(new cljs.core.Keyword(null,"hide-title?","hide-title?",1631018350).cljs$core$IFn$_invoke$arity$1(config__$1))?null:daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes((cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(cljs.core.truth_(frontend.util.mobile_QMARK_())?(0):(cljs.core.truth_(page_icon)?(-36):(-30)
))], null):null)),'data-has-heading':(function (){var G__88992 = block__$1;
if((G__88992 == null)){
return null;
} else {
return frontend.handler.property.util.lookup(G__88992,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415));
}
})(),'onMouseEnter':(function (e){
return frontend.components.block.block_mouse_over(e,block__$1,_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_);
}),'onMouseMove':(function (e){
return cljs.core.reset_BANG_(frontend.components.block._STAR_block_last_mouse_event,e);
}),'onMouseLeave':(function (_e){
return frontend.components.block.block_mouse_leave(_STAR_control_show_QMARK_,block_id,doc_mode_QMARK_);
}),'className':"block-main-container flex flex-row gap-1"},[((((cljs.core.not(in_whiteboard_QMARK_)) && (((cljs.core.not(property_QMARK_)) && (cljs.core.not(new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014).cljs$core$IFn$_invoke$arity$1(config__$1)))))))?(function (){var edit_QMARK_ = (function (){var or__5002__auto__ = editing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(uuid,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
}
})();
return frontend.components.block.block_control(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"hide-bullet?","hide-bullet?",-990541419),new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1)),block__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),uuid,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),collapsed_QMARK_,new cljs.core.Keyword(null,"*control-show?","*control-show?",-2136402257),_STAR_control_show_QMARK_,new cljs.core.Keyword(null,"edit?","edit?",-842131310),edit_QMARK_], null)], 0)));
})():null),daiquiri.core.create_element("div",{'className':"flex flex-col w-full"},[(function (){var attrs88993 = (cljs.core.truth_(page_icon)?page_icon:null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88993))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["block-main-content","flex","flex-row","gap-2"], null)], null),attrs88993], 0))):{'className':"block-main-content flex flex-row gap-2"}),((cljs.core.map_QMARK_(attrs88993))?[((whiteboard_block_QMARK_)?frontend.components.block.block_reference(cljs.core.PersistentArrayMap.EMPTY,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),null):(function (){var attrs88994 = (function (){var block__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),pre_block_QMARK_,title)], 0));
var hide_block_refs_count_QMARK_ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword(null,"embed-id","embed-id",717000009).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return table_QMARK_;
}
})();
return frontend.components.block.block_content_or_editor(config__$1,block__$2,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"edit-input-id","edit-input-id",-1876858101),edit_input_id,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"edit?","edit?",-842131310),editing_QMARK_,new cljs.core.Keyword(null,"refs-count","refs-count",643531144),refs_count,new cljs.core.Keyword(null,"*hide-block-refs?","*hide-block-refs?",-1362658712),_STAR_hide_block_refs_QMARK_,new cljs.core.Keyword(null,"hide-block-refs-count?","hide-block-refs-count?",-1723688145),hide_block_refs_count_QMARK_,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88994))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","w-full"], null)], null),attrs88994], 0))):{'className':"flex flex-col w-full"}),((cljs.core.map_QMARK_(attrs88994))?null:[daiquiri.interpreter.interpret(attrs88994)]));
})())]:[daiquiri.interpreter.interpret(attrs88993),((whiteboard_block_QMARK_)?frontend.components.block.block_reference(cljs.core.PersistentArrayMap.EMPTY,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),null):(function (){var attrs88998 = (function (){var block__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block__$1,frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(uuid,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),pre_block_QMARK_,title)], 0));
var hide_block_refs_count_QMARK_ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$2),new cljs.core.Keyword(null,"embed-id","embed-id",717000009).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return table_QMARK_;
}
})();
return frontend.components.block.block_content_or_editor(config__$1,block__$2,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"edit-input-id","edit-input-id",-1876858101),edit_input_id,new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id,new cljs.core.Keyword(null,"edit?","edit?",-842131310),editing_QMARK_,new cljs.core.Keyword(null,"refs-count","refs-count",643531144),refs_count,new cljs.core.Keyword(null,"*hide-block-refs?","*hide-block-refs?",-1362658712),_STAR_hide_block_refs_QMARK_,new cljs.core.Keyword(null,"hide-block-refs-count?","hide-block-refs-count?",-1723688145),hide_block_refs_count_QMARK_,new cljs.core.Keyword(null,"*show-query?","*show-query?",279819510),_STAR_show_query_QMARK_], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88998))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","w-full"], null)], null),attrs88998], 0))):{'className':"flex flex-col w-full"}),((cljs.core.map_QMARK_(attrs88998))?null:[daiquiri.interpreter.interpret(attrs88998)]));
})())]));
})(),((((db_based_QMARK_) && (((cljs.core.not(collapsed_QMARK_)) && (cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = property_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1);
}
}
})()))))))?frontend.components.block.block_positioned_properties(config__$1,block__$1,new cljs.core.Keyword(null,"block-below","block-below",1808846787)):null)])])),((((db_based_QMARK_) && (((cljs.core.not(collapsed_QMARK_)) && (cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})()))))))?(function (){var attrs88950 = (cljs.core.truth_(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1))?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding-left","padding-left",-1180879053),(45)], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88950))?daiquiri.interpreter.element_attributes(attrs88950):null),((cljs.core.map_QMARK_(attrs88950))?[frontend.components.block.db_properties_cp(config__$1,block__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"in-block-container?","in-block-container?",460158400),true], null))]:[daiquiri.interpreter.interpret(attrs88950),frontend.components.block.db_properties_cp(config__$1,block__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"in-block-container?","in-block-container?",460158400),true], null))]));
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = show_query_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var query_QMARK_ = (function (){var G__88999 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__89000 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__88999,G__89000) : logseq.db.class_instance_QMARK_.call(null,G__88999,G__89000));
})();
var query = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block__$1);
var advanced_query_QMARK_ = (function (){var and__5000__auto__ = query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(query));
} else {
return and__5000__auto__;
}
})();
var attrs88955 = (cljs.core.truth_(advanced_query_QMARK_)?(function (){var G__89001 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"code-block","code-block",-2113425141),query);
var G__89002 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"language","language",-1591107564),"clojure"], null);
return (frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.src_cp.cljs$core$IFn$_invoke$arity$2(G__89001,G__89002) : frontend.components.block.src_cp.call(null,G__89001,G__89002));
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-75.ml-5.text-sm.mb-1","div.opacity-75.ml-5.text-sm.mb-1",-911928993),"Set query:"], null),(frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.block_container.cljs$core$IFn$_invoke$arity$2(config__$1,query) : frontend.components.block.block_container.call(null,config__$1,query))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs88955))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","my-1"], null)], null),attrs88955], 0))):{'className':"ml-6 my-1"}),((cljs.core.map_QMARK_(attrs88955))?null:[daiquiri.interpreter.interpret(attrs88955)]));
})():null),((((cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"table?","table?",-1064705406).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"property?","property?",2060031741).cljs$core$IFn$_invoke$arity$1(config__$1);
}
})())) && (((cljs.core.not(hide_block_refs_QMARK_)) && ((((refs_count > (0))) && (cljs.core.not(new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config__$1)))))))))?daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","linked-references","block/linked-references",-2022711478));
if(cljs.core.truth_(temp__5804__auto__)){
var refs_cp = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.border.rounded.my-2.shadow-xs","div.px-4.py-2.border.rounded.my-2.shadow-xs",-227853613),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(42)], null)], null),(function (){var G__89005 = block__$1;
var G__89006 = cljs.core.PersistentArrayMap.EMPTY;
return (refs_cp.cljs$core$IFn$_invoke$arity$2 ? refs_cp.cljs$core$IFn$_invoke$arity$2(G__89005,G__89006) : refs_cp.call(null,G__89005,G__89006));
})()], null);
} else {
return null;
}
})()):null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(collapsed_QMARK_);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_QMARK_;
}
})());
if(and__5000__auto____$2){
var G__89007 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__89008 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__89007,G__89008) : logseq.db.class_instance_QMARK_.call(null,G__89007,G__89008));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var query_block = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1((function (){var G__89009 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89009) : frontend.db.entity.call(null,G__89009));
})());
var query_block__$1 = (cljs.core.truth_(query_block)?(function (){var G__89010 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(query_block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__89010) : frontend.db.sub_block.call(null,G__89010));
})():query_block);
var query = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(query_block__$1);
var result = logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"log-error?","log-error?",969837063),false], null),query);
var advanced_query_QMARK_ = cljs.core.map_QMARK_(result);
return daiquiri.core.create_element("div",{'style':{'paddingLeft':(42)}},[frontend.components.query.custom_query(frontend.components.block.wrap_query_components(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662),(!(advanced_query_QMARK_)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"cards?","cards?",1232384109),(function (){var G__89013 = logseq.db.common.entity_plus.entity_memoized((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("logseq.class","Cards","logseq.class/Cards",-1284265167));
var G__89014 = block__$1;
return (logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.class_instance_QMARK_.cljs$core$IFn$_invoke$arity$2(G__89013,G__89014) : logseq.db.class_instance_QMARK_.call(null,G__89013,G__89014));
})()], 0))),((advanced_query_QMARK_)?result:new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"builder","builder",-2055262005),null,new cljs.core.Keyword(null,"query","query",-1288509510),frontend.components.query.builder.sanitize_q(query)], null)))]);
})():null),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = in_whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = table_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return property_QMARK_;
}
}
}
})())?null:(function (){var config_SINGLEQUOTE_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.update.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"level","level",1290497552),cljs.core.inc),new cljs.core.Keyword(null,"original-block","original-block",1808045862),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data","data",-232669377)], 0));
return frontend.components.block.block_children(config_SINGLEQUOTE_,block__$1,children,collapsed_QMARK_);
})()),(cljs.core.truth_((function (){var or__5002__auto__ = in_whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = table_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return property_QMARK_;
}
}
})())?null:frontend.components.block.dnd_separator_wrapper(block__$1,block_id,false))]));
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var vec__89015 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _container_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89015,(0),null);
var _repo = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89015,(1),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89015,(2),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89015,(3),null);
var current_block_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),frontend.state.get_current_page());
var embed_self_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embed?","embed?",-922305920).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config)));
} else {
return and__5000__auto__;
}
})();
var default_hide_QMARK_ = ((cljs.core.not((function (){var and__5000__auto__ = current_block_page_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(embed_self_QMARK_);
if(and__5000__auto____$1){
return frontend.state.auto_expand_block_refs_QMARK_();
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)))));
var _STAR_refs_count = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config))){
} else {
var temp__5804__auto___89617 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto___89617)){
var id_89618 = temp__5804__auto___89617;
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block_refs_count(frontend.state.get_current_repo(),id_89618)),(function (count){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_refs_count,count));
}));
}));
} else {
}
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.block","ref","frontend.components.block/ref",730942488),_STAR_ref,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.block","hide-block-refs?","frontend.components.block/hide-block-refs?",1482805904),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(default_hide_QMARK_),new cljs.core.Keyword("frontend.components.block","show-query?","frontend.components.block/show-query?",-1158112657),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),new cljs.core.Keyword("frontend.components.block","refs-count","frontend.components.block/refs-count",1152301417),_STAR_refs_count], 0));
})], null),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
var _STAR_ref = new cljs.core.Keyword("frontend.components.block","ref","frontend.components.block/ref",730942488).cljs$core$IFn$_invoke$arity$1(state);
return frontend.mixins.listen(state,cljs.core.deref(_STAR_ref),"touchmove",frontend.handler.block.on_touch_move);
}))], null),"frontend.components.block/block-container-inner-aux");
frontend.components.block.block_container_inner = rum.core.lazy_build(rum.core.build_defc,(function (container_state,repo,config_STAR_,block,opts){
var container_id = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config_STAR_);
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var v1 = frontend.state.sub_editing_QMARK_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,block_id], null));
var v2 = frontend.state.sub_editing_QMARK_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473),block_id], null));
var selected_QMARK_ = frontend.state.sub_block_selected_QMARK_(block_id);
var editing_QMARK_ = (function (){var or__5002__auto__ = v1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v2;
}
})();
return frontend.components.block.block_container_inner_aux(container_state,repo,config_STAR_,block,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"editing?","editing?",1646440800),editing_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_], 0)));
}),null,"frontend.components.block/block-container-inner");
frontend.components.block.block_changed_QMARK_ = (function frontend$components$block$block_changed_QMARK_(old_block,new_block){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tx-id","block/tx-id",547556161).cljs$core$IFn$_invoke$arity$1(old_block),new cljs.core.Keyword("block","tx-id","block/tx-id",547556161).cljs$core$IFn$_invoke$arity$1(new_block));
});
frontend.components.block.config_block_should_update_QMARK_ = (function frontend$components$block$config_block_should_update_QMARK_(old_state,new_state){
var config_compare_keys = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"show-cloze?","show-cloze?",1773680872),new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603),new cljs.core.Keyword(null,"own-order-list-type","own-order-list-type",507157714),new cljs.core.Keyword(null,"own-order-list-index","own-order-list-index",2051635079),new cljs.core.Keyword(null,"original-block","original-block",1808045862),new cljs.core.Keyword(null,"edit?","edit?",-842131310),new cljs.core.Keyword(null,"hide-bullet?","hide-bullet?",-990541419)], null);
var b1 = cljs.core.second(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state));
var b2 = cljs.core.second(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state));
var result = ((frontend.components.block.block_changed_QMARK_(b1,b2)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.select_keys(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state)),config_compare_keys),cljs.core.select_keys(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state)),config_compare_keys))));
return cljs.core.boolean$(result);
});
frontend.components.block.set_collapsed_block_BANG_ = (function frontend$components$block$set_collapsed_block_BANG_(block_id,v){
if(v === false){
return frontend.handler.editor.expand_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-db-collpsing?","skip-db-collpsing?",106617442),true], null)], 0));
} else {
return frontend.state.set_collapsed_block_BANG_(block_id,v);
}
});
frontend.components.block.loaded_block_container = rum.core.lazy_build(rum.core.build_defcs,(function() { 
var G__89625__delegate = function (state,config,block,p__89018){
var map__89019 = p__89018;
var map__89019__$1 = cljs.core.__destructure_map(map__89019);
var opts = map__89019__$1;
var repo = frontend.state.get_current_repo();
var _STAR_navigating_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.block","navigating-block","frontend.components.block/navigating-block",1869853175));
var navigating_block = rum.core.react(_STAR_navigating_block);
var navigated_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),navigating_block);
if(and__5000__auto__){
return navigating_block;
} else {
return and__5000__auto__;
}
})();
var config_SINGLEQUOTE_ = (function (){var temp__5802__auto__ = new cljs.core.Keyword("frontend.components.block","container-id","frontend.components.block/container-id",569184931).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5802__auto__)){
var container_id = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id);
} else {
return config;
}
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))){
return rum.core.with_key(frontend.components.block.block_container_inner(state,repo,config_SINGLEQUOTE_,block,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),navigating_block,new cljs.core.Keyword(null,"navigated?","navigated?",359191896),navigated_QMARK_], null)], 0))),["block-inner-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''));
} else {
return null;
}
};
var G__89625 = function (state,config,block,var_args){
var p__89018 = null;
if (arguments.length > 3) {
var G__89633__i = 0, G__89633__a = new Array(arguments.length -  3);
while (G__89633__i < G__89633__a.length) {G__89633__a[G__89633__i] = arguments[G__89633__i + 3]; ++G__89633__i;}
  p__89018 = new cljs.core.IndexedSeq(G__89633__a,0,null);
} 
return G__89625__delegate.call(this,state,config,block,p__89018);};
G__89625.cljs$lang$maxFixedArity = 3;
G__89625.cljs$lang$applyTo = (function (arglist__89635){
var state = cljs.core.first(arglist__89635);
arglist__89635 = cljs.core.next(arglist__89635);
var config = cljs.core.first(arglist__89635);
arglist__89635 = cljs.core.next(arglist__89635);
var block = cljs.core.first(arglist__89635);
var p__89018 = cljs.core.rest(arglist__89635);
return G__89625__delegate(state,config,block,p__89018);
});
G__89625.cljs$core$IFn$_invoke$arity$variadic = G__89625__delegate;
return G__89625;
})()
,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","show-block-left-menu?","frontend.components.block/show-block-left-menu?",-2100125182)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.block","show-block-right-menu?","frontend.components.block/show-block-right-menu?",1504787573)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"should-update","should-update",-1292781795),frontend.components.block.config_block_should_update_QMARK_], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var vec__89020 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89020,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89020,(1),null);
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var linked_block_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"original-block","original-block",1808045862).cljs$core$IFn$_invoke$arity$1(config);
}
})();
if(cljs.core.truth_(new cljs.core.Keyword(null,"property-block?","property-block?",71503268).cljs$core$IFn$_invoke$arity$1(config))){
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.property_QMARK_.call(null,block));
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(frontend.config.publishing_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var collapsed_QMARK__89637 = frontend.state.get_block_collapsed(block_id);
frontend.components.block.set_collapsed_block_BANG_(block_id,(((!((collapsed_QMARK__89637 == null))))?collapsed_QMARK__89637:true));
} else {
if(cljs.core.truth_(frontend.components.block.root_block_QMARK_(config,block))){
frontend.components.block.set_collapsed_block_BANG_(block_id,false);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config);
}
}
})())){
frontend.components.block.set_collapsed_block_BANG_(block_id,cljs.core.boolean$(frontend.handler.editor.block_default_collapsed_QMARK_(block,config)));
} else {

}
}
}
}

var G__89023 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.block","control-show?","frontend.components.block/control-show?",1638613539),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.block","navigating-block","frontend.components.block/navigating-block",1869853175),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = linked_block_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config) == null);
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__89023,new cljs.core.Keyword("frontend.components.block","container-id","frontend.components.block/container-id",569184931),frontend.state.get_next_container_id());
} else {
return G__89023;
}
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var vec__89024_89641 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var config_89642 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89024_89641,(0),null);
var block_89643 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89024_89641,(1),null);
var block_id_89644 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_89643);
if(cljs.core.truth_(frontend.components.block.root_block_QMARK_(config_89642,block_89643))){
frontend.components.block.set_collapsed_block_BANG_(block_id_89644,null);
} else {
}

return state;
})], null)], null),"frontend.components.block/loaded-block-container");
frontend.components.block.block_container = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__89645__delegate = function (config,block_STAR_,p__89027){
var map__89028 = p__89027;
var map__89028__$1 = cljs.core.__destructure_map(map__89028);
var opts = map__89028__$1;
var vec__89029 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(block_STAR_) : logseq.shui.hooks.use_state.call(null,block_STAR_));
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89029,(0),null);
var set_block_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89029,(1),null);
var id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_STAR_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_STAR_);
}
})();
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"page-title?","page-title?",534381078).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config);
}
})())){
} else {
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children?","children?",-1199594108),cljs.core.not((function (){var temp__5806__auto__ = frontend.state.get_block_collapsed(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
if((temp__5806__auto__ == null)){
return new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block);
} else {
var result = temp__5806__auto__;
return result;
}
})()),new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),false], null)], 0))),(function (block__$1){
return promesa.protocols._promise((set_block_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_block_BANG_.cljs$core$IFn$_invoke$arity$1(block__$1) : set_block_BANG_.call(null,block__$1)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);
}

if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}
})())){
return frontend.components.block.loaded_block_container(config,block,opts);
} else {
return null;
}
};
var G__89645 = function (config,block_STAR_,var_args){
var p__89027 = null;
if (arguments.length > 2) {
var G__89649__i = 0, G__89649__a = new Array(arguments.length -  2);
while (G__89649__i < G__89649__a.length) {G__89649__a[G__89649__i] = arguments[G__89649__i + 2]; ++G__89649__i;}
  p__89027 = new cljs.core.IndexedSeq(G__89649__a,0,null);
} 
return G__89645__delegate.call(this,config,block_STAR_,p__89027);};
G__89645.cljs$lang$maxFixedArity = 2;
G__89645.cljs$lang$applyTo = (function (arglist__89650){
var config = cljs.core.first(arglist__89650);
arglist__89650 = cljs.core.next(arglist__89650);
var block_STAR_ = cljs.core.first(arglist__89650);
var p__89027 = cljs.core.rest(arglist__89650);
return G__89645__delegate(config,block_STAR_,p__89027);
});
G__89645.cljs$core$IFn$_invoke$arity$variadic = G__89645__delegate;
return G__89645;
})()
,null,"frontend.components.block/block-container");
frontend.components.block.divide_lists = (function frontend$components$block$divide_lists(p__89032){
var vec__89033 = p__89032;
var seq__89034 = cljs.core.seq(vec__89033);
var first__89035 = cljs.core.first(seq__89034);
var seq__89034__$1 = cljs.core.next(seq__89034);
var f = first__89035;
var l = seq__89034__$1;
var l__$1 = l;
var ordered_QMARK_ = new cljs.core.Keyword(null,"ordered","ordered",1187041426).cljs$core$IFn$_invoke$arity$1(f);
var result = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [f], null)], null);
while(true){
if(cljs.core.seq(l__$1)){
var cur = cljs.core.first(l__$1);
var cur_ordered_QMARK_ = new cljs.core.Keyword(null,"ordered","ordered",1187041426).cljs$core$IFn$_invoke$arity$1(cur);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ordered_QMARK_,cur_ordered_QMARK_)){
var G__89656 = cljs.core.rest(l__$1);
var G__89657 = cur_ordered_QMARK_;
var G__89658 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(result,(cljs.core.count(result) - (1)),cljs.core.conj,cur);
l__$1 = G__89656;
ordered_QMARK_ = G__89657;
result = G__89658;
continue;
} else {
var G__89661 = cljs.core.rest(l__$1);
var G__89662 = cur_ordered_QMARK_;
var G__89663 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cur], null));
l__$1 = G__89661;
ordered_QMARK_ = G__89662;
result = G__89663;
continue;
}
} else {
return result;
}
break;
}
});
frontend.components.block.list_element = (function frontend$components$block$list_element(l){
try{if(((cljs.core.vector_QMARK_(l)) && ((cljs.core.count(l) >= (1))))){
try{var l_left__89037 = cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(l,(0),(1));
if(((cljs.core.vector_QMARK_(l_left__89037)) && ((cljs.core.count(l_left__89037) === (1))))){
var l1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(l_left__89037,(0));
var _tl = cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(l,(1));
var map__89042 = l1;
var map__89042__$1 = cljs.core.__destructure_map(map__89042);
var ordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89042__$1,new cljs.core.Keyword(null,"ordered","ordered",1187041426));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89042__$1,new cljs.core.Keyword(null,"name","name",1843675177));
if(cljs.core.seq(name)){
return new cljs.core.Keyword(null,"dl","dl",-2140151713);
} else {
if(cljs.core.truth_(ordered)){
return new cljs.core.Keyword(null,"ol","ol",932524051);
} else {
return new cljs.core.Keyword(null,"ul","ul",-1349521403);

}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89041){if((e89041 instanceof Error)){
var e__46744__auto__ = e89041;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e89041;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89040){if((e89040 instanceof Error)){
var e__46744__auto__ = e89040;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return new cljs.core.Keyword(null,"ul","ul",-1349521403);
} else {
throw e__46744__auto__;
}
} else {
throw e89040;

}
}});
frontend.components.block.list_item = (function frontend$components$block$list_item(config,p__89043){
var map__89044 = p__89043;
var map__89044__$1 = cljs.core.__destructure_map(map__89044);
var _list = map__89044__$1;
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89044__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89044__$1,new cljs.core.Keyword(null,"content","content",15833224));
var checkbox = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89044__$1,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89044__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var number = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89044__$1,new cljs.core.Keyword(null,"number","number",1570378438));
var content__$1 = ((cljs.core.empty_QMARK_(content))?null:(function (){try{if(((cljs.core.vector_QMARK_(content)) && ((cljs.core.count(content) >= (1))))){
try{var content_left__89046 = cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(content,(0),(1));
if(((cljs.core.vector_QMARK_(content_left__89046)) && ((cljs.core.count(content_left__89046) === (1))))){
try{var content_left__89046_0__89048 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(content_left__89046,(0));
if(((cljs.core.vector_QMARK_(content_left__89046_0__89048)) && ((cljs.core.count(content_left__89046_0__89048) === 2)))){
try{var content_left__89046_0__89048_0__89049 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(content_left__89046_0__89048,(0));
if((content_left__89046_0__89048_0__89049 === "Paragraph")){
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(content_left__89046_0__89048,(1));
var rest_SINGLEQUOTE_ = cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(content,(1));
return frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,i) : frontend.components.block.map_inline.call(null,config,i)),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,rest_SINGLEQUOTE_) : frontend.components.block.markup_elements_cp.call(null,config,rest_SINGLEQUOTE_))], 0));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89054){if((e89054 instanceof Error)){
var e__46744__auto__ = e89054;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e89054;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89053){if((e89053 instanceof Error)){
var e__46744__auto__ = e89053;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e89053;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89052){if((e89052 instanceof Error)){
var e__46744__auto__ = e89052;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e89052;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89051){if((e89051 instanceof Error)){
var e__46744__auto__ = e89051;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return (frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,content) : frontend.components.block.markup_elements_cp.call(null,config,content));
} else {
throw e__46744__auto__;
}
} else {
throw e89051;

}
}})());
var checked_QMARK_ = (!((checkbox == null)));
var items__$1 = ((cljs.core.seq(items))?frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(frontend.components.block.list_element(items),(function (){var iter__5480__auto__ = (function frontend$components$block$list_item_$_iter__89055(s__89056){
return (new cljs.core.LazySeq(null,(function (){
var s__89056__$1 = s__89056;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89056__$1);
if(temp__5804__auto__){
var s__89056__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89056__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89056__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89058 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89057 = (0);
while(true){
if((i__89057 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__89057);
cljs.core.chunk_append(b__89058,(frontend.components.block.list_item.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.list_item.cljs$core$IFn$_invoke$arity$2(config,item) : frontend.components.block.list_item.call(null,config,item)));

var G__89669 = (i__89057 + (1));
i__89057 = G__89669;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89058),frontend$components$block$list_item_$_iter__89055(cljs.core.chunk_rest(s__89056__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89058),null);
}
} else {
var item = cljs.core.first(s__89056__$2);
return cljs.core.cons((frontend.components.block.list_item.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.list_item.cljs$core$IFn$_invoke$arity$2(config,item) : frontend.components.block.list_item.call(null,config,item)),frontend$components$block$list_item_$_iter__89055(cljs.core.rest(s__89056__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
})()):null);
if(cljs.core.seq(name)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl","dl",-2140151713),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt","dt",-368444759),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,name) : frontend.components.block.map_inline.call(null,config,name))], null),frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"dd","dd",-1340437629),frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [items__$1], null)], 0)))], null);
} else {
if((checkbox == null)){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"li","li",723558921),(function (){var G__89059 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_], null);
if(cljs.core.truth_(number)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__89059,new cljs.core.Keyword(null,"value","value",305978217),number);
} else {
return G__89059;
}
})(),frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"p","p",151049309),content__$1)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [items__$1], null)], 0)));
} else {
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_], null),frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"p","p",151049309),frontend.components.block.list_checkbox(config,checkbox),content__$1)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [items__$1], null)], 0)));
}

}
});
frontend.components.block.table = (function frontend$components$block$table(config,p__89061){
var map__89062 = p__89061;
var map__89062__$1 = cljs.core.__destructure_map(map__89062);
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89062__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89062__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var col_groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89062__$1,new cljs.core.Keyword(null,"col_groups","col_groups",409146122));
var tr = (function (elm,cols){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tr","tr",-1424774646),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(elm,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"scope","scope",-439358418),"col",new cljs.core.Keyword(null,"class","class",-2030961996),"org-left"], null),(frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.map_inline.cljs$core$IFn$_invoke$arity$2(config,col) : frontend.components.block.map_inline.call(null,config,col)));
}),cols));
});
var tb_col_groups = (function (){try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (number){
var col_elem = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"col","col",-1959363084),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"org-left"], null)], null);
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"colgroup","colgroup",651118645),cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(number,col_elem));
}),col_groups);
}catch (e89063){var _e = e89063;
return cljs.core.PersistentVector.EMPTY;
}})();
var head = (cljs.core.truth_(header)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"thead","thead",-291875296),tr(new cljs.core.Keyword(null,"th","th",-545608566),header)], null):null);
var groups__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (group){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tbody","tbody",-80678300),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__89060_SHARP_){
return tr(new cljs.core.Keyword(null,"td","td",1479933353),p1__89060_SHARP_);
}),group));
}),groups);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.table-wrapper.classic-table.force-visible-scrollbar.markdown-table","div.table-wrapper.classic-table.force-visible-scrollbar.markdown-table",-1793106373),frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"table","table",-564943036),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"table-auto",new cljs.core.Keyword(null,"border","border",1444987323),(2),new cljs.core.Keyword(null,"cell-spacing","cell-spacing",769666488),(0),new cljs.core.Keyword(null,"cell-padding","cell-padding",978029542),(6),new cljs.core.Keyword(null,"rules","rules",1198912366),"groups",new cljs.core.Keyword(null,"frame","frame",-1711082588),"hsides"], null),frontend.components.block.vec_cat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tb_col_groups,cljs.core.cons(head,groups__$1)], 0)))], null);
});
frontend.components.block.logbook_cp = (function frontend$components$block$logbook_cp(log){
var clocks = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__89064_SHARP_){
return clojure.string.starts_with_QMARK_(p1__89064_SHARP_,"CLOCK:");
}),log);
var clocks__$1 = cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.str,clocks));
if(cljs.core.seq(clocks__$1)){
var tr = (function (elm,cols){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tr","tr",-1424774646),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(elm,col);
}),cols));
});
var head = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"thead.overflow-x-scroll","thead.overflow-x-scroll",-1443349947),tr(new cljs.core.Keyword(null,"th.py-0","th.py-0",-1646316549),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Type","Start","End","Span"], null))], null);
var clock_tbody = frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tbody.overflow-scroll.sm:overflow-auto","tbody.overflow-scroll.sm:overflow-auto",-1641803105),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (clock){
var cols = cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,clojure.string.split.cljs$core$IFn$_invoke$arity$2(clock,/: |--|=>/));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__89065_SHARP_){
return tr(new cljs.core.Keyword(null,"td.py-0","td.py-0",822181071),p1__89065_SHARP_);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cols], null));
}),clocks__$1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.overflow-x-scroll.sm:overflow-auto","div.overflow-x-scroll.sm:overflow-auto",-2014695040),frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"table.m-0","table.m-0",617884663),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"logbook-table",new cljs.core.Keyword(null,"border","border",1444987323),(0),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"width","width",-384071477),"max-content"], null),new cljs.core.Keyword(null,"cell-spacing","cell-spacing",769666488),(15)], null),cljs.core.cons(head,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clock_tbody], null)))], null);
} else {
return null;
}
});
frontend.components.block.map_inline = (function frontend$components$block$map_inline(config,col){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__89066_SHARP_){
return frontend.components.block.inline(config,p1__89066_SHARP_);
}),col);
});
frontend.components.block.inline_title = rum.core.lazy_build(rum.core.build_defc,(function (title){
return daiquiri.interpreter.interpret(frontend.components.block.map_inline(cljs.core.PersistentArrayMap.EMPTY,logseq.graph_parser.mldoc.inline__GT_edn(title,frontend.format.mldoc.get_default_config(new cljs.core.Keyword(null,"markdown","markdown",1227225089)))));
}),null,"frontend.components.block/inline-title");
frontend.components.block.get_code_mode_by_lang = (function frontend$components$block$get_code_mode_by_lang(lang){
return cljs.core.some((function (m){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(m.name,lang)){
return m.mode;
} else {
return null;
}
}),window.CodeMirror.modeInfo);
});
frontend.components.block.src_lang_picker = rum.core.lazy_build(rum.core.build_defc,(function (block,on_select_BANG_){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return m.name;
}),window.CodeMirror.modeInfo);
if(cljs.core.truth_(temp__5804__auto__)){
var langs = temp__5804__auto__;
var options = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (lang){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),lang,new cljs.core.Keyword(null,"value","value",305978217),lang], null);
}),langs);
return frontend.components.select.select(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),options,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),"Choose language",new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (chosen,_,___$1,e){
var lang_89680 = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(chosen);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(lang_89680,new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165).cljs$core$IFn$_invoke$arity$1(block))))){
(on_select_BANG_.cljs$core$IFn$_invoke$arity$2 ? on_select_BANG_.cljs$core$IFn$_invoke$arity$2(lang_89680,e) : on_select_BANG_.call(null,lang_89680,e));
} else {
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null));
} else {
return null;
}
})());
}),null,"frontend.components.block/src-lang-picker");
frontend.components.block.src_cp = rum.core.lazy_build(rum.core.build_defc,(function (config,options){
var block = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"code-block","code-block",-2113425141).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config);
}
})();
var container_id = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config);
var _STAR_mode_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_actions_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
if(cljs.core.truth_(options)){
var html_export_QMARK_ = new cljs.core.Keyword(null,"html-export?","html-export?",504770426).cljs$core$IFn$_invoke$arity$1(config);
var map__89067 = options;
var map__89067__$1 = cljs.core.__destructure_map(map__89067);
var lines = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89067__$1,new cljs.core.Keyword(null,"lines","lines",-700165781));
var language = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89067__$1,new cljs.core.Keyword(null,"language","language",-1591107564));
var attr = (cljs.core.truth_(language)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),language], null):null);
var code = (cljs.core.truth_(lines)?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,lines):new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
var vec__89068 = rum.core.use_state(null);
var inside_portal_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89068,(0),null);
var set_inside_portal_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89068,(1),null);
if(cljs.core.truth_(html_export_QMARK_)){
return daiquiri.interpreter.interpret(frontend.extensions.highlight.html_export(attr,code));
} else {
var language__$1 = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, ["cljc",null,"cljs",null,"clj",null,"edn",null,"clojurescript",null], null), null),language))?"clojure":language);
return daiquiri.core.create_element("div",{'ref':(function (el){
var G__89071 = (function (){var and__5000__auto__ = el;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.whiteboard.inside_portal_QMARK_(el);
} else {
return and__5000__auto__;
}
})();
return (set_inside_portal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_inside_portal_QMARK_.cljs$core$IFn$_invoke$arity$1(G__89071) : set_inside_portal_QMARK_.call(null,G__89071));
}),'onMouseOver':(function (){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2((logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_actions_ref) : logseq.shui.hooks.deref.call(null,_STAR_actions_ref)),"!opacity-100");
}),'onMouseLeave':(function (e){
if(dommy.core.has_class_QMARK_(e.target,"code-editor")){
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2((logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_actions_ref) : logseq.shui.hooks.deref.call(null,_STAR_actions_ref)),"!opacity-100");
} else {
return null;
}
}),'className':"ui-fenced-code-editor flex w-full"},[(((inside_portal_QMARK_ == null))?null:(cljs.core.truth_(inside_portal_QMARK_)?frontend.extensions.highlight.highlight(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),["language-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(language__$1)].join(''),new cljs.core.Keyword(null,"data-lang","data-lang",969460304),language__$1], null),code):daiquiri.core.create_element("div",{'className':"ls-code-editor-wrap"},[daiquiri.core.create_element("div",{'ref':_STAR_actions_ref,'className':"code-block-actions"},[daiquiri.interpreter.interpret((function (){var G__89078 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"select-language",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_mode_ref,new cljs.core.Keyword(null,"containerid","containerid",-1132769612),cljs.core.str.cljs$core$IFn$_invoke$arity$1(container_id),new cljs.core.Keyword(null,"blockid","blockid",-664467760),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

var target = e.target;
var G__89081 = target;
var G__89082 = (function (){
return frontend.components.block.src_lang_picker(block,(function (lang,_e){
var temp__5804__auto__ = frontend.util.get_cm_instance(frontend.util.rec_get_node(target,"ls-block"));
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
var temp__5802__auto___89694 = frontend.components.block.get_code_mode_by_lang(lang);
if(cljs.core.truth_(temp__5802__auto___89694)){
var mode_89695 = temp__5802__auto___89694;
cm.setOption("mode",mode_89695);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("code mode not found",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"lang","lang",-1819677104),lang], null));
}

frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328),lang) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328),lang))], null));

return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),lang);
} else {
return null;
}
}));
});
var G__89083 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__89081,G__89082,G__89083) : logseq.shui.ui.popup_show_BANG_.call(null,G__89081,G__89082,G__89083));
})], null);
var G__89079 = (function (){var or__5002__auto__ = language__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Choose language";
}
})();
var G__89080 = frontend.ui.icon("chevron-down");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__89078,G__89079,G__89080) : logseq.shui.ui.button.call(null,G__89078,G__89079,G__89080));
})()),daiquiri.interpreter.interpret((function (){var G__89088 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

var temp__5804__auto__ = frontend.util.get_cm_instance(frontend.util.rec_get_node(e.target,"ls-block"));
if(cljs.core.truth_(temp__5804__auto__)){
var cm = temp__5804__auto__;
frontend.util.copy_to_clipboard_BANG_(cm.getValue());

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied!",new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;
}
})], null);
var G__89089 = frontend.ui.icon("copy");
var G__89090 = "Copy";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__89088,G__89089,G__89090) : logseq.shui.ui.button.call(null,G__89088,G__89089,G__89090));
})())]),frontend.components.lazy_editor.editor(config,cljs.core.str.cljs$core$IFn$_invoke$arity$1((datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))),attr,code,options),(function (){var options__$1 = new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(options);
var block__$1 = new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(language__$1,"clojure")) && (cljs.core.contains_QMARK_(cljs.core.set(options__$1),":results")))){
return daiquiri.interpreter.interpret(frontend.extensions.sci.eval_result(code,block__$1));
} else {
return null;
}
})()])
))]);

}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.block/src-cp");
frontend.components.block.markup_element_cp = (function frontend$components$block$markup_element_cp(p__89093,item){
var map__89094 = p__89093;
var map__89094__$1 = cljs.core.__destructure_map(map__89094);
var config = map__89094__$1;
var html_export_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89094__$1,new cljs.core.Keyword(null,"html-export?","html-export?",504770426));
try{try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 3)))){
try{var item_0__89097 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89097 === "Drawer")){
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var lines = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(name,"logbook");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"logbook");
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.state.enable_timetracking_QMARK_();
if(and__5000__auto____$1){
var or__5002__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logbook","settings","logbook/settings",824968896),new cljs.core.Keyword(null,"enabled-in-all-blocks","enabled-in-all-blocks",198719485)], null));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logbook","settings","logbook/settings",824968896),new cljs.core.Keyword(null,"enabled-in-timestamped-blocks","enabled-in-timestamped-blocks",-1770816511)], null),true))){
var or__5002__auto____$2 = new cljs.core.Keyword("block","scheduled","block/scheduled",584810412).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config));
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword("block","deadline","block/deadline",660945231).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config));
}
} else {
return null;
}
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.drawer","div.drawer",757685167),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-drawer-name","data-drawer-name",532418125),name], null),frontend.ui.foldable(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50.font-medium.logbook","div.opacity-50.font-medium.logbook",-155596154),(function (){var G__89199 = ":%s:";
var G__89200 = clojure.string.upper_case(name);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__89199,G__89200) : frontend.util.format.call(null,G__89199,G__89200));
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.opacity-50.font-medium","div.opacity-50.font-medium",-1010985565),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"logbook"))?frontend.components.block.logbook_cp(lines):cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,lines)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),":END:"], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),true,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null))], null)], null)], null);
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89197){if((e89197 instanceof Error)){
var e__46744__auto__ = e89197;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{var item_0__89097 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89097 === "Directive")){
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-level-property","div.file-level-property",1092497644),((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["caption",null], null), null),clojure.string.lower_case(key)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-bold","span.font-bold",-460884588),clojure.string.upper_case(key)], null),[": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('')], null):null)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89198){if((e89198 instanceof Error)){
var e__46744__auto____$1 = e89198;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e89198;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e89197;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89133){if((e89133 instanceof Error)){
var e__46744__auto__ = e89133;
if((e__46744__auto__ === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89100 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89100 === "Paragraph")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(cljs.core.truth_((function (){var G__89195 = /\"Export_Snippet\" \"embed\"/;
var G__89196 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(l);
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__89195,G__89196) : frontend.util.safe_re_find.call(null,G__89195,G__89196));
})())){
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.map_inline(config,l));
} else {
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"div.is-paragraph","div.is-paragraph",1619857502),frontend.components.block.map_inline(config,l));
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89194){if((e89194 instanceof Error)){
var e__46744__auto____$1 = e89194;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$1;
}
} else {
throw e89194;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89134){if((e89134 instanceof Error)){
var e__46744__auto____$1 = e89134;
if((e__46744__auto____$1 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 1)))){
try{var item_0__89102 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89102 === "Horizontal_Rule")){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89193){if((e89193 instanceof Error)){
var e__46744__auto____$2 = e89193;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$2;
}
} else {
throw e89193;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89135){if((e89135 instanceof Error)){
var e__46744__auto____$2 = e89135;
if((e__46744__auto____$2 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Heading")){
var h = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.block_container(config,h);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89178){if((e89178 instanceof Error)){
var e__46744__auto____$3 = e89178;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "List")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var lists = frontend.components.block.divide_lists(l);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(lists))){
var l__$1 = cljs.core.first(lists);
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(frontend.components.block.list_element(l__$1),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__89091_SHARP_){
return frontend.components.block.list_item(config,p1__89091_SHARP_);
}),l__$1));
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.list-group","div.list-group",1215632197),(function (){var iter__5480__auto__ = (function frontend$components$block$markup_element_cp_$_iter__89188(s__89189){
return (new cljs.core.LazySeq(null,(function (){
var s__89189__$1 = s__89189;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89189__$1);
if(temp__5804__auto__){
var s__89189__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89189__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89189__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89191 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89190 = (0);
while(true){
if((i__89190 < size__5479__auto__)){
var l__$1 = cljs.core._nth(c__5478__auto__,i__89190);
cljs.core.chunk_append(b__89191,frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(frontend.components.block.list_element(l__$1),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__89190,l__$1,c__5478__auto__,size__5479__auto__,b__89191,s__89189__$2,temp__5804__auto__,lists,l,item_0__89103,e__46744__auto____$3,e__46744__auto____$2,e__46744__auto____$1,e__46744__auto__,map__89094,map__89094__$1,config,html_export_QMARK_){
return (function (p1__89092_SHARP_){
return frontend.components.block.list_item(config,p1__89092_SHARP_);
});})(i__89190,l__$1,c__5478__auto__,size__5479__auto__,b__89191,s__89189__$2,temp__5804__auto__,lists,l,item_0__89103,e__46744__auto____$3,e__46744__auto____$2,e__46744__auto____$1,e__46744__auto__,map__89094,map__89094__$1,config,html_export_QMARK_))
,l__$1)));

var G__89713 = (i__89190 + (1));
i__89190 = G__89713;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89191),frontend$components$block$markup_element_cp_$_iter__89188(cljs.core.chunk_rest(s__89189__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89191),null);
}
} else {
var l__$1 = cljs.core.first(s__89189__$2);
return cljs.core.cons(frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(frontend.components.block.list_element(l__$1),cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (l__$1,s__89189__$2,temp__5804__auto__,lists,l,item_0__89103,e__46744__auto____$3,e__46744__auto____$2,e__46744__auto____$1,e__46744__auto__,map__89094,map__89094__$1,config,html_export_QMARK_){
return (function (p1__89092_SHARP_){
return frontend.components.block.list_item(config,p1__89092_SHARP_);
});})(l__$1,s__89189__$2,temp__5804__auto__,lists,l,item_0__89103,e__46744__auto____$3,e__46744__auto____$2,e__46744__auto____$1,e__46744__auto__,map__89094,map__89094__$1,config,html_export_QMARK_))
,l__$1)),frontend$components$block$markup_element_cp_$_iter__89188(cljs.core.rest(s__89189__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(lists);
})()], null);
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89179){if((e89179 instanceof Error)){
var e__46744__auto____$4 = e89179;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Table")){
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.components.block.table(config,t);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89180){if((e89180 instanceof Error)){
var e__46744__auto____$5 = e89180;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Math")){
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(cljs.core.truth_(html_export_QMARK_)){
return frontend.extensions.latex.html_export(s,true,true);
} else {
return frontend.extensions.latex.latex(s,true,true);
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89181){if((e89181 instanceof Error)){
var e__46744__auto____$6 = e89181;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Example")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.pre-wrap-white-space","pre.pre-wrap-white-space",-614870903),frontend.components.block.join_lines(l)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89182){if((e89182 instanceof Error)){
var e__46744__auto____$7 = e89182;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Quote")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"#+BEGIN_QUOTE is deprecated. Use '/Quote' command instead."], null);
} else {
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"blockquote","blockquote",372264190),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,l) : frontend.components.block.markup_elements_cp.call(null,config,l)));
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89183){if((e89183 instanceof Error)){
var e__46744__auto____$8 = e89183;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
try{var item_0__89103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89103 === "Raw_Html")){
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(cljs.core.not(html_export_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.raw_html","div.raw_html",-267032220),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.security.sanitize_html(content)], null)], null)], null);
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89184){if((e89184 instanceof Error)){
var e__46744__auto____$9 = e89184;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$9;
}
} else {
throw e89184;

}
}} else {
throw e__46744__auto____$8;
}
} else {
throw e89183;

}
}} else {
throw e__46744__auto____$7;
}
} else {
throw e89182;

}
}} else {
throw e__46744__auto____$6;
}
} else {
throw e89181;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e89180;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e89179;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e89178;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89136){if((e89136 instanceof Error)){
var e__46744__auto____$3 = e89136;
if((e__46744__auto____$3 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 4)))){
try{var item_0__89105 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89105 === "Export")){
try{var item_1__89106 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89106 === "html")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
if(cljs.core.not(html_export_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.export_html","div.export_html",950208651),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.security.sanitize_html(content)], null)], null)], null);
} else {
return null;
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89177){if((e89177 instanceof Error)){
var e__46744__auto____$4 = e89177;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$4;
}
} else {
throw e89177;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89176){if((e89176 instanceof Error)){
var e__46744__auto____$4 = e89176;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$4;
}
} else {
throw e89176;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89137){if((e89137 instanceof Error)){
var e__46744__auto____$4 = e89137;
if((e__46744__auto____$4 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89109 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89109 === "Hiccup")){
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return frontend.ui.catch_error(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid hiccup"], null),content], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.hiccup_html","div.hiccup_html",422613892),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.components.block.hiccup__GT_html(content)], null)], null)], null));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89175){if((e89175 instanceof Error)){
var e__46744__auto____$5 = e89175;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$5;
}
} else {
throw e89175;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89138){if((e89138 instanceof Error)){
var e__46744__auto____$5 = e89138;
if((e__46744__auto____$5 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 4)))){
try{var item_0__89111 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89111 === "Export")){
try{var item_1__89112 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89112 === "latex")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
if(cljs.core.truth_(html_export_QMARK_)){
return frontend.extensions.latex.html_export(content,true,false);
} else {
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"'#+BEGIN_EXPORT latex' is deprecated. Use '/Math block' command instead."], null);
} else {
return frontend.extensions.latex.latex(content,true,false);
}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89170){if((e89170 instanceof Error)){
var e__46744__auto____$6 = e89170;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$6;
}
} else {
throw e89170;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89169){if((e89169 instanceof Error)){
var e__46744__auto____$6 = e89169;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$6;
}
} else {
throw e89169;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89139){if((e89139 instanceof Error)){
var e__46744__auto____$6 = e89139;
if((e__46744__auto____$6 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 5)))){
try{var item_0__89115 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89115 === "Custom")){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "query")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var _result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"#+BEGIN_QUERY is deprecated. Use '/Advanced Query' command instead."], null);
} else {
try{var query = logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(content);
return frontend.components.query.custom_query(frontend.components.block.wrap_query_components(config),query);
}catch (e89168){var e = e89168;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.block",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"read-string-error","read-string-error",-337329605),e,new cljs.core.Keyword(null,"line","line",212345235),4223], null)),null);

return frontend.ui.block_error("Invalid query:",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),content], null));
}}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89160){if((e89160 instanceof Error)){
var e__46744__auto____$7 = e89160;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "note")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("note",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89161){if((e89161 instanceof Error)){
var e__46744__auto____$8 = e89161;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "tip")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("tip",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89162){if((e89162 instanceof Error)){
var e__46744__auto____$9 = e89162;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "important")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("important",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89163){if((e89163 instanceof Error)){
var e__46744__auto____$10 = e89163;
if((e__46744__auto____$10 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "caution")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("caution",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89164){if((e89164 instanceof Error)){
var e__46744__auto____$11 = e89164;
if((e__46744__auto____$11 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "warning")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("warning",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89165){if((e89165 instanceof Error)){
var e__46744__auto____$12 = e89165;
if((e__46744__auto____$12 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "pinned")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.ui.admonition("pinned",(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,result) : frontend.components.block.markup_elements_cp.call(null,config,result)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89166){if((e89166 instanceof Error)){
var e__46744__auto____$13 = e89166;
if((e__46744__auto____$13 === cljs.core.match.backtrack)){
try{var item_1__89116 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if((item_1__89116 === "center")){
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"div.text-center","div.text-center",921869624),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,l) : frontend.components.block.markup_elements_cp.call(null,config,l)));
} else {
throw cljs.core.match.backtrack;

}
}catch (e89167){if((e89167 instanceof Error)){
var e__46744__auto____$14 = e89167;
if((e__46744__auto____$14 === cljs.core.match.backtrack)){
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var _options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var _content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(4));
return frontend.components.block.__GT_elem.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),name], null),(frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_elements_cp.cljs$core$IFn$_invoke$arity$2(config,l) : frontend.components.block.markup_elements_cp.call(null,config,l)));
} else {
throw e__46744__auto____$14;
}
} else {
throw e89167;

}
}} else {
throw e__46744__auto____$13;
}
} else {
throw e89166;

}
}} else {
throw e__46744__auto____$12;
}
} else {
throw e89165;

}
}} else {
throw e__46744__auto____$11;
}
} else {
throw e89164;

}
}} else {
throw e__46744__auto____$10;
}
} else {
throw e89163;

}
}} else {
throw e__46744__auto____$9;
}
} else {
throw e89162;

}
}} else {
throw e__46744__auto____$8;
}
} else {
throw e89161;

}
}} else {
throw e__46744__auto____$7;
}
} else {
throw e89160;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89159){if((e89159 instanceof Error)){
var e__46744__auto____$7 = e89159;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$7;
}
} else {
throw e89159;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89140){if((e89140 instanceof Error)){
var e__46744__auto____$7 = e89140;
if((e__46744__auto____$7 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89120 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89120 === "Latex_Fragment")){
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.latex-fragment","p.latex-fragment",2044866246),frontend.components.block.inline(config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Latex_Fragment",l], null))], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89158){if((e89158 instanceof Error)){
var e__46744__auto____$8 = e89158;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$8;
}
} else {
throw e89158;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89141){if((e89141 instanceof Error)){
var e__46744__auto____$8 = e89141;
if((e__46744__auto____$8 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 4)))){
try{var item_0__89122 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89122 === "Latex_Environment")){
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var option = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(3));
var content__$1 = frontend.components.block.latex_environment_content(name,option,content);
if(cljs.core.truth_(html_export_QMARK_)){
return frontend.extensions.latex.html_export(content__$1,true,true);
} else {
return frontend.extensions.latex.latex(content__$1,true,true);
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89151){if((e89151 instanceof Error)){
var e__46744__auto____$9 = e89151;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$9;
}
} else {
throw e89151;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89142){if((e89142 instanceof Error)){
var e__46744__auto____$9 = e89142;
if((e__46744__auto____$9 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89126 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89126 === "Displayed_Math")){
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
if(cljs.core.truth_(html_export_QMARK_)){
return frontend.extensions.latex.html_export(content,true,true);
} else {
return frontend.extensions.latex.latex(content,true,true);
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e89150){if((e89150 instanceof Error)){
var e__46744__auto____$10 = e89150;
if((e__46744__auto____$10 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$10;
}
} else {
throw e89150;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89143){if((e89143 instanceof Error)){
var e__46744__auto____$10 = e89143;
if((e__46744__auto____$10 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 3)))){
try{var item_0__89128 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89128 === "Footnote_Definition")){
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var definition = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(2));
var id = frontend.util.url_encode(name);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.footdef","div.footdef",1989065599),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.footpara","div.footpara",-1143244552),cljs.core.conj.cljs$core$IFn$_invoke$arity$2((function (){var G__89148 = config;
var G__89149 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",definition], null);
return (frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2 ? frontend.components.block.markup_element_cp.cljs$core$IFn$_invoke$arity$2(G__89148,G__89149) : frontend.components.block.markup_element_cp.call(null,G__89148,G__89149));
})(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.ml-1","a.ml-1",1979802547),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),["fn.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(14)], null),new cljs.core.Keyword(null,"class","class",-2030961996),"footnum",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.jump_to_anchor_BANG_(["fnr.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''));
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup.fn","sup.fn",403400163),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"\u21A9\uFE0E"].join('')], null)], null))], null)], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89147){if((e89147 instanceof Error)){
var e__46744__auto____$11 = e89147;
if((e__46744__auto____$11 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$11;
}
} else {
throw e89147;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89144){if((e89144 instanceof Error)){
var e__46744__auto____$11 = e89144;
if((e__46744__auto____$11 === cljs.core.match.backtrack)){
try{if(((cljs.core.vector_QMARK_(item)) && ((cljs.core.count(item) === 2)))){
try{var item_0__89131 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(0));
if((item_0__89131 === "Src")){
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(item,(1));
var lang = frontend.util.safe_lower_case(new cljs.core.Keyword(null,"language","language",-1591107564).cljs$core$IFn$_invoke$arity$1(options));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.cp__fenced-code-block","div.cp__fenced-code-block",-1897501160),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),lang], null),(function (){var temp__5802__auto__ = (frontend.handler.plugin.hook_fenced_code_by_lang.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.plugin.hook_fenced_code_by_lang.cljs$core$IFn$_invoke$arity$1(lang) : frontend.handler.plugin.hook_fenced_code_by_lang.call(null,lang));
if(cljs.core.truth_(temp__5802__auto__)){
var opts = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui-fenced-code-wrap","div.ui-fenced-code-wrap",1049851534),frontend.components.block.src_cp(config,options),frontend.components.plugins.hook_ui_fenced_code(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config),clojure.string.join.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword(null,"lines","lines",-700165781).cljs$core$IFn$_invoke$arity$1(options)),opts)], null);
} else {
return frontend.components.block.src_cp(config,options);
}
})()], null);
} else {
throw cljs.core.match.backtrack;

}
}catch (e89146){if((e89146 instanceof Error)){
var e__46744__auto____$12 = e89146;
if((e__46744__auto____$12 === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto____$12;
}
} else {
throw e89146;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e89145){if((e89145 instanceof Error)){
var e__46744__auto____$12 = e89145;
if((e__46744__auto____$12 === cljs.core.match.backtrack)){
return "";
} else {
throw e__46744__auto____$12;
}
} else {
throw e89145;

}
}} else {
throw e__46744__auto____$11;
}
} else {
throw e89144;

}
}} else {
throw e__46744__auto____$10;
}
} else {
throw e89143;

}
}} else {
throw e__46744__auto____$9;
}
} else {
throw e89142;

}
}} else {
throw e__46744__auto____$8;
}
} else {
throw e89141;

}
}} else {
throw e__46744__auto____$7;
}
} else {
throw e89140;

}
}} else {
throw e__46744__auto____$6;
}
} else {
throw e89139;

}
}} else {
throw e__46744__auto____$5;
}
} else {
throw e89138;

}
}} else {
throw e__46744__auto____$4;
}
} else {
throw e89137;

}
}} else {
throw e__46744__auto____$3;
}
} else {
throw e89136;

}
}} else {
throw e__46744__auto____$2;
}
} else {
throw e89135;

}
}} else {
throw e__46744__auto____$1;
}
} else {
throw e89134;

}
}} else {
throw e__46744__auto__;
}
} else {
throw e89133;

}
}}catch (e89095){var e = e89095;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Convert to html failed, error: ",e], 0));

return "";
}});
frontend.components.block.markup_elements_cp = (function frontend$components$block$markup_elements_cp(config,col){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__89201_SHARP_){
return frontend.components.block.markup_element_cp(config,p1__89201_SHARP_);
}),col);
});
frontend.components.block.block_item = rum.core.lazy_build(rum.core.build_defc,(function (config,item,p__89202){
var map__89203 = p__89202;
var map__89203__$1 = cljs.core.__destructure_map(map__89203);
var top_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89203__$1,new cljs.core.Keyword(null,"top?","top?",-1883283796));
var bottom_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89203__$1,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628));
var original_block = item;
var linked_block = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(item);
var loop_linked_QMARK_ = (function (){var and__5000__auto__ = linked_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"links","links",-654507394).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(linked_block));
} else {
return and__5000__auto__;
}
})();
var config__$1 = (cljs.core.truth_(linked_block)?cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"original-block","original-block",1808045862),original_block),new cljs.core.Keyword(null,"links","links",-654507394),(function (ids){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = ids;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentHashSet.EMPTY;
}
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(linked_block));
})):config);
var item__$1 = (function (){var or__5002__auto__ = (cljs.core.truth_(loop_linked_QMARK_)?item:linked_block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return item;
}
})();
var item__$2 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(item__$1,new cljs.core.Keyword("block","meta","block/meta",1064819153));
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item__$2),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"loop-linked?","loop-linked?",-595769994),loop_linked_QMARK_], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = loop_linked_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(linked_block);
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return rum.core.with_key(frontend.components.block.block_container(config_SINGLEQUOTE_,item__$2,((cljs.core.not(new cljs.core.Keyword(null,"block-children?","block-children?",-2080380608).cljs$core$IFn$_invoke$arity$1(config__$1)))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top?","top?",-1883283796),top_QMARK_,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628),bottom_QMARK_], null):null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item__$2)),(cljs.core.truth_(linked_block)?["-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(original_block))].join(''):null)].join(''));
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"should-update","should-update",-1292781795),frontend.components.block.config_block_should_update_QMARK_], null)], null),"frontend.components.block/block-item");
frontend.components.block.block_list = rum.core.lazy_build(rum.core.build_defc,(function (config,blocks){
var vec__89205 = rum.core.use_state(((cljs.core.not(new cljs.core.Keyword(null,"block-children?","block-children?",-2080380608).cljs$core$IFn$_invoke$arity$1(config))) && ((cljs.core.count(blocks) >= (50)))));
var virtualized_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89205,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89205,(1),null);
var render_item = (function (idx){
var top_QMARK_ = (idx === (0));
var bottom_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((cljs.core.count(blocks) - (1)),idx);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,idx);
return frontend.components.block.block_item(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top?","top?",-1883283796),top_QMARK_),block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top?","top?",-1883283796),top_QMARK_,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628),bottom_QMARK_], null));
});
var virtualized_QMARK___$1 = (function (){var and__5000__auto__ = virtualized_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks);
} else {
return and__5000__auto__;
}
})();
var _STAR_virtualized_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var virtual_opts = (cljs.core.truth_(virtualized_QMARK___$1)?new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_virtualized_ref,new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"scroll-container","scroll-container",-1938238550).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
}
})(),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,idx);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))].join('');
}),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),(254),new cljs.core.Keyword(null,"overscan","overscan",309782420),(254),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(blocks),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
var top_QMARK_ = (idx === (0));
var bottom_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((cljs.core.count(blocks) - (1)),idx);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,idx);
return frontend.components.block.block_item(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top?","top?",-1883283796),top_QMARK_),block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top?","top?",-1883283796),top_QMARK_,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628),bottom_QMARK_], null));
})], null):null);
var _STAR_wrap_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(virtualized_QMARK___$1)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079).cljs$core$IFn$_invoke$arity$1(config))){
var ref_89744 = _STAR_virtualized_ref.current;
frontend.handler.ui.scroll_to_anchor_block(ref_89744,blocks,false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","virtualized-scroll-fn","editor/virtualized-scroll-fn",-343790237),(function (){
return frontend.handler.ui.scroll_to_anchor_block(ref_89744,blocks,false);
}));
} else {
}

var _STAR_ob = cljs.core.volatile_BANG_(null);
setTimeout((function (){
var temp__5804__auto__ = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_virtualized_ref) : logseq.shui.hooks.deref.call(null,_STAR_virtualized_ref));
if(cljs.core.truth_(temp__5804__auto__)){
var _inst = temp__5804__auto__;
var temp__5804__auto____$1 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_wrap_ref) : logseq.shui.hooks.deref.call(null,_STAR_wrap_ref)).firstElementChild;
if(cljs.core.truth_(temp__5804__auto____$1)){
var target = temp__5804__auto____$1;
var set_wrap_h_BANG_ = (function (p1__89204_SHARP_){
var temp__5804__auto____$2 = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_wrap_ref) : logseq.shui.hooks.deref.call(null,_STAR_wrap_ref));
if(cljs.core.truth_(temp__5804__auto____$2)){
var ref = temp__5804__auto____$2;
return (ref.style.height = p1__89204_SHARP_);
} else {
return null;
}
});
var set_wrap_h_BANG___$1 = goog.functions.debounce(set_wrap_h_BANG_,(16));
var ob = (new ResizeObserver((function (){
var temp__5804__auto____$2 = (function (){var and__5000__auto__ = (logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.deref.cljs$core$IFn$_invoke$arity$1(_STAR_wrap_ref) : logseq.shui.hooks.deref.call(null,_STAR_wrap_ref));
if(cljs.core.truth_(and__5000__auto__)){
return target.style.height;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$2)){
var h = temp__5804__auto____$2;
return (set_wrap_h_BANG___$1.cljs$core$IFn$_invoke$arity$1 ? set_wrap_h_BANG___$1.cljs$core$IFn$_invoke$arity$1(h) : set_wrap_h_BANG___$1.call(null,h));
} else {
return null;
}
})));
ob.observe(target);

return cljs.core.vreset_BANG_(_STAR_ob,ob);
} else {
return null;
}
} else {
return null;
}
}));

return (function (){
var G__89208 = cljs.core.deref(_STAR_ob);
if((G__89208 == null)){
return null;
} else {
return G__89208.disconnect();
}
});
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'data-level':(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})(),'ref':_STAR_wrap_ref,'className':"blocks-list-wrap"},[(cljs.core.truth_(virtualized_QMARK___$1)?daiquiri.interpreter.interpret((frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(virtual_opts) : frontend.ui.virtualized_list.call(null,virtual_opts))):daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,block){
return rum.core.with_key(render_item(idx),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))].join(''));
}),blocks))
)]);
}),null,"frontend.components.block/block-list");
frontend.components.block.blocks_container = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,blocks){
var doc_mode_QMARK_ = new cljs.core.Keyword("document","mode?","document/mode?",-994203479).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.seq(blocks)){
return daiquiri.core.create_element("div",{'containerid':new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["blocks-container","flex-1",(cljs.core.truth_(doc_mode_QMARK_)?"document-mode":null)], null))},[frontend.components.block.block_list(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state)),blocks)]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.mixins.container_id,rum.core.static$], null),"frontend.components.block/blocks-container");
frontend.components.block.breadcrumb_with_container = rum.core.lazy_build(rum.core.build_defcs,(function (state,blocks,config){
var _STAR_navigating_block = new cljs.core.Keyword("frontend.components.block","navigating-block","frontend.components.block/navigating-block",1869853175).cljs$core$IFn$_invoke$arity$1(state);
var navigating_block = rum.core.react(_STAR_navigating_block);
var navigating_block_entity = (function (){var G__89210 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),navigating_block], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89210) : frontend.db.entity.call(null,G__89210));
})();
var navigated_QMARK_ = (function (){var and__5000__auto__ = navigating_block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.components.block","initial-block","frontend.components.block/initial-block",-2107784601).cljs$core$IFn$_invoke$arity$1(state))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(navigating_block_entity)));
} else {
return and__5000__auto__;
}
})();
var blocks__$1 = (cljs.core.truth_(navigated_QMARK_)?(function (){var block = navigating_block_entity;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.db.model.sub_block(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))], null);
})():blocks);
var attrs89209 = (cljs.core.truth_(new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369).cljs$core$IFn$_invoke$arity$1(config))?frontend.components.block.breadcrumb(config,frontend.state.get_current_repo(),(function (){var or__5002__auto__ = navigating_block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks__$1));
}
})(),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false,new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),_STAR_navigating_block,new cljs.core.Keyword(null,"indent?","indent?",1381429379),true], null)):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs89209))?daiquiri.interpreter.element_attributes(attrs89209):null),((cljs.core.map_QMARK_(attrs89209))?[(function (){var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),_STAR_navigating_block,new cljs.core.Keyword(null,"navigated?","navigated?",359191896),navigated_QMARK_], 0));
return frontend.components.block.blocks_container(config_SINGLEQUOTE_,blocks__$1);
})()]:[daiquiri.interpreter.interpret(attrs89209),(function (){var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"breadcrumb-show?","breadcrumb-show?",-869903369),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"navigating-block","navigating-block",-576280122),_STAR_navigating_block,new cljs.core.Keyword(null,"navigated?","navigated?",359191896),navigated_QMARK_], 0));
return frontend.components.block.blocks_container(config_SINGLEQUOTE_,blocks__$1);
})()]));
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var first_block = cljs.core.ffirst(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.block","initial-block","frontend.components.block/initial-block",-2107784601),first_block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.block","navigating-block","frontend.components.block/navigating-block",1869853175),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(first_block))], 0));
})], null)], null),"frontend.components.block/breadcrumb-with-container");
frontend.components.block.ref_block_container = rum.core.lazy_build(rum.core.build_defc,(function (config,p__89211){
var vec__89212 = p__89211;
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89212,(0),null);
var page_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89212,(1),null);
var alias_QMARK_ = new cljs.core.Keyword("block","alias?","block/alias?",-551896044).cljs$core$IFn$_invoke$arity$1(page);
var page__$1 = (function (){var G__89215 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89215) : frontend.db.entity.call(null,G__89215));
})();
var parent_blocks = cljs.core.group_by(new cljs.core.Keyword("block","parent","block/parent",-918309064),page_blocks);
return daiquiri.core.create_element("div",{'key':["page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1))].join(''),'className':"my-2 references-blocks-item"},[(function (){var items = (function (){var iter__5480__auto__ = (function frontend$components$block$iter__89216(s__89217){
return (new cljs.core.LazySeq(null,(function (){
var s__89217__$1 = s__89217;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89217__$1);
if(temp__5804__auto__){
var s__89217__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89217__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89217__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89219 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89218 = (0);
while(true){
if((i__89218 < size__5479__auto__)){
var vec__89220 = cljs.core._nth(c__5478__auto__,i__89218);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89220,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89220,(1),null);
cljs.core.chunk_append(b__89219,(function (){var blocks_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__89218,vec__89220,parent,blocks,c__5478__auto__,size__5479__auto__,b__89219,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks){
return (function (b){
if(datascript.impl.entity.entity_QMARK_(b)){
return b;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","children","block/children",-1040716209),((function (i__89218,vec__89220,parent,blocks,c__5478__auto__,size__5479__auto__,b__89219,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks){
return (function (col){
return (frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1(col) : frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.call(null,col));
});})(i__89218,vec__89220,parent,blocks,c__5478__auto__,size__5479__auto__,b__89219,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks))
);
}
});})(i__89218,vec__89220,parent,blocks,c__5478__auto__,size__5479__auto__,b__89219,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks))
,blocks);
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks_SINGLEQUOTE_,config),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})());

var G__89746 = (i__89218 + (1));
i__89218 = G__89746;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89219),frontend$components$block$iter__89216(cljs.core.chunk_rest(s__89217__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89219),null);
}
} else {
var vec__89223 = cljs.core.first(s__89217__$2);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89223,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89223,(1),null);
return cljs.core.cons((function (){var blocks_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__89223,parent,blocks,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks){
return (function (b){
if(datascript.impl.entity.entity_QMARK_(b)){
return b;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","children","block/children",-1040716209),(function (col){
return (frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1(col) : frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.call(null,col));
}));
}
});})(vec__89223,parent,blocks,s__89217__$2,temp__5804__auto__,alias_QMARK_,page__$1,parent_blocks,vec__89212,page,page_blocks))
,blocks);
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks_SINGLEQUOTE_,config),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})(),frontend$components$block$iter__89216(cljs.core.rest(s__89217__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(parent_blocks);
})();
if(cljs.core.truth_(page__$1)){
return frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.with-foldable-page","div.with-foldable-page",-1284568708),frontend.components.block.page_cp(config,page__$1),(cljs.core.truth_(alias_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.opacity-50","span.text-sm.font-medium.opacity-50",1280125801)," Alias"], null):null)], null),items,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug-id","debug-id",-938947038),page__$1], null));
} else {
var attrs89226 = items;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs89226))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["only-page-blocks"], null)], null),attrs89226], 0))):{'className':"only-page-blocks"}),((cljs.core.map_QMARK_(attrs89226))?null:[daiquiri.interpreter.interpret(attrs89226)]));
}
})()]);
}),null,"frontend.components.block/ref-block-container");
frontend.components.block.__GT_hiccup = (function frontend$components$block$__GT_hiccup(blocks,config,option){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.content","div.content",-298042649),(function (){var G__89227 = option;
if(cljs.core.truth_(new cljs.core.Keyword("document","mode?","document/mode?",-994203479).cljs$core$IFn$_invoke$arity$1(config))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__89227,new cljs.core.Keyword(null,"class","class",-2030961996),"doc-mode");
} else {
return G__89227;
}
})(),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448).cljs$core$IFn$_invoke$arity$1(config);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col","div.flex.flex-col",255067761),(function (){var blocks__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),cljs.core.first),cljs.core._GT_,blocks);
var iter__5480__auto__ = (function frontend$components$block$__GT_hiccup_$_iter__89228(s__89229){
return (new cljs.core.LazySeq(null,(function (){
var s__89229__$1 = s__89229;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89229__$1);
if(temp__5804__auto__){
var s__89229__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89229__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89229__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89231 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89230 = (0);
while(true){
if((i__89230 < size__5479__auto__)){
var vec__89232 = cljs.core._nth(c__5478__auto__,i__89230);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89232,(0),null);
var blocks__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89232,(1),null);
cljs.core.chunk_append(b__89231,(function (){var alias_QMARK_ = new cljs.core.Keyword("block","alias?","block/alias?",-551896044).cljs$core$IFn$_invoke$arity$1(page);
var page__$1 = (function (){var G__89235 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89235) : frontend.db.entity.call(null,G__89235));
})();
var blocks__$3 = (frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1(blocks__$2) : frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.call(null,blocks__$2));
var parent_blocks = cljs.core.group_by(new cljs.core.Keyword("block","parent","block/parent",-918309064),blocks__$3);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.custom-query-page-result","div.custom-query-page-result",1108163),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1))].join('')], null),frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.page_cp(config,page__$1),(cljs.core.truth_(alias_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.opacity-50","span.text-sm.font-medium.opacity-50",1280125801)," Alias"], null):null)], null),(function (){var map__89236 = cljs.core.group_by(((function (i__89230,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1){
return (function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(b)));
});})(i__89230,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1))
,parent_blocks);
var map__89236__$1 = cljs.core.__destructure_map(map__89236);
var top_level_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89236__$1,true);
var others = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89236__$1,false);
var sorted_parent_blocks = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(top_level_blocks,others);
var iter__5480__auto__ = ((function (i__89230,map__89236,map__89236__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1){
return (function frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89237(s__89238){
return (new cljs.core.LazySeq(null,((function (i__89230,map__89236,map__89236__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1){
return (function (){
var s__89238__$1 = s__89238;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__89238__$1);
if(temp__5804__auto____$1){
var s__89238__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__89238__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__89238__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__89240 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__89239 = (0);
while(true){
if((i__89239 < size__5479__auto____$1)){
var vec__89241 = cljs.core._nth(c__5478__auto____$1,i__89239);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89241,(0),null);
var blocks__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89241,(1),null);
cljs.core.chunk_append(b__89240,(function (){var top_level_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks__$4,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top-level?","top-level?",993634489),top_level_QMARK_)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})());

var G__89747 = (i__89239 + (1));
i__89239 = G__89747;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89240),frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89237(cljs.core.chunk_rest(s__89238__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89240),null);
}
} else {
var vec__89244 = cljs.core.first(s__89238__$2);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89244,(0),null);
var blocks__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89244,(1),null);
return cljs.core.cons((function (){var top_level_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks__$4,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top-level?","top-level?",993634489),top_level_QMARK_)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})(),frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89237(cljs.core.rest(s__89238__$2)));
}
} else {
return null;
}
break;
}
});})(i__89230,map__89236,map__89236__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1))
,null,null));
});})(i__89230,map__89236,map__89236__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89232,page,blocks__$2,c__5478__auto__,size__5479__auto__,b__89231,s__89229__$2,temp__5804__auto__,blocks__$1))
;
return iter__5480__auto__(sorted_parent_blocks);
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug-id","debug-id",-938947038),page__$1], null))], null);
})());

var G__89748 = (i__89230 + (1));
i__89230 = G__89748;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89231),frontend$components$block$__GT_hiccup_$_iter__89228(cljs.core.chunk_rest(s__89229__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89231),null);
}
} else {
var vec__89247 = cljs.core.first(s__89229__$2);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89247,(0),null);
var blocks__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89247,(1),null);
return cljs.core.cons((function (){var alias_QMARK_ = new cljs.core.Keyword("block","alias?","block/alias?",-551896044).cljs$core$IFn$_invoke$arity$1(page);
var page__$1 = (function (){var G__89250 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89250) : frontend.db.entity.call(null,G__89250));
})();
var blocks__$3 = (frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1(blocks__$2) : frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree.call(null,blocks__$2));
var parent_blocks = cljs.core.group_by(new cljs.core.Keyword("block","parent","block/parent",-918309064),blocks__$3);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.custom-query-page-result","div.custom-query-page-result",1108163),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1))].join('')], null),frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.page_cp(config,page__$1),(cljs.core.truth_(alias_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.opacity-50","span.text-sm.font-medium.opacity-50",1280125801)," Alias"], null):null)], null),(function (){var map__89251 = cljs.core.group_by(((function (alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89247,page,blocks__$2,s__89229__$2,temp__5804__auto__,blocks__$1){
return (function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(b)));
});})(alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89247,page,blocks__$2,s__89229__$2,temp__5804__auto__,blocks__$1))
,parent_blocks);
var map__89251__$1 = cljs.core.__destructure_map(map__89251);
var top_level_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89251__$1,true);
var others = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89251__$1,false);
var sorted_parent_blocks = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(top_level_blocks,others);
var iter__5480__auto__ = ((function (map__89251,map__89251__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89247,page,blocks__$2,s__89229__$2,temp__5804__auto__,blocks__$1){
return (function frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89252(s__89253){
return (new cljs.core.LazySeq(null,(function (){
var s__89253__$1 = s__89253;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__89253__$1);
if(temp__5804__auto____$1){
var s__89253__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__89253__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89253__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89255 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89254 = (0);
while(true){
if((i__89254 < size__5479__auto__)){
var vec__89256 = cljs.core._nth(c__5478__auto__,i__89254);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89256,(0),null);
var blocks__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89256,(1),null);
cljs.core.chunk_append(b__89255,(function (){var top_level_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks__$4,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top-level?","top-level?",993634489),top_level_QMARK_)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})());

var G__89753 = (i__89254 + (1));
i__89254 = G__89753;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89255),frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89252(cljs.core.chunk_rest(s__89253__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89255),null);
}
} else {
var vec__89259 = cljs.core.first(s__89253__$2);
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89259,(0),null);
var blocks__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89259,(1),null);
return cljs.core.cons((function (){var top_level_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
return rum.core.with_key(frontend.components.block.breadcrumb_with_container(blocks__$4,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"top-level?","top-level?",993634489),top_level_QMARK_)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent));
})(),frontend$components$block$__GT_hiccup_$_iter__89228_$_iter__89252(cljs.core.rest(s__89253__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(map__89251,map__89251__$1,top_level_blocks,others,sorted_parent_blocks,alias_QMARK_,page__$1,blocks__$3,parent_blocks,vec__89247,page,blocks__$2,s__89229__$2,temp__5804__auto__,blocks__$1))
;
return iter__5480__auto__(sorted_parent_blocks);
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug-id","debug-id",-938947038),page__$1], null))], null);
})(),frontend$components$block$__GT_hiccup_$_iter__89228(cljs.core.rest(s__89229__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(blocks__$1);
})()], null):(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"ref?","ref?",1932693720).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.vector_QMARK_(cljs.core.first(blocks));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.references-blocks-wrap","div.flex.flex-col.references-blocks-wrap",-1419335530),(function (){var blocks__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),cljs.core.first),cljs.core._GT_,blocks);
var scroll_container = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"scroll-container","scroll-container",-1938238550).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.dom.getElement("main-content-container");
}
})();
if(cljs.core.seq(blocks__$1)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config))){
var iter__5480__auto__ = (function frontend$components$block$__GT_hiccup_$_iter__89262(s__89263){
return (new cljs.core.LazySeq(null,(function (){
var s__89263__$1 = s__89263;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89263__$1);
if(temp__5804__auto__){
var s__89263__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89263__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89263__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89265 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89264 = (0);
while(true){
if((i__89264 < size__5479__auto__)){
var block = cljs.core._nth(c__5478__auto__,i__89264);
cljs.core.chunk_append(b__89265,rum.core.with_key(frontend.components.block.ref_block_container(config,block),["ref-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(block)))].join('')));

var G__89755 = (i__89264 + (1));
i__89264 = G__89755;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89265),frontend$components$block$__GT_hiccup_$_iter__89262(cljs.core.chunk_rest(s__89263__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89265),null);
}
} else {
var block = cljs.core.first(s__89263__$2);
return cljs.core.cons(rum.core.with_key(frontend.components.block.ref_block_container(config,block),["ref-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(block)))].join('')),frontend$components$block$__GT_hiccup_$_iter__89262(cljs.core.rest(s__89263__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(blocks__$1);
} else {
var G__89266 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),scroll_container,new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,idx);
return ["ref-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(block)))].join('');
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(blocks__$1),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,idx);
return frontend.components.block.ref_block_container(config,block);
})], null);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__89266) : frontend.ui.virtualized_list.call(null,G__89266));
}
} else {
return null;
}
})()], null):(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.vector_QMARK_(cljs.core.first(blocks));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col","div.flex.flex-col",255067761),(function (){var blocks__$1 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),cljs.core.first),cljs.core._GT_,blocks);
var iter__5480__auto__ = (function frontend$components$block$__GT_hiccup_$_iter__89267(s__89268){
return (new cljs.core.LazySeq(null,(function (){
var s__89268__$1 = s__89268;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89268__$1);
if(temp__5804__auto__){
var s__89268__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89268__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89268__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89270 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89269 = (0);
while(true){
if((i__89269 < size__5479__auto__)){
var vec__89271 = cljs.core._nth(c__5478__auto__,i__89269);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89271,(0),null);
var blocks__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89271,(1),null);
cljs.core.chunk_append(b__89270,(function (){var blocks__$3 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks__$2);
if(cljs.core.seq(blocks__$3)){
var alias_QMARK_ = new cljs.core.Keyword("block","alias?","block/alias?",-551896044).cljs$core$IFn$_invoke$arity$1(page);
var page__$1 = (function (){var G__89274 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89274) : frontend.db.entity.call(null,G__89274));
})();
var whiteboard_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(page__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.my-2","div.my-2",-846842446),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1))].join('')], null),frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.page_cp(config,page__$1),(cljs.core.truth_(alias_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.opacity-50","span.text-sm.font-medium.opacity-50",1280125801)," Alias"], null):null)], null),(cljs.core.truth_(whiteboard_QMARK_)?null:frontend.components.block.blocks_container(config,blocks__$3)),cljs.core.PersistentArrayMap.EMPTY)], null);
} else {
return null;
}
})());

var G__89762 = (i__89269 + (1));
i__89269 = G__89762;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89270),frontend$components$block$__GT_hiccup_$_iter__89267(cljs.core.chunk_rest(s__89268__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89270),null);
}
} else {
var vec__89275 = cljs.core.first(s__89268__$2);
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89275,(0),null);
var blocks__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89275,(1),null);
return cljs.core.cons((function (){var blocks__$3 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks__$2);
if(cljs.core.seq(blocks__$3)){
var alias_QMARK_ = new cljs.core.Keyword("block","alias?","block/alias?",-551896044).cljs$core$IFn$_invoke$arity$1(page);
var page__$1 = (function (){var G__89278 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89278) : frontend.db.entity.call(null,G__89278));
})();
var whiteboard_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(page__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.my-2","div.my-2",-846842446),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1))].join('')], null),frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.block.page_cp(config,page__$1),(cljs.core.truth_(alias_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.opacity-50","span.text-sm.font-medium.opacity-50",1280125801)," Alias"], null):null)], null),(cljs.core.truth_(whiteboard_QMARK_)?null:frontend.components.block.blocks_container(config,blocks__$3)),cljs.core.PersistentArrayMap.EMPTY)], null);
} else {
return null;
}
})(),frontend$components$block$__GT_hiccup_$_iter__89267(cljs.core.rest(s__89268__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(blocks__$1);
})()], null):frontend.components.block.blocks_container(config,blocks)
)))], null);
});

//# sourceMappingURL=frontend.components.block.js.map
