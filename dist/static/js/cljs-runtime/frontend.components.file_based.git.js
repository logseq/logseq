goog.provide('frontend.components.file_based.git');
frontend.components.file_based.git.set_git_username_and_email = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var username = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.git","username","frontend.components.file-based.git/username",1658496364));
var email = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.git","email","frontend.components.file-based.git/email",1226674480));
return daiquiri.core.create_element("div",{'className':"container"},[daiquiri.core.create_element("div",{'className':"text-lg mb-4"},["Git requires to setup your username and email address to commit, both of them will be stored locally."]),daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium"},["Your username:"])])]),daiquiri.core.create_element("input",{'autoFocus':true,'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(username,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2 mb-4"},[]),daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium"},["Your email address:"])])]),daiquiri.core.create_element("input",{'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(email,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),(function (){var attrs128171 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var username__$1 = cljs.core.deref(username);
var email__$1 = cljs.core.deref(email);
if((((!(clojure.string.blank_QMARK_(username__$1)))) && ((!(clojure.string.blank_QMARK_(email__$1)))))){
return frontend.handler.shell.set_git_username_and_email(username__$1,email__$1);
} else {
return null;
}
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128171))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-5","sm:mt-4","flex"], null)], null),attrs128171], 0))):{'className':"mt-5 sm:mt-4 flex"}),((cljs.core.map_QMARK_(attrs128171))?null:[daiquiri.interpreter.interpret(attrs128171)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.file-based.git","username","frontend.components.file-based.git/username",1658496364)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.file-based.git","email","frontend.components.file-based.git/email",1226674480))], null),"frontend.components.file-based.git/set-git-username-and-email");
frontend.components.file_based.git.file_version_selector = rum.core.lazy_build(rum.core.build_defc,(function (versions,path,get_content){
var vec__128186 = rum.core.use_state(null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128186,(0),null);
var set_content_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128186,(1),null);
var vec__128189 = rum.core.use_state("HEAD");
var hash = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128189,(0),null);
var set_hash_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128189,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((get_content.cljs$core$IFn$_invoke$arity$2 ? get_content.cljs$core$IFn$_invoke$arity$2(hash,path) : get_content.call(null,hash,path))),(function (c){
return promesa.protocols._promise((set_content_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_content_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_content_BANG_.call(null,c)));
}));
}));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hash,path], null));

return daiquiri.core.create_element("div",{'className':"flex overflow-y-auto max-h-[calc(85vh_-_4rem)]"},[daiquiri.core.create_element("div",{'className':"overflow-y-auto w-48 max-h-[calc(85vh_-_4rem)] "},[daiquiri.core.create_element("div",{'className':"font-bold"},["File history - ",daiquiri.interpreter.interpret(path)]),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$file_based$git$iter__128197(s__128198){
return (new cljs.core.LazySeq(null,(function (){
var s__128198__$1 = s__128198;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__128198__$1);
if(temp__5804__auto__){
var s__128198__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__128198__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128198__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128200 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128199 = (0);
while(true){
if((i__128199 < size__5479__auto__)){
var line = cljs.core._nth(c__5478__auto__,i__128199);
cljs.core.chunk_append(b__128200,(function (){var vec__128201 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(line,"$$$");
var hash__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128201,(0),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128201,(1),null);
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128201,(2),null);
var hash__$2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(hash__$1,(8));
return daiquiri.core.create_element("div",{'key':hash__$2,'className':"my-4"},[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"mb-2"},[daiquiri.core.create_element("a",{'onClick':((function (i__128199,vec__128201,hash__$1,title,time,hash__$2,line,c__5478__auto__,size__5479__auto__,b__128200,s__128198__$2,temp__5804__auto__,vec__128186,content,set_content_BANG_,vec__128189,hash,set_hash_BANG_){
return (function (){
return (set_hash_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hash_BANG_.cljs$core$IFn$_invoke$arity$1(hash__$2) : set_hash_BANG_.call(null,hash__$2));
});})(i__128199,vec__128201,hash__$1,title,time,hash__$2,line,c__5478__auto__,size__5479__auto__,b__128200,s__128198__$2,temp__5804__auto__,vec__128186,content,set_content_BANG_,vec__128189,hash,set_hash_BANG_))
,'className':"font-medium mr-1 block"},[hash__$2]),daiquiri.interpreter.interpret(title)]),(function (){var attrs128206 = time;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128206))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs128206], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs128206))?null:[daiquiri.interpreter.interpret(attrs128206)]));
})()]);
})());

var G__128220 = (i__128199 + (1));
i__128199 = G__128220;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128200),frontend$components$file_based$git$iter__128197(cljs.core.chunk_rest(s__128198__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128200),null);
}
} else {
var line = cljs.core.first(s__128198__$2);
return cljs.core.cons((function (){var vec__128208 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(line,"$$$");
var hash__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128208,(0),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128208,(1),null);
var time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128208,(2),null);
var hash__$2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(hash__$1,(8));
return daiquiri.core.create_element("div",{'key':hash__$2,'className':"my-4"},[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"mb-2"},[daiquiri.core.create_element("a",{'onClick':((function (vec__128208,hash__$1,title,time,hash__$2,line,s__128198__$2,temp__5804__auto__,vec__128186,content,set_content_BANG_,vec__128189,hash,set_hash_BANG_){
return (function (){
return (set_hash_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hash_BANG_.cljs$core$IFn$_invoke$arity$1(hash__$2) : set_hash_BANG_.call(null,hash__$2));
});})(vec__128208,hash__$1,title,time,hash__$2,line,s__128198__$2,temp__5804__auto__,vec__128186,content,set_content_BANG_,vec__128189,hash,set_hash_BANG_))
,'className':"font-medium mr-1 block"},[hash__$2]),daiquiri.interpreter.interpret(title)]),(function (){var attrs128206 = time;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128206))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50","text-sm"], null)], null),attrs128206], 0))):{'className':"opacity-50 text-sm"}),((cljs.core.map_QMARK_(attrs128206))?null:[daiquiri.interpreter.interpret(attrs128206)]));
})()]);
})(),frontend$components$file_based$git$iter__128197(cljs.core.rest(s__128198__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(versions);
})())]),daiquiri.core.create_element("div",{'className':"flex-1 p-4"},[daiquiri.core.create_element("div",{'style':{'width':(700)},'className':"w-full sm:max-w-lg"},[daiquiri.core.create_element("div",{'className':"font-bold mb-4"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(" (%s)",hash) : frontend.util.format.call(null," (%s)",hash)))].join('')]),(function (){var attrs128217 = content;
return daiquiri.core.create_element("pre",((cljs.core.map_QMARK_(attrs128217))?daiquiri.interpreter.element_attributes(attrs128217):null),((cljs.core.map_QMARK_(attrs128217))?null:[daiquiri.interpreter.interpret(attrs128217)]));
})(),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Revert",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.file_based.file.alter_file(frontend.state.get_current_repo(),path,content,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"re-render-root?","re-render-root?",-1452609623),true,new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
})], 0)))])])]);
}),null,"frontend.components.file-based.git/file-version-selector");

//# sourceMappingURL=frontend.components.file_based.git.js.map
