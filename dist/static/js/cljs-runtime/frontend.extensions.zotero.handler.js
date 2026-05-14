goog.provide('frontend.extensions.zotero.handler');
frontend.extensions.zotero.handler.add = (function frontend$extensions$zotero$handler$add(page_name,type,item){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120363){
var state_val_120364 = (state_120363[(1)]);
if((state_val_120364 === (7))){
var inst_120320 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244));
var state_120363__$1 = state_120363;
var statearr_120372_120735 = state_120363__$1;
(statearr_120372_120735[(2)] = inst_120320);

(statearr_120372_120735[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (20))){
var inst_120356 = (state_120363[(2)]);
var state_120363__$1 = state_120363;
var statearr_120374_120737 = state_120363__$1;
(statearr_120374_120737[(2)] = inst_120356);

(statearr_120374_120737[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (1))){
var inst_120308 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item);
var inst_120309 = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(item);
var inst_120310 = new cljs.core.Keyword(null,"num-children","num-children",-1656107233).cljs$core$IFn$_invoke$arity$1(inst_120309);
var state_120363__$1 = (function (){var statearr_120376 = state_120363;
(statearr_120376[(7)] = inst_120308);

(statearr_120376[(8)] = inst_120310);

return statearr_120376;
})();
var G__120381_120738 = type;
var G__120381_120739__$1 = (((G__120381_120738 instanceof cljs.core.Keyword))?G__120381_120738.fqn:null);
switch (G__120381_120739__$1) {
case "notes":
var statearr_120383_120743 = state_120363__$1;
(statearr_120383_120743[(1)] = (3));


break;
case "attachments":
var statearr_120384_120744 = state_120363__$1;
(statearr_120384_120744[(1)] = (4));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__120381_120739__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (4))){
var state_120363__$1 = state_120363;
var statearr_120388_120745 = state_120363__$1;
(statearr_120388_120745[(2)] = frontend.extensions.zotero.api.attachments);

(statearr_120388_120745[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (15))){
var state_120363__$1 = state_120363;
var statearr_120392_120746 = state_120363__$1;
(statearr_120392_120746[(2)] = null);

(statearr_120392_120746[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (13))){
var inst_120335 = (state_120363[(2)]);
var state_120363__$1 = state_120363;
if(cljs.core.truth_(inst_120335)){
var statearr_120397_120747 = state_120363__$1;
(statearr_120397_120747[(1)] = (14));

} else {
var statearr_120399_120749 = state_120363__$1;
(statearr_120399_120749[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (6))){
var inst_120318 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"notes-block-text","notes-block-text",1546725518));
var state_120363__$1 = state_120363;
var statearr_120403_120751 = state_120363__$1;
(statearr_120403_120751[(2)] = inst_120318);

(statearr_120403_120751[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (17))){
var inst_120341 = (state_120363[(9)]);
var inst_120344 = (state_120363[(10)]);
var inst_120341__$1 = (state_120363[(2)]);
var inst_120342 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.extractor.extract,inst_120341__$1);
var inst_120344__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,inst_120342);
var inst_120345 = cljs.core.not_empty(inst_120344__$1);
var state_120363__$1 = (function (){var statearr_120411 = state_120363;
(statearr_120411[(9)] = inst_120341__$1);

(statearr_120411[(10)] = inst_120344__$1);

return statearr_120411;
})();
if(cljs.core.truth_(inst_120345)){
var statearr_120415_120754 = state_120363__$1;
(statearr_120415_120754[(1)] = (18));

} else {
var statearr_120417_120755 = state_120363__$1;
(statearr_120417_120755[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (3))){
var state_120363__$1 = state_120363;
var statearr_120421_120756 = state_120363__$1;
(statearr_120421_120756[(2)] = frontend.extensions.zotero.api.notes);

(statearr_120421_120756[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (12))){
var inst_120329 = (state_120363[(11)]);
var state_120363__$1 = state_120363;
var statearr_120424_120759 = state_120363__$1;
(statearr_120424_120759[(2)] = inst_120329);

(statearr_120424_120759[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (2))){
var inst_120316 = (state_120363[(2)]);
var state_120363__$1 = (function (){var statearr_120426 = state_120363;
(statearr_120426[(12)] = inst_120316);

return statearr_120426;
})();
var G__120428_120760 = type;
var G__120428_120761__$1 = (((G__120428_120760 instanceof cljs.core.Keyword))?G__120428_120760.fqn:null);
switch (G__120428_120761__$1) {
case "notes":
var statearr_120430_120764 = state_120363__$1;
(statearr_120430_120764[(1)] = (6));


break;
case "attachments":
var statearr_120432_120768 = state_120363__$1;
(statearr_120432_120768[(1)] = (7));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__120428_120761__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (19))){
var state_120363__$1 = state_120363;
var statearr_120437_120771 = state_120363__$1;
(statearr_120437_120771[(2)] = null);

(statearr_120437_120771[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (11))){
var inst_120310 = (state_120363[(8)]);
var inst_120332 = (inst_120310 > (0));
var state_120363__$1 = state_120363;
var statearr_120439_120772 = state_120363__$1;
(statearr_120439_120772[(2)] = inst_120332);

(statearr_120439_120772[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (9))){
var inst_120324 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915));
var state_120363__$1 = state_120363;
var statearr_120442_120776 = state_120363__$1;
(statearr_120442_120776[(2)] = inst_120324);

(statearr_120442_120776[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (5))){
var inst_120323 = (state_120363[(2)]);
var state_120363__$1 = (function (){var statearr_120443 = state_120363;
(statearr_120443[(13)] = inst_120323);

return statearr_120443;
})();
var G__120445_120778 = type;
var G__120445_120779__$1 = (((G__120445_120778 instanceof cljs.core.Keyword))?G__120445_120778.fqn:null);
switch (G__120445_120779__$1) {
case "notes":
var statearr_120449_120783 = state_120363__$1;
(statearr_120449_120783[(1)] = (9));


break;
case "attachments":
var statearr_120452_120785 = state_120363__$1;
(statearr_120452_120785[(1)] = (10));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__120445_120779__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (14))){
var inst_120316 = (state_120363[(12)]);
var inst_120308 = (state_120363[(7)]);
var inst_120339 = (inst_120316.cljs$core$IFn$_invoke$arity$1 ? inst_120316.cljs$core$IFn$_invoke$arity$1(inst_120308) : inst_120316.call(null,inst_120308));
var state_120363__$1 = state_120363;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120363__$1,(17),inst_120339);
} else {
if((state_val_120364 === (16))){
var inst_120359 = (state_120363[(2)]);
var state_120363__$1 = state_120363;
return cljs.core.async.impl.ioc_helpers.return_chan(state_120363__$1,inst_120359);
} else {
if((state_val_120364 === (10))){
var inst_120326 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115));
var state_120363__$1 = state_120363;
var statearr_120458_120787 = state_120363__$1;
(statearr_120458_120787[(2)] = inst_120326);

(statearr_120458_120787[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (18))){
var inst_120308 = (state_120363[(7)]);
var inst_120310 = (state_120363[(8)]);
var inst_120316 = (state_120363[(12)]);
var inst_120323 = (state_120363[(13)]);
var inst_120329 = (state_120363[(11)]);
var inst_120341 = (state_120363[(9)]);
var inst_120344 = (state_120363[(10)]);
var inst_120347 = promesa.protocols._promise(null);
var inst_120351 = (function (){var key = inst_120308;
var num_children = inst_120310;
var api_fn = inst_120316;
var first_block = inst_120323;
var should_add_QMARK_ = inst_120329;
var items = inst_120341;
var md_items = inst_120344;
return (function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(first_block,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page_name], null))),(function (result){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_120471,reject_fn_120470){
var loop_fn_120467 = (function frontend$extensions$zotero$handler$add_$_loop_fn_120467(items__$1){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_120468,err_120469){
if((!((err_120469 == null)))){
return (reject_fn_120470.cljs$core$IFn$_invoke$arity$1 ? reject_fn_120470.cljs$core$IFn$_invoke$arity$1(err_120469) : reject_fn_120470.call(null,err_120469));
} else {
if(promesa.core.recur_QMARK_(res_120468)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$extensions$zotero$handler$add_$_loop_fn_120467,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_120468));
})));

return null;
} else {
return (resolve_fn_120471.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_120471.cljs$core$IFn$_invoke$arity$1(res_120468) : resolve_fn_120471.call(null,res_120468));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(items__$1),(function (items__$2){
return promesa.protocols._promise((function (){var temp__5804__auto____$1 = cljs.core.first(items__$2);
if(cljs.core.truth_(temp__5804__auto____$1)){
var md_item = temp__5804__auto____$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(md_item,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),id,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"before?","before?",765621039),false], null))),(function (_){
return promesa.protocols._promise(promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.rest(items__$2)], null)));
}));
}));
} else {
return null;
}
})());
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_120467(md_items);
})));
}));
} else {
return null;
}
})());
}));
});
})();
var inst_120352 = promesa.protocols._mcat(inst_120347,inst_120351);
var inst_120353 = cljs.core.async.interop.p__GT_c(inst_120352);
var state_120363__$1 = state_120363;
var statearr_120488_120797 = state_120363__$1;
(statearr_120488_120797[(2)] = inst_120353);

