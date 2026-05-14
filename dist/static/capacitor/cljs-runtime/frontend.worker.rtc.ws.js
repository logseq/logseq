goog.provide('frontend.worker.rtc.ws');
frontend.worker.rtc.ws.get_state = (function frontend$worker$rtc$ws$get_state(ws){
var G__132490 = ws.readyState;
switch (G__132490) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__132490)].join('')));

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
var G__132506 = e.data;
return (mbx.cljs$core$IFn$_invoke$arity$1 ? mbx.cljs$core$IFn$_invoke$arity$1(G__132506) : mbx.call(null,G__132506));
}));

(ws.onclose = (function (e){
(ws.onclose = null);

return (close_dfv.cljs$core$IFn$_invoke$arity$1 ? close_dfv.cljs$core$IFn$_invoke$arity$1(e) : close_dfv.call(null,e));
}));

var G__132515 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [mbx,ws,close_dfv], null);
return (s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(G__132515) : s_BANG_.call(null,G__132515));
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
}catch (e132504){var e = e132504;
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr132534_block_0 = (function frontend$worker$rtc$ws$create_mws_STAR__$_cr132534_block_0(cr132534_state){
try{var cr132534_place_0 = frontend.worker.rtc.ws.open_ws_task;
var cr132534_place_1 = url;
var cr132534_place_2 = (function (){var G__133108 = cr132534_place_1;
var fexpr__133107 = cr132534_place_0;
return (fexpr__133107.cljs$core$IFn$_invoke$arity$1 ? fexpr__133107.cljs$core$IFn$_invoke$arity$1(G__133108) : fexpr__133107.call(null,G__133108));
})();
(cr132534_state[(0)] = cr132534_block_1);

return missionary.core.park(cr132534_place_2);
}catch (e133106){var cr132534_exception = e133106;
(cr132534_state[(0)] = null);

throw cr132534_exception;
}});
var cr132534_block_1 = (function frontend$worker$rtc$ws$create_mws_STAR__$_cr132534_block_1(cr132534_state){
try{var cr132534_place_3 = missionary.core.unpark();
var cr132534_place_4 = cljs.core.nth;
var cr132534_place_5 = cr132534_place_3;
var cr132534_place_6 = (0);
var cr132534_place_7 = null;
var cr132534_place_8 = (function (){var G__133113 = cr132534_place_5;
var G__133114 = cr132534_place_6;
var G__133115 = cr132534_place_7;
var fexpr__133112 = cr132534_place_4;
return (fexpr__133112.cljs$core$IFn$_invoke$arity$3 ? fexpr__133112.cljs$core$IFn$_invoke$arity$3(G__133113,G__133114,G__133115) : fexpr__133112.call(null,G__133113,G__133114,G__133115));
})();
var cr132534_place_9 = cljs.core.nth;
var cr132534_place_10 = cr132534_place_3;
var cr132534_place_11 = (1);
var cr132534_place_12 = null;
var cr132534_place_13 = (function (){var G__133117 = cr132534_place_10;
var G__133118 = cr132534_place_11;
var G__133119 = cr132534_place_12;
var fexpr__133116 = cr132534_place_9;
return (fexpr__133116.cljs$core$IFn$_invoke$arity$3 ? fexpr__133116.cljs$core$IFn$_invoke$arity$3(G__133117,G__133118,G__133119) : fexpr__133116.call(null,G__133117,G__133118,G__133119));
})();
var cr132534_place_14 = cljs.core.nth;
var cr132534_place_15 = cr132534_place_3;
var cr132534_place_16 = (2);
var cr132534_place_17 = null;
var cr132534_place_18 = (function (){var G__133121 = cr132534_place_15;
var G__133122 = cr132534_place_16;
var G__133123 = cr132534_place_17;
var fexpr__133120 = cr132534_place_14;
return (fexpr__133120.cljs$core$IFn$_invoke$arity$3 ? fexpr__133120.cljs$core$IFn$_invoke$arity$3(G__133121,G__133122,G__133123) : fexpr__133120.call(null,G__133121,G__133122,G__133123));
})();
var cr132534_place_19 = new cljs.core.Keyword(null,"raw-ws","raw-ws",-1415558997);
var cr132534_place_20 = cr132534_place_13;
var cr132534_place_21 = new cljs.core.Keyword(null,"send","send",-652151114);
var cr132534_place_22 = (function (data){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr132540_block_0 = (function (cr132540_state){
try{var cr132540_place_0 = frontend.worker.rtc.ws.handle_close;
var cr132540_place_1 = missionary.core.race;
var cr132540_place_2 = cr132534_place_18;
var cr132540_place_3 = cljs.core.partial;
var cr132540_place_4 = (function (cr132541_state){
try{(cr132541_state[(0)] = cr132540_place_5);

return cr132541_state;
}catch (e133178){var e132762 = e133178;
var e132563 = e132762;
var cr132541_exception = e132563;
(cr132541_state[(0)] = null);

throw cr132541_exception;
}});
var cr132540_place_5 = (function (cr132541_state){
try{var cr132541_place_0 = (4096);
var cr132541_place_1 = cr132534_place_13;
var cr132541_place_2 = cr132541_place_1.bufferedAmount;
var cr132541_place_3 = (cr132541_place_0 < cr132541_place_2);
var cr132541_place_4 = null;
if(cr132541_place_3){
(cr132541_state[(0)] = cr132540_place_7);

return cr132541_state;
} else {
(cr132541_state[(0)] = cr132540_place_6);

(cr132541_state[(1)] = cr132541_place_4);

return cr132541_state;
}
}catch (e133180){var e132763 = e133180;
var e132568 = e132763;
var cr132541_exception = e132568;
(cr132541_state[(0)] = null);

throw cr132541_exception;
}});
var cr132540_place_6 = (function (cr132541_state){
try{var cr132541_place_5 = null;
(cr132541_state[(0)] = cr132540_place_9);

(cr132541_state[(1)] = cr132541_place_5);

return cr132541_state;
}catch (e133182){var e132766 = e133182;
var e132569 = e132766;
var cr132541_exception = e132569;
(cr132541_state[(0)] = null);

(cr132541_state[(1)] = null);

throw cr132541_exception;
}});
var cr132540_place_7 = (function (cr132541_state){
try{var cr132541_place_6 = missionary.core.sleep;
var cr132541_place_7 = (50);
var cr132541_place_8 = (function (){var G__132575 = cr132541_place_7;
var fexpr__132574 = cr132541_place_6;
var G__132769 = G__132575;
var fexpr__132768 = fexpr__132574;
var G__133185 = G__132769;
var fexpr__133184 = fexpr__132768;
return (fexpr__133184.cljs$core$IFn$_invoke$arity$1 ? fexpr__133184.cljs$core$IFn$_invoke$arity$1(G__133185) : fexpr__133184.call(null,G__133185));
})();
(cr132541_state[(0)] = cr132540_place_8);

return missionary.core.park(cr132541_place_8);
}catch (e133183){var e132767 = e133183;
var e132572 = e132767;
var cr132541_exception = e132572;
(cr132541_state[(0)] = null);

throw cr132541_exception;
}});
var cr132540_place_8 = (function (cr132541_state){
try{var cr132541_place_9 = missionary.core.unpark();
(cr132541_state[(0)] = cr132540_place_5);

return cr132541_state;
}catch (e133186){var e132770 = e133186;
var e132579 = e132770;
var cr132541_exception = e132579;
(cr132541_state[(0)] = null);

throw cr132541_exception;
}});
var cr132540_place_9 = (function (cr132541_state){
try{var cr132541_place_4 = (cr132541_state[(1)]);
var cr132541_place_10 = cr132534_place_13;
var cr132541_place_11 = data;
var cr132541_place_12 = cr132541_place_10.send(cr132541_place_11);
(cr132541_state[(0)] = null);

(cr132541_state[(1)] = null);

return cr132541_place_12;
}catch (e133187){var e132773 = e133187;
var e132580 = e132773;
var cr132541_exception = e132580;
(cr132541_state[(0)] = null);

(cr132541_state[(1)] = null);

throw cr132541_exception;
}});
var cr132540_place_10 = cloroutine.impl.coroutine;
var cr132540_place_11 = cljs.core.object_array;
var cr132540_place_12 = (2);
var cr132540_place_13 = (function (){var G__132779 = cr132540_place_12;
var fexpr__132778 = cr132540_place_11;
var G__133191 = G__132779;
var fexpr__133190 = fexpr__132778;
return (fexpr__133190.cljs$core$IFn$_invoke$arity$1 ? fexpr__133190.cljs$core$IFn$_invoke$arity$1(G__133191) : fexpr__133190.call(null,G__133191));
})();
var cr132540_place_14 = cr132540_place_13;
var cr132540_place_15 = (0);
var cr132540_place_16 = cr132540_place_4;
var cr132540_place_17 = (cr132540_place_14[cr132540_place_15] = cr132540_place_16);
var cr132540_place_18 = cr132540_place_13;
var cr132540_place_19 = (function (){var G__132785 = cr132540_place_18;
var fexpr__132784 = cr132540_place_10;
var G__133193 = G__132785;
var fexpr__133192 = fexpr__132784;
return (fexpr__133192.cljs$core$IFn$_invoke$arity$1 ? fexpr__133192.cljs$core$IFn$_invoke$arity$1(G__133193) : fexpr__133192.call(null,G__133193));
})();
var cr132540_place_20 = missionary.core.sp_run;
var cr132540_place_21 = (function (){var G__132787 = cr132540_place_19;
var G__132788 = cr132540_place_20;
var fexpr__132786 = cr132540_place_3;
var G__133195 = G__132787;
var G__133196 = G__132788;
var fexpr__133194 = fexpr__132786;
return (fexpr__133194.cljs$core$IFn$_invoke$arity$2 ? fexpr__133194.cljs$core$IFn$_invoke$arity$2(G__133195,G__133196) : fexpr__133194.call(null,G__133195,G__133196));
})();
var cr132540_place_22 = (function (){var G__132790 = cr132540_place_2;
var G__132791 = cr132540_place_21;
var fexpr__132789 = cr132540_place_1;
var G__133198 = G__132790;
var G__133199 = G__132791;
var fexpr__133197 = fexpr__132789;
return (fexpr__133197.cljs$core$IFn$_invoke$arity$2 ? fexpr__133197.cljs$core$IFn$_invoke$arity$2(G__133198,G__133199) : fexpr__133197.call(null,G__133198,G__133199));
})();
(cr132540_state[(0)] = cr132540_block_1);

(cr132540_state[(1)] = cr132540_place_0);

return missionary.core.park(cr132540_place_22);
}catch (e133167){var e132745 = e133167;
var cr132540_exception = e132745;
(cr132540_state[(0)] = null);

throw cr132540_exception;
}});
var cr132540_block_1 = (function (cr132540_state){
try{var cr132540_place_0 = (cr132540_state[(1)]);
var cr132540_place_23 = missionary.core.unpark();
var cr132540_place_24 = (function (){var G__132796 = cr132540_place_23;
var fexpr__132795 = cr132540_place_0;
var G__133202 = G__132796;
var fexpr__133201 = fexpr__132795;
return (fexpr__133201.cljs$core$IFn$_invoke$arity$1 ? fexpr__133201.cljs$core$IFn$_invoke$arity$1(G__133202) : fexpr__133201.call(null,G__133202));
})();
(cr132540_state[(0)] = null);

(cr132540_state[(1)] = null);

return cr132540_place_24;
}catch (e133200){var e132792 = e133200;
var cr132540_exception = e132792;
(cr132540_state[(0)] = null);

(cr132540_state[(1)] = null);

throw cr132540_exception;
}});
return cloroutine.impl.coroutine((function (){var G__132799 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__132799[(0)] = cr132540_block_0);

return G__132799;
})());
})(),missionary.core.sp_run);
});
var cr132534_place_23 = new cljs.core.Keyword(null,"recv-flow","recv-flow",-938720709);
var cr132534_place_24 = missionary.core.stream;
var cr132534_place_25 = cljs.core.partial;
var cr132534_place_26 = (function (cr132800_state){
try{(cr132800_state[(0)] = cr132534_place_27);

return cr132800_state;
}catch (e133227){var e132839 = e133227;
var cr132800_exception = e132839;
(cr132800_state[(0)] = null);

throw cr132800_exception;
}});
var cr132534_place_27 = (function (cr132800_state){
try{var cr132800_place_0 = (1);
var cr132800_place_1 = missionary.core.seed;
var cr132800_place_2 = cljs.core.range;
var cr132800_place_3 = (2);
var cr132800_place_4 = (function (){var G__132846 = cr132800_place_3;
var fexpr__132845 = cr132800_place_2;
var G__133232 = G__132846;
var fexpr__133231 = fexpr__132845;
return (fexpr__133231.cljs$core$IFn$_invoke$arity$1 ? fexpr__133231.cljs$core$IFn$_invoke$arity$1(G__133232) : fexpr__133231.call(null,G__133232));
})();
var cr132800_place_5 = (function (){var G__132848 = cr132800_place_4;
var fexpr__132847 = cr132800_place_1;
var G__133234 = G__132848;
var fexpr__133233 = fexpr__132847;
return (fexpr__133233.cljs$core$IFn$_invoke$arity$1 ? fexpr__133233.cljs$core$IFn$_invoke$arity$1(G__133234) : fexpr__133233.call(null,G__133234));
})();
(cr132800_state[(0)] = cr132534_place_28);

return missionary.core.fork(cr132800_place_0,cr132800_place_5);
}catch (e133229){var e132840 = e133229;
var cr132800_exception = e132840;
(cr132800_state[(0)] = null);

throw cr132800_exception;
}});
var cr132534_place_28 = (function (cr132800_state){
try{var cr132800_place_6 = missionary.core.unpark();
var cr132800_place_7 = cr132800_place_6;
var cr132800_place_8 = null;
var G__132857 = cr132800_place_7;
var G__133236 = G__132857;
switch (G__133236) {
case (0):
(cr132800_state[(0)] = cr132534_place_29);

(cr132800_state[(1)] = cr132800_place_8);

return cr132800_state;

break;
case (1):
(cr132800_state[(0)] = cr132534_place_31);

return cr132800_state;

break;
default:
(cr132800_state[(0)] = cr132534_place_32);

(cr132800_state[(1)] = cr132800_place_6);

return cr132800_state;

}
}catch (e133235){var e132853 = e133235;
var cr132800_exception = e132853;
(cr132800_state[(0)] = null);

throw cr132800_exception;
}});
var cr132534_place_29 = (function (cr132800_state){
try{var cr132800_place_9 = frontend.worker.rtc.ws.handle_close;
var cr132800_place_10 = missionary.core.race;
var cr132800_place_11 = cr132534_place_18;
var cr132800_place_12 = cr132534_place_8;
var cr132800_place_13 = (function (){var G__132861 = cr132800_place_11;
var G__132862 = cr132800_place_12;
var fexpr__132860 = cr132800_place_10;
var G__133239 = G__132861;
var G__133240 = G__132862;
var fexpr__133238 = fexpr__132860;
return (fexpr__133238.cljs$core$IFn$_invoke$arity$2 ? fexpr__133238.cljs$core$IFn$_invoke$arity$2(G__133239,G__133240) : fexpr__133238.call(null,G__133239,G__133240));
})();
(cr132800_state[(0)] = cr132534_place_30);

(cr132800_state[(2)] = cr132800_place_9);

return missionary.core.park(cr132800_place_13);
}catch (e133237){var e132859 = e133237;
var cr132800_exception = e132859;
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

throw cr132800_exception;
}});
var cr132534_place_30 = (function (cr132800_state){
try{var cr132800_place_9 = (cr132800_state[(2)]);
var cr132800_place_14 = missionary.core.unpark();
var cr132800_place_15 = (function (){var G__132865 = cr132800_place_14;
var fexpr__132864 = cr132800_place_9;
var G__133243 = G__132865;
var fexpr__133242 = fexpr__132864;
return (fexpr__133242.cljs$core$IFn$_invoke$arity$1 ? fexpr__133242.cljs$core$IFn$_invoke$arity$1(G__133243) : fexpr__133242.call(null,G__133243));
})();
(cr132800_state[(0)] = cr132534_place_33);

(cr132800_state[(2)] = null);

(cr132800_state[(1)] = cr132800_place_15);

return cr132800_state;
}catch (e133241){var e132863 = e133241;
var cr132800_exception = e132863;
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

(cr132800_state[(2)] = null);

throw cr132800_exception;
}});
var cr132534_place_31 = (function (cr132800_state){
try{(cr132800_state[(0)] = cr132534_place_27);

return cr132800_state;
}catch (e133245){var e132866 = e133245;
var cr132800_exception = e132866;
(cr132800_state[(0)] = null);

throw cr132800_exception;
}});
var cr132534_place_32 = (function (cr132800_state){
try{var cr132800_place_6 = (cr132800_state[(1)]);
var cr132800_place_16 = "No matching clause: ";
var cr132800_place_17 = cr132800_place_6;
var cr132800_place_18 = [cr132800_place_16,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr132800_place_17)].join('');
var cr132800_place_19 = (new Error(cr132800_place_18));
var cr132800_place_20 = (function(){throw cr132800_place_19})();
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

return null;
}catch (e133246){var e132868 = e133246;
var cr132800_exception = e132868;
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

throw cr132800_exception;
}});
var cr132534_place_33 = (function (cr132800_state){
try{var cr132800_place_8 = (cr132800_state[(1)]);
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

return cr132800_place_8;
}catch (e133248){var e132873 = e133248;
var cr132800_exception = e132873;
(cr132800_state[(0)] = null);

(cr132800_state[(1)] = null);

throw cr132800_exception;
}});
var cr132534_place_34 = cloroutine.impl.coroutine;
var cr132534_place_35 = cljs.core.object_array;
var cr132534_place_36 = (3);
var cr132534_place_37 = (function (){var G__133250 = cr132534_place_36;
var fexpr__133249 = cr132534_place_35;
return (fexpr__133249.cljs$core$IFn$_invoke$arity$1 ? fexpr__133249.cljs$core$IFn$_invoke$arity$1(G__133250) : fexpr__133249.call(null,G__133250));
})();
var cr132534_place_38 = cr132534_place_37;
var cr132534_place_39 = (0);
var cr132534_place_40 = cr132534_place_26;
var cr132534_place_41 = (cr132534_place_38[cr132534_place_39] = cr132534_place_40);
var cr132534_place_42 = cr132534_place_37;
var cr132534_place_43 = (function (){var G__133252 = cr132534_place_42;
var fexpr__133251 = cr132534_place_34;
return (fexpr__133251.cljs$core$IFn$_invoke$arity$1 ? fexpr__133251.cljs$core$IFn$_invoke$arity$1(G__133252) : fexpr__133251.call(null,G__133252));
})();
var cr132534_place_44 = missionary.core.ap_run;
var cr132534_place_45 = (function (){var G__133254 = cr132534_place_43;
var G__133255 = cr132534_place_44;
var fexpr__133253 = cr132534_place_25;
return (fexpr__133253.cljs$core$IFn$_invoke$arity$2 ? fexpr__133253.cljs$core$IFn$_invoke$arity$2(G__133254,G__133255) : fexpr__133253.call(null,G__133254,G__133255));
})();
var cr132534_place_46 = (function (){var G__133257 = cr132534_place_45;
var fexpr__133256 = cr132534_place_24;
return (fexpr__133256.cljs$core$IFn$_invoke$arity$1 ? fexpr__133256.cljs$core$IFn$_invoke$arity$1(G__133257) : fexpr__133256.call(null,G__133257));
})();
var cr132534_place_47 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr132534_place_19,cr132534_place_20,cr132534_place_21,cr132534_place_22,cr132534_place_23,cr132534_place_46]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr132534_state[(0)] = null);

