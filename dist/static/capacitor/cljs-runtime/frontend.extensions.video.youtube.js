goog.provide('frontend.extensions.video.youtube');
goog.scope(function(){
  frontend.extensions.video.youtube.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.extensions.video.youtube.load_yt_script = (function frontend$extensions$video$youtube$load_yt_script(){
console.log("load yt script");

var tag = document.createElement("script");
var first_script_tag = cljs.core.first(document.getElementsByTagName("script"));
var parent_node = first_script_tag.parentNode;
(tag.src = "https://www.youtube.com/iframe_api");

return parent_node.insertBefore(tag,first_script_tag);
});
frontend.extensions.video.youtube.load_youtube_api = (function frontend$extensions$video$youtube$load_youtube_api(){
var c = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(window.YT)){
cljs.core.async.close_BANG_(c);
} else {
(window.onYouTubeIframeAPIReady = (function (){
return cljs.core.async.close_BANG_(c);
}));

frontend.extensions.video.youtube.load_yt_script();
}

return c;
});
frontend.extensions.video.youtube.register_player = (function frontend$extensions$video$youtube$register_player(state){
try{var id = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var node = rum.core.dom_node(state);
if(cljs.core.truth_(node)){
var player = (new window.YT.Player(node,cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"events","events",1792552201),new cljs.core.PersistentArrayMap(null, 1, ["onReady",(function (_e){
return console.log(id," ready");
})], null)], null))));
return frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("youtube","players","youtube/players",1844913740)], null),(function (players){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(players,id,player);
}));
} else {
return null;
}
}catch (e60938){var _e = e60938;
return null;
}});
frontend.extensions.video.youtube.youtube_video = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,p__60939){
var map__60940 = p__60939;
var map__60940__$1 = cljs.core.__destructure_map(map__60940);
var _opts = map__60940__$1;
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60940__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var height = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60940__$1,new cljs.core.Keyword(null,"height","height",1025178622));
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60940__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var width__$1 = (function (){var or__5002__auto__ = width;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var x__5090__auto__ = (frontend.util.get_width() - (96));
var y__5091__auto__ = (560);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
}
})();
var height__$1 = (function (){var or__5002__auto__ = height;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((width__$1 * ((315) / (560))) | (0));
}
})();
var url = ["https://www.youtube.com/embed/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"?enablejsapi=1"].join('');
var url__$1 = (cljs.core.truth_(start)?[url,"&start=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(start)].join(''):url);
return daiquiri.core.create_element("iframe",{'id':["youtube-player-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),'allowFullScreen':"allowfullscreen",'allow':"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope",'frameBorder':"0",'src':url__$1,'height':height__$1,'width':width__$1,'className':"aspect-video"},[]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.video.youtube","player","frontend.extensions.video.youtube/player",-814163162)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var c__32124__auto___61002 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_60946){
var state_val_60947 = (state_60946[(1)]);
if((state_val_60947 === (1))){
var inst_60941 = frontend.extensions.video.youtube.load_youtube_api();
var state_60946__$1 = state_60946;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_60946__$1,(2),inst_60941);
} else {
if((state_val_60947 === (2))){
var inst_60943 = (state_60946[(2)]);
var inst_60944 = frontend.extensions.video.youtube.register_player(state);
var state_60946__$1 = (function (){var statearr_60948 = state_60946;
(statearr_60948[(7)] = inst_60943);

return statearr_60948;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_60946__$1,inst_60944);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$video$youtube$state_machine__32051__auto__ = null;
var frontend$extensions$video$youtube$state_machine__32051__auto____0 = (function (){
var statearr_60949 = [null,null,null,null,null,null,null,null];
(statearr_60949[(0)] = frontend$extensions$video$youtube$state_machine__32051__auto__);

(statearr_60949[(1)] = (1));

return statearr_60949;
});
var frontend$extensions$video$youtube$state_machine__32051__auto____1 = (function (state_60946){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_60946);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e60950){var ex__32054__auto__ = e60950;
var statearr_60951_61006 = state_60946;
(statearr_60951_61006[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_60946[(4)]))){
var statearr_60952_61007 = state_60946;
(statearr_60952_61007[(1)] = cljs.core.first((state_60946[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__61008 = state_60946;
state_60946 = G__61008;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$video$youtube$state_machine__32051__auto__ = function(state_60946){
switch(arguments.length){
case 0:
return frontend$extensions$video$youtube$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$video$youtube$state_machine__32051__auto____1.call(this,state_60946);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$video$youtube$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$video$youtube$state_machine__32051__auto____0;
frontend$extensions$video$youtube$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$video$youtube$state_machine__32051__auto____1;
return frontend$extensions$video$youtube$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_60953 = f__32125__auto__();
(statearr_60953[(6)] = c__32124__auto___61002);

return statearr_60953;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


return state;
})], null)], null),"frontend.extensions.video.youtube/youtube-video");
frontend.extensions.video.youtube.seconds__GT_display = (function frontend$extensions$video$youtube$seconds__GT_display(seconds){
var seconds__$1 = (seconds | (0));
var hours = cljs.core.quot(seconds__$1,(3600));
var minutes = cljs.core.mod(cljs.core.quot(seconds__$1,(60)),(60));
var seconds__$2 = cljs.core.mod(seconds__$1,(60));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(":",cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,v){
if((((idx > (0))) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(v,"00")))){
return v;
} else {
return null;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
if((v < (10))){
return ["0",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(v);
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [hours,minutes,seconds__$2], null))));
});
frontend.extensions.video.youtube.dom_after_video_node_QMARK_ = (function frontend$extensions$video$youtube$dom_after_video_node_QMARK_(video_node,target){
return (!(((video_node.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) === (0))));
});
frontend.extensions.video.youtube.get_player = (function frontend$extensions$video$youtube$get_player(target){
var temp__5804__auto__ = cljs.core.last(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__60954_SHARP_){
return frontend.extensions.video.youtube.dom_after_video_node_QMARK_(p1__60954_SHARP_,target);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (node){
var src = frontend.extensions.video.youtube.goog$module$goog$object.get(node,"src","");
return clojure.string.includes_QMARK_(src,"youtube.com");
}),document.getElementsByTagName("iframe"))));
if(cljs.core.truth_(temp__5804__auto__)){
var iframe = temp__5804__auto__;
var id = frontend.extensions.video.youtube.goog$module$goog$object.get(iframe,"id","");
var id__$1 = clojure.string.replace_first(id,/youtube-player-/,"");
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("youtube","players","youtube/players",1844913740)),id__$1);
} else {
return null;
}
});
frontend.extensions.video.youtube.timestamp = rum.core.lazy_build(rum.core.build_defc,(function (seconds){
return daiquiri.core.create_element("a",{'onClick':(function (e){
frontend.util.stop(e);

var temp__5804__auto__ = frontend.extensions.video.youtube.get_player(e.target);
if(cljs.core.truth_(temp__5804__auto__)){
var player = temp__5804__auto__;
return player.seekTo(seconds,true);
} else {
return null;
}
}),'className':"svg-small youtube-timestamp"},[daiquiri.interpreter.interpret(frontend.components.svg.clock),frontend.extensions.video.youtube.seconds__GT_display(seconds)]);
}),null,"frontend.extensions.video.youtube/timestamp");
frontend.extensions.video.youtube.gen_youtube_ts_macro = (function frontend$extensions$video$youtube$gen_youtube_ts_macro(){
var temp__5802__auto__ = frontend.extensions.video.youtube.get_player(frontend.state.get_input());
if(cljs.core.truth_(temp__5802__auto__)){
var player = temp__5802__auto__;
var G__60956 = "{{youtube-timestamp %s}}";
var G__60957 = Math.floor(player.getCurrentTime());
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__60956,G__60957) : frontend.util.format.call(null,G__60956,G__60957));
} else {
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Please embed a YouTube video at first, then use this icon.\nRemember: You can paste a raw YouTube url as embedded video on mobile.",new cljs.core.Keyword(null,"warning","warning",-1685650671),false);

return null;
} else {
return null;
}
}
});
frontend.extensions.video.youtube.parse_timestamp = (function frontend$extensions$video$youtube$parse_timestamp(timestamp_SINGLEQUOTE_){
var reg = /^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$/;
var reg_number = /^\d+$/;
var timestamp_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.str.cljs$core$IFn$_invoke$arity$1(timestamp_SINGLEQUOTE_);
var total_seconds = (function (){var G__60975 = cljs.core.re_matches(reg_number,timestamp_SINGLEQUOTE__SINGLEQUOTE_);
if((G__60975 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__60975);
}
})();
var vec__60969 = cljs.core.re_matches(reg,timestamp_SINGLEQUOTE__SINGLEQUOTE_);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60969,(0),null);
var hours = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60969,(1),null);
var minutes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60969,(2),null);
var seconds = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60969,(3),null);
var vec__60972 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__60961_SHARP_){
if((p1__60961_SHARP_ == null)){
return (0);
} else {
return frontend.util.safe_parse_int(p1__60961_SHARP_);
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [hours,minutes,seconds], null));
var hours__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60972,(0),null);
var minutes__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60972,(1),null);
var seconds__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60972,(2),null);
if(cljs.core.truth_(total_seconds)){
return total_seconds;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = minutes__$1;
if(cljs.core.truth_(and__5000__auto__)){
return seconds__$1;
} else {
return and__5000__auto__;
}
})())){
return ((((3600) * hours__$1) + ((60) * minutes__$1)) + seconds__$1);
} else {
return null;

}
}
});

//# sourceMappingURL=frontend.extensions.video.youtube.js.map
