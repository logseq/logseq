goog.provide('logseq.shui.shortcut.v1');
logseq.shui.shortcut.v1.mac_QMARK_ = goog.userAgent.MAC;
logseq.shui.shortcut.v1.print_shortcut_key = (function logseq$shui$shortcut$v1$print_shortcut_key(key){
var result = ((cljs.core.coll_QMARK_(key))?clojure.string.join.cljs$core$IFn$_invoke$arity$2("+",key):(function (){var G__74670 = ((typeof key === 'string')?clojure.string.lower_case(key):key);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__74670)){
return "";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2193",G__74670)){
return "\u2193";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("space",G__74670)){
return "Space";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("tab",G__74670)){
return "Tab";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2318",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("right",G__74670)){
return "\u2192";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("up",G__74670)){
return "\u2191";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("comma",G__74670)){
return ",";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("opt",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("command",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2192",G__74670)){
return "\u2192";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2303",G__74670)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u23CE",G__74670)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2190",G__74670)){
return "\u2190";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("return",G__74670)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("grave-accent",G__74670)){
return "`";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("option",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("single-quote",G__74670)){
return "'";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u21E7",G__74670)){
return "\u21E7";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("page-up",G__74670)){
return "\uF571";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("open-square-bracket",G__74670)){
return "[";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("semicolon",G__74670)){
return ";";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("shift",G__74670)){
return "\u21E7";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dash",G__74670)){
return "-";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("alt",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2325",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("control",G__74670)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("slash",G__74670)){
return "/";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("mod",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("cmd",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("down",G__74670)){
return "\u2193";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2191",G__74670)){
return "\u2191";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("meta",G__74670)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "\u229E";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("page-down",G__74670)){
return "\uF572";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ctrl",G__74670)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("period",G__74670)){
return ".";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("backslash",G__74670)){
return "\\";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("close-square-bracket",G__74670)){
return "]";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",G__74670)){
return "Space";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("enter",G__74670)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("equals",G__74670)){
return "=";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("left",G__74670)){
return "\u2190";
} else {
return cljs.core.name(key);

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
}
}
})());
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(((result).length),(1))){
return result;
} else {
return clojure.string.capitalize(result);
}
});
logseq.shui.shortcut.v1.parse_shortcuts = (function logseq$shui$shortcut$v1$parse_shortcuts(s){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__74687_SHARP_){
if(clojure.string.includes_QMARK_(p1__74687_SHARP_,"+")){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__74687_SHARP_,/\+/);
} else {
return p1__74687_SHARP_;
}
}),clojure.string.split.cljs$core$IFn$_invoke$arity$2(x,/ /));
}),clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/ \| /));
});
logseq.shui.shortcut.v1.part = rum.core.lazy_build(rum.core.build_defc,(function (ks,size,p__74703){
var map__74704 = p__74703;
var map__74704__$1 = cljs.core.__destructure_map(map__74704);
var interactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74704__$1,new cljs.core.Keyword(null,"interactive?","interactive?",367617676));
var tiles = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.shui.shortcut.v1.print_shortcut_key,ks);
var interactive_QMARK___$1 = interactive_QMARK_ === true;
return daiquiri.interpreter.interpret(logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),((interactive_QMARK___$1)?new cljs.core.Keyword(null,"default","default",-1987822328):new cljs.core.Keyword(null,"text","text",-1790561697)),new cljs.core.Keyword(null,"class","class",-2030961996),["bg-gray-03 text-gray-10 px-1.5 py-0 leading-4 h-5 rounded font-normal ",((interactive_QMARK___$1)?"hover:bg-gray-04 active:bg-gray-03 hover:text-gray-12":"bg-transparent cursor-default active:bg-gray-03 hover:text-gray-11 opacity-80")].join(''),new cljs.core.Keyword(null,"size","size",1098693007),size], null),(function (){var iter__5480__auto__ = (function logseq$shui$shortcut$v1$iter__74730(s__74731){
return (new cljs.core.LazySeq(null,(function (){
var s__74731__$1 = s__74731;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74731__$1);
if(temp__5804__auto__){
var s__74731__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74731__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74731__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74733 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74732 = (0);
while(true){
if((i__74732 < size__5479__auto__)){
var vec__74740 = cljs.core._nth(c__5478__auto__,i__74732);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74740,(0),null);
var tile = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74740,(1),null);
cljs.core.chunk_append(b__74733,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),index], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((((0) < index))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile-separator","span.ui__button__tile-separator",607084689)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile","span.ui__button__tile",-240828239),tile], null)], null)], null));

