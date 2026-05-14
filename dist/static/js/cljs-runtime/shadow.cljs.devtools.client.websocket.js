goog.provide('shadow.cljs.devtools.client.websocket');
shadow.cljs.devtools.client.websocket.start = (function shadow$cljs$devtools$client$websocket$start(var_args){
var G__43103 = arguments.length;
switch (G__43103) {
case 1:
return shadow.cljs.devtools.client.websocket.start.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.cljs.devtools.client.websocket.start.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.cljs.devtools.client.websocket.start.cljs$core$IFn$_invoke$arity$1 = (function (runtime){
return shadow.cljs.devtools.client.websocket.start.cljs$core$IFn$_invoke$arity$2(WebSocket,runtime);
}));

(shadow.cljs.devtools.client.websocket.start.cljs$core$IFn$_invoke$arity$2 = (function (ws_impl,runtime){
var ws_url = shadow.cljs.devtools.client.env.get_ws_relay_url();
var socket = (new ws_impl(ws_url));
(socket.onmessage = (function (e){
return shadow.cljs.devtools.client.shared.remote_msg(runtime,e.data);
}));

(socket.onopen = (function (e){
return shadow.cljs.devtools.client.shared.remote_open(runtime,e);
}));

(socket.onclose = (function (e){
return shadow.cljs.devtools.client.shared.remote_close(runtime,e,ws_url);
}));

(socket.onerror = (function (e){
return shadow.cljs.devtools.client.shared.remote_error(runtime,e);
}));

return socket;
}));

(shadow.cljs.devtools.client.websocket.start.cljs$lang$maxFixedArity = 2);

shadow.cljs.devtools.client.websocket.send = (function shadow$cljs$devtools$client$websocket$send(socket,msg){
return socket.send(msg);
});
shadow.cljs.devtools.client.websocket.stop = (function shadow$cljs$devtools$client$websocket$stop(socket){
(socket.onopen = null);

(socket.onclose = null);

(socket.onmessage = null);

(socket.onerror = null);

return socket.close();
});

//# sourceMappingURL=shadow.cljs.devtools.client.websocket.js.map
