goog.provide('frontend.components.rtc.indicator');
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.rtc !== 'undefined') && (typeof frontend.components.rtc.indicator !== 'undefined') && (typeof frontend.components.rtc.indicator._STAR_detail_info !== 'undefined')){
} else {
frontend.components.rtc.indicator._STAR_detail_info = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"pending-local-ops","pending-local-ops",-266254177),(0),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),null,new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),null,new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),null,new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),new cljs.core.Keyword(null,"open","open",-1763596448),new cljs.core.Keyword(null,"download-logs","download-logs",-530842798),null,new cljs.core.Keyword(null,"upload-logs","upload-logs",66527418),null,new cljs.core.Keyword(null,"misc-logs","misc-logs",41710278),null], null));
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.rtc !== 'undefined') && (typeof frontend.components.rtc.indicator !== 'undefined') && (typeof frontend.components.rtc.indicator._STAR_update_detail_info_canceler !== 'undefined')){
} else {
frontend.components.rtc.indicator._STAR_update_detail_info_canceler = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.rtc.indicator.run_task__update_detail_info = (function frontend$components$rtc$indicator$run_task__update_detail_info(){
var temp__5804__auto___90881 = cljs.core.deref(frontend.components.rtc.indicator._STAR_update_detail_info_canceler);
if(cljs.core.truth_(temp__5804__auto___90881)){
var canceler_90882 = temp__5804__auto___90881;
(canceler_90882.cljs$core$IFn$_invoke$arity$0 ? canceler_90882.cljs$core$IFn$_invoke$arity$0() : canceler_90882.call(null));

cljs.core.reset_BANG_(frontend.components.rtc.indicator._STAR_update_detail_info_canceler,null);
} else {
}

var update_log_task = (function frontend$components$rtc$indicator$run_task__update_detail_info_$_update_log_task(flow,k){
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,log){
if(cljs.core.truth_(log)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.rtc.indicator._STAR_detail_info,cljs.core.update,k,(function (logs){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((5),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logs,log));
}));
} else {
return null;
}
}),flow);
});
var canceler = frontend.common.missionary.run_task(new cljs.core.Keyword("frontend.components.rtc.indicator","update-detail-info","frontend.components.rtc.indicator/update-detail-info",667984942),missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(cljs.core.constantly(null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([update_log_task(frontend.handler.db_based.rtc_flows.rtc_download_log_flow,new cljs.core.Keyword(null,"download-logs","download-logs",-530842798)),update_log_task(frontend.handler.db_based.rtc_flows.rtc_upload_log_flow,new cljs.core.Keyword(null,"upload-logs","upload-logs",66527418)),update_log_task(frontend.handler.db_based.rtc_flows.rtc_misc_log_flow,new cljs.core.Keyword(null,"misc-logs","misc-logs",41710278)),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,state){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.components.rtc.indicator._STAR_detail_info,cljs.core.assoc,new cljs.core.Keyword(null,"pending-local-ops","pending-local-ops",-266254177),new cljs.core.Keyword(null,"unpushed-block-update-count","unpushed-block-update-count",-387210371).cljs$core$IFn$_invoke$arity$1(state),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),(cljs.core.truth_(new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560).cljs$core$IFn$_invoke$arity$1(state))?new cljs.core.Keyword(null,"open","open",-1763596448):new cljs.core.Keyword(null,"close","close",1835149582))], 0));
}),frontend.handler.db_based.rtc_flows.rtc_state_flow)], 0)));
return cljs.core.reset_BANG_(frontend.components.rtc.indicator._STAR_update_detail_info_canceler,canceler);
});
frontend.components.rtc.indicator.run_task__update_detail_info();
frontend.components.rtc.indicator.asset_upload_download_progress_flow = (function frontend$components$rtc$indicator$asset_upload_download_progress_flow(repo){
return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p1__90714_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(p1__90714_SHARP_,repo);
})),cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.watch(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.Keyword("rtc","asset-upload-download-progress","rtc/asset-upload-download-progress",-940899343)))], 0));
});
frontend.components.rtc.indicator.assets_progressing = rum.core.lazy_build(rum.core.build_defc,(function (){
var repo = frontend.state.get_current_repo();
var progress = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.components.rtc.indicator.asset_upload_download_progress_flow(repo));
var downloading = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p__90745){
var map__90746 = p__90745;
var map__90746__$1 = cljs.core.__destructure_map(map__90746);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90746__$1,new cljs.core.Keyword(null,"block","block",664686210));
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__90747){
var vec__90748 = p__90747;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90748,(0),null);
var map__90751 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90748,(1),null);
var map__90751__$1 = cljs.core.__destructure_map(map__90751);
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90751__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var loaded = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90751__$1,new cljs.core.Keyword(null,"loaded","loaded",-1246482293));
var total = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90751__$1,new cljs.core.Keyword(null,"total","total",1916810418));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"download","download",-300081668))) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loaded,total)) && (((typeof loaded === 'number') && (typeof total === 'number'))))))){
var temp__5804__auto__ = (function (){var G__90753 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90753) : frontend.db.entity.call(null,G__90753));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"percent","percent",2031453817),(((100) * (loaded / total)) | (0))], null);
} else {
return null;
}
} else {
return null;
}
}),progress));
var uploading = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p__90754){
var map__90755 = p__90754;
var map__90755__$1 = cljs.core.__destructure_map(map__90755);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90755__$1,new cljs.core.Keyword(null,"block","block",664686210));
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__90756){
var vec__90757 = p__90756;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90757,(0),null);
var map__90760 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90757,(1),null);
var map__90760__$1 = cljs.core.__destructure_map(map__90760);
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90760__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var loaded = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90760__$1,new cljs.core.Keyword(null,"loaded","loaded",-1246482293));
var total = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90760__$1,new cljs.core.Keyword(null,"total","total",1916810418));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"upload","upload",-255769218))) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loaded,total)) && (((typeof loaded === 'number') && (typeof total === 'number'))))))){
var temp__5804__auto__ = (function (){var G__90761 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90761) : frontend.db.entity.call(null,G__90761));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"percent","percent",2031453817),(((100) * (loaded / total)) | (0))], null);
} else {
return null;
}
} else {
return null;
}
}),progress));
var attrs90744 = ((cljs.core.seq(downloading))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"details","details",1956795411),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"summary","summary",380847952),(function (){var G__90763 = "Downloading assets (%s)";
var G__90764 = cljs.core.count(downloading);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__90763,G__90764) : frontend.util.format.call(null,G__90763,G__90764));
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-1.text-sm","div.flex.flex-col.gap-1.text-sm",504270069),(function (){var iter__5480__auto__ = (function frontend$components$rtc$indicator$iter__90769(s__90770){
return (new cljs.core.LazySeq(null,(function (){
var s__90770__$1 = s__90770;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90770__$1);
if(temp__5804__auto__){
var s__90770__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90770__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90770__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90772 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90771 = (0);
while(true){
if((i__90771 < size__5479__auto__)){
var map__90782 = cljs.core._nth(c__5478__auto__,i__90771);
var map__90782__$1 = cljs.core.__destructure_map(map__90782);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90782__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90782__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
cljs.core.chunk_append(b__90772,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),frontend.ui.indicator_progress_pie(percent),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block)], null));

var G__90883 = (i__90771 + (1));
i__90771 = G__90883;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90772),frontend$components$rtc$indicator$iter__90769(cljs.core.chunk_rest(s__90770__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90772),null);
}
} else {
var map__90783 = cljs.core.first(s__90770__$2);
var map__90783__$1 = cljs.core.__destructure_map(map__90783);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90783__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90783__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),frontend.ui.indicator_progress_pie(percent),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block)], null),frontend$components$rtc$indicator$iter__90769(cljs.core.rest(s__90770__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(downloading);
})()], null)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90744))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["assets-sync-progress","flex","flex-col","gap-2"], null)], null),attrs90744], 0))):{'className':"assets-sync-progress flex flex-col gap-2"}),((cljs.core.map_QMARK_(attrs90744))?[((cljs.core.seq(uploading))?daiquiri.core.create_element("details",null,[(function (){var attrs90788 = (function (){var G__90789 = "Uploading assets (%s)";
var G__90790 = cljs.core.count(uploading);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__90789,G__90790) : frontend.util.format.call(null,G__90789,G__90790));
})();
return daiquiri.core.create_element("summary",((cljs.core.map_QMARK_(attrs90788))?daiquiri.interpreter.element_attributes(attrs90788):null),((cljs.core.map_QMARK_(attrs90788))?null:[daiquiri.interpreter.interpret(attrs90788)]));
})(),daiquiri.core.create_element("div",{'className':"flex flex-col gap-1 text-sm"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$rtc$indicator$iter__90791(s__90792){
return (new cljs.core.LazySeq(null,(function (){
var s__90792__$1 = s__90792;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90792__$1);
if(temp__5804__auto__){
var s__90792__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90792__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90792__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90794 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90793 = (0);
while(true){
if((i__90793 < size__5479__auto__)){
var map__90795 = cljs.core._nth(c__5478__auto__,i__90793);
var map__90795__$1 = cljs.core.__destructure_map(map__90795);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90795__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90795__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
cljs.core.chunk_append(b__90794,daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[frontend.ui.indicator_progress_pie(percent),daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))]));

var G__90884 = (i__90793 + (1));
i__90793 = G__90884;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90794),frontend$components$rtc$indicator$iter__90791(cljs.core.chunk_rest(s__90792__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90794),null);
}
} else {
var map__90796 = cljs.core.first(s__90792__$2);
var map__90796__$1 = cljs.core.__destructure_map(map__90796);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90796__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90796__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
return cljs.core.cons(daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[frontend.ui.indicator_progress_pie(percent),daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))]),frontend$components$rtc$indicator$iter__90791(cljs.core.rest(s__90792__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(uploading);
})())])]):null)]:[daiquiri.interpreter.interpret(attrs90744),((cljs.core.seq(uploading))?daiquiri.core.create_element("details",null,[(function (){var attrs90801 = (function (){var G__90802 = "Uploading assets (%s)";
var G__90803 = cljs.core.count(uploading);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__90802,G__90803) : frontend.util.format.call(null,G__90802,G__90803));
})();
return daiquiri.core.create_element("summary",((cljs.core.map_QMARK_(attrs90801))?daiquiri.interpreter.element_attributes(attrs90801):null),((cljs.core.map_QMARK_(attrs90801))?null:[daiquiri.interpreter.interpret(attrs90801)]));
})(),daiquiri.core.create_element("div",{'className':"flex flex-col gap-1 text-sm"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$rtc$indicator$iter__90804(s__90805){
return (new cljs.core.LazySeq(null,(function (){
var s__90805__$1 = s__90805;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90805__$1);
if(temp__5804__auto__){
var s__90805__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90805__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90805__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90807 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90806 = (0);
while(true){
if((i__90806 < size__5479__auto__)){
var map__90808 = cljs.core._nth(c__5478__auto__,i__90806);
var map__90808__$1 = cljs.core.__destructure_map(map__90808);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90808__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90808__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
cljs.core.chunk_append(b__90807,daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[frontend.ui.indicator_progress_pie(percent),daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))]));

var G__90885 = (i__90806 + (1));
i__90806 = G__90885;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90807),frontend$components$rtc$indicator$iter__90804(cljs.core.chunk_rest(s__90805__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90807),null);
}
} else {
var map__90809 = cljs.core.first(s__90805__$2);
var map__90809__$1 = cljs.core.__destructure_map(map__90809);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90809__$1,new cljs.core.Keyword(null,"block","block",664686210));
var percent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90809__$1,new cljs.core.Keyword(null,"percent","percent",2031453817));
return cljs.core.cons(daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[frontend.ui.indicator_progress_pie(percent),daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))]),frontend$components$rtc$indicator$iter__90804(cljs.core.rest(s__90805__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(uploading);
})())])]):null)]));
}),null,"frontend.components.rtc.indicator/assets-progressing");
frontend.components.rtc.indicator.details = rum.core.lazy_build(rum.core.build_defc,(function (online_QMARK_){
var vec__90810 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var expand_debug_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90810,(0),null);
var set_expand_debug_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90810,(1),null);
var map__90813 = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(missionary.core.watch(frontend.components.rtc.indicator._STAR_detail_info));
var map__90813__$1 = cljs.core.__destructure_map(map__90813);
var pending_server_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"pending-server-ops","pending-server-ops",42835834));
var upload_logs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"upload-logs","upload-logs",66527418));
var pending_local_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"pending-local-ops","pending-local-ops",-266254177));
var misc_logs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"misc-logs","misc-logs",41710278));
var local_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"local-tx","local-tx",1729212201));
var rtc_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921));
var remote_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481));
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var download_logs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90813__$1,new cljs.core.Keyword(null,"download-logs","download-logs",-530842798));
return daiquiri.core.create_element("div",{'className':"rtc-info flex flex-col gap-1 p-2 text-gray-11"},[daiquiri.core.create_element("div",{'className':"font-medium mb-2"},[(cljs.core.truth_(online_QMARK_)?"Online":"Offline")]),daiquiri.core.create_element("div",null,[(function (){var attrs90814 = (function (){var or__5002__auto__ = pending_local_ops;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs90814))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium","mr-1"], null)], null),attrs90814], 0))):{'className':"font-medium mr-1"}),((cljs.core.map_QMARK_(attrs90814))?null:[daiquiri.interpreter.interpret(attrs90814)]));
})(),"pending local changes"]),daiquiri.core.create_element("div",null,[(function (){var attrs90815 = (function (){var or__5002__auto__ = pending_server_ops;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs90815))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["font-medium","mr-1"], null)], null),attrs90815], 0))):{'className':"font-medium mr-1"}),((cljs.core.map_QMARK_(attrs90815))?null:[daiquiri.interpreter.interpret(attrs90815)]));
})(),"pending server changes"]),frontend.components.rtc.indicator.assets_progressing(),daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs.core.some((function (l){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879),null], null), null),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(l))){
return l;
} else {
return null;
}
}),misc_logs);
if(cljs.core.truth_(temp__5804__auto__)){
var latest_log = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(latest_log);
if(cljs.core.truth_(temp__5804__auto____$1)){
var time = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),"Last synced time: ",time.toLocaleString()], null);
} else {
return null;
}
} else {
return null;
}
})()),daiquiri.core.create_element("a",{'onClick':(function (){
var G__90816 = cljs.core.not(expand_debug_QMARK_);
return (set_expand_debug_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_expand_debug_BANG_.cljs$core$IFn$_invoke$arity$1(G__90816) : set_expand_debug_BANG_.call(null,G__90816));
}),'className':"fade-link text-sm"},["More debug info"]),(cljs.core.truth_(expand_debug_QMARK_)?daiquiri.core.create_element("div",{'className':"rtc-info-debug"},[daiquiri.core.create_element("pre",{'className':"select-text"},[(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__90832_90886 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__90833_90887 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__90834_90888 = true;
var _STAR_print_fn_STAR__temp_val__90835_90889 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__90834_90888);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__90835_90889);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1((function (){var G__90836 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pending-local-ops","pending-local-ops",-266254177),pending_local_ops], null);
var G__90836__$1 = (cljs.core.truth_(download_logs)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836,new cljs.core.Keyword(null,"download","download",-300081668),download_logs):G__90836);
var G__90836__$2 = (cljs.core.truth_(upload_logs)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$1,new cljs.core.Keyword(null,"upload","upload",-255769218),upload_logs):G__90836__$1);
var G__90836__$3 = (cljs.core.truth_(misc_logs)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$2,new cljs.core.Keyword(null,"misc","misc",-222218601),misc_logs):G__90836__$2);
var G__90836__$4 = (cljs.core.truth_(graph_uuid)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$3,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid):G__90836__$3);
var G__90836__$5 = (cljs.core.truth_(local_tx)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$4,new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),local_tx):G__90836__$4);
var G__90836__$6 = (cljs.core.truth_(remote_tx)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$5,new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),remote_tx):G__90836__$5);
if(cljs.core.truth_(rtc_state)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__90836__$6,new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),rtc_state);
} else {
return G__90836__$6;
}
})());
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__90833_90887);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__90832_90886);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()])]):null)]);
}),null,"frontend.components.rtc.indicator/details");
frontend.components.rtc.indicator.indicator = rum.core.lazy_build(rum.core.build_defc,(function (){
var detail_info = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(missionary.core.watch(frontend.components.rtc.indicator._STAR_detail_info));
var _ = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.flows.current_login_user_flow);
var online_QMARK_ = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.flows.network_online_event_flow);
var rtc_state = new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921).cljs$core$IFn$_invoke$arity$1(detail_info);
var unpushed_block_update_count = new cljs.core.Keyword(null,"pending-local-ops","pending-local-ops",-266254177).cljs$core$IFn$_invoke$arity$1(detail_info);
var map__90838 = detail_info;
var map__90838__$1 = cljs.core.__destructure_map(map__90838);
var local_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90838__$1,new cljs.core.Keyword(null,"local-tx","local-tx",1729212201));
var remote_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90838__$1,new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481));
return daiquiri.core.create_element("div",{'className':"cp__rtc-sync"},[daiquiri.core.create_element("div",{'data-testid':"rtc-tx",'className':"hidden"},[cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),local_tx,new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),remote_tx], null)], 0))]),(function (){var attrs90845 = logseq.shui.ui.button_ghost_icon(new cljs.core.Keyword(null,"cloud","cloud",-1976521303),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90837_SHARP_){
var G__90846 = p1__90837_SHARP_.target;
var G__90847 = frontend.components.rtc.indicator.details(online_QMARK_);
var G__90848 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__90846,G__90847,G__90848) : logseq.shui.ui.popup_show_BANG_.call(null,G__90846,G__90847,G__90848));
}),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"cloud","cloud",-1976521303),true,new cljs.core.Keyword(null,"on","on",173873944),(function (){var and__5000__auto__ = online_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"open","open",-1763596448),rtc_state);
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"idle","idle",-2007156861),(function (){var and__5000__auto__ = online_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"open","open",-1763596448),rtc_state)) && ((unpushed_block_update_count === (0))));
} else {
return and__5000__auto__;
}
})(),new cljs.core.Keyword(null,"queuing","queuing",-1502477638),(unpushed_block_update_count > (0))], null)], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90845))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__rtc-sync-indicator","flex","flex-row","items-center","gap-1"], null)], null),attrs90845], 0))):{'className':"cp__rtc-sync-indicator flex flex-row items-center gap-1"}),((cljs.core.map_QMARK_(attrs90845))?null:[daiquiri.interpreter.interpret(attrs90845)]));
})()]);
}),null,"frontend.components.rtc.indicator/indicator");
frontend.components.rtc.indicator._STAR_accumulated_download_logs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
if(frontend.config.publishing_QMARK_){
} else {
frontend.common.missionary.run_background_task(new cljs.core.Keyword("frontend.components.rtc.indicator","update-accumulated-download-logs","frontend.components.rtc.indicator/update-accumulated-download-logs",-2072245028),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,log){
if(cljs.core.truth_(log)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"download-completed","download-completed",-1038223761),new cljs.core.Keyword(null,"sub-type","sub-type",-997954412).cljs$core$IFn$_invoke$arity$1(log))){
return cljs.core.reset_BANG_(frontend.components.rtc.indicator._STAR_accumulated_download_logs,cljs.core.PersistentVector.EMPTY);
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.rtc.indicator._STAR_accumulated_download_logs,(function (logs){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((20),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logs,log));
}));
}
} else {
return null;
}
}),frontend.handler.db_based.rtc_flows.rtc_download_log_flow));
}
frontend.components.rtc.indicator._STAR_accumulated_upload_logs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
if(frontend.config.publishing_QMARK_){
} else {
frontend.common.missionary.run_background_task(new cljs.core.Keyword("frontend.components.rtc.indicator","update-accumulated-upload-logs","frontend.components.rtc.indicator/update-accumulated-upload-logs",1470961731),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,log){
if(cljs.core.truth_(log)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"upload-completed","upload-completed",-769495446),new cljs.core.Keyword(null,"sub-type","sub-type",-997954412).cljs$core$IFn$_invoke$arity$1(log))){
return cljs.core.reset_BANG_(frontend.components.rtc.indicator._STAR_accumulated_upload_logs,cljs.core.PersistentVector.EMPTY);
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.rtc.indicator._STAR_accumulated_upload_logs,(function (logs){
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((20),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logs,log));
}));
}
} else {
return null;
}
}),frontend.handler.db_based.rtc_flows.rtc_upload_log_flow));
}
frontend.components.rtc.indicator.accumulated_logs_flow = (function frontend$components$rtc$indicator$accumulated_logs_flow(_STAR_acc_logs){
return missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (logs){
var temp__5804__auto__ = cljs.core.first(logs);
if(cljs.core.truth_(temp__5804__auto__)){
var first_log = temp__5804__auto__;
var graph_uuid = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(first_log);
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (log){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_uuid,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(log));
}),logs);
} else {
return null;
}
})),missionary.core.watch(_STAR_acc_logs));
});
frontend.components.rtc.indicator.downloading_logs = rum.core.lazy_build(rum.core.build_defc,(function (){
var download_logs_flow = frontend.components.rtc.indicator.accumulated_logs_flow(frontend.components.rtc.indicator._STAR_accumulated_download_logs);
var download_logs = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(download_logs_flow);
if(cljs.core.seq(download_logs)){
return daiquiri.core.create_element("div",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$rtc$indicator$iter__90850(s__90851){
return (new cljs.core.LazySeq(null,(function (){
var s__90851__$1 = s__90851;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90851__$1);
if(temp__5804__auto__){
var s__90851__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90851__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90851__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90853 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90852 = (0);
while(true){
if((i__90852 < size__5479__auto__)){
var log = cljs.core._nth(c__5478__auto__,i__90852);
cljs.core.chunk_append(b__90853,(function (){var attrs90849 = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(log);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90849))?daiquiri.interpreter.element_attributes(attrs90849):null),((cljs.core.map_QMARK_(attrs90849))?null:[daiquiri.interpreter.interpret(attrs90849)]));
})());

var G__90890 = (i__90852 + (1));
i__90852 = G__90890;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90853),frontend$components$rtc$indicator$iter__90850(cljs.core.chunk_rest(s__90851__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90853),null);
}
} else {
var log = cljs.core.first(s__90851__$2);
return cljs.core.cons((function (){var attrs90849 = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(log);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90849))?daiquiri.interpreter.element_attributes(attrs90849):null),((cljs.core.map_QMARK_(attrs90849))?null:[daiquiri.interpreter.interpret(attrs90849)]));
})(),frontend$components$rtc$indicator$iter__90850(cljs.core.rest(s__90851__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(download_logs);
})())]);
} else {
return null;
}
}),null,"frontend.components.rtc.indicator/downloading-logs");
frontend.components.rtc.indicator.uploading_logs = rum.core.lazy_build(rum.core.build_defc,(function (){
var upload_logs_flow = frontend.components.rtc.indicator.accumulated_logs_flow(frontend.components.rtc.indicator._STAR_accumulated_upload_logs);
var upload_logs = logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(upload_logs_flow);
if(cljs.core.seq(upload_logs)){
return daiquiri.core.create_element("div",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$rtc$indicator$iter__90855(s__90856){
return (new cljs.core.LazySeq(null,(function (){
var s__90856__$1 = s__90856;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90856__$1);
if(temp__5804__auto__){
var s__90856__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90856__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90856__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90858 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90857 = (0);
while(true){
if((i__90857 < size__5479__auto__)){
var log = cljs.core._nth(c__5478__auto__,i__90857);
cljs.core.chunk_append(b__90858,(function (){var attrs90854 = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(log);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90854))?daiquiri.interpreter.element_attributes(attrs90854):null),((cljs.core.map_QMARK_(attrs90854))?null:[daiquiri.interpreter.interpret(attrs90854)]));
})());

var G__90891 = (i__90857 + (1));
i__90857 = G__90891;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90858),frontend$components$rtc$indicator$iter__90855(cljs.core.chunk_rest(s__90856__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90858),null);
}
} else {
var log = cljs.core.first(s__90856__$2);
return cljs.core.cons((function (){var attrs90854 = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(log);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90854))?daiquiri.interpreter.element_attributes(attrs90854):null),((cljs.core.map_QMARK_(attrs90854))?null:[daiquiri.interpreter.interpret(attrs90854)]));
})(),frontend$components$rtc$indicator$iter__90855(cljs.core.rest(s__90856__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(upload_logs);
})())]);
} else {
return null;
}
}),null,"frontend.components.rtc.indicator/uploading-logs");
frontend.components.rtc.indicator.downloading_QMARK__flow = frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2(false,missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (log){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"download-completed","download-completed",-1038223761),new cljs.core.Keyword(null,"sub-type","sub-type",-997954412).cljs$core$IFn$_invoke$arity$1(log));
})),frontend.handler.db_based.rtc_flows.rtc_download_log_flow));
frontend.components.rtc.indicator.downloading_detail = rum.core.lazy_build(rum.core.build_defc,(function (){
if(logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.components.rtc.indicator.downloading_QMARK__flow) === true){
return daiquiri.interpreter.interpret((function (){var G__90865 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90859_SHARP_){
var G__90867 = p1__90859_SHARP_.target;
var G__90868 = frontend.components.rtc.indicator.downloading_logs();
var G__90869 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__90867,G__90868,G__90869) : logseq.shui.ui.popup_show_BANG_.call(null,G__90867,G__90868,G__90869));
})], null);
var G__90866 = "Downloading...";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90865,G__90866) : logseq.shui.ui.button.call(null,G__90865,G__90866));
})());
} else {
return null;
}
}),null,"frontend.components.rtc.indicator/downloading-detail");
frontend.components.rtc.indicator.upload_QMARK__flow = frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2(false,missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (log){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"upload-completed","upload-completed",-769495446),new cljs.core.Keyword(null,"sub-type","sub-type",-997954412).cljs$core$IFn$_invoke$arity$1(log));
})),frontend.handler.db_based.rtc_flows.rtc_upload_log_flow));
frontend.components.rtc.indicator.uploading_detail = rum.core.lazy_build(rum.core.build_defc,(function (){
if(logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1(frontend.components.rtc.indicator.upload_QMARK__flow) === true){
return daiquiri.interpreter.interpret((function (){var G__90876 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90870_SHARP_){
var G__90878 = p1__90870_SHARP_.target;
var G__90879 = frontend.components.rtc.indicator.uploading_logs();
var G__90880 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__90878,G__90879,G__90880) : logseq.shui.ui.popup_show_BANG_.call(null,G__90878,G__90879,G__90880));
})], null);
var G__90877 = "Uploading...";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90876,G__90877) : logseq.shui.ui.button.call(null,G__90876,G__90877));
})());
} else {
return null;
}
}),null,"frontend.components.rtc.indicator/uploading-detail");

//# sourceMappingURL=frontend.components.rtc.indicator.js.map
