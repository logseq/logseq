goog.provide('logseq.shui.dialog.core');
logseq.shui.dialog.core.dialog = logseq.shui.util.lsui_wrap("Dialog");
logseq.shui.dialog.core.dialog_portal = logseq.shui.util.lsui_wrap("DialogPortal");
logseq.shui.dialog.core.alert_dialog = logseq.shui.util.lsui_wrap("AlertDialog");
logseq.shui.dialog.core.alert_dialog_portal = logseq.shui.util.lsui_wrap("AlertDialogPortal");
logseq.shui.dialog.core.dialog_overlay = logseq.shui.util.lsui_wrap("DialogOverlay");
logseq.shui.dialog.core.dialog_close = logseq.shui.util.lsui_wrap("DialogClose");
logseq.shui.dialog.core.dialog_trigger = logseq.shui.util.lsui_wrap("DialogTrigger");
logseq.shui.dialog.core.dialog_content = logseq.shui.util.lsui_wrap("DialogContent");
logseq.shui.dialog.core.dialog_header = logseq.shui.util.lsui_wrap("DialogHeader");
logseq.shui.dialog.core.dialog_footer = logseq.shui.util.lsui_wrap("DialogFooter");
logseq.shui.dialog.core.dialog_title = logseq.shui.util.lsui_wrap("DialogTitle");
logseq.shui.dialog.core.dialog_description = logseq.shui.util.lsui_wrap("DialogDescription");
logseq.shui.dialog.core.alert_dialog_overlay = logseq.shui.util.lsui_wrap("AlertDialogOverlay");
logseq.shui.dialog.core.alert_dialog_trigger = logseq.shui.util.lsui_wrap("AlertDialogTrigger");
logseq.shui.dialog.core.alert_dialog_content = logseq.shui.util.lsui_wrap("AlertDialogContent");
logseq.shui.dialog.core.alert_dialog_header = logseq.shui.util.lsui_wrap("AlertDialogHeader");
logseq.shui.dialog.core.alert_dialog_title = logseq.shui.util.lsui_wrap("AlertDialogTitle");
logseq.shui.dialog.core.alert_dialog_description = logseq.shui.util.lsui_wrap("AlertDialogDescription");
logseq.shui.dialog.core.alert_dialog_footer = logseq.shui.util.lsui_wrap("AlertDialogFooter");
logseq.shui.dialog.core.alert_dialog_action = logseq.shui.util.lsui_wrap("AlertDialogAction");
logseq.shui.dialog.core.alert_dialog_cancel = logseq.shui.util.lsui_wrap("AlertDialogCancel");
logseq.shui.dialog.core.interpret_vals = (function logseq$shui$dialog$core$interpret_vals(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74904 = arguments.length;
var i__5727__auto___74905 = (0);
while(true){
if((i__5727__auto___74905 < len__5726__auto___74904)){
args__5732__auto__.push((arguments[i__5727__auto___74905]));

var G__74906 = (i__5727__auto___74905 + (1));
i__5727__auto___74905 = G__74906;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic = (function (config,ks,args){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (config__$1,k){
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(config__$1,k);
var v__$1 = ((cljs.core.fn_QMARK_(v))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(v,args):v);
if(cljs.core.vector_QMARK_(v__$1)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,k,daiquiri.interpreter.interpret(v__$1));
} else {
return config__$1;
}
}),config,ks);
}));

(logseq.shui.dialog.core.interpret_vals.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.dialog.core.interpret_vals.cljs$lang$applyTo = (function (seq74558){
var G__74559 = cljs.core.first(seq74558);
var seq74558__$1 = cljs.core.next(seq74558);
var G__74560 = cljs.core.first(seq74558__$1);
var seq74558__$2 = cljs.core.next(seq74558__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74559,G__74560,seq74558__$2);
}));

