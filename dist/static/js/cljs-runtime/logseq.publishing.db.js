goog.provide('logseq.publishing.db');
/**
 * Returns asset url for an area block used by pdf assets. This lives in this ns
 *   because it is used by this dep and needs to be independent from the frontend app
 */
logseq.publishing.db.get_area_block_asset_url = (function logseq$publishing$db$get_area_block_asset_url(db,block,page){
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
var temp__5808__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if((temp__5808__auto__ == null)){
return null;
} else {
var uuid_SINGLEQUOTE_ = temp__5808__auto__;
if(cljs.core.truth_(db_based_QMARK_)){
var temp__5804__auto__ = new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var image = temp__5804__auto__;
return ["./assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(image)),".png"].join('');
} else {
return null;
}
} else {
var props = (function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = page;
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var prop_lookup_fn = (function (p1__159151_SHARP_,p2__159152_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(p1__159151_SHARP_,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.name(p2__159152_SHARP_)));
});
var temp__5808__auto____$1 = new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513).cljs$core$IFn$_invoke$arity$1(props);
if((temp__5808__auto____$1 == null)){
return null;
} else {
var stamp = temp__5808__auto____$1;
var group_key = clojure.string.replace_first(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page),/^hls__/,"");
var hl_page = prop_lookup_fn(props,new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596));
var encoded_chars_QMARK_ = cljs.core.boolean$(cljs.core.re_find(/%[0-9a-f]{2}/i,group_key));
var group_key__$1 = ((encoded_chars_QMARK_)?encodeURI(group_key):group_key);
return ["./assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(group_key__$1),"/",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(hl_page),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid_SINGLEQUOTE_),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(stamp),".png"].join('')].join('');
}
}
}
});
logseq.publishing.db.clean_asset_path_prefix = (function logseq$publishing$db$clean_asset_path_prefix(path){
if(typeof path === 'string'){
return clojure.string.replace_first(path,/^[.\\/\\]*(assets)[\\/\\]+/,"");
} else {
return null;
}
});
logseq.publishing.db.get_public_pages = (function logseq$publishing$db$get_public_pages(db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159180 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?properties","?properties",582639966,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?properties","?properties",582639966,null),new cljs.core.Keyword(null,"public","public",1566243851)),new cljs.core.Symbol(null,"?pub","?pub",-221826138,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"=","=",-1501502141,null),true,new cljs.core.Symbol(null,"?pub","?pub",-221826138,null))], null)], null);
var G__159181 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__159180,G__159181) : datascript.core.q.call(null,G__159180,G__159181));
})());
});
/**
 * Returns public pages and anything they are directly related to: their tags,
 *   their properties and any property values that are pages.  Anything on the
 *   related pages are _not_ included e.g. properties on tag or property pages
 */
