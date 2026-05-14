goog.provide('frontend.worker.rtc.ws');
frontend.worker.rtc.ws.get_state = (function frontend$worker$rtc$ws$get_state(ws){
var G__138518 = ws.readyState;
switch (G__138518) {
case (0):
return new cljs.core.Keyword(null,"connecting","connecting",-1347943866);

break;
case (1):
return new cljs.core.Keyword(null,"open","open",-1763596448);

break;
case (2):
return new cljs.core.Keyword(null,"closing","closing",-1862893890);

break;
case (3):
return new cljs.core.Keyword(null,"closed","closed",-919675359);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138518)].join('')));

}
});
frontend.worker.rtc.ws.open_ws_task = (function frontend$worker$rtc$ws$open_ws_task(url){
return (function (s_BANG_,f_BANG_){
try{var ws = (new WebSocket(url));
(ws.onopen = (function (_){
var close_dfv = missionary.core.dfv();
var mbx = missionary.core.mbx();
(ws.onopen = null);

(ws.onmessage = (function (e){
var G__138562 = e.data;
return (mbx.cljs$core$IFn$_invoke$arity$1 ? mbx.cljs$core$IFn$_invoke$arity$1(G__138562) : mbx.call(null,G__138562));
}));

(ws.onclose = (function (e){
(ws.onclose = null);

return (close_dfv.cljs$core$IFn$_invoke$arity$1 ? close_dfv.cljs$core$IFn$_invoke$arity$1(e) : close_dfv.call(null,e));
}));

var G__138569 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [mbx,ws,close_dfv], null);
return (s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(G__138569) : s_BANG_.call(null,G__138569));
}));

(ws.onclose = (function (e){
(ws.onopen = null);

(ws.onclose = null);

return (f_BANG_.cljs$core$IFn$_invoke$arity$1 ? f_BANG_.cljs$core$IFn$_invoke$arity$1(e) : f_BANG_.call(null,e));
}));

return (function frontend$worker$rtc$ws$open_ws_task_$_canceller(){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"connecting","connecting",-1347943866),frontend.worker.rtc.ws.get_state(ws))){
return ws.close();
} else {
return null;
}
});
}catch (e138539){var e = e138539;
(f_BANG_.cljs$core$IFn$_invoke$arity$1 ? f_BANG_.cljs$core$IFn$_invoke$arity$1(e) : f_BANG_.call(null,e));

return (function (){
return null;
});
}});
});
frontend.worker.rtc.ws.handle_close = (function frontend$worker$rtc$ws$handle_close(x){
if((x instanceof CloseEvent)){
throw x;
} else {
return x;
}
});
frontend.worker.rtc.ws.create_mws_STAR_ = (function frontend$worker$rtc$ws$create_mws_STAR_(url){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138593_block_0 = (function frontend$worker$rtc$ws$create_mws_STAR__$_cr138593_block_0(cr138593_state){
try{var cr138593_place_0 = frontend.worker.rtc.ws.open_ws_task;
var cr138593_place_1 = url;
var cr138593_place_2 = (function (){var G__139247 = cr138593_place_1;
var fexpr__139246 = cr138593_place_0;
return (fexpr__139246.cljs$core$IFn$_invoke$arity$1 ? fexpr__139246.cljs$core$IFn$_invoke$arity$1(G__139247) : fexpr__139246.call(null,G__139247));
})();
(cr138593_state[(0)] = cr138593_block_1);

return missionary.core.park(cr138593_place_2);
}catch (e139245){var cr138593_exception = e139245;
(cr138593_state[(0)] = null);

throw cr138593_exception;
}});
var cr138593_block_1 = (function frontend$worker$rtc$ws$create_mws_STAR__$_cr138593_block_1(cr138593_state){
try{var cr138593_place_3 = missionary.core.unpark();
var cr138593_place_4 = cljs.core.nth;
var cr138593_place_5 = cr138593_place_3;
var cr138593_place_6 = (0);
var cr138593_place_7 = null;
var cr138593_place_8 = (function (){var G__139253 = cr138593_place_5;
var G__139254 = cr138593_place_6;
var G__139255 = cr138593_place_7;
var fexpr__139252 = cr138593_place_4;
return (fexpr__139252.cljs$core$IFn$_invoke$arity$3 ? fexpr__139252.cljs$core$IFn$_invoke$arity$3(G__139253,G__139254,G__139255) : fexpr__139252.call(null,G__139253,G__139254,G__139255));
})();
var cr138593_place_9 = cljs.core.nth;
var cr138593_place_10 = cr138593_place_3;
var cr138593_place_11 = (1);
var cr138593_place_12 = null;
var cr138593_place_13 = (function (){var G__139257 = cr138593_place_10;
var G__139258 = cr138593_place_11;
var G__139259 = cr138593_place_12;
var fexpr__139256 = cr138593_place_9;
return (fexpr__139256.cljs$core$IFn$_invoke$arity$3 ? fexpr__139256.cljs$core$IFn$_invoke$arity$3(G__139257,G__139258,G__139259) : fexpr__139256.call(null,G__139257,G__139258,G__139259));
})();
var cr138593_place_14 = cljs.core.nth;
var cr138593_place_15 = cr138593_place_3;
var cr138593_place_16 = (2);
var cr138593_place_17 = null;
var cr138593_place_18 = (function (){var G__139264 = cr138593_place_15;
var G__139265 = cr138593_place_16;
var G__139266 = cr138593_place_17;
var fexpr__139263 = cr138593_place_14;
return (fexpr__139263.cljs$core$IFn$_invoke$arity$3 ? fexpr__139263.cljs$core$IFn$_invoke$arity$3(G__139264,G__139265,G__139266) : fexpr__139263.call(null,G__139264,G__139265,G__139266));
})();
var cr138593_place_19 = new cljs.core.Keyword(null,"raw-ws","raw-ws",-1415558997);
var cr138593_place_20 = cr138593_place_13;
var cr138593_place_21 = new cljs.core.Keyword(null,"send","send",-652151114);
var cr138593_place_22 = (function (data){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138599_block_0 = (function (cr138599_state){
try{var cr138599_place_0 = frontend.worker.rtc.ws.handle_close;
var cr138599_place_1 = missionary.core.race;
var cr138599_place_2 = cr138593_place_18;
var cr138599_place_3 = cljs.core.partial;
var cr138599_place_4 = (function (cr138600_state){
try{(cr138600_state[(0)] = cr138599_place_5);

return cr138600_state;
}catch (e139319){var e138774 = e139319;
var e138623 = e138774;
var cr138600_exception = e138623;
(cr138600_state[(0)] = null);

throw cr138600_exception;
}});
var cr138599_place_5 = (function (cr138600_state){
try{var cr138600_place_0 = (4096);
var cr138600_place_1 = cr138593_place_13;
var cr138600_place_2 = cr138600_place_1.bufferedAmount;
var cr138600_place_3 = (cr138600_place_0 < cr138600_place_2);
var cr138600_place_4 = null;
if(cr138600_place_3){
(cr138600_state[(0)] = cr138599_place_7);

return cr138600_state;
} else {
(cr138600_state[(0)] = cr138599_place_6);

(cr138600_state[(1)] = cr138600_place_4);

return cr138600_state;
}
}catch (e139320){var e138775 = e139320;
var e138624 = e138775;
var cr138600_exception = e138624;
(cr138600_state[(0)] = null);

throw cr138600_exception;
}});
var cr138599_place_6 = (function (cr138600_state){
try{var cr138600_place_5 = null;
(cr138600_state[(0)] = cr138599_place_9);

(cr138600_state[(1)] = cr138600_place_5);

return cr138600_state;
}catch (e139323){var e138779 = e139323;
var e138627 = e138779;
var cr138600_exception = e138627;
(cr138600_state[(0)] = null);

(cr138600_state[(1)] = null);

throw cr138600_exception;
}});
var cr138599_place_7 = (function (cr138600_state){
try{var cr138600_place_6 = missionary.core.sleep;
var cr138600_place_7 = (50);
var cr138600_place_8 = (function (){var G__138630 = cr138600_place_7;
var fexpr__138629 = cr138600_place_6;
var G__138792 = G__138630;
var fexpr__138791 = fexpr__138629;
var G__139329 = G__138792;
var fexpr__139328 = fexpr__138791;
return (fexpr__139328.cljs$core$IFn$_invoke$arity$1 ? fexpr__139328.cljs$core$IFn$_invoke$arity$1(G__139329) : fexpr__139328.call(null,G__139329));
})();
(cr138600_state[(0)] = cr138599_place_8);

return missionary.core.park(cr138600_place_8);
}catch (e139324){var e138789 = e139324;
var e138628 = e138789;
var cr138600_exception = e138628;
(cr138600_state[(0)] = null);

throw cr138600_exception;
}});
var cr138599_place_8 = (function (cr138600_state){
try{var cr138600_place_9 = missionary.core.unpark();
(cr138600_state[(0)] = cr138599_place_5);

return cr138600_state;
}catch (e139330){var e138793 = e139330;
var e138636 = e138793;
var cr138600_exception = e138636;
(cr138600_state[(0)] = null);

throw cr138600_exception;
}});
var cr138599_place_9 = (function (cr138600_state){
try{var cr138600_place_4 = (cr138600_state[(1)]);
var cr138600_place_10 = cr138593_place_13;
var cr138600_place_11 = data;
var cr138600_place_12 = cr138600_place_10.send(cr138600_place_11);
(cr138600_state[(0)] = null);

(cr138600_state[(1)] = null);

return cr138600_place_12;
}catch (e139331){var e138796 = e139331;
var e138638 = e138796;
var cr138600_exception = e138638;
(cr138600_state[(0)] = null);

(cr138600_state[(1)] = null);

throw cr138600_exception;
}});
var cr138599_place_10 = cloroutine.impl.coroutine;
var cr138599_place_11 = cljs.core.object_array;
var cr138599_place_12 = (2);
var cr138599_place_13 = (function (){var G__138799 = cr138599_place_12;
var fexpr__138798 = cr138599_place_11;
var G__139333 = G__138799;
var fexpr__139332 = fexpr__138798;
return (fexpr__139332.cljs$core$IFn$_invoke$arity$1 ? fexpr__139332.cljs$core$IFn$_invoke$arity$1(G__139333) : fexpr__139332.call(null,G__139333));
})();
var cr138599_place_14 = cr138599_place_13;
var cr138599_place_15 = (0);
var cr138599_place_16 = cr138599_place_4;
var cr138599_place_17 = (cr138599_place_14[cr138599_place_15] = cr138599_place_16);
var cr138599_place_18 = cr138599_place_13;
var cr138599_place_19 = (function (){var G__138801 = cr138599_place_18;
var fexpr__138800 = cr138599_place_10;
var G__139335 = G__138801;
var fexpr__139334 = fexpr__138800;
return (fexpr__139334.cljs$core$IFn$_invoke$arity$1 ? fexpr__139334.cljs$core$IFn$_invoke$arity$1(G__139335) : fexpr__139334.call(null,G__139335));
})();
var cr138599_place_20 = missionary.core.sp_run;
var cr138599_place_21 = (function (){var G__138803 = cr138599_place_19;
var G__138804 = cr138599_place_20;
var fexpr__138802 = cr138599_place_3;
var G__139337 = G__138803;
var G__139338 = G__138804;
var fexpr__139336 = fexpr__138802;
return (fexpr__139336.cljs$core$IFn$_invoke$arity$2 ? fexpr__139336.cljs$core$IFn$_invoke$arity$2(G__139337,G__139338) : fexpr__139336.call(null,G__139337,G__139338));
})();
var cr138599_place_22 = (function (){var G__138810 = cr138599_place_2;
var G__138811 = cr138599_place_21;
var fexpr__138809 = cr138599_place_1;
var G__139340 = G__138810;
var G__139341 = G__138811;
var fexpr__139339 = fexpr__138809;
return (fexpr__139339.cljs$core$IFn$_invoke$arity$2 ? fexpr__139339.cljs$core$IFn$_invoke$arity$2(G__139340,G__139341) : fexpr__139339.call(null,G__139340,G__139341));
})();
(cr138599_state[(0)] = cr138599_block_1);

(cr138599_state[(1)] = cr138599_place_0);

return missionary.core.park(cr138599_place_22);
}catch (e139310){var e138738 = e139310;
var cr138599_exception = e138738;
(cr138599_state[(0)] = null);

throw cr138599_exception;
}});
var cr138599_block_1 = (function (cr138599_state){
try{var cr138599_place_0 = (cr138599_state[(1)]);
var cr138599_place_23 = missionary.core.unpark();
var cr138599_place_24 = (function (){var G__138820 = cr138599_place_23;
var fexpr__138819 = cr138599_place_0;
var G__139346 = G__138820;
var fexpr__139345 = fexpr__138819;
return (fexpr__139345.cljs$core$IFn$_invoke$arity$1 ? fexpr__139345.cljs$core$IFn$_invoke$arity$1(G__139346) : fexpr__139345.call(null,G__139346));
})();
(cr138599_state[(0)] = null);

(cr138599_state[(1)] = null);

return cr138599_place_24;
}catch (e139344){var e138817 = e139344;
var cr138599_exception = e138817;
(cr138599_state[(0)] = null);

(cr138599_state[(1)] = null);

throw cr138599_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138821 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__138821[(0)] = cr138599_block_0);

return G__138821;
})());
})(),missionary.core.sp_run);
});
var cr138593_place_23 = new cljs.core.Keyword(null,"recv-flow","recv-flow",-938720709);
var cr138593_place_24 = missionary.core.stream;
var cr138593_place_25 = cljs.core.partial;
var cr138593_place_26 = (function (cr138824_state){
try{(cr138824_state[(0)] = cr138593_place_27);

return cr138824_state;
}catch (e139366){var e138875 = e139366;
var cr138824_exception = e138875;
(cr138824_state[(0)] = null);

throw cr138824_exception;
}});
var cr138593_place_27 = (function (cr138824_state){
try{var cr138824_place_0 = (1);
var cr138824_place_1 = missionary.core.seed;
var cr138824_place_2 = cljs.core.range;
var cr138824_place_3 = (2);
var cr138824_place_4 = (function (){var G__138882 = cr138824_place_3;
var fexpr__138881 = cr138824_place_2;
var G__139369 = G__138882;
var fexpr__139368 = fexpr__138881;
return (fexpr__139368.cljs$core$IFn$_invoke$arity$1 ? fexpr__139368.cljs$core$IFn$_invoke$arity$1(G__139369) : fexpr__139368.call(null,G__139369));
})();
var cr138824_place_5 = (function (){var G__138884 = cr138824_place_4;
var fexpr__138883 = cr138824_place_1;
var G__139371 = G__138884;
var fexpr__139370 = fexpr__138883;
return (fexpr__139370.cljs$core$IFn$_invoke$arity$1 ? fexpr__139370.cljs$core$IFn$_invoke$arity$1(G__139371) : fexpr__139370.call(null,G__139371));
})();
(cr138824_state[(0)] = cr138593_place_28);

return missionary.core.fork(cr138824_place_0,cr138824_place_5);
}catch (e139367){var e138877 = e139367;
var cr138824_exception = e138877;
(cr138824_state[(0)] = null);

throw cr138824_exception;
}});
var cr138593_place_28 = (function (cr138824_state){
try{var cr138824_place_6 = missionary.core.unpark();
var cr138824_place_7 = cr138824_place_6;
var cr138824_place_8 = null;
var G__138886 = cr138824_place_7;
var G__139373 = G__138886;
switch (G__139373) {
case (0):
(cr138824_state[(0)] = cr138593_place_29);

(cr138824_state[(1)] = cr138824_place_8);

return cr138824_state;

break;
case (1):
(cr138824_state[(0)] = cr138593_place_31);

return cr138824_state;

break;
default:
(cr138824_state[(0)] = cr138593_place_32);

(cr138824_state[(1)] = cr138824_place_6);

return cr138824_state;

}
}catch (e139372){var e138885 = e139372;
var cr138824_exception = e138885;
(cr138824_state[(0)] = null);

throw cr138824_exception;
}});
var cr138593_place_29 = (function (cr138824_state){
try{var cr138824_place_9 = frontend.worker.rtc.ws.handle_close;
var cr138824_place_10 = missionary.core.race;
var cr138824_place_11 = cr138593_place_18;
var cr138824_place_12 = cr138593_place_8;
var cr138824_place_13 = (function (){var G__138889 = cr138824_place_11;
var G__138890 = cr138824_place_12;
var fexpr__138888 = cr138824_place_10;
var G__139376 = G__138889;
var G__139377 = G__138890;
var fexpr__139375 = fexpr__138888;
return (fexpr__139375.cljs$core$IFn$_invoke$arity$2 ? fexpr__139375.cljs$core$IFn$_invoke$arity$2(G__139376,G__139377) : fexpr__139375.call(null,G__139376,G__139377));
})();
(cr138824_state[(0)] = cr138593_place_30);

(cr138824_state[(2)] = cr138824_place_9);

return missionary.core.park(cr138824_place_13);
}catch (e139374){var e138887 = e139374;
var cr138824_exception = e138887;
(cr138824_state[(0)] = null);

(cr138824_state[(1)] = null);

throw cr138824_exception;
}});
var cr138593_place_30 = (function (cr138824_state){
try{var cr138824_place_9 = (cr138824_state[(2)]);
var cr138824_place_14 = missionary.core.unpark();
var cr138824_place_15 = (function (){var G__138900 = cr138824_place_14;
var fexpr__138899 = cr138824_place_9;
var G__139381 = G__138900;
var fexpr__139380 = fexpr__138899;
return (fexpr__139380.cljs$core$IFn$_invoke$arity$1 ? fexpr__139380.cljs$core$IFn$_invoke$arity$1(G__139381) : fexpr__139380.call(null,G__139381));
})();
(cr138824_state[(0)] = cr138593_place_33);

(cr138824_state[(2)] = null);

(cr138824_state[(1)] = cr138824_place_15);

return cr138824_state;
}catch (e139378){var e138895 = e139378;
var cr138824_exception = e138895;
(cr138824_state[(0)] = null);

(cr138824_state[(2)] = null);

(cr138824_state[(1)] = null);

throw cr138824_exception;
}});
var cr138593_place_31 = (function (cr138824_state){
try{(cr138824_state[(0)] = cr138593_place_27);

return cr138824_state;
}catch (e139382){var e138901 = e139382;
var cr138824_exception = e138901;
(cr138824_state[(0)] = null);

throw cr138824_exception;
}});
var cr138593_place_32 = (function (cr138824_state){
try{var cr138824_place_6 = (cr138824_state[(1)]);
var cr138824_place_16 = "No matching clause: ";
var cr138824_place_17 = cr138824_place_6;
var cr138824_place_18 = [cr138824_place_16,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138824_place_17)].join('');
var cr138824_place_19 = (new Error(cr138824_place_18));
var cr138824_place_20 = (function(){throw cr138824_place_19})();
(cr138824_state[(0)] = null);

(cr138824_state[(1)] = null);

return null;
}catch (e139383){var e138903 = e139383;
var cr138824_exception = e138903;
(cr138824_state[(0)] = null);

(cr138824_state[(1)] = null);

throw cr138824_exception;
}});
var cr138593_place_33 = (function (cr138824_state){
try{var cr138824_place_8 = (cr138824_state[(1)]);
(cr138824_state[(0)] = null);

(cr138824_state[(1)] = null);

return cr138824_place_8;
}catch (e139386){var e138906 = e139386;
var cr138824_exception = e138906;
(cr138824_state[(0)] = null);

(cr138824_state[(1)] = null);

throw cr138824_exception;
}});
var cr138593_place_34 = cloroutine.impl.coroutine;
var cr138593_place_35 = cljs.core.object_array;
var cr138593_place_36 = (3);
var cr138593_place_37 = (function (){var G__139388 = cr138593_place_36;
var fexpr__139387 = cr138593_place_35;
return (fexpr__139387.cljs$core$IFn$_invoke$arity$1 ? fexpr__139387.cljs$core$IFn$_invoke$arity$1(G__139388) : fexpr__139387.call(null,G__139388));
})();
var cr138593_place_38 = cr138593_place_37;
var cr138593_place_39 = (0);
var cr138593_place_40 = cr138593_place_26;
var cr138593_place_41 = (cr138593_place_38[cr138593_place_39] = cr138593_place_40);
var cr138593_place_42 = cr138593_place_37;
var cr138593_place_43 = (function (){var G__139390 = cr138593_place_42;
var fexpr__139389 = cr138593_place_34;
return (fexpr__139389.cljs$core$IFn$_invoke$arity$1 ? fexpr__139389.cljs$core$IFn$_invoke$arity$1(G__139390) : fexpr__139389.call(null,G__139390));
})();
var cr138593_place_44 = missionary.core.ap_run;
var cr138593_place_45 = (function (){var G__139392 = cr138593_place_43;
var G__139393 = cr138593_place_44;
var fexpr__139391 = cr138593_place_25;
return (fexpr__139391.cljs$core$IFn$_invoke$arity$2 ? fexpr__139391.cljs$core$IFn$_invoke$arity$2(G__139392,G__139393) : fexpr__139391.call(null,G__139392,G__139393));
})();
var cr138593_place_46 = (function (){var G__139395 = cr138593_place_45;
var fexpr__139394 = cr138593_place_24;
return (fexpr__139394.cljs$core$IFn$_invoke$arity$1 ? fexpr__139394.cljs$core$IFn$_invoke$arity$1(G__139395) : fexpr__139394.call(null,G__139395));
})();
var cr138593_place_47 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138593_place_19,cr138593_place_20,cr138593_place_23,cr138593_place_46,cr138593_place_21,cr138593_place_22]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr138593_state[(0)] = null);

