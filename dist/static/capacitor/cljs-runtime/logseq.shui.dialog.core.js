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
var len__5726__auto___73794 = arguments.length;
var i__5727__auto___73795 = (0);
while(true){
if((i__5727__auto___73795 < len__5726__auto___73794)){
args__5732__auto__.push((arguments[i__5727__auto___73795]));

var G__73796 = (i__5727__auto___73795 + (1));
i__5727__auto___73795 = G__73796;
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
(logseq.shui.dialog.core.interpret_vals.cljs$lang$applyTo = (function (seq73441){
var G__73442 = cljs.core.first(seq73441);
var seq73441__$1 = cljs.core.next(seq73441);
var G__73443 = cljs.core.first(seq73441__$1);
var seq73441__$2 = cljs.core.next(seq73441__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73442,G__73443,seq73441__$2);
}));

logseq.shui.dialog.core._STAR_modals = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
logseq.shui.dialog.core._STAR_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
logseq.shui.dialog.core.gen_id = (function logseq$shui$dialog$core$gen_id(){
return cljs.core.reset_BANG_(logseq.shui.dialog.core._STAR_id,(cljs.core.deref(logseq.shui.dialog.core._STAR_id) + (1)));
});
logseq.shui.dialog.core.get_modal = (function logseq$shui$dialog$core$get_modal(id){
if(cljs.core.truth_(id)){
var G__73452 = medley.core.indexed.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
var G__73452__$1 = (((G__73452 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__73450_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__73450_SHARP_)));
}),G__73452));
if((G__73452__$1 == null)){
return null;
} else {
return cljs.core.first(G__73452__$1);
}
} else {
return null;
}
});
logseq.shui.dialog.core.update_modal_BANG_ = (function logseq$shui$dialog$core$update_modal_BANG_(id,ks,val){
var temp__5804__auto__ = logseq.shui.dialog.core.get_modal(id);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__73464 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73464,(0),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73464,(1),null);
var ks__$1 = ((cljs.core.coll_QMARK_(ks))?ks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ks], null));
var config__$1 = (((val == null))?medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(config,ks__$1):cljs.core.assoc_in(config,ks__$1,val));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.shui.dialog.core._STAR_modals,cljs.core.assoc,index,config__$1);

if(((new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(config__$1) === false) && (cljs.core.fn_QMARK_(new cljs.core.Keyword(null,"on-close","on-close",-761178394).cljs$core$IFn$_invoke$arity$1(config__$1))))){
var fexpr__73471 = new cljs.core.Keyword(null,"on-close","on-close",-761178394).cljs$core$IFn$_invoke$arity$1(config__$1);
return (fexpr__73471.cljs$core$IFn$_invoke$arity$1 ? fexpr__73471.cljs$core$IFn$_invoke$arity$1(id) : fexpr__73471.call(null,id));
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
var vec__73478 = temp__5804__auto__;
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73478,(0),null);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(logseq.shui.dialog.core._STAR_modals,(function (p1__73476_SHARP_){
return cljs.core.vec(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2(index,p1__73476_SHARP_));
}));
} else {
return null;
}
});
logseq.shui.dialog.core.has_modal_QMARK_ = (function logseq$shui$dialog$core$has_modal_QMARK_(){
var G__73484 = cljs.core.deref(logseq.shui.dialog.core._STAR_modals);
var G__73484__$1 = (((G__73484 == null))?null:cljs.core.last(G__73484));
if((G__73484__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"open?","open?",1238443125).cljs$core$IFn$_invoke$arity$1(G__73484__$1);
}
});
logseq.shui.dialog.core.open_BANG_ = (function logseq$shui$dialog$core$open_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73823 = arguments.length;
var i__5727__auto___73824 = (0);
while(true){
if((i__5727__auto___73824 < len__5726__auto___73823)){
args__5732__auto__.push((arguments[i__5727__auto___73824]));

var G__73825 = (i__5727__auto___73824 + (1));
i__5727__auto___73824 = G__73825;
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
var config__$2 = (function (){var G__73500 = config__$1;
if(cljs.core.fn_QMARK_(content)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__73500,new cljs.core.Keyword(null,"content","content",15833224),(content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(config__$1) : content.call(null,config__$1)));
} else {
return G__73500;
}
})();
return logseq.shui.dialog.core.upsert_modal_BANG_(cljs.core.assoc_in(config__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202)], null),(function (p1__73491_SHARP_){
return p1__73491_SHARP_.preventDefault();
})));
}));