logseq.publishing.db.get_db_public_pages = (function logseq$publishing$db$get_db_public_pages(db){
var pages = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159201 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"property","property",526253295,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939),true),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
var G__159202 = db;
var G__159203 = logseq.db.frontend.rules.extract_rules(logseq.db.frontend.rules.db_query_dsl_rules,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"property","property",-1114278232)], null));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__159201,G__159202,G__159203) : datascript.core.q.call(null,G__159201,G__159202,G__159203));
})()));
var page_ents = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__159185_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__159185_SHARP_) : datascript.core.entity.call(null,db,p1__159185_SHARP_));
}),pages);
var tag_pages_STAR_ = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__159186_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(p1__159186_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_ents], 0));
var tag_pages = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tag_pages_STAR_,((cljs.core.seq(tag_pages_STAR_))?(function (){var G__159205 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","tags","block/tags",1814948340)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","tags","block/tags",1814948340)));
var G__159205__$1 = (((G__159205 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__159205));
if((G__159205__$1 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[G__159205__$1],null));
}
})():null));
var property_pages = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (ent){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__159190_SHARP_){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__159190_SHARP_) : datascript.core.entity.call(null,db,p1__159190_SHARP_)));
}),cljs.core.keys(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(ent)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_ents], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(pages,tag_pages,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([property_pages], 0));
});
logseq.publishing.db.get_db_public_false_pages = (function logseq$publishing$db$get_db_public_false_pages(db){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159209 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"property","property",526253295,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
var G__159210 = db;
var G__159211 = logseq.db.frontend.rules.extract_rules(logseq.db.frontend.rules.db_query_dsl_rules,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"property","property",-1114278232)], null));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__159209,G__159210,G__159211) : datascript.core.q.call(null,G__159209,G__159210,G__159211));
})()));
});
logseq.publishing.db.get_public_false_pages = (function logseq$publishing$db$get_public_false_pages(db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159212 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?properties","?properties",582639966,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?properties","?properties",582639966,null),new cljs.core.Keyword(null,"public","public",1566243851)),new cljs.core.Symbol(null,"?pub","?pub",-221826138,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"=","=",-1501502141,null),false,new cljs.core.Symbol(null,"?pub","?pub",-221826138,null))], null)], null);
var G__159213 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__159212,G__159213) : datascript.core.q.call(null,G__159212,G__159213));
})());
});
logseq.publishing.db.get_public_false_block_ids = (function logseq$publishing$db$get_public_false_block_ids(db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159214 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?properties","?properties",582639966,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?properties","?properties",582639966,null),new cljs.core.Keyword(null,"public","public",1566243851)),new cljs.core.Symbol(null,"?pub","?pub",-221826138,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"=","=",-1501502141,null),false,new cljs.core.Symbol(null,"?pub","?pub",-221826138,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null)], null);
var G__159215 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__159214,G__159215) : datascript.core.q.call(null,G__159214,G__159215));
})());
});
logseq.publishing.db.hl_type_area_fn = (function logseq$publishing$db$hl_type_area_fn(db){
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
return (function (datom){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)),new cljs.core.Keyword(null,"area","area",472007256))));
});
} else {
return (function (datom){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"hl-type","hl-type",992471876))),new cljs.core.Keyword(null,"area","area",472007256))));
});
}
});
logseq.publishing.db.get_file_assets = (function logseq$publishing$db$get_file_assets(db,datoms){
var pull = (function (eid,db__$1){
var G__159218 = db__$1;
var G__159219 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__159220 = eid;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__159218,G__159219,G__159220) : datascript.core.pull.call(null,G__159218,G__159219,G__159220));
});
var get_page_by_eid = cljs.core.memoize((function (p1__159216_SHARP_){
var G__159221 = pull(p1__159216_SHARP_,db);
var G__159221__$1 = (((G__159221 == null))?null:new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(G__159221));
var G__159221__$2 = (((G__159221__$1 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__159221__$1));
if((G__159221__$2 == null)){
return null;
} else {
return pull(G__159221__$2,db);
}
}));
var hl_type_area_QMARK_ = logseq.publishing.db.hl_type_area_fn(db);
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.flatten(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datom){
var G__159222 = cljs.core.PersistentVector.EMPTY;
var G__159222__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom)))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__159222,(function (){var matched = cljs.core.re_seq(/\([.\/]*\/assets\/([^)]+)\)/,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom));
if(cljs.core.seq(matched)){
var iter__5480__auto__ = (function logseq$publishing$db$get_file_assets_$_iter__159223(s__159224){
return (new cljs.core.LazySeq(null,(function (){
var s__159224__$1 = s__159224;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__159224__$1);
if(temp__5804__auto__){
var s__159224__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__159224__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__159224__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__159226 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__159225 = (0);
while(true){
if((i__159225 < size__5479__auto__)){
var vec__159227 = cljs.core._nth(c__5478__auto__,i__159225);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__159227,(0),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__159227,(1),null);
cljs.core.chunk_append(b__159226,((((typeof path === 'string') && ((!(clojure.string.ends_with_QMARK_(path,".js"))))))?path:null));

var G__159300 = (i__159225 + (1));
i__159225 = G__159300;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__159226),logseq$publishing$db$get_file_assets_$_iter__159223(cljs.core.chunk_rest(s__159224__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__159226),null);
}
} else {
var vec__159230 = cljs.core.first(s__159224__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__159230,(0),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__159230,(1),null);
return cljs.core.cons(((((typeof path === 'string') && ((!(clojure.string.ends_with_QMARK_(path,".js"))))))?path:null),logseq$publishing$db$get_file_assets_$_iter__159223(cljs.core.rest(s__159224__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(matched);
} else {
return null;
}
})()):G__159222);
if(cljs.core.truth_(hl_type_area_QMARK_(datom))){
return (function (p1__159217_SHARP_){
var path = (function (){var G__159233 = pull(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),db);
if((G__159233 == null)){
return null;
} else {
return logseq.publishing.db.get_area_block_asset_url(G__159233,db,get_page_by_eid(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom)));
}
})();
var path__$1 = logseq.publishing.db.clean_asset_path_prefix(path);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__159217_SHARP_,path__$1);
})(G__159222__$1);
} else {
return G__159222__$1;
}
}),datoms)));
});
logseq.publishing.db.get_aliases_for_page_ids = (function logseq$publishing$db$get_aliases_for_page_ids(db,page_ids){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159234 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?e","?e",-1194391683,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?pages","?pages",1767840716,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"contains?","contains?",-1676812576,null),new cljs.core.Symbol(null,"?pages","?pages",1767840716,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null))], null),cljs.core.list(new cljs.core.Symbol(null,"alias","alias",-399220103,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Symbol(null,"?e","?e",-1194391683,null))], null);
var G__159235 = db;
var G__159236 = cljs.core.set(page_ids);
var G__159237 = new cljs.core.Keyword(null,"alias","alias",-2039751630).cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.rules.rules);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__159234,G__159235,G__159236,G__159237) : datascript.core.q.call(null,G__159234,G__159235,G__159236,G__159237));
})()));
});
logseq.publishing.db.get_db_assets = (function logseq$publishing$db$get_db_assets(db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__159238_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__159238_SHARP_)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(p1__159238_SHARP_))].join('');
}),(function (){var G__159239 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)], null)], null);
var G__159240 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__159239,G__159240) : datascript.core.q.call(null,G__159239,G__159240));
})());
});
/**
 * Prepares a database assuming all pages are public unless a page has a 'public:: false'
 */