return cr132534_place_47;
}catch (e133109){var cr132534_exception = e133109;
(cr132534_state[(0)] = null);

throw cr132534_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133258 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__133258[(0)] = cr132534_block_0);

return G__133258;
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
var len__5726__auto___133721 = arguments.length;
var i__5727__auto___133722 = (0);
while(true){
if((i__5727__auto___133722 < len__5726__auto___133721)){
args__5732__auto__.push((arguments[i__5727__auto___133722]));

var G__133723 = (i__5727__auto___133722 + (1));
i__5727__auto___133722 = G__133723;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__133267){
var map__133269 = p__133267;
var map__133269__$1 = cljs.core.__destructure_map(map__133269);
var retry_count = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133269__$1,new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),(10));
var open_ws_timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133269__$1,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),(10000));
if(((cljs.core.pos_int_QMARK_(retry_count)) && (cljs.core.pos_int_QMARK_(open_ws_timeout)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [retry_count,open_ws_timeout], null)),"\n","(and (pos-int? retry-count) (pos-int? open-ws-timeout))"].join('')));
}

return frontend.common.missionary.backoff(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166),cljs.core.take.cljs$core$IFn$_invoke$arity$2(retry_count,frontend.common.missionary.delays),new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377),frontend.worker.flows.online_event_flow], null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133274_block_1 = (function frontend$worker$rtc$ws$cr133274_block_1(cr133274_state){
try{var cr133274_place_2 = missionary.core.timeout;
var cr133274_place_3 = frontend.worker.rtc.ws.create_mws_STAR_;
var cr133274_place_4 = url;
var cr133274_place_5 = (function (){var G__133336 = cr133274_place_4;
var fexpr__133335 = cr133274_place_3;
return (fexpr__133335.cljs$core$IFn$_invoke$arity$1 ? fexpr__133335.cljs$core$IFn$_invoke$arity$1(G__133336) : fexpr__133335.call(null,G__133336));
})();
var cr133274_place_6 = open_ws_timeout;
var cr133274_place_7 = (function (){var G__133338 = cr133274_place_5;
var G__133339 = cr133274_place_6;
var fexpr__133337 = cr133274_place_2;
return (fexpr__133337.cljs$core$IFn$_invoke$arity$2 ? fexpr__133337.cljs$core$IFn$_invoke$arity$2(G__133338,G__133339) : fexpr__133337.call(null,G__133338,G__133339));
})();
(cr133274_state[(0)] = cr133274_block_2);

return missionary.core.park(cr133274_place_7);
}catch (e133333){var cr133274_exception = e133333;
(cr133274_state[(0)] = cr133274_block_6);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_6 = (function frontend$worker$rtc$ws$cr133274_block_6(cr133274_state){
try{var cr133274_place_0 = (cr133274_state[(1)]);
var cr133274_place_22 = cr133274_place_0;
var cr133274_place_23 = CloseEvent;
var cr133274_place_24 = (cr133274_place_22 instanceof cr133274_place_23);
var cr133274_place_25 = null;
if(cr133274_place_24){
(cr133274_state[(0)] = cr133274_block_11);

return cr133274_state;
} else {
(cr133274_state[(0)] = cr133274_block_7);

(cr133274_state[(3)] = cr133274_place_25);

return cr133274_state;
}
}catch (e133340){var cr133274_exception = e133340;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_0 = (function frontend$worker$rtc$ws$cr133274_block_0(cr133274_state){
try{var cr133274_place_0 = null;
var cr133274_place_1 = false;
(cr133274_state[(0)] = cr133274_block_1);

(cr133274_state[(1)] = cr133274_place_0);

(cr133274_state[(2)] = cr133274_place_1);

return cr133274_state;
}catch (e133341){var cr133274_exception = e133341;
(cr133274_state[(0)] = null);

throw cr133274_exception;
}});
var cr133274_block_4 = (function frontend$worker$rtc$ws$cr133274_block_4(cr133274_state){
try{var cr133274_place_8 = (cr133274_state[(3)]);
var cr133274_place_20 = cr133274_place_8;
var cr133274_place_21 = cr133274_place_20;
(cr133274_state[(0)] = cr133274_block_5);

(cr133274_state[(3)] = null);

(cr133274_state[(4)] = cr133274_place_21);

return cr133274_state;
}catch (e133342){var cr133274_exception = e133342;
(cr133274_state[(0)] = cr133274_block_6);

(cr133274_state[(3)] = null);

(cr133274_state[(4)] = null);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_13 = (function frontend$worker$rtc$ws$cr133274_block_13(cr133274_state){
try{var cr133274_place_0 = (cr133274_state[(1)]);
var cr133274_place_1 = (cr133274_state[(2)]);
var cr133274_place_40 = (cljs.core.truth_(cr133274_place_1)?(function(){throw cr133274_place_0})():cr133274_place_0);
(cr133274_state[(0)] = null);

(cr133274_state[(1)] = null);

(cr133274_state[(2)] = null);

return cr133274_place_40;
}catch (e133343){var cr133274_exception = e133343;
(cr133274_state[(0)] = null);

(cr133274_state[(1)] = null);

(cr133274_state[(2)] = null);

throw cr133274_exception;
}});
var cr133274_block_5 = (function frontend$worker$rtc$ws$cr133274_block_5(cr133274_state){
try{var cr133274_place_10 = (cr133274_state[(4)]);
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(4)] = null);

(cr133274_state[(1)] = cr133274_place_10);

return cr133274_state;
}catch (e133344){var cr133274_exception = e133344;
(cr133274_state[(0)] = cr133274_block_6);

(cr133274_state[(4)] = null);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_3 = (function frontend$worker$rtc$ws$cr133274_block_3(cr133274_state){
try{var cr133274_place_11 = cljs.core.ex_info;
var cr133274_place_12 = "open websocket timeout";
var cr133274_place_13 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr133274_place_14 = true;
var cr133274_place_15 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr133274_place_16 = new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739);
var cr133274_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133274_place_15,cr133274_place_16,cr133274_place_13,cr133274_place_14]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133274_place_18 = (function (){var G__133349 = cr133274_place_12;
var G__133350 = cr133274_place_17;
var fexpr__133348 = cr133274_place_11;
return (fexpr__133348.cljs$core$IFn$_invoke$arity$2 ? fexpr__133348.cljs$core$IFn$_invoke$arity$2(G__133349,G__133350) : fexpr__133348.call(null,G__133349,G__133350));
})();
var cr133274_place_19 = (function(){throw cr133274_place_18})();
(cr133274_state[(0)] = null);

(cr133274_state[(1)] = null);

(cr133274_state[(2)] = null);

return null;
}catch (e133347){var cr133274_exception = e133347;
(cr133274_state[(0)] = cr133274_block_6);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_8 = (function frontend$worker$rtc$ws$cr133274_block_8(cr133274_state){
try{var cr133274_place_28 = null;
(cr133274_state[(0)] = cr133274_block_10);

(cr133274_state[(4)] = cr133274_place_28);

return cr133274_state;
}catch (e133352){var cr133274_exception = e133352;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(3)] = null);

(cr133274_state[(4)] = null);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_7 = (function frontend$worker$rtc$ws$cr133274_block_7(cr133274_state){
try{var cr133274_place_26 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr133274_place_27 = null;
if(cljs.core.truth_(cr133274_place_26)){
(cr133274_state[(0)] = cr133274_block_9);

(cr133274_state[(3)] = null);

return cr133274_state;
} else {
(cr133274_state[(0)] = cr133274_block_8);

(cr133274_state[(4)] = cr133274_place_27);

return cr133274_state;
}
}catch (e133355){var cr133274_exception = e133355;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(3)] = null);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_2 = (function frontend$worker$rtc$ws$cr133274_block_2(cr133274_state){
try{var cr133274_place_8 = missionary.core.unpark();
var cr133274_place_9 = cr133274_place_8;
var cr133274_place_10 = null;
if(cljs.core.truth_(cr133274_place_9)){
(cr133274_state[(0)] = cr133274_block_4);

(cr133274_state[(3)] = cr133274_place_8);

(cr133274_state[(4)] = cr133274_place_10);

return cr133274_state;
} else {
(cr133274_state[(0)] = cr133274_block_3);

return cr133274_state;
}
}catch (e133357){var cr133274_exception = e133357;
(cr133274_state[(0)] = cr133274_block_6);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_12 = (function frontend$worker$rtc$ws$cr133274_block_12(cr133274_state){
try{var cr133274_place_25 = (cr133274_state[(3)]);
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(3)] = null);

(cr133274_state[(1)] = cr133274_place_25);

return cr133274_state;
}catch (e133360){var cr133274_exception = e133360;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(3)] = null);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_9 = (function frontend$worker$rtc$ws$cr133274_block_9(cr133274_state){
try{var cr133274_place_0 = (cr133274_state[(1)]);
var cr133274_place_29 = cr133274_place_0;
var cr133274_place_30 = (function(){throw cr133274_place_29})();
(cr133274_state[(0)] = null);

(cr133274_state[(1)] = null);

(cr133274_state[(2)] = null);

return null;
}catch (e133363){var cr133274_exception = e133363;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
var cr133274_block_11 = (function frontend$worker$rtc$ws$cr133274_block_11(cr133274_state){
try{var cr133274_place_0 = (cr133274_state[(1)]);
var cr133274_place_31 = cr133274_place_0;
var cr133274_place_32 = cljs.core.ex_info;
var cr133274_place_33 = "failed to open websocket conn";
var cr133274_place_34 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr133274_place_35 = true;
var cr133274_place_36 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133274_place_34,cr133274_place_35]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133274_place_37 = cr133274_place_31;
var cr133274_place_38 = (function (){var G__133366 = cr133274_place_33;
var G__133367 = cr133274_place_36;
var G__133368 = cr133274_place_37;
var fexpr__133365 = cr133274_place_32;
return (fexpr__133365.cljs$core$IFn$_invoke$arity$3 ? fexpr__133365.cljs$core$IFn$_invoke$arity$3(G__133366,G__133367,G__133368) : fexpr__133365.call(null,G__133366,G__133367,G__133368));
})();
var cr133274_place_39 = (function(){throw cr133274_place_38})();
(cr133274_state[(0)] = null);

(cr133274_state[(1)] = null);

(cr133274_state[(2)] = null);

return null;
}catch (e133364){var cr133274_exception = e133364;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(1)] = cr133274_exception);

(cr133274_state[(2)] = true);

return cr133274_state;
}});
var cr133274_block_10 = (function frontend$worker$rtc$ws$cr133274_block_10(cr133274_state){
try{var cr133274_place_27 = (cr133274_state[(4)]);
(cr133274_state[(0)] = cr133274_block_12);

(cr133274_state[(4)] = null);

(cr133274_state[(3)] = cr133274_place_27);

return cr133274_state;
}catch (e133369){var cr133274_exception = e133369;
(cr133274_state[(0)] = cr133274_block_13);

(cr133274_state[(3)] = null);

(cr133274_state[(4)] = null);

(cr133274_state[(2)] = true);

(cr133274_state[(1)] = cr133274_exception);

return cr133274_state;
}});
return cloroutine.impl.coroutine((function (){var G__133372 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__133372[(0)] = cr133274_block_0);

return G__133372;
})());
})(),missionary.core.sp_run));
}));

(frontend.worker.rtc.ws.mws_create.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.rtc.ws.mws_create.cljs$lang$applyTo = (function (seq133261){
var G__133262 = cljs.core.first(seq133261);
var seq133261__$1 = cljs.core.next(seq133261);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__133262,seq133261__$1);
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

var G__133377 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__133377) : emit_BANG_.call(null,G__133377));
}));

(ws.onerror = (function (e){
if(cljs.core.truth_(old_onerror)){
(old_onerror.cljs$core$IFn$_invoke$arity$1 ? old_onerror.cljs$core$IFn$_invoke$arity$1(e) : old_onerror.call(null,e));
} else {
}

var G__133378 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__133378) : emit_BANG_.call(null,G__133378));
}));

(ws.onopen = (function (e){
if(cljs.core.truth_(old_onopen)){
(old_onopen.cljs$core$IFn$_invoke$arity$1 ? old_onopen.cljs$core$IFn$_invoke$arity$1(e) : old_onopen.call(null,e));
} else {
}

var G__133379 = frontend.worker.rtc.ws.get_state(ws);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__133379) : emit_BANG_.call(null,G__133379));
}));

