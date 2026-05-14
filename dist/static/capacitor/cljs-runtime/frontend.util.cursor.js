goog.provide('frontend.util.cursor');
goog.scope(function(){
  frontend.util.cursor.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.util.cursor.closer = (function frontend$util$cursor$closer(a,b,c){
var a_left = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(a);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var b_left = new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(b);
var c_left = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(c);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return Number.MAX_SAFE_INTEGER;
}
})();
if(((b_left - a_left) < (c_left - b_left))){
return a;
} else {
return c;
}
});
frontend.util.cursor.mock_char_pos = (function frontend$util$cursor$mock_char_pos(e){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left","left",-399115937),e.offsetLeft,new cljs.core.Keyword(null,"top","top",-1856271961),e.offsetTop,new cljs.core.Keyword(null,"pos","pos",-864607220),(cljs.core.second(clojure.string.split.cljs$core$IFn$_invoke$arity$2(e.id,"_")) | (0))], null);
});
/**
 * Get caret offset position as well as input element rect.
 * 
 *   This function is only used by autocomplete command or up/down command
 *   where offset position is needed.
 * 
 *   If you only need character position, use `pos` instead. Do NOT call this.
 */
frontend.util.cursor.get_caret_pos = (function frontend$util$cursor$get_caret_pos(var_args){
var G__56850 = arguments.length;
switch (G__56850) {
case 1:
return frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1 = (function (input){
return frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$2(input,frontend.util.get_selection_start(input));
}));

(frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$2 = (function (input,pos){
if(cljs.core.truth_(input)){
var rect = cljs_bean.core.__GT_clj(input.getBoundingClientRect().toJSON());
var grapheme_pos = frontend.util.get_graphemes_pos(input.value,pos);
try{var G__56858 = goog.dom.getElement("mock-text");
var G__56858__$1 = (((G__56858 == null))?null:goog.dom.getChildren(G__56858));
var G__56858__$2 = (((G__56858__$1 == null))?null:cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(G__56858__$1));
var G__56858__$3 = (((G__56858__$2 == null))?null:frontend.util.nth_safe(G__56858__$2,grapheme_pos));
var G__56858__$4 = (((G__56858__$3 == null))?null:frontend.util.cursor.mock_char_pos(G__56858__$3));
if((G__56858__$4 == null)){
return null;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56858__$4,new cljs.core.Keyword(null,"rect","rect",-108902628),rect);
}
}catch (e56857){var e = e56857;
console.log("index error",e);

return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"pos","pos",-864607220),pos,new cljs.core.Keyword(null,"rect","rect",-108902628),rect,new cljs.core.Keyword(null,"left","left",-399115937),Number.MAX_SAFE_INTEGER,new cljs.core.Keyword(null,"top","top",-1856271961),Number.MAX_SAFE_INTEGER], null);
}} else {
return null;
}
}));

(frontend.util.cursor.get_caret_pos.cljs$lang$maxFixedArity = 2);

