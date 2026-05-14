goog.provide('frontend.util.text');
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.text !== 'undefined') && (typeof frontend.util.text.between_re !== 'undefined')){
} else {
frontend.util.text.between_re = /\(between ([^\)]+)\)/;
}
frontend.util.text.bilibili_regex = /^((?:https?:)?\/\/)?((?:www).)?((?:bilibili.com))(\/(?:video\/)?)([\w-]+)(\?p=(\d+))?(\S+)?$/;
frontend.util.text.loom_regex = /^((?:https?:)?\/\/)?((?:www).)?((?:loom.com))(\/(?:share\/|embed\/))([\w-]+)(\S+)?$/;
frontend.util.text.vimeo_regex = /^((?:https?:)?\/\/)?((?:www).)?((?:player.vimeo.com|vimeo.com))(\/(?:video\/)?)([\w-]+)(\S+)?$/;
frontend.util.text.youtube_regex = /^((?:https?:)?\/\/)?((?:www|m).)?((?:youtube.com|youtu.be|y2u.be|youtube-nocookie.com))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)([\S^\?]+)?$/;
frontend.util.text.get_matched_video = (function frontend$util$text$get_matched_video(url){
if(cljs.core.truth_(cljs.core.not_empty(url))){
var or__5002__auto__ = cljs.core.re_find(frontend.util.text.youtube_regex,url);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.re_find(frontend.util.text.loom_regex,url);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = cljs.core.re_find(frontend.util.text.vimeo_regex,url);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return cljs.core.re_find(frontend.util.text.bilibili_regex,url);
}
}
}
} else {
return null;
}
});
frontend.util.text.build_data_value = (function frontend$util$text$build_data_value(col){
var items = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
return ["\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(item),"\""].join('');
}),col);
return goog.string.format("[%s]",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",items));
});
frontend.util.text.media_link_QMARK_ = (function frontend$util$text$media_link_QMARK_(media_formats,s){
return cljs.core.some((function (fmt){
var G__60184 = cljs.core.re_pattern(["(?i)\\.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fmt),"(?:\\?([^#]*))?(?:#(.*))?$"].join(''));
var G__60185 = s;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__60184,G__60185) : frontend.util.safe_re_find.call(null,G__60184,G__60185));
}),media_formats);
});
frontend.util.text.add_timestamp = (function frontend$util$text$add_timestamp(content,key,value){
var new_line = [clojure.string.upper_case(key),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('');
var lines = clojure.string.split_lines(content);
var new_lines = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (line){
return clojure.string.trim(((clojure.string.starts_with_QMARK_(clojure.string.lower_case(line),key))?new_line:line));
}),lines);
var new_lines__$1 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,lines),new_lines))?new_lines:cljs.core.cons(cljs.core.first(new_lines),cljs.core.cons(new_line,cljs.core.rest(new_lines))));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",new_lines__$1);
});
frontend.util.text.remove_timestamp = (function frontend$util$text$remove_timestamp(content,key){
var lines = clojure.string.split_lines(content);
var new_lines = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (line){
return (!(clojure.string.starts_with_QMARK_(clojure.string.lower_case(line),key)));
}),lines);
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",new_lines);
});
frontend.util.text.get_current_line_by_pos = (function frontend$util$text$get_current_line_by_pos(s,pos){
var lines = clojure.string.split_lines(s);
var result = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,line){
var new_pos = (acc + cljs.core.count(line));
if((new_pos >= pos)){
return cljs.core.reduced(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"start-pos","start-pos",668789086),acc], null));
} else {
return (new_pos + (1));
}
}),(0),lines);
if(cljs.core.map_QMARK_(result)){
return result;
} else {
return null;
}
});
/**
 * `pos` must be surrounded by `before` and `end` in string `value`, e.g. ((|))
 */
frontend.util.text.surround_by_QMARK_ = (function frontend$util$text$surround_by_QMARK_(value,pos,before,end){
var start_pos = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),before))?(0):(pos - cljs.core.count(before)));
var end_pos = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end","end",-268185958),end))?cljs.core.count(value):(pos + cljs.core.count(end)));
if((cljs.core.count(value) >= end_pos)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end","end",-268185958),end)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),before))))?"":((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end","end",-268185958),end))?before:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),before))?end:[cljs.core.str.cljs$core$IFn$_invoke$arity$1(before),cljs.core.str.cljs$core$IFn$_invoke$arity$1(end)].join('')
))),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,start_pos,end_pos));
} else {
return null;
}
});
/**
 * Get all indexes of `value` in the string `s`.
 */
