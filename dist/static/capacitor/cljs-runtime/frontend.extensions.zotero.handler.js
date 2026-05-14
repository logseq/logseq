goog.provide('frontend.extensions.zotero.handler');
frontend.extensions.zotero.handler.add = (function frontend$extensions$zotero$handler$add(page_name,type,item){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72822){
var state_val_72823 = (state_72822[(1)]);
if((state_val_72823 === (7))){
var inst_72778 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244));
var state_72822__$1 = state_72822;
var statearr_72824_73289 = state_72822__$1;
(statearr_72824_73289[(2)] = inst_72778);

(statearr_72824_73289[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (20))){
var inst_72817 = (state_72822[(2)]);
var state_72822__$1 = state_72822;
var statearr_72825_73290 = state_72822__$1;
(statearr_72825_73290[(2)] = inst_72817);

(statearr_72825_73290[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (1))){
var inst_72766 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item);
var inst_72767 = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(item);
var inst_72768 = new cljs.core.Keyword(null,"num-children","num-children",-1656107233).cljs$core$IFn$_invoke$arity$1(inst_72767);
var state_72822__$1 = (function (){var statearr_72826 = state_72822;
(statearr_72826[(7)] = inst_72766);

(statearr_72826[(8)] = inst_72768);

return statearr_72826;
})();
var G__72827_73295 = type;
var G__72827_73296__$1 = (((G__72827_73295 instanceof cljs.core.Keyword))?G__72827_73295.fqn:null);
switch (G__72827_73296__$1) {
case "notes":
var statearr_72828_73298 = state_72822__$1;
(statearr_72828_73298[(1)] = (3));


break;
case "attachments":
var statearr_72829_73299 = state_72822__$1;
(statearr_72829_73299[(1)] = (4));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__72827_73296__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (4))){
var state_72822__$1 = state_72822;
var statearr_72830_73300 = state_72822__$1;
(statearr_72830_73300[(2)] = frontend.extensions.zotero.api.attachments);

(statearr_72830_73300[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (15))){
var state_72822__$1 = state_72822;
var statearr_72831_73301 = state_72822__$1;
(statearr_72831_73301[(2)] = null);

(statearr_72831_73301[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (13))){
var inst_72796 = (state_72822[(2)]);
var state_72822__$1 = state_72822;
if(cljs.core.truth_(inst_72796)){
var statearr_72832_73302 = state_72822__$1;
(statearr_72832_73302[(1)] = (14));

} else {
var statearr_72833_73303 = state_72822__$1;
(statearr_72833_73303[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (6))){
var inst_72776 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"notes-block-text","notes-block-text",1546725518));
var state_72822__$1 = state_72822;
var statearr_72834_73304 = state_72822__$1;
(statearr_72834_73304[(2)] = inst_72776);

(statearr_72834_73304[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (17))){
var inst_72806 = (state_72822[(9)]);
var inst_72808 = (state_72822[(10)]);
var inst_72806__$1 = (state_72822[(2)]);
var inst_72807 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.extractor.extract,inst_72806__$1);
var inst_72808__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,inst_72807);
var inst_72809 = cljs.core.not_empty(inst_72808__$1);
var state_72822__$1 = (function (){var statearr_72835 = state_72822;
(statearr_72835[(9)] = inst_72806__$1);

(statearr_72835[(10)] = inst_72808__$1);

return statearr_72835;
})();
if(cljs.core.truth_(inst_72809)){
var statearr_72836_73305 = state_72822__$1;
(statearr_72836_73305[(1)] = (18));

} else {
var statearr_72837_73306 = state_72822__$1;
(statearr_72837_73306[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (3))){
var state_72822__$1 = state_72822;
var statearr_72838_73307 = state_72822__$1;
(statearr_72838_73307[(2)] = frontend.extensions.zotero.api.notes);

(statearr_72838_73307[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (12))){
var inst_72788 = (state_72822[(11)]);
var state_72822__$1 = state_72822;
var statearr_72840_73308 = state_72822__$1;
(statearr_72840_73308[(2)] = inst_72788);

(statearr_72840_73308[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (2))){
var inst_72775 = (state_72822[(2)]);
var state_72822__$1 = (function (){var statearr_72841 = state_72822;
(statearr_72841[(12)] = inst_72775);

return statearr_72841;
})();
var G__72842_73309 = type;
var G__72842_73310__$1 = (((G__72842_73309 instanceof cljs.core.Keyword))?G__72842_73309.fqn:null);
switch (G__72842_73310__$1) {
case "notes":
var statearr_72843_73312 = state_72822__$1;
(statearr_72843_73312[(1)] = (6));


break;
case "attachments":
var statearr_72844_73313 = state_72822__$1;
(statearr_72844_73313[(1)] = (7));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__72842_73310__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (19))){
var state_72822__$1 = state_72822;
var statearr_72845_73314 = state_72822__$1;
(statearr_72845_73314[(2)] = null);

(statearr_72845_73314[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (11))){
var inst_72768 = (state_72822[(8)]);
var inst_72793 = (inst_72768 > (0));
var state_72822__$1 = state_72822;
var statearr_72848_73315 = state_72822__$1;
(statearr_72848_73315[(2)] = inst_72793);

(statearr_72848_73315[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (9))){
var inst_72782 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915));
var state_72822__$1 = state_72822;
var statearr_72849_73316 = state_72822__$1;
(statearr_72849_73316[(2)] = inst_72782);

(statearr_72849_73316[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (5))){
var inst_72781 = (state_72822[(2)]);
var state_72822__$1 = (function (){var statearr_72850 = state_72822;
(statearr_72850[(13)] = inst_72781);

return statearr_72850;
})();
var G__72851_73317 = type;
var G__72851_73318__$1 = (((G__72851_73317 instanceof cljs.core.Keyword))?G__72851_73317.fqn:null);
switch (G__72851_73318__$1) {
case "notes":
var statearr_72852_73320 = state_72822__$1;
(statearr_72852_73320[(1)] = (9));


break;
case "attachments":
var statearr_72853_73321 = state_72822__$1;
(statearr_72853_73321[(1)] = (10));


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__72851_73318__$1)].join('')));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (14))){
var inst_72775 = (state_72822[(12)]);
var inst_72766 = (state_72822[(7)]);
var inst_72804 = (inst_72775.cljs$core$IFn$_invoke$arity$1 ? inst_72775.cljs$core$IFn$_invoke$arity$1(inst_72766) : inst_72775.call(null,inst_72766));
var state_72822__$1 = state_72822;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72822__$1,(17),inst_72804);
} else {
if((state_val_72823 === (16))){
var inst_72820 = (state_72822[(2)]);
var state_72822__$1 = state_72822;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72822__$1,inst_72820);
} else {
if((state_val_72823 === (10))){
var inst_72784 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115));
var state_72822__$1 = state_72822;
var statearr_72854_73322 = state_72822__$1;
(statearr_72854_73322[(2)] = inst_72784);

(statearr_72854_73322[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (18))){
var inst_72766 = (state_72822[(7)]);
var inst_72768 = (state_72822[(8)]);
var inst_72775 = (state_72822[(12)]);
var inst_72781 = (state_72822[(13)]);
var inst_72788 = (state_72822[(11)]);
var inst_72806 = (state_72822[(9)]);
var inst_72808 = (state_72822[(10)]);
var inst_72811 = promesa.protocols._promise(null);
var inst_72812 = (function (){var key = inst_72766;
var num_children = inst_72768;
var api_fn = inst_72775;
var first_block = inst_72781;
var should_add_QMARK_ = inst_72788;
var items = inst_72806;
var md_items = inst_72808;
return (function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(first_block,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page_name], null))),(function (result){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_72859,reject_fn_72858){
var loop_fn_72855 = (function frontend$extensions$zotero$handler$add_$_loop_fn_72855(items__$1){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_72856,err_72857){
if((!((err_72857 == null)))){
return (reject_fn_72858.cljs$core$IFn$_invoke$arity$1 ? reject_fn_72858.cljs$core$IFn$_invoke$arity$1(err_72857) : reject_fn_72858.call(null,err_72857));
} else {
if(promesa.core.recur_QMARK_(res_72856)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$extensions$zotero$handler$add_$_loop_fn_72855,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_72856));
})));

return null;
} else {
return (resolve_fn_72859.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_72859.cljs$core$IFn$_invoke$arity$1(res_72856) : resolve_fn_72859.call(null,res_72856));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(items__$1),(function (items__$2){
return promesa.protocols._promise((function (){var temp__5804__auto____$1 = cljs.core.first(items__$2);
if(cljs.core.truth_(temp__5804__auto____$1)){
var md_item = temp__5804__auto____$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$2){
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
return loop_fn_72855(md_items);
})));
}));
} else {
return null;
}
})());
}));
});
})();
var inst_72813 = promesa.protocols._mcat(inst_72811,inst_72812);
var inst_72814 = cljs.core.async.interop.p__GT_c(inst_72813);
var state_72822__$1 = state_72822;
var statearr_72870_73323 = state_72822__$1;
(statearr_72870_73323[(2)] = inst_72814);