(logseq.shui.dialog.core.open_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.shui.dialog.core.open_BANG_.cljs$lang$applyTo = (function (seq73492){
var G__73493 = cljs.core.first(seq73492);
var seq73492__$1 = cljs.core.next(seq73492);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73493,seq73492__$1);
}));

logseq.shui.dialog.core.alert_BANG_ = (function logseq$shui$dialog$core$alert_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73832 = arguments.length;
var i__5727__auto___73833 = (0);
while(true){
if((i__5727__auto___73833 < len__5726__auto___73832)){
args__5732__auto__.push((arguments[i__5727__auto___73833]));

var G__73835 = (i__5727__auto___73833 + (1));
i__5727__auto___73833 = G__73835;
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
(logseq.shui.dialog.core.alert_BANG_.cljs$lang$applyTo = (function (seq73506){
var G__73507 = cljs.core.first(seq73506);
var seq73506__$1 = cljs.core.next(seq73506);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73507,seq73506__$1);
}));

logseq.shui.dialog.core.confirm_BANG_ = (function logseq$shui$dialog$core$confirm_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73837 = arguments.length;
var i__5727__auto___73838 = (0);
while(true){
if((i__5727__auto___73838 < len__5726__auto___73837)){
args__5732__auto__.push((arguments[i__5727__auto___73838]));

var G__73839 = (i__5727__auto___73838 + (1));
i__5727__auto___73838 = G__73839;
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
(logseq.shui.dialog.core.confirm_BANG_.cljs$lang$applyTo = (function (seq73513){
var G__73514 = cljs.core.first(seq73513);
var seq73513__$1 = cljs.core.next(seq73513);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73514,seq73513__$1);
}));

logseq.shui.dialog.core.get_last_modal_id = (function logseq$shui$dialog$core$get_last_modal_id(){
var G__73525 = cljs.core.last(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
if((G__73525 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__73525);
}
});
logseq.shui.dialog.core.get_first_modal_id = (function logseq$shui$dialog$core$get_first_modal_id(){
var G__73528 = cljs.core.first(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
if((G__73528 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__73528);
}
});
logseq.shui.dialog.core.close_BANG_ = (function logseq$shui$dialog$core$close_BANG_(var_args){
var G__73541 = arguments.length;
switch (G__73541) {
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
var seq__73549 = cljs.core.seq(cljs.core.deref(logseq.shui.dialog.core._STAR_modals));
var chunk__73550 = null;
var count__73551 = (0);
var i__73552 = (0);
while(true){
if((i__73552 < count__73551)){
var map__73560 = chunk__73550.cljs$core$IIndexed$_nth$arity$2(null,i__73552);
var map__73560__$1 = cljs.core.__destructure_map(map__73560);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73560__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(id);


var G__73844 = seq__73549;
var G__73845 = chunk__73550;
var G__73846 = count__73551;
var G__73847 = (i__73552 + (1));
seq__73549 = G__73844;
chunk__73550 = G__73845;
count__73551 = G__73846;
i__73552 = G__73847;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__73549);
if(temp__5804__auto__){
var seq__73549__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__73549__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__73549__$1);
var G__73848 = cljs.core.chunk_rest(seq__73549__$1);
var G__73849 = c__5525__auto__;
var G__73850 = cljs.core.count(c__5525__auto__);
var G__73851 = (0);
seq__73549 = G__73848;
chunk__73550 = G__73849;
count__73551 = G__73850;
i__73552 = G__73851;
continue;
} else {
var map__73568 = cljs.core.first(seq__73549__$1);
var map__73568__$1 = cljs.core.__destructure_map(map__73568);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73568__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$1(id);


var G__73854 = cljs.core.next(seq__73549__$1);
var G__73855 = null;
var G__73856 = (0);
var G__73857 = (0);
seq__73549 = G__73854;
chunk__73550 = G__73855;
count__73551 = G__73856;
i__73552 = G__73857;
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
var map__73576 = config;
var map__73576__$1 = cljs.core.__destructure_map(map__73576);
var on_open_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var align = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"align","align",1964212802));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var close_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"content","content",15833224));
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"footer","footer",1606445390));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"title","title",636505583));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var auto_width_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73576__$1,new cljs.core.Keyword(null,"auto-width?","auto-width?",93515862));
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

return daiquiri.interpreter.interpret((function (){var G__73603 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([root_props,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),["modal-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (v){
var set_open_BANG_ = (function (p1__73573_SHARP_){
return logseq.shui.dialog.core.update_modal_BANG_(id,new cljs.core.Keyword(null,"open?","open?",1238443125),p1__73573_SHARP_);
});
if(cljs.core.fn_QMARK_(on_open_change)){
var G__73607 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),v,new cljs.core.Keyword(null,"set-open!","set-open!",503042001),set_open_BANG_], null);
return (on_open_change.cljs$core$IFn$_invoke$arity$1 ? on_open_change.cljs$core$IFn$_invoke$arity$1(G__73607) : on_open_change.call(null,G__73607));
} else {
return set_open_BANG_(v);
}
})], null)], 0));
var G__73604 = (function (){var onPointerDownOutside = new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036).cljs$core$IFn$_invoke$arity$1(content_props);
var content_props__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(content_props,new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),(function (e){
if(cljs.core.fn_QMARK_(onPointerDownOutside)){
(onPointerDownOutside.cljs$core$IFn$_invoke$arity$1 ? onPointerDownOutside.cljs$core$IFn$_invoke$arity$1(e) : onPointerDownOutside.call(null,e));
} else {
}

if(cljs.core.truth_((function (){var G__73609 = e.target;
if((G__73609 == null)){
return null;
} else {
return G__73609.closest(".ui__dialog-overlay");
}
})())){
return null;
} else {
return e.preventDefault();
}
}));
var G__73613 = (function (){var G__73618 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props__$1,content_props__$1], 0));
var G__73618__$1 = (cljs.core.truth_(auto_width_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__73618,new cljs.core.Keyword(null,"data-auto-width","data-auto-width",-1812760474),true):G__73618);
if(close_btn_QMARK_ === false){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__73618__$1,new cljs.core.Keyword(null,"data-close-btn","data-close-btn",-312668419),false);
} else {
return G__73618__$1;
}
})();
var G__73614 = (function (){var G__73624 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(((title == null))?"hidden":null)], null);
var G__73625 = title;
return (logseq.shui.dialog.core.dialog_title.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.dialog_title.cljs$core$IFn$_invoke$arity$2(G__73624,G__73625) : logseq.shui.dialog.core.dialog_title.call(null,G__73624,G__73625));
})();
var G__73615 = (cljs.core.truth_(description)?(logseq.shui.dialog.core.dialog_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.dialog_description.cljs$core$IFn$_invoke$arity$1(description) : logseq.shui.dialog.core.dialog_description.call(null,description)):null);
var G__73616 = (cljs.core.truth_(content)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__dialog-main-content","div.ui__dialog-main-content",-140235567),content], null):null);
var G__73617 = (cljs.core.truth_(footer)?(logseq.shui.dialog.core.dialog_footer.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.dialog_footer.cljs$core$IFn$_invoke$arity$1(footer) : logseq.shui.dialog.core.dialog_footer.call(null,footer)):null);
return (logseq.shui.dialog.core.dialog_content.cljs$core$IFn$_invoke$arity$5 ? logseq.shui.dialog.core.dialog_content.cljs$core$IFn$_invoke$arity$5(G__73613,G__73614,G__73615,G__73616,G__73617) : logseq.shui.dialog.core.dialog_content.call(null,G__73613,G__73614,G__73615,G__73616,G__73617));
})();
return (logseq.shui.dialog.core.dialog.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.dialog.cljs$core$IFn$_invoke$arity$2(G__73603,G__73604) : logseq.shui.dialog.core.dialog.call(null,G__73603,G__73604));
})());
}),null,"logseq.shui.dialog.core/modal-inner");
logseq.shui.dialog.core.alert_inner = rum.core.lazy_build(rum.core.build_defc,(function (config){
var map__73638 = config;
var map__73638__$1 = cljs.core.__destructure_map(map__73638);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"content","content",15833224));
var footer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"footer","footer",1606445390));
var deferred = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"deferred","deferred",-1976960688));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73638__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
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

