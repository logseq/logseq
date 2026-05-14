goog.provide('frontend.components.imports');
goog.scope(function(){
  frontend.components.imports.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.imports !== 'undefined') && (typeof frontend.components.imports._STAR_opml_imported_pages !== 'undefined')){
} else {
frontend.components.imports._STAR_opml_imported_pages = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.imports.finished_cb = (function frontend$components$imports$finished_cb(){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Import finished!",new cljs.core.Keyword(null,"success","success",1890645906));

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"import-indicator","import-indicator",-732235210)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"import-indicator","import-indicator",-732235210)));

frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

if(frontend.util.web_platform_QMARK_){
return window.location.reload();
} else {
return setTimeout(frontend.handler.ui.re_render_root_BANG_,(500));
}
});
frontend.components.imports.roam_import_handler = (function frontend$components$imports$roam_import_handler(e){
var file = cljs.core.first(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(e.target.files));
var file_name = frontend.components.imports.goog$module$goog$object.get(file,"name");
if(clojure.string.ends_with_QMARK_(file_name,".json")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword(null,"roam-json","roam-json",-1568267165));

var reader = (new FileReader());
(reader.onload = (function (e__$1){
var text = e__$1.target.result;
return frontend.handler.file_based.import$.import_from_roam_json_BANG_(text,(function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null);

return frontend.components.imports.finished_cb();
}));
}));

return reader.readAsText(file);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please choose a JSON file.",new cljs.core.Keyword(null,"error","error",-978969032));
}
});
frontend.components.imports.lsq_import_handler = (function frontend$components$imports$lsq_import_handler(var_args){
var args__5732__auto__ = [];
var len__5726__auto___131630 = arguments.length;
var i__5727__auto___131631 = (0);
while(true){
if((i__5727__auto___131631 < len__5726__auto___131630)){
args__5732__auto__.push((arguments[i__5727__auto___131631]));

var G__131632 = (i__5727__auto___131631 + (1));
i__5727__auto___131631 = G__131632;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.components.imports.lsq_import_handler.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.components.imports.lsq_import_handler.cljs$core$IFn$_invoke$arity$variadic = (function (e,p__131269){
var map__131270 = p__131269;
var map__131270__$1 = cljs.core.__destructure_map(map__131270);
var sqlite_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131270__$1,new cljs.core.Keyword(null,"sqlite?","sqlite?",1827775537));
var debug_transit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131270__$1,new cljs.core.Keyword(null,"debug-transit?","debug-transit?",-1402926414));
var graph_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131270__$1,new cljs.core.Keyword(null,"graph-name","graph-name",416773857));
var db_edn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131270__$1,new cljs.core.Keyword(null,"db-edn?","db-edn?",-448928080));
var file = cljs.core.first(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(e.target.files));
var file_name = (function (){var G__131271 = frontend.components.imports.goog$module$goog$object.get(file,"name");
if((G__131271 == null)){
return null;
} else {
return clojure.string.lower_case(G__131271);
}
})();
var edn_QMARK_ = clojure.string.ends_with_QMARK_(file_name,".edn");
var json_QMARK_ = clojure.string.ends_with_QMARK_(file_name,".json");
if(cljs.core.truth_(sqlite_QMARK_)){
var graph_name__$1 = clojure.string.trim(graph_name);
if(clojure.string.blank_QMARK_(graph_name__$1)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Empty graph name.",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
if(cljs.core.truth_(frontend.handler.repo.graph_already_exists_QMARK_(graph_name__$1))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please specify another name as another graph with this name already exists!",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
var reader = (new FileReader());
(reader.onload = (function (){
var buffer = reader.result;
frontend.handler.db_based.import$.import_from_sqlite_db_BANG_(buffer,graph_name__$1,frontend.components.imports.finished_cb);

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
}));

(reader.onerror = (function (e__$1){
return console.error(e__$1);
}));

(reader.onabort = (function (e__$1){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"aborted","aborted",1775972619)], 0));

return console.error(e__$1);
}));

return reader.readAsArrayBuffer(file);

}
}
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = debug_transit_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return db_edn_QMARK_;
}
})())){
var graph_name__$1 = clojure.string.trim(graph_name);
if(clojure.string.blank_QMARK_(graph_name__$1)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Empty graph name.",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
if(cljs.core.truth_(frontend.handler.repo.graph_already_exists_QMARK_(graph_name__$1))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please specify another name as another graph with this name already exists!",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword(null,"logseq","logseq",-928939893));

var reader = (new FileReader());
var import_f = (cljs.core.truth_(db_edn_QMARK_)?frontend.handler.db_based.import$.import_from_edn_file_BANG_:frontend.handler.db_based.import$.import_from_debug_transit_BANG_);
(reader.onload = (function (e__$1){
var text = e__$1.target.result;
var G__131272 = graph_name__$1;
var G__131273 = text;
var G__131274 = (function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null);

frontend.components.imports.finished_cb();

return (logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_all_BANG_.call(null));
});
return (import_f.cljs$core$IFn$_invoke$arity$3 ? import_f.cljs$core$IFn$_invoke$arity$3(G__131272,G__131273,G__131274) : import_f.call(null,G__131272,G__131273,G__131274));
}));

return reader.readAsText(file);

}
}
} else {
if(((edn_QMARK_) || (json_QMARK_))){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword(null,"logseq","logseq",-928939893));

var reader = (new FileReader());
var import_f = ((edn_QMARK_)?frontend.handler.import$.import_from_edn_BANG_:frontend.handler.import$.import_from_json_BANG_);
(reader.onload = (function (e__$1){
var text = e__$1.target.result;
var G__131275 = text;
var G__131276 = (function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null);

return frontend.components.imports.finished_cb();
});
return (import_f.cljs$core$IFn$_invoke$arity$2 ? import_f.cljs$core$IFn$_invoke$arity$2(G__131275,G__131276) : import_f.call(null,G__131275,G__131276));
}));

