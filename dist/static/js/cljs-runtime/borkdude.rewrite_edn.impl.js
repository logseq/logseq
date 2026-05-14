goog.provide('borkdude.rewrite_edn.impl');
borkdude.rewrite_edn.impl.count_uncommented_children = (function borkdude$rewrite_edn$impl$count_uncommented_children(zloc){
return cljs.core.count(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__69378_SHARP_){
return ((rewrite_clj.node.whitespace_or_comment_QMARK_(p1__69378_SHARP_)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uneval","uneval",1932037707),rewrite_clj.node.tag(p1__69378_SHARP_))));
}),new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(rewrite_clj.zip.node(zloc))));
});
borkdude.rewrite_edn.impl.comment_loc_QMARK_ = (function borkdude$rewrite_edn$impl$comment_loc_QMARK_(zloc){
var G__69380 = rewrite_clj.zip.tag(zloc);
var fexpr__69379 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"uneval","uneval",1932037707),null,new cljs.core.Keyword(null,"comment","comment",532206069),null], null), null);
return (fexpr__69379.cljs$core$IFn$_invoke$arity$1 ? fexpr__69379.cljs$core$IFn$_invoke$arity$1(G__69380) : fexpr__69379.call(null,G__69380));
});
borkdude.rewrite_edn.impl.find_comment_child_loc = (function borkdude$rewrite_edn$impl$find_comment_child_loc(zloc){
var G__69381 = zloc;
var G__69381__$1 = (((G__69381 == null))?null:rewrite_clj.zip.down_STAR_(G__69381));
if((G__69381__$1 == null)){
return null;
} else {
return rewrite_clj.zip.find.cljs$core$IFn$_invoke$arity$3(G__69381__$1,rewrite_clj.zip.right_STAR_,borkdude.rewrite_edn.impl.comment_loc_QMARK_);
}
});
borkdude.rewrite_edn.impl.maybe_right = (function borkdude$rewrite_edn$impl$maybe_right(zloc){
if(rewrite_clj.zip.rightmost_QMARK_(zloc)){
return zloc;
} else {
return rewrite_clj.zip.right(zloc);
}
});
borkdude.rewrite_edn.impl.skip_right = (function borkdude$rewrite_edn$impl$skip_right(zloc){
return rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
return (((!(rewrite_clj.zip.rightmost_QMARK_(zloc__$1)))) && (((rewrite_clj.node.whitespace_or_comment_QMARK_(rewrite_clj.zip.node(zloc__$1))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uneval","uneval",1932037707),rewrite_clj.zip.tag(zloc__$1))))));
}),zloc);
});
borkdude.rewrite_edn.impl.skip_right_to_last_non_ws = (function borkdude$rewrite_edn$impl$skip_right_to_last_non_ws(zloc){
return rewrite_clj.zip.skip(rewrite_clj.zip.left_STAR_,rewrite_clj.zip.whitespace_QMARK_,rewrite_clj.zip.rightmost_STAR_(zloc));
});
borkdude.rewrite_edn.impl.indent_or_space = (function borkdude$rewrite_edn$impl$indent_or_space(zloc,key_count,align_loc){
var current_loc = cljs.core.meta(rewrite_clj.zip.node(zloc));
if(cljs.core.truth_((function (){var and__5000__auto__ = align_loc;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),key_count);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = borkdude.rewrite_edn.impl.comment_loc_QMARK_(zloc);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"row","row",-570139521).cljs$core$IFn$_invoke$arity$1(align_loc),new cljs.core.Keyword(null,"row","row",-570139521).cljs$core$IFn$_invoke$arity$1(current_loc));
}
}
} else {
return and__5000__auto__;
}
})())){
var indent_spaces = (new cljs.core.Keyword(null,"col","col",-1959363084).cljs$core$IFn$_invoke$arity$1(align_loc) - (1));
var G__69389 = zloc;
var G__69389__$1 = (((indent_spaces > (0)))?rewrite_clj.zip.insert_space_right.cljs$core$IFn$_invoke$arity$2(G__69389,indent_spaces):G__69389);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"comment","comment",532206069),rewrite_clj.zip.tag(zloc))){
return rewrite_clj.zip.insert_newline_right.cljs$core$IFn$_invoke$arity$1(G__69389__$1);
} else {
return G__69389__$1;
}
} else {
return rewrite_clj.zip.insert_space_right.cljs$core$IFn$_invoke$arity$2(zloc,(1));
}
});
borkdude.rewrite_edn.impl.assoc_STAR_ = (function borkdude$rewrite_edn$impl$assoc_STAR_(forms,k,v){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var tag = rewrite_clj.zip.tag(zloc);
var zloc__$1 = rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
var t = rewrite_clj.zip.tag(zloc__$1);
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"vector","vector",1902966158),null,new cljs.core.Keyword(null,"token","token",-1211463215),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null),t)));
}),zloc);
var node = rewrite_clj.zip.node(zloc__$1);
var nil_QMARK_ = (((new cljs.core.Keyword(null,"token","token",-1211463215) === rewrite_clj.node.tag(node))) && ((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node) == null)));
var zloc__$2 = ((nil_QMARK_)?rewrite_clj.zip.replace(zloc__$1,rewrite_clj.node.coerce(cljs.core.PersistentArrayMap.EMPTY)):zloc__$1);
var length = borkdude.rewrite_edn.impl.count_uncommented_children(zloc__$2);
var out_of_bounds_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vector","vector",1902966158),tag)) && ((k >= length)));
var zloc_comment = (((length === (0)))?borkdude.rewrite_edn.impl.find_comment_child_loc(zloc__$2):null);
var empty_QMARK_ = ((((nil_QMARK_) || ((length === (0))))) && (cljs.core.not(zloc_comment)));
if(empty_QMARK_){
return rewrite_clj.zip.root(rewrite_clj.zip.append_child(rewrite_clj.zip.append_child(zloc__$2,rewrite_clj.node.coerce(k)),rewrite_clj.node.coerce(v)));
} else {
if(out_of_bounds_QMARK_){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("IndexOutOfBounds",cljs.core.PersistentArrayMap.EMPTY);
} else {
var vec__69396 = (cljs.core.truth_(zloc_comment)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [borkdude.rewrite_edn.impl.skip_right_to_last_non_ws(rewrite_clj.zip.down_STAR_(zloc__$2)),cljs.core.meta(rewrite_clj.zip.node(zloc_comment))], null):(function (){var zloc_first_key = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.down(zloc__$2));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [zloc_first_key,(function (){var G__69399 = zloc_first_key;
var G__69399__$1 = (((G__69399 == null))?null:rewrite_clj.zip.node(G__69399));
if((G__69399__$1 == null)){
return null;
} else {
return cljs.core.meta(G__69399__$1);
}
})()], null);
})());
var zloc__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69396,(0),null);
var align_to_loc = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69396,(1),null);
var key_count = (0);
var zloc__$4 = zloc__$3;
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var fexpr__69408 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"token","token",-1211463215),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null);
return (fexpr__69408.cljs$core$IFn$_invoke$arity$1 ? fexpr__69408.cljs$core$IFn$_invoke$arity$1(tag) : fexpr__69408.call(null,tag));
})();
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.zip.rightmost_QMARK_(zloc__$4);
} else {
return and__5000__auto__;
}
})())){
return rewrite_clj.zip.root(rewrite_clj.zip.insert_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.indent_or_space(rewrite_clj.zip.insert_right_STAR_(zloc__$4,rewrite_clj.node.coerce(k)),key_count,align_to_loc)),rewrite_clj.node.coerce(v)));
} else {
var current_k = rewrite_clj.zip.sexpr(zloc__$4);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vector","vector",1902966158),tag)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key_count,k)))){
var zloc__$5 = rewrite_clj.zip.replace(zloc__$4,rewrite_clj.node.coerce(v));
return rewrite_clj.zip.root(zloc__$5);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var fexpr__69413 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"token","token",-1211463215),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null);
return (fexpr__69413.cljs$core$IFn$_invoke$arity$1 ? fexpr__69413.cljs$core$IFn$_invoke$arity$1(tag) : fexpr__69413.call(null,tag));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_k,k);
} else {
return and__5000__auto__;
}
})())){
var zloc__$5 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(zloc__$4));
var zloc__$6 = rewrite_clj.zip.replace(zloc__$5,rewrite_clj.node.coerce(v));
return rewrite_clj.zip.root(zloc__$6);
} else {
var G__69533 = (key_count + (1));
var G__69534 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.skip_right(zloc__$4)));
key_count = G__69533;
zloc__$4 = G__69534;
continue;

}
}
}
break;
}

}
}
});
borkdude.rewrite_edn.impl.mark_for_positional_recalc = (function borkdude$rewrite_edn$impl$mark_for_positional_recalc(node){
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(node,cljs.core.assoc,new cljs.core.Keyword("rewrite-edn","positional-recalc","rewrite-edn/positional-recalc",-129995178),true);
});
borkdude.rewrite_edn.impl.recalc_positional_metadata = (function borkdude$rewrite_edn$impl$recalc_positional_metadata(node){
if(cljs.core.truth_(new cljs.core.Keyword("rewrite-edn","positional-recalc","rewrite-edn/positional-recalc",-129995178).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(node)))){
return rewrite_clj.parser.parse_string_all(cljs.core.str.cljs$core$IFn$_invoke$arity$1(node));
} else {
return node;
}
});
borkdude.rewrite_edn.impl.assoc = (function borkdude$rewrite_edn$impl$assoc(forms,k,v){
return borkdude.rewrite_edn.impl.mark_for_positional_recalc(borkdude.rewrite_edn.impl.assoc_STAR_(borkdude.rewrite_edn.impl.recalc_positional_metadata(forms),k,v));
});
borkdude.rewrite_edn.impl.get = (function borkdude$rewrite_edn$impl$get(zloc,k,default$){
var zloc__$1 = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(zloc);
var tag = rewrite_clj.zip.tag(zloc__$1);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),tag)){
var node = rewrite_clj.zip.node(zloc__$1);
var nil_QMARK_ = (((new cljs.core.Keyword(null,"token","token",-1211463215) === rewrite_clj.node.tag(node))) && ((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node) == null)));
var zloc__$2 = ((nil_QMARK_)?rewrite_clj.zip.replace(zloc__$1,rewrite_clj.node.coerce(cljs.core.PersistentArrayMap.EMPTY)):zloc__$1);
var empty_QMARK_ = ((nil_QMARK_) || ((cljs.core.count(new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(rewrite_clj.zip.node(zloc__$2))) === (0))));
var zloc__$3 = rewrite_clj.zip.down(zloc__$2);
var zloc__$4 = borkdude.rewrite_edn.impl.skip_right(zloc__$3);
if(empty_QMARK_){
return new cljs.core.Keyword(null,"empty","empty",767870958);
} else {
var key_count = (0);
var zloc__$5 = zloc__$4;
while(true){
if(rewrite_clj.zip.rightmost_QMARK_(zloc__$5)){
return rewrite_clj.node.coerce(default$);
} else {
var current_k = rewrite_clj.zip.sexpr(zloc__$5);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_k,k)){
return cljs.core.first(borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(zloc__$5)));
} else {
var G__69539 = (key_count + (1));
var G__69540 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.skip_right(zloc__$5)));
key_count = G__69539;
zloc__$5 = G__69540;
continue;
}
}
break;
}
}
} else {
var coll = (function (){var G__69439 = rewrite_clj.zip.down(zloc__$1);
var G__69439__$1 = (((G__69439 == null))?null:cljs.core.iterate(rewrite_clj.zip.right,G__69439));
var G__69439__$2 = (((G__69439__$1 == null))?null:cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,G__69439__$1));
if((G__69439__$2 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__69419_SHARP_){
return ((rewrite_clj.node.whitespace_or_comment_QMARK_(p1__69419_SHARP_)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"uneval","uneval",1932037707),rewrite_clj.node.tag(p1__69419_SHARP_))));
}),G__69439__$2);
}
})();
if((k >= cljs.core.count(coll))){
return rewrite_clj.node.coerce(default$);
} else {
return rewrite_clj.node.coerce(cljs.core.first(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(coll,k)));
}

}
});
borkdude.rewrite_edn.impl.get_in = (function borkdude$rewrite_edn$impl$get_in(zloc,ks,not_found){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (zloc__$1,k){
if((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(zloc__$1) == null)){
return rewrite_clj.node.coerce(not_found);
} else {
var v = borkdude.rewrite_edn.impl.get(zloc__$1,k,new cljs.core.Keyword("borkdude.rewrite-edn.impl","not-found","borkdude.rewrite-edn.impl/not-found",-1579767302));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"empty","empty",767870958),v)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("borkdude.rewrite-edn.impl","not-found","borkdude.rewrite-edn.impl/not-found",-1579767302),rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(v))))){
return rewrite_clj.node.coerce(not_found);
} else {
return v;
}
}
}),zloc,ks);
});
borkdude.rewrite_edn.impl.update_STAR_ = (function borkdude$rewrite_edn$impl$update_STAR_(var_args){
var G__69460 = arguments.length;
switch (G__69460) {
case 3:
return borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$3 = (function (forms,k,f){
return borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$4(forms,k,f,null);
}));

(borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$4 = (function (forms,k,f,args){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var zloc__$1 = rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
var t = rewrite_clj.zip.tag(zloc__$1);
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"token","token",-1211463215),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null),t)));
}),zloc);
var node = rewrite_clj.zip.node(zloc__$1);
var nil_QMARK_ = (((new cljs.core.Keyword(null,"token","token",-1211463215) === rewrite_clj.node.tag(node))) && ((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node) == null)));
var length = borkdude.rewrite_edn.impl.count_uncommented_children(zloc__$1);
var zloc__$2 = ((nil_QMARK_)?rewrite_clj.zip.replace(zloc__$1,rewrite_clj.node.coerce(cljs.core.PersistentArrayMap.EMPTY)):zloc__$1);
var zloc_comment = (((length === (0)))?borkdude.rewrite_edn.impl.find_comment_child_loc(zloc__$2):null);
var empty_QMARK_ = ((((nil_QMARK_) || ((length === (0))))) && (cljs.core.not(zloc_comment)));
if(empty_QMARK_){
return borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$4(rewrite_clj.zip.root(rewrite_clj.zip.append_child(rewrite_clj.zip.append_child(zloc__$2,rewrite_clj.node.coerce(k)),rewrite_clj.node.coerce(null))),k,f,args);
} else {
var vec__69474 = (cljs.core.truth_(zloc_comment)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [borkdude.rewrite_edn.impl.skip_right_to_last_non_ws(rewrite_clj.zip.down_STAR_(zloc__$2)),cljs.core.meta(rewrite_clj.zip.node(zloc_comment))], null):(function (){var zloc_first_key = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.down(zloc__$2));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [zloc_first_key,(function (){var G__69477 = zloc_first_key;
var G__69477__$1 = (((G__69477 == null))?null:rewrite_clj.zip.node(G__69477));
if((G__69477__$1 == null)){
return null;
} else {
return cljs.core.meta(G__69477__$1);
}
})()], null);
})());
var zloc__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69474,(0),null);
var align_to_loc = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69474,(1),null);
var key_count = (0);
var zloc__$4 = zloc__$3;
while(true){
if(rewrite_clj.zip.rightmost_QMARK_(zloc__$4)){
return rewrite_clj.zip.root(rewrite_clj.zip.insert_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.indent_or_space(rewrite_clj.zip.insert_right_STAR_(zloc__$4,rewrite_clj.node.coerce(k)),key_count,align_to_loc)),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,rewrite_clj.node.coerce(null),args)));
} else {
var current_k = rewrite_clj.zip.sexpr(zloc__$4);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_k,k)){
var zloc__$5 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(zloc__$4));
var zloc__$6 = rewrite_clj.zip.replace(zloc__$5,rewrite_clj.node.coerce(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,rewrite_clj.zip.node(zloc__$5),args)));
return rewrite_clj.zip.root(zloc__$6);
} else {
var G__69549 = (key_count + (1));
var G__69550 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.skip_right(zloc__$4)));
key_count = G__69549;
zloc__$4 = G__69550;
continue;
}
}
break;
}
}
}));