var G__133381_133735 = frontend.worker.rtc.ws.get_state(ws);
(emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(G__133381_133735) : emit_BANG_.call(null,G__133381_133735));

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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133382_block_0 = (function frontend$worker$rtc$ws$send_$_cr133382_block_0(cr133382_state){
try{var cr133382_place_0 = frontend.worker.rtc.malli_schema.data_to_ws_coercer;
var cr133382_place_1 = message;
var cr133382_place_2 = (function (){var G__133398 = cr133382_place_1;
var fexpr__133397 = cr133382_place_0;
return (fexpr__133397.cljs$core$IFn$_invoke$arity$1 ? fexpr__133397.cljs$core$IFn$_invoke$arity$1(G__133398) : fexpr__133397.call(null,G__133398));
})();
var cr133382_place_3 = JSON.stringify;
var cr133382_place_4 = cljs.core.clj__GT_js;
var cr133382_place_5 = frontend.worker.rtc.malli_schema.data_to_ws_encoder;
var cr133382_place_6 = cr133382_place_2;
var cr133382_place_7 = (function (){var G__133400 = cr133382_place_6;
var fexpr__133399 = cr133382_place_5;
return (fexpr__133399.cljs$core$IFn$_invoke$arity$1 ? fexpr__133399.cljs$core$IFn$_invoke$arity$1(G__133400) : fexpr__133399.call(null,G__133400));
})();
var cr133382_place_8 = (function (){var G__133402 = cr133382_place_7;
var fexpr__133401 = cr133382_place_4;
return (fexpr__133401.cljs$core$IFn$_invoke$arity$1 ? fexpr__133401.cljs$core$IFn$_invoke$arity$1(G__133402) : fexpr__133401.call(null,G__133402));
})();
var cr133382_place_9 = (function (){var G__133404 = cr133382_place_8;
var fexpr__133403 = cr133382_place_3;
return (fexpr__133403.cljs$core$IFn$_invoke$arity$1 ? fexpr__133403.cljs$core$IFn$_invoke$arity$1(G__133404) : fexpr__133403.call(null,G__133404));
})();
var cr133382_place_10 = new cljs.core.Keyword(null,"send","send",-652151114);
var cr133382_place_11 = mws;
var cr133382_place_12 = cr133382_place_10.cljs$core$IFn$_invoke$arity$1(cr133382_place_11);
var cr133382_place_13 = cr133382_place_12;
var cr133382_place_14 = cr133382_place_9;
var cr133382_place_15 = (function (){var G__133406 = cr133382_place_14;
var fexpr__133405 = cr133382_place_13;
return (fexpr__133405.cljs$core$IFn$_invoke$arity$1 ? fexpr__133405.cljs$core$IFn$_invoke$arity$1(G__133406) : fexpr__133405.call(null,G__133406));
})();
(cr133382_state[(0)] = cr133382_block_1);

return missionary.core.park(cr133382_place_15);
}catch (e133396){var cr133382_exception = e133396;
(cr133382_state[(0)] = null);

throw cr133382_exception;
}});
var cr133382_block_1 = (function frontend$worker$rtc$ws$send_$_cr133382_block_1(cr133382_state){
try{var cr133382_place_16 = missionary.core.unpark();
(cr133382_state[(0)] = null);

return cr133382_place_16;
}catch (e133407){var cr133382_exception = e133407;
(cr133382_state[(0)] = null);

throw cr133382_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133408 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__133408[(0)] = cr133382_block_0);

return G__133408;
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

return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__133409_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(p1__133409_SHARP_),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133410_block_0 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_0(cr133410_state){
try{var cr133410_place_0 = (1);
var cr133410_place_1 = f;
(cr133410_state[(0)] = cr133410_block_1);

return missionary.core.fork(cr133410_place_0,cr133410_place_1);
}catch (e133459){var cr133410_exception = e133459;
(cr133410_state[(0)] = null);

throw cr133410_exception;
}});
var cr133410_block_2 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_2(cr133410_state){
try{var cr133410_place_2 = (cr133410_state[(2)]);
var cr133410_place_8 = cr133410_place_2;
(cr133410_state[(0)] = cr133410_block_8);

(cr133410_state[(2)] = null);

(cr133410_state[(1)] = cr133410_place_8);

return cr133410_state;
}catch (e133462){var cr133410_exception = e133462;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(2)] = null);

throw cr133410_exception;
}});
var cr133410_block_3 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_3(cr133410_state){
try{var cr133410_place_5 = (cr133410_state[(3)]);
var cr133410_place_9 = cr133410_place_5;
var cr133410_place_10 = cljs_http_missionary.client.get;
var cr133410_place_11 = cr133410_place_9;
var cr133410_place_12 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr133410_place_13 = false;
var cr133410_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133410_place_12,cr133410_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133410_place_15 = (function (){var G__133465 = cr133410_place_11;
var G__133466 = cr133410_place_14;
var fexpr__133464 = cr133410_place_10;
return (fexpr__133464.cljs$core$IFn$_invoke$arity$2 ? fexpr__133464.cljs$core$IFn$_invoke$arity$2(G__133465,G__133466) : fexpr__133464.call(null,G__133465,G__133466));
})();
(cr133410_state[(0)] = cr133410_block_4);

(cr133410_state[(3)] = null);

return missionary.core.park(cr133410_place_15);
}catch (e133463){var cr133410_exception = e133463;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(3)] = null);