return cr138593_place_47;
}catch (e139249){var cr138593_exception = e139249;
(cr138593_state[(0)] = null);

throw cr138593_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139398 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__139398[(0)] = cr138593_block_0);

return G__139398;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.ws.closed_QMARK_ = (function frontend$worker$rtc$ws$closed_QMARK_(mws){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"closed","closed",-919675359),null,new cljs.core.Keyword(null,"closing","closing",-1862893890),null], null), null),frontend.worker.rtc.ws.get_state(new cljs.core.Keyword(null,"raw-ws","raw-ws",-1415558997).cljs$core$IFn$_invoke$arity$1(mws)));
});
/**
 * Return a task that create a mws (missionary wrapped websocket).
 *   When failed to open websocket, retry with backoff.
 *   TODO: retry ASAP once network condition changed
 */
frontend.worker.rtc.ws.mws_create = (function frontend$worker$rtc$ws$mws_create(var_args){
var args__5732__auto__ = [];
var len__5726__auto___139861 = arguments.length;
var i__5727__auto___139862 = (0);
while(true){
if((i__5727__auto___139862 < len__5726__auto___139861)){
args__5732__auto__.push((arguments[i__5727__auto___139862]));

var G__139863 = (i__5727__auto___139862 + (1));
i__5727__auto___139862 = G__139863;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__139406){
var map__139407 = p__139406;
var map__139407__$1 = cljs.core.__destructure_map(map__139407);
var retry_count = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__139407__$1,new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),(10));
var open_ws_timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__139407__$1,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),(10000));
if(((cljs.core.pos_int_QMARK_(retry_count)) && (cljs.core.pos_int_QMARK_(open_ws_timeout)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [retry_count,open_ws_timeout], null)),"\n","(and (pos-int? retry-count) (pos-int? open-ws-timeout))"].join('')));
}