return reader.readAsText(file);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please choose an EDN or a JSON file.",new cljs.core.Keyword(null,"error","error",-978969032));

}
}
}
}));

(frontend.components.imports.lsq_import_handler.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.components.imports.lsq_import_handler.cljs$lang$applyTo = (function (seq131267){
var G__131268 = cljs.core.first(seq131267);
var seq131267__$1 = cljs.core.next(seq131267);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__131268,seq131267__$1);
}));

frontend.components.imports.opml_import_handler = (function frontend$components$imports$opml_import_handler(e){
var file = cljs.core.first(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(e.target.files));
var file_name = frontend.components.imports.goog$module$goog$object.get(file,"name");
if(clojure.string.ends_with_QMARK_(file_name,".opml")){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword(null,"opml","opml",2114938640));

var reader = (new FileReader());
(reader.onload = (function (e__$1){
var text = e__$1.target.result;
return frontend.handler.import$.import_from_opml_BANG_(text,(function (pages){
cljs.core.reset_BANG_(frontend.components.imports._STAR_opml_imported_pages,pages);

frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null);

return frontend.components.imports.finished_cb();
}));
}));

return reader.readAsText(file);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please choose a OPML file.",new cljs.core.Keyword(null,"error","error",-978969032));
}
});
frontend.components.imports.set_graph_name_dialog = rum.core.lazy_build(rum.core.build_defcs,(function (state,input_e,opts){
var _STAR_input = new cljs.core.Keyword("frontend.components.imports","input","frontend.components.imports/input",570142635).cljs$core$IFn$_invoke$arity$1(state);
var on_submit = (function (){
if(cljs.core.truth_(frontend.components.repo.invalid_graph_name_QMARK_(cljs.core.deref(_STAR_input)))){
return frontend.components.repo.invalid_graph_name_warning();
} else {
return frontend.components.imports.lsq_import_handler.cljs$core$IFn$_invoke$arity$variadic(input_e,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"graph-name","graph-name",416773857),cljs.core.deref(_STAR_input))], 0));
}
});
return daiquiri.core.create_element("div",{'className':"container"},[daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium pb-2"},["New graph name:"])])]),daiquiri.core.create_element("input",{'autoFocus':true,'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(_STAR_input,frontend.util.evalue(e));
})),'onKeyDown':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
return on_submit();
} else {
return null;
}
}),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2 mb-4"},[]),(function (){var attrs131279 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_submit], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131279))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-5","sm:mt-4","flex"], null)], null),attrs131279], 0))):{'className':"mt-5 sm:mt-4 flex"}),((cljs.core.map_QMARK_(attrs131279))?null:[daiquiri.interpreter.interpret(attrs131279)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.imports","input","frontend.components.imports/input",570142635))], null),"frontend.components.imports/set-graph-name-dialog");
frontend.components.imports.import_file_graph_dialog = rum.core.lazy_build(rum.core.build_defc,(function (initial_name,on_submit_fn){
var attrs131372 = (function (){var form_ctx = logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"defaultValues","defaultValues",422888972),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"graph-name","graph-name",416773857),initial_name,new cljs.core.Keyword(null,"convert-all-tags?","convert-all-tags?",-1869310481),true,new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327),"",new cljs.core.Keyword(null,"remove-inline-tags?","remove-inline-tags?",-1198387053),true,new cljs.core.Keyword(null,"property-classes","property-classes",1129964490),"",new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305),""], null),new cljs.core.Keyword(null,"yupSchema","yupSchema",-1266946445),logseq.shui.form.core.yup.object().shape(({"graph-name": logseq.shui.form.core.yup.string().required()})).required()], null));
var handle_submit = new cljs.core.Keyword(null,"handleSubmit","handleSubmit",65998088).cljs$core$IFn$_invoke$arity$1(form_ctx);
var on_submit_valid = (function (){var G__131376 = (function (e){
var G__131377_131633 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(e,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
(on_submit_fn.cljs$core$IFn$_invoke$arity$1 ? on_submit_fn.cljs$core$IFn$_invoke$arity$1(G__131377_131633) : on_submit_fn.call(null,G__131377_131633));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
});
return (handle_submit.cljs$core$IFn$_invoke$arity$1 ? handle_submit.cljs$core$IFn$_invoke$arity$1(G__131376) : handle_submit.call(null,G__131376));
})();
var vec__131373 = rum.core.use_state(true);
var convert_all_tags_input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131373,(0),null);
var set_convert_all_tags_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131373,(1),null);
var G__131378 = form_ctx;
var G__131379 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-submit","on-submit",1227871159),on_submit_valid], null),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"graph-name"], null),(function (field,error){
var G__131380 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("New graph name") : logseq.shui.ui.form_label.call(null,"New graph name"));
var G__131381 = (function (){var G__131383 = (function (){var G__131384 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Graph name"], null),field], 0));
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__131384) : logseq.shui.ui.input.call(null,G__131384));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131383) : logseq.shui.ui.form_control.call(null,G__131383));
})();
var G__131382 = (cljs.core.truth_(error)?(function (){var G__131385 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.text-red-800","b.text-red-800",1802050661),new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(error)], null);
return (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1(G__131385) : logseq.shui.ui.form_description.call(null,G__131385));
})():null);
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__131380,G__131381,G__131382) : logseq.shui.ui.form_item.call(null,G__131380,G__131381,G__131382));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"convert-all-tags?"], null),(function (field){
var G__131386 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"], null);
var G__131387 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Import all tags") : logseq.shui.ui.form_label.call(null,"Import all tags"));
var G__131388 = (function (){var G__131389 = (function (){var G__131390 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(field),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (e){
var fexpr__131391_131634 = new cljs.core.Keyword(null,"onChange","onChange",-312891301).cljs$core$IFn$_invoke$arity$1(field);
(fexpr__131391_131634.cljs$core$IFn$_invoke$arity$1 ? fexpr__131391_131634.cljs$core$IFn$_invoke$arity$1(e) : fexpr__131391_131634.call(null,e));

var G__131392 = cljs.core.not(convert_all_tags_input);
return (set_convert_all_tags_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_convert_all_tags_input_BANG_.cljs$core$IFn$_invoke$arity$1(G__131392) : set_convert_all_tags_input_BANG_.call(null,G__131392));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__131390) : logseq.shui.ui.checkbox.call(null,G__131390));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131389) : logseq.shui.ui.form_control.call(null,G__131389));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__131386,G__131387,G__131388) : logseq.shui.ui.form_item.call(null,G__131386,G__131387,G__131388));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"tag-classes"], null),(function (field,_error){
var G__131393 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-3"], null);
var G__131394 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Import specific tags") : logseq.shui.ui.form_label.call(null,"Import specific tags"));
var G__131395 = (function (){var G__131397 = (function (){var G__131398 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([field,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"tag 1, tag 2",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),convert_all_tags_input], null)], 0));
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__131398) : logseq.shui.ui.input.call(null,G__131398));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131397) : logseq.shui.ui.form_control.call(null,G__131397));
})();
var G__131396 = (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1("Tags are case insensitive") : logseq.shui.ui.form_description.call(null,"Tags are case insensitive"));
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4(G__131393,G__131394,G__131395,G__131396) : logseq.shui.ui.form_item.call(null,G__131393,G__131394,G__131395,G__131396));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"remove-inline-tags?"], null),(function (field){
var G__131399 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"], null);
var G__131400 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Remove inline tags") : logseq.shui.ui.form_label.call(null,"Remove inline tags"));
var G__131401 = (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1("Default behavior for DB graphs") : logseq.shui.ui.form_description.call(null,"Default behavior for DB graphs"));
var G__131402 = (function (){var G__131403 = (function (){var G__131404 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(field),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),new cljs.core.Keyword(null,"onChange","onChange",-312891301).cljs$core$IFn$_invoke$arity$1(field)], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__131404) : logseq.shui.ui.checkbox.call(null,G__131404));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131403) : logseq.shui.ui.form_control.call(null,G__131403));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4(G__131399,G__131400,G__131401,G__131402) : logseq.shui.ui.form_item.call(null,G__131399,G__131400,G__131401,G__131402));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"property-classes"], null),(function (field,_error){
var G__131405 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-3"], null);
var G__131406 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Import additional tags from property values") : logseq.shui.ui.form_label.call(null,"Import additional tags from property values"));
var G__131407 = (function (){var G__131409 = (function (){var G__131410 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. type"], null),field], 0));
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__131410) : logseq.shui.ui.input.call(null,G__131410));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131409) : logseq.shui.ui.form_control.call(null,G__131409));
})();
var G__131408 = (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1("Properties are case insensitive and separated by commas") : logseq.shui.ui.form_description.call(null,"Properties are case insensitive and separated by commas"));
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4(G__131405,G__131406,G__131407,G__131408) : logseq.shui.ui.form_item.call(null,G__131405,G__131406,G__131407,G__131408));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"property-parent-classes"], null),(function (field,_error){
var G__131411 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-3"], null);
var G__131412 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Import tag parents from property values") : logseq.shui.ui.form_label.call(null,"Import tag parents from property values"));
var G__131413 = (function (){var G__131415 = (function (){var G__131416 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"e.g. parent"], null),field], 0));
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__131416) : logseq.shui.ui.input.call(null,G__131416));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__131415) : logseq.shui.ui.form_control.call(null,G__131415));
})();
var G__131414 = (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1("Properties are case insensitive and separated by commas") : logseq.shui.ui.form_description.call(null,"Properties are case insensitive and separated by commas"));
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$4(G__131411,G__131412,G__131413,G__131414) : logseq.shui.ui.form_item.call(null,G__131411,G__131412,G__131413,G__131414));
})),(function (){var G__131417 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"submit",new cljs.core.Keyword(null,"class","class",-2030961996),"right-0 mt-3"], null);
var G__131418 = "Submit";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__131417,G__131418) : logseq.shui.ui.button.call(null,G__131417,G__131418));
})()], null);
return (logseq.shui.ui.form_provider.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.form_provider.cljs$core$IFn$_invoke$arity$2(G__131378,G__131379) : logseq.shui.ui.form_provider.call(null,G__131378,G__131379));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131372))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["border","p-6","rounded","bg-gray-01","mt-4"], null)], null),attrs131372], 0))):{'className':"border p-6 rounded bg-gray-01 mt-4"}),((cljs.core.map_QMARK_(attrs131372))?null:[daiquiri.interpreter.interpret(attrs131372)]));
}),null,"frontend.components.imports/import-file-graph-dialog");
frontend.components.imports.validate_imported_data = (function frontend$components$imports$validate_imported_data(db,import_state,files){
var temp__5804__auto___131635 = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131419_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("org",logseq.common.path.file_ext(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131419_SHARP_)));
}),files));
if(temp__5804__auto___131635){
var org_files_131636 = temp__5804__auto___131635;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"org-files","org-files",1803852418),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168),org_files_131636),new cljs.core.Keyword(null,"line","line",212345235),290], null)),null);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Imported ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(org_files_131636))," org file(s) as markdown. Support for org files will be added later."].join(''),new cljs.core.Keyword(null,"info","info",-317069002),false);
} else {
}

