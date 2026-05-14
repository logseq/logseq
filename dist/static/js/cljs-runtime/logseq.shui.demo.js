goog.provide('logseq.shui.demo');
logseq.shui.demo.section_item = rum.core.lazy_build(rum.core.build_defc,(function (title,children){
return daiquiri.core.create_element("section",{'className':"mb-4"},[(function (){var attrs131771 = title;
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs131771))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xl","font-semibold","py-2","italic","opacity-50"], null)], null),attrs131771], 0))):{'className':"text-xl font-semibold py-2 italic opacity-50"}),((cljs.core.map_QMARK_(attrs131771))?null:[daiquiri.interpreter.interpret(attrs131771)]));
})(),(function (){var attrs131772 = children;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131772))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["py-4"], null)], null),attrs131772], 0))):{'className':"py-4"}),((cljs.core.map_QMARK_(attrs131772))?null:[daiquiri.interpreter.interpret(attrs131772)]));
})()]);
}),null,"logseq.shui.demo/section-item");
logseq.shui.demo.sample_dropdown_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (){
var icon = (function (p1__131773_SHARP_){
return logseq.shui.ui.tabler_icon(cljs.core.name(p1__131773_SHARP_),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-90 pr-1 opacity-80"], null));
});
return daiquiri.interpreter.interpret((function (){var G__131831 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-56",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__131842 = e.target;
var G__131842__$1 = (((G__131842 == null))?null:G__131842.innerText);
var G__131842__$2 = (((G__131842__$1 == null))?null:(function (p1__131774_SHARP_){
return cljs.core.identity(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["You select: ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.text-red-700","b.text-red-700",711663976),p1__131774_SHARP_], null)], null));
})(G__131842__$1));
if((G__131842__$2 == null)){
return null;
} else {
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(G__131842__$2,new cljs.core.Keyword(null,"info","info",-317069002)) : logseq.shui.ui.toast_BANG_.call(null,G__131842__$2,new cljs.core.Keyword(null,"info","info",-317069002)));
}
})], null);
var G__131832 = (logseq.shui.ui.dropdown_menu_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_label.cljs$core$IFn$_invoke$arity$1("My Account") : logseq.shui.ui.dropdown_menu_label.call(null,"My Account"));
var G__131833 = (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
var G__131834 = (function (){var G__131843 = (function (){var G__131847 = icon(new cljs.core.Keyword(null,"user","user",1532431356));
var G__131848 = "Profile";
var G__131849 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318P") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u2318P"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131847,G__131848,G__131849) : logseq.shui.ui.dropdown_menu_item.call(null,G__131847,G__131848,G__131849));
})();
var G__131844 = (function (){var G__131850 = icon(new cljs.core.Keyword(null,"brand-mastercard","brand-mastercard",-1200767505));
var G__131851 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Billing"], null);
var G__131852 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318B") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u2318B"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131850,G__131851,G__131852) : logseq.shui.ui.dropdown_menu_item.call(null,G__131850,G__131851,G__131852));
})();
var G__131845 = (function (){var G__131853 = icon(new cljs.core.Keyword(null,"adjustments-alt","adjustments-alt",-549141142));
var G__131854 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Settings"], null);
var G__131855 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318,") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u2318,"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131853,G__131854,G__131855) : logseq.shui.ui.dropdown_menu_item.call(null,G__131853,G__131854,G__131855));
})();
var G__131846 = (function (){var G__131856 = icon(new cljs.core.Keyword(null,"keyboard","keyboard",-617357087));
var G__131857 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Keyboard shortcuts"], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131856,G__131857) : logseq.shui.ui.dropdown_menu_item.call(null,G__131856,G__131857));
})();
return (logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$4(G__131843,G__131844,G__131845,G__131846) : logseq.shui.ui.dropdown_menu_group.call(null,G__131843,G__131844,G__131845,G__131846));
})();
var G__131835 = (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
var G__131836 = (function (){var G__131858 = (function (){var G__131861 = icon(new cljs.core.Keyword(null,"users","users",-713552705));
var G__131862 = "Team";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131861,G__131862) : logseq.shui.ui.dropdown_menu_item.call(null,G__131861,G__131862));
})();
var G__131859 = (function (){var G__131863 = (function (){var G__131865 = icon(new cljs.core.Keyword(null,"user-plus","user-plus",-196932293));
var G__131866 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Invite users"], null);
return (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2(G__131865,G__131866) : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,G__131865,G__131866));
})();
var G__131864 = (function (){var G__131867 = (function (){var G__131870 = icon(new cljs.core.Keyword(null,"mail","mail",795732905));
var G__131871 = "Email";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131870,G__131871) : logseq.shui.ui.dropdown_menu_item.call(null,G__131870,G__131871));
})();
var G__131868 = (function (){var G__131872 = icon(new cljs.core.Keyword(null,"message","message",-406056002));
var G__131873 = "Message";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131872,G__131873) : logseq.shui.ui.dropdown_menu_item.call(null,G__131872,G__131873));
})();
var G__131869 = (function (){var G__131874 = icon(new cljs.core.Keyword(null,"dots-circle-horizontal","dots-circle-horizontal",475474774));
var G__131875 = "More...";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131874,G__131875) : logseq.shui.ui.dropdown_menu_item.call(null,G__131874,G__131875));
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$3(G__131867,G__131868,G__131869) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__131867,G__131868,G__131869));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__131863,G__131864) : logseq.shui.ui.dropdown_menu_sub.call(null,G__131863,G__131864));
})();
var G__131860 = (function (){var G__131876 = icon(new cljs.core.Keyword(null,"plus","plus",211540661));
var G__131877 = "New Team";
var G__131878 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318+T") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u2318+T"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131876,G__131877,G__131878) : logseq.shui.ui.dropdown_menu_item.call(null,G__131876,G__131877,G__131878));
})();
return (logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3(G__131858,G__131859,G__131860) : logseq.shui.ui.dropdown_menu_group.call(null,G__131858,G__131859,G__131860));
})();
var G__131837 = (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
var G__131838 = (function (){var G__131879 = icon(new cljs.core.Keyword(null,"brand-github","brand-github",1626459759));
var G__131880 = "GitHub";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__131879,G__131880) : logseq.shui.ui.dropdown_menu_item.call(null,G__131879,G__131880));
})();
var G__131839 = (function (){var G__131881 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true], null);
var G__131882 = icon(new cljs.core.Keyword(null,"cloud","cloud",-1976521303));
var G__131883 = "Cloud API";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131881,G__131882,G__131883) : logseq.shui.ui.dropdown_menu_item.call(null,G__131881,G__131882,G__131883));
})();
var G__131840 = (logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null));
var G__131841 = (function (){var G__131884 = icon(new cljs.core.Keyword(null,"logout","logout",1418564329));
var G__131885 = "Logout";
var G__131886 = (logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318+Q") : logseq.shui.ui.dropdown_menu_shortcut.call(null,"\u2318+Q"));
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__131884,G__131885,G__131886) : logseq.shui.ui.dropdown_menu_item.call(null,G__131884,G__131885,G__131886));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$11 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$11(G__131831,G__131832,G__131833,G__131834,G__131835,G__131836,G__131837,G__131838,G__131839,G__131840,G__131841) : logseq.shui.ui.dropdown_menu_content.call(null,G__131831,G__131832,G__131833,G__131834,G__131835,G__131836,G__131837,G__131838,G__131839,G__131840,G__131841));
})());
}),null,"logseq.shui.demo/sample-dropdown-menu-content");
logseq.shui.demo.sample_context_menu_content = rum.core.lazy_build(rum.core.build_defc,(function (){
var icon = (function (p1__131887_SHARP_){
return logseq.shui.ui.tabler_icon(cljs.core.name(p1__131887_SHARP_),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-90 pr-1 opacity-80"], null));
});
return daiquiri.interpreter.interpret((function (){var G__131937 = (function (){var G__131939 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border.px-6.py-12.border-dashed.rounded.text-center.select-none","div.border.px-6.py-12.border-dashed.rounded.text-center.select-none",-933078702),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),"ctx-menu-click"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50","span.opacity-50",949060710),"Right click here"], null)], null);
return (logseq.shui.ui.context_menu_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_trigger.cljs$core$IFn$_invoke$arity$1(G__131939) : logseq.shui.ui.context_menu_trigger.call(null,G__131939));
})();
var G__131938 = (function (){var G__131940 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-60 max-h-[80vh] overflow-auto"], null);
var G__131941 = (function (){var G__131950 = icon("arrow-left");
var G__131951 = "Back";
var G__131952 = (logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318[") : logseq.shui.ui.context_menu_shortcut.call(null,"\u2318["));
return (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$3(G__131950,G__131951,G__131952) : logseq.shui.ui.context_menu_item.call(null,G__131950,G__131951,G__131952));
})();
var G__131942 = (function (){var G__131953 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true], null);
var G__131954 = icon("arrow-right");
var G__131955 = "Forward";
var G__131956 = (logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318]") : logseq.shui.ui.context_menu_shortcut.call(null,"\u2318]"));
return (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$4(G__131953,G__131954,G__131955,G__131956) : logseq.shui.ui.context_menu_item.call(null,G__131953,G__131954,G__131955,G__131956));
})();
var G__131943 = (function (){var G__131957 = icon("refresh");
var G__131958 = "Reload";
var G__131959 = (logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318R") : logseq.shui.ui.context_menu_shortcut.call(null,"\u2318R"));
return (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$3(G__131957,G__131958,G__131959) : logseq.shui.ui.context_menu_item.call(null,G__131957,G__131958,G__131959));
})();
var G__131944 = (function (){var G__131960 = (function (){var G__131962 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"inset","inset",-396367740),true], null);
var G__131963 = "More tools";
return (logseq.shui.ui.context_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2(G__131962,G__131963) : logseq.shui.ui.context_menu_sub_trigger.call(null,G__131962,G__131963));
})();
var G__131961 = (function (){var G__131964 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-48"], null);
var G__131965 = (function (){var G__131970 = "Save page As...";
var G__131971 = (logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u21E7\u2318S") : logseq.shui.ui.context_menu_shortcut.call(null,"\u21E7\u2318S"));
return (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$2(G__131970,G__131971) : logseq.shui.ui.context_menu_item.call(null,G__131970,G__131971));
})();
var G__131966 = (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1("Create Shortcut...") : logseq.shui.ui.context_menu_item.call(null,"Create Shortcut..."));
var G__131967 = (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1("Name Window...") : logseq.shui.ui.context_menu_item.call(null,"Name Window..."));
var G__131968 = (logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.context_menu_separator.call(null));
var G__131969 = (logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_item.cljs$core$IFn$_invoke$arity$1("Developer Tools") : logseq.shui.ui.context_menu_item.call(null,"Developer Tools"));
return (logseq.shui.ui.context_menu_sub_content.cljs$core$IFn$_invoke$arity$6 ? logseq.shui.ui.context_menu_sub_content.cljs$core$IFn$_invoke$arity$6(G__131964,G__131965,G__131966,G__131967,G__131968,G__131969) : logseq.shui.ui.context_menu_sub_content.call(null,G__131964,G__131965,G__131966,G__131967,G__131968,G__131969));
})();
return (logseq.shui.ui.context_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_sub.cljs$core$IFn$_invoke$arity$2(G__131960,G__131961) : logseq.shui.ui.context_menu_sub.call(null,G__131960,G__131961));
})();
var G__131945 = (logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.context_menu_separator.call(null));
var G__131946 = (function (){var G__131972 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checked","checked",-50955819),true], null);
var G__131973 = "Show Bookmarks Bar";
var G__131974 = (logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_shortcut.cljs$core$IFn$_invoke$arity$1("\u2318\u21E7B") : logseq.shui.ui.context_menu_shortcut.call(null,"\u2318\u21E7B"));
return (logseq.shui.ui.context_menu_checkbox_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.context_menu_checkbox_item.cljs$core$IFn$_invoke$arity$3(G__131972,G__131973,G__131974) : logseq.shui.ui.context_menu_checkbox_item.call(null,G__131972,G__131973,G__131974));
})();
var G__131947 = (logseq.shui.ui.context_menu_checkbox_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.context_menu_checkbox_item.cljs$core$IFn$_invoke$arity$1("Show Full URLs") : logseq.shui.ui.context_menu_checkbox_item.call(null,"Show Full URLs"));
var G__131948 = (logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.context_menu_separator.call(null));
var G__131949 = (function (){var G__131975 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"pedro"], null);
var G__131976 = (function (){var G__131980 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"inset","inset",-396367740),true], null);
var G__131981 = "People";
return (logseq.shui.ui.context_menu_label.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_label.cljs$core$IFn$_invoke$arity$2(G__131980,G__131981) : logseq.shui.ui.context_menu_label.call(null,G__131980,G__131981));
})();
var G__131977 = (logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.context_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.context_menu_separator.call(null));
var G__131978 = (function (){var G__131982 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"pedro"], null);
var G__131983 = "Pedro Duarte";
return (logseq.shui.ui.context_menu_radio_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_radio_item.cljs$core$IFn$_invoke$arity$2(G__131982,G__131983) : logseq.shui.ui.context_menu_radio_item.call(null,G__131982,G__131983));
})();
var G__131979 = (function (){var G__131984 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"colm"], null);
var G__131985 = "Colm Tuite";
return (logseq.shui.ui.context_menu_radio_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu_radio_item.cljs$core$IFn$_invoke$arity$2(G__131984,G__131985) : logseq.shui.ui.context_menu_radio_item.call(null,G__131984,G__131985));
})();
return (logseq.shui.ui.context_menu_radio_group.cljs$core$IFn$_invoke$arity$5 ? logseq.shui.ui.context_menu_radio_group.cljs$core$IFn$_invoke$arity$5(G__131975,G__131976,G__131977,G__131978,G__131979) : logseq.shui.ui.context_menu_radio_group.call(null,G__131975,G__131976,G__131977,G__131978,G__131979));
})();
return (logseq.shui.ui.context_menu_content.cljs$core$IFn$_invoke$arity$10 ? logseq.shui.ui.context_menu_content.cljs$core$IFn$_invoke$arity$10(G__131940,G__131941,G__131942,G__131943,G__131944,G__131945,G__131946,G__131947,G__131948,G__131949) : logseq.shui.ui.context_menu_content.call(null,G__131940,G__131941,G__131942,G__131943,G__131944,G__131945,G__131946,G__131947,G__131948,G__131949));
})();
return (logseq.shui.ui.context_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.context_menu.cljs$core$IFn$_invoke$arity$2(G__131937,G__131938) : logseq.shui.ui.context_menu.call(null,G__131937,G__131938));
})());
}),null,"logseq.shui.demo/sample-context-menu-content");
logseq.shui.demo.sample_tabs = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret((function (){var G__132000 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"defaultValue","defaultValue",-586131910),"account",new cljs.core.Keyword(null,"className","className",-1983287057),"w-[400px]"], null);
var G__132001 = (function (){var G__132004 = (function (){var G__132006 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"account"], null);
var G__132007 = "Account";
return (logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2(G__132006,G__132007) : logseq.shui.ui.tabs_trigger.call(null,G__132006,G__132007));
})();
var G__132005 = (function (){var G__132008 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"password"], null);
var G__132009 = "Password";
return (logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2(G__132008,G__132009) : logseq.shui.ui.tabs_trigger.call(null,G__132008,G__132009));
})();
return (logseq.shui.ui.tabs_list.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_list.cljs$core$IFn$_invoke$arity$2(G__132004,G__132005) : logseq.shui.ui.tabs_list.call(null,G__132004,G__132005));
})();
var G__132002 = (function (){var G__132010 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"account"], null);
var G__132011 = "Make changes to your account here.";
return (logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2(G__132010,G__132011) : logseq.shui.ui.tabs_content.call(null,G__132010,G__132011));
})();
var G__132003 = (function (){var G__132012 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"password"], null);
var G__132013 = "Change your password here.";
return (logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2(G__132012,G__132013) : logseq.shui.ui.tabs_content.call(null,G__132012,G__132013));
})();
return (logseq.shui.ui.tabs.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.tabs.cljs$core$IFn$_invoke$arity$4(G__132000,G__132001,G__132002,G__132003) : logseq.shui.ui.tabs.call(null,G__132000,G__132001,G__132002,G__132003));
})());
}),null,"logseq.shui.demo/sample-tabs");
logseq.shui.demo.sample_form_basic = rum.core.lazy_build(rum.core.build_defc,(function (){
var attrs132092 = (function (){var form_ctx = logseq.shui.form.core.use_form.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"defaultValues","defaultValues",422888972),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"username","username",1605666410),"",new cljs.core.Keyword(null,"agreement","agreement",-156381462),true,new cljs.core.Keyword(null,"notification","notification",-222338233),"all",new cljs.core.Keyword(null,"bio","bio",-331851886),""], null),new cljs.core.Keyword(null,"yupSchema","yupSchema",-1266946445),logseq.shui.form.core.yup.object().shape(({"username": logseq.shui.form.core.yup.string().required()})).required()], null));
var handle_submit = new cljs.core.Keyword(null,"handleSubmit","handleSubmit",65998088).cljs$core$IFn$_invoke$arity$1(form_ctx);
var on_submit_valid = (function (){var G__132093 = (function (e){
console.log("[form] submit: ",e);

return alert(JSON.stringify(e,null,(2)));
});
return (handle_submit.cljs$core$IFn$_invoke$arity$1 ? handle_submit.cljs$core$IFn$_invoke$arity$1(G__132093) : handle_submit.call(null,G__132093));
})();
var G__132094 = form_ctx;
var G__132095 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-submit","on-submit",1227871159),on_submit_valid], null),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"username"], null),(function (field,error){
var G__132096 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Username") : logseq.shui.ui.form_label.call(null,"Username"));
var G__132097 = (function (){var G__132099 = (function (){var G__132101 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Username"], null),field], 0));
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__132101) : logseq.shui.ui.input.call(null,G__132101));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132099) : logseq.shui.ui.form_control.call(null,G__132099));
})();
var G__132098 = (function (){var G__132102 = (cljs.core.truth_(error)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.text-red-800","b.text-red-800",1802050661),new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(error)], null):"This is your public display name.");
return (logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_description.cljs$core$IFn$_invoke$arity$1(G__132102) : logseq.shui.ui.form_description.call(null,G__132102));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__132096,G__132097,G__132098) : logseq.shui.ui.form_item.call(null,G__132096,G__132097,G__132098));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"bio"], null),(function (field,error){
var G__132109 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pt-4"], null);
var G__132110 = (function (){var G__132111 = (function (){var G__132112 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Bio text..."], null),field], 0));
return (logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1(G__132112) : logseq.shui.ui.textarea.call(null,G__132112));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132111) : logseq.shui.ui.form_control.call(null,G__132111));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$2(G__132109,G__132110) : logseq.shui.ui.form_item.call(null,G__132109,G__132110));
})),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"notification"], null),(function (field){
var G__132114 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"space-y-3 my-4"], null);
var G__132115 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Notify me about...") : logseq.shui.ui.form_label.call(null,"Notify me about..."));
var G__132116 = (function (){var G__132117 = (function (){var G__132118 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(field),new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),new cljs.core.Keyword(null,"onChange","onChange",-312891301).cljs$core$IFn$_invoke$arity$1(field),new cljs.core.Keyword(null,"class","class",-2030961996),"flex flex-col space-y-3"], null);
var G__132119 = (function (){var G__132121 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex flex-row space-x-3 items-center space-y-0"], null);
var G__132122 = (function (){var G__132124 = (function (){var G__132125 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"all"], null);
return (logseq.shui.ui.radio_group_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.radio_group_item.cljs$core$IFn$_invoke$arity$1(G__132125) : logseq.shui.ui.radio_group_item.call(null,G__132125));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132124) : logseq.shui.ui.form_control.call(null,G__132124));
})();
var G__132123 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("All") : logseq.shui.ui.form_label.call(null,"All"));
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__132121,G__132122,G__132123) : logseq.shui.ui.form_item.call(null,G__132121,G__132122,G__132123));
})();
var G__132120 = (function (){var G__132126 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex flex-row space-x-3 items-center space-y-0"], null);
var G__132127 = (function (){var G__132129 = (function (){var G__132130 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"direct"], null);
return (logseq.shui.ui.radio_group_item.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.radio_group_item.cljs$core$IFn$_invoke$arity$1(G__132130) : logseq.shui.ui.radio_group_item.call(null,G__132130));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132129) : logseq.shui.ui.form_control.call(null,G__132129));
})();
var G__132128 = (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$1("Direct messages and mentions") : logseq.shui.ui.form_label.call(null,"Direct messages and mentions"));
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__132126,G__132127,G__132128) : logseq.shui.ui.form_item.call(null,G__132126,G__132127,G__132128));
})();
return (logseq.shui.ui.radio_group.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.radio_group.cljs$core$IFn$_invoke$arity$3(G__132118,G__132119,G__132120) : logseq.shui.ui.radio_group.call(null,G__132118,G__132119,G__132120));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132117) : logseq.shui.ui.form_control.call(null,G__132117));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__132114,G__132115,G__132116) : logseq.shui.ui.form_item.call(null,G__132114,G__132115,G__132116));
})),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null),logseq.shui.ui.form_field(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),"agreement"], null),(function (field){
var G__132132 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"], null);
var G__132133 = (function (){var G__132135 = (function (){var G__132136 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(field),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),new cljs.core.Keyword(null,"onChange","onChange",-312891301).cljs$core$IFn$_invoke$arity$1(field)], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__132136) : logseq.shui.ui.checkbox.call(null,G__132136));
})();
return (logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.form_control.cljs$core$IFn$_invoke$arity$1(G__132135) : logseq.shui.ui.form_control.call(null,G__132135));
})();
var G__132134 = (function (){var G__132139 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"font-normal cursor-pointer"], null);
var G__132140 = "Agreement terms";
return (logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.form_label.cljs$core$IFn$_invoke$arity$2(G__132139,G__132140) : logseq.shui.ui.form_label.call(null,G__132139,G__132140));
})();
return (logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.form_item.cljs$core$IFn$_invoke$arity$3(G__132132,G__132133,G__132134) : logseq.shui.ui.form_item.call(null,G__132132,G__132133,G__132134));
})),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.relative.px-2","div.relative.px-2",-725893854),(function (){var G__132141 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"submit",new cljs.core.Keyword(null,"class","class",-2030961996),"!absolute right-0 top-[-40px]"], null);
var G__132142 = "Submit";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132141,G__132142) : logseq.shui.ui.button.call(null,G__132141,G__132142));
})()], null)], null);
return (logseq.shui.ui.form_provider.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.form_provider.cljs$core$IFn$_invoke$arity$2(G__132094,G__132095) : logseq.shui.ui.form_provider.call(null,G__132094,G__132095));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs132092))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["border","p-6","rounded","bg-gray-01"], null)], null),attrs132092], 0))):{'className':"border p-6 rounded bg-gray-01"}),((cljs.core.map_QMARK_(attrs132092))?null:[daiquiri.interpreter.interpret(attrs132092)]));
}),null,"logseq.shui.demo/sample-form-basic");
logseq.shui.demo.sample_date_picker = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__132146 = rum.core.use_state(false);
var open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132146,(0),null);
var set_open_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132146,(1),null);
var vec__132149 = rum.core.use_state((new Date()));
var date = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132149,(0),null);
var set_date_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132149,(1),null);
return daiquiri.interpreter.interpret((function (){var G__132165 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (o){
return (set_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_open_BANG_.cljs$core$IFn$_invoke$arity$1(o) : set_open_BANG_.call(null,o));
})], null);
var G__132166 = (function (){var G__132168 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true,new cljs.core.Keyword(null,"class","class",-2030961996),"w-2/3"], null);
var G__132169 = (function (){var G__132170 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"pick a date",new cljs.core.Keyword(null,"default-value","default-value",232220170),date.toDateString()], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__132170) : logseq.shui.ui.input.call(null,G__132170));
})();
return (logseq.shui.ui.popover_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.popover_trigger.cljs$core$IFn$_invoke$arity$2(G__132168,G__132169) : logseq.shui.ui.popover_trigger.call(null,G__132168,G__132169));
})();
var G__132167 = (function (){var G__132171 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-open-auto-focus","on-open-auto-focus",391348920),(function (p1__132145_SHARP_){
return p1__132145_SHARP_.preventDefault();
}),new cljs.core.Keyword(null,"side-offset","side-offset",207149931),(8),new cljs.core.Keyword(null,"class","class",-2030961996),"p-0"], null);
var G__132172 = (function (){var G__132173 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"selected","selected",574897764),date,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (d){
(set_date_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_date_BANG_.cljs$core$IFn$_invoke$arity$1(d) : set_date_BANG_.call(null,d));

return (set_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_open_BANG_.call(null,false));
})], null);
return (logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1(G__132173) : logseq.shui.ui.calendar.call(null,G__132173));
})();
return (logseq.shui.ui.popover_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.popover_content.cljs$core$IFn$_invoke$arity$2(G__132171,G__132172) : logseq.shui.ui.popover_content.call(null,G__132171,G__132172));
})();
return (logseq.shui.ui.popover.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popover.cljs$core$IFn$_invoke$arity$3(G__132165,G__132166,G__132167) : logseq.shui.ui.popover.call(null,G__132165,G__132166,G__132167));
})());
}),null,"logseq.shui.demo/sample-date-picker");
logseq.shui.demo.sample_dialog_basic = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__132179 = rum.core.use_state(false);
var open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132179,(0),null);
var set_open_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132179,(1),null);
return daiquiri.interpreter.interpret((function (){var G__132198 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open","open",-1763596448),open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (p1__132178_SHARP_){
return (set_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_open_BANG_.cljs$core$IFn$_invoke$arity$1(p1__132178_SHARP_) : set_open_BANG_.call(null,p1__132178_SHARP_));
})], null);
var G__132199 = (function (){var G__132201 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__132202 = (function (){var G__132203 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__132204 = logseq.shui.ui.tabler_icon("notification");
var G__132205 = "Open as modal locally";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__132203,G__132204,G__132205) : logseq.shui.ui.button.call(null,G__132203,G__132204,G__132205));
})();
return (logseq.shui.ui.dialog_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_trigger.cljs$core$IFn$_invoke$arity$2(G__132201,G__132202) : logseq.shui.ui.dialog_trigger.call(null,G__132201,G__132202));
})();
var G__132200 = (function (){var G__132207 = (function (){var G__132211 = (logseq.shui.ui.dialog_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_title.cljs$core$IFn$_invoke$arity$1("Header") : logseq.shui.ui.dialog_title.call(null,"Header"));
var G__132212 = (logseq.shui.ui.dialog_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_description.cljs$core$IFn$_invoke$arity$1("Description") : logseq.shui.ui.dialog_description.call(null,"Description"));
return (logseq.shui.ui.dialog_header.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_header.cljs$core$IFn$_invoke$arity$2(G__132211,G__132212) : logseq.shui.ui.dialog_header.call(null,G__132211,G__132212));
})();
var G__132208 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-h-96.overflow-y-auto","div.max-h-96.overflow-y-auto",-826451097),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"-mx-6"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section.px-6","section.px-6",-428609558),cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((8),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Your custom content"], null))], null)], null);
var G__132209 = (function (){var G__132213 = (function (){var G__132214 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_open_BANG_.call(null,false));
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655)], null);
var G__132215 = "\uD83C\uDF44 * Footer";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132214,G__132215) : logseq.shui.ui.button.call(null,G__132214,G__132215));
})();
return (logseq.shui.ui.dialog_footer.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_footer.cljs$core$IFn$_invoke$arity$1(G__132213) : logseq.shui.ui.dialog_footer.call(null,G__132213));
})();
return (logseq.shui.ui.dialog_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dialog_content.cljs$core$IFn$_invoke$arity$3(G__132207,G__132208,G__132209) : logseq.shui.ui.dialog_content.call(null,G__132207,G__132208,G__132209));
})();
return (logseq.shui.ui.dialog.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dialog.cljs$core$IFn$_invoke$arity$3(G__132198,G__132199,G__132200) : logseq.shui.ui.dialog.call(null,G__132198,G__132199,G__132200));
})());
}),null,"logseq.shui.demo/sample-dialog-basic");
logseq.shui.demo.page = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret((function (){var G__132361 = new cljs.core.PersistentVector(null, 19, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sm:p-10","div.sm:p-10",-1269750615),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"checkbox",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__132216_SHARP_){
return console.log("===>> onChange:",p1__132216_SHARP_,p1__132216_SHARP_.target.value);
})], null)], null),(function (){var G__132362 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return console.log("==>> click:",(e.target.checked = e.target.dataset.state),e.target.checked);
}),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (p1__132217_SHARP_){
return console.log("==>> on checked change:",p1__132217_SHARP_);
})], null);
var G__132363 = "abc";
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$2(G__132362,G__132363) : logseq.shui.ui.checkbox.call(null,G__132362,G__132363));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.font-bold","h1.text-3xl.font-bold",728823614),"Logseq UI"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null),logseq.shui.demo.section_item("Button",new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.gap-2","div.flex.flex-row.flex-wrap.gap-2",-241247804),(function (){var vec__132364 = rum.core.use_state(false);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132364,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132364,(1),null);
var G__132367 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_BANG_.call(null,true));