(cr133410_state[(2)] = null);

throw cr133410_exception;
}});
var cr133410_block_6 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_6(cr133410_state){
try{var cr133410_place_27 = (cr133410_state[(4)]);
var cr133410_place_47 = cljs.core.js__GT_clj;
var cr133410_place_48 = JSON.parse;
var cr133410_place_49 = cr133410_place_27;
var cr133410_place_50 = (function (){var G__133470 = cr133410_place_49;
var fexpr__133469 = cr133410_place_48;
return (fexpr__133469.cljs$core$IFn$_invoke$arity$1 ? fexpr__133469.cljs$core$IFn$_invoke$arity$1(G__133470) : fexpr__133469.call(null,G__133470));
})();
var cr133410_place_51 = new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252);
var cr133410_place_52 = true;
var cr133410_place_53 = (function (){var G__133475 = cr133410_place_50;
var G__133476 = cr133410_place_51;
var G__133477 = cr133410_place_52;
var fexpr__133474 = cr133410_place_47;
return (fexpr__133474.cljs$core$IFn$_invoke$arity$3 ? fexpr__133474.cljs$core$IFn$_invoke$arity$3(G__133475,G__133476,G__133477) : fexpr__133474.call(null,G__133475,G__133476,G__133477));
})();
var cr133410_place_54 = frontend.worker.rtc.malli_schema.data_from_ws_coercer;
var cr133410_place_55 = cr133410_place_53;
var cr133410_place_56 = (function (){var G__133479 = cr133410_place_55;
var fexpr__133478 = cr133410_place_54;
return (fexpr__133478.cljs$core$IFn$_invoke$arity$1 ? fexpr__133478.cljs$core$IFn$_invoke$arity$1(G__133479) : fexpr__133478.call(null,G__133479));
})();
(cr133410_state[(0)] = cr133410_block_7);

(cr133410_state[(4)] = null);

(cr133410_state[(5)] = cr133410_place_56);

return cr133410_state;
}catch (e133467){var cr133410_exception = e133467;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(4)] = null);