var temp__5804__auto___131637 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"ignored-files","ignored-files",-257976).cljs$core$IFn$_invoke$arity$1(import_state)));
if(temp__5804__auto___131637){
var ignored_files_131638 = temp__5804__auto___131637;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Import ignored ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(ignored_files_131638))," ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(ignored_files_131638)))?"file":"files"),". See the javascript console for more details."].join(''),new cljs.core.Keyword(null,"info","info",-317069002),false);

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-ignored-files","import-ignored-files",-995698175),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import ignored ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(ignored_files_131638))," file(s)"].join('')], null),new cljs.core.Keyword(null,"line","line",212345235),298], null)),null);

cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(ignored_files_131638);
} else {
}

var temp__5804__auto___131639 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"ignored-properties","ignored-properties",-2000184055).cljs$core$IFn$_invoke$arity$1(import_state)));
if(temp__5804__auto___131639){
var ignored_props_131640 = temp__5804__auto___131639;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".mb-2",".mb-2",-2014745458),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".text-lg.mb-2",".text-lg.mb-2",508238774),["Import ignored ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(ignored_props_131640))," ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(ignored_props_131640)))?"property":"properties")].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),"To fix a property type, change the property value to the correct type and reimport the graph"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131420){
var vec__131421 = p__131420;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131421,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131421,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl.my-2.mb-0","dl.my-2.mb-0",1765111560),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt.m-0","dt.m-0",193407064),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-warning"], null),v], null)], null);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131424){
var map__131425 = p__131424;
var map__131425__$1 = cljs.core.__destructure_map(map__131425);
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131425__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131425__$1,new cljs.core.Keyword(null,"value","value",305978217));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131425__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var location__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131425__$1,new cljs.core.Keyword(null,"location","location",1815599388));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [["Property ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([property], 0))," with value ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0))].join(''),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword(null,"icon","icon",1679606541)))?(cljs.core.truth_(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(location__$1))?["Page icons can't be imported. Go to the page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(location__$1)], 0))," to manually import it."].join(''):["Block icons can't be imported. Manually import it at the block: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(location__$1)], 0))].join('')):((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"to","to",192099007)], null)),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"from","from",1815293044)], null))))?["Property value has type ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"to","to",192099007)], null)))," instead of type ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"from","from",1815293044)], null)))].join(''):"Property should be imported manually"))], null);
}),ignored_props_131640))], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
} else {
}