logseq.shui.dialog.core._STAR_modals = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
logseq.shui.dialog.core._STAR_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
logseq.shui.dialog.core.gen_id = (function logseq$shui$dialog$core$gen_id(){
return cljs.core.reset_BANG_(logseq.shui.dialog.core._STAR_id,(cljs.core.deref(logseq.shui.dialog.core._STAR_id) + (1)));
});
logseq.shui.dialog.core.get_modal = (function logseq$shui$dialog$core$get_modal(id){
if(cljs.core.truth_(id)){
var G__74567 = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
var G__74567__$1 = (((G__74567 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__74565_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__74565_SHARP_)));
}),G__74567));
if((G__74567__$1 == null)){
return null;
} else {
return cljs.core.first(G__74567__$1);
}
} else {
return null;
}
});
logseq.shui.dialog.core.update_modal_BANG_ = (function logseq$shui$dialog$core$update_modal_BANG_(id,ks,val){
var temp__5804__auto__ = logseq.shui.dialog.core.get_modal(id);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__74570 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74570,(0),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74570,(1),null);
var ks__$1 = ((cljs.core.coll_QMARK_(ks))?ks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null));
var config__$1 = (((val == null))?medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(config,ks__$1):cljs.core.assoc_in(config,ks__$1,val));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.shui.dialog.core._STAR_modals,cljs.core.assoc,index,config__$1);

if(((new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(config__$1) === false) && (cljs.core.fn_QMARK_(new cljs.core.Keyword(null,"on-close","on-close",-761178394).cljs$core$IFn$_invoke$arity$1(config__$1))))){
var fexpr__74573 = new cljs.core.Keyword(null,"on-close","on-close",-761178394).cljs$core$IFn$_invoke$arity$1(config__$1);
return (fexpr__74573.cljs$core$IFn$_invoke$arity$1 ? fexpr__74573.cljs$core$IFn$_invoke$arity$1(id) : fexpr__74573.call(null,id));
} else {
return null;
}
} else {
return null;
}
});
logseq.shui.dialog.core.upsert_modal_BANG_ = (function logseq$shui$dialog$core$upsert_modal_BANG_(config){
var temp__5804__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5804__auto__)){
var _id = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(logseq.shui.dialog.core._STAR_modals,cljs.core.conj,config);
} else {
return null;
}
});
logseq.shui.dialog.core.detach_modal_BANG_ = (function logseq$shui$dialog$core$detach_modal_BANG_(id){
var temp__5804__auto__ = logseq.shui.dialog.core.get_modal(id);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__74587 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74587,(0),null);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(logseq.shui.dialog.core._STAR_modals,(function (p1__74586_SHARP_){
return cljs.core.vec(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(index,p1__74586_SHARP_));
}));
} else {
return null;
}
});
logseq.shui.dialog.core.has_modal_QMARK_ = (function logseq$shui$dialog$core$has_modal_QMARK_(){
var G__74591 = cljs.core.deref(logseq.shui.dialog.core._STAR_modals);
var G__74591__$1 = (((G__74591 == null))?null:cljs.core.last(G__74591));
if((G__74591__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(G__74591__$1);
}
});
logseq.shui.dialog.core.open_BANG_ = (function logseq$shui$dialog$core$open_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74921 = arguments.length;
var i__5727__auto___74922 = (0);
while(true){
if((i__5727__auto___74922 < len__5726__auto___74921)){
args__5732__auto__.push((arguments[i__5727__auto___74922]));

var G__74923 = (i__5727__auto___74922 + (1));
i__5727__auto___74922 = G__74923;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.dialog.core.open_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.dialog.core.open_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (content_or_config,config_SINGLEQUOTE_){
var config = ((cljs.core.map_QMARK_(content_or_config))?content_or_config:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),content_or_config], null));
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(config);
var id = logseq.shui.dialog.core.gen_id();
var config__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"open?","open?",1238443125),true,new cljs.core.Keyword(null,"close","close",1835149582),(function (){
return (logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.dialog.core.close_BANG_.call(null,id));
})], null),config,cljs.core.first(config_SINGLEQUOTE_)], 0));
var config__$2 = (function (){var G__74600 = config__$1;
if(cljs.core.fn_QMARK_(content)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74600,new cljs.core.Keyword(null,"content","content",15833224),(content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(config__$1) : content.call(null,config__$1)));
} else {
return G__74600;
}
})();
return logseq.shui.dialog.core.upsert_modal_BANG_(cljs.core.assoc_in(config__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202)], null),(function (p1__74593_SHARP_){
return p1__74593_SHARP_.preventDefault();
})));
}));

