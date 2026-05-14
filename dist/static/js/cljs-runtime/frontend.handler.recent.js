goog.provide('frontend.handler.recent');
frontend.handler.recent.add_page_to_recent_BANG_ = (function frontend$handler$recent$add_page_to_recent_BANG_(db_id,click_from_recent_QMARK_){
if(cljs.core.truth_(db_id)){
return frontend.handler.db_based.recent.add_page_to_recent_BANG_(db_id,click_from_recent_QMARK_);
} else {
return null;
}
});
frontend.handler.recent.get_recent_pages = (function frontend$handler$recent$get_recent_pages(){
return frontend.handler.db_based.recent.get_recent_pages();
});

//# sourceMappingURL=frontend.handler.recent.js.map