frontend.util.cursor.pos = (function frontend$util$cursor$pos(input){
if(cljs.core.truth_(input)){
return frontend.util.get_selection_start(input);
} else {
return null;
}
});
frontend.util.cursor.start_QMARK_ = (function frontend$util$cursor$start_QMARK_(input){
var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.util.get_selection_start(input) === (0));
} else {
return and__5000__auto__;
}
});
frontend.util.cursor.end_QMARK_ = (function frontend$util$cursor$end_QMARK_(input){
var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(input.value),frontend.util.get_selection_start(input));
} else {
return and__5000__auto__;
}
});
frontend.util.cursor.set_selection_to = (function frontend$util$cursor$set_selection_to(input,n,m){
return input.setSelectionRange(n,m);
});
frontend.util.cursor.move_cursor_to = (function frontend$util$cursor$move_cursor_to(var_args){
var G__56879 = arguments.length;
switch (G__56879) {
case 2:
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2 = (function (input,n){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$3(input,n,false);
}));

(frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$3 = (function (input,n,delay_QMARK__SINGLEQUOTE_){
if(typeof n === 'number'){
input.setSelectionRange(n,n);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(document.activeElement,input)){
return null;
} else {
var focus = (function (){
return input.focus();
});
if(cljs.core.truth_(delay_QMARK__SINGLEQUOTE_)){
return setTimeout(focus,(16));
} else {
return focus();
}
}
} else {
return null;
}
}));

(frontend.util.cursor.move_cursor_to.cljs$lang$maxFixedArity = 3);

frontend.util.cursor.move_cursor_forward = (function frontend$util$cursor$move_cursor_forward(var_args){
var G__56884 = arguments.length;
switch (G__56884) {
case 1:
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$1 = (function (input){
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2(input,(1));
}));

(frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2 = (function (input,n){
if(cljs.core.truth_(input)){
var map__56885 = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var map__56885__$1 = cljs.core.__destructure_map(map__56885);
var pos_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56885__$1,new cljs.core.Keyword(null,"pos","pos",-864607220));
var pos_SINGLEQUOTE__SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n,(1)))?(function (){var or__5002__auto__ = frontend.util.safe_inc_current_pos_from_start(input.value,pos_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (pos_SINGLEQUOTE_ + (1));
}
})():(pos_SINGLEQUOTE_ + n));
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,pos_SINGLEQUOTE__SINGLEQUOTE_);
} else {
return null;
}
}));

(frontend.util.cursor.move_cursor_forward.cljs$lang$maxFixedArity = 2);

frontend.util.cursor.move_cursor_backward = (function frontend$util$cursor$move_cursor_backward(var_args){
var G__56892 = arguments.length;
switch (G__56892) {
case 1:
return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$1 = (function (input){
return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(input,(1));
}));

(frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2 = (function (input,n){
if(cljs.core.truth_(input)){
var map__56901 = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var map__56901__$1 = cljs.core.__destructure_map(map__56901);
var pos_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56901__$1,new cljs.core.Keyword(null,"pos","pos",-864607220));
var pos_SINGLEQUOTE__SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n,(1)))?frontend.util.safe_dec_current_pos_from_end(input.value,pos_SINGLEQUOTE_):(pos_SINGLEQUOTE_ - n));
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,pos_SINGLEQUOTE__SINGLEQUOTE_);
} else {
return null;
}
}));

(frontend.util.cursor.move_cursor_backward.cljs$lang$maxFixedArity = 2);

