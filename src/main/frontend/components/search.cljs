(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.handler.search :as search-handler]
            [frontend.components.block :as block]))

(rum/defc block-search-result-item
  [repo uuid format content q search-mode]
  (let [content (search-handler/sanity-search-content format content)]
    [:div
     (when (not= search-mode :page)
       [:div {:class "mb-1" :key "parents"}
        (block/breadcrumb {:id "block-search-block-parent"
                           :block? true
                           :search? true}
                          repo
                          (clojure.core/uuid uuid)
                          {:indent? false})])
     [:div {:class "font-medium" :key "content"}
      (search-handler/highlight-exact-query content q)]]))
