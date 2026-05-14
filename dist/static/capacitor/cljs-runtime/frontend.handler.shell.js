goog.provide('frontend.handler.shell');
frontend.handler.shell.run_git_command_BANG_ = (function frontend$handler$shell$run_git_command_BANG_(command){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"runGit","runGit",2009540349),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"command","command",-894540724),command], null)], 0));
});
frontend.handler.shell.run_git_command2_BANG_ = (function frontend$handler$shell$run_git_command2_BANG_(command){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"runGitWithinCurrentGraph","runGitWithinCurrentGraph",-1631726293),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"command","command",-894540724),command], null)], 0));
});
frontend.handler.shell.run_cli_command_BANG_ = (function frontend$handler$shell$run_cli_command_BANG_(command,args){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"runCli","runCli",1169978825),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",-894540724),command,new cljs.core.Keyword(null,"args","args",1315556576),args,new cljs.core.Keyword(null,"returnResult","returnResult",-1537585855),true], null)], 0));
});
frontend.handler.shell.wrap_notification_BANG_ = (function frontend$handler$shell$wrap_notification_BANG_(command,f,args){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(command,args) : f.call(null,command,args))),(function (result){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(((clojure.string.blank_QMARK_(result))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code.mr-1","code.mr-1",-1737529325),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(command)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(args)].join('')], null),"was executed successfully!"], null):result),new cljs.core.Keyword(null,"success","success",1890645906),false));
}));
}));
});
frontend.handler.shell.commands_denylist = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, ["rm",null,"rename",null,"command",null,"mv",null,"dd",null,"sudo",null,">",null], null), null);
frontend.handler.shell.run_command_BANG_ = (function frontend$handler$shell$run_command_BANG_(command){
var vec__74663 = ((((typeof command === 'string') && (clojure.string.includes_QMARK_(command," "))))?logseq.common.util.split_first(" ",command):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [command,""], null));
var command__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74663,(0),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74663,(1),null);
var command__$2 = (function (){var and__5000__auto__ = command__$1;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.lower_case(command__$1);
} else {
return and__5000__auto__;
}
})();
var args__$1 = clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(args));
if(clojure.string.blank_QMARK_(command__$2)){
return null;
} else {
if(cljs.core.contains_QMARK_(frontend.handler.shell.commands_denylist,command__$2)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(command__$2)," is too dangerous!"].join('')], null),new cljs.core.Keyword(null,"error","error",-978969032));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("git",command__$2)){
return frontend.handler.shell.wrap_notification_BANG_(command__$2,(function (_,args__$2){
return frontend.handler.shell.run_git_command_BANG_(args__$2);
}),args__$1);
} else {
return frontend.handler.shell.run_cli_command_BANG_(command__$2,args__$1);

}
}
}
});
frontend.handler.shell.get_file_latest_git_log = (function frontend$handler$shell$get_file_latest_git_log(page,n){
if(cljs.core.integer_QMARK_(n)){
var file_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page));
var temp__5804__auto__ = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(file_id) : frontend.db.entity.call(null,file_id)));
if(cljs.core.truth_(temp__5804__auto__)){
var path = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.shell.run_git_command_BANG_(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["log",["-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join(''),"--pretty=format:Commit: %C(auto)%h$$$%s$$$%ad","-p",path], null))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__74680_SHARP_){
return clojure.string.starts_with_QMARK_(p1__74680_SHARP_,"Commit: ");
}),clojure.string.split_lines(result))),(function (lines){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","display-file-version-selector","modal/display-file-version-selector",-1615581416),lines,path,(function (hash,path__$1){
return frontend.handler.shell.run_git_command_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["show",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(hash),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path__$1)].join('')], null));
})], null)));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.shell.set_git_username_and_email = (function frontend$handler$shell$set_git_username_and_email(username,email){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.shell.run_git_command_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["config","--global","user.name",username], null))),(function (_r1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.shell.run_git_command_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["config","--global","user.email",email], null))),(function (_r2){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"git config successfully!"], null),new cljs.core.Keyword(null,"success","success",1890645906)));
}));
}));
}));
}));
});
frontend.handler.shell.run_cli_command_wrapper_BANG_ = (function frontend$handler$shell$run_cli_command_wrapper_BANG_(command,content){
var args = (function (){var G__74685 = command;
switch (G__74685) {
case "alda":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("play -c \"%s\"",content) : frontend.util.format.call(null,"play -c \"%s\"",content));

break;
default:
return content;

}
})();
return frontend.handler.shell.run_cli_command_BANG_(command,args);
});

//# sourceMappingURL=frontend.handler.shell.js.map