var G__74957 = (i__74732 + (1));
i__74732 = G__74957;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74733),logseq$shui$shortcut$v1$iter__74730(cljs.core.chunk_rest(s__74731__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74733),null);
}
} else {
var vec__74749 = cljs.core.first(s__74731__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74749,(0),null);
var tile = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74749,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),index], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((((0) < index))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile-separator","span.ui__button__tile-separator",607084689)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile","span.ui__button__tile",-240828239),tile], null)], null)], null),logseq$shui$shortcut$v1$iter__74730(cljs.core.rest(s__74731__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,tiles));
})()], 0)));
}),null,"logseq.shui.shortcut.v1/part");
logseq.shui.shortcut.v1.root = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__74958__delegate = function (shortcut,p__74762){
var map__74763 = p__74762;
var map__74763__$1 = cljs.core.__destructure_map(map__74763);
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__74763__$1,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"xs","xs",649443341));
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__74763__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"gray","gray",1013268388));
var interactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__74763__$1,new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true);
if(cljs.core.seq(shortcut)){
var shortcuts = ((cljs.core.coll_QMARK_(shortcut))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [shortcut], null):logseq.shui.shortcut.v1.parse_shortcuts(shortcut));
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),interactive_QMARK_], null);
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function logseq$shui$shortcut$v1$iter__74765(s__74766){
return (new cljs.core.LazySeq(null,(function (){
var s__74766__$1 = s__74766;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74766__$1);
if(temp__5804__auto__){
var s__74766__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74766__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74766__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74768 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74767 = (0);
while(true){
if((i__74767 < size__5479__auto__)){
var vec__74775 = cljs.core._nth(c__5478__auto__,i__74767);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74775,(0),null);
var binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74775,(1),null);
cljs.core.chunk_append(b__74768,daiquiri.core.create_element("span",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(index)},[((((0) < index))?daiquiri.core.create_element("span",{'key':"sep",'className':"text-gray-11 text-sm"},["|"]):null),((cljs.core.coll_QMARK_(cljs.core.first(binding)))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__74767,vec__74775,index,binding,c__5478__auto__,size__5479__auto__,b__74768,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_){
return (function logseq$shui$shortcut$v1$iter__74765_$_iter__74868(s__74869){
return (new cljs.core.LazySeq(null,((function (i__74767,vec__74775,index,binding,c__5478__auto__,size__5479__auto__,b__74768,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_){
return (function (){
var s__74869__$1 = s__74869;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__74869__$1);
if(temp__5804__auto____$1){
var s__74869__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__74869__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__74869__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__74871 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__74870 = (0);
while(true){
if((i__74870 < size__5479__auto____$1)){
var vec__74876 = cljs.core._nth(c__5478__auto____$1,i__74870);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74876,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74876,(1),null);
cljs.core.chunk_append(b__74871,rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')));

var G__74964 = (i__74870 + (1));
i__74870 = G__74964;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74871),logseq$shui$shortcut$v1$iter__74765_$_iter__74868(cljs.core.chunk_rest(s__74869__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74871),null);
}
} else {
var vec__74879 = cljs.core.first(s__74869__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74879,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74879,(1),null);
return cljs.core.cons(rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')),logseq$shui$shortcut$v1$iter__74765_$_iter__74868(cljs.core.rest(s__74869__$2)));
}
} else {
return null;
}
break;
}
});})(i__74767,vec__74775,index,binding,c__5478__auto__,size__5479__auto__,b__74768,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_))
,null,null));
});})(i__74767,vec__74775,index,binding,c__5478__auto__,size__5479__auto__,b__74768,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,binding));
})()):logseq.shui.shortcut.v1.part(binding,size,opts))]));

var G__74969 = (i__74767 + (1));
i__74767 = G__74969;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74768),logseq$shui$shortcut$v1$iter__74765(cljs.core.chunk_rest(s__74766__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74768),null);
}
} else {
var vec__74892 = cljs.core.first(s__74766__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74892,(0),null);
var binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74892,(1),null);
return cljs.core.cons(daiquiri.core.create_element("span",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(index)},[((((0) < index))?daiquiri.core.create_element("span",{'key':"sep",'className':"text-gray-11 text-sm"},["|"]):null),((cljs.core.coll_QMARK_(cljs.core.first(binding)))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (vec__74892,index,binding,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_){
return (function logseq$shui$shortcut$v1$iter__74765_$_iter__74895(s__74896){
return (new cljs.core.LazySeq(null,(function (){
var s__74896__$1 = s__74896;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__74896__$1);
if(temp__5804__auto____$1){
var s__74896__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__74896__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74896__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74898 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74897 = (0);
while(true){
if((i__74897 < size__5479__auto__)){
var vec__74901 = cljs.core._nth(c__5478__auto__,i__74897);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74901,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74901,(1),null);
cljs.core.chunk_append(b__74898,rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')));

var G__74975 = (i__74897 + (1));
i__74897 = G__74975;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74898),logseq$shui$shortcut$v1$iter__74765_$_iter__74895(cljs.core.chunk_rest(s__74896__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74898),null);
}
} else {
var vec__74909 = cljs.core.first(s__74896__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74909,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74909,(1),null);
return cljs.core.cons(rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')),logseq$shui$shortcut$v1$iter__74765_$_iter__74895(cljs.core.rest(s__74896__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__74892,index,binding,s__74766__$2,temp__5804__auto__,shortcuts,opts,map__74763,map__74763__$1,size,theme,interactive_QMARK_))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,binding));
})()):logseq.shui.shortcut.v1.part(binding,size,opts))]),logseq$shui$shortcut$v1$iter__74765(cljs.core.rest(s__74766__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,shortcuts));
})());
} else {
return null;
}
};
var G__74958 = function (shortcut,var_args){
var p__74762 = null;
if (arguments.length > 1) {
var G__74982__i = 0, G__74982__a = new Array(arguments.length -  1);
while (G__74982__i < G__74982__a.length) {G__74982__a[G__74982__i] = arguments[G__74982__i + 1]; ++G__74982__i;}
  p__74762 = new cljs.core.IndexedSeq(G__74982__a,0,null);
} 
return G__74958__delegate.call(this,shortcut,p__74762);};
G__74958.cljs$lang$maxFixedArity = 1;
G__74958.cljs$lang$applyTo = (function (arglist__74983){
var shortcut = cljs.core.first(arglist__74983);
var p__74762 = cljs.core.rest(arglist__74983);
return G__74958__delegate(shortcut,p__74762);
});
G__74958.cljs$core$IFn$_invoke$arity$variadic = G__74958__delegate;
return G__74958;
})()
,null,"logseq.shui.shortcut.v1/root");

//# sourceMappingURL=logseq.shui.shortcut.v1.js.map