return frontend.common.missionary.backoff(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166),cljs.core.take.cljs$core$IFn$_invoke$arity$2(retry_count,frontend.common.missionary.delays),new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377),frontend.worker.flows.online_event_flow], null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139411_block_4 = (function frontend$worker$rtc$ws$cr139411_block_4(cr139411_state){
try{var cr139411_place_8 = (cr139411_state[(3)]);
var cr139411_place_20 = cr139411_place_8;
var cr139411_place_21 = cr139411_place_20;
(cr139411_state[(0)] = cr139411_block_5);

(cr139411_state[(3)] = null);

(cr139411_state[(4)] = cr139411_place_21);

return cr139411_state;
}catch (e139453){var cr139411_exception = e139453;
(cr139411_state[(0)] = cr139411_block_6);

(cr139411_state[(3)] = null);

(cr139411_state[(4)] = null);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_7 = (function frontend$worker$rtc$ws$cr139411_block_7(cr139411_state){
try{var cr139411_place_26 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr139411_place_27 = null;
if(cljs.core.truth_(cr139411_place_26)){
(cr139411_state[(0)] = cr139411_block_9);

(cr139411_state[(3)] = null);

return cr139411_state;
} else {
(cr139411_state[(0)] = cr139411_block_8);

(cr139411_state[(4)] = cr139411_place_27);

return cr139411_state;
}
}catch (e139457){var cr139411_exception = e139457;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(3)] = null);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_2 = (function frontend$worker$rtc$ws$cr139411_block_2(cr139411_state){
try{var cr139411_place_8 = missionary.core.unpark();
var cr139411_place_9 = cr139411_place_8;
var cr139411_place_10 = null;
if(cljs.core.truth_(cr139411_place_9)){
(cr139411_state[(0)] = cr139411_block_4);

(cr139411_state[(3)] = cr139411_place_8);

(cr139411_state[(4)] = cr139411_place_10);

return cr139411_state;
} else {
(cr139411_state[(0)] = cr139411_block_3);

return cr139411_state;
}
}catch (e139458){var cr139411_exception = e139458;
(cr139411_state[(0)] = cr139411_block_6);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_9 = (function frontend$worker$rtc$ws$cr139411_block_9(cr139411_state){
try{var cr139411_place_0 = (cr139411_state[(2)]);
var cr139411_place_29 = cr139411_place_0;
var cr139411_place_30 = (function(){throw cr139411_place_29})();
(cr139411_state[(0)] = null);

(cr139411_state[(1)] = null);

(cr139411_state[(2)] = null);

return null;
}catch (e139459){var cr139411_exception = e139459;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_10 = (function frontend$worker$rtc$ws$cr139411_block_10(cr139411_state){
try{var cr139411_place_27 = (cr139411_state[(4)]);
(cr139411_state[(0)] = cr139411_block_12);

(cr139411_state[(4)] = null);

(cr139411_state[(3)] = cr139411_place_27);

return cr139411_state;
}catch (e139466){var cr139411_exception = e139466;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(4)] = null);

(cr139411_state[(3)] = null);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_12 = (function frontend$worker$rtc$ws$cr139411_block_12(cr139411_state){
try{var cr139411_place_25 = (cr139411_state[(3)]);
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(3)] = null);

(cr139411_state[(2)] = cr139411_place_25);

return cr139411_state;
}catch (e139469){var cr139411_exception = e139469;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(3)] = null);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_13 = (function frontend$worker$rtc$ws$cr139411_block_13(cr139411_state){
try{var cr139411_place_1 = (cr139411_state[(1)]);
var cr139411_place_0 = (cr139411_state[(2)]);
var cr139411_place_40 = (cljs.core.truth_(cr139411_place_1)?(function(){throw cr139411_place_0})():cr139411_place_0);
(cr139411_state[(0)] = null);

(cr139411_state[(1)] = null);

(cr139411_state[(2)] = null);

return cr139411_place_40;
}catch (e139470){var cr139411_exception = e139470;
(cr139411_state[(0)] = null);

(cr139411_state[(1)] = null);

(cr139411_state[(2)] = null);

throw cr139411_exception;
}});
var cr139411_block_8 = (function frontend$worker$rtc$ws$cr139411_block_8(cr139411_state){
try{var cr139411_place_28 = null;
(cr139411_state[(0)] = cr139411_block_10);

(cr139411_state[(4)] = cr139411_place_28);

return cr139411_state;
}catch (e139471){var cr139411_exception = e139471;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(4)] = null);

(cr139411_state[(3)] = null);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_0 = (function frontend$worker$rtc$ws$cr139411_block_0(cr139411_state){
try{var cr139411_place_0 = null;
var cr139411_place_1 = false;
(cr139411_state[(0)] = cr139411_block_1);

(cr139411_state[(2)] = cr139411_place_0);

(cr139411_state[(1)] = cr139411_place_1);

return cr139411_state;
}catch (e139472){var cr139411_exception = e139472;
(cr139411_state[(0)] = null);

throw cr139411_exception;
}});
var cr139411_block_5 = (function frontend$worker$rtc$ws$cr139411_block_5(cr139411_state){
try{var cr139411_place_10 = (cr139411_state[(4)]);
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(4)] = null);

(cr139411_state[(2)] = cr139411_place_10);

return cr139411_state;
}catch (e139473){var cr139411_exception = e139473;
(cr139411_state[(0)] = cr139411_block_6);

(cr139411_state[(4)] = null);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_3 = (function frontend$worker$rtc$ws$cr139411_block_3(cr139411_state){
try{var cr139411_place_11 = cljs.core.ex_info;
var cr139411_place_12 = "open websocket timeout";
var cr139411_place_13 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr139411_place_14 = true;
var cr139411_place_15 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr139411_place_16 = new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739);
var cr139411_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139411_place_15,cr139411_place_16,cr139411_place_13,cr139411_place_14]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139411_place_18 = (function (){var G__139476 = cr139411_place_12;
var G__139477 = cr139411_place_17;
var fexpr__139475 = cr139411_place_11;
return (fexpr__139475.cljs$core$IFn$_invoke$arity$2 ? fexpr__139475.cljs$core$IFn$_invoke$arity$2(G__139476,G__139477) : fexpr__139475.call(null,G__139476,G__139477));
})();
var cr139411_place_19 = (function(){throw cr139411_place_18})();
(cr139411_state[(0)] = null);

(cr139411_state[(1)] = null);

(cr139411_state[(2)] = null);

return null;
}catch (e139474){var cr139411_exception = e139474;
(cr139411_state[(0)] = cr139411_block_6);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_1 = (function frontend$worker$rtc$ws$cr139411_block_1(cr139411_state){
try{var cr139411_place_2 = missionary.core.timeout;
var cr139411_place_3 = frontend.worker.rtc.ws.create_mws_STAR_;
var cr139411_place_4 = url;
var cr139411_place_5 = (function (){var G__139480 = cr139411_place_4;
var fexpr__139479 = cr139411_place_3;
return (fexpr__139479.cljs$core$IFn$_invoke$arity$1 ? fexpr__139479.cljs$core$IFn$_invoke$arity$1(G__139480) : fexpr__139479.call(null,G__139480));
})();
var cr139411_place_6 = open_ws_timeout;
var cr139411_place_7 = (function (){var G__139482 = cr139411_place_5;
var G__139483 = cr139411_place_6;
var fexpr__139481 = cr139411_place_2;
return (fexpr__139481.cljs$core$IFn$_invoke$arity$2 ? fexpr__139481.cljs$core$IFn$_invoke$arity$2(G__139482,G__139483) : fexpr__139481.call(null,G__139482,G__139483));
})();
(cr139411_state[(0)] = cr139411_block_2);

return missionary.core.park(cr139411_place_7);
}catch (e139478){var cr139411_exception = e139478;
(cr139411_state[(0)] = cr139411_block_6);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_11 = (function frontend$worker$rtc$ws$cr139411_block_11(cr139411_state){
try{var cr139411_place_0 = (cr139411_state[(2)]);
var cr139411_place_31 = cr139411_place_0;
var cr139411_place_32 = cljs.core.ex_info;
var cr139411_place_33 = "failed to open websocket conn";
var cr139411_place_34 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr139411_place_35 = true;
var cr139411_place_36 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139411_place_34,cr139411_place_35]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139411_place_37 = cr139411_place_31;
var cr139411_place_38 = (function (){var G__139486 = cr139411_place_33;
var G__139487 = cr139411_place_36;
var G__139488 = cr139411_place_37;
var fexpr__139485 = cr139411_place_32;
return (fexpr__139485.cljs$core$IFn$_invoke$arity$3 ? fexpr__139485.cljs$core$IFn$_invoke$arity$3(G__139486,G__139487,G__139488) : fexpr__139485.call(null,G__139486,G__139487,G__139488));
})();
var cr139411_place_39 = (function(){throw cr139411_place_38})();
(cr139411_state[(0)] = null);

(cr139411_state[(1)] = null);

(cr139411_state[(2)] = null);

return null;
}catch (e139484){var cr139411_exception = e139484;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
var cr139411_block_6 = (function frontend$worker$rtc$ws$cr139411_block_6(cr139411_state){
try{var cr139411_place_0 = (cr139411_state[(2)]);
var cr139411_place_22 = cr139411_place_0;
var cr139411_place_23 = CloseEvent;
var cr139411_place_24 = (cr139411_place_22 instanceof cr139411_place_23);
var cr139411_place_25 = null;
if(cr139411_place_24){
(cr139411_state[(0)] = cr139411_block_11);

return cr139411_state;
} else {
(cr139411_state[(0)] = cr139411_block_7);

(cr139411_state[(3)] = cr139411_place_25);

return cr139411_state;
}
}catch (e139490){var cr139411_exception = e139490;
(cr139411_state[(0)] = cr139411_block_13);

(cr139411_state[(1)] = true);

(cr139411_state[(2)] = cr139411_exception);

return cr139411_state;
}});
return cloroutine.impl.coroutine((function (){var G__139491 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__139491[(0)] = cr139411_block_0);

return G__139491;
})());
})(),missionary.core.sp_run));
}));

(frontend.worker.rtc.ws.mws_create.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.rtc.ws.mws_create.cljs$lang$applyTo = (function (seq139400){
var G__139401 = cljs.core.first(seq139400);
var seq139400__$1 = cljs.core.next(seq139400);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__139401,seq139400__$1);
}));

frontend.worker.rtc.ws.create_mws_state_flow = (function frontend$worker$rtc$ws$create_mws_state_flow(mws){
return missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(missionary.core.observe((function frontend$worker$rtc$ws$create_mws_state_flow_$_ctor(emit_BANG_){
var ws = new cljs.core.Keyword(null,"raw-ws","raw-ws",-1415558997).cljs$core$IFn$_invoke$arity$1(mws);
var old_onclose = ws.onclose;
var old_onerror = ws.onerror;
var old_onopen = ws.onopen;
(ws.onclose = (function (e){
if(cljs.core.truth_(old_onclose)){
(old_onclose.cljs$core$IFn$_invoke$arity$1 ? old_onclose.cljs$core$IFn$_invoke$arity$1(e) : old_onclose.call(null,e));
} else {
}

var G__139492 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__139492) : emit_BANG_.call(null,G__139492));
}));

(ws.onerror = (function (e){
if(cljs.core.truth_(old_onerror)){
(old_onerror.cljs$core$IFn$_invoke$arity$1 ? old_onerror.cljs$core$IFn$_invoke$arity$1(e) : old_onerror.call(null,e));
} else {
}

var G__139493 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__139493) : emit_BANG_.call(null,G__139493));
}));

(ws.onopen = (function (e){
if(cljs.core.truth_(old_onopen)){
(old_onopen.cljs$core$IFn$_invoke$arity$1 ? old_onopen.cljs$core$IFn$_invoke$arity$1(e) : old_onopen.call(null,e));
} else {
}

var G__139495 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__139495) : emit_BANG_.call(null,G__139495));
}));

var G__139496_139868 = frontend.worker.rtc.ws.get_state(ws);
(emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__139496_139868) : emit_BANG_.call(null,G__139496_139868));

return (function frontend$worker$rtc$ws$create_mws_state_flow_$_ctor_$_dtor(){
(ws.onclose = old_onclose);

(ws.onerror = old_onerror);

return (ws.onopen = old_onopen);
});
})));
});
/**
 * Returns a task: send message
 */
frontend.worker.rtc.ws.send = (function frontend$worker$rtc$ws$send(mws,message){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139497_block_0 = (function frontend$worker$rtc$ws$send_$_cr139497_block_0(cr139497_state){
try{var cr139497_place_0 = frontend.worker.rtc.malli_schema.data_to_ws_coercer;
var cr139497_place_1 = message;
var cr139497_place_2 = (function (){var G__139539 = cr139497_place_1;
var fexpr__139538 = cr139497_place_0;
return (fexpr__139538.cljs$core$IFn$_invoke$arity$1 ? fexpr__139538.cljs$core$IFn$_invoke$arity$1(G__139539) : fexpr__139538.call(null,G__139539));
})();
var cr139497_place_3 = JSON.stringify;
var cr139497_place_4 = cljs.core.clj__GT_js;
var cr139497_place_5 = frontend.worker.rtc.malli_schema.data_to_ws_encoder;
var cr139497_place_6 = cr139497_place_2;
var cr139497_place_7 = (function (){var G__139541 = cr139497_place_6;
var fexpr__139540 = cr139497_place_5;
return (fexpr__139540.cljs$core$IFn$_invoke$arity$1 ? fexpr__139540.cljs$core$IFn$_invoke$arity$1(G__139541) : fexpr__139540.call(null,G__139541));
})();
var cr139497_place_8 = (function (){var G__139543 = cr139497_place_7;
var fexpr__139542 = cr139497_place_4;
return (fexpr__139542.cljs$core$IFn$_invoke$arity$1 ? fexpr__139542.cljs$core$IFn$_invoke$arity$1(G__139543) : fexpr__139542.call(null,G__139543));
})();
var cr139497_place_9 = (function (){var G__139545 = cr139497_place_8;
var fexpr__139544 = cr139497_place_3;
return (fexpr__139544.cljs$core$IFn$_invoke$arity$1 ? fexpr__139544.cljs$core$IFn$_invoke$arity$1(G__139545) : fexpr__139544.call(null,G__139545));
})();
var cr139497_place_10 = new cljs.core.Keyword(null,"send","send",-652151114);
var cr139497_place_11 = mws;
var cr139497_place_12 = cr139497_place_10.cljs$core$IFn$_invoke$arity$1(cr139497_place_11);
var cr139497_place_13 = cr139497_place_12;
var cr139497_place_14 = cr139497_place_9;
var cr139497_place_15 = (function (){var G__139547 = cr139497_place_14;
var fexpr__139546 = cr139497_place_13;
return (fexpr__139546.cljs$core$IFn$_invoke$arity$1 ? fexpr__139546.cljs$core$IFn$_invoke$arity$1(G__139547) : fexpr__139546.call(null,G__139547));
})();
(cr139497_state[(0)] = cr139497_block_1);

return missionary.core.park(cr139497_place_15);
}catch (e139526){var cr139497_exception = e139526;
(cr139497_state[(0)] = null);

throw cr139497_exception;
}});
var cr139497_block_1 = (function frontend$worker$rtc$ws$send_$_cr139497_block_1(cr139497_state){
try{var cr139497_place_16 = missionary.core.unpark();
(cr139497_state[(0)] = null);

return cr139497_place_16;
}catch (e139548){var cr139497_exception = e139548;
(cr139497_state[(0)] = null);

throw cr139497_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139549 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__139549[(0)] = cr139497_block_0);

return G__139549;
})());
})(),missionary.core.sp_run);
});
/**
 * Throw if recv `Internal server error`
 */