frontend.util.text.get_string_all_indexes = (function frontend$util$text$get_string_all_indexes(s,value,p__60188){
var map__60189 = p__60188;
var map__60189__$1 = cljs.core.__destructure_map(map__60189);
var before_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60189__$1,new cljs.core.Keyword(null,"before?","before?",765621039),true);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"")){
if(cljs.core.truth_(before_QMARK_)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.count(s)], null);
}
} else {
var acc = cljs.core.PersistentVector.EMPTY;
var i = (0);
while(true){
var temp__5802__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(s,value,i);
if(cljs.core.truth_(temp__5802__auto__)){
var i__$1 = temp__5802__auto__;
var G__60201 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,i__$1);
var G__60202 = (i__$1 + cljs.core.count(value));
acc = G__60201;
i = G__60202;
continue;
} else {
return acc;
}
break;
}
}
});
/**
 * `pos` must be wrapped by `before` and `end` in string `value`, e.g. ((a|b))
 */
frontend.util.text.wrapped_by_QMARK_ = (function frontend$util$text$wrapped_by_QMARK_(value,pos,before,end){
var before_matches = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (i){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(i + (cljs.core.count(before) - 0.5)),new cljs.core.Keyword(null,"before","before",-1633692388)], null);
}),frontend.util.text.get_string_all_indexes(value,before,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"before?","before?",765621039),true], null)));
var end_matches = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (i){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(i + 0.5),new cljs.core.Keyword(null,"end","end",-268185958)], null);
}),frontend.util.text.get_string_all_indexes(value,end,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"before?","before?",765621039),false], null)));
var indexes = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(before_matches,end_matches,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [pos,new cljs.core.Keyword(null,"between","between",1131099276)], null)], null)], 0)));
var ks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,indexes);
var q = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"before","before",-1633692388),new cljs.core.Keyword(null,"between","between",1131099276),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,k){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(q,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,k))){
return cljs.core.reduced(true);
} else {
return cljs.core.vec(cljs.core.take_last((2),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,k)));
}
}),cljs.core.PersistentVector.EMPTY,ks) === true;
});
/**
 * Cut string by specified wrapping symbols, only match the first occurrence.
 *   value - string to cut
 *   before - cutting symbol (before)
 *   end - cutting symbol (end)
 */
frontend.util.text.cut_by = (function frontend$util$text$cut_by(value,before,end){
var b_pos = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(value,before);
var b_len = cljs.core.count(before);
if(cljs.core.truth_(b_pos)){
var b_cut = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(value,(0),b_pos);
var m_cut = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(value,(b_pos + b_len));
var e_len = cljs.core.count(end);
var e_pos = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(m_cut,end);
if(cljs.core.truth_(e_pos)){
var e_cut = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(m_cut,(e_pos + e_len));
var m_cut__$1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(m_cut,(0),e_pos);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_cut,m_cut__$1,e_cut], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_cut,m_cut,null], null);
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [value,null,null], null);
}
});
/**
 * Get `Dir/GraphName` style name for from repo-url.
 * 
 * On iOS, repo-url might be nil
 */
frontend.util.text.get_graph_name_from_path = (function frontend$util$text$get_graph_name_from_path(repo_url){
if(cljs.core.truth_(cljs.core.not_empty(repo_url))){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo_url)){
return clojure.string.replace_first(repo_url,frontend.config.db_version_prefix,"");
} else {
var path = frontend.config.get_local_dir(repo_url);
var path__$1 = ((logseq.common.path.is_file_url_QMARK_(path))?logseq.common.path.url_to_path(path):path);
var parts = cljs.core.take_last((2),clojure.string.split.cljs$core$IFn$_invoke$arity$2(path__$1,/\//));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts),"0")){
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(parts) : frontend.util.string_join_path.call(null,parts));
} else {
return cljs.core.last(parts);
}
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.util.text.js.map
