(ns frontend.components.file-based.query
  (:require [frontend.components.file-based.query-table :as query-table]
            [frontend.components.query.result :as query-result]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc query-refresh-button
  [query-time {:keys [on-pointer-down full-text-search?]}]
  (ui/tooltip
    [:a.fade-link.flex
     {:on-pointer-down on-pointer-down}
     (ui/icon "refresh" {:style {:font-size 20}})]
    [:div
     [:p
      (if full-text-search?
        [:span "Full-text search results will not be refreshed automatically."]
        [:span (str "This query takes " (int query-time) "ms to finish, it's a bit slow so that auto refresh is disabled.")])]
     [:p
      "Click the refresh button instead if you want to see the latest result."]]))

;; Custom query header only used by file graphs
(rum/defc custom-query-header
  [{:keys [dsl-query?] :as config}
   {:keys [title query] :as q}
   {:keys [collapsed? *result result table? current-block view-f page-list? query-error-atom]}]
  (let [dsl-page-query? (and dsl-query?
                             (false? (:blocks? (query-dsl/parse-query query))))
        full-text-search? (and dsl-query?
                               (string? query)
                               (re-matches #"\".*\"" query))
        query-time (:query-time (meta result))
        current-block-uuid (:block/uuid current-block)]
    [:div.th
     {:title (str "Query: " query)}
     (if dsl-query?
       [:div.flex.flex-1.flex-row
        (ui/icon "search" {:size 14})
        [:div.ml-1 (str "Live query" (when dsl-page-query? " for pages"))]]
       [:div {:style {:font-size "initial"}} title])

     (when (or (not dsl-query?) (not collapsed?))
       [:div.flex.flex-row.items-center.fade-in
        (when (> (count result) 0)
          [:span.results-count.pl-2
           (let [result-count (if (and (not table?) (map? result))
                                (apply + (map (comp count val) result))
                                (count result))]
             (str result-count (if (> result-count 1) " results" " result")))])

        (when (and current-block (not view-f) (not page-list?))
          (if table?
            [:a.flex.ml-1.fade-link {:title "Switch to list view"
                                     :on-click (fn [] (property-handler/set-block-property! (state/get-current-repo) current-block-uuid
                                                                                            :query-table
                                                                                            false))}
             (ui/icon "list" {:style {:font-size 20}})]
            [:a.flex.ml-1.fade-link {:title "Switch to table view"
                                     :on-click (fn [] (property-handler/set-block-property! (state/get-current-repo) current-block-uuid
                                                                                            :query-table
                                                                                            true))}
             (ui/icon "table" {:style {:font-size 20}})]))

        [:a.flex.ml-1.fade-link
         {:title "Setting properties"
          :on-click (fn []
                      (let [all-keys (query-table/get-all-columns-for-result result page-list?)]
                        (state/pub-event! [:modal/set-query-properties current-block all-keys])))}
         (ui/icon "settings" {:style {:font-size 20}})]

        [:div.ml-1
         (when (or full-text-search?
                   (and query-time (> query-time 50)))
           (query-refresh-button query-time {:full-text-search? full-text-search?
                                             :on-pointer-down (fn [e]
                                                                (util/stop e)
                                                                (query-result/run-custom-query config q *result query-error-atom))}))]])]))
