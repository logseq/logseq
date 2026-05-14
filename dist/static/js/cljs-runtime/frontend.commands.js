goog.provide('frontend.commands');
goog.scope(function(){
  frontend.commands.goog$module$goog$object = goog.module.get('goog.object');
});
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands.hashtag !== 'undefined')){
} else {
frontend.commands.hashtag = "#";
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands.colon !== 'undefined')){
} else {
frontend.commands.colon = ":";
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands.command_trigger !== 'undefined')){
} else {
frontend.commands.command_trigger = "/";
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands.command_ask !== 'undefined')){
} else {
frontend.commands.command_ask = "\\";
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands._STAR_current_command !== 'undefined')){
} else {
frontend.commands._STAR_current_command = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.commands.query_doc = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return e.stopPropagation();
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-lg.mb-2","div.font-medium.text-lg.mb-2",-1087117546),"Query examples:"], null),new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.mb-1","ul.mb-1",682409297),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query #tag}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query [[page]]}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query \"full-text search\"}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query (and [[project]] (task NOW LATER))}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query (or [[page 1]] [[page 2]])}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query (and (between -7d +7d) (task DONE))}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query (property key value)}}"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.mb-1","li.mb-1",1003010017),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"{{query (page-tags #tag)}}"], null)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Check more examples at ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://docs.logseq.com/#/page/queries",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"Queries documentation"], null),"."], null)], null);
frontend.commands.link_steps = (function frontend$commands$link_steps(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),[frontend.commands.command_trigger,"link"].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-input","editor/show-input",-502568241),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Link",new cljs.core.Keyword(null,"autoFocus","autoFocus",-552622425),true], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Label"], null)], null)], null)], null);
});
frontend.commands.image_link_steps = (function frontend$commands$image_link_steps(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),[frontend.commands.command_trigger,"link"].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-input","editor/show-input",-502568241),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"image-link","image-link",1877271958),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"link","link",-1769163468),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Link",new cljs.core.Keyword(null,"autoFocus","autoFocus",-552622425),true], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",-894540724),new cljs.core.Keyword(null,"image-link","image-link",1877271958),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Label"], null)], null)], null)], null);
});
frontend.commands.zotero_steps = (function frontend$commands$zotero_steps(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),[frontend.commands.command_trigger,"zotero"].join('')], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-zotero","editor/show-zotero",-1834250749)], null)], null);
});
frontend.commands._STAR_extend_slash_commands = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
frontend.commands.register_slash_command = (function frontend$commands$register_slash_command(cmd){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.commands._STAR_extend_slash_commands,cljs.core.conj,cmd);
});
frontend.commands.__GT_marker = (function frontend$commands$__GT_marker(marker){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-status","editor/set-status",-1514172914),marker], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","move-cursor-to-end","editor/move-cursor-to-end",-95512412)], null)], null);
});
frontend.commands.__GT_priority = (function frontend$commands$__GT_priority(priority){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-priority","editor/set-priority",1313333042),priority], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","move-cursor-to-end","editor/move-cursor-to-end",-95512412)], null)], null);
});
frontend.commands.__GT_inline = (function frontend$commands$__GT_inline(type){
var template = (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("@@%s: @@",type) : frontend.util.format.call(null,"@@%s: @@",type));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),template,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null);
});
frontend.commands.file_based_embed_page = (function frontend$commands$file_based_embed_page(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{embed [[]]}}",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(4)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812),new cljs.core.Keyword(null,"embed","embed",-1354913349)], null)], null);
});
frontend.commands.file_based_embed_block = (function frontend$commands$file_based_embed_block(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{embed (())}}",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(4)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),new cljs.core.Keyword(null,"embed","embed",-1354913349)], null)], null);
});
frontend.commands.file_based_statuses = (function frontend$commands$file_based_statuses(){
var workflow = frontend.state.get_preferred_workflow();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"now","now",-1650525531),workflow)){
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["LATER","NOW","TODO","DOING","DONE","WAITING","CANCELED"], null);
} else {
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["TODO","DOING","LATER","NOW","DONE","WAITING","CANCELED"], null);
}
});
frontend.commands.db_based_statuses = (function frontend$commands$db_based_statuses(){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e);
}),frontend.handler.db_based.property.util.get_closed_property_values(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)));
});
frontend.commands.db_based_embed_page = (function frontend$commands$db_based_embed_page(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"[[]]",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812),new cljs.core.Keyword(null,"embed","embed",-1354913349)], null)], null);
});
frontend.commands.db_based_embed_block = (function frontend$commands$db_based_embed_block(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),new cljs.core.Keyword(null,"embed","embed",-1354913349)], null)], null);
});
frontend.commands.db_based_query = (function frontend$commands$db_based_query(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","run-query-command","editor/run-query-command",1913684864)], null)], null);
});
frontend.commands.file_based_query = (function frontend$commands$file_based_query(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),[logseq.common.util.macro.query_macro," }}"].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","exit","editor/exit",1661791497)], null)], null);
});
frontend.commands.query_steps = (function frontend$commands$query_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.commands.db_based_query();
} else {
return frontend.commands.file_based_query();
}
});
frontend.commands.calc_steps = (function frontend$commands$calc_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),new cljs.core.Keyword(null,"code","code",1586293142),"calc"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("codemirror","focus","codemirror/focus",-19393885)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"```calc\n\n```",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"block",new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(4)], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("codemirror","focus","codemirror/focus",-19393885)], null)], null);
}
});
frontend.commands.__GT_block = (function frontend$commands$__GT_block(var_args){
var G__102188 = arguments.length;
switch (G__102188) {
case 1:
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1 = (function (type){
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2(type,null);
}));

(frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2 = (function (type,optional){
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_block(),new cljs.core.Keyword("block","format","block/format",-1212045901));
var markdown_src_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(type),"src")));
var vec__102199 = ((markdown_src_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["```","\n```"], null):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__102186_SHARP_){
var G__102202 = p1__102186_SHARP_;
var G__102203 = clojure.string.upper_case(type);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__102202,G__102203) : frontend.util.format.call(null,G__102202,G__102203));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#+BEGIN_%s","\n#+END_%s"], null))
);
var left = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102199,(0),null);
var right = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102199,(1),null);
var template = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(left),(cljs.core.truth_(optional)?[" ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(optional)].join(''):""),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(right)].join('');
var backward_pos = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"src"))?((1) + cljs.core.count(right)):cljs.core.count(right));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),template,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"block",new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),backward_pos], null)], null)], null);
}));