return daiquiri.interpreter.interpret((function (){var G__73664 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),["alert-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (p1__73630_SHARP_){
return logseq.shui.dialog.core.update_modal_BANG_(id,new cljs.core.Keyword(null,"open?","open?",1238443125),p1__73630_SHARP_);
})], null);
var G__73665 = (function (){var G__73666 = props;
var G__73667 = (cljs.core.truth_((function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return description;
}
})())?(function (){var G__73675 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__alert-dialog-header"], null);
var G__73676 = (cljs.core.truth_(title)?(logseq.shui.dialog.core.alert_dialog_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.alert_dialog_title.cljs$core$IFn$_invoke$arity$1(title) : logseq.shui.dialog.core.alert_dialog_title.call(null,title)):null);
var G__73677 = (cljs.core.truth_(description)?(logseq.shui.dialog.core.alert_dialog_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.dialog.core.alert_dialog_description.cljs$core$IFn$_invoke$arity$1(description) : logseq.shui.dialog.core.alert_dialog_description.call(null,description)):null);
return (logseq.shui.dialog.core.alert_dialog_header.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.dialog.core.alert_dialog_header.cljs$core$IFn$_invoke$arity$3(G__73675,G__73676,G__73677) : logseq.shui.dialog.core.alert_dialog_header.call(null,G__73675,G__73676,G__73677));
})():null);
var G__73668 = (cljs.core.truth_(content)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__alert-dialog-main-content","div.ui__alert-dialog-main-content",306893478),content], null):null);
var G__73669 = (function (){var G__73686 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__alert-dialog-footer"], null);
var G__73687 = (cljs.core.truth_(footer)?footer:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),"ok",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(deferred,true);
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),"OK"], 0))], null));
return (logseq.shui.dialog.core.alert_dialog_footer.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.alert_dialog_footer.cljs$core$IFn$_invoke$arity$2(G__73686,G__73687) : logseq.shui.dialog.core.alert_dialog_footer.call(null,G__73686,G__73687));
})();
return (logseq.shui.dialog.core.alert_dialog_content.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.dialog.core.alert_dialog_content.cljs$core$IFn$_invoke$arity$4(G__73666,G__73667,G__73668,G__73669) : logseq.shui.dialog.core.alert_dialog_content.call(null,G__73666,G__73667,G__73668,G__73669));
})();
return (logseq.shui.dialog.core.alert_dialog.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.dialog.core.alert_dialog.cljs$core$IFn$_invoke$arity$2(G__73664,G__73665) : logseq.shui.dialog.core.alert_dialog.call(null,G__73664,G__73665));
})());
}),null,"logseq.shui.dialog.core/alert-inner");
logseq.shui.dialog.core.confirm_inner = rum.core.lazy_build(rum.core.build_defc,(function (config){
var map__73696 = config;
var map__73696__$1 = cljs.core.__destructure_map(map__73696);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73696__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var deferred = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73696__$1,new cljs.core.Keyword(null,"deferred","deferred",-1976960688));
var outside_cancel_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73696__$1,new cljs.core.Keyword(null,"outside-cancel?","outside-cancel?",-1972964985));
var data_reminder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73696__$1,new cljs.core.Keyword(null,"data-reminder","data-reminder",1296338874));
var reminder_QMARK_ = cljs.core.boolean$((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return data_reminder;
} else {
return and__5000__auto__;
}
})());
var vec__73697 = rum.core.use_state((!(reminder_QMARK_)));
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73697,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73697,(1),null);
var _STAR_ok_ref = rum.core.use_ref(null);
var _STAR_reminder_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(ready_QMARK_)){
var timeout = setTimeout((function (){
var G__73701 = rum.core.deref(_STAR_ok_ref);
if((G__73701 == null)){
return null;
} else {
return G__73701.focus();
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
}catch (e73703){if((e73703 instanceof Error)){
var _e = e73703;
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
} else {
throw e73703;

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
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.items-center.gap-1.text-sm","label.flex.items-center.gap-1.text-sm",-1091634099),(function (){var G__73727 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_reminder_ref], null);
return (logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.form.core.checkbox.cljs$core$IFn$_invoke$arity$1(G__73727) : logseq.shui.form.core.checkbox.call(null,G__73727));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50","span.opacity-50",949060710),"Don't remind me again"], null)], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.gap-2","span.flex.gap-2",-248859702),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),"cancel",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
logseq.shui.dialog.core.close_BANG_.cljs$core$IFn$_invoke$arity$0();

return promesa.core.reject_BANG_(deferred,false);
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),"Cancel"], 0)),logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),"ok",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ok_ref,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var temp__5804__auto___73875 = (function (){var and__5000__auto__ = id;
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
if(cljs.core.truth_(temp__5804__auto___73875)){
var reminder_73876 = temp__5804__auto___73875;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("checked",reminder_73876.dataset.state)){
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
var vec__73746 = logseq.shui.util.use_atom(logseq.shui.dialog.core._STAR_modals);
var modals = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73746,(0),null);
var _set_modals_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73746,(1),null);
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function logseq$shui$dialog$core$iter__73752(s__73753){
return (new cljs.core.LazySeq(null,(function (){
var s__73753__$1 = s__73753;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73753__$1);
if(temp__5804__auto__){
var s__73753__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73753__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73753__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73755 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73754 = (0);
while(true){
if((i__73754 < size__5479__auto__)){
var config = cljs.core._nth(c__5478__auto__,i__73754);
if(cljs.core.map_QMARK_(config)){
cljs.core.chunk_append(b__73755,(function (){var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
var alert_QMARK_ = new cljs.core.Keyword(null,"alert?","alert?",-446067642).cljs$core$IFn$_invoke$arity$1(config);
var config__$1 = logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
var G__73760 = alert_QMARK_;
var G__73760__$1 = (((G__73760 instanceof cljs.core.Keyword))?G__73760.fqn:null);
switch (G__73760__$1) {
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

var G__73886 = (i__73754 + (1));
i__73754 = G__73886;
continue;
} else {
var G__73887 = (i__73754 + (1));
i__73754 = G__73887;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73755),logseq$shui$dialog$core$iter__73752(cljs.core.chunk_rest(s__73753__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73755),null);
}
} else {
var config = cljs.core.first(s__73753__$2);
if(cljs.core.map_QMARK_(config)){
return cljs.core.cons((function (){var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config);
var alert_QMARK_ = new cljs.core.Keyword(null,"alert?","alert?",-446067642).cljs$core$IFn$_invoke$arity$1(config);
var config__$1 = logseq.shui.dialog.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"footer","footer",1606445390)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
var G__73767 = alert_QMARK_;
var G__73767__$1 = (((G__73767 instanceof cljs.core.Keyword))?G__73767.fqn:null);
switch (G__73767__$1) {
case "default":
return logseq.shui.dialog.core.alert_inner(config__$1);

break;
case "confirm":
return logseq.shui.dialog.core.confirm_inner(config__$1);

break;
default:
return logseq.shui.dialog.core.modal_inner(config__$1);

}
})(),logseq$shui$dialog$core$iter__73752(cljs.core.rest(s__73753__$2)));
} else {
var G__73890 = cljs.core.rest(s__73753__$2);
s__73753__$1 = G__73890;
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