frontend.util.cursor.get_input_content_AMPERSAND_pos = (function frontend$util$cursor$get_input_content_AMPERSAND_pos(input){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.util.cursor.goog$module$goog$object.get(input,"value"),frontend.util.cursor.pos(input)], null);
});
frontend.util.cursor.line_beginning_pos = (function frontend$util$cursor$line_beginning_pos(input){
var vec__56924 = frontend.util.cursor.get_input_content_AMPERSAND_pos(input);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56924,(0),null);
var pos_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56924,(1),null);
if((pos_SINGLEQUOTE_ === (0))){
return (0);
} else {
var last_newline_pos = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(content,"\n",(pos_SINGLEQUOTE_ - (1)));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,last_newline_pos)){
return (0);
} else {
return (last_newline_pos + (1));
}
}
});
frontend.util.cursor.line_end_pos = (function frontend$util$cursor$line_end_pos(input){
var vec__56942 = frontend.util.cursor.get_input_content_AMPERSAND_pos(input);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56942,(0),null);
var pos_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56942,(1),null);
var or__5002__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,"\n",pos_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.count(content);
}
});
frontend.util.cursor.beginning_of_line_QMARK_ = (function frontend$util$cursor$beginning_of_line_QMARK_(input){
var vec__56960 = frontend.util.cursor.get_input_content_AMPERSAND_pos(input);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56960,(0),null);
var pos_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56960,(1),null);
if(cljs.core.truth_(content)){
var or__5002__auto__ = (pos_SINGLEQUOTE_ === (0));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var temp__5804__auto__ = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(pos_SINGLEQUOTE_ - (1)),pos_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto__)){
var pre_char = temp__5804__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(pre_char,"\n");
} else {
return null;
}
}
} else {
return null;
}
});
frontend.util.cursor.move_cursor_to_line_end = (function frontend$util$cursor$move_cursor_to_line_end(input){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,frontend.util.cursor.line_end_pos(input));
});
frontend.util.cursor.move_cursor_to_start = (function frontend$util$cursor$move_cursor_to_start(input){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,(0));
});
frontend.util.cursor.move_cursor_to_end = (function frontend$util$cursor$move_cursor_to_end(input){
var pos_SINGLEQUOTE_ = cljs.core.count(frontend.util.cursor.goog$module$goog$object.get(input,"value"));
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,pos_SINGLEQUOTE_);
});
frontend.util.cursor.move_cursor_to_thing = (function frontend$util$cursor$move_cursor_to_thing(var_args){
var G__57003 = arguments.length;
switch (G__57003) {
case 2:
return frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$2 = (function (input,thing){
return frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$3(input,thing,frontend.util.cursor.pos(input));
}));

(frontend.util.cursor.move_cursor_to_thing.cljs$core$IFn$_invoke$arity$3 = (function (input,thing,from){
var vec__57025 = frontend.util.cursor.get_input_content_AMPERSAND_pos(input);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57025,(0),null);
var _pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57025,(1),null);
var pos_SINGLEQUOTE_ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,thing,from);
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,pos_SINGLEQUOTE_);
}));

(frontend.util.cursor.move_cursor_to_thing.cljs$lang$maxFixedArity = 3);