(frontend.commands.__GT_block.cljs$lang$maxFixedArity = 2);

frontend.commands.advanced_query_steps = (function frontend$commands$advanced_query_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property","editor/set-property",1218381211),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property","editor/set-property",1218381211),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),""], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property-on-block-property","editor/set-property-on-block-property",-1549444895),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword(null,"code","code",1586293142)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property-on-block-property","editor/set-property-on-block-property",-1549444895),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),"clojure"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","exit","editor/exit",1661791497)], null)], null);
} else {
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("query");
}
});
frontend.commands.db_based_code_block = (function frontend$commands$db_based_code_block(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),new cljs.core.Keyword(null,"code","code",1586293142)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","exit","editor/exit",1661791497)], null)], null);
});
frontend.commands.file_based_code_block = (function frontend$commands$file_based_code_block(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"```\n```\n",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"block",new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(5),new cljs.core.Keyword(null,"only-breakline?","only-breakline?",-89332350),true], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","select-code-block-mode","editor/select-code-block-mode",1517387325)], null)], null);
});
frontend.commands.code_block_steps = (function frontend$commands$code_block_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.commands.db_based_code_block();
} else {
return frontend.commands.file_based_code_block();
}
});
frontend.commands.quote_block_steps = (function frontend$commands$quote_block_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property","editor/set-property",1218381211),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword(null,"quote","quote",-262615245)], null)], null);
} else {
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("quote");
}
});
frontend.commands.math_block_steps = (function frontend$commands$math_block_steps(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-property","editor/set-property",1218381211),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword(null,"math","math",-2026912803)], null)], null);
} else {
return frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2("export","latex");
}
});
frontend.commands.get_statuses = (function frontend$commands$get_statuses(){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var result = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (command){
var icon = ((db_based_QMARK_)?(function (){var G__102216 = command;
switch (G__102216) {
case "Canceled":
return "Cancelled";

break;
case "Doing":
return "InProgress50";

break;
default:
return command;

}
})():"square-asterisk");
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [command,frontend.commands.__GT_marker(command),["Set status to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(command)].join(''),icon], null);
}),((db_based_QMARK_)?frontend.commands.db_based_statuses():frontend.commands.file_based_statuses()));
if(cljs.core.seq(result)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(v,"TASK STATUS");
}),result);
} else {
return null;
}
});
frontend.commands.file_based_priorities = (function frontend$commands$file_based_priorities(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["A","B","C"], null);
});
frontend.commands.db_based_priorities = (function frontend$commands$db_based_priorities(){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e);
}),frontend.handler.db_based.property.util.get_closed_property_values(new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411)));
});
frontend.commands.get_priorities = (function frontend$commands$get_priorities(){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var with_no_priority = (function (p1__102219_SHARP_){
if(db_based_QMARK_){
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["No priority",frontend.commands.__GT_priority(null),"",new cljs.core.Keyword("icon","priorityLvlNone","icon/priorityLvlNone",85016980)], null),p1__102219_SHARP_);
} else {
return p1__102219_SHARP_;
}
});
var result = cljs.core.vec(with_no_priority(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
var command = item;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [command,frontend.commands.__GT_priority(item),["Set priority to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(item)].join(''),((db_based_QMARK_)?["priorityLvl",cljs.core.str.cljs$core$IFn$_invoke$arity$1(item)].join(''):["circle-letter-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(item))].join(''))], null);
}),((db_based_QMARK_)?frontend.commands.db_based_priorities():frontend.commands.file_based_priorities()))));
if(cljs.core.seq(result)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(v,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["PRIORITY"], null));
}),result);
} else {
return null;
}
});
frontend.commands.__GT_heading = (function frontend$commands$__GT_heading(heading){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),heading], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","move-cursor-to-end","editor/move-cursor-to-end",-95512412)], null)], null);
});
frontend.commands.headings = (function frontend$commands$headings(){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (level){
var heading = ["Heading ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(level)].join('');
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [heading,frontend.commands.__GT_heading(level),heading,["h-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(level)].join(''),"Heading"], null);
}),cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(7)));
});
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands._STAR_latest_matched_command !== 'undefined')){
} else {
frontend.commands._STAR_latest_matched_command = cljs.core.atom.cljs$core$IFn$_invoke$arity$1("");
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands._STAR_matched_commands !== 'undefined')){
} else {
frontend.commands._STAR_matched_commands = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands._STAR_initial_commands !== 'undefined')){
} else {
frontend.commands._STAR_initial_commands = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.commands.__GT_properties = (function frontend$commands$__GT_properties(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","insert-properties","editor/insert-properties",1146378886)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","move-cursor-to-properties","editor/move-cursor-to-properties",440955147)], null)], null);
});
frontend.commands.commands_map = (function frontend$commands$commands_map(get_page_ref_text){
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var embed_page = ((db_QMARK_)?frontend.commands.db_based_embed_page:frontend.commands.file_based_embed_page);
var embed_block = ((db_QMARK_)?frontend.commands.db_based_embed_block:frontend.commands.file_based_embed_block);
var G__102262 = cljs.core.first;
var G__102263 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [((db_QMARK_)?"Node reference":"Page reference"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),logseq.common.util.page_ref.left_and_right_brackets,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812)], null)], null),((db_QMARK_)?"Create a backlink to a node (a page or a block)":"Create a backlink to a BLOCK"),new cljs.core.Keyword("icon","pageRef","icon/pageRef",-802036133),"BASIC"], null),((db_QMARK_)?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Page embed",(embed_page.cljs$core$IFn$_invoke$arity$0 ? embed_page.cljs$core$IFn$_invoke$arity$0() : embed_page.call(null)),"Embed a page here",new cljs.core.Keyword("icon","pageEmbed","icon/pageEmbed",-993220149)], null)),((db_QMARK_)?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Block reference",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),logseq.common.util.block_ref.left_and_right_parens,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),new cljs.core.Keyword(null,"reference","reference",-1711695023)], null)], null),"Create a backlink to a block",new cljs.core.Keyword("icon","blockRef","icon/blockRef",-709914776)], null)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [((db_QMARK_)?"Node embed":"Block embed"),(embed_block.cljs$core$IFn$_invoke$arity$0 ? embed_block.cljs$core$IFn$_invoke$arity$0() : embed_block.call(null)),((db_QMARK_)?"Embed a node here":"Embed a block here"),new cljs.core.Keyword("icon","blockEmbed","icon/blockEmbed",-1814816409)], null)], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Link",frontend.commands.link_steps(),"Create a HTTP link",new cljs.core.Keyword("icon","link","icon/link",-1766065765),"FORMAT"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Image link",frontend.commands.image_link_steps(),"Create a HTTP link to a image",new cljs.core.Keyword("icon","photoLink","icon/photoLink",-160648838)], null),((frontend.state.markdown_QMARK_())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Underline",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"<ins></ins>",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(6)], null)], null)], null),"Create a underline text decoration",new cljs.core.Keyword("icon","underline","icon/underline",2019457688)], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Code block",frontend.commands.code_block_steps(),"Insert code block",new cljs.core.Keyword("icon","code","icon/code",-1648646899)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Quote",frontend.commands.quote_block_steps(),"Create a quote block",new cljs.core.Keyword("icon","quote","icon/quote",-232123732)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Math block",frontend.commands.math_block_steps(),"Create a latex block",new cljs.core.Keyword("icon","math","icon/math",-2029844378)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.commands.headings(),frontend.commands.get_statuses(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Deadline",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-deadline","editor/set-deadline",1866374622)], null)], null),"",new cljs.core.Keyword("icon","calendar-stats","icon/calendar-stats",-1758926548),"TASK DATE"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Scheduled",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-scheduled","editor/set-scheduled",258538081)], null)], null),"",new cljs.core.Keyword("icon","calendar-month","icon/calendar-month",1156988022),"TASK DATE"], null)], null),frontend.commands.get_priorities(),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Tomorrow",(function (){
var G__102268 = frontend.date.tomorrow();
return (get_page_ref_text.cljs$core$IFn$_invoke$arity$1 ? get_page_ref_text.cljs$core$IFn$_invoke$arity$1(G__102268) : get_page_ref_text.call(null,G__102268));
}),"Insert the date of tomorrow",new cljs.core.Keyword("icon","tomorrow","icon/tomorrow",-1507923540),"TIME & DATE"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Yesterday",(function (){
var G__102269 = frontend.date.yesterday();
return (get_page_ref_text.cljs$core$IFn$_invoke$arity$1 ? get_page_ref_text.cljs$core$IFn$_invoke$arity$1(G__102269) : get_page_ref_text.call(null,G__102269));
}),"Insert the date of yesterday",new cljs.core.Keyword("icon","yesterday","icon/yesterday",283428778)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Today",(function (){
var G__102270 = frontend.date.today();
return (get_page_ref_text.cljs$core$IFn$_invoke$arity$1 ? get_page_ref_text.cljs$core$IFn$_invoke$arity$1(G__102270) : get_page_ref_text.call(null,G__102270));
}),"Insert the date of today",new cljs.core.Keyword("icon","calendar","icon/calendar",63273881)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Current time",(function (){
return frontend.date.get_current_time();
}),"Insert current time",new cljs.core.Keyword("icon","clock","icon/clock",-897328958)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Date picker",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-date-picker","editor/show-date-picker",102681343)], null)], null),"Pick a date and insert here",new cljs.core.Keyword("icon","calendar-dots","icon/calendar-dots",1530819262)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Number list",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153)], null)], null),"Number list",new cljs.core.Keyword("icon","numberedParents","icon/numberedParents",598755614),"LIST TYPE"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Number children",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-children-number-list","editor/toggle-children-number-list",-1804483433)], null)], null),"Number children",new cljs.core.Keyword("icon","numberedChildren","icon/numberedChildren",-1490442552)], null)], null),((db_QMARK_)?null:(function (){var G__102271 = new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Src",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("src"),"Create a code block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Math block",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2("export","latex"),"Create a latex block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Note",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("note"),"Create a note block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Tip",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("tip"),"Create a tip block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Important",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("important"),"Create an important block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Caution",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("caution"),"Create a caution block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Pinned",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("pinned"),"Create a pinned block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Warning",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("warning"),"Create a warning block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Example",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("example"),"Create an example block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Export",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("export"),"Create an export block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Verse",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("verse"),"Create a verse block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Ascii",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$2("export","ascii"),"Create an ascii block"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Center",frontend.commands.__GT_block.cljs$core$IFn$_invoke$arity$1("center"),"Create a center block"], null)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0())){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__102271,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Properties",frontend.commands.__GT_properties()], null));
} else {
return G__102271;
}
})()),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Query",frontend.commands.query_steps(),frontend.commands.query_doc,new cljs.core.Keyword("icon","query","icon/query",-1285577663),"ADVANCED"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Advanced Query",frontend.commands.advanced_query_steps(),"Create an advanced query block",new cljs.core.Keyword("icon","query","icon/query",-1285577663)], null),((db_QMARK_)?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Zotero",frontend.commands.zotero_steps(),"Import Zotero journal article",new cljs.core.Keyword("icon","circle-letter-z","icon/circle-letter-z",1254287509)], null)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Query function",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{function }}",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null),"Create a query function",new cljs.core.Keyword("icon","queryCode","icon/queryCode",1624759220)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Calculator",frontend.commands.calc_steps(),"Insert a calculator",new cljs.core.Keyword("icon","calculator","icon/calculator",-1935595866)], null),((db_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Draw",(function (){
var file = frontend.handler.draw.file_name();
var path = [logseq.common.config.default_draw_directory,"/",file].join('');
var text = (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(path) : frontend.util.ref.__GT_page_ref.call(null,path));
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.draw.create_draw_with_default_content(path)),(function (_){
return promesa.protocols._promise(cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["draw file created, ",path], 0)));
}));
}));