return setTimeout((function (){
return (set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false));
}),(5000));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_], null);
var G__132368 = (cljs.core.truth_(loading_QMARK_)?logseq.shui.ui.tabler_icon("loader2",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"animate-spin"], null)):null);
var G__132369 = "Logseq Classic Button";
var G__132370 = logseq.shui.ui.tabler_icon("arrow-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4(G__132367,G__132368,G__132369,G__132370) : logseq.shui.ui.button.call(null,G__132367,G__132368,G__132369,G__132370));
})(),(function (){var G__132371 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132372 = "Outline";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132371,G__132372) : logseq.shui.ui.button.call(null,G__132371,G__132372));
})(),(function (){var G__132373 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132374 = "Secondary";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132373,G__132374) : logseq.shui.ui.button.call(null,G__132373,G__132374));
})(),(function (){var G__132375 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132376 = "Disabled";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132375,G__132376) : logseq.shui.ui.button.call(null,G__132375,G__132376));
})(),(function (){var G__132377 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"destructive","destructive",-1587723243),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132378 = "Destructive";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132377,G__132378) : logseq.shui.ui.button.call(null,G__132377,G__132378));
})(),(function (){var G__132379 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"primary-green",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132380 = "Custom (.primary-green)";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132379,G__132380) : logseq.shui.ui.button.call(null,G__132379,G__132380));
})(),(function (){var G__132381 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132382 = "Ghost";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132381,G__132382) : logseq.shui.ui.button.call(null,G__132381,G__132382));
})(),(function (){var G__132383 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132384 = "Link";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132383,G__132384) : logseq.shui.ui.button.call(null,G__132383,G__132384));
})(),(function (){var G__132385 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132386 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha","a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha",939713394),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://x.com/logseq",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),logseq.shui.ui.tabler_icon("brand-twitter",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132385,G__132386) : logseq.shui.ui.button.call(null,G__132385,G__132386));
})()], null)),logseq.shui.demo.section_item("Toast",new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.gap-2","div.flex.flex-row.flex-wrap.gap-2",-241247804),(function (){var G__132387 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__132390 = "Check for updates ...";
var G__132391 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null),cljs.core.rand_int((3)));
var G__132392 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),((cljs.core.odd_QMARK_(Date.now()))?"History of China":""),new cljs.core.Keyword(null,"duration","duration",1444101068),(3000)], null);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$3(G__132390,G__132391,G__132392) : logseq.shui.ui.toast_BANG_.call(null,G__132390,G__132391,G__132392));
})], null);
var G__132388 = "Open random toast";
var G__132389 = logseq.shui.ui.tabler_icon("arrow-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__132387,G__132388,G__132389) : logseq.shui.ui.button.call(null,G__132387,G__132388,G__132389));
})(),(function (){var G__132393 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__132396 = (function (p__132399){
var map__132400 = p__132399;
var map__132400__$1 = cljs.core.__destructure_map(map__132400);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132400__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var dismiss_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132400__$1,new cljs.core.Keyword(null,"dismiss!","dismiss!",-2130034104));
var update_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132400__$1,new cljs.core.Keyword(null,"update!","update!",-1453508586));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.text-red-700","b.text-red-700",711663976),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),logseq.shui.ui.tabler_icon("info-circle"),["#(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),") "].join(''),(new Date()).toLocaleString()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-2","div.flex.flex-row.gap-2",-1457313917),(function (){var G__132401 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (dismiss_BANG_.cljs$core$IFn$_invoke$arity$1 ? dismiss_BANG_.cljs$core$IFn$_invoke$arity$1(id) : dismiss_BANG_.call(null,id));
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132402 = "x close";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132401,G__132402) : logseq.shui.ui.button.call(null,G__132401,G__132402));
})(),(function (){var G__132403 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__132405 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),Date.now(),new cljs.core.Keyword(null,"action","action",-811238024),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b","b",1482224470),(function (){var G__132406 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.toast_dismiss_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.toast_dismiss_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.toast_dismiss_BANG_.call(null));
})], null);
var G__132407 = "clear all";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132406,G__132407) : logseq.shui.ui.button.call(null,G__132406,G__132407));
})()], null)], null);
return (update_BANG_.cljs$core$IFn$_invoke$arity$1 ? update_BANG_.cljs$core$IFn$_invoke$arity$1(G__132405) : update_BANG_.call(null,G__132405));
}),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__132404 = "x update";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132403,G__132404) : logseq.shui.ui.button.call(null,G__132403,G__132404));
})()], null)], null);
});
var G__132397 = new cljs.core.Keyword(null,"default","default",-1987822328);
var G__132398 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"duration","duration",1444101068),(3000),new cljs.core.Keyword(null,"onDismiss","onDismiss",1209514337),(function (p1__132218_SHARP_){
return console.log("===>> dismiss?:",p1__132218_SHARP_);
})], null);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$3(G__132396,G__132397,G__132398) : logseq.shui.ui.toast_BANG_.call(null,G__132396,G__132397,G__132398));
})], null);
var G__132394 = logseq.shui.ui.tabler_icon("apps");
var G__132395 = "Toast callback handle";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__132393,G__132394,G__132395) : logseq.shui.ui.button.call(null,G__132393,G__132394,G__132395));
})(),(function (){var G__132408 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__132410 = "A message from SoundCloud...";
var G__132411 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-orange-rx-10",new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"b.pl-1","b.pl-1",-1078600787),logseq.shui.ui.tabler_icon("brand-soundcloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null))], null),new cljs.core.Keyword(null,"duration","duration",1444101068),(3000)], null);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(G__132410,G__132411) : logseq.shui.ui.toast_BANG_.call(null,G__132410,G__132411));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"primary-orange",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"md","md",707286655)], null);
var G__132409 = "Custom icon";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132408,G__132409) : logseq.shui.ui.button.call(null,G__132408,G__132409));
})()], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-x-16.items-center","div.flex.flex-row.space-x-16.items-center",-750513714),logseq.shui.demo.section_item("Tips",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.gap-2","div.flex.flex-row.flex-wrap.gap-2",-241247804),(function (){var G__132412 = (function (){var G__132413 = (function (){var G__132415 = (function (){var G__132416 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.shui.dialog.core.open_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-9xl.text-center.scale-110","h1.text-9xl.text-center.scale-110",1363418029),"\uD83C\uDF44"], null));
})], null);
var G__132417 = "Tip for hint?";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132416,G__132417) : logseq.shui.ui.button.call(null,G__132416,G__132417));
})();
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$1(G__132415) : logseq.shui.ui.tooltip_trigger.call(null,G__132415));
})();
var G__132414 = (function (){var G__132418 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-42 px-8 py-4 text-xl border-green-rx-08 bg-green-rx-07-alpha"], null);
var G__132419 = "\uD83C\uDF44";
return (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$2(G__132418,G__132419) : logseq.shui.ui.tooltip_content.call(null,G__132418,G__132419));
})();
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2(G__132413,G__132414) : logseq.shui.ui.tooltip.call(null,G__132413,G__132414));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__132412) : logseq.shui.ui.tooltip_provider.call(null,G__132412));
})()], null)),logseq.shui.demo.section_item("Avatar",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-x-6.items-center","div.flex.flex-row.space-x-6.items-center",86814234),(function (){var G__132420 = (function (){var G__132422 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"src","src",-1651076051),"https://avatars.githubusercontent.com/u/63385289?s=200&v=4"], null);
return (logseq.shui.ui.avatar_image.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.avatar_image.cljs$core$IFn$_invoke$arity$1(G__132422) : logseq.shui.ui.avatar_image.call(null,G__132422));
})();
var G__132421 = (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$1("L") : logseq.shui.ui.avatar_fallback.call(null,"L"));
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$2(G__132420,G__132421) : logseq.shui.ui.avatar.call(null,G__132420,G__132421));
})(),(function (){var G__132423 = (logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.avatar_fallback.cljs$core$IFn$_invoke$arity$1("CH") : logseq.shui.ui.avatar_fallback.call(null,"CH"));
return (logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.avatar.cljs$core$IFn$_invoke$arity$1(G__132423) : logseq.shui.ui.avatar.call(null,G__132423));
})()], null))], null),logseq.shui.demo.section_item("Badge",new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.gap-2","div.flex.flex-row.flex-wrap.gap-2",-241247804),(logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$1("Default") : logseq.shui.ui.badge.call(null,"Default")),(function (){var G__132424 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__132425 = "Outline";
return (logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2(G__132424,G__132425) : logseq.shui.ui.badge.call(null,G__132424,G__132425));
})(),(function (){var G__132426 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460)], null);
var G__132427 = "Secondary";
return (logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2(G__132426,G__132427) : logseq.shui.ui.badge.call(null,G__132426,G__132427));
})(),(function (){var G__132428 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"destructive","destructive",-1587723243)], null);
var G__132429 = "Destructive";
return (logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2(G__132428,G__132429) : logseq.shui.ui.badge.call(null,G__132428,G__132429));
})(),(function (){var G__132430 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"primary-yellow"], null);
var G__132431 = "Custom (.primary-yellow)";
return (logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.badge.cljs$core$IFn$_invoke$arity$2(G__132430,G__132431) : logseq.shui.ui.badge.call(null,G__132430,G__132431));
})()], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.sm:grid-cols-3.sm:gap-8","div.grid.sm:grid-cols-3.sm:gap-8",-1337390849),logseq.shui.demo.section_item("Dropdown",(function (){var G__132432 = (function (){var G__132434 = (function (){var G__132436 = (function (){var G__132437 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__132438 = (function (){var G__132439 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__132440 = logseq.shui.ui.tabler_icon("list");
var G__132441 = "Open dropdown menu";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__132439,G__132440,G__132441) : logseq.shui.ui.button.call(null,G__132439,G__132440,G__132441));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__132437,G__132438) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__132437,G__132438));
})();
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$1(G__132436) : logseq.shui.ui.tooltip_trigger.call(null,G__132436));
})();
var G__132435 = (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1("test hide?") : logseq.shui.ui.tooltip_content.call(null,"test hide?"));
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$2(G__132434,G__132435) : logseq.shui.ui.tooltip.call(null,G__132434,G__132435));
})();
var G__132433 = logseq.shui.demo.sample_dropdown_menu_content();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__132432,G__132433) : logseq.shui.ui.dropdown_menu.call(null,G__132432,G__132433));
})()),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-2","div.col-span-2",-228761363),logseq.shui.demo.section_item("Context Menu",logseq.shui.demo.sample_context_menu_content())], null)], null),logseq.shui.demo.section_item("Tabs",logseq.shui.demo.sample_tabs()),logseq.shui.demo.section_item("Dialog",new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.flex-wrap.gap-2","div.flex.flex-row.flex-wrap.gap-2",-241247804),logseq.shui.demo.sample_dialog_basic(),(function (){var G__132442 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return logseq.shui.dialog.core.open_BANG_.cljs$core$IFn$_invoke$arity$variadic("a modal dialog from `open!`",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Title"], null)], 0));
})], null);
var G__132443 = "Imperative API: open!";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132442,G__132443) : logseq.shui.ui.button.call(null,G__132442,G__132443));
})(),(function (){var G__132444 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"primary-yellow",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(logseq.shui.dialog.core.alert_BANG_.cljs$core$IFn$_invoke$arity$variadic("a alert dialog from `alert!`",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-x-2.items-center","div.flex.flex-row.space-x-2.items-center",-1196930493),logseq.shui.ui.tabler_icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Alert"], null)], null)], null)], 0)),(function (p1__132219_SHARP_){
return console.log("=> alert (promise): ",p1__132219_SHARP_);
}));
})], null);
var G__132445 = "Imperative API: alert!";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132444,G__132445) : logseq.shui.ui.button.call(null,G__132444,G__132445));
})(),(function (){var G__132446 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"primary-green",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(logseq.shui.dialog.core.confirm_BANG_.cljs$core$IFn$_invoke$arity$variadic("a alert dialog from `confirm!`",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-x-2.items-center","div.flex.flex-row.space-x-2.items-center",-1196930493),logseq.shui.ui.tabler_icon("alert-triangle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Confirm"], null)], null)], null)], 0)),(function (p1__132220_SHARP_){
return console.log("=> confirm (promise): ",p1__132220_SHARP_);
})),(function (p1__132221_SHARP_){
return console.log("=> confirm (promise): ",p1__132221_SHARP_);
}));
})], null);
var G__132447 = "Imperative API: confirm!";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__132446,G__132447) : logseq.shui.ui.button.call(null,G__132446,G__132447));
})()], null)),logseq.shui.demo.section_item("Alert",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__132448 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-orange-rx-09 border-orange-rx-07-alpha mb-4"], null);
var G__132449 = logseq.shui.ui.tabler_icon("brand-soundcloud");
var G__132450 = (logseq.shui.ui.alert_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.alert_title.cljs$core$IFn$_invoke$arity$1("Title is SoundCloud") : logseq.shui.ui.alert_title.call(null,"Title is SoundCloud"));
var G__132451 = (logseq.shui.ui.alert_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.alert_description.cljs$core$IFn$_invoke$arity$1("content: radix colors for Logseq") : logseq.shui.ui.alert_description.call(null,"content: radix colors for Logseq"));
return (logseq.shui.ui.alert.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.alert.cljs$core$IFn$_invoke$arity$4(G__132448,G__132449,G__132450,G__132451) : logseq.shui.ui.alert.call(null,G__132448,G__132449,G__132450,G__132451));
})(),(function (){var G__132452 = logseq.shui.ui.tabler_icon("brand-github");
var G__132453 = (logseq.shui.ui.alert_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.alert_title.cljs$core$IFn$_invoke$arity$1("GitHub") : logseq.shui.ui.alert_title.call(null,"GitHub"));
var G__132454 = (logseq.shui.ui.alert_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.alert_description.cljs$core$IFn$_invoke$arity$1("content: radix colors for Logseq") : logseq.shui.ui.alert_description.call(null,"content: radix colors for Logseq"));
return (logseq.shui.ui.alert.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.alert.cljs$core$IFn$_invoke$arity$3(G__132452,G__132453,G__132454) : logseq.shui.ui.alert.call(null,G__132452,G__132453,G__132454));
})()], null)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.sm:grid-cols-8.gap-4","div.grid.sm:grid-cols-8.gap-4",-617331985),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-4.mr-6","div.col-span-4.mr-6",-1406616105),logseq.shui.demo.section_item("Slider",(logseq.shui.ui.slider.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.slider.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.slider.call(null)))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-1","div.col-span-1",1379827151),logseq.shui.demo.section_item("Switch",(function (){var G__132455 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"relative top-[-8px]"], null);
return (logseq.shui.ui.switch$.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.switch$.cljs$core$IFn$_invoke$arity$1(G__132455) : logseq.shui.ui.switch$.call(null,G__132455));
})())], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.col-span-3.pl-4.pr-2","div.col-span-3.pl-4.pr-2",81684556),logseq.shui.demo.section_item("Select",(function (){var G__132456 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(v,new cljs.core.Keyword(null,"info","info",-317069002)) : logseq.shui.ui.toast_BANG_.call(null,v,new cljs.core.Keyword(null,"info","info",-317069002)));
})], null);
var G__132457 = (function (){var G__132459 = (function (){var G__132460 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a fruit"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__132460) : logseq.shui.ui.select_value.call(null,G__132460));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1(G__132459) : logseq.shui.ui.select_trigger.call(null,G__132459));
})();
var G__132458 = (function (){var G__132461 = (function (){var G__132462 = (logseq.shui.ui.select_label.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_label.cljs$core$IFn$_invoke$arity$1("Fruits") : logseq.shui.ui.select_label.call(null,"Fruits"));
var G__132463 = (function (){var G__132466 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"apple"], null);
var G__132467 = "Apple";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__132466,G__132467) : logseq.shui.ui.select_item.call(null,G__132466,G__132467));
})();
var G__132464 = (function (){var G__132468 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"pear"], null);
var G__132469 = "Pear";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__132468,G__132469) : logseq.shui.ui.select_item.call(null,G__132468,G__132469));
})();
var G__132465 = (function (){var G__132470 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"grapes"], null);
var G__132471 = "Grapes";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__132470,G__132471) : logseq.shui.ui.select_item.call(null,G__132470,G__132471));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$4(G__132462,G__132463,G__132464,G__132465) : logseq.shui.ui.select_group.call(null,G__132462,G__132463,G__132464,G__132465));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__132461) : logseq.shui.ui.select_content.call(null,G__132461));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__132456,G__132457,G__132458) : logseq.shui.ui.select.call(null,G__132456,G__132457,G__132458));
})())], null)], null),logseq.shui.demo.section_item("Form",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),logseq.shui.demo.sample_form_basic()], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.sm:grid-cols-2.sm:gap-8","div.grid.sm:grid-cols-2.sm:gap-8",-1152623032),logseq.shui.demo.section_item("Card",(function (){var G__132472 = (function (){var G__132475 = (logseq.shui.ui.card_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_title.cljs$core$IFn$_invoke$arity$1("Title") : logseq.shui.ui.card_title.call(null,"Title"));
var G__132476 = (logseq.shui.ui.card_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_description.cljs$core$IFn$_invoke$arity$1("Description") : logseq.shui.ui.card_description.call(null,"Description"));
return (logseq.shui.ui.card_header.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.card_header.cljs$core$IFn$_invoke$arity$2(G__132475,G__132476) : logseq.shui.ui.card_header.call(null,G__132475,G__132476));
})();
var G__132473 = (logseq.shui.ui.card_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_content.cljs$core$IFn$_invoke$arity$1("This is content") : logseq.shui.ui.card_content.call(null,"This is content"));
var G__132474 = (logseq.shui.ui.card_footer.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_footer.cljs$core$IFn$_invoke$arity$1("Footer") : logseq.shui.ui.card_footer.call(null,"Footer"));
return (logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$3(G__132472,G__132473,G__132474) : logseq.shui.ui.card.call(null,G__132472,G__132473,G__132474));
})()),logseq.shui.demo.section_item("Skeleton",(function (){var G__132477 = (function (){var G__132480 = (function (){var G__132482 = (function (){var G__132483 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-4 w-1/2"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132483) : logseq.shui.ui.skeleton.call(null,G__132483));
})();
return (logseq.shui.ui.card_title.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_title.cljs$core$IFn$_invoke$arity$1(G__132482) : logseq.shui.ui.card_title.call(null,G__132482));
})();
var G__132481 = (function (){var G__132484 = (function (){var G__132485 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-2 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132485) : logseq.shui.ui.skeleton.call(null,G__132485));
})();
return (logseq.shui.ui.card_description.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_description.cljs$core$IFn$_invoke$arity$1(G__132484) : logseq.shui.ui.card_description.call(null,G__132484));
})();
return (logseq.shui.ui.card_header.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.card_header.cljs$core$IFn$_invoke$arity$2(G__132480,G__132481) : logseq.shui.ui.card_header.call(null,G__132480,G__132481));
})();
var G__132478 = (function (){var G__132486 = (function (){var G__132489 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-3 mb-1"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132489) : logseq.shui.ui.skeleton.call(null,G__132489));
})();
var G__132487 = (function (){var G__132490 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-3 mb-1"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132490) : logseq.shui.ui.skeleton.call(null,G__132490));
})();
var G__132488 = (function (){var G__132491 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-3 w-2/3"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132491) : logseq.shui.ui.skeleton.call(null,G__132491));
})();
return (logseq.shui.ui.card_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.card_content.cljs$core$IFn$_invoke$arity$3(G__132486,G__132487,G__132488) : logseq.shui.ui.card_content.call(null,G__132486,G__132487,G__132488));
})();
var G__132479 = (function (){var G__132492 = (function (){var G__132493 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-4 w-full mb-2"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__132493) : logseq.shui.ui.skeleton.call(null,G__132493));
})();
return (logseq.shui.ui.card_footer.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.card_footer.cljs$core$IFn$_invoke$arity$1(G__132492) : logseq.shui.ui.card_footer.call(null,G__132492));
})();
return (logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$3(G__132477,G__132478,G__132479) : logseq.shui.ui.card.call(null,G__132477,G__132478,G__132479));
})())], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.sm:grid-cols-2.sm:gap-8","div.grid.sm:grid-cols-2.sm:gap-8",-1152623032),logseq.shui.demo.section_item("Calendar",(function (){var G__132494 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"inline-flex"], null);
var G__132495 = (function (){var G__132496 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (p1__132222_SHARP_){
var G__132497 = p1__132222_SHARP_.toString();
var G__132498 = new cljs.core.Keyword(null,"success","success",1890645906);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(G__132497,G__132498) : logseq.shui.ui.toast_BANG_.call(null,G__132497,G__132498));
})], null);
return (logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.calendar.cljs$core$IFn$_invoke$arity$1(G__132496) : logseq.shui.ui.calendar.call(null,G__132496));
})();
return (logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.card.cljs$core$IFn$_invoke$arity$2(G__132494,G__132495) : logseq.shui.ui.card.call(null,G__132494,G__132495));
})()),logseq.shui.demo.section_item("Date Picker",logseq.shui.demo.sample_date_picker())], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.mb-80","hr.mb-80",-1941534852)], null)], null);
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__132361) : logseq.shui.ui.tooltip_provider.call(null,G__132361));
})());
}),null,"logseq.shui.demo/page");
logseq.shui.demo.get_head_container = (function logseq$shui$demo$get_head_container(){
return document.getElementById("head");
});
logseq.shui.demo.get_main_scroll_container = (function logseq$shui$demo$get_main_scroll_container(){
return document.getElementById("main-content-container");
});
logseq.shui.demo.sticky_table = rum.core.lazy_build(rum.core.build_defc,(function (){
var el_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var container = logseq.shui.demo.get_main_scroll_container();
var el = rum.core.deref(el_ref);
var cls = el.classList;
var _STAR_ticking_QMARK_ = cljs.core.volatile_BANG_(false);
var el_top = el.getBoundingClientRect().top;
var head_top = parseInt(getComputedStyle(logseq.shui.demo.get_head_container()).height);
var translate = (function (offset){
(el.style.transform = ["translate3d(0, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(offset),"px , 0)"].join(''));

if((offset === (0))){
return cls.remove("translated");
} else {
return cls.add("translated");
}
});
var _STAR_last_offset = cljs.core.volatile_BANG_((0));
var handle = (function (){
var scroll_top = parseInt(container.scrollTop);
var offset = ((((scroll_top + head_top) > el_top))?(((scroll_top - el_top) + head_top) + (1)):(0));
var offset__$1 = parseInt(offset);
var last_offset = cljs.core.deref(_STAR_last_offset);
if((((!((last_offset === (0))))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(offset__$1,last_offset)))){
var dir_132504 = ((((offset__$1 - last_offset) < (0)))?(-1):(1));
var offset_SINGLEQUOTE__132505 = (last_offset + dir_132504);
while(true){
translate(offset_SINGLEQUOTE__132505);

if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(offset__$1,offset_SINGLEQUOTE__132505)) && ((cljs.core.abs((offset__$1 - offset_SINGLEQUOTE__132505)) < (100))))){
var G__132506 = (offset_SINGLEQUOTE__132505 + dir_132504);
offset_SINGLEQUOTE__132505 = G__132506;
continue;
} else {
translate(offset__$1);
}
break;
}
} else {
translate(offset__$1);
}

return cljs.core.vreset_BANG_(_STAR_last_offset,offset__$1);
});
var handler = (function (e){
if(cljs.core.not(cljs.core.deref(_STAR_ticking_QMARK_))){
window.requestAnimationFrame((function (){
handle();

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,false);
}));

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,true);
} else {
return null;
}
});
container.addEventListener("scroll",handler);

return (function (){
return container.removeEventListener("scroll",handler);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"charlie-table"},[daiquiri.core.create_element("div",{'ref':el_ref,'className':"charlie-table-header"},[daiquiri.core.create_element("strong",null,["header"])]),daiquiri.core.create_element("div",{'className':"charlie-table-content"},[daiquiri.core.create_element("strong",null,["content"])])]);
}),null,"logseq.shui.demo/sticky-table");

//# sourceMappingURL=logseq.shui.demo.js.map