(cr133410_state[(5)] = null);

throw cr133410_exception;
}});
var cr133410_block_7 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_7(cr133410_state){
try{var cr133410_place_31 = (cr133410_state[(5)]);
(cr133410_state[(0)] = cr133410_block_8);

(cr133410_state[(5)] = null);

(cr133410_state[(1)] = cr133410_place_31);

return cr133410_state;
}catch (e133484){var cr133410_exception = e133484;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(5)] = null);

throw cr133410_exception;
}});
var cr133410_block_8 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_8(cr133410_state){
try{var cr133410_place_7 = (cr133410_state[(1)]);
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

return cr133410_place_7;
}catch (e133485){var cr133410_exception = e133485;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

throw cr133410_exception;
}});
var cr133410_block_5 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_5(cr133410_state){
try{var cr133410_place_23 = (cr133410_state[(3)]);
var cr133410_place_27 = (cr133410_state[(4)]);
var cr133410_place_2 = (cr133410_state[(2)]);
var cr133410_place_32 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr133410_place_33 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr133410_place_34 = cr133410_place_2;
var cr133410_place_35 = cr133410_place_33.cljs$core$IFn$_invoke$arity$1(cr133410_place_34);
var cr133410_place_36 = new cljs.core.Keyword(null,"ex-message","ex-message",1526142375);
var cr133410_place_37 = "get s3 object failed";
var cr133410_place_38 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr133410_place_39 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr133410_place_40 = new cljs.core.Keyword("rtc.exception","get-s3-object-failed","rtc.exception/get-s3-object-failed",-2138023187);
var cr133410_place_41 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr133410_place_42 = cr133410_place_23;
var cr133410_place_43 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr133410_place_44 = cr133410_place_27;
var cr133410_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133410_place_43,cr133410_place_44,cr133410_place_41,cr133410_place_42,cr133410_place_39,cr133410_place_40]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133410_place_46 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133410_place_36,cr133410_place_37,cr133410_place_32,cr133410_place_35,cr133410_place_38,cr133410_place_45]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr133410_state[(0)] = cr133410_block_7);