return text;
}),"Draw a graph with Excalidraw"], null)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Upload an asset",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","click-hidden-file-input","editor/click-hidden-file-input",1637282337),new cljs.core.Keyword(null,"id","id",-1388402092)], null)], null),"Upload file types like image, pdf, docx, etc.)",new cljs.core.Keyword("icon","upload","icon/upload",-74481385)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Template",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),frontend.commands.command_trigger,null], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","search-template","editor/search-template",1915730318)], null)], null),"Insert a created template here",new cljs.core.Keyword("icon","template","icon/template",-731125421)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Embed HTML ",frontend.commands.__GT_inline("html"),"",new cljs.core.Keyword("icon","htmlEmbed","icon/htmlEmbed",1289450821)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Embed Video URL",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{video }}",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null),"",new cljs.core.Keyword("icon","videoEmbed","icon/videoEmbed",-2013616609)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Embed Youtube timestamp",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("youtube","insert-timestamp","youtube/insert-timestamp",-1631506319)], null)], null),"",new cljs.core.Keyword("icon","videoEmbed","icon/videoEmbed",-2013616609)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Embed Twitter tweet",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","input","editor/input",-288966104),"{{tweet }}",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),frontend.commands.command_trigger,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133),(2)], null)], null)], null),"",new cljs.core.Keyword("icon","xEmbed","icon/xEmbed",-912866835)], null),((db_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Add new property",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491)], null)], null),"",new cljs.core.Keyword("icon","cube-plus","icon/cube-plus",1921545377)], null):null)], null),(function (){var commands = (function (){var G__102272 = cljs.core.deref(frontend.commands._STAR_extend_slash_commands);
if(db_QMARK_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (command){
if(cljs.core.map_QMARK_(cljs.core.last(command))){
return new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876).cljs$core$IFn$_invoke$arity$1(cljs.core.last(command)) === false;
} else {
return null;
}
}),G__102272);
} else {
return G__102272;
}
})();
return commands;
})(),frontend.state.get_commands(),(function (){var temp__5804__auto__ = cljs.core.seq((function (){var G__102273 = frontend.state.get_plugins_slash_commands();
if((G__102273 == null)){
return null;
} else {
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__102254_SHARP_){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(p1__102254_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,new cljs.core.Keyword("icon","puzzle","icon/puzzle",-820666409)], null)));
}),G__102273);
}
})());
if(temp__5804__auto__){
var plugin_commands = temp__5804__auto__;
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.vec(plugin_commands),(0),(function (v){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(v,"PLUGINS");
}));
} else {
return null;
}
})()], 0)));
return (frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2(G__102262,G__102263) : frontend.util.distinct_by_last_wins.call(null,G__102262,G__102263));
});
frontend.commands.init_commands_BANG_ = (function frontend$commands$init_commands_BANG_(get_page_ref_text){
var commands = frontend.commands.commands_map(get_page_ref_text);
cljs.core.reset_BANG_(frontend.commands._STAR_latest_matched_command,"");

cljs.core.reset_BANG_(frontend.commands._STAR_initial_commands,commands);

return cljs.core.reset_BANG_(frontend.commands._STAR_matched_commands,commands);
});
frontend.commands.set_matched_commands_BANG_ = (function frontend$commands$set_matched_commands_BANG_(command,matched_commands){
cljs.core.reset_BANG_(frontend.commands._STAR_latest_matched_command,command);

return cljs.core.reset_BANG_(frontend.commands._STAR_matched_commands,matched_commands);
});
frontend.commands.reinit_matched_commands_BANG_ = (function frontend$commands$reinit_matched_commands_BANG_(){
return frontend.commands.set_matched_commands_BANG_("",cljs.core.deref(frontend.commands._STAR_initial_commands));
});
frontend.commands.restore_state = (function frontend$commands$restore_state(){
frontend.state.clear_editor_action_BANG_();

return frontend.commands.reinit_matched_commands_BANG_();
});
frontend.commands.insert_BANG_ = (function frontend$commands$insert_BANG_(id,value,p__102278){
var map__102279 = p__102278;
var map__102279__$1 = cljs.core.__destructure_map(map__102279);
var _option = map__102279__$1;
var last_pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189));
var postfix_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"postfix-fn","postfix-fn",-1393704144));
var backward_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133));
var end_pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"end-pattern","end-pattern",-963594078));
var backward_truncate_number = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"backward-truncate-number","backward-truncate-number",-2044126744));
var command = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"command","command",-894540724));
var only_breakline_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102279__$1,new cljs.core.Keyword(null,"only-breakline?","only-breakline?",-89332350));
var temp__5804__auto__ = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
var last_pattern__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_pattern,new cljs.core.Keyword(null,"skip-check","skip-check",-1698571130)))?null:(cljs.core.truth_(backward_truncate_number)?null:(function (){var or__5002__auto__ = last_pattern;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.commands.command_trigger;
}
})()));
var edit_content = frontend.commands.goog$module$goog$object.get(input,"value");
var current_pos = frontend.util.cursor.pos(input);
var current_pos__$1 = (function (){var or__5002__auto__ = (cljs.core.truth_((function (){var and__5000__auto__ = end_pattern;
if(cljs.core.truth_(and__5000__auto__)){
return typeof end_pattern === 'string';
} else {
return and__5000__auto__;
}
})())?(function (){var temp__5804__auto____$1 = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos),end_pattern);
if(cljs.core.truth_(temp__5804__auto____$1)){
var i = temp__5804__auto____$1;
return (current_pos + i);
} else {
return null;
}
})():null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return current_pos;
}
})();
var orig_prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos__$1);
var postfix = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos__$1);
var postfix__$1 = (cljs.core.truth_(postfix_fn)?(postfix_fn.cljs$core$IFn$_invoke$arity$1 ? postfix_fn.cljs$core$IFn$_invoke$arity$1(postfix) : postfix_fn.call(null,postfix)):postfix);
var space_QMARK_ = (function (){var space_QMARK_ = (cljs.core.truth_((function (){var and__5000__auto__ = last_pattern__$1;
if(cljs.core.truth_(and__5000__auto__)){
return orig_prefix;
} else {
return and__5000__auto__;
}
})())?(function (){var s = (function (){var temp__5804__auto____$1 = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(orig_prefix,last_pattern__$1);
if(cljs.core.truth_(temp__5804__auto____$1)){
var last_index = temp__5804__auto____$1;
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(orig_prefix,(0),last_index);
} else {
return null;
}
})();
return cljs.core.not((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),command);
if(and__5000__auto__){
var and__5000__auto____$1 = frontend.util.cjk_string_QMARK_(value);
if(cljs.core.truth_(and__5000__auto____$1)){
var or__5002__auto__ = frontend.util.cjk_string_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(orig_prefix)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.cjk_string_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(postfix__$1)));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.ends_with_QMARK_(s,"(")) && (((clojure.string.starts_with_QMARK_(last_pattern__$1,logseq.common.util.block_ref.left_parens)) || (clojure.string.starts_with_QMARK_(last_pattern__$1,logseq.common.util.page_ref.left_brackets)))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(s,"{{embed");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(s),"#")) && (clojure.string.starts_with_QMARK_(last_pattern__$1,"[[")));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var and__5000__auto__ = last_pattern__$1;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.ends_with_QMARK_(last_pattern__$1,logseq.graph_parser.property.colons)) || (clojure.string.starts_with_QMARK_(last_pattern__$1,logseq.graph_parser.property.colons)));
} else {
return and__5000__auto__;
}
}
}
}
}
})());
})():null);
if(cljs.core.truth_((function (){var and__5000__auto__ = space_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.starts_with_QMARK_(last_pattern__$1,"#[[")) || (clojure.string.starts_with_QMARK_(last_pattern__$1,"```")));
} else {
return and__5000__auto__;
}
})())){
return false;
} else {
return space_QMARK_;
}
})();
var prefix = (cljs.core.truth_((function (){var and__5000__auto__ = backward_truncate_number;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.integer_QMARK_(backward_truncate_number);
} else {
return and__5000__auto__;
}
})())?[logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(orig_prefix,(0),(((orig_prefix).length) - backward_truncate_number)),cljs.core.str.cljs$core$IFn$_invoke$arity$1((((backward_truncate_number === (0)))?null:value))].join(''):((clojure.string.blank_QMARK_(last_pattern__$1))?(cljs.core.truth_(space_QMARK_)?frontend.util.concat_without_spaces(orig_prefix,value):[orig_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('')):frontend.util.replace_last.cljs$core$IFn$_invoke$arity$4(last_pattern__$1,orig_prefix,value,space_QMARK_)
));
var postfix__$2 = (function (){var G__102287 = postfix__$1;
if(cljs.core.truth_((function (){var and__5000__auto__ = only_breakline_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = postfix__$1;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(postfix__$1,(0)),"\n");
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return clojure.string.replace_first(G__102287,"\n","");
} else {
return G__102287;
}
})();
var new_value = ((clojure.string.blank_QMARK_(postfix__$2))?prefix:(cljs.core.truth_(space_QMARK_)?frontend.util.concat_without_spaces(prefix,postfix__$2):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),cljs.core.str.cljs$core$IFn$_invoke$arity$1(postfix__$2)].join('')
));
var new_pos = (cljs.core.count(prefix) - (function (){var or__5002__auto__ = backward_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
if((((!(clojure.string.blank_QMARK_(value)))) && (clojure.string.blank_QMARK_(new_value)))){
return null;
} else {
frontend.state.set_block_content_and_last_pos_BANG_(id,new_value,new_pos);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);
}
} else {
return null;
}
});
frontend.commands.simple_insert_BANG_ = (function frontend$commands$simple_insert_BANG_(id,value,p__102311){
var map__102318 = p__102311;
var map__102318__$1 = cljs.core.__destructure_map(map__102318);
var _option = map__102318__$1;
var backward_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102318__$1,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133));
var forward_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102318__$1,new cljs.core.Keyword(null,"forward-pos","forward-pos",-1445897715));
var check_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102318__$1,new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015));
var input = goog.dom.getElement(id);
var edit_content = frontend.commands.goog$module$goog$object.get(input,"value");
var current_pos = frontend.util.cursor.pos(input);
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos);
var surfix = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos);
var new_value = [prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),surfix].join('');
var new_pos = (((((prefix).length) + cljs.core.count(value)) + (function (){var or__5002__auto__ = forward_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})()) - (function (){var or__5002__auto__ = backward_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_edit_input_id(),[prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join(''));

var scroll_container = frontend.util.nearest_scrollable_container(input);
var scroll_pos = scroll_container.scrollTop;
frontend.state.set_block_content_and_last_pos_BANG_(id,new_value,new_pos);

frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);

(scroll_container.scrollTop = scroll_pos);

if(cljs.core.truth_(check_fn)){
var G__102320 = new_value;
var G__102321 = (((prefix).length) - (1));
var G__102322 = new_pos;
return (check_fn.cljs$core$IFn$_invoke$arity$3 ? check_fn.cljs$core$IFn$_invoke$arity$3(G__102320,G__102321,G__102322) : check_fn.call(null,G__102320,G__102321,G__102322));
} else {
return null;
}
});
frontend.commands.simple_replace_BANG_ = (function frontend$commands$simple_replace_BANG_(id,value,selected,p__102324){
var map__102325 = p__102324;
var map__102325__$1 = cljs.core.__destructure_map(map__102325);
var _option = map__102325__$1;
var backward_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102325__$1,new cljs.core.Keyword(null,"backward-pos","backward-pos",1129767133));
var forward_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102325__$1,new cljs.core.Keyword(null,"forward-pos","forward-pos",-1445897715));
var check_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102325__$1,new cljs.core.Keyword(null,"check-fn","check-fn",-1710398015));
var selected_QMARK_ = (!(clojure.string.blank_QMARK_(selected)));
var input = goog.dom.getElement(id);
var edit_content = frontend.commands.goog$module$goog$object.get(input,"value");
if(cljs.core.truth_(edit_content)){
var current_pos = frontend.util.cursor.pos(input);
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos);
var postfix = ((selected_QMARK_)?clojure.string.replace_first(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos),selected,""):cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos));
var new_value = [prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),postfix].join('');
var new_pos = (((((prefix).length) + cljs.core.count(value)) + (function (){var or__5002__auto__ = forward_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})()) - (function (){var or__5002__auto__ = backward_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
frontend.state.set_block_content_and_last_pos_BANG_(id,new_value,new_pos);

frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);

if(selected_QMARK_){
input.setSelectionRange(new_pos,(new_pos + cljs.core.count(selected)));
} else {
}

if(cljs.core.truth_(check_fn)){
var G__102326 = new_value;
var G__102327 = (((prefix).length) - (1));
return (check_fn.cljs$core$IFn$_invoke$arity$2 ? check_fn.cljs$core$IFn$_invoke$arity$2(G__102326,G__102327) : check_fn.call(null,G__102326,G__102327));
} else {
return null;
}
} else {
return null;
}
});
frontend.commands.delete_pair_BANG_ = (function frontend$commands$delete_pair_BANG_(id){
var input = goog.dom.getElement(id);
var edit_content = frontend.commands.goog$module$goog$object.get(input,"value");
var current_pos = frontend.util.cursor.pos(input);
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),(current_pos - (1)));
var new_value = [prefix,cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,(current_pos + (1)))].join('');
var new_pos = ((prefix).length);
frontend.state.set_block_content_and_last_pos_BANG_(id,new_value,new_pos);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);
});
frontend.commands.delete_selection_BANG_ = (function frontend$commands$delete_selection_BANG_(id){
var input = goog.dom.getElement(id);
var edit_content = frontend.commands.goog$module$goog$object.get(input,"value");
var start = frontend.util.get_selection_start(input);
var end = frontend.util.get_selection_end(input);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(start,end)){
return null;
} else {
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),start);
var new_value = [prefix,cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,end)].join('');
var new_pos = ((prefix).length);
frontend.state.set_block_content_and_last_pos_BANG_(id,new_value,new_pos);

