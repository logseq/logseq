goog.provide('logseq.shui.shortcut.v1');
logseq.shui.shortcut.v1.mac_QMARK_ = goog.userAgent.MAC;
logseq.shui.shortcut.v1.print_shortcut_key = (function logseq$shui$shortcut$v1$print_shortcut_key(key){
var result = ((cljs.core.coll_QMARK_(key))?clojure.string.join.cljs$core$IFn$_invoke$arity$2("+",key):(function (){var G__73688 = ((typeof key === 'string')?clojure.string.lower_case(key):key);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__73688)){
return "";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2193",G__73688)){
return "\u2193";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("space",G__73688)){
return "Space";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("tab",G__73688)){
return "Tab";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2318",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("right",G__73688)){
return "\u2192";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("up",G__73688)){
return "\u2191";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("comma",G__73688)){
return ",";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("opt",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("command",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2192",G__73688)){
return "\u2192";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2303",G__73688)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u23CE",G__73688)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2190",G__73688)){
return "\u2190";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("return",G__73688)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("grave-accent",G__73688)){
return "`";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("option",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("single-quote",G__73688)){
return "'";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u21E7",G__73688)){
return "\u21E7";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("page-up",G__73688)){
return "\uF571";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("open-square-bracket",G__73688)){
return "[";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("semicolon",G__73688)){
return ";";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("shift",G__73688)){
return "\u21E7";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dash",G__73688)){
return "-";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("alt",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2325",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "Opt";
} else {
return "Alt";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("control",G__73688)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("slash",G__73688)){
return "/";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("mod",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("cmd",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "Ctrl";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("down",G__73688)){
return "\u2193";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\u2191",G__73688)){
return "\u2191";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("meta",G__73688)){
if(cljs.core.truth_(logseq.shui.shortcut.v1.mac_QMARK_)){
return "\u2318";
} else {
return "\u229E";
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("page-down",G__73688)){
return "\uF572";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ctrl",G__73688)){
return "Ctrl";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("period",G__73688)){
return ".";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("backslash",G__73688)){
return "\\";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("close-square-bracket",G__73688)){
return "]";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(" ",G__73688)){
return "Space";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("enter",G__73688)){
return "\u23CE";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("equals",G__73688)){
return "=";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("left",G__73688)){
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
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__73704_SHARP_){
if(clojure.string.includes_QMARK_(p1__73704_SHARP_,"+")){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__73704_SHARP_,/\+/);
} else {
return p1__73704_SHARP_;
}
}),clojure.string.split.cljs$core$IFn$_invoke$arity$2(x,/ /));
}),clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/ \| /));
});
logseq.shui.shortcut.v1.part = rum.core.lazy_build(rum.core.build_defc,(function (ks,size,p__73715){
var map__73716 = p__73715;
var map__73716__$1 = cljs.core.__destructure_map(map__73716);
var interactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73716__$1,new cljs.core.Keyword(null,"interactive?","interactive?",367617676));
var tiles = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.shui.shortcut.v1.print_shortcut_key,ks);
var interactive_QMARK___$1 = interactive_QMARK_ === true;
return daiquiri.interpreter.interpret(logseq.shui.base.core.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),((interactive_QMARK___$1)?new cljs.core.Keyword(null,"default","default",-1987822328):new cljs.core.Keyword(null,"text","text",-1790561697)),new cljs.core.Keyword(null,"class","class",-2030961996),["bg-gray-03 text-gray-10 px-1.5 py-0 leading-4 h-5 rounded font-normal ",((interactive_QMARK___$1)?"hover:bg-gray-04 active:bg-gray-03 hover:text-gray-12":"bg-transparent cursor-default active:bg-gray-03 hover:text-gray-11 opacity-80")].join(''),new cljs.core.Keyword(null,"size","size",1098693007),size], null),(function (){var iter__5480__auto__ = (function logseq$shui$shortcut$v1$iter__73735(s__73736){
return (new cljs.core.LazySeq(null,(function (){
var s__73736__$1 = s__73736;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73736__$1);
if(temp__5804__auto__){
var s__73736__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73736__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73736__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73738 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73737 = (0);
while(true){
if((i__73737 < size__5479__auto__)){
var vec__73740 = cljs.core._nth(c__5478__auto__,i__73737);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73740,(0),null);
var tile = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73740,(1),null);
cljs.core.chunk_append(b__73738,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),index], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((((0) < index))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile-separator","span.ui__button__tile-separator",607084689)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile","span.ui__button__tile",-240828239),tile], null)], null)], null));