(logseq.shui.dialog.core.open_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.dialog.core.open_BANG_.cljs$lang$applyTo = (function (seq74594){
var G__74595 = cljs.core.first(seq74594);
var seq74594__$1 = cljs.core.next(seq74594);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74595,seq74594__$1);
}));

logseq.shui.dialog.core.alert_BANG_ = (function logseq$shui$dialog$core$alert_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74927 = arguments.length;
var i__5727__auto___74928 = (0);
while(true){
if((i__5727__auto___74928 < len__5726__auto___74927)){
args__5732__auto__.push((arguments[i__5727__auto___74928]));

var G__74929 = (i__5727__auto___74928 + (1));
i__5727__auto___74928 = G__74929;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.dialog.core.alert_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.dialog.core.alert_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (content_or_config,config_SINGLEQUOTE_){
var deferred = promesa.core.deferred();
logseq.shui.dialog.core.open_BANG_.cljs$core$IFn$_invoke$arity$variadic(content_or_config,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"alert?","alert?",-446067642),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"deferred","deferred",-1976960688),deferred], null),cljs.core.first(config_SINGLEQUOTE_)], 0))], 0));

return promesa.core.promise.cljs$core$IFn$_invoke$arity$1(deferred);
}));

(logseq.shui.dialog.core.alert_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.dialog.core.alert_BANG_.cljs$lang$applyTo = (function (seq74603){
var G__74604 = cljs.core.first(seq74603);
var seq74603__$1 = cljs.core.next(seq74603);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74604,seq74603__$1);
}));

logseq.shui.dialog.core.confirm_BANG_ = (function logseq$shui$dialog$core$confirm_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74933 = arguments.length;
var i__5727__auto___74934 = (0);
while(true){
if((i__5727__auto___74934 < len__5726__auto___74933)){
args__5732__auto__.push((arguments[i__5727__auto___74934]));

var G__74935 = (i__5727__auto___74934 + (1));
i__5727__auto___74934 = G__74935;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.shui.dialog.core.confirm_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.shui.dialog.core.confirm_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (content_or_config,config_SINGLEQUOTE_){
return logseq.shui.dialog.core.alert_BANG_.cljs$core$IFn$_invoke$arity$variadic(content_or_config,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(config_SINGLEQUOTE_),new cljs.core.Keyword(null,"alert?","alert?",-446067642),new cljs.core.Keyword(null,"confirm","confirm",-2004000608))], 0));
}));

(logseq.shui.dialog.core.confirm_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.dialog.core.confirm_BANG_.cljs$lang$applyTo = (function (seq74607){
var G__74608 = cljs.core.first(seq74607);
var seq74607__$1 = cljs.core.next(seq74607);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74608,seq74607__$1);
}));

