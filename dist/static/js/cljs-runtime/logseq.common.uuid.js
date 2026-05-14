goog.provide('logseq.common.uuid');
/**
 * 00000001-2024-0620-0000-000000000000
 * first 8 chars as type, currently only '00000001' for journal-day-page.
 * the remaining chars for data of this type
 */
logseq.common.uuid.gen_journal_page_uuid = (function logseq$common$uuid$gen_journal_page_uuid(journal_day){
if(cljs.core.pos_int_QMARK_(journal_day)){
} else {
throw (new Error("Assert failed: (pos-int? journal-day)"));
}

if(((1) > (journal_day / (100000000)))){
} else {
throw (new Error("Assert failed: (> 1 (/ journal-day 100000000))"));
}

var journal_day_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(journal_day);
var part1 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(journal_day_str,(0),(4));
var part2 = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(journal_day_str,(4),(8));
return cljs.core.uuid(["00000001","-",part1,"-",part2,"-0000-000000000000"].join(''));
});
logseq.common.uuid.fill_with_0 = (function logseq$common$uuid$fill_with_0(s,length){
var s_length = cljs.core.count(s);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.str,s,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((length - s_length),"0"));
});
/**
 * prefix-<hash-of-db-ident>-<padding-with-0>
 */
logseq.common.uuid.gen_block_uuid = (function logseq$common$uuid$gen_block_uuid(k,prefix){
var hash_num = cljs.core.str.cljs$core$IFn$_invoke$arity$1(Math.abs(cljs.core.hash(k)));
var part1 = logseq.common.uuid.fill_with_0(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(hash_num,(0),(4)),(4));
var part2 = logseq.common.uuid.fill_with_0(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(hash_num,(4),(8)),(4));
var part3 = logseq.common.uuid.fill_with_0(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(hash_num,(8),(12)),(4));
var part4 = logseq.common.uuid.fill_with_0(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(hash_num,(12)),(12));
return cljs.core.uuid([cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(part1),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(part2),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(part3),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(part4)].join(''));
});
/**
 * 00000002-<hash-of-db-ident>-<padding-with-0>
 */
logseq.common.uuid.gen_db_ident_block_uuid = (function logseq$common$uuid$gen_db_ident_block_uuid(db_ident){
if((db_ident instanceof cljs.core.Keyword)){
} else {
throw (new Error("Assert failed: (keyword? db-ident)"));
}

return logseq.common.uuid.gen_block_uuid(db_ident,"00000002");
});
/**
 * supported type:
 *   - :journal-page-uuid, 00000001
 *   - :db-ident-block-uuid, 00000002
 *   - :migrate-new-block-uuid, 00000003
 *   - :builtin-block-uuid, 00000004
 *   - :view-block-uuid, 00000006
 */
logseq.common.uuid.gen_uuid = (function logseq$common$uuid$gen_uuid(var_args){
var G__143330 = arguments.length;
switch (G__143330) {
case 0:
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0();

break;
case 2:
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0 = (function (){
return (datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null));
}));

(logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2 = (function (type_SINGLEQUOTE_,v){
if((!((v == null)))){
} else {
throw (new Error("Assert failed: (some? v)"));
}

var G__143331 = type_SINGLEQUOTE_;
var G__143331__$1 = (((G__143331 instanceof cljs.core.Keyword))?G__143331.fqn:null);
switch (G__143331__$1) {
case "journal-page-uuid":
return logseq.common.uuid.gen_journal_page_uuid(v);

break;
case "db-ident-block-uuid":
return logseq.common.uuid.gen_db_ident_block_uuid(v);

break;
case "migrate-new-block-uuid":
return logseq.common.uuid.gen_block_uuid(v,"00000003");

break;
case "builtin-block-uuid":
return logseq.common.uuid.gen_block_uuid(v,"00000004");

break;
case "view-block-uuid":
return logseq.common.uuid.gen_block_uuid(v,"00000006");

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__143331__$1)].join('')));

}
}));

(logseq.common.uuid.gen_uuid.cljs$lang$maxFixedArity = 2);

/**
 * Persistent uuid for journal template block
 */
logseq.common.uuid.gen_journal_template_block = (function logseq$common$uuid$gen_journal_template_block(journal_uuid,template_block_uuid){
if(cljs.core.uuid_QMARK_(journal_uuid)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(journal_uuid),"\n","(uuid? journal-uuid)"].join('')));
}

if(cljs.core.uuid_QMARK_(template_block_uuid)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(template_block_uuid),"\n","(uuid? template-block-uuid)"].join('')));
}

return cljs.core.uuid(["00000005","-",cljs.core.subs.cljs$core$IFn$_invoke$arity$3(cljs.core.str.cljs$core$IFn$_invoke$arity$1(journal_uuid),(9),(23)),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(template_block_uuid),(23))].join(''));
});

//# sourceMappingURL=logseq.common.uuid.js.map