frontend.util.cursor.move_cursor_forward_by_word = (function frontend$util$cursor$move_cursor_forward_by_word(input){
var val = input.value;
var current = frontend.util.get_selection_start(input);
var current__$1 = (function (){var idx = current;
while(true){
if(cljs.core.truth_((function (){var G__57034 = frontend.util.nth_safe(val,idx);
var fexpr__57033 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [" ",null,"\n",null], null), null);
return (fexpr__57033.cljs$core$IFn$_invoke$arity$1 ? fexpr__57033.cljs$core$IFn$_invoke$arity$1(G__57034) : fexpr__57033.call(null,G__57034));
})())){
var G__57254 = (idx + (1));
idx = G__57254;
continue;
} else {
return idx;
}
break;
}
})();
var idx = (function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(val," ",current__$1),clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",current__$1)], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.count(val);
}
})();
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,idx);
});
frontend.util.cursor.move_cursor_backward_by_word = (function frontend$util$cursor$move_cursor_backward_by_word(input){
var val = input.value;
var current = frontend.util.get_selection_start(input);
var prev = (function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(val," ",(current - (1))),clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",(current - (1)))], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var idx = (((prev === (0)))?(0):((function (){var idx = prev;
while(true){
if(cljs.core.truth_((function (){var G__57060 = frontend.util.nth_safe(val,idx);
var fexpr__57059 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [" ",null,"\n",null], null), null);
return (fexpr__57059.cljs$core$IFn$_invoke$arity$1 ? fexpr__57059.cljs$core$IFn$_invoke$arity$1(G__57060) : fexpr__57059.call(null,G__57060));
})())){
var G__57256 = (idx - (1));
idx = G__57256;
continue;
} else {
return idx;
}
break;
}
})() + (1)));
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,idx);
});
frontend.util.cursor.textarea_cursor_rect_first_row_QMARK_ = (function frontend$util$cursor$textarea_cursor_rect_first_row_QMARK_(cursor){
var elms = (function (){var G__57086 = goog.dom.getElement("mock-text");
var G__57086__$1 = (((G__57086 == null))?null:goog.dom.getChildren(G__57086));
if((G__57086__$1 == null)){
return null;
} else {
return cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(G__57086__$1);
}
})();
var tops = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"top","top",-1856271961),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.util.cursor.mock_char_pos,elms)));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(tops),new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(cursor));
});
frontend.util.cursor.textarea_cursor_first_row_QMARK_ = (function frontend$util$cursor$textarea_cursor_first_row_QMARK_(input){
return frontend.util.cursor.textarea_cursor_rect_first_row_QMARK_(frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input));
});
frontend.util.cursor.textarea_cursor_rect_last_row_QMARK_ = (function frontend$util$cursor$textarea_cursor_rect_last_row_QMARK_(cursor){
var elms = (function (){var G__57090 = goog.dom.getElement("mock-text");
var G__57090__$1 = (((G__57090 == null))?null:goog.dom.getChildren(G__57090));
if((G__57090__$1 == null)){
return null;
} else {
return cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(G__57090__$1);
}
})();
var tops = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"top","top",-1856271961),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.util.cursor.mock_char_pos,elms)));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(tops),new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(cursor));
});
frontend.util.cursor.textarea_cursor_last_row_QMARK_ = (function frontend$util$cursor$textarea_cursor_last_row_QMARK_(input){
return frontend.util.cursor.textarea_cursor_rect_last_row_QMARK_(frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input));
});
frontend.util.cursor.next_cursor_pos_up_down = (function frontend$util$cursor$next_cursor_pos_up_down(direction,cursor){
var temp__5804__auto__ = goog.dom.getElement("mock-text");
if(cljs.core.truth_(temp__5804__auto__)){
var mock_text = temp__5804__auto__;
var elms = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(goog.dom.getChildren(mock_text));
var chars_SINGLEQUOTE_ = cljs.core.group_by(new cljs.core.Keyword(null,"top","top",-1856271961),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.util.cursor.mock_char_pos,elms));
var tops = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.keys(chars_SINGLEQUOTE_));
var tops_p = cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2((function (p1__57117_SHARP_){
return (new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(cursor) === p1__57117_SHARP_);
}),tops);
var line_next = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"up","up",-269712113),direction))?cljs.core.last(cljs.core.first(tops_p)):cljs.core.first(cljs.core.last(tops_p)));
var lefts = cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2((function (char_pos){
return (new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(char_pos) <= new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(cursor));
}),cljs.core.get.cljs$core$IFn$_invoke$arity$2(chars_SINGLEQUOTE_,line_next));
var left_a = cljs.core.last(cljs.core.first(lefts));
var left_c = cljs.core.first(cljs.core.last(lefts));
var closer_SINGLEQUOTE_ = ((((2) > cljs.core.count(lefts)))?left_a:frontend.util.cursor.closer(left_a,cursor,left_c));
return new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(closer_SINGLEQUOTE_);
} else {
return null;
}
});
frontend.util.cursor.move_cursor_up_down = (function frontend$util$cursor$move_cursor_up_down(input,direction){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,frontend.util.cursor.next_cursor_pos_up_down(direction,frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)));
});
frontend.util.cursor.move_cursor_up = (function frontend$util$cursor$move_cursor_up(input){
return frontend.util.cursor.move_cursor_up_down(input,new cljs.core.Keyword(null,"up","up",-269712113));
});
frontend.util.cursor.move_cursor_down = (function frontend$util$cursor$move_cursor_down(input){
return frontend.util.cursor.move_cursor_up_down(input,new cljs.core.Keyword(null,"down","down",1565245570));
});
frontend.util.cursor.select_up_down = (function frontend$util$cursor$select_up_down(input,direction,anchor,cursor_rect){
var next_cursor = frontend.util.cursor.next_cursor_pos_up_down(direction,cursor_rect);
if((anchor <= next_cursor)){
return input.setSelectionRange(anchor,next_cursor,"forward");
} else {
return input.setSelectionRange(next_cursor,anchor,"backward");
}
});

//# sourceMappingURL=frontend.util.cursor.js.map