var map__131426 = logseq.db.frontend.validate.validate_db_BANG_(db);
var map__131426__$1 = cljs.core.__destructure_map(map__131426);
var errors = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131426__$1,new cljs.core.Keyword(null,"errors","errors",-908790718));
var datom_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131426__$1,new cljs.core.Keyword(null,"datom-count","datom-count",515794351));
var entities = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131426__$1,new cljs.core.Keyword(null,"entities","entities",1940967403));
if(cljs.core.truth_(errors)){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-errors","import-errors",310086770),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import detected ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(errors))," invalid block(s):"].join(''),new cljs.core.Keyword(null,"counts","counts",234305892),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.frontend.validate.graph_counts(db,entities),new cljs.core.Keyword(null,"datoms","datoms",-290874434),datom_count)], null),new cljs.core.Keyword(null,"line","line",212345235),325], null)),null);

cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(errors);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Import detected ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(errors))," invalid block(s). These blocks may be buggy when you interact with them. See the javascript console for more."].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-valid","import-valid",984736050),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Valid import!",new cljs.core.Keyword(null,"counts","counts",234305892),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.frontend.validate.graph_counts(db,entities),new cljs.core.Keyword(null,"datoms","datoms",-290874434),datom_count)], null),new cljs.core.Keyword(null,"line","line",212345235),330], null)),null);
}
});
frontend.components.imports.show_notification = (function frontend$components$imports$show_notification(p__131427){
var map__131428 = p__131427;
var map__131428__$1 = cljs.core.__destructure_map(map__131428);
var msg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131428__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131428__$1,new cljs.core.Keyword(null,"level","level",1290497552));
var ex_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131428__$1,new cljs.core.Keyword(null,"ex-data","ex-data",-309040259));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"error","error",-978969032),level)){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.Keyword(null,"error","error",-978969032));

