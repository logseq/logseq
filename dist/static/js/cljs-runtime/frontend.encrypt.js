goog.provide('frontend.encrypt');
frontend.encrypt.encrypt_with_passphrase = (function frontend$encrypt$encrypt_with_passphrase(passphrase,content){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.utf8.encode(content)),(function (raw_content){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["encrypt-with-passphrase",passphrase,raw_content], 0))),(function (encrypted){
return promesa.protocols._promise(logseq.graph_parser.utf8.decode(encrypted));
}));
}));
}));
} else {
return null;
}
});
frontend.encrypt.decrypt_with_passphrase = (function frontend$encrypt$decrypt_with_passphrase(passphrase,content){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.utf8.encode(content)),(function (raw_content){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["decrypt-with-passphrase",passphrase,raw_content], 0))),(function (decrypted){
return promesa.protocols._promise(logseq.graph_parser.utf8.decode(decrypted));
}));
}));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.encrypt.js.map