(cr133410_state[(3)] = null);

(cr133410_state[(4)] = null);

(cr133410_state[(2)] = null);

(cr133410_state[(5)] = cr133410_place_46);

return cr133410_state;
}catch (e133488){var cr133410_exception = e133488;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(3)] = null);

(cr133410_state[(4)] = null);

(cr133410_state[(5)] = null);

(cr133410_state[(2)] = null);

throw cr133410_exception;
}});
var cr133410_block_1 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_1(cr133410_state){
try{var cr133410_place_2 = missionary.core.unpark();
var cr133410_place_3 = new cljs.core.Keyword(null,"s3-presign-url","s3-presign-url",-714097497);
var cr133410_place_4 = cr133410_place_2;
var cr133410_place_5 = cr133410_place_3.cljs$core$IFn$_invoke$arity$1(cr133410_place_4);
var cr133410_place_6 = cr133410_place_5;
var cr133410_place_7 = null;
if(cljs.core.truth_(cr133410_place_6)){
(cr133410_state[(0)] = cr133410_block_3);

(cr133410_state[(2)] = cr133410_place_2);

(cr133410_state[(3)] = cr133410_place_5);

(cr133410_state[(1)] = cr133410_place_7);

return cr133410_state;
} else {
(cr133410_state[(0)] = cr133410_block_2);

(cr133410_state[(2)] = cr133410_place_2);

(cr133410_state[(1)] = cr133410_place_7);

return cr133410_state;
}
}catch (e133491){var cr133410_exception = e133491;
(cr133410_state[(0)] = null);

throw cr133410_exception;
}});
var cr133410_block_4 = (function frontend$worker$rtc$ws$recv_flow_$_cr133410_block_4(cr133410_state){
try{var cr133410_place_16 = missionary.core.unpark();
var cr133410_place_17 = cljs.core.__destructure_map;
var cr133410_place_18 = cr133410_place_16;
var cr133410_place_19 = (function (){var G__133500 = cr133410_place_18;
var fexpr__133499 = cr133410_place_17;
return (fexpr__133499.cljs$core$IFn$_invoke$arity$1 ? fexpr__133499.cljs$core$IFn$_invoke$arity$1(G__133500) : fexpr__133499.call(null,G__133500));
})();
var cr133410_place_20 = cljs.core.get;
var cr133410_place_21 = cr133410_place_19;
var cr133410_place_22 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr133410_place_23 = (function (){var G__133503 = cr133410_place_21;
var G__133504 = cr133410_place_22;
var fexpr__133502 = cr133410_place_20;
return (fexpr__133502.cljs$core$IFn$_invoke$arity$2 ? fexpr__133502.cljs$core$IFn$_invoke$arity$2(G__133503,G__133504) : fexpr__133502.call(null,G__133503,G__133504));
})();
var cr133410_place_24 = cljs.core.get;
var cr133410_place_25 = cr133410_place_19;
var cr133410_place_26 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr133410_place_27 = (function (){var G__133506 = cr133410_place_25;
var G__133507 = cr133410_place_26;
var fexpr__133505 = cr133410_place_24;
return (fexpr__133505.cljs$core$IFn$_invoke$arity$2 ? fexpr__133505.cljs$core$IFn$_invoke$arity$2(G__133506,G__133507) : fexpr__133505.call(null,G__133506,G__133507));
})();
var cr133410_place_28 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr133410_place_29 = cr133410_place_23;
var cr133410_place_30 = (function (){var G__133509 = cr133410_place_29;
var fexpr__133508 = cr133410_place_28;
return (fexpr__133508.cljs$core$IFn$_invoke$arity$1 ? fexpr__133508.cljs$core$IFn$_invoke$arity$1(G__133509) : fexpr__133508.call(null,G__133509));
})();
var cr133410_place_31 = null;
if(cljs.core.truth_(cr133410_place_30)){
(cr133410_state[(0)] = cr133410_block_6);

(cr133410_state[(2)] = null);

(cr133410_state[(4)] = cr133410_place_27);

(cr133410_state[(5)] = cr133410_place_31);

return cr133410_state;
} else {
(cr133410_state[(0)] = cr133410_block_5);

(cr133410_state[(3)] = cr133410_place_23);

(cr133410_state[(4)] = cr133410_place_27);

(cr133410_state[(5)] = cr133410_place_31);

return cr133410_state;
}
}catch (e133498){var cr133410_exception = e133498;
(cr133410_state[(0)] = null);

(cr133410_state[(1)] = null);

(cr133410_state[(2)] = null);

throw cr133410_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133510 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__133510[(0)] = cr133410_block_0);

return G__133510;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a task: send message wait to recv its response and return it.
 *   Throw if timeout
 */
frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_ = (function frontend$worker$rtc$ws$send_AMPERSAND_recv_STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___133785 = arguments.length;
var i__5727__auto___133786 = (0);
while(true){
if((i__5727__auto___133786 < len__5726__auto___133785)){
args__5732__auto__.push((arguments[i__5727__auto___133786]));

var G__133787 = (i__5727__auto___133786 + (1));
i__5727__auto___133786 = G__133787;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (mws,message,p__133529){
var map__133530 = p__133529;
var map__133530__$1 = cljs.core.__destructure_map(map__133530);
var timeout_ms = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133530__$1,new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406),(10000));
if(cljs.core.pos_int_QMARK_(timeout_ms)){
} else {
throw (new Error("Assert failed: (pos-int? timeout-ms)"));
}

if((!((new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(message) == null)))){
} else {
throw (new Error("Assert failed: (some? (:req-id message))"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133531_block_0 = (function frontend$worker$rtc$ws$cr133531_block_0(cr133531_state){
try{var cr133531_place_0 = frontend.worker.rtc.ws.send;
var cr133531_place_1 = mws;
var cr133531_place_2 = message;
var cr133531_place_3 = (function (){var G__133577 = cr133531_place_1;
var G__133578 = cr133531_place_2;
var fexpr__133576 = cr133531_place_0;
return (fexpr__133576.cljs$core$IFn$_invoke$arity$2 ? fexpr__133576.cljs$core$IFn$_invoke$arity$2(G__133577,G__133578) : fexpr__133576.call(null,G__133577,G__133578));
})();
(cr133531_state[(0)] = cr133531_block_1);

return missionary.core.park(cr133531_place_3);
}catch (e133572){var cr133531_exception = e133572;
(cr133531_state[(0)] = null);

throw cr133531_exception;
}});
var cr133531_block_1 = (function frontend$worker$rtc$ws$cr133531_block_1(cr133531_state){
try{var cr133531_place_4 = missionary.core.unpark();
var cr133531_place_5 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr133531_place_6 = message;
var cr133531_place_7 = cr133531_place_5.cljs$core$IFn$_invoke$arity$1(cr133531_place_6);
var cr133531_place_8 = missionary.core.timeout;
var cr133531_place_9 = missionary.core.reduce;
var cr133531_place_10 = (function (_,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cr133531_place_7,new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(v))){
return cljs.core.reduced(v);
} else {
return null;
}
});
var cr133531_place_11 = frontend.worker.rtc.ws.recv_flow;
var cr133531_place_12 = mws;
var cr133531_place_13 = (function (){var G__133584 = cr133531_place_12;
var fexpr__133583 = cr133531_place_11;
return (fexpr__133583.cljs$core$IFn$_invoke$arity$1 ? fexpr__133583.cljs$core$IFn$_invoke$arity$1(G__133584) : fexpr__133583.call(null,G__133584));
})();
var cr133531_place_14 = (function (){var G__133589 = cr133531_place_10;
var G__133590 = cr133531_place_13;
var fexpr__133588 = cr133531_place_9;
return (fexpr__133588.cljs$core$IFn$_invoke$arity$2 ? fexpr__133588.cljs$core$IFn$_invoke$arity$2(G__133589,G__133590) : fexpr__133588.call(null,G__133589,G__133590));
})();
var cr133531_place_15 = timeout_ms;
var cr133531_place_16 = (function (){var G__133592 = cr133531_place_14;
var G__133593 = cr133531_place_15;
var fexpr__133591 = cr133531_place_8;
return (fexpr__133591.cljs$core$IFn$_invoke$arity$2 ? fexpr__133591.cljs$core$IFn$_invoke$arity$2(G__133592,G__133593) : fexpr__133591.call(null,G__133592,G__133593));
})();
(cr133531_state[(0)] = cr133531_block_2);

return missionary.core.park(cr133531_place_16);
}catch (e133579){var cr133531_exception = e133579;
(cr133531_state[(0)] = null);

throw cr133531_exception;
}});
var cr133531_block_2 = (function frontend$worker$rtc$ws$cr133531_block_2(cr133531_state){
try{var cr133531_place_17 = missionary.core.unpark();
var cr133531_place_18 = cr133531_place_17;
var cr133531_place_19 = null;
if(cljs.core.truth_(cr133531_place_18)){
(cr133531_state[(0)] = cr133531_block_4);

(cr133531_state[(1)] = cr133531_place_17);

(cr133531_state[(2)] = cr133531_place_19);

return cr133531_state;
} else {
(cr133531_state[(0)] = cr133531_block_3);

return cr133531_state;
}
}catch (e133600){var cr133531_exception = e133600;
(cr133531_state[(0)] = null);

throw cr133531_exception;
}});
var cr133531_block_3 = (function frontend$worker$rtc$ws$cr133531_block_3(cr133531_state){
try{var cr133531_place_20 = cljs.core.ex_info;
var cr133531_place_21 = "recv timeout (";
var cr133531_place_22 = timeout_ms;
var cr133531_place_23 = "ms)";
var cr133531_place_24 = [cr133531_place_21,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr133531_place_22),cr133531_place_23].join('');
var cr133531_place_25 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr133531_place_26 = true;
var cr133531_place_27 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr133531_place_28 = new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739);
var cr133531_place_29 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr133531_place_30 = message;
var cr133531_place_31 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133531_place_29,cr133531_place_30,cr133531_place_27,cr133531_place_28,cr133531_place_25,cr133531_place_26]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133531_place_32 = (function (){var G__133613 = cr133531_place_24;
var G__133614 = cr133531_place_31;
var fexpr__133612 = cr133531_place_20;
return (fexpr__133612.cljs$core$IFn$_invoke$arity$2 ? fexpr__133612.cljs$core$IFn$_invoke$arity$2(G__133613,G__133614) : fexpr__133612.call(null,G__133613,G__133614));
})();
var cr133531_place_33 = (function(){throw cr133531_place_32})();
(cr133531_state[(0)] = null);

return null;
}catch (e133608){var cr133531_exception = e133608;
(cr133531_state[(0)] = null);

throw cr133531_exception;
}});
var cr133531_block_4 = (function frontend$worker$rtc$ws$cr133531_block_4(cr133531_state){
try{var cr133531_place_34 = null;
(cr133531_state[(0)] = cr133531_block_5);

(cr133531_state[(2)] = cr133531_place_34);

return cr133531_state;
}catch (e133619){var cr133531_exception = e133619;
(cr133531_state[(0)] = null);

(cr133531_state[(1)] = null);

(cr133531_state[(2)] = null);

throw cr133531_exception;
}});
var cr133531_block_5 = (function frontend$worker$rtc$ws$cr133531_block_5(cr133531_state){
try{var cr133531_place_17 = (cr133531_state[(1)]);
var cr133531_place_19 = (cr133531_state[(2)]);
var cr133531_place_35 = cr133531_place_17;
(cr133531_state[(0)] = null);

(cr133531_state[(1)] = null);

(cr133531_state[(2)] = null);

return cr133531_place_35;
}catch (e133620){var cr133531_exception = e133620;
(cr133531_state[(0)] = null);

(cr133531_state[(1)] = null);

(cr133531_state[(2)] = null);

throw cr133531_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133624 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__133624[(0)] = cr133531_block_0);

return G__133624;
})());
})(),missionary.core.sp_run);
}));