(statearr_120488_120797[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120364 === (8))){
var inst_120329 = (state_120363[(11)]);
var inst_120329__$1 = (state_120363[(2)]);
var state_120363__$1 = (function (){var statearr_120490 = state_120363;
(statearr_120490[(11)] = inst_120329__$1);

return statearr_120490;
})();
if(cljs.core.truth_(inst_120329__$1)){
var statearr_120491_120798 = state_120363__$1;
(statearr_120491_120798[(1)] = (11));

} else {
var statearr_120493_120799 = state_120363__$1;
(statearr_120493_120799[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____0 = (function (){
var statearr_120499 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_120499[(0)] = frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__);

(statearr_120499[(1)] = (1));

return statearr_120499;
});
var frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____1 = (function (state_120363){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120363);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e120501){var ex__32007__auto__ = e120501;
var statearr_120502_120804 = state_120363;
(statearr_120502_120804[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120363[(4)]))){
var statearr_120504_120805 = state_120363;
(statearr_120504_120805[(1)] = cljs.core.first((state_120363[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120807 = state_120363;
state_120363 = G__120807;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__ = function(state_120363){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____1.call(this,state_120363);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____0;
frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$add_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$handler$add_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120507 = f__32196__auto__();
(statearr_120507[(6)] = c__32195__auto__);

return statearr_120507;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.extensions.zotero.handler.handle_command_zotero = (function frontend$extensions$zotero$handler$handle_command_zotero(id,page_name){
frontend.state.clear_editor_action_BANG_();

var G__120511 = id;
var G__120512 = (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.ref.__GT_page_ref.call(null,page_name));
var G__120513 = null;
var G__120514 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__120511,G__120512,G__120513,G__120514) : frontend.handler.editor.insert_command_BANG_.call(null,G__120511,G__120512,G__120513,G__120514));
});
frontend.extensions.zotero.handler.create_abstract_note_BANG_ = (function frontend$extensions$zotero$handler$create_abstract_note_BANG_(page_name,abstract_note){
if(clojure.string.blank_QMARK_(abstract_note)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_("[[Abstract]]",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page_name], null))),(function (block){
return promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(abstract_note,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null)));
}));
}));
}
});
frontend.extensions.zotero.handler.create_page = (function frontend$extensions$zotero$handler$create_page(page_name,properties){
var G__120525 = page_name;
var G__120526 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword(null,"properties","properties",685819552),properties], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__120525,G__120526) : frontend.handler.page._LT_create_BANG_.call(null,G__120525,G__120526));
});
frontend.extensions.zotero.handler.create_zotero_page = (function frontend$extensions$zotero$handler$create_zotero_page(var_args){
var G__120529 = arguments.length;
switch (G__120529) {
case 1:
return frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$1 = (function (item){
return frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(item,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2 = (function (item,p__120534){
var map__120536 = p__120534;
var map__120536__$1 = cljs.core.__destructure_map(map__120536);
var block_dom_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120536__$1,new cljs.core.Keyword(null,"block-dom-id","block-dom-id",1375977027));
var insert_command_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__120536__$1,new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),true);
var notification_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__120536__$1,new cljs.core.Keyword(null,"notification?","notification?",1061685314),true);
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120556){
var state_val_120557 = (state_120556[(1)]);
if((state_val_120557 === (1))){
var inst_120542 = frontend.extensions.zotero.extractor.extract.cljs$core$IFn$_invoke$arity$1(item);
var inst_120544 = cljs.core.__destructure_map(inst_120542);
var inst_120545 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120544,new cljs.core.Keyword(null,"page-name","page-name",974981762));
var inst_120546 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120544,new cljs.core.Keyword(null,"properties","properties",685819552));
var inst_120547 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120544,new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968));
var inst_120549 = promesa.protocols._promise(null);
var inst_120550 = (function (){var map__120541 = inst_120544;
var page_name = inst_120545;
var properties = inst_120546;
var abstract_note = inst_120547;
return (function (___41621__auto__){
return promesa.protocols._promise(((clojure.string.blank_QMARK_(page_name))?null:(function (){
if(cljs.core.truth_((function (){var G__120562 = clojure.string.lower_case(page_name);
var G__120563 = "page";
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__120562,G__120563) : frontend.db.page_exists_QMARK_.call(null,G__120562,G__120563));
})())){
if(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)))){
var G__120566_120840 = page_name;
var G__120567_120841 = (function (){
return frontend.extensions.zotero.handler.create_page(page_name,properties);
});
(frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2(G__120566_120840,G__120567_120841) : frontend.handler.page._LT_delete_BANG_.call(null,G__120566_120840,G__120567_120841));
} else {
frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),page_name,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null));
}
} else {
frontend.extensions.zotero.handler.create_page(page_name,properties);
}

frontend.extensions.zotero.handler.create_abstract_note_BANG_(page_name,abstract_note);

frontend.extensions.zotero.handler.add(page_name,new cljs.core.Keyword(null,"attachments","attachments",-1535547830),item);

frontend.extensions.zotero.handler.add(page_name,new cljs.core.Keyword(null,"notes","notes",-1039600523),item);

if(cljs.core.truth_(insert_command_QMARK_)){
frontend.extensions.zotero.handler.handle_command_zotero(block_dom_id,page_name);

frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
}

if(cljs.core.truth_(notification_QMARK_)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Successfully added zotero item to page ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name)].join(''),new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;
}
})()
));
});
})();
var inst_120551 = promesa.protocols._mcat(inst_120549,inst_120550);
var inst_120552 = cljs.core.async.interop.p__GT_c(inst_120551);
var state_120556__$1 = state_120556;
return cljs.core.async.impl.ioc_helpers.return_chan(state_120556__$1,inst_120552);
} else {
return null;
}
});
return (function() {
var frontend$extensions$zotero$handler$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$handler$state_machine__32004__auto____0 = (function (){
var statearr_120573 = [null,null,null,null,null,null,null];
(statearr_120573[(0)] = frontend$extensions$zotero$handler$state_machine__32004__auto__);

(statearr_120573[(1)] = (1));

return statearr_120573;
});
var frontend$extensions$zotero$handler$state_machine__32004__auto____1 = (function (state_120556){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120556);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e120574){var ex__32007__auto__ = e120574;
var statearr_120575_120848 = state_120556;
(statearr_120575_120848[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120556[(4)]))){
var statearr_120576_120849 = state_120556;
(statearr_120576_120849[(1)] = cljs.core.first((state_120556[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120851 = state_120556;
state_120556 = G__120851;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$state_machine__32004__auto__ = function(state_120556){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$state_machine__32004__auto____1.call(this,state_120556);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$state_machine__32004__auto____0;
frontend$extensions$zotero$handler$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$state_machine__32004__auto____1;
return frontend$extensions$zotero$handler$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120577 = f__32196__auto__();
(statearr_120577[(6)] = c__32195__auto__);

return statearr_120577;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}));

(frontend.extensions.zotero.handler.create_zotero_page.cljs$lang$maxFixedArity = 2);

frontend.extensions.zotero.handler.add_all = (function frontend$extensions$zotero$handler$add_all(progress){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120647){
var state_val_120648 = (state_120647[(1)]);
if((state_val_120648 === (7))){
var inst_120643 = (state_120647[(2)]);
var state_120647__$1 = state_120647;
var statearr_120649_120854 = state_120647__$1;
(statearr_120649_120854[(2)] = inst_120643);

(statearr_120649_120854[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (1))){
var inst_120579 = frontend.extensions.zotero.api.all_top_items();
var state_120647__$1 = state_120647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120647__$1,(2),inst_120579);
} else {
if((state_val_120648 === (4))){
var inst_120645 = (state_120647[(2)]);
var state_120647__$1 = state_120647;
return cljs.core.async.impl.ioc_helpers.return_chan(state_120647__$1,inst_120645);
} else {
if((state_val_120648 === (15))){
var inst_120611 = (state_120647[(7)]);
var inst_120633 = (state_120647[(2)]);
var inst_120634 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.inc);
var inst_120635 = cljs.core.next(inst_120611);
var inst_120589 = inst_120635;
var inst_120590 = null;
var inst_120591 = (0);
var inst_120592 = (0);
var state_120647__$1 = (function (){var statearr_120650 = state_120647;
(statearr_120650[(8)] = inst_120633);

(statearr_120650[(9)] = inst_120634);

(statearr_120650[(10)] = inst_120589);

(statearr_120650[(11)] = inst_120590);

(statearr_120650[(12)] = inst_120591);

(statearr_120650[(13)] = inst_120592);

return statearr_120650;
})();
var statearr_120651_120858 = state_120647__$1;
(statearr_120651_120858[(2)] = null);

(statearr_120651_120858[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (13))){
var inst_120611 = (state_120647[(7)]);
var inst_120622 = cljs.core.first(inst_120611);
var inst_120624 = [new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),new cljs.core.Keyword(null,"notification?","notification?",1061685314)];
var inst_120625 = [false,false];
var inst_120626 = cljs.core.PersistentHashMap.fromArrays(inst_120624,inst_120625);
var inst_120628 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(inst_120622,inst_120626);
var state_120647__$1 = state_120647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120647__$1,(15),inst_120628);
} else {
if((state_val_120648 === (6))){
var inst_120589 = (state_120647[(10)]);
var inst_120611 = (state_120647[(7)]);
var inst_120611__$1 = cljs.core.seq(inst_120589);
var state_120647__$1 = (function (){var statearr_120652 = state_120647;
(statearr_120652[(7)] = inst_120611__$1);

return statearr_120652;
})();
if(inst_120611__$1){
var statearr_120653_120859 = state_120647__$1;
(statearr_120653_120859[(1)] = (9));

} else {
var statearr_120654_120861 = state_120647__$1;
(statearr_120654_120861[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (3))){
var inst_120592 = (state_120647[(13)]);
var inst_120591 = (state_120647[(12)]);
var inst_120595 = (inst_120592 < inst_120591);
var inst_120596 = inst_120595;
var state_120647__$1 = state_120647;
if(cljs.core.truth_(inst_120596)){
var statearr_120656_120863 = state_120647__$1;
(statearr_120656_120863[(1)] = (5));

} else {
var statearr_120657_120864 = state_120647__$1;
(statearr_120657_120864[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (12))){
var inst_120611 = (state_120647[(7)]);
var inst_120616 = cljs.core.chunk_first(inst_120611);
var inst_120617 = cljs.core.chunk_rest(inst_120611);
var inst_120618 = cljs.core.count(inst_120616);
var inst_120589 = inst_120617;
var inst_120590 = inst_120616;
var inst_120591 = inst_120618;
var inst_120592 = (0);
var state_120647__$1 = (function (){var statearr_120660 = state_120647;
(statearr_120660[(10)] = inst_120589);

(statearr_120660[(11)] = inst_120590);

(statearr_120660[(12)] = inst_120591);

(statearr_120660[(13)] = inst_120592);

return statearr_120660;
})();
var statearr_120661_120865 = state_120647__$1;
(statearr_120661_120865[(2)] = null);

(statearr_120661_120865[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (2))){
var inst_120581 = (state_120647[(2)]);
var inst_120583 = cljs.core.reset_BANG_(progress,(30));
var inst_120588 = cljs.core.seq(inst_120581);
var inst_120589 = inst_120588;
var inst_120590 = null;
var inst_120591 = (0);
var inst_120592 = (0);
var state_120647__$1 = (function (){var statearr_120663 = state_120647;
(statearr_120663[(14)] = inst_120583);

(statearr_120663[(10)] = inst_120589);

(statearr_120663[(11)] = inst_120590);

(statearr_120663[(12)] = inst_120591);

(statearr_120663[(13)] = inst_120592);

return statearr_120663;
})();
var statearr_120664_120866 = state_120647__$1;
(statearr_120664_120866[(2)] = null);

(statearr_120664_120866[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (11))){
var inst_120641 = (state_120647[(2)]);
var state_120647__$1 = state_120647;
var statearr_120689_120867 = state_120647__$1;
(statearr_120689_120867[(2)] = inst_120641);

(statearr_120689_120867[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (9))){
var inst_120611 = (state_120647[(7)]);
var inst_120613 = cljs.core.chunked_seq_QMARK_(inst_120611);
var state_120647__$1 = state_120647;
if(inst_120613){
var statearr_120690_120868 = state_120647__$1;
(statearr_120690_120868[(1)] = (12));

} else {
var statearr_120691_120869 = state_120647__$1;
(statearr_120691_120869[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (5))){
var inst_120590 = (state_120647[(11)]);
var inst_120592 = (state_120647[(13)]);
var inst_120599 = cljs.core._nth(inst_120590,inst_120592);
var inst_120600 = [new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),new cljs.core.Keyword(null,"notification?","notification?",1061685314)];
var inst_120601 = [false,false];
var inst_120603 = cljs.core.PersistentHashMap.fromArrays(inst_120600,inst_120601);
var inst_120604 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(inst_120599,inst_120603);
var state_120647__$1 = state_120647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120647__$1,(8),inst_120604);
} else {
if((state_val_120648 === (14))){
var inst_120638 = (state_120647[(2)]);
var state_120647__$1 = state_120647;
var statearr_120699_120870 = state_120647__$1;
(statearr_120699_120870[(2)] = inst_120638);

(statearr_120699_120870[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (10))){
var state_120647__$1 = state_120647;
var statearr_120700_120871 = state_120647__$1;
(statearr_120700_120871[(2)] = null);

(statearr_120700_120871[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120648 === (8))){
var inst_120592 = (state_120647[(13)]);
var inst_120589 = (state_120647[(10)]);
var inst_120590 = (state_120647[(11)]);
var inst_120591 = (state_120647[(12)]);
var inst_120606 = (state_120647[(2)]);
var inst_120607 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.inc);
var inst_120608 = (inst_120592 + (1));
var tmp120694 = inst_120589;
var tmp120695 = inst_120591;
var tmp120696 = inst_120590;
var inst_120589__$1 = tmp120694;
var inst_120590__$1 = tmp120696;
var inst_120591__$1 = tmp120695;
var inst_120592__$1 = inst_120608;
var state_120647__$1 = (function (){var statearr_120705 = state_120647;
(statearr_120705[(15)] = inst_120606);

(statearr_120705[(16)] = inst_120607);

(statearr_120705[(10)] = inst_120589__$1);

(statearr_120705[(11)] = inst_120590__$1);

(statearr_120705[(12)] = inst_120591__$1);

(statearr_120705[(13)] = inst_120592__$1);

return statearr_120705;
})();
var statearr_120707_120877 = state_120647__$1;
(statearr_120707_120877[(2)] = null);

(statearr_120707_120877[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____0 = (function (){
var statearr_120709 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_120709[(0)] = frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__);

(statearr_120709[(1)] = (1));

return statearr_120709;
});
var frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____1 = (function (state_120647){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120647);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e120710){var ex__32007__auto__ = e120710;
var statearr_120711_120882 = state_120647;
(statearr_120711_120882[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120647[(4)]))){
var statearr_120713_120884 = state_120647;
(statearr_120713_120884[(1)] = cljs.core.first((state_120647[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120893 = state_120647;
state_120647 = G__120893;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__ = function(state_120647){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____1.call(this,state_120647);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____0;
frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$handler$add_all_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120717 = f__32196__auto__();
(statearr_120717[(6)] = c__32195__auto__);

return statearr_120717;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});

//# sourceMappingURL=frontend.extensions.zotero.handler.js.map