var G__73864 = (i__73737 + (1));
i__73737 = G__73864;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73738),logseq$shui$shortcut$v1$iter__73735(cljs.core.chunk_rest(s__73736__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73738),null);
}
} else {
var vec__73749 = cljs.core.first(s__73736__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73749,(0),null);
var tile = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73749,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),index], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),((((0) < index))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile-separator","span.ui__button__tile-separator",607084689)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__button__tile","span.ui__button__tile",-240828239),tile], null)], null)], null),logseq$shui$shortcut$v1$iter__73735(cljs.core.rest(s__73736__$2)));
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
var G__73865__delegate = function (shortcut,p__73761){
var map__73762 = p__73761;
var map__73762__$1 = cljs.core.__destructure_map(map__73762);
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__73762__$1,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"xs","xs",649443341));
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__73762__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"gray","gray",1013268388));
var interactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__73762__$1,new cljs.core.Keyword(null,"interactive?","interactive?",367617676),true);
if(cljs.core.seq(shortcut)){
var shortcuts = ((cljs.core.coll_QMARK_(shortcut))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [shortcut], null):logseq.shui.shortcut.v1.parse_shortcuts(shortcut));
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"interactive?","interactive?",367617676),interactive_QMARK_], null);
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function logseq$shui$shortcut$v1$iter__73763(s__73764){
return (new cljs.core.LazySeq(null,(function (){
var s__73764__$1 = s__73764;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73764__$1);
if(temp__5804__auto__){
var s__73764__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73764__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73764__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73766 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73765 = (0);
while(true){
if((i__73765 < size__5479__auto__)){
var vec__73771 = cljs.core._nth(c__5478__auto__,i__73765);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73771,(0),null);
var binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73771,(1),null);
cljs.core.chunk_append(b__73766,daiquiri.core.create_element("span",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(index)},[((((0) < index))?daiquiri.core.create_element("span",{'key':"sep",'className':"text-gray-11 text-sm"},["|"]):null),((cljs.core.coll_QMARK_(cljs.core.first(binding)))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__73765,vec__73771,index,binding,c__5478__auto__,size__5479__auto__,b__73766,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_){
return (function logseq$shui$shortcut$v1$iter__73763_$_iter__73785(s__73786){
return (new cljs.core.LazySeq(null,((function (i__73765,vec__73771,index,binding,c__5478__auto__,size__5479__auto__,b__73766,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_){
return (function (){
var s__73786__$1 = s__73786;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__73786__$1);
if(temp__5804__auto____$1){
var s__73786__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__73786__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__73786__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__73788 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__73787 = (0);
while(true){
if((i__73787 < size__5479__auto____$1)){
var vec__73790 = cljs.core._nth(c__5478__auto____$1,i__73787);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73790,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73790,(1),null);
cljs.core.chunk_append(b__73788,rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')));

var G__73868 = (i__73787 + (1));
i__73787 = G__73868;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73788),logseq$shui$shortcut$v1$iter__73763_$_iter__73785(cljs.core.chunk_rest(s__73786__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73788),null);
}
} else {
var vec__73797 = cljs.core.first(s__73786__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73797,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73797,(1),null);
return cljs.core.cons(rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')),logseq$shui$shortcut$v1$iter__73763_$_iter__73785(cljs.core.rest(s__73786__$2)));
}
} else {
return null;
}
break;
}
});})(i__73765,vec__73771,index,binding,c__5478__auto__,size__5479__auto__,b__73766,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_))
,null,null));
});})(i__73765,vec__73771,index,binding,c__5478__auto__,size__5479__auto__,b__73766,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,binding));
})()):logseq.shui.shortcut.v1.part(binding,size,opts))]));

var G__73869 = (i__73765 + (1));
i__73765 = G__73869;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73766),logseq$shui$shortcut$v1$iter__73763(cljs.core.chunk_rest(s__73764__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73766),null);
}
} else {
var vec__73813 = cljs.core.first(s__73764__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73813,(0),null);
var binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73813,(1),null);
return cljs.core.cons(daiquiri.core.create_element("span",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(index)},[((((0) < index))?daiquiri.core.create_element("span",{'key':"sep",'className':"text-gray-11 text-sm"},["|"]):null),((cljs.core.coll_QMARK_(cljs.core.first(binding)))?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (vec__73813,index,binding,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_){
return (function logseq$shui$shortcut$v1$iter__73763_$_iter__73816(s__73817){
return (new cljs.core.LazySeq(null,(function (){
var s__73817__$1 = s__73817;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__73817__$1);
if(temp__5804__auto____$1){
var s__73817__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__73817__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73817__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73819 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73818 = (0);
while(true){
if((i__73818 < size__5479__auto__)){
var vec__73820 = cljs.core._nth(c__5478__auto__,i__73818);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73820,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73820,(1),null);
cljs.core.chunk_append(b__73819,rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')));

var G__73870 = (i__73818 + (1));
i__73818 = G__73870;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73819),logseq$shui$shortcut$v1$iter__73763_$_iter__73816(cljs.core.chunk_rest(s__73817__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73819),null);
}
} else {
var vec__73829 = cljs.core.first(s__73817__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73829,(0),null);
var ks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73829,(1),null);
return cljs.core.cons(rum.core.with_key(logseq.shui.shortcut.v1.part(ks,size,opts),["part-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')),logseq$shui$shortcut$v1$iter__73763_$_iter__73816(cljs.core.rest(s__73817__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__73813,index,binding,s__73764__$2,temp__5804__auto__,shortcuts,opts,map__73762,map__73762__$1,size,theme,interactive_QMARK_))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,binding));
})()):logseq.shui.shortcut.v1.part(binding,size,opts))]),logseq$shui$shortcut$v1$iter__73763(cljs.core.rest(s__73764__$2)));
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
var G__73865 = function (shortcut,var_args){
var p__73761 = null;
if (arguments.length > 1) {
var G__73873__i = 0, G__73873__a = new Array(arguments.length -  1);
while (G__73873__i < G__73873__a.length) {G__73873__a[G__73873__i] = arguments[G__73873__i + 1]; ++G__73873__i;}
  p__73761 = new cljs.core.IndexedSeq(G__73873__a,0,null);
} 
return G__73865__delegate.call(this,shortcut,p__73761);};
G__73865.cljs$lang$maxFixedArity = 1;
G__73865.cljs$lang$applyTo = (function (arglist__73874){
var shortcut = cljs.core.first(arglist__73874);
var p__73761 = cljs.core.rest(arglist__73874);
return G__73865__delegate(shortcut,p__73761);
});
G__73865.cljs$core$IFn$_invoke$arity$variadic = G__73865__delegate;
return G__73865;
})()
,null,"logseq.shui.shortcut.v1/root");

//# sourceMappingURL=logseq.shui.shortcut.v1.js.map
