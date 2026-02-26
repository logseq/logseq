(ns frontend.components.query
  (:require [clojure.string :as string]
            [frontend.components.query.result :as query-result]
            [frontend.components.query.view :as query-view]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.extensions.sci :as sci]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [rum.core :as rum]))

(defn- built-in-custom-query?
  [title]
  (let [queries (get-in (state/sub-config) [:default-queries :journals])]
    (when (seq queries)
      (boolean (some #(= % title) (map :title queries))))))

(defn- grouped-by-page-result?
  [result group-by-page?]
  (let [first-group (first result)
        first-page (first first-group)
        first-block (first (second first-group))]
    (boolean
     (and group-by-page?
          (seq result)
          (coll? first-group)
          (or (:block/name first-page)
              (:db/id first-page))
          (:block/uuid first-block)))))

(rum/defcs custom-query-inner < rum/static
  [state {:keys [dsl-query?] :as config} {:keys [query breadcrumb-show?]}
   {:keys [query-error-atom
           current-block
           view-f
           result
           group-by-page?]}]
  (let [{:keys [->hiccup]} config
        *query-error query-error-atom
        only-blocks? (:block/uuid (first result))
        blocks-grouped-by-page? (grouped-by-page-result? result group-by-page?)]
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

         (not (:built-in-query? config))
         (when-let [query-block (:logseq.property/query current-block)]
           (when-not (string/blank? (:block/title query-block))
             (query-view/query-result (assoc config
                                             :id (str (:block/uuid current-block))
                                             :query query)
                                      current-block result)))

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
  [current-block current-block-uuid {:keys [collapsed? container-id]}]
  (let [temp-collapsed? (state/sub-block-collapsed current-block-uuid container-id)
        collapsed?' (if (some? temp-collapsed?)
                      temp-collapsed?
                      (or collapsed?
                          (:block/collapsed? current-block)))]
    collapsed?'))

(rum/defcs custom-query* < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [[config q] (:rum/args state)]
             (assoc state
                    ::result (atom nil)
                    ::collapsed? (atom (or (:collapsed? q) (:collapsed? config))))))}
  [state {:keys [*query-error dsl-query? built-in-query? table? current-block] :as config}
   {:keys [builder query view _collapsed?] :as q}]
  (let [*result (::result state)
        *collapsed? (::collapsed? state)
        collapsed? (rum/react *collapsed?)
        [k result] (query-result/run-custom-query config q *result *query-error)
        result (some->> result
                        (query-result/transform-query-result config q))
        _ (when k
            (react/set-q-collapsed! k collapsed?))
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
         (when (and dsl-query? builder) builder)

         (if built-in-query?
           [:div {:style {:margin-left 2}}
            (ui/foldable
             (query-title config (:title q) {:result-count (count result)})
             (fn []
               (custom-query-inner config q opts))
             {:default-collapsed? collapsed?
              :title-trigger? true
              :on-pointer-down #(reset! *collapsed? %)})]
           [:div.bd
            (when-not collapsed?
              (custom-query-inner config q opts))])]))))

(rum/defcs custom-query < rum/static
  {:init (fn [state]
           (assoc state :query-error (atom nil)))}
  [state {:keys [built-in-query?] :as config}
   {:keys [collapsed?] :as q}]
  (ui/catch-error
   (ui/block-error "Query Error:" {:content (:query q)})
   (let [*query-error (:query-error state)
         current-block-uuid (or (:block/uuid (:block config))
                                (:block/uuid config))
         current-block (db/entity [:block/uuid current-block-uuid])
        ;; Get query result
         collapsed?' (calculate-collapsed? current-block current-block-uuid
                                           {:collapsed? false
                                            :container-id (:container-id config)})
         built-in-collapsed? (and collapsed? built-in-query?)
         config' (assoc config
                        :current-block current-block
                        :current-block-uuid current-block-uuid
                        :collapsed? collapsed?'
                        :built-in-query? (built-in-custom-query? (:title q))
                        :*query-error *query-error)]
     (when (or built-in-collapsed? (not collapsed?'))
       (custom-query* config' q)))))