logseq.publishing.db.clean_export_BANG_ = (function logseq$publishing$db$clean_export_BANG_(db,p__159242){
var map__159243 = p__159242;
var map__159243__$1 = cljs.core.__destructure_map(map__159243);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__159243__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var remove_QMARK_ = (function (p1__159241_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["file",null,"recent",null], null), null),p1__159241_SHARP_);
});
var non_public_datom_ids = (cljs.core.truth_(db_graph_QMARK_)?logseq.publishing.db.get_db_public_false_pages(db):cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(logseq.publishing.db.get_public_false_pages(db),logseq.publishing.db.get_public_false_block_ids(db))));
var filtered_db = datascript.core.filter(db,(function (_db,datom){
var ns_SINGLEQUOTE_ = cljs.core.namespace(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom));
return (((!(remove_QMARK_(ns_SINGLEQUOTE_)))) && ((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))))) && ((!(cljs.core.contains_QMARK_(non_public_datom_ids,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom))))))));
}));
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(filtered_db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var assets = (cljs.core.truth_(db_graph_QMARK_)?logseq.publishing.db.get_db_assets(filtered_db):logseq.publishing.db.get_file_assets(db,datoms));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref((function (){var G__159244 = datoms;
var G__159245 = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
return (datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2 ? datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2(G__159244,G__159245) : datascript.core.conn_from_datoms.call(null,G__159244,G__159245));
})()),assets], null);
});
logseq.publishing.db.file_filter_only_public = (function logseq$publishing$db$file_filter_only_public(public_pages,db,datom){
var ns_SINGLEQUOTE_ = cljs.core.namespace(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom));
return (((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))))) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(ns_SINGLEQUOTE_,"file")) && ((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["block",null,"recent",null], null), null),ns_SINGLEQUOTE_)))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ns_SINGLEQUOTE_,"block")) && (((cljs.core.contains_QMARK_(public_pages,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom))) || (cljs.core.contains_QMARK_(public_pages,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__159246 = db;
var G__159247 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__159246,G__159247) : datascript.core.entity.call(null,G__159246,G__159247));
})())))))))))))));
});
logseq.publishing.db.db_filter_only_public = (function logseq$publishing$db$db_filter_only_public(public_ents,_db,datom){
return cljs.core.contains_QMARK_(public_ents,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom));
});
logseq.publishing.db.get_properties_on_nodes = (function logseq$publishing$db$get_properties_on_nodes(db,nodes){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159250 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?node","?node",-1927699885,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?a","?a",1314302913,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?node","?node",-1927699885,null),new cljs.core.Symbol(null,"?a","?a",1314302913,null),new cljs.core.Symbol(null,"?v","?v",-464183118,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"missing?","missing?",-1710383910,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?a","?a",1314302913,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160))], null)], null);
var G__159251 = db;
var G__159252 = nodes;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__159250,G__159251,G__159252) : datascript.core.q.call(null,G__159250,G__159251,G__159252));
})()));
});
logseq.publishing.db.get_property_values_on_nodes = (function logseq$publishing$db$get_property_values_on_nodes(db,nodes){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__159255 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?pv","?pv",6092876,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?node","?node",-1927699885,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?a","?a",1314302913,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?node","?node",-1927699885,null),new cljs.core.Symbol(null,"?a","?a",1314302913,null),new cljs.core.Symbol(null,"?pv","?pv",6092876,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"missing?","missing?",-1710383910,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160))], null)], null);
var G__159256 = db;
var G__159257 = nodes;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__159255,G__159256,G__159257) : datascript.core.q.call(null,G__159255,G__159256,G__159257));
})()));
});
logseq.publishing.db.get_db_public_ents = (function logseq$publishing$db$get_db_public_ents(db,public_pages){
var page_blocks = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__159258_SHARP_){
if(cljs.core.contains_QMARK_(public_pages,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p1__159258_SHARP_))){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__159258_SHARP_);
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","page","block/page",822314108))));
var public_nodes = cljs.core.into.cljs$core$IFn$_invoke$arity$2(public_pages,page_blocks);
var eavt_datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var tags = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__159259_SHARP_){
if(((cljs.core.contains_QMARK_(public_nodes,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__159259_SHARP_))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(p1__159259_SHARP_))))){
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p1__159259_SHARP_);
} else {
return null;
}
}),eavt_datoms));
var properties = logseq.publishing.db.get_properties_on_nodes(db,public_nodes);
var property_values = logseq.publishing.db.get_property_values_on_nodes(db,public_nodes);
var internal_ents = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__159260_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(p1__159260_SHARP_))) && (logseq.db.frontend.malli_schema.internal_ident_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p1__159260_SHARP_))))){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__159260_SHARP_);
} else {
return null;
}
}),eavt_datoms)),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true))));
var ents = clojure.set.union.cljs$core$IFn$_invoke$arity$variadic(internal_ents,public_pages,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_blocks,properties,property_values,tags], 0));
var temp__5804__auto___159301 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.integer_QMARK_,ents));
if(temp__5804__auto___159301){
var invalid_ents_159302 = temp__5804__auto___159301;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The following ents are invalid: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vec(invalid_ents_159302)], 0))].join(''),cljs.core.PersistentArrayMap.EMPTY);
} else {
}