logseq.shui.dialog.core.get_last_modal_id = (function logseq$shui$dialog$core$get_last_modal_id(){
var G__74612 = cljs.core.last(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
if((G__74612 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__74612);
}
});
logseq.shui.dialog.core.get_first_modal_id = (function logseq$shui$dialog$core$get_first_modal_id(){
var G__74615 = cljs.core.first(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
if((G__74615 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__74615);
}
});
logseq.shui.dialog.core.close_BANG_ = (function logseq$shui$dialog$core$close_BANG_(var_args){
var G__74619 = arguments.length;
switch (G__74619) {
case 0:
return logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(logseq.shui.dialog.core.get_last_modal_id());
}));

(logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (id){
return logseq.shui.dialog.core.update_modal_BANG_(id,new cljs.core.Keyword(null,"open?","open?",1238443125),false);
}));

(logseq.shui.dialog.core.close_BANG_.cljs$lang$maxFixedArity = 1);

logseq.shui.dialog.core.close_all_BANG_ = (function logseq$shui$dialog$core$close_all_BANG_(){
var seq__74622 = cljs.core.seq(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
var chunk__74623 = null;
var count__74624 = (0);
var i__74625 = (0);
while(true){
if((i__74625 < count__74624)){
var map__74630 = chunk__74623.cljs$core$IIndexed$_nth$arity$2(null,i__74625);
var map__74630__$1 = cljs.core.__destructure_map(map__74630);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74630__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(id);


var G__74942 = seq__74622;
var G__74943 = chunk__74623;
var G__74944 = count__74624;
var G__74945 = (i__74625 + (1));
seq__74622 = G__74942;
chunk__74623 = G__74943;
count__74624 = G__74944;
i__74625 = G__74945;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__74622);
if(temp__5804__auto__){
var seq__74622__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__74622__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__74622__$1);
var G__74948 = cljs.core.chunk_rest(seq__74622__$1);
var G__74949 = c__5525__auto__;
var G__74950 = cljs.core.count(c__5525__auto__);
var G__74951 = (0);
seq__74622 = G__74948;
chunk__74623 = G__74949;
count__74624 = G__74950;
i__74625 = G__74951;
continue;
} else {
var map__74631 = cljs.core.first(seq__74622__$1);
var map__74631__$1 = cljs.core.__destructure_map(map__74631);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74631__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(id);


var G__74952 = cljs.core.next(seq__74622__$1);
var G__74953 = null;
var G__74954 = (0);
var G__74955 = (0);
seq__74622 = G__74952;
chunk__74623 = G__74953;
count__74624 = G__74954;
i__74625 = G__74955;
continue;
}
} else {
return null;
}
}
break;
}
});
logseq.shui.dialog.core.modal_inner = rum.core.lazy_build(rum.core.build_defc,(function (config){
var map__74635 = config;
var map__74635__$1 = cljs.core.__destructure_map(map__74635);
var on_open_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var align = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"align","align",1964212802));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var close_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"content","content",15833224));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"footer","footer",1606445390));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"title","title",636505583));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var auto_width_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74635__$1,new cljs.core.Keyword(null,"auto-width?","auto-width?",93515862));
var props = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390),new cljs.core.Keyword(null,"auto-width?","auto-width?",93515862),new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),new cljs.core.Keyword(null,"close","close",1835149582),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),new cljs.core.Keyword(null,"open?","open?",1238443125),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.Keyword(null,"content-props","content-props",687449284)], 0));
var props__$1 = cljs.core.assoc_in(props,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"overlay-props","overlay-props",-608958470),new cljs.core.Keyword(null,"data-align","data-align",-673070527)], null),cljs.core.name((function (){var or__5002__auto__ = align;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"center","center",-748944368);
}
})()));
logseq.shui.hooks.use_effect_BANG_((function (){
if(open_QMARK_ === false){
return logseq.shui.dialog.core.detach_modal_BANG_(id);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [open_QMARK_], null));

return daiquiri.interpreter.interpret((function (){var G__74658 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([root_props,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),["modal-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (v){
var set_open_BANG_ = (function (p1__74633_SHARP_){
return logseq.shui.dialog.core.update_modal_BANG_(id,new cljs.core.Keyword(null,"open?","open?",1238443125),p1__74633_SHARP_);
});
if(cljs.core.fn_QMARK_(on_open_change)){
var G__74660 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),v,new cljs.core.Keyword(null,"set-open!","set-open!",503042001),set_open_BANG_], null);
return (on_open_change.cljs$core$IFn$_invoke$arity$1 ? on_open_change.cljs$core$IFn$_invoke$arity$1(G__74660) : on_open_change.call(null,G__74660));
} else {
return set_open_BANG_(v);
}
})], null)], 0));
var G__74659 = (function (){var onPointerDownOutside = new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036).cljs$core$IFn$_invoke$arity$1(content_props);
var content_props__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(content_props,new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),(function (e){
if(cljs.core.fn_QMARK_(onPointerDownOutside)){
(onPointerDownOutside.cljs$core$IFn$_invoke$arity$1 ? onPointerDownOutside.cljs$core$IFn$_invoke$arity$1(e) : onPointerDownOutside.call(null,e));
} else {
}

if(cljs.core.truth_((function (){var G__74661 = e.target;
if((G__74661 == null)){
return null;
} else {
return G__74661.closest(".ui__dialog-overlay");
}
})())){
return null;
} else {
return e.preventDefault();
}
}));
var G__74662 = (function (){var G__74667 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props__$1,content_props__$1], 0));
var G__74667__$1 = (cljs.core.truth_(auto_width_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74667,new cljs.core.Keyword(null,"data-auto-width","data-auto-width",-1812760474),true):G__74667);
if(close_btn_QMARK_ === false){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__74667__$1,new cljs.core.Keyword(null,"data-close-btn","data-close-btn",-312668419),false);
} else {
return G__74667__$1;
}
})();
var G__74663 = (function (){var G__74668 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(((title == null))?"hidden":null)], null);
var G__74669 = title;
return (logseq.shui.dialog.core.dialog_title.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.dialog_title.cljs$core$IFn$_invoke$arity$2(G__74668,G__74669) : logseq.shui.dialog.core.dialog_title.call(null,G__74668,G__74669));
})();
var G__74664 = (cljs.core.truth_(description)?(logseq.shui.dialog.core.dialog_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.dialog_description.cljs$core$IFn$_invoke$arity$1(description) : logseq.shui.dialog.core.dialog_description.call(null,description)):null);
var G__74665 = (cljs.core.truth_(content)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__dialog-main-content","div.ui__dialog-main-content",-140235567),content], null):null);
var G__74666 = (cljs.core.truth_(footer)?(logseq.shui.dialog.core.dialog_footer.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.dialog_footer.cljs$core$IFn$_invoke$arity$1(footer) : logseq.shui.dialog.core.dialog_footer.call(null,footer)):null);
return (logseq.shui.dialog.core.dialog_content.cljs$core$IFn$_invoke$arity$5 ? logseq.shui.dialog.core.dialog_content.cljs$core$IFn$_invoke$arity$5(G__74662,G__74663,G__74664,G__74665,G__74666) : logseq.shui.dialog.core.dialog_content.call(null,G__74662,G__74663,G__74664,G__74665,G__74666));
})();
return (logseq.shui.dialog.core.dialog.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.dialog.cljs$core$IFn$_invoke$arity$2(G__74658,G__74659) : logseq.shui.dialog.core.dialog.call(null,G__74658,G__74659));
})());
}),null,"logseq.shui.dialog.core/modal-inner");
logseq.shui.dialog.core.alert_inner = rum.core.lazy_build(rum.core.build_defc,(function (config){
var map__74674 = config;
var map__74674__$1 = cljs.core.__destructure_map(map__74674);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"content","content",15833224));
var footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"footer","footer",1606445390));
var deferred = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"deferred","deferred",-1976960688));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74674__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var props = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390),new cljs.core.Keyword(null,"deferred","deferred",-1976960688),new cljs.core.Keyword(null,"open?","open?",1238443125),new cljs.core.Keyword(null,"alert?","alert?",-446067642)], 0));
logseq.shui.hooks.use_effect_BANG_((function (){
if(open_QMARK_ === false){
var timeout = setTimeout((function (){
return logseq.shui.dialog.core.detach_modal_BANG_(id);
}),(128));
return (function (){
return clearTimeout(timeout);
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [open_QMARK_], null));

return daiquiri.interpreter.interpret((function (){var G__74690 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),["alert-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (p1__74673_SHARP_){
return logseq.shui.dialog.core.update_modal_BANG_(id,new cljs.core.Keyword(null,"open?","open?",1238443125),p1__74673_SHARP_);
})], null);
var G__74691 = (function (){var G__74694 = props;
var G__74695 = (cljs.core.truth_((function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return description;
}
})())?(function (){var G__74698 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__alert-dialog-header"], null);
var G__74699 = (cljs.core.truth_(title)?(logseq.shui.dialog.core.alert_dialog_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.alert_dialog_title.cljs$core$IFn$_invoke$arity$1(title) : logseq.shui.dialog.core.alert_dialog_title.call(null,title)):null);
var G__74700 = (cljs.core.truth_(description)?(logseq.shui.dialog.core.alert_dialog_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.alert_dialog_description.cljs$core$IFn$_invoke$arity$1(description) : logseq.shui.dialog.core.alert_dialog_description.call(null,description)):null);
return (logseq.shui.dialog.core.alert_dialog_header.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.dialog.core.alert_dialog_header.cljs$core$IFn$_invoke$arity$3(G__74698,G__74699,G__74700) : logseq.shui.dialog.core.alert_dialog_header.call(null,G__74698,G__74699,G__74700));
})():null);
var G__74696 = (cljs.core.truth_(content)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__alert-dialog-main-content","div.ui__alert-dialog-main-content",306893478),content], null):null);
var G__74697 = (function (){var G__74701 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__alert-dialog-footer"], null);
var G__74702 = (cljs.core.truth_(footer)?footer:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),"ok",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(deferred,true);
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),"OK"], 0))], null));
return (logseq.shui.dialog.core.alert_dialog_footer.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.alert_dialog_footer.cljs$core$IFn$_invoke$arity$2(G__74701,G__74702) : logseq.shui.dialog.core.alert_dialog_footer.call(null,G__74701,G__74702));
})();
return (logseq.shui.dialog.core.alert_dialog_content.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.dialog.core.alert_dialog_content.cljs$core$IFn$_invoke$arity$4(G__74694,G__74695,G__74696,G__74697) : logseq.shui.dialog.core.alert_dialog_content.call(null,G__74694,G__74695,G__74696,G__74697));
})();
return (logseq.shui.dialog.core.alert_dialog.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.alert_dialog.cljs$core$IFn$_invoke$arity$2(G__74690,G__74691) : logseq.shui.dialog.core.alert_dialog.call(null,G__74690,G__74691));
})());
}),null,"logseq.shui.dialog.core/alert-inner");
logseq.shui.dialog.core.confirm_inner = rum.core.lazy_build(rum.core.build_defc,(function (config){
var map__74717 = config;
var map__74717__$1 = cljs.core.__destructure_map(map__74717);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74717__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var deferred = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74717__$1,new cljs.core.Keyword(null,"deferred","deferred",-1976960688));
var outside_cancel_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74717__$1,new cljs.core.Keyword(null,"outside-cancel?","outside-cancel?",-1972964985));
var data_reminder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74717__$1,new cljs.core.Keyword(null,"data-reminder","data-reminder",1296338874));
var reminder_QMARK_ = cljs.core.boolean$((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return data_reminder;
} else {
return and__5000__auto__;
}
})());
var vec__74718 = rum.core.use_state((!(reminder_QMARK_)));
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74718,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74718,(1),null);
var _STAR_ok_ref = rum.core.use_ref(null);
var _STAR_reminder_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(ready_QMARK_)){
var timeout = setTimeout((function (){
var G__74726 = rum.core.deref(_STAR_ok_ref);
if((G__74726 == null)){
return null;
} else {
return G__74726.focus();
}
}),(128));
return (function (){
return clearTimeout(timeout);
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ready_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
try{var temp__5802__auto__ = (function (){var and__5000__auto__ = reminder_QMARK_;
if(and__5000__auto__){
return localStorage.getItem(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var reminder_v = temp__5802__auto__;
if(((Date.now() - reminder_v) < (((1000) * (60)) * (10)))){
logseq.shui.dialog.core.detach_modal_BANG_(id);

return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(deferred,true);
} else {
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
}
} else {
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
}
}catch (e74729){if((e74729 instanceof Error)){
var _e = e74729;
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
} else {
throw e74729;

}
}}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(ready_QMARK_)){
return logseq.shui.dialog.core.alert_inner(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"data-mode","data-mode",-1228453420),new cljs.core.Keyword(null,"confirm","confirm",-2004000608),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"overlay-props","overlay-props",-608958470),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(outside_cancel_QMARK_)){
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.reject_BANG_(deferred,null);
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"footer","footer",1606445390),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.pt-1","span.flex.items-center.pt-1",-1975159724),(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return data_reminder;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.items-center.gap-1.text-sm","label.flex.items-center.gap-1.text-sm",-1091634099),(function (){var G__74760 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_reminder_ref], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__74760) : logseq.shui.form.core.checkbox.call(null,G__74760));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50","span.opacity-50",949060710),"Don't remind me again"], null)], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.gap-2","span.flex.gap-2",-248859702),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),"cancel",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.reject_BANG_(deferred,false);
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),"Cancel"], 0)),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),"ok",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ok_ref,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___74985 = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = data_reminder;
if(cljs.core.truth_(and__5000__auto____$1)){
return rum.core.deref(_STAR_reminder_ref);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___74985)){
var reminder_74986 = temp__5804__auto___74985;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("checked",reminder_74986.dataset.state)){
localStorage.setItem(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),Date.now());
} else {
}
} else {
}

logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(deferred,true);
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),"OK"], 0))], null)], null)], 0)));
} else {
return null;
}
}),null,"logseq.shui.dialog.core/confirm-inner");
logseq.shui.dialog.core.install_modals = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__74846 = logseq.shui.util.use_atom(logseq.shui.dialog.core._STAR_modals);
var modals = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74846,(0),null);
var _set_modals_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74846,(1),null);
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function logseq$shui$dialog$core$iter__74850(s__74851){
return (new cljs.core.LazySeq(null,(function (){
var s__74851__$1 = s__74851;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74851__$1);
if(temp__5804__auto__){
var s__74851__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74851__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74851__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74853 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74852 = (0);
while(true){
if((i__74852 < size__5479__auto__)){
var config = cljs.core._nth(c__5478__auto__,i__74852);
if(cljs.core.map_QMARK_(config)){
cljs.core.chunk_append(b__74853,(function (){var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
var alert_QMARK_ = new cljs.core.Keyword(null,"alert?","alert?",-446067642).cljs$core$IFn$_invoke$arity$1(config);
var config__$1 = logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
var G__74867 = alert_QMARK_;
var G__74867__$1 = (((G__74867 instanceof cljs.core.Keyword))?G__74867.fqn:null);
switch (G__74867__$1) {
case "default":
return logseq.shui.dialog.core.alert_inner(config__$1);

break;
case "confirm":
return logseq.shui.dialog.core.confirm_inner(config__$1);

break;
default:
return logseq.shui.dialog.core.modal_inner(config__$1);

}
})());

var G__74993 = (i__74852 + (1));
i__74852 = G__74993;
continue;
} else {
var G__74994 = (i__74852 + (1));
i__74852 = G__74994;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74853),logseq$shui$dialog$core$iter__74850(cljs.core.chunk_rest(s__74851__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74853),null);
}
} else {
var config = cljs.core.first(s__74851__$2);
if(cljs.core.map_QMARK_(config)){
return cljs.core.cons((function (){var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
var alert_QMARK_ = new cljs.core.Keyword(null,"alert?","alert?",-446067642).cljs$core$IFn$_invoke$arity$1(config);
var config__$1 = logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
var G__74874 = alert_QMARK_;
var G__74874__$1 = (((G__74874 instanceof cljs.core.Keyword))?G__74874.fqn:null);
switch (G__74874__$1) {
case "default":
return logseq.shui.dialog.core.alert_inner(config__$1);

break;
case "confirm":
return logseq.shui.dialog.core.confirm_inner(config__$1);

break;
default:
return logseq.shui.dialog.core.modal_inner(config__$1);

}
})(),logseq$shui$dialog$core$iter__74850(cljs.core.rest(s__74851__$2)));
} else {
var G__74999 = cljs.core.rest(s__74851__$2);
s__74851__$1 = G__74999;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(modals);
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.dialog.core/install-modals");

//# sourceMappingURL=logseq.shui.dialog.core.js.map
