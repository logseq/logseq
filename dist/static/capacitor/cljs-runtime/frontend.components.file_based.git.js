goog.provide('frontend.components.file_based.git');
frontend.components.file_based.git.set_git_username_and_email = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var username = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.git","username","frontend.components.file-based.git/username",1658496364));
var email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.git","email","frontend.components.file-based.git/email",1226674480));
return daiquiri.core.create_element("div",{'className':"container"},[daiquiri.core.create_element("div",{'className':"text-lg mb-4"},["Git requires to setup your username and email address to commit, both of them will be stored locally."]),daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium"},["Your username:"])])]),daiquiri.core.create_element("input",{'autoFocus':true,'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(username,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2 mb-4"},[]),daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium"},["Your email address:"])])]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(email,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),(function (){var attrs93431 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var username__$1 = cljs.core.deref(username);
var email__$1 = cljs.core.deref(email);
if((((!(clojure.string.blank_QMARK_(username__$1)))) && ((!(clojure.string.blank_QMARK_(email__$1)))))){
return frontend.handler.shell.set_git_username_and_email(username__$1,email__$1);
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93431))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-5","sm:mt-4","flex"], null)], null),attrs93431], 0))):{'className':"mt-5 sm:mt-4 flex"}),((cljs.core.map_QMARK_(attrs93431))?null:[daiquiri.interpreter.interpret(attrs93431)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.file-based.git","username","frontend.components.file-based.git/username",1658496364)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.file-based.git","email","frontend.components.file-based.git/email",1226674480))], null),"frontend.components.file-based.git/set-git-username-and-email");
frontend.components.file_based.git.file_version_selector = rum.core.lazy_build(rum.core.build_defc,(function (versions,path,get_content){
var vec__93432 = rum.core.use_state(null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93432,(0),null);
var set_content_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93432,(1),null);
var vec__93435 = rum.core.use_state("HEAD");
var hash = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93435,(0),null);
var set_hash_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93435,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((get_content.cljs$core$IFn$_invoke$arity$2 ? get_content.cljs$core$IFn$_invoke$arity$2(hash,path) : get_content.call(null,hash,path))),(function (c){
return promesa.protocols._promise((set_content_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_content_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_content_BANG_.call(null,c)));
}));
}));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hash,path], null));

return daiquiri.core.create_element("div",{'className':"flex overflow-y-auto max-h-[calc(85vh_-_4rem)]"},[daiquiri.core.create_element("div",{'className':"overflow-y-auto w-48 max-h-[calc(85vh_-_4rem)] "},[daiquiri.core.create_element("div",{'className':"font-bold"},["File history - ",daiquiri.interpreter.interpret(path)]),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$file_based$git$iter__93438(s__93439){
return (new cljs.core.LazySeq(null,(function (){
var s__93439__$1 = s__93439;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93439__$1);
if(temp__5804__auto__){
var s__93439__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93439__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93439__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93441 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93440 = (0);
while(true){
if((i__93440 < size__5479__auto__)){
var line = cljs.core._nth(c__5478__auto__,i__93440);
cljs.core.chunk_append(b__93441,(function (){var vec__93442 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(line,"$$$");
var hash__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93442,(0),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93442,(1),null);
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93442,(2),null);
var hash__$2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(hash__$1,(8));
return daiquiri.core.create_element("div",{'key':hash__$2,'className':"my-4"},[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"mb-2"},[daiquiri.core.create_element("a",{'onClick':((function (i__93440,vec__93442,hash__$1,title,time,hash__$2,line,c__5478__auto__,size__5479__auto__,b__93441,s__93439__$2,temp__5804__auto__,vec__93432,content,set_content_BANG_,vec__93435,hash,set_hash_BANG_){
return (function (){
return (set_hash_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hash_BANG_.cljs$core$IFn$_invoke$arity$1(hash__$2) : set_hash_BANG_.call(null,hash__$2));
});})(i__93440,vec__93442,hash__$1,title,time,hash__$2,line,c__5478__auto__,size__5479__auto__,b__93441,s__93439__$2,temp__5804__auto__,vec__93432,content,set_content_BANG_,vec__93435,hash,set_hash_BANG_))
,'className':"font-medium mr-1 block"},[hash__$2]),daiquiri.interpreter.interpret(title)]),(function (){var attrs93447 = time;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93447))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs93447], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs93447))?null:[daiquiri.interpreter.interpret(attrs93447)]));
})()]);
})());

var G__93452 = (i__93440 + (1));
i__93440 = G__93452;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93441),frontend$components$file_based$git$iter__93438(cljs.core.chunk_rest(s__93439__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93441),null);
}
} else {
var line = cljs.core.first(s__93439__$2);
return cljs.core.cons((function (){var vec__93448 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(line,"$$$");
var hash__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93448,(0),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93448,(1),null);
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93448,(2),null);
var hash__$2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(hash__$1,(8));
return daiquiri.core.create_element("div",{'key':hash__$2,'className':"my-4"},[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"mb-2"},[daiquiri.core.create_element("a",{'onClick':((function (vec__93448,hash__$1,title,time,hash__$2,line,s__93439__$2,temp__5804__auto__,vec__93432,content,set_content_BANG_,vec__93435,hash,set_hash_BANG_){
return (function (){
return (set_hash_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hash_BANG_.cljs$core$IFn$_invoke$arity$1(hash__$2) : set_hash_BANG_.call(null,hash__$2));
});})(vec__93448,hash__$1,title,time,hash__$2,line,s__93439__$2,temp__5804__auto__,vec__93432,content,set_content_BANG_,vec__93435,hash,set_hash_BANG_))
,'className':"font-medium mr-1 block"},[hash__$2]),daiquiri.interpreter.interpret(title)]),(function (){var attrs93447 = time;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93447))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs93447], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs93447))?null:[daiquiri.interpreter.interpret(attrs93447)]));
})()]);
})(),frontend$components$file_based$git$iter__93438(cljs.core.rest(s__93439__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(versions);
})())]),daiquiri.core.create_element("div",{'className':"flex-1 p-4"},[daiquiri.core.create_element("div",{'style':{'width':(700)},'className':"w-full sm:max-w-lg"},[daiquiri.core.create_element("div",{'className':"font-bold mb-4"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(" (%s)",hash) : frontend.util.format.call(null," (%s)",hash)))].join('')]),(function (){var attrs93451 = content;
return daiquiri.core.create_element("pre",((cljs.core.map_QMARK_(attrs93451))?daiquiri.interpreter.element_attributes(attrs93451):null),((cljs.core.map_QMARK_(attrs93451))?null:[daiquiri.interpreter.interpret(attrs93451)]));
})(),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Revert",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.file_based.file.alter_file(frontend.state.get_current_repo(),path,content,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
})], 0)))])])]);
}),null,"frontend.components.file-based.git/file-version-selector");

//# sourceMappingURL=frontend.components.file_based.git.js.map
