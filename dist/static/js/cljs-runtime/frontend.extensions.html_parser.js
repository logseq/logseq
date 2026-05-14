goog.provide('frontend.extensions.html_parser');
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.html_parser !== 'undefined') && (typeof frontend.extensions.html_parser._STAR_inside_pre_QMARK_ !== 'undefined')){
} else {
frontend.extensions.html_parser._STAR_inside_pre_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.extensions.html_parser.hiccup_without_style = (function frontend$extensions$html_parser$hiccup_without_style(hiccup){
return clojure.walk.postwalk((function (f){
if(cljs.core.map_QMARK_(f)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,f,cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (key){
return clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),":data-");
}),cljs.core.keys(f)),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996)], 0)));
} else {
return f;
}
}),hiccup);
});
frontend.extensions.html_parser.export_hiccup = (function frontend$extensions$html_parser$export_hiccup(hiccup){
var G__105612 = "#+BEGIN_EXPORT hiccup\n%s\n#+END_EXPORT";
var G__105613 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.extensions.html_parser.hiccup_without_style(hiccup));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__105612,G__105613) : frontend.util.format.call(null,G__105612,G__105613));
});
frontend.extensions.html_parser.denied_tags = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 16, [new cljs.core.Keyword(null,"applet","applet",434416644),null,new cljs.core.Keyword(null,"meta","meta",1499536964),null,new cljs.core.Keyword(null,"frame","frame",-1711082588),null,new cljs.core.Keyword(null,"script","script",-1304443801),null,new cljs.core.Keyword(null,"frameset","frameset",-708194935),null,new cljs.core.Keyword(null,"canvas","canvas",-1798817489),null,new cljs.core.Keyword(null,"title","title",636505583),null,new cljs.core.Keyword(null,"style","style",-496642736),null,new cljs.core.Keyword(null,"head","head",-771383919),null,new cljs.core.Keyword(null,"link","link",-1769163468),null,new cljs.core.Keyword(null,"comment","comment",532206069),null,new cljs.core.Keyword(null,"svg","svg",856789142),null,new cljs.core.Keyword(null,"base","base",185279322),null,new cljs.core.Keyword(null,"embed","embed",-1354913349),null,new cljs.core.Keyword(null,"xml","xml",-1170142052),null,new cljs.core.Keyword(null,"object","object",1474613949),null], null), null);
frontend.extensions.html_parser.hiccup__GT_doc_inner = (function frontend$extensions$html_parser$hiccup__GT_doc_inner(format,hiccup,opts){
var transform_fn = (function (hiccup__$1,opts__$1){
return (frontend.extensions.html_parser.hiccup__GT_doc_inner.cljs$core$IFn$_invoke$arity$3 ? frontend.extensions.html_parser.hiccup__GT_doc_inner.cljs$core$IFn$_invoke$arity$3(format,hiccup__$1,opts__$1) : frontend.extensions.html_parser.hiccup__GT_doc_inner.call(null,format,hiccup__$1,opts__$1));
});
var block_pattern = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089)))?"#":frontend.config.get_block_pattern(format));
var map_join = (function() { 
var G__105685__delegate = function (children,p__105629){
var map__105630 = p__105629;
var map__105630__$1 = cljs.core.__destructure_map(map__105630);
var list_QMARK__SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105630__$1,new cljs.core.Keyword(null,"list?","list?",-1642026156));
var opts_SINGLEQUOTE_ = (cljs.core.truth_(list_QMARK__SINGLEQUOTE_)?(function (){var level = ((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})() + (1));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"level","level",1290497552),level);
})():opts);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105614_SHARP_){
return transform_fn(p1__105614_SHARP_,opts_SINGLEQUOTE_);
}),children));
};
var G__105685 = function (children,var_args){
var p__105629 = null;
if (arguments.length > 1) {
var G__105686__i = 0, G__105686__a = new Array(arguments.length -  1);
while (G__105686__i < G__105686__a.length) {G__105686__a[G__105686__i] = arguments[G__105686__i + 1]; ++G__105686__i;}
  p__105629 = new cljs.core.IndexedSeq(G__105686__a,0,null);
} 
return G__105685__delegate.call(this,children,p__105629);};
G__105685.cljs$lang$maxFixedArity = 1;
G__105685.cljs$lang$applyTo = (function (arglist__105687){
var children = cljs.core.first(arglist__105687);
var p__105629 = cljs.core.rest(arglist__105687);
return G__105685__delegate(children,p__105629);
});
G__105685.cljs$core$IFn$_invoke$arity$variadic = G__105685__delegate;
return G__105685;
})()
;
var block_transform = (function (level,children){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(level,block_pattern)))," ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105615_SHARP_){
return transform_fn(p1__105615_SHARP_,opts);
}),children)),"\n"].join('');
});
var emphasis_transform = (function (tag,attrs,children){
var style = new cljs.core.Keyword(null,"style","style",-496642736).cljs$core$IFn$_invoke$arity$1(attrs);
var vec__105633 = (cljs.core.truth_(style)?new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.re_find(/font-weight:\s*(([6789]\d\d)|1000|(semi)?bold)\b/,style),cljs.core.re_find(/font-style:\s*italic\b/,style),cljs.core.re_find(/text-decoration(-line)?:\s*underline\b/,style),cljs.core.re_find(/text-decoration:\s*line-through\b/,style),cljs.core.re_find(/background-color:\s*yellow\b/,style)], null):null);
var bold_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105633,(0),null);
var italic_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105633,(1),null);
var underline_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105633,(2),null);
var strike_through_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105633,(3),null);
var mark_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105633,(4),null);
var pattern = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"strong","strong",269529000),null,new cljs.core.Keyword(null,"b","b",1482224470),null], null), null),tag))?(cljs.core.truth_((function (){var and__5000__auto__ = style;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(style,"font-weight: normal");
} else {
return and__5000__auto__;
}
})())?null:frontend.config.get_bold(format)):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"em","em",707813035),null,new cljs.core.Keyword(null,"i","i",-1386841315),null], null), null),tag))?(cljs.core.truth_((function (){var and__5000__auto__ = style;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(style,"font-style: normal");
} else {
return and__5000__auto__;
}
})())?null:(cljs.core.truth_(bold_QMARK_)?frontend.config.get_bold(format):frontend.config.get_italic(format))):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ins","ins",-1021983570),null,new cljs.core.Keyword(null,"u","u",-1156634785),null], null), null),tag))?(cljs.core.truth_((function (){var and__5000__auto__ = style;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(style,"text-decoration: normal");
} else {
return and__5000__auto__;
}
})())?null:frontend.config.get_underline(format)):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"del","del",574975584),null,new cljs.core.Keyword(null,"s","s",1705939918),null,new cljs.core.Keyword(null,"strike","strike",-1173815471),null], null), null),tag))?(cljs.core.truth_((function (){var and__5000__auto__ = style;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(style,"text-decoration: normal");
} else {
return and__5000__auto__;
}
})())?null:frontend.config.get_strike_through(format)):(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mark","mark",-373816345),null], null), null),tag);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return mark_QMARK_;
}
})())?(cljs.core.truth_((function (){var and__5000__auto__ = style;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(style,"background-color: transparent");
} else {
return and__5000__auto__;
}
})())?null:frontend.config.get_highlight(format)):((((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"span","span",1394872991),null], null), null),tag)) && ((!(cljs.core.every_QMARK_(clojure.string.blank_QMARK_,children))))))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(bold_QMARK_)?frontend.config.get_bold(format):null),(cljs.core.truth_(italic_QMARK_)?frontend.config.get_italic(format):null),(cljs.core.truth_(underline_QMARK_)?frontend.config.get_underline(format):null),(cljs.core.truth_(strike_through_QMARK_)?frontend.config.get_strike_through(format):null),(cljs.core.truth_(mark_QMARK_)?frontend.config.get_highlight(format):null)], null)):null
))))));
var pattern__$1 = ((typeof pattern === 'string')?pattern:cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,pattern));
var children_SINGLEQUOTE_ = map_join(children);
if(cljs.core.truth_(cljs.core.not_empty(children_SINGLEQUOTE_))){
if(clojure.string.blank_QMARK_(pattern__$1)){
return children_SINGLEQUOTE_;
} else {
if(clojure.string.starts_with_QMARK_(children_SINGLEQUOTE_,pattern__$1)){
return children_SINGLEQUOTE_;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(children_SINGLEQUOTE_),clojure.string.reverse(pattern__$1)].join('');

}
}
} else {
return null;
}
});
var wrapper = (function (tag,content){
var content__$1 = ((cljs.core.contains_QMARK_(frontend.extensions.html_parser.denied_tags,tag))?null:(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tag,new cljs.core.Keyword(null,"p","p",151049309));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"in-table?","in-table?",-1975579419).cljs$core$IFn$_invoke$arity$1(opts);
} else {
return and__5000__auto__;
}
})())?content:((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 17, [new cljs.core.Keyword(null,"fieldset","fieldset",-1949770816),null,new cljs.core.Keyword(null,"figure","figure",-561394079),null,new cljs.core.Keyword(null,"aside","aside",1414397537),null,new cljs.core.Keyword(null,"figcaption","figcaption",-1790122047),null,new cljs.core.Keyword(null,"hr","hr",1377740067),null,new cljs.core.Keyword(null,"table","table",-564943036),null,new cljs.core.Keyword(null,"ul","ul",-1349521403),null,new cljs.core.Keyword(null,"pre","pre",2118456869),null,new cljs.core.Keyword(null,"footer","footer",1606445390),null,new cljs.core.Keyword(null,"header","header",119441134),null,new cljs.core.Keyword(null,"canvas","canvas",-1798817489),null,new cljs.core.Keyword(null,"center","center",-748944368),null,new cljs.core.Keyword(null,"div","div",1057191632),null,new cljs.core.Keyword(null,"ol","ol",932524051),null,new cljs.core.Keyword(null,"p","p",151049309),null,new cljs.core.Keyword(null,"blockquote","blockquote",372264190),null,new cljs.core.Keyword(null,"dl","dl",-2140151713),null], null), null),tag))?["\n\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),"\n\n"].join(''):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"thead","thead",-291875296),null,new cljs.core.Keyword(null,"li","li",723558921),null,new cljs.core.Keyword(null,"tr","tr",-1424774646),null], null), null),tag))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),"\n"].join(''):content
))));
var G__105636 = content__$1;
var G__105636__$1 = (((G__105636 == null))?null:clojure.string.replace(G__105636,"<!--StartFragment-->",""));
if((G__105636__$1 == null)){
return null;
} else {
return clojure.string.replace(G__105636__$1,"<!--EndFragment-->","");
}
});
var single_hiccup_transform = (function (x){
if(cljs.core.vector_QMARK_(x)){
var vec__105637 = x;
var seq__105638 = cljs.core.seq(vec__105637);
var first__105639 = cljs.core.first(seq__105638);
var seq__105638__$1 = cljs.core.next(seq__105638);
var tag = first__105639;
var first__105639__$1 = cljs.core.first(seq__105638__$1);
var seq__105638__$2 = cljs.core.next(seq__105638__$1);
var attrs = first__105639__$1;
var children = seq__105638__$2;
var result = (function (){try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"head","head",-771383919))){
return null;
} else {
throw cljs.core.match.backtrack;

}
}catch (e105643){if((e105643 instanceof Error)){
var e__53206__auto__ = e105643;
if((e__53206__auto__ === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h1","h1",-1896887462))){
return block_transform((1),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105644){if((e105644 instanceof Error)){
var e__53206__auto____$1 = e105644;
if((e__53206__auto____$1 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h2","h2",-372662728))){
return block_transform((2),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105645){if((e105645 instanceof Error)){
var e__53206__auto____$2 = e105645;
if((e__53206__auto____$2 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h3","h3",2067611163))){
return block_transform((3),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105646){if((e105646 instanceof Error)){
var e__53206__auto____$3 = e105646;
if((e__53206__auto____$3 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h4","h4",2004862993))){
return block_transform((4),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105647){if((e105647 instanceof Error)){
var e__53206__auto____$4 = e105647;
if((e__53206__auto____$4 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h5","h5",-1829156625))){
return block_transform((5),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105648){if((e105648 instanceof Error)){
var e__53206__auto____$5 = e105648;
if((e__53206__auto____$5 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"h6","h6",557293780))){
return block_transform((6),children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105649){if((e105649 instanceof Error)){
var e__53206__auto____$6 = e105649;
if((e__53206__auto____$6 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"a","a",-2123407586))){
var href = new cljs.core.Keyword(null,"href","href",-793805698).cljs$core$IFn$_invoke$arity$1(attrs);
var label = (function (){var or__5002__auto__ = clojure.string.trim(map_join(children));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var has_img_tag_QMARK_ = (function (){var G__105678 = /\[:img/;
var G__105679 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(x);
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__105678,G__105679) : frontend.util.safe_re_find.call(null,G__105678,G__105679));
})();
if(clojure.string.blank_QMARK_(href)){
return null;
} else {
if(cljs.core.truth_(has_img_tag_QMARK_)){
return frontend.extensions.html_parser.export_hiccup(x);
} else {
var G__105680 = format;
var G__105680__$1 = (((G__105680 instanceof cljs.core.Keyword))?G__105680.fqn:null);
switch (G__105680__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[%s](%s)",label,href) : frontend.util.format.call(null,"[%s](%s)",label,href));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[[%s][%s]]",href,label) : frontend.util.format.call(null,"[[%s][%s]]",href,label));

break;
default:
return null;

}
}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105650){if((e105650 instanceof Error)){
var e__53206__auto____$7 = e105650;
if((e__53206__auto____$7 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"img","img",1442687358))){
var src = new cljs.core.Keyword(null,"src","src",-1651076051).cljs$core$IFn$_invoke$arity$1(attrs);
var alt = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"alt","alt",-3214426).cljs$core$IFn$_invoke$arity$1(attrs);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var unsafe_data_url_QMARK_ = ((clojure.string.starts_with_QMARK_(src,"data:")) && (cljs.core.not(cljs.core.re_find(/^data:.*?;base64,/,src))));
if(unsafe_data_url_QMARK_){
return null;
} else {
var G__105677 = format;
var G__105677__$1 = (((G__105677 instanceof cljs.core.Keyword))?G__105677.fqn:null);
switch (G__105677__$1) {
case "markdown":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("![%s](%s)",alt,src) : frontend.util.format.call(null,"![%s](%s)",alt,src));

break;
case "org":
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("[[%s][%s]]",src,alt) : frontend.util.format.call(null,"[[%s][%s]]",src,alt));

break;
default:
return null;

}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105651){if((e105651 instanceof Error)){
var e__53206__auto____$8 = e105651;
if((e__53206__auto____$8 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"p","p",151049309))){
var G__105675 = "%s";
var G__105676 = map_join(children);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__105675,G__105676) : frontend.util.format.call(null,G__105675,G__105676));
} else {
throw cljs.core.match.backtrack;

}
}catch (e105652){if((e105652 instanceof Error)){
var e__53206__auto____$9 = e105652;
if((e__53206__auto____$9 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"hr","hr",1377740067))){
return frontend.config.get_hr(format);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105653){if((e105653 instanceof Error)){
var e__53206__auto____$10 = e105653;
if((e__53206__auto____$10 === cljs.core.match.backtrack)){
try{if((function (p1__105618_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 11, [new cljs.core.Keyword(null,"del","del",574975584),null,new cljs.core.Keyword(null,"mark","mark",-373816345),null,new cljs.core.Keyword(null,"strong","strong",269529000),null,new cljs.core.Keyword(null,"em","em",707813035),null,new cljs.core.Keyword(null,"ins","ins",-1021983570),null,new cljs.core.Keyword(null,"s","s",1705939918),null,new cljs.core.Keyword(null,"strike","strike",-1173815471),null,new cljs.core.Keyword(null,"b","b",1482224470),null,new cljs.core.Keyword(null,"i","i",-1386841315),null,new cljs.core.Keyword(null,"span","span",1394872991),null,new cljs.core.Keyword(null,"u","u",-1156634785),null], null), null),p1__105618_SHARP_);
})(tag)){
return emphasis_transform(tag,attrs,children);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105654){if((e105654 instanceof Error)){
var e__53206__auto____$11 = e105654;
if((e__53206__auto____$11 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"code","code",1586293142))){
if(cljs.core.truth_(cljs.core.deref(frontend.extensions.html_parser._STAR_inside_pre_QMARK_))){
return map_join(children);
} else {
if(typeof cljs.core.first(children) === 'string'){
var pattern = frontend.config.get_code(format);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern),cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(pattern)].join('');
} else {
return map_join(children);

}
}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105655){if((e105655 instanceof Error)){
var e__53206__auto____$12 = e105655;
if((e__53206__auto____$12 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"pre","pre",2118456869))){
cljs.core.reset_BANG_(frontend.extensions.html_parser._STAR_inside_pre_QMARK_,true);

var content = clojure.string.trim(cljs.core.doall.cljs$core$IFn$_invoke$arity$1(map_join(children)));
cljs.core.reset_BANG_(frontend.extensions.html_parser._STAR_inside_pre_QMARK_,false);

var G__105674 = format;
var G__105674__$1 = (((G__105674 instanceof cljs.core.Keyword))?G__105674.fqn:null);
switch (G__105674__$1) {
case "markdown":
if(frontend.util.starts_with_QMARK_(content,"```")){
return content;
} else {
return ["```\n",content,"\n```"].join('');
}

break;
case "org":
if(frontend.util.starts_with_QMARK_(content,"#+BEGIN_SRC")){
return content;
} else {
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("#+BEGIN_SRC\n%s\n#+END_SRC",content) : frontend.util.format.call(null,"#+BEGIN_SRC\n%s\n#+END_SRC",content));
}

break;
default:
return null;

}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105656){if((e105656 instanceof Error)){
var e__53206__auto____$13 = e105656;
if((e__53206__auto____$13 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"blockquote","blockquote",372264190))){
var G__105671 = format;
var G__105671__$1 = (((G__105671 instanceof cljs.core.Keyword))?G__105671.fqn:null);
switch (G__105671__$1) {
case "markdown":
return ["> ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children))].join('');

break;
case "org":
var G__105672 = "#+BEGIN_QUOTE\n%s\n#+END_QUOTE";
var G__105673 = map_join(children);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__105672,G__105673) : frontend.util.format.call(null,G__105672,G__105673));

break;
default:
return null;

}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105657){if((e105657 instanceof Error)){
var e__53206__auto____$14 = e105657;
if((e__53206__auto____$14 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"li","li",723558921))){
var tabs = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})() - (1)),"\t"));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(tabs),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089)))?"-":"*")," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children))].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e105658){if((e105658 instanceof Error)){
var e__53206__auto____$15 = e105658;
if((e__53206__auto____$15 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"br","br",934104792))){
return "\n";
} else {
throw cljs.core.match.backtrack;

}
}catch (e105659){if((e105659 instanceof Error)){
var e__53206__auto____$16 = e105659;
if((e__53206__auto____$16 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"dt","dt",-368444759))){
var G__105670 = format;
var G__105670__$1 = (((G__105670 instanceof cljs.core.Keyword))?G__105670.fqn:null);
switch (G__105670__$1) {
case "org":
return ["- ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children))," "].join('');

break;
case "markdown":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),"\n"].join('');

break;
default:
return null;

}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105660){if((e105660 instanceof Error)){
var e__53206__auto____$17 = e105660;
if((e__53206__auto____$17 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"dd","dd",-1340437629))){
var G__105669 = format;
var G__105669__$1 = (((G__105669 instanceof cljs.core.Keyword))?G__105669.fqn:null);
switch (G__105669__$1) {
case "markdown":
return [": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),"\n"].join('');

break;
case "org":
return [":: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),"\n"].join('');

break;
default:
return null;

}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105661){if((e105661 instanceof Error)){
var e__53206__auto____$18 = e105661;
if((e__53206__auto____$18 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"thead","thead",-291875296))){
var G__105668 = format;
var G__105668__$1 = (((G__105668 instanceof cljs.core.Keyword))?G__105668.fqn:null);
switch (G__105668__$1) {
case "markdown":
var columns = cljs.core.count(cljs.core.last(cljs.core.first(children)));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),["| ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(columns,"----"))," |"].join('')].join('');

break;
case "org":
var columns = cljs.core.count(cljs.core.last(cljs.core.first(children)));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(map_join(children)),["|",clojure.string.join.cljs$core$IFn$_invoke$arity$2("+",cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(columns,"----")),"|"].join('')].join('');

break;
default:
return null;

}
} else {
throw cljs.core.match.backtrack;

}
}catch (e105662){if((e105662 instanceof Error)){
var e__53206__auto____$19 = e105662;
if((e__53206__auto____$19 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"tr","tr",-1424774646))){
return ["| ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105624_SHARP_){
return transform_fn(p1__105624_SHARP_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"in-table?","in-table?",-1975579419),true));
}),children))," |"].join('');
} else {
throw cljs.core.match.backtrack;

}
}catch (e105663){if((e105663 instanceof Error)){
var e__53206__auto____$20 = e105663;
if((e__53206__auto____$20 === cljs.core.match.backtrack)){
try{if((function (p1__105625_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"fieldset","fieldset",-1949770816),null,new cljs.core.Keyword(null,"figure","figure",-561394079),null,new cljs.core.Keyword(null,"aside","aside",1414397537),null,new cljs.core.Keyword(null,"figcaption","figcaption",-1790122047),null,new cljs.core.Keyword(null,"footer","footer",1606445390),null,new cljs.core.Keyword(null,"header","header",119441134),null,new cljs.core.Keyword(null,"center","center",-748944368),null], null), null),p1__105625_SHARP_);
})(tag)){
throw (new Error(["HTML->Hiccup: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag)," not supported yet"].join('')));
} else {
throw cljs.core.match.backtrack;

}
}catch (e105664){if((e105664 instanceof Error)){
var e__53206__auto____$21 = e105664;
if((e__53206__auto____$21 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"ul","ul",-1349521403))){
return map_join(children,new cljs.core.Keyword(null,"list?","list?",-1642026156),true);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105665){if((e105665 instanceof Error)){
var e__53206__auto____$22 = e105665;
if((e__53206__auto____$22 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"ol","ol",932524051))){
return map_join(children,new cljs.core.Keyword(null,"list?","list?",-1642026156),true);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105666){if((e105666 instanceof Error)){
var e__53206__auto____$23 = e105666;
if((e__53206__auto____$23 === cljs.core.match.backtrack)){
try{if(cljs.core.keyword_identical_QMARK_(tag,new cljs.core.Keyword(null,"dl","dl",-2140151713))){
return map_join(children,new cljs.core.Keyword(null,"list?","list?",-1642026156),true);
} else {
throw cljs.core.match.backtrack;

}
}catch (e105667){if((e105667 instanceof Error)){
var e__53206__auto____$24 = e105667;
if((e__53206__auto____$24 === cljs.core.match.backtrack)){
return map_join(children);
} else {
throw e__53206__auto____$24;
}
} else {
throw e105667;

}
}} else {
throw e__53206__auto____$23;
}
} else {
throw e105666;

}
}} else {
throw e__53206__auto____$22;
}
} else {
throw e105665;

}
}} else {
throw e__53206__auto____$21;
}
} else {
throw e105664;

}
}} else {
throw e__53206__auto____$20;
}
} else {
throw e105663;

}
}} else {
throw e__53206__auto____$19;
}
} else {
throw e105662;

}
}} else {
throw e__53206__auto____$18;
}
} else {
throw e105661;

}
}} else {
throw e__53206__auto____$17;
}
} else {
throw e105660;

}
}} else {
throw e__53206__auto____$16;
}
} else {
throw e105659;

}
}} else {
throw e__53206__auto____$15;
}
} else {
throw e105658;

}
}} else {
throw e__53206__auto____$14;
}
} else {
throw e105657;

}
}} else {
throw e__53206__auto____$13;
}
} else {
throw e105656;

}
}} else {
throw e__53206__auto____$12;
}
} else {
throw e105655;

}
}} else {
throw e__53206__auto____$11;
}
} else {
throw e105654;

}
}} else {
throw e__53206__auto____$10;
}
} else {
throw e105653;

}
}} else {
throw e__53206__auto____$9;
}
} else {
throw e105652;

}
}} else {
throw e__53206__auto____$8;
}
} else {
throw e105651;

}
}} else {
throw e__53206__auto____$7;
}
} else {
throw e105650;

}
}} else {
throw e__53206__auto____$6;
}
} else {
throw e105649;

}
}} else {
throw e__53206__auto____$5;
}
} else {
throw e105648;

}
}} else {
throw e__53206__auto____$4;
}
} else {
throw e105647;

}
}} else {
throw e__53206__auto____$3;
}
} else {
throw e105646;

}
}} else {
throw e__53206__auto____$2;
}
} else {
throw e105645;

}
}} else {
throw e__53206__auto____$1;
}
} else {
throw e105644;

}
}} else {
throw e__53206__auto__;
}
} else {
throw e105643;

}
}})();
return wrapper(tag,result);
} else {
if(typeof x === 'string'){
return x;
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["hiccup->doc error: ",x], 0));

}
}
});
var result = ((cljs.core.vector_QMARK_(cljs.core.first(hiccup)))?(function (){var iter__5480__auto__ = (function frontend$extensions$html_parser$hiccup__GT_doc_inner_$_iter__105681(s__105682){
return (new cljs.core.LazySeq(null,(function (){
var s__105682__$1 = s__105682;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__105682__$1);
if(temp__5804__auto__){
var s__105682__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__105682__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__105682__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__105684 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__105683 = (0);
while(true){
if((i__105683 < size__5479__auto__)){
var x = cljs.core._nth(c__5478__auto__,i__105683);
cljs.core.chunk_append(b__105684,single_hiccup_transform(x));

var G__105695 = (i__105683 + (1));
i__105683 = G__105695;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__105684),frontend$extensions$html_parser$hiccup__GT_doc_inner_$_iter__105681(cljs.core.chunk_rest(s__105682__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__105684),null);
}
} else {
var x = cljs.core.first(s__105682__$2);
return cljs.core.cons(single_hiccup_transform(x),frontend$extensions$html_parser$hiccup__GT_doc_inner_$_iter__105681(cljs.core.rest(s__105682__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(hiccup);
})():single_hiccup_transform(hiccup));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,result);
});
frontend.extensions.html_parser.hiccup__GT_doc = (function frontend$extensions$html_parser$hiccup__GT_doc(format,hiccup){
var s = frontend.extensions.html_parser.hiccup__GT_doc_inner(format,hiccup,cljs.core.PersistentArrayMap.EMPTY);
if(clojure.string.blank_QMARK_(s)){
return "";
} else {
return clojure.string.replace(clojure.string.trim(s),/\n\n+/,"\n\n");
}
});
frontend.extensions.html_parser.html_decode_hiccup = (function frontend$extensions$html_parser$html_decode_hiccup(hiccup){
return clojure.walk.postwalk((function (f){
if(typeof f === 'string'){
return goog.string.unescapeEntities(f);
} else {
return f;
}
}),hiccup);
});
frontend.extensions.html_parser.remove_ending_dash_lines = (function frontend$extensions$html_parser$remove_ending_dash_lines(s){
if(typeof s === 'string'){
return clojure.string.replace(s,/(\n*-\s*\n*)*$/,"");
} else {
return s;
}
});
frontend.extensions.html_parser.convert = (function frontend$extensions$html_parser$convert(format,html){
if(clojure.string.blank_QMARK_(html)){
return null;
} else {
var hiccup = hickory.core.as_hiccup(hickory.core.parse(html));
var decoded_hiccup = frontend.extensions.html_parser.html_decode_hiccup(hiccup);
var result = frontend.extensions.html_parser.hiccup__GT_doc(format,decoded_hiccup);
return frontend.extensions.html_parser.remove_ending_dash_lines(result);
}
});

//# sourceMappingURL=frontend.extensions.html_parser.js.map