if(cljs.core.truth_(ex_data)){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-error","import-error",1672727808),ex_data,new cljs.core.Keyword(null,"line","line",212345235),338], null)),null);
} else {
return null;
}
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
}
});
frontend.components.imports.copy_asset = (function frontend$components$imports$copy_asset(repo,repo_dir,file){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file-object","file-object",-1396844020).cljs$core$IFn$_invoke$arity$1(file).arrayBuffer(),(function (buffer){
var content = (new Uint8Array(buffer));
var parent_dir = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(repo_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.common.path.dirname(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(file))], 0));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(parent_dir)),(function (___41611__auto__){
return promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,repo_dir,new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(file),content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-transact?","skip-transact?",-1820887310),true], null)));
}));
}));
}));
});
frontend.components.imports.import_file_graph = (function frontend$components$imports$import_file_graph(_STAR_files,p__131430,config_file){
var map__131431 = p__131430;
var map__131431__$1 = cljs.core.__destructure_map(map__131431);
var user_options = map__131431__$1;
var graph_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131431__$1,new cljs.core.Keyword(null,"graph-name","graph-name",416773857));
var tag_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131431__$1,new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327));
var property_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131431__$1,new cljs.core.Keyword(null,"property-classes","property-classes",1129964490));
var property_parent_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131431__$1,new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305));
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),new cljs.core.Keyword(null,"file-graph","file-graph",-246966187));

frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-page","current-page",-101294180)], null),"Config files");

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_time.core.now()),(function (start_time){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$2(graph_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file-graph-import?","file-graph-import?",-2126895083),true], null))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(repo,false) : frontend.db.get_db.call(null,repo,false))),(function (db_conn){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"export-file","export-file",-1808912864),new cljs.core.Keyword(null,"default-config","default-config",-695396957),new cljs.core.Keyword(null,"<save-logseq-file","<save-logseq-file",289148715),new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),new cljs.core.Keyword(null,"<copy-asset","<copy-asset",-1388487410),new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),new cljs.core.Keyword(null,"<save-config-file","<save-config-file",1332025175),new cljs.core.Keyword(null,"<read-file","<read-file",-785932647),new cljs.core.Keyword(null,"user-options","user-options",-84696866)],[(function frontend$components$imports$import_file_graph_$_export_file(conn,m,opts){
var tx_reports = logseq.graph_parser.exporter.add_file_to_db_graph(conn,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(m),opts);
var seq__131432 = cljs.core.seq(tx_reports);
var chunk__131433 = null;
var count__131434 = (0);
var i__131435 = (0);
while(true){
if((i__131435 < count__131434)){
var tx_report = chunk__131433.cljs$core$IIndexed$_nth$arity$2(null,i__131435);
frontend.persist_db.browser.transact_BANG_(repo,new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(tx_report));


var G__131641 = seq__131432;
var G__131642 = chunk__131433;
var G__131643 = count__131434;
var G__131644 = (i__131435 + (1));
seq__131432 = G__131641;
chunk__131433 = G__131642;
count__131434 = G__131643;
i__131435 = G__131644;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__131432);
if(temp__5804__auto__){
var seq__131432__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__131432__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131432__$1);
var G__131645 = cljs.core.chunk_rest(seq__131432__$1);
var G__131646 = c__5525__auto__;
var G__131647 = cljs.core.count(c__5525__auto__);
var G__131648 = (0);
seq__131432 = G__131645;
chunk__131433 = G__131646;
count__131434 = G__131647;
i__131435 = G__131648;
continue;
} else {
var tx_report = cljs.core.first(seq__131432__$1);
frontend.persist_db.browser.transact_BANG_(repo,new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(tx_report));


var G__131649 = cljs.core.next(seq__131432__$1);
var G__131650 = null;
var G__131651 = (0);
var G__131652 = (0);
seq__131432 = G__131649;
chunk__131433 = G__131650;
count__131434 = G__131651;
i__131435 = G__131652;
continue;
}
} else {
return null;
}
}
break;
}
}),frontend.config.config_default_content,(function frontend$components$imports$import_file_graph_$_save_logseq_file(___$1,path,content){
return frontend.handler.db_based.editor.save_file_BANG_(path,content);
}),frontend.state.set_state_BANG_,(function (p1__131429_SHARP_){
return frontend.components.imports.copy_asset(repo,frontend.config.get_repo_dir(repo),p1__131429_SHARP_);
}),frontend.components.imports.show_notification,(function frontend$components$imports$import_file_graph_$_save_config_file(___$1,path,content){
return frontend.handler.db_based.editor.save_file_BANG_(path,content);
}),(function frontend$components$imports$import_file_graph_$__LT_read_file(file){
return new cljs.core.Keyword(null,"file-object","file-object",-1396844020).cljs$core$IFn$_invoke$arity$1(file).text();
}),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(user_options,new cljs.core.Keyword(null,"graph-name","graph-name",416773857)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327),(function (){var G__131436 = tag_classes;
var G__131436__$1 = (((G__131436 == null))?null:clojure.string.trim(G__131436));
var G__131436__$2 = (((G__131436__$1 == null))?null:cljs.core.not_empty(G__131436__$1));
var G__131436__$3 = (((G__131436__$2 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__131436__$2,/,\s*/));
if((G__131436__$3 == null)){
return null;
} else {
return cljs.core.set(G__131436__$3);
}
})(),new cljs.core.Keyword(null,"property-classes","property-classes",1129964490),(function (){var G__131437 = property_classes;
var G__131437__$1 = (((G__131437 == null))?null:clojure.string.trim(G__131437));
var G__131437__$2 = (((G__131437__$1 == null))?null:cljs.core.not_empty(G__131437__$1));
var G__131437__$3 = (((G__131437__$2 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__131437__$2,/,\s*/));
if((G__131437__$3 == null)){
return null;
} else {
return cljs.core.set(G__131437__$3);
}
})(),new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305),(function (){var G__131438 = property_parent_classes;
var G__131438__$1 = (((G__131438 == null))?null:clojure.string.trim(G__131438));
var G__131438__$2 = (((G__131438__$1 == null))?null:cljs.core.not_empty(G__131438__$1));
var G__131438__$3 = (((G__131438__$2 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__131438__$2,/,\s*/));
if((G__131438__$3 == null)){
return null;
} else {
return cljs.core.set(G__131438__$3);
}
})()], null)], 0))])),(function (options){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_file_graph(repo,db_conn,config_file,_STAR_files,options)),(function (p__131439){
var map__131440 = p__131439;
var map__131440__$1 = cljs.core.__destructure_map(map__131440);
var files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131440__$1,new cljs.core.Keyword(null,"files","files",-472457450));
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131440__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
return promesa.protocols._mcat(promesa.protocols._promise(lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.imports",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-file-graph","import-file-graph",1885587348),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import finished in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs_time.core.in_millis(cljs_time.core.interval(start_time,cljs_time.core.now())) / (1000)))," seconds"].join('')], null),new cljs.core.Keyword(null,"line","line",212345235),387], null)),null)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),null)),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.imports.validate_imported_data(cljs.core.deref(db_conn),import_state,files)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","ready","graph/ready",1121782733),frontend.state.get_current_repo()], null))),(function (___41611__auto____$4){
return promesa.protocols._promise(frontend.components.imports.finished_cb());
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
/**
 * Import from a graph folder as a DB-based graph
 */