frontend.worker.rtc.ws.recv_flow_STAR_ = (function frontend$worker$rtc$ws$recv_flow_STAR_(m_ws){
if((!((new cljs.core.Keyword(null,"recv-flow","recv-flow",-938720709).cljs$core$IFn$_invoke$arity$1(m_ws) == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(m_ws),"\n","(some? (:recv-flow m-ws))"].join('')));
}

return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__139567_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(p1__139567_SHARP_),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
})),cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (m){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Internal server error",new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(m))){
throw frontend.worker.rtc.exception.ex_unknown_server_error;
} else {
return m;
}
})),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.malli_schema.data_from_ws_coercer),new cljs.core.Keyword(null,"recv-flow","recv-flow",-938720709).cljs$core$IFn$_invoke$arity$1(m_ws)], 0));
});
/**
 * Throw if recv `Internal server error`.
 *   Also take care of :s3-presign-url.(when response is too huge, it's stored in s3)
 */
frontend.worker.rtc.ws.recv_flow = (function frontend$worker$rtc$ws$recv_flow(m_ws){
var f = frontend.worker.rtc.ws.recv_flow_STAR_(m_ws);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139584_block_5 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_5(cr139584_state){
try{var cr139584_place_23 = (cr139584_state[(3)]);
var cr139584_place_2 = (cr139584_state[(1)]);
var cr139584_place_27 = (cr139584_state[(5)]);
var cr139584_place_32 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr139584_place_33 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr139584_place_34 = cr139584_place_2;
var cr139584_place_35 = cr139584_place_33.cljs$core$IFn$_invoke$arity$1(cr139584_place_34);
var cr139584_place_36 = new cljs.core.Keyword(null,"ex-message","ex-message",1526142375);
var cr139584_place_37 = "get s3 object failed";
var cr139584_place_38 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr139584_place_39 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr139584_place_40 = new cljs.core.Keyword("rtc.exception","get-s3-object-failed","rtc.exception/get-s3-object-failed",-2138023187);
var cr139584_place_41 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr139584_place_42 = cr139584_place_23;
var cr139584_place_43 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr139584_place_44 = cr139584_place_27;
var cr139584_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139584_place_43,cr139584_place_44,cr139584_place_41,cr139584_place_42,cr139584_place_39,cr139584_place_40]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139584_place_46 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139584_place_32,cr139584_place_35,cr139584_place_36,cr139584_place_37,cr139584_place_38,cr139584_place_45]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr139584_state[(0)] = cr139584_block_7);

(cr139584_state[(3)] = null);

(cr139584_state[(1)] = null);

(cr139584_state[(5)] = null);

(cr139584_state[(4)] = cr139584_place_46);

return cr139584_state;
}catch (e139631){var cr139584_exception = e139631;
(cr139584_state[(0)] = null);

(cr139584_state[(3)] = null);

(cr139584_state[(4)] = null);

(cr139584_state[(1)] = null);

(cr139584_state[(5)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_8 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_8(cr139584_state){
try{var cr139584_place_7 = (cr139584_state[(2)]);
(cr139584_state[(0)] = null);

(cr139584_state[(2)] = null);

return cr139584_place_7;
}catch (e139632){var cr139584_exception = e139632;
(cr139584_state[(0)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_1 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_1(cr139584_state){
try{var cr139584_place_2 = missionary.core.unpark();
var cr139584_place_3 = new cljs.core.Keyword(null,"s3-presign-url","s3-presign-url",-714097497);
var cr139584_place_4 = cr139584_place_2;
var cr139584_place_5 = cr139584_place_3.cljs$core$IFn$_invoke$arity$1(cr139584_place_4);
var cr139584_place_6 = cr139584_place_5;
var cr139584_place_7 = null;
if(cljs.core.truth_(cr139584_place_6)){
(cr139584_state[(0)] = cr139584_block_3);

(cr139584_state[(1)] = cr139584_place_2);

(cr139584_state[(3)] = cr139584_place_5);

(cr139584_state[(2)] = cr139584_place_7);

return cr139584_state;
} else {
(cr139584_state[(0)] = cr139584_block_2);

(cr139584_state[(1)] = cr139584_place_2);

(cr139584_state[(2)] = cr139584_place_7);

return cr139584_state;
}
}catch (e139633){var cr139584_exception = e139633;
(cr139584_state[(0)] = null);

throw cr139584_exception;
}});
var cr139584_block_2 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_2(cr139584_state){
try{var cr139584_place_2 = (cr139584_state[(1)]);
var cr139584_place_8 = cr139584_place_2;
(cr139584_state[(0)] = cr139584_block_8);

(cr139584_state[(1)] = null);

(cr139584_state[(2)] = cr139584_place_8);

return cr139584_state;
}catch (e139640){var cr139584_exception = e139640;
(cr139584_state[(0)] = null);

(cr139584_state[(1)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_7 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_7(cr139584_state){
try{var cr139584_place_31 = (cr139584_state[(4)]);
(cr139584_state[(0)] = cr139584_block_8);

(cr139584_state[(4)] = null);

(cr139584_state[(2)] = cr139584_place_31);

return cr139584_state;
}catch (e139641){var cr139584_exception = e139641;
(cr139584_state[(0)] = null);

(cr139584_state[(4)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_6 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_6(cr139584_state){
try{var cr139584_place_27 = (cr139584_state[(5)]);
var cr139584_place_47 = cljs.core.js__GT_clj;
var cr139584_place_48 = JSON.parse;
var cr139584_place_49 = cr139584_place_27;
var cr139584_place_50 = (function (){var G__139648 = cr139584_place_49;
var fexpr__139647 = cr139584_place_48;
return (fexpr__139647.cljs$core$IFn$_invoke$arity$1 ? fexpr__139647.cljs$core$IFn$_invoke$arity$1(G__139648) : fexpr__139647.call(null,G__139648));
})();
var cr139584_place_51 = new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252);
var cr139584_place_52 = true;
var cr139584_place_53 = (function (){var G__139650 = cr139584_place_50;
var G__139651 = cr139584_place_51;
var G__139652 = cr139584_place_52;
var fexpr__139649 = cr139584_place_47;
return (fexpr__139649.cljs$core$IFn$_invoke$arity$3 ? fexpr__139649.cljs$core$IFn$_invoke$arity$3(G__139650,G__139651,G__139652) : fexpr__139649.call(null,G__139650,G__139651,G__139652));
})();
var cr139584_place_54 = frontend.worker.rtc.malli_schema.data_from_ws_coercer;
var cr139584_place_55 = cr139584_place_53;
var cr139584_place_56 = (function (){var G__139654 = cr139584_place_55;
var fexpr__139653 = cr139584_place_54;
return (fexpr__139653.cljs$core$IFn$_invoke$arity$1 ? fexpr__139653.cljs$core$IFn$_invoke$arity$1(G__139654) : fexpr__139653.call(null,G__139654));
})();
(cr139584_state[(0)] = cr139584_block_7);

(cr139584_state[(5)] = null);

(cr139584_state[(4)] = cr139584_place_56);

return cr139584_state;
}catch (e139645){var cr139584_exception = e139645;
(cr139584_state[(0)] = null);

(cr139584_state[(4)] = null);

(cr139584_state[(5)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_4 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_4(cr139584_state){
try{var cr139584_place_16 = missionary.core.unpark();
var cr139584_place_17 = cljs.core.__destructure_map;
var cr139584_place_18 = cr139584_place_16;
var cr139584_place_19 = (function (){var G__139657 = cr139584_place_18;
var fexpr__139656 = cr139584_place_17;
return (fexpr__139656.cljs$core$IFn$_invoke$arity$1 ? fexpr__139656.cljs$core$IFn$_invoke$arity$1(G__139657) : fexpr__139656.call(null,G__139657));
})();
var cr139584_place_20 = cljs.core.get;
var cr139584_place_21 = cr139584_place_19;
var cr139584_place_22 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr139584_place_23 = (function (){var G__139659 = cr139584_place_21;
var G__139660 = cr139584_place_22;
var fexpr__139658 = cr139584_place_20;
return (fexpr__139658.cljs$core$IFn$_invoke$arity$2 ? fexpr__139658.cljs$core$IFn$_invoke$arity$2(G__139659,G__139660) : fexpr__139658.call(null,G__139659,G__139660));
})();
var cr139584_place_24 = cljs.core.get;
var cr139584_place_25 = cr139584_place_19;
var cr139584_place_26 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr139584_place_27 = (function (){var G__139662 = cr139584_place_25;
var G__139663 = cr139584_place_26;
var fexpr__139661 = cr139584_place_24;
return (fexpr__139661.cljs$core$IFn$_invoke$arity$2 ? fexpr__139661.cljs$core$IFn$_invoke$arity$2(G__139662,G__139663) : fexpr__139661.call(null,G__139662,G__139663));
})();
var cr139584_place_28 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr139584_place_29 = cr139584_place_23;
var cr139584_place_30 = (function (){var G__139665 = cr139584_place_29;
var fexpr__139664 = cr139584_place_28;
return (fexpr__139664.cljs$core$IFn$_invoke$arity$1 ? fexpr__139664.cljs$core$IFn$_invoke$arity$1(G__139665) : fexpr__139664.call(null,G__139665));
})();
var cr139584_place_31 = null;
if(cljs.core.truth_(cr139584_place_30)){
(cr139584_state[(0)] = cr139584_block_6);

(cr139584_state[(1)] = null);

(cr139584_state[(4)] = cr139584_place_31);

(cr139584_state[(5)] = cr139584_place_27);

return cr139584_state;
} else {
(cr139584_state[(0)] = cr139584_block_5);

(cr139584_state[(3)] = cr139584_place_23);

(cr139584_state[(4)] = cr139584_place_31);

(cr139584_state[(5)] = cr139584_place_27);

return cr139584_state;
}
}catch (e139655){var cr139584_exception = e139655;
(cr139584_state[(0)] = null);

(cr139584_state[(1)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_3 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_3(cr139584_state){
try{var cr139584_place_5 = (cr139584_state[(3)]);
var cr139584_place_9 = cr139584_place_5;
var cr139584_place_10 = cljs_http_missionary.client.get;
var cr139584_place_11 = cr139584_place_9;
var cr139584_place_12 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr139584_place_13 = false;
var cr139584_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139584_place_12,cr139584_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139584_place_15 = (function (){var G__139670 = cr139584_place_11;
var G__139671 = cr139584_place_14;
var fexpr__139669 = cr139584_place_10;
return (fexpr__139669.cljs$core$IFn$_invoke$arity$2 ? fexpr__139669.cljs$core$IFn$_invoke$arity$2(G__139670,G__139671) : fexpr__139669.call(null,G__139670,G__139671));
})();
(cr139584_state[(0)] = cr139584_block_4);

(cr139584_state[(3)] = null);

return missionary.core.park(cr139584_place_15);
}catch (e139668){var cr139584_exception = e139668;
(cr139584_state[(0)] = null);

(cr139584_state[(3)] = null);

(cr139584_state[(1)] = null);

(cr139584_state[(2)] = null);

throw cr139584_exception;
}});
var cr139584_block_0 = (function frontend$worker$rtc$ws$recv_flow_$_cr139584_block_0(cr139584_state){
try{var cr139584_place_0 = (1);
var cr139584_place_1 = f;
(cr139584_state[(0)] = cr139584_block_1);

return missionary.core.fork(cr139584_place_0,cr139584_place_1);
}catch (e139678){var cr139584_exception = e139678;
(cr139584_state[(0)] = null);

throw cr139584_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139681 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__139681[(0)] = cr139584_block_0);

return G__139681;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a task: send message wait to recv its response and return it.
 *   Throw if timeout
 */
frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_ = (function frontend$worker$rtc$ws$send_AMPERSAND_recv_STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___139877 = arguments.length;
var i__5727__auto___139879 = (0);
while(true){
if((i__5727__auto___139879 < len__5726__auto___139877)){
args__5732__auto__.push((arguments[i__5727__auto___139879]));

var G__139880 = (i__5727__auto___139879 + (1));
i__5727__auto___139879 = G__139880;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (mws,message,p__139689){
var map__139690 = p__139689;
var map__139690__$1 = cljs.core.__destructure_map(map__139690);
var timeout_ms = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__139690__$1,new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406),(10000));
if(cljs.core.pos_int_QMARK_(timeout_ms)){
} else {
throw (new Error("Assert failed: (pos-int? timeout-ms)"));
}

if((!((new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(message) == null)))){
} else {
throw (new Error("Assert failed: (some? (:req-id message))"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139691_block_0 = (function frontend$worker$rtc$ws$cr139691_block_0(cr139691_state){
try{var cr139691_place_0 = frontend.worker.rtc.ws.send;
var cr139691_place_1 = mws;
var cr139691_place_2 = message;
var cr139691_place_3 = (function (){var G__139733 = cr139691_place_1;
var G__139734 = cr139691_place_2;
var fexpr__139732 = cr139691_place_0;
return (fexpr__139732.cljs$core$IFn$_invoke$arity$2 ? fexpr__139732.cljs$core$IFn$_invoke$arity$2(G__139733,G__139734) : fexpr__139732.call(null,G__139733,G__139734));
})();
(cr139691_state[(0)] = cr139691_block_1);

return missionary.core.park(cr139691_place_3);
}catch (e139728){var cr139691_exception = e139728;
(cr139691_state[(0)] = null);

throw cr139691_exception;
}});
var cr139691_block_1 = (function frontend$worker$rtc$ws$cr139691_block_1(cr139691_state){
try{var cr139691_place_4 = missionary.core.unpark();
var cr139691_place_5 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr139691_place_6 = message;
var cr139691_place_7 = cr139691_place_5.cljs$core$IFn$_invoke$arity$1(cr139691_place_6);
var cr139691_place_8 = missionary.core.timeout;
var cr139691_place_9 = missionary.core.reduce;
var cr139691_place_10 = (function (_,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cr139691_place_7,new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(v))){
return cljs.core.reduced(v);
} else {
return null;
}
});
var cr139691_place_11 = frontend.worker.rtc.ws.recv_flow;
var cr139691_place_12 = mws;
var cr139691_place_13 = (function (){var G__139738 = cr139691_place_12;
var fexpr__139737 = cr139691_place_11;
return (fexpr__139737.cljs$core$IFn$_invoke$arity$1 ? fexpr__139737.cljs$core$IFn$_invoke$arity$1(G__139738) : fexpr__139737.call(null,G__139738));
})();
var cr139691_place_14 = (function (){var G__139743 = cr139691_place_10;
var G__139744 = cr139691_place_13;
var fexpr__139742 = cr139691_place_9;
return (fexpr__139742.cljs$core$IFn$_invoke$arity$2 ? fexpr__139742.cljs$core$IFn$_invoke$arity$2(G__139743,G__139744) : fexpr__139742.call(null,G__139743,G__139744));
})();
var cr139691_place_15 = timeout_ms;
var cr139691_place_16 = (function (){var G__139746 = cr139691_place_14;
var G__139747 = cr139691_place_15;
var fexpr__139745 = cr139691_place_8;
return (fexpr__139745.cljs$core$IFn$_invoke$arity$2 ? fexpr__139745.cljs$core$IFn$_invoke$arity$2(G__139746,G__139747) : fexpr__139745.call(null,G__139746,G__139747));
})();
(cr139691_state[(0)] = cr139691_block_2);

return missionary.core.park(cr139691_place_16);
}catch (e139736){var cr139691_exception = e139736;
(cr139691_state[(0)] = null);

throw cr139691_exception;
}});
var cr139691_block_2 = (function frontend$worker$rtc$ws$cr139691_block_2(cr139691_state){
try{var cr139691_place_17 = missionary.core.unpark();
var cr139691_place_18 = cr139691_place_17;
var cr139691_place_19 = null;
if(cljs.core.truth_(cr139691_place_18)){
(cr139691_state[(0)] = cr139691_block_4);

(cr139691_state[(1)] = cr139691_place_17);

(cr139691_state[(2)] = cr139691_place_19);

return cr139691_state;
} else {
(cr139691_state[(0)] = cr139691_block_3);

return cr139691_state;
}
}catch (e139748){var cr139691_exception = e139748;
(cr139691_state[(0)] = null);

throw cr139691_exception;
}});
var cr139691_block_3 = (function frontend$worker$rtc$ws$cr139691_block_3(cr139691_state){
try{var cr139691_place_20 = cljs.core.ex_info;
var cr139691_place_21 = "recv timeout (";
var cr139691_place_22 = timeout_ms;
var cr139691_place_23 = "ms)";
var cr139691_place_24 = [cr139691_place_21,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr139691_place_22),cr139691_place_23].join('');
var cr139691_place_25 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr139691_place_26 = true;
var cr139691_place_27 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr139691_place_28 = new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739);
var cr139691_place_29 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr139691_place_30 = message;
var cr139691_place_31 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139691_place_25,cr139691_place_26,cr139691_place_27,cr139691_place_28,cr139691_place_29,cr139691_place_30]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139691_place_32 = (function (){var G__139753 = cr139691_place_24;
var G__139754 = cr139691_place_31;
var fexpr__139752 = cr139691_place_20;
return (fexpr__139752.cljs$core$IFn$_invoke$arity$2 ? fexpr__139752.cljs$core$IFn$_invoke$arity$2(G__139753,G__139754) : fexpr__139752.call(null,G__139753,G__139754));
})();
var cr139691_place_33 = (function(){throw cr139691_place_32})();
(cr139691_state[(0)] = null);

return null;
}catch (e139751){var cr139691_exception = e139751;
(cr139691_state[(0)] = null);

throw cr139691_exception;
}});
var cr139691_block_4 = (function frontend$worker$rtc$ws$cr139691_block_4(cr139691_state){
try{var cr139691_place_34 = null;
(cr139691_state[(0)] = cr139691_block_5);

(cr139691_state[(2)] = cr139691_place_34);

return cr139691_state;
}catch (e139755){var cr139691_exception = e139755;
(cr139691_state[(0)] = null);

(cr139691_state[(1)] = null);

(cr139691_state[(2)] = null);

throw cr139691_exception;
}});
var cr139691_block_5 = (function frontend$worker$rtc$ws$cr139691_block_5(cr139691_state){
try{var cr139691_place_17 = (cr139691_state[(1)]);
var cr139691_place_19 = (cr139691_state[(2)]);
var cr139691_place_35 = cr139691_place_17;
(cr139691_state[(0)] = null);

(cr139691_state[(1)] = null);

(cr139691_state[(2)] = null);

return cr139691_place_35;
}catch (e139758){var cr139691_exception = e139758;
(cr139691_state[(0)] = null);

(cr139691_state[(1)] = null);

(cr139691_state[(2)] = null);

throw cr139691_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139759 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__139759[(0)] = cr139691_block_0);

return G__139759;
})());
})(),missionary.core.sp_run);
}));

(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$lang$applyTo = (function (seq139683){
var G__139684 = cljs.core.first(seq139683);
var seq139683__$1 = cljs.core.next(seq139683);
var G__139685 = cljs.core.first(seq139683__$1);
var seq139683__$2 = cljs.core.next(seq139683__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__139684,G__139685,seq139683__$2);
}));

/**
 * Return a task that send the message then wait to recv its response.
 *   Throw if timeout
 */
frontend.worker.rtc.ws.send_AMPERSAND_recv = (function frontend$worker$rtc$ws$send_AMPERSAND_recv(var_args){
var args__5732__auto__ = [];
var len__5726__auto___139888 = arguments.length;
var i__5727__auto___139889 = (0);
while(true){
if((i__5727__auto___139889 < len__5726__auto___139888)){
args__5732__auto__.push((arguments[i__5727__auto___139889]));

var G__139890 = (i__5727__auto___139889 + (1));
i__5727__auto___139889 = G__139890;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$core$IFn$_invoke$arity$variadic = (function (mws,message,p__139769){
var map__139770 = p__139769;
var map__139770__$1 = cljs.core.__destructure_map(map__139770);
var timeout_ms = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__139770__$1,new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406),(10000));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139771_block_0 = (function frontend$worker$rtc$ws$cr139771_block_0(cr139771_state){
try{var cr139771_place_0 = cljs.core.random_uuid;
var cr139771_place_1 = (function (){var fexpr__139795 = cr139771_place_0;
return (fexpr__139795.cljs$core$IFn$_invoke$arity$0 ? fexpr__139795.cljs$core$IFn$_invoke$arity$0() : fexpr__139795.call(null));
})();
var cr139771_place_2 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr139771_place_1);
var cr139771_place_3 = cljs.core.assoc;
var cr139771_place_4 = message;
var cr139771_place_5 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr139771_place_6 = cr139771_place_2;
var cr139771_place_7 = (function (){var G__139797 = cr139771_place_4;
var G__139798 = cr139771_place_5;
var G__139799 = cr139771_place_6;
var fexpr__139796 = cr139771_place_3;
return (fexpr__139796.cljs$core$IFn$_invoke$arity$3 ? fexpr__139796.cljs$core$IFn$_invoke$arity$3(G__139797,G__139798,G__139799) : fexpr__139796.call(null,G__139797,G__139798,G__139799));
})();
var cr139771_place_8 = frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_;
var cr139771_place_9 = mws;
var cr139771_place_10 = cr139771_place_7;
var cr139771_place_11 = new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406);
var cr139771_place_12 = timeout_ms;
var cr139771_place_13 = (function (){var G__139804 = cr139771_place_9;
var G__139805 = cr139771_place_10;
var G__139806 = cr139771_place_11;
var G__139807 = cr139771_place_12;
var fexpr__139803 = cr139771_place_8;
return (fexpr__139803.cljs$core$IFn$_invoke$arity$4 ? fexpr__139803.cljs$core$IFn$_invoke$arity$4(G__139804,G__139805,G__139806,G__139807) : fexpr__139803.call(null,G__139804,G__139805,G__139806,G__139807));
})();
(cr139771_state[(0)] = cr139771_block_1);

return missionary.core.park(cr139771_place_13);
}catch (e139794){var cr139771_exception = e139794;
(cr139771_state[(0)] = null);

throw cr139771_exception;
}});
var cr139771_block_1 = (function frontend$worker$rtc$ws$cr139771_block_1(cr139771_state){
try{var cr139771_place_14 = missionary.core.unpark();
(cr139771_state[(0)] = null);

return cr139771_place_14;
}catch (e139812){var cr139771_exception = e139812;
(cr139771_state[(0)] = null);

throw cr139771_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139813 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__139813[(0)] = cr139771_block_0);

return G__139813;
})());
})(),missionary.core.sp_run);
}));

(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$lang$applyTo = (function (seq139766){
var G__139767 = cljs.core.first(seq139766);
var seq139766__$1 = cljs.core.next(seq139766);
var G__139768 = cljs.core.first(seq139766__$1);
var seq139766__$2 = cljs.core.next(seq139766__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__139767,G__139768,seq139766__$2);
}));


//# sourceMappingURL=frontend.worker.rtc.ws.js.map