return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(input,new_pos);
}
});
frontend.commands.get_matched_commands = (function frontend$commands$get_matched_commands(var_args){
var G__102330 = arguments.length;
switch (G__102330) {
case 1:
return frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$1 = (function (text){
return frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$2(text,cljs.core.deref(frontend.commands._STAR_initial_commands));
}));

(frontend.commands.get_matched_commands.cljs$core$IFn$_invoke$arity$2 = (function (text,commands){
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(commands,text,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),cljs.core.first,new cljs.core.Keyword(null,"limit","limit",-1355822363),(50)) : frontend.search.fuzzy_search.call(null,commands,text,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),cljs.core.first,new cljs.core.Keyword(null,"limit","limit",-1355822363),(50)));
}));

(frontend.commands.get_matched_commands.cljs$lang$maxFixedArity = 2);

if((typeof frontend !== 'undefined') && (typeof frontend.commands !== 'undefined') && (typeof frontend.commands.handle_step !== 'undefined')){
} else {
frontend.commands.handle_step = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__102331 = cljs.core.get_global_hierarchy;
return (fexpr__102331.cljs$core$IFn$_invoke$arity$0 ? fexpr__102331.cljs$core$IFn$_invoke$arity$0() : fexpr__102331.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.commands","handle-step"),cljs.core.first,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","hook","editor/hook",-624147255),(function (p__102332,format){
var vec__102333 = p__102332;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102333,(0),null);
var event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102333,(1),null);
var map__102336 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102333,(2),null);
var map__102336__$1 = cljs.core.__destructure_map(map__102336);
var payload = map__102336__$1;
var pid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102336__$1,new cljs.core.Keyword(null,"pid","pid",1018387698));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102336__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719));
return frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$3(event,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([payload,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"format","format",-1306924766),format,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),(function (){var or__5002__auto__ = uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
}
})()], null)], 0)),pid);
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","input","editor/input",-288966104),(function (p__102337){
var vec__102338 = p__102337;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102338,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102338,(1),null);
var option = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102338,(2),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var type = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(option);
var input = goog.dom.getElement(input_id);
var beginning_of_line_QMARK_ = (function (){var or__5002__auto__ = frontend.util.cursor.beginning_of_line_QMARK_(input);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data())));
}
})();
var value__$1 = ((((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["properties",null,"block",null], null), null),type)) && ((!(beginning_of_line_QMARK_)))))?["\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join(''):value);
frontend.commands.insert_BANG_(input_id,value__$1,option);

return frontend.state.clear_editor_action_BANG_();
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","cursor-back","editor/cursor-back",1400854436),(function (p__102346){
var vec__102347 = p__102346;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102347,(0),null);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102347,(1),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(current_input,n);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","cursor-forward","editor/cursor-forward",1606531112),(function (p__102350){
var vec__102351 = p__102350;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102351,(0),null);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102351,(1),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
return frontend.util.cursor.move_cursor_forward.cljs$core$IFn$_invoke$arity$2(current_input,n);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","move-cursor-to-end","editor/move-cursor-to-end",-95512412),(function (p__102354){
var vec__102355 = p__102354;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102355,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
return frontend.util.cursor.move_cursor_to_end(current_input);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","restore-saved-cursor","editor/restore-saved-cursor",-296466323),(function (p__102358){
var vec__102359 = p__102358;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102359,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(current_input,frontend.state.get_editor_last_pos());
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","clear-current-slash","editor/clear-current-slash",-1115390941),(function (p__102365){
var vec__102366 = p__102365;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102366,(0),null);
var space_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102366,(1),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var edit_content = frontend.commands.goog$module$goog$object.get(current_input,"value");
var current_pos = frontend.util.cursor.pos(current_input);
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos);
var prefix__$1 = frontend.util.replace_last.cljs$core$IFn$_invoke$arity$4(frontend.commands.command_trigger,prefix,"",cljs.core.boolean$(space_QMARK_));
var new_value = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix__$1),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,current_pos)].join('');
return frontend.state.set_block_content_and_last_pos_BANG_(input_id,new_value,cljs.core.count(prefix__$1));
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.compute_pos_delta_when_change_marker = (function frontend$commands$compute_pos_delta_when_change_marker(edit_content,marker,pos){
var old_marker = (function (){var G__102369 = cljs.core.first((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_based.status.bare_marker_pattern,edit_content) : frontend.util.safe_re_find.call(null,frontend.handler.file_based.status.bare_marker_pattern,edit_content)));
if((G__102369 == null)){
return null;
} else {
return clojure.string.trim(G__102369);
}
})();
var pos_delta = (cljs.core.count(marker) - cljs.core.count(old_marker));
var pos_delta__$1 = ((clojure.string.blank_QMARK_(old_marker))?(pos_delta + (1)):((clojure.string.blank_QMARK_(marker))?(pos_delta - (1)):pos_delta
));
var x__5087__auto__ = (pos + pos_delta__$1);
var y__5088__auto__ = (0);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
});
frontend.commands.file_based_set_status = (function frontend$commands$file_based_set_status(marker,format){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var edit_content = frontend.commands.goog$module$goog$object.get(current_input,"value");
var slash_pos = new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pos","pos",-864607220).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data()));
var vec__102371 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/\*+\s/,/\n\*+\s/], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/#+\s/,/\n#+\s/], null));
var re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102371,(0),null);
var new_line_re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102371,(1),null);
var pos = (function (){var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),(slash_pos - (1)));
var temp__5802__auto__ = cljs.core.seq(frontend.util.re_pos(new_line_re_pattern,prefix));
if(temp__5802__auto__){
var matches = temp__5802__auto__;
var vec__102374 = cljs.core.last(matches);
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102374,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102374,(1),null);
return (start_pos + cljs.core.count(content));
} else {
return cljs.core.count((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(re_pattern,prefix) : frontend.util.safe_re_find.call(null,re_pattern,prefix)));
}
})();
var new_value = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),pos),clojure.string.replace_first(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(edit_content,pos),(frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1(format) : frontend.handler.file_based.status.marker_pattern.call(null,format)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker)," "].join(''))].join('');
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_value);

