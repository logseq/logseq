(ns frontend.components.query
  (:require [clojure.string :as string]
            [frontend.components.file-based.query-table :as query-table]
            [frontend.components.file-based.query :as file-query]
            [frontend.components.query.result :as query-result]
            [frontend.components.query.view :as query-view]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.extensions.sci :as sci]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [rum.core :as rum]
            [frontend.config :as config]
            [logseq.db :as ldb]
            [frontend.hooks :as hooks]))

(defn- built-in-custom-query?
  [title]
  (let [queries (get-in (state/sub-config) [:default-queries :journals])]
    (when (seq queries)
      (boolean (some #(= % title) (map :title queries))))))

;; TODO: Split this into file and DB graph versions. DB graph needlessly coupled to file graph args
(rum/defcs custom-query-inner < rum/static
  [state {:keys [db-graph? dsl-query?] :as config} {:keys [query breadcrumb-show?]}
   {:keys [query-error-atom
           current-block
           table?
           page-list?
           view-f
           result
           group-by-page?]}]
  (let [{:keys [->hiccup ->elem inline-text page-cp map-inline]} config
        *query-error query-error-atom
        only-blocks? (:block/uuid (first result))
        blocks-grouped-by-page? (and group-by-page?
                                     (seq result)
                                     (coll? (first result))
                                     (:block/name (ffirst result))
                                     (:block/uuid (first (second (first result))))
                                     true)]
    (if @*query-error
      (do
        (log/error :exception @*query-error)
        [:div.warning.my-1 "Query failed: "
         [:p (.-message @*query-error)]])
      [:div.custom-query-results
       (cond
         (and (seq result) view-f)
         (let [result (try
                        (sci/call-fn view-f result)
                        (catch :default error
                          (log/error :custom-view-failed {:error error
                                                          :result result})
                          [:div "Custom view failed: "
                           (str error)]))]
           (util/hiccup-keywordize result))

         (and db-graph? (not (:built-in-query? config)))
         (query-view/query-result (assoc config :id (str (:block/uuid current-block)))
                                  current-block result)

         (and (not db-graph?)
              (or page-list? table?))
         (query-table/result-table config current-block result {:page? page-list?} map-inline page-cp ->elem inline-text)

         ;; Normally displays built-in-query results
         (and (seq result) (or only-blocks? blocks-grouped-by-page?))
         (->hiccup result
                   (assoc config
                          :custom-query? true
                          :current-block (:db/id current-block)
                          :dsl-query? dsl-query?
                          :query query
                          :breadcrumb-show? (if (some? breadcrumb-show?)
                                              breadcrumb-show?
                                              true)
                          :group-by-page? blocks-grouped-by-page?
                          :ref? true)
                   {:style {:margin-top "0.25rem"
                            :margin-left "0.25rem"}})

         (seq result)
         (let [result (->>
                       (for [record result]
                         (if (map? record)
                           (str (util/pp-str record) "\n")
                           record))
                       (remove nil?))]
           (when (seq result)
             [:ul
              (for [item result]
                [:li (str item)])]))

         (or (string/blank? query)
             (= query "(and)"))
         nil

         :else
         [:div.text-sm.mt-2.opacity-90 (t :search-item/no-result)])])))

(rum/defc query-title
  [config title {:keys [result-count]}]
  (let [inline-text (:inline-text config)]
    [:div.custom-query-title.flex.justify-between.w-full
     [:span.title-text (cond
                         (vector? title) title
                         (string? title) (inline-text config
                                                      (get-in config [:block :block/format] :markdown)
                                                      title)
                         :else title)]
     (when result-count
       [:span.opacity-60.text-sm.ml-2.results-count
        (str result-count (if (> result-count 1) " results" " result"))])]))

(defn- calculate-collapsed?
  [current-block current-block-uuid {:keys [collapsed?]}]
  (let [temp-collapsed? (state/sub-block-collapsed current-block-uuid)
        collapsed?' (if (some? temp-collapsed?)
                      temp-collapsed?
                      (or collapsed?
                          (:block/collapsed? current-block)))]
    collapsed?'))

(rum/defc custom-query* < rum/reactive db-mixins/query
  [{:keys [*query-error db-graph? dsl-query? built-in-query? table? current-block] :as config}
   {:keys [builder query view collapsed?] :as q}
   *result]
  (let [collapsed?' (:collapsed? config)
        result' (rum/react *result)]
    (let [result (when *result (query-result/transform-query-result config q result'))
          ;; Remove hidden pages from result
          result (if (and (coll? result) (not (map? result)))
                   (->> result
                        (remove (fn [b] (when (and (map? b) (:block/title b)) (ldb/hidden? (:block/title b)))))
                        (remove (fn [b]
                                  (when (and current-block (:db/id current-block)) (= (:db/id b) (:db/id current-block))))))
                   result)
          ;; Args for displaying query header and results
          view-fn (if (keyword? view) (get-in (state/sub-config) [:query/views view]) view)
          view-f (and view-fn (sci/eval-string (pr-str view-fn)))
          page-list? (and (seq result) (some? (:block/name (first result))))
          opts {:query-error-atom *query-error
                :current-block current-block
                :table? table?
                :view-f view-f
                :page-list? page-list?
                :result result
                :group-by-page? (query-result/get-group-by-page q {:table? table?})}]
      (if (:custom-query? config)
      ;; Don't display recursive results when query blocks are a query result
        [:code (if dsl-query? (str "Results for " (pr-str query)) "Advanced query results")]
        (when-not (and built-in-query? (empty? result))
          [:div.custom-query (get config :attr {})
           (when (and (not db-graph?) (not built-in-query?))
             (file-query/custom-query-header config
                                             q
                                             {:query-error-atom *query-error
                                              :current-block current-block
                                              :table? table?
                                              :view-f view-f
                                              :page-list? page-list?
                                              :result result
                                              :collapsed? collapsed?'}))

           (when (and dsl-query? builder) builder)

           (if built-in-query?
             [:div {:style {:margin-left 2}}
              (ui/foldable
               (query-title config (:title q) {:result-count (count result)})
               (fn []
                 (custom-query-inner config q opts))
               {:default-collapsed? collapsed?
                :title-trigger? true})]
             (when-not (:table? config)
               [:div.bd
                (when-not collapsed?'
                  (custom-query-inner config q opts))]))])))))

(rum/defc trigger-custom-query
  [config q]
  (let [[result set-result!] (rum/use-state nil)]
    (hooks/use-effect!
     (fn []
       (query-result/trigger-custom-query! config q (:*query-error config) set-result!))
     [q])
    (when (util/atom? result)
      (custom-query* config q result))))

(rum/defcs custom-query < rum/static
  {:init (fn [state]
           (let [db-graph? (config/db-based-graph? (state/get-current-repo))
                 [{:keys [dsl-query? built-in-query?] :as config}
                  {:keys [collapsed?]}] (:rum/args state)]
             ;; collapsed? not needed for db graphs
             (when (not db-graph?)
               (when-not (or built-in-query? dsl-query?)
                 (when collapsed?
                   (editor-handler/collapse-block! (or (:block/uuid (:block config))
                                                       (:block/uuid config)))))))
           (assoc state :query-error (atom nil)))}
  [state {:keys [built-in-query?] :as config}
   {:keys [query collapsed?] :as q}]
  (ui/catch-error
   (ui/block-error "Query Error:" {:content (:query q)})
   (let [*query-error (:query-error state)
         db-graph? (config/db-based-graph? (state/get-current-repo))
         current-block-uuid (or (:block/uuid (:block config))
                                (:block/uuid config))
         current-block (db/entity [:block/uuid current-block-uuid])
        ;; Get query result
         collapsed?' (calculate-collapsed? current-block current-block-uuid {:collapsed? (if-not db-graph? collapsed? false)})
         built-in-collapsed? (and collapsed? built-in-query?)
         table? (when-not db-graph?
                  (or (get-in current-block [:block/properties :query-table])
                      (and (string? query) (string/ends-with? (string/trim query) "table"))))
         config' (assoc config
                        :db-graph? db-graph?
                        :current-block current-block
                        :current-block-uuid current-block-uuid
                        :collapsed? collapsed?'
                        :table? table?
                        :built-in-query? (built-in-custom-query? (:title q))
                        :*query-error *query-error)]
     (when (or built-in-collapsed? (not db-graph?) (not collapsed?'))
       (trigger-custom-query config' q)))))
