goog.provide('logseq.db.common.entity_util');
logseq.db.common.entity_util.whiteboard_QMARK_ = (function logseq$db$common$entity_util$whiteboard_QMARK_(entity){
var or__5002__auto__ = logseq.db.frontend.entity_util.whiteboard_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.file_based.entity_util.whiteboard_QMARK_(entity);
}
});
logseq.db.common.entity_util.journal_QMARK_ = (function logseq$db$common$entity_util$journal_QMARK_(entity){
var or__5002__auto__ = logseq.db.frontend.entity_util.journal_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.file_based.entity_util.journal_QMARK_(entity);
}
});
logseq.db.common.entity_util.page_QMARK_ = (function logseq$db$common$entity_util$page_QMARK_(entity){
var or__5002__auto__ = logseq.db.frontend.entity_util.page_QMARK_(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.file_based.entity_util.page_QMARK_(entity);
}
});

//# sourceMappingURL=logseq.db.common.entity_util.js.map