(borkdude.rewrite_edn.impl.update_STAR_.cljs$lang$maxFixedArity = 4);

borkdude.rewrite_edn.impl.update = (function borkdude$rewrite_edn$impl$update(var_args){
var G__69487 = arguments.length;
switch (G__69487) {
case 3:
return borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$3 = (function (forms,k,f){
return borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$4(forms,k,f,null);
}));

(borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$4 = (function (forms,k,f,args){
return borkdude.rewrite_edn.impl.mark_for_positional_recalc(borkdude.rewrite_edn.impl.update_STAR_.cljs$core$IFn$_invoke$arity$4(borkdude.rewrite_edn.impl.recalc_positional_metadata(forms),k,f,args));
}));

(borkdude.rewrite_edn.impl.update.cljs$lang$maxFixedArity = 4);

borkdude.rewrite_edn.impl.update_in = (function borkdude$rewrite_edn$impl$update_in(forms,keys,f,args){
return borkdude.rewrite_edn.impl.mark_for_positional_recalc(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(keys)))?borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$4(forms,cljs.core.first(keys),f,args):borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$3(forms,cljs.core.first(keys),(function (p1__69489_SHARP_){
var G__69490 = p1__69489_SHARP_;
var G__69491 = cljs.core.rest(keys);
var G__69492 = f;
var G__69493 = args;
return (borkdude.rewrite_edn.impl.update_in.cljs$core$IFn$_invoke$arity$4 ? borkdude.rewrite_edn.impl.update_in.cljs$core$IFn$_invoke$arity$4(G__69490,G__69491,G__69492,G__69493) : borkdude.rewrite_edn.impl.update_in.call(null,G__69490,G__69491,G__69492,G__69493));
}))));
});
borkdude.rewrite_edn.impl.assoc_in = (function borkdude$rewrite_edn$impl$assoc_in(forms,keys,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(keys))){
return borkdude.rewrite_edn.impl.assoc(forms,cljs.core.first(keys),v);
} else {
return borkdude.rewrite_edn.impl.mark_for_positional_recalc(borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$3(borkdude.rewrite_edn.impl.recalc_positional_metadata(forms),cljs.core.first(keys),(function (p1__69495_SHARP_){
var G__69498 = p1__69495_SHARP_;
var G__69499 = cljs.core.rest(keys);
var G__69500 = v;
return (borkdude.rewrite_edn.impl.assoc_in.cljs$core$IFn$_invoke$arity$3 ? borkdude.rewrite_edn.impl.assoc_in.cljs$core$IFn$_invoke$arity$3(G__69498,G__69499,G__69500) : borkdude.rewrite_edn.impl.assoc_in.call(null,G__69498,G__69499,G__69500));
})));
}
});
borkdude.rewrite_edn.impl.map_keys = (function borkdude$rewrite_edn$impl$map_keys(f,forms){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var zloc__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),rewrite_clj.zip.tag(zloc)))?zloc:rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
return ((cljs.core.not(rewrite_clj.zip.rightmost(zloc__$1))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),rewrite_clj.zip.tag(zloc__$1))));
}),zloc));
var zloc__$2 = rewrite_clj.zip.down(zloc__$1);
var zloc__$3 = borkdude.rewrite_edn.impl.skip_right(zloc__$2);
var zloc__$4 = zloc__$3;
while(true){
if(rewrite_clj.zip.rightmost_QMARK_(zloc__$4)){
return rewrite_clj.zip.root(zloc__$4);
} else {
var zloc__$5 = (function (){var new_key = rewrite_clj.node.coerce((function (){var G__69505 = rewrite_clj.zip.sexpr(zloc__$4);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__69505) : f.call(null,G__69505));
})());
return rewrite_clj.zip.right(rewrite_clj.zip.replace(zloc__$4,new_key));
})();
var G__69559 = borkdude.rewrite_edn.impl.skip_right(borkdude.rewrite_edn.impl.maybe_right(borkdude.rewrite_edn.impl.skip_right(zloc__$5)));
zloc__$4 = G__69559;
continue;
}
break;
}
});
borkdude.rewrite_edn.impl.dissoc = (function borkdude$rewrite_edn$impl$dissoc(forms,k){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var zloc__$1 = rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
var t = rewrite_clj.zip.tag(zloc__$1);
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"token","token",-1211463215),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null),t)));
}),zloc);
var node = rewrite_clj.zip.node(zloc__$1);
var nil_QMARK_ = (((new cljs.core.Keyword(null,"token","token",-1211463215) === rewrite_clj.node.tag(node))) && ((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node) == null)));
if(nil_QMARK_){
return forms;
} else {
var zloc__$2 = rewrite_clj.zip.down(zloc__$1);
var zloc__$3 = borkdude.rewrite_edn.impl.skip_right(zloc__$2);
var zloc__$4 = zloc__$3;
while(true){
if(rewrite_clj.zip.rightmost_QMARK_(zloc__$4)){
return forms;
} else {
var current_k = rewrite_clj.zip.sexpr(zloc__$4);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_k,k)){
return rewrite_clj.zip.root(rewrite_clj.zip.remove(rewrite_clj.zip.remove(rewrite_clj.zip.right(zloc__$4))));
} else {
var G__69564 = borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(borkdude.rewrite_edn.impl.skip_right(zloc__$4)));
zloc__$4 = G__69564;
continue;
}
}
break;
}
}
});
borkdude.rewrite_edn.impl.keys = (function borkdude$rewrite_edn$impl$keys(forms){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var zloc__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),rewrite_clj.zip.tag(zloc)))?zloc:rewrite_clj.zip.skip(rewrite_clj.zip.right,(function (zloc__$1){
return ((cljs.core.not(rewrite_clj.zip.rightmost(zloc__$1))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),rewrite_clj.zip.tag(zloc__$1))));
}),zloc));
var zloc__$2 = rewrite_clj.zip.down(zloc__$1);
var zloc__$3 = borkdude.rewrite_edn.impl.skip_right(zloc__$2);
var zloc__$4 = zloc__$3;
var ks = cljs.core.List.EMPTY;
while(true){
if(rewrite_clj.zip.rightmost_QMARK_(zloc__$4)){
return ks;
} else {
var k = rewrite_clj.zip.node(zloc__$4);
var G__69569 = borkdude.rewrite_edn.impl.skip_right(borkdude.rewrite_edn.impl.maybe_right(borkdude.rewrite_edn.impl.skip_right(rewrite_clj.zip.right(zloc__$4))));
var G__69570 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ks,k);
zloc__$4 = G__69569;
ks = G__69570;
continue;
}
break;
}
});
borkdude.rewrite_edn.impl.conj_STAR_ = (function borkdude$rewrite_edn$impl$conj_STAR_(forms,v){
var zloc = rewrite_clj.zip.of_node.cljs$core$IFn$_invoke$arity$1(forms);
var node = rewrite_clj.zip.node(zloc);
var tag = rewrite_clj.node.tag(node);
var nil_QMARK_ = (((new cljs.core.Keyword(null,"token","token",-1211463215) === tag)) && ((rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node) == null)));
if(nil_QMARK_){
return rewrite_clj.zip.root(rewrite_clj.zip.replace(zloc,rewrite_clj.node.coerce((new cljs.core.List(null,v,null,(1),null)))));
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"vector","vector",1902966158),null,new cljs.core.Keyword(null,"set","set",304602554),null], null), null),tag)){
return rewrite_clj.zip.root(rewrite_clj.zip.append_child(zloc,rewrite_clj.node.coerce(v)));
} else {
if((tag === new cljs.core.Keyword(null,"list","list",765357683))){
return rewrite_clj.zip.root(rewrite_clj.zip.insert_child(zloc,rewrite_clj.node.coerce(v)));
} else {
if((tag === new cljs.core.Keyword(null,"map","map",1371690461))){
return borkdude.rewrite_edn.impl.assoc(forms,cljs.core.first(v),cljs.core.second(v));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Unsupported forms",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"forms","forms",2045992350),forms], null));

}
}
}
}
});
borkdude.rewrite_edn.impl.conj = (function borkdude$rewrite_edn$impl$conj(forms,v){
return borkdude.rewrite_edn.impl.mark_for_positional_recalc(borkdude.rewrite_edn.impl.conj_STAR_(borkdude.rewrite_edn.impl.recalc_positional_metadata(forms),v));
});
borkdude.rewrite_edn.impl.fnil = (function borkdude$rewrite_edn$impl$fnil(f,nil_replacement){
return (function() { 
var G__69576__delegate = function (x,args){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("nil",cljs.core.str.cljs$core$IFn$_invoke$arity$1(x))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,rewrite_clj.node.coerce(nil_replacement),args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,x,args);
}
};
var G__69576 = function (x,var_args){
var args = null;
if (arguments.length > 1) {
var G__69577__i = 0, G__69577__a = new Array(arguments.length -  1);
while (G__69577__i < G__69577__a.length) {G__69577__a[G__69577__i] = arguments[G__69577__i + 1]; ++G__69577__i;}
  args = new cljs.core.IndexedSeq(G__69577__a,0,null);
} 
return G__69576__delegate.call(this,x,args);};
G__69576.cljs$lang$maxFixedArity = 1;
G__69576.cljs$lang$applyTo = (function (arglist__69578){
var x = cljs.core.first(arglist__69578);
var args = cljs.core.rest(arglist__69578);
return G__69576__delegate(x,args);
});
G__69576.cljs$core$IFn$_invoke$arity$variadic = G__69576__delegate;
return G__69576;
})()
;
});

//# sourceMappingURL=borkdude.rewrite_edn.impl.js.map