(statearr_72870_73323[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72823 === (8))){
var inst_72788 = (state_72822[(11)]);
var inst_72788__$1 = (state_72822[(2)]);
var state_72822__$1 = (function (){var statearr_72871 = state_72822;
(statearr_72871[(11)] = inst_72788__$1);

return statearr_72871;
})();
if(cljs.core.truth_(inst_72788__$1)){
var statearr_72872_73324 = state_72822__$1;
(statearr_72872_73324[(1)] = (11));

} else {
var statearr_72873_73325 = state_72822__$1;
(statearr_72873_73325[(1)] = (12));

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
var frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____0 = (function (){
var statearr_72874 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_72874[(0)] = frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__);

(statearr_72874[(1)] = (1));

return statearr_72874;
});
var frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____1 = (function (state_72822){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72822);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72875){var ex__32054__auto__ = e72875;
var statearr_72876_73330 = state_72822;
(statearr_72876_73330[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72822[(4)]))){
var statearr_72877_73331 = state_72822;
(statearr_72877_73331[(1)] = cljs.core.first((state_72822[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73332 = state_72822;
state_72822 = G__73332;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__ = function(state_72822){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____1.call(this,state_72822);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____0;
frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$add_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$handler$add_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72878 = f__32125__auto__();
(statearr_72878[(6)] = c__32124__auto__);

return statearr_72878;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.extensions.zotero.handler.handle_command_zotero = (function frontend$extensions$zotero$handler$handle_command_zotero(id,page_name){
frontend.state.clear_editor_action_BANG_();

var G__72879 = id;
var G__72880 = (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.ref.__GT_page_ref.call(null,page_name));
var G__72881 = null;
var G__72882 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__72879,G__72880,G__72881,G__72882) : frontend.handler.editor.insert_command_BANG_.call(null,G__72879,G__72880,G__72881,G__72882));
});
frontend.extensions.zotero.handler.create_abstract_note_BANG_ = (function frontend$extensions$zotero$handler$create_abstract_note_BANG_(page_name,abstract_note){
if(clojure.string.blank_QMARK_(abstract_note)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_("[[Abstract]]",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page_name], null))),(function (block){
return promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(abstract_note,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null)));
}));
}));
}
});
frontend.extensions.zotero.handler.create_page = (function frontend$extensions$zotero$handler$create_page(page_name,properties){
var G__72884 = page_name;
var G__72885 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword(null,"properties","properties",685819552),properties], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__72884,G__72885) : frontend.handler.page._LT_create_BANG_.call(null,G__72884,G__72885));
});
frontend.extensions.zotero.handler.create_zotero_page = (function frontend$extensions$zotero$handler$create_zotero_page(var_args){
var G__72888 = arguments.length;
switch (G__72888) {
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

(frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2 = (function (item,p__72893){
var map__72895 = p__72893;
var map__72895__$1 = cljs.core.__destructure_map(map__72895);
var block_dom_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72895__$1,new cljs.core.Keyword(null,"block-dom-id","block-dom-id",1375977027));
var insert_command_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__72895__$1,new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),true);
var notification_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__72895__$1,new cljs.core.Keyword(null,"notification?","notification?",1061685314),true);
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72909){
var state_val_72910 = (state_72909[(1)]);
if((state_val_72910 === (1))){
var inst_72899 = frontend.extensions.zotero.extractor.extract.cljs$core$IFn$_invoke$arity$1(item);
var inst_72900 = cljs.core.__destructure_map(inst_72899);
var inst_72901 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72900,new cljs.core.Keyword(null,"page-name","page-name",974981762));
var inst_72902 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72900,new cljs.core.Keyword(null,"properties","properties",685819552));
var inst_72903 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72900,new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968));
var inst_72904 = promesa.protocols._promise(null);
var inst_72905 = (function (){var map__72898 = inst_72900;
var page_name = inst_72901;
var properties = inst_72902;
var abstract_note = inst_72903;
return (function (___40957__auto__){
return promesa.protocols._promise(((clojure.string.blank_QMARK_(page_name))?null:(function (){
if(cljs.core.truth_((function (){var G__72911 = clojure.string.lower_case(page_name);
var G__72912 = "page";
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__72911,G__72912) : frontend.db.page_exists_QMARK_.call(null,G__72911,G__72912));
})())){
if(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)))){
var G__72913_73335 = page_name;
var G__72914_73336 = (function (){
return frontend.extensions.zotero.handler.create_page(page_name,properties);
});
(frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2(G__72913_73335,G__72914_73336) : frontend.handler.page._LT_delete_BANG_.call(null,G__72913_73335,G__72914_73336));
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
var inst_72906 = promesa.protocols._mcat(inst_72904,inst_72905);
var inst_72907 = cljs.core.async.interop.p__GT_c(inst_72906);
var state_72909__$1 = state_72909;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72909__$1,inst_72907);
} else {
return null;
}
});
return (function() {
var frontend$extensions$zotero$handler$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$handler$state_machine__32051__auto____0 = (function (){
var statearr_72915 = [null,null,null,null,null,null,null];
(statearr_72915[(0)] = frontend$extensions$zotero$handler$state_machine__32051__auto__);

(statearr_72915[(1)] = (1));

return statearr_72915;
});
var frontend$extensions$zotero$handler$state_machine__32051__auto____1 = (function (state_72909){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72909);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72916){var ex__32054__auto__ = e72916;
var statearr_72917_73339 = state_72909;
(statearr_72917_73339[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72909[(4)]))){
var statearr_72919_73340 = state_72909;
(statearr_72919_73340[(1)] = cljs.core.first((state_72909[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73341 = state_72909;
state_72909 = G__73341;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$state_machine__32051__auto__ = function(state_72909){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$state_machine__32051__auto____1.call(this,state_72909);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$state_machine__32051__auto____0;
frontend$extensions$zotero$handler$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$state_machine__32051__auto____1;
return frontend$extensions$zotero$handler$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72920 = f__32125__auto__();
(statearr_72920[(6)] = c__32124__auto__);

return statearr_72920;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));

(frontend.extensions.zotero.handler.create_zotero_page.cljs$lang$maxFixedArity = 2);

frontend.extensions.zotero.handler.add_all = (function frontend$extensions$zotero$handler$add_all(progress){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73109){
var state_val_73110 = (state_73109[(1)]);
if((state_val_73110 === (7))){
var inst_73105 = (state_73109[(2)]);
var state_73109__$1 = state_73109;
var statearr_73162_73342 = state_73109__$1;
(statearr_73162_73342[(2)] = inst_73105);

(statearr_73162_73342[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (1))){
var inst_72922 = frontend.extensions.zotero.api.all_top_items();
var state_73109__$1 = state_73109;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73109__$1,(2),inst_72922);
} else {
if((state_val_73110 === (4))){
var inst_73107 = (state_73109[(2)]);
var state_73109__$1 = state_73109;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73109__$1,inst_73107);
} else {
if((state_val_73110 === (15))){
var inst_72950 = (state_73109[(7)]);
var inst_72965 = (state_73109[(2)]);
var inst_72966 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.inc);
var inst_72968 = cljs.core.next(inst_72950);
var inst_72931 = inst_72968;
var inst_72932 = null;
var inst_72933 = (0);
var inst_72934 = (0);
var state_73109__$1 = (function (){var statearr_73174 = state_73109;
(statearr_73174[(8)] = inst_72965);

(statearr_73174[(9)] = inst_72966);

(statearr_73174[(10)] = inst_72931);

(statearr_73174[(11)] = inst_72932);

(statearr_73174[(12)] = inst_72933);

(statearr_73174[(13)] = inst_72934);

return statearr_73174;
})();
var statearr_73175_73346 = state_73109__$1;
(statearr_73175_73346[(2)] = null);

(statearr_73175_73346[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (13))){
var inst_72950 = (state_73109[(7)]);
var inst_72959 = cljs.core.first(inst_72950);
var inst_72960 = [new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),new cljs.core.Keyword(null,"notification?","notification?",1061685314)];
var inst_72961 = [false,false];
var inst_72962 = cljs.core.PersistentHashMap.fromArrays(inst_72960,inst_72961);
var inst_72963 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(inst_72959,inst_72962);
var state_73109__$1 = state_73109;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73109__$1,(15),inst_72963);
} else {
if((state_val_73110 === (6))){
var inst_72931 = (state_73109[(10)]);
var inst_72950 = (state_73109[(7)]);
var inst_72950__$1 = cljs.core.seq(inst_72931);
var state_73109__$1 = (function (){var statearr_73176 = state_73109;
(statearr_73176[(7)] = inst_72950__$1);

return statearr_73176;
})();
if(inst_72950__$1){
var statearr_73177_73351 = state_73109__$1;
(statearr_73177_73351[(1)] = (9));

} else {
var statearr_73178_73352 = state_73109__$1;
(statearr_73178_73352[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (3))){
var inst_72934 = (state_73109[(13)]);
var inst_72933 = (state_73109[(12)]);
var inst_72936 = (inst_72934 < inst_72933);
var inst_72937 = inst_72936;
var state_73109__$1 = state_73109;
if(cljs.core.truth_(inst_72937)){
var statearr_73179_73353 = state_73109__$1;
(statearr_73179_73353[(1)] = (5));

} else {
var statearr_73180_73354 = state_73109__$1;
(statearr_73180_73354[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (12))){
var inst_72950 = (state_73109[(7)]);
var inst_72954 = cljs.core.chunk_first(inst_72950);
var inst_72955 = cljs.core.chunk_rest(inst_72950);
var inst_72956 = cljs.core.count(inst_72954);
var inst_72931 = inst_72955;
var inst_72932 = inst_72954;
var inst_72933 = inst_72956;
var inst_72934 = (0);
var state_73109__$1 = (function (){var statearr_73184 = state_73109;
(statearr_73184[(10)] = inst_72931);

(statearr_73184[(11)] = inst_72932);

(statearr_73184[(12)] = inst_72933);

(statearr_73184[(13)] = inst_72934);

return statearr_73184;
})();
var statearr_73185_73355 = state_73109__$1;
(statearr_73185_73355[(2)] = null);

(statearr_73185_73355[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (2))){
var inst_72924 = (state_73109[(2)]);
var inst_72925 = cljs.core.reset_BANG_(progress,(30));
var inst_72930 = cljs.core.seq(inst_72924);
var inst_72931 = inst_72930;
var inst_72932 = null;
var inst_72933 = (0);
var inst_72934 = (0);
var state_73109__$1 = (function (){var statearr_73189 = state_73109;
(statearr_73189[(14)] = inst_72925);

(statearr_73189[(10)] = inst_72931);

(statearr_73189[(11)] = inst_72932);

(statearr_73189[(12)] = inst_72933);

(statearr_73189[(13)] = inst_72934);

return statearr_73189;
})();
var statearr_73190_73356 = state_73109__$1;
(statearr_73190_73356[(2)] = null);

(statearr_73190_73356[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (11))){
var inst_72974 = (state_73109[(2)]);
var state_73109__$1 = state_73109;
var statearr_73219_73357 = state_73109__$1;
(statearr_73219_73357[(2)] = inst_72974);

(statearr_73219_73357[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (9))){
var inst_72950 = (state_73109[(7)]);
var inst_72952 = cljs.core.chunked_seq_QMARK_(inst_72950);
var state_73109__$1 = state_73109;
if(inst_72952){
var statearr_73271_73358 = state_73109__$1;
(statearr_73271_73358[(1)] = (12));

} else {
var statearr_73272_73359 = state_73109__$1;
(statearr_73272_73359[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (5))){
var inst_72932 = (state_73109[(11)]);
var inst_72934 = (state_73109[(13)]);
var inst_72939 = cljs.core._nth(inst_72932,inst_72934);
var inst_72940 = [new cljs.core.Keyword(null,"insert-command?","insert-command?",551536680),new cljs.core.Keyword(null,"notification?","notification?",1061685314)];
var inst_72941 = [false,false];
var inst_72942 = cljs.core.PersistentHashMap.fromArrays(inst_72940,inst_72941);
var inst_72943 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(inst_72939,inst_72942);
var state_73109__$1 = state_73109;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73109__$1,(8),inst_72943);
} else {
if((state_val_73110 === (14))){
var inst_72971 = (state_73109[(2)]);
var state_73109__$1 = state_73109;
var statearr_73277_73364 = state_73109__$1;
(statearr_73277_73364[(2)] = inst_72971);

(statearr_73277_73364[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (10))){
var state_73109__$1 = state_73109;
var statearr_73278_73365 = state_73109__$1;
(statearr_73278_73365[(2)] = null);

(statearr_73278_73365[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73110 === (8))){
var inst_72934 = (state_73109[(13)]);
var inst_72931 = (state_73109[(10)]);
var inst_72932 = (state_73109[(11)]);
var inst_72933 = (state_73109[(12)]);
var inst_72945 = (state_73109[(2)]);
var inst_72946 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.inc);
var inst_72947 = (inst_72934 + (1));
var tmp73274 = inst_72931;
var tmp73275 = inst_72933;
var tmp73276 = inst_72932;
var inst_72931__$1 = tmp73274;
var inst_72932__$1 = tmp73276;
var inst_72933__$1 = tmp73275;
var inst_72934__$1 = inst_72947;
var state_73109__$1 = (function (){var statearr_73279 = state_73109;
(statearr_73279[(15)] = inst_72945);

(statearr_73279[(16)] = inst_72946);

(statearr_73279[(10)] = inst_72931__$1);

(statearr_73279[(11)] = inst_72932__$1);

(statearr_73279[(12)] = inst_72933__$1);

(statearr_73279[(13)] = inst_72934__$1);

return statearr_73279;
})();
var statearr_73280_73366 = state_73109__$1;
(statearr_73280_73366[(2)] = null);

(statearr_73280_73366[(1)] = (3));


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
var frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____0 = (function (){
var statearr_73281 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_73281[(0)] = frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__);

(statearr_73281[(1)] = (1));

return statearr_73281;
});
var frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____1 = (function (state_73109){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73109);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73282){var ex__32054__auto__ = e73282;
var statearr_73283_73367 = state_73109;
(statearr_73283_73367[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73109[(4)]))){
var statearr_73284_73368 = state_73109;
(statearr_73284_73368[(1)] = cljs.core.first((state_73109[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73369 = state_73109;
state_73109 = G__73369;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__ = function(state_73109){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____1.call(this,state_73109);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____0;
frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$handler$add_all_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73285 = f__32125__auto__();
(statearr_73285[(6)] = c__32124__auto__);

return statearr_73285;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});

//# sourceMappingURL=frontend.extensions.zotero.handler.js.map