return ents;
});
/**
 * Prepares a database assuming all pages are private unless a page has a 'public:: true'
 */
logseq.publishing.db.filter_only_public_pages_and_blocks = (function logseq$publishing$db$filter_only_public_pages_and_blocks(db,p__159271){
var map__159273 = p__159271;
var map__159273__$1 = cljs.core.__destructure_map(map__159273);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__159273__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var _PERCENT_ = (function (){var public_pages_STAR_ = cljs.core.seq((cljs.core.truth_(db_graph_QMARK_)?logseq.publishing.db.get_db_public_pages(db):logseq.publishing.db.get_public_pages(db)));
var public_pages = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(public_pages_STAR_),logseq.publishing.db.get_aliases_for_page_ids(db,public_pages_STAR_));
var filter_fn = (cljs.core.truth_(db_graph_QMARK_)?cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.publishing.db.db_filter_only_public,logseq.publishing.db.get_db_public_ents(db,public_pages)):cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.publishing.db.file_filter_only_public,public_pages));
var filtered_db = datascript.core.filter(db,filter_fn);
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(filtered_db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var assets = (cljs.core.truth_(db_graph_QMARK_)?logseq.publishing.db.get_db_assets(filtered_db):logseq.publishing.db.get_file_assets(db,datoms));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref((function (){var G__159276 = datoms;
var G__159277 = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
return (datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2 ? datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2(G__159276,G__159277) : datascript.core.conn_from_datoms.call(null,G__159276,G__159277));
})()),assets], null);
})();
if((!((_PERCENT_ == null)))){
} else {
throw (new Error("Assert failed: (some? %)"));
}

if(cljs.core.sequential_QMARK_(_PERCENT_)){
} else {
throw (new Error("Assert failed: (sequential? %)"));
}

return _PERCENT_;
});

//# sourceMappingURL=logseq.publishing.db.js.map