frontend.components.imports.import_file_to_db_handler = (function frontend$components$imports$import_file_to_db_handler(ev,opts){
var file_objs = (cljs.core.truth_(ev)?cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(ev.target.files):[]);
var original_graph_name = (cljs.core.truth_(cljs.core.first(file_objs))?clojure.string.replace(cljs.core.first(file_objs).webkitRelativePath,/\/.*/,""):"");
var import_graph_fn = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"import-graph-fn","import-graph-fn",496143659).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (user_inputs){
var files = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131442_SHARP_){
var and__5000__auto__ = (!(clojure.string.starts_with_QMARK_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131442_SHARP_),"assets/")));
if(and__5000__auto__){
return frontend.util.fs.ignored_path_QMARK_(original_graph_name,new cljs.core.Keyword(null,"file-object","file-object",-1396844020).cljs$core$IFn$_invoke$arity$1(p1__131442_SHARP_).webkitRelativePath);
} else {
return and__5000__auto__;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131441_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"file-object","file-object",-1396844020),new cljs.core.Keyword(null,"path","path",-188191168)],[p1__131441_SHARP_,logseq.common.path.trim_dir_prefix(original_graph_name,p1__131441_SHARP_.webkitRelativePath)]);
}),file_objs));
var temp__5802__auto__ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131443_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131443_SHARP_),"logseq/config.edn");
}),files));
if(cljs.core.truth_(temp__5802__auto__)){
var config_file = temp__5802__auto__;
return frontend.components.imports.import_file_graph(files,user_inputs,config_file);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Import failed as the file 'logseq/config.edn' was not found for a Logseq graph.",new cljs.core.Keyword(null,"error","error",-978969032));
}
});
}
})();
var G__131444 = (function (){
return frontend.components.imports.import_file_graph_dialog(original_graph_name,(function (p__131445){
var map__131446 = p__131445;
var map__131446__$1 = cljs.core.__destructure_map(map__131446);
var user_inputs = map__131446__$1;
var graph_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131446__$1,new cljs.core.Keyword(null,"graph-name","graph-name",416773857));
if(cljs.core.truth_(frontend.components.repo.invalid_graph_name_QMARK_(graph_name))){
return frontend.components.repo.invalid_graph_name_warning();
} else {
if(cljs.core.truth_(frontend.handler.repo.graph_already_exists_QMARK_(graph_name))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Please specify another name as another graph with this name already exists!",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
return (import_graph_fn.cljs$core$IFn$_invoke$arity$1 ? import_graph_fn.cljs$core$IFn$_invoke$arity$1(user_inputs) : import_graph_fn.call(null,user_inputs));

}
}
}));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__131444) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131444));
});
frontend.components.imports.indicator_progress = rum.core.lazy_build(rum.core.build_defc,(function (){
var map__131447 = frontend.state.sub(new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559));
var map__131447__$1 = cljs.core.__destructure_map(map__131447);
var total = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131447__$1,new cljs.core.Keyword(null,"total","total",1916810418));
var current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131447__$1,new cljs.core.Keyword(null,"current-idx","current-idx",1734114444));
var current_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131447__$1,new cljs.core.Keyword(null,"current-page","current-page",-101294180));
var left_label = (cljs.core.truth_((function (){var and__5000__auto__ = current_idx;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = total;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_idx,total);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.font-bold","div.flex.flex-row.font-bold",2116828028),"Loading ..."], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.font-bold","div.flex.flex-row.font-bold",2116828028),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"importing","importing",1809174267)], 0)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.hidden.md:flex.flex-row","div.hidden.md:flex.flex-row",-212067351),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mr-1","span.mr-1",127520086),": "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-ellipsis-wrapper","div.text-ellipsis-wrapper",-595927398),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(300)], null)], null),current_page], null)], null)], null));
var width = Math.round(((current_idx / total).toFixed((2)) * (100)));
var process__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = total;
if(cljs.core.truth_(and__5000__auto__)){
return current_idx;
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_idx),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total)].join(''):null);
return daiquiri.core.create_element("div",{'className':"p-5"},[frontend.ui.progress_bar_with_label(width,left_label,process__$1)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.imports/indicator-progress");
frontend.components.imports.import_indicator = rum.core.lazy_build(rum.core.build_defc,(function (importing_QMARK_){
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = importing_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(logseq.shui.dialog.core.get_modal(new cljs.core.Keyword(null,"import-indicator","import-indicator",-732235210)));
} else {
return and__5000__auto__;
}
})())){
var G__131452 = frontend.components.imports.indicator_progress;
var G__131453 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"import-indicator","import-indicator",-732235210),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),(function (p1__131448_SHARP_){
return p1__131448_SHARP_.preventDefault();
}),new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202),(function (p1__131449_SHARP_){
return p1__131449_SHARP_.preventDefault();
})], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__131452,G__131453) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131452,G__131453));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [importing_QMARK_], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}),null,"frontend.components.imports/import-indicator");
frontend.components.imports.importer = rum.core.lazy_build(rum.core.build_defc,(function (p__131454){
var map__131455 = p__131454;
var map__131455__$1 = cljs.core.__destructure_map(map__131455);
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131455__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
var support_file_based_QMARK_ = frontend.config.local_file_based_graph_QMARK_(frontend.state.get_current_repo());
var importing_QMARK_ = frontend.state.sub(new cljs.core.Keyword("graph","importing","graph/importing",1647644617));
return daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.imports.import_indicator(importing_QMARK_),(cljs.core.truth_(importing_QMARK_)?null:frontend.components.onboarding.setups.setups_container(new cljs.core.Keyword(null,"importer","importer",570599349),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"article.flex.flex-col.items-center.importer.py-16.px-8","article.flex.flex-col.items-center.importer.py-16.px-8",-2146491748),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section.c.text-center","section.c.text-center",-454472767),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1","h1",-1896887462),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-title","on-boarding/importing-title",-1283880808)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-desc","on-boarding/importing-desc",-621015801)], 0))], null)], null),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section.d.md:flex.flex-col","section.d.md:flex.flex-col",1158327659),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"SQLite"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-sqlite-desc","on-boarding/importing-sqlite-desc",1224412712)], 0))], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-sqlite-db",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__131464 = (function (){
return frontend.components.imports.set_graph_name_dialog(e,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sqlite?","sqlite?",1827775537),true], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__131464) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131464));
})], null)], null)], null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.web_platform_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"File to DB graph"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),"Import a file-based Logseq graph folder into a new DB graph"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-file-graph",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"webkitdirectory","webkitdirectory",-656072604),"true",new cljs.core.Keyword(null,"on-change","on-change",-732046149),goog.functions.debounce((function (e){
return frontend.components.imports.import_file_to_db_handler(e,cljs.core.PersistentArrayMap.EMPTY);
}),(1000))], null)], null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.web_platform_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Debug Transit"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),"Import debug transit file into a new DB graph"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-debug-transit",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__131469 = (function (){
return frontend.components.imports.set_graph_name_dialog(e,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug-transit?","debug-transit?",-1402926414),true], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__131469) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131469));
})], null)], null)], null):null),(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.web_platform_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"EDN to DB graph"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),"Import a DB graph's EDN export into a new DB graph"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-db-edn",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__131471 = (function (){
return frontend.components.imports.set_graph_name_dialog(e,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-edn?","db-edn?",-448928080),true], null));
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__131471) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131471));
})], null)], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return support_file_based_QMARK_;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"EDN / JSON to plain text graph"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-lsq-desc","on-boarding/importing-lsq-desc",-138732868)], 0))], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-lsq",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),frontend.components.imports.lsq_import_handler], null)], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return support_file_based_QMARK_;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center","span.as-flex-center",886043029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i","i",-1386841315),frontend.components.svg.roam_research.cljs$core$IFn$_invoke$arity$1((28))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col","div.flex.flex-col",255067761),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"RoamResearch"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-roam-desc","on-boarding/importing-roam-desc",1169369167)], 0))], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-roam",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),frontend.components.imports.roam_import_handler], null)], null)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return support_file_based_QMARK_;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.action-input.flex.items-center.mx-2.my-2","label.action-input.flex.items-center.mx-2.my-2",853398969),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.as-flex-center.ml-1","span.as-flex-center.ml-1",-532492427),frontend.ui.icon("sitemap",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.flex-col","span.flex.flex-col",347826015),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"OPML"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","importing-opml-desc","on-boarding/importing-opml-desc",48865782)], 0))], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.absolute.hidden","input.absolute.hidden",-354085487),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"import-opml",new cljs.core.Keyword(null,"type","type",1174270348),"file",new cljs.core.Keyword(null,"on-change","on-change",-732046149),frontend.components.imports.opml_import_handler], null)], null)], null):null)], null),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("picker",new cljs.core.Keyword(null,"from","from",1815293044).cljs$core$IFn$_invoke$arity$1(query_params)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section.e","section.e",-1594885824),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.button","a.button",275710893),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();
})], null),"Skip"], null)], null):null)], null)))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.imports/importer");

//# sourceMappingURL=frontend.components.imports.js.map
