goog.provide('frontend.extensions.zotero.extractor');
frontend.extensions.zotero.extractor.item_type = (function frontend$extensions$zotero$extractor$item_type(item){
return new cljs.core.Keyword(null,"item-type","item-type",-73995695).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
});
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.zotero !== 'undefined') && (typeof frontend.extensions.zotero.extractor !== 'undefined') && (typeof frontend.extensions.zotero.extractor.extract !== 'undefined')){
} else {
frontend.extensions.zotero.extractor.extract = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__120051 = cljs.core.get_global_hierarchy;
return (fexpr__120051.cljs$core$IFn$_invoke$arity$0 ? fexpr__120051.cljs$core$IFn$_invoke$arity$0() : fexpr__120051.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.extensions.zotero.extractor","extract"),frontend.extensions.zotero.extractor.item_type,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.extensions.zotero.extractor.citation_key = (function frontend$extensions$zotero$extractor$citation_key(item){
var extra = new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
var citation = cljs.core.first(cljs.core.filterv((function (s){
return clojure.string.includes_QMARK_(s,"Citation Key: ");
}),clojure.string.split_lines(extra)));
if(cljs.core.truth_(citation)){
return clojure.string.trim(clojure.string.replace(citation,"Citation Key: ",""));
} else {
return null;
}
});
frontend.extensions.zotero.extractor.__GT_title = (function frontend$extensions$zotero$extractor$__GT_title(item){
return new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
});
frontend.extensions.zotero.extractor.__GT_item_key = (function frontend$extensions$zotero$extractor$__GT_item_key(item){
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item);
});
frontend.extensions.zotero.extractor.__GT_page_name = (function frontend$extensions$zotero$extractor$__GT_page_name(item){
var page_title = (function (){var G__120096 = frontend.extensions.zotero.extractor.item_type(item);
switch (G__120096) {
case "case":
return new cljs.core.Keyword(null,"case-name","case-name",668298969).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));

break;
case "email":
return new cljs.core.Keyword(null,"subject","subject",-1411880451).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));

break;
case "statute":
return new cljs.core.Keyword(null,"name-of-act","name-of-act",1508897193).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));