var new_pos = frontend.commands.compute_pos_delta_when_change_marker(edit_content,marker,(slash_pos - (1)));
return setTimeout((function (){
return frontend.util.cursor.move_cursor_to.cljs$core$IFn$_invoke$arity$2(current_input,new_pos);
}),(10));
} else {
return null;
}
} else {
return null;
}
});
frontend.commands.db_based_set_status = (function frontend$commands$db_based_set_status(status){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.handler.db_based.property.batch_set_property_closed_value_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),status);
} else {
return null;
}
});
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-status","editor/set-status",-1514172914),(function (p__102377,format){
var vec__102378 = p__102377;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102378,(0),null);
var status = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102378,(1),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.commands.db_based_set_status(status);
} else {
return frontend.commands.file_based_set_status(status,format);
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-property","editor/set-property",1218381211),(function (p__102381){
var vec__102382 = p__102381;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102382,(0),null);
var property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102382,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102382,(2),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id,value);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-property-on-block-property","editor/set-property-on-block-property",-1549444895),(function (p__102386){
var vec__102388 = p__102386;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102388,(0),null);
var block_property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102388,(1),null);
var property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102388,(2),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102388,(3),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
var updated_block = (function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
var G__102392 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102392) : frontend.db.entity.call(null,G__102392));
} else {
return null;
}
})();
var block_property_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(updated_block,block_property_id);
if(cljs.core.truth_(block_property_value)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_property_value),property_id,value);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),(function (p__102393){
var vec__102394 = p__102393;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102394,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102394,(1),null);
var lang = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102394,(2),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","upsert-type-block","editor/upsert-type-block",-1673621559),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"lang","lang",-1819677104),lang], null)], null));
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.file_based_set_priority = (function frontend$commands$file_based_set_priority(priority){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var format = (function (){var or__5002__auto__ = (function (){var G__102397 = frontend.state.get_current_page();
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__102397) : frontend.db.get_page_format.call(null,G__102397));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
var edit_content = frontend.commands.goog$module$goog$object.get(current_input,"value");
var new_priority = (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("[#%s]",priority) : frontend.util.format.call(null,"[#%s]",priority));
var new_value = clojure.string.trim(frontend.util.file_based.priority.add_or_update_priority(edit_content,format,new_priority));
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_value);
} else {
return null;
}
} else {
return null;
}
});
frontend.commands.db_based_set_priority = (function frontend$commands$db_based_set_priority(priority){
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if((priority == null)){
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411));
} else {
return frontend.handler.db_based.property.batch_set_property_closed_value_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null),new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411),priority);
}
} else {
return null;
}
});
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-priority","editor/set-priority",1313333042),(function (p__102399,_format){
var vec__102400 = p__102399;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102400,(0),null);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102400,(1),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.commands.db_based_set_priority(priority);
} else {
return frontend.commands.file_based_set_priority(priority);
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-scheduled","editor/set-scheduled",258538081),(function (p__102403){
var vec__102404 = p__102403;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102404,(0),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property-key","property-key",972402246),"Scheduled"], null)], null));
} else {
return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-date-picker","editor/show-date-picker",102681343),new cljs.core.Keyword(null,"scheduled","scheduled",553898551)], null));
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-deadline","editor/set-deadline",1866374622),(function (p__102407){
var vec__102408 = p__102407;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102408,(0),null);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property-key","property-key",972402246),"Deadline"], null)], null));
} else {
return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","show-date-picker","editor/show-date-picker",102681343),new cljs.core.Keyword(null,"deadline","deadline",628964572)], null));
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","run-query-command","editor/run-query-command",1913684864),(function (p__102411){
var vec__102412 = p__102411;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102412,(0),null);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","run-query-command","editor/run-query-command",1913684864)], null));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","insert-properties","editor/insert-properties",1146378886),(function (p__102415,_format){
var vec__102416 = p__102415;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102416,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102416,(1),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var format = (function (){var or__5002__auto__ = (function (){var G__102419 = frontend.state.get_current_page();
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__102419) : frontend.db.get_page_format.call(null,G__102419));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
var edit_content = frontend.commands.goog$module$goog$object.get(current_input,"value");
var new_value = frontend.handler.file_based.property.insert_property(format,edit_content,"","");
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_value);
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","move-cursor-to-properties","editor/move-cursor-to-properties",440955147),(function (p__102420){
var vec__102421 = p__102420;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102421,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var format = (function (){var or__5002__auto__ = (function (){var G__102424 = frontend.state.get_current_page();
return (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(G__102424) : frontend.db.get_page_format.call(null,G__102424));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
}
})();
(frontend.handler.property.file.goto_properties_end_when_file_based.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.property.file.goto_properties_end_when_file_based.cljs$core$IFn$_invoke$arity$2(format,current_input) : frontend.handler.property.file.goto_properties_end_when_file_based.call(null,format,current_input));

return frontend.util.cursor.move_cursor_backward.cljs$core$IFn$_invoke$arity$2(current_input,(3));
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.file_based_set_markdown_heading = (function frontend$commands$file_based_set_markdown_heading(content,heading){
var heading_str = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(heading,"#"));
if(cljs.core.truth_((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(logseq.common.util.markdown_heading_pattern,content) : frontend.util.safe_re_find.call(null,logseq.common.util.markdown_heading_pattern,content)))){
return logseq.common.util.clear_markdown_heading(content);
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(heading_str)," ",clojure.string.triml(content)].join('');
}
});
frontend.commands.clear_markdown_heading = logseq.common.util.clear_markdown_heading;
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),(function (p__102425){
var vec__102426 = p__102425;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102426,(0),null);
var heading = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102426,(1),null);
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var current_input = temp__5804__auto____$1;
var current_block = frontend.state.get_edit_block();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(current_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),current_block,heading], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089))){
var edit_content = frontend.commands.goog$module$goog$object.get(current_input,"value");
var new_content = frontend.commands.file_based_set_markdown_heading(edit_content,heading);
return frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input_id,new_content);
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","set-heading","editor/set-heading",-2004750659),current_block,heading], null));
}
}
} else {
return null;
}
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","search-page","editor/search-page",-1746049812),(function (_){
return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"page-search","page-search",1842925280));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","search-page-hashtag","editor/search-page-hashtag",2082188401),(function (p__102429){
var vec__102430 = p__102429;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102430,(0),null);
return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","search-block","editor/search-block",1664588652),(function (p__102433){
var vec__102434 = p__102433;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102434,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102434,(1),null);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"embed","embed",-1354913349))) && (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))){
cljs.core.reset_BANG_(frontend.commands._STAR_current_command,"Block embed");

frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(frontend.state.get_input())], null));
} else {
}

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"block-search","block-search",-897517253));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","search-template","editor/search-template",1915730318),(function (p__102437){
var vec__102438 = p__102437;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102438,(0),null);
return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"template-search","template-search",-1861932888));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","show-input","editor/show-input",-502568241),(function (p__102441){
var vec__102442 = p__102441;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102442,(0),null);
var option = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102442,(1),null);
return frontend.state.set_editor_show_input_BANG_(option);
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","show-zotero","editor/show-zotero",-1834250749),(function (p__102446){
var vec__102447 = p__102446;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102447,(0),null);
return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"zotero","zotero",878834781));
}));
frontend.commands.insert_youtube_timestamp = (function frontend$commands$insert_youtube_timestamp(){
var input_id = frontend.state.get_edit_input_id();
var macro = frontend.extensions.video.youtube.gen_youtube_ts_macro();
var temp__5804__auto__ = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
if(cljs.core.truth_(macro)){
return frontend.util.insert_at_current_position_BANG_(input,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(macro)," "].join(''));
} else {
return null;
}
} else {
return null;
}
});
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("youtube","insert-timestamp","youtube/insert-timestamp",-1631506319),(function (p__102452){
var vec__102453 = p__102452;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102453,(0),null);
var input_id = frontend.state.get_edit_input_id();
var macro = frontend.extensions.video.youtube.gen_youtube_ts_macro();
return frontend.commands.insert_BANG_(input_id,macro,cljs.core.PersistentArrayMap.EMPTY);
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-children-number-list","editor/toggle-children-number-list",-1804483433),(function (p__102456){
var vec__102457 = p__102456;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102457,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-children-number-list","editor/toggle-children-number-list",-1804483433),block], null));
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),(function (p__102462){
var vec__102463 = p__102462;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102463,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","toggle-own-number-list","editor/toggle-own-number-list",835416153),block], null));
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","remove-own-number-list","editor/remove-own-number-list",-492965226),(function (p__102466){
var vec__102467 = p__102466;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102467,(0),null);
var temp__5804__auto__ = frontend.state.get_edit_block();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","remove-own-number-list","editor/remove-own-number-list",-492965226),block], null));
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","show-date-picker","editor/show-date-picker",102681343),(function (p__102470){
var vec__102471 = p__102470;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102471,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102471,(1),null);
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"scheduled","scheduled",553898551),null,new cljs.core.Keyword(null,"deadline","deadline",628964572),null], null), null),type)) && (clojure.string.blank_QMARK_(frontend.commands.goog$module$goog$object.get(frontend.state.get_input(),"value"))))){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Please add some content first."], null),new cljs.core.Keyword(null,"warning","warning",-1685650671));

return frontend.commands.restore_state();
} else {
frontend.state.set_timestamp_block_BANG_(null);

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"datepicker","datepicker",821741450));
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","select-code-block-mode","editor/select-code-block-mode",1517387325),(function (p__102474){
var vec__102475 = p__102474;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102475,(0),null);
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((50)),(function (){
var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input)], null));

return frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"select-code-block-mode","select-code-block-mode",1751512020));
} else {
return null;
}
}));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","click-hidden-file-input","editor/click-hidden-file-input",1637282337),(function (p__102478){
var vec__102479 = p__102478;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102479,(0),null);
var _input_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102479,(1),null);
var temp__5804__auto__ = goog.dom.getElement("upload-file");
if(cljs.core.truth_(temp__5804__auto__)){
var input_file = temp__5804__auto__;
return input_file.click();
} else {
return null;
}
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","exit","editor/exit",1661791497),(function (p__102483){
var vec__102484 = p__102483;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102484,(0),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","save-current-block","editor/save-current-block",1864275336)], null))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.clear_edit_BANG_());
}));
}));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),(function (p__102493){
var vec__102494 = p__102493;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102494,(0),null);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491)], null));
}));
frontend.commands.handle_step.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (p__102497){
var vec__102498 = p__102497;
var seq__102499 = cljs.core.seq(vec__102498);
var first__102500 = cljs.core.first(seq__102499);
var seq__102499__$1 = cljs.core.next(seq__102499);
var type = first__102500;
var _args = seq__102499__$1;
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["No handler for step: ",type], 0));
}));
frontend.commands.handle_steps = (function frontend$commands$handle_steps(vector_SINGLEQUOTE_,format){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return promesa.core.run_BANG_.cljs$core$IFn$_invoke$arity$2((function (step){
return promesa.protocols._promise(frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$2(step,format));
}),vector_SINGLEQUOTE_);
} else {
var seq__102501 = cljs.core.seq(vector_SINGLEQUOTE_);
var chunk__102502 = null;
var count__102503 = (0);
var i__102504 = (0);
while(true){
if((i__102504 < count__102503)){
var step = chunk__102502.cljs$core$IIndexed$_nth$arity$2(null,i__102504);
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$2(step,format);


var G__102559 = seq__102501;
var G__102560 = chunk__102502;
var G__102561 = count__102503;
var G__102562 = (i__102504 + (1));
seq__102501 = G__102559;
chunk__102502 = G__102560;
count__102503 = G__102561;
i__102504 = G__102562;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__102501);
if(temp__5804__auto__){
var seq__102501__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__102501__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102501__$1);
var G__102563 = cljs.core.chunk_rest(seq__102501__$1);
var G__102564 = c__5525__auto__;
var G__102565 = cljs.core.count(c__5525__auto__);
var G__102566 = (0);
seq__102501 = G__102563;
chunk__102502 = G__102564;
count__102503 = G__102565;
i__102504 = G__102566;
continue;
} else {
var step = cljs.core.first(seq__102501__$1);
frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$2(step,format);


var G__102567 = cljs.core.next(seq__102501__$1);
var G__102568 = null;
var G__102569 = (0);
var G__102570 = (0);
seq__102501 = G__102567;
chunk__102502 = G__102568;
count__102503 = G__102569;
i__102504 = G__102570;
continue;
}
} else {
return null;
}
}
break;
}
}
});
frontend.commands.exec_plugin_simple_command_BANG_ = (function frontend$commands$exec_plugin_simple_command_BANG_(pid,p__102508,action){
var map__102509 = p__102508;
var map__102509__$1 = cljs.core.__destructure_map(map__102509);
var cmd = map__102509__$1;
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102509__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var format = (function (){var and__5000__auto__ = block_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3((function (){var G__102511 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102511) : frontend.db.entity.call(null,G__102511));
})(),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
} else {
return and__5000__auto__;
}
})();
var inputs = (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[cljs.core.conj.cljs$core$IFn$_invoke$arity$2(action,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"pid","pid",1018387698),pid))],null));
return frontend.commands.handle_steps(inputs,format);
});

//# sourceMappingURL=frontend.commands.js.map