(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_.cljs$lang$applyTo = (function (seq133515){
var G__133516 = cljs.core.first(seq133515);
var seq133515__$1 = cljs.core.next(seq133515);
var G__133517 = cljs.core.first(seq133515__$1);
var seq133515__$2 = cljs.core.next(seq133515__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__133516,G__133517,seq133515__$2);
}));

/**
 * Return a task that send the message then wait to recv its response.
 *   Throw if timeout
 */
frontend.worker.rtc.ws.send_AMPERSAND_recv = (function frontend$worker$rtc$ws$send_AMPERSAND_recv(var_args){
var args__5732__auto__ = [];
var len__5726__auto___133805 = arguments.length;
var i__5727__auto___133806 = (0);
while(true){
if((i__5727__auto___133806 < len__5726__auto___133805)){
args__5732__auto__.push((arguments[i__5727__auto___133806]));

var G__133809 = (i__5727__auto___133806 + (1));
i__5727__auto___133806 = G__133809;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$core$IFn$_invoke$arity$variadic = (function (mws,message,p__133630){
var map__133632 = p__133630;
var map__133632__$1 = cljs.core.__destructure_map(map__133632);
var timeout_ms = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133632__$1,new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406),(10000));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133633_block_0 = (function frontend$worker$rtc$ws$cr133633_block_0(cr133633_state){
try{var cr133633_place_0 = cljs.core.random_uuid;
var cr133633_place_1 = (function (){var fexpr__133658 = cr133633_place_0;
return (fexpr__133658.cljs$core$IFn$_invoke$arity$0 ? fexpr__133658.cljs$core$IFn$_invoke$arity$0() : fexpr__133658.call(null));
})();
var cr133633_place_2 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr133633_place_1);
var cr133633_place_3 = cljs.core.assoc;
var cr133633_place_4 = message;
var cr133633_place_5 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr133633_place_6 = cr133633_place_2;
var cr133633_place_7 = (function (){var G__133660 = cr133633_place_4;
var G__133661 = cr133633_place_5;
var G__133662 = cr133633_place_6;
var fexpr__133659 = cr133633_place_3;
return (fexpr__133659.cljs$core$IFn$_invoke$arity$3 ? fexpr__133659.cljs$core$IFn$_invoke$arity$3(G__133660,G__133661,G__133662) : fexpr__133659.call(null,G__133660,G__133661,G__133662));
})();
var cr133633_place_8 = frontend.worker.rtc.ws.send_AMPERSAND_recv_STAR_;
var cr133633_place_9 = mws;
var cr133633_place_10 = cr133633_place_7;
var cr133633_place_11 = new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406);
var cr133633_place_12 = timeout_ms;
var cr133633_place_13 = (function (){var G__133664 = cr133633_place_9;
var G__133665 = cr133633_place_10;
var G__133666 = cr133633_place_11;
var G__133667 = cr133633_place_12;
var fexpr__133663 = cr133633_place_8;
return (fexpr__133663.cljs$core$IFn$_invoke$arity$4 ? fexpr__133663.cljs$core$IFn$_invoke$arity$4(G__133664,G__133665,G__133666,G__133667) : fexpr__133663.call(null,G__133664,G__133665,G__133666,G__133667));
})();
(cr133633_state[(0)] = cr133633_block_1);

return missionary.core.park(cr133633_place_13);
}catch (e133657){var cr133633_exception = e133657;
(cr133633_state[(0)] = null);

throw cr133633_exception;
}});
var cr133633_block_1 = (function frontend$worker$rtc$ws$cr133633_block_1(cr133633_state){
try{var cr133633_place_14 = missionary.core.unpark();
(cr133633_state[(0)] = null);

return cr133633_place_14;
}catch (e133668){var cr133633_exception = e133668;
(cr133633_state[(0)] = null);

throw cr133633_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133669 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__133669[(0)] = cr133633_block_0);

return G__133669;
})());
})(),missionary.core.sp_run);
}));

(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.ws.send_AMPERSAND_recv.cljs$lang$applyTo = (function (seq133625){
var G__133626 = cljs.core.first(seq133625);
var seq133625__$1 = cljs.core.next(seq133625);
var G__133627 = cljs.core.first(seq133625__$1);
var seq133625__$2 = cljs.core.next(seq133625__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__133626,G__133627,seq133625__$2);
}));


//# sourceMappingURL=frontend.worker.rtc.ws.js.map