break;
default:
return frontend.extensions.zotero.extractor.__GT_title(item);

}
})();
var citekey = frontend.extensions.zotero.extractor.citation_key(item);
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291));
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(citekey)));
} else {
return and__5000__auto__;
}
})())){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"page-insert-prefix","page-insert-prefix",1646035089))),citekey].join('');
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"page-insert-prefix","page-insert-prefix",1646035089))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_title)].join('');
}
});
frontend.extensions.zotero.extractor.__GT_authors = (function frontend$extensions$zotero$extractor$__GT_authors(item){
var creators = new cljs.core.Keyword(null,"creators","creators",-1519765535).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
var authors = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (m){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("author",new cljs.core.Keyword(null,"creator-type","creator-type",-817347270).cljs$core$IFn$_invoke$arity$1(m));
})),cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p__120103){
var map__120104 = p__120103;
var map__120104__$1 = cljs.core.__destructure_map(map__120104);
var first_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120104__$1,new cljs.core.Keyword(null,"first-name","first-name",-1559982131));
var last_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120104__$1,new cljs.core.Keyword(null,"last-name","last-name",-1695738974));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120104__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return clojure.string.trim((cljs.core.truth_(name)?name:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_name)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(last_name)].join('')));
}))),creators);
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(authors);
});
frontend.extensions.zotero.extractor.__GT_tags = (function frontend$extensions$zotero$extractor$__GT_tags(item){
var tags = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__120111_SHARP_){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__120111_SHARP_,/,\s?/);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__120115){
var map__120117 = p__120115;
var map__120117__$1 = cljs.core.__destructure_map(map__120117);
var tag = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120117__$1,new cljs.core.Keyword(null,"tag","tag",-1290361223));
return clojure.string.trim(tag);
}),new cljs.core.Keyword(null,"tags","tags",1771418977).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item)))], 0));
var extra_tags = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,clojure.string.split.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"extra-tags","extra-tags",-1152617311)),/,/)));
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tags,extra_tags));
});
frontend.extensions.zotero.extractor.date__GT_journal = (function frontend$extensions$zotero$extractor$date__GT_journal(item){
var temp__5802__auto__ = frontend.date.journal_name_s(new cljs.core.Keyword(null,"parsed-date","parsed-date",-341270717).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(item)));
if(cljs.core.truth_(temp__5802__auto__)){
var date = temp__5802__auto__;
return logseq.common.util.page_ref.__GT_page_ref(date);
} else {
return new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
}
});
frontend.extensions.zotero.extractor.wrap_in_doublequotes = (function frontend$extensions$zotero$extractor$wrap_in_doublequotes(m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__120128){
var vec__120130 = p__120128;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120130,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120130,(1),null);
if(clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),",")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),m));
});
frontend.extensions.zotero.extractor.skip_newline_properties = (function frontend$extensions$zotero$extractor$skip_newline_properties(m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__120139){
var vec__120142 = p__120139;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120142,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120142,(1),null);
return clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),"\n");
}),m));
});
frontend.extensions.zotero.extractor.markdown_link = (function frontend$extensions$zotero$extractor$markdown_link(var_args){
var G__120151 = arguments.length;
switch (G__120151) {
case 2:
return frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2 = (function (label,link){
return frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$3(label,link,false);
}));

(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$3 = (function (label,link,display_QMARK_){
if(cljs.core.truth_(display_QMARK_)){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("![%s](%s)",label,link) : frontend.util.format.call(null,"![%s](%s)",label,link));
} else {
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[%s](%s)",label,link) : frontend.util.format.call(null,"[%s](%s)",label,link));
}
}));

(frontend.extensions.zotero.extractor.markdown_link.cljs$lang$maxFixedArity = 3);

frontend.extensions.zotero.extractor.local_link = (function frontend$extensions$zotero$extractor$local_link(item){
var type = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"library","library",467978288).cljs$core$IFn$_invoke$arity$1(item));
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"library","library",467978288).cljs$core$IFn$_invoke$arity$1(item));
var library = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"user"))?"library":["groups/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''));
var item_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("zotero://select/%s/items/%s",library,item_key) : frontend.util.format.call(null,"zotero://select/%s/items/%s",library,item_key));
});
frontend.extensions.zotero.extractor.web_link = (function frontend$extensions$zotero$extractor$web_link(item){
var type = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"library","library",467978288).cljs$core$IFn$_invoke$arity$1(item));
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"library","library",467978288).cljs$core$IFn$_invoke$arity$1(item));
var library = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"user"))?["users/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''):["groups/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''));
var item_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("https://www.zotero.org/%s/items/%s",library,item_key) : frontend.util.format.call(null,"https://www.zotero.org/%s/items/%s",library,item_key));
});
frontend.extensions.zotero.extractor.zotero_links = (function frontend$extensions$zotero$extractor$zotero_links(item){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2("Local library",frontend.extensions.zotero.extractor.local_link(item))),", ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2("Web library",frontend.extensions.zotero.extractor.web_link(item)))].join('');
});
frontend.extensions.zotero.extractor.__GT_properties = (function frontend$extensions$zotero$extractor$__GT_properties(item){
var type = frontend.extensions.zotero.extractor.item_type(item);
var fields = frontend.extensions.zotero.schema.fields(type);
var authors = frontend.extensions.zotero.extractor.__GT_authors(item);
var tags = frontend.extensions.zotero.extractor.__GT_tags(item);
var links = frontend.extensions.zotero.extractor.zotero_links(item);
var date = frontend.extensions.zotero.extractor.date__GT_journal(item);
var data = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(clojure.set.rename_keys(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(frontend.extensions.zotero.extractor.wrap_in_doublequotes(frontend.extensions.zotero.extractor.skip_newline_properties(cljs.core.select_keys(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item),fields))),new cljs.core.Keyword(null,"links","links",-654507394),links,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"authors","authors",2063018172),authors,new cljs.core.Keyword(null,"tags","tags",1771418977),tags,new cljs.core.Keyword(null,"date","date",-1463434462),date,new cljs.core.Keyword(null,"item-type","item-type",-73995695),logseq.common.util.page_ref.__GT_page_ref(type)], 0)),new cljs.core.Keyword(null,"creators","creators",-1519765535),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968)], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"original-title","original-title",1909208979)], null)),new cljs.core.Keyword(null,"title","title",636505583),frontend.extensions.zotero.extractor.__GT_page_name(item));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2((function (v){
return ((clojure.string.blank_QMARK_(v)) || (cljs.core.empty_QMARK_(v)));
}),cljs.core.second),data));
});
frontend.extensions.zotero.extractor.extract.cljs$core$IMultiFn$_add_method$arity$3(null,"note",(function (item){
var note_html = new cljs.core.Keyword(null,"note","note",1426297904).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
return frontend.extensions.html_parser.convert(new cljs.core.Keyword(null,"markdown","markdown",1227225089),note_html);
}));
frontend.extensions.zotero.extractor.zotero_imported_file_macro = (function frontend$extensions$zotero$extractor$zotero_imported_file_macro(item_key,filename){
var G__120198 = "{{zotero-imported-file %s, %s}}";
var G__120199 = item_key;
var G__120200 = cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([filename], 0));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__120198,G__120199,G__120200) : frontend.util.format.call(null,G__120198,G__120199,G__120200));
});
frontend.extensions.zotero.extractor.zotero_linked_file_macro = (function frontend$extensions$zotero$extractor$zotero_linked_file_macro(path){
var G__120205 = "{{zotero-linked-file %s}}";
var G__120206 = cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.replace_first(path,"attachments:","")], 0));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__120205,G__120206) : frontend.util.format.call(null,G__120205,G__120206));
});
frontend.extensions.zotero.extractor.extract.cljs$core$IMultiFn$_add_method$arity$3(null,"attachment",(function (item){
var map__120217 = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item);
var map__120217__$1 = cljs.core.__destructure_map(map__120217);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120217__$1,new cljs.core.Keyword(null,"title","title",636505583));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120217__$1,new cljs.core.Keyword(null,"url","url",276297046));
var link_mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120217__$1,new cljs.core.Keyword(null,"link-mode","link-mode",-960686913));
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120217__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var filename = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120217__$1,new cljs.core.Keyword(null,"filename","filename",-1428840783));
var G__120220 = link_mode;
switch (G__120220) {
case "imported_file":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2(title,frontend.extensions.zotero.extractor.local_link(item)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.zotero_imported_file_macro(frontend.extensions.zotero.extractor.__GT_item_key(item),filename))].join('');

break;
case "linked_file":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2(title,frontend.extensions.zotero.extractor.local_link(item)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.zotero_linked_file_macro(path))].join('');

break;
case "imported_url":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2(title,url))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.extractor.zotero_imported_file_macro(frontend.extensions.zotero.extractor.__GT_item_key(item),filename))].join('');

break;
case "linked_url":
return frontend.extensions.zotero.extractor.markdown_link.cljs$core$IFn$_invoke$arity$2(title,url);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__120220)].join('')));

}
}));
frontend.extensions.zotero.extractor.extract.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (item){
var page_name = frontend.extensions.zotero.extractor.__GT_page_name(item);
var properties = frontend.extensions.zotero.extractor.__GT_properties(item);
var abstract_note = new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(item));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name,new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968),abstract_note], null);
}));

//# sourceMappingURL=frontend.extensions.zotero.extractor.js.map
